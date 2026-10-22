# Achados das revisões — `tasks/prd-reengenharia/44_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-22 16:51:42 · `tasks/prd-reengenharia/44_task.md`

VEREDITO: APROVADO
Perfis usados: nenhum. A tarefa não adiciona nem altera chamada de modelo.
Custo estimado por professor/mês: R$ 0 de IA. A tarefa só muda retenção de `job_registro`, a série `job.falhos{tipo}`, um alerta e o runbook. Não há chamadas por professor.
Prompt versionado: não se aplica
Validação de schema: não se aplica
Aprovação humana no caminho: não se aplica
Bloqueantes: nenhum

Verifiquei estes pontos nos arquivos desta tarefa:
- **Provedor de IA:** nenhum arquivo alterado importa SDK de provedor (`openai`, `@anthropic`, `@google`, `ollama`). Não há mudança em `apps/api/src/ia/adapters`, nem em perfil, prompt, orçamento ou gateway.
- **Registro de execução de agente:** o expurgo mexe só em `job_registro`, que guarda ids (`packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts`). Passar o `falhou` de 7 para 30 dias não apaga rastro de agente nem a trilha de aprovação (regra 30, itens 6 e 9). O `concluido` continua em 7 dias.
- **Dado nas medições:** `job.falhos` leva só o tipo do job. Não leva escola, `dados` nem código da falha (`packages/nucleo/src/fila/despacho.repository.ts`, `medirFalhos`). A contagem para no teto de 10.000 por tipo.

Recomendações:
- A tarefa lista `llm-integrator` como subagente obrigatório, mas ela não toca a camada de IA. Se o alerta "Job que falhou de vez" cobrir jobs de agente (por exemplo `agente.*`), vale uma linha no runbook dizendo que a falha final de agente deixa a entrega `pendente` e sem efeito oficial. Isso não bloqueia.
- Quando a 43.0 (prazo por tipo) chegar, confira se o tipo de job de IA em lote tem prazo de retenção coerente com o limite de passos e de custo por execução (item 10).

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 16:52:40 · `tasks/prd-reengenharia/44_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila | migration
Rate limit: não se aplica (a tarefa não cria rota nem login)
Fila e prioridade: ok
Concorrência: protegida. O expurgo continua apagando em lote de 5.000 com `for update skip locked`, e o teste de reexecução (D49) passa com o predicado novo. A medição só lê o banco.
Índice e paginação: ok. O índice novo é `job_registro_falhos_idx (tipo) where estado = 'falhou'`. O teste de carga roda o `EXPLAIN` com 5.000 falhos e 100.000 concluídos e confirma que a medição não varre a tabela. O `EXPLAIN` do expurgo com `enable_seqscan = off` confirma que o `or` com o `estado` fixo em cada ramo continua descendo pelo `job_registro_finalizados_idx`. A contagem para em 10.000 por tipo. Rodei os dois arquivos de integração aqui e passaram os 16 casos.
Degradação de IA: não se aplica
Migration: compatível. A 0038 só acrescenta um índice. Ela não usa `concurrently`, o que segue o precedente das migrations 0034 e 0036, já aceito pela Tech Spec enquanto não há staging nem piloto, e roda sob `lock_timeout` de 5 s.
Métrica e alerta: ok. A métrica `job.falhos{tipo}` sai só com o rótulo `tipo`, sem escola, `dados` nem código da falha. O alerta tem entrada completa em `docs/runbook.md`, painel no Grafana e caso em `infra/test/alertas.test.ts`. A consulta dos falhos roda dentro do `statement_timeout` de 2 s do despachante, e a falha dela não apaga a medição de espera.
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/infra/grafana/alertas/job-falhou-de-vez.yaml:25`: o alerta é `job_falhos > 0` e fica aceso por 30 dias depois de qualquer falha. Para `titular.*`, fica aceso até a 46.0, que só chega na X6. Enquanto isso, uma falha nova do mesmo tipo não gera aviso novo, e o operador recebe o mesmo lembrete do Grafana várias vezes. Sugestão: o worker emitir um contador `job.falhou_total{tipo}` e uma regra com `increase(...) > 0` para avisar da falha nova; a contagem atual fica no painel. Se não entrar agora, registrar no `TODO.md` ou na 46.0.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/infra/grafana/alertas/job-falhou-de-vez.yaml:26` com `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/despachante/src/metricas-espera.ts:210`: se só a consulta dos falhos estourar o tempo, com o Postgres de pé, a série some e o alerta volta a normal sem aviso nenhum. A regra de 5xx, que o runbook cita para esse caso, só cobre o Postgres fora. Vale uma linha no runbook dizendo que procurar a falha da medição no log do despachante, ou guardar o último valor por um intervalo curto.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts:45`: cada lote do expurgo lê e descarta, no começo do índice, os `falhou` que ficam (`titular.*` e os que ainda estão no prazo). Hoje são poucos. Se um incidente gerar dezenas de milhares de falhas, vale medir a duração do lote nas noites seguintes. Por ora é só observação.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 16:52:46 · `tasks/prd-reengenharia/44_task.md`

