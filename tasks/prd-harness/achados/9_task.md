# Achados das revisões — `tasks/prd-harness/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 16:58:23 · `tasks/prd-harness/9_task.md`

```
VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.ts:597-603: o `linhasAcrescentadas` não zera o `arquivo` no `diff --git`. Por padrão (`core.quotePath`), o git põe entre aspas o nome com acento: `+++ "b/apps/.../configura\303\247\303\243o.tsx"`. Esse cabeçalho não casa com a regex da linha 602, e as linhas do trecho seguinte ficam atribuídas ao arquivo anterior. Hoje não há nome com acento em `apps/` nem em `packages/`, e a saída só informa. Mesmo assim, zere `arquivo = null` no `diff --git`, ou passe `-c core.quotePath=false` e leia o caminho entre aspas.
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.ts:627: a `EXPRESSAO_REGULAR` dá falso positivo em JSX. Em `<Foo a={x}/><Bar/>`, o trecho `}/><Bar/` casa como expressão regular. A lista do `--faltando` vai acusar `regex` em tela sem condição nenhuma.
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts:116: o `.md` pedido na linha de comando entra no carimbo como foi digitado, e o hook compara esse texto com o caminho relativo do commit (`documentoDoCarimbo === documento`, em `mutacoes.ts:524` e seguintes). Quem roda `--tarefa ./tasks/...md` ou passa o caminho absoluto recebe "o último portão não foi o de ...". O problema já existia no `mutacoes.documento`, mas agora alcança também a tarefa sem bloco. Normalize com `relative(raiz, resolve(raiz, pedido))`.
- Em rodadas de correção, se o documento da tarefa e o da correção estiverem alterados juntos, o portão pede o `.md` explicitamente. A mensagem já diz isso. Vale avisar no `/corrigir` (17.0/18.0) para não virar surpresa.
```

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 17:00:35 · `tasks/prd-harness/9_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
- **RF17, portão:** produção alterada sem bloco nem linha fica vermelha. Linha vazia ou com o `<motivo>` do modelo, vermelha. Com motivo, ou com bloco, verde.
- **RF17, o que é produção:** teste, `.d.ts`, `vite.config.ts` e o que está fora de `src` não exigem nada.
- **RF17, documento:** é achado pela alteração e não por ter bloco. Com dois alterados e sem o `.md`, nenhum.
- **RF17, commit:** pelo `portao()` do hook, com a conferência recebendo os arquivos alterados. Carimbo de outro documento, sem documento ou ausente é recusado.
- **RF17, como processo:** vermelho antes das suítes e sem carimbo; com a linha, carimbo com `documento`; ambíguo pede o documento; o portão completo não cobra.
- **RF5:** um teste por operador; linha citada por bloco, inclusive como contexto, e por dois blocos; os casos que não são condição (teste, `.d.ts`, import, aspas, comentário); a leitura do diff; o `--faltando` como processo (sai 0 e 2, importado, sem a flag).
- **Concorrência:** não se aplica. É ferramenta local por checkout, sem operação disputada.

Cobertos: todos os itens da tabela têm teste, citado pelo nome, com uma exceção (ver Recomendações). Os 210 testes de `mutacoes.test.ts` e `revisoes.test.ts` passam. O caso de processo do `portao-local.ts` leva 2,8 s, com teto de 30 s. Não há `.skip`. Os mocks são só a conferência injetada no `portao()`, usada para provar o repasse, e depois o `avaliarMutacoes` de verdade.

Bloqueantes:

1. **A âncora `^` da linha "Sem mutação" não tem bloco nem teste** (`tools/processo/mutacoes.ts:551`).
   - O regex é `/^\*\*Sem mutação:\*\*[ \t]*(.*?)[ \t]*$/gm`. A flag `m` está provada, porque o `comLinha` põe a linha no meio do texto. A `^` não está: sem ela, a regra citada no meio de um parágrafo vale como motivo.
   - Exemplo real: a linha 9 do próprio `9_task.md` cita a regra entre crases. Sem a `^`, o trecho capturado é "<motivo>`, e o hook", que não é o placeholder e passa como `'motivo'`.
   - Todo documento que repete a regra no Objetivo se liberaria sozinho, e o teste `a linha "Sem mutação" vale com motivo` (`mutacoes.test.ts:366`) continua verde.
   - Correção: acrescentar a esse teste o caso da regra citada no meio da frase, que dá `'ausente'`, e um bloco `- …matchAll(/^\*\*Sem mutação…` / `+ …matchAll(/\*\*Sem mutação…` apontando para ele.

