# U02 — `packages/nucleo` (exceto `src/ia/`)

Método: leitura de código, grep e dois scripts de contagem (em `scratchpad/`, fora do repositório). Nenhum teste ou build rodado.
Números: 174 arquivos `.ts` (13.163 linhas de produção + 6.390 de teste), fora `src/ia/` (7.109 linhas, outra unidade); 37 migrations SQL (1.660 linhas) e 38 snapshots JSON (172 mil linhas, ruído de diff).

## 1. Finalidade e limites

O `nucleo` é a "caixa de ferramentas de infraestrutura e de privacidade" que API, worker, despachante e realtime compartilham [código: `package.json` do pacote; consumidores abaixo]. Contém, misturados:

- **Transversal técnico**: contexto da requisição (AsyncLocalStorage), erro tipado, log, telemetria, Redis, pool/migração do Postgres, limite de requisições, drenagem/batimento de instância, fila (outbox + vagas), relógio.
- **Segurança/identidade**: verificação e emissão de JWT, guardas Nest (autenticação, limite, sessão, permissão), `SessaoRepository`.
- **Domínio de privacidade/LGPD**, que não é infraestrutura: `titular/` (arquivo do titular, eliminação, troca de nome, compartilhamento, suboperador, incidente), `retencao/` (expurgo por escola, de acesso, de jobs), `ciclo-de-vida/` (desativar/eliminar pessoa), `auditoria/` (porta única de escrita).
- **Schema do banco inteiro**: 54 tabelas Drizzle, inclusive as do MVP (material, agente, entrega, correção, tutor) e as da operação Turmma [código: `db/schema/*.ts`].

Não é dele: controllers/services/repositories de domínio (ficam em `apps/api/src/*`), contratos HTTP (`packages/shared`), processadores de job (`apps/worker`), publicação no BullMQ (`apps/despachante`), IA (`src/ia/`, exportada pelo mesmo barril).

## 2. Pontos de entrada

Pacote de biblioteca: não tem rota, comando ou worker próprio. Entradas são o barril e três subcaminhos:

| Entrada | O que expõe | Consumidores |
|---|---|---|
| `@educa/nucleo` (`src/index.ts`, 342 linhas) | 522 nomes exportados (inclui IA) | 423 imports em api/worker/despachante/realtime/infra/tools |
| `@educa/nucleo/ciclo-de-vida` | `CicloDeVidaRepository/Service` | 7 imports (api, worker) |
| `@educa/nucleo/conta-global` | `ContaGlobalRepository` (fora do barril de propósito) | 5 imports; teste de arquitetura lista quem importa [código: `apps/api/test/arquitetura.test.ts:108-141`] |
| `@educa/nucleo/armazem-s3` | cliente S3 do arquivo do titular | 3 imports |
| `drizzle.config.ts` (`npm run db:gerar`) | gera migration de `schema/*.ts` | dev; o serviço `migrar` aplica via `db/migrar.ts` |

Guardas Nest globais (ordem documentada nos comentários): `GuardaDeAutenticacao` → `GuardaDeLimite` → `GuardaDeSessao` → `GuardaDePermissao` [código: comentários em `identidade/guarda-autenticacao.ts:15`, `guarda-sessao.ts:30`, `permissao/guarda-permissao.ts:10`]. `ConferenciaDasPermissoes` derruba o boot se uma rota não tem `@Permite`/`@RotaAnonima`/marcador de operação [código: `permissao/conferencia-das-permissoes.ts:55-60`].

Consumo por app (arquivos que importam `@educa/nucleo`): api 340, worker 35, despachante 17, realtime 10, web 0 [código: grep]. `infra/` 3 e `tools/` 1.

## 3. Fluxos e regras de negócio

