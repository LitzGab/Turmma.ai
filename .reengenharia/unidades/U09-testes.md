# U09 — Infraestrutura de testes (e2e, configs, helpers, tools/testes)

Todas as contagens abaixo são de `grep`/`wc` na árvore `spec/reengenharia`; nada foi executado.

## 1. Finalidade e limites

Prova, contra o compose de teste inteiro (API, worker, web, Postgres, Redis, storage e `oidc-falso`), o que o usuário vê em cada tela, e dá a cada camada os helpers de semente de dado e de ambiente. Não é desta unidade o conteúdo dos `*.test.ts` e `*.int.test.ts` de cada módulo.

| Parte | Tamanho |
|---|---|
| `e2e/*.spec.ts` | 75 arquivos em `e2e/`, 30.209 linhas no total (**[código]** `wc -l e2e/*.ts`); 594 `test(` (**[código]** grep); cerca de 1.190 execuções, porque cada spec roda nos 2 projetos |
| `e2e/__fixtures__/` | 5.139 linhas em 29 arquivos; `sessao.ts` sozinho tem 1.300 |
| `apps/api/test/` | 88 arquivos, 35.108 linhas; 18 deles são helpers sem `.test.` (2.407 linhas) |
| `apps/worker/test`, `apps/despachante/test`, `apps/realtime/test`, `infra/test` | 14, 6, 3 e 16 arquivos |
| `tools/testes/` | 8 arquivos, 485 linhas |
| `tools/ci/` e `tools/processo/` (infra de execução dos testes, de passagem) | cerca de 11,4 mil linhas |
| `apps/web/src/__fixtures__` | 4 arquivos, 296 linhas |
| `tools/guardas/` (lint de teste, 822 linhas) | **[código]** `tools/guardas/regras-teste.mjs` e outras regras |

Existe um único `vitest.config.ts`, o da raiz (**[código]** `find`). Os apps não têm config própria. A raiz define 3 projetos: `unidade` (com `TZ: 'Asia/Tokyo'`), `integracao` (sem paralelismo de arquivo, `testTimeout` 60 s, `hookTimeout` 180 s, `globalSetup` que sobe o compose) e `infra` (**[código]** `vitest.config.ts:28-72`). Hoje são 406 arquivos de teste em `apps` e `packages`: 129 `.int.test.ts` no total do repositório e 327 de unidade (**[código]** `find`).

## 2. Pontos de entrada

| Comando (`package.json`) | O que faz |
|---|---|
| `npm run test` | `vitest run --project unidade --project integracao` (**[código]** `package.json:16`) |
| `npm run test:infra` | projeto `infra`, que usa o relógio real, cerca de 16 dos 21 minutos da integração (**[doc]** comentário em `vitest.config.ts:8-11`) |
| `npm run test:e2e` / `ci:e2e` | `tools/ci/e2e.ts`: pega a fila de carga (`flock /tmp/educa-carga.lock`), sobe o compose e roda o Playwright |
| `node tools/processo/portao-local.ts --tarefa` | portão da tarefa (regra 40) |
| CI | `.github/workflows/ci.yml`, job `e2e` em 7 fatias (`--shard=N/7`), `timeout-minutes: 45` (**[código]** ci.yml:70-99) |

Config do Playwright (**[código]** `playwright.config.ts`): `fullyParallel`, `retries: 0`, `forbidOnly` só na CI, nenhum `timeout`, `expect.timeout` ou `workers` declarado (vale o padrão de 30 s), trace em falha, `colorScheme: 'light'`, fuso fixo. Há uma regra de resolução de DNS do Chromium que mapeia o emissor do `oidc-falso` para a porta do host.

## 3. Fluxos e regras: mapa dos E2E obrigatórios da regra 40

