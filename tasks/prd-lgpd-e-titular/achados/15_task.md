# Achados das revisões — `tasks/prd-lgpd-e-titular/15_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-10 05:23:10 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: REPROVADO

Cenários exigidos (tabela da 15.0 e `cenarios.md` RF14/RF15/RF19/autor `rotina`):
- **prazo:** antes de `eliminar_em`, cancelado, concluído, 8º dia
- **troca:** sentinela por coluna, caixa, apóstrofo e acento, metacaractere com JSON válido, "Ana Souza" dentro de "Mariana Souza", 1.001 linhas, limite de 160 e de 500
- **homônimo:** ativo, lista livre e desativado; professor sem troca
- **janela e falha:** a janela abre entre faixas e a noite seguinte termina; falha no `eliminar` desfaz a etapa 3
- **foto:** refeita antes de anonimizar; a concluída ainda devolve o provedor
- **o que fica:** mapa com o id, `apagado_em`, "Titular eliminado", só `nomeTrocado`
- **autor:** coordenação ativa ou `rotina`; o check aceita só as quatro ações; apelido `rotina` recusado
- **linha antiga** de `consumo_ia`, isolamento e log
- **concorrência [P]:** dois `eliminar`, cancelar contra enfileirar, expurgo de `pessoa_desativada` junto da eliminação
- **reenfileirar e alerta:** 20 h; 47 h não alerta, 48 h alerta

Cobertos:
- Todos os da lista acima têm teste com asserção sobre o resultado, menos a ordem da foto em relação à anonimização (bloqueante abaixo).
- Rodei `eliminar-titular.int.test.ts` (31 verdes), e `expurgo-da-escola`, `auditoria.int` e `medicao-da-eliminacao` (161 verdes). O teste de infra do alerta eu só li, não rodei.
- **Três mutações que confirmei:**
  - tirar o `for update` de `travarVencido` deixa vermelho o [P] dos dois jobs do mesmo pedido;
  - tirar `l.escola_id = t.escola_id` do `homonimo.ts` deixa vermelhos dez testes, entre eles o de isolamento do `pedido-titular.int.test.ts`;
  - a ordem foto → anonimização sobreviveu (abaixo).
- Os três arquivos mutados foram restaurados e conferidos byte a byte.
- Não há `.skip`, `.only` nem `any`. O teste de concorrência usa duas chamadas em paralelo de verdade. Não há IA no caminho.

Bloqueantes:
1. **A ordem foto → anonimização não tem teste, e a linha de Mutações que a cita está errada.**
   - **Onde:** `packages/nucleo/src/titular/eliminacao-do-titular.ts:95-96`, com a linha 129 da seção "Mutações" em `tasks/prd-lgpd-e-titular/15_task.md`.
   - **O que eu fiz:** troquei a ordem, chamando `anonimizarExecucoes` antes de `gravarCompartilhamento`. Os 31 testes continuaram verdes.
   - **Por que passa:** o consumo do teste "conclui o pedido…" (`eliminar-titular.int.test.ts:555-559`) leva `aluno_id`. O ramo do rastro pelo `aluno_id` sobrevive à anonimização. O ramo pela execução que o titular pediu (`execucao_agente.solicitada_por`, em `compartilhamento.repository.ts:26`) não sobrevive. Esse ramo é todo o rastro do professor e também o consumo do aluno sem `aluno_id`.
   - **O efeito:** se alguém inverter a ordem, a foto do professor concluído perde o provedor. É exatamente o "a concluída ainda devolve o provedor".
   - **Correção exigida:** no teste do professor (`eliminar-titular.int.test.ts:527`), ou num teste novo, criar um consumo com `envio_externo = true`, `provedor` preenchido e `aluno_id = null`, ligado a uma execução `solicitada_por` o titular. Depois do job, afirmar que `pedido(pedidoId).compartilhamento` contém esse provedor com `origem: 'rastro'`. Em seguida, corrigir a linha 129 de Mutações apontando para esse teste.

Recomendações:
- **Cancelamento contra a trava** (`eliminar-titular.int.test.ts:724-741`): o `setTimeout(300)` não prova que o job esperou na trava. Se o commit vier antes, o teste passa pelo `vencido` e não pela trava. É melhor fazer polling em `pg_stat_activity` até aparecer `wait_event_type = 'Lock'` e só então dar o commit.
- **Reenfileirar depois de um job terminado:** falta um teste do motivo real das 20 h. O job interrompido pela janela termina `concluido` e, 21 h depois, a mesma chave `eliminacao:<id>` precisa gravar um job novo. O teste de 20 h atual parte de um pedido sem job nenhum.
- **Chave do JSON igual ao nome** (`eliminar-titular.int.test.ts:260-263`; `DEPOIS_DO_NOME_EM_JSON` em `troca-de-nome.ts:81`): o teste fixa que o nome completo fica na chave. A sentinela continua na coluna, e isso contradiz "o nome completo some de todas". Está escrito na techspec §5, mas não na tabela de Divergências. É para o `privacy-guardian` decidir.
- **Homônimo depende do `lower()` do banco** (`homonimo.ts:22,27`): a divergência 9 tira a flag `i` justamente por depender da configuração de caractere do banco, mas o homônimo usa `lower()`, que depende dela também. Num banco com locale C, "MÜLLER" e "Müller" não casam. Vale registrar o limite, ou comparar do mesmo jeito que o padrão.
- **Teste da falha** (`:661`): afirmar também que `compartilhamento` continua `[]` e que nenhum arquivo foi marcado. Isso prova que a foto está dentro da mesma transação.
- **Virada de ano letivo:** uma linha de texto de um ano `encerrado` no teste da troca, para mostrar que a troca não filtra por ano.
- **Fim a fim pela API:** uma leitura de `GET pedidos/:id` depois do job (`titular: null`, `nomeTrocado: true`, compartilhamento com o provedor), em vez de só a coluna.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/eliminacao-do-titular.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/eliminar-titular.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/troca-de-nome.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/homonimo.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/15_task.md

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-10 05:24:45 · `tasks/prd-lgpd-e-titular/15_task.md`

