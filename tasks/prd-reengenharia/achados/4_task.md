# Achados das revisões — `tasks/prd-reengenharia/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-21 20:22:55 · `tasks/prd-reengenharia/4_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** nenhuma tabela nova e nenhuma migration. A tarefa só lê tabelas que já existiam: `atividade_aplicada`, `artefato`, `mensagem_tutor`, `execucao_agente` e `consumo_ia`.

**Queries verificadas:**
- `TutorDoAlunoRepository.avaliativaAberta`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/tutor/tutor.repository.ts:213-223`. Filtra por `escolaId` e `anoLetivoId` tirados de `#aluno()`, que vem do contexto autenticado (`exigirEscolaDoContexto`, `exigirAnoEmCurso`, `sessaoDaRequisicao`), e pela `turmaId`. A query já existia e é usada nas duas conferências novas.
- Chamada em `entrada()`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/tutor/tutor.service.ts:210`. A `turmaId` vem de `agora.turma.turmaId`, o alcance conferido de novo a partir do token.
- Chamada em `aoConcluir`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/tutor/tutor.service.ts:228`. A `turmaId` vem de `lido.pergunta.turmaId`, a pergunta gravada e lida com escopo pelo aluno. O repository é montado sobre `tx` com o mesmo contexto que o `#gravarTurno` já usava.
- Nenhum endpoint novo. Nenhum `escolaId` ou `turmaId` chega do corpo ou da query para decidir o que ler.
- Nenhum `@SemEscopo()`. Nenhuma consulta da camada rede.
- A ordem não revela nada. `NAO_ENCONTRADO` vem antes da pausa (`tutor.service.ts:207` e `:210`), então o aluno transferido não fica sabendo que a outra turma está em prova. Há caso que prova isso: "transferido para uma turma em prova".

**Teste de isolamento:** presente e efetivo para a parte que esta tarefa acrescenta.
- O caso "a avaliação de outra turma da escola abre no meio", em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/tutor/tutor.int.test.ts`, quebra se a cláusula `turmaId` sair de `avaliativaAberta`. A tarefa declara essa mutação.
- A cláusula `escolaId` já existia e não tem caso próprio nesta janela. Isso não abre vazamento: a `turmaId` comparada sai de leitura com escopo e é UUID. Também há a FK composta citada na tarefa, que não abri para conferir.

**Bloqueantes:** nenhum.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/tutor/tutor.int.test.ts`: falta um caso com uma avaliação aberta na escola B durante a janela, para que a mutação "tirar `escolaId` de `avaliativaAberta`" também tenha teste nomeado. É defesa em profundidade, não brecha atual.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-21 20:23:10 · `tasks/prd-reengenharia/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

O que conferi:

- **Primeira conferência.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/tutor/tutor.service.ts:210`, `entrada()` confere a avaliação aberta logo depois da conferência de turma (`:207`) e antes de trechos, memória e turnos. A ordem é a da `onda-0.md` §2.4: o aluno transferido sai como `NAO_ENCONTRADO` antes de ser tratado como pausa.
- **Segunda conferência.** Em `:228`, `aoConcluir` repete a conferência dentro da transação que grava a resposta, antes de `exigirCitacoesEntregues`. A saída `assunto_delicado` passa mesmo com a avaliação aberta, como pede a `techspec.md` §7b.
- **Falha da execução.** A execução falha pelo `marcarFalhou` do executor (`packages/nucleo/src/ia/executor.ts`), como a spec descreve.
- **Fora do escopo, respeitado.** As duas conferências não foram levadas para o Command (fica na 42.0) e nenhuma tela mudou.
- **Isolamento.** `avaliativaAberta` (`tutor.repository.ts:213-223`) pega a escola e o ano do contexto, e filtra por turma.
- **Testes.** Os cenários da tabela da tarefa estão cobertos em `tutor.int.test.ts` e `tutor-modelo.int.test.ts`. A web já tratava esse código como pausa: `tutor.test.ts:85` e `:104` provam isso, e a mutação de `pausaDoErro` está declarada.
- **Divergências.** A tarefa diz "nenhuma", e confere com a `onda-0.md` §2.4 e o §3 (linhas RF3).

Recomendações:

1. **Funções repetidas nos testes.** `execucaoLida`, `pausada` e `consumoDaExecucao` aparecem com quase o mesmo corpo nos dois arquivos de teste (`tutor.int.test.ts` e `tutor-modelo.int.test.ts`). Dá para levar para `apps/api/test/escola-com-tutor.ts`, que já é compartilhado.
2. **Comentário do início do serviço.** O comentário de `TutorService` (`tutor.service.ts:119-120`) diz que tudo é conferido "antes de a pergunta ser aceita". O item 3 agora descreve também as duas conferências que rodam depois do `202`. Vale ajustar a frase de abertura, para não contradizer o item.
3. **Teste de concorrência com dois alunos.** O cenário pede "N alunos" e o teste usa dois. Prova a regra, mas o nome do caso poderia dizer que dois bastam para segurar duas vagas ao mesmo tempo.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-21 20:23:11 · `tasks/prd-reengenharia/4_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. O diff só mexe no turno do Tutor (`tutor.service.ts`, `entrada` e `aoConcluir`) e nos testes dele. Todos com autor humano? sim, porque esta tarefa não abre caminho novo.

Decisão autônoma sobre aluno: ausente. A conferência nova só impede o Tutor de responder durante uma prova aberta. Não decide nada sobre a trajetória do aluno.

Aprovação registrada: ok. A resposta do Tutor continua sendo a única exceção da D47, e o diff não a estende a outro agente. A mudança só tira saída de IA do caminho do aluno: a resposta do modelo é descartada quando a prova abre no meio do turno.

Supervisão do tutor: ok.
- A trava vale no servidor nas duas janelas: em `apps/api/src/tutor/tutor.service.ts:210`, antes de buscar trechos, ler a memória e chamar o modelo; e em `:228-230`, dentro da transação que grava a resposta. É o que pede a regra 30, item 10.
- O encaminhamento da D36 continua. A frase que o servidor reconhece como assunto delicado é tratada no `POST`, antes de tudo (`:168`). Quando é o modelo que classifica `assunto_delicado`, a exceção no `aoConcluir` grava a mensagem fixa e o sinal `atencao_humana` sem referência, o que o teste de `tutor-modelo.int.test.ts` prova.
- Nada de vigilância nova: o turno pausado não cria sinal, não grava o texto da pergunta fora de `mensagem_tutor` (o teste `ondeVazou` confere sinal, execução, consumo e auditoria) e não acrescenta nenhuma medição sobre o aluno.

Autonomia declarada e visível: sim, sem mudança. O diff não mexe em nível de autonomia nem na tela do coordenador.

Bloqueantes: nenhum.

Os testes provam a regra e cada mutação declarada derruba um deles:
- tirar a conferência do `entrada`;
- movê-la para depois de `#trechosDoTurno`;
- inverter a ordem com a conferência de turma;
- tirar a `turmaId` de `avaliativaAberta`;
- tirar a conferência do `aoConcluir`;
- tirar a exceção da D36;
- logar a pergunta.

O cenário de dois alunos parados ao mesmo tempo e o reenvio com a mesma chave também estão cobertos.

Recomendações:
1. O texto diz que a pergunta pausada fica "no registro que o professor vê", e isso não bate com o código. Está em `tasks/prd-reengenharia/onda-0.md` §2.4 e no comentário de `tutor.service.ts:209` e `:131`. A supervisão (`apps/api/src/tutor/supervisao.repository.ts:240`, `:288` e `:307`) deixa de fora toda pergunta cuja execução terminou `falhou`, e o professor nunca vê o texto da conversa. A pergunta fica guardada em `mensagem_tutor`, mas não aparece para ele, o que é coerente com a regra 70, item 7, porque nenhuma saída de IA chegou ao aluno. Sugiro corrigir o texto para "fica só em `mensagem_tutor`, fora da contagem e da última troca", para que ninguém leia aí uma promessa de supervisão que o código não cumpre.
2. Fica um caso sem cobertura, aceito pela spec: na primeira janela, uma pergunta sobre assunto delicado que a lista de frases do servidor não reconhece, e que só o modelo classificaria, é pausada sem a mensagem fixa. É o mesmo comportamento de mandar essa pergunta com a prova já aberta, que hoje responde 409. Vale registrar isso como risco que sobra em `docs/aia/tutor.md` quando a onda fechar, junto com a medida que a spec já atribui ao Arquiteto (onda-0 §4).
3. A conferência do `aoConcluir` lê e depois grava, sem trava. Se a prova for confirmada logo depois dessa leitura, uma resposta ainda passa. A spec aceita essa janela, e quem decide se basta é o `infra-guardian`. Pela regra 70 não bloqueia, porque a janela é de milissegundos e a resposta continua supervisionada.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-21 20:23:23 · `tasks/prd-reengenharia/4_task.md`

