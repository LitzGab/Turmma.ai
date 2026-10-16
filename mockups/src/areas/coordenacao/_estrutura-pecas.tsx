import { useMemo, useState, type ReactNode, type SelectHTMLAttributes } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, Lock } from 'lucide-react'
import { CLASSE_CAMPO, Campo } from '@/components/duo'
import { SERIES } from '@/dados/estrutura'
import { listaDe, useAlunosDaTurma, type AlunoDaTurma } from '@/dados/acesso'
import { criarFatia, registrar } from '@/dados/demo/nucleo'
import { cn } from '@/lib/utils'

/* PEÇAS DA MONTAGEM DA ESCOLA (12ª rodada, 04/10/2026; plano de polimento, 5.3).
   O estado mora na base (`dados/acesso.ts` e `dados/escola-estado.ts`): aqui ficam só as peças de forma e as funções
   puras que as três telas da Escola usam (Turmas, a turma e Professores). Nada fala com servidor. */

/* ── Funções puras ─────────────────────────────────────────────────────────────────────────────────────── */

export const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLocaleLowerCase('pt-BR').trim()
export const ordemDaSerie = (s: string) => { const i = SERIES.indexOf(s); return i < 0 ? 99 : i }
export const porSerie = <T extends { serie: string; nome: string }>(a: T, b: T) =>
  ordemDaSerie(a.serie) - ordemDaSerie(b.serie) || a.nome.localeCompare(b.nome, 'pt-BR')

/** O link absoluto, com o endereço de quem está vendo (o convite é aberto em outra aba). */
export const linkAbsoluto = (caminho: string) => `${typeof window === 'undefined' ? '' : window.location.origin}${caminho}`

/** O que a tela mostra: sempre no endereço do produto ("turmma.com/convite#…"), nunca o endereço local.
    O endereço real fica só no que vai para a área de transferência e no atributo data-link (o Mapa abre por ele). */
export const linkDeTela = (link: string) => link.replace(/^https?:\/\/[^/]+/, 'turmma.com')

/* ── Matrícula: a lista leva só nome e matrícula (regra 20, item 2) ────────────────────────────────────── */

const FORMA_DE_CPF = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/
const FORMA_DE_DATA = /^\d{2}\/\d{2}\/\d{4}$/
export const pareceDocumento = (m: string) => FORMA_DE_CPF.test(m.trim()) || FORMA_DE_DATA.test(m.trim())

export const ERRO_DA_LINHA = {
  sem_nome: 'Falta o nome',
  sem_matricula: 'Falta a matrícula',
  documento: 'Parece CPF, e não matrícula',
  repetida: 'Matrícula repetida',
  em_uso: 'Matrícula já usada',
} as const
export type ErroDaLinha = keyof typeof ERRO_DA_LINHA

/** As matrículas das outras turmas da escola (para o erro "já usada"). */
export function matriculasDeOutras(turmaId: string, turmaIds: string[]) {
  const s = new Set<string>()
  for (const id of turmaIds) if (id !== turmaId) for (const n of listaDe(id)) s.add(n.matricula)
  return s
}

export type LinhaDaPrevia = { linha: number; nome: string; matricula: string; erro?: ErroDaLinha }

/** A prévia linha a linha: `nome; matrícula`, nada com forma de documento, nenhuma matrícula repetida no texto (a
    primeira vez vale; as outras são o erro) nem já usada na escola. Linha em branco não conta. */
export function lerColagem(texto: string, jaUsadas: Set<string>): LinhaDaPrevia[] {
  const vistas = new Set<string>()
  return texto.split(/\r?\n/).map((l, i) => ({ l: l.trim(), n: i + 1 })).filter((x) => x.l !== '').map(({ l, n }) => {
    const [nome = '', ...resto] = l.split(/[;\t]/)
    const x = { linha: n, nome: nome.trim().replace(/\s+/g, ' '), matricula: resto.join(';').trim() }
    if (!x.nome) return { ...x, erro: 'sem_nome' as const }
    if (!x.matricula) return { ...x, erro: 'sem_matricula' as const }
    if (pareceDocumento(x.matricula)) return { ...x, erro: 'documento' as const }
    if (vistas.has(x.matricula)) return { ...x, erro: 'repetida' as const }
    vistas.add(x.matricula)
    if (jaUsadas.has(x.matricula)) return { ...x, erro: 'em_uso' as const }
    return x
  })
}

