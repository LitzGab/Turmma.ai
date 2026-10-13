# Achados das revisões — `tasks/prd-pele-e-casca/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-13 12:47:05 · `tasks/prd-pele-e-casca/4_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum

O que conferi:
- **Subtarefas:** as seis estão feitas.
- **Props:** `Campo`, `CampoLongo` e `Selecao` ficaram com as mesmas props.
- **Fora do escopo, intocados:** `copia-unica.tsx`, `LoginPorCima.tsx`, `MotorFormulario` e `Segmentado`. Nenhuma tela usa as peças novas: só a galeria as importa.
- **Divergências que mudam a spec:** três estão escritas na `techspec.md` §9 "Desvios do mockup". São o erro sem `role="alert"`, o anel colado à borda e o hover sem `borda-forte`. A tabela 10.2 do `docs/interface.md` foi corrigida.
- **Afastamento 0 em `/entrar`:** ficou para a 14.0 e está no `cenarios.md` A5. A `14_task.md` (14.2) já prevê passar `Entrar.tsx` ao `Campo`.
- **Testes:** nenhum `.skip`, `any`, `.only` nem `TODO` nos testes novos nem no helper.

Recomendações:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Interruptor.tsx:31` desenha o estado fora de uso com `disabled:opacity-50`. Isso cria um segundo jeito de mostrar peça desligada, porque todas as outras peças da tarefa usam token: `fundo-suave` e texto `apoio` no campo, `borda`, `fundo-suave` e `apoio` na `Opcao`. Com 50% de opacidade, a borda `borda-campo` também cai abaixo de 3:1. A troca é pôr os tokens no trilho fora de uso, como nas outras peças.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/4_task.md:102` diz que a prop nova `rotulo` da `Opcao` está "na Subtarefa 4.4 deste documento", mas a lista de props da 4.4 não foi atualizada. Vale acrescentar `rotulo` à lista. A Tech Spec não lista props, então isso não é divergência dela.
3. Na galeria (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/campos.tsx`, função `Interruptores`), o texto ao lado do interruptor é um `<span>` solto. O nome acessível vem do `aria-label`, e clicar no texto não troca o interruptor. Quando as telas da X2 a X4 usarem a peça, vale ligar o texto ao interruptor, com `aria-labelledby` ou um rótulo que se possa clicar.
4. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Busca.tsx:9`: a 4.2 pede `rotulo` como prop e ela saiu opcional, com "Buscar" de padrão. Uma busca sem rótulo próprio diz menos ao leitor de tela do que a tela pede. Vale tornar `rotulo` obrigatório.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 12:47:28 · `tasks/prd-pele-e-casca/4_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** rótulo, dica e erro ligados ao campo (ordem do `aria-describedby`, `aria-invalid`, `aria-required`, erro com ícone) no `Campo`, no `CampoLongo` e na `Selecao`. O `Interruptor` troca com clique, Espaço e Enter, e desligado não troca. A `Opcao` em grupo troca com as setas, tem uma parada de Tab e chama `aoMudar` uma vez. O nome acessível da `Busca` é o rótulo. Borda de 3:1 e anel de 3 px colado, nos dois temas (e2e). Alvo de toque de 44 px no celular. axe nos dois temas. Nenhum teste de regra enfraquecido (`entrar`, `mfa`, `turma-publica`, `estrutura`, "Mostrar a senha", `nome-dos-chunks`). Estados vazio, preenchido, com erro e desligado de cada peça. Concorrência, isolamento e IA não se aplicam: é peça de tela sem servidor, e a tarefa declara isso com motivo.

**Cobertos:**
- Rodei os 5 arquivos de unidade e componente: 68 testes verdes.
- Conferi as 44 mutações contra o `git diff`. Cada cláusula nova da caixa do campo (`seletor.ts`), da `Busca`, do `Interruptor` e de `PECAS_FORA_DA_ENTRADA` tem bloco, e cada bloco chega à asserção certa. Exemplos:
  - `text-campo` derruba o 4,5:1;
  - `outline-offset-2` derruba a asserção do afastamento 0;
  - tirar `name` faz o Tab entrar no primeiro rádio, e não no marcado;
  - tirar `aria-disabled` falha na última linha, depois das outras asserções passarem.
- O e2e `e2e/pecas-campos.spec.ts` mede nos dois temas o que o `jsdom` não calcula:
  - a borda calculada contra os tokens resolvidos;
  - o anel com `afastamento: '0px'` e a borda mantida;
  - o ícone antes do texto do erro;
  - o fundo e o texto do desligado;
  - o trilho de 52×32 px com a bolinha trocando de lado;
  - a opção desligada fora do percurso das setas, com a volta ao começo do grupo;
  - o axe nas quatro seções.
- Os specs de `entrar`, `mfa`, `turma-publica` e `estrutura` não foram editados.
- Não há `.skip`, teste comentado nem mock de coisa nossa. O helper `__fixtures__/cor-das-classes.ts` lê o `estilos.css` real.

**Bloqueantes:**
1. `apps/web/src/componentes/Opcao.tsx:36`: a aparência da opção desligada (`'cursor-not-allowed border-borda bg-fundo-suave text-apoio'`) é cláusula nova sem bloco de mutação e sem asserção.
   - Trocar `text-apoio` por `text-inativo`, que é exatamente a regressão de contraste que esta tarefa corrigiu no `Campo` (`seletor.ts`, com bloco), não deixa nenhum teste vermelho.
   - O teste de componente `Opcao.test.tsx:137-149` só confere o `disabled` e o `aria-disabled`.
   - O e2e não mede a opção "Por apresentação oral" nem a "A nota".
   - O axe também não pega, porque ignora contraste de controle desligado.
   - **Correção exigida:** no `Opcao.test.tsx`, provar com `tokenOuFalha(rotulo, 'text')` e `tokenOuFalha(rotulo, 'bg')` que a desligada é `apoio` sobre `fundo-suave`, com 4,5:1 nos dois temas, e que não leva `degrau-azul` nem `degrau-borda`. Depois, declarar no `4_task.md` ao menos um bloco que troque `text-apoio` por `text-inativo` nessa linha e exija esse teste vermelho.

**Recomendações:**
- `apps/web/src/componentes/Opcao.tsx:54`: marcada e desligada ao mesmo tempo ("A nota", na galeria), o círculo continua `bg-azul`, que é cor de ação. Isso contradiz o comentário da própria peça (linha 29: "Desligada perde o degrau e a cor de ação"). Vale decidir qual dos dois está certo e cobrir no teste do bloqueante 1.
- `e2e/pecas-campos.spec.ts:174`: o título diz "e a borda dele continua a de campo", mas o teste não confere a borda do desligado. Ou acrescente `borda: \`2px solid ${bordaDeCampo}\`` ao `toMatchObject`, ou tire a frase do título.
- `apps/web/src/componentes/Busca.tsx:32-33`: o `inputMode="search"` e o `autoComplete="off"` (regra 50, item 2a) não têm asserção. Uma linha no `Busca.test.tsx` basta.
- `apps/web/src/componentes/Interruptor.tsx:31,37`: o `disabled:opacity-50` e a bolinha em `bg-fundo` não têm asserção. São visuais e não bloqueiam.
- `e2e/pecas-campos.spec.ts:251`: o teste usa `hasTouch` no lugar do ponto de quebra de 768 px. Vale enquanto o projeto `celular` tiver largura abaixo de 768; se um dia isso mudar, o teste passa a medir a coisa errada sem avisar.
- `apps/web/src/componentes/Opcao.tsx:43`: o anel por `focus-within` aparece também no clique do mouse, e não só no foco pelo teclado. É aceitável, mas vale registrar como decisão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 12:52:56 · `tasks/prd-pele-e-casca/4_task.md`

VEREDITO: APROVADO

Tela vista: sim (37 fotos lidas, cheia e vazia): galeria nos temas claro e escuro, em 1366 e 360 px; `/coordenacao/estrutura` cheia e vazia; `/entrar`. Fotografei também o diálogo "Nova disciplina" da Estrutura, em 1366 e 360 px, que usa o `Campo` e não estava nas fotos.

Estados: ok. A galeria mostra cada peça vazia, preenchida, com erro e desligada, com nomes inventados. Carregando e erro não se aplicam: `Busca`, `Interruptor` e `Opcao` não têm servidor, e o erro do campo é texto com ícone, ligado por `aria-describedby`.

Acessibilidade: ok.
- A borda de 2 px em `borda-campo` passa de 3:1 nos dois temas, também no trilho desligado e no círculo da opção.
- O anel de 3 px fica colado à borda. A opção usa `focus-within`, sem `:has()`.
- Rádios de mesmo `nome` são uma parada de Tab, e as setas pulam a opção desligada.
- O erro tem ícone `aria-hidden`, e `aria-describedby`, `aria-invalid` e `aria-required` seguem na ordem de antes.
- O axe passou na seção, nos dois temas e nos dois projetos.

Chromebook fraco: ok. O primeiro carregamento sobe 789 bytes em brotli e fica em 128,3 kB, abaixo do teto de 150 kB. As três peças novas ficam fora da entrada, pelo `nome-dos-chunks.ts`, e nada usa `:has()`, `color-mix` ou estilo em linha.

Celular: ok.
- Sem rolagem horizontal em nenhuma foto de 360 px.
- Campo com 48 px, busca com 44, interruptor com 44 de área de toque (trilho de 52 × 32), opção com 64.
- Nada depende de hover (o hover só reforça o fundo da opção); o toque funciona em todas as peças.
- Rodei `pecas-campos.spec.ts` nos projetos `chromebook` e `celular`: 36 de 36 passaram.
- Rodei também `entrar`, `mfa`, `turma-publica`, `estrutura` e `tokens`: 102 de 102 passaram, sem edição nos specs. Os testes de componente (68) também passaram.

Ação oficial protegida: não se aplica. A tarefa só trata de campos e de peças de entrada, sem aprovar, publicar nem excluir.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/componentes/ia/CaixaPedido.tsx:112-125` — na foto `coordenacao--galeria--celular-5.png`, o texto de exemplo "Peça uma atividade, um plano de aula…" quebra em duas linhas e a segunda fica cortada atrás do botão "Só conversar". A peça não foi tocada aqui e já era assim; está registrada em `2_task.md` e `3_task.md` para a tarefa 10.0. Quem revisar a 10.0 trata como bloqueante, como o revisor anterior disse.
2. `apps/web/src/galeria/secoes/campos.tsx:~124-140` — o texto ao lado do interruptor é um `<span>` solto, e tocar nele não troca nada. O nome acessível existe pelo `aria-label`, mas, ao usar a peça nas telas (X2 a X4), é melhor envolver peça e texto num `<label>`, para o alvo de toque ser a linha inteira.
3. `apps/web/src/componentes/Opcao.tsx:~46` — o anel por `focus-within` aparece também ao clicar com o mouse, porque o `:focus-visible` do input escondido não passa para o rótulo. Não prejudica ninguém. Se incomodar, vale ver depois uma forma de mostrá-lo só pelo teclado, sem `:has()`.
4. Tema escuro — `campo` e `fundo-suave` são o mesmo `#202f36` em `estilos.css`. O campo desligado se distingue do habilitado só pelo tom do texto (`apoio`) e pelo `cursor`. Está conforme a D80, que manda `fundo-suave`, e controle desligado não precisa de contraste. Fica registrado para o `/validar`, caso se queira uma pista a mais, como borda tracejada.
5. A bolinha do interruptor desligado (`fundo` sobre `borda`) tem pouco contraste própria no claro. O estado é dito pela posição e pela borda de 3:1 do trilho, conforme o `docs/interface.md` 10.2 e a regra de que não dependa só de cor. Não bloqueia.
6. `/entrar` ainda mostra os campos com borda fina de 1 px, por serem `<input>` escritos à mão em `paginas/Entrar.tsx`. A 4.0 não os toca de propósito; é da 14.0, já anotada no `cenarios.md` A5. A foto confirma que o campo da 4.0 e o da entrada divergem até lá.

Arquivos conferidos (todos sob `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/`): `apps/web/src/componentes/{Campo,CampoLongo,Selecao,seletor,Busca,Interruptor,Opcao}.ts[x]`, `apps/web/src/galeria/secoes/campos.tsx`, `apps/web/nome-dos-chunks.ts`, `e2e/pecas-campos.spec.ts`, `docs/interface.md`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-13 13:04:03 · `tasks/prd-pele-e-casca/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** nesta rodada, só o diff desde a 1ª rodada.
- **Bloqueante da 1ª rodada:** a opção desligada é `apoio` sobre `fundo-suave` e tem 4,5:1 nos dois temas. Não leva `degrau-azul` nem `degrau-borda`. O `4_task.md` precisava de um bloco que trocasse `text-apoio` por `text-inativo`.
- **Recomendações aplicadas (itens 2 a 6 da ordem):**
  - o interruptor fora de uso usa tokens, e não opacidade;
  - na opção marcada e desligada, o círculo fica sem cor de ação;
  - o `rotulo` da `Busca` passou a ser obrigatório;
  - o `inputmode` e o `autocomplete` da `Busca` têm asserção;
  - o e2e do campo desligado agora confere a borda.

**Cobertos:**
- **Bloqueante corrigido.** O teste novo está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Opcao.test.tsx:163-174`.
  - Ele lê text, bg e border do rótulo com `tokenOuFalha`: `['apoio','fundo-suave','borda']`.
  - Ele afirma que o rótulo não leva `degrau-azul` nem `degrau-borda` e que leva `cursor-not-allowed`, e confere o 4,5:1 nos dois temas.
  - O bloco `text-apoio` → `text-inativo` está no `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/4_task.md`. A mutação fica vermelha pelo motivo certo: `inativo` é token declarado em `estilos.css:51` e `:190`, então `tokenOuFalha` devolve `'inativo'` e a igualdade quebra. Não há exceção, e é a cláusula que cai.
  - Os blocos de `bg-borda` e de `degrau-borda` também chegam à asserção certa.
- **Marcada e desligada.** O teste em `Opcao.test.tsx:176-184` exige o visto e o círculo `campo`/`apoio`/`borda-campo`. Os dois blocos fazem o círculo voltar a `bg-azul`, e o teste fica vermelho. A sombra do degrau some pela regra `.degrau[aria-disabled='true']`, e o `aria-disabled` já tinha asserção em `Opcao.test.tsx:148`.
- **Interruptor fora de uso.** O teste em `Interruptor.test.tsx:98-112` cobre os dois estados (ligado e desligado) e confere:
  - os tokens do trilho e da bolinha;
  - a posição da bolinha;
  - que nenhuma classe `opacity` aparece na peça, no trilho nem na bolinha.

  Os quatro blocos chegam à asserção: trocar o fundo do trilho, recolocar `disabled:opacity-50`, mudar a cor da bolinha e fixar `justify-start` (que só falha com o interruptor ligado, e o laço testa os dois).
- **Busca.** O nome acessível é provado com dois rótulos distintos. O `inputmode="search"` e o `autocomplete="off"` têm asserção e um bloco cada. Os dois usos na galeria passam `rotulo`.
- **E2e do campo desligado.** O `e2e/pecas-campos.spec.ts:184` agora confere `borda: 2px solid <borda-campo>`, e o título está honesto.
- **Os trechos que as mutações trocam existem uma vez só cada.** Conferi o texto exato de cada bloco contra `Opcao.tsx`, `Interruptor.tsx` e `Busca.tsx`.
- **Execução.** `npx vitest run` nos três testes de componente: 25 passaram.
- **Sem `.skip`**, sem teste comentado e sem mock da coisa testada. Não há IA nem operação concorrente nesta tarefa.

**Bloqueantes:** nenhum.

**Recomendações:**
- No `Opcao.test.tsx:171-173` e `:181-183`, o laço de contraste usa os nomes `'apoio'`, `'fundo-suave'` e `'campo'` escritos à mão, em vez do token lido do elemento. Hoje é redundante com a igualdade logo acima, e não é falha. Ler o token do elemento, como já faz o teste da marcada na linha 200, deixa o par medido preso ao que a peça desenha.
- O e2e da galeria não mede o estilo calculado da opção desligada ("Por apresentação oral", "A nota") nem do interruptor fora de uso. O teste de componente resolve a cor da classe, mas não a cascata, como diz o próprio `cor-das-classes.ts:12-13`. Uma linha no e2e, com `fundo-suave`, `apoio` e sombra `none`, fecharia esse buraco. Fica para o `/validar`.

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-13 13:04:18 · `tasks/prd-pele-e-casca/4_task.md`

**VEREDITO: REPROVADO**

**Escopo:** respeitado. As correções da rodada 1 ficaram nos três componentes, nos testes, no e2e, em `docs/interface.md` e no `4_task.md`. Os itens 1 a 7 da ordem `.processo/ordens/4_task-r1.md` estão cumpridos.

**Aderência à Tech Spec:** há uma divergência, no `Interruptor` fora de uso.

**Portão local:** carimbo válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo).

