# Achados das revisões — `tasks/prd-telas-do-professor/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 02:48:50 · `tasks/prd-telas-do-professor/3_task.md`

VEREDITO: APROVADO

Sobre a correção do coordenador: o arquivo é `apps/web/src/areas/professor/icones-de-ferramenta.tsx`, e foi esse que li. O resto do prompt vale como estava.

Tela vista: sim (4 fotos lidas, `/professor/nova-conversa` a 1366 e a 360 px, escola cheia e vazia). A tela sem turma confirmada não aparece nas fotos. A vitrine entrega a professora com turma nas duas escolas, então vi essa tela só pelo código e pelo teste. As páginas não rolam a 1366 × 768.

Estados: ok. O código tem os quatro, em `Home.tsx:70-78` e `Home.test.tsx:104-166`.
- **Carregando:** `EstadoCarregando` com o rótulo "Carregando as suas turmas…".
- **Erro:** `EstadoErro` com "Tentar de novo".
- **Vazio:** convida em vez de pedir desculpa. "Falta uma turma confirmada" explica o que falta, e "Ir para Turmas" leva ao lugar de resolver.
- **Com dado:** a saudação, a caixa, os atalhos e o aviso de IA.

Acessibilidade: ok.
- O `h1` é só para o leitor de tela.
- A caixa tem rótulo ("Pedido ao Assistente de ensino").
- Os atalhos ficam num grupo com `aria-label`.
- Os ícones são `aria-hidden`.
- O link usa `text-caramelo-texto`, sem cor escrita à mão.
- Os botões desligados mudam de desenho, sem depender só da cor.

Chromebook fraco: ok. Os ícones são três SVGs chapados, sem animação, sombra ou imagem. A Home não lê mais a lista de entregas, o que tira uma requisição.

Celular: ok.
- A 360 px não há rolagem horizontal e os atalhos quebram em coluna centrada.
- O botão secundário tem `min-h-11` (44 px), e o e2e `a medida` confere altura de 44 ou mais.
- O link "Abrir a conversa" tem 44 px no celular e 36 px no computador.
- Nada depende de hover ou de atalho de teclado.

Ação oficial protegida: sim. Nada oficial acontece na tela.
- O atalho só abre o cartão na conversa, que passa por aprovação depois.
- O pedido escrito vai ao Assistente, que pergunta antes (D18).
- A Adaptação não lê o texto da caixa (D35), e o teste prova isso.
- A frase "Nada chega à turma sem você aprovar" está à vista.

Pelo que vi, não há conflito com `docs/interface.md` (a seção 11.5 foi atualizada junto), com a pele nem com as regras 70 (item 4a) e 59. A onça vem com o nome "Assistente de ensino" e o selo "IA". O texto está todo em português, sem termo técnico nem id.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/areas/professor/Home.tsx:56-110`: a regra 50, item 6 (o feed de agentes nunca aparece vazio para quem tem turmas), é cumprida pelo sino, não pelo Início. O sino mostra "Esperando você 1" na foto cheia e nada na vazia. A tarefa e o PRD (RF7, RF8) decidiram isso. Na validação, vale conferir se a professora percebe o sino sem o feed na primeira tela.
2. Nas fotos, o nome da escola e o "Sair" da barra do celular ficam apertados, com "Colég…" cortado. A casca não é desta tarefa, mas vale registrar para o `/retro`.
3. O botão de enviar (cinza, em estado vazio) tem pouco contraste com o fundo. Isso já vem da `CaixaPedido` e não foi alterado nesta tarefa.
4. `Home.tsx:97-105`: o `role="status"` fica vazio quando não há resposta em curso. É inofensivo e o conteúdo muda quando há resposta, mas vale conferir com leitor de tela.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-19 02:49:10 · `tasks/prd-telas-do-professor/3_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A tarefa só mexe no Início do professor (`Home.tsx`, `CaixaDoAssistente.tsx`, `AtalhosDeFerramenta.tsx`, ícones) e em testes. Nenhum caminho novo grava em `Nota`, e o Início deixou de ler entregas. Todos com autor humano? sim, porque não há nenhum caminho novo.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok.
- O atalho só abre o cartão da ferramenta na conversa (`CaixaDoAssistente.tsx:64-68`). Nada sai para a turma sem passar pelo fluxo de aprovação que já existe.
- A pendência saiu do Início, mas continua visível no sino. O e2e confere isso em `e2e/professor-inicio.spec.ts`, no caso "com entrega pendente, o sino a conta…", e em `e2e/professor-entregas.spec.ts`.
- A exceção da D47 (resposta do tutor sem aprovação) não aparece em nenhum outro agente.