**Tenant (foco).** Dois níveis.
1. *Aplicação*: `escolaId`/`anoLetivoId` entram no `ContextoDaRequisicao` (AsyncLocalStorage) uma única vez, por `definirSessaoNoContexto`, que lança se já há identidade [código: `contexto/contexto.ts:78-105`]. Os repositories chamam `exigirEscolaDoContexto()` (falha fechada) ou `exigirAnoEmCurso()` [código: `contexto/escola-do-contexto.ts`, `ano-em-curso.ts`]. Cerca de 214 chamadas a `exigirEscolaDoContexto()` em api+nucleo [código: grep]. **Isto é disciplina, não estrutura**: nada impede um repository novo de montar `db.select()` sem a cláusula. Mitigações: `@SemEscopo(justificativa≥30 chars)` torna a exceção visível [código: `db/sem-escopo.decorator.ts:12-24`, mas ele só registra metadado, não impede nada]; testes de arquitetura em `apps/api/test/arquitetura.test.ts` (1.403 linhas) varrem quem importa certos repositories/tabelas e pontualmente exigem "o repository lê a escola do contexto e nenhum método a recebe" (só para `Compartilhamento`, `:477`) [código]. Não achei teste genérico "todo repository escopa". Só 1 método em repository da api recebe `escolaId` por argumento (`apps/api/src/ia/suspensao.repository.ts:16`) [código].
2. *Banco (estrutura, o ponto forte)*: `escola_id` NOT NULL com FK composta `(escola_id, id)` para pai da mesma escola em quase toda tabela (130 FKs nas migrations), mais `ano_letivo_id` nas FKs de turma/artefato/execução; gatilhos para autor/pessoa [código: `schema/vinculo.ts:51-58`, `mensagem-tutor.ts:66-89`; teste `tabelas-do-mvp.int.test.ts:365-640` prova por catálogo que toda FK começa por `escola_id`]. Sem RLS (`grep policy/row level` nas migrations: zero) [código].
3. Operador Turmma: contexto alternativo `operadorId`, mutuamente exclusivo com escola; `exigirEscolaDoContexto` falha para ele [código: `contexto.ts:123-129`, teste `contexto.test.ts:100`]. Job de sistema exige `rotinaDoSistema:true`, que "nenhuma requisição HTTP tem" [código: `job-registro.repository.ts:73-79,207-217`].

**Erro tipado.** `ErroDeDominio(codigo: CodigoDeErro, status?, tenteDeNovoEmSegundos?)` sem texto livre; `NAO_ENCONTRADO` sempre 404 [código: `erro/erro-de-dominio.ts:55-71`]. `FiltroGlobalDeErro` devolve envelope `{codigo, mensagem do catálogo, requisicaoId}`, traduz 403→404 e erros do Postgres (só 23505→CONFLITO e 57014→TEMPO_ESGOTADO; resto ERRO_INTERNO) [código: `filtro-global.ts:11-39`, `mapear-erro-postgres.ts`]. O catálogo `CodigoDeErro` (33 códigos, inclusive `TUTOR_PAUSADO_EM_AVALIACAO`, `ATIVIDADE_ENCERRADA`, `FUNCAO_SUSPENSA`) mora em `packages/shared` e a tabela código→status mora no nucleo (`STATUS_HTTP_DO_CODIGO`): código de domínio vazando para o catálogo central [código]. Ainda há `throw new Error(string)` para erro de programação: 25 no nucleo e 52 na api [código: grep].

