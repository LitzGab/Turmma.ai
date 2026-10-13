# Achados das revisões — `tasks/prd-pele-e-casca/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 11:49:31 · `tasks/prd-pele-e-casca/3_task.md`

VEREDITO: APROVADO

Tela vista: sim (37 fotos lidas, cheia e vazia): estrutura da coordenação 4 cheia + 3 vazia, turmas da professora 2 + 2, atividades do aluno 2 + 2, galeria clara 5 + 6 e galeria escura 5 + 6. Rodei também os 80 testes de unidade da tarefa (`botao-secundario.test.ts`, `Botao.test.tsx`, `estilos.test.ts`, `tools/ci/tamanho-web.test.ts`), todos verdes. Não rodei o e2e: as fotos são do último e2e, e o código da árvore confere com elas.

Estados: ok. A tarefa não muda carregamento, erro nem vazio. Nas fotos da escola vazia, o aluno vê "Nada para fazer agora" com o próximo passo dito. A estrutura da coordenação e as turmas da professora na "vazia" trazem dado porque o harness semeia uma turma; isso não vem da tarefa.

Acessibilidade:
- O anel de foco é único: contorno sólido de 3 px na cor `foco`, afastado 2 px (`estilos.css`), com a exceção documentada sobre `bg-noite` no escuro.
- `focoVisivel` em `e2e/__fixtures__/verificacoes.ts` ficou mais estrito: exige contorno sólido de 3 px na cor do token e não aceita mais sombra.
- O contraste de face e texto é resolvido por tema e testado em ligado, hover, apertado e desligado.
- A regra global de `prefers-reduced-motion` entrou e tem teste.
- O texto fica em caixa-alta só pelo CSS, então o leitor de tela lê normal.
- O piso de 14 px está respeitado (o compacto usa 14 px).

Chromebook fraco: ok. Só o `transform` anima, em 100 ms e sem curva. A sombra do degrau e a cor do hover trocam na hora, sem repintar a página por quadro. O CSS cresceu 424 bytes em brotli, a entrada encolheu 159 bytes, e o teto de `pecas-*` subiu para 40 kB nos três lugares (`.size-limit.json`, nome do grupo e `tools/ci/tamanho-web.test.ts`).

Celular: ok em 360 px. Nas fotos da estrutura, das turmas, das atividades e da galeria não há rolagem horizontal nem botão que embaralhe a ação.
- A face tem 44 px no `principal` e no `icone`, e o `compacto` tem 36 só a partir de 768 px.
- O apertado funciona sem hover, e nada depende de ponteiro.
- A margem do degrau (4 px) não quebrou as barras presas nem os rodapés vistos.
- "Ver a confirmação em andamento" quebra em duas linhas a 360 px, sem corte.

Ação oficial protegida: sim.
- O oficial é o único em grafite, com degrau `grafite`; é distinto de todo outro botão nos dois temas, e o teste prova isso.
- O primário é o único laranja, e o perigo cheio só existe com `cheio`, dentro da confirmação.
- Os e2e de `pedidos`, `professor-turma` e `professor-assistente` continuam provando a regra com o `rgb()` do grafite, e a confirmação continua mostrando o valor, a turma e o efeito antes de decidir.

Bloqueantes: nenhum.

Recomendações:
1. Placeholder cortado a 360 px na `CaixaPedido` (`apps/web/src/componentes/ia/CaixaPedido.tsx:112-125`): "Peça uma atividade, um plano de aula…" aparece cortado por trás do botão "Só conversar" (fotos `coordenacao--galeria--celular-4.png` e `escuro--coordenacao--galeria--celular-4.png`).
   - O defeito já existia antes da 3.0 (`professora--galeria--celular-3.png`) e a peça não foi tocada.
   - Está registrado no `2_task.md` para a 10.0, subtarefa 10.1. Quem revisar a 10.0 deve tratá-lo como bloqueante.
