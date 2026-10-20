# U06 — Processos fora da API: worker, realtime, despachante

Escopo lido: `apps/worker`, `apps/realtime`, `apps/despachante`, `infra/docker/{worker,realtime,despachante}.Dockerfile`, trechos de `infra/compose.yml`, e o que eles usam de `packages/nucleo/src/fila/` (leitura, porque o desenho mora lá). Nada foi executado.

## 1. Finalidade e limites

- **O que é o despachante [código]**: não duplica o worker. É a metade "publicar" de um outbox em Postgres. Quem pede trabalho grava uma linha em `job_registro` (`packages/nucleo/src/fila/enfileirador.ts:27`, `job-registro.repository.ts:inserir`). O despachante reserva as linhas (`for update skip locked`, `despacho.repository.ts:221-235`), toma a vaga da escola no Redis e publica no BullMQ (`apps/despachante/src/despachante.ts`, `fila-de-publicacao.ts:73-90`). O worker consome do BullMQ e executa. Ainda no despachante: reconciliação (republica o que o Redis perdeu) e medição de fila por escola.
- **Worker**: executor genérico de jobs (restaura contexto de escola, confere vaga, marca estado, chama o processador do tipo) + 7 processadores reais + 4 medições por escola + agendador cron (`apps/worker/src/montagem.ts`, `executor.ts`).
- **Realtime**: servidor socket.io com um único namespace `/sistema`. Autentica o handshake (JWT + sessão no banco) e põe o socket na sala `escola:<id>` (`sistema.gateway.ts:20-42`). **Não tem nenhum evento nem emissor [código]**. O "modo sala" da `docs/arquitetura.md:17` não existe aqui.
- **Não é deles**: a regra de negócio dos jobs de domínio (`LeituraDoTitular`, `EliminacaoDoTitular`, repositories de expurgo) mora em `packages/nucleo`. As rotas que enfileiram moram na API. Nenhum agente de IA, ingestão, correção ou notificação roda no worker [código: nenhum processador chama `LLMProvider`; grep em `apps/worker/src` sem resultado].

## 2. Pontos de entrada

| Processo | Entrada | Detalhe |
|---|---|---|
| worker | `main.ts` (Nest `createApplicationContext`, sem HTTP) | `FILAS` decide as filas atendidas. Compose: `worker-interativo-{1,2}` (interativa,normal) e `worker-lote-{1,2}` (lote) |
| worker | BullMQ `Worker` por fila (`montagem.ts:164`) | processador único `executor.processar` |
| worker | fila BullMQ `agendamentos` (só réplica de lote, concorrência 1) | grava job em `job_registro`, não executa a rotina (`agendamentos.ts:78-95`) |
| despachante | `main.ts` + `LISTEN job` (`ouvinte-de-jobs.ts`) + sondagem 500 ms | rodada de publicação, reconciliação (60 s), medição (5 s) |
| realtime | `main.ts` `listen(REALTIME_PORTA)` | `GET /prontidao` (`@RotaAnonima`) + socket.io em `/socket.io`, namespace `/sistema` |

Tipos de job registrados no worker (`montagem.ts:100-150`):

| Tipo | Fila | Produtor | Condição |
|---|---|---|---|
| `sintetico` | qualquer | API `POST /v1/sistema/jobs-sinteticos` (só com `ROTAS_SINTETICAS=true`) | teste e carga; `.env.example:51` deixa `true` |
| `titular.montar-arquivo` | normal | API `privacidade.service.ts:238` | só quem atende `normal` e tem storage |
| `titular.eliminar` | lote | `expurgar-escola` via `repositorio.enfileirarEliminacoes` | réplica de lote |
| `retencao.expurgar-escola` | lote | `sistema.expurgar-dado-pessoal` | réplica de lote |
| `sistema.expurgar-dado-pessoal` (01h), `sistema.consolidar-uso` (02h), `sistema.expurgar-jobs` (03h30), `sistema.expurgar-acesso` (04h30) | lote | agendador BullMQ | réplica de lote |

## 3. Fluxos e regras

