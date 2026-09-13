# Tarefa 12.0 — Painel local por rota, fila e escola

**Funcionalidade:** fundacao-tecnica · **Depende de:** 7.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `test-engineer`

## Objetivo

O compose passa a subir a observabilidade local. Um painel mostra latência e erro por rota,
espera de job por fila e por escola, vagas em uso, conexões de realtime, pool do banco e o
estado do seguro de limite.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF15; `techspec.md`: seção 5 ("Observação local")
- `.claude/rules/80-infra-e-carga.md`, item 10: código no caminho quente mede a si mesmo
- `.claude/rules/20-lgpd-menores.md`, item 9: métrica e rastro só com id
- `docs/infra.md`, seção 7: o que medir
- Código existente: despachante e `job_registro` (7.0), vagas (9.0, se já concluída), seguro
  de limite (6.0), realtime (5.0)

## Subtarefas

- [x] 12.1 — Serviço `observabilidade` com `grafana/otel-lgtm` no compose e
  `packages/nucleo/src/telemetria`: SDK OpenTelemetry com exportação OTLP, iniciado em api,
  realtime, despachante e worker
- [x] 12.2 — Métricas:
  - `http.server.request.duration` com `http.route` como template
  - `job.espera_mais_antiga_s{fila,escola_id}`, calculada pelo despachante a partir de
    `job_registro.criado_em`
  - `fila.vagas_em_uso{fila,escola_id}`
  - `realtime.conexoes`, `db.pool.em_uso`, `redis.disponivel{instancia}` e
    `limite.seguro_ativo`

  `escola_id` só entra nas métricas de job, e nenhuma métrica leva `usuario_id`.
- [x] 12.3 — Painel provisionado por arquivo em `infra/grafana/paineis/`
- [x] 12.4 — Testes consultando a API de métricas do otel-lgtm (Prometheus/Mimir). Captura
  de tela não conta

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/telemetria/iniciar.ts`, `metricas.ts` | novo |
| `apps/*/src/main.ts` | alterado |
| `apps/despachante/src/metricas-espera.ts` | novo |
| `infra/grafana/paineis/fundacao.json`, `infra/compose.yml` | novo / alterado |
| `infra/test/metricas.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: depois de jobs das escolas A e B, `job.espera_mais_antiga_s` tem séries separadas por escola e fila | integração | a fila de A aparece separada da de B (RF15) |
| borda: com o Redis de fila parado, a espera continua subindo | integração | a métrica vem de `criado_em`, não do BullMQ |
| borda: `http.route` registra `/v1/sistema/jobs-sinteticos/:id`, nunca o id | integração | não explode cardinalidade nem vaza id na rota |
| borda: parar o Redis de cache leva `limite.seguro_ativo` a 1 | integração | o seguro é visível |
| permissão: nenhuma série com label `usuario_id`; `escola_id` só em métrica de job | integração | métrica não carrega identificação além do necessário |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Regras de alerta (13.0). Envio a Grafana Cloud ou a qualquer serviço externo
(`notas-staging.md`).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-13 18:20:27 | 2026-09-13 18:24:11 | `infra-guardian` | 1 | APROVADO | ab39e93fba9b024ce |
| 2026-09-13 18:20:41 | 2026-09-13 18:24:19 | `privacy-guardian` | 1 | REPROVADO | a5cb48e21ba1a8733 |
| 2026-09-13 18:20:59 | 2026-09-13 18:25:18 | `test-engineer` | 1 | REPROVADO | acbb933d15f074958 |
| 2026-09-13 18:33:42 | 2026-09-13 18:34:38 | `infra-guardian` | 2 | APROVADO | ad817ce589b5c0862 |
| 2026-09-13 18:33:29 | 2026-09-13 18:36:40 | `test-engineer` | 2 | APROVADO | a7e7b78670e318b2d |
| 2026-09-13 18:33:16 | 2026-09-13 18:40:52 | `privacy-guardian` | 2 | APROVADO | a513f7ad337757dfe |