```
VEREDITO: APROVADO
Tabelas verificadas: nenhuma tabela nova. A migration 0036_eliminacao_do_titular.sql cria quatro índices, todos começando por escola_id: consumo_ia_entrada_idx, consumo_ia_saida_idx, entrega_justificativa_idx e mensagem_agente_escola_id_idx. Ela também cria os checks auditoria_rotina_so_nas_acoes e operador_apelido_formato (agora sem rotina). A entrada titular.nome_trocado da auditoria leva a escola do contexto e o entidadeId da linha da própria escola. Os ids continuam UUID (o cursor da faixa usa ::uuid).
Queries verificadas:
- EliminacaoDoTitularRepository: vencido, travarVencido, nomeDoTitular, registradorAtivo, gravarCompartilhamento, anonimizarExecucoes, marcarArquivosApagados, concluirOutrosAbertos e concluir. Todos pegam a escola por exigirEscolaDoContexto() e nenhum a recebe por parâmetro.
- haHomonimoDoTitular (homonimo.ts): t.escola_id vem do contexto, e as junções exigem u.escola_id e l.escola_id iguais a t.escola_id.
- TrocaDeNome #examinar e #trocar: escola_id no select e no update.
- ExpurgoDaEscolaRepository: enfileirarEliminacoes (:458, escola no update externo e na subconsulta) e vencimentoDoAgendadoMaisAntigo (:494).
- TitularesRepository.homonimo, que agora delega ao núcleo e não recebe mais o nome por parâmetro.
- O job titular.eliminar lê a escola do contextoAtual() e o payload é só { pedidoId }, em z.strictObject.
- Nenhum endpoint novo, nenhum escolaId vindo de corpo ou query, nenhum @SemEscopo novo. MedicaoDaEliminacao entrou na lista fechada de QUEM_USA_A_ROTINA (arquitetura.test.ts). Nada da camada de rede foi tocado.
Teste de isolamento: presente e efetivo
- eliminar-titular.int.test.ts:773 chama cada método do repositório, mais o homônimo e o arquivo, com o id de A no contexto de B. A asserção é exata (toEqual) sobre o retorno, e o teste confere que a linha de A ficou como estava. Tirando mentalmente o escola_id de vencido, travarVencido, nomeDoTitular, registradorAtivo, anonimizarExecucoes, concluir, gravarCompartilhamento ou do t.escola_id do homônimo, o teste quebra.
- :305 cobre o job de B com o pedido de A.
- :327 confere que a outra escola com o mesmo texto não é tocada e não ganha auditoria.
- expurgo-da-escola.int.test.ts (o caso "o expurgo de A não enfileira o pedido de B") e medicao-da-eliminacao.int.test.ts:85 cobrem o enfileiramento e a série por escola.
Bloqueantes: nenhum
Recomendações:
- troca-de-nome.ts:167, :183 e :191 (também marcarArquivosApagados e concluirOutrosAbertos no repositório, e enfileirarEliminacoes em :458): o escopo está em duas camadas, a seleção e a escrita. Tirar só uma delas não deixa nenhum teste vermelho, como a própria tabela de Mutações registra ao chamar isso de "equivalente". A proteção vale porque as duas existem juntas. Vale um caso que derrube cada camada sozinha, por exemplo chamar #trocar com um id de B no contexto de A. Ou então uma linha em techspec.md §5 dizendo que a camada da escrita é a defesa que fica.
- eliminar-titular.int.test.ts:305: além da coluna, afirmar que nenhuma auditoria titular.nome_trocado nem pedido.concluido foi gravada na escola B. Isso fecha o caso do job inteiro no contexto errado.
```

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-10 05:25:39 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (as dez divergências da tabela estão na `techspec.md` §5, no bloco "Tarefa 15.0, como ficou no código", e §7c/§13; e as que tocam cenário estão no `cenarios.md`, RF3 e RF15)
Portão local: carimbo válido

**Bloqueantes**

1. **O bloqueante da 1ª rodada do `test-engineer` não foi corrigido, e a tarefa segue sem a aprovação dele.**
   - **Onde:** `packages/nucleo/src/titular/eliminacao-do-titular.ts:95-96` e `tasks/prd-lgpd-e-titular/15_task.md:129`.
   - **O que está errado:** a ordem "refaz a foto, depois anonimiza" continua sem teste. Se alguém inverter as duas linhas, os testes continuam verdes.
     - O único consumo do teste que confere a foto (`apps/worker/test/eliminar-titular.int.test.ts:555-559`) tem `aluno_id` preenchido. O ramo do rastro pelo `aluno_id` (`compartilhamento.repository.ts:21`) sobrevive à anonimização. O ramo pela execução que o titular pediu (`x.solicitada_por`, linhas 23-25) não sobrevive. Esse ramo é todo o rastro do professor e o do consumo de aluno sem `aluno_id`.
     - O teste do professor (`:527-542`) não confere a foto.
     - A linha 129 de "Mutações" diz que a troca da ordem deixa um teste vermelho, e ela não deixa. Isso é registro falso de mutação (regra 40).
     - A tabela de Revisões mostra só o `test-engineer` da 1ª rodada, REPROVADO. O critério da linha 72 ("`test-engineer` aprovado primeiro") não está cumprido.
   - **Correção exigida:**
     - Criar um `consumo_ia` com `envio_externo = true`, `provedor` preenchido e `aluno_id = null`, ligado a uma `execucao_agente` com `solicitada_por` igual ao titular. Pode ser no teste do professor ou num teste novo.
     - Depois do job, afirmar que `pedido(pedidoId).compartilhamento` contém esse provedor com `origem: 'rastro'`.
     - Confirmar que o teste fica vermelho com a ordem invertida.
     - Corrigir a linha 129 de "Mutações" apontando para esse teste.
     - Pedir a 2ª rodada do `test-engineer` antes da próxima rodada dos outros revisores.

**Recomendações**

- **`eliminacao-do-titular.ts:106`:** `throw new Error('pedido de eliminação não concluído sob a trava')` lança erro sem tipo. A regra 00, item 9, pede erro tipado e com código. É um invariante inalcançável, mas o projeto já tem `ErroDeDominio` e `FalhaDeJob` para isso.
- **`eliminacao-do-titular.ts:79`, com `eliminacao-do-titular.repository.ts:74-85`:** na etapa 2, `registradorAtivo` roda sobre `this.banco`, fora de transação. O `FOR KEY SHARE` solta a trava na hora, e o comentário "o segura" só vale na etapa 3. Ajustar o comentário ou documentar que, na etapa 2, uma desativação no meio derruba a faixa e a tentativa seguinte assina como `rotina`.
- **`troca-de-nome.ts:233-237` e `homonimo.ts:145,150`:** a divergência 9 tira a flag `i` porque ela depende da configuração de caractere do banco. Mas a fronteira de palavra usa `[[:alnum:]]` e o homônimo usa `lower()`, e os dois dependem dela do mesmo jeito: com locale C, "é" não é `alnum` e "MÜLLER" não casa com "Müller". Registrar esse limite na §13 da techspec, ou montar a fronteira e o homônimo pelo mesmo critério do padrão.
- **`troca-de-nome.ts:237`:** o nome completo que é chave de um JSON (`DEPOIS_DO_NOME_EM_JSON`) fica na coluna. Isso está na techspec, mas não na tabela de Divergências da tarefa. Fica para o `privacy-guardian` decidir se aceita.
- **`eliminar-titular.int.test.ts:733`:** o `setTimeout(300)` não prova que o job esperou na trava. Esperar até `pg_stat_activity` mostrar `wait_event_type = 'Lock'` antes de dar o commit.
- **`TODO.md`:** nos itens marcados `[x]`, o texto antigo continua depois da nota "*resolvido…*". Vale cortar o que deixou de ser pendência.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/eliminacao-do-titular.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/eliminacao-do-titular.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/troca-de-nome.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/homonimo.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/eliminar-titular.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/15_task.md

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-10 05:26:18 · `tasks/prd-lgpd-e-titular/15_task.md`

