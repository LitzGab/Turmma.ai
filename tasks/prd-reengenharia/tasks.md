# Tarefas — reengenharia (X5)

**PRD:** `prd.md` · **Tech Spec:** `techspec.md`, mais o `onda-<n>.md` de cada tarefa
<!-- Quantas estão concluídas não se escreve aqui: `node tools/processo/estado.ts` conta pela lista. -->

A X5 passa de 20 tarefas (R41): esta lista tem todas, e o `N_task.md` de cada onda nasce quando a anterior fecha,
escrito pelo Arquiteto contra o código daquele momento. Hoje existem os documentos das ondas 0, 1A e 1B (1.0 a
29.0). O aviso "o documento N_task.md não existe" do `estado.ts` é o sinal para o Orquestrador pedir a onda
seguinte ao Arquiteto. A 92.0 é a parada da Etapa 9, e dela nascem as tarefas do harness e da onda 6
(`onda-6.md` §5, plano).

## Lista

### Onda 0 — os defeitos do §4 do diagnóstico

- [x] **1.0 — O `ouro` é lido, selado e medido, sem mudar regra**
  - [x] 1.1 Leitores zod estritos do corpus e do `MEDIDAS` em `__fixtures__/ouro.ts`, raiz por `import.meta.url`
  - [x] 1.2 `selo-do-ouro.test.ts`: sha256 de todo arquivo menos o `SELO.json`, e o mesmo conjunto de nomes
  - [x] 1.3 `ouro.test.ts`: o mapeamento do README, a `base` reproduzida por categoria, o piso de `assuntoDelicado`, `pedidoDeRespostaPronta` e `saidaComNota`; as outras três só medidas e impressas
  - [x] 1.4 Testes: leitor, reprodução, comparador e selo, como na tabela

- [x] **2.0 — Frase de risco à vida do `ouro` recebe a mensagem fixa e o sinal**
  - [x] 2.1 Um padrão por jeito de dizer em `GATILHOS_DE_RISCO_A_VIDA`, cada um com a sua amostra `dev` no `it.each`
  - [x] 2.2 As `dev` de borda: "tô triste", "suicídio na Revolução Francesa", "quero matar ela"
  - [x] 2.3 `ouro.test.ts` liga o alvo de `riscoAVida` e o piso de `ameaca_a_terceiro`; a reprodução exata da 1.0 dá lugar ao alvo (mudança declarada), e a de `assuntoDelicado`, ao "não cair"
  - [x] 2.4 Testes: por categoria, precisão, bordas, o caminho da rota

- [x] **3.0 — Julgamento de texto de aluno é barrado na entrada e na saída, e a rubrica passa**
  - [x] 3.1 `julgaTextoDeAluno(texto, conversaTrazTextoDeAluno)`, no `conferir`, nos dois tipos de saída
  - [x] 3.2 `conversaPedeJulgamentoDeTextoDeAluno` ao alvo, com uma `dev` por forma que escapa
  - [x] 3.3 `reservaQuandoInvalida` só quando a última reprovação foi da D55; o prompt sobe a `versao`
  - [x] 3.4 `ouro.test.ts` liga `saidaQualitativa` e `julgamentoDeTextoDeAluno`
  - [x] 3.5 Testes: as chaves, a reserva, o alvo

- [x] **4.0 — Avaliação aberta depois do 202: o Tutor não responde e a troca não conta**
  - [ ] 4.1 `entrada()` confere `avaliativaAberta(turmaId)` logo depois da conferência de turma, antes de trechos, memória e turnos, e lança `TUTOR_PAUSADO_EM_AVALIACAO`
  - [ ] 4.2 `aoConcluir` repete a conferência na transação que grava a resposta; a saída `assunto_delicado` grava a mensagem fixa e o `atencao_humana` mesmo com a avaliação aberta
  - [ ] 4.3 Testes: as duas janelas com `GatilhoDeParada`, a exceção da D36, a concorrência, a caracterização da web

- [x] **5.0 — O hook bloqueia quando não carrega**
  - [x] 5.1 O comando `portao` de `.claude/settings.json` ganha `|| { echo '…' >&2; exit 2; }`, com o texto de `onda-0.md` §2.5; o `registrar` fica como está
  - [x] 5.2 `tools/processo/hook-portao.test.ts` roda o comando lido do `settings.json` sobre uma cópia de `tools/processo/`
  - [x] 5.3 A sessão de teste que confirma o exit 2 no Claude Code, registrada neste documento
  - [x] 5.4 Testes: carga quebrada sai 2 com a mensagem; hook são sai 0 e o `deny` passa intacto

### Onda 1A — escopo, camadas e entrada

- [ ] **6.0 — Repository sem prova de escopo nem motivo reprova o teste**
  - [ ] 6.1 O analisador, com `PROVAS_DE_ESCOPO` e `REPOSITORIES_SEM_ESCOPO` (`{ arquivo, motivo, metodos }`)
  - [ ] 6.2 A lista exata, por método e com evidência: os 9 da 7.0, os 3 da 8.0 e os seis da `onda-1a.md` T6
  - [ ] 6.3 `SuspensoesDaEscolaRepository` sai de `time.service.ts` para um `*.repository.ts`
  - [ ] 6.4 Testes: `repositories-com-escopo.test.ts`, com as fixtures em `tools/guardas/__fixtures__/repositories/`

