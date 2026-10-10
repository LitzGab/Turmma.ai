# Achados das revisões — `tasks/prd-lgpd-e-titular/13_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-10 01:11:35 · `tasks/prd-lgpd-e-titular/13_task.md`

```
VEREDITO: REPROVADO

Cenários exigidos: conteúdo (uma sentinela por tabela, nada de outro titular nem da escola B, e-mail do professor nas duas versões) · colunas proibidas nas duas versões e aluno sem o conteúdo do artefato · versão da escola (Tutor sim, conversa do professor não; só sem conta ativa nesta escola) · correção pendente ou rejeitada só como estado · quem baixa (coordenação não baixa a completa, o colega não baixa, B não lista A, responsável legal na conta do aluno) · D64 (datas reais só na completa) · validade (7 dias fica, 8 sai, apagado_em, URL de 300 s) · cabeçalhos (no-store, attachment, nome, nenhum DTO com chave_objeto) · falha do armazém e retorno · [P] dois montar-arquivo do mesmo pedido · [F] alerta acima de 2 h · plano do rastro e do texto do modelo · critério 2 da Tech Spec §5 (id ou dado de outra pessoa não entra; auditoria em que o titular é alvo não entra) · expurgo do arquivo (janela letiva, falha ao apagar, lotes, [P]).

Cobertos: quase todos, e bem. Sentinelas por tabela com outro aluno, colega, escola B e a mesma conta em B. As 8 colunas proibidas nas duas versões. Versão da escola com Tutor e sem a conversa do professor, inclusive quando ele volta a ter conta e quando está ativo em B e desativado em A. Lote aprovado, pendente e rejeitado, conferidos no SQL e no JSON. Colega, coordenação e B respondendo igual ao id inexistente. Responsável legal. Validade com relógio injetado, nas bordas 13:59:59 e 14:00:01. apagado_em. Auditoria com finalidade de lista fechada. URL fora do log. Armazém fora, e objeto perdido sem assinar nada. O `antes` do concluir com a trava de verdade (esperarNaTrava). [P] montar-arquivo com Promise.all no banco real. Job repetido, sem ressuscitar apagado_em. Objeto gravado antes da linha. Expurgo: 7 e 8 dias, B intacto, falha ao apagar, janela letiva, 205 em lotes, [P]. Medição e alerta no Grafana. Plano com índices. S3 de verdade (assinatura, chave trocada, vencida, bucket privado). Matriz de permissão. Teste de arquitetura que dá destino a toda coluna. Nenhum .skip. Nenhum provedor de IA chamado.

Bloqueantes:

1. Critério 2 ("o id ou o dado de outra pessoa não entra", Tech Spec §5 da 13.0; divergências das linhas 92 e 93 da tarefa) não tem teste que falhe se a regra sair.
   - `apps/api/test/arquivo-do-titular.int.test.ts:355` e `:362` semeiam `textos['correcao.do_aluno']` (diagnóstico de outro aluno) e `textos['validacao_do_lote.resumo']`, e nenhum teste confere que eles não estão no arquivo do professor. O teste do professor (`:451-485`) não tem essa asserção. Também não confere o id do aluno "AlunoDoDestaque", que está em `validacao_do_lote.apresentado` e em `aberto`.
   - Por isso nada fica vermelho se alguém pôr `por_habilidade` na 2ª consulta da `correcao` (`leitura-do-titular.ts:289`), `lista_nome_id` ou `turma_id` no ramo `decidida_por` da `reivindicacao` (`:152`), ou passar `apresentado` e `aberto` de `fora` para `colunas` (`:324-330`). O teste de arquitetura confere só a declaração, não o SQL.
   - No arquivo do aluno (`:407-449`), nada confere que o id da coordenação (`criado_por`, `decidida_por`, `registrado_por`, `concluido_por`) está ausente.
   - Nenhum teste chama a prévia nem o `GET pedidos/:id` antes de montar o arquivo. Assim, a regra "a auditoria `titular.previa_lida` / `pedido.lido` não entra" fica sem prova.
   - Correção exigida:
     - Fazer `semearProfessor` devolver o id do aluno do destaque. No teste do professor, afirmar que o texto não contém `correcao.do_aluno`, `validacao_do_lote.resumo`, nem o id e o nome desse aluno.
     - No teste do aluno, chamar a prévia e o detalhe do pedido antes de `montar` e afirmar `not.toContain(cenario.coordenacao.usuarioId)` nas duas versões.
     - Acrescentar as linhas correspondentes em "Mutações".

2. O cenário "aluno sem conteúdo do artefato" passa vazio. Em `apps/api/test/arquivo-do-titular.int.test.ts:533`, a asserção `not.toContain('gabarito')` roda contra um aluno cujas atividades usam artefato com `'{"tipo":"atividade_objetiva","questoes":[]}'` (`:156`), sem a palavra. O artefato com a sentinela `gabarito-do-artefato` (`:333-338`) não é aplicado ao aluno. Se uma leitura passar a trazer o `conteudo` do artefato da atividade do aluno, o teste continua verde.
   - Correção exigida: aplicar à turma o artefato com a sentinela do gabarito, dar ao aluno tentativa e resposta nele, e afirmar que `textos['artefato.conteudo']` não está em nenhuma das duas versões do arquivo do aluno.

3. O `usoReal` da D64 não está provado como regra: "primeira e última chamada **com envio externo** por empresa".
   - O teste `:776-797` tem uma única chamada, externa. Trocar `min` por `max` ou tirar `c.envio_externo` em `packages/nucleo/src/titular/compartilhamento.repository.ts:124-126` não deixa nada vermelho.
   - A seção "Mutações" não tem nenhuma linha para `usoRealDoProfessor`, que é cláusula nova do diff.
   - Correção exigida:
     - Semear para o mesmo provedor uma segunda chamada externa em outra data, e afirmar `primeiroEm` e `ultimoEm` distintos e corretos.
     - Semear uma chamada com `envio_externo = false` (modelo local) e afirmar que ela não aparece em `usoReal`.
     - Registrar as mutações de `envio_externo`, `min/max` e `group by`.

Recomendações:
- Prender o SQL à declaração: no teste de conteúdo, para cada tabela, conferir que as chaves de cada linha do JSON estão contidas em `LEITURAS_DO_ARQUIVO[t].colunas ∪ derivadas`. Hoje uma coluna posta no `select` sem entrar em `colunas` só é pega se tiver sentinela.
- `pedido-titular.int.test.ts:977` ([P] mesma chave ao mesmo tempo): afirmar também que existe um único job `titular.montar-arquivo`. Hoje o "não enfileira de novo" só é provado em sequência.
- Na seção "Mutações": dar nome ao teste da linha `aApagar › escola_id` (hoje "travou"), e acrescentar a linha do `for update` da subconsulta do `concluir` (`pedidos.repository.ts`). O teste do `antes` já cairia sem ele.
- "B não lista A" (`:678-696`) usa outra pessoa em B, e o `titular_id` já a isola. Usar `sessaoDaMesmaConta` para modelar o caso real: o mesmo professor logado em B.
- Testar o `POST pedidos/:id/arquivo` no pedido sobre a própria pessoa da coordenação (mesma `conta_id`, usuário professor desativado). Ele cai no `#pedidoAlvo`, mas nada prova isso nesta rota.
- Virada de ano letivo: um registro de ano letivo anterior deve aparecer no arquivo. Hoje um filtro por `ano_letivo_id` nas leituras passaria.
- Títulos que prometem mais do que afirmam:
  - `:749` diz "com ou sem segundo fator" e usa um token só.
  - `armazem-s3.test.ts:42` diz "60 s e 300 s" e confere só 60.
  - O [P] do expurgo diz "cada arquivo uma vez" e não conta as chamadas de `apagar`.
