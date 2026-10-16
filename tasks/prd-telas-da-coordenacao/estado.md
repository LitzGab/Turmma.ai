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
  Linha 2, `Implementador 2` (reiniciado com a `Mesa 2` às ~18h20): o `RELATÓRIO` da **correção**
  `2026-10-16-aba-das-empresas-depois-de-recarregar` (esteira vermelha 38944717887 em `e30b9ca`:
  `e2e/privacidade.spec.ts:298`, a aba "Empresas que recebem dados" some depois do reload, nos dois projetos; vem da
  1.0; `frontend-reviewer`). Partida feita. Ao receber: `linhas.ts encontro 2`, depois `esteira.ts`. Nenhuma tarefa
  parte antes de a 2.0 se encontrar (todas presas nela)
- **A conferir na esteira de `b95722d`:** a unidade deve passar com a sexta fatia; o W6 do Uso (14.0) falha no
  chromebook com banco acumulado de outras execuções (regra 40 pede que passe nos três ambientes): se cair na
  esteira, é correção
- **Devo ainda:** nada além do ciclo. A X3 e a X4 continuam paradas por pedido do Joaquim (a X4 no andar
  "X4 telas-do-aluno-e-primeiro-acesso", com a 1.0 em `1477850`): não retomar sem a palavra dele
- **Base:** `spec/telas-da-coordenacao` em `586b76b`, com a `develop` de `2029703` (X1 pousada, mockup e retro) juntada

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| 1.0 | `694f9d4` | Sonnet | 3+ | conduzida fora do Maestri pelo "Claude Code #2" (`conduzir.mjs`), em 16/10 de manhã; a X2 foi parada às 09h40 e retomada às ~14h15 |
| 14.0 | `d289c98` | Sonnet | 3 | linha 2, 15h07–18h15; escalada do `test-engineer` (r1, r2) com diagnóstico do Arquiteto (faltavam mutações declaradas), aprovada na r3; cherry-pick da sexta fatia (`c2965ac`); a Mesa não fotografou a operação (a vitrine não a cobre): **a validação refotografa** `/operacao` e `/operacao/uso`; linha nova no `TODO.md` (coluna Uso com turmas 0) |

## Esperando o Joaquim
## O que falhou
- 16/10 18h00–18h38: a correção da linha 2 ficou 37 min parada num laço de espera que nunca saía: `pgrep -f` sem
  colchete acha a própria linha do `zsh -c`. Ao mandar uma linha esperar a outra, escreva o padrão já com colchete
  (`[p]ortao-local.ts`); a linha 1 tinha caído no mesmo erro às 17h15 e se corrigiu sozinha
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
