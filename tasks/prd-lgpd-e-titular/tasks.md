# Tarefas — LGPD e titular

**PRD:** `prd.md` · **Tech Spec:** `techspec.md` · **Cenários:** `cenarios.md`
<!-- Quantas estão concluídas não se escreve aqui: `node tools/processo/estado.ts` conta pela lista. -->

## Lista

- [x] **1.0 — O ciclo de vida mora no nucleo, sem mudar comportamento**
  - [x] 1.1 Mover serviço e repositórios; a API importa do `@educa/nucleo` (subcaminho), sem export no barrel da `ContaGlobalRepository`
  - [x] 1.2 `eliminar`/`desativar` aceitam `tx` opcional de quem chama; sem ela, abrem a própria transação como hoje
  - [x] 1.3 Teste de arquitetura: a exceção da `Conta` aceita só `sessao` e `nucleo/ciclo-de-vida`, e lista quem importa a `ContaGlobalRepository`; `docs/modelo-de-dados.md` atualizado
  - [x] 1.4 Testes: os de ciclo de vida e de fim de vínculo mudam só de lugar, sem mudar asserção

- [x] **2.0 — A retenção da escola existe e a operação a ajusta por comando**
  - [x] 2.1 `packages/shared/src/privacidade`: `CATEGORIAS_DE_RETENCAO`, `PRAZOS_FIXOS`, `CLASSIFICACAO_DAS_TABELAS` (com "entra no arquivo" e a coluna de ligação), `COLUNAS_FORA_DO_ARQUIVO` (inclui `mfa_ultimo_passo` e `mfa_chave_versao`), erro `RETENCAO_FORA_DO_LIMITE`
  - [x] 2.2 Migration própria: `retencao_escola`
  - [x] 2.3 `RetencaoDaEscolaRepository` (escopo do contexto) e prazo efetivo com as travas
  - [x] 2.4 `ops:retencao` (ajustar, listar), abrindo o contexto da escola; auditoria `retencao.ajustada`
  - [x] 2.5 Módulo `apps/api/src/privacidade` com `GET retencao` (coordenação, MFA) e DTO explícito
  - [x] 2.6 Teste de arquitetura da classificação; `docs/lgpd.md` (linhas do apelido do operador e retenção de `correcao.destaque_aberto_por`), `docs/modelo-de-dados.md`
  - [x] 2.7 Testes

- [x] **3.0 — A rotina noturna expurga a conversa e os sinais em cada escola**
  - [x] 3.1 Migration própria: `job_registro.chave_idempotencia` (único parcial e check com escola), `expurgo_execucao`, índices `(escola_id, <data>)` de `mensagem_tutor`, `sinal_tutor`, `mensagem_agente`
  - [x] 3.2 `Enfileirador` com `chaveIdempotencia` (`on conflict` com o predicado; devolve id ou nulo)
  - [x] 3.3 `EscolasDaRotinaRepository` (`@SemEscopo`, só ids) em `packages/nucleo/src/rotina`
  - [x] 3.4 `sistema.expurgar-dado-pessoal` (1h) e `retencao.expurgar-escola` (lote, não urgente, chave "escola + data local")
  - [x] 3.5 `ExpurgoDaEscolaRepository`: lotes de 5.000, janela a cada lote, começo pela categoria pendente, linha por categoria mesmo com zero; categorias `conversa_tutor`, `sinal_tutor`, `conversa_professor`
  - [x] 3.6 Métrica e alerta de duas noites, parágrafo no `docs/runbook.md`; `docs/modelo-de-dados.md` (exceção da rotina)
  - [x] 3.7 Testes, parametrizados por catálogo com a lista "pendente da tarefa N"

- [x] **4.0 — O expurgo anonimiza execução, texto do modelo, consumo por aluno e autoria**
  - [x] 4.1 Migration própria: `execucao_agente.anonimizada_em`; índices parciais de anonimização (seção 7c), dois em `consumo_ia`
  - [x] 4.2 Categorias `execucao_agente` (`entrada = {tarefa}`, `solicitada_por` nulo), `texto_do_modelo`, `consumo_por_aluno`, `autoria_de_artefato` (ano encerrado)
  - [x] 4.3 `EXPLAIN` de cada lote, anexado à tarefa
  - [x] 4.4 Testes

