# MVP de apresentação: contratos e dados (pacote S)

> A referência dos pacotes M, P, W, A, T e G. Vale o que está no código: `packages/shared/src/` (schemas zod, todos
> `strictObject`), `packages/nucleo/src/db/schema/` (o docblock de cada tabela explica cada restrição) e a migration
> `packages/nucleo/drizzle/0022_mvp_apresentacao.sql`. Este arquivo é o índice. **Nenhum pacote muda tabela, schema nem
> `MATRIZ`**: o que faltar volta para o pacote S.

## 1. Antes de usar

- **As tabelas saem de `@educa/nucleo` depois de uma linha de integração**, que não era arquivo do pacote S:
  `export * from './db/schema/mvp/tabelas.js'` em `packages/nucleo/src/index.ts`, e `...tabelasDoMvp` no `schema` de
  `packages/nucleo/src/db/banco.ts` (só para quem usa `banco.query.*`). Os contratos já saem de `@educa/shared`.
- `npm run db:gerar` lê `@educa/shared` pelo `dist`: rode `npm run build -w @educa/shared` antes. Só o pacote S gera migration.
- Os testes das restrições estão em `packages/nucleo/src/db/schema/mvp/tabelas-do-mvp.int.test.ts`, e os dos schemas, ao
  lado de cada um em `packages/shared/src/`.

## 2. Convenções que valem em toda rota

| O quê | Como é |
|---|---|
| Escopo | Escola, ano letivo e pessoa vêm da sessão. Nenhum schema de entrada tem `escolaId`, `anoLetivoId`, `usuarioId` ou `professorId`: mandar é `ENTRADA_INVALIDA` |
| Objeto de outra escola, ou fora do alcance | `NAO_ENCONTRADO`, igual ao inexistente |
| `POST` que dispara IA | Leva `chaveEnvio` (UUID que a tela sorteia a cada envio) e responde **202** `esquemaRespostaExecucaoAceita`. A mesma chave devolve a mesma execução |
| Execução | A tela consulta `GET /v1/execucoes/:id` a cada `INTERVALO_DA_CONSULTA_DE_EXECUCAO_MS` até `concluida` ou `falhou` |
| Função suspensa | Antes de gravar a execução: `FUNCAO_SUSPENSA`. A função de cada tarefa é `FUNCAO_DA_TAREFA_DE_IA` |
| `questao` | O **número** da questão, a partir de 1 (posição em `conteudo.questoes` mais um), na rota, no banco e no sinal |
| `alternativa`, `gabarito` | O **índice** da alternativa, de 0 a 3 |
| Custo | `custoMicros`: milionésimos de real, inteiro |
| Acertos | Contagem de questões. Não existe nota, conceito nem pontuação em campo nenhum (D46, D55) |
| Erro | `CodigoDeErro` com mensagem em `MENSAGENS_DE_ERRO`. O erro da execução também é um `CodigoDeErro` |
| Listagem | Paginada: `?pagina=<id>&limite=` (`esquemaConsultaPaginada`); as conversas, `?antes=<id>&limite=` |

Códigos de erro novos (`packages/shared/src/erros/`, com status em `packages/nucleo/src/erro/erro-de-dominio.ts`):
`MATERIAL_SEM_LICENCA` 422 · `FUNCAO_SUSPENSA` 409 · `LIMITE_DIARIO_DO_TUTOR` 429 · `PACOTE_DO_TUTOR_ESGOTADO` 429 ·
`TUTOR_PAUSADO_EM_AVALIACAO` 409 · `DESTAQUES_NAO_ABERTOS` 409 · `ENTREGA_JA_DECIDIDA` 409 ·
`VERSAO_ADAPTADA_NAO_APROVADA` 409 · `ATIVIDADE_ENCERRADA` 409 · `MATERIAL_INSUFICIENTE` 422 · `IA_INDISPONIVEL` 503 ·
`IA_TEMPO_ESGOTADO` 503 · `IA_SAIDA_INVALIDA` 502 · `IA_ORCAMENTO_ESGOTADO` 429 · `IA_ENTRADA_INVALIDA` 500 ·
`EXECUCAO_INTERROMPIDA` 503.

## 3. Rotas (todas sob `/v1`)