2. O "Sair" do cabeçalho de celular ainda é pílula (`rounded-full`), ao lado de botões de canto 12. É botão escrito à mão fora das constantes, e a tarefa manda não convertê-los aqui. Fica para a spec da área ou para a 15.0.
3. A galeria mostra os rótulos das variantes sem acento ("PRIMARIO", "SECUNDARIO") em `apps/web/src/galeria/secoes/botoes.tsx`, porque usa o id como texto. A galeria não vai ao build de produção, então é só cuidado de texto: use um rótulo com acento por variante.
4. O foco sobre um botão com degrau: o anel (afastado 2 px) passa por cima da faixa de 4 px do degrau. Nenhuma foto cobre o botão focado. O `e2e/tokens.spec.ts` mede cor e largura, mas não confere se o anel sobre o degrau fica legível; vale uma foto com foco antes do pouso.

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-13 11:49:34 · `tasks/prd-pele-e-casca/3_task.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff mexe só no CSS, nas classes do botão, na galeria, nos testes e na documentação; não toca API, job, seed, importação nem webhook. Todos com autor humano? Sim, nada mudou.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. Os botões que aprovam continuam no desenho oficial, e os e2e que provam isso foram trocados para a cor grafite sem afrouxar a asserção (`e2e/pedidos.spec.ts`, `e2e/professor-turma.spec.ts:106` e `:278`, `e2e/professor-assistente.spec.ts:743`). Nas fotos, "Aprovar 32 correções" aparece desligado com "3 de 5 destaques abertos": o desligado é outro desenho, sem degrau (`coordenacao--galeria--computador-4.png`, nos dois temas). Recusar tem o mesmo tamanho que aprovar.
Supervisão do tutor: ok, nada mudou. Nas fotos, toda saída de IA continua marcada como IA: "Seu professor acompanha como você usa o Tutor", os selos de IA e "Aprovado por… · data" (`coordenacao--galeria--computador-2.png` e `-3.png`). Nenhuma nota, conceito nem sugestão de nota aparece em tela.
Autonomia declarada e visível: sim, nada mudou.

Bloqueantes:

1. **Falta a guarda "grafite só onde é oficial", que a tarefa marca como feita.**
   - **Onde:** `apps/web/src/estilos.test.ts`.
   - **O que deveria existir:** a linha "grafite só onde é oficial" da tabela de testes (`tasks/prd-pele-e-casca/3_task.md:80`, combinada com o test-engineer) e a Tech Spec (`tasks/prd-pele-e-casca/techspec.md:206`) pedem uma guarda que reprove `bg-grafite` e `bg-noite` (com `-alto` e `-baixo`) usados como face fora de uma lista fechada. A lista teria as constantes do oficial e os quatro usos de antes: `Atividade.tsx`, `Home.tsx`, `NavegacaoDaLista.tsx` e a dica de `itens-da-lateral.tsx`. Cada uso leva a justificativa e a tarefa que o tira (RF6).
   - **O que existe:** a subtarefa 3.6 está marcada `[x]`, mas `estilos.test.ts` não tem nenhum caso desses. Nenhum arquivo de teste cita os quatro arquivos, e a seção "Divergências resolvidas" não registra a retirada.
   - **Por que é da regra 70:** o desenho próprio do oficial é o que impede que aprovar vire clique automático, sem olhar ("aprovar não vira clique reflexo", no contexto da própria tarefa).
   - **O caso que a guarda deveria segurar já existe:** no tema escuro, `--color-grafite` e `--color-noite` valem os dois `#f1f7fb` (`apps/web/src/estilos.css:200` e `:203`). Na tela de atividade do aluno, o botão da questão aberta (`apps/web/src/areas/aluno/Atividade.tsx:150`, `bg-noite`) fica com a mesma face do botão oficial "Enviar a atividade", na mesma tela (`Atividade.tsx:228`).
   - **Até onde vão os testes atuais:** `botao-secundario.test.ts` só prova a regra dentro de `classesDoBotao`. Um `<button className="bg-grafite …">` escrito à mão em qualquer tela passaria.
   - **Correção exigida:**
     - implementar a guarda em `estilos.test.ts`, como a Tech Spec descreve, com a lista fechada e a justificativa e a tarefa de saída de cada entrada;
     - aceitar o `enabled:hover:bg-noite-alto` só nas constantes do oficial;
     - incluir um fixture em que um arquivo novo com `bg-grafite` reprova;
     - declarar a mutação: tirar uma entrada da lista, ou aceitar um arquivo qualquer, tem de deixar o teste vermelho.

