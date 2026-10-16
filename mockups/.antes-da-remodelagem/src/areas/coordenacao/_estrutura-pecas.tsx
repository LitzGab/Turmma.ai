import { useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, X } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  listaDa, pedidosDa, TEXTO_DO_ERRO_DA_LINHA, TURMAS_DA_ESCOLA,
  type NomeDaLista, type PedidoDeNome, type TurmaDaEscola,
} from '@/dados/estrutura'
import { cn } from '@/lib/utils'

/* Peças comuns às três telas da montagem da escola (Estrutura, Lista da turma, Professores).
   O estado que precisa atravessar as telas (a turma criada na Estrutura e aberta na Lista; a lista gravada e os pedidos
   decididos, que a tabela de turmas conta) mora num depósito em memória, só desta aba do navegador: recarregar volta
   ao estado inicial. Nada fala com servidor. */

/* ── Estilos ───────────────────────────────────────────────────────────────────────────────────────────── */

export const campo = 'h-10 rounded-controle border-borda-campo bg-superficie text-[15px] focus-visible:ring-0 focus-visible:ring-offset-0'
export const caixaMarca = 'size-[18px] rounded-[5px] border-borda-campo data-[state=checked]:border-noite data-[state=checked]:bg-noite data-[state=checked]:text-white [&_svg]:size-3.5'
export const tituloDialogo = 'font-titulo text-[19px] font-semibold tracking-[-0.015em] text-tinta'
export const textoDialogo = 'text-[15px] leading-relaxed text-apoio'
/** A área que rola por dentro: cabeçalho da tabela preso no alto. */
export const areaRolavel = 'min-h-0 flex-1 overflow-y-auto overscroll-contain'
export const cabecaPresa = 'sticky top-0 z-[1] bg-superficie shadow-[inset_0_-1px_0_var(--color-linha)]'

/** Hoje, na história da demonstração (o roteiro do produto real é de 04/10/2026). */
export const HOJE = '04/10'
export const CONVITE_NOVO_VALE_ATE = '11/10'

/* ── O depósito da sessão ──────────────────────────────────────────────────────────────────────────────── */

type Deposito = {
  criadas: TurmaDaEscola[]
  listas: Record<string, NomeDaLista[]>
  pedidos: Record<string, PedidoDeNome[]>
}
const deposito: Deposito = { criadas: [], listas: {}, pedidos: {} }

export const todasAsTurmas = () => [...TURMAS_DA_ESCOLA, ...deposito.criadas]
export const acharTurma = (id: string) => todasAsTurmas().find((t) => t.id === id)
export const criarTurma = (t: TurmaDaEscola) => { deposito.criadas.push(t) }
export const listaAtual = (id: string) => deposito.listas[id] ?? (deposito.criadas.some((t) => t.id === id) ? [] : listaDa(id))
export const pedidosAtuais = (id: string) => deposito.pedidos[id] ?? (deposito.criadas.some((t) => t.id === id) ? [] : pedidosDa(id))
export const guardarLista = (id: string, lista: NomeDaLista[]) => { deposito.listas[id] = lista }
export const guardarPedidos = (id: string, pedidos: PedidoDeNome[]) => { deposito.pedidos[id] = pedidos }

/** A turma como a tabela mostra: se a lista mudou nesta sessão, os números saem dela. */
export function turmaContada(t: TurmaDaEscola): TurmaDaEscola {
  const lista = deposito.listas[t.id]
  if (!lista) return t
  return {
    ...t,
    nomes: lista.length,
    livres: lista.filter((n) => n.estado === 'livre').length,
    pedidos: (deposito.pedidos[t.id] ?? pedidosDa(t.id)).length,
    listaEm: lista.length ? t.listaEm ?? HOJE : undefined,
  }
}

/* ── Matrícula: a lista leva só nome e matrícula ───────────────────────────────────────────────────────── */

const FORMA_DE_CPF = /^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/
const FORMA_DE_DATA = /^\d{2}\/\d{2}\/\d{4}$/
export const pareceDocumento = (m: string) => FORMA_DE_CPF.test(m.trim()) || FORMA_DE_DATA.test(m.trim())
export const TEXTO_PARECE_DOCUMENTO = 'Isto parece CPF ou data de nascimento, e não matrícula. A lista leva só o nome e a matrícula do aluno.'

/** Todas as matrículas da escola, menos as da turma pedida: para o erro "já é de um aluno da escola". */
export function matriculasDeOutrasTurmas(turmaId: string) {
  const s = new Set<string>()
  for (const t of todasAsTurmas()) if (t.id !== turmaId) for (const n of listaAtual(t.id)) s.add(n.matricula)
  return s
}

export type LinhaDaPrevia = { linha: number; nome: string; matricula: string; erro?: keyof typeof TEXTO_DO_ERRO_DA_LINHA }

