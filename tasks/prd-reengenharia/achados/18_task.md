# Achados das revisões — `tasks/prd-reengenharia/18_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-22 13:54:16 · `tasks/prd-reengenharia/18_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. Os jobs carregam só `pedidoId` (um uuid) em `titular.montar-arquivo` e `titular.eliminar`, nada nas rotinas, e `cpuMs`, `falhar` e `efeito` no `sintetico`. A tarefa só aperta o que já existia: agora todo payload passa por um esquema estrito antes de ser gravado.

**Fora da tabela de dados do docs/lgpd.md:** nada. Não há migration nem coluna nova, então a tabela não precisa mudar.

**Autorização por objeto:** ok.
- A escola do job continua vindo só do contexto. Um `escolaId` posto no payload é recusado pelo `.strict()`, e isso tem teste em `apps/worker/test/execucao.int.test.ts` ("o escolaId de outra escola no payload…") e em `packages/shared/src/sistema/jobs-sinteticos.test.ts`.
- As recusas de escopo do repository ficam como estavam: job de escola sem escola, e `sistema.*` vindo de escola ou de rota anônima. A mutação declarada as cobre.
- Nenhuma rota nova.

**Logs:** limpos.
- `PedidoDeJobRecusado` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/fila/pedido-de-job-recusado.ts`) leva só o tipo e o motivo, os dois de lista fechada. Não leva `issues`, valor nem `cause`.
- O teste com sentinela prova que o valor recusado não aparece na mensagem, no `String`, no `JSON.stringify`, no `resumirErro` nem na primeira linha da pilha. A mutação `throw new Error(lidos.error.message)` está declarada.
- `job.enfileirado` e `agendamento.disparado` logam só tipo e ids.

**Auditoria:** presente. Nenhuma ação desta tarefa exige auditoria nova. A auditoria `pedido.registrado`, que já existia, continua na mesma transação do job. O teste em `apps/api/test/pedido-titular.int.test.ts` prova que, quando o job é recusado, não sobra pedido, job nem auditoria.

**Envio externo:** nenhum. A tarefa não envia nada a provedor de IA nem a serviço de terceiro.

**Seed/fixture:** sintético. Nos testes há só uuids gerados, uma sentinela aleatória e escolas sintéticas da bancada.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/definicoes-de-job.test.ts`, função `chavesPessoaisDe`: olha só as chaves do primeiro nível (`esquema.shape`). Os 8 esquemas de hoje não têm objeto aninhado, então isso basta. Quando um tipo da onda 3 trouxer objeto ou array de objetos no payload, a guarda precisa descer recursivamente; senão, um `{ alvo: { nomeDoAluno } }` passa por ela.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/worker/test/fila-de-teste.ts`, `BancadaDeFila.enfileirar`: grava direto pelo repository, sem passar pela definição. O desvio está declarado e a 19.0 o substitui pela definição injetável. Vale conferir na 19.0 que nenhum código fora de `test/` passou a usar `JobRegistroRepository.inserir` direto, porque esse caminho pula o esquema estrito.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/fila/pedido-de-job-recusado.ts`: a API devolve 500 para esse erro, pelo filtro geral que já existia. A mensagem não carrega dado, mas falta um teste HTTP que prove que o corpo do 500 não traz `message` nem `stack`. Ele pode entrar quando a 19.0 mexer nesse caminho.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 13:54:28 · `tasks/prd-reengenharia/18_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration. `job_registro` continua igual, com `escola_id` vindo do contexto e os checks `job_registro_escola_ou_sistema` e `job_registro_fila_valida`. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tools/guardas/definicoes-de-job.test.ts` compara esses dois checks com `DEFINICOES_DE_JOB`.

