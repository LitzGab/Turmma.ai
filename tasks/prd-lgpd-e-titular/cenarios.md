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
    anterior à migration da 7.0) não esbarra no check (testado na 15.0, no job `titular.eliminar` e no expurgo).
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
  - [I] (tarefa 8.0) A vigência que a escola lê é o início da ligação (ou do suboperador, em `todas`, nunca antes de a escola existir: a
    correção abaixo) e o mais cedo entre os dois `fim`; a escola
    que saiu da lista vê passado, e a outra, vigente. O recadastrado vem antes do encerrado de mesma chave. O DTO não traz id, contrato,
    operador nem escola.
  - [E] (tarefa 8.0) A aba "Empresas que recebem dados" lê as vigentes e as passadas, nunca as de outra escola; os quatro estados (carregando,
    erro, vazio e dado, mais o "só passadas"), em `chromebook` e `celular`, com acessibilidade; a segunda pessoa na mesma aba não vê as
    empresas da anterior.
  - **Correção da 8.0 (decisão do Joaquim, 09/10/2026): a vigência nunca é anterior à escola** (Tech Spec, seção 6). Os casos
    de integração ficam em `apps/api/test/suboperador.int.test.ts`. A data da escola é posta por `update escola set criada_em`
    com o `bancada.pool`, como o `update suboperador_escola` de `› RF7, passado`; o `todas` com data no passado, como o
    `update suboperador set inicio` de `› RF7, vigência da escola` ou o `insert` de `› RF7, a ordem`.
    - [I] O `todas` encerrado antes de a escola existir não aparece para ela, e aparece como passado para a escola que já
      existia: duas escolas, uma com `criada_em` antes do início da empresa e outra depois do fim. Sem o filtro, ou com a
      junção fora da escola do contexto, quebra.
    - [I] O `todas` vigente cadastrado antes da escola: o `inicio` lido é o `criada_em` dela; para a escola mais antiga que a
      empresa, é o início da empresa.
    - [I] Borda: `fim` igual ao `criada_em` fica fora; um segundo depois, aparece como passado, com `inicio` igual ao
      `criada_em`.
    - [I] O `lista` não muda: `› RF7, vigência da escola` segue como está até a parte do `todas`, que dá lugar aos casos
      acima (hoje ela espera o início da empresa numa escola criada depois).
    - [I] `› RF7, a ordem` segue provando a ordem: a escola do teste recebe `criada_em` anterior às duas vigências, senão
      as duas linhas somem.
    - [I] A escola criada pelo `criarEscola` nasce com `criada_em` preenchida pelo banco, entre o antes e o depois da
      chamada, sem o código informar: em `apps/api/test/ops-escola.int.test.ts › caminho feliz: cria rede e escola…`.
    - [U] O leitor importa só os schemas `suboperador` e `escola`, e não escreve: em `apps/api/test/arquitetura.test.ts ›
      o repositório da escola não escreve nas duas tabelas, nem em outra: só lê`.
    - O `update` da migration não tem teste automatizado: nenhum teste roda migration, e o banco de teste já nasce com a
      coluna. É conferido à mão numa transação desfeita, como o check da 0029 (tabela "Mutações" do `8_task.md`), e
      registrado no documento da correção.
    - Rodar: `npx vitest run --project integracao apps/api/test/suboperador.int.test.ts`. O e2e não muda.
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
  - [F] O alerta de 24 h sem confirmação dispara: 23 h não dispara, 25 h dispara (tarefa 9.0, `infra/test/alerta-do-incidente.int.test.ts`).
  - **Tarefa 9.0, onde cada um está.** `apps/api/test/incidente.int.test.ts`: registro (os números e os textos por escola, a auditoria
    de cada uma, as colunas das duas tabelas sem nada de titular), o texto que cita outra escola (nome em três grafias, id em três
    formas, nos três textos; o nome da própria escola passa), o arquivo e a escola (escola inexistente desfaz tudo, e cada campo
    inválido recusado sem o conteúdo), o banco (checks, único, FK da confirmação), isolamento (a lista, o id de outra escola, o
    inexistente e o que nem é id respondem igual), confirmação (quem, quando, uma auditoria, a lista com os pendentes primeiro),
    concorrência (`GatilhoDeParada` no `update`), permissão por papel e sem segundo fator, eliminação de quem confirmou e expurgo de
    5 anos. `apps/worker/test/expurgo-de-acesso.int.test.ts`: o alvo `incidente` (5 anos mais um dia sai com as seções, menos um dia
    fica; lote ordenado; duas execuções em paralelo). `apps/worker/test/medicao-do-incidente.int.test.ts`: a série por escola.
    `apps/api/test/ops-operador.int.test.ts` (C2): operador inexistente ou desativado é recusado. `apps/api/test/arquitetura.test.ts`:
    a parte `incidente`.
  - [E] O aviso aparece e é confirmado só com o teclado e a 360 px, com rolagem dentro do diálogo. "Ver depois" deixa a
    faixa fixa, e o Sair continua alcançável.
  - **Tarefa 10.0, onde cada um está** (`e2e/incidentes.spec.ts`, nos projetos `chromebook` e `celular`; os textos em
    `apps/web/src/areas/coordenacao/privacidade/textos-dos-incidentes.test.ts`). O aviso com todos os campos, sem o já
    confirmado, confirmado só com o teclado, o foco começando no texto, o foco preso, a rolagem dentro do diálogo e a gravação de
    quem e quando: `› o aviso traz todos os campos…`. "Ver depois", o Esc, a faixa que não fecha, o foco em "Ver o aviso", o Sair
    à mostra, a faixa em outra tela, a leitura única (relógio avançado e aba voltando) e a aba que relê e confirma:
    `› "Ver depois" e o Esc…`. Sair e entrar de novo traz o diálogo: `› sair com o aviso adiado…`. Duas coordenadoras (a faixa da
    segunda some ao abrir a aba; a que confirma depois da outra não recebe erro, e vale a primeira confirmação):
    `› duas coordenadoras…`, duas vezes. Dois incidentes (faixa e fila contam os dois, a aba mostra os dois, um por vez no diálogo,
    o foco no texto): `› dois incidentes…`, duas vezes. O clique duplo manda uma confirmação, e a falha diz o que fazer:
    `› o clique duplo…`. Os quatro estados da aba, com acessibilidade e sem rolagem de lado: `› carregando, erro…`.

