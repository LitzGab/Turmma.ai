# U03 — Camada de IA de ponta a ponta

Escopo lido: `packages/nucleo/src/ia/` (47 arquivos, 7.164 linhas, 3.515 delas de teste e fixture), `apps/api/src/{ia,tutor,assistente,artefato}` (45 arquivos, 7.235 linhas, 3.564 de teste). Nada foi executado; só leitura, grep e `wc`. Marcas: **[código]**, **[doc]**, **[hipótese]**.

## 1. Finalidade e limites

A unidade transforma um pedido de domínio (mensagem do professor, dúvida do aluno, tema de atividade, agregados da escola) em saída de modelo **validada**, medida e gravada, sem que o domínio conheça provedor, modelo ou prompt.

- Porta `LLMProvider.gerar(tarefa, entrada, escolaId, ...)` [código `packages/nucleo/src/ia/porta.ts:123`]. Implementação única, `ProvedorDeIa` [`provedor.ts:83`], igual para todo adaptador. Adaptadores: `AdaptadorFalso` e `AdaptadorOpenAICompat` (`fetch` puro, sem SDK) [`adaptador-falso.ts:207`, `adaptador-openai-compat.ts:90`].
- 7 "tarefas" declarativas (`definirTarefa`): `propor_ferramenta`, `gerar_atividade_objetiva`, `gerar_plano_de_aula`, `adaptar_atividade`, `turno_do_tutor`, `relatorio_da_correcao`, `resumo_do_analista` [`tarefas/index.ts:14`]. Cada uma leva função (D9), perfil, prompt versionado, schema zod de entrada/saída, `conferir`, `falso` e flags `levaTextoLivreDePessoa/levaTextoDeAluno` [`tarefa.ts:253`].
- Na API: `IaModule` (global) monta provedor, executor em processo, repositórios de orçamento/consumo/suspensão; `AgendadorDeExecucoes` é o **único chamador** de `ia.gerar` em código de produção [código: grep `\.gerar(` em apps/packages só acha `agendador-de-execucoes.ts:101` para IA].
- Casos de uso: `assistente` (conversa do professor), `artefato` (ferramentas geradoras, adaptação, PDF), `tutor` (conversa do aluno, memória, sinais, uso). O Analista (`resumo_do_analista`) é disparado por `apps/api/src/governanca/analista.service.ts:65` (fora desta unidade).

Não é da unidade: busca de trechos (`material/busca-de-trechos`), entregas/aprovação (`entrega`), correção de objetiva (função "sem modelo"; só chama `ConferenciaDeFuncao`), governança/consumo (lê `consumo_ia`), telas.

## 2. Pontos de entrada

| Entrada | Papel/guarda | Arquivo |
|---|---|---|
| `GET /v1/execucoes/:id` | `execucao.ler`, alcance `próprio` | `ia/execucoes.controller.ts:13-20` |
| `GET /v1/assistente/conversa`, `POST /v1/assistente/mensagens` (202) | `assistente.ler_conversa/enviar_mensagem` (professor) | `assistente/assistente.controller.ts:17,24` |
| `GET /v1/time` | `time.ler` (coord. e professor) | `assistente/time.controller.ts:10` |
| `POST /v1/ferramentas/:ferramenta/gerar` (202) | `ferramenta.gerar` | `artefato/ferramentas.controller.ts:15` |
| `GET /v1/artefatos`, `GET :id`, `PATCH :id`, `GET :id/pdf`, `POST :id/adaptar` (202) | `artefato.*`, `turma_vinculada` | `artefato/artefato.controller.ts` |
| `POST /v1/tutor/mensagens` (202), `GET /conversa`, `GET /memoria`, `GET /uso` | `tutor.*` (aluno), `uso_do_tutor.ler` (professor) | `tutor/tutor.controller.ts:29-55` |
| `GET /v1/sinais` | `sinal.ler` (professor da turma) | `tutor/sinais.controller.ts` |
| Executor em processo + varredura (`setInterval`) | `OnApplicationBootstrap` | `ia/ia.module.ts:90`, `executor.ts:128` |