Célula é `recurso.acao` da `MATRIZ`. Alcance: C coordenação, P professor, A aluno; `un` unidade, `tv` turma vinculada,
`pr` próprio, `ag` agregado, `na` nominal auditado. Quem não aparece é `nunca`, e a rede é `nunca` em todas.

### Material (M) — `material/material.ts`

| Rota | Entrada | Saída | Célula | Erros próprios | Auditoria |
|---|---|---|---|---|---|
| `POST /materiais` (multipart, `arquivo` até `MAXIMO_DE_BYTES_DO_MATERIAL`) | `esquemaPedidoEnviarMaterial` | 201 `esquemaRespostaMaterial` | `material.enviar` C `un` | `MATERIAL_SEM_LICENCA`, `CONFLITO` (mesmo arquivo) | `material.enviado`, ou `material.recusado` |
| `GET /materiais` | `esquemaConsultaMateriais` | `esquemaRespostaListaDeMateriais` | `material.listar` C `un`, P `tv` | | |
| `GET /materiais/:id` | | `esquemaRespostaMaterial` | `material.ler` C `un`, P `tv` | | |
| `DELETE /materiais/:id` | | 204 | `material.excluir` C `un` | | `material.excluido` |
| `GET /materiais/busca` | `esquemaConsultaBuscaDeMaterial` | `esquemaRespostaBuscaDeMaterial` | `material.buscar` C `un`, P `tv` | | |

A recusa usa `motivoDaRecusaDoMaterial(pedido)` **antes de abrir o arquivo**, não grava `material` e grava
`material.recusado` (entidade `disciplina`). Para o professor, `tv` em material quer dizer: disciplina em que ele tem
vínculo confirmado. A busca é `busca @@ websearch_to_tsquery('portuguese', q)`, sempre com `escola_id` do contexto, só em
material `pronto` e não excluído.

### Time, Assistente, ferramentas e artefato (P, W) — `time/`, `assistente/`

| Rota | Entrada | Saída | Célula | Erros próprios | Auditoria |
|---|---|---|---|---|---|
| `GET /time` | | `esquemaRespostaTime` (`montarTime(suspensas)`) | `time.ler` C `un`, P `un` | | |
| `GET /assistente/conversa` | `esquemaConsultaConversaDoAssistente` | `esquemaRespostaConversaDoAssistente` | `assistente.ler_conversa` P `pr` | | |
| `POST /assistente/mensagens` | `esquemaPedidoMensagemAoAssistente` | 202 | `assistente.enviar_mensagem` P `pr` | `FUNCAO_SUSPENSA` | |
| `GET /execucoes/:id` | | `esquemaRespostaExecucao` | `execucao.ler` C, P, A `pr` | | |
| `POST /ferramentas/:ferramenta/gerar` | `esquemaParametroFerramenta`, `esquemaPedidoGerarComFerramenta` | 202 | `ferramenta.gerar` P `tv` | `FUNCAO_SUSPENSA`; na execução, `MATERIAL_INSUFICIENTE` | |
| `GET /artefatos` | `esquemaConsultaArtefatos` | `esquemaRespostaListaDeArtefatos` | `artefato.listar` P `tv` | | |
| `GET /artefatos/:id` | | `esquemaRespostaArtefato` | `artefato.ler` P `tv` | | |
| `PATCH /artefatos/:id` | `esquemaPedidoRenomearArtefato` | `esquemaRespostaArtefato` | `artefato.renomear` P `tv` | | |
| `GET /artefatos/:id/pdf` | | binário, `Content-Disposition: attachment` | `artefato.exportar` P `tv` | | |
| `POST /artefatos/:id/adaptar` | `esquemaPedidoAdaptarArtefato` | 202 | `artefato.adaptar` P `tv` | `FUNCAO_SUSPENSA`, `CONFLITO` (não é atividade, ou já é versão adaptada) | |
| `GET /entregas` | `esquemaConsultaEntregas` | `esquemaRespostaListaDeEntregas` | `entrega.listar` P `tv` | | |
| `POST /entregas/:id/decidir` | `esquemaPedidoDecidirEntrega` | `esquemaRespostaEntrega` | `entrega.decidir` P `tv` | `ENTREGA_JA_DECIDIDA`; `ENTRADA_INVALIDA` ao aprovar lote por aqui | `entrega.decidida` |

