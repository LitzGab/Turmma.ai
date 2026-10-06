# Tarefa 4.0 — O expurgo anonimiza execução, texto do modelo, consumo por aluno e autoria

**Funcionalidade:** lgpd-e-titular · **Depende de:** 3.0 · **Paralelo com:** 5.0, 7.0 a 10.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`, `llm-integrator`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

As quatro categorias que mantêm a linha e anulam a pessoa passam a ser expurgadas, com o prazo efetivo das travas e sem quebrar os checks da `execucao_agente` nem a soma da governança.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (catálogo, travas, `execucao_agente`) e 7c (índices)
- `.claude/rules/70-conformidade-cne.md` itens 3 e 6
- Código: `packages/nucleo/src/db/schema/execucao-agente.ts`, `consumo-ia.ts`, `artefato.ts`; `apps/api/src/governanca/governanca.repository.ts` (soma)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 4.1 — Migration própria: `execucao_agente.anonimizada_em`; índices parciais de anonimização (seção 7c), dois em `consumo_ia`
- [x] 4.2 — Categorias `execucao_agente` (`entrada = {tarefa}`, `solicitada_por` nulo), `texto_do_modelo`, `consumo_por_aluno`, `autoria_de_artefato` (ano encerrado)
- [x] 4.3 — `EXPLAIN` de cada lote, anexado à tarefa
- [x] 4.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e `execucao-agente.ts` | alterado |
| `expurgo-da-escola.repository.ts` | alterado |
| testes do expurgo | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| travas | integração | com `conversa_professor` em 3 meses, o tema sai em 3; com `conversa_tutor` em 6, o `aluno_id` de 7 meses é anulado |
| checks | integração | execução `pendente`, `concluida` e `falhou` anonimizadas passam nos checks da 0022 e 0023 |
| o que fica | integração | a linha e as oito FKs continuam; a soma da governança não muda |
| autoria com ano em curso | integração | não é anulada |
| reexecução | integração | não mexe na linha com `anonimizada_em` |
| consumo do Tutor | integração | continua cumprindo `consumo_ia_sem_conversa_de_pessoa` |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Troca de nome e eliminação (15.0); `consumo_ia.provedor` (7.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| São **sete** as FKs que apontam para `execucao_agente`, e não oito; o teste lê a lista de `pg_constraint` e confere cada uma antes e depois | a 0023 trocou as FKs de seis tabelas (artefato, entrega, mensagem do Assistente e do Tutor, resumo do Analista, sinal) pela versão com o ano, e a de `consumo_ia` ficou sem ano; não há oitava | `techspec.md` §5 ("Tarefa 4.0, como ficou no código"); `cenarios.md` RF4, `execucao_agente` |
| Os lotes de anonimização travam com `for no key update skip locked`, e não `for update skip locked` | o update não muda coluna de índice único: com `for update`, a conferência de FK de quem grava uma mensagem, um consumo ou uma entrega apontando para a linha (`for key share`) faria o lote pular a linha, e seguraria quem grava; `for no key update` é a trava que o próprio update toma | `techspec.md` §5 ("Depois percorre as categorias…" e "Tarefa 4.0, como ficou no código"); `cenarios.md` RF4, `execucao_agente`; `docs/modelo-de-dados.md` |
| Na autoria, sai o artefato do ano `encerrado` cujo `fim` mais o prazo é anterior ao dia de `agora` **no fuso da escola** (o do horário letivo, que o job já lê e passa ao lote em `PrazoDoLote`); trava só o artefato (`of a`); sem `order by` | a spec diz só "`fim` do ano encerrado"; o dia de UTC já virou às 21h de São Paulo, e o job segurado pela janela letiva pode rodar a essa hora (`test-engineer`, 1ª rodada, recomendação 3); a coordenação mudando o ano não deve fazer o lote pular os artefatos dele; a idade é a do ano, e o índice `(escola_id, ano_letivo_id)` não tem data | `techspec.md` §5 ("Tarefa 4.0, como ficou no código") |
| A execução do Tutor (`funcao = 'tutor_com_o_aluno'`) é anonimizada também na categoria `consumo_por_aluno`, pelo alvo `execucao_agente_do_tutor` e um quinto índice parcial; perde o aluno no menor dos dois prazos, e a contagem da categoria soma consumos e execuções | correção exigida pelo `privacy-guardian` (1ª rodada): o consumo do Tutor aponta para a execução, que tem o aluno em `solicitada_por`; sem isso, o aluno voltaria ao consumo pela execução até o prazo de `execucao_agente`, que não é travado pela conversa do Tutor (`docs/lgpd.md` promete "nunca além da conversa do Tutor") | `techspec.md` §3 (catálogo, linha de `consumo_por_aluno`; travas) e §5 ("Tarefa 4.0, como ficou no código"); `cenarios.md` RF4, ajuste e travas; `docs/lgpd.md` |
| `anonimizada_em` recebe o `agora` do job; o método do lote passa a se chamar `expurgarLote(alvo, prazo, limite)`, com `prazo = { agora, meses, fuso }`, e os alvos `execucao_agente`, `consumo_ia_texto`, `consumo_ia_aluno` e `artefato_autoria` | o `agora` é o mesmo relógio do `em` de `expurgo_execucao`, e o teste o injeta; o lote agora apaga ou anonimiza, e o nome antigo dizia só "apagar" | `techspec.md` §5 ("Tarefa 4.0, como ficou no código") |

## EXPLAIN dos lotes (4.3)

`EXPLAIN (ANALYZE, BUFFERS)` de um lote de 5.000 de cada alvo, no Postgres do compose de teste, numa transação desfeita no
fim. Volume da escola A: 300.000 execuções (metade do Tutor, com o aluno; metade de ferramenta, com o tema; dois anos de
idade), 600.000 chamadas ao modelo (metade do Tutor, com aluno; metade de ferramenta, com texto), mais 600.000 chamadas da
escola B, e 40.000 artefatos (metade num ano encerrado vencido, metade num ano planejado). Cada lote desce pelo índice
parcial da 0026, começando pela escola, e para no limite; nenhum passa de 145 ms, longe do `statement_timeout` de 2 s. Os
gatilhos de FK que aparecem no update são os das linhas criadas na mesma transação do teste: numa linha antiga, o Postgres
não reconfere a FK cujas colunas não mudaram.

```
=== execucao_agente
 Update on execucao_agente (actual time=104.862..104.864 rows=0.00 loops=1)
   InitPlan 1
     ->  Limit (actual time=0.023..4.783 rows=5000.00 loops=1)
           ->  LockRows (actual time=0.022..4.547 rows=5000.00 loops=1)
                 ->  Index Scan using execucao_agente_a_anonimizar_idx on execucao_agente execucao_agente_1 (actual time=0.020..2.978 rows=5000.00 loops=1)
                       Index Cond: ((escola_id = <escola A>) AND (criada_em < (now() - '1 year'::interval)))
                       Filter: (anonimizada_em IS NULL)
   ->  Index Scan using execucao_agente_pkey on execucao_agente (actual time=5.626..10.431 rows=5000.00 loops=1)
         Index Cond: (id = ANY ((InitPlan 1).col1))
         Filter: (escola_id = <escola A>)
 Planning Time: 0.276 ms
 Trigger for constraint execucao_agente_escola_id_escola_id_fk: time=14.753 calls=5000
 Trigger for constraint execucao_agente_ano_letivo_da_escola_fk: time=14.393 calls=5000
 Execution Time: 134.444 ms