## Fatia 3 — Pedido do titular

- **RF10.**
  - [I] O `POST pedidos` com `titularId` de B devolve o mesmo status e o mesmo corpo de um UUID inexistente.
  - [I] O pedido sobre si mesmo dá `NAO_ENCONTRADO`, inclusive pelo `usuario` professor da mesma conta.
  - [I] (tarefa 11.0) O pedido sobre a própria pessoa, registrado por **outra** coordenação, responde `NAO_ENCONTRADO` também nas rotas que o alcançam (`ler`, `concluir`, `corrigir-nome`) e não aparece na lista de quem é dele.
  - [I] (tarefa 11.0) A coordenação não é titular de pedido: a busca não acha o papel dela e o pedido sobre ela responde como o inexistente. É a RF10 ("o pedido de aluno ou professor da escola"); o caso da PRD, seção 7 ("a única coordenadora"), fica para a tarefa da eliminação decidir, com a migration que ampliar `papel_titular` se precisar (techspec §4, "Tarefa 11.0, como ficou no código").
  - [I] `chegouEm` no futuro é recusado.
  - [I] (tarefa 11.0) A chave de envio já usada só devolve o pedido que é este mesmo. Com outro titular, outro tipo, outro solicitante ou outra chegada (um caso para cada campo), ou registrada por outra coordenação da mesma escola, a resposta é `NAO_ENCONTRADO`, sem pedido nem auditoria novos e sem o nome do titular do pedido gravado (techspec §4, "A chave de envio é de quem registrou").
  - [I] Um `UPDATE` que troca o `escola_id` ou o `titular_id` do pedido é recusado.
