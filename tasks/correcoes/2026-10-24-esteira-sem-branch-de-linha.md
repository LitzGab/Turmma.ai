# Correção — a esteira roda no push das branches de linha e disputa a fila com a da spec

**Origem:** retro da X7, item M4 (`TODO.md`, "(X7, retro, M4) A esteira não roda no push das branches de linha"): na X7, do push ao veredito, mediana de 70 min e máximo de 4 h 26; um job esperou 3 h 38 por máquina, e 34 das 83 execuções eram das linhas.
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`, `infra-guardian`, `privacy-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: `infra-guardian` e `privacy-guardian` (e o `test-engineer`, de toda correção).
     O `revisor-geral` entra porque a correção toca `.github/` (passo 5 de `corrigir`). -->

## Sintoma

`.github/workflows/ci.yml` roda a esteira em todo push de `spec/**`, e a branch de uma linha (`spec/<func>--l<n>`, `tools/processo/linhas.ts`)
casa com esse padrão. Cada commit de tarefa da linha dispara as seis suítes no GitHub, e a spec recebe a soma das linhas no encontro e dispara
tudo de novo. As execuções das linhas e da spec disputam os mesmos runners: na X7 foram 34 das 83 execuções, e o veredito que o Orquestrador
espera (`tools/processo/esteira.ts`, que lê a branch da spec) chegou a levar 4 h 26 do push ao fim.

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

Desenho da D79, não falha de tarefa. O `on.push.branches` foi escrito antes de as linhas existirem como branch própria e continuou a valer
`spec/**` para todas. Quem lê o veredito é a branch da spec, e o que a linha quebra volta a aparecer lá, no encontro: a esteira da linha
repete o que a da spec vai rodar de qualquer jeito.

O nome da linha é sempre `<spec>--l<n>` (`branchDaLinha`, `linhas.ts:59`). O `contextoDe` (`linhas.ts:286`) só recusa rodar o comando do
processo numa branch com `--l` no nome; nada impede criar uma spec assim com `git`. O que sustenta o padrão `spec/**--l*` é a convenção
dos nomes de spec, que não levam `--l`: se alguém criar uma, a esteira dela não roda no push.

## Teste que reproduz

`tools/ci/esteira.test.ts` › `a branch de linha (spec/<func>--l<n>) não dispara a esteira no push, e a da spec e a da correção disparam`:
aplica `on.push.branches` do `ci.yml` real a cada ref com a regra de filtro do GitHub (na ordem, o padrão positivo inclui e o `!` exclui o que
já tinha entrado). Vermelho antes (`spec/harness--l1` entrava), verde depois. O caso de lista exata do primeiro `it` do arquivo muda junto.

## Correção

- `ci.yml`: `'!spec/**--l*'` logo depois de `'spec/**'` em `on.push.branches`, e o comentário do topo diz que a linha não dispara.
- `tools/ci/esteira.test.ts`: o caso novo, a lista exata do caso de `on.push` e os exemplos que usavam `spec/harness--l1` como push que roda.
- `.claude/rules/40-testes.md` ("A esteira"): o commit da tarefa vai à branch da linha e **não** dispara a esteira; ela roda no push da spec,
  que recebe a soma no encontro.

## Mutações

```mutacao
arquivo: .github/workflows/ci.yml
teste: tools/ci/esteira.test.ts › não dispara a esteira no push, e a da spec
-    branches: [develop, release, main, 'spec/**', '!spec/**--l*', 'correcao/**']
+    branches: [develop, release, main, 'spec/**', 'correcao/**']
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª), infra-guardian (1ª), test-engineer (1ª) | `tools/processo/esteira.ts:1-2` ainda diz "roda em todo push de `spec/**` e de `correcao/**`", sem a exceção da linha | Fora dos arquivos da correção (arquivo de processo que ela não toca). `TODO.md`: uma linha ao marcar a M4 como feita, para o próximo que mexer em `esteira.ts` ajustar o cabeçalho |
| revisor-geral (1ª), test-engineer (1ª) | `.claude/skills/corrigir/SKILL.md:102` (e a mesma frase no passo "Commit e push") diz que a esteira roda em todo push de `spec/**`; numa correção feita em linha ociosa ela só roda depois do encontro | Skill fora dos arquivos da correção. `TODO.md`, na mesma linha da M4 |
| infra-guardian (1ª), test-engineer (1ª) | O texto da D79 em `docs/decisoes.md` (~linha 1350) diz "todo push de `spec/**`" sem a exceção da linha | Texto de decisão só muda pela skill `registrar-decisao`, que não é uma correção de esteira. `TODO.md`, na mesma linha da M4 |
| test-engineer (2ª) | A frase nova da regra 40 (`.claude/rules/40-testes.md`, "A esteira") poderia citar, no formato "Checagem:" das outras regras, o teste que prova que o `segredo` é suíte exigida do portão local; ele próprio diz que não conferiu qual caso é | Só de documentação, e o caso que prova isso não foi localizado nesta rodada (`tools/processo/portao-local.test.ts` só tem o caso "não limpa o banco" para `segredo`). `TODO.md`, na mesma linha da M4: achar o teste de `suitesExigidas` e citá-lo |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-24 13:42:40 | 2026-10-24 13:43:22 | `privacy-guardian` | 1 | APROVADO | a2e108948ef8d1c94 |
| 2026-10-24 13:42:39 | 2026-10-24 13:43:39 | `infra-guardian` | 1 | APROVADO | a3c09284d4b21a388 |
| 2026-10-24 13:42:38 | 2026-10-24 13:43:41 | `revisor-geral` | 1 | APROVADO | aa1b538e5d30d6eac |
| 2026-10-24 13:42:37 | 2026-10-24 13:44:11 | `test-engineer` | 1 | APROVADO | a25c366331856326d |
| 2026-10-24 13:48:50 | 2026-10-24 13:49:11 | `revisor-geral` | 2 | APROVADO | af68e6b97894b2e5a |
| 2026-10-24 13:48:40 | 2026-10-24 13:49:16 | `test-engineer` | 2 | APROVADO | a694415373a24fccd |
| 2026-10-24 13:49:00 | 2026-10-24 13:49:26 | `infra-guardian` | 2 | APROVADO | aca5d8ff16efa9903 |
| 2026-10-24 13:49:10 | 2026-10-24 13:49:27 | `privacy-guardian` | 2 | APROVADO | a086639b1aa8b1a14 |