| Fluxo exigido | Existe? | Onde |
|---|---|---|
| Onboarding completo (coordenação monta, professor aceita e convida, aluno reivindica, professor aprova) | Sim, por inteiro numa linha só | `escola-montada.spec.ts:63`, o "W1": um único `test` de 240 linhas, da escola vazia à aluna aprovada. Peças em `convite.spec`, `pedidos.spec`, `turma-publica.spec`, `acesso-da-turma.spec`, `alocacao.spec` |
| Operação cria escola e convida a coordenação | Sim | `roteiro-da-demonstracao.spec.ts:110`: um `test` de 680 linhas que vai do painel da operação à governança. Mais `operacao-convite*.spec` |
| Planilha suja | Parcial | `lista-da-turma.spec.ts:62` (Excel em windows-1252, UTF-8 com BOM e vírgula, prévia com erros primeiro, gravar só sem erro, uma vez só) e `estrutura.spec.ts`. A fixture `lista-excel.csv` tem 5 linhas (matrícula repetida, matrícula vazia, acento em encoding antigo). Não há caso de "turma escrita de três jeitos" nem planilha de grade ou calendário |
| Aplicação e correção de avaliação, em cada modo | Só online objetiva | `a3-a4-professor.spec.ts:22`, `aluno-fluxo.spec.ts`, `aluno-atividade.spec.ts` (12 casos), `professor-aplicacao`, `professor-aprovar` (aprova com validação registrada). Discursiva e papel: só a recusa do Assistente (`a2-assistente.spec.ts:139`, D55). Nenhum e2e de modo papel, trabalho ou presencial; **[doc]** isso é coerente com o MVP, mas a regra 40 pede cada modo |
| Aprovação de entrega de agente | Sim, com sobreposição | `a2-assistente.spec.ts` (aprova e rejeita), `professor-entregas.spec.ts:88,160`, `professor-artefato`, `governanca.spec.ts` |
| Login por matrícula | Sim | `entrar-na-escola.spec.ts:64-206` (teclado, toque, isolamento entre escolas com a mesma matrícula, conta segurada, clique duplo) e `aluno-fluxo` |
| Tutor recusando resposta | Sim, de uma forma só | `aluno-fluxo.spec.ts:96-105` (resposta pronta recusada, volta pergunta e página). `aluno-tutor.spec.ts` cobre a tela (pausa, limite, suspensão). A regra 40 pede "de três formas diferentes"; no e2e há uma. **[hipótese]** as outras duas devem estar em `tutor.int.test.ts`; conferir |

Invariantes provadas no e2e: isolamento de tenant (48 menções a "outra escola" ou "isolamento" em 26 arquivos), D55 (recusa de redação), D36 (188 no Tutor). O que cada clique fez se confere **no banco** em vários specs (`pedido-do-titular`, `meus-dados`, `pedidos-do-titular`), com função de leitura em `sessao.ts` (por exemplo `leiturasDePedidosNaAuditoria`, `situacaoDoPedidoNoBanco`).

## 4. Dependências

- Internas: `e2e/__fixtures__/sessao.ts:1-12` importa direto código de produção (`apps/api/src/sessao/hash-do-token.ts`, `packages/shared/src/...`). **[código]** Os specs não importam `@educa/*` pelo nome, e isso é guardado (`tools/ci/playwright.test.ts:73`).
- `apps/api/test/sessao-de-teste.ts` (a `BancadaDeSessoes`) importa `criarEscola`/`criarRede` de `apps/api/src/ops/escola.js` e `CriacaoDeSessaoRepository`: a integração semeia pelas portas de produção. O e2e semeia por SQL cru. **São duas estratégias para o mesmo fim.**
- Externas: Docker Compose (`spawnSync('docker', ...)` em `tools/testes/integracao.setup.ts`), Postgres (`pg`), `@node-rs/argon2`, `otpauth` (código TOTP), `@playwright/test` 1.63.0, `vitest` 5.0.0, `flock` do Linux.
- `tools/testes/compose.ts` (128 linhas) e `tools/ci/compose.ts` (352 linhas) são dois módulos "compose"; o primeiro importa o segundo. 120 arquivos importam de `tools/testes`. **[hipótese]** A fronteira entre os dois é histórica; confirmar lendo quem importa de cada um.

## 5. Dados

