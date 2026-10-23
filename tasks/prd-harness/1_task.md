# Tarefa 1.0 — Os rótulos que o hook lê ficam provados nos modelos, e o papel chega ao Bash

**Funcionalidade:** harness (X7) · **Depende de:** nenhuma
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Um rótulo que o hook ou o `estado.ts` leem, tirado de um modelo de documento, deixa a esteira vermelha dizendo qual; e
fica provado, numa sessão real, que `CLAUDE_CODE_AGENT` chega ao Bash do papel e do subagente, a premissa do hook
nativo (11.0).

## Contexto necessário

- `techspec.md` §1 (trilha 1), §10 e §12 (a primeira premissa)
- `prd.md` RF12
- `cenarios.md` seção B, **RF12**
- Código: `tools/processo/revisoes.ts` (`REVISORES_COM_VETO`, `REVISORES_SEM_VETO`, `PAPEIS_DO_TIME` e as expressões
  que leem `**Subagentes obrigatórios:**`, `Revisões:`, `## Mutações`); `tools/processo/estado.ts` (`lerPorte`,
  `lerDependencias`, `lerParalelismo`, `lerValidacao`): cada rótulo que eles procuram
- Modelos: `.claude/skills/criar-tasks/task-template.md`, `.claude/skills/criar-tasks/tasks-template.md`,
  `.claude/skills/validar/template.md` e o bloco do formato em `.claude/skills/revisar-spec/SKILL.md`

## Subtarefas

- [ ] 1.1 — Exportar, de `revisoes.ts` e `estado.ts`, como constante, cada rótulo que hoje está só dentro de uma expressão
  regular, sem mudar o que a expressão casa
- [ ] 1.2 — `tools/processo/harness/rotulos.test.ts`: cada rótulo exportado existe no modelo onde ele é escrito; cada
  nome de revisor citado em `task-template.md` está em `REVISORES_COM_VETO`, em `REVISORES_SEM_VETO` ou é o
  `revisor-geral`
- [ ] 1.3 — Prova da premissa: numa sessão `claude --agent implementador`, rodar `printenv CLAUDE_CODE_AGENT` no Bash
  e, dentro dela, num subagente (`revisor-geral`). Copiar as duas saídas para a seção "Prova da premissa" abaixo. Se
  uma vier vazia, parar: é divergência da Tech Spec (§12), e a 11.0 depende dela
- [ ] 1.4 — Testes

## Prova da premissa

Preenchida por quem implementa (1.3).

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/harness/rotulos.test.ts` | novo |
| `tools/processo/revisoes.ts` | alterado (só exporta constantes) |
| `tools/processo/estado.ts` | alterado (só exporta constantes) |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| um rótulo tirado de cada um dos quatro modelos, numa cópia em pasta temporária | unidade | vermelho, com o rótulo e o modelo |
| nome de revisor inventado num `task-template.md` de amostra | unidade | vermelho |
| os modelos de hoje | unidade | verde, com contagem mínima de rótulos achados (zero achados é vermelho) |
| quem contorna é acusado: o rótulo com outra caixa ou sem os asteriscos | unidade | vermelho |
| a guarda reprova quando o alvo dela não existe: modelo ausente | unidade | vermelho |

## Como testar

- Precedente: `tools/processo/estado.test.ts › lerTarefas e dependências › lê a coluna "Pode correr em paralelo com", que é a autorização do Arquiteto` — monta texto de `tasks.md` à mão; aqui o texto vem do modelo lido do disco, e a amostra quebrada é cópia em `mkdtempSync`.
- A lista de rótulos vem das constantes importadas, nunca redigitada no teste.
- Rodar: `npx vitest run --project unidade tools/processo/harness/rotulos.test.ts`.
- A 1.1 não muda comportamento: `revisoes.test.ts` e `estado.test.ts` passam sem alteração.

## Fora do escopo desta tarefa

Partir o `revisoes.ts` (2.0); o hook nativo (11.0); os outros testes do harness (15.0, 16.0, 19.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
