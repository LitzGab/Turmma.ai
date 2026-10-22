# Tarefa 16.0 — Sessão e operação validam pelo `ZodValidationPipe`, sem gastar tentativa com entrada inválida

**Funcionalidade:** reengenharia · **Depende de:** 14.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `infra-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

`sessao/` e `operacao/` validam pelo `ZodValidationPipe` e pelo `IdPipe` da 14.0 (D81), sem gastar tentativa da conta
nem alimentar a trava com entrada inválida. O `@Req()` fica só onde se lê cookie e IP.

## Contexto necessário

- `onda-1a.md` §2, "T1" (revista pela D81: o `IdPipe({ invalidAsUndefined: true })` do `redefinir-mfa`, o
  `errorCode: NAO_ENCONTRADO` do `slug` e do `provedor`, e a ordem dos erros); `techspec.md` §6 e §7c
- `prd.md` RF5; `.claude/rules/80-infra-e-carga.md` itens 1 e 7 (limite por conta, não por IP), `10-multitenancy.md` item 6
- `apps/api/src/sessao/mfa.controller.ts:37` (`extrairTokenBearer` antes do `safeParse`) e
  `apps/api/src/sessao/redefinir-mfa.controller.ts:20-25` (corpo primeiro; id inválido devolve 202 sem efeito)
- A 11.0 já separou `login.service`: os controllers de login chamam os arquivos novos dela

## Subtarefas

- [x] 16.1 — Caracterização, num commit antes: a ordem dos erros em `mfa`, `sessao/mfa` e `redefinir-mfa`, e o 404 do `slug` e do `provedor`
- [x] 16.2 — Migram os 12 controllers de `sessao/` e os 6 de `operacao/`; o `@Req()` fica só onde se lê cookie e IP, com o motivo no segundo bloco do ESLint
- [x] 16.3 — Os dois módulos entram no `files` do bloco de `no-restricted-syntax`
- [x] 16.4 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/*.controller.ts`, `apps/api/src/sessao/externa/externa.controller.ts` | alterado |
| `apps/api/src/operacao/*.controller.ts` (6) | alterado |
| `eslint.config.mjs`, `tools/guardas/guardas.test.ts` | alterado |
| `apps/api/test/{mfa,login-email,sessao-matricula,sessao-externa,acesso-da-escola,troca-de-escola,semaforo-de-login}.int.test.ts` | alterado |
| `apps/api/test/{entrada-operador,segundo-fator-operador-concorrencia,painel-leitura,painel-escrita}.int.test.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| `POST /v1/mfa/ativar` sem `Authorization` e corpo válido → 401; com corpo inválido → 400, sem tentativa (mudança declarada, `onda-1a.md` T1) | integração | o token deixar de ser exigido |
| `POST /v1/sessao/mfa` com desafio inválido e corpo válido → 401, sem gastar tentativa de ninguém | integração | o desafio deixar de ser conferido |
| `POST /v1/sessao/mfa` com desafio válido e corpo inválido → `ENTRADA_INVALIDA`, sem gastar tentativa | integração | o pipe passar o valor cru |
| Login por e-mail ou matrícula com corpo inválido → `ENTRADA_INVALIDA`, sem tentativa nem `registro_acesso` | integração | inválido não alimenta a trava |
| Login com corpo inválido conta no balde por IP da rota anônima como hoje | integração | a guarda de limite vem antes (regra 80.1) |
| 35 logins do mesmo IP ao mesmo tempo, verdes depois (`semaforo-de-login.int.test.ts › borda (regra 80, item 1): 35 alunos do mesmo IP`) | integração | o limite por conta não muda |
| A mesma matrícula com o `slug` de A e de B entra em cada uma (`sessao-matricula.int.test.ts › isolamento (RF7, RF15): a matrícula 1234 existe em A e em B`) | integração | o esquema não perde o `slug` |
| `slug` fora do formato → o 404 do inexistente | integração | responder 400 |
| `provedor` desconhecido → o mesmo 404 | integração | responder 400 |
| `redefinir-mfa`: id fora do formato e corpo válido → 202, sem efeito | integração | `IdPipe` sem `invalidAsUndefined` (404) |
| `redefinir-mfa`: id fora do formato e corpo inválido → 400 | integração | validar o id antes |
| `redefinir-mfa`: id de coordenador de B, no contexto de A → 202, MFA dele intacto (`mfa.int.test.ts › isolamento: usuário só de B dá 202 sem efeito`) | integração | tirar o `eq(usuario.escolaId, …)` |
| Troca para escola sem vínculo → o erro da escola inexistente (`troca-de-escola.int.test.ts › isolamento: escolher e trocar com o usuarioId de outra conta`) | integração | regra 10.6 |
| Entrada do operador com corpo inválido conta no `rl:ip:op` como hoje (`borda-de-entrada-sessao.int.test.ts › o corpo inválido conta no balde do IP`) | integração | o limite da operação não muda |
| Dois segundos fatores do operador ao mesmo tempo, verdes (`segundo-fator-operador-concorrencia.int.test.ts`, os casos "trava primeiro", linhas 151 e 173) | integração | concorrência mantida |
| Painel com consulta paginada inválida → `ENTRADA_INVALIDA` | integração | o `safeParse` do `painel.controller.ts` sai |
| Criar escola com slug fora do formato ou chave a mais não cria rede, escola nem auditoria (`painel-escrita.int.test.ts › corpo com autor, ou qualquer campo a mais`) | integração | sem `.strict()` |
| Lint: a fixture da 14.0 em `apps/api/src/{sessao,operacao}/x.controller.ts` reprova o corpo sem pipe, e o `@Req()` passa só ali | unidade | tirar o módulo do `files`; o segundo bloco valer em todo controller |

## Como testar

- A ordem dos erros: copie `apps/api/test/mfa.int.test.ts › permissão: professor chamando redefinir recebe 404, como rota
  inexistente, e nada muda; finalidade fora da lista é recusada` (`:568`), trocando o par de entradas.
- Sem gastar tentativa: `apps/api/test/login-email.int.test.ts › entrada fora do contrato é recusada antes de qualquer
  hash` (`:379`).
- A carga: `apps/api/test/semaforo-de-login.int.test.ts › borda (regra 80, item 1): 35 alunos do mesmo IP ao mesmo
  tempo, …` (`:227`) roda sem mudança.
- A corrida do operador: `segundo-fator-operador-concorrencia.int.test.ts` (`:151`, `:173`).
- Isolado: `npx vitest run --project integracao apps/api/test/mfa.int.test.ts`.
- Armadilha: a ordem 401/400 muda onde a credencial é lida no handler (`mfa.controller.ts:37`, `:62`), e isso já está
  decidido em `onda-1a.md` T1: escreva a linha em "Divergências resolvidas" e prove o "sem tentativa". Não mova a leitura
  do token para dentro do pipe.

## Fora do escopo desta tarefa

Os outros módulos (15.0, 17.0); o limite por IP da operação (`arquitetura.test.ts:781`) não muda.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| (1) A caracterização (16.1) entra no commit da tarefa, e não num commit à parte. (2) `POST /v1/conta/mfa/ativar` e `POST /v1/sessao/mfa` com o corpo fora do esquema e sem `Authorization`, ou com um desafio que não vale, passam do 401 ao 400: a caracterização foi escrita com o 401 (`mfa.int.test.ts › a ordem dos erros`), passou no código antigo e foi reescrita para o 400 depois da migração. Com o corpo válido, o 401 continua. O "não gasta tentativa" só tem contador em `/v1/sessao/mfa`; o `/v1/conta/mfa/ativar` não usa contador (`mfa.service.ts:80`), e ali a frase quer dizer que o desafio nem é verificado. (3) `AcessoDaEscolaService.ler` e `LoginExterno.iniciar` perdem a conferência de formato do `slug` (e a busca do `provedor` na lista): o `ZodValidationPipe` do controller é o único portão, e o `slug` da query é cortado por `.trim()` no esquema. O pipe do `provedor` sem o `errorCode` é provado; sem o pipe inteiro é equivalente, porque o service responde o mesmo 404 pela lista de provedores ligados, e por isso a seção "Mutações" não tem esse bloco. O `if (alvo === undefined) return` do `redefinir-mfa` também não tem mutação: ele estreita o tipo para o compilador, e sem ele `contaDoUsuarioAtivo(undefined)` não acha usuário e o caso de uso volta sem efeito, o mesmo 202; o teste prova o que importa, que o id fora do formato não deixa nem a recusa na auditoria. (4) `refazer`, `revogar`, `renovar` e `sair` do operador, que aceitam corpo ausente, trocam `corpo ?? {}` por `esquemaPedidoSemCorpoDeOperador.default({})` no pipe. (5) As linhas da tabela de testes que já tinham teste na suíte (login por e-mail e por matrícula com corpo inválido, os 35 logins do mesmo IP, a mesma matrícula com o `slug` de A e de B, a troca para escola sem vínculo, a entrada do operador, os dois segundos fatores ao mesmo tempo, o criar escola estrito) não ganharam teste novo; ganharam o que faltava: o "sem tentativa" do login, o limite por IP vindo antes do pipe (`borda-de-entrada-sessao.int.test.ts`), a consulta do painel e o corpo fora do contrato nos convites e na troca. (6) `sessao` e `operacao` entram no `files` do primeiro bloco do ESLint (16.3) e também no do segundo, que repete os seletores sem o `@Req()`: o segundo vence o primeiro nesses dois módulos, e por isso tirar os dois nomes do primeiro não muda o lint de hoje e não tem mutação que o prove; eles ficam porque a 17.0 faz o primeiro valer em todo controller, e então só o segundo bloco devolve o `@Req()` | (1) O hook só aceita commit com código de `apps/`, `packages/` ou `tools/` com `(tarefa N.0)`, portão carimbado e a rodada dos revisores; um commit só de teste pediria tudo isso duas vezes. (2) O token é lido no handler, por decisão da própria tarefa ("Não mova a leitura do token para dentro do pipe"), e o Nest roda o pipe do corpo antes do handler; não revela existência, porque o corpo inválido dá o mesmo 400 a qualquer token, e não gasta tentativa, porque o desafio nem é verificado. (3) Duas conferências do mesmo formato, uma no controller e outra no service, deixam o pipe sem teste que falhe sem ele (o service responderia o 404 igual); o byte nulo no `slug`, que o Postgres recusa com 500 se chegar à consulta, prova o pipe. (4) O Express 5 deixa `req.body` indefinido sem corpo, e o `revogar` do acesso da turma (15.0) já usa o `.default({})`. (6) O primeiro bloco precisa listar os módulos que a 17.0 generaliza, e o segundo bloco não pode subtrair um seletor do primeiro: tem de repeti-los. (5) A regra 40 ("O portão") põe na esteira a cobertura do que a tarefa não alterou; os arquivos de teste citados acima foram rodados à mão, isolados, antes da rodada | (1), (2), (3) e (4) `onda-1a.md` T1; (6) `eslint.config.mjs`, o comentário do segundo bloco, o parágrafo "A 16.0 repete a conduta", ao lado do da 15.0 (exceção ao `techspec.md` §1, linha 21). (2) também em `apps/api/src/sessao/mfa.controller.ts`, docblock de `ContaMfaController`. (3) `apps/api/src/sessao/acesso-da-escola.service.ts`, docblock da classe. (5) `tasks/prd-reengenharia/16_task.md`, tabela "Testes que provam a regra" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/sessao/acesso-da-escola.controller.ts
teste: apps/api/test/acesso-da-escola.int.test.ts › o slug fora do formato responde o 404 do inexistente
-async ler(@Param('slug', new ZodValidationPipe(esquemaSlugDaEscola, { errorCode: CodigoDeErro.NAO_ENCONTRADO })) slug: string): Promise<RespostaAcessoDaEscola> {
+async ler(@Param('slug') slug: string): Promise<RespostaAcessoDaEscola> {
```

