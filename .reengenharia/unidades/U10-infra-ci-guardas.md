# U10 — Infraestrutura, esteira e travas (compreensão)

Leitura estática, nada executado. Marcas: [código] conferido lendo; [doc] dito em doc; [hipótese] a conferir.

## 1. Finalidade e limites

Esta unidade é tudo que não é produto e que faz o produto subir, ser medido e ser barrado quando quebra regra: o compose de
desenvolvimento/teste, a borda (Caddy), as imagens, a observabilidade (Grafana/OTel local), os alertas provisionados, os
cenários de carga (k6 e scripts), a esteira do GitHub, os scripts `tools/ci/` que ela chama, as guardas de lint próprias
(`tools/guardas/`), o ESLint/tsconfig, e o gerador do PDF de demonstração.

Não é dela: o código dos serviços (`apps/*`, `packages/*`), `tools/processo/` (portão local, Maestri) e `tools/testes/` (helpers
de teste), embora a esteira e o portão local conversem com eles. O teste de arquitetura mais forte do repositório,
`apps/api/test/arquitetura.test.ts` (1403 linhas), pertence à API mas é a principal "trava por máquina" de regras 00/10/20.

Tamanho [código, `wc`]: ~20,3 mil linhas em `infra/`, `tools/ci`, `tools/guardas`, `tools/demonstracao`, `.github`, configs da raiz;
perto de metade é teste. Maiores: `infra/grafana/paineis/fundacao.json` 1732, `infra/scripts/ensaio-alertas.ts` 722,
`expurgo-da-carga.ts` 710, `infra/test/borda.int.test.ts` 660, `tools/ci/duracao-do-e2e.test.ts` 569, `infra/compose.yml` 516.

## 2. Pontos de entrada

| Entrada | O que faz | Onde |
|---|---|---|
| `docker compose up` (raiz) | `include` de `infra/compose.yml` com `env_file: .env.example` | `compose.yaml:1-8` |
| `npm run ci:verificar` | tipos, lint+guardas, gitleaks, `npm audit`, unidade | `tools/ci/verificar.ts` |
| `npm run ci:integracao` / `ci:infra` | vitest `integracao` / `infra` sobre compose de teste | `tools/ci/integracao.ts`, `infra.ts` |
| `npm run ci:e2e -- --shard=i/7` | install do chromium, build web, size-limit, compose up, Playwright | `tools/ci/e2e.ts`, `prazo-do-e2e.ts` |
| `npm run guarda:segredo` | gitleaks (docker) no histórico + arquivos alterados sem commit | `tools/ci/segredo.ts` |
| `npm run lint` | `eslint . --max-warnings=0` e depois `tools/guardas/lint.ts` (guardas com comentários ignorados) | `package.json` |
| `npm run carga`, `carga:login`, `carga:sala` (+ `:controle-negativo`) | cenários k6/node sobre `compose.carga.yml` | `infra/scripts/carga*.ts`, `infra/k6/*.js` |
| `npm run ensaio:alertas` | provoca 5xx/worker parado/Redis parado e confere o Grafana | `infra/scripts/ensaio-alertas.ts` |
| `npm run ops:*` (12) | comandos do operador da equipe (escola, convite, MFA, retenção, incidente...) | `package.json:25-36` -> `apps/api/dist/ops/*.js` |
| `npm run demonstracao:material` | gera o PDF sintético de estequiometria | `tools/demonstracao/gerar-material.ts` |
| `.github/workflows/ci.yml` | push em `develop, release, main, spec/**, correcao/**` + `workflow_dispatch` | `ci.yml:10-14` |

Não há worker nem rota nesta unidade; os healthchecks do compose consomem `/saude` (api), `/prontidao` (realtime), arquivo de
batimento (despachante e workers) [código, `infra/compose.yml` healthchecks].

## 3. Fluxos e invariantes

**Esteira (o que roda e quanto cada job declara)** [código, `ci.yml`]:

