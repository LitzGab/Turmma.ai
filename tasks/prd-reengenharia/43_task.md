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

- [ ] 43.1 — Caracterização, num commit antes: SIGTERM além da graça, com `attempts: 5`, deixa a linha `ativo` e a vaga no Redis
- [ ] 43.2 — `shared`: os dois códigos em `CodigoDeFalhaDeJob`; confere o `prazoMs` dos 8 tipos
- [ ] 43.3 — Executor: `Processador` recebe `sinal`; corte pelo `prazoMs`, `abort()`, vaga liberada, rejeição tardia engolida; log `job.tempo_esgotado` só com ids e `prazoMs`
- [ ] 43.4 — `SandboxDeCpu.queimar(cpuMs, sinal)` termina a thread no aborto
- [ ] 43.5 — `ExecutorDeJobs.interromper()`: aborta o que roda e, na última tentativa, `registrarFalha(EXECUCAO_INTERROMPIDA)` no contexto da escola do job e libera a vaga; `encerrar` o chama ao estourar a graça
- [ ] 43.6 — Graça de 20 s, `stop_grace_period` e o parágrafo dos dois códigos em `docs/runbook.md`
- [ ] 43.7 — Testes: os da tabela

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

