# Achados das revisões — `tasks/prd-telas-da-coordenacao/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-16 21:24:30 · `tasks/prd-telas-da-coordenacao/3_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: sim. Li as 26 fotos pedidas, da escola cheia e da vazia, no computador e no celular. Fotografei também Professores, Material, Pedidos, Agentes e Analista. Medi a página real a 1366 × 768 com Playwright. Na vitrine a escola "vazia" tem ano, séries e turma, então ela não prova o estado vazio de Escola. O estado vazio de Registros › IA, de Material e de Pedidos aparece e convida ao próximo passo.

Estados: ok. Carregando é o `EstadoCarregando` dentro do `Suspense` da moldura, e as abas ficam na tela enquanto o pedaço chega (`moldura.tsx`). Erro continua em cada tela de dentro, com `EstadoErro` e "Tentar de novo". Falha de chunk cai na `FronteiraDaArea`. Vazio e com dado aparecem nas fotos. Não vi carregando nem erro em foto, só no código.

Acessibilidade: ok. O painel da aba tem nome e `tabIndex={0}`, então a rolagem dele se alcança pelo teclado. O `Segmentado` é `radio` com rótulo "O que ver em Privacidade". A lista de abas tem rótulo, e o "‹ Registros" e o "‹ Escola" têm `aria-label` que contém o texto visível. Há um só `h1` por tela, o da moldura.

Chromebook fraco: falha em RF23, ver o bloqueante 1. `Estrutura`, `ListaDaTurma`, `Professores` e as molduras viraram `lazy()`, o que ajuda o bundle.

Celular: ok em 360 px. Sem rolagem horizontal. A barra de baixo tem os quatro lugares, as abas medem 44 px e os alvos do `Segmentado` passam de 24 px. Não rodei o projeto `celular` do Playwright.

Ação oficial protegida: sim. Esta tarefa não cria ação oficial nova. "Abrir dado nominal" continua com finalidade e auditoria.

Bloqueantes:

1. **A página rola a 1366 × 768, e RF23 e a Tech Spec §9 "Altura" dizem que só o miolo rola.**
   - Onde: `apps/web/src/areas/coordenacao/moldura.tsx:25` (`O_MIOLO_QUE_ROLA = 'md:max-h-[calc(100dvh-13rem)] …'`) e `apps/web/src/componentes/Abas.tsx:92`.
   - O que medi no Chromium de 1366 × 768:
     - O miolo começa em y = 226 e tem 560 px de altura, então termina em 786, mais baixo que a janela de 768. O `main` termina em 818. A página rola pelo menos 50 px, e as últimas linhas do miolo ficam fora da janela.
     - Em `/coordenacao/estrutura`, `documentElement.scrollHeight` é 1450 contra 768 de janela, então a página rola 682 px sobre área em branco. Em `/privacidade/retencao` são 1320 px e em `/governanca` são 818 px.
     - A causa dos 1450 px são os `span.sr-only` (position absolute) dentro do painel. O bloco que os contém fica fora do elemento que rola, então o painel não os recorta e eles esticam o documento.
     - Está nas fotos `coordenacao--coordenacao-estrutura--computador.png` (cerca de 1440 px de altura, miolo cortado em y = 786, branco abaixo), `coordenacao--coordenacao-privacidade-retencao--computador.png` e `coordenacao--coordenacao-governanca--computador.png`.
   - Por que passou: `molduras.test.tsx › só o miolo rola a partir de 768 px` só confere a string da classe. `paginaNaoRola` (`e2e/__fixtures__/coordenacao.ts:95`) foi criada na subtarefa 3.5 e **nenhum spec a chama**. Se chamasse, falharia nas três telas.
   - Correção exigida:
     - Descontar a altura real acima do miolo. A conta de 13rem esquece o cabeçalho com o sino, de cerca de 84 px, e a margem de baixo de 32 px, o que dá algo perto de 16rem. Ou então montar a cadeia flex da casca com `min-h-0`, para o miolo ocupar o resto da janela.
     - Dar `relative` ao painel para conter os `sr-only`.
     - Chamar `paginaNaoRola` em `e2e/areas.spec.ts` ou nos specs de cada aba de Escola e de Registros, nos projetos `chromebook` e `celular`.