=== execucao_agente_do_tutor
 Update on execucao_agente (actual time=62.140..62.141 rows=0.00 loops=1)
   InitPlan 1
     ->  Limit (actual time=0.637..4.195 rows=5000.00 loops=1)
           ->  LockRows (actual time=0.636..3.956 rows=5000.00 loops=1)
                 ->  Index Scan using execucao_agente_do_tutor_a_anonimizar_idx on execucao_agente execucao_agente_1 (actual time=0.633..2.792 rows=5000.00 loops=1)
                       Index Cond: ((escola_id = <escola A>) AND (criada_em < (now() - '6 mons'::interval)))
                       Filter: ((anonimizada_em IS NULL) AND (funcao = 'tutor_com_o_aluno'::text))
   ->  Index Scan using execucao_agente_pkey on execucao_agente (actual time=5.000..8.921 rows=5000.00 loops=1)
         Index Cond: (id = ANY ((InitPlan 1).col1))
         Filter: (escola_id = <escola A>)
 Planning Time: 0.129 ms
 Trigger for constraint execucao_agente_escola_id_escola_id_fk: time=14.383 calls=5000
 Trigger for constraint execucao_agente_ano_letivo_da_escola_fk: time=14.039 calls=5000
 Execution Time: 90.958 ms
=== consumo_ia_texto
 Update on consumo_ia (actual time=125.148..125.150 rows=0.00 loops=1)
   InitPlan 1
     ->  Limit (actual time=0.025..13.959 rows=5000.00 loops=1)
           ->  LockRows (actual time=0.025..13.687 rows=5000.00 loops=1)
                 ->  Index Scan using consumo_ia_texto_a_anular_idx on consumo_ia consumo_ia_1 (actual time=0.017..11.791 rows=5000.00 loops=1)
                       Index Cond: ((escola_id = <escola A>) AND (em < (now() - '1 year'::interval)))
                       Filter: ((entrada IS NOT NULL) OR (saida IS NOT NULL))
   ->  Index Scan using consumo_ia_pkey on consumo_ia (actual time=14.766..28.774 rows=5000.00 loops=1)
         Index Cond: (id = ANY ((InitPlan 1).col1))
         Filter: (escola_id = <escola A>)
 Planning Time: 0.205 ms
 Trigger for constraint consumo_ia_escola_id_escola_id_fk: time=15.488 calls=5000
 Execution Time: 140.813 ms
