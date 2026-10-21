# Tarefa 3.0 — Julgamento de texto de aluno é barrado na entrada e na saída, e a rubrica passa

**Funcionalidade:** reengenharia · **Depende de:** 1.0 (e o `MEDIDAS.json`)
**Subagentes obrigatórios:** `conformidade-reviewer`, `llm-integrator`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O Assistente deixa de entregar devolutiva qualitativa sobre texto de aluno, na entrada e na saída, sem barrar rubrica nem lote.

## Contexto necessário

- `onda-0.md` §2.1, §2.3 e §3 (linha RF2)
- `techspec.md` §7b e §8; `prd.md` RF2; `docs/aia/ouro/README.md` (decisões 10 a 13)
- Regras 70 (item 2a) e 30 (itens 6 e 7); D55
- Código: `packages/nucleo/src/ia/tarefas/propor-ferramenta.ts` (:64, :134-189, :248, :286, :392-398);
  `packages/nucleo/src/ia/provedor.ts:186-215`; `tarefa.ts:86`

## Subtarefas

- [ ] 3.1 — `julgaTextoDeAluno(texto, conversaTrazTextoDeAluno)`, no `conferir`, nos dois tipos de saída
- [ ] 3.2 — `conversaPedeJulgamentoDeTextoDeAluno` ao alvo, com uma `dev` por forma que escapa
- [ ] 3.3 — `reservaQuandoInvalida` só quando a última reprovação foi da D55; o prompt sobe a `versao`
- [ ] 3.4 — `ouro.test.ts` liga `saidaQualitativa` e `julgamentoDeTextoDeAluno`
- [ ] 3.5 — Testes: as chaves, a reserva, o alvo

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/tarefas/propor-ferramenta.ts` | alterado |
| `packages/nucleo/src/ia/prompts/propor-ferramenta.ts` | alterado |
| `packages/nucleo/src/ia/provedor.ts`, `packages/nucleo/src/ia/tarefa.ts` | alterados, se a reserva precisar do motivo |
| `packages/nucleo/src/ia/tarefas/numeros.test.ts` | alterado |
| `packages/nucleo/src/ia/ouro.test.ts` | alterado |

## Testes que provam a regra

Caracterização: `numeros.test.ts:149-306`, `assistente.int.test.ts:418`, `:435`, `:449`. **Mudança
declarada:** `numeros.test.ts:227`, primeira metade, passa à recusa ("a Bia" na conversa).

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Saída que julga texto concreto, com texto de aluno, barra | unidade | `julgaTextoDeAluno` devolve `false` |
| Juízo sem texto de aluno (rubrica, critério) passa | unidade | ignorar `conversaTrazTextoDeAluno` |
| Texto de aluno e saída que não julga (lote, correção cega) passa | unidade | devolver só `conversaTrazTextoDeAluno` |
| "coesão é um critério" passa; "o parágrafo 2 está sem coesão" barra | unidade | barrar só pelo juízo |
| Cada marca de `:134-189` sozinha conta como texto de aluno | unidade, uma `dev` por marca | tirar cada marca (um bloco cada) |
| Texto de aluno num turno anterior conta | unidade | olhar só `entrada.mensagem` |
| `rubrica_sob_medida` barra (decisão 12) | unidade | exigir "seu texto" |
| Agrupar o lote pelo tema passa; fuga ao tema e ranque barram (decisão 10) | unidade, uma `dev` cada | barrar "tema"; tirar o de fuga; tirar o de ranque |
| `conferir` confere `texto` e `proposta_de_ferramenta` | unidade | conferir só `texto` |
| `saidaQualitativa`: recall ≥ 0,90 | unidade, `ouro.test.ts` | tirar um ramo de juízo |
| `saidaQualitativa`: nenhuma legítima barrada | unidade | devolver `conversaTrazTextoDeAluno` |
| Duas saídas julgadoras: a final é a recusa, com 2 chamadas | unidade | tirar `reservaQuandoInvalida` |
| A recusa passa nas duas conferências e no `validar` | unidade | recusa que julga ("falta coesão") |
| JSON quebrado duas vezes segue `IA_SAIDA_INVALIDA` | unidade | reserva sem `reprovadaNaConferencia` |
| Citação inválida duas vezes, sem texto de aluno, segue `IA_SAIDA_INVALIDA` | unidade | reserva sem condição |
| Consumo e log da reserva sem texto colado nem saída | unidade, logger espião | `saida.texto` em `ia.geracao.reserva` |
| Entrada: as `dev` de `nota` e `julgamento_direto` são recusadas | unidade | tirar o padrão de cada forma |
| Entrada: rubrica com texto colado antes é recusada; sem texto, passa | unidade | não olhar os turnos; tirar a exceção de `PEDE_RUBRICA` (`:205`) |
| Entrada: "o enunciado da questão 1 mais curto" depois de texto colado passa; "isso mais curto" barra | unidade | tirar `DO_PROPRIO_PROFESSOR`; tirar a referência |
| `julgamentoDeTextoDeAluno`: recall ≥ 0,95 sem `medidoSem` | unidade, `ouro.test.ts` | tirar um padrão novo; não filtrar |
| `semCasar` não casa, e `naoCairDaBase` não cai | unidade | `/\bnota\b/` solto |
| `ouro` intocado: `git log <início>..HEAD -- docs/aia/ouro` vazio, selo verde | veto | — |

Sem isolamento nem concorrência. O teste imprime a fração barrada (premissa de 5 %, `techspec.md` §8).

## Como testar

- Copie `numeros.test.ts › o modelo que tenta dar nota duas vezes não tem nada entregue;
  o que corrige na repetição entrega a resposta sem nota`: `provedorCom(new AdaptadorRoteirizado([…]))`,
  `entradaDoAssistente` e `insistente.correcoes`
- Amostras: `numeros.test.ts › a regra, olhando a conversa, acerta a taxa declarada, e o teste diz quais errou`
- Rodar: `npx vitest run --project unidade packages/nucleo/src/ia/tarefas/numeros.test.ts packages/nucleo/src/ia/ouro.test.ts`
- Armadilhas: a recusa não julga texto; as `dev` não repetem o `ouro`; nunca mexa em `docs/aia/ouro/`

## Fora do escopo desta tarefa

O Tutor sob a D55 (`TODO.md`); `conformidade/` (27.0); o hash do prompt (42.0).

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

