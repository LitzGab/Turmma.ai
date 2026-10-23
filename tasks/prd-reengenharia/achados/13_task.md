# Achados das revisões — `tasks/prd-reengenharia/13_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 23:24:43 · `tasks/prd-reengenharia/13_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As cinco divergências da tarefa estão registradas em `onda-1a.md`, na T8, "Como ficou (13.0)". Pela R34, as ondas fazem parte da Tech Spec, e a prática já tem precedente na 12.0, na 43.0 e na 44.0. Esta spec não tem `cenarios.md`. São elas:
- quatro regras na segunda passada, em vez de três;
- a conferência em `catraca.ts`;
- o `git mv` herdando a supressão;
- a comparação com o HEAD valendo só no portão;
- `max-lines-per-function` desligado também em `**/test/**` e `e2e/**`.

Nenhum código de produção foi cortado. O corte das funções da linha de base fica fora do escopo, como a tarefa pede.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
1. O procedimento de quem move um arquivo está incompleto em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-1a.md:192-194` e na mitigação do `techspec.md` §13. Depois de um `git mv`, o `eslint .` reprova o caminho novo, porque a supressão continua presa ao caminho antigo. Quem move precisa rodar `--suppress-all` e depois `--prune-suppressions`; só `--prune-suppressions` não basta. As tarefas da onda 2, que movem pastas, vão esbarrar nisso. Vale escrever o comando exato.
2. A contagem da supressão é por arquivo e por regra, não por função. Trocar uma função longa por outra dentro do mesmo arquivo continua invisível para a catraca e para o ESLint. É limite do mecanismo do ESLint, e vale uma linha no "Como ficou" para ninguém achar que está coberto.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/catraca.test.ts:197-200` roda `npm run lint` inteiro dentro da suíte de unidade. O lint passa a rodar duas vezes no portão e na esteira (o próprio passo de lint e esse teste), com prazo de 240 s, e pode ficar instável se outro teste de unidade gravar arquivo temporário dentro do repositório durante a execução. A tabela da tarefa pede o caso, mas vale avaliar se o passo de lint do portão já cobre essa prova.
4. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/eslint.config.mjs:144`, o comentário diz "aninhamento 4 reprova", mas o que reprova é aninhamento acima de 4 (o limite é 4, e 5 reprova).
5. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/catraca.ts:84-86`, `renomeadosDesdeOHead` não confere o `status` nem o `error` do `spawnSync`. Sem git no PATH, `resultado.stdout` vem `null` e a função quebra com `TypeError`, sem uma mensagem que diga o motivo.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 23:25:37 · `tasks/prd-reengenharia/13_task.md`

**VEREDITO: REPROVADO**

Há um bloqueante: a leitura do HEAD não está provada. O resto da tabela tem teste, e os testes falhariam sem a regra.

**Cenários exigidos:**
- **Fronteiras na produção:** complexidade 10 passa e 11 reprova, 80 linhas de código passam e 81 reprovam (branco e comentário não contam), aninhamento 4 passa e 5 reprova.
- **Teste e e2e:** a função de 81 linhas passa em arquivo de teste, inclusive nos ajudantes de `test/` e `e2e/__fixtures__`. No spec de e2e, 800 linhas passam e 801 reprovam.
- **Nível:** as quatro regras estão em `error`.
- **Comentários:** `eslint-disable` e `/* eslint ... */` não furam a segunda passada.
- **Arquivo da linha de base:** passa na segunda passada por causa de `applySuppressions`.
- **A base:** cita só regra de tamanho, a soma é igual ao `TETO` (uma a mais e uma a menos reprovam), a troca no mesmo commit reprova, e arquivo novo com supressão reprova.
- **Caminhos do git:** arquivo movido com `git mv` e arquivo movido com `mv` solto.
- **Poda:** a supressão sem uso reprova o CLI, e `npm run lint` fica verde.
- **Permissão, isolamento e concorrência:** não se aplicam. É ferramenta de lint e não toca dado de escola.

