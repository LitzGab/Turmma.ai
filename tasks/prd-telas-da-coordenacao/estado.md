# Estado da execução — telas-da-coordenacao

## Agora
- **Espero (17/10 ~17h05):** duas correções da esteira de `91d4722` (39062201162, vermelha só nestes dois; 180 de 181
  em cada job), ambas 1ª tentativa, guardiões ditados no PEDIDO:
  - linha 1, `Implementador` (com a `Mesa`): **`w2-carregando-estoura-o-prazo`**, `e2e/areas.spec.ts:316`
    [chromebook]: 30 s estourados em `paginaNaoRola` (`e2e/__fixtures__/coordenacao.ts:98`, a espera pelo
    "Carregando" que a 11.0 pôs). Da 11.0. Guardião: `frontend-reviewer`.
  - linha 2, `Implementador 2` (com a `Mesa 2`): **`troca-de-escola-sem-ir-para-a-entrada`**,
    `e2e/painel-da-coordenacao.spec.ts:187` [chromebook]: 90 s esperando o link "Ir para a entrada" (linha 203);
    verde até `5ecda3f`, primeiro vermelho depois da 11.0. Guardiões: `frontend-reviewer`, `privacy-guardian`.
  Com os dois encontros: ler a esteira de `41600a2` (39064583848) e a dos encontros; sem vermelho, o commit
  "antes da validação" e o `Validador` reiniciado no andar (passo 8).
- **Encontrada às ~16h57:** a correção `material-processando-estoura-o-prazo` (`74cee48`, encontro em `41600a2`):
  `test.slow()` no caso de `e2e/material.spec.ts`; o caso somava ~31 s contra os 30 s do Playwright.
- **Encontrada às ~16h35:** a 11.0 (`492175f`, encontro em `91d4722`), a última: 14 de 14. Escalada do
  `test-engineer` resolvida com o diagnóstico do `Arquiteto` (`.processo/ordens/diagnostico-11.md`, na linha 1):
  `useEnvioUnico` soltava a trava pelo `onSettled` do `mutate`, que o `reset()` desliga.
- **Encontrada às ~14h40:** a 8.0 (`652932f`, encontro em `5ecda3f`). Esteira `c0993ac` (39050559368) **verde**; a de
  `5ecda3f` ler no encontro da 11.0. Achado da 8.0 para o Validador: a vitrine não tem material, a tabela com linhas e o
  painel só foram vistos pelo e2e (`TODO.md`, X2 8.0 (j)).
- **Encontrada às ~13h45:** a correção `casca-carregando-estoura-o-goto` (`5734676`, encontro em `c0993ac`). Causa
  provável no traço: os 11 pedidos de JS/CSS sem resposta em 30 s no Fast 3G, não a rota atrasada; se a trava voltar
  em outro caso, investigar o servidor estático da esteira (recomendação no documento, para o `/retro`).
- **Esteiras lidas (13h45):** `d3ec693`, `13ceeab` e `b0bf8f1` **verdes**. `c0993ac` (39050559368, com a correção do
  `casca:134`) na fila: ler no encontro da 8.0; vermelho ali é correção.
- **Dizer ao Joaquim no fechamento (achado da 10.0, para ele com o `infra-guardian`):** o EXPLAIN de
  `?estado=rejeitada` em Registros › IA levou 30,2 s com 60 mil entregas (subconsulta do grupo mínimo da A5, uma vez
  por candidata, quadrática); pendente daria ~100 min (conta); a lista sem filtro nunca foi medida. Está na seção
  "Plano do Postgres" de `10_task.md` e no `TODO.md`, com a saída proposta. Não bloqueou a tarefa; já dito a ele em 17/10 12h50.
- **Esteiras lidas (12h20):** `00bc6ec` e `7bfd99e` vermelhas no e2e 1/6 e 4/6 (o `estrutura:765` esperado); `033a871`
  vermelha só no `acesso-suspenso:169` (a correção da linha 2); `0646419` vermelha só no `casca:134` (a correção acima).
  A seguinte, em `d3ec693` (encontro da 7.0), ler no próximo encontro.
