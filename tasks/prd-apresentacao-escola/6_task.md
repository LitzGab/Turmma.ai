# Tarefa 6.0 — Aluno reivindica o nome, com idempotência e hash sempre no semáforo

**Funcionalidade:** apresentacao-escola · **Depende de:** 2.0, 5.0 · **Paralelo com:** 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O aluno escolhe um nome livre, digita a matrícula e cria a senha; o pedido fica pendente e o nome sai da lista;
matrícula errada, nome tomado e nome de outra turma dão a mesma recusa; o reenvio com a mesma chave responde
`enviado` sem pedido novo.

## Contexto necessário

- `docs/visao-produto.md`; `docs/fluxos.md`, fluxo 1; `docs/lgpd.md`, "Pedido de reivindicação"
- `techspec.md` seções 3, 4 ("Uma resposta só"), 5 (passos 3 e 4), 7 (`chaveEnvio`) e 7c
- `cenarios.md`: os ids da tabela abaixo; `revisao-spec.md`, rodada 5 (C2 e C4)
- Regras 10, 20 (itens 4, 6, 9), 40, 80 (itens 6, 7)
- Código:
  - `apps/api/src/sessao/senha/semaforo-de-hash.ts`, `conferencia-na-vez.ts` (o balde da escola, o 503 com
    `Retry-After`) e `hash-de-senha.ts` (argon2id)
  - `apps/api/src/sessao/matricula.service.ts` — o login do R5
  - `apps/api/test/gatilho-de-parada.ts`, `semaforo-de-login.int.test.ts` — pausa, trava, teto do semáforo

## Subtarefas

- [x] 6.1 — Migration 0021 e schema, como na seção 3 (FKs com `set null (coluna)`, os dois únicos parciais, o
  check de pendente, o índice). `REIVINDICACAO_RECUSADA` em `packages/shared/src/erros/`
- [x] 6.2 — Serviço, na ordem do passo 4: chave já gravada na escola e na turma do acesso → `enviado`, sem hash;
  argon2id no semáforo, balde da escola, **sempre**, fora da transação; o `insert` do pedido e **depois** o
  `update` condicional da `lista_nome` (com `trim` na matrícula). FK, 23505 ou `update` sem linha: volta atrás e
  relê a chave num comando novo, sem ler o nome da restrição. `teve_matricula_errada` grava `false` (a 7.0 o lê)
- [x] 6.3 — `POST salas/reivindicar`, `@RotaAnonima`, `.strict()`, `chaveEnvio` UUID, `no-store`, sem cookie nem
  registro de acesso; responde `enviado`
- [x] 6.4 — Documento: `Reivindicacao` real em `docs/modelo-de-dados.md`, sem `dispositivo`; o bloco "Ainda não
  existe — F2" fica só com o `Responsavel`
- [x] 6.5 — Testes; a rota entra em `escola-montada.int.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo`: `drizzle/0021_reivindicacao.sql`, `schema/reivindicacao.ts` | novo |
| `apps/api/src/sala/reivindicacao.*`; `salas.controller.ts`, `packages/shared/src/erros/*`, `sala/salas.ts` | novo, alterado |
| `apps/api/test/salas-reivindicar.int.test.ts`; `escola-montada.int.test.ts`, `docs/modelo-de-dados.md` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| I4, R1, P5, L10, A6, A7 (reivindicar) | integração | como na 5.0, agora em `salas/reivindicar` |
| I5 | integração | acesso de T1 com o nome de T2 e de B, matrícula certa: recusa, nada alterado |
| R2 (sem "já aprovado") | integração | os sete casos, corpo igual, nada gravado |
| R3 | unidade | o hash falso chamado uma vez em cada caso, pelo semáforo, antes da transação |
| R5 | integração | login com a matrícula e a senha do pendente responde igual à senha errada |
| E23, E24 | integração | falha injetada entre as duas escritas: nada gravado; dois nomes iguais, cada um com a sua matrícula |
| E2, E7 (estas partes) | integração | turma com pedido: `CONFLITO` ao excluir; retirar reivindicado: `CONFLITO`, não apaga |
| E21 (sem contadores) | integração | reenvio: `enviado`, sem pedido nem hash; não UUID: 400; a chave pelo acesso de T2, com a matrícula certa de T2: recusa |
| L9 | integração | o login de B pega a vez no rodízio; nenhuma conexão presa; 503 com `Retry-After`, e o reenvio grava |
| C1 (sem contadores) | integração, em paralelo | dois no mesmo nome: um pendente, o outro recusado, nunca 5xx |
| C2 | integração, em paralelo | os três jeitos; no (c), o índice recriado pelo `indexdef` de `pg_indexes`, mesmo nome e predicado |
| C4 | integração, em paralelo | reivindicar × retirar: pausa depois do `update` da `lista_nome`, solta quando o `pg_stat_activity` mostra o `delete` esperando |
| log novo | integração | só ids: nada de matrícula, senha, chave nem nome (A4) |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Contadores e `teve_matricula_errada` real (7.0); a decisão (8.0); o `for share` no ano (10.0, C10); a página (17.0).

