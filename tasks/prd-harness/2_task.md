# Tarefa 2.0 — O `revisoes.ts` partido por responsabilidade, sem mudar comportamento

**Funcionalidade:** harness (X7) · **Depende de:** 1.0
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

O `revisoes.ts` de 1.400 linhas vira quatro módulos com uma responsabilidade cada, e o `revisoes.ts` só reexporta; o
`estado.ts` e o `esteira.ts` deixam de importá-lo. Nada muda de comportamento: é a base das tarefas 9.0 a 14.0, que
mudam a decisão do commit e precisam dela num lugar só.

## Contexto necessário

- `techspec.md` §2 (linha do `revisoes.ts`) e §5(a) (`decidirCommit` vai para `portao.ts`, na 10.0, não aqui)
- `prd.md` RF13
- `cenarios.md` seção B, **RF13**
- Código: `tools/processo/revisoes.ts` inteiro. A divisão:
  - `documento-de-revisao.ts`: veredito, rodada, seção Revisões, achados e índice (`describe` "veredito e tarefa do
    revisor", "seção Revisões", "achados separados por documento, com índice")
  - `caducidade.ts`: o que conta como alteração depois do portão e da rodada, comentário, merge em curso
  - `comando-git.ts`: ler do comando o commit, os arquivos, a árvore (`-C`, `cd`), o push do time
  - `portao.ts`: `avaliarPortao`, `portao`, `PASTAS_DE_CODIGO`, `PAPEIS_DO_TIME`
- Quem importa `revisoes.ts` hoje: `grep -rn "from './revisoes.ts'" tools/`

## Subtarefas

- [ ] 2.1 — Mover cada função e constante para o módulo dela, sem alterar corpo; `revisoes.ts` só reexporta
- [ ] 2.2 — `estado.ts` e `esteira.ts` importam do módulo novo, não do `revisoes.ts`
- [ ] 2.3 — `tools/processo/harness/particao.test.ts`: lê os imports de `estado.ts` e `esteira.ts` e acusa
  `./revisoes.ts`
- [ ] 2.4 — Testes: os atuais verdes **sem alteração** (o diff não toca `hook-portao.test.ts`; no `revisoes.test.ts`, só o
  caso "sem o compilador instalado" muda, e só o arquivo que ele copia e importa: `caducidade.ts` no lugar de `revisoes.ts`,
  com as asserções iguais; decisão do Joaquim, 23/10/2026, `prd.md` RF13)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/revisoes.ts` | alterado (só reexporta) |
| `tools/processo/documento-de-revisao.ts` | novo |
| `tools/processo/caducidade.ts` | novo |
| `tools/processo/comando-git.ts` | novo |
| `tools/processo/portao.ts` | novo |
| `tools/processo/estado.ts` | alterado (import) |
| `tools/processo/esteira.ts` | alterado (import) |
| `tools/processo/hook-revisoes.ts` | alterado, se importar algo movido |
| `tools/processo/harness/particao.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| `revisoes.test.ts`, `hook-portao.test.ts`, `estado.test.ts`, `esteira.test.ts`, `linhas.test.ts` sem alteração, salvo o arquivo copiado no caso "sem o compilador instalado" (2.4) | unidade | o comportamento não mudou |
| `estado.ts` com `import … from './revisoes.ts'` numa cópia | unidade | vermelho |
| quem contorna é acusado: `import('./revisoes.ts')` e `export … from './revisoes.ts'` | unidade | vermelho, um caso por forma |
| a guarda reprova quando o alvo dela não existe: `estado.ts` ausente na amostra | unidade | vermelho |
| o hook carrega: `hook-portao.test.ts › o hook do portão que não carrega bloqueia o Bash › hook são, Bash comum: sai 0 e não diz nada no stdout` | unidade | o comando real do `settings.json` continua de pé |

## Como testar

- Mova com o mínimo de edição: cortar e colar, e ajustar import. Diff de corpo de função é sinal de que mudou
  comportamento.
- Precedente da leitura de import: `tools/guardas/guardas.test.ts`, que lê arquivo e acusa por forma; aqui basta ler o
  texto dos dois arquivos com `readFileSync` e uma expressão por forma.
- Rodar: `npx vitest run --project unidade tools/processo/` (todos os testes do processo, que é o que prova a mudança).
- Armadilha: o hook roda **esta árvore** a cada Bash. Se ele quebrar no meio, conserte pelo Edit (não passa pelo hook),
  ou peça o socorro ao Joaquim (`techspec.md` §5c).

## Fora do escopo desta tarefa

`decidirCommit` (10.0); qualquer mudança de regra; o `separar-achados.ts`.

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Sem cláusula nova: a tarefa só move. Escreva aqui `**Sem mutação:** só move código, sem cláusula nova` e um bloco
para a guarda do `particao.test.ts`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