- **Maestri:** depois do reinício da máquina, o `maestri` não está no PATH do terminal do Orquestrador: usar
  `/tmp/.mount_MaestrKFhlcN/resources/cli/maestri`.
- **Encontrada (10h37):** a correção `lista-de-nomes-com-41-px` (`cc2188e`, encontro em `033a871`). A 13.0 não tinha
  sido marcada no `tasks.md` pelo commit dela; marquei (abaixo, "O que decidi"), e o quadro não pede mais linha 3.
  Presas atrás da 7.0: 8.0 e 11.0 (as duas preveem `e2e/roteiro-da-demonstracao.spec.ts`).
- **Histórico desta seção (já encontrado):** linha 1, o `RELATÓRIO` da **correção
  `2026-10-17-pagina-rola-depois-da-12`**: `e2e/areas.spec.ts:316` (W2, chromebook) falha isolado e sempre, "a página
  inteira rola a partir de 768 px: só o miolo deveria"; verde em `f279dde` (38996200178), e entre ele e `c325472` só
  entrou a 12.0 (`18ba26f`, que pôs `relative` no tr e no li de `Tabela.tsx`), 1ª tentativa. Guardiões ditados:
  `frontend-reviewer`. Depois do encontro dela, a linha 1 parte a **13.0** (o quadro já a liberou).
  **17/10 ~03h50, retomada (2ª instrução, mesma correção):** a DIVERGÊNCIA de portão mostrou que a causa não é a 12.0
  (falha local igual em `f279dde`; e2e verde em 38999161158). Mandei corrigir o layout da Analista para o miolo rolar
  em vez de o main crescer (a página só cabe em 768 px pela fonte da esteira), sem mexer no teste, e renomear a correção.
- **A conferir na esteira de `80a4bf8` (39002645989):** a de `c325472` (38999161158) deu e2e verde; o vermelho dela
  foi só a unidade `tools/processo/linhas.test.ts` (ENOTEMPTY no rmdir do tmp, intermitente; em `80a4bf8` o verificar
  passou). Se voltar, é correção de processo. A privacidade:295 já tem a correção `190d788` em `80a4bf8`. Se ela cair no chromebook aos 90 s,
  ler o trace antes de subir prazo (ATENÇÃO 2 do relatório, no documento da correção)
  Linha 2: a correção `encontro-5` (`76a1f1f`, conflito do `TODO.md` da 5.0) se encontrou às ~02h09; a linha 2
  parte o que o quadro liberar.
- **Ao partir a 7.0** (achado da 9.0): alinhar o texto de 'nome não carregado' da Alocação com o da lista da turma
  ('Nome não carregado')
- **Ao partir a 11.0** (observação do PEDIDO, achado da 3.0): `paginaNaoRola` aceita a primeira amostra (mesmo com
  "Carregando…"), e `/coordenacao/agentes` ainda rola a página a 1366 × 768; ajustar junto os comentários de
  `e2e/areas.spec.ts`
- **A conferir na esteira de `f279dde` em diante** (`a3d5b2f` deu vermelho em casca W12 e acesso-suspenso:169,
  corrigido pela `casca-procura-governanca`, `7ad1e07`, encontro em `f279dde`; o acesso-suspenso:169 não
  reproduziu 10/10 e ficou no `TODO.md`, se voltar é correção com `test.slow()`). `8d43fe7` e `7dd9fae` ainda
  não têm a correção: vermelho só na casca W12 ali é esperado. Em `f279dde` em diante, qualquer vermelho é
  correção. A correção `68941e8` (encontro em `a3d5b2f`)
  cobre a estrutura:294 e a professores:220 no celular (o sino relia na montagem). A privacidade:298 (hoje :295) voltou em
  38994595783 (`8d43fe7`, celular, prazo do teste de 30 s): é a correção da linha 1, acima. O W6 do Uso (14.0) no chromebook também não caiu em 38977792982
- **Devo ainda:** no fechamento, linha no `TODO.md`: o sino da 1.0 soma pedaços e 6 leituras a cada recarga de
  página da coordenação (custo real no perfil lento, achado da correção da aba das empresas). A X3 e a X4 continuam paradas por pedido do Joaquim (a X4 no andar
  "X4 telas-do-aluno-e-primeiro-acesso", com a 1.0 em `1477850`): não retomar sem a palavra dele
