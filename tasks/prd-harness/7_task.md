# Tarefa 7.0 — A mutação que trava sai no prazo e solta o ambiente

**Funcionalidade:** harness (X7) · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`
**Porte:** grande

## Objetivo

Uma mutação cujo teste passa do prazo é `recusada`, mata o grupo de processo inteiro (o neto inclusive), devolve o
arquivo e solta o `flock`; o prazo é medido pela corrida limpa, e não um número fixo.

## Contexto necessário

- `techspec.md` §7c, linha **Mutação travada**
- `prd.md` RF4
- `cenarios.md` seção A, **RF4**; o vocabulário (`vermelho`, `verde`, `recusada`) no topo do `cenarios.md`
- Código: `tools/processo/mutacoes.ts` — `conferirMutacoes`, `rodarCalado`, `comandoDoTeste`; o `testTimeout` do
  projeto vem do `vitest.config.ts`, e o do caso do próprio teste citado

## Subtarefas

- [ ] 7.1 — Corrida limpa medida; acima do teto de 10 min, falha dizendo isso, sem mutar
- [ ] 7.2 — Prazo da mutada: o maior entre 3 × a limpa, o `testTimeout` do projeto (ou o do caso) e 60 s, até 10 min;
  relógio e prazo injetáveis
- [ ] 7.3 — A corrida em grupo de processo próprio; no prazo, SIGTERM no grupo e, 5 s depois, SIGKILL; o bloco fica
  `recusada`; o arquivo volta; o `flock` é solto
- [ ] 7.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/processo/mutacoes.ts` | alterado |
| `tools/processo/mutacoes.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| (a) mutado que dorme além do prazo injetado de 2 s | integração de processo | sai no prazo, `recusada` |
| (b) o neto que o teste abriu | idem | morto (pid conferido) |
| (c) o arquivo mutado | idem | volta ao conteúdo de antes |
| (d) corrida limpa acima do teto | unidade | falha dizendo isso, sem mutar |
| (e) relógio injetado: limpa 1 s, mutado 61 s | unidade | `recusada` |
| (f) limpa 4 min: prazo 10 min, não 12; mutado de 11 min | unidade | `recusada` |
| mutado que falha rápido | unidade | `vermelho` |
| mutado que passa | unidade | `verde` |
| limpa 1 s, `testTimeout` 2 s, mutado falha em 5 s | unidade | `vermelho` (piso de 60 s) |
| limpa 1 s, projeto 5 s, caso declara 120 s, mutado falha em 90 s | unidade | `vermelho` (vale o do caso) |
| limpa 30 s, mutado falha em 80 s | unidade | `vermelho` (3 ×) |
| limpa 1 s, `testTimeout` 120 s, mutado falha em 90 s | unidade | `vermelho` |
| depois do prazo, segunda corrida | integração de processo | pega o `flock` |

## Como testar

- Copiar `tools/processo/mutacoes.test.ts › conferir as mutações: o teste tem de cair sem a cláusula, e o arquivo volta ao que era › restaura o arquivo mesmo quando a corrida do teste estoura` para (a) e (c), e `› vermelho com a cláusula fora é o que passa, e o teste vê o arquivo mutado` para o lado verde.
- O prazo vem de uma função pura (limpa, `testTimeout` do projeto, do caso) → ms: (e), (f) e os de `vermelho` testam essa função com relógio injetado, sem esperar de verdade.
- O neto: `sh -c 'sleep 600 & echo $! > pid; wait'`; confira com `process.kill(pid, 0)` lançando `ESRCH`.
- Rodar: `npx vitest run --project unidade tools/processo/mutacoes.test.ts`.

## Fora do escopo desta tarefa

`--faltando` e a exigência do RF17 (9.0).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
