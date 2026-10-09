# Tech Spec — LGPD e titular

**PRD:** `tasks/prd-lgpd-e-titular/prd.md`
**Status:** aprovado (revisão da spec, rodada 6, 05/10/2026)

> **Teto de 2.000 palavras excedido, com aceite do Joaquim (05/10/2026): ~3.700 aceitas; as rodadas 2 a 5 da revisão
> levaram a ~4.800, à espera de confirmação.** São três fatias independentes num documento
> só, e a rodada 1 da revisão exigiu por escrito a classificação de toda tabela, as exceções de escopo e as travas.
> Os cenários de teste ficam em `cenarios.md`. Cada tarefa lê só a seção dela.

## 1. Resumo da abordagem

1. **Retenção.** Um catálogo de categorias em código guarda o padrão, o piso, o teto e a âncora de cada prazo, e a
   `retencao_escola` guarda só o ajuste da escola. Toda noite, uma rotina abre um job **por escola**, no contexto
   dela: ele apaga ou anonimiza o que venceu e enfileira, uma vez, as eliminações cujo prazo chegou.
2. **Suboperador e incidente.** Ficam em tabelas da operação, escritas por `ops:*`. A escola lê pela ligação com ela,
   e o incidente tem os números e os textos por escola.
3. **Pedido do titular.** A API registra o pedido e enfileira. O worker monta o JSON no storage privado e elimina. Para
   isso, o `CicloDeVidaService` sai de `apps/api` e vai para `packages/nucleo`.

Nada aqui usa IA.

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `packages/shared/src/privacidade` | novo | catálogo, classificação das tabelas, contratos, erros (`RETENCAO_FORA_DO_LIMITE`, `PEDIDO_EM_ESTADO_INVALIDO`, `ACESSO_SUSPENSO`) |
| `packages/nucleo/src/ciclo-de-vida` | movido de `apps/api/src/sessao` | `CicloDeVidaService`, repositórios e testes; a `ContaGlobalRepository` com os `@SemEscopo` da conta (seção 6). Na tarefa 1.0: os três métodos que o serviço chamava em repositórios da API (`TurmaRepository.travarContraOGerarDoProfessor`, `EscritaDeSessaoRepository.encerrarDoUsuario`, agora `encerrarSessoesDoUsuario`, e `AcessoDaTurmaRepository.revogarDeQuemSaiu`) vieram para o `CicloDeVidaRepository` sem mudar a instrução, e o `VinculoService.encerrar` usa a revogação daqui; a API importa pelos subcaminhos `@educa/nucleo/ciclo-de-vida` e `@educa/nucleo/conta-global`. `desativar` e `eliminar` recebem a transação de quem chama como terceiro argumento, sem ponto de salvamento. Os testes de integração continuam em `apps/api/test`, porque provam o efeito pela API; só a importação mudou |
| `packages/nucleo/src/retencao` | alterado | `ExpurgoDaEscolaRepository`, `RetencaoDaEscolaRepository` (escopo do contexto) |
| `packages/nucleo/src/rotina` | novo | `EscolasDaRotinaRepository` |
| `packages/nucleo/src/titular` | novo | `LeituraDoTitular`, `TrocaDeNome`, `Compartilhamento`, porta `ArmazemDeArquivos` (S3 e falso) |
| `packages/nucleo/src/config` e `ia` | alterado | `IA_PROVEDOR_ID` e o caminho até `consumo_ia.provedor` (seção 3) |
| `apps/api/src/privacidade` | novo | rotas da seção 4 |
| `apps/api/src/sessao` | alterado | guarda, logins e renovação recusam `eliminacao_agendada_em` com `ACESSO_SUSPENSO` |
| `apps/api/src/ops` | alterado | `ops:retencao`, `ops:suboperador`, `ops:incidente`, `ops:privacidade`, e a `OperacaoPrivacidadeRepository` |
| `apps/worker` | alterado | processadores e agendamento da seção 5 |
| `apps/web` | alterado | seção 9 |
| `docs/` | alterado | `lgpd.md` (na tarefa da migration); `modelo-de-dados.md` (exceções); `arquitetura.md`; `interface.md` (Privacidade); `runbook.md` |

## 3. Modelo de dados

**Catálogo** (`CATEGORIAS_DE_RETENCAO`), em meses. Os valores foram aprovados pelo Joaquim em 05/10/2026.

| Categoria | O expurgo | Conta de | Padrão | Piso | Teto |
|---|---|---|---|---|---|
| `conversa_tutor` | apaga `mensagem_tutor` | mensagem | 12 | 6 | 24 |
| `sinal_tutor` | apaga `sinal_tutor` | sinal | 12 | 6 | 24 |
| `conversa_professor` | apaga `mensagem_agente`; a `thread_agente` vazia sai | mensagem | 12 | 3 | 24 |
| `execucao_agente` | `entrada = {tarefa}`, `solicitada_por` nulo, `anonimizada_em`; mantém `resultado`, `erro` e a linha | criação | 12 | 3 | 24 |
| `texto_do_modelo` | anula `consumo_ia.entrada` e `saida` | `em` | 12 | 1 | 12 |
| `consumo_por_aluno` | anula `consumo_ia.aluno_id` e anonimiza a execução do Tutor (tarefa 4.0) | `em` (a execução, a criação) | 12 | 3 | 24 |
| `trabalho_do_aluno` | apaga `tentativa_atividade` (resposta e correção em cascata) | `fim` do ano com `situacao = encerrado` | 12 | 6 | 60 |
| `reivindicacao_decidida` | apaga | decisão (solicitação, no `encerrada`) | 60 | 12 | 60 |
| `autoria_de_artefato` | anula `artefato.criado_por` | `fim` do ano encerrado | 60 | 12 | 60 |
| `material_excluido` | apaga a linha | `excluido_em` | 60 | 12 | 60 |
| `vinculo_encerrado` | apaga o vínculo encerrado | fim do vínculo | 60 | 12 | 60 |
| `pessoa_desativada` | elimina pelo ciclo de vida; pula quem tem pedido `agendado` | `desativado_em` | 60 | 12 | 60 |

**Travas entre categorias.** O prazo efetivo de `execucao_agente` e de `texto_do_modelo` é o menor entre o deles e o de
`conversa_professor`, e o de `consumo_por_aluno` é o menor entre o dele e o de `conversa_tutor`. Um ajuste que
desrespeite isso dá `RETENCAO_FORA_DO_LIMITE`. A execução do Tutor, que tem o aluno em `solicitada_por` e a que o consumo
dele aponta, perde o aluno no menor entre o prazo de `execucao_agente` e o de `consumo_por_aluno` (tarefa 4.0).

**Classificação de toda tabela** (`CLASSIFICACAO_DAS_TABELAS`), conferida contra as migrations por um teste de
arquitetura:

| Classe | Tabelas |
|---|---|
| categoria acima | as doze linhas acima, mais `resposta_atividade`, `correcao` e `thread_agente` (cascata ou vazio) |
| prazo fixo, com quem aplica | `registro_acesso`, `sessao`, `convite`, `acesso_turma`: `sistema.expurgar-acesso`. `conta`, `codigo_recuperacao`: limpeza da conta (F1). `credencial_matricula`, `conta_externa`: desativação e eliminação. `lista_nome`: virada do ano (A1) e eliminação. `operador`, `convite_operador`, `sessao_operador`, `acesso_operacao`, `codigo_recuperacao_operador`: A0 e `sistema.expurgar-acesso`. `job_registro`: 7 dias (F0). `auditoria`, `auditoria_operacao`, `entrega`, `validacao_do_lote`, `suspensao_de_funcao`, `atividade_aplicada`, `pedido_titular`: vigência + 5 anos, no fim de contrato (F12). `arquivo_titular`: 7 dias. `incidente` e `incidente_escola`: 5 anos do registro, no prazo fixo `registro_de_incidente` (tarefa 9.0: o nono de `PRAZOS_FIXOS`, com texto próprio na tela de Retenção, porque "enquanto durar o contrato, e mais 5 anos" do `registro_de_decisao` não descreve o incidente), aplicado pelo `sistema.expurgar-acesso`, fora do arquivo do titular (quem confirma é coordenação). `expurgo_execucao`: 5 anos (tarefa 3.0: no grupo `registro_de_decisao` de `PRAZOS_FIXOS`, que são nove e fechados; quem aplica é o expurgo da escola, no fim de cada noite: tarefa 5.0) |
| sem pessoa | `rede`, `escola`, `ano_letivo`, `serie`, `disciplina`, `turma`, `provedor_escola`, `configuracao_operacional_escola`, `uso_infra_diario`, `trecho`, `resumo_do_analista`, `retencao_escola`, `suboperador`, `suboperador_escola` |

Também `usuario` ativo e `material` vigente ficam enquanto existem; saem pela eliminação e pelas duas categorias acima.

Na tarefa 2.0 a classificação traz só as tabelas que já existem: o teste a confere contra as migrations nos dois
sentidos, e cada tabela nova (as desta seção) entra na lista, e as colunas dela em `COLUNAS_FORA_DO_ARQUIVO`, na tarefa
da migration dela. Os prazos fixos são nove grupos (`PRAZOS_FIXOS`: registro de acesso, sessão, convite e acesso da
turma, credencial, lista de nomes, registro de decisão, tarefa em segundo plano, equipe Turmma e registro de incidente).

Cada tabela da classificação diz se **entra no arquivo do titular** e por qual coluna se liga a ele. Entram: `usuario`,
`credencial_matricula` (só a matrícula), `conta` (só o e-mail, nas duas versões), `conta_externa` (só o provedor),
`vinculo`, `lista_nome`, `reivindicacao`, `sessao` e `registro_acesso` (datas e IP), as tabelas do Tutor, do trabalho
do aluno, das execuções e do consumo, `artefato` (título; nunca o conteúdo de artefato aplicado, que tem gabarito),
`entrega`, `atividade_aplicada`, `validacao_do_lote`, `material`, `suspensao_de_funcao` e a `auditoria` em que ele é
autor. **Colunas que nunca entram**, em nenhuma versão (`COLUNAS_FORA_DO_ARQUIVO`): todo hash de senha, de token e de
cookie, o segredo do segundo fator, os códigos de recuperação, `chave_envio`, `chave_objeto` e o `sub` da conta
externa.

**Migrations de expansão**, uma por tarefa a partir da 0024, na ordem do `tasks.md` (o bloco abaixo é o conjunto):

```
retencao_escola     escola_id*, categoria* (PK), meses*, referencia_contrato* (inteiro > 0: o número do contrato, tarefa 2.0),
                    alterada_em*, alterada_por*
pedido_titular      id uuid, escola_id*, titular_id* (sem FK; gatilho confere na inserção, e escola_id e titular_id
                    imutáveis), papel_titular*, tipo*, solicitante* (titular|responsavel_legal), chegou_em* (date,
                    não futura), estado* (recebido|em_preparacao|pronto|agendado|concluido|cancelado), eliminar_em?,
                    eliminacao_enfileirada_em?, compartilhamento* jsonb, nome_trocado?, homonimo?, registrado_por*,
                    registrado_em*, concluido_*?, cancelado_*?, chave_envio*
arquivo_titular     id uuid, escola_id*, pedido_id*, versao* (completa|coordenacao), chave_objeto*, bytes*, pronto_em*,
                    expira_em*, apagado_em?
suboperador         id uuid, chave*, nome*, finalidade*, categorias*, pais*, contrato*, veda_treinamento*,
                    alcance* (todas|lista), inicio*, fim?, registrado_por*   (chave única onde fim is null; tarefa 8.0: a
                    chave tem o formato do `IA_PROVEDOR_ID`, `categorias` é a lista fechada de oito de `@educa/shared`, `pais`
                    é o código ISO de duas letras, `contrato` é um código curto e nunca texto)
suboperador_escola  suboperador_id*, escola_id*, inicio*, fim?   (tarefa 8.0: chave primária `(escola_id, suboperador_id)`,
                    índice por `suboperador_id`)
incidente           id uuid, conhecido_em*, registrado_por*, registrado_em*   (tarefa 9.0: `conhecido_em <= registrado_em`;
                    `registrado_por` é o apelido do operador; sem `escola_id`)
incidente_escola    incidente_id*, escola_id*, circunstancias* (≤1000), categorias* (lista fechada),
                    titulares_estimados*, risco* (baixo|relevante|alto), contencao* (≤1000), correcao* (≤1000),
                    avisado_em*, confirmado_em?, confirmado_por?   (tarefa 9.0, migration 0031: `id uuid` próprio, o que a escola
                    vê e confirma, e único `(escola_id, incidente_id)`; `incidente_id` com `on delete cascade`; `confirmado_por` por FK
                    composta com a escola, `on delete set null ("confirmado_por")`, e só existe com `confirmado_em`; 0 a 100 milhões
                    de titulares; os três textos de 1 a 1.000 caracteres; `avisado_em` é o `now()` do registro)
expurgo_execucao    id uuid, escola_id*, categoria*, linhas*, concluida* (`true` só quando a categoria terminou; `false` quando parou pela janela), em*
execucao_agente     + anonimizada_em?
usuario             + eliminacao_agendada_em?
escola              + criada_em*  (correção da 8.0: `default now()`; nas que já existem, o `em` da auditoria
                    `escola.criada`. Seção 6, "A vigência nunca é anterior à escola")
consumo_ia          + provedor?  check (provedor is null or envio_externo), que o código anterior cumpre
job_registro        + chave_idempotencia?  único parcial (escola_id, tipo, chave_idempotencia) onde não nula e o
                    estado não é concluido nem falhou; check (chave_idempotencia is null or escola_id is not null)
arquivo_titular     único (escola_id, pedido_id, versao)
auditoria           tarefa 8.0: `auditoria_escola_ou_operacao_global` no lugar de `auditoria_escola_ou_rede_pelo_operador`:
                    sem escola, além da rede criada, só o `suboperador` cadastrado ou encerrado, sempre por operador (migration
                    0029, mais larga que o check anterior, então compatível com o código anterior).
auditoria           check: `autor_operador = 'rotina'` só com `usuario.eliminado`, `acesso_turma.revogado`,
                    `titular.nome_trocado` e `pedido.concluido` (NOT VALID, depois VALIDATE). O apelido `rotina` fica
                    reservado na criação de operador
```

**`consumo_ia.provedor`.**
- `IA_PROVEDOR_ID` entra no `esquemaAmbienteDeIa`, com formato `^[a-z][a-z0-9_-]{1,39}$`, e é obrigatória com
  `openai_compat` sem processamento local. Sem ela, a subida é recusada.
- A porta tipa os dois juntos, `{ envioExterno: true; provedorId: string } | { envioExterno: false; provedorId: null }`,
  e o valor passa por `MedicaoDaGeracao`, `ConsumoDeIa` e `ConsumoRepository`. A reserva futura terá o próprio id. A
  `suboperador.chave` tem o mesmo formato.