**Fluxo de um job [código]**
1. Quem pede grava em `job_registro` na própria transação, com escola e `requisicaoId` vindos do contexto (`job-registro.repository.ts:inserir`), e faz `pg_notify`.
2. O despachante percorre as filas por prioridade e as escolas em rodízio. Estima vagas livres (Lua), reserva no máximo isso, toma a vaga e publica com `jobId` igual ao id da linha, `attempts: 5`, backoff exponencial de 2 s com jitter (`despachante.ts:rodada`, `publicacao.ts:11-19`).
3. O worker valida o `data` do job (`esquemaDadosDoJobNaFila`, strict, só `escolaId` e `requisicaoId`). Restaura o contexto, localiza a linha **com escopo de escola**, confere a vaga de novo (sem vaga: `moveToDelayed` com 1 a 1,5 s, sem gastar tentativa), passa a `ativo`, roda o processador com os dados lidos do Postgres e `chaveIdempotencia = jobId`, renova a vaga a cada 15 s, marca `concluido` e libera a vaga (`executor.ts:174-215`).
4. Na falha, só o código tipado (`FalhaDeJob`) vai ao Redis. Se for a última tentativa ou `definitiva`, grava `falhou` com `codigo_falha` (`executor.ts:falhar`).

**Invariantes**
- **Tenant**: `escolaId` do `data` é só para restaurar o contexto. O repository filtra por contexto, e job inexistente e de outra escola dão o mesmo `nao_encontrado` (`escopoDoJobNoContexto`, `job-registro.repository.ts:205-212`). Coberto por `execucao.int.test.ts:212-255`. A vaga usa fila e escola da linha, não do `data` (`executor.ts:113`).
- **Rotina do sistema**: `tipo` com prefixo `sistema.` só nasce de contexto `rotinaDoSistema` (`inserir`) e há check de banco (`job_registro_escola_ou_sistema`).
- **Sem dado pessoal no job**: processadores aceitam `z.strictObject({ pedidoId })` (`montar-arquivo.ts:20`, `eliminar-titular.ts:20`). Mensagem de erro é substituída pelo código antes de ir ao Redis (`executor.ts:158-165`).
- **Nota com autor humano, D55**: nenhum processador toca nota ou correção. Não se aplica a esta unidade.
- **Auditoria (regra 20.10)**: o worker lê dado de titular em `LeituraDoTitular`. Se há auditoria nessa leitura é questão do nucleo, **[hipótese]** a conferir em `packages/nucleo/src/titular/`.

**Realtime**: sala vem do token verificado, e não há evento de entrada. Token só é lido de `handshake.auth`. Queda do Postgres vira `INDISPONIVEL_TENTE_DE_NOVO`, não `NAO_AUTENTICADO` (`autenticacao-do-handshake.ts:84-98`). `ultimo_uso_em` não é movido.

## 4. Dependências

- Internas: `@educa/nucleo` (muito: fila, vagas, contexto, repositories, telemetria, config, `Batimento`, `Drenagem`) e `@educa/shared` (`FILAS`, códigos de falha, esquemas). Nenhuma importa `apps/api` em `src` [código]. **Os testes sim**: `apps/worker/test/*` e `apps/despachante/test/redis-fora.int.test.ts` importam `apps/api/src/ops/escola.js` (criar escola/rede) e `apps/api/test/sessao-de-teste.js`. `apps/worker/test/fila-de-teste.ts:35` importa `apps/despachante/src/montagem.js` (despachante inteiro dentro do teste do worker). `infra/test/borda.int.test.ts` importa fonte de `apps/realtime`.
- Externas: Postgres (pool próprio por processo, `LISTEN`), Redis de fila (BullMQ, vagas Lua, uso diário, adapter socket.io via Streams), S3-compatível (worker: `@aws-sdk/client-s3`, `ArmazemS3`), BullMQ, socket.io, OTLP.
- Ciclos: nenhum entre os 3 apps. O worker faz o papel de **produtor** também (rotinas gravam jobs de escola), então produz e consome as mesmas filas, só por `job_registro`.

## 5. Dados

