# Tarefa 10.0 — Virada de ano, eliminação e expurgo alcançam as tabelas novas

**Funcionalidade:** apresentacao-escola · **Depende de:** 8.0 · **Paralelo com:** 9.0, 11.0 a 16.0
**Subagentes obrigatórios:** `privacy-guardian`, `tenancy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Encerrar o ano revoga os acessos, fecha os pedidos pendentes sem decisão humana e apaga os nomes não aprovados; a
eliminação do aluno leva a linha da lista e os pedidos dele; o expurgo alcança o acesso da turma e o convite de
professor; e nenhuma reivindicação ou aprovação escapa do ano que está sendo encerrado.

## Contexto necessário

- `docs/lgpd.md`, as linhas da A1 (retenção de cada uma)
- `techspec.md` seções 3 (FKs `set null`), 5 (passos 4 e 6: o `for share` no ano) e 7 ("Virada de ano", "Nome
  livre sai de fato", "Eliminação", "Retenção")
- `cenarios.md`: V1, V3, V4, V5, C10
- Regras 20 (itens 15, 16), 40, 60 (item 5), 70 (item 2: encerrar não é recusar), 80 (item 7)
- Código:
  - `apps/api/src/estrutura/ano-letivo.service.ts` e `ano-letivo.repository.ts` — o `encerrar`
  - `TurmaRepository.travarAnoEmCurso` — o modelo do `for share` no ano
  - `apps/api/src/sessao/ciclo-de-vida.service.ts` e `ciclo-de-vida.repository.ts` — o `eliminar`
    (`apagarUsuario`, `apagarVinculos`)
  - `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts` (`AlvoDoExpurgoDeAcesso` e o `@SemEscopo`) e
    `apps/worker/src/processadores/expurgar-acesso.ts`
  - Testes: `apps/api/test/virada-do-ano.int.test.ts`, `ciclo-de-vida.int.test.ts`,
    `apps/worker/test/expurgo-de-acesso.int.test.ts`; `apps/api/test/gatilho-de-parada.ts`

## Notas da 6.0 (`privacy-guardian` e `test-engineer`)

- O check `reivindicacao_pendente_com_nome` (0021) recusa com 23514 o `delete` do nome de um pedido pendente (o `set null`
  da FK). O `encerrar` precisa fechar os pendentes como `encerrada` **antes** de apagar os nomes livres e reivindicados,
  e a eliminação precisa apagar os pedidos do aluno **antes** da `lista_nome` dele; senão o 23514 sobe como 500. O V1 e
  o V3 provam a ordem (a mutação que inverte as duas escritas deixa o teste vermelho).
- Se um caminho futuro esbarrar no 23514 do check, ele não sai como 500: o erro sai tipado (`privacy-guardian`, 2ª rodada
  da 6.0).

## Nota da 8.0 (`privacy-guardian`, 1ª rodada)

- Desde a 8.0 existe aluno aprovado com linha `aprovado` na `lista_nome` (FK de `usuario_id` sem ação) e pedidos que
  apontam para ela: o `eliminar` de hoje falha fechado (23503, volta atrás) nesse aluno. A 10.3 (V3) apaga a linha e os
  pedidos antes do usuário, e o `/validar` confere, porque o `docs/lgpd.md` já promete a eliminação junto com o usuário.

## Subtarefas

- [x] 10.1 — `encerrar`, na mesma transação: revoga os acessos do ano; os pendentes viram `encerrada`, sem hash,
  chave, `teve_matricula_errada` nem `decidida_por`; apaga os nomes livres e reivindicados; o recusado fica com
  `lista_nome_id` nulo
- [x] 10.2 — `for share` no ano dentro da transação de `salas/reivindicar` (6.0) e de cada id do `decidir` (8.0)
  - Da 4.0 (política de trava das escritas em turma, seção 7c da `techspec.md`): o gerar acesso já trava o ano; a
    gravação e o avulso da lista (2.0) fazem nascer nome livre no ano e ainda não travam. Decidir aqui, com o C10, se
    entram no `for share`. O `encerrar` continua mudando o ano antes de qualquer outra escrita (é o que evita ordem cruzada
    com o gerar, que pega o ano antes da turma)
- [x] 10.3 — Eliminação do aluno: antes do usuário, na mesma transação, apaga a `lista_nome` dele e os pedidos que
  apontam para ela. Do professor: `criado_por` e `decidida_por` ficam nulos pela FK
- [x] 10.4 — Expurgo: `acesso_turma` sai 30 dias depois de vencer ou ser revogado; o convite de professor entra no
  alvo do convite; o `@SemEscopo` reescrito com as tabelas novas; o lote com `order by`
- [x] 10.5 — Declarar por escrito: a retenção de "vigência + 5 anos" do pedido decidido não tem expurgo na A1 —
  nota em `docs/lgpd.md` na linha do pedido e item no `TODO.md` (F3)
- [x] 10.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/estrutura/ano-letivo.service.ts`, `ano-letivo.repository.ts` | alterado |
| `apps/api/src/sala/reivindicacao.repository.ts`, `decisao.repository.ts` | alterado |
| `apps/api/src/sessao/ciclo-de-vida.service.ts`, `ciclo-de-vida.repository.ts` | alterado |
| `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`, `apps/worker/src/processadores/expurgar-acesso.ts` | alterado |
| `apps/api/test/virada-do-ano.int.test.ts`, `ciclo-de-vida.int.test.ts`, `apps/worker/test/expurgo-de-acesso.int.test.ts` | alterado |
| `docs/lgpd.md`, `TODO.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| V1 | integração | cada escrita do `encerrar`, com a anulação do `teve_matricula_errada` e o `set null` do recusado; depois, link e código `NAO_ENCONTRADO` e o pedido `nao_encontrada` |
| V3 | integração | pelos ids guardados antes, nada sobra; o marcador do nome não sobra em tabela nenhuma; falha no meio não apaga nada |
| V4 | integração | eliminar o professor não falha, as colunas ficam nulas, a auditoria guarda o id |
| V5 | integração, em paralelo | dia 29 fica, dia 31 sai; dois expurgos com `Promise.all` não falham nem apagam em dobro |
| C10 | integração, em paralelo | `encerrar` × reivindicar e `encerrar` × aprovar: nunca pendente com hash nem aluno aprovado no ano encerrado |
| log novo | integração | o expurgo loga só contagens por alvo; o `encerrar`, só ids |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O pedido do titular (acesso e portabilidade) cobrindo as tabelas novas: F3, já no `TODO.md`. O expurgo dos pedidos
decididos depois de 5 anos. O aluno do ano seguinte com a matrícula já em `credencial_matricula` (F2).

## Plano e autoconferência (antes de codar)

**Arquivos.** `AnoLetivoRepository.virarSala` (as três escritas da virada, na ordem, dentro da transação do `encerrar`) e
`AnoLetivoService.encerrar`; a trava do ano (`TurmaRepository.travarAnoEmCurso`, que já existe) no começo da transação de
`ReivindicacaoService`, de `DecisaoService.#decidirUm` e da gravação e do avulso de `ListaService`;
`CicloDeVidaRepository.apagarDaListaDeNomes` e o `eliminar`; o alvo `acesso_turma` e o `order by` do convite no
`ExpurgoDeAcessoRepository`, e o total novo no processador; as auditorias `ano_letivo.encerrado` e `usuario.eliminado` com as
contagens novas (`acoes.ts`, sem campo proibido: `linhasDaListaApagadas`, não "nomes"). Documentos: `techspec.md` (4, 7,
7c), `cenarios.md` (V1, V3, V5, C10), `docs/modelo-de-dados.md`, `docs/lgpd.md`, `docs/runbook.md`, `TODO.md`.