- E2E: semente por SQL cru em `sessao.ts` (`insert into rede/escola/ano_letivo/conta/usuario/...`) e em `painel.ts`, `operacao.ts`, `governanca.ts` etc. São 11 pontos de `insert into escola` (`sessao.ts` ×6, `painel.ts` ×5), mais variantes de turma, vínculo, convite, pedido, incidente e pedido do titular, tudo escrito à mão em SQL. **Qualquer migration que mude coluna obrigatória quebra o e2e em muitos pontos, e o `tsc` não avisa.** **[código]** `e2e/__fixtures__/sessao.ts:87-93`.
- Sete cópias de `comBanco` (abre um `pg.Client` por chamada): `sessao`, `painel`, `operacao`, `governanca`, `roteiro`, `a3`, `material` (**[código]** grep `function comBanco`).
- **Isolamento entre execuções**: o e2e **não limpa** (só `painel.ts:153-156` e `operacao.ts:132-137` apagam o que criaram). Cada chamada cria escola e rede com UUID. O banco acumula; a regra 40 sabe e manda filtrar pelo que o teste criou. A `BancadaDeSessoes.fechar()` da integração apaga sessões, usuários e turmas da bancada, mas **deixa escola, rede e auditoria** (**[código]** `sessao-de-teste.ts:167-208`). O portão local usa `EDUCA_BANCO_NOVO=1` e a esteira começa vazia.
- A limpeza da bancada depende da lista manual `TABELAS_DO_MVP_NA_ORDEM_DE_LIMPEZA` (17 tabelas) e de uma sequência de `delete` na ordem das FKs (`sessao-de-teste.ts:47-66,167-208`). O próprio comentário diz: "tabela nova do MVP entra aqui, ou o `fechar` quebra na FK da turma".
- Matrícula default do aluno de teste é `String(Date.now()).slice(-8)` (**[código]** `sessao.ts:166`): vale só dentro de escola nova, mas é fonte de colisão se alguém reusar a escola em paralelo.

## 6. Contratos

- Fixtures e2e importam tipos de `packages/shared` (por exemplo `EstadoDoProfessor`), mas os corpos de resposta que 192 `page.route(...)` fabricam são objetos escritos à mão em cada spec. **[hipótese]** Se o DTO de saída mudar, o mock continua verde e a tela real quebra; conferir se esses mocks são tipados com os tipos de `packages/shared`.
- Há teste de contrato de rotas: `apps/api/test/contratos.test.ts`, `rotas-registradas.ts` e `arquitetura.test.ts` (fora do escopo, só citados).
- As guardas de teste em `tools/guardas` (`regras-teste.mjs`, `teste-sem-desligar`) e `tools/ci/playwright.test.ts` são os contratos desta unidade. Cobrem: nada de `.skip/.only/.fixme`; todo spec usa o `test` de `perfis.ts`; os projetos são exatamente chromebook e celular; esperar o serviço do compose ficar são antes de medir.

## 7. Testes (sobre a infra de teste)

