# Cenários — Pele e casca (X1)

Este arquivo é a referência do RF21: diz o que cada teste de hoje afirma sobre cor, medida e desenho, que regra isso prova, e o que a asserção passa a afirmar na pele nova para a regra continuar provada.
A tarefa que troca uma cor, uma medida ou um rótulo leva as linhas dela da parte A, e cada linha vira mutação declarada no documento da tarefa (a cor antiga de volta tem de deixar o teste vermelho).
A parte B diz o que muda em `e2e/__fixtures__/casca.ts` e nas outras duas fixtures, e a parte C é a contagem de casos de antes da X1: depois dela nenhum número pode cair.

**Base das linhas.** Os números de linha são os do commit `426e259` (`spec/pele-e-casca`, antes de qualquer código da X1). A tarefa 2.0 divide `e2e/pecas.spec.ts` em `e2e/pecas-<grupo>.spec.ts` sem mudar asserção: de lá em diante a linha se acha pelo nome do caso, que está na tabela.

**Como ler a coluna "oráculo novo".** A cor vem pelo nome do token e pelo hex do tema claro; os e2e rodam no claro (`playwright.config.ts` fixa `colorScheme: 'light'`). "Inalterado" quer dizer que a asserção fica como está. **Negativa** marca a asserção que nega uma cor ou um elemento: se a constante não for trocada, ela continua verde sem provar nada, e esse é o jeito mais fácil de enfraquecer um teste nesta spec. "A definir na tarefa" vem sempre com o motivo.

**Fontes dos valores novos.** `mockup.md`, seção 1; `techspec.md`, seção 9; e a `docs/interface.md` 9.1, 9.3, 9.7, 10.1, 10.2 e 11, como estavam no andar em 12/10/2026 (a 9.10 e a tabela "Pares de contraste" estavam sendo escritas pela tarefa 1.0).

| Token novo | Claro | Em `rgb()` |
|---|---|---|
| `grafite` (face do oficial) | `#333333` | `rgb(51, 51, 51)` |
| `laranja` (face do primário; mesmo valor de `caramelo`) | `#E8732E` | `rgb(232, 115, 46)` |
| `sobre-cor` (texto sobre face colorida) | `#0D0D0D` | `rgb(13, 13, 13)` |
| `sobre-grafite` (texto sobre o oficial) | `#FFFFFF` | `rgb(255, 255, 255)` |
| `vermelho` (face do perigo cheio) | `#F2545B` | `rgb(242, 84, 91)` |
| `vermelho-texto` (texto do perigo) | `#B84045` | `rgb(184, 64, 69)` |
| `azul-claro` · `azul-borda` · `azul-texto` (aceso) | `#DFF1FD` · `#99D2F8` · `#146EAA` | `rgb(223, 241, 253)` · `rgb(153, 210, 248)` · `rgb(20, 110, 170)` |
| `foco` (anel de foco) | `#146EAA` | `rgb(20, 110, 170)` |
| `borda` (borda de 2 px, trilho de barra, face do desligado) | `#E5E5E5` | `rgb(229, 229, 229)` |
| `apoio` · `sutil` | `#424242` · `#5D5D5D` | `rgb(66, 66, 66)` · `rgb(93, 93, 93)` |
| `azul` · `anil` (anel do Assistente e do Analista) | `#1C9BEF` · `#6A85F7` | `rgb(28, 155, 239)` · `rgb(106, 133, 247)` |

Os 33 nomes de antes continuam, com o hex claro de hoje, salvo `lateral` (vira `#FFFFFF`) e `linha` (vira `#E5E5E5`); nenhum teste afirma esses dois.

---

## Parte A — Asserções de hoje presas a cor, a medida ou a desenho

### A.1 `e2e/tokens.spec.ts` (4 casos)

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A1 | `tokens.spec.ts:29-35` e `:113-116` · "E5: o CSS servido tem cada token de cor da 9.9, com o hex do documento" | Lê o bloco `css` da `### 9.9` do `docs/interface.md`; `tokens.size` é `33`; cada `--color-*` servido tem o hex do documento | Toda cor servida vem da lista do documento (RF1); token que não chega ao CSS faz a classe sair sem regra, calada | Lê os dois blocos da 9.10 (o claro e o `:root[data-tema='escuro']`) e compara os dois. O número fixo de nomes de cada bloco fica a definir na tarefa, porque a 9.10 ainda estava sendo escrita | 1.0 |
| A2 | `tokens.spec.ts:20-26` e `:129-133` · "botão primário: caramelo com texto tinta, sem violação do axe, e o desligado em inativo" | `{ fundo: 'rgb(232, 115, 46)', texto: 'rgb(13, 13, 13)' }`, contraste de 4,5 ou mais, axe sem violação grave | O texto sobre o laranja é escuro e passa o AA (branco sobre o laranja dá 3,0:1) | `{ fundo: laranja #E8732E, texto: sobre-cor #0D0D0D }`: o valor é o mesmo no claro, muda o nome do token. Contraste inalterado | 3.0 (a classe do texto troca na 1.0) |
| A3 | `tokens.spec.ts:135-139` · mesmo caso | Sem toque, o hover leva o fundo a `rgb(238, 135, 71)` (`caramelo-claro`) | Medida da pele: o ponteiro tem resposta, e o toque não depende de hover | `caramelo-claro #EE8747`, inalterado (`docs/interface.md` 10.2: é o hover do primário). A troca passa a ser sem transição | 3.0 |
| A4 | `tokens.spec.ts:144-150` · mesmo caso | Desligado, com o ponteiro em cima: `{ fundo: 'rgb(143, 143, 143)', texto: 'rgb(13, 13, 13)' }`, contraste de 4,5 ou mais | O desligado é outro desenho, legível, e não tem cor de ação | Fundo `borda #E5E5E5`; contraste de 4,5 ou mais. Texto `apoio` (`#424242` no claro): `sutil` não chega a 4,5:1 no escuro. O teste resolve a cor por tema | 3.0 |
| A5 | `tokens.spec.ts:87-97`, com as paradas em `:160`, `:162`, `:164`, `:175`, `:184`, `:185`, `:186` e `:193` · "foco de 2 px em noite com 2 px de afastamento nos componentes, e em caramelo-noite sobre o preto" | `{ visivel: true, estilo: 'solid', largura: '2px', cor: 'rgb(13, 13, 13)', afastamento: '2px' }` em oito paradas: campo de e-mail, campo de senha, "Entrar", "Abrir o menu" (celular), seletor de escola, item "Turmas", "Sair" e o link "página inicial" | Tudo o que recebe foco pelo teclado mostra o anel (regra 50, item 11; RF7) | `{ visivel: true, estilo: 'solid', largura: '3px', cor: foco #146EAA, afastamento: '2px' }`. Nos dois campos (`:160` e `:162`, e os mesmos dois no caso do escuro) o afastamento é `0px` (`docs/interface.md` 10.1), **a partir da 14.0, que passa a página de entrada à peça `Campo`**: os dois campos de `/entrar` são `<input>` escritos à mão (`paginas/Entrar.tsx`) e só a 14.0 os troca. A 4.0 prova o afastamento `0px` do `Campo` na galeria (`e2e/pecas-campos.spec.ts`). A parada `:185` muda de lugar no celular (parte B): o item "Turmas" é da barra de baixo, que com a gaveta aberta está inerte. O Esc fecha a gaveta e devolve o foco ao botão do menu, e dali o Tab percorre o `<main>` até o item, que mostra o mesmo anel de 3 px com afastamento `-3px` (por dentro: a barra encosta no pé e nas laterais da janela, e o anel por fora seria cortado, como o da linha de lista, `docs/interface.md` 10.1) | 3.0 (o anel); 4.0 (o afastamento do `Campo`, na galeria); 14.0 (o afastamento nos dois campos de `/entrar`); `:185`, 13.0 |
| A6 | `tokens.spec.ts:188-194` · mesmo caso | O link "página inicial" da página não encontrada: `['rgb(180, 82, 15)', 'underline']` | Link de texto tem contraste AA e não depende só da cor: é sublinhado. Laranja como texto, só no tom que passa | Inalterado: `caramelo-texto #B4520F` continua nas telas de antes (`docs/interface.md` 9.1). Nenhuma tarefa lista `componentes/NaoEncontrada.tsx`; se alguma o passar ao `azul-texto #146EAA`, o sublinhado fica | nenhuma (ver "O que ficou em aberto") |
| A7 | `tokens.spec.ts:196-203` · mesmo caso | Numa faixa `div.bg-noite` montada pelo teste, o anel é `{ estilo: 'solid', largura: '2px', cor: 'rgb(242, 162, 91)', afastamento: '2px' }` | O anel de foco é visível sobre o chão em que está | A regra `.bg-noite :focus-visible` **muda**, e não sai (decidido na 3.0): no claro o `foco` dá 3,55:1 sobre a `noite` e a regra deixa de existir; no escuro a `noite` é clara (`#f1f7fb`) e o `foco` dá 1,99:1, e por isso ali, e só ali, o anel é o `sobre-grafite`, o texto da face (15:1). O chão próprio dentro da face (o grupo da `Aparencia` na faixa) volta ao `foco`. `caramelo-noite` fica sem uso. O caso passa a medir, nos dois temas, o anel de 3 px contra cada face `bg-noite` que ainda existe (a faixa da operação, a dica da lateral e o avatar), com 3:1 ou mais. A regra sai com a última face `noite` (15.0 e 8.0) | 3.0 |
| A8 | `tokens.spec.ts:178-183` e `:206-234` · "a marca vem dos SVGs em curvas, sem nenhuma requisição de fonte" | `img[src="/marca/turmma-pinta.svg"]` carregada (na lateral e no `banner`), com `alt=""`; o texto "Turmma"; `link[rel="icon"]` em `/marca/turmma-icone.svg`; nenhuma requisição de fonte | A marca vem em curvas e nenhuma fonte é baixada (regra 50, item 1) | Inalterado. A lateral nova (12.0) e a casca pública nova (14.0) continuam com a pinta nesse arquivo, o texto "Turmma" e um `banner` na página pública. Na 14.0 a pinta parada do painel é outra `img` com o mesmo arquivo, **fora** do `banner`: dentro dele há uma só | 12.0 e 14.0 conferem |

