# Tarefa 19.0 — A carga prova que o expurgo não atrapalha a aula, e os documentos fecham o F3

**Funcionalidade:** lgpd-e-titular · **Depende de:** 3.0 a 18.0, 20.0 · **Paralelo com:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`, `llm-integrator`, `privacy-guardian`, `tenancy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O cenário de carga mostra o expurgo e a troca de nome de uma escola sem degradar o Tutor de outra, `ops:privacidade` mostra só contagens, e os documentos ficam fiéis ao código.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 7c e 11
- `docs/infra.md` seção 10
- Código: `infra/k6/justica-entre-escolas.js`, `apps/api/src/ops/uso.ts`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 19.1 — Cenário de carga com o adaptador falso de latência simulada (`IA_LATENCIA_FALSA_MS`); p95 do turno do Tutor de B, pela rota, com e sem o lote de A; statements medidos no Postgres e cancelados lidos no log
- [x] 19.2 — `ops:privacidade` (contagens por escola) com sentinelas
- [x] 19.3 — `docs/lgpd.md`, `modelo-de-dados.md`, `arquitetura.md`, `runbook.md` conferidos
- [x] 19.4 — Pendências para o `TODO.md`: a contração de `provedor` (release posterior), recomendações abertas
- [x] 19.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `infra/k6/*` | alterado |
| `apps/api/src/ops/privacidade.ts` | novo |
| documentos | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| carga | carga | cada statement < 2 s; o p95 do Tutor de B não piora além do limite do cenário |
| operação | integração | as saídas de `ops:privacidade` não trazem nenhuma sentinela |

## Como testar

- **operação:** `apps/api/test/painel-leitura.int.test.ts › com sentinelas em cada tabela de pessoa…`; a montagem da escola e do comando em `apps/api/test/ops-uso.int.test.ts › isolamento: a escola B com uso no mesmo dia não aparece…` (`BancadaDeSessoes`). Ponha o comando na lista de `apps/api/test/ops-operador.int.test.ts › C2`: a 2.0 reprovou por faltar.
- **carga:** `infra/test/carga.test.ts › a espera da B acima da base + margem reprova o cenário…` e `infra/test/conferir-carga.int.test.ts › só olha as escolas do cenário…`. O cenário roda por `npm run carga`, fora do Vitest, com o adaptador falso.
- **statement < 2 s:** `apps/worker/test/expurgo-da-escola.int.test.ts › o lote de trabalho com a cascata…`.
- Armadilha (`estado.md`): plano do Postgres depende de estatística; sem volume e `analyze` na tabela, o teste fica intermitente (`1a405d2`).
- Rodar: `npx vitest run --project integracao <arquivo>`; `--project unidade infra/test/carga.test.ts`; `--project infra` no `conferir-carga`.

## Critério de conclusão

