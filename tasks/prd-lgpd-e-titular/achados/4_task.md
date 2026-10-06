# Achados das revisões — `tasks/prd-lgpd-e-titular/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-06 09:53:11 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (tabela da `4_task.md` e `cenarios.md` RF4: prazo, travas, ano letivo, `execucao_agente`; e o [P] da linha 204):
- prazo por categoria nas quatro categorias novas: um dia antes fica, um dia depois perde a pessoa, a de B com a mesma idade fica, e reexecutar não mexe
- travas: `conversa_professor` em 3 leva o tema e o texto do modelo a 3; `conversa_tutor` em 6 anula o aluno de 7 meses e mantém o de 5; B sem ajuste fica com 12
- checks da 0022 e da 0023 nas execuções anonimizadas `pendente`, `concluida` e `falhou`
- o que fica: a linha, as FKs que apontam para ela e a soma da governança
- autoria em ano em curso ou planejado não sai; o mesmo ano encerrado sai
- reexecutar não mexe em `anonimizada_em`
- o consumo do Tutor continua cumprindo `consumo_ia_sem_conversa_de_pessoa`
- o lote não pula a linha que só tem a trava de FK, e pula sem esperar a travada para mudar
- isolamento A/B em cada alvo
- dois jobs da mesma escola ao mesmo tempo
- o plano desce pelo índice parcial da 0026

**Cobertos** (todos, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts`):
- **Prazo e isolamento:** o `it.each` do prazo usa `EXPURGADA` por categoria. Ele confere que a linha continua lá (`lida` lança erro se ela sumir), que entrada, `solicitada_por` e `anonimizada_em` mudam juntas, que os tokens ficam, que a escola B não muda e que a segunda execução grava 0.
- **Travas:** o teste de travas cobre os dois lados de cada trava e a escola B sem ajuste.
- **Checks:** o teste cobre os quatro estados, inclusive `rodando`. Ele compara estado, resultado, erro e datas antes e depois, e confere `anonimizada_em = QUARTA_1H`, o que pega a troca do `agora` por `now()`.
- **O que fica:** o teste lê as FKs de `pg_constraint` e confere a contagem de cada uma pela junção. Antes de rodar, ele afirma `geradoPorIa = 1` e `trocas = 1`, então a soma da governança não fica vazia por acidente.
- **Autoria:** ano `em_curso` e `planejado` com o `fim` vencido não perdem nada; o mesmo ano, passado a `encerrado`, perde.
- **Consumo do Tutor:** há chamadas só com entrada e só com saída, o que pega a mutação de cada termo do `or`.
- **Travas de linha:** com `for key share` e `for update` numa segunda conexão, cada alvo prova o `for no key update` e o `skip locked`.
- **Reexecução:** testada pela data da primeira noite.
- **Concorrência:** o [P] tem duas chamadas de verdade em `Promise.all`, e a soma das contagens tem de dar 30.
- **Plano:** testado com `enable_seqscan = off` para os quatro índices.

A seção "Mutações" tem uma linha para cada cláusula nova do diff. As equivalências declaradas se sustentam: a escola na instrução de fora, a junção `al.escola_id = a.escola_id` e o `order by` dentro do índice.

Os testes não têm `.skip` nem teste comentado. Nenhum mock esconde a regra: os dublês usados embrulham o repository real e só vêm de testes da 3.0. A tarefa não chama provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **`of a` sem linha nas Mutações.** O `for no key update of a skip locked` de `artefato_autoria` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts`, no `INSTRUCAO_DO_LOTE.artefato_autoria`) não tem linha na seção. Sem o `of a`, o lote trava também o `ano_letivo`. Se a coordenação estiver mexendo naquele ano, o lote pula todos os artefatos dele naquela noite. Registrar a mutação, ou um teste com o `ano_letivo` travado em outra transação.
2. **O dia exato do prazo da autoria não tem teste.** A semeadura usa `60 months ± 1 day`, então trocar `<` por `<=` passa. Nas categorias com timestamp isso pesa pouco; na autoria a comparação é por data, e o dia em que `fim + prazo` é igual ao dia de `agora` é o caso que vale fixar.
3. **A data de UTC pode adiantar a autoria em um dia.** A divergência diz que o job roda depois da meia-noite local, mas `agendamentos.ts` diz que o disparo atrasado fica segurado pela janela letiva até a aula acabar. Um job que passe das 21h em São Paulo vê a data de UTC do dia seguinte e anula a autoria um dia antes. O erro vai para o lado seguro, mas vale ou corrigir o texto da divergência ou fixar o comportamento num teste com `agora` às 22h locais.
4. **O [P] só cobre `execucao_agente`.** Vale semear no mesmo teste consumo com texto, consumo com aluno e artefato de ano encerrado, e conferir a soma por categoria. Hoje o `skip locked` desses três alvos está provado só em sequência, com a trava vinda de outra conexão.
5. **Falta o ajuste direto das categorias novas.** Por exemplo, `execucao_agente` em 3 sem mexer em `conversa_professor`, para provar que o prazo da própria categoria vale, e não só a trava. Hoje isso fica coberto pelo caminho genérico testado na 3.0.
6. **Tabela vazia na `4_task.md`.** A tabela "Recomendações sem aplicar" está sem linhas. A instrução da própria tarefa pede "nenhuma" quando não há recomendação.

## test-engineer · 2ª rodada · APROVADO · 2026-10-06 10:38:12 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO

Cenários exigidos (escopo da rodada 2: o diff desde a 1ª rodada e as seis recomendações):
- O `of a` do lote da autoria tem teste que falha sem ele.
- O dia exato do prazo da autoria: o `fim` que, somado o prazo, cai no dia de hoje fica, e o que cai ontem sai.
- O fuso da autoria: às 22h de São Paulo já é o dia seguinte em UTC, e o dia que vale é o da escola, não o de UTC nem o da sessão do banco.
- O processador passa o fuso da janela ao lote.
- O teste de concorrência [P] cobre os quatro alvos de anonimização e confere a soma por categoria.
- O ajuste de cada categoria vale sem mexer na categoria que a trava.
- A tabela de Mutações tem linha para cada cláusula nova.

Cobertos:
1. **`of a`**: `apps/worker/test/expurgo-da-escola.int.test.ts:1075` trava o ano letivo do artefato livre com `for no key update` em outra transação e espera `{ linhas: 2 }`, com o livre anonimizado. Sem o `of a`, o `skip locked` pula a linha também pela trava do `ano_letivo` e o teste falha. A linha está nas Mutações, `4_task.md:177`.
2. **Dia exato e fuso (`:1310-1320`)**: o relógio está às 22h de quarta, 07/10, em São Paulo. Conferi as datas: 07/10/2026 é mesmo uma quarta. Com o prazo de 60 meses, o `fim` de 07/10/2021 cai na quarta e fica; o de 06/10/2021 cai na terça e sai. As trocas que fazem o teste falhar:
   - `<` trocado por `<=`: o de quarta sai.
   - fuso `'UTC'`: o dia já é 08/10 e o de quarta sai.
   - `fuso: 'UTC'` no processador: o mesmo resultado.
   As quatro trocas estão registradas em `4_task.md:176` e `:179`.
