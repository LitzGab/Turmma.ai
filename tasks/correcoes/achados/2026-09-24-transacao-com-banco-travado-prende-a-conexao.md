# Achados das revisões — `tasks/correcoes/2026-09-24-transacao-com-banco-travado-prende-a-conexao.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-24 20:47:55 · `tasks/correcoes/2026-09-24-transacao-com-banco-travado-prende-a-conexao.md`

VEREDITO: REPROVADO

Cenários exigidos:
1. O `begin` do Drizzle estoura o prazo com o Postgres pausado, e a conexão não pode ficar presa.
2. Uma consulta no meio da transação estoura e o `rollback` estoura também. A transação não pode voltar aberta ao pool.
3. Erro de consulta que não é de conexão (unicidade, `statement_timeout`, sintaxe) mantém a conexão, e o `rollback` continua com o Drizzle.
4. O `release` pode ser chamado duas vezes sem erro: pelo embrulho da conexão e depois pelo `finally` do Drizzle ou pelo `catch` do `OuvinteDeJobs`.
5. A troca da `query` não se empilha quando a mesma conexão é emprestada de novo.
6. A forma com callback do `connect` passa direto.
7. Os testes são determinísticos.

Cobertos:
- **1:** `pool.int.test.ts:166-181`. A asserção `totalCount - idleCount = 0` na linha 174 quebra sem a correção (a conexão fica emprestada) e passa com ela. A conexão ociosa é criada antes, então é o `begin` que estoura, sem corrida.
- **2:** `pool.int.test.ts:183-213`. A escrita da requisição que falhou não é confirmada pela seguinte. Pelo relato, o vermelho de antes era exatamente essa escrita confirmada.
- **3, de forma indireta:** o `pool.query` agora pega a conexão pelo `connect` embrulhado (`pool.ts:91`). Se o embrulho descartasse a conexão em qualquer erro, o teste de `:69` quebraria na primeira troca de pid.
- **7:** a pausa cai num ponto fixo, não numa corrida. Rodei o arquivo 3 vezes e deu `8 passed` nas três, em cerca de 12,8 s cada. O `drop table` de `:211` depende de o backend antigo já ter saído (ele ainda segura o lock da tabela, e o `statement_timeout` é de 300 ms). Na prática ele sai em milissegundos depois do `unpause`, bem antes das várias idas e voltas que vêm antes do `drop`. Risco baixo.

Bloqueantes:

1. **O `release` idempotente não tem teste que o prove.**
   - Onde: `packages/nucleo/src/db/pool.ts:148`, e a asserção frouxa em `packages/nucleo/src/db/pool.int.test.ts:199`.
   - O que está errado: se o `if (devolvida) return` for removido, os 8 testes continuam verdes. No teste 2 o `rollback` falha na hora, o embrulho chama o `release` do `pg-pool` pela segunda vez e ele lança `Release called on client which has already been released to the pool.` O `finally` do Drizzle lança de novo. A transação continua rejeitando, e o `.rejects.toThrow()` aceita qualquer erro.
   - Efeito em produção: quem chama recebe o erro de liberação dupla no lugar do erro de conexão. E em `packages/nucleo/src/fila/ouvinte-de-jobs.ts:62-63`, o `release(true)` depois de um `listen` que falhou por conexão lança dentro do `catch`. Com isso o `abrir()` rejeita, e isso quebra o "falha é silenciosa" que a classe promete.
   - Correção exigida: um teste que fique vermelho sem a linha 148. Por exemplo, derrubar a conexão emprestada com um erro de conexão e depois exigir `expect(() => conexao.release()).not.toThrow()`. Ou, no teste 2, exigir que a rejeição não seja a de liberação dupla, em vez do `toThrow()` genérico. Confirme o vermelho removendo a linha.

