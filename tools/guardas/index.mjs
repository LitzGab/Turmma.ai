import comentarios from '@eslint-community/eslint-plugin-eslint-comments'
import { logSemConteudoMontado, logSemDadoPessoal } from './regras-log.mjs'
import { MENSAGEM_SDK_DE_IA, PASTA_DOS_ADAPTADORES, REGEX_SDK_DE_IA, sdkDeIaSoNoAdaptador } from './regras-ia.mjs'

/**
 * Guardas da esteira (RF11): o que as regras 20 e 30 proíbem reprova no lint, sem depender de
 * revisão humana. Entram por último no `eslint.config.mjs`, para nenhum bloco posterior as
 * sobrescrever, e não podem ser desligadas por comentário.
 */
export const guardas = {
  meta: { name: 'guardas' },
  rules: {
    'log-sem-dado-pessoal': logSemDadoPessoal,
    'log-sem-conteudo-montado': logSemConteudoMontado,
    'sdk-de-ia-so-no-adaptador': sdkDeIaSoNoAdaptador,
  },
}

export const REGRAS_DE_LOG = ['guardas/log-sem-dado-pessoal', 'guardas/log-sem-conteudo-montado']
export const REGRAS_DE_SDK_DE_IA = ['@typescript-eslint/no-restricted-imports', 'guardas/sdk-de-ia-so-no-adaptador']
export const REGRAS_DAS_GUARDAS = [...REGRAS_DE_LOG, ...REGRAS_DE_SDK_DE_IA]

const TODOS_OS_ARQUIVOS = ['**/*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}']

/**
 * Exceções fechadas, cada uma com o motivo. Um teste confere que a lista é exatamente esta:
 * exceção nova se discute na revisão, não entra em silêncio.
 */
export const EXCECOES_DAS_GUARDAS = [
  {
    // O adaptador é o único lugar onde o SDK do provedor existe (regra 30, item 1).
    files: [PASTA_DOS_ADAPTADORES],
    regras: REGRAS_DE_SDK_DE_IA,
  },
  {
    // O teste do redact precisa entregar chave pessoal ao logger para provar que ela sai removida.
    files: ['packages/nucleo/src/log/logger.test.ts'],
    regras: REGRAS_DE_LOG,
  },
  {
    // O LoggerDoNest repassa ao logger a mensagem do Nest, depois de conferir que é evento fixo ou
    // do boot. Só a guarda de conteúdo montado sai; a de dado pessoal continua valendo aqui.
    files: ['packages/nucleo/src/log/logger-do-nest.ts'],
    regras: ['guardas/log-sem-conteudo-montado'],
  },
]

export const configuracaoDasGuardas = [
  {
    files: TODOS_OS_ARQUIVOS,
    plugins: { guardas, '@eslint-community/eslint-comments': comentarios },
    rules: {
      'guardas/log-sem-dado-pessoal': 'error',
      'guardas/log-sem-conteudo-montado': 'error',
      'guardas/sdk-de-ia-so-no-adaptador': 'error',
      '@typescript-eslint/no-restricted-imports': [
        'error',
        { patterns: [{ regex: REGEX_SDK_DE_IA, message: MENSAGEM_SDK_DE_IA }] },
      ],
      // Guarda desligada por comentário deixa de ser guarda (regra 40). Também reprova o
      // `eslint-disable` sem regra, que desligaria todas de uma vez. Um comentário ainda
      // conseguiria desligar esta própria regra, ou configurar a guarda com `/* eslint ... */`:
      // por isso `npm run lint` roda também `tools/guardas/lint.ts`, que ignora todo comentário.
      '@eslint-community/eslint-comments/no-restricted-disable': [
        'error',
        'guardas/*',
        '@typescript-eslint/no-restricted-imports',
      ],
    },
  },
  ...EXCECOES_DAS_GUARDAS.map(({ files, regras }) => ({
    files,
    rules: Object.fromEntries(regras.map((regra) => [regra, 'off'])),
  })),
]
