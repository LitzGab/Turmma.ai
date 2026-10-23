# Achados das revisões — `tasks/prd-harness/2_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 16:03:08 · `tasks/prd-harness/2_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

Como conferi que nada mudou além do que o documento declara: li as declarações de topo do `revisoes.ts` do HEAD e as dos quatro módulos novos pela árvore do TypeScript, tirei a palavra `export` e comparei o texto de cada uma.
- Com os dois nomes renomeados aplicados ao arquivo antigo (`levarOQueOAddPrepara` para `levarOsDoAdd` e `levarOQueOCommitDaTodos` para `levarTodosSeCommitA`), o corpo de toda função, constante e tipo é igual. Nenhuma ficou para trás e nenhuma aparece em dois módulos.
- Só cinco nomes passaram a ser exportados: `mudouDeVerdade`, `comTrava`, `branchAtual`, `arquivosPreparados` e `EntradaHook`. São os cinco auxiliares que o documento declara.
- Nada no repositório usa os nomes antigos.
- O `revisoes.test.ts` muda só no caso "sem o compilador instalado", que agora copia e importa o `caducidade.ts`, com as mesmas asserções. A divergência está no `prd.md` RF13 e no `cenarios.md` B. Os outros arquivos de teste não foram tocados.
- O `estado.ts` e o `esteira.ts` importam só dos módulos novos. O `hook-revisoes.ts` continua importando pelo `revisoes.ts`, que reexporta tudo, então não precisava mudar.