- [x] **5.0 — O expurgo alcança trabalho do aluno, reivindicação, material, vínculo e pessoa desativada**
  - [x] 5.1 Migration própria: índices `reivindicacao` (decididas), `material` (excluídos), `usuario (escola_id, desativado_em)`, `vinculo` (encerrados), `tentativa_atividade (escola_id, aluno_id)` se faltar
  - [x] 5.2 Categorias `trabalho_do_aluno` (só `situacao = encerrado`), `reivindicacao_decidida` (inclui `decidida_como = coordenacao`), `material_excluido`, `vinculo_encerrado`
  - [x] 5.3 `pessoa_desativada`: `CicloDeVidaService.eliminar` na transação do lote, autor `rotina` (a pulada por pedido agendado entra na 14.0)
  - [x] 5.4 Prazo fixo de `expurgo_execucao` (5 anos)
  - [x] 5.5 Testes; a lista "pendente da tarefa N" do 3.7 fica vazia

- [x] **6.0 — A coordenação vê por quanto tempo a escola guarda cada dado**
  - [x] 6.1 Item Privacidade com abas no endereço; aba Retenção lendo `GET retencao`
  - [x] 6.2 `docs/interface.md` (o item no grupo Conformidade)
  - [x] 6.3 Testes

- [x] **7.0 — Cada chamada externa de IA registra o provedor que a atendeu**
  - [x] 7.1 `IA_PROVEDOR_ID` no `esquemaAmbienteDeIa`, obrigatória com `openai_compat` sem processamento local
  - [x] 7.2 Tipo da porta `{ envioExterno: true; provedorId } | { envioExterno: false; provedorId: null }`; o fixture ganha id
  - [x] 7.3 Migration própria: `consumo_ia.provedor` com `check (provedor is null or envio_externo)`; sobe junto com o código
  - [x] 7.4 `MedicaoDaGeracao`, `ConsumoDeIa` e `ConsumoRepository` levam o valor
  - [x] 7.5 Testes

- [x] **8.0 — A escola vê as empresas que recebem dados dela**
  - [x] 8.1 Migration própria: `suboperador` (chave única onde `fim is null`), `suboperador_escola`
  - [x] 8.2 `OperacaoPrivacidadeRepository` e `ops:suboperador` (cadastrar, encerrar), com auditoria da operação
  - [x] 8.3 `SuboperadorDaEscolaRepository` (só leitura, `exists` correlacionado, parênteses) e `GET suboperadores`
  - [x] 8.4 Aba "Empresas que recebem dados"
  - [x] 8.5 Arquitetura e `docs/modelo-de-dados.md`
  - [x] 8.6 Testes

- [x] **9.0 — A operação registra incidente e a escola afetada confirma o recebimento**
  - [ ] 9.1 Migration própria: `incidente`, `incidente_escola`, índice de pendentes
  - [ ] 9.2 `ops:incidente registrar` (seção por escola; recusa nome ou id de outra escola, com caixa e acento)
  - [ ] 9.3 `IncidenteDaEscolaRepository`, `GET incidentes` e `POST incidentes/:id/confirmar`, auditoria `incidente.confirmado`
  - [ ] 9.4 Alvo `incidente` no `sistema.expurgar-acesso`, justificativa reescrita
  - [ ] 9.5 Alerta de 24 h e runbook; `docs/lgpd.md` (linhas do incidente)
  - [ ] 9.6 Testes

- [x] **10.0 — A coordenação vê o aviso de incidente e confirma o recebimento**
  - [x] 10.1 Diálogo na casca, uma leitura por sessão
  - [x] 10.2 Faixa fixa até a confirmação
  - [x] 10.3 Aba Incidentes
  - [x] 10.4 Testes

- [x] **11.0 — A coordenação acha o titular e registra o pedido**
  - [x] 11.1 Migration própria: `pedido_titular` (gatilho de inserção, imutáveis, único de `chave_envio`, índices)
  - [x] 11.2 `POST titulares/busca` com `rl:busca-titular`; `GET titulares/:id/previa` (`homonimo`; D64)
  - [x] 11.3 `POST pedidos` (chave decide primeiro), `GET pedidos` e `GET pedidos/:id`, auditoria na mesma transação
  - [x] 11.4 `concluir` e `corrigir-nome`, com estados e erro tipado
  - [x] 11.5 Harness de captura de log (termo, nome atual e anterior)
  - [x] 11.6 `docs/lgpd.md` (linha do pedido)
  - [x] 11.7 Testes

- [x] **12.0 — O pedido guarda por quais empresas o dado do titular passou**
  - [x] 12.1 `Compartilhamento` em `packages/nucleo/src/titular`, chamável pela API e pelo worker
  - [x] 12.2 Gravado no `POST pedidos` e devolvido no detalhe
  - [x] 12.3 Testes