=== consumo_ia_aluno
 Update on consumo_ia (actual time=72.430..72.432 rows=0.00 loops=1)
   InitPlan 1
     ->  Limit (actual time=0.034..5.726 rows=5000.00 loops=1)
           ->  LockRows (actual time=0.033..5.484 rows=5000.00 loops=1)
                 ->  Index Scan using consumo_ia_aluno_a_anular_idx on consumo_ia consumo_ia_1 (actual time=0.024..2.288 rows=5000.00 loops=1)
                       Index Cond: ((escola_id = <escola A>) AND (em < (now() - '1 year'::interval)))
                       Filter: (aluno_id IS NOT NULL)
   ->  Index Scan using consumo_ia_pkey on consumo_ia (actual time=6.506..10.380 rows=5000.00 loops=1)
         Index Cond: (id = ANY ((InitPlan 1).col1))
         Filter: (escola_id = <escola A>)
 Planning Time: 0.165 ms
 Trigger for constraint consumo_ia_escola_id_escola_id_fk: time=14.658 calls=5000
 Execution Time: 87.254 ms
=== artefato_autoria
 Update on artefato (actual time=55.361..55.366 rows=0.00 loops=1)
   InitPlan 1
     ->  Limit (actual time=0.028..3.534 rows=5000.00 loops=1)
           ->  LockRows (actual time=0.027..3.272 rows=5000.00 loops=1)
                 ->  Nested Loop (actual time=0.018..1.098 rows=5000.00 loops=1)
                       ->  Index Scan using ano_letivo_escola_id_unico on ano_letivo al (actual time=0.011..0.011 rows=1.00 loops=1)
                             Index Cond: (escola_id = <escola A>)
                             Filter: ((situacao = 'encerrado'::text) AND ((fim + '5 years'::interval) < ((now() AT TIME ZONE 'UTC'::text))::date))
                       ->  Index Scan using artefato_autoria_idx on artefato a (actual time=0.007..0.802 rows=5000.00 loops=1)
                             Index Cond: ((escola_id = <escola A>) AND (ano_letivo_id = al.id))
                             Filter: (criado_por IS NOT NULL)
   ->  Index Scan using artefato_pkey on artefato (actual time=3.885..5.108 rows=5000.00 loops=1)
         Index Cond: (id = ANY ((InitPlan 1).col1))
         Filter: (escola_id = <escola A>)
 Planning Time: 0.460 ms
 Trigger for constraint artefato_escola_id_escola_id_fk: time=14.507 calls=5000
 Trigger for constraint artefato_turma_do_ano_da_escola_fk: time=14.967 calls=5000
 Trigger for constraint artefato_disciplina_da_escola_fk: time=38.154 calls=5000
 Execution Time: 123.549 ms
