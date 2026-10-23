# Correção — supressão órfã de `tools/ci/compose.ts` deixa o `npm run lint` e a `catraca.test.ts` vermelhos

**Origem:** `tasks/prd-reengenharia/validacao.md` §4, crítico 1 (validação 1 da X5, REPROVADA).
**Subagentes obrigatórios:** `test-engineer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: nenhum além de test-engineer e revisor-geral. A correção leva 2 arquivos fora de
     tasks/ e não toca `.github/`, `tools/ci/` nem `tools/processo/`, então o `revisor-geral` não é obrigatório pelo limite do passo 5. -->

## Sintoma

`npm run lint` falha com "There are suppressions left that do not occur anymore" e `tools/guardas/catraca.test.ts` ›
"npm run lint está verde com a linha de base" (linha 205) fica vermelho no HEAD.

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

A supressão `tools/ci/compose.ts` › `complexity` (`eslint-suppressions.json`, 5 linhas) deixou de ter uso. A 13.0 (`6f10b86`,
linha 1) gravou a supressão com a complexidade que `compose.ts` tinha; a 90.0 (`a3505d9`, linha 2) tirou 28 linhas de
`compose.ts` e a função caiu abaixo do limite. Cada tarefa estava verde no portão da sua linha; o merge `2b68e74` juntou as
duas e a supressão ficou sem ocorrência. Falha da tarefa 90.0 (linha 2) somada à 13.0 (linha 1), vista só no encontro.

## Teste que reproduz

`tools/guardas/catraca.test.ts` › `npm run lint está verde com a linha de base (a catraca nasce sem quebrar nada)`: vermelho
no HEAD (saída: supressões sem uso), verde depois da poda.

## Correção

`npx eslint . --prune-suppressions`: o diff tira só as cinco linhas da entrada `tools/ci/compose.ts` de
`eslint-suppressions.json`, e nada mais ali. A poda baixa a soma de `complexity` de 249 para 248, e o `TETO` de
`tools/guardas/catraca.test.ts:14` é igual à soma (a catraca desenhada na 13.0: "quem corta baixa os dois, no mesmo commit",
`catraca.ts:29`); sem baixá-lo, `cita só as quatro regras de tamanho…` e `nenhum arquivo ganhou supressão desde o HEAD` ficam
vermelhos com "o TETO é 249". Por isso a correção leva um segundo arquivo, com `complexity: 248`. O que a validação não
previu: ela falava só do JSON.

## Mutações

Nenhuma cláusula nova: o diff só remove uma supressão sem uso. A prova é o teste da catraca, que fica vermelho com a entrada
de volta (é o que ele fez no HEAD).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 00:38:49 | 2026-10-23 00:39:07 | `revisor-geral` | 1 | APROVADO | ab53593d1c4078664 |
| 2026-10-23 00:38:48 | 2026-10-23 00:39:46 | `test-engineer` | 1 | APROVADO | ab4866c2300ee5bf6 |