VEREDITO: APROVADO

Escopo: respeitado. Nada da 46.0 (listar, reprocessar e descartar) nem da 43.0 (prazo por tipo) entrou no diff. O código vai além dos "Arquivos previstos" em quatro pontos: o índice 0038, o painel, `METRICAS.falhos` e a lista do `alerta-tem-runbook.test.ts`. Cada um tem motivo, está declarado nas divergências e está registrado na `techspec.md` (§3, §7c) e na `onda-3b.md` (parágrafo "Como ficou").

Aderência à Tech Spec: ok.
- O expurgo guarda o `concluido` por 7 dias e o `falhou` por 30. O `falhou` de `titular.*` fica, e a exceção está no SQL do lote, no mesmo índice.
- `job.falhos{tipo}` tem só o rótulo `tipo`, teto por tipo e `@SemEscopo` no repository do despachante.
- O alerta tem entrada no runbook e a linha de `job_registro` entrou no `docs/lgpd.md`.

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)").

Bloqueantes: nenhum.

Recomendações:
1. **44.1 marcada como feita, mas não foi.** A subtarefa está com `[x]` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/44_task.md:25`, e não houve commit de caracterização antes. A divergência (linha 89) cita a `onda-3b.md` "T5", mas o texto novo da `onda-3b.md` não fala disso. O motivo que vale de verdade é outro: o teste no HEAD já fixava "`falhou` com 8 dias sai" (o `vencidosRestantes` com `estado in ('concluido', 'falhou')` e o `inserir('falhou', '8 days', '7 days 1 hour')`). A `techspec.md:21` só pede caracterização para "comportamento sem teste", então a regra está cumprida. Falta corrigir o texto da divergência para apontar esse teste, ou acrescentar uma frase na `onda-3b.md`.
2. **O alerta pode ficar aceso por um mês sem motivo.** Uma falha de `sistema.*` que a rodada seguinte já resolveu mantém o alerta aceso por 30 dias, porque antes da 46.0 não há comando para tirar a linha. Isso acostuma o operador a ignorar o alerta. Vale um `TODO.md`, ou uma frase na 46.0, para rever o limiar ou a janela quando o descarte existir.
3. **Custo do expurgo se acumular muito `falhou`.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts:44-45`, cada lote relê, pelo `job_registro_finalizados_idx`, todos os `falhou` entre 7 e 30 dias e todos os de `titular.*`. O filtro de `tipo` é aplicado no heap, depois do índice. O comentário já admite isso. Depois de uma pane em massa (dezenas de milhares de `falhou`), as três instruções da noite relêem essas linhas a cada lote. Fica para o `infra-guardian` dizer se isso pede um caso de carga.
4. **Teste de carga monta a captura da consulta à mão.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/despachante/test/metricas-espera.int.test.ts:281-288`, o teste troca o `pool.query` à mão para capturar a instrução e rodar o `EXPLAIN` sobre ela. Se o projeto já tem um jeito de capturar a consulta (o caso de carga dos pendentes), vale extrair um helper comum em vez de manter uma segunda cópia.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-22 16:52:58 · `tasks/prd-reengenharia/44_task.md`

VEREDITO: REPROVADO

**Campos pessoais tocados:** nenhum campo novo. A tarefa muda a retenção de `job_registro` (id, `escola_id`, tipo, estado, datas, `codigo_falha` e `dados`, que só leva ids, como o id do pedido do titular). O índice parcial novo é sobre `tipo`. A métrica `job.falhos{tipo}` carrega só o tipo.

**Fora da tabela de dados do docs/lgpd.md:** nada. A linha de `job_registro` entrou em `docs/lgpd.md:101`. Conferi o que ela afirma no código:
- O `job.data` que vai ao BullMQ tem só `escolaId` e `requisicaoId`, e o esquema é `.strict()` (`packages/nucleo/src/fila/publicacao.ts:27`).
- A cópia `failed` no Redis fica 7 dias (`publicacao.ts:15`, `montagem.ts:184`).
- O erro que vai ao Redis é sempre o código tipado (`apps/worker/src/executor.ts:289-301`).

**Autorização por objeto:** não se aplica. A tarefa não tem endpoint. `medirFalhos` e o expurgo são `@SemEscopo`, com justificativa, e estão na lista fechada.

**Logs:** limpos. A série tem um rótulo só, `tipo`, e o teste confere (`Object.keys(atributos)).toEqual(['tipo'])`). O alerta mostra só `{{ $labels.tipo }}`. A consulta do "Primeiro olhar" no runbook exclui `dados` e manda usar o `sqlstate`, nunca a mensagem do Postgres.

**Auditoria:** não se aplica, porque não há exportação, nota nem permissão. O runbook proíbe apagar ou alterar a linha à mão até o caso de uso auditado da 46.0.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. São uuids de escola de bancada e `'{"pedidoId": "0190f5a0-…"}'`, sem nome nem conteúdo.

**Bloqueantes:**

1. **A coordenação lê "7 dias" para `job_registro` na tela de Retenção, e o prazo deixou de ser esse.**
   - **O que está errado:** em `packages/shared/src/privacidade/retencao.ts:97` continua `tarefa_em_segundo_plano: { descricao: 'Registro técnico das tarefas feitas em segundo plano, só com códigos', prazo: '7 dias' }`.
   - **Por onde chega à escola:** `classificacao.ts:80` liga `job_registro` a essa categoria. `apps/api/src/privacidade/privacidade.service.ts:110` envia o texto, e `apps/web/src/areas/coordenacao/Privacidade/Retencao.tsx:57` o mostra na tabela "Prazos que não mudam".
   - **Por que bloqueia:** com esta tarefa, o `falhou` fica 30 dias e o `falhou` de `titular.*` fica sem prazo, até a ação do operador. A escola é a controladora e responde ao titular e à ANPD pelo que o sistema diz que guarda. Um prazo declarado que o código não cumpre é dado tratado além do que se informou (regra 20, item 16; `docs/lgpd.md` diz uma coisa e a tela diz outra).
   - **Correção exigida:** atualizar `PRAZOS_FIXOS.tarefa_em_segundo_plano.prazo`, e a `descricao` se for preciso, com o que `docs/lgpd.md:101` diz, em linguagem comum. Por exemplo: "7 dias; a que falhou, 30 dias; a do pedido de acesso ou eliminação que falhou, até a equipe Turmma resolver".
   - **Teste exigido:** um teste que fique vermelho se o texto divergir de `RETENCAO_JOB_REGISTRO_DIAS`, de `RETENCAO_JOB_REGISTRO_FALHO_DIAS` ou da exceção de `titular.*`. Pode ficar no `nucleo`, que importa `@educa/shared` e as duas constantes, ou em `apps/api/test/retencao.int.test.ts`. O arquivo também entra na tabela de divergências e em "Mutações".

**Recomendações:**
- O `falhou` de `titular.*` fica sem prazo, e a ação que o encerra só chega na 46.0 (X6). Vale registrar no `TODO.md` um teto que siga o `pedido_titular` (contrato mais 5 anos), para a linha não durar mais que o pedido a que ela aponta. A linha só tem ids, então isso não bloqueia.
- Quando a 46.0 trouxer "descartar", o descarte de linha `titular.*` precisa de auditoria com autor e finalidade, porque é o fim do rastro de um pedido do art. 18. Convém anotar isso na tarefa 46.0 agora.
- **Pergunta de fechamento:** responde. `job_registro` não tem dado do titular além do id do pedido, e o pedido e a foto do compartilhamento já respondem por onde o dado passou. A exceção de `titular.*` melhora a resposta, porque mantém visível o pedido que não saiu.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 16:53:48 · `tasks/prd-reengenharia/44_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **Caminho feliz:** um `falhou` de 31 dias sai, o de 29 fica, e o `concluido` sai com 8 dias. A série `job.falhos{tipo}` sobe com cinco falhas de duas escolas.
- **Bordas:** o `falhou` de `titular.montar-arquivo` e o de `titular.eliminar` ficam depois dos 30 dias (inclusive com 400). O `concluido` de `titular.*` sai em 8 dias, porque a exceção não vale para todo estado. O `falhou` de 29 dias e 23 horas é o último que fica, e o de 30 dias e 1 hora sai. Um tipo que já foi expurgado some da exportação e não fica em zero. Sem nenhuma linha `falhou`, não há série. Quando a consulta dos falhos falha, só `job.falhos` sai da exportação e a espera continua medida.
- **Permissão:** o expurgo só roda pela rotina do sistema (teste que já existia, agora com o predicado novo). `medirFalhos` entra na lista fechada de `@SemEscopo`, com a justificativa "observabilidade local".
- **Isolamento:** a série leva só o rótulo `tipo`, sem `escola_id`, `dados` nem código da falha, e `job.falhos` fica fora de `METRICAS_COM_ESCOLA`. Isso está provado na unidade e na integração.
- **Carga e concorrência:** o lote continua de 5.000, com falhos e concluídos no mesmo lote. O plano desce pelo índice de finalizados. Com 5.000 falhos e 100.000 concluídos, a medição usa `job_registro_falhos_idx`, sem Seq Scan e sem o índice de finalizados, e para no teto de cada tipo. A reexecução (D49) com um worker morto e outra execução ao mesmo tempo continua coberta, agora sobre o predicado novo.

