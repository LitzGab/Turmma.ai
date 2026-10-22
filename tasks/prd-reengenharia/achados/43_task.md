# Achados das revisões — `tasks/prd-reengenharia/43_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-22 18:01:30 · `tasks/prd-reengenharia/43_task.md`

VEREDITO: APROVADO

Esta tarefa não adiciona chamada de modelo. Ela só cria o corte por prazo e a interrupção no desligamento do executor do worker. Conferi o que cabe à regra 30:

- Não há SDK de provedor no diff nem em `apps/worker/src`.
- Os 8 tipos de `DEFINICOES_DE_JOB` são todos `executor: 'worker'`. Nenhum `ia.*` entra aqui, e `nucleo/src/ia/` não mudou. O prazo da IA é da 47.0, como a tarefa decidiu.
- O `sinal` e o `prazoMs` chegam ao processador sem tocar a porta de IA. O processador de IA da 47.0 poderá recebê-los por esse mesmo caminho.
- O log `job.tempo_esgotado` leva só `jobId`, `tentativa` e `prazoMs`. Não leva prompt, dado de aluno nem conteúdo.
- O disjuntor e o prazo por perfil já estão na 48.0, que é outra tarefa.

Não rodei os testes nem o portão. A aprovação vem da leitura do diff, do 43_task.md e da definição dos tipos.

Perfis usados: nenhum. Não há chamada de modelo.

Custo estimado por professor/mês: R$ 0. Zero chamadas de modelo por professor, em qualquer perfil. O `sintetico` queima CPU local.

Prompt versionado: não se aplica.

Validação de schema: sim, e o diff a preserva. O `rodarProcessador` continua lendo os dados pelo esquema estrito do tipo antes de chamar o processador. O código de falha vai só pelo catálogo `CodigoDeFalhaDeJob`, que ganhou `TEMPO_ESGOTADO` e `EXECUCAO_INTERROMPIDA`.

Aprovação humana no caminho: não se aplica. O diff não toca entrega de agente, nota nem mensagem à família.

Bloqueantes: nenhum.

