# Tarefa 17.0 — O `/seguir` partido por passo e as paradas que viram aviso

**Funcionalidade:** harness (X7) · **Depende de:** 4.0, 6.0, 14.0
**Subagentes obrigatórios:** `conformidade-reviewer`
**Porte:** grande

## Objetivo

O Orquestrador lê, por tarefa, só o `SKILL.md` curto, o `protocolo.md` e o `passos/6-tarefa.md`, até 24 KB (hoje 41 KB);
o passo 6 traz na própria página o que usa em toda tarefa; e as paradas da D79 revista viram aviso no `/seguir`, na
`retro` e no `validador.md`.

## Contexto necessário

- `techspec.md` §9
- `prd.md` RF22 (a parte do `/seguir`), RF26, e RF9 (quando rodar o censo)
- `texto.md`: **`/seguir` e papéis** e **As paradas (revisão da D79)**
- `cenarios.md` seção C, **RF22** e **RF26**
- `docs/decisoes.md`, D79 (revista em 23/10/2026)
- Hoje: `.claude/skills/seguir/SKILL.md` 32.991 B (passo 6: 6.790 B; passo 3: 4.189; passo 9: 3.706) e `protocolo.md`
  7.922 B. Seções: 1 a 10 e "O `estado.md`"

## Subtarefas

- [ ] 17.1 — `SKILL.md` fica com o cabeçalho, um índice que cita cada `passos/*.md` e diz quando entrar nele, e os passos
  1, 2 e 5; os passos 3, 4, 6, 7, 8, 9, 10 e "O `estado.md`" vão para `.claude/skills/seguir/passos/`
- [ ] 17.2 — `passos/6-tarefa.md` autossuficiente: sem o que repete o protocolo; com o comando da limpeza, a abertura de
  linha, o reinício do par com `recruit --replace` e as saídas do encontro, inclusive a de código 5 (`VERIFICAÇÃO
  RECUSADA`, da 6.0), que pede a mesma correção na linha que o `CONFLITO`; sem mandar ler o passo 3, o 9 nem o `time.md`
- [ ] 17.3 — Paradas: viram aviso a proposta da retro que muda só skill, papel ou modelo de documento (salvo a que mexe na
  lista de um guardião com veto ou em `criar-tasks`, `revisar-tarefa`, `revisar-spec`) e a ressalva menor da validação;
  achado das regras 10, 20 e 70 nunca é menor. No `passos/7-…`, na `retro/SKILL.md` e no `validador.md`
- [ ] 17.4 — O passo de fechamento diz quando rodar `node tools/processo/esteira.ts --censo` e abrir correção (RF9)
- [ ] 17.5 — O `validar` lista os commits `Fora do processo:` com código da spec (recomendação da revisão da spec)
- [ ] 17.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `.claude/skills/seguir/SKILL.md` | alterado |
| `.claude/skills/seguir/passos/` (um arquivo por passo) | novos |
| `.claude/skills/seguir/protocolo.md` | alterado |
| `.claude/skills/retro/SKILL.md` | alterado |
| `.claude/skills/validar/SKILL.md` | alterado |
| `.claude/agents/validador.md` | alterado |
| `tools/processo/harness/seguir.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF26: os três acima de 24 KB (amostra) | unidade | vermelho |
| RF26: um dos três ausente | unidade | vermelho, um caso por arquivo |
| RF26: `6-tarefa.md` que manda ler o passo 3 / o passo 9 / o `time.md` | unidade | vermelho, um caso por termo |
| RF26: citar o passo 7 / o 8 / o 10 | unidade | verde, um caso por termo |
| RF26: `6-tarefa.md` sem o comando da limpeza / sem a abertura de linha / sem `recruit --replace` / sem `VERIFICAÇÃO RECUSADA` | unidade | vermelho, um caso por ausência |
| RF26: um `passos/*.md` que o índice do `SKILL.md` não cita | unidade | vermelho; todos citados, verde |
| RF26: o repositório depois da tarefa | unidade | abaixo do teto |
| RF22: `seguir/SKILL.md` com 500 linhas ou mais | unidade | vermelho |
| RF22: `passos/*.md` citado que não existe | unidade | vermelho |

## Como testar

- Sem precedente direto de teste sobre skill; o mais próximo é `tools/processo/estado.test.ts › lerEstado e os textos, do disco › lê do disco a validação, a revisão da spec, a retro e a marca do roadmap`, que lê arquivos de texto do repositório.
- Cada checagem é uma função sobre o texto (`(arquivos: Record<string, string>) => string[]`), rodada no repositório e numa amostra quebrada; contagem mínima: zero achados de arquivo é vermelho.
- Rodar: `npx vitest run --project unidade tools/processo/harness/seguir.test.ts`.
- Nada sai sem destino: cada parágrafo tirado do `SKILL.md` está num `passos/*.md` ou no protocolo.

## Fora do escopo desta tarefa

O diário do `executar-task` e as contradições (18.0); a limpeza vigiada e o `UserPromptSubmit` (20.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
