# Tech Spec da X5 — Onda 3: execução e resiliência

**Comum:** `techspec.md` · **PRD:** RF16–RF22 e o prazo do RF25 · **Tarefas:** 42.0 a 54.0

## 1. O que muda

Resumo em `techspec.md` §1 e §7c. **A ordem:** a forma muda com a IA no processo (42.0), o executor ganha prazo (43.0),
o worker estreia pelo PDF (45.0), e só então a IA passa inteira (47.0), sem dois executores vivos.

## 2. Desenho

### T9 — o Command por tarefa (42.0)

Interface em `apps/api/src/ia/execucao-de-tarefa.ts`, registro em `apps/api/src/ia/registro-de-execucoes.ts`, Command no
módulo dono.
```ts
interface ExecucaoDeTarefa<E, S, L> {
  tarefa: DefinicaoDeTarefa<E, S>; fila: 'interativa' | 'normal'
  preparar(execucao: ExecucaoLida): Promise<{ entrada: E; lido: L; alunoId?: string; turmaId?: string }>
  concluir(saida: S, lido: L, tx: TransacaoBanco, execucaoId: string): Promise<ResultadoGravado>
}
```
- O `lido` mutável das seis `entrada()` vira retorno tipado (`tutor.service.ts:180`, `assistente.service.ts:90`,
  `ferramentas.service.ts:71`, `artefato.service.ts:126`). A conferência da 4.0 (S12) fica no `preparar` e no `concluir`.
- O contexto vem da linha de `execucao_agente` (escola, `solicitadaPor`, ano), não da sessão
  (`contexto-da-execucao.ts:185`): `sessaoDaRequisicao().usuarioId` vira `exigirUsuarioDoContexto()`, e repository que leia
  a sessão falha fechado, já na 42.0.
- **A trava.** `PedidoDeExecucao` fica só com `aoGravar`, e um teste exige Command para toda `TarefaDeIa`, salvo
  `relatorio_da_correcao` (R23). A 42.0 grava `TURNO_BASE_P95_MS` (`infra/k6/justica-entre-escolas.js`, `FASE=base`).

### T9 — o worker da API (45.0 e 47.0)

- **A publicação.** `agendar` (`apps/api/src/ia/agendador-de-execucoes.ts`) chama `enfileirarUmaVez`
  (`ia.executar-agente`, ou `ia.executar-agente-normal` para o Analista), chave `execucaoId`, na transação, uma tentativa.
- **O executor** vai de `apps/worker/src/executor.ts` a `@educa/nucleo/execucao-de-jobs` (só ali entra `bullmq`); nenhum
  repository de IA muda de pacote (R40).
- **A entrada.** `apps/api/src/main-worker.ts`, Nest sem HTTP: `worker-ia-1/2` em `interativa` (25) e `normal` (2);
  `worker-pdf-1` em `lote` (1), porque o pdfjs prende o event loop (teste do compose).
- **Limites mantidos (R39):** `VAGAS_ESCOLA_INTERATIVA` e 2 execuções de IA por escola (`config-ia.ts:87`).
- **O processador:** `pendente` roda; `rodando` é reentrega (stalled ~15 s, `filas.ts:71`) e termina `falhou` com
  `EXECUCAO_INTERROMPIDA` sem chamar o modelo (R39); erro de IA marca a execução e o job conclui. `falharInterrompidas` vem
  junto, como rede.
- O polling de 1 s continua (`shared/src/time/execucao.ts:20`; realtime fica fora, P7). **A trava:** o `AppModule` HTTP
  não provê `LLM_PROVIDER` nem `ExtratorDePdf` (`apps/api/test/arquitetura.test.ts`).
- **O PDF (45.0).** `MaterialService.enviar` guarda os bytes no storage privado (`ArmazemDeArquivos` ganha `guardarBytes`
  e `lerBytes`) e grava o job `material.extrair-pdf` (chave = id do material); o processador extrai e apaga o objeto.
  `fila-de-extracao.ts` e `varrerParados` saem. ⚠️ O órfão sai no expurgo, e a 45.0 confere.
- **Latência:** +20 a 500 ms (`despachante.ts:24`); a 47.0 exige `turno_b p(95) ≤ TURNO_BASE_P95_MS + 1000`.

### RF17 — prazo por tipo (43.0)

