# Tarefa 43.0 — Job estourado dá `TEMPO_ESGOTADO`

**Funcionalidade:** reengenharia · **Depende de:** 19.0
**Subagentes obrigatórios:** `infra-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

O executor do worker corta cada tentativa no `prazoMs` da definição do tipo: aborta o `sinal`, falha com `TEMPO_ESGOTADO` e
libera a vaga. No SIGTERM, passada a graça de 20 s, o job sem tentativa para repetir termina `EXECUCAO_INTERROMPIDA` (RF17).

## Contexto necessário

- `onda-3b.md` "RF17 — prazo por tipo (43.0)" e §3; `techspec.md` §7c; `prd.md` RF17 (§11); R39 em `.reengenharia/DECISOES.md`
- Regras 80 (itens 3 e 10) e 20 (item 9); D49
- `apps/worker/src/executor.ts` (`executar`, `falhar`), `montagem.ts` (`GRACA_DO_DESLIGAMENTO_MS`, `encerrar`),
  `processadores/sintetico.ts` (`SandboxDeCpu.queimar`), `packages/shared/src/sistema/jobs.ts` (`CodigoDeFalhaDeJob`)
- Constrói sobre a 18.0 e a 19.0 (ainda não feitas): `DEFINICOES_DE_JOB` com `prazoMs`, `Processador<T>`,
  `ExecucaoDoJob.prazoMs` e a definição injetável em `fila-de-teste.ts`. Confira os nomes

**Decidido pelo Arquiteto (R55, `onda-3b.md` revisto):**
1. O prazo dos `ia.*` (`executor: 'api'`) é da 47.0 (X6): o worker não os recebe e `nucleo/src/ia/` não muda.
2. `TEMPO_ESGOTADO` segue a `retentativa` do tipo e libera a vaga em toda tentativa estourada.
3. Graça de 20 s (hoje 30 s); `stop_grace_period` dos workers de 35 s para 25 s.
4. No SIGTERM, só a última tentativa (`attempts` esgotadas) termina `EXECUCAO_INTERROMPIDA`. Com tentativa sobrando, o job
   fica `ativo` e outra réplica o retoma (D49): marcar todos perderia `titular.*` em cada deploy e quebraria
   `execucao.int.test.ts › SIGTERM com job que passa da graça`.

## Subtarefas

- [x] 43.1 — Caracterização, num commit antes: SIGTERM além da graça, com `attempts: 5`, deixa a linha `ativo` e a vaga no Redis
- [x] 43.2 — `shared`: os dois códigos em `CodigoDeFalhaDeJob`; confere o `prazoMs` dos 8 tipos
- [x] 43.3 — Executor: `Processador` recebe `sinal`; corte pelo `prazoMs`, `abort()`, vaga liberada, rejeição tardia engolida; log `job.tempo_esgotado` só com ids e `prazoMs`
- [x] 43.4 — `SandboxDeCpu.queimar(cpuMs, sinal)` termina a thread no aborto
- [x] 43.5 — `ExecutorDeJobs.interromper()`: aborta o que roda e, na última tentativa, `registrarFalha(EXECUCAO_INTERROMPIDA)` no contexto da escola do job e libera a vaga; `encerrar` o chama ao estourar a graça
- [x] 43.6 — Graça de 20 s, `stop_grace_period` e o parágrafo dos dois códigos em `docs/runbook.md`
- [x] 43.7 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/sistema/jobs.ts`, `definicoes-de-job.ts` | alterado |
| `apps/worker/src/executor.ts`, `executor.test.ts`, `montagem.ts` | alterado |
| `apps/worker/src/desligamento.test.ts` | novo |
| `apps/worker/src/processadores/sintetico.ts`, `sintetico.test.ts` | alterado |
| `apps/worker/test/fila-de-teste.ts`, `execucao.int.test.ts` | alterado |
| `apps/worker/test/prazo-do-job.int.test.ts` | novo |
| `infra/compose.yml`, `docs/runbook.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação) |
|---|---|---|
| Processador pendente, `prazoMs` 5 000, relógio falso a 5 000: `registrarFalha(TEMPO_ESGOTADO)`, vaga liberada, `sinal.aborted` | unidade | `prazoMs` fixo, ou tirar o `abort()` |
| A 4 999 nada falha, e o que resolve a 4 999 conclui | unidade | cortar em `prazoMs - 1` |
| Estouro com tentativa sobrando: erro com o código, não definitivo, vaga liberada | unidade | `FalhaDeJob(…, true)` |
| Processador que rejeita depois do corte: sem rejeição não tratada, linha intacta | unidade | tirar o `.catch` |
| Sintético com `sinal` abortado termina a thread e rejeita | unidade | ignorar o `sinal` |
| Job real, `attempts: 1`, `prazoMs: 300` injetado: `falhou`/`TEMPO_ESGOTADO`, vaga fora de `bancada.vagas.membros`, log só com ids e código | integração | não liberar a vaga |
| Escola com limite 1: o segundo job roda logo depois do estouro | integração | liberar a vaga só no fim |
| SIGTERM com `attempts: 1` além da graça: `falhou`/`EXECUCAO_INTERROMPIDA`, vaga livre, o sobrevivente não o executa | integração | `encerrar` sem `interromper()` |
| SIGTERM com `attempts: 5`: continua `ativo` | integração | marcar `falhou` sempre |
| Escolas A e B interrompidas juntas: cada falha grava só a linha da própria escola | integração | um contexto só |
| Graça de 20 000 e `stop_grace_period` do worker maior que ela | unidade | voltar a 30 000 |

## Como testar

- Corte e vaga: `apps/worker/src/executor.test.ts › ExecutorDeJobs e a vaga › falha definitiva com renovação em andamento: …`
  e `› falha que ainda vai ser tentada de novo: …`; `montar({ processador, tentativas })` ganha o `prazoMs`, com
  `vi.advanceTimersByTimeAsync` (o `beforeEach` já liga o relógio falso).
- Thread: `sintetico.test.ts › SandboxDeCpu: … › encerrar falha o que está em andamento e na fila, …`.
- SIGTERM: `apps/worker/test/execucao.int.test.ts › dependência fora e desligamento › SIGTERM com job que passa da graça: …`
  (`publicado(tentativas)` local, `aguardarEstado`, `bancada.worker(log, { graca, processadores })`).
- Isolado: `npx vitest run --project unidade apps/worker/src`;
  `npx vitest run --project integracao apps/worker/test/prazo-do-job.int.test.ts apps/worker/test/execucao.int.test.ts`.
- Armadilhas: processador que ignora o `sinal` segue rodando depois do corte, coberto só pela idempotência (diga no
  runbook); o catálogo precisa dos dois códigos, ou `fila-de-publicacao.ts:117` os rebaixa a `ERRO_INTERNO`;
  `infra/compose.yml` também é da 90.0.

## Fora do escopo desta tarefa

Prazos de IA e `executor: 'api'` (47.0, X6), `job.falhos{tipo}` e alerta (44.0), PDF no worker (45.0, X6), `kill -9` com
execução de IA `rodando` (47.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| 43.1 não tem commit à parte: a caracterização é o caso `execucao.int.test.ts › SIGTERM com job que passa da graça e tentativas sobrando`, que já existia verde no HEAD com `attempts` do tipo (5) e ganhou o `publicado(5)` explícito e a asserção da vaga no Redis | O hook recusa commit de código sem `(tarefa N.0)` e sem os revisores da tarefa, então um commit só de teste não passa; o caso fixa o mesmo comportamento que a decisão 4 preserva | `onda-3b.md` RF17 (« Como ficou (43.0) », último período) |
| O 3º parâmetro de `Processador` é `sinal?: AbortSignal`, opcional **só no tipo**; o executor sempre o entrega | 13 chamadas diretas de processador em testes de integração de 7 arquivos (`execucaoDoJob(…)`) ficariam sem o 3º argumento e quebrariam o `tsc`; passar `sinal` obrigatório arrastaria 7 suítes de integração para o portão sem provar nada novo | `onda-3b.md` RF17 (« Como ficou (43.0) », 1º período; a assinatura da spec era `sinal: AbortSignal`) |
| `SandboxDeCpu.queimar(cpuMs, sinal)` rejeita com `EXECUCAO_INTERROMPIDA` ao abortar, e a thread sai de `#ocupadas` na hora (a contagem `threads` não inclui a que está terminando) | A spec diz « termina a thread e rejeita » sem o código; o sandbox não sabe se o aborto é o prazo ou o desligamento, e quem decide o código do estouro é o executor (o `TEMPO_ESGOTADO` dele ganha, porque o `abort()` e a rejeição dele são síncronos). Tirar a thread de `#ocupadas` já no aborto elimina a corrida com uma mensagem tardia dela | `onda-3b.md` RF17 (« Como ficou (43.0) », `SandboxDeCpu.queimar`) |
| A tentativa interrompida que o processador rejeita depois do `interromper` sai como `ErroParaAFila(EXECUCAO_INTERROMPIDA)`, sem passar por `falhar` | Sem isso a rejeição causada pelo aborto gravaria uma segunda falha (`ERRO_INTERNO`) e liberaria a vaga duas vezes; com tentativa sobrando, quem a retoma é outra réplica (D49) | `onda-3b.md` RF17 (« Como ficou (43.0) », `interromper()`) |
| `apps/worker/test/fila-de-teste.ts` não muda | A bancada já aceita o registro de definições injetado (`new BancadaDeFila(definicoes)`, da 19.0), e `prazo-do-job.int.test.ts` o usa | `onda-3b.md` RF17 (« Como ficou (43.0) », último período) |
| Os 8 `prazoMs` foram conferidos e nenhum mudou; a conferência é um teste que fixa os valores | Cada valor já era o « maior tempo que o tipo leva, arredondado para cima » (`onda-1b.md`, `definicoes-de-job.ts`); mudar um agora é decisão de quem mede o tipo | `onda-3b.md` RF17 (« Como ficou (43.0) », « Os 8 prazos … foram conferidos ») |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o corte é o prazo da definição do tipo
-    await this.comPrazo(() => processador(lidos.data as never, { ...execucao, prazoMs: definicao.prazoMs }, controle.signal), definicao.prazoMs, controle, execucao)
+    await this.comPrazo(() => processador(lidos.data as never, { ...execucao, prazoMs: definicao.prazoMs }, controle.signal), 5_000, controle, execucao)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › processador pendente: aos 5 000 ms a tentativa falha com TEMPO_ESGOTADO
         this.dependencias.logger.warn({ evento: 'job.tempo_esgotado', jobId, tentativa, prazoMs })
