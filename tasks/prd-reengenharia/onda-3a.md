# Tech Spec da X5 — Onda 3A: a IA fora da API

**Comum:** `techspec.md` · **PRD:** RF16 e RF17 · **Tarefas:** 42.0 e 47.0

## 1. O que muda

Resumo em `techspec.md` §1 e §7c. **A ordem:** 42.0 (a forma, no processo), 43.0 (prazo), 45.0 (PDF no worker), 48.0
(provedor que falha rápido) e só então 47.0.

## 2. Desenho

### T9 — o Command por tarefa (42.0)

Interface em `apps/api/src/ia/execucao-de-tarefa.ts`, registro em `registro-de-execucoes.ts`, Command no módulo dono.
```ts
interface ExecucaoDeTarefa<E, S, L> {
  tarefa: DefinicaoDeTarefa<E, S>; fila: 'interativa' | 'ferramenta' | 'normal'
  preparar(execucao: ExecucaoLida): Promise<{ entrada: E; lido: L; alunoId?: string; turmaId?: string }>
  concluir(saida: S, lido: L, tx: TransacaoBanco, execucaoId: string): Promise<ResultadoGravado>
}
```
- O `lido` mutável das seis `entrada()` vira retorno tipado (`tutor.service.ts:180`).
- **A S12 (4.0) e a D36 (C5).** `assunto_delicado` grava a mensagem fixa e o `atencao_humana` sempre que o `concluir`
  roda, mesmo descartando a saída: o sinal fica fora do `where estado = 'rodando'`, com chave única por execução.
- **A trava.** `PedidoDeExecucao` fica só com `aoGravar`, e um teste exige Command para toda `TarefaDeIa`, salvo
  `relatorio_da_correcao` (R23).
- **O prompt (C25).** Um teste fixa mensagens e hash de cada `PROMPT_*` contra a `versao`, e outro caracteriza "a entrega
  nasce `pendente`" antes de mover o `aoConcluir`.

### O contexto no worker (42.0 e 47.0)

- **A escola vem de `job_registro.escola_id`**, posta no contexto pelo executor (`executarNoContexto`); o payload leva só
  `execucaoId`. `lerParaExecutar(id)` filtra por `exigirEscolaDoContexto()`, e o `ExecucaoRepository` sai de
  `REPOSITORIES_SEM_ESCOPO` (R39), salvo `falharInterrompidas`.
- **A montagem.** Sem `sessaoId` no worker (`guarda-autenticacao.ts:54`): `papel` relido do `usuario`, `solicitadaPor`
  nulo dá `NAO_ENCONTRADO`, e vale `exigirUsuarioDoContexto()` (`contexto-da-execucao.ts:7`).

### T9 — a IA no worker (47.0)

- **A publicação.** `agendar` (`ia/agendador-de-execucoes.ts`) chama `enfileirarUmaVez` na transação, chave
  `execucaoId`, na `interativa` (Tutor), na `ferramenta` (ferramentas e `propor_ferramenta`) ou na `normal` (Analista).
- **O executor** vai a `@educa/nucleo/execucao-de-jobs` (R40). A entrada é `apps/api/src/main-worker.ts`, Nest sem HTTP:
  `worker-ia-1/2`, um pool por fila, e `worker-pdf-1` em `lote` (1).
- **O prazo sai do perfil (D9).** O `prazoMs` das três filas é 150 s, e o corte do perfil fica **estritamente abaixo**,
  para terminar marcada antes do `TEMPO_ESGOTADO`: `rapido` 60 s (pior caso 56 s), `padrao` 140 s (pior 136 s, 48.0). O `IA_EXECUCAO_TIMEOUT_MS` sai, e o seu invariante (`config-ia.ts:100`) vira o teste de prazo da §3.

### Filas separadas e a vaga por escola (47.0; C30, D10, R42)

- **A fila `ferramenta`** entra em `FILAS` (`shared/src/sistema/jobs.ts`), depois da `interativa`; a migration amplia os
  checks `job_registro_fila_valida` e `configuracao_operacional_vagas_validas` com `NOT VALID` e depois `VALIDATE
  CONSTRAINT`, sob `lock_timeout`, e `OPCOES_DO_POOL_POR_FILA` a recebe com o lock da interativa.
