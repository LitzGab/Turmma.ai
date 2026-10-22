# Tarefa 17.0 — Atividade, artefato, material, tutor e privacidade migram, e o lint vale em todo controller

**Funcionalidade:** reengenharia · **Depende de:** 15.0, 16.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Os últimos cinco módulos migram para o `ZodValidationPipe` e o `IdPipe` (D81), o bloco do ESLint passa a valer em todo
controller, e as três funções antigas somem: toda rota valida por esquema, e o lint reprova a que não valida.

## Contexto necessário

- `onda-1a.md` §2 "T1" (revista pela D81: o `errorCode: NAO_ENCONTRADO` da `ferramenta` e da `questao`, o
  `@UploadedFile()`, "Sai", "A trava");
  `techspec.md` §6 e §7; `prd.md` RF5; regras 20.9, 20.11, 80.6 e 10.6
- `apps/api/src/atividade/minha-atividade.controller.ts:54` (`questaoDoCaminho`) e `:65` (`corpo ?? {}`),
  `apps/api/src/artefato/ferramentas.controller.ts:19`, `apps/api/src/material/material.controller.ts:26` (`@UploadedFile`)

## Subtarefas

- [x] 17.1 — Caracterização, num commit antes: o inválido e o 404 da `questao`, da `ferramenta`, do upload e do pedido do titular
- [x] 17.2 — Migram os 4 controllers de `atividade/`, os 2 de `artefato/`, `material/`, os 2 de `tutor/` e os 2 de `privacidade/`
- [x] 17.3 — O `files` do bloco passa a `apps/api/src/**/*.controller.ts`; saem `lerEntrada`, `idDoCaminho` e `lerConsultaPaginada`
- [x] 17.4 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/{atividade,artefato,material,tutor,privacidade}/*.controller.ts` (11) | alterado |
| `apps/api/src/estrutura/entrada.ts` | alterado (saem as três funções; `paginar` fica) |
| `eslint.config.mjs`, `tools/guardas/guardas.test.ts`, `apps/api/test/arquitetura.test.ts` | alterado |
| `apps/api/src/{atividade,artefato,tutor}/*.int.test.ts` | alterado |
| `apps/api/test/{material,material-isolamento,pedido-titular,ops-privacidade}.int.test.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| Prova: `PUT …/respostas/:questao` inválido → `ENTRADA_INVALIDA`, e a resposta salva continua | integração | inválido apagar resposta |
| Prova: `questao` `abc`, `0` ou `-1` → o 404 do inexistente | integração | responder 400 |
| Prova: `questao` acima do total → o código de hoje | integração | o esquema não engole a regra |
| Prova: `POST …/enviar` sem corpo → 200, com chave a mais → `ENTRADA_INVALIDA` | integração | exigir corpo |
| Prova: atividade aplicada de B, aluno de A → 404 | integração | tirar o `eq(…escolaId…)`. Já existe: `apps/api/src/atividade/atividade.int.test.ts › o aluno de A com a atividade de B recebe o mesmo 404 do inexistente, e nenhuma sequência de B muda` e `apps/api/src/atividade/atividade-isolamento.int.test.ts › o aluno de outra turma e o de outra escola não listam, não abrem, não respondem, não enviam nem leem o diagnóstico: igual ao inexistente, e nenhuma tentativa nasce` |
| Prova: avaliação fechada → o código de hoje | integração | o prazo não muda. Já existe: `apps/api/src/atividade/atividade.int.test.ts › depois de encerrada, a resposta e o envio são recusados (ATIVIDADE_ENCERRADA), e quem não abriu continua sem tentativa` |
| Tutor: mensagem vazia, longa ou com chave a mais → `ENTRADA_INVALIDA`, sem `mensagem_tutor`, freio do dia parado | integração | gastar a troca |
| Tutor: mensagem longa com sentinela → nem log nem resposta a têm | integração | logar o corpo no pipe |
| Material: campos inválidos no upload → nada no storage nem em `material` | integração | validação antes do arquivo |
| Material: os campos ao lado do `@UploadedFile()` passam pelo `ZodValidationPipe`, e o arquivo sem campo válido não sobe | integração | validar depois do arquivo |
| Material: id de B em `GET` e `DELETE`, no contexto de A → 404, e o de B fica | integração | tirar o `eq(material.escolaId, …)`. Já existe: `apps/api/test/material-isolamento.int.test.ts › ler material de B responde o mesmo 404 do inexistente e do id fora do formato, para a coordenação e para o professor de A` e `› excluir material de B por A responde o mesmo 404 do inexistente, e nada muda em B: material, trechos e auditoria` |
| Artefato: `ferramenta` fora da lista → o 404 do inexistente | integração | `ENTRADA_INVALIDA` |
| Artefato: `ferramenta` de fora e inexistente, com o mesmo corpo, respondem igual | integração | regra 10.6 |
| Artefato: corpo inválido → sem execução nem consumo | integração | gastar IA |
| Privacidade: `corrigir-nome` inválido com sentinela → o nome não muda, sem eco em log | integração | logar o corpo |
| Privacidade: `titulares/busca` inválida → sem auditoria de leitura nem eco do termo | integração | caracterização |
| Privacidade: pedido do titular de B, no contexto de A → 404 | integração | tirar o `eq(…escolaId…)`. Já existe: `apps/api/test/pedido-titular.int.test.ts › a prévia, a busca, o detalhe, o concluir e o corrigir de B, a partir de A, respondem como inexistente` |
| Lint: a fixture da 14.0 reprova em qualquer `apps/api/src/**/x.controller.ts`; fora de controller, passa | unidade | o `files` ficar com a lista de módulos |
| Nenhum controller chama `safeParse`, `lerEntrada`, `idDoCaminho` nem `lerConsultaPaginada`, e as três não existem | unidade | devolver um `safeParse` em `tutor.controller.ts` |
| `npm run lint` limpo no repositório inteiro, sem `eslint-disable` de `no-restricted-syntax` em `apps/api/src` | unidade | um controller fora (o `npm run lint` do portão); o `eslint-disable` não fura a segunda passada: `tools/guardas/guardas.test.ts › o eslint-disable-next-line de uma violação só esconde essa violação do ESLint comum, e a passada sem comentários as reprova todas` e `› o eslint-disable não fura: o ESLint comum aceita o comentário, e a passada sem comentários do npm run lint reprova do mesmo jeito` |

## Como testar

- A questão: copie `apps/api/src/atividade/atividade.int.test.ts › a questão que a atividade não tem responde como
  inexistente, …` (`:184`).
- O Tutor: `apps/api/src/tutor/tutor.int.test.ts › recusa o corpo fora do contrato: …` (`:219`).
- O isolamento: `apps/api/test/material-isolamento.int.test.ts › ler material de B responde o mesmo 404 do inexistente
  …` (`:95`).
- O log: `CapturaDeDadoPessoal` (`apps/api/test/captura-de-dado-pessoal.ts`).
- Isolado: `npx vitest run --project integracao <arquivo>`.
- Armadilha: o "nenhum controller chama `safeParse`" é um `it` do `apps/api/test/arquitetura.test.ts`, no molde dos que
  já leem os arquivos de `src`; a trava do resto é o bloco do ESLint, que não precisa de outra.

## Fora do escopo desta tarefa

O registro de rotas e o OpenAPI (X6, D81) e a validação de job (18.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| (1) A caracterização (17.1) entra no commit da tarefa, e não num commit à parte: `apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts` (uma linha por rota que lê id, corpo ou consulta nos 11 controllers) foi rodada contra o código antigo antes de qualquer controller mudar e só falhou nos 10 casos de "id e corpo inválidos ao mesmo tempo", que são a mudança do item (2). (2) Em 10 rotas, com o id e o corpo (ou a consulta) inválidos ao mesmo tempo, o erro passa do 404 do id ao 400 do corpo, o último parâmetro, que o Nest resolve primeiro: `encerrar`, `abrirDestaque`, `enviar`, `responder`, `aprovar-lote` e o `desempenho` da turma, da atividade; `renomear` e `adaptar` do artefato; `corrigir-nome` e `arquivo` do pedido do titular. Além delas, com o corpo inválido, a `ferramenta` fora da lista passa do 404 ao 400, e a `questao` do caminho fora do formato ou do intervalo (`PUT …/respostas/:questao`) também. Com um dos dois válido, ou com o corpo ausente onde ele pode faltar, nada muda. As rotas de privacidade que já liam o corpo antes do id (`meus-dados/:id/baixar`, `incidentes/:id/confirmar`, `concluir`, `cancelar`) não mudam. (3) `esquemaQuestaoDoCaminho` (`packages/shared`) troca o `questaoDoCaminho` do controller: só um ou dois dígitos de 1 a 20, porque o `coerce` aceitaria `0x3`, `+3` e `001`; sem `.int()`, porque os dígitos já garantem o inteiro. (4) `esquemaPedidoSemCorpoOuAusente` (`esquemaPedidoSemCorpo.default({})`) vai para `packages/shared` e serve aos quatro `POST` da atividade que aceitam faltar o corpo; os de privacidade e o `meus-dados` ficam com o `esquemaPedidoSemCorpo` sem o `default`, que recusa a falta, como o `lerEntrada` de antes. (5) Os tipos `ParametroFerramenta`, `BuscaDeTitulares` e `ConsultaMinhasAtividades` saem de `packages/shared`, ao lado dos esquemas (regra 00, item 6). (6) O upload do material valida os campos pelo `ZodValidationPipe` ao lado do `@UploadedFile()`: o interceptor recebe o arquivo na memória antes do pipe, e o pipe recusa os campos antes do service, então o arquivo de um pedido recusado nem chega à leitura. O arquivo não é guardado em storage (`docs/mvp-rapido.md`, seção 4), e por isso o "nada no storage" da tabela é provado pelo extrator não chamado e por nenhuma linha em `material`. (7) As linhas da tabela que já tinham teste na suíte (a questão que a atividade não tem, a atividade de B lida pelo aluno de A, a avaliação fechada, o id de B em `GET` e `DELETE` do material, o pedido do titular de B) não ganharam teste novo; ganharam o que faltava: as questões `0x3`, `+3` e `001`, a resposta que continua salva com o corpo inválido, o `enviar` com e sem corpo, o tutor com texto longo e sentinela, a correção e a busca do titular com sentinela, o upload com campo fora do contrato, e a ferramenta fora da lista igual ao inexistente ao pé da letra. (8) `apps/api/src/**/*.controller.ts` no `files` do primeiro bloco do ESLint, e o segundo bloco (16.0) segue devolvendo o `@Req()` só a `sessao/` e `operacao/`. | (1) O hook só aceita commit com código de `apps/`, `packages/` ou `tools/` com `(tarefa N.0)`, portão carimbado e a rodada dos revisores; um commit só de teste pediria tudo isso duas vezes (a mesma razão da 14.0, da 15.0 e da 16.0). (2) É a ordem entre corpo e caminho que `onda-1a.md` T1 já aceita ("caracterizada, não forçada"), e não revela existência: com a entrada inválida, qualquer id, fora do formato, inexistente ou de outra escola, dá o mesmo 400. (3) O `errorCode: NAO_ENCONTRADO` da `questao` é o da `onda-1a.md` T1 (revista pela D81). (4) O Express 5 deixa `req.body` indefinido sem corpo, e o `revogar` do acesso da turma (15.0) e o `refazer` do painel (16.0) já usam o `.default({})`. (6) A regra 20, item 7 (arquivo em bucket privado) não se aplica a um arquivo que nunca é guardado. | (1), (2), (3), (4) e (6) `onda-1a.md` T1, o parágrafo "A 17.0 repete a conduta", ao lado dos da 14.0, 15.0 e 16.0. (3) também em `packages/shared/src/atividade/prova.ts`, docblock de `esquemaQuestaoDoCaminho`, e em `apps/api/src/atividade/minha-atividade.controller.ts`, docblock da classe. (4) `packages/shared/src/atividade/atividade-aplicada.ts`, docblock de `esquemaPedidoSemCorpoOuAusente`. (6) `apps/api/src/material/material.controller.ts`, docblock de `enviar`. (5) não é desvio da spec: `.claude/rules/00-arquitetura.md`, item 6 (o tipo de API mora em `packages/shared`, ao lado do esquema). (7) é decisão de cobertura de testes: `tasks/prd-reengenharia/17_task.md`, tabela "Testes que provam a regra", que cita pelo nome os testes que já existiam; é também o motivo de `material-isolamento.int.test.ts` e `ops-privacidade.int.test.ts`, de "Arquivos previstos", não terem mudado. (8) `eslint.config.mjs`, o comentário do primeiro bloco ("Vale em todo `apps/api/src/**/*.controller.ts`"), `docs/arquitetura.md` ("A entrada") e `docs/guia-do-desenvolvedor.md` §5.1, passo 3 |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/atividade/atividade-aplicada.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/atividades-aplicadas:
-  aplicar(@Body(new ZodValidationPipe(esquemaPedidoAplicarAtividade)) pedido: PedidoAplicarAtividade): Promise<RespostaAtividadeAplicada> {
+  aplicar(@Body() pedido: PedidoAplicarAtividade): Promise<RespostaAtividadeAplicada> {
```

