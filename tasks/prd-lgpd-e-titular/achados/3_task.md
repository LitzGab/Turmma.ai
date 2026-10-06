# Achados das revisões — `tasks/prd-lgpd-e-titular/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-06 00:44:57 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (da tabela da `3_task.md` e de RF5, Concorrência e Chave de idempotência no `cenarios.md`):
- prazo por categoria: um dia antes fica, um dia depois sai, reexecutar não apaga mais nada
- ajuste da escola: encurtar em A tira só a linha de A; aumentar depois não devolve nada
- janela letiva abre no meio: `false` na categoria interrompida, `true` nas anteriores, e a noite seguinte começa pela pendente
- 5.001 linhas saem em dois lotes; categoria vazia grava linha com zero
- thread do professor: a que tem mensagem no prazo fica, a vazia antiga sai, a recém-aberta fica, e a que ganha mensagem entre a escolha e a trava fica
- chave sem escola é recusada; 23h59 e 0h01 locais dão chaves diferentes
- concorrência [P]: mesma chave dá o mesmo id; dois jobs da mesma escola somam certo; a rotina duas vezes cria um job por escola; colisão com job terminado é "já enfileirado" com id nulo
- alerta [F]: duas noites parciais disparam, parcial seguida de completa não, categoria sem linha conta como não concluída
- medição no fuso da escola, ignorando a noite anterior à primeira execução
- log só com ids e contagens; o job vai para a fila de lote
- permissão: a rotina só como rotina do sistema, o job só no contexto de uma escola
- isolamento: o expurgo de A não apaga linha de B, mesmo com prazo menor em A