| Job | `timeout-minutes` | Roda | Observação |
|---|---|---|---|
| verificar | 15 | `ci:verificar` (checkout com `fetch-depth: 0` para o gitleaks) | typecheck de todos os workspaces, lint, guardas, gitleaks, audit, unidade |
| integracao | 20 | `ci:integracao` | comentário diz "uns 5 min" local |
| infra | 45 | `ci:infra` | "ensaio dos alertas uns 11 min"; métricas baixam `grafana/otel-lgtm`; ~16 min locais |
| e2e x7 fatias | 45 cada, `fail-fast: false` | `ci:e2e -- --shard=i/7` | ~1196 casos, 2 projetos (chromebook/celular); upload do traço só em falha |

Pontos de desenho: nenhum segredo/`vars` (teste confere `esteira.test.ts:108-121`); permissão `contents: read`; actions fixadas
por SHA (`esteira.test.ts:143`); lógica toda em `npm run ci:*` (YAML só prepara o Node). O teto do e2e é "guardado" por
`tools/ci/esteira.test.ts:199` que conta casos por fatia com 4 min fixos + 7 s/caso e reprova acima de 60% do teto, mais
`avisoDePrazoDoE2e` no log. O histórico do `ci.yml` mostra o padrão: fatias acrescentadas à mão a cada estouro (4->5->6->7,
commits `71ff60f`, `9d9985f`, `52f43fe`) [código, `git log`]. O e2e já é o maior custo da esteira e cresce com a suíte.

**Invariantes de ambiente**: toda variável do compose é `${X:?defina X}` (compose cai se faltar); portas só em `127.0.0.1`;
projeto compose de teste `educa-teste[-N]` separado do de desenvolvimento, com portas deslocadas de N x 1000 (`tools/ci/compose.ts`,
com teste das colisões); gitleaks fixado por digest (`tools/ci/etapas-de-guarda.ts:4`); `.gitleaks.toml` sem allowlist por
pasta, só arquivo+linha exatos.

**Serviços no compose** [código, `compose.yml`]: postgres 18+pgvector, redis-fila (AOF, `noeviction`), redis-cache (LRU, sem persistência),
SeaweedFS (S3), oidc-falso, `migrar` (one-shot), 2 api, 2 realtime, 2 despachante, 2 worker-interativo, 2 worker-lote, borda
Caddy, `grafana/otel-lgtm`, web. Todos com `healthcheck`; `stop_grace_period` coerente com a drenagem (15 s api/realtime/despachante,
35 s worker, comentário diz que fica acima dos 30 s do `worker.close()`).

## 4. Dependências

- Internas: `tools/ci` importa `tools/processo/revisoes.ts` (`segredo.ts:5`: `arquivosAlterados`) e `tools/guardas/alerta-tem-runbook.ts`
  importa `tools/ci/executar.ts` (raiz). Ou seja, esteira <-> processo acoplados por import. `playwright.config.ts` importa
  `tools/ci/compose.ts` e `duracao-do-e2e.ts`. `eslint.config.mjs` importa `tools/guardas/index.mjs`. Não vi ciclo.
- Docker/compose obrigatório para gitleaks (imagem `ghcr.io/gitleaks`), integração, infra e e2e. `flock` e `/proc/locks` para a
  fila de carga da máquina (`tools/ci/fila-de-carga.ts`) — Linux-only, sem fila na esteira.
- Imagens externas: `pgvector`, `redis:8.8.2-alpine`, `chrislusf/seaweedfs:4.46`, `mock-oauth2-server` (digest), `caddy:2.11.4`, `grafana/otel-lgtm:0.33.0`
  (tags fixas; só o oidc-falso tem digest).
- Dependem desta unidade: todas as outras (portão, esteira, ambiente de teste). Ela depende de `apps/api/dist/ops`, de `@educa/nucleo`
  (migrations em `packages/nucleo/drizzle`) e de `docs/runbook.md` (guarda de alerta).

## 5. Dados