```mutacao
arquivo: apps/api/src/atividade/atividade-aplicada.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/atividades-aplicadas:
-  listar(@Query(new ZodValidationPipe(esquemaConsultaAtividadesAplicadas)) consulta: ConsultaAtividadesAplicadas): Promise<RespostaListaDeAtividadesAplicadas> {
+  listar(@Query() consulta: ConsultaAtividadesAplicadas): Promise<RespostaListaDeAtividadesAplicadas> {
```

```mutacao
arquivo: apps/api/src/atividade/atividade-aplicada.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/atividades-aplicadas/:id/encerrar:
-  encerrar(@Param('id', IdPipe) atividadeAplicadaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaAtividadeEncerrada> {
+  encerrar(@Param('id') atividadeAplicadaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaAtividadeEncerrada> {
```

```mutacao
arquivo: apps/api/src/atividade/atividade-aplicada.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/atividades-aplicadas/:id/encerrar:
-  encerrar(@Param('id', IdPipe) atividadeAplicadaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaAtividadeEncerrada> {
+  encerrar(@Param('id', IdPipe) atividadeAplicadaId: string, @Body() _corpo: PedidoSemCorpo): Promise<RespostaAtividadeEncerrada> {
```

```mutacao
arquivo: apps/api/src/atividade/atividade-aplicada.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/atividades-aplicadas/:id/correcao:
-  correcao(@Param('id', IdPipe) atividadeAplicadaId: string): Promise<RespostaCorrecaoDoLote> {
+  correcao(@Param('id') atividadeAplicadaId: string): Promise<RespostaCorrecaoDoLote> {
```