**Cobertos:** todos, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/alerta-do-expurgo.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-dado-pessoal.test.ts`, no `config.test.ts`, no `alertas.test.ts`, no `migrar.int.test.ts` e no `arquitetura.test.ts`.
- **Isolamento:** B tem linha com a mesma idade ou mais antiga, e a thread vazia de B fica. Também `categoriaPendente` e `noitesDoAlerta` não leem B.
- **Concorrência de verdade:** a mesma chave usa `GatilhoDeParada` e `esperarNaTrava`. As duas rotinas e os dois jobs da mesma escola rodam juntos com `Promise.all`.
- **Corrida da thread:** reproduzida entre a trava e a reconferência.
- **Corte:** é contado do `agora` do começo do job, com relógio que anda.
- **Recomendações da rodada 6 da spec** (pendente primeiro, linha com zero, categoria sem linha no alerta, colisão nula): todas viraram teste.
- **Mutações:** conferi as da seção contra o diff e cada teste citado falharia sem a cláusula. Não há `.skip`. Não há IA no caminho. Os substitutos que aparecem (lista de escolas, `apagarLote` envolvido para mover o relógio ou contar lotes) chamam o repositório real e não escondem a regra.
- **Retenção de 5 anos do `expurgo_execucao`:** fica com a 5.0, que já tem o cenário (`5_task.md:46`).

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Cláusulas novas sem linha na seção "Mutações".** Cada uma pede declaração de equivalente ou um teste:
   - `for update skip locked` e `order by <data>` em `APAGAR_LOTE` (`packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:48-77`). Sem o `skip locked`, o teste [P] dos dois jobs continua verde, porque a soma usa o `rowCount`. Sem o `order by`, nada prova que o mais antigo sai primeiro quando a janela interrompe.
   - O `escola_id` externo do `delete`, que é defesa em profundidade e equivalente na prática.
   - `if (meses === undefined) throw` (`expurgar-escola.ts:50`).
   - `await rotinas?.encerrar()` (`montagem.ts`).
2. **Checagem das chaves do log depende da ordem dos testes.** O teste do log (`expurgo-da-escola.int.test.ts:618-621`) usa o `LogEmMemoria` compartilhado. Rodado sozinho, só confere `retencao.rotina_disparada`. E `retencao.escola_nao_enfileirada` é emitido num teste posterior (linha 650), então as chaves dele nunca passam pela checagem. Vale mover a checagem para um `afterAll` ou repeti-la em cada teste que loga.
3. **Falta o caso do job que morre no meio da categoria** (`apagarLote` lança erro). Esse teste provaria que nenhuma linha `true` é gravada e que a noite seguinte cobre o resto. A causa 3 do runbook depende disso.
4. **Para o `infra-guardian`, sobre o horário do alerta:** a noite é o dia local de `em`, contado de ontem para trás.
   - Numa escola de São Paulo, o job da 1h só conta no dia seguinte. O alerta dispara cerca de 17 h depois de a segunda noite parcial ser conhecida e não volta ao normal no dia em que uma noite completa roda.
   - Numa escola do Acre, onde o job começa às 23h locais, nenhum teste cobre uma execução que atravessa a meia-noite local.
5. **O teste [P] dos dois jobs da mesma escola** (`:506`) depende de o `Promise.all` intercalar as chamadas. Com o gatilho de parada, a sobreposição ficaria garantida, como já é no teste da mesma chave.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-06 00:46:13 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:**
- `expurgo_execucao`, nova. Tem `escola_id` NOT NULL com FK para `escola`, id em UUID (`uuidv7()`) e índice `(escola_id, em)`. Não precisa de `anoLetivoId`: registra uma execução no tempo e não varia por período letivo.
- `job_registro.chave_idempotencia`. O único parcial começa por `escola_id`, e o check `job_registro_chave_so_com_escola` recusa a chave em job sem escola.
- Os índices novos de `mensagem_tutor`, `sinal_tutor` e `mensagem_agente` começam pela escola: `(escola_id, criada_em)` nas mensagens e `(escola_id, criado_em)` no sinal.

**Queries verificadas:**
- `ExpurgoDaEscolaRepository` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts`): `apagarLote` nas três tabelas e na `thread_agente`, `registrar`, `categoriaPendente` e `noitesDoAlerta`. Todas tiram a escola de `exigirEscolaDoContexto()`, nenhum método recebe escola por argumento e nenhum é `@SemEscopo`.
- `JobRegistroRepository.inserirUmaVez`: a escola vem do contexto, e a leitura da colisão filtra por escola, tipo, chave e estado.
- `EscolasDaRotinaRepository.listarIds` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/rotina/escolas-da-rotina.repository.ts:18`): `@SemEscopo` com justificativa escrita, devolve só os ids e é o único no módulo `rotina`. O teste de arquitetura confere que só o worker-lote o usa.
- O job `retencao.expurgar-escola` tem `dados: {}`. O executor monta o contexto com o `escola_id` do `job_registro` e não lê escola do payload.
- Não há endpoint novo na API, então nenhum caminho aceita `escolaId` do cliente.
- A camada rede não foi tocada.

**Teste de isolamento:** presente e efetivo. Removi mentalmente cada cláusula de escopo:
- A escola na subconsulta do lote: o "lote por tabela" quebra, porque B tem linhas mais antigas e seriam escolhidas no lugar das de A.
- `t.escola_id` na thread vazia: quebram o "thread do professor" (a thread vazia antiga de B) e o lote `thread_agente`.
- O `where escola_id` em `categoriaPendente` e na primeira execução de `noitesDoAlerta`: quebra o "isolamento" (B parou numa categoria, A nunca rodou).
- `x.escola_id` na contagem das noites: quebra o teste em que a terça completa de B não completa a de outra escola.
- `escola_id` no único parcial e na leitura da colisão: quebra o teste do job pendente em B com a mesma chave.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A justificativa do `@SemEscopo` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/rotina/escolas-da-rotina.repository.ts:18` fala só da "rotina noturna", mas a `MedicaoDoExpurgo` também chama `listarIds`. O `docs/modelo-de-dados.md` e o teste de arquitetura já dizem isso; vale citar a medição também no texto da justificativa.
2. Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` há duas cláusulas de escola redundantes que nenhum teste derruba, porque a outra cláusula de escola já filtra: `escola_id` no `delete` de fora do `APAGAR_LOTE` (linhas 53, 63 e 73) e `m.escola_id = t.escola_id` no `not exists` (linha 86). São defesa em profundidade e não abrem vazamento. Para a tabela "Mutações" ficar completa, falta uma linha que as declare como equivalentes.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-06 00:46:41 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. A tarefa apaga dado pessoal que já existe, sem criar nenhum: `mensagem_tutor` (texto do aluno), `sinal_tutor`, e `mensagem_agente`/`thread_agente` (conversa do professor). Também cria duas coisas sem pessoa:
- a tabela `expurgo_execucao`, com escola, categoria, contagem, `concluida` e `em`;
- a coluna `job_registro.chave_idempotencia`, que guarda a data local da noite.

**Fora da tabela de dados do docs/lgpd.md:** nada. A tabela de dados recebeu nesta tarefa o prazo ajustável e "apagada pelo expurgo noturno" nas linhas de conversa do Tutor, sinais e conversa do professor. O parágrafo de retenção cita `expurgo_execucao` "só com a categoria e quantas linhas". `classificacao.ts:86` a classifica como prazo fixo sem pessoa e fora do arquivo do titular, e o teste de arquitetura confere essa classificação contra a migration.

**Autorização por objeto:** ok. A tarefa não cria rota.
- `ExpurgoDaEscolaRepository` tira a escola de `exigirEscolaDoContexto()` em todo método. Ela entra duas vezes em cada lote: na subconsulta e no `delete` (`expurgo-da-escola.repository.ts:51-80`), e também na thread vazia (`:84-87`, `:133-136`).
- A única consulta sem escopo é `EscolasDaRotinaRepository.listarIds`. Ela tem `@SemEscopo` com justificativa e devolve só os ids.
- `arquitetura.test.ts` garante que só o worker-lote a importa, de modo que nenhuma rota da API alcança essa consulta.

**Logs:** limpos.
- `retencao.expurgo_interrompido`, `retencao.expurgada` e `retencao.rotina_disparada` levam só contagens e a categoria do catálogo (sob `tipo`).
- `retencao.escola_nao_enfileirada` leva `escolaId` e o `resumirErro`, que só traz sqlstate, constraint ou o nome do erro com a pilha filtrada.
- O teste de integração limita as chaves permitidas no log (`expurgo-da-escola.int.test.ts:75`).
- A consulta do runbook lê só `categoria, linhas, concluida, em`.

**Auditoria:** presente onde a regra exige. A tarefa não tem leitura de aluno por coordenação ou rede, exportação, nota, permissão nem aprovação de IA. A apagação por prazo fica registrada por categoria em `expurgo_execucao`, mesmo com zero linhas. A trilha do que foi enviado à IA continua de pé: nenhuma FK liga `execucao_agente` ou `consumo_ia` às mensagens apagadas, então o expurgo não leva junto esse registro.

**Envio externo:** nenhum. O job leva `dados: {}`. A métrica `expurgo_noites_incompletas` tem só o rótulo `escola_id`, que identifica a escola e não uma pessoa.

**Seed/fixture:** sintético ("Aluno sintético do expurgo", "Professora sintética", "2ºB sintética", "Resposta sintética…").

**Pergunta de fechamento:** para o escopo desta tarefa, o código responde. O que sai, sai de fato do banco, pelo prazo de cada linha. O registro de envio à IA (`ExecucaoAgente`) não depende das mensagens apagadas. O arquivo do titular completo é da tarefa 13.0.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `expurgo_execucao` não guarda o prazo em meses que foi aplicado. Com o ajuste por escola pelo `ops:retencao`, gravar `meses` na linha deixaria a escola responder "por que isto saiu nesta data" sem cruzar com a auditoria do ajuste. Pode entrar na 5.0 ou na 13.0.
2. Até a tarefa 5.0, `expurgo_execucao` cresce sem expurgo próprio. Não há pessoa nela, então não bloqueia, mas vale deixar o "5 anos (tarefa 5.0)" como item de checagem no `/validar` do F3.
3. A sentinela do arquivo do titular (13.0) deveria confirmar que `expurgo_execucao` continua sem coluna que se ligue a uma pessoa: se alguém um dia acrescentar `aluno_id` "para depurar", o teste fica vermelho.

Arquivos auditados, entre outros:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/rotina/escolas-da-rotina.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-dado-pessoal.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/medicao-do-expurgo.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0025_expurgo_execucao.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/privacidade/classificacao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`

