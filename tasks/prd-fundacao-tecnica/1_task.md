# Tarefa 1.0 — Monorepo sobe com um comando e a esteira do GitHub roda em todo commit

**Funcionalidade:** fundacao-tecnica · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`

## Objetivo

Um `docker compose up` numa máquina limpa sobe banco, os dois Redis, o storage, a API e a
web. A web mostra um dado vindo da API, e todo push no `main` roda a esteira do GitHub.
Antes desta tarefa, o repositório não tem código.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF1 e RF12; `techspec.md`: seções 1, 2 e 5 ("Esteira")
- `CLAUDE.md`: seção "Stack" e decisões D12, D16, D23 e D31 (sem staging; a esteira é o
  portão)
- `.claude/rules/00-arquitetura.md`: tudo sobe com `docker compose up`, sem conta externa
- `.claude/rules/40-testes.md`: o portão (`typecheck`, `test`, `lint`, `test:e2e`)
- `.claude/rules/80-infra-e-carga.md`, item 5: nenhum estado em memória
- `docs/arquitetura.md`: layout `apps/*` e `packages/*`
- Skills: `nestjs-best-practices`, `vitest`, `playwright-best-practices`
- Não há código existente

## Subtarefas

- [x] 1.1 — `package.json` na raiz com workspaces (`apps/*`, `packages/*`) e os scripts
  `typecheck`, `lint`, `test`, `test:e2e` e `ci:verificar`, `ci:integracao`, `ci:e2e`.
  Criar `tsconfig.base.json` (strict), `eslint.config.mjs` (flat), config do Vitest e
  `playwright.config.ts`
- [x] 1.2 — `infra/compose.yml` com os serviços abaixo, todos com healthcheck. O
  `.env.example` precisa ser suficiente para subir tudo
  - Postgres com pgvector
  - `redis-fila` com `maxmemory-policy noeviction` e AOF ligado
  - `redis-cache` com `allkeys-lru`
  - storage S3. ⚠️ Confirme que a imagem do MinIO tem arm64 e amd64 mantidas; se não
    tiver, use SeaweedFS ou Garage e registre a troca na Tech Spec (seção 12)
- [x] 1.3 — `packages/shared` e `packages/nucleo` vazios, mas compilando.
  - `apps/api` (NestJS) com `GET /saude`, que responde `{ ok: true }` e 503 quando o
    Postgres não responde, usando um pool de `packages/nucleo/src/db`.
  - `apps/web` (Vite + React + TS) com uma página que chama `/saude` e mostra o resultado.
  - API e web entram no compose.
- [x] 1.4 — `.github/workflows/ci.yml` em push no `main`, com `permissions: contents: read`
  e sem nenhum `secrets.*`. Os jobs `verificar`, `integracao` (compose com Postgres, Redis
  e storage) e `e2e` (compose completo + Playwright) só chamam `npm run ci:*`, para a lógica
  morar em script e não no YAML
- [x] 1.5 — Testes (tabela abaixo) e seção "Rodando local" no `README.md`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `package.json`, `tsconfig.base.json`, `eslint.config.mjs`, `vitest.workspace.ts`, `playwright.config.ts`, `.env.example` | novo |
| `infra/compose.yml` | novo |
| `packages/shared/*`, `packages/nucleo/src/db/pool.ts` | novo |
| `apps/api/src/main.ts`, `apps/api/src/sistema/saude.controller.ts` | novo |
| `apps/web/index.html`, `apps/web/src/main.tsx` | novo |
| `.github/workflows/ci.yml` | novo |
| `e2e/fumaca.spec.ts`, `apps/api/test/saude.int.test.ts` | novo |
| `README.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: `compose up` e a web mostra o dado vindo da API | e2e | web e API se falam pelo compose (quebra se não se falarem) |
| `/saude` com o Postgres parado responde 503 | integração | a saúde consulta o banco de verdade |
| borda: o job da esteira sobe só com `.env.example`, sem `.env` local | integração (CI) | nada depende de arquivo que só existe numa máquina |
| borda: `ci:*` sai com código diferente de zero quando um teste de fixture falha | integração | o script não engole a falha |
| permissão: `ci.yml` sem `secrets.*` e com `contents: read` | unidade (lê o YAML) | a esteira não pede credencial externa (regra 00) |

Prova única, não recorrente: um commit com teste quebrado deixa a esteira vermelha, e o
commit corrigido fica verde. Registre os dois links de execução na conclusão.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Erro tipado e logger (2.0), guardas (3.0), duas instâncias e Caddy (5.0), observabilidade
(12.0), a casca de verdade com os quatro estados (14.0). A página da web aqui é só fumaça.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

> Rodadas reconstruídas em 13/09/2026 a partir dos registros locais das sessões (o transcript de
> cada revisor), antes de o hook existir. Horário de Brasília.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-13 03:59:08 | 2026-09-13 04:01:42 | `infra-guardian` | 1 | APROVADO | a680b64e1f1e85597 |
| 2026-09-13 03:59:24 | 2026-09-13 04:03:32 | `test-engineer` | 1 | REPROVADO | a86fad1c29daa47da |
| 2026-09-13 04:11:23 | 2026-09-13 04:12:51 | `infra-guardian` | 2 | APROVADO | a680b64e1f1e85597 |
| 2026-09-13 04:11:17 | 2026-09-13 04:13:32 | `test-engineer` | 2 | APROVADO | a86fad1c29daa47da |