- **RF11, conteúdo do arquivo.**
  - [I] Uma sentinela em cada tabela classificada como do titular aparece no arquivo, e nada de outro titular ou de
    outra escola aparece.
  - [I] O professor que também está em B não leva nada de B no arquivo de A.
  - [I] (tarefa 13.0) O ato do professor sobre outro aluno (o destaque que abriu, a reivindicação que decidiu, o lote que
    confirmou) entra só como ato, nas duas versões: sem o diagnóstico, o resumo do lote, o id, o nome e a linha da lista
    desse aluno, e sem o `antes` e o `depois` da auditoria (techspec §5, 13.0, "Pedido e quem o atendeu").
  - [I] (tarefa 13.0) O arquivo do aluno não leva o id da coordenação que atendeu o pedido, nem a auditoria em que ele é o
    alvo (`titular.previa_lida`, `pedido.lido`), nas duas versões, mesmo com a prévia e o pedido lidos antes de o job montar.
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
  - [I] (tarefa 13.0) A conferência do objeto e a assinatura da URL acontecem sem transação aberta, nas duas rotas de
    download, e a auditoria `titular.arquivo_baixado` é gravada antes de a resposta sair: o storage lento não prende conexão
    do banco (techspec §5, 13.0, "O download").
  - [U] (tarefa 13.0) O prazo do cliente do armazém corta a chamada: o storage que demora mais que ele vira
    `ArmazemIndisponivel`, e o que responde dentro dele é atendido. O cliente da API tem uma tentativa e 5 s; o padrão do
    worker, três tentativas e 10 s.
  - [I] (tarefa 13.0) As leituras do arquivo em `resposta_atividade`, `registro_acesso` e `correcao` (os destaques que o
    professor abriu) descem pelos três índices da `0034_indices_da_leitura_do_arquivo`, com volume, sem ler a tabela da
    escola inteira (regra 80, item 8).
  - **Tarefa 13.0, onde cada um está** (`apps/api/test/arquivo-do-titular.int.test.ts`, salvo o que diz outro arquivo; o job roda
    como o worker o roda, com o armazém falso e o relógio injetados). **Conteúdo:** uma sentinela por tabela do aluno e do professor,
    com outro aluno, o colega e a escola B no mesmo banco, e o professor com a mesma conta em B; o ato do professor sobre outro
    aluno sem o dado dele, e o arquivo do aluno sem o id da coordenação nem a leitura que ela fez. **Colunas proibidas:** as oito
    colunas de `COLUNAS_FORA_DO_ARQUIVO` que o titular alcança, nas duas versões; o conteúdo do artefato nunca sai.
    **Versão da escola:** o Tutor entra, e a conversa do professor, o tema, o texto do modelo e a justificativa não; com conta ativa
    a rota responde como o inexistente; ativo em B e desativado em A tem a versão em A; a versão apagada, vencida ou de pedido em
    preparação responde igual. **Correção:** lote aprovado, pendente e rejeitado, nas duas versões. **Quem baixa:** o próprio aluno,
    o colega, a coordenação e a escola B; "Meus dados" só lista o que é dele; o responsável legal baixa na conta do aluno.
    **D64:** dois professores, um que usou e outro que não, com a versão da escola igual e o `usoReal` só na completa. **Validade:**
    o 6º dia baixa e o 8º não, e a URL vale 300 s. **Cabeçalhos:** `no-store`, o nome `meus-dados-AAAA-MM-DD.json`, nenhum campo com
    a chave do objeto, a auditoria com a finalidade e a URL fora do log. **Falha:** o armazém fora (a montagem lança e o pedido segue
    `em_preparacao`; o download dá 503), o objeto perdido e o retorno; o storage consultado fora de transação, nas duas rotas; e o
    prazo do cliente, que corta a chamada (`packages/nucleo/src/titular/armazem-s3.test.ts`). **Concorrência:** dois `montar-arquivo` do mesmo pedido
    (`apps/worker/test/montar-arquivo.int.test.ts`), o `concluir` que espera o job (o `antes` da auditoria é `pronto`) e o clique duplo
    (`pedido-titular.int.test.ts`). **Plano:** o rastro, a contagem do texto do modelo, a leitura da auditoria e as três leituras
    da `0034` (respostas, acessos e destaques abertos). **Expurgo**
    (`apps/worker/test/expurgo-da-escola.int.test.ts`): 7 dias fica e 8 sai (objeto e linha), `apagado_em`, a falha ao apagar que a
    noite seguinte repara, 205 arquivos em três lotes e dois jobs ao mesmo tempo. **Alerta:** a medição
    (`apps/worker/test/medicao-do-arquivo.int.test.ts`) e a regra no Grafana (`infra/test/alerta-do-arquivo.int.test.ts`). **S3 de
    verdade:** `packages/nucleo/src/titular/armazem-s3.int.test.ts`, que confirma a premissa da seção 12.
