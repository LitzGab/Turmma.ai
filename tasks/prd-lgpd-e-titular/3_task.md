# Tarefa 3.0 — A rotina noturna expurga a conversa e os sinais em cada escola

**Funcionalidade:** lgpd-e-titular · **Depende de:** 2.0 · **Paralelo com:** 7.0 a 10.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Toda noite um job por escola apaga a conversa do Tutor, os sinais e a conversa do professor vencidos, para no lote em que a janela letiva abre, grava `expurgo_execucao` e alerta quando a escola passa duas noites sem concluir.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (`expurgo_execucao`, `job_registro`), 5 ("Expurgo"), 6 e 7c
- `docs/infra.md` 5.2 e 5.3
- `.claude/rules/80-infra-e-carga.md` itens 2, 3, 8 e 10
- Código: `apps/worker/src/agendamentos.ts`, `processadores/expurgar-acesso.ts`, `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`, `fila/enfileirador.ts`, `fila/janela-letiva.ts`, `db/schema/job-registro.ts`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 3.1 — Migration própria: `job_registro.chave_idempotencia` (único parcial e check com escola), `expurgo_execucao`, índices `(escola_id, <data>)` de `mensagem_tutor`, `sinal_tutor`, `mensagem_agente`
- [x] 3.2 — `Enfileirador` com `chaveIdempotencia` (`on conflict` com o predicado; devolve id ou nulo)
- [x] 3.3 — `EscolasDaRotinaRepository` (`@SemEscopo`, só ids) em `packages/nucleo/src/rotina`
- [x] 3.4 — `sistema.expurgar-dado-pessoal` (1h) e `retencao.expurgar-escola` (lote, não urgente, chave "escola + data local")
- [x] 3.5 — `ExpurgoDaEscolaRepository`: lotes de 5.000, janela a cada lote, começo pela categoria pendente, linha por categoria mesmo com zero; categorias `conversa_tutor`, `sinal_tutor`, `conversa_professor`
- [x] 3.6 — Métrica e alerta de duas noites, parágrafo no `docs/runbook.md`; `docs/modelo-de-dados.md` (exceção da rotina)
- [x] 3.7 — Testes, parametrizados por catálogo com a lista "pendente da tarefa N"

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration, schema `expurgo_execucao`, `job-registro.ts` | novo/alterado |
| `packages/nucleo/src/fila/enfileirador.ts` | alterado |
| `packages/nucleo/src/rotina/*` | novo |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` | novo |
| `apps/worker/src/processadores/expurgar-dado-pessoal.ts`, `expurgar-escola.ts`, `agendamentos.ts`, `montagem.ts` | novo/alterado |
| regra de alerta, `docs/runbook.md`, `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| prazo por categoria | integração | um dia antes fica, um dia depois sai; reexecutar não apaga mais |
| ajuste: encurtar em A, aumentar depois | integração | sai a linha de A e fica a de B; nada volta |
| janela abre no meio | integração | `concluida=false` na interrompida, `true` nas outras; a noite seguinte começa pela pendente e grava `true` |
| 5.001 linhas; categoria vazia | integração | dois lotes; linha gravada com zero |
| thread com mensagem no prazo | integração | não sai |
| chave sem escola; 23h59 e 0h01 locais | integração | recusada; chaves diferentes |
| concorrência | integração [P] | mesma chave dá o mesmo id; dois jobs da mesma escola somam certo; a rotina duas vezes cria um job por escola; colisão com job terminado é "já enfileirado" |
| alerta | infra [F] | duas noites parciais alertam, parcial + completa não; categoria sem linha conta como não concluída |
| log novo | integração | só ids e contagens; o job vai para a fila de lote |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As categorias de anonimização (4.0) e de cadastro (5.0); arquivos do titular e eliminações (13.0, 15.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| `expurgo_execucao` classificada como prazo fixo no grupo `registro_de_decisao`, com `aplicadoPor` "expurgo da escola, 5 anos (tarefa 5.0)" | os oito grupos de `PRAZOS_FIXOS` são fechados (§3) e a tabela não tem pessoa; o grupo é o dos registros de prestação de contas, e o prazo de 5 anos vai no `aplicadoPor` | `techspec.md` §3 (linha da classificação); `packages/shared/src/privacidade/classificacao.ts` |
| A `thread_agente` vazia sai só se foi criada antes do corte, em duas instruções (trava com `skip locked`, depois reconfere vazia e apaga); `linhas` da conversa do professor soma mensagens e threads | a thread recém-aberta ainda sem mensagem sairia no meio do primeiro envio do professor; numa instrução só, uma mensagem confirmada entre a visão e a trava sairia em cascata | `techspec.md` §5 ("Tarefa 3.0, como ficou no código"); `cenarios.md` RF5; `docs/modelo-de-dados.md` |
| O alerta lê `expurgo.noites_incompletas{escola_id}` (0 a 2), medida pelo worker-lote a cada 5 min; a noite é o dia local de `em` no fuso da escola; a noite anterior à primeira execução não conta; escola que nunca rodou não tem série. A medição usa a `EscolasDaRotinaRepository` para abrir o contexto de cada escola | sem o limite da primeira execução, o primeiro dia depois do deploy (e toda escola nova) dispararia; a medição é da rotina, e cada escola é lida com escopo | `techspec.md` §6 (linha da `EscolasDaRotinaRepository`) e §7c ("Métrica e alerta"); `cenarios.md` RF5; `docs/runbook.md` ("Expurgo incompleto por duas noites numa escola") |
| `Enfileirador.enfileirarUmaVez` devolve `{ situacao: 'enfileirado' \| 'ja_enfileirado', id }`, com `id` nulo quando o job terminou entre a colisão e a leitura | o "id ou nulo" da §5 não distingue o job novo do existente, e a rotina conta os dois no log | `techspec.md` §5 ("Tarefa 3.0, como ficou no código") |
| O worker-lote passa a ler `JANELA_LETIVA_*` (config e `infra/compose.yml`) | o job confere a janela a cada lote, com o padrão quando a escola não tem horário próprio, como o despachante | `techspec.md` §5 ("Tarefa 3.0, como ficou no código") |
| O lote que falha grava a linha da categoria com `concluida = false` antes de o erro subir (correção exigida pelo `revisor-geral`, 1ª rodada) | sem a linha, a escola cujo expurgo falha desde a primeira noite nunca teria série, e o alerta nunca dispararia | `techspec.md` §7c ("Métrica e alerta"); `cenarios.md` RF5; `docs/runbook.md` (causa 3) |
| A categoria vai no log sob `tipo` | a guarda `log-sem-dado-pessoal` não aceita `categoria` como chave operacional, e a lista dela é fechada | `techspec.md` §5 ("Tarefa 3.0, como ficou no código") |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `packages/nucleo/src/fila/job-registro.repository.ts` › inserirUmaVez › `escolaId === undefined` (1º termo) | concorrência › a chave sem escola é recusada (o job de escola sem escola no contexto) |
| `packages/nucleo/src/fila/job-registro.repository.ts` › inserirUmaVez › `linha.tipo.startsWith(PREFIXO_TIPO_SISTEMA)` (2º termo) | concorrência › a chave sem escola é recusada |
| `packages/nucleo/src/fila/job-registro.repository.ts` › inserirUmaVez › o `where` do `onConflictDoNothing` (predicado do único parcial) | concorrência › [P] a mesma chave ao mesmo tempo; a colisão com um job que terminou |
| `packages/nucleo/src/fila/job-registro.repository.ts` › inserirUmaVez › `select pg_notify` só quando a linha entrou | concorrência › o despachante é acordado quando o job da chave entra, e não na colisão |
| `packages/nucleo/src/fila/job-registro.repository.ts` › inserirUmaVez › leitura da colisão: `eq(escolaId)`, `eq(tipo)`, `eq(chaveIdempotencia)`, `notInArray(estado, ESTADOS_FINAIS)` (termo a termo) | concorrência › a colisão com um job que terminou (os três jobs que só diferem em escola, tipo ou chave) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › APAGAR_LOTE.mensagem_tutor › `escola_id` na subconsulta | janela abre no meio; 5.001 linhas; lote por tabela › mensagem_tutor |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › APAGAR_LOTE.mensagem_tutor › `criada_em < corte` | prazo por categoria › conversa_tutor; ajuste da escola |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › APAGAR_LOTE.mensagem_tutor › `limit` | 5.001 linhas (lotes [5.000, 1]); lote por tabela › mensagem_tutor |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › APAGAR_LOTE.sinal_tutor › escola na subconsulta, `criado_em < corte`, `limit` (um a um) | lote por tabela › sinal_tutor; prazo por categoria › sinal_tutor; janela abre no meio |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › APAGAR_LOTE.mensagem_agente › escola na subconsulta, `criada_em < corte`, `limit` (um a um) | lote por tabela › mensagem_agente (B com linhas mais antigas); prazo por categoria › conversa_professor; thread do professor |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › apagarLote › `cheio: linhas >= limite` | janela abre no meio; 5.001 linhas |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › THREAD_VAZIA_E_VENCIDA › `t.escola_id`, `t.criada_em < corte`, `not exists (mensagem)` (termo a termo) | thread do professor › a thread com mensagem no prazo fica… a vazia antiga de outra escola fica; prazo por categoria › conversa_professor |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › apagarLote (thread) › a reconferência no delete | thread do professor › a thread que ganhou mensagem entre a visão da escolha e a trava não sai |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › apagarLote (thread) › `limit`; `cheio: ids.length >= limite` | lote por tabela › thread_agente |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › categoriaPendente › `ultima.concluida ? undefined` | isolamento › duas linhas no mesmo instante (a pendente terminada deixa de ser pendente) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › categoriaPendente › `desc(em)`; `where escola_id` | janela abre no meio; duas linhas no mesmo instante |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › categoriaPendente › `desc(id)` (desempate) | **equivalente na prática**: com `em` igual, a varredura para trás do índice `(escola_id, em)` já devolve a última gravada; o desempate fica explícito porque o SQL não garante a ordem sem ele |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › noitesDoAlerta › `primeira === undefined`; `where escola_id` da primeira | medição › escola sem execução não tem série; isolamento › as noites de uma escola não leem as de outra |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › noitesDoAlerta › `noite.dia >= primeira` (contada) | medição › duas noites parciais… a noite anterior à primeira não conta |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › noitesDoAlerta › `x.escola_id`, `x.concluida`, `x.categoria = any(...)`, `distinct`, `em >=`, `em <` (termo a termo) | medição › a noite só é completa com uma linha concluída de cada categoria… |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › noitesDoAlerta › o "hoje" no fuso da escola | medição › o "ontem" é o do fuso da escola |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › noitesSeguidasSemConcluir › `!noite.contada`; `concluidas >= categorias` | `expurgo-da-escola.test.ts` (unidade) |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › ordemDaNoite › `inicio <= 0` e a volta | `expurgo-da-escola.test.ts` › com a pendente, começa por ela e dá a volta |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › `contextoAtual()?.escolaId === undefined` | rotina › permissão |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › `retencaoDaEscola(await retencao.ajustes())` | ajuste da escola › encurtar o prazo em A |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › `estaNaJanela(...)`; `registrar(..., false, ...)` | janela abre no meio; com a janela aberta desde o começo |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › `linhasTotal +=` (na interrupção e no fim) | janela abre no meio (log `linhasTotal: 3`); 5.001 linhas (log `linhasTotal: 5.001`) |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › `if (!doLote.cheio) break` | janela abre no meio; 5.001 linhas |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › `ordemDaNoite(await repositorio.categoriaPendente())` | janela abre no meio (a noite seguinte começa pela pendente) |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › o corte de um `agora` só | janela letiva › o corte é contado do `agora` do começo do job |
| `apps/worker/src/processadores/expurgar-dado-pessoal.ts` › criarRotinaDeExpurgo › `rotinaDoSistema !== true` | rotina › permissão |
| `apps/worker/src/processadores/expurgar-dado-pessoal.ts` › criarRotinaDeExpurgo › `chaveDaNoite(fuso, agora)` com o fuso da escola | rotina › grava um job por escola… com a data local da escola |
| `apps/worker/src/processadores/expurgar-dado-pessoal.ts` › criarRotinaDeExpurgo › `naoUrgente: true` | rotina › grava um job por escola… |
| `apps/worker/src/processadores/expurgar-dado-pessoal.ts` › criarRotinaDeExpurgo › `try/catch` por escola; `if (falhasTotal > 0) throw` | rotina › uma escola que falha não segura as outras |
| `apps/worker/src/processadores/expurgar-dado-pessoal.ts` › criarRotinaDeExpurgo › `else jaEnfileiradosTotal += 1` | rotina › [P] duas rotinas ao mesmo tempo |
| `apps/worker/src/medicao-do-expurgo.ts` › medir › `if (noites !== undefined)` | medição › duas noites parciais… (a escola sem execução fica sem série e sem aviso) |
| `apps/worker/src/medicao-do-expurgo.ts` › medir › `catch` por escola; `#series.clear()` na lista que falha | medição › a escola que falha fica sem série… |
| `apps/worker/src/medicao-do-expurgo.ts` › medir › `if (this.#encerrada) return` | medição › o encerramento no meio de uma volta |
| `packages/nucleo/drizzle/0025_expurgo_execucao.sql` › único parcial: o predicado `estado not in ('concluido', 'falhou')` (banco recriado, `EDUCA_BANCO_NOVO=1`) | concorrência › a colisão com um job que terminou… (terminado, a mesma chave grava outro job) |
| `0025` › único parcial: `escola_id` entre as colunas | concorrência › [P] a mesma chave ao mesmo tempo; a colisão… |
| `0025` › check `job_registro_chave_so_com_escola` | concorrência › a chave sem escola é recusada (insert direto) |
| `0025` › índice `mensagem_tutor_criada_em_idx` (o teste confere os três índices de data no mesmo laço) | lotes › o lote de cada tabela desce pelo índice `(escola_id, <data>)` |
| `0025` › checks `expurgo_execucao_categoria_valida` e `expurgo_execucao_linhas_nao_negativas` (um a um) | banco › `expurgo_execucao` recusa categoria fora do catálogo e contagem negativa |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › APAGAR_LOTE (as três) › `for update skip locked` (um a um) | lote por tabela › o lote leva primeiro a mais antiga, e pula, sem esperar, a linha que outra transação travou |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › APAGAR_LOTE (as três) › `order by <data>` (um a um: sem ele, e trocado por `order by id` e por `order by id desc`) | lote por tabela › o lote leva primeiro a mais antiga… (e o do `EXPLAIN`); **uma exceção equivalente na prática:** em `mensagem_tutor`, sem o `order by`, o plano desce pelo índice `(escola_id, criada_em)` e entrega a mais antiga do mesmo jeito; o `order by` fica porque o SQL não garante a ordem sem ele |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` › APAGAR_LOTE › o `escola_id` do `delete` de fora; THREAD_VAZIA_E_VENCIDA › `m.escola_id = t.escola_id` | **equivalentes**: a outra cláusula de escola (a da subconsulta; `t.escola_id`) já filtra, e o id é UUID único; ficam como defesa em profundidade e para o índice |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › `registrar(..., false, ...)` no `catch` | janela letiva › a escola cujo expurgo falha no primeiro lote desde a primeira noite… (a série fica sem valor sem a linha); o lote que falha numa categoria do meio… |
| `apps/worker/src/processadores/expurgar-escola.ts` › criarExpurgoDaEscola › o `.catch` da gravação no `catch` (aviso `retencao.registro_nao_gravado` e o erro original sobe) | janela letiva › se nem a linha `false` grava, fica o aviso e sobe o erro do lote; log › toda linha `retencao.*`… |
| `apps/worker/src/processadores/expurgar-escola.ts` › `if (meses === undefined) throw` | **inalcançável**: `retencaoDaEscola` devolve toda categoria do catálogo; a guarda existe porque `Map.get` tipa `number \| undefined` |
| `apps/worker/src/montagem.ts` › `await rotinas?.encerrar()` (para a medição) | sem teste próprio: o desligamento do worker com graça é coberto pelos testes de montagem que já existem, e a medição para na escola seguinte (medição › o encerramento no meio de uma volta) |
| `apps/worker/test/expurgo-da-escola.int.test.ts` › log | log › toda linha `retencao.*` que este arquivo produziu… só tem as chaves permitidas |
| `apps/worker/src/config.ts` › `janelaPadrao` só no lote, obrigatório | `config.test.ts` › o worker-lote lê o horário letivo; não sobe sem cada `JANELA_LETIVA_*` |
| `infra/grafana/alertas/expurgo-noites-incompletas.yaml` › expressão, limiar `> 1`, `for: 1m` | `infra/test/alertas.test.ts`; `infra/test/alerta-do-expurgo.int.test.ts` |
| `apps/worker/src/agendamentos.ts` › `0 1 * * *` | `uso.int.test.ts` › as rotinas são agendadas à 1h… |
| `packages/shared/src/privacidade/classificacao.ts` › `expurgo_execucao` | `arquitetura.test.ts` › a CLASSIFICACAO_DAS_TABELAS confere com as migrations |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `test-engineer` 1ª | o teste [P] dos dois jobs da mesma escola usar o gatilho de parada para garantir a sobreposição | recusada: a soma certa vale em qualquer intercalação, e o `skip locked` agora tem teste determinístico próprio (lote por tabela) |
| `test-engineer` 1ª, `infra-guardian` 1ª, `revisor-geral` 1ª | o alerta conta "de ontem para trás" (dispara à meia-noite local e fica ligado o dia da noite completa); execução que atravessa a meia-noite numa escola a oeste de São Paulo; consulta agrupada com centenas de escolas | `TODO.md` ("Alerta de duas noites do expurgo"), antes da primeira escola fora do fuso de São Paulo; a §7c da `techspec.md` cita a pendência |
| `infra-guardian` 1ª | o check da 0025 percorre `job_registro` com trava, e os índices sem `concurrently` | `TODO.md` ("Migration 0025 antes do staging") |
| `infra-guardian` 1ª, `revisor-geral` 1ª | erro tipado ao professor quando a thread some no envio; índice próprio para a thread vazia | `TODO.md` ("Thread do Assistente apagada pelo expurgo no instante do envio") |
| `infra-guardian` 2ª | a linha `false` da falha vira a pendente, e uma categoria que falha toda noite segura as seguintes | `TODO.md` ("Categoria que falha toda noite segura as seguintes"); o runbook (causa 3) cita |
| `test-engineer` 3ª | levar o auxiliar `medicaoDe` para o escopo de fora e reaproveitar nos dois testes de falha | recusada: só organização do teste, sem efeito na regra; fica para a próxima tarefa que mexer no arquivo (4.0) |
| `test-engineer` 3ª | o caso da thread apagada no envio, quando virar tarefa, entra como concorrência de verdade | `TODO.md` ("Thread do Assistente apagada pelo expurgo no instante do envio"), junto do item |
| `tenancy-guardian` 2ª | as cláusulas de escola repetidas ficam no código (defesa em profundidade) | aplicada: ficam, e "Mutações" as declara equivalentes |
| `test-engineer` 4ª | teste da gravação da janela letiva que falha e é tentada de novo no `catch` (uma linha `false`, sobe o erro da primeira gravação, sem aviso) | tarefa 4.0, que mexe no mesmo processador ao acrescentar categorias: caminho raro e cobertura extra, sem regra nova |
| `revisor-geral` 3ª | a gravação `true` fora do `try`: se ela falhar, a categoria fica sem linha e parece "o job não rodou" (causa 2) | tarefa 4.0, que mexe no mesmo processador; a causa 2 do runbook já manda olhar o `job_registro` (job `falhou` com o erro) |
| `revisor-geral` 3ª | um auxiliar de log no lugar do `const tipo = categoria` repetido | tarefa 4.0 (forma, sem efeito na regra) |
| `privacy-guardian` 1ª | gravar em `expurgo_execucao` o prazo em meses aplicado | tarefa 13.0 (o que a escola responde sobre o expurgo) ou 5.0; fica no `/validar` |
| `privacy-guardian` 1ª | conferir no `/validar` o expurgo de 5 anos da `expurgo_execucao` | tarefa 5.0 (5.4) |
| `privacy-guardian` 1ª | sentinela do arquivo do titular confirmando que `expurgo_execucao` não se liga a pessoa | tarefa 13.0 (as sentinelas saem da `CLASSIFICACAO_DAS_TABELAS`, onde ela está fora do arquivo) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-06 00:41:24 | 2026-10-06 00:44:57 | `test-engineer` | 1 | APROVADO | a4dd4448f0838ea9b |
| 2026-10-06 00:45:19 | 2026-10-06 00:46:13 | `tenancy-guardian` | 1 | APROVADO | a33dc78b6c1222216 |
| 2026-10-06 00:45:27 | 2026-10-06 00:46:41 | `privacy-guardian` | 1 | APROVADO | ae79a8864db263d0e |
| 2026-10-06 00:45:36 | 2026-10-06 00:47:23 | `infra-guardian` | 1 | APROVADO | a9eef687af882bfd9 |
| 2026-10-06 00:45:10 | 2026-10-06 00:48:02 | `revisor-geral` | 1 | REPROVADO | a02566179bf518114 |
| 2026-10-06 01:31:14 | 2026-10-06 01:34:10 | `test-engineer` | 2 | REPROVADO | af9485e8fc912b056 |
| 2026-10-06 02:15:20 | 2026-10-06 02:15:50 | `test-engineer` | 3 | APROVADO | a5b77b82c344b9163 |
| 2026-10-06 02:16:13 | 2026-10-06 02:16:38 | `tenancy-guardian` | 2 | APROVADO | a1e3827542bf58c01 |
| 2026-10-06 02:16:19 | 2026-10-06 02:16:50 | `privacy-guardian` | 2 | APROVADO | ac4f6abd6ed13eff0 |
| 2026-10-06 02:16:07 | 2026-10-06 02:16:55 | `revisor-geral` | 2 | APROVADO | a93e9f0f1eddecc1b |
| 2026-10-06 02:16:26 | 2026-10-06 02:17:05 | `infra-guardian` | 2 | APROVADO | ae17280c76c030b95 |
| 2026-10-06 02:57:24 | 2026-10-06 02:57:50 | `test-engineer` | 4 | APROVADO | aeba3623f3a16a1fa |
| 2026-10-06 02:58:03 | 2026-10-06 02:58:15 | `tenancy-guardian` | 3 | APROVADO | abdf09f8d04045d13 |
| 2026-10-06 02:57:59 | 2026-10-06 02:58:23 | `revisor-geral` | 3 | APROVADO | a67c5d270a4a9ad00 |
| 2026-10-06 02:58:08 | 2026-10-06 02:58:31 | `privacy-guardian` | 3 | APROVADO | a60380e057fbeb54c |
| 2026-10-06 02:58:13 | 2026-10-06 02:58:31 | `infra-guardian` | 3 | APROVADO | adf5eaeb2ccfa1df6 |