Recomendações:
- O hover do oficial usa `bg-noite-alto` (`apps/web/src/componentes/botao-secundario.ts:45` e `:80`), um token da família `noite`, a mesma do preto antigo e dos quatro usos legados. Quando a `noite` sair (15.0 e 8.0), vale trocar por um token `grafite-*` próprio, para o oficial não depender da família que a guarda quer encolher.
- `e2e/pecas-botoes.spec.ts:120` e `:193` afirmam o degrau do oficial como `rgb(13, 13, 13)` (o `grafite-degrau` do claro). Está correto, mas um comentário dizendo que esse `rgb` é o `grafite-degrau`, e não a `noite`, evita que alguém leia isso como resto do preto antigo.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/3_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.css
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/botao-secundario.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/areas/aluno/Atividade.tsx

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-13 11:49:36 · `tasks/prd-pele-e-casca/3_task.md`

VEREDITO: REPROVADO
Escopo: incompleto
Aderência à Tech Spec: há duas divergências: o teste de `techspec.md` §10 que restringe o grafite e o `noite` ao oficial não foi feito, e o `cenarios.md` U3 ficou sem a mudança da guarda `FACE_FORTE`
Portão local: carimbo válido

Bloqueantes:

1. **`apps/web/src/estilos.test.ts`: falta o teste "grafite só onde é oficial", e a subtarefa 3.6 está marcada como feita.**
   - A linha 3 da tabela "Testes que provam a regra" pede uma guarda: `bg-grafite` e `bg-noite` (com `-alto` e `-baixo`) só podem aparecer como face numa lista fechada, e um arquivo novo com a classe reprova (RF6). A `techspec.md` §10 promete a mesma guarda.
   - Ela não existe em nenhum lugar da árvore. Procurei por `NavegacaoDaLista`, `itens-da-lateral` e "lista fechada" nos testes e não achei nada.
   - O que existe é o teste `botao-secundario.test.ts:140`, que só compara as variantes do botão entre si. Ele não impede uma tela nova de pintar uma face grafite ou `noite`, que é o que protege o oficial contra o clique reflexo (regra 70; regra 50, item 8).
   - A omissão não está em "Divergências resolvidas". E há uma decisão escondida aí: hoje a face `noite` aparece em sete arquivos, e não nos quatro que a tarefa cita. Os três a mais são `areas/navegacao.ts:111`, `componentes/ia/AvatarAgente.tsx:10` e `operacao/componentes/CascaDaOperacao.tsx:50`.
   - **Correção exigida:** criar a guarda em `estilos.test.ts`, com a lista fechada dos usos reais. Cada uso leva a justificativa e a tarefa ou spec que o tira. Um fixture prova que um arquivo novo reprova, e a mutação vai declarada em "Mutações". Se a lista diferente da que o documento descreve for decisão, ela entra também na `techspec.md` §10 e no `cenarios.md`.

2. **`tasks/prd-pele-e-casca/cenarios.md:199` (U3): a divergência sobre `FACE_FORTE` está só na tarefa e na `techspec.md`.**
   - A terceira linha da tabela de divergências da `3_task.md` diz que está em "`cenarios.md` U3 e U4". Ela fala de `vermelho` na `FACE_FORTE` e da nova regra da face que troca sob uma variante.
   - Mas a U3 continua listando as faces fortes como "`noite`, `erro`, `caramelo` e as duas variantes dele", sem `laranja`, `grafite` e `vermelho`, e sem a regra da variante. A U4 não foi tocada.
   - **Correção exigida:** reescrever a U3 (e a U4, se for o caso) com as faces novas, a regra da variante e os limites aceitos: a lista quebrada em várias linhas e o template ternário. Assim a divergência fica igual nos dois documentos.

Recomendações:
- Em `apps/web/src/componentes/botao-secundario.ts`, `COR_DO_PERIGO_CHEIO` (linha 20) e `COR_DO_PERIGO_CHEIO_DO_BOTAO` (linha 90) têm nomes quase iguais e diferem só pelo desligado. Um nome que diga a diferença lê melhor.
- O comentário do topo do mesmo arquivo diz que as constantes e a tabela "saem das mesmas peças". Na forma isso não é verdade: as constantes usam `FORMA_COM_TEXTO`, e a tabela usa `FORMA_DO_BOTAO` com `TAMANHO_DO_BOTAO`, com `gap-2`. A igualdade só vale para a cor, e o comentário pode dizer isso.
- Na foto `.processo/vitrine/coordenacao--galeria--computador-1.png`, o `discreto` desligado ganha uma face cinza e fica 2 px mais baixo que os vizinhos. Ele não tem `degrau` e por isso não tem a margem. A causa é a fileira com `items-center`, em `galeria/secoes/botoes.tsx:35`. O desenho é do `frontend-reviewer`; aponto só porque a foto mostra.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/botao-secundario.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/botoes.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/3_task.md

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 11:49:40 · `tasks/prd-pele-e-casca/3_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os 16 da tabela "Testes que provam a regra" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/3_task.md`. Entre eles: só o oficial é grafite, contraste com as classes de verdade, grafite só onde é oficial, teto das peças, anel sobre a face `noite`, `FACE_FORTE`, só o primário é laranja, perigo cheio só com `cheio`, constante igual à tabela, desligado é outro desenho, alvo de 44 px, apertado sem hover, aprovação continua oficial, no máximo um laranja, anel nos dois temas, movimento reduzido e o `rgb()` de cada spec. Isolamento, permissão e concorrência não se aplicam: a tarefa não toca dado de escola nem operação que corra duas vezes.

