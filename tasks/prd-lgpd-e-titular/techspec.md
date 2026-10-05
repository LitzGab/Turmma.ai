# Tech Spec — LGPD e titular

**PRD:** `tasks/prd-lgpd-e-titular/prd.md`
**Status:** rascunho (rodada 3 da revisão)

> **Teto de 2.000 palavras excedido, com aceite do Joaquim de até ~3.700 (05/10/2026).** São três fatias independentes num documento
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
| `packages/nucleo/src/ciclo-de-vida` | movido de `apps/api/src/sessao` | `CicloDeVidaService`, repositórios e testes; a `ContaGlobalRepository` com os dois `@SemEscopo` da conta (seção 6) |
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
| `consumo_por_aluno` | anula `consumo_ia.aluno_id` | `em` | 12 | 3 | 24 |
| `trabalho_do_aluno` | apaga `tentativa_atividade` (resposta e correção em cascata) | `fim` do ano com `situacao = encerrado` | 12 | 6 | 60 |
| `reivindicacao_decidida` | apaga | decisão | 60 | 12 | 60 |
| `autoria_de_artefato` | anula `artefato.criado_por` | `fim` do ano encerrado | 60 | 12 | 60 |
| `material_excluido` | apaga a linha | `excluido_em` | 60 | 12 | 60 |
| `vinculo_encerrado` | apaga o vínculo encerrado | fim do vínculo | 60 | 12 | 60 |
| `pessoa_desativada` | elimina pelo ciclo de vida; pula quem tem pedido `agendado` | `desativado_em` | 60 | 12 | 60 |

**Travas entre categorias.** O prazo efetivo de `execucao_agente` e de `texto_do_modelo` é o menor entre o deles e o de
`conversa_professor`, e o de `consumo_por_aluno` é o menor entre o dele e o de `conversa_tutor`. Um ajuste que
desrespeite isso dá `RETENCAO_FORA_DO_LIMITE`.

**Classificação de toda tabela** (`CLASSIFICACAO_DAS_TABELAS`), conferida contra as migrations por um teste de
arquitetura:

| Classe | Tabelas |
|---|---|
| categoria acima | as doze linhas acima, mais `resposta_atividade`, `correcao` e `thread_agente` (cascata ou vazio) |
| prazo fixo, com quem aplica | `registro_acesso`, `sessao`, `convite`, `acesso_turma`: `sistema.expurgar-acesso`. `conta`, `codigo_recuperacao`: limpeza da conta (F1). `credencial_matricula`, `conta_externa`: desativação e eliminação. `lista_nome`: virada do ano (A1) e eliminação. `operador`, `convite_operador`, `sessao_operador`, `acesso_operacao`, `codigo_recuperacao_operador`: A0 e `sistema.expurgar-acesso`. `job_registro`: 7 dias (F0). `auditoria`, `auditoria_operacao`, `entrega`, `validacao_do_lote`, `suspensao_de_funcao`, `atividade_aplicada`, `pedido_titular`: vigência + 5 anos, no fim de contrato (F12). `arquivo_titular`: 7 dias. `incidente` e `incidente_escola`: 5 anos. `expurgo_execucao`: 5 anos |
| sem pessoa | `rede`, `escola`, `ano_letivo`, `serie`, `disciplina`, `turma`, `provedor_escola`, `configuracao_operacional_escola`, `uso_infra_diario`, `trecho`, `resumo_do_analista`, `retencao_escola`, `suboperador`, `suboperador_escola` |

Também `usuario` ativo e `material` vigente ficam enquanto existem; saem pela eliminação e pelas duas categorias acima.

Cada tabela da classificação diz se **entra no arquivo do titular** e por qual coluna se liga a ele. Entram: `usuario`,
`credencial_matricula` (só a matrícula), `conta` (só o e-mail, nas duas versões), `conta_externa` (só o provedor),
`vinculo`, `lista_nome`, `reivindicacao`, `sessao` e `registro_acesso` (datas e IP), as tabelas do Tutor, do trabalho
do aluno, das execuções e do consumo, `artefato` (título; nunca o conteúdo de artefato aplicado, que tem gabarito),
`entrega`, `atividade_aplicada`, `validacao_do_lote`, `material`, `suspensao_de_funcao` e a `auditoria` em que ele é
autor. **Colunas que nunca entram**, em nenhuma versão (`COLUNAS_FORA_DO_ARQUIVO`): todo hash de senha, de token e de
cookie, o segredo do segundo fator, os códigos de recuperação, `chave_envio`, `chave_objeto` e o `sub` da conta
externa.

