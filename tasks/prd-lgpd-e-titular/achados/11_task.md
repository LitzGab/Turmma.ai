# Achados das revisões — `tasks/prd-lgpd-e-titular/11_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-09 19:03:51 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: REPROVADO

Cenários exigidos (tabela da 11_task.md e cenarios.md, RF10, RF13b, RF16, RF17, RF18 e RF19):
- **Isolamento e "mesmo que inexistente":** o titular de B, o id sorteado e o pedido sobre si mesmo (pelo id e pela conta) respondem igual a inexistente, inclusive o pedido registrado por outra coordenação.
- **Validação:** `chegouEm` futuro, nome vazio, só de espaço ou acima de 200, e termo com menos de 3 letras dão erro tipado.
- **Imutabilidade:** `escola_id` e `titular_id` não mudam; os checks e gatilhos do banco recusam a inserção crua inválida.
- **Corrigir nome:** muda o nome, audita sem ele, recusa fora de correção ou com o pedido fechado, e não toca o usuário de B da mesma conta.
- **Auditoria:** busca, prévia, lista e detalhe com finalidade; a busca não grava o termo.
- **D64 e homônimo:** a prévia do professor sai igual para quem usou e quem não usou a IA; homônimo por aluno ativo e por nome livre.
- **Aluno da lista:** a busca não o acha.
- **Rate limit:** 31ª busca dá 429; duas coordenadoras do mesmo IP têm 30 cada.
- **Isolamento das rotas:** prévia, busca, detalhe, concluir e corrigir de B; aluno transferido; mesma matrícula em outra escola.
- **Concorrência [P]:** mesma chave dá o mesmo pedido; clique duplo em concluir sem 500.
- **Permissão:** professor, aluno e coordenação sem segundo fator não chegam a nenhuma das sete rotas.
- **Log (RF17):** sem o nome atual, o anterior ou o termo da busca.

Cobertos: quase todos, e bem.
- O "mesmo que inexistente" compara o corpo inteiro.
- A imutabilidade é provada pelo gatilho.
- O corrigir-nome cobre B da mesma conta e a auditoria sem o nome.
- A auditoria compara a linha inteira.
- O D64 compara as duas prévias inteiras, sem o id e o nome.
- A contagem por categoria tem uma linha semeada em cada categoria.
- Aluno da lista, rate limit por usuário (e não por escola nem por IP), isolamento, transferido e mesma matrícula estão cobertos.
- A mesma chave roda em paralelo de verdade (`Promise.all`).
- O clique duplo em concluir tem a ordem forçada com `GatilhoDeParada`.
- O RF17 varre o log e as outras respostas.
- Nenhum `.skip`, e nenhum mock esconde a regra.

Bloqueantes:

1. **Dá para burlar o mínimo de 3 letras da busca, e o teste não pega.**
   - `packages/shared/src/privacidade/titular.ts:87` valida `z.string().min(MINIMO_DE_LETRAS_DO_TERMO)` sem `trim`, mas `apps/api/src/privacidade/titulares.repository.ts:102` faz `termo.trim()` antes de buscar.
   - Com `"   "` o termo vira `''`. No Postgres, `position('' in x)` é 1, então a busca devolve 20 pessoas quaisquer da escola. Com `"  ab"`, a busca é de 2 letras.
   - `pedido-titular.int.test.ts:314-315` só testa `'ab'` e `''`.
   - **Correção:** `z.string().trim().min(3)` (com `.max`). Somar os casos `'   '` e `' ab '` dando `ENTRADA_INVALIDA`, mais a linha nas Mutações.

2. **O teste de permissão não consegue falhar em três rotas.**
   - Em `pedido-titular.int.test.ts:449-451`, `ler`, `concluir` e `corrigir-nome` usam `randomUUID()`. Um professor com permissão por engano também receberia 404 (pedido inexistente), então o teste passaria igual.
   - `apps/api/test/retencao.int.test.ts:371-376` delega a este teste a prova da permissão das rotas com `:id`.
   - **Correção:** como em `incidente.int.test.ts:530`, registrar antes um pedido de correção pela coordenação e usar o id dele. Depois do laço, conferir que o pedido continua `recebido`, que o nome do titular não mudou, e que não há `pedido.lido`, `pedido.concluido` nem `pedido.nome_corrigido`.

3. **Duas regras novas da migration não têm teste nem linha nas Mutações.**
   - São o gatilho `pedido_titular_registrado_por_da_escola` (`packages/nucleo/drizzle/0032_pedido_titular.sql:57`, na inserção e no `UPDATE OF registrado_por`) e o check `pedido_titular_cancelado_so_com_data` (`:45`).
   - O `techspec.md` §4 diz que esses checks são "provados por inserção crua no teste", e não são.
   - **Correção:** na tabela de `pedido-titular.int.test.ts:704-716`, somar:
     - `registrado_por` de B, esperando `23503 pedido_titular_registrado_por_da_escola_fk`;
     - um `update` do `registrado_por` para alguém de B;
     - `cancelado_em` sem `cancelado_por`, esperando `23514 pedido_titular_cancelado_so_com_data`.
     - E as linhas correspondentes nas Mutações.

4. **A paginação da lista de pedidos não tem teste nem linha nas Mutações.**
   - Faltam prova para `gt(pedidoTitular.id, depoisDe)` (`apps/api/src/privacidade/pedidos.repository.ts:108`), para o `slice(0, consulta.limite)` (`privacidade.service.ts:206`) e para o `proxima` (`:213`).
   - Se a auditoria `pedidos.listados` gravasse `pedidos` em vez de `daPágina`, ela registraria um id que não foi mostrado, e nenhum teste falharia.
   - **Correção:** com 3 pedidos e `limite=2`:
     - a página 1 traz 2 itens e o `proxima`;
     - a auditoria leva exatamente esses 2 ids;
     - a página 2 (`pagina=<proxima>`) traz o terceiro, sem repetir e sem `proxima`.

5. **Três condições do homônimo não têm teste nem linha nas Mutações.**
   - São `u.desativado_em is null`, `u.papel = 'aluno'` e `l.estado = 'livre'` (`titulares.repository.ts:153` e `:158`).
   - A spec diz "outro aluno **ativo** … ou nome **livre** igual na lista", e só os dois `exists` foram mutados.
   - **Correção:** no teste da prévia do aluno, conferir `homonimo: false` com um aluno desativado do mesmo nome, com um professor do mesmo nome e com um `lista_nome` não livre (pendente) do mesmo nome. Cada mutação precisa ficar vermelha.

