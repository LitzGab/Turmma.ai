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

- [x] 44.1 — Caracterização: o expurgo de hoje apaga `falhou` com 8 dias (já fixado pelo teste do HEAD; sem commit à parte, ver divergências)
- [x] 44.2 — O expurgo: `concluido` em 7 dias, `falhou` em 30, e `falhou` de `titular.*` nunca, no mesmo lote e pelo mesmo índice
- [x] 44.3 — `job.falhos{tipo}` no despachante, contado de `job_registro` como as medições de espera, com o teto
- [x] 44.4 — O alerta `infra/grafana/alertas/job-falhou-de-vez.yaml` e a entrada "Job que falhou de vez" em `docs/runbook.md`
- [x] 44.5 — `docs/lgpd.md`: a linha de `job_registro` (só ids, esses prazos, a cópia `failed` no Redis por 7 dias)
- [x] 44.6 — Testes: os da tabela

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
| Índice parcial novo `job_registro_falhos_idx (tipo) where estado = 'falhou'` (migration 0038, schema e `migrar.int.test.ts`), que não está em "Arquivos previstos" | A contagem por tipo, a cada 5 s, sem ele desce pelo `job_registro_finalizados_idx` atravessando os concluídos de 7 dias para achar os `falhou` (regra 80, itens 8 e 10). Aditivo, compatível com o código anterior (regra 80.9). Sem bloco em "Mutações" para o `WHERE` do índice: o `migrar.int.test.ts` lê o banco que o `globalSetup` já migrou, e trocar o `.sql` depois disso não muda o que ele vê; quem prova que o índice é parcial e que a medição o usa é o `EXPLAIN` do caso de carga (mutações 6 a 10) | `techspec.md` §3 (linha da 44.0), §7c ("Índices novos"); `onda-3b.md` "T5 — a falha final visível" |
| `DespachoRepository.medirFalhos`, `@SemEscopo` com a justificativa da `medirPendentes`; entra na lista fechada de `sem-escopo.decorator.test.ts`. A contagem salta de tipo em tipo e o teto de 10.000 vale por tipo (`TETO_DA_CONTAGEM_DE_FALHOS`) | "Como as medições de espera, com o teto": um teto sobre as linhas do `limit` cortaria os tipos do fim do alfabeto quando um tipo só acumula 10.000. É a mesma medição da fila, no repository do despachante (regra 10.9: nenhuma rotina nova fora dele) | `onda-3b.md` "T5 — a falha final visível" (parágrafo "Como ficou"); `techspec.md` §7c ("Métrica e alerta") |
| A falha da consulta dos falhos tira só `job.falhos` da exportação (`MedicaoDaFila.medirFalhos`, com o seu `catch`); a de pendentes continua esvaziando só a espera | O alerta "Job interativo esperando" não pode ficar cego porque a consulta nova estourou o `statement_timeout`. Regra nova no comportamento da medição, com o seu caso em `metricas-espera.test.ts` | `onda-3b.md` "T5 — a falha final visível" (parágrafo "Como ficou") |
| Painel "Jobs que falharam de vez, por tipo" em `infra/grafana/paineis/fundacao.json`; `NOMES_NO_PROMETHEUS.falhos` em `tools/testes/metricas.ts`; `METRICAS.falhos` em `metricas.ts` | `infra/test/painel.test.ts` reprova métrica exportada sem painel; `NOMES_NO_PROMETHEUS` é `satisfies Record<keyof METRICAS>` | `techspec.md` §7c ("Métrica e alerta"); `onda-3b.md` (parágrafo "Como ficou") |
| `tools/guardas/alerta-tem-runbook.test.ts` ganha o arquivo e o título do alerta novo (a tabela de testes diz "sem mudança") | O teste enumera todos os arquivos e títulos da pasta; sem a linha ele fica vermelho (lista fechada, `/executar-task` passo 4) | `onda-3b.md` (parágrafo "Como ficou") |
| O alerta dispara com `job_falhos > 0` e fica aceso enquanto houver linha do tipo (30 dias, ou até a ação do operador em `titular.*`); não há janela de "falha nova" | A série é a contagem de linhas, como a Tech Spec pede ("a série some com a linha expurgada"); `delta` sobre um gauge não vê a primeira falha de um tipo que ainda não tinha série. A 46.0 (X6) dá o comando que a esvazia | `onda-3b.md` (parágrafo "Como ficou"); `docs/runbook.md` "Job que falhou de vez" |
| A 44.1 não tem commit de caracterização à parte | O comportamento já tinha teste no HEAD: o `vencidosRestantes` de `expurgo.int.test.ts` contava `estado in ('concluido', 'falhou')` a 7 dias, e o `inserir('falhou', '8 days', '7 days 1 hour')` o fixava saindo; além disso, um caso de caracterização foi rodado verde no código de hoje antes da mudança e substituído pelos casos de 8 e 29 dias que ficam. A Tech Spec só pede caracterização para "comportamento sem teste" | `techspec.md` §1 ("Comportamento sem teste ganha caracterização num commit anterior"): o comportamento tinha teste, então a regra está cumprida sem o commit |
| `PRAZOS_FIXOS.tarefa_em_segundo_plano.prazo` em `packages/shared/src/privacidade/retencao.ts` (e o teste novo `packages/nucleo/src/retencao/prazo-declarado-de-jobs.test.ts`) | A tela de Retenção da coordenação dizia "7 dias" para `job_registro`; com a tarefa o `falhou` fica 30 dias e o de `titular.*`, até a ação do operador (regra 20, item 16; ordem da rodada 1, privacy-guardian) | `docs/lgpd.md` (linha de `job_registro`); `onda-3b.md` (parágrafo "Como ficou") |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts
teste: apps/worker/test/expurgo.int.test.ts › o concluído sai com 8 dias, e o falho fica até os 30: com 29 dias fica, com 31 sai
-   where (estado = 'concluido' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_DIAS}))
+   where (concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_DIAS}))
      or (estado = 'falhou' and tipo not like 'titular.%' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_FALHO_DIAS}))