Queries verificadas:
- `JobRegistroRepository.inserir` e `inserirUmaVez` (`packages/nucleo/src/fila/job-registro.repository.ts:72-128`) não mudaram. A escola continua saindo de `contextoAtual()`. O `Enfileirador` passa à repository só tipo, fila, prioridade, dados e `naoUrgente`, sem `escolaId`.
- Os dados agora passam pelo esquema estrito do tipo antes de gravar. Com isso, um `escolaId` dentro do payload é recusado em vez de ser gravado. Nenhum ponto do código lê escola de `dados`.
- `POST /v1/sistema/jobs-sinteticos` continua com o corpo `.strict()` e sem `escolaId`. O corpo escolhe só a fila, entre as três do sintético, e o `naoUrgente`. O tipo é fixo no service.
- Os chamadores que migraram não recebem escola por argumento: `privacidade.service.ts:238`, `jobs-sinteticos.service.ts:30`, `agendamentos.ts:103`, `expurgar-dado-pessoal.ts:55` e `expurgo-da-escola.repository.ts:477`.
- Nenhum `@SemEscopo()` novo. Os ids dos payloads são UUID (`pedidoId: z.uuid()`). A camada rede não foi tocada.

Teste de isolamento: presente e efetivo. Conferi tirando a cláusula de cada um:
- `apps/worker/test/execucao.int.test.ts › o escolaId de outra escola no payload é recusado`: sem a recusa de chave a mais, o job seria gravado e o teste quebra. A mutação com `.strip()` cobre isso, e `definirJob` também recusa `z.object()` frouxo já ao carregar.
- `execucao.int.test.ts › job de escola sem escola no contexto…`: sem o `if` da linha 75, o banco recusaria pelo check com outra mensagem, e o `toThrow('job de escola sem escola no contexto')` quebra.
- `apps/api/test/pedido-titular.int.test.ts › o job que a definição recusa desfaz a transação`: um `escolaId` injetado no payload desfaz o pedido, o job e a auditoria. A contagem é filtrada pela escola.
- `apps/worker/test/eliminar-titular.int.test.ts › o payload inválido de enfileirarUmaVez…`: um `escolaId` no payload não grava nem ocupa a chave.

A mensagem de `PedidoDeJobRecusado` leva só o tipo e o motivo, sem valor nem `issues`, e a sentinela do teste prova isso.

Bloqueantes: nenhum.

Recomendações:
- `apps/worker/test/execucao.int.test.ts`: os testes novos de recusa usam `contar()`, que conta `job_registro` inteira e depende do `limparRegistro` do `beforeEach`. Filtrar por `escola_id = ESCOLA_A`, como já fazem `pedido-titular` e `eliminar-titular`, segue a regra 40 sobre banco compartilhado.
- `packages/shared/src/sistema/definicoes-de-job.ts`: o campo `escopo` da definição não é lido em tempo de execução. A repository decide pelo prefixo `sistema.`, e a igualdade entre os dois só é garantida pelo teste. Vale a 19.0 fazer o `Enfileirador` ou a repository ler o `escopo` da definição, para ficar uma fonte só.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 13:54:51 · `tasks/prd-reengenharia/18_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum
Recomendações:
- **Campo interno do zod.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/shared/src/sistema/definicoes-de-job.ts:79-80` usa `definicao.dados._zod.def.catchall` para saber em execução se o esquema é estrito. Esse campo é interno do zod e pode mudar numa versão menor sem aviso. Se o campo mudar de forma, o efeito mais provável é `definirJob` lançar ao carregar até numa definição certa, e não deixar passar um esquema frouxo. Mesmo assim, vale isolar a leitura numa função com nome, perto do teste `definicoes-de-job.test.ts › recusa, ao carregar`, ou registrar a dependência no `TODO.md` para revisar quando o zod for atualizado.
- **Tipo dos agendamentos escrito à mão.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/worker/src/agendamentos.ts:16` lista os quatro tipos à mão. Daria para derivar do registro, com `Extract<TipoDeJob, \`sistema.${string}\`>`. Assim, um tipo `sistema.*` novo não precisaria ser lembrado em dois lugares.
- **Esquema repetido no worker, para a 19.0.** `apps/worker/src/processadores/montar-arquivo.ts` e `eliminar-titular.ts` ainda têm o próprio `esquemaDoJob = z.strictObject({ pedidoId: z.uuid() })`, igual ao `esquemaDoPedido` do registro. Está certo deixar para a 19.0, que faz o worker validar pela definição. Ela precisa apagar essas duas cópias, e não só passar a usar o registro.
- **Bancada de teste sem tipo, para a 19.0.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/worker/test/fila-de-teste.ts:145` (`PedidoDaBancada.tipo?: string`) aceita qualquer texto como tipo de job, e isso está registrado nas divergências. Quando a 19.0 trouxer a definição injetável, esse campo deve voltar a ser tipado, para os testes do despachante e do worker não seguirem passando por fora do registro.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 13:55:59 · `tasks/prd-reengenharia/18_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Caminho feliz: os 8 tipos gravam a mesma fila, `naoUrgente`, prioridade e escopo de antes. O sintético grava a fila e o `naoUrgente` que vêm do corpo do `POST`.
- Casos de borda:
  - payload com chave a mais
  - campo obrigatório faltando
  - `pedidoId` que não é uuid
  - fila fora das `filas` do tipo
  - `naoUrgente` escolhido num tipo que o fixa
  - `naoUrgente` faltando no sintético
