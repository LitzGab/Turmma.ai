# Mapa do sistema — o que existe hoje

Etapa 2, consolidada pelo Arquiteto em 20/10/2026 a partir de `unidades/U01` a `U12` (base `a9d34cd`). O objetivo é que
quem nunca viu o projeto entenda a estrutura sem ler os arquivos. Marcas: **[código]** conferido · **[doc]** dito em
documento · **[hipótese]** a conferir. O detalhe com `arquivo:linha` está na unidade citada entre parênteses.

> **Atenção:** `docs/arquitetura.md` descreve outro sistema (módulos, filas e adaptadores que não existem; U12 §11.1).
> Para mudar o código, vale este mapa, não aquele documento, até a Etapa 11.

## 1. Os processos e os pacotes

```
                    navegador (Chromebook, celular)
                              │ HTTPS
                       borda (Caddy) ── /socket.io ──► realtime ×2 (socket.io, só /sistema, sem eventos)
                              │ /v1/*
                          api ×2 (NestJS) ─────────────────────────────┐
           │ transação + job_registro + pg_notify          │ IA e PDF  │
           ▼                                               ▼ em memória│
      Postgres 18 ◄─── despachante ×2 (outbox → BullMQ) ──► redis-fila │ (noeviction: BullMQ, vagas, uso)
           ▲                                               │           │
           └────────────── worker ×4 (interativo ×2, lote ×2) ◄───────┘
                              │
                        S3 (SeaweedFS)        redis-cache (LRU: rate limit)      otel-lgtm (métricas)
```

[código: `infra/compose.yml`; U06, U10]

| Pacote | Papel | Tamanho (produção / teste) | Importa |
|---|---|---|---|
| `packages/shared` | Contrato da API em zod (271 esquemas), matriz de permissão, catálogo de erros, funções dos agentes, retenção, classificação das tabelas | 7,6 mil / 1,6 mil | só zod |
| `packages/nucleo` | Infraestrutura e privacidade compartilhadas: contexto da requisição, guardas Nest, erro tipado, log, telemetria, Redis, pool, migração, fila (outbox, vagas), auditoria, titular, retenção, ciclo de vida, **schema das 54 tabelas**, camada de IA (`src/ia`) | 13,2 mil + 3,6 mil (IA) / 6,4 mil + 3,5 mil | shared |
| `apps/api` | HTTP: 17 módulos Nest, 54 controllers, 137 handlers; executa a IA e a extração de PDF **no próprio processo** | ~21 mil / ~9 mil ao lado + 35 mil em `test/` | shared, nucleo |
| `apps/despachante` | Metade "publicar" do outbox: reserva linhas de `job_registro`, toma vaga por escola, publica no BullMQ, reconcilia | 1,2 mil / 2,4 mil | shared, nucleo |
| `apps/worker` | Executor genérico de jobs + 7 processadores (expurgo, uso, titular, sintético) + agendador cron | 2,2 mil / 8,2 mil | shared, nucleo |
| `apps/realtime` | socket.io autenticado, sala por escola; **nenhum evento e nenhum cliente** | 0,5 mil / 0,8 mil | shared, nucleo |
| `apps/web` | SPA React: cliente HTTP validado por zod, sessão em memória, kit visual D80, telas de 3 papéis + painel da operação | ~35 mil / ~32 mil | shared (nunca nucleo nem backend) |

**Direção das dependências:** `shared ← nucleo ← apps/{api,worker,despachante,realtime}` e `shared ← web`. Nenhuma volta:
0 violação no dependency-cruiser [código: medição de 20/10]. Há 3 ciclos de import, todos dentro de `apps/api` (§3).

## 2. A API por dentro

### 2.1 Camadas (como de fato estão)