- **Contagem por arquivo** (casos `test(`): `acesso-da-turma` 35, `professores` 26, `turma-publica` 25, `casca` 24, `areas` 24, `pedido-do-titular` 24, `meus-dados` 22, `incidentes` 22, `estrutura` 22; `escola-montada` 1, `roteiro` 2, `a3-a4` 2.
- **`.skip/.only/.fixme`**: nenhum em `e2e/`. As únicas ocorrências são o próprio alvo da guarda (`tools/guardas/__fixtures__/teste-desligado.ts`) e o `tools/ci/duracao-do-e2e.test.ts`.
- **`waitForTimeout`**: 14 usos, todos na forma "provar que algo **não** acontece" (`material.spec.ts:222`, `professor-conversa.spec.ts:82`, `pedidos.spec.ts:867`, `incidentes.spec.ts:275`, `professor-sino.spec.ts:199,239`, `turma-publica.spec.ts` ×6), cada um com comentário que justifica. São 14 a 18 s de espera fixa somados. `networkidle` em 2 pontos (`operacao.spec.ts:411`, `tokens.spec.ts:365`). `setTimeout` com Promise em 6 (a espera da virada do passo do TOTP em `sessao.ts:388` é até ~30 s no pior caso).
- **`test.slow()`**: 149 usos, e `test.setTimeout`: 82 (mais de 230 sinais de teste pesado, para 594 casos). Teto manual altíssimo: `a3-a4-professor.spec.ts:23` 420 s, `a2-assistente.spec.ts` 240 a 300 s. **[doc]** O próprio `tools/ci/prazo-do-e2e.ts` registra cerca de 7 s por caso no runner e que o job único foi cancelado duas vezes aos 45 min com 380 a 394 casos (`tasks/correcoes/2026-10-02...`, `2026-10-03...`), por isso as 7 fatias.
- **Dois projetos**: cada spec roda em `chromebook` (1366×768, CPU ×4, Fast 3G) e `celular` (360×800, toque, CPU ×4, rede móvel lenta) (**[código]** `playwright.config.ts:50-69`, `perfis.ts`). Sem `testMatch` por projeto: `casca-no-celular.spec.ts` (344 linhas) também roda no Chromebook. Os specs ramificam por `hasTouch` (2.809 menções em 80 arquivos), o que dobra o custo sem que todos os casos mudem de conteúdo.
- **Seletores**: `getByRole` 3.066, `getByText` 358, `getByTestId` só 3, `locator(...)` 385, `.first()` 92, `.nth(` 83. Predominância de seletores semânticos: ponto forte. `.first()`/`.nth()` são o ponto frágil.
- **Dependência de ordem**: nenhum `describe.serial`/`mode:'serial'`; o comentário do `ci.yml` afirma que "nenhum spec depende de outro". Único `describe.configure({ retries: 2 })` em `guardas.spec.ts:73` (medição de CPU, com anotação). Sem retries no resto.
- **Camada sobreposta**: 192 `page.route(...)` mockam a API para provar carregando, vazio, erro e dado. Isso é teste de componente feito pelo e2e (cada um roda 2×, com CPU ×4). Há 79 `.test.tsx` em `apps/web`, então a sobreposição precisa de conferência.
- **Specs de conformidade de design**: `pecas-*.spec.ts` (9 arquivos), `tokens.spec.ts`, `aparencia`, `titulo-da-tela` somam 3.891 linhas (13% do e2e). Conferem cor `rgb(...)`, anel de foco, sombra de botão, avatar da onça numa página `/galeria`. `pecas-marca-onca.spec.ts:176-236` testa os **verificadores** ("acusa um a um cada defeito...", "a conferência sem avatar reprova"): teste do teste dentro do e2e.
- **Teste monolítico**: títulos longos (mediana 149 caracteres, máximo 296; 50 com mais de 200), com vários comportamentos por caso, o que enfraquece o diagnóstico quando falha. Os "W1", o roteiro da demonstração e `a3-a4` são jornadas de 240 a 680 linhas num `test` só.

## 8. Resiliência e escala (da infra de teste)

- Fila de carga com `flock` em `/tmp/educa-carga.lock` (`tools/ci/fila-de-carga.ts`): **[doc]** "o e2e de duas linhas ao mesmo tempo estoura os 30 s". **Os testes são sensíveis à carga da máquina**, e o preço é serializar tudo.
- Três ambientes de teste numerados (`ULTIMO_AMBIENTE_DE_TESTE = 3`, `PORTAS_POR_AMBIENTE = 1000`, `tools/ci/compose.ts:18-29`) para paralelizar linhas.
- A integração roda com `fileParallelism: false` (cerca de 21 min). Um arquivo por vez porque os testes derrubam e religam serviços do compose.
- O fuso é forçado no projeto `unidade` a `Asia/Tokyo` para pegar dependência do relógio local: boa prática.

## 9. Suspeitos de código morto