- Permissão: job de escola sem escola no contexto e job `sistema.*` vindo de escola ou de rota anônima são recusados.
- Isolamento: `escolaId` de outra escola no payload é recusado, porque a escola vem do contexto.
- Concorrência (regra 80.7): duas `enfileirarUmaVez` com a mesma chave ao mesmo tempo dão uma linha só.
- Atomicidade: a recusa desfaz a transação de quem pediu, e o payload inválido não ocupa a chave de idempotência.
- LGPD (regra 20.9): a recusa não leva o valor nem as `issues`. Payload só com id, e o detector de chave pessoal olha palavra por palavra.
- Compilação: tipo inexistente, `dados` de outro tipo e definição frouxa ou sem `prazoMs` não compilam.
- Fonte única: os 8 tipos vêm do `@educa/shared`, e o worker não declara `TIPO_*`.

**Cobertos:** todas as 19 linhas da tabela têm teste com nome, e nenhum item juntado por vírgula ficou sem teste.
- **`apps/worker/test/execucao.int.test.ts`:** caracterização dos 8 tipos (o sintético nas três filas). Recusas de fila, de `naoUrgente` fixo e ausente, de chave a mais, de obrigatório ausente, de `pedidoId: 'abc'` e de `escolaId` de outra escola, todas com motivo conferido e com a contagem zero de linhas. Também a recusa sem sentinela e a recusa por escopo do contexto.
- **`apps/api/test/jobs-sinteticos.int.test.ts › o corpo escolhe a fila e o não urgente`:** as combinações invertem o `naoUrgente` em relação ao padrão, então o teste distingue o valor do corpo do valor fixo.
- **`apps/api/test/pedido-titular.int.test.ts › o job que a definição recusa desfaz a transação`:** não sobra pedido, job nem auditoria. Depois, o mesmo pedido sem o defeito entra.
- **`apps/worker/test/eliminar-titular.int.test.ts › o payload inválido de enfileirarUmaVez`:** a chave fica livre e o pedido válido entra depois.
- **`apps/worker/test/expurgo-da-escola.int.test.ts › [P] a mesma chave ao mesmo tempo`:** é concorrência de verdade, com `GatilhoDeParada` segurando a primeira transação. Não são duas chamadas em sequência.
- **Testes de unidade:** `packages/shared/src/sistema/definicoes-de-job.test.ts`, `jobs-sinteticos.test.ts` e `tools/guardas/definicoes-de-job.test.ts`. Rodei os três: 21 de 21 verdes.
- **Casos de "não compila":** são `@ts-expect-error`. Conferi que o `tsc` do portão os enxerga: `packages/shared/tsconfig.json` inclui `src`, `apps/worker` e `apps/api` incluem `test`, e cada pacote tem o seu script `typecheck`.

