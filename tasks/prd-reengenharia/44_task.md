# Tarefa 44.0 — Falha final alerta e fica 30 dias; o pedido do titular, até a ação

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O job que falhou de vez vira medição e alerta com runbook, e fica 30 dias em `job_registro` (o concluído segue em 7); o
de `titular.*` fica até a ação do operador (RF18, a parte da X5).

## Contexto necessário

- `onda-3b.md` "T5 — a falha final visível (44.0)" e o §3 ("Falha final", "Pedido do titular"); `prd.md` RF18 e §11
  (reprocessar e descartar por comando são da 46.0, na X6); regras 80.10 (alerta com parágrafo do runbook), 20.9 e 20.16
- `packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts` (`RETENCAO_JOB_REGISTRO_DIAS = 7`, `APAGAR_LOTE_VENCIDO`)
- `apps/worker/src/executor.ts:145` e `:297` (a última tentativa marca `falhou`, com código tipado)
- `apps/despachante/src/metricas-espera.ts` (as medições que o despachante já exporta de `job_registro`, com teto)
- `apps/api/src/privacidade/privacidade.service.ts:238` (o `titular.montar-arquivo` enfileirado uma vez)

## Subtarefas

- [ ] 44.1 — Caracterização, num commit antes: o expurgo de hoje apaga `falhou` com 8 dias
- [ ] 44.2 — O expurgo: `concluido` em 7 dias, `falhou` em 30, e `falhou` de `titular.*` nunca, no mesmo lote e pelo mesmo índice
- [ ] 44.3 — `job.falhos{tipo}` no despachante, contado de `job_registro` como as medições de espera, com o teto
- [ ] 44.4 — O alerta `infra/grafana/alertas/job-falhou-de-vez.yaml` e a entrada "Job que falhou de vez" em `docs/runbook.md`
- [ ] 44.5 — `docs/lgpd.md`: a linha de `job_registro` (só ids, esses prazos, a cópia `failed` no Redis por 7 dias)
- [ ] 44.6 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts` | alterado |
| `apps/worker/test/expurgo.int.test.ts` | alterado |
| `apps/despachante/src/metricas-espera.ts`, `metricas-espera.test.ts` | alterado |
| `apps/despachante/test/metricas-espera.int.test.ts` | alterado |
| `infra/grafana/alertas/job-falhou-de-vez.yaml` | novo |
| `docs/runbook.md`, `docs/lgpd.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| `falhou` há 29 dias fica; há 31, sai; `concluido` há 8, sai | integração | os 7 dias valerem para `falhou` |
| `falhou` de `titular.montar-arquivo` e de `titular.eliminar` há 31 dias fica | integração | tirar a exceção de `titular.*` |
| `concluido` de `titular.*` há 8 dias sai | integração | a exceção valer para todo estado |
| O lote continua de 5.000 e desce pelo índice parcial de finalizados | integração | o predicado novo fugir do índice |
| Cinco falhas de um tipo: a série `job.falhos{tipo}` sobe, sem `escola_id` nem `dados` | integração | atributo a mais |
| A série some com a linha expurgada | integração | contar do histórico |
| O alerta tem entrada completa no runbook | unidade | `alerta-tem-runbook.test.ts`, sem mudança |
| Com 5.000 `falhou`, a medição não varre a tabela e para no teto | integração | contar sem `limit` |

## Como testar

- O expurgo: copie `apps/worker/test/expurgo.int.test.ts › 12.000 vencidos saem em lotes de 5.000, e nenhum job ativo,
  pendente ou recente é tocado`, com as datas de 8, 29 e 31 dias, e `› o lote desce pelo índice parcial de finalizados`.
- A medição: `apps/despachante/test/metricas-espera.int.test.ts › caminho feliz: as filas da escola A e da B saem em
  séries separadas…` e `› carga: com 5.000 lotes da A à espera, a medição não varre a tabela…`; o medidor de teste do
  `metricas-espera.test.ts`.
- O alerta: o molde é `infra/grafana/alertas/job-interativo-esperando.yaml`; `tools/guardas/alerta-tem-runbook.test.ts`
  já lê todo arquivo da pasta e exige a entrada com o nome da regra.
- A falha final: `apps/worker/test/execucao.int.test.ts › falha permanente: 5 tentativas com recuo e depois falhou…`
  monta a linha `falhou` que o expurgo e a medição leem.
- Isolado: `npx vitest run --project integracao apps/worker/test/expurgo.int.test.ts apps/despachante/test/metricas-espera.int.test.ts`.
- Armadilha: o expurgo é `@SemEscopo` (rotina nossa); a exceção de `titular.*` vai no SQL do lote, não num filtro depois.

## Fora do escopo desta tarefa

Listar, reprocessar e descartar por comando (46.0, X6); o prazo por tipo (43.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