```mutacao
arquivo: apps/api/src/atividade/atividade-aplicada.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/atividades-aplicadas/:id/correcao/destaques/:alunoId/abrir, o id da atividade:
   abrirDestaque(
-    @Param('id', IdPipe) atividadeAplicadaId: string,
+    @Param('id') atividadeAplicadaId: string,
```

```mutacao
arquivo: apps/api/src/atividade/atividade-aplicada.controller.ts
teste: apps/api/src/atividade/correcao.int.test.ts › o aluno que não é destaque, o que faltou, o de outra aplicação e o inexistente respondem igual
     @Param('id', IdPipe) atividadeAplicadaId: string,
-    @Param('alunoId', IdPipe) aluno: string,
+    @Param('alunoId') aluno: string,
```

```mutacao
arquivo: apps/api/src/atividade/atividade-aplicada.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/atividades-aplicadas/:id/correcao/destaques/:alunoId/abrir, o id da atividade:
     @Param('alunoId', IdPipe) aluno: string,
-    @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo,
+    @Body() _corpo: PedidoSemCorpo,
```

```mutacao
arquivo: apps/api/src/atividade/desempenho.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/turmas/:id/desempenho:
-  ler(@Param('id', IdPipe) turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaDesempenhoDaTurma)) consulta: ConsultaDesempenhoDaTurma): Promise<RespostaDesempenhoDaTurma> {
+  ler(@Param('id') turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaDesempenhoDaTurma)) consulta: ConsultaDesempenhoDaTurma): Promise<RespostaDesempenhoDaTurma> {
```