- `job_registro` (lê e escreve nos 3 fluxos: API insere; despachante reserva, publica e reconcilia; worker inicia, conclui e falha). Índices por `(fila, escola_id, criado_em)` com parciais para pendentes e urgentes, único parcial para a chave de idempotência (`db/schema/job-registro.ts:44-62`).
- Worker (lote): `uso_infra_diario` (`UsoRepository`), tabelas de expurgo (`expurgo_execucao`, dados de retenção), `registro_acesso`, `sessao`, `convite`, `acesso_turma`, `acesso_operacao`, `incidente`, titular/arquivo do titular, configuração operacional da escola. Os repositories de expurgo/titular são compartilhados com a API (o nucleo é dono).
- `efeito_sintetico`: **só existe no teste**; o repository diz que não há migration nem schema Drizzle (`efeito-sintetico.repository.ts:6-20`).
- Realtime: lê `sessao` pelo `SessaoRepository` (a mesma consulta da guarda da API).
- Redis de fila: chaves BullMQ (`interativa`, `normal`, `lote`, `agendamentos`), `vaga:{fila}:{escola|sistema}` (ZSET), contador de uso, `realtime` (stream). Redis é `noeviction` segundo os comentários; o teto do stream é `REALTIME_STREAM_TAMANHO_MAXIMO`.

## 6. Contratos

| Contrato | Forma | Validado? | Teste de contrato |
|---|---|---|---|
| `data` do job no Redis | `esquemaDadosDoJobNaFila` zod strict (`publicacao.ts:30`) | sim, na borda do worker | indireto em `execucao.int.test.ts` |
| `job_registro.dados` | **sem esquema central**: cada processador faz seu zod (`esquemaDoJob` privado em 2 arquivos; `esquemaDadosJobSintetico` em shared) | sim, dentro do processador | por processador |
| Tipo do job (`tipo` string) | constantes `TIPO_*` espalhadas: 4 em strings literais no worker, 2 em `shared` (`TIPO_DO_JOB_*`), 1 em `nucleo`/worker | **não há registro tipado nem teste de que todo tipo gravado tem processador**; tipo desconhecido vira `TIPO_DESCONHECIDO` definitivo em runtime (`executor.ts:185`) | não vi |
| Resultado/estado | `ESTADOS_DE_JOB`, `CodigoDeFalhaDeJob` (4 códigos) em shared | sim | sim |
| Fila (`Fila`) | enum `FILAS` em shared, repetido como check SQL `job_registro_fila_valida` e no tipo da coluna `text` | duas fontes | não vi teste que ligue as duas |
| Realtime | `NAMESPACE_REALTIME_SISTEMA`, `CAMINHO_REALTIME`, `opcoesDoClienteRealtime`, `AutenticacaoRealtime` em shared | sim (`esquemaAutenticacao` no handshake) | `sistema.int.test.ts` |
| Eventos servidor→cliente | **nenhum definido**; nenhum emissor no repositório [código: grep `\.emit(`/`serverSideEmit` sem resultado fora de teste] | n/a | `criarEmissor` só em teste |
| Cliente do realtime | `socket.io-client` só em teste; **nenhum consumidor em `apps/web/src`** [código: grep] | n/a | n/a |
| Healthcheck | worker/despachante: arquivo `/tmp/educa-batimento` com idade máxima 10 s; realtime: `GET /prontidao` | n/a | `redis-fora.int.test.ts` (batimento) |

## 7. Testes

- Unidade: `executor.test.ts` (13), `despachante.test.ts` (16), `fila-de-publicacao.test.ts`, `metricas-espera.test.ts`, `sintetico.test.ts`, `config.test.ts` x3, `esperar-o-redis.test.ts`.
- Integração (Postgres e Redis reais): `execucao.int.test.ts` (500 jobs sem duplicar, isolamento, stalled, SIGTERM forçado), `reexecucao.int.test.ts`, `vagas.int.test.ts` (512 linhas), `reconciliacao.int.test.ts`, `janela.int.test.ts`, `redis-fora.int.test.ts`, `uso.int.test.ts`, expurgos, eliminação, montagem de arquivo, medições. Realtime: `sistema.int.test.ts` (502; isolamento de sala, recusa), `metricas.int.test.ts`.
- Infra: `infra/test/borda.int.test.ts`, `jobs.int.test.ts` e alertas (fora do que li em detalhe).
- Os testes de fila protegem comportamento real (idempotência, isolamento, queda). Têm valor.
- **Peso**: no worker, o teste tem ~8,1 mil linhas contra ~2,2 mil de fonte. `expurgo-da-escola.int.test.ts` sozinho tem 3.019 linhas e `eliminar-titular.int.test.ts` 997. Esses dois testam regras que moram no nucleo (retenção e eliminação), não no worker.
- Sem teste que vi: `montagem.ts` isolada (só indiretamente), `sintetico.sandbox.ts`, `autenticacao-do-handshake` unitário, agendamentos além de `uso.int.test.ts:577` e expurgo de acesso. Sem `.skip/.only/.todo` nos três apps [código: grep].
- Sinal de fragilidade **[hipótese]**: 30 usos de `setTimeout`/`esperar(` em testes; o comentário em `bancada.int.test.ts` mostra que a preparação de volume já falhou na esteira por prazo.