O conteúdo do artefato é `esquemaConteudoDoArtefato` (`assistente/conteudo.ts`): toda questão e todo plano citam material
e página. O catálogo de habilidades é `habilidadesDaDisciplina(nome, etapa)` (`assistente/habilidades.ts`): códigos nossos,
não da BNCC. A resposta do Assistente é `esquemaConteudoDaMensagemDoAgente`: texto com citações, ou a **proposta de
ferramenta** (a pergunta da D18).

### Atividade e correção (A, W) — `atividade/`

| Rota | Entrada | Saída | Célula | Erros próprios | Auditoria |
|---|---|---|---|---|---|
| `POST /atividades-aplicadas` | `esquemaPedidoAplicarAtividade` | 201 `esquemaRespostaAtividadeAplicada` | `atividade_aplicada.aplicar` P `tv` | `VERSAO_ADAPTADA_NAO_APROVADA`, `CONFLITO` (já aberta) | `atividade.aplicada` |
| `GET /atividades-aplicadas` | `esquemaConsultaAtividadesAplicadas` | `esquemaRespostaListaDeAtividadesAplicadas` | `atividade_aplicada.listar` P `tv` | | |
| `POST /atividades-aplicadas/:id/encerrar` | `esquemaPedidoSemCorpo` | `esquemaRespostaAtividadeEncerrada` | `atividade_aplicada.encerrar` P `tv` | | |
| `GET /minhas-atividades` | `esquemaConsultaMinhasAtividades` | `esquemaRespostaMinhasAtividades` | `minha_atividade.listar` A `pr` | | |
| `GET /atividades-aplicadas/:id/prova` | | `esquemaRespostaProva` (`questoesDaProva`) | `minha_atividade.ler_prova` A `pr` | | |
| `PUT /atividades-aplicadas/:id/respostas/:questao` | `esquemaNumeroDaQuestao`, `esquemaPedidoResponderQuestao` | `esquemaRespostaQuestaoSalva` | `minha_atividade.responder` A `pr` | `ATIVIDADE_ENCERRADA` | |
| `POST /atividades-aplicadas/:id/enviar` | `esquemaPedidoSemCorpo` | `esquemaRespostaAtividadeEnviada` | `minha_atividade.enviar` A `pr` | | |
| `GET /atividades-aplicadas/:id/meu-diagnostico` | | `esquemaRespostaMeuDiagnostico` | `minha_atividade.ler_diagnostico` A `pr` | `NAO_ENCONTRADO` até o lote ser aprovado | |
| `GET /atividades-aplicadas/:id/correcao` | | `esquemaRespostaCorrecaoDoLote` | `correcao.ler` P `tv` | | |
| `POST /atividades-aplicadas/:id/correcao/destaques/:alunoId/abrir` | `esquemaPedidoSemCorpo` | `esquemaRespostaDestaqueAberto` | `correcao.abrir_destaque` P `tv` | | `correcao.destaque_aberto` |
| `POST /entregas/:id/aprovar-lote` | `esquemaPedidoSemCorpo` | `esquemaRespostaLoteAprovado` | `entrega.aprovar_lote` P `tv` | `DESTAQUES_NAO_ABERTOS`, `ENTREGA_JA_DECIDIDA` | `lote.aprovado` |
| `GET /turmas/:id/desempenho` | `esquemaConsultaDesempenhoDaTurma` | `esquemaRespostaDesempenhoDaTurma` | `desempenho_da_turma.ler` P `tv`, C `na` | `ENTRADA_INVALIDA` (coordenação sem `finalidade`) | `turma.desempenho_lido` (só a coordenação) |

A prova do aluno é montada por `questoesDaProva(conteudo)`: copia número, enunciado e alternativas, e nada mais.

### Tutor e sinais (T, W) — `tutor/`

| Rota | Entrada | Saída | Célula | Erros próprios | Auditoria |
|---|---|---|---|---|---|
| `POST /tutor/mensagens` | `esquemaPedidoMensagemAoTutor` | 202 | `tutor.enviar_mensagem` A `pr` | `TUTOR_PAUSADO_EM_AVALIACAO`, `LIMITE_DIARIO_DO_TUTOR`, `PACOTE_DO_TUTOR_ESGOTADO`, `FUNCAO_SUSPENSA` | |
| `GET /tutor/conversa` | `esquemaConsultaConversaDoTutor` | `esquemaRespostaConversaDoTutor` | `tutor.ler_conversa` A `pr` | | |
| `GET /tutor/memoria` | | `esquemaRespostaMemoriaDoTutor` | `tutor.ler_memoria` A `pr` | | |
| `GET /sinais` | `esquemaConsultaSinais` | `esquemaRespostaSinais` | `sinal.ler` P `tv` | | |

