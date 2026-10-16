import { useState, type FormEvent, type ReactNode } from 'react'
import { Check, Copy, Link2, Plus } from 'lucide-react'
import {
  Aviso, Avatar, Botao, Busca, CampoTexto, Cartao, Dialogo, DialogoConfirmar, FaixaResultado, MenuMais, Selo, SeloTurma, Toque,
  type ItemMenuMais,
} from '@/components/duo'
import { PainelLado } from '@/components/turmma/painel-lado'
import { useParametro } from '@/components/turmma/tela'
import { DISCIPLINAS, NOME_DA_CONTESTACAO, PROFESSORES, TOTAL_DE_PROFESSORES } from '@/dados/estrutura'
import {
  alocacoes, convites, useAlocacoes, useProfessoresDaEscola, useTurmasDaEscola,
  type AlocacaoEstado, type ProfessorEstado,
} from '@/dados/escola-estado'
import { Escolha, linkAbsoluto, linkDeTela, porSerie, semAcento, TabelaGrade, useCopiar, type ColunaGrade } from './_estrutura-pecas'

/* PROFESSORES (12ª rodada, 04/10/2026; plano 5.3), a segunda aba de Escola. A alocação mora aqui.
   · CONVIDAR PROFESSOR é UM diálogo: nome, e-mail, disciplina e turmas → GERAR CONVITE → o link aparece uma vez
     (regra 20, item 8). O professor entra na lista com CONVITE EM ABERTO, e as turmas nascem pendentes (D3).
   · A tabela (linhas de 56; 14ª rodada): Nome · Disciplinas · Turmas · Situação, o selo à direita. Os 31 numa tabela
     só, rolando por dentro: os da conta abrem ao lado; os 24 que vêm da grade horária são só leitura (sem ›).
   · O painel (?prof=): as turmas e o estado de cada uma; CORRIGIR TURMA (já sugerindo a que ele escreveu) e REFAZER
     CONVITE; no ⋯, Acrescentar turma · Revogar · Encerrar vínculo. Corrigir o Paulo e refazer o convite do Jonas tiram
     os itens da fila do Início, porque a fila é uma vista da base (dados/fila.ts). */

type Situacao = { texto: string; familia: 'verde' | 'amarelo' | 'vermelho' | 'neutro' }
function situacaoDe(p: ProfessorEstado, dele: AlocacaoEstado[]): Situacao {
  if (p.estado === 'revogado') return { texto: 'Revogado', familia: 'neutro' }
  if (p.estado === 'desativado') return { texto: 'Vínculo encerrado', familia: 'neutro' }
  if (dele.some((a) => a.estado === 'contestado')) return { texto: 'Contestou a turma', familia: 'vermelho' }
  if (p.estado === 'vencido') return { texto: 'Convite vencido', familia: 'vermelho' }
  if (p.estado === 'pendente') return { texto: 'Convite em aberto', familia: 'amarelo' }
  if (dele.some((a) => a.estado === 'pendente')) return { texto: 'Falta confirmar', familia: 'amarelo' }
  return { texto: 'Ativo', familia: 'verde' }
}
const ESTADO_DA_TURMA = {
  confirmado: { texto: 'Confirmou', familia: 'verde' },
  pendente: { texto: 'Falta confirmar', familia: 'amarelo' },
  contestado: { texto: 'Contestou', familia: 'vermelho' },
  encerrado: { texto: 'Encerrada', familia: 'neutro' },
} as const
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const unicos = (l: string[]) => [...new Set(l)]
const DISCIPLINAS_OPCOES = DISCIPLINAS.map((d) => ({ valor: d, rotulo: d }))
/** "A Camila confirma pelo sino." */
const confirmaNoInicio = (p: ProfessorEstado) => `${p.tratamento === 'professor' ? 'O' : 'A'} ${p.nome.split(' ')[0]} confirma pelo sino.`

type LinhaProfessor = { id: string; nome: string; disciplinas: string; turmas: string[]; selo: ReactNode; abre: boolean }