## 8. Resiliência e escala (sinais)

**Inventário de filas (regra 80, itens 2, 3, 7; D49)**

| Aspecto | Achado |
|---|---|
| Filas | 3 BullMQ por prioridade (`interativa`, `normal`, `lote`) + `agendamentos`. **A doc cita seis filas por assunto** (ver seção 11) |
| Payload tipado | `data` sim (zod strict); `dados` do job só dentro de cada processador |
| Prioridade | pela fila; `PRIORIDADE_DA_FILA` 1/2/3 gravada na linha (`publicacao.ts` de `enfileirador.ts:6`); lote não urgente é segurado no horário letivo da escola (`despachante.ts:152`) |
| Concorrência global | `WORKER_POOL_*` por réplica (`.env.example:183-185`: 50 / 30 / 10) |
| Concorrência por escola | vaga por escola e fila (Lua atômico, 5/5/2 por padrão, configurável por escola). Tomada duas vezes: no despachante e no worker |
| Idempotência | `chaveIdempotencia = jobId` entregue ao processador; `enfileirarUmaVez` com índice único parcial para dedup na criação; cada processador tolera reexecução (comentário e teste) |
| Retry/backoff | 5 tentativas, exponencial 2 s, jitter 0,5, **igual para todo tipo** (`OPCOES_DE_JOB_PUBLICADO`). Disparo agendado: 10 tentativas, 5 s |
| Dead-letter | **não há fila morta**. Falha final fica em `job_registro.estado='falhou'` + `codigo_falha`, e no `failed` do BullMQ por 7 dias; `sistema.expurgar-jobs` apaga a linha após 7 dias (`expurgar-jobs.ts`). Não achei alerta/métrica de job falhado [código: `METRICAS` só tem espera, pendentes, aguardando_vaga, vagas_em_uso, jobs_stalled]. **[hipótese]** que falha final de job só aparece nas métricas específicas das 4 medições; confirmar em `infra/grafana` |
| Stalled | lock 10 s e verificação 5 s (interativa/normal), 30 s no lote; `maxStalledCount` não definido (padrão do BullMQ 1) **[hipótese]**: segundo stalled falha o job, e a reconciliação o registra como `ERRO_INTERNO` |
| Estado em memória (regra 80.5) | worker: `SandboxDeCpu` (threads e fila local, só efeito sintético), `AvisoDeVagaLivre`, cache de `ConfiguracaoOperacional` por escola, séries das medições (`Map`), tudo reconstruível. Despachante: `#proximaNoRodizio`, cursor da reconciliação, séries da medição; os comentários dizem que perder só recomeça a volta. Realtime: salas do socket.io em memória + adapter Redis Streams. Nada que outra instância precise. Aceito |
| Graceful shutdown | worker: `close()` de todos os workers com graça de 30 s, depois `disconnect`; compose dá `stop_grace_period: 35s` (`montagem.ts:196-222`, compose). Despachante: para laços e fecha fila, Redis e pool, nessa ordem (`montagem.ts:encerrar`), 15 s de graça. Realtime: `Drenagem` (503 na prontidão, espera a borda, fecha o servidor, prazo) |
| Health | worker e despachante por arquivo de batimento (event loop do worker bate a cada 2 s; despachante a cada rodada). O batimento do worker **não prova que o Redis ou o Postgres respondem**, só que o event loop anda [código: `montagem.ts:setInterval`]. Realtime: `/prontidao` própria, de propósito sem consultar dependência |
| Métrica por escola | `job.espera_mais_antiga_s`, `job.pendentes`, `fila.vagas_em_uso`, `job.aguardando_vaga`, 4 medições por escola (`noites_incompletas`, `horas_em_preparacao` etc.); `fila.jobs_stalled` só por fila. `METRICAS_COM_ESCOLA` fecha a lista de rótulos. Cardinalidade por escola e fila é aceitável com ≤10 escolas (D25) |
| Escala do despachante | cada rodada chama `listarEscolasComPendentes` (salto de índice) e, para cada escola, uma ida ao Redis (`membros`, `manter`, `livres`) mais uma ao banco (`publicadosEntre`); a rodada pára no primeiro erro do Redis. Custo cresce com nº de escolas com pendente, a cada 500 ms ou NOTIFY. **[hipótese]**: com centenas de escolas ativas, vira o gargalo; o `vagas.int.test.ts` e o cenário de carga provam até que ponto |
| Pool de banco | worker interativo `BANCO_POOL_MAXIMO` 80 para pools 50+30 (`.env.example:183-187`); lote 10 para 10 |
| Timeouts | Redis das vagas com `commandTimeout`; storage 2 s/10 s; `statement_timeout` do pool; publicação com `comPrazo` |
| Medições por escola | `MedicaoPorEscola` varre **todas as escolas sequencialmente a cada 5 min em cada réplica de lote**; são 4 laços (expurgo, incidente, arquivo, eliminação), cada um com a própria `listarIds` e uma consulta por escola. Escala linear em escolas × 4 |