Cobertos: todas as 8 linhas da tabela têm o seu teste, citado pelo nome.
- Linha 1: `expurgo.int.test.ts › o concluído sai com 8 dias, e o falho fica até os 30…`
- Linhas 2 e 3: `› o falho de titular.* fica depois dos 30 dias…; o concluído de titular.* sai em 8 dias…`, que cobre os dois itens juntos.
- Linha 4: `› 12.000 vencidos saem em lotes de 5.000…` e `› o lote desce pelo índice parcial de finalizados…`
- Linha 5: `metricas-espera.int.test.ts › falhos: cinco falhas de um tipo, de duas escolas…`
- Linha 6: `› falhos: a série some com a linha que o expurgo apagou…`, que usa o `ExpurgoDeJobsRepository` real.
- Linha 7: `alerta-tem-runbook.test.ts`, com o arquivo e o título acrescentados (a divergência está declarada).
- Linha 8: `› carga: com 5.000 falhos de um tipo e 100.000 concluídos…`

Conferi as 14 mutações contra o `git diff`. Toda cláusula nova tem o seu bloco: os dois ramos do expurgo e a constante de 30 dias, os quatro `estado = 'falhou'` e o `tipo =` da `medirFalhos`, o `limit` do teto, o rótulo, o `catch` e a chamada em `medir()`, e `METRICAS_COM_ESCOLA`. Em todos, o cenário chega à cláusula: o `a.concluido` e o `sz.concluido` pegam a âncora e o salto de tipo, e o `sintetico` concluído e pendente pega o `estado` da contagem.

