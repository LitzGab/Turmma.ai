# Achados das revisões — `tasks/prd-reengenharia/8_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 14:01:53 · `tasks/prd-reengenharia/8_task.md`

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

Como cheguei a isso:
- **Contexto da escola fora da requisição.** As três portas de IA (suspensão, orçamento e consumo) só são chamadas na API. A execução depois do 202 roda dentro de `executarNoContexto(contexto, …)` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ia/agendador-de-execucoes.ts:99`, e o executor do núcleo também tem contexto (`packages/nucleo/src/ia/executor.ts:174`). Worker, realtime e despachante não usam essas portas, então nenhum job perde a escola por causa da mudança.
- **Duas instâncias e o mesmo objeto atendendo A e B.** Os repositories registrados uma vez só em `ia.module.ts:63-68` leem a escola a cada chamada e não guardam nada na instância. O teste de `Promise.all` com A e B intercalados (`ia.int.test.ts:626`) prova isso. Ele usa o freio de 1 nas duas escolas e a suspensão só em B, então uma escola herdada da outra apareceria.
- **Degradação.** Sem escola no contexto, a suspensão falha fechada e devolve `IA_INDISPONIVEL` tipado, antes do adaptador, do orçamento e do consumo. A falha do orçamento também vira `IA_INDISPONIVEL` dentro de `exigirOrcamento` (`provedor.ts:158-179`). O aluno não recebe erro cru.
- **Carga.** O custo novo é uma leitura do `AsyncLocalStorage` por porta. Não há query nova: as cláusulas de escola continuam as mesmas e a escola só passa a vir do contexto.
- **Testes.** Rodei `provedor.test.ts` e `repositories-com-escopo.test.ts` na unidade: 96 de 96 passaram. Os `@ts-expect-error` das três portas estão em `provedor.test.ts:146-150`. Os testes de integração não rodei, porque precisam do banco. Nenhum teste chama provedor pago.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ia/ia.int.test.ts:568` usa `set local session_replication_role = replica`, que só funciona com papel superusuário no Postgres. Se a esteira ou o banco de teste rodar com papel restrito, o caso "em A, a turma de B não infla o pacote" quebra por ambiente e não por regra. Vale registrar essa dependência ou montar o estado sem desligar as FKs.
- `tutor.service.ts:179` e `:397` chamam `this.orcamento.consultar` direto. Sem escola no contexto, o `Error` sem tipo de `exigirEscolaDoContexto` sairia como 500, e não como erro de IA tipado. Atrás da guarda de sessão isso não acontece. É defesa extra, não bloqueia.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 14:02:01 · `tasks/prd-reengenharia/8_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova. Nas tabelas lidas ou gravadas pela tarefa, o escopo vem do contexto: `suspensao_de_funcao`, `consumo_ia`, `mensagem_tutor`, `configuracao_operacional_escola`, `vinculo` e `execucao_agente`. Ids continuam UUID.

Queries verificadas:
- `apps/api/src/ia/suspensao.repository.ts:17`: `estaSuspensa` pega a escola em `exigirEscolaDoContexto()` antes de ler.
- `apps/api/src/ia/consumo.repository.ts:16`: `escolaId` vem do contexto. O tipo `ConsumoDeIa` não tem mais o campo.
- `apps/api/src/ia/orcamento.repository.ts:42`: chama `exigir…` antes do retorno antecipado. As três cláusulas (`configuracaoOperacionalEscola`, `vinculo` e `mensagemTutor` em `trocas`) usam a escola do contexto, e `consulta.escolaId` sumiu.
- `packages/nucleo/src/ia/{suspensao,consumo}.ts`: as versões em memória também leem o contexto.
- `packages/nucleo/src/ia/provedor.ts:101`: a conferência entre `pedido.escolaId` e o contexto continua. Sem contexto, a chamada falha fechada pela porta da suspensão (`IA_INDISPONIVEL`) antes do adaptador, do orçamento e do consumo.
- Chamadores (`agendador-de-execucoes.ts:78`, `conferencia-de-funcao.ts:15`, `tutor.service.ts:179/195/313/355/397`): nenhum passa mais a escola. A única chamada a `ia.gerar` em `apps/` (`agendador-de-execucoes.ts:101`) roda dentro de `executarNoContexto`. Nenhum endpoint passou a receber `escolaId` do cliente.
- `tools/guardas/escopo-dos-repositories.ts`: as três entradas saíram de `REPOSITORIES_SEM_ESCOPO`, e o teste da lista exata acompanha. Nenhum `@SemEscopo()` novo.

Teste de isolamento: presente e efetivo. Tirei mentalmente cada cláusula, e cada teste quebra:
- Sem `suspensaoDeFuncao.escolaId`, no contexto de A a suspensão vigente de B aparece, e `false` vira `true`.
- Sem `mensagemTutor.escolaId`, as 2 perguntas do aluno de B contam em A, e A passa a recusar.
- Sem `configuracaoOperacionalEscola.escolaId`, qualquer linha que vier primeiro contradiz os limites diferentes de A (1) e de B (3). O teste quebra sempre, não só às vezes.
- Sem `vinculo.escolaId`, o pacote de A sobe para 2 ou mais com os alunos de B, e o esgotado vira permitido. O estado com a FK desligada é o que torna essa cláusula provável.
- Se a escola for guardada na instância, o teste de concorrência quebra nos dois sentidos, porque as duas escolas estão recusadas e só B está suspensa.
- Se o `exigir` trocar a falha por um UUID qualquer, os testes sem contexto quebram.

Bloqueantes: nenhum

Recomendações:
- `packages/nucleo/src/ia/porta.ts`: `PedidoDeGeracao.escolaId` ficou redundante com o contexto. Ele só serve à conferência de `provedor.ts:101`. Vale avaliar, numa tarefa futura, tirar o campo e acabar com a fonte dupla.
- `packages/nucleo/src/ia/__fixtures__/contexto-da-escola.ts`: o envelope monta o contexto a partir de `pedido.escolaId`. Hoje está certo, porque os testes de isolamento usam `semContexto` ou contexto explícito. Mas o comentário do fixture deveria proibir o uso dele em teste que prova escopo.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-22 14:02:01 · `tasks/prd-reengenharia/8_task.md`

VEREDITO: APROVADO
Perfis usados: nenhum perfil novo. A tarefa só muda de onde as três portas (suspensão, orçamento e consumo) tiram a escola. Não há chamada de modelo nova, prompt novo nem tarefa de IA nova. Os perfis das tarefas existentes ficam como estavam (por exemplo, o `turnoDoTutor` no perfil rápido).
Custo estimado por professor/mês: sem custo novo. É uma refatoração de isolamento, com uma leitura a mais do `AsyncLocalStorage` por chamada, sem token adicional e sem log novo.
Prompt versionado: não se aplica. A tarefa não toca prompt, e o `promptVersao` segue como antes.
Validação de schema: não se aplica. A tarefa não altera a saída estruturada nem o caminho de erro do modelo.
Aprovação humana no caminho: não se aplica. A tarefa não cria entrega nem nota, e a regra de que a entrega nasce `pendente` não foi tocada.

O que conferi:
- **Escola só pelo contexto.** `estaSuspensa`, `ConsultaDeOrcamento` e `ConsumoDeIa` perderam `escolaId`. Os três repositories usam `exigirEscolaDoContexto()` a cada chamada (`suspensao.repository.ts:17`, `consumo.repository.ts:16`, `orcamento.repository.ts:42`).
- **Orçamento fail-closed.** O `exigirEscolaDoContexto()` fica antes do retorno antecipado `permitido: true` (`orcamento.repository.ts:42`), então uma função que não é o Tutor também lança sem escola.
- **Conferência de `pedido.escolaId`.** `provedor.ts:101` permanece. Sem escola no contexto, a porta de suspensão lança e `exigirFuncaoAtiva` converte o erro em `IA_INDISPONIVEL`. Isso acontece antes do adaptador, do orçamento e do consumo.
- **Nada ficou para trás.** Uma busca por todos os chamadores (`agendador-de-execucoes.ts:78`, `conferencia-de-funcao.ts:15`, `tutor.service.ts:179`, `:195`, `:313`, `:355`, `:397`, mais `provedor.ts:120` e `:163`) não encontrou nenhum que ainda passe a escola. O `tsc` da API passou sem erros.
- **Execução depois do 202.** Roda dentro de `executarNoContexto` no agendador, e existe uma mutação para isso.
- **Guarda.** As três entradas saíram de `REPOSITORIES_SEM_ESCOPO`, e o teste da lista exata foi atualizado. A `ia/execucao` continua na lista, como a tarefa manda.
- **Testes executados.** A unidade (`packages/nucleo/src/ia`, `tools/guardas` e `tools/ia`) passou com 1080 testes. A integração `ia.int.test.ts` passou com 37 testes. Os testes de integração rodam com Postgres real, e os de unidade com adaptador e fakes em memória. Nenhum chama provedor pago.
- **Cobertura da regra.** Há teste de isolamento por porta e de "sem contexto lança antes do banco", inclusive com `rotinaDoSistema` sem escola. Há `@ts-expect-error` nas três assinaturas, concorrência com `Promise.all` em A e B nas mesmas instâncias e o caso "turma de B não infla o pacote". Esse último monta o estado com as FKs desligadas (`session_replication_role = replica`) para a cláusula `eq(vinculo.escolaId, …)` ser provável.
- **Mutações.** As cláusulas de escola novas têm bloco de mutação. Conferi que as linhas citadas (`suspensao.repository.ts:22`, `orcamento.repository.ts:48`) existem como estão na tarefa.
- **Divergências.** Todas as divergências declaradas em `8_task.md` apontam para `onda-1a.md` T6, "Escolhas da 8.0", e o diff do `onda-1a.md` confirma esse registro.

Bloqueantes: nenhum

Recomendações:
- `packages/nucleo/src/ia/__fixtures__/contexto-da-escola.ts` envolve o provedor com `Object.create(ia)` e sobrescreve `gerar`. Funciona e está documentado, mas é um truque frágil se `ProvedorDeIa` passar a usar campos privados com `#`. Vale reavaliar se a classe mudar.
- A seção "Recomendações sem aplicar" de `8_task.md` está vazia, o que é aceito. O hook de revisões deve preenchê-la se a Mesa levantar algo.
- `PedidoDeGeracao.escolaId` continua obrigatório só para a conferência com o contexto. Quando a `ia/execucao` sair da lista, na 47.0, vale decidir se o campo some de vez.