## 9. Suspeitos de código morto (nunca afirmados)

- **Todo o `apps/realtime` além do handshake**: sem emissor e sem cliente em `apps/web/src`. Procurei `.emit(`, `serverSideEmit`, `io(`, `socket.io-client` em `apps`, `packages`, `e2e`. Pode ser fundação intencional para o modo sala (F10, comentado em `shared/.../realtime.ts:10`), e `infra/test/borda.int.test.ts` e métricas o exercitam. Confirmaria: roadmap/fase do modo sala.
- **`SandboxDeCpu` + `sintetico.sandbox.ts` + `sintetico` + `EfeitoSinteticoRepository` + rota `jobs-sinteticos`**: serve a teste e a carga (cenários `infra/scripts/carga*.ts`). Não é morto, mas é código de teste dentro do caminho de produção (o processador `sintetico` está sempre registrado na réplica; a rota depende de flag). A tabela `efeito_sintetico` não existe em produção, então `efeito: true` falharia no banco.
- `COMANDO_HEALTHCHECK_BATIMENTO` (`nucleo/instancia/batimento.ts:31`): grep achou o texto idêntico copiado à mão em `infra/compose.yml:328` e `:381`, e não achei import da constante fora do `index.ts`. Possível referência dinâmica: script de carga. Suspeito de duplicação, não de morte.
- Medições `MedicaoDoArquivo`, `MedicaoDaEliminacao`, `MedicaoDoIncidente`, `MedicaoDoExpurgo`: usadas em `montarRotinas`; não são mortas.

## 10. Duplicação e inconsistência

- **Resolução de vagas e de janela repetida** em `worker/montagem.ts` (duas instâncias de `ConfiguracaoOperacional`, linhas ~120-130 e ~244) e `despachante/montagem.ts:76-92` (uma instância que junta os dois). Padrões diferentes para o mesmo problema.
- **Quatro medições por escola** com ~44 linhas cada que só diferem na consulta; a classe base `MedicaoPorEscola` existe, mas cada uma faz sua `listarIds` e seu laço.
- **Laço com espera e acordar repetido à mão** em `Despachante`, `Reconciliacao`, `MedicaoDaFila` e `MedicaoPorEscola` (4 cópias do mesmo `Promise + setTimeout + #encerrarEspera`).
- **`montagem.ts` do worker (318 linhas)** mistura construção de conexões, métricas, rotinas, agendamento e desligamento. `montarRotinas` constrói 6 processadores com ~10 repositories.
- **Dois mecanismos de agendamento**: `upsertJobScheduler` do BullMQ numa fila só para disparar, que então grava outro job em `job_registro` e passa pela trilha completa (despachante, vaga, worker). Funciona, mas é uma fila a mais só para o cron.
- **Duas vezes a mesma vaga**: despachante toma ao publicar, worker "confirma". Justificativa no código (publicação ambígua, vaga vencida), mas dobra a superfície.
- Realtime: cria cliente Redis próprio e pool próprio; o `nucleo` tem `criarClienteRedisDaFila` (usado por worker e despachante). Divergência explicada no comentário (sem `commandTimeout`), válida.
- Arquivos grandes: `expurgar-escola.ts` (184), `consolidar-uso.ts` (182), `montagem.ts` (318), `executor.ts` (303), `despachante.ts` (323). Os comentários de bloco chegam a ~40% de algumas funções (ex.: `consolidar-uso.ts:38-67`).
- Teste: `expurgo-da-escola.int.test.ts` 3.019 linhas, 93 casos.

