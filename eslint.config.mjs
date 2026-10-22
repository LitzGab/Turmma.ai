import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { configuracaoDasGuardas } from './tools/guardas/index.mjs'

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'playwright-report/**',
      'test-results/**',
      // Violações de propósito: o teste das guardas as passa pelo ESLint com um caminho simulado.
      'tools/guardas/__fixtures__/**',
      // Protótipo só de front-end, com projeto e lint próprios (mockups/LEIAME.md); não é código do produto.
      'mockups/**',
      // Checkouts inteiros do repositório, os de subagente: cada um tem o seu lint, na árvore dele.
      '.claude/worktrees/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
      'no-console': 'error',
    },
  },
  {
    // Nest injeta dependência pelo tipo do construtor: o import precisa ser de valor.
    files: ['apps/api/**/*.ts', 'apps/realtime/**/*.ts', 'apps/despachante/**/*.ts', 'apps/worker/**/*.ts'],
    rules: {
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  {
    // Os processadores do worker montam o registro de cada job (os totais do expurgo, A0b, tarefa 9.0) como objeto
    // literal com o tipo declarado: `{} as Record<…>` esconderia do compilador a chave que faltasse, e um
    // `Partial<…>` preenchido no laço e afirmado no fim (`t as Record<…>`) também. Por isso nenhuma afirmação de tipo
    // (`as const` continua valendo).
    files: ['apps/worker/src/processadores/**/*.ts'],
    ignores: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    },
  },
  {
    // A entrada HTTP passa pelo pipe no parâmetro (D81; NestJS, "Pipes" › Object schema validation): `@Body(new
    // ZodValidationPipe(esquema))`, `@Query(new ZodValidationPipe(esquema))` e `@Param('id', IdPipe)`. Parâmetro sem pipe
    // entrega ao service o que o cliente mandou, e `@Req()` e `requisicao.body|query|params` leem a entrada por fora dele.
    // O `files` cresce por tarefa (14.0: os cinco primeiros módulos; 15.0 e 16.0 os outros; a 17.0 o faz valer em todo
    // `apps/api/src/**/*.controller.ts`). `no-restricted-syntax` está em `REGRAS_DAS_GUARDAS`: o `eslint-disable` dele não fura a
    // segunda passada do `npm run lint`. O `@UploadedFile()` não é barrado: os campos ao lado dele passam pelo pipe.
    files: ['apps/api/src/{sistema,ia,entrega,assistente,professores}/**/*.controller.ts'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=0]",
          message: 'Entrada sem pipe: use @Body(new ZodValidationPipe(esquema)), @Query(new ZodValidationPipe(esquema)) ou @Param(\'id\', IdPipe).',
        },
        {
          selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=1] > Literal.arguments",
          message: 'Parâmetro de caminho ou de consulta sem pipe: use @Param(\'id\', IdPipe) ou @Query(\'nome\', new ZodValidationPipe(esquema)).',
        },
        {
          selector: "Decorator > CallExpression[callee.name=/^(Req|Request)$/]",
          message: 'A entrada não se lê da requisição: use @Body, @Query e @Param com o pipe.',
        },
        {
          selector: "MemberExpression[object.name='requisicao'][property.name=/^(body|query|params)$/]",
          message: 'A entrada não se lê da requisição: use @Body, @Query e @Param com o pipe.',
        },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
  {
    // O cenário de carga roda no runtime do k6, que dá `__ENV` e `open` ao script (infra/k6).
    files: ['infra/k6/**/*.js'],
    languageOptions: { globals: { __ENV: 'readonly', open: 'readonly' } },
  },
  // Por último: nenhum bloco acima sobrescreve as guardas (tools/guardas).
  ...configuracaoDasGuardas,
)