/** A prévia linha a linha: separador `;`, nome e matrícula obrigatórios, nada com forma de documento, nenhuma matrícula
    repetida no texto nem já usada em outra turma. Linha em branco não conta. */
export function lerColagem(texto: string, turmaId: string): LinhaDaPrevia[] {
  const linhas = texto.split(/\r?\n/).map((l, i) => ({ l: l.trim(), n: i + 1 })).filter((x) => x.l !== '')
  const lidas = linhas.map(({ l, n }) => {
    const [nome = '', ...resto] = l.split(';')
    return { linha: n, nome: nome.trim().replace(/\s+/g, ' '), matricula: resto.join(';').trim() }
  })
  const vezes = new Map<string, number>()
  for (const x of lidas) if (x.matricula) vezes.set(x.matricula, (vezes.get(x.matricula) ?? 0) + 1)
  const deOutras = matriculasDeOutrasTurmas(turmaId)
  return lidas.map((x): LinhaDaPrevia => {
    if (!x.nome) return { ...x, erro: 'sem_nome' }
    if (!x.matricula) return { ...x, erro: 'sem_matricula' }
    if (pareceDocumento(x.matricula)) return { ...x, erro: 'matricula_parece_documento' }
    if ((vezes.get(x.matricula) ?? 0) > 1) return { ...x, erro: 'matricula_repetida' }
    if (deOutras.has(x.matricula)) return { ...x, erro: 'matricula_em_uso' }
    return x
  })
}

/* ── Peças de tela ─────────────────────────────────────────────────────────────────────────────────────── */

/** O anúncio depois de uma ação: uma linha verde que se fecha. */
export function Anuncio({ children, aoFechar, className }: { children: ReactNode; aoFechar: () => void; className?: string }) {
  return (
    <div role="status" className={cn('flex min-h-10 items-center gap-2.5 rounded-controle bg-ok-cx py-2 pl-3 pr-1.5 text-sm text-ok animate-entra', className)}>
      <Check className="size-4 shrink-0" strokeWidth={2.6} />
      <p className="min-w-0 flex-1 leading-snug [&_b]:font-semibold">{children}</p>
      <button type="button" onClick={aoFechar} aria-label="Fechar o aviso" className="grid size-7 shrink-0 place-items-center rounded-full hover:bg-white/60">
        <X className="size-3.5" />
      </button>
    </div>
  )
}

/** Mensagem de campo: erro em vermelho, aviso em âmbar. */
export function MensagemCampo({ tom = 'erro', children, id }: { tom?: 'erro' | 'pendente'; children: ReactNode; id?: string }) {
  return <p id={id} role="alert" className={cn('rounded-linha px-2.5 py-1.5 text-[13px] leading-snug', tom === 'erro' ? 'bg-erro-cx text-erro' : 'bg-pendente-cx text-pendente')}>{children}</p>
}

/** Rótulo + controle, empilhados. */
export function Campo({ id, rotulo, children, className }: { id: string; rotulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('grid gap-1.5', className)}>
      <Label htmlFor={id} className="text-[13px] font-medium text-apoio">{rotulo}</Label>
      {children}
    </div>
  )
}

