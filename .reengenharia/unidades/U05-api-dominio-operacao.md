# U05 — apps/api parte 2: atividade, entrega, material, governanca, privacidade, sala, operacao, ops

Caminhos relativos a `apps/api/`. [código] = lido no arquivo; [doc] = dito em doc; [hipótese] = a conferir.

## 1. Finalidade e limites

| Módulo | Faz | Linhas (prod / teste ao lado) |
|---|---|---|
| `src/atividade` | A professora aplica uma atividade objetiva, encerra (corrige por gabarito, sem IA), abre os destaques e aprova o lote com registro da validação. O aluno responde por questão, envia e lê o diagnóstico. Desempenho da turma. | 1998 / 1798 |
| `src/entrega` | Fila do que a IA produziu e espera decisão humana (hoje: versão adaptada e lote de correção). | 235 / 368 |
| `src/material` | Coordenação envia PDF com titularidade e licença declaradas, extrai texto por página, busca de trechos (`BuscaDeTrechos`, porta para Assistente e Tutor). | 1186 / 283 |
| `src/governanca` | Coordenação: resumo de entregas decididas, suspensão por função, consumo de IA, e o Analista de desempenho (resumo agregado e leitura nominal auditada). | 1016 / 872 |
| `src/privacidade` | LGPD operacional da coordenação: retenção, suboperadores, incidentes, pedidos do titular, "Meus dados", URL assinada do arquivo. | 1271 / 0 |
| `src/sala` | **Não é modo sala nem WebSocket.** É a entrada do aluno: professor gera link e código da turma, página pública da sala, reivindicação de nome, decisão do pedido (A1). | 1414 / 407 |
| `src/operacao` | Área da equipe Turmma (D76): convite, e-mail+senha, MFA, renovar e sair do operador, mais o painel (rede, escola, uso, convite da coordenação). | 2331 / 220 |
| `src/ops` | Comandos `npm run ops:*` (CLI) **e** os casos de uso que o painel reaproveita (`criarRede`, `criarEscola`), mais `migrar.ts` do compose. | 2276 / 544 |

Total de produção: ~11,7 mil linhas em 102 arquivos. Testes em `test/` ligados a esta unidade: cerca de 18 mil linhas [hipótese: a conta inclui `retencao`, `compartilhamento` e `eliminacao-agendada`, que também tocam `packages/nucleo`].

Não é desta unidade: login e sessão da escola (`sessao/`), CRUD da estrutura (`estrutura/`), Assistente, Tutor, artefato, IA, jobs do worker (`montar-arquivo`, expurgo), esquema de banco e auditoria (`packages/nucleo`), contratos (`packages/shared`).

Não existe WebSocket na API. `grep` por `WebSocket`, `socket.io` e `@nestjs/websockets` em `apps/` e `packages/` não achou nada fora de `apps/realtime`. O modo sala ao vivo de `docs/arquitetura.md` ("apps/realtime WebSocket, modo sala") não tem relação com o `src/sala` da API [doc × código, seção 11].

## 2. Pontos de entrada

Todas as rotas usam `@Permite(recurso, ação)`: a célula da `MATRIZ` em `packages/shared` define o alcance (`turma_vinculada`, `proprio`, `unidade`, `nominal_auditado`). Quase todas saem com `Cache-Control: no-store`.