**Cobertos:** as 16 linhas da tabela, cada uma com teste citado pelo nome. Rodei `npx vitest run --project unidade tools/guardas/catraca.test.ts tools/guardas/guardas.test.ts`: 196 passaram. Conferi as fixtures de fronteira:
- `linhas.ts` tem 80 linhas de código (102 linhas menos 11 brancos e 11 comentários) contra 81.
- `complexidade.ts` tem 10 contra 11.
- `aninhamento.ts` tem 4 contra 5.

Toda cláusula nova do diff tem bloco de mutação, nos quatro arquivos: `eslint.config.mjs`, `index.mjs`, `eslint-das-guardas.ts` e `catraca.ts`. A exceção é a do bloqueante abaixo. Não há `.skip`, teste comentado nem mock que esconda a regra.

**Bloqueantes:**
1. **A leitura "do HEAD" não se distingue da leitura do índice do git.**
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/catraca.test.ts:151-152` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/catraca.ts:75`.
   - **O que está errado:** o teste "sem o arquivo no HEAD, a leitura é undefined; com ele, é a linha de base do commit, e não a da árvore" só muda o arquivo na árvore, com `writeFileSync`. Ele não roda `git add`. Se `'HEAD:eslint-suppressions.json'` virar `':eslint-suppressions.json'`, a leitura vem do índice, que ainda tem `count: 2`, e o teste continua verde.
   - **Por que importa:** no portão, quem já fez `git add` da base teria a comparação de `atual` com ela mesma. Ela passaria sempre, e a troca de uma função longa por outra no mesmo commit não seria pega.
   - **Correção exigida:**
     - No teste, rodar `git(pasta, 'add', ARQUIVO)` depois do `writeFileSync` da linha 151 e antes da asserção.
     - Na seção "Mutações" do `13_task.md`, acrescentar o bloco abaixo, citando esse teste:
       ```
       arquivo: tools/guardas/catraca.ts
       - 'HEAD:eslint-suppressions.json'
       + ':eslint-suppressions.json'
       ```

**Recomendações:**
- **Custo do teste do `npm run lint`** (`catraca.test.ts:197-200`). Ele roda o lint inteiro dentro da unidade: 33 s aqui, com prazo de 240 s, o que dá folga suficiente. Mas repete o lint que o portão e a esteira já rodam, e corre ao mesmo tempo que os outros testes de unidade. Se algum deles gravar arquivo temporário dentro do repositório, o lint pode pegar esse arquivo e ficar vermelho de vez em quando. Vale considerar mover esse teste para fora da unidade.
- **`--name-status` sem bloco** (`catraca.ts:84`). O teste do `git mv` o pegaria, porque compara o mapa exato, mas falta o bloco de mutação.
- **Caso do `mv` solto** (`catraca.test.ts:164-167`). Ele confere só o mapa vazio. Vale conferir também que `conferirCatraca`, com a base do HEAD daquele repositório, reprova o caminho novo. Hoje isso só está provado com a base inventada (`catraca.test.ts:114`).

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 23:33:02 · `tasks/prd-reengenharia/13_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

Esta rodada conferiu o diff r1→r2 e o que ele afeta.

- **Correção que o `test-engineer` exigiu:** feita. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/catraca.test.ts:152-153`, o teste agora passa a base nova para o índice (`git add`) antes de ler. Assim o teste falha se a leitura for do índice (`:eslint-suppressions.json`) e não do `HEAD:`. A mutação nova declarada em `13_task.md` cobre exatamente esse caso. O alvo existe uma única vez, em `tools/guardas/catraca.ts:75`.
- **Segunda mutação nova:** vale. Ela tira o `--name-status` de `catraca.ts:84`. Sem ele, o git devolve o patch em vez da lista de arquivos, o mapa de renomeados fica vazio e a asserção de rename do `git mv` fica vermelha.
- **Caso do `mv` sem `git add`:** agora o teste também confere que o conferidor recusa a supressão no caminho novo. Antes ele só olhava o mapa vazio. O texto esperado bate com a regra que o `onda-1a.md` descreve.
- **Recomendações aplicadas:** as três estão no diff (o comando exato de quem move arquivo e a nota "contagem por arquivo e por regra" em `onda-1a.md`, e o comentário "aninhamento acima de 4" em `eslint.config.mjs`). O procedimento `--suppress-all` seguido de `--prune-suppressions` está correto. A poda sozinha não criaria a supressão do caminho novo.
- **Recomendações sem aplicar:** as duas estão na tabela de `13_task.md` com motivo concreto, não com promessa. A terceira linha da tabela (o §13 do `techspec.md`) também tem destino declarado. Aceitas.

