# Correção — o `npm audit` acusa avisos novos no `vite` 8.3.0 e em `body-parser`, `brace-expansion` e `source-map-js`, e a `guarda:dependencias` derruba o portão da 10.0

**Origem:** portão da tarefa 10.0 do harness (`guarda:dependencias`), na branch `spec/harness--l2`; a falha está fora dos arquivos da 10.0
**Subagentes obrigatórios:** `infra-guardian`
<!-- O guardião do PEDIDO do Orquestrador é `infra-guardian`. A correção altera 3 arquivos fora de `tasks/` (dois `package.json` e o
     lock), abaixo do limite de 5 do passo 5 do `corrigir`, e não toca `.github/`, `tools/ci/` nem `tools/processo/`: `revisor-geral`
     não é obrigatório. `test-engineer` é obrigatório em toda correção. -->

## Sintoma

`npm audit --audit-level=high` (a etapa "dependência de produção com vulnerabilidade grave" da `guarda:dependencias`, que roda com
`--omit=dev`) reprova o portão com avisos que a base do npm ganhou:

```
vite         8.3.0 - 8.3.2   high   (direta: launch-editor, cross origin script execution, server.fs.allow, ?vite-wasm-instance)
body-parser  2.0.0 - 2.3.0   high   GHSA-27r3-jxmh-p828 (DoS por bytes após corpo comprimido)
brace-expansion 4.0.0 - 5.0.11 high GHSA-q2hr-2g5m-vwhr, GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p
source-map-js 1.0.0 - 1.2.1  high   GHSA-68fv-2mgg-jv7q
10 vulnerabilities (6 moderate, 4 high)
```

Só o `body-parser` está no `--omit=dev` (arrasta o NestJS/Express da API); o resto é ferramenta de desenvolvimento.

## Fora desta correção

`tasks/prd-harness/{10_task,cenarios,techspec}.md`, `tasks/prd-harness/achados/{indice,10_task}.md`,
`tools/processo/{comando-git,hook-revisoes,portao}.ts`, `tools/processo/{hook-portao,revisoes}.test.ts`, `knip.json` e
`tools/guardas/knip.test.ts`: a tarefa 10.0 em curso. Ficam na árvore; não entram na revisão nem no commit desta correção.

## Causa

Nenhuma mudança nossa: a base de avisos do npm ganhou os GHSA acima para versões que o `package-lock.json` fixava (`vite` 8.3.0 exato
em dois `package.json`; `body-parser` 2.3.0, `brace-expansion` 5.0.9 e `source-map-js` 1.2.1 transitivas). De nenhuma tarefa: o portão
da 10.0 só a encontrou primeiro.

**O aviso alcança o nosso uso?** `body-parser` está no caminho de toda requisição da API (Express sob o NestJS), então a correção é
trocar a versão. Como a troca alcança toda requisição, o limite de corpo (regra 80, item 3) foi conferido e **não mudou**: o padrão do
`body-parser` 2.4.0 continua 100 kb (`node_modules/body-parser/lib/utils.js:46`) e `apps/api/src` não configura o parser. O `vite` só roda em desenvolvimento e na build do `apps/web`, mas é dependência direta e o aviso é grave: sobe também.

## Teste que reproduz

A conferência da esteira, `npm run guarda:dependencias` (etapa `npm audit --audit-level=high --omit=dev`):

- **Antes (vermelho), sobre `995ff72`:** `body-parser 2.0.0 - 2.3.0 … 1 high severity vulnerability`; sem `--omit=dev`, 4 graves.
- **Depois (verde):** `found 0 vulnerabilities` na etapa de produção; `npm audit --audit-level=high` completo não acusa mais nenhum
  grave (sobram 6 moderados, todos do `esbuild` antigo do `drizzle-kit`, que só sai com `--force` e uma versão que quebra, e ficam
  fora do limiar `high`). `npm ls` não acusa versão `invalid`; `npm run typecheck` passa nos seis workspaces.

Não entra teste novo: a mudança é de versão de dependência, sem código nosso alterado, e a guarda é o teste que a esteira já roda.

## Correção

- `vite` 8.3.0 → **8.3.5**, exato como estava (regra do repositório: versão exata), em `package.json` da raiz e `apps/web/package.json`.
  É a versão que o próprio `npm audit` indica, dentro do major 8.
- `package-lock.json`: `vite` 8.3.5, `body-parser` 2.4.0, `brace-expansion` 5.0.12, `source-map-js` 1.2.2, e o que o `vite` 8.3.5 puxa
  junto: `rolldown` e os binários dele por plataforma 1.2.8 → 1.2.15, `@oxc-project/types` 0.149.0 → 0.155.0, `postcss` 8.5.28 → 8.5.31,
  `nanoid` 3.3.19 → 3.3.20 e `qs` 6.16.0 → 6.16.1 (esta, do `body-parser`). Nada fora do major.
- O `npm audit fix` (com e sem `--package-lock-only`) quebra com `Cannot read properties of null (reading 'edgesOut')` no arborist do
  npm 10.9.8, ao montar o conjunto de peers do `vitest`. O caminho que funcionou, sem `--force`: editar a versão do `vite` nos dois
  `package.json`, `npm install --package-lock-only`, `npm update body-parser brace-expansion source-map-js --package-lock-only` e
  `npm ci` para sincronizar o `node_modules`.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-10-23 20:16:36 | 2026-10-23 20:17:00 | `test-engineer` | 1 | APROVADO | ac0ca7134a3ba3699 |
| 2026-10-23 20:16:34 | 2026-10-23 20:17:00 | `infra-guardian` | 1 | APROVADO | a80fed004c79c84b4 |
