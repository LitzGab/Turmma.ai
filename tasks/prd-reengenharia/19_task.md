# Tarefa 19.0 — O worker valida pela definição, e o teste liga tipo, fila e processador

**Funcionalidade:** reengenharia · **Depende de:** 18.0
**Subagentes obrigatórios:** `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O worker valida cada job pela definição antes do processador, o despachante publica com a retentativa do tipo, e um teste
liga tipo, fila e processador.

## Contexto necessário

- `onda-1b.md` §2 "T4" e §3; `techspec.md` §6; `prd.md` RF8; regras 10 (item 3), 20 (item 9) e 80 (itens 7 e 9)
- Código: `executor.ts` (`:26`, `:42`, `:223`), `montagem.ts` (`:151`, `:231`), `publicacao.ts:18`,
  `fila-de-publicacao.ts:63`; a validação à mão de `eliminar-titular.ts:50` e `sintetico.ts:130` sobe para o executor

## Subtarefas

- [x] 19.1 — Caracterização, num commit antes: as opções de publicação como literal
- [x] 19.2 — `Processador<T>` tipado; o executor valida e falha com `DADOS_INVALIDOS`, definitivo
- [x] 19.3 — `opcoesDeJob(tipo)` e `nomeDaFilaBullMQ(fila, executor)`, com a definição injetável em `fila-de-teste.ts`
- [x] 19.4 — `montagem.test.ts`: tipo ↔ processador ↔ réplica da fila
- [x] 19.5 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/worker/src/executor.ts`, `executor.test.ts` | alterado |
| `apps/worker/src/montagem.ts`, `montagem.test.ts` | alterado e novo |
| `apps/worker/src/processadores/*.ts` | alterado |
| `packages/nucleo/src/fila/publicacao.ts`, `nome-da-fila.test.ts`, `packages/nucleo/src/index.ts` | alterado e novo |
| `apps/despachante/src/fila-de-publicacao.ts`, `fila-de-publicacao.test.ts` | alterado |
| `apps/worker/test/fila-de-teste.ts`, `execucao.int.test.ts` | alterado |
| `apps/despachante/test/vagas.int.test.ts`, `reconciliacao.int.test.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| Carac.: publica `attempts: 5`, `backoff` exponencial de 2.000 ms, jitter 0,5, em literal | unidade (`fila-de-publicacao.test.ts › publica cada job com o id da linha como jobId, as opções de retentativa…`) | igual a hoje | `tentativas: 4` no sintético |
| Definição injetada com `tentativas: 2` publica `attempts: 2` | unidade (`fila-de-publicacao.test.ts › cada job leva a retentativa da definição do tipo dele…`) e integração (`vagas.int.test.ts › a retentativa é a da definição do tipo…`) | a retentativa é do tipo | publicar sempre as do sintético |
| `dados` recusados: `falhou`/`DADOS_INVALIDOS`, sem processador | integração (`execucao.int.test.ts › o worker valida pela definição › dados que o esquema recusa terminam falhou…`) | o worker não confia na gravação | tirar a validação do executor |
| `DADOS_INVALIDOS` não gasta tentativas | unidade (`executor.test.ts › dados que o esquema recusa (%s)…`) | definitivo | `new FalhaDeJob(DADOS_INVALIDOS, false)` |
| Tipo sem definição termina `TIPO_DESCONHECIDO` | integração (`execucao.int.test.ts › o worker valida pela definição › tipo que o registro não tem…`) e unidade (`executor.test.ts › tipo que o registro não tem…`) | §3 | validar antes de procurar a definição |
| O payload de hoje de cada tipo passa | unidade (`executor.test.ts › o payload de hoje de cada um dos 8 tipos passa pela definição…`) | regra 80.9 | campo novo obrigatório |
| Log e `failedReason` só com `jobId`, `tentativa` e código | integração (o mesmo caso dos `dados` recusados, que confere o log e o Redis) | regra 20.9 | `FalhaDeJob` com a mensagem do zod |
| O processador recebe o `prazoMs` da definição | unidade (`executor.test.ts › o processador recebe os dados que o esquema leu…`) | o prazo chega | `prazoMs` fixo |
| `Processador<'titular.montar-arquivo'>` que lê campo inexistente não compila | unidade, tsc (`executor.test.ts › o tipo dos dados do processador é o da definição…`) | tipado pela definição | `Record<string, unknown>` |
| Linha `sistema.*` com `escola_id` (por SQL) não roda | integração (`execucao.int.test.ts › o worker valida pela definição › rotina do sistema com escola…`) e unidade (`executor.test.ts › o escopo da definição se confere…`) | o escopo da definição se confere | tirar a conferência |
| Isolamento: job da escola A apontando para a linha da B não roda, e a da B fica intacta | integração (`execucao.int.test.ts › isolamento no worker › job da fila com a escola A, ou sem escola, apontando para a linha da B não roda…`) | valida depois da leitura com escopo | validar pela linha lida sem escopo |
| Concorrência: a mesma linha entregue duas vezes roda uma vez, e a escrita tardia não rebaixa o concluído | integração (`execucao.int.test.ts › escrita tardia…` e `› o mesmo job entregue de novo pela fila depois de concluído não roda outra vez`; duas entregas ao mesmo tempo: `reexecucao.int.test.ts › a fila perde o job ativo e a reconciliação o republica enquanto a primeira execução ainda roda…`) | um caminho só | `iniciarExecucao` sem condição de estado |
| Todo tipo `executor: 'worker'` tem processador na réplica de cada fila | unidade (`montagem.test.ts › todo tipo que o worker executa tem processador…`) | sem job órfão | tirar `sistema.expurgar-acesso` de `montarRotinas` |
| Todo processador montado tem definição na sua fila | unidade (`montagem.test.ts › todo processador de uma réplica tem definição…`) | o inverso | `'sistema.fantasma'` em `montarRotinas` |
| `titular.montar-arquivo` só na `normal`, rotinas só na `lote`, sintético nas três | unidade (`montagem.test.ts › o arquivo do titular só na \`normal\`…`) | fila = réplica | `montar-arquivo` também na `lote` |
| `executor: 'api'` vai para a fila `api`: o worker não a recebe | unidade (`fila-de-publicacao.test.ts › o tipo da API vai à Queue da API…`) e integração (`vagas.int.test.ts › o tipo da API vai à fila da API…`) | a IA da onda 3 fora do worker | ignorar o `executor` |
| A `Queue` da API que falhou é trocada pelo executor, e a do worker não é tocada | unidade (`fila-de-publicacao.test.ts › a Queue da API que falhou também é trocada, pelo executor…`) | regra 80.7 | trocar com `'worker'` |
| `nomeDaFilaBullMQ(fila, 'worker')` é o nome de hoje | unidade (`nome-da-fila.test.ts › a do worker é o nome de hoje…`) | job antigo segue consumido | prefixar o `worker` |