```
VEREDITO: APROVADO
Caminho quente tocado: tutor | IA
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: ok
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- apps/api/src/tutor/tutor.int.test.ts:559: o nome do caso diz "parados na vez de rodar (o teto de execuções por escola)", mas quem segura as duas execuções é o GatilhoDeParada no update para `rodando`, e não o teto de vagas. Troque o nome para "parados ao entrar em `rodando`", para ninguém ler o caso como prova do limite por escola.
- apps/api/src/tutor/tutor.service.ts:228: a conferência no `aoConcluir` lê e grava em READ COMMITTED. Uma avaliação que fecha a transação logo depois dessa leitura ainda deixa uma resposta passar. A tarefa pediu ao infra-guardian que dissesse se isso basta, e basta. O resultado equivale à ordem serial "a resposta grava antes de a prova abrir": nenhuma das duas transações lê o que a outra escreve. Não precisa de trava. Registre esse motivo no comentário da linha, para a 42.0 não reabrir a discussão quando levar a conferência para o Command.
- Hoje a pausa aparece só no log `ia.execucao.falhou` com `codigo=TUTOR_PAUSADO_EM_AVALIACAO`, e nenhum alerta conta falha de execução. Quando a `job.falhos{tipo}` e o alerta "Provedor de IA fora" chegarem (47.0, 49.0), tirem esse código da contagem de falha. Senão, toda prova que abre com turnos em andamento entra como erro de provedor.
```

Pontos conferidos que sustentam o veredito:
- **Índice.** As duas leituras novas (`tutor.service.ts:210` e `:228`) chamam o `avaliativaAberta` de `apps/api/src/tutor/tutor.repository.ts:213`. Ele consulta `atividade_aplicada` com escola, turma e ordem por id. O índice `atividade_aplicada_turma_idx` (`escola_id`, `turma_id`, `id`), de `packages/nucleo/drizzle/0022_mvp_apresentacao.sql:423`, cobre essa consulta. A tabela cresce com a turma, não com o aluno.
- **Custo da conferência.** A primeira acontece antes da busca de trechos e da chamada ao modelo, então a pausa não gasta vaga de provedor. A segunda corre dentro da transação de conclusão. A chamada que o modelo já respondeu continua registrada em `consumo_ia`, e a troca não conta.
- **Sem erro cru ao aluno.** A falha grava o código do catálogo pelo `codigoDaFalha` (`packages/nucleo/src/ia/executor.ts:82`), e a web já mostra esse código como a pausa `avaliacao`.
- **Testes.** Nenhum teste chama provedor pago: usam o modelo de mentira e um spy na `BuscaDeTrechos`. A concorrência tem caso com `Promise.all`, as duas janelas têm barreira de banco e o reenvio idempotente está afirmado.
- **Carga.** O cenário de carga do Tutor é da 47.0 (techspec §7c). Esta tarefa não precisava atualizá-lo.

## test-engineer · 1ª rodada · APROVADO · 2026-10-21 20:24:12 · `tasks/prd-reengenharia/4_task.md`

**VEREDITO: APROVADO**

**Cenários exigidos** (RF3/S12, `onda-0.md` §2.4 e §3, e a tabela da 4.0):
- **Primeira janela, a prova abre entre o 202 e a execução.** A execução fica `falhou` com `TUTOR_PAUSADO_EM_AVALIACAO` e `resultado` nulo. Não sai mensagem do Tutor nem sinal, e a pergunta fica em `mensagem_tutor`. A troca não conta. O modelo não é chamado e a busca de trechos também não.
- **Transferido** para uma turma em prova nessa janela: a execução falha com `NAO_ENCONTRADO`, e não como pausa.
- **Prova de outra turma da escola** abre no meio: o turno conclui.
- **Segunda janela, a prova abre entre a execução e a conclusão.** A execução fica `falhou`, sem mensagem, sem sinal (nem `resposta_pronta`) e sem troca. O `consumo_ia` da chamada fica, e o teste afirma isso.
- **Exceção da D36:** o modelo classifica `assunto_delicado` e a prova abre antes da conclusão. Ficam a mensagem fixa e o `atencao_humana`, a execução fica `concluida` e a troca conta.
- **Concorrência:** N alunos enviam em `Promise.all`, as execuções param em `rodando` e a prova abre. Todas falham e nenhuma troca conta.
- **Reenvio com a mesma chave** depois da pausa.
- **Web:** a execução `falhou` com o código aparece como a pausa `avaliacao`.
- **Log e vazamento:** a pergunta pausada não sai de `mensagem_tutor`.