/** Os professores que vêm da grade horária (fora da demonstração): nome, disciplina e duas turmas, sempre os mesmos. */
const NOMES_DA_GRADE = [
  'Adriana Kühl', 'Bruno Schmitt', 'Carla Wendt', 'Diego Ramos', 'Elisa Krüger', 'Fábio Moretti', 'Gisele Duarte', 'Henrique Lenz',
  'Isabel Prestes', 'João Weber', 'Karina Bauer', 'Leandro Costa', 'Mariana Hoffmann', 'Nelson Pires', 'Olívia Ramalho', 'Patrícia Zimmer',
  'Rodrigo Fischer', 'Simone Albuquerque', 'Tiago Becker', 'Úrsula Vieira', 'Vanessa Koch', 'Wagner Lima', 'Yara Schulz', 'Zeca Martins',
]
function daGrade(turmas: string[]): Omit<LinhaProfessor, 'selo' | 'abre'>[] {
  const n = TOTAL_DE_PROFESSORES - PROFESSORES.length
  return NOMES_DA_GRADE.slice(0, n).map((nome, i) => ({
    id: `grade-${i}`, nome, disciplinas: DISCIPLINAS[i % DISCIPLINAS.length],
    turmas: turmas.length ? unicos([turmas[(i * 3) % turmas.length], turmas[(i * 3 + 5) % turmas.length]]) : [],
  }))
}

export function Professores() {
  const lista = useProfessoresDaEscola()
  const alocs = useAlocacoes()
  const [busca, setBusca] = useState('')
  const [prof, setProf] = useParametro('prof')
  const [convidando, setConvidando] = useState(false)

  const ativas = (id: string) => alocs.filter((a) => a.professorId === id && a.estado !== 'encerrado')
  // os que nasceram na demonstração vêm primeiro: é onde a coordenadora acabou de mexer
  const ordenada = [...lista.filter((p) => p.criado).reverse(), ...lista.filter((p) => !p.criado)]
  const visiveis = ordenada.filter((p) => !busca.trim() || semAcento(p.nome).includes(semAcento(busca)))
  const aberto = lista.find((p) => p.id === prof) ?? null

  const turmasDe = (p: ProfessorEstado) => unicos(ativas(p.id).map((a) => a.turma))
  const disciplinasDe = (p: ProfessorEstado) => unicos(ativas(p.id).map((a) => a.disciplina)).join(', ') || p.disciplinas
  const seloDe = (p: ProfessorEstado) => { const s = situacaoDe(p, ativas(p.id)); return <Selo familia={s.familia} tamanho="p">{s.texto}</Selo> }

  // os 31 numa tabela só: os da conta (abrem ao lado) e os que vêm da grade horária (só leitura)
  const turmas = useTurmasDaEscola()
  const linhas: LinhaProfessor[] = [
    ...visiveis.map((p) => ({ id: p.id, nome: p.nome, disciplinas: disciplinasDe(p), turmas: turmasDe(p), selo: seloDe(p), abre: true })),
    ...daGrade(turmas.map((t) => t.nome)).filter((p) => !busca.trim() || semAcento(p.nome).includes(semAcento(busca)))
      .map((p) => ({ ...p, selo: <Selo familia="verde" tamanho="p">Ativo</Selo>, abre: false })),
  ]
  const colunas: ColunaGrade<LinhaProfessor>[] = [
    { titulo: 'Nome', largura: 'minmax(0,2fr)', celula: (p) => <span className="flex min-w-0 items-center gap-3"><Avatar nome={p.nome} tamanho={32} /><b className="truncate font-bold">{p.nome}</b></span> },
    { titulo: 'Disciplinas', largura: 'minmax(0,1.2fr)', celula: (p) => <span className="truncate text-apoio">{p.disciplinas}</span> },
    { titulo: 'Turmas', largura: 'minmax(0,1.6fr)', celula: (p) => (
      p.turmas.length ? <span className="flex min-w-0 gap-1.5 overflow-hidden">{p.turmas.map((t) => <SeloTurma key={t} turma={t} tamanho="p" />)}</span> : <span className="text-sutil">—</span>
    ) },
    { titulo: 'Situação', largura: '176px', alinhar: 'fim', celula: (p) => p.selo },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 max-md:overflow-y-auto">
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        <Busca valor={busca} aoMudar={setBusca} rotulo="Buscar professor" className="min-w-0 flex-1 sm:w-72 sm:flex-none" />
        <p className="t-apoio max-sm:hidden"><b className="font-bold tabular-nums text-tinta">{linhas.length}</b> professores</p>
        <Botao tamanho="m" icone={<Plus strokeWidth={2.5} />} className="ml-auto max-sm:w-full" onClick={() => setConvidando(true)}>Convidar professor</Botao>
      </div>
      <TabelaGrade rotulo="Professores" colunas={colunas} grupos={[{ id: 'todos', linhas }]} chave={(p) => p.id} altura={56}
        aoAbrir={(p) => setProf(p.id)} podeAbrir={(p) => p.abre} ativa={prof} vazio="Nenhum professor com este nome."
        celular={(p) => ({ inicio: <Avatar nome={p.nome} tamanho={32} />, titulo: p.nome, apoio: [p.disciplinas, p.turmas.join(', ')].filter(Boolean).join(' · '), fim: p.selo })} />

      <PainelProfessor key={aberto?.id ?? 'nenhum'} professor={aberto} dele={aberto ? ativas(aberto.id) : []} aoFechar={() => setProf(null)} />
      <DialogoConvidar aberto={convidando} aoFechar={() => setConvidando(false)} />
    </div>
  )
}