Sem worker, sem fila BullMQ, sem evento, sem webhook, sem WebSocket para IA. `apps/worker` existe mas não tem processador de IA [código: `ls apps/worker/src/processadores`: sintético, consolidar-uso, eliminar-titular]. A tela faz polling de `GET /v1/execucoes/:id` [código `apps/web/src/api/execucoes.ts:32`, `ciclo-de-execucao.ts:83`].

## 3. Fluxos e regras de negócio

**Fluxo único de geração** [código `agendador-de-execucoes.ts:167-216`]: (1) escola e contexto da sessão; (2) `esquemaEntradaDaExecucao.parse` e nome da tarefa batendo; (3) `exigirFuncaoAtiva` (suspensão, D60); (4) transação: `gravarPendente` por índice único de chave de envio + `aoGravar` (grava a mensagem de quem pediu) ou devolve a execução existente; (5) responde `{execucaoId}` (202); (6) `executor.agendar` roda depois: monta a entrada (`entrada()`), chama `ia.gerar`, e numa transação faz `aoConcluir` + `concluirRodando` (se o prazo já encerrou a execução, lança e desfaz).

**Dentro de `ProvedorDeIa.gerar`** [código `provedor.ts:90-154`], nesta ordem: escola do pedido = escola do contexto (`:101`) → entrada no schema estrito (`:109`) → suspensão (`:118`) → `semModelo` (regra fixa) → orçamento (salvo regra fixa, `:126`) → `chamarAteValer` (até 2 chamadas; 2ª leva o erro devolvido ao modelo; reserva por regra se a conferência reprova duas vezes, `:187-216`) → registra consumo (se o registro falha, a chamada falha, `:146`).

**Invariantes e onde são garantidas**

| Invariante | Onde | Tipo de garantia |
|---|---|---|
| Domínio não importa SDK (regra 30.1) | `tools/guardas/regras-ia.mjs` (ESLint) + `fetch` puro | estrutura + lint. A pasta permitida `apps/api/src/ia/adapters/**` **não existe**; o adaptador vive em `packages/nucleo` |
| Toda chamada tem perfil | `DefinicaoDeTarefa.perfil` obrigatório; `PedidoDeGeracao` sem campo de modelo (`porta.ts:70`) | tipo |
| Entrada sem nome de pessoa | `esquemaDeEntrada` sempre `strictObject` | tipo/schema. Não alcança texto livre (`tarefa.ts:261-276`) |
| Saída validada | `interpretar`/`validar` (`provedor.ts:46-67`) + revalidação na gravação (`esquemaConteudoDoArtefato.safeParse`, `esquemaRespostaConversaDoTutor.parse`) | estrutura |
| Citação só de página entregue (regra 30.12) | `problemasDasCitacoes` na tarefa + `exigirCitacoesEntregues` na gravação (`assistente/citacoes.ts:6`) | estrutura em duas camadas |
| Nada oficial sem humano (regra 70.3) | artefato nasce como rascunho do professor; adaptação nasce com `entrega` pendente na mesma transação (`artefato.service.ts:140-147`); exceção D47 do Tutor | estrutura + teste |
| D55 (nada sobre discursiva/redação, sem nota) | `propor_ferramenta.semModelo` (recusa fixa antes do modelo, `propor-ferramenta.ts:372`), `conferir` com `atribuiNotaOuConceito` (`:286`), `turnosQuePodemIrAoModelo`, e o prompt | **convenção por regex** (ver achados) + teste `numeros.test.ts` |
| Tutor não entrega resposta (30.11, 70.4) | gabarito/explicação **nunca entram** na entrada (`esquemaQuestaoEmAndamento`, `turno-do-tutor.ts:28`; `questaoSemGabarito`, `tutor.service.ts:81`); `problemasDoTurno` (`:413`) e `reservaQuandoInvalida` (`:487`) | estrutura (o que não entra) + regex (o que sai) + teste com "modelo de mentira" |
| Agente não se passa por pessoa (70.4a) | `AFIRMA_SER_PESSOA`/`SIMULA_VINCULO` em `problemasDoTurno`; `PERGUNTAS_SOBRE_O_TUTOR` no falso; prompt | regex + teste `tutor-modelo.int.test.ts:146` |
| Tutor travado em avaliação (30.10) | `TutorDoAlunoRepository.avaliativaAberta` no `POST` (`tutor.service.ts:171`), no servidor | código + teste (`tutor.int.test.ts:438`). Conferido só no `POST`, não quando a execução roda (hipótese de janela; ver §8) |
| Assunto delicado vai a humano, sem modelo (D36) | `ehAssuntoDelicado` antes de tudo (`tutor.service.ts:164`), `#encaminhar` numa transação, sinal `atencao_humana` sem conteúdo | código + teste |
| Memória = trabalho, não pessoa (70.4d) | `esquemaMemoriaDoTrabalho` só números + habilidade (`turno-do-tutor.ts:41`); só lote aprovado (`memoriaDoTrabalho`, `tutor.service.ts:92`) | schema + teste |
| Freio D38 sem corrida | `travarAluno` (`pg_advisory_xact_lock`, `tutor.repository.ts:229`) + contagem na mesma transação do `INSERT` (`tutor.service.ts:190-194`) | banco; teste "dez envios ao mesmo tempo" (`tutor.int.test.ts:552`) |
| Autonomia declarada (D9, 70.5) | `FUNCOES` em `packages/shared/src/time/funcoes.ts`, servida por `GET /v1/time` | dado em código + endpoint |
| Texto de pessoa não vai para `consumo_ia` | flag `levaTextoLivreDePessoa` zera entrada/saída (`provedor.ts:96`) + check no banco `consumo_ia_sem_conversa_de_pessoa` | estrutura |