Recomendações:
- Quando a 47.0 trouxer os `ia.*` para o worker, o processador de IA tem de repassar o `sinal` ao adaptador (fetch ou stream) e contar o custo parcial da chamada abortada. O runbook já avisa que o processador que ignora o `sinal` segue rodando depois do corte. Para IA, isso significa uma chamada paga que continua sem ninguém esperar por ela. Vale registrar isso na 47.0.
- O corte por `TEMPO_ESGOTADO` e a interrupção no SIGTERM são os mecanismos que dão a um agente em fila os limites de tempo e de parada (item 10 da minha lista). Falta o limite de passos e de custo por execução. A 47.0 deve declará-los explicitamente.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/montagem.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/processadores/sintetico.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/shared/src/sistema/jobs.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 18:02:42 · `tasks/prd-reengenharia/43_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila | deploy
Rate limit: ok (a tarefa não toca rate limit)
Fila e prioridade: ok
Concorrência: protegida. O `concluir` e o `registrarFalha` só gravam se o job ainda está no estado de origem esperado, então quando o `interromper` e o fim natural do processador chegam juntos, só um dos dois vale. Liberar a vaga duas vezes não causa dano. A flag `interrompida` impede que a rejeição tardia grave uma segunda falha. Os testes cobrem duas escolas interrompidas ao mesmo tempo e a rejeição depois do corte.
Índice e paginação: ok (não há query nova)
Degradação de IA: não se aplica (os `ia.*` ficam com a 47.0)
Migration: não se aplica
Métrica e alerta: ok para o escopo. O `job.falhos` e o alerta são da 44.0, e o runbook ganhou os parágrafos 6 e 7.
Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/montagem.ts:224`: o `await executor.interromper()` não tem prazo próprio. Com o banco ou o Redis de vagas lentos, ele gasta os 5 s que separam a graça (20 s) do SIGKILL (25 s), e aí a gravação do `EXECUCAO_INTERROMPIDA` fica pela metade. Vale envolver numa corrida de uns 3 s, como já é feito com o `close()`.
2. Nenhum processador real recebe o sinal (`montar-arquivo.ts`, `expurgar-*.ts`, `eliminar-titular.ts`). Só o sintético o escuta. Quando um desses estoura e ainda tem tentativa, a vaga sai na hora (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts:279`), mas a tentativa velha continua rodando. Com isso, a mesma escola pode ter até 5 execuções do mesmo job ao mesmo tempo, passando por cima do limite de concorrência por escola. O caso mais exposto é o `montar-arquivo`, que roda na fila normal. A decisão 2 da R55 aceita isso e o runbook avisa. Mesmo assim, conferir `sinal.aborted` entre um lote e outro desses processadores fecha a brecha e deve virar linha no `TODO.md` ou entrar na tarefa que mexer neles.
3. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts:332`: o estouro que ainda vai ser repetido só aparece no log. O `job.falhos{tipo}` da 44.0 conta só a falha final, então um tipo que estoura 4 vezes e passa na 5ª não aparece em métrica nenhuma. Sugiro um contador de estouros por tipo e por fila na 44.0.
4. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts:429`: o `gravarFalhaDefinitiva` registra `job.falhou` mesmo quando o `registrarFalha` devolve `false`. Isso já era assim antes, mas agora o `interromper` e o `falhar` podem gravar a mesma falha ao mesmo tempo, e o log sai em dobro. Vale registrar só quando a linha foi de fato alterada.
5. Depois que uma thread do sandbox é abortada, a contagem não a inclui mais enquanto ela termina. Nesses milissegundos o `threadsMaximo` pode ser ultrapassado. Isso está declarado na tarefa e é aceitável no carga, mas vale uma linha no comentário de `infra/compose.carga.yml` sobre o `cpus:`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 18:02:59 · `tasks/prd-reengenharia/43_task.md`

**VEREDITO: APROVADO**

- **Escopo:** respeitado. As subtarefas 43.1 a 43.7 foram feitas. `nucleo/src/ia/` não foi alterado, e o código das tarefas 44.0, 45.0 e 47.0 não entrou.
- **Aderência à Tech Spec:** ok. As divergências da tarefa estão todas em `onda-3b.md`, no trecho "Como ficou (43.0)": o `sinal?` opcional só no tipo, a tarefa 43.1 sem commit próprio, o código que o sandbox devolve ao abortar, a tentativa interrompida que sai como `ErroParaAFila`, o `fila-de-teste.ts` sem mudança e os 8 prazos conferidos. Esta spec não tem `cenarios.md`. As decisões 1 a 4 do Arquiteto (R55) foram seguidas.
- **Portão local:** carimbo válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo).
- **Bloqueantes:** nenhum.

Conferi as corridas que podiam esconder bug, e nenhuma esconde:
- **`interromper` com `concluir` ao mesmo tempo:** `registrarFalha` e `concluir` só gravam com a linha no estado esperado, então o primeiro a chegar fica.
- **Liberar a vaga duas vezes:** a liberação é idempotente.
- **Rejeição depois do corte:** o segundo argumento do `then` trata essa rejeição. Rejeitar de novo uma promessa que já terminou não faz nada.
- **Temporizador do `comPrazo` armado no desligamento:** não segura o processo, porque `main.ts:16` usa `useProcessExit: true`.
- **Thread terminada pelo aborto:** a mensagem atrasada dela não acha pedido, e o `exit` dela redistribui a fila.

**Recomendações:**
1. `infra/compose.yml:341`: o comentário do bloco dos workers ainda diz "espera os jobs em andamento por até 30 s". Ele contradiz o novo comentário da linha 375 e a constante `GRACA_DO_DESLIGAMENTO_MS = 20_000`. Trocar para 20 s.
2. `apps/worker/src/executor.ts:354`: o comentário de `interromper` diz "o desligamento não espera por eles", mas `interromper` espera `registrarFalha` e `liberarVaga`. O que acontece é que a falha vira aviso. Corrigir o texto, porque são esses segundos que cabem entre os 20 s da graça e os 25 s do `stop_grace_period`.
3. `apps/worker/src/executor.ts:269` e `:419`: a conta da última tentativa, `tentativa >= (job.opts.attempts ?? 1)`, está escrita duas vezes. Extrair para um só lugar, para as duas não divergirem.
4. `docs/runbook.md:117`: o item 7 lista "queda do host" entre as causas de `EXECUCAO_INTERROMPIDA`. Numa queda sem SIGTERM (kill -9, host que caiu), `interromper` não roda, a linha fica `ativo` e o job volta pelo stalled. Restringir a causa ao desligamento com SIGTERM, para o operador não procurar esse código depois de uma queda real.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/montagem.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/processadores/sintetico.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/infra/compose.yml`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/docs/runbook.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-3b.md`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 18:05:13 · `tasks/prd-reengenharia/43_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** o processador que termina antes do prazo conclui, e o prazo não o corta depois.
- **Corte:** o corte acontece exatamente no `prazoMs` e não antes, a 4 999 ms nada falha, e o prazo vem da definição do tipo, não é fixo.
- **Estouro com tentativa sobrando:** o erro não é definitivo, nada é gravado e a vaga sai.
- **Rejeição tardia:** o processador que rejeita depois do corte não gera rejeição sem tratamento.
- **Thread do sintético:** é terminada no aborto, o pedido na fila sai dela, o sinal que já chega abortado rejeita na hora e o pedido já concluído não é tocado.
- **Integração do estouro:** job real com `attempts: 1` e prazo de 300 ms termina `falhou/TEMPO_ESGOTADO`, a vaga sai e o log leva só ids.
- **Limite 1 por escola:** o segundo job roda logo depois do estouro do primeiro.
- **SIGTERM:** com `attempts: 1` termina `EXECUCAO_INTERROMPIDA` e o sobrevivente não executa o job; com `attempts: 5` o job continua `ativo` e com a vaga.
- **Isolamento:** escolas A e B interrompidas juntas, cada falha grava só a linha da própria escola.
- **Configuração:** graça de 20 s, e o `stop_grace_period` de todos os workers é maior que ela.
- **Concorrência:** o desligamento além da graça chega no mesmo instante em que a tentativa termina sozinha (conclusão ou falha), e o processador que ignora o sinal continua rodando ao mesmo tempo que a retentativa.

**Cobertos:** todas as 11 linhas da tabela têm teste citado pelo nome.
- `executor.test.ts`: os blocos «prazo do tipo (RF17)» e «desligamento além da graça (interromper)».
- `sintetico.test.ts`: o bloco «sinal abortado» e o caso «passa o sinal da execução à queima de CPU».
- `prazo-do-job.int.test.ts`: três casos.
- `execucao.int.test.ts`: três casos de SIGTERM, um deles com duas escolas.
- `desligamento.test.ts`: os dois casos.
- `definicoes-de-job.test.ts`: os 8 prazos fixados.

Rodei unidade (127 de 127) e integração (35 de 35), tudo verde. Não há `.skip`. Os mocks são só do repositório e das vagas, e a integração usa Postgres e Redis reais. Nenhum provedor de IA é envolvido.

**Bloqueantes:**

1. **Quatro cláusulas novas sem bloco de mutação.** O teste de cada uma ficaria vermelho, mas o portão não prova isso.
   - `apps/worker/src/executor.ts:334`, `rejeitar(new TempoEsgotado())`. É a cláusula que faz a tentativa falhar no prazo. O bloco do `super(..., true)` muda só o "definitivo", não o código nem a rejeição. Exigido: um bloco que troque por `rejeitar(new FalhaDeJob(CodigoDeFalhaDeJob.ERRO_INTERNO))`, apontando para `› processador pendente: aos 5 000 ms a tentativa falha com TEMPO_ESGOTADO`.
   - `apps/worker/src/executor.ts:335`, `}, prazoMs)`. A tabela declara a mutação "cortar em `prazoMs - 1`" e não há bloco para ela. O bloco "fixo" mexe no argumento da linha 321, não no `setTimeout`. Exigido: `}, prazoMs - 1)` apontando para `› processador pendente: aos 5 000 ms …`.
   - `apps/worker/src/executor.ts:321`, o `controle.signal` entregue ao processador (subtarefa 43.3, "`Processador` recebe `sinal`"). Exigido: trocar por `new AbortController().signal` apontando para `› processador pendente …`.
   - `apps/worker/src/processadores/sintetico.ts:95`, `pedido.rejeitar(new FalhaDeJob(CodigoDeFalhaDeJob.EXECUCAO_INTERROMPIDA))` em `#abortar`. É o "e rejeita" da linha da tabela. Exigido: trocar o código por `ERRO_INTERNO` apontando para `› termina a thread que queimava, rejeita com EXECUCAO_INTERROMPIDA …`.

2. **O desligamento pode marcar `falhou` um job que já terminou, e não há teste em paralelo para isso** (`apps/worker/src/executor.ts:269-291`).
   - **O defeito:** a tentativa só sai de `#emAndamento` no `finally` (linha 290). Isso vem depois de `repositorio.concluir` (linha 286) e depois de `falhar`, que grava a falha.
   - **Primeiro caso:** se a graça acaba enquanto a última tentativa está em `concluir`, o `interromper()` ainda a acha com `ultimaTentativa: true`. Ele grava `EXECUCAO_INTERROMPIDA` e libera a vaga em paralelo. O `registrarFalha` aceita `ativo` e o `concluir` exige `ativo`, então se a falha chega antes, um job que concluiu o efeito termina `falhou/EXECUCAO_INTERROMPIDA`.
   - **Segundo caso:** a mesma janela existe se o prazo estourou e `falhar` está gravando `TEMPO_ESGOTADO`. A checagem `emAndamento.interrompida` (linha 276) já passou, então saem duas gravações de falha, duas liberações de vaga e dois `job.falhou` com códigos diferentes.
   - **O teste existente não cobre:** `› job que já terminou não é tocado` chama as duas coisas em sequência.
   - **Correção exigida:**
     - Teste de unidade com `concluir` pendente (uma promessa controlada pelo teste) e `interromper()` chamado enquanto ela não resolve. Ele deve afirmar `falhas` igual a `[]` e uma única liberação.
     - Teste equivalente com o estouro do prazo seguido de `interromper()` enquanto `registrarFalha` está pendente. Ele deve afirmar uma falha só, com o código do estouro.
     - Correção no executor: a tentativa deixa de ser interrompível assim que o `rodarProcessador` termina, seja removendo-a de `#emAndamento`, seja marcando-a, antes de `concluir` e de `falhar`.
     - Bloco de mutação para a nova cláusula.

**Recomendações:**
- A linha "Escola com limite 1" (`prazo-do-job.int.test.ts › o estouro libera a vaga da escola logo …`) usa `attempts: 1`. Nesse caso a vaga sai pelo caminho definitivo, que já existia. Um segundo caso com `attempts: 3` e limite 1 provaria na integração o `|| erro instanceof TempoEsgotado`, que hoje só a unidade prova.
- `sintetico.test.ts`, primeiro caso do bloco "sinal abortado": os limites de 3 000 ms de parede e 200 ms de CPU em 400 ms passam com folga larga no pool `forks`. Ainda assim dependem de relógio real. Se ficarem instáveis na esteira, troque a medida de parede pela contagem de threads ou pelo evento `exit`.
- Cenário de concorrência D49 que esta tarefa passa a produzir: a retentativa depois de `TEMPO_ESGOTADO` roda ao mesmo tempo que o processador antigo que ignora o sinal. Um caso com o sintético em modo `efeito`, mais um processador que ignora o sinal e grava, provaria que a chave de idempotência segura duas execuções simultâneas. Hoje isso está só escrito no runbook.
- `gravarFalhaDefinitiva` registra `job.falhou` mesmo quando `registrarFalha` devolve `false`. Com o bloqueante 2 corrigido isso pesa menos, mas o log mente quando a linha já tinha terminado.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/43_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/processadores/sintetico.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/processadores/sintetico.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/desligamento.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/test/prazo-do-job.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/test/execucao.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/fila/job-registro.repository.ts (as cláusulas de estado de `concluir` e `registrarFalha`, linhas 178-204)

## llm-integrator · 2ª rodada · APROVADO · 2026-10-22 18:28:19 · `tasks/prd-reengenharia/43_task.md`

VEREDITO: APROVADO
Perfis usados: nenhum. A tarefa não adiciona chamada de modelo; os `ia.*` ficam para a 47.0 (decisão 1 da R55).
Custo estimado por professor/mês: R$ 0, nenhuma chamada de modelo nova.
Prompt versionado: não se aplica
Validação de schema: não se aplica
Aprovação humana no caminho: não se aplica. O diff só mexe no corte por prazo e no desligamento do executor, sem entrega de agente, nota nem mensagem.

Auditei só o diff da rodada 2 e o que ele afeta. Li `executor.ts` por inteiro nos trechos tocados, mas não rodei os testes.

**Correção da corrida entre `interromper()` e o fim da tentativa**
- **Corrida fechada.** A tentativa sai de `#emAndamento` no `.finally` de `rodarProcessador` (`apps/worker/src/executor.ts:~278`), antes de `concluir` e de `falhar`. Com isso `interromper()` não grava `EXECUCAO_INTERROMPIDA` sobre um job que está concluindo ou gravando a falha do estouro, nem libera a vaga duas vezes.
- **`interrompida` não se perde.** Quando a rejeição vem do aborto, a tentativa já saiu do conjunto, mas a flag fica no objeto. O `catch` continua devolvendo `ErroParaAFila(EXECUCAO_INTERROMPIDA)` sem gravar nada.
- **Sem vazamento de entrada.** A entrada entra e sai no mesmo escopo, sem ponto de saída entre o `add` e a chamada. Não sobra entrada no conjunto depois do fim.
- **Aborto e `TempoEsgotado` preservados.** O aborto do prazo e a decisão de `TempoEsgotado` não mudaram.

**Mudanças menores, todas corretas**
- `esgotouAsTentativas(job)` reúne a conta que `ultimaTentativa` e `falhar` faziam duas vezes. `attemptsMade + 1 >= attempts ?? 1` é a mesma expressão de antes.
- `job.falhou` só vai ao log quando `registrarFalha` devolveu `true`. O log deixa de afirmar uma falha que não mudou a linha, e só leva ids e código (regra 20, item 9).
- O estouro com tentativa sobrando libera a vaga da escola. O teste de integração novo prova isso com limite 1 e usa a mutação `|| erro instanceof TempoEsgotado`.

**Testes e mutações**
- **Três casos novos de unidade.** São a conclusão em andamento, a gravação do estouro em andamento e o log condicional. Cada um tem mutação declarada, e cada mutação deve ficar vermelha:
  - Remover o `.finally` deixa a tentativa em `#emAndamento` para sempre, então `interromper()` grava uma falha que os testes proíbem.
  - O mutante do log faz `job.falhou` aparecer com `registrarFalha` devolvendo `false`.
- **Nenhum teste chama provedor pago.**

**Documentação**
- O runbook diz que o `EXECUCAO_INTERROMPIDA` vem do SIGTERM e que `kill -9` não grava esse código.
- O comentário de `infra/compose.yml` voltou aos 20 s.
- O `TODO.md` registra as recomendações adiadas.

Bloqueantes: nenhum

Recomendações:
- `apps/worker/src/montagem.ts` (já no `TODO.md`): dar prazo próprio ao `await executor.interromper()`. A correção desta rodada faz `interromper()` esperar a gravação e a liberação. É exatamente esse tempo que precisa caber entre os 20 s da graça e os 25 s do `stop_grace_period`. Corra a corrida de uns 3 s, como o `close()` já faz.
- `onda-3b.md` e o comentário de `interromper()`: as duas descrições ficaram corretas. Se a 44.0 tocar o executor, vale conferir de novo que nenhum caminho novo de falha entra em `falhar` antes do `.finally`.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/test/prazo-do-job.int.test.ts`

## infra-guardian · 2ª rodada · APROVADO · 2026-10-22 18:28:23 · `tasks/prd-reengenharia/43_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

Correção da corrida entre `interromper()` e o fim da tentativa, conferida em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts:161-163`:
- A tentativa sai de `#emAndamento` no `.finally` do processador, antes de `concluir` e de `falhar`. Com isso o desligamento não grava `EXECUCAO_INTERROMPIDA` sobre um job que já está concluindo ou já gravou o próprio estouro.
- Ainda existe uma janela: o `interromper()` marca a tentativa, e o processador, que ignorou o `sinal`, termina com sucesso nesse mesmo instante. Nesse caso o banco resolve. `concluir` e `registrarFalha` só mudam a linha com `estado` em `ativo` ou nas origens da falha (`packages/nucleo/src/fila/job-registro.repository.ts:182` e `:201`), então quem grava primeiro vence e o outro não altera nada.
- Os testes provam a correção. Os dois casos de unidade novos (`executor.test.ts:86-117`) ficam vermelhos com o `delete` no `finally` externo. O de integração (`prazo-do-job.int.test.ts:224-236`) prova que a vaga sai no estouro com tentativa sobrando: sem a liberação, o segundo job só concluiria depois de o primeiro ter falhado de vez.
- O log `job.falhou` agora só sai quando a linha mudou (`executor.ts:201`), e há teste para isso.
- O compose diz 20 s, igual ao `GRACA_DO_DESLIGAMENTO_MS`, e o runbook ganhou o caso de queda sem SIGTERM.

Recomendações:
- `executor.ts:293-300`: na janela descrita acima, `concluir` volta `false`, o resultado não é conferido e o log `job.concluido` sai mesmo assim. A vaga também é liberada duas vezes, o que é inofensivo porque a liberação é idempotente. Vale conferir o retorno de `concluir` antes de escrever `job.concluido`, como já se faz com `job.falhou`.
- O teste de integração de `prazo-do-job.int.test.ts:224` depende de tempo: o segundo job precisa concluir em 4 s contra os uns 6 s que o primeiro ficaria com a vaga. Na esteira, fique de olho em instabilidade e, se aparecer, aumente essa distância em vez de aumentar o `timeout`.
- Os quatro itens novos em `TODO.md` (prazo próprio do `interromper()`, processadores reais que escutam o `sinal`, comentário do `threadsMaximo` e o caso D49 com processador real) estão registrados como dívida e não bloqueiam.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 18:28:36 · `tasks/prd-reengenharia/43_task.md`

**VEREDITO: APROVADO**

- **Escopo:** respeitado. Esta rodada só fecha os dois bloqueantes do `test-engineer`, aplica as quatro recomendações da minha 1ª rodada e põe as pendências no `TODO.md`. Nenhum código de tarefa futura entrou.
- **Aderência à Tech Spec:** ok. As duas mudanças de comportamento estão em `tasks/prd-reengenharia/onda-3b.md:25`, no trecho "Como ficou (43.0)": a tentativa deixa de ser interrompível quando o processador termina, e `job.falhou` só vai ao log quando a linha mudou. Esta spec não tem `cenarios.md`.
- **Portão local:** carimbo válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo).
- **Bloqueantes:** nenhum.