2. **O repasse dos arquivos alterados no `conferir` e no `revisores` não tem bloco nem teste** (`tools/processo/portao-local.ts:69` e `:92`).
   - Trocar `arquivosAlterados(raiz)` por `[]` nas duas linhas compila e não deixa nenhum teste vermelho. Nenhum teste roda esses dois subcomandos: `portao-local.test.ts` não os cita.
   - Eles são o que o `executar-task`, o `revisar-tarefa` (a Mesa) e o `revisor-geral` rodam para saber "o que o commit ainda encontraria". Com o repasse fora, eles respondem "nada pendente" ou "válido" enquanto o hook recusa o commit pelo RF17.
   - O bloco equivalente do `portao.ts` existe; estes dois faltam.
   - Correção: um caso de processo no repositório de teste, com produção na árvore e documento sem bloco nem linha. `revisores <doc>` e `conferir <doc>` devem sair 1 com a mensagem "a árvore altera código de produto". E um bloco por linha, com `+ … []`.

3. **Duas condições do leitor do diff estão sem bloco e sem motivo declarado** (`tools/processo/mutacoes.ts:603` e `:606`).
   - São o `if (novo) arquivo = novo[1] ?? null` e o `if (cabecalho) {`. Nenhum dos dois está entre os blocos nem no parágrafo "Sem bloco, de propósito".
   - O `if (cabecalho)` trocado por `if (false)` zera a leitura do diff, e `lê do diff só as linhas acrescentadas` cai. Falta só o bloco.
   - Para o `if (novo)`: ou um bloco (`if (true)` quebra no `novo[1]` nulo), ou o motivo no parágrafo. A alternativa `\/dev\/null` do regex do `+++` não muda o resultado, porque arquivo apagado não tem linha `+`.

Recomendações:
- **Linha da tabela sem prova concreta.** A tabela promete que "o outro documento, com bloco e não alterado, não serve". Hoje isso só vale porque o `documentoDaTarefa` recebe apenas a lista de alterados; nenhum teste tem um documento assim na árvore. Para ficar provado, basta commitar um `7_task.md` com bloco na base do teste de processo (`revisoes.test.ts:524`). Ou então reescrever a linha da tabela.
- **Linha "Sem mutação" dentro de bloco cercado.** Um exemplo dentro de ` ``` ` no documento contaria como a linha. Vale um caso de teste, ou uma frase dizendo que é aceito.
- **Produção só apagada fica fora do RF17.** O `arquivosAlterados` pula os arquivos com estado `D`, então uma tarefa que só apaga código de produção não é cobrada. Parece intencional; vale uma linha na Tech Spec §5(d).
- **Tipo duplicado no teste.** `mutacoes.test.ts:571` redeclara `LinhaNovaParaTeste`; dá para importar o tipo `LinhaNova`, que já é exportado.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/prd-harness/9_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/revisoes.test.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 17:14:18 · `tasks/prd-harness/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`, saída 0)
Bloqueantes: nenhum

As duas correções que a Mesa pediu desta rodada estão feitas:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.ts:601`: o `diff --git` agora zera o `arquivo`. O teste do nome entre aspas prova a mudança, e há um bloco de mutação que remove o `arquivo = null`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts:116-118`: o `.md` pedido ao portão agora é convertido para caminho relativo antes de ir ao carimbo. Os casos `./tasks/…` e caminho absoluto têm teste de processo e dois blocos de mutação, um para o `resolve` e outro para o `relative`.

O bloco antigo `if (pedido) return pedido` saiu do documento, e o novo bloco equivalente o substitui. Os testes novos de `conferir` e `revisores` cobrem código que já existia desde a 1ª rodada, em `portao-local.ts:69` e `:92`, e não acrescentam comportamento. As duas recomendações que não foram aplicadas ficaram registradas com destino em "Recomendações sem aplicar".

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/prd-harness/cenarios.md` (RF17): três decisões estão só na `techspec.md` §5(d) e não aparecem no `cenarios.md`, embora a tarefa já as teste. Vale acrescentá-las ali:
  - a linha `Sem mutação` dentro de um bloco cercado conta;
  - a frase que só cita a regra no meio do texto vale como `ausente`;
  - o caminho do `.md` é normalizado.