2. **O texto manda a coordenação para "Estrutura", que deixou de existir na lateral.** A lateral só tem Painel, Analista, Escola e Registros. Esta tarefa tirou o nome, e estas telas ficaram para trás:
   - `apps/web/src/areas/coordenacao/Material.tsx:228`: "crie as disciplinas da escola em Estrutura". Aparece no primeiro dia da escola nova, quando ainda não há disciplina, e a pessoa não acha onde ir.
   - `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:404`: "Volte para Estrutura". O link de voltar logo acima já diz "Escola".
   - Nenhuma tarefa seguinte cobre esses dois arquivos. Correção exigida: trocar por "Escola › Turmas" (ou "a aba Turmas de Escola") e ajustar a asserção do teste que cita o texto.

Recomendações:
- `Pedidos.tsx:91`, `privacidade/textos-dos-pedidos.ts:86,90,114`, `privacidade/textos-do-pedido.ts:163,207` e `DetalheDoPedido.tsx:185` também dizem "Estrutura". A tarefa 12.3 já prevê o link de `Pedidos.tsx`. Confirme que a 12.0 cobre os demais, inclusive o `DetalheDoPedido`.
- Escola a 360 px: a aba "Material" cai numa segunda linha (`coordenacao--coordenacao-professores--celular.png`). Não esconde nada, mas ficaria melhor com as abas numa linha só. Registros cabe numa linha.
- Registros › IA, no computador e no celular: o botão "Como cada IA trabalha" encosta no parágrafo acima, e "Consumo do mês por função" encosta no texto anterior. É da 10.0, que recompõe a aba.
- O miolo com rolagem interna não tem indicação visível de que rola. Quando o bloqueante 1 for corrigido, vale uma sombra ou uma borda no pé.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/moldura.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/componentes/Abas.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/__fixtures__/coordenacao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Material.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/ListaDaTurma.tsx`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-16 21:24:56 · `tasks/prd-telas-da-coordenacao/3_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em §9, "Altura" (a página rola a 1366 × 768, ver o bloqueante)
Portão local: carimbo válido

Bloqueantes:

1. **A página inteira rola a 1366 × 768 em toda aba de moldura com conteúdo longo.** O erro está em `apps/web/src/areas/coordenacao/moldura.tsx:32` (`O_MIOLO_QUE_ROLA = 'md:max-h-[calc(100dvh-13rem)] md:overflow-y-auto'`).
   - **Tech Spec §9, "Altura":** "a partir de 768 px só o miolo rola". O comentário da própria moldura (linhas 25-31) cita o RF23 e promete o mesmo.
   - **O que as fotos mostram:** a vitrine tira a foto da página inteira (`fullPage`) com a janela em 1366 × 768, então a altura da foto é a altura da página. Sem a moldura, Painel, Analista e Pedidos dão 768. Com ela:
     - `/coordenacao/governanca--computador.png` tem 818 px, cheia e vazia;
     - `coordenacao--coordenacao-material--computador.png` tem 828 px;
     - `coordenacao--coordenacao-estrutura--computador.png` tem 1450 px;
     - `coordenacao--coordenacao-privacidade-retencao--computador.png` tem 1320 px.
   - **A conta da Governança fecha:** o miolo começa em y≈226 e tem 100dvh − 13rem = 560 px de altura. Ele termina em 786, e com os 32 px de margem de baixo do `main` a página chega a 818.
   - **Causa:** os 13rem não contam a faixa do sino acima do título, cerca de 50 px. Na Estrutura e na Retenção a página passa de 1300 px. Isso indica, em adição, algo posicionado em `absolute` dentro do miolo (texto `sr-only` de anúncio, por exemplo) que escapa da região de rolagem, porque o painel não é `relative`.
   - **Por que o teste não pegou:** `molduras.test.tsx:84` ("só o miolo rola a partir de 768 px") só confere se as classes existem. Ele passa com a página rolando.
   - **Correção exigida:**
     - fazer a moldura caber de fato, descontando a faixa do sino e as margens do `main`, ou trocar a conta fixa por um layout em coluna flexível que ocupe a altura da janela;
     - pôr `md:relative` no painel que rola, para nada posicionado escapar dele;
     - chamar `paginaNaoRola` (`e2e/__fixtures__/coordenacao.ts:95`, hoje sem uso) no laço do W2 em `e2e/areas.spec.ts`, em cada tela de Escola e de Registros. Assim a regra fica provada a 1366 × 768 e o teste quebra se a conta voltar a errar.

