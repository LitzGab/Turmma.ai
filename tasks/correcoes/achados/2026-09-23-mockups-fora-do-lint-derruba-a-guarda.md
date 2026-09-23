# Achados das revisões — `tasks/correcoes/2026-09-23-mockups-fora-do-lint-derruba-a-guarda.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-23 11:30:41 · `tasks/correcoes/2026-09-23-mockups-fora-do-lint-derruba-a-guarda.md`

VEREDITO: REPROVADO

**Cenários exigidos**
1. O caminho feliz: com a exceção, a guarda do lint volta a ficar verde e continua pegando todo código fora de `mockups/` e das fixtures.
2. Um arquivo `mockups/` aninhado em outro diretório, por exemplo `apps/web/src/mockups/x.ts`, não pode herdar a exceção.
3. Não pode surgir um workspace que englobe o protótipo.
4. Nenhum caminho de resolução pode levar código de `mockups/` ao produto. Os caminhos são: `import`/`export ... from`, `import()` dinâmico, `require`, re-export, alias do Vite, `paths`/`references` do tsconfig, `import.meta.glob`, `new URL(..., import.meta.url)`, template literal e symlink versionado.
5. Nenhuma asserção pode passar sempre.

**Cobertos**
- 1 está coberto. A asserção `codigo.length > 20` impede a lista vazia.
- 2 está coberto. `startsWith('mockups/')` só vale para a raiz, e `'mockups/**'` no flat config também só vale para a raiz. Se alguém alargar o ignore para `**/mockups/**`, o teste do lint pega.
- 3 está coberto pela igualdade exata dos `workspaces`. A mutação documentada prova isso.
- 4 está coberto só em parte. Testei o regex e ele pega `import ... from`, `export * from`, import multilinha, `import type`/`import("...")` e `import '...'`.
- 5 está ok. As duas cercas novas têm mutação documentada, e nenhuma asserção passa sempre.

**Bloqueantes**
- `tools/guardas/guardas.test.ts:261-264`: a cerca de importação deixa passar os caminhos que o próprio pedido lista. Rodei o regex contra amostras e ele não pega nenhum destes:
  - o alias do Vite (`alias: { '@p': resolve(__dirname, '../../mockups/src') }`). O `import` que usa `'@p/...'` também não pega, porque não tem `mockups/` no texto;
  - `paths` e `references` de `tsconfig*.json`. O arquivo é `.json`, e `ehCodigo` o descarta antes de ler;
  - `import(\`../mockups/x\`)`, porque o regex só aceita aspas simples ou duplas;
  - `import.meta.glob('../../mockups/**')`;
  - `new URL('../mockups/x.ts', import.meta.url)`;
  - um symlink versionado (modo `120000`) apontando para `mockups/src`, importado como `./proto/x`. Esse caso escapa das duas guardas, porque o `git ls-files` não lista o que está dentro do link.

  É justamente o furo que o comentário da linha 238 e o documento da correção dizem estar fechado ("o que impede isso de virar buraco").

  **Correção exigida:** trocar o regex de importação por uma checagem pela string `mockups`, que é simples e robusta. A checagem vale para todo arquivo versionado fora de `mockups/` que não seja `.md`, e não só para os arquivos de código: `.json`, `.css`, `.html` e `.yaml` entram também. A lista de exceções é explícita e curta: `eslint.config.mjs` e o próprio `guardas.test.ts`. Hoje só esses dois arquivos citam `mockups`, então a troca não quebra nada.

  Somar a isso uma asserção de que nenhuma entrada do `git ls-files -s` com modo `120000` tem alvo dentro de `mockups/`. Pode ser mais simples ainda: nenhum symlink versionado fora de uma lista vazia.

  Documentar no arquivo da correção duas mutações novas:
  - um alias de Vite em `apps/web/vite.config.ts` → vermelho;
  - um `paths` em `apps/web/tsconfig.json` → vermelho.

