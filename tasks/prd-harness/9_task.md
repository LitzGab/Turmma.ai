# Tarefa 9.0 — Tarefa de código sem mutação não recebe carimbo

**Funcionalidade:** harness (X7) · **Depende de:** 2.0, 7.0, 8.0
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Com produção alterada, o portão fica vermelho sem bloco de mutação nem a linha `**Sem mutação:** <motivo>`, e o hook
recusa o commit no mesmo caso; e o `mutacoes.ts --faltando` lista as linhas novas com condição que nenhum bloco alcança.

## Contexto necessário

- `techspec.md` §5(d)
- `prd.md` RF5, RF17
- `cenarios.md` seção A, **RF5**; seção B, **RF17**
- `.claude/rules/40-testes.md` (o portão da tarefa) — a frase do RF17 entra no texto da regra na 15.0
- Código: `tools/processo/mutacoes.ts` (`lerMutacoes`, `avaliarMutacoes`); `tools/processo/portao-local.ts`
  (`documentoDasMutacoes`, o bloco "As mutações do documento"); `tools/processo/portao.ts` (`avaliarPortao`, da 2.0);
  `tools/processo/sequencia-do-portao.ts` (da 8.0)

## Subtarefas

- [ ] 9.1 — Produção = arquivo de `apps/*/src/**` ou `packages/*/src/**` que não é teste nem `.d.ts`, pelo diff da árvore
  contra a base
- [ ] 9.2 — Portão: com produção alterada, sem bloco e sem `**Sem mutação:**` com motivo, vermelho; o documento é achado
  pela marca da tarefa
- [ ] 9.3 — `avaliarPortao`: a mesma exigência no commit; carimbo de outro documento não serve
- [ ] 9.4 — `mutacoes.ts --faltando <documento>`: linhas acrescentadas fora de teste com `if`, `&&`, `||`, `??`, ternário
  de valor, `case`, `.where(` ou expressão regular, sem bloco do mesmo arquivo que cite o texto; só imprime, sai 0; o
  portão imprime a lista
- [ ] 9.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/mutacoes.ts` | alterado |
| `tools/processo/mutacoes.test.ts` | alterado |
| `tools/processo/portao-local.ts` | alterado |
| `tools/processo/portao.ts` | alterado |
| `tools/processo/revisoes.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| RF17: produção alterada, documento sem bloco nem linha | unidade | portão vermelho |
| RF17: `**Sem mutação:**` vazio | unidade | vermelho |
| RF17: com motivo / com bloco | unidade | verde |
| RF17: só teste, `.d.ts` ou `apps/web/vite.config.ts` | unidade | não exige |
| RF17: documento achado pela marca, não por ter bloco | unidade | outro documento com bloco não serve |
| RF17 pela `avaliarPortao`, carimbo válido, produção no índice, sem bloco nem linha | unidade | recusado; com a linha, passa |
| RF17: carimbo do portão de outra tarefa | unidade | recusado |
| RF5: linha nova de produção com cada operador, sem bloco | unidade | listada, um caso por operador (`it.each`) |
| RF5: a mesma linha citada por um bloco do arquivo | unidade | não listada |
| RF5: linha nova em teste; linha só de import | unidade | não listada |
| RF5: `--faltando` | unidade | sai 0 nos dois casos |

## Como testar

- RF17 no commit: copiar `tools/processo/revisoes.test.ts › portão do commit › bloqueia sem carimbo do portão local, com carimbo velho, e com carimbo sem a suíte que a tarefa exige`.
- Carimbo e documento: `tools/processo/mutacoes.test.ts › o carimbo vale para as mutações como estão escritas agora › portão que não conferiu este documento, ou não conferiu mutação nenhuma, bloqueia`.
- RF5: o diff vem de função pura sobre o texto do `git diff -U0`; copie a leitura de `tools/ci/duracao-do-e2e.test.ts › linhasDoDiff: as linhas do arquivo novo que o diff tocou`.
- Rodar: `npx vitest run --project unidade tools/processo/mutacoes.test.ts tools/processo/revisoes.test.ts`.

## Fora do escopo desta tarefa

A tabela de guardiões (13.0); o texto da regra 40 (15.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