**Fila (outbox + BullMQ).**
- `Enfileirador.enfileirar(tx, pedido)` grava em `job_registro` na transação de quem pede e dá `pg_notify('job')`; escola e `requisicaoId` vêm do contexto [código: `fila/enfileirador.ts`, `job-registro.repository.ts:70-90`]. Três filas fixas (`interativa|normal|lote`; `prioridade` derivada) [código: `fila/filas.ts`, `schema/job-registro.ts` checks].
- `enfileirarUmaVez` usa índice único parcial `(escola_id, tipo, chave_idempotencia)` entre não finalizados + `on conflict do nothing` [código: `job-registro.repository.ts:98-130`].
- O despachante (`apps/despachante`) reserva (`FOR UPDATE SKIP LOCKED`, reserva 30 s), toma vaga por escola em Redis (`vaga.lua`, ZSET, validade 60 s) e `addBulk` com `jobId = id da linha` (idempotência na fila); reconciliação republica o que ficou reservado há >120 s [código: `fila/despacho.repository.ts`, `vagas-por-escola.ts`, `apps/despachante/src/fila-de-publicacao.ts:63`, `reconciliacao.ts`].
- `data` no Redis: só `{escolaId, requisicaoId}`, `.strict()`; payload real fica no Postgres [código: `fila/publicacao.ts:29-34`]. O worker valida `data` com esse zod e relê a linha com o escopo da escola [código: `apps/worker/src/executor.ts:167`].
- Tentativas: 5, recuo exponencial 2 s com jitter 0,5 [código: `publicacao.ts:4-18`]. Falha final: `job_registro.estado='falhou'` + `codigo_falha`; BullMQ retém falhos 7 dias. **Não há dead-letter queue nem redrive**; a "DLQ" é a linha `falhou` [código: grep "dead" em `docs/` e código: zero].
- Tipos de job em produção: `titular.montar-arquivo`, `titular.eliminar`, `retencao.expurgar-escola`, `sistema.{consolidar-uso,expurgar-jobs,expurgar-acesso,expurgar-dado-pessoal}`, mais `sintetico` de teste [código: `apps/worker/src/processadores/*`]. Agendamentos num BullMQ à parte (`agendamentos`) [código: `worker/src/agendamentos.ts`].
- **Os agentes de IA não passam por esta fila**: a API usa `ExecutorNoProcesso` [código: `apps/api/src/ia/ia.module.ts:73`]. Afirmação sobre `src/ia` fica para a unidade de IA; mas contradiz `docs/arquitetura.md` ("worker: agentes, ingestão, correção") e a regra 00 item 4 [doc × código].

**Auditoria.** Escrita só por `RegistroDeAuditoria.gravar` (mapa fechado de 58 ações em `acoes.ts`, 805 linhas, schema zod por ação para `antes/depois/finalidade`, campos `nome/email/matricula/...` proibidos), na transação do chamador; o `insert` fica fora do barril e a tabela fora do `schema` exportado; teste varre outras escritas [código: `auditoria/registro-de-auditoria.ts`, `insercao-de-auditoria.repository.ts`, `db/banco.ts:36-38`, `auditoria/porta-unica.test.ts`].

**Nota com autor humano / D55.** Fora deste pacote (a restrição vive em CHECKs das tabelas do MVP e no domínio da api). Aqui só se vê o CHECK de aprovação em `entrega` (testado em `tabelas-do-mvp.int.test.ts:875-930`) [código].

## 4. Dependências

Externas: Postgres (`pg`, `drizzle-orm`), Redis (`ioredis`, `rate-limiter-flexible`), S3 (`@aws-sdk/client-s3`, presigner), JWT (`jose`), `pino`, OpenTelemetry (metrics OTLP), `zod`, Nest como peer (`@nestjs/common|core` 12.0.1) [código: `package.json`]. Redis tem dois papéis separados: cache/limite (`allkeys-lru`) e fila (`noeviction`) [código: `limite/limitador.ts:30`, `uso/contador-uso.ts:15`].

Internas (dependência entre pastas, medida por imports relativos): `config→ia`, `contexto↔erro`, `erro↔log`, `identidade↔limite`, `configuracao→fila`, `titular→{auditoria,ciclo-de-vida,identidade,retencao,uso}`, `db→{config,log,erro}` [código: script de imports]. Os quatro pares circulares são entre pastas, provavelmente sem ciclo de arquivo (verificado só `contexto/erro`); `identidade↔limite` [hipótese]: confirmar com `madge`. `config/config-ia.ts` (175 linhas) importa de `ia/`, ou seja a configuração geral depende da pasta de IA.

Usa `packages/shared` (tipos, `FILAS`, `CodigoDeErro`, matriz de permissão, `CLASSIFICACAO_DAS_TABELAS`). Nenhum import de `apps/*` [código: package.json].

