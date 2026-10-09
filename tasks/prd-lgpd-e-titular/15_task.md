# Tarefa 15.0 — No 8º dia a eliminação acontece, com o nome trocado nos textos livres

**Funcionalidade:** lgpd-e-titular · **Depende de:** 4.0, 5.0, 12.0, 13.0, 14.0 · **Paralelo com:** 16.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A rotina enfileira a eliminação vencida, o `titular.eliminar` troca o nome completo em faixas, refaz a foto, anonimiza, elimina e conclui, com autor `rotina` restrito por check.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (check do autor), 5 ("Eliminação", etapas 1 a 3) e 13 (limite do nome anterior)
- Regra 70 itens 3 e 6; regra 80 item 7
- Código: `CicloDeVidaService` (1.0), `Compartilhamento` (12.0), `packages/nucleo/src/db/schema/auditoria.ts`, `executor.ts` (`falharInterrompidas`)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 15.1 — Migration própria: check do autor `rotina` (NOT VALID, VALIDATE); apelido reservado; índices `(escola_id, id)` parciais de texto
- [ ] 15.2 — Enfileiramento pela rotina (`eliminacao_enfileirada_em`, 20 h)
- [ ] 15.3 — `TrocaDeNome`: faixas de 1.000 examinadas, janela entre faixas, escapes, `titular.nome_trocado` no `returning`
- [ ] 15.4 — Etapa 3 com `for update`, foto, anonimização, `eliminar` na transação, `apagado_em`, autor
- [ ] 15.5 — Alerta `agendado` > 48 h e runbook
- [ ] 15.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration, `auditoria.ts`, operador | alterado |
| `packages/nucleo/src/titular/troca-de-nome.ts` | novo |
| `apps/worker/src/processadores/eliminar-titular.ts` | novo |
| `expurgo-da-escola.repository.ts` | alterado |
| regra de alerta e runbook | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| prazo | integração | cancelado no 6º nada sai; no 8º tudo sai; antes de `eliminar_em` não faz nada |
| troca | integração | sentinela por coluna some; primeiro nome fica; caixa; apóstrofo, acento e regex com JSON válido; "Ana Souza" em "Mariana Souza" fica; 1.001 linhas em duas faixas |
| homônimo e professor | integração | sem troca e `homonimo`; professor sem troca |
| janela e falha | integração | janela entre faixas não conclui e a seguinte termina; falha no `eliminar` desfaz a etapa 3 |
| foto | integração | aluno com provedor sem cadastro: `origem` ≠ `periodo`; concluída ainda devolve o provedor |
| o que fica | integração | mapa guardado com o id; `apagado_em` marcado; "Titular eliminado"; só `nomeTrocado` |
| autor | integração | coordenadora ativa ou `rotina`; check aceita só a lista; apelido `rotina` recusado |
| linha antiga | integração | `consumo_ia` sem `provedor` passa pelo expurgo e pela troca |
| isolamento e log | integração | troca em A não toca B; log e respostas sem nome atual, anterior, termo nem URL |
| concorrência | integração [P] | dois `eliminar`; cancelar contra enfileirar; `pessoa_desativada` com eliminação |
| reenfileirar e alerta | integração e infra [F] | 20 h sim, menos não; 47 h não alerta, 48 h alerta |

## Como testar

- Molde: `apps/worker/test/expurgo-da-escola.int.test.ts` (`escolaNova`, `relogioEm`, `rodar`, `rodarRotina`). **janela:** `› a janela abre no meio…`; **faixas:** `› 5.001 linhas vencidas saem em dois lotes…`; **autor:** `› o desativado além do prazo é eliminado pelo ciclo de vida…`; **concorrência:** `› [P] dois jobs da mesma escola ao mesmo tempo eliminam cada pessoa uma vez…`.
- **check:** `packages/nucleo/src/auditoria/auditoria.int.test.ts › registro sem autor nenhum é recusado…`.
- **falha desfaz:** `apps/api/test/ciclo-de-vida.int.test.ts › na transação de quem chama…`.
- **alerta:** `infra/test/alerta-do-expurgo.int.test.ts`.
- Troca de nome: sem precedente.
- Rodar: `npx vitest run --project integracao <arquivo>`; `--project infra` no alerta.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As telas (16.0, 17.0).

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