```mutacao
arquivo: apps/api/src/sessao/acesso-da-escola.controller.ts
teste: apps/api/test/acesso-da-escola.int.test.ts › o slug fora do formato responde o 404 do inexistente
-async ler(@Param('slug', new ZodValidationPipe(esquemaSlugDaEscola, { errorCode: CodigoDeErro.NAO_ENCONTRADO })) slug: string): Promise<RespostaAcessoDaEscola> {
+async ler(@Param('slug', new ZodValidationPipe(esquemaSlugDaEscola)) slug: string): Promise<RespostaAcessoDaEscola> {
```

```mutacao
arquivo: apps/api/src/sessao/convite.controller.ts
teste: apps/api/test/convite.int.test.ts › o corpo fora do contrato é ENTRADA_INVALIDA em consultar e em aceitar
-async consultar(@Body(new ZodValidationPipe(esquemaPedidoConsultarConvite)) pedido: PedidoConsultarConvite): Promise<RespostaConsultarConvite> {
+async consultar(@Body() pedido: PedidoConsultarConvite): Promise<RespostaConsultarConvite> {
```

```mutacao
arquivo: apps/api/src/sessao/convite.controller.ts
teste: apps/api/test/convite.int.test.ts › o corpo fora do contrato é ENTRADA_INVALIDA em consultar e em aceitar
-async aceitar(@Body(new ZodValidationPipe(esquemaPedidoAceitarConvite)) pedido: PedidoAceitarConvite): Promise<RespostaAceitarConvite> {
+async aceitar(@Body() pedido: PedidoAceitarConvite): Promise<RespostaAceitarConvite> {
```