```
VEREDITO: APROVADO
Caminhos de escrita em Nota: nenhum. Não existe tabela `nota` nesta fatia
  (packages/nucleo/src/db/schema/correcao.ts:13), e nada no diff grava nota, correção ou
  validação de lote. Todos com autor humano? sim (não há caminho).
Decisão autônoma sobre aluno: ausente. O job só executa um pedido de eliminação que a
  coordenação registrou, com 7 dias para cancelar. Não decide aprovação, reprovação nem
  encaminhamento. Não há IA no caminho.
Aprovação registrada: ok. O check novo `auditoria_rotina_so_nas_acoes`
  (packages/nucleo/drizzle/0036_eliminacao_do_titular.sql:21) deixa o autor `rotina` em
  quatro ações apenas (`usuario.eliminado`, `acesso_turma.revogado`, `titular.nome_trocado`,
  `pedido.concluido`). O teste prova que ele é recusado em `entrega.decidida` e em
  `lote.aprovado` (auditoria.int.test.ts). O apelido `rotina` é recusado no comando
  (apps/api/src/ops/operador.ts) e na tabela. `entrega.decidida_por` continua sem FK, então
  eliminar o professor não apaga quem aprovou. A justificativa da rejeitada continua
  preenchida depois da troca, cortada em 500.
Supervisão do tutor: ok. A tarefa não toca o tutor. A conversa do aluno sai em cascata com
  a eliminação, que é da 1.0.
Autonomia declarada e visível: sim. Nada mudou: o job não é agente nem função de agente.
Bloqueantes: nenhum
Recomendações:
- Itens 6 e 8 (conversa do professor). Pelo docs/lgpd.md, o tema da execução e o texto do
  modelo (`execucao_agente.entrada`, `consumo_ia`) são "tratados como conversa do professor".
  Mesmo assim, cada linha trocada nessas duas tabelas grava `titular.nome_trocado`, com
  `entidadeId` e o `pedidoId` do aluno (troca-de-nome.ts:144-150; acoes.ts:726). Hoje
  nenhuma rota expõe a auditoria à coordenação (auditoria.repository.ts:30-34), por isso não
  bloqueia. Quando o F3 abrir a consulta da auditoria ou o dossiê (D61), essa entrada não
  pode deixar a coordenação ligar "o tema do professor P citou o aluno A". Por exemplo:
  esconder `entidadeId` dessas duas tabelas na leitura da coordenação, ou agregar por
  pedido. A troca em `mensagem_agente` já é feita sem entrada por linha, e o teste prova
  isso.
- auditoria.int.test.ts:259. O teste "outro operador assina qualquer ação" fixa que um
  operador da equipe pode gravar `entrega.decidida` e `lote.aprovado` na auditoria. A
  decisão real continua protegida pelo gatilho `entrega_decidida_por_da_equipe`, mas o
  registro poderia dizer que a equipe aprovou. Vale ampliar o check para exigir
  `autor_usuario_id` nessas duas ações, ou reescrever o teste sem as ações de aprovação.
- eliminacao-do-titular.repository.ts:159 e :175. Quando a coordenadora que registrou já foi
  desativada, `concluido_por` fica com o id dela, mas a auditoria diz `rotina`. O teste fixa
  isso como esperado. Registrar no `docs/lgpd.md` que a autoria da conclusão é a da
  auditoria, para a tela da 16.0 não mostrar a coordenadora como quem concluiu.
- O `artefato` de uma entrega `pendente` também é trocado, então o professor aprova depois
  com `[nome removido]`. Isso está correto. Vale um teste curto que prove que a entrega
  pendente continua `pendente`, sem `decidida_por`, depois do job.
```

Achados (no veredito acima):
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/troca-de-nome.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/auditoria/acoes.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/auditoria/auditoria.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/eliminacao-do-titular.repository.ts

Lidos para conferir que estão conformes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0036_eliminacao_do_titular.sql
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/eliminacao-do-titular.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/eliminar-titular.int.test.ts

## privacy-guardian · 1ª rodada · REPROVADO · 2026-10-10 05:26:32 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: REPROVADO

Campos pessoais tocados: nenhum campo novo de pessoa. A tarefa mexe no que já existia: `usuario.nome` (só lido, como alvo da troca), os textos livres de `execucao_agente.entrada`, `consumo_ia.entrada`/`saida`, `artefato.titulo`/`conteudo`, `mensagem_agente.conteudo` e `entrega.justificativa`, e as marcas `nome_trocado`/`homonimo`, `compartilhamento` e `eliminacao_enfileirada_em` de `pedido_titular`. A ação nova de auditoria `titular.nome_trocado` grava só `{ tabela, pedidoId }`. A métrica nova `eliminacao.horas_vencida` leva só `escola_id`.

Fora da tabela de dados do docs/lgpd.md: nada. As linhas "Entrada e saída das chamadas de IA", "Registro de incidente" e "Pedido do titular" foram atualizadas, com a foto e o autor `rotina`.

Autorização por objeto: ok. Toda instrução de `EliminacaoDoTitularRepository`, `TrocaDeNome` e `haHomonimoDoTitular` pega a escola do contexto. O job carrega só `{ pedidoId }`, validado com `z.strictObject`. Com o id de A no contexto de B, nada é alcançado e o resultado é igual ao de id inexistente (`eliminar-titular.int.test.ts:773`). Não há rota nova.

Logs: limpos. O job loga `{ evento: 'titular.eliminacao', status }`, e o teste em `:854` limita os campos a uma lista fechada. O expurgo loga só contagens. As falhas passam por `resumirErro`, que nunca leva a mensagem nem o DETAIL do Postgres.

Auditoria: presente. Grava `titular.nome_trocado` por linha (execução, consumo, artefato e entrega), `pedido.concluido` no pedido e nos outros abertos, e `usuario.eliminado`. O autor é a coordenação ativa, decidida sob a trava, ou `rotina`. O check `auditoria_rotina_so_nas_acoes` impede `rotina` de aprovar entrega, e o apelido `rotina` é recusado no comando e na tabela.

Envio externo: nada novo sai para provedor. A foto do compartilhamento (para onde o dado foi) é refeita na transação, antes de anonimizar e de eliminar. Falta o teste que prova essa ordem num dos dois caminhos do rastro (bloqueante 1).

Seed/fixture: sintético ("Joana d'Ávila Müller", "Professora sintética da eliminação", nomes com metacaracteres inventados).

Bloqueantes:

1. **A ordem foto → anonimização não tem teste que a prove.**
   - **Onde:** `packages/nucleo/src/titular/eliminacao-do-titular.ts:95-96`. O único teste da foto está em `apps/worker/test/eliminar-titular.int.test.ts:623`, e o consumo dele leva `aluno_id`.
   - **O que está errado:** o rastro tem dois caminhos (`compartilhamento.repository.ts:21-26`). O caminho pela execução que o aluno pediu (`x.solicitada_por`) deixa de existir depois de `anonimizarExecucoes`. Se alguém inverter as duas linhas, a eliminação conclui com a foto sem o provedor, e a pergunta "para onde isso já foi enviado" fica sem resposta para aquele envio.
   - **Correção sobre o caso de teste:** o test-engineer pede o caso "no teste do professor" (`:527`), mas para professor a foto é só por período (`compartilhamento.ts:73-77`), e lá o caso não provaria nada.
   - **Correção exigida:** um teste com titular **aluno**. Ele precisa de um `consumo_ia` com `envio_externo = true`, `provedor` preenchido e `aluno_id = null`, ligado a uma `execucao_agente` com `solicitada_por` igual ao aluno. Depois do job, afirmar que `pedido(pedidoId).compartilhamento` contém esse provedor com `origem: 'rastro'`. Corrigir também a linha 129 da seção "Mutações" em `tasks/prd-lgpd-e-titular/15_task.md` para apontar esse teste.

2. **O runbook manda levar a mensagem de erro do Postgres para a correção.**
   - **Onde:** `docs/runbook.md:594` ("abra correção com a mensagem, o código e o `id` do pedido").
   - **O que está errado:** a falha prevista nesse item é o `22P02` do `::jsonb`. A mensagem e o contexto desse erro trazem o trecho do JSON da linha, que é o texto livre do professor e pode ter nome de aluno e conteúdo da conversa. O código evita essa mensagem de propósito (`resumir-erro.ts:44-47`), e a correção vai para `TODO.md`, `achados/` ou issue de um repositório **público**. O runbook abre o caminho que o log fecha.
   - **Correção exigida:** trocar por "abra correção com o `sqlstate`, o `constraint` (do `job.tentativa_falhou`) e o `id` do pedido, nunca a mensagem, o DETAIL nem o CONTEXT do Postgres, que citam o texto da linha". Se for preciso achar a linha, use o `id` dela, sem colar o conteúdo.

Recomendações:
- **Chave do JSON igual ao nome** (`troca-de-nome.ts:81`): aceito do ponto de vista da privacidade. O schema estrito de cada tarefa fixa as chaves (`consumo-ia.ts:20`), e um nome completo de aluno não coincide com uma chave do contrato. Vale registrar isso na tabela de Divergências, porque hoje está só na techspec §5.
- **Homônimo pelo `lower()` do banco** (`homonimo.ts:22,27`): num banco com locale C, a comparação pode não achar o homônimo e trocar o nome. Isso troca demais, e não vaza; o efeito é na integridade do texto do outro aluno. Registrar o limite junto da divergência 9.
- **Foto do professor depois da eliminação:** afirmar no teste `:527` que `compartilhamento` sai com `origem: 'periodo'`. Os vínculos dele saem no `eliminar`, e a foto precisa ter sido feita antes.
- **Teste da falha** (`:661`): afirmar também que `compartilhamento` continua `[]` e que nenhum arquivo foi marcado `apagado_em`.
- **Fim a fim pela API:** depois do job, ler `GET pedidos/:id` e conferir `titular` nulo, "Titular eliminado", `nomeTrocado` e o provedor na foto.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/eliminacao-do-titular.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/eliminar-titular.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/runbook.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/erro/resumir-erro.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/troca-de-nome.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/homonimo.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/15_task.md

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-10 05:27:51 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: fila | migration
Rate limit: ok (a tarefa não abre rota nova; a prévia e o registro só passaram a chamar `haHomonimoDoTitular`)
Fila e prioridade: problema
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/troca-de-nome.ts:12` e `:139-143` (o `update` com `regexp_replace` em `:182-183`).
   - **O que está errado:** a faixa tem 1.000 linhas, sem levar em conta o tamanho delas. O custo do regex cresce com os bytes, e o worker roda com `statement_timeout` de 2 s (`BANCO_TIMEOUT_CONSULTA_MS=2000`, mesmo valor da API).
   - **A medida:** usei o padrão real (fronteira por `lookaround` e `[aA]` letra a letra) no Postgres de teste, numa tabela temporária, sem tocar em arquivo:
     - 1.000 linhas de ~12 KB levaram 580 ms;
     - 1.000 linhas de ~50 KB deram `canceling statement due to statement timeout` em 2.000 ms.
   - **Por que 50 KB é real:** `consumo_ia.entrada` guarda os trechos do material da ferramenta. `artefato.conteudo` guarda apresentações e material didático. Nenhuma das duas colunas tem limite de tamanho.
   - **O efeito:** numa escola com esse volume, a faixa estoura o timeout. O job falha, repete e falha igual em toda tentativa e em toda noite, e a eliminação nunca termina. O alerta de 48 h dispara, mas o runbook não tem saída para isso: a causa 4 trata JSON quebrado e o `eliminar` falhando, e não o `57014`. O direito do art. 18, VI fica descumprido sem que a operação consiga resolver.
   - **O teste não pega:** o "mais de mil linhas examinadas…" (`apps/worker/test/eliminar-titular.int.test.ts:435`) usa texto curto.
   - **Correção exigida:**
     - a faixa precisa ter teto em bytes, além do teto de linhas. Por exemplo: no `#examinar`, cortar pela soma acumulada de `octet_length(<coluna>::text)` até um orçamento fixo que caiba com folga em 2 s (medido, na casa de poucos MB), e garantir ao menos uma linha por faixa;
     - um teste de integração com linhas grandes (≥ 50 KB por linha, ≥ 1.000 linhas), rodando com o `statement_timeout` de 2 s do pool, que prove que a troca conclui;
     - um parágrafo para o código `57014` nas causas do runbook "Eliminação do titular agendada há mais de 48 h do prazo".

     Subir o `statement_timeout` só desta transação não resolve: a regra 80, item 3, exige o timeout.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0036_eliminacao_do_titular.sql`, comentário do cabeçalho: diz que o `NOT VALID` + `VALIDATE` confere a linha "sem segurar escrita". Isso contradiz a techspec §7c: o `migrar` roda numa transação, então a `auditoria` fica sob trava exclusiva durante toda a varredura. O comentário deve dizer o mesmo que a §7c. O desvio dos índices sem `concurrently` está declarado até o staging e não bloqueia.
- Cursor da troca: a noite seguinte recomeça da primeira faixa. Numa escola em que a varredura completa não cabe na janela noturna, o pedido nunca conclui. A causa 3 do runbook manda conferir se as linhas trocadas por noite caem, mas elas caem a zero sem a troca terminar. Vale guardar o cursor por coluna no pedido, ou registrar o limite na techspec.
- Ordem de travas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/eliminacao-do-titular.repository.ts:271-288`: `concluirOutrosAbertos` trava os outros pedidos do titular depois da trava do usuário. Isso inverte a ordem pedido → usuário declarada, e pode dar deadlock com o job de arquivo (13.0) do mesmo titular. A fila repete (D49), mas convém travar todos os pedidos do titular logo depois de `travarVencido`.
- Do `test-engineer` (1ª rodada), em aberto além do bloqueante dele:
  - provar com `pg_stat_activity` (`wait_event_type = 'Lock'`) que o job esperou na trava no teste de cancelar contra a trava, em vez de `setTimeout(300)`;
  - testar o reenfileiramento depois de um job `concluido` pela janela;
  - no teste da falha, afirmar que a foto e os arquivos não mudaram.