**Cobertos:** todas as linhas da tabela têm teste, citado pelo nome.
- Em `apps/api/src/tutor/tutor.int.test.ts`:
  - "abre entre o 202 e a execução: a execução falha com o código da pausa…" cobre o estado, a busca (espião no singleton `BuscaDeTrechos`), o consumo zero, a pergunta só com `autor: aluno`, os sinais, `uso.hoje` e `trocasHoje`, o `ondeVazou` e o reenvio.
  - "transferido para uma turma em prova…"
  - "a avaliação de outra turma da escola abre no meio…"
  - "dois alunos parados na vez de rodar…"
- Em `apps/api/src/tutor/tutor-modelo.int.test.ts`:
  - "abre entre o 202 e a execução: o modelo nem chega a ser chamado"
  - "abre entre a execução e a conclusão…"
  - "abre antes da conclusão e o modelo classificou assunto delicado…"
- Na web, a caracterização fica com `apps/web/src/areas/aluno/tutor.test.ts:85` e `:104`.

As três cláusulas novas do diff têm bloco de mutação (`tutor.service.ts:210` e `:228-230`). Também têm bloco o `throw` da primeira conferência, a ordem diante do `NAO_ENCONTRADO`, o escopo por `turmaId` do `avaliativaAberta`, a exceção da D36 e o caminho de log. Conferi cada bloco contra o cenário, e cada um fica vermelho pelo motivo certo:
- **Conferência tirada do `entrada()`:** o `aoConcluir` ainda pausaria a execução. O vermelho vem do consumo, que passa de 0 para 1, e do espião da busca, que é exatamente a regra da primeira janela.
- **Conferência movida para depois de `#trechosDoTurno`:** só a asserção do espião cai, e é o que a linha da tabela quer provar.
- **Mutação de log:** o `resumirErro` do executor (`packages/nucleo/src/ia/executor.ts:203`) leva o `name` para o log. O `codigo` gravado não muda, então quem pega é o `ondeVazou`.
- **Exceção da D36 tirada:** o caso de assunto delicado fica vermelho.

Rodei os sete casos novos contra o Postgres do container (`-t "a avaliação abre depois do 202"`) e passaram. Não há `.skip` nem mock de coisa nossa: o `vi.spyOn` só observa a busca e não a substitui. O modelo é o de mentira, sem provedor pago.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Segunda janela sem duas asserções.** O caso "abre entre a execução e a conclusão" em `tutor-modelo.int.test.ts` não afirma que a pergunta continua em `mensagem_tutor` só com `autor: aluno`, o que o §2.4 pede para as duas janelas. Também não procura a marca fora de `mensagem_tutor`, e o `throw` do `aoConcluir` é um caminho novo até o log do executor. Vale acrescentar as duas asserções.
2. **Web citada com linhas diferentes.** A tabela cita `tutor.test.ts:104` ("a pausa que a última pergunta recebeu…"), mas o bloco de mutação de `pausaDoErro` cita "a recusa do servidor" (`:85`). Os dois ficam vermelhos com a mutação; o melhor é usar a mesma citação nos dois lugares.
3. **Nome do teste de concorrência.** O nome diz "parados na vez de rodar (o teto de execuções por escola)", mas os dois alunos chegam ao `update` para `rodando` e param no gatilho, sem fila de teto. Vale um nome que descreva o que o teste monta.
4. **Ponto de produto, não de teste, para o `conformidade-reviewer` olhar.** A exceção da D36 só existe no `aoConcluir`. Uma pergunta delicada que o filtro de palavras não pegou, e cuja prova abre antes do `entrada()`, é pausada sem encaminhamento, porque o modelo nunca chega a classificar. A spec aceita isso (§2.4), mas o caso não aparece escrito em lugar nenhum.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-21 20:30:55 · `tasks/prd-reengenharia/4_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)

Bloqueantes: nenhum

Desde a rodada 1 mudaram só comentários, o nome de um caso, uma asserção a mais e documentação. O código não mudou. As duas recomendações minhas foram aplicadas:
- O comentário do `TutorService` agora diz que o item 3 se repete depois do `202`.
- O caso de concorrência foi renomeado para "dois alunos parados ao entrar em `rodando`…".

As outras recomendações da rodada 1 estão na tabela "Recomendações sem aplicar", cada uma com destino. As que vão para o `TODO.md` já estão escritas lá, nas quatro linhas novas do fim. A recusa da mutação de `escolaId` traz o motivo (a FK composta torna a mutação equivalente), e esse motivo não é "anularia as aprovações". Os dois blocos `mutacao` do `aoConcluir` acompanham as duas linhas novas de comentário, e o carimbo valida a árvore atual.

A asserção nova em `tutor-modelo.int.test.ts` procura uma marca única no texto da pergunta em `sinal_tutor`, `execucao_agente`, `consumo_ia`, `auditoria` e no log. Com isso, a janela do `aoConcluir` passa a ter a mesma prova de não vazamento que a janela do `entrada()` já tinha.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/tutor/tutor.int.test.ts:514`: o comentário "A pergunta continua no registro que o professor vê" repete a frase do `onda-0.md` §2.4. O próprio documento da tarefa e o `TODO.md` dizem que essa frase está errada: a pergunta fica fora da supervisão (`supervisao.repository.ts`). Trocar para "fica só em `mensagem_tutor`, sem resposta", que é o texto do comentário do `tutor.service.ts`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/4_task.md:220`: "item 4 desta ordem registra o motivo no comentário" não aponta para nada que se encontre. O motivo está no comentário do `aoConcluir`, em `tutor.service.ts`, e o item 4 do comentário de abertura trata do freio do dia. Apontar o lugar certo.

## test-engineer · 2ª rodada · APROVADO · 2026-10-21 20:30:59 · `tasks/prd-reengenharia/4_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da rodada 1, nas linhas 46 a 60 da tabela de `tasks/prd-reengenharia/4_task.md`:
- a avaliação abre entre o `202` e a execução;
- abre entre a execução e a conclusão;
- a exceção da D36 (assunto delicado);
- o aluno transferido para uma turma em prova;
- a avaliação de outra turma da mesma escola;
- concorrência com N alunos em `Promise.all`;
- reenvio com a mesma chave;
- a web mostra a pausa `avaliacao`;
- o texto da pergunta pausada não sai de `mensagem_tutor`.

