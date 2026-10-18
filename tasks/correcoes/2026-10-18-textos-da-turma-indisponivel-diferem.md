# Correção — o e2e que compara o texto das três turmas indisponíveis lê o `main` inteiro, e o sino "Esperando você" (tarefa 1.0) mora nele e carrega em outro instante em cada abertura

**Origem:** esteira run 39129521729, em `93e787e` (job e2e 1/6): `e2e/acesso-da-turma.spec.ts:418` `[chromebook]`, `expect(new Set(textos).size).toBe(1)`, esperava 1 e recebeu 2.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. A correção altera 1 arquivo fora de `tasks/`: abaixo do limite do `revisor-geral`. -->

## Sintoma

No caso "a turma abre pelo cartão do vínculo confirmado, e só por ele…", as três aberturas por endereço (turma com o vínculo
pendente, turma com o vínculo encerrado, turma que não existe) guardam `principal(page).innerText()` e exigem que os três
textos sejam iguais. No `chromebook` (a partir de 768 px) dois textos diferem.

## Fora desta correção

Nada: a árvore estava limpa ao receber o pedido.

## Causa

A tarefa 1.0 (`cb209b5`) pôs o sino "Esperando você" na âncora da casca, que no computador (a partir de 768 px) fica **dentro de
`main`**. Ela corrigiu a asserção de "nenhum botão" (o sino não é botão da tela da turma), mas não a comparação do fim do
laço, que junta `principal(page).innerText()` das três aberturas e exige um texto só. O texto do sino não é o da tela: no
botão entram "Esperando você" e o contador, e o contador só desenha com item (`Contador`, `n > 0`). A fila do sino lê os
vínculos por conta própria (`useFilaDoProfessor`) e, para esta professora, a turma de vínculo pendente vira o item "confirme
a sua turma". Em cada `page.goto` a leitura termina em um instante: a asserção espera só o aviso da turma, e o `innerText` sai
com o sino ainda sem contador ou já com ele. Dois textos diferentes e `Set` de tamanho 2. No `celular` o sino mora na barra de
topo, fora de `main`, e o caso passa.

É intermitente por isso: a leitura que ganha a corrida decide. Rodado sozinho no `chromebook`, o caso passou na primeira
tentativa e falhou na esteira (run 39129521729).

A falha é do teste, e não da tela: a tela da turma indisponível é a mesma nos três endereços (o aviso, o link, nenhum nome), e é
isso que a comparação quer provar. O sino é outra peça, com testes próprios (`sino-por-area.test.tsx`).

## Teste que reproduz

O caso `a turma com o vínculo pendente responde com o aviso da turma indisponível, igual às outras, com o sino ainda carregando`
(e os dois irmãos, `… com o vínculo encerrado …` e `… que não existe …`, com o sino já lido), no projeto `chromebook`. Para o
vermelho não depender de sorte, o caso do endereço pendente **segura a leitura dos vínculos** (`GET /v1/meus-vinculos`) e o sino
diz "Esperando você, carregando"; os outros dois deixam a leitura terminar. Com a comparação antiga (`innerText` de `main` nos
três endereços, no mesmo caso), o `chromebook` ficou vermelho de forma determinística: `expect(new Set(textos).size).toBe(1)`,
esperava 1 e recebeu 2; o `celular` ficou verde, como na esteira. Depois da correção, verde nos dois projetos.

## Correção

Só teste, em `e2e/acesso-da-turma.spec.ts`; o código da web não muda.

1. **A comparação**: o texto de `main` sem o sino (`textoDaTelaSemOSino`: o `main` clonado, sem o botão "Esperando você"), que é o que
   o caso sempre quis comparar. Cada um dos três endereços é igual a `TELA_DA_TURMA_INDISPONIVEL`, escrito por extenso, o que
   implica serem iguais entre si e, de quebra, fixa o que a tela diz.
