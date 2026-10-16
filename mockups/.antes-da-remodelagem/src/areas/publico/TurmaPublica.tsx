import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import { Button } from '@/components/ui/button'
import { CODIGO_DO_2B, ESCOLA_SLUG, TEXTO_DO_PEDIDO_ENVIADO, listaDa, nomesLivresDa, turmaDaEscola } from '@/dados/estrutura'
import { cn } from '@/lib/utils'
import { Aviso, Campo, CampoSenha, CascaPublica, EscolaInexistente, Titulo, classeDoLink, useTituloDaAba } from './_casca'

/* A página pública da turma (`/e/<escola>/turma`): o aluno pede o próprio nome, sem e-mail, e uma pessoa aprova
   (do produto real). Três etapas na mesma página: o código, a turma aberta (escolher o nome, matrícula, senha) e o
   pedido enviado. Quem chega pelo link do professor (`#token`) pula o código; o `#` sai da barra ao abrir, para o
   token não ficar no histórico. Nada fala com servidor: o código do 2ºB abre a turma, o resto é estado local. */

const TURMA_ID = '2b'
const ESCOLA_NOME = 'Colégio Aurora'
const ESPERA_MS = 600

type Etapa = 'codigo' | 'turma' | 'enviado'

const normalizarCodigo = (c: string) => c.replace(/\s+/g, '').toUpperCase()

/* A matrícula confere quando é a da lista para aquele nome (no 2ºB: Fernanda Paz 2026-0442, Giovana Teles 2026-0444,
   Kauã Ribeiro 2026-0450). Para a apresentação seguir sem cola, aceitamos também qualquer matrícula no formato
   `2026-0` + 3 algarismos que não seja de OUTRO aluno da lista. Digitar a do Lucas Pereira (2026-0412, já aprovado)
   com outro nome dá o erro, que não diz qual dos dois errou. No produto real a conferência é só contra a lista. */
function matriculaConfere(nomeId: string, matricula: string) {
  const lista = listaDa(TURMA_ID)
  const m = matricula.trim()
  const doNome = lista.find((n) => n.id === nomeId)
  if (doNome && doNome.matricula === m) return true
  const deOutro = lista.some((n) => n.id !== nomeId && n.matricula === m)
  return /^2026-0\d{3}$/.test(m) && !deOutro
}

export function TurmaPublica() {
  const { escola } = useParams()
  const local = useLocation()
  const navegar = useNavigate()
  useTituloDaAba('Entrar na turma')

  // Quem abre o link do professor já chega com o token: pula o código.
  const [etapa, setEtapa] = useState<Etapa>(() => (local.hash.length > 1 ? 'turma' : 'codigo'))
  // Os nomes pedidos nesta sessão deixam de ser livres (no produto, viram "pedido esperando a decisão").
  const [pedidos, setPedidos] = useState<string[]>([])

  // Apaga o `#token` da barra (e do histórico) assim que a página abre.
  useEffect(() => {
    if (local.hash) navegar({ pathname: local.pathname, search: local.search }, { replace: true })
  }, [local.hash, local.pathname, local.search, navegar])

  if (escola !== ESCOLA_SLUG) return <EscolaInexistente />

  return (
    <CascaPublica rodape="Colégio Aurora · Joinville, SC">
      {etapa === 'codigo' && <EtapaCodigo aoAbrir={() => setEtapa('turma')} />}
      {etapa === 'turma' && (
        <EtapaTurma pedidos={pedidos} aoEnviar={(id) => { setPedidos((p) => [...p, id]); setEtapa('enviado') }}
          aoTrocarCodigo={() => setEtapa('codigo')} />
      )}
      {etapa === 'enviado' && <EtapaEnviado aoVoltar={() => setEtapa('turma')} />}
    </CascaPublica>
  )
}

/* ── 1. O código da turma ─────────────────────────────────────────────────────────────────────────────── */

