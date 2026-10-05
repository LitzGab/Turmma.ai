# Cenários de teste — lgpd-e-titular

Exigidos pela revisão da spec, rodada 1 (`revisao-spec.md`). Cada cenário diz o que precisa falhar se a regra sumir.
I = integração com Postgres real e relógio injetado · U = unidade · E = e2e em `chromebook` e `celular` com
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
- **RF4, prazo.**
  - [I] Por categoria: um dia antes do prazo, a linha fica; um dia depois, sai, ou é anonimizada como diz o catálogo.
  - [I] Reexecutar não apaga mais nada.
- **RF4, ajuste e travas.**
  - [I] Encurtar o prazo em A tira a linha de A e mantém a de B, com a mesma idade.
  - [I] Aumentar o prazo depois não devolve nada.
  - [I] Com `conversa_professor` em 3 meses, o tema em `execucao_agente` e em `consumo_ia` sai em 3 meses.
- **RF4, ano letivo.**
  - [I] Um ano com `fim` vencido além do prazo, mas `em_curso`, não perde nada.
  - [I] O mesmo ano `encerrado` perde.
- **RF4, `execucao_agente`.**
  - [I] Anonimizar uma linha `pendente`, uma `concluida` e uma `falhou` respeita os checks das migrations 0022 e 0023.
  - [I] A linha fica, as oito FKs que apontam para ela continuam válidas, e a soma da governança não muda.
- **RF4, `pessoa_desativada`.**
  - [I] O usuário desativado além do prazo é eliminado.
  - [I] Se ele está ativo em outra escola, a conta continua.
  - [I] Com pedido `agendado`, ele é pulado.
- **RF5.**
  - [I] O `expurgo_execucao` grava as contagens certas por escola e categoria, e só ids e números.
  - [I] Com a janela letiva aberta no meio do job, ele se reenfileira e para.
  - [F] Os dois alertas da fatia disparam: "duas noites sem expurgo" e os de pedido atrasado.
  - Carga: uma escola expurga 1 milhão de linhas enquanto outra usa o Tutor.
- **Prazos fixos.**
  - [I] O arquivo com 7 dias fica; com 8, somem o objeto e a linha.
  - [I] O incidente com 5 anos mais um dia sai pelo `sistema.expurgar-acesso`.
  - [I] O `expurgo_execucao` com 5 anos mais um dia sai.

## Fatia 2 — Suboperadores e incidente

- **RF6.**
  - [I] `ops:suboperador` cadastra e encerra o suboperador, com auditoria da operação.
  - [I] O encerrado fica no histórico com o período.
  - [I] Uma chave encerrada pode ser recadastrada.
- **RF7.**
  - [I] B não vê o suboperador `lista` que atende só A, e vê o de `todas`.
  - [I] Quando a ligação tem `fim`, o suboperador aparece como passado.
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
- **RF11, conteúdo do arquivo.**
  - [I] Uma sentinela em cada tabela classificada como do titular aparece no arquivo, e nada de outro titular ou de
    outra escola aparece.
  - [I] O professor que também está em B não leva nada de B no arquivo de A.
- **RF11, correção de lote.**
  - [I] A correção de um lote pendente ou rejeitado não aparece como resultado, em nenhuma das duas versões.
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
  - [I] A prévia e o compartilhamento de um professor não alcançam a execução de outra pessoa da escola.
- **RF13b.**
  - [I] O nome corrigido muda, e a auditoria não traz o nome.
  - [I] Corrigir o nome fora de um pedido de correção dá `PEDIDO_EM_ESTADO_INVALIDO`.
- **RF14, perda de acesso.**
  - [I] O token emitido antes do agendamento é recusado na requisição seguinte.
  - [I] O login e a renovação dão `ACESSO_SUSPENSO`.
  - [I] Depois de cancelar, a mesma senha volta a entrar.
  - [I] O professor com eliminação agendada em A continua entrando em B.
- **RF14, prazo de 7 dias.**
  - [I] Cancelado no 6º dia, nada sai. No 8º dia, tudo sai.
  - [I] Cancelar depois de `eliminar_em`, ou depois de enfileirado, dá `PEDIDO_EM_ESTADO_INVALIDO`.
- **RF15, troca de nome.**
  - [I] Uma sentinela por coluna da lista: o nome completo some de todas.
  - [I] O primeiro nome sozinho fica, e o nome em outra caixa também é trocado.
  - [I] Um nome com apóstrofo, acento e metacaractere de regex dentro de `jsonb` sai, e o JSON continua válido.
  - [I] Com homônimo ativo ou nome livre igual na lista, não há troca, e o pedido marca `homonimo`.
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
  - [I] Um teste captura o log e as respostas e procura o nome semeado, o termo da busca e a URL assinada.
  - [I] Nenhum DTO traz `chave_objeto`.
  - [I] A busca vai no corpo, e a auditoria não traz o termo.
  - [I] As saídas de `ops:privacidade` não trazem nenhuma sentinela.
  - [I] Sem `pedido.lido` e sem `titular.previa_lida`, o teste falha.
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
  - [E] A coordenação baixa a versão da escola com a finalidade.
  - [E] A coordenação conclui um pedido e corrige um nome.
  - [E] A coordenação registra uma eliminação e a cancela.
