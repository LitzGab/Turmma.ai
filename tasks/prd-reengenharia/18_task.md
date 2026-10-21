# Tarefa 18.0 — Payload inválido é recusado ao enfileirar, e tipo sem definição não compila

**Funcionalidade:** reengenharia · **Depende de:** 14.0
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

- [ ] 18.1 — Caracterização, num commit antes, dos 8 tipos
- [ ] 18.2 — `DEFINICOES_DE_JOB` em `packages/shared/src/sistema/definicoes-de-job.ts`, com as constantes `TIPO_*`; o sintético `.strict()`
- [ ] 18.3 — `enfileirar` e `enfileirarUmaVez` validam antes de gravar; os chamadores migram
- [ ] 18.4 — Testes: os da tabela

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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