## 4. Dependências

- **Internas.** `packages/nucleo/src/ia` → `config`, `contexto`, `erro`, `log`, `relogio`, `uso/dia-de-uso`, `@educa/shared` (contratos). API: `tutor`, `artefato`, `governanca` → `assistente/*` (LimiteDePedidosDeIa, citacoes, ExecucaoDoPedidoRepository, TurmaDoProfessorRepository, `contextoDaTarefa`) e `ia/*`; `ia/execucao.repository.ts` lê as tabelas `mensagem_agente`, `mensagem_tutor`, `thread_agente` (acoplamento ia → assistente/tutor via dados). Contagem de imports entre pastas (não-teste): 13 para `../assistente`, 11 para `../ia`, 6 para `../material`. Sem ciclo de import visto; o módulo `assistente` funciona como "infra de IA" sem sê-lo (§10).
- **Externas.** Postgres (Drizzle), Redis (só o contador de pedidos por minuto, via `CLIENTE_REDIS_LOGIN` do SessaoModule), provedor de modelo por HTTP `chat/completions` (qualquer servidor do padrão; no ensaio `llama-server`). Sem Ollama no código (§11). Sem fila/BullMQ para IA.
- `pdf-do-artefato.ts` (281 linhas) renderiza PDF (lib de PDF) dentro do módulo `artefato` [código], dependência de render não ligada a IA.

## 5. Dados

| Tabela | Escreve | Lê |
|---|---|---|
| `execucao_agente` | `ExecucaoRepository`/`ExecucaoDaSessaoRepository` (`ia/execucao.repository.ts`) | idem; `assistente/execucao-do-pedido.repository.ts` lê `entrada` jsonb |
| `consumo_ia` | `ia/consumo.repository.ts` e **também** `tutor.service.ts:342` (regra fixa, insert direto) | `governanca.repository.ts`, `privacidade/titulares.repository.ts`, expurgo |
| `suspensao_de_funcao` | (outra unidade) | `ia/suspensao.repository.ts`, `assistente/time.service.ts` (segunda leitura da mesma tabela) |
| `mensagem_tutor`, `sinal_tutor` | `tutor/tutor.repository.ts` | `ia/orcamento.repository.ts` (conta trocas), `supervisao.repository.ts`, `governanca` |
| `thread_agente`, `mensagem_agente` | `assistente/conversa.repository.ts` | `ia/execucao.repository.ts` |
| `artefato`, `entrega` | `artefato/artefato.repository.ts`, `EntregaRepository` | idem |
| `configuracao_operacional_escola` | (outra) | `ia/orcamento.repository.ts:258` (limites do Tutor) |