3. **[P] dos quatro alvos (`:1246-1284`)**: são duas chamadas de verdade em `Promise.all`, com lote de 5 e 30 linhas por categoria. O teste confere que nenhuma linha ficou com pessoa nos quatro alvos, que há duas linhas de execução por categoria e que a soma dá exatamente 30, então cada linha conta uma vez.
4. **Ajuste da própria categoria (`:1286-1308`)**: execução em 3 meses, texto do modelo em 2, aluno do consumo em 4 e autoria em 12. Cada categoria tem um par em que uma linha sai e a outra fica, nos dois lados do corte.
5. **Mudança de assinatura**: `expurgarLote` com `PrazoDoLote` não muda a semântica das três categorias que apagam, que só desestruturam `{ agora, meses }`. Todas as chamadas nos testes passam a usar `FUSO`, e o teste de plano (`:742`) usa a assinatura nova.
6. **Restante do pedido**: os testes de unidade da ordem da noite cobrem as sete categorias. A divergência na techspec, seção 5 "Tarefa 4.0", descreve o código como ele ficou. "Recomendações sem aplicar" diz "nenhuma".

Não achei `.skip`, teste comentado, mock que esconda a regra nem chamada a provedor pago.

Bloqueantes: nenhum.

Recomendações:
- **Fuso de outra escola**: o teste do fuso (`:1310`) usa uma escola com o fuso padrão, `America/Sao_Paulo`. Ele prova que o fuso não é o de UTC, mas não prova que é o da escola. Se o processador passasse um fuso fixo de São Paulo, ou o padrão do ambiente, em vez de `janela.fuso` (`apps/worker/src/processadores/expurgar-escola.ts:75`), o teste continuaria verde. Um caso com `bancada.configurarEscola(a.escolaId, { fuso: 'America/Rio_Branco' })`, como os de `:1500` e `:1522`, fecharia isso: escolher um horário em que o dia de Rio Branco e o de São Paulo sejam diferentes. Também valeria registrar essa troca na linha `:179` das Mutações.
- **Comentário do helper**: o comentário de `anoQueTerminou` (`:259`) diz que o `fim` é o dia de UTC. Isso só equivale ao dia da escola porque `QUARTA_1H` é 4h em UTC. Vale uma linha dizendo que quem usar outro horário perto da meia-noite deve chamar `anoQueTerminouEm` com a data explícita.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-escola.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/4_task.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/cenarios.md

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-06 10:39:11 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO

Tabelas verificadas:
- `execucao_agente`: ganhou a coluna nova `anonimizada_em`. A tabela já tinha `escolaId` e `anoLetivoId`, e o id continua UUID.
- `consumo_ia` e `artefato`: não ganharam coluna, só índices.
- Os quatro índices parciais da `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0026_anonimizacao.sql` começam por `escola_id`.
- A migration só acrescenta coluna e índices, não troca nada do que já existe. O `_journal.json` está coerente com ela.