### A.2 `e2e/casca.spec.ts` (17 casos)

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A9 | `casca.spec.ts:293` · "E5: o CSS servido tem os hex da D72, não usa oklch() nem color-mix(), e pinta o aviso de atenção" | O CSS servido contém `#e8732e`, `#0d0d0d`, `#8f8f8f`, `#fdf0e8`, `#8a3e0c`, `#fdecec` e `#b42318` | Os tokens que as telas pintam chegam ao navegador | Inalterado: os sete continuam no bloco claro. Entram os que as peças novas pintam (o build encurta o hex de dígitos repetidos, e o grafite chega ao navegador como `#333`): `#333333`, `#f2545b`, `#b84045`, `#146eaa`, `#dff1fd`, `#99d2f8` e `#e5e5e5` | 1.0 |
| A10 | `casca.spec.ts:296-300` · mesmo caso | O CSS não tem `oklch(`, `color-mix(`, nome da paleta de fábrica (`slate`, `blue`, `amber`, `red`, `emerald`) nem `@font-face` | O Chrome 109 do laboratório descarta a declaração inteira (regra 50, item 1) | Inalterado, e mais: sem `:has(`, sem `scrollbar-width` e sem `infinite` (Tech Spec, seção 10) | 1.0 |
| A11 | `casca.spec.ts:304` · mesmo caso | As classes `.bg-pendente-cx`, `.border-pendente`, `.text-pendente`, `.bg-erro-cx`, `.border-erro` e `.text-erro` têm regra no CSS servido | Classe de aviso usada gera regra: com a paleta zerada, a cor sem nome some calada | Inalterado enquanto alguma tela usar cada uma. A tarefa que tirar o último uso de uma delas troca o nome da lista pela classe que o aviso passou a usar | 14.0, se trocar |
| A12 | `casca.spec.ts:307-319` · "o aviso de atenção aparece com fundo e borda, na cor da D72 e com contraste AA" | Em `/mfa`, o aviso "entre de novo": `{ fundo: 'rgb(253, 240, 232)', borda: 'rgb(138, 62, 12)', larguraDaBorda: '1px', estiloDaBorda: 'solid', texto: 'rgb(138, 62, 12)' }` | O aviso de atenção aparece com fundo e borda, nunca transparente, e com contraste AA | **Decidido na 14.0: continua escrito à mão** (`paginas/SemDesafio.tsx`), com as cores de hoje (`pendente-cx #FDF0E8`, `pendente #8A3E0C`) e a borda de 1 px; passá-lo ao `Aviso` mexeria em `casca.spec.ts`. Das duas saídas que o documento previa, vale esta: se continuar escrito à mão: cores inalteradas (`pendente-cx #FDF0E8`, `pendente #8A3E0C`), e a borda só muda se a tarefa a engrossar para `2px`. Se passar ao `Aviso` de atenção: fundo `amarelo-claro #FFF7E0`, borda `2px solid` em `amarelo-borda #FFE49A`, texto `tinta #0D0D0D`. Nos dois casos: fundo que não é transparente e borda sólida | 14.0 |
| A13 | `casca.spec.ts:56-61` (usada em `:92` e `:189`) e `:498-503` (usada em `:336`, `:356-360`, `:435-436`) | Alvo de 44 × 44 px ou mais em "Verificar de novo", "Tentar de novo", "Abrir o menu", "Sair", a marca, "Fechar o menu", "Meus dados" e o item "Turmas" | Alvo de toque de 44 px na ação principal e em tudo no celular (regra 50, item 2a) | Inalterado. A caixa medida é a face: o degrau é sombra e margem, fora dela | 6.0, 12.0 e 13.0 conferem |
| A14 | `casca.spec.ts:328-338` · "W12: abaixo de 768 px, a barra do topo com o "Sair" a um toque, e a gaveta modal que prende e devolve o foco" | A 360 × 800: `navigation "Seções"` com `toHaveCount(0)` antes de abrir a gaveta; "Abrir o menu" com `aria-expanded="false"`; largura excedente zero | A 360 px nada rola de lado, e "Sair" está a um toque (D59) | **Negativa.** A professora do caso passa a ter a `navigation "Seções"` na barra de baixo: vira `toHaveCount(1)`, visível, com os três links. O resto fica | 13.0 |
| A15 | `casca.spec.ts:340-362` · mesmo caso | Com a gaveta aberta: doze Tabs sem o foco ir para "atrás"; `gaveta(page).getByRole('link', { name: 'Turmas' })` com 44 px; "Meus dados", "Sair" e "Fechar o menu" com 44 px | A gaveta é modal: prende o foco e o devolve | O foco preso fica. A linha `:356` deixa de valer para a professora: "Turmas" sai da gaveta, e o alvo dele é medido na barra de baixo | 13.0 |
| A16 | `casca.spec.ts:364-375` · mesmo caso | Esc fecha e devolve o foco; o clique no ponto (350, 400) fecha a gaveta | Medida da pele: a gaveta não cobre a tela inteira | Inalterado se o ponto (350, 400) continuar fora da gaveta a 360 px; se não, muda o ponto, e não a asserção | 13.0 |
| A17 | `casca.spec.ts:378-401` · "W12: no computador, a lateral aberta percorrida só com Tab, com o "Sair" a um clique e do tamanho dos itens" | A 1366 × 768, a ordem do Tab: a marca, "Recolher a lateral", "Nova conversa", "Ferramentas", "Turmas", "Assistente de ensino" e "Tutor" de "Seu time", "Meus dados" e "Sair", com foco visível em cada uma | A lateral inteira é percorrida só com Tab, na ordem da tela, com "Meus dados" antes do "Sair" | "Nova conversa" vira "Início" (12.0). A `Aparencia` entra em "Sua conta" (2.0) e é uma parada a mais, entre "Meus dados" e "Sair" (a opção marcada do grupo; `casca.spec.ts` W12 ganhou essa parada na 2.0), e "Meus dados" continua antes do "Sair" | 2.0 e 12.0 |
| A18 | `casca.spec.ts:402-407` · mesmo caso | "Sair" tem a mesma `height` e a mesma `width` do link "Turmas"; o item tem 44 px ou mais; o nome da pessoa à vista | "Sair" nunca é menor nem mais escondido que os itens (D59, P18; RF15) | A mesma igualdade, contra o vizinho que a tarefa fixar (o lugar de 52 px ou "Meus dados") | 12.0 |
| A19 | `casca.spec.ts:412-450` · "W12: recolher a lateral para o trilho fica guardado, o trilho dá a dica pelo teclado, e abrir desfaz" | No trilho, o texto "Turmma" some; o Tab passa por "Nova conversa" e "Ferramentas" antes de "Turmas"; a dica do item aparece; "Turmas" e "Sair" com 44 px; a escolha sobrevive à recarga | O trilho dá nome a cada ícone, e a escolha fica guardada no navegador | "Início" no lugar de "Nova conversa"; o resto inalterado. A chave guardada passa a ser `educa.lateral-recolhida` (RF24) | 12.0 |
| A20 | `casca.spec.ts:452-495` · "W12: de 768 a 1023 px, o trilho, e a lateral abre por cima do conteúdo, sem mudar a escolha do computador" | A 900 × 768, a gaveta que o trilho abre tem `Seções` com `['Nova conversa', 'Ferramentas', 'Turmas']`; a gaveta continua aberta nas trocas 900, 360, 900, e não volta aberta depois de 1366 | Existe uma navegação por vez, e a gaveta não fica presa ao trocar de largura | "Início" (12.0). A 900 px os itens continuam na gaveta do trilho. A 360 px (`:475-477`) a gaveta da professora não tem `Seções`; o que o caso afirma ali (a gaveta aberta e o `aria-expanded` do "Abrir o menu") fica | 12.0 e 13.0 |
| A21 | `casca.spec.ts:329`, `:379`, `:413`, `:453`, `:475`, `:478`, `:488`, `:492` | `setViewportSize` em 360, 900 e 1366 px | Medida da pele: as quebras em 768 e 1024 px | Inalterado: as quebras não mudam (RF13, RF14) | — |

### A.3 `e2e/areas.spec.ts` (14 casos)

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A22 | `areas.spec.ts:44-48`, `:114`, `:124`, `:129`, `:143`, `:168`, com `casca.ts:96` · "o professor vê os itens da fase dele, cada um leva à tela com as três pistas do selecionado, e a aba diz a tela" | O primeiro item do professor é "Nova conversa", e o título da aba é "Nova conversa · Turmma" | Rótulo. A regra é a do RF16: os itens são os da tabela do papel, na ordem, e cada um abre a tela dele | "Início" e "Início · Turmma"; o caminho `/professor/nova-conversa` não muda (RF18) | 12.0 |
| A23 | `areas.spec.ts:153-160` · mesmo caso | O item "Turmas" aceso: `aria-current="page"`; `['rgb(236, 236, 236)', '600']` (fundo `realce` e peso); `[data-filete]` com `['rgb(232, 115, 46)', '3px']` | O item aceso não depende só de cor: três pistas e o `aria-current` | `aria-current` inalterado; fundo `azul-claro #DFF1FD`; borda `2px solid` em `azul-borda #99D2F8`; texto `azul-texto #146EAA`. O peso deixa de ser pista (aceso e apagado ficam em 700), e o filete sai: a pista que não é cor passa a ser a borda, que no apagado é transparente | 12.0 |
| A24 | `areas.spec.ts:170-171` · mesmo caso | Fora de "Turmas": sem `aria-current`, e `[data-filete]` com `toHaveCount(0)` | A mesma, pelo avesso: o apagado não tem as pistas | **Negativa.** Sem o filete, `toHaveCount(0)` passa vazia. Vira: fundo que não é `azul-claro` e borda transparente | 12.0 |
| A25 | `areas.spec.ts:563` · "falha com a gaveta aberta: a fronteira assume, a gaveta fecha e o foco vai para a falha" | No computador, `setViewportSize` em 900 × 768 para a lateral virar gaveta | Medida da pele | Inalterado | — |

As outras asserções deste spec sobre a lateral (`:127-136`, `:240-245`, `:254`, `:418-419`) são de estrutura e estão na parte B.

