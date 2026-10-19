# Achados das revisões — `tasks/correcoes/encontro-13.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 15:54:41 · `tasks/correcoes/encontro-13.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, cheia e vazia, computador e celular). As fotos estão defasadas em relação ao código da árvore. Elas mostram a aba Atividades antiga, com o cartão e os links "Abrir a atividade" e "Ver a correção" na própria linha, "1 de 1 aluno enviaram" e o vazio "Gere uma atividade… em Ferramentas". O código da árvore (`apps/web/src/areas/professor/AtividadesDaTurma.tsx`, `aprovar.ts:134`) usa `Linha` clicável com selo de estado, os links no painel lateral, "enviou/enviaram" concordando e o vazio "Abra uma atividade objetiva em Criados…". Vale o código. A foto não prova a tela nova. Isso fica para a validação.
Estados: ok. O código tem carregando, erro com "tentar de novo", vazio com convite e ação, vazio de filtro com "Limpar filtro", e a lista com dado.
Acessibilidade: ok pelo código. A linha é botão. O painel devolve o foco. O estado vai em texto e não só em cor. Os campos têm rótulo. O foco volta ao filtro ao limpar.
Chromebook fraco: não se aplica a esta correção, porque a única resolução própria é um documento. A lista da aba é curta e o filtro só aparece com mais de 8 linhas.
Celular: nas fotos de 360 px não há rolagem horizontal nem corte. As abas, o cartão e a barra inferior estão íntegros, e o vazio quebra o texto sem sair do bloco. Os links da foto antiga têm altura de texto perto de 24 px. No código atual a linha inteira é o alvo, mais alto.
Ação oficial protegida: sim. Aprovar a correção não é feito nesta tela, e "Encerrar" passa pela confirmação que mostra a atividade e a turma.
Bloqueantes: nenhum. Conferi a resolução do conflito:
- `tasks/prd-telas-do-professor/techspec.md` não tem marcadores de conflito.
- Os parágrafos "O convite na pele nova" (linha 235) e "Atividades na pele nova" (linha 261) estão inteiros e separados.
- A comparação `git diff-tree` entre a árvore que o git junta sozinho e a que vai para o commit lista só o `techspec.md`. Nenhum código foi alterado além do que veio do merge.

Recomendações:
- Refotografar a aba Atividades depois do merge. A vitrine foi feita com um e2e anterior e mostra a tela antiga.
- O vazio da foto ainda cita "Ferramentas" e a cópia nova cita "Criados". Isso confirma que a foto é antiga, e a nova cópia está correta pela navegação atual.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 15:55:30 · `tasks/correcoes/encontro-13.md`

VEREDITO: APROVADO

Cenários exigidos: esta correção resolve um conflito de texto em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/prd-telas-do-professor/techspec.md`. Ela não muda código nem comportamento, então não traz regra nova que precise de teste. Para um caso assim, a prova é esta:
- (a) a única diferença entre o merge automático e o que vai para o commit é a própria resolução;
- (b) não sobra marcador de conflito;
- (c) os dois parágrafos ficam inteiros;
- (d) o código que veio dos dois lados (11.0 e as duas correções de 19/10 na spec; 13.0 na linha) continua passando nos testes depois de juntado.

Cobertos:
- **(a):** refiz a conferência que o documento descreve, comando a comando. O `git merge-tree --write-tree HEAD MERGE_HEAD` gerou a árvore `f54905f` e o `git write-tree` gerou `8e67749`. Comparando as duas com `git diff-tree`, só aparece `tasks/prd-telas-do-professor/techspec.md`. Nenhum arquivo de código difere do que o git juntou sozinho.
- **(b) e (c):** o diff entre as duas árvores tira só as linhas `<<<<<<< HEAD`, `=======` e `>>>>>>> MERGE_HEAD`, e põe uma linha em branco no lugar do separador. "O convite na pele nova" (13.0) e "Atividades na pele nova" (11.0) ficam inteiros e sem mudança de palavra. O grep por marcadores no arquivo não encontra nenhum. A outra mudança na Tech Spec em relação ao HEAD (linha 208, o `useCorrigirDeNovo`) entrou pelo merge automático, vinda da 11.0, e não pela resolução.
- **(d):** os arquivos de código de cada lado não se cruzam. A 13.0 mexeu em `AcessoDaTurma`, `ConvidarAlunos`, `Turmas`, `AlunosDaTurma` e `Dialogo`/`dialogos`. A 11.0 mexeu em `AtividadesDaTurma`, `AplicacaoDoArtefato`, `aprovar` e `corrigir-de-novo`. Nenhum import da `AtividadesDaTurma` aponta para o que a 13.0 alterou. Os e2e da 11.0 não citam a interface de acesso e convite que a 13.0 levou para o diálogo. `npx vitest run` nos testes dos dois lados (`AtividadesDaTurma`, `ConvidarAlunos`, `Turmas`, `aprovar`, `AlunosDaTurma`) na árvore juntada: 6 arquivos e 154 testes, todos verdes.
- Não há `.skip` nem `.only` nos testes que vieram do merge (busca com `git grep`).
- A correção não declara mutações, e nenhuma cláusula nova entra pela resolução. Não há o que conferir nesse ponto.

Bloqueantes: nenhum

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/correcoes/encontro-13.md`, linha 32: a seção "Teste que reproduz" poderia registrar os dois ids de árvore que a conferência produziu (`f54905f` e `8e67749`). Assim quem audita depois compara direto, sem reabrir o merge.
- A frase "13 arquivos fora de tasks/", no comentário da linha 5, vale para a árvore em relação ao HEAD. Contra o MERGE_HEAD são 20 de código e e2e (o lado da 13.0). Vale dizer de que lado é a contagem, para o `/retro` não estranhar.