## infra-guardian · 1ª rodada · APROVADO · 2026-10-06 00:47:23 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila | migration
Rate limit: ok (não há endpoint nem login novo, então não se aplica)
Fila e prioridade: ok. A rotina das 1h grava um `retencao.expurgar-escola` por escola na fila `lote`, como não urgente, e o job passa pela vaga de lote da escola. O despachante segura esse job enquanto a escola está no horário de aula. O próprio job confere a janela antes de cada lote e para quando ela abre, gravando `concluida=false`.
Concorrência: protegida. A chave por escola, tipo e chave fica num índice único parcial, e a gravação usa `on conflict do nothing` com o mesmo predicado. O check `chave_so_com_escola` impede a chave sem escola. Os lotes usam `for update skip locked`. A thread vazia é travada e depois conferida de novo. Os testes [P] cobrem a mesma chave ao mesmo tempo, duas rotinas ao mesmo tempo e dois jobs da mesma escola.
Índice e paginação: ok. Os índices `(escola_id, criada_em/criado_em)` de `mensagem_tutor`, `sinal_tutor` e `mensagem_agente` e o `(escola_id, em)` de `expurgo_execucao` começam pela escola. O lote tem `limit 5000`, e um teste lê o `EXPLAIN` de cada lote. A busca de `thread_agente` usa o índice único que começa por `escola_id`, numa tabela pequena (uma linha por pessoa, agente e ano).
Degradação de IA: não se aplica
Migration: compatível. A 0025 só acrescenta: tabela nova, coluna que aceita nulo, um único parcial que ignora a chave nula e índices. O código anterior grava `chave_idempotencia` nulo e passa no check. Os índices sem `concurrently` estão declarados na Tech Spec, seção 7c, até existir o staging, e o banco hoje só tem dado sintético. O deploy roda fora do horário de aula.
Métrica e alerta: ok. A métrica nova é `expurgo.noites_incompletas{escola_id}` e entrou em `METRICAS_COM_ESCOLA`. O alerta `infra/grafana/alertas/expurgo-noites-incompletas.yaml` tem a seção correspondente em `docs/runbook.md`, e a guarda `alerta-tem-runbook` foi atualizada. Duração e falha do job novo ficam com as métricas de job que já existem.
Bloqueantes: nenhum
Recomendações:
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0025_expurgo_execucao.sql`, linha final: `ADD CONSTRAINT job_registro_chave_so_com_escola CHECK` percorre `job_registro` inteira travando a tabela (ACCESS EXCLUSIVE). A tabela é a fila quente e guarda 7 dias de jobs. O comentário da migration diz que o check passa sem reescrever a tabela; é verdade, mas ele ainda lê tudo com a trava. A Tech Spec já manda usar `NOT VALID` com `VALIDATE` em arquivo próprio, e índice com `concurrently` fora de transação, a partir do staging. Não achei essa pendência no `TODO.md`. Ela deveria entrar lá, junto do índice de `mensagem_tutor`, que é a tabela que mais cresce (~7 mi de linhas por ano).
2. O alerta chega tarde, como o test-engineer apontou. A noite só conta "de ontem para trás", então o alerta dispara à meia-noite local, cerca de 17 h depois de a segunda noite parcial ficar conhecida, e continua ligado um dia inteiro depois de uma noite completa. Uma saída é contar a noite de hoje quando o job dela terminou ou quando a janela abriu.
3. `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` (`noitesDoAlerta`): o disparo das 1h de São Paulo cai às 23h numa escola de Rio Branco. Se o job dela passa da meia-noite local, as linhas de uma mesma noite ficam em dois dias, e duas noites assim dão falso positivo. Não afeta Joinville. Vale anotar antes de vender para escola em outro fuso.
4. `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/medicao-do-expurgo.ts`: a medição faz, a cada 5 min, uma leitura de configuração e duas consultas por escola, uma escola de cada vez. Com dez escolas o custo é desprezível. Com centenas, compensa uma consulta agrupada por escola.
5. A thread vazia vencida apagada no instante em que o professor manda a primeira mensagem faz o envio falhar pela FK, e o professor precisa reenviar. Isso só acontece com thread sem uso há mais de 12 meses, mas convém conferir se ele vê um erro tipado e possível de reenviar, e não um 500.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-06 00:48:02 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As seis divergências estão escritas na `techspec.md` §3, §5, §6 e §7c. As duas que mudam comportamento (a thread vazia e a medição do alerta) também estão no `cenarios.md`, RF5.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, infra)")

Bloqueantes:

1. **O alerta não dispara para a escola cujo expurgo falha desde a primeira noite.**
   - Onde: `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:176`, junto com `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts:68`.
   - O que está errado:
     - A medição só cria série para a escola que já tem alguma linha em `expurgo_execucao` (`if (primeira === undefined) return undefined`).
     - O job da escola só grava linha quando a categoria termina ou quando a janela letiva abre. Se `apagarLote` lança erro (o `statement_timeout` de 2 s, um erro de SQL, um defeito do próprio deploy), a exceção sobe sem gravar nada. É a causa 3 do runbook: "a categoria fica sem linha".
     - Resultado: se o job falha no primeiro lote desde a primeira noite, a escola nunca ganha linha, nunca ganha série, e o alerta nunca dispara. É o defeito mais provável logo depois do deploy do F3: um defeito que derruba o primeiro lote de todas as escolas silencia o alerta em todas elas.
     - Não existe outro alerta de job de lote que falhou (`infra/grafana/alertas/` só tem o `job-interativo-esperando`). Conversa do Tutor, sinais e conversa do professor ficariam além do prazo da `docs/lgpd.md` sem ninguém saber.
     - Isso contraria o objetivo da tarefa: "alerta quando a escola passa duas noites sem concluir".
   - Correção exigida:
     - O marco da "primeira execução" tem de existir mesmo quando o job falha. Por exemplo: no `criarExpurgoDaEscola`, envolver o laço da categoria para gravar `registrar(categoria, linhasDaCategoriaTotal, false, relogio.agora())` antes de relançar o erro. Outro marco que o job falho também deixe serve igual.
     - Acrescentar o teste de integração: escola cujo job falha no primeiro lote em duas noites seguidas, a partir da primeira, chega a série 2.
     - Ajustar a causa 3 do runbook e a §7c da Tech Spec ao novo comportamento.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/telemetria/metricas.ts:122`: a chave `noitesSemExpurgo` e o nome `expurgo.noites_incompletas` dizem coisas diferentes. Use `noitesIncompletasDoExpurgo`, ou outro nome que acompanhe a métrica.