### Governança e Analista (G) — `governanca/`

| Rota | Entrada | Saída | Célula | Erros próprios | Auditoria |
|---|---|---|---|---|---|
| `GET /governanca/resumo` | `esquemaConsultaResumoDaGovernanca` | `esquemaRespostaResumoDaGovernanca` | `governanca.ler_resumo` C `ag` | | |
| `GET /governanca/funcoes` | | `esquemaRespostaFuncoesDaGovernanca` | `governanca.ler_funcoes` C `un` | | |
| `POST /governanca/funcoes/:chave/suspender` | `esquemaChaveDeFuncao`, `esquemaPedidoSuspenderFuncao` | `esquemaRespostaFuncaoDaGovernanca` | `governanca.suspender_funcao` C `un` | | `funcao.suspensa` |
| `POST /governanca/funcoes/:chave/retomar` | `esquemaChaveDeFuncao`, `esquemaPedidoSemCorpo` | `esquemaRespostaFuncaoDaGovernanca` | `governanca.retomar_funcao` C `un` | `NAO_ENCONTRADO` (sem suspensão vigente) | `funcao.retomada` |
| `GET /governanca/consumo` | `esquemaConsultaConsumo` | `esquemaRespostaConsumo` | `governanca.ler_consumo` C `ag` | | |
| `GET /analista/resumo` | | `esquemaRespostaResumoDoAnalista` | `analista.ler_resumo` C `ag` | | |
| `POST /analista/gerar` | `esquemaPedidoGerarResumoDoAnalista` | 202 | `analista.gerar` C `un` | `FUNCAO_SUSPENSA` | |
| `GET /analista/nominal` | `esquemaConsultaAnalistaNominal` | `esquemaRespostaAnalistaNominal` | `analista.ler_nominal` C `na` | `ENTRADA_INVALIDA` (sem `finalidade`) | `analista.nominal_lido` |

## 4. Tabelas (migration 0022)

Todas têm `id uuid` com `uuidv7()` e `escola_id` com FK. "FK da turma" é `(escola_id, ano_letivo_id, turma_id)`; "FK com a
escola" é `(escola_id, x_id)`. "Gatilho de autor" é a função `exigir_usuario_da_escola` da 0013: confere que a pessoa é
da escola na gravação e **não é FK**, então o id fica depois da eliminação da pessoa.

