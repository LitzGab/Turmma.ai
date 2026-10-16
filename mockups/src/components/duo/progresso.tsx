import { cn } from '@/lib/utils'
import { familia as estiloFamilia, type Familia } from './familia'

/* A BARRA DE PROGRESSO (11ª rodada; seção 3.6).
   Altura 16 (12 dentro de linha), trilho cinza (borda) e o preenchimento na face da família, com o BRILHO por cima:
   branco a 20%, 30% da altura, a 25% do topo. O preenchimento anda por transform: scaleX(), com origem à esquerda,
   em 400 ms. O texto "2 de 8" vai FORA da barra.
   Só mede o que tem fim (questões da tarefa, passos, pacote do mês). Nunca tempo de uso, dias seguidos ou pontos
   (seção 8: ECA Digital e Decreto 12.880). */

export function BarraProgresso({ valor, max = 100, familia = 'laranja', altura = 16, rotulo, className }: {
  valor: number
  max?: number
  familia?: Familia
  altura?: 16 | 12
  /** o que a barra mede, para o leitor de tela */
  rotulo?: string
  className?: string
}) {
  const fracao = max > 0 ? Math.min(1, Math.max(0, valor / max)) : 0
  return (
    <div role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={valor} aria-label={rotulo}
      style={{ ...estiloFamilia(familia), height: altura }}
      className={cn('relative w-full overflow-hidden rounded-full bg-borda', className)}>
      <div className="absolute inset-0 origin-left rounded-full bg-(--face) transition-transform duration-[400ms] ease-out"
        style={{ transform: `scaleX(${fracao})` }}>
        <span aria-hidden className="absolute inset-x-2 top-[25%] h-[30%] rounded-full bg-[rgba(255,255,255,.2)]" />
      </div>
    </div>
  )
}
