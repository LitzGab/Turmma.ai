# Cenários de teste — lgpd-e-titular

Exigidos pela revisão da spec, rodada 1 (`revisao-spec.md`). Cada cenário diz o que precisa falhar se a regra sumir.
Cada cenário cai numa tarefa do `tasks.md`, que diz qual. I = integração com Postgres real e relógio injetado · U = unidade · E = e2e em `chromebook` e `celular` com
verificação de acessibilidade · F = `test:infra` · P = chamadas em paralelo.

## Fatia 1 — Retenção e expurgo

- **RF1.**
  - [I] Uma escola recém-criada lê todas as categorias com origem "padrão".
  - [U] O teste de arquitetura quebra quando uma tabela de migration fica fora da `CLASSIFICACAO_DAS_TABELAS`.
- **RF2, pelo comando `ops:retencao`.**
  - [I] Abaixo do piso e acima do teto dá `RETENCAO_FORA_DO_LIMITE`.
  - [I] Uma categoria fixa (registro de acesso, auditoria) é recusada.
  - [I] Uma trava entre categorias desrespeitada é recusada: `texto_do_modelo` maior que `conversa_professor`.
  - [I] `retencao.ajustada` vai para a auditoria com o operador e a referência.
  - [I] O ajuste em A não muda o `GET retencao` de B.
  - [P] Dois `ops:retencao ajustar` da mesma escola passam um de cada vez, e o segundo audita o primeiro como anterior
    (tarefa 2.0).
  - [I] O número do contrato é inteiro positivo; texto ou zero são recusados como argumento, sem gravar (tarefa 2.0).
- **RF4, prazo.**
  - [I] Por categoria: um dia antes do prazo, a linha fica; um dia depois, sai, ou é anonimizada como diz o catálogo.
  - [I] Reexecutar não apaga mais nada.
- **RF4, ajuste e travas.**
  - [I] Encurtar o prazo em A tira a linha de A e mantém a de B, com a mesma idade.
  - [I] Aumentar o prazo depois não devolve nada.
  - [I] Com `conversa_professor` em 3 meses, o tema em `execucao_agente` e em `consumo_ia` sai em 3 meses.
  - [I] Com `conversa_tutor` em 6 meses, o `aluno_id` de `consumo_ia` com 7 meses é anulado.
  - [I] Ajustar `consumo_por_aluno` acima de `conversa_tutor` dá `RETENCAO_FORA_DO_LIMITE`.
  - [I] Com `conversa_tutor` em 6 meses, aos 7 meses nem `consumo_ia.aluno_id` nem a execução do Tutor a que o consumo aponta
    alcançam o aluno; aos 5, os dois ficam; a execução do professor de 7 meses fica (tarefa 4.0, exigido pelo
    `privacy-guardian`).
  - [I] Expurgar e trocar o nome numa linha antiga de `consumo_ia` (`envio_externo` verdadeiro, sem `provedor`,
    anterior à migration da 7.0) não esbarra no check (testado na 15.0).
- **RF4, ano letivo.**
  - [I] Um ano com `fim` vencido além do prazo, mas `em_curso`, não perde nada.
  - [I] O mesmo ano `encerrado` perde.
- **RF4, `execucao_agente`.**
  - [I] Anonimizar uma linha `pendente`, uma `concluida` e uma `falhou` respeita os checks das migrations 0022 e 0023.
  - [I] A linha fica, as sete FKs que apontam para ela (lidas de `pg_constraint`; a spec dizia oito, tarefa 4.0)
    continuam válidas, e a soma da governança não muda.
  - [I] O lote de anonimização não pula a linha que só tem a trava de FK (`for key share`) e pula, sem esperar, a que outra
    transação travou para mudar (tarefa 4.0).
  - [I] Reexecutar não mexe na execução já anonimizada (`anonimizada_em` fica com a data da primeira noite), e o texto do
    modelo conta só as chamadas que tinham texto, com entrada ou só com saída (tarefa 4.0).