Conferi as 22 mutações contra o `git diff`. Toda cláusula nova tem bloco, e cada bloco tem um cenário que chega à cláusula. Não há `.skip` nem teste comentado. A `BancadaDeFila.enfileirar`, que grava sem passar pela definição, está declarada nas divergências e só serve aos testes do despachante e do worker. As recusas são provadas com o `Enfileirador` real.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Mutação que fica vermelha na asserção errada.** O bloco `throw new Error(lidos.error.message)` (18_task.md:139-145) fica vermelho no `instanceof` do helper `recusa`, em `execucao.int.test.ts:278-285`. Não chega às asserções da sentinela. Se essas linhas fossem apagadas, nenhuma mutação ficaria vermelha. Proposta: um bloco que mantém a classe e vaza o detalhe, por exemplo `throw Object.assign(new PedidoDeJobRecusado(tipo, MotivoDaRecusaDoJob.DADOS_INVALIDOS), { cause: lidos.error })`. Esse fica vermelho em `Object.keys`, `cause` e `JSON.stringify`.
2. **O `async` de `enfileirar` e `enfileirarUmaVez` não tem teste.** Ele está em `packages/nucleo/src/fila/enfileirador.ts:35,45`, e o comentário promete que "a recusa é sempre uma promessa rejeitada, nunca uma exceção síncrona". O bloco do `.catch(() => undefined)` em `privacidade.service.ts` depende disso. Proposta: um caso que confere que `enfileirar(...)` inválido não lança na chamada e rejeita depois.
3. **A gravação de `lidos.data` no lugar do payload original não tem caso que a distinga.** Fica em `enfileirador.ts:64`. Hoje não há `default` nem `transform` em nenhum esquema. Vale um caso quando o primeiro esquema com `default` entrar.
4. **A mutação do `agendamentos.ts` fica vermelha por `TypeError` no desestruturar.** O teste é `uso.int.test.ts:596`. Com o `if` removido, o `const { tipo } = agendamento` lança antes da rejeição esperada. Fica vermelho, mas pelo erro de execução, e não pela mensagem `'agendamento desconhecido'`. Não muda o veredito.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-22 14:06:51 · `tasks/prd-reengenharia/18_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration nesta rodada. `job_registro` só aparece em teste, na contagem.

Queries verificadas: o diff não traz query nova nem query alterada.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/worker/src/agendamentos.ts:17`: `TipoAgendado` agora é `Extract<TipoDeJob, \`sistema.${string}\`>`. O prefixo `sistema.` seleciona os mesmos quatro tipos de antes (`definicoes-de-job.ts:17-20`) e casa com o check `job_registro_escola_ou_sistema`. A mudança só afeta o tipo, então o escopo continua igual. Ela também amarra o agendamento sem escola ao prefixo `sistema.`, o que fecha a porta para um tipo com escola entrar nessa rotina sem `escolaId`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/shared/src/sistema/definicoes-de-job.ts:79-90`: `esquemaRecusaChaveAMais` só tira a mesma verificação para uma função com nome. O esquema estrito continua obrigatório, e isso mantém valendo a recusa de `escolaId` no payload, que o caso "o escolaId de outra escola no payload é recusado" de `execucao.int.test.ts` prova.

Teste de isolamento: presente e efetivo. O caso de `escolaId` de outra escola no payload não mudou e continua quebrando se o esquema deixar de ser estrito. O caso novo (`execucao.int.test.ts:400-416`) prova outra coisa: que a recusa chega como promessa rejeitada. Ele não é teste de isolamento e não pesa nesta auditoria.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/worker/test/execucao.int.test.ts:275`: `contar()` soma `job_registro` inteira, sem filtrar pelo que o teste criou. O padrão já existia antes desta rodada e hoje passa porque a fila do teste é própria. Se a tabela passar a ser compartilhada entre execuções, filtre por `escola_id in (ESCOLA_A, ESCOLA_B)` (regra 40, banco com milhares de escolas).

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-22 14:07:01 · `tasks/prd-reengenharia/18_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. As mudanças desta rodada são de tipo, de organização de função, um caso de teste e linhas no TODO.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Esta rodada não tem rota nem repository.

Logs: limpos. O caso novo usa `pedidoId: 'abc'`, um id sintético e inválido, e não registra nada no log. `PedidoDeJobRecusado` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/fila/pedido-de-job-recusado.ts`) continua levando só o tipo e o motivo, sem payload nem `issues` do zod.