O índice novo ficou sem bloco e com motivo declarado. Isso é aceitável, porque `migrar.int.test.ts` confere o `WHERE (estado = 'falhou'::text)` no banco migrado e o `EXPLAIN` do caso de carga confere que a medição usa o índice. O alerta é conferido por `alertas.test.ts` (`for`, expressão e limiar exatos). Não há `.skip`, nem mock que esconda a regra, nem provedor de IA.

Rodei os dois arquivos de teste, todos verdes:
- `npx vitest run apps/despachante/src/metricas-espera.test.ts`: 15 de 15.
- `npx vitest run --project integracao apps/worker/test/expurgo.int.test.ts apps/despachante/test/metricas-espera.int.test.ts`: 16 de 16.

Bloqueantes: nenhum.

Recomendações:
1. `apps/despachante/src/metricas-espera.ts:209`: nenhum teste confere o aviso `despachante.medicao_indisponivel` quando a consulta dos falhos falha. Se o `this.#avisarFalha(erro)` for tirado do `catch`, nenhum teste fica vermelho. O mesmo vale para o de pendentes, que já era assim antes. Basta um caso na unidade que leia o log.
2. Nenhum teste liga a linha `falhou` que o executor grava de verdade (`execucao.int.test.ts › falha permanente…`) à medição e ao expurgo. Os dois testes semeiam a linha por SQL. Se o executor um dia gravar `falhou` sem `concluido_em`, o expurgo nunca a leva, e nenhum teste desta tarefa percebe.
3. `packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts`: os falhos de `titular.*` se acumulam na frente do índice de finalizados e são lidos e descartados a cada lote. Nenhum caso prova que, com milhares deles mais antigos que os concluídos vencidos, o lote continua de 5.000 dentro do `statement_timeout`. Hoje são poucos; é um caso para o `infra-guardian` pesar.
4. `tasks/prd-reengenharia/44_task.md:25`: a 44.1 está marcada `[x]` com o texto "num commit antes", e esse commit não existe. A divergência está declarada, mas vale ajustar o texto da subtarefa para não contradizer a tabela.
5. O caso de permissão que já existia em `metricas-espera.int.test.ts:122` poderia semear uma linha `falhou`, para que a lista fechada das métricas sem escola também cubra `job.falhos`. Hoje isso é provado em outro caso.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/44_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/worker/test/expurgo.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/despachante/test/metricas-espera.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/despachante/src/metricas-espera.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/fila/despacho.repository.ts

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-22 17:03:28 · `tasks/prd-reengenharia/44_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada da tarefa 44.0. Auditei só o diff entre as rodadas 1 e 2 e o que ele afeta.

**A correção exigida na 1ª rodada foi feita.**
- **O texto da tela foi corrigido.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/shared/src/privacidade/retencao.ts:97` o prazo agora é: `'7 dias; a que falhou, 30 dias; a do pedido de acesso ou de eliminação que falhou, até a equipe Turmma resolver'`. Bate com a linha de `job_registro` em `docs/lgpd.md` (7 dias para o concluído, 30 para o que falhou, e o `falhou` de `titular.*` até a ação do operador) e está em linguagem comum. Os únicos tipos de `titular.*` são `titular.montar-arquivo` e `titular.eliminar`, e "pedido de acesso ou de eliminação" descreve os dois.
- **O teste exigido existe.** É o `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/retencao/prazo-declarado-de-jobs.test.ts`. Ele monta a expressão regular a partir de `RETENCAO_JOB_REGISTRO_DIAS` e `RETENCAO_JOB_REGISTRO_FALHO_DIAS`, então mudar qualquer uma das duas constantes deixa o teste vermelho. A exceção de `titular.*` é conferida pelo texto literal. A exceção não é uma constante, ela vive no SQL do lote (`expurgo-de-jobs.repository.ts:45`), e o SQL já é provado por `expurgo.int.test.ts`. Os dois lados ficam cobertos.
- **O arquivo está registrado.** Ele aparece na tabela de divergências de `44_task.md` e nas duas mutações em "Mutações". A primeira troca 30 por 7 e derruba o primeiro caso; a segunda tira a exceção e derruba o segundo.