### A.4 `e2e/pecas.spec.ts` (12 casos; a 2.0 o divide em `pecas-<grupo>.spec.ts`)

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A26 | `pecas.spec.ts:15-25` · a tabela `RGB` do arquivo | Nove cores: `caramelo`, `noite` `rgb(13, 13, 13)`, `erro` `rgb(180, 35, 24)`, `superficie`, `iaFundo`, `iaTexto`, `okFundo`, `pendenteFundo`, `erroFundo` | É a tabela que as linhas A27 a A46 leem | `noite` dá lugar a `grafite #333333`. `erro` vira duas: `vermelho #F2545B` (a face do cheio) e `vermelho-texto #B84045` (o texto do perigo). As outras sete ficam | 3.0 |
| A27 | `pecas.spec.ts:89-101` · "o selo de IA e a assinatura: o texto "IA" em toda saída de IA, um desenho só, e avatar em círculo com ícone, nunca rosto" | Dez ou mais `[data-selo-ia]`; cada um com "IA" e o texto para leitor de tela, sem `title`; um único `desenho` (fundo, texto, borda, peso, fonte, canto, enchimento); `{ fundo: 'rgb(240, 240, 240)', texto: 'rgb(66, 66, 66)' }` | O selo "IA" tem um desenho só em todo o produto, e a sigla é dita em texto | Um desenho só, inalterado. Cores inalteradas: `ia-cx #F0F0F0` e `ia #424242` (o selo é neutro de propósito, `docs/interface.md` 9.1). Canto, fonte e enchimento mudam juntos, em todos os selos | 8.0 |
| A28 | `pecas.spec.ts:112-123` · mesmo caso | Todo `[data-agente]`: largura igual à altura; canto de metade do lado ou mais; um `svg`; nenhum `img, image, picture`; o do Assistente com fundo `rgb(13, 13, 13)`; o do Tutor com fundo `rgb(232, 115, 46)` | O avatar do agente é desenho, nunca foto de pessoa, e há um por agente (D58) | Círculo de fundo `fundo #FFFFFF` com borda `2px solid` na cor do agente: Assistente `azul #1C9BEF`, Tutor `laranja #E8732E`, Analista `anil #6A85F7`. Quadrado, circular e sem `img, image, picture`: inalterado. A contagem de `svg` fica a definir na tarefa (um, se a cabeça for um SVG só). Entra a prova do RF10: todo `[data-agente]` tem o nome da função e `[data-selo-ia]` no mesmo bloco. O título do caso troca "nunca rosto" por "nunca pessoa" (D80, item 3) | 8.0 |
| A29 | `pecas.spec.ts:125-134` · mesmo caso | A linha da aprovação com quem aprovou e quando, em texto; um `svg` na aprovada; "Esperando você" na pendente; quem rejeitou e o motivo | Estado nunca é só cor: a aprovação diz quem e quando (regra 70, item 6) | Inalterado | 10.0 confere |
| A30 | `pecas.spec.ts:136-146` · mesmo caso | O `desenho` de `[data-aprovacao] [data-estado]` é igual ao do selo `[data-estado]` da seção de estado, nos três estados; fundos `rgb(233, 245, 238)`, `rgb(253, 240, 232)` e `rgb(253, 236, 236)` | A linha de aprovação é o selo de estado, e não um segundo desenho | Igualdade inalterada. Fundos inalterados (`ok-cx`, `pendente-cx`, `erro-cx`: as famílias de hoje continuam, `docs/interface.md` 10.2). `Estado` é da 6.0 e `LinhaAprovacao`, da 10.0, em linhas paralelas: a igualdade tem de valer no commit de cada uma | 6.0 e 10.0 |
| A31 | `pecas.spec.ts:148-154` · mesmo caso | Na mensagem, o texto fica acima da linha de aprovação, e ela, acima da ação "Copiar" | A aprovação tem lugar fixo: depois do conteúdo e antes das ações | Inalterado | 10.0 confere |
| A32 | `pecas.spec.ts:157-175` e `:188` · "a Escolha da D18: duas opções do mesmo tamanho e do mesmo desenho, nenhuma primária, e o foco vai para a linha da escolha" | Duas opções com largura e altura iguais, de 44 px ou mais; `desenho` igual; fundo `rgb(255, 255, 255)`; fundo fora de `[caramelo, noite]`; nenhuma com o foco; a linha "Você escolheu" mais baixa que a opção | As duas opções da Escolha são iguais, e nenhuma é primária nem oficial (D18, D59) | Iguais, inalterado. Fundo `fundo #FFFFFF`. **Negativa:** a lista proibida passa a `[laranja #E8732E, grafite #333333]`; com `noite` antiga, a exclusão do oficial não prova nada | 10.0 (a constante, 3.0) |
| A33 | `pecas.spec.ts:214` · "o texto da IA entra como texto, com os chips no fim; o ChipFonte abre pelo teclado e pelo toque e fecha quando o foco sai" | O chip de fonte tem 24 px de altura ou mais | Alvo mínimo de 24 px (WCAG 2.5.8) | Inalterado (a pílula nova tem 28 px) | 10.0 confere |
| A34 | `pecas.spec.ts:295-299` · "a CaixaPedido: com teclado, Enter envia e Shift+Enter quebra a linha; com o dedo, Enter quebra a linha e o envio é o botão; o foco volta ao campo" | "Enviar": fundo `rgb(232, 115, 46)`, com 44 × 44 px exatos | O enviar é o primário da tela, com alvo de 44 px | `laranja #E8732E`, inalterado. Os 44 px exatos ficam se o botão só de ícone for o de 44 (a face; o degrau fica fora da caixa) | 10.0 |
| A35 | `pecas.spec.ts:314-315` · mesmo caso | "Parar", ligado: fundo `rgb(255, 255, 255)` | O "Parar" ligado e o desligado não são o mesmo desenho | `fundo #FFFFFF`, inalterado: a peça revestida não muda de variante (o mockup usa o oficial aqui, e a X1 não) | 10.0 confere |
| A36 | `pecas.spec.ts:348-362` · "nenhuma peça passa da largura da janela, com o menu aberto também, e o axe não acha violação na galeria" | Quinze ou mais `[data-galeria]`; cada bloco dentro da janela e sem rolagem própria; axe sem violação grave | A 360 px nenhuma peça estoura (regra 50, item 2a) | Inalterado. A galeria por seções mantém um `data-galeria` por bloco, e o número só cresce | 2.0 |
| A37 | `pecas.spec.ts:393-405` · "botões: cinco variantes, só a oficial em preto e só a primária em laranja, e o desligado nunca é igual ao ligado" | Cinco `[data-variante]` no tamanho principal; altura de 44 px ou mais; canto de metade da altura ou mais (pílula) | Alvo de 44 px. A pílula é medida da pele | Altura inalterada. Canto exatamente `12px`. As variantes continuam cinco (`cheio` é opção do `perigo`); se a galeria mostrar o cheio com `data-variante` próprio, o número fica a definir na tarefa | 3.0 |
| A38 | `pecas.spec.ts:407-415` · mesmo caso | Cada variante desligada: `disabled`; fundo ou texto diferente do ligado; fundo fora de `[caramelo, noite, erro]`; texto diferente de `erro` | O desligado é outro desenho e nunca fica com a cor da ação | Fundo `borda #E5E5E5`. **Negativa:** a lista proibida passa a `[laranja #E8732E, grafite #333333, vermelho #F2545B]`, e o texto proibido, a `vermelho-texto #B84045` | 3.0 |
| A39 | `pecas.spec.ts:417-419` · mesmo caso | Os cinco nomes; só `oficial` tem fundo `rgb(13, 13, 13)`; só `primario` tem fundo `rgb(232, 115, 46)` | Só a decisão oficial tem a cor do oficial, e só o primário é laranja | Só `oficial` com `grafite #333333`; só `primario` com `laranja #E8732E` | 3.0 |
| A40 | `pecas.spec.ts:420-422` · mesmo caso | `perigo`: fundo `rgb(255, 255, 255)`, texto `rgb(180, 35, 24)` | O perigo fora do diálogo é texto, sem fundo de perigo | Fundo `fundo #FFFFFF`; texto `vermelho-texto #B84045` | 3.0 |
| A41 | `pecas.spec.ts:424-427` · mesmo caso | O botão "Menu desligado": texto `rgb(143, 143, 143)` (`inativo`) | O botão que abre o menu, desligado, também muda de desenho | O texto do desligado da A4 (`apoio`, `#424242` no claro): `inativo` deixa de ser texto de peça | 3.0 (7.0 conferiu: o botão que abre o menu continua o da 3.0; o item desligado do menu aberto escreve em `sutil`, com `aria-disabled`) |
| A42 | `pecas.spec.ts:429-432` · mesmo caso | Cinco compactos, com 36 px ou mais no computador e 44 px ou mais no toque | Alvo de 44 px em tudo no celular | Inalterado | 3.0 confere |
| A43 | `pecas.spec.ts:443-449` · "abas e menu pelo teclado: uma parada só no Tab, setas, item desligado pulado, e o Esc devolve o foco" | As três abas inteiras dentro da largura, também a 360 px | A lista de abas quebra de linha em vez de esconder a que não coube | Inalterado | 6.0 confere |
| A44 | `pecas.spec.ts:576-582` · "a Tela não põe margem dentro da casca; fora dela, com `comMargem`, põe a da página" | `[data-tela]` com `comMargem`: `24px` dos dois lados a partir de 768 px, `16px` abaixo | A margem da página é uma só | `32px` a partir de 768 px e `16px` abaixo (`docs/interface.md` 9.3) | 11.0 |
| A45 | `pecas.spec.ts:604-607` · "o diálogo de confirmação: o que vai acontecer e o aviso são lidos ao abrir, o foco não começa em confirmar e volta para onde dá" | O botão que confirma tem fundo `rgb(13, 13, 13)`; "Cancelar" tem a mesma altura, de 44 px ou mais | Só a decisão oficial tem a cor do oficial, e recusar não é menor que aceitar (D59) | `grafite #333333`; alturas iguais, inalterado. **7.0:** os dois botões ficam também com a mesma largura, em duas colunas iguais a partir de 640 px e empilhados abaixo, com "Cancelar" antes | 3.0 (a cor) e 7.0 (a caixa) |
| A46 | `pecas.spec.ts:648`, `:656-657` e `:664-665` · mesmo caso | Dentro do diálogo, "Rejeitar 32 correções" e "Suspender a função" têm fundo `rgb(180, 35, 24)`; fora dele, "Suspender a função" é `{ fundo: 'rgb(255, 255, 255)', texto: 'rgb(180, 35, 24)' }` | O perigo cheio só existe dentro do diálogo de confirmação | Dentro: `vermelho #F2545B`. Fora: `fundo #FFFFFF` com texto `vermelho-texto #B84045` | 3.0 |
| A47 | `pecas.spec.ts:687-689` · "o motor de formulário diz o que falta e o que é obrigatório, entrega os valores validados, não perde o foco, e a Adaptação não tem campo de texto" | "Gerar atividade" tem fundo `rgb(232, 115, 46)`; "Cancelar" tem a mesma altura | O botão que gera é o primário, e cancelar tem o mesmo tamanho | Inalterado | 10.0 confere |
| A48 | `pecas.spec.ts:752-790` · "a barra presa não cobre o último item, a tabela vira lista no celular, o menu não é cortado dentro dela, e "preparando a resposta" não se mexe" | A barra no pé da caixa que rola; o último item acima dela; `scrollPaddingBottom` igual à altura da barra; o foco nunca atrás da barra; botões com 44 px, dentro da caixa | A barra presa não cobre o último item nem o controle em foco (WCAG 2.4.11) | Inalterado. A barra cresce com a margem do degrau, e as medidas acompanham porque são lidas da tela | 5.0 |
| A49 | `pecas.spec.ts:792-816` · mesmo caso | A partir de 768 px, `[data-tabela="tabela"]`; abaixo, lista com o rótulo de cada valor | A tabela vira lista no celular, numa estrutura só | Inalterado | 5.0 confere |
| A50 | `pecas.spec.ts:820-838` · mesmo caso | O menu de uma linha da tabela abre inteiro: nos quatro pontos a 20 px da quina, o que está por cima é o menu | O menu não é cortado pelo contêiner que rola | Inalterado: o canto do menu continua de 16 px, e os 20 px passam da curva | 7.0 confere |
| A51 | `pecas.spec.ts:843-850` · mesmo caso | Em `[data-pensando]`, nenhum nó com `animationName` diferente de `none` | "Preparando a resposta" não se mexe (D59; regra 50) | Inalterado, e vale também para a onça ao lado (RF10) | 10.0 (8.0 confere) |
| A52 | `pecas.spec.ts:865` · mesmo caso | O campo de várias linhas tem `resize: vertical` | Arrastado para o lado, o campo estouraria a largura da tela | Inalterado | 4.0 confere |

