# Tech Spec da X5 — Onda 3B: prazo, falha final e o PDF no worker

**Comum:** `techspec.md` · **PRD:** RF16 a RF18 · **Tarefas:** 43.0, 44.0, 45.0 e 46.0

## 1. O que muda

Resumo, dado pessoal, conformidade e carga em `techspec.md` §1, §7, §7b e §7c.

## 2. Desenho

### RF17 — prazo por tipo (43.0)

`Processador = (dados, execucao, sinal: AbortSignal) => Promise<void>`, contra o `prazoMs` da definição (onda 1B; os de IA
na 47.0). O estouro dá `TEMPO_ESGOTADO` e libera a vaga. No SIGTERM, 20 s de graça; o que sobrou na última
tentativa termina `EXECUCAO_INTERROMPIDA`, e o que ainda tem tentativa fica `ativo` para outra réplica retomar (D49, R55).

Como ficou (43.0): o terceiro parâmetro do tipo `Processador` é `sinal?: AbortSignal`, **opcional só no tipo**: o executor sempre o
entrega, e as 13 chamadas diretas dos testes (`execucaoDoJob(…)`, em sete arquivos) seguem com dois argumentos, sem arrastar sete
suítes de integração para o portão. `ExecutorDeJobs.comPrazo` corta a tentativa no `prazoMs` da definição: loga `job.tempo_esgotado`
(`jobId`, `tentativa`, `prazoMs`), aborta o `sinal` e rejeita com `TempoEsgotado` (um `FalhaDeJob(TEMPO_ESGOTADO)`) **não definitivo**, então a
retentativa é a do tipo; a rejeição que o processador dá depois do corte cai no tratamento do `then` e some. A vaga sai em toda
tentativa estourada, e não só na última (`executar`). `ExecutorDeJobs.interromper()` marca cada tentativa em andamento como
interrompida, aborta o `sinal` e, **só na última tentativa** (`attempts` esgotadas), grava `EXECUCAO_INTERROMPIDA` no contexto da
escola do job e libera a vaga; a tentativa interrompida que o processador rejeita depois sai como `ErroParaAFila` sem gravar nada
(o `interromper` já tratou). A tentativa deixa de ser interrompível quando o processador termina, antes de `concluir` e de `falhar`, para o desligamento não gravar uma segunda falha sobre o desfecho dela; e `job.falhou` só vai ao log quando `registrarFalha` mudou a linha. O `encerrar` da montagem o chama ao estourar a graça, **antes** de derrubar a conexão da fila. O
`SandboxDeCpu.queimar(cpuMs, sinal)` rejeita com `EXECUCAO_INTERROMPIDA` ao abortar: tira o pedido da fila ou termina a thread, que
sai de `#ocupadas` na hora (a contagem `threads` não inclui a que está terminando, por milissegundos; o `exit` dela redistribui a fila). A graça é `GRACA_DO_DESLIGAMENTO_MS = 20_000` e o
`stop_grace_period` do worker, 25 s, ligados por `apps/worker/src/desligamento.test.ts`. Os 8 prazos de `DEFINICOES_DE_JOB` foram
conferidos e nenhum mudou (um teste os fixa). A 43.1 não teve commit próprio: o hook recusa commit de código sem os revisores da
tarefa, e o caso de caracterização (`execucao.int.test.ts › SIGTERM com job que passa da graça e tentativas sobrando`, `attempts: 5`)
já existia verde no HEAD e ganhou a asserção da vaga no Redis. `apps/worker/test/fila-de-teste.ts` não mudou: a bancada já aceita o
registro de definições injetado.

### T5 — a falha final visível (44.0)