**O resto do diff está limpo.**
- **Aviso de log novo.** `despachante.medicao_indisponivel` (`apps/despachante/src/metricas-espera.ts:115`) passa o erro por `resumirErro`, que guarda só o tipo, o `sqlstate`/`constraint` e a pilha filtrada. A mensagem do Postgres não entra, então nenhum texto de linha vai para o log. O passo 5 novo do runbook manda procurar o aviso, não o texto da linha.
- **Teste de integração do despachante.** Usa escola sintética e o tipo `titular.eliminar`. Ele prova que `job.falhos` sai sem `escola_id`, como as outras métricas do processo.

Campos pessoais tocados: nenhum novo. Só o texto de retenção de `job_registro`, que guarda só ids.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: não se aplica (o diff não tem rota nova).
Logs: limpos.
Auditoria: não se aplica a este diff. O descarte de `titular.*` com auditoria fica para a 46.0 e está registrado no `TODO.md`.
Envio externo: nenhum.
Seed/fixture: sintético.

Bloqueantes: nenhum.

Recomendações:
- O texto da tela não cita a cópia `failed` que o BullMQ guarda no Redis por 7 dias. Ela fica dentro dos 30 dias do registro, então não diz menos do que o sistema guarda. Mas `docs/lgpd.md` a cita, e vale alinhar quando a 46.0 mexer nesse texto.
- O teto do `falhou` de `titular.*` atrelado ao `pedido_titular` e a auditoria do descarte já estão no `TODO.md`. Quando a 46.0 os fizer, o texto de `PRAZOS_FIXOS` e o segundo caso do teste precisam mudar junto.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-22 17:03:29 · `tasks/prd-reengenharia/44_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila
Rate limit: ok (a rodada não mexe em limite)
Fila e prioridade: ok
Concorrência: protegida (a rodada não traz escrita nova)
Índice e paginação: ok (a consulta e o índice de `job.falhos` não mudaram desde a 1ª rodada)
Degradação de IA: não se aplica
Migration: compatível (a `0038` não mudou desde a 1ª rodada)
Métrica e alerta: ok. Agora tem teste que prova o aviso `despachante.medicao_indisponivel` quando a consulta dos falhos falha (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/despachante/src/metricas-espera.test.ts`). O runbook ganhou o item 5 de "Job que falhou de vez", e o comando que ele traz usa os mesmos nomes de serviço das outras entradas (`despachante-1`, `despachante-2`). O teste de integração conta `job.falhos` entre as métricas sem `escola_id`.
Bloqueantes: nenhum. A 1ª rodada não exigiu correção. Auditei o diff entre `847d356` e `d2ed281`.
Recomendações:
- A série `job_falhos > 0` continua sendo contagem de linhas, então o alerta fica aceso 30 dias e falha nova do mesmo tipo não avisa de novo. O item está no `TODO.md`, ligado à 46.0 (X6). Esse comando que esvazia a série precisa chegar antes do piloto: até lá, o alerta aceso esconde falha nova do mesmo tipo.
- Medir o lote do expurgo depois de uma pane em massa, com milhares de `falhou` que ficam. Também está no `TODO.md`. Hoje o lote é pequeno, mas esse caso de carga cobre o pior momento.