- [x] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Nada novo de produto.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| O turno do Tutor da B é medido do `POST /v1/tutor/mensagens` à execução concluída pelo k6 (`turno_b`), porque `GET /v1/execucoes/:id` não devolve datas; o critério da fase lê `criada_em` a `concluida_em` no banco, só dos turnos criados durante o trabalho da A | A rota é a do Tutor de verdade, com o adaptador falso de latência simulada (nova variável `IA_LATENCIA_FALSA_MS`, que o `AdaptadorFalso` já aceitava como opção). A semente da B é SQL mínima (`semearTutorDaB`: ano em curso, turma e vínculo confirmado dos alunos), sem sala, atividade nem material: semente de teste, não produto | `techspec.md` §7c, linha "Cenário de teste de carga" e a lista "Tarefa 19.0, como ficou no código"; `cenarios.md`, o item "Carga"; `TODO.md`, "Escrita a mais por troca do Tutor"; `docs/infra.md` seção 10 |
| O mínimo de turnos do Tutor da B no trabalho da A é 5, e o dos jobs sintéticos continua 10 | O teto é de 120 pedidos de IA por minuto por escola (1,5 turno por segundo no cenário), e o trabalho da A dura uns 10 s | `techspec.md` §7c (a lista "Tarefa 19.0, como ficou no código"); `docs/runbook.md`, "Rodar o cenário de carga", critério `sem_amostra_da_b` |
| O teto da medida de statement é 1,5 s, e o statement cancelado pelo `statement_timeout` reprova pela leitura do log do Postgres | O cancelado em 2 s não entra no `max_exec_time`, e o executor repete o job: a 1ª tentativa estoura e a 2ª passa, sem rastro em `job_registro` | `techspec.md` §7c; `docs/runbook.md`, critério `statement_acima_de_2s`; `docs/infra.md` seção 10 |
| O "p95 com e sem o lote de A" é o p95 da fase base contra o p95 dos jobs da B **criados durante o trabalho da A**, e não o dos dois minutos do k6 da fase | O expurgo e a troca de nome terminam em uns 10 s (1 milhão de linhas, 2 CPUs no Postgres): o p95 da janela inteira do k6 o diluiria e passaria sempre. A fase exige 10 amostras da B no intervalo e reprova sem elas (`sem_amostra_da_b`) | `techspec.md` §7c ("Tarefa 19.0, como ficou no código"); `docs/runbook.md`, "Rodar o cenário de carga"; `TODO.md`, "O expurgo de 1 milhão de linhas dura segundos" |
| A fase do expurgo não roda no controle negativo (`VAGAS_POR_ESCOLA_DESLIGADAS=true`) | Ela não depende da vaga por escola, e o controle negativo existe para provar que a justiça reprova sem ela. Sem a fase, ele leva 8 min em vez de 11 e continua reprovando só pela justiça | `techspec.md` §7c; `docs/runbook.md`, "Rodar o cenário de carga" |
| As contagens do `ops:privacidade` saem de um repositório próprio, `ContagensDePrivacidadeRepository`, e não do `OperacaoPrivacidadeRepository` | O teste de arquitetura dá dono único às tabelas da operação, e `pedido_titular`, `arquivo_titular` e `expurgo_execucao` são da escola: ler com o escopo do contexto, sem `@SemEscopo`, e pelos dois leitores que já existem para suboperador e incidente. Nenhum `@SemEscopo` novo | `techspec.md` linha 35 e a tabela da seção 6 (repositórios) |
| `pg_stat_statements` carregado no Postgres do compose de carga | O `max_exec_time` é a medida que a Tech Spec pede ("cada statement < 2 s") e o módulo não vinha ligado. O compose de teste e o de desenvolvimento não mudam | `techspec.md` §7c; `docs/infra.md` seção 10; `infra/compose.carga.yml` |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `contagens-de-privacidade.repository.ts` › `doAtendimento` › `eq(pedidoTitular.escolaId, escolaId)` | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…`; `ops-privacidade.int.test.ts › a escola sem nada tem zero em tudo, com a data nula` |
| … › `count(*) filter (where estado = 'agendado' and eliminarEm < now())` (a data invertida, e o estado retirado) | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…` (as duas) |
| … › `arquivos.ativos`: `apagadoEm is null and expiraEm > now()` (sem o `apagadoEm`, e a data invertida) | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…` (as duas) |
| … › `arquivos.vencidos`: `apagadoEm is null and expiraEm <= now()` (sem o `apagadoEm`) | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…` |
| … › `eq(arquivoTitular.escolaId, escolaId)` | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…`; `ops-privacidade.int.test.ts › a escola sem nada tem zero em tudo, com a data nula` |
| … › `eq(expurgoExecucao.escolaId, escolaId)` | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…`; `ops-privacidade.int.test.ts › a escola sem nada tem zero em tudo, com a data nula` |
| … › `distinct on (categoria) … order by categoria, em desc` (trocado por `asc`) | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…` |
| … › `count(*) filter (where concluida)`, `count(*) filter (where not concluida)` e `max(em)` (cada uma trocada) | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…` (as três) |
| … › `eliminacoes.agendadas: porEstado.agendado` | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…` |
| `privacidade.ts` › `consultarPrivacidade` › `empresa.fim === null` | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…`; `ops-privacidade.int.test.ts › a escola sem nada tem zero em tudo, com a data nula` (o `todas` encerrado ontem, numa escola que existe há dez dias) |
| … › `secao.confirmadoEm === null` | `ops-privacidade.int.test.ts › conta, em cada tabela, só o da escola do pedido…` |
| … › `(await new AcessoDaEscolaRepository(tx).nome()) === undefined` → `NAO_ENCONTRADO` | `ops-privacidade.int.test.ts › escola que não existe: NAO_ENCONTRADO fixo, sem o id` |
| … › `await autor(tx)` (a conferência do autor, a primeira instrução da transação) | `ops-operador.int.test.ts › C2: … OPERADOR inexistente ou desativado é recusado em cada ops:*` (caso `ops:privacidade`) |
| `expurgo-da-carga.ts` › `julgarResultadoDoExpurgo` › `trabalho.falhos > 0`, `trabalho.expurgos === 0`, `trabalho.eliminacoes === 0`, `trabalho.emAndamento > 0` | `expurgo-da-carga.test.ts` › job que falhou, expurgo que não enfileirou a eliminação e job que não terminou… (cada uma) |
| … › as cinco da lista `sobrando` (`mensagensDoTutor`, `execucoesPorAnonimizar`, `consumosComTexto`, `estadoDoPedido !== 'concluido'`, `categoriasConcluidas < CATEGORIAS_DO_CATALOGO`) e `sobrando.length > 0` | `expurgo-da-carga.test.ts` › … reprova como expurgo incompleto (uma por linha) |
| … › `resto.linhasComONome > 0 || resto.titularExiste` | `expurgo-da-carga.test.ts` › … reprova como troca de nome incompleta (as duas) |
| … › `statements === undefined || statements.total === 0`, `ausentes.length > 0` | `expurgo-da-carga.test.ts` › o pg_stat_statements que não respondeu, que não viu nada ou que não viu uma tabela… (a de `total === 0` com as tabelas vistas é desta tarefa, depois da mutação que sobreviveu) |
| … › `statement.maximoMs >= LIMITE_DO_STATEMENT_MS` | `expurgo-da-carga.test.ts` › o statement no teto do banco reprova, e um milissegundo abaixo passa |
| … › `esperaDaB.amostras < AMOSTRAS_MINIMAS_DA_B` | `expurgo-da-carga.test.ts` › menos de dez jobs da B durante o trabalho da A… |
| … › `esperaDaB.p95Ms === null || esperaDaB.p95Ms > limite` e `Math.ceil(esperaBaseP95Ms) + MARGEM_SOBRE_A_BASE_MS` (sem a margem, e com a margem multiplicada) | `expurgo-da-carga.test.ts` › a espera da B durante o trabalho: na base + margem passa, um ms acima reprova… |
| … › `lerTrabalhoDaA` › `estado = 'falhou'`, `estado not in ('concluido', 'falhou')`, `escola_id = $1 and tipo in ($2, $3)` | `expurgo-da-carga.int.test.ts` › lê o trabalho da A…; só olha os jobs da própria escola e dos dois tipos do expurgo |
| … › `aguardarTrabalhoDaA` › `trabalho.expurgos > 0 && trabalho.eliminacoes > 0 && trabalho.emAndamento === 0` | `expurgo-da-carga.int.test.ts` › sem a eliminação enfileirada, o expurgo concluído não encerra a espera… |
| … › `lerRestoDaA` › `anonimizada_em is null`, `(entrada is not null or saida is not null)`, `order by categoria, em desc` | `expurgo-da-carga.int.test.ts` › não conta o que já foi anonimizado…; a categoria conta pela última execução dela… |
| … › `lerEsperaDaBNoTrabalho` › `fila = 'interativa'`, `criado_em between … and …` | `expurgo-da-carga.int.test.ts` › conta só os interativos da B que nasceram entre o começo e o fim do trabalho… |
| … › `lerStatements` › `order by max_exec_time desc limit 5` (trocado por `asc`) e a leitura das tabelas vistas | `expurgo-da-carga.test.ts` › devolve os cinco mais lentos pelo máximo, do pior para o melhor… |
| … › `semearEscolaA` › `interval '13 months'` (trocado por 11), `eliminar_em now() - interval '1 hour'` (por `+`), o `update usuario set eliminacao_agendada_em` | `expurgo-da-carga.int.test.ts` › cria o volume vencido, o ano de uso do titular… (as três) |
| … › `liberarJanelaDaA` › `on conflict (escola_id) do update set dias_letivos = '{}'` | `expurgo-da-carga.int.test.ts` › libera a janela da A sem apagar o que a escola já tinha configurado |
| … › `medirEscritaDosIndices` › `rollback` (trocado por `commit`) e `drop index ${indice}` (retirado) | `expurgo-da-carga.int.test.ts` › mede com e sem os índices, e não deixa nada…; apaga os três índices dentro da transação da medida… |
| `carga.ts` › `julgarCenario` › `expurgo === undefined`, `expurgo !== 'dispensada'`, `doK6('expurgo', expurgo.k6)`, `reprovacoes.push(...expurgo.reprovacoes)`, e o prefixo `${fase}:` do critério | `carga.test.ts › a fase do expurgo e da troca de nome…` (os quatro casos, um por cláusula) |
| `compose.carga.yml` › `postgres.command` › `shared_preload_libraries=pg_stat_statements` e `max_connections=…` | `carga.test.ts › infra/compose.carga.yml › o Postgres carrega o pg_stat_statements e mantém o teto de conexões…` |
| `justica-entre-escolas.js` › `FASE !== 'base' && FASE !== 'expurgo' && FASE !== 'carga'` | `expurgo-da-carga.test.ts` › o k6 aceita a fase e a compara com a base… |
| `provedor.ts` › `criarProvedorDeIa` › `new AdaptadorFalso(config.latenciaFalsaMs === undefined ? {} : { latenciaMs: config.latenciaFalsaMs })` (trocado por `new AdaptadorFalso()`) | `provedor.test.ts` › o adaptador falso com `latenciaFalsaMs: 200` espera ao menos 190 ms |
| `config-ia.ts` › `lerConfiguracaoDeIa` › `...(valores.IA_LATENCIA_FALSA_MS > 0 ? { latenciaFalsaMs: … } : {})` (retirado) | `config-ia.test.ts` › `IA_LATENCIA_FALSA_MS=250` vira `latenciaFalsaMs: 250` |
| … › `esquemaAmbienteDeIa` › `IA_LATENCIA_FALSA_MS: inteiro(0, 60_000, 0)` (teto trocado por 600.000, e piso por 1) | `config-ia.test.ts` › `60001` recusado com o prazo longo; `0` e ausente viram `undefined` |
| `infra/compose.yml` › `api.environment` › `IA_LATENCIA_FALSA_MS: ${IA_LATENCIA_FALSA_MS:?…}` (retirada), e `infra/carga.env` › `IA_LATENCIA_FALSA_MS=300` (trocado por 0) | `carga.test.ts` › o compose passa `IA_LATENCIA_FALSA_MS` às duas APIs e o `carga.env` a liga; `tools/ci/ambiente.test.ts` |
| `expurgo-da-carga.ts` › `julgarResultadoDoExpurgo` › `statement.maximoMs >= TETO_DA_MEDIDA_MS` (trocado por `LIMITE_DO_STATEMENT_MS`), e `TETO_DA_MEDIDA_MS = 1_500` (trocado por 1.900) | `expurgo-da-carga.test.ts` › o statement no teto da medida reprova, e um milissegundo abaixo passa; 1.600 ms reprova |
| … › `statementsCancelados === undefined` (retirada) e `statementsCancelados > 0` (trocado por `> 1`) | `expurgo-da-carga.test.ts` › a tentativa cancelada por timeout seguida de tentativa que conclui reprova; com 0 passa; com `undefined` reprova como `statements_sem_amostra` |
| … › `contarStatementsCancelados` › `/canceling statement due to statement timeout/g` | `expurgo-da-carga.test.ts` › o log do Postgres: cada corte conta uma vez, e o resto do log não conta |
| … › `turnoDaB.amostras < AMOSTRAS_MINIMAS_DO_TURNO` (trocado por `< 0`) e `AMOSTRAS_MINIMAS_DO_TURNO = 5` (por 4) | `expurgo-da-carga.test.ts` › menos de cinco turnos da B reprova como `sem_amostra_da_b`, e o mínimo é 5 |
| … › `turnoDaB.p95Ms === null \|\| turnoDaB.p95Ms > limite` (a comparação retirada), e `Math.ceil(turnoBaseP95Ms) + MARGEM_SOBRE_A_BASE_MS` (sem a margem, e com a margem dobrada) | `expurgo-da-carga.test.ts` › o turno da B na base mais a margem passa, um ms acima reprova com `turno_b_no_expurgo` (as três) |
| … › `lerTurnoDaBNaJanela` › `escola_id = $1`, `funcao = 'tutor_com_o_aluno'`, `estado = 'concluida'` e `criada_em between … and …` (cada uma retirada) | `expurgo-da-carga.int.test.ts` › conta só os turnos concluídos do Tutor da B criados na janela do trabalho da A (as quatro) |
| … › `semearTutorDaB` › `u.papel = 'aluno'` (retirada), `'confirmado'` (trocado por `'pendente'`) e `not exists (select 1 from vinculo …)` (retirada) | `expurgo-da-carga.int.test.ts` › dá a cada aluno da B o vínculo confirmado na turma do ano em curso, uma estrutura só, e nenhum a quem já tem (as três) |
| … › `semearEscolaA` › as três inserções de `execucao_agente` com `estado = 'concluida'` (sem o estado, a varredura da API falha 250 mil de uma vez e estoura o `statement_timeout`: achado da própria execução, no `npm run carga`) | `expurgo-da-carga.int.test.ts` › cria o volume vencido…: "nenhuma execução aberta" (a inserção do Tutor de 13 meses com `estado = 'pendente'` o deixa vermelho) |
| … › `medirEscritaDosIndices` › `set local lock_timeout = '5s'` logo depois do `begin` (retirado) | `expurgo-da-carga.int.test.ts` › apaga os três índices dentro da transação da medida…: a lista tem `set local lock_timeout` depois de cada `begin` |
| `carga.ts` › `escolherFaseDoExpurgo` › `if (controleNegativo) return { fase: 'dispensada' }`, `if (esperaBaseP95Ms === undefined) return { fase: 'sem_base' }` e `return { fase: 'rodar', esperaBaseP95Ms }` (a base trocada por 0) | `carga.test.ts` › a fase do expurgo: dispensada no controle negativo, roda com a base, e não roda sem a base |
| `carga.ts` › `executar` › `escolherFaseDoExpurgo` e `faseDoExpurgo` (a leitura do log, o turno da B e o `semearTutorDaB`) | nenhum teste de unidade alcança `executar` (ele sobe o compose): conferidas pelas duas execuções de ponta a ponta, em 10/10/2026: `npm run carga` (passou, 11 min: base do turno 314 ms, turno durante o trabalho da A p95 380 ms, 0 statements cancelados, maior statement 275 ms) e `npm run carga:controle-negativo` (reprovou pela justiça, ✔, 8 min, sem a fase) |
| `justica-entre-escolas.js` › `new Counter('turnos_b_concluidos')`, `thresholds.turnos_b_concluidos = ['count>0']` e `new Trend('turno_b', true)` (renomeado) | `expurgo-da-carga.test.ts` › o k6 aceita a fase e a compara com a base… (o k6 recusa `count` em Trend: o `npm run carga` achou) |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `privacy-guardian`, 1ª | `semearEscolaA`, `prepararMedicaoDeStatements` e `medirEscritaDosIndices` conferirem o banco (`current_database()`, ou `AMBIENTE=local`) antes de semear, de `pg_stat_statements_reset()` e de `drop index` | Recusada: o banco tem o mesmo nome (`educa`) no desenvolvimento, no teste e na carga (`POSTGRES_BANCO` do `.env.example`), então a guarda por nome não distingue o que importa; só `carga.ts` (URL de `infra/carga.env`) e o teste de integração chamam as três. A trava é a URL do `carga.env` |
| `privacy-guardian`, 1ª | Filtrar `toplevel` ou deixar de fora o que não for DML no que `lerStatements` imprime (até 160 caracteres, com `track=all`) | Recusada por ora: a medição só roda no projeto `educa-carga`, com dado sintético; reabre se a medição um dia rodar fora dele (`TODO.md`, item da carga) |
| `privacy-guardian`, 1ª e `tenancy-guardian`, 1ª | `incidentes.avisados` herda o teto `LIMITE_DA_LISTA_DE_INCIDENTES` e pode sair menor que o real; trocar por `count(*)` no leitor | `TODO.md`: o leitor é da coordenação (tarefa anterior), fora dos arquivos desta; o teto está declarado no comentário de `privacidade.ts` |
| `infra-guardian`, 1ª | Devolver o `statement_timeout` à sessão depois da semente (alternativa ao `lock_timeout`) | Não aplicada: o item 7 resolve o `drop index` sem mudar a semente |
| `test-engineer`, 2ª | A fase `base` não exige mínimo de turnos no banco (só o `count>0` do k6); uma base com 1 ou 2 turnos dá p95 de pouco valor | `TODO.md`, no item "Escrita a mais por troca do Tutor": critério novo e teste de unidade próprios, fora desta correção |
| `infra-guardian`, 2ª e `llm-integrator`, 1ª | `IA_LATENCIA_FALSA_MS` com `:-0` no `infra/compose.yml` (hoje `:?`, obrigatória) | Recusada: toda variável do bloco de IA do arquivo é `:?defina`, a variável está no `.env.example`, que o compose de carga lê (`carga.test.ts` confere) e um `.env` sem ela falha cedo, com o nome da variável |
| `llm-integrator`, 1ª | O `superRefine` de `IA_LATENCIA_FALSA_MS >= LLM_TIMEOUT_MS` roda também com `openai_compat`, onde a variável é ignorada | Recusada: efeito mínimo; a validação em todo ambiente falha cedo e a variável vale 0 por padrão |
| `infra-guardian`, 2ª | Fixar `-c log_min_error_statement=error` no Postgres de carga, para a linha `STATEMENT:` não sumir se o padrão mudar | Recusada: `error` é o padrão do Postgres; só a forma do statement cortado depende dele, e o cancelamento é contado pela mensagem de erro, que não depende. Reabre se a configuração do Postgres de carga mudar |
| `infra-guardian`, 2ª | O runbook diz que o statement mostrado na saída é o primeiro lugar a olhar, já que o log cobre a fase inteira | `TODO.md`, junto do item da carga (parágrafo do runbook, "Rodar o cenário de carga") |
| `revisor-geral`, 2ª | `lerStatements(...).catch(() => undefined)` descarta o erro sem imprimir (`carga.ts`, `faseDoExpurgo`) | `TODO.md`, junto do item da carga: é o mesmo padrão do `prepararMedicaoDeStatements`, e `statements_sem_amostra` já reprova a fase |
| `revisor-geral`, 2ª | O nome `statement_acima_de_2s` induz a erro agora que dispara a partir de 1,5 s ou por cancelamento | Recusada: é o nome da Tech Spec, do `cenarios.md` e do runbook; o runbook explica o gatilho. Renomear mexe em cinco documentos |
| `revisor-geral`, 2ª | O texto da subtarefa 19.1 em `tasks.md` ficou diferente do de `19_task.md` | Orquestrador, ao marcar a 19.0 em `tasks.md` (documento de estado dele, passo 4 do `/seguir`) |
| `revisor-geral`, 2ª | A linha do mínimo de 5 turnos em "Divergências resolvidas" aponta só para o runbook; incluir a Tech Spec §7c | Aplicada: a coluna "Onde está na spec" da linha agora cita o `techspec.md` §7c |
| `tenancy-guardian`, 2ª | `expurgo-da-carga.int.test.ts:284` filtra por `escola_id = outra`, e passaria mesmo sem o filtro de escola | Recusada: quem prova a regra é a asserção sobre os vínculos da B, algumas linhas acima, e, segundo o próprio `tenancy-guardian`, ela quebra sem `u.escola_id = $1` em `semearTutorDaB` |
| `tenancy-guardian`, 2ª e `privacy-guardian`, 2ª | `formasDosStatementsCancelados` imprime o texto bruto do `STATEMENT:` do log; só serve ao projeto de carga | `TODO.md`, no item da carga (o que já guarda o `toplevel` de `lerStatements`): reabre se a função for reaproveitada fora do projeto `educa-carga` |
| `privacy-guardian`, 2ª | A ordem da rodada 1 dizia "material, atividade, sala" na semente da B, e o código cria só ano, série, turma e vínculos | `/retro` da funcionalidade: a ordem pediu mais do que o turno do Tutor precisa; os revisores a aceitaram, e o `TODO.md` declara a ausência no cenário "Tutor em sala" |
| `test-engineer`, 3ª | O "antes e depois" do caso da escola vazia lê a tabela global `suboperador`: outro arquivo de integração que grave um `todas` vigente entre as duas leituras faz o `+1` virar `+2` (o caso principal tem o mesmo risco). Comparar com um `count` SQL filtrado pelos ids que o próprio teste criou | `/retro` da funcionalidade: banco de teste compartilhado (regra 40, "o próprio ambiente de teste"); a suíte de integração não roda arquivos concorrentes sobre a mesma tabela hoje |
| `llm-integrator`, 2ª | `expect(sem).toBeLessThan(com)` não pega "a latência vira 200 ms por padrão"; um limite relativo (`sem < com - 100`) fecharia o caso | `/retro`: reforço opcional do teste, sem efeito no código de produto desta tarefa; o `com >= 190` já prova que a latência é aplicada |
| `infra-guardian`, 3ª e `revisor-geral`, 3ª | `faseDoExpurgo` não tem teste de unidade para a base do banco nula (o limite cai para só a margem de 500 ms), e a fase deveria reprovar explicitamente sem ela, e não depender do `count>0` do k6 | `TODO.md`, no item que já existe, "mínimo de turnos da fase `base`" (19.0): a mesma pendência, com critério e teste de unidade próprios |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-10 21:02:36 | 2026-10-10 21:05:51 | `test-engineer` | 1 | REPROVADO | a8cd222e6465a60c6 |
| 2026-10-10 21:06:11 | 2026-10-10 21:06:54 | `tenancy-guardian` | 1 | APROVADO | a177f6e0d5ee4189b |
| 2026-10-10 21:06:09 | 2026-10-10 21:07:07 | `privacy-guardian` | 1 | APROVADO | a93feecf5855a6b88 |
| 2026-10-10 21:06:02 | 2026-10-10 21:08:05 | `revisor-geral` | 1 | REPROVADO | a42865c84d9304986 |
| 2026-10-10 21:06:05 | 2026-10-10 21:08:12 | `infra-guardian` | 1 | REPROVADO | ac2eb0f66feb5ae3a |
| 2026-10-10 22:16:50 | 2026-10-10 22:19:53 | `test-engineer` | 2 | REPROVADO | a3738a02e66082848 |
| 2026-10-10 22:20:22 | 2026-10-10 22:21:11 | `llm-integrator` | 1 | APROVADO | afafb700baaeb1232 |
| 2026-10-10 22:20:31 | 2026-10-10 22:21:24 | `tenancy-guardian` | 2 | APROVADO | aceeca0ccadd17c31 |
| 2026-10-10 22:20:26 | 2026-10-10 22:21:34 | `privacy-guardian` | 2 | APROVADO | a13d006c42a7fd646 |
| 2026-10-10 22:20:07 | 2026-10-10 22:21:47 | `revisor-geral` | 2 | APROVADO | a9c835cd850f40a1c |
| 2026-10-10 22:20:14 | 2026-10-10 22:21:54 | `infra-guardian` | 2 | APROVADO | a8510ea8c2cded06a |
| 2026-10-10 22:31:56 | 2026-10-10 22:32:46 | `test-engineer` | 3 | APROVADO | a443d76b495dd7850 |
| 2026-10-10 22:33:02 | 2026-10-10 22:33:25 | `infra-guardian` | 3 | APROVADO | ac92fd771670ba60f |
| 2026-10-10 22:33:08 | 2026-10-10 22:33:27 | `llm-integrator` | 2 | APROVADO | aaae59382c8245958 |
| 2026-10-10 22:32:57 | 2026-10-10 22:33:34 | `revisor-geral` | 3 | APROVADO | a6d5309886b778bfc |
| 2026-10-10 22:33:16 | 2026-10-10 22:33:39 | `privacy-guardian` | 3 | APROVADO | af276caaf05a107ea |
| 2026-10-10 22:33:20 | 2026-10-10 22:33:40 | `tenancy-guardian` | 3 | APROVADO | a42b4176241c1aac6 |