**Cobertos:**
- **Unidade:** contraste por tema lendo o CSS de verdade, com o caso de controle do `sutil`. Também o oficial único na face e no degrau nos dois temas, só o primário laranja, perigo cheio só com `cheio`, constantes iguais à tabela, `FACE_FORTE` com fixtures, a face que troca sob variante e o teto de 40 kB, que testa 41 kB e também 39,6 kB, perto do limite.
- **Componente:** o `@ts-expect-error` do `cheio`, que o typecheck prova, e o clique desligado sem efeito.
- **E2e:** galeria com 35 botões medidos; degrau com sombra e margem; apertado no toque por `forcePseudoState`, divergência declarada e aceitável; movimento reduzido; anel de 3 px nos dois temas em 20 botões; anel com 3:1 contra as três faces `noite`, nos dois temas; o CSS servido só anima `transform` e `opacity`. O `focoVisivel` ficou mais estrito: deixou de aceitar sombra. `pedidos`, `professor-turma`, `professor-assistente`, `acesso-da-turma`, `pecas-sobrepor` e `pecas-ia` têm a cor nova e a mesma regra.
- **Execução:** rodei os três arquivos de unidade e passaram 61 de 61. Não há `.skip`, `.only` nem `any` no diff.

**Bloqueantes:**
1. **Falta o cenário "grafite só onde é oficial" (RF6).** Está na tabela da tarefa e na `techspec.md` §Testes ("Reprova também `bg-grafite` e `bg-noite` (com `-alto` e `-baixo`) como face fora de uma lista fechada…"). Não existe teste em lugar nenhum, e `apps/web/src/estilos.test.ts` só ganhou `grafite` dentro de `FACE_FORTE`, que é outra regra. A seção de divergências também não fala disso. Hoje um arquivo novo com `bg-grafite` num botão comum passa verde, e é justamente o clique reflexo que a regra 50, item 8, quer impedir.
   - **Correção:** criar a guarda no `describe` "guarda de cor" (`apps/web/src/estilos.test.ts:306`). A lista fechada tem as constantes do oficial e os usos atuais: `areas/aluno/Atividade.tsx`, `areas/professor/Home.tsx`, `operacao/componentes/NavegacaoDaLista.tsx` e a dica de `componentes/itens-da-lateral.tsx`. Cada item leva justificativa e a tarefa ou spec que o tira.
   - **Usos que a lista não cita:** o grep acha também `CascaDaOperacao.tsx`, `ia/AvatarAgente.tsx` e `areas/navegacao.ts`. É preciso decidir cada um.
   - **Testes da guarda:** um fixture de arquivo novo com a classe reprova, e um bloco de mutação tira um item da lista.
2. **Cláusulas novas sem bloco em "Mutações".** Cada uma é bloqueante por si:
   - `apps/web/src/componentes/botao-secundario.ts:18`: `COR_DO_PERIGO` (texto, borda e degrau da família vermelha) não tem bloco. O teste "o perigo só é cheio quando pedido" afirma essas classes, mas nenhuma mutação o prova.
   - `botao-secundario.ts:79`: a linha do próprio `primario` não tem bloco (`text-sobre-cor`, `degrau-laranja`, `enabled:hover:bg-caramelo-claro`). A única mutação de laranja põe `bg-laranja` no secundário; nenhuma tira do primário a face, o texto ou o degrau.
   - `botao-secundario.ts:74`: `[--altura-degrau:3px]` do ícone, a regra da 9.3, não tem bloco.
   - `botao-secundario.ts:29`: `CLASSES_DO_LINK_SECUNDARIO`, que é cláusula nova, não tem bloco.
   - `botao-secundario.ts:45`: o `enabled:hover:bg-noite-alto` próprio da constante do oficial não tem bloco. Só a constante do secundário foi mutada.
   - `apps/web/src/estilos.css:397-401`: a tipografia `t-*` (linhas 360-424) não tem nenhum bloco. No mínimo precisa de um para o `text-transform: uppercase` do `.t-rotulo`, que é o "rótulo em caixa-alta" do RF5, e de um para o tamanho de uma classe, contra o `it.each` da 9.2.
   - `estilos.css:490`: `animation-duration: 0.01ms !important` tem asserção, mas não tem bloco.
   - `estilos.css:493`: `scroll-behavior: auto !important` não tem asserção nem bloco. Ou entra no teste "movimento reduzido…" com bloco, ou sai do CSS.
   - `estilos.css:317`: o seletor `.bg-noite .bg-fundo :focus-visible` não tem bloco. Só a metade `.bg-superficie` foi mutada.

