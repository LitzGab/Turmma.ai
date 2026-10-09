# Achados das revisões — `tasks/correcoes/2026-10-09-plano-do-expurgo-intermitente.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-09 07:41:21 · `tasks/correcoes/2026-10-09-plano-do-expurgo-intermitente.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: com o volume de uma escola real, o lote de `usuario` (`instrucaoDasPessoasDesativadas`) usa `usuario_desativado_idx` e não varre a tabela.
- Borda 1: a tabela `usuario` nunca foi analisada. É o caso do banco limpo com `EDUCA_BANCO_NOVO=1` no portão.
- Borda 2: a estatística de `usuario` está velha, porque outros testes a encheram e desfizeram (`reltuples` baixo ou alto), ou porque a autoanálise rodou no meio.
- Borda 3: o volume semeado mexe só no alvo `usuario`. Os 12 alvos vizinhos da mesma tabela de casos não podem mudar de plano.
- Mutação: sem o índice parcial, ou com uma consulta que não sirva a ele, o teste tem de falhar.
- Isolamento e permissão: não se aplicam a uma correção que mexe só em teste. O dado semeado é da escola do teste, dentro de uma transação desfeita no fim.

Cobertos:
- **Caminho feliz:** a asserção não foi afrouxada. O teste continua exigindo `toContain('usuario_desativado_idx')` e nenhum `Seq Scan`, com `enable_seqscan = off`.
- **Bordas 1 e 2:** a correção semeia 2.000 alunos ativos e 30 desativados (todos com `desativado_em` antes do corte de 12 meses a partir de `QUARTA_1H`) e põe `usuario` no `analyze`. Com isso o plano não depende mais do que o banco tinha antes. Ler as 2.070 linhas da escola pela chave única `(escola_id, conta_id, papel)` passa a custar bem mais que ler as 30 pelo índice parcial. A causa do documento confere com o esquema: os dois índices começam por `escola_id`. A evidência no lugar do vermelho (a simulação com `reltuples` e as 30 execuções sem falha com `reltuples` em 100) é aceitável, porque o empate de custo não se reproduz de forma determinística.
- **Inserções válidas:** `conta_id` nulo é permitido para aluno (`usuario_conta_so_falta_para_aluno`). Na chave única, nulos não colidem. O `analyze` dentro da transação enxerga as linhas inseridas por ela e volta junto no `rollback`, como já faziam as outras tabelas do mesmo teste.
- **Borda 3:** no repository, só `PESSOAS_DESATIVADAS` lê `usuario`. `INSTRUCAO_DO_LOTE` exclui `'usuario'`, então o volume novo não altera o plano dos outros alvos.
- **Mutação:** sem `usuario_desativado_idx` e com a varredura sequencial proibida, o plano cai na chave única e a asserção falha. O teste continua provando a regra.
- Não há `.skip`, mock nem chamada de IA. O dado é sintético ("Aluno ativo sintético N").

Bloqueantes: nenhum.

Recomendações:
1. **Outra intermitência no mesmo teste.** O alvo `execucao_agente_do_tutor` (índice `execucao_agente_do_tutor_a_anonimizar_idx` fora do plano) falhou 1 vez nas 55 execuções e segue sem correção. O documento a declara fora de escopo e com motivo, mas ela pode voltar a derrubar um portão. Convém abrir uma correção própria logo, antes do pouso da spec.
2. **Lacuna antiga no teste, que esta correção não criou.** O teste de plano não pega um lote que perca o `escola_id = $1`: o índice parcial `(escola_id, desativado_em)` ainda seria escolhido sem a cláusula. Vale conferir se existe um teste de comportamento que prove que o lote de pessoas desativadas de uma escola não alcança as de outra. Se não existir, entra como item de isolamento da 5.0.
3. Eu não rodei o teste. A infra de teste estava de pé, possivelmente em uso pelo portão da 6.0, e uma execução minha podia colidir com ela. A aprovação vem da leitura do diff, do esquema e do repository.

Arquivos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts` (linhas ~890–899, e a asserção do alvo `usuario` na tabela de casos)
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:283` (`PESSOAS_DESATIVADAS`)
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql:23` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0005_ano_letivo_conta_usuario_sessao_registro_acesso.sql:71`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-09-plano-do-expurgo-intermitente.md`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-09 07:41:50 · `tasks/correcoes/2026-10-09-plano-do-expurgo-intermitente.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. O teste só grava linhas em `usuario` com colunas que já existem (`escola_id`, `papel`, `nome`, `desativado_em`), dentro da transação do teste, que termina em `rollback` no `finally`.

Fora da tabela de dados do docs/lgpd.md: nada. Não há migration nem coluna nova.

Autorização por objeto: não se aplica. Nenhuma rota, controller ou repository mudou. As 2.030 linhas entram na escola criada pelo próprio teste (`escolaNova()`), e as instruções do lote continuam recebendo `a.escolaId`.

Logs: limpos. A mudança não acrescenta nenhum log. Os nomes inseridos são sintéticos ("Aluno ativo sintético n", "Aluno desativado sintético n") e não aparecem em nenhuma saída.

