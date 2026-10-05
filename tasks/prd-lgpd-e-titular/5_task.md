# Tarefa 5.0 — O expurgo alcança trabalho do aluno, reivindicação, material, vínculo e pessoa desativada

**Funcionalidade:** lgpd-e-titular · **Depende de:** 3.0 · **Paralelo com:** 4.0, 7.0 a 10.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

As categorias contadas do ano encerrado ou do fim do vínculo passam a ser expurgadas, e a pessoa desativada além do prazo é eliminada pelo ciclo de vida, com autor `rotina`.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (catálogo, prazos fixos) e 5
- `docs/lgpd.md` linhas de resposta, diagnóstico, reivindicação, material, vínculo
- Código: `packages/nucleo/src/ciclo-de-vida/*` (1.0), `apps/api/src/estrutura/ano-letivo.repository.ts` (encerramento)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 5.1 — Migration própria: índices `reivindicacao` (decididas), `material` (excluídos), `usuario (escola_id, desativado_em)`, `vinculo` (encerrados), `tentativa_atividade (escola_id, aluno_id)` se faltar
- [ ] 5.2 — Categorias `trabalho_do_aluno` (só `situacao = encerrado`), `reivindicacao_decidida` (inclui `decidida_como = coordenacao`), `material_excluido`, `vinculo_encerrado`
- [ ] 5.3 — `pessoa_desativada`: `CicloDeVidaService.eliminar` na transação do lote, autor `rotina` (a pulada por pedido agendado entra na 14.0)
- [ ] 5.4 — Prazo fixo de `expurgo_execucao` (5 anos)
- [ ] 5.5 — Testes; a lista "pendente da tarefa N" do 3.7 fica vazia

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration | novo |
| `expurgo-da-escola.repository.ts` | alterado |
| testes do expurgo | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| ano letivo | integração | `fim` vencido mas `em_curso` não perde nada; `encerrado` perde |
| pessoa desativada | integração | eliminada além do prazo; ativa em outra escola, a conta continua; autor `rotina` |
| o que fica | integração | vínculo ativo e material vigente ficam |
| aluno transferido | integração | o trabalho dele em A sai pelo ano de A |
| `expurgo_execucao` | integração | com 5 anos e um dia sai |
| catálogo coberto | unidade | a lista de categorias pendentes de tarefa está vazia |
| tempo do lote | integração | `trabalho_do_aluno` com cascata medido contra 2 s |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O "pula agendado" (14.0); o check do autor `rotina` (15.0).

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
