# Tarefa 18.0 — Payload inválido é recusado ao enfileirar, e tipo sem definição não compila

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O `Enfileirador` valida o payload por `DEFINICOES_DE_JOB` (`packages/shared`) antes de gravar, e a fila e o `naoUrgente`
saem da definição.

## Contexto necessário

- `onda-1b.md` §2 "T4 — Registro de jobs" e §4; `techspec.md` §6 e §7; `prd.md` RF8
- Regras 10 (item 3), 20 (item 9) e 80 (itens 7 e 9)
- Código: `enfileirador.ts` (`PedidoDeJob`), `job-registro.repository.ts:75-77`, `schema/job-registro.ts:60-62` (os checks),
  `tools/guardas/regras-log.mjs:87` (`CHAVES_PESSOAIS`); chamadores: `privacidade.service.ts:238`,
  `jobs-sinteticos.service.ts:31`, `agendamentos.ts:90`, `expurgar-dado-pessoal.ts:58`, `expurgo-da-escola.repository.ts:477`

**Decisão do Arquiteto:** o `sintetico` tem as três filas e `naoUrgente: 'do-pedido'`; só nele `opcoes.naoUrgente` vale, e
`opcoes.fila` só dentro de `filas`. O `POST` sintético, o `janela.int.test.ts` e o k6 seguem iguais (outro caminho vai em
"Divergências").

## Subtarefas

