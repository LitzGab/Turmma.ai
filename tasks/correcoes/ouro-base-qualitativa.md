# Correção — a base de `saidaQualitativa` continua nula depois da 3.0, e o `ouro.test.ts` inteiro fica vermelho

**Origem:** a spec em `95f70a3`: a 3.0 está `[x]`, e o `lerMedidas()` do topo do `packages/nucleo/src/ia/ouro.test.ts` recusa o arquivo. Ordem do Arquiteto em `.processo/ordens/correcao-ouro-base-qualitativa.md`.
**Subagentes obrigatórios:** `test-engineer`, `llm-integrator`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. -->

## Sintoma

`MEDIDAS.saidaQualitativa.base` é `null` e `semBaseAte` é `"3.0"`. Com a 3.0 fechada, `lerMedidas()` recusa o arquivo
(`saidaQualitativa: a tarefa 3.0 já fechou e a base continua nula`) e os testes do `ouro.test.ts` ficam todos vermelhos.

## Fora desta correção

Nada: a árvore estava limpa. A 6.0 (`tasks/prd-reengenharia/6_task.md`) só começa depois deste commit. Também fica de fora
comparar a medida de hoje com a base (um `it` "não cai da base", como o de `saidaComNota`): é a próxima mudança de regra do
`ouro.test.ts`.

## Causa

A 1.0 pôs a trava de propósito: a base de `saidaQualitativa` nasce depois da 3.0, que fez o juízo sobre texto de aluno
barrar a saída. A 3.0 fechou sem a base gravada. Com a base gravada pelo Arquiteto, três testes do `ouro.test.ts` que leem
o `MEDIDAS` real supondo a base nula deixam de provar o que dizem (`base nula sem semBaseAte é recusada`, `base nula
depois da tarefa de semBaseAte fica vermelha, e antes dela não` e `lerMedidas lê a lista de tarefas três pastas acima do
ouro`).

## Teste que reproduz

`packages/nucleo/src/ia/ouro.test.ts` inteiro, vermelho hoje pelo `lerMedidas()` do topo, na ponta da spec (`95f70a3`).

## Correção

A base de `saidaQualitativa` (54 das 58 positivas barradas, nenhuma das 41 legítimas; recall 0,931, precisão 1) e o
`SELO.json` são do Arquiteto e entraram na spec em `256fb62` (`ouro: saidaQualitativa`); esta correção os recebe por merge e
não toca neles. O que ela leva é só o `ouro.test.ts`, nos três casos que supunham a base nula no arquivo real:

- `base nula sem semBaseAte é recusada` e `base nula depois da tarefa de semBaseAte fica vermelha, e antes dela não`:
  antes de estragar o resto, `base = null` no `MEDIDAS` bruto, que é o que eles sempre quiseram provar.
- `lerMedidas lê a lista de tarefas três pastas acima do ouro`: a cópia do `ouro` que o caso fabrica ganha a base nula
  (`repositorioFabricado`), que é o que a lista com a 3.0 marcada recusa.

Os três continuam provando a mesma regra.

## Mutações

Nenhuma cláusula nova: o diff é a preparação de três testes que já existem. A mutação de `1_task.md` (`:233` e `:324`)
segue deixando os dois primeiros vermelhos.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª), llm-integrator (1ª), test-engineer (2ª) | Um `it` "`saidaQualitativa` não cai da base", como o de `saidaComNota` | Já declarada em "Fora desta correção": é a próxima mudança de regra do `ouro.test.ts`; muda comportamento do arquivo. O Orquestrador a leva ao `/validar` e ao `/retro` |
| llm-integrator (1ª) | `aponta_erros` em 8/12, a categoria mais fraca da `saidaQualitativa` | `TODO.md`, linha 18, já registra o `aponta_erros` do `ouro`; recusada como duplicata |
| test-engineer (2ª) | Conferir também o texto do erro (`a tarefa 3.0 já fechou e a base continua nula`) nas duas recusas da base nula | Recusada: o lado de controle de cada caso já isola o motivo, e o revisor disse que não bloqueia |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 11:39:35 | 2026-10-22 11:39:48 | `llm-integrator` | 1 | APROVADO | a8515cf1ae7ab6aa9 |
| 2026-10-22 11:39:35 | 2026-10-22 11:40:33 | `test-engineer` | 1 | APROVADO | a8d983787fb4d042c |
| 2026-10-22 11:48:50 | 2026-10-22 11:49:21 | `test-engineer` | 2 | APROVADO | a30c6a344baddcfd4 |
