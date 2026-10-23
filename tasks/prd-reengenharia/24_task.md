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

- [x] 24.1 — Declarar as dependências que faltam, na versão do `package-lock.json` e sem faixa: na raiz `pg`, `ioredis`,
  `@node-rs/argon2`, `otpauth`, `bullmq`, `socket.io-client` e `@opentelemetry/sdk-metrics`; em `apps/realtime`, `jose`;
  em `apps/worker`, `drizzle-orm`. Tirar o `pino` de `apps/despachante` e `apps/worker`
- [x] 24.2 — `knip` 6.42.1 exato como `devDependency` da raiz, e o `knip.json` da raiz derivado do de
  `.reengenharia/medicao/`, com `ignore` só das fixtures de violação
- [x] 24.3 — Etapa do knip (`--include dependencies,unlisted,binaries,unresolved`) em `tools/ci/etapas-de-guarda.ts`, no
  `ci:verificar`; para o portão da tarefa vê-la sem tocar `tools/processo/`, o script `guarda:dependencias` passa a rodar
  também o knip (declare a escolha)
- [x] 24.4 — Testes: etapa limpa, cada categoria reprova a sua fixture, versões exatas, worker e despachante sem `pino`

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
| As onze dependências novas (as nove do plano, mais `drizzle-orm` e `zod` na raiz) estão na versão do lock, sem faixa | unidade (`dependencias.test.ts`) | "nas versões do lock" | `^` numa delas |
| O knip é `devDependency`, exato em `6.42.1` | unidade (idem) | R40 | `^6.42.1` |
| Worker e despachante sobem e logam sem `pino` declarado | integração (existentes: `execucao.int.test.ts › 500 jobs: cada um é reservado e publicado por um despachante só, …` e `› o worker restaura escola e requisição do job: …`; `janela.int.test.ts › caminho feliz: não urgente criado numa terça às 10h fica aguardando, …`), rodadas à mão; o portão não as roda | o processo não quebrou | — regressão |
| As imagens do worker e do despachante sobem | infra (`jobs.int.test.ts › o migrar rodou e saiu com sucesso antes de API, despachantes e workers` e `› o mesmo requisicaoId aparece no log da API, de um despachante e de um worker, e o job termina concluido`), só na esteira | o container não dependia da declaração | — regressão |

## Como testar

- `tools/ci/scripts.test.ts › ci:verificar roda tipos, lint com guardas, gitleaks, npm audit e unidade, e sai verde só se
  todos passarem`: acrescente a chamada do knip à lista esperada; o `it.each` "ci:verificar sai vermelho quando "%s"
  falha" ganha a etapa. Peça: `rodarScript` (mesmo arquivo).
- Fixtures do knip: um workspace mínimo por categoria em pasta temporária, no molde de
  `tools/processo/linhas.test.ts › andares` (`mkdtempSync`).
- Isolado: `npx vitest run --project unidade tools/ci/scripts.test.ts tools/ci/dependencias.test.ts tools/guardas/knip.test.ts`;
  regressão: `npx vitest run --project integracao apps/worker/test/execucao.int.test.ts apps/despachante/test/janela.int.test.ts`.
- Armadilha: `tools/processo/` não muda antes da 92.0; o portão só vê o `guarda:dependencias`.
- **Tarefa mecânica** (`tasks.md`, "Tarefa mecânica"): revisores só os do cabeçalho; a lista de dependências que
  faltam sai do `knip`, e não da leitura à mão.

## Fora do escopo desta tarefa

