# Achados das revisões — `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 00:04:58 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

**VEREDITO: REPROVADO**

**Cenários exigidos:**
1. A preparação de volume (5.000 lotes pendentes e 100 mil de histórico, com a FK de `escola_id`) cabe no prazo mesmo num runner lento.
2. O que o teste mede continua com os 2 s: a medição pelo repository, o `EXPLAIN (ANALYZE)` e a contagem que para no teto.
3. O prazo maior não vaza para outras consultas do pool.
4. O helper não passa a servir para esconder lentidão real em outros testes.

**Cobertos:**
- **Cenário 2:** coberto. O teste não prova nada por tempo. Ele prova pelo plano (nenhum `Seq Scan` em `job_registro`, uso de `job_registro_pendentes_urgentes_idx`) e pela contagem: 5.000, e depois o teto. A medição roda num `criarPool(configuracaoDoBanco())` próprio, com 2 s. O `EXPLAIN` e o `medirPendentes()` do fim continuam em `bancada.pool`, também com 2 s. Tirar o prazo da preparação não afrouxa nenhuma asserção, e as asserções continuariam falhando se o índice ou o teto fossem removidos.
- **Cenário 3:** coberto. O `set local` fica preso à transação e não volta ao pool com a conexão.
- **Cenário 4:** hoje o helper só é usado nas duas inserções de preparação, e o nome e o comentário deixam claro que ele é para preparação. Não achei nenhum uso que mascare o que um teste mede.
- **Cenário 1:** não coberto, ver o bloqueante.

**Bloqueantes:**

1. **`apps/worker/test/fila-de-teste.ts:306-310`: `semear` não dá 60 s. O limite real dele é de uns 4 s.**
   - **Causa:** `criarPool` (`packages/nucleo/src/db/pool.ts:133`) configura também o prazo do lado do cliente, `query_timeout = timeoutConsultaMs + timeoutConexaoMs`. Na bancada (`fila-de-teste.ts:43`) isso dá 2.000 + 2.000 = 4.000 ms. O `pg` aplica esse prazo a todo cliente que sai do pool, inclusive o que vem de `pool.connect()` (`node_modules/pg/lib/client.js:702`). O `set local statement_timeout = '60s'` só muda o prazo do servidor, e o do cliente continua cortando.
   - **Como conferi:** montei um teste temporário que chamava `bancada.semear('select pg_sleep(5)')`. Ele voltou com `Error: Query read timeout`. Já apaguei o arquivo e o `git status` está igual ao de antes.
   - **Por que a reprodução do documento não mostrou isso:** com o prazo do pool em 400 ms, o do cliente ficou em 400 + 2.000 = 2.400 ms, e 535 ms cabem nele. O verde não prova os 60 s.
   - **O que isso significa:** a correção só dobra a folga, de 2 s para uns 4 s, e não chega aos 60 s descritos no comentário e no documento. Se o runner da esteira for 8 vezes mais lento que esta máquina, o vermelho volta, agora como `Query read timeout`.
   - **Correção exigida:**
     - Passar o prazo do cliente por consulta: `cliente.query({ text: texto, values: valores, query_timeout: 60_000 })`. No `pg`, o `query_timeout` da consulta vence o da conexão.
     - Refazer o vermelho/verde de modo que a preparação passe dos 4 s. Por exemplo, um caso da bancada que chama `semear` com `pg_sleep(5)` e afirma que ele termina, e que a mesma instrução por `bancada.pool.query` é cortada. Assim fica provado que o helper faz o que diz.
     - Registrar a nova medição no documento da correção.

**Recomendações:**
- `fila-de-teste.ts:311-313`: se a conexão caiu, o `rollback` no `catch` também lança erro e esconde o erro original, e o `release()` devolve ao pool uma conexão quebrada. Vale usar `rollback().catch(() => {})` e `release(erroFatal)` para descartar a conexão.
- `metricas-espera.int.test.ts:183`: a inserção de `TETO_DA_CONTAGEM_DE_PENDENTES` linhas (10 mil, com a FK) também é preparação e ainda passa pelo pool de 2 s. É 10 vezes menor que a do histórico, mas é o mesmo tipo de risco. Deixar em `semear` por coerência.
- O `limparRegistro` do próximo `beforeEach` apaga umas 115 mil linhas com o prazo de 2 s. Não confere FK, porque apaga do lado que referencia, mas vale acompanhar na esteira.
- No comentário do helper, dizer que ele serve só para dado de preparação e nunca para a instrução que o teste mede. Isso deixa explícito o limite que impede mascarar lentidão real.