## Como testar

- A falha no worker: copie `apps/worker/test/execucao.int.test.ts › falha permanente: 5 tentativas com recuo e depois
  falhou, com a escola e o código tipado`, e o log de `:134` (`LogEmMemoria`).
- Isolamento: `execucao.int.test.ts › isolamento no worker › job da fila com a escola A, ou sem escola, apontando para a
  linha da B não roda…`.
- Retentativa: `apps/despachante/test/vagas.int.test.ts`, com a `BancadaDeFila` (`processadores` e a definição injetáveis).
- Isolado: `npx vitest run --project integracao apps/worker/test/execucao.int.test.ts` e `npx vitest run --project unidade apps/worker/src`.
- Armadilha: o `DADOS_INVALIDOS` de `reconciliacao.int.test.ts:339` é do `job.data` do Redis, outra coisa.

## Fora do escopo desta tarefa

Aplicar o `prazoMs` e o `executor: 'api'` de verdade (onda 3); a validação ao enfileirar (18.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A caracterização das opções de publicação (19.1) entra no commit da tarefa, e não num commit antes. | O hook só aceita commit com código, e um commit só de teste pediria portão e revisão duas vezes (a mesma regra da 14.0, da 18.0 e da 51.0). O teste em literal foi escrito e passou contra o `OPCOES_DE_JOB_PUBLICADO` antes da troca. | `onda-1b.md` §2 T4, "Como a 19.0 ficou" (último item) |
| `OPCOES_DE_JOB_PUBLICADO`, `TENTATIVAS_DE_JOB`, `RECUO_INICIAL_JOB_MS` e `JITTER_DO_RECUO` saem do nucleo, e `opcoesDeJob(tipo, definicoes?)` as substitui; o tipo que o registro não conhece segue com as cinco tentativas e os 2 s. | A retentativa passa a ser da definição, e manter as constantes seria um segundo lugar para ela. O tipo desconhecido não pode derrubar a publicação, e o worker o termina na primeira tentativa: a spec pede "os mesmos 5 e 2 s". | `onda-1b.md` §2 T4, "19.0, no worker" e "Como a 19.0 ficou" |
| `nomeDaFilaBullMQ(fila, executor)` tem o `executor` obrigatório, e o da API se chama `api-<fila>`; a `Queue` da API nasce na primeira vez que um tipo a pede. | A spec manda a fila vir do executor sem dar o nome; o obrigatório faz cada chamada escolher, e o sob demanda evita três `Queue` e três conexões que hoje nenhum tipo usa. | `onda-1b.md` §2 T4, texto de abertura ("A fila no BullMQ vira `nomeDaFilaBullMQ(fila, executor)`") e "Como a 19.0 ficou" |
| `montarProcessadores` sai de `montarWorker` e é exportado, com as peças já criadas como argumento. | O teste "tipo ↔ processador ↔ réplica da fila" precisa chamar a escolha real do que cada réplica leva, sem subir Redis e Postgres; um teste que lê uma cópia da tabela não prova a montagem. | `onda-1b.md` §2 T4, "A trava (testes)" e "Como a 19.0 ficou" |
| `Processador<Tipo>` e `ProcessadoresDeJob` tipam o processador pela definição, e o executor o chama por um `never` (`ProcessadorSemTipo`). | O tipo do job é lido da linha em execução, e o compilador não liga o texto à chave do mapa; é o único ponto sem prova de tipo, e só recebe o que o esquema do mesmo tipo leu. | `onda-1b.md` §2 T4, "19.0, no worker" e "Como a 19.0 ficou" |
| O escopo da definição se confere no executor: `(escopo === 'sistema') !== (escola da linha === null)` é `DADOS_INVALIDOS`, definitivo. | A linha `sistema.*` com `escola_id` passa no check do banco (`escola_id is not null or tipo like 'sistema.%'`) e, no contexto da escola, rodaria a rotina do sistema; a spec pede a conferência ("o escopo da definição se confere") sem dizer o código. | `onda-1b.md` §2 T4, "A trava (testes)" e "Como a 19.0 ficou" |
| O `ExecucaoDoJob.prazoMs` é obrigatório, e os testes que chamam um processador direto passam por `execucaoDoJob()` (`apps/worker/test/execucao-do-job.ts`). | O campo vem da definição, e um opcional esconderia o executor que esquecesse de entregá-lo; a troca nos testes é só de tipo. | `onda-1b.md` §2 T4, "O `prazoMs`" |
| Os casos de `DADOS_INVALIDOS` de `montar-arquivo.int.test.ts`, de `eliminar-titular.int.test.ts` e de `sintetico.test.ts` saem dos testes dos processadores, e o que continua protegendo é o executor (`executor.test.ts` e `execucao.int.test.ts › o worker valida pela definição`). | Os processadores não validam mais os dados: a validação é do executor, para todos os tipos de uma vez. O caso "sem escola no contexto" fica, agora na falha de `exigirEscolaDoContexto`. | `onda-1b.md` §2 T4, "19.0, no worker" ("a validação à mão sobe para o executor") |
| "A mesma linha entregue duas vezes em paralelo roda uma vez" fica no teste da entrega repetida depois do `concluido` (`execucao.int.test.ts`), e não num de duas entregas simultâneas. | `iniciarExecucao` aceita `ativo` de propósito (D49, o stalled): duas entregas ao mesmo tempo rodam as duas, e o que se prova é que o terminado não roda de novo. | `onda-1b.md` §2 T4, "Como a 19.0 ficou" (penúltimo item) |
| `BancadaDeFila` ganha o registro injetável (`new BancadaDeFila(definicoes)`) e tipa o `tipo` do pedido por ele; a gravação da bancada segue sem passar pela definição. | A recomendação do `privacy-guardian` e do `revisor-geral` da 18.0 (19.3), e o worker que não confia na gravação precisa de linha que a definição recusa. | `onda-1b.md` §2 T4, "Como a 19.0 ficou" (item da definição injetável) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › tipo que o registro não tem
  const definicao = this.#definicoes[tipo]
- if (definicao === undefined) throw new FalhaDeJob(CodigoDeFalhaDeJob.TIPO_DESCONHECIDO, true)
```
```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o escopo da definição se confere
- if ((definicao.escopo === 'sistema') !== (escolaId === null)) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
+ if (definicao.escopo === 'sistema' && escolaId !== null) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
  const lidos = definicao.dados.safeParse(dados)
```
```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o escopo da definição se confere
- if ((definicao.escopo === 'sistema') !== (escolaId === null)) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
+ if (definicao.escopo !== 'sistema' && escolaId === null) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
  const lidos = definicao.dados.safeParse(dados)
```
```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › dados que o esquema recusa
  const lidos = definicao.dados.safeParse(dados)
- if (!lidos.success) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
  const processador = this.#processadores[tipo]
```
```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › dados que o esquema recusa
  const lidos = definicao.dados.safeParse(dados)
- if (!lidos.success) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, true)
+ if (!lidos.success) throw new FalhaDeJob(CodigoDeFalhaDeJob.DADOS_INVALIDOS, false)
  const processador = this.#processadores[tipo]