- **Base:** `spec/telas-da-coordenacao` em `b0bf8f1` (encontro da 10.0), com a `develop` de `2029703` (X1 pousada, mockup e retro) juntada

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| 1.0 | `694f9d4` | Sonnet | 3+ | conduzida fora do Maestri pelo "Claude Code #2" (`conduzir.mjs`), em 16/10 de manhã; a X2 foi parada às 09h40 e retomada às ~14h15 |
| 14.0 | `d289c98` | Sonnet | 3 | linha 2, 15h07–18h15; escalada do `test-engineer` (r1, r2) com diagnóstico do Arquiteto (faltavam mutações declaradas), aprovada na r3; cherry-pick da sexta fatia (`c2965ac`); a Mesa não fotografou a operação (a vitrine não a cobre): **a validação refotografa** `/operacao` e `/operacao/uso`; linha nova no `TODO.md` (coluna Uso com turmas 0) |
| 2.0 | `229da54` | Sonnet | 2 | linha 1, 15h06–19h15; DIVERGÊNCIA de portão (sexta fatia, `9d9985f`), de carga (fila entre linhas) e de desenho (opção (b), techspec em `8e45a1d`); `revisor-geral` e `test-engineer` reprovaram na r1. Para a retro: `tools/ci/e2e.ts --repeat-each` roda a suíte inteira (33 min), use `npx playwright test`; e2e a 2 workers estoura 30 s na entrada compartilhada com carga 9+; o Painel lê a chave do resumo com observador simples (TODO da r2) |
| 3.0 | `3be23c9` | Sonnet | 2 | linha 2, 19h47–22h20; `frontend-reviewer`, `revisor-geral` e `test-engineer` reprovaram na r1; achados para a 12.0 (pedido ao Arquiteto) e para a 11.0 (no "Agora"); encontro em `cb8968e` |
| correção tentar-de-novo-da-estrutura-no-celular | `68941e8` | Sonnet | 2 | linha 1, 19h26–22h40; cobre também professores:220; ~2h25 perdidas num laço de `pgrep` que casava consigo (ver "O que falhou"); `test-engineer` reprovou na r1; encontro em `a3d5b2f` |
| 4.0 | `95b775e` | Sonnet | 3 | linha 2, 22h16–23h50; correção das guardas antes dela (`bb6a890`, prazo de 60 s); `test-engineer` e `revisor-geral` aprovaram na r3; encontro em CONFLITO no `TODO.md`, resolvido pela correção `encontro-4` (`3beffaa`); encontro em `7dd9fae` |
| 9.0 | `a8335f0` | Sonnet | 2 | linha 1, 22h22–23h35; r1 aprovou com recomendações (`.processo/ordens/9_task-r1.md`), r2 aprovada por todos; a lista da turma a 1366 px não mostra a tabela no miolo que rola (linha no `TODO.md`); achados para a 5.0 e a 7.0 no "Agora"; encontro em `8d43fe7` |
| correção casca-procura-governanca | `7ad1e07` | Sonnet | 2 | linha 1, ~23h40 até o encontro às 23h46; só `e2e/casca.spec.ts` (o W12 procurava 'Governança', trocada pela 3.0); acesso-suspenso:169 não reproduziu 10/10, registrado no `TODO.md`; `revisor-geral` e `test-engineer` aprovaram na r2; encontro em `f279dde` |
| 12.0 | `18ba26f` | Sonnet | 2 | linha 1, 23h46–00h10; `frontend-reviewer` e `privacy-guardian` aprovaram na r1, `test-engineer` e `revisor-geral` na r2; 7 fotos com pedidos semeados à mão (a vitrine não os semeia); aviso ao encontro: `Tabela.tsx` leva o mesmo `relative` que a 5.0 e a techspec §9 ganhou uma frase no parágrafo que a 5.0 pode tocar; encontro em `c325472` |
| correção abas-das-empresas-estoura-o-prazo | `190d788` | Sonnet | 1 | linha 1, 00h33–01h20; `test.setTimeout(90_000)` no teste das duas abas (duas cargas de página no celular); 16/16 em 4×2; `frontend-reviewer` e `test-engineer` aprovaram na r1; achou o areas:316 da 12.0; encontro em `80a4bf8` |
| 5.0 | `738c3c4` | Sonnet | 2 | linha 2, ~23h41–02h03; `frontend-reviewer` aprovou na r1, `test-engineer` e `revisor-geral` reprovaram na r1 e aprovaram na r2; 14 fotos da Mesa; também viu o areas:316 (Analista, +10 px), que é a correção em curso na linha 1; encontro em CONFLITO no `TODO.md` (correção `encontro-5`) |
| correção pagina-rola-depois-da-12 | `74dcace` | Sonnet | 2 | linha 1, 01h28–02h10; a causa não era a 12.0: a Analista não tinha miolo e rolava inteira com a fonte local (778 × 768); `frontend-reviewer` aprovou na r1, `test-engineer` na r2; duas linhas no `TODO.md` (sombra do miolo, texto do areas:347) |
| correção encontro-5 | `76a1f1f` | Sonnet | 1 | linha 2, 02h04–02h09; as três linhas do fim do `TODO.md` mantidas; `test-engineer` e `revisor-geral` aprovaram na r1 |
| 6.0 | `290b7cb` | Sonnet 5.5 | 2 | 1ª rodada reprovada (`revisor-geral`, `test-engineer`: e2e do sino com o botão antigo, mutação do `replace`); retomada depois da queda das 03h13 |
| 13.0 | `a81d2e0` | Sonnet 5.5 | 2 | linha 2; 1ª rodada reprovada (`test-engineer`); 29 mutações vermelhas; sem aplicar: 4 linhas no `TODO.md` e a tabela copiada para o documento; `e2e/privacidade.spec.ts:361` caiu uma vez no celular (reload, 20 s) e passou em seguida; contêineres Dead do `educa-teste-2` removidos; encontro em `7bfd99e` |
| correção lista-de-nomes-com-41-px | `cc2188e` | Sonnet | 1 | linha 1, ~10h10–10h37; o link da linha da Estrutura (5.0) era inline, ganhou `inline-flex min-h-11` e `wrap-anywhere`; `frontend-reviewer` e `test-engineer` aprovaram na r1; encontro em `033a871` |
| 7.0 | `b8e425d` | Sonnet 5.5 | 2 | linha 2, ~10h27–11h40; `frontend-reviewer` ajustes r1 e aprovado r2, `privacy-guardian` aprovado, `test-engineer` e `revisor-geral` reprovado r1 e aprovado r2; 8 fotos da Mesa; mexeu em `PainelLado.tsx` (tabIndex 0 no miolo); a observação da 9.0 ficou sem o que alinhar (a lista da Alocação saiu); recomendações no `TODO.md` (X2, 7.0); encontro em CONFLITO no `Estrutura.test.tsx`, resolvido pela correção `encontro-7`; encontro em `d3ec693` |
| correção encontro-7 | `e5012a4` | Sonnet 5.5 | 1 | linha 2, ~11h45–12h15; mantidos o it.each dos 44 px (`cc2188e`) e o teste novo do Nova turma; `frontend-reviewer` e `test-engineer` aprovaram na r1; 2 recomendações da vitrine no documento |
| correção duas-abas-do-acesso-suspenso | `8c7f3a7` | Sonnet 5.5 | 2 | linha 2, ~12h11–12h40; corrida do teste (a 2ª aba levava o 403 antes da 1ª), não o teto de 30 s; espera por zero requisições a caminho, 40 de 40 nos dois perfis; `frontend-reviewer` aprovado r1, `test-engineer` reprovado r1 e aprovado r2; `TODO.md` com as duas folgas do `test-engineer`; encontro em `13ceeab` |
| 10.0 | `76079c9` | Sonnet 5.5 | 2 | linha 1, ~10h34–12h48; `frontend-reviewer` e `conformidade-reviewer` aprovaram na r1, `test-engineer` e `revisor-geral` na r2; 9 fotos da Mesa; EXPLAIN de `?estado=rejeitada` em 30,2 s com 60 mil entregas (quadrático, da A5), na seção "Plano do Postgres" da tarefa e no `TODO.md`, para o Joaquim com o `infra-guardian`; encontro em `b0bf8f1` |
| correção casca-carregando-estoura-o-goto | `5734676` | Sonnet 5.5 | 1 | linha 2, ~12h40–13h45; sem vermelho determinístico (50 de 50 antes); traço da esteira: JS/CSS sem resposta no Fast 3G, hipótese não confirmada; depois 60 de 60 no caso e 132 de 132 no spec; `frontend-reviewer` e `test-engineer` aprovaram na r1; 2 recomendações para o `/retro`; encontro em `c0993ac` |
| 8.0 | `652932f` | Sonnet 5.5 | 2 | linha 1, ~12h50–14h40; `frontend-reviewer`, `privacy-guardian`, `test-engineer` e `revisor-geral` aprovaram na r2; corrigiu defeito real (o cancelar do seletor de arquivo fechava o diálogo e apagava o formulário); 53 mutações vermelhas; recomendações no documento e no `TODO.md` (X2, 8.0), com o corte a 360 px de "De quem é o material"; tabela com linhas e painel vistos só pelo e2e; encontro em `5ecda3f` |
| 11.0 | `492175f` | Sonnet 5.5 | 3 | linha 1, ~14h36–16h35; `test-engineer` reprovou na r1 e na r2 (na r2, defeito real: o `reset()` da retomada deixava o `useEnvioUnico` travado) → `ESCALADA` da Mesa, diagnóstico do `Arquiteto` (`diagnostico-11.md`: soltar a trava pela promessa do `mutateAsync`), par reiniciado; os quatro revisores aprovaram na r3; 18 fotos; tabela "Sem aplicar" (r1 + r3) no documento; encontro em `91d4722` |
| correção material-processando-estoura-o-prazo | `74cee48` | Sonnet 5.5 | 1 | linha 1, ~16h23–16h57; vermelho da esteira de `5ecda3f` em `e2e/material.spec.ts:180` (chromebook): o caso somava ~31 s (preparo 21 s, troca 5,5 s, espera 4 s) contra 30 s; só `test.slow()`; vermelho 4/4 com 18 s antes, 20/20 depois; `test-engineer` e `frontend-reviewer` aprovaram na r1, e o `test-engineer` de novo na r2 (16h55); encontro em `41600a2` |

