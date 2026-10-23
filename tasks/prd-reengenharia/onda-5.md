# Tech Spec da X5 — Onda 5: testes e infra

**Comum:** `techspec.md` · **PRD:** RF27–RF29 · **Tarefas:** 81.0 a 91.0

Corre ao lado das ondas 2 a 4, sem migration, schema nem `packages/shared`.

## 1. O que muda

Semente tipada após um spike, helper uma vez, prazo em toda espera, três medidas, um Dockerfile e profiles. O produto
fica igual.

## 2. Desenho

### RF27 — o spike da semente (81.0)

Um spec descartável do Playwright importa as tabelas Drizzle (`rede`, `escola`, `usuario`) e insere por `criarBanco`, sem
`dist` (apagado antes, como na esteira); a mesma função roda no Vitest; o arranque do trabalhador não encarece
(`@educa/nucleo` puxa AWS SDK e ioredis); e a guarda de `tools/ci/playwright.test.ts` fica verde, ou muda com motivo.
Os caminhos, em ordem:
- **A:** `NODE_OPTIONS=--conditions=source` em `tools/ci/e2e.ts`.
- **B:** `paths` em `e2e/tsconfig.json`.
- **C:** SQL central em `tools/testes/semente/`, tipado por `import type` do schema: o `tsc -p e2e/tsconfig.json` do
  portão reprova a coluna nova obrigatória.

Resultado em `tasks/prd-reengenharia/spike-da-semente.md`; se os três falharem, a 84.0 espera o Joaquim.

### RF27 — a semente e a fábrica de escola (84.0 e 85.0)

**Onde mora.** `tools/testes/semente/`, um módulo por assunto (`escola`, `convite`, `estrutura`, `turma`, `titular`,
`incidente`): é a divisão do `e2e/__fixtures__/sessao.ts` (1.300 linhas), junto com a semente.

**Interface:** `escola(opcoes?: { papel?; semAnoLetivo?; rede? }): Promise<EscolaSemeada>`, dois adaptadores:
- `pelasPortas(banco)` usa `criarRede` e `criarEscola` de `operacao/casos-de-uso/` (35.0), com a auditoria da produção.
  Serve integração, worker, despachante, realtime e infra, e substitui `BancadaDeSessoes.escola()`, o `escola()` de
  `fila-de-teste.ts` e os `insert into escola` soltos;
- `direto(banco)` insere pelo caminho do spike, e serve o e2e.

Rejeitado: adaptador por HTTP (a API só cria escola pelo painel da operação).

**A trava.** `semente.int.test.ts` roda cada função contra o banco migrado, e `no-restricted-syntax` barra `insert into`
literal em `e2e/**` fora da semente (hoje 110 inserts em 6 fixtures; a lista só encolhe). A semente nunca desliga
gatilho nem grava `nota`: um caso do `semente.int.test.ts` reprova `session_replication_role`, `disable trigger` e
`insert into nota` em `tools/testes/semente/`.

### RF27 — o helper uma vez (82.0, 83.0 e 86.0)

**Módulos únicos:**
- `e2e/__fixtures__/acoes.ts`: `acionar`, `alvoDeToque`, `tabAte`, `outroNavegador` e `abrirJaEntrando`.
- `e2e/__fixtures__/rede.ts`: `portao`, `segurarRota` e `erroHttp(status, codigo: CodigoDeErro)` no lugar do envelope à mão.
- `e2e/__fixtures__/banco.ts`: `comBanco`, com um `Pool` por trabalhador.

**As fixtures com teardown** (86.0): `e2e/__fixtures__/dados.ts` (`operador`, `painel`, `equipe`, por `test.extend`),
compostas no `test` de `perfis.ts`. Os 7 `afterEach` somem.

**A trava contra a cópia**, em `tools/guardas/`, na segunda passada (que ignora comentário), tem três camadas:
- **(a)** `guardas/helper-de-teste-uma-vez`, em `regras-teste.mjs`, reprova `function` ou `const` de seta com nome de
  `HELPERS_DE_TESTE` (nome → módulo dono) fora do dono, em `e2e/**`, `apps/*/test/**`, `tools/testes/**` e `*.test.ts`.