Recomendações:
- **Log que pode estar vazio.** `apps/api/test/captura-de-dado-pessoal.ts:30`: o `varrerLog` passaria mesmo com o log vazio. Afirmar que o log está vivo (por exemplo, `expect(log).toContain('http.erro')`, como `acesso-da-escola.int.test.ts:91`). A conferência do nome na resposta da busca não prova que o log foi capturado. Isso importa porque a 13.0 reusa o harness.
- **Chave de envio repetida.** `privacidade.service.ts:190`: quando a chave colide, o pedido devolvido vem do `daChave` sem a checagem de "sobre si mesmo" e sem comparar o `titularId`. A mesma chave com outro titular devolve o pedido de outra pessoa, possivelmente sobre quem pediu. Sugestão: recusar quando o titular ou o tipo diferem, e testar.
- **Estado do titular na busca.** `titulares.repository.ts:122`: o `estado: 'desativado'` da busca não é conferido. Dá para afirmar no teste do transferido (linha 811).
- **Data de "hoje" por fuso.** `privacidade.service.ts:177` e o teste (linhas 33-34) usam a data UTC, e o check usa o `current_date` da sessão do banco. Entre 21h e 0h em Brasília, uma data que já é futura no Brasil passa. Se o banco gerenciado rodar em `America/Sao_Paulo`, o check devolve 23514 e a API responde 500. Vale passar ao `infra-guardian` e ao `revisor-geral`.
- **Termo sem teto.** O termo não tem `.max`.
- **Corrigir-nome em preparação.** Corrigir-nome em `em_preparacao` não é testado: a mutação `estado <> 'concluido'` sobrevive.
- **Estado anterior na auditoria.** `pedido.concluido` grava `antes.estado` da leitura anterior ao `update`. Na corrida com o job da 13.0, ele pode não ser o estado que foi de fato trocado.
- **Clique duplo em corrigir-nome.** Duas chamadas em paralelo aplicam o nome e auditam duas vezes, e não há teste [P]. O desenho aceita isso; vale deixar escrito.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/captura-de-dado-pessoal.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts`
[… 3 linhas cortadas]

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-09 19:05:19 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa não toca `Nota`. A migration `0032_pedido_titular.sql`, os repositórios `pedidos.repository.ts` e `titulares.repository.ts` e o service só gravam em `pedido_titular`, em `usuario.nome` (pela correção de nome) e na auditoria. Todos com autor humano? Não se aplica, porque não há escrita em `Nota`.

Decisão autônoma sobre aluno: ausente. O pedido do titular é atendimento de LGPD que a coordenação registra e conclui à mão. Não há aprovação, reprovação nem encaminhamento. A eliminação não conclui por esta rota: o `where` de `concluir` a deixa de fora.

Aprovação registrada: ok. Não há saída de IA nesta tarefa. Cada passo humano vai para a auditoria com autor e data, na mesma transação: `pedido.registrado`, `pedido.concluido` (com o estado de antes) e `pedido.nome_corrigido` (sem o nome).

Supervisão do tutor: ok. O tutor não é tocado. A prévia do aluno mostra à coordenação só a contagem de `conversa_tutor` e `sinal_tutor`, nunca o conteúdo, e essa leitura fica auditada como `titular.previa_lida`, com finalidade fixa.

Autonomia declarada e visível: sim. Nenhum agente foi criado nem alterado, e a declaração existente continua igual.

O que conferi das regras desta tarefa:
- **D64 e regra 70, itens 8 e 9:** a prévia do professor tem formato próprio, sem contagem e sem período, só com `pessoa_desativada` e `vinculo_encerrado` (`apps/api/src/privacidade/privacidade.service.ts:205-206`, `packages/shared/src/privacidade/titular.ts:1216-1226`). A contagem por categoria, que inclui `conversa_professor`, `execucao_agente` e `texto_do_modelo`, só roda no ramo do aluno.
- **O teste que prova o D64:** `apps/api/test/pedido-titular.int.test.ts:495-527` semeia uso real de IA num professor, que vira o primeiro dado da fixture. Depois compara a resposta dele com a de quem não usou, campo a campo, e confere que nenhuma das quatro categorias de uso aparece. Se o ramo do professor for apagado, o teste falha.
- **Leitura nominal de professor:** a busca e a prévia pela coordenação gravam `titular.buscado` e `titular.previa_lida` com a finalidade `atender_o_pedido_do_titular`. Não há ranking, métrica nem nada ligado a decisão sobre o professor. A conversa dele com o chat não sai em nenhuma resposta.
- **Itens 7 e 8 (supervisão não é vigilância):** não há inferência de comportamento nem de emoção. O termo da busca não vai a log nem à auditoria.

Bloqueantes: nenhum.

Recomendações:
1. O cenário `tasks/prd-lgpd-e-titular/cenarios.md:225-226` diz que a prévia, a foto e o `GET pedidos/:id` saem iguais para os dois professores. Hoje só a prévia está provada nesta tarefa, porque a foto do compartilhamento nasce vazia. A 12.0 precisa provar com um teste próprio que o detalhe do pedido e a foto continuam iguais depois que o rastro externo entrar, já que é ali que o uso do Assistente com provedor externo pode aparecer.
2. A prévia do aluno mostra à coordenação a quantidade de mensagens do Tutor e de sinais. Isso está dentro da RF11 e da revisão da spec já aprovada, e a leitura é auditada. Ainda assim, vale a tela da 16.0 dizer que é uma contagem para atender o pedido, e não um indicador sobre o aluno. A contagem não deve aparecer fora do fluxo do pedido.
3. A titularidade da coordenadora ficou para a tarefa da eliminação: hoje o check só aceita `papel_titular` `aluno` ou `professor`. Ao ampliar, a prévia de um coordenador que também usa o Assistente precisa seguir a mesma regra da prévia do professor, sem contagem de uso.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/titular.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/auditoria/acoes.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0032_pedido_titular.sql`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts`

## tenancy-guardian · 1ª rodada · REPROVADO · 2026-10-09 19:06:05 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: REPROVADO

Tabelas verificadas: `pedido_titular` (0032 e schema). Tem `escola_id` NOT NULL com FK. Não tem `ano_letivo_id`, e está certo: o pedido é sobre a pessoa e não muda com o período. O id é UUID (`uuidv7()`). O único `(escola_id, chave_envio)` e os índices começam pelo escopo. O gatilho `exigir_usuario_da_escola` confere `titular_id` e `registrado_por`. O gatilho de imutabilidade cobre `escola_id` e `titular_id`.

Queries verificadas:
- `TitularesRepository`: `paraOPedido`, `contaDeQuemPediu`, `buscar`, `titularesParaOPedido`, `homonimo`, `contagemPorCategoria` (as 12 subconsultas e os joins por `escola_id`) e `#vinculosDe` (escola, ano em curso, e joins de turma e disciplina pela escola).
- `PedidosRepository`: `registrar`, `daChave`, `de`, `listar`, `concluir`, `corrigirNome`, `#um` e `#vários` (o leftJoin do `usuario` pela escola).
- Em todas, a escola vem de `exigirEscolaDoContexto()` e o autor de `identidadeDaRequisicao()`.
- Os corpos são `strictObject`, e a consulta paginada é `.strict()` com só `pagina` e `limite`. Nenhuma rota aceita `escolaId`.
- Na matriz, a rede ficou `nunca` nas 7 células. Não entrou nenhum `@SemEscopo`.
- O `PEDIDO_EM_ESTADO_INVALIDO` só sai depois do `#pedidoAlvo`, então não revela pedido de outra escola.

Teste de isolamento: presente e efetivo nas cláusulas principais, mas falta cobrir o `homonimo`. Tirar mentalmente o escopo de `paraOPedido`, `buscar`, `listar`, `de`/`#um` ou do leftJoin quebra `pedido-titular.int.test.ts:258` e `:771`.

Bloqueantes:

1. **`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts:153` e `:158`: o escopo do `homonimo` não tem teste.**
   - **O que está errado:** a regra está em SQL cru, com `u.escola_id = ${escolaId}` no primeiro `exists` e `l.escola_id = ${escolaId}` no segundo. Se uma das duas cláusulas sair, a prévia e o pedido de A passam a responder `homonimo: true` sempre que a escola B tiver um aluno ativo ou um nome livre na lista com o mesmo nome completo. Isso confirma a existência de um nome em outra escola (regra 10, itens 5 e 6).
   - **Por que o teste atual não pega:** nenhum teste quebra. `:529` usa nomes únicos gerados, só na escola A. `:789` põe o mesmo nome em B, mas não chama a prévia nem lê o `homonimo`. As Mutações (`11_task.md:118-119`) mutaram só os dois `exists` inteiros, nunca a cláusula da escola.
   - **Correção exigida:** no `describe` de isolamento, criar em B um aluno ativo com o mesmo nome completo do titular de A e, em outro passo, um `lista_nome` `livre` em B com esse nome. Nos dois casos, conferir que `previa(a.coordenacao, titularDeA)` volta com `homonimo: false` e que o pedido registrado em A volta com `homonimo: false` no detalhe. Acrescentar nas Mutações uma linha para cada cláusula (`u.escola_id` e `l.escola_id`), cada uma com o teste que ficou vermelho.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts:324` (`daChave`): nenhum teste prova a cláusula `eq(pedidoTitular.escolaId, …)`. Hoje o risco é baixo, porque a chave é UUID do navegador e o único é por escola. Mas sem a cláusula, uma colisão de chave em A devolveria o pedido de B que tivesse a mesma chave. Vale um teste com a mesma `chave_envio` gravada crua em B e repetida em A, mais a linha nas Mutações. Junto com isso, a colisão devolve o pedido sem a checagem de "sobre si mesmo" e sem comparar o titular. O `test-engineer` já levantou esse ponto; recusar quando o titular ou o tipo diferem.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0032_pedido_titular.sql`: `concluido_por` e `cancelado_por` não passam pelo `exigir_usuario_da_escola`. Hoje vêm do token, mas a 14.0 (cancelar) deveria acrescentar o gatilho, como no `registrado_por`.