`consumo_ia.custo_micros` existe (`default 0`) mas **nenhum código o preenche** [código `ia/consumo.repository.ts:314-336`: o `insert` não tem `custoMicros`; grep "custo" em `packages/nucleo/src/ia` sem produção de valor]. A lista de funções/tarefas/perfis aparece repetida em checks SQL (`consumo-ia.ts` check `consumo_ia_funcao_valida`; `execucao-agente.ts:92` lista de tarefas) além do código TS: tarefa nova exige migration.

## 6. Contratos

- **Explícitos e fortes.** Schemas de entrada/saída por tarefa (zod `strictObject`); `esquemaEntradaDaExecucao` e `esquemaResultadoGravado` em `@educa/shared` (união discriminada por tarefa; `execucao.ts:92`); `esquemaPedido*` validados na borda por `lerEntrada` (campo a mais = `ENTRADA_INVALIDA`); DTO de saída com `esquemaResposta*.parse` em todo `GET`; `ErroDeIa` com código do catálogo `CodigoDeErro` (sem texto livre, `erros.ts:207`); catálogo de tarefas com `satisfies Record<TarefaDeIa,…>` (`tarefas/index.ts:23`); teste que confere função/perfil/flags declarados (`tarefas.test.ts:37`).
- **Implícitos.** (a) Contrato com o provedor: só o schema mínimo da resposta (`esquemaDaResposta`, `adaptador-openai-compat.ts:69`) e suposições do `llama-server` (`chat_template_kwargs.enable_thinking`, `response_format json_object`, `:117-118`); parâmetros fixos (`temperature: 0.2`) não são configuração. (b) `lido`: variável de closure mutável compartilhada entre `entrada()` e `aoConcluir()` em `tutor.service.ts:180`, `assistente.service.ts:251`, `ferramentas.service.ts:71`, `artefato.service.ts:178` (ordem de chamada como contrato). (c) A versão do prompt é string manual (`'2026-10-04.5'`); só o formato é testado (`tarefas.test.ts:107`).
- **Testes de contrato com modelo.** Há servidor falso de `llama-server` (`__fixtures__/servidor-llama-falso.ts`) e "modelo de mentira" na API (`apps/api/test/escola-com-tutor.ts`). Nenhum teste de contrato contra um modelo real (esperado; regra 40).

## 7. Testes

| Arquivo | Camada | O que protege |
|---|---|---|
| `nucleo/ia/provedor.test.ts` (499) | unidade | ordem das etapas, repetição com problemas, reserva, orçamento, suspensão, minimização de log, falha de registro |
| `adaptador-openai-compat.test.ts` (371) | unidade c/ servidor HTTP falso | 429/5xx com recuo, `redirect: error`, timeout, erro cru que não sai, tokens estimados |
| `executor.test.ts` (311) | unidade | vagas por escola/total, prazo, idempotência por chave, varredura |
| `tarefas/*.test.ts` (conteudo, numeros, turno-do-tutor, tarefas: ~1.455) | unidade | conferências, regex de pedido de resposta/nota, **taxa mínima sobre amostras fixas** (`TAXA_MINIMA_DA_REGRA = 1`, `turno-do-tutor.test.ts:122`; `__fixtures__/amostras-do-*.ts`) |
| `apps/api/src/ia/ia.int.test.ts` (804) | integração, Postgres real | isolamento de escola em execução/consumo/suspensão/orçamento, idempotência de chave, varredura, resultado só por referência |
| `tutor.int.test.ts` (915), `tutor-modelo.int.test.ts` (316) | integração | recusa em 3 formas (direto, palpite, fatiado), assunto delicado antes de limite/avaliação/suspensão, freio D38 concorrente, memória só de lote aprovado, o que vai ao modelo (sem nome, sem gabarito), nome fora do log |
| `assistente.int.test.ts` (490), `artefato.int.test.ts` (623), `limite-de-pedidos-de-ia.test.ts` (86), `conferencia.test.ts`, `pdf-do-artefato.test.ts`, `sinais-do-turno.test.ts` | int./unidade | isolamento, recusa D55, adaptação fiel, PDF de rascunho, limite por pessoa/escola |

