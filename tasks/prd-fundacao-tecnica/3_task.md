# Tarefa 3.0 — Guardas da esteira reprovam o que as regras proíbem

**Funcionalidade:** fundacao-tecnica · **Depende de:** 2.0
**Subagentes obrigatórios:** `privacy-guardian`, `test-engineer`

## Objetivo

A esteira passa a reprovar sozinha, sem depender de revisão humana, quatro violações:
- log com campo pessoal
- import de SDK de provedor de IA fora dos adaptadores
- segredo commitado
- dependência com vulnerabilidade grave

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF11; `techspec.md`: seção 10, linha "Guardas"
- `.claude/rules/20-lgpd-menores.md`, item 9: nunca logar dado pessoal
- `.claude/rules/30-camada-ia.md`, item 1: `import OpenAI` fora de `apps/api/src/ia/adapters`
  é erro
- `.claude/rules/40-testes.md`: é proibido desabilitar teste ou guarda para destravar
- Código existente: `eslint.config.mjs` (1.0), `packages/nucleo/src/log/logger.ts` (2.0), para
  saber o nome dos métodos do logger

## Subtarefas

- [ ] 3.1 — Em `tools/guardas/`, regras ESLint para chamadas ao logger (`info`, `warn`,
  `error`, `debug`, `fatal`):
  - reprovam objeto com chave pessoal em qualquer nível de aninhamento (`nome`,
    `matricula`, `email`, `telefone`, `cpf`, `senha`, `resposta`, `nota`, `conversa`,
    `prompt`)
  - reprovam spread de objeto e template string com variável
- [ ] 3.2 — `no-restricted-imports` bloqueando `openai`, `@anthropic-ai/*`, `@google/genai`,
  `@google/generative-ai`, `ollama` e `@mistralai/*` fora de `apps/api/src/ia/adapters/**`.
  Precisa pegar também import com alias
- [ ] 3.3 — Proibir `eslint-disable` nessas regras (`eslint-comments/no-restricted-disable`)
- [ ] 3.4 — gitleaks na esteira, com `.gitleaks.toml` em que a fixture de segredo falso
  fica fora de qualquer allowlist geral. `ci:verificar` roda
  `npm audit --audit-level=high --omit=dev`
- [ ] 3.5 — Testes com fixtures em `tools/guardas/__fixtures__/`, rodando ESLint e gitleaks
  pela API ou pelo binário

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/guardas/regras-log.mjs`, `tools/guardas/index.mjs` | novo |
| `tools/guardas/__fixtures__/*` | novo |
| `tools/guardas/guardas.test.ts` | novo |
| `.gitleaks.toml` | novo |
| `eslint.config.mjs`, `package.json`, `.github/workflows/ci.yml` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: `logger.info({ nome })`, `logger.info({ ...aluno })`, template com variável e `import OpenAI` em `apps/api/src/sistema` dão erro; o mesmo import dentro de `ia/adapters` passa | unidade | cada guarda pega a violação e deixa o lugar certo passar |
| borda: chave aninhada `{ aluno: { matricula } }` e `import { OpenAI as X }` | unidade | a regra não olha só o primeiro nível nem só o nome literal |
| borda: a fixture de segredo falso é pega pelo gitleaks | integração | a allowlist não cobre tudo |
| permissão: `// eslint-disable-next-line` numa guarda é reprovado | unidade | não dá para contornar a guarda com comentário |
| `ci:verificar` usa `--audit-level=high` e sai com código diferente de zero quando o audit falha | unidade (lê o script) | o audit é portão, não aviso |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Vetos aprovados (se aplicáveis)
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Teto de bundle e axe (14.0). Guarda de alerta sem runbook (13.0). Criar a pasta
`apps/api/src/ia/adapters` de verdade (F5): aqui ela só existe como caminho permitido na
regra.