## Esperando o Joaquim
## O que falhou
- 16/10 — encontro da 4.0 (linha 2): CONFLITO no `TODO.md` com a spec; correção `encontro-4` na própria linha.
- 16/10 18h00–18h38: a correção da linha 2 ficou 37 min parada num laço de espera que nunca saía: `pgrep -f` sem
  colchete acha a própria linha do `zsh -c`. Ao mandar uma linha esperar a outra, escreva o padrão já com colchete
  (`[p]ortao-local.ts`); a linha 1 tinha caído no mesmo erro às 17h15 e se corrigiu sozinha
- 16/10 ~19h00–19h38: impasse entre as linhas. O colchete não basta: o laço da linha 2 tinha, na própria linha de
  comando, o caminho da `--l1` e depois "playwright" (no comando que vinha após o laço), e casava consigo; o da linha
  1 esperava esse laço. Desfeito mandando a linha 2 rodar sem laço. Lição: **só uma linha espera, a outra roda
  direto**; ou o padrão casa só com o processo do Playwright (`node_modules/.bin/[p]laywright`), nunca com texto que o
  próprio laço carrega. Fila entre linhas devia ser trava de arquivo no `tools/processo/`, não `pgrep` (para a retro)
- 16/10 19h43–22h08: a correção da linha 1 perdeu ~2h25 num laço de espera (`pgrep -f` com `--l2.*[p]laywright test`)
  que casava com a própria linha de comando, pela terceira vez no dia. Eu mesmo deixei passar em duas vigias, lendo
  "espera a linha 2" sem olhar o que o laço achava. Para a retro: a fila entre linhas tem de ser trava de arquivo
