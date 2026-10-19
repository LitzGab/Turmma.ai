# Estado da execução — telas-do-professor

## Agora
- **Espero:** validação rodada 1 (19/10, `421b9f2`) **REPROVADA**: C1–C4 e A1–A4 em `validacao.md` §4. Uma correção por achado, nas três linhas, em fila (o próximo da fila parte depois do encontro do anterior; `partida <n> correcao:<slug>`):
  - linha 1 (turma aberta): `2026-10-19-turma-aberta-rola-a-pagina` (C4, Hoje e Alunos) → `2026-10-19-alunos-dois-botoes-cheios` (C3) → `2026-10-19-hoje-vinculo-encerrado` (A2);
  - linha 2 (sino e Criados): `2026-10-19-sino-sem-a-correcao-aprovada` (C1) → `2026-10-19-criados-data-sem-teste` (C2) → `2026-10-19-sino-cem-ou-mais` (A1);
  - linha 3 (formulário, Assistente, docs): `2026-10-19-formulario-e-assistente-rolam-a-pagina` (C4, Adaptação e "O que o Assistente fez") → `2026-10-19-interface-parte-a` (A3) → `2026-10-19-docs-sem-seu-time` (A4, mais os títulos de e2e do M5).
  Partiram 19/10 ~16h20 as três primeiras (pares reiniciados, cabeçalhos conferidos, pedidos enviados e em trabalho). O terminal do `Implementador 2` mostrou "90% of your weekly limit · resets Oct 22, 3pm": avisado ao Joaquim; se ele pedir, reduzir para uma linha.
  Linha 2: C1 encontrada 16h23 (`f3c06b1`, 1ª rodada, `test-engineer` aprovado); C2 encontrada ~16h50 (`27e95d9`, 1ª rodada, `test-engineer` aprovado; spec em `37a3ea2`, esteira 39311715581 rodando); A1 (`sino-cem-ou-mais`) partiu em seguida (par reiniciado, cabeçalhos conferidos, pedido enviado e em trabalho, 1ª tentativa).
  Guardiões: `frontend-reviewer` em C3, C4, A1, A2; `privacy-guardian` em A2; C1, C2, A3, A4 só os implícitos. Todas as nove encontradas: revalidar (Validador reiniciado, rodada 2 no topo do `validacao.md`).
  Esteiras: `0559707` e `d0b0a7d` vermelhas só em `a2-assistente:86`, corrigido em `42187ee`; `284d15e` (11.0) vermelha só em `a2-assistente:52` (sem a `42187ee`); `b726aea` vermelha no e2e 5/7 sem teste nenhum: o `docker build` do `despachante-2` caiu no `npm ci` (código 152), falha da máquina da esteira; `ff2cb04` e `f9b3ffd` na fila.
- **Devo ainda:** (0) feito, 19/10 ~00h20: o `Implementador 3` sabe que a Turma vira lazy (30 kB) e a fachada fica em 8 kB; (1) ficar de olho em `e2e/areas.spec.ts:231` (19–21 s na máquina, 23,8 s na esteira); se cair,
  correção como a `:204`; (2) a X4 continua parada (andar "X4 telas-do-aluno-e-primeiro-acesso", 1.0 em `1477850`): não
  retomar sem a palavra do Joaquim; (3) as esteiras de `0650af0` e `23e8794` foram verdes: nada pendente da 1.0. (4) no fechamento, linha no `TODO.md`: com sete fatias, sobram ~180 casos do e2e (~1379, 197 por fatia) até precisar da oitava (ver `tools/ci/prazo-do-e2e.ts`). (5) também de olho, acima de 15 s na máquina e fora da correção `acesso-suspenso`: `acesso-suspenso:78` (18,4 s), `escola-e-vinculos:212` (22,4 s) e `:272` (18,9 s); se a esteira estourar, correção como a do `:165`. (6) no fechamento, se o `Validador` não a apontar, linha no `TODO.md` com a recomendação da correção `a2-assistente`: nome do interruptor talvez duplicado para leitor de tela (`Artefato.tsx:269-270`) (não vai no pedido de validação, que é sem contexto de implementação). (7) no fechamento: `validacao.md` §6 (M1–M8 e as ~60 recomendações do M2) para o `TODO.md`; "Acerto médio" (`aprovar.ts:236`) fica para o Joaquim confirmar. (8) esteira de `421b9f2` rodando; `b726aea` vermelha foi a máquina (acima).