```mutacao
arquivo: apps/api/src/sessao/login-email.controller.ts
teste: apps/api/test/login-email.int.test.ts › o corpo fora do contrato não gasta tentativa da conta
-@Body(new ZodValidationPipe(esquemaPedidoLoginEmail)) pedido: PedidoLoginEmail,
+@Body() pedido: PedidoLoginEmail,
```

```mutacao
arquivo: apps/api/src/sessao/matricula.controller.ts
teste: apps/api/test/sessao-matricula.int.test.ts › o corpo fora do contrato não gasta tentativa da matrícula
-@Body(new ZodValidationPipe(esquemaPedidoLoginMatricula)) pedido: PedidoLoginMatricula,
+@Body() pedido: PedidoLoginMatricula,
```

```mutacao
arquivo: apps/api/src/sessao/mfa.controller.ts
teste: apps/api/test/mfa.int.test.ts › a ordem dos erros
-async ativar(@Body(new ZodValidationPipe(esquemaPedidoAtivarMfa)) pedido: PedidoAtivarMfa, @Req() requisicao: IncomingMessage): Promise<RespostaAtivarMfa> {
+async ativar(@Body() pedido: PedidoAtivarMfa, @Req() requisicao: IncomingMessage): Promise<RespostaAtivarMfa> {
```