- A noite é contada pelo `em` de cada categoria, e não pelo começo do job. Numa escola com fuso a oeste de São Paulo (Acre: 1h em SP é 23h lá), uma execução que passa da meia-noite divide as categorias entre dois dias locais. Não gera falso alerta sistemático, mas deixe isso escrito na §7c, ou conte a noite pela chave do job (a data local do disparo).
- A seleção da `thread_agente` vazia filtra por `(escola_id, criada_em)` sem índice próprio. Hoje o volume é pequeno, mas registre a decisão para quando a tabela crescer.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-06 01:34:10 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: REPROVADO

**Cenários exigidos**
- Correção do revisor-geral: a escola cujo job falha no primeiro lote, em duas noites seguidas desde a primeira, tem a linha gravada e chega à série 2 no alerta.
- O lote que falha grava `concluida = false` e o erro continua subindo.
- Recomendação 1 da minha rodada: `skip locked` e `order by` nas três tabelas.
- Recomendação 2 da minha rodada: todo evento `retencao.*` só leva chaves permitidas.
- A chave renomeada para `noitesIncompletasDoExpurgo`, e a métrica do expurgo na lista fechada de métricas com `escola_id`.

**Cobertos**
- O `registrar(..., false, ...)` do `catch` tem teste. Se ele sair, ficam vermelhos `apps/worker/test/expurgo-da-escola.int.test.ts:423-426` (a linha de `sinal_tutor` some) e `:450` (a lista fica vazia).
- O erro original sobe: `:422`, `:428` e `:449`.
- `skip locked` nas três tabelas (`:715-741`). A linha travada é a mais antiga, então sem `skip locked` o lote ficaria esperando por ela. A mutação vermelha bate.
- `order by` trocado por `order by id desc` também fica vermelho, porque a travada tem o maior id e a recente é levada.
- Log: o conjunto exato de eventos mais as chaves de cada linha (`:991-997`).
- A métrica renomeada e a lista fechada de `infra/test/metricas.int.test.ts`.
- Docblock, runbook (causa 3), §7c da Tech Spec, RF5 do `cenarios.md` e "Mutações" estão coerentes com o código. As linhas de equivalente e de inalcançável são aceitáveis.
- Nenhum `.skip`. Nenhum provedor de IA envolvido.

**Bloqueantes**
1. `apps/worker/test/expurgo-da-escola.int.test.ts:413-441` e `:443-451`: o cenário exato da correção exigida (falha no primeiro lote, duas noites desde a primeira, série 2) não tem teste.
   - O teste de `:413` falha em `sinal_tutor`, a segunda categoria. Antes disso, `conversa_tutor` já gravou uma linha `true` na primeira noite.
   - Por isso a série dessa escola existe mesmo sem a correção. Sem o `registrar` do `catch` a conta dá 2 do mesmo jeito: segunda incompleta, e na terça `conversa_tutor` grava `true` e `sinal_tutor` não grava nada.
   - Ou seja, a asserção `[2]` de `:440` passa sem a regra. O teste só fica vermelho pela `:423`.
   - O teste de `:443` é o caso do primeiro lote, mas para na linha gravada e não mede a série.
   - Consequência: uma regressão que reabre o bug passa no arquivo inteiro. Exemplo: `noitesDoAlerta` (`packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:170-176`) passar a achar a "primeira" execução só entre linhas `concluida`, ou a medição criar série só para a escola com linha concluída. As outras escolas com série no arquivo também têm uma linha `true` na primeira noite (o E de `:850`, com `parcial`).
   - Correção exigida: no teste de `:443`, ou num teste novo, rodar o `falhaSempre` em duas noites seguidas a partir da primeira execução da escola (segunda e terça). Conferir as duas linhas `conversa_tutor`, `0`, `false`, e medir na quarta com `MedicaoDoExpurgo`, esperando `[2]`. Assim a asserção da série fica vermelha sem o `catch`.
   - Corrigir também o título de `:413`: "desde a primeira" não descreve uma escola que concluiu uma categoria na primeira noite.