function EtapaCodigo({ aoAbrir }: { aoAbrir: () => void }) {
  const [codigo, setCodigo] = useState('')
  const [erro, setErro] = useState('')
  const [abrindo, setAbrindo] = useState(false)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const c = normalizarCodigo(codigo)
    if (!c) { setErro('Digite o código da turma que o professor mostrou.'); return }
    setErro('')
    setAbrindo(true)
    timer.current = window.setTimeout(() => {
      setAbrindo(false)
      if (c === CODIGO_DO_2B) aoAbrir()
      else setErro('Não encontramos turma com este código. Confira com o professor: ele pode ter gerado um código novo.')
    }, ESPERA_MS)
  }

  return (
    <div className="animate-entra">
      <Titulo titulo="Entrar na turma" linha="Digite o código da turma que o professor mostrou." />
      <form className="mt-7 grid gap-5" onSubmit={enviar} noValidate>
        <Campo rotulo="Código da turma" value={codigo} placeholder="Ex.: K7M2 QX9B" maxLength={12}
          onChange={(e) => { setCodigo(e.target.value.toUpperCase()); if (erro) setErro('') }}
          autoCapitalize="characters" autoCorrect="off" autoComplete="off" spellCheck={false} autoFocus
          className="font-medium tracking-[0.08em] placeholder:font-normal placeholder:tracking-normal"
          erro={erro} dica="São 8 letras e números. Pode digitar com ou sem o espaço do meio." />
        <Button type="submit" className="h-12 w-full" disabled={abrindo}>{abrindo ? 'Abrindo…' : 'Abrir a turma'}</Button>
      </form>
      <p className="mt-8 text-[15px] leading-snug text-sutil">
        Já tem o nome aprovado? <Link to={`/e/${ESCOLA_SLUG}`} className={classeDoLink}>Entre pela escola</Link>
      </p>
    </div>
  )
}

/* ── 2. A turma aberta: escolher o nome, informar a matrícula e criar a senha ─────────────────────────── */