- Vazio, falso, local e `regra_fixa` gravam nulo. A gravação do consumo nunca falha por causa dessa coluna.
- Tarefa 7.0, como ficou no código:
  - o par é `EnvioDaChamada` (`ia/porta.ts`), e `MedicaoDaGeracao` e `ConsumoDeIa` passaram a ser o tipo de dados
    **intersectado** com ele (uma interface não estende união). O adaptador deixou de ter `envioExterno` e passou a ter
    `envio: EnvioDaChamada`, porque uma classe não implementa união: o `ProvedorDeIa` espalha `adaptador.envio` na medição
    quando alguma chamada saiu (`tentativas > 0`) e `SEM_ENVIO_EXTERNO` quando não saiu, e é só isso que deixa a regra
    fixa (zero tentativas) e a falha antes da chamada sem provedor;
  - `ConfiguracaoDoModelo.provedorId` é opcional no tipo, porque a obrigação mora no esquema da subida; o construtor do
    `AdaptadorOpenAICompat` repete a exigência (`ConfiguracaoInvalida(['IA_PROVEDOR_ID'])`) para quem monta a configuração
    à mão. Com `LLM_PROCESSAMENTO_LOCAL=true` o id é dispensado e, se vier, o adaptador o ignora;
  - o fixture `AdaptadorRoteirizado` externo leva o id `provedor-roteirizado` (`PROVEDOR_ROTEIRIZADO`);
  - a migration é a `0028_consumo_ia_provedor`: a coluna e o check, validado na própria migration (toda linha existente
    tem `provedor` nulo; ainda não há staging). O `compose.yml` passa `IA_PROVEDOR_ID` às APIs como valor obrigatório (`${IA_PROVEDOR_ID:?…}`; o padrão vazio `:-` é proibido por `tools/ci/ambiente.test.ts`); o `.env.example` traz o placeholder `provedor-de-exemplo`, que a subida recusa fora de `AMBIENTE=local` quando há envio externo.
- **A contração fica fora do F3.** O `migrar` aplica toda migration pendente antes de as instâncias subirem, então um
  check que exige `provedor` no mesmo release quebraria o rollback. A exigência vai numa migration de um release
  **posterior** ao que leva o código do F3: o check `not envio_externo or provedor is not null or em < '<corte>'`, em
  arquivo próprio, `NOT VALID` e depois `VALIDATE`. O `<corte>` é o instante, tirado do registro do deploy, a partir do
  qual todas as instâncias rodam o código do F3. O runbook diz, num comando, que voltar o código para antes do F3 com
  essa contração aplicada exige antes o `drop constraint` dela. Até lá, quem garante é o tipo da porta. A contração
  entra no `TODO.md` quando o Joaquim propagar o recorte.

## 4. API

O escopo é a escola do token. `/v1/privacidade/*` é da coordenação, com MFA; `/v1/meus-dados` é do aluno e do
professor.

| Rota | Detalhe |
|---|---|
| `GET retencao` | categorias e prazos fixos: descrição comum, de quando conta, meses (o efetivo, com a trava), origem (`padrao` ou `ajustada`) e a categoria que a encurtou, se houver; sem quem ajustou nem o contrato |
| `GET suboperadores` | pelo `SuboperadorDaEscolaRepository` (seção 6); nome, finalidade, país, categorias, veda treinamento, vigência |
| `GET incidentes` · `POST incidentes/:id/confirmar` | DTO só da linha da escola: `id` (o da seção, tarefa 9.0), `conhecidoEm`, `circunstancias`, `categorias`, `titularesEstimados`, `risco`, `contencao`, `correcao`, `avisadoEm`, `confirmadoEm` e o texto fixo do prazo legal da escola; confirmar é `update … where confirmado_em is null`, 204 |
| `POST titulares/busca` | `{ termo }` com 3 letras ou mais; até 20 resultados: id, nome, papel, matrícula, turma do ano (aluno) ou disciplinas e turmas desta escola (professor), estado. Audita `titular.buscado` com os ids e a finalidade fixa, nunca o termo |
| `GET titulares/:id/previa` | aluno: contagem por categoria e `homonimo` (a mesma regra da troca de nome). Professor: só as categorias de cadastro e vínculo; as de uso da IA não aparecem, e a resposta é igual para quem usou e quem não usou (D64). Sem compartilhamento. Audita `titular.previa_lida` |
| `POST pedidos` | `titularId`, `tipo`, `solicitante`, `chegouEm`, `chaveEnvio` |
| `GET pedidos` · `GET pedidos/:id` | página de 50; nome e turma enquanto o titular existe, "Titular eliminado" depois. A lista audita `pedidos.listados` com os ids da página; o detalhe traz o compartilhamento salvo, `nomeTrocado` e `homonimo`, e audita `pedido.lido`. Finalidade fixa nas duas |
| `POST pedidos/:id/cancelar` · `concluir` · `corrigir-nome` | cancelar só `agendado`; concluir acesso, portabilidade, compartilhamento e correção; corrigir nome com `{ nome }` (1 a 200 caracteres, erro tipado) só em pedido de correção `recebido` ou `pronto`, auditado com ids; o arquivo já gerado não é refeito |
| `POST pedidos/:id/arquivo` | `{ finalidade }`: URL de 5 min da versão `coordenacao`, auditada (`titular.arquivo_baixado`); resposta com `no-store` |
| `GET /v1/meus-dados` · `POST …/:id/baixar` | os pedidos do próprio usuário nesta escola, com estado, contagem por categoria e validade do arquivo; URL de 5 min |

- **Mesmo que inexistente** (`NAO_ENCONTRADO`): titular, pedido, arquivo e incidente de outra escola ou de outra
  pessoa, a versão `coordenacao` quando ela não existe, e o pedido sobre si mesmo (mesma `conta_id`, não só o mesmo
  id). O corpo e o status são os do id inexistente.
- **Conta ativa** é por escola: um usuário desta escola sem `desativado_em` nem `eliminacao_agendada_em`.
- **Aluno só na lista de nomes.** A busca não o acha, e a tela de Privacidade explica o caminho da A1. O acesso é a
  leitura auditada da lista (`turma.lista_lida`). A correção é retirar o nome livre e acrescentar de novo. Com
  reivindicação pendente, a coordenação primeiro a decide (`decidida_como = coordenacao`) e depois retira. Nada disso
  é código novo.
- **Login suspenso.** O `ACESSO_SUSPENSO` só sai depois de a credencial ser conferida (senha certa, ou token válido da
  conta Google ou Microsoft), pelo mesmo caminho de tempo e de contador. Com senha errada, a resposta é igual à da
  matrícula inexistente. No login por e-mail e no seletor, a escola com eliminação agendada não aparece.

## 5. Fluxo

**Expurgo.**
- `sistema.expurgar-dado-pessoal` roda à 1h, na fila de lote, e lista as escolas.
- No contexto de cada escola, ele grava um `retencao.expurgar-escola` não urgente pelo `Enfileirador`, que passa a
  aceitar `chaveIdempotencia` (`on conflict` com o predicado do índice parcial, `do nothing`; na colisão, devolve o id
  do job que já existe, ou nulo se ele terminou nesse intervalo, e quem chama trata os dois como "já enfileirado"), com
  a chave "escola + data local". Um segundo job depois de o primeiro terminar é inofensivo, porque o expurgo é idempotente.
  Rodar duas vezes na mesma
  noite não cria dois jobs.
- O job da escola, primeiro:
  - num `update … set eliminacao_enfileirada_em = now() where estado = 'agendado' and eliminar_em <= now() and
    (eliminacao_enfileirada_em is null or eliminacao_enfileirada_em < now() - interval '20 hours') returning id`,
    enfileira um `titular.eliminar` por pedido, na mesma transação;
  - remove do storage os objetos dos `arquivo_titular` vencidos ou com `apagado_em`, e só então a linha.
