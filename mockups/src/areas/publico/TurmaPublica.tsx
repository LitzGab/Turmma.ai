import { useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Aviso, Botao, Busca, CampoSenha, CampoTexto, Dialogo, Opcao } from '@/components/duo'
import { acessos, pedidos, useLista } from '@/dados/acesso'
import { nomeDaTurma, turmaPorId } from '@/dados/demo/turmas-base'
import { useTurmaDaEscola } from '@/dados/escola-estado'
import {
  CanalDaEscola, CascaPublica, EscolaInexistente, SeloCerto, Titulo, Voltar, classeDoLink, escolaPublica, semAcento, useHashUmaVez, useTituloDaAba,
  type EscolaPublica,
} from './_casca'

/* O PRIMEIRO ACESSO DO ALUNO (`/e/<escola>/turma`), uma coisa por vez:
   1. o CÓDIGO da turma, que vale pelo estado (`acessos.turmaDoCodigo`: o 2ºB K7M2QX9B; a 3ºA quando o professor gerar).
      Com `?codigo=` ou `#código` (o link que o professor manda), esta tela some e vira a linha "3ºA · Colégio Aurora";
   2. o NOME entre os livres da lista, a MATRÍCULA (obrigatória, com a dica da carteirinha, decisão do dono) e a senha
      → `pedidos.pedir`, que vai à fila do professor da turma (ou da coordenação, se a turma não tem professor);
   3. PRONTO, sem botão de ida: a entrada responderia "esperando" até uma pessoa da escola aprovar (D4).
   Nada do pedido aparece no fim (nem nome, nem matrícula): o próximo aluno pode usar o mesmo computador. */

type Etapa = 'codigo' | 'nome' | 'pronto'

const normalizar = (c: string) => c.replace(/[\s-]+/g, '').toUpperCase()
/** O 9ºA de código "9a" é da E. M. Rio Cachoeira; as outras turmas são do Colégio Aurora. */
const escolaDaTurma = (turmaId: string) => (turmaPorId(turmaId) ? 'colegio-aurora' : 'rio-cachoeira')
const turmaDoCodigoNaEscola = (codigo: string, slug: string) => {
  const t = acessos.turmaDoCodigo(codigo)
  return t && escolaDaTurma(t) === slug ? t : null
}

export function TurmaPublica() {
  const { escola: slug } = useParams()
  const escola = escolaPublica(slug)
  const local = useLocation()
  const hash = useHashUmaVez()
  useTituloDaAba(`Entrar na turma · ${escola?.nome ?? 'Turmma'}`)

  // O código pode vir no endereço: `?codigo=K7M2QX9B` ou `#K7M2QX9B` (o token do link também vale).
  const [doLink] = useState(() => new URLSearchParams(local.search).get('codigo') ?? hash)
  const [turmaId, setTurmaId] = useState<string | null>(() => (doLink && escola ? turmaDoCodigoNaEscola(doLink, escola.slug) : null))
  const [veioDoLink] = useState(() => !!turmaId)
  const [etapa, setEtapa] = useState<Etapa>(turmaId ? 'nome' : 'codigo')
  // quem confirma é o professor da turma; sem professor confirmado, a coordenação (decisão do dono)
  const turmaViva = useTurmaDaEscola(turmaId ?? '')
  const comProfessor = !!turmaViva?.professores.some((p) => p.estado === 'confirmado')

  if (!escola) return <EscolaInexistente />

  return (
    <CascaPublica rodape={`${escola.nome} · ${escola.cidade}`} canal={<CanalDaEscola escola={escola} />}>
      {etapa === 'codigo' && (
        <EtapaCodigo escola={escola} inicial={veioDoLink ? '' : doLink}
          aoAbrir={(t) => { setTurmaId(t); setEtapa('nome') }} />
      )}
      {etapa === 'nome' && turmaId && (
        <EtapaNome escola={escola} turmaId={turmaId} aoVoltar={veioDoLink ? undefined : () => setEtapa('codigo')}
          aoPedir={() => setEtapa('pronto')} />
      )}
      {etapa === 'pronto' && (
        <div className="animate-entra">
          <SeloCerto />
          <Titulo titulo={comProfessor ? 'Pronto! Seu professor vai confirmar que é você.' : 'Pronto! A escola vai confirmar que é você.'} />
          <p className="t-apoio mt-8"><Link to={`/e/${escola.slug}`} className={classeDoLink}>Entrar</Link></p>
        </div>
      )}
    </CascaPublica>
  )
}

