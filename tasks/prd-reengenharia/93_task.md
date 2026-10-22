# Tarefa 93.0 — Frase de risco à vida de palavra que o lote retido mostrou escapar recebe a mensagem fixa e o sinal

**Funcionalidade:** reengenharia · **Depende de:** 2.0
**Subagentes obrigatórios:** `conformidade-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Os jeitos de dizer de palavra que escaparam no lote retido 1 passam a receber a mensagem fixa com o 188 e o sinal, sem
modelo, e as três pioras da 2.0 são desfeitas.

## Contexto necessário

- `onda-0.md` §2.1 ("Quem escreve o padrão não lê o `ouro`", "Estreitar e precisão") e §2.2a
- `docs/aia/ouro/README.md`: as categorias de `riscoAVida` e as decisões 1 a 7 e 5a
- `.claude/rules/70-conformidade-cne.md` (itens 4 e 7), D36 em `docs/decisoes.md`
- Código: `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`, `GATILHOS_DE_RISCO_A_VIDA` (:148) e `mencionaRiscoAVida` (:310)
- **Não abra** `docs/aia/ouro/*.json` nem `docs/aia/ouro-retido/`. O lote 1 está consumido, e o 2 mede esta tarefa

## O jeito de dizer que escapou (lote retido 1, sem as frases)

Escreva a sua `dev` para cada linha, com palavras suas:
- **explicita:** "morrer" como desejo ou merecimento fora de "quero/vou" ("eu devia", "preferia já ter", "minha vontade
  é"); "dar fim na própria vida"; "a data da minha morte".
- **giria_abreviacao:** eufemismo brasileiro (bater as botas, partir dessa pra melhor, virar estrelinha, virar presunto,
  ir de arrasta pra cima, dar game over ou logout da vida, "mrr"); inglês da internet (wanna die, kill myself, ending it,
  sewerslide, rope); "sui" abreviado; leetspeak com números no lugar de letras.
- **digitacao:** erro de tecla **no meio** de "matar/mato", "morrer", "suicídio", "acabar", "jogar" (letra trocada,
  invertida, faltando, dobrada), e não só no fim da palavra.
- **automutilacao_sem_corte:** queimar com isqueiro, esfregar até abrir ferida, apertar até ficar roxo, com "de propósito"
  ou "pra doer".
- **pergunta_sobre_o_meio:** quantidade fatal de um remédio nomeado; de que altura ou andar se cai sem sobreviver; qual
  veneno mata uma pessoa; qual remédio faz o coração parar.

**As três pioras da 2.0:** "suicídio" (substantivo) em primeira pessoa com verbo de desejo, que voltou a escapar; "carta
de suicídio" com erro de tecla na palavra; e "dose letal" numa pergunta de laboratório com o objeto escolar nomeado
(decisão 1), que passou a disparar. Esta última só se estreita se nenhuma `casa` do `ouro` v1 nem das `dev` se perde;
senão continua disparando, como a limitação (c) do `TODO.md` já diz, e a tarefa declara isso nas Divergências.

`indireta` e `risco_de_outra_pessoa` ficam para o modelo (94.0): não force padrão para plano, despedida ou "não existir".

## Subtarefas

- [ ] 93.1 — Um padrão por jeito de dizer acima, nas cinco categorias de palavra, cada um com a sua `dev` no `it.each`
- [ ] 93.2 — As três pioras desfeitas, cada uma com a sua `dev` (`casa` ou `nao_casa`)
- [ ] 93.3 — Testes: as `dev`, a regressão exata do `ouro` v1, o alvo e o piso de `assuntoDelicado`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` | alterado |
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Cada jeito de dizer tem a sua `dev` e recebe a mensagem de risco, sem modelo | unidade, `turno-do-tutor.test.ts` | tirar cada padrão novo (um bloco por padrão) |
| "suicídio" em 1ª pessoa com verbo de desejo volta a casar | unidade | o estreitamento de "suicídio" da 2.0 |
| "carta de suicídio" com erro de tecla casa | unidade | tirar a tolerância de tecla dessa palavra |
| "dose letal" com o objeto escolar nomeado não casa, e o turno é `normal` | unidade | tirar o estreitamento novo |
| O `ouro` v1 não perde nenhuma amostra, e o alvo e a precisão seguem | unidade, `ouro.test.ts` (sem editar) | padrão largo `/\bmorr\w*/` |
| `assuntoDelicado` não cai da base | unidade, `ouro.test.ts` (sem editar) | idem |
| Nenhuma `dev` é frase do `ouro` | unidade, teste de contenção (`:700`) | — |

Isolamento, concorrência e log não mudam (a regra é pura).

## Como testar

- Copie `turno-do-tutor.test.ts › risco à vida: um padrão por jeito de dizer… › cada jeito de dizer recebe a mensagem
  fixa de risco, sem modelo: $jeito` (`:681`): cada `dev` nova é uma linha de `JEITOS_DE_DIZER_RISCO_A_VIDA` (`:441`)
- A `nao_casa` nova: o caso de "suicídio na Revolução Francesa" do mesmo arquivo, com a sua frase
- Rodar: `npx vitest run --project unidade packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts packages/nucleo/src/ia/ouro.test.ts`
- Armadilhas da 2.0: procurar no `ouro` o id que o teste mostra é ler o `ouro`; sonda de revisor não vira `dev`;
  estreitar só onde o README diz `nao_casa`; o `ouro.test.ts` não muda aqui

## Fora do escopo desta tarefa

O modelo, `indireta` e `risco_de_outra_pessoa` (94.0); `ameaca_a_terceiro` (`TODO.md`); `conformidade/` (26.0); o lote retido 2.

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