/** shadcn/select no tamanho dos campos daqui. */
export function Escolha({ id, valor, aoMudar, opcoes, marcador, className }: {
  id?: string; valor: string; aoMudar: (v: string) => void; opcoes: { valor: string; rotulo: string }[]; marcador?: string; className?: string
}) {
  return (
    <Select value={valor} onValueChange={aoMudar}>
      <SelectTrigger id={id} className={cn(campo, 'focus:ring-0 focus:ring-offset-0', className)}><SelectValue placeholder={marcador} /></SelectTrigger>
      <SelectContent className="max-h-72 rounded-controle">
        {opcoes.map((o) => <SelectItem key={o.valor} value={o.valor} className="rounded-linha">{o.rotulo}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/** Pílulas de filtro com contagem (Todos 32 · Livres 3 …). */
export function Pilulas<T extends string>({ valor, aoMudar, opcoes, rotulo }: {
  valor: T; aoMudar: (v: T) => void; opcoes: { valor: T; rotulo: string; n?: number }[]; rotulo: string
}) {
  return (
    <div role="radiogroup" aria-label={rotulo} className="flex shrink-0 items-center gap-1 overflow-x-auto">
      {opcoes.map((o) => {
        const ativo = o.valor === valor
        return (
          <button key={o.valor} type="button" role="radio" aria-checked={ativo} onClick={() => aoMudar(o.valor)}
            className={cn('inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium transition-colors duration-150',
              ativo ? 'bg-noite text-white' : 'bg-realce-suave text-apoio hover:bg-realce')}>
            {o.rotulo}
            {o.n !== undefined && <span className={cn('tabular-nums', ativo ? 'text-white/70' : 'text-sutil')}>{o.n}</span>}
          </button>
        )
      })}
    </div>
  )
}

/** Um token sorteado de verdade (base64url), para o link do convite. */
export function sortearToken(bytes = 18) {
  const b = new Uint8Array(bytes)
  crypto.getRandomValues(b)
  return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/** Copiar para a área de transferência, com o "Copiado" que volta sozinho. */
export function useCopiar() {
  const [copiado, setCopiado] = useState(false)
  const [jaCopiou, setJaCopiou] = useState(false)
  const copiar = async (texto: string) => {
    try { await navigator.clipboard.writeText(texto) } catch { /* sem permissão: o mockup segue igual */ }
    setCopiado(true); setJaCopiou(true)
    window.setTimeout(() => setCopiado(false), 1800)
  }
  return { copiado, jaCopiou, copiar, zerar: () => { setCopiado(false); setJaCopiou(false) } }
}

/* ── A tabela que rola por dentro ──────────────────────────────────────────────────────────────────────── */

export type ColunaFixa<T> = { titulo: string; celula: (l: T) => ReactNode; className?: string; principal?: boolean; soComputador?: boolean }

/** Tabela de cabeçalho preso, que rola dentro da área que a contém; no celular vira lista de cartões.
    `depois` desenha uma linha inteira embaixo da linha (o motivo de uma contestação, por exemplo). */
export function TabelaFixa<T>({ colunas, linhas, chave, aoClicar, rotuloDaLinha, depois, destaque, classeDaLinha, vazio = 'Nada por aqui.' }: {
  colunas: ColunaFixa<T>[]; linhas: T[]; chave: (l: T) => string
  aoClicar?: (l: T) => void; rotuloDaLinha?: (l: T) => string
  depois?: (l: T) => ReactNode; destaque?: (l: T) => boolean; classeDaLinha?: (l: T) => string | undefined; vazio?: string
}) {
  if (linhas.length === 0) return <p className="m-3 rounded-controle border border-dashed border-linha p-6 text-center text-sm text-sutil">{vazio}</p>
  const principal = colunas.find((c) => c.principal) ?? colunas[0]
  const teclado = (l: T) => (e: KeyboardEvent) => { if (aoClicar && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); aoClicar(l) } }
  return (
    <>
      <table className="hidden w-full border-separate border-spacing-0 text-sm md:table">
        <thead>
          <tr>
            {colunas.map((c) => <th key={c.titulo} scope="col" className={cn(cabecaPresa, 'h-9 px-3 text-left align-middle text-[12.5px] font-medium text-sutil first:pl-4 last:pr-4', c.className)}>{c.titulo}</th>)}
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const extra = depois?.(l)
            return (
              <FragmentoLinha key={chave(l)}>
                <tr tabIndex={aoClicar ? 0 : undefined} aria-label={aoClicar ? rotuloDaLinha?.(l) : undefined}
                  onClick={aoClicar ? () => aoClicar(l) : undefined} onKeyDown={teclado(l)} data-destaque={destaque?.(l) || undefined}
                  className={cn('group transition-colors duration-150', aoClicar && 'cursor-pointer hover:bg-realce-suave focus-visible:bg-realce-suave focus-visible:outline-none',
                    destaque?.(l) && 'bg-ok-cx', classeDaLinha?.(l))}>
                  {colunas.map((c) => (
                    <td key={c.titulo} className={cn('h-11 px-3 align-middle text-apoio first:pl-4 last:pr-4', !extra && 'border-b border-linha', c.className)}>{c.celula(l)}</td>
                  ))}
                </tr>
                {extra && (
                  <tr><td colSpan={colunas.length} className="border-b border-linha px-4 pb-3 pt-0">{extra}</td></tr>
                )}
              </FragmentoLinha>
            )
          })}
        </tbody>
      </table>
      <ul className="grid gap-2 p-3 md:hidden">
        {linhas.map((l) => (
          <li key={chave(l)} onClick={aoClicar ? () => aoClicar(l) : undefined}
            className={cn('rounded-controle border border-linha p-3', aoClicar && 'cursor-pointer active:bg-realce-suave')}>
            <div className="text-[15px] font-semibold text-tinta">{principal.celula(l)}</div>
            <dl className="mt-1.5 grid gap-1">
              {colunas.filter((c) => c !== principal && !c.soComputador && c.titulo.trim()).map((c) => (
                <div key={c.titulo} className="flex min-w-0 items-center justify-between gap-2 text-[13px]">
                  <dt className="shrink-0 text-sutil">{c.titulo}</dt>
                  <dd className="min-w-0 text-right text-apoio">{c.celula(l)}</dd>
                </div>
              ))}
            </dl>
            {colunas.filter((c) => !c.titulo.trim() && !c.soComputador).map((c, i) => <div key={i} className="mt-2 flex flex-wrap justify-end gap-1">{c.celula(l)}</div>)}
            {depois?.(l) && <div className="mt-2">{depois(l)}</div>}
          </li>
        ))}
      </ul>
    </>
  )
}
function FragmentoLinha({ children }: { children: ReactNode }) { return <>{children}</> }