## 11. Doc × código

- `docs/arquitetura.md:18`: worker = "agentes, ingestão, correção, notificação". **Código**: nenhum desses. Só expurgo, uso, arquivo/eliminação do titular e sintético.
- `docs/arquitetura.md:85-86`: filas `ingestao`, `agentes`, `correcao`, `notificacao`, `expurgo`, `exportacao-titular`. **Código**: 3 filas por prioridade e o tipo do job distingue o assunto. A frase seguinte da própria doc (linhas 88-93) já usa o modelo do código.
- `docs/arquitetura.md:17`: realtime = "modo sala: professor vê a turma ao vivo". **Código**: só `/sistema` sem eventos.
- `CLAUDE.md`/D77: "IA no processo da API como dívida declarada". Confere com `IA_EXECUCOES_*` no compose da API [código: `compose.yml`, bloco da api], e regra 00.4/80.2 pedem IA em fila. Fora da unidade, mas é a ausência que define o worker atual.
- Regra 80.2 ("lote nunca atrasa interativo"): atendida por pools e workers separados e pelo teto por escola (doc e compose coincidem).
- Regra 80.10 (alerta novo com runbook): não verifiquei `docs/runbook.md` nesta unidade.

## 12. Tamanho, risco e dependências

| App | Fonte | Testes | Arquivos |
|---|---|---|---|
| worker | ~2,2 mil | ~8,2 mil | 36 |
| despachante | ~1,2 mil | ~2,4 mil | 20 |
| realtime | ~0,5 mil | ~0,8 mil | 12 |
| nucleo/fila (leitura) | ~1,1 mil | n/a | 10 |

- **Risco de mexer**: **alto** no executor, nas vagas (Lua) e na reconciliação (corrida entre despachante, worker e Redis; qualquer mudança toca idempotência e isolamento, e os testes de queda são caros); **médio** nos processadores de expurgo (toca LGPD e retenção); **baixo** no realtime (quase sem comportamento).
- Depende de: U (nucleo/shared, banco e schema `job_registro`, identidade/sessão, configuração operacional, retenção/titular). É dependido por: API (produtor, `Enfileirador`), infra/compose/carga, `tools/processo` e a esteira.

## 13. Os 5 achados mais importantes

1. O despachante não duplica o worker: é um outbox Postgres → BullMQ com reserva, vaga e reconciliação. O desenho é sólido e bem testado, mas é a parte mais complexa do repositório para o que hoje só roda 7 tipos de job (nenhum de IA ou ingestão).
2. O worker não executa nada do núcleo do produto (agentes, correção, ingestão, notificação, como a doc diz); a IA roda no processo da API, contra as regras 00.4 e 80.2 (dívida D77), então a fila existe, mas o trabalho pesado ainda não está nela.
3. O realtime é um esqueleto: autentica e põe na sala da escola, sem nenhum evento, emissor ou cliente na web; a doc o promete como "modo sala".
4. Contrato do job é parcial: `data` no Redis é zod strict, mas o `tipo` é string solta sem registro tipado, `dados` só é validado dentro de cada processador, e retry, backoff e falha final são idênticos para todo tipo, sem fila morta nem métrica de job falhado por escola que eu tenha visto.
5. Peso desproporcional de testes e repetição: ~8 mil linhas de teste para ~2 mil de fonte no worker (um arquivo de 3 mil linhas testando regra que mora no nucleo), 4 laços "espera e acordar" copiados, 4 medições por escola com varredura sequencial a cada 5 min por réplica, e config de vagas/janela montada de dois jeitos.
