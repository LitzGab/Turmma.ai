# Correção — o e2e alcança `@educa/shared` pelo nome do pacote e quebra na esteira, onde o `dist` não existe

**Origem:** esteira run 37144244963 (jobs "e2e (compose completo e Playwright)" e "verificar (tipos, lint e guardas,
segredo, dependências, unidade)"), sobre o commit `caa1071` (tarefa 17.0 da A1)
**Subagentes obrigatórios:** nenhum guardião pela natureza (só fixture do e2e e guarda em `tools/ci/`; não muda código de produção, a esteira nem o ambiente)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Os dois jobs caíram com o mesmo erro, ao carregar os specs do Playwright:

```
Error: Cannot find module '/home/runner/work/Turmma.ai/Turmma.ai/node_modules/@educa/shared/dist/index.js'
imported from /home/runner/work/Turmma.ai/Turmma.ai/apps/api/src/sala/codigo-da-sala.ts
```

- e2e: `npm run ci:e2e` não chegou a rodar teste nenhum.
- verificar: `tools/ci/esteira.test.ts › esteira do GitHub (.github/workflows/ci.yml) › o teto do e2e cobre a suíte que
  existe…`, que conta os casos com `npx playwright test --list`, recebeu status diferente de 0.

O portão local da 17.0 passou nas cinco suítes porque a máquina de desenvolvimento tem um `packages/shared/dist` antigo,
de um build anterior; a esteira começa do clone limpo e não constrói o `dist` antes do Playwright.

## Causa

A 17.0 acrescentou a `e2e/__fixtures__/sessao.ts` o import de `apps/api/src/sala/codigo-da-sala.ts`, para gravar no
banco um acesso da sala com link e código conhecidos. Esse módulo da API importa `@educa/shared` **pelo nome do pacote**.
O `exports` de `packages/shared/package.json` aponta o import comum para `./dist/index.js`, e o `src` só vale com a
condição `source`, que o Vitest (`vitest.config.ts`) e o `tsc` (`customConditions`) ligam e o carregador do Playwright
não liga. Por isso a convenção do `e2e/` é importar o shared pelo caminho do `src` (`../packages/shared/src/...`), e os
outros módulos da API que o e2e importa (`token-do-convite.ts`, `hash-do-token.ts`) não importam pacote nenhum.

Nada prendia a convenção: um import transitivo pelo nome do pacote passa em qualquer máquina com `dist` e só cai na
esteira, depois do commit.

## Teste que reproduz

`tools/ci/playwright.test.ts › projetos do Playwright (playwright.config.ts) › nada que o e2e carrega importa um pacote
@educa/* pelo nome: o Playwright o resolveria para o dist, que a esteira não constrói`. Segue os imports relativos a
partir de cada `.ts`/`.tsx` de `e2e/`, também dentro de `apps/` e `packages/`, nas formas que o carregador do Playwright
aceita (`.js` que é `.ts`, sem extensão, pasta com `index`), e reprova o arquivo alcançado que importa `@educa/...` sem
ser só de tipo (import estático, só de efeito, `export ... from` e `import()`), e o import relativo que não resolve.
Vermelho com o fixture da 17.0, apontando `apps/api/src/sala/codigo-da-sala.ts → @educa/shared`; não depende de existir
`dist` na máquina.

A varredura tem dois testes próprios, sobre uma árvore em pasta temporária (`a varredura dos imports`): o import pelo nome
a três saltos, por import sem extensão, `.js`, pasta com `index` e `.tsx`, com o `import type` fora; e o import relativo
que não resolve, que reprova em vez de ser pulado (1ª rodada do `test-engineer`).

## Correção

`e2e/__fixtures__/sessao.ts` deixa de importar `codigo-da-sala.ts` e monta o acesso com as peças sem pacote: o
alfabeto, o tamanho e a normalização do código de `packages/shared/src/sala/acesso.ts` (pelo caminho do `src`, como o
resto do e2e), o tamanho do token de `apps/api/src/sessao/hash-do-token.ts`, e o HMAC-SHA256 em base64url do
`node:crypto`. Se a conta divergir da API, a página pública não acha o código e o `turma-publica.spec.ts` reprova: a
cópia é verificada pelo próprio e2e que a usa.

A recomendação de citar a cópia num comentário de `apps/api/src/sala/codigo-da-sala.ts` ficou de fora: o comentário do
fixture já diz de onde vêm as contas, o `turma-publica.spec.ts` reprova se elas divergirem, e a correção não toca código
de produção.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-03 16:21:38 | 2026-10-03 16:22:30 | `test-engineer` | 1 | REPROVADO | a510e8285aad78940 |
| 2026-10-03 16:45:25 | 2026-10-03 16:45:50 | `test-engineer` | 2 | APROVADO | a5d52db75c5549028 |
| 2026-10-03 16:56:10 | 2026-10-03 16:56:26 | `test-engineer` | 3 | APROVADO | a1c3801d54747fc1d |
