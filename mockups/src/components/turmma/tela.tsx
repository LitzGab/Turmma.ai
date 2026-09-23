import type { ReactNode } from 'react'
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
const LARGURA = { conversa: 'max-w-[760px]', media: 'max-w-[1040px]', tabela: 'max-w-[1480px]' }

export function Tela({ titulo, descricao, acoes, largura = 'tabela', objeto = false, children, className }: {
  titulo: ReactNode; descricao?: ReactNode; acoes?: ReactNode
  largura?: 'conversa' | 'media' | 'tabela'; objeto?: boolean; children: ReactNode; className?: string
}) {
  return (
    <div className={cn('mx-auto w-full px-4 pb-8 pt-4 md:px-6 md:pt-5', LARGURA[largura], className)}>
      {objeto ? (
        <header className="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2.5">
          <div className="min-w-0">
            <h1 className="titulo-tela text-tinta">{titulo}</h1>
            {descricao && <p className="mt-1 max-w-[80ch] text-sm text-sutil">{descricao}</p>}
          </div>
          {acoes && <div className="flex flex-wrap items-center gap-2">{acoes}</div>}
        </header>
      ) : (
        <>
          <h1 className="sr-only">{titulo}</h1>
          {acoes && <div className="mb-4 flex flex-wrap items-center gap-2">{acoes}</div>}
        </>
      )}
      {children}
    </div>
  )
}

/** Tela de trabalho: ocupa a altura da janela (menos a barra do celular) e rola por dentro. */
export function TelaCheia({ titulo, children, className }: { titulo: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex h-[calc(100svh-56px)] min-h-0 flex-col px-4 pb-4 pt-4 md:h-svh md:px-6', className)}>
      <h1 className="sr-only">{titulo}</h1>
      {children}
    </div>
  )
}

/** Cartão de linha fina, sem sombra (9.3). Respiro de 16 px, 20 px a partir de 1024 px. */
export function Cartao({ children, className, titulo, acao }: { children: ReactNode; className?: string; titulo?: ReactNode; acao?: ReactNode }) {
  return (
    <section className={cn('rounded-cartao border border-linha bg-superficie p-4 lg:p-5', className)}>
      {(titulo || acao) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="font-corpo text-base font-semibold leading-snug text-tinta">{titulo}</h2>}
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
    <div className={cn('rounded-cartao border border-linha bg-superficie p-4 lg:p-5', className)}>
      <p className="rotulo">{rotulo}</p>
      <p className="numero-painel mt-3 text-tinta">{valor}</p>
      {apoio && <div className="mt-2 text-sm text-sutil">{apoio}</div>}
    </div>
  )
}

/** Barra com rótulo e número ao lado (shadcn/progress). O MVP vive de barra, não de gráfico (10.2). */
export function BarraRotulada({ rotulo, detalhe, valor, sufixo = '%', tom = 'noite', className }: {
  rotulo: ReactNode; detalhe?: ReactNode; valor: number; sufixo?: string
  tom?: 'noite' | 'neutro' | 'caramelo' | 'ok'; className?: string
}) {
  const cor = { noite: '[&>div]:bg-noite', neutro: '[&>div]:bg-sutil', caramelo: '[&>div]:bg-caramelo', ok: '[&>div]:bg-ok' }[tom]
  return (
    <div className={cn('grid gap-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 text-sm text-tinta"><span className="font-medium">{rotulo}</span>{detalhe && <span className="text-sutil"> · {detalhe}</span>}</p>
        <p className="shrink-0 text-sm font-semibold tabular-nums text-tinta">{valor}{sufixo}</p>
      </div>
      <Progress value={valor} className={cn('h-2 rounded-full bg-ia-cx', cor)} />
    </div>
  )
}

/** Nota de planejamento (fase, decisões, peças). Em 20/09/2026 o Gabriel pediu para tirar da tela tudo que diz
    "mockup": o texto continua no código, para quem for construir, e não é mais desenhado. */
export function NotaMockup(props: { children: ReactNode }) {
  void props
  return null
}