```mutacao
arquivo: apps/api/src/sessao/mfa.controller.ts
teste: apps/api/test/mfa.int.test.ts › o corpo inválido não gasta tentativa
-@Body(new ZodValidationPipe(esquemaPedidoMfa)) pedido: PedidoMfa,
+@Body() pedido: PedidoMfa,
```

```mutacao
arquivo: apps/api/src/sessao/redefinir-mfa.controller.ts
teste: apps/api/test/mfa.int.test.ts › redefinir: o id em maiúsculas
-@Param('id', new IdPipe({ invalidAsUndefined: true })) alvo: string | undefined,
+@Param('id', IdPipe) alvo: string | undefined,
```

```mutacao
arquivo: apps/api/src/sessao/redefinir-mfa.controller.ts
teste: apps/api/test/mfa.int.test.ts › permissão: professor chamando redefinir
-@Body(new ZodValidationPipe(esquemaPedidoRedefinirMfa)) pedido: PedidoRedefinirMfa,
+@Body() pedido: PedidoRedefinirMfa,
```

```mutacao
arquivo: apps/api/src/sessao/troca-de-escola.controller.ts
teste: apps/api/test/troca-de-escola.int.test.ts › o corpo fora do contrato é ENTRADA_INVALIDA com o desafio e com o token
-@Body(new ZodValidationPipe(esquemaPedidoTrocaDeEscola)) pedido: PedidoTrocaDeEscola,
+@Body() pedido: PedidoTrocaDeEscola,
```

```mutacao
arquivo: apps/api/src/sessao/externa/externa.controller.ts
teste: apps/api/test/sessao-externa.int.test.ts › iniciar: o provedor e o slug fora do formato
-@Param('provedor', new ZodValidationPipe(esquemaProvedor, COMO_INEXISTENTE)) provedor: ProvedorExterno,
+@Param('provedor', new ZodValidationPipe(esquemaProvedor)) provedor: ProvedorExterno,
```

```mutacao
arquivo: apps/api/src/sessao/externa/externa.controller.ts
teste: apps/api/test/sessao-externa.int.test.ts › iniciar: o provedor e o slug fora do formato
-@Query('slug', new ZodValidationPipe(esquemaSlugDigitado, COMO_INEXISTENTE)) slug: string,
+@Query('slug') slug: string,
```