- As cláusulas de escola em `contagemPorCategoria`, `#vinculosDe`, `titularesParaOPedido` e `contaDeQuemPediu` são redundantes (os ids já chegam no escopo) e não têm vermelho próprio. Declará-las como equivalentes nas Mutações, como já foi feito com o `corrigirNome`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-09 19:06:18 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As três divergências estão na `techspec.md` §4 ("Tarefa 11.0, como ficou no código") e no `cenarios.md` RF10.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes:

1. **A busca aceita termo sem nenhuma letra e devolve 20 pessoas quaisquer da escola.**
   - `packages/shared/src/privacidade/titular.ts:87` valida `z.string().min(MINIMO_DE_LETRAS_DO_TERMO)` sem tirar os espaços. `apps/api/src/privacidade/titulares.repository.ts:102` tira os espaços antes de buscar.
   - Com `"   "`, o termo passa na validação e vira `''`. No Postgres, `position('' in nome)` vale 1, então a busca casa com todo mundo e traz as 20 primeiras pessoas por nome, com matrícula e turmas. Com `"  ab"`, a busca roda com 2 letras.
   - O termo também não tem tamanho máximo.
   - O `test-engineer` já pediu esta correção, e o código não mudou desde a rodada dele.
   - **Correção:** `z.string().trim().min(MINIMO_DE_LETRAS_DO_TERMO).max(<teto>)`. Somar os casos `'   '` e `' ab '` dando `ENTRADA_INVALIDA` em `pedido-titular.int.test.ts:314`, e a linha nas Mutações.

2. **A data de chegada no futuro é conferida pelo dia em UTC, e não pelo dia no Brasil.**
   - `apps/api/src/privacidade/privacidade.service.ts:177` compara `chegouEm` com `new Date().toISOString().slice(0, 10)`.
   - Entre 21h e 0h em Brasília, o dia em UTC já é o seguinte. Nesse horário, a coordenação registra um pedido com a data de amanhã, e a regra "`chegouEm` futuro é recusado" (RF10, tabela da tarefa) falha. É dessa data que conta o prazo legal do atendimento.
   - O projeto já tem como saber o dia certo: o fuso da escola (`configuracao_operacional_escola`, `janela-letiva.ts`) e `FUSO_DO_USO`/`diaDeUso` (`packages/nucleo/src/uso/dia-de-uso.ts`). A Tech Spec §5 registra a mesma armadilha ("o dia de UTC já virou às 21h de São Paulo"). Usar o dia em UTC aqui é um segundo jeito de fazer o que o projeto já faz de outro.
   - O teste repete o erro: `HOJE` e `AMANHA` em `apps/api/test/pedido-titular.int.test.ts:33-34` também usam o dia em UTC.
   - **Correção:**
     - calcular "hoje" no fuso da escola, ou em `FUSO_DO_USO` com o helper existente;
     - fazer `HOJE` e `AMANHA` do teste usarem o mesmo fuso;
     - registrar na `techspec.md` §4 que o check `current_date` do banco é só a segunda camada, mais frouxa que a do código.

3. **O `test-engineer` não aprovou, e os bloqueantes dele seguem abertos.**
   - A tabela de Revisões da `11_task.md` tem só a 1ª rodada dele, REPROVADO às 19:03:51. Os arquivos não mudaram depois: o último é o teste, às 18:46.
   - Pela própria tarefa ("`test-engineer` aprovado primeiro"), a rodada do `revisor-geral` não vale enquanto ele não aprovar.
   - Continuam abertos:
     - o teste de permissão usa `randomUUID()` nas rotas com `:id` (`pedido-titular.int.test.ts:449-451`), então não consegue falhar;
     - o gatilho `pedido_titular_registrado_por_da_escola` e o check `pedido_titular_cancelado_so_com_data` não têm teste (`packages/nucleo/drizzle/0032_pedido_titular.sql:45` e `:57`);
     - a paginação da lista não tem teste (`pedidos.repository.ts:108`, `privacidade.service.ts:206` e `:213`);
     - três condições do homônimo não têm teste: aluno desativado, papel `aluno` e nome `livre` (`titulares.repository.ts:153` e `:158`).
   - **Correção:** fazer as cinco correções exigidas em `tasks/prd-lgpd-e-titular/achados/11_task.md` e obter APROVADO do `test-engineer` antes de uma nova rodada do `revisor-geral`.

Recomendações:
- **Chave de envio repetida.** Em `privacidade.service.ts:190`, quando a chave colide, o pedido devolvido vem do `daChave` sem passar pelo `#pedidoAlvo` e sem comparar o titular nem o tipo.
  - A mesma conta pode ser coordenadora e professora na mesma escola: a restrição única de `usuario` é por escola, conta e papel.
  - Então a mesma chave pode devolver o pedido sobre a própria pessoa, que em toda outra rota responde como inexistente, ou o pedido de outro titular.
  - Sugestão: recusar quando o titular ou o tipo diferem, aplicar a conferência de "sobre si mesmo" e testar.
