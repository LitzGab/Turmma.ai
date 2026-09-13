# Tech Spec — Fundação técnica

**PRD:** `tasks/prd-fundacao-tecnica/prd.md`
**Status:** rascunho (revisto em 13/09/2026: F0 só local, D31; entrega pelo menos uma vez, D49; casca responsiva até o celular, D51)

## 1. Resumo da abordagem

Monorepo npm. API, realtime, despachante e worker são aplicações NestJS separadas sobre um
pacote comum. Todo job nasce no Postgres, e o despachante só o publica no BullMQ quando a
escola tem vaga (e, se não urgente, fora da janela letiva): justiça entre escolas e queda
do Redis se resolvem no mesmo ponto.

Tudo roda local com `docker compose up`, com duas instâncias de cada processo atrás de um
Caddy que só balanceia, e observabilidade local (`grafana/otel-lgtm`). A esteira roda no
GitHub Actions. O desenho do staging (borda, deploy, check externo, alerta no celular,
custo) fica em `notas-staging.md` até o staging ser criado (D31).

## 2. Módulos afetados

| Módulo | Novo ou alterado | O quê |
|---|---|---|
| `packages/shared` | novo | `CodigoDeErro` pt-BR, schemas zod |
| `packages/nucleo` | novo | contexto, log, erro, db, `Enfileirador`, `VagasPorEscola`, `JanelaLetiva`, limite, uso, telemetria |
| `apps/api`, `apps/web` | novo | módulo `sistema`; casca |
| `apps/realtime` | novo | socket.io com `redis-streams-adapter` |
| `apps/despachante`, `apps/worker` | novo | despacho por vaga; pools por `FILAS` |
| `infra/`, `tools/guardas` | novo | compose, Caddyfile, alertas do Grafana, k6; ESLint com fixtures |

## 3. Modelo de dados

Drizzle `casing: 'snake_case'`, UUIDv7.

```
job_registro     id pk, escola_id?, fila, prioridade smallint, tipo, dados jsonb (só ids),
                 nao_urgente bool, estado (aguardando|reservado|publicado|ativo|concluido|falhou),
                 requisicao_id?, reservado_ate?, criado_em, iniciado_em?, concluido_em?, codigo_falha?
  parcial (fila, escola_id, criado_em) where estado not in ('concluido','falhou')
  parcial (fila, escola_id, criado_em) where estado not in ('concluido','falhou') and not nao_urgente
                 (10.0: a reserva do horário letivo, só urgentes, sem atravessar os segurados)
  parcial (concluido_em) where estado in ('concluido','falhou')
  check escola_id is not null or tipo like 'sistema.%'
configuracao_operacional_escola
                 escola_id pk, fuso?, dias_letivos?, inicio?, fim?, limite_req_usuario_min?,
                 limite_req_escola_min?, vagas jsonb?        (nulo = padrão do ambiente)
  check inicio < fim quando os dois existem; horário padrão em JANELA_LETIVA_* do ambiente
uso_infra_diario escola_id, dia (America/Sao_Paulo), requisicoes, jobs, bytes_storage;
                 pk (escola_id, dia)
```

`requisicao_id` (acrescentado na 7.0) é o da requisição que pediu o job: é por ele que o RF9
segue a trilha da API ao despachante e ao worker. Não há FK para `escola`; o F1 a adiciona
expandindo. O serviço `migrar` roda antes das
instâncias, só expande, e usa `lock_timeout='5s'` com 3 tentativas. O migrador do Drizzle aplica tudo numa transação,
então não há `CREATE INDEX CONCURRENTLY`: o índice da 10.0 nasceu sem ele porque o F0 não tem
dado de produção. Antes do primeiro índice numa tabela que já cresce com aluno em produção, o
`migrar` precisa de um caminho fora da transação.

## 4. API

Erro: `{ erro: { codigo, mensagem, requisicaoId } }`.