**O que conferi nesta rodada:**
- **A corrida apontada pelo `test-engineer`:** fechada. Em `apps/worker/src/executor.ts:281-283`, o `.finally` tira a tentativa de `#emAndamento` antes de o `catch`, o `falhar` e o `concluir` rodarem. O `interromper` copia `#emAndamento` de forma síncrona, então não acha mais uma tentativa que já está gravando o desfecho. Os dois testes de unidade novos seguram `concluir` e `registrarFalha` e provam a uma falha só e a vaga liberada uma vez. Se a correção for desfeita, eles ficam vermelhos.
- **`interrompida` continua valendo no `catch`:** `emAndamento.interrompida` é lida do objeto, não do conjunto. A rejeição do processador depois do aborto ainda sai como `ErroParaAFila` sem gravar nada.
- **O log de `job.falhou`:** `gravarFalhaDefinitiva` (`executor.ts:438`) só escreve `job.falhou` quando `registrarFalha` devolve `true`. O teste novo lê o destino real do logger.
- **As quatro recomendações da 1ª rodada:** todas aplicadas. O compose diz 20 s (`infra/compose.yml:341`), o comentário de `interromper` foi corrigido (`executor.ts:362-363`), a conta virou `esgotouAsTentativas` (`executor.ts:149`), e o runbook tirou a queda do host do item 7 (`docs/runbook.md:117`).

