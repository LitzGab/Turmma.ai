# Estado da execução — telas-do-professor

## Agora
- **Espero:** o `RELATÓRIO` de cada linha:
  - linha 1 (`Implementador`/`Mesa`, reiniciados 19/10 ~04h05): **5.0**, grande (até 4 h sem a 1ª rodada), 1ª tentativa.
    A correção do `mfa:85` se encontrou em `907d546` (spec em `550389a`); confirmar o `mfa.spec.ts` no celular na
    esteira de `550389a` (39214321944);
  - linha 2 (`Implementador 2`/`Mesa 2`, reiniciados 19/10 ~03h30): **4.0**, pequena (até 2 h sem a 1ª rodada);
  - linha 3 (`Implementador 3`/`Mesa 3`, reiniciados 19/10 ~05h): **retomada da correção `encontro-10`** (frontend-reviewer):
    refazer o merge de `spec/telas-do-professor`, com o `rotas.tsx` resolvido (9.0 × 10.0, os dois lazy) guardado no
    scratchpad, passar o portão e a Mesa e fechar o merge. A sétima fatia do e2e já está em `52f43fe` (correção
    `2026-10-19-setima-fatia-do-e2e`, 2 rodadas, aprovada por todos). A 10.0 está em `2b8e78e` (2 rodadas, tudo aprovado).
    **Com o RELATÓRIO:** `linhas.ts encontro 3`, e a 10.0 e as duas correções vão para "Concluídas".
  A cada `RELATÓRIO`: `linhas.ts encontro <n>` e `esteira.ts`. Esteiras: `4cbe1b0` verde; `f37a95f` e `550389a` rodando.
- **Devo ainda:** (0) feito, 19/10 ~00h20: o `Implementador 3` sabe que a Turma vira lazy (30 kB) e a fachada fica em 8 kB; (1) ficar de olho em `e2e/areas.spec.ts:231` (19–21 s na máquina, 23,8 s na esteira); se cair,
  correção como a `:204`; (2) a X4 continua parada (andar "X4 telas-do-aluno-e-primeiro-acesso", 1.0 em `1477850`): não
  retomar sem a palavra do Joaquim; (3) as esteiras de `0650af0` e `23e8794` foram verdes: nada pendente da 1.0. (4) no fechamento, linha no `TODO.md`: com sete fatias, sobram ~180 casos do e2e (~1379, 197 por fatia) até precisar da oitava (ver `tools/ci/prazo-do-e2e.ts`).
- **Base:** `spec/telas-do-professor` em `550389a` (correção do mfa em `907d546`; 9.0 em `d13cb69`) (2.0 em `7ad636e`, com a correção `75f94a3`).
- **Maestri:** o `maestri` não está no PATH: usar `/tmp/.mount_MaestrKFhlcN/resources/cli/maestri` com
  `MAESTRI_SOCKET=/tmp/maestri-309bb7f3/maestri.sock`.

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| correção `2026-10-19-mfa-codigo-de-recuperacao-estoura-o-prazo` | `907d546` | Sonnet | 2 | esteira de `143f000` vermelha no `mfa.spec.ts:85` (celular, 30,3 s); o caso virou dois de 10 a 12 s; o `PRAZO_DA_ENTRADA_MS` em quatro arquivos foi para o `TODO.md` |
| correção `2026-10-18-professor-em-area-alheia-estoura-o-prazo` | `43067f8` | Sonnet | 1 | esteira vermelha da 1.0; o caso `areas.spec.ts:204` (seis cargas, 30 s na esteira) virou cinco casos de 4 s, entrando pela API |
| correção `2026-10-18-textos-da-turma-indisponivel-diferem` | `61dba8c` | Sonnet | 2 | esteira vermelha da 1.0; o caso W4 de `acesso-da-turma.spec.ts` dividido em 8 pelo portão (15 s) |
| 9.0 | `d13cb69` | Sonnet | 2 | duas divergências decididas pelo `Arquiteto` sem mudar desenho (série fora do cartão; Turmas lazy, fachada em 8 kB); portão lento pelo detector |
| 3.0 | `7a78946` | Sonnet | 2 | portão lento por defeito do detector (diagnóstico 3), não da tarefa; 1ª rodada só depois da correção `8afb24d` |
| correção `2026-10-19-detector-de-literal-compara-com-a-web` | `8afb24d` | Sonnet | 2 | diagnóstico 3 do `Arquiteto`: o detector puxava quase toda a suíte nas três linhas; andar próprio saído da spec, fast-forward |
| 2.0 | `7ad636e` | Sonnet | 2 | divergência de desenho (régua do e2e × §10), parada, alt. 1 do Joaquim; `test-engineer` reprovou na 1ª; trabalho guardado fora da árvore durante a correção e restaurado |
| correção `2026-10-18-duracao-do-e2e-le-o-prazo-declarado` | `75f94a3` | Sonnet | 4 | divergência da 2.0 (alt. 1); `test-engineer` escalou (r2), diagnóstico do `Arquiteto`, 3ª reprovação destravada pelo Joaquim; sem encontro próprio |
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