/* ── 1. O código ──────────────────────────────────────────────────────────────────────────────────────── */

function EtapaCodigo({ escola, inicial, aoAbrir }: { escola: EscolaPublica; inicial: string; aoAbrir: (turmaId: string) => void }) {
  const limpo = normalizar(inicial)
  const [codigo, setCodigo] = useState(limpo.length === 8 ? `${limpo.slice(0, 4)} ${limpo.slice(4)}` : limpo)
  // um código que veio no link e não vale já chega com o erro
  const [erro, setErro] = useState(limpo ? 'Código não encontrado. Confira com o professor.' : '')

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const c = normalizar(codigo)
    if (!c) { setErro('Digite o código que o professor mostrou.'); return }
    const t = turmaDoCodigoNaEscola(c, escola.slug)
    if (t) aoAbrir(t)
    else setErro('Código não encontrado. Confira com o professor.')
  }

  return (
    <div className="animate-entra">
      <Voltar para={`/e/${escola.slug}`}>{escola.nome}</Voltar>
      <Titulo titulo="Digite o código da turma" />
      <form className="mt-6 grid gap-5" onSubmit={enviar} noValidate>
        <CampoTexto rotulo="Código" valor={codigo} placeholder="AB12 CD34" maxLength={12} erro={erro}
          dica="Está no quadro ou no link do professor."
          aoMudar={(v) => { setCodigo(v.toUpperCase()); if (erro) setErro('') }}
          autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} autoFocus
          style={{ letterSpacing: '.12em' }} />
        <Botao type="submit" largura="cheia">Continuar</Botao>
      </form>
      <p className="t-apoio mt-6">Já tem senha? <Link to={`/e/${escola.slug}`} className={classeDoLink}>Entrar</Link></p>
    </div>
  )
}

/* ── 2. Nome, matrícula e senha ───────────────────────────────────────────────────────────────────────── */