- **Erro sem código.** `titulares.repository.ts:58` lança `Error` cru com o papel na mensagem. Como é uma invariante, sobe como 500 sem código; vale um erro tipado ou uma asserção.
- **Repositório criado duas vezes.** `privacidade.service.ts:221-223` cria `TitularesRepository` duas vezes.
- **Montagem descartada.** `privacidade.service.ts:210-211` monta o pedido inteiro (`#montarPedido`) e aproveita só cinco campos; dá para montar o item direto.
- **Identidade passada pelo service.** `pedidos.repository.ts:103` recebe do service quem pediu (`usuarioId` e `contaId`). `registrar` e `concluir` leem a identidade sozinhos; ler aqui também mantém um só jeito de fazer.
- **Estado anterior na auditoria.** `pedido.concluido` grava `antes.estado` lido antes do `update` (`privacidade.service.ts:237`). Na corrida com o job da 13.0, pode não ser o estado que foi trocado; dá para devolvê-lo no `returning` com o estado antigo.
- **Log que pode estar vazio.** `apps/api/test/captura-de-dado-pessoal.ts:30`: o `varrerLog` passa mesmo com o log vazio. Afirmar que o log está vivo antes de varrer, porque a 13.0 reusa o harness.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.controller.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/titular.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0032_pedido_titular.sql`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/pedido-titular.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/limite/` (chaves, guarda, limitador, decorator)
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/auditoria/acoes.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/permissao/matriz.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/permissao/matriz.expectativa.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/classificacao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/captura-de-dado-pessoal.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/retencao.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/cenarios.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md`

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-09 19:06:26 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: REPROVADO

**Campos pessoais tocados:**
- `pedido_titular`: `titular_id`, `registrado_por`, `concluido_por`, `cancelado_por`, `homonimo`, `nome_trocado` e as datas. A tabela não tem coluna de nome, matrícula nem texto.
- `usuario.nome`: muda pelo `corrigir-nome`.
- O que sai para a coordenação: o nome, o papel, a matrícula, as turmas e as disciplinas do titular, na busca, na prévia, na lista e no detalhe.

**Fora da tabela de dados do docs/lgpd.md:** nada. A linha "Pedido do titular" está em `docs/lgpd.md:101`, com finalidade, base legal e retenção. O registro já aprovado do aluno na `lista_nome` não guarda nome (check `lista_nome_aprovado_sem_nome`), então a correção do nome não deixa cópia antiga.

**Autorização por objeto:** falha em `POST /v1/privacidade/pedidos`, no caminho em que a chave de envio já existe (bloqueante 1). As outras seis rotas estão certas:
- O escopo de escola vem do contexto.
- O "sobre si mesmo" é conferido pelo id e pela `conta_id`.
- `idDoCaminho` faz o id malformado responder como inexistente.
- A matriz dá `nunca` para rede, professor e aluno.

**"Não encontrado" e "sem permissão":** respondem igual. O titular de outra escola, o próprio, o id sorteado e o pedido de outra escola dão todos `NAO_ENCONTRADO`.

**Logs:** limpos.
- O código novo não tem nenhuma chamada de logger.
- `filtro-global.ts:59-63` loga só status, código e o resumo do erro. Fica de fora o `detail` do Postgres, que traria a linha recusada.
- O teste RF17 varre o log atrás do nome atual, do nome anterior e do termo.

**Auditoria:** presente.
- As leituras `titular.buscado`, `titular.previa_lida`, `pedidos.listados` e `pedido.lido` levam a finalidade fixa e são gravadas na mesma transação.
- As ações `pedido.registrado`, `pedido.concluido` e `pedido.nome_corrigido` são gravadas sem nome.
- O termo da busca não vai para a auditoria.
- A exceção é a releitura pela chave colidida, que devolve um pedido sem `pedido.lido` (parte do bloqueante 1).

**Envio externo:** nenhum. A foto do compartilhamento nasce vazia e é preenchida na 12.0.

**Seed/fixture:** sintético. Os nomes saem de `nome('…')` e os ids de `randomUUID()`.

**Bloqueantes:**

1. **Com uma chave de envio já usada, o registro devolve o pedido de outra pessoa sem conferir de quem é.**
   - Onde: `apps/api/src/privacidade/pedidos.repository.ts:88-90` (`daChave` filtra só escola e chave) e `apps/api/src/privacidade/privacidade.service.ts:164` (`id === undefined ? await pedidos.daChave(...)`).
   - O que está errado: quando o `insert` colide, o service devolve o pedido daquela chave sem verificar se o titular é o do corpo, se quem registrou é quem está pedindo, nem se o titular é a própria pessoa (o "sobre si mesmo"). O controle "sobre si mesmo" foi aplicado ao `titularId` do corpo, não ao pedido que volta.
   - Consequências:
     - **Bug real:** a chave é sorteada por diálogo. Se a coordenadora troca o titular escolhido no mesmo diálogo e reenvia, recebe 201 com o nome e as turmas do primeiro titular. O pedido do segundo titular nunca é registrado, e um direito de titular se perde em silêncio.
     - **Ataque:** com a chave de outra coordenadora, a resposta traz o pedido dela, inclusive um pedido sobre a própria pessoa de quem chama. É exatamente o que a RF10 manda responder como inexistente.
     - Essa leitura também não grava `pedido.lido`.
   - O precedente do repositório faz o contrário: `execucao-agente.ts:16` ("depois de conferir que é de quem pede (a chave de outra pessoa responde como inexistente)"), `conversa.repository.ts:105` e `execucao-do-pedido.repository.ts:24` filtram por `solicitada_por`.
   - Correção exigida:
     - `daChave` passa a filtrar também por `registrado_por = identidadeDaRequisicao().usuarioId`.
     - No service, quando a chave colide, o pedido lido precisa ter o mesmo `titularId`, `tipo`, `solicitante` e `chegouEm` do corpo. Se não tiver, responde `NAO_ENCONTRADO` (ou `CONFLITO` tipado), sem devolver o pedido gravado.
     - Testes de integração:
       - a mesma chave com outro `titularId` não devolve o pedido do primeiro titular nem o nome dele;
       - a chave de um pedido registrado por outra coordenação responde igual a inexistente;
       - nos dois casos, nenhuma auditoria nova é gravada.
     - Uma linha nas Mutações para cada cláusula nova.

2. **O mínimo de 3 letras da busca se burla com espaço.** O `test-engineer` já cobrou isto, e aqui é bloqueante de privacidade também.
   - Onde: `packages/shared/src/privacidade/titular.ts:87` (`z.string().min(3)` sem `trim`) contra `apps/api/src/privacidade/titulares.repository.ts:102` (`termo.trim()`).
   - O que está errado: o termo `"   "` vira `''`, e `position('' in x)` é 1 no Postgres. A busca devolve então 20 pessoas quaisquer da escola, com matrícula e turma. O mínimo existe justamente para que a busca não liste a escola por um pedaço de nome.
   - Correção exigida:
     - `z.string().trim().min(MINIMO_DE_LETRAS_DO_TERMO).max(MAXIMO_DO_NOME_DO_TITULAR)`.
     - Testes para `'   '` e `' ab '` dando `ENTRADA_INVALIDA`, sem gravar `titular.buscado`.
     - Uma linha nas Mutações.

**Recomendações:**
- **Colunas do arquivo:** `packages/shared/src/privacidade/classificacao.ts:96` liga o arquivo por `registrado_por`, mas deixa fora `concluido_por` e `cancelado_por`. O precedente `suspensao_de_funcao` lista os dois autores. E a 9.0 deixou fora a coluna de coordenação porque "coordenação não é titular". Escolher um critério e aplicá-lo às três colunas.
- **Pergunta de fechamento, para a 13.0:** o arquivo da `auditoria` se liga só por `autor_usuario_id`. As leituras sobre o aluno ficariam fora do arquivo dele: `titular.previa_lida`, com `entidadeId` igual ao titular, e `titular.buscado`, com `depois.ids`. Decidir se "quem leu meus dados" entra no arquivo.
- **Log vivo:** em `apps/api/test/captura-de-dado-pessoal.ts:30`, afirmar que o log capturou alguma coisa, por exemplo `http.erro`, antes de varrer. A 13.0 reusa esse harness.
- **Data de hoje:** em `privacidade.service.ts:151` "hoje" é calculado em UTC, e o check do banco usa o `current_date` da sessão. Com o banco em `America/Sao_Paulo`, à noite a recusa vira 500 em vez de 400. Não vaza dado; vale levar ao `infra-guardian`.
- **Corrigir-nome em paralelo:** dois cliques ao mesmo tempo aplicam o nome e auditam duas vezes. Vale deixar escrito no techspec que isso é aceito.

**Arquivos auditados:**
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.controller.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/titular.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/classificacao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0032_pedido_titular.sql`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/auditoria/acoes.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/captura-de-dado-pessoal.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-10-09 19:06:29 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: APROVADO
Caminho quente tocado: migration (tabela nova). As rotas são só da coordenação e ficam fora da carga de segunda às 10h.
Rate limit: ok
Fila e prioridade: ok (nada demorado entra no request, e a tarefa não cria job)
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok (as rotas novas entram na medição HTTP que já existe, e a tarefa não cria alerta)

Bloqueantes: nenhum

