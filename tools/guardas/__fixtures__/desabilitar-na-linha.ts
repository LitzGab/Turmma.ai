// Tentativas de desligar uma guarda por comentário. A marca "reprova:" fica na descrição da
// própria diretiva, depois de "--".
declare const logger: Record<'info', (...argumentos: unknown[]) => void>
declare const nome: string

// eslint-disable-next-line guardas/log-sem-dado-pessoal -- reprova: @eslint-community/eslint-comments/no-restricted-disable
logger.info({ nome })
logger.info({ evento: 'teste', matricula: '1' }) // eslint-disable-line guardas/log-sem-dado-pessoal -- reprova: @eslint-community/eslint-comments/no-restricted-disable
/* eslint-disable-next-line @typescript-eslint/no-restricted-imports -- reprova: @eslint-community/eslint-comments/no-restricted-disable */
export { default } from 'openai'
