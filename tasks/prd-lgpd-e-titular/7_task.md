# Tarefa 7.0 — Cada chamada externa de IA registra o provedor que a atendeu

**Funcionalidade:** lgpd-e-titular · **Depende de:** nenhuma · **Paralelo com:** 1.0 a 6.0, 8.0 a 10.0
**Subagentes obrigatórios:** `llm-integrator`, `infra-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O consumo de IA passa a gravar `provedor` quando há envio externo, com o tipo da porta unindo `envioExterno` e `provedorId`, sem nunca falhar o registro por causa dele.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 3 ("`consumo_ia.provedor`" e a contração fora do F3)
- `.claude/rules/30-ia.md`
- Código: `packages/nucleo/src/config/config-ia.ts`, `ia/provedor.ts`, `ia/adaptador.ts`, `ia/adaptador-openai-compat.ts`, `ia/__fixtures__/adaptador-roteirizado.ts`, `apps/api/src/ia/consumo.repository.ts`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 7.1 — `IA_PROVEDOR_ID` no `esquemaAmbienteDeIa`, obrigatória com `openai_compat` sem processamento local
- [ ] 7.2 — Tipo da porta `{ envioExterno: true; provedorId } | { envioExterno: false; provedorId: null }`; o fixture ganha id
- [ ] 7.3 — Migration própria: `consumo_ia.provedor` com `check (provedor is null or envio_externo)`; sobe junto com o código
- [ ] 7.4 — `MedicaoDaGeracao`, `ConsumoDeIa` e `ConsumoRepository` levam o valor
- [ ] 7.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `config-ia.ts`, `provedor.ts`, `adaptador*.ts`, fixture | alterado |
| migration e `consumo-ia.ts` | alterado |
| `consumo.repository.ts` | alterado |
| `.env.example` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| configuração | unidade | subida recusada sem a variável e com formato inválido |
| provedor resolvido | unidade | nulo no falso, local, `regra_fixa` e zero tentativas; o id no externo com servidor falso |
| tipo | unidade | `@ts-expect-error` nos dois pares inválidos |
| banco | integração | `provedor` sem envio externo recusado; formato antigo aceito |
| gravação | integração | grava o `provedor`; a soma da governança não muda; nunca falha pela coluna |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A contração que exige `provedor` (release posterior ao F3, `TODO.md`).

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
