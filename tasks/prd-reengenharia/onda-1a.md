# Tech Spec da X5 — Onda 1A: travas e borda de entrada

**Comum:** `techspec.md` · **PRD:** RF5, RF9, RF10, RF11 · **Tarefas:** 6.0 a 17.0

## 1. O que muda

Três travas entram sem tocar `tools/processo/` nem `.github/`: tenant (teste por AST nos 71 repositories), camadas
(`dependency-cruiser` no `npm run lint`) e tamanho (três regras do ESLint, com catraca). Antes, os 3 ciclos somem e a
escola vem do contexto. A entrada HTTP ganha esquema no parâmetro, e o boot recusa o handler sem ele.

## 2. Desenho

### T6 — Trava de tenant (RF9)

**O teste.** `tools/guardas/repositories-com-escopo.test.ts` (unidade) usa `tools/guardas/escopo-dos-repositories.ts`,
por AST com o `typescript` da raiz (um comentário enganaria a busca por texto), sobre todo `*.repository.ts` não teste de
`apps/*/src` e `packages/*/src`.

**A prova.** Todo método público que toca o banco tem uma de três:
- **(a)** chama uma função de `PROVAS_DE_ESCOPO`, direto ou por ajudante do mesmo arquivo: `exigirEscolaDoContexto`,
  `identidadeDaRequisicao` ou `escopoDoJobNoContexto`;
- **(b)** tem `@SemEscopo('…')` com motivo literal de pelo menos 30 caracteres;
- **(c)** está em `REPOSITORIES_SEM_ESCOPO` (`{ arquivo, motivo, metodos }`).

**A lista só encolhe:** entrada conforme ou de arquivo inexistente reprova com "tire da lista". Classe `*Repository`
fora de `*.repository.ts` também reprova (hoje, `SuspensoesDaEscolaRepository`, em `apps/api/src/assistente/time.service.ts:9`).

**Casos negativos** (fontes no `__fixtures__`): método sem prova, `exigir` só em comentário, motivo curto, `escolaId` por
parâmetro.

**Os 25 de hoje:** 8 já têm `@SemEscopo`; os 17 outros:

| Grupo | Motivo | Destino |
|---|---|---|
| 9 com cópia local de `contextoAtual()?.escolaId` (api: `escola-sessao`, `convite`, `criacao-de-sessao`, `escrita-de-sessao`, `redefinicao-de-mfa`, `registro-de-acesso`; nucleo: `configuracao-operacional`, `efeito-sintetico`, `uso`) | esquecimento | 7.0 troca por `exigirEscolaDoContexto` |
| `auditoria`, `insercao-de-auditoria`, `job-registro` | escola nula legítima, rotina `sistema.*` | lista |
| `operacao/operador` | a equipe não tem escola (RF6 da A0) | lista |
| `nucleo/identidade/sessao` | cria o contexto | lista |
| `ia/consumo`, `ia/orcamento`, `ia/suspensao` | `escolaId` por argumento | 8.0 |
| `ia/execucao` (4 métodos, `ExecucaoAgendada.escolaId`) | executor da IA | lista, até a onda 3 (R39) |

⚠️ A lista exata, por método, sai da primeira execução e se fecha na 6.0, com evidência.

**A IA pelo contexto (8.0).**
- `SuspensaoDeFuncao.estaSuspensa(funcao)` e `ConsultaDeOrcamento` perdem `escolaId`, e `ConsumoDeIa` perde o campo; os
  três repositories usam `exigirEscolaDoContexto()`.
- O `ProvedorDeIa` mantém a conferência de `pedido.escolaId` contra o contexto (`provedor.ts:101`). O único chamador de
  `ia.gerar` já roda em `executarNoContexto` (`agendador-de-execucoes.ts:101`).

**Tabela só no repository (9.0).** `guardas/tabela-so-no-repository`, em `tools/guardas/index.mjs`, dentro de
`REGRAS_DAS_GUARDAS` (não se desliga por comentário).
- Barra importar de `@educa/nucleo` um nome de `tools/guardas/tabelas-do-nucleo.mjs` fora de `*.repository.ts`, teste e
  `packages/nucleo/src/db/**`. Um teste confere a lista contra as exportações `PgTable` do barril.
- Hoje só `time.service.ts` viola. `no-restricted-imports` não serve: `resumoDoAnalista` é tarefa de IA e tabela.

### T7 — Camadas e ciclos (RF10)