A cobertura é **boa e dirigida a regra**, não decorativa: usa Postgres real, ataca com modelo que desobedece, testa trocar-o-id. Lacunas: nada testa `IaModule`/bootstrap isolado; sem teste de carga de IA na unidade [hipótese: `infra/k6` pode cobrir, não li]; as amostras fixas medem a **regra em regex** (taxa 1,0 sobre amostras escritas junto da regra, **circular**: a regra foi ajustada às amostras), não um modelo; "ensaio com o modelo local" é citado como fazendo parte (`amostras-do-tutor.ts:4`) mas não achei script que o rode [hipótese: confirma `grep ensaio tools/` + `docs/avaliacao-de-modelos.md`]. Risco de fragilidade: testes de 800-900 linhas por arquivo com helpers em `apps/api/test/`.

## 8. Resiliência e escala (sinais)

- **Timeout**: por chamada `LLM_TIMEOUT_MS` (60 s) via `AbortSignal.timeout` combinado com o sinal do executor [`provedor.ts:194-195`]; execução com prazo próprio 150 s [`config-ia.ts:89`, `executor.ts:210-224`]; coerência validada na subida (recuo < timeout < execução) [`config-ia.ts:99-102`]. Bom.
- **Retry**: 1 repetição **só** em 429/5xx, com recuo fixo 500 ms, `Retry-After` respeitado até o recuo [`adaptador-openai-compat.ts:144-172`]; mais 1 repetição por saída inválida [`provedor.ts:36`]. Sem jitter, sem circuit breaker, sem retry de erro de rede (`fetch` que lança vira `IA_INDISPONIVEL` direto, `:158`).
- **Degradação (regra 80.4)**: **ausente**. Não há fila curta com aviso, modelo menor do mesmo perfil nem provedor de reserva [código: grep `fallback|degrada|reserva` só acha `reservaQuandoInvalida`, que é outra coisa]. Um adaptador, uma URL.
- **Streaming**: ausente; `stream: false` [`adaptador-openai-compat.ts:113`]. Resposta do Tutor só aparece inteira, via polling.
- **Fila/estado em memória**: `ExecutorNoProcesso` guarda fila, `emCurso` e contadores **em memória do processo** [`executor.ts:101-106`], declarado exceção D77 com `TODO(fila)` [`:94`]. Reinício perde o que estava na fila (a varredura marca `EXECUCAO_INTERROMPIDA` após 2 prazos); com 2 instâncias, vagas por escola valem por processo. Sem prioridade interativa/normal/lote (regra 80.2). Não é BullMQ, apesar de D49.
- **Idempotência**: boa na criação (índice único `(escola_id, chave_envio)`, `onConflictDoNothing`) e na passagem de estado (`update … where estado='pendente'`). `aoConcluir` roda em transação junto de `concluirRodando`: não duplica efeito.
- **Concorrência**: freio do Tutor sob advisory lock; limite por pessoa e por escola no Redis com fallback em memória dividido por instâncias [`limite-de-pedidos-de-ia.ts:133`].
- **Orçamento (D14, regra 30.8)**: o real só existe para o Tutor e conta **trocas**, não tokens [`orcamento.repository.ts:256`, comentário `:246` "fora do Tutor, a consulta permite"]. `IA_ORCAMENTO_ESGOTADO` só é produzido por `OrcamentoEmMemoria` (teste) [`consumo.ts:110`; grep sem outro produtor]. Sem teto de tokens por escola, sem aviso ao coordenador antes do limite, sem custo em reais.
- **Paginação/índices**: conversas paginadas por cursor (`antes`, `limite+1`); índices por escopo em `consumo_ia`; `mensagem_tutor` contada por `escola_id`.
- **Observabilidade**: log JSON com `evento`, `tipo`, `escolaId`, `execucaoId`, `duracaoMs`, `tentativas`, sem conteúdo [`provedor.ts:152,257`]; registro de falha também em `consumo_ia` (`estado=falhou`). Não vi métrica Prometheus de IA nesta unidade [hipótese: pode estar em `governanca`/`infra/grafana`].
- **Janela de corrida**: trava de avaliação conferida no `POST`, mas o modelo roda até ~150 s depois e `entrada()` reconfere vínculo/alcance, **não** `avaliativaAberta` [`tutor.service.ts:196-216`]. Se o professor abre a avaliação entre o 202 e a execução, a resposta sai. Confirmaria: teste com avaliação aberta entre as duas fases.