```mutacao
arquivo: apps/api/src/sessao/externa/externa.controller.ts
teste: apps/api/test/sessao-externa.int.test.ts › iniciar: o provedor e o slug fora do formato
-@Query('slug', new ZodValidationPipe(esquemaSlugDigitado, COMO_INEXISTENTE)) slug: string,
+@Query('slug', new ZodValidationPipe(esquemaSlugDigitado)) slug: string,
```

```mutacao
arquivo: apps/api/src/sessao/externa/externa.controller.ts
teste: apps/api/test/sessao-externa.int.test.ts › iniciar: o slug com espaços em volta
-const esquemaSlugDigitado = z.string().trim().pipe(esquemaSlugDaEscola)
+const esquemaSlugDigitado = z.string().pipe(esquemaSlugDaEscola)
```

```mutacao
arquivo: apps/api/src/operacao/convite-operador.controller.ts
teste: apps/api/test/convite-operador.int.test.ts › campo a mais ou senha curta na entrada
-async consultar(@Body(new ZodValidationPipe(esquemaPedidoConsultarConviteDeOperador)) pedido: PedidoConsultarConviteDeOperador): Promise<RespostaConsultarConviteDeOperador> {
+async consultar(@Body() pedido: PedidoConsultarConviteDeOperador): Promise<RespostaConsultarConviteDeOperador> {
```

```mutacao
arquivo: apps/api/src/operacao/convite-operador.controller.ts
teste: apps/api/test/convite-operador.int.test.ts › campo a mais ou senha curta na entrada
-@Body(new ZodValidationPipe(esquemaPedidoAceitarConviteDeOperador)) pedido: PedidoAceitarConviteDeOperador,
+@Body() pedido: PedidoAceitarConviteDeOperador,
```

```mutacao
arquivo: apps/api/src/operacao/entrada.controller.ts
teste: apps/api/test/entrada-operador.int.test.ts › contrato: campo a mais, e-mail curto e senha vazia
-async entrar(@Body(new ZodValidationPipe(esquemaPedidoEntradaDeOperador)) pedido: PedidoEntradaDeOperador, @Req() requisicao: IncomingMessage): Promise<RespostaEntradaDeOperador> {
+async entrar(@Body() pedido: PedidoEntradaDeOperador, @Req() requisicao: IncomingMessage): Promise<RespostaEntradaDeOperador> {
```

```mutacao
arquivo: apps/api/src/operacao/segundo-fator.controller.ts
teste: apps/api/test/segundo-fator-operador.int.test.ts › campo a mais, os dois códigos juntos
-async configurar(@Body(new ZodValidationPipe(esquemaPedidoConfigurarSegundoFatorDeOperador)) pedido: PedidoConfigurarSegundoFatorDeOperador): Promise<RespostaConfigurarSegundoFatorDeOperador> {
+async configurar(@Body() pedido: PedidoConfigurarSegundoFatorDeOperador): Promise<RespostaConfigurarSegundoFatorDeOperador> {
```

```mutacao
arquivo: apps/api/src/operacao/segundo-fator.controller.ts
teste: apps/api/test/segundo-fator-operador.int.test.ts › campo a mais, os dois códigos juntos
-@Body(new ZodValidationPipe(esquemaPedidoSegundoFatorDeOperador)) pedido: PedidoSegundoFatorDeOperador,
+@Body() pedido: PedidoSegundoFatorDeOperador,
```

```mutacao
arquivo: apps/api/src/operacao/sessao.controller.ts
teste: apps/api/test/sessao-operador.int.test.ts › corpo com campo: ENTRADA_INVALIDA com no-store
 async renovar(
-@Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpoDeOperador,
+@Body() _corpo: PedidoSemCorpoDeOperador,
```

```mutacao
arquivo: apps/api/src/operacao/sessao.controller.ts
teste: apps/api/test/sessao-operador.int.test.ts › corpo com campo: ENTRADA_INVALIDA com no-store
-async sair(@Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpoDeOperador, @Req() requisicao: IncomingMessage, @Res({ passthrough: true }) resposta: ServerResponse): Promise<void> {
+async sair(@Body() _corpo: PedidoSemCorpoDeOperador, @Req() requisicao: IncomingMessage, @Res({ passthrough: true }) resposta: ServerResponse): Promise<void> {
```

