# Achados das revisões — `tasks/prd-apresentacao-operacao/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-24 04:21:19 · `tasks/prd-apresentacao-operacao/9_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- C38, convite: convite usado, convite revogado e convite pendente vencido. Com 29 dias ficam, com 31 saem. O convite ainda válido fica.
- C38, sessão: sessão encerrada e sessão só expirada, 29 dias fica e 31 sai. O `coalesce` precisa usar primeiro o `encerrada_em`, e a sessão viva fica.
- C38, acesso: com 6 meses menos um dia fica, com mais um dia sai. Vale também para a falha de entrada sem operador.
- C38, o que nunca sai: `auditoria_operacao` de qualquer idade e `operador`, ativo ou desativado, mesmo sem mais nada que aponte para ele.
- C45, expurgo: só o repository do operador e o expurgo tocam as seis tabelas. A entrada da lista aponta para um arquivo que existe. O expurgo não cita `operador`, `codigo_recuperacao_operador` nem `auditoria_operacao`.
- `@SemEscopo`: o repository continua com dois métodos marcados, e a justificativa cobre as tabelas da equipe.
- Concorrência: dois expurgos em paralelo, e a soma das contagens bate com o que estava vencido.
- Prazo pelo relógio injetado, não pelo `now()` do banco. Idempotência (D49). Lote por lote, na ordem dos alvos. Log só com contagens, sem id, IP nem apelido. Uso dos índices de prazo.
- Permissão e isolamento: as tabelas da operação não têm escola. O isolamento aqui é o C45 (ninguém mais toca nelas). A permissão é o job recusado fora da rotina do sistema, que já existia e agora percorre também os três alvos novos.

Cobertos: todos.
- Convite (`apps/worker/test/expurgo-de-acesso.int.test.ts:369-382`): usado e revogado de 29 e 31 dias, pendente vencido há 29 e há 31 dias, e pendente válido.
- Sessão (`:358-379`): o caso "encerrada há 29 dias, expira há 45" fica, e o caso "encerrada há 30d1h, expira há 30d" sai. Esse par prova que o prazo conta do encerramento: se a instrução usasse só `expira_em`, o teste quebraria.
- Relógio injetado: as linhas "1 hora além do prazo" (`6 months 1 hour`, `30 days 1 hour`) só saem se o corte vier do `AGORA` injetado.
- O que nunca sai (`:508-524`): compara a linha inteira de operador e auditoria antes e depois de dois expurgos. Se a instrução apagasse ou alterasse qualquer uma delas, o teste quebraria.
- Arquitetura (`apps/api/test/arquitetura.test.ts:131-156`): confere a existência do arquivo, as tabelas citadas pelo expurgo, os alvos, os dois `@SemEscopo` e o texto da justificativa. Tem também um teste da própria checagem, com as três tabelas proibidas.
- Concorrência (`:478-506`): é paralela de verdade, com `Promise.all` e lote de 1.
- Idempotência, lotes, falha definitiva e índices foram estendidos aos três alvos novos.
- Conferi o runbook: o evento `operacao.desafio_sem_redis`, o 503 `INDISPONIVEL_TENTE_DE_NOVO` e os sete comandos `ops:*` citados existem no código e no `package.json`.
- Não há `.skip`, não há mock do repository nem do banco, e não há IA envolvida.
- A limpeza dos operadores com prefixo `expurgo-` não interfere em outras suítes, porque a integração roda com `fileParallelism: false`.

Bloqueantes: nenhum.