```mutacao
arquivo: apps/api/src/atividade/desempenho.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/turmas/:id/desempenho:
-  ler(@Param('id', IdPipe) turmaId: string, @Query(new ZodValidationPipe(esquemaConsultaDesempenhoDaTurma)) consulta: ConsultaDesempenhoDaTurma): Promise<RespostaDesempenhoDaTurma> {
+  ler(@Param('id', IdPipe) turmaId: string, @Query() consulta: ConsultaDesempenhoDaTurma): Promise<RespostaDesempenhoDaTurma> {
```

```mutacao
arquivo: apps/api/src/atividade/lote.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/entregas/:id/aprovar-lote:
-  aprovarLote(@Param('id', IdPipe) entregaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaLoteAprovado> {
+  aprovarLote(@Param('id') entregaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaLoteAprovado> {
```

```mutacao
arquivo: apps/api/src/atividade/lote.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/entregas/:id/aprovar-lote:
-  aprovarLote(@Param('id', IdPipe) entregaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaLoteAprovado> {
+  aprovarLote(@Param('id', IdPipe) entregaId: string, @Body() _corpo: PedidoSemCorpo): Promise<RespostaLoteAprovado> {
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/minhas-atividades:
-  listar(@Query(new ZodValidationPipe(esquemaConsultaMinhasAtividades)) consulta: ConsultaMinhasAtividades): Promise<RespostaMinhasAtividades> {
+  listar(@Query() consulta: ConsultaMinhasAtividades): Promise<RespostaMinhasAtividades> {
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/atividades-aplicadas/:id/prova:
-  prova(@Param('id', IdPipe) atividadeAplicadaId: string): Promise<RespostaProva> {
+  prova(@Param('id') atividadeAplicadaId: string): Promise<RespostaProva> {
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de PUT /v1/atividades-aplicadas/:id/respostas/:questao, o id:
   responder(
-    @Param('id', IdPipe) atividadeAplicadaId: string,
+    @Param('id') atividadeAplicadaId: string,
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de PUT /v1/atividades-aplicadas/:id/respostas/:questao, o id:
     @Param('questao', new ZodValidationPipe(esquemaQuestaoDoCaminho, { errorCode: CodigoDeErro.NAO_ENCONTRADO })) numero: number,
-    @Body(new ZodValidationPipe(esquemaPedidoResponderQuestao)) pedido: PedidoResponderQuestao,
+    @Body() pedido: PedidoResponderQuestao,
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/atividades-aplicadas/:id/enviar:
-  enviar(@Param('id', IdPipe) atividadeAplicadaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaAtividadeEnviada> {
+  enviar(@Param('id') atividadeAplicadaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaAtividadeEnviada> {
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/atividades-aplicadas/:id/enviar:
-  enviar(@Param('id', IdPipe) atividadeAplicadaId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaAtividadeEnviada> {
+  enviar(@Param('id', IdPipe) atividadeAplicadaId: string, @Body() _corpo: PedidoSemCorpo): Promise<RespostaAtividadeEnviada> {
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/atividades-aplicadas/:id/meu-diagnostico:
-  meuDiagnostico(@Param('id', IdPipe) atividadeAplicadaId: string): Promise<RespostaMeuDiagnostico> {
+  meuDiagnostico(@Param('id') atividadeAplicadaId: string): Promise<RespostaMeuDiagnostico> {
```

```mutacao
arquivo: apps/api/src/artefato/artefato.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/artefatos:
-  listar(@Query(new ZodValidationPipe(esquemaConsultaArtefatos)) consulta: ConsultaArtefatos): Promise<RespostaListaDeArtefatos> {
+  listar(@Query() consulta: ConsultaArtefatos): Promise<RespostaListaDeArtefatos> {
```

```mutacao
arquivo: apps/api/src/artefato/artefato.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/artefatos/:id:
-  ler(@Param('id', IdPipe) artefatoId: string): Promise<RespostaArtefato> {
+  ler(@Param('id') artefatoId: string): Promise<RespostaArtefato> {
```