2. **A divisão do caso, exigida pelo portão da tarefa.** O caso único `W4 › a turma abre pelo cartão do vínculo confirmado, …`
   levava 61 s no `chromebook` e 66 s no `celular`, e o portão reprova caso de e2e **alterado** que passa de 15 s
   (`tools/ci/duracao-do-e2e.ts`). Tocar nele pedia dividi-lo (decisão do Orquestrador, pedido de retomada de 18/10/2026: o
   caso tem `test.slow()` e levou 72 s no runner, folga curta; não há liberação de duração). Ficaram oito casos, cada um do seu
   cenário, e nenhuma asserção do caso original foi tirada:

   | Caso novo | Asserções do caso original que leva |
   |---|---|
   | a turma abre pelo cartão do vínculo confirmado, e só por ele | os cartões (confirmar, contestado, encerrado), o alvo de toque e o axe da lista, a turma aberta (endereço, título da aba, `h1`, série, as duas abas) e "Turmas" selecionado |
   | carregando; "Sem acesso ativo"; o diálogo do primeiro acesso | o carregando, o vazio com um Gerar só, o axe, o diálogo (foco, texto, três validades, 7 dias, sem acesso no banco) |
   | o erro logo depois de gerar | o gerar com 7 dias, o erro na releitura, o foco no título, o código cru ausente, o axe, o "Tentar de novo" |
   | com dado, só a validade | "Vale até", as duas ações, link e código fora do DOM, um acesso vigente, largura e axe |
   | o erro na primeira leitura | o erro com a página aberta já sem leitura, sem afirmar acesso nem falta dele, e "Tentar de novo" |
   | a turma que não chega | o erro no lugar da tela, sem a seção, o link de volta, e a turma que volta com o acesso |
   | os três endereços indisponíveis (três casos) | o aviso, nenhum nome de turma, nenhuma seção de acesso, nenhum botão, o título da aba, o foco, o axe e o "Voltar para Turmas" |

   O que a divisão muda no meio, e é dito aqui: (a) a professora entra pela API (`abrirJaEntrando`, o cookie fica na aba) e abre o
   endereço direto, porque no Chromebook de teste (CPU ×4, Fast 3G) cada carga de página leva uns 7 s e a entrada pela tela era
   metade do prazo; a entrada pela tela continua provada nos outros casos do arquivo e em `casca.spec.ts`; (b) a leitura que falha
   já falha na primeira carga, no lugar de falhar depois de um `reload`; (c) o acesso que "Erro na primeira leitura" e "A turma que
   não chega" exigiam é semeado no banco (`gerarAcessoNoBanco`), e o "com dado" gera pela tela, para o token e o código seguirem
   provados fora do DOM.

## Mutações

A primeira só fica vermelha no `chromebook`, que é o projeto em que o bloco roda: no `celular` o sino mora na barra de topo, fora de
`main`, e a comparação não o via. Ela vem antes da do `Sino.tsx` porque esta deixa a imagem da web mutada, e a linha de base da
seguinte quebraria.

```mutacao
arquivo: e2e/acesso-da-turma.spec.ts
teste: e2e/acesso-da-turma.spec.ts › a turma com o vínculo pendente responde com o aviso da turma indisponível, igual às outras, com o sino ainda carregando
-    copia.querySelectorAll('button[aria-label^="Esperando você"]').forEach((sino) => sino.remove())
```

```mutacao
arquivo: apps/web/src/componentes/sino/Sino.tsx
teste: e2e/acesso-da-turma.spec.ts › a turma com o vínculo pendente responde com o aviso da turma indisponível, igual às outras, com o sino ainda carregando
-  if (situacao === 'carregando') return 'Esperando você, carregando'
+  if (situacao === 'carregando') return 'Esperando você, aguarde'
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-18 13:37:52 | 2026-10-18 13:38:38 | `frontend-reviewer` | 1 | APROVADO | a03fc210e78ae980a |
| 2026-10-18 13:37:55 | 2026-10-18 13:39:52 | `test-engineer` | 1 | APROVADO | ac4e33ae6f1d94735 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer 1ª | `TELA_DA_TURMA_INDISPONIVEL` vem de `textContent` sem espaço ("Voltar para TurmasTurma…"), frágil a espaço novo no markup | Recusada: o erro do `toBe` mostra exatamente o que mudou, e trocar para `innerText` traz de volta a diferença do sino que esta correção tira |
| frontend-reviewer 1ª | o texto de `main` incluiria conteúdo `sr-only`, se existisse | Recusada: hoje não existe fora do sino, que sai antes da comparação; o `textContent` é de propósito |
| frontend-reviewer 1ª | não rodou o e2e; duração dos casos novos (15 s) fica para o portão e a esteira | Sem ação: é o portão da tarefa que mede |
| test-engineer 2ª | no caso da primeira leitura, guardar o `expiraEm` que `gerarAcessoNoBanco` devolve e conferir a data exata, no lugar de `'Vale até'` solto | Recusada: o caso prova que o "Tentar de novo" traz a validade; a data exata já é provada no caso "com dado". Reabrir o spec por isso caduca de novo os revisores |
| test-engineer 2ª | uma linha na seção "Mutações" dizendo que a mutação de `textoDaTelaSemOSino` só fica vermelha no `chromebook` (no `celular` o sino mora fora de `main`) | Aplicada ao commitar, no próprio documento (a linha da seção "Mutações") |
| 2026-10-18 13:53:21 | 2026-10-18 13:54:22 | `test-engineer` | 2 | APROVADO | ada2e3b4a53332bae |