Arquivos que pesaram nesta rodada:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/despachante/src/metricas-espera.ts` (linhas 205 a 212: o `catch` de `medirFalhos` chama `#avisarFalha`, que é o que a mutação nova tira)
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/despachante/test/metricas-espera.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/retencao/prazo-declarado-de-jobs.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/shared/src/privacidade/retencao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/docs/runbook.md` (linhas 106 a 109)

## llm-integrator · 2ª rodada · APROVADO · 2026-10-22 17:03:31 · `tasks/prd-reengenharia/44_task.md`

VEREDITO: APROVADO
Perfis usados: nenhum. A rodada 2 não adiciona nem altera chamada de modelo. O diff desde a rodada 1 toca só a retenção de `job_registro`, o texto de `PRAZOS_FIXOS`, o aviso de log da medição de falhos e o runbook. Não há SDK de provedor, prompt nem agente neste diff.
Custo estimado por professor/mês: R$ 0 de IA. A tarefa não faz chamada de modelo (0 chamadas por professor por mês).
Prompt versionado: não se aplica
Validação de schema: não se aplica
Aprovação humana no caminho: não se aplica. A linha `falhou` de `titular.*` continua sem descarte automático, e o descarte pelo operador fica para a 46.0, com auditoria registrada no `TODO.md`.
Bloqueantes: nenhum. A rodada 1 não exigiu correção, e o diff novo é a resposta ao veto do `privacy-guardian`:
- `packages/shared/src/privacidade/retencao.ts:97` agora diz os mesmos prazos que o expurgo cumpre: 7 dias, 30 dias para o que falhou, e até a equipe resolver no pedido de acesso ou de eliminação.
- `packages/nucleo/src/retencao/prazo-declarado-de-jobs.test.ts` liga o texto às constantes `RETENCAO_JOB_REGISTRO_DIAS` e `RETENCAO_JOB_REGISTRO_FALHO_DIAS`, e tem mutação declarada para cada asserção.
- `apps/despachante/src/metricas-espera.ts:209` chama `#avisarFalha` quando `medirFalhos` falha. O teste novo prova o aviso `despachante.medicao_indisponivel`, e a mutação que tira a chamada está declarada.