Recomendações:
- O campo `teste:` da primeira mutação nova cita só o começo do nome do caso ("sem o arquivo no HEAD, a leitura é undefined"). Funciona se o `mutacoes.ts` casa por trecho do nome, e o carimbo válido indica que casou. Ainda assim, citar o nome inteiro evita que a mutação passe a valer para outro caso que comece igual.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 23:33:05 · `tasks/prd-reengenharia/13_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da 1ª rodada. Esta rodada confere a correção exigida e o diff de r1 para r2 (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/.processo/ordens/diff-13_task-r1-r2.txt`).

**Cobertos:**
- **Correção 1, feita.** O teste está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/catraca.test.ts:146-155` e agora roda `git(pasta, 'add', ARQUIVO)` depois do `writeFileSync`.
  - Com isso, o índice tem `count: 9` e o HEAD tem `count: 2`. Se a leitura trocar `'HEAD:eslint-suppressions.json'` por `':eslint-suppressions.json'`, ela devolve a contagem 9 e a asserção `toEqual({... count: 2 })` falha. O teste agora separa a leitura do HEAD da leitura do índice, e não só da árvore.
  - O bloco de mutação foi acrescentado em `13_task.md`. O texto `- 'HEAD:eslint-suppressions.json'` aparece uma vez só, entre aspas, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tools/guardas/catraca.ts:75`. O comentário da linha 73 não tem aspas e não colide.
  - O nome do caso, "sem o arquivo no HEAD, a leitura é undefined", vai para o `-t` de `mutacoes.ts:180`, que casa por trecho do nome. Ele acha o teste.
- **Recomendação da 1ª rodada aplicada.** O bloco de mutação do `--name-status` (`catraca.ts:84`) cita o teste "git mv é achado como rename". Sem `--name-status`, a saída do git não traz o tab, `antigo` e `novo` ficam vazios, o mapa sai vazio e a asserção da linha 161 falha.
- **Recomendação da 1ª rodada aplicada.** O caso do `mv` sem `git add` agora também confere `conferirCatraca` (linhas 170-173), com a mensagem exata de que o arquivo não tem supressão no HEAD.
- **Resto do diff.** No `eslint.config.mjs` mudou só um comentário ("acima de 4"). O `onda-1a.md` ganhou dois textos: o procedimento de quem move arquivo com supressão, e o limite "a contagem é por arquivo e por regra, não por função". As três recomendações recusadas na tabela trazem motivo e destino. Nada disso leva cláusula de código nova sem bloco de mutação.
- **Execução.** `npx vitest run tools/guardas/catraca.test.ts -t "HEAD e o rename"` passou: 2 testes, os 16 do resto do arquivo ficaram de fora pelo filtro.

**Bloqueantes:** nenhum.

**Recomendações:**
- O teste "sem o arquivo no HEAD..." ainda junta dois casos: o repositório sem HEAD, que dá `undefined`, e o HEAD diferente do índice. Separar em dois `it` deixaria a mutação apontar para um caso só. Não bloqueia.