## 5. Dados

54 tabelas, 37 migrations (0000–0036). Inventário compacto (E = `escola_id`, A = `ano_letivo_id`; todas as com E têm índice/único que começa por `escola_id`, salvo o indicado):

| Grupo | Tabelas |
|---|---|
| E + A (18) | acesso_turma, artefato, atividade_aplicada, correcao, entrega, execucao_agente, lista_nome, mensagem_agente, mensagem_tutor, reivindicacao, resposta_atividade, resumo_do_analista, sinal_tutor, tentativa_atividade, thread_agente, turma, validacao_do_lote, vinculo |
| só E (24) | ano_letivo, arquivo_titular, auditoria (E nulo p/ rede/suboperador), configuracao_operacional_escola (PK=escola), consumo_ia, conta_externa, convite, credencial_matricula, disciplina, expurgo_execucao, incidente_escola, job_registro (E nulo p/ `sistema.*`), material, pedido_titular, provedor_escola, registro_acesso, retencao_escola, serie, sessao, suboperador_escola, suspensao_de_funcao, trecho, uso_infra_diario (PK escola+dia), usuario |
| sem E (12) | conta, escola, rede, incidente, suboperador (globais); operador, codigo_recuperacao_operador, convite_operador, sessao_operador, acesso_operacao, auditoria_operacao (operação Turmma); codigo_recuperacao |

Índices que **não** começam pelo escopo (heurística de leitura, regra 80 item 8): `job_registro_*` (começa por `fila, escola_id`, justificado pelo despachante), `job_registro_finalizados(concluido_em)`, `usuario_conta_idx`, `sessao_refresh_hash*`, `sessao_conta_aberta`, `registro_acesso_em_idx`, `incidente_escola_incidente_idx` [código]. Para as de MVP há teste por catálogo (`tabelas-do-mvp.int.test.ts:628`) [código]. Para as demais: [hipótese], conferir com `pg_indexes`.

Detalhes que o Drizzle não declara: `fillfactor=70` de `sessao`, gatilhos (0013, 0022, 0023, 0032), FKs `NOT VALID` da 0006 [código: `schema/sessao.ts:23`, `drizzle/0006`]. Logo o schema TS não descreve o banco real inteiro.

Quem mais lê/escreve: api (60 repositories, 51 no total em apps), worker (processadores de expurgo/arquivo/eliminação), despachante (`job_registro`, `configuracao_operacional_escola`). O nucleo também contém repositories que o worker e a api usam; os testes deles ficam em `apps/*/test` e não no pacote [código: grep em testes].

## 6. Contratos

| Contrato | Tipo | Validado na borda? |
|---|---|---|
| `data` do job no Redis | zod `.strict()` (`esquemaDadosDoJobNaFila`) | sim, no worker |
| `job_registro.dados` | `Record<string, unknown>`; cada processador tem zod próprio (`montar-arquivo.ts:46`, `eliminar-titular.ts:49`, `sintetico.ts:129`); produtores montam o objeto à mão (`privacidade.service.ts:238`, `expurgo-da-escola.repository.ts:479`) | **implícito**: schema só no consumidor, sem tipo compartilhado por `tipo` [código] |
| `tipo` do job | string literal; 2 em `shared`, 5 em constantes do worker | implícito |
| Env | zod por área (`lerConfiguracaoBanco|Identidade|Limite|Drenagem|Telemetria`, `validarAmbiente`) com erro que cita só o nome da variável [código: `config/validar-config.ts:22-31`] | sim, no boot |
| Auditoria | mapa `ACOES_DE_AUDITORIA` com zod por parte | sim; teste `acoes.test.ts` |
| Erro HTTP | envelope `RespostaDeErro` de `shared` | sim |
| Permissão | `@Permite(recurso, acao)` tipado pela `MATRIZ` de `shared` | sim, no boot e na guarda |
| Barril | 522 nomes exportados | sem contrato de "API pública": tudo que foi exportado vira superfície |