- `portao-local.ts:116-118`: um `.md` absoluto fora da raiz passa no `existsSync` e chega ao carimbo como `../…`, e esse caminho nunca vai coincidir com o que o hook compara. Recusar caminho fora da raiz, ou avisar quando isso acontece, fecharia esse caso. Hoje não há quem chame o portão assim.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 17:15:03 · `tasks/prd-harness/9_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
1. A linha "Sem mutação" só vale no começo da linha. A regra citada no meio de uma frase dá `ausente`.
2. `conferir` e `revisores`, rodados como processo, recebem os arquivos alterados. Com produção na árvore e um documento sem bloco nem linha, os dois saem 1 com "a árvore altera código de produto". Com a linha e o portão verde, `conferir` sai 0.
3. As duas condições do leitor do diff (`if (novo)` e `if (cabecalho)`) têm cada uma o seu bloco.
4. Os itens novos da tabela: o `.md` pedido como `./tasks/…` ou como caminho absoluto, com outro documento alterado; o nome de arquivo entre aspas no diff; e a linha "Sem mutação" dentro de bloco cercado, que conta.

**Cobertos:**

- **Correção 1.** Feita.
  - `tools/processo/mutacoes.test.ts:375` testa a regra citada no meio da frase e espera `ausente`.
  - O bloco tira a `^` do regex de `mutacoes.ts:551`. Sem a âncora, o trecho capturado é "<motivo>`, e o hook recusa.", que não é o placeholder. A função devolve `motivo`, e o teste fica vermelho pelo motivo certo.
  - O caso do bloco cercado está asserido como `motivo`, e a Tech Spec registra essa escolha.
- **Correção 2.** Feita.
  - O teste novo está em `tools/processo/revisoes.test.ts:609`: "o conferir e o revisores veem a produção sem bloco como o hook vê".
  - Há um bloco para cada repasse: `portao-local.ts:69` e `:92`.
  - Conferi que a mensagem de `revisores` vem só da linha 92. O `avaliarPortao` não chama `avaliarMutacoes` por conta própria, porque a conferência é passada pelo hook. Então, com `[]` no lugar dos arquivos alterados, o `toMatch` da mensagem fica vermelho, ainda que o `status` continue 1 pelos revisores que faltam.
- **Correção 3.** Feita.
  - O `if (true)` faz o `novo[1]` estourar sobre a linha `---`. O `if (false)` zera a leitura do diff. Os dois blocos apontam para "lê do diff só as linhas acrescentadas".
  - O parágrafo "Sem bloco, de propósito" agora declara só o `?? null`, com o motivo escrito.
- **Cláusulas novas do diff.** Todas têm bloco:
  - `arquivo = null` no `diff --git`, com o teste do nome entre aspas. O `+++ "b/…"` não casa com o regex de `:605`, então sem a linha o arquivo seguinte herda o anterior.
  - `resolve` trocado por `join`: o caminho absoluto deixa de existir, e com o `8_task.md` também alterado o portão não acha o documento.
  - `relative(...)` trocado por `pedido`: o carimbo guarda `./tasks/…` e o `toMatchObject` falha.
- **Tabela de testes.** As quatro linhas novas de `9_task.md` têm teste citado pelo nome.
- **Proibições.** O diff não tem `.skip`, nem teste comentado, nem mock de coisa nossa. Os dois subcomandos rodam como processo, sobre um repositório git de verdade.
- **Execução.** `npx vitest run tools/processo/mutacoes.test.ts tools/processo/revisoes.test.ts` passou: 212 testes verdes.

**Bloqueantes:** nenhum.

**Recomendações:**
- O bloco antigo `- if (pedido) return pedido`, que apagava a linha, saiu do documento. A cláusula "o documento pedido vence" continua provada por outro caminho: o bloco `resolve`→`join` faz o pedido absoluto sumir, e o teste novo cai, porque `8_task.md` e `9_task.md` estão alterados juntos. Um bloco que apague a linha inteira (`- if (pedido) return relative(raiz, resolve(raiz, pedido))`) deixaria a prova direta.
- No teste novo, o primeiro uso de `revisores`, com a linha presente, só assere `not.toMatch(/código de produto/)`. Asserir também o `status` deixaria claro que o 1 dali vem dos revisores que faltam, e não do RF17.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/portao-local.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/mutacoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/revisoes.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/prd-harness/9_task.md
