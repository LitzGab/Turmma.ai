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

- [x] 3.1 — `ci.yml`: `pull_request` com `branches: [develop]`; `concurrency` com o grupo da §5(f) (ref em `spec/**` e
  `correcao/**` com `cancel-in-progress: true`; `pr-<número>` no PR; `run_id` em `develop`, `release`, `main` e
  `workflow_dispatch`); sem `pull_request_target` nem `secrets.`
- [x] 3.2 — `esteira.ts`: estado `superada` só para a cancelada com execução `push` mais nova na mesma branch; a
  superada não entra em `jobsVermelhos`; a sem sucessora é vermelha e cita o job
- [x] 3.3 — Saída real do `gh run list --json` e do `gh run view --json jobs` gravada em
  `tools/processo/__fixtures__/esteira/`, com uma cancelada por `timeout-minutes`
- [x] 3.4 — Testes

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
| O teste que dizia "cancelada é vermelha" (`estadoDaExecucao`, em `esteira.test.ts`) agora diz que a cancelada é um estado à parte, `cancelada`. Ela vira `vermelha` ou é descartada como superada em `execucoesQueValem`, que olha as outras execuções; `superada` não é estado guardado | O estado de uma execução não sabe se existe push mais novo; quem sabe é a lista | `techspec.md` §5(f), "Veredito (RF2)"; `cenarios.md` A, RF2 |
| O `gh run list` roda uma vez por evento do veredito, `push` e `workflow_dispatch`, cada um com o seu `--event`; o `pull_request` fica de fora | Só com `--event push`, a execução manual (o que o relatório manda disparar quando o push não gerou execução) não apareceria, e o fechamento da spec ficaria preso em "nenhuma execução"; o `gh` filtra por um evento só | `techspec.md` §5(f), "Veredito (RF2)"; `cenarios.md` A, RF2 (g) |
| O `cancel-in-progress` do `pull_request` é verdadeiro, e o da execução manual numa branch de spec é falso (o grupo dela é o `run_id`) | A Tech Spec dizia o grupo do PR mas não o cancelamento; o push novo no PR substitui a execução dele, e a manual não pode cancelar nem ser cancelada pelo push | `techspec.md` §5(f), "`concurrency`"; `cenarios.md` A, RF1 |
| Superada exige `criadaEm` estritamente maior que o da cancelada; o empate não supera | Sem desempate por id, o empate no mesmo segundo ficaria silenciosamente verde; vermelho por precaução é o lado seguro | `techspec.md` §5(f), "Veredito (RF2)"; `cenarios.md` A, RF2 (g) |
| O teste do `ci.yml` avalia as duas expressões do `concurrency` com um avaliador pequeno de lista fechada de nomes (`github.event_name`, `github.ref`, `github.run_id`, `github.event.pull_request.number`), e a regra "nenhuma expressão além da fatia" passou a aceitar exatamente essas duas | O grupo precisa de `${{ }}`; a lista fechada impede `head_ref`, título de PR e `secrets` (RF19) | `techspec.md` §5(f), "`concurrency`"; `cenarios.md` A, RF1 |

## Mutações

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › no pull request para a develop e na execução manual
 branches: [develop, release, main, 'spec/**', 'correcao/**']
-pull_request:
-  branches: [develop]
 # Execução manual: para reexecutar um commit sem precisar de outro push.
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › no pull request para a develop e na execução manual
 pull_request:
-  branches: [develop]
+  branches: ['**']
 # Execução manual: para reexecutar um commit sem precisar de outro push.
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › no pull request para a develop e na execução manual
 # Execução manual: para reexecutar um commit sem precisar de outro push.
