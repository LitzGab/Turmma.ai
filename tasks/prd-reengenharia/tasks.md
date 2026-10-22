# Tarefas — reengenharia (X5)

**PRD:** `prd.md` · **Tech Spec:** `techspec.md`, mais o `onda-<n>.md` de cada tarefa · **Recorte:** `.reengenharia/RECORTE.md` (D81)
<!-- Quantas estão concluídas não se escreve aqui: `node tools/processo/estado.ts` conta pela lista. -->

**O recorte de 22/10/2026 (D81) vale por cima do resto deste documento, do PRD e da Tech Spec.** A X5 ficou com 32
tarefas, na ordem de prioridade do recorte: as linhas pegam a primeira da lista que tem as dependências concluídas e não
toca arquivo de outra em andamento (`tools/processo/linhas.ts`, pelos "Arquivos previstos"). As que saíram estão no fim,
em "Saíram para a X6", sem caixa de seleção: não são apagadas, e o `estado.ts` não as conta nem as escolhe.

O `N_task.md` que falta é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento; o aviso "o
documento N_task.md não existe" do `estado.ts` é o sinal para o Orquestrador pedi-lo. **A 95.0 é do Claude Code #2**: ele
escreve o guia, e o Arquiteto o revisa com o `revisor-geral` e o põe no commit, no andar da spec; nenhuma linha a pega.

## A regra do corte

- **Sexta, 23/10/2026, às 22h, nenhuma tarefa nova parte.** A que está correndo termina. A que não partiu vai para a X6,
  com a linha `→ X6` em "Saíram para a X6" e a marca tirada da lista acima.
- Tarefa que passa de **4 horas**, ou que bate duas vezes no limite das três reprovações, vai para a X6 com o diagnóstico
  do Arquiteto (`.processo/ordens/diagnostico-<N>.md`); a linha volta ao último commit verde e pega a próxima.
- Depois vem o fechamento: portão completo, esteira, Validador, retrospectiva curta, `.reengenharia/` apagado com o que
  importa migrado para `tasks/prd-reengenharia/` e `docs/`, e pouso na `develop` com push. **Meta: pousado até sábado,
  24/10/2026, às 08h.**
- Até o pouso, nenhuma parada chama o Joaquim: o Arquiteto decide com a recomendação dele e registra em
  `.reengenharia/DECISOES.md` (RECORTE §6). A ressalva menor da validação vai para a X6; a crítica vira correção.