Queries verificadas (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts`, `INSTRUCAO_DO_LOTE`):
- Os quatro lotes (`execucao_agente`, `consumo_ia_texto`, `consumo_ia_aluno`, `artefato_autoria`) recebem a escola por `exigirEscolaDoContexto()`, na linha 208 do `expurgarLote`. Nenhum a recebe por argumento.
- A escola entra duas vezes em cada lote: na subconsulta e no update de fora.
- No `artefato_autoria`, o join com `ano_letivo` também amarra a escola (`al.escola_id = a.escola_id`).
- O `fuso` vem de `janelaDaEscola.daEscola` no contexto do job, chega como parâmetro e não é concatenado no SQL.
- Não há endpoint, nada de `@Body` ou `@Query`, e nenhum `@SemEscopo` novo.
- Procurei consultas que tratem `solicitada_por` ou `criado_por` nulo como "de qualquer um" (`is null`, `or(`) e não encontrei nenhuma. A anonimização não abre acesso.

Teste de isolamento: presente e efetivo (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts`).
- **`it.each` do prazo (linha 445):** a linha de B, com a mesma idade, continua com a pessoa, e B não ganha linha em `expurgo_execucao`.
- **`it.each` da anonimização (linha 1012):** B tem linhas mais antigas que as de A, e o teste exige que as três de B continuem com a pessoa. Os três lotes ordenados por data quebram se a escola sair da subconsulta. Se a escola sair das duas cláusulas, o teste quebra nos quatro lotes, inclusive no do artefato, que não tem `order by`.
- **Travas (linha 1086):** compara com a escola B, que não tem ajuste.
- **Teste de cláusula sozinha:** tirar só o `escola_id` de fora (ou o do join, no artefato) não quebra teste nenhum. Isso já está declarado na tabela de mutações. É defesa em profundidade, porque a subconsulta já filtra pela escola e o id é UUID único.

Bloqueantes: nenhum

Recomendações:
- No `artefato_autoria`, o filtro do `ano_letivo` pela escola existe só pelo join (`al.escola_id = a.escola_id`). Vale repetir `al.escola_id = ${escolaId}` de forma explícita, como nos outros lotes, para a leitura não depender de deduzir o join.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-06 10:39:53 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff não toca `Nota` nem `Correcao`; os quatro lotes novos só fazem `update` em `execucao_agente`, `consumo_ia` e `artefato`. Todos com autor humano? sim, porque não há caminho novo.

Decisão autônoma sobre aluno: ausente. O job anula pessoa em linhas vencidas e não aprova, reprova nem encaminha aluno, nem como sugestão.

Aprovação registrada: ok.
- "Quem aprovou e quando" fica em `entrega`, que o expurgo não altera.
- O `resultado` (os ids do que foi gravado) e as sete FKs para `execucao_agente` continuam. O teste "o que fica" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:1166`) lê as FKs em `pg_constraint` e confere as sete antes e depois. Na mesma rodada, confere que a soma da governança não muda.
- Anular `solicitada_por` não abre acesso a ninguém. Toda leitura que usa esse campo filtra por `eq(solicitadaPor, usuário do contexto)`, e o valor nulo não casa com nenhum usuário: `apps/api/src/ia/execucao.repository.ts:130,144`, `apps/api/src/assistente/execucao-do-pedido.repository.ts:24`, `apps/api/src/assistente/conversa.repository.ts:105`, `apps/api/src/tutor/tutor.repository.ts:330`.
- Nenhum fluxo de aprovação ou autorização lê `artefato.criado_por`.

Supervisão do tutor: ok.
- As travas impedem a anonimização de passar à frente das conversas: o aluno do consumo não passa do prazo da conversa do Tutor, e o tema da execução e o texto do modelo não passam do prazo da conversa do professor. O teste "travas" (linha 1086) prova isso.
- A visão do professor sobre o Tutor vem de `mensagem_tutor`, `sinal_tutor` e o resumo, e não depende do que é anulado aqui.

Autonomia declarada e visível: sim, e não muda nesta tarefa. Nenhum agente nem nível de autonomia foi tocado.

Os demais itens:
- **Item 6 (auditoria):** continua respondendo "o que a IA gerou, quem aprovou e quando".
- **Item 7 (vigilância):** nada de inferência emocional nem de medir navegação.
- **Item 8 (D46/D55):** nenhum campo de nota em discursiva ou redação.
- **Item 9 (D45/D64):** nenhuma métrica de professor surge. `consumo_ia` segue sem coluna de usuário.
- **Grupo mínimo de professores:** `#serieComGrupoMinimo` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/governanca/governanca.repository.ts:119`) conta `coalesce(criado_por, aplicada_por)`, mas só no ano em curso. A autoria só é anulada em ano `encerrado`, então a regra de dois ou mais professores no recorte não é afetada.

Bloqueantes: nenhum.

Recomendações:
1. No teste "o que fica" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:1184`) a `entrega` é semeada pendente. Semear uma entrega já decidida (com `decidida_por` e `decidida_em`) e conferir que as duas colunas ficam iguais depois do expurgo. Assim o teste prova o "quem aprovou e quando" da regra 70, item 6, e não só a contagem de FKs.
2. Escrever no comentário de `#serieComGrupoMinimo` (linha 119) que a contagem só vale porque se limita ao ano em curso. Se um dia ela abrir para anos encerrados, o `coalesce` passa a ler `criado_por` já anulado, e o número de professores distintos pode mudar para mais ou para menos, mexendo no limite de dois professores da D45.
3. Execução ainda `pendente` ou `rodando` com mais de 12 meses é anonimizada, e o `entrada` dela fica só `{ tarefa }`. A varredura `falharInterrompidas` cobre o caso na prática. Vale uma linha em `docs/modelo-de-dados.md` dizendo que execução aberta e vencida não volta a rodar.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-06 10:39:54 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Cada uma das quatro divergências declaradas no `4_task.md` também está na `techspec.md` §3 e §5 ("Tarefa 4.0, como ficou no código") e no `cenarios.md`: sete FKs em vez de oito, `for no key update` em vez de `for update`, o dia da autoria contado no fuso da escola, e o método passando de `apagarLote` para `expurgarLote` com `PrazoDoLote`.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, infra)")
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:178` (alvo `artefato_autoria`): o lote manda o `fuso` da janela letiva para o `at time zone` do Postgres. Só o `Intl` do Node confere esse fuso (`fusoValido`). Se um nome IANA existir no Node e não no tzdata do Postgres, a autoria falha toda noite e só aparece no alerta de duas noites. Uma linha no runbook ou um teste com o fuso que o Postgres recusa deixaria isso dito.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:193-195`: o JSDoc de `expurgarLote` ficou com quebra de linha irregular, uma linha longa no meio do parágrafo. O mesmo acontece em `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md:601` e em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md:179-180`. É só refazer as quebras.
- Uma execução anonimizada tem `solicitada_por` nulo. Por isso, reenviar a mesma `chave_envio` depois do prazo cai no índice único e devolve `NAO_ENCONTRADO` em `ExecucaoDoPedidoRepository.entradaDaChave`, sem erro 500. O comportamento está certo, mas não está escrito em lugar nenhum. Vale uma linha no comentário de `execucao-agente.ts`.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-06 10:40:01 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO
Caminho quente tocado: migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

**Por que cada item passa:**
- **Rate limit e fila:** nada disso mudou nesta tarefa. É o processador da 3.0, na fila de lote, com uma vaga por escola, e ele confere a janela letiva a cada lote.
- **Concorrência:** cada lote anonimiza no máximo 5.000 linhas, com `for no key update skip locked`, numa transação por lote. Conferi que nenhuma coluna alterada (`entrada`, `solicitada_por`, `anonimizada_em` e `criado_por`) está em índice único. Então a trava de FK de quem grava mensagem, consumo ou entrega apontando para a linha não fica esperando o lote. O teste [P] roda dois jobs ao mesmo tempo nos quatro alvos e confere que cada linha foi contada uma vez só. Rodar o expurgo de novo não mexe no que já foi anonimizado, porque cada lote só lê linhas que ainda têm a pessoa.
- **Índice:** os quatro índices parciais começam por `escola_id`. O EXPLAIN com volume mostra cada lote descendo pelo próprio índice e parando no limite, sempre abaixo de 135 ms, longe do `statement_timeout` de 2 s.
- **Migration:** só expande. A coluna nova aceita nulo e não tem valor padrão, então a tabela não é reescrita, e o código anterior ignora a coluna. Os índices sem `concurrently` estão declarados como exceção na Tech Spec (§7c), e só existe dado sintético.
- **Métrica e alerta:** a 3.0 já grava `expurgo_execucao` para cada categoria, e o alerta `expurgo.noites_incompletas` cobre as quatro categorias novas sem mudança.
- **Teste:** nenhum teste chama provedor pago (o consumo usa `origem = 'falso'`). O cenário de carga "justiça entre escolas" está atribuído à tarefa 19.0.

Recomendações:
1. **`/home/joaquimdp/Documentos/git/Educa.ia/TODO.md:91-94`:** a pendência "antes do staging" cita só os índices da 0025. Vale incluir os quatro índices da 0026, que estão em `execucao_agente` e `consumo_ia`, as tabelas que recebem uma gravação a cada troca do Tutor. Também vale generalizar a pendência: toda migration criada depois de o staging existir cria índice com `concurrently`.
2. **`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/migrar.ts:53`:** o migrador usa o mesmo `statement_timeout` da consulta (2 s). Quando houver volume real, um `CREATE INDEX` em `execucao_agente` ou `consumo_ia` passa desse prazo e derruba o deploy. Isso precisa ser previsto junto com a passagem para `concurrently` fora de transação, antes do staging.
3. **`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0026_anonimizacao.sql`:** os índices `execucao_agente_a_anonimizar_idx` e `consumo_ia_aluno_a_anular_idx` contêm quase todas as linhas recentes. Na prática, cada troca do Tutor passa a atualizar um índice a mais em cada uma das duas tabelas. Hoje o custo é desprezível (cerca de 7,5 gravações por segundo no pico), mas vale medir no cenário de carga da 19.0.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-06 10:40:04 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO
Perfis usados: nenhum. A tarefa não chama modelo; só muda as linhas que a camada de IA grava (`execucao_agente`, `consumo_ia`, `artefato`).
Custo estimado por professor/mês: R$ 0 em IA. Não entra chamada de modelo nova. O custo é do banco: 4 lotes por noite, no máximo 135 ms cada por 5.000 linhas, pelo EXPLAIN anexado à tarefa.
Prompt versionado: não se aplica
Validação de schema: não se aplica a saída de modelo. Do lado do leitor, a entrada anonimizada `{ tarefa }` passa no check `execucao_agente_entrada_da_tarefa` e é recusada por `esquemaEntradaDaExecucao.safeParse`. Quem a lê recebe `NAO_ENCONTRADO`, que é falha fechada.
Aprovação humana no caminho: não se aplica. Nenhuma entrega nasce aqui, e `resultado`, `estado`, `erro` e as sete FKs continuam ligando o que a IA gerou ao que foi aprovado (regra 70, item 6). O teste "o que fica" prova isso e prova que a soma da governança não muda.

Bloqueantes: nenhum.

Conferi os dois pontos que você pediu:

- **Execução `pendente` anonimizada.** No funcionamento normal ela não chega a acontecer. O piso de `execucao_agente` é 3 meses, e a varredura `falharInterrompidas` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ia/execucao.repository.ts:66`) já encerra toda pendente com mais de dois prazos de execução. Se mesmo assim acontecer, os dois caminhos de leitura falham fechados:
  - `ExecucaoDoPedidoRepository.entradaDaChave` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/assistente/execucao-do-pedido.repository.ts:15`) devolve `NAO_ENCONTRADO`.
  - O reenvio com a mesma chave cai em `daChave`, que filtra por `solicitada_por`, e também devolve `NAO_ENCONTRADO` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ia/agendador-de-execucoes.ts:88`).
  
  Nenhum dos dois relê dado de pessoa, nenhum gera de novo e nenhum gasta modelo. Pela regra 30, item 8 (idempotência), está ok. O `for no key update skip locked` também não briga com o `concluirRodando` e o `marcarFalhou` do executor: o lote pula a linha que está sendo concluída.