## 9. Suspeitos de código morto (não afirmar)

| Suspeito | Como procurei | Pode ser referência dinâmica |
|---|---|---|
| `relatorioDaCorrecao` / `relatorio_da_correcao` (`tarefas/relatorio-da-correcao.ts`, `prompts/relatorio-da-correcao.ts`, ~120 linhas + testes) | grep em `apps/` sem chamador; só índice, schemas em `shared`, checks SQL, testes | a unidade de correção de objetiva (U de `correcao`/`entrega`) pode chamá-la por outro nome; reconfirmar `grep -rn "relatorio" apps/api/src` nas outras unidades |
| `OrcamentoEmMemoria`, `ConsumoEmMemoria`, `SuspensoesEmMemoria`, `ExecucoesEmMemoria` (em `src/` de produção, não em `__fixtures__`) | só uso em testes | export público do pacote `@educa/nucleo` |
| `VERSAO_DAS_REGRAS_COMUNS` (`prompts/comum.ts:8`) | grep: só definição | pode alimentar versão em teste/log não visto; não entra em `promptVersao` do consumo (§10) |
| Código `IA_ORCAMENTO_ESGOTADO` (catálogo, `erros.ts:18`) nunca produzido por orçamento de produção | grep | frontend mapeia a mensagem (`shared/src/erros/mensagens.ts:35`) |
| `AdaptadorFalso.latenciaMs` | usado por `infra/carga.env` (`IA_LATENCIA_FALSA_MS`) | uso legítimo: teste de carga |
| `ExecucaoRepository.marcarConcluida` | interface `RepositorioDeExecucoes` exige | chamado por `ExecutorNoProcesso.rodar` (`executor.ts:197`), mas `AgendadorDeExecucoes` já conclui via `concluirRodando` dentro do trabalho; o `marcarConcluida` do executor tende a ser no-op [hipótese: confirmar que `concluirRodando` antes torna o segundo update vazio] |

## 10. Duplicação e inconsistência