- [ ] **7.0 — Os 9 repositories com cópia local leem a escola por `exigirEscolaDoContexto`**
  - [ ] 7.1 Caracterização, num commit antes: os 7 sem caso de "sem escola" ganham o seu, verde com a cópia local
  - [ ] 7.2 Os nove passam a `exigirEscolaDoContexto`, lida a cada chamada, nunca guardada na instância
  - [ ] 7.3 Os nove saem de `REPOSITORIES_SEM_ESCOPO` (`tools/guardas/escopo-dos-repositories.ts`)
  - [ ] 7.4 Testes: isolamento e concorrência por repository, com a mutação de cada um

- [ ] **8.0 — A IA tira a escola do contexto, com teste de isolamento**
  - [ ] 8.1 As três portas perdem `escolaId`, e os repositories usam `exigirEscolaDoContexto()`, no orçamento antes do retorno antecipado
  - [ ] 8.2 Os chamadores não passam a escola; `SuspensoesEmMemoria` lê o contexto
  - [ ] 8.3 `ia/consumo`, `ia/orcamento` e `ia/suspensao` saem de `REPOSITORIES_SEM_ESCOPO`
  - [ ] 8.4 Testes: isolamento por porta, sem contexto, concorrência e o tipo

- [ ] **9.0 — Importar tabela fora de repository reprova o lint**
  - [ ] 9.1 `tools/guardas/tabelas-do-nucleo.mjs`: a lista dos nomes de tabela exportados por `@educa/nucleo`
  - [ ] 9.2 A regra, em `tools/guardas/regras-tenant.mjs`, registrada em `index.mjs` e em `REGRAS_DAS_GUARDAS`, cobrindo import, alias, reexport e namespace
  - [ ] 9.3 Testes: um `describe` em `tools/guardas/guardas.test.ts` com as fixtures, e o teste da lista contra as exportações `PgTable`

- [ ] **10.0 — O ciclo do operador e a dependência `sessao` → `operacao` somem**
  - [ ] 10.1 `SessaoDeOperadorParaGuarda` e `SessaoDeOperadorParaRenovar` passam a morar em `operacao/prazos-da-sessao.ts`, e o repository os importa de lá
  - [ ] 10.2 `ConferenciaDoAutor` vai para `apps/api/src/sessao/conferencia-do-autor.ts`, e todos os importadores trocam o caminho, sem reexportar do lugar antigo
  - [ ] 10.3 Testes: caracterização verde antes e depois, e um `it` provisório em `apps/api/test/arquitetura.test.ts`

- [ ] **11.0 — Os 2 ciclos de `login.service` somem**
  - [ ] 11.1 Caracterização, num commit antes: `ipParaRegistro` (que não tem teste hoje) e os casos de `login.service.test.ts`
  - [ ] 11.2 `sessao/origem-da-requisicao.ts` (`OrigemDaRequisicao`, `ResultadoDoLogin`, `ipParaRegistro`) e `sessao/identificadores-do-login.ts` (`BYTES_DO_REFRESH`, `hashDoRefresh`, `normalizarEmail`)
  - [ ] 11.3 `etapaDoLogin` vai para `conclusao-de-login.ts`; os importadores trocam o caminho; `login.service.ts` não reexporta
  - [ ] 11.4 Testes: os de unidade divididos pelos arquivos novos, e os dois `it` de quem importa o `login.service`

- [ ] **12.0 — Import contra a direção ou a camada, ou ciclo novo, reprova o lint**
  - [ ] 12.1 `dependency-cruiser@18.7.0` exato em `devDependencies`; `tools/guardas/camadas.cjs` com as regras do §2 da onda, todas `error`
  - [ ] 12.2 `guarda:camadas` no `package.json`, e `lint` terminando em `&& npm run guarda:camadas`
  - [ ] 12.3 As três cercas e a exceção de `expurgo-da-escola.repository.ts:3`; confere o `reaches`
  - [ ] 12.4 Sai do `arquitetura.test.ts` o que as regras cobrem, depois das fixtures verdes
  - [ ] 12.5 Testes: `camadas.test.ts` com as fixtures, o repositório real e o tempo do lint

- [ ] **13.0 — Função nova acima de 10/80/4 e supressão nova reprovam o lint**
  - [ ] 13.1 Bloco novo em `eslint.config.mjs`: produção com `complexity: 10`, `max-lines-per-function: 80` (sem branco nem comentário) e `max-depth: 4`; teste sem `max-lines-per-function`; e2e com `max-lines: 800`, tudo `error`
  - [ ] 13.2 `eslint . --suppress-all` gera `eslint-suppressions.json`; o `TETO` por regra fica no teste
  - [ ] 13.3 `criarEslintDasGuardas` ganha `applySuppressions: true` e as quatro regras no `ruleFilter`
  - [ ] 13.4 Testes: fixtures de fronteira, a segunda passada e o `catraca.test.ts`

- [ ] **14.0 — Handler sem esquema derruba o boot; sistema, IA, entrega, assistente e professores migram**
  - [ ] 14.1 Caracterização, num commit antes: o inválido e o 404 de cada rota dos cinco módulos, e o uuid em maiúsculas
  - [ ] 14.2 `PipeDeEntrada`, `@Corpo`, `@Consulta`, `@IdDoCaminho`, `@IdDoCaminhoOuNada`, `@DoCaminho`, `@SemEntrada` e `SEM_ENTRADA`
  - [ ] 14.3 `ConferenciaDasEntradas` no `onModuleInit`, com a lista de pendentes que só encolhe
  - [ ] 14.4 `guardas/sem-req-cru` em `tools/guardas/`, na segunda passada
  - [ ] 14.5 Migram `sistema/`, `ia/`, `entrega/`, `assistente/` e `professores/`
  - [ ] 14.6 Testes: os da tabela