| Rota | Quem | Arquivo |
|---|---|---|
| `POST/GET /v1/atividades-aplicadas`, `POST :id/encerrar`, `GET :id/correcao`, `POST :id/correcao/destaques/:alunoId/abrir` | professor | `atividade/atividade-aplicada.controller.ts` |
| `POST /v1/entregas/:id/aprovar-lote` | professor | `atividade/lote.controller.ts` |
| `GET /v1/turmas/:id/desempenho` | professor; coordenação com finalidade | `atividade/desempenho.controller.ts` |
| `GET /v1/minhas-atividades`, `GET :id/prova`, `PUT :id/respostas/:questao`, `POST :id/enviar`, `GET :id/meu-diagnostico` | aluno | `atividade/minha-atividade.controller.ts` |
| `GET /v1/entregas`, `POST /v1/entregas/:id/decidir` | professor | `entrega/entrega.controller.ts` |
| `POST/GET/DELETE /v1/materiais`, `GET busca`, `GET :id` | coordenação envia e exclui; professor lê | `material/material.controller.ts` (upload multipart) |
| `/v1/governanca/{resumo,funcoes,consumo}`, `POST funcoes/:chave/suspender` e `retomar` | coordenação | `governanca/governanca.controller.ts` |
| `/v1/analista/{resumo,gerar,nominal}` | coordenação | `governanca/analista.controller.ts` |
| `/v1/privacidade/*` (12 rotas) e `/v1/meus-dados` (2) | coordenação (com MFA); aluno e professor em "Meus dados" | `privacidade/*.controller.ts` |
| `POST /v1/salas/abrir`, `/reivindicar` | anônimo (`@RotaAnonima`) | `sala/salas.controller.ts` |
| `/v1/turmas/:id/acesso` (gerar, ler, revogar), `/v1/turmas/:id/reivindicacoes`, `POST /v1/reivindicacoes/decidir`, `GET /v1/minha-turma` | professor; coordenação; aluno | `sala/*.controller.ts` |
| `/v1/operacao/*` (painel 8 rotas, `eu`) com `@RotaDeOperacao`; entrada com `@EntradaDeOperacao` (convite 2, e-mail, mfa 2, renovar, sair) | operador | `operacao/*.controller.ts` |
| `ops:*` (12 scripts na raiz `package.json:27-38`) | equipe, via terminal | `src/ops/*.ts` |
| `dist/ops/migrar.js` | serviço `migrar` do compose | `infra/compose.yml:122` |

Sem worker, fila ou webhook próprios nesta unidade. As únicas tarefas em segundo plano são: a fila de extração de PDF em memória (`material/fila-de-extracao.ts`), a varredura de materiais parados a cada 60 s (`material/material.module.ts:CicloDaExtracao`) e o job `montar-arquivo`, que a API só enfileira (`privacidade/privacidade.service.ts:238`).

## 3. Fluxos e invariantes

**Aprovação do lote de correção (D33, D56).** [código]
1. O encerramento (`atividade-aplicada.service.ts:encerrar`) trava a aplicação `FOR UPDATE`, corrige por gabarito dentro da mesma transação e cria o lote `pendente` com as correções. Se já há lote vigente, não corrige de novo. Se a função está suspensa, não cria lote.
2. `GET :id/correcao` monta o que é apresentado e grava no Redis uma marca (hash) de "esta professora leu isto" (`leitura-do-lote.ts`, validade de 12 h).
3. `abrirDestaque` grava quem abriu e quando, uma vez só (`correcao.repository.ts:260`).
4. `aprovarLote` (`correcao.service.ts:150`) trava a entrega `FOR UPDATE` e remonta o lote. Exige que a marca lida seja igual à marca atual (senão `CONFLITO`, linha 161) e que todos os destaques estejam abertos (linha 167). Grava `validacao_do_lote` (copia do apresentado e do aberto, mais `confirmadaPor`), muda a entrega para `aprovada` e audita `lote.aprovado`, tudo na mesma transação. O corpo é vazio e estrito, então nada do cliente entra no registro.

Onde cada garantia mora:

| Garantia | Onde |
|---|---|
| Autor humano da decisão | Estrutura: o único `update` usa `sessaoDaRequisicao().usuarioId` (`correcao.repository.ts:293`, `entrega.repository.ts:101`). O check `entrega_decisao_registrada` exige `decidida_por` e `decidida_em` quando o estado não é `pendente` (`packages/nucleo/src/db/schema/entrega.ts:99`). O gatilho `exigir_equipe_da_escola` exige que o autor seja professor ou coordenação da escola (`drizzle/0023_mvp_restricoes.sql:76`). |
| Lote só aprovado com validação | Gatilho adiado `exigir_validacao_do_lote_aprovado` (0023:115) e `exigir_destaques_do_lote_abertos` (0023:91). O banco recusa mesmo por fora da API. |
| Dois cliques em aprovar | `FOR UPDATE` mais `update ... where estado='pendente'` mais índice único `(escola_id, entrega_id)` em `validacao_do_lote`; o segundo clique recebe `ENTREGA_JA_DECIDIDA`. Há teste em `atividade/correcao.int.test.ts`. |
| Lote de correção não se aprova por `/decidir` | Convenção no service (`entrega.service.ts:55`); só rejeitar passa por ali. Falta barreira no banco [hipótese: o teste de `entrega.int.test.ts` cobre isso; conferir]. |
| Não existe `Nota` | Não há tabela nem classe de nota em `packages/` ou `apps/` (grep por `lancadaPor`, `class Nota` e `pgTable('nota` vazio). A regra 70 item 1 ainda não tem objeto a proteger; o diagnóstico (acertos por habilidade) só aparece ao aluno quando o lote está `aprovada` (`minha-atividade.repository.ts:241`, join com `entrega.estado='aprovada'`). |
| D55 (sem IA em discursiva) | Só há `atividade_objetiva`; outro tipo é `ENTRADA_INVALIDA` (`atividade-aplicada.service.ts:aplicar`). A correção é função pura (`correcao-de-objetiva.ts`). Nenhum campo guarda nota, conceito ou texto sobre aluno (D46, D57). |
| Auditoria | Porta única tipada, `RegistroDeAuditoria.gravar(tx, acao, dados)`, com catálogo fechado e schema por ação (`packages/nucleo/src/auditoria/acoes.ts`, 57 ações). Grava na transação de quem chama, com o contexto. Leituras nominais pela coordenação gravam na mesma transação, antes da resposta: `turma.desempenho_lido`, `analista.nominal_lido`, `turma.reivindicacoes_lidas`, `titular.arquivo_baixado`. A justificativa da rejeição não vai para a auditoria. |
| Tenant | Todo repository lê `exigirEscolaDoContexto()` e `exigirAnoEmCurso()`; os repositories de escola não recebem `escolaId` por argumento. Os únicos `escolaId` por argumento ficam em `sala/limites-da-sala.ts:111,122,133` (rota anônima, escola vinda do acesso achado) e em `painel.service.ts:133` (operador). Id inexistente, de outra escola ou fora do formato responde `NAO_ENCONTRADO` (`estrutura/entrada.ts:idDoCaminho`). |
| Resposta de atividade salva por item | `PUT respostas/:questao` faz upsert por `(escola, ano, aplicação, aluno, questão)` e usa `now()` do banco (`minha-atividade.repository.ts:215`). Resposta depois do encerramento ou do envio é recusada com a aplicação travada `FOR SHARE`. Não há relógio de prova nem prazo por aluno; é atividade, não prova online (regra 80 item 6 só vale em parte). |

**Material com licença (D5, D75).** [código] `material.service.ts:enviar`: confere a disciplina, depois a licença e a titularidade (recusa grava `material.recusado` e responde `MATERIAL_SEM_LICENCA` sem ler byte), depois a assinatura `%PDF-`, depois os tetos de envio (por pessoa 30/h, por escola 60/h, 3 em processamento por escola) sob trava da escola. O índice único por sha256 recusa o mesmo arquivo na escola. O PDF **não é guardado**: os bytes ficam na memória da instância até a extração acabar. Por isso **não há URL assinada no material**. A única URL assinada da unidade é a do arquivo do titular (`privacidade.service.ts:434`, S3 com validade de 5 min, uma tentativa e 5 s de prazo: `configuracao-do-armazem.ts:42-43`).

