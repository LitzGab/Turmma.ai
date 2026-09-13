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

- [ ] 9.1 — Três filas BullMQ (`interativa`, `normal`, `lote`) no Redis de fila.
  - `worker-interativo` (`FILAS=interativa,normal`, pools de 50 e 30) e `worker-lote`
    (`FILAS=lote`, pool de 10), com duas réplicas cada no compose.
  - A prioridade vem da fila do job.
- [ ] 9.2 — Schema e migration de `configuracao_operacional_escola`, com as colunas nulas
  caindo no padrão do ambiente. Repository escopado: o despachante lê a configuração da
  escola do job. Os limites de requisição por escola da 6.0 passam a ler daqui também
- [ ] 9.3 — `VagasPorEscola` com script Lua no ZSET `vaga:{fila}:{escola}`:
  - membro `jobId`, validade 60 s, vaga vencida removida antes da contagem
  - despachante toma a vaga **depois** da reserva; sem vaga, a linha volta a `aguardando`
  - rodízio entre escolas por fila, em ordem de prioridade
  - worker renova a vaga a cada 15 s e libera no fim; na retentativa, a vaga fica com o job
  - padrões: interativa 5, normal 5, lote 2
- [ ] 9.4 — Testes

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

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Vetos aprovados (se aplicáveis)
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Janela letiva (10.0). Métrica de vagas em uso (12.0). Cenário de carga (15.0).