Recomendações:
1. `apps/worker/test/expurgo-de-acesso.int.test.ts:492`: o comentário diz que o `skip locked` "é o que impede a mesma linha nas duas". Isso não é verdade: sem `skip locked`, o Postgres também não apaga a mesma linha duas vezes. O segundo `delete` espera o lock e, depois do commit do primeiro, conta 0. Ou seja, o teste prova a invariante (cada linha sai uma vez, a soma bate), mas não prova o `skip locked`. Vale corrigir o comentário, ou acrescentar uma asserção de que a segunda execução não fica bloqueada, por exemplo com `lock_timeout` curto na conexão.
2. `apps/worker/test/expurgo-de-acesso.int.test.ts:452-454`: as chaves novas do `acesso.expurgado` só são conferidas com `expect.any(Number)`. Se a desestruturação em `apps/worker/src/processadores/expurgar-acesso.ts:188-195` trocasse duas contagens entre si, nenhum teste pegaria. Basta comparar cada total com `semeado.sai[alvo].length`, ou com a contagem de vencidas antes da execução.
3. O teste de concorrência roda o `apagarLoteVencido` em paralelo, mas não o job inteiro, ou seja, não roda duas vezes o `criarExpurgoDeAcesso`. A duplicação do job pela fila já é coberta pelos testes de D49 do F1. Um caso com dois `expurgar()` em `Promise.all`, conferindo o `conferir()` no fim, fecharia o cenário "job executado duas vezes" também para as tabelas da operação.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/9_task.md`

## test-engineer · 2ª rodada · APROVADO · 2026-09-24 04:51:11 · `tasks/prd-apresentacao-operacao/9_task.md`

VEREDITO: APROVADO

Cenários exigidos: nesta rodada, as duas recomendações da 1ª rodada que você aplicou, mais o que o diff atinge. Não reauditei o que não mudou.
1. O comentário do teste de concorrência da operação diz o que o teste mede de fato.
2. Cada chave da linha `acesso.expurgado` recebe a contagem da sua própria tabela, e não a de outra.
3. A recomendação 3 (concorrência de verdade, com `Promise.all`, e `conferir()` passando pelos seis alvos) já estava coberta.

Cobertos:
- Recomendação 1: o comentário em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:438-439` agora corresponde ao que as asserções provam. As linhas 449-450 conferem que a soma das duas execuções é igual ao que havia vencido e que não sobra linha vencida. O comentário deixa claro que o `skip locked` não é medido ali.
- Recomendação 2: o teste novo em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:375-394` é um teste de verdade, porque falharia se a regra fosse removida:
  - Cada alvo recebe um valor diferente (11 a 16) e a conta recebe 7. Todos ficam abaixo do lote padrão (`LOTE_DO_EXPURGO`), então cada laço roda uma vez só e a contagem que chega ao log é exatamente o valor injetado.
  - Se duas chaves do log forem trocadas no desestruturar de `apps/worker/src/processadores/expurgar-acesso.ts`, o `toMatchObject` falha.
  - O `[0]` do `doEvento` é seguro: o `beforeEach` zera `log.linhas` na linha 345.
  - O dublê é só do repositório. Isso é legítimo aqui, porque o que se testa é o mapeamento no processador. A regra do banco continua provada pelos testes de integração com Postgres real.

Bloqueantes: nenhum.

Recomendações:
- O teste novo passa `contextoAtual().rotinaDoSistema = true` sem comentário. Uma linha dizendo que sem isso o processador lança `FalhaDeJob` evitaria que alguém removesse o contexto achando que é enfeite.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-24 04:51:56 · `tasks/prd-apresentacao-operacao/9_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** a tarefa não cria tabela nem migration. O expurgo passa a apagar `acesso_operacao`, `sessao_operador` e `convite_operador`. As três são tabelas da equipe Turmma, sem `escolaId`, e ficam fora do modelo de tenant pelo critério do C45. Nenhuma tabela de escola mudou de escopo.

**Queries verificadas:** três queries novas no `APAGAR_LOTE`, em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:73-101`.
- Elas apagam só pelo prazo e devolvem só a quantidade, nunca linha.
- Ficam sob o `@SemEscopo` que já existia em `apagarLoteVencido`, e a justificativa foi reescrita para cobrir as tabelas da operação (9.2).
- O repository continua com dois métodos marcados; não surgiu um terceiro.
- Nenhuma dessas queries toca `operador`, `codigo_recuperacao_operador` nem `auditoria_operacao`.
- As queries das escolas (`registro_acesso`, `sessao`, `convite`) não mudaram.
- A tarefa não cria endpoint, nenhum `escolaId` vem de corpo ou de query string, e a camada rede não é tocada.

**Teste de isolamento:** presente e efetivo.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts:154-179`, a lista de quem pode tocar as tabelas da operação tem dois arquivos, e o teste confere que os dois existem. Qualquer terceiro arquivo que tocar essas tabelas quebra o teste.
- O expurgo só pode citar as três tabelas expurgáveis. O teste negativo mostra que a checagem acusa uma instrução contra `operador`, `codigo_recuperacao_operador` ou `auditoria_operacao`.
- O número de métodos `@SemEscopo` está fixado em dois.
- No teste de integração, o retrato da linha inteira de `operador` e de `auditoria_operacao` antes e depois de dois expurgos quebra se o expurgo alcançar essas tabelas.