**Testes.** V1 (com o acesso já revogado, o ano de 2025 montado pelo banco e o contexto de outra escola), C10 (seis: os dois
arranjos da reivindicação e da aprovação, e o avulso e a gravação parados), o log novo (no V1) em `virada-do-ano.int.test.ts`;
V3 (com a falha injetada, o colega aprovado e o contexto de outra escola) e V4 em `ciclo-de-vida.int.test.ts`; V5 (sementes
novas, lote ordenado do convite e do acesso, dois expurgos em paralelo com a soma exata) em `expurgo-de-acesso.int.test.ts`.

**Autoconferência.**
- *Segundo dado*: a virada tem um acesso já revogado no mesmo ano (o `isNull`), outro ano da escola com acesso, pedido e
  nomes (o filtro do ano em cada escrita) e o contexto de outra escola (a escola); o recusado e o aprovado ao lado do
  pendente (o `estado = 'pendente'`); o livre e o reivindicado (cada valor do `inArray`). A eliminação tem o colega aprovado
  na mesma turma (o `usuario_id`) e o contexto de outra escola. O expurgo tem o acesso revogado depois de vencido (o
  `least`), os dois lados dos 30 dias e o convite de professor.
- *Checagem anterior*: no C10 com o `encerrar` parado, a reivindicação passa pelo `AcessoDaSala` (o ano ainda está em curso
  sem commit) e chega à trava; a decisão passa pela guarda pelo mesmo motivo. No V1, o `decidir` depois vem com 2027 aberto:
  sem ano em curso, a rota inteira daria `NAO_ENCONTRADO` antes do repository.