## Plano e autoconferência

- **Arquivos**: migration `0021_reivindicacao.sql` e `schema/reivindicacao.ts` (com o `SET NULL (coluna)` escrito à mão,
  como na 0019 e na 0020); `REIVINDICACAO_RECUSADA` (409) no catálogo, na mensagem e no status; contrato
  `esquemaPedidoReivindicarSala` e `esquemaRespostaReivindicacao` em `packages/shared/src/sala/salas.ts`, com os estados e
  os decisores; `apps/api/src/sala/reivindicacao.repository.ts` (`chaveGravada`, `inserirPendente`),
  `ListaLivreRepository.tomar`, `reivindicacao.service.ts`, a rota em `salas.controller.ts` e o provedor em
  `sala.module.ts`; `entradaDaSala` sai do `abrir` para `sala/entrada-da-sala.ts` e serve às duas rotas; `docs/modelo-de-dados.md`.
- **Peças que já existiam**: `AcessoDaSala.naSala` (a sala e o contexto), `SemaforoDeHash` e `HashDeSenha` do
  `SessaoModule` global (o mesmo semáforo do login, um por instância), `baldeDaEscola`, `esquemaMatriculaDigitada` da
  lista (o `trim` e as regras da matrícula), `TAMANHO_MINIMO_SENHA_NOVA`, `erroDoPostgresEm`; no teste, a montagem da
  5.0, o `GatilhoDeParada` (ganhou o `delete`, com a condição sobre `old`), `esperarNaTrava` e `aguardar`, e o portão do
  hash do `semaforo-de-login.int.test.ts`.
- **O segundo dado que torna cada cláusula observável**: duas turmas na escola e uma escola B (a turma no `update` e na
  leitura da chave: I5, E21); dois nomes na turma, com a matrícula de um no outro (o id e a matrícula no `update`: R2,
  E24); um nome já reivindicado (o `livre` no `update`: C1 do repository); a mesma chave em T1 e em T2 (a turma na
  leitura da chave: E21); o índice da chave recriado depois do pendente (a releitura sem ler a restrição: C2 (c)); duas
  escolas no semáforo com um hash por vez (o balde e o rodízio: L9).
- **Checagem que responde antes**: nos casos do R2 e do I5, o acesso vale (o R1 e o I4 provam o `NAO_ENCONTRADO` à parte,
  e sem hash); cada R2 confere que o hash rodou, ou seja, que o pedido passou da leitura da chave e chegou à transação;
  cada recusa termina com o sucesso do mesmo acesso.