- **Registro de consumo.** O lote do texto só pega linha com `entrada` ou `saida` preenchida. A chamada do Tutor e a de `propor_ferramenta` já nascem sem texto, ficam fora do lote e continuam cumprindo `consumo_ia_sem_conversa_de_pessoa`. Os testes cobrem a linha só com entrada e a linha só com saída. Tokens, custo, modelo, função e `em` ficam, então a soma por escola e por função da regra 30, item 6, e da D14 não muda. O orçamento por aluno (60 por dia, 300 por mês) conta pela `mensagem_tutor` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ia/orcamento.repository.ts:48`), e não pelo `consumo_ia.aluno_id`. Anular o aluno com pelo menos 3 meses de idade não mexe no freio.

Recomendações:
1. Pôr um teste de integração no reenvio de uma chave cuja execução já foi anonimizada. Ele mostraria que a API responde 404 tipado, e não 500 nem uma execução nova. Hoje isso está garantido pelo código, mas nenhum teste prova.
2. `consumo_ia` recebe uma linha por troca do Tutor e agora tem dois índices parciais a mais. O `consumo_ia_aluno_a_anular_idx` `(escola_id, em)` pega as mesmas linhas do `consumo_ia_aluno_idx` `(escola_id, aluno_id, em)` que já existia. Isso custa escrita no caminho quente. A decisão é do `infra-guardian`; vale registrar o motivo no `/retro`, que é o plano do lote, mostrado no teste do plano.
3. No `docs/avaliacao-de-modelos.md`, ou onde a planilha de custo for montada, anotar que `consumo_ia.entrada`/`saida` vivem no máximo 12 meses (teto da `texto_do_modelo`). Assim, quem for comparar a qualidade de modelos com chamadas reais antigas já sabe que esse texto não fica guardado.

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-06 10:40:33 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: REPROVADO

Campos pessoais tocados: `execucao_agente.solicitada_por` (professor, coordenador ou aluno, conforme a tarefa) e `execucao_agente.entrada` (o tema do professor); `consumo_ia.aluno_id`, `consumo_ia.entrada` e `consumo_ia.saida`; `artefato.criado_por`. Entra um campo novo, `execucao_agente.anonimizada_em`, que é uma data sem pessoa.

Fora da tabela de dados do docs/lgpd.md: nenhum. As quatro linhas da tabela (autoria, execução, consumo por aluno e texto do modelo) batem com o padrão, o piso e o teto de `CATEGORIAS_DE_RETENCAO`. A linha da execução, porém, promete menos do que deveria para o aluno (ver o bloqueante).

Autorização por objeto: ok. Nenhuma rota nova. Os quatro lotes recebem a escola por `exigirEscolaDoContexto()` e a usam na subconsulta e na instrução de fora. Na autoria, a junção com `ano_letivo` também é presa à escola.

Logs: limpos. Nenhum evento novo. O processador continua logando só `tipo` e as contagens.

Auditoria: presente. Cada categoria grava sua linha em `expurgo_execucao`, mesmo com zero, como na 3.0. A execução anonimizada guarda `anonimizada_em`. A linha da execução, o `resultado` e as FKs ficam, então "o que a IA gerou e quem aprovou" continua respondendo (regra 70, item 6).

Envio externo: nenhum envio novo. O lote só reduz o que já está gravado. `consumo_ia` mantém `envio_externo`, o modelo e os tokens.

Seed/fixture: sintético ("Aluno sintético do expurgo", "Frações com a turma da Ana Sintética").

Bloqueantes:

1. **A execução do Tutor mantém o aluno além do prazo do consumo por aluno, e o consumo volta ao aluno pela execução.**
   - **Onde:** `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:279-289`, com a trava em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/privacidade/retencao.ts` (`TRAVAS_DE_RETENCAO`).
   - **O que está errado:** a execução de `turno_do_tutor` tem `solicitada_por` igual ao aluno. O lote só a anonimiza no prazo de `execucao_agente`, que é travado só pela `conversa_professor`. Já o consumo do Tutor é gravado em produção com `execucao_id`: o gateway em `packages/nucleo/src/ia/provedor.ts:166/243` repassa o `execucaoId`, e `apps/api/src/tutor/tutor-modelo.int.test.ts:171` lê o consumo por ele.
   - **Exemplo:** com `conversa_tutor = 6` e os padrões de 12 meses (ou só `consumo_por_aluno = 3`, que o catálogo aceita), o lote anula `consumo_ia.aluno_id` aos 7 meses. Mesmo assim, `consumo_ia.execucao_id → execucao_agente.solicitada_por` continua devolvendo o aluno até os 12 ou 24 meses. A execução do Tutor também guarda sozinha que tal aluno usou o Tutor em tal hora depois de a conversa já ter saído.
   - **Consequência:** a promessa de `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:66` ("nunca além da conversa do Tutor; o aluno vira nulo") não se cumpre.
   - **Por que o teste passa:** o teste de travas (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:1086`) cria o consumo do Tutor com `execucao_id` nulo (`:243-245`), e isso não é o formato de produção.
   - **Correção exigida:**
     - A execução da função `tutor_com_o_aluno` deve ser anonimizada no menor prazo entre o de `execucao_agente` e o efetivo de `consumo_por_aluno` (que já leva a trava da `conversa_tutor`). Pode ser um alvo próprio ou um segundo corte no lote, sempre pelo índice parcial e com `for no key update skip locked`.
     - Teste de integração com o consumo do Tutor ligado à sua execução: com `conversa_tutor = 6`, aos 7 meses nem `consumo_ia.aluno_id` nem a junção `consumo_ia → execucao_agente.solicitada_por` alcançam o aluno, e a execução do Tutor de 5 meses fica.
     - Atualizar a linha da execução em `docs/lgpd.md`, a seção 3 de `techspec.md` (catálogo e travas) e o `cenarios.md`.

Recomendações:
- A tabela de mutações da tarefa já marca o `order by` como "equivalente na prática" em `execucao_agente` e `consumo_ia_texto`. Vale registrar isso também no `/retro`, para que a próxima tarefa não peça um teste de ordem que não tem como falhar.
- `artefato.titulo` e `artefato.conteudo` (texto livre, que pode trazer nome) ficam até a troca de nome da 15.0. Convém citar isso na linha de autoria do `docs/lgpd.md`, para ninguém ler a anulação de `criado_por` como anonimização completa do artefato.

Pergunta de fechamento: em parte. O que o sistema guarda e o que foi enviado ao modelo seguem respondendo, pela linha de `consumo_ia` e pela de `execucao_agente`. Mas, para o uso do Tutor, a resposta sobre o aluno continua existindo depois do prazo que a escola configurou, e isso é o bloqueante acima.

## test-engineer · 3ª rodada · REPROVADO · 2026-10-06 11:32:16 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: REPROVADO

**Cenários exigidos (a correção do `privacy-guardian` e o que ela toca):**
- Com `conversa_tutor = 6`, aos 7 meses o aluno não aparece nem em `consumo_ia.aluno_id` nem pela ligação do consumo com a execução (`consumo_ia → execucao_agente.solicitada_por`).
- A execução do Tutor de 5 meses fica.
- A execução do professor com a mesma idade fica.
- A `entrada` da execução do Tutor fica só com a tarefa.
- O alvo novo, `execucao_agente_do_tutor`, tem as mesmas garantias dos outros: limite e lote cheio, não reler o que já foi anonimizado, outra escola fica, `skip locked` e a trava de FK, e o plano desce pelo índice parcial.
- Dois jobs ao mesmo tempo contam cada linha do alvo novo uma vez só.
- `docs/lgpd.md`, techspec §3 e `cenarios.md` atualizados.

**O que está coberto:**
- O teste novo (`apps/worker/test/expurgo-da-escola.int.test.ts:1308`) prova a correção exigida. Ele fica vermelho em três situações: sem o alvo novo em `ALVOS_DO_EXPURGO_DA_ESCOLA`, porque a ligação devolve o aluno; sem `funcao = 'tutor_com_o_aluno'`, porque a execução do professor de 7 meses perde a pessoa; e com o corte errado, porque a de 5 meses perde o aluno. Ele também prova o `set entrada` com a execução que tem mais que a tarefa.
- O helper `consumo` agora liga o consumo do Tutor à execução dele, como em produção (`:245`). `EXPURGADA.consumo_por_aluno` confere a ligação em todo `it.each` do prazo (`:368-376`).
- O alvo novo entra em `LER_PESSOA`. Por isso entra no `it.each` de limite, releitura e outra escola (`:1062`) e no de ordem, `skip locked` e trava de FK (`:1080`). Também entra no teste do plano, que agora semeia o próprio volume (`:743`).
- As mutações do alvo novo estão registradas no `4_task.md` e batem com esses testes.
- As duas recomendações da minha 2ª rodada foram aplicadas: a escola de Rio Branco e o comentário de `anoQueTerminou`.
- Docs atualizados: `docs/lgpd.md` (linha do consumo por aluno), techspec §3/§5/§7c e `cenarios.md`.

**Bloqueantes:**

1. **O teste [P] diz cobrir todos os alvos, mas no alvo novo a asserção nunca falha.**
   - **Onde:** `apps/worker/test/expurgo-da-escola.int.test.ts:1334-1371`.
   - **O que está errado:**
     - O teste semeia só execuções de `conversa_e_ferramentas` (`:1340-1343`).
     - Os consumos do Tutor entram sem `execucao_id` e sem nenhuma execução do Tutor (`:1344-1349`). É o formato que o `privacy-guardian` disse não ser o de produção.
     - Assim `execucao_agente_do_tutor` não tem linha nenhuma. O laço `for (const alvo of Object.keys(LER_PESSOA))` (`:1365`) confere `comPessoa('execucao_agente_do_tutor') === 0` sobre um conjunto vazio: passa sempre, o que a regra 40 proíbe.
     - A soma `consumo_por_aluno = 30` (`:1370`) continua contando só os consumos.
     - A disputa nova desta correção fica sem teste: duas categorias na mesma tabela ao mesmo tempo. Um job em `execucao_agente` e outro em `consumo_por_aluno` podem pegar a mesma execução do Tutor, e nada prova que cada execução é anonimizada e contada uma vez só no total.
   - **Correção exigida:**
     - No [P], semear execuções do Tutor ligadas aos consumos do Tutor (`execucao_id` preenchido), em dois grupos:
       - um grupo numa idade em que só o alvo novo as pega (por exemplo, `ajustar(conversa_tutor, 6)` e 7 meses);
       - outro grupo vencido nos dois prazos (13 meses).
     - Rodar os dois jobs em paralelo, como hoje.
     - Afirmar três coisas:
       - nenhuma execução do Tutor ficou com `solicitada_por` nem com `anonimizada_em` nulo;
       - nenhum consumo do Tutor alcança o aluno pela ligação;
       - a soma das linhas de `execucao_agente` com as de `consumo_por_aluno` é igual ao total semeado, cada linha uma vez só (execuções de ferramenta + execuções do Tutor nas duas categorias + consumos).
     - Corrigir o título se ele continuar dizendo "cada alvo".

**Recomendações:**
- No teste de travas (`:1136`), a execução do Tutor de 4 meses ligada a `quatroMeses.aluno` perde a pessoa pela `execucao_agente` (prazo 3) enquanto o consumo mantém o aluno (prazo 6). Uma asserção sobre isso documentaria que o "menor dos dois prazos" vale nos dois sentidos, e não só no da correção.
- O comentário de `INSTRUCAO_DO_LOTE.execucao_agente_do_tutor` diz que o Tutor é "a única [função] que o aluno pede". Isso vale hoje (`apps/api/src/tutor/tutor.repository.ts:330`). Vale registrar no techspec que uma função nova pedida pelo aluno precisa entrar nesse filtro, ou virar um teste que leia o catálogo de funções.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0026_anonimizacao.sql
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/4_task.md

## test-engineer · 4ª rodada · APROVADO · 2026-10-06 12:14:16 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os da rodada anterior não mudaram. Nesta rodada conferi a correção exigida no [P] dos alvos de anonimização e as duas recomendações aceitas: a asserção nova no teste de travas e a frase da techspec.

**Cobertos:** a correção exigida foi feita por inteiro, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:1341-1400`.
- **Execuções do Tutor semeadas:** são 30, cada uma com o seu consumo do Tutor ligado por `execucao_id` e com o `em` igual ao `criada_em` dela.
- **Dois grupos de idade:** com `conversa_tutor = 6`, 15 execuções têm 7 meses e só o alvo novo as pega; as outras 15 têm 13 meses e estão vencidas nos dois prazos.
- **Concorrência de verdade:** os dois jobs rodam em `Promise.all`, com `lote: 5`.
- **Nenhuma execução do Tutor com pessoa:** `comPessoa('execucao_agente_do_tutor')` dá 0. A junção consumo → execução também afirma `solicitada_por` nulo e `anonimizada_em` preenchido, e devolve `{ total: 30, comAluno: 0 }`. O `total: 30` prova que a ligação existe, então a asserção não passa à toa.
- **Cada linha uma vez só:** `execucao_agente + consumo_por_aluno = 90`, que é 30 de ferramenta, 30 do Tutor e 30 consumos do Tutor.
- **Título:** corrigido.

As duas mutações que vocês registraram no `4_task.md` (linhas 197 e 199) batem com o que o teste faz:
- **Sem `execucao_agente_do_tutor` em `ALVOS…consumo_por_aluno`:** as 15 execuções de 7 meses ficam com o aluno. Quebram o `comPessoa`, o `comAluno` e a soma (75).
- **Sem `anonimizada_em is null` no alvo novo:** as execuções de 13 meses que `execucao_agente`, que vem antes, já anonimizou são relidas, e a soma passa de 90.

As duas recomendações também foram feitas:
- **Teste de travas (linhas 1161-1167):** a execução do Tutor de 4 meses, ligada a `quatroMeses.aluno`, sai pelo prazo de `execucao_agente` (3) enquanto o consumo fica com o aluno (6). O helper `consumo` (linha 245) cria a execução ligada, então a junção não volta vazia e a asserção falharia sem o menor prazo.
- **Techspec:** a frase sobre função nova pedida pelo aluno está em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md:198-206`.

O código de produção (`expurgo-da-escola.repository.ts` e a migration 0026) não mudou desde a rodada anterior.

**Bloqueantes:** nenhum.

**Recomendações (não bloqueiam; ficam para o `/validar` e o `/retro`):**
- O [P] não força os dois jobs a se sobreporem: não há barreira nem gancho de trava. A soma de 90 prova que nada é contado duas vezes quando eles se sobrepõem, mas a disputa entre `execucao_agente` e `execucao_agente_do_tutor` pela mesma execução de 13 meses só acontece se a ordem de execução deixar. Isso segue o padrão dos outros [P] do arquivo. Se um dia isso der problema, vale um gancho como o `depoisDeTravar`.
- O helper `soma` (linhas 1389-1393) confere `toHaveLength(2)` toda vez que é chamado, e `consumo_por_aluno` passa por ele duas vezes. Dá para calcular a soma uma vez só e reaproveitar.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-06 12:15:31 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila, migration
Rate limit: ok (não se aplica, não há endpoint novo)
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0026_anonimizacao.sql`: dois índices parciais em `execucao_agente` (`execucao_agente_a_anonimizar_idx` e `execucao_agente_do_tutor_a_anonimizar_idx`) e o `consumo_ia_aluno_a_anular_idx` recebem quase toda linha nova. Isso quer dizer cerca de três atualizações de índice a mais em cada troca do Tutor, justamente às 10h. O `TODO.md` já registra que isso será medido no cenário de carga da 19.0. Se a medição apontar custo, troque o índice do Tutor por um só índice `(escola_id, funcao, criada_em) where anonimizada_em is null`, que serve aos dois lotes.
2. `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts`, `artefato_autoria`: o fuso chega ao `at time zone` direto da configuração da escola. Se o nome do fuso for inválido, o lote falha toda noite e só o alerta de duas noites avisa. Seria bom validar o fuso contra `pg_timezone_names` quando a escola grava a configuração, para o erro aparecer na hora.

Rodada nova, conferida pelo diff:
- **Índice do lote do Tutor:** o quinto índice começa pela escola (`escola_id, criada_em`). O lote trava as linhas com `for no key update skip locked`, que não bloqueia a conferência de FK da troca nova do Tutor, e só alcança linhas com meses de idade, que o caminho quente não toca mais. A disputa entre as duas categorias tem teste [P] (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:1341`).
- **Autoria pelo dia da escola:** o dia agora é o do fuso da escola, com teste em São Paulo e em Rio Branco (mesmo arquivo, linha 1426).
- **EXPLAIN com volume real:** está na seção 4.3 de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/4_task.md`. Todos os lotes descem pelo índice parcial e param no limite; o pior leva 141 ms, longe do `statement_timeout` de 2 s.
- **Minhas recomendações 1 e 2:** foram aplicadas em `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md`. O item "Migrations 0025 e 0026 antes do staging" agora cita o `statement_timeout` do migrador.
- **Minha recomendação 3:** virou item próprio no `TODO.md`, para o cenário de carga da 19.0.
- **Migration:** coluna nova pode ficar nula e os índices são novos, então o código anterior continua funcionando. Os índices entram sem `concurrently`, o que é aceitável enquanto só há dado sintético, e está registrado no `TODO.md`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-06 12:15:51 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test, infra)")
Bloqueantes: nenhum

**O que conferi nesta rodada**

- **Escopo.** O diff não entra na 15.0 (troca de nome e eliminação) nem na 7.0 (`consumo_ia.provedor`). Em `governanca.repository.ts` mudou só o comentário.
- **Correção que o `privacy-guardian` exigiu.** O alvo novo `execucao_agente_do_tutor` está ligado a `consumo_por_aluno`, com filtro `funcao = 'tutor_com_o_aluno'` e o quinto índice parcial na 0026.
  - O filtro cobre todo caminho em que o aluno fica em `solicitada_por`. A única gravação é `ExecucaoDaSessaoRepository.gravarPendente`, e o check `execucao_agente_tarefa_da_funcao` só aceita `turno_do_tutor` nessa função.
  - Nenhuma leitura de `solicitada_por` passa a tratar o nulo como "de qualquer um". As leituras estão em `apps/api/src/ia/execucao.repository.ts:130,144`, `apps/api/src/assistente/execucao-do-pedido.repository.ts:24`, `apps/api/src/assistente/conversa.repository.ts:105` e `apps/api/src/tutor/tutor.repository.ts:330`.
- **Divergência nova registrada.** Está nos três lugares: `4_task.md`, `techspec.md` (§3, na linha do catálogo e nas travas; §5; §7c) e `cenarios.md` (RF4, travas).
- **Fuso na autoria.** `PrazoDoLote.fuso` vem de `janela.fuso` (`apps/worker/src/processadores/expurgar-escola.ts:75`) e entra no SQL como parâmetro, não concatenado.
- **Minhas três recomendações da 1ª rodada.**
  - A nota sobre o tzdata do Postgres está no JSDoc de `INSTRUCAO_DO_LOTE`.
  - O comportamento do reenvio da chave depois da anonimização está escrito em `execucao-agente.ts` e em `docs/modelo-de-dados.md`, e o teste ficou no `TODO.md`.
  - A quebra de linha foi refeita no repository e no `docs/modelo-de-dados.md`.

**Recomendações**

1. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md:345-346`: a linha "Índices novos" da tabela da §7c foi partida em duas. A primeira termina em `` `and funcao = ``, com o trecho de código aberto, e a seguinte começa em `'tutor_com_o_aluno'`. No GFM, a segunda linha vira outra linha da tabela, e todos os trechos de código dela saem com as crases trocadas. A descrição do quinto índice fica ilegível justamente no documento que registra a divergência. Juntar as duas numa linha só.
2. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-lgpd-e-titular/techspec.md:180-181`: o item "Depois percorre as categorias…" ainda tem uma linha comprida no meio do parágrafo. Refazer as quebras de linha, como foi feito no JSDoc.

## llm-integrator · 2ª rodada · APROVADO · 2026-10-06 12:15:56 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO

Perfis usados: nenhum novo. A tarefa não adiciona chamada de modelo. O que ela faz é anonimizar o registro das execuções que já existem (`execucao_agente`, `consumo_ia`).

Custo estimado por professor/mês: R$ 0 a mais em IA, porque não há chamada nova. O custo extra fica no banco: cada troca do Tutor passa a atualizar índices a mais. Esse custo está registrado no `TODO.md` para ser medido no cenário de carga da 19.0.

Prompt versionado: não se aplica (não há prompt novo).

Validação de schema: não se aplica a saída de modelo. A `entrada` anonimizada vira `{ tarefa }`, que é o que o check `execucao_agente_entrada_da_tarefa` exige, e o teste de checks prova isso para os estados `pendente`, `rodando`, `concluida` e `falhou`.

Aprovação humana no caminho: não se aplica. O teste "o que fica" mostra que o vínculo entre o que a IA gerou e o que foi aprovado continua: a linha, o estado, o `resultado`, o `erro` e as sete FKs que apontam para a execução ficam (regra 70, item 6).

Bloqueantes: nenhum.

O que conferi neste diff:
- **Execução do Tutor no prazo do consumo por aluno.** O alvo `execucao_agente_do_tutor` está em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:37` e a instrução dele começa na linha 140. Ela usa o mesmo `set` da anonimização geral, desce pelo índice parcial novo da 0026 e trava com `for no key update skip locked`. Assim o aluno não volta ao consumo pela execução a que ele aponta, e a execução perde o aluno no menor dos dois prazos.
- **Testes da mudança.**
  - Aos 7 meses o aluno sai do consumo e da execução; aos 5 meses fica.
  - A execução do professor com 7 meses não é tocada.
  - Uma `entrada` com mais que a tarefa fica só com a tarefa.
  - Dois jobs ao mesmo tempo levam linhas diferentes, inclusive a execução que as duas categorias alcançam.
  - O teste de plano confirma que o lote desce pelo índice parcial `execucao_agente_do_tutor_a_anonimizar_idx`.
- **Recomendações da rodada anterior:**
  - A 3 foi aplicada (`/home/joaquimdp/Documentos/git/Educa.ia/docs/avaliacao-de-modelos.md`, seção 3).
  - A 1 foi para o `TODO.md` com dono e momento.
  - A 2 foi recusada com motivo no `4_task.md`, e o motivo se sustenta: com 40 alunos semeados, o lote precisa da ordem por idade, e só o índice novo a dá.
- **Reenvio da chave.** A releitura em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ia/execucao.repository.ts:130` filtra por `solicitada_por` e pelo ano em curso. Para uma execução já anonimizada, o reenvio dá `NAO_ENCONTRADO`, e não execução nova nem dado de outro usuário. O que falta é o teste disso, e ele já está no `TODO.md`.

Recomendações:
1. A anonimização não exclui execuções `pendente` ou `rodando`. Na prática isso não acontece: com prazo de meses, o `falharInterrompidas` e o retry do BullMQ fecham a execução muito antes. Mas se o worker pegasse uma dessas depois de anonimizada, ele leria uma `entrada` só com a tarefa. Vale uma linha no comentário de `execucao-agente.ts` dizendo que esse caso é aceito e que a execução terminaria em `falhou`, nunca rodaria com entrada vazia. A alternativa é restringir os dois alvos a `estado in ('concluida','falhou')`.
2. A releitura por chave do Tutor, se existir um caminho próprio para ela, deve cair no mesmo teste de reenvio que o `TODO.md` já registra para o Assistente, para que nenhum dos dois fluxos fique sem prova.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-06 12:15:58 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum novo. O diff não toca `nota`, `Nota.aprovar` nem o lote de correção. As escritas novas são cinco instruções `update` de anonimização e não mexem em `nota`. Todos os caminhos continuam com autor humano? sim

Decisão autônoma sobre aluno: ausente

Aprovação registrada: ok
- A anonimização mantém em `execucao_agente` a linha, o estado, o `resultado`, o `erro` e as sete FKs que apontam para ela.
- `entrega.decidida_por`, `decidida_em` e `atividade_aplicada.aplicada_por` não são tocados.
- O teste "o que fica" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:1225`) agora semeia a entrega aprovada. Ele confere que estado, autor e data são iguais antes e depois do expurgo, e que a soma da governança não muda.
- Com isso, "o que a IA gerou, quem aprovou, quando" continua respondendo depois do prazo (regra 70, item 6).