```

```mutacao
arquivo: packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts
teste: apps/worker/test/expurgo.int.test.ts › o concluído sai com 8 dias, e o falho fica até os 30: com 29 dias fica, com 31 sai
- export const RETENCAO_JOB_REGISTRO_FALHO_DIAS = 30
+ export const RETENCAO_JOB_REGISTRO_FALHO_DIAS = 7
```

```mutacao
arquivo: packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts
teste: apps/worker/test/expurgo.int.test.ts › o falho de `titular.*` fica depois dos 30 dias, nos dois tipos; o concluído de `titular.*` sai em 8 dias; o falho de outro tipo sai
    where (estado = 'concluido' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_DIAS}))
-     or (estado = 'falhou' and tipo not like 'titular.%' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_FALHO_DIAS}))
+     or (estado = 'falhou' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_FALHO_DIAS}))
```

```mutacao
arquivo: packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts
teste: apps/worker/test/expurgo.int.test.ts › o falho de `titular.*` fica depois dos 30 dias, nos dois tipos; o concluído de `titular.*` sai em 8 dias; o falho de outro tipo sai
-   where (estado = 'concluido' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_DIAS}))
+   where (estado = 'concluido' and tipo not like 'titular.%' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_DIAS}))
      or (estado = 'falhou' and tipo not like 'titular.%' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_FALHO_DIAS}))
```

```mutacao
arquivo: packages/nucleo/src/retencao/expurgo-de-jobs.repository.ts
teste: apps/worker/test/expurgo.int.test.ts › o lote desce pelo índice parcial de finalizados, sem varrer a tabela
    where (estado = 'concluido' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_DIAS}))