`job.falhos{tipo}` no despachante, o alerta `job-falhou-de-vez.yaml` e o seu parágrafo no runbook. O expurgo
(`expurgo-de-jobs.repository.ts`) apaga `falhou` em 30 dias (`concluido` segue em 7), **salvo `titular.*`** (C20, D13),
que fica até a ação do operador: `titular.montar-arquivo` é enfileirado uma vez só (`privacidade.service.ts:238`). O
`docs/lgpd.md` ganha a linha de `job_registro`: só ids, esses prazos, e a cópia `failed` no Redis por 7 dias.

Como ficou (44.0): a exceção de `titular.*` é só do `falhou` e está no SQL do lote (`tipo not like 'titular.%'`, no ramo do `falhou`),
no mesmo índice de finalizados; o `concluido` de `titular.*` sai em 7 dias. A medição é `DespachoRepository.medirFalhos` (`@SemEscopo`,
a mesma justificativa da `medirPendentes`): salta de tipo em tipo pelo índice parcial novo `job_registro_falhos_idx` (migration 0038;
sem ele a contagem atravessaria os concluídos de 7 dias a cada 5 s) e conta cada tipo até 10.000. O rótulo é só `tipo`: a métrica não está
em `METRICAS_COM_ESCOLA`. O tipo cuja última linha o expurgo levou sai na medição seguinte, sem série em zero. Falha da consulta tira só
`job.falhos` da exportação. O alerta dispara com qualquer valor acima de zero e fica aceso enquanto houver linha do tipo (30 dias, ou até a
ação do operador no `titular.*`); a guarda `toda métrica do código tem painel` pede o painel "Jobs que falharam de vez, por tipo". O prazo que a tela de Retenção da coordenação mostra para `job_registro` (`PRAZOS_FIXOS.tarefa_em_segundo_plano`) diz os mesmos prazos, e um teste no nucleo o liga às constantes do expurgo. Não houve commit de caracterização à parte: o teste do expurgo já fixava o `falhou` saindo em 7 dias.

### T5 — listar, reprocessar e descartar (46.0; C19, D13)

Em `operacao/`, com `ops/` fino.
- `ops:jobs-que-falharam` lista id, escola, tipo, código e data, nunca `dados` (D76).
- `ops:reprocessar-job <id> --chamado <n>` tira a cópia `failed` do BullMQ (`reconciliacao.ts:119-129`) e volta a linha
  a `aguardando`, `where estado = 'falhou'`. Recusa `ia.*`.
- `ops:descartar-job <id> --chamado <n>`, também `where estado = 'falhou'`, **recusa `ia.*` e `titular.*`**. O efeito:
  o PDF marca o material `falhou` e apaga o objeto no contexto da escola do job; `sistema.*` e `retencao.*` voltam na
  próxima rodada.
- O `--chamado` que não é inteiro positivo (0, negativo, texto) recusa antes de tocar a linha.
- **A auditoria**, no molde de `ops:retencao` (`retencao.ts:98`): `job.reprocessado` e `job.descartado` em
  `auditoria/acoes.ts`, `z.strictObject` com `autorOperador`, job, tipo, escola e `chamado`, nunca `dados`.
- **Os métodos sem escopo** (listar e ler por id do job) levam `@SemEscopo` com motivo; marcar roda com escopo, em
  `executarNoContexto` da escola que a leitura devolve. `operacao/` já tem três, e `ops/`, três: pela regra 10.9, os dois
  vão para `operacao/jobs-que-falharam.repository.ts`, sem método com escopo,
  como `MaterialParadoRepository` (`material.repository.ts:312`).

### O PDF no worker (45.0; C17, C18, D7, D8)

- **A chave.** `chaveDoTemporario(materialId)` em `packages/nucleo/src/material/temporario.ts`, porque o expurgo
  (`apps/worker/src/processadores/expurgar-escola.ts`) e a varredura também a usam. Ela devolve
  `material-temporario/${exigirEscolaDoContexto()}/${materialId}`: a escola só vem do contexto.