Supervisão do tutor: ok
- A execução do Tutor perde o aluno no prazo de `consumo_por_aluno`, que nunca passa do prazo da conversa do Tutor. Quando isso acontece, `mensagem_tutor` e `sinal_tutor` já saíram pelo prazo deles, então a anonimização não tira nada do que o professor acompanha em sala nem do registro e resumo de casa.
- A execução anonimizada para de responder pela chave, porque a releitura filtra por `solicitada_por` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/tutor/tutor.repository.ts:330`). Assim nada fica ligado ao aluno sem que o professor veja.
- A exceção da D47 não aparece em nenhum outro agente.

Autonomia declarada e visível: sim. O diff não toca nível nem função de agente.

Bloqueantes: nenhum.

Itens 7, 8 e 9:
- **Vigilância (item 7):** não entra nenhum campo, sinal ou inferência sobre o aluno. O diff só anula colunas de pessoa.
- **Medir o professor (D45, D64):** sem ranking, sem métrica nova e sem leitor novo de `artefato.criado_por`. O efeito colateral que existia, a contagem do grupo mínimo da série no ano encerrado, está declarado no comentário de `#serieComGrupoMinimo` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/governanca/governanca.repository.ts:115-116`), como pedi.
- **Conversa do professor com o chat:** continua fora do alcance da coordenação. O texto do modelo é anulado no prazo e nenhuma rota o devolve.

