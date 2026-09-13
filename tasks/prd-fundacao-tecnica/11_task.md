# Tarefa 11.0 — Uso marcado por escola, com consolidação e expurgo

**Funcionalidade:** fundacao-tecnica · **Depende de:** 9.0
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `privacy-guardian`, `test-engineer`

## Objetivo

Requisições, jobs e bytes armazenados passam a ser contados por escola e por dia, e uma
rotina noturna consolida esses números no banco sem duplicar. Uma segunda rotina apaga os
registros de job antigos sem tocar em job ativo.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF17; `CLAUDE.md`: D30 (revista: o uso nasce marcado no F0) e D49 (entrega pelo
  menos uma vez: os dois processadores desta tarefa recebem a chave de idempotência da 16.0,
  se ela já estiver concluída, e toleram reexecução por desenho)
- `techspec.md`: seção 3 (`uso_infra_diario`) e seção 5 ("Uso por escola" e "Retenção")
- `.claude/rules/80-infra-e-carga.md`, itens 2, 7 e 8: lote, idempotência, índice com escopo
- `.claude/rules/10-multitenancy.md`, item 9: `@SemEscopo` só em rotina nossa, justificado
- `.claude/rules/20-lgpd-menores.md`, item 16: expurgo conforme retenção
- Código existente: `Enfileirador`, despachante, filas e vagas (7.0 e 9.0), cliente Redis
  (6.0)

## Subtarefas

- [x] 11.1 — Interceptor da API e hook do worker fazem
  `INCR uso:{dia}:{escola}:req|jobs` no Redis de fila, sem esperar a resposta.
  - `dia` é calculado em `America/Sao_Paulo`.
  - A falha do contador é ignorada e nunca afeta a requisição.
- [x] 11.2 — Schema e migration de `uso_infra_diario`, e job `sistema.consolidar-uso` na fila
  de lote, disparado às 2h por `upsertJobScheduler` com `tz`.
  - O disparo passa pelo `Enfileirador`, que mantém a trilha única.
  - Para cada dia fechado: `GET`, upsert com valor absoluto e só depois `DEL`.
  - Soma os bytes do prefixo `escolas/{id}/` no storage.
  - Leva `@SemEscopo` com justificativa.
- [x] 11.3 — Job `sistema.expurgar-jobs`: apaga `job_registro` concluído ou falho há mais
  de 7 dias, em lotes de 5.000, usando o índice parcial de `concluido_em`
- [x] 11.4 — Consulta de uso por escola no dia e no mês, pelo repository ou por
  `npm run ops:uso`
- [x] 11.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/uso/contador-uso.ts`, `uso.repository.ts` | novo |
| `packages/nucleo/src/db/schema/uso-infra-diario.ts`, migration | novo |
| `apps/worker/src/processadores/consolidar-uso.ts`, `expurgar-jobs.ts` | novo |
| `apps/worker/src/agendamentos.ts` | novo |
| `apps/api/src/main.ts`, `apps/api/src/ops/uso.ts` | alterado / novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: N requisições e M jobs da escola A aparecem no dia e no mês | integração | a marcação chega ao banco |
| concorrência: consolidação executada duas vezes em paralelo não dobra o valor | integração | quebra se usar incremento em vez de valor absoluto |
| borda: requisição às 23h59 e às 00h01 no horário de São Paulo cai em dias diferentes; 31/12 fecha dezembro | integração (relógio injetado) | o dia não é calculado em UTC |
| borda: bytes de `escolas/{a}/` não somam `escolas/{a}x/` | integração (storage real) | o prefixo termina com barra |
| borda: expurgo de 12.000 jobs vencidos em lotes de 5.000 não apaga job `ativo` nem job recente | integração | o expurgo só alcança o que venceu |
| concorrência: `sistema.expurgar-jobs` reexecutado no meio de um lote (worker morto) termina sem erro e sem apagar nada além do vencido | integração | o expurgo tolera a entrega pelo menos uma vez (D49) |
| borda: Redis de fila fora → a requisição não falha nem demora | integração | o contador é descartável |
| isolamento: o uso da escola A não soma na B | integração | a chave leva a escola |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Custo do ambiente e rateio em reais (`notas-staging.md`, quando o staging existir). Expurgo
de dado pessoal por retenção da escola (F3).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-13 14:13:27 | 2026-09-13 14:15:16 | `privacy-guardian` | 1 | APROVADO | a59c8f878f61584c9 |
| 2026-09-13 14:13:13 | 2026-09-13 14:15:44 | `tenancy-guardian` | 1 | APROVADO | a98c6ecb78af48e8c |
| 2026-09-13 14:12:54 | 2026-09-13 14:16:28 | `infra-guardian` | 1 | APROVADO | a2b10950d66a0a6ba |
| 2026-09-13 16:42:28 | 2026-09-13 16:42:59 | `privacy-guardian` | 2 | APROVADO | a7beb70c60bd44609 |
| 2026-09-13 16:42:21 | 2026-09-13 16:43:08 | `tenancy-guardian` | 2 | APROVADO | a3bc93d3840ac0e24 |
| 2026-09-13 16:42:13 | 2026-09-13 16:43:23 | `infra-guardian` | 2 | APROVADO | a76a361b976e92b39 |
| 2026-09-13 16:42:45 | 2026-09-13 16:50:52 | `test-engineer` | 1 | REPROVADO | aa0d23847cde9e489 |
| 2026-09-13 17:23:47 | 2026-09-13 17:25:05 | `infra-guardian` | 3 | APROVADO | a9737f72ac01a395c |
| 2026-09-13 17:24:01 | 2026-09-13 17:25:12 | `privacy-guardian` | 3 | APROVADO | aab1d2aaa867af402 |
| 2026-09-13 17:23:54 | 2026-09-13 17:25:35 | `tenancy-guardian` | 3 | APROVADO | a970fc75ea3e45e2f |
| 2026-09-13 17:24:16 | 2026-09-13 17:25:56 | `test-engineer` | 2 | APROVADO | ab91a5661ca07d213 |
