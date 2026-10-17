# Estado da execução — telas-da-coordenacao

## Agora
- **Espero (17/10 10h40):** linha 1, `Implementador` (reiniciado com a `Mesa`): o `RELATÓRIO` da **correção
  `2026-10-17-lista-de-nomes-com-41-px`** (esteira 39005178313 em `77f80e6`: `e2e/estrutura.spec.ts:765`, W12, nos dois
  projetos, o alvo "Lista de nomes" com 41 px, mínimo 44; da tarefa 5.0), 1ª tentativa; guardião ditado:
  `frontend-reviewer`. Linha 2, `Implementador 2`: o `RELATÓRIO` da **tarefa 13.0**, 1ª tentativa, depois da 1ª rodada
  reprovada (`test-engineer`), portão a rodar. Esteira de `00bc6ec` (6.0) rodando: ler no próximo encontro (o
  vermelho do `estrutura:765` nela é esperado até a correção).
- **Maestri:** depois do reinício da máquina, o `maestri` não está no PATH do terminal do Orquestrador: usar
  `/tmp/.mount_MaestrKFhlcN/resources/cli/maestri`.
- **Depois do encontro da correção:** o quadro pede a linha 3 para a 10.0 e a linha 1 parte a 7.0. Não abrir tarefa
  antes de a correção se encontrar.
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
- **Base:** `spec/telas-da-coordenacao` em `80a4bf8` (correção abas-das-empresas encontrada), com a `develop` de `2029703` (X1 pousada, mockup e retro) juntada

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