Cobertos: todos. Nesta rodada confirmei cada uma das minhas recomendações da rodada 1:
- **Duas asserções na segunda janela:** feito. O caso `apps/api/src/tutor/tutor-modelo.int.test.ts:359-381` agora confere duas coisas. A primeira é que a conversa ficou só com a pergunta do aluno (`[{ autor: 'aluno', texto }]`). A segunda é que a marca `tucano…` não aparece em `sinal_tutor`, `execucao_agente`, `consumo_ia`, `auditoria` nem no log do executor. Rodei esse caso sozinho e ele passou. Os nomes de tabela e coluna das consultas estão corretos: se não estivessem, a consulta daria erro.
- **Nome do caso de concorrência:** feito. O teste se chama "dois alunos parados ao entrar em `rodando`…". O bloco de mutação da linha 126 cita o prefixo "dois alunos parados", que continua batendo.
- **Mesma citação da web:** feito. A linha 59 da tabela e o bloco das linhas 201-207 apontam os dois para o caso de `apps/web/src/areas/aluno/tutor.test.ts:85`, que é o que afirma `pausaDoErro(TUTOR_PAUSADO_EM_AVALIACAO) === 'avaliacao'`.
- **`apps/api/src/tutor/tutor.service.ts`:** desde a rodada 1 mudaram só comentários. Nenhuma cláusula nova, então nenhum bloco de mutação novo é exigido. Os blocos que usam o `aoConcluir` como contexto (linhas 165-188) ganharam as mesmas linhas de comentário do código.
- **"Recomendações sem aplicar":** cada linha tem destino. As quatro linhas que mandam para o `TODO.md` correspondem às quatro linhas novas que estão lá. A recusa do tenancy-guardian traz o motivo: a mutação não muda o comportamento, por causa da chave estrangeira que liga avaliação, turma e escola.

Bloqueantes: nenhum.

Recomendações:
- A linha 60 da tabela diz que a marca é procurada também no Redis. As asserções novas da segunda janela não olham o Redis, só as tabelas e o log. Essa janela não escreve no Redis, então não é brecha. Mas a tabela promete mais do que o caso de `tutor-modelo.int.test.ts` prova: vale tirar o Redis do texto dessa linha ou citar só o caso da primeira janela.
- A asserção nova de log da segunda janela não tem bloco de mutação próprio, algo como "logar a pergunta no `aoConcluir`". O bloco de log que existe (linhas 190-199) só muta o `entrada()`. Não bloqueia, porque não há cláusula nova no código, mas um bloco espelhando esse no `aoConcluir` provaria que a asserção fica vermelha.

Não alterei nenhum arquivo.