**Recomendações**
1. `apps/worker/test/expurgo-da-escola.int.test.ts:722-725`: o comentário diz que "a mais antiga não é a de menor id nem a de maior". Não é verdade.
   - Os ids são v7, em ordem de criação, e a antiga é gravada primeiro: tem o menor id e fica primeiro no heap.
   - Conferi no banco de teste, numa transação com rollback. O heap ficou na ordem antiga, recente, travada (`(0,2)`, `(0,4)`, `(0,5)`). Sem `order by`, o plano é Seq Scan em `sinal_tutor` e `mensagem_agente`, e Index Scan pelo índice de data em `mensagem_tutor`.
   - Então tirar o `order by`, ou trocá-lo por `order by id`, deixa o teste verde nas três tabelas. Só a troca por `id desc` é pega.
   - O que fazer: gravar a recente antes da antiga, para que a ordem de inserção e a de id não coincidam com a idade, e acertar o comentário. Pode ir para "Recomendações sem aplicar", com destino.
2. Depois do bloqueante, a linha do `catch` em "Mutações" deve citar o teste da série desde a primeira noite, e não só o de `:413`.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/medicao-do-expurgo.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/3_task.md`

## test-engineer · 3ª rodada · APROVADO · 2026-10-06 02:15:50 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO

Cenários exigidos: o caminho feliz (o vencido sai, o que está no prazo fica, cada categoria grava a sua linha); o ajuste da escola encurtando e depois aumentando o prazo; a thread vazia contra a thread com mensagem, incluindo a corrida entre a escolha e a trava; a janela letiva abrindo no meio e a retomada pela categoria pendente; o lote que falha numa categoria do meio; a escola que falha desde a primeira noite e a série do alerta; o corte contado de um `agora` só; o fuso da escola; os lotes de 5.000 e o índice; a concorrência (dois jobs em paralelo, a mesma chave em paralelo, duas rotinas em paralelo); a permissão (rotina do sistema contra o contexto de escola); o isolamento (a pendente e as noites de uma escola contra as de outra, e B com linhas mais antigas que A); o log só com ids e contagens; a trilha completa pelo despachante.

Cobertos: todos os acima. A correção que pedi na 2ª rodada foi feita.
- **Correção 1, feita.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:443`. Ele roda o `falhaSempre` na segunda e na terça, que são as duas primeiras noites da escola. Confere as duas linhas `conversa_tutor`, com 0 e `false`. Mede na quarta com `MedicaoDoExpurgo` e espera `[2]`.
  - Sem o `registrar` do `catch`, a escola fica sem linha nenhuma em `expurgo_execucao`. Aí `noitesDoAlerta` cai em `primeira === undefined`, a série fica vazia e o teste fica vermelho. Isso bate com a mutação que você relatou.
  - O título de `:413` já descreve o que o teste faz.
- **Recomendação 1, feita.** As três tabelas usam `uuidv7()` (`mensagem-tutor.ts:45`, `sinal-tutor.ts:35`, `mensagem-agente.ts:30`), então a ordem por id é a ordem de gravação. As sementes saem nesta ordem: recente, antiga, outra recente, travada.
  - Entre as não travadas, a antiga fica no meio por id e no heap, como diz o comentário.
  - `order by id` levaria a recente. `order by id desc` pula a travada e levaria a outra recente. As duas trocas dão vermelho, e as quatro asserções de existência pegam qualquer escolha errada.
- **Recomendação 2, feita.** A linha do `catch` em "Mutações" cita o teste da série.
- **A equivalência do `order by` em `mensagem_tutor` é aceitável.** Sem o `order by`, o plano desce pelo índice `(escola_id, criada_em)`, e o próprio índice ordena pela data. Nenhum teste de dado distingue isso com o plano atual. A troca por `order by id` continua vermelha também em `mensagem_tutor`, e a exceção está registrada com o motivo.

Bloqueantes: nenhum.

Recomendações:
- Os testes de `:413` e `:443` repetem igualzinho a montagem de `MedicaoDoExpurgo`, e o `describe` de medição já tem a mesma montagem em `medicaoDe`. Vale levar esse auxiliar para o escopo de fora e reaproveitar nos dois.
- O item novo do `TODO.md` sobre a thread apagada no instante do envio pede para conferir o erro tipado e o reenvio. Quando isso virar tarefa, entra como caso de concorrência de verdade, com o envio e o expurgo em paralelo, e não como dois passos em sequência.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-06 02:16:38 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. `expurgo_execucao` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/expurgo-execucao.ts`, migration `0025`) não mudou desde a minha 1ª rodada, que a aprovou com `escola_id`, id UUID e índice que começa pela escola.

Queries verificadas:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts:76-82`: o `catch` novo chama `repositorio.registrar(...)`. Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:142-143`, esse método tira a escola de `exigirEscolaDoContexto()`, não de argumento, então a linha `false` cai na escola do job. O `.catch(() => undefined)` só engole a falha da gravação e devolve o erro original. Não abre caminho sem escopo.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/rotina/escolas-da-rotina.repository.ts:18-23`: `@SemEscopo` em `listarIds`. Agora a justificativa cobre os dois usos, a rotina noturna e a medição do alerta, e deixa claro que o método devolve só ids e não atende requisição de escola. A minha recomendação 1 foi atendida.
- A chave `METRICAS.noitesSemExpurgo` virou `noitesIncompletasDoExpurgo`. O nome da métrica e o rótulo continuam os mesmos, e todas as referências foram atualizadas (`metricas.ts`, `medicao-do-expurgo.ts`, `tools/testes/metricas.ts`, `infra/test/metricas.int.test.ts`). Nada disso afeta o isolamento.
- Nenhum endpoint novo. Nenhum `escolaId` vem do cliente.