Recomendações:
- **3ª linha de "Divergências" do `3_task.md`** (a Privacidade redireciona e a rota não repete a guarda): não é divergência, e o lugar citado (`techspec.md` §5, linha `/privacidade/retencao…`) não fala disso. Tire a linha ou escreva a frase na §5.
- **Textos na tela ainda mandam a pessoa a "Estrutura"**, um lugar que a navegação já não tem:
  - `apps/web/src/areas/coordenacao/ListaDaTurma.tsx:58` e `:404`, logo ao lado do link "‹ Escola";
  - `Material.tsx:228`;
  - `privacidade/Pedidos.tsx:91`;
  - `privacidade/DetalheDoPedido.tsx:185`;
  - `privacidade/textos-do-pedido.ts:163`.

  Deixe registrado nas tarefas 9.0, 8.0 e 12.0, que tocam esses arquivos, para nenhum sair sem a troca (regra 60, vocabulário da interface).
- **O endereço dos pedidos tem duas fontes:** `ROTAS_DA_COORDENACAO.pedidos` (`caminhos.ts`) e `caminhoDaAbaDaPrivacidade('pedidos')` (`Registros.tsx:15`). Use uma só.
- **Teste que confere a si mesmo:** `cliquesAte(tela)` em `e2e/areas.spec.ts:347` compara a tabela da fixture com ela mesma. A prova real do RF3 é a navegação que vem em seguida, e a asserção pode sair.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/moldura.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/molduras.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/__fixtures__/coordenacao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/areas.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/.processo/vitrine/coordenacao--coordenacao-governanca--computador.png`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/.processo/vitrine/coordenacao--coordenacao-estrutura--computador.png`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/.processo/vitrine/coordenacao--coordenacao-privacidade-retencao--computador.png`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-16 21:25:44 · `tasks/prd-telas-da-coordenacao/3_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Os lugares: quatro, na ordem, e cada endereço de hoje acende o lugar dele. Um endereço que só começa igual não acende nada.
- As molduras: a aba do endereço é a selecionada, trocar navega, há um `h1` só, a aba do navegador diz o título certo, o foco volta ao título da moldura e só o miolo rola a partir de 768 px.
- O seletor da Privacidade: marca a opção certa, navega, não abre aba dentro de aba, e uma tela que não existe abre os pedidos.
- As passagens: a raiz leva ao Painel com `replace`, a IA leva aos Agentes pelo link, e a lista da turma e os Agentes voltam para o lugar de onde vieram.
- O W2: a coordenação abre em `/coordenacao/painel`, tem os quatro lugares na barra de baixo a 360 px, e cada tela fica a até dois cliques (Empresas e Incidentes a três).
- Recomeço com segunda pessoa e troca de escola, sem perder asserção.
- Casos movidos sem editar o corpo.
- Permissão (professor e aluno não chegam à área) e isolamento: não há consulta nova, então valem os testes de hoje.
- Concorrência: não se aplica, porque a tarefa não traz operação nova.

**Cobertos:**
- Os lugares, as molduras, o seletor, as passagens, o W2 e o recomeço estão cobertos por testes de unidade, componente e e2e.
- Rodei os 9 arquivos de unidade e componente tocados: 108 testes, todos verdes.
- Conferi os casos movidos linha a linha:
  - `lista-da-turma.spec.ts` e `alocacao.spec.ts` diferem do original só na troca permitida (`esperarPainel`, "Voltar para Escola").
  - `agentes.spec.ts` e `analista.spec.ts` só trocam `irPelaNavegacao` por `irPelaCoordenacao`.
- As asserções que mudaram estão todas na lista da divergência 2 da `techspec.md` §5.
- O redirecionamento de `/coordenacao/privacidade` e do endereço que não existe continua provado em `e2e/privacidade.spec.ts:100-111`.
- Não há `.skip` nem mock de coisa nossa, e a tarefa não chama IA.

**Bloqueantes:**

