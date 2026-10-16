import { useCallback, type ReactNode } from 'react'
import { Link, Navigate, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Abas as AbasDuo, MenuMais, Segmentado as SegmentadoDuo } from '@/components/duo'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

/* A MOLDURA DE TODA TELA, e o padrão de espaço do sistema (definido em 20/09/2026, a pedido do Gabriel:
   "aproveitamento horrível de espaço", "muito espaço ficando em branco", "não gosto que toda aba tenha título e descrição").

   · Aba de navegação NÃO tem título nem descrição: a lateral já diz onde a pessoa está (como no ChatGPT).
     O <h1> continua existindo, só para leitor de tela.
   · Só tela de OBJETO tem título visível — uma prova aberta, o formulário de uma ferramenta, o modo sala de uma turma:
     ali o título é o nome da coisa, não o nome da aba. Passa-se `objeto`.
   · Margem da página: 16 px no celular, 24 px a partir de 768 px. Topo 16/20 px. Fim 32 px.
   · Entre blocos 16 px · entre cartões de uma grade 12 px · dentro do cartão 16 px.
   · Controles da página (abas, filtros, busca) numa linha só, de 36 px, no topo — é ela o "cabeçalho".
   · Largura fluida até 1480 px em grade e tabela; 1040 px em formulário; 760 px em leitura e conversa.
   · Tela de trabalho (Calendário, Minhas turmas, thread do time) ocupa a altura da janela e rola POR DENTRO:
     usa-se `TelaCheia`, e nada empurra a página para baixo. */
// correção da 14ª rodada: a mesma moldura de 1200 do Pagina, com a coluna na borda esquerda dela (o título não pula
// de tela para tela); só a larga chega ao canto do sino e guarda a reserva dele
const LARGURA = { conversa: 'max-w-[760px] [--reserva-sino:0px]', media: 'max-w-[1040px] [--reserva-sino:0px]', tabela: '' }

export function Tela({ titulo, descricao, acoes, largura = 'tabela', objeto = false, children, className }: {
  titulo: ReactNode; descricao?: ReactNode; acoes?: ReactNode
  largura?: 'conversa' | 'media' | 'tabela'; objeto?: boolean; children: ReactNode; className?: string
}) {
  // 14ª rodada: toda tela tem título visível (5.1 B), na linha de 64 px do CabecalhoPagina, guardando o canto do sino
  void objeto
  return (
    <div className={cn('w-full px-4 pb-8 pt-4 md:px-8 md:pt-6', className)}>
      <div className="mx-auto w-full max-w-[1200px]"><div className={cn('w-full', LARGURA[largura])}>
      <header className="mb-4 flex min-h-16 flex-wrap items-center justify-between gap-x-6 gap-y-2.5 md:pr-[var(--reserva-sino,0px)]">
        <div className="min-w-0">
          <h1 className="t-titulo text-tinta">{titulo}</h1>
          {descricao && <p className="t-apoio mt-1 max-w-[80ch]">{descricao}</p>}
        </div>
        {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
      </header>
      {children}
      </div></div>
    </div>
  )
}

/** Tela de trabalho: ocupa a altura útil da janela (sem as barras do celular) e rola por dentro. 14ª rodada: com o
    título visível no topo (64 px), guardando o canto do sino. */
export function TelaCheia({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('altura-tela flex min-h-0 flex-col px-4 pb-4 pt-4 md:px-8', className)}>
      <div className="mx-auto flex min-h-0 w-full max-w-[1200px] flex-1 flex-col">
        <h1 className="t-titulo flex min-h-12 shrink-0 items-center text-tinta md:pr-[var(--reserva-sino,0px)]">{titulo}</h1>
        {children}
      </div>
    </div>
  )
}

/** Cartão de linha fina, sem sombra (9.3). Respiro de 16 px, 20 px a partir de 1024 px. */
export function Cartao({ children, className, titulo, acao }: { children: ReactNode; className?: string; titulo?: ReactNode; acao?: ReactNode }) {
  return (
    <section className={cn('rounded-[16px] border-2 border-borda bg-white p-4 lg:p-5', className)}>
      {(titulo || acao) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="t-cartao text-tinta">{titulo}</h2>}
          {acao}
        </div>
      )}
      {children}
    </section>
  )
}