### A.5 `e2e/aluno-tutor.spec.ts` (6 casos)

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A53 | `aluno-tutor.spec.ts:67-77`, usada em `:171`, `:308` e `:333` | Nenhum elemento de `main` com animação de repetição `infinite` | Nada na tela do aluno se mexe sozinho (D59; RF8) | Inalterado. O carregando de tela (`EstadoCarregando`) continua texto parado, sem pulso nem laço (6.0, `docs/interface.md` 10.2); o pulso do "Pensando…" é da 10.0 | 6.0 e 10.0 conferem |
| A54 | `aluno-tutor.spec.ts:126-135` · "a escolha da atividade e a conversa: carregando, vazia, erro e com mensagens; a faixa que não fecha, a caixa só de texto, o selo de IA, o chip de página e "Hoje: N de 60"" | Com a janela a 400 px de altura, a barra do uso vira uma linha de texto, e volta quando a janela cresce | Com o teclado do celular aberto, o uso do dia continua legível | Inalterado. A conferir com a barra de baixo fixa, que tira 68 px da altura | 13.0 confere |
| A55 | `aluno-tutor.spec.ts:160-166` · mesmo caso | A faixa de supervisão não tem botão nem link, e continua à vista depois de rolar | A faixa de que o professor acompanha não fecha e fica presa (D8) | Inalterado. A barra de topo continua com 56 px, e a faixa continua presa logo abaixo dela | 6.0 e 13.0 conferem |
| A56 | `aluno-tutor.spec.ts:168-170` (mesmo caso) e `:330-332` · "no limite do dia: diz com calma que por hoje acabou e que amanhã volta; a caixa não trava, e a mensagem sem o 188 ganha a linha dele" | Os `svg rect` da barra do uso têm `fill` `['rgb(240, 240, 240)', 'rgb(93, 93, 93)']`, também com a barra cheia | A barra de uso é neutra: não fica vermelha nem quando enche | **Inalterado, decidido na 5.0:** trilho `ia-cx` (`#F0F0F0`) e enchimento `sutil` (`#5D5D5D`), os `fill` de hoje, nos dois temas por token. A `docs/interface.md` 10.2 dizia trilho em `borda`; a 5.0 manteve a cor e mudou só a forma (12 px de altura, ponta redonda), para o caso passar sem edição, e escreveu isso na 10.2. O `svg rect` fica, e o desenho continua `aria-hidden` com o valor escrito ao lado: o `role="progressbar"` da 10.2 duplicaria o texto no leitor de tela. A `scaleX` do mockup não entra: o enchimento é a `width` do `rect`, sem animação | 5.0 |
| A57 | `aluno-tutor.spec.ts:275-278` · "em avaliação: o aviso com o título dela; a pergunta comum volta recusada e vira o mesmo aviso; a mensagem de assunto delicado recebe o encaminhamento com o 188" | `[data-pausa-do-tutor]`: sem `alert`, sem "Tentar de novo", com fundo `rgb(255, 255, 255)` | A pausa do Tutor é aviso, sem vermelho | `superficie #FFFFFF`, inalterado: a tela do Tutor não muda de classe na X1 | 10.0 confere |
| A58 | `aluno-tutor.spec.ts:303` · mesmo caso | O link do 188 tem `userSelect` diferente de `none` | O telefone é texto que se seleciona (D36) | Inalterado | — |
| A59 | `aluno-tutor.spec.ts:305-308` · mesmo caso | `[data-assunto-delicado]`: `['none', 'rgb(244, 244, 244)']` (sem animação, fundo `info-cx`); sem `alert` | O cartão do assunto delicado é calmo: sem alerta, sem animação, sem vermelho (D36) | `info-cx #F4F4F4`, inalterado no claro; `animationName` `none` | 10.0 confere |

### A.6 `e2e/operacao.spec.ts` (10 casos)

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A60 | `operacao.spec.ts:50-51` · "entra por e-mail, senha e código, chega à casca da operação e sai a um clique" | O `banner` contém "Operação Turmma" | Nenhuma tela da operação parece tela de escola | Inalterado (`tasks.md`, 15.2). A `docs/interface.md` 11.4 dizia "Equipe Turmma" e foi corrigida na 15.0: o nome é "Operação Turmma" | 15.0 |
| A61 | `operacao.spec.ts:93-98` · mesmo caso | "Sair", dentro do `banner`, com 44 × 44 px ou mais | Sair está à vista e tem alvo de toque (D59) | Inalterado | 15.0 confere |
| A62 | `operacao.spec.ts:16-17` e `:99-105` · mesmo caso | Sem toque, o anel do "Sair": `{ visivel: true, estilo: 'solid', largura: '2px', cor: 'rgb(242, 162, 91)' }` | O anel de foco é visível sobre a faixa da operação | `{ visivel: true, estilo: 'solid', largura: '3px', cor: foco #146EAA }`. O anel muda na 3.0, com a faixa ainda preta, e por isso a 3.0 leva esta linha (o arquivo não está na lista dela) | 3.0 |
| A63 | `operacao.spec.ts:106` · mesmo caso | O `header` do "Sair" tem fundo `rgb(13, 13, 13)` | Medida da pele: a faixa preta | `fundo #FFFFFF`, com borda de baixo de 2 px. O que distingue a operação passa a ser só o texto da A60. Os dois temas: com a sessão aberta, `operacao.spec.ts › a barra de topo é clara e tem a marca e o "Sair" à vista em Escolas e em Uso` mede o `fundo` do tema, claro e escuro; fora dela, `… na entrada, no segundo fator e no convite` mede o mesmo nos dois e passa o axe no escuro | 15.0 |
| A64 | `operacao.spec.ts:68-70` (mesmo caso) e `:264-268` · "E3: o aviso aparece 2 min antes do fim da sessão parada, e no fim a aba vai à entrada com a mensagem" | "Entrar" com 44 px; "Continuar na sessão" e "Sair" com a mesma altura, de 44 px ou mais | Sair nunca é menor que continuar (D59) | Inalterado | 15.0 confere |

### A.7 Pedidos de nome, pedidos do titular e acesso da turma

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A65 | `pedidos.spec.ts:59-60`, com `:400` · "nenhuma leitura sem o clique em "Atualizar", nem em 60 s; …" e `:568`, `:580` · "o 41º pedido não é marcável, com o texto do limite; não existe "aprovar todos"; …" | "Aprovar N pedidos", na seção e no diálogo: fundo `COR_DO_OFICIAL` = `rgb(13, 13, 13)` | Só a decisão oficial tem a cor do oficial: aprovar o pedido cria a conta do aluno (regra 50, item 8) | `grafite #333333` | 3.0 |
| A66 | `pedidos.spec.ts:61`, com `:431`, `:620` e `:627` · os mesmos dois casos | "Recusar N pedidos" na seção: texto `COR_DO_PERIGO` = `rgb(180, 35, 24)`; no diálogo, fundo com a mesma constante | O perigo é texto na seção e cheio só na confirmação | A constante vira duas: o texto é `vermelho-texto #B84045`, e o fundo do cheio, `vermelho #F2545B` | 3.0 |
| A67 | `pedidos.spec.ts:62-64` e `:600-604` · "o 41º pedido não é marcável…" | No resultado, o pedido aprovado agora em `rgb(11, 107, 71)` (`ok`), e os dois não decididos em `rgb(138, 62, 12)` (`pendente`) | O que foi decidido agora e o que não foi não se confundem (e o texto de cada linha diz) | Inalterado: `ok #0B6B47` e `pendente #8A3E0C` continuam. Se a 7.0, ao revestir `dialogos.tsx`, trocar por `verde-texto` e `amarelo-texto`, as duas cores continuam diferentes entre si | 7.0 confere |
| A68 | `pedidos.spec.ts:120-125` (e as chamadas) e `:643-669` · "sem rolagem horizontal, também no diálogo, com nome comprido; cartões e alvos de 44 px; …" | A 360 × 800: três cartões empilhados, cada um com 44 px ou mais e dentro dos 360 px; alvos de 44 × 44 | A 360 px a lista é de cartões que cabem, com alvo de toque | Inalterado | 7.0 confere |
| A69 | `__fixtures__/pedidos-do-titular.ts:24-26`, usada em `pedidos-do-titular.spec.ts:105` · "dois alunos com o mesmo nome: …" e `:170` · "um pedido que não é eliminação confirma na decisão oficial, …" | `COR_DO_PERIGO` = `rgb(180, 35, 24)` no fundo de "Registrar a eliminação"; `COR_DO_OFICIAL` = `rgb(13, 13, 13)` no fundo de "Registrar pedido" | A eliminação confirma em perigo cheio, e o pedido comum, na decisão oficial | `vermelho #F2545B` e `grafite #333333` | 3.0 |
| A70 | `acesso-da-turma.spec.ts:53-54`, `:576` e `:581` · "o código em dois grupos, grande; "Gerar novo" confirma, diz o que cai e o que destrava; …" | "Revogar o acesso" na seção: texto `rgb(180, 35, 24)`; "Revogar acesso" no diálogo: fundo com a mesma constante | O perigo é texto na seção e cheio só na confirmação | Duas constantes, como na A66: `vermelho-texto #B84045` e `vermelho #F2545B` | 3.0 |
| A71 | `acesso-da-turma.spec.ts:51-52`, `:460` (mesmo caso) e `:659` · "sem rolagem horizontal, também no diálogo com o código grande; alvos de 44 px; …" | O código da turma tem letra de 36 px ou mais (`LETRA_GRANDE_PX`) | O código é grande o bastante para ser projetado e lido da carteira | Inalterado | 7.0 confere (`copia-unica.tsx`) |
| A72 | `acesso-da-turma.spec.ts:607` e `:695-699` · o segundo caso da A71 | A 360 × 640, o "Cancelar" da confirmação termina dentro dos 640 px | No celular baixo a confirmação cabe inteira | Inalterado. O diálogo cresce com a borda de 2 px e o degrau, e a medida é lida da tela | 7.0 confere |
| A73 | `acesso-da-turma.spec.ts:123-127` (e as chamadas, entre elas `:661` e `:694`) e `:639` | Alvos de 44 × 44 nos botões do diálogo; cada linha de validade com 44 px | Alvo de toque de 44 px | Inalterado | 7.0 confere |