Teste de isolamento: presente e efetivo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:762-781` é novo. Para cada tabela, inclusive `thread_agente`, ele semeia linhas mais antigas na escola B e confere que o lote de A não as escolhe (`quantas(alvo, b.escolaId)` continua 3). Se a cláusula `escola_id` sair do `select` interno, o `order by` pela data pega primeiro as linhas de B e o teste quebra.
- Os testes da mesma suíça que já existiam continuam valendo: o bloco "isolamento" (`:798-826`) e a thread antiga de outra escola (`:325`).
- Os dois testes novos de falha no lote (`:413`, `:443`) gravam e leem as linhas de execução só no contexto da escola semeada.

Bloqueantes: nenhum.

Recomendações:
- A minha recomendação 2 da rodada anterior (as cláusulas `escola_id` repetidas no `delete` externo e no `select` interno de `APAGAR_LOTE`) ficou registrada em "Mutações" como equivalente. Aceito que essa mutação não seja coberta, desde que as duas cláusulas continuem no código: a do `delete` externo é a segunda camada de defesa e não deve sair numa limpeza futura.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-06 02:16:50 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO

Esta rodada auditou só o que mudou desde a 1ª rodada (a aprovada). A 1ª rodada não exigiu correções de mim, então não há correção minha a conferir. Não rodei testes, como pedido.

Campos pessoais tocados: nenhum novo nesta rodada. O diff mexe no tratamento de erro do processador, na justificativa do `@SemEscopo`, no nome de uma chave de métrica, em testes e em documentação. O mapa de dados de `docs/lgpd.md` continua como na 1ª rodada.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Nenhuma rota nova. A única consulta sem escopo, `EscolasDaRotinaRepository.listarIds` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/rotina/escolas-da-rotina.repository.ts:18-26`), devolve só ids de escola. A justificativa agora cita a medição do alerta, que é o segundo uso real. Não há dado de pessoa.

Logs: limpos.
- O `catch` novo em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts:76-82` não loga nada. Se o `registrar` falhar, a falha é engolida e sobe o erro original.
- Esse erro chega ao executor, que o loga só por `resumirErro` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/erro/resumir-erro.ts:49`): SQLSTATE e restrição, sem `message` nem `detail` do Postgres. Por isso o runbook está certo ao dizer que o log traz "SQLSTATE e restrição".
- O `Error` da linha 58 cita só o nome da categoria, que vem do catálogo.
- O teste novo "log › toda linha `retencao.*`…" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:1010-1017`) é efetivo. Ele confere os quatro eventos, limita as chaves a ids e contagens (`CHAVES_DO_LOG`, linhas 76-92) e garante que o texto sintético de pessoa ("sintétic", "Pergunta", "Resposta") não aparece em nenhuma linha.

Auditoria: presente onde se aplica. O expurgo por retenção é rotina do sistema e não é ação da lista de auditoria obrigatória da regra 20, item 10. O rastro é `expurgo_execucao`, só com categoria, contagem e `concluida`, e agora a linha `false` também é gravada quando um lote falha.

Envio externo: nenhum. A métrica `expurgo.noites_incompletas` leva só `escola_id` e está na lista fechada `METRICAS_COM_ESCOLA` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/telemetria/metricas.ts`). Só mudou o nome da chave TypeScript; o nome da métrica e o rótulo não mudaram.

Seed/fixture: sintético. São escolas criadas pelo teste, com nomes como "Aluno sintético do expurgo" e "Professora sintética".

Bloqueantes: nenhum.

