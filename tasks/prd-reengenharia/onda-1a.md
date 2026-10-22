# Tech Spec da X5 — Onda 1A: travas e borda de entrada

**Comum:** `techspec.md` · **PRD:** RF5, RF9, RF10, RF11 · **Tarefas:** 6.0 a 17.0

## 1. O que muda

Três travas, fora de `tools/processo/` e `.github/`: tenant (AST nos 71 repositories), camadas (depcruise) e tamanho
(ESLint com catraca). A entrada HTTP ganha esquema no parâmetro, pelo `ZodValidationPipe`, e o lint recusa o controller sem ele (D81).

## 2. Desenho

### T6 — Trava de tenant (RF9)

**O teste.** `tools/guardas/repositories-com-escopo.test.ts` usa `tools/guardas/escopo-dos-repositories.ts`, por AST com o
`typescript` da raiz, sobre todo `*.repository.ts` de `apps/*/src` e `packages/*/src`.

**A prova.** Todo método público que toca o banco tem uma de três:
- **(a)** chama uma função de `PROVAS_DE_ESCOPO`, direto ou por ajudante do mesmo arquivo: `exigirEscolaDoContexto`,
  `identidadeDaRequisicao` ou `escopoDoJobNoContexto`;
- **(b)** tem `@SemEscopo('…')` com motivo literal de pelo menos 30 caracteres;
- **(c)** está em `REPOSITORIES_SEM_ESCOPO` (`{ arquivo, motivo, metodos }`), com `motivo` de pelo menos 30 caracteres.

A prova (a) mostra a chamada, não o uso no `where` nem o `ano_letivo_id`: complementa o teste de isolamento, não o
substitui.

**A lista só encolhe:** entrada conforme ou de arquivo inexistente reprova. Classe `*Repository` fora de `*.repository.ts`
também (hoje, `SuspensoesDaEscolaRepository`, `apps/api/src/assistente/time.service.ts:9`).

**Casos negativos** (`__fixtures__`): sem prova, `exigir` só em comentário, motivo curto, `escolaId` por parâmetro, e
"chama e não usa", limite declarado do analisador; por isso a 7.0 declara, por repository, a mutação "tirar o
`eq(…escolaId…)`" contra o teste de isolamento.

**Os 25 de hoje:** 8 já têm `@SemEscopo`. Dos 17 outros:
- **7.0:** os 9 com cópia local de `contextoAtual()?.escolaId` (api: `escola-sessao`, `convite`, `criacao-de-sessao`,
  `escrita-de-sessao`, `redefinicao-de-mfa`, `registro-de-acesso`; nucleo: `configuracao-operacional`, `efeito-sintetico`,
  `uso`) passam a `exigirEscolaDoContexto`.
- **8.0:** `ia/consumo`, `ia/orcamento` e `ia/suspensao`, hoje com `escolaId` por argumento.
- **Lista:** `auditoria`, `insercao-de-auditoria` e `job-registro` (escola nula em `sistema.*`), `operacao/operador` (a
  equipe não tem escola), `nucleo/identidade/sessao` (cria o contexto) e `ia/execucao`, até a 47.0 tirar (R39).

⚠️ A lista exata, por método, se fecha na 6.0, com evidência.

**A IA pelo contexto (8.0).** `SuspensaoDeFuncao.estaSuspensa`, `ConsultaDeOrcamento` e `ConsumoDeIa` perdem `escolaId`
e usam `exigirEscolaDoContexto()`; o `ProvedorDeIa` mantém a conferência de `pedido.escolaId` (`provedor.ts:101`).

**Tabela só no repository (9.0).** `guardas/tabela-so-no-repository` (`tools/guardas/index.mjs`) barra importar de
`@educa/nucleo` um nome de `tools/guardas/tabelas-do-nucleo.mjs` fora de `*.repository.ts`, teste e
`packages/nucleo/src/db/**`; um teste confere a lista contra as exportações `PgTable`. Hoje só `time.service.ts` viola.

### T7 — Camadas e ciclos (RF10)