O bloqueante do `test-engineer` (a ordem foto → anonimização sem teste) segue com ele. Não reauditei.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-10 05:42:45 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os da 1ª rodada, mais os desta: a ordem foto → anonimização, os dois tetos da faixa da troca de nome (1.000 linhas e 4 MB, com ao menos uma linha por faixa), a falha na etapa 3 desfazendo a foto, o arquivo marcado e os outros pedidos, o cancelamento antes da trava sem depender de tempo fixo, o job já `concluido` com o pedido ainda `agendado` 21 h depois, e o isolamento sem auditoria nas duas escolas.

**Cobertos:**
- **A correção exigida foi feita.** O teste `conclui o pedido, apaga a pessoa…` (`apps/worker/test/eliminar-titular.int.test.ts:585-590` e `:655`) cria um `consumo_ia` com `aluno_id = null`, `envio_externo = true` e o provedor `provedor_so_pela_execucao`, ligado à execução que o aluno pediu. Inverti as linhas 95 e 96 de `packages/nucleo/src/titular/eliminacao-do-titular.ts` e o teste caiu na `:655`: a foto saiu só com `maritaca`. Restaurei o arquivo e conferi que ficou igual ao original. A linha de Mutações agora aponta para esse teste.
- **A falha na etapa 3** (`:699-731`) agora afirma que a foto fica `[]`, que o arquivo não é marcado e que o outro pedido segue `pronto`. Isso derruba a foto gravada fora da transação.
- **O fim da coluna com orçamento cortado** (`troca-de-nome.ts:170`) tem teste que derruba. Tirei `ids.length === examinadas.rows.length` e o teste das linhas grandes caiu com `comNome: '874'`.
- **O `break` do orçamento** (`troca-de-nome.ts:116`) também tem teste que derruba. Comentei a linha e o teste caiu por `statement_timeout`, em 2.252 ms.
- **O cancelamento antes da trava** (`:784-793`) espera a trava de fato, consultando a `pg_stat_activity`. Como o projeto `integracao` roda com `fileParallelism: false`, outro arquivo de teste não consegue dar um falso positivo.
- **O expurgo** (`expurgo-da-escola.int.test.ts:2887`) afirma as duas linhas de job com a mesma chave.
- **O isolamento** (`:314-317`) afirma que não há auditoria nas duas escolas.

**Bloqueantes:**
1. **A regra "ao menos uma linha por faixa" não tem teste, e a linha de Mutações diz que tem.**
   - **Onde:** `packages/nucleo/src/titular/troca-de-nome.ts:116`, a subcláusula `ids.length > 0`, e a linha de Mutações em `tasks/prd-lgpd-e-titular/15_task.md` (`troca-de-nome.ts › idsDentroDoOrcamento › ids.length > 0 && somados + bytes > …`).
   - **O que a mutação mostrou:** tirei só `ids.length > 0 &&` e rodei `eliminar-titular.int.test.ts` e `packages/nucleo/src/titular`. Os 55 testes passaram.
   - **Por que é bug de LGPD:** sem a guarda, uma linha acima de 4 MB deixa a faixa vazia. Aí `ultimo` fica `undefined`, o laço sai e a coluna é dada por terminada. A linha grande e todas as seguintes da coluna ficam com o nome do aluno, e mesmo assim o pedido conclui com `nomeTrocado: true`. A techspec (§5) e a causa 6 do runbook já tratam essa linha grande como caso real.
   - **Correção exigida:** um teste em que a coluna tem, na ordem do `id`, uma linha cujo texto passa de `ORCAMENTO_DA_FAIXA_EM_BYTES` (uns 4,5 MB, com o nome) e, depois dela, linhas pequenas com o nome. Depois do job, nenhuma das linhas pode ter o nome e o pedido tem de estar `concluido`. Pela medição da 1ª rodada (12 MB em 580 ms), essa linha leva uns 220 ms, longe dos 2 s. Separe na tabela de Mutações a linha de `ids.length > 0`, apontando para esse teste. Um teste de unidade de `idsDentroDoOrcamento`, exportada, também derruba a mutação, mas o de integração prova o resultado que importa: o nome sai.

**Recomendações:**
- **O teste do `break` depende da velocidade da máquina.** Ele só derruba a mutação porque, sem o teto, a faixa passa do `statement_timeout` de 2 s. Com o teto, a margem é folgada e o teste não fica instável. Mas numa máquina rápida a mutação pode sobreviver. Um teste que não depende de tempo seria contar as faixas, ou afirmar que a soma de bytes de cada faixa fica abaixo do teto, pela função exportada.
- **A sondagem da `pg_stat_activity`** (`:788`) poderia filtrar também pelo `pid` da conexão do job, ou pela escola do cenário. Hoje ela é segura porque os arquivos rodam em série, mas a segurança vem da configuração do vitest, e não do próprio teste.

Todos os arquivos que mudei para as mutações (`eliminacao-do-titular.ts` e `troca-de-nome.ts`, os dois sem commit) voltaram do backup, e conferi com `cmp` que ficaram iguais ao original.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-10 05:43:47 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem coluna nova. Na `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0036_eliminacao_do_titular.sql` só mudou comentário (linhas 211 a 216, todas com `--`). Os índices e os checks da 1ª rodada continuam iguais. Conferi a árvore `2bbbc1f` contra o disco, arquivo por arquivo, nos sete arquivos auditados, e eles batem.

Queries verificadas:
- `TrocaDeNome #examinar` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/troca-de-nome.ts:181`): a coluna nova é `octet_length(campo::text)`, da mesma tabela. O `where escola_id = ${escolaId}`, o cursor `id > ::uuid` e o `order by id` não mudaram, e a escola continua vindo do contexto.
- `idsDentroDoOrcamento` (`troca-de-nome.ts:261`): só escolhe, dentro dos ids que a seleção da escola já trouxe. Não acrescenta nenhum id de fora.
- `#trocar` (`troca-de-nome.ts:194`): sem mudança, mantém `escola_id = ${escolaId} and id = any(...)`.
- O fim da faixa (`troca-de-nome.ts:301`) mudou só a regra de quando a coluna termina. O escopo não mudou.
- `EliminacaoDoTitularRepository.registradorAtivo`: só mudou comentário (o ajuste da recomendação do revisor-geral). O código é o mesmo.
- Nenhum endpoint novo, nenhum `escolaId` vindo de corpo ou de query, nenhum `@SemEscopo` novo. A camada de rede não foi tocada.