```mutacao
arquivo: apps/api/src/artefato/artefato.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de PATCH /v1/artefatos/:id:
-  renomear(@Param('id', IdPipe) artefatoId: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearArtefato)) pedido: PedidoRenomearArtefato): Promise<RespostaArtefato> {
+  renomear(@Param('id') artefatoId: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearArtefato)) pedido: PedidoRenomearArtefato): Promise<RespostaArtefato> {
```

```mutacao
arquivo: apps/api/src/artefato/artefato.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de PATCH /v1/artefatos/:id:
-  renomear(@Param('id', IdPipe) artefatoId: string, @Body(new ZodValidationPipe(esquemaPedidoRenomearArtefato)) pedido: PedidoRenomearArtefato): Promise<RespostaArtefato> {
+  renomear(@Param('id', IdPipe) artefatoId: string, @Body() pedido: PedidoRenomearArtefato): Promise<RespostaArtefato> {
```

```mutacao
arquivo: apps/api/src/artefato/artefato.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/artefatos/:id/pdf:
-  async pdf(@Param('id', IdPipe) artefatoId: string): Promise<StreamableFile> {
+  async pdf(@Param('id') artefatoId: string): Promise<StreamableFile> {
```

```mutacao
arquivo: apps/api/src/artefato/artefato.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/artefatos/:id/adaptar:
-  adaptar(@Param('id', IdPipe) artefatoId: string, @Body(new ZodValidationPipe(esquemaPedidoAdaptarArtefato)) pedido: PedidoAdaptarArtefato): Promise<RespostaExecucaoAceita> {
+  adaptar(@Param('id') artefatoId: string, @Body(new ZodValidationPipe(esquemaPedidoAdaptarArtefato)) pedido: PedidoAdaptarArtefato): Promise<RespostaExecucaoAceita> {
```

```mutacao
arquivo: apps/api/src/artefato/artefato.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/artefatos/:id/adaptar:
-  adaptar(@Param('id', IdPipe) artefatoId: string, @Body(new ZodValidationPipe(esquemaPedidoAdaptarArtefato)) pedido: PedidoAdaptarArtefato): Promise<RespostaExecucaoAceita> {
+  adaptar(@Param('id', IdPipe) artefatoId: string, @Body() pedido: PedidoAdaptarArtefato): Promise<RespostaExecucaoAceita> {
```

```mutacao
arquivo: apps/api/src/material/material.controller.ts
teste: apps/api/test/material.int.test.ts › os campos ao lado do arquivo passam pelo ZodValidationPipe
-  enviar(@Body(new ZodValidationPipe(esquemaPedidoEnviarMaterial)) campos: PedidoEnviarMaterial, @UploadedFile() arquivo: unknown): Promise<RespostaMaterial> {
+  enviar(@Body() campos: PedidoEnviarMaterial, @UploadedFile() arquivo: unknown): Promise<RespostaMaterial> {
```

```mutacao
arquivo: apps/api/src/material/material.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/materiais:
-  listar(@Query(new ZodValidationPipe(esquemaConsultaMateriais)) consulta: ConsultaMateriais): Promise<RespostaListaDeMateriais> {
+  listar(@Query() consulta: ConsultaMateriais): Promise<RespostaListaDeMateriais> {
```

```mutacao
arquivo: apps/api/src/material/material.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/materiais/busca:
-  buscar(@Query(new ZodValidationPipe(esquemaConsultaBuscaDeMaterial)) consulta: ConsultaBuscaDeMaterial): Promise<RespostaBuscaDeMaterial> {
+  buscar(@Query() consulta: ConsultaBuscaDeMaterial): Promise<RespostaBuscaDeMaterial> {
```

```mutacao
arquivo: apps/api/src/material/material.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/materiais/:id:
-  ler(@Param('id', IdPipe) materialId: string): Promise<RespostaMaterial> {
+  ler(@Param('id') materialId: string): Promise<RespostaMaterial> {
```

```mutacao
arquivo: apps/api/src/material/material.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de DELETE /v1/materiais/:id:
-  excluir(@Param('id', IdPipe) materialId: string): Promise<void> {
+  excluir(@Param('id') materialId: string): Promise<void> {
```

```mutacao
arquivo: apps/api/src/tutor/sinais.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/sinais:
-  listar(@Query(new ZodValidationPipe(esquemaConsultaSinais)) consulta: ConsultaSinais): Promise<RespostaSinais> {
+  listar(@Query() consulta: ConsultaSinais): Promise<RespostaSinais> {
```

```mutacao
arquivo: apps/api/src/tutor/tutor.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/tutor/mensagens:
-  enviar(@Body(new ZodValidationPipe(esquemaPedidoMensagemAoTutor)) pedido: PedidoMensagemAoTutor): Promise<RespostaExecucaoAceita> {
+  enviar(@Body() pedido: PedidoMensagemAoTutor): Promise<RespostaExecucaoAceita> {
```