**Recomendações:**
1. **`apps/worker/src/executor.ts:292-298`, conclusão depois de interromper.** No caminho de sucesso, ninguém confere `emAndamento.interrompida` nem o retorno de `concluir`. O caso: na última tentativa, o processador ignora o `sinal` e resolve depois do `interromper`. O `interromper` já gravou `falhou/EXECUCAO_INTERROMPIDA`, então o `concluir` não altera a linha. Mesmo assim, o log escreve `job.concluido`, e a vaga é liberada pela segunda vez (sem dano, porque a liberação é idempotente). É a mesma mentira de log que esta rodada corrigiu no `job.falhou`. Correção sugerida: só escrever `job.concluido` quando `concluir` devolver `true`. Isso já existia antes da tarefa, por isso não bloqueia.
2. **`apps/worker/src/executor.ts:281`, texto do comentário.** "o `finally` roda antes de a continuação ver o desfecho" está certo, mas é fácil ler errado. Diga que é o `.finally` encadeado em `rodarProcessador`, e não o `finally` externo do bloco.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/test/prazo-do-job.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/docs/runbook.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/infra/compose.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-3b.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/TODO.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 18:30:24 · `tasks/prd-reengenharia/43_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Corte no `prazoMs` do tipo: aos 4 999 ms nada falha, aos 5 000 ms dá `TEMPO_ESGOTADO`.
- O `sinal` é abortado e a vaga é liberada.
- Estouro com tentativa sobrando: não é definitivo e libera a vaga. Tem caso de unidade e caso de integração com limite 1 na escola.
- A rejeição que chega depois do corte é engolida.
- O sintético termina a thread quando o sinal aborta.
- SIGTERM além da graça: com `attempts: 1` dá `EXECUCAO_INTERROMPIDA`; com `attempts: 5` o job fica `ativo`.
- Isolamento: escolas A e B interrompidas juntas, cada falha grava só na própria escola.
- Graça de 20 s e `stop_grace_period` maior que ela.
- Concorrência (correção 2):
  - desligamento com `concluir` pendente;
  - desligamento com a falha do estouro sendo gravada;
  - `job.falhou` só no log quando a linha mudou.

**Cobertos:** todos.

Correção 1, os quatro blocos estão nas linhas 327–355 do `43_task.md` e cada um chega à sua cláusula:
- **Código `ERRO_INTERNO`:** o caso de 5 000 ms espera `TEMPO_ESGOTADO`, tanto no `toThrow` quanto em `falhas`.
- **`prazoMs - 1`:** a asserção `falhas` vazio aos 4 999 ms fica vermelha.
- **`new AbortController().signal`:** `guardado.sinal?.aborted` não chega a `true`.
- **Código `ERRO_INTERNO` em `#abortar` do sintético:** `expect(await queimando).toBe(EXECUCAO_INTERROMPIDA)` fica vermelho.

