# Estado da execução — pele-e-casca (X1)

> Este diário foi aberto fora do Maestri, pela sessão "Claude Code #2", na noite de 12 para 13/10/2026: o Joaquim
> pediu as specs do mockup de outubro, delegou as decisões ("você pode tomar todas as decisões para o projeto, eu
> Joaquim permito") e foi dormir. A decisão é a D80. O Orquestrador assume a partir daqui: o caminho está em "Para
> uma sessão limpa".

## Agora
- **Espero:** o `RELATÓRIO` do `Implementador`, da **12.0**, retomada às 18h55 depois da `ESCALADA` da `Mesa` (o `test-engineer` reprovou 2 vezes seguidas: a folga do anel de foco sem teste nem bloco), com a ordem `.processo/ordens/12_task-r2.md` e o diagnóstico do `Arquiteto` em `.processo/ordens/diagnostico-12.md` (linha 1); a próxima é a rodada 3. Mais uma reprovação do `test-engineer` é o limite das três: parada. Antes disso: o `RELATÓRIO` do `Implementador`, da **12.0**, retomada às 17h05 (`PEDIDO de retomada`, sessão nova) depois da correção `2026-10-15-anel-do-motor-sem-has` (`dd0daf7`, só na linha 1, sem encontro próprio: vai junto no encontro da 12.0). Antes, o `RELATÓRIO` do `Implementador`, da **12.0** (porte grande: até 4 horas sem a primeira rodada),
  na **linha 1**, 1ª tentativa, pedida em 15/10/2026 às 16h21 (a 11.0 se encontrou às 16h20: a spec está em `063f14c`,
  e o push falhou de propósito). O quadro pediu mais uma linha para a 14.0: não abri (uma linha só, item 2 abaixo). Checkout da
  linha: `~/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1`, branch `spec/pele-e-casca--l1`, ambiente
  de teste 1, com o `Implementador` e a `Mesa`. Todo pedido vai com a observação **"sem push"**: o commit da tarefa
  fica local. Depois da 12.0 parte a 13.0 (presa nela). **Para a validação:** a 7.0 deixou ao `/validar` o caso direto de `fechadoPeloNavegador` sob
  `StrictMode` ("Recomendações sem aplicar" do `7_task.md`); e os revisores da correção `quinta-fatia-do-e2e` (`71ff60f`, já na spec com a 6.0)
  deixaram ao `/validar` as recomendações recusadas na tabela de `tasks/correcoes/2026-10-13-quinta-fatia-do-e2e.md`;
  e a 8.0 deixou ao `/validar` ("Recomendações sem aplicar" do `8_task.md`): fotografar o RF10 com uma conversa do
  Tutor aberta, o botão "Abrir dado nominal de uma turma" quebrando em duas linhas a 360 px, e
  `/professor/nova-conversa` nos dois temas; e a 11.0 deixou o que está em "Recomendações sem aplicar" do `11_task.md`:
  conferir no fechamento se algo ali tem destino `TODO.md`
- **Devo ainda:** (00) no `PEDIDO` da **13.0**, a observação: "o diagnóstico da 12.0 (`.processo/ordens/diagnostico-12.md` da linha 1) põe na 13.0 o teste da gaveta com `usuarioDaSessao`; o Arquiteto o leva ao `13_task.md`": antes da partida da 13.0, peça ao `Arquiteto` que o acrescente ao documento dela; (0) **no fechamento, levar ao `TODO.md`** a 2ª linha de "Sem aplicar" de `.processo/ordens/2026-10-15-anel-do-motor-sem-has-r2.md` da linha 1 (repetir a asserção sem `has-` depois de marcar a caixa, em `pecas-revestidas.test.tsx`); a 1ª linha é da retrospectiva (modelo do documento de correção); (1) **tudo local, por decisão do Joaquim** (13/10, 08h50: "pode ficar local"): nenhum push, de
  ninguém, até ele mandar. O `linhas.ts encontro` não tem opção sem push: rodá-lo com o endereço de push trocado só
  naquele comando (`GIT_CONFIG_COUNT=1 GIT_CONFIG_KEY_0=remote.origin.pushurl GIT_CONFIG_VALUE_0=/dev/null/sem-push`
  na frente do `node`), e a saída esperada é "O PUSH FALHOU", que aqui é o certo: o encontro está feito. Não rodar o
  `esteira.ts`: sem branch no GitHub não há esteira. No lugar dela, o portão completo local
  (`portao-local.ts --e2e --infra`) uma vez, antes da validação (passo 8 do `/seguir`, "Sem GitHub"). Todo `PEDIDO`
  de tarefa leva a observação "sem push"; (2) a 3.0 é tronco e segura as outras doze; da 4.0 em diante o quadro
  autoriza linhas, mas **uma linha só** até o Joaquim dizer o contrário
  (limite de uso); (2a) a observação que o `PEDIDO` de cada tarefa leva: o da **12.0**: "quando o `Contador` ganhar a lateral, manter o chunk
  `pecas-estado`; está em 'Recomendações sem aplicar' do `6_task.md`", e mais: "a 9.0 deu ao
  `Ladrilho` o tamanho 36, que é o da lateral, e deixou os quatro ícones fora da entrada até a 12.0 ligá-los à casca
  (484 bytes em brotli, sem chunk `lugares-*`); leia 'Divergências' do `9_task.md`"; e o da **13.0**: "o `docs/interface.md`, na
  10.2, cita '12.0 e 13.0' para a gaveta da casca, e ela é só da 13.0; está em 'Recomendações sem aplicar' do
  `7_task.md`"; (2b) **no fechamento, levar ao `TODO.md`**, em "Marca e interface", o que a 7.0 deixou com esse
  destino e ainda não está lá: seis linhas, na tabela "Recomendações sem aplicar" do `7_task.md` e em
  `.processo/ordens/7_task-r2.md` da linha 1 (a lista do perigo cheio por arquivo e o detector textual; a ordem dos
  botões do rodapé entre as peças; o texto técnico da galeria; a cor do botão oficial só provada como "não
  vermelho"; o Tab preso do login por cima); e o que a **8.0** deixou com o mesmo destino ("Recomendações sem aplicar" do
  `8_task.md`): fechar `QUEM_IMPORTA_O_AVATAR` só na `AssinaturaIA`, com o aperto na `techspec.md` 7b (é do
  Arquiteto, e da retrospectiva), e o espaço dobrado (`ml-1`) e o `align-middle` sem asserção na casca do selo,
  que a 10.0 **não** fecha (estão em "Fora do escopo" do `10_task.md`, pela triagem do Arquiteto): vão ao `TODO.md`; e, para o Arquiteto ao escrever a tela que usar o `PainelLado` na X2 e
  na X3: `infra-guardian` obrigatório e foto do menu aberto dentro do diálogo; (3) nada mais sobre a revisão de spec da X3 e da X4: as duas **já têm revisão aprovada** pelos
  seis guardiões, quatro rodadas cada, feita pelo "Claude Code #2" a pedido do Joaquim e trazida para esta branch em
  13/10/2026 (`2f63ce0`, `7334f79`, `92cc7e5`; o Joaquim deu a palavra neste terminal: "pode"). Não repetir antes de
  cada uma começar. As decisões de desenho tomadas por delegação nelas estão na seção 12 da Tech Spec de cada uma
  (12b na X4) e no item "(D80) Decisões que tomei por delegação" do `TODO.md`: são do Joaquim rever, e não seguram
  nada
- **Mockup de outubro** (as tarefas citam "Mockup: /fundamentos" e outras rotas): roda com
  `./node_modules/.bin/vite --host 127.0.0.1 --port 5190 --strictPort` dentro de
  `~/Documentos/git/Prototipo_Turmma/mockups`. Em 13/10 estava de pé na 5190 pela sessão do "Claude Code #2", e cai
  quando ela fechar: quem precisar, sobe de novo
- **Limite de uso:** **94% do limite semanal às 14h32 de 13/10** (era 81% às 07h48); **acabou às 19h31 de 13/10**, com a
  primeira rodada da 10.0 em curso (os quatro revisores caíram com 429, nenhuma rodada registrada). Zerou em 15/10 às 15h:
  às 15h01 fechei o menu do limite na `Mesa` e no `Implementador`, e a `Mesa` refez a rodada 1 inteira, com a árvore
  igual à da foto, e a 10.0 fechou na 2ª. Uma linha, poucos agentes
- **A spec da X1 está APROVADA** pelos seis revisores (rodada 4, 13/10/2026 02:09, `revisao-spec.md`). As
  recomendações que sobraram estão na seção da rodada 4 e entram como subtarefa ou cenário na tarefa de cada uma
- **Como o Orquestrador assumiu:** em 13/10/2026, 08h20, com a palavra do Joaquim no terminal dele ("pode"). O andar
  "X1 pele-e-casca" nasceu da branch que já existia (`--existing-branch`), em
  `~/Documentos/git/.maestri/floors/educaia--specpele-e-casca`, e a `develop` (`e278845`) entrou por merge, sem
  conflito (`65ab3b1`). A 1.0 e a spec correram fora do Maestri, num checkout avulso já desfeito
- **Base:** `spec/pele-e-casca` em `063f14c` (o encontro da 11.0); a linha 1 partiu dela para a 12.0. O diário tem alterações sem commit desde o encontro da 11.0: o encontro da 12.0 as leva. Se o quadro
  pedir mais uma linha: não abrir (uma linha só, item 2 acima). Nada foi enviado ao GitHub:
  push é do Joaquim

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
| 6.0 | `542e583` | Sonnet 5.5 | 2 | linha 1, das 13h57 às 15h10 de 13/10, com a correção `2026-10-13-quinta-fatia-do-e2e` no meio (`71ff60f`, 2 rodadas, `infra-guardian`): `DIVERGÊNCIA` de portão às 14h22, porque os 42 casos do `e2e/pecas-estado.spec.ts` levaram a suíte a 818 e o teto do e2e não cabia em quatro fatias; retomada às 14h40; o `frontend-reviewer` e o `revisor-geral` aprovaram, o `test-engineer` reprovou na 1ª (asserção que sempre passa em `Aviso.test.tsx`) e aprovou na 2ª; a Mesa viu 59 fotos; ficou para a 10.0 o mesmo placeholder da `CaixaPedido`, e para a 12.0 manter `pecas-estado` quando o `Contador` ganhar a lateral; sem push |
| 7.0 | `dc02f60` | Sonnet 5.5 | 2 | linha 1, das 15h10 às 17h07 de 13/10; o `frontend-reviewer` e o `infra-guardian` aprovaram na 1ª; o `test-engineer` e o `revisor-geral` reprovaram na 1ª (o véu forte do login por cima sem e2e, o Tab preso da confirmação, e a 10.2 dizendo dois lugares para o perigo cheio com o teste provando seis arquivos) e aprovaram na 2ª; 34 mutações vermelhas; `--repeat-each 3` de `pecas-sobrepor`, `inatividade` e `professores` antes da 2ª rodada; o `PainelLado` nasceu sem consumidor (X2 e X3); seis recomendações com destino no `TODO.md`, ainda por escrever lá (item 2b do "Agora"); sem push |
| 8.0 | `eb3a181` | Sonnet 5.5 | 2 | linha 1, das 17h08 às 18h18 de 13/10; os quatro revisores (`frontend-reviewer`, `conformidade-reviewer`, `test-engineer`, `revisor-geral`) aprovaram na 1ª rodada, com 9 recomendações a aplicar, e de novo na 2ª; a Mesa viu 86 fotos nos dois temas; 83 mutações vermelhas; 18 divergências e ajustes no `8_task.md`, entre eles o balão da `MensagemIA` passar a usar a `AssinaturaIA` como cabeçalho (muda o `Time.tsx` e o `Tutor.tsx` do professor, que são da 10.0); recomendações sem aplicar com destino na 10.0, no `TODO.md` e no `/validar`; sem push |
| 9.0 | `db54cc6` | Sonnet 5.5 | 1 | linha 1, das 18h19 às 18h49 de 13/10; os quatro revisores (`frontend-reviewer`, `infra-guardian`, `test-engineer`, `revisor-geral`) aprovaram na 1ª rodada; 4 fotos do Implementador e 8 da Mesa; os quatro ícones pesam 484 bytes em brotli, e por isso a 9.4 não se aplicou (sem `lugares-*.svg`, `.size-limit.json` intacto); o `Ladrilho` ganhou o tamanho 36, para a lateral da 12.0; cinco divergências no `9_task.md`; sem push |
| 10.0 | `35106af` | Sonnet 5.5 | 2 | linha 1, das 18h57 de 13/10 às 15h29 de 15/10, com o limite semanal parado das 19h31 de 13/10 às 15h de 15/10 (no meio da 1ª rodada, que a Mesa refez inteira); os quatro revisores (`frontend-reviewer`, `conformidade-reviewer`, `test-engineer`, `revisor-geral`) aprovaram na 2ª rodada; 95 mutações vermelhas; telas vistas pelo Implementador e pela Mesa (cheia e vazia, dois temas, computador e celular); recomendações sem aplicar copiadas para o `10_task.md`, linhas novas no `TODO.md`; sem push |
| 11.0 | `761bb2b` | Sonnet 5.5 | 2 | linha 1, das 15h32 às 16h20 de 15/10; `frontend-reviewer` aprovou na 1ª rodada, `test-engineer` e `revisor-geral` aprovaram de novo na 2ª; a 1ª tentativa do portão tinha 16 mutações rodando zero testes (filtro de nome errado), corrigida pelo Implementador antes da 1ª rodada; telas vistas pelo Implementador e pela Mesa (cheia e vazia); sem push |
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
- **13/10 14h30, a 5ª fatia do e2e é correção na linha 1, no meio da 6.0** (`/seguir`, passo 6, divergência de
  portão): o Implementador perguntou se fazia dentro da 6.0 ou em correção própria. Correção própria, com
  `infra-guardian`, porque o `ci.yml` é comum às linhas e fora dos arquivos da tarefa
- **15/10 16h40, o `:has(` da 10.0 é correção na linha 1, no meio da 12.0** (`/seguir`, passo 6, divergência de portão): o `MotorFormulario.tsx` usa `has-[:focus-visible]`, que a Tech Spec (linha 148) proíbe, e o E5 da 1.0 só o pegou na 12.0. Correção própria (`frontend-reviewer`), com o anel por `focus-within`, como a 4.0 decidiu e aceitou (o anel também no clique, `4_task.md`, tabela de revisões). Pedi ao Implementador que pausasse num ponto limpo em vez de reiniciá-lo trabalhando. Feita em `dd0daf7` (frontend-reviewer 1ª, test-engineer 2ª)