/* ── O professor, ao lado ──────────────────────────────────────────────────────────────────────────────── */

type Alocar = { modo: 'corrigir' | 'acrescentar'; alocId?: string; turmaId: string; disciplina: string }

function PainelProfessor({ professor: p, dele, aoFechar }: { professor: ProfessorEstado | null; dele: AlocacaoEstado[]; aoFechar: () => void }) {
  const turmas = useTurmasDaEscola()
  const [alocar, setAlocar] = useState<Alocar | null>(null)
  const [link, setLink] = useState<string | null>(null)
  const [confirmar, setConfirmar] = useState<'revogar' | 'encerrar' | null>(null)
  const [feito, setFeito] = useState<string | null>(null)
  if (!p) return <PainelLado aberto={false} aoFechar={aoFechar} titulo=""><span /></PainelLado>

  const convite = p.estado === 'pendente' || p.estado === 'vencido'
  const fora = p.estado === 'revogado' || p.estado === 'desativado'
  const contestada = dele.find((a) => a.estado === 'contestado')
  const s = situacaoDe(p, dele)

  const abrirCorrecao = () => {
    const base = contestada ?? dele[0]
    if (!base) return setAlocar({ modo: 'acrescentar', turmaId: '', disciplina: p.disciplina })
    // a turma que o professor escreveu ("Dou Química no 3ºB.") já vem escolhida
    const dita = base.contestacao?.complemento?.match(/\d+º\s?[A-Z]/)?.[0]?.replace(/\s/, '')
    const sugerida = dita && dita !== base.turma ? turmas.find((t) => t.nome === dita)?.id : undefined
    setAlocar({ modo: 'corrigir', alocId: base.id, turmaId: sugerida ?? base.turmaId, disciplina: base.disciplina })
  }
  const refazer = () => { setLink(linkAbsoluto(convites.refazer(p.id).link)); setFeito(null) }
  const menu: ItemMenuMais[] = fora ? [] : [
    { rotulo: 'Acrescentar turma', aoEscolher: () => setAlocar({ modo: 'acrescentar', turmaId: '', disciplina: p.disciplina }) },
    ...(convite ? [{ rotulo: 'Revogar convite', perigo: true, aoEscolher: () => setConfirmar('revogar') }] : []),
    { rotulo: 'Encerrar vínculo', perigo: true, aoEscolher: () => setConfirmar('encerrar') },
  ]

  return (
    <>
      <PainelLado aberto aoFechar={aoFechar} titulo={p.nome}
        rodape={!fora && (
          <>
            <MenuMais itens={menu} rotulo="Mais sobre o professor" lado="top" alinhar="start" />
            <span className="flex-1" />
            {convite && <Botao variante={contestada ? 'secundario' : 'oficial'} tamanho="m" onClick={refazer}>Refazer convite</Botao>}
            {(contestada || !convite) && <Botao variante={contestada ? 'oficial' : 'secundario'} tamanho="m" onClick={abrirCorrecao}>Corrigir turma</Botao>}
          </>
        )}>
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center gap-2">
            <Selo familia={s.familia}>{s.texto}</Selo>
            <span className="t-apoio">{p.disciplinas} · {p.quando}</span>
          </div>
          {feito && <FaixaResultado tipo="certo" titulo={feito} className="-mx-6 border-b-2">{confirmaNoInicio(p)}</FaixaResultado>}

          <section className="grid gap-2">
            <h3 className="t-rotulo text-sutil">Turmas</h3>
            {dele.length === 0
              ? <p className="t-apoio">Nenhuma turma.</p>
              : (
                <Cartao semRespiro className="overflow-hidden">
                  {dele.map((a) => (
                    <div key={a.id} className="grid gap-2 border-t-2 border-borda px-4 py-3 first:border-t-0">
                      <div className="flex items-center gap-3">
                        <SeloTurma turma={a.turma} materia={a.disciplina} />
                        <span className="t-cartao min-w-0 flex-1 truncate">{a.disciplina}</span>
                        <Selo familia={ESTADO_DA_TURMA[a.estado].familia} tamanho="p">{ESTADO_DA_TURMA[a.estado].texto}</Selo>
                      </div>
                      {a.estado === 'contestado' && a.contestacao && (
                        <Aviso tom="erro" titulo={NOME_DA_CONTESTACAO[a.contestacao.motivo]}>{a.contestacao.complemento && `“${a.contestacao.complemento}”`}</Aviso>
                      )}
                    </div>
                  ))}
                </Cartao>
              )}
          </section>
        </div>
      </PainelLado>

      <DialogoAlocar alocar={alocar} aoMudar={setAlocar} professor={p} turmas={turmas} aoFeito={(t) => setFeito(t)} />
      <DialogoLink link={link} nome={p.nome} titulo="Convite refeito" aoFechar={() => setLink(null)} />
      <DialogoConfirmar aberto={confirmar === 'revogar'} aoMudar={(v) => !v && setConfirmar(null)} titulo={`Revogar o convite de ${p.nome}?`}
        frase="O link deixa de valer na hora."
        confirmar={{ rotulo: 'Revogar', variante: 'perigoCheio', aoConfirmar: () => convites.revogar(p.id) }} />
      <DialogoConfirmar aberto={confirmar === 'encerrar'} aoMudar={(v) => !v && setConfirmar(null)} titulo={`Encerrar o vínculo de ${p.nome}?`}
        frase="As turmas deixam de abrir para ele na hora."
        confirmar={{ rotulo: 'Encerrar', variante: 'perigoCheio', aoConfirmar: () => convites.encerrarVinculo(p.id) }} />
    </>
  )
}