## 7. Testes

40 arquivos de teste (33 unidade, 7 integração) no pacote: `contexto.test`, `erro-de-dominio.test`, `permissao.test`, `guarda-sessao.test`, `verificar-token.test`, `logger.test` (362 linhas), `acoes.test`, `porta-unica.test`, `pool.test`, `janela-letiva.test`, `drenagem.test`, `limite/*.test`, `armazem-s3.test`, `leitura-do-titular.test`, etc. Integração: `migrar.int` (lock, tentativas, índices), `pool.int` (380 linhas), `tabelas-do-mvp.int` (1.553 linhas, o mais valioso: prova FKs compostas, CHECKs, regra 70 item 3, adaptação sem texto livre), `tabelas-de-identidade.int`, `auditoria.int`, `formato-do-operador.int`, `armazem-s3.int` [código]. Sem `.skip/.todo/.only` [código: grep].

Lacunas: os repositories do fila/retenção/titular/uso/ciclo-de-vida **não têm teste no pacote**; são cobertos de fora (`apps/despachante/test`, `apps/worker/test`, `apps/api/test`) [código: grep por classe]. `JobRegistroRepository` só aparece em teste dentro do nucleo via migração; o resto é testado pelos apps, de forma que mexer no pacote exige rodar suítes de outros. Integração roda com `fileParallelism:false` (~21 min toda a integração) [código: `vitest.config.ts:14-19`, comentário]. `arquitetura.test.ts` mora na api mas protege invariantes do nucleo.

## 8. Resiliência e escala (sinais)

- Pool: `statement_timeout` e `keepAlive` configurados; não vi `lock_timeout` nem `idle_in_transaction_session_timeout` no pool da aplicação (só no migrador) [código: `db/pool.ts:181-189`, `migrar.ts:49`]. [hipótese] Conferir com `grep -n lock_timeout pool.ts`.
- Redis: `enableOfflineQueue:false`, `commandTimeout` 100 ms (API) / 2 s (fila), `maxRetriesPerRequest:0` [código: `redis/clientes.ts`]. Rate limit tem "seguro" em memória por instância (limite÷instâncias) quando o Redis cai [código: `limitador.ts:36-45`]: estado local aceito como degradação.
- Migração: advisory lock + `lock_timeout` 5 s, 3 tentativas só para 55P03 [código: `migrar.ts`].
- Fila: outbox transacional, `SKIP LOCKED`, vaga por escola com lease 60 s renovado por 15 s, reconciliação, `chave_idempotencia`, `jobId` determinístico [código]. Falta: DLQ/redrive e alerta de "falhou" como estado final (o runbook pode ter; não verifiquei).
- Contagem de uso (`ContadorDeUso`) dispara-e-esquece no Redis, consolidada à noite [código: `uso/contador-uso.ts`].
- Observabilidade: métricas OTel com rótulo `escola` só em lista controlada (`METRICAS_COM_ESCOLA`), log pino com redação (`CAMINHOS_REDACT`), `requisicaoId` validado como UUID [código].
- Listagens: `AuditoriaRepository.listarDaEscola` limita a 500 mas só por tamanho, sem cursor [código: `auditoria.repository.ts:32-47`].

## 9. Suspeitos de código morto