-     or (estado = 'falhou' and tipo not like 'titular.%' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_FALHO_DIAS}))
+     or (tipo not like 'titular.%' and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_FALHO_DIAS}))
```

```mutacao
arquivo: packages/nucleo/src/fila/despacho.repository.ts
teste: apps/despachante/test/metricas-espera.int.test.ts › falhos: cinco falhas de um tipo, de duas escolas, sobem a série `job.falhos{tipo}`, que leva só o tipo: nem escola, nem dados, nem código
-         where job.estado = 'falhou' and job.tipo = tipos.tipo
+         where job.tipo = tipos.tipo
          limit ${TETO_DA_CONTAGEM_DE_FALHOS}
```

```mutacao
arquivo: packages/nucleo/src/fila/despacho.repository.ts
teste: apps/despachante/test/metricas-espera.int.test.ts › falhos: cinco falhas de um tipo, de duas escolas, sobem a série `job.falhos{tipo}`, que leva só o tipo: nem escola, nem dados, nem código
-         where job.estado = 'falhou' and job.tipo = tipos.tipo
+         where job.estado = 'falhou'
          limit ${TETO_DA_CONTAGEM_DE_FALHOS}
```

```mutacao
arquivo: packages/nucleo/src/fila/despacho.repository.ts
teste: apps/despachante/test/metricas-espera.int.test.ts › falhos: cinco falhas de um tipo, de duas escolas, sobem a série `job.falhos{tipo}`, que leva só o tipo: nem escola, nem dados, nem código
        (select tipo from job_registro where estado = 'falhou' order by tipo limit 1)
        union all
        select proximo.tipo
        from tipos cross join lateral (
          select job.tipo from job_registro as job
-         where job.estado = 'falhou' and job.tipo > tipos.tipo
+         where job.tipo > tipos.tipo
```

```mutacao
arquivo: packages/nucleo/src/fila/despacho.repository.ts
teste: apps/despachante/test/metricas-espera.int.test.ts › falhos: cinco falhas de um tipo, de duas escolas, sobem a série `job.falhos{tipo}`, que leva só o tipo: nem escola, nem dados, nem código
-       (select tipo from job_registro where estado = 'falhou' order by tipo limit 1)
+       (select tipo from job_registro order by tipo limit 1)
        union all
```

```mutacao
arquivo: packages/nucleo/src/fila/despacho.repository.ts
teste: apps/despachante/test/metricas-espera.int.test.ts › carga: com 5.000 falhos de um tipo e 100.000 concluídos, a medição desce pelo índice parcial e não varre a tabela, e a contagem de cada tipo para no teto
          where job.estado = 'falhou' and job.tipo = tipos.tipo
-         limit ${TETO_DA_CONTAGEM_DE_FALHOS}
        ) as limitados
