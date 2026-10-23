# Correção — a integração e a infra da esteira caem com `Failed to resolve entry for package "@educa/shared"`

**Origem:** esteira run 39896272821 em `83cc03a` (`gh run view 39896272821 --log-failed`): os jobs `integração` e `infra`.
**Subagentes obrigatórios:** `test-engineer`, `infra-guardian`, `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: `infra-guardian` (e o `test-engineer`, de toda correção). O `revisor-geral` entra
     porque a correção cria um arquivo em `tools/ci/` (passo 5 de `corrigir`: toca `.github/`, `tools/ci/` ou `tools/processo/`). -->

## Sintoma

`npm run ci:integracao` e `npm run ci:infra` morrem antes do primeiro teste, com `No test files found` seguido de
`Unhandled Error: Failed to resolve entry for package "@educa/shared"` (`ERR_RESOLVE_PACKAGE_ENTRY_FAIL`), com a pilha
`packages/nucleo/src/contexto/contexto.ts:1` ← `packages/nucleo/src/log/logger.ts:2`. O job `verificar` da mesma esteira
estava vermelho por outro motivo, a supressão órfã de `compose.ts`, que a correção `poda-supressao-orfa` já tratou (`3c3d582`).

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

Falha da **tarefa 25.0** (`7aecd99`, linha 1), vista só na esteira: `contexto.ts` trocou `import type { PapelDeUsuario }` por
`import { ErroDeInvariante, type PapelDeUsuario } from '@educa/shared'` para tipar os `throw`. Um import só de tipo some na
compilação; o de valor passa a ser resolvido de verdade.

O `globalSetup` da integração e da infra (`tools/testes/integracao.setup.ts`) importa `criarLogger` de `nucleo/log/logger.ts`,
que importa `contexto.ts`. Ele roda no runner do Vitest, que resolve pelo environment `__vitest__`, e o Vitest 5 monta esse
environment com as condições padrão: ele **não herda** o `resolve.conditions` nem o `ssr.resolve.conditions` do topo do
`vitest.config.ts`. Sem a condição `source`, o `exports` de `packages/shared/package.json` cai no `default`
(`./dist/index.js`). A esteira não constrói o `dist`, e a falha é a da entrada inexistente. Quem já rodou `npm run build` tem
o `dist` e não vê nada: foi o caso da linha 1, e por isso o portão da 25.0 passou. Os testes de dentro do projeto (a
unidade, a integração propriamente dita) resolvem para `src`, porque o servidor do projeto herda a condição; só o
`globalSetup` não herdava, e até a 25.0 nada de valor de `@educa/shared` estava na sua cadeia de imports.

## Teste que reproduz

`tools/ci/resolucao-do-shared.test.ts` › `@educa/shared resolve para o src no projeto integracao` e `… no projeto infra` (um caso
por projeto, a ordem da Mesa, rodada 1, item 1: quem roda o `globalSetup` são esses dois, e não o projeto raiz). Cria o Vitest
com o `vitest.config.ts` real (`createVitest`, sem rodar teste) e, em cada projeto achado pelo nome em `vitest.projects`,
resolve `@educa/shared` a partir de `contexto.ts` pelo environment `__vitest__`, o mesmo do `globalSetup`; o resultado tem de
ser `packages/shared/src/index.ts`. O comentário do arquivo diz que ele lê API interna do Vitest e do Vite (item 2). Vermelho antes
(sem `dist` na árvore, a resolução devolveu `undefined`), verde depois. Reproduzido também de ponta a ponta, com o `dist` do
shared fora da árvore: `npx vitest run --project integracao tools/ci/compose.int.test.ts` caía com o erro da esteira antes da
correção e passou (13 testes) depois.

## Correção

Uma linha em `vitest.config.ts`: `environments: { __vitest__: { resolve: { conditions: condicoes } } }`, com o comentário do
porquê. Não muda o que o teste de dentro do projeto já fazia, e a condição `module` continua de fora, pelo motivo que o
arquivo já diz. Nenhuma mudança em `compose`, em Dockerfile nem na esteira: a esteira continua sem construir o `dist`, que é
o que a configuração promete ("sem depender de `dist` construído antes").

## Mutações

```mutacao
arquivo: vitest.config.ts
teste: tools/ci/resolucao-do-shared.test.ts › @educa/shared resolve para o src no projeto
   ssr: { resolve: { conditions: condicoes } },
-  environments: { __vitest__: { resolve: { conditions: condicoes } } },
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (2ª), test-engineer (2ª) | "Montar uma vez num `beforeAll`, para os dois casos, corta o custo pela metade." / "Hoje leva 247 ms no total. Se ficar mais pesado, dá para criar a instância uma vez num `beforeAll`." | Recusada: o custo medido pelo próprio test-engineer é 247 ms no total, e `beforeAll` com `vitest.close()` no `afterAll` troca o isolamento de um caso por outro por uma economia que não aparece |
| infra-guardian (1ª), revisor-geral (1ª) | medir a duração do teste na esteira; se pesar, mover de projeto | O test-engineer mediu 247 ms para os dois casos (2ª rodada): a recomendação perde o motivo. O Orquestrador só confere a duração na esteira do próximo push |
| test-engineer (1ª) | registrar na validação que a esteira verde nos jobs `integração` e `infra` é o que confirma a correção | Destino: a validação da spec (Validador), com o run da esteira no commit que levar esta correção |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 01:49:48 | 2026-10-23 01:50:00 | `infra-guardian` | 1 | APROVADO | a2552707c6dfb3faa |
| 2026-10-23 01:49:49 | 2026-10-23 01:50:09 | `revisor-geral` | 1 | APROVADO | aabc78ad1f270e2f8 |
| 2026-10-23 01:49:47 | 2026-10-23 01:50:16 | `test-engineer` | 1 | APROVADO | ac407adfdc7d9f2f0 |
| 2026-10-23 01:55:03 | 2026-10-23 01:55:21 | `revisor-geral` | 2 | APROVADO | a24e66d35b40f9538 |
| 2026-10-23 01:55:00 | 2026-10-23 01:55:21 | `test-engineer` | 2 | APROVADO | ae2d7bccc92109920 |
