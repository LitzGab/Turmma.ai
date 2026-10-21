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

- [ ] 19.1 — Caracterização, num commit antes: as opções de publicação como literal
- [ ] 19.2 — `Processador<T>` tipado; o executor valida e falha com `DADOS_INVALIDOS`, definitivo
- [ ] 19.3 — `opcoesDeJob(tipo)` e `nomeDaFilaBullMQ(fila, executor)`, com a definição injetável em `fila-de-teste.ts`
- [ ] 19.4 — `montagem.test.ts`: tipo ↔ processador ↔ réplica da fila
- [ ] 19.5 — Testes: os da tabela

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
| Carac.: publica `attempts: 5`, `backoff` exponencial de 2.000 ms, jitter 0,5, em literal | unidade (`fila-de-publicacao.test.ts:32`) | igual a hoje | `tentativas: 4` no sintético |
| Definição injetada com `tentativas: 2` publica `attempts: 2` | integração (`vagas.int.test.ts`) | a retentativa é do tipo | publicar sempre as do sintético |
| `dados` recusados: `falhou`/`DADOS_INVALIDOS`, sem processador | integração | o worker não confia na gravação | tirar a validação do executor |
| `DADOS_INVALIDOS` não gasta tentativas | unidade | definitivo | `new FalhaDeJob(DADOS_INVALIDOS, false)` |
| Tipo sem definição termina `TIPO_DESCONHECIDO` | integração | §3 | validar antes de procurar a definição |
| O payload de hoje de cada tipo passa | unidade | regra 80.9 | campo novo obrigatório |
| Log e `failedReason` só com `jobId`, `tentativa` e código | integração | regra 20.9 | `FalhaDeJob` com a mensagem do zod |
| O processador recebe o `prazoMs` da definição | unidade (`executor.test.ts:91`) | o prazo chega | `prazoMs` fixo |
| `Processador<'titular.montar-arquivo'>` que lê campo inexistente não compila | unidade (tsc) | tipado pela definição | `Record<string, unknown>` |
| Linha `sistema.*` com `escola_id` (por SQL) não roda | integração | o escopo da definição se confere | tirar a conferência |
| Isolamento: job da escola A apontando para a linha da B não roda, e a da B fica intacta | integração (`execucao.int.test.ts:213`) | valida depois da leitura com escopo | validar pela linha lida sem escopo |
| Concorrência: a mesma linha entregue duas vezes em paralelo roda uma vez | integração (`reexecucao.int.test.ts`) | um caminho só | `iniciarExecucao` sem condição de estado |
| Todo tipo `executor: 'worker'` tem processador na réplica de cada fila | unidade (`montagem.test.ts`) | sem job órfão | tirar `sistema.expurgar-acesso` de `montarRotinas` |
| Todo processador montado tem definição na sua fila | unidade | o inverso | `'sistema.fantasma'` em `montarRotinas` |
| `titular.montar-arquivo` só na `normal`, rotinas só na `lote`, sintético nas três | unidade | fila = réplica | `montar-arquivo` também na `lote` |
| `executor: 'api'` vai para a fila `api`: o worker não a recebe | integração | a IA da onda 3 fora do worker | ignorar o `executor` |
| `nomeDaFilaBullMQ(fila, 'worker')` é o nome de hoje | unidade | job antigo segue consumido | prefixar o `worker` |

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