- **O armazém.** `ArmazemDeArquivos` ganha `guardarBytes` e `lerBytes`, sem URL nem listagem.
- **O envio.** `MaterialService.enviar` guarda os bytes e grava `material.extrair-pdf`, chave = id do material,
  `naoUrgente: false`.
- **O processador** lê com `MaterialRepository.lerParaExtrair(id)`, que tem `escola_id = exigirEscolaDoContexto()`. Ele
  confere o prazo entre páginas e grava trechos e estado numa transação só, com a transição
  `where estado = 'processando' and excluido_em is null`. Se ela não pega linha, a transação
  desfaz os trechos, e o job termina `concluido`, sem falha. Só depois do commit ele apaga o objeto e grava
  `objeto_apagado_em`, em todo caminho da tabela abaixo.
- **As colunas.** A migration da 45.0 acrescenta `material.processado_em` e `material.objeto_apagado_em`, nulas,
  com `lock_timeout`, e preenche `objeto_apagado_em = enviado_em` nas linhas de antes, que não têm objeto.
  O índice parcial `material_objeto_a_apagar_idx (processado_em, excluido_em) where objeto_apagado_em is null` serve a varredura. **Toda transição que
  tira o material de `processando`**, para `pronto` ou `falhou` (sucesso, falha final, prazo, reconciliação, descarte),
  grava `processado_em = now()` na mesma instrução, ou o `falhou` com o `apagar` caído escapa da varredura.
- **O destino do objeto:**

  | Caminho | O objeto |
  |---|---|
  | Sucesso | `pronto` e `processado_em`; apagado depois do commit |
  | Falha final, prazo, reconciliação ou descarte (46.0) | `falhou` e `processado_em` (`where estado = 'processando'`); apagado depois do commit |
  | `substitui` (41.0) | o novo tem objeto próprio, e o antigo já foi |
  | Exclusão (`material.service.ts:257`) | apagado depois do commit da exclusão lógica |
  | Expurgo noturno (`retencao.expurgar-escola`) | apaga o objeto antes da linha vencida; nunca o de `processando` |
  | Órfão (queda entre o commit e o apagar) | a varredura, abaixo |

- **A varredura do órfão** é a rotina `sistema.varrer-temporarios-de-material`, de hora em hora na fila `lote`, no
  molde de `expurgar-dado-pessoal.ts`:
  - uma leitura `@SemEscopo` devolve só `(escola_id, id)` do material com `objeto_apagado_em is null` e `processado_em`
    ou `excluido_em` de mais de 24 h, sem teto superior. O motivo é texto novo (a
    `JUSTIFICATIVA_DA_VARREDURA` de `material.repository.ts:307` sai com o `varrerParados`): "rotina nossa, sem
    requisição; devolve só a escola e o id, sem título, texto nem pessoa". O `processando` não
    excluído nunca entra;
  - cada escola roda em `executarNoContexto({ escolaId })`, e o `apagar` usa a chave do contexto e grava
    `objeto_apagado_em` pelo repository com escopo.
- **`varrerParados` sai** com `fila-de-extracao.ts`: o `processando` termina `falhou` pela reconciliação, e a
  coordenação usa o `substitui`.
- **A vazão.** O `worker-pdf` lê um PDF por vez. A meta, antes da medição: as 300 apostilas do onboarding (`docs/infra.md`
  §3.5) terminam entre 19h e 5h, com uma réplica; abaixo disso, com o maior PDF da semente, a 45.0
  reprova e escreve no `docs/infra.md` quantas réplicas precisa. O alerta
  `pdf-esperando.yaml` dispara com o PDF esperando mais de 10 min, e o runbook manda subir a réplica.
- **A documentação.** A linha 86 de `docs/lgpd.md` ganha o PDF temporário (até a extração, ou até 25 h no órfão), e
  `docs/modelo-de-dados.md:569` ("o arquivo não é guardado") é corrigido.

## 3. Falha