Recomendações:
1. `tools/processo/hook-revisoes.ts:1`: o comentário ainda diz "A lógica e o teste ficam em revisoes.ts". Agora a lógica está nos quatro módulos. Os comentários em `tools/ci/etapas-de-guarda.ts:119`, `tools/ci/e2e-que-cita-literal.ts:4` e `tools/processo/sequencia-do-portao.ts:80` também apontam para o `revisoes.ts`. Ainda funcionam pela reexportação, mas o nome certo agora é `portao.ts`.
2. `tasks/prd-harness/2_task.md:84`: a linha "**Sem mutação:** só move código…" vem logo antes de 18 blocos de mutação. A partir da tarefa que trata o RF17, uma é a alternativa da outra. Convém reescrever como uma nota de que o movimento de código não leva mutação própria, para não confundir quem ler o `mutacoes.ts` depois.
3. A divergência "`PAPEIS_DO_TIME` e `BRANCHES_PROTEGIDAS` ficam no `comando-git.ts`, e o `portao.ts` reexporta" está registrada só no `2_task.md`. Não bloqueia: a `techspec.md` não diz em que módulo a constante fica, e a divergência é em relação à própria tarefa. Ainda assim, uma linha na `techspec.md` §2 (linha do `revisoes.ts`) evitaria que as tarefas 9.0 a 14.0 procurassem a constante no `portao.ts`.
4. `tools/processo/harness/particao.test.ts:3` diz "de 1.400 linhas", mas o arquivo do HEAD tinha 1.263. O mesmo número aparece em `2_task.md:9`.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/caducidade.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/documento-de-revisao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/particao.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-revisoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/2_task.md

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 16:03:18 · `tasks/prd-harness/2_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **RF13, caminho feliz:** os testes atuais de `revisoes.test.ts`, `hook-portao.test.ts`, `estado.test.ts`, `esteira.test.ts` e `linhas.test.ts` passam sem alteração. A única mudança permitida é o arquivo que o caso "sem o compilador instalado" copia, que passa a ser o `caducidade.ts`, com as mesmas asserções.
- **Guarda:** o `estado.ts` ou o `esteira.ts` voltando a importar `./revisoes.ts` fica vermelho.
- **Contorno:** quem contorna a guarda é acusado, um caso por forma, incluindo `import()` e `export … from`.
- **Borda da guarda:** o alvo ausente fica vermelho, e o alvo lido como vazio também.
- **Borda da guarda:** comentário e texto que citam `./revisoes.ts` não são import.
- **O hook carrega:** o comando real do `settings.json` continua de pé.
- **Permissão, isolamento e concorrência:** não se aplicam. A tarefa só move código, sem regra nova, sem dado de escola e sem operação nova.

Cobertos:
- **Sem alteração:**
  - O `git diff` toca só `revisoes.test.ts:944-945` (troca de `revisoes.ts` por `caducidade.ts`, asserções iguais). O `hook-portao.test.ts` e os outros testes listados não aparecem no diff.
  - `npx vitest run --project unidade tools/processo/` deu 11 arquivos e 394 testes verdes.
- **Corpo das funções intacto:** comparei as linhas do `revisoes.ts` do HEAD com as dos quatro módulos novos. A única diferença é a esperada:
  - os cabeçalhos e os imports;
  - o `export` em `mudouDeVerdade`, `comTrava`, `EntradaHook`, `branchAtual` e `arquivosPreparados`;
  - os dois nomes trocados (`levarOsDoAdd` e `levarTodosSeCommitA`);
  - o comentário de `avaliarMutacoes`.

  Nenhum `export` do antigo some: o `revisoes.ts` reexporta os quatro módulos com `export *`.
- **Import proibido numa cópia:** `particao.test.ts › quem contorna é acusado: tools/processo/estado.ts: import nomeado`. Mais os três blocos que voltam os imports reais para `./revisoes.ts`, com o teste `os arquivos de hoje passam`.
- **Uma forma por caso:** a tabela `FORMAS` tem 17 formas (incluindo `import()`, reexportação nomeada, reexportação de tudo e tipo de `import()`), rodadas para os dois alvos. Os ramos de `ehImport` têm cada um o seu bloco, pelo teste `cada forma de import conta: …`.
- **Alvo ausente:** `o alvo que não existe`, com bloco.
- **Alvo vazio:** `o alvo que a conferência lê como vazio`, com bloco.
- **Falso positivo:** `o que não é import do revisoes.ts passa: comentário, texto que o cita e os módulos novos`.
- **O hook carrega:** `hook-portao.test.ts:97 › hook são, Bash comum: sai 0 e não diz nada no stdout`, existente e verde.
- **Mutações:** "Sem mutação" tem motivo válido para a parte que só move. As cláusulas novas estão só no `particao.test.ts`, e cada uma tem bloco. Os quatro blocos dos auxiliares da correção anterior apontam para o módulo novo.
- **Testes proibidos e IA:** não há `.skip`, teste comentado nem mock. A tarefa não envolve IA.
- **Antes do `npm ci`:** só o `caducidade.ts` carrega o `typescript`, e só como `import type` mais `createRequire`. Os outros três módulos importam apenas `node:` e módulos do próprio conjunto. O caso "sem o compilador instalado" continua provando que o hook roda antes do `npm ci`.

Bloqueantes: nenhum.

Recomendações:
1. **"Só reexporta" sem teste.** Nenhum teste prova que o `revisoes.ts` só reexporta. Uma função nova colada nele de volta passa sem nada ficar vermelho. Como as tarefas 9.0 a 14.0 dependem dessa divisão, um caso no `particao.test.ts` que leia o `revisoes.ts` e aceite só `export * from` resolveria. O cenário não é exigido pelo `cenarios.md` RF13, por isso não bloqueia.
2. **Hook quebrado só por um módulo.** `hook-portao.test.ts:84` quebra só o `revisoes.ts`. Com a partição, um erro de sintaxe no `portao.ts` ou no `comando-git.ts` também derruba o hook, pelo mesmo mecanismo. Hoje nenhum teste o exercita. Vale um caso por módulo numa tarefa que possa tocar o `hook-portao.test.ts`.
3. **Mínimo de imports frouxo.** `MINIMO_DE_IMPORTS` é 3 e 1, contra 5 e 2 imports reais. Apagar um import real não acende nada. Está aceitável como trava contra o parser que lê zero, mas pode ficar mais justo.
4. **Nome de teste abreviado.** O bloco de mutação cita `os arquivos de hoje passam`, mas o nome completo é `os arquivos de hoje passam, e a conferência lê os imports que espera`. O portão aceitou. Citar o nome inteiro evita ambiguidade se aparecer outro teste com o mesmo prefixo.
5. **Os dois `break` de `corpoDaSecao`.** Os dois que sobrevivem à mutação já estão em "Recomendações sem aplicar". Confirmo que faltam os testes de seção vazia seguida de outra seção e de parágrafo seguido de linha em branco, para uma correção própria.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/2_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/particao.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/caducidade.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/comando-git.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/documento-de-revisao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/portao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/hook-portao.test.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 16:15:09 · `tasks/prd-harness/2_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/particao.test.ts:196`: a linha que monta a mensagem de falha passa de 150 colunas. Ela é citada literalmente em dois blocos de mutação. Se o lint de largura de linha um dia for ligado, isso quebra os dois blocos ao mesmo tempo. Extrair o número da linha para uma constante local (`const linha = ...`) deixaria a mensagem e a mutação legíveis. Não bloqueia.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/particao.test.ts:195`: o `?? ''` em `textoDe(comando.moduleSpecifier)` faz um `export * from` sem string literal virar `''`. A falha sai como "não reexporta ./x.ts", e não como "comando inesperado". A guarda continua vermelha nesse caso, então é só a mensagem que fica menos clara.

