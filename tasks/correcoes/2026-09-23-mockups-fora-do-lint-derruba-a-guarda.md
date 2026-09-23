# Correção — o protótipo de mockups/ entrou na develop fora do lint e derrubou a guarda

**Origem:** esteira run 35862917162 (commit `e5a2fea`, job `verificar`)
**Subagentes obrigatórios:** nenhum guardião pela natureza (só `tools/guardas/`, fora de `PASTAS_DE_CODIGO`; não toca dado, tela do produto, IA nem infra)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Depois do merge do branch `mockups/interface` na `develop` (23/09/2026), o job `verificar` ficou
vermelho num teste só:

```
FAIL |unidade| tools/guardas/guardas.test.ts > configuração das guardas > nenhum código versionado fica fora do lint, exceto as fixtures de violação
AssertionError: expected [ 'mockups/scripts/foto.mjs', …(143) ] to deeply equal []
```

E2e, integração e infra passaram na mesma execução.

## Causa

O merge trouxe `mockups/` (144 arquivos de código do protótipo de interface) e a linha
`'mockups/**'` no `ignores` do `eslint.config.mjs`. O teste da guarda exige que todo código
versionado passe pelo lint, com uma única exceção declarada (as fixtures de violação). A pasta
ficou fora do lint sem estar declarada como exceção no teste que vigia exatamente isso. Antes do
merge rodei `lint` e `typecheck`, mas não a unidade, que é onde a guarda vive.

Tirar a pasta do `ignores` não é saída: o protótipo quebra regra de propósito (sem teste, sem
orçamento de JS, `localStorage`, `Math.random`, peças coladas sem revisão de licença), e é assim
que ele serve para desenhar. A decisão, do Joaquim em 23/09/2026, foi manter a pasta na `develop`
e declarar a exceção na guarda.

## Teste que reproduz

`tools/guardas/guardas.test.ts › configuração das guardas › nenhum código versionado fica fora do
lint, exceto as fixtures de violação`: vermelho na esteira e localmente, com a lista dos 144
arquivos de `mockups/`.

## Correção

A exceção passa a ser declarada no teste, com o motivo, e ganha duas cercas, porque exceção sem
cerca vira buraco:

- o teste do lint agora exclui explicitamente `mockups/`, junto das fixtures, e continua exigindo
  que **todo o resto** passe pelo lint
- `o protótipo de mockups/ não é workspace do monorepo`: nenhum glob dos `workspaces` da raiz casa
  com `mockups`, conferido com o `path.matchesGlob` do Node. Um workspace que englobe a pasta a
  levaria para o build e para o `npm run typecheck --workspaces`
- `nada fora de mockups/ aponta para o protótipo`: nenhum arquivo versionado fora da pasta, que não
  seja `.md`, contém a palavra `mockups`, com exceção dos três que declaram a exceção
  (`eslint.config.mjs`, `vitest.config.ts` e o próprio `guardas.test.ts`). É pela palavra, e não por
  um padrão de import, porque alias do Vite, `paths` do tsconfig, `import.meta.glob`, `new URL(...)` e
  template literal chegam ao protótipo sem escrever `from '.../mockups/'` (1ª rodada do
  `test-engineer`). Vale para `.json`, `.css`, `.html` e `.yaml` também
- `não existe symlink versionado`: um link para `mockups/src` levaria o protótipo para dentro do
  produto sem que o caminho aparecesse no `git ls-files`
- o `vitest.config.ts` passa a ignorar `mockups/**`, para um `*.test.ts` do protótipo não rodar na
  suíte da raiz

A cópia manual de um arquivo de `mockups/` para o `apps/web` não é coberta por estas cercas, e não
precisa: o arquivo copiado passa a estar fora da pasta, e o lint e as guardas da raiz valem para
ele como para qualquer outro.

Prova das cercas, por mutação, com o arquivo restaurado depois de cada uma:

- `apps/web/src/mutacao-temp.ts` com `import { cn } from '../../../mockups/src/lib/utils'` →
  vermelho, apontando o arquivo (1ª versão da cerca, e de novo na atual)
- `"mockups"` acrescentado aos `workspaces` do `package.json` → `o protótipo de mockups/ não é
  workspace do monorepo` vermelho
- alias `'@p': '../../mockups/src'` no `apps/web/vite.config.ts` → `nada fora de mockups/ aponta
  para o protótipo` vermelho, apontando `apps/web/vite.config.ts`
- `paths` `'@p/*': ['../../mockups/src/*']` no `apps/web/tsconfig.json` → o mesmo teste vermelho,
  apontando `apps/web/tsconfig.json`

Com a correção, `tools/guardas/guardas.test.ts` passa inteiro (68 testes).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-23 11:32:18 | 2026-09-23 11:32:51 | `test-engineer` | 1 | APROVADO | a88ab070362b9e48a |