Recomendações:
- **Índice para a contagem de `texto_do_modelo`.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts:179-181`, a contagem junta `consumo_ia` e `execucao_agente` pela coluna `execucao_id`, e essa coluna não tem índice. Rodei o `EXPLAIN` no banco de teste: o plano lê `consumo_ia_texto_a_anular_idx` com filtro só por `escola_id`, ou seja, varre todo o texto de modelo da escola a cada prévia de aluno. Hoje o volume tem teto, porque a retenção é de 3 a 12 meses e a prévia é rara, e o `statement_timeout` em produção é de 2 s. Antes da 13.0 reaproveitar essa contagem no arquivo do titular, vale um índice `(escola_id, execucao_id)` em `consumo_ia`, numa migration própria com `CREATE INDEX CONCURRENTLY`. O mesmo índice ajuda a checagem da chave estrangeira `consumo_ia_execucao_da_escola_fk` quando o expurgo apaga uma execução.
- **Clique duplo em corrigir nome.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts:140-152`, duas chamadas simultâneas aplicam o mesmo nome e gravam `pedido.nome_corrigido` duas vezes. O nome final fica certo, mas a auditoria sai duplicada. Para resolver, basta travar a linha do pedido na subconsulta (`for update`) ou dar ao `update` uma condição que só a primeira chamada satisfaça. Também pode ficar escrito como aceito, com um teste [P].
- **Estado anterior gravado em `pedido.concluido`.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts`, no `concluirPedido`, o `antes.estado` vem de uma leitura feita antes do `update`. Se o job da 13.0 mudar o estado no meio, a auditoria registra um estado que não foi o trocado. A correção é ler o estado de dentro do `update`, por exemplo `returning` de uma subconsulta ou `select … for update` antes dele.
- **"Hoje" em UTC no serviço e `current_date` no banco.** O `registrarPedido` calcula o dia em UTC, e o check `pedido_titular_chegou_em_nao_futura` usa o `current_date` da sessão. Se o banco gerenciado rodar em `America/Sao_Paulo`, das 21h à meia-noite de Brasília uma data que o serviço aceita é recusada pelo check com 23514, e a API responde 500. A correção é fixar o fuso nos dois lados, ou fazer o check com `(now() at time zone 'America/Sao_Paulo')::date` e o serviço com o mesmo fuso.
- **Termo de busca vazio.** O `termo` sem `trim` antes do `min(3)`, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/titular.ts:87`, deixa `"   "` virar `''`, e a busca devolve 20 pessoas quaisquer da escola. O `test-engineer` já exigiu a correção. Do lado da carga também falta um `.max` no termo.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-09 19:37:05 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: REPROVADO

Cenários exigidos (2ª rodada: as cinco correções da 1ª rodada mais o diff desde ela)
1. A busca com termo só de espaços, ou que fica com menos de 3 letras depois do `trim`, dá ENTRADA_INVALIDA.
2. A permissão nas rotas com `:id` é testada com um pedido que existe.
3. O gatilho `registrado_por` (inserção e `UPDATE OF`) e o check `cancelado_so_com_data` estão provados.
4. A paginação da lista é testada com 3 pedidos e limite 2.
5. O homônimo é testado nos casos desativado, papel diferente de aluno, estado diferente de livre, e outra escola.
6. Código novo desta rodada:
   - A chave de envio repetida só devolve o mesmo pedido: mesmo titular, tipo, solicitante e chegada, e registrado pela mesma pessoa.
   - O "hoje" é o dia de São Paulo.
   - `corrigir-nome` com o pedido `em_preparacao`.
   - Estado `desativado` na busca.
   - O log é conferido de verdade no harness.

Cobertos
1. **Correção 1, feita.** `titular.ts:92` passou a `trim().min(3).max(200)`. O teste cobre `'ab'`, `'   '`, `' ab '` e 201 letras, e confere que nada foi gravado em `titular.buscado`. A linha está nas Mutações.
2. **Correção 2, feita.** O teste usa um pedido de correção de verdade. Depois do laço confere:
   - o estado continua `recebido`;
   - o nome não mudou;
   - não há `pedido.concluido` nem `pedido.nome_corrigido`;
   - há um único `pedido.lido`, o da leitura da coordenação.
3. **Correção 3, feita.** O teste cobre:
   - a inserção com o registrador de B;
   - o `update` cru do `registrado_por`, recusado com o nome da restrição. O gatilho é `AFTER INSERT OR UPDATE OF`, então a remoção de qualquer um dos dois fica vermelha;
   - o caso "cancelamento sem autor".
4. **Correção 4, feita.** São 3 pedidos com limite 2. As mutações `gt`, `slice`, `proxima` e auditoria com `pedidos` no lugar de `daPágina` ficam vermelhas. A ordenação usa `sort()` e não depende da versão do UUID.
5. **Correção 5, feita.** Cada caso do homônimo muda uma coisa só, a partir de um nome único. Há ainda um teste próprio de outra escola, para `u.escola_id` e `l.escola_id`.
6. **O que mais entrou desta vez, e está testado:**
   - o caso (b) da chave prova `daChave › registrado_por`;
   - o caso (c) prova o escopo da chave única por escola;
   - `em_preparacao` em `corrigir-nome` é recusado e o nome não muda;
   - `estado: 'desativado'` na busca;
   - `varrerLog` agora exige que exista `http.erro` no log.
7. **A explicação da Mutação "equivalente" no `daChave › escola_id` vale.** Cada `usuario` tem um `escola_id` só. O gatilho `pedido_titular_registrado_por_da_escola` garante que `registrado_por` é da escola do pedido. Como `escola_id` não muda (gatilho `imutavel`), `registrado_por = eu` já implica a escola do contexto. Fica como segunda camada, e isso está bem justificado.
8. Rodei `vitest run --project integracao apps/api/test/pedido-titular.int.test.ts`: 22 de 22 passaram.

Bloqueantes
1. **`apps/api/src/privacidade/privacidade.service.ts:196`**: das quatro comparações que decidem se a chave repetida devolve o pedido, só `lido.titularId !== pedido.titularId` tem teste.
   - **O que está errado.** O caso (a) do teste "a chave de envio devolve só o pedido que é este mesmo…" (`apps/api/test/pedido-titular.int.test.ts:987-1026`) muda só o titular. Se eu retirar `lido.tipo !== pedido.tipo`, `lido.solicitante !== pedido.solicitante` ou `lido.chegouEm !== pedido.chegouEm`, um de cada vez, nenhum teste fica vermelho. Nenhuma outra chamada do arquivo repete uma chave mudando esses campos (conferi todas as ocorrências de `chaveEnvio`).
   - **Por que importa.** O defeito é real. A mesma coordenação repete a chave para registrar um pedido de `correcao` do mesmo aluno e recebe 201 com o pedido de `acesso` já gravado. Ela acha que registrou a correção, e o pedido do titular se perde sem aviso.
   - **A linha da Mutação está errada.** `tasks/prd-lgpd-e-titular/11_task.md:140` diz que a comparação dos quatro campos é provada pelo caso (a), mas ele prova só o titular.
   - **Correção exigida.**
     - No mesmo teste, com a chave de (a) e o mesmo `primeiro.id`, fazer três chamadas, mudando um campo por vez: `tipo: 'correcao'`, depois `solicitante: 'responsavel_legal'`, depois `chegouEm` de ontem (dia de São Paulo).
     - Cada chamada deve dar `NAO_ENCONTRADO`, sem o nome de `primeiro` no corpo.
     - No fim, conferir que continua um pedido só e um único `pedido.registrado`.
     - Em `11_task.md:140`, abrir uma linha nas Mutações para cada uma das quatro comparações, cada uma apontando o caso que a deixa vermelha.

Recomendações
- `privacidade.service.ts:179`: a troca para `diaDeUso` só fica vermelha das 21h à meia-noite de São Paulo. O documento diz isso com franqueza. Para uma prova que valha a qualquer hora, extrair a comparação para uma função pura que receba o relógio, e testá-la na unidade com 22h de São Paulo.
- `apps/api/test/captura-de-dado-pessoal.ts:33`: `toContain('http.erro')` olha o log acumulado do arquivo inteiro, não o do teste que está varrendo. Ele prova que o log está ligado, mas não que as chamadas daquele teste passaram pelo log. Seria melhor guardar o tamanho de `linhasDeLog` quando a captura é criada e varrer só dali em diante.
- O comentário "Os ids são v7" (`pedido-titular.int.test.ts`, teste de paginação) está certo para esta tabela (`uuidv7()`), mas a asserção não depende disso. Melhor deixar dito que a ordem vem do `sort()`, porque a regra 40 avisa que o id em geral é v4.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-09 19:38:29 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. Entre a 1ª rodada (`f6db470`) e a 2ª (`76a7403`), nada grava em `Nota`, `Correcao` ou `lancadaPor`. O diff mexe só em `pedido_titular` e no `nome` de `usuario`, e o caminho do nome (`corrigir-nome`) é o da 1ª rodada. Todos com autor humano? sim, porque não há escrita em nota.