`Processador = (dados, execucao, sinal: AbortSignal) => Promise<void>`. O executor corre contra o `prazoMs` da definição
(onda 1B); no estouro, falha com `TEMPO_ESGOTADO` (novo, em `shared/src/sistema/jobs.ts`) e libera a vaga. A publicação
usa o `attempts` da definição. No SIGTERM, o worker espera 20 s e aborta: o que sobrou termina `EXECUCAO_INTERROMPIDA`.

### T5 — a falha final visível (44.0 e 46.0)

- **44.0.** `job.falhos{tipo}` no despachante, alerta `infra/grafana/alertas/job-falhou-de-vez.yaml`, parágrafo "Job que
  falhou de vez" no runbook. O expurgo (`expurgo-de-jobs.repository.ts`) apaga `falhou` em
  30 dias (`concluido` segue em 7). `docs/lgpd.md` ganha a linha de `job_registro`, que não existe (o PRD §8 erra o fato).
- **46.0.** `ops:reprocessar-job` tira a cópia `failed` do BullMQ (senão `reconciliacao.ts:119-129` a falha de novo) e
  volta a linha a `aguardando`; `ops:descartar-job` apaga. Em `operacao/`, auditados; job `ia.*` é recusado.

### T10 — o provedor de IA (48.0 e 49.0)

- **48.0.** `packages/nucleo/src/ia/adaptador-resiliente.ts` decora o `AdaptadorDeModelo` em `criarProvedorDeIa`, com
  `cockatiel` (N9): `wrap(retry, disjuntor, timeout)`. Uma retentativa com jitter, só em 429 e conexão recusada, com
  `Retry-After`. Timeout e 5xx não se repetem, porque podem ter cobrado (`adaptador-openai-compat.ts:164`); `pedirComRecuo`
  sai. Disjuntor por provedor e perfil: abre com 5 falhas, meio-abre em 30 s.
- **49.0.** `LimiteDeTokens` usa o `ContadorEmJanela` (`sessao/senha/contador-em-janela.ts`), com `somar(chave, quantidade)` e
  teto de 80 % de `LLM_TOKENS_POR_MINUTO`. Degradação 80.4: espera até 8 s com o "Pensando" (`aluno/Tutor.tsx:300`), depois `LLM_MODELO_MENOR_<PERFIL>`, depois
  `IA_INDISPONIVEL`; a reserva fica para a D37. Alertas "Provedor de IA fora" e "Tokens acima de 80 %" (`runbook.md:708`).

### RF20 — a D62 na subida (50.0)

Na subida da API e do worker, `openai_compat` fora da nossa rede exige o `suboperador` vigente da `IA_PROVEDOR_ID` com
`pais = 'BR'` e treinamento vedado. O falso e o local passam. A leitura entra na lista de `arquitetura.test.ts`.

### T13 — a prova (51.0 e 53.0) e o prazo do cliente (52.0)

- **51.0.** O `PUT` da resposta ganha `sequencia` opcional (sem ela, vale o relógio do servidor). A migration cria
  `resposta_atividade.sequencia bigint not null default 0`. O upsert grava só
  `where excluded.sequencia > resposta_atividade.sequencia`; o que perde relê e devolve o que ficou
  (`minha-atividade.repository.ts:227`).
- **52.0** (RF25). `comPrazo(sinal, limiteMs)` em `apps/web/src/api/cliente.ts`: `AbortController` próprio, ligado ao
  sinal de quem chamou, sem `AbortSignal.timeout` nem `any` (`chrome99`). Estouro vira `TEMPO_ESGOTADO`; cancelamento relança. Prazos: JSON 20 s, PDF 30 s, upload 180 s, `PUT` da
  prova 10 s. Os três `fetch` (`api/cliente.ts:85`, `api/material.ts:93`, `api/artefatos.ts:115`) passam pela peça, e
  `no-restricted-globals: fetch` barra o resto. `redeFalsa` (`__fixtures__/tela.tsx`) respeita o `signal`.
- **53.0.** `fila-de-respostas.ts` espelha a fila em `sessionStorage`:
  `{ dono: usuarioId, pendentes: [{ questao, alternativa, sequencia }] }`, só ids, hidratado só com o mesmo dono, limpo no
  envio e em `aoTrocarDeSessao`. O recuo ganha ±25 % de jitter.

### RF22 — N3 (54.0)