```mutacao
arquivo: apps/api/src/tutor/tutor.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/tutor/conversa:
-  conversa(@Query(new ZodValidationPipe(esquemaConsultaConversaDoTutor)) consulta: ConsultaConversaDoTutor): Promise<RespostaConversaDoTutor> {
+  conversa(@Query() consulta: ConsultaConversaDoTutor): Promise<RespostaConversaDoTutor> {
```

```mutacao
arquivo: apps/api/src/tutor/tutor.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/tutor/uso:
-  uso(@Query(new ZodValidationPipe(esquemaConsultaUsoDoTutor)) consulta: ConsultaUsoDoTutor): Promise<RespostaUsoDoTutor> {
+  uso(@Query() consulta: ConsultaUsoDoTutor): Promise<RespostaUsoDoTutor> {
```

```mutacao
arquivo: apps/api/src/privacidade/meus-dados.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/meus-dados/:id/baixar:
-  baixar(@Param('id', IdPipe) pedidoId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<RespostaDoArquivo> {
+  baixar(@Param('id') pedidoId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<RespostaDoArquivo> {
```

```mutacao
arquivo: apps/api/src/privacidade/meus-dados.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/meus-dados/:id/baixar:
-  baixar(@Param('id', IdPipe) pedidoId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<RespostaDoArquivo> {
+  baixar(@Param('id', IdPipe) pedidoId: string, @Body() _corpo: PedidoSemCorpo): Promise<RespostaDoArquivo> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/incidentes/:id/confirmar:
-  confirmarIncidente(@Param('id', IdPipe) incidenteId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
+  confirmarIncidente(@Param('id') incidenteId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/incidentes/:id/confirmar:
-  confirmarIncidente(@Param('id', IdPipe) incidenteId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
+  confirmarIncidente(@Param('id', IdPipe) incidenteId: string, @Body() _corpo: PedidoSemCorpo): Promise<void> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/titulares/busca:
-  buscarTitulares(@Body(new ZodValidationPipe(esquemaBuscaDeTitulares)) busca: BuscaDeTitulares): Promise<RespostaBuscaDeTitulares> {
+  buscarTitulares(@Body() busca: BuscaDeTitulares): Promise<RespostaBuscaDeTitulares> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/privacidade/titulares/:id/previa:
-  previaDoTitular(@Param('id', IdPipe) titularId: string): Promise<RespostaPreviaDoTitular> {
+  previaDoTitular(@Param('id') titularId: string): Promise<RespostaPreviaDoTitular> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/pedidos:
-  registrarPedido(@Body(new ZodValidationPipe(esquemaRegistroDePedido)) registro: RegistroDePedido): Promise<PedidoDoTitular> {
+  registrarPedido(@Body() registro: RegistroDePedido): Promise<PedidoDoTitular> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/privacidade/pedidos:
-  pedidos(@Query(new ZodValidationPipe(esquemaConsultaPaginada)) consulta: ConsultaPaginada): Promise<RespostaPedidos> {
+  pedidos(@Query() consulta: ConsultaPaginada): Promise<RespostaPedidos> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de GET /v1/privacidade/pedidos/:id:
-  pedido(@Param('id', IdPipe) pedidoId: string): Promise<PedidoDoTitular> {
+  pedido(@Param('id') pedidoId: string): Promise<PedidoDoTitular> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/pedidos/:id/concluir:
-  concluirPedido(@Param('id', IdPipe) pedidoId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
+  concluirPedido(@Param('id') pedidoId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/pedidos/:id/concluir:
-  concluirPedido(@Param('id', IdPipe) pedidoId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
+  concluirPedido(@Param('id', IdPipe) pedidoId: string, @Body() _corpo: PedidoSemCorpo): Promise<void> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/pedidos/:id/cancelar:
-  cancelarPedido(@Param('id', IdPipe) pedidoId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
+  cancelarPedido(@Param('id') pedidoId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/pedidos/:id/cancelar:
-  cancelarPedido(@Param('id', IdPipe) pedidoId: string, @Body(new ZodValidationPipe(esquemaPedidoSemCorpo)) _corpo: PedidoSemCorpo): Promise<void> {
+  cancelarPedido(@Param('id', IdPipe) pedidoId: string, @Body() _corpo: PedidoSemCorpo): Promise<void> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/pedidos/:id/corrigir-nome:
-  corrigirNome(@Param('id', IdPipe) pedidoId: string, @Body(new ZodValidationPipe(esquemaCorrecaoDeNome)) correcao: CorrecaoDeNome): Promise<void> {
+  corrigirNome(@Param('id') pedidoId: string, @Body(new ZodValidationPipe(esquemaCorrecaoDeNome)) correcao: CorrecaoDeNome): Promise<void> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/pedidos/:id/corrigir-nome:
-  corrigirNome(@Param('id', IdPipe) pedidoId: string, @Body(new ZodValidationPipe(esquemaCorrecaoDeNome)) correcao: CorrecaoDeNome): Promise<void> {
+  corrigirNome(@Param('id', IdPipe) pedidoId: string, @Body() correcao: CorrecaoDeNome): Promise<void> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/pedidos/:id/arquivo:
-  arquivoDoPedido(@Param('id', IdPipe) pedidoId: string, @Body(new ZodValidationPipe(esquemaBaixarArquivoDaEscola)) arquivo: BaixarArquivoDaEscola): Promise<RespostaDoArquivo> {
+  arquivoDoPedido(@Param('id') pedidoId: string, @Body(new ZodValidationPipe(esquemaBaixarArquivoDaEscola)) arquivo: BaixarArquivoDaEscola): Promise<RespostaDoArquivo> {
```