- [ ] **15.0 — Estrutura, sala e governança validam pelo esquema**
  - [ ] 15.1 Caracterização, num commit antes: o inválido e o 404 de cada rota dos três módulos, incluindo a `chave` e o link da sala
  - [ ] 15.2 Migram os 8 controllers de `estrutura/`, os 4 de `sala/` e os 2 de `governanca/`
  - [ ] 15.3 Os três módulos saem da lista de pendentes
  - [ ] 15.4 Testes: os da tabela

- [ ] **16.0 — Sessão e operação validam pelo esquema, com a ordem dos erros caracterizada**
  - [ ] 16.1 Caracterização, num commit antes: a ordem dos erros em `mfa`, `sessao/mfa` e `redefinir-mfa`, e o 404 do `slug` e do `provedor`
  - [ ] 16.2 Migram os 12 controllers de `sessao/` e os 6 de `operacao/`
  - [ ] 16.3 Os dois módulos saem da lista de pendentes
  - [ ] 16.4 Testes: os da tabela

- [ ] **17.0 — Atividade, artefato, material, tutor e privacidade migram, e os pendentes somem**
  - [ ] 17.1 Caracterização, num commit antes: o inválido e o 404 da `questao`, da `ferramenta`, do upload e do pedido do titular
  - [ ] 17.2 Migram os 4 controllers de `atividade/`, os 2 de `artefato/`, `material/`, os 2 de `tutor/` e os 2 de `privacidade/`
  - [ ] 17.3 O `@UploadedFile` entra em `SEM_ENTRADA`, com motivo
  - [ ] 17.4 A lista de pendentes e as três funções de `estrutura/entrada.ts` saem, com a trava escolhida contra a volta
  - [ ] 17.5 Testes: os da tabela

### Onda 1B — jobs, contratos, rotas e conformidade

- [ ] **18.0 — Payload inválido é recusado ao enfileirar, e tipo sem definição não compila**
  - [ ] 18.1 Caracterização, num commit antes, dos 8 tipos
  - [ ] 18.2 `DEFINICOES_DE_JOB` em `packages/shared/src/sistema/definicoes-de-job.ts`, com as constantes `TIPO_*`; o sintético `.strict()`
  - [ ] 18.3 `enfileirar` e `enfileirarUmaVez` validam antes de gravar; os chamadores migram
  - [ ] 18.4 Testes: os da tabela

- [ ] **19.0 — O worker valida pela definição, e o teste liga tipo, fila e processador**
  - [ ] 19.1 Caracterização, num commit antes: as opções de publicação como literal
  - [ ] 19.2 `Processador<T>` tipado; o executor valida e falha com `DADOS_INVALIDOS`, definitivo
  - [ ] 19.3 `opcoesDeJob(tipo)` e `nomeDaFilaBullMQ(fila, executor)`, com a definição injetável em `fila-de-teste.ts`
  - [ ] 19.4 `montagem.test.ts`: tipo ↔ processador ↔ réplica da fila
  - [ ] 19.5 Testes: os da tabela

- [ ] **20.0 — A web aceita campo extra e, com contrato quebrado, mostra "há uma versão nova"**
  - [ ] 20.1 `RESPOSTA_FORA_DO_CONTRATO` no catálogo de shared
  - [ ] 20.2 `lerResposta(esquema, corpo)` em `api/cliente.ts`, usada por `chamarApi` e `material.ts`
  - [ ] 20.3 `ErroDeContrato`, sem repetição nem reenvio
  - [ ] 20.4 `EstadoErro` com "Recarregar"
  - [ ] 20.5 Testes: os da tabela

- [ ] **21.0 — Rota fora do registro ou divergente reprova, e o OpenAPI sai dele**
  - [ ] 21.1 `definirRota`, `ROTAS` e o marcador `@Rota(chave)`; as primeiras áreas registradas
  - [ ] 21.2 `apps/api/test/rotas-do-registro.test.ts`, com a lista de pendentes que só encolhe
  - [ ] 21.3 A varredura de credencial de `contratos.test.ts` itera o registro e as pendentes
  - [ ] 21.4 `gerarOpenApi(ROTAS)`, `docs/gerado/openapi.json` e `npm run docs:openapi`
  - [ ] 21.5 Testes: os da tabela

- [ ] **22.0 — Todas as rotas estão no registro, sem lista de pendentes**
  - [ ] 22.1 Caracterização, num commit antes: a foto de (método, caminho, acesso) de toda rota montada, por `rotasDe`, gravada no teste
  - [ ] 22.2 As áreas que faltam ganham o seu arquivo em `packages/shared/src/rotas/` e `@Rota` nos handlers, uma área por commit
  - [ ] 22.3 A lista de pendentes e o ramo da varredura que lia os exportados saem; o `openapi.json` é regenerado
  - [ ] 22.4 Testes: os da tabela

- [ ] **23.0 — A web chama pelo registro, sem literal `/v1/`**
  - [ ] 23.1 Caracterização, num commit antes: o método e o caminho de cada função de `api/` e `operacao/api/`
  - [ ] 23.2 `montarCaminho` em `packages/shared/src/rotas/`, com `encodeURIComponent` e falha em parâmetro ausente
  - [ ] 23.3 `chamarRota` em `api/cliente.ts`, sobre `chamarApi`; a pilha do operador o usa com o token dela
  - [ ] 23.4 As funções e os componentes trocam o literal pela chave de rota
  - [ ] 23.5 `no-restricted-syntax` contra `'/v1/'` (literal e template), com a fixture
  - [ ] 23.6 Testes: os da tabela