## 18/10 15:10 — X3 2.0 (2.4 e 2.5), `BLOQUEIO` do Arquiteto
Decisão: como resolver o choque entre a §10 da Tech Spec (mover os specs sem mudar título) e a régua nova de 15 s por caso de e2e alterado (`4723044`, retro M1)?
Contexto: os casos movidos levam de 11,5 a 37,8 s, e os editados pela 2.4 vão até 71,7 s, mas quase todos declaram prazo próprio (`test.slow()` = 90 s; a2, a3-a4 e roteiro de 300 s a 8 min), que a régua não lê. Triagem em `.processo/ordens/divergencia-2-duracao-do-e2e.md`, no checkout da linha 1.
Opções: (1) correção de processo antes: limite = metade do prazo declarado do caso; a §10 fica, e a 2.0 só encurta `casca:468` e `areas:151` | (2) dividir ou encurtar ~35 casos na 2.0 | (3) isentar só o mover puro; os editados ainda teriam de ser divididos
Recomendo: a 1, como o Arquiteto; a régua mede contra um prazo que esses casos não têm, e o estouro na esteira continua coberto.
**Respondida (18/10 ~15h15):** "pode seguir com a 1", no meu terminal.

## 18/10 19:50 — X3 correção `2026-10-18-duracao-do-e2e-le-o-prazo-declarado` (no meio da 2.0), `BLOQUEIO` da Mesa
Decisão: destravar o limite das três reprovações do `test-engineer` nesta correção, para uma 4ª rodada?
Contexto: com o diagnóstico do Arquiteto aplicado (83 blocos de mutação), a 3ª rodada achou só 2 blocos (linhas ~210 e ~231 do documento) que mutam para código que não compila e ficam vermelhos pelo motivo errado. A correção é só no documento, mais o carimbo; o `revisor-geral` aprovou as três. Achados: `tasks/correcoes/achados/2026-10-18-duracao-do-e2e-le-o-prazo-declarado.md`, na linha 1.
Opções: destravar e seguir para a 4ª rodada | não destravar e repensar a correção com o Arquiteto
Recomendo: destravar; o código foi aprovado, e o que falta são duas mutações escritas de outro jeito.
**Respondida (18/10 ~20h):** "pode destravar, segue com a 1", no meu terminal. A contagem do `test-engineer` recomeça.

## O que falhou
- 19/10 ~04h20: encontro da linha 3 (10.0) em CONFLITO com a 9.0 em `rotas.tsx`, as duas fazendo uma rota lazy; correção `encontro-10` na linha.
- 19/10: `linhas.ts conferir` recusa correção em branch `correcao/` saída da spec (compara com a `develop`). Para a retro.
- 19/10, 00h–02h: com as três linhas abertas, o portão de cada tarefa leva 30 a 46 min (puxa até 53 specs) e cai em
  specs de outra área por carga (L1: 27 no celular; L3: `material.spec.ts`, 30 s estourados no axe, com 1159 verdes);
  as linhas fazem fila no `flock` e a 3.0 (pequena) passou de 3 h sem a 1ª rodada, com o portão na 3ª vez. Para a
  retrospectiva: portão da tarefa sob três linhas.

## O que decidi sem perguntar
- 19/10 ~04h40: DIVERGÊNCIA de portão na `encontro-10` (sétima fatia do e2e). Com o merge aberto o git não aceita commit parcial, então o merge foi abortado (resolução guardada), a sétima fatia virou correção própria na linha 3 e o merge volta depois, como retomada.
- 19/10 ~02h30: a correção do detector (`diagnostico-3.md`) corre num andar próprio, saído da spec, e não numa
  linha: as três estão no meio de tarefa, e a correção com o trabalho na árvore repetiria o backup da 2.0. O terminal da
  linha 1 faz a correção, porque a 3.0 já esperava. Matei os órfãos e o ambiente `educa-teste` parado, pelo Ponto 2.
- 18/10: a correção da régua do e2e (alternativa 1 da parada da 2.0) corre na linha 1, como correção de portão no meio
  da tarefa (passo 6), e não em andar avulso: a ferramenta pousa com a spec. Contra o risco do `test.slow()` posto para
  escapar, vale só o prazo declarado que já estava no HEAD. Guardiões: só `test-engineer` e `revisor-geral`.
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
