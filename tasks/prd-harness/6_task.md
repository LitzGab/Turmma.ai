# Tarefa 6.0 — O encontro roda tipagem e lint e recusa o vermelho sem avançar a spec

**Funcionalidade:** harness (X7) · **Depende de:** 5.0
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** grande

## Objetivo

Duas linhas verdes que juntas quebram a tipagem ou o lint não chegam à spec: o encontro verifica no checkout da linha,
depois do merge e antes do `--ff-only`, com prazo e grupo de processo próprio, e no vermelho desfaz tudo na ordem
certa.

## Contexto necessário

- `techspec.md` §5(f), item **Encontro (RF3)**, e §7c (a linha "Mutação travada": o jeito de matar o grupo é o mesmo)
- `prd.md` RF3
- `cenarios.md` seção A, **RF3**: as frases do lint, da verificação acima do prazo e do `npm ci` com o lock
- `.claude/rules/80-infra-e-carga.md`
- Código: `tools/processo/linhas.ts`, `encontro` (o `merge --no-edit`, o `--ff-only`, o push) e a trava da 5.0

## Subtarefas

- [ ] 6.1 — Depois do `merge --no-edit` da spec no checkout da linha: `npm ci` se o `package-lock.json` mudou, e
  `npm run typecheck` e `npm run lint`, com o comando injetável no teste
- [ ] 6.2 — Prazo de 3 min (6 com `npm ci`), em grupo de processo próprio; no vermelho ou no prazo, nesta ordem: o
  grupo morre (SIGTERM e, 5 s depois, SIGKILL), a linha volta ao commit de antes do merge, a trava é solta
- [ ] 6.3 — Saída: código próprio, spec parada, sem push, linha ocupada, e a frase de que a correção refaz o merge
- [ ] 6.4 — O prazo padrão de quem espera a trava (5.0) passa de 6 min mais 5 s
- [ ] 6.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/linhas.ts` | alterado |
| `tools/processo/linhas.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| duas linhas verdes que juntas quebram o lint | integração de processo | código de saída próprio; spec parada; linha no commit de antes do merge; sem push; linha ocupada; saída manda refazer o merge |
| as duas verdes que juntas passam | idem | a spec avança por `--ff-only` |
| lock alterado / lock igual | idem | `npm ci` roda antes / não roda |
| verificação acima do prazo injetado | idem | tratada como vermelha |
| quem pega a trava, logo que o `flock` retorna, lê a ref do HEAD direto do disco (worktree: `gitdir:`, diretório comum ou `packed-refs`) | idem | já é o commit de antes do merge: o reset veio antes de soltar |
| o neto que o comando injetado abriu | idem | morto (pid) quando a trava é pega |
| o neto ignora SIGTERM e escreve num arquivo versionado até o SIGKILL | idem | o checkout está limpo: matar veio antes do reset |
| o prazo padrão de quem espera | unidade | maior que 6 min + 5 s |

## Como testar

- Copiar `tools/processo/linhas.test.ts › partida, encontro e fechamento, em repositórios de verdade › duas linhas se encontram na spec: cada commit de tarefa chega inteiro, e a segunda traz a primeira`, e `› conflito de código para o encontro: nada muda, e o conserto custa só os arquivos em conflito` para o "nada muda".
- O comando de verificação é injetado (variável de ambiente): um script que sai 1 quando acha um marcador nos dois arquivos, e outro que abre um neto (`sh -c 'trap "" TERM; while :; do echo x >> versionado.txt; done' &`) e espera o arquivo-sinal.
- Rodar: `npx vitest run --project unidade tools/processo/linhas.test.ts`.
- Armadilha: ler o HEAD com `git` no teste de ordem dá corrida; leia o arquivo da ref.

## Fora do escopo desta tarefa

A trava e o quadro (5.0); a mutação com prazo (7.0), que só compartilha o jeito de matar o grupo.

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