**Recomendações**
- `tools/guardas/guardas.test.ts:257`: a igualdade exata dos `workspaces` prova a cerca, mas acopla o teste a qualquer workspace novo e legítimo. É mais fiel ao nome do teste afirmar que nenhum glob de workspace casa com `mockups/`, com o mesmo `minimatch`/`path.matchesGlob` que o npm usaria.
- O comentário da linha 238 aponta para `mockups/README.md`, e `eslint.config.mjs:16` aponta para `mockups/LEIAME.md`. Os dois existem. Vale unificar a referência de onde está escrita a regra "nada de lá é copiado para `apps/web`".
- O projeto `unidade` do `vitest.config.ts` inclui `**/*.test.ts` e só exclui `node_modules`/`dist`/`e2e`. Um `*.test.ts` que apareça no protótipo rodaria na suíte da raiz. Não vaza nada para o produto, mas vale acrescentar `mockups/**` aos `ignorados` para a exceção ficar coerente.
- A cópia manual de arquivo de `mockups/` para `apps/web` não é coberta por nenhum teste. Nesse caso o arquivo copiado passa pelo lint da raiz, então o risco fica coberto pela guarda geral. Vale uma linha no documento dizendo isso, para ninguém achar que a cerca de importação cobre a cópia.

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/guardas.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-23-mockups-fora-do-lint-derruba-a-guarda.md`, `/home/joaquimdp/Documentos/git/Educa.ia/eslint.config.mjs`

## test-engineer · 1ª rodada · APROVADO · 2026-09-23 11:32:51 · `tasks/correcoes/2026-09-23-mockups-fora-do-lint-derruba-a-guarda.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: todo código versionado fora de `mockups/` e das fixtures passa pelo lint.
- O protótipo não pode ser workspace do monorepo, inclusive por um glob largo.
- Nenhum arquivo fora da pasta pode apontar para o protótipo por um caminho que não seja um import: alias do Vite, `paths` e `references` do tsconfig, `import.meta.glob`, `new URL(..., import.meta.url)` ou template literal.
- Não pode existir symlink versionado.
- Um `*.test.ts` do protótipo não pode rodar na suíte da raiz.
- Casos escolares, permissão e isolamento de tenant não se aplicam: é uma correção de guarda de repositório.

**Cobertos:** todos os acima. As três correções exigidas na 1ª rodada foram feitas:
- A checagem agora é pela palavra `mockups` em todo arquivo versionado fora da pasta que não seja `.md`, com três exceções explícitas (`tools/guardas/guardas.test.ts:263-270`). Conferi por fora: os únicos arquivos versionados fora da pasta que citam `mockups` são exatamente os três da lista (`eslint.config.mjs`, `vitest.config.ts` e o próprio `guardas.test.ts`). Nenhum workflow da esteira, `.gitignore` ou `package.json` escapou.
- Há asserção de que não existe symlink versionado (modo `120000`, `tools/guardas/guardas.test.ts:273-278`), e ela confere o status de saída do git antes de olhar a lista.
- As mutações de alias em `apps/web/vite.config.ts` e de `paths` em `apps/web/tsconfig.json` estão documentadas como vermelhas, apontando o arquivo.

Os workspaces agora são conferidos com `matchesGlob`, e há uma asserção de que a lista não está vazia, o que impede o teste de passar sem conferir nada. Rodei o arquivo e ele passa com 68 testes. Não há `.skip` nem `.only`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Os três arquivos da lista de exceções ficam totalmente livres de checagem. Um alias ou um `include: ['mockups/**']` acrescentado depois ao próprio `vitest.config.ts` passaria sem ninguém ver. Vale conferir nesses três arquivos que `mockups` aparece só nas linhas esperadas: o `ignores` do eslint e o `ignorados` do vitest.
2. Nenhum teste prova que `mockups/**` continua em `ignorados` no `vitest.config.ts`. Se a linha sair, um teste do protótipo volta a rodar na raiz sem nenhum aviso. Uma asserção curta sobre a configuração resolve.
3. A checagem pela palavra compara letra por letra. Um caminho montado por concatenação (`'mock' + 'ups'`) passaria. É um caso adversarial e aceitável; basta registrar no documento como limite conhecido.
4. Pequena inconsistência de texto: o comentário do `eslint.config.mjs` cita `mockups/LEIAME.md`, e o do teste cita `mockups/README.md`. Vale usar o nome do arquivo que realmente existe.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/tools/guardas/guardas.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/vitest.config.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-23-mockups-fora-do-lint-derruba-a-guarda.md