- **RF13, compartilhamento.**
  - [I] O compartilhamento é calculado com e sem `provedor`, e o provedor sem cadastro aparece como "não cadastrado".
  - [I] Depois do expurgo de 12 meses, o pedido ainda lista os suboperadores do período.
  - [I] (triagem de 09/10/2026) O período da reserva é o do titular na escola: o suboperador `todas` encerrado antes de o
    aluno entrar não entra na foto, e `primeiroEm` nunca é anterior à entrada dele.
  - [I] O pedido de eliminação concluído ainda devolve o provedor.
  - [I] Dois professores da mesma escola, um que usou o Assistente com provedor externo e outro que nunca usou: a
    prévia, a foto e o `GET pedidos/:id` saem iguais (D64). As datas reais só aparecem na versão `completa`.
  - [I] Com um **aluno** e o provedor **sem cadastro**, a foto do pedido de eliminação concluído traz `origem` diferente de `periodo`,
    o que prova que foi refeita antes de anonimizar.
  - [I] Na mesma conta, o consumo feito em B não entra na foto do pedido de A.
  - [I] (tarefa 12.0) O aluno sem uso externo mostra só a hospedagem — o uso local não sai de casa nem vira reserva —, e o
    provedor que estava fora da vigência na data da chamada não casa: a linha é "não cadastrado", e a empresa não ganha
    linha.
  - [I] (tarefa 12.0) O período do professor encerrado fecha no `encerrado_em`, e a entrada do aluno é a mais antiga
    entre a conta externa e a credencial de matrícula.
  - **Tarefa 12.0, onde cada um está.** `apps/api/test/compartilhamento.int.test.ts`: escopo (o suboperador só de B, com
    a reserva sem o de B), com e sem `provedor` (o agrupamento e as duas vias de atribuição), a chave recadastrada (o
    mesmo provedor em duas empresas rende duas linhas, e a chamada depois do `fim` da ligação é "não cadastrado"),
    rastro expirado (com a expiração simulada pelo `aluno_id` anulado, como o expurgo da 4.0 deixa), D64 (com o
    terceiro professor que saiu), o professor com dois vínculos (o encerrado do ano passado e o aberto deste, e a foto
    vai até o fim do dia, não até o `encerrado_em`), mesma conta, sem uso e vigência, o aluno sem data de entrada (o
    período começa no horizonte do rastro, sem reserva), o grupo do rastro todo antes da entrada (que não entra na
    foto) e o fim do dia no fuso de São Paulo (a chamada de hoje depois das 21h UTC entra no rastro). O "o pedido de
    eliminação concluído ainda devolve o provedor" fica para a 15.0, que refaz a foto.
  - [I] (tarefa 13.0, triagem de 09/10/2026) Plano do rastro: os dois ramos do `union all` — o do `aluno_id` e o da
    execução que o titular pediu — e a contagem `texto_do_modelo` da prévia descem por índice que começa em
    `escola_id` (`consumo_ia_aluno_idx`, `execucao_agente_solicitada_por_idx` e o novo `consumo_ia (escola_id,
    execucao_id)`), e não leem o consumo da escola inteiro. Sem o índice novo, ou com o `or` de volta na consulta, o
    teste falha (techspec §5, "O índice do rastro"). Na tabela da 13.0, é o cenário "plano".
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
  - [I] A conta com a escola agendada como único acesso, com a senha certa, recebe `ACESSO_SUSPENSO`, e com a senha errada, a resposta de sempre; com outra escola ativa, entra nela sem a agendada.
  - [I] O cookie de renovação vencido, encerrado por saída ou já rotacionado de quem tem a eliminação agendada dá 401, como o desconhecido; nunca `ACESSO_SUSPENSO`.
  - [I] O aluno desativado com a eliminação registrada: a renovação e o login por matrícula respondem como a matrícula inexistente.
  - [I] A redefinição do segundo fator também registra a escola em que a pessoa tem a eliminação agendada.
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
  - [I] (tarefa 15.0) Mil linhas de texto grande (~60 KB) passam do orçamento de 4 MB da faixa, e a troca termina em várias
    faixas, dentro do `statement_timeout` de 2 s.
  - [I] (tarefa 15.0) A faixa leva só as linhas que cabem no orçamento: com a janela abrindo depois da primeira faixa, a
    linha que passaria dos 4 MB continua com o nome, e a execução seguinte a troca.
  - [I] (tarefa 15.0) Uma linha sozinha acima do orçamento da faixa entra sozinha nela, e a troca segue para as linhas
    seguintes: nenhuma fica com o nome, e o pedido conclui.
  - [I] Cada linha alterada de artefato, entrega, execução e consumo grava `titular.nome_trocado`.
  - [I] A coordenação recebe só `nomeTrocado`, sem contagem por tabela.
  - [I] O que o mapa manda guardar continua lá, só com o id. A sentinela afirma os dois lados.