**Bloqueantes:**

1. `apps/web/src/componentes/Interruptor.tsx:26-27` e `:39`. O interruptor fora de uso trocou a opacidade de 50% por tokens (trilho `fundo-suave` com borda `borda`, bolinha `borda-campo`). É um desvio do mockup, que diz "Desligado: opacidade de 50%" em `tasks/prd-pele-e-casca/mockup.md:754`, e ele não foi registrado onde a spec registra desvio de propósito:
   - `techspec.md` §9, "Desvios do mockup, de propósito" (`tasks/prd-pele-e-casca/techspec.md:130-136`), não cita o caso.
   - A tabela "Divergências resolvidas nesta tarefa" do `4_task.md` (linhas 97-104) não tem a linha. As outras quatro decisões contra o mockup desta mesma tarefa têm.
   - Em `docs/interface.md:1396`, o texto novo "Fora de uso: … sem opacidade" está sem o marcador "(produto)". A linha 1341 diz que esse marcador é o que indica desvio da 9.1, e a mesma linha 1396 o usa nas duas outras divergências do interruptor.

   A troca veio de recomendação de revisor e o caminho é melhor. Mesmo assim, desvio decidido fora da Tech Spec é bloqueante. **Correção exigida:**
   - acrescentar o desvio à lista de §9 da `techspec.md`, com o motivo: um só jeito de mostrar peça desligada, e a opacidade derrubava a borda sem dizer o estado;
   - acrescentar a linha à tabela de divergências do `4_task.md`, apontando para §9 e para a 10.2;
   - marcar "(produto)" no trecho "Fora de uso" de `docs/interface.md:1396`.