Decisão autônoma sobre aluno: ausente. A mudança mais forte é a da chave de envio repetida, que agora devolve `NAO_ENCONTRADO` sem gravar nada (`apps/api/src/privacidade/privacidade.service.ts:194-198`). Isso é idempotência de pedido do titular. Não decide aprovação, reprovação nem encaminhamento.

Aprovação registrada: ok. Nenhuma saída de IA entra nesta tarefa.

Supervisão do tutor: ok. A tarefa não toca o tutor.

Autonomia declarada e visível: sim. Nenhum agente foi mudado.

O que você pediu para reconfirmar:
- **D64, prévia do professor:** continua só com as categorias de cadastro e vínculo, sem contagem nem período (`apps/api/src/privacidade/privacidade.service.ts:164`). O diff não tocou nesse ramo, em `titulares.repository.ts`, nem no esquema da prévia em `packages/shared/src/privacidade/titular.ts`. O teste que prova a regra segue igual (`apps/api/test/pedido-titular.int.test.ts:553-581`): quem usou a IA e quem não usou recebem a mesma resposta, tirando id e nome.
- **Leituras auditadas:** continuam. `pedido.lido` segue em `privacidade.service.ts:230`; a mudança ali só reaproveita o repositório. A paginação ganhou teste: a auditoria `pedidos.listados` leva só os ids da página, com autor e finalidade (`pedido-titular.int.test.ts:113-140`). A busca recusada não gera `titular.buscado` (`:166`), e o termo da busca não aparece no log nem nas outras respostas (`:191-194`).
- **Colisão da chave:** a chave de outra coordenação, ou com outro titular, tipo, solicitante ou data de chegada, responde como inexistente. Não grava pedido nem `pedido.registrado`, e o teste prova isso (`pedido-titular.int.test.ts:453-492`).
- **Rodada nova:** a 1ª rodada não exigiu correção. Conferi que o código em `apps/` e `packages/` da sua árvore é idêntico ao de `76a7403`: a 2ª rodada auditou o que está aí.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. As da 1ª rodada continuam com destino nas tarefas 12.0, 15.0 e 16.0.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-09 19:38:30 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `pedido_titular` (nenhuma mudança de schema nesta rodada; o novo teste exercita os gatilhos `pedido_titular_registrado_por_da_escola`, que roda no insert e no `UPDATE OF registrado_por`, e `pedido_titular_imutavel`). Também `usuario` e `lista_nome`, que são lidas pelo `homonimo`.

Queries verificadas:
- `titulares.repository.ts:147-163` (`homonimo`): os dois `exists` filtram por `escola_id` do contexto.
- `pedidos.repository.ts` `daChave`: filtra `escola_id` do contexto, `chave_envio` e agora também `registrado_por = identidadeDaRequisicao().usuarioId`. A identidade vem do token, não do cliente.
- `privacidade.service.ts` `registrarPedido`: quando a chave colide, o pedido devolvido é comparado em titular, tipo, solicitante e chegada. Se algum difere, a resposta é `NAO_ENCONTRADO`, nada é gravado e nada é auditado.
- `listar` paginado: o cursor `gt(id)` fica dentro do escopo da escola, que não mudou.
- O código no disco é igual ao da árvore `76a7403`, que foi a auditada.

Teste de isolamento: presente e efetivo.
- **Correção 1, feita.** O teste "o homônimo não olha a escola B" (`apps/api/test/pedido-titular.int.test.ts`, it na linha 906 do arquivo) cobre os dois casos. No primeiro, um aluno ativo de B tem o mesmo nome do titular de A. Sem `u.escola_id`, o primeiro `exists` encontraria esse aluno (ativo, papel aluno, id diferente) e a `previa` de A daria `homonimo: true`, então o teste falha. No segundo, o aluno de B é renomeado e uma linha `livre` com o mesmo nome entra na `lista_nome` de B. Sem `l.escola_id`, o segundo `exists` daria `true`, e o teste também falha. Os dois passos conferem a `previa` e o detalhe do pedido registrado. As duas linhas estão nas Mutações (`11_task.md`, linhas 556-557 do diff).
- **Caso (b) da chave.** Sem a cláusula `registrado_por`, o `daChave` devolveria o pedido da outra coordenação, a comparação do service passaria porque titular, tipo, solicitante e chegada são os mesmos, e a resposta seria 201 em vez de 404. Ou seja, o teste é efetivo.

Pergunta sobre a equivalência do `escola_id` no `daChave`: vale na prática. O `registrado_por` só pode ser usuário da escola do pedido, por causa do gatilho no insert e no update. O `escola_id` do pedido não muda. E, por fora disso, o service compara o `titularId`: o titular de A sai do `#titularAlvo` com escopo de A, e o titular de um pedido de B é sempre usuário de B (gatilho e `titular_id` imutável). Uma linha de B só passaria se `usuario.escola_id` mudasse de escola, e nenhum gatilho impede essa mudança no banco. Hoje nenhum caminho de código faz isso, então não é bloqueante.

O caso (c) continua provando algo, mas não a cláusula do `daChave`. Ele prova que a chave única é por escola, `(escola_id, chave_envio)`. Se a chave fosse global, o insert de A colidiria com o pedido de B e o `daChave` não acharia nada, porque o pedido de B tem outro `registrado_por`. A resposta seria 404 e o teste falharia. O caso também prova que a repetição da mesma chave em A é idempotente: mesmo id, e a comparação do service aceita o pedido igual. A linha das Mutações já descreve o caso dessa forma.

Bloqueantes: nenhum.

Recomendações:
- Na linha "Equivalentes" do `daChave` em `11_task.md`, registrar que a equivalência também supõe que `usuario.escola_id` não muda. Hoje nenhum gatilho garante isso no banco. Se algum dia uma pessoa puder trocar de escola mudando `usuario.escola_id`, a cláusula `escola_id` do `daChave` passa a ser a única barreira.
- Continua valendo a recomendação da 1ª rodada, já com destino na tarefa 14.0: passar `concluido_por` e `cancelado_por` pelo `exigir_usuario_da_escola`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/titulares.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0032_pedido_titular.sql
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/11_task.md

## infra-guardian · 2ª rodada · APROVADO · 2026-10-09 19:38:38 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (rota de privacidade da coordenação, com limite próprio e fora do caminho de login, tutor, sala e prova)
Rate limit: ok
Fila e prioridade: ok (nada nesta rodada vai para a fila)
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível (a 0032 não mudou nesta rodada)
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- O carry-over da 1ª rodada continua com destino na 13.0: o índice em `consumo_ia` e o estado anterior em `pedido.concluido`.
- `apps/api/src/privacidade/privacidade.service.ts:194`: quando a chave colide com outro titular, tipo, solicitante ou chegada, a resposta é `NAO_ENCONTRADO`. A Tech Spec aceita isso e o resultado é seguro. Mesmo assim, vale registrar que cliente que reaproveita a chave entre diálogos recebe 404 e não um aviso de conflito. Isso só acontece com bug no navegador, porque a chave é um UUID sorteado.

Conferência dos dois pontos pedidos, sobre o código da árvore `76a74032`, que é igual ao working tree em todos os arquivos da tarefa:

- **A mesma chave em paralelo continua dando um pedido só.** Quem decide a corrida continua sendo `insert … on conflict (escola_id, chave_envio) do nothing`, sobre o único `pedido_titular_chave_envio_unico` (`apps/api/src/privacidade/pedidos.repository.ts:65-85`). A segunda transação espera o índice único, não grava nada e não audita nada. Depois, o `daChave` dela, em read committed, lê a linha que a primeira já gravou. Na mesma coordenação, o `registrado_por` bate e os quatro campos comparados no service também: o `chegouEm` é `date` em modo string e o `z.iso.date()` fixa o formato. As duas chamadas devolvem 201 com o mesmo id, e a auditoria `pedido.registrado` sai uma vez só, de quem gravou. Não aparece 500: a falta de linha ou o conteúdo diferente viram `NAO_ENCONTRADO`, que é erro tipado. O teste `[P]` em `apps/api/test/pedido-titular.int.test.ts:974` continua provando um pedido, uma auditoria e o mesmo id. O teste novo, na linha 987, cobre outro titular, outra coordenação da mesma escola e a chave já usada na escola B.
- **O limite de tamanho do termo está aplicado.** Em `packages/shared/src/privacidade/titular.ts:91` ficou `trim().min(3).max(200)`, e o teste da linha 152 cobre `'ab'`, `'   '`, `' ab '` e 201 caracteres, sem auditar a busca recusada.

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-09 19:38:44 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência na chave de envio. A regra nova está na `techspec.md` §4, mas falta no `cenarios.md` e na tabela de Divergências da tarefa.
Portão local: carimbo válido

**Correções da rodada anterior**
- Item 1, termo da busca: feito. A busca agora apara o termo e exige de três letras a 200 (`.trim().min(...).max(...)`). Os casos `'   '`, `' ab '` e o de 201 letras estão no teste, e a linha está nas Mutações.
- Item 2, o dia de São Paulo: feito. O service usa `diaDeUso`, o teste usa `HOJE`/`AMANHA` com `diaDeUso`, o teste do check do banco passou a usar `DEPOIS_DE_AMANHA`, e a Tech Spec §4 diz que o check do banco é só a segunda camada.
- Item 3, aprovação do `test-engineer`: continua pendente. A 2ª rodada dele foi REPROVADO, e a tarefa não fecha sem a aprovação dele.

**Bloqueantes**

1. **A regra nova da chave de envio só está na Tech Spec.** `tasks/prd-lgpd-e-titular/cenarios.md:190-197` e `tasks/prd-lgpd-e-titular/11_task.md:89`.
   - O que mudou: antes, a mesma chave devolvia sempre o mesmo pedido. Agora, se a chave já usada vem com outro titular, tipo, solicitante ou chegada, ou se foi registrada por outra coordenação, a resposta é "não encontrado". O código é `privacidade.service.ts:196` e `pedidos.repository.ts:92`.
   - Onde está escrito: na `techspec.md` §4 ("A chave de envio é de quem registrou"). O `cenarios.md` não tem a linha. A tabela de Divergências da tarefa não tem a linha, e a 3ª linha dela ainda diz "a mesma chave é sempre o mesmo pedido", o que agora é falso para a chave que chega com outro conteúdo.
   - Correção exigida:
     - em RF10/RF19 do `cenarios.md`, um cenário [I] dizendo que a chave repetida com outro titular, tipo, solicitante ou chegada, ou registrada por outra coordenação, responde "não encontrado" sem gravar nem auditar nada;
     - uma linha nova em "Divergências resolvidas", com o motivo e a coluna "Onde está na spec" apontando para a §4 e para esse cenário;
     - a 3ª linha corrigida para dizer que a mesma chave com o mesmo conteúdo devolve o mesmo pedido.

2. **A tabela de Mutações afirma um teste que não existe.** `tasks/prd-lgpd-e-titular/11_task.md:545`.
   - A linha diz que a comparação de `titularId`, `tipo`, `solicitante` e `chegouEm` fica vermelha pelo caso (a). O caso (a) só troca o titular. Sem as outras três comparações, nenhum teste falha.
   - Correção exigida: um caso de teste para cada uma das três (mesma chave com outro tipo, outro solicitante, outra chegada → "não encontrado", sem pedido nem auditoria novos), e a linha reescrita para apontar para eles. É o mesmo ponto pelo qual o `test-engineer` reprovou.

**Recomendações**
- Três comentários ainda dizem que "a mesma chave devolve sempre o mesmo pedido": `apps/api/src/privacidade/privacidade.service.ts:173`, `apps/api/src/privacidade/pedidos.repository.ts:55` e `:63`, e o comentário de `registrarPedido` em `apps/api/src/privacidade/privacidade.controller.ts`. Convém alinhar com a regra nova.
- `apps/api/test/captura-de-dado-pessoal.ts:33`: a conferência de que o log não está vazio procura `http.erro` em todas as linhas do log. Se essa lista vem de um teste anterior do mesmo arquivo, a conferência passa sem que o teste atual tenha provocado erro nenhum. Melhor guardar o tamanho do log quando a captura é criada e conferir só as linhas que vieram depois.
- `MINIMO_DE_LETRAS_DO_TERMO` conta caracteres, não letras: `"a.b"` passa. Ou o nome da constante muda, ou a validação passa a contar letras.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-09 19:38:52 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: APROVADO

As duas correções da 1ª rodada estão feitas e cada uma tem teste. O código da chave repetida está certo. Auditei só o diff `f6db470..76a7403` e o que ele afeta. Conferi que a árvore de trabalho é igual a `76a7403` nos cinco arquivos de código e de teste. Não rodei a suíte.

**Correção 1: a chave de envio já usada.** Feita, e o código está certo.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts:92`: `daChave` agora filtra também `registrado_por = identidadeDaRequisicao().usuarioId`. O pedido de outra coordenação responde como inexistente.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts:194-198`: quando a chave colide (`id === undefined`), o service compara `titularId`, `tipo`, `solicitante` e `chegouEm`. Se algum for diferente, responde `NAO_ENCONTRADO` sem devolver o pedido gravado. Nesse caminho a transação não grava nada e não audita nada, porque o `onConflictDoNothing` não inseriu.
- Os tipos batem. `chegouEm` vem do banco com `date({ mode: 'string' })` e do contrato com `z.iso.date()`, os dois como texto `YYYY-MM-DD`, então a comparação com `!==` não falha à toa.
- Em paralelo, o `on conflict` espera a outra transação e o `select` seguinte já lê a linha gravada. A regra de não registrar pedido sobre si mesmo continua valendo, porque `#titularAlvo` roda antes.
- Os testes que exigi estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts:987-1026`:
  - caso (a), a mesma chave com outro titular: responde `NAO_ENCONTRADO`, o nome do primeiro titular não aparece no corpo, continua um pedido só e uma auditoria só;
  - caso (b), a chave de outra coordenação com tudo igual: responde `NAO_ENCONTRADO` e nenhuma auditoria nova.
- As linhas nas Mutações estão em `11_task.md`.

**Correção 2: o mínimo de 3 letras da busca.** Feita.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/shared/src/privacidade/titular.ts:512`: o esquema agora é `z.string().trim().min(MINIMO_DE_LETRAS_DO_TERMO).max(MAXIMO_DO_NOME_DO_TITULAR)`.
- O teste cobre `'ab'`, `'   '`, `' ab '` e 201 letras, todos com `ENTRADA_INVALIDA`, e confere que nenhum `titular.buscado` foi gravado.
- Conferi também `titulares.repository.ts:107`: a busca usa `position()` e não `like`, então `%` e `_` não funcionam como curinga. Não existe outro caminho para listar a escola inteira.