- *Trava pelo efeito*: nenhum C10 afirma a espera. O teste espera "terminou ou parou numa trava" e confere o efeito: sem a
  trava do ano, o `encerrar` falha com o 23514 (a reivindicação), deixa o vínculo do aprovado `confirmado` no ano encerrado
  (a aprovação), ou termina antes e deixa o nome livre (a lista); a reivindicação sai `enviado` e a aprovação `decidida`.
- *Carga (infra)*: o `FOR SHARE` no ano é um `select` pela chave primária por transação, na linha do ano da escola; várias
  transações ao mesmo tempo seguram a mesma trava compartilhada (MultiXact), a ~7/s no primeiro dia (seção 7c) e até 40 por
  lote do `decidir`, uma de cada vez. Só o `encerrar` e o `abrir` escrevem na linha do ano, e o `abrir` escreve em outra linha.
  Nenhuma ordem cruzada: todas pegam o ano antes da turma, do pedido ou do nome, e o `encerrar` muda o ano antes de tudo.
- *Privacidade*: a virada e a eliminação não logam; as auditorias levam só contagens; o V1 procura nomes, matrículas, token e
  código no log capturado e na auditoria da virada; o V3 procura o marcador em sete tabelas da escola.

## Divergências resolvidas nesta tarefa

- **A trava do ano reaproveita `TurmaRepository.travarAnoEmCurso`**, chamada dos services, em vez de um método novo em
  `reivindicacao.repository.ts` e `decisao.repository.ts` (os dois ficam sem mudança): é a peça que o criar turma, o vínculo e
  o gerar acesso já usam. As escritas da virada ficam em `AnoLetivoRepository.virarSala`, como a "Arquivos previstos" diz.
- **10.2, decidido com o C10: a gravação e o avulso da lista travam o ano em `FOR SHARE`**, antes da turma. Sem isso, o nome
  gravado junto com o encerramento nasce livre no ano encerrado, que o `docs/lgpd.md` promete apagar. O C10 ganhou os dois
  casos, e a seção 7c da `techspec.md` e a linha do C10 no `cenarios.md` dizem isso.
- **A reivindicação que acha o ano fora de curso volta atrás como o `update` sem linha** (`NaoGravou`, o antigo
  `NomeNaoTomado`): relê a chave e, sem ela, `REIVINDICACAO_RECUSADA`, contando no teto da turma (rodou o hash). É a resposta
  que a Tech Spec já dá ao "nome de ano encerrado". A decisão que acha o ano fora de curso sai `nao_encontrada`, a resposta
  do pedido de outro ano.
- **O pendente fechado como `encerrada` fica com `decidida_em` e `decidida_como` nulos**, além do `decidida_por`: não houve
  decisão (regra 70, item 2).
- **Auditorias com contagens novas**: `ano_letivo.encerrado` com `acessosRevogados`, `pedidosEncerrados` e
  `linhasDaListaApagadas`; `usuario.eliminado` com `linhaDaListaApagada` e `pedidosApagados`. Só números e sim ou não.
- **O convite ganhou `order by` pelo prazo** (o "lote com `order by`" da 10.4), como o `convite_operador`; o `acesso_turma`
  nasce com ele. Nenhum dos dois tem índice pelo prazo: são tabelas pequenas (um convite em aberto por pessoa da equipe, um
  acesso não revogado por turma, e os fechados saem em 30 dias), e a ordenação lê a tabela inteira de madrugada.
- **E5 de `lista.int.test.ts` mudou**: ele conferia que o nome livre de 2026 continuava no banco depois do encerramento, que
  era o comportamento anterior à 10.1 (o `privacy-guardian` da 2.0 já apontava). Agora confere que ele saiu, e que a
  matrícula entra em 2027.