- [x] **13.0 — O titular baixa o próprio arquivo, e a escola a versão dela**
  - [x] 13.1 Migration própria: `arquivo_titular` (único `(escola_id, pedido_id, versao)`, índice de validade); e o índice `consumo_ia (escola_id, execucao_id)`, com o rastro da 12.0 em `union all` (`techspec.md` §5, "O índice do rastro")
  - [x] 13.2 Porta `ArmazemDeArquivos` (S3 e falso); confirmar a URL assinada no SeaweedFS (seção 12)
  - [x] 13.3 `LeituraDoTitular` a partir da classificação; `titular.montar-arquivo` (normal, só ids no job)
  - [x] 13.4 Versões `completa` e `coordenacao` (conta ativa por escola); correção não aprovada só como estado
  - [x] 13.5 `GET`/`POST meus-dados`, `POST pedidos/:id/arquivo`, `no-store`, auditoria `titular.arquivo_baixado`
  - [x] 13.6 Expurgo dos arquivos vencidos ou com `apagado_em` na rotina; alerta `em_preparacao` > 2 h
  - [x] 13.7 Testes

- [x] **14.0 — A eliminação fica agendada por 7 dias, com o acesso suspenso e o cancelamento**
  - [x] 14.1 Migration própria: `usuario.eliminacao_agendada_em`; único parcial de `agendado`
  - [x] 14.2 Registro de eliminação (sessões encerradas com `eliminacao_agendada`); cancelar com a trava pedido → usuário
  - [x] 14.3 Guarda, renovação e logins: `ACESSO_SUSPENSO` só depois da credencial; e-mail e seletor sem a escola
  - [x] 14.4 `pessoa_desativada` pula quem tem pedido `agendado` (5.0)
  - [x] 14.5 Runbook do rollback
  - [x] 14.6 Testes

- [ ] **15.0 — No 8º dia a eliminação acontece, com o nome trocado nos textos livres**
  - [ ] 15.1 Migration própria: check do autor `rotina` (NOT VALID, VALIDATE); apelido reservado; índices `(escola_id, id)` parciais de texto
  - [ ] 15.2 Enfileiramento pela rotina (`eliminacao_enfileirada_em`, 20 h)
  - [ ] 15.3 `TrocaDeNome`: faixas de 1.000 examinadas, janela entre faixas, escapes, `titular.nome_trocado` no `returning`
  - [ ] 15.4 Etapa 3 com `for update`, foto, anonimização, `eliminar` na transação, `apagado_em`, autor
  - [ ] 15.5 Alerta `agendado` > 48 h e runbook
  - [ ] 15.6 Testes

- [ ] **16.0 — A coordenação registra um pedido pela tela**
  - [ ] 16.1 Lista com nome e turma, "Titular eliminado"
  - [ ] 16.2 Busca por Enter ou botão, `aria-live`, 429 e mínimo de 3 letras
  - [ ] 16.3 Diálogo de registro com prévia; `chaveEnvio` por diálogo
  - [ ] 16.4 Aviso do aluno da lista
  - [ ] 16.5 Testes

- [ ] **17.0 — A coordenação conduz o pedido até o fim pela tela**
  - [ ] 17.1 Prazo ("faltam N dias", vencido com ícone) e compartilhamento
  - [ ] 17.2 Concluir, Cancelar (diz que o acesso volta), Corrigir nome (antes e depois, aviso do nome anterior)
  - [ ] 17.3 Baixar a versão da escola (`oficial`, finalidade, entregar e apagar)
  - [ ] 17.4 "Em preparação" a cada 10 s, parando com a aba escondida
  - [ ] 17.5 Testes

- [ ] **18.0 — Aluno e professor baixam os próprios dados**
  - [ ] 18.1 Lugar do rodapé fixo na casca do aluno; item Privacidade com "Meus dados"
  - [ ] 18.2 Link no menu da pessoa do professor
  - [ ] 18.3 Tela com resumo, estados, aviso e download
  - [ ] 18.4 `docs/interface.md`
  - [ ] 18.5 Testes

- [ ] **19.0 — A carga prova que o expurgo não atrapalha a aula, e os documentos fecham o F3**
  - [ ] 19.1 Cenário de carga com o adaptador falso de latência simulada; p95 do Tutor de B com e sem o lote de A; statements medidos no Postgres
  - [ ] 19.2 `ops:privacidade` (contagens por escola) com sentinelas
  - [ ] 19.3 `docs/lgpd.md`, `modelo-de-dados.md`, `arquitetura.md`, `runbook.md` conferidos
  - [ ] 19.4 Pendências para o `TODO.md`: a contração de `provedor` (release posterior), recomendações abertas
  - [ ] 19.5 Testes

## Dependências e paralelismo