| Método | Rota | Papel | Entrada | Saída |
|---|---|---|---|---|
| GET | `/saude` | anônimo | — | `{ ok }`; 503 sem Postgres |
| GET | `/prontidao` | rede interna | — | 200 se não drena; sem consultar dependência (senão o Caddy troca o 503 tipado por 502) |
| GET | `/v1/sistema/estado`, `/avisos` | anônimo | — | `{ versao, ambiente, componentes[] }`, `{ itens[] }` |
| GET | `/v1/sistema/contexto` | token | — | `{ escolaId, usuarioId }` |
| POST | `/v1/sistema/jobs-sinteticos` | token, `ROTAS_SINTETICAS=true` | `{ fila, cpuMs, naoUrgente, falhar? }` | 202 `{ jobId }` |
| GET | `/v1/sistema/jobs-sinteticos/:id` | token | — | `{ estado, criadoEm, iniciadoEm?, concluidoEm?, codigoFalha? }`, lido de `job_registro` |

**Token do F0.** JWT com `sub` e `esc`, emitido só por `npm run ops:token-sintetico`. A API
só o aceita com `ACEITAR_TOKEN_SINTETICO=true`, e não sobe com essa flag em
`AMBIENTE=producao`. O F1 troca o emissor e mantém a verificação.

Dois POSTs iguais em `jobs-sinteticos` criam dois jobs distintos: a rota é só de teste e não
tem chave de idempotência de pedido. A execução, sim: todo processador recebe a chave de
idempotência do job (D49, tarefa 16.0).

## 5. Fluxo

**Enfileirar.** `Enfileirador.enfileirar(tx, job)` insere em `job_registro` na transação
do chamador e emite `pg_notify('job')`.

**Despachar.** Duas instâncias, acordadas por NOTIFY ou a cada 500 ms.
1. **Seleção:** por fila, em ordem de prioridade, lista as escolas com job `aguardando` ou
   reserva vencida e pula o não urgente que cai na janela letiva.
2. **Reserva:** em rodízio de escolas, uma transação curta com `FOR UPDATE SKIP LOCKED`
   passa a linha para `reservado`, com `reservado_ate=now()+30s`, e faz commit. Na fila de
   lote, os urgentes são reservados primeiro (índice de pendentes urgentes) e, só fora da
   janela letiva da escola e com vaga sobrando, os não urgentes por ordem de chegada: às
   18h o acúmulo do dia não passa na frente do urgente que chega (10.0). A janela vale para
   a reserva: um não urgente publicado antes das 7h e parado no pool de lote cheio começa
   no worker mesmo depois das 7h, dentro das vagas de lote da escola. Leitura da
   configuração que falha sem leitura anterior usa a janela padrão, como as vagas.
3. **Vaga:** só depois da reserva, toma a vaga com Lua no ZSET `vaga:{fila}:{escola}`
   (membro `jobId`, validade 60 s, vaga vencida removida antes). Sem vaga, a linha volta a
   `aguardando`.
4. **Publicação:** `addBulk` fora da transação, com `jobId=id` e `commandTimeout` 2 s.
   Se falhar, devolve a vaga e a reserva expira. O reenvio com o mesmo `jobId` é ignorado.
5. **Reconciliação:** a cada minuto, `publicado` ou `ativo` com mais de 2 min e que o
   BullMQ confirma inexistente é publicado de novo; erro ou timeout não republica.

Toda troca de estado é condicional (`WHERE id=$1 AND estado IN (<origens>)`): escrita
tardia não sobrescreve `ativo`, `concluido` ou `falhou`.

**Executar.**
- **Filas:** três filas no Redis de fila (`noeviction`, AOF). O `worker-interativo` atende
  interativa e normal, o `worker-lote` atende lote, com duas réplicas cada.
- **Ciclo do job:** marca `ativo` e renova a vaga a cada 15 s. No fim, marca `concluido` ou
  `falhou` com código e libera a vaga.