/* ── Peças de forma ────────────────────────────────────────────────────────────────────────────────────── */

/** O `select` nativo na pele dos campos (48 px, borda de 2). */
export function Escolha({ id, rotulo, valor, aoMudar, opcoes, marcador, dica, erro, className, ...resto }: {
  id: string; rotulo: ReactNode; valor: string; aoMudar: (v: string) => void
  opcoes: { valor: string; rotulo: string }[]; marcador?: string; dica?: ReactNode; erro?: ReactNode; className?: string
} & Omit<SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange' | 'id' | 'className'>) {
  return (
    <Campo id={id} rotulo={rotulo} dica={dica} erro={erro} className={className}>
      <div className="relative">
        <select id={id} value={valor} onChange={(e) => aoMudar(e.target.value)} aria-invalid={!!erro || undefined} {...resto}
          className={cn(CLASSE_CAMPO, 'h-12 appearance-none pr-10', !valor && 'text-sutil')}>
          {marcador !== undefined && <option value="" disabled>{marcador}</option>}
          {opcoes.map((o) => <option key={o.valor} value={o.valor} className="text-tinta">{o.rotulo}</option>)}
        </select>
        <ChevronDown aria-hidden strokeWidth={2.5} className="pointer-events-none absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-sutil" />
      </div>
    </Campo>
  )
}

/** Copiar para a área de transferência, com o "Copiado" que volta sozinho. */
export function useCopiar() {
  const [copiado, setCopiado] = useState(false)
  const [jaCopiou, setJaCopiou] = useState(false)
  const copiar = async (texto: string) => {
    try { await navigator.clipboard.writeText(texto) } catch { /* sem permissão: segue igual */ }
    setCopiado(true); setJaCopiou(true)
    window.setTimeout(() => setCopiado(false), 1800)
  }
  return { copiado, jaCopiou, copiar, zerar: () => { setCopiado(false); setJaCopiou(false) } }
}

/** O título de grupo dentro de uma lista (a série): t-selo, preso no alto enquanto rola. */
export function TituloDeGrupo({ children }: { children: ReactNode }) {
  return <h2 className="t-selo sticky top-0 z-[1] border-b-2 border-borda bg-fundo-suave px-4 py-2 text-sutil">{children}</h2>
}

/* ── Matrícula de quem já tem conta: mudar de turma e encerrar ─────────────────────────────────────────────
   A base só retira da lista o nome LIVRE (dados/acesso.ts). Para o aluno com conta, a coordenação muda de turma
   (a conta segue) ou encerra a matrícula (a conta é desativada; regra 20, itens 15 e 18). Fica numa fatia própria até
   a base ganhar `listas.mudarDeTurma` e `listas.encerrarMatricula`. */

type AlunoSalvo = Pick<AlunoDaTurma, 'id' | 'nome' | 'matricula' | 'situacao' | 'contaId'>
type Movimento = { tipo: 'mudou' | 'encerrada'; de: string; para?: string; aluno: AlunoSalvo }
const fatiaMatriculas = criarFatia<Movimento[]>('matriculas-da-coordenacao', [])
const COORD = { nome: 'Helena Martins', papel: 'coordenacao' as const }
const salvo = (a: AlunoDaTurma): AlunoSalvo => ({ id: a.id, nome: a.nome, matricula: a.matricula, situacao: a.situacao, contaId: a.contaId })

/** Os nomes da turma, já com quem mudou de turma ou teve a matrícula encerrada. */
export function useAlunosVivos(turmaId: string): AlunoDaTurma[] {
  const base = useAlunosDaTurma(turmaId)
  const mov = fatiaMatriculas.useValor()
  return useMemo(() => {
    const saem = new Set(mov.filter((m) => m.de === turmaId).map((m) => m.aluno.id))
    const entram = mov.filter((m) => m.tipo === 'mudou' && m.para === turmaId).map((m) => ({ ...m.aluno, id: `${m.aluno.id}@${turmaId}` }))
    return [...base, ...entram].filter((a) => !saem.has(a.id)).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
  }, [base, mov, turmaId])
}