- **A vaga** é a de hoje, `vaga:{fila}:{escola}` no `vaga.lua`, com a escola de `job_registro.escola_id`: cada fila tem a
  sua, e o professor nunca ocupa a do Tutor. `VAGAS_ESCOLA_INTERATIVA` vai de 5 a 10 (R42) e `VAGAS_ESCOLA_FERRAMENTA` nasce com 4,
  ambas sobrepostas por `configuracao_operacional_escola.vagas`.
- **A conta, por réplica**, no pico de 10 escolas:

  | Fila | Carga por escola | Simultâneos | Pool por réplica |
  |---|---|---|---|
  | `interativa` | 0,75 turno/s × 6 s | 45 | 50 |
  | `ferramenta` | 1 ferramenta/min × 50 s + 4 propostas/min × 6 s | 12,3 (27 no pior caso de 136 s) | 20 |
  | `normal` | o Analista | ≤ 2 | 2 |

  Uma réplica sozinha segura o pico nominal; as duas, o pior caso. Por escola, a `ferramenta` usa 1,2 vaga (2,7 no pior
  caso) das 4. "1 ferramenta/min por escola" é premissa, sem fonte no `docs/infra.md` §3: a `FASE=sala` a confere e a
  47.0 a escreve lá.
- **O banco.** O job não segura conexão durante a chamada ao modelo. Pool 20 por `worker-ia`, 2 no `worker-pdf`: de 217 a
  259 conexões, e `POSTGRES_CONEXOES_MAXIMAS` de 250 a 300 (`tools/ci/compose.int.test.ts` soma).
- `IA_EXECUCOES_POR_ESCOLA` e `IA_EXECUCOES_TOTAL` (`.env.example:223-224`) dão lugar aos `WORKER_IA_POOL_*`. Mudam junto
  o `docs/infra.md` §5.3 e o `infra/compose.yml`, com a `VAGAS_ESCOLA_FERRAMENTA` no despachante e nos workers.

### A espera máxima e o alerta (47.0; C23, D11)

- O job da `interativa` que espera mais de 20 s termina sem modelo, com `IA_INDISPONIVEL`, sem contar a troca; a pergunta
  fica em `mensagem_tutor`, visível ao professor. O `assunto_delicado` nunca chega à fila: a checagem sem modelo roda
  antes (`tutor.service.ts:164`). A `ferramenta` não tem corte.
- Cada corte soma `ia.espera_estourada{escola_id}`, e `infra/grafana/alertas/ia-espera-estourada-por-escola.yaml` dispara
  com mais de 0 em 5 min. **O runbook separa:** uma escola só é escola grande (subir a `vagas.interativa` dela); várias
  é falta de capacidade (pool ou réplica, nunca a vaga). `alerta-tem-runbook.test.ts` cobra o parágrafo.
- O alerta de 30 s (`job-interativo-esperando.yaml`) passa a olhar também a `ferramenta`.

### O processador (47.0; C27, D12)

- `pendente → rodando` é `update … where estado = 'pendente'`; quem não pegou sai sem chamar o modelo.
- `rodando` é reentrega (stalled ~15 s): `falhou` com `EXECUCAO_INTERROMPIDA` (R39), sem modelo, fora do freio de 60
  trocas e de `job.falhos`.
- **O consumo da execução morta (C26).** A reentrega grava a linha `falhou` com a reserva estimada do `LimiteDeTokens`,
  pelo `RegistroDeConsumo` (`packages/nucleo/src/ia/consumo.ts`), se não há linha: superestima, nunca subestima (D14).
- Polling de 1 s (P7). **Trava:** o `AppModule` HTTP não provê `LLM_PROVIDER` nem `ExtratorDePdf`.

### Latência e carga (47.0; C31, D10)

- **O RF16** se mede na `FASE=base`, no build do pai e no da tarefa, na mesma sessão: p95 do turno ≤ base + 1 s.
- **A `FASE=sala`**, nova em `infra/k6/justica-entre-escolas.js`, roda só no build da tarefa, com a carga da tabela e
  latência por perfil: `IA_LATENCIA_FALSA_MS` = 6 s (`rapido`) e `IA_LATENCIA_FALSA_MS_PADRAO` = 50 s. Thresholds por escola: espera do Tutor p95 < 2 s,
  nenhum `IA_INDISPONIVEL`, espera da `ferramenta` p95 < 10 s. O relatório traz a espera por conexão do pool e o falso
  stalled das duas filas.