- **Código de "falso" em pacote de produção.** Cada tarefa carrega a versão determinística (`falso`) e `material.ts` (252) + `texto.ts` (92) existem sobretudo para fabricá-la (extração de "fatos" por regex `é/são/corresponde a`, geração de questões/lacunas, escolha de habilidade). Em `AMBIENTE=producao` o falso é recusado (`config-ia.ts:98`). Estimativa: ~40-50% das linhas não-teste de `tarefas/` + `material.ts` servem ao adaptador falso/demonstração [hipótese; confirmar medindo blocos `falso(...)` e helpers só usados por eles]. Parte do `material.ts` (`fatoCitadoNoTexto`, `extrairFatos`) também alimenta `reservaQuandoInvalida`/`conduzirPorPerguntas` do Tutor, ou seja, **fallback de produção depende de heurística de regex**.
- **Regra de negócio sensível como regex gigante**: `PEDE_NOTA`, `PEDE_JULGAMENTO`, `DE_ALUNO`, `TEXTO`… em `propor-ferramenta.ts` (443 linhas, ~190 só de padrões); gatilhos de risco à vida/assunto delicado, pedidos de resposta, `CONFIRMA_OU_NEGA` em `turno-do-tutor.ts` (529 linhas, linhas 92-440). É frágil a paráfrase e a idioma; o próprio comentário admite que "não é entendimento" [`turno-do-tutor.ts` doc de `problemasDoTurno`]. As listas incluem termos como "tô triste", "grávida", "usando drogas" (`:116` e vizinhas) que alimentam o sinal `atencao_humana` ao professor, com nome do aluno: precisa do `conformidade-reviewer` e de leitura contra D36/D57 [hipótese de atrito].
- **Dois caminhos de gravar `consumo_ia`**: `ProvedorDeIa.consumo()` e o insert manual de regra fixa em `tutor.service.ts:342-363`, com `MODELO_DA_REGRA_FIXA` repetido. O segundo contorna `exigirFuncaoAtiva` (intencional) e também a porta.
- **`lido`/`preparado`/`lida`** (closure mutável) repetido em 4 serviços; o padrão "entrada() relê gravado → `aoConcluir` confere citações → monta `ResultadoGravado`" repete-se em assistente, ferramentas, artefato.adaptar, tutor e analista; o esqueleto poderia estar no agendador.
- **Módulo `assistente` como infra compartilhada**: `limite-de-pedidos-de-ia.ts`, `citacoes.ts`, `execucao-do-pedido.repository.ts`, `turma-do-professor.repository.ts`, `contextoDaTarefa` são usados por tutor/artefato/governanca [imports acima]. `time.service.ts` e `SuspensaoRepository` leem a mesma tabela `suspensao_de_funcao` por dois repositórios.
- **`ExecucaoDaSessaoRepository` e `ExecucaoRepository` no mesmo arquivo** (`execucao.repository.ts`), um com `@SemEscopo`, outro por sessão, e o segundo lê tabelas de conversa que não são suas.
- **Arquivos grandes**: `turno-do-tutor.ts` 529, `numeros.test.ts` 462, `turno-do-tutor.test.ts` 486, `propor-ferramenta.ts` 443, `tutor.service.ts` 416, `tutor.repository.ts` 453, `tutor.int.test.ts` 915, `ia.int.test.ts` 804.
- **Prompt**: um `.ts` por tarefa em `prompts/`, texto + `versao` manual (data.n). `REGRAS_COMUNS` é concatenado ao prompt em tempo de montagem (`adaptador-openai-compat.ts:53`), mas `promptVersao` gravado no consumo é só a versão da tarefa, sem a de `REGRAS_COMUNS` (`VERSAO_DAS_REGRAS_COMUNS` não entra). Mudar as regras comuns muda o comportamento de todas as tarefas sem mudar nenhuma `promptVersao` registrada [código `provedor.ts:224`].
- **Constantes duplicadas**: `TAMANHO_MAXIMO_DO_TURNO = 2000` e `TAMANHO_MAXIMO_DO_CONTEXTO = 60` em `tutor.service.ts:53-54` e `assistente.service.ts:186-187`; `TRECHOS_NA_*` por serviço.

## 11. Doc × código

| Doc / regra diz | Código |
|---|---|
| Regra 30 e `docs/arquitetura.md:121`: adaptadores `OllamaAdapter` e `OpenAICompatAdapter` | Só `openai_compat` e `falso`; "Ollama" aparece em doc/regra, não há adaptador nem env (`ADAPTADORES_DE_IA = ['falso','openai_compat']`, `config-ia.ts:11`). O ensaio é `llama-server` |
| Regra 30.1: SDK só em `apps/api/src/ia/adapters` | Pasta inexistente; adaptador em `packages/nucleo/src/ia`; lint aponta caminho que não existe (`regras-ia.mjs:PASTA_DOS_ADAPTADORES`) |
| Regra 30.4: registra "custo" | `custo_micros` nunca preenchido; sem tabela de preço |
| Regra 30.8 / D14: orçamento por aluno, **turma e escola**, corte suave e aviso ao coordenador | Só trocas do Tutor (aluno/dia, turma/mês); teto por escola em tokens só em memória de teste; sem aviso |
| Regra 80.4: fila curta → modelo menor → reserva | Ausente |
| Regra 00.4 / D49 / regra 80.2: IA em fila com prioridade e limite por escola | Executor em memória no processo da API (exceção D77 declarada), sem prioridade |
| D62: conversa de aluno só em provedor com processamento no Brasil | `levaTextoDeAluno` é declarado e testado, mas **nenhum código de produção o lê** [grep: só `tarefa.ts`, `tarefas/*`, testes]. O adaptador só sabe `processamentoLocal` e `provedorId`; não existe verificação "Brasil" |
| Regra 30.2: o mais barato que resolve | Tutor e Assistente em `rapido`, Analista em `padrao` (`maximoDeTokensDeSaida: 6000`); mas o Analista pede ao modelo que devolva os agregados idênticos e só acrescente alertas, que `falso` já calcula integralmente (`resumo-do-analista.ts`): o modelo pode ser desnecessário [hipótese; ver achado 5] |
| Regra 30.6: prompt em arquivo versionado "com variáveis explícitas" (`llm-integrator.md`) | Arquivos `.ts` versionados à mão; sem variáveis, instrução e dados separados por `montarPedido` (bom) |
| `README.md` da camada: "Função sem modelo: `ConferenciaDeFuncao`" | Confere |