- **RF4, `trabalho_do_aluno`** (tarefa 5.0).
  - [I] O ano `em_curso` ou `planejado` com o `fim` vencido não perde nada; o `encerrado` perde a tentativa, a resposta e a
    correção, e a atividade aplicada e o lote de correção ficam.
  - [I] Aluno transferido: o trabalho dele no ano antigo de A sai pelo ano de A, o de um ano mais novo fica, e o dele em B,
    com a mesma idade, não é tocado.
  - [I] O lote de 5.000 tentativas com a cascata (20 respostas e a correção cada) sai em menos de 2 s.
- **RF4, cadastro** (tarefa 5.0).
  - [I] `reivindicacao_decidida`: sai a decidida por qualquer decisor (`professor` ou `coordenacao`) e a `encerrada` sem
    decisão; o `pendente` e a de outra escola ficam.
  - [I] `material_excluido`: o vigente fica mesmo velho; o excluído sai com os trechos; o que uma pergunta ou um sinal do
    Tutor ainda cita fica até a conversa sair, e sai na mesma noite em que ela sai.
  - [I] `vinculo_encerrado`: o ativo, o pendente, o contestado e o encerrado recente ficam.
  - [P] Dois jobs da mesma escola ao mesmo tempo levam cada linha uma vez nos quatro alvos que apagam.
- **RF4, `pessoa_desativada`.**
  - [I] O usuário desativado além do prazo é eliminado pelo ciclo de vida (vínculo e credencial saem com ele), com a auditoria
    `usuario.eliminado` assinada pelo apelido `rotina`.
  - [I] Se ele está ativo em outra escola, a conta continua; se a escola eliminada era a última, a conta é limpa.
  - [I] Quem sumiu entre a escolha do lote e a trava é pulado sem erro, e o lote diz `cheio` pelo número de escolhidos.
  - [I] A pessoa reativada (convite aceito) entre a escolha do lote e a trava não é eliminada: fica, sem auditoria, e não entra na contagem.
  - [I] O erro de SQL numa eliminação sobe: a categoria grava `false`, as eliminadas antes ficam, e a noite seguinte começa
    por ela.
  - [P] Dois jobs ao mesmo tempo eliminam cada pessoa uma vez, sem erro.
  - [I] O lote é de no máximo 100 pessoas, as mais antigas primeiro, e não escolhe a de outra escola.
  - [I] Com pedido `agendado`, ele é pulado (tarefa 14.0).
- **RF5.**
  - [I] O `expurgo_execucao` grava as contagens certas por escola e categoria, e só ids e números.
  - [I] O próprio `expurgo_execucao` com 5 anos e um dia sai, com 5 anos menos um dia fica, o de outra escola fica, e as
    linhas da noite que acabou de rodar não saem (tarefa 5.0). Se a janela abre depois da última categoria, a noite fica
    completa e o registro vencido sai na seguinte.
  - [I] Com a janela letiva aberta no meio do job, ele para no lote em que ela abriu: a categoria interrompida grava
    `concluida = false` com a contagem parcial, as que terminaram gravam `true`, e o job da noite seguinte começa pela
    pendente, termina o restante e grava `true`.
  - [F] Duas noites seguidas só com execução parcial (`concluida = false`) disparam o alerta; uma noite parcial seguida
    de uma completa não dispara.
  - [F] Os quatro alertas disparam, cada um ligado ao parágrafo do runbook: duas noites sem todas as categorias
    concluídas; `agendado` mais de
    48 h depois de `eliminar_em`; `em_preparacao` por mais de 2 h; incidente sem confirmação em 24 h.
  - [I] A thread do professor sem mensagem sai só se foi criada antes do corte; a recém-aberta fica; a que ganhou mensagem
    entre a escolha e a trava fica (tarefa 3.0).
  - [I] O lote que falha grava a categoria com `concluida = false` antes de o erro subir; duas noites assim, desde a primeira
    da escola, levam a série do alerta a 2 (tarefa 3.0).
  - [I] A medição do alerta conta a noite no fuso da escola, ignora a noite anterior à primeira execução, e não dá série à
    escola que nunca rodou (tarefa 3.0).
  - [I] O pedido com `eliminacao_enfileirada_em` há mais de 20 h é reenfileirado; com menos de 20 h, não é.
  - Carga: uma escola expurga 1 milhão de linhas e troca um nome enquanto outra usa o Tutor, com cada statement abaixo
    de 2 s.
