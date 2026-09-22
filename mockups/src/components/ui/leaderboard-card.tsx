/* trophyso/leaderboard-card — peça do 21st.dev (id 13053), colada pelo Gabriel em 20/09/2026.
   FICOU a anatomia: o cartão com o título, o intervalo de datas e o seletor no alto; o pódio; e a lista com
   paginação de 10 embaixo. O seletor continua controlado (`selectedRunId` + `onRunChange`) ou solto, como veio.
   O QUE MUDOU NA ADOÇÃO
   · o <select> nativo virou o nosso controle em pílula (Semana · Mês · Bimestre), igual à alternância do produto;
   · as datas saem em pt-BR e sem ano ("24 de ago. a 21 de set."; no mesmo mês, "15 a 21 de set."). A data "AAAA-MM-DD"
     é lida como dia local: `new Date("2026-08-24")` é UTC e, no Brasil, virava dia 23;
   · `rankings` ficou opcional: na aba da turma a lista mora na coluna ao lado, e o cartão fica com o pódio. Entraram
     `description` (o que vai depois das datas), `podiumSize`, `podiumProps`, `listProps` e `children` (a faixa da regra);
   · a casca é a do produto: canto de 16, linha fina, sem sombra; textos em português.
   A foto e o ouro, prata e bronze saíram nas duas peças de dentro (ver leaderboard-podium e leaderboard-rankings).
   OITAVA RODADA (20/09/2026, a turma na pele da Teachy): a anatomia é a mesma; a casca virou o cartão dela (canto 12,
   fio de 1 px, respiro 16), o título é o rótulo de cartão (ícone de 16 px em laranja + Quicksand 14/700) com as datas
   em 12 px cinza, e o seletor em pílula virou o seletor de período dela (`Periodo`, canto 4). Na aba Ranking o seletor
   mora no cabeçalho da aba, então o cartão vem sem `runOptions`.
   A REGRA DOS PONTOS (src/dados/ranking.ts): presença na aula +10 · atividade entregue +20. Nota, acerto e
   dificuldade não entram. É ranking de PARTICIPAÇÃO: só fato registrado, nunca atenção, humor ou jeito (D57, D66). */
import * as React from "react"

import { cn } from "@/lib/utils"
import { Periodo } from "@/components/turmma/teachy"
import {
  LeaderboardPodium,
  type LeaderboardPodiumProps,
  type LeaderboardRanking as LeaderboardPodiumRanking,
} from "@/components/ui/leaderboard-podium"
import {
  LeaderboardRankings,
  type LeaderboardRankingItem,
  type LeaderboardRankingsProps,
} from "@/components/ui/leaderboard-rankings"

interface LeaderboardRunOption {
  id: string
  label: string
}

interface LeaderboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  /** o ícone pequeno do rótulo do cartão (16 px, em laranja) */
  icon?: React.ReactNode
  fromDate: string | Date
  toDate: string | Date
  /** O que vai depois do intervalo de datas, na mesma linha: "16 aulas · 5 atividades" */
  description?: React.ReactNode
  podiumRankings: LeaderboardPodiumRanking[]
  podiumSize?: LeaderboardPodiumProps["size"]
  podiumProps?: Omit<LeaderboardPodiumProps, "rankings" | "size">
  /** A lista embaixo do pódio. Sem ela, o cartão fica só com o pódio (a lista mora em outro lugar). */
  rankings?: LeaderboardRankingItem[]
  listProps?: Omit<LeaderboardRankingsProps, "rankings" | "currentUserId">
  currentUserId?: string
  runOptions?: LeaderboardRunOption[]
  selectedRunId?: string
  onRunChange?: (runId: string) => void
  /** Rótulo do seletor para leitor de tela */
  runLabel?: string
}

function parseLocalDate(date: string | Date) {
  if (date instanceof Date) return date
  const soDia = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  return soDia
    ? new Date(Number(soDia[1]), Number(soDia[2]) - 1, Number(soDia[3]))
    : new Date(date)
}

const diaEMes = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "short" })

/** "24 de ago. a 21 de set."; no mesmo mês, "15 a 21 de set.". */
function formatRange(from: string | Date, to: string | Date) {
  const de = parseLocalDate(from)
  const ate = parseLocalDate(to)
  if (Number.isNaN(de.getTime()) || Number.isNaN(ate.getTime())) return ""
  const mesmoMes =
    de.getMonth() === ate.getMonth() && de.getFullYear() === ate.getFullYear()
  return `${mesmoMes ? de.getDate() : diaEMes.format(de)} a ${diaEMes.format(ate)}`
}

const LeaderboardCard = React.forwardRef<HTMLDivElement, LeaderboardCardProps>(
  (
    {
      className,
      title = "Ranking",
      icon,
      fromDate,
      toDate,
      description,
      podiumRankings,
      podiumSize,
      podiumProps,
      rankings,
      listProps,
      currentUserId,
      runOptions,
      selectedRunId,
      onRunChange,
      runLabel = "Período do ranking",
      children,
      ...props
    },
    ref
  ) => {
    const rangeLabel = formatRange(fromDate, toDate)
    const resolvedRunId = selectedRunId ?? runOptions?.[0]?.id ?? ""
    const hasOnRunChange = Boolean(onRunChange)
    const [localRunId, setLocalRunId] = React.useState(resolvedRunId)

    React.useEffect(() => {
      if (hasOnRunChange) return
      setLocalRunId(resolvedRunId)
    }, [hasOnRunChange, resolvedRunId])

    const activeRunId = hasOnRunChange ? resolvedRunId : localRunId
    const { className: podiumClassName, ...restoDoPodio } = podiumProps ?? {}

    return (
      <div
        ref={ref}
        className={cn(
          "border-linha bg-superficie flex min-w-0 flex-col rounded-[12px] border p-4",
          className
        )}
        {...props}
      >
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-x-3 gap-y-2.5">
          <div className="flex min-w-0 items-start gap-2">
            {icon ? (
              <span aria-hidden="true" className="text-caramelo mt-1 shrink-0 [&_svg]:size-4">
                {icon}
              </span>
            ) : null}
            <div className="min-w-0">
              <h3 className="font-teachy text-tinta text-[14px] leading-6 font-bold">
                {title}
              </h3>
              <p className="text-inativo text-[12px] leading-4">
                {rangeLabel}
                {description ? <> · {description}</> : null}
              </p>
            </div>
          </div>

          {runOptions && runOptions.length > 0 ? (
            <Periodo
              className="shrink-0"
              opcoes={runOptions.map((option) => option.label)}
              valor={runOptions.find((option) => option.id === activeRunId)?.label ?? ""}
              aoMudar={(label) => {
                const option = runOptions.find((o) => o.label === label)
                if (!option) return
                if (onRunChange) {
                  onRunChange(option.id)
                  return
                }
                setLocalRunId(option.id)
              }}
            />
          ) : null}
        </div>

        <LeaderboardPodium
          rankings={podiumRankings}
          size={podiumSize}
          className={cn("mt-5", podiumClassName)}
          {...restoDoPodio}
        />

        {children}

        {rankings ? (
          <LeaderboardRankings
            rankings={rankings}
            currentUserId={currentUserId}
            showPagination
            defaultPageSize={10}
            {...listProps}
            className={cn("mt-5", listProps?.className)}
          />
        ) : null}
      </div>
    )
  }
)

LeaderboardCard.displayName = "LeaderboardCard"

export { LeaderboardCard }
export type { LeaderboardCardProps, LeaderboardRunOption }
