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

- [x] 3.1 — Ação `convite.refeito` em `acoes.ts`, com `depois: { origemId, usuarioId, expiraEm }`
- [x] 3.2 — `refazer(conviteId)` no caso de uso: autor, trava, estado; o convite do id precisa ser o
  último da escola e estar em `pendente` ou `vencido`, senão `CONFLITO`. O `update convite set
  revogado_em = now() where escola_id = $e and id = $c and usado_em is null and revogado_em is null
  returning usuario_id` (vale para o vencido) e o novo convite para o mesmo usuário na mesma transação
- [x] 3.3 — `POST /v1/operacao/convites/:id/refazer`, com `conviteId` e `token`, `no-store`; log
  `operacao.convite.refeito`, só com ids
- [x] 3.4 — Testes

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

## Onde cada cenário está

- **E6 (refazer), A1:** `apps/api/test/painel-convite.int.test.ts`, "E6 e A1: refazer, em cada estado…": os sete estados
  pela matriz (o que não é permitido não muda nada, nem o estado); no permitido, a origem sai revogada, o convite novo é do
  mesmo usuário, o link de origem não abre e o novo abre, e a única auditoria nova é `convite.refeito` com `origemId`,
  `usuarioId` e `expiraEm` (o mesmo `expira_em` gravado, 72 h), sem nome, e-mail nem token. "Não é o último": o de origem de
  um refazer e um em aberto de antes da trava.
- **E8 (refazer):** dois refazer; refazer e revogar nas duas ordens. A ordem é forçada por `emOrdemNaTrava`: o teste segura a
  trava, dispara a primeira, espera-a em `wait_event = 'advisory'`, dispara a segunda, espera as duas, e solta; o Postgres
  entrega a trava na ordem da fila.
- **E9:** "E9: sem a trava da escola…", com o caso de uso chamado sobre `semATravaDaEscola(banco)` (ver divergências), e o
  aceite (que até a 4.0 não pega a trava) no meio do refazer.
- **E11 (refazer):** "E11", o `desativar` segurando a linha (401 sem gravar) e o refazer segurando o `for share` (entra com
  `convite.refeito`).
- **E12 (refazer):** o corpo com campo a mais é 400 sem gravar, no teste da E12.
- **I6 (refazer):** "I6 (refazer)", com coordenação, aluno (nome e matrícula) e turma sentinela: 400, 404, 201, 409 e 503.
- **I7 (refazer):** "I7", escola `ativa` pelo aceite, e `ativa` com o último convite ainda em aberto (a linha `ativa` da matriz
  é a única que segura esse caso).
- **A2, A3 (refazer):** "A2 e A3", o token novo e o de origem fora de coluna e da auditoria, e o log `operacao.convite.refeito`
  só com ids.
- **Isolamento do repository** (`revogarParaRefazer` no contexto de outra escola, uma vez só, usado não, vencido sim):
  `apps/api/src/sessao/convite.repository.int.test.ts`.
- **Permissão e I3:** a rota nova entra nas listas de C36 e C41 (`arquitetura.test.ts`), C46 (`operacao-isolamento.int.test.ts`)
  e na lista de rotas com convite de `convite.int.test.ts`.

## Divergências resolvidas nesta tarefa

- **E9: o que segura o refazer sem a trava é o `update` condicional, e não o índice.** O refazer revoga a origem antes de
  criar o novo. Dois refazer do mesmo convite sem a trava: o segundo para no `update` da mesma linha, e quando o primeiro
  confirma o Postgres confere as condições de novo (`revogado_em is null`) e não revoga nada: `CONFLITO`. O índice
  `convite_pendente_unico` só seria alcançado se o `update` perdesse essa condição; o 23505 dele como `CONFLITO` segue
  provado no teste do repository (2.0). O teste da E9 prova o resultado (um só em aberto, o perdedor com `CONFLITO`) e que
  o segundo passou mesmo pela leitura do estado (dois parados em `update "convite"`).
- **A mutação da E9 é só do teste:** `semATravaDaEscola(banco)` embrulha o banco num `Proxy` cujas transações devolvem na
  hora o `pg_advisory_xact_lock` e passam o resto adiante. Nenhum gancho no código de produção; se o proxy deixasse de
  desligar a trava, o segundo refazer esperaria nela e o teste falharia.
- **O aceite ainda não pega a trava (4.0)**, e o refazer no meio de um aceite é segurado pelo `usado_em is null` do mesmo
  `update`: teste na E9. Na 4.0 o refazer passa a esperar na trava, com o mesmo resultado (a espera do teste aceita as duas).
- **Refazer em `sem_convite` responde `NAO_ENCONTRADO`**: não há convite a passar, e o id é o de um inexistente, como o revogar
  da 2.0.
- **O refazer grava só `convite.refeito`**, no convite novo, com `origemId`; não grava `convite.revogado` da origem, que o
  `origemId` já registra.
- **O refazer responde 201**, como o gerar (cria um convite), com o mesmo contrato de resposta (`conviteId`, `token`); o
  docblock do contrato em `packages/shared` passa a citar as duas rotas.
- **I6, 503:** a API do teste com o prazo das consultas curto (`subirApiDoPainel(…, prazoDasConsultasMs)`), o refazer
  esperando a trava segura pelo teste até o `statement_timeout`: `TEMPO_ESGOTADO` com `Retry-After`, nada gravado.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A ativação sob a trava (4.0); telas (7.0).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 19:47:51 | 2026-09-24 19:49:54 | `test-engineer` | 1 | APROVADO | a19db2ac3cf908f91 |
| 2026-09-24 19:50:12 | 2026-09-24 19:50:41 | `privacy-guardian` | 1 | APROVADO | a7212ef0f84948ff2 |
| 2026-09-24 19:50:11 | 2026-09-24 19:50:48 | `tenancy-guardian` | 1 | APROVADO | ac9681eb490e69d32 |
| 2026-09-24 19:50:17 | 2026-09-24 19:50:54 | `infra-guardian` | 1 | APROVADO | a1c93dda3b12e009f |
| 2026-09-24 19:50:04 | 2026-09-24 19:51:12 | `revisor-geral` | 1 | APROVADO | a53058eb0f54dcdf8 |