- [ ] **24.0 — Toda dependência é declarada onde é usada, sem sobra**
  - [ ] 24.1 Declarar as dependências que faltam, na versão do `package-lock.json` e sem faixa: na raiz `pg`, `ioredis`, `@node-rs/argon2`, `otpauth`, `bullmq`, `socket.io-client` e `@opentelemetry/sdk-metrics`; em `apps/realtime`, `jose`; em `apps/worker`, `drizzle-orm`. Tirar o `pino` de `apps/despachante` e `apps/worker`
  - [ ] 24.2 `knip` 6.42.1 exato como `devDependency` da raiz, e o `knip.json` da raiz derivado do de `.reengenharia/medicao/`, com `ignore` só das fixtures de violação
  - [ ] 24.3 Etapa do knip (`--include dependencies,unlisted,binaries,unresolved`) em `tools/ci/etapas-de-guarda.ts`, no `ci:verificar`; para o portão da tarefa vê-la sem tocar `tools/processo/`, o script `guarda:dependencias` passa a rodar também o knip (declare a escolha)
  - [ ] 24.4 Testes: etapa limpa, cada categoria reprova a sua fixture, versões exatas, worker e despachante sem `pino`

- [ ] **25.0 — Todo `throw` de produção é tipado, e o lint barra o resto**
  - [ ] 25.1 `ErroDeInvariante` em `packages/nucleo/src/erro/`, com motivo fixo (recusa da interpolação pelo tipo ou por lint, declarada)
  - [ ] 25.2 Trocar cada `throw new Error(` de produção, com a mensagem que um teste afirma igual
  - [ ] 25.3 `conferencia-das-permissoes.ts:59` lança erro tipado com código, com controller e método em campos; `permissao-no-boot.test.ts:74` os lê dali (mudança declarada)
  - [ ] 25.4 `ArgumentoInvalido` vira uma classe só, reexportada
  - [ ] 25.5 `guardas/erro-tipado` (`tools/guardas/regras-erro.mjs`) em `apps/*/src` e `packages/nucleo/src`, fora de teste, exceto `apps/web/src/main.tsx`
  - [ ] 25.6 Testes: classe, formas proibidas, exceções, segunda passada, filtro global, ops

- [ ] **26.0 — Risco à vida, assunto delicado e pedido de resposta em `conformidade/`, comportamento igual**
  - [ ] 26.1 Caracterização, num commit anterior: a decisão de cada amostra, por id, nas três
  - [ ] 26.2 `criarPolitica` e `casa(texto, contexto, grupos)`, com os padrões por parâmetro
  - [ ] 26.3 `risco-a-vida.ts`, `assunto-delicado.ts`, `pedido-de-resposta.ts`, `index.ts`, e o corpus `dev` fora do `dist/`
  - [ ] 26.4 `turno-do-tutor.ts` só chama `politicas.x.casa`; as de identidade ficam, com o porquê (D58)
  - [ ] 26.5 Testes: caracterização, `ouro`, `dev`, contexto, grupos, um lugar só, `dist/`, prompt igual

- [ ] **27.0 — Os padrões da D55, de entrada e de saída, vivem em `conformidade/`**
  - [ ] 27.1 Caracterização, num commit anterior: a decisão de cada amostra, por id, nas três
  - [ ] 27.2 `julgamento-de-texto-de-aluno.ts`, `saida-com-nota.ts` e `saida-qualitativa.ts` por `criarPolitica`; `PEDE_NOTA` vira lista; o corpus do Assistente em `conformidade/corpus/`
  - [ ] 27.3 `propor-ferramenta.ts` só chama `politicas.x.casa`, na entrada e no `conferir`
  - [ ] 27.4 Testes: caracterização, `ouro`, as duas chaves da saída, entrada sem modelo, reserva, um lugar só, prompt igual

- [ ] **28.0 — Tirar qualquer padrão deixa uma amostra vermelha**
  - [ ] 28.1 `mutacao.test.ts`: para cada política e padrão, tira o padrão (pelo parâmetro `grupos`) e exige que uma amostra de `dev ∪ ouro` mude, com o contexto dela; o vermelho diz a política e o índice
  - [ ] 28.2 Padrão que não passa ganha a amostra `dev` que só ele pega, ou sai (estreitar só sem perder `casa` do `ouro`); nenhum padrão com mais de 3 alternativas no nível de cima
  - [ ] 28.3 `metamorficos.test.ts`: caixa alta, espaços extras, pontuação no fim, "vc"/"você" e o prefixo "oi, "
  - [ ] 28.4 Testes: os de mutação e os metamórficos abaixo, com o selo verde depois

- [ ] **29.0 — Mudar o `ouro` junto com o padrão é recusado**
  - [ ] 29.1 Mover o `selo-do-ouro.test.ts` para `packages/nucleo/src/conformidade/`, com a raiz por `import.meta.url`
  - [ ] 29.2 `tools/guardas/ouro-separado.ts`: lê `git log --no-renames --name-only -m --first-parent 400dc42..HEAD`; commit que toca `docs/aia/ouro/**` só toca `docs/` e leva `(ouro: …)`; `(tarefa` e `(correção` nunca o tocam; clone raso falha
  - [ ] 29.3 A guarda como etapa do `tools/ci/verificar.ts`, fora de `tools/processo/`
  - [ ] 29.4 Testes: selo no lugar novo, a guarda por marcador e por caminho, merge, arquivo movido, `400dc42`, clone raso, o limite declarado, a etapa

### Onda 2 — pastas, subcaminhos e leituras prontas