- **(b)** A lista dos arquivos com cópia só encolhe, e a 83.0 a zera, um spec por commit.
- **(c)** Um teste com o `typescript` reprova o mesmo hash de corpo de função nomeada (5 linhas ou mais) em dois arquivos
  de teste: pega a cópia renomeada.

Escapa a cópia com literal trocado; o jscpd (`npx`, R4) mede a queda das 4.285 linhas.

### RF27 — o prazo em toda espera (87.0)

**Hoje sem prazo:** `rodarEtapa` (`tools/ci/executar.ts:19`); `spawnSync('docker')` (`tools/testes/integracao.setup.ts:18`,
`tools/testes/compose.ts:18,39`); `up --wait` sem `--wait-timeout`; `flock` sem `-w` (`fila-de-carga.ts:86`);
`ensaio-alertas.ts:655` e `carga.ts:216`; o Playwright, sem `globalTimeout`.

**Muda:**
- `Etapa.prazoMs` é obrigatório no tipo, o `spawn` leva `timeout`, e a mensagem diz o comando e o prazo.
- O compose sobe com `--wait-timeout 300`, e o `flock` usa `-w`, com o dono da trava na mensagem.
- `globalTimeout` é `tetoDoE2e()` menos 5 min na esteira, e 90 min na máquina; a fatia presa termina com relatório e traço.

**Trava:** `guardas/espera-com-prazo` reprova `spawn*` ou `execFileSync` de `docker`/`flock` sem `timeout`.

### RF28 — as medidas (88.0)

| Medida | Como | Destrava |
|---|---|---|
| Infra por arquivo | `ci:infra --reporter=json`: montagem = duração do arquivo menos a soma dos casos, em duas rodadas (a 1.ª baixa a imagem) | juntar os 4 `alerta-do-*` numa subida e partir o job de infra (U10-1, U10-2) |
| p95 de `sessao.leitura.duracao` e espera do pool | `npm run carga:login -- --fases base,rajada`, com observabilidade, por fase | o texto da regra 80.5 na Etapa 9, se ficar **≤ 50 ms e ≤ 100 ms** (R40); senão, o cache (U02-6) |
| Rede lenta | A/B nos 10 maiores specs, nos dois projetos, com `EDUCA_RELATORIO_DO_E2E`; a B troca a rede do perfil por `REDE_SEM_LIMITE` num patch local, sem commit, e mantém a CPU ×4 | a leitura da D51 (N8) |

Números em `tasks/prd-reengenharia/medidas-da-onda-5.md` (só a máquina da linha de base), bruto em
`.processo/reengenharia/medidas/` (R15). O Orquestrador os leva ao Joaquim; o que destravam nasce depois da resposta.

### RF29 — Dockerfile, profiles e aviso de prazo (89.0 a 91.0)

**Dockerfile único (90.0):** `infra/docker/servico.Dockerfile` substitui os cinco.
- `base` roda `npm ci` e o build de `shared` e `nucleo` uma vez; `construcao` e `final` são por app, com `target` em cada
  serviço. As `image: educa-<x>:local` ficam (as etiquetas `teste-N` dependem delas). A web vira target, com `vite preview` (R28).
- **Antes do Dockerfile, no mesmo commit da tarefa:** `imagensDosServicos` (`tools/ci/compose.ts:259`) troca a regex por `yaml.parse(..., { merge: true })`. A medida "antes" é a do commit pai, feita antes de qualquer mudança.
- `.dockerignore` ganha `mockups`, `.processo` e `.reengenharia`.
- A trava: um teste exige que todo serviço com `build` use o arquivo único, com `target` que existe.
- As imagens se medem (`docker compose build --no-cache`, `docker image ls`) no commit pai e no da tarefa.

**Profiles (91.0):**
- `profiles: [observabilidade]` tira a JVM do e2e; os testes de infra a nomeiam.
- `realtime-1/2` ganham `profiles: [realtime]`, e o `depends_on` da `borda` neles vira `required: false`.
- Nada sai: `apps/realtime/test`, `borda.int.test.ts` e `metricas.int.test.ts` ativam o profile pelo helper de
  `tools/testes/compose.ts`.