**Os ciclos (10.0 e 11.0).**
- **10.0, operador:** `SessaoDeOperadorParaGuarda` e `ParaRenovar` saem de `operacao/operador.repository.ts:74` para
  `operacao/prazos-da-sessao.ts`. `ConferenciaDoAutor` (`operador.repository.ts:63`) vai para `sessao/`, e
  `convite.service.ts:25` e `redefinicao-de-mfa.ts:5` deixam de importar `operacao/`.
- **11.0, `login.service`:** nascem `sessao/origem-da-requisicao.ts` (`OrigemDaRequisicao`, `ResultadoDoLogin`,
  `ipParaRegistro`) e `sessao/identificadores-do-login.ts` (`BYTES_DO_REFRESH`, `hashDoRefresh`, `normalizarEmail`).
  `etapaDoLogin` vai para `conclusao-de-login.ts`. Os importadores apontam para os novos, sem reexportar.

**A trava (12.0).** `dependency-cruiser@18.7.0` em `devDependencies`, `--save-exact` (N9), com `tools/guardas/camadas.cjs`
derivada de `.reengenharia/medicao/depcruise.cjs`. Regras, todas `error`:
- sem ciclo, contando tipo;
- `shared` não importa `nucleo` nem app, e `nucleo` não importa app;
- app não importa outra app (fora de teste, até a onda 2 levar os helpers a `tools/testes/`);
- a web não importa `nucleo` nem backend, e produção não importa teste;
- na API: controller não importa `*.repository` nem `drizzle-orm`, service não importa `drizzle-orm`, repository não
  importa service nem controller;
- `sessao/` não importa `operacao/`.

Exceção declarada: `nucleo/.../expurgo-da-escola.repository.ts:3`.

**Onde roda.** `guarda:camadas` roda `depcruise --config tools/guardas/camadas.cjs apps packages`, e `lint` termina em
`&& npm run guarda:camadas`: a esteira e o portão já o rodam (R39).

**O teste das regras.** `tools/guardas/camadas.test.ts` roda o CLI sobre fixtures e exige as violações exatas. Um segundo
caso, no repositório real, exige a aresta
`redefinicao-de-mfa.ts → packages/nucleo/src/ciclo-de-vida/conta-global.repository.ts`: prova que o `typescript` foi
achado e a rodada não deu "0 módulos" (R7).

**O que sai de `apps/api/test/arquitetura.test.ts`:** o `describe` da resolução de tenant, os 2 primeiros `it` da conta
global, os 2 últimos do painel e a metade "nenhum módulo importa `ops/`". Ficam os por tabela, SQL, migration e rotas.

### T8 — Tamanho com catraca (RF11)

**As regras.** O ESLint 10.10.0 já tem `--suppress-all`, `--prune-suppressions` e falha com supressão sem uso. Bloco novo
de `eslint.config.mjs`, em `error`:
- **produção:** `complexity: 10`, `max-lines-per-function: { max: 80, skipBlankLines, skipComments }`, `max-depth: 4`;
- **teste:** `complexity` e `max-depth` valem, `max-lines-per-function` desligada (callbacks de `describe`/`it`;
  R39);
- **e2e:** `max-lines: 800` em `e2e/**/*.spec.ts`.

**A linha de base.** `eslint . --suppress-all` gera `eslint-suppressions.json`, e quem corta uma função roda
`--prune-suppressions` na mesma tarefa. `tools/guardas/catraca.test.ts` exige que o arquivo cite só as regras de tamanho,
nunca `guardas/*`, e que a soma por regra seja igual ao `TETO` escrito no teste (subir o teto aparece no diff).

**O comentário não fura.** `criarEslintDasGuardas` ganha `applySuppressions: true` e as três regras no `ruleFilter`, e a
segunda passada ignora `eslint-disable`.

**Mover arquivo** (onda 2): `git mv`, `--suppress-all` e `--prune-suppressions`; o teto prova que o total não subiu.

### T1 — Borda de entrada (RF5)

**O que existe.** O Nest 12.0.1 guarda o esquema por parâmetro (`Body({ schema })`) em `ROUTE_ARGS_METADATA`, e o zod
4.6.4 implementa `~standard`. A trava lê esse metadado.

**Onde mora:** `packages/nucleo/src/entrada/`, no molde de `permissao/`.
- **`PipeDeEntrada`** valida `metadata.schema`: corpo ou consulta inválidos viram `ENTRADA_INVALIDA`, sem `issues`, e
  caminho inválido vira `NAO_ENCONTRADO` (regra 10.6).