- Depois percorre as categorias com o prazo efetivo, em lotes de 5.000 (`for update skip locked`, ou `for no key update
  skip locked` nas de anonimização, uma transação por lote), e grava `expurgo_execucao`. **A cada lote** confere a janela
  letiva: se ela abriu, para; o resto sai na noite seguinte, que começa pela categoria que ficou pendente; o alerta de
  duas noites pega a repetição.
- Tarefa 3.0, como ficou no código:
  - a categoria pendente é a da última linha de `expurgo_execucao` da escola (por `em`, e pelo id no empate), se ela ficou
    `false`; a noite começa por ela e dá a volta no catálogo (`ordemDaNoite`), então toda noite completa tem uma linha
    `true` de cada categoria;
  - `em` é o relógio do job, e o corte é contado de um `agora` lido no começo; a janela, do relógio a cada lote, com o
    horário letivo da escola (`configuracao_operacional_escola`, ou o padrão `JANELA_LETIVA_*`, que o worker-lote passa a
    ler, como o despachante);
  - a `thread_agente` vazia sai **só se foi criada antes do corte**: a thread que o professor acabou de abrir, ainda sem
    mensagem, fica. Sai em duas instruções numa transação (trava as candidatas com `skip locked` e reconfere que estão
    vazias antes do delete), para uma mensagem confirmada entre a visão da primeira instrução e a trava não sair em
    cascata; `linhas` da conversa do professor soma as mensagens e as threads;
  - o `Enfileirador.enfileirarUmaVez` devolve `{ situacao: 'enfileirado', id }` ou `{ situacao: 'ja_enfileirado', id }`, com
    `id` nulo quando o job da chave terminou entre a colisão e a leitura: é o "id ou nulo" desta seção, com o "já
    enfileirado" dito no tipo;
  - o log leva a categoria sob `tipo` (a guarda de log não aceita `categoria` como chave operacional) e só contagens.
- Tarefa 4.0, como ficou no código:
  - as quatro categorias de anonimização entram em `CATEGORIAS_DO_EXPURGO` depois das três que apagam, na ordem do
    catálogo, e o método do lote passa a se chamar `expurgarLote(alvo, prazo, limite)`, com `prazo = { agora, meses,
    fuso }` (apaga ou anonimiza, como o alvo diz). Os alvos são `execucao_agente`, `consumo_ia_texto`,
    `consumo_ia_aluno`, `execucao_agente_do_tutor` e `artefato_autoria`;
  - o consumo por aluno anonimiza também a execução do Tutor (`execucao_agente_do_tutor`, só `funcao =
    'tutor_com_o_aluno'`, pelo índice parcial dela): o consumo do Tutor aponta para ela, e ela tem o aluno; a contagem da
    categoria soma consumos e execuções (correção exigida pelo `privacy-guardian`). O filtro é a função: hoje o Tutor é a
    única que o aluno pede (o check `execucao_agente_tarefa_da_funcao` só tem `turno_do_tutor` nela); uma função nova pedida
    pelo aluno entra neste filtro e no índice dele. O `resultado` da execução do Tutor anonimizada continua com ids de
    `mensagem_tutor`; isso não traz o aluno de volta só porque a trava `consumo_por_aluno ≤ conversa_tutor` faz a mensagem
    sair antes, e afrouxar a trava exige rever isto;
  - cada lote lê só as linhas que ainda têm pessoa (`anonimizada_em is null`, `entrada is not null or saida is not null`,
    `aluno_id is not null`, `criado_por is not null`), pelo índice parcial da 0026, e trava com **`for no key update skip
    locked`**, e não `for update`: o update não muda coluna de índice único, então a conferência de FK de quem grava uma
    mensagem, um consumo ou uma entrega apontando para a linha não segura o lote, nem o lote a pula;
  - `anonimizada_em` recebe o `agora` do job, como o `em` de `expurgo_execucao`;
  - na autoria, sai o artefato cujo ano está `encerrado` e cujo `fim`, somado o prazo, é anterior ao dia de `agora` no
    fuso da escola (o do horário letivo, que o job passa ao lote em `PrazoDoLote`; o dia de UTC já virou às 21h de São
    Paulo, e o job segurado pela janela pode rodar a essa hora); o lote trava só o artefato (`of a`); sem `order by`,
    porque a idade é a do ano;
  - são **sete** as FKs que apontam para `execucao_agente` (a 0023 trocou as de seis tabelas pela versão com o ano, e a de
    `consumo_ia` ficou sem ano), e não oito: o teste lê a lista de `pg_constraint`.
- Tarefa 5.0, como ficou no código:
  - com ela, `CATEGORIAS_DO_EXPURGO` é o catálogo inteiro (as doze, na ordem de `CHAVES_DE_RETENCAO`) e a lista de pendentes de
    tarefa deixa de existir: o teste de unidade confere a igualdade. Os alvos novos são `tentativa_atividade`,
    `reivindicacao`, `material`, `vinculo` e `usuario`;
  - **trabalho do aluno:** apaga a `tentativa_atividade` do ano `encerrado` cujo `fim`, somado o prazo, é anterior ao dia de
    `agora` no fuso da escola, com a mesma regra da autoria (`ANO_ENCERRADO_ALEM_DO_PRAZO`, um fragmento só para os dois).
    Trava só a tentativa (`for update of t skip locked`); a resposta e a correção saem em cascata, e a atividade aplicada e o
    lote de correção ficam. O lote de 5.000 tentativas com 20 respostas e a correção cada (100.000 respostas) levou 78 ms no
    compose de teste, contra os 2 s do `statement_timeout`: o lote fica no tamanho do job;
  - **reivindicação:** apaga a que não está `pendente`, contada de `coalesce(decidida_em, solicitada_em)`, porque o
    `encerrada` que a virada do ano gera não tem decisão. Qualquer decisor conta; o `pendente` nunca sai;
  - **material:** apaga o `excluido_em` além do prazo que nenhuma `mensagem_tutor` nem `sinal_tutor` cita (as duas FKs para o
    material não têm ação, e a conversa pode viver mais que o material: piso do material 12 meses, teto da conversa 24). O
    material citado sai na noite em que a conversa sai, porque a conversa vem antes na ordem do catálogo. Os trechos saem em
    cascata;
  - **vínculo:** apaga o `encerrado` além do prazo, contado de `encerrado_em`;
  - **pessoa desativada:** o lote escolhe até `LOTE_MAXIMO_DO_ALVO.usuario` (100) ids, do mais antigo, e chama
    `CicloDeVidaService.eliminar` com `autorOperador: AUTOR_DA_ROTINA` (`'rotina'`, em `packages/shared`), uma pessoa por vez,
    cada uma na transação que o repositório do expurgo abre, trava e reconfere o prazo, e que o `eliminar` reutiliza (a
    transação é por pessoa, como diz a seção 5, e não do lote inteiro). O `NAO_ENCONTRADO` de quem sumiu entre a escolha e a
    trava, ou que voltou a ser ativa (convite aceito) nesse intervalo, é pulado sem auditoria e fora da contagem; qualquer outro erro sobe e grava a categoria `false`. O
    lote diz `cheio` pelo número de escolhidos. A pessoa com pedido `agendado` é pulada na tarefa 14.0;
  - **`expurgo_execucao`:** depois das categorias, `expurgarRegistroDoExpurgo` apaga em lotes as linhas com mais de 5 anos (60
    meses de `agora`), sem linha própria nem categoria, e confere a janela letiva a cada lote; o log leva
    `registroApagadoTotal`;
  - **migration 0027:** só índices, nove: um por alvo de data (`reivindicacao` pela expressão acima, `material`,
    `usuario`, `vinculo`), `tentativa_atividade (escola_id, aluno_id)`, `(escola_id, material_id)` em `mensagem_tutor` e
    `sinal_tutor`, e os dois do `set null` da pessoa eliminada, `execucao_agente (escola_id, solicitada_por)` e
    `artefato (escola_id, criado_por)`. O trabalho do aluno desce pelo ano letivo, que a chave única da tentativa já cobre.