- `privacidade.module.ts`: o fallback `?? new ArmazemEmMemoria()` é inalcançável em produção. Remover, para não sugerir um armazém falso possível fora do teste.
```

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquivo-do-titular.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/compartilhamento.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/13_task.md

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-10 01:13:26 · `tasks/prd-lgpd-e-titular/13_task.md`

```
VEREDITO: APROVADO
Tabelas verificadas: arquivo_titular (escola_id NOT NULL com FK; id uuid uuidv7; FK composta (escola_id, pedido_id) → pedido_titular(escola_id, id); check que prende chave_objeto a titular/<escola>/<pedido>/<versao>.json; único (escola_id, pedido_id, versao); índice (escola_id, expira_em)). Não tem anoLetivoId, e não precisa: o pedido do titular não pertence a um ano letivo. Também: pedido_titular_da_escola_unico, auditoria_escola_autor_idx e consumo_ia_execucao_idx. Os três índices começam por escola_id.
Queries verificadas: ArquivoDoTitularRepository (pedidoParaMontar, contaAtiva, gravar, marcarPronto, doPedido, aApagar, apagarLinhas, pedidosDoUsuario, arquivoCompletoDoUsuario, registradoEmDoEmPreparacaoMaisAntigo). Todas tiram a escola de exigirEscolaDoContexto(). Também: as 24 leituras de LEITURAS_DO_ARQUIVO (escola vem do contexto; titular vem do pedido já filtrado pela escola); instrucaoDoRastroDoAluno, usoRealDoProfessor, instrucaoDoTextoDoModelo, PedidosRepository.concluir, contagemPorCategoria. Rotas: MeusDadosController (o usuário vem da sessão, não há escolaId na entrada); POST pedidos/:id/arquivo (o corpo é strictObject só com a finalidade, de lista fechada; passa pelo #pedidoAlvo com escopo). Job montar-arquivo: a escola vem do contexto do job, e os dados do job são um strictObject só com { pedidoId }. Na MedicaoDoArquivo, a série leva só escola_id e um número. A rede é 'nunca' nas três células novas. Nenhum @SemEscopo.
Teste de isolamento: presente e efetivo
Bloqueantes: nenhum
Recomendações:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquivo-do-titular.int.test.ts:655 (bloco "quem baixa"): falta o caso direto da rota nova da coordenação. A coordenação de B chama POST /v1/privacidade/pedidos/<pedido de A>/arquivo, com a versão coordenacao de A válida. A resposta esperada é igual à do id inexistente, sem URL assinada e sem auditoria `titular.arquivo_baixado`. Hoje a rota está protegida pelo #pedidoAlvo → PedidosRepository.de, que tem escopo e é coberto pelo isolamento de pedido-titular.int.test.ts. O escola_id de doPedido é a segunda camada e nenhum teste o prende.
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/src/processadores/expurgar-escola.ts:159-161: o laço só para quando `sairam.length === 0`. Se apagarLinhas devolver 0 com `sairam` não vazio, o laço não termina. Foi o que a mutação do escola_id de aApagar mostrou: o teste travou em vez de falhar numa asserção. Sugestão: parar também quando nenhuma linha foi apagada no lote. Assim a mutação passa a falhar na asserção "o de B não é tocado".
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.ts:365: o `antes`/`depois` da auditoria em que o titular é o autor pode levar ids de outras pessoas da mesma escola, por exemplo o `titularId` em `pedido.registrado` feito por um coordenador. Não é vazamento entre escolas. Vai para o privacy-guardian conferir contra o critério 2 do próprio arquivo.
```

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-10 01:14:07 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. O diff não grava, não lê e não declara `Nota` nem `lancadaPor`. O job novo `titular.montar-arquivo` só lê dados e grava `arquivo_titular` e o estado do pedido. O expurgo só apaga os objetos e as linhas de `arquivo_titular`. Todos com autor humano? Não se aplica.

Decisão autônoma sobre aluno: ausente. O job monta um JSON de acesso e portabilidade. Não decide, não sugere e não encaminha nada sobre a trajetória do aluno.

Aprovação registrada: ok.
- **Correção não aprovada:** a correção de um lote pendente ou rejeitado sai só como estado, nas duas versões. O `case when e.estado = 'aprovada'` está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.ts:278-287`, e as chaves são retiradas do JSON em `:465-469`. Acertos e diagnóstico nem chegam ao `select`. O teste `correção de lote … nas duas versões` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquivo-do-titular.int.test.ts:632` usa sentinelas para provar isso.
- **Consumo de IA:** a saída do Corretor não chega ao aluno por `consumo_ia`. O `aluno_id` só existe nas funções do Tutor, e nelas `entrada` e `saida` são nulas por check (`consumo_ia_sem_conversa_de_pessoa`).
- **Downloads:** os dois caminhos de download gravam `titular.arquivo_baixado` com versão e finalidade de lista fechada, na mesma transação que assina a URL.

Supervisão do tutor: ok. Nada muda no tutor. Pela exceção declarada no PRD, seção 6, a conversa do Tutor entra na versão da escola só quando o titular está sem conta ativa, e a entrega é auditada.

Autonomia declarada e visível: sim. A tarefa não toca agente nem nível de autonomia.

Itens 7 e 9 (supervisão sem vigilância, medir o professor sem vigiar):
- A versão da escola não traz `thread_agente`, `mensagem_agente`, a `entrada` das execuções, a `entrada` e a `saida` do consumo nem a `justificativa` das entregas. O teste em `arquivo-do-titular.int.test.ts:550` prova cada uma com sentinela, nas duas versões.
- `usoReal`, as datas reais de uso por empresa, vai só na versão completa do professor.
- O registro de uso do professor na versão da escola segue a exceção à D64 que o PRD declara na seção 6. É nominal, só existe para quem está sem conta ativa e cada download é auditado.
- `meus_dados` é `nunca` para a coordenação e a rede, e `privacidade_pedidos.arquivo` é só da coordenação.
- O arquivo não traz inferência emocional, nem janela sobre comportamento, nem ranking.

Item 8 (D46/D55): nada sobre discursiva ou redação, e nenhum campo de nota proposta.

Bloqueantes: nenhum.

Recomendações:
1. **Auditoria do professor com dados de alunos.** A tabela `auditoria` entra no arquivo pela autoria (`leitura-do-titular.ts:360-366`) e leva `antes` e `depois` inteiros. Algumas ações do professor gravam dados de outra pessoa ali: `correcao.destaque_aberto` grava `alunoId` e `motivos` (`apps/api/src/atividade/correcao.service.ts:137`), e o registro do lote em `correcao.service.ts:174` pode gravar mais. Pela leitura, o critério 2 da Tech Spec ("o id de outra pessoa não entra") não é cumprido para essa tabela. O problema é de privacidade e não da regra 70 (o `test-engineer` já reprovou pelo critério 2 na 1ª rodada). Deixo registrado para o `privacy-guardian` conferir.
2. **Título do artefato na versão da escola.** `artefato.titulo` entra na versão da escola do professor sem conta ativa (`leitura-do-titular.ts:292-303`). Se o título vier do tema que o professor escreveu ao Assistente, é um pedaço da conversa dele chegando à coordenação, e a regra 70, item 8 diz que essa conversa nunca chega. Vale confirmar na Tech Spec que o título está coberto pela exceção do "registro de uso", ou deixá-lo só na versão completa.
3. **Teste da D64 no texto inteiro.** O teste da D64 (`arquivo-do-titular.int.test.ts:776`) compara só o bloco `compartilhamento`. Ele poderia também conferir que nenhuma data de `usoReal` aparece em lugar nenhum do texto da versão da escola.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-10 01:14:24 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência na leitura da `auditoria` do arquivo, que contraria o critério 2 da seção 5 ("Tarefa 13.0, como ficou no código")
Portão local: carimbo válido

Bloqueantes:

1. **A auditoria leva para o arquivo o id e o motivo de destaque de outro aluno.**
   - Onde: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.ts:360-367`
   - O que está errado: a leitura da `auditoria` devolve `antes` e `depois` inteiros de toda linha em que o titular é o autor. Algumas ações do professor gravam ali dado de outra pessoa:
     - `correcao.destaque_aberto` grava `{ atividadeAplicadaId, alunoId, motivos }` (`packages/nucleo/src/auditoria/acoes.ts:486`);
     - `reivindicacao.decidida` grava `alunoId` e `turmaId` (`acoes.ts:409`);
     - as ações de convite gravam `usuarioId` (`acoes.ts:154`, `177`, `188`).
   - Por que contraria a spec: o critério 2 da Tech Spec §5 e o próprio cabeçalho da leitura dizem que, no ato do titular sobre outra pessoa, a linha entra "só com o ato, nunca o dado da outra pessoa". A tarefa aplica isso nas outras tabelas: a leitura de `correcao` por `destaque_aberto_por` traz só `id` e `entrega_id`, e `validacao_do_lote.apresentado` e `.aberto` ficam fora por trazerem "o id e o motivo de outros alunos". A auditoria devolve exatamente o que essas exclusões tiram, nas versões `completa` e `coordenacao`.
   - Por que o teste não pega: a sentinela de `auditoria` em `apps/api/test/arquivo-do-titular.int.test.ts:387` é gravada sem `antes` e sem `depois`.
   - Correção exigida:
     - Tirar `antes` e `depois` da leitura da auditoria, ou trocar por uma lista permitida por ação que descarte os campos de outra pessoa (`alunoId`, `usuarioId`, `motivos`, `ids`).
     - Registrar a escolha no critério da Tech Spec §5 e em `docs/lgpd.md`.
     - Acrescentar ao teste de conteúdo uma sentinela com `correcao.destaque_aberto` e `reivindicacao.decidida` com o `depois` preenchido, provando que o id e os motivos do outro aluno não aparecem em nenhuma das duas versões.

2. **O texto novo do `TODO.md` partiu um item que já existia.**
   - Onde: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/TODO.md:791-815`
   - O que está errado: os cinco itens novos da 13.0 entraram no meio de "Acesso e portabilidade do titular cobrindo as tabelas da fase 3". A primeira linha dele ficou em 791 e a continuação (`ciclo-de-vida.service.ts`) precisa alcançar…) ficou solta em 812-815, presa ao último item novo.
   - Correção exigida: pôr os cinco itens depois da linha 815, ou antes da 791, com o item antigo inteiro. Se a 13.0 cumpriu o que aquele item pedia, marcá-lo como feito e dizer onde.

Recomendações:
- `apps/api/src/privacidade/privacidade.module.ts`: o `?? new ArmazemEmMemoria()` nunca roda, porque sem armazém de teste o S3 sempre existe. É código morto e põe o dublê de teste no caminho de produção. Pode sair.
- `apps/api/src/privacidade/configuracao-do-armazem.ts:40`: o `export { ConfiguracaoInvalida }` não é usado por ninguém. Pode sair.
- `privacidade.service.ts`, `#assinar`: o `HeadObject` roda dentro da transação aberta da requisição, com `maxAttempts: 3` e 10 s por requisição. Com o storage lento, a conexão do pool fica presa por até cerca de 30 s. Opções: fazer as chamadas ao storage fora da transação e gravar a auditoria numa transação curta depois, ou usar um cliente com prazos menores na API.
- `pedido_titular_da_escola_unico (escola_id, id)` repete o índice `pedido_titular_escola_id_idx`. Dá para contrair o índice redundante numa migration futura.
- Há duas fábricas de cliente S3: `criarClienteS3` no worker e `criarClienteDoArmazem` no núcleo. O worker-lote passa a abrir dois clientes. Vale juntar numa só.
- A tabela de Revisões de `13_task.md` mostra só a rodada 1 do `test-engineer`, REPROVADO. Conferir se a rodada aprovada dele já está registrada antes do commit.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-10 01:14:49 · `tasks/prd-lgpd-e-titular/13_task.md`

```
VEREDITO: APROVADO
Campos pessoais tocados: arquivo_titular (tabela nova). A linha guarda o pedido, a versão, a chave do objeto, o tamanho e as datas, e nenhum dado do titular. O conteúdo do JSON é tudo o que a escola guarda do titular, lido por lista permitida, coluna a coluna, em packages/nucleo/src/titular/leitura-do-titular.ts:84-385. A tarefa também lê e devolve: o e-mail da conta do professor, a matrícula, o IP do registro de acesso, a conversa do Tutor, a conversa com o Assistente (só na versão completa) e consumo_ia.entrada/saida (só na completa).
Fora da tabela de dados do docs/lgpd.md: nenhum. arquivo_titular entrou na tabela com finalidade, base e retenção de 7 dias ou apagado_em (docs/lgpd.md:102). Entrou também em CLASSIFICACAO_DAS_TABELAS e em PRAZOS_FIXOS (arquivo_do_titular). A chave_objeto entrou em COLUNAS_FORA_DO_ARQUIVO.
Autorização por objeto: ok.
  - POST /v1/meus-dados/:id/baixar filtra por titular_id = usuário da sessão (arquivo-do-titular.repository.ts:191-213).
  - POST /v1/privacidade/pedidos/:id/arquivo passa por #pedidoAlvo, que confere a escola e recusa o pedido sobre a própria pessoa, e confere de novo contaAtiva === false na hora de baixar (privacidade.service.ts:296-310).
  - O colega, a coordenação, a escola B, o pedido vencido, o apagado e o inexistente respondem todos NAO_ENCONTRADO, e os testes provam isso (arquivo-do-titular.int.test.ts:584, 596, 656, 698, 826).
  - Na matriz, a coordenação e a rede têm "nunca" em meus_dados, e o professor e o aluno têm "nunca" em privacidade_pedidos.arquivo.
Logs: limpos.
  - montar-arquivo.ts:52, 57 e 77 registram só o evento e contagens.
  - expurgar-escola.ts registra só o resumirErro, sem a chave do objeto.
  - A série da MedicaoDoArquivo leva só a escola e o número de horas.
  - O ArmazemS3 troca todo erro do SDK por ArmazemIndisponivel, sem o texto do SDK.
  - Um teste prova que a URL e a chave não chegam ao log da API (int.test:899).
Auditoria: presente. As duas rotas de download gravam titular.arquivo_baixado na mesma transação: entidade = pedido, depois = { versao }, finalidade de lista fechada (entregar_ao_titular | entregar_ao_responsavel_legal | acesso_do_proprio_titular). Nem a URL nem a chave vão para a auditoria. Se a auditoria falhar, a URL não sai.
Envio externo: nenhum novo. O JSON vai para o storage privado nosso (bucket com credencial; a leitura sem assinatura dá 403, provado em armazem-s3.int.test.ts:66). O job leva só { pedidoId }, com z.strictObject. A URL assinada vale 300 s e leva response-cache-control no-store e content-disposition attachment. As respostas da API saem com no-store. O "para onde foi enviado" sai no arquivo, em compartilhamento.empresas.
Seed/fixture: sintético. Os testes usam sentinelas e o domínio @escola.invalid.
Bloqueantes: nenhum
Recomendações:
  1. packages/nucleo/src/titular/leitura-do-titular.ts:360-366: a auditoria em que o professor é autor entra no arquivo com antes/depois inteiros. correcao.destaque_aberto (packages/nucleo/src/auditoria/acoes.ts:483-488) leva o alunoId e os motivos do destaque de outro aluno, inclusive na versão da coordenação, que é entregue ao ex-professor. São só uuid e código, mas o próprio critério 2 do arquivo diz "nunca o dado da outra pessoa". Correção: projetar o depois por ação, ou registrar a exceção em docs/lgpd.md, na seção "O arquivo do titular".
  2. leitura-do-titular.ts:225-247 e 205-214: a versão completa do professor com conta ativa traz consumo_ia.entrada/saida e mensagem_agente.conteudo também de turmas cujo vínculo já terminou (regra 20, item 18). É texto que ele mesmo escreveu, mas o prompt do Analista pode levar ids e desempenho de alunos que ele já não alcança. Vale confirmar na spec.
  3. apps/api/src/privacidade/privacidade.module.ts:36: o fallback `?? new ArmazemEmMemoria()` nunca é alcançado, porque o s3 sempre existe quando não há armazém de teste. Se um dia for alcançado, o arquivo de um menor fica guardado em memória sem ninguém notar. Correção: remover o fallback e falhar na montagem.
  4. A frase "a chave do objeto nunca sai pela API" (docs/lgpd.md:102, acoes.ts e o comentário em arquivo-do-titular.repository.ts:21) não é literal: o caminho da URL assinada leva titular/<escola>/<pedido>/<versao>.json. Não é dado pessoal. Basta corrigir o texto para "o campo chave_objeto nunca sai".
  5. Ficam registradas, sem bloquear: as exceções declaradas no PRD, seção 6 (linhas 78-81). A versão da coordenação traz a conversa do Tutor, inclusive a mensagem do aluno anterior à mensagem fixa de assunto delicado (D36), e traz as datas reais de uso do professor em execucao_agente, consumo_ia e auditoria. Estão auditadas com finalidade e rastreadas em techspec.md:724. Vale levá-las ao parecer jurídico junto com a base legal da conversa do Tutor.
```

Para responder à pergunta de fechamento: esta tarefa é a resposta dela. O arquivo junta, para um aluno numa escola, tudo o que a escola guarda dele, tabela a tabela, e a foto de por quais empresas o dado passou. A versão completa só o próprio titular baixa. A versão da escola só existe para quem não tem conta ativa e é auditada com finalidade.

Fora da minha regra: nesta mesma rodada, o `test-engineer` reprovou a tarefa (registrado em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/13_task.md`, seção Revisões). O commit continua travado até essa reprovação ser resolvida.

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-10 01:15:15 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: fila | migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: faltando
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes:

1. **A chamada ao storage acontece com a transação do banco aberta.**
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts:318` e `:362`. Nas duas rotas, `#assinar` (linha 388) roda dentro de `this.banco.transaction`, e `armazem.existe` faz um `HeadObject` de rede com essa transação aberta.
   - **O que está errado:** o cliente S3 tem `maxAttempts: 3` e `requestTimeout: 10_000` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.ts:30-31`). A API não tem prazo global de requisição. Com o storage lento, cada download segura uma conexão do pool da API por até cerca de 30 s. O pool tem 10 conexões (`BANCO_POOL_MAXIMO=10`) e o limite é de 120 req/min por usuário. Dez cliques em "baixar" bastam para esgotar o pool, e às 10h isso derruba login, Tutor e o salvamento de resposta de prova em todas as escolas (regra 80, itens 3 e 6). O comentário do compose diz que "o resto da API segue", e é justamente o que não acontece.
   - **Correção exigida:**
     - Ler a linha do arquivo e conferir dono, validade e conta ativa numa leitura curta.
     - Fazer `existe` e `urlDeDownload` fora de qualquer transação.
     - Gravar a auditoria `titular.arquivo_baixado` numa transação curta, antes de devolver a URL. Se a gravação falhar, a URL não sai.
     - Na API, usar um cliente do armazém com prazo curto (`maxAttempts: 1`, alguns segundos), separado do cliente do worker.
     - Acrescentar um teste com um armazém que demora mais que o prazo, provando que a conexão do banco não fica presa: um download pendurado e uma rota do banco respondendo enquanto isso.

2. **Leituras novas do job, em tabelas que crescem com aluno, sem índice que sirva o filtro.**
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.ts`:
     - linha 262: `resposta_atividade` filtrada por `aluno_id`;
     - linha 177: `registro_acesso` filtrado por `usuario_id`;
     - linha 289: `correcao` filtrada por `destaque_aberto_por`.
   - **O que está errado:**
     - Os índices existentes começam pela escola, mas não servem o filtro. `resposta_atividade` tem só o único `(escola_id, ano_letivo_id, atividade_aplicada_id, aluno_id, questao)`. `registro_acesso` tem `(escola_id, em)`. Para `destaque_aberto_por` não há índice nenhum.
     - Cada leitura percorre a tabela da escola inteira. `resposta_atividade` é a "Resposta" que a regra 80, item 8, cita, com centenas de milhares de linhas por escola por ano.
     - Com `statement_timeout` de 2 s, numa escola grande no fim do ano, o job falha em toda tentativa e o pedido fica `em_preparacao` até esgotar as tentativas. A escola fica sem o arquivo dentro do prazo do art. 19 da LGPD.
     - A Tech Spec usou esse mesmo argumento para criar `auditoria_escola_autor_idx`, e ele vale também para estas três tabelas.
   - **Correção exigida:**
     - Na `0033` (ou numa migration nova da tarefa), criar `resposta_atividade (escola_id, aluno_id)`, `registro_acesso (escola_id, usuario_id, em)` e `correcao (escola_id, destaque_aberto_por) where destaque_aberto_por is not null`, todos sem `concurrently`, como a seção 7c aceita.
     - Pôr os índices no schema e no item do `TODO.md` que pede `concurrently` antes do staging.
     - Estender o teste de plano de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquivo-do-titular.int.test.ts` (o da auditoria, perto da linha 1050) a essas três leituras, com volume e sem `Seq Scan`.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/TODO.md:791`: os cinco itens novos da 13.0 entraram no meio do item "Acesso e portabilidade do titular cobrindo as tabelas da fase 3", e o texto dele ficou partido. É preciso mover os itens novos para depois do fim desse item.
- Corrida rara entre o expurgo e o job repetido. A sequência é esta: o expurgo apaga o objeto, o job regrava o objeto e faz o `on conflict do update` na mesma linha, e o expurgo apaga a linha. O objeto fica órfão no storage, com dado do titular. Duas saídas possíveis:
  - o `apagarLinhas` apagar só se `expira_em`/`apagado_em` ainda forem os que foram lidos;
  - o expurgo travar a linha (`for update skip locked`) antes de apagar o objeto.
- `entrega.decidida_por`, `atividade_aplicada.aplicada_por` e `validacao_do_lote.confirmada_por` também não têm índice. Crescem por turma, não por aluno; vale avaliar junto com o item 2.
- No runbook do alerta de 2 h, incluir como causa provável o `statement_timeout` na leitura do arquivo (log `job.tentativa_falhou` com o código da consulta).
- `apagarArquivosDoTitular` volta a tentar, em cada lote, o mesmo objeto que falhou, e soma `naoApagados` mais de uma vez para ele. Dá para guardar os ids que falharam e tirá-los da próxima leitura.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-10 01:46:29 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: REPROVADO

Cenários exigidos (2ª rodada: confiro as três correções da 1ª e audito o diff `e6f943d..6939a3d`):
- Critério 2: o ato do professor sobre outro aluno entra no arquivo sem o diagnóstico, sem o resumo do lote, sem o id, o nome e a linha da lista desse aluno, e sem o `antes`/`depois` da auditoria. O arquivo do aluno não leva o id da coordenação, nem a `titular.previa_lida`, nem o `pedido.lido`, nas duas versões.
- O aluno não recebe o conteúdo do artefato aplicado (o gabarito), nas duas versões.
- O `usoReal` da D64: `primeiroEm` e `ultimoEm` distintos, só chamadas com `envio_externo`, agrupadas por provedor.
- Código novo da rodada: a consulta ao storage e a assinatura da URL ficam fora de transação; o cliente S3 da API tem 1 tentativa e prazo de 5 s; os três índices da `0034` estão no plano; o reenvio simultâneo grava um job só ([P]); a coordenação de B não alcança o arquivo de A pela rota da escola; o `aApagar` respeita a escola.

Cobertos: rodei eu mesmo cada mutação, trocando o trecho, rodando só o teste da coluna e restaurando. Todas as restaurações foram conferidas e a linha de base ficou verde (37/37 no arquivo de integração, 161 nos de unidade). Todas as mutações abaixo ficaram vermelhas:
- **Correção 1 (feita).** Ficaram vermelhos: `antes`/`depois` de volta na auditoria, a 2ª consulta da `correcao` com `aluno_id` ou `por_habilidade`, a `validacao_do_lote` com `apresentado` e a 2ª consulta da `reivindicacao` com `lista_nome_id`. Dois jeitos de ler a auditoria pela entidade também ficaram vermelhos: um traz a `titular.previa_lida`, o outro o `pedido.lido`.
- **Correção 2 (feita).** A `tentativa_atividade` com o conteúdo do artefato numa subconsulta fica vermelha na versão `completa`.
- **Correção 3 (feita).** Ficaram vermelhos: sem `c.envio_externo` (aparece o grupo `provedor: null`), `min→max`, `max→min` e `group by c.provedor, c.em`.
- **Transação (`arquivoDaEscola` e `baixarMeuArquivo`).** Com `#assinar` de volta dentro de `banco.transaction`, cada rota fica vermelha: aparecem `[false,false,true,true]` e `[true,true,false,false]`.
- **Tentativas.** `tentativas ?? 3 → 3` fica vermelho, e `TENTATIVAS_DO_ARMAZEM_NA_API → 3` também (`config.test.ts`).
- **[P] job uma vez.** Enfileirar também no reenvio dá 2 jobs, contra 1 esperado. As duas chamadas vão em paralelo de verdade (`Promise.all`).
- **Isolamento da rota da escola.** Vermelho só com os três cortes juntos; com `de` sozinho, ou com `de` e `doPedido`, fica verde. É o que o documento declara: são camadas de defesa, e o `de` já é provado sozinho no `GET pedidos/:id` de B.
- **`aApagar` sem `escola_id`.** Agora fica vermelho por asserção, e não por travar.
- **Índices da `0034`.** O teste afirma o nome do índice no plano, então ele não passa sem o índice. Passou na linha de base com os três.

Bloqueantes:
1. O prazo de 5 s da API não está provado. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.test.ts:51-55`. O título diz "uma tentativa só e prazo próprio", mas o teste só afirma `maxAttempts`. A cláusula nova de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.ts:35`, `requestTimeout: config.timeoutRequisicaoMs ?? TIMEOUT_REQUISICAO_DO_ARMAZEM_MS`, sobrevive trocada por `requestTimeout: TIMEOUT_REQUISICAO_DO_ARMAZEM_MS`: rodei e o teste ficou verde. O `config.test.ts` prova o valor 5000 na configuração, não que ele chega ao cliente. Isso deixa sem prova a mitigação da regra 80, item 4, que a correção do `infra-guardian` introduziu.
   - Correção exigida: afirmar o prazo resolvido no cliente da API e o padrão no do worker. Conferi que a chamada abaixo devolve 5000:
     ```ts
     (await (daApi.config.requestHandler as NodeHttpHandler).configProvider).requestTimeout
     ```
   - Registrar em "Mutações" a linha `armazem-s3.ts › criarClienteDoArmazem › timeoutRequisicaoMs ?? padrão`.

Recomendações:
- **"Mutações" sem linha para a guarda nova do laço.** Falta registrar `expurgar-escola.ts:162` (`|| linhasApagadas === 0`) como equivalente com o motivo: com o código correto é inalcançável, e ela só se observa junto da mutação do `aApagar`, em que evita o laço infinito.
- **Isolamento em camadas.** O caso de B só fica vermelho com os três cortes juntos. Está declarado e é aceitável. Se quiser uma prova por camada, o `contaAtiva` pode ganhar um caso direto com o id de um usuário de A no contexto de B.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-10 01:47:33 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** a migration `0034_indices_da_leitura_do_arquivo` só cria três índices e não traz tabela nova. Os três começam pelo escopo: `resposta_atividade (escola_id, aluno_id)`, `registro_acesso (escola_id, usuario_id, em)` e `correcao (escola_id, destaque_aberto_por)`, este parcial. O `arquivo_titular` não mudou desde a rodada aprovada.

**Queries verificadas:**
- **`arquivoDaEscola` e `baixarMeuArquivo` sem transação** (`apps/api/src/privacidade/privacidade.service.ts`). O escopo não dependia da transação e continua o mesmo. Os três métodos que essas rotas usam no `ArquivoDoTitularRepository` (`doPedido`, `contaAtiva`, `arquivoCompletoDoUsuario`) e o `#pedidoAlvo` continuam lendo a escola de `exigirEscolaDoContexto()`. O `usuarioId` vem de `identidadeDaRequisicao()`, e nenhum parâmetro do cliente decide a escola. A auditoria é gravada depois da assinatura, numa transação curta, e o pedido de outra escola não chega a ela (cai em `NAO_ENCONTRADO` antes).
- **Leitura da `auditoria` em `packages/nucleo/src/titular/leitura-do-titular.ts`.** Continua presa a `t.escola_id = escolaId` e `t.autor_usuario_id = titularId`, agora sem `antes` e `depois`.
- **`semNulosDaCorrecao`.** A mudança é de forma do resultado e não toca o escopo.
- **Laço do expurgo em `apps/worker/src/processadores/expurgar-escola.ts`.** Agora para também quando `linhasApagadas === 0`. O `aApagar` e o `apagarLinhas` continuam com o `escola_id` do contexto.

**Teste de isolamento:** presente e efetivo. O caso novo está em `apps/api/test/arquivo-do-titular.int.test.ts`: "a coordenação de B não alcança, pela rota da escola, o arquivo do pedido de A". Ele exige 404 igual ao do id inexistente, sem `url` na resposta, sem auditoria nova em A nem em B e sem nenhuma URL assinada. O cenário dele só fica vermelho com os três cortes juntos (`de`, `doPedido` e `contaAtiva`), porque são camadas de defesa, e isso está declarado em `13_task.md`. Cada camada sozinha já tinha prova de isolamento na rodada aprovada.

As correções que eu recomendei na 1ª rodada foram feitas:
- o caso direto da coordenação de B na rota `POST pedidos/:id/arquivo` virou o teste acima;
- o laço do expurgo ganhou a segunda condição de parada;
- o `antes` e o `depois` saíram da leitura da auditoria, com dois testes novos: o ato do professor sobre outro aluno entra sem o dado dele, e o arquivo do aluno não leva o id da coordenação.

**Bloqueantes:** nenhum.

**Recomendações:**
- O `entidade_id` da auditoria em que o titular é o autor ainda entra no arquivo. Se algum dia um professor ou aluno for autor de uma ação com `entidade: 'usuario'` (lista em `packages/nucleo/src/auditoria/acoes.ts`), esse campo levaria o id de outra pessoa da mesma escola. Hoje essas ações são da coordenação, e o caso é do `privacy-guardian`, não de isolamento. Vale uma asserção no `arquitetura.test.ts` de que nenhuma ação de autor professor ou aluno tem `entidade: 'usuario'`.
- O caso de B só fica vermelho com os três cortes juntos. Um teste de repository por camada, com `doPedido` e `contaAtiva` chamados no contexto de B, deixaria cada cláusula provada sozinha nesta rota.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-10 01:48:03 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo nesta rodada. Muda só o que o arquivo do titular lê. A leitura de `auditoria` deixou de trazer `antes` e `depois`, e fica com `id`, `acao`, `entidade`, `entidade_id`, `finalidade` e `em` (`packages/nucleo/src/titular/leitura-do-titular.ts:360-375`). Entraram também três índices, na `0034_indices_da_leitura_do_arquivo.sql`, que não carregam dado.

Fora da tabela de dados do docs/lgpd.md: nada. A linha "Arquivo do titular" e o parágrafo "O arquivo do titular" foram atualizados (`docs/lgpd.md:559`, `:569-570`). A Tech Spec §5 e a tabela de desvios da 13_task.md registram a mudança.

Autorização por objeto: ok.
- **Rota da escola, troca de escola:** o caso novo prova que a coordenação de B, no `POST pedidos/:id/arquivo` de A, recebe `NAO_ENCONTRADO`. A resposta não traz `url`, nenhuma auditoria é gravada e nenhuma URL é assinada (`apps/api/test/arquivo-do-titular.int.test.ts:757-771`).
- **Leitura sem transação:** sair da transação não afrouxou nada. As leituras continuam pelos mesmos repositories com escopo, e com as mesmas três barreiras: `#pedidoAlvo`, `doPedido` e `contaAtiva`.

Logs: limpos. Nada de log novo nesta rodada. O `retencao.arquivo_nao_apagado` continua só com `resumirErro`, e a chave do objeto só tem ids.

Auditoria: presente.
- **Ordem:** `titular.arquivo_baixado` é gravada numa transação curta antes do `return` (`apps/api/src/privacidade/privacidade.service.ts:154-158` e `:178-186`). Se a gravação falhar, a URL assinada não sai.
- **Prova:** o teste do armazém que registra as próprias chamadas confirma as quatro consultas ao storage fora de transação e as duas linhas de auditoria, uma por versão (`arquivo-do-titular.int.test.ts:1054-1108`).

Envio externo: nenhum envio novo. O teste de `usoReal` ficou mais forte:
- **Datas:** acrescenta uma segunda chamada externa e uma local, e prova que o primeiro e o último uso valem só para envio externo.
- **Versão da escola:** prova que ela não traz `usoReal`. O `em` de `consumo_ia` aparece ali por exceção declarada do PRD, seção 6.

Seed/fixture: sintético. Os nomes são "Aluno sintético N" e "AlunoDoDestaque", o IP é `203.0.113.1` (faixa de documentação), e o volume do teste de plano termina em `rollback`.

Correções exigidas na 1ª rodada (todas eram recomendações, conferidas):
1. **A auditoria do professor levava dado de aluno:** feita. `antes` e `depois` foram para `fora`, com o motivo.
   - O teste "o ato do professor sobre outro aluno entra sem o dado do aluno, nas duas versões" semeia `correcao.destaque_aberto` e `reivindicacao.decidida` com o `alunoId` no `depois`. Ele prova a ausência do id e do nome do aluno, da lista e do diagnóstico, e a presença do ato (`:497-516`).
   - O teste "o arquivo do aluno não leva o id da coordenação…" prova que `titular.previa_lida` e `pedido.lido` não entram (`:518-538`).
   - Conferi as outras ações em que o professor pode ser autor (`acoes.ts`). O `entidade_id` delas é turma, entrega, reivindicação ou lista, ids opacos, e nenhuma aponta para o aluno como `usuario`.
   - A segunda consulta de `correcao` traz só `id` e `entrega_id`. O ajuste em `semNulosDaCorrecao` (`leitura-do-titular.ts:474`) não abre caminho para os números do aluno.
2. **Versão completa com `consumo_ia.entrada/saida` e `mensagem_agente.conteudo` de turmas com vínculo encerrado:** foi para `TODO.md` como pergunta de spec, antes da 18.0. Aceito.
3. **Fallback `?? new ArmazemEmMemoria()`:** removido (`privacidade.module.ts:111-112`). Sem storage configurado, a API não cai num armazém falso.
4. **A frase sobre a chave do objeto:** trocada pela do campo `chave_objeto` em `docs/lgpd.md`, no `armazem-de-arquivos.ts` e no repository.
5. **Exceções do PRD, seção 6:** continuam rastreadas para o parecer jurídico.

Bloqueantes: nenhum.

Recomendações:
- Um teste que faça a gravação da auditoria falhar e prove que a resposta não traz `url`. Hoje a garantia vem só da ordem do código (`privacidade.service.ts:154-158`).
- A conferência de `contaAtiva` agora fica fora da transação da auditoria. Se o titular reativar a conta nesse intervalo, a coordenação ainda recebe a versão da escola. A janela é de milissegundos e a entrega é auditada, mas vale uma linha na Tech Spec §5 dizendo que isso foi aceito.
- A corrida entre o expurgo e o job repetido deixa um objeto órfão no storage, com dado de menor fora do prazo (`TODO.md`, item do `infra-guardian`). Hoje está com destino "depois da primeira escola real". Do ponto de vista da regra 20, item 16, ela deveria fechar antes do piloto, e não depois.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-10 01:48:09 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO
Caminho quente tocado: migration, fila (job do arquivo do titular), download pelo storage
Rate limit: ok (a tarefa não cria limite novo)
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

As duas correções exigidas na 1ª rodada foram feitas.

1. **Storage fora da transação: feita.**
   - Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts:319-330` e `:365-376`, o pedido e a linha do arquivo são lidos sem transação, em consultas curtas pelo pool.
   - `#assinar`, com o `HeadObject` e a assinatura, roda fora de qualquer transação.
   - A auditoria `titular.arquivo_baixado` é gravada numa transação curta antes de a URL sair. Se a gravação falha, a URL não sai.
   - O cliente S3 da API faz uma tentativa só, com prazo de 5 s e conexão de 2 s (`configuracao-do-armazem.ts`). O padrão do worker continua em três tentativas.
   - O caminho é este: `ArmazemS3.criar` → `criarClienteDoArmazem`, que agora recebe `tentativas` e `timeoutRequisicaoMs`.
   - O fallback `?? new ArmazemEmMemoria()` saiu do módulo.
   - Um teste prova que nenhuma das quatro chamadas ao armazém (`existe` e `urlDeDownload`, nas duas rotas) acontece com transação aberta. Ele usa um proxy sobre `banco.transaction`.
   - Outro teste prova `maxAttempts` 1 na API e 3 no padrão.

2. **Índices das leituras do job: feita.**
   - Os três índices começam por `escola_id`:
     - `resposta_atividade (escola_id, aluno_id)`
     - `registro_acesso (escola_id, usuario_id, em)`
     - `correcao (escola_id, destaque_aberto_por)`, parcial
   - Estão no schema, na `0034_indices_da_leitura_do_arquivo.sql`, no journal e no snapshot (o `prevId` encadeia com a 0033).
   - Os índices batem com os filtros das consultas de `leitura-do-titular.ts:177`, `:262` e `:289`.
   - O teste de plano tem volume (30 alunos × 100 linhas por tabela), confere o nome de cada índice no `EXPLAIN` e exige ausência de `Seq Scan`.
   - A migration só acrescenta índices, sem `concurrently`. A seção 7c da Tech Spec aceita isso enquanto não há staging, e o `TODO.md` guarda o pendente para antes do staging.

Outras mudanças desta rodada:
- A auditoria do arquivo saiu sem `antes` e `depois`, e um teste cobre isso.
- O laço do expurgo agora para quando nenhuma linha é apagada (`linhasApagadas === 0`), o que tira o risco de laço sem fim.
- O teste de reenvio simultâneo prova que o job do arquivo entra na fila uma vez só.

Recomendações:
- O teste do item 1 prova que não há transação aberta, mas não simula um storage lento de fato. Um armazém com atraso real, junto de uma medição de `pool.idleCount`/`totalCount` durante a espera, fecharia o cenário de pool esgotado.
- No teste de plano, `enable_seqscan = off` deixa a checagem de "sem `Seq Scan`" fraca. Quem prova o resultado é a checagem do nome do índice.
- Entre a leitura curta e a gravação da auditoria, o arquivo pode vencer ou o titular pode reativar a conta, e mesmo assim a URL sai. É uma janela de milissegundos, sem efeito em carga. Fica registrado.
- Os pendentes da 1ª rodada que foram para o `TODO.md` continuam valendo antes do staging: a corrida entre o expurgo e o job repetido, os índices por turma, o objeto que falhou repetido no expurgo e o cliente S3 único.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-10 01:48:18 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff da 2ª rodada não grava em `nota`, e o job `titular.montar-arquivo` só escreve em `arquivo_titular` e no estado de `pedido_titular`. Todos com autor humano? sim, porque não há caminho novo.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok. A correção do aluno só leva números e diagnóstico quando o lote foi aprovado pelo professor. Lote pendente ou rejeitado sai só como estado, nas duas versões, e o filtro está no próprio SQL (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.ts:278-287`).

Supervisão do tutor: ok, a tarefa não mexe no tutor.

Autonomia declarada e visível: sim, a tarefa não mexe nela.

Conferência das três correções desta rodada:
- **Auditoria do professor com dados de aluno (minha recomendação 1).** Corrigida. A leitura da `auditoria` agora traz só `id, acao, entidade, entidade_id, finalidade, em`. `antes` e `depois` ficaram fora, com o motivo escrito (`leitura-do-titular.ts:360-375`). O teste "o ato do professor sobre outro aluno entra sem o dado do aluno, nas duas versões" semeia `correcao.destaque_aberto` e `reivindicacao.decidida` com o `alunoId` no `depois`, como a auditoria de verdade grava. Ele prova que o id do aluno, o nome, a lista e o diagnóstico não aparecem nas duas versões, e que o ato aparece. Também fecha a regra 70, item 8, no sentido inverso: ao baixar a versão da escola do professor, a coordenação não recebe o dado de aluno que estava no `depois`.
- **O teste da D64 (minha recomendação 3).** Corrigido. Agora há uma segunda chamada externa e uma chamada local anterior às duas. `usoReal` traz a primeira e a última data certas e ignora a local. A versão da escola não leva `usoReal` em parte nenhum do texto, e o bloco de compartilhamento não leva datas reais. A troca de "texto inteiro" para "campo `usoReal` e compartilhamento" está justificada: o `em` de `consumo_ia` entra por exceção declarada no PRD, seção 6, e está na tabela de desvios da 13.0.
- **`artefato.titulo` (minha recomendação 2).** Foi para o `TODO.md` como pergunta de spec antes da 18.0, junto com a do `privacy-guardian`. O destino serve, porque hoje o título está coberto pela exceção do PRD.

O resto do diff que toca a minha regra:
- **O arquivo do aluno não carrega a coordenação.** Um teste novo prova que ele não leva o id dela nem as leituras `titular.previa_lida` e `pedido.lido`, mesmo com essas leituras feitas antes do job. Isso confirma que a auditoria só entra pelo autor.
- **Versão da escola do professor, regra 70, item 8.** Continua sem `thread_agente`, `mensagem_agente`, `entrada`/`saida` de `consumo_ia` e `justificativa` de `entrega` (`leitura-do-titular.ts:198-247, 304-313`).
- **Assinatura fora de transação.** O `titular.arquivo_baixado` continua sendo gravado antes de a resposta sair. Se a auditoria falhar, a URL não sai, então a regra 70, item 6, segue respondida. O teste novo confere a ordem e as duas linhas de auditoria.
- Os índices da `0034`, o cliente S3 da API e o laço do expurgo não tocam a regra 70.

Bloqueantes: nenhum.

Recomendações:
1. **Atos com o aluno no `entidade_id`.** Sem `antes` e `depois`, a auditoria do professor ainda leva o `entidade_id`. Para as ações de hoje é o id do lote ou da reivindicação, mas uma ação futura com `entidade = 'usuario'` sobre um aluno levaria o id do aluno para a versão da escola. Vale uma guarda que liste as ações com `entidade` de pessoa e decida se o `entidade_id` delas entra. É mais da regra 20, critério 2, do que da 70: fica para o `privacy-guardian` e para o `/retro`.
2. **O teste de `antes`/`depois` cobre só duas ações.** Ele usa `correcao.destaque_aberto` e `reivindicacao.decidida`. Os convites citados na Tech Spec (`techspec.md`, seção 5) não têm caso próprio. Hoje a coluna fora do `select` cobre todos, então é só cobertura extra.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/arquivo-do-titular.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/docs/lgpd.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-10 01:48:18 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As duas correções exigidas na 1ª rodada foram feitas:
1. **Auditoria no arquivo.** A leitura da auditoria não traz mais `antes` e `depois`; os dois foram para `fora`, com o motivo, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/leitura-do-titular.ts:360-375`. A escolha está registrada na Tech Spec §5 ("Pedido e quem o atendeu"), em `docs/lgpd.md` ("O arquivo do titular") e na tabela de divergências do `13_task.md`. A sentinela em `apps/api/test/arquivo-do-titular.int.test.ts` grava `correcao.destaque_aberto` e `reivindicacao.decidida` com o `depois` preenchido. O teste confere, nas duas versões, que não aparecem o id e o nome do outro aluno, nem a linha da lista dele.
2. **`TODO.md`.** O item "Acesso e portabilidade do titular cobrindo as tabelas da fase 3" voltou a ficar inteiro. Os itens novos da 13.0 entraram antes dele.

O código que mudou por pedido de outros revisores também está na Tech Spec §5:
- download fora de transação, com a auditoria numa transação curta antes de a URL sair;
- cliente S3 da API com 1 tentativa e 5 s;
- migration `0034` com os três índices.

Não achei bug nisso. A mudança em `semNulosDaCorrecao` (`!('situacao' in linha)`) é correta: a 2ª consulta da `correcao` não tem `situacao` e já não trazia os números.

Recomendações:
- **O `test-engineer` está REPROVADO neste código.** A árvore atual é igual à da rodada 2; só a linha de Revisões do `13_task.md` mudou. O bloqueio dele continua sem correção: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.test.ts`, no teste "uma tentativa só e prazo próprio", confere só o `maxAttempts`. Nada prova que o `requestTimeout` de 5 s chega ao cliente. O commit continua travado até isso ser feito.
- **`cenarios.md` ficou para trás em RF11 e RF12, "Tarefa 13.0, onde cada um está".** Faltam três cenários novos:
  - no "Conteúdo", o ato do professor sobre outro aluno sem o dado dele, e o arquivo do aluno sem o id da coordenação;
  - no "Plano", os três índices da `0034`;
  - nenhuma linha cita o teste "storage fora de transação".

  As divergências citam só a Tech Spec, como as da 1ª rodada que já passaram; acrescentar os três deixa a lista que o `test-engineer` usa batendo com os testes.
- **O item antigo do `TODO.md`** ("Acesso e portabilidade… fase 3") pede `mensagem_tutor`, `resposta_atividade`, `correcao`, `validacao_do_lote` e `consumo_ia`, e o arquivo da 13.0 lê essas tabelas. Se a 13.0 o cumpriu, marcar como feito e dizer onde. Se falta algo, como a rota do `ciclo-de-vida.service.ts`, dizer o que falta.

Um aviso: durante a auditoria eu rodei um `git add -N .` para comparar com a árvore da rodada 2, e isso marcou 23 arquivos novos no índice. Desfiz na hora com `git reset`, e eles voltaram a aparecer como `??` no `git status`. Nenhum arquivo foi editado.

## test-engineer · 3ª rodada · APROVADO · 2026-10-10 03:00:26 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO

Cenários exigidos (3ª rodada, sobre o diff r2→r3):
- A correção da 2ª rodada: o prazo resolvido no cliente da API (5 s, uma tentativa) e o padrão no cliente do worker (10 s, três tentativas), com a linha `timeoutRequisicaoMs ?? padrão` registrada em "Mutações".
- A mudança de produção `throwOnRequestTimeout: true`: um teste comportamental que fique vermelho quando o campo sai.
- O teste novo é estável e não deixa servidor nem timer pendurados.
- A recomendação da 2ª rodada: o `|| linhasApagadas === 0` registrado como equivalente.

Cobertos (mutações rodadas por mim; restaurei o arquivo depois de cada uma e confirmei com `diff`):
- **M1, `requestTimeout: config.timeoutRequisicaoMs ?? PADRÃO` vira `requestTimeout: PADRÃO`:** vermelho em 2 testes. "o cliente da API usa uma tentativa só…" falha no `toMatchObject` de `requestTimeout: 5000`. "o prazo corta a chamada…" falha com `promise resolved "true" instead of rejecting`.
- **M2, apagar `throwOnRequestTimeout: true`:** vermelho nos mesmos 2. O teste do storage lento falha por asserção (a chamada responde `true` depois de 1 s) e não pelo limite de tempo do vitest. A mudança de produção está provada.
- **M3, `throwOnRequestTimeout: false`:** vermelho nos mesmos 2.
- **M4, padrão `?? 5_000` no lugar de `?? TIMEOUT_REQUISICAO_DO_ARMAZEM_MS`:** vermelho em "o padrão do worker" (esperava 10000).
- **Cadeia até a API:** `apps/api/src/config.test.ts:142` afirma `timeoutRequisicaoMs: 5000` e `tentativas: 1` na configuração lida. `privacidade.module.ts:36` passa `opcoes.armazem` inteiro para `ArmazemS3.criar`. O teste do núcleo prova que o campo chega ao handler e corta a chamada.
- **O controle do teste novo:** o mesmo servidor responde dentro do prazo padrão, então a recusa vem do prazo e não do servidor de teste.
- **Estabilidade:** 10 execuções seguidas, todas verdes, cerca de 1,27 s cada. Mais 5 execuções do arquivo com 24 laços de CPU ocupando os 12 núcleos, todas verdes. A unidade inteira (208 arquivos, 2851 testes) passou com o teste rodando junto. A margem é folgada: o prazo curto é de 100 ms contra 1000 ms do servidor, e o controle leva 1 s contra 10 s de prazo.
- **Nada pendurado:** com `--reporter=hanging-process` não aparece nenhum handle aberto, e o processo sai logo. O `fechar()` cancela os timers pendentes, encerra as conexões e fecha o servidor no `finally`. Os dois clientes recebem `encerrar()`.
- **"Mutações" em `tasks/prd-lgpd-e-titular/13_task.md`:** as duas linhas exigidas estão lá (`throwOnRequestTimeout: true` e `timeoutRequisicaoMs ?? padrão`). O `|| linhasApagadas === 0` está registrado como equivalente, com o motivo.
- **Sem `.skip`, sem provedor pago, sem mock que esconda a regra:** o storage lento é um servidor HTTP real e local.

Bloqueantes: nenhum.

Recomendações:
1. **O valor de 10 s não está preso a nenhum teste.** Os testes comparam o prazo do worker com a própria constante (`armazem-s3.test.ts:93`). Se `TIMEOUT_REQUISICAO_DO_ARMAZEM_MS` virar 60_000, tudo continua verde, embora o `cenarios.md` diga "10 s". Basta afirmar `10_000` como literal em um ponto.
2. **`prazosDe` lê `requestHandler.configProvider`, que é interno do `@smithy/node-http-handler`.** Se o SDK mudar, o teste quebra (não passa calado), e o teste comportamental continua cobrindo. Vale um comentário dizendo que o campo é interno e que o teste de verdade é o do storage lento.
3. **Fica no `TODO.md` e não é desta tarefa:** o cliente do medidor de storage do worker (`apps/worker/src/storage/medidor-de-storage.ts`) passa `requestTimeout` sem `throwOnRequestTimeout`, então o prazo dele também só avisa. Quando as duas fábricas virarem uma, o mesmo par de testes deve passar a valer para ele.

## tenancy-guardian · 3ª rodada · APROVADO · 2026-10-10 03:01:25 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem migration nesta rodada. Entre a árvore aprovada na 2ª rodada (`6939a3d…`) e a da 3ª (`6cfbf81…`), a única mudança em código de produção é `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.ts:35-36`, em `criarClienteDoArmazem`: o `requestHandler` ganhou `throwOnRequestTimeout: true` e um comentário. A `0033` e a `0034` não mudaram.

Queries verificadas: nenhuma query mudou. `arquivo-do-titular.repository.ts`, `leitura-do-titular.ts`, `titulares.repository.ts` e `pedidos.repository.ts` são os mesmos da árvore aprovada. Os efeitos da mudança no isolamento:
- **Chave do objeto:** continua `titular/<escola>/<pedido>/…`. A linha nova só mexe no prazo do cliente.
- **Escopo:** o `escola_id` continua vindo do token, no repository.
- **Resposta igual para inexistente e alheio:** não mudou. Um prazo estourado vira `ArmazemIndisponivel` (503), e esse caminho só se alcança depois que o pedido já passou pelo escopo, então não diz nada sobre dado de outra escola.

Conferência de "nada fora do diff mudou":
- `git status --short` é idêntico às 75 linhas de `.processo/ordens/arquivos-13-r3.txt`.
- O diff entre as duas árvores tem 8 arquivos. Os 6 que não são `armazem-s3.ts` nem `armazem-s3.test.ts` são documentos: `TODO.md`, `13_task.md`, `achados/13_task.md`, `achados/indice.md`, `cenarios.md` e `estado.md`.
- O disco hoje difere da árvore `6cfbf81` só em quatro documentos, todos `.md` de `tasks/prd-lgpd-e-titular/`: `13_task.md`, `achados/13_task.md`, `achados/indice.md` e `estado.md`. Nenhum arquivo de código mudou depois da árvore da 3ª rodada.

Teste de isolamento: presente e efetivo. É o mesmo da 2ª rodada (`a coordenação de B não alcança, pela rota da escola, o arquivo do pedido de A`), e nada do que ele cobre mudou. O teste novo em `armazem-s3.test.ts` prova o prazo, não o tenant, e por isso não substitui nem enfraquece o de isolamento.

Bloqueantes: nenhum.

Recomendações:
- Ficam como estavam as duas da 2ª rodada, já registradas em "Recomendações sem aplicar" para a 14.0 e a 15.0: a asserção no `arquitetura.test.ts` de que nenhuma ação de autor professor ou aluno tem `entidade: 'usuario'`, e o teste de repository por camada com `doPedido`/`contaAtiva` no contexto de B.

## conformidade-reviewer · 3ª rodada · APROVADO · 2026-10-10 03:01:30 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO

Esta rodada cobre só o que mudou entre a árvore `6939a3d` (2ª rodada) e a `6cfbf81`. Conferi que o `git status --short` atual é idêntico a `.processo/ordens/arquivos-13-r3.txt` (75 linhas). Conferi também que a mudança do cliente S3 está na árvore, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.ts:36`. O arquivo do titular, a versão da coordenação e a auditoria não mudaram desde a 2ª rodada, que eu aprovei, e não foram reauditados.

Caminhos de escrita em Nota: nenhum novo nesta rodada. A mudança é só a configuração do cliente de storage (`throwOnRequestTimeout: true`). Todos com autor humano? sim, sem alteração desde a 2ª rodada.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. O diff não toca saída de IA.
Supervisão do tutor: ok. O diff não toca o tutor.
Autonomia declarada e visível: sim, sem alteração.

**O que mudou e não toca a regra 70**
- **`armazem-s3.ts:35-36`**: o prazo de requisição do cliente do armazém passa a interromper a chamada; antes ele só gerava um aviso. Não tem relação com nota, correção, tutor, agente, decisão sobre aluno ou indicador de professor.
- **`armazem-s3.test.ts`**: são testes de prazo, com um servidor HTTP local e dado sintético. Não entra dado de pessoa.
- **`cenarios.md`**, nas linhas novas da 13.0 em RF11 e RF12, vai a favor da regra 70 e da regra 20:
  - O ato do professor sobre outro aluno entra no arquivo só como ato, sem o diagnóstico, o resumo do lote, o id ou o nome do aluno, e sem o `antes` e o `depois` da auditoria.
  - O arquivo do aluno não leva o id da coordenação nem a auditoria em que ela é o alvo.
  - Nada fala em ranking de professor, adoção nominal (item 9), métrica ligada a decisão sobre o professor ou conversa do professor visível à coordenação (item 8), nem em medir navegação, tempo ocioso ou emoção (item 7).
- **`TODO.md`**: o item novo trata só do prazo do medidor de storage do worker. A linha sobre `artefato.titulo` e a regra 70, item 8, já existia e continua marcada como pergunta para a Tech Spec antes da 18.0. Nada ali contraria as regras 70 e 20.
- **`13_task.md`** e **`estado.md`**: só registro de processo. Minha recomendação da 2ª rodada (o teste de antes e depois cobre só duas ações) foi recusada, e o motivo dado se sustenta: o `antes` e o `depois` ficam fora do `select`, e isso vale para toda ação. A recomendação sobre `entidade: 'usuario'` foi para a 14.0 ou a 15.0, como combinado.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. As da 2ª rodada continuam onde o `13_task.md` as registrou, em "Recomendações sem aplicar" (o caso `entidade: 'usuario'` vai para a 14.0 ou a 15.0). A pergunta sobre `artefato.titulo` continua no `TODO.md`, para a Tech Spec antes da 18.0.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-10 03:01:31 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum

**O que conferi**

- **A árvore mudou só no que a rodada declara.** Gerei a árvore atual com um índice temporário e comparei com a árvore aprovada na 2ª rodada (`6939a3d`). Mudaram oito arquivos: `TODO.md`, `armazem-s3.ts`, `armazem-s3.test.ts`, `13_task.md`, `cenarios.md`, `estado.md`, `achados/13_task.md` e `achados/indice.md`. Contra a árvore desta rodada (`6cfbf81`), só mudaram documentos do processo: a linha nova em "Revisões" do `13_task.md` (o `test-engineer` aprovando a 3ª rodada), mais `achados/` e `estado.md`. Fora do diff, nenhum código de produção mudou.
- **A correção bate com a Tech Spec.** A seção 5, "O download", pede "uma tentativa só e prazo de 5 s", e a regra 80, item 4, pede prazo em toda chamada. Abri `node_modules/@smithy/node-http-handler/dist-es/set-request-timeout.js` (versão 4.12.1): sem `throwOnRequestTimeout`, o prazo estourado só gera um aviso, sem `req.destroy` nem `reject`. Então o comentário novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.ts:35` está certo.
- **O erro de prazo chega ao chamador do jeito certo.** O `TimeoutError` do SDK não é `S3ServiceException`. Por isso `existe` o converte em `ArmazemIndisponivel`, que é o que o `it` novo afirma. O cliente do worker (10 s, três tentativas) também passa a cortar, como o comentário do topo do arquivo já prometia. Nenhum teste existente depende de chamada ao storage que passe de 10 s.
- **O teste novo é estável e não deixa nada aberto.**
  - A folga é de dez vezes (servidor de 1.000 ms contra prazo de 100 ms).
  - Há um controle: o mesmo servidor responde dentro do prazo padrão, o que mostra que a recusa vem do prazo e não do servidor de teste.
  - O `finally` encerra os dois clientes, cancela os timers pendentes, fecha as conexões abertas (`closeAllConnections`) e depois o servidor (`close`).
  - Ele usa a porta 0 em 127.0.0.1, então não disputa porta.
- **O teste também confere os valores configurados.** `prazosDe` afirma `requestTimeout` e `throwOnRequestTimeout: true` nos dois clientes, o da API e o do worker. Assim, a mutação de `timeoutRequisicaoMs ?? padrão` fica coberta, e as duas linhas novas em "Mutações" estão certas.
- **O item novo do `TODO.md` está correto.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/src/storage/medidor-de-storage.ts:33` passa `requestTimeout` sem `throwOnRequestTimeout`. O arquivo não é desta tarefa, então mandá-lo para o `TODO.md`, junto do item que junta as duas fábricas, está certo.
- **Os documentos também conferem.**
  - Em `cenarios.md` entraram os cenários que pedi na 2ª rodada: em RF11, o ato do professor sem o dado do aluno e o arquivo do aluno sem o id da coordenação; em RF12, o storage fora da transação, o prazo que corta a chamada e os três índices da `0034`. O parágrafo "onde cada um está" também foi atualizado.
  - A linha "Equivalentes" para `|| linhasApagadas === 0` diz por que a guarda é inalcançável com o código correto.

Recomendações:
- **O helper `prazosDe` lê um campo interno do SDK.** Ele lê `requestHandler.configProvider`, que é `private` no tipo do SDK e pode quebrar ao atualizar o SDK. Diga isso no JSDoc de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.test.ts`, para quem atualizar o SDK saber de onde vem a quebra. O `test-engineer` já recomendou o mesmo. O `it` com o servidor lento é o que prova o comportamento e não depende desse campo.
- **O prazo padrão do worker só é afirmado pela constante.** Hoje o teste usa `TIMEOUT_REQUISICAO_DO_ARMAZEM_MS`. Afirme `10_000` como literal em um ponto, para que trocar a constante por engano não passe calado. O `test-engineer` também recomendou isso.

## privacy-guardian · 3ª rodada · APROVADO · 2026-10-10 03:01:34 · `tasks/prd-lgpd-e-titular/13_task.md`

VEREDITO: APROVADO

**Escopo.** Auditei o diff da 2ª para a 3ª rodada (`6939a3d` → `6cfbf81`) e o que ele afeta. `git status --short` dá as mesmas 75 linhas de `.processo/ordens/arquivos-13-r3.txt`. A leitura do titular, o DTO, a URL assinada de 300 s, a auditoria e o expurgo não mudaram e não foram reauditados.

**A mudança: `throwOnRequestTimeout: true` em `criarClienteDoArmazem`** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.ts:36`)
- **O erro do SDK não vaza.** O erro de prazo do SDK não é um `S3ServiceException`. Por isso cai no `throw new ArmazemIndisponivel()` sem causa, em `armazem-s3.ts:88`, `:109` e `:117`. A mensagem do `ArmazemIndisponivel` é fixa, `armazem_indisponivel` (`armazem-de-arquivos.ts:16-20`), e não leva o endereço do storage, a chave do objeto nem o texto do SDK.
- **Na API, a falha não gera URL nem auditoria.** O `#assinar` (`apps/api/src/privacidade/privacidade.service.ts:389-399`) transforma o `ArmazemIndisponivel` em `ErroDeDominio(INDISPONIVEL_TENTE_DE_NOVO)`. Isso acontece antes da transação que grava `titular.arquivo_baixado`, então o prazo estourado responde 503 sem `url` e sem registro de baixa.
- **No worker, o pedido não fica "pronto" com falha.** Em `apps/worker/src/processadores/montar-arquivo.ts:67`, o `guardar` com prazo estourado lança antes de o pedido passar para `pronto`. O pedido segue `em_preparacao` e o job repete. Se o PUT terminar no storage depois do corte, a chave é a mesma e a repetição sobrescreve, então não sobra objeto órfão. No expurgo, um DELETE cortado volta como não apagado e a noite seguinte repete. Apagar de novo não causa dano.
- **Logs.** O diff não adiciona nenhum log. O log do job continua só com evento e status, sem nome, chave ou conteúdo.

**Os testes novos** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.test.ts`) usam só dado sintético: UUIDs inventados, `chave_sintetica` e `segredo_sintetico_xyz`, e um servidor local em `127.0.0.1` que responde sem corpo. Nenhum dado de pessoa.

**Documentos.** O `TODO.md`, o `13_task.md`, o `cenarios.md` e o `estado.md` não trazem campo pessoal nem dado real.

```
Campos pessoais tocados: nenhum nesta rodada
Fora da tabela de dados do docs/lgpd.md: nenhum
Autorização por objeto: ok (inalterada desde a 2ª rodada)
Logs: limpos
Auditoria: presente (inalterada); a falha por prazo não grava titular.arquivo_baixado nem devolve URL
Envio externo: nenhum novo
Seed/fixture: sintético
Bloqueantes: nenhum
Recomendações:
- O mesmo defeito do prazo continua no cliente S3 do worker, em `criarClienteS3`
  (`apps/worker/src/storage/medidor-de-storage.ts`). Já está no `TODO.md`. Pela regra 20 o risco é baixo,
  porque o medidor não lê nem expõe dado de pessoa. Basta fechar quando as duas fábricas virarem uma,
  como o item prevê.
- Continuam valendo as recomendações da 2ª rodada, que já têm destino em "Recomendações sem aplicar"
  do `13_task.md`:
  - o teste em que a gravação da auditoria falha e a resposta sai sem `url` (tarefa 17.0);
  - a corrida entre o expurgo e o job repetido, que pode deixar objeto órfão (`TODO.md`, antes do piloto).
```

## infra-guardian · 3ª rodada · APROVADO · 2026-10-10 03:01:57 · `tasks/prd-lgpd-e-titular/13_task.md`

**VEREDITO: APROVADO**

- **Caminho quente tocado:** fila e deploy (o cliente S3 da API no download e o do worker no job de arquivo e no expurgo)
- **Rate limit:** ok (esta rodada não mexeu nele)
- **Fila e prioridade:** ok
- **Concorrência:** protegida (esta rodada não mexeu nela)
- **Índice e paginação:** ok (esta rodada não mexeu neles)
- **Degradação de IA:** não se aplica
- **Migration:** não se aplica nesta rodada
- **Métrica e alerta:** ok

**Bloqueantes:** nenhum.

**O que conferi da correção exigida:**
- **O prazo corta de verdade.** No `@smithy/node-http-handler` 4.12.1 instalado, com `throwOnRequestTimeout` ligado, o prazo estourado derruba a requisição e devolve `TimeoutError`. Antes ele só registrava um aviso.
- **O erro chega como `ArmazemIndisponivel`.** O `catch` em `existe` e em `#enviar` faz essa troca, sem levar o texto do SDK (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/titular/armazem-s3.ts:82-119`).
- **Os dois clientes batem com a configuração.**
  - API: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/configuracao-do-armazem.ts:32-45` dá uma tentativa e 5 s, que chega à fábrica por `privacidade.module.ts:36`. Pior caso de cerca de 5 s por requisição, sem segurar banco: a 2ª rodada já tinha provado que o storage roda fora de transação.
  - Worker: `montagem.ts:133` usa o padrão de três tentativas de 10 s. O job falha a tentativa em cerca de 30 s em vez de ficar pendurado sem limite.
- **O teste prova a regra e não só a configuração.** O servidor lento de 1000 ms contra um prazo de 100 ms dá folga de dez vezes, e o controle no prazo padrão mostra que a recusa vem do prazo. Rodei uma vez: 8 de 8 verdes em 1,28 s.

**Sobre o item 3 (o medidor de storage):** fica como pendência e não bloqueia a 13.0. O arquivo `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/src/storage/medidor-de-storage.ts:33` é de outra tarefa e não está no diff, e o defeito já existia antes. Ele serve a `consolidar-uso`, que é job de lote e não está no caminho de aula. O item já está no `TODO.md`, na seção "Antes da primeira escola real", e fecha junto da fábrica única. Assim ele tem prazo e não trava o piloto sem ser corrigido.

**Recomendações:**
1. **Medidor de storage.** Até a fábrica única sair, um storage que aceita a conexão e não responde prende uma vaga da fila de lote sem limite. O BullMQ renova a trava enquanto o job está vivo, então a recuperação de job travado não entra. Vale corrigir na primeira tarefa que tocar o worker de storage, sem esperar a junção das fábricas.
2. **Expurgo com storage pendurado.** Agora cada chamada que estoura custa cerca de 30 s no worker. Em `apagarArquivosDoTitular`, com 205 arquivos e o storage pendurado, a noite pode levar perto de 100 min. Considerar parar o lote no primeiro `ArmazemIndisponivel` e deixar a noite seguinte reparar, como já acontece com a falha ao apagar.
3. **Recomendações da 2ª rodada.** Continuam com destino ou motivo registrado em "Recomendações sem aplicar". Nada a acrescentar.