Sem schema próprio. Toca banco por: serviço `migrar` (`node dist/ops/migrar.js`, lock de 5 s, 3 tentativas — descrito no comentário do
compose); `expurgo-da-carga.ts` e `ensaio-alertas.ts` criam semente/gatilho no Postgres de teste (gatilho com nome fixo, restaurado ao fim);
`pg_stat_statements` ligado só na sobreposição de carga. Volumes nomeados: postgres, redis-fila, storage; redis-cache e a
observabilidade sem volume (por desenho).

## 6. Contratos

Explícitos e testados: o catálogo de mensagens de erro do Caddyfile contra `MENSAGENS_DE_ERRO` (`tools/ci/borda.test.ts`); relações
`health_interval x fails` x `DRENAGEM_ESPERA_BORDA_MS` (idem); cada alerta Grafana com `runbook_url` e entrada no runbook no formato fixo
(`tools/guardas/alerta-tem-runbook.ts`); soma dos pools das duas APIs cabe em `max_connections` (`tools/ci/compose.int.test.ts` [doc: comentário do
compose]); lista fechada de exceções às guardas (`guardas.test.ts`). Implícitos: ~70 variáveis de ambiente repetidas à mão por serviço no
`compose.yml` (api, realtime, despachante, worker) sem esquema único; a conferência é só o `:?`. `.env.example` (231 linhas) é a fonte, e o
Dockerfile, `engines`, `.nvmrc` repetem a versão do Node (22.23.2 / `>=22.18 <23`) [código].

## 7. Testes

Tudo na unidade tem teste do próprio tooling, o que é incomum e bom: `tools/ci/*.test.ts` (esteira, scripts reais `ci:*`, compose, borda, duração
do e2e, literal do e2e, tamanho da web, fila de carga), `tools/guardas/guardas.test.ts` (327 l. com fixtures `__fixtures__` de violação),
`gitleaks.int.test.ts`, `infra/test/*` (borda, métricas, 4 alertas com ensaio real, jobs, carga, expurgo). Camadas: unidade (sem Docker), integração
(`*.int.test.ts` no projeto `integracao` ou `infra`, `fileParallelism: false`). Sinais: (a) `scripts.test.ts` roda scripts `ci:*` "reais" com stubs
[hipótese: lento]; (b) vários testes leem o texto de arquivos (`ci.yml`, Caddyfile, compose) e conferem substrings — protegem de regressão de
configuração, mas são frágeis a reformatação (ex.: `painel.test.ts` "exige cada uma destas linhas" do compose); (c) o `vitest.config.ts`
fixa `TZ=Asia/Tokyo` só na unidade — decisão boa para achar teste dependente de fuso.

Sem teste: o `Caddyfile` em carga real além do `borda.int.test.ts`; `infra/k6/*.js` só roda localmente (`CI` não chama carga: `ci.yml` não menciona carga) —
a regra 80 item 11 e os cenários de carga não são portão da esteira [código, `ci.yml`]; backup/restauração (ver 8).

## 8. Resiliência e escala (sinais)

- **Health/graceful shutdown** [código]: `/saude` (consulta o banco, `saude.service.ts`) e `/prontidao` separados; a borda sonda `/prontidao` para um Postgres lento
  não tirar as duas APIs; `enableShutdownHooks(['SIGTERM','SIGINT'])` em `apps/api/src/main.ts:31` e em realtime/despachante/worker; `stop_grace_period`
  declarado; Caddy com `lb_try_duration` e página 503 no envelope da API. Bom desenho. O `/saude` é o único check que toca dependência.