- **Retentativa:** 5 tentativas com recuo exponencial de 2 s e jitter; a vaga fica com o job.
- **Stalled:** volta para a espera, ainda dono da vaga.
- **Garantia (D49):** a entrega é **pelo menos uma vez**, não exatamente uma vez. Um job pode
  rodar de novo por reentrega a partir de `ativo`, por falha em `concluir` depois do
  processador, por falso stalled ou pela reconciliação. O que é único é a reserva no banco.
  Por isso o processador recebe `{ jobId, tentativa, chaveIdempotencia }`, com a chave igual
  ao id do job em toda reexecução, e todo efeito externo (linha gravada, chamada de IA,
  aviso) usa essa chave para não duplicar.
- **Retenção:** BullMQ remove concluído com 1 dia e falho com 7. `sistema.expurgar-jobs`
  apaga `job_registro` com mais de 7 dias, em lotes de 5.000.

**Rate limit.** `rate-limiter-flexible` no Redis de cache (`allkeys-lru`, só chaves com TTL).
- **Chaves:** `rl:u:{usuario}` e `rl:e:{escola}`; `rl:ip:{ip}` só em `@RotaAnonima`, com IP
  de `X-Forwarded-For` confiado apenas do Caddy.
- **Queda do Redis:** `insuranceLimiter` em memória com limite ÷ instâncias;
  `limite.seguro_ativo=1`. Todo cliente Redis da API usa `enableOfflineQueue:false` e
  `commandTimeout` 100 ms.
- **Excesso:** 429 `LIMITE_EXCEDIDO` com `Retry-After`.
- **Padrões:** 120/min por usuário, 30.000/min por escola, 3.000/min por IP anônimo.
  Vagas por escola: interativa 5, normal 5, lote 2. Pools: 50, 30, 10. As vagas somadas das
  dez escolas cabem nos pools.

**Uso por escola.**
- **Contagem:** `INCR uso:{dia}:{escola}:req|jobs` no Redis de fila; falha ignorada.
- **Consolidação:** `sistema.consolidar-uso` roda às 2h. Para cada dia fechado faz `GET`,
  upsert com valor absoluto e só então `DEL`, o que torna a repetição idempotente. Soma os
  bytes do prefixo `escolas/{id}/`.

**Realtime.** O stream do adaptador fica no Redis de fila, com `maxLen`. O Caddy usa
`lb_policy cookie` para o polling do socket.io. O cliente reconecta com espalhamento
aleatório.

**Instâncias e troca.** O Caddy local balanceia as duas APIs e os dois realtimes, com
`health_uri /prontidao` a cada 2 s e `lb_try_duration 5s`. No SIGTERM, a instância põe
`/prontidao` em 503 e drena por 10 s; o worker faz `close()` com 30 s de graça. Assim
`docker compose restart api-1` não derruba requisição, e o mesmo mecanismo serve ao deploy
do staging.

**Esteira.** `ci.yml` no GitHub Actions, em todo push no `main`, com os jobs `verificar`
(tipos, lint com guardas, gitleaks, `npm audit`), `integracao` (compose com Postgres, Redis
e storage) e `e2e` (compose completo, Playwright, axe, size-limit). O YAML só chama
`npm run ci:*`, para a lógica ficar portável.

**Observação local.** Cada processo exporta OTLP para o `grafana/otel-lgtm` do compose.
Os logs vão para o stdout, em JSON.
- **Métricas:** `http.server.request.duration{http.route}`,
  `job.espera_mais_antiga_s{fila,escola_id}` (do despachante, via `criado_em`, vale com o
  Redis fora), `fila.vagas_em_uso{fila,escola_id}`, `realtime.conexoes`, `db.pool.em_uso`,
  `redis.disponivel`, `limite.seguro_ativo`. `escola_id` só em métrica de job.
- **Alertas:** as regras ficam provisionadas em `infra/grafana/alertas/`:
  - job interativo esperando mais de 30 s por 1 min
  - seguro de limite ativo por 2 min
  - 5xx acima de 5% numa rota por 5 min

  Cada uma tem entrada no runbook. `npm run ensaio:alertas` para o `worker-interativo`, o
  Redis de cache e força falha numa rota sintética, e confere pela API do Grafana que as
  três regras chegaram a disparadas. A entrega ao celular fica para o staging.