```mutacao
arquivo: apps/api/src/privacidade/privacidade.controller.ts
teste: apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts › a borda de POST /v1/privacidade/pedidos/:id/arquivo:
-  arquivoDoPedido(@Param('id', IdPipe) pedidoId: string, @Body(new ZodValidationPipe(esquemaBaixarArquivoDaEscola)) arquivo: BaixarArquivoDaEscola): Promise<RespostaDoArquivo> {
+  arquivoDoPedido(@Param('id', IdPipe) pedidoId: string, @Body() arquivo: BaixarArquivoDaEscola): Promise<RespostaDoArquivo> {
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.controller.ts
teste: apps/api/src/atividade/atividade.int.test.ts › a questão que a atividade não tem responde como inexistente
-    @Param('questao', new ZodValidationPipe(esquemaQuestaoDoCaminho, { errorCode: CodigoDeErro.NAO_ENCONTRADO })) numero: number,
+    @Param('questao') numero: number,
```

```mutacao
arquivo: apps/api/src/atividade/minha-atividade.controller.ts
teste: apps/api/src/atividade/atividade.int.test.ts › a questão que a atividade não tem responde como inexistente
-    @Param('questao', new ZodValidationPipe(esquemaQuestaoDoCaminho, { errorCode: CodigoDeErro.NAO_ENCONTRADO })) numero: number,
+    @Param('questao', new ZodValidationPipe(esquemaQuestaoDoCaminho)) numero: number,
```

```mutacao
arquivo: apps/api/src/artefato/ferramentas.controller.ts
teste: apps/api/src/artefato/artefato.int.test.ts › o corpo é o contrato estrito, e ferramenta fora da lista não existe
-    @Param('ferramenta', new ZodValidationPipe(esquemaParametroFerramenta, { errorCode: CodigoDeErro.NAO_ENCONTRADO })) ferramenta: ParametroFerramenta,
+    @Param('ferramenta') ferramenta: ParametroFerramenta,
```

```mutacao
arquivo: apps/api/src/artefato/ferramentas.controller.ts
teste: apps/api/src/artefato/artefato.int.test.ts › o corpo é o contrato estrito, e ferramenta fora da lista não existe
-    @Param('ferramenta', new ZodValidationPipe(esquemaParametroFerramenta, { errorCode: CodigoDeErro.NAO_ENCONTRADO })) ferramenta: ParametroFerramenta,
+    @Param('ferramenta', new ZodValidationPipe(esquemaParametroFerramenta)) ferramenta: ParametroFerramenta,
```

```mutacao
arquivo: apps/api/src/artefato/ferramentas.controller.ts
teste: apps/api/src/artefato/artefato.int.test.ts › o corpo é o contrato estrito, e ferramenta fora da lista não existe
-    @Body(new ZodValidationPipe(esquemaPedidoGerarComFerramenta)) pedido: PedidoGerarComFerramenta,
+    @Body() pedido: PedidoGerarComFerramenta,
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: packages/shared/src/atividade/atividade.test.ts › a resposta é o índice da alternativa
   .string()
-  .regex(/^\d{1,2}$/)
   .transform(Number)
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: packages/shared/src/atividade/atividade.test.ts › a resposta é o índice da alternativa
-  .regex(/^\d{1,2}$/)
+  .regex(/^\d{1,3}$/)
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: packages/shared/src/atividade/atividade.test.ts › a resposta é o índice da alternativa
-  .pipe(z.number().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE))
+  .pipe(z.number().min(0).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE))
```

```mutacao
arquivo: packages/shared/src/atividade/prova.ts
teste: packages/shared/src/atividade/atividade.test.ts › a resposta é o índice da alternativa
-  .pipe(z.number().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE))
+  .pipe(z.number().min(1).max(MAXIMO_DE_QUESTOES_POR_ATIVIDADE + 1))
```

```mutacao
arquivo: packages/shared/src/atividade/atividade-aplicada.ts
teste: packages/shared/src/atividade/atividade.test.ts › o corpo que pode faltar vale como vazio
-export const esquemaPedidoSemCorpoOuAusente = esquemaPedidoSemCorpo.default({})
+export const esquemaPedidoSemCorpoOuAusente = esquemaPedidoSemCorpo
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › o controller de um módulo que ainda não existe já nasce barrado
-    files: ['apps/api/src/**/*.controller.ts'],
+    files: ['apps/api/src/{sistema,ia,entrega,assistente,professores,estrutura,sala,governanca,sessao,operacao,atividade,artefato,material,tutor,privacidade}/**/*.controller.ts'],
```

```mutacao
arquivo: apps/api/src/tutor/tutor.controller.ts
teste: apps/api/test/arquitetura.test.ts › nenhum controller chama safeParse
   memoria(): Promise<RespostaMemoriaDoTutor> {
-    return this.tutor.memoria()
+    esquemaConsultaUsoDoTutor.safeParse({})
+    return this.tutor.memoria()
```

