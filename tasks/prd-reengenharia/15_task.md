# Tarefa 15.0 — Estrutura, sala e governança validam pelo `ZodValidationPipe`

**Funcionalidade:** reengenharia · **Depende de:** 14.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Os controllers de `estrutura/`, `sala/` e `governanca/` recebem a entrada pelo `ZodValidationPipe` e pelo `IdPipe` da
14.0 (D81), sem `lerEntrada`, `idDoCaminho`, `lerConsultaPaginada` nem `safeParse`, e entram no bloco do ESLint.

## Contexto necessário

- `onda-1a.md` §2, "T1" (revista pela D81: o `ZodValidationPipe` com `errorCode: NAO_ENCONTRADO` na `chave`,
  `governanca.controller.ts:52`); `techspec.md` §6
- `prd.md` RF5; `.claude/rules/10-multitenancy.md` itens 4 a 6, `80-infra-e-carga.md` item 7, `60-dominio.md` itens 5 e 6
- O que a 14.0 entregou em `packages/nucleo/src/entrada/` e o bloco de `no-restricted-syntax` em `eslint.config.mjs`
- `apps/api/src/governanca/governanca.controller.ts:20` (`chaveDoCaminho`, avaliada antes do corpo)

## Subtarefas

- [x] 15.1 — Caracterização, num commit antes: o inválido e o 404 de cada rota dos três módulos, incluindo a `chave` e o link da sala
- [x] 15.2 — Migram os 8 controllers de `estrutura/`, os 4 de `sala/` e os 2 de `governanca/`
- [x] 15.3 — Os três módulos entram no `files` do bloco de `no-restricted-syntax`
- [x] 15.4 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/estrutura/*.controller.ts` (8) | alterado |
| `apps/api/src/sala/*.controller.ts` (4) | alterado |
| `apps/api/src/governanca/governanca.controller.ts`, `analista.controller.ts` | alterado |
| `eslint.config.mjs`, `tools/guardas/guardas.test.ts` | alterado |
| `apps/api/test/{estrutura,estrutura-isolamento,escola-sessao}.int.test.ts` | alterado |
| `apps/api/test/borda-de-entrada.int.test.ts` | novo: a caracterização de cada rota dos três módulos, uma rota por caso |
| `apps/api/src/governanca/governanca.int.test.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| Estrutura: limite 101 e página fora do formato → `ENTRADA_INVALIDA`, 100 passa | integração | `.max(101)`. Teste: `estrutura.int.test.ts › listagens paginadas: \`limite\` corta a página e \`proxima\` continua dela, sem repetir nem pular` (101, 0, página fora do formato; 100 passa), e `borda-de-entrada.int.test.ts › a borda de GET …` em cada listagem |
| Estrutura: turma de B, no contexto de A → o 404 do inexistente e do fora do formato | integração | tirar o `eq(turma.escolaId, …)`. Teste: `estrutura-isolamento.int.test.ts › a turma de um ano encerrado de B, lida pela coordenação de A com o \`anoLetivoId\` de B, dá o mesmo 404 do inexistente` (com o ano de B na consulta, só essa cláusula barra a turma), e `› a turma de B, no contexto de A, abrir, renomear e excluir dão o mesmo 404 …` |
| `escola-sessao`: fora de 5 a 480, número quebrado, campo a mais ou faltando → `ENTRADA_INVALIDA`, sem mudar nada | integração | sem `.strict()`. Teste: `escola-sessao.int.test.ts › borda: fora de 5 a 480 minutos, número quebrado, campo a mais …` |
| `escola-sessao`: professor e aluno, com corpo inválido, → o 404 de rota inexistente | integração | validar antes da guarda. Teste: `escola-sessao.int.test.ts › permissão: professor e aluno recebem o mesmo 404 de rota inexistente …` (agora com corpo inválido) e `borda-de-entrada.int.test.ts › a guarda responde antes do pipe …` |
| Lista: dois alunos com o mesmo nome na turma continuam aceitos | integração | `.refine` de nomes únicos. Teste: `lista.int.test.ts › E6 (RF5): reenviar acrescenta só o que falta, pela matrícula › a mesma lista duas vezes não muda a contagem …` (o comentário "Dois alunos com o mesmo nome e matrículas diferentes entram os dois", `:307`) |
| Lista: lote inválido não grava nenhum nome | integração | validação antes da escrita. Teste: `lista.int.test.ts › E4 (RF4): erro por linha, e nada gravado › a prévia aponta cada linha ruim …`, e `borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/lista` (o `retrato()` não muda) |
| Ano letivo: datas invertidas ou ano repetido dão o código de hoje, e a virada fica verde | integração | caracterização da virada. Teste: `estrutura.int.test.ts › o mesmo ano duas vezes na escola dá CONFLITO, também em paralelo; período invertido …` e `virada-do-ano.int.test.ts › caminho feliz: confirmado, pendente, contestado e alunos vão a \`encerrado\` por \`fim_do_ano\` …` |
| Vínculo: duas disciplinas na mesma turma, dois vínculos | integração | o par turma e disciplina fica. Teste: `vinculo.int.test.ts › caminho feliz: professor com Química e Física no 2ºB confirma uma e contesta a outra …` |
| Sala: reivindicação inválida → `ENTRADA_INVALIDA`, e o nome continua livre | integração | inválido não reserva nome. Teste: `salas-reivindicar.int.test.ts › P5: escolaId, turmaId, campo a mais, os dois caminhos, senha curta, sem chave e nome que não é UUID …` (o pedido válido depois dá `enviado`) |
| Sala: dois pedidos no mesmo nome ao mesmo tempo (`Promise.all`) → um fica, o outro com o código de hoje | integração | a restrição do banco continua. Teste: `salas-reivindicar.int.test.ts › C1: dois pedidos no mesmo nome, com a matrícula certa e chaves diferentes …` |
| Sala: link ou código fora do formato → o 404 do inexistente | integração | responder 400. Teste: `salas-abrir.int.test.ts › R1: pelo link e pelo código, o inexistente, o vencido, o revogado …` (token, código e slug fora do formato, `:290-310`) |
| Governança: `chave` fora de `FUNCOES` → 404 | integração | `ENTRADA_INVALIDA`. Teste: `governanca.int.test.ts › função fora do catálogo responde como inexistente; motivo fora da lista e campo a mais são entrada inválida` e `borda-de-entrada.int.test.ts › a borda de POST /v1/governanca/funcoes/:chave/suspender` e `…/retomar` |
| Governança: `chave` de outra função e a inexistente, com o mesmo corpo (válido ou inválido), respondem igual | integração | regra 10.6. Teste: `governanca.int.test.ts › a chave fora do catálogo e a de uma função sem suspensão respondem igual ao mesmo corpo …` |
| Governança: suspender sem finalidade → `ENTRADA_INVALIDA`, função ativa, sem auditoria | integração | inválido não suspende. Teste: o mesmo caso da linha acima (a divergência 3 troca "sem finalidade" por corpo fora do esquema) |
| Governança: suspender em A não suspende em B | integração | tirar o `eq(…escolaId…)` da escrita. Teste: `governanca.int.test.ts › a suspensão é da escola de quem suspende: a coordenação de B não vê nem retoma a suspensão de A` |
| Lint: a fixture da 14.0 em `apps/api/src/{estrutura,sala,governanca}/x.controller.ts` reprova | unidade | tirar o módulo do `files`. Teste: `tools/guardas/guardas.test.ts › a entrada do controller passa pelo pipe › reprova @Body(), @Query(), @Param() … no controller de %s` (os três módulos entram em `MODULOS_MIGRADOS`) |

## Como testar

- A borda: copie `apps/api/test/escola-sessao.int.test.ts › borda: fora de 5 a 480 minutos, número quebrado, campo a
  mais (a escola, por exemplo) ou faltando dão ENTRADA_INVALIDA, sem mudar nada` (`:87`) e o `:41` (permissão).
- O isolamento: o caso de `apps/api/test/estrutura-isolamento.int.test.ts:74` ("abrir e encerrar com id de B dão o
  mesmo 404 do inexistente e não mudam nada em B").
- A corrida: `apps/api/test/salas-reivindicar.int.test.ts › C1: dois pedidos no mesmo nome, com a matrícula certa e
  chaves diferentes: um pendente, o outro recusado, nunca 5xx` (`:627`).
- O link: `apps/api/test/acesso-da-turma.int.test.ts › 0, 2, 31, texto e campo a mais são ENTRADA_INVALIDA, e nada é
  gravado nem revogado`.
- Isolado: `npx vitest run --project integracao apps/api/test/escola-sessao.int.test.ts` (troque pelo arquivo do módulo).
- Armadilha: a caracterização entra num commit antes da migração; o corpo do erro se compara inteiro, não só o status.
  Se a ordem entre corpo e caminho mudar (a do Nest), escreva em "Divergências resolvidas", com `onda-1a.md` T1.

## Fora do escopo desta tarefa

Sessão e operação (16.0); atividade, artefato, material, tutor e privacidade (17.0); apagar as funções antigas (17.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| (1) A caracterização (15.1) entra no commit da tarefa, e não num commit à parte. (2) Com o id (ou a `chave`) e o corpo (ou a consulta) inválidos ao mesmo tempo, 15 rotas passam de 404 a 400: `PATCH /v1/disciplinas/:id`, `GET`, `PATCH` de `/v1/turmas/:id`, `GET /v1/turmas/:id/alunos`, as quatro da lista da turma com corpo ou consulta, `POST /v1/vinculos/:id/encerrar` e `/contestar`, `POST /v1/turmas/:id/acesso` e `/revogar`, `GET /v1/turmas/:id/reivindicacoes` e `POST /v1/governanca/funcoes/:chave/suspender` e `/retomar`. A caracterização foi escrita com o 404, passou no código antigo e foi reescrita para o 400 depois da migração. (3) A linha "Governança: suspender sem finalidade" da tabela de testes vira "suspender com corpo fora do esquema" (motivo fora da lista, campo a mais). (4) A caracterização de lista, vínculo, virada do ano, reivindicação e acesso da turma ficou nos testes que já existiam, sem alteração: o portão da tarefa roda só os testes que a árvore alterou, então esses cinco arquivos só a esteira roda; foram rodados à mão, isolados, antes da rodada | (1) O hook só aceita commit com código de `apps/`, `packages/` ou `tools/` com `(tarefa N.0)`, portão carimbado e a rodada dos revisores; um commit só de teste pediria tudo isso duas vezes. (2) O Nest resolve primeiro o pipe do último parâmetro; não revela existência, porque com a entrada inválida qualquer id ou `chave` dá o mesmo 400. (3) O suspender não tem finalidade: `esquemaPedidoSuspenderFuncao` tem só `motivo`, opcional e de lista fechada, e `{}` é válido; o que a linha quer provar, que o inválido não suspende nem audita, vale com o corpo fora do esquema. (4) A regra 40 ("O portão") põe a cobertura do que a tarefa não alterou na esteira; a borda de cada rota está no teste novo, que o portão roda | (1) e (2) `onda-1a.md` T1, o item "A caracterização da 14.0 entra no commit da tarefa" e o parágrafo "A 15.0 repete a conduta", ao lado de "caracterizada, não forçada" (exceção ao `techspec.md` §1, linha 21). (3) `packages/shared/src/governanca/governanca.ts:88` (`esquemaPedidoSuspenderFuncao`); a única linha que cita a finalidade do suspender é a da tabela desta tarefa, e o teste está em `apps/api/src/governanca/governanca.int.test.ts › a chave fora do catálogo e a de uma função sem suspensão respondem igual` |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/estrutura/ano-letivo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/anos-letivos
-criar(@Body(new ZodValidationPipe(esquemaPedidoCriarAnoLetivo)) pedido: PedidoCriarAnoLetivo): Promise<RespostaAnoLetivo> {
+criar(@Body() pedido: PedidoCriarAnoLetivo): Promise<RespostaAnoLetivo> {
```

```mutacao
arquivo: apps/api/src/estrutura/ano-letivo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/anos-letivos
-listar(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaListaDeAnosLetivos> {
+listar(@Query() consulta: ConsultaPaginada): Promise<RespostaListaDeAnosLetivos> {
```

```mutacao
arquivo: apps/api/src/estrutura/ano-letivo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/anos-letivos/:id/abrir
-abrir(@Param('id', IdPipe) id: string): Promise<RespostaAnoLetivo> {
+abrir(@Param('id') id: string): Promise<RespostaAnoLetivo> {
```

```mutacao
arquivo: apps/api/src/estrutura/ano-letivo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/anos-letivos/:id/encerrar
-encerrar(@Param('id', IdPipe) id: string): Promise<RespostaAnoLetivo> {
+encerrar(@Param('id') id: string): Promise<RespostaAnoLetivo> {
```

```mutacao
arquivo: apps/api/src/estrutura/disciplina.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/disciplinas
-criar(@Body(new ZodValidationPipe(esquemaPedidoCriarDisciplina)) pedido: PedidoCriarDisciplina): Promise<RespostaDisciplina> {
+criar(@Body() pedido: PedidoCriarDisciplina): Promise<RespostaDisciplina> {
```

```mutacao
arquivo: apps/api/src/estrutura/disciplina.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de PATCH /v1/disciplinas/:id
-renomear(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearDisciplina)) pedido: PedidoRenomearDisciplina): Promise<RespostaDisciplina> {
+renomear(@Param('id') id: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearDisciplina)) pedido: PedidoRenomearDisciplina): Promise<RespostaDisciplina> {
```

```mutacao
arquivo: apps/api/src/estrutura/disciplina.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de PATCH /v1/disciplinas/:id
-renomear(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearDisciplina)) pedido: PedidoRenomearDisciplina): Promise<RespostaDisciplina> {
+renomear(@Param('id', IdPipe) id: string, @Body() pedido: PedidoRenomearDisciplina): Promise<RespostaDisciplina> {
```

```mutacao
arquivo: apps/api/src/estrutura/disciplina.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de DELETE /v1/disciplinas/:id
-excluir(@Param('id', IdPipe) id: string): Promise<void> {
+excluir(@Param('id') id: string): Promise<void> {
```

```mutacao
arquivo: apps/api/src/estrutura/disciplina.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/disciplinas
-listar(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaListaDeDisciplinas> {
+listar(@Query() consulta: ConsultaPaginada): Promise<RespostaListaDeDisciplinas> {
```

```mutacao
arquivo: apps/api/src/estrutura/escola-sessao.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de PUT /v1/escola/sessao
-alterar(@Body(new ZodValidationPipe(esquemaPedidoEscolaSessao)) pedido: PedidoEscolaSessao): Promise<RespostaEscolaSessao> {
+alterar(@Body() pedido: PedidoEscolaSessao): Promise<RespostaEscolaSessao> {
```

```mutacao
arquivo: apps/api/src/estrutura/lista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/lista/previa
-previa(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoTextoDaLista)) pedido: PedidoTextoDaLista): Promise<RespostaPreviaDaLista> {
+previa(@Param('id') turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoTextoDaLista)) pedido: PedidoTextoDaLista): Promise<RespostaPreviaDaLista> {
```

```mutacao
arquivo: apps/api/src/estrutura/lista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/lista/previa
-previa(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoTextoDaLista)) pedido: PedidoTextoDaLista): Promise<RespostaPreviaDaLista> {
+previa(@Param('id', IdPipe) turmaId: string, @Body() pedido: PedidoTextoDaLista): Promise<RespostaPreviaDaLista> {
```

```mutacao
arquivo: apps/api/src/estrutura/lista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/lista
-gravar(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoTextoDaLista)) pedido: PedidoTextoDaLista): Promise<RespostaGravacaoDaLista> {
+gravar(@Param('id') turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoTextoDaLista)) pedido: PedidoTextoDaLista): Promise<RespostaGravacaoDaLista> {
```

```mutacao
arquivo: apps/api/src/estrutura/lista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/lista
-gravar(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoTextoDaLista)) pedido: PedidoTextoDaLista): Promise<RespostaGravacaoDaLista> {
+gravar(@Param('id', IdPipe) turmaId: string, @Body() pedido: PedidoTextoDaLista): Promise<RespostaGravacaoDaLista> {
```

```mutacao
arquivo: apps/api/src/estrutura/lista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/lista/nome
-acrescentar(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoNomeAvulso)) pedido: PedidoNomeAvulso): Promise<NomeDaLista> {
+acrescentar(@Param('id') turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoNomeAvulso)) pedido: PedidoNomeAvulso): Promise<NomeDaLista> {
```

```mutacao
arquivo: apps/api/src/estrutura/lista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/lista/nome
-acrescentar(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoNomeAvulso)) pedido: PedidoNomeAvulso): Promise<NomeDaLista> {
+acrescentar(@Param('id', IdPipe) turmaId: string, @Body() pedido: PedidoNomeAvulso): Promise<NomeDaLista> {
```

```mutacao
arquivo: apps/api/src/estrutura/lista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/turmas/:id/lista
-ler(@Param('id', IdPipe) turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaListaDaTurma)) consulta: ConsultaListaDaTurma): Promise<RespostaListaDaTurma> {
+ler(@Param('id') turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaListaDaTurma)) consulta: ConsultaListaDaTurma): Promise<RespostaListaDaTurma> {
```

```mutacao
arquivo: apps/api/src/estrutura/lista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/turmas/:id/lista
-ler(@Param('id', IdPipe) turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaListaDaTurma)) consulta: ConsultaListaDaTurma): Promise<RespostaListaDaTurma> {
+ler(@Param('id', IdPipe) turmaId: string, @Query() consulta: ConsultaListaDaTurma): Promise<RespostaListaDaTurma> {
```

```mutacao
arquivo: apps/api/src/estrutura/lista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de DELETE /v1/lista-nomes/:id
-retirar(@Param('id', IdPipe) id: string): Promise<void> {
+retirar(@Param('id') id: string): Promise<void> {
```

```mutacao
arquivo: apps/api/src/estrutura/provedores-da-escola.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de PUT /v1/escola/provedores
-alterar(@Body(new ZodValidationPipe(esquemaPedidoProvedoresDaEscola)) pedido: PedidoProvedoresDaEscola): Promise<RespostaProvedoresDaEscola> {
+alterar(@Body() pedido: PedidoProvedoresDaEscola): Promise<RespostaProvedoresDaEscola> {
```

```mutacao
arquivo: apps/api/src/estrutura/serie.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/series
-criar(@Body(new ZodValidationPipe(esquemaPedidoCriarSerie)) pedido: PedidoCriarSerie): Promise<RespostaSerie> {
+criar(@Body() pedido: PedidoCriarSerie): Promise<RespostaSerie> {
```

```mutacao
arquivo: apps/api/src/estrutura/serie.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/series
-listar(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaListaDeSeries> {
+listar(@Query() consulta: ConsultaPaginada): Promise<RespostaListaDeSeries> {
```

```mutacao
arquivo: apps/api/src/estrutura/turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas
-criar(@Body(new ZodValidationPipe(esquemaPedidoCriarTurma)) pedido: PedidoCriarTurma): Promise<RespostaTurma> {
+criar(@Body() pedido: PedidoCriarTurma): Promise<RespostaTurma> {
```

```mutacao
arquivo: apps/api/src/estrutura/turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/turmas
-listar(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaListaDeTurmas> {
+listar(@Query() consulta: ConsultaPaginada): Promise<RespostaListaDeTurmas> {
```

```mutacao
arquivo: apps/api/src/estrutura/turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/turmas/:id
-abrir(@Param('id', IdPipe) id: string, @Query(new ZodValidationPipe(esquemaConsultaTurma)) consulta: ConsultaTurma): Promise<RespostaTurmaAberta> {
+abrir(@Param('id') id: string, @Query(new ZodValidationPipe(esquemaConsultaTurma)) consulta: ConsultaTurma): Promise<RespostaTurmaAberta> {
```

```mutacao
arquivo: apps/api/src/estrutura/turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/turmas/:id
-abrir(@Param('id', IdPipe) id: string, @Query(new ZodValidationPipe(esquemaConsultaTurma)) consulta: ConsultaTurma): Promise<RespostaTurmaAberta> {
+abrir(@Param('id', IdPipe) id: string, @Query() consulta: ConsultaTurma): Promise<RespostaTurmaAberta> {
```

```mutacao
arquivo: apps/api/src/estrutura/turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de PATCH /v1/turmas/:id
-renomear(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearTurma)) pedido: PedidoRenomearTurma): Promise<RespostaTurma> {
+renomear(@Param('id') id: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearTurma)) pedido: PedidoRenomearTurma): Promise<RespostaTurma> {
```

```mutacao
arquivo: apps/api/src/estrutura/turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de PATCH /v1/turmas/:id
-renomear(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearTurma)) pedido: PedidoRenomearTurma): Promise<RespostaTurma> {
+renomear(@Param('id', IdPipe) id: string, @Body() pedido: PedidoRenomearTurma): Promise<RespostaTurma> {
```

```mutacao
arquivo: apps/api/src/estrutura/turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de DELETE /v1/turmas/:id
-excluir(@Param('id', IdPipe) id: string): Promise<void> {
+excluir(@Param('id') id: string): Promise<void> {
```

```mutacao
arquivo: apps/api/src/estrutura/turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/turmas/:id/alunos
-alunos(@Param('id', IdPipe) id: string, @Query(new ZodValidationPipe(esquemaConsultaAlunosDaTurma)) consulta: ConsultaAlunosDaTurma): Promise<RespostaAlunosDaTurma> {
+alunos(@Param('id') id: string, @Query(new ZodValidationPipe(esquemaConsultaAlunosDaTurma)) consulta: ConsultaAlunosDaTurma): Promise<RespostaAlunosDaTurma> {
```

```mutacao
arquivo: apps/api/src/estrutura/turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/turmas/:id/alunos
-alunos(@Param('id', IdPipe) id: string, @Query(new ZodValidationPipe(esquemaConsultaAlunosDaTurma)) consulta: ConsultaAlunosDaTurma): Promise<RespostaAlunosDaTurma> {
+alunos(@Param('id', IdPipe) id: string, @Query() consulta: ConsultaAlunosDaTurma): Promise<RespostaAlunosDaTurma> {
```

```mutacao
arquivo: apps/api/src/estrutura/vinculo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/vinculos
-criar(@Body(new ZodValidationPipe(esquemaPedidoCriarVinculo)) pedido: PedidoCriarVinculo): Promise<RespostaVinculoDaCoordenacao> {
+criar(@Body() pedido: PedidoCriarVinculo): Promise<RespostaVinculoDaCoordenacao> {
```

```mutacao
arquivo: apps/api/src/estrutura/vinculo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/vinculos
-listar(@Query(new ZodValidationPipe(esquemaConsultaVinculos)) consulta: ConsultaVinculos): Promise<RespostaListaDeVinculos> {
+listar(@Query() consulta: ConsultaVinculos): Promise<RespostaListaDeVinculos> {
```

```mutacao
arquivo: apps/api/src/estrutura/vinculo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/vinculos/:id/encerrar
-encerrar(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoEncerrarVinculo)) pedido: PedidoEncerrarVinculo): Promise<RespostaVinculoDaCoordenacao> {
+encerrar(@Param('id') id: string, @Body(new ZodValidationPipe(esquemaPedidoEncerrarVinculo)) pedido: PedidoEncerrarVinculo): Promise<RespostaVinculoDaCoordenacao> {
```

```mutacao
arquivo: apps/api/src/estrutura/vinculo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/vinculos/:id/encerrar
-encerrar(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoEncerrarVinculo)) pedido: PedidoEncerrarVinculo): Promise<RespostaVinculoDaCoordenacao> {
+encerrar(@Param('id', IdPipe) id: string, @Body() pedido: PedidoEncerrarVinculo): Promise<RespostaVinculoDaCoordenacao> {
```

```mutacao
arquivo: apps/api/src/estrutura/vinculo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/vinculos/:id/confirmar
-confirmar(@Param('id', IdPipe) id: string): Promise<RespostaVinculo> {
+confirmar(@Param('id') id: string): Promise<RespostaVinculo> {
```

```mutacao
arquivo: apps/api/src/estrutura/vinculo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/vinculos/:id/contestar
-contestar(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoContestarVinculo)) pedido: PedidoContestarVinculo): Promise<RespostaVinculo> {
+contestar(@Param('id') id: string, @Body(new ZodValidationPipe(esquemaPedidoContestarVinculo)) pedido: PedidoContestarVinculo): Promise<RespostaVinculo> {
```

```mutacao
arquivo: apps/api/src/estrutura/vinculo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/vinculos/:id/contestar
-contestar(@Param('id', IdPipe) id: string, @Body(new ZodValidationPipe(esquemaPedidoContestarVinculo)) pedido: PedidoContestarVinculo): Promise<RespostaVinculo> {
+contestar(@Param('id', IdPipe) id: string, @Body() pedido: PedidoContestarVinculo): Promise<RespostaVinculo> {
```

```mutacao
arquivo: apps/api/src/estrutura/vinculo.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/meus-vinculos
-listar(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaMeusVinculos> {
+listar(@Query() consulta: ConsultaPaginada): Promise<RespostaMeusVinculos> {
```

```mutacao
arquivo: apps/api/src/governanca/analista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/analista/gerar
-gerar(@Body(new ZodValidationPipe(esquemaPedidoGerarResumoDoAnalista)) pedido: PedidoGerarResumoDoAnalista): Promise<RespostaExecucaoAceita> {
+gerar(@Body() pedido: PedidoGerarResumoDoAnalista): Promise<RespostaExecucaoAceita> {
```

```mutacao
arquivo: apps/api/src/governanca/analista.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/analista/nominal
-nominal(@Query(new ZodValidationPipe(esquemaConsultaAnalistaNominal)) consulta: ConsultaAnalistaNominal): Promise<RespostaAnalistaNominal> {
+nominal(@Query() consulta: ConsultaAnalistaNominal): Promise<RespostaAnalistaNominal> {
```

```mutacao
arquivo: apps/api/src/governanca/governanca.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/governanca/resumo
-resumo(@Query(new ZodValidationPipe(esquemaConsultaResumoDaGovernanca)) consulta: ConsultaResumoDaGovernanca): Promise<RespostaResumoDaGovernanca> {
+resumo(@Query() consulta: ConsultaResumoDaGovernanca): Promise<RespostaResumoDaGovernanca> {
```

```mutacao
arquivo: apps/api/src/governanca/governanca.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/governanca/funcoes/:chave/suspender
-suspender(@Param('chave', pipeDaChave) chave: ChaveDeFuncao, @Body(new ZodValidationPipe(esquemaPedidoSuspenderFuncao)) pedido: PedidoSuspenderFuncao): Promise<RespostaFuncaoDaGovernanca> {
+suspender(@Param('chave') chave: ChaveDeFuncao, @Body(new ZodValidationPipe(esquemaPedidoSuspenderFuncao)) pedido: PedidoSuspenderFuncao): Promise<RespostaFuncaoDaGovernanca> {
```

```mutacao
arquivo: apps/api/src/governanca/governanca.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/governanca/funcoes/:chave/suspender
-suspender(@Param('chave', pipeDaChave) chave: ChaveDeFuncao, @Body(new ZodValidationPipe(esquemaPedidoSuspenderFuncao)) pedido: PedidoSuspenderFuncao): Promise<RespostaFuncaoDaGovernanca> {
+suspender(@Param('chave', pipeDaChave) chave: ChaveDeFuncao, @Body() pedido: PedidoSuspenderFuncao): Promise<RespostaFuncaoDaGovernanca> {
```

```mutacao
arquivo: apps/api/src/governanca/governanca.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/governanca/funcoes/:chave/retomar
-retomar(@Param('chave', pipeDaChave) chave: ChaveDeFuncao, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<RespostaFuncaoDaGovernanca> {
+retomar(@Param('chave') chave: ChaveDeFuncao, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<RespostaFuncaoDaGovernanca> {
```

```mutacao
arquivo: apps/api/src/governanca/governanca.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/governanca/funcoes/:chave/retomar
-retomar(@Param('chave', pipeDaChave) chave: ChaveDeFuncao, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<RespostaFuncaoDaGovernanca> {
+retomar(@Param('chave', pipeDaChave) chave: ChaveDeFuncao, @Body() _corpo: PedidoSemCorpo): Promise<RespostaFuncaoDaGovernanca> {
```

```mutacao
arquivo: apps/api/src/governanca/governanca.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/governanca/consumo
-consumo(@Query(new ZodValidationPipe(esquemaConsultaConsumo)) consulta: ConsultaConsumo): Promise<RespostaConsumo> {
+consumo(@Query() consulta: ConsultaConsumo): Promise<RespostaConsumo> {
```

```mutacao
arquivo: apps/api/src/sala/acesso-da-turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/acesso
-gerar(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoGerarAcesso)) pedido: PedidoGerarAcesso): Promise<RespostaAcessoGerado> {
+gerar(@Param('id') turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoGerarAcesso)) pedido: PedidoGerarAcesso): Promise<RespostaAcessoGerado> {
```

```mutacao
arquivo: apps/api/src/sala/acesso-da-turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/acesso
-gerar(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaPedidoGerarAcesso)) pedido: PedidoGerarAcesso): Promise<RespostaAcessoGerado> {
+gerar(@Param('id', IdPipe) turmaId: string, @Body() pedido: PedidoGerarAcesso): Promise<RespostaAcessoGerado> {
```

```mutacao
arquivo: apps/api/src/sala/acesso-da-turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/turmas/:id/acesso
-ler(@Param('id', IdPipe) turmaId: string): Promise<RespostaAcessoDaTurma> {
+ler(@Param('id') turmaId: string): Promise<RespostaAcessoDaTurma> {
```

```mutacao
arquivo: apps/api/src/sala/acesso-da-turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/acesso/revogar
-revogar(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
+revogar(@Param('id') turmaId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
```

```mutacao
arquivo: apps/api/src/sala/acesso-da-turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/turmas/:id/acesso/revogar
-revogar(@Param('id', IdPipe) turmaId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
+revogar(@Param('id', IdPipe) turmaId: string, @Body() _corpo: PedidoSemCorpo): Promise<void> {
```

```mutacao
arquivo: apps/api/src/sala/pedidos.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/turmas/:id/reivindicacoes
-pedidos(@Param('id', IdPipe) turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaPedidosDaTurma)) consulta: ConsultaPedidosDaTurma): Promise<RespostaPedidosDaTurma> {
+pedidos(@Param('id') turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaPedidosDaTurma)) consulta: ConsultaPedidosDaTurma): Promise<RespostaPedidosDaTurma> {
```

```mutacao
arquivo: apps/api/src/sala/pedidos.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de GET /v1/turmas/:id/reivindicacoes
-pedidos(@Param('id', IdPipe) turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaPedidosDaTurma)) consulta: ConsultaPedidosDaTurma): Promise<RespostaPedidosDaTurma> {
+pedidos(@Param('id', IdPipe) turmaId: string, @Query() consulta: ConsultaPedidosDaTurma): Promise<RespostaPedidosDaTurma> {
```

```mutacao
arquivo: apps/api/src/sala/pedidos.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/reivindicacoes/decidir
-decidir(@Body(new ZodValidationPipe(esquemaPedidoDecidirReivindicacoes)) pedido: PedidoDecidirReivindicacoes): Promise<RespostaDecisao> {
+decidir(@Body() pedido: PedidoDecidirReivindicacoes): Promise<RespostaDecisao> {
```

```mutacao
arquivo: apps/api/src/sala/salas.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/salas/abrir
-abrir(@Body(new ZodValidationPipe(esquemaPedidoAbrirSala)) pedido: PedidoAbrirSala): Promise<RespostaSalaAberta> {
+abrir(@Body() pedido: PedidoAbrirSala): Promise<RespostaSalaAberta> {
```

```mutacao
arquivo: apps/api/src/sala/salas.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/salas/reivindicar
-reivindicar(@Body(new ZodValidationPipe(esquemaPedidoReivindicarSala)) pedido: PedidoReivindicarSala): Promise<RespostaReivindicacao> {
+reivindicar(@Body() pedido: PedidoReivindicarSala): Promise<RespostaReivindicacao> {
```

```mutacao
arquivo: apps/api/src/sala/acesso-da-turma.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › sem corpo nenhum, POST /v1/turmas/:id/acesso/revogar
-const esquemaSemCorpo = esquemaPedidoRevogarAcesso.default({})
+const esquemaSemCorpo = esquemaPedidoRevogarAcesso
```

```mutacao
arquivo: apps/api/src/governanca/governanca.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/governanca/funcoes/:chave/suspender
-const pipeDaChave = new ZodValidationPipe(esquemaChaveDeFuncao, { errorCode: CodigoDeErro.NAO_ENCONTRADO })
+const pipeDaChave = new ZodValidationPipe(esquemaChaveDeFuncao)
```

```mutacao
arquivo: apps/api/src/governanca/governanca.controller.ts
teste: apps/api/test/borda-de-entrada.int.test.ts › a borda de POST /v1/governanca/funcoes/:chave/retomar
-const pipeDaChave = new ZodValidationPipe(esquemaChaveDeFuncao, { errorCode: CodigoDeErro.NAO_ENCONTRADO })
+const pipeDaChave = new ZodValidationPipe(esquemaChaveDeFuncao)
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de estrutura
-files: ['apps/api/src/{sistema,ia,entrega,assistente,professores,estrutura,sala,governanca}/**/*.controller.ts'],
+files: ['apps/api/src/{sistema,ia,entrega,assistente,professores,sala,governanca}/**/*.controller.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de sala
-files: ['apps/api/src/{sistema,ia,entrega,assistente,professores,estrutura,sala,governanca}/**/*.controller.ts'],
+files: ['apps/api/src/{sistema,ia,entrega,assistente,professores,estrutura,governanca}/**/*.controller.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de governanca
-files: ['apps/api/src/{sistema,ia,entrega,assistente,professores,estrutura,sala,governanca}/**/*.controller.ts'],
+files: ['apps/api/src/{sistema,ia,entrega,assistente,professores,estrutura,sala}/**/*.controller.ts'],
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | "Pela regra 40, o portão da tarefa só roda os testes de integração que a tarefa alterou. Os casos da tabela que vivem nesses cinco arquivos não rodaram antes do commit … Também não vi o código da sala fora do formato coberto: a rota `salas/abrir` em `borda-de-entrada.int.test.ts:170` usa um código no formato certo." | Recusada, com o motivo: é registro, e o item é do `test-engineer`, que rodou os 14 arquivos não alterados (313 testes verdes) e deu como coberto o link e o código fora do formato em `salas-abrir.int.test.ts:290-310`. O que não roda no portão da tarefa roda na esteira (regra 40). O item 2 desta ordem já registra a lacuna em "Divergências resolvidas". |
| tenancy-guardian (2ª) | "`apps/api/test/estrutura-isolamento.int.test.ts:128`: cada resposta é comparada com `mensagem: expect.any(String)`, mas as respostas não são comparadas entre si. Se a mensagem do 404 da turma de B fosse diferente da mensagem do inexistente, o teste não pegaria. O caso vizinho (`:104-105`) compara todas com a primeira. Vale fazer igual aqui (regra 10, item 6)." | `TODO.md`: o Implementador escreve a linha no commit da tarefa |
| revisor-geral (2ª) e test-engineer (2ª) | "O teste novo de isolamento cobre a remoção da cláusula de escola, mas nenhum bloco de mutação declara essa remoção … vale declarar a mutação no repository de turma citando esse caso." / "não há bloco de mutação para essa cláusula em `turma.repository.ts:193`. O portão não provou essa afirmação, só a minha leitura." | `TODO.md`: o Implementador escreve a linha no commit da tarefa. A cláusula não é nova nesta tarefa e mexer em `turma.repository.ts` caducaria os três revisores |
| test-engineer (2ª) | "O comentário em `turma.repository.ts:177-178` diz que "o ano precisa ser da escola do contexto". Isso só é verdade por causa da linha 193 … Vale dizer isso no comentário, para ninguém achar que a subconsulta protege sozinha." | `TODO.md`, na mesma linha da recomendação acima, pelo mesmo motivo (arquivo fora da tarefa) |
| revisor-geral (2ª) | "No mesmo teste, a função `ler(id, rota)` recebe `'?'` ou `'&'` para montar a consulta, o que deixa a montagem do caminho difícil de ler. Montar o caminho completo em cada chamada ficaria mais claro." | Recusada: é estilo de um helper de teste, não muda o que o teste prova nem o contrato |

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
| 2026-10-22 13:00:09 | 2026-10-22 13:01:28 | `tenancy-guardian` | 1 | APROVADO | a81dc2a5162e41e93 |
| 2026-10-22 13:00:15 | 2026-10-22 13:01:41 | `revisor-geral` | 1 | APROVADO | aead8d7f6459298ba |
| 2026-10-22 13:00:12 | 2026-10-22 13:04:26 | `test-engineer` | 1 | APROVADO | a8dc01f9a8db9eb57 |
| 2026-10-22 13:16:15 | 2026-10-22 13:16:43 | `tenancy-guardian` | 2 | APROVADO | a7eee1cd5c9bc34c9 |
| 2026-10-22 13:16:31 | 2026-10-22 13:17:00 | `revisor-geral` | 2 | APROVADO | a32b53f0621506b22 |
| 2026-10-22 13:16:23 | 2026-10-22 13:17:36 | `test-engineer` | 2 | APROVADO | a974679fd258e64df |