**Os ciclos (10.0 e 11.0).**
- **10.0, operador:** `SessaoDeOperadorParaGuarda` e `ParaRenovar` saem de `operacao/operador.repository.ts:74` para
  `operacao/prazos-da-sessao.ts`; `ConferenciaDoAutor` (`:63`) vai para `sessao/`, e `convite.service.ts:25` e
  `redefinicao-de-mfa.ts:5` deixam de importar `operacao/`.
- **11.0, `login.service`:** nascem `sessao/origem-da-requisicao.ts` (`OrigemDaRequisicao`, `ResultadoDoLogin`,
  `ipParaRegistro`) e `sessao/identificadores-do-login.ts` (`BYTES_DO_REFRESH`, `hashDoRefresh`, `normalizarEmail`);
  `etapaDoLogin` vai para `conclusao-de-login.ts`, sem reexportar.

**A trava (12.0).** `dependency-cruiser@18.7.0` exato em `devDependencies` (N9), com `tools/guardas/camadas.cjs`. Regras,
todas `error`:
- sem ciclo, contando tipo;
- `shared` não importa `nucleo` nem app, e `nucleo` não importa app;
- app não importa outra app (fora de teste, até a onda 2 levar os helpers a `tools/testes/`);
- a web não importa `nucleo` nem backend, e produção não importa teste;
- na API: controller não importa `*.repository` nem `drizzle-orm`, service não importa `drizzle-orm`, repository não
  importa service nem controller;
- `sessao/` não importa `operacao/`;
- **as três cercas de tenant** hoje em texto no `arquitetura.test.ts`: só `apps/api/src/sessao/**` importa
  `resolucao-de-tenant.repository` (`:58`); só `sessao/**` e `nucleo/src/ciclo-de-vida/**` importam a conta global
  (`conta-global.repository` ou `@educa/nucleo/conta-global`, `:109`, `:122`); só `operacao/painel.service.ts` importa
  `painel.repository` (`:179`, `:183`). Teste fica de fora, como **mudança aceita** (hoje vale com lista fechada,
  `arquitetura.test.ts:52`, `:113-118`).

Exceção: `nucleo/.../expurgo-da-escola.repository.ts:3`.

**Onde roda.** Um comando só, nas cinco pastas da varredura de hoje (`arquitetura.test.ts:32`): `guarda:camadas` roda
`depcruise --config tools/guardas/camadas.cjs apps packages tools infra e2e`, e `lint` termina em `&& npm run
guarda:camadas`: a esteira e o portão já o rodam (R39).

**O teste das regras.** `tools/guardas/camadas.test.ts` roda o CLI sobre fixtures e exige as violações exatas. As três
cercas têm fixture de import, de `export * from`, de `import()` dinâmico, de `tools/x.ts` importando a resolução, e de
quem está fora importando `sessao/x.ts`, que a reexporta: a regra segue o reexport (`reaches` do depcruise, que a 12.0 confere). Sem `reaches`, o describe do `arquitetura.test.ts` que varre pelo nome da
classe fica até a 34.0. Tirar a regra deixa o teste vermelho. Outro caso, no repositório real, exige a aresta
`redefinicao-de-mfa.ts → packages/nucleo/src/ciclo-de-vida/conta-global.repository.ts`: prova que o `typescript` foi
achado e a rodada não deu "0 módulos" (R7).

**O que sai de `apps/api/test/arquitetura.test.ts`,** só no commit em que as regras ficam verdes com as fixtures: o
`describe` da resolução, os 2 primeiros `it` da conta global, os 2 últimos do painel e a metade "nenhum módulo importa
`ops/`". Ficam o `it` dos métodos e `@SemEscopo` do painel e os por tabela, SQL, migration e rotas.

### T8 — Tamanho com catraca (RF11)

**As regras**, num bloco novo de `eslint.config.mjs`, em `error` (o ESLint 10.10 já tem `--suppress-all` e
`--prune-suppressions`): produção com `complexity: 10`, `max-lines-per-function: 80` (sem branco nem comentário) e
`max-depth: 4`; teste sem `max-lines-per-function` (R39); e2e com `max-lines: 800`.