```mutacao
arquivo: apps/api/src/operacao/sessao.controller.ts
teste: apps/api/test/sessao-operador.int.test.ts
-const esquemaSemCorpo = esquemaPedidoSemCorpoDeOperador.default({})
+const esquemaSemCorpo = esquemaPedidoSemCorpoDeOperador
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-escrita.int.test.ts › ordem fora da lista, página zero
-escolas(@Query(new ZodValidationPipe(esquemaConsultaDoPainel)) consulta: ConsultaDoPainel): Promise<RespostaEscolasDoPainel> {
+escolas(@Query() consulta: ConsultaDoPainel): Promise<RespostaEscolasDoPainel> {
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-escrita.int.test.ts › ordem fora da lista, página zero
-uso(@Query(new ZodValidationPipe(esquemaConsultaDoPainel)) consulta: ConsultaDoPainel): Promise<RespostaUsoDoPainel> {
+uso(@Query() consulta: ConsultaDoPainel): Promise<RespostaUsoDoPainel> {
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-escrita.int.test.ts › corpo com autor, ou qualquer campo a mais
-criarRede(@Body(new ZodValidationPipe(esquemaPedidoCriarRede)) pedido: PedidoCriarRede): Promise<RespostaCriadoNoPainel> {
+criarRede(@Body() pedido: PedidoCriarRede): Promise<RespostaCriadoNoPainel> {
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-escrita.int.test.ts › corpo com autor, ou qualquer campo a mais
-criarEscola(@Body(new ZodValidationPipe(esquemaPedidoCriarEscola)) pedido: PedidoCriarEscola): Promise<RespostaCriadoNoPainel> {
+criarEscola(@Body() pedido: PedidoCriarEscola): Promise<RespostaCriadoNoPainel> {
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-convite.int.test.ts › gerar numa escola que não existe
-@Param('id', IdPipe) escolaId: string,
+@Param('id') escolaId: string,
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-convite.int.test.ts › gerar com autor, escolaId ou qualquer campo a mais
-@Body(new ZodValidationPipe(esquemaPedidoConviteDaCoordenacao)) pedido: PedidoConviteDaCoordenacao,
+@Body() pedido: PedidoConviteDaCoordenacao,
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-convite.int.test.ts › gerar numa escola que não existe
-refazerConvite(@Param('id', IdPipe) conviteId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpoDeOperador): Promise<RespostaConviteDaCoordenacao> {
+refazerConvite(@Param('id') conviteId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpoDeOperador): Promise<RespostaConviteDaCoordenacao> {
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-convite.int.test.ts › gerar numa escola que não existe
-revogarConvite(@Param('id', IdPipe) conviteId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpoDeOperador): Promise<void> {
+revogarConvite(@Param('id') conviteId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpoDeOperador): Promise<void> {
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-convite.int.test.ts › gerar com autor, escolaId ou qualquer campo a mais
-refazerConvite(@Param('id', IdPipe) conviteId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpoDeOperador): Promise<RespostaConviteDaCoordenacao> {
+refazerConvite(@Param('id', IdPipe) conviteId: string, @Body() _corpo: PedidoSemCorpoDeOperador): Promise<RespostaConviteDaCoordenacao> {
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-convite.int.test.ts › gerar com autor, escolaId ou qualquer campo a mais
-revogarConvite(@Param('id', IdPipe) conviteId: string, @Body(new ZodValidationPipe(esquemaSemCorpo)) _corpo: PedidoSemCorpoDeOperador): Promise<void> {
+revogarConvite(@Param('id', IdPipe) conviteId: string, @Body() _corpo: PedidoSemCorpoDeOperador): Promise<void> {
```

```mutacao
arquivo: apps/api/src/operacao/painel.controller.ts
teste: apps/api/test/painel-convite.int.test.ts › gerar numa escola que não existe
-const esquemaSemCorpo = esquemaPedidoSemCorpoDeOperador.default({})
+const esquemaSemCorpo = esquemaPedidoSemCorpoDeOperador
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de operacao
-files: ['apps/api/src/{sessao,operacao}/**/*.controller.ts'],
+files: ['apps/api/src/sessao/**/*.controller.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de ia
-files: ['apps/api/src/{sessao,operacao}/**/*.controller.ts'],
+files: ['apps/api/src/**/*.controller.ts'],
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de sessao
-'no-restricted-syntax': ['error', ...SELETORES_DA_ENTRADA],
+'no-restricted-syntax': 'off',
```