Arquivos: `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/pool.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

## test-engineer · 1ª rodada · APROVADO · 2026-09-18 00:06:53 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

VEREDITO: APROVADO

A correção exigida na rodada 1 foi feita. `semear` agora sobe o prazo nos dois lados, e um teste prova isso. Rodei os dois arquivos juntos: 2 arquivos e 5 testes verdes, em 9,7 s.

Cenários exigidos:
- **Caminho feliz:** a preparação de volume (100 mil linhas de histórico, 5.000 lotes, 10 mil acima do teto) termina mesmo com a FK de `escola_id`, sem ser cortada pelo prazo de 2 s do pool.
- **Borda 1:** a preparação passa dos 4 s do prazo do cliente (2 s de consulta mais 2 s de conexão), e não só dos 2 s do servidor. Foi esta a falha da rodada 1.
- **Borda 2:** o pool normal, por onde passa a instrução que o teste mede, continua cortando em 2 s com 57014. Assim a lentidão que o teste deve pegar não passa em silêncio.
- **Borda 3:** se a conexão cai no meio da preparação, o erro que sobe é o da preparação, e a conexão quebrada sai do pool.
- **Permissão e isolamento:** não se aplicam. A correção é só no apoio de teste; o isolamento por escola que o teste de medição prova não mudou.
- **Concorrência:** não se aplica. A correção não cria operação que rode duas vezes ao mesmo tempo.

Cobertos:
- **Caminho feliz:** as três inserções de `apps/despachante/test/metricas-espera.int.test.ts` (linhas 128, 137 e 169) passaram a usar `semear`. O arquivo passa 4 de 4.
- **Bordas 1 e 2:** um único teste em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/bancada.int.test.ts:16-20` cobre as duas.
  - `pg_sleep(2.5)` pelo pool normal falha com 57014.
  - `pg_sleep(4.5)` por `semear` termina.
  - O teste falha se a regra for removida, dos dois jeitos. Sem o `query_timeout`, falha com `Query read timeout`, que é a evidência registrada no documento. Sem o `set local statement_timeout`, falha porque o servidor corta aos 2 s.
  - Se alguém subir o prazo do pool normal, falha na primeira asserção.
  - O `pg_sleep(4.5)` passa dos dois prazos do pool, então prova a regra de fato e não passa por folga.
- **O que o teste de medição prova não mudou:** a medição, o `EXPLAIN` e os repositories continuam pelo pool normal, com o prazo de 2 s.

Bloqueantes: nenhum.

Recomendações:
1. **Queda de conexão sem teste:** o caminho de `semear` em que a conexão cai (`fila-de-teste.ts:319-325`) não tem teste. É código de apoio de teste, então fica como cobertura extra, sem bloquear.
2. **Rollback depois do corte do cliente:** `fila-de-teste.ts:317` usa os mesmos 60 s para o `query_timeout` do cliente e para o `statement_timeout` do servidor. Quando o cliente corta primeiro, o `pg` não cancela a consulta no servidor. O `rollback` fica na fila da mesma conexão até o servidor terminar ou cortar, e o erro demora a aparecer. Um `query_timeout` um pouco maior que o `statement_timeout` faria o servidor cortar primeiro, com o 57014, que é mais legível.
3. **`analyze` pelo pool normal:** `apps/despachante/test/metricas-espera.int.test.ts:142` roda `analyze job_registro` pelo pool normal, sobre cerca de 115 mil linhas. É preparação e hoje é rápido, porque o `analyze` só lê uma amostra. Mas no runner lento é a próxima instrução que pode bater nos 2 s; vale considerar passá-la por `semear` também.
4. **Registrar para o `/retro`:** a reprodução com 400 ms não pegava o prazo do cliente. A lição é que o teste que prova um helper de prazo precisa passar do prazo efetivo mais alto da conexão, e não só do prazo do servidor.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 00:07:49 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

VEREDITO: APROVADO

Fiz as duas recomendações que você aplicou, e as duas estão certas. Rodei os dois arquivos: 2 arquivos e 5 testes verdes, em 10,9 s.