- O `incidente` com mais de 5 anos é alvo do `sistema.expurgar-acesso`.

**Arquivo.**
- O pedido nasce `em_preparacao`, com o compartilhamento salvo, e enfileira `titular.montar-arquivo` (normal). O job
  leva só ids, e o nome é lido dentro dele.
- O job grava `titular/<escola>/<pedido>/<versao>.json`. A versão `coordenacao` só existe quando o titular não tem
  conta ativa nesta escola.
- A versão `coordenacao` nunca traz:
  - `thread_agente` e `mensagem_agente`;
  - a `entrada` das execuções que o titular pediu;
  - a `entrada` e a `saida` do consumo dessas execuções;
  - `entrega.justificativa`.

  Ela traz a conversa do Tutor, pela exceção do PRD, seção 6.
- **Nas duas versões**, a correção de lote não aprovado sai só como "em validação pelo professor" ou "rejeitada pelo
  professor", sem acertos nem diagnóstico (regra 70, item 3).
- O único `(escola_id, pedido_id, versao)` com `on conflict do update`, e a passagem condicional `em_preparacao →
  pronto`, tornam dois jobs do mesmo pedido inofensivos; a mesma chave do objeto sobrescreve o órfão.
- A URL é assinada com `response-cache-control=no-store` e `content-disposition=attachment`, com o nome
  `meus-dados-AAAA-MM-DD.json`, e as respostas de `arquivo` e `baixar` levam `Cache-Control: no-store`.

**Compartilhamento** (foto no pedido, sem pessoa: `{ suboperadorId | null, chave, primeiroEm, ultimoEm, origem }`).
É gravado no registro e refeito no início da etapa 3 da eliminação, antes de anonimizar e de eliminar. Todo
suboperador sai do `SuboperadorDaEscolaRepository`: nada de outra escola entra.
- **Aluno:** o rastro, por `consumo_ia.aluno_id` e pela execução que ele pediu, com envio externo, agrupado por
  `provedor` e casado com a `chave` vigente no período. Um provedor que não casa com suboperador da escola aparece como
  "provedor não cadastrado". As linhas antigas sem `provedor` e o período anterior ao prazo (rastro expirado) somam os
  suboperadores de IA da escola vigentes no período, com `origem = periodo` e o rótulo "a escola usava X enquanto você
  estava nela".
- **Professor:** **só por período** (os suboperadores de IA da escola vigentes durante o vínculo), na foto e no
  detalhe; a prévia não traz compartilhamento. As datas reais de uso saem só na versão `completa`, que ele mesmo baixa (D64).
- A hospedagem aparece sempre.
- **O período é o do titular na escola, nunca o da empresa** (triagem de 09/10/2026, lacuna que a 8.0 deixou). Ele
  começa na entrada do titular: no aluno, a mais antiga entre `credencial_matricula.criada_em` e
  `conta_externa.ligada_em` dele (a aprovação da reivindicação cria a credencial; `usuario` não tem data de criação); no
  professor, é o do vínculo, como acima. Com `origem = periodo`, `primeiroEm` e `ultimoEm` são a **interseção** da
  vigência do suboperador para a escola com esse período, e a interseção vazia não entra na foto. No rastro, a `chave`
  casa com o suboperador vigente na data da chamada (`consumo_ia.em`), não com o de hoje. Por isso o `todas` encerrado
  antes de a escola existir, ou antes de o titular entrar, não aparece, e nenhuma data da foto é anterior à entrada
  dele: o `inicio` e o `fim` que o `SuboperadorDaEscolaRepository` devolve nunca vão direto para a foto. O aluno sem
  nenhuma das duas datas não tem período anterior ao rastro.

**Eliminação.**
- **Registro.** O `POST` faz `insert … on conflict (escola_id, chave_envio) do nothing`; se nada voltar, devolve o
  pedido daquela chave. A mesma chave é sempre o mesmo pedido, de qualquer tipo. Uma chave diferente para um titular
  já `agendado` cai no único parcial e responde `PEDIDO_EM_ESTADO_INVALIDO`.
- Na mesma transação: `eliminar_em = now() + 7 dias`, `usuario.eliminacao_agendada_em`, as sessões encerradas
  (`eliminacao_agendada`) e a auditoria.
- **Cancelar.** `update … where estado = 'agendado' and eliminar_em > now() and eliminacao_enfileirada_em is null`,
  e na mesma transação, com a trava pedido → usuário, `usuario.eliminacao_agendada_em` volta a nulo. Sem linha, responde
  `PEDIDO_EM_ESTADO_INVALIDO`. O relógio é sempre o `now()` do banco.
- **`titular.eliminar`, na fila de lote:**
  1. **Confere.** O pedido está `agendado` e com `eliminar_em <= now()`; senão, termina sem fazer nada.
  2. **Troca de nome.** Só se o titular é aluno e não há homônimo ativo nem nome livre igual na lista. Para cada coluna
     da lista (`execucao_agente.entrada`, `consumo_ia.entrada` e `saida`, `artefato.titulo` e `conteudo`,
     `mensagem_agente.conteudo`, `entrega.justificativa`), percorre faixas de 1.000 linhas **examinadas** num índice
     `(escola_id, id)` parcial de texto não nulo, e troca o nome por `[nome removido]`, sem caixa e com fronteira de palavra. O nome é escapado
     para JSON e para regex, e o resultado tem de ser JSON válido, senão o lote falha inteiro. Cada linha alterada de
     artefato, entrega, execução e consumo grava `titular.nome_trocado` com a tabela, o id e o pedido, na mesma
     transação da faixa, a partir do `returning`. O nome procurado é o atual: o nome anterior a uma correção não é
     procurado (seção 13). **Entre as faixas, confere a janela letiva:** se ela abriu, o job termina sem rodar a etapa
     3, o pedido continua `agendado`, e o reenfileiramento da noite seguinte retoma a troca do começo (o que já foi
     trocado não casa mais) e elimina.
  3. **Transação**, com a ordem de travas pedido → usuário: `select … for update` do pedido (fora de `agendado`,
     termina sem efeito); refaz o compartilhamento; anonimiza as execuções do titular e o texto do consumo delas; roda
     `CicloDeVidaService.eliminar`, que passa a aceitar a transação de quem chama; marca `apagado_em` nos arquivos
     dele; conclui o pedido. Autor: quem registrou, se ainda é usuário ativo da escola (o gatilho da auditoria
     exige); senão, `rotina`. Uma execução `pendente` de quem tem eliminação agendada já perdeu a sessão; a varredura
     do executor a encerra.
- Os objetos saem do storage na noite seguinte, pelo `apagado_em`.

