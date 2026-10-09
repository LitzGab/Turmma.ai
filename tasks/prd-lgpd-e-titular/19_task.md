# Tarefa 19.0 — A carga prova que o expurgo não atrapalha a aula, e os documentos fecham o F3

**Funcionalidade:** lgpd-e-titular · **Depende de:** 3.0 a 18.0 · **Paralelo com:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `tenancy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O cenário de carga mostra o expurgo e a troca de nome de uma escola sem degradar o Tutor de outra, `ops:privacidade` mostra só contagens, e os documentos ficam fiéis ao código.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 7c e 11
- `docs/infra.md` seção 10
- Código: `infra/k6/justica-entre-escolas.js`, `apps/api/src/ops/uso.ts`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 19.1 — Cenário de carga com o adaptador falso de latência simulada; p95 do Tutor de B com e sem o lote de A; statements medidos no Postgres
- [ ] 19.2 — `ops:privacidade` (contagens por escola) com sentinelas
- [ ] 19.3 — `docs/lgpd.md`, `modelo-de-dados.md`, `arquitetura.md`, `runbook.md` conferidos
- [ ] 19.4 — Pendências para o `TODO.md`: a contração de `provedor` (release posterior), recomendações abertas
- [ ] 19.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `infra/k6/*` | alterado |
| `apps/api/src/ops/privacidade.ts` | novo |
| documentos | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| carga | carga | cada statement < 2 s; o p95 do Tutor de B não piora além do limite do cenário |
| operação | integração | as saídas de `ops:privacidade` não trazem nenhuma sentinela |

## Como testar

- **operação:** `apps/api/test/painel-leitura.int.test.ts › com sentinelas em cada tabela de pessoa…`; a montagem da escola e do comando em `apps/api/test/ops-uso.int.test.ts › isolamento: a escola B com uso no mesmo dia não aparece…` (`BancadaDeSessoes`). Ponha o comando na lista de `apps/api/test/ops-operador.int.test.ts › C2`: a 2.0 reprovou por faltar.
- **carga:** `infra/test/carga.test.ts › a espera da B acima da base + margem reprova o cenário…` e `infra/test/conferir-carga.int.test.ts › só olha as escolas do cenário…`. O cenário roda por `npm run carga`, fora do Vitest, com o adaptador falso.
- **statement < 2 s:** `apps/worker/test/expurgo-da-escola.int.test.ts › o lote de trabalho com a cascata…`.
- Armadilha (`estado.md`): plano do Postgres depende de estatística; sem volume e `analyze` na tabela, o teste fica intermitente (`1a405d2`).
- Rodar: `npx vitest run --project integracao <arquivo>`; `--project unidade infra/test/carga.test.ts`; `--project infra` no `conferir-carga`.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Nada novo de produto.

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