### A.8 Telas do professor

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A74 | `professor-turma.spec.ts:103-106` · "aplicar pede a escolha "é avaliativa?" e diz o que acontece com o Tutor; …" | "Aplicar à turma": fundo `rgb(13, 13, 13)` | Aplicar é decisão da professora, registrada: tem a cor do oficial | `grafite #333333` | 3.0 |
| A75 | `professor-turma.spec.ts:253-255` · "o botão de aprovar fica desligado até o último destaque ser aberto, com o contador dizendo por quê; …" | O grupo "Aprovação do lote" tem `position: sticky` | O oficial da tela fica preso embaixo, à vista | Inalterado. No celular, a barra presa não pode ficar atrás da barra de baixo (RF23) | 5.0 e 13.0 conferem |
| A76 | `professor-turma.spec.ts:262` · mesmo caso | Nenhum botão de `main` com fundo `rgb(232, 115, 46)` | Na tela de aprovar não há botão laranja ao lado do oficial | Inalterado: `laranja #E8732E` tem o mesmo valor | 3.0 confere |
| A77 | `professor-turma.spec.ts:278` · mesmo caso | "Aprovar 28 correções", ligado: fundo `rgb(13, 13, 13)` | Só a decisão oficial tem a cor do oficial | `grafite #333333` | 3.0 |
| A78 | `professor-turma.spec.ts:506-507` · "sem correção aprovada, o vazio tracejado diz o que falta; com lote aprovado, o acerto por habilidade em barra neutra e os alunos em ordem de nome; …" | Os `svg rect` do acerto por habilidade só têm os `fill` `rgb(240, 240, 240)` e `rgb(93, 93, 93)` | A barra de acerto é neutra: cinza, nunca vermelha nem verde | O da A56: inalterado | 5.0 |
| A79 | `professor-turma.spec.ts:510-512` · mesmo caso | Os nomes lidos por `allInnerTexts()`, tirando o prefixo `Aluno:` que a lista do celular escreve; a ordem é a de nome | Os alunos vêm em ordem de nome, e não em ranking | A regra fica, **e a expressão não muda**: na lista do celular o primeiro campo do item vai em `t-cartao`, sem caixa-alta, e o prefixo escrito só para o leitor de tela chega como `Aluno:`. Só o nome das outras colunas (`dt`) é `t-selo`, e esse não passa por `allInnerTexts()`. Quem pôr o prefixo dentro de um `t-selo` precisa ignorar a caixa na expressão | 5.0 |
| A80 | `professor-assistente.spec.ts:122-123` · "a lateral tem Nova conversa, Ferramentas e Turmas, e "Seu time" com o Assistente e o que espera a professora, e o Tutor sem contador; …" | `[data-contador-do-time]` com `animationName` `none` | O contador não se mexe sozinho (D59) | Inalterado; o atributo `data-contador-do-time` continua na lateral nova | 12.0 |
| A81 | `professor-assistente.spec.ts:253-258` · "o pedido aparece na hora, o Assistente pensa, pergunta se ela quer a ferramenta com duas opções do mesmo tamanho, …" | As duas opções da Escolha, na tela de verdade: mesma largura e mesma altura (arredondadas); fundo, cor, cor da borda e peso iguais | As duas opções da Escolha são iguais (D59) | Inalterado | 10.0 confere |
| A82 | `professor-assistente.spec.ts:720-723` · "Aprovar mostra o que vai acontecer antes de confirmar, passa pela decisão registrada uma vez só, …" | `[data-faixa-esperando]` com `position: sticky` | O que espera a professora fica preso no alto | Inalterado | 12.0 e 13.0 conferem |
| A83 | `professor-assistente.spec.ts:741-743` · mesmo caso | "Aprovar" da entrega pendente: fundo `rgb(13, 13, 13)` | Só a decisão oficial tem a cor do oficial | `grafite #333333` | 3.0 |

### A.9 Telas da coordenação

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A84 | `material.spec.ts:110-117` · "a coordenação sobe o PDF de demonstração com licença e vê "Pronto · 6 páginas", sem recarregar a página" | O `main` tem `paddingLeft` de `24px` a partir de 768 px e `16px` abaixo; `[data-tela]` tem `0px` | A margem da página é uma só, a da casca: a `Tela` não a repete | `32px` a partir de 768 px e `16px` abaixo; `[data-tela]` continua em `0px` | 12.0 |
| A85 | `material.spec.ts:176-177` · "sem licença, a tela diz "Envio recusado" e por quê; …" | O item recusado tem `borderTopStyle` `dashed` | O envio recusado não se confunde com um material (D5) | Inalterado | — |
| A86 | `material.spec.ts:303-308` · "os estados sem dado: carregando, erro com "Tentar de novo", e o vazio que convida a enviar" | Dos botões de `main`, os de fundo `rgb(232, 115, 46)` são só `['Enviar material']` | No máximo um botão primário por tela | Inalterado: `laranja #E8732E` tem o mesmo valor | 3.0 confere |
| A87 | `material.spec.ts:240-242` · "o arquivo entra arrastado e também pelo botão, …" e `:368-373` · "excluir é ação de perigo: …" | "Escolher arquivo" com 44 px; "Cancelar" e "Excluir material" com a mesma altura, de 44 px ou mais | Alvo de toque, e recusar não é menor que confirmar (D59) | Inalterado | 7.0 confere |
| A88 | `estrutura.spec.ts:1283-1284` · "sem rolagem horizontal, também no diálogo; cartões abaixo de 768 px; alvos de 44 px; …" e `professores.spec.ts:567-570` · "sem rolagem horizontal, também no diálogo; cartões e alvos de 44 px; …" | A 360 × 800, o item da lista tem `flexDirection` `column` | Abaixo de 768 px a linha vira cartão em coluna | Inalterado: o miolo das telas é da X2 | — |
| A89 | `incidentes.spec.ts:151-152`, `:154-156` e `:164-169` · "o aviso traz todos os campos do incidente que espera, não traz o já confirmado, e a coordenação o confirma só com o teclado, …" | O texto do aviso com `white-space: pre-line`; o diálogo rola por dentro e cabe na janela; "Confirmar" e "Ver depois" com a mesma altura, de 44 px ou mais (o número está escrito no spec) | O diálogo comprido rola por dentro, e adiar não é menor que confirmar (D59) | Inalterado | 7.0 confere |

### A.10 A lateral, o seletor e as páginas de entrada

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A90 | `meus-dados.spec.ts:250-261` · "o aluno acha Privacidade no rodapé da lateral e, na gaveta a 360 px, sem rolar e com alvo de 44 px; fora da lista de seções" | `Seções` do aluno com `['Tutor', 'Atividades', 'Minha turma']`; "Privacidade" no `Rodapé`, com 44 px; na gaveta a 360 px, à vista sem rolar | O aluno acha a Privacidade sem procurar, e ela não é item da lista de seções | O `Rodapé` continua na gaveta, com 44 px e à vista. A lista de `Seções` do aluno é lida na barra de baixo no celular (parte B) | 13.0 |
| A91 | `meus-dados.spec.ts:281-289` · "o professor acha "Meus dados" no menu da pessoa, antes do "Sair", e o link fica selecionado na tela dele" | "Meus dados" em "Sua conta", acima do "Sair" (pela coordenada `y`), com 44 px; nenhum link "Meus dados" em `Seções` (`toHaveCount(0)`) | "Meus dados" fica no menu da pessoa, antes do "Sair", e não vira item de seção | A ordem e os 44 px ficam. **Negativa** na `:289`: no celular, `lateral(page)` é a gaveta, e `Seções` saiu dela; a asserção passa a olhar a barra de baixo, ou passa vazia | 12.0 e 13.0 |
| A92 | `meus-dados.spec.ts:300-325` · "recolhida a lateral, o aluno ainda alcança Privacidade e o professor, Meus dados, com o nome e o alvo de 44 px" | A 1366 × 768, no trilho: "Privacidade" e "Meus dados" visíveis, com 44 px | O trilho não esconde o caminho dos dados da pessoa | Inalterado (trilho de 88 px) | 12.0 |
| A93 | `minha-turma.spec.ts:147-158` · "sem rolagem horizontal e com o item de 44 px" | A 360 × 800, o item "Minha turma" da gaveta tem 44 px de altura | Alvo de toque no item de navegação | O item passa à barra de baixo, numa coluna de 68 px: os 44 px ficam, medidos lá (parte B) | 13.0 |
| A94 | `troca-de-escola.spec.ts:183` e `:185` · "cada escola com a rede e o papel, a de agora marcada, e nada de dentro da outra escola" | A linha da escola de agora tem um `svg`; a outra, nenhum | A escola ativa é marcada com ícone, e não só com cor | A marca de escolhido continua. A contagem fica a definir na tarefa: se toda linha do seletor ganhar ícone, a asserção passa a procurar a marca pelo nome dela, e não por "um `svg`" | 12.0 |
| A95 | `troca-de-escola.spec.ts:225-238` · "abre e escolhe só com teclado; o Esc fecha a lista sem fechar a gaveta; alvos de 44 px e nada passa da largura" | O botão do seletor e as duas linhas com 44 × 44 px, na lateral aberta e de novo a 360 × 800, na gaveta | Alvo de toque no seletor de escola | Inalterado (o seletor novo tem face de 48 px e continua na gaveta) | 12.0 e 13.0 |
| A96 | `entrar.spec.ts:35-39`, `entrar-na-escola.spec.ts:34-38`, `convite.spec.ts:54-55` e `:139-141`, `mfa.spec.ts:42-43` e `:77-78`, `turma-publica.spec.ts:64-67` e `:466`, `escola-e-vinculos.spec.ts:43-47` | Alvo de 44 px (altura, e largura onde o spec a mede) nos botões das páginas de entrada, do convite, do segundo fator e da página da turma | Alvo de toque de 44 px na ação principal | Inalterado | 14.0 confere |
| A97 | `estrutura.spec.ts:69-72`, `professores.spec.ts:137-141`, `operacao-uso.spec.ts:135-143` e `:227-228`, `operacao-escolas.spec.ts:124-127`, `operacao-convite.spec.ts:133` e `:172`, `operacao-convite-coordenacao.spec.ts:151-154` | Alvo de 44 px nos botões das telas da coordenação e da operação, e nos links da `navigation "Operação"` | Alvo de toque de 44 px | Inalterado | 15.0 confere (a operação) |

### A.11 Asserções que leem o texto como a tela o mostra, e as guardas

| id | arquivo:linha | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| A98 | `acesso-da-turma.spec.ts:414`, `convite.spec.ts:133`, `operacao-convite.spec.ts:198` | O `innerText()` do `main` de duas ou mais telas é igual | Convites e acessos inválidos dão a mesma tela, sem dizer qual é o motivo | Inalterado: a caixa-alta do CSS muda os dois lados por igual | — |
| A99 | `acesso-da-turma.spec.ts:459`, `:496`, `:518`, `:786`, `:965`, `:1089`, `:1128` | O `innerText()` do código na tela, sem espaço, é o código que a API devolveu | O código mostrado é o gerado | Inalterado, enquanto o código não levar `text-transform` (ele já é maiúsculo) | 7.0 confere |
| A100 | `aluno-tutor.spec.ts:254`, `professor-assistente.spec.ts:331`, `pedidos-do-titular.spec.ts:260` | `allInnerTexts()` das falas (24, com o texto de cada uma) e `innerText()` da prévia sem nenhum dígito | "Ver mensagens anteriores" traz as antigas em ordem; a prévia do professor não traz contagem | Inalterado: as asserções procuram o texto da mensagem, que não vai em caixa-alta | 10.0 confere |
| A101 | `guardas.spec.ts:20` e `__fixtures__/paginas.ts:23`, `:26`, `:30` | Páginas montadas pelo teste: uma mais larga que 360 px, botões de 16 px, texto `#d0d0d0` | As próprias guardas pegam (largura, alvo, contraste) | Inalterado: não tocam o produto | — |

`focoVisivel`, `violacoesGraves`, `larguraExcedente`, `larguraExcedenteDoDialogo` e `codigoCru` estão na parte B, com a contagem de chamadas.

### A.12 Testes de unidade da web que afirmam classe ou cor