Método: para cada nome do barril, grep de palavra inteira em `apps/ infra/ tools/ e2e/` (produção vs teste) e dentro do pacote. Limite: grep textual, não resolve alias nem uso dinâmico.
- De 522 nomes, **248 não têm uso de produção fora do pacote**; **~90** não aparecem em nenhum outro arquivo (nem em teste de fora): quase tudo constantes e tipos exportados "por precaução" (ex.: `RETENCAO_SESSAO_DIAS`, `RETENCAO_CONVITE_DIAS`, `NOME_DO_MEDIDOR`, `ARQUIVO_BATIMENTO`, `IDADE_MAXIMA_BATIMENTO_MS`, `PRAZO_DA_EXPORTACAO_MS`, `FORMATO_DIA`, `CHAVES_POR_LEITURA`, `PREFIXO_TIPO_SISTEMA`, `RESERVA_SEGUNDOS`, `JITTER_DO_RECUO`, `RECUO_INICIAL_JOB_MS`, `LIMITE_*_DA_LISTAGEM`, e ~15 tipos `Pedido*/Resultado*` do titular). Referência possível: uso interno no próprio arquivo ou tipo inferido. Suspeita é de **superfície excessiva do barril**, não de código inútil.
- Nenhum módulo inteiro parece órfão: `convite/estado-*`, `rotina/`, `InterceptorDeUso`, `Batimento`, `EfeitoSinteticoRepository` têm consumidor de produção [código: grep]. `EfeitoSinteticoRepository` + `TABELA_DO_EFEITO_SINTETICO` + job `sintetico` existem para teste/carga (só ligados com `ROTAS_SINTETICAS=true`) e entram no pacote de produção.
- `AuditoriaRepository.listarDaEscola`: o próprio comentário diz "não tem rota: serve ao teste" [código: `auditoria.repository.ts:27-29`]; só 1 uso em teste fora. Suspeito.
- `ArmazemEmMemoria`/`UrlAssinadaPeloFalso`: dublê de teste exportado em código de produção (4 usos em teste).
- `config.AMBIENTES`: alias de `AMBIENTES_DO_SISTEMA` ("Um só conjunto") [código: `validar-config.ts:42`].

## 10. Duplicação e inconsistência

- **`config/` × `configuracao/`** [código]: não é duplicação funcional, é nome ruim. `config/` = leitura e validação de variáveis de ambiente no boot (`validar-config.ts`, e `config-ia.ts`, que é de IA e depende de `ia/`). `configuracao/` = configuração **operacional por escola** (tabela `configuracao_operacional_escola`, cache em memória 30 s, resolve vagas/janela/limites sobre o padrão do env; depende de `fila/janela-letiva`). Mesmo vocabulário, camadas diferentes.
- **Guarda de "escola no contexto" reescrita à mão**: existe `exigirEscolaDoContexto()` mas 9 pontos do nucleo repetem `contextoAtual()?.escolaId`/`if (undefined) throw new Error('...')` com mensagens diferentes (`configuracao-operacional.repository.ts:28`, `job-registro.repository.ts:132`, `efeito-sintetico.repository.ts:41`, `uso.repository.ts:18`, `contador-uso.ts:77,141`, `auditoria.repository.ts:40`...) e 8 na api [código: grep].
- **Registros paralelos de tabela**: acrescentar tabela com dado de pessoa obriga a tocar `schema/*.ts`, `CLASSIFICACAO_DAS_TABELAS` (shared), `LEITURAS_DO_ARQUIVO` (`titular/leitura-do-titular.ts`, 487 linhas de SQL por tabela), `COLUNAS_DA_TROCA_DE_NOME`, `ALVOS_DO_EXPURGO_DA_ESCOLA` (`retencao/expurgo-da-escola.repository.ts`, 598 linhas), `docs/modelo-de-dados.md` e `db/banco.ts` (lista manual do `schema`). Testes de arquitetura amarram as listas entre si [código], mas o custo de mudança é alto e é a fonte provável de atrito.
- Arquivos grandes: `auditoria/acoes.ts` 805, `expurgo-da-escola.repository.ts` 598, `leitura-do-titular.ts` 487, `limite/limitador.ts` 288, `telemetria/metricas.ts` 272, `ciclo-de-vida.repository.ts` 255, `expurgo-de-acesso.repository.ts` 254.
- Quatro estilos de "falha por falta de contexto": `Error` cru, `ErroDeDominio(NAO_ENCONTRADO)`, `ErroDeDominio(NAO_AUTENTICADO)`, `AuditoriaRecusada` [código].
- Comentários de JSDoc longos com histórico de tarefa ("tarefa 17.0", "F3, 13.0") em quase todo arquivo: a explicação fica atrelada ao processo, não ao código.