Supervisão do tutor: ok, a tarefa não toca o tutor.

Autonomia declarada e visível: sim, sem mudança nesta tarefa. Nenhum agente teve o nível alterado.

Bloqueantes: nenhum.

O que conferi na regra 70 e nas fotos (computador e celular, escola cheia e vazia):
- **O agente se identifica, item 4a.** Em todas as fotos a onça vem com "Assistente de ensino" e o selo "IA" no mesmo bloco `data-assinatura`. Isso sai de `apps/web/src/areas/professor/Home.tsx:470`, pela `AssinaturaIA`. O teste de componente "o Assistente de ensino aparece…" prova o bloco, e a mutação que troca o agente para `tutor` o derruba.
- **Nenhuma nota nem conceito (D55).** Os atalhos são só Plano de aula, Adaptação e Atividade objetiva. Não há ferramenta de discursiva nem de redação, e nada na tela sugere nota.
- **A Adaptação não recebe texto livre (D35, D67).** O atalho passa o texto da caixa, mas `iniciaisDoPedido` (`apps/web/src/areas/professor/ferramentas.ts:222`) devolve `{}` para `adaptacao`. O teste usa justamente "prova adaptada para um aluno com laudo" e exige `iniciais: {}` (`Home.test.tsx:251-258`). O e2e de ferramentas confere o mesmo pelo atalho.
- **O chat pergunta antes de abrir a ferramenta (D18).** O pedido escrito e enviado vai ao Assistente e não abre cartão (`Home.test.tsx:264`). O atalho é a escolha explícita da professora, e o e2e confere que nenhum pedido sai para `/mensagens`.
- **A função suspensa (D60).** Com a conversa suspensa, a caixa e os três atalhos ficam desligados. Com só a Adaptação suspensa, o aviso explica por que o botão está desligado. Os dois casos têm teste e mutação.
- **Nada induz uso (D59).** Os atalhos são botões secundários do mesmo peso, sem nada que se mexa sozinho, sem contador e sem chamariz. O aviso "O Assistente é uma IA e pode errar · Nada chega à turma sem você aprovar" está nas quatro fotos (`Home.tsx:523-525`) e não tem link.
- **Medir o professor (itens 8 e 9).** Nada novo mede ou expõe a professora.