- **[hipótese]** `e2e/__fixtures__/lista-excel.csv` só é lida por `lista-da-turma.spec.ts:30` e `estrutura.spec.ts:36`. Está em uso.
- **[hipótese]** `criarEscolaSintetica` e `criarEquipeComSenha` são usadas amplamente (277 chamadas em 48 arquivos para `criarEquipeComSenha`). Não vi função morta evidente. Para confirmar, listar os `export` de `sessao.ts` (cerca de 75) e contar referência de cada um fora do arquivo: os de pedidos do titular têm um bloco duplicado de nomes (`criarPedidoDoTitularNoBanco`, `criarPedidosDoTitularNoBanco`, `criarPedidoDeTitularEliminadoNoBanco`) que merece essa conferência.
- `tools/testes/metricas.ts`, `promql.ts` e `redis-travado.ts` não foram confirmados em uso por mim. **[hipótese]** Podem ser só de `infra/test`; confirmar com `grep` por import.
- Dois arquivos de e2e quase homônimos: `pedido-do-titular.spec.ts` (detalhe do pedido) e `pedidos-do-titular.spec.ts` (lista), mais `pedidos.spec.ts` (pedidos de nome). Não são duplicados, mas os nomes confundem.

## 10. Duplicação e inconsistência

Evidência mais forte desta unidade (**[código]**, `grep "^function"` em `e2e/`):

| Helper copiado | Cópias | Exemplos |
|---|---|---|
| `acionar(alvo, hasTouch)` (clicar ou tocar) | 39 | 36 specs + `casca.ts`, `coordenacao.ts` |
| `portao()` (promessa que segura a rota) | 20 | `governanca.spec.ts:36`, `alocacao.spec.ts:37`, `agentes.spec.ts:51`, `acesso-da-turma.spec.ts:96`, `casca.spec.ts:32` ... e mais 2 em fixtures (`assistente.ts:95`, `professor/sino.ts:90`) |
| `entrar(...)` | 9 | |
| `outroNavegador` | 8 | |
| `comBanco` | 7 | `sessao`, `painel`, `operacao`, `governanca`, `roteiro`, `a3`, `material` |
| `tabAte`, `alvoDeToque`, `abrirJaEntrando` | 7 cada | |
| `doisCliquesNoMesmoInstante` | 6 | |
| `criarProfessoraComTurma` | 3 variantes | `acesso-da-turma.spec.ts:198`, `convidar-alunos.spec.ts:49`, `pedidos.spec.ts:165` |
| `montarEscola` | 3 variantes | `aluno-fluxo`, `pedido-do-titular`, `meus-dados` |

**Variantes de fábrica de escola**: ao menos 8 caminhos distintos de criar escola, rede e pessoa. No e2e: `criarEquipeComSenha`, `criarEscolaSintetica`, `criarUsuarioEmOutraEscola`, `criarAlunoComMatricula`, `criarConviteDeCoordenador`/`criarConviteDeProfessor`, `criarPainelSintetico`/`criarRede` (`painel.ts`), `criarCoordenadoraNaEscola`/`criarProfessoraNaEscola`, e `montarEscolaComEntregas` (`governanca.ts`). Na integração: `BancadaDeSessoes.escola()`/`redeComEscolas()`, `montarEscolaComTurma`, `montarEscolaComAssistente`, `montarEscolaComTutor` (`apps/api/test/escola-com-*.ts`), mais os `insert into rede/escola` à mão em testes de `packages/nucleo` (9 em `auditoria.int.test.ts`), `infra/test`, `painel-*.int.test.ts` e `escola.repository.test.ts`. A nomenclatura da escola criada é parecida ("Colégio sintético ...") mas o conteúdo varia.

Arquivos grandes demais (spec): `acesso-da-turma` 1.320, `professores` 1.131, `pedidos` 998, `estrutura` 926, `turma-publica` 872, `incidentes` 853, `operacao-escolas` 831, `pedidos-do-titular` 800. Fixture: `sessao.ts` 1.300. Integração: `arquivo-do-titular.int.test.ts` 1.404, `pedido-titular.int.test.ts` 1.240.

