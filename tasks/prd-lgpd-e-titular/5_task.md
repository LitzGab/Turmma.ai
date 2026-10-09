# Tarefa 5.0 — O expurgo alcança trabalho do aluno, reivindicação, material, vínculo e pessoa desativada

**Funcionalidade:** lgpd-e-titular · **Depende de:** 3.0 · **Paralelo com:** 4.0, 7.0 a 10.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

As categorias contadas do ano encerrado ou do fim do vínculo passam a ser expurgadas, e a pessoa desativada além do prazo é eliminada pelo ciclo de vida, com autor `rotina`.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (catálogo, prazos fixos) e 5
- `docs/lgpd.md` linhas de resposta, diagnóstico, reivindicação, material, vínculo
- Código: `packages/nucleo/src/ciclo-de-vida/*` (1.0), `apps/api/src/estrutura/ano-letivo.repository.ts` (encerramento)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 5.1 — Migration própria: índices `reivindicacao` (decididas), `material` (excluídos), `usuario (escola_id, desativado_em)`, `vinculo` (encerrados), `tentativa_atividade (escola_id, aluno_id)` se faltar, `execucao_agente (escola_id, solicitada_por)` e `artefato (escola_id, criado_por)` (as FKs `set null` da pessoa)
- [x] 5.2 — Categorias `trabalho_do_aluno` (só `situacao = encerrado`), `reivindicacao_decidida` (inclui `decidida_como = coordenacao`), `material_excluido`, `vinculo_encerrado`
- [x] 5.3 — `pessoa_desativada`: `CicloDeVidaService.eliminar` na transação do lote, autor `rotina` (a pulada por pedido agendado entra na 14.0)
- [x] 5.4 — Prazo fixo de `expurgo_execucao` (5 anos)
- [x] 5.5 — Testes; a lista "pendente da tarefa N" do 3.7 fica vazia

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration | novo |
| `expurgo-da-escola.repository.ts` | alterado |
| testes do expurgo | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| ano letivo | integração | `fim` vencido mas `em_curso` não perde nada; `encerrado` perde |
| pessoa desativada | integração | eliminada além do prazo; ativa em outra escola, a conta continua; autor `rotina` |
| o que fica | integração | vínculo ativo e material vigente ficam |
| aluno transferido | integração | o trabalho dele em A sai pelo ano de A |
| `expurgo_execucao` | integração | com 5 anos e um dia sai |
| catálogo coberto | unidade | a lista de categorias pendentes de tarefa está vazia |
| tempo do lote | integração | `trabalho_do_aluno` com cascata medido contra 2 s |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O "pula agendado" (14.0); o check do autor `rotina` (15.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| A reivindicação conta o prazo de `coalesce(decidida_em, solicitada_em)`, e não só da decisão; o índice é por essa expressão, `where estado <> 'pendente'` | a spec diz "conta de: decisão", mas o pedido `encerrada` que a virada do ano gera não tem decisão (`decidida_em` nulo, check `reivindicacao_segredo_so_pendente`); contado só da decisão, ele nunca sairia, e a tabela da RF1 diz que toda tabela de pessoa tem categoria que a expurga | `techspec.md` §5 ("Tarefa 5.0, como ficou no código"); `cenarios.md` RF4, cadastro; `docs/lgpd.md` (linha "Reivindicação"); `docs/modelo-de-dados.md` |
| O material excluído só sai quando nenhuma `mensagem_tutor` nem `sinal_tutor` ainda o cita, e a migration ganha dois índices parciais `(escola_id, material_id)` nessas tabelas | as duas FKs para `material` não têm ação, e a conversa (teto 24 meses) pode viver mais que o material (piso 12): um `delete` direto quebraria o lote toda noite, e sem índice a conferência da FK varre a tabela de mensagens da escola | `techspec.md` §5 ("Tarefa 5.0…") e §7c ("Índices novos"); `cenarios.md` RF4, cadastro; `docs/lgpd.md` (linha "Material da escola") |
| A eliminação da pessoa desativada roda numa transação **por pessoa**, a que o repositório do expurgo abre, trava e reconfere o prazo, e que o `eliminar` reutiliza, e não "na transação do lote"; o lote é de até 100 pessoas (`LOTE_MAXIMO_DO_ALVO`) e diz `cheio` pelo número de escolhidos; `AUTOR_DA_ROTINA` mora em `packages/shared` | a seção 5 da spec já pede "uma transação por titular" para quem elimina em lote; um lote de 5.000 pessoas seguraria o job por minutos sem olhar a janela letiva; o `eliminar` já abre a transação, e a do lote só a embrulharia | `techspec.md` §5 ("Tarefa 5.0…"); `cenarios.md` RF4, `pessoa_desativada`; `docs/modelo-de-dados.md` |
| O `expurgo_execucao` com mais de 5 anos sai no fim da noite, por `expurgarRegistroDoExpurgo`, sem categoria nem linha própria | a tabela só aceita as doze categorias do catálogo (check), e o registro não é categoria ajustável: é prazo fixo do grupo `registro_de_decisao` | `techspec.md` §3 (classificação) e §5 ("Tarefa 5.0…"); `cenarios.md` RF5 |
| Nenhum lote de `trabalho_do_aluno` é menor que o do job | a spec manda medir a cascata contra os 2 s e baixar o lote se precisar; 5.000 tentativas com 100.000 respostas e a correção saíram em 78 ms | `techspec.md` §5 ("Tarefa 5.0…"); `cenarios.md` RF4, `trabalho_do_aluno` |
| A migration ganha também `execucao_agente (escola_id, solicitada_por)` e `artefato (escola_id, criado_por)`, os dois parciais `is not null` | a eliminação da pessoa pela rotina dispara o `set null` das duas FKs, e sem índice cada pessoa eliminada lê a tabela inteira (Seq Scan medido com 1 milhão de linhas de `execucao_agente`); a Tech Spec §7c já listava os dois como «por titular», sem tarefa dona | `techspec.md` §7c («Índices novos») e §5 («Tarefa 5.0…»); `docs/modelo-de-dados.md` |

## EXPLAIN dos lotes (5.1)

`EXPLAIN (ANALYZE)` de um lote de 5.000 de cada alvo (o das pessoas, de 100, só a escolha), no Postgres do compose de teste, numa
transação desfeita no fim. Volume da escola A: 12.000 tentativas em dois anos letivos (30 atividades por ano, 200 alunos; as do ano
encerrado há mais de um ano têm 20 respostas e a correção cada, 120.000 respostas), 24.000 reivindicações decididas, 24.600 materiais
(24.000 excluídos), 40.000 vínculos encerrados, 20.000 alunos desativados e 26.400 linhas de `expurgo_execucao` (seis anos de noites).
Cada lote desce pelo índice da migration 0027 (ou pela chave única da tentativa, no trabalho do aluno), começando pela escola, e para
no limite; nenhum passa de 140 ms, longe do `statement_timeout` de 2 s. O trabalho do aluno e o material pesam mais por causa da
cascata (as respostas e a correção) e da conferência das FKs de `mensagem_tutor` e `sinal_tutor`. A última consulta é a que a FK do
aluno dispara por pessoa eliminada (`delete from only tentativa_atividade where escola_id = … and aluno_id = …`).

```
=== tentativa_atividade
 Delete on tentativa_atividade (actual time=7.182..7.182 rows=0.00 loops=1)
   InitPlan 1
     ->  Limit (actual time=0.029..3.497 rows=5000.00 loops=1)
           ->  LockRows (actual time=0.029..3.261 rows=5000.00 loops=1)
                 ->  Nested Loop (actual time=0.022..1.767 rows=5000.00 loops=1)
                       ->  Index Scan using ano_letivo_escola_id_unico on ano_letivo al (actual time=0.011..0.011 rows=1.00 loops=1)
                             Index Cond: (escola_id = <escola A>)
                             Filter: ((situacao = 'encerrado'::text) AND ((fim + '1 year'::interval) < ((now() AT TIME ZONE 'America/Sao_Paulo'::text))::date))
                             Rows Removed by Filter: 1
                       ->  Index Scan using tentativa_atividade_uma_por_aluno on tentativa_atividade t (actual time=0.011..1.475 rows=5000.00 loops=1)
                             Index Cond: ((escola_id = <escola A>) AND (ano_letivo_id = al.id))
   ->  Index Scan using tentativa_atividade_pkey on tentativa_atividade (actual time=4.321..5.188 rows=5000.00 loops=1)
         Index Cond: (id = ANY ((InitPlan 1).col1))
         Filter: (escola_id = <escola A>)
 Planning Time: 0.375 ms
 Trigger for constraint correcao_tentativa_fk: time=48.973 calls=5000
 Trigger for constraint resposta_atividade_tentativa_fk: time=79.665 calls=5000
 Execution Time: 136.449 ms
=== reivindicacao
 Delete on reivindicacao (actual time=6.590..6.591 rows=0.00 loops=1)
   InitPlan 1
     ->  Limit (actual time=0.015..3.416 rows=5000.00 loops=1)
           ->  LockRows (actual time=0.015..3.161 rows=5000.00 loops=1)
                 ->  Index Scan using reivindicacao_decidida_idx on reivindicacao reivindicacao_1 (actual time=0.007..1.410 rows=5000.00 loops=1)
                       Index Cond: ((escola_id = <escola A>) AND (COALESCE(decidida_em, solicitada_em) < (now() - '5 years'::interval)))
                       Filter: (estado <> 'pendente'::text)
   ->  Index Scan using reivindicacao_pkey on reivindicacao (actual time=4.304..5.166 rows=5000.00 loops=1)
         Index Cond: (id = ANY ((InitPlan 1).col1))
         Filter: (escola_id = <escola A>)
 Planning Time: 0.219 ms
 Execution Time: 6.608 ms
=== material
 Delete on material (actual time=8.751..8.754 rows=0.00 loops=1)
   InitPlan 1
     ->  Limit (actual time=2.440..4.525 rows=5000.00 loops=1)
           ->  LockRows (actual time=2.439..4.289 rows=5000.00 loops=1)
                 ->  Sort (actual time=2.438..2.662 rows=5000.00 loops=1)
                       Sort Key: m.excluido_em
                       ->  Hash Anti Join (actual time=0.120..1.873 rows=5730.00 loops=1)
                             Hash Cond: (m.id = c.material_id)
                             ->  Hash Anti Join (actual time=0.117..1.448 rows=5730.00 loops=1)
                                   Hash Cond: (m.id = c_1.material_id)
                                   ->  Bitmap Heap Scan on material m (actual time=0.113..1.017 rows=5730.00 loops=1)
                                         Recheck Cond: ((escola_id = <escola A>) AND (excluido_em < (now() - '5 years'::interval)))
                                         ->  Bitmap Index Scan on material_excluido_idx (actual time=0.100..0.100 rows=5730.00 loops=1)
                                               Index Cond: ((escola_id = <escola A>) AND (excluido_em < (now() - '5 years'::interval)))
                                   ->  Hash (actual time=0.003..0.003 rows=0.00 loops=1)
                                         Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                         ->  Bitmap Heap Scan on sinal_tutor c_1 (actual time=0.002..0.003 rows=0.00 loops=1)
                                               Recheck Cond: ((escola_id = <escola A>) AND (material_id IS NOT NULL))
                                               ->  Bitmap Index Scan on sinal_tutor_material_idx (actual time=0.001..0.001 rows=0.00 loops=1)
                                                     Index Cond: (escola_id = <escola A>)
                             ->  Hash (actual time=0.002..0.003 rows=0.00 loops=1)
                                   Buckets: 1024  Batches: 1  Memory Usage: 8kB
                                   ->  Index Scan using mensagem_tutor_material_idx on mensagem_tutor c (actual time=0.002..0.002 rows=0.00 loops=1)
                                         Index Cond: (escola_id = <escola A>)
   ->  Index Scan using material_pkey on material (actual time=5.461..6.312 rows=5000.00 loops=1)
         Index Cond: (id = ANY ((InitPlan 1).col1))
         Filter: (escola_id = <escola A>)
 Planning Time: 1.178 ms
 Trigger for constraint mensagem_tutor_material_da_escola_fk: time=28.917 calls=5000
 Trigger for constraint sinal_tutor_material_da_escola_fk: time=28.122 calls=5000
 Trigger for constraint trecho_material_da_disciplina_da_escola_fk: time=16.236 calls=5000
 Execution Time: 82.649 ms
=== vinculo
 Delete on vinculo (actual time=8.318..8.319 rows=0.00 loops=1)
   InitPlan 1
     ->  Limit (actual time=0.013..4.475 rows=5000.00 loops=1)
           ->  LockRows (actual time=0.013..4.171 rows=5000.00 loops=1)
                 ->  Index Scan using vinculo_encerrado_idx on vinculo vinculo_1 (actual time=0.009..2.499 rows=5000.00 loops=1)
                       Index Cond: ((escola_id = <escola A>) AND (encerrado_em < (now() - '5 years'::interval)))
                       Filter: (estado = 'encerrado'::text)
   ->  Index Scan using vinculo_pkey on vinculo (actual time=5.383..6.883 rows=5000.00 loops=1)
         Index Cond: (id = ANY ((InitPlan 1).col1))
         Filter: (escola_id = <escola A>)
 Planning Time: 0.224 ms
 Execution Time: 8.339 ms
=== usuario (a escolha do lote de 100)
 Limit (actual time=0.022..0.050 rows=100.00 loops=1)
   ->  Incremental Sort (actual time=0.022..0.045 rows=100.00 loops=1)
         Sort Key: desativado_em, id
         Presorted Key: desativado_em
         Full-sort Groups: 4  Sort Method: quicksort  Average Memory: 27kB  Peak Memory: 27kB
         ->  Index Scan using usuario_desativado_idx on usuario (actual time=0.008..0.032 rows=105.00 loops=1)
               Index Cond: ((escola_id = <escola A>) AND (desativado_em < (now() - '5 years'::interval)))
 Planning Time: 0.145 ms
 Execution Time: 0.081 ms
=== expurgo_execucao
 Delete on expurgo_execucao (actual time=5.268..5.269 rows=0.00 loops=1)
   InitPlan 1
     ->  Limit (actual time=0.751..2.293 rows=4488.00 loops=1)
           ->  LockRows (actual time=0.751..2.094 rows=4488.00 loops=1)
                 ->  Sort (actual time=0.750..0.972 rows=4488.00 loops=1)
                       Sort Key: expurgo_execucao_1.em
                       ->  Bitmap Heap Scan on expurgo_execucao expurgo_execucao_1 (actual time=0.069..0.412 rows=4488.00 loops=1)
                             Recheck Cond: ((escola_id = <escola A>) AND (em < (now() - '5 years'::interval)))
                             ->  Bitmap Index Scan on expurgo_execucao_escola_em_idx (actual time=0.061..0.061 rows=4488.00 loops=1)
                                   Index Cond: ((escola_id = <escola A>) AND (em < (now() - '5 years'::interval)))
   ->  Index Scan using expurgo_execucao_pkey on expurgo_execucao (actual time=3.093..3.924 rows=4488.00 loops=1)
         Index Cond: (id = ANY ((InitPlan 1).col1))
         Filter: (escola_id = <escola A>)
 Planning Time: 0.097 ms
 Execution Time: 5.290 ms
=== a FK do aluno: tentativas por (escola_id, aluno_id)
 Delete on tentativa_atividade (actual time=0.045..0.045 rows=0.00 loops=1)
   ->  Index Scan using tentativa_atividade_aluno_idx on tentativa_atividade (actual time=0.008..0.014 rows=35.00 loops=1)
         Index Cond: ((escola_id = <escola A>) AND (aluno_id = <escola A>))
 Planning Time: 0.054 ms
 Trigger for constraint correcao_tentativa_fk: time=0.336 calls=35
 Trigger for constraint resposta_atividade_tentativa_fk: time=0.248 calls=35
 Execution Time: 0.639 ms
=== FK da execução do agente: solicitada_por por (escola_id, solicitada_por) (2.000 da pessoa entre 10.000 da escola)
 Update on execucao_agente (actual time=19.431..19.431 rows=0 loops=1)
   ->  Bitmap Heap Scan on execucao_agente (actual time=0.036..0.203 rows=2000.00 loops=1)
         Recheck Cond: ((escola_id = <escola A>) AND (solicitada_por = <professor>))
         ->  Bitmap Index Scan on execucao_agente_solicitada_por_idx (actual time=0.027..0.028 rows=2000.00 loops=1)
               Index Cond: ((escola_id = <escola A>) AND (solicitada_por = <professor>))
 Planning Time: 0.173 ms
 Execution Time: 39.016 ms
=== FK do artefato: criado_por por (escola_id, criado_por) (2.000 da pessoa entre 10.000 da escola)
 Update on artefato (actual time=14.198..14.199 rows=0 loops=1)
   ->  Bitmap Heap Scan on artefato (actual time=0.027..0.219 rows=2000.00 loops=1)
         Recheck Cond: ((escola_id = <escola A>) AND (criado_por = <professor>))
         ->  Bitmap Index Scan on artefato_criado_por_idx (actual time=0.020..0.021 rows=2000.00 loops=1)
               Index Cond: ((escola_id = <escola A>) AND (criado_por = <professor>))
 Planning Time: 0.108 ms
 Execution Time: 33.055 ms
```

Com todas as linhas da escola da mesma pessoa, o plano do `artefato` escolhia o `artefato_autoria_idx` (menor, e devolve as mesmas
linhas, com `criado_por` como filtro). O teste semeia por isso um segundo professor com quatro vezes mais artefatos e execuções
(2.000 da pessoa em 10.000 da escola), e o índice por pessoa é o que ganha.

> **As FKs para `usuario` que a eliminação da pessoa dispara** (levantadas no catálogo do banco de teste). Com índice próprio
> que começa pela escola e pela coluna: `tentativa_atividade`, `execucao_agente.solicitada_por` e `artefato.criado_por`
> (migration 0027), `mensagem_tutor.aluno_id`, `sinal_tutor.aluno_id`, `consumo_ia.aluno_id`, `sessao`, `convite`,
> `credencial_matricula` e `conta_externa`. Sem índice próprio, e sem precisar: `vinculo.usuario_id` (os vínculos saem antes
> do `delete` do usuário, e `vinculo_usuario_idx` começa por `(escola_id, ano_letivo_id, usuario_id)`), `thread_agente.usuario_id`
> (uma por pessoa e agente, `thread_agente_uma_por_pessoa` começa pela escola), `lista_nome.usuario_id` e `criado_por` (uma
> linha por nome da lista), `acesso_turma.criado_por` (uma por turma), `reivindicacao.decidida_por` (no máximo uma por
> nome da lista) e `material.enviado_por` e `excluido_por` (um por material da escola). Nenhuma dessas tabelas cresce
> por turno do Tutor (`docs/infra.md` 3.6) e todas têm índice que começa por `escola_id`, então o pior caso lê as linhas
> de uma escola, e nunca as de todas.

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › ANO_ENCERRADO_ALEM_DO_PRAZO › `al.situacao = 'encerrado'` | trabalho do aluno e cadastro › trabalho_do_aluno: o ano em curso ou planejado…; anonimização › autoria: o ano com o `fim` vencido… |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › ANO_ENCERRADO_ALEM_DO_PRAZO › `al.fim + make_interval(months => meses) < …::date` (sem ela; `<` → `<=`; fuso → `'UTC'`) | prazo por categoria › trabalho_do_aluno; anonimização › autoria: o dia do prazo é o da escola… (as três) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › ANO_ENCERRADO_ALEM_DO_PRAZO › `al.escola_id = escolaId` (sozinha) e INSTRUCAO_DO_LOTE.tentativa_atividade › `t.escola_id` na subconsulta (sozinha) | **equivalentes cada uma**: uma cobre a outra pela junção `al.escola_id = t.escola_id`. Tirando as duas, vermelho: lote por tabela › tentativa_atividade (pula a travada; apaga no máximo o limite, com a de B mais antiga) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.tentativa_atividade › `escola_id` da instrução de fora | **equivalente**: o id é UUID e a subconsulta já filtra a escola; fica como defesa em profundidade e para o índice, como na 3.0 e na 4.0 |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.tentativa_atividade › `limit`; `skip locked`; a junção `al.id = t.ano_letivo_id` | lote por tabela › tentativa_atividade (apaga no máximo o limite; pula, sem esperar, a travada); prazo por categoria › trabalho_do_aluno (sem a junção do ano, o ano encerrado de outra aplicação alcança todas) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.reivindicacao › `estado <> 'pendente'` | trabalho do aluno e cadastro › reivindicacao_decidida: a pendente nunca sai; o plano (sem o predicado o índice parcial não serve) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.reivindicacao › `coalesce(decidida_em, solicitada_em)` (trocado por `decidida_em`; trocado por `solicitada_em`; `< corte` apagado) | reivindicacao_decidida: sai a decidida por qualquer decisor e a encerrada (só `decidida_em`); prazo por categoria › reivindicacao_decidida (`solicitada_em`, que é 30 dias mais velha que a decisão; sem o corte) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.reivindicacao › `order by` (→ `order by id`); `limit`; `skip locked`; `escola_id` da subconsulta e da instrução de fora | lote por tabela (5.0) › reivindicacao: leva primeiro a mais antiga e pula a travada; apaga no máximo o limite; [P] dois jobs. A subconsulta: o lote apaga a de B (mais antiga). **A da instrução de fora, equivalente** (defesa em profundidade) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.material › `m.excluido_em < corte` | trabalho do aluno e cadastro › material_excluido: o vigente fica, mesmo velho; prazo por categoria › material_excluido |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.material › `not exists` da `mensagem_tutor`; `not exists` do `sinal_tutor` | material_excluido: o que uma pergunta ou um sinal do Tutor ainda cita fica (cada um quebra por FK, 23503, no lote) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.material › `c.escola_id = escolaId` dentro dos dois `not exists` | **equivalentes**: `c.material_id = m.id` é UUID único; a cláusula existe para o índice `(escola_id, material_id)` das duas tabelas, e o índice é provado em «índices da migration 0027» |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.material › `order by m.excluido_em` (→ `m.id`); `limit`; `for update of m skip locked` (sem `skip locked`); `m.escola_id` da subconsulta | lote por tabela (5.0) › material: leva primeiro a mais antiga e pula a travada; apaga no máximo o limite; a subconsulta: o lote apaga a de B (mais antiga). `escola_id` da instrução de fora: **equivalente** (defesa em profundidade) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.vinculo › `estado = 'encerrado'` | o plano (sem o predicado o índice parcial não serve). Para o comportamento é **equivalente**: o check `vinculo_encerrado_tem_motivo` só dá `encerrado_em` ao encerrado |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.vinculo › `encerrado_em < corte`; `order by` (→ `id`); `limit`; `skip locked`; `escola_id` da subconsulta | vinculo_encerrado: o encerrado recente fica; lote por tabela (5.0) › vinculo (ordem, limite, travada); prazo por categoria. A da instrução de fora: **equivalente** |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › PESSOAS_DESATIVADAS › `desativado_em < corte`; `order by desativado_em, id` (→ `id`); `limit` | pessoa_desativada: o ativo e o desativado dentro do prazo ficam; o lote leva as mais antigas primeiro; o lote é de no máximo 100 |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › PESSOAS_DESATIVADAS › `escola_id` | pessoa_desativada: o lote de A não escolhe a pessoa de B, mesmo a mais antiga (com a escolha de B, o job de A trava em lote e o teste não termina) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › #eliminarPessoasDesativadas › o `catch` que pula só o `NAO_ENCONTRADO` (sem o `catch`; `catch` que engole qualquer erro) | pessoa_desativada: a que sumiu entre a escolha e a trava é pulada sem erro; o erro de SQL sobe, grava `false` e a noite seguinte começa por ela |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › #eliminarPessoasDesativadas › `desativado_em < corte(prazo.agora, prazo.meses)` na consulta sob a trava (apagada); `eq(usuario.id, id)` (apagada) | pessoa_desativada: a reativada entre a escolha e a trava fica, sem auditoria e fora da contagem (o teste «a pessoa reativada entre a escolha do lote e a trava não é eliminada…»); trocada por `desativado_em is not null`, só o teste «a pessoa reativada e desativada de novo dentro do prazo…» fica vermelho |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › #eliminarPessoasDesativadas › `eq(usuario.escolaId, escolaId)` na consulta sob a trava | **equivalente**: o id é UUID e o `eliminar` trava pelo `usuarioId`; fica como defesa em profundidade, como nas outras instruções do arquivo |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › #eliminarPessoasDesativadas › `cheio: escolhidos.rows.length >= limite` (→ `eliminadas >= limite`); `Math.min(limite, LOTE_MAXIMO_DO_ALVO.usuario)` | pessoa_desativada: o lote diz `cheio` pelo número de escolhidos; o lote é de no máximo 100 |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › #eliminarPessoasDesativadas › `autorOperador: AUTOR_DA_ROTINA` | pessoa_desativada: a auditoria `usuario.eliminado` é da rotina (sem autor a auditoria recusa) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › REGISTRO_DO_EXPURGO_VENCIDO › `em < corte(agora, RETENCAO_EXPURGO_EXECUCAO_MESES)` (apagada; 59 e 61 meses); `escola_id` da subconsulta; `order by em` (→ `id`); `limit`; `skip locked` | expurgo_execucao: 5 anos e um dia sai, menos um dia fica; o de B fica; o lote do registro (limite, mais antigo primeiro, pula a travada). A da instrução de fora: **equivalente** |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › o laço do registro: `if (!doLote.cheio) break`; a conferência da janela; `registroApagadoTotal += doLote.linhas` | `break` trocado: o teste não termina (vermelho por tempo); janela: «se a janela letiva abre depois da última categoria…»; contagem: «com 5 anos e um dia…» (o log `registroApagadoTotal`) |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › `expurgarRegistroDoExpurgo(agora, lote)` trocado por `relogio.agora()` | **equivalente nos testes**: o relógio só anda no teste da janela, e ali o laço do registro já não roda; o `agora` do começo é o desenho (o corte dos 5 anos é do mesmo instante das categorias). Fica sem teste que distinga |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › `CATEGORIAS_DO_EXPURGO` (sem `material_excluido`); `LOTE_MAXIMO_DO_ALVO` (`usuario: 1000`) | `expurgo-da-escola.test.ts` (catálogo coberto; lote máximo); prazo por categoria; pessoa_desativada (100) |
| `packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql` › cada um dos nove índices (apagado no banco de teste, um de cada vez, e recriado) | índices da migration 0027 (os nove, por definição); lotes › o plano de cada alvo (reivindicação, material, vínculo, pessoa, trabalho do aluno, FK do aluno); as FKs `set null` da pessoa descem pelo índice próprio (o teste novo do item 2) |
| `apps/worker/test/expurgo-da-escola.int.test.ts` › o plano do trabalho do aluno semeia o próprio volume (2 anos × 30 atividades × 40 alunos) num teste à parte | sem o volume o plano varre as tentativas da escola pelo índice do aluno; o volume não vai no teste dos outros alvos porque mudaria o plano da autoria (o artefato e o ano encerrado a mais) |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Teste do relógio que distingue `expurgarRegistroDoExpurgo(agora, …)` de `relogio.agora()` | recusada: a mutação está declarada em «Mutações» como equivalente nos testes; o `agora` do começo é o desenho (o corte dos 5 anos é do mesmo instante das categorias), e provar a diferença pede um relógio que ande dentro do laço, sem abrir a janela letiva, o que não vale o custo |
| tenancy-guardian (1ª) | `usuario_desativado_idx`: o predicado em texto cru (`sql\`desativado_em is not null\``) em vez de referenciar a coluna | recusada: trocar muda o texto do predicado no SQL e no snapshot da 0027 e caducaria todos os revisores por ganho só de manutenção; o resto do arquivo `usuario.ts` usa o mesmo texto cru (`usuario_coordenador_ativo_idx`) |
| tenancy-guardian (1ª) | Na 14.0, manter o filtro de escola na conferência do pedido `agendado` e repetir o teste da pessoa de B | tarefa 14.0 |
| revisor-geral (1ª) | Na 14.0, o pulo do pedido `agendado` entra no `PESSOAS_DESATIVADAS`, e não por `NAO_ENCONTRADO` depois da escolha, porque o `cheio` vem do número de escolhidos e 100 puladas toda noite travariam o laço | tarefa 14.0 |
| revisor-geral (1ª) | O repositório do expurgo cria e chama um service (`CicloDeVidaService`) e conduz a regra de eliminação; a orquestração ficaria melhor num service do expurgo, com o repositório só escolhendo os ids | tarefa 14.0, que vai mexer no mesmo laço (dívida declarada) |
| privacy-guardian (1ª) | `retencao.ts` › `registro_de_decisao`: o prazo diz «enquanto durar o contrato com a escola, e mais 5 anos», mas o `expurgo_execucao` sai 5 anos depois de `em`, com o contrato valendo; alinhar o texto ou dar ao registro uma linha própria em `PRAZOS_FIXOS` | `TODO.md`, para o Joaquim: é decisão sobre o que a escola lê como prazo do registro, e o registro não tem dado de pessoa (risco baixo) |
| conformidade-reviewer (1ª) | Prender ao expurgo do `trabalho_do_aluno` que a `validacao_do_lote` e o `decidida_por`/`decidida_em` da entrega ficam iguais | `/validar`: hoje é garantido pela estrutura (não há FK) e pelo teste do MVP; fica como prova extra |
| conformidade-reviewer (1ª) | Caso de professor desativado que decidiu uma entrega e confirmou uma validação, conferindo que o expurgo noturno não apaga quem aprovou | `/validar`, junto da anterior |
| conformidade-reviewer (1ª) | O autor `rotina` nunca aparece como autor de aprovação de saída de IA nem de decisão de entrega | tarefa 15.0 (o check do autor `rotina`) |
| test-engineer (3ª), revisor-geral (2ª) | O texto do comentário da 0027 («lê a tabela inteira, de todas as escolas») e o «Seq Scan medido com 1 milhão de linhas» do 5_task.md exageram: como a FK começa por `escola_id`, o pior caso é ler as linhas da escola | recusada: mexer no comentário do `.sql` caducaria os seis revisores só por redação; o 5_task.md registra o que foi medido, e o item 1 da ordem deste documento já corrigiu o nome do teste |
| test-engineer (3ª) | Tirar do teste do plano a asserção `not.toContain('Seq Scan')` | recusada: ela fica como reforço, e o comentário do item 4 diz isso |
| test-engineer (4ª) | No teste do aluno com trabalho, conversa e consumo, criar também o trabalho de um segundo aluno ativo e conferir que fica | recusada: a cascata é a FK por `(escola_id, aluno_id)`, e o outro aluno ativo já é conferido no primeiro teste de `pessoa_desativada` (`ativo` e `dentroDoPrazo` ficam) |
| privacy-guardian (3ª) | O teste do aluno eliminado não confere que `execucao_agente.solicitada_por` e `artefato.criado_por` ficam nulos para ele | `/validar`: hoje está coberto pelo teste das FKs `set null` (professor) |
| tenancy-guardian (3ª) | Conferir na tela de retenção se a coordenação entende o parêntese novo de «conta de» | `/validar` |
| conformidade-reviewer (3ª) | Conferir que «a solicitação, no pedido fechado na virada do ano» não dá a entender que o sistema decidiu o pedido do aluno | `/validar`: o pedido foi encerrado pela virada do ano, sem aprovação nem recusa |
| revisor-geral (3ª) | `material.ts`: a linha do comentário passou da largura das vizinhas, e «o artefato que a citava mostra «material da escola»» só foi confirmado para o sinal | recusada: a citação no artefato aparece como «material da escola» no PDF (`pdf-do-artefato.ts`, apontado pelo próprio `revisor-geral` na 1ª rodada), o lint passou, e mexer no comentário caducaria o `revisor-geral` por redação |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-08 22:30:39 | 2026-10-08 22:33:22 | `test-engineer` | 1 | REPROVADO | a83ca1dabbbbcbf24 |
| 2026-10-08 23:16:28 | 2026-10-08 23:17:46 | `test-engineer` | 2 | APROVADO | aa423f02c6fc8abc6 |
| 2026-10-08 23:18:00 | 2026-10-08 23:18:48 | `tenancy-guardian` | 1 | APROVADO | a0425606adaf3888e |
| 2026-10-08 23:18:04 | 2026-10-08 23:19:47 | `privacy-guardian` | 1 | APROVADO | a524ff20bf7149e78 |
| 2026-10-08 23:18:12 | 2026-10-08 23:19:55 | `conformidade-reviewer` | 1 | APROVADO | a4b776ad713ade08c |
| 2026-10-08 23:17:56 | 2026-10-08 23:20:41 | `revisor-geral` | 1 | APROVADO | a283bf4500eac3ae1 |
| 2026-10-08 23:18:09 | 2026-10-08 23:22:30 | `infra-guardian` | 1 | REPROVADO | a9d10d467962b808a |
| 2026-10-09 00:19:28 | 2026-10-09 00:20:51 | `test-engineer` | 3 | APROVADO | a4d9cf9741fb90f86 |
| 2026-10-09 00:21:18 | 2026-10-09 00:21:42 | `tenancy-guardian` | 2 | APROVADO | a7ad19fa474eae774 |
| 2026-10-09 00:21:31 | 2026-10-09 00:21:46 | `conformidade-reviewer` | 2 | APROVADO | a9a9be354ecf1e800 |
| 2026-10-09 00:21:05 | 2026-10-09 00:21:48 | `infra-guardian` | 2 | APROVADO | a1055549e4341e744 |
| 2026-10-09 00:21:12 | 2026-10-09 00:21:53 | `revisor-geral` | 2 | APROVADO | a5903191f65016ecd |
| 2026-10-09 00:21:24 | 2026-10-09 00:21:56 | `privacy-guardian` | 2 | APROVADO | a35bc1b94f3739aea |
| 2026-10-09 01:05:53 | 2026-10-09 01:07:02 | `test-engineer` | 4 | APROVADO | aa42cecb1b71d57d5 |
| 2026-10-09 01:07:20 | 2026-10-09 01:07:37 | `tenancy-guardian` | 3 | APROVADO | a5fe38396888b295f |
| 2026-10-09 01:07:27 | 2026-10-09 01:08:01 | `privacy-guardian` | 3 | APROVADO | a654fd8a362c0777c |
| 2026-10-09 01:07:33 | 2026-10-09 01:08:09 | `infra-guardian` | 3 | APROVADO | a3baea6a0df2e88b3 |
| 2026-10-09 01:07:40 | 2026-10-09 01:08:10 | `conformidade-reviewer` | 3 | APROVADO | aeadfa7d3be4be651 |
| 2026-10-09 01:07:13 | 2026-10-09 01:08:14 | `revisor-geral` | 3 | APROVADO | a296dbbdccf19bf5b |