function EtapaNome({ escola, turmaId, aoPedir, aoVoltar }: {
  escola: EscolaPublica; turmaId: string; aoPedir: () => void; aoVoltar?: () => void
}) {
  const lista = useLista(turmaId)
  // de A a Z, como na coordenação (a lista colada pode vir em qualquer ordem)
  const livres = useMemo(() => lista.filter((n) => n.estado === 'livre').sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')), [lista])
  const [filtro, setFiltro] = useState('')
  const [nome, setNome] = useState('')
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<{ nome?: string; matricula?: string; senha?: string; resposta?: string }>({})
  const [privacidade, setPrivacidade] = useState(false)
  const turma = nomeDaTurma(turmaId)
  const linha = `${turma} · ${escola.nome}`

  const vistos = useMemo(() => {
    const f = semAcento(filtro)
    return f ? livres.filter((n) => semAcento(n.nome).includes(f) || n.id === nome) : livres
  }, [livres, filtro, nome])

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!nome) novos.nome = 'Escolha o seu nome.'
    if (!matricula.trim()) novos.matricula = 'Digite a sua matrícula.'
    if (senha.length < 8) novos.senha = senha ? 'Use 8 ou mais letras ou números.' : 'Crie uma senha.'
    setErros(novos)
    if (Object.keys(novos).length) return
    const r = pedidos.pedir({ turmaId, nomeId: nome, matricula, senha })
    if (r === 'ok') { aoPedir(); return }
    setSenha('')
    if (r === 'ja-pedido') { setNome(''); setErros({ resposta: 'Este nome já foi pedido. Chame o professor.' }); return }
    setErros({ resposta: 'Nome e matrícula não conferem. Peça ajuda ao professor.' })
  }

  const topo = aoVoltar
    ? <Voltar aoVoltar={aoVoltar}>{linha}</Voltar>
    : <p className="mb-3 text-[15px] font-bold leading-9 text-apoio">{linha}</p>

  if (!lista.length) {
    return (
      <div className="animate-entra">
        {topo}
        <Titulo titulo="Qual é o seu nome?" />
        <Aviso tom="atencao" className="mt-6">A lista desta turma ainda não chegou. Fale com o professor.</Aviso>
      </div>
    )
  }

  return (
    <div className="animate-entra">
      {topo}
      <Titulo titulo="Qual é o seu nome?" />
      <form className="mt-5 grid gap-4" onSubmit={enviar} noValidate>
        <fieldset className="grid min-w-0 gap-2">
          <legend className="sr-only">Escolha o seu nome</legend>
          {livres.length > 6 && <Busca valor={filtro} aoMudar={setFiltro} rotulo="Procure seu nome" className="sm:w-full" />}
          {livres.length > 0 ? (
            <div role="radiogroup" aria-label="Os nomes da turma" className="-mx-1 grid max-h-[232px] gap-2 overflow-y-auto px-1 pb-1 pt-0.5">
              {vistos.map((n) => (
                <Opcao key={n.id} nome="nome-da-lista" valor={n.id} marcado={nome === n.id}
                  aoMudar={() => { setNome(n.id); setErros((x) => ({ ...x, nome: undefined, resposta: undefined })) }}>
                  {n.nome}
                </Opcao>
              ))}
              {!vistos.length && <p className="t-apoio px-1 py-2">Nenhum nome com “{filtro}”.</p>}
            </div>
          ) : (
            <Aviso tom="info">Todos os nomes desta turma já foram pedidos.</Aviso>
          )}
          {erros.nome
            ? <p role="alert" className="text-[15px] font-bold leading-5 text-vermelho-texto">{erros.nome}</p>
            : <p className="t-apoio">Seu nome não está aqui? Chame o professor.</p>}
        </fieldset>

        <CampoTexto rotulo="Matrícula" valor={matricula} inputMode="numeric" autoComplete="off" autoCorrect="off" spellCheck={false}
          placeholder="2026-0000" erro={erros.matricula} dica="Está na carteirinha. Não sabe? Peça ao professor."
          aoMudar={(v) => { setMatricula(v); setErros((x) => ({ ...x, matricula: undefined, resposta: undefined })) }} />
        <CampoSenha rotulo="Crie uma senha" valor={senha} autoComplete="new-password" placeholder="8 ou mais letras ou números"
          erro={erros.senha} aoMudar={(v) => { setSenha(v); setErros((x) => ({ ...x, senha: undefined })) }} />

        {erros.resposta && <Aviso tom="erro">{erros.resposta}</Aviso>}
        <p className="t-apoio">
          Seus dados: nome e matrícula, só para a escola.{' '}
          <button type="button" className={classeDoLink} onClick={() => setPrivacidade(true)}>Como usamos</button>
        </p>
        <Botao type="submit" largura="cheia" disabled={!livres.length}>Pedir para entrar</Botao>
      </form>

      {/* a mesma linha das telas de convite, para quem tem de 11 a 17 anos (LGPD, arts. 9º e 14 — lei) */}
      <Dialogo aberto={privacidade} aoMudar={setPrivacidade} titulo="Como usamos seus dados" largura={460}
        rodape={<Botao variante="secundario" onClick={() => setPrivacidade(false)}>Entendi</Botao>}>
        <ul className="t-corpo grid gap-3 text-apoio">
          <li><b className="text-tinta">Quem cuida:</b> {escola.nome}. A Turmma opera para a escola.</li>
          <li><b className="text-tinta">O que guardamos:</b> seu nome, sua matrícula e sua turma.</li>
          <li><b className="text-tinta">Para quê:</b> o professor saber que é você e aprovar a sua entrada.</li>
          <li><b className="text-tinta">Não treina IA.</b> Você ou sua família podem pedir para ver, corrigir ou apagar.</li>
        </ul>
      </Dialogo>
    </div>
  )
}