/** Número de painel: rótulo em cima, número em Fustat tabular. Sem gráfico onde um número basta (11.7). */
export function NumeroPainel({ rotulo, valor, apoio, className }: { rotulo: string; valor: ReactNode; apoio?: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[16px] border-2 border-borda bg-white p-4 lg:p-5', className)}>
      <p className="t-selo text-sutil">{rotulo}</p>
      <p className="t-numero mt-2 text-tinta">{valor}</p>
      {apoio && <div className="t-apoio mt-1.5">{apoio}</div>}
    </div>
  )
}

/** Barra com rótulo e número ao lado (shadcn/progress). O MVP vive de barra, não de gráfico (10.2). */
export function BarraRotulada({ rotulo, detalhe, valor, sufixo = '%', tom = 'noite', className }: {
  rotulo: ReactNode; detalhe?: ReactNode; valor: number; sufixo?: string
  tom?: 'noite' | 'neutro' | 'caramelo' | 'ok'; className?: string
}) {
  const cor = { noite: '[&>div]:bg-azul', neutro: '[&>div]:bg-apagado', caramelo: '[&>div]:bg-laranja', ok: '[&>div]:bg-verde' }[tom]
  return (
    <div className={cn('grid gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-[15px] text-tinta"><span className="font-bold">{rotulo}</span>{detalhe && <span className="font-medium text-sutil"> · {detalhe}</span>}</p>
        <p className="shrink-0 text-[15px] font-bold tabular-nums text-tinta">{valor}{sufixo}</p>
      </div>
      <Progress value={valor} className={cn('h-3 rounded-full bg-borda', cor)} />
    </div>
  )
}

/** Nota de planejamento (fase, decisões, peças). Em 20/09/2026 o Gabriel pediu para tirar da tela tudo que diz
    "mockup": o texto continua no código, para quem for construir, e não é mais desenhado. */
export function NotaMockup(props: { children: ReactNode }) {
  void props
  return null
}

/* ── Décima rodada (04/10/2026): as peças da régua ───────────────────────────────────────────────────────────
   CabecalhoTela (R6, R11): uma linha de 48 px com "‹ Lugar de origem", o nome do objeto, um encaixe para trocar
   (a turma, por exemplo), uma ação e o "⋯" com o raro. Nada de descrição embaixo do título.
   Abas (R3): no máximo 3, em uma linha, presas a ?aba= com replace; trocar de aba fecha o painel que estava aberto
   (tira item, aluno, prof, aviso, convidar e ver da URL). Sublinhado laranja de 2 px, o que fica da Teachy (R13).
   Segmentado (R3): trocar o JEITO DE VER a mesma coisa (Lista · Notas · Carteiras) não é aba: é este cinza em pílula.
   useParametro: ler e gravar um parâmetro da URL, sempre com replace, para o "voltar" do navegador funcionar. */

/** Lê e grava um parâmetro da URL (com replace). `null` ou o valor padrão tiram o parâmetro. */
export function useParametro(nome: string, padrao: string | null = null): [string | null, (v: string | null) => void] {
  const [params, setParams] = useSearchParams()
  const valor = params.get(nome) ?? padrao
  const definir = useCallback((v: string | null) => {
    setParams((atual) => {
      const p = new URLSearchParams(atual)
      if (v === null || v === padrao) p.delete(nome); else p.set(nome, v)
      return p
    }, { replace: true })
  }, [nome, padrao, setParams])
  return [valor, definir]
}

/** Os parâmetros que um painel ou um modo de ver deixam na URL; trocar de aba tira todos. */
const DA_ABA = ['item', 'aluno', 'prof', 'aviso', 'convidar', 'ver']

/** A aba atual (?aba=), com o padrão quando não há. */
export function useAba(padrao: string): string {
  const [params] = useSearchParams()
  return params.get('aba') ?? padrao
}

export type Aba = { id: string; rotulo: string }

export function Abas({ abas, padrao, className }: { abas: Aba[]; padrao: string; className?: string }) {
  const [params, setParams] = useSearchParams()
  const atual = params.get('aba') ?? padrao
  const trocar = (id: string) => {
    if (id === atual) return
    setParams((antes) => {
      const p = new URLSearchParams(antes)
      DA_ABA.forEach((n) => p.delete(n))
      if (id === padrao) p.delete('aba'); else p.set('aba', id)
      return p
    }, { replace: true })
  }
  // 12ª rodada: o desenho é o das abas duo (caixa alta, sublinhado azul de 3 px sobre a linha de 2 px)
  return <AbasDuo abas={abas} valor={atual} aoMudar={trocar} className={className} />
}

/** O segmentado: até 4 jeitos de ver a mesma coisa (12ª rodada: o desenho duo, ativo em azul). */
export function Segmentado<T extends string>({ opcoes, valor, aoMudar, className, rotulo }: {
  opcoes: { id: T; rotulo: string; icone?: ReactNode }[]; valor: T; aoMudar: (id: T) => void; className?: string; rotulo?: string
}) {
  if (opcoes.length > 4 && import.meta.env.DEV) console.warn(`Segmentado: no máximo 4 opções; vieram ${opcoes.length}.`)
  return <SegmentadoDuo opcoes={opcoes.slice(0, 4)} valor={valor} aoMudar={(id) => aoMudar(id as T)} rotulo={rotulo} className={className} />
}

export type ItemMenu = { rotulo: string; aoEscolher: () => void; perigo?: boolean }

export function CabecalhoTela({ voltar, titulo, trocar, acao, menu, className }: {
  voltar?: { para: string; rotulo: string }
  titulo: ReactNode
  /** encaixe ao lado do título: o seletor de turma, por exemplo */
  trocar?: ReactNode
  /** no máximo uma ação */
  acao?: ReactNode
  /** o raro, no "⋯" */
  menu?: ItemMenu[]
  className?: string
}) {
  return (
    <header className={cn('flex min-h-16 shrink-0 items-center gap-2 md:pr-[var(--reserva-sino,0px)]', className)}>
      {voltar && (
        <Link to={voltar.para} aria-label={`Voltar para ${voltar.rotulo}`} title={voltar.rotulo}
          className="-ml-2 inline-flex h-10 shrink-0 items-center gap-0.5 rounded-[12px] pl-1.5 pr-3 text-[15px] font-bold text-sutil transition-colors duration-150 hover:bg-fundo-suave hover:text-tinta">
          <ChevronLeft className="size-5" strokeWidth={2.5} /> <span className="max-md:hidden">{voltar.rotulo}</span>
        </Link>
      )}
      <h1 className="t-titulo min-w-0 truncate text-tinta">{titulo}</h1>
      {trocar && <div className="shrink-0">{trocar}</div>}
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {acao}
        {menu && menu.length > 0 && <MenuMais itens={menu} />}
      </div>
    </header>
  )
}

/** Endereço antigo → endereço novo, com replace. Troca os `:parâmetros` do destino pelos do endereço de origem e
    SOMA a consulta de quem chegou à do destino (14ª rodada: `/coordenacao/ia?ver=como&ia=tutor` →
    `/coordenacao/registros?aba=ia&ver=como&ia=tutor`); o que o destino fixa vence. Leva o # de quem chegou quando o
    destino não traz o seu. */
export function Redireciona({ para, tirar = [] }: { para: string; /** parâmetros de quem chegou que não seguem */ tirar?: string[] }) {
  const params = useParams()
  const { search, hash } = useLocation()
  const destino = para.replace(/:([A-Za-z]+)/g, (_, nome: string) => encodeURIComponent(params[nome] ?? ''))
  const [comConsulta, ancora] = destino.split('#')
  const [caminho, consultaDestino = ''] = comConsulta.split('?')
  const soma = new URLSearchParams(search)
  tirar.forEach((k) => soma.delete(k))
  new URLSearchParams(consultaDestino).forEach((v, k) => soma.set(k, v))
  const q = soma.toString()
  return <Navigate to={`${caminho}${q ? `?${q}` : ''}${ancora !== undefined ? `#${ancora}` : hash}`} replace />
}
