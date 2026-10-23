# Correção — o encontro da linha 3 (tarefa 8.0, eccbfaa) deu conflito em cenarios.md com spec/harness

**Origem:** encontro da linha 3 (`tools/processo/linhas.ts`), tarefa 8.0: o merge de `spec/harness` na branch da linha parou em conflito.
**Subagentes obrigatórios:** `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: nenhum além de test-engineer e revisor-geral. O revisor-geral entra porque o merge traz alterações em `tools/processo/` (linhas.ts e linhas.test.ts, da tarefa 5.0). -->

## Sintoma

`git merge spec/harness` na linha 3 traz a tarefa 5.0 da linha 2 (`9b676fc`, `6076f23`).
`techspec.md`, `tasks.md`, `indice.md`, `linhas.ts` e `linhas.test.ts` juntam sozinhos; `tasks/prd-harness/cenarios.md` não:
`CONFLITO (conteúdo): Conflito de merge em tasks/prd-harness/cenarios.md`.

No mesmo arquivo, as linhas do RF3 e do RF10 também vieram da spec, mas entraram sozinhas, sem conflito, com a versão de
`spec/harness`: quem ler o `git diff HEAD` de `cenarios.md` (cinco linhas mudadas: RF3, RF6 e RF10 da spec; RF7 e RF8
mantidas) não deve tomá-las por parte da resolução.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa antes do merge.

## Causa

As duas pontas mexeram em linhas vizinhas da tabela A, sem tocar na mesma: a spec (tarefa 5.0) ampliou só a linha do RF6
(`abandonar`: a correção em curso se solta como a tarefa; recusa de linha livre ou fechada; linha em abertura); a 8.0
reescreveu só as linhas do RF7 (a lista dos serviços vem do compose, o `stop` das mutações) e do RF8 (a lista única das
guardas, o `guarda:dependencias`). O git não junta linhas vizinhas de uma tabela em que os dois lados alteraram o bloco
contíguo e devolve os dois lados com os marcadores.

## Teste que reproduz

Não se aplica: é a resolução de um conflito de texto num documento (`cenarios.md`), sem comportamento novo e sem código.
A prova é o arquivo sem marcador, com a linha do RF6 da spec e as linhas do RF7 e do RF8 da 8.0, e o portão da tarefa
sobre a árvore que o merge deixou (o código que veio da 5.0 já passou pelo portão e pela Mesa na linha 2).

## Correção

Mantidos os dois lados, sem alterar o texto de nenhum: o RF6 da spec (`HEAD` trazia a versão antiga, mais curta), seguido do
RF7 e do RF8 da 8.0 (a spec trazia as versões antigas). Os marcadores `<<<<<<<`, `=======` e `>>>>>>>` saíram, e a ordem
RF6, RF7, RF8 foi mantida. O merge se fecha com o commit `(correção encontro-8)`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | A `spec/harness` andou depois de o merge começar: o `MERGE_HEAD` é o `6076f23`, a ponta agora é o `67dad69`, que muda o RF13 em `cenarios.md`, `prd.md` e `2_task.md`. O próximo encontro precisa trazer isso, e o RF13 curto na árvore não é regressão deste merge | Não é desta correção: é o merge seguinte da linha 3 com `spec/harness`, que traz o `67dad69`. Destino: o próximo encontro da linha, sem tarefa nova |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 15:27:06 | 2026-10-23 15:27:44 | `revisor-geral` | 1 | APROVADO | ad9a3eb59714c2b61 |
| 2026-10-23 15:27:04 | 2026-10-23 15:28:37 | `test-engineer` | 1 | APROVADO | a4d3dac893f5a5794 |