| Caso | O teste |
|---|---|
| Prazo | relógio falso, processador que não resolve: `TEMPO_ESGOTADO`, vaga livre |
| SIGTERM | além da graça: `EXECUCAO_INTERROMPIDA` na última tentativa; com tentativa sobrando, `ativo` |
| Falha final | cinco falhas: linha `falhou`, `job.falhos{tipo}`, alerta; expurgo com 29 e 31 dias |
| Pedido do titular | `titular.*` com cinco falhas: fica além de 31 dias, com métrica e alerta |
| Reprocessar | conclui e a cópia `failed` sai, sem a reconciliação republicar; de duas execuções, uma reprocessa; `ia.*` recusado |
| Descartar | um caso por tipo: PDF (material `falhou`, objeto apagado), `sistema.*` e `retencao.*`; `ia.*` e `titular.*` recusados (mutação: tirar o tipo da lista de recusa); job `aguardando` recusado, com linha, material e objeto intactos (mutação: tirar o `where estado = 'falhou'`) |
| Chamado | `--chamado` 0, negativo ou texto: recusado, linha e auditoria intactas |
| Auditoria | os dois comandos gravam a ação com o chamado; uma sentinela em `dados` fica fora da saída e da auditoria |
| Outra escola, repository | contexto A, `lerParaExtrair` com o id da B: vazio. Mutação: tirar o `escola_id` |
| Outra escola, job | job da A com o `materialId` da B: nada lido nem gravado em escola nenhuma; estado e objeto da B intactos |
| PDF duplicado | dois jobs do mesmo material em `Promise.all`: `pronto`, trechos uma vez, e os dois jobs `concluido` |
| PDF que dá certo ou falha | sucesso: objeto sai após o commit; prazo ou worker morto: `falhou` e objeto apagado |
| Exclusão em `processando` | o objeto deixa de existir, e o job que chega depois sai sem gravar |
| Expurgo | o da escola A apaga os objetos da A e não toca os da B. Mutação: tirar o filtro de escola |
| Órfão | `pronto` há 25 h é apagado; há 23 h, não; `falhou` há 25 h pela reconciliação, com o `apagar` falhando, é apagado (mutação: gravar `processado_em` só no sucesso); excluído há 25 h é apagado; `processando` há 25 h mantém o objeto; material de antes da migration (`objeto_apagado_em = enviado_em`) não entra |
| Órfão em duas escolas | um de cada: cada `apagar` roda no contexto da sua escola e grava só na linha dela. Mutação: um contexto só para as duas |

## 4. Isolamento, dado pessoal, carga

Os testes de outra escola, do expurgo e do órfão (§3); o objeto do PDF (`techspec.md` §7); o PDF em réplica própria.

⚠️ **Premissa:** o bucket de produção não tem versionamento, ou o objeto apagado sobrevive como versão antiga. Confere-se
no staging (D42).

## 5. Tarefas

Todas dependem do fim da onda 2, salvo onde está escrito.

| # | Título | RF | Depende de | Veto | Porte |
|---|---|---|---|---|---|
| 43.0 | Job estourado dá `TEMPO_ESGOTADO` | 17 | — | infra | grande |
| 44.0 | Falha final alerta e fica 30 dias; o pedido do titular, até a ação | 18 | — | infra, privacy | pequeno |
| 45.0 | PDF lido no worker da API, com o objeto apagado em todo caminho | 16 | 43.0 | infra, privacy, tenancy | grande |
| 46.0 | Listar, reprocessar e descartar job, sem `dados` e sem perder pedido do titular | 18 | 44.0, 45.0 | infra, privacy | pequeno |

43.0, 45.0 e 47.0 não correm juntas (executor e `infra/compose.yml`).

## 6. Riscos

- **O pdfjs prender o event loop** numa página grande dá falsa reentrega: a 45.0 mede com o maior PDF da semente.
- **Fora:** o teto de páginas do PDF (U05-1) e o alerta de rotina parada (`runbook.md:647`).