function DialogoAlocar({ alocar, aoMudar, professor, turmas, aoFeito }: {
  alocar: Alocar | null; aoMudar: (a: Alocar | null) => void; professor: ProfessorEstado
  turmas: ReturnType<typeof useTurmasDaEscola>; aoFeito: (t: string) => void
}) {
  const [erro, setErro] = useState('')
  const a = alocar ?? { modo: 'corrigir' as const, turmaId: '', disciplina: '' }
  const muda = (m: Partial<Alocar>) => { setErro(''); aoMudar({ ...a, ...m }) }
  const salvar = () => {
    if (!a.turmaId || !a.disciplina) return setErro('Escolha a turma e a disciplina.')
    const repetida = turmas.find((t) => t.id === a.turmaId)?.professores.some((x) => x.profId === professor.id && x.disciplina === a.disciplina && x.estado !== 'encerrado')
    if (repetida && !(a.modo === 'corrigir' && a.alocId)) return setErro('Já está nesta turma, nesta disciplina.')
    const nome = turmas.find((t) => t.id === a.turmaId)?.nome ?? ''
    if (a.modo === 'corrigir' && a.alocId) alocacoes.corrigir(a.alocId, a.turmaId, a.disciplina)
    else alocacoes.acrescentar(professor.id, a.turmaId, a.disciplina)
    aoFeito(`${a.modo === 'corrigir' ? 'Corrigido' : 'Acrescentado'}: ${nome} · ${a.disciplina}`)
    aoMudar(null)
  }
  return (
    <Dialogo aberto={!!alocar} aoMudar={(v) => { if (!v) { aoMudar(null); setErro('') } }} largura={480}
      titulo={a.modo === 'corrigir' ? 'Corrigir turma' : 'Acrescentar turma'}
      rodape={<Botao variante="oficial" tamanho="m" onClick={salvar}>Salvar</Botao>}>
      <div className="grid gap-4">
        <Escolha id="al-turma" rotulo="Turma" valor={a.turmaId} aoMudar={(v) => muda({ turmaId: v })} marcador="Escolha a turma"
          opcoes={[...turmas].sort(porSerie).map((t) => ({ valor: t.id, rotulo: `${t.nome} · ${t.serie}` }))} />
        <Escolha id="al-disc" rotulo="Disciplina" valor={a.disciplina} aoMudar={(v) => muda({ disciplina: v })} marcador="Escolha" opcoes={DISCIPLINAS_OPCOES}
          erro={erro || undefined} dica={confirmaNoInicio(professor)} />
      </div>
    </Dialogo>
  )
}