- **Prazos fixos.**
  - [I] O arquivo com 7 dias fica; com 8, somem o objeto e a linha.
  - [I] O incidente com 5 anos mais um dia sai pelo `sistema.expurgar-acesso`.
  - [I] O `expurgo_execucao` com 5 anos mais um dia sai.

## Fatia 2 — Suboperadores e incidente

- **`consumo_ia.provedor`.**
  - [U] A subida é recusada sem `IA_PROVEDOR_ID` com `openai_compat` e processamento não local, e com id fora do
    formato.
  - [U] O provedor resolvido pelo falso, pelo local, por `regra_fixa` e com zero tentativas é nulo. Pelo externo, com
    servidor falso e sem provedor pago, é o id.
  - [I] `provedor` com `envio_externo = false` é recusado pelo banco.
  - [I] Depois da migration da 7.0, um insert no formato do código anterior (externo, sem `provedor`, `em` = agora) é aceito.
  - [I] O `ConsumoRepository` grava o `provedor`, e a soma da governança não muda.
  - [I] A gravação do consumo nunca falha por causa da coluna.
- **RF6.**
  - [I] `ops:suboperador` cadastra e encerra o suboperador, com auditoria da operação.
  - [I] O encerrado fica no histórico com o período.
  - [I] Uma chave encerrada pode ser recadastrada.
  - [I] (tarefa 8.0) A auditoria do cadastro e do encerramento é sem escola, com o autor, o alcance e as contagens, e nunca a chave, o
    nome nem o contrato; a `auditoria` aceita sem escola só a rede e o suboperador, e só por operador (banco e `RegistroDeAuditoria`).
  - [I] (tarefa 8.0) Já há vigente com a chave: `CONFLITO`, sem gravar nada. Escola inexistente na lista: `NAO_ENCONTRADO`, e a ligação das
    que existem se desfaz. Encerrar sem vigente: `NAO_ENCONTRADO`. Encerrar fecha as ligações abertas e diz quantas.
  - [P] (tarefa 8.0) Dois cadastros da mesma chave deixam um só e o outro dá `CONFLITO`; dois encerramentos passam um de cada vez.
  - [I] (tarefa 8.0) O banco recusa, por fora do comando, o que o comando recusa (formato da chave, do país e do contrato, categoria fora da
    lista, vigência invertida, duas vigentes da mesma chave, ligação repetida, escola ou suboperador inexistente); a lista de categorias
    do check é a de `CHAVES_DE_CATEGORIA_DO_SUBOPERADOR`.
- **RF7.**
  - [I] B não vê o suboperador `lista` que atende só A, e vê o de `todas`.
  - [I] Quando a ligação tem `fim`, o suboperador aparece como passado.
  - [I] (tarefa 8.0) A vigência que a escola lê é o início da ligação (ou do suboperador, em `todas`) e o mais cedo entre os dois `fim`; a escola
    que saiu da lista vê passado, e a outra, vigente. O recadastrado vem antes do encerrado de mesma chave. O DTO não traz id, contrato,
    operador nem escola.
  - [E] (tarefa 8.0) A aba "Empresas que recebem dados" lê as vigentes e as passadas, nunca as de outra escola; os quatro estados (carregando,
    erro, vazio e dado, mais o "só passadas"), em `chromebook` e `celular`, com acessibilidade; a segunda pessoa na mesma aba não vê as
    empresas da anterior.
  - [I] Um consumo de A cujo `provedor` é a chave de um suboperador só de B aparece como "provedor não cadastrado". As
    linhas sem `provedor` e a reserva por período não listam o suboperador só de B.
- **RF8.**
  - [I] O registro não guarda dado de titular.
  - [I] `titulares_estimados` e `categorias` ficam por escola.
  - [I] O comando recusa texto que cite outra escola afetada.
- **RF9.**
  - [I] A coordenação de A não recebe a contagem nem o texto de B, conferido com sentinela.
  - [I] Confirmar em A não confirma a linha de B.
  - [I] `POST incidentes/:id/confirmar` num incidente só de B dá `NAO_ENCONTRADO`.
  - [P] Duas confirmações ao mesmo tempo mantêm a primeira, sem erro cru.
  - [F] O alerta de 24 h sem confirmação dispara.
  - [E] O aviso aparece e é confirmado só com o teclado e a 360 px, com rolagem dentro do diálogo. "Ver depois" deixa a
    faixa fixa, e o Sair continua alcançável.