function EtapaTurma({ pedidos, aoEnviar, aoTrocarCodigo }: {
  pedidos: string[]; aoEnviar: (nomeId: string) => void; aoTrocarCodigo: () => void
}) {
  const turma = turmaDaEscola(TURMA_ID)
  const livres = nomesLivresDa(TURMA_ID).filter((n) => !pedidos.includes(n.id))
  const [nome, setNome] = useState('')
  const [matricula, setMatricula] = useState('')
  const [senha, setSenha] = useState('')
  const [erros, setErros] = useState<{ nome?: string; matricula?: string; senha?: string; conferencia?: string }>({})
  const [enviando, setEnviando] = useState(false)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const enviar = (e: React.FormEvent) => {
    e.preventDefault()
    const novos: typeof erros = {}
    if (!nome) novos.nome = 'Escolha o seu nome na lista.'
    if (!matricula.trim()) novos.matricula = 'Digite a sua matrícula.'
    if (senha.length < 8) novos.senha = senha ? 'A senha precisa de pelo menos 8 caracteres.' : 'Crie uma senha.'
    setErros(novos)
    if (Object.keys(novos).length) return
    setEnviando(true)
    timer.current = window.setTimeout(() => {
      setEnviando(false)
      if (matriculaConfere(nome, matricula)) { aoEnviar(nome); return }
      // Não diz qual dos dois errou, e a senha digitada é apagada.
      setSenha('')
      setErros({ conferencia: 'O nome e a matrícula não conferem. Confira a matrícula com o professor ou a secretaria.' })
    }, ESPERA_MS)
  }

  return (
    <div className="animate-entra">
      <Titulo titulo={<>Turma {turma?.nome} · {ESCOLA_NOME}</>} />
      <form className="mt-6 grid gap-5" onSubmit={enviar} noValidate>
        <fieldset className="grid gap-2" aria-describedby="nomes-nota">
          <legend className="mb-1.5 pl-1 text-[13px] font-medium text-sutil">Escolha o seu nome</legend>
          {livres.length > 0 ? (
            <RadioGroupPrimitive.Root value={nome} onValueChange={(v) => { setNome(v); setErros((x) => ({ ...x, nome: undefined, conferencia: undefined })) }}
              aria-label="Escolha o seu nome" className="grid max-h-[188px] gap-2 overflow-y-auto">
              {livres.map((n) => (
                <RadioGroupPrimitive.Item key={n.id} value={n.id}
                  className={cn('flex h-12 shrink-0 items-center gap-3 rounded-controle border bg-superficie px-4 text-left text-base text-tinta transition-colors',
                    'hover:bg-realce-suave focus-visible:outline-2 focus-visible:outline-noite',
                    nome === n.id ? 'border-tinta' : erros.nome ? 'border-erro' : 'border-borda-campo')}>
                  <span className={cn('grid size-[18px] shrink-0 place-items-center rounded-full border-[1.5px]', nome === n.id ? 'border-tinta' : 'border-borda-campo')}>
                    <RadioGroupPrimitive.Indicator className="size-2.5 rounded-full bg-tinta" />
                  </span>
                  {n.nome}
                </RadioGroupPrimitive.Item>
              ))}
            </RadioGroupPrimitive.Root>
          ) : (
            <p className="rounded-controle bg-realce-suave px-4 py-3 text-[15px] text-sutil">Todos os nomes livres desta turma já foram pedidos.</p>
          )}
          <p id="nomes-nota" className={cn('pl-1 text-[13px] leading-snug', erros.nome ? 'text-erro' : 'text-sutil')}>
            {erros.nome ?? 'Se o seu nome não aparece, chame o professor.'}
          </p>
        </fieldset>

        <Campo rotulo="Matrícula" value={matricula} inputMode="numeric" autoComplete="off" autoCorrect="off" spellCheck={false}
          onChange={(e) => { setMatricula(e.target.value); setErros((x) => ({ ...x, matricula: undefined, conferencia: undefined })) }}
          erro={erros.matricula} />
        <CampoSenha rotulo="Crie uma senha" value={senha} autoComplete="new-password"
          onChange={(e) => { setSenha(e.target.value); setErros((x) => ({ ...x, senha: undefined })) }}
          erro={erros.senha} dica="Pelo menos 8 caracteres. Use uma frase que só você saiba: é com ela e com a matrícula que você vai entrar." />

        {erros.conferencia && <Aviso tipo="erro">{erros.conferencia}</Aviso>}
        <Button type="submit" className="h-12 w-full" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar pedido'}</Button>
      </form>
      <div className="mt-4 flex flex-col items-start gap-3">
        <Button variant="discreto" size="sm" className="-ml-3.5" onClick={aoTrocarCodigo}>Não é a sua turma? Usar outro código</Button>
        <p className="pl-1 text-[13px] text-inativo">O Turmma não pede e-mail, telefone, CPF nem foto de aluno.</p>
      </div>
    </div>
  )
}

/* ── 3. Pedido enviado. Nada do pedido aparece (nem nome, nem matrícula): o próximo aluno pode usar o mesmo
      computador da escola. ─────────────────────────────────────────────────────────────────────────────── */

function EtapaEnviado({ aoVoltar }: { aoVoltar: () => void }) {
  const navegar = useNavigate()
  return (
    <div className="animate-entra">
      <Titulo titulo="Pedido enviado" />
      <div className="mt-6 grid gap-4 text-base leading-relaxed text-apoio">
        <p>{TEXTO_DO_PEDIDO_ENVIADO.agora}</p>
        <Aviso tipo="pendente">{TEXTO_DO_PEDIDO_ENVIADO.ate}</Aviso>
        <p>{TEXTO_DO_PEDIDO_ENVIADO.recusa}</p>
      </div>
      <div className="mt-8 grid gap-2.5">
        <Button className="h-12 w-full" onClick={() => navegar(`/e/${ESCOLA_SLUG}`)}>Ir para a entrada da escola</Button>
        <Button variant="secundario" className="h-12 w-full" onClick={aoVoltar}>Voltar à lista de nomes</Button>
      </div>
    </div>
  )
}