/* ── O link que aparece uma vez ────────────────────────────────────────────────────────────────────────── */

function CaixaDoLink({ link, copiado, aoCopiar }: { link: string; copiado: boolean; aoCopiar: () => void }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-2 rounded-[12px] border-2 border-borda bg-fundo-suave p-1.5 pl-3.5">
        <Link2 aria-hidden className="size-5 shrink-0 text-sutil" strokeWidth={2.5} />
        <output aria-label="Link do convite" data-link={link} className="min-w-0 flex-1 select-all break-all py-1 font-mono text-[14px] font-medium leading-5 text-tinta">{linkDeTela(link)}</output>
        <Botao variante={copiado ? 'secundario' : 'primario'} tamanho="p" icone={copiado ? <Check strokeWidth={3} /> : <Copy strokeWidth={2.5} />} onClick={aoCopiar}>
          {copiado ? 'Copiado' : 'Copiar link'}
        </Botao>
      </div>
      <Aviso tom="atencao">O link aparece uma vez.</Aviso>
    </div>
  )
}

/** O link (do convite novo ou refeito): fechar sem copiar pergunta antes. */
function DialogoLink({ link, nome, titulo, aoFechar }: { link: string | null; nome: string; titulo: string; aoFechar: () => void }) {
  const [perguntando, setPerguntando] = useState(false)
  const { copiado, jaCopiou, copiar, zerar } = useCopiar()
  const fechar = () => { setPerguntando(false); zerar(); aoFechar() }
  const pedirFechar = () => (jaCopiou ? fechar() : setPerguntando(true))
  return (
    <>
      <Dialogo aberto={!!link && !perguntando} aoMudar={(v) => { if (!v) pedirFechar() }} titulo={titulo} largura={560}
        rodape={<Botao variante="secundario" tamanho="m" onClick={pedirFechar}>Fechar</Botao>}>
        <div className="grid gap-3">
          <p className="t-corpo text-apoio">Para <b className="text-tinta">{nome}</b>. Vale 7 dias.</p>
          {link && <CaixaDoLink link={link} copiado={copiado} aoCopiar={() => copiar(link)} />}
        </div>
      </Dialogo>
      <DialogoConfirmar aberto={!!link && perguntando} aoMudar={(v) => { if (!v) setPerguntando(false) }} titulo="Fechar sem copiar?"
        frase="O link não aparece de novo." voltar="Voltar ao link"
        confirmar={{ rotulo: 'Fechar', variante: 'perigoCheio', aoConfirmar: fechar }} />
    </>
  )
}