`#semRedis` (`sessao/desafio.ts:185`, em `credencial/` depois da onda 2) devolve `INDISPONIVEL_TENTE_DE_NOVO` com
`Retry-After` (como `operacao/desafio-de-operador.ts:136`), e `conferirLivre` roda antes de `contador.reservar`
(`mfa.service.ts:106`).

## 3. Falha

| Caso | O teste |
|---|---|
| Worker morto | `kill -9` no `worker-ia-1`, latência falsa de 5 s: `EXECUCAO_INTERROMPIDA` em 20 s, uma linha em `consumo_ia` |
| Duplicado | job entregue duas vezes, uma resposta |
| Prazo | processador que nunca resolve: `TEMPO_ESGOTADO`, vaga livre |
| Redis fora | `POST` do Tutor 202 e roda na volta; MFA e escolha de escola 503, sem gastar tentativa |
| Provedor lento | `servidor-llama-falso.ts` além do prazo: `IA_TEMPO_ESGOTADO`, sem repetir |
| 429 | uma repetição; com `Retry-After` maior que o prazo, nenhuma |
| Provedor fora | 5 recusas abrem o disjuntor, a 6.ª falha sem `fetch`, o relógio falso meio-abre |
| Tokens | balde cheio espera e recusa; Redis fora: seguro em memória dividido pelas instâncias |
| SIGTERM | a execução além da graça termina `EXECUCAO_INTERROMPIDA` |
| Falha final | `infra/test/alertas.int.test.ts`; reprocessar conclui; expurgo com 29 e 31 dias |
| Prova | a 5 depois da 7 deixa a 7; F5 com pendente; outro dono descarta; `PUT` pendurado não trava os outros |
| D62 | provedor fora do Brasil não sobe (`config.test.ts`) |

## 4. Isolamento, dado pessoal, conformidade, carga

No worker, o contexto vem da linha de `execucao_agente`, e o payload leva só `execucaoId` ou `materialId`. Dado
pessoal, conformidade e carga: `techspec.md` §7, §7b e §7c; a linha 86 de `docs/lgpd.md` (Material) cita o PDF temporário.

## 5. Tarefas

| # | Título | RF | Depende de | Veto | Porte |
|---|---|---|---|---|---|
| 42.0 | IA por Command registrado, no processo, com a base do k6 | 16 | fim da onda 2 | tenancy, conformidade | grande |
| 43.0 | Job estourado dá `TEMPO_ESGOTADO` | 17 | fim da onda 2 | infra | grande |
| 44.0 | Falha final alerta e fica 30 dias | 18 | fim da onda 2 | infra, privacy | pequeno |
| 45.0 | PDF lido no worker da API | 16 | 43.0 | infra, privacy, tenancy | grande |
| 46.0 | Reprocessar e descartar job | 18 | 44.0, 45.0 | infra, privacy | pequeno |
| 47.0 | IA no worker, reentrega interrompida, p95 + 1 s no máximo | 16, 17 | 42.0, 45.0 | infra, tenancy, conformidade | grande |
| 48.0 | Provedor lento, 429 ou fora falha rápido | 19 | fim da onda 2 | infra | pequeno |
| 49.0 | Tokens por minuto e degradação 80.4 | 19 | 48.0, 50.0 | infra | pequeno |
| 50.0 | Provedor fora do Brasil não sobe | 20 | fim da onda 2 | conformidade, privacy | pequeno |
| 51.0 | Resposta atrasada não sobrescreve | 21 | fim da onda 2 | infra, tenancy | grande |
| 52.0 | Rede pendurada dá "Tentar de novo" | 25 | fim da onda 2 | — | pequeno |
| 53.0 | Pendente sobrevive ao F5 | 21 | 51.0, 52.0 | privacy, infra | pequeno |
| 54.0 | Redis fora: 503 sem gastar tentativa | 22 | fim da onda 2 | infra | pequeno |

Corre em paralelo o que não depende. **Não correm juntas:** 43.0, 45.0 e 47.0 (executor e `infra/compose.yml`); 49.0 e
50.0 (`config/config-ia.ts`).

## 6. Riscos

- **Dois workers na mesma fila** dariam `TIPO_DESCONHECIDO`. O campo `executor` (onda 1B) separa as filas; a 45.0 prova.
- **Fora do RF16 e do RF18:** o teto de páginas do PDF (U05-1) e o alerta de rotina parada (`runbook.md:647`), para depois.
