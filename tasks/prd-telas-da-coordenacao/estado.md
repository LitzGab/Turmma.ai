# Estado da execução — telas-da-coordenacao

## Agora
- **Espero:** linha 1, `Implementador`: o `/seguir RELATÓRIO` da tarefa 2.0, retomada às ~16h40 depois da correção
  `2026-10-16-sexta-fatia-do-e2e` (`9d9985f`, na linha, sem encontro próprio), com a `Mesa` reiniciada; falta o portão
  da tarefa e a rodada. Desde ~17h15 em fila; o portão da 14.0 acabou, e a linha 1 roda o seu --repeat-each sem carga.
  **DIVERGÊNCIA de desenho na 2.0** (~17h50), sobre a r1 da `Mesa` (ordem `.processo/ordens/2_task-r1.md`, itens 1 e
  14): o Implementador quer a opção (b), uma leva só, e a techspec §12 (3ª premissa) e §7c atualizadas. Triagem
  pedida ao `Arquiteto`, reiniciado no checkout da linha 1 (ele commita lá; não mexe na linha 118 da techspec, que a
  linha 2 alterou). Decidido (b) às ~18h05, sem mudar desenho nem aceite: techspec §7c e §12 em `8e45a1d` na linha
  1; a decisão foi ao `Implementador` como observação. Espero o `RELATÓRIO` da 2.0 depois da rodada 2.
  **ESCALADA da `Mesa 2` na 14.0** (~17h45): o `test-engineer` reprovou na r1 e na r2 (ordem
  `.processo/ordens/14_task-r2.md`, achados em `achados/14_task.md`). Pedi o diagnóstico ao `Arquiteto`, reiniciado no
  checkout da linha 2. Diagnóstico às 17h28 (`.processo/ordens/diagnostico-14.md`: só faltam mutações declaradas no
  `14_task.md`); `PEDIDO de retomada` enviado ao `Implementador 2`, que editou o documento e espera, num laço, o portão
  da linha 1 aparecer e sumir para as duas corridas de e2e. Se a linha 1 falhar sem rodar o portão, libere a linha 2.
  Uma terceira reprovação do `test-engineer` é parada (limite). Linha 2, `Implementador 2`, tarefa 14.0, 1ª tentativa, pedida às 15h07, retomada às ~16h40
  com a mesma correção trazida por cherry-pick (`c2965ac`); falta o portão, a `Mesa 2` e o commit. Ao receber um
  `RELATÓRIO` de tarefa: `linhas.ts encontro <n>`, depois `esteira.ts`
- **Devo ainda:** nada além do ciclo. A X3 e a X4 continuam paradas por pedido do Joaquim (a X4 no andar
  "X4 telas-do-aluno-e-primeiro-acesso", com a 1.0 em `1477850`): não retomar sem a palavra dele
- **Base:** `spec/telas-da-coordenacao` em `586b76b`, com a `develop` de `2029703` (X1 pousada, mockup e retro) juntada

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| 1.0 | `694f9d4` | Sonnet | 3+ | conduzida fora do Maestri pelo "Claude Code #2" (`conduzir.mjs`), em 16/10 de manhã; a X2 foi parada às 09h40 e retomada às ~14h15 |

## Esperando o Joaquim
## O que falhou
## O que decidi sem perguntar
- 16/10 ~14h15: juntei a `develop` (`2029703`) na `spec/telas-da-coordenacao` antes da 2.0, para a X2 partir da X1
  pousada e com os ajustes da retrospectiva; merge sem conflito
- 16/10 ~16h05: DIVERGÊNCIA de portão da 2.0 (1002 casos de e2e em 5 fatias, 201 por fatia, acima do teto de 197 de
  `tools/ci/esteira.test.ts`) virou a correção `2026-10-16-sexta-fatia-do-e2e` na linha 1, com `infra-guardian`, antes
  de retomar a 2.0. A linha 2 (14.0) segue; se a 14.0 também somar casos de e2e, o teto volta no encontro dela.
  Correção aprovada (`9d9985f`, seis fatias, 167 casos por fatia). Conferido: nenhuma branch do GitHub é protegida nem
  há ruleset, então trocar "e2e 1/5..5/5" por "1/6..6/6" não quebra verificação exigida
- 16/10 ~16h40: a 14.0 (linha 2) bateu no mesmo teto (994 casos). Em vez de uma segunda correção, o `Implementador 2`
  trouxe a da linha 1 com `git cherry-pick 9d9985f` (`c2965ac`): não toca arquivo da 14.0, e no encontro as duas
  cópias, iguais, se juntam sem conflito. Se o encontro da linha 2 reclamar do commit duplicado, é aqui que olhar
- 16/10 ~17h15: DIVERGÊNCIA de portão da 2.0 por carga (load 9 a 16): o e2e estoura 30 s na entrada compartilhada,
  em casos que mudam a cada rodada; sem carga, 40/40. Não é defeito de código: parei o `educa-teste` (ambiente 0,
  de pé à toa desde o andar da X1) e pus as linhas em fila. A linha 2 roda o portão da 14.0 agora; a linha 1 espera,
  num laço, o fim dele e do e2e da linha 2, e então refaz o --repeat-each e o portão. Se voltar a cair com a
  máquina livre, aí é defeito, e vira FALHA da 2.0
- 16/10 ~17h45: reiniciei o `Arquiteto` para o diagnóstico da 14.0. Na caixa dele havia "pode fazer o push da develop",
  digitado e não enviado; a `develop` local já estava igual à `origin/develop`, então nada se perdeu
