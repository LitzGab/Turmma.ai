# Tarefa 13.0 — O titular baixa o próprio arquivo, e a escola a versão dela

**Funcionalidade:** lgpd-e-titular · **Depende de:** 3.0, 11.0, 12.0 · **Paralelo com:** 14.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O pedido de acesso gera o JSON fora da requisição, no storage privado, e "Meus dados" e a versão da escola entregam URL de 5 min, sem nenhuma coluna proibida e sem correção não aprovada.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (o que entra no arquivo, colunas fora), 4 (`meus-dados`, `arquivo`) e 5 ("Arquivo")
- Regra 20 item 7; regra 70 itens 3 e 8
- Código: `apps/worker/src/storage/medidor-de-storage.ts` (cliente S3)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo
- `techspec.md` seção 5, "O índice do rastro" (triagem de 09/10/2026) e "Tarefa 12.0, como ficou no código"; seção 12 (a premissa do SeaweedFS)

## Subtarefas

- [x] 13.1 — Migration própria: `arquivo_titular` (§3); e `consumo_ia (escola_id, execucao_id)`, com o rastro em `union all` (§5, "O índice do rastro")
- [x] 13.2 — Porta `ArmazemDeArquivos` (S3 e falso); confirmar a URL assinada no SeaweedFS (seção 12)
- [x] 13.3 — `LeituraDoTitular` a partir da classificação; `titular.montar-arquivo` (normal, só ids no job)
- [x] 13.4 — Versões `completa` e `coordenacao` (conta ativa por escola); correção não aprovada só como estado
- [x] 13.5 — `GET`/`POST meus-dados`, `POST pedidos/:id/arquivo`, `no-store`, auditoria `titular.arquivo_baixado`
- [x] 13.6 — Expurgo dos arquivos vencidos ou com `apagado_em` na rotina; alerta `em_preparacao` > 2 h
- [x] 13.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/drizzle/0033_arquivo_titular.sql`, `meta/`, `db/schema/arquivo-titular.ts`, `pedido-titular.ts`, `consumo-ia.ts`, `auditoria.ts` | novo/alterado |
| `packages/nucleo/src/titular/leitura-do-titular.ts`, `arquivo-do-titular.repository.ts`, `armazem-de-arquivos.ts`, `armazem-s3.ts`, `compartilhamento.repository.ts` | novo/alterado |
| `packages/shared/src/privacidade/arquivo.ts`, `classificacao.ts`, `retencao.ts`, `permissao/matriz.ts` | novo/alterado |
| `apps/worker/src/processadores/montar-arquivo.ts`, `expurgar-escola.ts`, `medicao-do-arquivo.ts`, `montagem.ts`, `config.ts` | novo/alterado |
| `apps/api/src/privacidade/privacidade.service.ts`, `pedidos.repository.ts`, `titulares.repository.ts`, `meus-dados.controller.ts`, `configuracao-do-armazem.ts`, `privacidade.module.ts`, `app.module.ts`, `config.ts` | novo/alterado |
| `infra/compose.yml`, `infra/grafana/alertas/arquivo-em-preparacao.yaml`, `infra/grafana/paineis/fundacao.json`, `docs/runbook.md`, `docs/lgpd.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| conteúdo | integração | sentinela por tabela aparece; nada de outro titular nem de B; e-mail do professor nas duas |
| proibidas | integração | nenhuma de `COLUNAS_FORA_DO_ARQUIVO` nas duas versões; aluno sem conteúdo do artefato |
| versão da escola | integração | sem conversa do professor, com Tutor; só sem conta ativa nesta escola |
| correção | integração | lote pendente ou rejeitado não aparece como resultado |
| quem baixa | integração | coordenação não baixa a `completa`; colega não baixa; B não lista A; responsável: conta do aluno |
| D64 | integração | datas reais de uso só na `completa` |
| validade | integração | 7 dias fica, 8 sai; falha ao apagar volta pelo `apagado_em`; URL de 300 s |
| cabeçalhos | integração | `no-store`, `attachment`, `meus-dados-AAAA-MM-DD.json`; nenhum DTO com `chave_objeto` |
| falha | integração | armazém fora: "em preparação" e `INDISPONIVEL`; volta e conclui |
| concorrência | integração [P] | dois `montar-arquivo` do mesmo pedido |
| alerta | infra [F] | `em_preparacao` > 2 h |
| plano | integração | rastro e `texto_do_modelo` pelo índice novo |

## Como testar