-workflow_dispatch:
+workflow_dispatch:
+pull_request_target:
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o pull request tem o grupo
-group: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) && github.ref || github.run_id }}
+group: ${{ github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) && github.ref || github.run_id }}
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o grupo de concorrência cancela a execução superada
-group: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) && github.ref || github.run_id }}
+group: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/correcao/')) && github.ref || github.run_id }}
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o grupo de concorrência cancela a execução superada
-group: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) && github.ref || github.run_id }}
+group: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/')) && github.ref || github.run_id }}
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › têm o run_id como grupo
-group: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) && github.ref || github.run_id }}
+group: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) && github.ref || github.run_id }}
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › têm o run_id como grupo
-group: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) && github.ref || github.run_id }}
+group: ${{ github.event_name == 'pull_request' && format('pr-{0}', github.event.pull_request.number) || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) && github.ref }}
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o pull request tem o grupo
-cancel-in-progress: ${{ github.event_name == 'pull_request' || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) }}
+cancel-in-progress: ${{ github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) }}
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o grupo de concorrência cancela a execução superada
-cancel-in-progress: ${{ github.event_name == 'pull_request' || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) }}
+cancel-in-progress: ${{ github.event_name == 'pull_request' || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/correcao/')) }}
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › o grupo de concorrência cancela a execução superada
-cancel-in-progress: ${{ github.event_name == 'pull_request' || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) }}
+cancel-in-progress: ${{ github.event_name == 'pull_request' || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/')) }}
```

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › têm o run_id como grupo
-cancel-in-progress: ${{ github.event_name == 'pull_request' || github.event_name == 'push' && (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) }}
+cancel-in-progress: ${{ github.event_name == 'pull_request' || (startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/')) }}
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a execução superada não esconde o verde
 function foiSuperada(execucao: Execucao, todas: readonly Execucao[]): boolean {
  return (
-    execucao.estado === 'cancelada' &&
    todas.some(
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › push em outra branch, execução de pull_request ou manual
 todas.some(
  (outra) =>
-    outra.evento === 'push' &&
    outra.branch === execucao.branch &&
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › push em outra branch, execução de pull_request ou manual
 (outra) =>
    outra.evento === 'push' &&
-    outra.branch === execucao.branch &&
    outra.criadaEm.localeCompare(execucao.criadaEm) > 0,
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › push em outra branch, execução de pull_request ou manual
 outra.branch === execucao.branch &&
-    outra.criadaEm.localeCompare(execucao.criadaEm) > 0,
+    outra.criadaEm.localeCompare(execucao.criadaEm) >= 0,
 )
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a cancelada mais nova, sem push depois dela
 outra.branch === execucao.branch &&
-    outra.criadaEm.localeCompare(execucao.criadaEm) > 0,
+    outra.criadaEm.localeCompare(execucao.criadaEm) < 0,
 )
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o mesmo com o push mais novo ainda rodando
 return execucoes
-    .filter((execucao) => !foiSuperada(execucao, execucoes))
    .map((execucao): Execucao => (execucao.estado === 'cancelada' ? { ...execucao, estado: 'vermelha' } : execucao))
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a cancelada mais nova, sem push depois dela
    .filter((execucao) => !foiSuperada(execucao, execucoes))
-    .map((execucao): Execucao => (execucao.estado === 'cancelada' ? { ...execucao, estado: 'vermelha' } : execucao))
+    .map((execucao): Execucao => execucao)
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › só é verde a que terminou com sucesso
 if (execucao.status !== 'completed') return 'rodando'
-  if (execucao.conclusion === 'cancelled') return 'cancelada'
  return execucao.conclusion === 'success' ? 'verde' : 'vermelha'
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o fixture é o que diz ser
-export const CAMPOS_DA_EXECUCAO = 'databaseId,headSha,status,conclusion,createdAt,event,headBranch'
+export const CAMPOS_DA_EXECUCAO = 'databaseId,headSha,status,conclusion,createdAt'
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › uma chamada por evento do veredito
-export const EVENTOS_DO_VEREDITO = ['push', 'workflow_dispatch'] as const
+export const EVENTOS_DO_VEREDITO = ['push', 'workflow_dispatch', 'pull_request'] as const
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › uma chamada por evento do veredito
-export const EVENTOS_DO_VEREDITO = ['push', 'workflow_dispatch'] as const
+export const EVENTOS_DO_VEREDITO = ['push'] as const
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › uma chamada por evento do veredito
-  return ['run', 'list', '--workflow', 'esteira', '--branch', branch, '--event', evento, '--limit', '30', '--json', CAMPOS_DA_EXECUCAO]
+  return ['run', 'list', '--workflow', 'esteira', '--branch', branch, '--event', 'push', '--limit', '30', '--json', CAMPOS_DA_EXECUCAO]
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › uma chamada por evento do veredito
-  return ['run', 'list', '--workflow', 'esteira', '--branch', branch, '--event', evento, '--limit', '30', '--json', CAMPOS_DA_EXECUCAO]
+  return ['run', 'list', '--workflow', 'esteira', '--event', evento, '--limit', '30', '--json', CAMPOS_DA_EXECUCAO]
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a execução leva a branch e o evento
    criadaEm: execucao.createdAt,
-    branch: execucao.headBranch,
+    branch: 'spec/x',
    evento: execucao.event,
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a execução leva a branch e o evento
    branch: execucao.headBranch,
-    evento: execucao.event,
+    evento: 'push',
  }))
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a execução leva a branch e o evento
-    .filter((job) => job.conclusion !== 'success' && job.conclusion !== 'skipped')
+    .filter((job) => job.conclusion !== 'success')
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › os jobs da superada não entram
-  return situacao.tipo === 'vermelha' ? lerJobs(situacao.execucao.id) : []
+  return situacao.tipo !== 'sem-execucao' ? lerJobs(situacao.execucao.id) : []
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a cancelada mais nova, sem push depois dela
 export function situacaoDoFechamento(commits: readonly Commit[], todas: readonly Execucao[]): Situacao {
-  const execucoes = execucoesQueValem(todas)
+  const execucoes = todas
  const ateOCodigo = commits.findIndex((commit) => !commit.soDocumento)
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › a cancelada com push mais novo e concluído
 export function situacaoDaTarefa(commits: readonly Commit[], todas: readonly Execucao[]): Situacao {
-  const execucoes = execucoesQueValem(todas)
+  const execucoes = todas
  let rodando: Extract<Situacao, { tipo: 'rodando' }> | null = null
```

```mutacao
arquivo: tools/processo/esteira.ts
teste: tools/processo/esteira.test.ts › o commit só de documento vale pelo de código
 return execucoes
-    .filter((execucao) => !foiSuperada(execucao, execucoes))
 .map((execucao): Execucao => (execucao.estado === 'cancelada' ? { ...execucao, estado: 'vermelha' } : execucao))
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª), revisor-geral (1ª), test-engineer (1ª) | `foiSuperada` não separa a cancelada pelo `concurrency` da cancelada por prazo que só teve um push depois; a sucessora poderia contar só se o commit dela estiver em `commits` | Muda comportamento e a Tech Spec (§5(f), "Veredito (RF2)") aceita o limite. Destino: `/validar` (item pedido pelo test-engineer) e `/retro` |
| infra-guardian (1ª) | O `pull_request` para a `develop` roda a esteira duas vezes por push em branch de spec com PR aberto; conferir se a aprovação de workflow de quem contribui de fora continua ligada | Custo e configuração do repositório, não código desta tarefa. Destino: `/retro`; a conferência da configuração é do Joaquim |
| infra-guardian (1ª) | Enxugar `run-view-jobs-cancelada-por-prazo.json` (passos e URLs que o teste não lê) | Recusada: a subtarefa 3.3 pede a saída real do `gh run view --json jobs`, e o fixture é o que prova que o formato é o do `gh` |
| revisor-geral (1ª) | `tasks/prd-harness/tasks.md:26` ainda diz "Veredito com superada e `--event push`"; o texto certo é `push` e `workflow_dispatch`, uma chamada por evento | `tasks.md` é do Arquiteto e a tarefa não o toca; a divergência já está em "Divergências resolvidas". Destino: Arquiteto, na próxima edição de `tasks.md` |
| revisor-geral (1ª) | O passo de upload do traço roda em `failure() \|\| cancelled()`, e a execução superada em `spec/**` também sobe artefato | Destino: tarefa 4.0, que mexe nos artefatos |
| test-engineer (1ª) | Grupo de concorrência sem `github.workflow`: um segundo workflow com `github.ref` passaria a se cancelar com o `ci.yml` | Hoje há um só workflow. Destino: `/retro` ou nota na Tech Spec pelo Arquiteto |
| test-engineer (1ª) | Prazo escondido por um push mais novo: job que estoura o prazo toda vez só aparece quando é o último | É o que a Tech Spec decide. Destino: `/validar` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-23 16:41:55 | 2026-10-23 16:42:28 | `privacy-guardian` | 1 | APROVADO | a9af7ae1af81def99 |
| 2026-10-23 16:41:54 | 2026-10-23 16:42:52 | `infra-guardian` | 1 | APROVADO | afd00ce99977b3d7e |
| 2026-10-23 16:41:58 | 2026-10-23 16:43:29 | `revisor-geral` | 1 | APROVADO | a9f7ed11880b5f939 |
| 2026-10-23 16:41:57 | 2026-10-23 16:44:08 | `test-engineer` | 1 | APROVADO | a4b357894fb1698dc |
| 2026-10-23 16:59:49 | 2026-10-23 17:00:02 | `privacy-guardian` | 2 | APROVADO | a1bbab36850056700 |
| 2026-10-23 16:59:44 | 2026-10-23 17:00:05 | `infra-guardian` | 2 | APROVADO | a23c6a0896a5d014d |
| 2026-10-23 16:59:57 | 2026-10-23 17:00:17 | `revisor-geral` | 2 | APROVADO | aa186bcff10d88079 |
| 2026-10-23 16:59:53 | 2026-10-23 17:00:25 | `test-engineer` | 2 | APROVADO | aa96fdf25f94287d7 |