## 6. Isolamento (obrigatório)

- **Origem do escopo:** `escolaId` só do token, pelo contexto. O worker restaura o contexto
  de `job.data`.
- **Consulta de job:** filtra pela escola do contexto. Id de outra escola e id inexistente
  dão o mesmo 404 `NAO_ENCONTRADO`.
- **`@SemEscopo`, com justificativa:** despachante e expurgo (`fila`); consolidação (`uso`).
- **Ano letivo:** nenhuma tabela do F0 varia por ano letivo.
- **Testes**, que quebram sem a cláusula de escola: A não lê job de B; limite esgotado de A
  não dá 429 a B; A sem vaga não atrasa B; janela de A não vale para B.

## 7. Dado pessoal (obrigatório)

| Item | Resposta |
|---|---|
| Campos pessoais tocados | nenhum dado de escola; IP só na chave de limite anônimo |
| Novos campos (atualizar `docs/lgpd.md`) | nenhum; IP já está em "Logs de acesso" |
| O que vai para log | ids, rota template, status, duração. Redact do pino em `*.nome, *.matricula, *.email, *.senha, *.resposta, *.nota, *.conversa, *.prompt`, `authorization`, `cookie`. Erro do Postgres sem `detail`. Caddy sem log de acesso |
| O que entra em auditoria | nada até o F3 |
| O que é enviado a provedor externo | GitHub: código e dado sintético da esteira. Observabilidade é local |
| Retenção e expurgo | chave de limite 60 s; job 7 dias; observabilidade local sem retenção garantida |
| Autorização por objeto | job por escola do contexto |
| DTO de saída | seção 4, zod em `packages/shared` |

## 7b. Conformidade CNE

Não há IA no caminho do aluno.

## 7c. Carga e falha (obrigatório)

| Item | Resposta |
|---|---|
| Está no caminho quente? | fila, sala |
| Carga na manhã de segunda | cenário abaixo, local; prova comportamento, não capacidade |
| Fila, limite, rate limit, métrica, corridas | seção 5 |
| Índices e migration | seção 3 |
| Cenário de teste de carga | novo, `infra/k6/justica-entre-escolas.js` |

| Cai | O que o usuário vê |
|---|---|
| Postgres | "não foi possível agora, tente de novo em instantes"; `/saude` em 503 |
| Redis de fila | pedido aceito e "aguardando", nada se perde; alerta de job esperando |
| Redis de cache | nada; alerta de seguro ativo |
| Storage, observabilidade | nada |

**Cenário.** `npm run carga` sobe o compose com `infra/compose.carga.yml`, que fixa `cpus:`
por serviço e `maxWorkerThreads` coerente, para o resultado não depender da máquina e o
lote não roubar CPU do interativo. O k6 roda num container da mesma rede, então todos os
VUs saem de um IP. Os jobs sintéticos queimam CPU em processador sandbox
(`useWorkerThreads`), sem travar o event loop.

1. **Base:** por 2 min, a escola B manda 2 jobs interativos/s de 100 ms de CPU.
2. **Carga:** a escola A enfileira 2.000 lotes urgentes de 2 s de CPU e 500 interativos de
   100 ms em rajada, enquanto B repete a base.
3. **Rate limit:** 400 VUs da escola C chamam `contexto` 1/s, e um VU da C chama 5/s.
4. **Rota anônima:** 400 VUs anônimos recarregam a casca a cada 30 s.

Passa com:
- p95 de espera da B no máximo 500 ms acima da base
- nenhum job interativo esperando mais de 30 s
- 429 só para o VU abusivo
- nenhum job falhou

## 8. Uso de IA

Não se aplica.

## 9. Frontend

- **Casca:** rota única, sem identidade visual, com `EstadoCarregando`, `EstadoVazio` e
  `EstadoErro` (mensagem pelo `codigo`, com "tentar de novo") reutilizáveis. `Intl` pt-BR.