2. **A proteção contra o empilhamento da `query` não tem teste que a prove.**
   - Onde: `packages/nucleo/src/db/pool.ts:152-153` (o `WeakMap` `consultaDoCliente`).
   - O que está errado: sem o `WeakMap`, cada empréstimo embrulha o embrulho do empréstimo anterior. Como todo `pool.query` passa pelo `connect` embrulhado, cada consulta acrescenta uma camada na mesma conexão. Com a manhã de segunda reaproveitando as mesmas dez conexões, a pilha estoura em pouco tempo e toda consulta vira `RangeError`. Nenhum dos 8 testes percebe: o de `:69` faz só uns oito empréstimos.
   - Correção exigida: um teste que fique vermelho sem as linhas 152-153. Por exemplo, num pool de uma conexão, emprestar e devolver a mesma conexão dezenas de milhares de vezes (um laço de `connect`/`release` sem consulta é barato) e depois exigir que uma consulta responda. Confirme o vermelho removendo o `WeakMap`.

Recomendações:
- A forma com callback do `connect` (`pool.ts:143`) não tem teste. Hoje nenhum código do projeto usa `pool.query` com callback ou em stream, e só essas formas passam pelo `connect(cb)` interno do `pg-pool`. Um teste curto de `pool.query('select 1', cb)` que responde fecharia isso: sem o desvio, a chamada fica pendurada.
- Transação do Drizzle com erro de consulta (23505 dentro de `banco.transaction`): hoje isso só está coberto de forma indireta, pelo caminho do `pool.query`. Um teste que exija o mesmo pid depois e nenhuma linha gravada deixa a intenção explícita no ponto da transação.
- O `.rejects.toThrow()` de `:173` também aceita qualquer erro. A prova está nas asserções seguintes, então não bloqueia, mas vale fixar o tipo do erro.
- O teste 1 não entra em `abertos`, de propósito, e isso está comentado. Se a linha 174 falhar, o pool fica sem `end()`. É aceitável no caso vermelho.
- Anotado no documento, fora desta correção: a conexão emprestada fica sem ouvinte de `'error'` entre duas consultas da transação. Isso merece um `/corrigir` próprio antes do staging.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/fila/ouvinte-de-jobs.ts` (quem também chama `pool.connect()` e é afetado pela correção)
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-24-transacao-com-banco-travado-prende-a-conexao.md`

## test-engineer · 2ª rodada · APROVADO · 2026-09-24 21:24:13 · `tasks/correcoes/2026-09-24-transacao-com-banco-travado-prende-a-conexao.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caso 1:** o `begin` que estoura com o Postgres pausado. A conexão não fica presa e o `end()` termina.
- **Caso 2:** a consulta do meio que estoura. A transação aberta não volta ao pool, e a escrita da requisição que falhou não é confirmada pela seguinte.
- **Liberação dupla:** o `release` repetido não lança. É o `finally` do Drizzle e o `release` do `consultaQueDevolveAConexao` depois do descarte.
- **Empréstimos repetidos:** a troca da `query` não se empilha a cada empréstimo da mesma conexão.
- **Erro de consulta na transação** (unicidade): a conexão não é descartada, o `rollback` é do Drizzle e a conexão volta limpa.
- **Forma com callback** do `connect`, a que o `pg.Pool#query` usa por dentro.
- **Isolamento:** não se aplica. A correção não toca repository, query de domínio nem dado de escola.