**Recomendações:**

- `apps/web/src/componentes/Busca.tsx:115`: o `rotulo` ficou obrigatório, mas o inventário do mockup dá "Buscar" como padrão (`mockup.md:745`). A subtarefa 4.2 sustenta a escolha. Vale uma linha na tabela de divergências para quem ler o mockup depois não restaurar o padrão.
- `apps/web/src/componentes/Interruptor.tsx:24-25`: o comentário de linha repete o que o JSDoc já diz nas linhas 20-21. Basta um dos dois.
- `apps/web/src/componentes/Opcao.tsx:88`: o ternário aninhado numa linha só fica mais legível quebrado, como o `aspecto` logo acima.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-13 13:04:24 · `tasks/prd-pele-e-casca/4_task.md`

VEREDITO: APROVADO

Tela vista: sim (41 fotos lidas: galeria no computador e no celular, em tema claro e escuro; estrutura da coordenação cheia e vazia; entrada do aluno). As fotos da galeria vazia são byte a byte iguais às da cheia, como esperado: a galeria não depende da escola.

Estados: ok. Esta tarefa entrega peças, não telas de dado. O desligado, o marcado e desligado ao mesmo tempo, o inválido e o vazio estão todos na galeria. Carregando e erro de tela não se aplicam à peça.