**O resto do diff.**
- `diaDeUso` (dia de São Paulo) no `chegouEm`, com o check do banco como segunda camada, e a regra escrita na Tech Spec.
- A varredura de log agora falha se o log não capturou nada (`captura-de-dado-pessoal.ts:81`), e o termo da busca é varrido no log e nas respostas.
- O teste de permissão agora usa um pedido real e prova que professor e aluno não concluem, não corrigem e não leem.
- Há testes novos de paginação, com a auditoria levando só os ids da página; do gatilho do `registrado_por`; do homônimo restrito à escola; e do `corrigir-nome` em `em_preparacao`.
- Nenhum campo pessoal novo, nenhum log novo com dado de pessoa.

Campos pessoais tocados: nenhum novo nesta rodada. `pedido_titular.registrado_por` passou a filtrar o `daChave` e ganhou gatilho de escola. O termo da busca agora é aparado e tem teto.
Fora da tabela de dados do docs/lgpd.md: nenhum.
Autorização por objeto: ok. A chave de envio agora pertence a quem registrou o pedido e à mesma escola. As rotas com `:id` são provadas com um pedido real para professor e aluno.
Logs: limpos. A varredura agora exige ter capturado `http.erro` e cobre o termo da busca.
Auditoria: presente. Nenhuma auditoria nova quando a chave colide ou a entrada é inválida, e as duas coisas estão provadas.
Envio externo: nenhum nesta tarefa.
Seed/fixture: sintético (nomes gerados com `PREFIXO` e UUID).
Bloqueantes: nenhum.
Recomendações:
- O `test-engineer` já reprovou por isto: o tipo, o solicitante e a chegada ainda não têm caso próprio na chave repetida, e a linha das Mutações aponta só para o caso (a). Para a regra 20 não é vazamento, porque nesses casos o pedido é da mesma coordenação e do mesmo titular. Por isso fica como recomendação minha, e o veto continua com o `test-engineer`.
- O `escola_id` do `daChave` ficou sem caso vermelho próprio, porque o `registrado_por` já barra a linha da escola B. Isso está declarado nas Mutações. Aceito como segunda camada.
- As recomendações da 1ª rodada que ficaram para a 13.0 (`concluido_por` e `cancelado_por` no arquivo do titular, e "quem leu meus dados") continuam registradas em `11_task.md`.

## test-engineer · 3ª rodada · APROVADO · 2026-10-09 19:59:18 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** com a mesma chave de envio e o mesmo titular, três registros mudando um campo por vez (tipo `correcao`, solicitante `responsavel_legal`, chegada de ontem em São Paulo). Cada um precisa responder `NAO_ENCONTRADO` sem o nome do primeiro titular, e no fim deve haver um pedido só e um `pedido.registrado` só. Também: uma linha nas Mutações de `11_task.md` para cada uma das quatro comparações da chave repetida, cada uma apontando o caso que a deixa vermelha. Por fim: o `#inicio` da captura não pode deixar o `it('RF17: …')` vermelho, nem a varredura vazia.

**Cobertos:**
- **Bloco (a2)**, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts:1003-1012`. Tem as três chamadas, com `NAO_ENCONTRADO` e sem o nome em cada uma. No fim confere um pedido e uma auditoria no banco.
- **As quatro mutações, rodadas por mim, uma por vez**, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts:198`. Cada comparação foi trocada por `false`. Não editei nenhum arquivo do andar: a troca foi feita em memória, por um plugin do vitest numa config no scratchpad. Antes, o arquivo inteiro passou, 22 de 22. Resultado de cada uma:

| Comparação removida | Onde o teste caiu |
|---|---|
| `lido.titularId !== pedido.titularId` | caso (a): `expected { status: 201 … } to deeply equal { status: 404 … }` |
| `lido.tipo !== pedido.tipo` | (a2), mensagem `tipo:`, 201 no lugar de 404 |
| `lido.solicitante !== pedido.solicitante` | (a2), mensagem `solicitante:`, 201 no lugar de 404 |
| `lido.chegouEm !== pedido.chegouEm` | (a2), mensagem `chegada:`, 201 no lugar de 404 |

  As quatro linhas novas das Mutações dizem a verdade.
- **O `#inicio` da captura**, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/captura-de-dado-pessoal.ts`. O RF17 passa com o arquivo inteiro e também rodando sozinho. Tirando a chamada `previa(a.coordenacao, randomUUID())` do RF17, ele fica vermelho com `o log da API não capturou nada depois de criada a captura: a varredura seria vazia`. Logo a varredura não é vazia, e a linha das Mutações do harness está correta. O outro teste que varre (`› a busca, a prévia, a lista e o detalhe auditam…`, linha 474) também passa, porque o `ler(randomUUID())` gera o `http.erro` depois de criada a captura.
- **Recomendações da rodada anterior.** O comentário do v7 foi trocado pelo do `sort()`, e confere com o `orderBy(asc(pedidoTitular.id))` de `pedidos.repository.ts:165` e `:176`. As duas recomendações recusadas estão na tabela com o motivo.
- **Código de `src/`.** Neste diff só mudaram comentários (service, repository, controller), e eles batem com a regra nova da techspec §4 e §5 e dos cenários RF10 e RF19.

**Bloqueantes:** nenhum.

**Recomendações:**
- Sem a chamada de erro, o log do RF17 depois de criada a captura fica vazio, não apenas sem `http.erro`. Ou seja, as chamadas que dão certo (corrigir, concluir, listar, ler) não escrevem linha nenhuma no log. A varredura do nome atual e do anterior só pega vazamento em log de erro ou em chamada explícita do logger. Não é defeito desta tarefa. Fica como registro para o `/validar`: quando algum caminho passar a escrever log também no sucesso, esse teste já vai cobri-lo.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-09 20:00:07 · `tasks/prd-lgpd-e-titular/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As duas correções exigidas na rodada anterior foram feitas:

1. **Cenário e divergência da chave de envio.**
   - `cenarios.md` RF10 tem o cenário [I] novo: a chave repetida com outro titular, tipo, solicitante ou chegada, um caso por campo, ou registrada por outra coordenação, responde `NAO_ENCONTRADO`. Não grava pedido, não audita e não devolve o nome do titular.
   - `cenarios.md` RF19 foi reescrito para "com o mesmo conteúdo e da mesma coordenação".
   - `11_task.md` tem a linha nova em "Divergências resolvidas", com o motivo, quem exigiu e a coluna "Onde está na spec" (techspec §4 e §5, cenários RF10 e RF19). A 3ª linha está corrigida.
   - A techspec §4 ("A chave de envio é de quem registrou") e §5 ("Eliminação", "Registro") dizem o mesmo que o código.
2. **Um teste para cada comparação.**
   - O caso (a2) em `apps/api/test/pedido-titular.int.test.ts:1003-1012` muda um campo por vez (tipo, solicitante, chegada). Para cada um, confere `NAO_ENCONTRADO` e a ausência do nome do primeiro titular. Depois dos três, confere que continua um só pedido e uma só auditoria.
   - As quatro linhas de Mutações batem com as quatro comparações em `privacidade.service.ts:198`. O `test-engineer` rodou cada mutação e as quatro ficaram vermelhas.

As recomendações que a Mesa pôs na ordem também foram feitas:
- Os comentários de `privacidade.service.ts`, `pedidos.repository.ts` e `privacidade.controller.ts` não dizem mais "sempre o mesmo pedido" sem a condição.
- `apps/api/test/captura-de-dado-pessoal.ts` agora varre só o log que veio depois de criada a captura.
- A recusa do nome de `MINIMO_DE_LETRAS_DO_TERMO` está registrada, com o motivo.

A árvore de trabalho está igual ao estado que revisei (`192cfd6`) nos arquivos de código e de teste. No `11_task.md`, a única diferença é a linha da 3ª rodada do `test-engineer`.

Recomendações:
- O comentário de `registrar` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts:64-65` está difícil de ler ("confere que ele é o pedido que foi pedido"). Basta dizer que quem chama confere titular, tipo, solicitante e chegada.
- No comentário da classe, em `pedidos.repository.ts:55-57`, a quebra de linha ficou no meio da frase ("As ações decidem pelo"). Vale juntar a frase de novo.