- **Os decorators:** `@Corpo(esquema)`, `@Consulta(esquema)`, `@IdDoCaminho(nome = 'id')` (uuid em minúsculas),
  `@IdDoCaminhoOuNada()` (o `redefinir-mfa` engole id inválido com 202) e `@SemEntrada(motivo)`. O pipe vai **no
  parâmetro**: global, não valeria em módulo sem `APP_PIPE`.
- **`ConferenciaDasEntradas`** roda no `onModuleInit`, ao lado de `ConferenciaDasPermissoes` (`app.module.ts`): o boot cai
  se um parâmetro de corpo, consulta ou caminho não tiver `schema` e pipe, sem `@SemEntrada` no método.

**O que sai** (137 handlers, 153 parâmetros: 67 corpo, 29 consulta, 57 caminho): `lerEntrada`, `idDoCaminho`,
`lerConsultaPaginada` e os `safeParse` inline. `paginar` e `paginarPor` ficam.

**A migração.** A conferência liga na 14.0, com uma lista de pendentes que só encolhe (um teste exige que cada pendente
ainda viole). A 17.0 apaga a lista. A regra `guardas/sem-req-cru` barra `requisicao.body`, `query` e `params` em
`*.controller.ts`, para o `@Req()` não contornar.

**Antes da sessão (16.0)** vem a caracterização da ordem dos erros (401 antes de 400 em `mfa.controller`): o pipe roda
antes do handler, e a ordem fica igual ou a mudança é declarada.

## 3. Falha

As travas falham fechadas: sem escola no contexto, o repository lança; depcruise sem `typescript` é pego pela aresta
exigida; controller sem esquema derruba o boot (controller sintético, no molde de `permissao-no-boot.test.ts`).

## 4. Isolamento, dado pessoal, conformidade, carga

Isolamento, dado pessoal e conformidade: `techspec.md` §6, §7 e §7b. **Carga:** o mesmo `parse` por requisição; o lint
fica mais lento, medido na 12.0.

## 5. Tarefas

| # | Título | RF | Depende de | Veto | Porte | Paralelo com |
|---|---|---|---|---|---|---|
| 6.0 | Repository sem prova de escopo nem motivo reprova o teste | 9 | — | tenancy | pequeno | 10.0, 11.0, 14.0 |
| 7.0 | Os 9 repositories com cópia local leem a escola por `exigirEscolaDoContexto` | 9 | 6.0 | tenancy | grande | 9.0, 10.0, 11.0 |
| 8.0 | A IA tira a escola do contexto, com teste de isolamento | 9 | 7.0 (a mesma lista) | tenancy, infra | grande | 9.0, 10.0, 11.0 |
| 9.0 | Importar tabela fora de repository reprova o lint | 9 | 6.0 | tenancy | pequeno | 7.0, 8.0, 10.0 |
| 10.0 | O ciclo do operador e a dependência `sessao` → `operacao` somem | 10 | — | — | pequeno | 6.0–9.0, 14.0 |
| 11.0 | Os 2 ciclos de `login.service` somem | 10 | — | — | grande | 6.0–9.0, 14.0 |
| 12.0 | Import contra a direção ou a camada, ou ciclo novo, reprova o lint | 10 | 9.0, 10.0, 11.0 | infra | grande | 7.0, 8.0, 14.0 |
| 13.0 | Função nova acima de 10/80/4 e supressão nova reprovam o lint | 11 | 12.0 | — | pequeno | 14.0, 15.0 |
| 14.0 | Handler sem esquema derruba o boot; sistema, IA, entrega, assistente e professores pelo esquema | 5 | — | tenancy | grande | 6.0–12.0 |
| 15.0 | Estrutura, sala e governança validam pelo esquema | 5 | 14.0 | tenancy | grande | 16.0, 17.0 |
| 16.0 | Sessão e operação validam pelo esquema, com a ordem dos erros caracterizada | 5 | 14.0, 11.0 | tenancy, infra | grande | 15.0 |
| 17.0 | Atividade, artefato, material, tutor e privacidade pelo esquema, e os pendentes somem | 5 | 15.0, 16.0 | tenancy, privacy | grande | — |

**O que não corre junto:** 9.0 e 13.0 editam `tools/guardas/index.mjs` (em série, pela dependência), e só a 12.0 mexe
no `package-lock.json`.
