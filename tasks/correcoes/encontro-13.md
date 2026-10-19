# Correção — o encontro da linha 3 (tarefa 13.0, 64bb2aa) deu conflito em techspec.md com spec/telas-do-professor

**Origem:** encontro da linha 3 (`tools/processo/linhas.ts`), tarefa 13.0: o merge de `spec/telas-do-professor` na branch da linha parou em conflito.
**Subagentes obrigatórios:** `frontend-reviewer`, `revisor-geral`
<!-- Quem dita os guardiões é o Orquestrador, no pedido: o merge traz tela (AtividadesDaTurma.tsx, AplicacaoDoArtefato.tsx). O revisor-geral entra porque a árvore do merge tem 13 arquivos fora de tasks/ em relação ao HEAD (o lado da spec; contra o MERGE_HEAD, o lado da 13.0, são 20 de código e e2e), mais de 5 nos dois lados, por devolução da Mesa. O test-engineer é de toda correção. -->

## Sintoma

`git merge spec/telas-do-professor` na linha 3 traz as tarefas já pousadas na spec (11.0 e duas correções de 19/10, entre outras). Quase tudo
junta sozinho; um arquivo não: `CONFLITO (conteúdo): Conflito de merge em tasks/prd-telas-do-professor/techspec.md`, num único bloco, na
seção das divergências da §9.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa antes do merge.

## Causa

As duas pontas acrescentaram um parágrafo no mesmo ponto da Tech Spec, logo depois de "Alunos na pele nova": a linha (13.0) escreveu
"**O convite na pele nova**" (divergências da 13.0) e a spec (11.0) escreveu "**Atividades na pele nova**" (divergências da 11.0). São
parágrafos independentes, de telas diferentes, e o git os devolve com marcadores porque os dois começam na mesma linha.

## Teste que reproduz

Não se aplica: é a resolução de um conflito de texto num documento, sem código nem comportamento novo. O código que veio do merge já
tem os testes das tarefas que o trouxeram (11.0 e as duas correções de 19/10). A prova é o arquivo sem marcador, os dois parágrafos
inteiros e a tipagem da raiz e a do `e2e/` limpas, além do portão da tarefa sobre a árvore que o merge deixou.

A conferência de que nada além da resolução entrou é reproduzível: com o merge aberto e tudo preparado,
`git diff-tree -r --name-only $(git merge-tree --write-tree HEAD MERGE_HEAD | head -1) $(git write-tree)` compara a árvore que o git
junta sozinho (com os marcadores no que não juntou) com a que vai para o commit. Rodado antes do commit, listou só
`tasks/prd-telas-do-professor/techspec.md` (a resolução); este documento, que é da correção, entra depois. Nenhum arquivo de código difere.
Os dois ids de árvore que a conferência compara: a junção automática do git é `f54905f` (`git merge-tree --write-tree HEAD MERGE_HEAD`) e a que
vai para o commit é `8e67749` (`git write-tree`).

## Correção

Mantidos os dois lados, um depois do outro e separados por uma linha em branco: primeiro "**O convite na pele nova**" (13.0), depois
"**Atividades na pele nova**" (11.0), sem mudar uma palavra de nenhum. Os marcadores `<<<<<<<`, `=======` e `>>>>>>>` saíram. O merge
se fecha com o commit `(correção encontro-13)`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Refotografar a aba Atividades depois do merge: as fotos da vitrine mostram a tela antiga (cartão com os links na linha, "1 de 1 aluno enviaram", vazio citando "Ferramentas"), e o código da árvore é o novo (linha clicável, painel, vazio citando "Criados") | A web da vitrine é do build anterior ao merge e a correção não alterou `apps/web`: o código é o da 11.0, já aprovada na spec. Fica para o `/validar` da spec, em que o Validador fotografa cada requisito com tela |
| frontend-reviewer (1ª) | O vazio da foto cita "Ferramentas" e a cópia nova cita "Criados" | Mesma causa da linha acima (foto antiga); a cópia nova está certa pela navegação atual. Sem ação |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-10-19 15:54:17 | 2026-10-19 15:54:41 | `frontend-reviewer` | 1 | APROVADO | ab3238935931c1dcc |
| 2026-10-19 15:54:25 | 2026-10-19 15:54:50 | `revisor-geral` | 1 | APROVADO | ad5937c76708f88b5 |
| 2026-10-19 15:54:21 | 2026-10-19 15:55:30 | `test-engineer` | 1 | APROVADO | a75f9174b9ef34347 |
