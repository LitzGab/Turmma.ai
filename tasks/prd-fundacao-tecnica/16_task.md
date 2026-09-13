# Tarefa 16.0 — Entrega "pelo menos uma vez" declarada, com chave de idempotência no processador

**Funcionalidade:** fundacao-tecnica · **Depende de:** 9.0
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`

## Objetivo

A fila deixa de prometer "executado uma única vez" e passa a declarar o que de fato garante:
entrega **pelo menos uma vez** (D49). Todo processador recebe a chave de idempotência do job
e a mesma chave em toda reexecução, e um teste prova que um efeito gravado com essa chave
não duplica quando o job roda de novo. O teste intermitente do pool do Postgres é corrigido.

Nasceu da auditoria de 13/09/2026, que achou quatro caminhos em que um job roda duas vezes:
- job reentregue a partir de `ativo`
- processador concluído antes de `concluir` falhar
- falso stalled com lock de 10 s
- reconciliação que republica um job `ativo`

No F5 isso seria chamada de IA paga em dobro, e no F13 aviso duplicado.

Rode antes da 11.0 se der: os processadores de consolidação e expurgo já nascem no contrato
novo.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `CLAUDE.md`: D49
- `docs/arquitetura.md`, seção "Assíncrono"; `docs/agentes.md`, "Requisitos de runtime"
- `techspec.md`: seção 5 ("Executar" e "Despachar", passo 5)
- `.claude/rules/80-infra-e-carga.md`, item 7: concorrência resolvida no banco, com
  restrição única ou chave de idempotência
- `.claude/rules/40-testes.md`: "job de correção executado duas vezes" é caso de borda
  obrigatório
- Código existente:
  - `apps/worker/src/executor.ts`: tipo `Processador`, linhas 18 e 148–160
  - `apps/worker/src/processadores/sintetico.ts`
  - `packages/nucleo/src/fila/job-registro.repository.ts`: `ORIGENS_DO_INICIO`
  - `apps/despachante/src/reconciliacao.ts`
  - `packages/nucleo/src/db/pool.int.test.ts`: linhas 116–140

As tarefas 7.0 a 10.0 estão concluídas e não são editadas. Esta tarefa muda o código delas
só no contrato do processador e no teste do pool.

## Subtarefas

- [ ] 16.1 — O tipo `Processador` passa a receber, além dos dados, a execução:
  `{ jobId, tentativa, chaveIdempotencia }`.
  - `chaveIdempotencia` é o id do job em `job_registro`, igual em toda tentativa, em toda
    reentrega pelo stalled e em toda republicação pela reconciliação.
  - O JSDoc do executor e a Tech Spec dizem "pelo menos uma vez", e os comentários e nomes de
    teste que falam em "exatamente uma vez" passam a falar do que o teste prova de fato (uma
    reserva por job, não uma execução).
- [ ] 16.2 — O processador sintético ganha um modo `efeito`, que grava uma linha numa tabela
  criada pelo próprio teste de integração, com restrição única na chave de idempotência e
  `on conflict do nothing`. É o exemplo de referência para os processadores do F4 em diante.
  Nenhuma migration nova.
- [ ] 16.3 — Corrigir o teste intermitente de `pool.int.test.ts` ("descarta a conexão
  encerrada pelo servidor no meio da consulta"). Hoje a promessa `consulta` só ganha
  tratador depois do `pg_terminate_backend`, e a rejeição pode chegar antes, gerando
  rejeição não tratada. A asserção `rejects` passa a ser montada antes do encerramento.
- [ ] 16.4 — `docs/runbook.md` ou comentário do executor explica, em uma linha, como
  reconhecer uma reexecução no log (mesmo `jobId`, tentativa diferente), sem dado pessoal.
- [ ] 16.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/worker/src/executor.ts` | alterado |
| `apps/worker/src/processadores/sintetico.ts` | alterado |
| `apps/worker/test/execucao.int.test.ts` | alterado |
| `apps/worker/test/reexecucao.int.test.ts` | novo |
| `packages/shared/src/sistema/jobs-sinteticos.ts` | alterado (modo `efeito`) |
| `packages/nucleo/src/db/pool.int.test.ts` | alterado |
| `tasks/prd-fundacao-tecnica/techspec.md` | alterado (seção 5) |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| concorrência: o worker é morto (`kill -9`) depois de o processador gravar o efeito e antes de `concluir`; o job volta e roda de novo → uma linha de efeito só | integração | quebra se a chave mudar entre tentativas ou se o efeito não usar a chave |
| concorrência: o Redis perde o job `ativo` e a reconciliação o republica enquanto a primeira execução ainda roda → uma linha de efeito só | integração | a republicação entrega a mesma chave |
| borda: falha transitória na 1ª tentativa e sucesso na 3ª → `chaveIdempotencia` igual nas três, `tentativa` 1, 2 e 3 | integração | a chave é do job, não da tentativa |
| borda: o teste do pool roda 20 vezes seguidas sem rejeição não tratada | integração | a correção do teste intermitente segura |
| isolamento: job da escola A reexecutado não grava efeito com escopo da escola B | integração | a reexecução restaura o contexto do job, não o da execução anterior |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Vetos aprovados (se aplicáveis)
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Trocar a fila por uma fila só no Postgres (descartado na D49). Os outros achados da
auditoria que não viraram decisão: renovação da vaga durante o recuo, devolução do ponto do
usuário no limitador, despachante serial. Idempotência de negócio de cada processador real,
que cada funcionalidade define no próprio PRD.