Recomendações:
- O runbook (item 5) manda o operador achar o aviso no log. O aviso leva só o erro resumido (`resumirErro`), então não vaza dado de pessoa. Mantenha assim.
- Eu só li o diff e conferi as constantes e a chamada de `#avisarFalha`; não rodei os testes.
- As pendências de 44.0 já estão no `TODO.md`: alerta aceso por 30 dias, lote do expurgo, teste entre executor e expurgo, e a retenção do tipo de job de IA em lote na 43.0. A da 43.0 é a única do meu escopo. Ao definir o job de IA em lote, a retenção precisa ser coerente com o limite de passos e de custo por execução, e o registro tem que guardar entrada, saída, modelo, tokens, custo e duração.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 17:03:58 · `tasks/prd-reengenharia/44_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O que conferi nesta rodada, a partir do diff entre a rodada 1 e a rodada 2:

- **Ordem do `privacy-guardian` (rodada 1).** Feita. O prazo que a tela de Retenção mostra agora diz o que o expurgo faz (`packages/shared/src/privacidade/retencao.ts:97`), e bate com a linha de `job_registro` em `docs/lgpd.md:101`. O teste novo `packages/nucleo/src/retencao/prazo-declarado-de-jobs.test.ts` liga esse texto às constantes do expurgo, e as duas mutações declaradas pegam a troca de 30 por 7 dias e a omissão do caso `titular.*`. Isso não invade escopo: o texto ficaria errado por causa desta tarefa, e a divergência está registrada em `44_task.md` e no `onda-3b.md`. Nenhum teste de tela usa o literal antigo "7 dias" desta linha; os "7 dias" que aparecem nos testes são de outras telas.
- **Falha da consulta dos falhos.** O aviso no log está coberto por teste (`apps/despachante/src/metricas-espera.test.ts:192`), com mutação que remove o `#avisarFalha` do caminho de `medirFalhos`. O passo 5 novo do runbook, "Job que falhou de vez", explica por que o alerta volta a normal sem a série e onde procurar o aviso. Os nomes de serviço citados ali (`despachante-1`, `despachante-2`) existem em `infra/compose.yml`.
- **Teste de integração.** `apps/despachante/test/metricas-espera.int.test.ts:124` agora espera `METRICAS.falhos` entre as métricas sem escola. A asserção que proíbe `escola_id` nas métricas sem escola continua valendo para ela.
- **44.1 sem commit de caracterização.** A justificativa nova se apoia na `techspec.md` §1, que só pede caracterização para comportamento sem teste. Confere: o `expurgo.int.test.ts` do HEAD já fixava o `falhou` de 8 dias saindo. Está registrada em `44_task.md` e no `onda-3b.md`.
- **Recomendações da rodada 1.** Todas têm destino em `TODO.md` ou motivo de recusa escrito. Não ficou nenhuma recomendação solta.

