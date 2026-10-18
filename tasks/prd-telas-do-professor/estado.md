# Estado da execução — telas-do-professor

## Agora
- **Espero:** o `RELATÓRIO` do `Implementador` (linha 1) da correção `2026-10-18-professor-em-area-alheia-estoura-o-prazo`
  (`e2e/areas.spec.ts:204` [celular], estourou 30 s na esteira 39129521729), 1ª tentativa, pedida em 18/10 ~14h.
  Depois: `linhas.ts encontro 1` e `esteira.ts` (a 39147219460, em `b12056f`, ainda corria).
- **Devo ainda:** (1) a partida da 2.0 (grande) depois do encontro desta correção; (2) a X4 continua parada (andar
  "X4 telas-do-aluno-e-primeiro-acesso", 1.0 em `1477850`): não retomar sem a palavra do Joaquim.
- **Base:** `spec/telas-do-professor` em `b12056f`.
- **Maestri:** o `maestri` não está no PATH: usar `/tmp/.mount_MaestrKFhlcN/resources/cli/maestri`.

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| correção `2026-10-18-textos-da-turma-indisponivel-diferem` | `61dba8c` | Sonnet | 2 | esteira vermelha da 1.0; o caso W4 de `acesso-da-turma.spec.ts` dividido em 8 pelo portão (15 s) |
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
- 18/10: `DIVERGÊNCIA` de portão na correção `2026-10-18-textos-da-turma-indisponivel-diferem`: o limite de 15 s
  do e2e alterado (correção de processo (a)) reprovou o caso `acesso-da-turma.spec.ts:257`, que tem `test.slow()`
  (90 s) e leva 61–66 s na máquina e 72 s no runner. Não há liberação no portão; mandei dividir o caso na própria
  correção. **Para a retrospectiva:** o `duracao-do-e2e.ts` ignora o `test.slow()`, e o arquivo tem nove casos com ele:
  tocar qualquer um obriga a dividi-lo.
- 18/10: a correção de processo M1 a M5 (oito correções, `cd4cecb` a `0aea52e`, andar
  "correcao 2026-10-18-codigo-de-processo") pousou na `develop` com a esteira verde em `0aea52e` (39140116448) e a
  palavra do Joaquim ("pode pousar quando a esteira ficar verde"); push da `develop` feito; a `develop` entrou na spec
  em `2e814f1`.
- 18/10: a esteira da spec depois da 1.0 (39129521729, `93e787e`) ficou vermelha em dois e2e. Eu tinha dado a partida
  da 2.0 antes de ler o veredito; desfiz a partida no `.processo/linhas.json` (a linha não tinha começado) e abri as
  correções antes, uma por e2e. A de `acesso-da-turma.spec.ts:418` (os textos de `main` das duas turmas indisponíveis
  diferem: esperava 1, recebeu 2) é da 1.0, que pôs o sino em `main` e mexeu nesse spec.
