# Tarefa 21.0 — Uma skill de projeto aponta as receitas do guia, e a esteira prova que os caminhos existem

**Funcionalidade:** harness (X7) · **Depende de:** 16.0, 18.0, 19.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`
**Porte:** grande
<!-- Decisão do Joaquim, 23/10/2026. T, P e C: a skill aponta as receitas das regras 10, 20 e 70; o job (regra 80) fica
     com a revisão do `revisor-geral`, pelo teto de três. -->

## Objetivo

O agente acha pelo assunto a receita do guia, o exemplo e as travas, sem a receita em dois lugares; a esteira acusa
caminho que some e skill que se afasta do guia.

## Contexto necessário

- `techspec.md` §9, **Receitas (RF32)** e **O que conta como caminho**; `prd.md` RF32 e RF21; `cenarios.md` C, **RF32**
- `docs/guia-do-desenvolvedor.md` §5 a §7; D81
- `.claude/skills/executar-task/SKILL.md` (`## 1. Contexto`), `.claude/skills/criar-techspec/template.md` (§2), `CLAUDE.md` (mapa),
  `tools/processo/harness/caminhos.test.ts` (16.0), `metadados.test.ts` (19.0)

## Subtarefas

- [ ] 21.1 — `.claude/skills/receitas-de-codigo/SKILL.md`, como no §9 (`user-invocable: false`)
- [ ] 21.2 — Os quatro apontamentos do §9 (`executar-task`, modelo da Tech Spec, `CLAUDE.md`, guia)
- [ ] 21.3 — Se a extração da 16.0 está dentro do teste, vai para `tools/processo/harness/caminhos.ts` sem mudar o que
  devolve; o filtro do §9 fica no `receitas.test.ts`
- [ ] 21.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/skills/receitas-de-codigo/SKILL.md` | novo |
| `.claude/skills/executar-task/SKILL.md`, `.claude/skills/criar-techspec/template.md` | alterados |
| `CLAUDE.md`, `docs/guia-do-desenvolvedor.md` | alterados, uma linha cada |
| `tools/processo/harness/receitas.test.ts` | novo |
| `tools/processo/harness/caminhos.ts`, `tools/processo/harness/caminhos.test.ts` | só pela 21.3 |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| skill cita `apps/api/src/inexistente.ts` | unidade | vermelho |
| guia cita caminho inexistente na §5, §6, §7 | unidade | vermelho, um caso por seção |
| quem contorna é acusado: o inexistente com `./` ou entre aspas, na skill e no guia | unidade | vermelho, um caso por forma e lado |
| placeholder `apps/api/src/inexistente/<modulo>/x.ts` | unidade | vermelho |
| placeholder `apps/api/src/<modulo>/x.int.test.ts` | unidade | verde |
| glob que não casa nada | unidade | vermelho |
| `componentes/dialogos.tsx`, `guardas/log-sem-dado-pessoal`, `/v1/disciplinas` | unidade | fora da conferência, verde |
| exemplo fora da linha com `Exemplo:` da seção | unidade | vermelho |
| exemplo sem pasta da raiz | unidade | vermelho |
| linha sem exemplo | unidade | vermelho |
| linha sem trava | unidade | vermelho |
| linha que aponta `5.9` | unidade | vermelho |
| `### 5.x` sem linha | unidade | vermelho |
| trava fora da coluna "Trava" da §7 (a célula exata, com as crases) | unidade | vermelho |
| trava pela metade ("Lint") | unidade | vermelho |
| código por ` ``` `, por `~~~`, por recuo de quatro espaços | unidade | vermelho, um caso cada |
| skill com 61 linhas | unidade | vermelho |
| skill acima de 6.000 B | unidade | vermelho |
| `description` sem a palavra de um assunto | unidade | vermelho, um caso por assunto |
| skill sem a seção 11 da Tech Spec | unidade | vermelho |
| `## 1. Contexto` do `executar-task` sem o nome (em outra seção não vale) | unidade | vermelho |
| §2 do modelo da Tech Spec sem o nome | unidade | vermelho |
| `CLAUDE.md` sem `docs/guia-do-desenvolvedor.md` | unidade | vermelho |
| guia sem o nome da skill | unidade | vermelho |
| a guarda reprova quando o alvo dela não existe: guia ausente; guia sem §5 | unidade | vermelho, um caso cada |
| o repositório de hoje | unidade | verde: tantas linhas quantas `### 5.x`, pelo menos seis, cada uma com exemplo e trava; linhas da §7 contadas; caminhos conferidos na §5, §6, §7 e skill, cada contagem acima de zero e afirmada |

## Como testar

- Precedente: `tools/processo/harness/rotulos.test.ts › os modelos de hoje passam, e a conferência acha os rótulos e os
  nomes que espera` (verde com contagem) e `› pasta sem nenhum modelo: vermelho nos quatro, e nenhum rótulo achado`
  (alvo ausente); amostra em `mkdtempSync` com `cpSync`.
- A extração é a da 16.0; não reescreva.
- Rodar: `npx vitest run --project unidade tools/processo/harness/` (com o `metadados.test.ts` e a base fixa do RF20).
- Armadilha: o que faltar vai para o guia, não para a skill (RF21).

## Fora do escopo desta tarefa

Mudar as receitas do guia; as skills de terceiro (19.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