- [ ] **30.0 — `@educa/shared/servidor` existe, e a web não o importa**
  - [ ] 30.1 O `30_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **31.0 — As peças de teste de mais de uma app moram em `tools/testes/`**
  - [ ] 31.1 O `31_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **32.0 — O `nucleo` tem os subcaminhos `db`, `identidade`, `fila`, `privacidade` e `ia`**
  - [ ] 32.1 O `32_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **33.0 — `credencial/` reúne senha, cookie, hash e desafio**
  - [ ] 33.1 O `33_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **34.0 — `sessao/` só tem fluxos, em subpastas, com `index.ts`**
  - [ ] 34.1 O `34_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **35.0 — `ops/` só tem terminal; casos de uso em `operacao/`, paginação em `http/`**
  - [ ] 35.1 O `35_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **36.0 — O kit visual mora em `kit/` e não importa API, área nem sessão**
  - [ ] 36.1 O `36_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **37.0 — O professor lê o "esperando" numa chamada, sem nome de aluno**
  - [ ] 37.1 O `37_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **38.0 — A coordenação lê o "esperando" numa chamada, e `turmas` diz quem fica sem professor**
  - [ ] 38.1 O `38_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **39.0 — `GET /v1/escola/roteiro` diz se a escola está montada**
  - [ ] 39.1 O `39_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **40.0 — O prazo de 15 dias do titular vem da API**
  - [ ] 40.1 O `40_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **41.0 — Trocar o material que falhou é uma transação só (`substitui`)**
  - [ ] 41.1 O `41_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-2.md`

### Onda 3A — a IA fora do processo da API

- [ ] **42.0 — IA por Command registrado, no processo, com o prompt caracterizado**
  - [ ] 42.1 O `42_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3a.md`

### Onda 3B — prazo, falha final e o PDF no worker

- [ ] **43.0 — Job estourado dá `TEMPO_ESGOTADO`**
  - [ ] 43.1 O `43_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3b.md`

- [ ] **44.0 — Falha final alerta e fica 30 dias; o pedido do titular, até a ação**
  - [ ] 44.1 O `44_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3b.md`

- [ ] **45.0 — PDF lido no worker da API, com o objeto apagado em todo caminho**
  - [ ] 45.1 O `45_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3b.md`

- [ ] **46.0 — Listar, reprocessar e descartar job, sem `dados` e sem perder pedido do titular**
  - [ ] 46.1 O `46_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3b.md`

### Onda 3A — a IA fora do processo da API

- [ ] **47.0 — IA no worker, prazo por perfil, Tutor e ferramenta em filas separadas, p95 + 1 s no máximo**
  - [ ] 47.1 O `47_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3a.md`

### Onda 3C — o provedor resiliente e a prova que não perde resposta

- [ ] **48.0 — Provedor lento, 429 ou fora falha rápido, com orçamento**
  - [ ] 48.1 O `48_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3c.md`

- [ ] **49.0 — Tokens por minuto, degradação 80.4 e métricas de IA**
  - [ ] 49.1 O `49_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3c.md`

- [ ] **50.0 — Provedor fora do Brasil ou sem a categoria não sobe**
  - [ ] 50.1 O `50_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3c.md`

- [ ] **51.0 — Resposta atrasada não sobrescreve, nem depois do F5 nem em outra aba**
  - [ ] 51.1 O `51_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3c.md`

- [ ] **52.0 — Rede pendurada dá "Tentar de novo"**
  - [ ] 52.1 O `52_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3c.md`

- [ ] **53.0 — Pendente sobrevive ao F5 e à sessão vencida**
  - [ ] 53.1 O `53_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3c.md`

- [ ] **54.0 — Redis fora: 503 sem gastar tentativa**
  - [ ] 54.1 O `54_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-3c.md`

### Onda 4A — a rede de teste da web (leva 1)

- [ ] **55.0 — Cobertura por pasta, com piso**
  - [ ] 55.1 O `55_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

- [ ] **56.0 — Componente que lança mostra a tela de falha**
  - [ ] 56.1 O `56_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

- [ ] **57.0 — Sessão injetável**
  - [ ] 57.1 O `57_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

- [ ] **58.0 — `<Leitura>`**
  - [ ] 58.1 O `58_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

- [ ] **59.0 — Botão e confirmação de perigo no kit**
  - [ ] 59.1 O `59_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

- [ ] **60.0 — Aprovar, Time e Aplicação provados, com as mutações da §2.2**
  - [ ] 60.1 O `60_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

- [ ] **61.0 — Tutor e Atividade do aluno provados**
  - [ ] 61.1 O `61_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

- [ ] **62.0 — Páginas anônimas e login por cima**
  - [ ] 62.1 O `62_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

- [ ] **63.0 — Peças da base**
  - [ ] 63.1 O `63_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