**Recomendações:**
- `e2e/pecas-botoes.spec.ts`, teste do anel em todo botão: o `variante` coletado nunca é afirmado. Se a ordem do Tab mudar, o teste confere o anel de outra peça e continua verde. Vale afirmar a sequência de `data-variante` e `data-tamanho`.
- `e2e/pecas-botoes.spec.ts`, teste "alvo de 44 px": o perigo cheio e o "perigo cheio desligado" não têm `data-variante` e ficam fora da medida de 44 px. Só o canto deles é conferido.
- `e2e/tokens.spec.ts`, o `expect((await corDe(entrar)).fundo).toBe(RGB.carameloClaro)` logo depois do `poll`: não prova a "troca seca", porque repete o que o `poll` já garantiu. Quem prova é a asserção de `transitionProperty`. A linha pode sair, ou o comentário pode ser corrigido.
- `e2e/tokens.spec.ts`, faces `noite`: falta, no escuro, o anel do grupo da `Aparencia` com chão próprio dentro da faixa da operação. A unidade só confere a declaração, sem o contraste no navegador.
- `apps/web/src/estilos.test.ts`, teste "desligado perde a sombra": a busca usa o seletor com `\n  ` literal, e a formatação do CSS pode quebrar essa busca. Vale normalizar o espaço em branco em `declaracoesDe`.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-13 12:13:27 · `tasks/prd-pele-e-casca/3_task.md`

VEREDITO: APROVADO

Tela vista: sim (22 fotos lidas: galeria clara e escura em computador e celular; Estrutura, Turmas e Atividades em cheia e vazia). Rodei também `estilos.test.ts`, `botao-secundario.test.ts` e `Botao.test.tsx`: 63 testes passam.

Estados: ok. A tarefa mexe na peça Botão, que não tem carregando nem erro próprios. Nas fotos, o vazio da Estrutura, das Turmas e das Atividades convida, não se desculpa. Exemplo: "Nada para fazer agora. Quando quem dá a aula passar uma atividade para a turma, ela aparece aqui."

Acessibilidade:
- Os rótulos da galeria agora saem com acento ("Primário", "Secundário").
- Os botões só de ícone têm `aria-label` em português.
- O e2e do anel de foco confere a ordem do Tab e as 21 peças ligadas, nos dois temas.
- O grupo "Aparência" na faixa da operação ganhou o caso do anel sobre o chão próprio, 3:1 nos dois temas.
- `scroll-behavior: auto` entrou no movimento reduzido, com teste e mutação.

Chromebook fraco: sem peso novo na execução. O teto de `pecas-*` em 40 kB está declarado e testado, e a galeria não entra no build de produção.

Celular: sem rolagem horizontal nem corte a 360 px, na galeria e nas telas fotografadas. O botão de ícone é um círculo de 44 px, as faces são de 44 px e os botões quebram em fileiras sem esconder a ação. Nada depende de hover: o apertado se mostra no toque, pelo degrau.

Ação oficial protegida: sim. Não há ação oficial nova nesta tarefa. A face grafite do oficial ficou presa por uma lista fechada de 8 entradas que só encolhe, com teste e mutações.

Correções da rodada anterior: a 1ª rodada foi APROVADO sem correção exigida. O diff desde então foi conferido e não traz regressão.
- O `ROTULO` e o `items-start` na galeria corrigem os 2 px do `discreto` sem mudar o contrato do botão.
- `data-variante="perigo-cheio"` põe o sexto desenho na medida de 44 px: 37 peças medidas e 21 no anel.
- A guarda `FACE_DO_OFICIAL` reprova arquivo novo, classe fora da entrada e entrada que já não vale.
- O comentário e o renome em `botao-secundario.ts` são só documentação.
- A foto bate com o código da árvore.