- **Base:** `spec/telas-do-professor` em `37a3ea2` (correção `criados-data-sem-teste` em `27e95d9`; correção `sino-sem-a-correcao-aprovada` em `f3c06b1`; 13.0 em `64bb2aa`, merge da correção `encontro-13` em `5724d6d`; correção `a2-assistente` em `42187ee`; 11.0 em `e8915a2`; correção `acesso-suspenso` em `363cdf0`; 6.0 em `5762f90`, merge da correção `encontro-6` em `b90c204`; 8.0 em `9d6bcb5`; 12.0 em `03806c1`; 7.0 em `ebff7f6`; correção `pecas-sobrepor` em `c5bcb52`; 5.0 em `9fde9be`; 14.0 em `b0ba717`, merge da correção `encontro-14`; 10.0 em `8cf865e`, merge da correção `encontro-10`; 4.0 em `a7d86a8`; correção do mfa em `907d546`; 9.0 em `d13cb69`) (2.0 em `7ad636e`, com a correção `75f94a3`).
- **Maestri:** o `maestri` não está no PATH: usar `/tmp/.mount_MaestrKFhlcN/resources/cli/maestri` com
  `MAESTRI_SOCKET=/tmp/maestri-309bb7f3/maestri.sock`.

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| correção `2026-10-19-sino-sem-a-correcao-aprovada` | `f3c06b1` → `0a92cce` | Sonnet | 1 | validação r1, C1 (RF3): teste com `Aprovar` e o sino no mesmo cliente, 2 mutações; `test-engineer` na 1ª |
| 13.0 | `64bb2aa` → `f9b3ffd` | Sonnet | 2 | `test-engineer` e `revisor-geral` reprovaram na 1ª, os quatro aprovaram na 2ª; encontro em CONFLITO com a 11.0 em `techspec.md` (§9, dois parágrafos no mesmo ponto), resolvido pela correção `encontro-13` (1 rodada) |
| correção `2026-10-19-a2-assistente-conta-um-gabarito-a-mais` | `42187ee` → `b726aea` | Sonnet | 1 | esteira vermelha em `0559707`/`d0b0a7d`: a 6.0 pôs o rótulo "Gabarito" do interruptor acima da folha e o e2e contava na página; seletor preso a `[data-folha]`; `frontend-reviewer` e `test-engineer` na 1ª; 1 recomendação para a validação (nome do interruptor talvez duplicado para leitor de tela, `Artefato.tsx:269-270`) |
| 11.0 | `e8915a2` → `284d15e` | Sonnet | 2 | `test-engineer` reprovou na 1ª, os quatro aprovaram na 2ª; 19 mutações; divergências: recarregar com o painel aberto fica em componente (e2e com recarga passaria de 15 s), Corrigir de novo também no lote rejeitado, selo Encerrada não existe sozinho, gancho `corrigir-de-novo.ts` extraído |
| correção `2026-10-19-acesso-suspenso-passa-do-prazo` | `363cdf0` → `d0b0a7d` | Sonnet | 1 | esteira vermelha em `c400e04`/`742dee0`; `:165` e `:423` lentos por construção, cada caso virou dois (3,3–8,7 s), 96 execuções verdes; `infra-guardian` e `test-engineer` na 1ª; turno parado pela queda da API às 11h55 |
| 6.0 | `5762f90` → `b90c204` | Sonnet | 3 | `ESCALADA` (test-engineer r1 e r2), diagnóstico do Arquiteto (`diagnostico-6.md`), aprovado na 3ª; turno parado pela queda da API às 11h54 e retomado; encontro em CONFLITO com a 12.0 em `techspec.md`, resolvido pela correção `encontro-6` (1 rodada); a navegação acende Criados no documento aberto (techspec §9) |
| 8.0 | `9d6bcb5` | Sonnet | 2 | os quatro aprovaram na 1ª com recomendações, aplicadas na 2ª; 22 mutações; 14 fotos |
| 12.0 | `03806c1` | Sonnet | 2 | test-engineer reprovou na 1ª e aprovou na 2ª; os outros na 1ª; 41 mutações; e2e alterados 3x, 132 verdes; divergências (techspec §9) e 12 recomendações sem aplicar no documento |
| 7.0 | `ebff7f6` | Sonnet | 2 | frontend-reviewer, test-engineer e revisor-geral aprovaram na 2ª; `avisos.tsx` também mudou (a frase da suspensão apontava para Ferramentas, agora Criados), registrado em Divergências e na techspec §9 |
| correção `2026-10-19-pecas-sobrepor-tema-escuro-estoura-o-prazo` | `c5bcb52` | Sonnet | 2 | esteira de `91acc6d` (depois da 14.0) vermelha só em `pecas-sobrepor.spec.ts:556` [celular], 31,7 s; um caso por peça, 4 a 5 s; frontend-reviewer na 1ª, test-engineer na 2ª |
| 5.0 | `9fde9be` | Sonnet | 2 | `revisor-geral` e `test-engineer` reprovaram na 1ª (07h41, 3h30 depois da partida, 5+ portões antes); o Implementador avisou que `CartaoDeFerramenta.tsx:46` conflitaria com a 4.0, mas o encontro juntou sem conflito; e2e em 1 180 casos, 196-197 por fatia; a barra de baixo a 360 px corta "FERRAMEN…" (`TODO.md`) |
| 14.0 | `c2b9e34` → `b0ba717` | Sonnet | 2 | `test-engineer` reprovou na 1ª; encontro em CONFLITO com a 10.0 (`aprovar.test.ts`, `roteiro-da-demonstracao.spec.ts`), resolvido pela correção `encontro-14` (2 rodadas; recomendações para o `TODO.md` e o `/validar`: fotos de "Revisar a correção" com entrega pendente) |
| 10.0 | `2b8e78e` → `8cf865e` | Sonnet | 2 | 7ª fatia do e2e antes (correção `2026-10-19-setima-fatia-do-e2e`, `52f43fe`, 2 rodadas); encontro em CONFLITO com a 9.0 em `rotas.tsx`, resolvido pela correção `encontro-10` (1 rodada; 3 recomendações do frontend-reviewer no `TODO.md`, teste sobre os chunks do build para o `/retro`) |
| 4.0 | `a7d86a8` | Sonnet | 2 | divergências no documento e na Tech Spec §9/§10 (prop `icone` no MotorFormulario, AvisoDeIA também no Início, recomeço no `professor-sino.spec`); cartão aberto da D18 sem foto (a vitrine não tem proposta) |
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
- 19/10 ~15h30: encontro da linha 3 (13.0, `64bb2aa`) em CONFLITO com a spec em `techspec.md`; correção `encontro-13` na linha.
- 19/10 ~14h30: esteira vermelha em `0559707` e `d0b0a7d` em `a2-assistente.spec.ts:86` [chromebook, celular]: 6 `Gabarito` onde o teste espera 5, determinístico desde a 6.0; nenhuma linha viu porque o e2e não estava entre os alterados. Correção na linha 1.
- 19/10 ~12h25: encontro da linha 2 (6.0, `5762f90`) em CONFLITO com a spec em `techspec.md` (§9, a navegação que acende Criados); correção `encontro-6` na linha.
- 19/10 ~11h55: a API caiu (ECONNREFUSED) e parou o turno do `Implementador` (correção `acesso-suspenso`, medindo com traço) e do `Implementador 2` (6.0, antes do portão). Rede de volta às 11h56; `PEDIDO de retomada` aos dois, na mesma sessão, e os dois retomaram. O `Implementador 3` passou sozinho (o `npm audit` falhou pela rede e ele rodou o portão de novo).
- 19/10 ~10h55: esteiras de `c400e04` e `742dee0` vermelhas: `acesso-suspenso.spec.ts:165` [celular] passa de 30 s nas duas; `escola-e-vinculos.spec.ts:423` [chromebook] na primeira. Correção na linha 1.
- 19/10 ~10h45: 6.0, `ESCALADA` da `Mesa 2`: `test-engineer` reprovou duas rodadas seguidas (bloqueante na r2: mutação da medida do topo do painel); diagnóstico pedido ao `Arquiteto`. O reinício dele descartou o texto não enviado que estava na caixa ("mata os dois órfãos e derruba o educa-teste").
- 19/10 ~08h: esteira de `91acc6d` (depois da 14.0) vermelha no `pecas-sobrepor.spec.ts:556` [celular], 31,7 s; correção na linha 1.
- 19/10 ~06h25: encontro da linha 2 (14.0) em CONFLITO com a spec em `aprovar.test.ts` e `e2e/roteiro-da-demonstracao.spec.ts`; correção `encontro-14` na linha.
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
