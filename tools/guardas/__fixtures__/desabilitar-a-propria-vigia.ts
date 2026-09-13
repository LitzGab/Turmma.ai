/* eslint-disable @eslint-community/eslint-comments/no-restricted-disable, guardas/log-sem-dado-pessoal */
// A diretiva desliga a regra que vigia as diretivas: o ESLint normal não acusa nada. Só a
// passada sem comentários (tools/guardas/lint.ts) pega a violação.
declare const logger: Record<'info', (...argumentos: unknown[]) => void>
declare const nome: string

logger.info({ nome })