| Camada | Onde | Como é garantida |
|---|---|---|
| Guardas globais, nesta ordem: JWT → limite → sessão no Postgres → permissão | `packages/nucleo/src/{identidade,limite,permissao}`, registradas em `app.module.ts:128-165` | estrutura; `ConferenciaDasPermissoes` derruba o boot se uma rota não tem `@Permite`/`@RotaAnonima`/marca de operação (U02, U04) |
| Controller: lê a entrada com o esquema zod, chama o service | `apps/api/src/<módulo>/*.controller.ts` | **convenção**: `@Body() corpo: unknown` + `lerEntrada` (61 usos) ou `safeParse` à mão (~24); nenhum pipe global (U01, U04) |
| Service: regra, transação, auditoria, `esquemaResposta*.parse` na saída | `*.service.ts` | convenção (às vezes o `.parse` de saída fica no controller, em `sessao/`) |
| Repository: único que toca o banco, escopo do contexto | `*.repository.ts`, criado com `new XRepository(tx)` dentro da transação | **disciplina**: 214 chamadas a `exigirEscolaDoContexto()`; testes de arquitetura módulo a módulo (U02, U10) |
| "DTO" | não é pasta: é o `esquemaResposta*` de `packages/shared` | `apps/api/test/contratos.test.ts` varre campos proibidos |

### 2.2 Módulos [código: `app.module.ts:97-124`; U04, U05, U03]

| Módulo | O que faz | Observação |
|---|---|---|
| `sessao` (6,4 mil linhas) | Login por e-mail, matrícula, Google/Microsoft; MFA; convite; renovação; troca de escola; `/v1/eu`; resolução de tenant (25 `@SemEscopo`) | É usado como **biblioteca** por `operacao`, `sala`, `ops`, `assistente` (30+ símbolos) |
| `estrutura` | Ano letivo, série, disciplina, turma, lista de nomes, vínculo, provedores | `estrutura/entrada.ts` (`lerEntrada`, `paginar`, `idDoCaminho`) é utilitário de 29 arquivos de outros módulos |
| `professores` | Cadastro, lista e convite de professor | delega a escrita a `sessao/` |
| `sala` | **Entrada do aluno** (link, código, reivindicação de nome, decisão). Não é o "modo sala" | nome colide com o modo sala ao vivo (F10) |
| `atividade` | Aplicar atividade objetiva, encerrar e corrigir por gabarito (sem IA), destaques, aprovação do lote, prova do aluno, desempenho | aprovação humana garantida por gatilho no banco |
| `entrega` | Fila do que a IA produziu à espera de decisão | |
| `material` | Envio de PDF com licença, extração por página **em memória**, busca de trechos (tsvector) | `TODO(fila)` em `fila-de-extracao.ts:42` |
| `ia` | `IaModule` global: provedor, executor **em memória**, orçamento, consumo, suspensão, `GET /v1/execucoes/:id` | `AgendadorDeExecucoes` é o único chamador de `ia.gerar` |
| `assistente` | Conversa do professor; virou infra compartilhada de IA (limite de pedidos, citações, vínculo do professor) | |
| `artefato` | Ferramentas que geram, adaptação, PDF do artefato | |
| `tutor` | Conversa do aluno, memória do trabalho, sinais, freio D38 | |
| `governanca` | Resumo, suspensão por função, consumo, Analista | |
| `privacidade` | Retenção, suboperadores, incidentes, pedidos do titular, "Meus dados" | enfileira `titular.montar-arquivo` |
| `operacao` | Área da equipe Turmma: entrada do operador (pilha paralela à da escola) e painel | |
| `ops` | Comandos `npm run ops:*`, casos de uso que o painel reaproveita, e o migrador do compose | depende de `operacao` e vice-versa |
| `sistema` | Saúde, prontidão, estado, avisos, contexto, jobs sintéticos | |
| `banco`, `limite`, `uso` | Pool, Redis de cache e de fila, contador de uso | `@Global()` |

**Ciclos** [código: dependency-cruiser]: `operacao/operador.repository ↔ operacao/prazos-da-sessao`,
`sessao/login.service ↔ sessao/conclusao-de-login`, `sessao/login.service ↔ sessao/convite.service`.

## 3. Fluxos principais

