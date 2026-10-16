/* trophyso/leaderboard-rankings — peça do 21st.dev (id 13063). O Gabriel colou a leaderboard-card e a
   leaderboard-podium em 20/09/2026; esta é a terceira da família, de que a card depende: o código veio do catálogo
   (`21st get 13063`) no mesmo dia.
   FICOU a anatomia: uma linha por pessoa com posição, coroa nas três primeiras, avatar, nome, "byline", variação de
   posição e valor; a linha do usuário atual em destaque (`currentUserId`); as reticências para trechos escondidos
   (`displayed: false`); `onUserClick`; e a paginação (`showPagination`, `defaultPageSize` de 10 · 25 · 50 · 100).
   O QUE MUDOU NA ADOÇÃO
   · saiu a FOTO (`avatarUrl`): aluno não tem foto. O avatar é o círculo com as INICIAIS (prop `initials`);
   · a coroa usa rank-1 laranja · rank-2 preto · rank-3 cinza, e nada de ouro, prata e bronze. Com EMPATE (várias
     linhas com o mesmo `rank`) a coroa aparece só na primeira linha da posição e o número repetido fica em cinza;
   · a variação perdeu o verde e o vermelho da peça: ▲ em text-ok, ▼ em cinza (descer não é erro) e "—" quando igual;
   · o valor saiu do "1.2k" para o número inteiro em pt-BR e ganhou um trilho fino, proporcional ao primeiro colocado;
   · linhas de ALTURA IGUAL (46 px), com ou sem byline; a lista rola por dentro quando o pai dá a altura; abaixo de
     420 px o avatar some para a byline caber inteira;
   · a lista é um CONTÊINER (`@container`): o trilho só entra com 672 px de lista e o `bylineDetail` com 576 px. Antes
     os dois seguiam a largura da JANELA, e a byline saía cortada no celular e com a janela em 1280 px;
   · o <select> nativo do tamanho da página virou a alternância em pílula; ganhou `header` (a barra acima da lista);
   · textos em português;
   · OITAVA RODADA (20/09/2026, a turma na pele da Teachy): a anatomia é a mesma, a veste virou a TABELA dela — caixa de
     canto 8 com fio de 1 px; um cabeçalho de 49 px em #FAFAFA com o título das colunas em Quicksand 14/700 (`columns`:
     posição · aluno · fato · variação · pontos); linha de 48 px; o avatar é o círculo preto de 24 px com a inicial
     (`AvatarT`). Com largura (576 px de lista) a byline ganha a sua própria coluna, com o `bylineDetail` numa segunda
     linha miúda; mais estreita, a byline volta para baixo do nome e o detalhe some. A lista tem ALTURA NATURAL: quem rola é a página. A paginação trocou a pílula pelo canto 4 do seletor dela.
   A REGRA DOS PONTOS (src/dados/ranking.ts): presença na aula +10 · atividade entregue +20. Nota, acerto e
   dificuldade não entram. É ranking de PARTICIPAÇÃO: só fato registrado, nunca atenção, humor ou jeito (D57, D66). */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { ChevronLeft, ChevronRight, Crown, EllipsisIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { AvatarT } from "@/components/turmma/teachy"

interface LeaderboardRankingItem {
  userId: string
  userName: string | null
  rank: number
  value: number
  byline?: string | null
  /** o resto da byline, que só aparece quando a lista tem largura para ele (a byline nunca sai cortada) */
  bylineDetail?: string | null
  /** as iniciais do avatar: aluno não tem foto */
  initials?: string | null
  /** posições ganhas (+) ou perdidas (−) contra o período anterior; 0 mostra "—" */
  rankChange?: number
  displayed?: boolean
}

/* as colunas: posição · aluno · (fato, só com largura) · variação · pontos. O cabeçalho e as linhas usam a mesma grade. */
const GRADE =
  "grid grid-cols-[52px_minmax(0,1fr)_44px_52px] items-center gap-x-2 px-3 @xl:grid-cols-[64px_minmax(0,1fr)_minmax(0,1.15fr)_72px_64px] @xl:gap-x-3 @xl:px-4 @3xl:grid-cols-[64px_minmax(0,1fr)_minmax(0,1.15fr)_72px_176px]"

const rowVariants = cva(cn(GRADE, "border-linha border-t transition-colors duration-150 hover:bg-[#FAFAFA]"), {
  variants: {
    density: {
      default: "h-12",
      compact: "h-10",
    },
  },
  defaultVariants: { density: "default" },
})

interface LeaderboardColumns {
  rank: string
  user: string
  byline: string
  change: string
  value: string
}

const COLUNAS_PADRAO: LeaderboardColumns = {
  rank: "Posição",
  user: "Aluno",
  byline: "Participação",
  change: "Variação",
  value: "Pontos",
}

interface LeaderboardRankingsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof rowVariants> {
  rankings: LeaderboardRankingItem[]
  onUserClick?: (ranking: LeaderboardRankingItem) => void
  currentUserId?: string
  showPagination?: boolean
  defaultPageSize?: 10 | 25 | 50 | 100
  /** A barra acima da lista (fica parada enquanto a lista rola) */
  header?: React.ReactNode
  /** Trilho fino ao lado do valor, proporcional ao maior valor da lista */
  showTrack?: boolean
  /** O que a variação compara: "o mês anterior" */
  changeLabel?: string
  /** O título das colunas, no cabeçalho da tabela */
  columns?: Partial<LeaderboardColumns>
}

const crownColorMap = {
  1: "text-rank-1",
  2: "text-rank-2",
  3: "text-rank-3",
} as const

const pageSizeOptions = [10, 25, 50, 100] as const

type LeaderboardRow =
  | { type: "ranking"; ranking: LeaderboardRankingItem; repeated: boolean }
  | { type: "ellipsis"; key: string }

function iniciaisDe(r: LeaderboardRankingItem) {
  if (r.initials) return r.initials
  const partes = (r.userName ?? r.userId).trim().split(/\s+/)
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase()
}

/** ▲ e ▼ desenhados: o triângulo de fonte muda de tamanho de um sistema para o outro. */
function Seta({ paraCima }: { paraCima: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 8 6" className={cn("h-[6px] w-2 shrink-0 fill-current", !paraCima && "rotate-180")}>
      <path d="M4 0 8 6H0z" />
    </svg>
  )
}

const LeaderboardRankings = React.forwardRef<
  HTMLDivElement,
  LeaderboardRankingsProps
>(
  (
    {
      className,
      rankings,
      onUserClick,
      currentUserId,
      showPagination = false,
      defaultPageSize = 10,
      header,
      showTrack = true,
      changeLabel = "o período anterior",
      columns,
      density,
      ...props
    },
    ref
  ) => {
    const [pageSize, setPageSize] = React.useState<10 | 25 | 50 | 100>(
      defaultPageSize
    )
    const [currentPage, setCurrentPage] = React.useState(1)

    const totalPages = Math.max(1, Math.ceil(rankings.length / pageSize))

    React.useEffect(() => {
      setCurrentPage(1)
    }, [pageSize])

    React.useEffect(() => {
      if (currentPage > totalPages) {
        setCurrentPage(totalPages)
      }
    }, [currentPage, totalPages])

    const pagedRankings = showPagination
      ? rankings.slice((currentPage - 1) * pageSize, currentPage * pageSize)
      : rankings

    const titulos = { ...COLUNAS_PADRAO, ...columns }
    const temByline = rankings.some((r) => r.byline)

    const topValue = React.useMemo(
      () => Math.max(1, ...rankings.map((r) => r.value)),
      [rankings]
    )

    const rows = React.useMemo<LeaderboardRow[]>(() => {
      const nextRows: LeaderboardRow[] = []
      let hiddenRunCount = 0
      let previousRank: number | null = null

      pagedRankings.forEach((ranking, index) => {
        const isDisplayed = ranking.displayed !== false
        if (!isDisplayed) {
          hiddenRunCount += 1
          return
        }

        if (hiddenRunCount > 0) {
          nextRows.push({ type: "ellipsis", key: `ellipsis-${index}` })
          hiddenRunCount = 0
          previousRank = null
        }

        nextRows.push({ type: "ranking", ranking, repeated: previousRank === ranking.rank })
        previousRank = ranking.rank
      })

      if (hiddenRunCount > 0) {
        nextRows.push({ type: "ellipsis", key: "ellipsis-tail" })
      }

      return nextRows
    }, [pagedRankings])

    return (
      <div
        ref={ref}
        className={cn(
          "border-linha bg-superficie @container flex w-full min-w-0 flex-col overflow-hidden rounded-[8px] border",
          className
        )}
        {...props}
      >
        {header ? (
          <div className="border-linha shrink-0 border-b">{header}</div>
        ) : null}

        <div
          aria-hidden="true"
          className={cn(
            GRADE,
            "font-teachy text-tinta h-[49px] shrink-0 bg-[#FAFAFA] text-[14px] leading-6 font-bold"
          )}
        >
          <span>{titulos.rank}</span>
          <span>{titulos.user}</span>
          <span className="hidden truncate @xl:block">{temByline ? titulos.byline : ""}</span>
          <span className="truncate text-right" title={`Posições ganhas ou perdidas contra ${changeLabel}`}>
            <span className="@xl:hidden">±</span>
            <span className="hidden @xl:inline">{titulos.change}</span>
          </span>
          <span className="text-right">{titulos.value}</span>
        </div>

        <div role="list" aria-label="Classificação">
          {rows.map((row) => {
            if (row.type === "ellipsis") {
              return (
                <div
                  key={row.key}
                  role="listitem"
                  aria-label="Linhas recolhidas"
                  className="text-inativo border-linha flex items-center justify-center border-t px-4 py-2"
                >
                  <EllipsisIcon className="h-5 w-5" />
                </div>
              )
            }

            const ranking = row.ranking
            const displayName =
              ranking.userName || `Aluno ${ranking.userId.slice(0, 6)}`
            const showCrown = ranking.rank <= 3 && !row.repeated
            const crownColor = crownColorMap[ranking.rank as 1 | 2 | 3]
            const isCurrentUser = currentUserId === ranking.userId
            const change = ranking.rankChange

            return (
              <div
                key={ranking.userId}
                role="listitem"
                tabIndex={onUserClick ? 0 : undefined}
                onClick={() => onUserClick?.(ranking)}
                onKeyDown={
                  onUserClick
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault()
                          onUserClick(ranking)
                        }
                      }
                    : undefined
                }
                className={cn(
                  rowVariants({ density }),
                  isCurrentUser &&
                    "bg-realce-suave hover:bg-realce-suave shadow-[inset_2px_0_0_var(--color-tinta)]",
                  onUserClick && "hover:bg-realce-suave cursor-pointer"
                )}
              >
                <div className="flex items-center gap-1">
                  <span
                    className={cn(
                      "font-teachy w-7 text-[14px] leading-none",
                      row.repeated
                        ? "text-inativo font-medium"
                        : "text-tinta font-bold"
                    )}
                  >
                    {ranking.rank}º
                  </span>
                  {showCrown ? (
                    <Crown
                      className={cn("h-4 w-4", crownColor)}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>

                <div className="flex min-w-0 items-center gap-2.5">
                  <AvatarT nome={iniciaisDe(ranking)} className="hidden min-[420px]:grid" />
                  <div className="min-w-0 flex-1">
                    <p className="text-tinta truncate text-[14px] leading-5">
                      {displayName}
                    </p>
                    {ranking.byline ? (
                      <p className="text-sutil truncate text-[12px] leading-4 @xl:hidden">
                        {ranking.byline}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="hidden min-w-0 @xl:block">
                  <p className="text-apoio truncate text-[13px] leading-[18px]">
                    {ranking.byline}
                  </p>
                  {ranking.bylineDetail ? (
                    <p className="text-inativo truncate text-[11px] leading-[14px]">
                      {ranking.bylineDetail}
                    </p>
                  ) : null}
                </div>

                {typeof change === "number" ? (
                  <p
                    title={
                      change === 0
                        ? `Mesma posição contra ${changeLabel}`
                        : `${change > 0 ? "Subiu" : "Desceu"} ${Math.abs(change)} ${Math.abs(change) === 1 ? "posição" : "posições"} contra ${changeLabel}`
                    }
                    className={cn(
                      "inline-flex items-center justify-end gap-1 text-[12px] leading-none font-medium",
                      change > 0
                        ? "text-ok"
                        : change < 0
                          ? "text-sutil"
                          : "text-inativo"
                    )}
                  >
                    {change === 0 ? (
                      "—"
                    ) : (
                      <>
                        <Seta paraCima={change > 0} />
                        {Math.abs(change)}
                      </>
                    )}
                  </p>
                ) : (
                  <span />
                )}

                <div className="flex items-center justify-end gap-3">
                  {showTrack ? (
                    <div
                      aria-hidden="true"
                      className="bg-realce hidden h-1.5 w-24 overflow-hidden rounded-full @3xl:block"
                    >
                      <div
                        className="bg-tinta h-full rounded-full"
                        style={{
                          width: `${Math.max(2, (ranking.value / topValue) * 100)}%`,
                        }}
                      />
                    </div>
                  ) : null}

                  <p className="font-teachy text-tinta text-right text-[14px] leading-none font-bold">
                    {ranking.value.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {showPagination ? (
          <div className="border-linha flex shrink-0 items-center justify-between gap-3 border-t px-3 py-1.5">
            <div
              role="group"
              aria-label="Linhas por página"
              className="flex items-center gap-2"
            >
              <span className="text-sutil text-[12px]">Mostrar</span>
              <div className="border-linha inline-flex overflow-hidden rounded-[4px] border">
                {pageSizeOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={pageSize === option}
                    onClick={() => setPageSize(option)}
                    className={cn(
                      "border-linha h-[26px] border-l px-2.5 text-[12px] leading-4 transition-colors duration-150 first:border-l-0",
                      pageSize === option
                        ? "bg-realce-suave text-tinta font-medium"
                        : "bg-superficie text-inativo hover:text-tinta"
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Página anterior"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="size-8 rounded-[8px] disabled:bg-transparent"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <span className="text-sutil text-[12px] whitespace-nowrap">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Próxima página"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="size-8 rounded-[8px] disabled:bg-transparent"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    )
  }
)

LeaderboardRankings.displayName = "LeaderboardRankings"

export { LeaderboardRankings, rowVariants }
export type { LeaderboardRankingItem, LeaderboardRankingsProps }