| Tabela | Colunas | Restrições que importam |
|---|---|---|
| `material` | `disciplina_id`, `titulo`, `titularidade`, `licenciante?`, `licenca`, `declaracao`, `sha256`, `tamanho_bytes`, `paginas?`, `estado` (`processando`), `falha?`, `enviado_por?`, `enviado_em`, `excluido_por?`, `excluido_em?` | Check `declaracao` verdadeira e `licenca` nas quatro: não existe material sem licença. `licenciante` só, e sempre, em `terceiro_com_licenca`. Único parcial `(escola_id, sha256)` entre não excluídos e não falhos. Sem `ano_letivo_id`. Exclusão lógica; quem exclui apaga os `trecho` na mesma transação |
| `trecho` | `disciplina_id`, `material_id`, `pagina`, `texto`, `busca` (gerada, `to_tsvector('portuguese', texto)`) | Um por página: único `(escola_id, material_id, pagina)`. GIN `(escola_id, disciplina_id, busca)`. FK `(escola_id, disciplina_id, material_id)`, `cascade` |
| `execucao_agente` | `ano_letivo_id`, `funcao`, `tarefa`, `solicitada_por?`, `chave_envio`, `estado` (`pendente`), `entrada`, `resultado?`, `erro?`, `criada_em`, `iniciada_em?`, `concluida_em?` | Único `(escola_id, chave_envio)`. Check prende `tarefa` à `funcao`. `resultado` só na `concluida` e é só referência (`esquemaResultadoGravado`); `erro` só na `falhou`, em formato de código; `concluida_em` nas duas. `rodando` exige `iniciada_em`. Índice parcial das abertas `(escola_id, estado, criada_em)` |
| `consumo_ia` | `aluno_id?`, `execucao_id?`, `tarefa`, `funcao`, `perfil`, `origem`, `modelo`, `prompt_versao`, `tokens_de_entrada`, `tokens_de_saida`, `custo_micros` (0), `duracao_ms`, `envio_externo`, `tentativas`, `estado`, `codigo_de_erro?`, `entrada?`, `saida?`, `em` | **Sem coluna de usuário** (D64). `aluno_id` só nas funções do Tutor. Nas funções do Tutor, `entrada` e `saida` **nulas** (check). Índices `(escola_id, funcao, em)` e parcial `(escola_id, aluno_id, em)`. Sem `ano_letivo_id` |
| `thread_agente` | `ano_letivo_id`, `usuario_id`, `agente`, `criada_em` | Única por `(escola_id, ano_letivo_id, usuario_id, agente)`. Dono `cascade` |
| `mensagem_agente` | `ano_letivo_id`, `thread_id`, `execucao_id`, `autor`, `conteudo`, `turma_id?`, `disciplina_id?`, `criada_em` | Única por `(escola_id, execucao_id, autor)`. `turma_id` e `disciplina_id` só, e sempre, na mensagem do `usuario`. Só o `agente` propõe ferramenta |
| `artefato` | `ano_letivo_id`, `turma_id`, `disciplina_id`, `tipo`, `titulo`, `conteudo`, `origem_id?`, `execucao_id?`, `criado_por?`, `criado_em`, `atualizado_em` | Versão adaptada é a que tem `origem_id`. Check: `conteudo.adaptacao` só nela, com `tipos` de lista fechada e sem outra chave. Único parcial `(escola_id, execucao_id)`. `conteudo` não muda depois de gravado |
| `entrega` | `ano_letivo_id`, `turma_id`, `funcao`, `tipo`, `artefato_id?`, `atividade_aplicada_id?`, `execucao_id?`, `estado` (`pendente`), `decidida_por?`, `decidida_em?`, `justificativa?`, `criada_em` | Aprovada ou rejeitada ⇔ `decidida_por` e `decidida_em`. Rejeitada ⇔ `justificativa` (8 a 500). `versao_adaptada` ⇔ `artefato_id`; `lote_de_correcao` ⇔ `atividade_aplicada_id`. Uma por versão adaptada; um lote não rejeitado por aplicação. **Lote só fica `aprovada` com `validacao_do_lote`** (gatilho adiado para o commit). Gatilho de autor em `decidida_por` |
| `atividade_aplicada` | `ano_letivo_id`, `turma_id`, `artefato_id`, `avaliativa`, `estado` (`aberta`), `aplicada_por`, `aplicada_em`, `encerrada_em?` | Gatilho: só `atividade_objetiva`, e versão adaptada **só com entrega `aprovada`**. Única aberta por `(escola_id, turma_id, artefato_id)`. Gatilho de autor em `aplicada_por` |
| `tentativa_atividade` | `ano_letivo_id`, `atividade_aplicada_id`, `aluno_id`, `iniciada_em`, `enviada_em?` | Única por `(escola_id, ano_letivo_id, atividade_aplicada_id, aluno_id)`. Aluno `cascade` |
| `resposta_atividade` | `ano_letivo_id`, `atividade_aplicada_id`, `aluno_id`, `questao`, `alternativa`, `respondida_em` | Única por tentativa e `questao`: é o alvo do `on conflict do update`. FK para a tentativa, `cascade`. Em branco não tem linha |
| `correcao` | `ano_letivo_id`, `entrega_id`, `atividade_aplicada_id`, `aluno_id`, `acertos`, `total`, `em_branco`, `por_habilidade`, `destaques` (`text[]`), `destaque_aberto_em?`, `destaque_aberto_por?`, `corrigida_em` | Única por `(escola_id, entrega_id, aluno_id)`. Só de entrega que é lote. `destaques` de lista fechada; só destaque se abre. Some com a tentativa |
| `validacao_do_lote` | `ano_letivo_id`, `entrega_id`, `atividade_aplicada_id`, `apresentado`, `aberto`, `confirmada_por`, `confirmada_em` | Uma por lote. Check: **todo destaque de `apresentado` está em `aberto`**. Gatilho de autor em `confirmada_por`. É cópia: fica depois da eliminação do aluno |
| `mensagem_tutor` | `ano_letivo_id`, `turma_id`, `aluno_id`, `execucao_id`, `atividade_aplicada_id?`, `material_id?`, `autor`, `tipo` (`texto`), `texto`, `citacoes?`, `criada_em` | Única por `(escola_id, execucao_id, autor)`. `assunto_delicado` e `citacoes` só do `tutor`. Aluno `cascade`. Índices `(escola_id, aluno_id, id)` e parcial `(escola_id, turma_id, criada_em, aluno_id)` das do aluno |
| `sinal_tutor` | `ano_letivo_id`, `turma_id`, `aluno_id`, `execucao_id?`, `tipo`, `atividade_aplicada_id?`, `questao?`, `material_id?`, `pagina?`, `criado_em` | **Sem coluna de texto.** `atencao_humana` com qualquer referência é recusado. Único parcial `(escola_id, execucao_id, tipo)`. Aluno `cascade` |
| `suspensao_de_funcao` | `funcao`, `motivo?`, `suspensa_por`, `suspensa_em`, `retomada_por?`, `retomada_em?` | Único parcial `(escola_id, funcao)` entre as vigentes (`retomada_em is null`): é a consulta "está suspensa agora?". Sem `ano_letivo_id` |
| `resumo_do_analista` | `ano_letivo_id`, `execucao_id?`, `conteudo`, `gerado_em` | `conteudo` é `esquemaConteudoDoResumoDoAnalista`: agregado, sem pessoa e sem texto livre. Um por execução |