1. **Cláusulas novas sem bloco na seção "Mutações".** Cada uma já tem um teste que ficaria vermelho, então a correção é só declarar os blocos:
   - `apps/web/src/areas/coordenacao/rotas.tsx`: não há nenhum bloco para o arquivo central da subtarefa 3.3.
     - A aba que cada endereço passa: `:62` turmas, `:72` professores, `:77` material, `:83` ia, `:102` privacidade. O teste é `e2e/areas.spec.ts › a coordenação abre no Painel…`, onde o `irPelaCoordenacao` confere o `aria-selected` da aba, e o título "Escola: turmas" / "Registros: IA".
     - A rota `:94-98` `/privacidade/pedidos` e a posição dela antes de `privacidadeDaAba`. Sem ela, o endereço cai na `Privacidade`, que redireciona para ele mesmo. O teste é `e2e/privacidade.spec.ts › o endereço sem aba…` ou `e2e/pedidos-do-titular.spec.ts`.
   - `apps/web/src/areas/coordenacao/moldura.tsx:72`: o `navegar(aba.caminho)` do `aoMudar`. O teste é `molduras.test.tsx › trocar de aba navega…`.
   - `moldura.tsx:58` e o mapa `TITULO_DA_ABA` (`Escola.tsx:18-22`, `Registros.tsx:19-23`). O teste é `molduras.test.tsx › a aba do endereço (%s) é a única selecionada…`, que confere o `document.title`.
   - `apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx`:
     - `:31`: o `aoMudar` que navega. O bloco que existe só troca o rótulo. O teste é `molduras.test.tsx › escolher no seletor navega…`.
     - `:32`: a tela de cada valor, com o ramo final que mudou de `<Pedidos />` para `<Retencao />`. Os testes são `e2e/incidentes.spec.ts` e `e2e/privacidade.spec.ts`.
   - `apps/web/src/areas/navegacao.ts:659`: o `icone: { lugar: 'ia' }` do Analista, e os ícones dos outros três. O teste é `itens-da-lateral.test.tsx › o ícone ilustrado é de Início…`.

2. **`moldura.tsx:76`, `<Suspense key={ativa}>`: cláusula sem bloco e sem teste que a derrube.** O `navigate` do wouter não roda em transição, então o fallback aparece com ou sem a `key`. Nenhum teste fica vermelho se ela sair. É preciso escolher uma das duas:
   - provar o efeito com um teste e declarar o bloco;
   - ou tirar a `key`.

3. **"Só o miolo rola a partir de 768 px" está provado só pelo nome da classe, não pelo resultado.**
   - `molduras.test.tsx:84-94` confere a string `md:max-h-[calc(100dvh-13rem)]`. Com 5rem ou 20rem no lugar de 13rem o teste continua verde, e a página da Estrutura passaria a rolar junto com o miolo a 1366 × 768.
   - A fixture que existe para isso, `paginaNaoRola` (`e2e/__fixtures__/coordenacao.ts:95`, pedida pela subtarefa 3.5 e citada na `techspec.md` §10), não é chamada por nenhum spec.
   - Correção: chamar `paginaNaoRola(page)` no laço dos lugares de `e2e/areas.spec.ts`, ao menos em Escola › Turmas, que é longa, e em Registros › IA. Assim a altura é provada no projeto `chromebook`.

**Recomendações:**
- Corrigir os comentários desatualizados:
  - `e2e/lista-da-turma.spec.ts:496-497` ainda fala em "a página inicial leva a coordenação para a Governança";
  - `:502` ainda diz "Voltar para Estrutura";
  - `e2e/privacidade.spec.ts:9` e `:49-51` ainda falam da "aba Por quanto tempo guardamos" e da "segunda aba".
- `apps/web/nome-dos-chunks.test.ts`, `e2e/pedidos.spec.ts` e `e2e/pedido-do-titular.spec.ts` estão em "Arquivos previstos" mas não foram alterados. Tirar da tabela, ou dizer por que não precisaram mudar.
- Em `areas.spec.ts`, `cliquesAte(tela)` lê a mesma tabela que o `irPelaCoordenacao` executa. A prova real é o clique seguido do endereço, então vale um comentário dizendo isso, para ninguém tomar o `expect(cliquesAte…)` como a prova do RF3.
- `passagens.test.tsx › Agentes volta para Registros` só olha o estado carregando. O `voltar` é a mesma constante nos três estados, então o teste basta, mas uma linha no estado com dado deixaria isso explícito.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/3_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/rotas.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/moldura.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/molduras.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/__fixtures__/coordenacao.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/areas.spec.ts

## revisor-geral · 2ª rodada · APROVADO · 2026-10-16 22:10:41 · `tasks/prd-telas-da-coordenacao/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo; 45 mutações provadas)
Bloqueantes: nenhum.

