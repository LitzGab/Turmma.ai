import { TONS } from '../onca/paleta'
import { FAMILIA_DO_ICONE, type FamiliaIcone, type IconeId } from './ids'
import type { Desenho } from './base'
import { LUGARES } from './lugares'
import { FILA } from './fila'
import { TAREFAS } from './tarefas'
import { MATERIAS } from './materias'
import { METRICAS } from './metricas'
import { ACOES } from './acoes'

/* O ÍCONE ILUSTRADO (sistema-turmma-duolingo.md, 2.5): chapado, colorido, desenhado por nós.
   `familia` troca a cor dominante (a tarefa do aluno pinta com a cor da matéria).
   Com `rotulo`, vira imagem com nome; sem ele, fica escondido do leitor de tela (o texto ao lado já diz). */

const DESENHOS: Record<IconeId, Desenho> = { ...LUGARES, ...FILA, ...TAREFAS, ...MATERIAS, ...METRICAS, ...ACOES }

export function Icone({ id, tamanho = 32, familia, className, rotulo }: {
  id: IconeId; tamanho?: number; familia?: FamiliaIcone; className?: string; rotulo?: string
}) {
  const c = TONS[familia ?? FAMILIA_DO_ICONE[id]]
  const a11y = rotulo ? { role: 'img' as const, 'aria-label': rotulo } : { 'aria-hidden': true as const }
  return (
    <svg viewBox="0 0 48 48" width={tamanho} height={tamanho} className={className} style={{ flex: 'none' }} {...a11y}>
      {DESENHOS[id](c)}
    </svg>
  )
}

/** Atalho: o mesmo que <Icone id="inicio" …/>. */
export const IconeLugar = Icone