- ⚠️ Premissa (`techspec.md` §12): a 91.0 prova primeiro o profile e o `required: false` no compose da esteira.

**Aviso de prazo (89.0):** `tools/ci/prazo-do-e2e.ts` vira `tools/ci/prazo-do-job.ts`, com `tetoDoJob(job)` do `ci.yml`.
- `verificar`, `integracao`, `infra` e `e2e` emitem `::warning` no limiar: o do e2e fica, os outros a 80 % do teto.
- `esteira.test.ts` exige teto e aviso em todo job.

## 3. Falha

| Falha | Teste |
|---|---|
| Etapa além do prazo | comando que dorme além de `prazoMs` é morto, e a mensagem o cita |
| Trava presa | `flock -w` em `fila-de-carga.test.ts` |
| Teardown | fixture cujo `use` lança: operador e escola de teste saem |
| Profile | `compose.int.test.ts` sem o serviço do profile; e2e verde sem Grafana |

## 4. Isolamento, dado pessoal, conformidade, carga

Uma escola por chamada da semente, e os testes de isolamento seguem na bancada; o dado continua sintético, em `.invalid`
(regra 20.17); nenhum e2e obrigatório da regra 40 sai nem enfraquece; as medidas usam os cenários de carga que já existem.

## 5. Tarefas

| # | Título | RF | Depende de | Veto | Porte | Paralelo com |
|---|---|---|---|---|---|---|
| 81.0 | Spike: o e2e insere por tabela Drizzle sem `dist`, ou escolhe A, B ou C | 27 | 29.0 | — | pequeno | 82.0, 87.0, 89.0 |
| 82.0 | Helper de e2e uma vez; a cópia reprova o lint | 27 | 29.0 | — | grande | 81.0, 87.0, 89.0 |
| 83.0 | Nenhum spec copia helper (um por commit; onda 4 por último) | 27 | 82.0 | — | grande | 84.0, 87.0 |
| 84.0 | Coluna obrigatória nova quebra o teste da semente | 27 | 81.0, 35.0 | tenancy | grande | 83.0, 87.0 |
| 85.0 | O e2e semeia só pela semente; `insert into` novo reprova | 27 | 84.0 | tenancy | grande | 87.0 |
| 86.0 | Operador, painel e equipe de teste saem mesmo com caso estourado | 27 | 82.0 | — | pequeno | 84.0 |
| 87.0 | Toda espera da infra de teste tem prazo | 27 | 29.0 | infra | grande | 81.0–86.0 |
| 88.0 | Infra por arquivo, p95 da sessão e custo da rede lenta medidos | 28 | 47.0 | infra | pequeno | 89.0 |
| 89.0 | Os quatro jobs avisam no limiar do teto | 29 | 29.0 | infra | pequeno | 81.0–88.0 |
| 90.0 | Um Dockerfile com `target`, imagens medidas antes e depois | 29 | 24.0 (D81; a 54.0 foi para a X6) | infra | grande | 81.0–88.0 |
| 91.0 | E2e sem observabilidade, realtime atrás de profile, nada apagado | 29 | 90.0 | infra | pequeno | 83.0 |

**Conflitos:**
- A 83.0 deixa para o fim os specs das ondas 2 e 4: sino, painel, Aprovar, Tutor, Atividade, Mfa, Entrar e operação.
- `sessao.ts` só recebe acréscimo no fim até a 85.0, e a 90.0 espera a 24.0 (D81: a 54.0, dona do `infra/compose.yml` da onda 3, foi para a X6; a 43.0 também toca o `compose.yml`, e as duas não correm juntas).

## 6. Riscos

- **O spike** pode reprovar A e B; o C segue tipado.
- **A catraca da 83.0:** o e2e novo das ondas 3 e 4 nasce com os helpers únicos, cobrado pela regra (a).
- **O p95** só mede a manhã de segunda se rodar depois da IA no worker (47.0).