**Incidente.**
- `ops:incidente registrar` lê um arquivo com uma seção por escola e grava as ligações no contexto de cada escola.
- O comando recusa texto que cite o nome ou o id de outra escola afetada.
- A casca da coordenação lê os pendentes uma vez por sessão.
- **Tarefa 9.0, como ficou no código.** O arquivo é um JSON `{ conhecidoEm, escolas: [{ escola, circunstancias, categorias, titularesEstimados, risco, contencao, correcao }] }`,
  de até 256 KB, 200 escolas e 1.000 caracteres por texto, conferido antes de abrir o banco (o erro cita o caminho do campo, nunca o
  valor). A transação começa pelo autor, lê o nome de cada escola no contexto dela (inexistente: `NAO_ENCONTRADO`, e desfaz tudo),
  confere os textos e só então grava o incidente, uma seção por escola no contexto dela e `incidente.registrado` na auditoria
  dela. O texto de uma seção cita outra escola afetada quando contém o **nome inteiro** dela (sem caixa nem acento, entre
  fronteiras de palavra, depois de tirar o nome da própria escola do texto) ou o **id** dela (com ou sem hífen); é erro de argumento
  (código 2), com a posição da seção. `conhecidoEm` não pode ser futuro. Confirmar é `update … where confirmado_em is null`: a
  chamada que confirma audita `incidente.confirmado`; a que chega depois responde 204 igual, sem segunda linha; o id que não é da
  escola, o inexistente e o que nem é UUID respondem o mesmo `NAO_ENCONTRADO`. A resposta de `GET incidentes` traz o `id` da seção
  (não o do incidente, que as escolas dividem), os sem confirmação primeiro e até 50.

## 6. Isolamento (obrigatório)

Todo repository novo tira a escola do contexto. O job da escola roda com a escola do `job_registro`.

**Consultas sem escopo** (regra 10, item 9), cada uma com docblock e no teste de arquitetura:

| Repository.método | O que faz | Justificativa |
|---|---|---|
| `EscolasDaRotinaRepository.listarIds` | ids das escolas, nada mais | a rotina noturna precisa abrir o contexto de cada escola; é infraestrutura de rotina, não de retenção. Na tarefa 3.0, a medição do alerta de duas noites, no worker-lote, usa a mesma lista para abrir o contexto de cada escola e ler as noites dela pelo `ExpurgoDaEscolaRepository`, com escopo; o teste de arquitetura lista quem a usa (só o worker-lote) |
| `ContaGlobalRepository.travarConta`, `limparContaSemUso`, `encerrarSessoesDaConta` | os três da conta global, **movidos** de `ResolucaoDeTenantRepository` (o terceiro na tarefa 1.0: o `limparContaSemUso` o chama, e a redefinição do MFA, no `sessao`, também) | a conta é global por desenho; a exceção da `Conta` em `modelo-de-dados.md` passa a dizer "só `sessao` e `nucleo/ciclo-de-vida`" (e o expurgo de acesso, que já a limpava), e o `arquitetura.test.ts` passa a aceitar os dois caminhos |
| `OperacaoPrivacidadeRepository` (escrever `suboperador` e `incidente`, contagens por escola) | comandos da operação | mesma justificativa do painel; só ids, números e as tabelas da operação |
| `ExpurgoDeAcessoRepository.apagarLoteVencido('incidente')` | incidente com mais de 5 anos do `registrado_em`, e a cascata das ligações | a justificativa do método passa a citar o incidente (tarefa 9.0) |

Os comandos `ops:retencao`, `ops:suboperador` e `ops:incidente` abrem o contexto de cada escola antes de escrever a
ligação ou o ajuste. `suboperador` e `incidente` entram em `TABELAS_DA_OPERACAO`. A escola as lê só por dois
repositórios de leitura no `nucleo` (a API e o worker os usam), que entram em `QUEM_PODE_TOCAR_A_OPERACAO` como
só-leitura:
- `SuboperadorDaEscolaRepository`: `where (alcance = 'todas' or exists (ligação com escola_id = contexto))`, com os
  parênteses;
- `IncidenteDaEscolaRepository`: só por junção com `incidente_escola.escola_id = contexto`. **Tarefa 9.0:** ele não é só de leitura (a
  confirmação é um `update` da `incidente_escola` no escopo da escola, pois a tabela tem `escola_id`); o que ele nunca faz é escrever
  em `incidente`, e nenhum método dele é `@SemEscopo`. O `OperacaoPrivacidadeRepository` ganha `registrarIncidente` e
  `ligarEscolaAoIncidente`, e o teste de arquitetura tem um grupo próprio (escritor, leitor da escola e expurgo).

A `ContaGlobalRepository` não sai pelo barrel do `@educa/nucleo` nem pelo subcaminho do ciclo de vida, só pelo
`@educa/nucleo/conta-global`, e o teste lista quem a importa: o `CicloDeVidaService` e o `sessao` (a redefinição do MFA), e os testes deles. A justificativa do `EscolasDaRotinaRepository` é o papel da rotina, registrada em `modelo-de-dados.md`.

Tarefa 8.0, como ficou no código:
- `OperacaoPrivacidadeRepository` (`apps/api/src/ops/operacao-privacidade.repository.ts`): `cadastrar`, `ligarEscola`, `travarVigente`,
  `encerrar` e `encerrarLigacoes`. Só o último é `@SemEscopo` (fecha as ligações de um suboperador em todas as escolas, por id); as
  demais ou tocam só `suboperador`, que não tem escola, ou escrevem a ligação no contexto da escola que o comando abriu.
  `cadastrar` é `insert … on conflict do nothing`, sem alvo nem predicado: o único índice único além da chave primária é o
  parcial da chave vigente (`fim is null`), então o alvo era redundante. Dois cadastros da mesma chave não dão erro cru:
  o segundo não insere e o comando responde `CONFLITO`. Risco aceito: um índice único novo em `suboperador` passa a ser
  engolido do mesmo jeito e respondido como `CONFLITO`; quem criar o índice troca por um alvo explícito.
- **As duas tabelas ficam num grupo à parte no teste de arquitetura**, e não dentro das seis do operador (`TABELAS_DA_OPERACAO`): os
  testes das seis afirmam que só o `OperadorRepository` e o expurgo as tocam e que o `OperadorRepository` não toca outra. O
  grupo do suboperador tem a lista fechada `OperacaoPrivacidadeRepository` (escreve) e `SuboperadorDaEscolaRepository` (lê, sem
  nenhum `insert`, `update` nem `delete`, conferido sobre o código sem comentário). `suboperador` entra na exceção do item 1 de
  `docs/modelo-de-dados.md`.
- `SuboperadorDaEscolaRepository` (`packages/nucleo/src/titular/`): `(alcance = 'todas' or exists (ligação correlacionada com a
  escola do contexto))`, mais um `left join` com a ligação da escola só para trazer o início e o fim dela. A vigência da escola é o
  início da ligação (ou o do suboperador, em `todas`) e o mais cedo entre os dois `fim`.