- [x] 18.1 — Caracterização, num commit antes, dos 8 tipos
- [x] 18.2 — `DEFINICOES_DE_JOB` em `packages/shared/src/sistema/definicoes-de-job.ts`, com as constantes `TIPO_*`; o sintético `.strict()`
- [x] 18.3 — `enfileirar` e `enfileirarUmaVez` validam antes de gravar; os chamadores migram
- [x] 18.4 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/sistema/definicoes-de-job.ts`, `.test.ts` | novo |
| `packages/shared/src/sistema/jobs-sinteticos.ts`, `.test.ts`, `packages/shared/src/index.ts` | alterado |
| `packages/nucleo/src/fila/enfileirador.ts` | alterado |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` | alterado |
| `apps/api/src/privacidade/privacidade.service.ts`, `apps/api/src/sistema/jobs-sinteticos.service.ts` | alterado |
| `apps/worker/src/agendamentos.ts`, `apps/worker/src/processadores/*.ts` (as constantes `TIPO_*`) | alterado |
| `apps/worker/test/fila-de-teste.ts`, `execucao.int.test.ts`, `eliminar-titular.int.test.ts` | alterado |
| `apps/api/test/pedido-titular.int.test.ts`, `jobs-sinteticos.int.test.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| Carac.: fila, `naoUrgente`, prioridade e escopo de cada tipo | integração | igual a hoje | `filas: ['lote']` em `titular.montar-arquivo` |
| O sintético grava a `fila` e o `naoUrgente` do corpo | integração | `'do-pedido'` | gravar sempre a primeira de `filas` |
| `opcoes.naoUrgente` fora do `'do-pedido'` é recusado | integração | o chamador não escolhe | aceitar a sobreposição em todo tipo |
| Fila fora das `filas` é recusada, sem linha | integração | a fila é da definição | não conferir `opcoes.fila` |
| Chave a mais é recusada antes de gravar | integração | estrito | tirar o `parse` |
| Obrigatório ausente é recusado | integração | presença | `pedidoId` opcional |
| `pedidoId: 'abc'` é recusado | integração | formato | `z.string()` |
| A recusa desfaz a transação de quem pede: o pedido do titular não fica | integração (`pedido-titular.int.test.ts`) | job sse origem | engolir o erro do `parse` |
| `enfileirarUmaVez` inválido não ocupa a chave | integração (`eliminar-titular.int.test.ts`) | `parse` antes | `parse` depois |
| Duas `enfileirarUmaVez` com a mesma chave em `Promise.all`: uma linha | integração | regra 80.7 | `select` seguido de `insert` |
| Log da recusa sem a sentinela nem `issues` | integração | regra 20.9 | lançar com `error.message` |
| Isolamento: `escolaId` de outra escola no payload é recusado | integração | escola do contexto | tirar o `.strict()` |
| Isolamento: job de escola sem escola, e `sistema.*` com escola, recusados (`execucao.int.test.ts:277`) | integração | escopo do contexto | tirar o `if` de `job-registro.repository.ts:75` |
| Sintético com chave a mais é recusado | unidade | `.strict()` | tirar o `.strict()` |
| Tipo inexistente, `dados` de outro tipo, definição não estrita ou sem `prazoMs` não compilam | unidade (tsc) | um `@ts-expect-error` cada | afrouxar cada tipo |
| `escopo: 'sistema'` sse tipo `sistema.*` | unidade | check `:60` | `'sistema'` em `retencao.expurgar-escola` |
| Toda fila está no check `job_registro_fila_valida` | unidade | igual ao banco | fila fora do check |
| Nenhum esquema tem chave de `CHAVES_PESSOAIS`, por palavra (`nomeDoAluno` reprova) | unidade | payload só com id | comparar a chave inteira |
| Os 8 tipos do §2, sem `TIPO_*` no worker | unidade | fonte única | `TIPO_EXPURGAR_JOBS` de volta |

## Como testar

- Carac. e recusa: copie `apps/worker/test/execucao.int.test.ts › enfileirar › o job é gravado na transação de quem pede:
  se ela desfaz, não sobra linha nem publicação`, com a `BancadaDeFila` e o `LogEmMemoria` de `fila-de-teste.ts`.
- Sintético: `apps/api/test/jobs-sinteticos.int.test.ts › aceita com 202, grava o job da escola do token…`.
- Concorrência: `apps/worker/test/expurgo-da-escola.int.test.ts › [P] a mesma chave ao mesmo tempo dá um job só, e as duas
  gravações devolvem o mesmo id`.
- Isolado: `npx vitest run --project integracao apps/worker/test/execucao.int.test.ts`; `--project unidade packages/shared/src/sistema`.
- Armadilha: `packages/shared` é tronco; nada dele corre em paralelo.

## Fora do escopo desta tarefa

O worker e o despachante (19.0); o `prazoMs` (onda 3).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A caracterização dos 8 tipos (18.1) entra no commit da tarefa, e não num commit antes. | O hook só aceita commit com código, e um commit só de teste pediria portão e revisão duas vezes (mesma regra da 14.0 e da 51.0). O teste foi escrito e passou contra o código antigo antes da migração. | `onda-1b.md` §2 "T4 — Registro de jobs", "Como a 18.0 ficou" |
| `BancadaDeFila.enfileirar` (`fila-de-teste.ts`) grava pelo repository, sem passar pela definição. | Os testes do despachante e do worker enfileiram tipos de teste e `dados.rotulo`, que a definição recusaria. A 19.0 troca isso pela definição injetável. | `onda-1b.md` §2 T4, "19.0, no worker" (a definição é injetável) e "Como a 18.0 ficou" |
| `definirJob` confere em execução que o esquema é estrito, além do tipo. | No zod 4, `z.object()` e `z.strictObject()` têm o mesmo tipo: só o esquema "frouxo" (`looseObject`, `.catchall()`) é barrado na compilação. | `onda-1b.md` §2 T4, "Como a 18.0 ficou"; `techspec.md` §6 |
| Os casos de "não compila" são `@ts-expect-error` provados pelo `tsc` do portão, sem bloco de mutação. | O vitest não checa tipo, e a mutação só roda o vitest; o `tsc` falha se o `@ts-expect-error` não tiver erro a esconder. | `onda-1b.md` §2 T4, "Como a 18.0 ficou" |
| `PedidoDeJobRecusado` não é `ErroDeDominio`: lança com motivo fixo, sem `issues` nem valor, e responde 500. | É defeito de quem enfileirou (código), e não escolha do usuário; mensagem sem dado cumpre a regra 20, item 9. | `techspec.md` §7; `onda-1b.md` §2 T4, "Como a 18.0 ficou" |
| `prazoMs` e retentativa de cada tipo são os de hoje, provisórios. | O `prazoMs` só é aplicado na onda 3 (43.0, que o confere); a retentativa é a de `OPCOES_DE_JOB_PUBLICADO` até a 19.0 ligar uma à outra (o teste de `tools/guardas` as mantém iguais). | `onda-1b.md` §2 T4, "O `prazoMs`" e "Como a 18.0 ficou" |
| `enfileirarUmaVez` ficou `(tx, tipo, dados, chave, ...opcoes)`, e o `PedidoDeJob` saiu do nucleo. | O pedido virou os três argumentos tipados pelo registro; os erros de escopo do repository seguem como estavam (mesmo texto). | `onda-1b.md` §2 T4, "18.0, ao enfileirar" (`enfileirarUmaVez` idem) |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/api/test/jobs-sinteticos.int.test.ts › o corpo escolhe a fila e o não urgente
- const fila = opcoes?.fila ?? definicao.filas[0]
+ const fila = definicao.filas[0]
```

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/worker/test/execucao.int.test.ts › a fila vem do pedido só dentro das filas
  const fila = opcoes?.fila ?? definicao.filas[0]
