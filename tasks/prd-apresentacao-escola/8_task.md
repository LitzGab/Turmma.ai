# Tarefa 8.0 — Professor ou coordenação decide os pedidos; o aluno aprovado vê a própria turma

**Funcionalidade:** apresentacao-escola · **Depende de:** 7.0 · **Paralelo com:** 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Professor com vínculo confirmado e coordenação leem os pedidos da turma e decidem os selecionados; só a aprovação
humana cria o aluno, com a matrícula da lista e a senha do pedido; o aprovado vê só a própria turma.

## Contexto necessário

- `docs/visao-produto.md`; `docs/fluxos.md`, fluxo 1; `docs/lgpd.md`, "Pedido de reivindicação"
- `techspec.md` seções 4 ("Uma resposta só"), 5 (passo 6), 6 e 7 (auditoria)
- `cenarios.md`: os ids da tabela abaixo
- Regras 10, 20 (itens 4, 5, 9, 10), 40, 60 (item 7), 70 (a decisão de identidade é humana), 80 (item 7)
- `TODO.md`: o vínculo de aluno com `decidido_em`
- Código:
  - `TurmaRepository.aberta` — o `exists` do vínculo confirmado; nunca `join` (duplica a linha, P3)
  - `apps/api/src/estrutura/turma.service.ts` — a finalidade conferida antes de procurar a turma
  - `credencial-matricula.repository.ts`, `vinculo.repository.ts`, `contador-de-tentativas.ts` (o contador de login
    que a aprovação zera); `apps/api/test/virada-do-ano.int.test.ts` (E19)

## Herdado da 2.0

- **A matrícula do aprovado e o nome avulso ao mesmo tempo.** A aprovação apaga a matrícula da linha da lista e a grava
  na `credencial_matricula`. O avulso e a gravação da lista (2.0) conferem a `credencial_matricula` antes do `insert`,
  sem trava: se a aprovação da mesma matrícula fizer commit entre a conferência e o `insert`, a lista ganha um nome
  livre com a matrícula do aprovado. O único da `credencial_matricula` impede o segundo aluno (a aprovação desse nome
  estoura), mas o nome fica na lista. Decidir aqui se a aprovação e as escritas da lista pegam uma trava pela matrícula
  (por exemplo, `pg_advisory_xact_lock` de escola e matrícula), ou se o 23505 da credencial na aprovação vira
  `ja_decidida`/`CONFLITO` e o nome sai.
- **O `ja_existe` do aprovado** (8.4): na 2.0, a matrícula de aluno da escola sai `matricula_em_uso` em qualquer turma,
  pela busca em `credencial_matricula` (`ListaRepository.comCredencial`); a 8.0 separa a desta turma.

## Notas da 6.0 (`tenancy-guardian`, 1ª rodada)

- Escola e ano no `ReivindicacaoRepository.chaveGravada` e no `ListaLivreRepository.tomar` são segunda camada na 6.0: a
  turma vem da linha do acesso, e a FK composta barra o nome de outra escola. Quando os pedidos forem lidos e decididos
  pela turma com sessão de professor ou coordenação, vale um teste em que a turma não venha da linha do acesso, para
  essas cláusulas deixarem de depender só da FK.

## Subtarefas

- [x] 8.1 — `GET turmas/:id/reivindicacoes`: professor `turma_vinculada`; coordenação `nominal_auditado`, com
  `turma.reivindicacoes_lidas` na transação da leitura; o pedido traz nome, hora e `teveMatriculaErrada`
- [x] 8.2 — `POST reivindicacoes/decidir`, até 40 ids, uma transação por id: `update` condicional (id, escola, ano em
  curso, pendente e, para o professor, o `exists`). Aprovada: usuário, credencial, vínculo `aluno` confirmado com
  `decidido_em`, a `lista_nome` aprovada sem nome e matrícula, o contador de login zerado. Recusada: o nome volta a
  `livre`. Nas duas, hash, chave e `teve_matricula_errada` saem. Sem linha, uma leitura com o mesmo alcance,
  **antes** do estado, separa `ja_decidida` de `nao_encontrada`. `reivindicacao.decidida` com `decidida_como`
