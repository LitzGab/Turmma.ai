# Tarefas — Fundação técnica

**PRD:** `prd.md` · **Tech Spec:** `techspec.md`
**Status:** 15 de 16 concluídas

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

- [x] **4.0 — Identidade sintética e contexto de escola**
  - [x] 4.1 Verificação de JWT (`sub`, `esc`) e escopo no contexto
  - [x] 4.2 `ops:token-sintetico` e trava de boot em `AMBIENTE=producao`
  - [x] 4.3 `GET /v1/sistema/contexto`
  - [x] 4.4 Testes: token inválido, flag desligada, escola vinda do cliente ignorada

- [x] **5.0 — Duas instâncias de API e realtime trocam sem derrubar requisição**
  - [x] 5.1 Caddy local balanceando, com `health_uri`, sticky no realtime e sem log de acesso
  - [x] 5.2 `/prontidao` com drenagem no SIGTERM
  - [x] 5.3 `apps/realtime` com adaptador de streams do Redis e sala por escola
  - [x] 5.4 Testes: restart na rajada sem 502, mensagem entre instâncias, sala isolada por escola

- [x] **6.0 — Rate limit por usuário e por escola, com seguro em memória**
  - [x] 6.1 Guard com chaves de usuário e escola, e de IP só em `@RotaAnonima`
  - [x] 6.2 Seguro em memória, clientes Redis sem fila offline e 429 com `Retry-After`
  - [x] 6.3 Testes: 400 usuários num IP, limite somado nas duas APIs, Redis de cache fora, isolamento

- [x] **7.0 — Job aceito é executado uma única vez e dá para consultar**
  - [x] 7.1 `job_registro`, serviço `migrar` e `Enfileirador` na transação
  - [x] 7.2 `apps/despachante` com seleção, reserva, publicação e troca de estado condicional
  - [x] 7.3 `apps/worker` com ciclo de estado, retentativa, stalled e desligamento gracioso
  - [x] 7.4 `POST` e `GET /v1/sistema/jobs-sinteticos`, com escopo de escola
  - [x] 7.5 Testes: dois despachantes em paralelo, `kill -9` no worker, falha permanente, isolamento, `requisicaoId` na trilha

- [x] **8.0 — Job sobrevive à queda do Redis de fila**
  - [x] 8.1 Publicação resiliente com o Redis fora
  - [x] 8.2 Reconciliação de job publicado ou ativo que sumiu do BullMQ
  - [x] 8.3 Testes: Redis parado e religado, reconciliação, timeout não republica

- [x] **9.0 — Interativo nunca espera lote, e cada escola tem sua vaga**
  - [x] 9.1 Três filas e pools separados (`worker-interativo`, `worker-lote`)
  - [x] 9.2 `configuracao_operacional_escola` com padrão do ambiente
  - [x] 9.3 `VagasPorEscola` em Lua e rodízio de escolas no despachante
  - [x] 9.4 Testes: prioridade, teto por escola, vaga concorrente, vaga vencida, isolamento

- [x] **10.0 — Lote não urgente só começa fora do horário letivo da escola**
  - [x] 10.1 `JanelaLetiva` com fuso, dias e horário, e relógio injetado
  - [x] 10.2 Despachante segura o não urgente sem consumir vaga
  - [x] 10.3 Testes: terça 10h, sábado, sábado letivo, feriado, fuso, 17h59 contra 18h00

- [x] **11.0 — Uso marcado por escola, com consolidação e expurgo**
  - [x] 11.1 Contadores de requisição e job por escola e dia
  - [x] 11.2 `uso_infra_diario` e `sistema.consolidar-uso` idempotente, com bytes por prefixo
  - [x] 11.3 `sistema.expurgar-jobs` em lotes
  - [x] 11.4 Testes: consolidação em dobro, virada de dia em São Paulo, prefixo, expurgo sem tocar job ativo

- [x] **12.0 — Painel local por rota, fila e escola**
  - [x] 12.1 `grafana/otel-lgtm` no compose e OTel em cada processo
  - [x] 12.2 Métricas da Tech Spec e painel provisionado
  - [x] 12.3 Testes: séries por escola, espera com Redis fora, rota como template, sem label de usuário

- [x] **13.0 — Alertas locais disparam e têm runbook**
  - [x] 13.1 Três regras provisionadas em `infra/grafana/alertas/`
  - [x] 13.2 Entradas em `docs/runbook.md` e `npm run ensaio:alertas`
  - [x] 13.3 Testes: ensaio dispara, condição curta não dispara, alerta sem runbook reprova

- [x] **14.0 — Casca da web com os quatro estados, no limite do Chromebook e do celular**
  - [x] 14.1 `GET /v1/sistema/estado` e `/avisos`
  - [x] 14.2 Componentes `Estado*`, casca responsiva mobile-first com TanStack Query e Tailwind, pt-BR
  - [x] 14.3 size-limit, axe (com `target-size`) e projetos Playwright `chromebook` e `celular`
  - [x] 14.4 Testes: quatro estados, teclado, toque, Chromebook e celular em 5 s, sem rolagem horizontal, fixtures que violam axe, largura e teto

- [x] **15.0 — Cenário "justiça entre escolas" passa local**
  - [x] 15.1 Processador sintético em sandbox e `infra/compose.carga.yml` com CPU fixa
  - [x] 15.2 `infra/k6/justica-entre-escolas.js` com as quatro fases e thresholds
  - [x] 15.3 Controle negativo com a vaga por escola desligada
  - [x] 15.4 Testes: cenário passa, controle negativo reprova, conferência em `job_registro`

- [ ] **16.0 — Entrega "pelo menos uma vez" declarada, com chave de idempotência no processador**
  - [ ] 16.1 `Processador` recebe `{ jobId, tentativa, chaveIdempotencia }`; texto de "exatamente uma vez" corrigido
  - [ ] 16.2 Modo `efeito` no processador sintético, com restrição única na chave
  - [ ] 16.3 Teste intermitente de `pool.int.test.ts` corrigido
  - [ ] 16.4 Como reconhecer reexecução no log
  - [ ] 16.5 Testes: `kill -9` entre efeito e conclusão, reconciliação de job ativo, chave igual entre tentativas, pool 20 vezes, isolamento

> Revisão de 13/09/2026: a 14.0 passou a cobrir o celular (D51) e a 16.0 entrou pela D49. As
> tarefas 1.0 a 10.0, já concluídas, não foram alteradas.

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
| 16.0 | 9.0 | 12.0, 13.0, 14.0; de preferência antes da 11.0 |

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
| 16.0 | `infra-guardian`, `test-engineer` |

## Critério de pronto da funcionalidade

Do `ROADMAP.md`: `docker compose up` sobe tudo, um e2e verde toca API e web, e a esteira do
GitHub fica verde no mesmo commit.

Detalhado:
- Numa máquina limpa, só com o repositório e `.env.example`, `docker compose up` sobe web,
  API e realtime (duas instâncias cada), despachante, workers, Postgres, os dois Redis,
  storage e observabilidade
- A esteira do GitHub fica verde no último commit, com todas as guardas ativas
- O e2e da casca passa nos projetos `chromebook` e `celular` (D51)
- Todo processador de job recebe chave de idempotência, e a reexecução não duplica efeito
  (D49)
- Os RF1 a RF18 do PRD têm teste que falharia se a regra fosse removida
- O cenário "justiça entre escolas" passa local, e o controle negativo reprova
- As três regras de alerta disparam no ensaio e têm entrada no runbook
- Todos os vetos aprovados em todas as tarefas
- `ROADMAP.md` com o F0 marcado `[x]`
