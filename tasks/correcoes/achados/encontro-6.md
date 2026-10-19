# Achados das revisões — `tasks/correcoes/encontro-6.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 12:42:34 · `tasks/correcoes/encontro-6.md`

VEREDITO: APROVADO

Cenários exigidos: esta correção não muda comportamento. Ela só resolve um conflito de texto em `tasks/prd-telas-do-professor/techspec.md`, deixando os dois parágrafos de divergência inteiros e sem marcador de conflito. O código que entra pelo merge (tarefas 7.0 e 12.0) já tem os testes e as mutações dessas tarefas, provados no portão de cada uma. Por isso não cabe exigir aqui caminho feliz, caso de borda, permissão, isolamento ou concorrência novos.

Cobertos:
- **Nada além da resolução.** Refiz o merge com `git merge-tree --write-tree HEAD MERGE_HEAD` e comparei o resultado (árvore `1a1dbdb`) com o que está preparado para o commit. Só dois arquivos diferem: o próprio `tasks/correcoes/encontro-6.md` e o `techspec.md`. Em `apps/`, `e2e/`, `docs/` e `packages/` o conteúdo é igual ao que o git juntou sozinho.
- **O conflito saiu como o documento diz.** No `techspec.md`, a única diferença para o resultado do merge é que `<<<<<<< HEAD` e `>>>>>>> MERGE_HEAD` saíram e o `=======` virou linha em branco. "**O documento aberto**" (6.0) vem antes de "**Alunos na pele nova**" (12.0), e nenhuma palavra dos dois mudou.
- **Nenhum marcador sobrou** em `apps`, `e2e`, `packages`, `docs` e `tasks/prd-telas-do-professor` (busca no que está preparado para o commit).
- **Nenhum teste desligado.** Os testes de unidade, de componente e e2e que vêm do merge não têm `.skip`, `.only` nem `.fixme`.
- **A falta da seção "Mutações" está certa.** Não há cláusula nova de código, então não há o que mutar.

Bloqueantes: nenhum.