- 17/10 02h02–02h08: a `Mesa` (linha 1) escreveu o RELATÓRIO aprovado da `pagina-rola` só no próprio terminal, sem
  `maestri ask`; o `Implementador` ficou esperando. A vigia viu e pedi à Mesa que o enviasse. Segundo conflito
  seguido no fim do `TODO.md` (encontro-4, encontro-5): para a retro, linhas novas do `TODO.md` em seção por tarefa
- 17/10 ~11h45 — encontro da 7.0 (linha 2): CONFLITO em `Estrutura.test.tsx` com a correção `cc2188e` (linha 1);
  correção `encontro-7` na própria linha.
- 17/10 ~12h — 10.0 (linha 1): o `Implementador` rodou o portão da correção com a linha 2 ativa (ambientes
  separados, passou) e disparou sem querer uma rodada de e2e com a suíte inteira, que caiu em specs de outras áreas
  por carga (a governança, 16/16). Para a retro: o e2e da tarefa só com os arquivos dela (`npx playwright test <arquivo>`).
## O que decidi sem perguntar
- 17/10 ~03h50: DIVERGÊNCIA de portão do `Implementador` na correção `pagina-rola-depois-da-12`: areas:316 falha local
  também sem a 12.0 (+10 px na Analista) e passa na esteira. Ele perguntou se fechava sem correção; não fechei: a tela
  depender da métrica da fonte para não rolar é defeito real no Chromebook (fonte diferente da esteira), e deixaria o
  portão local vermelho na 11.0, que mexe em `e2e/areas.spec.ts`. A correção segue, com o motivo novo
