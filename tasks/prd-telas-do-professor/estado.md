# Estado da execução — telas-do-professor

## Agora
- **Abertura (17/10, ~21h20):** o Joaquim disse no meu terminal "pode pousar e depois continuar com a x3". A X2 pousou
  na `develop` (`7092ee6`); a X3 abre a partir dela, com o sino da X2 já em `apps/web/src/componentes/sino/` (a 1.1
  manda reusá-lo).
- **Linha 1** (`spec/telas-do-professor--l1`, ambiente de teste 1): ociosa. A 2.0 é a próxima no quadro, mas **não
  parte** antes da correção de processo M1 a M5 pousar e a `develop` entrar na spec (decisão do Joaquim, 18/10).
- **Esteira da spec:** 39129521729 em `93e787e` (depois da 1.0); o veredito se lê no próximo encontro.
- **Retrospectiva da X2:** feita, `720beac` na `develop`, sem push (`tasks/prd-telas-da-coordenacao/retro.md`).
  Aplicadas T1 (`flock`), T2 e T3; M1 a M5 no `TODO.md`, com o destino "antes da primeira tarefa da X3". O andar da X3
  está em `7092ee6` e ainda não tem esse commit (o `flock` das skills só chega com o merge da `develop`).
- **Devo ainda:** com a 1.0 encontrada, **antes da 2.0**: a correção de processo M1 a M5 (`TODO.md`, "(X1,
  retrospectiva) Código de processo"; `tasks/prd-telas-da-coordenacao/retro.md`, linha 179) em andar
  `correcao/<data>-<slug>`, com o `Implementador` e a `Mesa`; o pouso dela na `develop` (parada); depois o merge da
  `develop` na `spec/telas-do-professor` (traz também `720beac`, com o `flock`), e só então a partida da 2.0. A X4 continua parada (andar "X4 telas-do-aluno-e-primeiro-acesso", 1.0 em
  `1477850`): não retomar sem a palavra do Joaquim.
- **Maestri:** o `maestri` não está no PATH: usar `/tmp/.mount_MaestrKFhlcN/resources/cli/maestri`.

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| 1.0 | `cb209b5` | Sonnet | 3 | escalada do `test-engineer` (r1, r2); diagnóstico do `Arquiteto` (`diagnostico-1.md`), aprovado na r3 |

## Esperando o Joaquim

## 17/10 23:48 — X3 1.0 (escalada da Mesa)
Decisão: liberar o `Arquiteto` para o diagnóstico da 1.0, que ele só pode fazer depois de você responder à retrospectiva da X2.
Contexto: o `test-engineer` reprovou a 1.0 duas vezes (ordem `.processo/ordens/1_task-r2.md`, no checkout da linha 1); antes da 3ª tentativa o `/seguir` pede o diagnóstico do `Arquiteto`, mas a sessão dele guarda o menu da retrospectiva, e reiniciá-la apaga as propostas.
Opções: responder à retrospectiva agora, e eu peço o diagnóstico em seguida | autorizar o reinício já (a retrospectiva é refeita depois)
Recomendo: responder à retrospectiva primeiro; são três propostas curtas, e nada se perde.
**Respondida (18/10):** o Joaquim respondeu à retrospectiva; o diagnóstico seguiu.

## 18/10 00:05 — X3 1.0 e a correção de processo M1 a M5
Decisão: a correção de processo M1 a M5, que a retrospectiva da X2 pôs "antes da primeira tarefa da X3", entra antes ou depois de terminar a 1.0, que já está na 3ª tentativa?
Contexto: a 1.0 tem o trabalho na árvore da linha 1, cinco revisores aprovados e um bloqueante do `test-engineer`; o diagnóstico já está pedido. M1 a M5 é correção avulsa em andar próprio, com pouso na `develop` e merge na X3 (`tasks/prd-telas-da-coordenacao/retro.md`, linha 179).
Opções: terminar a 1.0, depois M1 a M5 antes da 2.0 | parar a 1.0 agora e fazer M1 a M5 primeiro
Recomendo: terminar a 1.0; falta um teste, e M1 a M5 não muda a revisão dela. A 2.0 não parte antes de M1 a M5 pousar.
**Respondida (18/10):** "faça o melhor para o projeto e aprovo", no meu terminal: termina a 1.0; M1 a M5 antes da 2.0.

## O que falhou

## O que decidi sem perguntar