Auditoria: não se aplica. Nenhuma ação desta rodada pede auditoria.

Envio externo: nenhum.

Seed/fixture: sintético. São ids fixos de teste e `ESCOLA_A`.

O que conferi no diff:
- **`apps/worker/src/agendamentos.ts:17`**: `Extract<TipoDeJob, \`sistema.${string}\`>` dá exatamente os quatro tipos de antes (`consolidar-uso`, `expurgar-acesso`, `expurgar-jobs`, `expurgar-dado-pessoal`, em `packages/shared/src/sistema/definicoes-de-job.ts:17-20`). Com isso, nenhum job com escola nem com dados entra na rotina noturna. Um tipo `sistema.*` novo entraria nesse tipo sozinho, mas vale o mesmo critério do check `job_registro_escola_ou_sistema`, então não abre brecha de dado pessoal.
- **`packages/shared/src/sistema/definicoes-de-job.ts:79-90`**: a mudança só leva a regra para outra função. O objeto estrito continua sendo exigido ao carregar, e a mesma regra continua impedindo chave a mais no payload, inclusive `escolaId` ou nome.
- **`apps/worker/test/execucao.int.test.ts:400-416`**: o caso novo mostra que a recusa chega como promessa rejeitada e que nada é gravado (`contar()` igual a 0). Ele não traz dado pessoal.
- **`TODO.md`**: as duas recomendações minhas da 1ª rodada estão lá, com dono e momento: a guarda de chave pessoal só no primeiro nível e o 500 de `PedidoDeJobRecusado` sem teste HTTP.

Bloqueantes: nenhum.