Bloqueantes: nenhum.

Recomendações:
1. O botão "Sair" do cabeçalho no celular é um contorno de pílula, sem o degrau do botão secundário (visto em `coordenacao--coordenacao-estrutura--celular-1.png`). Ele é da casca (tarefa 12.0/X2), não desta tarefa, mas vale alinhar ao desenho de 10.2 quando a casca for revista.
2. No escuro, a `noite` e o `grafite` valem os dois `#f1f7fb`. A questão aberta do mapa de `Atividade.tsx` fica com a mesma face do botão oficial da tela. A tarefa já registrou isso e entrega a correção à X4 (a guarda nomeia o arquivo).
3. A entrada `componentes/botao-secundario.ts` da guarda guarda o hover `noite-alto` do oficial. A saída na 15.0 está escrita ("passa a token próprio de grafite"); conferir lá.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/botao-secundario.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/botoes.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-botoes.spec.ts`

## conformidade-reviewer · 2ª rodada · APROVADO · 2026-10-13 12:13:41 · `tasks/prd-pele-e-casca/3_task.md`

**VEREDITO: APROVADO**

A correção exigida na 1ª rodada foi feita. A guarda "grafite só onde é oficial" agora existe e passa: rodei os 63 testes de `estilos.test.ts`, `botao-secundario.test.ts` e `Botao.test.tsx` e todos ficaram verdes.

Os quatro itens da correção:
- **A lista fechada existe.** `FACE_DO_OFICIAL` está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.test.ts`. Cada entrada traz as classes que o arquivo pode usar, a justificativa e a tarefa que a tira. Só o arquivo do oficial diz "não sai", e a lista tem teto de 8 entradas, que só pode encolher.
  - Conferi a lista contra a árvore. As 13 ocorrências de `bg-grafite` e `bg-noite` (com `-alto`/`-baixo`) em `apps/web/src` estão em oito arquivos, e são os mesmos oito da lista.
  - Os três usos a mais que a varredura achou (`areas/navegacao.ts`, `ia/AvatarAgente.tsx`, `CascaDaOperacao.tsx`) estão declarados em "Divergências resolvidas", na `techspec.md` §10 e no `cenarios.md` U3/U4.
- **O hover `enabled:hover:bg-noite-alto` foi aceito só no arquivo do oficial.** A exceção é `CascaDaOperacao.tsx:109`, que já usava esse hover antes da tarefa (conferi no HEAD). Ele fica com entrada própria e sai na 15.0.
- **Há um fixture de arquivo novo.** `paginas/Nova.tsx` com `bg-grafite`, `bg-noite`, o hover e o apertado reprova as quatro classes. Um arquivo da lista reprova a classe que a entrada dele não cita.
- **As mutações estão declaradas:** renomear a entrada `Home.tsx`, tirar o hover da entrada do oficial, `.filter(() => false)`, tirar `noite` do regex e afrouxar o teto. Pela lógica do teste, cada uma deixa algum caso vermelho.

Fotos lidas:
- `coordenacao--galeria--computador-1.png` e `escuro--coordenacao--galeria--computador-1.png`: só o oficial tem a face grafite, nos dois temas. No escuro ela fica clara e continua diferente de todas as outras variantes.
- `escuro--coordenacao--galeria--computador-4.png`: a aprovação em lote continua desligada com "3 de 5 destaques abertos". Rejeitar tem o mesmo tamanho que aprovar. Aparecem "Aprovado por Camila Souza · 19/09, 10h42" e "rejeitou" com o motivo, e as saídas de IA levam o selo IA.
- `aluno--aluno-atividades--computador.png`: nenhuma nota nem conceito em tela; o aluno lê "A correção foi aprovada".