**Reivindicação de nome (sala).** [código] Hash argon2id sempre, mesmo quando a matrícula não bate (`reivindicacao.service.ts`), para não vazar pelo tempo; contadores no Redis por escola, nome e turma; reenvio idempotente pela `chaveEnvio`. A decisão do professor ou da coordenação cria o usuário aluno e o vínculo (`decisao.service.ts:131`): uma transação por id, então um lote que falha no meio deixa os anteriores decididos (documentado no próprio service).

**Operador.** [código] `GuardaDeOperador` responde 404 a credencial que não é de operador, 401 a sessão encerrada ou acesso vencido, e 503 a banco fora, sem deslogar. `ops/comando.ts:autorDoComando` confere o `OPERADOR` ativo como primeira instrução da transação. O mesmo caso de uso serve o CLI e o painel.

## 4. Dependências

- Internas, para fora: `@educa/nucleo` (esquema, auditoria, contexto, fila, `ArmazemS3`, `CicloDeVidaService`) e `@educa/shared` (contratos zod, `MATRIZ`, catálogo de funções). Dentro da API: `estrutura/` (`entrada.ts`, `turma.repository`, `vinculo.repository`, `disciplina.repository`), `assistente/turma-do-professor.repository` (helpers de vínculo, usados por atividade e entrega), `ia/` (`ConferenciaDeFuncao`, `AgendadorDeExecucoes`), `sessao/` (tudo de login que o operador reaproveita).
- Quem usa esta unidade: `material` é global (exporta `BuscaDeTrechos` para assistente, tutor e artefato). `entrega` só é usada por `artefato/artefato.service.ts` (`criarDaVersaoAdaptada`). `ops/escola.ts` é usado por `operacao/painel.service.ts`. `sessao/convite.service.ts` guarda os casos de uso do convite da coordenação, e `ops` e `operacao` o chamam.
- Acoplamento entre módulos da unidade: `ops/revogar-acessos-sala.ts` importa `sala/acesso-da-turma.repository`. `ops/comando.ts` importa `operacao/operador.repository`, e `operacao/painel.service.ts` importa `ops/escola`: dependência nos dois sentidos entre pastas. `sessao/convite.service.ts:25` importa só o tipo de `operacao/operador.repository` (ciclo de tipo entre `sessao` e `operacao`).
- Externas: Postgres (Drizzle), Redis de login e de fila (`ioredis`), S3 compatível (`ArmazemS3`), `pdfjs-dist` (extração), `pdfkit` (declarado na dependência; uso nesta unidade não encontrado), `otpauth`, `@node-rs/argon2`, `jose`. Nenhum provedor de IA é chamado direto: o Analista passa por `AgendadorDeExecucoes`, e a correção de objetiva é uma conta, sem modelo.

## 5. Dados

Esta unidade lê e escreve: `entrega`, `correcao`, `validacao_do_lote`, `atividade_aplicada`, `tentativa_atividade`, `resposta_atividade`, `artefato` (lê), `material` e `trecho`, `suspensao_de_funcao`, `resumo_do_analista`, `consumo_ia`, `execucao_agente`, `mensagem_tutor` e `sinal_tutor` (lê), `pedido_titular` e `arquivo_titular`, `lista_nome`, `acesso_turma`, `pedido_reivindicacao`, `vinculo`, `usuario`, e as seis tabelas de operador (sem `escola_id`, exceção da regra 10, item 1, cobrida por teste). Migrations `0022` (MVP) a `0036` em `packages/nucleo/drizzle`.

Tabelas compartilhadas com outros módulos: `entrega` é criada por `artefato` (versão adaptada) e por `atividade` (lote) e lida por `governanca`; `correcao` é lida por `atividade`, `governanca/analista` e `desempenho`. A mesma junção `artefatoDaAplicacao` aparece copiada em `correcao.repository.ts`, `minha-atividade.repository.ts` e `atividade-aplicada.repository.ts` [código, grep]. `comVinculoConfirmadoDoProfessor` é o helper único de vínculo, mas mora em `assistente/`.

## 6. Contratos

