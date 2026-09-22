/* trophyso/leaderboard-podium — peça do 21st.dev (id 13057), colada pelo Gabriel em 20/09/2026.
   FICOU a anatomia: pódio na ordem 2º · 1º · 3º, avatar com o selo da coroa, nome, valor e o bloco com a altura por
   posição e o número dentro; tamanhos sm · default · lg; `medalStyle`, `showValue` e `showAvatar` como vieram.
   O QUE MUDOU NA ADOÇÃO
   · saiu a FOTO (o pravatar é retrato de gente, e aluno não tem foto — regra 20, item 2): o avatar é o círculo com as
     INICIAIS, e o tipo ganhou a prop `initials`;
   · saíram ouro, prata e bronze: rank-1 é o laranja da pinta, rank-2 o preto, rank-3 o cinza (tokens em index.css).
     Os blocos usam a cor com opacidade, como na peça; o número dentro do bloco tem cor própria para continuar legível;
   · EMPATE: a peça esperava uma pessoa por posição. Aqui `rankings` aceita várias com o mesmo `rank`; quando a
     posição é dividida, o avatar vira o GRUPO de iniciais em cima do degrau (fileiras de três, com "+N"), a coroa
     sobe para o alto do grupo e o nome vira "9 alunos" (`tieLabel`);
   · `fill`: os blocos esticam até a altura que o pai der, na proporção 1 · 0,8 · 0,7 da peça (160 · 128 · 112);
   · o valor ganhou sufixo ("260 pts") e número em pt-BR; saiu o `tabular-nums` (regra do sistema de design);
   · textos e rótulos de acessibilidade em português;
   · OITAVA RODADA (a turma na pele da Teachy): nome, valor, iniciais e o número do degrau em Quicksand 700; o degrau
     com canto de 8 px em cima. A anatomia não mudou.
   A REGRA DOS PONTOS (src/dados/ranking.ts): presença na aula +10 · atividade entregue +20. Nota, acerto e
   dificuldade não entram. É ranking de PARTICIPAÇÃO: só fato registrado, nunca atenção, humor ou jeito (D57, D66). */
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Crown } from "lucide-react"

import { cn } from "@/lib/utils"

interface LeaderboardRanking {
  userId: string
  userName: string | null
  rank: number
  value: number
  /** as iniciais do avatar: aluno não tem foto */
  initials?: string | null
}

const podiumVariants = cva("flex justify-center gap-4", {
  variants: {
    size: {
      sm: "gap-2",
      default: "gap-4",
      lg: "gap-6",
    },
    fill: {
      true: "items-stretch",
      false: "items-end",
    },
  },
  defaultVariants: {
    size: "default",
    fill: false,
  },
})

// A veste de cada posição. `number` é a cor do número dentro do bloco; `soft` é o fundo do círculo sem avatar;
// `grow` é a parte da altura livre que o bloco ocupa no modo `fill` (a proporção 160 · 128 · 112 da peça).
const PODIUM_CONFIG = {
  1: {
    icon: Crown,
    color: "text-rank-1",
    bg: "bg-rank-1/90",
    soft: "bg-rank-1/15",
    number: "text-tinta",
    ringColor: "ring-rank-1/60",
    height: "h-32",
    heightSm: "h-24",
    heightLg: "h-40",
    minHeight: "min-h-32",
    minHeightSm: "min-h-24",
    minHeightLg: "min-h-40",
    grow: 1,
  },
  2: {
    icon: Crown,
    color: "text-rank-2",
    bg: "bg-rank-2/90",
    soft: "bg-rank-2/10",
    number: "text-white",
    ringColor: "ring-rank-2/40",
    height: "h-24",
    heightSm: "h-20",
    heightLg: "h-32",
    minHeight: "min-h-24",
    minHeightSm: "min-h-20",
    minHeightLg: "min-h-32",
    grow: 0.8,
  },
  3: {
    icon: Crown,
    color: "text-rank-3",
    bg: "bg-rank-3/30",
    soft: "bg-rank-3/15",
    number: "text-apoio",
    ringColor: "ring-rank-3/50",
    height: "h-20",
    heightSm: "h-16",
    heightLg: "h-28",
    minHeight: "min-h-20",
    minHeightSm: "min-h-16",
    minHeightLg: "min-h-28",
    grow: 0.7,
  },
} as const

