# Tarefa 7.0 — Job aceito é executado uma única vez e dá para consultar

> Promessa revista pela D49 na tarefa 16.0: a entrega é **pelo menos uma vez**, e o
> processador tolera reexecução pela chave de idempotência. O texto abaixo é o original.

**Funcionalidade:** fundacao-tecnica · **Depende de:** 4.0
**Subagentes obrigatórios:** `tenancy-guardian`, `infra-guardian`, `privacy-guardian`, `test-engineer`

## Objetivo

Um job sintético aceito pela API é gravado no Postgres, publicado pelo despachante,
executado pelo worker exatamente uma vez e consultável pela escola dona dele. Isso vale
mesmo com dois despachantes e com worker morto no meio.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF7, RF9 (a trilha pela fila e pelo worker) e caso de borda "worker reinicia no
  meio da correção"
- `techspec.md`: seção 3 (`job_registro`, migração), seção 4 (rotas de job sintético e a
  decisão do clique duplo) e seção 5 ("Enfileirar", "Despachar" passos 1, 2 e 4,
  "Executar")
- `.claude/rules/00-arquitetura.md`, item 4: nada demorado em request
- `.claude/rules/80-infra-e-carga.md`, itens 2, 7 e 9: fila, concorrência no banco, migration
  compatível
- `.claude/rules/10-multitenancy.md`, itens 1, 3, 6 e 9: `escola_id`, escopo no repository,
  404 idêntico, `@SemEscopo` justificado
- Skills: `bullmq-specialist`, `drizzle-orm-patterns`, `supabase-postgres-best-practices`
  (RLS não substitui o repository)
- Código existente: contexto, logger e erro (2.0), identidade (4.0), compose (1.0)

## Subtarefas

- [x] 7.1 — Schema Drizzle de `job_registro` com os índices parciais e o check da Tech
  Spec, a primeira migration e o serviço `migrar` no compose. O serviço roda antes das
  instâncias, com `lock_timeout='5s'` e 3 tentativas
- [x] 7.2 — `Enfileirador.enfileirar(tx, job)` insere na transação do chamador e emite
  `pg_notify('job')`. O `JobRegistroRepository` aplica escopo de escola. As consultas do
  despachante levam `@SemEscopo` com justificativa
- [x] 7.3 — `apps/despachante`, com duas réplicas:
  - acordado por LISTEN ou a cada 500 ms
  - seleciona `aguardando` ou reserva vencida
  - reserva com `FOR UPDATE SKIP LOCKED` em transação curta
  - publica com `addBulk` fora da transação (`jobId = id`)
  - toda troca de estado é condicional: `WHERE id=$1 AND estado IN (...)`

  Nesta tarefa há uma fila só, sem vaga nem janela.
- [x] 7.4 — `apps/worker`, com duas réplicas:
  - restaura o contexto (`escolaId`, `requisicaoId`) de `job.data`
  - marca `ativo`, depois `concluido` ou `falhou` com `codigo_falha`
  - 5 tentativas com recuo exponencial de 2 s e jitter
  - stalled padrão do BullMQ
  - `worker.close()` no SIGTERM, com 30 s de graça
  - `removeOnComplete` de 1 dia e `removeOnFail` de 7 dias
- [x] 7.5 — `POST /v1/sistema/jobs-sinteticos`, só com `ROTAS_SINTETICAS=true` e token:
  - corpo `{ fila, cpuMs, naoUrgente, falhar? }` validado por zod
  - o corpo não aceita `tipo` nem `escolaId`
  - responde 202 `{ jobId }`

  `GET /v1/sistema/jobs-sinteticos/:id` lê de `job_registro` filtrando pela escola do
  contexto.
- [x] 7.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/job-registro.ts`, `packages/nucleo/drizzle/0001_*.sql` | novo |
| `packages/nucleo/src/fila/enfileirador.ts`, `job-registro.repository.ts` | novo |
| `apps/despachante/src/main.ts`, `despachante.ts` | novo |
| `apps/worker/src/main.ts`, `processadores/sintetico.ts` | novo |
| `apps/api/src/sistema/jobs-sinteticos.controller.ts`, `.service.ts` | novo |
| `packages/shared/src/sistema/jobs-sinteticos.ts` | novo |
| `infra/compose.yml`, `.env.example` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: POST dá 202; o GET mostra aguardando → ativo → concluido; o mesmo `requisicaoId` aparece no log da API, do despachante e do worker | integração | trilha completa e RF9 fechado |
| concorrência: dois despachantes reais em paralelo sobre 500 jobs → cada job executa exatamente uma vez | integração | quebra sem a reserva no banco: tirando juntos o `FOR UPDATE SKIP LOCKED` e a condição repetida no `UPDATE` (cada um sozinho é redundante, pela reavaliação do Postgres) |
| borda: escrita tardia de `reservado` não sobrescreve `concluido` | integração | a troca de estado é condicional |
| borda: `kill -9` no worker no meio do job → o job é retomado e termina `concluido` | integração | stalled funciona |
| borda: `falhar: true` → 5 tentativas e `falhou` com `codigoFalha` e escola | integração | a retentativa tem limite e deixa registro |
| borda: dois POSTs iguais em paralelo → dois jobs distintos, sem 500 | integração | o comportamento declarado na Tech Spec |
| permissão: sem token → 401; com `ROTAS_SINTETICAS=false` → 404; `tipo: sistema.*` e `escolaId` no corpo são recusados | integração | a rota de teste não abre porta |
| isolamento: a escola A consulta job da B e recebe 404 com corpo idêntico ao de um id inexistente | integração | quebra sem a cláusula de escola |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Redis de fila fora e reconciliação (8.0). Três filas, pools e vagas por escola (9.0).
Janela letiva (10.0). Expurgo (11.0). Processador em sandbox (15.0).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

> Rodadas reconstruídas em 13/09/2026 a partir dos registros locais das sessões (o transcript de
> cada revisor), antes de o hook existir. Horário de Brasília.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-13 08:38:46 | 2026-09-13 08:41:47 | `tenancy-guardian` | 1 | REPROVADO | aefd656e338656017 |
| 2026-09-13 08:39:14 | 2026-09-13 08:41:49 | `privacy-guardian` | 1 | APROVADO | aacb7a3896be493d5 |
| 2026-09-13 08:39:27 | 2026-09-13 08:43:37 | `test-engineer` | 1 | REPROVADO | a01534304c011ab85 |
| 2026-09-13 08:39:03 | 2026-09-13 08:43:46 | `infra-guardian` | 1 | APROVADO | a85a7182719d6d3f0 |
| 2026-09-13 08:53:51 | 2026-09-13 08:55:00 | `tenancy-guardian` | 2 | APROVADO | aefd656e338656017 |
| 2026-09-13 08:54:02 | 2026-09-13 08:55:02 | `test-engineer` | 2 | APROVADO | a01534304c011ab85 |