Teste de isolamento: presente e efetivo.
- O teste de isolamento da 1ª rodada não mudou.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/eliminar-titular.int.test.ts:314-317` atende a minha recomendação da 1ª rodada. Com o job de B rodando sobre o pedido de A, agora se confere que nem a escola A nem a B ganham as auditorias `titular.nome_trocado`, `pedido.concluido` e `usuario.eliminado`. Se o job rodasse inteiro na escola errada, o teste quebraria.
- Os testes novos (linhas grandes, o consumo `provedor_so_pela_execucao`, a etapa 3 desfeita inteira, a espera na `pg_stat_activity`, e a chave `eliminacao:<id>` que volta depois de 21 h) usam cada um uma escola só e não diminuem a cobertura entre escolas.

Bloqueantes: nenhum.

Recomendações:
- A recomendação da 1ª rodada sobre as duas camadas do escopo (`#examinar` e `#trocar`) foi recusada com motivo (`15_task.md`, tabela de recomendações). Fica registrada para o `/retro`. A seleção ainda é a única camada que um teste derruba sozinha, porque o `#trocar` só recebe ids que vêm da própria seleção.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-10 05:44:05 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. Esta fatia não tem tabela `nota`, e o diff da rodada 2 não grava nota, correção, validação de lote nem decisão de entrega. Todos com autor humano? sim, porque não há caminho.

Decisão autônoma sobre aluno: ausente. O diff muda só a troca de nome (`packages/nucleo/src/titular/troca-de-nome.ts`), que agora tem um teto de bytes por faixa (`ORCAMENTO_DA_FAIXA_EM_BYTES` em `idsDentroDoOrcamento`, com o cursor no último `id` que entrou na faixa). Mudam também testes, o runbook e comentários. Nada disso decide aprovação, reprovação ou encaminhamento, e não há IA no caminho.

Aprovação registrada: ok. O diff de `packages/nucleo/drizzle/0036_eliminacao_do_titular.sql` mexe só em linhas de comentário (`--`). O check `auditoria_rotina_so_nas_acoes` e o `operador_apelido_formato` continuam como na 1ª rodada: o autor `rotina` segue recusado em `entrega.decidida` e `lote.aprovado`. O teste novo em `apps/worker/test/eliminar-titular.int.test.ts` (o caso de isolamento) confere que um job recusado não grava `titular.nome_trocado`, `pedido.concluido` nem `usuario.eliminado` em nenhuma das duas escolas.

Supervisão do tutor: ok. A tarefa não toca o tutor.

Autonomia declarada e visível: sim. Nada mudou, e o job não é agente nem função de agente.

Correções exigidas da 1ª rodada: não havia (APROVADO sem bloqueantes). As quatro recomendações do conformidade-reviewer têm destino registrado em `TODO.md` e na tabela de recomendações de `tasks/prd-lgpd-e-titular/15_task.md`. São elas: o `entidadeId` de `titular.nome_trocado` na leitura da coordenação, o check sem `autor_usuario_id` nas ações de aprovação, a autoria da conclusão (para a 16.0) e o teste da entrega `pendente`.

Bloqueantes: nenhum

Recomendações:
- `docs/runbook.md`, causas 4 e 6. O texto novo manda abrir a correção só com `sqlstate`, `constraint`, o `id` e o `octet_length`, nunca com DETAIL ou CONTEXT do Postgres. Isso protege o texto do professor sobre o aluno, que conta como conversa do professor (regra 70, item 8). Vale manter o mesmo cuidado no log do `job.tentativa_falhou`, para que ele não carregue a mensagem crua do Postgres. Esse ponto é do privacy-guardian, e eu só o registro aqui.

Arquivos lidos:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/troca-de-nome.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0036_eliminacao_do_titular.sql`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/eliminar-titular.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/runbook.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/TODO.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/15_task.md`

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-10 05:44:07 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: APROVADO

As duas correções da 1ª rodada foram feitas. O diff novo não traz campo pessoal, log nem saída para fora do sistema.

**Correção 1, a ordem foto → anonimização, está provada.**
- O teste novo fica em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/eliminar-titular.int.test.ts:585-589`. Ele cria um `consumo_ia` com `aluno_id = null`, `envio_externo = true` e `provedor = 'provedor_so_pela_execucao'`, ligado à `execucao_agente` com `solicitada_por` igual ao aluno.
- Na linha 655 ele confere que esse provedor aparece na foto com `origem: 'rastro'`.
- A mutação derruba o teste de verdade. A foto acha esse rastro só por `x.solicitada_por = titularId` (`compartilhamento.repository.ts:26/126`), e `anonimizarExecucoes` zera `solicitada_por` (`eliminacao-do-titular.repository.ts:110`). Se a ordem for invertida, o provedor some da foto e o teste falha.
- O teste de falha também passou a cobrir a foto. Em `eliminar-titular.int.test.ts:727-730`, a foto, o arquivo marcado e o outro pedido são desfeitos na mesma transação.
- A linha da seção "Mutações" de `tasks/prd-lgpd-e-titular/15_task.md` (agora a 136) foi corrigida e aponta os dois testes.

**Correção 2, a causa 4 do runbook, está feita.**
- `docs/runbook.md:594-596` agora pede o `sqlstate`, o `constraint` e o `id` do pedido. Proíbe a mensagem, o DETAIL e o CONTEXT do Postgres, e diz para achar a linha pelo `id`, sem colar o conteúdo.
- O texto bate com o log. O `job.tentativa_falhou` (`apps/worker/src/executor.ts:293`) usa `resumirErro`, que só emite `sqlstate` e `constraint` (`packages/nucleo/src/erro/resumir-erro.ts:52-56`).
- A causa 6, nova, segue a mesma linha: pede o `id`, a tabela e o `octet_length`, nunca o conteúdo.

Campos pessoais tocados: nenhum novo. O `#examinar` passa a ler `octet_length(campo::text)`, que é tamanho e não conteúdo.
Fora da tabela de dados do docs/lgpd.md: nada.
Autorização por objeto: ok. Neste diff só mudou o tamanho da faixa da troca de nome. A filtragem por `escola_id` vinda do contexto continua igual.
Logs: limpos.
Auditoria: presente. O teste que recusa os dados sem pedido agora confere que nenhuma das três ações (`titular.nome_trocado`, `pedido.concluido`, `usuario.eliminado`) é gravada em nenhuma das duas escolas (`eliminar-titular.int.test.ts:314-317`).
Envio externo: nenhum novo. A foto do compartilhamento agora registra também o provedor que só se alcança pela execução, e o teste prova isso.
Seed/fixture: sintético ("Trecho sintético do material da aula", o nome de `cenario()` e `provedor_so_pela_execucao`).