interface LeaderboardPodiumProps
  extends
    React.HTMLAttributes<HTMLDivElement>,
    Omit<VariantProps<typeof podiumVariants>, "fill"> {
  /** Quem está nas três primeiras posições. Várias entradas com o mesmo `rank` = posição dividida. */
  rankings: LeaderboardRanking[]
  /** Mostra o valor embaixo do nome */
  showValue?: boolean
  /** Mostra o avatar de iniciais (sem ele, o círculo traz só a coroa) */
  showAvatar?: boolean
  /** Estilo do selo da coroa */
  medalStyle?: "classic" | "modern" | "minimal"
  /** Sufixo do valor: "pts" */
  valueSuffix?: string
  /** O "nome" de uma posição dividida */
  tieLabel?: (count: number) => string
  /** Quantas iniciais o grupo mostra antes do "+N" (em fileiras de três) */
  maxStack?: number
  /** Os blocos esticam até a altura que o pai der, na proporção da peça; a altura do tamanho vira o mínimo */
  fill?: boolean
}

function iniciaisDe(r: LeaderboardRanking) {
  if (r.initials) return r.initials
  const partes = (r.userName ?? r.userId).trim().split(/\s+/)
  return (partes[0][0] + (partes[1]?.[0] ?? "")).toUpperCase()
}

const LeaderboardPodium = React.forwardRef<
  HTMLDivElement,
  LeaderboardPodiumProps