```
```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › tipo com definição e sem processador
  const processador = this.#processadores[tipo]
- if (processador === undefined) throw new FalhaDeJob(CodigoDeFalhaDeJob.TIPO_DESCONHECIDO, true)
```
```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o processador recebe os dados que o esquema leu
- await processador(lidos.data as never, { ...execucao, prazoMs: definicao.prazoMs })
+ await processador(dados as never, { ...execucao, prazoMs: definicao.prazoMs })
```
```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o processador recebe os dados que o esquema leu
- await processador(lidos.data as never, { ...execucao, prazoMs: definicao.prazoMs })
+ await processador(lidos.data as never, { ...execucao, prazoMs: 90_000 })
```
```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o processador recebe os dados que o esquema leu
- this.#definicoes = dependencias.definicoes ?? DEFINICOES_DE_JOB
+ this.#definicoes = DEFINICOES_DE_JOB
  this.#processadores = dependencias.processadores
```
```mutacao
arquivo: packages/nucleo/src/fila/publicacao.ts
teste: packages/nucleo/src/fila/publicacao.test.ts › a retentativa vem da definição do tipo
- const definicao = definicoes[tipo]
+ const definicao = DEFINICOES_DE_JOB[tipo]
  if (definicao === undefined) return OPCOES_DO_TIPO_DESCONHECIDO
