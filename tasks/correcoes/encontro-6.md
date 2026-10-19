# Correção — o encontro da linha 2 (tarefa 6.0, 5762f90) deu conflito em techspec.md com spec/telas-do-professor

**Origem:** encontro da linha 2 (`tools/processo/linhas.ts`), tarefa 6.0: o merge de `spec/telas-do-professor` (38242ef) na branch da linha parou em conflito.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- Quem dita os guardiões é a Mesa, que confere a linha contra os arquivos alterados: o merge traz tela (AlunosDaTurma.tsx, Ferramentas.tsx, avisos.tsx), e a tabela de criar-tasks manda "cria ou altera tela" para o frontend-reviewer. O test-engineer é de toda correção. -->

## Nota

O PEDIDO do Orquestrador não marcou guardião; a Mesa devolveu a rodada 1 por falta do `frontend-reviewer` (a tela vem do merge, não da resolução do conflito).

## Sintoma

`git merge spec/telas-do-professor` na linha 2 traz as tarefas já pousadas na spec (7.0 e 12.0, entre outras). Quase tudo junta
sozinho; um arquivo não: `CONFLITO (conteúdo): Conflito de merge em tasks/prd-telas-do-professor/techspec.md`, num único bloco, na
seção das divergências da §9.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa antes do merge.

## Causa

As duas pontas acrescentaram um parágrafo no mesmo ponto da Tech Spec, logo depois de "Aprovar na pele nova": a linha (6.0) escreveu
"**O documento aberto**" (divergências da 6.0) e a spec (12.0) escreveu "**Alunos na pele nova**" (divergências da 12.0). São
parágrafos independentes, de telas diferentes, e o git os devolve com marcadores porque os dois começam na mesma linha.

## Teste que reproduz

Não se aplica: é a resolução de um conflito de texto num documento, sem código nem comportamento novo. O código que veio do merge já
tem os testes das tarefas que o trouxeram (7.0 e 12.0). A prova é o arquivo sem marcador, os dois parágrafos inteiros e a tipagem
da raiz e a do `e2e/` limpas, além do portão da tarefa sobre a árvore que o merge deixou.

A conferência de que nada além da resolução entrou é reproduzível: com o merge aberto e tudo preparado,
`git diff-tree -r --name-only $(git merge-tree --write-tree HEAD MERGE_HEAD | head -1) $(git write-tree)` compara a árvore que o git
junta sozinho (com os marcadores no que não juntou) com a que vai para o commit. Rodado antes do commit, listou só dois caminhos:
`tasks/prd-telas-do-professor/techspec.md` (a resolução) e este documento, que é da correção. Nenhum arquivo de código difere.

## Correção

Mantidos os dois lados, um depois do outro e separados por uma linha em branco: primeiro "**O documento aberto**" (6.0), depois
"**Alunos na pele nova**" (12.0), sem mudar uma palavra de nenhum. Os marcadores `<<<<<<<`, `=======` e `>>>>>>>` saíram. O merge
se fecha com o commit `(correção encontro-6)`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | `tasks/prd-telas-do-professor/tasks.md:51`: a 7.0 está marcada como feita, mas a 7.1 e a 7.2 continuam desmarcadas | Veio assim da `spec/telas-do-professor` (38242ef), não desta resolução, e o `tasks.md` é do registro de estado do Orquestrador: acertar no próximo registro de estado da spec |
| frontend-reviewer (1ª) | Dois botões laranja cheios na aba Alunos (`AlunosDaTurma.tsx:95` com `AcessoDaTurma.tsx:247`): tirar a `acao` do vazio com o acesso inativo, ou rebaixá-la | Código da 12.0, já aprovada, e peça compartilhada `ListaDePedidos` com teste próprio: `/validar` da spec, que decide se vira tarefa |
| frontend-reviewer (1ª) | Descrições de Ferramentas cortadas por `line-clamp-3` (Adaptação perde "o conteúdo…") | Já registrado em `achados/7_task.md:30` e fora do que esta correção toca: `/validar` da spec |
| frontend-reviewer (1ª) | Rótulo "FERRAMEN…" truncado na barra de baixo a 360 px | Vem da casca de navegação, que esta correção não alterou: `/validar` da spec |
| frontend-reviewer (1ª) | Lista vazia e "Saiu da turma" sem foto na vitrine | Já pedido ao `/validar` pelo 12.0 (`achados/12_task.md`) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-10-19 12:42:03 | 2026-10-19 12:42:34 | `test-engineer` | 1 | APROVADO | adaac9eddde9bf186 |
| 2026-10-19 12:42:07 | 2026-10-19 12:42:37 | `revisor-geral` | 1 | APROVADO | a9bf5e7322477d1e9 |
| 2026-10-19 12:41:58 | 2026-10-19 12:44:03 | `frontend-reviewer` | 1 | APROVADO | a53e7ad25520c4001 |
