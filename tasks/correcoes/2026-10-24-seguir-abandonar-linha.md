# Correção — nenhum passo do `/seguir` ensina `linhas.ts abandonar`, que o RF6 entregou

**Origem:** validacao.md de harness, achado M1 (`tasks/prd-harness/validacao.md`, linha do RF6).
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
<!-- O PEDIDO do Orquestrador não ditou guardião. O `test-engineer` é de toda correção. O `revisor-geral` entra porque a correção altera `tools/processo/` (passo 5 de `corrigir`). -->

## Sintoma

O RF6 pede que uma linha se solte por comando, e `node tools/processo/linhas.ts abandonar <n>` existe e é provado
(`linhas.test.ts`). Mas nenhum passo do `/seguir` o menciona nem diz quando usá-lo: o Orquestrador que encontra uma linha
presa (tarefa replanejada, papel morto, abertura que morreu) não tem como saber que o comando existe. A única citação está
na mensagem de erro do próprio `linhas.ts`, que só aparece em dois casos de abertura.

## Fora desta correção

Nada além do passo 6 do `/seguir` e do teste que o lê. `linhas.ts` não muda. A árvore estava limpa.

## Causa

A 5ª tarefa entregou o comando e o teste de comportamento, e a lista de "o que pode chegar" do passo 6 nunca ganhou a
situação correspondente. O `6-tarefa.md` estava a 33 B do teto do RF26 (24.000 B para `SKILL.md`, `protocolo.md` e
`6-tarefa.md`), de modo que acrescentar a linha exigiu tirar texto de lá.

## Teste que reproduz

`tools/processo/harness/seguir.test.ts` › `o passo 6 se basta (RF26)` › `sem o comando que solta a linha presa (RF6): vermelho`
(entrada nova em `OBRIGATORIOS_NO_PASSO_6`, que a conferência `passoDaTarefa` e o `it.each` já cobrem). Com o `6-tarefa.md` do
`HEAD` (sem a linha) 18 testes ficam vermelhos, entre eles `o repositório de hoje passa` e `as cinco conferências juntas`;
com o texto novo, os 102 passam.

## Correção

`passos/6-tarefa.md`: um item em "O que pode chegar", **Linha presa** (tarefa replanejada, papel morto):
`(cd <andar> && node tools/processo/linhas.ts abandonar <n>)` solta a linha e a tarefa volta a pendente; a branch e o checkout
ficam, e a próxima partida exige a árvore limpa e nenhum commit que a spec não tenha. Na abertura que morreu o comando faz
outra coisa (`linhas.ts:569`): tira a linha do quadro, e ela se abre de novo com `abrir`. O item diz as duas.

Para caber no teto, foram encurtados, **sem tirar ordem**: o parágrafo da fila de carga, a conferência de reinício, o exemplo da
retomada, a primeira falha, o "antes de seguir" do `O PUSH FALHOU`, o "Leia o motivo" da falha, o comentário do `abrir`,
a explicação do que o terminal mantém no reinício, "A resposta chega a uma sessão que só tem o diário" (repete o item 6) e uma
oração do veredito da esteira. Na rodada 1 os revisores acharam quatro cortes que **tiravam** instrução, e eles voltaram:
o "uma vez" do `maestri check`, o "um por vez" do ambiente 0, o "e nada mudou" do `CONFLITO` e o "não é relatório de
conclusão" do `PEDIDO de estado`. Os três arquivos somam 23.979 B (teto 24.000).

**Sem mutação:** não altera arquivo de `apps/*/src` nem de `packages/*/src`; só um passo do `/seguir` e o teste que o lê.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | "O teste confere só a presença do termo": `linhas.ts abandonar` é procurado em qualquer lugar do arquivo, sem exigir que esteja em "O que pode chegar" nem junto da situação | Recusada: é o mesmo padrão de todas as entradas de `OBRIGATORIOS_NO_PASSO_6`, e o próprio revisor diz que não bloqueia. Mudar só esta entrada a deixaria diferente das outras; mudar todas é outra tarefa, sem lugar nesta correção. O revisor pediu que siga registrada para a retro |
| test-engineer (2ª) | O corte de "Não chega como mensagem:" em `6-tarefa.md:106` tira o único aviso explícito de que a resposta a um `PEDIDO de estado` não chega por `/seguir`; "se sobrarem bytes numa próxima rodada, vale devolver o aviso". O corte também não está listado em "Correção" do documento | `TODO.md`: devolver o aviso na próxima correção que mexa em `6-tarefa.md` e sobre byte no teto de 24.000 B (hoje faltam 21 B). O "Lê-se na saída do `maestri ask` ou no `maestri check`" que ficou leva ao mesmo lugar, e o revisor não bloqueou |
| revisor-geral (2ª) | `6-tarefa.md:121`: "o comando tira a linha do quadro, e se abre de novo (`abrir`)" está sem sujeito e pode ser lido como se o próprio `abandonar` reabrisse a linha. Sugestão: "e reabra com `abrir`" | `TODO.md`, junto com a anterior, no mesmo retoque de texto do `6-tarefa.md`. Não aplicada aqui porque recomendação de revisor que aprovou, na 2ª rodada, não reabre a correção; o item "Linha presa" já traz o comando exato e a saída de `linhas.ts` diz "Abra de novo" |
| revisor-geral (2ª) | No documento da correção, a descrição "uma oração do veredito da esteira" não corresponde ao que mudou na linha 87 do passo (saíram "do encontro" e "é … que") | Recusada: é precisão de registro em `tasks/`, não muda o passo nem o teste. O revisor diz que o sentido não mudou. Quem fizer o retoque do `TODO.md` acima pode acertar a frase junto |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 03:11:15 | 2026-10-24 03:12:05 | `test-engineer` | 1 | APROVADO | ad15cb85f822a9074 |
| 2026-10-24 03:11:15 | 2026-10-24 03:12:06 | `revisor-geral` | 1 | APROVADO | a3e003d109494acf7 |
| 2026-10-24 03:17:43 | 2026-10-24 03:18:12 | `test-engineer` | 2 | APROVADO | aea14df2e2cf81d7a |
| 2026-10-24 03:17:52 | 2026-10-24 03:18:20 | `revisor-geral` | 2 | APROVADO | a9946b15a22bbb53d |