Auditoria: não se aplica. Nenhuma ação auditável foi tocada, e nenhum código de produção mudou.

Envio externo: nenhum.

Seed/fixture: sintético. São nomes gerados por `generate_series`, numa transação desfeita no fim. Não há e-mail, CPF, nascimento nem foto, e nada vem de dump.

Bloqueantes: nenhum.

Recomendações:
- O `analyze usuario` roda dentro da transação, e o resultado do `analyze` é desfeito junto com o `rollback`. Por isso o teste não deixa estatística nova de `usuario` para os testes seguintes. É o que se quer, mas um comentário de uma linha dizendo isso evita que alguém "corrija" depois. Não é de privacidade: fica para o `infra-guardian` ou o `test-engineer`.
- A intermitência no alvo `execucao_agente_do_tutor`, que o documento deixou fora desta correção, precisa de uma correção própria. Ela não toca dado pessoal.

Pergunta de fechamento: esta correção não muda o que o sistema guarda sobre um aluno nem para onde isso vai, então a resposta continua a mesma de antes dela.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts (linhas 890 a 899)
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-09-plano-do-expurgo-intermitente.md

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-09 07:41:53 · `tasks/correcoes/2026-10-09-plano-do-expurgo-intermitente.md`

VEREDITO: APROVADO

Tabelas verificadas: `usuario`, só no teste. A correção não cria tabela nem migration. As 2.030 linhas novas levam `escola_id = a.escolaId` e nomes inventados ("Aluno ativo sintético N", "Aluno desativado sintético N"). Ficam dentro da transação que o `finally` desfaz com `rollback`, então nada sobra no banco para outros testes.

Queries verificadas: `instrucaoDasPessoasDesativadas(a.escolaId, prazo, 100)`, no caso `usuario` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts:915`. O código de produção não mudou. O teste continua exigindo `usuario_desativado_idx`, índice parcial que começa por `escola_id`, e nenhum `Seq Scan`. A asserção não ficou mais fraca. Antes, o planejador escolhia o índice pela estatística que o banco tinha naquele momento. Agora, com volume e `analyze usuario` (linhas 890 a 899), a escolha é estável e o teste passou a ser determinístico.

Teste de isolamento: presente e efetivo. Os testes de isolamento do expurgo da tarefa 5.0 não foram tocados. A mudança só reforça a prova de que o lote de `usuario` desce por um índice que começa pela escola.

Bloqueantes: nenhum.

Recomendações:
- `expurgo-da-escola.int.test.ts:921`: a verificação olha o nome do índice e a ausência de `Seq Scan`, mas não confere se a condição do índice usa `escola_id`. Conferir isso provaria o escopo no plano sem depender só do nome. Já era assim antes desta correção e fica para o `/retro`.
- A falha intermitente do alvo `execucao_agente_do_tutor` (`execucao_agente_do_tutor_a_anonimizar_idx` sumindo do plano), registrada em "Fora desta correção", precisa de uma correção própria. A causa provável é a mesma: estatística de tabela compartilhada com outros testes.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-09 07:41:53 · `tasks/correcoes/2026-10-09-plano-do-expurgo-intermitente.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (só o teste mudou; nenhum código de produção, migration, fila ou gateway foi alterado)
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: protegida. As 2.030 pessoas sintéticas e o `analyze usuario` ficam na mesma transação do teste, e o `finally` desfaz tudo. O `analyze` dentro da transação pega só `ShareUpdateExclusiveLock` em `usuario`. Esse lock não bloqueia a leitura nem a escrita dos outros testes que rodam junto, e a estatística volta a ser a anterior no rollback.
Índice e paginação: ok. O teste continua exigindo `usuario_desativado_idx` e proibindo `Seq Scan`. Conferi o índice parcial `(escola_id, desativado_em) where desativado_em is not null`, de `packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql:23`. O empate com `usuario_escola_conta_papel_unico` (`0005_...sql:71`) é explicado e passa a ser quebrado pelo volume, sem afrouxar o que o teste exige.
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica
Bloqueantes: nenhum
Recomendações:
- A falha intermitente do alvo `execucao_agente_do_tutor`, registrada em "Fora desta correção" do documento `tasks/correcoes/2026-10-09-plano-do-expurgo-intermitente.md`, continua aberta. Hoje o empate se quebra com volume, mas o plano ainda pode depender do que os outros testes deixam no banco, porque o `analyze` lê uma amostra aleatória da tabela que só cresce. Ela precisa de uma correção própria antes do pouso de `spec/lgpd-e-titular`, porque a esteira pode ficar vermelha por causa dela.
- Em `apps/worker/test/expurgo-da-escola.int.test.ts:890-893`, o comentário diz "custam o mesmo (0.27..8.29...)". Esse número vale para a versão e a configuração do Postgres de hoje. Melhor descrever a causa (empate com a escola estimada em uma linha) do que o custo exato, que vai ficar velho.