- **A vigência nunca é anterior à escola (decisão do Joaquim em 09/10/2026; correção da 8.0).** Como o `todas` não tem
  ligação, a aba mostrava como passada a empresa encerrada antes de a escola existir, e "Desde" com data anterior à
  escola: dizia que recebeu dado da escola quem nunca recebeu. O que vale:
  - **Coluna.** `escola.criada_em timestamptz not null default now()`. Nenhum código a informa nem a altera: o `insert`
    do `RedeEEscolaRepository.criarEscola` não muda, e o valor é o instante da transação que cria a escola, a mesma
    da auditoria `escola.criada`. Não é dado de pessoa e não entra em DTO nenhum.
  - **Migration**, em arquivo próprio, só expande (regra 80, item 9): o código anterior insere sem a coluna e recebe o
    padrão. Depois do `add column`, um `update` preenche as escolas que já existem com o `em` mais antigo da auditoria
    `escola.criada` de cada uma, por subconsulta correlacionada em `auditoria.escola_id = escola.id` (o índice
    `auditoria_escola_em_idx` começa pela escola). A escola sem essa linha fica com o instante da migration: só
    acontece em banco local, porque ainda não há staging nem piloto.
  - **Regra**, no `SuboperadorDaEscolaRepository.daEscola`, na mesma consulta, por junção com a `escola` do contexto
    (`escola.id = contexto`), com a comparação feita no banco, e só para a linha **sem ligação** (alcance `todas`):
    o início é `greatest(suboperador.inicio, escola.criada_em)`, e a linha com `suboperador.fim <= escola.criada_em`
    não é devolvida (o igual também fica fora: não houve um instante em comum). O filtro novo entra no `and` com o
    escopo, que continua entre parênteses.
  - **Com ligação (alcance `lista`) nada muda:** a ligação nasce com `inicio = now()` depois de a escola existir (a
    FK exige a escola), e o `ops:suboperador` não recebe data.
  - **Todo método de leitura que o repositório ganhar** (o da 12.0, com o id e por período) aplica a mesma regra.
  - **Arquitetura.** O leitor passa a ler `escola`, só a do contexto, e continua sem escrever. O teste do leitor
    passa a afirmar que os schemas que o arquivo importa são exatamente `suboperador` e `escola`: o detector de
    hoje não enxerga import por caminho relativo, e sem isso a tabela nova passaria sem ninguém ver.
  - **Não muda:** o DTO, a tela, os textos, o e2e (a fixture só cadastra `lista`), o `OperacaoPrivacidadeRepository` e
    o compartilhamento (seção 5, "O período é o do titular").
  - `docs/modelo-de-dados.md` (a escola e "Os suboperadores") entra na mesma correção. Os cenários e o teste a copiar
    estão em `cenarios.md`, RF7, "Correção da 8.0".
- **Auditoria sem escola.** `suboperador.cadastrado` e `suboperador.encerrado` não têm escola no contexto (o ato é da operação, e a empresa
  pode atender toda escola; uma linha por escola seria uma linha por escola existente a cada cadastro de `todas`). Por isso o check da
  `auditoria` passou a aceitar sem escola, além da rede criada, a entidade `suboperador`, sempre por operador
  (`ENTIDADES_DE_AUDITORIA_SEM_ESCOLA`). A auditoria não aceita texto livre, então leva só o alcance e contagens (`escolas`,
  `ligacoesEncerradas`); a chave, o nome e o contrato ficam na tabela, pelo `entidade_id`.
- `GET /v1/privacidade/suboperadores` é o recurso `privacidade_suboperadores` da matriz (coordenação: unidade; os outros: nunca); o
  DTO é `{ chave, nome, finalidade, pais, categorias, vedaTreinamento, inicio, fim }`, sem id, contrato, operador nem as outras escolas
  da lista. A `chave` vai porque é o que distingue as linhas na tela (a mesma empresa pode ter saído e voltado: a chave mais o início).

Os testes, cada um quebrando sem a cláusula de escopo, estão em `cenarios.md`, seção "Isolamento".

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | todos os do mapa, para ler, apagar, anonimizar, trocar nome e corrigir nome |
| Novos campos | `pedido_titular`, `arquivo_titular`, `incidente_escola.confirmado_por`, `usuario.eliminacao_agendada_em`, `consumo_ia.provedor`, e o apelido do operador em `retencao_escola`, `suboperador` e `incidente`: no mapa **na tarefa da migration** |
| O que vai para log | ids, categoria, contagens, estado. Nunca nome, termo, conteúdo, URL. Os jobs levam só ids |
| O que entra em auditoria | sempre com finalidade fixa: `titular.buscado`, `titular.previa_lida`, `pedidos.listados`, `pedido.lido`, pedido registrado, agendado, cancelado, concluído, nome corrigido, `titular.nome_trocado`, `titular.arquivo_baixado`, `usuario.eliminado`; na operação: `retencao.ajustada` (entidade `retencao_escola`, id da escola, o prazo anterior e a origem dele, a categoria, os meses e o número do contrato; finalidade `contrato_da_escola`), `suboperador.cadastrado` e `encerrado` (sem escola, só o alcance e contagens: tarefa 8.0), `incidente.registrado`; e `incidente.confirmado` |
| Enviado a provedor externo | nada |
| Retenção e expurgo | seção 3 |
| Autorização por objeto | seção 4 |
| DTO de saída | explícito por rota; nenhum traz `chave_objeto` |

## 7b. Conformidade CNE

Não há IA no caminho. O que a funcionalidade preserva:
- **Regra 70, itens 8 e 9; D64.** A versão da coordenação não traz nada do que o professor escreveu ao Assistente.
  Em tudo o que a coordenação vê, fora da versão `coordenacao` de professor sem conta ativa, a resposta é a mesma para
  o professor que usou a IA e para o que não usou. O registro de uso dele só vai na versão da coordenação quando ele não tem conta ativa, por exceção declarada no
  PRD.
- **Regra 70, itens 3 e 6.** Correção não aprovada não chega ao aluno pelo arquivo. A entrega, a validação e a
  execução anonimizada ficam com os ids. A troca de nome em saída aprovada fica registrada por linha.

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | só a guarda, que lê uma coluna a mais da linha que já lê |
| Carga na manhã de segunda | nenhuma: lote não urgente, que para no lote em que a janela abre e termina na noite seguinte |
| Fila e prioridade | expurgo e eliminação no lote; arquivo na normal |
| Limite por escola | vaga do F0 (lote 2); lote de 5.000; faixa de 1.000 na troca de nome; `statement_timeout` de 2 s |
| Rate limit | balde do F0; `rl:busca-titular` com 30 por minuto por usuário, que recusa com 429 |
| Corridas de concorrência | seção 5: a chave de envio decide primeiro; a chave de idempotência "escola + data local"; o único parcial de `agendado`; cancelar contra enfileirar por `eliminacao_enfileirada_em`; dois `ops:retencao ajustar` da mesma escola em fila pela trava `for no key update` da escola (tarefa 2.0); travas pedido → usuário; `skip locked` no expurgo; confirmação do incidente por `where confirmado_em is null`. Cada uma com um cenário em paralelo em `cenarios.md` |
| Índices novos | por titular, parciais `is not null`: `execucao_agente (escola_id, solicitada_por)`, `artefato (escola_id, criado_por)`, `tentativa_atividade (escola_id, aluno_id)` (não existia: a chave única começa pelo ano), e `consumo_ia (escola_id, execucao_id) where execucao_id is not null`; e, para as FKs sem ação do material, `mensagem_tutor` e `sinal_tutor (escola_id, material_id)` parciais (tarefa 5.0). De anonimização: `execucao_agente (escola_id, criada_em) where anonimizada_em is null`, e o mesmo com `and funcao = 'tutor_com_o_aluno'` (tarefa 4.0); `consumo_ia (escola_id, em) where entrada is not null or saida is not null`; `consumo_ia (escola_id, em) where aluno_id is not null`; `artefato (escola_id, ano_letivo_id) where criado_por is not null`. De data: `(escola_id, <data>)` em `mensagem_tutor`, `sinal_tutor` e `mensagem_agente`; `reivindicacao` (decididas); `material` (excluídos); `usuario (escola_id, desativado_em)` parcial; `vinculo` (encerrados). Troca de nome: `(escola_id, id)` parcial de texto não nulo em cada coluna da lista. Novas: as de `pedido_titular`, `arquivo_titular (escola_id, expira_em)`, `incidente_escola (escola_id) where confirmado_em is null`. A tarefa da migration entrega o `EXPLAIN` da eliminação (aluno e professor, com volume de Tutor na escola), da prévia e de cada lote |
| Migration | compatível: a 0024 e a 0028 (`consumo_ia_provedor`: a coluna `provedor` e o check que a prende ao envio externo) só expandem, e a exigência de `provedor` vai num release posterior (seção 3). O `migrar` roda numa transação, então `NOT VALID` seguido de `VALIDATE` no mesmo arquivo não alivia a trava: a partir do staging, cada check vai em arquivo próprio. Índice sem `concurrently` enquanto não há staging nem piloto; a partir do staging, `concurrently` fora de transação. Rollback: o código anterior ignora `eliminacao_agendada_em`, e isso fica no runbook |
| Quando cada dependência cai | banco: 503 tipado e nova tentativa; Redis de fila: aceito e despachado depois; storage: "em preparação", e baixar dá `INDISPONIVEL` |
| Métrica e alerta | duas noites seguidas sem todas as categorias da escola com `concluida = true` (tarefa 3.0: `expurgo.noites_incompletas{escola_id}`, de 0 a 2, medida pelo worker-lote a cada 5 min; a noite é o dia local de `em` no fuso da escola, de ontem para trás; a categoria sem linha conta como não concluída; a noite anterior à primeira execução da escola não conta, e a escola que nunca rodou não tem série; a regra dispara com a série em 2 por 1 min, `infra/grafana/alertas/expurgo-noites-incompletas.yaml`; o lote que falha grava a categoria com `concluida = false` antes de o erro subir, para a escola cujo expurgo falha desde a primeira noite também ter série; numa escola a oeste de São Paulo, uma execução que passa da meia-noite local divide as categorias entre dois dias, pendência no `TODO.md`); incidente sem confirmação em 24 h (tarefa 9.0: `incidente.horas_sem_confirmacao{escola_id}`, medida pelo worker-lote a cada 5 min, em horas desde o `conhecido_em` do incidente mais antigo da escola sem confirmação, e só a escola com pendente tem série; a regra `infra/grafana/alertas/incidente-sem-confirmacao.yaml` dispara acima de 24 por 1 min; a base `MedicaoPorEscola` é do laço, da lista de escolas e da exportação, e a medição do expurgo passou a herdar dela); pedido `agendado` mais de 48 h depois de `eliminar_em` (uma interrupção pela janela letiva é esperada e cabe nas 48 h); `em_preparacao` por mais de 2 h. Cada um com parágrafo no runbook e linha no `test:infra` |
| Cenário de teste de carga | o "justiça entre escolas" ganha uma escola expurgando 1 milhão de linhas e trocando nome enquanto outra usa o Tutor |

