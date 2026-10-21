# Tarefa 8.0 — A IA tira a escola do contexto, com teste de isolamento

**Funcionalidade:** reengenharia · **Depende de:** 7.0 (a mesma lista)
**Subagentes obrigatórios:** `tenancy-guardian`, `infra-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Suspensão, orçamento e consumo de IA leem a escola do contexto, não do argumento; sem ela, a porta recusa antes do modelo.

## Contexto necessário

- `onda-1a.md` §2, "T6", "A IA pelo contexto (8.0)"; `techspec.md` §6 e §8; `prd.md` RF9
- Regras 10.3 e 30
- `packages/nucleo/src/ia/suspensao.ts` e `consumo.ts`: as três portas
- `packages/nucleo/src/ia/provedor.ts:101`: a conferência de `pedido.escolaId` **fica**; o "sem contexto passa" muda
- `apps/api/src/ia/orcamento.repository.ts:41`: o `permitido: true` antes de ler a escola
- Chamadores: `agendador-de-execucoes.ts:78`, `conferencia-de-funcao.ts:15`, `tutor.service.ts:175`, `:191`, `:341`, `:384`

## Subtarefas

- [ ] 8.1 — As três portas perdem `escolaId`, e os repositories usam `exigirEscolaDoContexto()`, no orçamento antes
  do retorno antecipado
- [ ] 8.2 — Os chamadores não passam a escola; `SuspensoesEmMemoria` lê o contexto
- [ ] 8.3 — `ia/consumo`, `ia/orcamento` e `ia/suspensao` saem de `REPOSITORIES_SEM_ESCOPO`
- [ ] 8.4 — Testes: isolamento por porta, sem contexto, concorrência e o tipo

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/{suspensao,consumo,provedor}.ts`, `provedor.test.ts` | alterado |
| `apps/api/src/ia/{consumo,orcamento,suspensao}.repository.ts` | alterado |
| `apps/api/src/ia/{conferencia-de-funcao,agendador-de-execucoes}.ts` | alterado |
| `apps/api/src/ia/ia.int.test.ts` | alterado |
| `apps/api/src/tutor/tutor.service.ts` | alterado |
| `tools/guardas/escopo-dos-repositories.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| `SuspensaoRepository`: suspensa em B; em A, ativa | integração | isolamento | tirar `eq(suspensaoDeFuncao.escolaId, …)` |
| Orçamento: perguntas de aluno de B não contam em A | integração | isolamento do freio | tirar `eq(mensagemTutor.escolaId, …)` |
| Limite 1 em A e 3 em B: em A, a 2.ª é recusada | integração | o limite da escola | tirar `eq(configuracaoOperacionalEscola.escolaId, …)` |
| Em A, turma de B com 30 alunos não infla o pacote (novo) | integração | a turma é da escola | tirar `eq(vinculo.escolaId, …)` |
| Consumo: em A grava em A, e B não ganha linha | integração | fica com quem gastou | gravar a escola do registro |
| Sem escola, cada porta lança antes do banco | integração | fail-closed | `exigir…` vira `contextoAtual()?.escolaId` |
| `consultar` sem contexto, função que não é o Tutor, lança | integração | `exigir` antes do `permitido: true` | movê-lo para depois |
| `gerar` sem contexto: `IA_INDISPONIVEL`, sem adaptador nem consumo (**muda** `provedor.test.ts:312`) | unidade | sem escola, não executa | a suspensão falsa responder `false` sem contexto |
| Contexto A, pedido de B: `IA_ENTRADA_INVALIDA` antes de consultar | unidade | `provedor.ts:101` fica | apagar o `if` |
| O Tutor recusa a 61.ª troca, sem passar `escolaId` | integração | produção usa o contexto | nenhuma |
| A execução depois do 202 grava na escola de quem pediu | integração | fora da requisição | rodar fora de `executarNoContexto` |
| Concorrência (novo): `Promise.all` de turnos em A e B nas mesmas instâncias | integração | cada consumo na sua escola | ler a escola no construtor |
| `@ts-expect-error` com `escolaId` nas três portas | tipos | não volta | devolvê-lo à assinatura |
| As três fora de `REPOSITORIES_SEM_ESCOPO` | unidade | a trava cobre | o argumento de volta |
| Mantido: suspensa recusa antes de gravar | integração | caracterização | nenhuma |
| Mantido: sem consultar a suspensão, não executa | unidade | idem | nenhuma |
| Mantido: sem consultar o orçamento, não gasta | unidade | idem | nenhuma |
| Mantido: consumo de A não aponta para execução de B | integração | idem | nenhuma |

Carga: uma leitura do `AsyncLocalStorage` a mais. Log novo: nenhum.

## Como testar

- `apps/api/src/ia/ia.int.test.ts › função suspensa em B: suspensa em B, ativa em A…` e `› A e B com limites diferentes…`:
  envolva cada chamada em `executarNoContexto`
- Reescreva `packages/nucleo/src/ia/provedor.test.ts › com a escola do contexto, o pedido passa; sem contexto…`; o
  vizinho `› com contexto da escola A, o pedido em nome da escola B é recusado…` fica
- Isolado: `npx vitest run --project integracao apps/api/src/ia/ia.int.test.ts` (e `--project unidade` no `provedor.test.ts`)

## Fora do escopo desta tarefa

`ia/execucao` (na lista até a 47.0) e a onda 3.

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

