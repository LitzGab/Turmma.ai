# Correção — três listas fechadas de teste que a 11.0, a 13.0, a 14.0 e a 15.0 não atualizaram estão vermelhas em `873a1ab`

**Origem:** portão completo rodado à mão sobre `873a1ab` (15 de 19 tarefas), com o andar parado, em 10/10/2026: `test` com 2 vermelhos de 4.747 e `infra` com 1 de 41; tipos, lint e e2e (564) verdes. Registro no térreo, em `.processo/suites-completas-873a1ab.md`; triagem do Arquiteto do caso do Assistente em `.processo/ordens/triagem-sentinela-da-conversa.md`.
**Subagentes obrigatórios:** `privacy-guardian`, `conformidade-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. A correção altera 3 arquivos de teste fora de `tasks/` e não toca `.github/`, `tools/ci/` nem `tools/processo/`: abaixo do limite do passo 5, sem `revisor-geral`. -->

## Sintoma

Três testes de lista fechada falham, e nenhum deles é de uma regra que o código quebrou: o código está certo, e a lista do teste
ficou do que existia antes do F3.

1. `apps/api/test/retencao.int.test.ts` › `permissão: aluno, professor e a coordenação sem MFA não chegam a nenhuma rota de /v1/privacidade; a coordenação chega`
   (linha 389): a lista das rotas que não são GET não tem `POST /v1/privacidade/pedidos/:id/cancelar`.
2. `apps/api/src/assistente/assistente.int.test.ts` › `fora de teste, só o repository da conversa e a leitura da execução de quem pediu tocam a thread e as mensagens do Assistente`
   (linha 321): o teste espera dois arquivos e acha um terceiro, `apps/api/src/privacidade/titulares.repository.ts`.
3. `infra/test/metricas.int.test.ts` › `permissão: nenhuma série tem rótulo de usuário nem o id do usuário em rótulo algum, e escola_id só aparece nas métricas da lista fechada…`
   (linha 233): a lista não tem `horasDoArquivoEmPreparacao` nem `horasDaEliminacaoVencida`.

## Fora desta correção

Nada: nenhuma tarefa em curso (a 16.0 ainda não começou). O `tasks/prd-lgpd-e-titular/estado.md` alterado na árvore é do Orquestrador
e entra no registro desta correção, a pedido dele.

## Causa

O portão da tarefa roda os testes de integração e de infra que **a árvore alterou**. As tarefas abaixo mudaram o conjunto que a lista
descreve e não alteraram o arquivo do teste que o fecha, então o portão delas não o rodou, e só o portão completo o pegou:

| Caso | Tarefa | Commit | O que entrou e a lista não sabia |
|---|---|---|---|
| 1 | 14.0 | `ecd69c1` | `POST /v1/privacidade/pedidos/:id/cancelar` (`privacidade.controller.ts`, `@Permite('privacidade_pedidos', 'cancelar')`) |
| 2 | 11.0 | `399fedc` | `TitularesRepository.contagemPorCategoria`, que conta `mensagem_agente` com `thread_agente` na categoria `conversa_professor` |
| 3 | 13.0 e 15.0 | `b6a996d`, `873a1ab` | `arquivo.horas_em_preparacao` e `eliminacao.horas_vencida`, ambas em `METRICAS_COM_ESCOLA` (uma série por escola) |

O caso 2 foi triado pelo Arquiteto como **lista, não desenho nem produto**: a Tech Spec (seção 5, "Prévia (D64)") previu a contagem, e
a coordenação não vê a quantidade de mensagens de professor nenhum. As duas chamadas de `contagemPorCategoria` são `previaDoTitular`
(só aluno: com `papel === 'professor'` a função volta antes, sem contagem) e `meusDados` (a própria pessoa, pelo id da sessão). A
consulta conta linhas pelo dono da thread e não lê `conteudo`.

## Teste que reproduz

Os três já são os testes vermelhos: a correção é a lista deles. Rodados isolados antes de editar, sobre `873a1ab`, ficaram vermelhos
pelo motivo do registro, e depois da edição os arquivos inteiros passam:

| Arquivo › caso | Antes | Depois |
|---|---|---|
| `apps/api/test/retencao.int.test.ts` › `permissão: aluno, professor e a coordenação sem MFA…` | vermelho: recebeu `POST /v1/privacidade/pedidos/:id/cancelar` a mais | verde (arquivo inteiro, 14) |
| `apps/api/src/assistente/assistente.int.test.ts` › `fora de teste, só o repository da conversa, a leitura da execução…` | vermelho: recebeu `titulares.repository.ts` a mais | verde (arquivo inteiro, 25) |
| `infra/test/metricas.int.test.ts` › `permissão: nenhuma série tem rótulo de usuário…` | vermelho: recebeu `arquivo_horas_em_preparacao` e `eliminacao_horas_vencida` a mais | verde (arquivo inteiro, 6, 114 s) |

**A sentinela do Assistente continua com dente**, pelas duas mutações que a triagem do Arquiteto pediu e pelas três da guarda de forma que a rodada 1 exigiu:

- tirar `titulares.repository.ts` da lista: é o vermelho de antes, acima;
- escrever `m.conteudo is not null` na consulta de `conversa_professor` de `contagemPorCategoria`: o caso fica vermelho com
  `a contagem do titular lê `conteudo` da mensagem do professor`. A mutação foi desfeita (`git checkout` do arquivo; a árvore não
  tem código de produção alterado);
- na consulta de `conversa_professor`, `count(*)::int from mensagem_agente m` trocado por `m.* from mensagem_agente m`: o caso fica
  vermelho, pela asserção da forma (`a leitura de `mensagem_agente` no repository do titular não é a contagem`). Desfeita com
  `git checkout -- apps/api/src/privacidade/titulares.repository.ts`;
- `const lida = mensagemAgente` acrescentada no início de `contagemPorCategoria`: vermelho, pela asserção do identificador do
  drizzle (`o repository do titular usa a tabela da conversa do professor pelo drizzle`). Desfeita com `git checkout`;
- uma segunda consulta, `` const outra = sql`select * from mensagem_agente` ``, acrescentada antes de `const contadas`: vermelho, pela
  asserção das duas ocorrências da tabela (`o repository do titular lê a mensagem do professor em mais de um lugar`: 2 em vez de 1).
  Desfeita com `git checkout`. Como as asserções param na primeira que falha, a do `*` não foi a que acusou em nenhuma das três;
  isolada, com `` sql`select * from usuario` `` no lugar (uma ocorrência só da tabela, e a forma da contagem intacta), ela acusa
  (`o repository do titular seleciona colunas da conversa do professor com `*``). Desfeita com `git checkout`.

Sem mutação, o caso passa.

## Correção

Só teste. Nada em código de produção, na `techspec.md`, no `prd.md` nem no `cenarios.md`.

- `apps/api/test/retencao.int.test.ts`: a lista das rotas que não são GET ganha `POST /v1/privacidade/pedidos/:id/cancelar`, na ordem
  do controller, e o comentário diz onde a permissão do cancelamento é provada (`eliminacao-agendada.int.test.ts`, "só a coordenação
  cancela": professor e aluno recusados, pedido intacto).
- `apps/api/src/assistente/assistente.int.test.ts`: a lista ganha `apps/api/src/privacidade/titulares.repository.ts`, por último (a
  ordem é a do `.sort()`), com o comentário de por que ele está ali: conta as linhas do titular para o "Meus dados" da própria
  pessoa e para a prévia de aluno, e a prévia de professor não chega a ele (D64). O mesmo caso passa a exigir que esse arquivo, sem
  comentários (a mesma limpeza que a varredura usa, agora na função `semComentarios`), não tenha `conteudo`, não use a tabela por identificador do drizzle, a leia uma vez só, na forma `count(*)::int from mensagem_agente m`, e não selecione com `m.*` nem `select *`: ele conta, e nunca lê o
  que o professor escreveu. Título e mensagem do `expect` acompanham.
- `infra/test/metricas.int.test.ts`: a lista fechada ganha `horasDoArquivoEmPreparacao` (13.0) e `horasDaEliminacaoVencida` (15.0),
  pelos mesmos nomes de `NOMES_NO_PROMETHEUS`, e o comentário e o título do caso as citam.

Não há mais lista fechada vermelha conhecida do F3: o `packages/nucleo/src/telemetria/metricas.test.ts` (unidade, que cobre a mesma
`METRICAS_COM_ESCOLA`) já tinha as duas, e `infra/test/alertas.test.ts` e `painel.test.ts` já as conhecem.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-10 09:35:03 | 2026-10-10 09:36:18 | `test-engineer` | 1 | REPROVADO | a1842c77a480132c1 |
| 2026-10-10 09:36:24 | 2026-10-10 09:37:09 | `conformidade-reviewer` | 1 | APROVADO | abf098452768ea99c |
| 2026-10-10 09:36:22 | 2026-10-10 09:37:30 | `privacy-guardian` | 1 | APROVADO | a5be52675cb864521 |
| 2026-10-10 09:44:07 | 2026-10-10 09:45:01 | `test-engineer` | 2 | APROVADO | a6f507c494ab3f780 |