**O que conferi nesta rodada**
- **Recomendação 2, feita** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts:319`): o prazo do cliente agora é `PRAZO_DA_PREPARACAO_MS + 5_000`, e o do servidor fica em `PRAZO_DA_PREPARACAO_MS`. Quem corta primeiro é o Postgres, com o código 57014. O teste do helper continua valendo: se o `query_timeout` sair, `pg_sleep(4.5)` bate nos 4 s que o cliente herda do pool; se o `set local` sair, o servidor corta aos 2 s.
- **Recomendação 3, feita** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts:142`): o `analyze job_registro` agora passa por `semear`. O `ANALYZE` roda dentro de transação, ao contrário do `VACUUM`, e o teste passou 4 de 4. As estatísticas ficam gravadas no commit, antes do `EXPLAIN`, então o plano que o teste confere continua sendo o de estatística atualizada.
- **O que o teste mede não mudou:** o `EXPLAIN`, a medição pelo repository e a contagem acima do teto continuam pelo pool normal, com o prazo de 2 s. A mudança não enfraquece nenhuma asserção.
- **O documento da correção** (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`) registra os dois ajustes.

**Cenários exigidos** (os mesmos da rodada 2)
- **Caminho feliz:** a preparação de volume cabe no prazo mesmo com a FK de `escola_id`.
- **Borda:** a preparação passa dos 4 s do cliente, e não só dos 2 s do servidor.
- **Borda:** o pool normal continua cortando em 2 s.
- **Borda:** se a conexão cai no meio da preparação, o erro que sobe é o da preparação, e a conexão quebrada sai do pool.
- **Permissão, isolamento e concorrência:** não se aplicam, porque a correção só mexe no código de apoio dos testes.

**Cobertos:** o caminho feliz e as duas primeiras bordas, pelos testes de `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/bancada.int.test.ts` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts`. A borda da queda de conexão está implementada, mas não tem teste, como aceito na rodada 2.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O teste da queda de conexão no `semear` continua de fora. É cobertura extra de código de apoio, como você decidiu, e fica registrada para o `/validar`.
2. A lição da reprodução com 400 ms fica para o `/retro` do F1: o teste que prova um helper de prazo precisa passar do maior prazo que vale na conexão, e não só do prazo do servidor.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 00:08:58 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

VEREDITO: APROVADO

Caminho quente tocado: fila (só a bancada de teste e o teste de medição da fila; nenhum código de produção muda)
Rate limit: não se aplica
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok (o teste ainda prova, pelo `EXPLAIN`, que a medição não varre `job_registro` e usa `job_registro_pendentes_urgentes_idx`)
Degradação de IA: não se aplica
Migration: não se aplica (a 0006 já está no `main` e é `NOT VALID`, sem varredura nem trava longa)
Métrica e alerta: ok
Bloqueantes: nenhum

Rodei `npx vitest run --project integracao` nos dois arquivos: 2 arquivos e 5 testes passaram, em 9,95 s.

**Ponto 1: a FK não é problema de produção.** O documento está certo.
- `packages/nucleo/src/fila/enfileirador.ts:27` passa por `JobRegistroRepository.inserir` (`packages/nucleo/src/fila/job-registro.repository.ts:71`). Esse caminho grava uma linha por chamada, na transação de quem pede, com um `pg_notify` junto.
- Hoje só dois lugares enfileiram: `apps/api/src/sistema/jobs-sinteticos.service.ts:31` e `apps/worker/src/agendamentos.ts:84`. Os dois gravam um job por vez.
- Ingestão e correção ainda não existem no código. Pelo desenho (`docs/ingestao.md:41`), o pior caso é da ordem de 300 jobs por pedido (300 PDFs), o que dá menos de 1 ms de conferência de FK.
- O `addBulk` de `apps/despachante/src/fila-de-publicacao.ts` publica no Redis e não insere em `job_registro`.
- A conferência pega `FOR KEY SHARE` na linha da `escola`. Essa trava não conflita com outros inserts nem com `UPDATE` de coluna que não é chave. Sessenta turmas enfileirando juntas não se bloqueiam.
- O expurgo apaga de `job_registro`, a tabela que aponta para `escola`, então não dispara conferência.

**Ponto 2: o helper não mascara lentidão do que o teste mede.**
- `semear` é usado só nas quatro preparações de `apps/despachante/test/metricas-espera.int.test.ts` (linhas 128, 137, 142 e 169).
- O que o teste mede continua com 2 s: `medirPendentes` pelo pool criado com `configuracaoDoBanco()`, o `EXPLAIN ANALYZE` por `bancada.pool` e a contagem no teto por `bancada.despacho`.
- `semear` devolve `Promise<void>`, então não serve para ler resultado de medição. Isso dificulta usá-lo por engano no lugar da instrução medida.
- `apps/worker/test/bancada.int.test.ts` prova os dois lados: o pool normal corta `pg_sleep(2.5)` com o erro 57014 (prazo do servidor esgotado), e `semear` passa dos 4 s.

Recomendações:
- Outras preparações de volume ainda passam pelo pool de 2 s e poderiam usar `semear`: `apps/worker/test/expurgo.int.test.ts:72` e `:136` (12 mil linhas), `apps/despachante/test/janela.int.test.ts:251` (5 mil) e `apps/despachante/test/vagas.int.test.ts:116`. Pela medição do documento, 12 mil linhas com FK levam uns 65 ms locais, então hoje estão longe do prazo. Vale trocar se a esteira voltar a oscilar. Deixar para o `/retro`.
- O `VALIDATE CONSTRAINT` da FK de `job_registro` continua pendente, fora do horário letivo, conforme a 0006 e o TODO.md. Não é desta correção.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/bancada.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/fila/job-registro.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0006_fk_escola_nas_tabelas_do_f0.sql

## test-engineer · 3ª rodada · APROVADO · 2026-09-18 00:10:41 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

VEREDITO: APROVADO

Cenários exigidos (os mesmos da rodada 3):
- Preparar dado em volume (100 mil linhas em `job_registro`, com a FK de `escola_id`) com prazo de 60 s no servidor e no cliente.
- A instrução que o teste mede continua com os 2 s do pool.
- Um erro na preparação faz rollback, e a conexão perdida sai do pool.

Cobertos:
- No `git diff` de `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts`, a única diferença de conteúdo desde a rodada 3 é a interface local `ConsultaComPrazoDoCliente` (`text`, `values`, `query_timeout`, em `fila-de-teste.ts:43-47`) e a variável `consulta` que a usa (`fila-de-teste.ts:326`).
- Os valores passados são os mesmos de antes: `texto`, `valores` e `PRAZO_DA_PREPARACAO_MS + 5_000`.
- O objeto chega igual a `cliente.query`, então o comportamento em execução é idêntico.
- Continua valendo o que aprovei: `set local statement_timeout` de 60 s, o cliente esperando 5 s a mais para que quem corte seja o Postgres com o erro 57014, rollback que registra a conexão perdida e `release(conexaoPerdida)`.
- A lista de arquivos alterados é a mesma da rodada 3. Nenhum arquivo novo apareceu fora da tarefa.
- Não rodei testes, como você pediu. Considero o seu resultado: `bancada.int.test.ts` com 1 passed, e typecheck e lint limpos.

Bloqueantes: nenhum.

Recomendações:
- O tipo local repete o formato do `pg` à mão. Se um dia o `@types/pg` passar a declarar `query_timeout`, vale trocar pelo tipo dele e apagar a interface local. O comentário na linha 42 já explica por que ela existe, então isso não bloqueia.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-18 00:10:58 · `tasks/correcoes/2026-09-18-historico-do-teste-passa-do-prazo-com-a-fk.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (só código de teste, na bancada da fila)
Rate limit: não se aplica
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum.

Conferi o `git diff`. A única mudança desde a minha aprovação é a interface local `ConsultaComPrazoDoCliente` e a variável `consulta` que a usa (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/fila-de-teste.ts:43-47` e `:326`). Os valores continuam `texto`, `valores` e `PRAZO_DA_PREPARACAO_MS + 5_000`, e o objeto chega igual a `cliente.query`. Por isso o comportamento não mudou:
- a transação continua com `set local statement_timeout` de 60 s;
- o cliente ainda espera 5 s a mais que o servidor;
- o rollback continua registrando a conexão perdida, e o `release(conexaoPerdida)` a tira do pool.

Os outros arquivos alterados (`/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/metricas-espera.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/bancada.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`) são os mesmos da rodada aprovada. A instrução que o teste mede continua no pool normal, com prazo de 2 s. Não rodei testes, como você pediu.

Recomendações:
- Se o `@types/pg` passar a declarar `query_timeout`, troque o tipo local pelo tipo do pacote e apague a interface.
- Continua valendo a recomendação da rodada anterior, para o `/retro`: passar para `semear` as outras preparações de volume, se a esteira voltar a oscilar. São elas `expurgo.int.test.ts:72` e `:136`, `janela.int.test.ts:251` e `vagas.int.test.ts:116`.