Recomendações:
- No novo `catch` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts:80`), a falha ao gravar a linha `false` some sem rastro. Um `logger.warn({ evento: 'retencao.registro_nao_gravado', tipo, erro: resumirErro(e) })` ajudaria a diagnosticar a causa 2 do runbook, em que não aparece nenhuma linha nas duas noites. O evento só leva ids e o erro resumido, e precisaria entrar no conjunto de eventos que o teste de log aceita.
- As três recomendações da 1ª rodada continuam em "Recomendações sem aplicar" do `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/3_task.md`, com destino nas tarefas 13.0 e 5.0. Nada no diff muda isso.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-06 02:16:55 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, infra)")
Bloqueantes: nenhum. A correção exigida na 1ª rodada foi feita por inteiro:
- **Código:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts`, o laço dos alvos de cada categoria está dentro de um `try`. O `catch` grava `registrar(categoria, linhasDaCategoriaTotal, false, …)` antes de relançar o erro. Na primeira noite da escola, a linha `false` passa a marcar a primeira execução. Assim `noitesDoAlerta` deixa de devolver `undefined` e a noite conta.
- **Teste:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:443`, o `apagarLote` sempre lança, na segunda e na terça. O teste confere as duas linhas `conversa_tutor`/0/`false` e a medição de quarta em `[2]`. A tabela de mutações aponta esse teste como o que fica vermelho quando o `registrar` do `catch` é removido.
- **Docs:** a causa 3 do runbook, a §7c da `techspec.md`, o RF5 do `cenarios.md` e a divergência nova no `3_task.md` estão alinhados ao novo comportamento.
- **Recomendações da 1ª rodada:** o nome antigo da métrica não aparece mais em `apps`, `packages`, `infra`, `tools` nem `docs`. As pendências da noite que atravessa a meia-noite e do índice da thread vazia estão no `TODO.md` e na §7c. A justificativa do `@SemEscopo` de `listarIds` cita a medição.

Recomendações:
- `expurgar-escola.ts`, no `catch`: o `.catch(() => undefined)` descarta em silêncio a falha ao gravar a linha `false`. Um `logger.warn` só com o evento, sem a categoria nem o erro cru, ajudaria a pessoa de plantão a entender por que, no caso 2 do runbook, aparece "nenhuma linha" com o job `falhou`. Isso cabe numa frase da causa 2 do runbook.
- Na causa 3 do runbook e na célula "Métrica e alerta" da §7c, as quebras de linha ficaram fora do padrão do arquivo: uma linha longa no runbook e quebras no meio da célula da tabela na Tech Spec. É só aparência.
- O `catch` engloba também o `registrar(..., false)` do caminho da janela letiva. Se essa gravação falhar, a mesma linha é tentada de novo. Não causa dano porque a primeira tentativa não gravou, mas um comentário de uma linha evitaria que alguém leia ali uma gravação dupla.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-06 02:17:05 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila | migration
Rate limit: ok (não se aplica, é um job noturno de lote sem request)
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível (a 0025 não mudou desde a 1ª rodada)
Métrica e alerta: ok
Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts:80`: a linha `false` gravada pela falha entra em `categoriaPendente` do mesmo jeito que a da janela. A noite seguinte, e cada nova tentativa da fila na mesma noite, começa pela categoria que falhou (`ordemDaNoite`). Se o erro se repete nela, as outras categorias deixam de rodar. Antes desta correção isso acontecia só quando a categoria que falhava era a primeira do catálogo. Exemplo: se `sinal_tutor` passa sempre do `statement_timeout`, o expurgo de `conversa_tutor` também para, e a conversa do aluno fica no banco além do prazo, não só o sinal. O teste em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:427-429` confirma isso: na terça só aparece `sinal_tutor`. O alerta de duas noites dispara nos dois desenhos, e o runbook (causa 3) cobre o caso, por isso não bloqueia. Duas saídas possíveis:
   - Separar a linha de falha da linha de interrupção pela janela, por exemplo com um motivo ou uma coluna a mais. Só a interrupção define a categoria pendente.
   - Ou, depois da falha, seguir para as categorias seguintes antes de subir o erro.

   Registrar no `TODO.md`, junto das recomendações de infra da 1ª rodada.
2. `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts:80`: o `.catch(() => undefined)` descarta em silêncio a falha ao gravar a linha. Um `logger.warn` com o evento e o erro resumido, sem ids de pessoa, ajudaria a explicar no runbook por que uma noite ficou sem série.

Conferido no diff:
- Quando um lote falha, a categoria grava `false` antes de o erro subir.
- Uma nova tentativa que termina na mesma noite grava `true`, e `noitesDoAlerta` conta só `concluida`, então ela não gera falso positivo.
- O renome de `METRICAS.noitesSemExpurgo` para `noitesIncompletasDoExpurgo` está consistente: o nome exportado `expurgo.noites_incompletas` não mudou, e alerta, painel e `infra/test/metricas.int.test.ts` batem com ele.
- Existe teste da falha na primeira noite, com a série chegando a 2.
- Existe teste do `skip locked` com `order by`.

## test-engineer · 4ª rodada · APROVADO · 2026-10-06 02:57:50 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos (só no diff desde a 3ª rodada):**
- O lote falha e a gravação da linha `false` também falha. Nesse caso precisa sobrar o aviso `retencao.registro_nao_gravado`, só com a categoria em `tipo` e o erro resumido, e precisa subir o erro do lote, não o da gravação.
- O aviso novo tem que passar pela lista de chaves permitidas no log.
- A linha "Mutações" tem que cobrir a cláusula nova.

**Cobertos:**
- O teste novo está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:470`. Ele mostra que a cláusula está mesmo testada:
  - **Sem o `.catch`**, sobe "banco fora" e o `toThrow('erro do lote')` fica vermelho.
  - **Sem o `logger.warn`**, o `toEqual` de um aviso só fica vermelho, e a lista de eventos do teste de log (linha 1027 em diante) também.
  - **Se o aviso fosse emitido duas vezes**, o `toEqual` com um elemento pega.
  - **Se alguma linha fosse gravada**, o `execucoes(...) toEqual([])` pega.
- O aviso passa pelo teste de log com as chaves `evento`, `tipo`, `erro` e `escolaId`, todas já em `CHAVES_DO_LOG`.
- O `resumirErro` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/erro/resumir-erro.ts:49`) nunca leva a mensagem do erro. Leva só tipo, sqlstate, constraint e as linhas da pilha. Então nada de pessoa entra no aviso.
- A linha 138 de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/3_task.md` registra a mutação nova e aponta os dois testes certos.
- Os testes da 3ª rodada que gravam a linha `false` no `catch` (linhas 420 e 443) não mudaram e continuam valendo.
- Não há `.skip`. O falso substitui só o repositório, que está fora da regra testada. Nenhum provedor de IA entra no caminho.

**Bloqueantes:** nenhum.

**Recomendações:**
- O comentário novo de `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts:78-81` diz que, se a gravação da janela letiva falhar, o `catch` tenta a mesma linha de novo uma vez só. Nenhum teste prova isso. O que faltaria: na primeira chamada o `registrar` rejeita, com a janela aberta; na segunda grava. Aí se confere que fica uma linha `false`, que sobe o erro da primeira gravação e que não há aviso. Isso é cobertura extra de um caminho raro, não bloqueia.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-06 02:58:23 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, infra)")
Bloqueantes: nenhum

