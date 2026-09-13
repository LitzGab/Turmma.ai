# Tarefas — Fundação técnica

**PRD:** `prd.md` · **Tech Spec:** `techspec.md`
**Status:** 3 de 15 concluídas

## Lista

- [x] **1.0 — Monorepo sobe com um comando e a esteira do GitHub roda em todo commit**
  - [x] 1.1 Workspaces npm, TypeScript base, ESLint, Vitest e Playwright com os scripts do portão
  - [x] 1.2 `infra/compose.yml` com Postgres (pgvector), Redis de fila, Redis de cache e storage S3
  - [x] 1.3 Esqueleto de `apps/api` com `/saude` e de `apps/web` exibindo o dado da API
  - [x] 1.4 `.github/workflows/ci.yml` com `verificar`, `integracao` e `e2e`, chamando só `npm run ci:*`
  - [x] 1.5 Testes: e2e de fumaça, `/saude` com Postgres parado, esteira sem `.env` local e sem segredo

- [x] **2.0 — Erro tipado e log sem dado pessoal**
  - [x] 2.1 `CodigoDeErro` e mensagens pt-BR em `packages/shared`
  - [x] 2.2 Contexto da requisição com `requisicaoId` (AsyncLocalStorage)
  - [x] 2.3 Logger pino com redact e filtro global de erro, com mapeamento de erro do Postgres
  - [x] 2.4 Testes: exceção sem stack, `detail` do Postgres fora da resposta e do log, contexto sem vazamento em paralelo

- [x] **3.0 — Guardas da esteira reprovam o que as regras proíbem**
  - [x] 3.1 Regras ESLint de log (chave pessoal, spread, template) e de import de SDK de IA
  - [x] 3.2 gitleaks e `npm audit --audit-level=high --omit=dev` na esteira
  - [x] 3.3 Proibir `eslint-disable` nas guardas
  - [x] 3.4 Testes: fixtures que violam cada guarda e são reprovadas

- [ ] **4.0 — Identidade sintética e contexto de escola**
  - [ ] 4.1 Verificação de JWT (`sub`, `esc`) e escopo no contexto
  - [ ] 4.2 `ops:token-sintetico` e trava de boot em `AMBIENTE=producao`
  - [ ] 4.3 `GET /v1/sistema/contexto`
  - [ ] 4.4 Testes: token inválido, flag desligada, escola vinda do cliente ignorada

- [ ] **5.0 — Duas instâncias de API e realtime trocam sem derrubar requisição**
  - [ ] 5.1 Caddy local balanceando, com `health_uri`, sticky no realtime e sem log de acesso
  - [ ] 5.2 `/prontidao` com drenagem no SIGTERM
  - [ ] 5.3 `apps/realtime` com adaptador de streams do Redis e sala por escola
  - [ ] 5.4 Testes: restart na rajada sem 502, mensagem entre instâncias, sala isolada por escola

- [ ] **6.0 — Rate limit por usuário e por escola, com seguro em memória**
  - [ ] 6.1 Guard com chaves de usuário e escola, e de IP só em `@RotaAnonima`
  - [ ] 6.2 Seguro em memória, clientes Redis sem fila offline e 429 com `Retry-After`
  - [ ] 6.3 Testes: 400 usuários num IP, limite somado nas duas APIs, Redis de cache fora, isolamento

- [ ] **7.0 — Job aceito é executado uma única vez e dá para consultar**
  - [ ] 7.1 `job_registro`, serviço `migrar` e `Enfileirador` na transação
  - [ ] 7.2 `apps/despachante` com seleção, reserva, publicação e troca de estado condicional
  - [ ] 7.3 `apps/worker` com ciclo de estado, retentativa, stalled e desligamento gracioso
  - [ ] 7.4 `POST` e `GET /v1/sistema/jobs-sinteticos`, com escopo de escola
  - [ ] 7.5 Testes: dois despachantes em paralelo, `kill -9` no worker, falha permanente, isolamento, `requisicaoId` na trilha

- [ ] **8.0 — Job sobrevive à queda do Redis de fila**
  - [ ] 8.1 Publicação resiliente com o Redis fora
  - [ ] 8.2 Reconciliação de job publicado ou ativo que sumiu do BullMQ
  - [ ] 8.3 Testes: Redis parado e religado, reconciliação, timeout não republica

- [ ] **9.0 — Interativo nunca espera lote, e cada escola tem sua vaga**
  - [ ] 9.1 Três filas e pools separados (`worker-interativo`, `worker-lote`)
  - [ ] 9.2 `configuracao_operacional_escola` com padrão do ambiente
  - [ ] 9.3 `VagasPorEscola` em Lua e rodízio de escolas no despachante
  - [ ] 9.4 Testes: prioridade, teto por escola, vaga concorrente, vaga vencida, isolamento

- [ ] **10.0 — Lote não urgente só começa fora do horário letivo da escola**
  - [ ] 10.1 `JanelaLetiva` com fuso, dias e horário, e relógio injetado
  - [ ] 10.2 Despachante segura o não urgente sem consumir vaga
  - [ ] 10.3 Testes: terça 10h, sábado, sábado letivo, feriado, fuso, 17h59 contra 18h00