## 12. Tamanho, risco e vizinhança

- **Tamanho**: ~14,4 mil linhas, 92 arquivos; ~7,3 mil de teste/fixture. Código de produção ~7 mil.
- **Risco de mexer: alto** no `ProvedorDeIa`, no `AgendadorDeExecucoes`, em `turno-do-tutor.ts` e em `propor-ferramenta.ts` (qualquer mudança de regex altera o que o professor/aluno vê e o sinal ao professor; regras 70/D55/D36); **médio** nos serviços de API (cobertos por int. test fortes); **baixo** em `texto.ts`, `limpar-saida.ts`, `erros.ts`.
- **Depende de**: `nucleo` (config, contexto, erro, log, db/schema), `shared` (contratos, `FUNCOES`), U de sessão/permissão (`Permite`, `sessaoDaRequisicao`, Redis do login), U de material (`BuscaDeTrechos`), U de entrega (`EntregaRepository`), banco/migrations.
- **Dependem dela**: governança/Analista, privacidade/titulares (leem `consumo_ia`; troca de nome percorre colunas), expurgo, correção de objetiva (`ConferenciaDeFuncao`), web (polling), infra (`carga.env`, compose).

## 13. Os 5 achados mais importantes

1. A porta funciona e o caminho é único (`AgendadorDeExecucoes` → `ProvedorDeIa`), com perfil, suspensão, validação por schema e consumo gravado, e os testes de integração (Postgres real, modelo de mentira, concorrência do freio) protegem a regra de verdade: é a parte sólida a preservar.
2. Resiliência declarada na regra 80 não existe: sem degradação (modelo menor/reserva), sem streaming, retry limitado a 1× em 429/5xx, executor em memória do processo da API sem prioridade e sem fila (`TODO(fila)`, D77); reinício perde trabalho.
3. Orçamento/custo (D14, regra 30.8): só há freio de **trocas** do Tutor; não há teto de tokens por escola, `IA_ORCAMENTO_ESGOTADO` só existe em memória de teste, `custo_micros` nunca é preenchido e não há aviso à coordenação; a "validação da precificação" não é possível com o que o código mede.
4. D55, D36 e a recusa do Tutor dependem de ~900 linhas de regex em português dentro de `turno-do-tutor.ts` e `propor-ferramenta.ts`, validadas por amostras escritas junto das regras (taxa 1,0 circular); é o ponto de maior risco de regressão e de falha por paráfrase, e mistura política de conformidade com código de tarefa. D62 (Brasil) está declarado em `levaTextoDeAluno` mas **nenhum código o aplica**.
5. Peso morto/duplicação de demonstração em produção: o "falso" de cada tarefa (+ `material.ts`, `texto.ts`) é meio da unidade e alimenta fallback real; `relatorio_da_correcao` não tem chamador visível na API; o Analista pede ao modelo o que `falso` já calcula; e o módulo `assistente` virou infra compartilhada de IA, com `lido` mutável repetido em quatro serviços.