## Fatia 3 — Pedido do titular

- **RF10.**
  - [I] O `POST pedidos` com `titularId` de B devolve o mesmo status e o mesmo corpo de um UUID inexistente.
  - [I] O pedido sobre si mesmo dá `NAO_ENCONTRADO`, inclusive pelo `usuario` professor da mesma conta.
  - [I] `chegouEm` no futuro é recusado.
  - [I] Um `UPDATE` que troca o `escola_id` ou o `titular_id` do pedido é recusado.
- **RF11, conteúdo do arquivo.**
  - [I] Uma sentinela em cada tabela classificada como do titular aparece no arquivo, e nada de outro titular ou de
    outra escola aparece.
  - [I] O professor que também está em B não leva nada de B no arquivo de A.
- **RF11, correção de lote.**
  - [I] A correção de um lote pendente ou rejeitado não aparece como resultado, em nenhuma das duas versões.
- **RF11, colunas proibidas.**
  - [I] Uma sentinela em cada coluna de `COLUNAS_FORA_DO_ARQUIVO` (hashes, segredo do segundo fator, códigos de
    recuperação, `chave_envio`, `chave_objeto`, `sub`) não aparece em nenhuma das duas versões.
  - [I] O e-mail da conta global do professor entra nas duas versões.
  - [I] O arquivo do aluno não traz o conteúdo do artefato aplicado.
- **RF12, quem baixa.**
  - [I] A versão `coordenacao` não contém nenhuma sentinela de `mensagem_agente`, do tema em `execucao_agente`, de
    `consumo_ia.entrada` ou `saida` das execuções do titular, nem de `entrega.justificativa`. Contém a da conversa do
    Tutor.
  - [I] A versão `completa` contém todas essas sentinelas.
  - [I] Com o titular ainda com conta ativa, a versão `coordenacao` não existe e `POST pedidos/:id/arquivo` dá
    `NAO_ENCONTRADO`.
  - [I] Cada download grava `titular.arquivo_baixado`, com a finalidade.
  - [I] A coordenação não baixa a versão `completa`, e o colega da turma não baixa o arquivo do outro.
  - [I] "Meus dados" logado em B não lista o arquivo de A.
  - [I] Quando quem pede é o responsável legal, o arquivo sai na conta do aluno.
- **RF13, compartilhamento.**
  - [I] O compartilhamento é calculado com e sem `provedor`, e o provedor sem cadastro aparece como "não cadastrado".
  - [I] Depois do expurgo de 12 meses, o pedido ainda lista os suboperadores do período.
  - [I] O pedido de eliminação concluído ainda devolve o provedor.
  - [I] Dois professores da mesma escola, um que usou o Assistente com provedor externo e outro que nunca usou: a
    prévia, a foto e o `GET pedidos/:id` saem iguais (D64). As datas reais só aparecem na versão `completa`.
  - [I] Com um **aluno** e o provedor **sem cadastro**, a foto do pedido de eliminação concluído traz `origem` diferente de `periodo`,
    o que prova que foi refeita antes de anonimizar.
  - [I] Na mesma conta, o consumo feito em B não entra na foto do pedido de A.
- **RF13b.**
  - [I] O nome corrigido muda, e a auditoria não traz o nome.
  - [I] Corrigir o nome fora de um pedido de correção, ou com o pedido `concluido` ou `cancelado`, dá
    `PEDIDO_EM_ESTADO_INVALIDO`.
  - [I] O nome vazio, ou acima de 200 caracteres, dá erro tipado, e não o 23514 cru.
  - [I] Corrigir o nome em A não muda o `usuario` de B da mesma conta.
  - [I] Corrigir o nome e depois eliminar: o nome anterior não é procurado, e o limite está declarado na seção 13.
- **RF14, perda de acesso.**
  - [I] O token emitido antes do agendamento é recusado na requisição seguinte.
  - [I] O login com a senha certa e a renovação dão `ACESSO_SUSPENSO`.
  - [I] A senha errada numa conta suspensa dá o mesmo status, o mesmo corpo e a mesma contagem da matrícula inexistente.
  - [I] No login por e-mail e no seletor, a escola com eliminação agendada não aparece.
  - [I] Depois de cancelar, a mesma senha volta a entrar.
  - [I] O professor com eliminação agendada em A continua entrando em B.
