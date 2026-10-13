# Estado da execução — pele-e-casca (X1)

> Este diário foi aberto fora do Maestri, pela sessão "Claude Code #2", na noite de 12 para 13/10/2026: o Joaquim
> pediu as specs do mockup de outubro, delegou as decisões ("você pode tomar todas as decisões para o projeto, eu
> Joaquim permito") e foi dormir. A decisão é a D80. O Orquestrador assume a partir daqui: o caminho está em "Para
> uma sessão limpa".

## Agora
- **Espero:** o `RELATÓRIO` do `Implementador`, da **5.0** (porte grande), na **linha 1**, 1ª tentativa, pedida em
  13/10/2026 às 13h13 (a 4.0 se encontrou às 13h11, em `6627aea`). Checkout da linha: `~/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1`, branch
  `spec/pele-e-casca--l1`, ambiente de teste 1, com o `Implementador` e a `Mesa`. O pedido foi com a observação
  **"sem push"**: o commit da tarefa fica local
- **Devo ainda:** (1) **tudo local, por decisão do Joaquim** (13/10, 08h50: "pode ficar local"): nenhum push, de
  ninguém, até ele mandar. O `linhas.ts encontro` não tem opção sem push: rodá-lo com o endereço de push trocado só
  naquele comando (`GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=remote.origin.pushurl GIT_CONFIG_VALUE_0=/dev/null/sem-push`
  na frente do `node`), e a saída esperada é "O PUSH FALHOU", que aqui é o certo: o encontro está feito. Não rodar o
  `esteira.ts`: sem branch no GitHub não há esteira. No lugar dela, o portão completo local
  (`portao-local.ts --e2e --infra`) uma vez, antes da validação (passo 8 do `/seguir`, "Sem GitHub"). Todo `PEDIDO`
  de tarefa leva a observação "sem push"; (2) a 3.0 é tronco e segura as outras doze; da 4.0 em diante o quadro
  autoriza linhas, mas **uma linha só** até o Joaquim dizer o contrário
  (limite de uso); (3) nada mais sobre a revisão de spec da X3 e da X4: as duas **já têm revisão aprovada** pelos
  seis guardiões, quatro rodadas cada, feita pelo "Claude Code #2" a pedido do Joaquim e trazida para esta branch em
  13/10/2026 (`2f63ce0`, `7334f79`, `92cc7e5`; o Joaquim deu a palavra neste terminal: "pode"). Não repetir antes de
  cada uma começar. As decisões de desenho tomadas por delegação nelas estão na seção 12 da Tech Spec de cada uma
  (12b na X4) e no item "(D80) Decisões que tomei por delegação" do `TODO.md`: são do Joaquim rever, e não seguram
  nada
- **Mockup de outubro** (as tarefas citam "Mockup: /fundamentos" e outras rotas): roda com
  `./node_modules/.bin/vite --host 127.0.0.1 --port 5190 --strictPort` dentro de
  `~/Documentos/git/Prototipo_Turmma/mockups`. Em 13/10 estava de pé na 5190 pela sessão do "Claude Code #2", e cai
  quando ela fechar: quem precisar, sobe de novo
- **Limite de uso:** 81% do limite semanal às 07h48 de 13/10; zera em 15/10 às 15h. Uma linha, poucos agentes
- **A spec da X1 está APROVADA** pelos seis revisores (rodada 4, 13/10/2026 02:09, `revisao-spec.md`). As
  recomendações que sobraram estão na seção da rodada 4 e entram como subtarefa ou cenário na tarefa de cada uma
- **Como o Orquestrador assumiu:** em 13/10/2026, 08h20, com a palavra do Joaquim no terminal dele ("pode"). O andar
  "X1 pele-e-casca" nasceu da branch que já existia (`--existing-branch`), em
  `~/Documentos/git/.maestri/floors/educaia--specpele-e-casca`, e a `develop` (`e278845`) entrou por merge, sem
  conflito (`65ab3b1`). A 1.0 e a spec correram fora do Maestri, num checkout avulso já desfeito
- **Base:** `spec/pele-e-casca` em `e1927a3`, com a 4.0; a linha 1 partiu dela para a 5.0. O quadro pede mais uma
  linha para a 9.0: não abrir (uma linha só, item 2 acima). Nada foi enviado ao GitHub: push é do Joaquim

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| D80 e o `docs/interface.md`, Parte B | `32c9bf3` | Opus | não se aplica | só documento: decisão, ROADMAP (X1 a X4 antes do F2), TODO e o documento de interface |
| Revisão de spec da X2 | `c4338f0` | Sonnet conduz, guardiões em Opus | 4 | aprovada pelos seis; a onça saiu do vazio do sino e a mascote de corpo inteiro ficou como decisão do Joaquim |
| 1.0 | `81cc95d` | Opus, fora do Maestri | 7 | dois `BLOQUEIO` do `revisor-geral` (3ª e 6ª rodadas), os dois destravados pelo Joaquim; o `frontend-reviewer` aprovou desde a 1ª e o `test-engineer` desde a 2ª, com uma reprovação na 4ª por dois blocos de mutação; 17 mutações vermelhas |
| 2.0 | `080f90c` | Sonnet 5.5 | 2 | linha 1, das 08h29 às 09h58 de 13/10; na 1ª rodada o `revisor-geral` e o `test-engineer` reprovaram (sete itens: `colorScheme` e vitrine sem dono, a medida em brotli, cláusulas sem bloco de mutação), na 2ª os quatro aprovaram; 29 mutações vermelhas; sem push |
| 3.0 | `76e3a02` | Sonnet 5.5 | 2 | linha 1, das 09h58 às 12h15 de 13/10; na 1ª rodada o `conformidade-reviewer`, o `revisor-geral` e o `test-engineer` reprovaram (a guarda "grafite só onde é oficial", os cenários U3 e U4, nove cláusulas sem bloco de mutação), na 2ª os quatro aprovaram; `--repeat-each 3` dos e2e alterados com 492 de 492; sem push |
| 4.0 | `6627aea` | Sonnet 5.5 | 3 | linha 1, das 12h15 às 13h11 de 13/10; o `frontend-reviewer` aprovou na 1ª e na 2ª; o `test-engineer` reprovou na 1ª (a opção desligada sem asserção nem bloco de mutação) e aprovou na 2ª; o `revisor-geral` aprovou na 1ª, reprovou na 2ª e aprovou na 3ª, chamado sozinho; o contexto do Implementador compactou aos 15 minutos; primeiro carregamento em 128,3 kB brotli (teto 150); 55 mutações vermelhas; sem push |
| 5.0 | `3ba0608` | Sonnet 5.5 | 2 | linha 1, das 13h13 às 13h54 de 13/10; o `frontend-reviewer` e o `revisor-geral` aprovaram na 1ª e na 2ª; o `test-engineer` reprovou na 1ª e aprovou na 2ª; a Mesa viu 58 fotos (galeria clara e escura, celular e computador); primeiro carregamento em 128,2 kB brotli (teto 150), `pecas-*` em 14,6 kB (teto 40); 42 mutações vermelhas; desvios do mockup (trilho da barra, fio da moldura) na Tech Spec, nos cenários e no `docs/interface.md`; ficou para a 10.0 o placeholder da `CaixaPedido` cortado a 360 px ("Sem aplicar" do `5_task.md`); sem push |
| PRD, Tech Spec e tarefas da X1 à X4 | `2ed7829` | Opus (as tarefas 8 a 15 da X1, 4 a 14 da X3 e 3 a 11 da X4, por agentes em Sonnet) | 4 da spec da X1 | só documento; a X2, a X3 e a X4 sem revisão de spec |

## Esperando o Joaquim

### 13/10/2026 08h35 — X1, encontro da tarefa 2.0 — RESPONDIDA às 08h50: tudo local ("pode ficar local")
Decisão: a branch da spec vai para o GitHub a cada tarefa, como o processo pede (D79), ou fica local até você mandar?
Contexto: o encontro (`linhas.ts encontro`) e o commit do Implementador fazem push, e é o push que dispara a
esteira. A branch nunca foi enviada, o repositório é público, e a pele vem do mockup de outubro, que é privado
(`TODO.md`, itens da D80). A 2.0 partiu sem push e não depende da resposta; o encontro dela depende
Opções: push a cada tarefa, com a esteira | tudo local, com o portão completo na máquina no lugar da esteira
Recomendo: push a cada tarefa, se o que já está na branch pode ficar público: sem ele a esteira não roda, e o
portão completo local custa de 30 a 70 minutos por vez

### 13/10/2026 — o que é dele, e não foi feito
- **Push** de `spec/pele-e-casca` e o **pouso** na `develop`
- **Trazer o mockup de outubro para `mockups/`**: o repositório `Prototipo_Turmma` é privado e o nosso é público. É
  decisão dele com o Gabriel (`TODO.md`, itens da D80)
- **Parecer de advogado** sobre a mascote (D58; Decreto 12.880, art. 11) e sobre trade dress (`TODO.md`)
- **Confirmar a D80**, que foi escrita por delegação: o que entrou do mockup, o que ficou de fora ("regra vence
  desenho") e o que cada fase seguinte deixa de fazer (`ROADMAP.md`, "A pele nova")
- **O RF22 do PRD** foi esclarecido na rodada 2 da revisão (a entrada, com a casca e os ícones de lugar, é comum a
  todos; a regra vale para o pedaço de cada área). É texto de critério de aceite: se ele quiser a outra saída (os
  ícones de cada papel fora da entrada), é tarefa nova na 9.0

## O que falhou
- **O limite de uso do plano estourou às 23:17 de 12/10**, com dez agentes em Opus ao mesmo tempo, e matou seis no
  meio. Voltou à 01:50. Dali em diante: poucos agentes, em Sonnet, e a implementação nesta sessão
- **Rodadas 1 e 2 da revisão da spec: REPROVADA.** A 1ª, por seis correções (avatar sem selo, onça sem condições,
  anel de foco sem cor, alvo de toque sem medida, armazenamento sem lista fechada, orçamento da entrada). A 2ª, por
  oito resíduos de coerência entre documentos e de teste que não amarrava a regra (o texto do botão desligado em
  duas cores, a onça dormindo no catálogo, `public/` ainda citado, pares de contraste que faltavam, RF6 e RF10 sem
  teste que caísse, RF22 contra a 7c, `2_task.md` sem o teste do script). A 3ª, por uma linha (o valor de
  `educa.lateral-recolhida` escrito `1`, e o código grava `sim`). A 4ª aprovou
- **1.0, `BLOQUEIO` da Mesa (13/10/2026 02:35):** o `revisor-geral` reprovou nas três primeiras rodadas, sempre na
  guarda de cor escrita à mão de `estilos.test.ts`, cada vez por um caso vizinho: a 1ª, a lista de nomes de
  propriedade deixava `background` e `boxShadow` de fora; a 2ª, a cor só era pega logo depois de `propriedade:`
  (escapavam a segunda camada da sombra e o segundo hex do gradiente); a 3ª, o hex entre colchetes era pulado, e
  `inset-shadow-[#fff]` não é classe que a guarda de classes conheça. O `frontend-reviewer` e o `test-engineer`
  aprovavam desde a 2ª. A causa é uma só: a regra era presa à posição ou à forma. Ficou total: a cor escrita é
  procurada no arquivo inteiro, sem exceção de posição, e a web tem uma só, a do QR. Para a retrospectiva: a
  primeira versão devia ter nascido assim
- **1.0, segundo `BLOQUEIO` (13/10/2026 08:13):** depois do destravado, o `revisor-geral` reprovou a 4ª, a 5ª e a
  6ª, e nenhuma por código: a Tech Spec, o `cenarios.md` e as subtarefas descreviam a guarda antiga, e foram
  corrigidos um de cada vez. Destravado com a mesma palavra do Joaquim, que estava acordado e foi avisado na hora;
  a 7ª aprovou. Para a retrospectiva: quando uma correção muda o desenho de um teste, conferir de uma vez todos os
  documentos que o descrevem
- **As sessões de revisão caíram às 02h40** com "Your organization has disabled Claude subscription access for
  Claude Code", no meio da revisão da X3. Às 07h49 voltaram a abrir. Não sei a causa
- **O portão da 1.0 rodou três vezes**, porque duas correções da revisão da spec mexeram na tabela de pares do
  `docs/interface.md`, que o teste de contraste lê. Nas três, verde
- **A revisão da spec caducou para o hook** assim que o portão da 1.0 aplicou as mutações no `estilos.css`: o hook
  mede a caducidade pela data do arquivo de código. Em andar do Maestri a spec é revista antes de existir código da
  tarefa; aqui as duas coisas correram na mesma árvore. O commit das specs não levou código
- **PRD e Tech Spec passam do teto de palavras** (2.189 e ~3.300): o que os revisores exigiram entrou no texto. O
  aceite está escrito no topo de cada um, por delegação

## O que decidi sem perguntar
- **Quatro specs, e não duas ou três:** X1 `pele-e-casca` (tokens, peças, casca, sem mudar endereço), X2
  `telas-da-coordenacao`, X3 `telas-do-professor`, X4 `telas-do-aluno-e-primeiro-acesso`. A X1 é o tronco; as
  outras três correm depois dela e não se tocam, uma por papel
- **A X1 não reagrupa a navegação nem muda endereço.** O e2e tem 179 afirmações de endereço e 114 idas pela
  navegação: o reagrupamento em até quatro lugares por papel vai com a spec de cada papel
- **Os 33 nomes de token antigos ficam, com valor novo**, ao lado dos nomes da D80. Nenhuma tela perde cor no meio
  do caminho, e cada tarefa troca as classes da peça dela
- **Três desvios do mockup, por contraste:** `borda-campo` (`#8f8f8f` no claro, `#6b7f88` no escuro), o
  `caramelo-fundo` do escuro (`#d4651f`) e o desligado em face `borda` com texto `apoio`
- **O véu do diálogo continua `rgba()` literal** até a 7.0: no Chrome anterior ao 122 o `::backdrop` não herda
  variável
- **A onça entra só como cabeça, só em `AssinaturaIA` e no balão da `MensagemIA`,** sempre com o nome da função e o
  selo "IA". A de corpo inteiro, a dormindo e a comemoração ficam para a X2 e a X4, com parecer do
  `conformidade-reviewer`
- **Medidas do botão: 44 e 36 px** (o `compacto`, 44 abaixo de 768), e não os 46 e 38 do mockup: é o que o e2e de
  hoje já mede
- **Nenhum laço de animação, nem o de "pensando"** (D59): o documento dizia o contrário dos testes, e os testes
  venceram