>(
  (
    {
      className,
      size,
      rankings,
      showValue = true,
      showAvatar = true,
      medalStyle = "classic",
      valueSuffix,
      tieLabel = (n) => `${n} empatados`,
      maxStack = 5,
      fill = false,
      ...props
    },
    ref
  ) => {
    // Ordem do pódio: 2º, 1º, 3º. Cada degrau junta quem divide a posição.
    const podiumOrder = ([2, 1, 3] as const)
      .map((rank) => ({ rank, people: rankings.filter((r) => r.rank === rank) }))
      .filter((step) => step.people.length > 0)

    if (podiumOrder.length === 0) {
      return null
    }

    const tamanho = size ?? "default"

    const avatarSize = {
      sm: "h-10 w-10 text-sm",
      default: "h-14 w-14 text-lg",
      lg: "h-20 w-20 text-2xl",
    }[tamanho]

    // o grupo de quem divide a posição: três por fileira, sem passar da largura do bloco
    const groupSize = {
      sm: "h-6 w-6 text-[9px]",
      default: "h-7 w-7 text-[10px]",
      lg: "h-9 w-9 text-[12px]",
    }[tamanho]
    const groupOverlap = { sm: "-ml-1", default: "-ml-1", lg: "-ml-1.5" }[tamanho]
    const groupRowOverlap = { sm: "-mt-1", default: "-mt-1", lg: "-mt-1.5" }[tamanho]

    const iconSize = {
      sm: "h-4 w-4",
      default: "h-5 w-5",
      lg: "h-6 w-6",
    }[tamanho]

    const textSize = {
      sm: "text-xs",
      default: "text-sm",
      lg: "text-[15px]",
    }[tamanho]

    const formata = (v: number) =>
      `${v.toLocaleString("pt-BR")}${valueSuffix ? ` ${valueSuffix}` : ""}`

    return (
      <div
        ref={ref}
        className={cn(podiumVariants({ size, fill }), className)}
        role="list"
        aria-label="As três primeiras posições"
        {...props}
      >
        {podiumOrder.map(({ rank, people }) => {
          const config = PODIUM_CONFIG[rank]
          const dividida = people.length > 1
          const first = people[0]
          const nomes = people.map((p) => p.userName || iniciaisDe(p))
          const displayName = dividida ? tieLabel(people.length) : nomes[0]
          const podiumHeight = fill
            ? { sm: config.minHeightSm, default: config.minHeight, lg: config.minHeightLg }[tamanho]
            : { sm: config.heightSm, default: config.height, lg: config.heightLg }[tamanho]

          const itemLabel = `${rank}º lugar: ${nomes.join(", ")}${showValue ? `, ${formata(first.value)}` : ""}`

          // até `maxStack` iniciais e, se sobrar gente, o "+N" no último lugar
          const cabemTodos = people.length <= maxStack + 1
          const visiveis = cabemTodos ? people : people.slice(0, maxStack)
          const resto = people.length - visiveis.length
          const lugares: (LeaderboardRanking | number)[] = resto > 0 ? [...visiveis, resto] : visiveis
          const fileiras: (LeaderboardRanking | number)[][] = []
          for (let i = 0; i < lugares.length; i += 3) fileiras.push(lugares.slice(i, i + 3))

          return (
            <div
              key={rank}
              role="listitem"
              aria-label={itemLabel}
              className="flex min-w-0 flex-col items-center"
            >
              {/* no modo `fill`, o que sobra acima do degrau mais baixo */}
              {fill && <div aria-hidden="true" style={{ flex: `${1 - config.grow} 1 0px` }} />}

              {/* Avatar (ou o grupo de quem divide a posição) com a coroa */}
              <div className={cn("relative mb-2 shrink-0", dividida && showAvatar && medalStyle !== "minimal" && "mt-4")} aria-hidden="true">
                {!showAvatar ? (
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-full",
                      avatarSize,
                      config.soft
                    )}
                  >
                    <config.icon className={cn(iconSize, config.color)} />
                  </div>
                ) : dividida ? (
                  <div className="flex flex-col items-center" title={nomes.join(" · ")}>
                    {fileiras.map((fileira, f) => (
                      <div key={f} className={cn("relative flex", f > 0 && groupRowOverlap)} style={{ zIndex: f + 1 }}>
                        {fileira.map((lugar, i) => (
                          <span
                            key={typeof lugar === "number" ? "resto" : lugar.userId}
                            className={cn(
                              "ring-superficie font-teachy relative flex shrink-0 items-center justify-center rounded-full font-bold ring-2",
                              typeof lugar === "number" ? "bg-realce text-apoio" : "bg-tinta text-white",
                              groupSize,
                              i > 0 && groupOverlap
                            )}
                          >
                            {typeof lugar === "number" ? `+${lugar}` : iniciaisDe(lugar)}
                          </span>
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "bg-realce-suave text-tinta ring-offset-superficie font-teachy flex items-center justify-center rounded-full font-bold ring-2 ring-offset-2",
                      avatarSize,
                      config.ringColor
                    )}
                  >
                    {iniciaisDe(first)}
                  </div>
                )}

                {/* Selo da coroa: no canto do avatar, como na peça; no alto do grupo, quando a posição é dividida */}
                {medalStyle !== "minimal" && (
                  <div
                    className={cn(
                      "bg-background absolute z-10 flex items-center justify-center rounded-full shadow-sm",
                      dividida && showAvatar
                        ? "-top-4 left-1/2 -translate-x-1/2"
                        : "-right-1 -bottom-1",
                      tamanho === "sm"
                        ? "h-5 w-5"
                        : tamanho === "lg" && !(dividida && showAvatar)
                          ? "h-8 w-8"
                          : "h-6 w-6"
                    )}
                  >
                    <config.icon
                      className={cn(
                        config.color,
                        tamanho === "sm"
                          ? "h-3 w-3"
                          : tamanho === "lg" && !(dividida && showAvatar)
                            ? "h-5 w-5"
                            : "h-4 w-4"
                      )}
                    />
                  </div>
                )}
              </div>

              {/* Nome */}
              <span
                className={cn(
                  "text-tinta font-teachy shrink-0 truncate text-center font-bold",
                  tamanho === "lg" ? "max-w-28" : "max-w-20",
                  textSize
                )}
                title={dividida ? nomes.join(" · ") : displayName}
              >
                {displayName}
              </span>

              {/* Valor */}
              {showValue && (
                <span
                  className={cn(
                    "text-sutil shrink-0 whitespace-nowrap",
                    tamanho === "sm" ? "text-xs" : "text-[12px] leading-4"
                  )}
                >
                  {formata(first.value)}
                </span>
              )}

              {/* Bloco do pódio */}
              <div
                aria-hidden="true"
                style={fill ? { flex: `${config.grow} 1 0px` } : undefined}
                className={cn(
                  "mt-2 w-22 rounded-t-[8px]",
                  tamanho === "sm" && "w-20",
                  tamanho === "lg" && "w-24",
                  podiumHeight,
                  config.bg,
                  medalStyle === "modern" && "rounded-t-[12px]"
                )}
              >
                <div
                  className={cn(
                    "font-teachy flex h-9 items-center justify-center text-[16px] font-bold",
                    config.number
                  )}
                >
                  {rank}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }
)
LeaderboardPodium.displayName = "LeaderboardPodium"

export { LeaderboardPodium, podiumVariants }
export type { LeaderboardPodiumProps, LeaderboardRanking }