As correções da 1ª rodada foram todas feitas:
- **Página que rolava (item 1).** A conta passou a 17rem e o painel ganhou `md:relative`, em `apps/web/src/areas/coordenacao/moldura.tsx:36`. O `paginaNaoRola` agora roda no laço do W2, em `e2e/areas.spec.ts:355`, e a mutação "5rem" ficou vermelha. As fotos do computador a 1366 × 768 (estrutura cheia e vazia, governanca, privacidade-retencao) mostram a página parada e o miolo cortado em cerca de 720 px.
- **Textos "Estrutura" (item 2).** `Material.tsx:228` e `ListaDaTurma.tsx:58` e `:404` foram trocados, junto com a constante em `e2e/pedidos.spec.ts`. O destino "Escola › Turmas" está certo: as disciplinas ficam nessa aba, como mostra `coordenacao--coordenacao-estrutura--celular-1.png`.
- **Mutações que faltavam (item 3).** Ganharam bloco `rotas.tsx`, o `aoMudar` e o `useTituloDaTela` da moldura, os mapas de título, o `aoMudar` e o ramo final da `Privacidade`, e os ícones.
- **`<Suspense key={ativa}>` (item 4).** Tem agora um teste que prova a desmontagem e uma mutação que o deixa vermelho.
- **Itens 5 a 9.** A 3ª linha de "Divergências" saiu. O endereço dos pedidos tem uma fonte só (`ROTAS_DA_COORDENACAO.pedidos`), e `ABA_INICIAL_DA_PRIVACIDADE` foi removida. O comentário sobre `cliquesAte` entrou, os comentários antigos dos specs foram corrigidos e a tabela de arquivos foi ajustada.

