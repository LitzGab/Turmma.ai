# Correção — o caso "diálogo, confirmação e painel, no tema escuro" de `pecas-sobrepor` estoura os 30 s no celular da esteira

**Origem:** esteira run 39234137170 (push de 91acc6d, depois da tarefa 14.0), job `e2e 7/7`
**Subagentes obrigatórios:** `frontend-reviewer`

## Sintoma

Só uma falha em 170 casos: `[celular] › e2e/pecas-sobrepor.spec.ts:556:5 › … no tema escuro: borda de 2 px com degrau, véu do tema, sem violação do axe`, `Test timeout of 30000ms exceeded` (31,7 s). O mesmo caso no tema claro passou na mesma corrida. `gh run view 39234137170 --log-failed`.

## Fora desta correção
nada

## Causa

O caso abre as quatro peças sobrepostas da galeria (diálogo, confirmação oficial, confirmação de perigo e painel) uma depois da outra na mesma página, e cada uma leva a leitura de estilo, o axe completo e o Esc. Localmente o caso inteiro leva 12 s (chromebook), perto dos 15 s que o runner, que leva perto do dobro, deixa para ele; no runner da esteira, numa corrida de 28,9 min com a máquina carregada, passou de 30 s. Não é regressão de código: o caso é da X1 (tarefa 7.0) e não mudou; é o tamanho dele, quatro peças e quatro varreduras do axe num caso só, que não tem folga. Não é defeito de tema: o mesmo corpo passa no claro. É a falha de tempo da regra do portão ("metade do prazo"), vista na esteira porque o caso nunca foi tocado depois dela.

## Teste que reproduz

Não dá para reproduzir de forma determinística: o estouro depende da carga do runner. A evidência que substitui o vermelho é a duração: antes, um caso por tema e por projeto levava 12,2 a 12,4 s no chromebook local (perto do limite de 15 s); depois, um caso por tema, por peça e por projeto, cada um com uma peça só, e a soma das asserções é a mesma. O número medido depois está em "Correção".

## Correção

`e2e/pecas-sobrepor.spec.ts`: o laço por tema passou a ter também um laço por peça (`ABERTOS`), e cada caso abre uma só, com o mesmo corpo e as mesmas asserções (véu, fundo, borda de 2 px com degrau ou de um lado só no painel, canto de 16 px, cor do botão que confirma, axe e o Esc). Nenhuma asserção saiu: o que antes rodava em sequência roda agora em casos separados, e uma peça que quebra reprova o caso dela, com o nome na linha.

Medido depois, com 2 workers: os 16 casos (4 peças × 2 temas × 2 projetos) passaram dez execuções seguidas, cada caso com 3,8 a 4,9 s (o maior, contra os 12,4 s do caso antigo e os 15 s do limite do portão), e o conjunto inteiro em 14,7 a 16,3 s.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 08:11:27 | 2026-10-19 08:11:48 | `frontend-reviewer` | 1 | APROVADO | a4d4014da1c5f54f3 |
| 2026-10-19 08:11:28 | 2026-10-19 08:11:59 | `test-engineer` | 1 | APROVADO | adbdbfbd70a807853 |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | "A correção diz que não há como reproduzir o estouro de forma determinística. A evidência é a duração medida antes e depois, e o `/validar` deve confirmar o próximo ciclo da esteira." | Não é mudança de código: a esteira do próximo push confere a duração, e o Orquestrador lê o veredito dela |
| frontend-reviewer (1ª) | "Os nomes dos casos mudaram… vale a esteira confirmar que nenhum filtro externo dependia dele." | O test-engineer conferiu na árvore (`git grep` do título antigo vazio); a esteira do próximo push confirma o resto |
| test-engineer (1ª) | "O documento de correção, em "Teste que reproduz", admite que não há vermelho determinístico… Vale o `/retro` registrar o padrão: um caso que varre o axe várias vezes deve nascer repartido" | `/retro` da spec telas-do-professor, que junta as correções por estouro de prazo do e2e; o Arquiteto agrupa |
| 2026-10-19 08:29:41 | 2026-10-19 08:29:56 | `test-engineer` | 2 | APROVADO | a2db936c350b710a5 |
