# Estado da execução — telas-da-coordenacao

## Agora
- **Espero:** linha 1, `Implementador` (reiniciado com a `Mesa` às ~23h40): o `RELATÓRIO` da **correção
  2026-10-16-casca-procura-governanca** (esteira vermelha em `a3d5b2f`, run 38990594424: casca.spec.ts:673 W12
  coordenacao procura 'Governança', trocada pela 3.0; e acesso-suspenso.spec.ts:169 [chromebook] com 'session
  closed', a reproduzir), 1ª tentativa. Depois, o encontro dela e a 12.0 na linha 1.
  Linha 2, `Implementador 2` (reiniciado com a `Mesa 2`): a 4.0 entregou SUCESSO (`95b775e`, com a correção
  das guardas em `bb6a890`), mas o **encontro deu CONFLITO no `TODO.md`**. Pedida a **correção `encontro-4`**
  na linha 2 (merge da spec, resolve, portão, Mesa, commit da correção), 1ª tentativa. Depois, o encontro 2 de
  novo, e só então a esteira e o quadro.
  O ajuste do `12_task.md` (trocas de "Estrutura" no detalhe e nos textos dos pedidos, achado da 3.0) está na
  spec em `c2dab30`, sem dependência nova; a linha que partir a 12.0 o recebe na partida.
- **Ao partir a 5.0** (observação do PEDIDO, achado da 9.0): `Estrutura.tsx` pode importar `NOME_DO_TURNO` de
  `areas/coordenacao/nome-do-turno.ts` em vez da cópia local; `caminhoDoProfessor` está em `caminhos.ts` e
  `O_MIOLO_QUE_ROLA` em `miolo-que-rola.ts`
- **Ao partir a 7.0** (achado da 9.0): alinhar o texto de 'nome não carregado' da Alocação com o da lista da turma
  ('Nome não carregado')
- **Ao partir a 11.0** (observação do PEDIDO, achado da 3.0): `paginaNaoRola` aceita a primeira amostra (mesmo com
  "Carregando…"), e `/coordenacao/agentes` ainda rola a página a 1366 × 768; ajustar junto os comentários de
  `e2e/areas.spec.ts`
- **A conferir na esteira de `a3d5b2f` em diante** (`a3d5b2f` deu vermelho: correção da linha 1 acima; `8d43fe7` rodando): a correção da linha 1 (`68941e8`, encontro em `a3d5b2f`)
  cobre a estrutura:294 e a professores:220 no celular (o sino relia na montagem). As esteiras de `cb8968e` e
  `c2dab30` ainda não a têm: vermelho só nesses dois ali é esperado. Em `a3d5b2f` em diante, qualquer vermelho é
  correção. A privacidade:298 tem outra causa (o Implementador não tocou) e não caiu em 38977792982; se voltar,
  é correção própria. O W6 do Uso (14.0) no chromebook também não caiu em 38977792982
- **Devo ainda:** no fechamento, linha no `TODO.md`: o sino da 1.0 soma pedaços e 6 leituras a cada recarga de
  página da coordenação (custo real no perfil lento, achado da correção da aba das empresas). A X3 e a X4 continuam paradas por pedido do Joaquim (a X4 no andar
  "X4 telas-do-aluno-e-primeiro-acesso", com a 1.0 em `1477850`): não retomar sem a palavra dele
- **Base:** `spec/telas-da-coordenacao` em `8d43fe7` (9.0 encontrada), com a `develop` de `2029703` (X1 pousada, mockup e retro) juntada

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| 1.0 | `694f9d4` | Sonnet | 3+ | conduzida fora do Maestri pelo "Claude Code #2" (`conduzir.mjs`), em 16/10 de manhã; a X2 foi parada às 09h40 e retomada às ~14h15 |
| 14.0 | `d289c98` | Sonnet | 3 | linha 2, 15h07–18h15; escalada do `test-engineer` (r1, r2) com diagnóstico do Arquiteto (faltavam mutações declaradas), aprovada na r3; cherry-pick da sexta fatia (`c2965ac`); a Mesa não fotografou a operação (a vitrine não a cobre): **a validação refotografa** `/operacao` e `/operacao/uso`; linha nova no `TODO.md` (coluna Uso com turmas 0) |
| 2.0 | `229da54` | Sonnet | 2 | linha 1, 15h06–19h15; DIVERGÊNCIA de portão (sexta fatia, `9d9985f`), de carga (fila entre linhas) e de desenho (opção (b), techspec em `8e45a1d`); `revisor-geral` e `test-engineer` reprovaram na r1. Para a retro: `tools/ci/e2e.ts --repeat-each` roda a suíte inteira (33 min), use `npx playwright test`; e2e a 2 workers estoura 30 s na entrada compartilhada com carga 9+; o Painel lê a chave do resumo com observador simples (TODO da r2) |
| 3.0 | `3be23c9` | Sonnet | 2 | linha 2, 19h47–22h20; `frontend-reviewer`, `revisor-geral` e `test-engineer` reprovaram na r1; achados para a 12.0 (pedido ao Arquiteto) e para a 11.0 (no "Agora"); encontro em `cb8968e` |
| correção tentar-de-novo-da-estrutura-no-celular | `68941e8` | Sonnet | 2 | linha 1, 19h26–22h40; cobre também professores:220; ~2h25 perdidas num laço de `pgrep` que casava consigo (ver "O que falhou"); `test-engineer` reprovou na r1; encontro em `a3d5b2f` |
| 9.0 | `a8335f0` | Sonnet | 2 | linha 1, 22h22–23h35; r1 aprovou com recomendações (`.processo/ordens/9_task-r1.md`), r2 aprovada por todos; a lista da turma a 1366 px não mostra a tabela no miolo que rola (linha no `TODO.md`); achados para a 5.0 e a 7.0 no "Agora"; encontro em `8d43fe7` |

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
## O que decidi sem perguntar
- 16/10 ~22h25: o quadro pediu uma terceira linha para a 9.0; não abri. Desde as 17h15 as linhas rodam em fila por
  carga (e2e estoura 30 s com load 9+), e uma terceira linha só somaria espera. Reabro a pergunta se a máquina folgar
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
