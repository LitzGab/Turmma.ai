# Tarefa 25.0 — Todo `throw` de produção é tipado, e o lint barra o resto

**Funcionalidade:** reengenharia · **Depende de:** 13.0
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Os 92 `throw new Error('…')` de produção viram erro tipado, e `guardas/erro-tipado` reprova o próximo.

## Contexto necessário

- `techspec.md` §11 (regra 00)
- `onda-1b.md`, "RF13 — Dependências e `throw`" (O `throw`), §3 e §5
- `prd.md` RF13
- `.claude/rules/00-arquitetura.md` (item 9) e `20-lgpd-menores.md` (item 11)
- Código: `packages/nucleo/src/erro/erro-de-dominio.ts` e `filtro-global.ts`; `tools/guardas/regras-log.mjs` (molde de
  regra); `ArgumentoInvalido` em `apps/api/src/ops/comando.ts:14`, `uso.ts:37` e `sessao-sintetica.ts:19`
- Busca: `rg -l "throw new Error\(" apps/*/src packages/nucleo/src -g '!*.test.*'` (73 arquivos)

## Subtarefas

- [ ] 25.1 — `ErroDeInvariante` em `packages/nucleo/src/erro/`, com motivo fixo (recusa da interpolação pelo tipo ou por
  lint, declarada)
- [ ] 25.2 — Trocar cada `throw new Error(` de produção, com a mensagem que um teste afirma igual
- [ ] 25.3 — `conferencia-das-permissoes.ts:59` lança erro tipado com código, com controller e método em campos;
  `permissao-no-boot.test.ts:74` os lê dali (mudança declarada)
- [ ] 25.4 — `ArgumentoInvalido` vira uma classe só, reexportada
- [ ] 25.5 — `guardas/erro-tipado` (`tools/guardas/regras-erro.mjs`) em `apps/*/src` e `packages/nucleo/src`, fora de
  teste, exceto `apps/web/src/main.tsx`
- [ ] 25.6 — Testes: classe, formas proibidas, exceções, segunda passada, filtro global, ops

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/erro/erro-de-invariante.ts` e `.test.ts` | novo |
| `packages/nucleo/src/` (21 arquivos), `apps/api/src/` (41, com `ops/`) | alterado |
| `apps/worker/src/`, `apps/despachante/src/`, `apps/realtime/src/`, `apps/web/src/` | alterado |
| `apps/api/test/permissao-no-boot.test.ts` | alterado |
| `tools/guardas/regras-erro.mjs`, `tools/guardas/__fixtures__/erro-sem-tipo.ts` | novo |
| `tools/guardas/index.mjs`, `tools/guardas/guardas.test.ts`, `eslint.config.mjs` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| `ErroDeInvariante` leva o motivo na `message` e é `instanceof Error` | unidade | a classe | `super('')` |
| Motivo interpolado (`` `papel fora: ${papel}` ``) é recusado | unidade (tsc ou fixture) | motivo fixo | motivo `string` sem restrição |
| `throw new Error('x')` em `apps/*/src` reprova | unidade (`guardas.test.ts`) | a guarda | tirar a regra de `index.mjs` |
| O mesmo em `packages/nucleo/src` reprova | unidade | os dois alcances | alcance só `apps/*/src` |
| `throw 'x'` reprova | unidade | literal lançado | conferir só `new Error` |
| `` throw `x` `` reprova | unidade | template lançado | conferir só `Literal` |
| `throw Error('x')`, sem `new`, reprova (ou é limite declarado) | unidade | o atalho | conferir só `NewExpression` |
| Em `*.test.ts`, passa | unidade | só produção | aplicar a teste |
| Em `apps/web/src/main.tsx`, passa | unidade | a exceção única | tirar a exceção |
| `eslint-disable-next-line guardas/erro-tipado` não fura | unidade | segunda passada | tirar a regra dela |
| As mensagens que os testes de hoje afirmam seguem iguais (`execucao.int.test.ts:282`) | integração (existentes) | o texto de hoje | trocar o texto de um motivo |
| Rota sem `@Permite` derruba o boot com controller e método nos campos | unidade (`permissao-no-boot.test.ts`) | 25.3 | nomes só na `message` |
| `ErroDeInvariante` no filtro global vira `ERRO_INTERNO`, sem motivo nem pilha | integração (`erro.int.test.ts`) | regra 20.11 | devolver `message` no corpo |
| O `ArgumentoInvalido` de `ops/uso.ts` é `instanceof` o de `ops/comando.ts` | unidade (`ops/uso.test.ts`) | uma classe só | recriar a classe em `uso.ts` |
| Comando de ops com argumento inválido sai como hoje | unidade (`ops/uso.test.ts`, `ops/escola.test.ts`) | o terminal | — regressão |

## Como testar

- `tools/guardas/guardas.test.ts › guarda de log com dado pessoal › reprova spread, template, …`: fixture com marcas,
  `lintar` e `marcasDeViolacao`, caminho simulado. Segunda passada: `› guarda desligada por comentário`.
- Filtro: `apps/api/test/erro.int.test.ts › exceção não tratada vira ERRO_INTERNO 500 …`; ops:
  `apps/api/src/ops/uso.test.ts › opção desconhecida não repete o valor recebido na mensagem`.
- Isolado: `npx vitest run --project unidade tools/guardas packages/nucleo/src/erro apps/api/test/permissao-no-boot.test.ts`
  e `--project integracao apps/api/test/erro.int.test.ts`.
- Armadilhas: a 20.0 e a 23.0 também editam o `eslint.config.mjs`; procure cada motivo nos testes antes de trocá-lo.

## Fora do escopo desta tarefa

As dependências (24.0) e o erro de contrato da web (20.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