Discursiva e redação (D46/D55): o diff não cria campo, tela nem prompt.

As três correções que pedi na rodada anterior foram feitas:
1. O teste "o que fica" semeia a entrega aprovada e confere que ela fica igual (linhas 1243-1256 e 1294).
2. O comentário do grupo mínimo diz que a contagem só vale no ano em curso.
3. `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md` diz que a execução aberta e vencida é anonimizada e não volta a rodar.

Recomendações:
- Uma entrega ainda `pendente` cuja execução foi anonimizada continua aprovável, o que está certo, porque a aprovação não depende de `solicitada_por`. Falta um teste de integração que prove isso: aprovar ou rejeitar com justificativa uma entrega pendente depois que a execução dela foi anonimizada. Fica para o `/validar`.
- Na tela de auditoria do dossiê (D61), vale dizer que "quem pediu" some no prazo e "quem aprovou" fica, para a coordenação não ler a ausência como falha de registro. É texto e fica para o `/retro`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-06 12:16:26 · `tasks/prd-lgpd-e-titular/4_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: `execucao_agente.solicitada_por` e `execucao_agente.entrada` (agora também pelo alvo novo `execucao_agente_do_tutor`, que só pega a execução do Tutor, onde quem pediu é o aluno); `consumo_ia.aluno_id`, `entrada` e `saida`; `artefato.criado_por`. O único campo novo é `execucao_agente.anonimizada_em`, uma data sem pessoa. Nada mudou no que se coleta.

Fora da tabela de dados do docs/lgpd.md: nenhum. As linhas da execução, do consumo por aluno e da autoria em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md` agora batem com o código:
- A execução do Tutor perde o aluno "no menor dos dois prazos".
- O consumo por aluno anula também o aluno da execução a que o consumo aponta.
- A autoria avisa que `titulo` e `conteudo` ficam até a troca de nome da 15.0.

