# Tarefa 9.0 — Interativo nunca espera lote, e cada escola tem sua vaga

**Funcionalidade:** fundacao-tecnica · **Depende de:** 7.0
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `test-engineer`

## Objetivo

Os jobs passam a correr em três filas com pools separados. Uma escola com mil lotes na fila
não ocupa mais que as suas vagas e não atrasa o trabalho de outra escola.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF4, RF5 e caso de borda "uma escola sobe 300 apostilas…"
- `techspec.md`: seção 3 (`configuracao_operacional_escola`) e seção 5 ("Despachar"
  passos 1 a 4, "Executar", "Padrões")
- `.claude/rules/80-infra-e-carga.md`, itens 2 e 3; `docs/infra.md`, seções 5.2 e 5.3
- `.claude/rules/10-multitenancy.md`: configuração lida só para a escola do job
- `CLAUDE.md`, D41: limite é configuração por escola, nunca constante
- Código existente: despachante e worker (7.0 e 8.0)

## Subtarefas

- [x] 9.1 — Três filas BullMQ (`interativa`, `normal`, `lote`) no Redis de fila.
  - `worker-interativo` (`FILAS=interativa,normal`, pools de 50 e 30) e `worker-lote`
    (`FILAS=lote`, pool de 10), com duas réplicas cada no compose.
  - A prioridade vem da fila do job.
- [x] 9.2 — Schema e migration de `configuracao_operacional_escola`, com as colunas nulas
  caindo no padrão do ambiente. Repository escopado: o despachante lê a configuração da
  escola do job. Os limites de requisição por escola da 6.0 passam a ler daqui também
- [x] 9.3 — `VagasPorEscola` com script Lua no ZSET `vaga:{fila}:{escola}`:
  - membro `jobId`, validade 60 s, vaga vencida removida antes da contagem
  - despachante toma a vaga **depois** da reserva; sem vaga, a linha volta a `aguardando`
  - rodízio entre escolas por fila, em ordem de prioridade
  - worker renova a vaga a cada 15 s e libera no fim; na retentativa, a vaga fica com o job
  - padrões: interativa 5, normal 5, lote 2
- [x] 9.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/configuracao-operacional-escola.ts`, migration | novo |
| `packages/nucleo/src/configuracao/configuracao-operacional.repository.ts` | novo |
| `packages/nucleo/src/fila/vagas-por-escola.ts`, `vaga.lua`, `filas.ts` | novo |
| `apps/despachante/src/despachante.ts`, `apps/worker/src/main.ts` | alterado |
| `packages/nucleo/src/limite/guarda-limite.ts` | alterado |
| `infra/compose.yml`, `.env.example` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: com 1.000 lotes na fila, um interativo novo começa antes de qualquer lote não iniciado | integração | quebra se os pools forem compartilhados |
| a escola A com 1.000 lotes nunca passa de 2 vagas em uso; um lote da B começa sem esperar | integração | quebra sem `VagasPorEscola` |
| concorrência: dois despachantes tomando vaga da mesma escola ao mesmo tempo → vagas em uso ≤ limite | integração | quebra se a vaga for verificada e gravada fora do Lua |
| borda: reserva feita e vaga negada → a linha volta a `aguardando` e nenhuma vaga fica presa | integração | a ordem reserva-então-vaga |
| borda: worker morto segurando vaga → a vaga vence em 60 s e a escola volta a andar | integração | não há vaga órfã para sempre |
| borda: `vagas` nula usa o padrão; `vagas.lote=5` vale só para aquela escola | integração | a configuração é por escola |
| isolamento: A sem vaga não atrasa B; a configuração de A não altera B | integração | quebra sem a cláusula de escola |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Janela letiva (10.0). Métrica de vagas em uso (12.0). Cenário de carga (15.0).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-13 11:22:53 | 2026-09-13 11:26:00 | `tenancy-guardian` | 1 | APROVADO | ad07cfd41fae27efc |
| 2026-09-13 11:22:33 | 2026-09-13 11:28:02 | `infra-guardian` | 1 | REPROVADO | a11386e4c953d028b |
| 2026-09-13 11:23:12 | 2026-09-13 11:29:45 | `test-engineer` | 1 | REPROVADO | a1aa9a16acf5800a5 |
| 2026-09-13 11:59:25 | 2026-09-13 12:01:50 | `tenancy-guardian` | 2 | APROVADO | a21c558ca0f4624c3 |
| 2026-09-13 11:59:13 | 2026-09-13 12:02:04 | `test-engineer` | 2 | REPROVADO | af0ddce041942b3f9 |
| 2026-09-13 11:58:56 | 2026-09-13 12:03:25 | `infra-guardian` | 2 | REPROVADO | adfa67a18c9c3d4fe |
| 2026-09-13 12:22:39 | 2026-09-13 12:24:22 | `tenancy-guardian` | 3 | APROVADO | ab74514746186e541 |
| 2026-09-13 12:22:16 | 2026-09-13 12:25:00 | `infra-guardian` | 3 | APROVADO | a977e982b6d83a93d |
| 2026-09-13 12:22:29 | 2026-09-13 12:25:18 | `test-engineer` | 3 | APROVADO | ac9cf9a6d88ed4a5a |
| 2026-09-13 12:26:27 | 2026-09-13 12:27:52 | `infra-guardian` | 4 | APROVADO | ae3442f92c6e26d26 |
| 2026-09-13 12:26:33 | 2026-09-13 12:28:10 | `tenancy-guardian` | 4 | APROVADO | a1d8ce9f88a2b8772 |
| 2026-09-13 12:26:38 | 2026-09-13 12:28:39 | `test-engineer` | 4 | APROVADO | ac77092b90da6f1fd |
