# Tarefa 14.0 — Corpo, consulta ou id fora do esquema não chegam ao service; sistema, IA, entrega, assistente e professores migram

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Nasce a validação de entrada do padrão NestJS (D81): `ZodValidationPipe` e `IdPipe` no parâmetro, e o
`no-restricted-syntax` do ESLint reprova o controller que recebe entrada sem pipe. Cinco módulos migram.

## Contexto necessário

- `onda-1a.md` §2 "T1" (reescrita pela D81); `docs/decisoes.md` D81; `prd.md` §11 (RF5 revisto); regras 10.3, 10.6,
  20.9, 20.11, 00.9
- NestJS, "Pipes" › *Object schema validation* e o `ParseUUIDPipe`. **Sem conferência no boot, sem lista de pendentes,
  sem `nestjs-zod`**
- O que sai depois (17.0): `apps/api/src/estrutura/entrada.ts` (`lerEntrada`, `idDoCaminho`, `lerConsultaPaginada`)

## Subtarefas

- [x] 14.1 — Caracterização, num commit antes: o inválido e o 404 de cada rota dos cinco módulos, e o uuid em maiúsculas
- [x] 14.2 — `ZodValidationPipe` e `IdPipe` em `packages/nucleo/src/entrada/` (D81), sem `issues` na resposta nem no log
- [x] 14.3 — O bloco de `no-restricted-syntax` em `eslint.config.mjs`: `@Body()`, `@Query()` e `@Param()` sem pipe, `@Req()` e `requisicao.body`, `.query` e `.params`, valendo nos cinco módulos migrados
- [x] 14.4 — Migram `sistema/`, `ia/`, `entrega/`, `assistente/` e `professores/`
- [x] 14.5 — Testes: os da tabela