- **O 23514 do `reivindicacao_pendente_com_nome` não ganhou tradução** (nota da 6.0): nos dois caminhos que apagam nome, a
  ordem é garantida por construção e provada pela mutação (inverter as escritas deixa o V1 e o C10 vermelhos), e a trava do ano
  impede o pendente que nasceria entre elas; o `privacy-guardian` da 6.0 (2ª rodada) aceitou a mutação como a cobertura. Se
  acontecesse, seria invariante quebrada, e sai como os outros 500 do filtro global, sem dado.

## Mutações

Rodadas uma a uma, com o arquivo restaurado depois; as de FK, trocando a restrição no banco de teste e restaurando.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `ano-letivo.repository.ts:82`, o `update` do acesso (`where false`) | V1 |
| `ano-letivo.repository.ts:82`, `isNull(revogadoEm)` | V1 (a hora do já revogado) |
| `ano-letivo.repository.ts:82`, o ano | V1 borda (2025), isolamento |
| `ano-letivo.repository.ts:82`, a escola | isolamento (`virarSala` no contexto de A) |
| `ano-letivo.repository.ts:84-87`, fechar os pendentes (`where false`) | V1, C10 (reivindicação parada), C10 (`encerrar` parado × aprovar) |
| `ano-letivo.repository.ts:86`, `teveMatriculaErrada: null` | V1, C10 (os mesmos dois), pelo check `reivindicacao_segredo_so_pendente` |
| `ano-letivo.repository.ts:87`, `estado = 'pendente'` | V1, isolamento |
| `ano-letivo.repository.ts:87`, o ano | V1 borda (2025) |
| `ano-letivo.repository.ts:87`, a escola | isolamento |
| `ano-letivo.repository.ts:84-91`, a ordem (apagar antes de fechar) | V1, isolamento, C10 (os mesmos dois) |
| `ano-letivo.repository.ts:89-91`, apagar os nomes (`where false`) | V1, C10 (os seis) |
| `ano-letivo.repository.ts:91`, sem `reivindicado` | V1, C10 (reivindicação parada, aprovação com o `encerrar` parado) |
| `ano-letivo.repository.ts:91`, sem `livre` | V1, C10 (reivindicação recusada, avulso, gravação) |
| `ano-letivo.repository.ts:91`, o ano | V1 borda (2025) |
| `ano-letivo.repository.ts:91`, a escola | isolamento |
| `ano-letivo.service.ts:57`, sem `virarSala` | os testes da virada com sala em `virada-do-ano.int.test.ts` (V1, C10, clique duplo com a sala) |
| `0021_reivindicacao.sql`, `on delete set null (lista_nome_id)` trocado por sem ação | V1, isolamento, C10 (os mesmos dois) |
| `reivindicacao.service.ts:118`, sem a trava do ano | C10 (reivindicação parada; `encerrar` parado); o C10 de `reivindicacao.service.test.ts` |
| `decisao.service.ts:132`, sem a trava do ano | C10 (aprovação parada; `encerrar` parado) |
| `lista.service.ts:101`, sem a trava do ano na gravação | C10 (gravação) |
| `lista.service.ts:131`, sem a trava do ano no avulso | C10 (avulso) |
| `ciclo-de-vida.repository.ts:107-109`, apagar os pedidos (`where false`) | V3, isolamento da eliminação |
| `ciclo-de-vida.repository.ts:111`, apagar a linha | V3, isolamento da eliminação |
| `ciclo-de-vida.repository.ts:106`, a escola de `doUsuario` | isolamento da eliminação |
| `ciclo-de-vida.repository.ts:106`, o usuário de `doUsuario` (`usuario_id is not null`) | V3 (o colega aprovado), V4 |
| `ciclo-de-vida.repository.ts:106`, `doUsuario` preso ao ano em curso (mutação que acrescenta o filtro) | V3, borda da virada (aluno aprovado em 2026, eliminado com 2027 em curso) |
| `ciclo-de-vida.repository.ts:109`, a escola do pedido | nenhum: segunda camada, a subconsulta já vem de `doUsuario`, com a escola, o id da linha é único, e a FK composta `(escola_id, lista_nome_id)` prende o pedido à linha da mesma escola |
| `ciclo-de-vida.service.ts:72`, sem `apagarDaListaDeNomes` | V3 |
| `0020_acesso_turma.sql`, `on delete set null ("criado_por")` trocado por sem ação | V4 |
| `0021_reivindicacao.sql`, `on delete set null ("decidida_por")` trocado por sem ação | V4 |
| `expurgo-de-acesso.repository.ts:84`, `order by` do convite | lote ordenado (A1) |
| `expurgo-de-acesso.repository.ts:94`, `order by` do acesso | lote ordenado (A1) |
| `expurgo-de-acesso.repository.ts:93`, `least` → `coalesce` | V5 (paralelo), idempotência, concorrência, lotes, trilha completa, o que nunca sai |
| `expurgo-de-acesso.repository.ts:93`, 30 → 28 dias | os mesmos seis |
| `expurgar-acesso.ts:62`, `acesso_turma` sem `apagar` | log, idempotência, concorrência, lotes, trilha completa, o que nunca sai |
| `expurgar-acesso.ts:72`, total do acesso trocado com o da operação | log |