export const matriculas = {
  mudarDeTurma(de: string, para: string, aluno: AlunoDaTurma) {
    fatiaMatriculas.mudar((l) => [...l, { tipo: 'mudou', de, para, aluno: salvo(aluno) }])
    registrar('lista-gravada', { turmaId: para, de, mudou: aluno.nome }, COORD)
  },
  encerrar(turmaId: string, aluno: AlunoDaTurma) {
    fatiaMatriculas.mudar((l) => [...l, { tipo: 'encerrada', de: turmaId, aluno: salvo(aluno) }])
    registrar('lista-gravada', { turmaId, encerrou: aluno.nome }, COORD)
  },
}

/* ── A tabela das telas da coordenação (14ª rodada, 05/10/2026; plano ux-composicao, 5.1 e 5.2) ─────────────────
   Uma grade só para Escola (Turmas, Professores, Material), Registros (IA, Avisos e pedidos, Auditoria) e a lista da
   turma: colunas proporcionais (a trilha de cada coluna vai em `largura`), o cabeçalho de 40 px preso no alto, a
   linha de grupo (a série) com 32 px presa logo abaixo, as linhas com 48, 56 ou 64 px, o selo sempre à direita e o
   › no fim quando a linha abre. A tabela tem a altura do que mostra e rola por dentro quando falta espaço.
   A 375 cada linha vira UMA linha de lista (o título inteiro em cima; o selo e o apoio embaixo): nada de rótulo e valor empilhados; ali a
   tabela não rola por dentro: quem rola é a aba (o contêiner leva `max-md:overflow-y-auto`). */

export type ColunaGrade<T> = {
  titulo: string
  /** a trilha da grade: 'minmax(0,2fr)', '120px'… */
  largura: string
  celula: (linha: T) => ReactNode
  alinhar?: 'fim'
}

export type LinhaCelular = { inicio?: ReactNode; titulo: ReactNode; apoio?: ReactNode; fim?: ReactNode }

const ALTURA = { 48: 'md:h-12', 56: 'md:h-14', 64: 'md:min-h-16 md:py-2' } as const