```
VEREDITO: APROVADO
Caminhos de escrita em Nota: nenhum nesta tarefa (CSS, classes do botão, galeria, testes, documentação) — todos com autor humano? sim
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok
Supervisão do tutor: ok
Autonomia declarada e visível: sim (inalterada)
Bloqueantes: nenhum
Recomendações:
- Na tela de atividade do aluno, no tema escuro, a questão aberta do mapa (apps/web/src/areas/aluno/Atividade.tsx:150, bg-noite) continua com a mesma face (#f1f7fb) do botão oficial "Enviar a atividade" da mesma tela. Está aceito com saída na X4 e declarado nas divergências; quem revisar a X4 deve tratar como bloqueante se o uso não tiver saído.
- O regex FACE_DO_OFICIAL_NA_CLASSE não pega o important com prefixo (`!bg-grafite`), porque `!` não está no conjunto de caracteres que podem vir antes da classe. Vale incluir o `!` e um fixture com ele.
- A entrada de CascaDaOperacao.tsx aceita `enabled:hover:bg-noite-alto` fora do oficial. É uso anterior à tarefa, com saída na 15.0, mas a 15.0 precisa tirá-lo junto com a faixa preta, para o hover `noite-alto` voltar a ser só do oficial (até virar token `grafite-*` próprio, como já está registrado).
```

## test-engineer · 2ª rodada · APROVADO · 2026-10-13 12:13:52 · `tasks/prd-pele-e-casca/3_task.md`

VEREDITO: APROVADO

Cenários exigidos: os 16 da tabela "Testes que provam a regra" de `tasks/prd-pele-e-casca/3_task.md`. Nesta rodada conferi as duas correções exigidas na 1ª e o que elas afetam. Isolamento, permissão e concorrência não se aplicam: a tarefa não toca dado de escola nem operação que corra duas vezes.

Cobertos:
- **Correção 1, "grafite só onde é oficial" (RF6): feita.**
  - A guarda fica em `apps/web/src/estilos.test.ts`, linhas 273-333 (a lista), 551 (a varredura) e 568 (o fixture).
  - A lista é fechada e tem oito entradas. Os três usos que a lista da Tech Spec não citava (`navegacao.ts`, `AvatarAgente.tsx`, `CascaDaOperacao.tsx`) foram decididos um a um. Cada entrada traz as classes que o arquivo pode escrever, a justificativa e a tarefa ou a spec que a tira.
  - O teste reprova três casos:
    - arquivo fora da lista;
    - classe que a entrada não cita;
    - entrada cuja classe o arquivo já não escreve.
  - Só o oficial diz "não sai", e o teto de 8 não sobe.
  - No fixture, um arquivo novo com `bg-grafite`, `bg-noite`, o hover e o apertado reprova. O `Atividade.tsx` não pode escrever `bg-grafite`, e o arquivo do oficial não pode escrever `bg-noite`.
  - Há cinco blocos de mutação: renomear uma entrada, tirar o hover do oficial, filtro que nunca reprova, regex sem `noite` e teto mais alto. Cada um derruba um destes dois testes.
  - A `techspec.md` §10, o `cenarios.md` U3 e U4 e a seção de divergências da tarefa dizem o mesmo.
- **Correção 2, cláusulas sem bloco: todas têm bloco agora.** Conferi cada bloco contra a asserção que ele derruba:
  - `COR_DO_PERIGO`: três blocos (degrau, texto e borda), contra `botao-secundario.test.ts:199-201`.
  - Linha do `primario`: quatro blocos (face, texto, degrau e hover), contra `:171-181`.
  - `[--altura-degrau:3px]`: contra `:247`.
  - `CLASSES_DO_LINK_SECUNDARIO`: contra `:301`.
  - Hover próprio das constantes do oficial e do perigo: contra a igualdade da `:292-293`.
  - `.t-rotulo` em caixa-alta, tamanho do `.t-corpo` e `tabular-nums` do `.t-numero-g`: contra o `it.each` de `estilos.test.ts:687-696`, que confere `text-transform` e `font-variant-numeric`.
  - `animation-duration`: contra `:773`.
  - `scroll-behavior`: tem asserção nova (`:776`) e bloco.
  - Seletor `.bg-noite .bg-fundo`: contra `:761-762`.
- **Portão da tarefa:** o carimbo de `.processo/portao.json` é das 15:01Z, depois das correções, e registra 57 mutações provadas.
- **Execução:** rodei `estilos.test.ts` e `botao-secundario.test.ts`, e passaram 50 de 50. Não há `.skip`, `.only` nem mock no diff.
- **Recomendações da 1ª rodada que entraram:**
  - O e2e do anel agora confere a ordem do Tab (`PECAS_NA_ORDEM_DO_TAB`).
  - O perigo cheio entrou na medida de 44 px (37 peças medidas, 21 no anel).
  - Saiu a linha redundante depois do `poll` em `tokens.spec.ts`.
  - O grupo da `Aparencia` entrou como 4ª face do teste de contraste.
  - `declaracoesDe` deixou de depender do espaço em branco do CSS.