`configuracao_operacional_escola` ganhou `tutor_trocas_por_dia` e `tutor_trocas_por_mes`, nulas: nulo vale
`TROCAS_POR_DIA_PADRAO_DO_TUTOR` (60) e `TROCAS_POR_MES_PADRAO_DO_TUTOR` (300).

O que o `jsonb` de cada coluna guarda: `artefato.conteudo` → `esquemaConteudoDoArtefato` · `mensagem_agente.conteudo` →
`esquemaConteudoDaMensagemDoUsuario` ou `esquemaConteudoDaMensagemDoAgente` · `execucao_agente.entrada` →
`esquemaEntradaDaExecucao` · `execucao_agente.resultado` → `esquemaResultadoGravado` · `correcao.por_habilidade` →
`esquemaDiagnosticoGravado` · `validacao_do_lote.apresentado` → `esquemaLoteApresentado` · `validacao_do_lote.aberto` →
`esquemaDestaquesAbertos` · `mensagem_tutor.citacoes` → `Citacao[]` · `resumo_do_analista.conteudo` →
`esquemaConteudoDoResumoDoAnalista`. Valide na gravação e na leitura.

## 5. Decisões de modelagem

1. **A chave de idempotência se chama `chaveEnvio`** (`chave_envio`), como na reivindicação da A1. É a `chave` da `ExecucaoAgendada` da camada de IA.
2. **A execução guarda referência, não texto.** `resultado` tem só ids; a mensagem do Assistente e a do Tutor ficam nas tabelas delas, e cada linha produzida aponta para a execução por `execucao_id`, com índice único: reexecutar não duplica (D49).
3. **`tarefa` usa os nomes do catálogo da camada de IA** (`TAREFAS_DE_IA`), na execução e no consumo. O banco prende a tarefa à função, e é pela função que a suspensão vale.
4. **O erro da execução é um `CodigoDeErro`.** Os da camada de IA entraram no catálogo; a tela mostra `MENSAGENS_DE_ERRO[erro]`.
5. **`consumo_ia` não tem usuário** (D64). O aluno entra só nas funções do Tutor, e ali `entrada` e `saida` ficam nulas: texto de aluno fica só em `mensagem_tutor`.
6. **O freio do dia conta `consumo_ia` do aluno; o pacote do mês conta `mensagem_tutor` da turma.** Uma linha por troca nos dois. Os limites são configuração da escola (D38, D41).
7. **Aprovar o lote exige a validação, no banco.** Gatilho adiado na `entrega`, e check dos destaques na `validacao_do_lote`. A regra não depende de o serviço lembrar (D56).
8. **A versão adaptada só chega à turma aprovada, no banco.** Gatilho na `atividade_aplicada` (regra 70, item 3).
9. **Aplicar é a aprovação registrada da atividade original.** `aplicada_por` é obrigatório e auditado.
10. **Quem aprovou, aplicou, validou, abriu e suspendeu não é FK.** O id fica depois da eliminação da pessoa, como na auditoria. O que é do aluno (tentativa, resposta, correção, conversa, sinal) sai com ele, por `cascade`.
11. **A correção pendura na tentativa.** Quem nunca abriu a atividade não tem correção nem destaque: faltar não é ficar em branco.
12. **O destaque é por aluno** (a rota é `/destaques/:alunoId/abrir`). O erro concentrado numa questão aparece em `resumo.porQuestao`, com a contagem por alternativa.
13. **O desempenho da turma, para a coordenação, é `nominal_auditado`**, com `finalidade`. Ver a seção 7.
14. **O resumo do Analista não tem texto livre.** Alerta é tipo, número, referência e hipótese de lista fechada (`HIPOTESES_DO_ANALISTA`); a tela monta a frase. Recorte com menos de dois professores é recusado pelo schema e aparece só em `recortesNominais`, sem número.
15. **A governança não mostra turma nem quem decidiu.** O item tem função, tipo, estado, datas e a série.
16. **O motivo da suspensão é opcional e de lista fechada.** O mockup não tem campo de motivo; texto livre ali guardaria nome.
17. **O catálogo de habilidades tem códigos nossos** (`QUI.EM.05`), sem afirmar correspondência com a BNCC.
18. **Material não tem ano letivo**, e a recusa por licença não grava `material` (decisão do orquestrador).
19. **`btree_gin`** entrou para o índice de busca começar pela escola (regra 80, item 8).