**A linha de base.** `eslint . --suppress-all` gera `eslint-suppressions.json`; quem corta uma função roda
`--prune-suppressions` na mesma tarefa. `tools/guardas/catraca.test.ts` exige que o arquivo cite só as regras de tamanho, que
a soma por regra seja igual ao `TETO` do teste, e que nenhum arquivo tenha mais supressões que no `git show HEAD:` do
arquivo: trocar uma função longa por outra no mesmo commit não se esconde na soma.

**O comentário não fura:** `criarEslintDasGuardas` ganha `applySuppressions: true` e as três regras no `ruleFilter`, e a
segunda passada ignora `eslint-disable`.

### T1 — Borda de entrada (RF5, revista pela D81 em 22/10/2026)

**O padrão do NestJS, sem mecanismo nosso.** A versão anterior (`@Corpo`, `@Consulta`, `@IdDoCaminho`, `@SemEntrada` e a
`ConferenciaDasEntradas` no boot, com lista de pendentes) saiu: é o que a documentação do NestJS mostra em "Pipes" ›
*Object schema validation*, com a trava no ESLint. O `nestjs-zod` 5.5 declara `@nestjs/common` e `@nestjs/swagger` só até
`^11`, e usamos o 12.

**Onde mora:** `packages/nucleo/src/entrada/`, ao lado de `permissao/`.
- **`ZodValidationPipe`** (`zod-validation.pipe.ts`, `PipeTransform`): `new ZodValidationPipe(esquema)` em `@Body(…)` e
  `@Query(…)`. Inválido lança `ErroDeDominio(ENTRADA_INVALIDA)`, sem `issues` na resposta nem no log (regras 20.9 e 20.11);
  devolve `lido.data`, com os `default` do esquema. A opção `{ errorCode: CodigoDeErro.NAO_ENCONTRADO }` serve ao
  parâmetro de caminho que não é uuid: `ferramenta` (`ferramentas.controller.ts:19`), `chave` (`governanca.controller.ts:52`),
  `questao` (`minha-atividade.controller.ts:54`), `slug` e `provedor`. Cada rota é caracterizada antes de migrar.
- **`IdPipe`** (`id.pipe.ts`), no molde do `ParseUUIDPipe`: `@Param('id', IdPipe)` aceita uuid em qualquer caixa e
  devolve em minúsculas, como `idDoCaminho` (`estrutura/entrada.ts:8`) faz hoje; fora do formato, `NAO_ENCONTRADO`
  (regra 10.6). `new IdPipe({ invalidAsUndefined: true })` devolve `undefined`: o `redefinir-mfa` responde 202 sem efeito
  ao id inválido.
- **O pipe vai no parâmetro**, nunca global: global não valeria em módulo sem `APP_PIPE`, e esconde o contrato do handler.
  O tipo do parâmetro é o do esquema em `@educa/shared`, nunca `unknown`.
- **A ordem dos erros é a do Nest:** guarda antes de pipe (sem sessão → 401; rota de outro papel → o 404 da guarda), e
  os pipes dos parâmetros na ordem que ele der. A regra 10.6 só exige que o id de B e o inexistente respondam igual, com o
  mesmo corpo; a ordem entre corpo e caminho não revela existência e é caracterizada, não forçada. Onde a credencial é
  lida no handler (`mfa.controller.ts:37`, `:62`), o corpo inválido sem token passa a dar 400 antes do 401, sem gastar
  tentativa: mudança declarada na 16.0.
- **A caracterização da 14.0 entra no commit da tarefa, e não num commit à parte** (exceção ao `techspec.md` §1, que a pede
  "num commit anterior"): o hook (`tools/processo/revisoes.ts`) só aceita commit com código de `apps/`, `packages/` ou `tools/`
  marcado `(tarefa N.0)`, com portão carimbado e a rodada dos revisores, e um commit só de teste pediria tudo isso duas vezes.
  Os casos foram escritos e rodados, verdes, contra o código antigo, antes de qualquer controller mudar. **Uma mudança de
  comportamento que eles acharam:** com o id e o corpo inválidos ao mesmo tempo, `decidir` (`entrega`), `refazer` e `revogar`
  (`professores`) respondiam o 404 do id e passam a responder o 400 do corpo, o último parâmetro, que o Nest resolve primeiro.
  As asserções dessas rotas foram escritas com o 404 e passaram no código antigo, e foram reescritas para o 400 depois da
  migração. É a ordem entre corpo e caminho que esta seção já aceita ("caracterizada, não forçada"), e não revela existência:
  com o corpo inválido, qualquer id, de outra escola ou inexistente, dá o mesmo 400.

