# Achados das revisões — `tasks/prd-reengenharia/19_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 15:02:35 · `tasks/prd-reengenharia/19_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** nenhuma nova. A tarefa não tem migration. `job_registro` continua com `escola_id` e com o check `escola_id is not null or tipo like 'sistema.%'`.

**Queries verificadas:**
- `JobRegistroRepository.localizarParaExecucao` e `iniciarExecucao` não mudaram. O escopo continua vindo do contexto que o executor monta a partir do `job.data`.
- A vaga e a conferência de escopo usam o `escolaId` da linha que o repository já leu com escopo (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts:219` e `:271`), nunca o do Redis.
- A nova conferência `(definicao.escopo === 'sistema') !== (escolaId === null)` (`executor.ts:271`) fecha o caso de uma linha `sistema.*` gravada por SQL com `escola_id`, que o check do banco aceita.
- `montar-arquivo.ts` e `eliminar-titular.ts` pegam a escola só do contexto. Sem escola, falham fechado: por `exigirEscolaDoContexto` no primeiro, e por `janelaDaEscola.daEscola()` e `EliminacaoDoTitular.eliminar` no segundo. Nenhum dos dois lê a escola dos dados.
- `nomeDaFilaBullMQ(fila, executor)` e `executorDoJob` só tratam roteamento e retentativa. Não tocam escopo. O registro injetável `definicoes` é opcional e só o teste o passa: a produção usa `DEFINICOES_DE_JOB`.
- Não há endpoint novo. Nada aceita `escolaId` do cliente. Não aparece `@SemEscopo()` novo.

**Teste de isolamento:** presente e efetivo.
- O teste anterior continua efetivo: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/test/execucao.int.test.ts` › "isolamento no worker" (job com a escola A, ou sem escola, apontando para a linha da B). Sem o escopo em `localizarParaExecucao`, a linha da B seria localizada e rodaria. As asserções de `NAO_ENCONTRADO`, de log idêntico ao do id inexistente e de linha da B intacta quebrariam.
- A conferência nova também está coberta:
  - em unidade, por `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.test.ts:318`, com as duas mutações declaradas, uma para cada lado da desigualdade;
  - em integração, por `execucao.int.test.ts` › "rotina do sistema com escola (a linha foi escrita por SQL…) não roda". Sem a cláusula, o processador seria chamado e `chamados` deixaria de ser vazio.

**Bloqueantes:** nenhum.

**Recomendações:**
- `executor.ts:237`: a escola é contada no uso (`uso.marcar('jobs')`) antes de a definição recusar a linha (`TIPO_DESCONHECIDO`, escopo trocado ou `DADOS_INVALIDOS`). Uma linha recusada acaba contada na escola da linha. Vale considerar conferir a definição antes de `iniciarExecucao` e do `marcar`. Isso não vaza dado.
- `montar-arquivo.ts`: sem escola, o `exigirEscolaDoContexto` lança um `Error` comum, que vira `ERRO_INTERNO` com retentativa, e não `DADOS_INVALIDOS` definitivo. Na prática esse caminho não é alcançado, porque o `executor.ts:271` barra antes. Fica só o registro de que a defesa interna do processador agora é não-definitiva.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 15:03:22 · `tasks/prd-reengenharia/19_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila
Rate limit: ok (a tarefa não mexe nele; a vaga por escola continua igual)
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok (nenhuma query nova)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/src/fila-de-publicacao.ts:57-58` e `:110-118`. Um tipo com `executor: 'api'` é publicado em `api-<fila>`, e hoje ninguém consome essa fila. O despachante toma a vaga da escola ao publicar e continua renovando essa vaga. A reconciliação vê o job `presente` e não faz nada. O teste `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/test/vagas.int.test.ts:394` prova justamente isso: a linha fica `publicado` para sempre. Hoje não acontece, porque os 8 tipos são `worker`. Mas se alguém declarar um tipo `api` antes de o consumidor da onda 3 existir, esse job ocupa a vaga da escola até ser removido à mão, e às 10h a escola trava. Na onda 3 (43.0), ponha uma trava: um tipo `api` só entra no registro com o consumidor montado, num teste equivalente ao `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/montagem.test.ts`. Ou então o job `api` não toma a vaga do worker.
- As filas `api-*` ficam fora da medição por fila e do teste de métricas (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/infra/test/metricas.int.test.ts:107` só olha as filas do worker). Na onda 3, essas filas precisam entrar na medição de tamanho e idade por escola e no alerta de job interativo esperando, com o runbook.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts:237`. `uso.marcar('jobs')` roda antes da validação pela definição. Assim, uma linha recusada com `DADOS_INVALIDOS` ou `TIPO_DESCONHECIDO` entra como uso da escola (D30). O efeito é pequeno, mas o certo é registrar no `TODO.md` ou contar só depois de o esquema aceitar os dados.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 15:04:00 · `tasks/prd-reengenharia/19_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. Todas as dez divergências da tabela estão registradas em `tasks/prd-reengenharia/onda-1b.md` §2 T4, em "Como a 19.0 ficou". Isso inclui:
- a caracterização das opções de publicação, que entrou no mesmo commit da tarefa e não num commit anterior;
- o nome `api-<fila>`, com a `Queue` da API criada só quando um tipo a pede;
- a conferência do escopo, que recusa com `DADOS_INVALIDOS`;
- o teste de concorrência, que ficou como "linha já terminada não roda de novo".

O `prazoMs` só chega ao processador e não é aplicado, e nada consome as filas `api-*`. As duas coisas ficam para a onda 3, como diz "Fora do escopo".

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
- `apps/worker/src/processadores/eliminar-titular.ts:24` e `apps/worker/src/processadores/montar-arquivo.ts:22`: o primeiro parágrafo do JSDoc ganhou um parêntese enfiado no meio, com perto de 200 caracteres na linha. Vale quebrar a linha ou mover a frase sobre a validação para um item próprio.
- `packages/nucleo/src/fila/publicacao.ts:9-12`: `OpcoesDeJobPublicado.backoff` é opcional, mas `opcoesDeJob` sempre o preenche. O opcional deixa entrar um caminho que não existe. Se não for exigência do tipo do BullMQ, pode ser obrigatório.
- `packages/nucleo/src/fila/publicacao.ts:15`: `OPCOES_DO_TIPO_DESCONHECIDO` repete em literal os mesmos 5, 2.000 e 0,5 da definição. A escolha está justificada na tarefa. Ainda assim, uma linha no comentário dizendo que o valor não precisa acompanhar o registro, já que o worker termina esse job na primeira tentativa, evita que alguém tente "sincronizar" os dois depois.
- `apps/worker/src/processadores/montar-arquivo.ts:37`: sem escola no contexto, a falha agora é um `Error` genérico. Ele vira `ERRO_INTERNO` e é tentado de novo, em vez de `DADOS_INVALIDOS` definitivo. Pelo executor esse caminho não acontece, porque o escopo é conferido antes. Mas `onda-1b.md` diz que "o da escola" mantém a conferência de contexto que já tinha, e o `eliminar-titular.ts` deixou de fazê-la. Vale alinhar o texto ao que o código faz.
- `apps/worker/src/executor.ts:237-242`: a linha que a definição recusa já é contada no uso da escola (`uso.marcar('jobs')`) e no log `job.iniciado`, porque a validação vem depois do `iniciarExecucao`. É inofensivo, mas mover as conferências da definição e do escopo para antes da contagem deixa o uso mais fiel.

Arquivos lidos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/19_task.md`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-1b.md`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/executor.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/montagem.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/src/fila-de-publicacao.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/fila/publicacao.ts`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/fila/filas.ts`, além dos testes novos e alterados.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 15:05:49 · `tasks/prd-reengenharia/19_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Publicação:** a caracterização em literal (5 tentativas, 2 s, jitter 0,5); a retentativa vindo da definição injetada; o tipo desconhecido; o tipo `executor: 'api'` indo para a fila `api-<fila>`, que o worker não consome; o nome de hoje mantido para o worker.
- **Worker:** recusa os `dados` que o esquema não aceita, sem processador e na primeira tentativa (definitivo); `TIPO_DESCONHECIDO` para tipo sem definição e para tipo sem processador na réplica; o escopo da definição conferido contra a escola da linha; log e `failedReason` só com o código; `prazoMs` entregue; o payload de hoje dos 8 tipos aceito; processador tipado pela definição (tsc).
- **Montagem:** tipo ↔ processador ↔ fila nos dois sentidos.
- **Isolamento:** escola A apontando para a linha da B.
- **Concorrência:** a mesma linha entregue duas vezes.
- **Resiliência:** a `Queue` cuja preparação falhou é trocada, e agora isso vale também para a `Queue` da API, que é nova.

**Cobertos** (rodei os unitários dos 7 arquivos, 79 verdes, e os casos novos de `execucao.int` e `vagas.int`, verdes):
- **`executor.test.ts`:** "o payload de hoje de cada um dos 8 tipos", "dados que o esquema recusa" (4 casos, com `UnrecoverableError` e a vaga devolvida), "tipo que o registro não tem", "tipo com definição e sem processador", "o escopo da definição se confere" (os dois sentidos), "o processador recebe os dados que o esquema leu" (com `default` e o `prazoMs` injetado), e o `@ts-expect-error`, que o tsc confere porque o tsconfig inclui `src` e `test`.
- **`execucao.int.test.ts › o worker valida pela definição`:** os três casos. O sentinela, na chave e no valor, fica fora do log e do `stacktrace`; `attemptsMade` é 1; o `failedReason` é o código.
- **Isolamento:** o caso já existente "isolamento no worker" continua cobrindo, e a escola que o escopo confere vem da linha lida com escopo (`alvo.escolaId`), não do Redis.
- **`vagas.int.test.ts`:** "a retentativa é a da definição do tipo" (attempts 2 saindo do despachante de verdade) e "o tipo da API vai à fila da API".
- **`montagem.test.ts`:** os três casos, sobre a função de montagem real (`montarProcessadores`).
- **`publicacao.test.ts`, `nome-da-fila.test.ts`, `fila-de-publicacao.test.ts`:** o roteamento por executor e a retentativa por tipo.
- **Concorrência:** a entrega repetida depois do `concluido` e a "escrita tardia". A sobreposição em paralelo pelo stalled está em `reexecucao.int`, com o efeito gravado uma vez. A divergência sobre isso está registrada no `onda-1b.md`.
- **Sem `.skip`, sem provedor de IA, sem mock nosso escondendo a regra.**

**Bloqueantes:**

1. **A troca da `Queue` que falhou, agora por executor, não tem teste nem bloco.** Arquivo: `apps/despachante/src/fila-de-publicacao.ts:120-123`.
   - O caso "a preparação da Queue falhou…" (`fila-de-publicacao.test.ts:128`) só publica o tipo do worker e só compara a `fila` das chamadas, sem olhar o `executor`. Duas mutações ficam verdes:
     - `nomeDaFilaBullMQ(fila, 'worker')` na `:121`: a `Queue` da API que falhou nunca é trocada, e o BullMQ guarda essa falha para sempre.
     - `this.criarFila(fila, 'worker')` na `:123`: a chave `api-interativa` passa a apontar para a `Queue` do worker, e o job de IA cai na fila que o worker consome e termina em `TIPO_DESCONHECIDO`.
   - Correção exigida: um caso com um tipo `executor: 'api'` cuja `Queue` falha no `waitUntilReady`. Ele confere que a seguinte é criada com `('interativa', 'api')` e recebe o `addBulk`, e que a do worker não é tocada. E um bloco de mutação para cada uma das duas linhas.

2. **Cláusulas novas do roteamento por executor sem bloco na seção "Mutações".** Os testes existentes ficariam vermelhos, mas o portão não prova nenhuma delas:
   - `apps/despachante/src/montagem.ts:99`: `nomeDaFilaBullMQ(nome, executor)` na fábrica da `Queue`. Mutação: `'worker'`. Teste: `vagas.int.test.ts › o tipo da API vai à fila da API`.
   - `apps/worker/src/montagem.ts:184`: `nomeDaFilaBullMQ(fila, 'worker')` no `Worker`. Mutação: `'api'`. Mesmo teste: o processador passaria a ser chamado.
   - `apps/despachante/src/fila-de-publicacao.ts:115`: `this.criarFila(fila, executor)` no `queueDa`. Mutação: `'worker'`. Teste: `fila-de-publicacao.test.ts › o tipo da API vai à Queue da API`, pelo `criadas`.

**Recomendações:**
- **Citar cada teste pelo nome na tabela.** A coluna "Tipo" diz "integração" ou "unidade", sem o nome. O mapa:

  | Linha da tabela | Teste |
  |---|---|
  | `dados` recusados | `execucao.int › dados que o esquema recusa terminam falhou…` |
  | `DADOS_INVALIDOS` não gasta tentativas | `executor.test › dados que o esquema recusa (%s)` |
  | Tipo sem definição termina `TIPO_DESCONHECIDO` | `execucao.int › tipo que o registro não tem…` |
  | O payload de hoje de cada tipo passa | `executor.test › o payload de hoje de cada um dos 8 tipos…` |
  | Log e `failedReason` só com o código | o mesmo da primeira linha |
  | Linha `sistema.*` com `escola_id` | `execucao.int › rotina do sistema com escola…` |
  | `executor: 'api'` vai para a fila `api` | `vagas.int › o tipo da API vai à fila da API…` |

- **Corrigir as referências de linha.** `execucao.int.test.ts:213` hoje é a `:229`. Em `executor.test.ts:91`, o caso que prova o prazo da definição é "o processador recebe os dados que o esquema leu" (perto da `:173`), não o da `:91`.
- **Corrigir o teste citado na linha de concorrência.** A mutação "`iniciarExecucao` sem condição de estado" não deixa vermelho o teste da entrega repetida (`:212`), porque o `finalizado` do `localizarParaExecucao` protege antes. Quem a pega é "escrita tardia…" (`:171`).
- **O `esperar(1_500)` em `vagas.int.test.ts › o tipo da API vai à fila da API` é decorativo.** Ele prova uma ausência com um tempo fixo. Não quebra sob carga, só passaria em falso. A prova de verdade já está nas duas linhas antes dele (o job está em `api-interativa` e não está em `interativa`), e o sleep pode sair.
- **Defesa a mais no executor:** recusar a definição com `executor !== 'worker'`. Hoje o worker só não roda o job da API porque a réplica não tem o processador, e quem garante isso é o `montagem.test.ts`.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/src/fila-de-publicacao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/src/fila-de-publicacao.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/src/montagem.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/montagem.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/19_task.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 16:33:09 · `tasks/prd-reengenharia/19_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O que conferi no diff da 2ª rodada:
- As três recomendações que a ordem mandou aplicar estão feitas. O JSDoc de `eliminar-titular.ts` e de `montar-arquivo.ts` foi quebrado em tópico, `OPCOES_DO_TIPO_DESCONHECIDO` ganhou o comentário e o texto de `onda-1b.md` agora bate com os dois processadores.
- O teste novo de `fila-de-publicacao.test.ts` ("a Queue da API que falhou também é trocada, pelo executor") cobre o caminho `trocar` com `executor: 'api'`. As duas mutações que ele recebe (`nomeDaFilaBullMQ(fila, 'worker')` e `criarFila(fila, 'worker')`) apontam para linhas que existem em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/src/fila-de-publicacao.ts`, nas linhas 121 e 123.
- As outras mutações também apontam para linhas que existem:
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/src/fila-de-publicacao.ts`, linha 115.
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/src/montagem.ts`, linha 99.
  - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/worker/src/montagem.ts`, linha 184. Essa é exercitada pelo `montarWorker` de `fila-de-teste.ts`.
- Em `vagas.int.test.ts` saiu o `esperar(1_500)`, mas o teste não ficou mais fraco. Quem prova que o job não foi para a fila do worker é `daApi.fila.getJob(id)` indefinido, e não a espera. O `soltar()` passou para o `finally`, então o fechamento não trava se o worker pegar o job.
- Cada linha da tabela de cenários aponta agora para o teste pelo nome, e a linha nova da troca da `Queue` da API está registrada.
- A seção "Recomendações sem aplicar" diz o destino ou o motivo de cada item. A 43.0 existe e toca `executor.ts`.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/19_task.md:313-317`: o cabeçalho da tabela de "Recomendações sem aplicar" ficou duplicado. O primeiro, que veio do modelo, sobrou como uma tabela vazia antes da linha em branco. Basta apagar as linhas 313 e 314.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 16:34:00 · `tasks/prd-reengenharia/19_task.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada, só o diff r1→r2 e o que ele toca):
- A `Queue` da API que falha no `waitUntilReady` é trocada por uma nova criada com `('interativa', 'api')`. Essa nova recebe o `addBulk`, e a do worker não é tocada.
- Um bloco de mutação para cada linha nova do roteamento por executor:
  - `fila-de-publicacao.ts:115`, `:121` e `:123`
  - `apps/despachante/src/montagem.ts:99`
  - `apps/worker/src/montagem.ts:184`
- As recomendações que a ordem mandou aplicar: a tabela com o nome de cada teste, a linha de concorrência corrigida, e o `esperar(1_500)` retirado.

Cobertos:
- **Correção 1, feita.** O caso novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/src/fila-de-publicacao.test.ts:143`. Ele confere a lista exata de chamadas a `criar`, com o executor, que o `addBulkDaNova` foi chamado e que o `addBulkDoWorker` não foi. Repassei as duas mutações pedidas contra o código:
  - `nomeDaFilaBullMQ(fila, 'worker')` na `:121`: o `#filas.get('interativa')` devolve a fila do worker, a `quebrada` nunca sai, o `close` não é chamado e o segundo `publicar` falha. Fica vermelho.
  - `criarFila(fila, 'worker')` na `:123`: a fila nova é a que tem o `addBulkDoWorker`, a asserção `not.toHaveBeenCalled` cai e a lista de chamadas também. Fica vermelho.
  - O trecho `const nome = nomeDaFilaBullMQ(fila, executor)` aparece duas vezes no arquivo (`:112` e `:121`). O bloco leva como contexto a linha da assinatura de `trocar`, e o `mutacoes.ts:141` desfaz a ambiguidade com ela.
- **Correção 2, feita.** Os cinco blocos estão na seção "Mutações" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/19_task.md`, e cada um chega à sua cláusula:
  - **`:115`:** com a mutação, `criadas` registra `'interativa'` no lugar de `'api-interativa'`, e o `addBulk` vai para a chave errada.
  - **`montagem.ts:99` do despachante:** o job vai para a fila do worker, e `filaDaApi.getJob(id)` volta `undefined`.
  - **`montagem.ts:184` do worker, mutado para `'api'`:** o bloco não cita o `vagas.int.test.ts › o tipo da API vai à fila da API`, que eu tinha sugerido, e sim o `execucao.int.test.ts › falha permanente`. A escolha está certa: sem o `esperar`, o `iniciados('A')` do `vagas` é lido logo depois da publicação e ficaria verde. No `falha permanente`, o worker que escuta `api-*` nunca recebe o job, e o `aguardarEstado(..., 'falhou', 60_000)` estoura. Fica vermelho pelo motivo certo.
- **Tabela de "Testes que provam a regra".** Cada linha cita o teste pelo nome, e conferi que os nomes existem:
  - `escrita tardia…` e `o mesmo job entregue de novo…` em `execucao.int.test.ts:171` e `:212`
  - os três de `montagem.test.ts`
  - `nome-da-fila.test.ts:6`

  A linha nova da troca da `Queue` da API tem o seu teste. A linha de concorrência já não diz "em paralelo".
- **`esperar(1_500)` retirado.** O `processador.soltar()` foi para o `finally`, para o fechamento não ficar preso se o worker tiver pegado o job. Quem prova a regra é `daApi.fila.getJob(id)`, que tem de voltar `undefined`.
- `npx vitest run apps/despachante/src/fila-de-publicacao.test.ts` passou: 19 de 19.
- O resto do diff só mexe em texto: JSDoc em `eliminar-titular.ts` e `montar-arquivo.ts`, um comentário em `publicacao.ts` e o `onda-1b.md`.
- Não há `.skip` nem mock que esconda a regra: a `Queue` falsa substitui o BullMQ, que é dependência de fora.

Bloqueantes: nenhum.

Recomendações:
- O bloco do `apps/worker/src/montagem.ts:184` só fica vermelho quando estoura a espera de 60 s do `aguardarEstado`, o que deixa o portão mais lento. Um caso curto, com um job sintético que precisa ser concluído e uma espera de poucos segundos, prova a mesma cláusula mais rápido.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/despachante/test/vagas.int.test.ts:406`, o `expect(processador.iniciados('A')).toBe(0)` não prova mais nada: ele é lido antes de o worker ter tempo de sondar a fila. Ou sai, ou fica com um comentário dizendo que quem prova é o `getJob` da `:405`.
- A linha de concorrência da tabela agora cita entregas em sequência. É comportamento que já existia e esta tarefa não mudou, mas se `reexecucao.int.test.ts` tem o caso de duas entregas em paralelo, vale citá-lo na mesma linha.