- **Em paralelo**: C1, C2 (a), (b) e (c) e os dois arranjos do C4 com `Promise.all` ou com o ponto de pausa.
- **Guardiões**: `tenancy-guardian` — escola, ano e turma saem da linha do acesso; os dois repositories leem escola e ano
  do contexto, e a turma é filtro; FKs compostas com a escola; a mesma chave em outra escola grava; tudo que não é acesso
  vigente é `NAO_ENCONTRADO`, e todo nome que não se toma, a mesma recusa (R1, R2, I4, I5). `privacy-guardian` — a
  senha vira hash argon2id antes de gravar, e a resposta é só `enviado`; nada novo em log (A4 com a senha, as chaves e
  os hashes gravados como sentinelas); nenhum registro de acesso, cookie nem `dispositivo` (A6); `no-store` (A7); os
  segredos só no pendente, por check; `docs/lgpd.md` já tinha a linha do pedido. `infra-guardian` — o hash no
  semáforo do login, no balde da escola, fora da transação e sem conexão presa (L9, com a conta do pool); o 503 do prazo
  sem gravar, e o reenvio com a mesma chave grava; a corrida resolvida pelos únicos e pelo `update` condicional, com a
  releitura num comando novo (C1, C2, C4); a rota anônima no `rl:ip` (L10); as leituras por índice que começa pela
  escola; métricas e limites da sala ficam na 7.0.

## Divergências resolvidas nesta tarefa

- **O check do pedido é nos dois sentidos**: hash, chave e `teve_matricula_errada` só no pendente (o que a spec dizia) e
  o pendente com os três. Um pendente sem hash não teria como virar aluno, e um sem chave quebraria a idempotência. O
  `estado` e o `decidida_como` também têm check com os valores da seção 3. E o pendente sempre aponta para o nome (check
  `reivindicacao_pendente_com_nome`, recomendação do `privacy-guardian` na 1ª rodada): o `set null` da FK num pendente
  falha, e a 10.0 (encerramento e eliminação) fecha ou apaga o pedido antes de apagar o nome. Na seção 3 da
  `techspec.md` e no E21 do `cenarios.md`, com o teste "o check do pedido".
- **Índice `(escola_id, lista_nome_id)`**, além do da turma: o `set null` da FK, quando o nome sai da lista (a retirada,
  o encerramento da 10.0, a eliminação), acha os pedidos do nome sem varrer os da escola (regra 80, item 8). Não é
  regra, e não tem teste de comportamento. Na seção 3 da `techspec.md`.
- **O status e a resposta**: `REIVINDICACAO_RECUSADA` sai com 409 (o pedido é bem formado e o nome não foi tomado), e o
  `enviado` é 200 `{ resultado: 'enviado' }`, igual no pedido novo e no reenvio. A mensagem geral do código é o texto do
  W9, que a 17.0 usa. Na seção 4 da `techspec.md` e no R2 e no E21 do `cenarios.md`.
- **O contrato do reivindicar**: `listaNomeId` UUID, a matrícula com as regras da lista (`esquemaMatriculaDigitada`, com o
  `trim`), a senha de 12 até o teto, e o token e o código com os mesmos tetos do abrir. Na seção 4 da `techspec.md`, e
  no P5 e no E24 do `cenarios.md`.
- **O R1 da reivindicação não roda o hash**: o acesso é resolvido antes, e o que não é acesso vigente responde
  `NAO_ENCONTRADO` sem hash e sem gravar. No R1 do `cenarios.md`.
- **O C4 tem os dois arranjos**: a reivindicação parada depois do `update` do nome (o da spec) e a retirada parada depois
  do `delete`, com a reivindicação esperando a FK. No C4 do `cenarios.md`.

## Mutações

