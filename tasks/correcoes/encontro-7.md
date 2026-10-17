# Correção — o encontro da linha 2 (tarefa 7.0, b8e425d) deu conflito em Estrutura.test.tsx com spec/telas-da-coordenacao

**Origem:** encontro da linha 2 (`tools/processo/linhas.ts`), tarefa 7.0: o merge de `spec/telas-da-coordenacao` na branch da linha parou em conflito.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: frontend-reviewer, além do test-engineer que toda correção tem. -->

## Sintoma

`git merge spec/telas-da-coordenacao` na linha 2 traz a correção `2026-10-17-lista-de-nomes-com-41-px` (cc2188e).
`Estrutura.tsx` junta sozinho; `apps/web/src/areas/coordenacao/Estrutura.test.tsx` não:
`CONFLITO (conteúdo): Conflito de merge em apps/web/src/areas/coordenacao/Estrutura.test.tsx`.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa antes do merge.

## Causa

As duas pontas mexeram no mesmo ponto do arquivo, o teste que fica logo depois do "a 360 px a tabela vira lista": a spec
(cc2188e) acrescentou, antes do teste do "Nova turma", o `it.each` do alvo de toque de 44 px do link "Lista de nomes";
a linha 2 (tarefa 7.0) reescreveu o título e o corpo desse teste do "Nova turma" (a alocação saiu da aba). O git não sabe
juntar um acréscimo com a reescrita da linha seguinte e devolve os dois lados com os marcadores.

## Teste que reproduz

Não se aplica: é a resolução de um conflito de texto entre dois testes que já existiam, sem comportamento novo. A prova
é o arquivo sem marcador, com os dois testes, e o `Estrutura.test.tsx` verde isolado (33 testes: os 31 que existiam mais os
dois casos, 1366 e 360 px, do alvo de 44 px), além do portão da tarefa sobre a árvore que o merge deixou.

O portão da tarefa **não rodou o e2e**: `e2e/estrutura.spec.ts`, onde está o W12 com a medida real dos 44 px e do estouro de
13 px, não mudou em relação ao HEAD, e o portão só roda os testes que a árvore alterou. A medida do lado da spec contra a tela
sem Alocação da 7.0 só se junta na esteira do push, que o Orquestrador lê; cada lado já foi revisto com a sua própria prova.

## Correção

Mantidos os dois lados, sem alterar o texto de nenhum: o `it.each` do alvo de toque de 44 px (da spec) e, logo depois, o
teste "Nova turma é o único botão cheio da aba, e a alocação já não mora nela" (da 7.0). Saiu apenas a linha antiga do
título do "Nova turma" que o lado da spec ainda trazia ("o 'Alocar' da Alocação, que a 7.0 refaz, continua cheio até lá"),
porque o corpo que a 7.0 escreveu já a contradiz. Os marcadores `<<<<<<<`, `=======` e `>>>>>>>` saíram. O merge se fecha
com o commit `(correção encontro-7)`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | "Faça a vitrine fotografar a escola cheia sem o modal de incidente. Pode ser confirmando o aviso antes da foto, ou usando uma escola sintética sem aviso pendente. Hoje a "cheia" não deixa ver nenhuma tela da coordenação." | Não aplicar: mexe em `tools/vitrine/`, fora desta correção, e confirmar o aviso muda o banco da vitrine. Destino: `TODO.md`, ou a tarefa futura que tocar `tools/vitrine/` (a decisão de registrar é do Orquestrador) |
| frontend-reviewer (1ª) | "A foto "vazia" tem uma turma e um professor ("2ºA", "Professora Sintética Rosa"), então não é de fato vazia. Convém conferir que o fixture da vitrine não está semeando turma na escola vazia. Assim o convite do estado vazio da aba Turmas passa a ser fotografado." | Não aplicar: mesmo arquivo de fora, `tools/vitrine/`, e a conferência do fixture não é desta correção. Destino: `TODO.md`, junto com a anterior |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 12:08:28 | 2026-10-17 12:08:56 | `frontend-reviewer` | 1 | APROVADO | afc43370e9615ef77 |
| 2026-10-17 12:08:23 | 2026-10-17 12:09:10 | `test-engineer` | 1 | APROVADO | a14a2774bcf5c7e62 |