- Entrada e saída: esquemas zod estritos em `packages/shared`, aplicados na borda por `lerEntrada(esquema, corpo)` (62 usos em controllers) e conferidos de novo na saída por `esquemaResposta*.parse(...)` nos services. Campo a mais, como `escolaId`, vira `ENTRADA_INVALIDA`. Isso substitui a camada `dto` do desenho de `docs/arquitetura.md`. Teste de contrato de saída: `test/contratos.test.ts` varre todos os esquemas exportados atrás de credencial, segredo ou e-mail.
- Inconsistência: cerca de 20 controllers (operacao, sessao, estrutura; alguns usam `safeParse` por outro motivo) fazem `safeParse` e `throw ENTRADA_INVALIDA` na mão em vez de `lerEntrada`. Só `operacao/painel.controller.ts` tem 5 (linhas 61-91).
- Porta de IA: `BuscaDeTrechos` (`material/busca-de-trechos.ts`) é a interface para Assistente e Tutor. Ela não confere se a pessoa alcança a disciplina; quem chama confere (comentário em `busca-de-trechos.ts:36`).
- Job de fila `montar-arquivo`: o produtor passa `dados: { pedidoId }` (`privacidade.service.ts:238`), mas `Enfileirador` tipa `dados` como `Record<string, unknown>` (`packages/nucleo/src/fila/enfileirador.ts:12`). O consumidor valida com zod próprio (`apps/worker/src/processadores/montar-arquivo.ts:20`). O contrato é por convenção: há duas definições do mesmo formato, e só o consumidor valida.
- Auditoria: contrato forte (catálogo `ACOES_DE_AUDITORIA` com schema por ação).
- Contrato implícito: o argumento do log `sala.limite_atingido` é conferido por teste em `infra/test/alertas.test.ts` (comentário em `sala/limites-da-sala.ts`, não conferido por mim).

## 7. Testes

- Camadas: unidade ao lado do código (~25 arquivos `.test.ts`); integração com Postgres real em `*.int.test.ts`, **em dois lugares**: `atividade`, `entrega` e `governanca` guardam os `.int.test.ts` em `src/`, e `material`, `sala`, `operacao`, `ops` e `privacidade` os guardam em `test/` (88 arquivos). Não há e2e no escopo da API.
- Proteção real: o teste de arquitetura (`test/arquitetura.test.ts`, 1403 linhas, 17 `describe`) é uma função de aptidão forte. Confere que `ResolucaoDeTenantRepository` fica em `sessao/`, que a leitura entre escolas mora só em `PainelRepository` e só `painel.service` o usa, que as seis tabelas da operação só passam por `OperadorRepository`, que todo `@RotaDeOperacao` tem a guarda e conta em `rl:op`, que as rotas de entrada da operação são exatamente sete, que nenhuma rota cria operador, que toda tabela sem `escola_id` está nas exceções, e que toda tabela das migrations está classificada para retenção e arquivo. Há teste de isolamento por módulo (`atividade-isolamento.int.test.ts`, `material-isolamento.int.test.ts`, `operacao-isolamento.int.test.ts`) e de corrida (`segundo-fator-operador-concorrencia.int.test.ts`, 8 casos).
- Áreas pouco cobertas: `privacidade/` não tem teste ao lado, mas tem `pedido-titular`, `arquivo-do-titular`, `eliminacao-agendada`, `compartilhamento` (3,9 mil linhas em `test/`). `ops/migrar.ts` e `ops/sessao-sintetica.ts` não têm teste ao lado [hipótese: coberto por `jobs-sinteticos` e o compose; conferir]. Sem teste de contrato entre API e worker para `montar-arquivo` na API.
- Sinais de fragilidade: arquivos de integração enormes (`arquivo-do-titular.int.test.ts` 1404 linhas, `pedido-titular` 1240, `painel-convite` 958, `salas-reivindicar` 931). Muito setup duplicado em auxiliares por módulo (`sala-de-teste.ts`, `atividade-de-teste.ts`, `material-de-teste.ts`, `painel-de-teste.ts`). Testes sem sinal evidente de serem decorativos; as mutações estão no portão, não as li.