```
```mutacao
arquivo: packages/nucleo/src/fila/publicacao.ts
teste: packages/nucleo/src/fila/publicacao.test.ts › o tipo que o registro não conhece
- const OPCOES_DO_TIPO_DESCONHECIDO: OpcoesDeJobPublicado = { attempts: 5, backoff: { type: 'exponential', delay: 2_000, jitter: 0.5 } }
+ const OPCOES_DO_TIPO_DESCONHECIDO: OpcoesDeJobPublicado = { attempts: 1, backoff: { type: 'exponential', delay: 2_000, jitter: 0.5 } }
```
```mutacao
arquivo: packages/nucleo/src/fila/publicacao.ts
teste: packages/nucleo/src/fila/publicacao.test.ts › os 8 tipos de hoje são do worker
- return definicoes[tipo]?.executor ?? 'worker'
+ return definicoes[tipo]?.executor ?? 'api'
```
```mutacao
arquivo: packages/nucleo/src/fila/filas.ts
teste: packages/nucleo/src/fila/nome-da-fila.test.ts › a do worker é o nome de hoje
- return executor === 'worker' ? fila : `api-${fila}`
+ return `api-${fila}`
```
```mutacao
arquivo: packages/nucleo/src/fila/filas.ts
teste: packages/nucleo/src/fila/nome-da-fila.test.ts › a da API tem outro nome
- return executor === 'worker' ? fila : `api-${fila}`
+ return fila
```
```mutacao
arquivo: apps/despachante/src/fila-de-publicacao.ts
teste: apps/despachante/src/fila-de-publicacao.test.ts › o tipo da API vai à Queue da API
- const executor = executorDoJob(job.tipo, this.definicoes)
+ const executor = 'worker' as const
  const chave = nomeDaFilaBullMQ(job.fila, executor)