```

```mutacao
arquivo: apps/despachante/src/metricas-espera.ts
teste: apps/despachante/src/metricas-espera.test.ts › falhos: um ponto por tipo, só com o rótulo `tipo`: nem escola, nem fila, nem código da falha
-       for (const { tipo, falhos: total } of this.#falhos) observador.observe(falhos, total, { tipo })
+       for (const { tipo, falhos: total } of this.#falhos) observador.observe(falhos, total, { tipo, fila: 'lote' })
```

```mutacao
arquivo: apps/despachante/src/metricas-espera.ts
teste: apps/despachante/src/metricas-espera.test.ts › falhos: a consulta dos falhos que falha tira só `job.falhos` da exportação, e a espera da fila segue medida
      this.#avisarFalha(erro)
-     this.#falhos = []
+     this.#falhos = this.#falhos
    }
```

```mutacao
arquivo: apps/despachante/src/metricas-espera.ts
teste: apps/despachante/src/metricas-espera.test.ts › borda: Postgres fora → a exportação fica sem espera, em vez de repetir a última parada no tempo
-   await this.medirFalhos()
    let medicoes: MedicaoDePendentes[]
```

```mutacao
arquivo: packages/nucleo/src/telemetria/metricas.ts
teste: packages/nucleo/src/telemetria/metricas.test.ts › lista fechada
  METRICAS.esperaMaisAntiga,
- METRICAS.pendentes,
+ METRICAS.pendentes,
+ METRICAS.falhos,
  METRICAS.aguardandoVaga,
```

```mutacao
arquivo: packages/shared/src/privacidade/retencao.ts
teste: packages/nucleo/src/retencao/prazo-declarado-de-jobs.test.ts › diz os dias que o expurgo cumpre: o concluído e o que falhou
- prazo: '7 dias; a que falhou, 30 dias; a do pedido de acesso ou de eliminação que falhou, até a equipe Turmma resolver' },
+ prazo: '7 dias; a que falhou, 7 dias; a do pedido de acesso ou de eliminação que falhou, até a equipe Turmma resolver' },
```

```mutacao
arquivo: packages/shared/src/privacidade/retencao.ts
teste: packages/nucleo/src/retencao/prazo-declarado-de-jobs.test.ts › diz que o pedido de acesso ou de eliminação que falhou fica até a equipe resolver, sem prazo de dias
- prazo: '7 dias; a que falhou, 30 dias; a do pedido de acesso ou de eliminação que falhou, até a equipe Turmma resolver' },
+ prazo: '7 dias; a que falhou, 30 dias' },
```

```mutacao
arquivo: apps/despachante/src/metricas-espera.ts
teste: apps/despachante/src/metricas-espera.test.ts › falhos: a consulta dos falhos que falha deixa o aviso `despachante.medicao_indisponivel` no log, porque o alerta volta a normal sem a série
    try {
      this.#falhos = await this.dependencias.repositorio.medirFalhos()
    } catch (erro) {
-     this.#avisarFalha(erro)
      this.#falhos = []
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª), revisor-geral (1ª) | O alerta `job_falhos > 0` fica aceso 30 dias depois de qualquer falha (e até a 46.0 em `titular.*`), e falha nova do mesmo tipo não avisa de novo; contador `job.falhou_total{tipo}` no worker e `increase(...) > 0`, ou rever o limiar quando o descarte existir | Muda o desenho do alerta; a Tech Spec pede a série como contagem de linhas. `TODO.md`, ligada à 46.0 (X6) |
| infra-guardian (1ª), revisor-geral (1ª), test-engineer (1ª) | Cada lote do expurgo relê e descarta no início do índice os `falhou` que ficam; medir o lote depois de uma pane em massa | Hoje são poucos; medição e caso de carga novos. `TODO.md` |
| test-engineer (1ª) | Nenhum teste liga a linha `falhou` do executor à medição e ao expurgo | Teste novo entre `apps/worker` e o expurgo, fora dos arquivos da tarefa. `TODO.md` |
| revisor-geral (1ª) | Extrair helper comum para capturar a instrução e rodar o `EXPLAIN` | Refatoração de teste. `TODO.md` |
| privacy-guardian (1ª) | Teto para o `falhou` de `titular.*` que siga o `pedido_titular` | `TODO.md` |
| privacy-guardian (1ª) | O descarte de linha `titular.*` da 46.0 precisa de auditoria com autor e finalidade | `TODO.md`, ligada à 46.0: ainda não existe `46_task.md` |
| llm-integrator (1ª) | Linha no runbook sobre a falha final de job de agente deixar a entrega `pendente` | Condicional a um tipo de job que a tarefa não define; a 46.0 reescreve a entrada do runbook. Recusada |
| llm-integrator (1ª) | Na 43.0, conferir a retenção do tipo de job de IA em lote | `TODO.md`, ligada à 43.0 |
| revisor-geral (2ª) | `prazo-declarado-de-jobs.test.ts` usa âncoras rígidas (`^` e `$`) no texto em português; qualquer ajuste de redação quebra o teste sem a regra ter mudado; bastaria `toContain` nos números e na menção ao pedido do titular | Recusada: as âncoras são o que torna a mutação "tirar a cláusula de `titular.*`" vermelha (o teste da cláusula termina em `$`); a redação muda junto com o texto na 46.0, que já altera `PRAZOS_FIXOS` |
| test-engineer (2ª) | As constantes entram na regex sem escapar | Recusada: `RETENCAO_JOB_REGISTRO_DIAS` e `RETENCAO_JOB_REGISTRO_FALHO_DIAS` são números; se virarem texto, o tipo muda e o `typecheck` aponta |
| test-engineer (2ª) | A entrada 5 do runbook ("Job que falhou de vez") é texto e fica sem teste; a guarda `alerta-tem-runbook` só confere o título | Recusada: a guarda existe para exigir a entrada do alerta, e o conteúdo dos passos é texto de operação, revisto pelo `infra-guardian` |
| privacy-guardian (2ª) | O texto da tela não cita a cópia `failed` que o BullMQ guarda no Redis por 7 dias (`docs/lgpd.md` a cita); alinhar quando a 46.0 mexer no texto | Tarefa futura 46.0 (X6), que reescreve `PRAZOS_FIXOS.tarefa_em_segundo_plano` junto com o descarte; a cópia fica dentro dos 30 dias do registro, então a tela não diz menos do que o sistema guarda |
| privacy-guardian (2ª) | Quando a 46.0 fizer o teto de `titular.*` e a auditoria do descarte, o texto de `PRAZOS_FIXOS` e o segundo caso do teste precisam mudar junto | `TODO.md`: as duas linhas (teto do `titular.*` e auditoria do descarte) já estão escritas, da 1ª rodada |
| infra-guardian (2ª) | O alerta aceso por 30 dias esconde falha nova do mesmo tipo; o comando que esvazia a série precisa chegar antes do piloto | `TODO.md`: linha já escrita, da 1ª rodada, ligada à 46.0 (X6) |
| infra-guardian (2ª) | Medir o lote do expurgo depois de uma pane em massa | `TODO.md`: linha já escrita, da 1ª rodada |
| llm-integrator (2ª) | Na 43.0, a retenção do tipo de job de IA em lote coerente com limite de passos e custo, e o registro guardando entrada, saída, modelo, tokens, custo e duração | `TODO.md`: linha da 43.0 já escrita, da 1ª rodada |
| llm-integrator (2ª) | Manter o aviso `despachante.medicao_indisponivel` só com o erro resumido (`resumirErro`) | Nada a fazer: é observação sobre o que já está certo |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 16:51:25 | 2026-10-22 16:51:42 | `llm-integrator` | 1 | APROVADO | a83129b96349b1740 |
| 2026-10-22 16:51:19 | 2026-10-22 16:52:40 | `infra-guardian` | 1 | APROVADO | a647cfe0f1ce10b6d |
| 2026-10-22 16:51:31 | 2026-10-22 16:52:46 | `revisor-geral` | 1 | APROVADO | a9e45aaa473437ee5 |
| 2026-10-22 16:51:22 | 2026-10-22 16:52:58 | `privacy-guardian` | 1 | REPROVADO | ab48b9704b3bbe27a |
| 2026-10-22 16:51:28 | 2026-10-22 16:53:48 | `test-engineer` | 1 | APROVADO | a61d83f7122da3527 |
| 2026-10-22 17:02:58 | 2026-10-22 17:03:28 | `privacy-guardian` | 2 | APROVADO | a7f64be3d1a5e20d8 |
| 2026-10-22 17:03:04 | 2026-10-22 17:03:29 | `infra-guardian` | 2 | APROVADO | a5926ff4e5f4464f9 |
| 2026-10-22 17:03:11 | 2026-10-22 17:03:31 | `llm-integrator` | 2 | APROVADO | ae7b644f683349c10 |
| 2026-10-22 17:03:24 | 2026-10-22 17:03:58 | `revisor-geral` | 2 | APROVADO | a87278635cc03c394 |
| 2026-10-22 17:03:18 | 2026-10-22 17:04:16 | `test-engineer` | 2 | APROVADO | a5d9146a2367908a5 |