- if (!definicao.filas.includes(fila)) throw new PedidoDeJobRecusado(tipo, MotivoDaRecusaDoJob.FILA_FORA_DA_DEFINICAO)
```

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/worker/test/execucao.int.test.ts › chave a mais no payload
  const lidos = definicao.dados.safeParse(dados)
- if (!lidos.success) throw new PedidoDeJobRecusado(tipo, MotivoDaRecusaDoJob.DADOS_INVALIDOS)
```

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/worker/test/execucao.int.test.ts › o escolaId de outra escola no payload
- const lidos = definicao.dados.safeParse(dados)
+ const lidos = definicao.dados.strip().safeParse(dados)
```

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/worker/test/execucao.int.test.ts › a recusa não leva o valor
  const lidos = definicao.dados.safeParse(dados)
- if (!lidos.success) throw new PedidoDeJobRecusado(tipo, MotivoDaRecusaDoJob.DADOS_INVALIDOS)
+ if (!lidos.success) throw new Error(lidos.error.message)
```

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/worker/test/execucao.int.test.ts › a recusa não leva o valor
  const lidos = definicao.dados.safeParse(dados)
- if (!lidos.success) throw new PedidoDeJobRecusado(tipo, MotivoDaRecusaDoJob.DADOS_INVALIDOS)
+ if (!lidos.success) throw Object.assign(new PedidoDeJobRecusado(tipo, MotivoDaRecusaDoJob.DADOS_INVALIDOS), { cause: lidos.error })
```

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/worker/test/execucao.int.test.ts › a recusa chega como promessa rejeitada
- async enfileirar<Tipo extends TipoDeJob>(tx: TransacaoBanco, tipo: Tipo, dados: DadosDoJob<Tipo>, ...opcoes: ArgumentosDeOpcoes<Tipo>): Promise<string> {
+ enfileirar<Tipo extends TipoDeJob>(tx: TransacaoBanco, tipo: Tipo, dados: DadosDoJob<Tipo>, ...opcoes: ArgumentosDeOpcoes<Tipo>): Promise<string> {
```

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/worker/test/execucao.int.test.ts › a recusa chega como promessa rejeitada
- async enfileirarUmaVez<Tipo extends TipoDeJob>(
+ enfileirarUmaVez<Tipo extends TipoDeJob>(
```

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/worker/test/execucao.int.test.ts › o não urgente de quem pede só vale onde
  if (definicao.naoUrgente !== 'do-pedido') {
- if (opcoes?.naoUrgente !== undefined) throw new PedidoDeJobRecusado(tipo, MotivoDaRecusaDoJob.NAO_URGENTE_FIXO)
  return definicao.naoUrgente
```

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/worker/test/execucao.int.test.ts › o tipo que deixa o não urgente com quem pede o exige
- if (opcoes?.naoUrgente === undefined) throw new PedidoDeJobRecusado(tipo, MotivoDaRecusaDoJob.NAO_URGENTE_AUSENTE)
  return opcoes.naoUrgente
```

```mutacao
arquivo: packages/nucleo/src/fila/enfileirador.ts
teste: apps/worker/test/eliminar-titular.int.test.ts › o payload inválido de
- return this.repositorio.inserirUmaVez(tx, linhaDoPedido(tipo, dados, opcoes[0]), chaveIdempotencia)
+ return this.repositorio.inserirUmaVez(tx, { tipo, fila: 'lote', prioridade: 3, dados, naoUrgente: true }, chaveIdempotencia)
```

```mutacao
arquivo: packages/shared/src/sistema/definicoes-de-job.ts
teste: packages/shared/src/sistema/definicoes-de-job.test.ts › recusa, ao carregar
- if (!esquemaRecusaChaveAMais(definicao.dados)) throw new TypeError('os dados de um job são um objeto estrito: use z.strictObject ou .strict()')
  return definicao
```

```mutacao
arquivo: packages/shared/src/sistema/definicoes-de-job.ts
teste: packages/shared/src/sistema/definicoes-de-job.test.ts › recusa, ao carregar
  function esquemaRecusaChaveAMais(esquema: EsquemaDosDadosDoJob): boolean {
- return esquema._zod.def.catchall?._zod.def.type === 'never'
+ return true
```

```mutacao
arquivo: packages/shared/src/sistema/jobs-sinteticos.ts
teste: packages/shared/src/sistema/jobs-sinteticos.test.ts › recusam chave a mais
    efeito: z.boolean().optional(),
  })
- .strict()
```

```mutacao
arquivo: packages/shared/src/sistema/definicoes-de-job.ts
teste: apps/worker/test/execucao.int.test.ts › caracterização
  [TIPO_MONTAR_ARQUIVO]: definirJob({
- filas: ['normal'],
+ filas: ['lote'],
```

```mutacao
arquivo: packages/shared/src/sistema/definicoes-de-job.ts
teste: packages/shared/src/sistema/definicoes-de-job.test.ts › o escopo é
  [TIPO_EXPURGAR_ESCOLA]: definirJob({
  filas: ['lote'],
- escopo: 'escola',
+ escopo: 'sistema',
```

```mutacao
arquivo: packages/shared/src/sistema/definicoes-de-job.ts
teste: tools/guardas/definicoes-de-job.test.ts › toda fila de toda definição
  [TIPO_JOB_SINTETICO]: definirJob({
- filas: ['interativa', 'normal', 'lote'],
+ filas: ['interativa', 'normal', 'lote', 'urgente'],
```

```mutacao
arquivo: packages/shared/src/sistema/definicoes-de-job.ts
teste: apps/worker/test/execucao.int.test.ts › campo obrigatório ausente
- const esquemaDoPedido = z.strictObject({ pedidoId: z.uuid() })
+ const esquemaDoPedido = z.strictObject({ pedidoId: z.uuid().optional() })
```

```mutacao
arquivo: packages/shared/src/sistema/definicoes-de-job.ts
teste: apps/worker/test/execucao.int.test.ts › o pedidoId que não é um uuid
- const esquemaDoPedido = z.strictObject({ pedidoId: z.uuid() })
+ const esquemaDoPedido = z.strictObject({ pedidoId: z.string() })
```

```mutacao
arquivo: packages/shared/src/sistema/definicoes-de-job.ts
teste: tools/guardas/definicoes-de-job.test.ts › nenhum esquema do registro
- const semDados = z.strictObject({})
+ const semDados = z.strictObject({ nomeDoAluno: z.string().optional() })
```

```mutacao
arquivo: packages/shared/src/sistema/definicoes-de-job.ts
teste: tools/guardas/definicoes-de-job.test.ts › a retentativa de todo tipo
- const RETENTATIVA_DE_HOJE: RetentativaDeJob = { tentativas: 5, recuoMs: 2_000, jitter: 0.5 }
+ const RETENTATIVA_DE_HOJE: RetentativaDeJob = { tentativas: 3, recuoMs: 2_000, jitter: 0.5 }
```

```mutacao
arquivo: apps/worker/src/processadores/expurgar-jobs.ts
teste: tools/guardas/definicoes-de-job.test.ts › o worker não declara constante
  import type { Processador } from '../executor.js'
- import { FalhaDeJob } from '../falha-de-job.js'
+ import { FalhaDeJob } from '../falha-de-job.js'
+ export const TIPO_EXPURGAR_JOBS = 'sistema.expurgar-jobs'
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.service.ts
teste: apps/api/test/pedido-titular.int.test.ts › o job que a definição recusa desfaz a transação
- if (geraArquivo) await this.dependencias.enfileirador.enfileirar(tx, TIPO_MONTAR_ARQUIVO, { pedidoId: registrado.id })
+ if (geraArquivo) await this.dependencias.enfileirador.enfileirar(tx, TIPO_MONTAR_ARQUIVO, { pedidoId: registrado.id }).catch(() => undefined)
```

```mutacao
arquivo: apps/api/src/sistema/jobs-sinteticos.service.ts
teste: apps/api/test/jobs-sinteticos.int.test.ts › o corpo escolhe a fila e o não urgente
- { fila: pedido.fila, naoUrgente: pedido.naoUrgente }
+ { fila: pedido.fila, naoUrgente: false }
```

```mutacao
arquivo: apps/worker/src/agendamentos.ts
teste: apps/worker/test/uso.int.test.ts › o disparo grava o job da rotina em job_registro
  const agendamento = agendamentos.find(({ tipo }) => tipo === job.name)
- if (agendamento === undefined) return Promise.reject(new UnrecoverableError('agendamento desconhecido'))
```

```mutacao
arquivo: packages/nucleo/src/fila/job-registro.repository.ts
teste: apps/worker/test/execucao.int.test.ts › job de escola sem escola no contexto
  const doSistema = linha.tipo.startsWith(PREFIXO_TIPO_SISTEMA)
- if (!doSistema && contexto?.escolaId === undefined) throw new Error('job de escola sem escola no contexto')
```

```mutacao
arquivo: packages/nucleo/src/fila/job-registro.repository.ts
teste: apps/worker/test/expurgo-da-escola.int.test.ts › a mesma chave ao mesmo tempo
- .onConflictDoNothing({
- target: [jobRegistro.escolaId, jobRegistro.tipo, jobRegistro.chaveIdempotencia],
- where: sql`chave_idempotencia is not null and estado not in ('concluido', 'falhou')`,
- })
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | `chavesPessoaisDe` olha só o primeiro nível (`esquema.shape`); descer recursivamente quando um tipo trouxer objeto ou array de objetos | `TODO.md`: linha escrita no commit da tarefa, para a tarefa da onda 3 que trouxer o primeiro payload aninhado (toca `tools/guardas/definicoes-de-job.test.ts`) |
| privacy-guardian (1ª) | `BancadaDeFila.enfileirar` grava pelo repository sem a definição; conferir na 19.0 que nada fora de `test/` usa `JobRegistroRepository.inserir` direto | `19_task.md`, subtarefa 19.3 (definição injetável em `fila-de-teste.ts`); a conferência do uso direto vai com ela |
| privacy-guardian (1ª) | Teste HTTP de que o corpo do 500 de `PedidoDeJobRecusado` não traz `message` nem `stack` | `TODO.md`: linha escrita no commit da tarefa (o filtro geral de erro já existia e esta tarefa não o altera) |
| tenancy-guardian (1ª) | `contar()` do `describe('enfileirar')` filtrar por `escola_id` | Recusada: a linha de job `sistema.*` não tem `escola_id`, e o caso `sistema.*` recusado (`execucao.int.test.ts`, "job de escola sem escola no contexto, e job de sistema…") precisa ver a tabela inteira; o `limparRegistro` do `beforeEach` isola o arquivo |
| tenancy-guardian (1ª) | O campo `escopo` da definição não é lido em execução; a repository decide pelo prefixo `sistema.` | `19_task.md`: a linha "Linha `sistema.*` com `escola_id` (por SQL) não roda" confere o escopo da definição no executor |
| revisor-geral (1ª) | Os dois `esquemaDoJob` do worker (`montar-arquivo.ts`, `eliminar-titular.ts`) repetem `esquemaDoPedido`; a 19.0 deve apagá-los | `19_task.md`, subtarefa 19.2 (o executor valida pela definição) |
| revisor-geral (1ª) | `PedidoDaBancada.tipo?: string` aceita qualquer texto; voltar a tipar com a definição injetável | `19_task.md`, subtarefa 19.3 |
| test-engineer (1ª) | Caso que distingue gravar `lidos.data` do payload original (hoje nenhum esquema tem `default` nem `transform`) | `TODO.md`: linha escrita no commit da tarefa, para quando o primeiro esquema com `default` ou `transform` entrar |
| test-engineer (1ª) | A mutação do `agendamentos.ts` fica vermelha por `TypeError` ao desestruturar, e não pela mensagem `'agendamento desconhecido'` | Recusada: o bloco exige vermelho e fica vermelho; o próprio revisor diz que não muda o veredito |
| tenancy-guardian (2ª) | `contar()` do `describe('enfileirar')` filtrar por `escola_id` se a tabela passar a ser compartilhada | Recusada, como na 1ª rodada: a linha `sistema.*` não tem `escola_id`, e o `limparRegistro` do `beforeEach` isola o arquivo |
| revisor-geral (2ª) | No caso novo de `execucao.int.test.ts`, trocar `pedido ?? Promise.resolve()` por leitura direta | Recusada: o próprio revisor diz que, se a chamada lançar na hora, quem falha é o `expect(...).not.toThrow()`, com a falha certa |
| test-engineer (2ª) | Comentário de uma linha dizendo que `chamar()` roda duas vezes na mesma transação | Recusada: hoje a recusa vem antes de qualquer consulta ao banco; quem passar a validar com leitura do banco reescreve o caso |
| revisor-geral (2ª) e test-engineer (2ª) | As três linhas novas do `TODO.md` saíram sem a caixa `- [ ]` | Aplicada: a caixa `- [ ]` está nas três linhas, no commit da tarefa |

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
| 2026-10-22 13:53:35 | 2026-10-22 13:54:16 | `privacy-guardian` | 1 | APROVADO | aa2678c734d7c8f30 |
| 2026-10-22 13:53:31 | 2026-10-22 13:54:28 | `tenancy-guardian` | 1 | APROVADO | a5a37c2bdd9fd8fea |
| 2026-10-22 13:53:44 | 2026-10-22 13:54:51 | `revisor-geral` | 1 | APROVADO | a4a3489c7c0eae36e |
| 2026-10-22 13:53:40 | 2026-10-22 13:55:59 | `test-engineer` | 1 | APROVADO | a32e732ff4bb89ded |
| 2026-10-22 14:06:33 | 2026-10-22 14:06:51 | `tenancy-guardian` | 2 | APROVADO | a26e8a194f302d953 |
| 2026-10-22 14:06:41 | 2026-10-22 14:07:01 | `privacy-guardian` | 2 | APROVADO | a2950c0711a1ecb16 |
| 2026-10-22 14:06:57 | 2026-10-22 14:07:18 | `revisor-geral` | 2 | APROVADO | a256f9516959db2fb |
| 2026-10-22 14:06:50 | 2026-10-22 14:07:32 | `test-engineer` | 2 | APROVADO | aafbf1b6c23faa987 |