```
```mutacao
arquivo: apps/despachante/src/fila-de-publicacao.ts
teste: apps/despachante/src/fila-de-publicacao.test.ts › o tipo da API vai à Queue da API
  const executor = executorDoJob(job.tipo, this.definicoes)
- const chave = nomeDaFilaBullMQ(job.fila, executor)
+ const chave = job.fila
```
```mutacao
arquivo: apps/despachante/src/fila-de-publicacao.ts
teste: apps/despachante/src/fila-de-publicacao.test.ts › o tipo da API vai à Queue da API
- this.comFila(job.fila, executorDoJob(job.tipo, this.definicoes), async (queue) => {
+ this.comFila(job.fila, 'worker', async (queue) => {
```
```mutacao
arquivo: apps/despachante/src/fila-de-publicacao.ts
teste: apps/despachante/src/fila-de-publicacao.test.ts › o tipo da API vai à Queue da API
  const existente = this.#filas.get(nome)
- if (existente !== undefined) return existente
```
```mutacao
arquivo: apps/despachante/src/fila-de-publicacao.ts
teste: apps/despachante/src/fila-de-publicacao.test.ts › cada job leva a retentativa da definição do tipo
- opts: { ...opcoesDeJob(job.tipo, this.definicoes), jobId: job.id },
+ opts: { ...opcoesDeJob(job.tipo), jobId: job.id },
```
```mutacao
arquivo: apps/despachante/src/montagem.ts
teste: apps/despachante/test/vagas.int.test.ts › a retentativa é a da definição do tipo
  undefined,
- opcoes.definicoes,
+ undefined,
```
```mutacao
arquivo: apps/worker/src/montagem.ts
teste: apps/despachante/test/vagas.int.test.ts › publicação ambígua
- ...(opcoes.definicoes === undefined ? {} : { definicoes: opcoes.definicoes }),
  logger,
```
```mutacao
arquivo: apps/worker/src/montagem.ts
teste: apps/worker/src/montagem.test.ts › todo tipo que o worker executa
  [TIPO_EXPURGAR_JOBS]: criarExpurgoDeJobs({ repositorio: new ExpurgoDeJobsRepository(banco), logger }),
- [TIPO_EXPURGAR_ACESSO]: criarExpurgoDeAcesso({ repositorio: new ExpurgoDeAcessoRepository(banco), relogio, logger }),
```
```mutacao
arquivo: apps/worker/src/montagem.ts
teste: apps/worker/src/montagem.test.ts › todo processador de uma réplica tem definição
- [TIPO_EXPURGAR_ACESSO]: criarExpurgoDeAcesso({ repositorio: new ExpurgoDeAcessoRepository(banco), relogio, logger }),
+ [TIPO_EXPURGAR_ACESSO]: criarExpurgoDeAcesso({ repositorio: new ExpurgoDeAcessoRepository(banco), relogio, logger }),
+ ['sistema.fantasma']: criarExpurgoDeJobs({ repositorio: new ExpurgoDeJobsRepository(banco), logger }),
```
```mutacao
arquivo: apps/worker/src/montagem.ts
teste: apps/worker/src/montagem.test.ts › todo processador de uma réplica tem definição
- config.pools.normal === undefined || armazem === undefined ? undefined : { [TIPO_MONTAR_ARQUIVO]: criarMontagemDoArquivo({ banco, armazem, relogio, logger }) }
+ (config.pools.normal === undefined && config.pools.lote === undefined) || armazem === undefined ? undefined : { [TIPO_MONTAR_ARQUIVO]: criarMontagemDoArquivo({ banco, armazem, relogio, logger }) }
```
```mutacao
arquivo: apps/worker/src/montagem.ts
teste: apps/worker/src/montagem.test.ts › o arquivo do titular só na `normal`
- config.pools.lote === undefined || config.storage === undefined || config.janelaPadrao === undefined || armazem === undefined
+ (config.pools.lote === undefined && config.pools.normal === undefined) || config.storage === undefined || config.janelaPadrao === undefined || armazem === undefined
```
```mutacao
arquivo: apps/worker/src/processadores/montar-arquivo.ts
teste: apps/worker/test/montar-arquivo.int.test.ts › o titular desativado nesta escola ganha também a versão da escola
- const escolaId = exigirEscolaDoContexto()
+ const escolaId = 'sem-escola'
```
```mutacao
arquivo: apps/despachante/src/fila-de-publicacao.ts
teste: apps/despachante/src/fila-de-publicacao.test.ts › a Queue da API que falhou também é trocada, pelo executor
  private trocar(fila: Fila, executor: ExecutorDeJob, falhou: FilaBullMQ): void {
- const nome = nomeDaFilaBullMQ(fila, executor)
+ const nome = nomeDaFilaBullMQ(fila, 'worker')
```
```mutacao
arquivo: apps/despachante/src/fila-de-publicacao.ts
teste: apps/despachante/src/fila-de-publicacao.test.ts › a Queue da API que falhou também é trocada, pelo executor
- this.#filas.set(nome, this.criarFila(fila, executor))
+ this.#filas.set(nome, this.criarFila(fila, 'worker'))
```
```mutacao
arquivo: apps/despachante/src/fila-de-publicacao.ts
teste: apps/despachante/src/fila-de-publicacao.test.ts › o tipo da API vai à Queue da API
- const nova = this.criarFila(fila, executor)
+ const nova = this.criarFila(fila, 'worker')
```
```mutacao
arquivo: apps/despachante/src/montagem.ts
teste: apps/despachante/test/vagas.int.test.ts › o tipo da API vai à fila da API
- const queue = new Queue<DadosDoJobNaFila>(nomeDaFilaBullMQ(nome, executor), {
+ const queue = new Queue<DadosDoJobNaFila>(nomeDaFilaBullMQ(nome, 'worker'), {
```
```mutacao
arquivo: apps/worker/src/montagem.ts
teste: apps/worker/test/execucao.int.test.ts › falha permanente: 5 tentativas com recuo e depois falhou
- const worker = new Worker<DadosDoJobNaFila>(nomeDaFilaBullMQ(fila, 'worker'), (job, token) => executor.processar(job, token), {
+ const worker = new Worker<DadosDoJobNaFila>(nomeDaFilaBullMQ(fila, 'api'), (job, token) => executor.processar(job, token), {
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª), infra-guardian (1ª), revisor-geral (1ª) | `executor.ts`: `uso.marcar('jobs')` e o log `job.iniciado` vêm antes da conferência da definição, do escopo e dos dados; a linha recusada entra no uso da escola | A tarefa 43.0 (`TEMPO_ESGOTADO`) toca `executor.ts`. Não é barata: o tipo e os dados vêm de `iniciarExecucao`, então mover a conferência para antes da contagem muda a ordem de vaga, início e falha, e o comentário atual diz que "cada tentativa que começa conta" |
| infra-guardian (1ª) | Um tipo `api` toma a vaga do worker e ninguém consome `api-<fila>`; travar o registro até haver consumidor | 43.0, onde o `executor: 'api'` passa a valer. Hoje os 8 tipos são `worker` e `montagem.test.ts` prova o inverso |
| infra-guardian (1ª) | As filas `api-*` ficam fora da medição por fila (`infra/test/metricas.int.test.ts`), do alerta e do runbook | 43.0 / onda 3, com o consumidor. Sem consumidor não há o que medir |
| test-engineer (1ª) | O executor recusar a definição com `executor !== 'worker'` | Recusada nesta tarefa: muda comportamento, e "aplicar o `executor: 'api'` de verdade" é "Fora do escopo" desta tarefa. Hoje quem garante é `montagem.test.ts`. Vai para a 43.0 |
| test-engineer (2ª) | O bloco de `apps/worker/src/montagem.ts` (`nomeDaFilaBullMQ(fila, 'api')`) só fica vermelho quando estoura a espera de 60 s do `aguardarEstado`; um caso curto prova a mesma cláusula mais rápido | Recusada nesta tarefa: o bloco prova a cláusula (vermelho pelo motivo certo), o custo é ~60 s no portão, e um caso novo reabriria a rodada. A 43.0 mexe na montagem do worker quando o consumidor da API existir e pode trocar a prova por uma mais curta |
| test-engineer (2ª) | `vagas.int.test.ts › o tipo da API vai à fila da API`: `expect(processador.iniciados('A')).toBe(0)` é lido antes de o worker sondar a fila e não prova mais nada | Recusada: a asserção é inofensiva e quem prova a regra é `daApi.fila.getJob(id)` indefinido; mexer no teste caduca aprovações por uma linha. A 43.0 reescreve este caso quando a fila `api-*` ganhar consumidor |
| revisor-geral (1ª) | `OpcoesDeJobPublicado.backoff` obrigatório | Recusada: muda tipo exportado de `@educa/nucleo` e o revisor condicionou a "se não for exigência do tipo do BullMQ", o que ele não verificou; sem efeito de comportamento |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 15:01:34 | 2026-10-22 15:02:35 | `tenancy-guardian` | 1 | APROVADO | a6a65f4cdbc50078c |
| 2026-10-22 15:01:39 | 2026-10-22 15:03:22 | `infra-guardian` | 1 | APROVADO | a8c21dd5c9e2348ec |
| 2026-10-22 15:01:48 | 2026-10-22 15:04:00 | `revisor-geral` | 1 | APROVADO | a78d514a91a6aceb4 |
| 2026-10-22 15:01:43 | 2026-10-22 15:05:49 | `test-engineer` | 1 | REPROVADO | a5553f2354d6a4814 |
| 2026-10-22 16:32:25 | 2026-10-22 16:33:09 | `revisor-geral` | 2 | APROVADO | ac531fbd0aeb48306 |
| 2026-10-22 16:32:21 | 2026-10-22 16:34:00 | `test-engineer` | 2 | APROVADO | ac69d4df4c9fd89d7 |