Na rodada anterior não houve correção exigida. O diff desta rodada fecha as recomendações sem abrir furo novo.

- No `catch` de `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts:77-86`, quando a linha `false` não grava, fica o aviso `retencao.registro_nao_gravado`. O log leva só `tipo` (a categoria) e `erro: resumirErro(...)`, que guarda o tipo do erro, o SQLSTATE, a restrição e a pilha filtrada, sem a mensagem. O erro que sobe é o do lote, e o `throw erro` não fica escondido pelo erro da gravação. O `return` da janela letiva sai de dentro do `try` sem passar pelo `catch`. O comentário diz que a gravação da janela pode ser tentada uma segunda vez, e o código faz isso.
- O teste novo de `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:470-482` falha se o `.catch` sumir, porque o erro que sobe passa a ser outro, e também se o aviso sumir. Ele confere que nenhuma linha foi gravada. O teste de log (linha 1032) aceita o evento novo e confere as chaves dele contra `CHAVES_DO_LOG`.
- O runbook (causa 3), a célula da §7c da `techspec.md` (agora numa linha só), o item novo do `TODO.md`, e as seções "Mutações" e "Recomendações sem aplicar" do `3_task.md` batem com o código.

Recomendações:
- `expurgar-escola.ts:88`: se o `registrar(..., true, ...)` falhar, por estar fora do `try`, a categoria fica sem linha nenhuma. Pela causa 2 do runbook, isso aparece como "o job não rodou", quando o job rodou e só a gravação falhou. Isso não entrou nesta rodada e não bloqueia. Se a 4.0 mexer no arquivo, vale avaliar trazer essa gravação para dentro do `try`, ou registrar a situação no runbook.
- `expurgar-escola.ts:68` e `:83`: o `const tipo = categoria` repetido serve só para o log levar a chave `tipo`. Um auxiliar `logDaCategoria(evento, categoria, extras)` tiraria a duplicação. É questão de forma.

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-06 02:58:31 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo nesta rodada. O diff só muda o log do `catch` do expurgo da escola, um teste e documentação.

Fora da tabela de dados do docs/lgpd.md: nenhum.

Autorização por objeto: ok. Nenhuma rota nova nem alterada. O job continua com o escopo da escola vindo do contexto, como na rodada anterior.

Logs: limpos.
- Na linha 84 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts`, o evento `retencao.registro_nao_gravado` registra só duas coisas: `tipo`, que é o nome da categoria vindo do catálogo, e `resumirErro(falhaDoRegistro)`.
- `resumirErro`, em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/erro/resumir-erro.ts:49`, nunca leva a mensagem nem o `detail`. Para erro do Postgres guarda só o código de erro (SQLSTATE) e o nome da restrição. Se o Drizzle embrulhar o erro, a consulta e os parâmetros também ficam de fora. Para outros erros guarda só o nome e as linhas `at` da pilha.
- O escopo da escola chega pelo contexto, não por argumento.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts`, o teste da linha 471 confere o aviso e confere que sobe o erro original do lote, não o da gravação. O teste "log", entre as linhas 1025 e 1038, agora espera o evento novo. A chave `erro` já estava em `CHAVES_DO_LOG` antes, e o teste continua barrando texto sintético de pessoa.

Auditoria: presente onde a regra exige. Nada mudou neste diff. O expurgo por retenção registra a execução em `expurgo_execucao`, como já estava aprovado.

Envio externo: nenhum neste diff.

Seed/fixture: sintético. O teste novo usa erros simulados ("erro do lote", "banco fora"), sem dado de pessoa.

Bloqueantes: nenhum. Não havia correção exigida por mim na rodada anterior. A minha recomendação, logar quando a gravação da linha `false` falha, foi aplicada como pedi: o aviso sai e o erro original do lote continua subindo.

Recomendações: nenhuma nova. A causa 3 do runbook (`/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:464-470`) e o `TODO.md` descrevem o comportamento novo sem expor dado pessoal.

Pergunta de fechamento: este diff não altera o que o sistema guarda sobre um aluno nem para onde envia. A resposta continua a da rodada aprovada.

## infra-guardian · 3ª rodada · APROVADO · 2026-10-06 02:58:31 · `tasks/prd-lgpd-e-titular/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica (a 0025 não mudou desde a rodada aprovada)
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações: nenhuma nova. Das duas que deixei na rodada anterior, a 1 está registrada em `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md` (seção "Infra e operação") e o runbook a cita na causa 3. A 2 foi aplicada.

O que conferi neste diff:
- No `catch` de `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts` (linhas 77–86), quando a linha `false` não grava, o código loga `retencao.registro_nao_gravado` com `tipo` e `resumirErro(...)` e sobe o erro original do lote. Assim a fila tenta de novo pelo motivo certo e o erro de gravação não toma o lugar dele. O log leva só a categoria e o resumo tipado do erro, sem nenhuma linha de pessoa. A segunda tentativa de gravação acontece uma vez só, sem laço.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts`, o teste novo (por volta da linha 471) prova três coisas: o erro que sobe é o do lote, o aviso sai uma vez para a escola e nenhuma linha é gravada. A chave `erro` já constava em `CHAVES_DO_LOG`, e o teste de log da linha 1032 passou a incluir o evento novo.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, a causa 3 (por volta da linha 468) cobre o aviso novo, remete para a causa 2 quando a noite fica sem linha e cita a pendência do `TODO.md`.

Não rodei os testes, como você pediu, porque outros revisores usam o banco de teste em paralelo.