Recomendações:
- O teste `prazo-declarado-de-jobs.test.ts` usa âncoras rígidas (`^` e `$`) no texto em português. Qualquer ajuste de redação na tela vai quebrar o teste sem a regra ter mudado. Bastaria conferir os números (`RETENCAO_JOB_REGISTRO_DIAS` e `RETENCAO_JOB_REGISTRO_FALHO_DIAS`) e a menção ao pedido do titular, com `toContain`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 17:04:16 · `tasks/prd-reengenharia/44_task.md`

VEREDITO: APROVADO

**Cenários exigidos (2ª rodada, só o que mudou desde a 1ª):**
- A tela de Retenção da coordenação mostra prazos que batem com as constantes do expurgo: concluído em 7 dias e falhou em 30.
- O `falhou` de `titular.*` aparece declarado como "até a equipe resolver", sem prazo em dias.
- Quando a consulta dos falhos dá erro, o aviso `despachante.medicao_indisponivel` vai para o log. Sem ele, o alerta volta a normal sem a série e ninguém vê.
- A série `job.falhos` sai sem `escola_id`, também com uma linha `falhou` real no banco.

**Cobertos:**
- `packages/nucleo/src/retencao/prazo-declarado-de-jobs.test.ts › diz os dias que o expurgo cumpre…`: monta a regex a partir de `RETENCAO_JOB_REGISTRO_DIAS` e `RETENCAO_JOB_REGISTRO_FALHO_DIAS`. Se a constante mudar e o texto não, o teste fica vermelho. A mutação "a que falhou, 7 dias" também deixa vermelho.
- `… › diz que o pedido de acesso ou de eliminação que falhou fica até a equipe resolver`: a regex termina em `$`, então tirar a cláusula de `titular.*` deixa o teste vermelho.
- `apps/despachante/src/metricas-espera.test.ts › falhos: a consulta dos falhos que falha deixa o aviso…`: com `medirPendentes` devolvendo `[]` e `medir()` chamado direto, sem o laço, o único caminho que escreve o aviso é o `catch` de `medirFalhos` (`metricas-espera.ts:209`). A mutação que tira `this.#avisarFalha(erro)` deixa 0 linhas de log contra 1 esperada. O teste fica vermelho pelo motivo certo.
- `apps/despachante/test/metricas-espera.int.test.ts › permissão: …`: agora semeia um `falhou` de `titular.eliminar` e exige `METRICAS.falhos` no conjunto das métricas do processo, sem `escola_id`.
- As três mutações novas da seção "Mutações" batem com o `git diff` e cobrem as cláusulas novas: o texto do prazo, com duas cláusulas, e o aviso no `catch`.
- Rodei os três arquivos: 18 testes de unidade verdes em `prazo-declarado-de-jobs.test.ts` e `metricas-espera.test.ts`, e 8 de integração verdes em `metricas-espera.int.test.ts`. Nenhum teste da API (`apps/api/test/retencao.int.test.ts`) nem da web (`Privacidade.test.tsx`) cita o texto antigo "7 dias", então a troca do texto não quebra nada fora da tarefa.
- Não há `.skip`, teste comentado, mock que esconda a regra nem chamada a provedor de IA. Nada desta rodada pede teste de concorrência.

**Bloqueantes:** nenhum.

**Recomendações:**
- A entrada 5 do runbook (o alerta volta a normal quando a consulta falha) é texto e fica sem teste. Isso é aceitável, mas a guarda `alerta-tem-runbook` só confere o título e não o conteúdo dos passos.
- `prazo-declarado-de-jobs.test.ts:12` põe as constantes na regex sem escapar. Hoje funciona porque são números. Se um dia virarem texto, vale escapar.
- As recomendações da 1ª rodada (o teste que liga o executor à medição e ao expurgo, e o caso de carga do lote com muitos `falhou`) estão no `TODO.md` com destino. Não há nada novo a acrescentar.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/nucleo/src/retencao/prazo-declarado-de-jobs.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/packages/shared/src/privacidade/retencao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/despachante/src/metricas-espera.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/despachante/src/metricas-espera.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/despachante/test/metricas-espera.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/44_task.md