Acessibilidade: ok.
- O nome acessível da `Busca` agora é obrigatório e vem de quem usa a peça. O campo tem `inputMode="search"` e `autoComplete="off"`, com teste e mutação (`Busca.tsx:21-38`).
- `Interruptor` mantém `role="switch"` e `aria-checked`. O foco é visível e não depende só de cor, porque a posição da bolinha diz o estado.
- `Opcao` usa o `<input>` nativo dentro do rótulo e `focus-within`, sem `:has()`. Desligada, o texto é `apoio` sobre `fundo-suave`, com 4,5:1 provado nos dois temas.
- O foco, o desligado e a marcada desligada se leem nas fotos clara e escura.

Chromebook fraco: ok. As correções desta rodada não trocam CSS pesado: tiram `opacity` e usam tokens. O chunk da galeria continua fora da entrada (`nome-dos-chunks.ts`, com teste).

Celular: ok nas peças desta tarefa.
- Nas fotos de 360 px não há rolagem horizontal nem corte nas peças desta tarefa.
- A busca tem 44 px, a opção tem 64 px, o interruptor tem 44 px de alvo abaixo de 768 px, e o campo tem 48 px. O e2e mede tudo isso no projeto `celular`.
- Nada depende de hover.
- O "Tema" aparece cortado no fim do valor ("reagente limitar"), o que é o comportamento normal de input de uma linha, não defeito.

