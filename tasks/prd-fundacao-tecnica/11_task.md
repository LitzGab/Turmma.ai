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

- [ ] 11.1 — Interceptor da API e hook do worker fazem
  `INCR uso:{dia}:{escola}:req|jobs` no Redis de fila, sem esperar a resposta.
  - `dia` é calculado em `America/Sao_Paulo`.
  - A falha do contador é ignorada e nunca afeta a requisição.
- [ ] 11.2 — Schema e migration de `uso_infra_diario`, e job `sistema.consolidar-uso` na fila
  de lote, disparado às 2h por `upsertJobScheduler` com `tz`.
  - O disparo passa pelo `Enfileirador`, que mantém a trilha única.
  - Para cada dia fechado: `GET`, upsert com valor absoluto e só depois `DEL`.
  - Soma os bytes do prefixo `escolas/{id}/` no storage.
  - Leva `@SemEscopo` com justificativa.
- [ ] 11.3 — Job `sistema.expurgar-jobs`: apaga `job_registro` concluído ou falho há mais
  de 7 dias, em lotes de 5.000, usando o índice parcial de `concluido_em`
- [ ] 11.4 — Consulta de uso por escola no dia e no mês, pelo repository ou por
  `npm run ops:uso`
- [ ] 11.5 — Testes

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

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Vetos aprovados (se aplicáveis)
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Custo do ambiente e rateio em reais (`notas-staging.md`, quando o staging existir). Expurgo
de dado pessoal por retenção da escola (F3).