O knip de exports e arquivos mortos (ondas 2 e 6), trocar versão de pacote, o Dockerfile (90.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A raiz declara onze dependências, e não nove: além das do plano, `drizzle-orm` 0.45.2 e `zod` 4.6.4 (`tools/guardas/tabelas-do-nucleo.test.ts` e `definicoes-de-job.test.ts` as importam, e o `definicoes-de-job.test.ts` nasceu na 18.0, depois da medição). Todas `devDependencies`, exatas, na versão do lock | A lista saiu do knip e não da leitura à mão (a regra da tarefa); sem as duas o knip reprova `unlisted` | `onda-1b.md` RF13, "As dependências (24.0)"; `tasks.md` 24.1 |
| O `knip.json` da raiz tem três chaves a mais que o da medição, todas de fora do `ignore`: `ignoreDependencies: ["k6"]` e `ignoreBinaries: ["flock", "maestri"]` no workspace da raiz, porque `k6/http` é módulo do executor do k6 e `flock` e `maestri` são comandos do sistema, nenhum é pacote npm; e a `apps/web` ganha `src/estilos.css` como entrada (com `css` no `project`), para o knip seguir o `@import 'tailwindcss'` e não dar o `tailwindcss` como sobra. Saem as entradas que o knip declarou redundantes (`src/index.ts` do nucleo e do shared, `src/main.tsx` da web), porque a dica de configuração não é achado mas suja a saída. `$schema` aponta o `node_modules/knip/schema.json` | A tarefa diz que o `ignore` é "só das fixtures" e é: o teste afirma o `ignore` exato **e** que as outras duas chaves são exatamente essas, e as chaves do arquivo são uma lista permitida (topo: `$schema`, `ignore` e `workspaces`; cada workspace: `entry` e `project`, e a raiz também as duas de nome), de modo que `rules`, `ignoreUnresolved`, `exclude` e as outras portas do schema não passam | `onda-1b.md` RF13, "A trava" |
| `guarda:dependencias` passa a ser `npm audit … && knip --include dependencies,unlisted,binaries,unresolved`, e a etapa do `ci:verificar` é a `etapaDependenciasDeclaradas` (`npx --no knip …`), ao lado da `etapaAuditoriaDeDependencias`, que não muda. A escolha: o portão da tarefa só roda `npm run guarda:dependencias` (`tools/processo/portao-local.ts`, que não muda antes da 92.0), então o knip só entra nele pelo script; o `--no` do `npx` impede o download de um knip que não esteja instalado | Declarada como a subtarefa 24.3 pede. O argumento do knip mora numa constante (`ARGUMENTOS_DO_KNIP`) que o script, a etapa e o teste das fixtures leem | `onda-1b.md` RF13, "A trava" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/worker/src/main.ts
teste: tools/guardas/knip.test.ts › o repositório inteiro, com o knip.json da raiz, sai limpo
-import 'reflect-metadata'
+import 'reflect-metadata'
+import 'pino'
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/guardas/knip.test.ts › import de pacote que o package.json não declara reprova como `unlisted`
-export const ARGUMENTOS_DO_KNIP = ['--include', 'dependencies,unlisted,binaries,unresolved'] as const
+export const ARGUMENTOS_DO_KNIP = ['--include', 'dependencies,binaries,unresolved'] as const
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/guardas/knip.test.ts › pacote declarado e que nada importa reprova como `dependencies`
-export const ARGUMENTOS_DO_KNIP = ['--include', 'dependencies,unlisted,binaries,unresolved'] as const
+export const ARGUMENTOS_DO_KNIP = ['--include', 'unlisted,binaries,unresolved'] as const
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/guardas/knip.test.ts › binário chamado em script e não declarado reprova como `binaries`
-export const ARGUMENTOS_DO_KNIP = ['--include', 'dependencies,unlisted,binaries,unresolved'] as const
+export const ARGUMENTOS_DO_KNIP = ['--include', 'dependencies,unlisted,unresolved'] as const
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/guardas/knip.test.ts › import que não resolve reprova como `unresolved`
-export const ARGUMENTOS_DO_KNIP = ['--include', 'dependencies,unlisted,binaries,unresolved'] as const
+export const ARGUMENTOS_DO_KNIP = ['--include', 'dependencies,unlisted,binaries'] as const
```

```mutacao
arquivo: tools/ci/etapas-de-guarda.ts
teste: tools/ci/scripts.test.ts › ci:verificar roda tipos, lint com guardas, gitleaks, npm audit, knip e unidade, e sai verde só se todos passarem
-  argumentos: ['--no', 'knip', ...ARGUMENTOS_DO_KNIP],
+  argumentos: ['--no', 'knip'],
```

```mutacao
arquivo: tools/ci/verificar.ts
teste: tools/ci/scripts.test.ts › ci:verificar roda tipos, lint com guardas, gitleaks, npm audit, knip e unidade, e sai verde só se todos passarem
     etapaAuditoriaDeDependencias,
-    etapaDependenciasDeclaradas,
```

```mutacao
arquivo: package.json
teste: tools/guardas/knip.test.ts › o `guarda:dependencias` do package.json roda o npm audit e depois o knip, com os mesmos argumentos da etapa
-    "guarda:dependencias": "npm audit --audit-level=high --omit=dev && knip --include dependencies,unlisted,binaries,unresolved",
+    "guarda:dependencias": "npm audit --audit-level=high --omit=dev",
```

```mutacao
arquivo: knip.json
teste: tools/guardas/knip.test.ts › o `ignore` do knip.json é só as fixtures de violação, e as exceções de nome são as de fora do npm
     "tools/guardas/__fixtures__/**",
-    "tools/ci/fixtures/**"
+    "tools/ci/fixtures/**",
+    "apps/web/**"
```

```mutacao
arquivo: knip.json
teste: tools/guardas/knip.test.ts › o `ignore` do knip.json é só as fixtures de violação, e as exceções de nome são as de fora do npm
       "ignoreDependencies": [
-        "k6"
+        "k6",
+        "zod"
```

```mutacao
arquivo: knip.json
teste: tools/guardas/knip.test.ts › o `ignore` do knip.json é só as fixtures de violação, e as exceções de nome são as de fora do npm
         "flock",
-        "maestri"
+        "maestri",
+        "tsc"
```

```mutacao
arquivo: package.json
teste: tools/ci/dependencias.test.ts › o knip é devDependency da raiz e exato em 6.42.1
-    "knip": "6.42.1",
+    "knip": "^6.42.1",
```

```mutacao
arquivo: package.json
teste: tools/ci/dependencias.test.ts › raiz: package.json declara pg como devDependency, na versão do lock, sem faixa
-    "pg": "8.23.0",
+    "pg": "^8.23.0",
```

```mutacao
arquivo: apps/realtime/package.json
teste: tools/ci/dependencias.test.ts › apps/realtime: apps/realtime/package.json declara jose como devDependency, na versão do lock, sem faixa
-    "jose": "6.2.12",
     "socket.io-client": "4.8.3"
```

```mutacao
arquivo: apps/worker/package.json
teste: tools/ci/dependencias.test.ts › apps/worker/package.json não declara o pino, que ninguém ali importa
-    "ioredis": "6.0.0",
+    "ioredis": "6.0.0",
+    "pino": "10.3.1",
```

```mutacao
arquivo: apps/despachante/package.json
teste: tools/ci/dependencias.test.ts › apps/despachante/package.json não declara o pino, que ninguém ali importa
-    "ioredis": "6.0.0",
+    "ioredis": "6.0.0",
+    "pino": "10.3.1",
```

```mutacao
arquivo: knip.json
teste: tools/guardas/knip.test.ts › o `ignore` do knip.json é só as fixtures de violação, e as exceções de nome são as de fora do npm
-  "$schema": "./node_modules/knip/schema.json",
+  "$schema": "./node_modules/knip/schema.json",
+  "rules": { "unlisted": "off" },
```

```mutacao
arquivo: apps/worker/package.json
teste: tools/ci/dependencias.test.ts › apps/worker: apps/worker/package.json declara drizzle-orm como devDependency, na versão do lock, sem faixa
-    "drizzle-orm": "0.45.2"
+    "drizzle-orm": "^0.45.2"
```

```mutacao
arquivo: package.json
teste: tools/ci/dependencias.test.ts › raiz: package.json declara ioredis como devDependency, na versão do lock, sem faixa
-    "ioredis": "6.0.0",
+    "ioredis": "^6.0.0",
```

```mutacao
arquivo: package.json
teste: tools/ci/dependencias.test.ts › raiz: package.json declara @node-rs/argon2 como devDependency, na versão do lock, sem faixa
-    "@node-rs/argon2": "2.2.1",
+    "@node-rs/argon2": "^2.2.1",
```

```mutacao
arquivo: package.json
teste: tools/ci/dependencias.test.ts › raiz: package.json declara otpauth como devDependency, na versão do lock, sem faixa
-    "otpauth": "9.5.2",
+    "otpauth": "^9.5.2",
```

```mutacao
arquivo: package.json
teste: tools/ci/dependencias.test.ts › raiz: package.json declara bullmq como devDependency, na versão do lock, sem faixa
-    "bullmq": "6.3.4",
+    "bullmq": "^6.3.4",
```

```mutacao
arquivo: package.json
teste: tools/ci/dependencias.test.ts › raiz: package.json declara socket.io-client como devDependency, na versão do lock, sem faixa
-    "socket.io-client": "4.8.3",
+    "socket.io-client": "^4.8.3",
```

```mutacao
arquivo: package.json
teste: tools/ci/dependencias.test.ts › raiz: package.json declara @opentelemetry/sdk-metrics como devDependency, na versão do lock, sem faixa
-    "@opentelemetry/sdk-metrics": "2.11.0",
+    "@opentelemetry/sdk-metrics": "^2.11.0",
```

```mutacao
arquivo: package.json
teste: tools/ci/dependencias.test.ts › raiz: package.json declara drizzle-orm como devDependency, na versão do lock, sem faixa
-    "drizzle-orm": "0.45.2",
+    "drizzle-orm": "^0.45.2",
```

```mutacao
arquivo: package.json
teste: tools/ci/dependencias.test.ts › raiz: package.json declara zod como devDependency, na versão do lock, sem faixa
-    "zod": "4.6.4"
+    "zod": "^4.6.4"
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | "O argumento do knip aparece em dois lugares: a constante `ARGUMENTOS_DO_KNIP` (`tools/ci/etapas-de-guarda.ts`) e o texto do script `guarda:dependencias` no `package.json`. […] Quando o `tools/processo/` puder mudar (tarefa 92.0), vale o portão chamar a etapa direto" | Tarefa 92.0, que é a primeira a poder mexer em `tools/processo/`. Hoje o `knip.test.ts` mantém os dois iguais |
| infra-guardian (1ª) e revisor-geral (1ª) | O caso "o repositório inteiro, com o knip.json da raiz, sai limpo" roda o knip no repositório inteiro, com prazo de 60 s; "olhar de novo se a unidade passar a pesar" | Recusada: o caso é o da tabela da tarefa e a mutação do `pino` depende dele. A duração aparece na esteira de cada push; se passar a pesar, é achado dela |
| revisor-geral (2ª) | `onda-1b.md:171-172` ainda descreve a conferência antiga, com a lista de proibidas (`ignoreWorkspaces`, `ignoreIssues`, `ignore` por workspace) | Recusada: a lista de permitidas cobre as três chaves citadas, sem contradição; a divergência em `24_task.md` já diz como ficou |
| revisor-geral (2ª) | Extrair para uma constante a mensagem longa do `expect` em `tools/ci/dependencias.test.ts:35` | Recusada: estilo, sem efeito no comportamento nem no contrato |
| test-engineer (2ª) | `tools/guardas/knip.test.ts:93-96` confere os nomes das chaves de cada workspace, mas não o conteúdo de `entry` e `project`; estreitar um `project` (ex.: `apps/web` só com `"*.ts"`) não é percebido. "Fica para o `/validar`" | `/validar` (Validador da spec) |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 23:21:18 | 2026-10-22 23:22:10 | `infra-guardian` | 1 | APROVADO | a94c11b41ff9a3d03 |
| 2026-10-22 23:21:20 | 2026-10-22 23:22:23 | `revisor-geral` | 1 | APROVADO | af2a43d427b7e67ff |
| 2026-10-22 23:21:19 | 2026-10-22 23:22:57 | `test-engineer` | 1 | REPROVADO | a36f65aeb3e120e69 |
| 2026-10-22 23:27:33 | 2026-10-22 23:27:58 | `revisor-geral` | 2 | APROVADO | a92cb63dabea9fec1 |
| 2026-10-22 23:27:30 | 2026-10-22 23:28:15 | `test-engineer` | 2 | APROVADO | a1985141deddd6712 |