## 8. Uso de IA

Não se aplica.

## 9. Frontend

**Coordenação.** O item **Privacidade** ("Seus dados e a lei") entra no grupo Conformidade, com a aba no endereço:
- **Pedidos:**
  - "Registrar pedido" abre uma busca disparada por Enter ou botão, com o resultado anunciado por `aria-live` e o 429
    em texto;
  - na lista, cada titular aparece com turma ou vínculos;
  - o diálogo de confirmação mostra nome, papel, turma, tipo, quem pediu, chegada e a prévia. Com `homonimo`, avisa:
    "Há outro aluno com o mesmo nome completo nesta escola. O nome não será trocado nos textos livres." Na eliminação,
    usa a família `perigo` e explica os 7 dias e o que a escola guarda no sistema de gestão;
  - o detalhe tem o prazo ("faltam 4 dias, até 20/10"; vencido com texto e ícone), o compartilhamento, **Concluir**,
    **Cancelar** (com diálogo dizendo que o acesso volta), **Corrigir nome** (no pedido de correção) e **Baixar a
    versão da escola**. Este último é um botão `oficial` com diálogo que diz o que o arquivo contém, que traz a
    conversa do Tutor, que pede a finalidade, que fica registrado, e que o arquivo deve ser entregue ao titular e
    apagado do computador em seguida;
  - **Corrigir nome** mostra o nome atual e o novo antes de confirmar, e aponta para a lista e a turma da A1 quando a
    correção é de turma ou vínculo;
  - "em preparação" atualiza a cada 10 s, até ficar pronto, e para com a aba escondida;
  - a tela avisa que o aluno que nunca reivindicou o nome está na lista da turma.
- **Por quanto tempo guardamos** (retenção).
- **Empresas que recebem dados** (suboperadores).
- **Incidentes.**

**Aviso de incidente.** É um diálogo com todos os campos do DTO, "Confirmo que recebi" e "Ver depois". Com "Ver
depois", fica uma faixa fixa até a confirmação, e o Sair continua alcançável.

**"Meus dados".** Esta fatia cria o item **Privacidade** no rodapé fixo do aluno (`docs/interface.md` 11.1), por
enquanto só com "Meus dados", alcançável também na gaveta a 360 px. O professor o acha no menu da pessoa.
- **Vazio:** "Para receber uma cópia dos seus dados, peça à coordenação da escola."
- **Outros estados:** "Estamos preparando o seu arquivo. Volte em alguns minutos." (atualiza a cada 10 s, como a da
  coordenação) e "O arquivo ficou disponível por 7 dias e foi apagado. Para receber de novo, peça à coordenação."
- **Escola:** a tela diz que mostra só os pedidos da escola ativa.
- **Antes de baixar:** avisa o que o arquivo contém e que, em computador da escola, é preciso apagá-lo depois.

**Login suspenso.** "Seu acesso está suspenso a pedido. Fale com a coordenação da escola."

**Peças da A1.** Tabela que vira lista abaixo de 768 px, diálogos e os quatro estados. O JSON nunca é renderizado.

## 10. Testes

Estão em `cenarios.md`, por RF e por camada: unidade, integração com Postgres real e relógio injetado, E2E em
`chromebook` e `celular` com acessibilidade, `test:infra` dos alertas, isolamento e concorrência em paralelo. As
sentinelas do arquivo e da troca de nome saem da mesma `CLASSIFICACAO_DAS_TABELAS` do teste de arquitetura, então uma
tabela nova entra nelas sozinha.

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa | Documento |
|---|---|---|---|
| 00 | trabalho demorado em fila; ciclo de vida no nucleo | — | — |
| 10 | escopo do contexto | os quatro da seção 6; o único novo é o da rotina | seção 6 |
| 20 | mapa na tarefa da migration; storage privado; auditoria de leitura | a conversa do Tutor na versão da coordenação | PRD, seção 6 |
| 70 | seção 7b | — | — |
| 80 | lote não urgente, vaga por escola, travas no banco | índice sem `concurrently` até o staging | seção 7c |

As regras 40 e 50 são atendidas sem desvio (`cenarios.md`; seção 9).

## 12. Premissas não verificadas

- ⚠️ **NÃO VERIFICADO:** que o SeaweedFS assine a URL de GET com o SDK S3 do worker. Se não assinar, a API serve o
  objeto com `no-store`. A porta tem uma implementação falsa.
- A portabilidade não tem regulamento da ANPD (LGPD, art. 18, V).

## 13. Riscos técnicos

- **Mover o ciclo de vida** quebra importações. É a primeira tarefa, sem mudar comportamento.
- **Troca de nome em `jsonb::text`.** É coberta pelo teste com apóstrofo, acento e metacaractere.
- **Autor `rotina`.** O check restringe as ações em que ele pode aparecer.
- **Lote de `trabalho_do_aluno`** com a cascata pode passar de 2 s. A tarefa mede, e baixa o lote se precisar.
- **Limite conhecido:** a troca de nome procura só o nome atual. O nome anterior a uma correção que tenha ficado em
  texto livre só sai pelo expurgo, no prazo da categoria. A tela de Corrigir nome avisa isso.
- **Realtime:** hoje só o namespace `/sistema`, sem dado de pessoa. O modo sala (F10) derruba o socket da sessão
  encerrada.