- [x] 8.3 — `GET minha-turma` (aluno, `proprio`): escola, turma e série, sem colegas. Passando de ~15 arquivos,
  sai como subtarefa separável, com I8 e P4
- [x] 8.4 — A prévia da lista (2.0) marca `ja_existe` para a matrícula de aluno aprovado nesta turma
- [x] 8.5 — Contratos `.strict()` e células; as rotas em `escola-montada.int.test.ts`, que fecha o A3 e o A4
- [x] 8.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sala/decisao.*`, `pedidos.controller.ts`, `minha-turma.*`; `packages/shared/src/sala/pedidos.ts`, `minha-turma.ts` | novo |
| `lista.repository.ts`, `acoes.ts`, `matriz*.ts` | alterado |
| `apps/api/test/decisao.int.test.ts`, `minha-turma.int.test.ts`; `escola-montada.int.test.ts` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| I6 | integração | o lote misto: oito `nao_encontrada` iguais ao aleatório, um `decidida`; o da coordenação com B |
| I8, P4 | integração | cada aluno vê a sua; ano encerrado e `GET turmas/:id`: 404; aluno no `decidir`, professor e coordenação no `minha-turma`: 404 |
| P3, E12 (pedidos) | integração | sem vínculo confirmado, 404; coordenação sem finalidade, `ENTRADA_INVALIDA`; duas disciplinas, cada pedido uma vez |
| E18, E22 | integração | as escritas da aprovação; " 123 " de ponta a ponta; o login logo depois da aprovação |
| E19 | integração | depois do `encerrar`, o aprovado aparece nos alunos do ano encerrado |
| E20, E25, E27 | integração | três aprovados, recusa devolve o nome, 0 e 41 ids; nome do colega; turma sem professor decidida pela coordenação |
| E6, R2, E7 (aprovado) | integração | `ja_existe`; nome aprovado recusado; retirar aprovado: `CONFLITO` |
| E21, E30 (resto) | integração | chave e `teve_matricula_errada` nulos depois de aprovar e de recusar; a auditoria sem o campo |
| A1 a A4 | integração | `reivindicacao.decidida`; `turma.reivindicacoes_lidas` a cada leitura, o professor sem; sentinela e log (com IP) em todas as rotas da A1 |
| I3, I9 | integração, unidade | escola B nos pedidos e em `minha-turma`; células |
| C3 | integração, em paralelo | aprovar × recusar, professor × coordenação, o mesmo lote duas vezes: exatamente uma auditoria e um usuário |
| log novo | integração | só ids (A4) |
| C12 (herdado da 2.0) | integração, com ponto de pausa | o avulso com a matrícula sendo aprovada: `CONFLITO`; a gravação: `CONFLITO` em outra turma, `ja_existe` na mesma |
| segunda camada (nota da 6.0) | integração, no repository | `chaveGravada`, `tomar` e o `DecisaoRepository` no contexto de A com a turma, o nome e o pedido de B (no ano de A e no de B) e com os de A noutro ano: nada lido nem escrito |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O `for share` no ano e o `encerrar` (10.0); as telas (12.0, 16.0); transferir ou desativar aluno (F2, F3).

## Divergências resolvidas nesta tarefa

Todas já estão na `techspec.md` (seções 4, 5 e 7), no `cenarios.md` (C12, A4) e no `docs/modelo-de-dados.md`.

- **O `update` condicional é um `select … for update` com as condições, e o `update` vem pela chave** (seção 5, passo
  6): o hash que vai à credencial sai na mesma escrita que decide, e o `returning` só devolve o valor novo. A semântica é
  a mesma: a decisão que chega ao mesmo tempo espera a trava e, relida a linha já decidida, sai sem linha (C3).
- **A corrida herdada da 2.0 (C12)**: sem trava nova. O avulso passa a conferir a credencial **depois** do `insert` (o
  `insert` no meio da aprovação espera o commit no índice único, e a conferência seguinte acha a credencial). A gravação e
  a prévia já estavam fechadas: leem a lista antes da credencial, cada uma num comando, e a matrícula sendo aprovada está
  sempre num dos dois. Cenário novo C12, com a gravação como guarda de regressão.
- **`reivindicacao.decidida`** leva, além de `decididaComo`, a turma, o estado e o `alunoId` criado (nulo na recusa): é o
  que liga o aluno à aprovação dele na pergunta de fechamento da regra 20. Sem nome, matrícula nem a marca.
- **O contador de login zerado é o da origem `outro`**: o `conhecido` só nasce de um login certo com a matrícula, que não
  existia antes da aprovação.
- **O vínculo do aluno tem quem aprovou em `criado_por`**; o `decidido_em` fecha o item do `TODO.md` (E19).
- **Contratos**: o decidir recebe `{ ids, decisao }`, sem id repetido (também em maiúsculas), e responde 200 com o id como
  o banco o guarda; a leitura traz só os pendentes, paginada por id. `minha-turma` traz o id da turma e, com dois vínculos
  confirmados, o mais novo.
- **Varredura transversal**: `abertaAoProfessor` (os pedidos e o decidir, que o professor também chama: o P1 pede com o
  aluno e com o professor sem vínculo) e `autor: 'aluno'` (`minha-turma`: o P1 pede com a coordenação e o professor, P4). O
  A4 procura o IP do `X-Forwarded-For` das varreduras, com a API confiando no 127.0.0.1.

## Mutações

Rodadas uma a uma, com o arquivo restaurado depois de cada uma. `decisao.int.test.ts` abrevia-se `decisao`; `minha-turma.int.test.ts`, `minha`.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `decisao.repository.ts:47` (escola no alcance) | `decisao` segunda camada (B no ano de B) |
| `decisao.repository.ts:48` (ano em curso no alcance) | `decisao` I6 (T5) |
| `decisao.repository.ts:49` (o `exists` do professor) | `decisao` I6 |
| `decisao.repository.ts:64` (turma do pedido no `exists`) | `decisao` I6 (T2) |
| `decisao.repository.ts:65` (usuário no `exists`) | `decisao` I6 (T2, com outro professor confirmado) |
| `decisao.repository.ts:66` (papel `professor` no `exists`) | `decisao` I6 (T6, vínculo de aluno do mesmo usuário) |
| `decisao.repository.ts:67` (`confirmado` no `exists`) | `decisao` I6 (T3, T4) |
| `decisao.repository.ts:109` (`pendente` no `travarPendente`) | `decisao` C3 (os quatro) |
| `decisao.repository.ts:110` (o `for update` do `travarPendente`) | `decisao` C3 com a aprovação parada (a recusa não espera na trava do pedido) |
| `decisao.repository.ts:128` (alcance antes do estado no `alcancavel`) | `decisao` I6 (os decididos de B e de T2 viram `ja_decidida`) |
| `decisao.repository.ts:150` (escola no `fechar`) | `decisao` segunda camada |
| `decisao.repository.ts:163`, `:176`, `:184` (escola em `nomeDoPedido`, `aprovarNome`, `devolverNome`) | `decisao` segunda camada (B no ano de B) |
| `decisao.repository.ts:163`, `:176`, `:184` (ano nos mesmos) | `decisao` segunda camada (A em outro ano) |
| `decisao.repository.ts:87` e `:88` (escola e ano nos `pendentes`) | `decisao` segunda camada |
| `decisao.repository.ts:89` (turma nos `pendentes`) | `decisao` A2 (o pedido da outra turma) |
| `decisao.repository.ts:90` (`pendente` nos `pendentes`) | `decisao` P3 (duas disciplinas: o decidido não volta) |
| `decisao.repository.ts:91` e `:94` (página e ordem) | `decisao` "a página" |
| `decisao.service.ts:70` (finalidade antes da turma) | `decisao` P3 (sem finalidade) |
| `decisao.service.ts:73` (a turma aberta com o alcance) | `decisao` E12 e P3 |
| `decisao.service.ts:76` (`turma.reivindicacoes_lidas`) | `decisao` A2 |
| `decisao.service.ts:75` (só a coordenação grava, e não o professor que manda finalidade) | `decisao` A2 |
| `decisao.service.ts:102` (id em minúsculas) | `decisao` E20 |
| `decisao.service.ts:142`, `:143`, `:152` (vínculo, nome aprovado, auditoria) | `decisao` E18 |
| `decisao.service.ts:147` (nome devolvido) | `decisao` E25 |
| `decisao.service.ts:109` (contador zerado) | `decisao` E18 e E22; só o primeiro do lote zerado: "E22 com o lote parado no meio" (duas aprovações) |
| `decisao.service.ts:103` (o erro de um id para o lote: o laço que engolisse o erro, seguisse e respondesse 500 no fim) | "E22 com o lote parado no meio" (o pedido depois do quebrado seria decidido) |
| `decisao.service.ts:107` (o zerar no `finally`, também com o lote parado no meio) | `decisao` "E22 com o lote parado no meio" |
| `decisao.service.ts:27` (`coordenacao` no decisor) | `decisao` E27 |
| `vinculo.repository.ts:99` (`confirmado`) | `decisao` E18 |
| `vinculo.repository.ts:101` (`decidido_em`) | `decisao` E19 |
| `lista.service.ts:46` (`ja_existe` do aprovado) | `decisao` E6 |
| `lista.service.ts:129` (credencial conferida antes do `insert`, a ordem da 2.0) | `decisao` C12 |
| `lista.repository.ts:74` (turma nas aprovadas) | `decisao` E6 (em outra turma, `matricula_em_uso`) |
| `minha-turma.repository.ts:30` (escola) | `minha` segunda camada |
| `minha-turma.repository.ts:31` (ano em curso) | `minha` I8 (ano encerrado) |
| `minha-turma.repository.ts:32` (usuário da sessão) | `minha` I8 (os dois alunos) |
| `minha-turma.repository.ts:33` (`confirmado`) | `minha` vínculo encerrado |
| `minha-turma.repository.ts:36` (o mais novo) | `minha` dois confirmados |
| `pedidos.controller.ts:26` (200 no decidir) | `decisao` E20, E25, E21 |
| `packages/shared/src/sala/pedidos.ts:50`, `:51`, `:52` (1, 40, sem repetir, também em maiúsculas) | `decisao` E20 |
| `packages/shared/src/sala/pedidos.ts:19` (`.strict()` da consulta) | nenhum sozinho: o `esquemaConsultaPaginada` já é estrito, e o `extend` mantém; o P3 com `escolaId` na consulta prova a consulta estrita (400), e fica vermelho só sem os dois |
| `matriz.ts` (células `reivindicacao` e `minha_turma`) | `matriz.test.ts` (expectativa e I9) |

Sem efeito observável, e por isso sem teste que as derrube sozinhas, declaradas como segunda camada: a escola e o ano do
`inner join` de `pendentes` (`decisao.repository.ts:84`) e das aprovadas (`lista.repository.ts:68`), a escola e o ano do
vínculo no `exists` do professor (`decisao.repository.ts:62`, `:63`, correlacionados ao pedido, cuja turma é de uma escola e
de um ano só), a escola da credencial e o ano nas aprovadas (`lista.repository.ts:71`, `:73`), que a FK composta e a turma
de um ano só já prendem; e o `inArray` das aprovadas (`lista.repository.ts:72`), que só recorta a consulta: sem ele, a leitura traz todas as aprovadas
da turma, e o `has` dá o mesmo resultado.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `tenancy-guardian`, 1ª | `estado = 'pendente'` e o ano no `where` do `fechar` | recusada: o `fechar` só roda na transação que travou a linha com essas condições, e as cláusulas repetidas não teriam teste que as derrubasse (regra 40); o docblock diz que ele fecha a linha que `travarPendente` travou |
| `tenancy-guardian`, 1ª; `revisor-geral`, 1ª | erro tipado no lugar do `throw new Error` da invariante quebrada | recusada: é invariante garantida pelos checks do banco, e não erro de domínio; o repositório usa `Error` nesses casos (`acesso da turma não gravado`, `vínculo não criado`), e o filtro global responde 500 sem o texto |
| `revisor-geral`, 1ª | a transação só para o professor na leitura | recusada: uma transação para os dois papéis deixa o código mais simples, e a leitura do professor é curta |
| `revisor-geral`, 1ª | o 5xx no meio do lote no docblock de `decidir`; a ordem do import no `sala.module.ts` | aplicadas |
| `infra-guardian`, 1ª | zerar os contadores depois do laço, juntos | aplicada, no `finally` (também com o lote parado no meio), com teste novo |
| `infra-guardian`, 1ª | o K2 do primeiro dia com o professor decidindo em lotes de 40 e o login logo depois | destino 9.0: anotada no `9_task.md` |
| `revisor-geral`, 2ª | `exigirEscolaDoContexto()` no `finally` só com aprovadas | recusada: a mesma chamada já rodou com sucesso na mesma requisição (a guarda gravou a escola, e o `alcanceDaSessao` e cada transação a leram), então ela não lança ali; mexer no código agora caducaria as seis aprovações sem mudar o comportamento |
| `infra-guardian`, 2ª | o p95 do `decidir` em lote de 40 também com o Redis de login lento | destino 9.0: somada à mesma nota do `9_task.md` |
| `privacy-guardian`, 1ª | a eliminação do aluno aprovado (FK da `lista_nome` e os pedidos dele) | destino 10.0 (10.3, V3) e `/validar`: a falha é fechada (volta atrás), e não há rota de eliminação na A1 |
| `privacy-guardian`, 1ª | o `alunoId` da auditoria como elo da pergunta de fechamento, no `docs/lgpd.md` | aplicada: linha "Auditoria" do `docs/lgpd.md` |
| `test-engineer`, 3ª | duas aprovações no lote do zerar; o corpo do 500 curto e tipado | aplicadas, no teste "E22 com o lote parado no meio" |
| `test-engineer`, 4ª | um pedido depois do quebrado no lote, que continua pendente | aplicada, no mesmo teste |
| `test-engineer`, 3ª | o `zerar` que nunca lança, com o Redis fora | já coberto: `contador-de-tentativas.test.ts:64-65` (Redis fora, `zerar` devolve `false` sem lançar) |
| `conformidade-reviewer`, 1ª | a marca de matrícula errada como fato sobre o pedido, e a recusa mostrada como decisão de pessoa | destino 16.0 (tela de pedidos) e 17.0 (página pública): anotadas nos dois `N_task.md` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-27 01:54:28 | 2026-09-27 01:58:04 | `test-engineer` | 1 | APROVADO | a0d1b513a08747869 |
| 2026-09-27 02:08:45 | 2026-09-27 02:09:21 | `test-engineer` | 2 | APROVADO | a35d490a9f9cbe946 |
| 2026-09-27 02:10:16 | 2026-09-27 02:11:00 | `conformidade-reviewer` | 1 | APROVADO | a721d391a216731da |
| 2026-09-27 02:10:05 | 2026-09-27 02:11:16 | `tenancy-guardian` | 1 | APROVADO | a30bdaf905fe9884e |
| 2026-09-27 02:09:59 | 2026-09-27 02:11:23 | `revisor-geral` | 1 | APROVADO | a7429ef99b160009e |
| 2026-09-27 02:10:10 | 2026-09-27 02:11:51 | `privacy-guardian` | 1 | APROVADO | a0d99023075424078 |
| 2026-09-27 02:10:22 | 2026-09-27 02:12:23 | `infra-guardian` | 1 | APROVADO | af64ba438520d6343 |
| 2026-09-27 02:24:04 | 2026-09-27 02:24:48 | `test-engineer` | 3 | APROVADO | ad286f63e6b12eb23 |
| 2026-09-27 02:35:06 | 2026-09-27 02:35:29 | `test-engineer` | 4 | APROVADO | a8a240ffa10094fed |
| 2026-09-27 02:45:31 | 2026-09-27 02:45:48 | `test-engineer` | 5 | APROVADO | a14d9afd2b1fd83fc |
| 2026-09-27 02:46:14 | 2026-09-27 02:46:35 | `tenancy-guardian` | 2 | APROVADO | a32260d3e1910af41 |
| 2026-09-27 02:46:20 | 2026-09-27 02:46:45 | `privacy-guardian` | 2 | APROVADO | a858dac4a9f185fdd |
| 2026-09-27 02:46:25 | 2026-09-27 02:46:45 | `conformidade-reviewer` | 2 | APROVADO | a53537b3eea3e5291 |
| 2026-09-27 02:46:30 | 2026-09-27 02:46:47 | `infra-guardian` | 2 | APROVADO | a5b6024066bef8483 |
| 2026-09-27 02:46:09 | 2026-09-27 02:46:55 | `revisor-geral` | 2 | APROVADO | a0bbde5bcab9f1abc |