O diff desde a 1ª rodada só mexe em teste e em texto: o caso novo que prova que o `revisoes.ts` só reexporta, o comentário do `hook-revisoes.ts`, a nota no lugar de "Sem mutação", a contagem de 1.263 linhas e o nome completo do teste nos três blocos de mutação. Nenhum desses pontos toca a lógica dos quatro módulos.

- **Reexportação:** o `revisoes.ts` atual tem 12 linhas e só os quatro `export * from`, que é o que o caso novo exige.
- **Contagem:** o 1.263 confere com o `revisoes.ts` do HEAD.
- **Recomendações não aplicadas:** as que ficaram de fora estão no `TODO.md`, na seção "Da X7 (harness), fora dela", e na tabela "Recomendações sem aplicar" do documento, cada uma com destino.
- **Correções exigidas:** a 1ª rodada não exigiu nenhuma, então não havia correção a conferir.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 16:15:20 · `tasks/prd-harness/2_task.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada, só o diff desde a 1ª):
- O caso novo que prova que o `revisoes.ts` só reexporta. Precisa do caminho feliz, de cada forma de código colado de volta no arquivo, de um módulo que sumiu e do arquivo ausente.
- Cada cláusula nova com o seu bloco de mutação.
- Os três blocos antigos com o nome completo do teste.
- A nota que substitui o "Sem mutação".
- O número de linhas corrigido.

Cobertos:
- **Caminho feliz:** o teste "o arquivo de hoje passa: um export * from para cada um dos quatro módulos, e mais nada" roda contra o `revisoes.ts` real, que tem só os quatro `export *`.
- **Código colado de volta:** são dez formas em `it.each(INTRUSOS)`: função, constante exportada, constante local, interface, import, reexportação nomeada, `export * as`, `export type *`, `export default` e chamada solta. Cada caso confere a falha exata, com o tipo e a linha, e não só que alguma falha apareceu.
- **Módulo que sumiu:** o teste "o export * from de um módulo que sumiu: vermelho, dizendo qual" apaga o `./caducidade.ts`.
- **Arquivo ausente:** o teste "o arquivo que não existe: vermelho, e não verde por não ter o que ler" apaga o `revisoes.ts` da cópia.
- **Mutações:** os 8 blocos novos chegam cada um à sua cláusula. Conferi como cada um fica vermelho:
  - sem a checagem de `exportClause`, a reexportação nomeada passa a ser aceita;
  - sem `isTypeOnly`, o `export type *` passa a ser aceito;
  - sem `isExportDeclaration`, a função é aceita como reexportação, porque `textoDe(undefined)` devolve `null`, que vira `''`;
  - sem o retorno de arquivo ausente, o `createSourceFile` recebe `null` e lança erro;
  - sem o `else falhas.push`, a chamada solta passa;
  - com a linha `+ 2`, o número da linha sai errado;
  - sem o laço de `REEXPORTADOS`, o módulo que sumiu não é acusado;
  - com `push('')`, o caso feliz acusa os quatro módulos.
  
  Nenhum bloco fica vermelho pelo motivo errado.
- **Itens 3, 4 e 5 da ordem anterior:** a nota está no lugar do "Sem mutação", o documento e o cabeçalho do teste dizem 1.263 linhas, e os três blocos antigos citam o nome completo, que bate com `particao.test.ts:152`.
- **Recomendações que não foram aplicadas:** o `hook` quebrado por módulo, `MINIMO_DE_IMPORTS` e os dois `break` de `corpoDaSecao` estão em "Recomendações sem aplicar", cada uma com destino, e também no `TODO.md`.
- **O resto:** não há `.skip`, mock nem IA. Rodei `npx vitest run tools/processo/harness/particao.test.ts`: 68 de 68 passaram.

Bloqueantes: nenhum.

Recomendações:
1. Os blocos novos citam o teste por um trecho do nome: "o arquivo de hoje passa", "de um módulo que sumiu: vermelho" e "o arquivo que não existe: vermelho". O portão casou os nomes, mas a 1ª rodada pediu o nome completo nos blocos antigos, e o mesmo critério vale para estes.
2. O teste "módulo que sumiu" só tira o `./caducidade.ts`. Se outro item sair da constante `REEXPORTADOS`, como `./portao.ts`, nenhum teste fica vermelho. Um `it.each` sobre os quatro módulos, tirando um de cada vez, fecha isso. É dado de configuração e não cláusula, por isso fica como recomendação.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/harness/particao.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/revisoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/2_task.md