## 11. Doc × código

- `docs/arquitetura.md` não cita `packages/nucleo` nem `apps/despachante` (só shared) e lista módulos que não existem (`questao`, `avaliacao`, `nota`, `ingestao`, `notificacao`, `agente`, `escola`...) [doc × `apps/api/src/`: artefato, assistente, atividade, entrega, estrutura, governanca, ia, material, operacao, ops, privacidade, professores, sala, sessao, sistema, tutor].
- `docs/arquitetura.md` diz que o worker faz "agentes, ingestão, correção, notificação"; o worker só tem rotinas de privacidade/expurgo/uso e jobs sintéticos [código: `apps/worker/src/processadores/`]; IA corre no processo da API.
- Regra 10 item 3 (escopo "no repository") é seguida; regra 10 item 5 ("teste de isolamento por módulo") é atendida por padrão em `apps/*/test`, não no pacote.
- Regra 00 item 7/8 (sem plataforma proprietária; docker compose): sem violação vista no pacote.
- `docs/modelo-de-dados.md` (762 linhas) é fonte e é conferido por teste de arquitetura em um ponto (`arquitetura.test.ts:997`: tabelas sem `escola_id` precisam estar no doc) [código].

## 12. Tamanho, risco e dependências

- 174 arquivos, ~19,5 mil linhas com teste (sem IA).
- **Risco de mexer: alto.** Tudo de segurança do produto passa aqui (contexto, tenant, sessão, permissão, auditoria, erro); 423 imports do barril; sem testes de repositories no pacote, então a rede de proteção está espalhada em quatro apps; a migração é sequencial e tem gatilhos fora do Drizzle. Dentro dele, risco baixo: `relogio.ts`, `convite/`, `rotina/`, `uso/dia-de-uso`; médio: log/telemetria/redis; alto: contexto, identidade, fila, db/schema, auditoria, titular, retencao.
- Depende de: `packages/shared` (e, via `config→ia`, de `src/ia`). Dependem dele: api (340 arquivos), worker, despachante, realtime, infra, tools. Web não depende.

## 13. Os 5 achados mais importantes

1. O isolamento entre escolas no código é por disciplina (`exigirEscolaDoContexto()` em ~214 pontos, 9 pontos do próprio nucleo reescrevem o teste à mão) e `@SemEscopo` só documenta; o que é estrutural está no banco (FKs compostas `escola_id,id`, gatilhos, 130 FKs, provado em `tabelas-do-mvp.int.test.ts`), sem RLS nem teste genérico "todo repository escopa".
2. O `nucleo` mistura infraestrutura com domínio de privacidade (titular, retenção, ciclo de vida, 54 tabelas inclusive MVP) e exporta 522 nomes por um barril de 342 linhas; ~250 não têm uso de produção externo. Falta fronteira clara de pacote.
3. A fila é um outbox sólido (transação + `SKIP LOCKED` + vaga por escola em Lua + `jobId` idempotente + reconciliação), mas o contrato de `dados` por `tipo` é implícito (produtor monta à mão, cada processador valida com zod próprio), não há DLQ/redrive, e os agentes de IA nem usam essa fila (ExecutorNoProcesso na API).
4. Acrescentar uma tabela com dado de pessoa obriga a editar sete lugares (schema, `banco.ts`, `CLASSIFICACAO_DAS_TABELAS`, leitura do arquivo, troca de nome, alvos do expurgo, doc); só testes de arquitetura mantêm as listas coerentes, e eles vivem em `apps/api/test`, fora do pacote.
5. O catálogo de erro é tipado e seguro (sem texto livre, 404 uniforme, sem vazar detalhe do Postgres), porém centralizado em `shared` com códigos de domínio (TUTOR, ATIVIDADE...) e status em outra tabela no nucleo; e `config/` × `configuracao/` (env de boot × configuração operacional por escola) é só nome confuso, com `config-ia` pendurado em `ia/`.
