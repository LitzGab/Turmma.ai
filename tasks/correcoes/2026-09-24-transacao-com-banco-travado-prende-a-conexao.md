# Correção — a transação do Drizzle com o banco travado prende a conexão do pool, ou a devolve com a transação aberta

**Origem:** portão local da tarefa 3.0 de `apresentacao-painel` (commit `5b2f87a`), primeira rodada; teste intermitente
**Subagentes obrigatórios:** `infra-guardian`
<!-- Sem privacy-guardian e tenancy-guardian: a correção não toca código de sessão, convite, repository, query, log nem
     dado de pessoa; muda só como o pool devolve a conexão emprestada. -->
<!-- revisor-geral não é obrigatório: dois arquivos de código. -->
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Primeira rodada do portão da 3.0: `3 failed | 171 passed`, `13 failed | 2062 passed`.

- `apps/api/test/sessao-operador.int.test.ts › sessão do operador: renovar, sair e os prazos (tarefa 8.0)`:
  `Error: Hook timed out in 180000ms`, no `afterAll` (`await app.close()`); o arquivo levou 186.943 ms;
- 9 testes de `apps/api/test/convite.int.test.ts` e 4 de `apps/api/test/mfa.int.test.ts` (os que rodam
  `ops:convite-coordenador` e `ops:redefinir-mfa`): `OPERADOR não é um operador ativo da equipe`.

Nenhum dos três arquivos tinha sido alterado pela tarefa. Rodados sozinhos, passaram, e a segunda rodada do portão
passou inteira. As linhas `Connection terminated due to connection timeout` e `canceling statement due to statement
timeout` do log são de `packages/nucleo/src/identidade/guarda-sessao.test.ts`, um teste de unidade que as fabrica de
propósito: não têm relação com a falha.

## Causa

**Defeito de produção, em `packages/nucleo/src/db/pool.ts`**, que o teste C31 de `sessao-operador.int.test.ts` alcança
às vezes. Não é o `for share` da 1.0 nem a trava da escola da 2.0 e da 3.0, e não é paralelismo entre arquivos: a
integração roda um arquivo por vez (`fileParallelism: false`).

O Drizzle (`drizzle-orm/node-postgres/session.js`, `transaction`) pega a conexão com `pool.connect()`, manda o `begin`
**fora** do `try` e, no `finally`, devolve a conexão com `release()` sem erro. O `criarPool` só protegia o
`pool.query` (`consultaQueDevolveAConexao`); a conexão da transação ficava por conta do Drizzle. Com o Postgres travado,
o prazo do cliente (`query_timeout`, consulta + conexão) estoura com a consulta já enviada, e:

1. **`begin` que estoura: a conexão nunca volta.** O erro sai antes do `try`, e nem o `rollback` nem o `release` rodam.
   A conexão fica emprestada para sempre: cada uma ocupa uma vaga do `BANCO_POOL_MAXIMO` até a instância reiniciar
   (dez delas e a instância só responde 503), e o `pool.end()` do desligamento espera por ela sem fim. Em produção a
   drenagem sai com código 1 depois de `DRENAGEM_PRAZO_MS`; no teste, o `afterAll` espera os 180 s do hook.
2. **Consulta do meio que estoura: a transação volta aberta ao pool.** O `rollback` do `catch` do Drizzle fica na fila
   atrás da consulta presa, estoura também, e o `pg` o tira da fila **sem mandar ao servidor**. O `finally` devolve a
   conexão como boa, com a transação ainda aberta no servidor, e o `commit` da próxima requisição que a pegar confirma
   a escrita da que já respondeu 503.