| Fluxo | Caminho | Invariante e onde mora |
|---|---|---|
| **Requisição autenticada** | borda → guardas (JWT 10 min → limite por usuário e escola → sessão lida do Postgres → permissão pela `MATRIZ`) → controller → service → repository | Escopo de escola vem do contexto (AsyncLocalStorage), nunca do corpo; 404 igual para inexistente, de outra escola e fora de formato (U02, U04) |
| **Montar a escola** | operação cria rede e escola no painel → convite da coordenação → coordenação cria ano, séries, turmas, lista de nomes → convida professor → vínculo confirmado | Vínculo definido pela escola (regra 60.8a); `@SemEscopo` concentrado na resolução de tenant (U04, U05) |
| **Aluno entra** | link ou código da turma → reivindicação de nome (argon2 sempre, contador no Redis) → professor decide → usuário e vínculo criados → login por escola + matrícula + senha | Uma transação por pedido; reenvio idempotente por `chaveEnvio` (U05) |
| **IA (Assistente, ferramentas, adaptação, Tutor, Analista)** | `POST` → `AgendadorDeExecucoes` grava `execucao_agente` pendente (chave única de envio) → 202 → `ExecutorNoProcesso` roda na API → `ProvedorDeIa.gerar` (escola do contexto, entrada estrita, suspensão, regra fixa, orçamento, até 2 chamadas, consumo) → grava o resultado → a web consulta `GET /v1/execucoes/:id` | Saída validada por esquema e citação conferida; adaptação nasce com `entrega` pendente; Tutor sem gabarito na entrada; **sem fila, sem prioridade, sem degradação** (U03) |
| **Correção de objetiva** | encerrar (corrige por gabarito, sem IA) → lote pendente → professor lê (marca no Redis) → abre destaques → aprova | Gatilhos `exigir_equipe_da_escola`, `exigir_validacao_do_lote_aprovado`, `exigir_destaques_do_lote_abertos` e o check `entrega_decisao_registrada`. **Não existe tabela `Nota`** (U05) |
| **Material** | coordenação envia PDF com licença → teto por pessoa e por escola → extração na API (bytes em RAM, 2 simultâneas, 1 por escola) → `trecho` com tsvector | D5/D75 conferidos antes de ler bytes; o PDF não é guardado (U05) |
| **Job** | quem pede grava `job_registro` na própria transação + `pg_notify` → despachante reserva (`SKIP LOCKED`), toma vaga da escola (Lua), publica com `jobId` = id da linha → worker valida `data`, relê a linha com escopo, confere a vaga, executa, marca | Outbox transacional; 5 tentativas com recuo e jitter; falha final é a linha `falhou`, **sem fila morta** (U02, U06) |
| **Rotinas noturnas** | agendador BullMQ grava jobs `sistema.*` às 01h, 02h, 03h30 e 04h30 → trilha normal | expurgo por retenção, consolidação de uso, expurgo de jobs e de acesso (U06) |
| **Pedido do titular** | coordenação registra → API enfileira `titular.montar-arquivo` → worker monta o arquivo no S3 → URL assinada de 5 min | auditoria de leitura nominal; eliminação agendada (U05, U06) |

## 4. Dados [código: `packages/nucleo/src/db/schema`; U02]

54 tabelas e 37 migrations (`packages/nucleo/drizzle/0000` a `0036`). O schema TS não descreve o banco inteiro: gatilhos
(0013, 0022, 0023, 0032), `fillfactor` da `sessao` e FKs `NOT VALID` estão só no SQL.

| Grupo | Tabelas |
|---|---|
| Com escola e ano letivo (18) | acesso_turma, artefato, atividade_aplicada, correcao, entrega, execucao_agente, lista_nome, mensagem_agente, mensagem_tutor, reivindicacao, resposta_atividade, resumo_do_analista, sinal_tutor, tentativa_atividade, thread_agente, turma, validacao_do_lote, vinculo |
| Só com escola (24) | ano_letivo, arquivo_titular, auditoria (escola opcional), configuracao_operacional_escola, consumo_ia, conta_externa, convite, credencial_matricula, disciplina, expurgo_execucao, incidente_escola, job_registro (escola opcional para `sistema.*`), material, pedido_titular, provedor_escola, registro_acesso, retencao_escola, serie, sessao, suboperador_escola, suspensao_de_funcao, trecho, uso_infra_diario, usuario |
| Sem escola (12) | Globais: conta, escola, rede, incidente, suboperador, codigo_recuperacao. Operação Turmma: operador, codigo_recuperacao_operador, convite_operador, sessao_operador, acesso_operacao, auditoria_operacao |

**Tenant no banco:** `escola_id NOT NULL` com FK composta `(escola_id, id)` para o pai da mesma escola (130 FKs), provado por
catálogo em `tabelas-do-mvp.int.test.ts`. Sem RLS. **Tabela nova com dado de pessoa** exige mexer em 7 lugares: schema,
`db/banco.ts`, `CLASSIFICACAO_DAS_TABELAS` (shared), leitura do arquivo do titular, troca de nome, alvos do expurgo e
`docs/modelo-de-dados.md`, que os testes de arquitetura amarram entre si (U02).