- **Backup e restauração**: [doc] `docs/infra.md` 6.3 (RPO 5 min, RTO 1 h, "restauração executada") e item de checklist; [código] não há script, serviço
  nem teste de backup/restauração em `infra/` nem em `tools/ci`; a entrada do runbook "Backup do dia não concluído" está vazia ("A preencher antes da primeira
  escola real", `runbook.md:716-718`). Dependem do provedor gerenciado (D26), ainda não escolhido (D42).
- **Rollback**: [doc] "um comando, ensaiado" (`infra.md` 6.2 e checklist), e há uma entrada de runbook de rollback só para o código com eliminação agendada
  (`runbook.md:615`). [código] não achei nenhum procedimento ou teste de rollback de deploy/migration em `infra/`; só a estratégia expandir-migrar-contrair é
  declarada. Não há deploy automatizado nesta árvore (staging não existe, D31).
- **Observabilidade**: OpenTelemetry só para **métricas** (OTLP HTTP, `packages/nucleo/src/telemetria`, 544 linhas); não vi traces nem log estruturado enviado ao
  coletor [código, grep de `trace` vazio]. `grafana/otel-lgtm` (Loki/Tempo/Pyroscope presentes na imagem mas sem uso pelo código) com 13 alertas, cada um com runbook;
  1 painel de 1732 linhas JSON. Sem Alertmanager/ponto de contato: o alerta "não sai da máquina" por desenho (`compose.yml` comentário), entrega ao celular
  fica para o staging [doc].
- **Limites de recurso**: o `compose.yml` base não tem `cpus`/`mem_limit` (só a sobreposição de carga, `compose.carga.yml`); sem `restart:` policy nos serviços de longa duração
  (só `migrar` com `restart: 'no'`) [código, grep]. Bom para dev, mas o arquivo é também a "referência" do que sobe em produção [hipótese].
- **Dockerfiles**: usuário não-root na imagem final (api/worker/etc. `USER node`), multi-estágio, `--ignore-scripts`. Imagem web = `vite preview` ("fumaça do F0",
  `web.Dockerfile:1`) rodando como produção do front se ninguém trocar: não é servidor estático dedicado.

## 9. Suspeitos de código morto

Procurei por referência em `package.json`, `ci.yml`, outros scripts e testes (grep).
- `infra/k6/*.js` — usados por `infra/scripts/carga*.ts` (referência por string/caminho); vivos para quem roda carga, mortos para a esteira.
- `tools/demonstracao/` (1242 linhas ts + PDF de 349 linhas de binário): usado por `npm run demonstracao:material` e por 2 testes
  (`material.test.ts`, `ia-com-o-material.test.ts`) — referência dinâmica possível a partir de e2e/A1 [hipótese]; é código de demonstração, não de produto.
- `pdfjs-dist` e `pdfkit` aparecem em `package.json` raiz (devDeps) **e** em `apps/api` (deps) [código]; `pdfkit` na raiz serve a `tools/demonstracao/gerar-material.ts`,
  `pdfjs-dist` na raiz a `extrair-texto.ts` — duplicidade de declaração, mesma versão. Não é morto, é redundante.
- `@size-limit/file`/`size-limit`: usados em `prazo-do-e2e.ts` (`npx size-limit`). Vivos.
- `infra/oidc-falso/config.json`: referenciado por `compose.yml`. Vivo.
- Não pude afirmar nada sobre morto dentro de `apps/*` (fora desta unidade). Nenhuma ferramenta de código morto está instalada (ver 10).

## 10. Duplicação e inconsistência

- **12 scripts `ops:*` quase idênticos** (`package.json:25-36`): cada um repete `npm run -s build -w @educa/shared && build -w nucleo && build -w api && node --env-file=.env.example apps/api/dist/ops/<x>.js`
  (~190 caracteres repetidos x12; `ensaio:alertas` e `carga:login*`/`carga:sala` repetem a mesma cadeia de build mais 4x). Faltam um `ops:build` e um `ops` único
  (`node tools/ops.ts <comando>`). `comando.ts` na API já centraliza argumento/erro/operador, mas o script npm não. Total: 17 scripts com a mesma cadeia.
- **`ops:*` carregam `.env.example`** (`--env-file=.env.example`): o comando de operador roda com a configuração sintética de exemplo, não com um `.env` próprio [código]. Sinal de que o caminho "operador em produção" ainda é só desenvolvimento [hipótese].
- **4 Dockerfiles de serviço quase iguais** (`api`, `worker`, `realtime`, `despachante`, 36-39 linhas cada, só mudam o nome do app e a linha de migrations). Um `ARG APP` único removeria três.
- **Bloco de ambiente copiado** entre `api-1`, `realtime-1`, `despachante-1`, `worker-*` no compose (`TELEMETRIA_OTLP_URL`, `BANCO_*`, `DRENAGEM_*`, `UV_THREADPOOL_SIZE`...): `grep` conta 5 repetições de `TELEMETRIA_OTLP_URL` com o mesmo comentário. `x-` extensions do compose resolveriam.
- **Versão do Node em 4 lugares** (`.nvmrc` 22.23.2, `engines`, 5 Dockerfiles `node:22.23.2-alpine3.23`): sem teste de coerência que eu tenha visto [hipótese: confirmar `grep` em `tools/ci/*.test.ts`].
- **`ENDERECO_DO_RUNBOOK`** aponta para `github.com/LitzGab/Educa.ia/...` (`alerta-tem-runbook.ts:21`), repositório renomeado para `Turmma.ai` (CLAUDE.md). Link de alerta pode quebrar [hipótese: depende do redirect do GitHub].
- `.gitleaks.toml` título `"Educa.ia"`; resíduo de nome antigo, irrelevante.
- Versões desalinhadas nos pacotes Nest [código, package.json]: `@nestjs/common|core` 12.0.1, `platform-express` 12.1.2 (api e realtime), `platform-socket.io` 12.0.1. Minor diferente entre pacotes do mesmo framework; confirmar compatibilidade.
- `vite` 8.3.0 declarado na raiz e em `apps/web`; `typescript` só na raiz (ok). `pino` declarado em nucleo, despachante, worker (3 vezes, mesma versão).
- Arquivos grandes: `ensaio-alertas.ts` 722, `expurgo-da-carga.ts` 710, `fundacao.json` 1732 (JSON de painel gerado/exportado à mão), `duracao-do-e2e.test.ts` 569. A esteira tem mais código de gestão da própria esteira (duração, literal, prazo, fila, ambientes) do que de verificação: `tools/ci` ~3,6 mil linhas para 4 comandos.

## 11. Travas por máquina: regra -> checagem -> arquivo

| Regra | Trava | Onde | Lacuna |
|---|---|---|---|
| 20 item 9 (sem dado pessoal em log) | ESLint `guardas/log-sem-dado-pessoal` e `log-sem-conteudo-montado`; lista de chaves = `redact` do logger (teste compara) + gitleaks | `tools/guardas/regras-log.mjs`, `index.mjs` | só `logger.*`; `console` proibido por `no-console` |
| 20 itens 1-2 (campo pessoal só na tabela LGPD) | teste que classifica toda tabela das migrations para retenção/arquivo; toda coluna tem destino | `apps/api/test/arquitetura.test.ts:1191,1303` | não vi trava que compare colunas de aluno com `docs/lgpd.md` |
| 10 item 1 (`escola_id` em toda tabela) | teste varre migrations; exceções nomeadas em `docs/modelo-de-dados.md` | `arquitetura.test.ts:997` | é por migration, não por repository |
| 10 itens 3 e 9 (escopo no repository, `@SemEscopo` contado) | testes de arquitetura por repository ("só o X toca as tabelas Y", "nenhum método recebe a escola", lista fechada de `@SemEscopo`) | `arquitetura.test.ts` (varios describes) | feito módulo a módulo e à mão: repositório novo não herda a trava |
| 10 item 5 (teste de isolamento por módulo) | convenção + guardião; testes `*-isolamento.int.test.ts` | `apps/api/test/*isolamento*` | nenhuma máquina garante que módulo novo tenha um |
| 30 item 1 (SDK de IA só no adaptador) | `no-restricted-imports` + `guardas/sdk-de-ia-so-no-adaptador` (dinâmico, require, tipo) | `regras-ia.mjs` | lista de pacotes é fixa (nome) |
| 40 (sem `.skip`, sem atalho) | `guardas/teste-sem-desligar`, `esperar-servico-do-compose`; `@eslint-comments/no-restricted-disable`; 2ª passada que ignora comentário | `regras-teste.mjs`, `lint.ts` | cobertura mutacional só no portão da tarefa (`tools/processo/mutacoes.ts`, fora desta unidade) |
| 40 (tipos) | `any` proibido, `consistent-type-assertions: never` só no processador do worker | `eslint.config.mjs:35,52-56` | `strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes` no tsconfig base |
| 50 (peso no Chromebook) | `size-limit` por chunk + teste do primeiro carregamento (150 kB brotli) + `casca-sem-import.test.ts` | `.size-limit.json`, `tools/ci/tamanho-web.test.ts`, `apps/web/nome-dos-chunks.test.ts` | LCP/CPU só no e2e com throttle |
| 50 (a11y, contraste) | `contraste.test.ts`, `@axe-core/playwright` no e2e, projetos `chromebook` e `celular` em todo spec | `apps/web/src/contraste.test.ts`, `playwright.config.ts` | sem `eslint-plugin-jsx-a11y` |
| 80 item 10 (alerta com runbook) | guarda que cada regra Grafana aponta para entrada do runbook | `tools/guardas/alerta-tem-runbook.ts` | |
| 80 itens 3-5 (limites, pools, DNS, borda) | testes de infra (`compose.int.test.ts`, `borda.test.ts`, `jobs.int.test.ts`, métricas) | `tools/ci/`, `infra/test/` | cenário de carga fora da esteira |
| 00 item 3 (repository único que toca banco) | parcial: testes de arquitetura por tabela/repository | `arquitetura.test.ts` | não há regra que proíba `db` importado fora de `*.repository.ts` genericamente [hipótese: confirmar com grep em U da API] |
| 70 item 1 (nota só com autor humano) | **nenhuma** achada: `lancadaPor|lancad` não aparece em `packages/nucleo/src/db/schema` fora de `correcao.ts` | — | tabela de nota ainda pode nem existir (MVP); trava estrutural prometida pela regra não existe como máquina |
| 00 itens 2, 5, 6 (controller sem regra, DTO de saída, contrato em `shared`) | nenhuma máquina | — | |
| 00 item 9 (erro de domínio tipado, sem string) | nenhuma (`no-throw-literal` vem no `js.recommended`? `no-throw-literal` não está no recommended; `@typescript-eslint/only-throw-error` não ativada) | `eslint.config.mjs` | |
| 20 item 8, 10 (auditoria, convite) | teste de porta única de auditoria | `packages/nucleo/src/auditoria/porta-unica.test.ts` | |
| Segredos | gitleaks por digest + `.gitleaks.toml` sem allowlist larga | `tools/ci/segredo.ts` | |
| Dependência | `npm audit --audit-level=high --omit=dev` | `package.json:20` | só npm; dev e imagens não |

**O que falta travar (resumo)**: nota com autor humano e D55 (estruturais), DTO de saída/controller sem lógica, `throw` tipado, repository novo herdar as
travas de escopo sem teste manual, e carga como portão da esteira.

## 12. Ferramentas de qualidade: presentes e ausentes

Presentes [código]: `tsc` estrito em cada workspace; ESLint 10 `strict` + react-hooks + guardas próprias; `--max-warnings=0`; gitleaks; `npm audit`; size-limit;
Playwright com axe; Vitest em 3 projetos; mutações no portão da tarefa (`tools/processo`); actions fixadas por SHA; fila de carga por `flock`.

Ausentes (nenhuma em `package.json` nem em `package-lock.json`, grep de `knip|madge|jscpd|dependency-cruiser|c8|@vitest/coverage|ts-prune|depcheck|semgrep` vazio;
`ls .github` só `workflows/`): código morto/exports sem uso, duplicação, complexidade ciclomática/tamanho de função/arquivo (`max-lines`, `complexity`), ciclos de import,
cobertura de linhas (mutação cobre parte), SAST (CodeQL/semgrep), scan de imagem (Trivy/Grype), lint de Dockerfile (hadolint), SBOM, Dependabot/Renovate (versões fixas à mão),
`eslint-plugin-jsx-a11y`, `@typescript-eslint/no-floating-promises`/`only-throw-error` (tipadas; `tseslint.configs.strict` não é `strictTypeChecked`, então sem regras que usam tipo).
Nenhum job de `npm run build` direto: o build só acontece dentro do `docker compose --build` do integracao/infra/e2e.

## 13. Doc x código

- `docs/infra.md` 6.3 pede backup contínuo + restauração executada e 6.2 rollback ensaiado; código não tem nenhum (runbook de backup vazio) — esperado pela fase (D31, D42), mas é o item mais longe de pronto.
- Regra 80 item 11 (teste de carga sem provedor pago) vale nos scripts, mas a carga **não roda na esteira**; item 9 (migration compatível) só tem o desenho de `migrar` (expandir), sem teste de "versão anterior do código contra schema novo" que eu tenha visto [hipótese: confirmar em `packages/nucleo/src/db/migrar.int.test.ts`].
- `CLAUDE.md` diz "tudo sobe com `docker compose up`" e "`.env.example` único": confere (`compose.yaml:5-7`).
- `ci.yml` comentário do job integracao diz "uns 5 min" com timeout 20; infra diz "16 min" com 45; e2e: a conta de 7 s/caso e 4 min fixos vem de log de esteira (docs em `tasks/correcoes/`), sem série histórica no repositório.
- Docs apontam OTel como "porta" para escolher a ferramenta depois (`infra.md` 7): o código já fixa `otel-lgtm` local e só métricas.

## 14. Risco de mexer e dependências

| Parte | Risco | Por quê |
|---|---|---|
| `package.json` scripts `ops:*` | baixo | trocar por um runner único; `tools/ci/scripts.test.ts` e runbook (7 menções) citam nomes |
| Dockerfiles / compose | médio | testes leem o texto do compose e do Caddyfile (`painel.test.ts`, `compose.int.test.ts`, `borda.test.ts`) |
| `eslint.config.mjs` / guardas | médio-alto | `lint.ts` tem segunda passada que depende do config; mexer pode abrir comentário de desligar |
| `ci.yml` e `tools/ci` | médio | `esteira.test.ts` fixa o YAML; portão local (`tools/processo`) e Playwright importam `tools/ci/compose.ts` |
| `infra/grafana/*` e alertas | médio | cada alerta tem teste de ensaio real e entrada de runbook |
| `tools/demonstracao` | baixo | isolada, usada só por demo |

Depende de: Docker, Node 22.23.2, `apps/api/dist/ops`, `@educa/nucleo` (migrations), `docs/runbook.md`. Dependem dela: tudo (portão, esteira, U da API para `arquitetura.test.ts`).

## 15. Os 5 achados mais importantes

1. A suíte de arquitetura da API (`arquitetura.test.ts`, 1403 linhas) é a trava real de regras 10/20, mas é escrita módulo a módulo (uma `describe` por repository/tabela); repository novo não nasce travado, e a regra 70 item 1 (nota só com autor humano), o controller sem lógica (00-2) e DTO de saída (00-5) não têm nenhuma trava por máquina.
2. Faltam todas as ferramentas de higiene que a reengenharia precisa: código morto (knip), ciclos (madge/dependency-cruiser), duplicação (jscpd), complexidade, cobertura, SAST, scan de imagem e Dependabot; os `devDependencies` não têm nenhuma delas.
3. A esteira é longa e cresce linearmente com o e2e (1196 casos, 7 fatias de 45 min cada, fatia acrescentada à mão a cada estouro); `tools/ci` gasta ~3,6 mil linhas administrando a própria esteira (prazo, duração, fila, ambientes) e a carga (k6) nem entra nela.
4. Backup, restauração e rollback são só texto (`docs/infra.md` 6.2-6.3; runbook "Backup do dia não concluído" vazio); não há script nem teste, e o `web.Dockerfile` ainda é `vite preview` de "fumaça do F0".
5. Duplicação mecânica fácil de enxugar: 12 scripts `ops:*` (e mais 5 `carga*/ensaio`) repetindo a mesma cadeia de build, 4 Dockerfiles quase idênticos, e bloco de variáveis copiado nos serviços do compose; os `ops:*` ainda leem `--env-file=.env.example`.