- [ ] **64.0 — Operação**
  - [ ] 64.1 O `64_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

- [ ] **65.0 — Coordenação**
  - [ ] 65.1 O `65_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4a.md`

### Onda 4B — o corte das telas (leva 2)

- [ ] **66.0 — `Aprovar`**
  - [ ] 66.1 O `66_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **67.0 — `Time`, `AplicacaoDoArtefato`, `EncerramentoDaAtividade`**
  - [ ] 67.1 O `67_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **68.0 — `Atividade`**
  - [ ] 68.1 O `68_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **69.0 — `Tutor`**
  - [ ] 69.1 O `69_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **70.0 — `Estrutura`, `AnoEDisciplinas` e hooks de anúncio, painel e ano**
  - [ ] 70.1 O `70_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **71.0 — `Material`, `DialogoDeEnvioDeMaterial`, `ListaDaTurma`**
  - [ ] 71.1 O `71_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **72.0 — `Professores`, `PainelDoProfessor`, `DetalheDoPedido`, `Agentes`, `Governanca`, `Analista`**
  - [ ] 72.1 O `72_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **73.0 — `Turmas`, `TurmaHoje`, `AlunosDaTurma`, `AtividadesDaTurma`, `ConvidarAlunos`**
  - [ ] 73.1 O `73_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **74.0 — `Artefato`, `Criados`, `Conversa`**
  - [ ] 74.1 O `74_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **75.0 — Entrada comum: `Mfa`, `Entrar`, `ConfigurarMfa`, `Convite`**
  - [ ] 75.1 O `75_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **76.0 — `NovaEscola`, `Escolas`, `NovaRede`**
  - [ ] 76.1 O `76_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **77.0 — `TurmaPublica`, `Convite`, `LoginPorCima`, `CascaDaEscola`, `Menu`, `SeletorDeEscola`**
  - [ ] 77.1 O `77_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **78.0 — `DialogoDoConvite`, `ListaDePedidos`, `DialogoDeDecisao`, `MotorFormulario`, `CaixaPedido`**
  - [ ] 78.1 O `78_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **79.0 — Sino, fila e Painel da coordenação pela leitura pronta**
  - [ ] 79.1 O `79_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

- [ ] **80.0 — Galeria e lints em zero**
  - [ ] 80.1 O `80_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-4b.md`

### Onda 5 — testes e infra

- [ ] **81.0 — Spike: o e2e insere por tabela Drizzle sem `dist`, ou escolhe A, B ou C**
  - [ ] 81.1 O `81_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

- [ ] **82.0 — Helper de e2e uma vez; a cópia reprova o lint**
  - [ ] 82.1 O `82_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

- [ ] **83.0 — Nenhum spec copia helper (um por commit; onda 4 por último)**
  - [ ] 83.1 O `83_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

- [ ] **84.0 — Coluna obrigatória nova quebra o teste da semente**
  - [ ] 84.1 O `84_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

- [ ] **85.0 — O e2e semeia só pela semente; `insert into` novo reprova**
  - [ ] 85.1 O `85_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

- [ ] **86.0 — Operador, painel e equipe de teste saem mesmo com caso estourado**
  - [ ] 86.1 O `86_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

- [ ] **87.0 — Toda espera da infra de teste tem prazo**
  - [ ] 87.1 O `87_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

- [ ] **88.0 — Infra por arquivo, p95 da sessão e custo da rede lenta medidos**
  - [ ] 88.1 O `88_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

- [ ] **89.0 — Os quatro jobs avisam no limiar do teto**
  - [ ] 89.1 O `89_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

