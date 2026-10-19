# Correção — o encontro da linha 2 (tarefa 14.0, c2b9e34) deu conflito em aprovar.test.ts e roteiro-da-demonstracao.spec.ts com spec/telas-do-professor

**Origem:** encontro da linha 2 (`tools/processo/linhas.ts`), tarefa 14.0: o merge de `spec/telas-do-professor` na branch da linha parou em conflito.
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: frontend-reviewer e conformidade-reviewer, além do test-engineer que toda correção tem. -->

## Sintoma

`git merge spec/telas-do-professor` na linha 2 traz as tarefas já pousadas na spec (até a 10.0). Quase tudo junta sozinho; dois
arquivos não: `CONFLITO (conteúdo): Conflito de merge em apps/web/src/areas/professor/aprovar.test.ts` e
`CONFLITO (conteúdo): Conflito de merge em e2e/roteiro-da-demonstracao.spec.ts`, cada um num único bloco de `import`.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa antes do merge.

## Causa

As duas pontas mexeram nas mesmas linhas de `import`:

- `aprovar.test.ts`: a 14.0 (linha) trocou o `import` de `./aprovar` por uma lista maior (a faixa de números, as três abas, o
  endereço da correção); a 10.0 (spec) acrescentou um `import` de `./sinais` e deixou o de `./aprovar` na lista antiga, porque
  passou a testar os textos dos sinais do Tutor em Hoje.
- `roteiro-da-demonstracao.spec.ts`: a 14.0 passou a importar `abrirODestaque` e `fecharOPainel` de `professor/aprovar.ts`; a
  10.0 trocou o `import` de `professor/tutor.ts` por `abrirOPainelDoTutor`, `abrirSinaisDoTutor` e `painelDoTutor`.

O git devolve os dois lados com marcadores, e o resto dos dois arquivos já tinha juntado sozinho.

## Teste que reproduz

Não se aplica: é a resolução de um conflito de texto entre duas mudanças que já têm testes, sem comportamento novo. A prova é o
arquivo sem marcador, a tipagem da raiz e a do `e2e/` limpas, os testes de unidade da área do professor verdes isolados, além do
portão da tarefa sobre a árvore que o merge deixou.

## Correção

Mantidos os dois lados: em `aprovar.test.ts`, a lista longa de `./aprovar` (14.0) e o `import` de `./sinais` (10.0); em
`roteiro-da-demonstracao.spec.ts`, o `import` de `professor/aprovar.ts` (14.0) e o de `professor/tutor.ts` com os três nomes
(10.0). Os marcadores `<<<<<<<`, `=======` e `>>>>>>>` saíram. O merge se fecha com o commit `(correção encontro-14)`.

Rodada 1 (ordem `.processo/ordens/encontro-14-r1.md`): a `VOCABULARIO_PROIBIDO` da 14.0 ganhou `pódio` (D59,
`docs/interface.md` 10.2), igual à expressão que a 10.0 tinha escrita à mão no fim de `aprovar.test.ts`; o teste da 10.0 passou a
usar a constante, e há um caso novo que fixa que a lista pega cada uma das seis palavras. Nenhum texto das duas telas quebrou
com a palavra a mais.

## Mutações

```mutacao
arquivo: apps/web/src/areas/professor/aprovar.test.ts
teste: apps/web/src/areas/professor/aprovar.test.ts › a lista de palavras proibidas pega cada uma delas, o pódio inclusive
-const VOCABULARIO_PROIBIDO = /\bnotas?\b|\bconceitos?\b|pontua|\bmédia\b|ranking|pódio/i
+const VOCABULARIO_PROIBIDO = /\bnotas?\b|\bconceitos?\b|pontua|\bmédia\b|ranking/i
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | A aba Hoje rola a página a 1366 × 768 (924 px de altura). O RF22 do PRD (`tasks/prd-telas-do-professor/prd.md:62`) e o R10 de `docs/interface.md:602` pedem que a tela caiba na janela, e o mockup (`mockup.md:126`) desenha Hoje sem rolar. O defeito veio da outra ponta do merge (10.0) | `TODO.md`. Em `tasks.md` as tarefas 11.0 (Atividades), 12.0 (Alunos) e 13.0 (Convidar alunos) não tocam `TurmaHoje.tsx`, então nenhuma delas compõe Hoje: o `/validar` decide se vira correção. Não é da resolução do merge, que não o causou |
| frontend-reviewer (1ª) | "Voltar para a turma", na correção, leva sempre a Hoje; quem veio da lista de Atividades talvez esperasse voltar a `?aba=atividades`. Os e2e fixam o endereço sem aba (`e2e/professor-aprovar.spec.ts:59`) | `TODO.md`: muda comportamento e e2e, é tarefa à parte |
| frontend-reviewer (1ª) | A vitrine não conseguiu fotografar "Revisar a correção" nem a aba Atividades carregada (a aba saiu em "Carregando a aba…" e os links "Revisar a correção" e "Ver a correção" deram timeout na escola cheia, que não traz entrega pendente); o `/validar` deve fotografá-las com uma entrega pendente | `/validar` da spec |
| test-engineer (1ª) | Não rodou `e2e/roteiro-da-demonstracao.spec.ts`, que junta as duas pontas pela primeira vez; confirmar que rodou verde nos projetos `chromebook` e `celular` antes do commit da correção | Sem código a mudar: o carimbo do portão lista `e2e/roteiro-da-demonstracao.spec.ts` entre os alvos. Conferido depois do portão da rodada 1 (`chromebook` e `celular` verdes) e conferido de novo depois do portão desta |
| test-engineer (2ª) | O caso novo só confere a própria lista, não as telas. Ele seria mais firme com as formas que a tela de fato pode usar: "Pódio" com maiúscula, "notas" no plural e "pontuações". Hoje a lista já pega todas, mas nenhum teste fixa isso | Recusada, porque o revisor aprovou e a recomendação não é de quem reprovou nesta rodada. A lista já pega as três formas (flag `i`, `notas?` e o prefixo `pontua`), e a firmeza que importa é a dos três testes que passam os textos das telas pela lista, que o próprio revisor diz ter ficado mais forte |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 06:38:33 | 2026-10-19 06:39:00 | `conformidade-reviewer` | 1 | APROVADO | a4820920e38ac4982 |
| 2026-10-19 06:38:39 | 2026-10-19 06:39:06 | `test-engineer` | 1 | APROVADO | a877bda5c0b3361d8 |
| 2026-10-19 06:38:27 | 2026-10-19 06:40:52 | `frontend-reviewer` | 1 | APROVADO | a57bd6aa618adc189 |
| 2026-10-19 06:57:12 | 2026-10-19 06:57:44 | `test-engineer` | 2 | APROVADO | a1a5ee8f689e4f173 |