Recomendações:
- A frase "Nada chega à turma sem você aprovar" é uma promessa da regra 70, item 3, e hoje só é verdade porque nenhuma ferramenta entrega direto à turma. Vale citar a regra 70, item 3, no comentário do JSX, para que uma ferramenta futura que entregue sem aprovação seja vista como quebra dessa frase.
- `AtalhosDeFerramenta.tsx:13` diz que o atalho é desligado também pela "caixa inteira parada". Está correto, mas uma linha lembrando que o atalho da Adaptação também segue a suspensão de `conversa_e_ferramentas` deixaria claro por que a ferramenta da Adaptação depende das duas funções.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Home.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/CaixaDoAssistente.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/AtalhosDeFerramenta.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Home.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/e2e/professor-inicio.spec.ts

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 02:49:53 · `tasks/prd-telas-do-professor/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- os quatro estados: carregando, erro com "Tentar de novo", sem turma confirmada e com dado
- a saudação às 8h, 14h e 20h, com relógio falso
- o Assistente se identifica: função e selo "IA" no bloco da onça, com a saudação fora dele
- atividade e plano abrem o cartão com a turma e o texto da caixa como tema; com a caixa vazia, sem tema
- a Adaptação abre sem o texto da caixa (D35)
- o pedido escrito e enviado vai ao Assistente e não abre cartão (D18)
- com entrega pendente, o Início não mostra nada e não lê `/v1/entregas`, e o sino tem a entrega
- função suspensa, nos dois casos: a conversa inteira, ou só a Adaptação
- a caixa da conversa mantém o menu sem `semMenu`
- recomeço: a segunda pessoa na mesma aba encontra a caixa vazia
- 360 px e 1366 × 768: os atalhos quebram de linha sem rolar de lado, a caixa aparece sem rolar, e o espaço de baixo é o dobro do de cima
- borda do domínio: turma sem professor alocado (vínculos pendente e contestado não contam)
- borda do domínio: duas turmas, uma por disciplina, com a escolhida indo ao cartão
- isolamento entre pessoas na mesma aba: nenhum dado da primeira professora sobra no cache nem na tela

**Cobertos:** todos os cenários acima.
- No componente, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Home.test.tsx`: estados, saudação, assinatura, atalhos, D35, D18, suspensão e `semMenu`.
- No e2e: `e2e/professor-inicio.spec.ts` (fluxo, entrega no sino, atalho até o cartão e medida), `e2e/professor-ferramentas.spec.ts:131-140` (D35 pelo navegador, sem pedido gasto) e o caso de recomeço de `e2e/professor-sino.spec.ts:253-280`.
- Todas as cláusulas novas do diff têm bloco de mutação, e cada teste citado chega à cláusula pelo motivo certo:
  - `semMenu` nos dois lados da caixa
  - os dois termos de `desligada || funcaoSuspensa`
  - o texto da caixa como tema
  - o `disabled`, o `onClick` e o destino do link dos atalhos
  - a assinatura do Assistente
  - os dois avisos de suspensão
  - o aviso de IA
  - o fim da leitura de entregas
  - as três classes da grade, uma delas no projeto `celular`