**Cobertos:**
- **Correção exigida 1 (`release` idempotente): feita.** O novo teste `descartada no erro de conexão, aceita o release…` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.int.test.ts` chama `release()` e `release(true)` depois do 57P01, com `not.toThrow()`. Sem o `if (devolvida) return`, o `_releaseOnce` do pg-pool lança "already been released", e o teste fica vermelho. O caso 2 passou a exigir `.rejects.not.toThrow(/already been released/)`, o que fecha a brecha do `.rejects.toThrow()` genérico. As mutações registradas no documento da correção (3 vermelhos) batem com essa leitura.
- **Correção exigida 2 (`WeakMap`): feita.** O teste dos 50.000 empréstimos confere que o pid é o mesmo. Isso prova que a mesma conexão foi reemprestada, e o pool tem uma conexão só. Sem o `WeakMap`, a última `query` seria 50.000 chamadas síncronas encadeadas e estouraria a pilha. O teste falharia sem a regra.
- **Erro de unicidade na transação do Drizzle:** o teste confere o mesmo pid, `total` 0 e nenhum descarte. Ele falharia se o `ehErroDeConexao` tratasse o 23505 como erro de conexão.
- **Callback no `connect`:** sem o desvio da linha 143, o `pg.Pool#query` com callback nunca chama o callback e o teste pendura. Isso prova o desvio.
- **Rodei o arquivo** (`npx vitest run --project integracao packages/nucleo/src/db/pool.int.test.ts`): 12 passed (12).
- Nenhum `.skip`, nenhum teste comentado, nenhum mock escondendo a regra. Os testes usam Postgres real, pausado e com a sessão encerrada no servidor, e nenhum chama provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Desvio do callback dentro de `conexao.query` sem teste** (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.ts:157`). O teste `a forma com callback…` usa um pool novo, então o `pg.Pool#query` recebe um cliente que nunca foi emprestado pela forma com promessa, e a `query` dele não está trocada. O caminho que precisa da linha 157 é outro: um cliente já emprestado com promessa e depois emprestado por callback, porque a `query` trocada fica nele. Sem a linha, esse caminho dá `undefined.catch`. Hoje nenhum código do projeto usa callback nem Submittable, então não bloqueia. Mesmo assim, basta fazer um `pool.query('select 1')` com promessa antes da chamada com callback no mesmo teste para que ele cubra a linha.
2. **O teste do `release` idempotente não prova o descarte por conta própria.** Depois do 57P01, o pg-pool provavelmente removeria a conexão de qualquer jeito, porque ela não aceita mais consultas. Quem prova o descarte no erro de conexão são os casos 1 e 2, e isso basta. Só vale não apresentar esse teste como prova do descarte.
3. **Queda de socket entre duas consultas da transação.** A conexão emprestada fica sem ouvinte de `'error'` nesse intervalo. Isso já está anotado no documento como fora da correção. Quando o `/corrigir` próprio vier, ele precisa de um teste que derrube a sessão entre dois `tx.execute`.

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-24 21:28:04 · `tasks/correcoes/2026-09-24-transacao-com-banco-travado-prende-a-conexao.md`

VEREDITO: REPROVADO
Caminho quente tocado: fila | deploy (o pool de API, despachante e worker, em toda transação do Drizzle e no `LISTEN` do `OuvinteDeJobs`)
Rate limit: não se aplica
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (a conexão presa aparece em `packages/nucleo/src/telemetria/metricas.ts:172`, total menos ociosas)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.ts:140-165` (`conexaoQueSaiNoErroDeConexao`). Ao emprestar a conexão, o `pg-pool` tira o ouvinte de `'error'` dela (`_acquireClient`, `client.removeListener('error', idleListener)`), e o wrapper novo não põe outro no lugar. O `pg` emite `'error'` em toda queda de socket, com ou sem consulta em andamento (`_handleErrorEvent`). O documento da correção diz que o caso só acontece entre consultas e que não foi reproduzido. Reproduzi os dois casos com o `criarPool` desta correção, num script do scratchpad, contra o Postgres de teste, numa conexão de `pool.connect()` com `begin` aberto:
  - `pg_terminate_backend` entre duas consultas: `UNCAUGHT terminating connection due to administrator command` e `UNCAUGHT Connection terminated unexpectedly`;
  - socket resetado (`ECONNRESET`) no meio de uma consulta: `UNCAUGHT read ECONNRESET`.
  
  O `logger.ts:144` trata `uncaughtException` e encerra o processo. Então um failover do Postgres gerenciado (D26), ou um corte de rede às 10h, derruba toda instância de API ou worker que tiver uma transação aberta naquela hora. O `pool.query` já se protege disso (`consultaQueDevolveAConexao`, linhas 92-98). A transação é o mesmo empréstimo que esta correção passou a controlar, e a correção pede duas linhas na mesma função.
  
  Correção exigida:
  - no `conectar`, registrar um ouvinte de `'error'` na conexão emprestada que chame `devolver(erro)`;
  - no `devolver`, tirar esse ouvinte antes do `devolverAoPool`, para ele não se acumular a cada empréstimo;
  - em `pool.int.test.ts`, um teste que prenda `process.on('uncaughtException')` como faz `apps/api/test/prontidao.int.test.ts:85`, com dois casos numa transação: `pg_terminate_backend` entre duas consultas e `stream.destroy` com `ECONNRESET` no meio de uma consulta. O teste precisa provar que o processo não recebe a exceção, que a conexão é descartada e que o pool volta a responder. Removido o ouvinte, o teste tem de ficar vermelho;
  - reescrever o parágrafo "Fora desta correção" do documento, que hoje descreve o risco errado.

Recomendações:
- O critério de descarte é o mesmo `ehErroDeConexao` do `pool.query`, então não há descarte em rajada de conexão boa: unicidade (23505) e `statement_timeout` (57014) passam direto. Duas bordas ficam de fora do teste:
  - o 25P02 dentro de uma transação que o código de aplicação capturou e na qual seguiu consultando passa a descartar a conexão;
  - um erro que não vem do Postgres, como a falha ao serializar um valor, também descarta.
  
  Nos dois casos, o `rollback` do Drizzle falha com `Client was closed and is not queryable`, e esse erro é que chega ao filtro e ao log no lugar do original. Antes o `rollback` também mascarava o erro, com o do timeout. Não bloqueia, mas vale anotar no documento que o erro no log de uma transação descartada é o do `rollback`.
- O `OuvinteDeJobs` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/fila/ouvinte-de-jobs.ts:59-64`) funciona bem com a mudança. Quando o `listen` falha com erro de conexão, o wrapper devolve a conexão com o erro e o `release(true)` seguinte não faz nada. Antes esse caminho só tinha uma liberação, e continua tendo uma. A forma com callback do `pg.Pool#query` passa direto pelo desvio da linha 143. O `query` de um empréstimo anterior que fica no cliente é inofensivo, porque o `devolver` dele já está marcado como devolvido.
- O custo por empréstimo é aceitável no caminho quente: um `bind`, um closure, um get e um set no `WeakMap` e uma promessa a mais por consulta, bem abaixo da ida e volta ao banco.
- Considerar um contador `banco.conexao_descartada{causa}`. Hoje o descarte por erro de conexão não aparece em métrica nenhuma, só a queda do total de conexões em uso.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-24 22:07:12 · `tasks/correcoes/2026-09-24-transacao-com-banco-travado-prende-a-conexao.md`

