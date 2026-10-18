# Achados das revisões — `tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-18 11:24:39 · `tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (correção de processo; o comportamento segue o que o documento descreve)
Portão local: carimbo válido

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/linhas.ts:334-343`: numa spec de verdade o comando continua recusando, porque a correção não tratou os commits de merge do encontro.
   - **De onde vêm esses commits.** Com duas linhas ou mais, `encontro` roda `git merge --no-edit <spec>` na linha (linha 386) e depois a spec avança até a linha por `--ff-only` (linha 407). Assim a branch da spec recebe commits com título `Merge branch 'spec/X' into spec/X--lN`.
   - **Por que recusa.** Contra a `develop`, esses merges entram no `rev-list`. O `git diff <sha>^1 <sha>` deles traz o código da outra linha, então eles não contam como "só documento". Como não têm `(tarefa N.0)` nem `(correção …)`, caem no `if (!marcado)` da linha 343, e a mensagem sai como "leva código sem (tarefa N.0) nem (correção <slug>) no título: "Merge branch 'spec/…' into …"".
   - **Conferido no repositório.** Na `spec/telas-da-coordenacao`, os merges `8397171`, `70019a1` e `e2ebcc5` levam `apps/web/src/...` e `e2e/*.spec.ts`. O `Merge branch 'develop' into spec/…` (por exemplo `256b4a2`, em `spec/pele-e-casca`) cai no mesmo caso.
   - **Por que os testes passam.** O bloco novo de testes só monta uma spec de uma linha só, sem nenhum merge.
   - **Correção exigida.**
     - Com `naSpec` ligado, os commits de merge (mais de um pai) precisam ser tratados: pular, ou conferir só o que é do próprio merge. O merge que resolve conflito já leva `(correção encontro-…)`, e o comportamento com ele precisa continuar coerente.
     - Na linha 348, o "último com código" tem de ignorar esses merges.
     - Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/linhas.test.ts`, falta um `it` que monte duas linhas com `partida`/`encontro`. O helper `andares([1, 2])` serve para isso: a segunda linha gera o merge, depois vem um commit `(correção …)` na spec, e o `conferir` tem de aceitar. O teste precisa de uma mutação declarada no documento.
     - A seção "Causa" e a seção "Correção" do documento da tarefa precisam passar a dizer isso.

Recomendações:
- `linhas.ts:348`: na spec, uma correção que só mexe em `.md` ou em `tasks/` vem depois do último commit de tarefa com código e é recusada, com a mensagem "tem de ser o último com código". Na correção avulsa, o mesmo caso é aceito. Ou se decide e registra no documento que correção só de documento não acontece na spec, ou o caso passa a ser aceito quando não há código depois da última tarefa.
- `linhas.test.ts:449`: o nome do teste fala em "a correção em documento", mas o commit montado ("Registra o estado") não leva marca de correção. O nome deveria dizer o que o teste monta.
- `linhas.ts:348`: o ternário que monta o sufixo da mensagem repete a condição `naSpec`. Duas mensagens separadas, uma por ramo, ficam mais legíveis.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-18 11:24:56 · `tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md`

VEREDITO: REPROVADO

Cenários exigidos (o domínio é o código de processo, então os casos de borda escolares não se aplicam):
- Caminho feliz: correção depois das tarefas, na `spec/…`.
- Último commit com código é de tarefa: recusa.
- Commit de documento depois do código não esconde a tarefa.
- Commit com código sem marca, ou sem `Revisões:`: recusado também na spec.
- Na correção avulsa a marca de tarefa continua não valendo.
- **Uma spec de verdade com linhas em paralelo (D79), que tem os merges de encontro `Merge branch 'spec/…' into spec/…--lN` entre os commits que a `develop` não tem.**
- A correção que só mexe em documento, na branch da spec.

Cobertos: os cinco primeiros. São cinco `it` no bloco `conferir na branch da spec`, todos com asserção sobre o texto da recusa ou sobre o código 0. As nove mutações batem com o `git diff`. Toda cláusula nova tem bloco, e cada bloco fica vermelho pelo motivo certo: conferi cenário a cenário. O arquivo passa (23/23), sem `.skip` e sem mock.

Bloqueantes:
1. **`tools/processo/linhas.ts:343`: o defeito continua numa spec real com mais de uma linha.** O fixture `andarDaSpec` (`tools/processo/linhas.test.ts:409-428`) monta um histórico linear, e uma spec real não é assim. O `encontro` faz `merge --no-edit spec` no checkout da linha (`linhas.ts:386`) e depois leva a spec até a linha (`linhas.ts:407`). Com isso, a branch da spec fica cheia de commits de merge com título sem marca:
   - Só nos 15 merges mais recentes da `develop`, 12 são desses (`8397171`, `70019a1`, `e2ebcc5`, …).
   - O `8397171` mexe em `e2e/agentes.spec.ts` contra o primeiro pai. Para o `soDocumento` (`linhas.ts:342`) isso é código.
   - Na `spec/telas-da-coordenacao`, `conferir` passaria pelos `(tarefa N.0)` e recusaria no primeiro merge de encontro: `leva código sem (tarefa N.0) nem (correção <slug>) no título: "Merge branch 'spec/…' into spec/…--l1"`.

   Ou seja, o sintoma da correção ("na branch da spec o comando recusa sempre") continua em todo andar com linhas em paralelo, que é o caso normal desde a D79.

   **Correção exigida:**
   - No `naSpec`, tratar o merge que o encontro já conferiu. Uma forma é aceitar o commit com mais de um pai cujo título seja o do `git merge --no-edit` de `spec/…` numa `spec/…--lN`. Outra é passar a conferir só os commits depois do último encontro. A escolha fica com o Implementador.
   - Escrever o teste com o histórico de verdade. Use o helper `andares([1, 2])` com dois `encontro` (`linhas.test.ts:181`, `:272-281`), que já gera esses merges, e depois um commit `(correção …)` com código na spec. Esse teste tem de ficar vermelho contra o código desta rodada.
   - Acrescentar à seção "Mutações" um bloco para a cláusula nova.

Recomendações:
- **Correção só de documento, na spec.** `linhas.ts:348` e `:342`: na spec, a correção que só mexe em `.md` ou em `tasks/` (texto de skill em `.claude/skills/*.md`, por exemplo) é recusada, porque o último commit com código continua sendo de tarefa. Na correção avulsa o mesmo commit passa (`temMarca`). Se isso foi escolha, deixe escrito no documento da correção e cubra com um teste. Se não foi, aceite o commit de correção só de documento quando não houver código depois dele.
- **`let ultimoCorrige = false` sem bloco próprio.** `linhas.ts:333`: trocar o valor inicial por `true` só sobreviveria numa spec sem nenhum commit com código, e nenhum teste monta esse caso. É barato acrescentar, por exemplo, uma spec só com o PRD e um commit sem marca, que precisa ser recusada.
- **Nome do teste.** `linhas.test.ts:448` ("a correção em documento depois do código…"): o commit de documento do teste não é uma correção, é o `Registra o estado`. "um commit de documento depois do código…" descreve melhor o cenário.

Arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/linhas.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/linhas.test.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md`

## test-engineer · 2ª rodada · APROVADO · 2026-10-18 11:33:52 · `tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: a correção feita na `spec/…` depois das tarefas é aceita.
- O último commit com código é de tarefa, e não a correção: recusa.
- Commit com código sem marca, ou sem a linha `Revisões:`, continua recusado na spec.
- Na correção avulsa, a marca de tarefa não vale e o merge limpo continua cobrado.
- Um commit só de documento depois do código não esconde a falta da correção.
- Spec só com documento: recusa.
- Histórico real com duas linhas e o merge do encontro (a exigência 1 da rodada anterior).
- Merge que resolveu conflito à mão: cobrado pelo que resolveu.

**Cobertos:**
- **O teste com histórico real existe e chega à cláusula.** O `it` "com duas linhas, o merge que o encontro faz…" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/linhas.test.ts:176-197`) usa `andares()` com `partida` e `encontro` reais nas duas linhas. Ele confere que existe um merge (`rev-list --merges` não vazio) e só depois faz o `(correção …)` com código e o push. Sem o tratamento de merge, o merge do encontro, sem marca, leva `apps/web/a.ts` no diff contra `^1`. É esse o motivo do vermelho, e é o certo. O bloco `false ? '' : git diff ^1` reproduz o código da rodada anterior e prova isso.
- **O conflito resolvido à mão** (`linhas.test.ts:156-174`) tem asserção nos dois sentidos. Sem marca, a mensagem cita "Junta as telas". Com `(correção …)` e `Revisões:`, o código de saída é 0. As mutações que trocam `--cc` por `diff-tree` puro ou por `-m` derrubam esse teste ou o de duas linhas.
- **A correção avulsa segue cobrando o merge limpo** (`linhas.test.ts:206-214`). A mutação que liga `--cc` também fora da spec fica vermelha.
- **As três correções exigidas foram feitas:**
  - o `naSpec` trata o merge com `diff-tree -r --cc` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/linhas.ts:347`);
  - o teste usa o histórico real;
  - a seção "Mutações" ganhou quatro blocos sobre a linha `proprios` e um sobre `let ultimoCorrige = false`.
- **O caso do commit comum também está protegido.** Ele passa a usar `diff-tree --cc`. Se esse comando não listasse os arquivos de um commit não-merge, o teste de aceitação e o de "sem marca" falhariam.
- `npx vitest run tools/processo/linhas.test.ts`: 26 de 26 verdes.
- Não há `.skip`, mock nem chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Uma mutação de `--cc` para `-c` em `linhas.ts:347` sobreviveria. A diferença entre os dois aparece num merge que resolve o conflito juntando trechos de cada lado sem escrever linha nova. Com `--cc`, esse merge passa sem ser cobrado. Vale decidir qual dos dois se quer e prender a escolha com um caso desse tipo, ou escrever no documento que o `--cc` foi escolhido de propósito.
2. "Último commit com código" depende da ordem por data do `rev-list --reverse`. O comando é rodado logo depois da correção e o `HEAD` sai sempre primeiro, então hoje não há falha. Mas se o `conferir` rodar depois de um encontro que veio após a correção, o commit de tarefa da linha pode ter data mais nova e a recusa seria indevida. O caso cabe numa linha do `TODO.md`, junto da decisão já registrada sobre a correção só de documento.

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-18 11:33:52 · `tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (é correção de processo; a decisão de deixar de fora a correção só de documento está no documento e no `TODO.md`)
Portão local: carimbo válido

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/linhas.ts:346`: com duas linhas, o `conferir` na spec ainda recusa quando as duas linhas mexeram no mesmo arquivo de código. `git diff-tree -r --cc --name-only` não lista só o que o merge resolveu à mão. Ele lista todo arquivo que difere de todos os pais, e entra aí o arquivo que o git juntou sozinho, sem conflito, quando cada lado mexeu num trecho diferente.
   - **Reproduzi com git 2.56.** Um lado muda a linha 2 de `f.ts`, o outro muda a linha 9, e o merge sai limpo. Mesmo assim, `diff-tree -r --cc --name-only --no-commit-id HEAD` devolve `f.ts`. Esse merge cai em `!marcado` na linha 348, com "leva código sem (tarefa N.0) nem (correção <slug>)".
   - **O caso é comum.** Duas tarefas em paralelo que registram algo no mesmo `app.module.ts`, num índice de rotas ou num `index.ts` de `packages/shared` produzem esse merge limpo. O mesmo vale para o merge que o `encontro` fecha sozinho quando o conflito é só no `tasks.md` (linhas 395-398), se o mesmo merge também juntou código dos dois lados.
   - **O documento afirma o contrário.** `tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md:52-53` diz que, num merge, entra "só o que ele resolveu" e que "o merge limpo não tem nenhum e passa".
   - **O teste não pega.** O `it` "com duas linhas, o merge que o encontro faz não derruba a conferência…" (`tools/processo/linhas.test.ts:176-197`) usa `a.ts` e `b.ts`, dois arquivos diferentes.
   - **Correção exigida:**
     - Nos commits de merge, com `naSpec` ligado, cobrar só a diferença entre o merge gravado e o que o git juntaria sozinho. `git show --remerge-diff --format= --name-only <sha>` faz isso: no mesmo repositório de teste devolveu vazio para o merge limpo, e ele lista o arquivo resolvido à mão. Outra saída é comparar com a árvore de `git merge-tree --write-tree <pai1> <pai2>`.
     - Acrescentar em `linhas.test.ts` um `it` com duas linhas que mexem em trechos diferentes do mesmo arquivo de código, `encontro` nas duas e depois um `(correção …)` na spec. O `conferir` tem de aceitar.
     - Declarar no documento uma mutação que troque o cálculo de volta por `--cc` e deixe esse `it` vermelho.
     - Corrigir a frase das linhas 52-53 do documento.

Correções da 1ª rodada:
- **Merge do encontro tratado com `naSpec` ligado.** Feito em parte. O merge entre arquivos diferentes passa e o merge resolvido à mão continua cobrado. Falha o merge limpo no mesmo arquivo (bloqueante 1).
- **"Último commit com código" ignorando os merges sem conteúdo próprio.** Mesma ressalva: um merge limpo no mesmo arquivo ainda conta como commit com código e é recusado antes de chegar à linha 350.
- **`it` com `andares()`, `partida` e `encontro` em duas linhas, com mutação declarada.** Feito, em `linhas.test.ts:176-197`, com duas mutações declaradas.
- **"Causa" e "Correção" do documento atualizadas.** Feito, mas a frase das linhas 52-53 está errada pelo bloqueante 1.

Recomendações:
- A linha `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/linhas.ts:346` passa de 180 colunas com o ternário. Um `const arquivosDoCommit = (sha) => …` com os dois ramos separados lê melhor, e as mutações continuam aplicáveis sobre ele.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-18 11:42:43 · `tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A correção não tem Tech Spec, e a mudança está descrita na seção "Correção" do documento.
Portão local: carimbo válido. O `conferir` respondeu "portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)".
Bloqueantes: nenhum.

As quatro correções da 2ª rodada foram feitas.

1. **Cálculo do merge.** Em `tools/processo/linhas.ts:321-326`, a nova `arquivosDoCommit` usa, com `naSpec` ligado, `git show --remerge-diff --format= --name-only` no lugar do `diff-tree --cc`. Conferi no git 2.56 num repositório à parte:
   - merge limpo que juntou trechos diferentes do mesmo `f.ts`: saída vazia;
   - commit comum: lista `f.ts`;
   - merge que acrescenta à mão um arquivo que nenhum dos lados tinha: lista `h.ts`, e portanto é cobrado.
2. **Teste do mesmo arquivo.** `tools/processo/linhas.test.ts:520-549` tem duas linhas que mexem nas linhas 2 e 9 do mesmo `apps/web/comum.ts`, `encontro` nas duas, um merge confirmado e o arquivo juntado conferido. Depois vem um `(correção …)`, e o `conferir` aceita.
3. **Mutações.** As de `--cc` e de `-c` estão em `tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md:139-151`, apontando para esse `it`.
4. **Frase corrigida.** A frase das linhas 52-53 foi reescrita em `tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md:56-61`, e explica por que o `--cc` errava nos dois sentidos.

Além do que foi pedido:
- **Merge que ficou com um lado só.** Há um `it` novo (`linhas.test.ts:505-518`) com a mutação dele para `--cc`. Com `--cc` o arquivo some da lista e o merge passaria, então a mutação deixa o `it` vermelho.
- **Correção avulsa.** A mutação `const saida = true` derruba a segunda asserção de "fora da spec…" (`linhas.test.ts:582-589`): o merge limpo na branch de correção continua cobrado.
- **Contagem.** O documento diz "dez `it` novos", e o bloco `conferir na branch da spec` tem dez.

Recomendações:
- Na linha 47 do documento, o `it` de "trechos diferentes" aparece como "vermelho com `--cc`, `-c` ou o diff contra o primeiro pai". Só as duas primeiras mutações apontam para ele. A do diff contra o primeiro pai está declarada no `it` de duas linhas com `a.ts` e `b.ts`. Vale ajustar a frase ou declarar a terceira mutação nesse `it`.
- A dependência da ordem por data do `rev-list --reverse` ficou registrada como "a rever" no `TODO.md`. Ela deve virar correção própria antes de o `conferir` rodar numa spec com encontro depois da correção.

## test-engineer · 3ª rodada · APROVADO · 2026-10-18 11:42:49 · `tasks/correcoes/2026-10-18-conferir-aceita-correcao-na-spec.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** na branch `spec/…`, uma correção com código depois das tarefas é aceita.
- **Borda: merge limpo do mesmo arquivo.** Duas linhas mexem em trechos diferentes do mesmo arquivo, e o git junta o arquivo sozinho no encontro. Esse merge não pode ser cobrado. Foi este caso que derrubou a 2ª rodada.
- **Borda: conflito resolvido com um lado só.** O merge resolve o conflito ficando com um lado (`checkout --ours`) e descarta código do outro. Ele tem de ser cobrado.
- **Borda: conflito resolvido à mão.** Sem marca é recusado, com marca e `Revisões:` passa.
- **Permissão:** fora da spec, na correção avulsa, a marca de tarefa não vale e o merge limpo continua cobrado.
- **Isolamento entre escolas:** não se aplica, a mudança é ferramenta de processo e não toca dado de escola.
- **Concorrência:** não se aplica, o `conferir` lê o git e não grava nada.

**Cobertos:** todos, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--correcao2026-10-18-codigo-de-processo/tools/processo/linhas.test.ts`. Rodei o arquivo: 28 testes passaram.
- **Merge limpo do mesmo arquivo (linhas 520-549):** usa `partida` e `encontro` de verdade e confere duas coisas. Existe um merge no histórico, e o arquivo comum termina com os dois trechos. Os arquivos agora são os mesmos nos dois lados, que era o defeito apontado pelo revisor-geral. As mutações `--cc` e `-c` deixam o teste vermelho pelo motivo certo, porque com elas o arquivo é listado no merge e o merge passa a ser cobrado.
- **Conflito resolvido com um lado só (linhas 505-518):** a asserção cita a mensagem e o título do merge ("Junta as telas"). Com `--cc` o arquivo some da lista, o merge passa e a correção é aceita. É o vermelho pelo motivo certo.
- **Correção avulsa (linhas 574-598):** com `const saida = true`, o merge limpo do caso `comMerge` deixa de ser cobrado, e a asserção sobre "Merge branch 'lado'" fica vermelha. A troca de `naSpec` está presa por esse bloco.
- **Cláusulas novas:** cada uma tem bloco em "Mutações", nos dois ramos de `arquivosDoCommit` e na seleção do ramo. A mutação que cobra o merge pelo diff contra o primeiro pai (`${sha}^1`) continua presa ao `it` de duas linhas.

As duas recomendações da minha 2ª rodada foram tratadas. A da escolha entre `-c` e `--cc` ficou superada, porque o cálculo passou a `--remerge-diff`, e há blocos de mutação para as duas opções. A da ordem por data do `rev-list --reverse` foi registrada no `TODO.md`, com o motivo.

**Bloqueantes:** nenhum. Não há `.skip`, nem mock escondendo a regra: os testes rodam em repositórios git reais.

**Recomendações:**
1. **Versão mínima do git.** `--remerge-diff` só existe a partir do git 2.36. A máquina tem 2.56 e a esteira roda em `ubuntu-24.04`, então hoje funciona. Num git antigo, o `git()` lançaria exceção e o `conferir` cairia com stack trace, em vez de uma recusa tipada. Vale uma frase no comentário de `arquivosDoCommit` (`tools/processo/linhas.ts:316-320`) ou uma checagem de versão.
2. **Conflitos de outro tipo.** Com `--name-only`, o `--remerge-diff` pode imprimir linhas "remerge CONFLICT" que não são caminho de arquivo, em conflito que não é de conteúdo (apagado de um lado e alterado do outro, ou renomeado). Essas linhas seriam lidas como "código" e o merge seria cobrado sem razão. O teste do merge limpo, com conflito no `tasks.md`, mostra que no conflito de conteúdo isso não acontece. Um caso de arquivo apagado de um lado e alterado do outro prenderia o comportamento, ou um filtro que aceite só linhas que sejam caminho de arquivo.
3. **Código enfiado no merge sem conflito.** Um merge que acrescenta um arquivo de código novo, sem conflito nenhum, é cobrado pelo `--remerge-diff`, e isso está certo. Mas nenhum `it` prende esse comportamento. É cobertura extra, não bloqueia.
