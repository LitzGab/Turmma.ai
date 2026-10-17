# Correção — o encontro da linha 1 (correção `2026-10-17-painel-e-pedido-rolam-a-pagina`, c2e3398) deu conflito em TODO.md com spec/telas-da-coordenacao

**Origem:** encontro da linha 1 (`tools/processo/linhas.ts`): o merge de `spec/telas-da-coordenacao` (8642275) na branch da linha parou em conflito.
**Subagentes obrigatórios:** `revisor-geral`
<!-- O PEDIDO do Orquestrador não ditou guardião além do test-engineer, que toda correção tem, e do revisor-geral. O merge leva 9 arquivos fora de `tasks/` (7 testes, o `docs/interface.md` e o TODO.md), acima do limite de 5 do passo 5 de `corrigir`. -->

## Sintoma

`git merge spec/telas-da-coordenacao` na linha 1 traz a correção `2026-10-17-vazio-durante-a-leitura` (sete testes e `docs/interface.md`).
Tudo junta sozinho, inclusive `Painel.test.tsx` (as duas pontas o mexeram) e `tasks/correcoes/achados/indice.md`, menos `TODO.md`:
`CONFLITO (conteúdo): Conflito de merge em TODO.md`.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa antes do merge.

## Causa

As duas pontas acrescentaram itens no **fim** do `TODO.md`, no mesmo ponto: a linha 1 (c2e3398) os quatro itens da correção
`painel-e-pedido-rolam-a-pagina`; a spec (8642275) os dois da correção `vazio-durante-a-leitura`. O git não sabe ordenar dois
acréscimos no mesmo lugar e devolve os dois lados com os marcadores.

## Teste que reproduz

Não se aplica: é a resolução de um conflito de texto numa lista de pendências, sem comportamento novo. A prova é o `TODO.md`
sem marcador e com as seis linhas, e o `Painel.test.tsx`, que as duas pontas alteraram e o git juntou sozinho.

O arquivo verde isolado (37 testes) só mostra que ele roda; o que prova que nenhum caso se perdeu no merge é o diff da árvore
contra cada pai (`git diff --cached <pai> -- Painel.test.tsx`): contra a linha 1 (HEAD) são 7 linhas acrescentadas e nenhuma
removida, o acréscimo da spec; contra a spec são 27 acrescentadas e uma trocada, o `import` do vitest, que a linha 1 ampliou
com `beforeEach`. Cada ponta traz só o que a outra tinha, e o resto do arquivo é igual ao dela.

As quatro mutações do Painel da `vazio-durante-a-leitura` ainda acham o trecho que trocam no `Painel.tsx` da linha 1
(`apps/web/src/areas/coordenacao/Painel.tsx:149-152`). **Não foram rodadas de novo sobre o código juntado**, porque o portão
deste documento não declara mutação; a chance de dar diferente é baixa, e o que vale é a prova que a correção original
registrou, na spec.

## Correção

Mantidas as seis linhas, sem alterar o texto de nenhuma: primeiro as quatro da linha 1 (Painel, detalhe do pedido, vitrine,
texto do Painel), depois as duas da spec (`Professores.tsx:183` e o título do cartão do incidente). Os marcadores
`<<<<<<<`, `=======` e `>>>>>>>` saíram. O merge se fecha com o commit `(correção encontro-2026-10-17-painel-e-pedido-rolam-a-pagina)`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 18:43:44 | 2026-10-17 18:44:17 | `revisor-geral` | 1 | APROVADO | a7aede28bb9889dfd |
| 2026-10-17 18:43:48 | 2026-10-17 18:45:04 | `test-engineer` | 1 | APROVADO | ad718a3b40d5652a7 |