| id | arquivo:linha e nome do caso | o que afirma hoje | a regra que isso prova | oráculo novo | tarefa |
|---|---|---|---|---|---|
| U1 | `apps/web/src/estilos.test.ts:27-32` e `:125-136` · "estilos.css declara exatamente as cores da 9.9, com o mesmo hex, e nenhuma outra" | O bloco da `### 9.9` tem 33 cores; cada uma está no `estilos.css` com o mesmo hex; nenhuma cor do CSS fica fora do documento | Toda cor do código vem do documento (RF1) | Os dois blocos da 9.10, cada um com o número fixo dele, comparados nos dois sentidos; todo nome do claro existe no escuro | 1.0 |
| U2 | `estilos.test.ts:115-123` · "a paleta é zerada e toda cor devolvida é hex, nunca oklch()" | `--color-*: initial`; `caramelo-texto` declarado; todo valor em hex | Sem a paleta zerada o Chrome 109 perde as cores, calado | Inalterado, valendo também para o bloco escuro (o `veu` vira hex de oito dígitos) | 1.0 |
| U3 | `estilos.test.ts:140-158` · "nenhum arquivo da web pede cor fora do @theme da 9.9 nem modificador de opacidade" | Nenhuma classe de cor fora da lista; âncoras: `botao-secundario.ts` tem `bg-caramelo` e `ia/AssinaturaIA.tsx` tem `bg-ia-cx` | Nenhuma tela pinta com cor fora dos tokens, e a varredura não passa vazia | A guarda aceita os nomes novos e passa a reprovar `white` e `black` fora da lista fechada, `dark:`, o texto `tinta` ou `white` com a mesma variante de uma face forte (`noite`, `erro`, `caramelo` e as duas variantes dele, mais as que a 3.0 cria: `laranja`, `grafite` e `vermelho`), a face que **troca sob uma variante** (`hover:bg-laranja`) quando o texto do estado normal é `tinta` ou `white` e nenhum texto da mesma variante o acompanha, e a cor escrita à mão em qualquer lugar do arquivo, com a cor pelo nome entre aspas. Dois limites ficam dados em fixture, e quem os pega é o axe com o tema escuro: a lista de classes quebrada em várias linhas e a face e o texto em textos diferentes do mesmo template. Entra também a lista fechada do oficial (RF6): `bg-grafite` e `bg-noite` (com `-alto` e `-baixo`) só como face onde a entrada do arquivo diz, com justificativa e a tarefa ou a spec que o tira; arquivo novo reprova, a lista só encolhe (oito entradas hoje: as constantes do oficial e os sete usos de antes). As âncoras seguem a classe que a peça usar: a de `botao-secundario.ts` vira a da face laranja na 3.0, se o nome trocar; a do selo fica (`bg-ia-cx`) | 1.0 (as âncoras, 3.0 e 8.0) |
| U4 | `estilos.test.ts:160-181` · "a guarda reprova a cor fora do @theme e o modificador de opacidade, com o arquivo e a classe" | Uma amostra com dez classes reprovadas e uma linha que passa, com `bg-white` e `text-black` nela | A própria guarda pega | As dez reprovações ficam. `bg-white` e `text-black` saem da linha que passa e entram na lista das reprovadas. Na 3.0 entram dois fixtures, o da face que troca sob a variante (`hover:bg-laranja` com `text-tinta`) e o da face do oficial: arquivo novo com `bg-grafite` ou `bg-noite` reprova, e o arquivo da lista reprova a classe que a entrada dele não cita | 1.0 e 3.0 |
| U5 | `apps/web/src/componentes/botao-secundario.test.ts:15-17` · "são cinco, e nenhuma outra" | `['primario', 'oficial', 'secundario', 'discreto', 'perigo']` | O botão tem um conjunto fechado de desenhos (RF5) | Inalterado: o sexto desenho é o `perigo` com `cheio` | 3.0 confere |
| U6 | `botao-secundario.test.ts:19-23` · "só a oficial pinta de preto: a decisão oficial não se parece com nenhum outro botão (regra 50, item 8)" | Só `oficial` tem `bg-noite`; ela tem `text-white` | Só a decisão oficial tem a cor do oficial | Só `oficial` tem `bg-grafite`, com `text-sobre-grafite`. Entra o RF6: a face e o degrau do oficial, resolvidos em hex nos dois temas, não são os de nenhuma outra variante | 1.0 (o texto) e 3.0 (a face) |
| U7 | `botao-secundario.test.ts:25-30` · "só a primária pinta de laranja, e com texto tinta: branco sobre o laranja dá 3,0:1 e reprova (9.1)" | Só `primario` tem `bg-caramelo`; tem `text-tinta` e não tem `text-white` | Só o primário é laranja, e o texto sobre ele é escuro | Só `primario` tem a face laranja; tem `text-sobre-cor` e não tem `text-white` nem `text-sobre-grafite` | 1.0 (o texto) e 3.0 (a face) |
| U8 | `botao-secundario.test.ts:32-48` · "todas são pílula, com alvo de 44 px no principal; o compacto tem 36 px só a partir de 768 px, e 44 px no celular" | `rounded-full`; `min-h-11 min-w-11`; no compacto, `md:min-h-9 md:min-w-9` e nunca `min-h-9` sem prefixo; o de ícone com `size-11 rounded-full` e sem `px-` | Alvo de 44 px no principal e em tudo no celular. A pílula é medida da pele | O alvo de 44 px e a regra do compacto ficam; as classes exatas ficam a definir na tarefa, porque o `3_task.md` fala em face de 44 e 36 px e a `docs/interface.md` 9.3, em 46 e 38. O canto vira o de 12 px; o botão só de ícone continua círculo | 3.0 |
| U9 | `botao-secundario.test.ts:50-56` · "o perigo só é cheio quando pedido: fora do diálogo de confirmação ele é texto em erro, sem fundo de erro" | `perigo` sem `bg-erro` e com `text-erro`; com `cheio`, `bg-erro`; `cheio` não muda o `primario` | O perigo cheio só existe quando pedido | `perigo` sem `bg-vermelho` e com `text-vermelho-texto`; com `cheio`, `bg-vermelho` e `text-sobre-cor`; `cheio` não muda as outras | 3.0 |
| U10 | `botao-secundario.test.ts:58-70` · "toda variante tem desenho de desligado: o botão que não faz nada não se parece com o que faz" | Toda variante tem `disabled:bg-` ou `disabled:text-`; `perigo` e `secundario` têm `disabled:text-inativo`; as quatro constantes têm desligado | O desligado é outro desenho, e o perigo desligado perde o vermelho | A primeira parte fica. `disabled:text-inativo` vira o texto do desligado da A4, e entra "desligado sem degrau" | 3.0 |
| U11 | `botao-secundario.test.ts:72-80` · "a variante do Botao e a constante escrita à mão dizem o mesmo botão" | As classes de `secundario`, `oficial`, `perigo` e `perigo` cheio são as das quatro constantes, mais `gap-2` | A tela nova e a antiga têm o mesmo botão | Inalterado | 3.0 confere |
| U12 | `apps/web/src/operacao/estados-da-escola.test.ts:36-39` · "a cor é de reforço e vem das famílias de estado da 9.1: verde só para a escola ativa" | Cada tom é um par `bg-<família>-cx text-<família>`, com a família entre `ok`, `pendente`, `erro` e `info`; só `ativa` é `ok` | A cor é reforço do texto, e verde só para a escola ativa | Inalterado: as quatro famílias continuam. Se a 15.0 trocar por família nova, muda só a forma do par | 15.0 confere |
| U13 | `apps/web/rebaixar-cor.test.ts:15-25` · "tira o bloco do modificador de opacidade, também dentro de @media, e não mexe no resto" e "CSS sem color-mix() sai igual" | Amostras de CSS com `#0d0d0d66`, `#e8732e` e `.bg-caramelo`, como entrada do transformador | O build tira `color-mix()` e para com `oklch()` fora de `@supports` | Inalterado: são amostras de entrada, e não a pele | — |
| U14 | `apps/web/src/areas/navegacao.test.ts:5-9` · "W2: "Estrutura" e "Professores" da coordenação, …" e `:100` · "a conversa aberta fica dentro de "Nova conversa", e o artefato aberto, dentro de "Ferramentas"" | O primeiro item do professor é `{ rotulo: 'Nova conversa', caminho: '/professor/nova-conversa' }` | Rótulo. A regra é a do RF16 | `rotulo: 'Início'`, no mesmo caminho | 12.0 |
| U15 | `areas/coordenacao/privacidade/textos-dos-pedidos.test.ts:43-47`, `textos-do-pedido.test.ts:88-109`, `componentes/meus-dados/regras.test.ts:79-113` | A `familia` do selo de cada situação de pedido: `pendente`, `ok`, `erro` ou `info` | A família do selo segue o estado do pedido (o prazo vencido é `erro`; o concluído é `ok`) | Inalterado: o `Estado` revestido mantém as quatro famílias e as props | 6.0 confere |
| U16 | `apps/web/src/componentes/flutuante.test.ts:15-18` · "é 320 px, e a janela menos as duas margens quando ela é mais estreita" | O flutuante tem 320 px, e 288 numa janela de 320 | O menu e o cartão da fonte não passam da janela a 360 px | Inalterado: a 7.0 não mudou a largura do menu (`min(20rem, janela - 2rem)`, a do `flutuante.ts`); o mínimo de 224 px do mockup não entra | 7.0 conferiu |

Os outros testes de unidade da web não afirmam cor, classe nem medida. O teto de `pecas-*` em `.size-limit.json` (26 kB hoje) e `apps/web/nome-dos-chunks.test.ts` medem peso, e seguem a Tech Spec, seção 7c.

### A.13 As regras de produto presas a cor

| # | Regra | Linhas que a provam |
|---|---|---|
| 1 | Só a decisão oficial tem a cor do oficial (o oficial é grafite) | A39, A45, A65, A69, A74, A77, A83, U6; pelo avesso, A32 e A38 |
| 2 | Só o primário é laranja, e há no máximo um por tela | A39, A86, U7; A34 e A47 |
| 3 | Na tela de aprovar não há botão laranja ao lado do oficial | A76 |
| 4 | O perigo cheio só existe dentro do diálogo de confirmação; fora dele o perigo é texto | A40, A46, A66, A69, A70, U9 |
| 5 | As duas opções da Escolha são iguais, e nenhuma é primária nem oficial | A32, A81 |
| 6 | A barra de acerto e a barra de uso são neutras | A56, A78 |
| 7 | O desligado é outro desenho, legível, sem cor de ação | A4, A38, A41, U10 |
| 8 | A pausa do Tutor é aviso, sem vermelho | A57 |
| 9 | O cartão do assunto delicado é calmo: sem alerta, sem animação, sem vermelho | A59 |
| 10 | O selo "IA" tem um desenho só | A27 |
| 11 | A linha de aprovação é o selo de estado | A30 |
| 12 | O anel de foco aparece em toda parada do teclado, e é visível sobre o chão em que está, inclusive a barra da operação | A5, A7, A62 e `focoVisivel` (parte B) |
| 13 | Link de texto tem contraste AA e é sublinhado | A6 |
| 14 | O texto sobre o laranja é escuro e passa o AA | A2, U7 |
| 15 | O item aceso da navegação não depende só de cor | A23, A24 |
| 16 | O aviso de atenção aparece com fundo e borda: cor sem regra não some calada | A11, A12, U3 |
| 17 | O avatar do agente é desenho, nunca foto nem pessoa, e há um por agente | A28 |
| 18 | Nada se mexe sozinho: "preparando a resposta", o contador do time e a tela do Tutor | A51, A53, A80 |
| 19 | No resultado da decisão, o que foi decidido agora e o que não foi têm cores diferentes | A67 |
| 20 | O envio recusado vai em borda tracejada, e não se confunde com um material | A85 |
| 21 | Na operação, verde só para a escola ativa | U12 |
| 22 | A família do selo segue o estado do pedido | U15 |
| 23 | Toda cor servida vem dos tokens do documento, em hex, sem `oklch(` nem `color-mix(` | A1, A9, A10, U1, U2, U3, U4, U13 |
| 24 | Nenhuma tela da operação parece tela de escola | A60, A63 |