export function TabelaGrade<T>({ colunas, grupos, chave, aoAbrir, para, podeAbrir, ativa, altura = 56, celular, vazio = 'Nada por aqui.', rotulo, className }: {
  colunas: ColunaGrade<T>[]
  /** as linhas, em grupos (o título do grupo é opcional: um grupo sem título é a lista inteira) */
  grupos: { id: string; titulo?: ReactNode; linhas: T[] }[]
  chave: (linha: T) => string
  aoAbrir?: (linha: T) => void
  /** a linha é um link */
  para?: (linha: T) => string
  /** quando só algumas linhas abrem (as outras ficam sem › e sem clique) */
  podeAbrir?: (linha: T) => boolean
  /** a chave da linha aberta ao lado */
  ativa?: string | null
  altura?: 48 | 56 | 64
  /** a linha a 375 */
  celular: (linha: T) => LinhaCelular
  vazio?: ReactNode
  rotulo: string
  className?: string
}) {
  const abreTabela = !!aoAbrir || !!para
  const trilha = { gridTemplateColumns: colunas.map((c) => c.largura).join(' ') + (abreTabela ? ' 20px' : '') }
  const total = grupos.reduce((s, g) => s + g.linhas.length, 0)
  const comGrupo = grupos.some((g) => g.titulo)
  return (
    <div role="region" aria-label={rotulo} className={cn('flex min-h-0 shrink flex-col overflow-clip rounded-[16px] border-2 border-borda bg-white max-md:shrink-0', className)}>
      {/* no computador a tabela rola por dentro; no celular quem rola é a aba inteira (o cabeçalho do grupo gruda nela) */}
      <div className="min-h-0 flex-1 md:overflow-y-auto md:overscroll-contain">
        <div aria-hidden style={trilha}
          className="sticky top-0 z-[2] hidden h-10 items-center gap-4 border-b-2 border-borda bg-white px-4 md:grid">
          {colunas.map((c) => <span key={c.titulo} className={cn('t-selo truncate text-sutil', c.alinhar === 'fim' && 'text-right')}>{c.titulo}</span>)}
        </div>
        {total === 0 && <p className="t-apoio px-4 py-6 text-center">{vazio}</p>}
        {grupos.filter((g) => g.linhas.length > 0).map((g) => (
          <section key={g.id} aria-label={typeof g.titulo === 'string' ? g.titulo : undefined}>
            {g.titulo && (
              <h3 className={cn('t-selo sticky z-[1] flex h-8 items-center border-b-2 border-borda bg-fundo-suave px-4 text-sutil', comGrupo ? 'top-0 md:top-10' : 'top-0')}>
                {g.titulo}
              </h3>
            )}
            <ul>
              {g.linhas.map((l) => {
                const k = chave(l)
                const m = celular(l)
                const abre = abreTabela && (podeAbrir?.(l) ?? true)
                const classe = cn('group/linha block w-full text-left',
                  abre && 'transition-colors duration-150 hover:bg-fundo-suave focus-visible:outline-3 focus-visible:-outline-offset-3 focus-visible:outline-azul-texto',
                  ativa === k && 'bg-azul-claro hover:bg-azul-claro')
                const miolo = (
                  <>
                    <span style={trilha} className={cn('hidden items-center gap-4 px-4 text-[15px] font-medium text-tinta md:grid', ALTURA[altura])}>
                      {colunas.map((c) => <span key={c.titulo} className={cn('flex min-w-0 items-center', c.alinhar === 'fim' && 'justify-end')}>{c.celula(l)}</span>)}
                      {abreTabela && (abre ? <ChevronRight aria-hidden strokeWidth={2.5} className="size-5 text-apagado transition-transform duration-150 group-hover/linha:translate-x-0.5" /> : <span aria-hidden />)}
                    </span>
                    <span className="flex min-h-14 items-center gap-3 px-4 py-2 md:hidden">
                      {m.inicio && <span className="flex shrink-0 items-center">{m.inicio}</span>}
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="t-cartao line-clamp-2 text-tinta">{m.titulo}</span>
                        {(m.fim || m.apoio) && (
                          <span className="flex min-w-0 items-center gap-2">
                            {m.fim && <span className="flex shrink-0 items-center gap-1.5">{m.fim}</span>}
                            {m.apoio && <span className="t-apoio min-w-0 truncate">{m.apoio}</span>}
                          </span>
                        )}
                      </span>
                      {abre && <ChevronRight aria-hidden strokeWidth={2.5} className="size-5 shrink-0 text-apagado" />}
                    </span>
                  </>
                )
                return (
                  <li key={k} className="border-t-2 border-borda first:border-t-0">
                    {!abre
                      ? <div className={classe}>{miolo}</div>
                      : para
                      ? <Link to={para(l)} className={classe}>{miolo}</Link>
                      : aoAbrir
                        ? <button type="button" onClick={() => aoAbrir(l)} aria-current={ativa === k || undefined} className={classe}>{miolo}</button>
                        : <div className={classe}>{miolo}</div>}
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

/* ── A borda direita no canto do sino (14ª rodada, revisão CE; acertada no fechamento) ───────────────────────
   O CabecalhoPagina guarda 56 px à direita só na linha que fica na altura do sino. As abas, a linha do fim e o corpo
   vão até a borda da coluna (1408 a 1440 px), a mesma do Painel, de Turmas e de Ferramentas: a borda direita não muda
   de tela para tela. No celular, o título sobe para 16–24 px da barra do topo. */
export const CABECALHO_NO_SINO = 'max-md:-mt-3 max-md:[&>div:first-child]:min-h-12'

/** O corpo da página (a mesma borda direita das outras telas de painel). */
export function CorpoNoSino({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex min-h-0 flex-1 flex-col', className)}>{children}</div>
}

/** A mesma frase no rodapé da IA e da Auditoria: o porquê, com o cadeado. */
export function FraseSemRanking() {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Lock aria-hidden className="size-4 shrink-0" strokeWidth={2.5} />Para não virar ranking de professor, não há filtro nem ordem por professor.
    </span>
  )
}
