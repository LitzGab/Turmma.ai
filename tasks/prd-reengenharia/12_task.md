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

- [ ] 12.1 — `dependency-cruiser@18.7.0` exato em `devDependencies`; `tools/guardas/camadas.cjs` com as regras do §2 da onda, todas `error`
- [ ] 12.2 — `guarda:camadas` no `package.json`, e `lint` terminando em `&& npm run guarda:camadas`
- [ ] 12.3 — As três cercas, por import direto, e a exceção de `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:3`; sem `reaches` (R63)
- [ ] 12.4 — Sai do `arquitetura.test.ts` o que as regras cobrem, depois das fixtures verdes
- [ ] 12.5 — Testes: `camadas.test.ts` com as fixtures, o repositório real e o tempo do lint

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/guardas/camadas.cjs` | novo |
| `tools/guardas/camadas.test.ts` | novo |
| `tools/guardas/__fixtures__/camadas/**` | novo |
| `apps/api/test/arquitetura.test.ts` | alterado |
| `package.json` | alterado |
| `package-lock.json` | alterado |

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

