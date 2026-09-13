/* eslint guardas/log-sem-dado-pessoal: off */
// Configurar a regra pelo comentário não passa pelo eslint-disable: o ESLint normal não acusa
// nada. Só a passada sem comentários (tools/guardas/lint.ts) pega a violação.
declare const logger: Record<'info', (...argumentos: unknown[]) => void>
declare const nome: string

logger.info({ nome })
