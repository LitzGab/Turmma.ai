# Estado da execução — telas-do-aluno-e-primeiro-acesso

## Agora
- **Retomada em 24/10/2026**, pela palavra do Joaquim no terminal do Orquestrador (opção A): a X4, congelada em 20/10 pela X5,
  reabre a partir da `develop` de hoje (`5ca8739`, depois da X5, da X7 e das M1 a M7 da retro da X7). A branch velha virou
  `spec/telas-do-aluno-e-primeiro-acesso--congelada` (local, `1477850`, a 1.0 de antes), só para consulta ao refazer a 1.0
- **Conferência do Arquiteto (24/10, `341deca`):** sem BLOQUEIO, nada de desenho nem de critério do PRD (techspec §12c); caminhos,
  nomes (D81) e arquivos previstos alinhados ao código depois da X5 e da X7, em dez `_task.md` (a 7.0 não precisou)
- **Espero:** linha 1, a 1.0, 3ª tentativa do test-engineer, retomada em 25/10 ~01:10 com a ordem r2 e o diagnóstico curto do Arquiteto (`.processo/ordens/diagnostico-1.md`: só texto da tarefa e um comentário). O portão está rodando; depois, a rodada da Mesa
- **Devo ainda:** no fechamento, somar ao item "Três testes com prazo apertado na esteira" do `TODO.md` (correção M5 da X7): a esteira da `develop` `40144205508` caiu no e2e 2/7 (`e2e/operacao-convite-coordenacao.spec.ts`, W1/W6/W10 e W3 no chromebook, elemento que não apareceu) e ficou verde na 2ª tentativa, sem mudança de código (24/10 ~23:45)
- **Devo ainda (2):** abrir a correção de produção do "Sem aplicar" da ordem r2: o job `montar-arquivo.ts:51-64` e `arquivo-do-titular.repository.ts:103` regravam o `pronto_em` e renovam a validade na reentrega (test-engineer e infra-guardian). Depois do encontro da 1.0, pelo diagnóstico do Arquiteto: ela não torna a prova possível
- **Base:** `spec/telas-do-aluno-e-primeiro-acesso` em `341deca`

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|

## Esperando o Joaquim
## O que falhou
- Correção `2026-10-24-arquivo-do-titular-data-fixa` (no meio da 1.0): 3 rodadas do test-engineer, com ESCALADA e diagnóstico do Arquiteto (tirar o job da fila com update atômico). Pousou na linha 1 em `4bbc01a`
- 25/10 ~00:15 (vigia): na correção `2026-10-24-arquivo-do-titular-data-fixa`, o Implementador esperou o portão com um laço `while pgrep -f "portao-local.ts …"`, que casa com a própria linha de comando e nunca terminou. O portão tinha acabado verde às 23:44, e ele ficou parado 30 min. Encerrei o laço (`kill`), e ele seguiu. É a armadilha que o passo 6 já descreve, só que do lado do Implementador
## O que decidi sem perguntar
- 25/10 ~01:05: ESCALADA da Mesa na 1.0 (test-engineer, 2ª, só falta citar o caso do `escolher`). Pedi o diagnóstico mesmo assim, como o passo 6 manda, e o Arquiteto devolveu dois ajustes de texto
- 25/10 ~00:25: ESCALADA da Mesa na correção do arquivo do titular. Pedi o diagnóstico ao Arquiteto, apontado para o checkout da linha 1 (passo 3)
- 24/10 ~23:40: DIVERGÊNCIA (portão) do Implementador na 1.0: três casos de `apps/api/test/arquivo-do-titular.int.test.ts` (l.712 e l.973) fixam o relógio em 12 a 19/10 e o arquivo nasce com a data real, e passaram a dar 200 em vez de 404. Pelo passo 6, virou correção na linha 1, antes de retomar a 1.0. Guardiões: `privacy-guardian`, além dos implícitos. O mesmo arquivo tem um caso da 1.0, então o commit da correção leva só os trechos dela
