# Tarefa 9.0 — A operação registra incidente e a escola afetada confirma o recebimento

**Funcionalidade:** lgpd-e-titular · **Depende de:** 2.0 · **Paralelo com:** 3.0 a 8.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Incidente registrado por comando, com números e textos por escola, lido e confirmado só pela escola afetada, guardado 5 anos e com alerta de 24 h sem confirmação.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (`incidente`, `incidente_escola`), 4 (`GET incidentes`), 5 ("Incidente") e 6
- `docs/lgpd.md` seção 8
- Código: `expurgo-de-acesso.repository.ts` (alvos e justificativa)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 9.1 — Migration própria: `incidente`, `incidente_escola`, índice de pendentes
- [ ] 9.2 — `ops:incidente registrar` (seção por escola; recusa nome ou id de outra escola, com caixa e acento)
- [ ] 9.3 — `IncidenteDaEscolaRepository`, `GET incidentes` e `POST incidentes/:id/confirmar`, auditoria `incidente.confirmado`
- [ ] 9.4 — Alvo `incidente` no `sistema.expurgar-acesso`, justificativa reescrita
- [ ] 9.5 — Alerta de 24 h e runbook; `docs/lgpd.md` (linhas do incidente)
- [ ] 9.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e schemas | novo |
| `apps/api/src/ops/incidente.ts` | novo |
| `packages/nucleo/src/titular/incidente-da-escola.repository.ts` | novo |
| rotas em `privacidade` | alterado |
| `expurgo-de-acesso.repository.ts` | alterado |
| regra de alerta, `docs/runbook.md`, `docs/lgpd.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| registro | integração | sem dado de titular; números e categorias por escola; texto citando outra escola recusado |
| isolamento | integração | A não recebe contagem nem texto de B; confirmar em A não confirma B; incidente só de B dá `NAO_ENCONTRADO` |
| confirmação | integração | grava `confirmado_por` |
| concorrência | integração [P] | duas confirmações mantêm a primeira |
| expurgo | integração | 5 anos e um dia sai, com as ligações |
| alerta | infra [F] | 23 h não dispara, 25 h dispara |
| arquitetura | unidade | parte `incidente` |

## Como testar

- **registro, isolamento, confirmação:** molde de `apps/api/test/retencao.int.test.ts` (`rodar`, `bancada.escolaComSessao('coordenador')`, `chamar`). Igual a inexistente: `apps/api/src/ia/ia.int.test.ts › de outra pessoa, de outra escola, inexistente…`. Ponha o comando em `apps/api/test/ops-operador.int.test.ts › C2`: a 2.0 reprovou por faltar.
- **concorrência:** `retencao.int.test.ts › concorrência: dois ajustes da mesma escola…`, com `GatilhoDeParada` no `update` de `incidente_escola` e `esperarNaTrava`.
- **expurgo:** `apps/worker/test/expurgo-de-acesso.int.test.ts › borda: nos limites de cada prazo…`. O alvo novo quebra `› alvo sem total` e `› log: cada contagem…`: atualize os dois.
- **alerta:** `infra/test/alerta-do-expurgo.int.test.ts › duas noites parciais disparam…` (linha gravada antes do `composeAssincronoOuFalha`; `alertaCom`, `expect.poll`); a regra entra em `REGRAS_PROVISIONADAS` (`infra/scripts/ensaio-alertas.ts`).
- **arquitetura:** `apps/api/test/arquitetura.test.ts › o expurgo toca da operação só o acesso, a sessão e o convite`.
- Comando que lê arquivo: sem precedente; o mais próximo é `ops-operador.int.test.ts › C8`.
- Rodar: `npx vitest run --project integracao <arquivo>`; `--project infra` no alerta.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As telas (10.0).

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