**Bloqueantes:** nenhum.

**Recomendações:**
- O teste de arquitetura confere a justificativa do `@SemEscopo` com uma regex que pega só um trecho do texto (`/operação Turmma.*não têm escola/`). Se o texto mudar um pouco, o teste falha. Isso não afeta o isolamento.
- `ALVOS_DA_OPERACAO` está escrito à mão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:144`. Pode derivar de `ALVOS_DO_EXPURGO_DE_ACESSO`, e os dois não divergem.
- A tarefa manda o teste do C45 para `apps/api/test/operacao/arquitetura.test.ts`, mas ele está em `apps/api/test/arquitetura.test.ts`. A divergência está registrada na própria tarefa. Vale corrigir no texto da Tech Spec ou no `/retro`, para a próxima tarefa não procurar no lugar errado.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-24 04:51:57 · `tasks/prd-apresentacao-operacao/9_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila (a tarefa estende o job de lote `sistema.expurgar-acesso`; login, tutor, sala, prova, IA e migration não mudam)
Rate limit: ok (a tarefa não cria rota nem limite)
Fila e prioridade: ok. O job continua na fila de lote, passa pela janela fora do horário letivo e percorre uma tabela por vez. Cada lote tem 5.000 linhas e é uma transação curta com `for update skip locked`, então não segura trava na `sessao_operador`, que o painel lê.
Concorrência: protegida. `delete ... where id = any(array(select ... for update skip locked))` nas três tabelas novas. O teste com dois expurgos em `Promise.all` e lote de 1 mostra que a soma das contagens bate com o que estava vencido e que nenhuma linha sai duas vezes (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:407`).
Índice e paginação: ok. `acesso_operacao_em_idx` e `sessao_operador_fim_idx` (índice sobre `coalesce(encerrada_em, expira_em)`) casam com as instruções. O teste roda `EXPLAIN` com `enable_seqscan = off` e confirma que o plano usa esses índices. A `convite_operador` fica sem índice próprio; como tem só dezenas de linhas, não é problema.
Degradação de IA: não se aplica
Migration: não se aplica (a tarefa não cria migration; os índices vêm da `0014_operador.sql`)
Métrica e alerta: ok. A linha `acesso.expurgado` ganhou as três contagens novas, só números, sem id nem IP. A tarefa não cria alerta. O runbook agora diz que o job parado também deixa passar do prazo o acesso, a sessão e o convite da operação, e ganhou a entrada "Operador não entra no painel da operação (Redis de fila fora)", que manda usar os comandos `ops:*`.
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`, `APAGAR_LOTE.convite_operador`: o lote não tem `order by`, ao contrário dos outros alvos. O resultado é o mesmo, porque o critério é só o prazo. Mesmo assim, uma linha de comentário explicando a diferença evitaria que alguém a "corrija" copiando o padrão sem índice.
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, entrada nova: o sinal do problema é a linha `operacao.desafio_sem_redis` no log, que aparece no máximo uma vez a cada 30 s e não tem alerta. Vale registrar no `/retro` se o painel de saúde deve mostrar o Redis de fila fora antes de o operador tentar entrar, já que quem opera é uma pessoa só.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-24 04:51:58 · `tasks/prd-apresentacao-operacao/9_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A tarefa só apaga, pelo prazo, três tabelas da equipe Turmma que já existiam: `convite_operador`, `sessao_operador` e `acesso_operacao`. Esta última guarda IP e data. Nenhum dado de aluno é tocado.

Fora da tabela de dados do docs/lgpd.md: nada. Os três prazos do código batem com `docs/lgpd.md`:
- linha 77, convite: 30 dias depois de usar, revogar ou vencer. O código usa `least(usado_em, revogado_em, expira_em)`.
- linha 78, sessão: 30 dias depois de encerrar ou, sem encerramento, de expirar. O código usa `coalesce(encerrada_em, expira_em)`.
- linha 79, acesso: 6 meses.

As duas linhas que ficam fora do expurgo também foram respeitadas. A auditoria da operação (linha 80, vigência + 5 anos) e a conta do operador (linha 76, que perde o dado pessoal no `desativar`) não são alvo, e isso tem três provas: a lista `ALVOS_DO_EXPURGO_DE_ACESSO`, o teste de arquitetura com `EXPURGAVEIS_DA_OPERACAO` e o teste de integração "o que nunca sai", que compara a linha inteira antes e depois.

Autorização por objeto: ok. Não há rota nova. O `apagarLoteVencido` continua `@SemEscopo`, com a justificativa reescrita para as tabelas sem escola, e o repository segue com só dois métodos marcados, o que o teste de arquitetura confere.

Logs: limpos. A linha `acesso.expurgado` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts:63-73` leva só contagens, uma chave fixa por tabela. O teste confere que o log não tem id de linha apagada, id de operador, IP nem o prefixo do apelido, e que cada contagem é a da sua tabela.

Auditoria: presente onde a regra exige. Esta tarefa não faz nenhuma ação da regra 20, item 10. O expurgo por prazo segue o mesmo padrão do expurgo de acesso das escolas (tarefa 17.0), e a auditoria da operação fica de fora por construção.

Envio externo: nenhum.

Seed/fixture: sintético. Operador "Pessoa Sintética da Operação", e-mail em `@turmma.invalid`, IP `198.51.100.9` (faixa reservada para documentação), e limpeza pelo prefixo `expurgo-` no `beforeAll` e no `afterEach`.

Pergunta de fechamento: a tarefa não muda nada do que se guarda sobre aluno nem para onde vai. As tabelas tocadas são da equipe, e o expurgo delas só cumpre a retenção declarada.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:525` diz que o log `operacao.desafio_sem_redis` vai "sem nada da pessoa". Isso vem da tarefa 7.0 e não mudou aqui. Vale um teste que confira esse conteúdo, como o achado da 8.0 pediu para `operacao.reuso_de_refresh`.
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/9_task.md`, tabela "Arquivos previstos": ainda aponta para `apps/api/test/operacao/arquitetura.test.ts`, que não existe. A divergência está registrada, mas o caminho na tabela pode ser corrigido para `apps/api/test/arquitetura.test.ts`.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-24 04:52:04 · `tasks/prd-apresentacao-operacao/9_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (a conferência respondeu "portão local válido para o código atual (typecheck, lint, test, infra)")
Bloqueantes: nenhum

**Escopo e Tech Spec.** Os três alvos novos têm os prazos da seção 7, linha "Retenção", e das linhas 77 a 79 de `docs/lgpd.md`: convite 30 dias, sessão 30 dias e acesso 6 meses. Eles entram pelo `apagarLoteVencido` que já existia, sem método `@SemEscopo` novo. O repositório continua com dois métodos marcados, e o teste de arquitetura confere isso. A `auditoria_operacao` e o `operador` ficam fora do expurgo, e o teste do C45 também prova que o arquivo do expurgo não cita essas tabelas. Os índices de prazo `sessao_operador_fim_idx` e `acesso_operacao_em_idx` existem no schema e batem com a expressão de cada lote. As divergências estão registradas no documento da tarefa e não mudam a arquitetura. O teste de arquitetura foi para o arquivo onde o C45 já morava, e o job passou a percorrer `ALVOS_DO_EXPURGO_DE_ACESSO`.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts:53`: o `{} as Record<AlvoDoExpurgoDeAcesso, number>` esconde do compilador um alvo que ficasse sem total. Montar o objeto com `Object.fromEntries` sobre os alvos, ou com um laço tipado que devolve o registro completo, tira a necessidade de afirmar o tipo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts:17-22`: a docstring tem uma quebra de linha no meio da frase ("um lote de 5.000 por / instrução") e uma linha longa demais. Além disso, o "5.000" repete em texto o valor de `LOTE_DO_EXPURGO`, e o comentário fica errado quando a constante mudar.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:73-101`: os lotes de `acesso_operacao`, `sessao_operador` e `convite_operador` repetem os da escola e só trocam o nome da tabela. Uma função por tipo de prazo, que recebe a tabela, deixaria as duas versões sem risco de divergir. Isso não bloqueia: a repetição é explícita e os testes cobrem os seis alvos.
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`: a entrada nova traz a lista `ops:*` inline e manda ao README, "Rodando local". Quando surgir um comando `ops:` novo, esta lista fica velha. Mandar só ao README evita isso.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/9_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`