- [ ] **90.0 — Um Dockerfile com `target`, imagens medidas antes e depois**
  - [ ] 90.1 O `90_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

- [ ] **91.0 — E2e sem observabilidade, realtime atrás de profile, nada apagado**
  - [ ] 91.1 O `91_task.md` nasce quando a onda anterior fecha (R41), contra o código daquele momento: desenho e testes em `onda-5.md`

### Etapa 9 ⛔

- [ ] **92.0 — Etapa 9: skills, agentes, regras e orquestração revistos com o Joaquim, e as tarefas da onda 6 numeradas**
  - [ ] 92.1 O Arquiteto lê o harness (`.claude/`, `tools/processo/`) contra o código das ondas 0 a 5 e lista o que muda,
    com a lista de caminhos movidos que a `techspec.md` §11 reservou para cá (ex.: `executar-task/SKILL.md`, 33.0)
  - [ ] 92.2 Parada do Joaquim: ele aprova a lista; nada em `.claude/` nem em `tools/processo/` muda antes
  - [ ] 92.3 As tarefas do harness e as da onda 6 (`onda-6.md` §5) ganham número e `N_task.md`, a partir de 93.0

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — (o `ouro` está no commit 400dc42) | 4.0, 5.0 |
| 2.0 | 1.0 e `MEDIDAS` | 3.0, 5.0 |
| 3.0 | 1.0 e `MEDIDAS` | 2.0, 4.0, 5.0 |
| 4.0 | — | 1.0, 3.0, 5.0 |
| 5.0 | — | todas |
| 6.0 | — | 10.0, 11.0, 14.0 |
| 7.0 | 6.0 | 10.0, 11.0, 14.0 |
| 8.0 | 7.0 (a mesma lista) | 10.0, 11.0 |
| 9.0 | 6.0 | 10.0, 11.0, 14.0 |
| 10.0 | — | 6.0–9.0, 14.0 |
| 11.0 | — | 6.0–9.0, 14.0 |
| 12.0 | 9.0, 10.0, 11.0 | 15.0, 17.0 |
| 13.0 | 12.0 | 15.0–17.0 |
| 14.0 | — | 6.0, 7.0, 9.0–11.0 |
| 15.0 | 14.0 | 12.0, 13.0, 18.0 |
| 16.0 | 14.0, 11.0 | 13.0, 18.0 |
| 17.0 | 15.0, 16.0 | 12.0, 13.0, 18.0 |
| 18.0 | 14.0 | 15.0–17.0, 24.0 |
| 19.0 | 18.0 | 15.0–17.0, 25.0 |
| 20.0 | 18.0 | 19.0, 25.0 |
| 21.0 | 17.0, 20.0 | 19.0, 26.0 |
| 22.0 | 21.0 | 26.0, 27.0 |
| 23.0 | 22.0 | 26.0–29.0 |
| 24.0 | 12.0 | 18.0, 26.0 |
| 25.0 | 13.0 | 19.0, 20.0, 26.0 |
| 26.0 | 2.0, 3.0 | 21.0–25.0, 29.0 |
| 27.0 | 26.0 | 22.0–25.0, 29.0 |
| 28.0 | 27.0 | 23.0, 29.0 |
| 29.0 | 1.0 | 26.0, 27.0 |
| 30.0 | 6.0–29.0 | 36.0 |
| 31.0 | 30.0 | 36.0 |
| 32.0 | 31.0 | 36.0 |
| 33.0 | 32.0 | 36.0 |
| 34.0 | 33.0 | 36.0 |
| 35.0 | 34.0 | 36.0 |
| 36.0 | 6.0–29.0 | 31.0–35.0 |
| 37.0 | 35.0 | — |
| 38.0 | 37.0 | — |
| 39.0 | 38.0 | — |
| 40.0 | 39.0, 36.0 | — |
| 41.0 | 40.0 | — |
| 42.0 | 30.0–41.0 | 43.0, 44.0, 48.0, 50.0, 52.0, 54.0 |
| 43.0 | 30.0–41.0 | 42.0, 44.0, 48.0, 52.0 |
| 44.0 | 30.0–41.0 | 42.0, 43.0, 48.0, 52.0 |
| 45.0 | 43.0 | 48.0, 52.0 |
| 46.0 | 44.0, 45.0 | 48.0, 52.0 |
| 47.0 | 42.0, 45.0, 48.0 | 52.0, 53.0 |
| 48.0 | 30.0–41.0 | 42.0–46.0 |
| 49.0 | 48.0, 50.0 | 52.0 |
| 50.0 | 30.0–41.0 | 42.0, 52.0 |
| 51.0 | 30.0–41.0 | 44.0, 46.0, 48.0 |
| 52.0 | 30.0–41.0 | 42.0–50.0 |
| 53.0 | 51.0, 52.0 | 47.0 |
| 54.0 | 30.0–41.0 | 42.0 |
| 55.0 | 42.0–54.0 | 56.0, 57.0 |
| 56.0 | 42.0–54.0 | 55.0, 57.0, 58.0 |
| 57.0 | 42.0–54.0 | 55.0, 56.0 |
| 58.0 | 42.0–54.0 | 56.0 |
| 59.0 | 57.0, 58.0 | — |
| 60.0 | 55.0 | 61.0–65.0 |
| 61.0 | 55.0 | 60.0, 62.0–65.0 |
| 62.0 | 57.0 | 60.0, 61.0, 63.0–65.0 |
| 63.0 | 55.0 | 60.0–62.0, 64.0, 65.0 |
| 64.0 | 55.0 | 60.0–63.0, 65.0 |
| 65.0 | 55.0 | 60.0–64.0 |
| 66.0 | 60.0, 58.0, 59.0 | 68.0, 69.0, 70.0, 73.0, 74.0, 76.0 |
| 67.0 | 66.0, 58.0, 59.0 | 68.0, 69.0, 73.0, 74.0, 76.0 |
| 68.0 | 61.0, 58.0, 59.0 | 66.0, 67.0, 70.0, 73.0, 74.0, 76.0 |
| 69.0 | 61.0, 58.0, 59.0 | 66.0, 67.0, 70.0, 73.0, 76.0 |
| 70.0 | 65.0, 58.0, 59.0 | 66.0, 68.0, 69.0, 74.0, 76.0 |
| 71.0 | 70.0, 58.0, 59.0 | 67.0, 69.0, 73.0, 74.0, 76.0 |
| 72.0 | 71.0, 58.0, 59.0 | 73.0, 74.0, 76.0 |
| 73.0 | 58.0, 59.0 | 66.0–69.0, 71.0, 72.0, 76.0 |
| 74.0 | 58.0, 59.0 | 66.0–68.0, 70.0–72.0, 76.0 |
| 75.0 | 62.0, 64.0, 58.0, 59.0 | 66.0–74.0, 76.0, 78.0 |
| 76.0 | 64.0, 58.0, 59.0 | 66.0–75.0 |
| 77.0 | 57.0, 62.0, 63.0, 58.0, 59.0 | 66.0–74.0, 76.0 |
| 78.0 | 63.0, 58.0, 59.0 | 66.0, 67.0, 70.0, 72.0, 74.0–76.0 |
| 79.0 | 37.0, 38.0, 39.0, 70.0, 73.0, 58.0, 59.0 | 74.0–76.0, 78.0 |
| 80.0 | 66.0–79.0, 58.0, 59.0 | — |
| 81.0 | 29.0 | 82.0, 87.0, 89.0 |
| 82.0 | 29.0 | 81.0, 87.0, 89.0 |
| 83.0 | 82.0 | 84.0, 87.0 |
| 84.0 | 81.0, 35.0 | 83.0, 87.0 |
| 85.0 | 84.0 | 87.0 |
| 86.0 | 82.0 | 84.0 |
| 87.0 | 29.0 | 81.0–86.0 |
| 88.0 | 47.0 | 89.0 |
| 89.0 | 29.0 | 81.0–88.0 |
| 90.0 | 54.0 | 81.0–88.0 |
| 91.0 | 90.0 | 83.0 |
| 92.0 | 1.0–91.0 | — |

O paralelo das ondas 2 a 5 é autorização provisória: o Arquiteto o revê quando escreve os `N_task.md` da onda,
pelos "Arquivos previstos", que é o que `tools/processo/linhas.ts` confere. Duas tarefas com migration, schema ou
`packages/shared` não correm juntas (45.0, 47.0 e 51.0 têm migration; 18.0, 21.0 e 37.0 a 41.0 mexem em `shared`).

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 2.0 | `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 3.0 | `llm-integrator`, `test-engineer`, `conformidade-reviewer`, `revisor-geral` |
| 4.0 | `tenancy-guardian`, `conformidade-reviewer`, `infra-guardian`, `test-engineer`, `revisor-geral` |
| 5.0 | `test-engineer`, `revisor-geral` |
| 6.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 7.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 8.0 | `tenancy-guardian`, `infra-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 9.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 10.0 | `test-engineer`, `revisor-geral` |
| 11.0 | `test-engineer`, `revisor-geral` |
| 12.0 | `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral` |
| 13.0 | `test-engineer`, `revisor-geral` |
| 14.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 15.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 16.0 | `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral` |
| 17.0 | `tenancy-guardian`, `privacy-guardian`, `test-engineer`, `revisor-geral` |
| 18.0 | `tenancy-guardian`, `privacy-guardian`, `test-engineer`, `revisor-geral` |
| 19.0 | `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral` |
| 20.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 21.0 | `test-engineer`, `revisor-geral` |
| 22.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 23.0 | `test-engineer`, `revisor-geral` |
| 24.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 25.0 | `test-engineer`, `revisor-geral` |
| 26.0 | `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 27.0 | `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 28.0 | `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 29.0 | `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 30.0 | `test-engineer`, `revisor-geral` |
| 31.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 32.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 33.0 | `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral` |
| 34.0 | `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral` |
| 35.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 36.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 37.0 | `tenancy-guardian`, `privacy-guardian`, `test-engineer`, `revisor-geral` |
| 38.0 | `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 39.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 40.0 | `privacy-guardian`, `conformidade-reviewer`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 41.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 42.0 | `tenancy-guardian`, `conformidade-reviewer`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 43.0 | `infra-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 44.0 | `infra-guardian`, `privacy-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 45.0 | `infra-guardian`, `privacy-guardian`, `tenancy-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 46.0 | `infra-guardian`, `privacy-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 47.0 | `infra-guardian`, `tenancy-guardian`, `conformidade-reviewer`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 48.0 | `infra-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 49.0 | `infra-guardian`, `llm-integrator`, `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 50.0 | `conformidade-reviewer`, `privacy-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 51.0 | `infra-guardian`, `tenancy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 52.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 53.0 | `privacy-guardian`, `infra-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 54.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 55.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 56.0 | `privacy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 57.0 | `privacy-guardian`, `tenancy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 58.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 59.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 60.0 | `conformidade-reviewer`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 61.0 | `privacy-guardian`, `conformidade-reviewer`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 62.0 | `privacy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 63.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 64.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 65.0 | `privacy-guardian`, `conformidade-reviewer`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 66.0 | `conformidade-reviewer`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 67.0 | `conformidade-reviewer`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 68.0 | `conformidade-reviewer`, `privacy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 69.0 | `conformidade-reviewer`, `privacy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 70.0 | `conformidade-reviewer`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 71.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 72.0 | `conformidade-reviewer`, `privacy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 73.0 | `privacy-guardian`, `conformidade-reviewer`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 74.0 | `conformidade-reviewer`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 75.0 | `privacy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 76.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 77.0 | `privacy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 78.0 | `privacy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 79.0 | `conformidade-reviewer`, `privacy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 80.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 81.0 | `test-engineer`, `revisor-geral` |
| 82.0 | `test-engineer`, `revisor-geral` |
| 83.0 | `test-engineer`, `revisor-geral` |
| 84.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 85.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 86.0 | `test-engineer`, `revisor-geral` |
| 87.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 88.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 89.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 90.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 91.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 92.0 | `test-engineer`, `revisor-geral` |

## Critério de pronto da funcionalidade

Do `ROADMAP.md` (X5, "Pronto quando"), detalhado com o PRD:

- Comparado com a linha de base (`.reengenharia/LINHA-DE-BASE.md`, que a onda 6 migra para
  `tasks/prd-reengenharia/linha-de-base.md`), a tipagem, o lint, as guardas, a unidade, a integração, o e2e e o infra
  rodam verdes, com os resultados reais registrados; a falha preexistente não some sem registro
- O código morto removido tem evidência de que era morto (knip, a busca pelo nome, o teste que deixou de importá-lo)
- Toda fronteira relevante tem contrato explícito e testado: a entrada de toda rota (14.0 a 17.0), o payload de todo job
  (18.0, 19.0), a resposta lida pela web (20.0), o registro de rotas com o OpenAPI (21.0 a 23.0)
- Cada mecanismo de resiliência novo tem um teste que simula a falha que ele cobre (o §3 de cada `onda-<n>.md`)
- Os gargalos de escala estão tratados ou registrados com plano: a IA fora do processo da API (47.0), com a conta da
  manhã de segunda em `onda-3a.md`, e as medidas da onda 5 (88.0) levadas ao Joaquim
- A estrutura de pastas é coerente e travada por ferramenta: o depcruise (12.0), os subcaminhos (30.0 a 36.0), a
  catraca do ESLint (13.0)
- Skills, agentes, regras e orquestração são descobertos e executados pela plataforma, sem contradição entre eles (92.0)
- Os fluxos que não podem quebrar (os e2e obrigatórios da regra 40) e as invariantes das regras 10 e 70 continuam
  provados; as políticas de conformidade batem o alvo do `ouro` (`docs/aia/ouro/MEDIDAS.json`) desde a tarefa dona
- A documentação oficial responde às oito perguntas da Etapa 11 (onda 6), e `.reengenharia/` foi apagado sem perder nada
  necessário, com o inventário, a tag e a parada do Joaquim
- O relatório final diz o que foi feito, o que foi medido e o que ficou pendente, sem número que não foi coletado
- A esteira está verde no último commit que alterou código, e o Validador aprovou contra o PRD, RF a RF