- **A 95.0 sai até sexta às 20h**, aconteça o que acontecer com as outras.
- **A onda 0 (3.0, 93.0, 94.0) não vai para a X6** (ajuste do Claude Code #2, 22/10, 11h02): o relógio das 4 horas
  conta de 10h55, e, se passar delas ou bater duas vezes no limite, o Arquiteto fecha a tarefa com a melhor versão que os
  revisores com veto aprovem e declara, medida, a lacuna que sobra no `onda-0.md` e na AIA do Tutor (`docs/aia/tutor.md`);
  só o refinamento do corpus vai para a X6. O limite das três reprovações vai ao diagnóstico do Arquiteto, nunca ao
  Joaquim.
- A única parada que ainda chama o Joaquim antes do pouso é a decisão que só se resolve afrouxando D1 a D81 ou as regras
  10, 20, 30, 40 e 70.

## Tarefa mecânica

A 10.0, 11.0, 24.0, 33.0 a 36.0, 90.0, 96.0 e 97.0 só movem pasta, quebram ciclo, declaram dependência ou mexem no
Dockerfile. Nelas, **os revisores são o `test-engineer`, o `revisor-geral` e no máximo um guardião**, o da área que o
movimento toca (tabela "Subagentes por tarefa"). **O movimento é feito por script**, nunca à mão: `git mv` mais a
reescrita de import com ts-morph, instalado numa pasta de rascunho (`npm i --prefix .processo/ts-morph ts-morph@<exata>`,
sem tocar o `package.json`), uma pasta por commit. O script fica no `.processo/` da linha, fora do commit, e o documento
da tarefa diz como rodá-lo.

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

- [x] **93.0 — Frase de risco à vida de palavra que o lote retido mostrou escapar recebe a mensagem fixa e o sinal**
  - [ ] 93.1 Um padrão por jeito de dizer de `93_task.md`, nas cinco categorias de palavra, cada um com a sua `dev`
  - [ ] 93.2 As três pioras da 2.0 desfeitas, cada uma com a sua `dev`
  - [ ] 93.3 Testes: as `dev`, a regressão exata do `ouro` v1, o alvo e o piso de `assuntoDelicado`

- [x] **94.0 — Frase de risco à vida que só o modelo reconhece recebe o 188 e o sinal**
  - [x] 94.1 `risco_a_vida` na saída do modelo; o `ajustar` a troca por `assunto_delicado` com a mensagem de risco, e nada sai da tarefa com ela
  - [x] 94.2 O prompt classifica pelo que o aluno escreveu, com a `versao` nova
  - [x] 94.3 `tools/ia/medir-risco-a-vida.ts`: o padrão ou o modelo, por categoria, em três execuções, valendo a pior
  - [x] 94.4 `docs/aia/tutor.md`: o modelo que classifica o risco, a medida e as limitações
  - [x] 94.5 Testes: o caminho na tarefa e na rota, com a avaliação aberta, e a ferramenta de medida

### A linha da web — a prova que não perde resposta (regra 80.6) e as pastas da web

- [x] **51.0 — Resposta atrasada não sobrescreve, nem depois do F5 nem em outra aba**
  - [x] 51.1 O `51_task.md` é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento: desenho e testes em `onda-3c.md`

- [ ] **53.0 — Pendente sobrevive ao F5 e à sessão vencida**
  - [ ] 53.1 O `53_task.md` é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento: desenho e testes em `onda-3c.md`

- [ ] **36.0 — O kit visual mora em `componentes/ui/` e não importa API, área nem sessão**
  - [ ] 36.1 O `36_task.md` é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento: desenho e testes em `onda-2.md`, com o nome `componentes/ui/` da D81 no lugar de `kit/`

- [ ] **97.0 — Na web, `areas/professor/` e `areas/coordenacao/` se partem por assunto, com a mesma trava**
  - [ ] 97.1 O `97_task.md` é escrito pelo Arquiteto antes de a tarefa partir: o *feature folder* (bulletproof-react), cada assunto (`turmas/`, `atividades/`, `assistente/`, `material/`…) com as telas, os hooks e o cliente de API dele
  - [ ] 97.2 Só `git mv` e import, uma pasta por commit
  - [ ] 97.3 Cria a trava: `tools/guardas/tamanho-das-pastas.test.ts`, pasta de produção com mais de 25 arquivos reprova, com as raízes numa lista (hoje `apps/web/src`) e lista fechada de exceções (R56)

### Tenant — a regra 10 travada por máquina

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

### Entrada no padrão NestJS (D81)

- [x] **14.0 — Corpo, consulta ou id fora do esquema não chegam ao service; sistema, IA, entrega, assistente e professores migram**
  - [ ] 14.1 Caracterização, num commit antes: o inválido e o 404 de cada rota dos cinco módulos, e o uuid em maiúsculas
  - [ ] 14.2 `ZodValidationPipe` e `IdPipe` em `packages/nucleo/src/entrada/` (D81), sem `issues` na resposta nem no log
  - [ ] 14.3 O bloco de `no-restricted-syntax` em `eslint.config.mjs`: `@Body()`, `@Query()` e `@Param()` sem pipe, `@Req()` e `requisicao.body`, `.query` e `.params`, valendo nos cinco módulos migrados
  - [ ] 14.4 Migram `sistema/`, `ia/`, `entrega/`, `assistente/` e `professores/`
  - [ ] 14.5 Testes: os da tabela

- [ ] **15.0 — Estrutura, sala e governança validam pelo `ZodValidationPipe`**
  - [ ] 15.1 Caracterização, num commit antes: o inválido e o 404 de cada rota dos três módulos, incluindo a `chave` e o link da sala
  - [ ] 15.2 Migram os 8 controllers de `estrutura/`, os 4 de `sala/` e os 2 de `governanca/`
  - [ ] 15.3 Os três módulos entram no `files` do bloco de `no-restricted-syntax`
  - [ ] 15.4 Testes: os da tabela

- [ ] **16.0 — Sessão e operação validam pelo `ZodValidationPipe`, sem gastar tentativa com entrada inválida**
  - [ ] 16.1 Caracterização, num commit antes: a ordem dos erros em `mfa`, `sessao/mfa` e `redefinir-mfa`, e o 404 do `slug` e do `provedor`
  - [ ] 16.2 Migram os 12 controllers de `sessao/` e os 6 de `operacao/`; o `@Req()` fica só onde se lê cookie e IP, com o motivo no bloco do ESLint
  - [ ] 16.3 Os dois módulos entram no `files` do bloco de `no-restricted-syntax`
  - [ ] 16.4 Testes: os da tabela

- [ ] **17.0 — Atividade, artefato, material, tutor e privacidade migram, e o lint vale em todo controller**
  - [ ] 17.1 Caracterização, num commit antes: o inválido e o 404 da `questao`, da `ferramenta`, do upload e do pedido do titular
  - [ ] 17.2 Migram os 4 controllers de `atividade/`, os 2 de `artefato/`, `material/`, os 2 de `tutor/` e os 2 de `privacidade/`
  - [ ] 17.3 O `files` do bloco passa a `apps/api/src/**/*.controller.ts`; saem `lerEntrada`, `idDoCaminho` e `lerConsultaPaginada`
  - [ ] 17.4 Testes: os da tabela

### Jobs tipados

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

### Resiliência

- [ ] **43.0 — Job estourado dá `TEMPO_ESGOTADO`**
  - [ ] 43.1 O `43_task.md` é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento: desenho e testes em `onda-3b.md`

- [ ] **44.0 — Falha final alerta e fica 30 dias; o pedido do titular, até a ação**
  - [ ] 44.1 O `44_task.md` é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento: desenho e testes em `onda-3b.md`

- [ ] **48.0 — Provedor lento, 429 ou fora falha rápido, com orçamento**
  - [ ] 48.1 O `48_task.md` é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento: desenho e testes em `onda-3c.md`

### Pastas, no projeto inteiro

- [ ] **33.0 — `credencial/` reúne senha, cookie, hash e desafio**
  - [ ] 33.1 O `33_task.md` é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **34.0 — `sessao/` só tem fluxos, em subpastas, com `index.ts`**
  - [ ] 34.1 O `34_task.md` é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **35.0 — `ops/` só tem terminal; casos de uso em `operacao/`, paginação em `http/`**
  - [ ] 35.1 O `35_task.md` é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento: desenho e testes em `onda-2.md`

- [ ] **96.0 — Na API, `estrutura/`, `operacao/`, `sala/` e `atividade/` têm uma subpasta por recurso, e pasta de produção com mais de 25 arquivos reprova**
  - [ ] 96.1 O `96_task.md` é escrito pelo Arquiteto antes de a tarefa partir: uma subpasta por recurso, como o `nest g resource` (`estrutura/turma/` com o controller, o service, o repository e os testes dele)
  - [ ] 96.2 Só `git mv` e import, uma pasta por commit
  - [ ] 96.3 A trava que a 97.0 criou ganha a raiz `apps/api/src`, com lista fechada de exceções e motivo (R56)

### Camadas e lint

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

### Higiene

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

- [ ] **90.0 — Um Dockerfile com `target`, imagens medidas antes e depois**
  - [ ] 90.1 O `90_task.md` é escrito pelo Arquiteto antes de a tarefa partir, contra o código daquele momento: desenho e testes em `onda-5.md`

### O guia do desenvolvedor

- [ ] **95.0 — O dev que chega acha cada coisa pelo guia do desenvolvedor (Claude Code #2)**
  - [ ] 95.1 O Claude Code #2 escreve `docs/guia-do-desenvolvedor.md` e a correção de `docs/arquitetura.md` e entrega em `.processo/reengenharia/guia/` (no térreo) até ~15h de 22/10
  - [ ] 95.2 O Arquiteto revisa com o `revisor-geral`, aplica no andar da spec, faz o `README.md` apontar para o guia na primeira tela, e põe no commit
  - [ ] 95.3 Só documento, sem portão de código e sem linha

## Saíram para a X6 (D81)

Não partem na X5. Os documentos que já existem (20.0 a 23.0, 26.0 a 29.0) ficam como estão, para a X6 reescrever
contra o código dela; o desenho continua no `onda-<n>.md` de cada uma, revisto pela D81 onde ela diz (T2 e T18 saem).

**Antes do portão do piloto** (a IA e o PDF no worker, o prazo do cliente e o Redis fora):

- **42.0 — IA por Command registrado, no processo, com o prompt caracterizado** → X6
- **45.0 — PDF lido no worker da API, com o objeto apagado em todo caminho** → X6
- **46.0 — Listar, reprocessar e descartar job, sem `dados` e sem perder pedido do titular** → X6
- **47.0 — IA no worker, prazo por perfil, Tutor e ferramenta em filas separadas, p95 + 1 s no máximo** → X6
- **49.0 — Tokens por minuto, degradação 80.4 e métricas de IA** → X6
- **50.0 — Provedor fora do Brasil ou sem a categoria não sobe** → X6
- **52.0 — Rede pendurada dá "Tentar de novo"** → X6
- **54.0 — Redis fora: 503 sem gastar tentativa** → X6

**Junto da X4 ou do F2** (a onda 4, de tela):

- **55.0 — Cobertura por pasta, com piso** → X6
- **56.0 — Componente que lança mostra a tela de falha** → X6
- **57.0 — Sessão injetável** → X6
- **58.0 — `<Leitura>`** → X6
- **59.0 — Botão e confirmação de perigo no kit** → X6
- **60.0 — Aprovar, Time e Aplicação provados, com as mutações da §2.2** → X6
- **61.0 — Tutor e Atividade do aluno provados** → X6
- **62.0 — Páginas anônimas e login por cima** → X6
- **63.0 — Peças da base** → X6
- **64.0 — Operação** → X6
- **65.0 — Coordenação** → X6
- **66.0 — `Aprovar`** → X6
- **67.0 — `Time`, `AplicacaoDoArtefato`, `EncerramentoDaAtividade`** → X6
- **68.0 — `Atividade`** → X6
- **69.0 — `Tutor`** → X6
- **70.0 — `Estrutura`, `AnoEDisciplinas` e hooks de anúncio, painel e ano** → X6
- **71.0 — `Material`, `DialogoDeEnvioDeMaterial`, `ListaDaTurma`** → X6
- **72.0 — `Professores`, `PainelDoProfessor`, `DetalheDoPedido`, `Agentes`, `Governanca`, `Analista`** → X6
- **73.0 — `Turmas`, `TurmaHoje`, `AlunosDaTurma`, `AtividadesDaTurma`, `ConvidarAlunos`** → X6
- **74.0 — `Artefato`, `Criados`, `Conversa`** → X6
- **75.0 — Entrada comum: `Mfa`, `Entrar`, `ConfigurarMfa`, `Convite`** → X6
- **76.0 — `NovaEscola`, `Escolas`, `NovaRede`** → X6
- **77.0 — `TurmaPublica`, `Convite`, `LoginPorCima`, `CascaDaEscola`, `Menu`, `SeletorDeEscola`** → X6
- **78.0 — `DialogoDoConvite`, `ListaDePedidos`, `DialogoDeDecisao`, `MotorFormulario`, `CaixaPedido`** → X6
- **79.0 — Sino, fila e Painel da coordenação pela leitura pronta** → X6
- **80.0 — Galeria e lints em zero** → X6

**O resto** (o OpenAPI, `conformidade/`, os subcaminhos e as leituras prontas da onda 2, a onda 5, a 20.0 e a Etapa 9 ⛔,
com as perguntas da §5 do `DIAGNOSTICO.md` marcadas "Para a Etapa 9"):

- **20.0 — A web aceita campo extra e, com contrato quebrado, mostra "há uma versão nova"** → X6
- **21.0 — Rota fora do registro ou divergente reprova, e o OpenAPI sai dele** → X6
- **22.0 — Todas as rotas estão no registro, sem lista de pendentes** → X6
- **23.0 — A web chama pelo registro, sem literal `/v1/`** → X6
- **26.0 — Risco à vida, assunto delicado e pedido de resposta em `conformidade/`, comportamento igual** → X6
- **27.0 — Os padrões da D55, de entrada e de saída, vivem em `conformidade/`** → X6
- **28.0 — Tirar qualquer padrão deixa uma amostra vermelha** → X6
- **29.0 — Mudar o `ouro` junto com o padrão é recusado** → X6
- **30.0 — `@educa/shared/servidor` existe, e a web não o importa** → X6
- **31.0 — As peças de teste de mais de uma app moram em `tools/testes/`** → X6
- **32.0 — O `nucleo` tem os subcaminhos `db`, `identidade`, `fila`, `privacidade` e `ia`** → X6
- **37.0 — O professor lê o "esperando" numa chamada, sem nome de aluno** → X6
- **38.0 — A coordenação lê o "esperando" numa chamada, e `turmas` diz quem fica sem professor** → X6
- **39.0 — `GET /v1/escola/roteiro` diz se a escola está montada** → X6
- **40.0 — O prazo de 15 dias do titular vem da API** → X6
- **41.0 — Trocar o material que falhou é uma transação só (`substitui`)** → X6
- **81.0 — Spike: o e2e insere por tabela Drizzle sem `dist`, ou escolhe A, B ou C** → X6
- **82.0 — Helper de e2e uma vez; a cópia reprova o lint** → X6
- **83.0 — Nenhum spec copia helper (um por commit; onda 4 por último)** → X6
- **84.0 — Coluna obrigatória nova quebra o teste da semente** → X6
- **85.0 — O e2e semeia só pela semente; `insert into` novo reprova** → X6
- **86.0 — Operador, painel e equipe de teste saem mesmo com caso estourado** → X6
- **87.0 — Toda espera da infra de teste tem prazo** → X6
- **88.0 — Infra por arquivo, p95 da sessão e custo da rede lenta medidos** → X6
- **89.0 — Os quatro jobs avisam no limiar do teto** → X6
- **91.0 — E2e sem observabilidade, realtime atrás de profile, nada apagado** → X6
- **92.0 — Etapa 9: skills, agentes, regras e orquestração revistos com o Joaquim, e as tarefas da onda 6 numeradas** → X6

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | — | — (concluída) |
| 2.0 | 1.0 | — (concluída) |
| 3.0 | — | 3.0 a 97.0 |
| 4.0 | — | — (concluída) |
| 5.0 | — | — (concluída) |
| 93.0 | 2.0 | — (concluída) |
| 94.0 | 93.0 | 3.0 a 97.0 |
| 51.0 | — | 3.0 a 35.0, 43.0 a 48.0, 90.0 a 96.0 |
| 53.0 | 51.0 | 3.0 a 35.0, 43.0 a 48.0, 90.0 a 96.0 |
| 36.0 | 51.0, 53.0 | 3.0 a 35.0, 43.0 a 48.0, 90.0 a 96.0 |
| 97.0 | 36.0 | 3.0 a 35.0, 43.0 a 48.0, 90.0 a 96.0 |
| 6.0 | — | 3.0 a 97.0 |
| 7.0 | 6.0 | 3.0 a 97.0 |
| 8.0 | 7.0 | 3.0 a 97.0 |
| 14.0 | — | 3.0 a 97.0 |
| 15.0 | 14.0 | 3.0 a 97.0 |
| 16.0 | 14.0, 11.0 | 3.0 a 97.0 |
| 17.0 | 15.0, 16.0 | 3.0 a 97.0 |
| 18.0 | — | 3.0 a 97.0 |
| 19.0 | 18.0 | 3.0 a 97.0 |
| 43.0 | 19.0 | 3.0 a 97.0 |
| 44.0 | — | 3.0 a 97.0 |
| 48.0 | — | 3.0 a 97.0 |
| 33.0 | 7.0, 10.0, 11.0, 16.0 | 3.0 a 97.0 |
| 34.0 | 33.0 | 3.0 a 97.0 |
| 35.0 | 34.0, 17.0 | 3.0 a 97.0 |
| 96.0 | 15.0, 16.0, 17.0, 35.0, 51.0, 97.0 | 3.0 a 97.0 |
| 9.0 | 6.0 | 3.0 a 97.0 |
| 10.0 | — | 3.0 a 97.0 |
| 11.0 | — | 3.0 a 97.0 |
| 12.0 | 9.0, 10.0, 11.0, 34.0, 35.0, 96.0 | 3.0 a 97.0 |
| 13.0 | 12.0, 97.0 | 3.0 a 97.0 |
| 24.0 | 12.0 | 3.0 a 97.0 |
| 25.0 | 13.0 | 3.0 a 97.0 |
| 90.0 | 24.0 | 3.0 a 97.0 |
| 95.0 | — | 3.0 a 97.0 |

**O paralelo é amplo de propósito (RECORTE §3):** toda tarefa pode correr ao lado de qualquer outra da X5, menos as
da web entre si, e quem segura é o `linhas.ts`, que não junta duas tarefas com arquivo previsto em comum, nem duas com migration, schema ou
`packages/shared`. Por isso os "Arquivos previstos" de cada `N_task.md` precisam ser completos.

**Uma linha para a web, duas para a API e os pacotes** (ajuste do Claude Code #2). A 51.0, 53.0, 36.0 e 97.0 não correm
juntas (o paralelo delas não cita as outras, e as dependências já as põem em fila), e estão logo depois da onda 0 na
lista: quando uma delas está livre, é a primeira que uma linha ociosa pega. Assim há no máximo uma tarefa de web por vez,
e as outras duas linhas ficam com a API.

**Pastas depois da lógica.** Cada pasta se move depois que as tarefas de lógica que tocam nela fecharam (33.0 depois da
7.0, 10.0, 11.0 e 16.0; 35.0 e 96.0 depois da 17.0; 36.0 depois da prova), para nenhum documento ficar com caminho
velho. A 12.0 e a 13.0 gravam caminho (as regras do depcruise e o `eslint-suppressions.json`), e por isso vêm depois das
pastas; o Arquiteto confere os caminhos do `N_task.md` delas, e da 24.0 e da 25.0, antes de partirem.

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 2.0 | `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 3.0 | `llm-integrator`, `test-engineer`, `conformidade-reviewer`, `revisor-geral` |
| 4.0 | `tenancy-guardian`, `conformidade-reviewer`, `infra-guardian`, `test-engineer`, `revisor-geral` |
| 5.0 | `test-engineer`, `revisor-geral` |
| 93.0 | `conformidade-reviewer`, `test-engineer`, `revisor-geral` |
| 94.0 | `conformidade-reviewer`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 51.0 | `infra-guardian`, `tenancy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 53.0 | `privacy-guardian`, `infra-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 36.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 97.0 | `frontend-reviewer`, `test-engineer`, `revisor-geral` |
| 6.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 7.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 8.0 | `tenancy-guardian`, `infra-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 14.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 15.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 16.0 | `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral` |
| 17.0 | `tenancy-guardian`, `privacy-guardian`, `test-engineer`, `revisor-geral` |
| 18.0 | `tenancy-guardian`, `privacy-guardian`, `test-engineer`, `revisor-geral` |
| 19.0 | `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral` |
| 43.0 | `infra-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 44.0 | `infra-guardian`, `privacy-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 48.0 | `infra-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral` |
| 33.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 34.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 35.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 96.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 9.0 | `tenancy-guardian`, `test-engineer`, `revisor-geral` |
| 10.0 | `test-engineer`, `revisor-geral` |
| 11.0 | `test-engineer`, `revisor-geral` |
| 12.0 | `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral` |
| 13.0 | `test-engineer`, `revisor-geral` |
| 24.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 25.0 | `test-engineer`, `revisor-geral` |
| 90.0 | `infra-guardian`, `test-engineer`, `revisor-geral` |
| 95.0 | `revisor-geral` (revisão do Arquiteto) |

## Critério de pronto da funcionalidade

Do `ROADMAP.md` (X5, "Pronto quando", revisto pelo recorte de 22/10/2026), detalhado com o PRD (§11, "O recorte"):

- Comparado com a linha de base (`.reengenharia/LINHA-DE-BASE.md`), a tipagem, o lint, as guardas, a unidade, a
  integração, o e2e e o infra rodam verdes, com os resultados reais registrados; a falha preexistente não some sem
  registro
- Os defeitos de conformidade da onda 0 fechados (D36, D55, S12, o hook), com o `ouro` no alvo desde a tarefa dona
- A regra 10 travada por máquina: todo repository prova o escopo ou declara a exceção com motivo, só repository importa
  tabela, e os três da IA tiram a escola do contexto (6.0 a 9.0)
- Na prova, resposta atrasada não sobrescreve a mais nova, e a escolha pendente sobrevive ao F5 (51.0, 53.0)
- Toda rota valida corpo, consulta e id pelo `ZodValidationPipe` e pelo `IdPipe`, e o lint reprova o controller que
  não valida (14.0 a 17.0); todo job tem definição tipada, recusada ao enfileirar e no worker (18.0, 19.0)
- Job estourado dá `TEMPO_ESGOTADO`, a falha final alerta e fica 30 dias, e o provedor lento, 429 ou fora falha rápido
  (43.0, 44.0, 48.0), cada um com o teste que simula a falha
- As pastas seguem uma convenção só (uma por recurso; *feature folder* na web; `componentes/ui/`), travada por teste
  (33.0 a 36.0, 96.0, 97.0), com o histórico do `git mv`
- O que entrar dos itens 8 e 9 (camadas, catraca, dependências, erro tipado, Dockerfile) entra travado por ferramenta;
  o que o corte deixar fora está em "Saíram para a X6"
- O guia do desenvolvedor existe, o `docs/arquitetura.md` diz o que existe, e o `README.md` aponta para o guia (95.0)
- Os fluxos que não podem quebrar (os e2e obrigatórios da regra 40) e as invariantes das regras 10 e 70 continuam
  provados
- `.reengenharia/` apagado, com o que importa migrado para `tasks/prd-reengenharia/` e `docs/`
- O relatório final diz o que foi feito, o que foi medido e o que ficou para a X6, sem número que não foi coletado
- A esteira está verde no último commit que alterou código, e o Validador aprovou contra o PRD, RF a RF, pelo recorte
