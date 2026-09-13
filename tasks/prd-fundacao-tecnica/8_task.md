# Tarefa 8.0 — Job sobrevive à queda do Redis de fila

**Funcionalidade:** fundacao-tecnica · **Depende de:** 7.0
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`

## Objetivo

Com o Redis de fila fora do ar, a API continua aceitando job sem pendurar, e nada se perde.
Quando o Redis volta, cada job executa uma vez. Job que o Redis perdeu depois de publicado
é republicado sem duplicar.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `techspec.md`: seção 5 ("Despachar", passos 4 e 5, e a troca condicional) e seção 7c
  (Redis de fila cai)
- `.claude/rules/80-infra-e-carga.md`, itens 4, 6 e 7
- `docs/infra.md`, seção 4 ("Dois Redis")
- Código existente: `apps/despachante/src/despachante.ts`, `JobRegistroRepository` e worker
  (7.0)

## Subtarefas

- [x] 8.1 — Publicação resiliente: cliente BullMQ do despachante com `commandTimeout` 2 s.
  Na falha, a reserva expira sozinha e a linha volta a ser selecionável. Nenhuma exceção
  derruba o processo do despachante, e a falha é logada só com id
- [x] 8.2 — Reconciliação a cada minuto: `publicado` ou `ativo` com mais de 2 min é
  consultado no BullMQ. Só é publicado de novo, com o mesmo `jobId`, quando o BullMQ
  **confirma** que o job não existe. Erro ou timeout na consulta não republica
- [x] 8.3 — Testes com o container do Redis parado e religado

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/despachante/src/despachante.ts` | alterado |
| `apps/despachante/src/reconciliacao.ts` | novo |
| `packages/nucleo/src/redis/clientes.ts` | alterado |
| `apps/despachante/test/redis-fora.int.test.ts`, `reconciliacao.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: com o Redis de fila parado, 50 POSTs dão 202 em menos de 1 s cada; ao religar, cada job executa uma vez | integração | quebra se a publicação acontecer dentro do request ou se a reserva não expirar |
| borda: job apagado do BullMQ depois de `publicado` é republicado pela reconciliação e executa uma vez | integração | o AOF perdeu o job e ele volta |
| borda: consulta ao BullMQ com timeout (Redis pausado) não republica | integração | não duplica job em caso de dúvida |
| borda: dois despachantes reconciliando em paralelo não publicam duas vezes | integração | a reconciliação usa a mesma troca condicional |
| borda: despachante continua vivo depois de 2 min de Redis fora | integração | uma falha de dependência não derruba o processo |

Sem permissão nem isolamento novos: a tarefa não abre rota nem consulta nova por escola.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Métrica de espera e alerta de job interativo esperando (12.0 e 13.0). Vagas por escola
(9.0).