## 8. Resiliência e escala

- Idempotência: `ON CONFLICT` e `UPDATE ... WHERE estado` nas escritas críticas (aprovar lote, decidir entrega, suspender função, reivindicar, registrar pedido por `chaveEnvio`, concluir pedido). Aplicação travada em encerrar. Só `ops:incidente` não tem chave de idempotência e grava dois incidentes se rodar duas vezes (`docs/runbook.md:518`).
- Estado em memória: **a fila de extração de PDF** (`material/fila-de-extracao.ts`) e os bytes do PDF vivem na memória da instância, contra a regra 80 item 5. É a exceção declarada em D77, com `TODO(fila)` na linha 42 descrevendo o plano (job do worker, objeto temporário no storage). A varredura de parados (`INTERVALO_DA_VARREDURA_MS = 60 s`) cobre a queda do processo. A extração (`pdfjs`) usa CPU da instância da API, com teto de 2 simultâneas no processo e 1 por escola.
- Redis fora: a leitura do lote não marca; a aprovação responde 503 `INDISPONIVEL_TENTE_DE_NOVO` e não aprova sem conferir (`leitura-do-lote.ts`). Os contadores da sala caem para memória "no seguro", com `instancias` para dividir o teto.
- Limites: por pessoa e por escola, nunca só por IP (envio de material, pedidos de IA do Analista, busca de titulares 30/min). Paginação por id v7 com `limite+1` (`paginar`). Sem paginação: lista de alunos em `desempenho` (teto `MAXIMO_DE_ALUNOS_NO_DESEMPENHO`), habilidades cortadas em 60 por `slice`, 100 recortes no Analista.
- Observabilidade: logs só com ids e códigos, métrica `sala.reivindicacao{resultado}`, avisos espaçados (`avisoEspacado`). Não vi métrica de latência ou de fila na extração.
- Pontos fracos: `GET :id/prova` faz escrita (cria a tentativa) dentro de uma transação de leitura (`minha-atividade.service.ts:77`). Upsert de resposta é "último a chegar vence" sem número de sequência; reenvio atrasado de uma resposta antiga pode sobrescrever a nova [hipótese: confirmar se a web enfileira em ordem]. `pedidos.repository.ts:180` usa `new Date()` da aplicação em vez de `now()` do banco, ao contrário do resto. Os comandos `ops:*` rodam com `--env-file=.env.example` e reconstroem três pacotes a cada chamada (`package.json:27-38`) [hipótese: pensado para dev; produção usa outro caminho; conferir no runbook].

## 9. Suspeitas de código morto

- Não achei função de negócio sem uso. Procurei por símbolo exportado sem referência fora do próprio arquivo em `apps packages tools e2e`. Deu cerca de 110 símbolos, quase todos **tipos e constantes exportados sem consumidor**, por exemplo `ArtefatoParaAplicar`, `NovaAplicacao`, `ProvaLida`, `DependenciasDoMaterial`, `TENTATIVAS_DO_ARMAZEM_NA_API`. Parte é uso interno do arquivo; parte são tipos pensados para teste. É ruído de `export`, não código morto.
- Funções exportadas só usadas no próprio arquivo: `etapaDaEntrada` (`operacao/entrada.service.ts`), `lerPedidoDeIncidente`, `consultarPrivacidade`, `lerPedidoDePrivacidade`, `ajustarRetencao`, `listarRetencao`, `revogarAcessosDaEscola`, `cadastrarSuboperador`, `encerrarSuboperador`, `lerPedidoDeSuboperador`, `lerPedidoDeSessao`. Em `ops/`, a referência dinâmica é o script de `package.json` (`node dist/ops/<nome>.js`) e `import.meta.url` no fim de cada arquivo.
- Atalhos de compatibilidade: `ops/escola.ts` reexporta `abrirBancoDeOperacao`, `ArgumentoInvalido`, `lerOperador` ("para quem já o importava daqui"), e `ops/uso.ts:22` reexporta `urlDoBancoDeOperacao`. `ops/sessao-sintetica.ts:7` ainda importa essa função de `./uso.js`, em vez de `./comando.js`. Os testes de `uso.test.ts` também importam de lá.
- `CicloDaExtracao` e `CicloDoArmazem` não têm importador porque são providers só pelo hook de ciclo de vida do Nest (DI).
- `pdfkit` e `@types/pdfkit` estão em `apps/api/package.json`, mas não achei uso em `src/` desta unidade [hipótese: é do PDF de demonstração em `tools/demonstracao/` ou de outro módulo; conferir com grep em `apps/api/src`].

