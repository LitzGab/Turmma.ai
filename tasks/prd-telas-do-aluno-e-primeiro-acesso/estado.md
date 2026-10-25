# Estado da execução — telas-do-aluno-e-primeiro-acesso

## Agora
- **Retomada em 24/10/2026**, pela palavra do Joaquim no terminal do Orquestrador (opção A): a X4, congelada em 20/10 pela X5,
  reabre a partir da `develop` de hoje (`5ca8739`, depois da X5, da X7 e das M1 a M7 da retro da X7). A branch velha virou
  `spec/telas-do-aluno-e-primeiro-acesso--congelada` (local, `1477850`, a 1.0 de antes), só para consulta ao refazer a 1.0
- **Conferência do Arquiteto (24/10, `341deca`):** sem BLOQUEIO, nada de desenho nem de critério do PRD (techspec §12c); caminhos,
  nomes (D81) e arquivos previstos alinhados ao código depois da X5 e da X7, em dez `_task.md` (a 7.0 não precisou)
- **Espero:** linha 1 ociosa (nada parte: a 8.0 espera a 7.0); linha 3 a 6.0 (1ª tentativa, porte grande, desde ~05:50); linha 2 a 7.0 (1ª tentativa, porte grande, desde ~06:05; DIVERGÊNCIA de desenho às ~06:50, `trabalhos()` da memória do tutor não filtra por turma no aluno transferido: BLOQUEIO do Arquiteto às ~07:00, parada aberta em "Esperando o Joaquim"; a 7.0 espera na árvore, portão verde)
- **Devo ainda:** no fechamento, somar ao item "Três testes com prazo apertado na esteira" do `TODO.md` (correção M5 da X7): a esteira da `develop` `40144205508` caiu no e2e 2/7 (`e2e/operacao-convite-coordenacao.spec.ts`, W1/W6/W10 e W3 no chromebook, elemento que não apareceu) e ficou verde na 2ª tentativa, sem mudança de código (24/10 ~23:45); e levar ao `TODO.md` as quatro primeiras linhas de "Recomendações sem aplicar" de `tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md` (janela de corrida guarda/gravação, registro em `docs/lgpd.md` e no runbook, marcador `arquivo_montado_em`; a do `doPedido` saiu, coberta pela correção `2026-10-25-testes-do-arquivo-do-titular`), mais o achado do Implementador 2: o `-t` do vitest lê parênteses do nome do teste como regex, e a mutação fica "verde" sem rodar caso
- **Base:** `spec/telas-do-aluno-e-primeiro-acesso` em `15c9bbb` (encontro da 3.0; esteira verde em `f28ed6a`, execução `40178723579`, que tirou do vermelho a `40175702471`)

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| 1.0 | `eee2b2c` (spec em `b015eba`) | Sonnet 5.5 | 3 (test-engineer e revisor-geral na 3ª; os guardiões na 2ª) | correção `2026-10-24-arquivo-do-titular-data-fixa` (`4bbc01a`) no meio, com 2 ESCALADAS e 2 diagnósticos do Arquiteto |
| correção `2026-10-25-montar-arquivo-renova-validade` (linha 2) | `59b93d3` (spec em `11e3790`) | Sonnet 5.5 | 2 (test-engineer na 2ª; privacy, infra, tenancy e conformidade na 1ª) | encontro e verificação da soma sem conflito |
| correção `2026-10-25-testes-do-arquivo-do-titular` (linha 2) | `b41749d` (spec em `848c22c`) | Sonnet 5.5 | 1 (os cinco revisores aprovaram na 1ª; ordem só de comentário, aplicada antes do commit) | encontro e verificação da soma sem conflito; as três "Recomendações sem aplicar" foram recusadas com motivo, nada a levar ao `TODO.md` |
| 2.0 (linha 1) | `469a395` (spec em `dd9012e`) | Sonnet 5.5 | 2 (revisor-geral e test-engineer na 2ª; os cinco outros na 1ª) | a Mesa caiu num erro 500 da API às 03:15 e retomou com um Enter; três recomendações da 2ª rodada em "Recomendações sem aplicar" do `2_task.md` (`.processo/ordens/2_task-r2.md`); linha nova no `TODO.md`: idempotência do `DELETE /v1/sessao` |
| 4.0 (linha 2) | `c81e091` (spec em `05935df`) | Sonnet 5.5 | 3 (test-engineer e revisor-geral na 3ª; os cinco outros na 1ª) | encontro e verificação da soma sem conflito; 7 linhas novas no `TODO.md`; divergências da reserva de matéria e do título sem número na tarefa e na techspec §9 |
| 5.0 (linha 3) | `fd8f10a` (spec em `c348788`) | Sonnet 5.5 | 3 (conformidade-reviewer na 3ª, depois de reprovar na 2ª; test-engineer na 2ª; os cinco outros na 1ª) | encontro e verificação da soma sem conflito; 46 fotos da galeria, cheia e vazia, vistas na 2ª rodada |
| correção `2026-10-25-rodape-da-casca-do-aluno` (linha 2) | `84fa5ff` (spec em `f28ed6a`) | Sonnet 5.5 | 1 (os seis revisores aprovaram na 1ª) | da 2.0: o W12 do aluno em `e2e/casca.spec.ts` ainda esperava o Rodapé e o "Tutor"; a web não mudou; encontro e verificação da soma sem conflito |
| 3.0 (linha 1) | `fca784a` (spec em `15c9bbb`) | Sonnet 5.5 | 3 (os sete revisores aprovaram na 3ª) | encontro e verificação da soma sem conflito; fora dos previstos: `aluno-tutor`, `casca-no-celular` e `minha-turma.spec`, `rotas.test.tsx`, `carga-login.test.ts` (consequência do novo Início); 3 linhas novas no `TODO.md`; a vitrine cheia não semeia atividade, o estado com tarefas só foi visto por foto temporária do Implementador |