E as presas a medida, que a pele também move:

| # | Regra | Linhas que a provam |
|---|---|---|
| M1 | Alvo de toque de 44 px na ação principal e em tudo no celular; 24 px no mínimo | A13, A33, A37, A42, A61, A64, A68, A73, A87, A93, A95, A96, A97, U8 |
| M2 | "Sair" tem o tamanho dos vizinhos e está à vista | A18, A61 |
| M3 | Recusar, cancelar e adiar têm a altura de confirmar | A45, A47, A64, A87, A89 |
| M4 | "Meus dados" vem antes do "Sair", e a Privacidade do aluno fica no rodapé | A17, A90, A91, A92 |
| M5 | A margem da página é uma só | A44, A84 |
| M6 | O que é oficial ou de supervisão fica preso à vista | A48, A55, A75, A82 |
| M7 | A 360 px nada rola de lado, e a linha vira cartão em coluna | A14, A36, A43, A49, A68, A72, A88 e `larguraExcedente` (parte B) |
| M8 | O código da turma é grande | A71 |

---

## Parte B — As fixtures, função a função

As contagens são de chamadas (`nome(`), tiradas com `grep -ohE "\bnome\(" e2e/*.spec.ts`, sem as linhas de `import`, sem a definição e sem a função de mesmo nome que um spec declara para si. O inventário `.processo/inv-E-produto-web.md` (5.2) conta ocorrências do nome, com os `import`, e por isso dá números maiores.

### B.1 `e2e/__fixtures__/casca.ts`

Trinta e quatro specs e duas fixtures (`fluxo-do-professor.ts` e `pedidos-do-titular.ts`) importam deste arquivo.

**O que muda na tela, para a fixture.** Abaixo de 768 px, o professor e o aluno deixam de ter a `navigation "Seções"` dentro do `dialog "Menu"`: ela passa a ser a barra de baixo, sempre visível, fora da gaveta. A coordenação continua com `Seções` na gaveta. A gaveta continua existindo para todos, com a escola, "Seu time", o `Rodapé`, "Sua conta" e o "Sair". Com a gaveta aberta (um `dialog` modal), a barra de baixo fica inerte: quem vai tocar num item de `Seções` do professor ou do aluno não pode abrir a gaveta antes.

| Função (linha) | O que supõe da tela hoje | Chamadas | O que continua afirmando depois da X1 | Linha que muda |
|---|---|---|---|---|
| `naGaveta` (`:13-15`) | A casca é a do celular quando a janela tem menos de 768 px (número escrito na fixture) | 7 em 5 specs, e 4 na própria fixture | O mesmo: a quebra continua em 768 px (RF14). O nome passa a dizer só "a casca é a do celular"; não diz mais onde estão os itens de `Seções` | Nenhuma |
| `gaveta` (`:18`) | Existe um `dialog` de nome "Menu" | 29 em 5 specs, e 3 na fixture | O mesmo | Nenhuma |
| `lateral` (`:24-26`) | Tudo o que é da lateral está na gaveta, no celular, ou na página, no computador | 73 em 18 specs, e 3 na fixture | Continua valendo para o que fica na gaveta: a marca, o seletor, "Seu time", `Rodapé`, "Sua conta", "Sair", o nome e o papel da pessoa. Deixa de valer para `Seções` do professor e do aluno no celular | Nenhuma na função. Entra uma função nova que devolve onde está a `navigation "Seções"` agora (a barra de baixo ou a gaveta), e as linhas da lista abaixo passam por ela |
| `abrirNavegacao` (`:29-35`) | No celular, o botão "Abrir o menu" abre a gaveta | 47 em 17 specs, e 2 na fixture | O mesmo, para chegar ao que está na gaveta | Nenhuma na função. Quem a chama só para alcançar `Seções` como professor ou aluno deixa de chamar |
| `irPelaNavegacao` (`:38-43`) | Abre a gaveta e clica no link de nome `<rótulo>` dentro de `lateral(page)` e de `navigation "Seções"` | 85 em 22 specs, 2 em outras fixtures e 1 na própria (`:157`) | Vai a uma seção pelo link dela, em `navigation "Seções"`, pelo nome | `:39` (só abre a gaveta quando `Seções` está nela) e `:40` (o escopo deixa de ser `lateral(page)` e passa a ser o da função nova) |
| `botaoDoSeletor` (`:50`) | Na lateral há um botão cujo nome começa por "Escola: ", só para quem tem mais de uma escola | 10 em 3 specs, e 1 na fixture | O mesmo: o seletor fica na gaveta no celular, com o mesmo nome | Nenhuma |
| `nomeNoSeletor` (`:53-55`) | A linha da lista se chama "`<escola>, <rede> · <papel>`" | 27 em 5 specs | O mesmo: o seletor novo mostra a escola, a rede e o papel | Nenhuma |
| `linhaDoSeletor` (`:58`) | Cada linha da lista é um `button` com esse nome exato, dentro da lateral | 17 em 2 specs, e 1 na fixture | O mesmo | Nenhuma |
| `abrirSeletorDeEscola` (`:61-67`) | Abre a gaveta, clica no botão, e ele fica com `aria-expanded="true"` | 8 em 2 specs, e 1 na fixture | O mesmo | Nenhuma |
| `escolherNoSeletor` (`:70-75`) | Abre o seletor e clica na linha | 6 em 4 specs | O mesmo | Nenhuma |
| `PRAZO_DA_ENTRADA_MS` (`:78`) | 20 s para a entrada, no perfil lento | Importada por 23 specs | O mesmo | Nenhuma |
| `entrarPorEmail` (`:89-93`) | Campos de rótulo "E-mail" e "Senha", e um botão de nome exatamente "Entrar" | 22 em 10 specs, 1 em outra fixture e 3 na própria | O mesmo: a 14.0 não muda texto nem ordem de campo (RF20). A caixa-alta do rótulo é de CSS e não muda o nome acessível | Nenhuma |
| `TITULO_DA_NOVA_CONVERSA` (`:96`) | A aba se chama "Nova conversa · Turmma" | 3 usos, todos em `areas.spec.ts` (`:114`, `:124`, `:168`) | O título da tela em que o professor abre | `:96`: o valor vira "Início · Turmma" (tarefa 12.0) |
| `esperarNovaConversa` (`:105-112`) | O endereço `/professor/nova-conversa`; a saudação "Bom dia, `<primeiro nome>`."; o nome inteiro dentro de `dialog[aria-label="Menu"]`, no celular, ou da página; e a escola à vista, quando pedida | 37 em 17 specs, 1 em outra fixture e 1 na própria | O mesmo: o endereço não muda (RF18), a saudação é do miolo, e a conta continua na gaveta | Nenhuma. Depende de a gaveta continuar no DOM enquanto está fechada, com o nome da pessoa dentro (`:110`), e de a barra de topo mostrar a escola ativa (`:111`) |
| `abrirAbaAlunos` (`:119-124`) | Na turma aberta há um `tab` "Alunos", que fica com `aria-selected="true"` | 15 em 4 specs | O mesmo: as `Abas` são revestidas sem mudar de papel, e as três abas da D80 são da X3 | Nenhuma |
| `entrarComoProfessora` (`:127-133`) | `/entrar`, `entrarPorEmail` e `esperarNovaConversa` | 11 em 3 specs | O mesmo | Nenhuma |
| `esperarGovernanca` (`:140-143`) | O endereço `/coordenacao/governanca` e um `h1` "Governança" no DOM | 23 em 10 specs, 2 em outras fixtures e 1 na própria | O mesmo. O `h1` passa a ser visível (RF12): `toBeAttached` continua verdadeiro, e a tarefa 11.0 prova a visibilidade no caso dela | Nenhuma |
| `esperarEstrutura` (`:146-149`) | O endereço `/coordenacao/estrutura` e um `h1` "Estrutura" | 1 em 1 spec, e 1 na fixture | O mesmo | Nenhuma |
| `abrirEstrutura` (`:155-159`) | A coordenação abre em Governança e vai a "Estrutura" pela navegação | 17 em 4 specs | O mesmo: os sete itens da coordenação continuam na gaveta no celular | Nenhuma |
| `entrarComoCoordenacaoNaMesmaAba` (`:167-180`) | Os títulos "Configurar o segundo fator" e "Segundo fator"; o botão "Ativar o segundo fator"; o link "Ir para a entrada"; o campo do código; a resposta de `/v1/conta/mfa/configurar` | 36 em 10 specs, e 2 em outras fixtures | O mesmo (RF20) | Nenhuma |
| `TITULO_DAS_ATIVIDADES` (`:183`) | A aba se chama "Atividades · Turmma" | Nenhum uso | O mesmo | Nenhuma |
| `esperarAtividades` (`:191-199`) | O endereço `/aluno/atividades`; um `h1` "Atividades" dentro do `main`; e, na gaveta ou na página, o nome, a palavra "aluno" e a escola | 11 em 9 specs, e 1 na fixture | O mesmo. Depende de o pé da lateral continuar escrevendo o papel por extenso (`:197`), de haver um `main` só (`:194`) e de a gaveta continuar no DOM fechada | Nenhuma |
| `entrarComoAluno` (`:202-208`) | `/e/<slug>`, os campos "Matrícula" e "Senha", o botão "Entrar", e `esperarAtividades` | 18 em 5 specs | O mesmo (RF20) | Nenhuma |

**Os rótulos que `irPelaNavegacao` recebe.** Do professor e do aluno, que mudam de lugar no celular: "Turmas" (33), "Ferramentas" (9), "Minha turma" (7), "Tutor" (2), "Nova conversa" (2) e "Atividades" (2), mais as duas chamadas em laço de `areas.spec.ts` (`:141` e `:249`, três itens cada). Da coordenação, que ficam na gaveta: "Privacidade" (10), "Estrutura" (8, uma delas em `casca.ts:157`), "Professores" (5), "Material" (3), "Analista" (2), "Agentes" (2) e "Governança" (1). `operacao-uso.spec.ts:54` declara uma `irPelaNavegacao` própria, para a `navigation "Operação"`, e não usa a da fixture.

**As linhas de spec que leem `Seções` sem passar por `irPelaNavegacao`**, e que mudam junto na tarefa 13.0:

| Papel do caso | Linhas | O que acontece no celular se ficarem como estão |
|---|---|---|
| Professor | `acesso-da-turma.spec.ts:322`; `areas.spec.ts:127`, `:156`, `:170`; `professor-assistente.spec.ts:113`, `:135`; `tokens.spec.ts:185` (pela variável `casca`) | Reprovam: o link não está na gaveta |
| Professor | `areas.spec.ts:171` e `meus-dados.spec.ts:289` (as duas com `toHaveCount(0)`) | **Passam vazias**: procuram numa `Seções` que não existe mais dentro da gaveta |
| Aluno | `minha-turma.spec.ts:155`; `areas.spec.ts:240`, `:254`; `meus-dados.spec.ts:250`; `escola-e-vinculos.spec.ts:198` | Reprovam |
| Coordenação | `areas.spec.ts:418`; `estrutura.spec.ts:1294`; `professores.spec.ts:265`, `:266` | Continuam certas: os itens ficam na gaveta |
| Professor, direto na gaveta ou na página | `casca.spec.ts:335` (`toHaveCount(0)` na página, **passa a estar errada**), `:356` e `:463` | Ver A14, A15 e A20 |