- **RF15, storage.**
  - [I] O armazém falso falha ao apagar, e a noite seguinte remove o objeto pelo `apagado_em`.
  - **Tarefa 15.0, onde cada um está.** `apps/worker/test/eliminar-titular.int.test.ts` (o job inteiro): a expressão do nome no próprio
    Postgres (aspas, barra invertida, colchetes, chave igual ao nome, `\n` antes do nome, "Ana Souza" em "Mariana Souza"); prazo
    (antes de `eliminar_em`, cancelado, concluído, outra escola, dados inválidos); troca (uma sentinela por coluna, caixa, acento e
    apóstrofo, primeiro nome fica, auditoria por linha e sem entrada para a conversa do professor, outra escola intocada, limite
    de 160 e de 500, 1.001 linhas em duas faixas, 1.000 linhas de ~60 KB que passam do orçamento de 4 MB da faixa, a faixa
    cortada pelo orçamento com a janela abrindo depois dela, a linha sozinha acima do orçamento, linha antiga de `consumo_ia`);
    homônimo (ativo, lista livre, desativado);
    professor sem troca; janela abrindo entre faixas e a execução seguinte terminando; falha no `eliminar` desfazendo a etapa 3;
    autor (coordenação ativa e desativada → `rotina`); o que fica (execução anonimizada, consumo sem texto, arquivo marcado,
    outros pedidos concluídos, foto refeita com o provedor sem cadastro, o nome em nenhuma linha de pedido nem de auditoria);
    log só com `evento` e `status`; isolamento por método do repositório e da camada do arquivo; [P] dois jobs do mesmo pedido,
    cancelar contra a trava, a eliminação junto do expurgo da escola.
    `apps/worker/test/expurgo-da-escola.int.test.ts › eliminações vencidas`: enfileirar (prazo, 20 h, 500 por noite, outra escola,
    log, [P] dois jobs da escola, [P] o cancelamento segurando a linha) e a linha antiga de `consumo_ia` pelo expurgo.
    `apps/worker/test/medicao-da-eliminacao.int.test.ts` e `infra/test/alerta-da-eliminacao.int.test.ts` (47 h não dispara, 48 h
    dispara). `packages/nucleo/src/auditoria/auditoria.int.test.ts` (o autor `rotina` nas quatro ações e recusado nas outras),
    `apps/api/src/ops/operador.test.ts` e o mesmo arquivo (apelido `rotina`), e `apps/api/test/arquitetura.test.ts` (as ações sobre
    `usuario` e a lista de quem usa a rotina).
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
  - [P] Mesma chave duas vezes, com o mesmo conteúdo e da mesma coordenação, devolve o mesmo pedido.
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
