# Tarefa 3.0 — Refazer o convite da coordenação

**Funcionalidade:** apresentacao-painel · **Depende de:** 2.0 · **Paralelo com:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador refaz o último convite de uma escola em `pendente` ou `vencido`: o anterior deixa de valer
e um novo, para a mesma pessoa, aparece uma vez, sem corrida que deixe dois em aberto.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 3 (`convite.refeito`), 4, 5 (a matriz e "Refazer de convite que não é o
  último") e 7c
- `cenarios.md`: E6, E8, E9, E11, A1, A2, A3
- `.claude/rules/20-lgpd-menores.md` (itens 8 e 10), `40-testes.md`, `80-infra-e-carga.md` (item 7)
- Código da 2.0: o caso de uso do convite, `travarEscola()`, `estadoDaCoordenacao` e os testes de
  `apps/api/test/painel-convite.int.test.ts`, que esta tarefa estende
- `packages/nucleo/src/auditoria/acoes.ts` — `convite.criado` como modelo de `convite.refeito`

## Subtarefas

- [ ] 3.1 — Ação `convite.refeito` em `acoes.ts`, com `depois: { origemId, usuarioId, expiraEm }`
- [ ] 3.2 — `refazer(conviteId)` no caso de uso: autor, trava, estado; o convite do id precisa ser o
  último da escola e estar em `pendente` ou `vencido`, senão `CONFLITO`. O `update convite set
  revogado_em = now() where escola_id = $e and id = $c and usado_em is null and revogado_em is null
  returning usuario_id` (vale para o vencido) e o novo convite para o mesmo usuário na mesma transação
- [ ] 3.3 — `POST /v1/operacao/convites/:id/refazer`, com `conviteId` e `token`, `no-store`; log
  `operacao.convite.refeito`, só com ids
- [ ] 3.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/auditoria/acoes.ts` | alterado |
| `apps/api/src/sessao/convite.service.ts`, `convite.repository.ts` | alterado |
| `apps/api/src/operacao/painel.controller.ts`, `painel.service.ts` | alterado |
| `packages/shared/src/operacao/painel.ts` | alterado |
| `apps/api/test/painel-convite.int.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E6 (refazer) | integração | refazer em cada estado da matriz; refazer de vencido cria outro e o vencido não abre mais; refazer de convite que não é o último: `CONFLITO` |
| E8 (com refazer) | integração | dois refazer; refazer e revogar, com a ordem forçada como na 2.0 (trava segurada, as duas em `wait_event = 'advisory'`): no máximo um convite em aberto, o perdedor com o erro da matriz |
| I7 (refazer) | integração | refazer em escola `ativa` não grava nada |
| I6 (refazer) | integração | as sentinelas também não aparecem no refazer, inclusive em 409 e 503 |
| E9 | integração | mutação sem a trava: dois refazer do mesmo convite continuam com um só em aberto, pelo índice |
| E11 (refazer) | integração | autor desativado no meio: 401 sem gravar, ou entra com auditoria |
| A1 | integração | `convite.refeito` com `origemId`, `usuarioId` e `expiraEm`, sem nome, e-mail nem token |
| A2, A3 (refazer) | integração | token fora do banco e do log; `token_hash` é o SHA-256 dele |
| permissão | integração | sessão de escola no refazer: o 404 de rota inexistente (pela varredura gerada, I3) |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A ativação sob a trava (4.0); telas (7.0).