```mutacao
arquivo: eslint.config.mjs
teste: tools/guardas/guardas.test.ts › no controller de ia
-'no-restricted-syntax': ['error', ...SELETORES_DA_ENTRADA, SELETOR_DA_REQUISICAO],
+'no-restricted-syntax': ['error', ...SELETORES_DA_ENTRADA],
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Alinhar o `.trim()` do `slug`: só o da query (`externa`) é cortado, o do caminho (`acesso-da-escola`) não | `TODO.md`, uma linha: muda comportamento da rota `/e/:slug`; o próprio revisor diz que é para quando a tela for revista |
| revisor-geral (1ª) | Exportar `esquemaPedidoSemCorpoDeOperador.default({})` de `packages/shared` no lugar das três cópias de `esquemaSemCorpo` (painel, sessão do operador e o `revogar` da 15.0) | `TODO.md`, uma linha: mexe no contrato compartilhado e em arquivo da 15.0, fora do escopo desta tarefa |
| infra-guardian (1ª) | Listar no segundo bloco do ESLint só os arquivos que precisam do `@Req()`, fechando a porta nos quatro controllers que não o usam | `TODO.md`, uma linha, apontando a 17.0: a divergência (6) já fixou que o segundo bloco vale em `sessao` e `operacao` inteiros, e a 17.0 generaliza o primeiro bloco; mudar a lista agora desfaz a decisão registrada |
| infra-guardian (1ª) | O `describe('ops:redefinir-mfa')` de `mfa.int.test.ts` depende de o `operador-teste` existir: cria o próprio operador | `TODO.md`, uma linha: o defeito é anterior ao diff (comando e setup não foram alterados), e o portão com banco limpo passou |
| test-engineer (1ª) | Os cenários de concorrência e de carga (os dois segundos fatores, os 35 logins) dependem de testes que a tarefa não alterou, e o portão não os roda | Recusada: a divergência (5) já declara isso e a regra 40 ("O portão") os põe na esteira |
| infra-guardian (2ª) | `valido()` de `borda-de-entrada-sessao.int.test.ts` sorteia `slug` e matrícula a cada chamada, e as duas tentativas válidas (IP saturado e outro IP) caem em contas diferentes; gerar a matrícula uma vez por caso | Recusada: o caso prova o balde do IP vindo antes do pipe e o rebaixamento no semáforo, e nenhum dos dois depende de as duas tentativas serem da mesma conta; o revisor diz que o teste prova o que deve |
| infra-guardian (2ª) | A asserção `>= 3` saiu e o `toEqual(esperadas)` ficou: o bloqueio de `body`, `query` e `params` depende de a fixture manter as três marcas | Recusada: é conferência do test-engineer, que aprovou a 2ª rodada, e o revisor-geral confirmou as marcas nas linhas 52 a 54 da fixture |
| revisor-geral (2ª) | `guardas.test.ts:96`: o `toEqual(esperadas)` vem da própria fixture; apagar as três marcas de `daRequisicao` deixa o teste verde. Uma contagem exata das marcas, como o `toBe(2)` do `@Req()`, fecharia | `TODO.md`, uma linha, apontando a 17.0, que generaliza o primeiro bloco do ESLint e mexe nesse teste |

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
| 2026-10-22 18:55:43 | 2026-10-22 18:56:25 | `tenancy-guardian` | 1 | APROVADO | a190bceaec148a37a |
| 2026-10-22 18:55:54 | 2026-10-22 18:57:41 | `revisor-geral` | 1 | APROVADO | a8e53c8e5964aa19c |
| 2026-10-22 18:55:47 | 2026-10-22 18:58:03 | `infra-guardian` | 1 | APROVADO | ae1c5daa6dff88b1c |
| 2026-10-22 18:55:51 | 2026-10-22 19:00:36 | `test-engineer` | 1 | REPROVADO | a39ad233bbd824880 |
| 2026-10-22 19:14:58 | 2026-10-22 19:15:14 | `tenancy-guardian` | 2 | APROVADO | a7f4fde83c4f101e3 |
| 2026-10-22 19:15:05 | 2026-10-22 19:15:21 | `infra-guardian` | 2 | APROVADO | a6be5627d7d9388ec |
| 2026-10-22 19:15:21 | 2026-10-22 19:15:52 | `revisor-geral` | 2 | APROVADO | aad9950568568c122 |
| 2026-10-22 19:15:14 | 2026-10-22 19:15:54 | `test-engineer` | 2 | APROVADO | a1aa68ed27a038a7f |