- [ ] **11.0 — Uso marcado por escola, com consolidação e expurgo**
  - [ ] 11.1 Contadores de requisição e job por escola e dia
  - [ ] 11.2 `uso_infra_diario` e `sistema.consolidar-uso` idempotente, com bytes por prefixo
  - [ ] 11.3 `sistema.expurgar-jobs` em lotes
  - [ ] 11.4 Testes: consolidação em dobro, virada de dia em São Paulo, prefixo, expurgo sem tocar job ativo

- [ ] **12.0 — Painel local por rota, fila e escola**
  - [ ] 12.1 `grafana/otel-lgtm` no compose e OTel em cada processo
  - [ ] 12.2 Métricas da Tech Spec e painel provisionado
  - [ ] 12.3 Testes: séries por escola, espera com Redis fora, rota como template, sem label de usuário

- [ ] **13.0 — Alertas locais disparam e têm runbook**
  - [ ] 13.1 Três regras provisionadas em `infra/grafana/alertas/`
  - [ ] 13.2 Entradas em `docs/runbook.md` e `npm run ensaio:alertas`
  - [ ] 13.3 Testes: ensaio dispara, condição curta não dispara, alerta sem runbook reprova

- [ ] **14.0 — Casca da web com os quatro estados, no limite do Chromebook**
  - [ ] 14.1 `GET /v1/sistema/estado` e `/avisos`
  - [ ] 14.2 Componentes `Estado*`, casca com TanStack Query e Tailwind, pt-BR
  - [ ] 14.3 size-limit, axe e projeto Playwright `chromebook`
  - [ ] 14.4 Testes: quatro estados, teclado, Chromebook em 5 s, fixtures que violam axe e teto

- [ ] **15.0 — Cenário "justiça entre escolas" passa local**
  - [ ] 15.1 Processador sintético em sandbox e `infra/compose.carga.yml` com CPU fixa
  - [ ] 15.2 `infra/k6/justica-entre-escolas.js` com as quatro fases e thresholds
  - [ ] 15.3 Controle negativo com a vaga por escola desligada
  - [ ] 15.4 Testes: cenário passa, controle negativo reprova, conferência em `job_registro`

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — | — |
| 2.0 | 1.0 | — |
| 3.0 | 2.0 | 4.0, 14.0 |
| 4.0 | 2.0 | 3.0, 14.0 |
| 5.0 | 4.0 | 3.0, 7.0, 14.0 |
| 6.0 | 5.0 | 7.0, 14.0 |
| 7.0 | 4.0 | 3.0, 5.0, 6.0, 14.0 |
| 8.0 | 7.0 | 9.0, 12.0 |
| 9.0 | 7.0 | 8.0, 12.0 |
| 10.0 | 9.0 | 11.0, 12.0 |
| 11.0 | 9.0 | 10.0, 12.0 |
| 12.0 | 7.0 | 8.0, 9.0, 10.0, 11.0 |
| 13.0 | 6.0, 9.0, 12.0 | 10.0, 11.0 |
| 14.0 | 2.0 | 3.0 a 13.0 |
| 15.0 | 6.0, 9.0, 14.0 | 13.0 |

Com commit direto no `main` (D23), "paralelo" quer dizer que as tarefas não dependem uma
da outra, e não que dois commits possam ser feitos ao mesmo tempo sem cuidado.

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `infra-guardian`, `test-engineer` |
| 2.0 | `privacy-guardian`, `test-engineer` |
| 3.0 | `privacy-guardian`, `test-engineer` |
| 4.0 | `tenancy-guardian`, `privacy-guardian`, `test-engineer` |
| 5.0 | `infra-guardian`, `tenancy-guardian`, `privacy-guardian`, `test-engineer` |
| 6.0 | `infra-guardian`, `tenancy-guardian`, `privacy-guardian`, `test-engineer` |
| 7.0 | `tenancy-guardian`, `infra-guardian`, `privacy-guardian`, `test-engineer` |
| 8.0 | `infra-guardian`, `test-engineer` |
| 9.0 | `infra-guardian`, `tenancy-guardian`, `test-engineer` |
| 10.0 | `infra-guardian`, `tenancy-guardian`, `test-engineer` |
| 11.0 | `infra-guardian`, `tenancy-guardian`, `privacy-guardian`, `test-engineer` |
| 12.0 | `infra-guardian`, `privacy-guardian`, `test-engineer` |
| 13.0 | `infra-guardian`, `test-engineer` |
| 14.0 | `frontend-reviewer`, `test-engineer` |
| 15.0 | `infra-guardian`, `test-engineer` |

## Critério de pronto da funcionalidade

Do `ROADMAP.md`: `docker compose up` sobe tudo, um e2e verde toca API e web, e a esteira do
GitHub fica verde no mesmo commit.

Detalhado:
- Numa máquina limpa, só com o repositório e `.env.example`, `docker compose up` sobe web,
  API e realtime (duas instâncias cada), despachante, workers, Postgres, os dois Redis,
  storage e observabilidade
- A esteira do GitHub fica verde no último commit, com todas as guardas ativas
- Os RF1 a RF18 do PRD têm teste que falharia se a regra fosse removida
- O cenário "justiça entre escolas" passa local, e o controle negativo reprova
- As três regras de alerta disparam no ensaio e têm entrada no runbook
- Todos os vetos aprovados em todas as tarefas
- `ROADMAP.md` com o F0 marcado `[x]`