## 6. O que o schema não segura, e cada pacote precisa garantir com teste

- **M**: conferir a disciplina antes da recusa; nunca logar título, licenciante nem nome de arquivo; apagar os `trecho` ao excluir.
- **P**: gravar a execução e a mensagem do professor na mesma transação; relê-la pela chave no 23505 e conferir que é de quem pede; conferir a suspensão antes de gravar; versão adaptada nasce com a `entrega` na mesma transação do artefato; o `PATCH` atualiza a coluna `titulo` e o `conteudo.titulo` juntos; no `decidir`, `update … where estado = 'pendente'`.
- **A**: a prova sai de `questoesDaProva`; `meu-diagnostico` junta a entrega com `estado = 'aprovada'` e responde como inexistente sem ela; `PUT` de resposta recusa depois do envio e do encerramento; `aprovar-lote` grava a validação e a aprovação na mesma transação, com o `apresentado` igual ao que a rota de correção mostrou; desempenho só de lote aprovado.
- **T**: o Tutor **não usa nem diz** o resultado de correção ainda não aprovada (memória só de lote aprovado e de sinais); `atencao_humana` sem referência; nunca copiar texto do aluno para sinal, execução ou consumo; `pg_advisory_xact_lock` do aluno antes de contar o freio; avaliativa aberta trava no servidor.
- **G**: nenhuma consulta agrupa, filtra ou ordena por professor; `nominal` e desempenho gravam auditoria a cada leitura; recorte com um professor só vai para `recortesNominais`; o resumo é validado pelo schema antes de gravar.
- **Camada de IA**: o registro de consumo precisa mandar `entrada` e `saida` nulas quando a tarefa leva texto de aluno; a varredura das interrompidas precisa preencher `concluida_em`.

## 7. Onde este contrato se afasta do plano, e por quê

- **`GET /turmas/:id/desempenho` para a coordenação.** O plano (`docs/mvp-rapido.md`, seção 7) diz "coordenação em agregado". O contrato pede `finalidade` e grava auditoria (`nominal_auditado`): a resposta nomeia alunos (D34), e o desempenho de uma turma numa disciplina é o de um professor só, que a D45 revista trata como nominal. O agregado sem pessoa é o do resumo do Analista.
- **`POST` com `chaveEnvio` no corpo.** O plano lista os corpos sem a chave; a seção 4, item 1, pede idempotência por chave, e ela precisa vir da tela.
- **`licenciante` no envio de material.** O plano lista titularidade, licença e declaração; o material de terceiro precisa dizer de quem é a licença (`docs/modelo-de-dados.md`, "Conteúdo").
- **Glossário.** Atividade aplicada, tentativa, destaque, validação do lote, suspensão de função e trecho ficaram sem verbete novo: `docs/glossario.md` não era arquivo do pacote S.