Correção 2:
- A tentativa sai de `#emAndamento` no `.finally` do `rodarProcessador` (`executor.ts:280-282`) e o `delete` do `finally` de fora foi tirado.
- Os dois casos de unidade são novos, em `executor.test.ts:440-470`.
- O bloco de mutação está citado três vezes. A citação em "job que já terminou não é tocado" também pega o vazamento, já que sem o `.finally` a tentativa nunca sai do conjunto.

As ordens extras foram aplicadas:
- **Log:** `job.falhou` só sai quando `registrarFalha` devolve `true`. O teste novo confere primeiro que o caso gravado escreve uma linha, então não passa à toa, e tem bloco próprio.
- **Integração:** o caso com `attempts: 3` e limite 1 está em `prazo-do-job.int.test.ts:93` e tem bloco próprio.

Sem `.skip`, `.only` nem teste comentado nos arquivos de teste alterados. Nenhum provedor de IA entra em jogo.

Rodei `npx vitest run --project unidade apps/worker/src/executor.test.ts`: 39 passaram. Não rodei o arquivo de integração, nem as mutações, que são do portão.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Vermelho por tempo, não por asserção:** `apps/worker/src/executor.test.ts:112`. Sob a mutação do `.finally`, o caso "o desligamento com a falha do estouro sendo gravada" fica vermelho, mas por estourar o tempo do teste. O motivo:
   - o segundo `registrarFalha` troca o `terminarGravacao` por uma promessa que nunca resolve;
   - com isso, `await executor.interromper()` fica parado e nenhuma asserção chega a rodar.

   O motivo de fundo é o certo (a segunda gravação aconteceu), mas a mensagem é ruim e custa o tempo inteiro do teste no portão. Sugestões:
   - fazer cada chamada de `registrarFalha` resolver por conta própria, por exemplo guardando os resolvedores numa lista;
   - ou conferir `falhas` antes do `await` do `interromper`, depois de um `advanceTimersByTimeAsync(0)`.
2. **Prazo de 4 s apertado:** `apps/worker/test/prazo-do-job.int.test.ts:104`. Pelo recuo (2 000 ms com jitter de 0,5) e pela espera de vaga (1 000 a 1 500 ms), o pior caso do caminho feliz conclui por volta de 3,1 s. A folga é de uns 0,8 s, e em esteira lenta o caso pode falhar sem motivo.
   - Quem prova a regra é a asserção da linha 105 (`preso` não está `falhou` quando o `livre` conclui). Sob a mutação, o `livre` só roda depois de o `preso` virar `falhou` de vez, então ela fica vermelha qualquer que seja o tempo.
   - Dá para soltar o limite de 4 s (por exemplo, usar o padrão de 15 s) e ficar só com a ordem, que é determinística. Assim o caso deixa de depender da máquina folgada.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/test/prazo-do-job.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/processadores/sintetico.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/43_task.md`