Sobreposição entre specs: o fluxo "aplicar, responder, encerrar, aprovar" aparece em `a3-a4-professor`, `aluno-fluxo`, `aluno-atividade`, `professor-aplicacao`, `professor-aprovar` e `roteiro-da-demonstracao`. A família "casca" tem `casca`, `casca-no-celular` e `casca-publica`, e `titulo-da-tela` verifica o título em todas as telas. O fluxo "entrar" tem `entrar`, `entrar-na-escola`, `entrar-convite-revogado`, `convite`, `mfa`, `acesso-suspenso` e `inatividade`.

## 11. Doc × código

- Regra 40: os fluxos obrigatórios estão quase todos cobertos (seção 3), exceto "cada modo" de avaliação e as "três formas" de arrancar a resposta do Tutor. **[doc]**
- Regra 40: "vitest.config.ts da raiz e dos apps" não existe como pedido do roteiro; só há o da raiz. Sem divergência de regra.
- O texto da regra 40 diz que o portão da tarefa roda os e2e da árvore alterada e o do `test.slow` com metade do prazo (30 s é o do runner); o código em `tools/ci/duracao-do-e2e.ts` existe para isso, **[doc]**, não confrontei a lógica.
- `docs/runbook.md` ("Esteira vermelha no e2e") é citado em `ci.yml` e `prazo-do-e2e.ts`; não abri.

## 12. Tamanho, risco e dependências

- Tamanho: e2e 30,2 mil linhas, fixtures e2e 5,1 mil, `apps/api/test` 35,1 mil (incluindo integração), infra de execução em `tools/` cerca de 12 mil. Somado, passa de 85 mil linhas de código de teste ou de apoio ao teste.
- Risco de mexer: **alto** em `sessao.ts` (SQL cru acoplado ao schema, usado por 48 specs) e na `BancadaDeSessoes` (a limpeza depende de ordem de FK); **médio** nos specs de tela (acoplados a texto da interface, 2.809 menções a `hasTouch` e muita asserção literal); **baixo** em `tools/testes/*` e nas guardas (têm teste próprio).
- Depende de: schema (Drizzle, `packages/nucleo`), `apps/api/src/ops`, `apps/api/src/sessao`, `packages/shared`, compose (`infra/`), `.github/workflows/ci.yml`. Dependem dela: todas as unidades (portão da tarefa, esteira, mutações).

## 13. Os 5 achados mais importantes

1. **Helpers copiados em vez de compartilhados**: `acionar` em 39 pontos, `portao` em 20, `comBanco` em 7, `outroNavegador` em 8. Reduzir isso corta centenas de linhas de e2e sem perder prova.
2. **E2E semeia por SQL cru** (`sessao.ts` 1.300 linhas e outras 6 fixtures com `insert into`), enquanto a integração semeia pelas portas de produção. São duas estratégias e ao menos 8 variantes de "escola de teste"; mudança de schema quebra o e2e sem aviso de tipo.
3. **E2E pesado e caro**: 594 casos × 2 projetos (cerca de 1.190 execuções), 149 `test.slow()` + 82 `setTimeout`, 7 fatias de CI, fila `flock` na máquina e teste sensível à carga. Uma boa parte (cerca de 13% em `pecas-*`, `tokens`, `aparencia`, `titulo-da-tela`) é conformidade de design por estilo computado, e há 192 `page.route` que são teste de componente rodando duas vezes com CPU ×4.
4. **Banco acumula e a limpeza é manual**: o e2e não limpa, a `BancadaDeSessoes.fechar()` deixa escola, rede e auditoria e depende de uma lista de 17 tabelas na ordem das FKs que quebra quando entra tabela nova.
5. **Cobertura dos fluxos obrigatórios da regra 40**: onboarding, planilha, entrega de agente, login por matrícula e Tutor recusando existem; falta e2e de avaliação em cada modo (só a objetiva online) e, para o Tutor, só uma das "três formas" de arrancar a resposta. Os fluxos longos ("W1", roteiro de 680 linhas, `a3-a4`) são um `test` só, o que dificulta o diagnóstico.