Autorização por objeto: ok. Esta tarefa não tem rota. O alvo novo recebe a escola por `exigirEscolaDoContexto()` e a aplica duas vezes: na subconsulta e no update de fora. Toda leitura por `solicitada_por` filtra pelo usuário do contexto, então a execução anonimizada não responde a ninguém.

Logs: limpos. O processador só passou a enviar `fuso: janela.fuso` ao lote e continua logando só `tipo` e as contagens.

Auditoria: presente. `expurgo_execucao` recebe uma linha por categoria, e a contagem de `consumo_por_aluno` soma os consumos e as execuções do Tutor. A execução guarda `anonimizada_em`. A linha, o `resultado` e as FKs ficam, então "o que a IA gerou e quem aprovou" continua respondendo.

Envio externo: nenhum envio novo. O lote só reduz o que já está gravado.

Seed/fixture: sintético ("Texto sintético", "Aluno sintético do expurgo", "Ana Sintética").

Bloqueantes: nenhum. A correção exigida na 1ª rodada foi feita por inteiro:
- **Alvo próprio:** `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` tem `consumo_por_aluno: ['consumo_ia_aluno', 'execucao_agente_do_tutor']`. O alvo novo usa o mesmo update da execução, só com `funcao = 'tutor_com_o_aluno'`, `anonimizada_em is null`, `order by criada_em` e `for no key update skip locked`. Ele roda no prazo efetivo de `consumo_por_aluno`, que já leva a trava da `conversa_tutor`. Como o alvo `execucao_agente` continua rodando no prazo dele, a execução do Tutor perde o aluno no menor dos dois prazos.
- **Índice:** o índice parcial `execucao_agente_do_tutor_a_anonimizar_idx (escola_id, criada_em)` está no schema e na `0026_anonimizacao.sql`, e o teste do plano o cobre.
- **Filtro por função:** conferi que só o Tutor leva o aluno à execução e ao consumo. `FUNCOES_COM_ORCAMENTO_POR_ALUNO` em `packages/nucleo/src/ia/provedor.ts:33` tem só `tutor_com_o_aluno`, e a execução nasce com o usuário do contexto (`apps/api/src/ia/execucao.repository.ts:108`). Por isso o filtro por função cobre o caso.
- **Teste exigido:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-da-escola.int.test.ts:1315`. Com `conversa_tutor = 6`, o consumo ligado à execução tem `{ noConsumo: null, pelaExecucao: null }` aos 7 meses e mantém o aluno nos dois campos aos 5. A execução do professor de 7 meses fica, e a `entrada` com mais que a tarefa vira só `{ tarefa }`. O helper agora cria o consumo do Tutor já ligado à execução, como em produção, e `EXPURGADA.consumo_por_aluno` confere essa ligação em todo `it.each` do prazo.
- **Documentos:** a linha da execução em `docs/lgpd.md`, a seção 3 de `techspec.md` (catálogo, linha 51, e travas, linhas 59-62) e `cenarios.md` (RF4, prazo) estão atualizados.

Recomendações:
- **Filtro por nome de função:** se outra função passar a ser pedida pelo aluno, ela precisa entrar nesse filtro, ou o aluno volta a ficar além do prazo da conversa. A techspec (linhas 203-206) já registra isso. Vale pôr um teste que leia `FUNCOES_COM_ORCAMENTO_POR_ALUNO`, ou o catálogo de funções, e confira que cada função pedida pelo aluno tem índice e alvo de anonimização. Assim isso deixa de depender de alguém lembrar.
- **`resultado` da execução do Tutor:** depois de anonimizada, ela continua com ids de `mensagem_tutor`. Hoje isso não traz o aluno de volta, porque a mensagem sai no prazo da `conversa_tutor`, que é no máximo o do consumo. Vale uma linha na techspec dizendo que essa garantia depende da trava `consumo_por_aluno ≤ conversa_tutor`, para ninguém afrouxar a trava sem ver o efeito.

Pergunta de fechamento: responde. O que o sistema guarda sobre um aluno e o que foi enviado ao modelo seguem rastreáveis por `consumo_ia`, pelo campo `envio_externo`, e por `execucao_agente`, enquanto estão no prazo. Depois do prazo que a escola configurou, nenhuma das duas tabelas leva mais ao aluno.