**A trava é o ESLint core.** Um bloco de `no-restricted-syntax` em `eslint.config.mjs`, para `*.controller.ts`, reprova
`@Body()`, `@Query()` e `@Param(nome)` sem pipe, `@Req()` e `requisicao.body`, `.query` e `.params`. O `files` do bloco
cresce por tarefa (14.0: `sistema`, `ia`, `entrega`, `assistente`, `professores`; 15.0: `estrutura`, `sala`, `governanca`;
16.0: `sessao`, `operacao`) e na 17.0 vira `apps/api/src/**/*.controller.ts`. Um segundo bloco, logo depois, devolve o
`@Req()` a `sessao/` e `operacao/`, que leem cookie e IP pela requisição (`ipDaRequisicao`), com o motivo no comentário.
`no-restricted-syntax` entra em `REGRAS_DAS_GUARDAS`, e o `eslint-disable` dele não fura a segunda passada. O
`@UploadedFile()` não é barrado: os campos ao lado dele passam pelo `ZodValidationPipe`.

**Sai** (137 handlers, 153 parâmetros): `lerEntrada`, `idDoCaminho`, `lerConsultaPaginada` e os `safeParse` inline, na
17.0; `paginar` fica.

## 3. Falha

As travas falham fechadas: sem escola, o repository lança; depcruise sem `typescript` é pego pela aresta exigida;
controller que recebe entrada sem pipe reprova o lint, e o comentário não fura a segunda passada.

## 4. Isolamento, dado pessoal, conformidade, carga

`techspec.md` §6, §7 e §7b. **Carga:** o mesmo `parse` por requisição; o lint mais lento se mede na 12.0.

## 5. Tarefas

| # | Título | RF | Depende de | Veto | Porte |
|---|---|---|---|---|---|
| 6.0 | Repository sem prova de escopo nem motivo reprova o teste | 9 | — | tenancy | pequeno |
| 7.0 | Os 9 repositories com cópia local leem a escola por `exigirEscolaDoContexto` | 9 | 6.0 | tenancy | grande |
| 8.0 | A IA tira a escola do contexto, com teste de isolamento | 9 | 7.0 (a mesma lista) | tenancy, infra | grande |
| 9.0 | Importar tabela fora de repository reprova o lint | 9 | 6.0 | tenancy | pequeno |
| 10.0 | O ciclo do operador e a dependência `sessao` → `operacao` somem | 10 | — | — | pequeno |
| 11.0 | Os 2 ciclos de `login.service` somem | 10 | — | — | grande |
| 12.0 | Import contra a direção ou a camada, ou ciclo novo, reprova o lint | 10 | 9.0, 10.0, 11.0 | tenancy, infra | grande |
| 13.0 | Função nova acima de 10/80/4 e supressão nova reprovam o lint | 11 | 12.0 | — | pequeno |
| 14.0 | Corpo, consulta ou id fora do esquema não chegam ao service; sistema, IA, entrega, assistente e professores migram | 5 | — | tenancy | grande |
| 15.0 | Estrutura, sala e governança validam pelo `ZodValidationPipe` | 5 | 14.0 | tenancy | grande |
| 16.0 | Sessão e operação validam pelo `ZodValidationPipe`, sem gastar tentativa com entrada inválida | 5 | 14.0, 11.0 | tenancy, infra | grande |
| 17.0 | Atividade, artefato, material, tutor e privacidade migram, e o lint vale em todo controller | 5 | 15.0, 16.0 | tenancy, privacy | grande |

9.0 e 13.0 editam `tools/guardas/index.mjs` em série; só a 12.0 mexe no `package-lock.json`.