## 10. Duplicação e inconsistência

- Nomes que confundem: `ops/` (CLI e casos de uso e migrador), `operacao/` (rotas do operador), `src/sala` (reivindicação, não modo sala) e `arquitetura.md`. `ops/escola.ts` é o "caso de uso" do painel e também o CLI; `operacao/painel.service.ts` importa dele.
- Pilha do operador paralela à da escola: `operacao/entrada.service`, `segundo-fator.service` (226), `sessao.service`, `desafio-de-operador`, `convite-operador.service` espelham `sessao/login.service`, `mfa.service` (186), `renovacao.service`, `desafio`, `convite.service`. A reutilização é por funções (`hashDoRefresh`, `ipParaRegistro`, `passoDoCodigo`), mas os serviços e controllers são cópias com diferenças. Há 5 controllers só para as rotas de entrada e sessão do operador.
- Repetição de padrões: a tradução do alcance da matriz para o escopo do repository existe em três versões (`sala/decisao.service.ts:alcanceDaSessao`, `material.service.ts:alcanceDoMaterial`, `desempenho.service.ts` inline). `CorrecaoLida` e `NovaCorrecao` repetem campos. Todo comando `ops:*` repete `try/catch` com o mesmo mapeamento de códigos de saída (0, 1, 2).
- `@SemEscopo` na unidade: 7 ocorrências (`material.repository.ts:321`, `painel.repository.ts:121,133,200`, `ops/escola.repository.ts:25,34`, `ops/operacao-privacidade.repository.ts:129`). A regra 10 item 9 pede "terceira no mesmo módulo é sinal de erro": `painel.repository` tem três, sempre com justificativa. No repositório inteiro são 15 (mais 7 em `sessao/resolucao-de-tenant.repository.ts` e 1 em `ia/execucao.repository.ts`). Todos têm justificativa e há teste de contenção.
- Limiares soltos: `LIMIAR_DE_ACERTO_BAIXO_PERCENTUAL = 60` no Analista e "menos da metade" em `desempenho.service.ts:63`; o produto tem a decisão de limiar em aberto (`CLAUDE.md`).
- Arquivos grandes: `operacao/operador.repository.ts` 557 linhas (40 métodos), `privacidade/privacidade.service.ts` 495, `correcao.repository.ts` 318, `material.repository.ts` 330, `ops/operador.ts` 281, `ops/incidente.ts` 250. Testes: seção 7.
- Nome colidindo: `resumoDoAnalista` é a tarefa de IA e a tabela; o repository tem de importar por `tabelasDoMvp` (`analista.repository.ts:74`).
- O diretório `estrutura/` guarda `entrada.ts` (`lerEntrada`, `paginar`, `idDoCaminho`) que todo módulo usa: utilitário fora do lugar.

## 11. Doc × código