- Não há `.skip`, teste comentado nem mock de coisa nossa. A rede é falsa, mas o cliente de consultas, a memória da aba e o roteador são os de verdade. A tarefa não chama IA, e não há operação concorrente nova: o atalho só grava na memória da aba e navega.
- Rodei os três arquivos de unidade da tarefa (`Home.test.tsx`, `icones-de-ferramenta.test.tsx` e `estilos.test.ts`): 61 testes, todos verdes.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `Home.test.tsx:123-125`: o caso de erro diz "a mensagem do catálogo", mas só confere que o alerta tem algum texto e não mostra o código. O e2e do HEAD conferia o texto exato do catálogo. Se a Home passasse o erro de outra consulta ao `EstadoErro`, o teste continuaria verde. Basta trocar por `expect(alerta.textContent).toBe(MENSAGENS_DE_ERRO.NAO_ENCONTRADO)`.
2. Falta o caso com as duas funções suspensas ao mesmo tempo, conversa e Adaptação: dois avisos e os três atalhos desligados. Pela lógica atual dá certo, mas não há teste que fixe isso.
3. O caso de recomeço em `professor-sino.spec.ts` não tem cláusula própria nesta tarefa. O texto da caixa vive no estado do componente, que se perde quando a Home sai da tela com a saída da professora. O caso fica como guarda de regressão, para o dia em que o rascunho for parar na memória da aba. Vale dizer isso no comentário do caso, para ninguém o tomar pela prova de uma limpeza.
4. O ícone ilustrado dentro de cada atalho é coberto por asserção (`data-icone-de-ferramenta`, em `Home.test.tsx:216`), mas não tem bloco de mutação. É elemento visual, não regra, por isso fica como recomendação.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 02:49:57 · `tasks/prd-telas-do-professor/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum

O que conferi:
- **Escopo.** As subtarefas 3.1 a 3.4 estão feitas, e nada da 4.0 entrou: o menu "Ferramenta" continua na caixa da conversa e o Início usa `semMenu`.
- **Divergências.** As três que mexem na spec (onça de 40 px, aviso da Adaptação suspensa, `data-esperando-voce`) estão registradas na `techspec.md` §9. As outras três tratam de onde fica cada teste e não mudam a arquitetura. Esta spec não tem `cenarios.md`.
- **Fotos.** As quatro mostram o que o RF7 pede: a onça com "Assistente de ensino" e o selo "IA" (regra 70, item 4a), a saudação, "O que vamos preparar hoje?", a caixa com a turma, os três atalhos e "Ferramentas", e o aviso de IA sem link. No celular os atalhos quebram em linhas sem rolar de lado. Não há "Esperando você" no `main`, nem pílula da aula, nem "+".
- **Regra 60.** O vocabulário segue o glossário.

Recomendações:
- **Código morto.** `apps/web/src/areas/professor/fila-do-professor.ts:199`: `esperandoVoce` (e o tipo `ItemEsperando`, se ninguém mais o usa) ficou sem quem chame em produção. O único consumidor era a `Home.tsx` que esta tarefa reescreveu, e só `fila-do-professor.test.ts` ainda a usa. Remover junto com o teste, ou dar um destino na seção "Recomendações sem aplicar".
- **Duas frases que se contradizem na Tech Spec.** `tasks/prd-telas-do-professor/techspec.md:177`, em "Nomes que não mudam", ainda diz que `data-esperando-voce` "passa ao item do sino". O parágrafo novo das linhas 167-169 diz o contrário. Ajustar a linha 177 para não deixar as duas frases brigando.
- **Mockup desatualizado no texto.** `tasks/prd-telas-do-professor/mockup.md:39` descreve o Início "no produto" como estava antes desta tarefa. É histórico, mas quem ler sem contexto vai achar que a Home ainda mostra a fila. Opcional marcar como superado pela 3.0.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Home.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/CaixaDoAssistente.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/AtalhosDeFerramenta.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/icones-de-ferramenta.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/techspec.md

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 03:12:53 · `tasks/prd-telas-do-professor/3_task.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas, Início da professora no computador e no celular, escola cheia e vazia)
Estados: ok. Conferi pelo código em `Home.tsx:73-81`. Carregando mostra "Carregando as suas turmas…". Erro mostra `EstadoErro` com botão de tentar de novo. Vazio, sem turma confirmada, mostra "Falta uma turma confirmada", diz o próximo passo e tem o botão "Ir para Turmas". Com dado mostra a caixa do Assistente e os atalhos. Nas duas fotos, a escola vazia ainda mostra a caixa e os atalhos, porque a professora sintética tem turma.
Acessibilidade: ok.
- O grupo de atalhos tem `role="group"` e rótulo. O link "Abrir a conversa" tem `min-h-11`. O aviso de resposta tem `role="status"`. A marca "IA" aparece ao lado do Assistente.
- Os dois avisos de suspensão, o da conversa e o da Adaptação, aparecem juntos, com os três atalhos desligados. O caso novo de `Home.test.tsx:307` prova isso.
Chromebook fraco: ok. A tela não tem lista longa, não tem imagem e não tem efeito pesado. O diff desta rodada só acrescenta comentário e teste.
Celular: ok a 360 px.
- Não há rolagem horizontal. Os atalhos quebram em linhas, centrados.
- Os botões têm cerca de 44 px de altura.
- Nada depende de hover.
- Nenhuma tela do diff exige o celular.
Ação oficial protegida: sim. Esta tela só abre a conversa ou um cartão de ferramenta e não aprova nem publica nada. O texto "Nada chega à turma sem você aprovar" está à vista e ganhou um comentário que registra a regra 70, item 3.
Bloqueantes: nenhum. Conferi as correções desta rodada.
- O comentário JSX em `Home.tsx:94` não muda o que é renderizado.
- O texto de `AtalhosDeFerramenta.tsx` bate com a suspensão dupla.
- O erro agora é conferido contra `MENSAGENS_DE_ERRO.NAO_ENCONTRADO`, e não mais com `toBeTruthy`.
- A linha da Tech Spec foi corrigida.

