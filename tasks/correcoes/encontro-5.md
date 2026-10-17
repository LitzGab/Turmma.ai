# Correção — o encontro da linha 2 (tarefa 5.0, 738c3c4) deu conflito no TODO.md com spec/telas-da-coordenacao

**Origem:** encontro da linha 2 (`tools/processo/linhas.ts`), tarefa 5.0: o merge de `spec/telas-da-coordenacao` na branch da linha parou em conflito.
**Subagentes obrigatórios:** nenhum além de `test-engineer` e `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: nenhum além de test-engineer e revisor-geral, que toda correção tem. -->

## Sintoma

`git merge spec/telas-da-coordenacao` na linha 2 traz a 12.0, a correção
`2026-10-16-casca-procura-governanca` e a `2026-10-17-abas-das-empresas-estoura-o-prazo`. Todos os arquivos juntam
sozinhos, menos o `TODO.md`: `CONFLITO (conteúdo): Conflito de merge em TODO.md`.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa antes do merge.

## Causa

As duas pontas acrescentaram linhas no fim do `TODO.md`, no mesmo ponto: a linha 2 (tarefa 5.0) abriu dois itens de
Escola › Turmas, e a spec (correção das abas das empresas) abriu o item do prazo de 90 s do e2e de Privacidade. O git
não sabe ordenar dois acréscimos no mesmo lugar e devolve os dois lados com os marcadores. Não é conflito de código:
nenhum arquivo de `apps/`, `packages/`, `e2e/` ou `infra/` divergiu dos dois lados.

## Teste que reproduz

Não se aplica: é a resolução de um conflito de texto num documento de pendências, sem comportamento novo. A prova é
o `TODO.md` sem marcador e com as três linhas, as duas da linha 2 e a da spec, e o portão da tarefa verde sobre a árvore
que o merge deixou.

## Correção

Mantidas as linhas dos dois lados, na ordem em que cada ponta as escreveu (as duas de Escola › Turmas, depois a do
e2e de Privacidade), sem alterar o texto de nenhuma. Os marcadores `<<<<<<<`, `=======` e `>>>>>>>` saíram. O merge se
fecha com o commit `(correção encontro-5)`.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 02:07:12 | 2026-10-17 02:07:31 | `test-engineer` | 1 | APROVADO | a85549b8d002d84ae |
| 2026-10-17 02:07:18 | 2026-10-17 02:07:47 | `revisor-geral` | 1 | APROVADO | a0e9290f673d72307 |