- `docs/arquitetura.md`: "sala" e "apps/realtime WebSocket: modo sala" descrevem outra coisa que o `src/sala`; a lista de módulos (`ingestao`, `questao`, `avaliacao`, `nota`, `notificacao`, `titular`) não bate com as pastas reais; a camada `dto` não existe (os contratos estão em `packages/shared`).
- Regra 00 item 4 e D49 (nada demorado em request, fila): a extração de PDF roda no processo da API (D77, dívida declarada).
- Regra 70 item 6 ("auditoria responde o que a IA gerou, quem aprovou e quando"): o resumo da governança **não diz quem** (por D45/D64); quem aprovou fica na auditoria por id. O dossiê precisa dessa consulta [hipótese: o dossiê (D61) ainda não existe neste código].
- Regra 40 / regra 80 item 6: relógio da prova no servidor e "queda do sistema não conta como tempo do aluno" não existem na atividade; não há prazo por aluno.
- Regra 20 item 7 (arquivo em bucket privado com URL assinada): o material não é guardado (por desenho do MVP), então a regra se aplica só ao arquivo do titular, e está implementada.
- `docs/mvp-rapido.md` e `docs/mvp-contratos.md` citados nos comentários: conferidos só pelas citações, não os li.

## 12. Tamanho, risco e vizinhança

- 102 arquivos de produção, ~11,7 mil linhas, mais ~5,5 mil de teste ao lado e ~18 mil em `test/`.
- Risco de mexer:
  - **Alto** em `atividade/correcao.*`, `entrega/*`, `privacidade/*`, `operacao/*`: garantias de regra 70, LGPD e acesso apoiadas em gatilhos de migration, transações e contadores em Redis. Mover ou apagar um pedaço quebra invariantes que só aparecem em teste de integração com Postgres.
  - **Médio** em `sala/*` (hash constante e limites) e `material/*` (fila em memória).
  - **Baixo** em `ops/` (CLI, bem coberto), exceto por `ops/escola.ts`, usado pelo painel.
- Depende de: U-nucleo (esquema, auditoria, contexto, fila, armazém), U-shared (contratos e `MATRIZ`), U de `sessao`/`estrutura`/`assistente`/`ia`. Dependem dela: `artefato`, `assistente` e `tutor` (usam `material` e `entrega`), o worker (`montar-arquivo`, expurgo), a web (telas de professor, aluno, coordenação, operação), `tools/demonstracao`, `infra/compose.yml` (`migrar.js`), `docs/runbook.md` (comandos `ops:*`).
- Plano de renomear `ops/`: não achei registro em `TODO.md`, `ROADMAP.md`, `docs/arquitetura.md` ou `.processo/reengenharia/MISSAO.md` (só a etapa 7.5 genérica); a renomeação teria de mexer em 12 scripts de `package.json`, `infra/compose.yml:122`, `docs/runbook.md`, `README.md` e nos testes `test/ops-*.int.test.ts`.

## 13. Cinco achados mais importantes

1. A autoria humana da decisão está garantida **no banco** (check `entrega_decisao_registrada`, gatilhos `exigir_equipe_da_escola`, `exigir_validacao_do_lote_aprovado`, `exigir_destaques_do_lote_abertos`) e coberta por teste. Não existe `Nota` no código; qualquer reengenharia da correção precisa manter esses gatilhos e o fluxo leitura+marca no Redis+abertura de destaques.
2. `ops/` mistura comandos de terminal, casos de uso que o painel chama (`criarRede`, `criarEscola`) e o migrador do compose; `operacao/` e `ops/` se importam nos dois sentidos, e `sessao/convite.service.ts` guarda a lógica do convite da coordenação. Renomear `ops/` exige reorganizar as três pastas juntas.
3. A pilha de login do operador (entrada, MFA, sessão, convite) é uma cópia paralela da pilha da escola em `sessao/`, com mais ou menos 1,2 mil linhas de serviços e controllers próprios.
4. A extração de PDF roda na API com fila em memória e bytes do PDF em RAM (dívida D77, `TODO(fila)` em `material/fila-de-extracao.ts:42`); é o único estado em memória relevante e o ponto que quebra primeiro com várias escolas ou duas instâncias.
5. O desenho em camadas é consistente (controller sem regra, service, repository com escopo do contexto, contrato zod na entrada e na saída, auditoria tipada), com um teste de arquitetura forte. Os desvios de forma são: cerca de 20 controllers sem `lerEntrada`, três versões da tradução alcance→escopo, junções copiadas entre repositories, `.int.test.ts` em dois lugares e ~110 exports sem consumidor.