Cada cláusula foi apagada ou trocada, a suíte rodou vermelha, e o arquivo voltou. As do banco foram feitas no banco de
teste (`drop`/`add constraint`, `drop`/`create index`) e desfeitas depois, porque a migration já aplicada não roda de novo.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `reivindicacao.repository.ts:38` (a chave na leitura) | C1, C2 (c), E24, R2, o pedido pendente, A6/A7, L9 (503) |
| `reivindicacao.repository.ts:40` (a turma na leitura da chave) | E21 (a chave pelo acesso de T2 recebia `enviado`) |
| `reivindicacao.repository.ts:37` e `:39` (escola e ano na leitura da chave) | nenhum, sozinhas: segunda camada (a turma é UUID global, da linha do acesso) |
| `reivindicacao.repository.ts:60` (`teve_matricula_errada` em `false`) | 23 testes (o check recusa o pendente sem ele: 500) |
| `lista-livre.repository.ts:69` (a turma no `tomar`) | I5, R2 |
| `lista-livre.repository.ts:70` (o id no `tomar`) | E24, R2 (a matrícula de outro nome tomava o outro nome) |
| `lista-livre.repository.ts:71` (`livre` no `tomar`) | C1 (repository) |
| `lista-livre.repository.ts:72` (a matrícula no `tomar`) | E24, R2 |
| `lista-livre.repository.ts:67` e `:68` (escola e ano no `tomar`) | nenhum, sozinhas: segunda camada (o nome é UUID global, e a turma e a FK com a escola o prendem) |
| `reivindicacao.service.ts:61` (a chave antes do hash) | E21 (o reenvio rodava o hash), C2 (c) |
| `reivindicacao.service.ts:70` (a releitura depois da volta atrás) | C2 (a), (b) e (c) |
| `reivindicacao.service.ts:62` (o semáforo, trocado pelo hash direto) | L9 (os dois), C2 (b) |
| `reivindicacao.service.ts:62` (o balde da escola, trocado por um fixo) | R3 (unidade, cinco casos) |
| `reivindicacao.service.ts:62` (o hash levado para dentro da transação) | L9 (os dois: conexão presa e o prazo) |
| `reivindicacao.service.ts:66` (o `throw` do nome não tomado) | E24, I5, R2 |
| `reivindicacao.service.ts:25` (o 23503 na volta atrás) | I5, R2, C4 (retirar × reivindicar), L10, A6/A7 (500 no lugar da recusa) |
| `reivindicacao.service.ts:25` (o 23505 na volta atrás) | C1, C2 (a), (b) e (c), E21, R2 |
| `reivindicacao.service.ts:69` (o erro de outro tipo sobe) | R3 (unidade, "o erro que não é FK…") |
| `reivindicacao.service.ts:65-66` (o `update` antes do `insert`) | C2 (c) (nenhum 23505 do pendente), C4 (retirar × reivindicar) |
| `reivindicacao.service.ts:64` (as duas escritas sem transação) | E23, E24, I5, R2 |
| `salas.controller.ts:32` (`no-store`) | A6/A7 |
| `salas.controller.ts:31` (`@HttpCode(200)`) | 22 testes (201) |
| `salas.ts:82-83` (`strictObject`) | P5 |
| `salas.ts:73` (a chave UUID) | E21 |
| `salas.ts:70` (o nome UUID) | P5 (500 no lugar do 400) |
| `salas.ts:72` (a senha de 12) | P5 |
| `salas.ts:71` (a matrícula com `trim`) | E24 |
| `0021_reivindicacao.sql:38` (check `reivindicacao_segredo_so_pendente`) | "o check do pedido" |
| `0021_reivindicacao.sql:36` (check `reivindicacao_pendente_com_nome`, recomendação do `privacy-guardian`) | "o check do pedido" (o pendente sem nome e o `delete` do nome de um pendente) |
| `0021_reivindicacao.sql:35` (check do estado) | "o check do pedido" (depois de o caso passar a vir sem segredos, que respondiam antes) |
| `0021_reivindicacao.sql:37` (check do `decidida_como`) | "o check do pedido" |
| `0021_reivindicacao.sql:45` (único da chave na escola) | E21, C2 (c), "os únicos e as FKs" |
| `0021_reivindicacao.sql:46` (um pendente por nome) | C2 (c), "os únicos e as FKs" |
| `0021_reivindicacao.sql:42` (FK da turma) | E2 |
| `0021_reivindicacao.sql:43` (FK do nome, sem ela) | E2, C4 (retirar × reivindicar) |
| `0021_reivindicacao.sql:43` (o `SET NULL` inteiro no lugar de `("lista_nome_id")`) | E2 |
| `0021_reivindicacao.sql:44` (o `SET NULL` inteiro no lugar de `("decidida_por")`) | "os únicos e as FKs" |
| `0021_reivindicacao.sql:47-48` (os índices da turma e do nome) | nenhum: não são regra, são desempenho (regra 80, item 8) |
| `reivindicacao.service.ts` (acrescentado: `new Logger('sala').log(\`sala.reivindicar.${senha}\`)`) | A4 (a senha em formato de evento, sentinela nova) |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `privacy-guardian`, 1ª | check `estado <> 'pendente' or lista_nome_id is not null` | aplicada: `reivindicacao_pendente_com_nome`, com o teste no "check do pedido" |
| `privacy-guardian` e `infra-guardian`, 1ª | nenhum ambiente com a 6.0 sem a 7.0 (tentar matrículas num nome livre) | `TODO.md`, no item "A página pública da sala só com a 7.0 junto" |
| `privacy-guardian`, 1ª | o pedido do titular (F3) inclui a `reivindicacao` por `lista_nome_id` | `TODO.md`, no item do pedido do titular |
| `infra-guardian`, 1ª | o alerta `login-hash-recusado` e o runbook passam a contar a reivindicação no mesmo semáforo | tarefa 9.0 (alerta e runbook da sala), anotada no `9_task.md` |
| `tenancy-guardian`, 1ª | teste em que a turma não vem da linha do acesso, para escola e ano nos repositories deixarem de depender só da FK | tarefa 8.0 (pedidos pela turma com sessão), anotada no `8_task.md` |
| `revisor-geral`, 1ª | `entradaDaSala` em arquivo próprio; comentário do `chaveGravada` sobre o estado | aplicadas: `apps/api/src/sala/entrada-da-sala.ts` e o docblock do `chaveGravada` |
| `revisor-geral`, 1ª | um estilo só de construtor nos serviços do `sala` | recusada: o repositório usa argumentos posicionais para poucas dependências (`AcessoDaTurmaService`, `SalasService`) e objeto para muitas (`LoginPorMatricula`, `ConviteService`); o `ReivindicacaoService` tem cinco, e o objeto é o que o teste de unidade monta |
| `test-engineer`, 3ª | a 10.0 e a eliminação fecham ou apagam o pedido pendente antes de apagar o nome | tarefa 10.0, anotada no `10_task.md` (V1 e V3) |
| `privacy-guardian`, 2ª | o 23514 do check novo nunca como 500 num caminho futuro | tarefa 10.0, anotada no `10_task.md` |
| `test-engineer`, 1ª | as quatro: a ordem do `insert` no E23, a mesma chave em duas escolas pela API, a matrícula repetida em escolas diferentes pela rota, e a nota do índice recriado no C2 (c) | aplicadas em `salas-reivindicar.int.test.ts` (o teste "matrícula repetida em escolas diferentes…" cobre as duas do meio) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-26 22:06:47 | 2026-09-26 22:08:57 | `test-engineer` | 1 | APROVADO | ae130913d2ff1652d |
| 2026-09-26 22:20:03 | 2026-09-26 22:20:38 | `test-engineer` | 2 | APROVADO | a3da26549bcc8bbb9 |
| 2026-09-26 22:20:58 | 2026-09-26 22:21:35 | `tenancy-guardian` | 1 | APROVADO | a432e5b5984d4c11e |
| 2026-09-26 22:21:03 | 2026-09-26 22:22:22 | `privacy-guardian` | 1 | APROVADO | abe28d271888037ba |
| 2026-09-26 22:20:52 | 2026-09-26 22:22:32 | `revisor-geral` | 1 | APROVADO | abec669b00ca34915 |
| 2026-09-26 22:21:09 | 2026-09-26 22:22:44 | `infra-guardian` | 1 | APROVADO | a597efd3b5d20704b |
| 2026-09-26 22:35:33 | 2026-09-26 22:36:05 | `test-engineer` | 3 | APROVADO | ae3c74917027cdaaf |
| 2026-09-26 22:36:30 | 2026-09-26 22:36:55 | `tenancy-guardian` | 2 | APROVADO | aa761f52acc01241d |
| 2026-09-26 22:36:35 | 2026-09-26 22:37:10 | `privacy-guardian` | 2 | APROVADO | a13be7e71ed30e59a |
| 2026-09-26 22:36:39 | 2026-09-26 22:37:13 | `infra-guardian` | 2 | APROVADO | a8851f8fbc0c335d7 |
| 2026-09-26 22:36:26 | 2026-09-26 22:37:14 | `revisor-geral` | 2 | APROVADO | ac91444827b159b25 |