- **RF14, prazo de 7 dias.**
  - [I] Cancelado no 6º dia, nada sai. No 8º dia, tudo sai.
  - [I] Cancelar depois de `eliminar_em`, ou depois de enfileirado, dá `PEDIDO_EM_ESTADO_INVALIDO`.
- **RF15, troca de nome.**
  - [I] Uma sentinela por coluna da lista: o nome completo some de todas.
  - [I] O primeiro nome sozinho fica, e o nome em outra caixa também é trocado.
  - [I] Um nome com apóstrofo, acento e metacaractere de regex dentro de `jsonb` sai, e o JSON continua válido.
  - [I] Com homônimo ativo ou nome livre igual na lista, não há troca, e o pedido marca `homonimo`. A prévia já marca
    `homonimo` nos dois casos.
  - [I] Com a janela letiva abrindo entre duas faixas da troca, o pedido não conclui, o nome continua só nas faixas não
    examinadas, e a execução seguinte termina a troca e elimina.
  - [I] Uma falha no `CicloDeVidaService.eliminar` desfaz a anonimização da etapa 3, e o pedido continua `agendado`.
  - [I] Fronteira de palavra: "Ana Souza" contido em "Mariana Souza" não é trocado.
  - [I] Cada linha alterada de artefato, entrega, execução e consumo grava `titular.nome_trocado`.
  - [I] A coordenação recebe só `nomeTrocado`, sem contagem por tabela.
  - [I] O que o mapa manda guardar continua lá, só com o id. A sentinela afirma os dois lados.
- **RF15, storage.**
  - [I] O armazém falso falha ao apagar, e a noite seguinte remove o objeto pelo `apagado_em`.
- **RF16.**
  - [I] O prazo conta de `chegou_em`: com `chegouEm` no passado, o pedido já aparece vencido.
  - [I] `concluir` uma eliminação e `cancelar` fora de `agendado` dão `PEDIDO_EM_ESTADO_INVALIDO`.
  - [I] Registrado, agendado, cancelado, concluído e lido vão para a auditoria.
- **RF17.**
  - [I] Um teste captura o log e as **outras** respostas e procura o nome semeado (o atual e o anterior a uma
    correção), o termo da busca e a URL assinada.
  - [I] As respostas de `arquivo` e de `baixar` levam `Cache-Control: no-store`. A URL assinada leva
    `response-cache-control=no-store` e `content-disposition=attachment`, com `meus-dados-AAAA-MM-DD.json`.
  - [I] Nenhum DTO traz `chave_objeto`.
  - [I] A busca vai no corpo, e a auditoria não traz o termo.
  - [I] As saídas de `ops:privacidade` não trazem nenhuma sentinela.
  - [I] Sem `pedidos.listados`, `pedido.lido` e `titular.previa_lida`, cada um com a finalidade, o teste falha.
  - [I] A prévia de professor não traz contagem nem período.

## Transversais

- **Isolamento (RF18).**
  - [I] O pedido, o arquivo, a prévia, a busca, o `cancelar`, o `concluir`, o `corrigir-nome` e o `arquivo` de B, a
    partir de A, respondem como inexistente.
  - [I] O expurgo de A não apaga linha de B, mesmo com prazo menor em A.
  - [I] A troca de nome em A não toca texto de B com o mesmo nome.
  - [I] O aluno transferido, desativado em A e ativo em B, tem pedidos separados.
  - [I] A mesma matrícula em outra escola é outro titular.
- **Concorrência (RF19).**
  - [P] Mesma chave duas vezes devolve o mesmo pedido.
  - [P] Duas chaves diferentes de eliminação para o mesmo titular: uma fica `agendado`, a outra recebe
    `PEDIDO_EM_ESTADO_INVALIDO`.
  - [P] Dois `titular.eliminar` do mesmo pedido.
  - [P] Cancelar na fronteira do prazo contra o enfileiramento.
  - [P] Dois `retencao.expurgar-escola` da mesma escola, com a soma das contagens certa.
  - [P] `sistema.expurgar-dado-pessoal` duas vezes na mesma noite: um job por escola.
  - [P] Dois `titular.montar-arquivo` do mesmo pedido.
  - [P] Dois `cancelar` do mesmo pedido.
  - [P] O expurgo de `pessoa_desativada` junto com a eliminação do mesmo usuário.