Recomendações:
- Continuam valendo as duas da 1ª rodada, já no `TODO.md`: a guarda recursiva em `tools/guardas/definicoes-de-job.test.ts` deve entrar antes do primeiro payload com objeto aninhado, e falta o caso de integração do 500 sem `message` nem `stack` para `PedidoDeJobRecusado`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 14:07:18 · `tasks/prd-reengenharia/18_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Recomendações:
- As três linhas novas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/TODO.md:1641-1649` saíram sem a caixa `- [ ]`. As linhas vizinhas da mesma seção têm a caixa e entram na contagem do que falta resolver. Basta acrescentar a caixa para seguir o mesmo formato.
- O novo caso em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/worker/test/execucao.int.test.ts:400-416` usa `pedido ?? Promise.resolve()` quando a chamada não preenche `pedido`. Se a chamada lançar na hora, quem falha é o `expect(...).not.toThrow()`, e a falha aparece certa. Mesmo assim, o `?? Promise.resolve()` faria o `recusa` falhar com uma mensagem que não diz nada. Fica mais claro ler o resultado direto: `const pedido = chamar()` dentro de `expect(() => ...)`, ou guardar com `!`.

O que conferi nesta rodada:
- `TipoAgendado` é `Extract<TipoDeJob, \`sistema.${string}\`>` e cobre os mesmos quatro tipos `sistema.*` de `DEFINICOES_DE_JOB` que a união escrita à mão cobria.
- `esquemaRecusaChaveAMais` mantém a regra e o `TypeError`. As duas mutações de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/shared/src/sistema/definicoes-de-job.ts` apontam para o teste "recusa, ao carregar", que existe.
- As duas mutações que tiram o `async` de `enfileirar` e `enfileirarUmaVez` fazem a recusa virar exceção na hora da chamada. O novo caso fica vermelho com isso e prova o que o comentário do `Enfileirador` promete.
- As recomendações da rodada anterior têm destino na tabela "Recomendações sem aplicar" do documento: a 19.2 e a 19.3, linhas já escritas no `TODO.md`, ou recusa com motivo.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 14:07:32 · `tasks/prd-reengenharia/18_task.md`

VEREDITO: APROVADO

**Cenários exigidos (2ª rodada, só o que o diff mudou):**
- A recusa do `Enfileirador` precisa chegar como promessa rejeitada nos dois caminhos, `enfileirar` e `enfileirarUmaVez`. Uma exceção lançada na hora da chamada não serve.
- Quem engole a recusa com `.catch` precisa engoli-la de fato, e nenhuma linha pode ser gravada.
- A troca de `TipoAgendado` mexe só no tipo e precisa continuar com os mesmos quatro tipos de antes.
- A extração de `esquemaRecusaChaveAMais` não pode mudar a regra, que o bloco de mutação ainda precisa provar.

**Cobertos:**
- **O caso novo, em `apps/worker/test/execucao.int.test.ts:400`.** Roda para os dois métodos e confere três coisas: `not.toThrow()` na chamada, a rejeição com `PedidoDeJobRecusado` e motivo `DADOS_INVALIDOS`, e `.catch` resolvendo `undefined`. No fim, `contar()` dá 0. Rodei sozinho e passou (1 passed).
- **Os dois blocos novos de mutação**, que tiram o `async` de `enfileirar` e o de `enfileirarUmaVez` em `packages/nucleo/src/fila/enfileirador.ts:35` e `:45`. Ficam vermelhos pelo motivo certo: sem o `async`, o `throw` de `linhaDoPedido` acontece na chamada, e o `expect(...).not.toThrow()` falha antes de o banco ser tocado. Tirar o `async` não quebra a compilação, porque o retorno do repository já é `Promise`, então o vermelho vem do teste e não do `tsc`.
- **O bloco de `cause`**, que mantém a classe `PedidoDeJobRecusado` e vaza `lidos.error`. Ele aponta para "a recusa não leva o valor", e com isso a correção da 1ª rodada foi aplicada.
- **`esquemaRecusaChaveAMais`, em `packages/shared/src/sistema/definicoes-de-job.ts:86`.** Tem dois blocos: um tira a chamada em `definirJob` e o outro troca o retorno por `return true`. Os dois apontam para `definicoes-de-job.test.ts › recusa, ao carregar`, que passou com 12 de 12.
- **`TipoAgendado = Extract<TipoDeJob, \`sistema.${string}\`>`, em `apps/worker/src/agendamentos.ts:17`.** Dá exatamente os quatro tipos `sistema.*` de `definicoes-de-job.ts:17-20`. O sintético (`'sintetico'`) não tem o prefixo e fica fora, como antes. Como só o tipo mudou, não há cláusula de execução nova pedindo bloco.
- **As recomendações da 1ª rodada.** A do `lidos.data` foi para o `TODO.md` com a mutação já escrita. A do `TypeError` foi recusada com motivo registrado na tabela "Recomendações sem aplicar", e isso não muda o veredito.

**Bloqueantes:** nenhum.

**Recomendações:**
- As três linhas novas do `TODO.md` (1641 a 1649) não têm a caixa `- [ ]` que as linhas vizinhas da mesma seção têm. Sem ela, quem filtra o que está pendente por `- [ ]` não as encontra.
- No caso novo, `chamar()` roda duas vezes por método dentro da mesma transação. Hoje isso não pesa, porque a recusa acontece antes de qualquer consulta ao banco. Se um dia a validação passar a ler o banco antes de recusar, o caso ficaria frágil. Um comentário de uma linha dizendo isso evita a surpresa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/worker/test/execucao.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/fila/enfileirador.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/shared/src/sistema/definicoes-de-job.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/apps/worker/src/agendamentos.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/18_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/TODO.md