- **storage real:** `apps/worker/test/uso.int.test.ts › borda: os bytes…` (`S3Client`, `PutObjectCommand`); o bucket acumula outras execuções. Armazém falso e URL assinada: sem precedente.
- **job, concorrência:** `apps/worker/test/reexecucao.int.test.ts › worker morto…` e `› oito gravações…` (`BancadaDeFila`, `LogEmMemoria`).
- **conteúdo, proibidas:** `apps/api/test/painel-leitura.int.test.ts › com sentinelas…`.
- **quem baixa:** `apps/api/src/ia/ia.int.test.ts › de outra pessoa, de outra escola…`.
- **validade, plano:** `apps/worker/test/expurgo-da-escola.int.test.ts › com 5 anos e um dia…` (`relogioEm`) e `› as FKs set null…` (`explain`).
- **alerta:** `infra/test/alerta-do-expurgo.int.test.ts`, com `--project infra`.
- Rodar: `npx vitest run --project integracao <arquivo>`.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As telas (17.0, 18.0); a eliminação (15.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| O `POST pedidos` de acesso e de portabilidade passa a nascer `em_preparacao` e a enfileirar o `titular.montar-arquivo` na mesma transação; compartilhamento e correção seguem `recebido` | A seção 5 ("Arquivo") já dizia "o pedido nasce `em_preparacao`", e a 11.0 o gravava `recebido` até haver job. Dois testes da 11.0 mudaram o estado esperado (`antes` da auditoria do concluir) | `techspec.md` §5, "Tarefa 13.0, como ficou no código", 1º item; `cenarios.md` RF12, "Tarefa 13.0, onde cada um está" |
| `CLASSIFICACAO_DAS_TABELAS.pedido_titular` liga só por `titular_id`: `registrado_por`, `concluido_por` e `cancelado_por` ficam fora do arquivo | Decisão que a 11.0 deixou para esta tarefa ("escolher um critério para as três colunas"): são o id de outra pessoa | `techspec.md` §5, 13.0, "Pedido e quem o atendeu"; `docs/lgpd.md`, "O arquivo do titular" |
| A auditoria em que o titular é **alvo** (`titular.previa_lida`, `pedido.lido`) não entra no arquivo; entra só a em que ele é o autor | Decisão que a 11.0 deixou para esta tarefa: a leitura da coordenação traz o id de quem leu, que é de outra pessoa | `techspec.md` §5, 13.0, "Pedido e quem o atendeu"; `docs/lgpd.md` |
| Índice novo `auditoria (escola_id, autor_usuario_id, em) where autor_usuario_id is not null`, que a seção 7c não lista | O arquivo lê a auditoria do titular; sem o índice, a leitura percorre a da escola inteira (regra 80, item 8) | `techspec.md` §5, 13.0, "A migration é a `0033`" |
| O arquivo da escola é conferido de novo na hora de baixar: o titular segue sem conta ativa | A versão da escola existe só enquanto ele não pode baixar o dele; se voltou a ter conta, a exceção à regra 20, item 14, deixa de se justificar | `techspec.md` §5, 13.0, "Conta ativa"; `cenarios.md` RF12 |
| "Conta ativa" é `usuario.desativado_em is null` | A coluna `eliminacao_agendada_em` nasce na 14.0; o predicado mora num lugar só (`ArquivoDoTitularRepository.contaAtiva`) para ela somar | `techspec.md` §4 ("Conta ativa") e §5, 13.0 |
| `usoReal` (as datas reais de uso por empresa) só na versão **completa** do professor; a versão da escola traz o registro de uso por exceção do PRD, seção 6 | O PRD, seção 6, e a Tech Spec, seção 7b, declaram que a versão da escola do professor sem conta ativa traz o registro de uso (exceção à D64); a linha "D64" da tabela de testes e o `cenarios.md` RF13 dizem que "as datas reais só aparecem na completa". Lido como: o **compartilhamento** (foto por período para a coordenação, uso real só para ele) | `techspec.md` §5, 13.0, "O arquivo tem `resumo` legível e `compartilhamento`"; §7b |
| A API passa a ler o storage (`STORAGE_URL`, `STORAGE_URL_PUBLICA`, credencial), e o `worker-interativo`, que atende a fila `normal`, também | A seção 4 manda a API devolver a URL de 5 minutos, e ela só assina quem tem a credencial; o job de `normal` grava o objeto. A seção 12 previa a API servir o objeto se o SeaweedFS não assinasse: assina (verificado) | `techspec.md` §12 (premissa verificada) e §5, 13.0, "A API ganha as variáveis do storage" |
| A finalidade do `POST pedidos/:id/arquivo` é de lista fechada (`entregar_ao_titular`, `entregar_ao_responsavel_legal`), e a do titular em "Meus dados", `acesso_do_proprio_titular` | A seção 4 diz `{ finalidade }`; a auditoria só aceita finalidade de lista fechada (regra 20, item 10) | `techspec.md` §5, 13.0, "O download" |
| O job apaga os arquivos vencidos **sem** categoria de retenção nem linha em `expurgo_execucao`: só a contagem no log (`arquivosApagadosTotal`, `arquivosNaoApagadosTotal`) | O arquivo é prazo fixo (`arquivo_do_titular`, o décimo de `PRAZOS_FIXOS`, com texto na tela de Retenção), e a seção 5 pede só "remove do storage… e só então a linha" | `techspec.md` §3 ("Classificação") e §5, 13.0, "O expurgo" |
| O job repetido depois de pronto conta os 7 dias de novo | A entrega é pelo menos uma vez (D49); o `on conflict do update` é o que a seção 5 manda, e o `apagado_em` nunca é limpo por ele | `techspec.md` §5, 13.0, "O job" |
| A leitura da auditoria não traz `antes` nem `depois` | O `depois` de `correcao.destaque_aberto` e de `reivindicacao.decidida` leva o `alunoId` (e os motivos) de outra pessoa; o critério 2 da seção 5 manda o ato entrar sem o dado dela | `techspec.md` §5, 13.0, "Pedido e quem o atendeu"; `docs/lgpd.md`, "O arquivo do titular" |
| Uma segunda migration, a `0034_indices_da_leitura_do_arquivo`, com três índices que a seção 7c não lista | A leitura do arquivo lê `resposta_atividade` por `aluno_id`, `registro_acesso` por `usuario_id` e `correcao` por `destaque_aberto_por`, e os índices existentes não servem o filtro (regra 80, item 8) | `techspec.md` §5, 13.0, "A migration é a `0033`" |
| A consulta ao armazém e a assinatura da URL saem da transação do banco; o cliente S3 da API usa uma tentativa só e prazo de 5 s (`TENTATIVAS_DO_ARMAZEM_NA_API`, `TIMEOUT_DO_ARMAZEM_NA_API_MS`), e o do worker segue com três tentativas | Regra 80, itens 3 e 4: com a transação aberta, o storage lento prendia uma conexão do pool de todas as escolas, e as três tentativas seguravam o cliente por até ~30 s | `techspec.md` §5, 13.0, "O download" |
| No teste da D64, a prova das datas é do campo `usoReal` e do compartilhamento, e não do texto inteiro da versão da escola | A versão da escola traz o `em` de cada chamada em `consumo_ia` (o registro de uso, por exceção do PRD, seção 6): as datas aparecem ali, e `usoReal` não | `techspec.md` §5, 13.0, "O arquivo tem `resumo` legível e `compartilhamento`"; `cenarios.md` RF12 |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta. Cada uma foi **apagada, rodada
e restaurada** (um harness trocou o trecho no arquivo, rodou só o teste da coluna ao lado e devolveu o arquivo); todas ficaram
vermelhas. Nome do teste sem número de linha, o arquivo do teste é o da coluna.

Arquivos de teste: a leitura, a coluna de ligação de cada tabela e as versões, em `apps/api/test/arquivo-do-titular.int.test.ts`
(salvo o que tem outro arquivo na linha: `leitura-do-titular.test.ts`, `armazem-s3.test.ts`, `config.test.ts` da API e do worker, `arquitetura.test.ts`,
`montar-arquivo.int.test.ts`, `expurgo-da-escola.int.test.ts` e `medicao-do-arquivo.int.test.ts`).

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › usuario › t.id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › conta › u.id = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › credencial_matricula › t.usuario_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › conta_externa › t.usuario_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › vinculo › t.usuario_id = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › lista_nome › t.usuario_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › reivindicacao › l.usuario_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › reivindicacao › t.decidida_por = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › sessao › t.usuario_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › registro_acesso › t.usuario_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › mensagem_tutor › t.aluno_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › sinal_tutor › t.aluno_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › thread_agente › t.usuario_id = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › mensagem_agente › h.usuario_id = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › execucao_agente › t.solicitada_por = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › consumo_ia › t.aluno_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › consumo_ia › e.solicitada_por = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › tentativa_atividade › t.aluno_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › resposta_atividade › t.aluno_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › correcao › t.aluno_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › correcao › t.destaque_aberto_por = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › artefato › t.criado_por = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › entrega › t.decidida_por = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › atividade_aplicada › t.aplicada_por = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › validacao_do_lote › t.confirmada_por = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › material › t.enviado_por = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › material › t.excluido_por = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › suspensao_de_funcao › t.suspensa_por = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › suspensao_de_funcao › t.retomada_por = titular | `o professor: cada tabela que ele tem aparece, com o e-mail da conta, e nada do colega nem de outra escola da mesma conta` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › auditoria › t.autor_usuario_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LEITURAS_DO_ARQUIVO › pedido_titular › t.titular_id = titular | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `arquivo-do-titular.repository.ts` › contaAtiva › linha.desativadoEm === null | `nenhuma coluna de COLUNAS_FORA_DO_ARQUIVO aparece, em nenhuma das duas versões` |
| `arquivo-do-titular.repository.ts` › contaAtiva › linha === undefined | `o pedido que não gera arquivo (compartilhamento), o titular que já não existe e o pedido de outra escola terminam sem efeito` |
| `arquivo-do-titular.repository.ts` › gravar › set: { bytes, prontoEm, expiraEm } | `o job repetido depois de pronto grava a mesma linha de novo: uma só por versão, a validade conta de novo, e o pedido concluído continua c…` |
| `arquivo-do-titular.repository.ts` › marcarPronto › estado = em_preparacao | `o job repetido depois de pronto grava a mesma linha de novo: uma só por versão, a validade conta de novo, e o pedido concluído continua c…` |
| `arquivo-do-titular.repository.ts` › doPedido › versao | `só a versão da escola existe: o titular não baixa a versão que não é a dele, e com as duas versões a lista traz um pedido só e cada rota …` |
| `arquivo-do-titular.repository.ts` › doPedido › pedidoId | `a versão da escola apagada ou vencida responde como o id inexistente, e o pedido ainda em preparação não serve o arquivo de outro pedido …` |
| `arquivo-do-titular.repository.ts` › aApagar › or(apagado_em, vencido) só vencido | `o arquivo marcado `apagado_em` sai mesmo dentro dos 7 dias, e o que falha ao apagar fica com a linha para a noite seguinte` |
| `arquivo-do-titular.repository.ts` › aApagar › or(apagado_em, vencido) só apagado_em | `com 7 dias o arquivo fica; com 8 saem o objeto e a linha; o de B, com a mesma idade, não é tocado` |
| `arquivo-do-titular.repository.ts` › aApagar › lt(expira_em) vira lte | `com 7 dias o arquivo fica; com 8 saem o objeto e a linha; o de B, com a mesma idade, não é tocado` |
| `arquivo-do-titular.repository.ts` › apagarLinhas › inArray(id) | `com 7 dias o arquivo fica; com 8 saem o objeto e a linha; o de B, com a mesma idade, não é tocado` |
| `arquivo-do-titular.repository.ts` › registradoEmDoEmPreparacaoMaisAntigo › estado = em_preparacao | `a série é a idade do pedido mais antigo em preparação: 1 h, 3 h, o mais antigo entre dois, e o pronto, o concluído e a escola sem pedido …` |
| `arquivo-do-titular.repository.ts` › pedidosDoUsuario › titular_id | `"Meus dados" lista só os pedidos da própria pessoa na escola ativa, com a validade, e a escola B não lista os de A` |
| `arquivo-do-titular.repository.ts` › pedidosDoUsuario › leftJoin versao = 'completa' | `só a versão da escola existe: o titular não baixa a versão que não é a dele, e com as duas versões a lista traz um pedido só e cada rota …` |
| `arquivo-do-titular.repository.ts` › arquivoCompletoDoUsuario › versao = 'completa' | `só a versão da escola existe: o titular não baixa a versão que não é a dele, e com as duas versões a lista traz um pedido só e cada rota …` |
| `arquivo-do-titular.repository.ts` › arquivoCompletoDoUsuario › titular_id | `o aluno baixa a própria versão completa; o colega, a coordenação e a escola B respondem como o id inexistente` |
| `arquivo-do-titular.repository.ts` › registradoEmDoEmPreparacaoMaisAntigo › escola_id | `a série é a idade do pedido mais antigo em preparação: 1 h, 3 h, o mais antigo entre dois, e o pronto, o concluído e a escola sem pedido …` |
| `privacidade.service.ts` › registrarPedido › geraArquivo (tipo) | `acesso e portabilidade nascem em preparação e enfileiram o job na mesma transação; compartilhamento e correção nascem recebidos, sem job` |
| `privacidade.service.ts` › registrarPedido › estado geraArquivo ? em_preparacao : recebido | `acesso e portabilidade nascem em preparação e enfileiram o job na mesma transação; compartilhamento e correção nascem recebidos, sem job` |
| `privacidade.service.ts` › registrarPedido › if (geraArquivo) enfileirar | `acesso e portabilidade nascem em preparação e enfileiram o job na mesma transação; compartilhamento e correção nascem recebidos, sem job` |
| `privacidade.service.ts` › registrarPedido › if (id !== undefined) (reenvio não enfileira) | `o reenvio da mesma chave não enfileira um segundo job` |
| `privacidade.service.ts` › concluirPedido › antes = anterior do update | `o `antes` da auditoria do concluir é o estado que o `update` trocou, mesmo com o job passando o pedido para `pronto` entre a leitura e a …` |
| `privacidade.service.ts` › arquivoDaEscola › !#vale | `a versão da escola apagada ou vencida responde como o id inexistente, e o pedido ainda em preparação não serve o arquivo de outro pedido …` |
| `privacidade.service.ts` › arquivoDaEscola › contaAtiva !== false | `só a versão da escola existe: o titular não baixa a versão que não é a dele, e com as duas versões a lista traz um pedido só e cada rota …` |
| `privacidade.service.ts` › #assinar › existe | `o objeto que a linha diz que existe e o storage perdeu também dá INDISPONIVEL_TENTE_DE_NOVO, sem assinar nada` |
| `privacidade.service.ts` › #vale › só vencimento | `a versão da escola apagada ou vencida responde como o id inexistente, e o pedido ainda em preparação não serve o arquivo de outro pedido …` |
| `privacidade.service.ts` › #vale › só apagado_em | `a versão da escola apagada ou vencida responde como o id inexistente, e o pedido ainda em preparação não serve o arquivo de outro pedido …` |
| `privacidade.service.ts` › meusDados › situacao só vencimento | `o arquivo marcado `apagado_em` (a eliminação do titular) não baixa, mesmo dentro dos 7 dias` |
| `privacidade.service.ts` › meusDados › situacao só apagado_em | `a URL vale 300 s, o arquivo vale até o 7º dia, e no 8º a rota responde como o id inexistente` |
| `meus-dados.controller.ts` › MeusDadosController › baixar sem corpo | `o corpo do `baixar` não leva campo: o que vier é entrada inválida, e nada é assinado` |
| `montar-arquivo.ts` › criarMontagemDoArquivo › tipo sem arquivo | `o pedido que não gera arquivo (compartilhamento), o titular que já não existe e o pedido de outra escola terminam sem efeito` |
| `montar-arquivo.ts` › criarMontagemDoArquivo › pedido === undefined | `o pedido que não gera arquivo (compartilhamento), o titular que já não existe e o pedido de outra escola terminam sem efeito` |
| `montar-arquivo.ts` › criarMontagemDoArquivo › ativa === undefined | `o pedido que não gera arquivo (compartilhamento), o titular que já não existe e o pedido de outra escola terminam sem efeito` |
| `montar-arquivo.ts` › criarMontagemDoArquivo › versões ativa ? completa : completa+coordenacao (sempre as duas) | `grava o JSON no armazém, uma linha por versão, a validade de 7 dias do instante em que ficou pronto, e passa o pedido para `pronto`` |
| `montar-arquivo.ts` › criarMontagemDoArquivo › versões (nunca a da escola) | `o titular desativado nesta escola ganha também a versão da escola` |
| `montar-arquivo.ts` › criarMontagemDoArquivo › strictObject | `o job só aceita o id do pedido: dado a mais ou fora do formato, e a falta de escola no contexto, são falha definitiva` |
| `montar-arquivo.ts` › criarMontagemDoArquivo › escolaId === undefined | `o job só aceita o id do pedido: dado a mais ou fora do formato, e a falta de escola no contexto, são falha definitiva` |
| `expurgar-escola.ts` › apagarArquivosDoTitular › janela letiva | `com a janela letiva aberta nenhum arquivo é apagado: o lote não urgente espera a noite` |
| `expurgar-escola.ts` › apagarArquivosDoTitular › sairam.length === 0 | `o arquivo marcado `apagado_em` sai mesmo dentro dos 7 dias, e o que falha ao apagar fica com a linha para a noite seguinte` |
| `montagem.ts` › montarWorker › processador da fila normal | `trilha: o job sai do banco pelo despachante, roda no worker montado da fila normal e grava o JSON no SeaweedFS de verdade` |
| `montagem.ts` › montarRotinas › medição do arquivo iniciada | `montada no worker de lote: mede no boot as escolas do banco e para com o worker` |
| `matriz.ts` › matriz › meus_dados da coordenação | `o aluno baixa a própria versão completa; o colega, a coordenação e a escola B respondem como o id inexistente` |
| `matriz.ts` › matriz › meus_dados do aluno | `o aluno baixa a própria versão completa; o colega, a coordenação e a escola B respondem como o id inexistente` |
| `leitura-do-titular.ts` › LeituraDoTitular.montar › naVersao (thread e mensagem do professor só na completa) | `sem conta ativa, a versão da escola traz o Tutor e não traz a conversa, o tema, o texto do modelo nem a justificativa; a completa traz tudo` |
| `leitura-do-titular.ts` › porVersao › versao === 'completa' | `sem conta ativa, a versão da escola traz o Tutor e não traz a conversa, o tema, o texto do modelo nem a justificativa; a completa traz tudo` |
| `leitura-do-titular.ts` › LeituraDoTitular.montar › tabela sem linha não entra | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › LeituraDoTitular.montar › usoReal só na completa | `as datas reais de uso saem só na versão completa: a versão da escola do professor que usou e a do que não usou têm o mesmo compartilhamento` |
| `leitura-do-titular.ts` › LeituraDoTitular.montar › usoReal só do professor | `o aluno: cada tabela que ele tem aparece, e a linha de outro aluno e a de outra escola não` |
| `leitura-do-titular.ts` › semNulosDaCorrecao › situacao aprovada | `o lote pendente ou rejeitado sai só como estado, sem acertos nem diagnóstico, nas duas versões; o aprovado traz o resultado` |
| `leitura-do-titular.ts` › correcao › case when aprovada (acertos) | `a correção do aluno só sai do banco com o lote aprovado: cada número e o diagnóstico passam pelo `case` da entrega` |
| `leitura-do-titular.ts` › correcao › estado do lote aprovada | `a correção do aluno só sai do banco com o lote aprovado: cada número e o diagnóstico passam pelo `case` da entrega` |
| `leitura-do-titular.ts` › colunasDoSelect › formato do nome | `recusa o nome fora do formato "id; drop table usuario": nada que não seja nome de coluna chega ao SQL` |
| `leitura-do-titular.ts` › execucao_agente › entrada só na completa | `sem conta ativa, a versão da escola traz o Tutor e não traz a conversa, o tema, o texto do modelo nem a justificativa; a completa traz tudo` |
| `leitura-do-titular.ts` › entrega › justificativa só na completa | `sem conta ativa, a versão da escola traz o Tutor e não traz a conversa, o tema, o texto do modelo nem a justificativa; a completa traz tudo` |
| `leitura-do-titular.ts` › consumo_ia › entrada e saida só na completa | `sem conta ativa, a versão da escola traz o Tutor e não traz a conversa, o tema, o texto do modelo nem a justificativa; a completa traz tudo` |
| `armazem-s3.ts` › ArmazemS3.urlDeDownload › response-cache-control | `assina com o endereço público, a validade pedida, `no-store` e `attachment` com o nome do arquivo, sem rede` |
| `armazem-s3.ts` › ArmazemS3.urlDeDownload › content-disposition attachment | `assina com o endereço público, a validade pedida, `no-store` e `attachment` com o nome do arquivo, sem rede` |
| `armazem-s3.ts` › ArmazemS3.guardar › CacheControl no-store | `guarda o objeto sem cache e como anexo, e o apaga pelo mesmo caminho` |
| `armazem-s3.ts` › ArmazemS3.existe › NotFound | `qualquer outra falha do storage vira ArmazemIndisponivel, sem o texto do SDK, que traz o endereço e a chave` |
| `armazem-s3.ts` › ArmazemS3.criar › endereço público | ``criar` usa o endereço público para assinar e o interno para falar com o storage, e os dois encerram` |
| `configuracao-do-armazem.ts` › lerConfiguracaoDoArmazem › STORAGE_URL_PUBLICA opcional | `converte o ambiente em configuração tipada` |
| `config.ts` › lerConfiguracao do worker › storage da fila normal | `converte o ambiente: só as filas de FILAS, cada uma com o próprio pool` |
| `classificacao.ts` › classificacao › pedido_titular liga só por titular_id | `cada coluna de ligação que a classificação dá à tabela é lida: a leitura não ignora uma das formas de a linha chegar ao titular` |
| `classificacao.ts` › classificacao › arquivo_titular classificada | `a CLASSIFICACAO_DAS_TABELAS confere com as migrations, nos dois sentidos, e as colunas fora do arquivo existem e cobrem todo segredo` |
| `montar-arquivo.ts` › processador › bytes do objeto | `grava o JSON no armazém, uma linha por versão, a validade de 7 dias do instante em que ficou pronto, e passa o pedido para `pronto`` |
| `privacidade.service.ts` › PEDIDOS_EM_MEUS_DADOS = 50 | `"Meus dados" lista do pedido mais novo para o mais antigo, e no máximo 50` |
| `arquivo-do-titular.repository.ts` › pedidosDoUsuario › orderBy desc(id) | `"Meus dados" lista do pedido mais novo para o mais antigo, e no máximo 50` |
| `leitura-do-titular.ts` › correcao › 2ª consulta (destaque_aberto_por) sem dado do aluno | `o ato do professor sobre outro aluno entra sem o dado do aluno, nas duas versões` |
| `leitura-do-titular.ts` › validacao_do_lote › apresentado fora | `o ato do professor sobre outro aluno entra sem o dado do aluno, nas duas versões` |
| `leitura-do-titular.ts` › reivindicacao › ramo decidida_por sem lista_nome_id | `o ato do professor sobre outro aluno entra sem o dado do aluno, nas duas versões` |
| `leitura-do-titular.ts` › auditoria › antes e depois fora | `o ato do professor sobre outro aluno entra sem o dado do aluno, nas duas versões` |
| `leitura-do-titular.ts` › auditoria › só o autor (não a entidade) | `o arquivo do aluno não leva o id da coordenação nem a leitura que ela fez do titular, nas duas versões` |
| `leitura-do-titular.ts` › tentativa_atividade › sem o conteúdo do artefato | `o aluno não leva o conteúdo do artefato aplicado, e o professor também não: só o título` |
| `compartilhamento.repository.ts` › usoReal › primeira chamada (min(c.em)) | `as datas reais de uso saem só na versão completa: a versão da escola do professor que usou e a do que não usou têm o mesmo compartilhamento` |
| `compartilhamento.repository.ts` › usoReal › só envio externo | `as datas reais de uso saem só na versão completa: a versão da escola do professor que usou e a do que não usou têm o mesmo compartilhamento` |
| `compartilhamento.repository.ts` › usoReal › group by provedor | `as datas reais de uso saem só na versão completa: a versão da escola do professor que usou e a do que não usou têm o mesmo compartilhamento` |
| `privacidade.service.ts` › arquivoDaEscola › assinar dentro da transação | `a consulta ao storage não acontece com transação aberta: o storage lento não prende conexão do banco` |
| `privacidade.service.ts` › baixarMeuArquivo › assinar dentro da transação | `a consulta ao storage não acontece com transação aberta: o storage lento não prende conexão do banco` |
| `armazem-s3.ts` › criarClienteDoArmazem › tentativas ?? 3 | `o cliente da API usa uma tentativa só e prazo próprio; o padrão do worker é de três tentativas` |
| `configuracao-do-armazem.ts` › lerConfiguracaoDoArmazem › tentativas | `converte o ambiente em configuração tipada` |
| `configuracao-do-armazem.ts` › lerConfiguracaoDoArmazem › timeoutRequisicaoMs | `converte o ambiente em configuração tipada` |
| `0034_indices_da_leitura_do_arquivo.sql` › 0034 › resposta_atividade_aluno_idx | `as leituras do arquivo em tabelas que crescem com o aluno descem pelo índice da pessoa: respostas, acessos e destaques abertos` |
| `0034_indices_da_leitura_do_arquivo.sql` › 0034 › registro_acesso_usuario_idx | `as leituras do arquivo em tabelas que crescem com o aluno descem pelo índice da pessoa: respostas, acessos e destaques abertos` |
| `0034_indices_da_leitura_do_arquivo.sql` › 0034 › correcao_destaque_aberto_por_idx | `as leituras do arquivo em tabelas que crescem com o aluno descem pelo índice da pessoa: respostas, acessos e destaques abertos` |
| `arquivo-do-titular.repository.ts` › apagarArquivosDoTitular › aApagar sem escola_id (por asserção) | `com 7 dias o arquivo fica; com 8 saem o objeto e a linha; o de B, com a mesma idade, não é tocado` |
| `privacidade.service.ts` › registrarPedido › enfileira também no reenvio | `[P] a mesma chave de envio duas vezes ao mesmo tempo grava um pedido só, e as duas chamadas devolvem o mesmo` |
| `armazem-s3.ts` › ArmazemS3.urlDeDownload › expiresIn = validade pedida | `assina com o endereço público, a validade pedida, `no-store` e `attachment` com o nome do arquivo, sem rede` |
| `pedidos.repository.ts` › concluir › for update da subconsulta | `o `antes` da auditoria do concluir é o estado que o `update` trocou, mesmo com o job passando o pedido para `pronto` entre a leitura e a escrita` |
| `armazem-s3.ts` › criarClienteDoArmazem › throwOnRequestTimeout: true | `o prazo corta a chamada: o storage que demora mais que o prazo do cliente vira ArmazemIndisponivel, e o que responde dentro dele é atendido` (e `o cliente da API usa uma tentativa só e prazo próprio; o padrão do worker é de três tentativas`) |
| `armazem-s3.ts` › criarClienteDoArmazem › timeoutRequisicaoMs ?? padrão | `o cliente da API usa uma tentativa só e prazo próprio; o padrão do worker é de três tentativas` (e `o prazo corta a chamada: …`) |
| `pedidos.repository.ts` › `de` › o `escola_id` **e** `arquivo-do-titular.repository.ts` › `doPedido` › o `escola_id` **e** `contaAtiva` › o `escola_id` (os três cortes juntos) | `a coordenação de B não alcança, pela rota da escola, o arquivo do pedido de A` |
| `leitura-do-titular.ts` › `semNulosDaCorrecao` › `!('situacao' in linha)` (só a linha do aluno passa pelo strip) | `o ato do professor sobre outro aluno entra sem o dado do aluno, nas duas versões` (a mutação do SQL da 2ª consulta só fica vermelha com este termo: sem ele o strip de TypeScript a mascarava) |

**Com um corte só ou dois, o isolamento da rota da escola continua de pé** (camadas de defesa; o caso de B só fica vermelho com os três
cortes acima): `pedidos.repository.ts › de`, `arquivo-do-titular.repository.ts › doPedido` e `contaAtiva`, cada um com o `escola_id`. Com
só os dois primeiros fora, o `contaAtiva` ainda responde `undefined` (o usuário de A não existe em B) e a rota dá `NAO_ENCONTRADO`; é a
terceira camada, e a ordem de correção esperava vermelho com dois.

**Equivalentes, sem teste vermelho possível** (e por quê):

- `leitura-do-titular.ts` › `LEITURAS_DO_ARQUIVO` › **`t.escola_id = escolaId` em cada leitura**, e o `u.escola_id` da `conta`, o
  `h.escola_id` e o `l.escola_id` das subconsultas, e o `e.escola_id = t.escola_id` das junções: é a segunda camada (regra 10, item
  3). A coluna da pessoa (`usuario_id`, `aluno_id`, `solicitada_por`, `autor_usuario_id`, `titular_id`) é id de um `usuario` de uma
  escola só, e cada tabela a prende à escola por FK composta (`mensagem_tutor`, `consumo_ia`, `tentativa_atividade`, `vinculo`,
  `credencial_matricula`, `conta_externa`...) ou por gatilho (`auditoria_autor_da_escola_fk`, `pedido_titular_titular_da_escola`,
  `exigir_equipe_da_escola`): nenhuma linha de outra escola aponta para o titular. O teste de conteúdo tem a escola B com o mesmo
  tipo de linha, e a mesma conta do professor em B.
- `arquivo-do-titular.repository.ts` › `pedidoParaMontar`, `contaAtiva`, `doPedido` (o `escola_id`), `arquivoCompletoDoUsuario` e
  `apagarLinhas` (o `escola_id`): o id do pedido e o da linha são uuid que só existem numa escola, e o `pedidoId` e o `usuarioId`
  vêm antes de uma conferência por objeto no service (`#pedidoAlvo`, `titular_id` da sessão).
- `armazem-de-arquivos.ts` › `ArmazemEmMemoria`: dublê de teste, não produção; o que ele faz é provado pelos testes que o usam.
- `privacidade.module.ts` › `CicloDoArmazem.beforeApplicationShutdown`: o encerramento dos clientes S3 não tem observável de teste
  (a API de teste fecha com o falso, que não tem cliente); fica como as outras da família (`CicloDaExtracao`).
- `expurgar-escola.ts` › `apagarArquivosDoTitular` › **`|| linhasApagadas === 0`** (a segunda condição de parada do laço): com o
  código correto é inalcançável, porque `aApagar` e `apagarLinhas` têm o mesmo escopo e a linha lida é a que se apaga (a outra
  execução que apagou antes tira a linha da leitura seguinte). Ela só se observa junto da mutação de `aApagar › escola_id`
  (acima), em que impede o laço sem fim e faz o teste falhar por asserção, e não por prazo.

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Prender o SQL à declaração: no teste de conteúdo, as chaves de cada linha do JSON contidas em `LEITURAS_DO_ARQUIVO[t].colunas` | `TODO.md` (item "Testes do arquivo que prometem mais…", i): mexe no teste de conteúdo inteiro; o `arquitetura.test.ts` já confere a declaração e a sentinela por coluna pega o resto |
| test-engineer (1ª) | "B não lista A" com o mesmo professor logado em B (`sessaoDaMesmaConta`) | `TODO.md` (mesmo item, ii) |
| test-engineer (1ª) | Virada de ano letivo: registro de ano anterior aparece no arquivo | `TODO.md` (mesmo item, iii): pede fixture de dois anos letivos |
| test-engineer (1ª) | `POST pedidos/:id/arquivo` no pedido sobre a própria pessoa da coordenação | `TODO.md` (mesmo item, iv-bis): o caso pede montar usuário desativado com a mesma `conta_id`; a barreira é a do `#pedidoAlvo`, já provada nas outras rotas do pedido |
| test-engineer (1ª) | Títulos que prometem mais do que afirmam (`:749`, o [P] do expurgo) | `TODO.md` (mesmo item, iv); o de `armazem-s3.test.ts:42` entra no item 9(d) |
| test-engineer (1ª) | Linha de "Mutações" para o `for update` da subconsulta do `concluir` | Aplicada em "Depois de aplicar" |
| revisor-geral (1ª) | `HeadObject` dentro da transação | Já é o item 5 |
| revisor-geral (1ª) | Duas fábricas de cliente S3 (`criarClienteS3` no worker, `criarClienteDoArmazem` no núcleo) | `TODO.md` (item "Um cliente S3 só…"): mexe em `apps/worker`, fora do que esta tarefa precisa |
| revisor-geral (1ª) | Índice redundante `pedido_titular_da_escola_unico` | `TODO.md` (item "Índice redundante…"): contrair é migration futura, compatível com a anterior (regra 80, item 9) |
| revisor-geral (1ª) | Conferir a rodada aprovada do test-engineer em "Revisões" antes do commit | Sem ação: quem escreve a seção é o hook; o comando `revisores` confere |
| privacy-guardian (1ª) | Auditoria do professor com dados de aluno | Já é o item 1 |
| privacy-guardian (1ª) | Versão completa traz `consumo_ia.entrada/saida` e `mensagem_agente.conteudo` de turmas com vínculo encerrado | `TODO.md` (item "Duas perguntas de alcance…", i): é decisão de spec, não de código desta tarefa |
| privacy-guardian (1ª) | Exceções do PRD, seção 6, para o parecer jurídico | Já rastreada em `techspec.md` (tabela de exceções, linha 20) e em `CLAUDE.md`, "Decisões em aberto" (parecer do ECA Digital); sem ação |
| conformidade-reviewer (1ª) | Auditoria do professor com dados de aluno | Já é o item 1 |
| conformidade-reviewer (1ª) | `artefato.titulo` na versão da escola pode ser pedaço da conversa do professor | `TODO.md` (item "Duas perguntas de alcance…", ii): hoje coberto pela exceção "registro de uso (… artefatos)" do PRD, seção 6; tirá-lo é decisão de produto |
| conformidade-reviewer (1ª) | Teste da D64 no texto inteiro | Aplicada no item 4 |
| infra-guardian (1ª) | Corrida entre o expurgo e o job repetido (objeto órfão) | `TODO.md` (item "Corrida entre o expurgo…"): a correção pede `for update skip locked` ou comparação do `expira_em` lido, com teste de concorrência; não cabe em poucas linhas |
| infra-guardian (1ª) | Índices em `entrega.decidida_por`, `atividade_aplicada.aplicada_por`, `validacao_do_lote.confirmada_por` | `TODO.md` (item "Índices que faltam por turma"): crescem por turma, não por aluno; avaliar com volume |
| infra-guardian (1ª) | `apagarArquivosDoTitular` repete o objeto que falhou e soma `naoApagados` mais de uma vez | `TODO.md` (item "`apagarArquivosDoTitular` repete…") |
| infra-guardian (1ª) | Runbook: causa `statement_timeout` | Aplicada no item 10(c) |
| tenancy-guardian (1ª) | Caso direto da coordenação de B na rota nova | Aplicada no item 9(a) |
| tenancy-guardian (1ª) | Laço do expurgo só para em `sairam.length === 0` | Aplicada no item 8 |
| test-engineer (2ª) | Um caso direto por camada para a rota da escola (`doPedido` e `contaAtiva` com o id de um usuário de A no contexto de B): hoje o caso de B só fica vermelho com os três cortes juntos | Recusada nesta rodada: está declarado em "Mutações" (o `de` é provado sozinho no `GET pedidos/:id` de B) e é camada de defesa; entra na tarefa 15.0, que reabre `ArquivoDoTitularRepository` para a eliminação |
| tenancy-guardian (2ª) | Asserção no `arquitetura.test.ts`: nenhuma ação de autor professor ou aluno tem `entidade: 'usuario'` (o `entidade_id` entraria no arquivo com o id de outra pessoa) | Tarefa 14.0 ou 15.0, que tocam `acoes.ts` e o `arquitetura.test.ts` com `usuario.eliminado` e a eliminação agendada; também de conformidade-reviewer (2ª, rec. 1) |
| tenancy-guardian (2ª) | Teste de repository por camada, com `doPedido` e `contaAtiva` no contexto de B | Mesmo destino da linha do test-engineer acima |
| privacy-guardian (2ª) | Teste em que a gravação da auditoria falha e a resposta não traz `url` | Tarefa 17.0, que consome as rotas na tela e testa o erro 5xx; hoje a garantia vem da ordem do código, provada pelo teste da transação |
| privacy-guardian (2ª), infra-guardian (2ª) | `contaAtiva`/validade conferidas antes da auditoria: janela de milissegundos em que o titular reativa a conta ou o arquivo vence | Recusada, com o motivo: a janela é de milissegundos, a entrega é auditada com autor e finalidade, e a escola continua a controladora; fica em `achados/13_task.md` |
| privacy-guardian (2ª) | A corrida entre o expurgo e o job repetido deixa objeto órfão com dado de menor; deveria fechar antes do piloto | Já está em `TODO.md`, na seção "Antes da primeira escola real…", como item "(F3, 13.0) Corrida entre o expurgo do arquivo e o job repetido"; sem ação |
| infra-guardian (2ª) | O teste de transação não simula storage lento de verdade (atraso real e `pool.idleCount`) | Recusada: o `Proxy` sobre `banco.transaction` prova o que importa (nenhuma consulta ao armazém com transação aberta) sem depender de tempo |
| infra-guardian (2ª) | `enable_seqscan = off` enfraquece o "sem `Seq Scan`" do teste de plano | Recusada: quem prova é o nome do índice no plano, como o `test-engineer` já conferiu |
| conformidade-reviewer (2ª) | O teste de `antes`/`depois` cobre só duas ações (os convites não têm caso próprio) | Recusada: o `antes` e o `depois` estão em `fora`, fora do `select`, e isso cobre toda ação |
| revisor-geral (2ª) | `cenarios.md` ficou para trás em RF11 e RF12: três cenários novos (o ato do professor sem o dado do aluno e o arquivo do aluno sem o id da coordenação; os três índices da `0034`; o storage fora da transação) | Recusada nesta rodada, para não caducar a aprovação dos cinco revisores com uma mudança de documento; **o Orquestrador decide** se entra no commit de documentos do passo 4 do `/seguir` ou no fechamento da spec |
| revisor-geral (2ª) | O item antigo do `TODO.md` ("Acesso e portabilidade… fase 3"): marcar como feito ou dizer o que falta | Recusada: o item cita `ciclo-de-vida.service.ts` (eliminação), que é a 15.0; fecha lá |
| Arquiteto (diagnóstico da 2ª rodada) | `criarClienteS3` do worker (`medidor-de-storage.ts`) passa `requestTimeout` sem `throwOnRequestTimeout`: o prazo só avisa | `TODO.md` (item "O prazo de requisição do medidor de storage só avisa"): o arquivo não é desta tarefa |
| test-engineer (3ª), revisor-geral (3ª) | O prazo padrão do worker (10 s) só é afirmado pela constante `TIMEOUT_REQUISICAO_DO_ARMAZEM_MS`; afirmar `10_000` como literal em um ponto | Item `(F3, 13.0) Um cliente S3 só entre o núcleo e o worker` do `TODO.md`: quando as duas fábricas virarem uma, o par de testes de prazo passa a valer para os dois clientes e o literal entra junto. Não vale uma rodada só para ele |
| test-engineer (3ª), revisor-geral (3ª) | `prazosDe` lê `requestHandler.configProvider`, campo interno do SDK: dizer no JSDoc que é interno e que a prova de verdade é o `it` do storage lento | Mesmo item do `TODO.md`. Se o SDK mudar, o teste quebra por asserção e não passa calado, e o `it` com o servidor lento continua cobrindo o comportamento |
| test-engineer (3ª), privacy-guardian (3ª), infra-guardian (3ª) | O medidor de storage do worker (`apps/worker/src/storage/medidor-de-storage.ts`) passa `requestTimeout` sem `throwOnRequestTimeout`; o infra-guardian pede corrigir na primeira tarefa que tocar o worker de storage, sem esperar a fábrica única | Item `(F3, 13.0) O prazo de requisição do medidor de storage só avisa` do `TODO.md`, já escrito na 3ª rodada. Código de outra tarefa, fora do diff; serve a `consolidar-uso`, que é lote e não está no caminho de aula. O pedido de não esperar a fábrica única fica em `achados/13_task.md` |
| infra-guardian (3ª) | Com o prazo cortando de verdade, `apagarArquivosDoTitular` com o storage pendurado leva cerca de 30 s por objeto (205 arquivos, perto de 100 min numa noite); considerar parar o lote no primeiro `ArmazemIndisponivel` e deixar a noite seguinte reparar | Item `(F3, 13.0) apagarArquivosDoTitular repete o mesmo objeto que falhou…` do `TODO.md`, que já reabre o laço do expurgo; o limite do lote entra junto. Muda comportamento do job, e é lote noturno fora do horário letivo |
| tenancy-guardian (3ª), privacy-guardian (3ª), conformidade-reviewer (3ª) | As recomendações da 2ª rodada continuam como estavam (asserção `entidade: 'usuario'`, teste de repository por camada, teste da auditoria que falha, corrida expurgo × job repetido, `artefato.titulo`) | Sem acréscimo: já têm destino na tabela da `13_task-r2.md` e no `TODO.md` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-10 01:07:43 | 2026-10-10 01:11:35 | `test-engineer` | 1 | REPROVADO | a0d3abd5537469ab1 |
| 2026-10-10 01:11:57 | 2026-10-10 01:13:26 | `tenancy-guardian` | 1 | APROVADO | ac285457f6a59faf2 |
| 2026-10-10 01:12:19 | 2026-10-10 01:14:07 | `conformidade-reviewer` | 1 | APROVADO | a819ff2fa4e6e3af3 |
| 2026-10-10 01:11:49 | 2026-10-10 01:14:24 | `revisor-geral` | 1 | REPROVADO | adccc38980004cde3 |
| 2026-10-10 01:12:04 | 2026-10-10 01:14:49 | `privacy-guardian` | 1 | APROVADO | a4a215e8f7ddaab3a |
| 2026-10-10 01:12:12 | 2026-10-10 01:15:15 | `infra-guardian` | 1 | REPROVADO | a45fa339c12c4b809 |
| 2026-10-10 01:41:51 | 2026-10-10 01:46:29 | `test-engineer` | 2 | REPROVADO | af1b5abaed79d2548 |
| 2026-10-10 01:47:01 | 2026-10-10 01:47:33 | `tenancy-guardian` | 2 | APROVADO | a8c66c8379bc36c95 |
| 2026-10-10 01:47:14 | 2026-10-10 01:48:03 | `privacy-guardian` | 2 | APROVADO | a3c80966552091c55 |
| 2026-10-10 01:47:27 | 2026-10-10 01:48:09 | `infra-guardian` | 2 | APROVADO | ac30426a147e27e88 |
| 2026-10-10 01:47:39 | 2026-10-10 01:48:18 | `conformidade-reviewer` | 2 | APROVADO | ac983de0f85fcffd4 |
| 2026-10-10 01:46:50 | 2026-10-10 01:48:18 | `revisor-geral` | 2 | APROVADO | a7c6631888e5860f9 |
| 2026-10-10 02:04:15 | 2026-10-10 03:00:26 | `test-engineer` | 3 | APROVADO | a8c66c84825f8c638 |
| 2026-10-10 03:00:57 | 2026-10-10 03:01:25 | `tenancy-guardian` | 3 | APROVADO | ad48dc9a58914c9be |
| 2026-10-10 03:01:08 | 2026-10-10 03:01:30 | `conformidade-reviewer` | 3 | APROVADO | a0b0f86e2e468c867 |
| 2026-10-10 03:00:50 | 2026-10-10 03:01:31 | `revisor-geral` | 3 | APROVADO | a1fee6faa8e821f71 |
| 2026-10-10 03:01:03 | 2026-10-10 03:01:34 | `privacy-guardian` | 3 | APROVADO | a91881eddd0619adc |
| 2026-10-10 03:01:16 | 2026-10-10 03:01:57 | `infra-guardian` | 3 | APROVADO | a09a4928ef8053089 |
