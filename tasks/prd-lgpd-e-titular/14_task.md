# Tarefa 14.0 — A eliminação fica agendada por 7 dias, com o acesso suspenso e o cancelamento

**Funcionalidade:** lgpd-e-titular · **Depende de:** 1.0, 11.0 · **Paralelo com:** 12.0, 13.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Registrar a eliminação suspende o acesso na requisição seguinte, sem revelar nada a quem não tem a credencial, e cancelar devolve o acesso.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (`eliminacao_agendada_em`), 4 ("Login suspenso") e 5 ("Eliminação": registro e cancelar)
- `.claude/rules/80-infra-e-carga.md` itens 1 e 7
- Código: `packages/nucleo/src/identidade/sessao.repository.ts`, `apps/api/src/sessao/matricula.service.ts`, os logins por e-mail e conta externa, o seletor de escola
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 14.1 — Migration própria: `usuario.eliminacao_agendada_em`; único parcial de `agendado`
- [ ] 14.2 — Registro de eliminação (sessões encerradas com `eliminacao_agendada`); cancelar com a trava pedido → usuário
- [ ] 14.3 — Guarda, renovação e logins: `ACESSO_SUSPENSO` só depois da credencial; e-mail e seletor sem a escola
- [ ] 14.4 — `pessoa_desativada` pula quem tem pedido `agendado` (5.0)
- [ ] 14.5 — Runbook do rollback
- [ ] 14.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e `usuario.ts` | alterado |
| `sessao` (guarda, logins, renovação, seletor) | alterado |
| `privacidade` service | alterado |
| `expurgo-da-escola.repository.ts` | alterado |
| `docs/runbook.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| suspensão | integração | token anterior recusado; login certo, renovação e conta Google/Microsoft dão `ACESSO_SUSPENSO` |
| não revela | integração | senha errada na conta suspensa igual à matrícula inexistente (status, corpo e contagem) |
| escolhas | integração | no login por e-mail e no seletor, a escola agendada não aparece; em B continua entrando |
| cancelar | integração | a mesma senha volta; depois do prazo ou enfileirado: `PEDIDO_EM_ESTADO_INVALIDO` |
| auditoria | integração | registrado, agendado, cancelado; sessões com o motivo |
| rotina | integração | `pessoa_desativada` com pedido agendado é pulada |
| isolamento | integração | `cancelar` de B como inexistente |
| concorrência | integração [P] | duas chaves: uma `agendado`, outra erro; dois `cancelar` |

## Como testar

- **suspensão:** `apps/api/test/ciclo-de-vida.int.test.ts › caminho feliz (RF5; regra 20, item 18)…` (a sessão aberta dá 401 na requisição seguinte); renovação em `apps/api/test/renovacao.int.test.ts`; conta externa em `apps/api/test/sessao-externa.int.test.ts › borda: a professora ligada e depois desativada não entra mais pela conta`.
- **não revela:** `apps/api/test/sessao-matricula.int.test.ts › privacidade (regra 20, item 6): slug inexistente…` (mesmo status, mesmo corpo, um hash cada).
- **escolhas:** `apps/api/test/troca-de-escola.int.test.ts › caminho feliz (RF14)…`; e-mail em `apps/api/test/login-email.int.test.ts › permissão: aluno não entra por e-mail e senha…`.
- **rotina:** `apps/worker/test/expurgo-da-escola.int.test.ts › a pessoa reativada entre a escolha do lote e a trava não é eliminada…` (`alunoDesativado`).
- **concorrência:** `GatilhoDeParada` e `esperarNaTrava`, como `apps/api/test/retencao.int.test.ts › concorrência: dois ajustes da mesma escola…`.
- Armadilha (`estado.md`): o teste de plano do expurgo depende de estatística (`1a405d2`). Mexeu no lote de `pessoa_desativada`, rode `› o lote de cada alvo desce pelo índice dele…`.
- Rodar: `npx vitest run --project integracao <arquivo>`.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A execução (15.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