```mutacao
arquivo: apps/api/src/estrutura/entrada.ts
teste: apps/api/test/arquitetura.test.ts › lerEntrada, idDoCaminho e lerConsultaPaginada não são declaradas
-/** O mesmo corte, para a página ordenada por outra chave (os alunos da turma vão em ordem de `usuarioId`). */
+export function idDoCaminho(id: string): string { return id }
+/** O mesmo corte, para a página ordenada por outra chave (os alunos da turma vão em ordem de `usuarioId`). */
```

```mutacao
arquivo: apps/api/src/tutor/tutor.controller.ts
teste: apps/api/src/tutor/tutor.int.test.ts › a mensagem vazia, acima do tamanho, ou com um campo a mais, é ENTRADA_INVALIDA
-  enviar(@Body(new ZodValidationPipe(esquemaPedidoMensagemAoTutor)) pedido: PedidoMensagemAoTutor): Promise<RespostaExecucaoAceita> {
+  enviar(@Body() pedido: PedidoMensagemAoTutor): Promise<RespostaExecucaoAceita> {
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Acrescentar ao caso "ao mesmo tempo" um id real da escola B, para provar em teste o "de outra escola dá o mesmo 400" | Recusada: o pipe não consulta o banco, então o 400 não depende do id; a garantia fica escrita no teste (a resposta não depende de o id existir). O teste da borda não tem uma segunda escola montada, e o 404 de B já é provado em `material-isolamento.int.test.ts`, `atividade.int.test.ts` e `pedido-titular.int.test.ts` |
| test-engineer (1ª) | `adaptacao` e `x` caem no mesmo enum do pipe, então a igualdade é quase automática (nota; o laço que exige o 404 é o que protege) | Recusada: o próprio revisor a deixou como nota, sem pedir mudança, e a regra 10.6 está provada |
| revisor-geral (1ª) | Dois jeitos de montar o corpo vazio que pode faltar: a constante local `esquemaSemCorpo = X.default({})` em `professores.controller.ts`, `operacao/sessao.controller.ts`, `operacao/painel.controller.ts` e `sala/acesso-da-turma.controller.ts`, e o `esquemaPedidoSemCorpoOuAusente` novo | `TODO.md`: unificar na próxima tarefa que mexa nesses controllers (quatro arquivos de outros módulos, fora do escopo desta tarefa) |
| privacy-guardian (2ª) | Levar para a divergência (2) de `17_task.md` a frase de que o pipe não consulta o banco, para o texto "ou de outra escola, dá o mesmo 400" não prometer mais do que o teste prova | Recusada: a afirmação é verdadeira por construção (o pipe não consulta o banco) e a justificativa está escrita no teste da borda e em `onda-1a.md` T1 ("Não revela existência"); é texto, sem efeito sobre a prova |
| test-engineer (2ª) | Citar `artefato.int.test.ts › o corpo é o contrato estrito, e ferramenta fora da lista não existe` na linha "Artefato: corpo inválido → sem execução nem consumo" da tabela | Recusada: texto da tabela, sem efeito sobre a prova; o teste já está nomeado na seção "Mutações" |
| test-engineer (2ª) | O `{ texto: '' }` do laço novo repete o que `{ texto: '   ' }` já prova; o `not.toContain(sentinela)` dele passa por construção | Recusada: era registro do próprio revisor, sem pedir mudança; a tabela pede o vazio junto de "freio parado" |
| revisor-geral (2ª) | Quebrar cada item numerado da divergência em uma linha própria da tabela do documento da tarefa | `/retro` da funcionalidade (formato do template de tarefa, do Arquiteto): a coluna ficou longa, mas a 17.0 já está escrita |

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
| 2026-10-22 19:51:29 | 2026-10-22 19:52:20 | `tenancy-guardian` | 1 | APROVADO | a563ee1b2d3a9075b |
| 2026-10-22 19:51:32 | 2026-10-22 19:52:32 | `privacy-guardian` | 1 | APROVADO | a2695cd97c7f40bc2 |
| 2026-10-22 19:51:36 | 2026-10-22 19:53:05 | `test-engineer` | 1 | APROVADO | a34315341901380aa |
| 2026-10-22 19:51:40 | 2026-10-22 19:53:13 | `revisor-geral` | 1 | APROVADO | ac4f1e1e0313aa326 |
| 2026-10-22 20:14:09 | 2026-10-22 20:14:24 | `tenancy-guardian` | 2 | APROVADO | a46667d99556b67db |
| 2026-10-22 20:14:16 | 2026-10-22 20:14:36 | `privacy-guardian` | 2 | APROVADO | ae48d102da8ff35db |
| 2026-10-22 20:14:32 | 2026-10-22 20:14:51 | `revisor-geral` | 2 | APROVADO | a9ca26e6b9976e51a |
| 2026-10-22 20:14:24 | 2026-10-22 20:14:57 | `test-engineer` | 2 | APROVADO | acfce7c1286fb45a7 |