## Esperando o Joaquim
### 25/10/2026 ~07:00 — X4 tarefa 7.0 (linha 2), BLOQUEIO do Arquiteto
Decisão: o aluno transferido de turma no mesmo ano continua vendo em Eu ("Como estou indo") a tarefa corrigida da turma antiga?
Contexto: a memória do Tutor (`trabalhos()`) filtra por escola, ano e aluno, não por turma; o PRD §7 diz "não aparece, como hoje", e o "como hoje" está errado. Triagem em `.processo/ordens/triagem-divergencia-7_task.md` do checkout da L2.
Opções: A) aceitar: muda o PRD §7, a 7.0 sai como está e ganha um caso de integração novo | B) correção na API cortando pela turma do vínculo, e o Tutor também esquece a tarefa da turma antiga
Recomendo: A (do Arquiteto): a D66 cobre "toda a trajetória", a N14 pede que o aluno veja tudo que o Tutor sabe, e é o próprio resultado dele, aprovado por humano.
Segue: a 3.0 (L1) e a 6.0 (L3) não tocam a memória nem o PRD §7 (sem dependência com a 7.0 no `tasks.md`); a 8.0 a 11.0 já esperam a 7.0. A pergunta não está aberta no terminal do Arquiteto: a resposta vem ao Orquestrador e vira `PEDIDO` a ele.
## O que falhou
- Correção `2026-10-24-arquivo-do-titular-data-fixa` (no meio da 1.0): 3 rodadas do test-engineer, com ESCALADA e diagnóstico do Arquiteto (tirar o job da fila com update atômico). Pousou na linha 1 em `4bbc01a`
- 25/10 ~00:15 (vigia): na correção `2026-10-24-arquivo-do-titular-data-fixa`, o Implementador esperou o portão com um laço `while pgrep -f "portao-local.ts …"`, que casa com a própria linha de comando e nunca terminou. O portão tinha acabado verde às 23:44, e ele ficou parado 30 min. Encerrei o laço (`kill`), e ele seguiu. É a armadilha que o passo 6 já descreve, só que do lado do Implementador
## O que decidi sem perguntar
- 25/10 ~04:50: esteira da spec vermelha em `ce8beed` (`e2e/casca.spec.ts` W12, aluno, "Rodapé"), vinda da 2.0. Pelo passo 6, abri a correção `2026-10-25-rodape-da-casca-do-aluno` na linha 2, ociosa depois do encontro da 4.0, antes da partida da 7.0. Guardião que ditei: `frontend-reviewer`
- 25/10 ~01:55: encontro da linha 2 (correção montar-arquivo, `11e3790`). Com a linha 2 ociosa e nada a partir (tudo espera a 2.0), abri nela a correção `2026-10-25-testes-do-arquivo-do-titular`, a que a correção data-fixa deixou "a abrir pelo Orquestrador", somando o caso de isolamento do `doPedido` (tenancy), que é do mesmo arquivo. Guardiões que ditei: tenancy e privacy
- 25/10 ~01:05: ESCALADA da Mesa na 1.0 (test-engineer, 2ª, só falta citar o caso do `escolher`). Pedi o diagnóstico mesmo assim, como o passo 6 manda, e o Arquiteto devolveu dois ajustes de texto
- 25/10 ~00:25: ESCALADA da Mesa na correção do arquivo do titular. Pedi o diagnóstico ao Arquiteto, apontado para o checkout da linha 1 (passo 3)
- 24/10 ~23:40: DIVERGÊNCIA (portão) do Implementador na 1.0: três casos de `apps/api/test/arquivo-do-titular.int.test.ts` (l.712 e l.973) fixam o relógio em 12 a 19/10 e o arquivo nasce com a data real, e passaram a dar 200 em vez de 404. Pelo passo 6, virou correção na linha 1, antes de retomar a 1.0. Guardiões: `privacy-guardian`, além dos implícitos. O mesmo arquivo tem um caso da 1.0, então o commit da correção leva só os trechos dela