- **Autor `rotina`.**
  - [I] Auditoria com `rotina` em `entrega.aprovada`, em `entrega.rejeitada` ou na validação de lote é recusada pelo
    banco. Em `usuario.eliminado`, `acesso_turma.revogado`, `titular.nome_trocado` e `pedido.concluido`, é aceita.
  - [I] Criar operador com o apelido `rotina` é recusado.
  - [I] Autor da etapa 3: com a coordenadora que registrou ainda ativa, `pedido.concluido` e `usuario.eliminado` saem
    com o id dela; com ela desativada entre o agendamento e `eliminar_em`, o pedido conclui com `rotina`, sem erro do
    gatilho.
- **Chave de idempotência do job.**
  - [I] Um job com chave e sem escola é recusado pelo banco.
  - [P] As duas chamadas com a mesma chave recebem o mesmo id.
- **Rate limit da busca.**
  - [I] A 31ª busca no minuto dá 429 tipado.
  - [I] Duas coordenadoras da mesma escola e do mesmo IP têm 30 cada uma.
- **Aluno só na lista de nomes.**
  - [I] A busca não acha o nome livre nem o reivindicado.
  - [I] O reivindicado passa por "decidir" e "retirar", com as duas auditorias.
  - [E] A tela de Pedidos mostra o aviso que aponta para a lista da turma.
- **Arquitetura.**
  - [U] O teste falha quando um terceiro caminho importa a `ContaGlobalRepository`.
  - [U] Nem o barrel do `@educa/nucleo` nem o subcaminho `@educa/nucleo/ciclo-de-vida` exportam a
    `ContaGlobalRepository`, com o nome dela ou outro (tarefa 1.0).
  - [I] `eliminar` e `desativar` na transação de quem chama, que depois lança: os dois usuários, a conta e a auditoria
    continuam como estavam; sem a falha, tudo sai no commit de quem chama (tarefa 1.0).
  - [I] O que veio da API com o ciclo de vida (tarefa 1.0): a desativação não reencerra a sessão que já tinha saído; a
    limpeza da conta encerra a sessão aberta que escapou em outra escola; a eliminação trava só as turmas em que o
    usuário é professor, e nunca a outra turma do ano em que ele não tem vínculo; a revogação com turma não alcança o
    acesso dele em outra turma; o colega confirmado em outra disciplina, e o vínculo de aluno do mesmo usuário, não
    seguram o acesso de quem saiu; eliminar quem já tinha a conta limpa não a limpa de novo.
  - [U] O teste falha quando um caminho fora da lista toca `suboperador` ou `incidente`, e quando os dois repositórios da
    escola escrevem nessas tabelas.
  - [I] A `thread_agente` que ainda tem mensagem no prazo não sai.
- **Permissão.**
  - [I] O aluno e o professor em `/v1/privacidade/*` não chegam.
  - [I] A coordenação sem MFA não chega.
- **Falhas.**
  - [I] Com o armazém falso fora, o pedido fica "em preparação" e baixar dá `INDISPONIVEL`.
- **Telas (RF20).**
  - [E] Cada tela nova passa pela acessibilidade e pelos quatro estados: Pedidos, Retenção, Suboperadores, Incidentes e
    "Meus dados" do aluno e do professor.
  - [E] A coordenação escolhe o aluno certo entre dois homônimos, pela turma.
  - [E] A coordenação registra um pedido de acesso, e o aluno baixa `meus-dados-AAAA-MM-DD.json`.
  - [E] A coordenação baixa a versão da escola com a finalidade e o aviso de apagar, e o nome do arquivo é conferido.
  - [E] O aluno chega a "Meus dados" pela navegação (Privacidade, no rodapé, também na gaveta a 360 px).
  - [E] "Em preparação" vira "pronto" sem recarregar.
  - [E] A coordenação conclui um pedido e corrige um nome.
  - [E] A coordenação registra uma eliminação e a cancela.