Recomendações:
- O "Teste que reproduz" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/correcoes/encontro-6.md` diz que a prova é "o arquivo sem marcador". Vale escrever também a conferência objetiva: o que está preparado para o commit, comparado ao resultado de `git merge-tree --write-tree HEAD MERGE_HEAD`, só difere no `techspec.md`. Assim o próximo encontro com conflito de texto tem um jeito reproduzível de provar que nada além da resolução entrou.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 12:42:37 · `tasks/correcoes/encontro-6.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/tasks.md:51`, a 7.0 está marcada como feita, mas a 7.1 e a 7.2 continuam desmarcadas. Isso veio assim da `spec/telas-do-professor` (38242ef), não desta resolução. Vale acertar no próximo registro de estado da spec.

O que conferi:
- **Só o conflito foi mexido.** Refiz o merge automático das duas pontas (`git merge-tree HEAD MERGE_HEAD`) e comparei com o que está no índice. A diferença está só em `tasks/prd-telas-do-professor/techspec.md`, onde saíram os três marcadores e entrou uma linha em branco, e no documento novo `tasks/correcoes/encontro-6.md`. Os outros arquivos alterados, incluindo as telas da 7.0 e da 12.0 e os dois arquivos que o git juntou sozinho (`docs/interface.md` e `achados/indice.md`), estão exatamente como o git os juntou.
- **Os dois parágrafos estão inteiros.** "O documento aberto" (6.0) e "Alunos na pele nova" (12.0) aparecem um depois do outro, sem nenhuma palavra mudada, como o documento da correção diz.
- **Não sobrou marcador** em nenhum dos arquivos alterados.
- **O guardião de tela está marcado.** O documento pede o `frontend-reviewer` e explica por quê: o merge traz telas.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 12:44:03 · `tasks/correcoes/encontro-6.md`

VEREDITO: APROVADO

Tela vista: sim (22 fotos lidas, cheia e vazia). As 16 do prompt cobrem Turmas, a turma aberta, a aba Alunos, Ferramentas e o sino. Tirei mais duas, da aba Alunos na escola vazia, a 1366 e a 360 px. As fotos do sino a 360 px não abrem o painel. O clique da vitrine não o acionou no celular, então esse painel vale pelo e2e `professor-sino.spec.ts`.

Estados: ok, e carregando e erro só pelo código.
- Alunos: `AlunosDaTurma.tsx:100-141` tem carregando, erro, vazio ("A lista ainda não chegou", que convida) e com dado.
- Ferramentas: `Ferramentas.tsx` tem os dois avisos (leitura do time que falhou e falta de turma confirmada), e nenhum deles tira cartão.
- O sino mostra "Tudo em dia" na escola vazia.

Acessibilidade:
- Os alvos de toque estão acima de 44 px nas fotos.
- Foco e rótulos estão tratados nos componentes. A tabela tem `caption` e a leitura do sino é anunciada.
- Não vi contraste fora da paleta nas fotos.

Chromebook fraco:
- A aba Alunos lê a lista de cem em cem, com "Ver mais" (`AlunosDaTurma.tsx:131`).
- O 12.0 já havia registrado que a lista não é virtualizada.
- Os e2e de turma e de Ferramentas rodam sob o throttling do projeto `chromebook`.

Celular:
- A 360 px não há rolagem horizontal nem conteúdo cortado em nenhuma tela.
- A tabela de alunos vira cartões com o rótulo de cada valor.
- A página rola a 1366 × 768 em duas telas: a turma aberta em Hoje (924 px) e Alunos (991 px). A regra de só o miolo rolar é da aula ao vivo e do documento aberto, não dessas duas telas. O frontend-reviewer do 12.0 já checou isso (`achados/12_task.md:27`), e não achei regra contrária no PRD nem no `docs/interface.md`.

Ação oficial protegida: sim. Esta correção não toca em nota, publicação nem exportação.

A resolução do conflito está certa:
- `techspec.md` não tem marcador (`<<<<<<<`, `=======`, `>>>>>>>`).
- Os dois parágrafos estão inteiros, "O documento aberto" na linha 201 e "Alunos na pele nova" na linha 218, nessa ordem.
- A árvore não acrescenta código além do que as tarefas 7.0 e 12.0 já levaram à spec, e as duas passaram pelo `frontend-reviewer` em duas rodadas cada.

Bloqueantes: nenhum.

Recomendações, para o `/validar` e o `/retro`:
1. **Dois botões laranja cheios na aba Alunos.**
   - Onde: `AlunosDaTurma.tsx:95` com `AcessoDaTurma.tsx:247`, vistos em `vazia--professora--professor-turmas-01a15368-ec32-7093-8358-a23b125e0c98--computador.png` e `professora--professor-turmas-01a15368-eaab-76e5-a0a5-94554e68f368--computador.png`.
   - O que há: "Gerar acesso" e "Ver o acesso dos alunos" aparecem juntos quando o acesso está inativo e não há pedidos. O `docs/interface.md` R4 pede um botão cheio por tela. O segundo só leva o foco ao título logo acima.
   - Por que não bloqueia: o vazio e esse botão vêm da peça compartilhada `ListaDePedidos`, têm teste próprio (`pedidos.spec.ts:229`) e foram aprovados pelo 12.0. Esta correção é só a resolução de um conflito de texto.
   - Sugestão: tirar a `acao` do vazio quando o acesso está inativo (o bloco do acesso está logo acima), ou rebaixá-la a secundária.
2. **Descrições de Ferramentas cortadas com reticências** (`Ferramentas.tsx`, `line-clamp-3`).
   - Na Adaptação some "o conteúdo…", o que explica que o conteúdo não é alterado.
   - O 7.0 já registrou isso (`achados/7_task.md:30`): encurtar as descrições em `ferramentas.ts` até caberem em três linhas a 360 px.
3. **Rótulo "FERRAMEN…" truncado** na barra de baixo a 360 px (todas as telas do celular). Vem da casca de navegação, que esta correção não alterou. Vale uma abreviação que caiba, ou menos tracking.
4. **Lista vazia e "Saiu da turma" sem foto.** A escola vazia da vitrine tem 1 aluno. O 12.0 já pediu uma foto desses dois estados ao `/validar`.

Arquivos principais: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/techspec.md`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/AlunosDaTurma.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Ferramentas.tsx`.