Recomendações:
- A foto mostra "Boa noite" e "2°B c5064cf7 · Química". O sufixo hexadecimal é dado sintético da vitrine. Confirme que a turma real nunca mostra id.
- No celular, o título da escola fica cortado ("Colég…") por causa do sino e do botão "Sair". Não é bloqueante, porque o nome completo aparece no menu. Se der, ajuste o topo para mostrar mais do nome.
- Na foto de 1366 px, o texto de rodapé "O Assistente é uma IA e pode errar" tem 13 px. Considere 14 px.

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-19 03:13:11 · `tasks/prd-telas-do-professor/3_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta rodada. O diff mexe em comentários, em um teste de unidade, num comentário de e2e e numa linha da Tech Spec. Todos com autor humano? Sim, porque não há caminho novo.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. A frase "Nada chega à turma sem você aprovar" agora tem, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Home.tsx:94`, o comentário que a liga à regra 70, item 3, e que diz que ela só vale enquanto nenhuma ferramenta entregar direto à turma. Era a minha recomendação da 1ª rodada, e foi aplicada.
Supervisão do tutor: ok. Esta tela não mexe no tutor.
Autonomia declarada e visível: sim. O comentário da prop `desligado` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/AtalhosDeFerramenta.tsx:16` agora registra que o atalho da Adaptação segue duas suspensões: a da própria função e a de `conversa_e_ferramentas` (D60). Também era recomendação minha, e também foi aplicada. O caso novo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Home.test.tsx:307` testa essa combinação: confere o texto dos dois avisos, a caixa de pedido desligada e os três atalhos desligados.

Fotos (`professora--professor-nova-conversa--computador.png`, `--celular.png` e as duas `vazia--`, na escola cheia e na vazia):
- O Assistente aparece como IA, com o selo "IA" e nome de função.
- A linha "O Assistente é uma IA e pode errar · Nada chega à turma sem você aprovar" aparece no computador e no celular.
- Não há nota, conceito nem sugestão de nota em lugar nenhum.
- Os atalhos são Plano de aula, Adaptação e Atividade objetiva. Nenhum é de discursiva ou redação.
- Não há sequência de dias, recompensa nem nada que induza uso.
- "Sair" está visível na barra lateral e no topo do celular.
- O sino "Esperando você" mostra só a contagem de pendências do próprio professor. Não é indicador sobre ele.

Bloqueantes: nenhum

Recomendações: nenhuma nova. As da 1ª rodada foram aplicadas. A tabela "Recomendações sem aplicar" do documento fica para o `/validar` e o `/retro`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 03:13:21 · `tasks/prd-telas-do-professor/3_task.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada, só o diff desde a árvore 767944024c e o que ele afeta): conferir se as recomendações 1 a 3 aplicadas provam o que dizem e se as mudanças de comentário e de Tech Spec deixaram algum comportamento sem teste.

Cobertos:
- **Recomendação 1, texto do catálogo no caso de erro** (`Home.test.tsx:124`): o teste agora exige `MENSAGENS_DE_ERRO.NAO_ENCONTRADO` e mantém a checagem de que o código cru não aparece (linha 125). Se a tela mostrasse um texto qualquer ou o código do erro, o teste ficaria vermelho, o que o `toBeTruthy()` de antes não garantia.
- **Recomendação 2, as duas funções suspensas** (`Home.test.tsx:307-317`): o caso confere o texto exato dos dois avisos, que a caixa fica desligada e que os três atalhos ficam desligados. Junto com o caso de só a Adaptação suspensa (319-336), ele separa as duas suspensões: se o atalho da Adaptação seguisse só uma delas, um dos dois casos ficaria vermelho.
- **Recomendação 3, comentário do caso de recomeço do sino** (`e2e/professor-sino.spec.ts`): mudou só o comentário. Ele agora diz que o caso é guarda de regressão e não prova de limpeza, o que bate com o que o caso faz.
- **`Home.tsx` e `AtalhosDeFerramenta.tsx`**: mudaram só comentários, nada novo é desenhado na tela. Nenhuma cláusula nova pede bloco de mutação.
- **`techspec.md:177`**: agora diz que `data-esperando-voce` sai do Início e não passa ao sino. É só texto e está de acordo com as divergências da 3.0.
- **Recomendação 4 recusada** (ícone sem bloco de mutação): o motivo está em `3_task.md:239`. É elemento visual e não regra, então aceito.
- `npx vitest run apps/web/src/areas/professor/Home.test.tsx` passou: 19 de 19.
- Nenhum `.skip`, nenhum teste comentado e nenhum mock novo que esconda a regra.

Bloqueantes: nenhum

Recomendações: nenhuma nova.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/apps/web/src/areas/professor/Home.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l1/tasks/prd-telas-do-professor/3_task.md
