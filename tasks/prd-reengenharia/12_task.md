# Tarefa 12.0 — Import contra a direção ou a camada, ou ciclo novo, reprova o lint

**Funcionalidade:** reengenharia · **Depende de:** 9.0, 10.0, 11.0, 34.0, 35.0, 96.0 (as pastas antes, pelo recorte; caminhos e linhas conferidos em 22/10 contra `561ff3b`)
**Subagentes obrigatórios:** `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O `npm run lint` reprova import contra a direção dos pacotes, contra a camada da API ou as três cercas, e ciclo novo.

## Contexto necessário

- `onda-1a.md` §2, "T7"; `techspec.md` §6 e §11; `prd.md` RF10; `.reengenharia/DECISOES.md` R7, R39, R63, N9
- Regras 00 (camadas) e 10 (cercas)
- `apps/api/test/arquitetura.test.ts` (:31, :59, :112, :127, :146, :160, :175, :214-225, :920)
- A regra de só importar `credencial/` e `sessao/` pelo `index.ts` (`onda-2.md`, "As travas") vale para `apps/`, e deixa
  `e2e/`, `infra/` e `tools/` de fora: o e2e importa `credencial/hash-do-token.ts` direto, de propósito (33.0). Também fica de fora
  o arquivo de `apps/api/src` que o e2e carrega: `operacao/token-do-convite.ts` importa `credencial/hash-do-token.js` direto, porque o
  Playwright roda o `.ts` sem compilar (`erasableSyntaxOnly`) e o `index.ts` arrasta toda a `credencial/`, com `constructor(private readonly …)` e
  `@educa/*` pelo nome (`tools/ci/playwright.test.ts › nada que o e2e carrega importa um pacote @educa/* pelo nome…` fica vermelho). A regra
  precisa dessa exceção, por arquivo, com o motivo

## Subtarefas

- [x] 12.1 — `dependency-cruiser@18.7.0` exato em `devDependencies`; `tools/guardas/camadas.cjs` com as regras do §2 da onda, todas `error`
- [x] 12.2 — `guarda:camadas` no `package.json`, e `lint` terminando em `&& npm run guarda:camadas`
- [x] 12.3 — As três cercas, por import direto, e a exceção de `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:3`; sem `reaches` (R63)
- [x] 12.4 — Sai do `arquitetura.test.ts` o que as regras cobrem, depois das fixtures verdes
- [x] 12.5 — Testes: `camadas.test.ts` com as fixtures, o repositório real e o tempo do lint

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/guardas/camadas.cjs` | novo |
| `tools/guardas/camadas.test.ts` | novo |
| `tools/guardas/__fixtures__/camadas/**` | novo |
| `apps/api/test/arquitetura.test.ts` | alterado |
| `package.json` | alterado |
| `package-lock.json` | alterado |
| `vitest.config.ts` | alterado (ignora `tools/guardas/__fixtures__/`) |
| `tasks/prd-reengenharia/onda-1a.md` | alterado ("Como ficou (12.0)") |

## Testes que provam a regra

Cada fixture reprova com a violação exata.

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| Ciclo só por `import type` | unidade | ciclo de tipo conta | `tsPreCompilationDeps: false` |
| `shared` → `nucleo`, `shared` → app, `nucleo` → app | unidade | a direção dos pacotes | tirar uma regra |
| `apps/worker/src` → `apps/api/src` reprova; entre `test/` passa | unidade | app não importa app | aplicar a teste |
| web → `@educa/nucleo` ou `apps/api/src`; `apps/api/src` → `apps/api/test` | unidade | web e produção | tirar uma regra |
| controller → repository ou `drizzle-orm`; service → `drizzle-orm`; repository → service ou controller | unidade | camadas da API | tirar uma regra |
| `sessao/login/x.ts` → `operacao/eu/y.ts` | unidade | substitui o `it` da 10.0, com a subpasta | tirar a regra |
| Cada cerca: import, `export *`, `import()` e `tools/x.ts` de fora | unidade | nenhuma forma fura | tirar `tools` do comando |
| Cada cerca: de fora, via `sessao/login/x.ts` que a reexporta, reprova pela regra do `index.ts`; o reexport pelo `sessao/index.ts` é dos `it` de `:160` e `:175`, que ficam | unidade | o reexport não fura, sem `reaches` (R63) | tirar a regra do `index.ts` |
| Teste importando a resolução e o painel passa | unidade | **mudança aceita** (`:53`, `:117-123`) | cercar teste |
| Conta global: o subcaminho de `apps/worker` reprova; `packages/nucleo/src/ciclo-de-vida/x.ts` e `apps/api/src/sessao/mfa/redefinicao-de-mfa.ts` passam | unidade | subcaminho cercado | tirar um do `pathNot` |
| Painel: `operacao/eu/eu.service.ts` importando reprova; `operacao/painel/painel.service.ts` passa | unidade | a cerca é o arquivo, não a pasta | trocar por `operacao/` |
| `app.module.ts` → `ops/uso.ts` e `operacao/painel/painel.service.ts` → `ops/escola.ts` reprovam; `ops/x.ts` → `ops/escola.ts` passa | unidade | metade de `:920`, sem exceção desde a 35.0 (R63) | aceitar o `painel.service.ts` |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` passa; outro em `retencao/` com o mesmo import reprova | unidade | exceção por arquivo | por pasta |
| Real: a aresta `apps/api/src/sessao/mfa/redefinicao-de-mfa.ts → packages/nucleo/src/ciclo-de-vida/conta-global.repository.ts` no JSON | unidade | sem "0 módulos" (R7) | `tsConfig` inexistente |
| Real: zero violações e zero ciclos | unidade | os 3 ciclos não voltam | devolver `../login/login.service.js` em `sessao/conclusao/conclusao-de-login.ts` |
| Toda regra é `error` | unidade | `warn` sai com 0 | uma em `warn` |
| `guarda:camadas` é o comando do §2, e `lint` falha com violação | unidade | cinco pastas, na esteira | tirar `e2e` ou o `&&` |
| `dependency-cruiser` em `18.7.0` exato | unidade | N9 | `^18.7.0` |
| Cada caso removido de `arquitetura.test.ts` tem o substituto listado; ficam `:146`, `:160`, `:175`, `:215` e os de tabela, SQL, migration e rotas | revisão | o que continua protegendo | — |
| Tempo do `lint` antes e depois | medida | `onda-1a.md` §4 | — |

## Como testar

- O CLI: copie `tools/guardas/guardas.test.ts › o script da passada sem comentários sai com código de falha quando há
  violação` (`spawnSync`), com o `depcruise --output-type json` na fixture.
- Formas de import: `apps/api/test/arquitetura.test.ts › reprova o arquivo de fora que a importa, reexporta ou
  carrega por import dinâmico` vira fixture em disco.
- Isolado: `npx vitest run --project unidade tools/guardas/camadas.test.ts apps/api/test/arquitetura.test.ts`.
- Armadilhas: a fixture precisa de árvore em `tools/`, ou o caso de `tools` passa calado; `reachable` acusaria o
  `app.module.ts`, o `ops/` e a `sala/`, porque o `sessao/index.ts` reexporta `sessoes-sinteticas.ts` e
  `redefinicao-de-mfa.ts` (R63); a cerca se lê no caminho resolvido (`^apps/api/src/sessao/`), não no texto: `operacao/sessao/`
  e `estrutura/escola-sessao/` são outras pastas; `arquitetura.test.ts` importa `sessao/tenant/…` direto, de propósito
  (`:160`, `:175`), e entra na exceção por arquivo da regra do `index.ts`; a 9.0 e a 13.0 também mexem em `tools/guardas/`.

## Fora do escopo desta tarefa

Tamanho de função (13.0), tabela fora de repository (9.0), helpers de teste entre apps (31.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A exceção de `expurgo-da-escola.repository.ts:3` é da regra "repository não importa service", e essa regra vale na API **e** em `packages/nucleo/src`. A 12.3 a punha entre as cercas | A linha 3 é o `import` do `CicloDeVidaService`, e nenhuma cerca de import direto olha para ela (o arquivo não importa a `ContaGlobalRepository`). A exceção só existe se a regra de camada cobrir o `nucleo`; a exceção é o arquivo, e outro `*.repository.ts` de `retencao/` com o mesmo import reprova | `onda-1a.md` T7, "Como ficou (12.0)" |
| "Fora de `credencial/` e `sessao/`" (regra do `index.ts`) é fora **das duas** pastas: `sessao/` importa `credencial/` por dentro | 81 imports de `sessao/` para arquivos de `credencial/`; a `credencial/` é a base da `sessao/` e a regra de cada pasta só vale para quem não é de nenhuma das duas | `onda-1a.md` T7, "Como ficou (12.0)", 1º item; `onda-2.md`, "As travas" |
| O `exclude` do depcruise não lista `node_modules` | O `exclude` tira do grafo também a aresta para o pacote, e as regras do `drizzle-orm` passavam sem olhar; o `doNotFollow` basta para não entrar nele | `onda-1a.md` T7, "Como ficou (12.0)", 2º item |
| O teste roda o CLI numa cópia da fixture em pasta temporária, com os links `@educa/*` e um `drizzle-orm` de mentira; `vitest.config.ts` (fora dos arquivos previstos) ignora `tools/guardas/__fixtures__/` | Dentro do repositório o Node acha o `node_modules` da raiz e a aresta sai com `../`; a árvore tem um `arquitetura.test.ts` (a exceção do `index.ts` é por nome), que o vitest coletaria | `onda-1a.md` T7, "Como ficou (12.0)", 3º item |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sem-ciclo reprova só o que a fixture marca
-{
-name: 'sem-ciclo',
-comment: 'Ciclo de import, contando o que só é tipo. Desfaça-o levando o que as duas pontas usam para um terceiro arquivo, e não escondendo o import atrás de um reexport.',
-severity: 'error',
-from: {},
-to: { circular: true },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › shared-nao-importa-nucleo-nem-app reprova só o que a fixture marca
-{
-name: 'shared-nao-importa-nucleo-nem-app',
-comment: 'O contrato compartilhado é a base: nem o nucleo nem uma app podem entrar nele.',
-severity: 'error',
-from: { path: '^packages/shared/' },
-to: { path: '^(?:packages/nucleo|apps)/' },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › nucleo-nao-importa-app reprova só o que a fixture marca
-{
-name: 'nucleo-nao-importa-app',
-comment: 'O nucleo serve as apps; a app não volta para dentro dele.',
-severity: 'error',
-from: { path: '^packages/nucleo/' },
-to: { path: '^apps/' },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › app-nao-importa-app reprova só o que a fixture marca
-{
-name: 'app-nao-importa-app',
-comment: 'Uma app não importa outra (regra 00, item 1). Entre `test/` passa, até os helpers irem para `tools/testes/` (31.0).',
-severity: 'error',
-from: { path: '^apps/([^/]+)/', pathNot: TESTE },
-to: { path: '^apps/', pathNot: '^apps/$1/' },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › web-nao-importa-nucleo-nem-backend reprova só o que a fixture marca
-{
-name: 'web-nao-importa-nucleo-nem-backend',
-comment: 'A web fala com a API por HTTP e pelo contrato de `@educa/shared` (regra 00, itens 1 e 6).',
-severity: 'error',
-from: { path: '^apps/web/' },
-to: { path: '^(?:packages/nucleo/|apps/(?!web/))' },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › producao-nao-importa-teste reprova só o que a fixture marca
-{
-name: 'producao-nao-importa-teste',
-comment: 'O que vai para a imagem não carrega teste, fixture nem apoio de e2e.',
-severity: 'error',
-from: PRODUCAO,
-to: { path: TESTE },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › controller-nao-importa-repository reprova só o que a fixture marca
-{
-name: 'controller-nao-importa-repository',
-comment: 'O controller valida a entrada e chama o service; o banco é do repository.',
-severity: 'error',
-from: { path: `${API}.*\\.controller\\.ts$` },
-to: { path: '\\.repository\\.ts$' },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › controller-nao-importa-drizzle reprova só o que a fixture marca
-{
-name: 'controller-nao-importa-drizzle',
-comment: 'Query no controller foge do escopo de tenant do repository (regra 10, item 3).',
-severity: 'error',
-from: { path: `${API}.*\\.controller\\.ts$` },
-to: { path: DRIZZLE },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › service-nao-importa-drizzle reprova só o que a fixture marca
-{
-name: 'service-nao-importa-drizzle',
-comment: 'Query solta no service é como o isolamento acaba furado (regra 00, item 3).',
-severity: 'error',
-from: { path: `${API}.*\\.service\\.ts$` },
-to: { path: DRIZZLE },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › repository-nao-importa-service-nem-controller reprova só o que a fixture marca
-{
-name: 'repository-nao-importa-service-nem-controller',
-comment: 'A camada de baixo não conhece a de cima. A exceção é um arquivo, e não a pasta: o expurgo da escola enfileira a eliminação pelo `CicloDeVidaService`.',
-severity: 'error',
-from: {
-path: '^(?:apps/api/src|packages/nucleo/src)/.*\\.repository\\.ts$',
-pathNot: '^packages/nucleo/src/retencao/expurgo-da-escola\\.repository\\.ts$',
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sessao-nao-importa-operacao reprova só o que a fixture marca
-{
-name: 'sessao-nao-importa-operacao',
-comment: 'A sessão da escola não depende da operação da equipe (10.0): o que as duas usam mora em `sessao/`.',
-severity: 'error',
-from: { path: SESSAO },
-to: { path: `${API}operacao/` },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › api-nao-importa-ops reprova só o que a fixture marca
-{
-name: 'api-nao-importa-ops',
-comment: '`ops/` só tem comando de terminal (35.0). O caso de uso que uma rota também chama mora no módulo dela.',
-severity: 'error',
-from: { path: API, pathNot: [`${API}ops/`, TESTE] },
-to: { path: `${API}ops/` },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-resolucao-de-tenant reprova só o que a fixture marca
-{
-name: 'cerca-resolucao-de-tenant',
-comment: 'A `ResolucaoDeTenantRepository` concentra os `@SemEscopo` da resolução de tenant e fica dentro de `sessao/` (Tech Spec, seção 6).',
-severity: 'error',
-from: { path: TODO_O_CODIGO, pathNot: [SESSAO, TESTE] },
-to: { path: `${SESSAO}tenant/resolucao-de-tenant\\.repository\\.ts$` },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-conta-global reprova só o que a fixture marca
-{
-name: 'cerca-conta-global',
-comment: 'A `ContaGlobalRepository` escreve na `Conta`, que não tem escola: só `sessao/` e o ciclo de vida do nucleo a importam (F3, 1.0).',
-severity: 'error',
-from: { path: TODO_O_CODIGO, pathNot: [SESSAO, '^packages/nucleo/src/ciclo-de-vida/', TESTE] },
-to: { path: CONTA_GLOBAL },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-painel-repository reprova só o que a fixture marca
-{
-name: 'cerca-painel-repository',
-comment: 'O `PainelRepository` lê entre escolas, com três `@SemEscopo`: só o `painel.service.ts` o usa (I1, A0b).',
-severity: 'error',
-from: { path: TODO_O_CODIGO, pathNot: ['^apps/api/src/operacao/painel/painel\\.service\\.ts$', TESTE] },
-to: { path: '^apps/api/src/operacao/painel/painel\\.repository\\.ts$' },
-},
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sessao-so-pelo-index reprova só o que a fixture marca
-soPeloIndex('sessao', 'apps/api/src/sessao/', 'Fora de `sessao/`, só se importa pelo `index.ts`: ele escolhe o que a API usa (34.0).', [
-'apps/api/test/arquitetura.test.ts',
-]),
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › credencial-so-pelo-index reprova só o que a fixture marca
-soPeloIndex('credencial', 'apps/api/src/credencial/', 'Fora de `credencial/`, só se importa pelo `index.ts` (33.0). O arquivo da exceção é carregado pelo e2e, que roda o `.ts` sem compilar, e o `index.ts` arrasta a `credencial/` inteira.', [
-'apps/api/src/operacao/token-do-convite.ts',
-]),
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-painel-repository reprova só o que a fixture marca
-const TESTE = String.raw`(?:\.(?:test|spec)\.tsx?$|(?:^|/)test/|(?:^|/)__fixtures__/|^e2e/)`
+const TESTE = String.raw`(?:\.(?:spec)\.tsx?$|(?:^|/)test/|(?:^|/)__fixtures__/|^e2e/)`
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-painel-repository reprova só o que a fixture marca
-const TESTE = String.raw`(?:\.(?:test|spec)\.tsx?$|(?:^|/)test/|(?:^|/)__fixtures__/|^e2e/)`
+const TESTE = String.raw`(?:\.(?:test)\.tsx?$|(?:^|/)test/|(?:^|/)__fixtures__/|^e2e/)`
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-painel-repository reprova só o que a fixture marca
-const TESTE = String.raw`(?:\.(?:test|spec)\.tsx?$|(?:^|/)test/|(?:^|/)__fixtures__/|^e2e/)`
+const TESTE = String.raw`(?:\.(?:test|spec)\.tsx?$|(?:^|/)__fixtures__/|^e2e/)`
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-painel-repository reprova só o que a fixture marca
-const TESTE = String.raw`(?:\.(?:test|spec)\.tsx?$|(?:^|/)test/|(?:^|/)__fixtures__/|^e2e/)`
+const TESTE = String.raw`(?:\.(?:test|spec)\.tsx?$|(?:^|/)test/|^e2e/)`
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › producao-nao-importa-teste reprova só o que a fixture marca
-const TESTE = String.raw`(?:\.(?:test|spec)\.tsx?$|(?:^|/)test/|(?:^|/)__fixtures__/|^e2e/)`
+const TESTE = String.raw`(?:\.(?:test|spec)\.tsx?$|(?:^|/)test/|(?:^|/)__fixtures__/)`
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › producao-nao-importa-teste reprova só o que a fixture marca
-const PRODUCAO = { path: '^(?:apps|packages)/[^/]+/src/', pathNot: TESTE }
+const PRODUCAO = { path: '^(?:apps|packages)/[^/]+/src/' }
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › producao-nao-importa-teste reprova só o que a fixture marca
-const PRODUCAO = { path: '^(?:apps|packages)/[^/]+/src/', pathNot: TESTE }
+const PRODUCAO = { path: '^(?:apps)/[^/]+/src/', pathNot: TESTE }
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › controller-nao-importa-drizzle reprova só o que a fixture marca
-const DRIZZLE = String.raw`(?:^|/)node_modules/drizzle-orm(?:/|$)`
+const DRIZZLE = String.raw`(?:^|/)node_modules/drizzle(?:/|$)`
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sessao-so-pelo-index reprova só o que a fixture marca
-from: { path: '^apps/api/(?:src|test)/', pathNot: [SESSAO, CREDENCIAL, ...tambemPermitidos.map((arquivo) => `^${arquivo}$`)] },
+from: { path: '^apps/api/(?:test)/', pathNot: [SESSAO, CREDENCIAL, ...tambemPermitidos.map((arquivo) => `^${arquivo}$`)] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sessao-so-pelo-index reprova só o que a fixture marca
-from: { path: '^apps/api/(?:src|test)/', pathNot: [SESSAO, CREDENCIAL, ...tambemPermitidos.map((arquivo) => `^${arquivo}$`)] },
+from: { path: '^apps/api/(?:src)/', pathNot: [SESSAO, CREDENCIAL, ...tambemPermitidos.map((arquivo) => `^${arquivo}$`)] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sessao-so-pelo-index reprova só o que a fixture marca
-from: { path: '^apps/api/(?:src|test)/', pathNot: [SESSAO, CREDENCIAL, ...tambemPermitidos.map((arquivo) => `^${arquivo}$`)] },
+from: { path: '^apps/api/(?:src|test)/', pathNot: [CREDENCIAL, ...tambemPermitidos.map((arquivo) => `^${arquivo}$`)] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › credencial-so-pelo-index reprova só o que a fixture marca
-from: { path: '^apps/api/(?:src|test)/', pathNot: [SESSAO, CREDENCIAL, ...tambemPermitidos.map((arquivo) => `^${arquivo}$`)] },
+from: { path: '^apps/api/(?:src|test)/', pathNot: [SESSAO, ...tambemPermitidos.map((arquivo) => `^${arquivo}$`)] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sessao-so-pelo-index reprova só o que a fixture marca
-from: { path: '^apps/api/(?:src|test)/', pathNot: [SESSAO, CREDENCIAL, ...tambemPermitidos.map((arquivo) => `^${arquivo}$`)] },
+from: { path: '^apps/api/(?:src|test)/', pathNot: [SESSAO, CREDENCIAL] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sessao-so-pelo-index reprova só o que a fixture marca
-to: { path: `^${pasta}`, pathNot: `^${pasta}index\\.ts$` },
+to: { path: `^${pasta}` },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sessao-so-pelo-index reprova só o que a fixture marca
 soPeloIndex('sessao', 'apps/api/src/sessao/', 'Fora de `sessao/`, só se importa pelo `index.ts`: ele escolhe o que a API usa (34.0).', [
-'apps/api/test/arquitetura.test.ts',
 ]),
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › credencial-so-pelo-index reprova só o que a fixture marca
 soPeloIndex('credencial', 'apps/api/src/credencial/', 'Fora de `credencial/`, só se importa pelo `index.ts` (33.0). O arquivo da exceção é carregado pelo e2e, que roda o `.ts` sem compilar, e o `index.ts` arrasta a `credencial/` inteira.', [
-'apps/api/src/operacao/token-do-convite.ts',
 ]),
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › toda regra é error
 comment: motivo,
-severity: 'error',
+severity: 'warn',
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › api-nao-importa-ops reprova só o que a fixture marca
-from: { path: API, pathNot: [`${API}ops/`, TESTE] },
+from: { path: API, pathNot: [TESTE] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › api-nao-importa-ops reprova só o que a fixture marca
-from: { path: API, pathNot: [`${API}ops/`, TESTE] },
+from: { path: API, pathNot: [`${API}ops/`] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › app-nao-importa-app reprova só o que a fixture marca
-from: { path: '^apps/([^/]+)/', pathNot: TESTE },
+from: { path: '^apps/([^/]+)/' },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › app-nao-importa-app reprova só o que a fixture marca
-to: { path: '^apps/', pathNot: '^apps/$1/' },
+to: { path: '^apps/' },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › web-nao-importa-nucleo-nem-backend reprova só o que a fixture marca
-to: { path: '^(?:packages/nucleo/|apps/(?!web/))' },
+to: { path: '^(?:apps/(?!web/))' },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › web-nao-importa-nucleo-nem-backend reprova só o que a fixture marca
-to: { path: '^(?:packages/nucleo/|apps/(?!web/))' },
+to: { path: '^(?:packages/nucleo/)' },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › shared-nao-importa-nucleo-nem-app reprova só o que a fixture marca
-to: { path: '^(?:packages/nucleo|apps)/' },
+to: { path: '^(?:apps)/' },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › shared-nao-importa-nucleo-nem-app reprova só o que a fixture marca
-to: { path: '^(?:packages/nucleo|apps)/' },
+to: { path: '^(?:packages/nucleo/' },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › repository-nao-importa-service-nem-controller reprova só o que a fixture marca
-path: '^(?:apps/api/src|packages/nucleo/src)/.*\\.repository\\.ts$',
+path: '^(?:apps/api/src)/.*\\.repository\\.ts$',
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › repository-nao-importa-service-nem-controller reprova só o que a fixture marca
 path: '^(?:apps/api/src|packages/nucleo/src)/.*\\.repository\\.ts$',
-pathNot: '^packages/nucleo/src/retencao/expurgo-da-escola\\.repository\\.ts$',
 },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › repository-nao-importa-service-nem-controller reprova só o que a fixture marca
-to: { path: '\\.(?:service|controller)\\.ts$' },
+to: { path: '\\.(?:service)\\.ts$' },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › repository-nao-importa-service-nem-controller reprova só o que a fixture marca
-to: { path: '\\.(?:service|controller)\\.ts$' },
+to: { path: '\\.(?:controller)\\.ts$' },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-resolucao-de-tenant reprova só o que a fixture marca
-from: { path: TODO_O_CODIGO, pathNot: [SESSAO, TESTE] },
+from: { path: TODO_O_CODIGO, pathNot: [TESTE] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-resolucao-de-tenant reprova só o que a fixture marca
-from: { path: TODO_O_CODIGO, pathNot: [SESSAO, TESTE] },
+from: { path: TODO_O_CODIGO, pathNot: [SESSAO] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-conta-global reprova só o que a fixture marca
-from: { path: TODO_O_CODIGO, pathNot: [SESSAO, '^packages/nucleo/src/ciclo-de-vida/', TESTE] },
+from: { path: TODO_O_CODIGO, pathNot: ['^packages/nucleo/src/ciclo-de-vida/', TESTE] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-conta-global reprova só o que a fixture marca
-from: { path: TODO_O_CODIGO, pathNot: [SESSAO, '^packages/nucleo/src/ciclo-de-vida/', TESTE] },
+from: { path: TODO_O_CODIGO, pathNot: [SESSAO, TESTE] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-conta-global reprova só o que a fixture marca
-from: { path: TODO_O_CODIGO, pathNot: [SESSAO, '^packages/nucleo/src/ciclo-de-vida/', TESTE] },
+from: { path: TODO_O_CODIGO, pathNot: [SESSAO, '^packages/nucleo/src/ciclo-de-vida/'] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-painel-repository reprova só o que a fixture marca
-from: { path: TODO_O_CODIGO, pathNot: ['^apps/api/src/operacao/painel/painel\\.service\\.ts$', TESTE] },
+from: { path: TODO_O_CODIGO, pathNot: [TESTE] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-painel-repository reprova só o que a fixture marca
-from: { path: TODO_O_CODIGO, pathNot: ['^apps/api/src/operacao/painel/painel\\.service\\.ts$', TESTE] },
+from: { path: TODO_O_CODIGO, pathNot: ['^apps/api/src/operacao/painel/painel\\.service\\.ts$'] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-conta-global reprova só o que a fixture marca
-const TODO_O_CODIGO = '^(?:apps|packages|tools|infra)/'
+const TODO_O_CODIGO = '^(?:packages|tools|infra)/'
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-conta-global reprova só o que a fixture marca
-const TODO_O_CODIGO = '^(?:apps|packages|tools|infra)/'
+const TODO_O_CODIGO = '^(?:apps|tools|infra)/'
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-conta-global reprova só o que a fixture marca
-const TODO_O_CODIGO = '^(?:apps|packages|tools|infra)/'
+const TODO_O_CODIGO = '^(?:apps|packages|infra)/'
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-conta-global reprova só o que a fixture marca
-const TODO_O_CODIGO = '^(?:apps|packages|tools|infra)/'
+const TODO_O_CODIGO = '^(?:apps|packages|tools)/'
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sem-ciclo reprova só o que a fixture marca
-tsPreCompilationDeps: true,
+tsPreCompilationDeps: false,
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › real: zero violações e zero ciclos
-tsConfig: { fileName: `${__dirname}/../../tsconfig.base.json` },
+tsConfig: { fileName: `${__dirname}/../../nao-existe.json` },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › real: zero violações e zero ciclos
-exclude: { path: String.raw`(?:^|/)(?:dist|__fixtures__/camadas)/` },
+exclude: { path: String.raw`(?:^|/)(?:dist)/` },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › shared-nao-importa-nucleo-nem-app reprova só o que a fixture marca
-exclude: { path: String.raw`(?:^|/)(?:dist|__fixtures__/camadas)/` },
+exclude: { path: String.raw`(?:^|/)(?:__fixtures__/camadas)/` },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › sem-ciclo reprova só o que a fixture marca
-doNotFollow: { path: 'node_modules' },
+doNotFollow: { path: 'nao-existe-nenhuma-pasta-assim' },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-conta-global reprova só o que a fixture marca
-exportsFields: ['exports'],
+exportsFields: [],
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-conta-global reprova só o que a fixture marca
-conditionNames: ['source', 'import'],
+conditionNames: ['import'],
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › controller-nao-importa-drizzle reprova só o que a fixture marca
-conditionNames: ['source', 'import'],
+conditionNames: ['source'],
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › real: todo alvo de regra existe no grafo
-to: { path: `${SESSAO}tenant/resolucao-de-tenant\\.repository\\.ts$` },
+to: { path: `${SESSAO}tenant/resolucao-de-tenante\\.repository\\.ts$` },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › real: todo alvo de regra existe no grafo
-const CONTA_GLOBAL = String.raw`^packages/nucleo/src/ciclo-de-vida/conta-global\.repository\.ts$`
+const CONTA_GLOBAL = String.raw`^packages/nucleo/src/ciclo-de-vida/conta-globale\.repository\.ts$`
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › real: todo alvo de regra existe no grafo
-to: { path: '^apps/api/src/operacao/painel/painel\\.repository\\.ts$' },
+to: { path: '^apps/api/src/operacao/painel/painele\\.repository\\.ts$' },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › real: a aresta da redefinição
-conditionNames: ['source', 'import'],
+conditionNames: ['import'],
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-painel-repository reprova só o que a fixture marca
-from: { path: TODO_O_CODIGO, pathNot: ['^apps/api/src/operacao/painel/painel\\.service\\.ts$', TESTE] },
+from: { path: TODO_O_CODIGO, pathNot: ['^apps/api/src/operacao/', TESTE] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › cerca-painel-repository reprova só o que a fixture marca
-from: { path: TODO_O_CODIGO, pathNot: ['^apps/api/src/operacao/painel/painel\\.service\\.ts$', TESTE] },
+from: { path: TODO_O_CODIGO, pathNot: ['^apps/api/src/operacao/painel/', TESTE] },
```

```mutacao
arquivo: tools/guardas/camadas.cjs
teste: tools/guardas/camadas.test.ts › api-nao-importa-ops reprova só o que a fixture marca
-from: { path: API, pathNot: [`${API}ops/`, TESTE] },
+from: { path: API, pathNot: [`${API}ops/`, TESTE, '^apps/api/src/operacao/painel/painel\\.service\\.ts$'] },
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › reprova quem usa a classe por uma ponte
-{ classe: 'ResolucaoDeTenantRepository', uso: /\bResolucaoDeTenantRepository\b|resolucao-de-tenant\.repository/, zona: ['apps/api/src/sessao/'] },
+// removido
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › reprova quem usa a classe por uma ponte
-{ classe: 'ContaGlobalRepository', uso: /\bContaGlobalRepository\b|conta-global\.repository|@educa\/nucleo\/conta-global/, zona: ['apps/api/src/sessao/', 'packages/nucleo/src/ciclo-de-vida/'] },
+// removido
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › reprova quem usa a classe por uma ponte
-{ classe: 'PainelRepository', uso: /\bPainelRepository\b|painel\.repository/, zona: ['apps/api/src/operacao/painel/painel.service.ts', 'apps/api/src/operacao/painel/painel.repository.ts'] },
+// removido
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › reprova quem usa a classe por uma ponte
-{ classe: 'ContaGlobalRepository', uso: /\bContaGlobalRepository\b|conta-global\.repository|@educa\/nucleo\/conta-global/, zona: ['apps/api/src/sessao/', 'packages/nucleo/src/ciclo-de-vida/'] },
+{ classe: 'ContaGlobalRepository', uso: /\bContaGlobalRepository\b|conta-global\.repository|@educa\/nucleo\/conta-global/, zona: ['apps/api/src/sessao/'] },
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › reprova quem usa a classe por uma ponte
-{ classe: 'ResolucaoDeTenantRepository', uso: /\bResolucaoDeTenantRepository\b|resolucao-de-tenant\.repository/, zona: ['apps/api/src/sessao/'] },
+{ classe: 'ResolucaoDeTenantRepository', uso: /\bResolucaoDeTenantRepository\b|resolucao-de-tenant\.repository/, zona: [] },
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › reprova quem usa a classe por uma ponte
-{ classe: 'PainelRepository', uso: /\bPainelRepository\b|painel\.repository/, zona: ['apps/api/src/operacao/painel/painel.service.ts', 'apps/api/src/operacao/painel/painel.repository.ts'] },
+{ classe: 'PainelRepository', uso: /\bPainelRepository\b|painel\.repository/, zona: ['apps/api/src/operacao/painel/', 'apps/api/src/operacao/painel/painel.repository.ts'] },
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › reprova quem usa a classe por uma ponte
-.filter((arquivo) => !deTeste(arquivo.caminho) && !arquivo.caminho.includes('/__fixtures__/'))
+.filter((arquivo) => !arquivo.caminho.includes('/__fixtures__/'))
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › reprova quem usa a classe por uma ponte
-.filter((arquivo) => !deTeste(arquivo.caminho) && !arquivo.caminho.includes('/__fixtures__/'))
+.filter((arquivo) => !deTeste(arquivo.caminho))
```

```mutacao
arquivo: apps/api/test/arquitetura.test.ts
teste: apps/api/test/arquitetura.test.ts › reprova quem usa a classe por uma ponte
-.filter((arquivo) => uso.test(semComentarios(arquivo.texto)))
+.filter((arquivo) => uso.test(arquivo.texto))
```

```mutacao
arquivo: apps/api/src/sessao/conclusao/conclusao-de-login.ts
teste: tools/guardas/camadas.test.ts › real: zero violações e zero ciclos
-import { SessaoDeOrigemRepository } from '../../credencial/sessao-de-origem.repository.js'
+import { SessaoDeOrigemRepository } from '../../credencial/sessao-de-origem.repository.js'
+import type {} from '../login/login.service.js'
```

```mutacao
arquivo: package.json
teste: tools/guardas/camadas.test.ts › guarda:camadas é o comando das cinco pastas
-"lint": "eslint . --max-warnings=0 && node tools/guardas/lint.ts && npm run guarda:camadas",
+"lint": "eslint . --max-warnings=0 && node tools/guardas/lint.ts",
```

```mutacao
arquivo: package.json
teste: tools/guardas/camadas.test.ts › guarda:camadas é o comando das cinco pastas
-"lint": "eslint . --max-warnings=0 && node tools/guardas/lint.ts && npm run guarda:camadas",
+"lint": "eslint . --max-warnings=0 && node tools/guardas/lint.ts ; npm run guarda:camadas",
```

```mutacao
arquivo: package.json
teste: tools/guardas/camadas.test.ts › guarda:camadas é o comando das cinco pastas
-"guarda:camadas": "depcruise --config tools/guardas/camadas.cjs apps packages tools infra e2e",
+"guarda:camadas": "depcruise --config tools/guardas/camadas.cjs apps packages tools infra",
```

```mutacao
arquivo: package.json
teste: tools/guardas/camadas.test.ts › cerca-resolucao-de-tenant reprova só o que a fixture marca
-"guarda:camadas": "depcruise --config tools/guardas/camadas.cjs apps packages tools infra e2e",
+"guarda:camadas": "depcruise --config/guardas/camadas.cjs apps packages infra e2e",
```

```mutacao
arquivo: package.json
teste: tools/guardas/camadas.test.ts › guarda:camadas é o comando das cinco pastas
-"lint": "eslint . --max-warnings=0 && node tools/guardas/lint.ts && npm run guarda:camadas",
+"lint": "eslint . && node tools/guardas/lint.ts && npm run guarda:camadas",
```

```mutacao
arquivo: package.json
teste: tools/guardas/camadas.test.ts › cerca-resolucao-de-tenant reprova só o que a fixture marca
-"guarda:camadas": "depcruise --config tools/guardas/camadas.cjs apps packages tools infra e2e",
+"guarda:camadas": "depcruise --config/guardas/camadas.cjs apps packages infra e2e",
```

```mutacao
arquivo: package.json
teste: tools/guardas/camadas.test.ts › guarda:camadas é o comando das cinco pastas
-"lint": "eslint . --max-warnings=0 && node tools/guardas/lint.ts && npm run guarda:camadas",
+"lint": "eslint . && node tools/guardas/lint.ts && npm run guarda:camadas",
```

```mutacao
arquivo: package.json
teste: tools/guardas/camadas.test.ts › dependency-cruiser em 18.7.0 exato
-"dependency-cruiser": "18.7.0",
+"dependency-cruiser": "^18.7.0",
```

```mutacao
arquivo: vitest.config.ts
teste: tools/guardas/camadas.test.ts › o vitest não coleta a árvore das fixtures
-const ignorados = ['**/node_modules/**', '**/dist/**', 'e2e/**', 'tools/ci/fixtures/**', 'tools/guardas/__fixtures__/**', 'mockups/**', '.claude/worktrees/**']
+const ignorados = ['**/node_modules/**', '**/dist/**', 'e2e/**', 'tools/ci/fixtures/**', 'mockups/**', '.claude/worktrees/**']
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | `TESTE` (`camadas.cjs`) libera das cercas qualquer `src/**/__fixtures__/` ou `src/**/test/`; hoje existem `apps/web/src/__fixtures__`, `apps/web/src/operacao/__fixtures__` e `packages/nucleo/src/ia/__fixtures__`. Restringir o padrão ou deixar escrito | `TODO.md`: muda o que o lint acusa no código de hoje, e não é barato |
| tenancy-guardian (1ª) | O `import()` com caminho calculado não aparece para o depcruise | Coberto pela varredura por nome (`arquitetura.test.ts › o nome das classes cercadas…`), que não depende do caminho |
| infra-guardian (1ª) | `tenancy-guardian` confirmar que o `camadas.test.ts` prova cada cerca | Sem ação: é o que os itens 1 a 5 da ordem tratam |
| infra-guardian (1ª) | Anotar a duração do `depcruise` no `npm run lint` no `/retro` | A medida está em `onda-1a.md`, "Como ficou (12.0)": `guarda:camadas` 2,9 s sobre `eslint .` 17,7 s e a passada das guardas 9,3 s |
| test-engineer (1ª) | A rodada real exclui só `__fixtures__/camadas/`; as fixtures da 9.0, da 13.0 e `tools/ci/fixtures/` entram no grafo real. Excluir todo `__fixtures__/` e `tools/ci/fixtures/`, ou registrar a escolha | `TODO.md` e tarefa 13.0, que acrescenta fixture em `tools/guardas/__fixtures__/` e toca o mesmo `exclude` |
| tenancy-guardian (2ª) | Reexport com outro nome, feito de dentro da zona (`export { PainelRepository as Leitor }`): a varredura por nome não vê alias. Fechar barato: reprovar `export` do nome da classe (e `export *` do arquivo dela) em arquivo da zona que não seja o da classe nem um barril permitido | `TODO.md` |
| tenancy-guardian (2ª) | `arquitetura.test.ts`: nada prova que a varredura real lê `tools/` e `infra/`; o primeiro `it` deveria exigir ao menos um arquivo lido em cada uma das quatro pastas, com mutação que tire `tools` da lista | `TODO.md` |
| tenancy-guardian (2ª), test-engineer (2ª) | A varredura por nome não lê `.cjs` nem `.cts`: incluir as duas extensões ou escrever por que ficam de fora | `TODO.md`, junto com a anterior |
| tenancy-guardian (2ª) | Pastas `test/` e `__fixtures__/` dentro de `src/` ficam fora da varredura: o mesmo furo do `TESTE` | `TODO.md`: na linha do `TESTE`, que já existia |
| revisor-geral (2ª) | `deTeste` não reconhece `*.spec.ts` nem `*.test.tsx`, e o `TESTE` do `camadas.cjs` reconhece; usar o mesmo critério nos dois ou explicar por escrito | `TODO.md`, junto com a linha do `TESTE` |
| revisor-geral (2ª) | "Divergências resolvidas" sem a linha dizendo que a varredura por nome continua, reduzida | `TODO.md` |
| test-engineer (2ª) | A tabela "Testes que provam a regra" não tem linha para o `real: todo alvo de regra existe no grafo…` nem para o `describe` "o nome das classes cercadas só aparece dentro da zona…", com a mutação de cada uma | `TODO.md` |
| test-engineer (2ª) | Blocos de mutação repetidos e o que tira `tools` do comando quebra o caminho da configuração em vez de tirar só `tools` da lista de pastas | `TODO.md` |
| test-engineer (2ª) | As duas pendências do `TODO.md` (`TESTE` e `exclude` de `__fixtures__/camadas/`) estão bem registradas; a 13.0 decide o `exclude` | Sem ação: já está no `TODO.md` |
| infra-guardian (2ª) | O `/retro` anotar quanto o `guarda:camadas` acrescenta ao `npm run lint` | A linha de base de 2,9 s está em `onda-1a.md`, "Como ficou (12.0)" |

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
| 2026-10-22 22:42:58 | 2026-10-22 22:43:22 | `infra-guardian` | 1 | APROVADO | a209dce2fbd623bcc |
| 2026-10-22 22:42:57 | 2026-10-22 22:45:01 | `tenancy-guardian` | 1 | REPROVADO | a9ede2a8ab0a84cf0 |
| 2026-10-22 22:43:01 | 2026-10-22 22:45:07 | `revisor-geral` | 1 | REPROVADO | ae39893328c0ad83c |
| 2026-10-22 22:42:59 | 2026-10-22 22:47:47 | `test-engineer` | 1 | REPROVADO | afbec51330554659b |
| 2026-10-22 22:59:01 | 2026-10-22 22:59:33 | `infra-guardian` | 2 | APROVADO | ae6a66780678ea122 |
| 2026-10-22 22:59:07 | 2026-10-22 23:00:14 | `test-engineer` | 2 | APROVADO | ab643b9254309bb80 |
| 2026-10-22 22:59:13 | 2026-10-22 23:00:28 | `revisor-geral` | 2 | APROVADO | ad5dfeb8d69cf2014 |
| 2026-10-22 22:58:56 | 2026-10-22 23:00:42 | `tenancy-guardian` | 2 | APROVADO | a3b9e33b40e019211 |
