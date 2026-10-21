# Tarefa 24.0 — Toda dependência é declarada onde é usada, sem sobra

**Funcionalidade:** reengenharia · **Depende de:** 12.0
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

Todo pacote importado está declarado onde é usado, nenhum sobra, e o knip reprova o próximo que escapar.

## Contexto necessário

- `techspec.md` §2 (`tools/`) e §11 (linha "Missão": as dependências novas, R33 e R40)
- `onda-1b.md`, "RF13 — Dependências e `throw`" (As dependências; A trava) e §5
- `prd.md` RF13
- `.claude/rules/00-arquitetura.md` (item 8) e `40-testes.md` (o portão)
- Código: `.reengenharia/medicao/knip.json` (base do `knip.json` da raiz); `tools/ci/etapas-de-guarda.ts`
  (`etapaAuditoriaDeDependencias`, o molde); `tools/ci/verificar.ts`; `apps/worker/package.json:19` e
  `apps/despachante/package.json:18` (o `pino`); `tools/processo/portao-local.ts:136` (o portão roda só
  `npm run guarda:dependencias`)

## Subtarefas

- [ ] 24.1 — Declarar as dependências que faltam, na versão do `package-lock.json` e sem faixa: na raiz `pg`, `ioredis`,
  `@node-rs/argon2`, `otpauth`, `bullmq`, `socket.io-client` e `@opentelemetry/sdk-metrics`; em `apps/realtime`, `jose`;
  em `apps/worker`, `drizzle-orm`. Tirar o `pino` de `apps/despachante` e `apps/worker`
- [ ] 24.2 — `knip` 6.42.1 exato como `devDependency` da raiz, e o `knip.json` da raiz derivado do de
  `.reengenharia/medicao/`, com `ignore` só das fixtures de violação
- [ ] 24.3 — Etapa do knip (`--include dependencies,unlisted,binaries,unresolved`) em `tools/ci/etapas-de-guarda.ts`, no
  `ci:verificar`; para o portão da tarefa vê-la sem tocar `tools/processo/`, o script `guarda:dependencias` passa a rodar
  também o knip (declare a escolha)
- [ ] 24.4 — Testes: etapa limpa, cada categoria reprova a sua fixture, versões exatas, worker e despachante sem `pino`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `package.json` | alterado |
| `package-lock.json` | alterado |
| `apps/realtime/package.json` | alterado |
| `apps/worker/package.json` | alterado |
| `apps/despachante/package.json` | alterado |
| `knip.json` | novo |
| `tools/ci/etapas-de-guarda.ts` | alterado |
| `tools/ci/verificar.ts` | alterado |
| `tools/ci/scripts.test.ts` | alterado |
| `tools/ci/dependencias.test.ts` | novo |
| `tools/guardas/knip.test.ts` | novo |
| `tools/guardas/__fixtures__/knip/` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| O knip com o `knip.json` da raiz sai limpo | unidade (a etapa) | o achado fechou | `import 'pino'` em `apps/worker/src/main.ts` |
| `ci:verificar` roda a etapa do knip e sai vermelho quando ela falha | unidade (`scripts.test.ts`) | a trava está na esteira | tirar a etapa de `verificar.ts` |
| Import de pacote não declarado reprova | unidade (`knip.test.ts`, fixture) | `unlisted` | tirar `unlisted` do `--include` |
| Dependência declarada e não usada reprova | unidade (idem) | `dependencies` | tirar `dependencies` |
| Binário chamado em script e não declarado reprova | unidade (idem) | `binaries` | tirar `binaries` |
| Import que não resolve reprova | unidade (idem) | `unresolved` | tirar `unresolved` |
| O `ignore` do `knip.json` é só `tools/guardas/__fixtures__/**` e `tools/ci/fixtures/**` | unidade (idem) | sem buraco por configuração | `apps/web/**` no `ignore` |
| As nove dependências novas estão na versão do lock, sem faixa | unidade (`dependencias.test.ts`) | "nas versões do lock" | `^` numa delas |
| O knip é `devDependency`, exato em `6.42.1` | unidade (idem) | R40 | `^6.42.1` |
| Worker e despachante sobem e logam sem `pino` declarado | integração (existentes) | o processo não quebrou | — regressão |
| As imagens do worker e do despachante sobem | infra (`npm run test:infra`) | o container não dependia da declaração | — regressão |

## Como testar

- `tools/ci/scripts.test.ts › ci:verificar roda tipos, lint com guardas, gitleaks, npm audit e unidade, e sai verde só se
  todos passarem`: acrescente a chamada do knip à lista esperada; o `it.each` "ci:verificar sai vermelho quando "%s"
  falha" ganha a etapa. Peça: `rodarScript` (mesmo arquivo).
- Fixtures do knip: um workspace mínimo por categoria em pasta temporária, no molde de
  `tools/processo/linhas.test.ts › andares` (`mkdtempSync`).
- Isolado: `npx vitest run --project unidade tools/ci/scripts.test.ts tools/ci/dependencias.test.ts tools/guardas/knip.test.ts`;
  regressão: `npx vitest run --project integracao apps/worker/test/execucao.int.test.ts apps/despachante/test/janela.int.test.ts`.
- Armadilha: `tools/processo/` não muda antes da 92.0; o portão só vê o `guarda:dependencias`.

## Fora do escopo desta tarefa

O knip de exports e arquivos mortos (ondas 2 e 6), trocar versão de pacote, o Dockerfile (90.0).

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