**Migration 0024**, só de expansão:

```
retencao_escola     escola_id*, categoria* (PK), meses*, referencia_contrato* (≤200), alterada_em*, alterada_por*
pedido_titular      id uuid, escola_id*, titular_id* (sem FK; gatilho confere na inserção, e escola_id e titular_id
                    imutáveis), papel_titular*, tipo*, solicitante* (titular|responsavel_legal), chegou_em* (date,
                    não futura), estado* (recebido|em_preparacao|pronto|agendado|concluido|cancelado), eliminar_em?,
                    eliminacao_enfileirada_em?, compartilhamento* jsonb, nome_trocado?, homonimo?, registrado_por*,
                    registrado_em*, concluido_*?, cancelado_*?, chave_envio*
arquivo_titular     id uuid, escola_id*, pedido_id*, versao* (completa|coordenacao), chave_objeto*, bytes*, pronto_em*,
                    expira_em*, apagado_em?
suboperador         id uuid, chave*, nome*, finalidade*, categorias*, pais*, contrato*, veda_treinamento*,
                    alcance* (todas|lista), inicio*, fim?, registrado_por*   (chave única onde fim is null)
suboperador_escola  suboperador_id*, escola_id*, inicio*, fim?
incidente           id uuid, conhecido_em*, registrado_por*, registrado_em*
incidente_escola    incidente_id*, escola_id*, circunstancias* (≤1000), categorias* (lista fechada),
                    titulares_estimados*, risco* (baixo|relevante|alto), contencao* (≤1000), correcao* (≤1000),
                    avisado_em*, confirmado_em?, confirmado_por?
expurgo_execucao    id uuid, escola_id*, categoria*, linhas*, concluida* (a categoria terminou ou parou pela janela), em*
execucao_agente     + anonimizada_em?
usuario             + eliminacao_agendada_em?
consumo_ia          + provedor?  check (provedor is null or envio_externo), que o código anterior cumpre
job_registro        + chave_idempotencia?  único parcial (escola_id, tipo, chave_idempotencia) onde não nula e o
                    estado não é concluido nem falhou; check (chave_idempotencia is null or escola_id is not null)
arquivo_titular     único (escola_id, pedido_id, versao)
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
| `GET retencao` | categorias e prazos fixos: descrição comum, meses, origem |
| `GET suboperadores` | pelo `SuboperadorDaEscolaRepository` (seção 6); nome, finalidade, país, categorias, veda treinamento, vigência |
| `GET incidentes` · `POST incidentes/:id/confirmar` | DTO só da linha da escola: `conhecidoEm`, `circunstancias`, `categorias`, `titularesEstimados`, `risco`, `contencao`, `correcao`, `avisadoEm`, `confirmadoEm` e o texto fixo do prazo legal da escola; confirmar é `update … where confirmado_em is null`, 204 |
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
- Depois percorre as categorias com o prazo efetivo, em lotes de 5.000 (`for update skip locked`, uma transação por
  lote), e grava `expurgo_execucao`. **A cada lote** confere a janela letiva: se ela abriu, para; o resto sai na noite
  seguinte, e o alerta de duas noites pega a repetição.
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

## 6. Isolamento (obrigatório)

Todo repository novo tira a escola do contexto. O job da escola roda com a escola do `job_registro`.

**Consultas sem escopo** (regra 10, item 9), cada uma com docblock e no teste de arquitetura:

| Repository.método | O que faz | Justificativa |
|---|---|---|
| `EscolasDaRotinaRepository.listarIds` | ids das escolas, nada mais | a rotina noturna precisa abrir o contexto de cada escola; é infraestrutura de rotina, não de retenção |
| `ContaGlobalRepository.travarConta`, `limparContaSemUso` | os dois da conta global, **movidos** de `ResolucaoDeTenantRepository` | a conta é global por desenho; a exceção da `Conta` em `modelo-de-dados.md` passa a dizer "só `sessao` e `nucleo/ciclo-de-vida`", e o `arquitetura.test.ts` passa a aceitar os dois caminhos |
| `OperacaoPrivacidadeRepository` (escrever `suboperador` e `incidente`, contagens por escola) | comandos da operação | mesma justificativa do painel; só ids, números e as tabelas da operação |
| `ExpurgoDeAcessoRepository.apagarLoteVencido('incidente')` | incidente com mais de 5 anos, e a cascata das ligações | a justificativa do método passa a citar o incidente |

Os comandos `ops:retencao`, `ops:suboperador` e `ops:incidente` abrem o contexto de cada escola antes de escrever a
ligação ou o ajuste. `suboperador` e `incidente` entram em `TABELAS_DA_OPERACAO`. A escola as lê só por dois
repositórios de leitura no `nucleo` (a API e o worker os usam), que entram em `QUEM_PODE_TOCAR_A_OPERACAO` como
só-leitura:
- `SuboperadorDaEscolaRepository`: `where (alcance = 'todas' or exists (ligação com escola_id = contexto))`, com os
  parênteses;
- `IncidenteDaEscolaRepository`: só por junção com `incidente_escola.escola_id = contexto`.

A `ContaGlobalRepository` não sai pelo barrel do `@educa/nucleo`, e o teste lista quem a importa: o `CicloDeVidaService`
e o `sessao`. A justificativa do `EscolasDaRotinaRepository` é o papel da rotina, registrada em `modelo-de-dados.md`.

Os testes, cada um quebrando sem a cláusula de escopo, estão em `cenarios.md`, seção "Isolamento".

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | todos os do mapa, para ler, apagar, anonimizar, trocar nome e corrigir nome |
| Novos campos | `pedido_titular`, `arquivo_titular`, `incidente_escola.confirmado_por`, `usuario.eliminacao_agendada_em`, `consumo_ia.provedor`, e o apelido do operador em `retencao_escola`, `suboperador` e `incidente`: no mapa **na tarefa da migration** |
| O que vai para log | ids, categoria, contagens, estado. Nunca nome, termo, conteúdo, URL. Os jobs levam só ids |
| O que entra em auditoria | sempre com finalidade fixa: `titular.buscado`, `titular.previa_lida`, `pedidos.listados`, `pedido.lido`, pedido registrado, agendado, cancelado, concluído, nome corrigido, `titular.nome_trocado`, `titular.arquivo_baixado`, `usuario.eliminado`; na operação: `retencao.ajustada`, `suboperador.cadastrado` e `encerrado`, `incidente.registrado`; e `incidente.confirmado` |
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
| Corridas de concorrência | seção 5: a chave de envio decide primeiro; a chave de idempotência "escola + data local"; o único parcial de `agendado`; cancelar contra enfileirar por `eliminacao_enfileirada_em`; travas pedido → usuário; `skip locked` no expurgo; confirmação do incidente por `where confirmado_em is null`. Cada uma com um cenário em paralelo em `cenarios.md` |
| Índices novos | por titular, parciais `is not null`: `execucao_agente (escola_id, solicitada_por)`, `artefato (escola_id, criado_por)`, `tentativa_atividade (escola_id, aluno_id)` se não existir, e `consumo_ia (escola_id, execucao_id) where execucao_id is not null`. De anonimização: `execucao_agente (escola_id, criada_em) where anonimizada_em is null`; `consumo_ia (escola_id, em) where entrada is not null or saida is not null`; `consumo_ia (escola_id, em) where aluno_id is not null`; `artefato (escola_id, ano_letivo_id) where criado_por is not null`. De data: `(escola_id, <data>)` em `mensagem_tutor`, `sinal_tutor` e `mensagem_agente`; `reivindicacao` (decididas); `material` (excluídos); `usuario (escola_id, desativado_em)` parcial; `vinculo` (encerrados). Troca de nome: `(escola_id, id)` parcial de texto não nulo em cada coluna da lista. Novas: as de `pedido_titular`, `arquivo_titular (escola_id, expira_em)`, `incidente_escola (escola_id) where confirmado_em is null`. A tarefa da migration entrega o `EXPLAIN` da eliminação (aluno e professor, com volume de Tutor na escola), da prévia e de cada lote |
| Migration | compatível: a 0024 só expande, e a exigência de `provedor` vai num release posterior (seção 3). O `migrar` roda numa transação, então `NOT VALID` seguido de `VALIDATE` no mesmo arquivo não alivia a trava: a partir do staging, cada check vai em arquivo próprio. Índice sem `concurrently` enquanto não há staging nem piloto; a partir do staging, `concurrently` fora de transação. Rollback: o código anterior ignora `eliminacao_agendada_em`, e isso fica no runbook |
| Quando cada dependência cai | banco: 503 tipado e nova tentativa; Redis de fila: aceito e despachado depois; storage: "em preparação", e baixar dá `INDISPONIVEL` |
| Métrica e alerta | duas noites sem `expurgo_execucao.concluida` numa escola; incidente sem confirmação em 24 h; pedido `agendado` mais de 48 h depois de `eliminar_em` (uma interrupção pela janela letiva é esperada e cabe nas 48 h); `em_preparacao` por mais de 2 h. Cada um com parágrafo no runbook e linha no `test:infra` |
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