O desenho (os dois pipes, o bloco do ESLint que cresce por tarefa e a ordem dos erros) está em `onda-1a.md` T1.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/entrada/zod-validation.pipe.ts`, `id.pipe.ts`, `index.ts`, `entrada.test.ts` | novo |
| `packages/nucleo/src/index.ts` | alterado |
| `eslint.config.mjs`, `tools/guardas/index.mjs`, `tools/guardas/guardas.test.ts` | alterado |
| `tools/guardas/__fixtures__/entrada-sem-esquema.ts`, `entrada-com-esquema.ts` | novo |
| `apps/api/src/{sistema,ia,entrega,assistente,professores}/*.controller.ts` | alterado |
| `apps/api/src/ia/ia.int.test.ts`, `apps/api/src/entrega/entrega.int.test.ts`, `apps/api/src/assistente/assistente.int.test.ts` | alterado |
| `apps/api/test/{professores,jobs-sinteticos}.int.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| `ZodValidationPipe`: inválido → `ENTRADA_INVALIDA`; válido → o valor do esquema (com `default` aplicado) | unidade | devolver o valor cru |
| `ZodValidationPipe` com `errorCode: NAO_ENCONTRADO` → 404 | unidade | ignorar a opção |
| `IdPipe` normaliza maiúsculas; fora do formato → `NAO_ENCONTRADO`; com `invalidAsUndefined` → `undefined` | unidade | tirar o `.toLowerCase()`; responder 400 |
| A resposta do inválido é exatamente `{ codigo: 'ENTRADA_INVALIDA' }` | integração | repassar `issues` |
| Sentinela do corpo inválido fora do log (`CapturaDeDadoPessoal`) | integração | logar `issues` |
| Corpo com `escolaId` de B → `ENTRADA_INVALIDA`, nada gravado | integração | sem `.strict()` |
| Uuid de B em maiúsculas, no contexto de A → o mesmo 404 do inexistente | integração | tirar o `eq(…escolaId…)` |
| `ia`: execução de outra pessoa, de outra escola, inexistente e fora do formato → o mesmo 404, o mesmo corpo | integração | tirar o `eq(…escolaId…)` |
| `assistente`: corpo inválido → nenhuma execução nem consumo | integração | o pipe passar o valor cru |
| `professores`: limite 101 reprova, 100 passa | integração | `.max(101)` |
| `sistema` e `entrega`: o inválido igual ao da caracterização | integração | caracterização |
| Sem sessão e corpo inválido → 401; professor em rota da coordenação com corpo inválido → 404, sem auditoria | integração | validar antes da guarda |
| Lint: `@Body()`, `@Query()`, `@Param('id')` sem pipe, `@Req()` e `requisicao.body` reprovam no controller migrado | unidade | tirar um seletor |
| Lint: o jeito certo passa; o mesmo arquivo como `x.service.ts`, ou num módulo ainda não migrado, passa | unidade | o bloco subir para todo arquivo |
| Lint: `eslint-disable-next-line no-restricted-syntax` → a segunda passada reprova | unidade | não entrar em `REGRAS_DAS_GUARDAS` |
| `permissao-no-boot.test.ts` verde | unidade | o pipe quebrar a guarda |

## Como testar

- Lint: copie `tools/guardas/guardas.test.ts › processadores do worker: nenhuma afirmação de tipo …` (os dois `it`: a
  fixture com `reprova: no-restricted-syntax` no caminho simulado `apps/api/src/ia/x.controller.ts`, e o "vale só em…"
  com `apps/api/src/estrutura/x.controller.ts` e `apps/api/src/ia/x.service.ts`). O comentário: `guarda desligada por
  comentário › a passada sem comentários do npm run lint ainda pega a violação`, com `eslintDasGuardas`.
- Seletores sugeridos (a fixture é a prova): `Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=0]`,
  `…[callee.name=/^(Body|Query|Param)$/][arguments.length=1] > Literal.arguments`, `Decorator > CallExpression[callee.name='Req']`,
  `MemberExpression[object.name='requisicao'][property.name=/^(body|query|params)$/]`.
- Isolamento: `apps/api/src/ia/ia.int.test.ts › de outra pessoa, de outra escola, inexistente e com id fora do formato
  respondem igual: 404, o mesmo corpo`.
- Log: `CapturaDeDadoPessoal` (`apps/api/test/captura-de-dado-pessoal.ts`), com `subirApi` (`api-com-sessao.ts`).
- Isolado: `npx vitest run --project unidade packages/nucleo/src/entrada tools/guardas/guardas.test.ts` e
  `npx vitest run --project integracao apps/api/src/ia/ia.int.test.ts`.
- Armadilha: o tipo do parâmetro não sai do pipe; declare-o com o tipo de `@educa/shared` (`PedidoX`), nunca `unknown`.

## Fora do escopo desta tarefa

Os outros módulos (15.0 a 17.0), apagar as funções de `estrutura/entrada.ts` (17.0), o OpenAPI e o registro de rotas (X6).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| (1) A caracterização (14.1) entra no commit da tarefa, e não num commit à parte. (2) Com o id e o corpo inválidos ao mesmo tempo, `decidir`, `refazer` e `revogar` passam de 404 (o id) a 400 (o corpo): as asserções dessas rotas foram escritas com o 404, passaram no código antigo e foram reescritas para o 400 depois da migração; o resto da caracterização ficou como foi escrita | (1) O hook só aceita commit com código de `apps/`, `packages/` ou `tools/` com `(tarefa N.0)`, portão carimbado e a rodada dos revisores, e um commit só de teste pediria tudo isso duas vezes. (2) O Nest resolve primeiro o pipe do último parâmetro, o corpo; não revela existência, porque com o corpo inválido qualquer id dá o mesmo 400 | `onda-1a.md` T1, o item "A caracterização da 14.0 entra no commit da tarefa" (exceção ao `techspec.md` §1, linha 21, "num commit anterior"), que traz também a mudança de ordem, na linha de "caracterizada, não forçada" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: packages/nucleo/src/entrada/zod-validation.pipe.ts
teste: packages/nucleo/src/entrada/entrada.test.ts › o válido devolve o valor do esquema
-return lido.data
+return valor
```

```mutacao
arquivo: packages/nucleo/src/entrada/zod-validation.pipe.ts
teste: packages/nucleo/src/entrada/entrada.test.ts › o inválido lança ENTRADA_INVALIDA
   const lido = this.esquema.safeParse(valor)
-if (!lido.success) throw new ErroDeDominio(this.opcoes.errorCode ?? CodigoDeErro.ENTRADA_INVALIDA)
   return lido.data
```

```mutacao
arquivo: packages/nucleo/src/entrada/zod-validation.pipe.ts
teste: packages/nucleo/src/entrada/entrada.test.ts › com errorCode NAO_ENCONTRADO
-if (!lido.success) throw new ErroDeDominio(this.opcoes.errorCode ?? CodigoDeErro.ENTRADA_INVALIDA)
+if (!lido.success) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
```

```mutacao
arquivo: packages/nucleo/src/entrada/id.pipe.ts
teste: packages/nucleo/src/entrada/entrada.test.ts › aceita o uuid em qualquer caixa
-if (lido.success) return lido.data.toLowerCase()
+if (lido.success) return lido.data
```

```mutacao
arquivo: packages/nucleo/src/entrada/id.pipe.ts
teste: packages/nucleo/src/entrada/entrada.test.ts › aceita o uuid em qualquer caixa
   const lido = esquemaId.safeParse(valor)
-if (lido.success) return lido.data.toLowerCase()
```

```mutacao
arquivo: packages/nucleo/src/entrada/id.pipe.ts
teste: packages/nucleo/src/entrada/entrada.test.ts › com invalidAsUndefined
   if (lido.success) return lido.data.toLowerCase()
-if (this.opcoes.invalidAsUndefined === true) return undefined
   throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
```

```mutacao
arquivo: packages/nucleo/src/entrada/id.pipe.ts
teste: packages/nucleo/src/entrada/entrada.test.ts › fora do formato responde como o inexistente
-throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
+throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=0]",
+selector: "Decorator > CallExpression[callee.name=/^(Query|Param)$/][arguments.length=0]",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=0]",
+selector: "Decorator > CallExpression[callee.name=/^(Body|Param)$/][arguments.length=0]",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=0]",
+selector: "Decorator > CallExpression[callee.name=/^(Body|Query)$/][arguments.length=0]",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=1] > Literal.arguments",
+selector: "Decorator > CallExpression[callee.name=/^(Query|Param)$/][arguments.length=1] > Literal.arguments",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=1] > Literal.arguments",
+selector: "Decorator > CallExpression[callee.name=/^(Body|Param)$/][arguments.length=1] > Literal.arguments",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=1] > Literal.arguments",
+selector: "Decorator > CallExpression[callee.name=/^(Body|Query)$/][arguments.length=1] > Literal.arguments",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=0]",
+selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=9]",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=1] > Literal.arguments",
+selector: "Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=9] > Literal.arguments",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "Decorator > CallExpression[callee.name=/^(Req|Request)$/]",
+selector: "Decorator > CallExpression[callee.name=/^(Request)$/]",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "Decorator > CallExpression[callee.name=/^(Req|Request)$/]",
+selector: "Decorator > CallExpression[callee.name=/^(Req)$/]",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "MemberExpression[object.name='requisicao'][property.name=/^(body|query|params)$/]",
+selector: "MemberExpression[object.name='req'][property.name=/^(body|query|params)$/]",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "MemberExpression[object.name='requisicao'][property.name=/^(body|query|params)$/]",
+selector: "MemberExpression[object.name='requisicao'][property.name=/^(query|params)$/]",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "MemberExpression[object.name='requisicao'][property.name=/^(body|query|params)$/]",
+selector: "MemberExpression[object.name='requisicao'][property.name=/^(body|params)$/]",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-selector: "MemberExpression[object.name='requisicao'][property.name=/^(body|query|params)$/]",
+selector: "MemberExpression[object.name='requisicao'][property.name=/^(body|query)$/]",
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › vale só no controller dos módulos migrados
-files: ['apps/api/src/{sistema,ia,entrega,assistente,professores}/**/*.controller.ts'],
+files: ['apps/api/src/**/**/*.controller.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-files: ['apps/api/src/{sistema,ia,entrega,assistente,professores}/**/*.controller.ts'],
+files: ['apps/api/src/{ia,entrega,assistente,professores}/**/*.controller.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-files: ['apps/api/src/{sistema,ia,entrega,assistente,professores}/**/*.controller.ts'],
+files: ['apps/api/src/{sistema,entrega,assistente,professores}/**/*.controller.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-files: ['apps/api/src/{sistema,ia,entrega,assistente,professores}/**/*.controller.ts'],
+files: ['apps/api/src/{sistema,ia,assistente,professores}/**/*.controller.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-files: ['apps/api/src/{sistema,ia,entrega,assistente,professores}/**/*.controller.ts'],
+files: ['apps/api/src/{sistema,ia,entrega,professores}/**/*.controller.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de
-files: ['apps/api/src/{sistema,ia,entrega,assistente,professores}/**/*.controller.ts'],
+files: ['apps/api/src/{sistema,ia,entrega,assistente}/**/*.controller.ts'],
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › o eslint-disable não fura
-export const REGRAS_DAS_GUARDAS = [...REGRAS_DE_LOG, ...REGRAS_DE_SDK_DE_IA, ...REGRAS_DE_TESTE, ...REGRAS_DE_ENTRADA]
+export const REGRAS_DAS_GUARDAS = [...REGRAS_DE_LOG, ...REGRAS_DE_SDK_DE_IA, ...REGRAS_DE_TESTE]
```

```mutacao
arquivo: tools/guardas/index.mjs
teste: tools/guardas/guardas.test.ts › o eslint-disable não fura
-export const REGRAS_DE_ENTRADA = ['no-restricted-syntax']
+export const REGRAS_DE_ENTRADA = []
```

```mutacao
arquivo: apps/api/src/sistema/jobs-sinteticos.controller.ts
teste: apps/api/test/jobs-sinteticos.int.test.ts › é recusado com 400, e nenhuma escola ganha job
-criar(@Body(new ZodValidationPipe(esquemaPedidoJobSintetico)) pedido: PedidoJobSintetico): Promise<RespostaJobAceito> {
+criar(@Body() pedido: PedidoJobSintetico): Promise<RespostaJobAceito> {
```

```mutacao
arquivo: apps/api/src/sistema/jobs-sinteticos.controller.ts
teste: apps/api/test/jobs-sinteticos.int.test.ts › a escola A consulta job da B e recebe 404
-consultar(@Param('id', IdPipe) id: string): Promise<RespostaEstadoDeJob> {
+consultar(@Param('id') id: string): Promise<RespostaEstadoDeJob> {
```

```mutacao
arquivo: apps/api/src/ia/execucoes.controller.ts
teste: apps/api/src/ia/ia.int.test.ts › de outra pessoa, de outra escola, inexistente e com id fora do formato respondem igual
-ler(@Param('id', IdPipe) id: string): Promise<RespostaExecucao> {
+ler(@Param('id') id: string): Promise<RespostaExecucao> {
```

```mutacao
arquivo: apps/api/src/entrega/entrega.controller.ts
teste: apps/api/src/entrega/entrega.int.test.ts › a consulta fora do esquema responde ENTRADA_INVALIDA
-listar(@Query(new ZodValidationPipe(esquemaConsultaEntregas)) consulta: ConsultaEntregas): Promise<RespostaListaDeEntregas> {
+listar(@Query() consulta: ConsultaEntregas): Promise<RespostaListaDeEntregas> {
```

```mutacao
arquivo: apps/api/src/entrega/entrega.controller.ts
teste: apps/api/src/entrega/entrega.int.test.ts › o id do caminho: fora do formato
-decidir(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoDecidirEntrega)) pedido: PedidoDecidirEntrega): Promise<RespostaEntrega> {
+decidir(@Param('id') id: string, @Body(new ZodValidationPipe(esquemaPedidoDecidirEntrega)) pedido: PedidoDecidirEntrega): Promise<RespostaEntrega> {
```

```mutacao
arquivo: apps/api/src/entrega/entrega.controller.ts
teste: apps/api/src/entrega/entrega.int.test.ts › rejeitar exige justificativa
-decidir(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoDecidirEntrega)) pedido: PedidoDecidirEntrega): Promise<RespostaEntrega> {
+decidir(@Param('id', IdPipe) id: string, @Body() pedido: PedidoDecidirEntrega): Promise<RespostaEntrega> {
```

```mutacao
arquivo: apps/api/src/assistente/assistente.controller.ts
teste: apps/api/src/assistente/assistente.int.test.ts › o corpo e a consulta inválidos
-conversa(@Query(new ZodValidationPipe(esquemaConsultaConversaDoAssistente)) consulta: ConsultaConversaDoAssistente): Promise<RespostaConversaDoAssistente> {
+conversa(@Query() consulta: ConsultaConversaDoAssistente): Promise<RespostaConversaDoAssistente> {
```

```mutacao
arquivo: apps/api/src/assistente/assistente.controller.ts
teste: apps/api/src/assistente/assistente.int.test.ts › o corpo e a consulta inválidos
-enviar(@Body(new ZodValidationPipe(esquemaPedidoMensagemAoAssistente)) pedido: PedidoMensagemAoAssistente): Promise<RespostaExecucaoAceita> {
+enviar(@Body() pedido: PedidoMensagemAoAssistente): Promise<RespostaExecucaoAceita> {
```

```mutacao
arquivo: apps/api/src/professores/professores.controller.ts
teste: apps/api/test/professores.int.test.ts › entrada fora do esquema
-cadastrar(@Body(new ZodValidationPipe(esquemaPedidoCadastrarProfessor)) pedido: PedidoCadastrarProfessor): Promise<RespostaConviteDeProfessor> {
+cadastrar(@Body() pedido: PedidoCadastrarProfessor): Promise<RespostaConviteDeProfessor> {
```

```mutacao
arquivo: apps/api/src/professores/professores.controller.ts
teste: apps/api/test/professores.int.test.ts › entrada fora do esquema
-listar(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaListaDeProfessores> {
+listar(@Query() consulta: ConsultaPaginada): Promise<RespostaListaDeProfessores> {
```

```mutacao
arquivo: apps/api/src/professores/professores.controller.ts
teste: apps/api/test/professores.int.test.ts › entrada fora do esquema
-refazerConvite(@Param('usuarioId', IdPipe) usuarioId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: Record<string, never>): Promise<RespostaConviteDeProfessor> {
+refazerConvite(@Param('usuarioId') usuarioId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: Record<string, never>): Promise<RespostaConviteDeProfessor> {
```

```mutacao
arquivo: apps/api/src/professores/professores.controller.ts
teste: apps/api/test/professores.int.test.ts › entrada fora do esquema
-refazerConvite(@Param('usuarioId', IdPipe) usuarioId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: Record<string, never>): Promise<RespostaConviteDeProfessor> {
+refazerConvite(@Param('usuarioId', IdPipe) usuarioId: string, @Body() _corpo: Record<string, never>): Promise<RespostaConviteDeProfessor> {
```

```mutacao
arquivo: apps/api/src/professores/professores.controller.ts
teste: apps/api/test/professores.int.test.ts › entrada fora do esquema
-revogarConvite(@Param('usuarioId', IdPipe) usuarioId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: Record<string, never>): Promise<void> {
+revogarConvite(@Param('usuarioId') usuarioId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: Record<string, never>): Promise<void> {
```

```mutacao
arquivo: apps/api/src/professores/professores.controller.ts
teste: apps/api/test/professores.int.test.ts › entrada fora do esquema
-revogarConvite(@Param('usuarioId', IdPipe) usuarioId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: Record<string, never>): Promise<void> {
+revogarConvite(@Param('usuarioId', IdPipe) usuarioId: string, @Body() _corpo: Record<string, never>): Promise<void> {
```

```mutacao
arquivo: apps/api/src/professores/professores.controller.ts
teste: apps/api/test/professores.int.test.ts › refazer e revogar sem corpo nenhum
-const esquemaSemCorpo = esquemaPedidoSemCorpoDoConviteDeProfessor.default({})
+const esquemaSemCorpo = esquemaPedidoSemCorpoDoConviteDeProfessor
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Até a 17.0 existem duas cópias do mesmo comportamento (`idDoCaminho` e `lerEntrada` em `apps/api/src/estrutura/entrada.ts`, e os dois pipes em `packages/nucleo/src/entrada/`); conferir na 17.0 que nenhum chamador ficou | Tarefa 17.0, que já apaga essas funções. Só confirmar ali |
| tenancy-guardian (1ª) | O bloco do lint barra `@Req()`, mas não barra decorador próprio (`createParamDecorator`) que leia `request.body` por dentro | Tarefa 17.0, quando o `files` do bloco se estende para toda a API. Seletor novo muda o contrato da guarda |
| test-engineer (1ª) | A fixture do lint não cobre `@Query(\`termo\`)` com crase nem o import renomeado (`Req as R`); os seletores deixam os dois passar | Tarefa 17.0, junto do item acima: cobrir exige seletor novo, não só teste |
| revisor-geral (1ª) | `_corpo: Record<string, never>` em `professores.controller.ts` foge da armadilha da tarefa; exportar `PedidoSemCorpoDoConviteDeProfessor` (e o esquema com `.default({})`) de `packages/shared/src/professores/professores.ts` | `TODO.md`: linha "Os pedidos sem corpo, tipados pelo `shared`", na seção "Da X5". Mexe em `packages/shared`, que a tarefa não toca, e em contrato compartilhado |
| revisor-geral (2ª) | A nota "escritos e rodados, verdes, contra o código antigo" (`onda-1a.md:133`) não se confere a partir do git, porque não há commit separado; nas 15.0 e 16.0, guardar a saída da rodada contra o código antigo (por exemplo em `.processo/`) | Tarefas 15.0 e 16.0, que também caracterizam antes de migrar |
| test-engineer (2ª) | O laço de `entrega.int.test.ts:374-376` virou um pedaço do teste novo da linha 379: tirar, ou comentar que é a caracterização da 14.1 | Recusada: o laço é a caracterização da 14.1, escrita contra o código antigo, e mexer no teste caducaria os revisores sem ganho |

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
| 2026-10-22 12:05:42 | 2026-10-22 12:06:20 | `tenancy-guardian` | 1 | APROVADO | a614f13ae4294ca14 |
| 2026-10-22 12:05:47 | 2026-10-22 12:07:29 | `revisor-geral` | 1 | REPROVADO | a2f97e96b93be9ba8 |
| 2026-10-22 12:05:45 | 2026-10-22 12:08:44 | `test-engineer` | 1 | APROVADO | a272738f288f59800 |
| 2026-10-22 12:16:03 | 2026-10-22 12:16:31 | `revisor-geral` | 2 | APROVADO | ad946dd5cf35ea2d0 |
| 2026-10-22 12:15:55 | 2026-10-22 12:16:40 | `test-engineer` | 2 | APROVADO | ae4598a7a88998f9f |
