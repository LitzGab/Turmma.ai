# Tarefa 3.0 — A esteira cancela a superada sozinha e não chama a cancelada de vermelha à toa

**Funcionalidade:** harness (X7) · **Depende de:** 2.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`
**Porte:** pequeno

## Objetivo

Em `spec/**` e `correcao/**`, o push novo cancela a execução anterior da mesma branch; a esteira roda também no
`pull_request` para a `develop`; e o `esteira.ts` trata a cancelada com sucessora `push` na mesma branch como superada,
e a cancelada sem sucessora, por prazo inclusive, como vermelha, citando o job.

## Contexto necessário

- `techspec.md` §5(f), itens **`concurrency`** e **Veredito (RF2)**
- `prd.md` RF1, RF2, RF19
- `cenarios.md` seção A, **RF1** e **RF2**; seção B, **RF19**
- `.claude/rules/80-infra-e-carga.md`
- Código: `.github/workflows/ci.yml` (o `on:` e o topo); `tools/processo/esteira.ts` (`execucaoDe`, `situacaoDaTarefa`,
  `situacaoDoFechamento`, `estadoDaExecucao`, `relatorioDaEsteira`, e a chamada ao `gh run list`, que ganha
  `--event push`)

## Subtarefas

- [ ] 3.1 — `ci.yml`: `pull_request` com `branches: [develop]`; `concurrency` com o grupo da §5(f) (ref em `spec/**` e
  `correcao/**` com `cancel-in-progress: true`; `pr-<número>` no PR; `run_id` em `develop`, `release`, `main` e
  `workflow_dispatch`); sem `pull_request_target` nem `secrets.`
- [ ] 3.2 — `esteira.ts`: estado `superada` só para a cancelada com execução `push` mais nova na mesma branch; a
  superada não entra em `jobsVermelhos`; a sem sucessora é vermelha e cita o job
- [ ] 3.3 — Saída real do `gh run list --json` e do `gh run view --json jobs` gravada em
  `tools/processo/__fixtures__/esteira/`, com uma cancelada por `timeout-minutes`
- [ ] 3.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.github/workflows/ci.yml` | alterado |
| `tools/processo/esteira.ts` | alterado |
| `tools/processo/esteira.test.ts` | alterado |
| `tools/processo/__fixtures__/esteira/` | novo |
| `tools/ci/esteira.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF1: grupo avaliado para `spec/x` e `correcao/x` dá a ref, com `cancel-in-progress: true` | unidade | cancela a superada |
| RF1: grupo para `develop`, `release`, `main`, `workflow_dispatch` dá o `run_id` | unidade | nunca cancela nem enfileira |
| RF1: PR dá `pr-<número>`, com `cancel-in-progress` escrito | unidade | |
| RF1/RF19: sem `pull_request_target` nem `secrets.`; `pull_request` com `branches: [develop]` | unidade | |
| RF2 (a): cancelada mais nova sem sucessora, job `cancelled` por `timeout-minutes` | unidade | vermelha, citando o job |
| RF2 (b): vermelha mais nova que uma verde | unidade | vermelha |
| RF2 (c): cancelada com `push` mais novo na mesma branch, concluído | unidade | superada; vale o mais novo |
| RF2 (d): o mesmo com o mais novo rodando | unidade | `rodando` |
| RF2 (e): jobs da superada | unidade | fora de `jobsVermelhos` |
| RF2 (f): commit só de documento | unidade | vale o de código |
| RF2 (g): sucessora em outra branch, ou de `pull_request` | unidade | não supera |

Os casos (c) a (e) rodam em `situacaoDaTarefa` e em `situacaoDoFechamento`.

## Como testar

- RF1: copiar `tools/ci/esteira.test.ts › esteira do GitHub (.github/workflows/ci.yml) › roda em todo push nas branches integradoras e nas de spec e de correção, e só em push ou execução manual`; a expressão do `group` é avaliada ref a ref por uma função pequena no teste, e não comparada como texto.
- RF2: copiar `tools/processo/esteira.test.ts › a execução que vale para um commit › só é verde a que terminou com sucesso: cancelada e com falha são vermelhas, e a que não terminou está rodando`, lendo as execuções do `__fixtures__/esteira/`.
- Rodar: `npx vitest run --project unidade tools/processo/esteira.test.ts tools/ci/esteira.test.ts`.
- O teste que dizia "cancelada é vermelha" muda: diga isso em "Divergências".

## Fora do escopo desta tarefa

O censo e o artefato JSON (4.0); a terceira camada no job `verificar` (12.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
