# Tarefa 19.0 — Skills de terceiro, papéis e metadados auditados e provados na esteira

**Funcionalidade:** harness (X7) · **Depende de:** 15.0, 18.0
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Cada skill de terceiro fica, sai ou carrega o conflito na primeira linha depois do frontmatter, conferido por teste; os
quatro papéis do time ganham critério de saída e entrega; a `status` e a `frontend-design` saem; e um teste do harness
deixa a esteira vermelha com metadado quebrado (skill, papel, `paths:`, comando de hook).

## Contexto necessário

- `techspec.md` §9
- `prd.md` RF23, RF24 (a parte dos papéis), RF30
- `texto.md`: **Skills de terceiro (RF23)** e **Auditoria e critério de saída (RF23, RF24)**
- `cenarios.md` seção C, **RF23**, **RF24** (papel sem critério, `status` citada) e **RF30**
- Arquivos: `skills-lock.json`; `.claude/skills/*/SKILL.md` (frontmatter); `docs/skills-de-terceiros.md` (15.0);
  `.claude/agents/arquiteto.md`, `implementador.md`, `mesa-de-revisao.md`, `validador.md`; `.claude/settings.json`
  (os comandos dos hooks); `docs/processo-licoes.md` (18.0)

## Subtarefas

- [ ] 19.1 — Auditoria das skills de processo e de terceiro (objetivo, escopo, conflito, redundância, desatualização,
  decisão), em tabela no `docs/processo-licoes.md`
- [ ] 19.2 — Sai `frontend-design` (pasta e `skills-lock.json`); as cinco do `texto.md` levam o conflito na primeira linha
  depois do frontmatter, igual ao `docs/skills-de-terceiros.md`
- [ ] 19.3 — Sai a skill `status`, e toda citação dela (`grep -rn "status" .claude/ CLAUDE.md` pelo nome da skill)
- [ ] 19.4 — Seção "Critério de saída" nos quatro papéis do time
- [ ] 19.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/skills/frontend-design/` | removido |
| `.claude/skills/status/` | removido |
| `skills-lock.json` | alterado |
| `.claude/skills/supabase-postgres-best-practices/SKILL.md`, `.claude/skills/vercel-react-best-practices/SKILL.md`, `.claude/skills/lgpd-brasil/SKILL.md`, `.claude/skills/playwright-best-practices/SKILL.md`, `.claude/skills/nestjs-best-practices/SKILL.md` | alterados |
| `.claude/agents/arquiteto.md`, `.claude/agents/implementador.md`, `.claude/agents/mesa-de-revisao.md`, `.claude/agents/validador.md` | alterados |
| `docs/processo-licoes.md` | alterado |
| `tools/processo/harness/metadados.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF23: skill da lista sem a linha de conflito, ou com texto diferente de `docs/skills-de-terceiros.md` | unidade | vermelho (acusa, não reaplica) |
| RF23: `frontend-design` no `skills-lock.json` | unidade | vermelho |
| RF23: as cinco com a linha | unidade | verde |
| RF24: papel do time sem a seção de critério de saída | unidade | vermelho |
| RF24: a skill `status` ainda citada | unidade | vermelho |
| RF30: skill sem `name` / sem `description` | unidade | vermelho, um caso cada |
| RF30: papel sem `model` / sem `tools` | unidade | vermelho, um caso cada |
| RF30: `paths:` que não casa com nada | unidade | vermelho |
| RF30: comando de hook apontando arquivo que não existe | unidade | vermelho |
| RF30: o repositório de hoje | unidade | verde, com contagem mínima |
| quem contorna é acusado: a linha de conflito na segunda linha depois do frontmatter | unidade | vermelho |

## Como testar

- Precedente: `tools/processo/harness/rotulos.test.ts` (1.0) e `revisores.test.ts` (18.0), que leem arquivo do repositório e de amostra em `mkdtempSync`.
- O frontmatter se lê com o `yaml` que o repositório já tem (`grep '"yaml"' package.json`); não escreva parser.
- Comando de hook: tirar de cada `command` do `settings.json` o caminho depois de `$CLAUDE_PROJECT_DIR/`.
- Rodar: `npx vitest run --project unidade tools/processo/harness/metadados.test.ts`.

## Fora do escopo desta tarefa

Remover o `separar-achados.ts`: espera o ok do Gabriel, já anotado no `TODO.md`.

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