**O rótulo "Nova conversa".** Vira "Início" em `casca.ts:96`; em `areas.spec.ts:45`; em `casca.spec.ts:387`, `:428` e `:463`; em `professor-assistente.spec.ts:108`, `:110`, `:113` e `:135` (e no título do caso da `:101`); em `roteiro-da-demonstracao.spec.ts:356`; e em `apps/web/src/areas/navegacao.test.ts:7` (e no título do caso da `:100`). Os comentários que dizem "Nova conversa" não são asserção.

### B.2 `e2e/__fixtures__/tela-da-operacao.ts`

| Função (linha) | O que supõe da tela hoje | Chamadas | O que continua afirmando depois da X1 | Linha que muda |
|---|---|---|---|---|
| `acionar` (`:9-13`) | Um `button` com o nome dado | Importada por 4 specs da operação (89 linhas com chamada) | O mesmo | Nenhuma |
| `esperarCasca` (`:16-19`) | Existe um `banner` com o nome do operador, e o endereço é `/operacao` | 6 em 2 specs, e 1 na fixture; `operacao-convite.spec.ts:77` a embrulha e a chama 3 vezes | O mesmo. A barra de topo clara continua sendo um `header` com o nome do operador escrito dentro dele | Nenhuma |
| `entrarNaOperacao` (`:22-32`) | O título "Entrar na operação"; os campos "E-mail", "Senha" e "Código do aplicativo"; o título "Segundo fator"; o botão "Entrar" | 26 em 5 specs | O mesmo (RF20) | Nenhuma |

### B.3 `e2e/__fixtures__/verificacoes.ts`

| Função (linha) | O que supõe da tela hoje | Chamadas | O que continua afirmando depois da X1 | Linha que muda |
|---|---|---|---|---|
| `ALVO_DE_TOQUE_PRINCIPAL_PX` (`:10`) | 44 | 60 usos em 21 specs | 44 | Nenhuma |
| `violacoesGraves` (`:19-28`) | O axe, com as tags WCAG 2.0 a 2.2 AA, não acha violação `serious` nem `critical` | 269 em 40 specs | O mesmo, no tema claro. O spec novo do escuro chama a mesma função com o sistema escuro emulado | Nenhuma |
| `larguraExcedente` (`:34-36`) | O documento não passa da largura da janela | 181 em 40 specs | O mesmo, com as duas barras fixas do celular na conta | Nenhuma |
| `larguraExcedenteDoDialogo` (`:43-45`) | Há um só `dialog[open]`, e o conteúdo dele não passa da largura dele | 34 em 18 specs | O mesmo. A gaveta e o `PainelLado` também são `dialog`: quem chama precisa ter um só aberto | Nenhuma |
| `focoVisivel` (`:48-56`) | O elemento ativo casa com `:focus-visible` e tem contorno de 2 px ou mais, **ou** qualquer `box-shadow` | 19 em 9 specs: `casca` (3), `pecas` (3), `turma-publica` (3), `entrar` (2), `entrar-na-escola` (2), `escola-e-vinculos` (2), `troca-de-escola` (2), `incidentes` (1) e `operacao-convite` (1) | O elemento ativo casa com `:focus-visible` e tem `outline-style: solid`, `outline-width: 3px` e `outline-color` igual ao token `foco` (`rgb(20, 110, 170)` no claro) | `:53` (2 px vira 3 px sólido, e entra a cor) e `:54` (a sombra deixa de valer: o degrau é sombra permanente, e a asserção passaria sempre). Vai na tarefa 3.0, e o arquivo não está na lista dela. O afastamento não entra no oráculo, porque varia por peça (2 px, 0 no campo, por dentro na linha de tabela) |
| `codigoCru` (`:72-74`) | O código de erro cru aparece entre caracteres que não são hexadecimais | 23 em 16 specs | O mesmo | Nenhuma |

Uma armadilha do `focoVisivel` novo: ele mede o elemento ativo. Peça que desenhar o anel em outro elemento (o rótulo da `Opcao`, por exemplo) reprova nele, e é a peça que muda, não a guarda.

---

## Parte C — Contagem de casos por spec, antes da X1

**E2E.** Comando: `grep -cE "^\s*test\(" e2e/*.spec.ts`, no commit `426e259`. Nenhum spec tem `test.skip`, `test.only`, `test.fixme` nem caso declarado em laço. Todo caso roda nos projetos `chromebook` (1366 × 768) e `celular` (360 × 800).

| Spec | Casos |
|---|---|
| `a2-assistente.spec.ts` | 3 |
| `a3-a4-professor.spec.ts` | 1 |
| `acesso-da-turma.spec.ts` | 9 |
| `acesso-suspenso.spec.ts` | 4 |
| `aluno-atividade.spec.ts` | 5 |
| `aluno-fluxo.spec.ts` | 2 |
| `aluno-tutor.spec.ts` | 6 |
| `areas.spec.ts` | 14 |
| `casca.spec.ts` | 17 |
| `convite.spec.ts` | 11 |
| `entrar-convite-revogado.spec.ts` | 2 |
| `entrar-na-escola.spec.ts` | 10 |
| `entrar.spec.ts` | 16 |
| `escola-e-vinculos.spec.ts` | 10 |
| `escola-montada.spec.ts` | 1 |
| `estrutura.spec.ts` | 11 |
| `governanca.spec.ts` | 5 |
| `guardas.spec.ts` | 5 |
| `inatividade.spec.ts` | 7 |
| `incidentes.spec.ts` | 10 |
| `material.spec.ts` | 9 |
| `meus-dados.spec.ts` | 14 |
| `mfa.spec.ts` | 3 |
| `minha-turma.spec.ts` | 4 |
| `operacao-convite-coordenacao.spec.ts` | 9 |
| `operacao-convite.spec.ts` | 9 |
| `operacao-escolas.spec.ts` | 7 |
| `operacao-uso.spec.ts` | 5 |
| `operacao.spec.ts` | 10 |
| `pecas.spec.ts` | 12 |
| `pedido-do-titular.spec.ts` | 16 |
| `pedidos-do-titular.spec.ts` | 12 |
| `pedidos.spec.ts` | 8 |
| `privacidade.spec.ts` | 9 |
| `professor-assistente.spec.ts` | 13 |
| `professor-turma.spec.ts` | 8 |
| `professores.spec.ts` | 8 |
| `roteiro-da-demonstracao.spec.ts` | 1 |
| `tokens.spec.ts` | 4 |
| `troca-de-escola.spec.ts` | 8 |
| `turma-publica.spec.ts` | 12 |
| **Total: 41 specs** | **330** |

São 660 execuções por rodada, com os dois projetos. `roteiro-da-demonstracao.spec.ts` é um caso só, com 15 `test.step`: o número de passos também não cai. Quando a tarefa 2.0 dividir `pecas.spec.ts`, a soma dos `pecas-<grupo>.spec.ts` é 12 ou mais.

**Unidade e componente da web.** Comando: `grep -cE "^\s*(it|test)\(" <arquivo>`, somado por pasta, sobre os `*.test.ts` e `*.test.tsx` de `apps/web`, no mesmo commit.

| Pasta | Arquivos | Casos |
|---|---|---|
| `apps/web` | 2 | 24 |
| `apps/web/src` | 3 | 12 |
| `apps/web/src/api` | 10 | 160 |
| `apps/web/src/areas` | 1 | 9 |
| `apps/web/src/areas/aluno` | 4 | 52 |
| `apps/web/src/areas/coordenacao` | 7 | 69 |
| `apps/web/src/areas/coordenacao/privacidade` | 6 | 65 |
| `apps/web/src/areas/professor` | 9 | 81 |
| `apps/web/src/componentes` | 9 | 46 |
| `apps/web/src/componentes/ia` | 6 | 53 |
| `apps/web/src/componentes/meus-dados` | 1 | 23 |
| `apps/web/src/componentes/pedidos` | 3 | 26 |
| `apps/web/src/operacao` | 6 | 32 |
| `apps/web/src/operacao/api` | 3 | 46 |
| `apps/web/src/paginas` | 1 | 8 |
| **Total** | **71** | **706** |

Fora dessa conta fica uma declaração `it.each` de duas linhas, em `apps/web/src/operacao/api/sessao.test.ts:313`: com ela são 707 declarações e 708 casos executados. Só um arquivo renderiza componente hoje (`componentes/pedidos/ListaDePedidos.test.tsx`, 5 casos).

---

## O que ficou em aberto

Cada item abaixo é uma linha da parte A marcada "a definir", ou uma divergência entre documentos que muda o oráculo. Fecha na tarefa indicada, com a decisão escrita em "Divergências resolvidas nesta tarefa".

1. **O texto do botão desligado** (A4, A41, U10). Fechado na rodada 2 da revisão da spec: é `apoio`, nos dois temas, em todo documento (`sutil` daria 3,72:1 no escuro). A 3.0 só implementa.
2. **O anel sobre chão escuro** (A7). Sem a regra `.bg-noite :focus-visible`, o caso precisa de outro chão para provar o 3:1. Tarefa 3.0.
3. **O que a 3.0 leva e não lista.** O anel muda para todos na 3.0: `e2e/operacao.spec.ts:105` (A62) e `e2e/__fixtures__/verificacoes.ts:53-54` (`focoVisivel`) mudam nela, e nenhum dos dois está em "Arquivos previstos". O mesmo vale para o `pecas-<grupo>` que ficar com o caso do diálogo de confirmação (A45, A46) e para o da Escolha (a negativa da A32).
4. **O link de texto** (A6). `componentes/NaoEncontrada.tsx` não está em nenhuma tarefa; o teste fica como está, a menos que alguma o troque.
5. **O aviso de `/mfa`** (A12): continua escrito à mão ou passa à peça `Aviso`. Tarefa 14.0. **Fechado na 14.0:** continua escrito à mão, com as cores e a borda de 1 px de hoje (`pendente-cx`, `pendente`); o `casca.spec.ts` (A12) fica sem edição.
6. **O preenchimento da barra neutra e o elemento dela** (A56, A78). Tarefa 5.0. **Fechado na 5.0:** trilho `ia-cx` e enchimento `sutil`, como hoje, no `svg rect`; só a forma muda.
7. **A igualdade entre a linha de aprovação e o selo de estado** (A30) cruza a 6.0 e a 10.0, que correm em paralelo.
8. **"Operação Turmma" ou "Equipe Turmma"** (A60): o `tasks.md` (15.2) e o e2e dizem a primeira; a `docs/interface.md` 11.4, a segunda. **Resolvido na 15.0:** fica "Operação Turmma", e a `docs/interface.md` foi corrigida.
9. **A medida da face do botão**: 44 e 36 px no `3_task.md`, 46 e 38 px na `docs/interface.md` 9.3. Os e2e passam nos dois; o teste de unidade (U8) precisa de uma.
10. **A posição da `Aparencia` na ordem do Tab** da lateral (A17). Tarefa 2.0. **Fechado na 2.0:** entre "Meus dados" e "Sair", uma parada só (a opção marcada do grupo de rádio); no trilho de 56 px ela não aparece, e a pessoa a alcança abrindo a lateral.
11. **A contagem de `svg`** no avatar (A28) e na linha do seletor (A94). Tarefas 8.0 e 12.0.
12. **O número de nomes de cada bloco da 9.10** (A1, U1). Tarefa 1.0.