Arquivos centrais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ia/orcamento.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ia/suspensao.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ia/consumo.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ia/ia.int.test.ts`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 14:02:17 · `tasks/prd-reengenharia/8_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

**O que conferi:**
- **Escopo.** As quatro subtarefas estão feitas. As três portas perderam `escolaId`, e `estaSuspensa`, `consultar` e `registrar` leem a escola com `exigirEscolaDoContexto()`. No orçamento, essa leitura vem antes do `permitido: true`. O `provedor.ts:101` ficou como a tarefa manda. As três entradas saíram de `REPOSITORIES_SEM_ESCOPO`, e o `ia/execucao` continua na lista, que é o que a 47.0 espera.
- **Chamadores.** Fora de teste, o único chamador de `gerar` é o `AgendadorDeExecucoes`, e ele roda dentro de `executarNoContexto`. O `#encaminhar` do Tutor grava o consumo dentro da requisição. Não sobrou nenhum chamador que dependa de rodar sem contexto.
- **Divergências.** As cinco estão declaradas em `8_task.md`, com a coluna da spec preenchida. Cada uma está escrita em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-1a.md`, em "Escolhas da 8.0", e esse arquivo faz parte da Tech Spec pelo cabeçalho de `techspec.md`.
- **Testes.** Os casos da tabela existem com os nomes que as mutações citam: isolamento por porta, os casos sem contexto, a concorrência com `Promise.all`, o `@ts-expect-error` nas três portas, a 61ª troca e a execução depois do 202.

**Recomendações:**
1. `onda-1a.md` está com 2.722 palavras, e o teto de `techspec.md` linha 4 é 1.500. O arquivo já passava do teto antes desta tarefa (2.442 no HEAD), e esta tarefa acrescentou cerca de 280. Vale enxugar ou partir o arquivo na próxima tarefa que mexer nele.
2. O helper de teste `packages/nucleo/src/ia/__fixtures__/contexto-da-escola.ts` vai parar no `dist` do núcleo, porque o `tsconfig.build.json` só exclui `src/**/*.test.ts`. A correção é acrescentar `src/**/__fixtures__/**` ao `exclude`.
3. A linha do JSDoc em `apps/api/src/ia/conferencia-de-funcao.ts:7` passou da largura das linhas vizinhas. Basta quebrar a linha como as outras.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 14:04:24 · `tasks/prd-reengenharia/8_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **Caminho feliz:** cada porta lê a escola do contexto. A suspensão responde pela escola do contexto, o orçamento conta só nela e o consumo grava nela.
- **Isolamento por porta:** a suspensão de B não vale em A, as perguntas de B não contam em A, cada escola lê o próprio limite, a turma de B não infla o pacote de A e o consumo de A não ganha linha em B.
- **Permissão e fail-closed:** sem escola no contexto, ou no contexto de rotina do sistema sem escola, cada porta lança antes do banco. O orçamento lança também para a função que não é o Tutor. O `gerar` sem escola não executa.
- **Casos de borda:** pedido em nome de outra escola com contexto A, a execução depois do 202 fora da requisição, e o Tutor no caminho HTTP sem passar `escolaId`.
- **Concorrência:** A e B ao mesmo tempo nas mesmas instâncias. Nenhuma escola pode herdar a escola de quem chegou primeiro.
- **Tipo e trava:** `escolaId` não volta às três portas, e as três saem de `REPOSITORIES_SEM_ESCOPO`.

Cobertos (rodei os testes e todos estão verdes: `provedor.test.ts`, a guarda e a medida do risco à vida com 107 testes; `ia.int.test.ts` com 37; `tutor.int.test.ts` com 45):
- **Isolamento:**
  - `ia.int.test.ts:341` › "função suspensa em B…"
  - `:519` › "as perguntas de um aluno de B não contam na escola A…"
  - `:598` › "A e B com limites diferentes…"
  - `:553` › "em A, a turma de B não infla o pacote…"
  - `:425` › "grava na escola do contexto…"
  - `:465` (mantido)
- **Fail-closed:**
  - `ia.int.test.ts:354`, `:435`, `:584` e `:590`
  - `provedor.test.ts:352`, mais o describe "as portas em memória leem a escola do contexto (8.0)"
- **Contexto A com pedido de B:** `provedor.test.ts:332`, que ficou como estava.
- **Execução depois do 202:** `ia.int.test.ts:684`, que tem uma mutação própria.
- **Concorrência:** `ia.int.test.ts:626`. É uma corrida de verdade: um `Promise.all` com 10 turnos sobre as mesmas três instâncias. As duas escolas ficam recusadas, então se uma herdar a escola da outra o teste fica vermelho nos dois sentidos. As três mutações "lê a escola uma vez e guarda" ficam vermelhas por isso.
- **Tipo:** `provedor.test.ts` › "o tipo das três portas não leva a escola". O `tsconfig` do núcleo inclui `src`, então o typecheck do portão confere os `@ts-expect-error`.
- **Trava:** `repositories-com-escopo.test.ts` › "é exatamente esta…".
- **Tutor sem `escolaId` no caminho HTTP:** `tutor.int.test.ts:650` › "a troca além do limite do dia é recusada sem gravar mensagem…".
- **Mantidos:** `ia.int.test.ts:365`, `provedor.test.ts:482` e `:394`.

Conferi a seção "Mutações" contra o `git diff`: toda cláusula nova tem o seu bloco. Isso vale para o `exigirEscolaDoContexto` nos três repositories, para o `exigir` do orçamento antes do retorno antecipado, para a escola passada ao `trocas` e para as três portas em memória do núcleo. Cada bloco cita um teste que chega à cláusula. Não há `.skip` nem mock que esconda a regra, e nenhum teste chama provedor pago: são o adaptador falso, o roteirizado e o servidor llama falso.

Bloqueantes: nenhum.

Recomendações:
1. **`8_task.md`, linha 56, "O Tutor recusa a 61.ª troca":** a linha não cita o teste pelo nome. Cite `tutor.int.test.ts › a troca além do limite do dia é recusada sem gravar mensagem…`. Esse arquivo não foi alterado, então o portão da tarefa não o roda e só a esteira prova o caminho de produção.
2. **`8_task.md`, linhas 55 e 59:** a tabela declara as mutações "apagar o `if`" e "devolvê-lo à assinatura", mas não há bloco para elas. Elas não são cláusula nova, então não bloqueia. Ainda assim, convém dizer na tabela quem prova cada uma: o teste `provedor.test.ts:332`, que já existia, e o typecheck.
3. **`provedor.test.ts`, teste "o tipo das três portas":**
   - O `@ts-expect-error` da suspensão é feito sobre `SuspensoesEmMemoria`, e não sobre a interface `SuspensaoDeFuncao`. Pela bivariância de método, a interface poderia receber `escolaId` de volta sem que esse `@ts-expect-error` acusasse. Hoje quem acusaria seriam os chamadores. Tipe a variável como `SuspensaoDeFuncao`.
   - O `expect(consumo.registros).toEqual([])` passa sempre, porque nada usa aquele `consumo`. Tire a linha.
4. **`ia.int.test.ts:553-325`:** se o `insert` falhar depois do `begin`, o `finally` devolve o cliente ao pool com a transação abortada. Ponha um `rollback` no caminho de erro antes do `release()`.
5. **`ia.int.test.ts:684`:** o cenário da linha 57 diz "grava na escola de quem pediu", mas o teste confere o `contextoVisto` e o estado da execução, não onde o consumo foi gravado. Acrescente a contagem de `consumo_ia` em A, e em B sem mudança.
6. **Bloco de mutação do `ConsumoRepository` que tira a linha `escolaId`:** ele fica vermelho pelo `NOT NULL` do banco, e não por gravar na escola errada. A troca de escola só é pega pela mutação de concorrência. Uma mutação que grave numa escola fixa, a de B, provaria o cenário pelo motivo certo.

Arquivos principais:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/8_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ia/ia.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/tutor/tutor.int.test.ts`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 14:14:56 · `tasks/prd-reengenharia/8_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. As cinco divergências registradas no documento continuam em `onda-1a.md` T6, "Escolhas da 8.0", e a rodada 2 não acrescentou nenhuma.

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

O que conferi nesta rodada:
- **Recomendações da 1ª rodada:**
  - O JSDoc de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ia/conferencia-de-funcao.ts` foi quebrado.
  - As duas linhas (X5, 8.0) estão de fato no `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/TODO.md`, e não ficaram só prometidas.
  - A tabela "Recomendações sem aplicar" tem destino ou motivo em cada linha.
- **A mutação nova de `consumo.repository.ts`** troca a escola pela primeira linha qualquer de `consumo_ia`. O teste agora grava B antes de A (`ia.int.test.ts:425-433`), e com isso fica vermelho em qualquer estado do banco:
  - **Tabela vazia:** grava `null` e o banco recusa.
  - **Primeira linha de A:** a gravação de B cai em A e a contagem de B falha.
  - **Primeira linha de B:** a gravação de A cai em B e a contagem de A falha.
  - **Primeira linha de outra escola:** as duas contagens falham.

  É a mutação "gravar a escola do registro" da tabela, provada de verdade.
- **A asserção nova do consumo no agendador** (`ia.int.test.ts:694,703`) fecha a linha "A execução depois do 202 grava na escola de quem pediu" pelo resultado, e não só pelo `contextoVisto`.
- **`provedor.test.ts:149-151`:** o `@ts-expect-error` agora vale contra a interface `SuspensaoDeFuncao`, e não contra a classe em memória. É o tipo que importa à regra.

Recomendações:
- `ia.int.test.ts:577-580`: se o próprio `rollback` lançar, ele esconde o erro do `insert`. Dá para usar `await cliente.query('rollback').catch(() => undefined)` antes do `throw erro`.
- `ia.int.test.ts:694`: o valor padrão `= 0` na desestruturação só serve se `contar` puder devolver `undefined`. Se ele devolve sempre número, tire o padrão. Se não devolve, ele esconde uma contagem que não veio.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 14:15:22 · `tasks/prd-reengenharia/8_task.md`

VEREDITO: APROVADO

Cenários exigidos: os da 1ª rodada, sem mudança. A escola vem do contexto nas três portas (suspensão, orçamento e consumo). B não vaza para A em nenhuma delas. Sem escola no contexto, cada porta falha fechada. Turma de B não infla o pacote de A. A execução depois do 202 grava no contexto de quem pediu. Turnos concorrentes de A e B nas mesmas instâncias. As três portas não aceitam `escolaId` no tipo. Mantidos: suspensa recusa antes de gravar, e consumo de A não aponta para execução de B.

Cobertos: todos. As seis correções da ordem `8_task-r1` foram feitas, e conferi cada uma no diff e na árvore:

1. **`provedor.test.ts:149-154`.** A suspensão está tipada como a interface `SuspensaoDeFuncao` (`suspensao.ts:13`, `estaSuspensa(funcao)`). O `@ts-expect-error` cai sobre a interface e não mais sobre a classe em memória. O `ConsumoEmMemoria` morto saiu. A rejeição `sem escola no contexto` continua provada.
2. **`ia.int.test.ts:694` e `:703`.** O teste do Agendador conta `consumo_ia` em A e B depois de `executor.ociosa()` e exige `[A+1, B]`. Agora há asserção sobre a escola do consumo gravado fora da requisição, e não só sobre o contexto visto.
3. **Teste da turma de B com a FK desligada.** O `rollback` no `catch` está lá e o cliente volta ao pool limpo. O comentário sobre o papel superusuário do banco de teste também está.
4. **Bloco de mutação do `ConsumoRepository` (`8_task.md:124-129`).** Ele lê a escola da primeira linha de `consumo_ia`. Com a ordem nova do teste (B grava antes de A, `ia.int.test.ts:428-432`), o teste fica vermelho em qualquer estado da tabela, e pelo motivo certo:
   - tabela vazia: `escola_id` nulo, e o insert falha;
   - primeira linha de B: a gravação de A cai em B, e `A+1` falha;
   - primeira linha de A ou de outra escola: a gravação de B cai fora, e `B+1` falha.
5. **Tabela de testes (`8_task.md:55`, `:56`, `:59`).** Cada linha cita o teste que a prova. As duas linhas "sem bloco" dizem por quê: a 55 não é cláusula nova, e a 59 é provada pelo `typecheck`, que reprova `@ts-expect-error` sem erro. Fica atendido o item 3 da auditoria, nenhum item colado em outro sem teste.
6. **Fixture `contexto-da-escola.ts`.** Ganhou o aviso de não usar em teste de escopo ou isolamento.

Rodei os dois arquivos. `npx vitest run packages/nucleo/src/ia/provedor.test.ts` deu 45 de 45, e `npx vitest run apps/api/src/ia/ia.int.test.ts` deu 37 de 37 contra o Postgres do compose de teste. Não há `.skip`, mock que esconda a regra, nem chamada a provedor pago. A concorrência continua com `Promise.all` de verdade (`ia.int.test.ts:676-677`).

Bloqueantes: nenhum.

Recomendações:
- `ia.int.test.ts:427`: o comentário "B primeiro: … a gravação que errasse de escola a acharia" sugere que a ordem é o que torna a mutação vermelha. Pela análise do item 4, ela fica vermelha em qualquer ordem. Vale reescrever o comentário dizendo o que a ordem garante de fato: a tabela não está vazia quando A grava, e a falha é de escola errada, não de `not null`.
- `8_task.md:128`: o `limit(1)` sem `order by` deixa a linha escolhida indefinida. Hoje o vermelho é garantido nos três casos, mas um `order by` deixaria o motivo da falha igual em toda execução e mais fácil de ler no portão.
- `ia.int.test.ts:694`: os padrões `= 0` na desestruturação de `[consumoAntesDeA = 0, consumoAntesDeB = 0]` não servem para nada, porque `contar` já devolve número. A forma da linha 426 (`[antesA, antesB]`) é mais limpa.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ia/ia.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/__fixtures__/contexto-da-escola.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/8_task.md