VEREDITO: REPROVADO

**Cenários exigidos pela 1ª rodada do `infra-guardian`:**
- ouvinte de `'error'` no `conectar` que devolve a conexão com o erro;
- o ouvinte sai no `devolver`, antes do `release` do pool;
- teste que prende `uncaughtException` com a sessão encerrada entre duas consultas da transação;
- teste que prende `uncaughtException` com `ECONNRESET` no meio de uma consulta;
- os dois testes provam três coisas: nenhuma exceção no processo, conexão descartada e pool respondendo;
- os dois testes ficam vermelhos sem o ouvinte.

**Cobertos:**
- **O ouvinte existe e está no lugar certo.** Fica em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.ts:148-158`. Ele é retirado antes de `devolverAoPool`, e o `_release` do `pg-pool` põe o `idleListener` de volta logo na primeira linha. Por isso o segundo `'error'` do `pg` (o do `end` depois do término da sessão) cai no ouvinte do pool, e não sobe ao processo.
- **Sessão encerrada entre duas consultas** (`pool.int.test.ts:280`). Sem o ouvinte o teste falha de dois jeitos: o `expect.poll` dos descartes esgota antes da consulta, e `excecoes` deixa de vir vazio.
- **Socket resetado com `ECONNRESET`** (`pool.int.test.ts:299`). Sem o ouvinte, a consulta ainda descarta a conexão pelo caminho `ehErroDeConexao`, mas a asserção `excecoes` toEqual [] falha. As duas asserções pesam.
- **O ouvinte de `uncaughtException` é tirado no `onTestFinished`.** Nenhum `.skip` ou `.only`, nenhum mock do que é nosso: o Postgres é real, a queda vem de `pg_terminate_backend` e de `stream.destroy`.
- **Rodei o arquivo e passou:** `npx vitest run --project integracao packages/nucleo/src/db/pool.int.test.ts` dá `14 passed (14)`. O resultado da mutação registrado no documento (`2 failed | 12 passed`) bate com a minha leitura dos dois testes.

**Bloqueantes:**
1. **A retirada do ouvinte (`pool.ts:155`, `conexao.off('error', aoErroDaConexao)`) está sem teste.** Ela faz parte da correção exigida, e nenhum teste falha se for apagada.
   - **O que está errado:** sem essa linha, cada empréstimo deixa uma closure a mais no `'error'` do cliente. O `pg-pool` reusa o mesmo cliente, então os ouvintes crescem sem limite no caminho quente (regra 80). O teste da linha 316 (`emprestada e devolvida dezenas de milhares de vezes…`) passa por 50.000 empréstimos e continua verde: o acúmulo só gera um `MaxListenersExceededWarning`, e aviso não reprova a suíte.
   - **Correção exigida:** no teste da linha 316, depois do laço e com a conexão emprestada de novo, afirmar `expect(conexao.listenerCount('error')).toBe(1)`. Na conexão emprestada fica só o ouvinte deste empréstimo, porque o pool tira o dele. Depois, rodar a mutação sem o `off` da linha 155, confirmar vermelho e registrar o resultado no documento da correção.

**Recomendações:**
- No teste da linha 280, fazer o `expect(excecoes).toEqual([])` depois de o pool recolocar o ouvinte e de chegar o `'end'` da sessão. Um jeito é esperar o `'end'` da conexão antes dessa asserção. Hoje isso já acontece por causa das esperas que vêm antes; ficaria explícito que o segundo `'error'` também não sobe.
- O cast em `pool.int.test.ts:304` (`conexao as pg.PoolClient & { connection: … }`) depende de um campo interno do `pg`. Vale uma linha de comentário dizendo que é interno e que uma troca de versão do `pg` pode quebrá-lo.

## test-engineer · 4ª rodada · APROVADO · 2026-09-24 22:38:13 · `tasks/correcoes/2026-09-24-transacao-com-banco-travado-prende-a-conexao.md`

VEREDITO: APROVADO

**Cenários exigidos:** A única correção desta rodada vem da 3ª: provar que o `devolver` tira o ouvinte de 'error'. A prova é a asserção `conexao.listenerCount('error') === 1` com a conexão emprestada de novo, depois de 50.000 empréstimos. A mutação sem o `off` precisa sair vermelha e ficar registrada no documento.

**Cobertos:**
- **A asserção existe e está no lugar certo.** Fica em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.int.test.ts:325`, no teste dos 50.000 empréstimos, antes do `release` final.
- **O valor esperado 1 bate com o `pg-pool` instalado (3.14.0).** No empréstimo, o `_acquireClient` tira o `idleListener` (`node_modules/pg-pool/index.js:344`). Na devolução, o `_release` o põe de volta (linha 385). Com a conexão emprestada, sobra só o ouvinte deste empréstimo (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.ts:158`).
- **O teste falharia sem a regra.** Sem o `off` em `pool.ts:155`, cada empréstimo deixaria um ouvinte no cliente. O `expected 50002 to be 1` registrado confere com a conta: o `pool.query` inicial, mais os 50.000 do laço, mais o empréstimo final. Não rodei a mutação porque não edito arquivo. A mecânica do `pg-pool` confirma o que o documento diz.
- **O mesmo `off` vale nos três caminhos de devolução.** Ele está dentro do `devolver`, que é o caminho único para o `release` explícito, para o 'error' da conexão e para o erro de conexão no `catch` da `query`.
- **A mutação está registrada no documento.** Fica em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-24-transacao-com-banco-travado-prende-a-conexao.md:87-90`, seção "Teste que reproduz": vermelho sem o `off`, `14 passed (14)` com a correção inteira.
- **Rodei o arquivo isolado e passou.** `npx vitest run --project integracao packages/nucleo/src/db/pool.int.test.ts` deu `14 passed (14)`.
- **A recomendação da rodada anterior foi atendida.** O cast de `connection` ganhou um comentário dizendo que é interno do `pg` 8.x (`pool.int.test.ts:303`).
- **O diff não traz `.skip`, teste comentado, mock sobre a regra nem `any`.** O `pool.ts` está igual ao da 3ª rodada, como o prompt diz.

**Bloqueantes:** nenhum.

**Recomendações:**
- Uma versão menor do `pg-pool` pode mudar onde ele tira e põe o `idleListener`. Aí o `toBe(1)` quebraria por motivo que não é nosso. O comentário da linha 324 já explica a conta; vale citar ali também a versão do `pg-pool` (3.x), como foi feito no cast de `connection`.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-24 22:39:36 · `tasks/correcoes/2026-09-24-transacao-com-banco-travado-prende-a-conexao.md`

VEREDITO: APROVADO
Caminho quente tocado: login | fila (o pool de conexões e as transações do Drizzle, usados pela API, pelo despachante e pelo worker)
Rate limit: ok (a correção não mexe nele)
Fila e prioridade: ok (a correção não mexe nela)
Concorrência: protegida. A devolução da conexão continua idempotente mesmo quando o evento de erro e a consulta rejeitada chegam juntos. Uma conexão devolvida com erro é sempre descartada pelo pool e nunca vai para outra requisição.
Índice e paginação: ok (a correção não mexe nisso)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok. O descarte de conexão continua aparecendo só como queda do total de conexões em uso. O contador próprio ficou como recomendação, abaixo.
Bloqueantes: nenhum

As quatro correções exigidas na 1ª rodada foram feitas:
- **Ouvinte no `conectar`.** Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.ts:150` e `:158`, `aoErroDaConexao` é registrado e chama `devolver(erro)`.
- **Retirada no `devolver`.** Em `pool.ts:155`, o ouvinte sai com `conexao.off` antes do `devolverAoPool`. Assim o ouvinte do pool volta e o deste empréstimo não se acumula. No `pool.query`, que também pega a conexão por esse `connect`, o ouvinte dele e este convivem sem dupla devolução.
- **Testes.** Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.int.test.ts`, o bloco "queda da sessão com a transação aberta" tem os dois casos: `pg_terminate_backend` entre duas consultas e `ECONNRESET` no meio de uma. Cada caso prende `uncaughtException`, e os dois exigem nenhuma exceção no processo, uma conexão descartada, `release` sem lançar e `bancoResponde` true. O teste dos 50.000 empréstimos confere que a conexão emprestada tem um só ouvinte de erro. As mutações registradas no documento correspondem a cada peça.
- **Documento.** Em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-24-transacao-com-banco-travado-prende-a-conexao.md`, o parágrafo "Fora desta correção" foi reescrito: o ouvinte agora é parte da correção, e ficou só o contador como recomendação.

Rodei `npx vitest run --project integracao packages/nucleo/src/db/pool.int.test.ts`: 14 de 14 passaram, em 13,1 s.

Recomendações:
- Criar o contador `banco.conexao_descartada{causa}`, com a causa separando erro de consulta e erro da conexão. Deve ser feito antes do staging, para que um failover do Postgres gerenciado apareça como sinal próprio.
- O teste de `ECONNRESET` usa `connection.stream`, que é interno do `pg` 8.x. Ao atualizar o `pg`, esse teste é o primeiro a conferir; o próprio teste já traz essa nota.
