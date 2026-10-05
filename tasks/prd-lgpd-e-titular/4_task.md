# Tarefa 4.0 — O expurgo anonimiza execução, texto do modelo, consumo por aluno e autoria

**Funcionalidade:** lgpd-e-titular · **Depende de:** 3.0 · **Paralelo com:** 5.0, 7.0 a 10.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`, `llm-integrator`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

As quatro categorias que mantêm a linha e anulam a pessoa passam a ser expurgadas, com o prazo efetivo das travas e sem quebrar os checks da `execucao_agente` nem a soma da governança.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (catálogo, travas, `execucao_agente`) e 7c (índices)
- `.claude/rules/70-conformidade-cne.md` itens 3 e 6
- Código: `packages/nucleo/src/db/schema/execucao-agente.ts`, `consumo-ia.ts`, `artefato.ts`; `apps/api/src/governanca/governanca.repository.ts` (soma)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 4.1 — Migration própria: `execucao_agente.anonimizada_em`; índices parciais de anonimização (seção 7c), dois em `consumo_ia`
- [ ] 4.2 — Categorias `execucao_agente` (`entrada = {tarefa}`, `solicitada_por` nulo), `texto_do_modelo`, `consumo_por_aluno`, `autoria_de_artefato` (ano encerrado)
- [ ] 4.3 — `EXPLAIN` de cada lote, anexado à tarefa
- [ ] 4.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e `execucao-agente.ts` | alterado |
| `expurgo-da-escola.repository.ts` | alterado |
| testes do expurgo | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| travas | integração | com `conversa_professor` em 3 meses, o tema sai em 3; com `conversa_tutor` em 6, o `aluno_id` de 7 meses é anulado |
| checks | integração | execução `pendente`, `concluida` e `falhou` anonimizadas passam nos checks da 0022 e 0023 |
| o que fica | integração | a linha e as oito FKs continuam; a soma da governança não muda |
| autoria com ano em curso | integração | não é anulada |
| reexecução | integração | não mexe na linha com `anonimizada_em` |
| consumo do Tutor | integração | continua cumprindo `consumo_ia_sem_conversa_de_pessoa` |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Troca de nome e eliminação (15.0); `consumo_ia.provedor` (7.0).

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