| Tarefa | Depende de | Pode correr em paralelo com |
|---|---|---|
| 1.0 | nenhuma | 7.0, 8.0, 9.0 |
| 2.0 | 1.0 | 7.0, 8.0, 9.0 |
| 3.0 | 2.0 | 7.0 a 10.0 |
| 4.0 | 3.0 | 5.0, 7.0 a 10.0 |
| 5.0 | 3.0 | 4.0, 7.0 a 10.0 |
| 6.0 | 2.0 | 3.0 a 5.0, 7.0 a 9.0 |
| 7.0 | nenhuma | 1.0 a 6.0, 8.0 a 10.0 |
| 8.0 | 2.0 | 3.0 a 7.0, 9.0 |
| 9.0 | 2.0 | 3.0 a 8.0 |
| 10.0 | 6.0, 9.0 | 11.0 a 15.0 |
| 11.0 | 2.0 | 12.0 (depois de 8.0) |
| 12.0 | 7.0, 8.0, 11.0 | 13.0, 14.0 |
| 13.0 | 3.0, 11.0, 12.0 | 14.0 |
| 14.0 | 1.0, 11.0 | 12.0, 13.0 |
| 15.0 | 4.0, 5.0, 12.0, 13.0, 14.0 | 16.0 |
| 16.0 | 6.0, 11.0 | 15.0 |
| 17.0 | 13.0, 14.0, 16.0 | 18.0 |
| 18.0 | 13.0 | 17.0 |
| 19.0 | 3.0 a 18.0 | nenhuma |

Cada tarefa traz a própria migration, no próximo número livre a partir da 0024 (`techspec.md` seção 3).
A contração que exige `consumo_ia.provedor` não é tarefa do F3: vai num release posterior (19.4).

## Subagentes por tarefa

| Tarefa | Subagentes obrigatórios |
|---|---|
| 1.0 | `privacy-guardian`, `tenancy-guardian` (mais `test-engineer` e `revisor-geral`) |
| 2.0 | `tenancy-guardian`, `privacy-guardian` (mais `test-engineer` e `revisor-geral`) |
| 3.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian` (mais `test-engineer` e `revisor-geral`) |
| 4.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`, `llm-integrator` (mais `test-engineer` e `revisor-geral`) |
| 5.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer` (mais `test-engineer` e `revisor-geral`) |
| 6.0 | `frontend-reviewer`, `privacy-guardian` (mais `test-engineer` e `revisor-geral`) |
| 7.0 | `llm-integrator`, `infra-guardian`, `privacy-guardian` (mais `test-engineer` e `revisor-geral`) |
| 8.0 | `tenancy-guardian`, `privacy-guardian`, `frontend-reviewer` (mais `test-engineer` e `revisor-geral`) |
| 9.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian` (mais `test-engineer` e `revisor-geral`) |
| 10.0 | `frontend-reviewer`, `privacy-guardian` (mais `test-engineer` e `revisor-geral`) |
| 11.0 | `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian` (mais `test-engineer` e `revisor-geral`) |
| 12.0 | `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `llm-integrator` (mais `test-engineer` e `revisor-geral`) |
| 13.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer` (mais `test-engineer` e `revisor-geral`) |
| 14.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian` (mais `test-engineer` e `revisor-geral`) |
| 15.0 | `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer` (mais `test-engineer` e `revisor-geral`) |
| 16.0 | `frontend-reviewer`, `privacy-guardian` (mais `test-engineer` e `revisor-geral`) |
| 17.0 | `frontend-reviewer`, `privacy-guardian` (mais `test-engineer` e `revisor-geral`) |
| 18.0 | `frontend-reviewer`, `privacy-guardian` (mais `test-engineer` e `revisor-geral`) |
| 19.0 | `infra-guardian`, `privacy-guardian`, `tenancy-guardian` (mais `test-engineer` e `revisor-geral`) |

## Critério de pronto da funcionalidade

Do `ROADMAP.md` (F3), com o recorte de 05/10/2026:

- Um pedido de acesso e um de eliminação são atendidos pela coordenação, sem nós, com rastro: o arquivo sai em
  formato aberto para o titular, e a eliminação apaga no 8º dia tudo que o mapa não manda guardar
- Todo dado pessoal sai no prazo da escola, por rotina noturna que não toca outra escola nem o horário de aula, e a
  classificação de toda tabela é conferida por teste
- A escola vê a retenção, os suboperadores e os incidentes que a afetaram, e confirma o recebimento
- Nada do que a coordenação vê separa o professor que usou a IA do que não usou (D64), e a conversa do professor nunca
  chega a ela
- Saíram do F3 e não contam aqui: exportação da escola (F12), canal de notificação (F9 e F12), validação como entidade
  geral (F6), e a contração de `provedor` (release posterior)