-        controle.abort()
         rejeitar(new TempoEsgotado())
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/test/prazo-do-job.int.test.ts › job que não termina, na última tentativa
-        this.dependencias.logger.warn({ evento: 'job.tempo_esgotado', jobId, tentativa, prazoMs })
         controle.abort()
         rejeitar(new TempoEsgotado())
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › estouro com tentativa sobrando: o erro leva o código
-    super(CodigoDeFalhaDeJob.TEMPO_ESGOTADO)
+    super(CodigoDeFalhaDeJob.TEMPO_ESGOTADO, true)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › estouro com tentativa sobrando: o erro leva o código
-        if (falha instanceof UnrecoverableError || erro instanceof TempoEsgotado) {
+        if (falha instanceof UnrecoverableError) {
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o que resolve aos 4 999 ms conclui
-          clearTimeout(temporizador)
           resolver()
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › processador que falha antes do prazo
-          clearTimeout(temporizador)
           rejeitar(erro)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › a rejeição que o processador dá depois do corte é engolida
         () => {
           clearTimeout(temporizador)
           resolver()
         },
-        (erro: unknown) => {
-          clearTimeout(temporizador)
-          rejeitar(erro)
-        },
       )
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o processador que escuta o sinal e rejeita ao abortar não duplica a falha
-        if (emAndamento.interrompida) throw new ErroParaAFila(CodigoDeFalhaDeJob.EXECUCAO_INTERROMPIDA)
         const falha = await this.falhar(job, jobId, erro)
```




```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › na última tentativa: aborta o sinal, grava EXECUCAO_INTERROMPIDA
-    this.#emAndamento.add(emAndamento)
     try {
```


```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › com tentativa sobrando e processador que rejeita ao abortar
-    for (const tentativa of rodando) tentativa.interrompida = true
     for (const { controle } of rodando) controle.abort()
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › na última tentativa: aborta o sinal, grava EXECUCAO_INTERROMPIDA
     for (const tentativa of rodando) tentativa.interrompida = true
-    for (const { controle } of rodando) controle.abort()
     await Promise.all(
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › com tentativa sobrando: aborta o sinal e deixa a linha
       rodando
-        .filter(({ ultimaTentativa }) => ultimaTentativa)
         .map(async ({ vaga, contexto }) => {
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › na última tentativa: aborta o sinal, grava EXECUCAO_INTERROMPIDA
-          await executarNoContexto(contexto, () => this.gravarFalhaDefinitiva(vaga.jobId, CodigoDeFalhaDeJob.EXECUCAO_INTERROMPIDA))
+          await this.gravarFalhaDefinitiva(vaga.jobId, CodigoDeFalhaDeJob.EXECUCAO_INTERROMPIDA)
           await this.liberarVaga(vaga)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/test/execucao.int.test.ts › SIGTERM com duas escolas na última tentativa
-          await executarNoContexto(contexto, () => this.gravarFalhaDefinitiva(vaga.jobId, CodigoDeFalhaDeJob.EXECUCAO_INTERROMPIDA))
+          await executarNoContexto(rodando[0]?.contexto ?? contexto, () => this.gravarFalhaDefinitiva(vaga.jobId, CodigoDeFalhaDeJob.EXECUCAO_INTERROMPIDA))
           await this.liberarVaga(vaga)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › na última tentativa: aborta o sinal, grava EXECUCAO_INTERROMPIDA
           await executarNoContexto(contexto, () => this.gravarFalhaDefinitiva(vaga.jobId, CodigoDeFalhaDeJob.EXECUCAO_INTERROMPIDA))
-          await this.liberarVaga(vaga)
```

```mutacao
arquivo: apps/worker/src/montagem.ts
teste: apps/worker/src/desligamento.test.ts › a graça é de 20 s
-export const GRACA_DO_DESLIGAMENTO_MS = 20_000
+export const GRACA_DO_DESLIGAMENTO_MS = 30_000
```

```mutacao
arquivo: apps/worker/src/montagem.ts
teste: apps/worker/test/execucao.int.test.ts › SIGTERM com job na última tentativa além da graça
       logger.warn({ evento: 'worker.desligamento_forcado' })
-      await executor.interromper()
       redis.disconnect()
```

```mutacao
arquivo: infra/compose.yml
teste: apps/worker/src/desligamento.test.ts › o Docker espera mais que a graça antes do SIGKILL
-    stop_grace_period: 25s
+    stop_grace_period: 15s
```

```mutacao
arquivo: apps/worker/src/processadores/sintetico.ts
teste: apps/worker/src/processadores/sintetico.test.ts › sinal que já chegou abortado rejeita na hora
-    if (sinal?.aborted === true) return Promise.reject(new FalhaDeJob(CodigoDeFalhaDeJob.EXECUCAO_INTERROMPIDA))
     if (cpuMs === 0) return Promise.resolve()
```

```mutacao
arquivo: apps/worker/src/processadores/sintetico.ts
teste: apps/worker/src/processadores/sintetico.test.ts › termina a thread que queimava
-      sinal?.addEventListener('abort', () => this.#abortar(pedido), { once: true })
       this.#fila.push(pedido)
```

```mutacao
arquivo: apps/worker/src/processadores/sintetico.ts
teste: apps/worker/src/processadores/sintetico.test.ts › o pedido que esperava na fila sai dela
-    if (naFila >= 0) this.#fila.splice(naFila, 1)
+    if (naFila >= 0) void 0
     else {
```

```mutacao
arquivo: apps/worker/src/processadores/sintetico.ts
teste: apps/worker/src/processadores/sintetico.test.ts › termina a thread que queimava
         this.#ocupadas.delete(thread)
-        void thread.terminate()
```

```mutacao
arquivo: apps/worker/src/processadores/sintetico.ts
teste: apps/worker/src/processadores/sintetico.test.ts › termina a thread que queimava
         if (ocupante !== pedido) continue
-        this.#ocupadas.delete(thread)
         void thread.terminate()
```


```mutacao
arquivo: apps/worker/src/processadores/sintetico.ts
teste: apps/worker/src/processadores/sintetico.test.ts › passa o sinal da execução à queima de CPU
-    await cpu.queimar(cpuMs, sinal)
+    await cpu.queimar(cpuMs)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › a última tentativa é a que esgota o `attempts` da fila
-  return job.attemptsMade + 1 >= (job.opts.attempts ?? 1)
+  return job.attemptsMade + 1 > (job.opts.attempts ?? 1)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › job sem `attempts` na fila tem uma tentativa só
-  return job.attemptsMade + 1 >= (job.opts.attempts ?? 1)
+  return job.attemptsMade + 1 >= (job.opts.attempts ?? 5)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › a última tentativa é a que esgota o `attempts` da fila
-    const emAndamento: TentativaEmAndamento = { vaga, contexto, controle: new AbortController(), ultimaTentativa: esgotouAsTentativas(job), interrompida: false }
+    const emAndamento: TentativaEmAndamento = { vaga, contexto, controle: new AbortController(), ultimaTentativa: true, interrompida: false }
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › processador pendente: aos 5 000 ms a tentativa falha com TEMPO_ESGOTADO
         controle.abort()
-        rejeitar(new TempoEsgotado())
+        rejeitar(new FalhaDeJob(CodigoDeFalhaDeJob.ERRO_INTERNO))
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › processador pendente: aos 5 000 ms a tentativa falha com TEMPO_ESGOTADO
         rejeitar(new TempoEsgotado())
-      }, prazoMs)
+      }, prazoMs - 1)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › processador pendente: aos 5 000 ms a tentativa falha com TEMPO_ESGOTADO
-    await this.comPrazo(() => processador(lidos.data as never, { ...execucao, prazoMs: definicao.prazoMs }, controle.signal), definicao.prazoMs, controle, execucao)
+    await this.comPrazo(() => processador(lidos.data as never, { ...execucao, prazoMs: definicao.prazoMs }, new AbortController().signal), definicao.prazoMs, controle, execucao)
```

```mutacao
arquivo: apps/worker/src/processadores/sintetico.ts
teste: apps/worker/src/processadores/sintetico.test.ts › termina a thread que queimava
-    pedido.rejeitar(new FalhaDeJob(CodigoDeFalhaDeJob.EXECUCAO_INTERROMPIDA))
+    pedido.rejeitar(new FalhaDeJob(CodigoDeFalhaDeJob.ERRO_INTERNO))
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o desligamento com a conclusão da linha em andamento
-        await this.rodarProcessador(inicio.tipo, inicio.dados, vaga, { jobId, tentativa, chaveIdempotencia: jobId }, emAndamento.controle).finally(() => {
-          this.#emAndamento.delete(emAndamento)
-        })
+        await this.rodarProcessador(inicio.tipo, inicio.dados, vaga, { jobId, tentativa, chaveIdempotencia: jobId }, emAndamento.controle)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o desligamento com a falha do estouro sendo gravada
-        await this.rodarProcessador(inicio.tipo, inicio.dados, vaga, { jobId, tentativa, chaveIdempotencia: jobId }, emAndamento.controle).finally(() => {
-          this.#emAndamento.delete(emAndamento)
-        })
+        await this.rodarProcessador(inicio.tipo, inicio.dados, vaga, { jobId, tentativa, chaveIdempotencia: jobId }, emAndamento.controle)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › job que já terminou não é tocado
-        await this.rodarProcessador(inicio.tipo, inicio.dados, vaga, { jobId, tentativa, chaveIdempotencia: jobId }, emAndamento.controle).finally(() => {
-          this.#emAndamento.delete(emAndamento)
-        })
+        await this.rodarProcessador(inicio.tipo, inicio.dados, vaga, { jobId, tentativa, chaveIdempotencia: jobId }, emAndamento.controle)
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/src/executor.test.ts › o log só afirma `job.falhou` quando a linha mudou
-      if (await this.dependencias.repositorio.registrarFalha(jobId, codigo)) this.dependencias.logger.warn({ evento: 'job.falhou', jobId, codigo })
+      await this.dependencias.repositorio.registrarFalha(jobId, codigo)
+      this.dependencias.logger.warn({ evento: 'job.falhou', jobId, codigo })
```

```mutacao
arquivo: apps/worker/src/executor.ts
teste: apps/worker/test/prazo-do-job.int.test.ts › o estouro com tentativa sobrando também libera a vaga da escola
-        if (falha instanceof UnrecoverableError || erro instanceof TempoEsgotado) {
+        if (falha instanceof UnrecoverableError) {
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian 1ª | `montagem.ts`: o `await executor.interromper()` não tem prazo próprio; envolver numa corrida de uns 3 s, como o `close()` | `TODO.md` (muda o comportamento do desligamento, fora do escopo de 43.0) |
| infra-guardian 1ª | Nenhum processador real recebe o `sinal`; conferir `sinal.aborted` entre um lote e outro em `montar-arquivo`, `expurgar-*` e `eliminar-titular` | `TODO.md` (a R55, decisão 2, aceita o estouro sem escuta do sinal e o runbook avisa; entra na tarefa que mexer em cada um) |
| infra-guardian 1ª | Contador de estouros por tipo e por fila, porque `job.falhos{tipo}` só conta a falha final | tarefa 44.0 (`job.falhos{tipo}` e alerta, fora do escopo de 43.0) |
| infra-guardian 1ª | Linha no comentário de `infra/compose.carga.yml` sobre `threadsMaximo` ultrapassado por milissegundos no aborto | `TODO.md` (arquivo que a 43.0 não toca; a tarefa já declara esse comportamento) |
| llm-integrator 1ª | Quando a 47.0 trouxer os `ia.*`, o processador repassa o `sinal` ao adaptador e conta o custo parcial da chamada abortada | tarefa 47.0 |
| llm-integrator 1ª | Declarar na 47.0 o limite de passos e de custo por execução | tarefa 47.0 |
| test-engineer 1ª | `sintetico.test.ts`, bloco "sinal abortado": os limites de 3 000 ms de parede e 200 ms de CPU dependem de relógio real; trocar por contagem de threads ou evento `exit` | recusada por ora: o revisor mesmo diz que passam com folga larga; se ficarem instáveis na esteira, a correção abre com a medição |
| test-engineer 1ª | Caso de concorrência D49: a retentativa depois de `TEMPO_ESGOTADO` roda ao mesmo tempo que o processador antigo que ignora o `sinal`, com chave de idempotência | `TODO.md` (precisa de processador real que grave efeito; hoje só o sintético existe, e o runbook já escreve o aviso) |
| infra-guardian 2ª, revisor-geral 2ª | `executor.ts` (caminho de sucesso): o retorno de `concluir` não é conferido, então `job.concluido` sai mesmo quando a linha não mudou (processador que ignora o `sinal` termina depois do `interromper`); escrever `job.concluido` só quando `concluir` devolver `true` | `TODO.md` (já existia antes da tarefa; muda o log do caminho de sucesso, fora do escopo de 43.0) |
| revisor-geral 2ª | Comentário em `executor.ts` (« o `finally` roda antes de a continuação ver o desfecho »): dizer que é o `.finally` encadeado em `rodarProcessador`, não o `finally` externo | recusada: o texto está correto; é só ambíguo, e não muda comportamento |
| test-engineer 2ª | `executor.test.ts`, caso « o desligamento com a falha do estouro sendo gravada »: sob a mutação do `.finally` fica vermelho por estourar o tempo do teste, e não por asserção; cada chamada de `registrarFalha` resolver por conta própria | recusada: o teste fica vermelho sem a correção, que é o que a regra 40 exige; só a mensagem é ruim |
| test-engineer 2ª | `prazo-do-job.int.test.ts`: o limite de 4 s do caso com `attempts: 3` tem folga de uns 0,8 s no pior caminho; a asserção que prova a regra é a da ordem, e o limite poderia sair | `TODO.md` (se o caso ficar instável na esteira, a correção abre com a medição) |
| llm-integrator 2ª | Dar prazo próprio ao `await executor.interromper()` em `montagem.ts` | já está no `TODO.md` (linha da 1ª rodada) |
| llm-integrator 2ª | Se a 44.0 tocar o executor, conferir que nenhum caminho novo de falha entra em `falhar` antes do `.finally` | tarefa 44.0 |

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
| 2026-10-22 18:01:07 | 2026-10-22 18:01:30 | `llm-integrator` | 1 | APROVADO | a9dadb9ffae35f97c |
| 2026-10-22 18:01:05 | 2026-10-22 18:02:42 | `infra-guardian` | 1 | APROVADO | a481e93a3b9f9db57 |
| 2026-10-22 18:01:10 | 2026-10-22 18:02:59 | `revisor-geral` | 1 | APROVADO | adf1b90a756208581 |
| 2026-10-22 18:01:08 | 2026-10-22 18:05:13 | `test-engineer` | 1 | REPROVADO | a36d01c2d1baf6c92 |
| 2026-10-22 18:27:47 | 2026-10-22 18:28:19 | `llm-integrator` | 2 | APROVADO | a7b5941c72f4b3841 |
| 2026-10-22 18:27:43 | 2026-10-22 18:28:23 | `infra-guardian` | 2 | APROVADO | ab4e34b0f135136cf |
| 2026-10-22 18:27:51 | 2026-10-22 18:28:36 | `revisor-geral` | 2 | APROVADO | aa5831ce2fbe15aee |
| 2026-10-22 18:27:58 | 2026-10-22 18:30:24 | `test-engineer` | 2 | APROVADO | ad9c460797b168ef2 |