/* ── Convidar professor: um diálogo só ─────────────────────────────────────────────────────────────────── */

function DialogoConvidar({ aberto, aoFechar }: { aberto: boolean; aoFechar: () => void }) {
  const turmas = useTurmasDaEscola()
  const lista = useProfessoresDaEscola()
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [disciplina, setDisciplina] = useState('')
  const [escolhidas, setEscolhidas] = useState<string[]>([])
  const [erro, setErro] = useState<{ campo: 'nome' | 'email' | 'disciplina' | 'turmas'; texto: string } | null>(null)
  const [link, setLink] = useState<string | null>(null)

  const limpar = () => { setNome(''); setEmail(''); setDisciplina(''); setEscolhidas([]); setErro(null); setLink(null) }
  const cancelar = () => { aoFechar(); window.setTimeout(limpar, 200) }
  const gerar = (e?: FormEvent) => {
    e?.preventDefault()
    const n = nome.trim().replace(/\s+/g, ' ')
    if (!n) return setErro({ campo: 'nome', texto: 'Digite o nome.' })
    if (!EMAIL_VALIDO.test(email.trim())) return setErro({ campo: 'email', texto: 'Digite um e-mail válido.' })
    if (lista.some((p) => !['revogado', 'desativado'].includes(p.estado) && p.email?.toLowerCase() === email.trim().toLowerCase()))
      return setErro({ campo: 'email', texto: 'Este e-mail já é de um professor daqui.' })
    if (!disciplina) return setErro({ campo: 'disciplina', texto: 'Escolha a disciplina.' })
    if (!escolhidas.length) return setErro({ campo: 'turmas', texto: 'Escolha ao menos uma turma.' })
    setLink(linkAbsoluto(convites.convidarProfessor({ nome: n, email: email.trim(), disciplina, turmaIds: escolhidas }).link))
  }
  const ordenadas = [...turmas].sort(porSerie)

  if (link) return <DialogoLink link={aberto ? link : null} nome={nome.trim()} titulo="Convite pronto" aoFechar={cancelar} />
  return (
    <Dialogo aberto={aberto} aoMudar={(v) => { if (!v) cancelar() }} titulo="Convidar professor" largura={600}
      rodape={<Botao tamanho="m" onClick={() => gerar()}>Gerar convite</Botao>}>
      <form onSubmit={gerar} className="grid gap-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto rotulo="Nome" valor={nome} aoMudar={(v) => { setNome(v); setErro(null) }} autoFocus erro={erro?.campo === 'nome' ? erro.texto : undefined} />
          <CampoTexto rotulo="E-mail" type="email" valor={email} aoMudar={(v) => { setEmail(v); setErro(null) }} placeholder="nome@escola.com.br"
            erro={erro?.campo === 'email' ? erro.texto : undefined} />
        </div>
        <Escolha id="cv-disc" rotulo="Disciplina" valor={disciplina} aoMudar={(v) => { setDisciplina(v); setErro(null) }} marcador="Escolha"
          opcoes={DISCIPLINAS_OPCOES} erro={erro?.campo === 'disciplina' ? erro.texto : undefined} />
        <fieldset className="grid gap-2">
          <legend className="mb-2 text-[15px] font-bold leading-5 text-tinta">Turmas</legend>
          <div className="flex flex-wrap gap-2">
            {ordenadas.map((t) => (
              <Toque key={t.id} selecionado={escolhidas.includes(t.id)} className="tabular-nums"
                aoMudar={() => { setErro(null); setEscolhidas((x) => (x.includes(t.id) ? x.filter((y) => y !== t.id) : [...x, t.id])) }}>{t.nome}</Toque>
            ))}
          </div>
          {erro?.campo === 'turmas' && <p role="alert" className="text-[15px] font-bold text-vermelho-texto">{erro.texto}</p>}
        </fieldset>
        <button type="submit" hidden aria-hidden tabIndex={-1} />
      </form>
    </Dialogo>
  )
}