- 16/10 ~22h25: o quadro pediu uma terceira linha para a 9.0; não abri. Desde as 17h15 as linhas rodam em fila por
  carga (e2e estoura 30 s com load 9+), e uma terceira linha só somaria espera. Reabro a pergunta se a máquina folgar
- 17/10 00h37: o quadro pediu a terceira linha para a 13.0; não abri, pelo mesmo motivo (load 9,2, a correção da
  linha 1 repetindo o e2e). A 13.0 parte na linha 1 depois do encontro da correção
- 16/10 ~22h25: a professores:220 [celular] foi para a correção da linha 1 e não virou correção própria na linha 2: o
  sintoma é o mesmo da estrutura:294 (o "Tentar de novo" no celular) e duas correções na mesma peça dariam conflito
  no encontro. Com a correção da linha 1 em curso desde antes, a 4.0 partiu na linha 2, como a 3.0 partiu às 19h47
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
- 16/10 ~23h15: DIVERGÊNCIA de portão do `Implementador 2` na 4.0: `guardas.test.ts` ('a guarda conhece as mesmas
  chaves que o redact do logger remove') estoura 5000 ms no import dinâmico de `@educa/nucleo` com a máquina em load
  10 a 24 (Playwright da linha 1); falhou nos dois portões da 2ª ordem, passa isolado. Pelo passo 6, virou correção na
  linha 2 antes de retomar a tarefa, com o par reiniciado e os arquivos da 4.0 fora dela; ditei só `test-engineer` e
  `revisor-geral` (`privacy-guardian` se a asserção ou o logger mudar), porque o que muda é o tempo

- **17/10 10h10, vigia:** o `Implementador 2` (13.0) esperava desde 09h40 num laço `while pgrep -f "tools/ci/e2e.ts|portao-local.ts"`,
  que casava com a própria shell e nunca terminaria; ele achava que outra linha usava o `educa-teste-2`. Matei o laço e mandei
  repetir os e2e (a L2 é o ambiente 2, a L1 o 1). Também: a queda das 03h13 foi reinício da máquina, não só do Maestri.
- **17/10 10h30:** com a correção do `estrutura:765` já em curso na linha 1, parti a 7.0 na linha 2, como o quadro pediu, em vez de esperar o encontro da correção (o passo 6 pede a correção antes da partida, e ela já partiu). A 7.0 não toca a lista de nomes da 5.0.
- **17/10 10h37:** o commit da 13.0 (`a81d2e0`) não marcou a tarefa no `tasks.md`, e o quadro a dava sem linha. Revisões dela aprovadas na r2 e encontro feito em `7bfd99e`: marquei a 13.0 e as subtarefas num commit de documento meu, em vez de reabrir a linha 2, que está na 7.0.