- **O `kill -9`** do `worker-ia-1` no meio da fase: os `EXECUCAO_INTERROMPIDA` saem de `respostas_inesperadas`
  (`justica-entre-escolas.js:281`) para um contador com teto igual aos jobs ativos da réplica, que o roteiro lê antes; os outros falhos seguem em 0, e o aluno vê "Tentar de novo" sem gastar a troca (`Tutor.tsx:124`).

## 3. Falha

| Caso | O teste |
|---|---|
| Worker morto | `kill -9`: `EXECUCAO_INTERROMPIDA`, linha estimada em `consumo_ia`, a próxima pergunta roda |
| Duplicado em corrida | barreira: a 1.ª `rodando` antes do `fetch`, a 2.ª a marca `EXECUCAO_INTERROMPIDA`; solta: um `fetch`, nada em `entrega`, a troca não conta |
| As duas leem `pendente` | barreira entre a leitura e o `update`: uma pega, a outra sai, um `fetch`. Mutação: tirar o `where estado = 'pendente'` |
| D36 descartada | `assunto_delicado` de execução já interrompida: a mensagem e um `atencao_humana`, sem duplicar na reentrega. Mutação: o sinal sob o `where estado = 'rodando'` |
| Avaliação abre no meio | `assunto_delicado`: mensagem e sinal ficam; outro turno sai sem contar |
| Duplicado depois | a segunda entrega acha `concluido` e sai: uma resposta, uma troca, uma linha |
| Usuário eliminado | depois do 202: `NAO_ENCONTRADO` |
| Pool do banco | chamada presa no adaptador: nenhuma conexão emprestada |
| Redis fora | `POST` do Tutor 202 (o job está no `job_registro`); o Redis volta e a resposta chega |
| Outra escola, repository | contexto A, `lerParaExecutar` com o id da B: vazio. Mutação: tirar o `escola_id` |
| Outra escola, job | job da A com o `execucaoId` da B: ela segue `pendente`, sem `fetch` nem `consumo_ia` |
| Fila cheia | relógio falso: `interativa` além de 20 s dá `IA_INDISPONIVEL`, sem troca, e `ia.espera_estourada` sobe; `ferramenta` com 21 s roda. Mutação: o corte em todas as filas |
| Filas separadas | 4 ferramentas rodando: a 5.ª espera, o Tutor da mesma escola roda, e a escola B segue com as suas 4; `vagas.ferramenta` da escola sobrepõe o padrão. Mutações: a ferramenta na `interativa`; a chave sem a escola |
| Alerta | `alertas.int.test.ts`: `ferramenta` esperando 30 s dispara `job-interativo-esperando` |
| Prazo por perfil | corte abaixo do pior caso de alguma `TarefaDeIa`, ou igual ou acima do `prazoMs` da fila dela: vermelho |
| Prompt | hash novo sem `versao` nova: vermelho |

## 4. Isolamento, dado pessoal, conformidade, carga

O §3 e `techspec.md` §6, §7b e §7c.

## 5. Tarefas

| # | Título | RF | Depende de | Veto | Porte |
|---|---|---|---|---|---|
| 42.0 | IA por Command registrado, no processo, com o prompt caracterizado | 16 | fim da onda 2 | tenancy, conformidade, llm | grande |
| 47.0 | IA no worker, prazo por perfil, Tutor e ferramenta em filas separadas, p95 + 1 s no máximo | 16, 17 | 42.0, 45.0, 48.0 | infra, tenancy, conformidade, llm | grande |

43.0, 45.0 e 47.0 não correm juntas.

## 6. Riscos

- **Dois workers na mesma fila** dariam `TIPO_DESCONHECIDO`: o `executor` (onda 1B) separa, e a 45.0 prova.
- **O disjuntor abrir sem falha real:** a chamada lenta é por perfil (`onda-3c.md`), e a `FASE=sala` mede com ele ligado.