## 5. Integrações externas

| Integração | Onde | Observação |
|---|---|---|
| Provedor de modelo (`chat/completions`, OpenAI-compatível) | `packages/nucleo/src/ia/adaptador-openai-compat.ts` (`fetch`, sem SDK) | Só `openai_compat` e `falso`. **Não há adaptador Ollama**, apesar de regra 30, D13 e `arquitetura.md` (U03) |
| OIDC Google/Microsoft | `apps/api/src/sessao/externa/` (`openid-client`, prazo 5 s); `oidc-falso` no compose | guarda só o identificador opaco (D48) |
| S3 | `@educa/nucleo/armazem-s3` | só o arquivo do titular; material não é guardado |
| OpenTelemetry | `packages/nucleo/src/telemetria` | só métricas; sem traces nem logs enviados |
| GitHub Actions | `.github/workflows/ci.yml` | sem segredo, actions por SHA |

## 6. A web por dentro [U07, U08]

- `src/api/` (único lugar com `/v1/...`): `chamarApi` valida toda resposta com o esquema de shared; erro vira `ErroDaApi(CodigoDeErro)`.
- `src/api/sessao.ts` (715 linhas): token só em memória, renovação por cookie com Web Locks entre abas.
- `src/componentes/` (159 arquivos): kit D80, peças compartilhadas entre áreas e algumas telas inteiras.
- `src/areas/{coordenacao,professor,aluno}`: telas por papel, cada uma num chunk `lazy`, sem import cruzado.
- `src/operacao/`: painel da equipe Turmma, com **sessão e páginas de entrada próprias**, espelhando as da escola.
- Política de chunks em `nome-dos-chunks.ts`, conferida por teste que faz `vite build` (entrada ≤ 150 kB brotli).

## 7. Testes [U09, U10]

| Camada | Onde | Volume |
|---|---|---|
| Unidade | `*.test.ts(x)` ao lado do código; `tools/**` | 327 arquivos |
| Integração (Postgres e Redis reais) | `*.int.test.ts` em `src/` de alguns módulos **e** em `apps/api/test/` (plano, 88 arquivos) | 129 arquivos; ~21 min, um arquivo por vez |
| Infra | `infra/test/`, alguns `tools/ci` | ensaio real de alertas e métricas |
| E2E | `e2e/*.spec.ts` (75), `e2e/__fixtures__/` | 594 casos × 2 projetos ≈ 1.190 execuções; semente por SQL cru |
| Arquitetura | `apps/api/test/arquitetura.test.ts` (1.403 linhas) | a trava de regras 10 e 20, escrita módulo a módulo |

## 8. O que **não** existe (e os documentos dizem que existe)

| Prometido em | O que o código tem | Fonte |
|---|---|---|
| Worker com agentes, ingestão, correção e notificação | Worker só com expurgo, uso, titular e sintético | U06, U12 #3 |
| Seis filas por assunto | Três filas por prioridade (`interativa`, `normal`, `lote`) | U12 #2 |
| Realtime com modo sala por turma | Namespace `/sistema` sem evento e sem cliente | U06, U12 #7 |
| `OllamaAdapter`, pasta `apps/api/src/ia/adapters` | `adaptador-openai-compat.ts` e `adaptador-falso.ts` em `packages/nucleo/src/ia` | U03, U11 |
| Orçamento por aluno, turma e escola, com aviso | Só o freio de trocas do Tutor; `custo_micros` nunca preenchido | U03 |
| Degradação: fila curta, modelo menor, reserva | Nenhuma | U03 |
| Sessão em Redis (regra 80.5) | Sessão lida do Postgres a cada requisição | U04 |
| Ingestão com BNCC, vetor, versão | Texto por página com tsvector; `pgvector` instalado e sem uso | U12 #11 |
| Tabela `Nota`, `Avaliacao`, `Questao` | Não existem; o diagnóstico sai da correção aprovada | U05, U12 §5 |
| Backup, restauração, rollback ensaiados | Só texto (`docs/infra.md` 6.2–6.3) | U10 |
| Telemetria do cliente web | Nenhuma | U07, U08 |