Bloqueantes: nenhum.

Recomendações:
- Causa 6 do runbook: deixar pronta uma consulta que devolva só `id` e `octet_length` da maior linha por tabela da escola. Assim quem opera não precisa montar a query na hora, com risco de selecionar a coluna de texto.
- O comentário novo de `registradorAtivo` (`eliminacao-do-titular.repository.ts:74-78`) diz que, na etapa 2, a faixa falha se a coordenadora for desativada no meio. Isso não tem teste próprio. Não é vazamento, só a autoria da auditoria. Vale um caso quando a 16.0 mostrar o autor na tela.

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-10 05:44:27 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `techspec.md` §7c e em `cenarios.md`. O teto de 4 MB está na §5, mas a tarefa diz que ele também está na §7c, e não está.
Portão local: carimbo válido

**O que mudou desde a 1ª rodada.** A árvore atual é igual à `2bbbc1fa`: comparei arquivo por arquivo, inclusive os não rastreados.
- **Minha correção da 1ª rodada foi feita.** O teste "conclui o pedido…" ganhou um consumo com `aluno_id = null`, `envio_externo = true` e provedor `provedor_so_pela_execucao`. Ele está ligado à execução que o aluno pediu, e o teste afirma que esse provedor aparece na foto com `origem: 'rastro'` (`eliminar-titular.int.test.ts:585-590` e `:655`). O `test-engineer`, na 2ª rodada, inverteu a ordem e o teste ficou vermelho. A linha de Mutações foi corrigida.
- **As correções do `privacy-guardian` e do `infra-guardian` também foram feitas.** O runbook não manda mais levar a mensagem do Postgres para a correção. A faixa ganhou o teto em bytes, um teste com linhas grandes e o parágrafo do `57014` no runbook.

**Bloqueantes**

1. **A regra "ao menos uma linha por faixa" não tem teste, e a linha de Mutações diz que tem.** Esse é o bloqueante da 2ª rodada do `test-engineer`, e ele continua aberto na árvore atual.
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/troca-de-nome.ts:116`, a cláusula `ids.length > 0`. E a linha de Mutações `idsDentroDoOrcamento › ids.length > 0 && somados + bytes > ORCAMENTO_DA_FAIXA_EM_BYTES` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/15_task.md`.
   - **O que está errado:** nenhum teste cria uma linha acima de 4 MB. Procurei e não achei: o maior texto de teste é o de ~60 KB por linha, na `:462`. Se alguém tirar a guarda, o resultado é este:
     - a primeira linha acima do orçamento esvazia a faixa;
     - `ids[ids.length - 1]` fica `undefined`, e a `:173` sai do laço;
     - a coluna é dada por terminada, e a linha grande e todas as seguintes continuam com o nome do aluno;
     - mesmo assim, o pedido conclui com `nomeTrocado: true`.
   - **Por que é grave:** o direito de eliminação é descumprido sem nenhum sinal. A linha de Mutações registra uma mutação que nenhum teste derruba (regra 40). A tabela de Revisões mostra o `test-engineer` da 2ª rodada REPROVADO, então o critério "`test-engineer` aprovado primeiro" não está cumprido.
   - **Correção exigida:**
     - um teste de integração com uma coluna que tenha, na ordem do `id`, uma linha acima de `ORCAMENTO_DA_FAIXA_EM_BYTES` com o nome, seguida de linhas pequenas com o nome;
     - depois do job, nenhuma dessas linhas tem o nome e o pedido está `concluido`;
     - separar na tabela de Mutações a linha de `ids.length > 0`, apontando para esse teste;
     - pedir a 3ª rodada do `test-engineer` antes da próxima rodada dos demais revisores.

2. **A divergência dos dois tetos cita a §7c, que não a tem, e os cenários não a registram.**
   - **Onde:**
     - `15_task.md`, tabela de Divergências, linha "A faixa da troca de nome tem **dois** tetos", coluna "Onde está na spec", que diz "`techspec.md` §5 (bloco da 15.0) e §7c";
     - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:714`, que diz só "faixa de 1.000 na troca de nome";
     - `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/cenarios.md:306-329`, que não tem o caso nem o lista no parágrafo "Tarefa 15.0, onde cada um está".
   - **O que está errado:** o rastreio aponta para um texto que não existe. Além disso, o limite por escola da §7c ficou incompleto em relação ao código, e o caso novo de RF15 (linhas grandes em várias faixas, ao menos uma linha por faixa) não está nos cenários.
   - **Correção exigida:**
     - na §7c, linha "Limite por escola", trocar por "faixa de 1.000 linhas e 4 MB na troca de nome, com ao menos uma linha";
     - em `cenarios.md`, RF15, um `[I]` para as linhas grandes que passam do orçamento em várias faixas e para a linha sozinha acima do orçamento (o teste do bloqueante 1);
     - incluir os dois testes no parágrafo "onde cada um está".

**Recomendações**
- O teste das linhas grandes só derruba a mutação do `break` porque passa de 2 s. Numa máquina rápida, a mutação pode sobreviver. Exportar `idsDentroDoOrcamento` e afirmar a soma de bytes por faixa num teste de unidade não depende de tempo.
- A sondagem da `pg_stat_activity` (`eliminar-titular.int.test.ts:788`) poderia filtrar pelo `pid` da conexão do job. Hoje ela é segura só porque o vitest roda os arquivos em série (`fileParallelism: false`).
- `15_task.md`, Mutações: a linha `eliminar-titular.int.test.ts › o cancelamento… › travarVencido sem for update` põe o teste na coluna da cláusula. Inverter para `eliminacao-do-titular.repository.ts › travarVencido › for update`.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-10 05:45:12 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila | migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum. As três partes da correção da 1ª rodada estão feitas:
- (a) Teto em bytes na faixa: está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/troca-de-nome.ts`. São 4 MB em `ORCAMENTO_DA_FAIXA_EM_BYTES`, somados por `idsDentroDoOrcamento`, e toda faixa leva ao menos uma linha. Quando o orçamento corta a faixa, o fim da coluna não é marcado (`ids.length === examinadas.rows.length && ...`) e o cursor continua do último `id` que entrou.
- (b) Teste com linhas grandes: está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/eliminar-titular.int.test.ts:457`. São 1.000 linhas de ~60 KB, rodando pelo pool da `BancadaDeFila`, que tem `statement_timeout` de 2 s. Rodei o teste localmente e ele passou, com mais 2 casos de faixa: 3 passaram, 29 pulados.
- (c) Código `57014`: virou a causa 6 de "Eliminação do titular agendada há mais de 48 h do prazo" em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/runbook.md`. O texto proíbe subir o timeout e não pede o conteúdo da linha.

