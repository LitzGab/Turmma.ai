import type { FamiliaCor } from './paleta'

export type PoseOnca = 'acenando' | 'comemorando' | 'pensando' | 'apontando' | 'dormindo' | 'acolhendo'
export type ExpressaoCabeca = 'frente' | 'pensando' | 'feliz'
export type AgenteIA = 'tutor' | 'assistente' | 'analista'

/** A cor do anel de cada IA (pergunta 3 do sistema): Tutor laranja, Assistente azul, Analista anil. */
export const FAMILIA_DO_AGENTE: Record<AgenteIA, Extract<FamiliaCor, 'laranja' | 'azul' | 'anil'>> = {
  tutor: 'laranja',
  assistente: 'azul',
  analista: 'anil',
}
