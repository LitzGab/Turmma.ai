# Tarefa 5.0 — O quadro das linhas sob uma trava só, com a linha solta por comando e a base gravada

**Funcionalidade:** harness (X7) · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** grande

## Objetivo

O quadro só muda sob um `flock`, cada comando gravando a própria linha, sem a trava presa no `npm ci`; `abandonar <n>`
solta uma linha; e o `conferir` compara com a base gravada na abertura.

## Contexto necessário

- `techspec.md` §4 e §5(f), **Quadro**
- `prd.md` RF6, RF10, e o RF3 no que é quadro
- `cenarios.md` A: **RF3** (corridas do quadro e do `abrir`), **RF6**, **RF10**
- `.claude/rules/80-infra-e-carga.md` item 7
- Código: `tools/processo/linhas.ts` — `gravarQuadro`, `ocupada`, `abrir` (o `npm ci`), `partida`, `encontro`, `conferir`

## Subtarefas

- [ ] 5.1 — Trava (`flock` em `.processo/` da raiz do andar) que relê o quadro, muda uma linha e grava; quem espera tem
  prazo (7 min, injetável) e sai com "encontro em curso"; o encontro ganha um ponto de injeção sob a trava, que a 6.0
  usa para a verificação
- [ ] 5.2 — `abrir`: grava a linha ocupada e a base (a branch de onde a linha parte), solta a trava, roda o `npm ci`,
  pega a trava de novo e grava livre; falha do `npm ci` tira a linha e manda abrir de novo; prazo estourado na volta
  deixa ocupada e manda `abandonar <n>`
- [ ] 5.3 — `abandonar <n>` (RF6)
- [ ] 5.4 — `conferir` compara com a base gravada no quadro (RF10)
- [ ] 5.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/linhas.ts` | alterado |
| `tools/processo/linhas.test.ts` | alterado |

## Testes que provam a regra

O lint e o prazo do encontro ficam na 6.0.

| Cenário | Tipo | O que prova |
|---|---|---|
| dois encontros paralelos, o primeiro preso por arquivo-sinal | processo | o segundo espera; quadro final certo |
| `partida 2` durante o encontro da linha 1 | idem | 2 ocupada e 1 livre |
| quem espera além do prazo injetado | idem | sai com "encontro em curso" |
| linha 1 livre; `abrir 1` preso no `npm ci` | idem | `partida 2` termina; segundo `abrir 1` e `partida 1` recusados (linha em uso); `npm ci` roda uma vez |
| solto o sinal | idem | `abrir 1` sai 0; `partida 1` passa |
| `npm ci` falhando | idem | ≠ 0, manda abrir de novo; linha 1 fora; linha 2 intacta; novo `abrir 1` aceito |
| volta à trava com encontro da 2 preso | idem | `abrir 1` só termina depois do encontro: 0, ou ≠ 0 tirando a linha se o `npm ci` falhou |
| volta à trava com prazo injetado menor | idem | ≠ 0 mandando `abandonar 1`; linha ocupada; depois do `abandonar 1`, `abrir 1` aceito |
| RF6: `abandonar 2` | idem | 2 livre; branch fica; outras iguais |
| RF6: `abandonar 3` durante o encontro da 1 | idem | 3 fica livre e não volta |
| RF10: correção aberta de `spec/x` | idem | compara com `spec/x` |
| RF10: correção aberta da `develop` | idem | compara com a `develop` |

## Como testar

- Copiar `tools/processo/linhas.test.ts › partida, encontro e fechamento, em repositórios de verdade › o quadro diz quem parte, e a partida recusa o que não corre junto`, com o `andares()`.
- Paralelo: `spawn` de `node tools/processo/linhas.ts …`, comando injetado por variável de ambiente, que espera um arquivo-sinal (nunca `sleep` fixo); contador fora do checkout.
- RF10: copiar `conferir na branch da spec › aceita a correção que vem depois das tarefas da spec, que a develop ainda não tem`.
- "Não termina enquanto o encontro segura a trava": o `npm ci` injetado grava um marcador; o teste o espera, dá uma
  janela ao `abrir 1`, confere que não saiu e que a linha segue ocupada, e só então solta o encontro. No caso do prazo,
  solte o encontro **antes** do `abandonar 1`, que também pega a trava.
- Rodar: `npx vitest run --project unidade tools/processo/linhas.test.ts`.

## Fora do escopo desta tarefa

Tipagem, lint, prazo e grupo de processo do encontro (6.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Ao menos um bloco por cláusula do §5(f): gravar a linha livre sem a trava, tirar a linha sem a trava, liberar a
linha quando o prazo da espera estoura, e gravar a linha ocupada só depois do `npm ci`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