Recomendações:
- **Tabela quebrada.** Em `tasks/prd-telas-da-coordenacao/3_task.md:40`, o parágrafo sobre `nome-dos-chunks.test.ts` entrou no meio de "Arquivos previstos". As cinco linhas de baixo deixam de ser tabela quando o Markdown é exibido. Mover o parágrafo para depois da tabela. `Inicio.tsx` também aparece em duas linhas.
- **`paginaNaoRola` pode medir cedo demais.** Em `e2e/__fixtures__/coordenacao.ts:95-100`, o `expect.poll(...).toBeLessThanOrEqual(0)` passa na primeira leitura. Se a tela ainda estiver em "Carregando…", ele mede uma página curta e passa sem provar nada. A mutação de 5rem ficou vermelha nesta execução, mas isso depende de o dado ter chegado a tempo. Esperar o conteúdo da tela antes de medir.
- **Comentário que não confere com o código.** O de `e2e/areas.spec.ts:211-213` diz que `paginaNaoRola` mede "na tela com o miolo mais longo, a Estrutura", mas o laço mede todas as telas, inclusive Agentes e Painel, que não têm moldura. Ajustar o texto.
- **Textos adiados para a 12.0 sem registro.** "Estrutura" em `DetalheDoPedido.tsx` e em `privacidade/textos-do-pedido.ts` foi adiado para a 12.0, mas `tasks/prd-telas-da-coordenacao/12_task.md` só cobre o "Ir para a Estrutura" de `Pedidos.tsx` (12.3). Até o Arquiteto acrescentar a troca, ela não está escrita em lugar nenhum. Registrar no `12_task.md` ou no `TODO.md`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-16 22:10:56 · `tasks/prd-telas-da-coordenacao/3_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada.
- Os quatro lugares, na ordem e com o ícone de cada um.
- As molduras: a aba do endereço é a selecionada, trocar de aba navega, há um `h1` só, o título da aba do navegador está certo, o foco volta ao título e só o miolo rola a partir de 768 px. Nesta rodada entra também a troca de aba desmontando a tela de antes.
- O seletor da Privacidade: marca a opção certa, navega, e uma tela que não existe abre os pedidos.
- As passagens e o W2, com cada tela a até dois cliques (Empresas e Incidentes a três).
- Recomeço e troca de escola.
- Casos movidos sem editar o corpo.
- Permissão e isolamento: sem consulta nova, valem os testes de hoje.
- Concorrência: não se aplica, porque não há operação nova.

Cobertos: as três correções exigidas foram feitas.
1. **Blocos que faltavam.** Conferi cada bloco novo contra o código atual: o texto bate e o teste citado existe e alcança a cláusula.
   - `rotas.tsx`: há bloco para as seis abas (turmas, professores, material, ia, pedidos, privacidade) e para a rota `/privacidade/pedidos`, que quando muda faz o endereço cair na `Privacidade`.
     - Turmas e IA ficam vermelhas pelo título "Escola: turmas" e "Registros: IA" (`e2e/areas.spec.ts:338`).
     - As outras quatro ficam vermelhas pelo `aria-selected` que `irPelaCoordenacao` confere (`e2e/__fixtures__/coordenacao.ts:81`).
   - `moldura.tsx`: há bloco para o `navegar` e para o `useTituloDaTela`.
   - `Escola.tsx` e `Registros.tsx`: o mapa de títulos tem bloco; o `it.each` confere o `document.title` de cada entrada.
   - `Registros.tsx`: o endereço da aba Pedidos tem bloco.
   - `Privacidade.tsx`: o redirecionamento tem dois blocos (remoção e troca de destino), o `aoMudar` tem um, e o ramo final `<Retencao />` e o ramo de Incidentes têm um cada.
   - `navegacao.ts`: os quatro ícones têm bloco, e o teste compara o mapa inteiro de `lugar`.
2. **`<Suspense key={ativa}>`.** O teste novo, `molduras.test.tsx:98-124`, prova um efeito que se vê: sem a `key`, o React só esconde a tela de antes, que continua no DOM e não roda a limpeza dela. Por isso o `desmontou` toma o lugar do fallback como prova. O bloco foi declarado.
3. **Altura do miolo.** `paginaNaoRola(page)` agora é chamada em todas as telas do laço (`e2e/areas.spec.ts:355`), no `chromebook` a 1366 × 768 (`playwright.config.ts:45`). Há também um bloco de mutação com 5rem que fica vermelho nesse e2e.
4. **Testes rodados.** `molduras.test.tsx` e `itens-da-lateral.test.tsx` passaram: 31 de 31. Não há `.skip`, mock de coisa nossa nem chamada de IA.
5. **Recomendações da rodada anterior.** Os comentários desatualizados foram corrigidos, "Arquivos previstos" foi ajustado e o comentário sobre `cliquesAte` entrou. A recusa sobre `passagens.test.tsx` está registrada com motivo.

Bloqueantes: nenhum.

Recomendações:
- O `md:relative`, novo nesta rodada em `apps/web/src/areas/coordenacao/moldura.tsx:35`, só tem bloco contra a string da classe (`molduras.test.tsx:92`). O efeito dele, o `sr-only` não aumentar a página, só o `paginaNaoRola` mostra. Vale declarar também o bloco que tira o `md:relative` contra `e2e/areas.spec.ts › a coordenação abre no Painel`. Se ele não ficar vermelho, o comentário da constante promete mais do que o teste prova.
- O redirecionamento de `/privacidade` sem aba (`apps/web/src/areas/coordenacao/rotas.tsx:89-91`) foi reescrito para `ROTAS_DA_COORDENACAO.pedidos`, com o mesmo valor de antes. Já é provado por `e2e/privacidade.spec.ts:100`, mas um bloco deixaria isso explícito, agora que a divergência que o justificava saiu da tabela.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/tasks/prd-telas-da-coordenacao/3_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/moldura.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/rotas.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/molduras.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/areas.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/__fixtures__/coordenacao.ts

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-16 22:12:22 · `tasks/prd-telas-da-coordenacao/3_task.md`

VEREDITO: APROVADO
Tela vista: sim (41 fotos lidas: as 20 da lista, cheia e vazia, mais 8 fotos de 6 endereços que fiz agora). Fiz também uma rodada de `e2e/areas.spec.ts` na web reconstruída, e os 30 testes passaram nos projetos `chromebook` e `celular`.
Estados: ok. Carregando e erro eu conferi só pelo código: a `Suspense` por aba em `moldura.tsx` mostra "Carregando…", e a troca de aba ganhou teste de desmonte. O vazio convida: "A IA ainda não gerou nada nesta escola", "Nenhum pedido registrado" e "Nenhuma empresa recebe dado desta escola", cada um com o próximo passo.
Acessibilidade: ok. O painel da aba continua com nome e `tabIndex=0`, e as abas e o seletor da Privacidade aparecem com foco e seleção claros nas fotos.
Chromebook fraco: ok. A 1366 × 768 a página não rola e só o miolo rola. Nas fotos, a página tem exatamente 768 px em Escola › Turmas, Professores, Material, Registros › IA, Pedidos, Prazos de guarda, Empresas e Incidentes, nas escolas cheia e vazia. O miolo de Turmas termina em 722 px, com 14 px de folga.
Celular: ok. Não há rolagem de lado nem texto cortado em 360 px, e os botões principais têm 44 px ou mais. A faixa da barra de baixo no meio das fotos compridas é efeito da captura de página inteira; na foto de uma tela só ela fica no pé.
Ação oficial protegida: sim. Esta tarefa não cria nem altera ação oficial.

**As duas correções da 1ª rodada foram feitas.**
1. **Altura.** `moldura.tsx` agora usa `md:relative md:max-h-[calc(100dvh-17rem)] md:overflow-y-auto`, e o comentário traz a conta medida (258 px). `paginaNaoRola` é chamado em `e2e/areas.spec.ts:355`, no laço das 11 telas. Em `molduras.test.tsx` há asserção do `md:relative` e do desmonte da tela anterior ao trocar de aba.
2. **Texto.** `Material.tsx:228`, `ListaDaTurma.tsx:58` e `ListaDaTurma.tsx:404` dizem "Escola › Turmas". `e2e/pedidos.spec.ts:57` acompanhou. Nenhum teste de unidade citava o texto do Material.

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. **`/coordenacao/agentes` rola a página inteira a 1366 × 768.** As fotos `coordenacao--coordenacao-agentes--computador-1` e `-2` são duas partes, de ~1600 px.
   - `Agentes.tsx:78,85,92` usa `Tela` própria, sem a moldura. A tarefa 11.0 recompõe essa tela, com um agente por vez, e o fecha.
   - O comentário de `e2e/areas.spec.ts:346-348` ("em nenhuma tela de Escola nem de Registros") passa a afirmar o que ainda não é verdade. Ajuste o texto ou registre que a 11.0 fecha o RF23 nos Agentes.
2. **`paginaNaoRola` pode passar sem provar nada.** A `expect.poll` de `e2e/__fixtures__/coordenacao.ts:98-99` aceita a primeira amostra com sobra ≤ 0, inclusive com "Carregando…" na tela. Foi o que deixou o laço passar nos Agentes, que rolam. Antes de medir, espere o conteúdo da tela (por exemplo o título da tela de dentro).
3. **Folga de 14 px.** `17rem` é constante, medida a 1366 × 768. Um título de moldura com descrição, ou o sino em duas linhas, reabre a rolagem da página. Vale uma cadeia flex com `min-h-0` quando a altura for revista (TODO.md já traz o item de borda no pé do miolo).
4. **"Estrutura" ainda aparece na tela** nas telas dos pedidos do titular. A foto `coordenacao--coordenacao-privacidade-pedidos--computador` mostra o botão "Ir para a Estrutura" e o texto "abra a turma em Estrutura". Os arquivos são `Pedidos.tsx:91`, `DetalheDoPedido.tsx:181,185`, `textos-dos-pedidos.ts:86,90,114` e `textos-do-pedido.ts:163,207`. A tarefa 12.0 já os leva, então vale conferir que o `12_task.md` ganhou a troca, porque um texto que manda para um lugar que não existe mais é bloqueante quando a 12.0 for revista.
5. **Já registrados em outros destinos:**
   - Em Escola a aba "Material" cai numa segunda linha a 360 px (TODO.md).
   - O nome da escola aparece cortado ("Colégio s…") no cabeçalho do celular (TODO.md, X-spec da casca).
   - Registros › IA: "Como cada IA trabalha" encosta no parágrafo de cima, e o título "O que a IA gerou e quem aprovou" encosta nos cartões (tarefa 10.0).
6. **A escola vazia da vitrine não é vazia de verdade.** As fotos `vazia--…-estrutura` e `vazia--…-painel` mostram os sete passos como "feito" e "A escola está montada". Não é defeito desta tarefa, mas o estado "escola nova no primeiro dia" de Escola › Turmas não aparece na vitrine; o e2e W4 de `areas.spec.ts` o cobre.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/moldura.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/__fixtures__/coordenacao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/e2e/areas.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/apps/web/src/areas/coordenacao/Agentes.tsx`
- Fotos do Agentes que fiz: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l2/.processo/vitrine/coordenacao--coordenacao-agentes--computador-1.png`