- **Responsiva (D51):** mobile-first, coluna única a partir de 360 px, sem rolagem
  horizontal, viewport sem bloquear zoom, alvo de toque de 44 px na ação, nada que dependa
  de hover.
- **Teto:** 150 kB em brotli no JS inicial, pelo size-limit.
- **Chromebook:** projeto Playwright com CPU ×4 e Fast 3G; dado em até 5 s.
- **Celular:** projeto Playwright com viewport 360 × 800, toque, CPU ×4 e rede móvel lenta, no
  Chromium; dado em até 5 s e sem rolagem horizontal. Todo spec de tela roda nos dois
  projetos.

## 10. Testes

| Camada | O que será testado |
|---|---|
| Unidade | janela letiva (terça 10h, sábado, escola com sábado); erro do Postgres sem `detail` |
| Integração | reexecução do job com a mesma chave de idempotência sem duplicar efeito (D49); Redis de fila religado sem perder nem duplicar e sem pendurar a API; dois despachantes; reserva vencida sem sobrescrever `ativo`/`concluido`; job perdido reconciliado; worker morto; falha permanente; rodízio; não urgente segurado; limite em duas APIs; seguro; realtime em duas instâncias; restart de uma API sem 502; consolidação repetida |
| E2E | quatro estados; teclado; toque; axe `wcag2a/2aa/21aa/22aa` reprovando `serious`/`critical`, com `target-size`; `chromebook` e `celular`; sem rolagem horizontal a 360 px; exceção sem stack |
| Isolamento | os quatro da seção 6 |
| Guardas | fixtures (log com `nome`, spread e template no logger, `import OpenAI` fora de `apps/api/src/ia/adapters/**`, segredo falso) que um teste Vitest passa por ESLint e gitleaks exigindo erro; `npm audit --audit-level=high --omit=dev` |
| Alertas | `ensaio:alertas` leva as três regras a disparadas |

Testes usam o `compose.yml`.

## 11. Conformidade com as regras

| Regra | Como é atendida | Desvio e justificativa |
|---|---|---|
| 00 | processos separados, erro tipado, compose único, OTLP e S3 puros | — |
| 10 | escopo pelo contexto, 404 idêntico, UUID, `@SemEscopo` justificado | sem FK para escola até o F1 |
| 20 | redact, guarda de log, nada externo além do GitHub, dado sintético | — |
| 30, 40, 50, 80 | seções 5, 9 e 10 | alerta sem entrega ao celular até o staging (D31) |
| D30, D31, D42 | uso marcado por escola; F0 só local; hospedagem escolhida ao criar o staging | — |
| D49, D51 | entrega pelo menos uma vez com chave de idempotência (16.0); casca responsiva testada em `chromebook` e `celular` (14.0) | — |

## 12. Premissas não verificadas

- ✅ **MinIO → SeaweedFS (verificado na tarefa 1.0, 13/09/2026):** a imagem `minio/minio`
  não está mais disponível publicamente no Docker Hub (acesso negado ao manifesto). O
  storage local passou a ser `chrislusf/seaweedfs` (Apache 2.0, amd64 e arm64 publicados,
  release 4.46 de 08/09/2026) em modo `weed mini`, com credencial S3 vinda de `.env.example`
  e bucket criado na subida. O acesso continua só pela API S3, então a troca não muda
  nenhum outro ponto desta spec.
- ⚠️ **`grafana/otel-lgtm`:** o README diz que a imagem é para desenvolvimento e teste, que
  é o uso aqui. Não confirmei o provisionamento de regra de alerta por arquivo nessa imagem.
  Reserva: Grafana e Prometheus separados no compose.

## 13. Riscos técnicos

- **2.000 min de Actions (conta do Gabriel):** medir no primeiro mês; se apertar, o e2e
  roda só quando a tarefa toca tela.
- **Vaga vencida com fila parada:** admite além do teto por até 60 s; aceito.
- **Local não mede rede real, TLS nem máquina de escola:** o staging cobre isso antes da
  primeira demonstração (D31).