## Recomendações sem aplicar

Aplicadas depois das aprovações, num lote só de comentários: as linhas longas do JSDoc de `reivindicacao.service.ts` e de
`lista.service.ts`, o comentário repetido de `decisao.service.ts` e o do índice em `ciclo-de-vida.repository.ts`
(`revisor-geral`, 1ª; `tenancy-guardian`, `privacy-guardian` e `infra-guardian`, 1ª); os números de linha da tabela de
Mutações. Da 1ª rodada do `test-engineer`, aplicadas antes da 2ª: o log capturado não vazio no V1, o clique duplo com a sala
e a FK composta citada na tabela.

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `infra-guardian`, 1ª | Índice parcial `(escola_id, usuario_id) where usuario_id is not null` em `lista_nome`, para a busca da eliminação e a FK | `TODO.md` (Infra e operação): na próxima migration de `lista_nome`; sem migration nesta tarefa, e a eliminação é rara e presa à escola |
| `infra-guardian`, 1ª | Índice de expressão pelo prazo no `acesso_turma` e no `convite`, se o "Gerar novo" virar rotina diária | `TODO.md` (Infra e operação), condicionado ao volume |
| `infra-guardian`, 1ª | Uma linha no runbook de que encerrar o ano em horário de aula segura a sala da escola, e a duração da virada no log | `TODO.md` (Infra e operação): o encerramento é um clique por ano, e a tela dele (13.0) é quem pode avisar; o runbook conta como código para o hook e a duração pede um evento de log novo |
| `privacy-guardian`, 1ª | O expurgo do F3 com a retenção configurável por escola | Já está no item do `TODO.md` criado nesta tarefa; fica para o `/retro` |
| `revisor-geral`, 1ª | O V5 em paralelo conta os vencidos do banco inteiro; outro arquivo que apagasse um acesso vencido ao mesmo tempo mudaria a soma | Recusada: nenhum outro arquivo cria `acesso_turma` vencido há mais de 30 dias (os outros vencem há segundos ou há um dia), e a soma exata sobre o banco inteiro é o que prova "não apaga em dobro"; filtrar pelos ids semeados não serve, porque as duas execuções apagam todos os vencidos |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-27 06:31:16 | 2026-09-27 06:34:24 | `test-engineer` | 1 | REPROVADO | afd5f243ef261ee7a |
| 2026-09-27 06:45:07 | 2026-09-27 06:45:47 | `test-engineer` | 2 | APROVADO | ab4ca6c2360a4b5ce |
| 2026-09-27 06:46:06 | 2026-09-27 06:46:59 | `tenancy-guardian` | 1 | APROVADO | a0d00dc5800e4c45c |
| 2026-09-27 06:46:00 | 2026-09-27 06:47:10 | `privacy-guardian` | 1 | APROVADO | a93497c7e79fc3f5d |
| 2026-09-27 06:46:12 | 2026-09-27 06:48:14 | `infra-guardian` | 1 | APROVADO | a9ccd3ff6304b023a |
| 2026-09-27 06:45:55 | 2026-09-27 06:48:21 | `revisor-geral` | 1 | APROVADO | a3645523b7518d38d |
| 2026-09-27 06:58:43 | 2026-09-27 06:59:24 | `revisor-geral` | 2 | APROVADO | a6ab08cfeba8a31ad |
| 2026-09-27 07:09:04 | 2026-09-27 07:09:17 | `revisor-geral` | 3 | APROVADO | a1f9a6ae5edb44e40 |
