# Tarefa 3.0 — A rotina noturna expurga a conversa e os sinais em cada escola

**Funcionalidade:** lgpd-e-titular · **Depende de:** 2.0 · **Paralelo com:** 7.0 a 10.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Toda noite um job por escola apaga a conversa do Tutor, os sinais e a conversa do professor vencidos, para no lote em que a janela letiva abre, grava `expurgo_execucao` e alerta quando a escola passa duas noites sem concluir.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (`expurgo_execucao`, `job_registro`), 5 ("Expurgo"), 6 e 7c
- `docs/infra.md` 5.2 e 5.3
- `.claude/rules/80-infra-e-carga.md` itens 2, 3, 8 e 10
- Código: `apps/worker/src/agendamentos.ts`, `processadores/expurgar-acesso.ts`, `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`, `fila/enfileirador.ts`, `fila/janela-letiva.ts`, `db/schema/job-registro.ts`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 3.1 — Migration própria: `job_registro.chave_idempotencia` (único parcial e check com escola), `expurgo_execucao`, índices `(escola_id, <data>)` de `mensagem_tutor`, `sinal_tutor`, `mensagem_agente`
- [ ] 3.2 — `Enfileirador` com `chaveIdempotencia` (`on conflict` com o predicado; devolve id ou nulo)
- [ ] 3.3 — `EscolasDaRotinaRepository` (`@SemEscopo`, só ids) em `packages/nucleo/src/rotina`
- [ ] 3.4 — `sistema.expurgar-dado-pessoal` (1h) e `retencao.expurgar-escola` (lote, não urgente, chave "escola + data local")
- [ ] 3.5 — `ExpurgoDaEscolaRepository`: lotes de 5.000, janela a cada lote, começo pela categoria pendente, linha por categoria mesmo com zero; categorias `conversa_tutor`, `sinal_tutor`, `conversa_professor`
- [ ] 3.6 — Métrica e alerta de duas noites, parágrafo no `docs/runbook.md`; `docs/modelo-de-dados.md` (exceção da rotina)
- [ ] 3.7 — Testes, parametrizados por catálogo com a lista "pendente da tarefa N"

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration, schema `expurgo_execucao`, `job-registro.ts` | novo/alterado |
| `packages/nucleo/src/fila/enfileirador.ts` | alterado |
| `packages/nucleo/src/rotina/*` | novo |
| `packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` | novo |
| `apps/worker/src/processadores/expurgar-dado-pessoal.ts`, `expurgar-escola.ts`, `agendamentos.ts`, `montagem.ts` | novo/alterado |
| regra de alerta, `docs/runbook.md`, `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| prazo por categoria | integração | um dia antes fica, um dia depois sai; reexecutar não apaga mais |
| ajuste: encurtar em A, aumentar depois | integração | sai a linha de A e fica a de B; nada volta |
| janela abre no meio | integração | `concluida=false` na interrompida, `true` nas outras; a noite seguinte começa pela pendente e grava `true` |
| 5.001 linhas; categoria vazia | integração | dois lotes; linha gravada com zero |
| thread com mensagem no prazo | integração | não sai |
| chave sem escola; 23h59 e 0h01 locais | integração | recusada; chaves diferentes |
| concorrência | integração [P] | mesma chave dá o mesmo id; dois jobs da mesma escola somam certo; a rotina duas vezes cria um job por escola; colisão com job terminado é "já enfileirado" |
| alerta | infra [F] | duas noites parciais alertam, parcial + completa não; categoria sem linha conta como não concluída |
| log novo | integração | só ids e contagens; o job vai para a fila de lote |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As categorias de anonimização (4.0) e de cadastro (5.0); arquivos do titular e eliminações (13.0, 15.0).

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
