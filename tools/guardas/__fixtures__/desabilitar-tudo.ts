/* eslint-disable -- reprova: @eslint-community/eslint-comments/no-restricted-disable */
// Desligar tudo de uma vez também desliga as guardas.
declare const logger: Record<'info', (...argumentos: unknown[]) => void>
declare const nome: string

logger.info({ nome })