```

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente › `escola_id` na subconsulta | anonimização › execucao_agente: o lote alcança no máximo o limite… (B mais antiga); o lote leva primeiro a mais antiga…; [P] dois jobs |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente › `anonimizada_em is null` | prazo por categoria › execucao_agente (reexecutar); anonimização › o lote alcança…; reexecutar não mexe na execução já anonimizada; [P] dois jobs; o plano (índice parcial) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente › `criada_em < corte` | prazo por categoria › execucao_agente; travas; janela abre no meio; 5.001 linhas |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente › `order by criada_em` trocado por `order by id` | anonimização › execucao_agente: o lote leva primeiro a mais antiga…; o plano. **Sem o `order by`, equivalente na prática**: o plano desce pelo índice `(escola_id, criada_em)` e entrega a mais antiga do mesmo jeito; fica porque o SQL não garante a ordem sem ele (como na 3.0) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente › `limit` | anonimização › o lote alcança no máximo o limite…; o lote leva primeiro a mais antiga… |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente › `for no key update` trocado por `for update` | anonimização › execucao_agente: … não pula a que só tem a trava de FK |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente › `skip locked` | anonimização › o lote leva primeiro a mais antiga, pula sem esperar… (espera até o prazo do teste); o plano |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente › `set entrada = jsonb_build_object('tarefa', tarefa)` | prazo por categoria › execucao_agente; checks |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente › `solicitada_por = null` | prazo por categoria › execucao_agente; checks |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente › `anonimizada_em = agora` (trocado por `now()`) | checks; reexecutar não mexe na execução já anonimizada |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.consumo_ia_texto › `escola_id` na subconsulta | anonimização › consumo_ia_texto: o lote alcança…; o lote leva primeiro… |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.consumo_ia_texto › `(entrada is not null or saida is not null)` (inteiro, e termo a termo) | inteiro: prazo por categoria › texto_do_modelo; o lote alcança…; o consumo do Tutor… (conta 3, e não 2). Só `entrada`: o consumo do Tutor… (a chamada só com saída fica). Só `saida`: o mesmo (a só com entrada fica) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.consumo_ia_texto › `em < corte` | prazo por categoria › texto_do_modelo; travas |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.consumo_ia_texto › `order by em` trocado por `order by id` | anonimização › consumo_ia_texto: o lote leva primeiro a mais antiga…. **Sem o `order by`, equivalente na prática**, pelo mesmo motivo da execução |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.consumo_ia_texto › `limit`; `for no key update` → `for update` | o lote alcança…; o lote leva primeiro… (a da trava de FK) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.consumo_ia_texto › `set entrada = null, saida = null` (cada coluna) | prazo por categoria › texto_do_modelo; o lote alcança…; o consumo do Tutor… |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.consumo_ia_aluno › `escola_id` na subconsulta; `aluno_id is not null`; `em < corte` | o lote alcança…; o lote leva primeiro…; prazo por categoria › consumo_por_aluno; travas; o plano |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.consumo_ia_aluno › `order by em` (sem ele, e trocado por `order by id`); `limit`; `for no key update` → `for update` | o plano (sem o `order by`, o lote desce pelo índice antigo `(escola_id, aluno_id, em)`); o lote leva primeiro a mais antiga…; o lote alcança… |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.artefato_autoria › `a.escola_id` | anonimização › artefato_autoria: o lote alcança… (com a junção, sai também o de B); o lote pula sem esperar… |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.artefato_autoria › `a.criado_por is not null` | prazo por categoria › autoria_de_artefato; o lote alcança…; o plano |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.artefato_autoria › `al.situacao = 'encerrado'` | autoria: o ano com o `fim` vencido além do prazo, mas em curso ou planejado… |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.artefato_autoria › `al.fim + make_interval(months => meses) < (agora at time zone fuso)::date` (sem ela; `<` trocado por `<=`; o fuso trocado por `'UTC'`; o dia tirado da sessão do banco) | prazo por categoria › autoria_de_artefato; autoria: o dia do prazo é o da escola… às 22h de quarta (as três trocas) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.artefato_autoria › `limit`; `for no key update of a` → `for update of a`; `skip locked`; sem o `of a` | o lote alcança…; o lote pula sem esperar o artefato travado, e não pula o que só tem a trava de FK nem o do ano que está sendo mudado (sem o `of a`, também o [P] dos quatro alvos) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE › o `escola_id` da instrução de fora, nos cinco alvos; artefato_autoria › `al.escola_id = a.escola_id` na junção | **equivalentes**: a escola da subconsulta (e `a.escola_id`) já filtra, o id é UUID único e a FK prende o ano à escola do artefato; ficam como defesa em profundidade e para o índice, como na 3.0. Em `consumo_ia_aluno`, tirar a da instrução de fora muda só o plano (o teste do plano fica vermelho, por acaso) |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › `fuso: janela.fuso` no prazo do lote (trocado por `'UTC'`) | autoria: o dia do prazo é o da escola… às 22h de quarta |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente_do_tutor › `funcao = 'tutor_com_o_aluno'` | a execução do Tutor perde o aluno no prazo do consumo por aluno… (a do professor de 7 meses fica); o plano |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente_do_tutor › `escola_id` na subconsulta; `limit`; `for no key update` → `for update`; `skip locked`; `order by criada_em` → `order by id` | anonimização › execucao_agente_do_tutor: o lote alcança…; o lote leva primeiro a mais antiga… **Sem o `order by`, equivalente na prática**, como na execução |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente_do_tutor › `anonimizada_em is null`; `criada_em < corte` | prazo por categoria › consumo_por_aluno; o lote alcança…; o plano; janela abre no meio; 5.001 linhas; [P] dois jobs… (as duas categorias na mesma execução do Tutor: a soma passa de 90) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.execucao_agente_do_tutor › `set entrada = jsonb_build_object('tarefa', tarefa)`; `solicitada_por = null` | a execução do Tutor perde o aluno… (a entrada com mais que a tarefa; o aluno pela junção) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › `ALVOS_DO_EXPURGO_DA_ESCOLA.consumo_por_aluno` › `'execucao_agente_do_tutor'` | a execução do Tutor perde o aluno no prazo do consumo por aluno…; [P] dois jobs… (a execução do Tutor de 7 meses fica com o aluno) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › INSTRUCAO_DO_LOTE.artefato_autoria › `al.escola_id = ${escolaId}` (explícito, pedido pelo `tenancy-guardian`) | **equivalente**: a junção já prende o ano à escola do artefato, e `a.escola_id` filtra a escola; fica para a leitura não depender da junção |
| `apps/worker/src/processadores/expurgar-escola.ts` › `fuso: janela.fuso` trocado por `'America/Sao_Paulo'` | autoria: o dia do prazo é o da escola… (a escola de Rio Branco, às 22h30 de quarta lá) |
| `apps/worker/test/expurgo-da-escola.int.test.ts` › o teste do plano semeia o próprio volume (40 alunos, 4.000 execuções, 8.000 chamadas) na transação desfeita | sem ele, o plano dependia do que os outros testes deixaram no banco (`consumo_ia_texto` chegou a descer por `consumo_ia_funcao_idx`); com ele, apagar cada um dos cinco índices deixa o teste vermelho |
| `packages/nucleo/drizzle/0026_anonimizacao.sql` › cada um dos cinco índices (apagado no banco de teste, um de cada vez) | lotes › o lote de cada alvo desce pelo índice dele… |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › `CATEGORIAS_DO_EXPURGO` e `ALVOS_DO_EXPURGO_DA_ESCOLA` com as quatro categorias | catálogo › toda categoria do catálogo passa pelo expurgo…; `expurgo-da-escola.test.ts` (ordem da noite); prazo por categoria (o `it.each` cobre cada uma) |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

As seis do `test-engineer` (1ª rodada), as duas dele na 2ª, a do `tenancy-guardian`, as três do `conformidade-reviewer`, as três do
`revisor-geral`, as duas primeiras do `infra-guardian`, a segunda do `privacy-guardian` e a terceira do `llm-integrator`
foram aplicadas. Ficaram:

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `llm-integrator`, 1ª | teste de integração do reenvio da chave de uma execução já anonimizada (404 tipado, nem 500 nem execução nova) | `TODO.md`, seção "Antes da primeira escola real…": o comportamento é do fluxo do Assistente na API, fora do expurgo desta tarefa |
| `llm-integrator`, 1ª | o `consumo_ia_aluno_a_anular_idx` repete as linhas do `consumo_ia_aluno_idx` | recusada: com muitos alunos, o índice antigo `(escola_id, aluno_id, em)` não dá a ordem por idade do lote; o teste do plano agora semeia 40 alunos e o lote desce pelo novo, e com um aluno só desceria pelo antigo |
| `infra-guardian`, 1ª | medir a escrita a mais dos índices parciais em cada troca do Tutor | `TODO.md`, seção "Infra e operação", para o cenário de carga da 19.0 |
| `llm-integrator`, 2ª | comentário em `execucao-agente.ts` de que a execução aberta e vencida, anonimizada, terminaria em `falhou` e nunca rodaria com a entrada vazia | já escrito em `docs/modelo-de-dados.md` (parágrafo da tarefa 4.0) e no comentário do schema ("anonimizada, ela não responde a ninguém… `NAO_ENCONTRADO`"); repetir no `.ts` só caducaria a rodada do `revisor-geral` |
| `llm-integrator`, 2ª | o teste do reenvio da chave cobrir também o Tutor | aplicada no item do `TODO.md` |
| `infra-guardian`, 2ª | validar o fuso da escola contra `pg_timezone_names` ao gravar a configuração; trocar os índices de execução por um `(escola_id, funcao, criada_em)` se a carga apontar custo | o primeiro é da gravação da configuração operacional, fora desta tarefa: a nota está no JSDoc do lote e o alerta de duas noites pega; o segundo fica com o item de escrita a mais no `TODO.md`, medido na 19.0 |
| `conformidade-reviewer`, 2ª | teste de que a entrega pendente cuja execução foi anonimizada continua aprovável e rejeitável | para o `/validar`, como o revisor indicou: a aprovação não lê `solicitada_por`, e o fluxo da entrega é da API, fora do expurgo |
| `conformidade-reviewer`, 2ª | na auditoria do dossiê (D61), dizer que "quem pediu" some no prazo e "quem aprovou" fica | para o `/retro` e a tela do dossiê (F12): é texto de interface que não existe nesta fatia |
| `privacy-guardian`, 2ª | teste que leia `FUNCOES_COM_ORCAMENTO_POR_ALUNO` e confira que cada função pedida pelo aluno tem alvo e índice de anonimização | `TODO.md`, seção "Antes da primeira escola real…": hoje há uma função só, e o filtro está escrito na techspec §5 |
| `privacy-guardian`, 2ª | dizer na techspec que o `resultado` da execução do Tutor anonimizada só não traz o aluno por causa da trava | aplicada na techspec §5 ("Tarefa 4.0") |
| `privacy-guardian`, 1ª | registrar no `/retro` que o `order by` dentro do índice é "equivalente na prática" | para o `/retro`: está na seção "Mutações" desta tarefa, nas linhas de `execucao_agente`, `consumo_ia_texto` e `execucao_agente_do_tutor` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-06 09:50:41 | 2026-10-06 09:53:11 | `test-engineer` | 1 | APROVADO | a947a155399747062 |
| 2026-10-06 10:37:19 | 2026-10-06 10:38:12 | `test-engineer` | 2 | APROVADO | a264e15fc98fd1e06 |
| 2026-10-06 10:38:31 | 2026-10-06 10:39:11 | `tenancy-guardian` | 1 | APROVADO | a4833f5e1d8693d4e |
| 2026-10-06 10:38:48 | 2026-10-06 10:39:53 | `conformidade-reviewer` | 1 | APROVADO | a8363f242dbf94c7e |
| 2026-10-06 10:38:25 | 2026-10-06 10:39:54 | `revisor-geral` | 1 | APROVADO | adf2b9868797e0a24 |
| 2026-10-06 10:38:42 | 2026-10-06 10:40:01 | `infra-guardian` | 1 | APROVADO | a56fdcf31eacce17f |
| 2026-10-06 10:38:54 | 2026-10-06 10:40:04 | `llm-integrator` | 1 | APROVADO | a578fc7c6d5e30f80 |
| 2026-10-06 10:38:36 | 2026-10-06 10:40:33 | `privacy-guardian` | 1 | REPROVADO | a6401920ee5501bd2 |
| 2026-10-06 11:30:43 | 2026-10-06 11:32:16 | `test-engineer` | 3 | REPROVADO | a8cc9dd5d9b2369b6 |
| 2026-10-06 12:13:28 | 2026-10-06 12:14:16 | `test-engineer` | 4 | APROVADO | a96536e24aae1692d |
| 2026-10-06 12:14:56 | 2026-10-06 12:15:22 | `tenancy-guardian` | 2 | APROVADO | ab619fa88b743aea2 |
| 2026-10-06 12:15:05 | 2026-10-06 12:15:31 | `infra-guardian` | 2 | APROVADO | ab98ad726eb94f39e |
| 2026-10-06 12:14:47 | 2026-10-06 12:15:51 | `revisor-geral` | 2 | APROVADO | a01f72108c9e41e80 |
| 2026-10-06 12:15:21 | 2026-10-06 12:15:56 | `llm-integrator` | 2 | APROVADO | a4050ed0142c2166e |
| 2026-10-06 12:15:13 | 2026-10-06 12:15:58 | `conformidade-reviewer` | 2 | APROVADO | ace1e7c70a8824c65 |
| 2026-10-06 12:14:36 | 2026-10-06 12:16:26 | `privacy-guardian` | 2 | APROVADO | a9676ffb01561fd7e |