Bloqueantes: nenhum.

Recomendações:
- **A lista conta arquivos, não classes.** Uma entrada antiga pode ganhar `bg-grafite`, desde que o arquivo passe a escrever a classe também. Um `expect` de que só a entrada de `componentes/botao-secundario.ts` cita `bg-grafite` fecha isso.
- **Dois jeitos de escapar da regex** de `estilos.test.ts:324`:
  - o modificador de importância antes da classe (`!bg-grafite`), porque `!` não está no conjunto de caracteres que podem vir antes;
  - a face por estilo em linha (`style={{ background: 'var(--color-grafite)' }}`).
  Vale um caso de fixture para cada um, ou deixar escrito que a guarda não os vê, como já está feito para a lista quebrada em linhas.
- **A 4ª face do `e2e/tokens.spec.ts` é uma réplica montada em DOM**, e não a `Aparencia` de verdade na faixa da operação. Se a classe do chão do componente mudar, o teste continua verde. Vale medir o anel no componente real, em `e2e/operacao.spec.ts`, quando a 15.0 mexer na faixa.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/botao-secundario.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/botao-secundario.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.css
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/tokens.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-botoes.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/3_task.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-13 12:13:52 · `tasks/prd-pele-e-casca/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

As duas correções da 1ª rodada foram feitas.

1. **A guarda "grafite só onde é oficial" existe.** Está em `apps/web/src/estilos.test.ts:254-333` e `:551-597`.
   - A lista fechada tem oito entradas: o oficial e os sete usos de antes. Conferi com `grep` e ela bate com os usos reais de `bg-grafite`, `bg-noite`, `bg-noite-alto` e `bg-noite-baixo` na árvore.
   - Cada entrada traz as classes permitidas, a justificativa e a tarefa ou spec que a tira. Só o oficial diz "não sai", e a lista não pode crescer.
   - A guarda também reprova a entrada que ficou velha: arquivo que saiu, ou classe que o arquivo já não escreve.
   - Há fixtures para três casos: arquivo novo, classe que a entrada não cita, e o `bg-grafite` escrito num arquivo que só podia ter a `noite`. As mutações estão declaradas.
   - A lista com mais itens que o documento previa está registrada em "Divergências", na `techspec.md` §10 (linha 206) e no `cenarios.md` U3 e U4.
2. **A U3 e a U4 do `cenarios.md` foram reescritas** (linhas 199-200). Agora trazem:
   - as faces `laranja`, `grafite` e `vermelho`;
   - a regra da face que troca sob uma variante;
   - os dois limites aceitos (a lista de classes quebrada em várias linhas e o template ternário);
   - a lista fechada do oficial.

   A divergência agora diz o mesmo na tarefa, na Tech Spec e nos cenários.

O resto do diff da rodada não muda nenhuma regra, e as fotos da galeria nos dois temas mostram os seis desenhos como a 10.2 pede:
- `botao-secundario.ts`: só troca de nome de constante e comentário.
- Galeria: rótulos com acento, fileiras alinhadas pelo alto e `data-variante` no perigo cheio.
- `pecas-botoes.spec.ts`: as contagens sobem para 37 e 21, e o teste confere a ordem do Tab peça a peça.
- `tokens.spec.ts`: entra a quarta face (o grupo da `Aparencia`, com chão próprio). Também saiu uma asserção que repetia o `poll` logo acima.

Recomendações:
- `apps/web/src/estilos.test.ts:592-594`: o comentário diz que "outra família" passa em qualquer arquivo, mas a asserção espera que `bg-noite-ia` reprove. O padrão `bg-(?:grafite|noite)(?:-[a-z]+)?` pega qualquer sufixo, inclusive token que não existe. Ajuste o comentário ou restrinja o padrão a `-alto` e `-baixo`, como a tarefa descreve.
- No escuro, a questão aberta do mapa da atividade (`areas/aluno/Atividade.tsx:150`) tem a mesma face do "Enviar a atividade" oficial, na mesma tela. Isso já acontecia antes da 3.0 e agora está registrado. Hoje o aviso só existe na entrada da guarda e no comentário do teste. Vale uma linha em `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md` (6.1, o mapa de questões), dizendo que a face nova não pode ser a do oficial em nenhum tema. Assim a X4 não herda o problema calada.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/3_task.md