Ação oficial protegida: não se aplica, a tarefa não tem ação oficial.

Correções exigidas na rodada anterior: nenhuma. As recomendações aplicadas pela ordem r1 conferem no diff:
- `rotulo` obrigatório na `Busca`.
- `Interruptor` fora de uso em `fundo-suave`, borda `borda` e bolinha `borda-campo`, sem opacidade.
- Círculo da `Opcao` desligada sem cor de ação, com o visto em `apoio`.
- Borda de campo do desligado asserida no e2e.
- `docs/interface.md` 10.2 e `4_task.md` atualizados e coerentes com o código.
- Cada mudança tem teste novo e bloco de mutação.

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. **`CaixaPedido` a 360 px**. Foto `coordenacao--galeria--celular-5.png`, componente `apps/web/src/componentes/ia/CaixaPedido.tsx:112-125`. O texto de exemplo ("Peça uma atividade, um plano de aula…") quebra e a segunda linha some atrás do botão "Só conversar". A peça não foi tocada nesta tarefa e já era assim antes. Está registrada para a 10.0 (subtarefa 10.1), que **deve tratar como bloqueante** se a foto de lá ainda mostrar isso.
2. **Tema escuro**. `campo` e `fundo-suave` têm a mesma cor, então o campo desligado ("Escola", foto `escuro--coordenacao--galeria--computador-1.png`) só se distingue pelo texto `apoio` e pelo cursor. Já está registrado para o `/validar` decidir, e o desligado não exige contraste de borda.
3. **Texto ao lado do interruptor**. O `<span>` em `galeria/secoes/campos.tsx:104-118` não é rótulo: tocar nele não troca. A tarefa que levar a peça a uma tela precisa envolver peça e texto num rótulo, para o alvo ser a linha inteira. Já está registrado para X2 a X4.
4. **Nome de variável**. `campos.tsx:104` passa `ligado={desligado}` (`useState` chamado `desligado` que guarda o "ligado"). Funciona, mas confunde com a prop `desligado` da peça. Vale renomear para `mostrarData`.
5. **Tabela que vira lista, no contêiner estreito**. Fotos da galeria no computador (`coordenacao--galeria--computador-5.png`). A segunda tabela corta o selo "IA" e as colunas à direita dentro do contêiner de 280 px. É demonstração de contêiner de outra tarefa, não do diff desta. Vale conferir se o corte é intencional.
6. **`/entrar`**. Fotos `aluno--entrar--computador.png` e `--celular.png`. Os campos ainda têm borda de 1 px (`<input>` escritos à mão). É da 14.0, anotado em `cenarios.md` A5, e a 4.0 não os toca.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Busca.tsx`, `Interruptor.tsx`, `Opcao.tsx` (mesma pasta), `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/galeria/secoes/campos.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-campos.spec.ts`.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-13 13:10:47 · `tasks/prd-pele-e-casca/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum

As três correções da rodada 2 foram feitas:
- **Tech Spec.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/techspec.md:132-134`: o interruptor fora de uso entrou em §9, "Desvios do mockup, de propósito", com o motivo pedido (um só jeito de mostrar peça desligada, e a opacidade derrubava a borda de 3:1 sem dizer o estado).
- **Documento da tarefa.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/4_task.md:104`: a linha nova na tabela de divergências aponta para §9, para a 10.2 marcada "(produto)" e para o `mockup.md` 3.4. A linha 105 registra também a `Busca` com `rotulo` obrigatório, que antes não estava escrita.
- **Interface.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md:1396`: "(produto)" está no trecho "Fora de uso".

Conferi o que mudou desde a rodada 2:
- **Árvore de trabalho.** É a mesma do snapshot `36dbf05`. Comparei os nove arquivos não rastreados e nenhum difere.
- **Interruptor.** Em `apps/web/src/componentes/Interruptor.tsx` só saiu um comentário de linha que repetia o JSDoc. A lógica do trilho e da bolinha não mudou.
- **Fotos.** A tela não mudou, então as fotos da rodada 2 valem e não há achado novo nelas.
- **Cenários.** O `cenarios.md` não fala do interruptor em nenhum ponto, então não há cenário em conflito com o desvio.

Recomendações:
- Para a próxima tarefa que tocar a peça: a bolinha fora de uso (`borda-campo`) sobre o trilho `fundo-suave` não tem prova de contraste no e2e, só no teste de componente, sem a cascata do CSS. O `4_task.md` já mandou esse item para o `/validar`.