Recomendações:
- `troca-de-nome.ts`, `#examinar`: o `octet_length(${campo}::text)` converte o jsonb inteiro das até 1.000 linhas a cada faixa. Quando o orçamento corta a faixa em ~68 linhas, o mesmo bloco de 1.000 linhas é relido umas 15 vezes por coluna. Medi numa tabela temporária no Postgres de teste: 1.000 linhas de ~1 MB levaram 574 ms. Isso cabe nos 2 s, mas o texto era repetitivo, então comprimido, e um texto real pode levar mais. Duas saídas: usar `pg_column_size` (não descomprime nem converte), ou reduzir o `limit` do `select` quando a faixa anterior foi cortada pelo orçamento.
- `0036_eliminacao_do_titular.sql`: o comentário agora bate com a seção 7c da Tech Spec, e o item do `TODO.md` (linha 143) cobre o `VALIDATE` em arquivo próprio antes do staging. Vale juntar a 0036 ao item da 0031, "fora do horário letivo e com `lock_timeout`", porque `auditoria` cresce com o aluno.
- As recomendações abertas da 1ª rodada (cursor por coluna no pedido, ordem de trava pedido → usuário) foram para o `TODO.md` com motivo. As três recomendações de teste vindas do `test-engineer` foram aplicadas no diff: espera pela trava com `pg_stat_activity`, novo job depois de um `concluido`, e foto e arquivo desfeitos na falha.

## test-engineer · 3ª rodada · APROVADO · 2026-10-10 06:03:05 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: APROVADO

**Cenários exigidos (correção da 2ª rodada):**
- **Guarda `ids.length > 0`:** uma linha sozinha acima do orçamento da faixa entra sozinha, e a troca segue para as linhas seguintes. No fim nenhuma linha fica com o nome, o pedido está `concluido` e o usuário foi eliminado.
- **Mutações:** a linha da seção passa a ser separada por subcláusula, cada uma apontando para o teste que a prova.
- **Recomendação da 2ª rodada:** provar o `break` sem depender do `statement_timeout`.

**Cobertos (conferi rodando, não só lendo):**
- **Linha de base:** `apps/worker/test/eliminar-titular.int.test.ts` inteiro passa, 34 de 34.
- **Mutação 1, tirar só `ids.length > 0 &&`** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/troca-de-nome.ts:116`. O teste novo "a linha sozinha acima do orçamento da faixa entra sozinha…" falha por asserção, em 60 ms: `{ total: '4', comNome: '4' }` no lugar de `comNome: '0'`, na linha 501. Ele não depende de prazo nem da ordem dos `uuid` da escola: se a linha grande não for a primeira, a faixa anterior também para nela e a faixa seguinte sai vazia.
- **Mutação 2, o `break` desligado** (condição com `&& false`). O teste novo "a faixa leva só as linhas que cabem no orçamento de bytes…" falha por asserção, em menos de 3 s: `comNome: '0'` no lugar de `'1'`, na linha 527. Fica prova do `break` que não depende do tempo, como a recomendação pedia. O teste das 1.000 linhas de ~60 KB continua como segunda prova, essa sim dependente do prazo.
- **Mutações nesta rodada:** desfiz as duas. O arquivo de produção ficou idêntico ao da árvore `56a827b`, conferido com `git show … | diff`.
- **Seção Mutações** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/15_task.md`, linhas 156 a 159):
  - O `break` e a guarda agora têm uma linha cada, e cada uma aponta para o teste que derruba a mutação. Bate com o que medi.
  - As duas linhas marcadas como equivalentes estão certas. Sem a saída antecipada, a lista vazia vira `'{}'::uuid[]` e o `fim` dá verdadeiro do mesmo jeito. O `ultimo === undefined` só acontece na faixa vazia, que já sai pelo `fim`.
  - A linha do `for update` em `travarVencido` só mudou de lugar no texto, e agora aponta para o repository em vez do teste.
- **`cenarios.md` RF15 e `techspec.md` §7c:** os três cenários novos e o limite "com ao menos uma linha por faixa" estão registrados e batem com os testes.
- **Isolamento:** os dois testes novos criam uma escola própria cada um, com `cenario()`, e filtram as linhas por `escola_id`.

**Bloqueantes:** nenhum.

**Recomendações:**
- O teste da linha de ~4,9 MB roda o regex numa linha só, dentro do `statement_timeout` de 2 s. Pela medição da própria tarefa (1.000 linhas de 50 KB, uns 50 MB, passaram de 2 s), há margem de cerca de dez vezes. Se ele ficar instável na esteira, diminuir a linha para pouco acima de 4 MB.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-10 06:04:15 · `tasks/prd-lgpd-e-titular/15_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As duas correções da 2ª rodada foram feitas:

1. **A regra "ao menos uma linha por faixa" agora tem teste.**
   - O teste novo é "a linha sozinha acima do orçamento da faixa entra sozinha…", em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/eliminar-titular.int.test.ts:478`. Ele põe uma linha de ~4,9 MB com o menor `id`, seguida de três linhas pequenas com o nome. Depois do job, ele confere `comNome: '0'`, o pedido `concluido` e o usuário eliminado.
   - Sem `ids.length > 0`, a faixa fica vazia, `ultimo` fica `undefined` e a coluna é dada por terminada com as quatro linhas ainda com o nome. A asserção cai, sem depender da máquina. Também não depende da ordem dos `uuid` criados por `cenario()`: tudo o que vem a partir da linha grande fica de fora.
   - O teste "a faixa leva só as linhas que cabem…" (linha 504) prova o `break` sem depender do relógio. São três linhas de ~1,5 MB e a janela abre depois da primeira faixa, então sem o `break` o resultado seria `'0'` no lugar de `'1'`. O helper `relogioQueAbreDepoisDe(1)` combina com a única leitura do relógio antes da troca, que o teste existente da linha 545 já usa.
   - Na seção Mutações de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/15_task.md:159-163`, as cláusulas agora estão separadas, cada uma apontando para o seu teste. As duas marcadas como equivalentes conferem com `troca-de-nome.ts` (`examinadas.rows.length === 0` e `faixaFeita.ultimo === undefined`).
2. **Rastreio dos dois tetos.** A `techspec.md` §7c (linha 714) traz os 1.000 linhas, os 4 MB e "ao menos uma linha por faixa". Em `cenarios.md`, o RF15 ganhou três casos `[I]` (linhas 316-321) e o parágrafo "onde cada um está" foi atualizado (linha 331). A linha de Divergências da `15_task.md` aponta para os dois documentos.

Nenhum arquivo de `src/` mudou desde a rodada anterior. Os arquivos versionados da árvore batem com a `0446a5f`.

Recomendações:
- A linha de ~4,9 MB roda o regex inteiro numa faixa só, contra o `statement_timeout` de 2 s. Se ficar instável na esteira, baixar para pouco acima de 4 MB, que basta para a guarda.
- A recusa de filtrar a `pg_stat_activity` pelo `pid` tem motivo registrado (`fileParallelism: false`). Vale ir para o `/retro` junto com as duas camadas de escopo que o `tenancy-guardian` levantou.