O caminho no teste: o C31 pausa o Postgres (`docker compose pause`) e dispara `/eu`, `/renovar` e `/sair` juntos. O
`/sair` abre transação. Se ele pega a conexão ociosa que o `/eu` anterior deixou, o `begin` vai por ela e estoura (caso
1); se abre conexão nova, quem estoura é o `connectionTimeoutMillis`, que o pool trata direito. Qual das três requisições
chega primeiro ao pool é corrida, e daí a intermitência. Com a conexão presa, o `app.close()` do `afterAll` nunca
termina, o hook estoura e o `BancadaDeOperadores.fechar()`, que vem depois dele, não roda: os operadores ativos da
bancada ficam no banco de teste. Todo `ops:*` de um arquivo seguinte sem `OPERADOR` passa a ser recusado (com operador
ativo, o `OPERADOR` tem de ser de um deles), e são os 13 testes de `convite` e `mfa`. Na segunda rodada, o
`ops-operador.int.test.ts` (que apaga todos os operadores) rodou antes deles, ou o `/sair` não pegou a conexão ociosa.

Conferido no banco durante a espera (vigia temporário no `afterAll`, fora do commit): pool com uma conexão emprestada e
nenhuma ociosa, e a sessão dela no servidor `idle in transaction`, última consulta `begin`, sem trava nenhuma.

## Teste que reproduz

`packages/nucleo/src/db/pool.int.test.ts › criarPool › transação do Drizzle com o prazo do cliente estourado`, com o
Postgres pausado no ponto exato, sem corrida:

- `o \`begin\` que estoura não prende a conexão: o pool de uma conexão volta a responder e o \`end()\` termina` (caso 1);
- `o \`rollback\` que estoura não devolve a transação aberta: a escrita da requisição que falhou não é confirmada por
  outra` (caso 2).

Vermelho antes: `2 failed | 6 passed (8)`, com `expected 1 to be +0` (a conexão emprestada) e
`expected [ 'da requisição que falhou', …(1) ] to deeply equal [ 'da requisição seguinte' ]` (a escrita da requisição
que falhou, confirmada pela seguinte). Verde depois.

As peças da correção, cada uma com o teste que fica vermelho sem ela (rodada 1 do `test-engineer`), em
`… › a conexão emprestada por \`pool.connect()\``:

- `release` idempotente: `descartada no erro de conexão, aceita o \`release\` de quem a pegou sem lançar, e o pool abre
  outra`, e o caso 2 passou a exigir que a rejeição não seja a da liberação dupla. Sem o `if (devolvida) return`:
  `3 failed | 9 passed (12)` (os dois, mais o `descarta a conexão encerrada pelo servidor…` do `pool.query`);
- a troca da `query` que não se empilha a cada empréstimo (`WeakMap`): `emprestada e devolvida dezenas de milhares de
  vezes, a mesma conexão ainda consulta…`. Sem o `WeakMap`: `1 failed | 11 passed (12)` (estouro da pilha);
- a forma com callback que passa direto: `a forma com callback, a do \`pg.Pool#query\` por dentro, segue respondendo`.
  Sem o desvio: `1 failed | 11 passed (12)` (a chamada fica pendurada);
- o erro de consulta que não descarta, dentro da transação do Drizzle: `na transação do Drizzle, o erro de consulta
  (unicidade) não descarta…` (mesmo pid depois, nada gravado, nenhum descarte).

- o ouvinte de `'error'` da conexão emprestada, em `… › queda da sessão com a transação aberta`: `sessão encerrada
  pelo servidor entre duas consultas…` (`pg_terminate_backend` depois do `begin`, sem consulta em andamento) e `socket
  resetado no meio de uma consulta da transação…` (`ECONNRESET` no `stream`). Os dois exigem nenhuma exceção no
  processo, a conexão descartada e o pool respondendo. Sem o ouvinte do `conectar`: `2 failed | 12 passed (14)`;
- a retirada desse ouvinte na devolução (rodada 3 do `test-engineer`): o teste dos 50.000 empréstimos exige um ouvinte
  de `'error'` só na conexão emprestada de novo. Sem o `off` do `devolver`: `1 failed | 13 passed (14)`,
  `expected 50002 to be 1`.

Com a correção inteira: `14 passed (14)`.

O sintoma original também, antes e depois, só `sessao-operador.int.test.ts`:

- antes, sem a correção: 7 travamentos em 10 execuções (6 de 6 com o vigia no `afterAll`, 1 de 4 sem ele), cada um com
  o hook de 180 s estourado. Os operadores que esses travamentos deixaram (60 ativos) reproduzem os 13 vermelhos de
  `convite` e `mfa` rodando os dois arquivos juntos: `13 failed | 23 passed (36)`, `OPERADOR não é um operador ativo`.
  Depois disso, os operadores sintéticos da bancada (`apelido like 't-%'`) foram apagados do banco de teste;
- depois: 6 de 6 verdes, 8,7 s cada.

## Correção

`criarPool` troca também o `pool.connect()` (forma com promessa, a da transação do Drizzle) por
`conexaoQueSaiNoErroDeConexao`: a conexão emprestada é devolvida **com o erro** na hora em que uma consulta dela falha
com erro de conexão (`ehErroDeConexao`, o mesmo critério do `pool.query`: timeout do cliente, socket, sessão encerrada).
O pool a descarta e a encerra, e o servidor desfaz a transação ao perder a sessão. O `rollback` seguinte do Drizzle
falha na hora (cliente encerrado), em vez de esperar mais um prazo inteiro, e o `release()` do `finally` dele vira nada:
o `release` da conexão emprestada passa a ser idempotente (o do `pg-pool` lança na segunda chamada).

Fica como estava: erro de consulta (unicidade, `statement_timeout`, sintaxe) não descarta, e a transação segue com o
`rollback` do Drizzle; a forma com callback do `connect`, que o `pg.Pool#query` usa por dentro, passa direto; o
`consultaQueDevolveAConexao` pega a conexão pelo mesmo `connect` e o `release` dele no erro de conexão também vira nada.
Vale para todo processo com pool (API, despachante, worker), que é onde o Drizzle abre transação.

**A mesma conexão emprestada sem ouvinte de `'error'`** (exigência da 1ª rodada do `infra-guardian`, que reproduziu o
caso). No empréstimo, o `pg-pool` tira o ouvinte de `'error'` dele, e o `pg` emite `'error'` em toda queda de socket,
com consulta em andamento ou entre duas consultas. O `pool.query` já se protegia (`consultaQueDevolveAConexao`); a
transação do Drizzle não, e a exceção subia ao processo, que o `uncaughtException` do logger encerra: um failover do
Postgres gerenciado (D26) ou um corte de rede com uma transação aberta derrubaria a instância de API ou worker. O
`conectar` põe um ouvinte de `'error'` que devolve a conexão com o erro, e o `devolver` o tira antes de a devolver ao
pool (que põe o dele de volta), para ele não se acumular no cliente.

Nota para quem ler o log: na transação descartada, o erro que chega ao filtro e ao log é o do `rollback`
(`Client was closed and is not queryable`), e não o da consulta que falhou. Antes era o do timeout do `rollback`; o
original já se perdia do mesmo jeito, porque o Drizzle lança o erro do `rollback` quando ele falha.

Os testes de `apps/api` não mudam: `sessao-operador.int.test.ts` continua pausando o banco no C31, e é isso que agora
passa.

Fora desta correção, recomendado pelo `infra-guardian`: um contador `banco.conexao_descartada{causa}`. Hoje o descarte
por erro de conexão só aparece como queda do total de conexões em uso (`packages/nucleo/src/telemetria/metricas.ts`).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 20:43:53 | 2026-09-24 20:47:55 | `test-engineer` | 1 | REPROVADO | afc7914d9797f82bb |
| 2026-09-24 21:22:41 | 2026-09-24 21:24:13 | `test-engineer` | 2 | APROVADO | ae8bfa847461ccb38 |
| 2026-09-24 21:24:27 | 2026-09-24 21:28:04 | `infra-guardian` | 1 | REPROVADO | a502306c3b15b5a44 |
| 2026-09-24 22:05:56 | 2026-09-24 22:07:12 | `test-engineer` | 3 | REPROVADO | afdf13b4dc5daaf6a |
| 2026-09-24 22:37:34 | 2026-09-24 22:38:13 | `test-engineer` | 4 | APROVADO | a17fc1cfa96158b13 |
| 2026-09-24 22:38:35 | 2026-09-24 22:39:36 | `infra-guardian` | 2 | APROVADO | ad2dfa66a7e2a3356 |
