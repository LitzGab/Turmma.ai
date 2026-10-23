# Tarefa 18.0 — Um fato num lugar só, e o `executar-task` sem diário

**Funcionalidade:** harness (X7) · **Depende de:** 17.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
**Porte:** grande
<!-- A tarefa edita o papel dos guardiões (blocos repetidos): marca os que cabem no teto de três; o `infra-guardian.md`
     fica preso pelo teste da lista "O que verificar" e do formato, que não mudam. -->

## Objetivo

As contradições listadas no `texto.md` deixam de existir, cada fato no lugar que fica; blocos que se repetem entre
revisores ficam idênticos, com teste; e o `executar-task` perde o diário de incidentes, que vai para
`docs/processo-licoes.md`, ficando abaixo de 500 linhas com a autoconferência no `task-template.md`.

## Contexto necessário

- `techspec.md` §9
- `prd.md` RF21, RF22 (a parte do `executar-task`)
- `texto.md`: **As contradições (RF21)** (a linha da pasta de adaptadores já foi feita na 16.0) e a frase sobre a
  autoconferência e os incidentes, em **`/seguir` e papéis**
- `cenarios.md` seção C, **RF21** e **RF22**
- Arquivos: `.claude/skills/executar-task/SKILL.md` (421 linhas); `.claude/agents/*-guardian.md`,
  `conformidade-reviewer.md`, `test-engineer.md`, `revisor-geral.md` (seções "O que verificar" e "Formato da resposta");
  `.claude/skills/corrigir/SKILL.md`, `revisar-tarefa/SKILL.md`, `vigia/SKILL.md`; `.claude/skills/criar-tasks/task-template.md`

## Subtarefas

- [ ] 18.1 — Antes de mexer: gravar a lista "O que verificar" e o bloco do formato de cada guardião com veto em
  `tools/processo/harness/__fixtures__/revisores-antes/`
- [ ] 18.2 — Cada linha da tabela de contradições resolvida no lugar que fica; nos outros, a frase sai ou aponta para lá
- [ ] 18.3 — Blocos repetidos entre revisores: um texto só, igual em todos
- [ ] 18.4 — `executar-task`: incidentes datados para `docs/processo-licoes.md`, com data e origem; a autoconferência vira
  até doze perguntas no `task-template.md`
- [ ] 18.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/skills/executar-task/SKILL.md` | alterado |
| `.claude/skills/criar-tasks/task-template.md` | alterado |
| `docs/processo-licoes.md` | novo |
| `.claude/agents/tenancy-guardian.md`, `.claude/agents/privacy-guardian.md`, `.claude/agents/conformidade-reviewer.md`, `.claude/agents/infra-guardian.md`, `.claude/agents/test-engineer.md`, `.claude/agents/revisor-geral.md` | alterados (só o que se repete) |
| `.claude/skills/corrigir/SKILL.md`, `.claude/skills/revisar-tarefa/SKILL.md`, `.claude/skills/vigia/SKILL.md` | alterados |
| `docs/decisoes.md` | alterado (D80, identidade visual) |
| `tools/processo/harness/revisores.test.ts` | novo |
| `tools/processo/harness/__fixtures__/revisores-antes/` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF21: dois blocos que deveriam ser idênticos, diferindo (amostra) | unidade | vermelho |
| RF21: "O que verificar" de um guardião com veto diferente do gravado | unidade | vermelho, um caso por guardião |
| RF21: o formato de um guardião com veto diferente do gravado | unidade | vermelho |
| RF21: os blocos de hoje, depois da tarefa | unidade | iguais |
| RF22: `executar-task/SKILL.md` com 500 linhas ou mais | unidade | vermelho |
| RF22: o arquivo depois da tarefa | unidade | abaixo de 500, e `docs/processo-licoes.md` existe |
| a guarda reprova quando o alvo dela não existe: guardião ausente na amostra | unidade | vermelho |
| `task-template.md` continua com os rótulos da 1.0 | unidade | `rotulos.test.ts` verde |

## Como testar

- Sem precedente direto; o mais próximo é `tools/processo/harness/rotulos.test.ts` (1.0), que lê modelo do disco e compara com constante.
- O "antes" é gravado **antes** de editar e nunca regenerado depois; o teste compara bloco por bloco.
- Rodar: `npx vitest run --project unidade tools/processo/harness/`.
- Armadilha: os incidentes vão com data e origem, nada sai sem destino.

## Fora do escopo desta tarefa

O `/seguir` (17.0); as skills de terceiro e os papéis do time (19.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
