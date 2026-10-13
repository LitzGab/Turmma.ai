# Achados das revisões — `tasks/prd-pele-e-casca/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-13 16:31:01 · `tasks/prd-pele-e-casca/7_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só muda o visual: muda o `LoginPorCima` mas não muda o envio do login, e não toca em API, worker, fila, realtime nem migration.
Rate limit: ok (sem mudança; nenhuma rota nova)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida. O clique duplo continua barrado. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/DialogoDeConfirmacao.tsx` o botão de confirmar segue com `disabled={confirmando || impedido}` nas duas famílias. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/dialogos.tsx` (`ConfirmacaoDePerigo`) segue com `disabled={mutacao.isPending}`. A troca de ordem dos botões não mexeu nessas condições. A prova continua nos e2e `pedidos` e `acesso-da-turma`, que esta tarefa não editou.
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nada novo no caminho quente)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/dialogo-modal.ts` agora carrega a prisão e a devolução do foco que o `Dialogo`, o `LoginPorCima` (sessão vencida) e o `PainelLado` usam. Não apareceu teste de unidade de `dialogo-modal.test.ts` cobrindo `fechadoPeloNavegador` sob `StrictMode` (o efeito que fecha e reabre). Hoje isso só é provado indiretamente pelos e2e de Esc. Vale um caso direto para o `/validar`.
- O `PainelLado` ainda não tem consumidor no produto. Quando ele entrar com o sino (X2 e X3), a tela que o usar precisa passar por este guardião se buscar dado que cresce com aluno: lista paginada e consulta com escopo de escola.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-13 16:32:25 · `tasks/prd-pele-e-casca/7_task.md`

VEREDITO: APROVADO

Tela vista: sim (18 fotos lidas: galeria nas quatro peças abertas, 1366 px e 360 px, tema claro e escuro; `/coordenacao/professores` com "Cadastrar professor", cheia e vazia; `/professor/turmas`, cheia e vazia). O tema escuro da coordenação e da professora não foi fotografado, e a galeria o cobre. O menu aberto dentro do diálogo e o login por cima (sessão vencida) não aparecem em foto: o comando aceitou um clique só e o login exige sessão vencida. Conferi os dois pelo código e pelo e2e.

Estados: ok. Carregando e falha estão na `DialogoDeConfirmacao` (`confirmando`, `falha`, `role="alert"`) e no `DialogoDeFormulario` (`enviando`, `falha`). Vazio e "com dado" não se aplicam às peças de sobrepor. As telas fotografadas (professores, turmas) não mudaram nesta tarefa e mostram lista e vazio.

Acessibilidade: ok.
- A prisão do foco e a devolução ao gatilho ou ao `focoDeReserva` estão em `apps/web/src/componentes/dialogo-modal.ts`, uma vez só, com teste de unidade e mutações.
- O foco começa no texto da confirmação e no miolo do painel, nunca no botão que confirma.
- O "Fechar" do painel tem `aria-label` e 44 px. O Esc do menu fecha só o menu.
- O campo do login e o de leitura do convite ganharam borda de 2 px em `borda-campo` e rótulo visível.
- O e2e novo roda axe nos dois temas e confere o foco.
- Rodei os cinco arquivos de unidade da tarefa e os 80 testes passam.

Chromebook fraco: ok.
- O painel não anima largura nem altura.
- O miolo do painel e a caixa do `Dialogo` rolam por dentro (`max-h-[calc(100svh-2rem)]`).
- `PainelLado` está em `PECAS_FORA_DA_ENTRADA`, com teste em `nome-dos-chunks.test.ts`.
- O que `Dialogo` e `PainelLado` dividem fica em `dialogo-modal.ts`, que a entrada já baixa.

Celular: ok.
- A 360 px, as fotos não mostram rolagem horizontal nem texto cortado.
- A confirmação empilha os dois botões, "Cancelar" em cima, ambos com a largura da caixa e 44 px de altura.
- O painel vira folha de baixo com até 88% da altura e a área segura no pé.
- Nada depende de hover. O toque fora não fecha o painel, para não apagar o digitado, e o e2e prova isso.

Ação oficial protegida: sim.
- A confirmação mostra atividade, turma e número de correções antes dos botões. O perigo cheio só existe na confirmação, e a lista fechada está provada em `perigo-cheio.test.ts`.
- A rejeição exige motivo: o botão fica desligado com o campo vazio, como na foto.
- O texto do estado em andamento ("Aprovando…") e o clique duplo seguem cobertos pelos e2e de `pedidos` e `acesso-da-turma`.

Bloqueantes: nenhum.

Recomendações:
1. **Ordem dos botões do rodapé:** ela difere entre as peças, e as fotos mostram os quatro jeitos.
   - O formulário (`dialogos.tsx` `DialogoDeFormulario`, `DialogoDoConvite.tsx`) põe a ação e depois "Cancelar", à direita ("CRIAR DISCIPLINA, CANCELAR").
   - A `ConfirmacaoDePerigo` (`dialogos.tsx:169`) também põe a ação primeiro.
   - A `DialogoDeConfirmacao` põe "Cancelar" primeiro.
   - O rodapé do painel na galeria (`sobrepor.tsx`) põe "Cancelar" e depois "Aplicar".
   - A tarefa documenta o porquê (não mexer na ordem do Tab das seis telas), mas vale uma tarefa própria para uniformizar.
2. **Menu aberto dentro do diálogo e do painel:** fica sem foto e só tem e2e. Quando houver tela que o use (X2 e X3), fotografe com dois cliques seguidos.
3. **Texto da galeria** com termo técnico ("O Esc de dentro do menu fecha só o menu", "O painel não fecha ao tocar fora dele"): é página interna sem link do produto (`caminhos.ts:199`) e não bloqueia. Se a galeria virar referência para o Gabriel, reescreva em português corrente.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/PainelLado.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/dialogo-modal.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/DialogoDeConfirmacao.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/Dialogo.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-sobrepor.spec.ts`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-13 16:33:05 · `tasks/prd-pele-e-casca/7_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os da tabela da 7.0:
- foco preso e devolvido em `Dialogo`, confirmação e `PainelLado`, com o caso do `focoDeReserva`
- Esc em cada um dos três, e o Esc do menu fechando só o menu
- o painel a 480 px no computador e em folha de baixo no celular, com o foco no miolo
- os dois botões da confirmação iguais, nas duas famílias e nos dois projetos
- o perigo cheio numa lista fechada
- o menu pelo teclado e a pele dele
- os dois temas com axe e alvo de toque
- sessão vencida com diálogo aberto
- recomeço e clique duplo, pelos specs que já existem e não mudam
- nenhum teste de regra enfraquecido

Também conta a regra que a própria tarefa declarou: o véu forte do `LoginPorCima` nos dois temas.

**Cobertos:**
- **Prisão do foco (`dialogo-modal.ts`):** são 10 mutações, e conferi uma a uma no papel que cada uma deixa um teste de `dialogo-modal.test.ts` vermelho pela cláusula certa. Inclui o caso do foco no título fora da ordem do Tab e o controle desligado no fim.
- **Pele do `Menu`:** as 12 mutações batem com as asserções de `Menu.test.tsx`.
- **Perigo cheio:** as 7 mutações (a lista e o detector) batem com `perigo-cheio.test.ts`.
- **Véu de cada tema e chunk:** as 3 do véu em `estilos.test.ts`, conferido contra o token `veu` de cada tema, e a do `PainelLado` em `nome-dos-chunks.test.ts`.
- **e2e:**
  - Tab e Shift+Tab presos no `Dialogo` e no `PainelLado`.
  - Esc nos três, e o Esc do menu dentro do diálogo e dentro do painel.
  - Foco devolvido a quem abriu, e ao `focoDeReserva` na `ConfirmacaoDePerigo`, no `PainelLado` e na confirmação oficial.
  - 480 px colados à direita, e a folha de até 88%.
  - Foco no miolo, e o toque fora que não fecha.
  - Botões iguais em largura e altura, com "Cancelar" antes na tela e no Tab, nas duas famílias, lado a lado ou empilhados.
  - Os dois temas: anel com degrau, véu, axe e 44 px.
- **Specs que não mudam:** `teclado-do-menu.test.ts`, `flutuante.test.ts`, `inatividade`, `acesso-suspenso`, `pedidos` e `acesso-da-turma` estão intactos. No `pecas-sobrepor.spec.ts` o diff só acrescenta.
- **Proibidos:** nenhum `.skip`, `.only` ou `fixme`, e nenhum dublê de `showModal`.
- **Execução:** rodei os cinco arquivos de unidade e passaram os 80 casos.

**Bloqueantes:**
1. **O véu forte do login por cima não tem teste que o prove.** A cláusula nova está em `apps/web/src/componentes/LoginPorCima.tsx:86` (`data-sessao-vencida=""`).
   - **O que está errado:** antes, o véu forte valia para todo `dialog`. Agora ele só alcança o login por cima por causa desse atributo. `estilos.test.ts:624` só confere que a regra existe no CSS, não que o login a recebe.
   - **O furo:** se alguém apaga o atributo, o login cai no `veu` de 35% e nada fica vermelho. Nenhum e2e lê o `::backdrop` do login (procurei por `backdrop` e `sessao-vencida` em `e2e/`). A cláusula também não está entre as "só do e2e" da seção Mutações.
   - **Correção exigida:** no caso do `e2e/inatividade.spec.ts` (ou `acesso-suspenso`) que já abre o login por cima, afirmar `getComputedStyle(dialog, '::backdrop').backgroundColor === 'rgba(13, 13, 13, 0.75)'`. Afirmar também com `data-tema='escuro'`, porque a regra do escuro tem a mesma especificidade e quem vence é a ordem no arquivo. Depois, declarar a cláusula na seção Mutações, entre as provadas no e2e.
2. **Falta, na confirmação, o Tab preso que a tabela da tarefa pede ("em `Dialogo`, confirmação e `PainelLado`").** Está em `e2e/pecas-sobrepor.spec.ts:414-418`.
   - **O que está errado:** na `DialogoDeConfirmacao` o foco começa no texto (`tabIndex={-1}`), fora da ordem do Tab. É justamente o caso que motivou a lógica de "haver controle antes" na prisão do foco. O e2e só aperta Tab duas vezes (Cancelar, depois Confirmar) e nunca passa do limite.
   - **O furo:** a unidade cobre esse caso no jsdom, mas o comportamento real do Chrome nesse limite fica sem prova. O laço de Tab do `Dialogo` usa o `DialogoDeFormulario`, em que o foco começa num campo e não num elemento fora da ordem.
   - **Correção exigida:** no laço dos dois casos, a partir do foco inicial, Shift+Tab tem de ir a Confirmar. Depois, o Tab a partir de Confirmar tem de voltar a Cancelar, sempre com `estaDentro(confirmacao)` verdadeiro.

**Recomendações:**
- **A lista do perigo cheio é por arquivo.** Um segundo uso dentro de um arquivo já listado passa, por exemplo um botão cheio no `DialogoDeFormulario` de `dialogos.tsx`, ou uma segunda seção em `galeria/secoes/botoes.tsx`. Contar os usos por arquivo fecharia isso.
- **O detector deixa passar dois jeitos de escrever o cheio:** `classesDoBotao(opcoes)` com o objeto montado antes, e a prop vinda de um spread (`{...props}`).
- **Os campos do `LoginPorCima` e o `CampoDoLink` não têm asserção** da pele que a 7.1 pede (borda de 2 px em `borda-campo`, fundo `campo`). Um `desenho()` no e2e do login cobriria.
- **Duas medidas da tarefa ficam sem asserção:** a largura de 520 px do `Dialogo` (decidida como divergência) e o rodapé à direita dos diálogos de formulário.
- **O caso dos dois temas só abre a confirmação oficial.** A de perigo usa a mesma caixa, então custa pouco incluí-la.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/7_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/LoginPorCima.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-sobrepor.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/__fixtures__/perigo-cheio.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/perigo-cheio.test.ts

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-13 16:33:15 · `tasks/prd-pele-e-casca/7_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `docs/interface.md` 10.2, linha do `DialogoDeConfirmacao`. A lista fechada do perigo cheio só está registrada no `7_task.md`, e a 10.2 diz o contrário do que o teste prova.
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade e alvo)

Bloqueantes:
- **Onde:** `docs/interface.md:1405`, com `tasks/prd-pele-e-casca/7_task.md:103`.
  - **O que está errado:** a linha diz que "o `perigo` cheio só existe aqui e na `ConfirmacaoDePerigo` de `dialogos.tsx`". Não é verdade. `apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx:142` escreve `CLASSES_DO_BOTAO_PERIGO_CHEIO`, e `apps/web/src/componentes/perigo-cheio.test.ts` aceita uma lista fechada de seis arquivos, com o `DialogoDeDecisao` e a galeria dentro. A primeira linha da tabela de divergências cita como registro só o próprio `7_task.md` e o RF5 do PRD, e o RF5 não traz a lista.
  - **Consequência:** a divergência vive só no `N_task.md`. O documento que o teste cita como fonte manda tirar o cheio de uma tela que hoje o usa com razão.
  - **Correção exigida:** na linha do `DialogoDeConfirmacao` da 10.2, dizer onde o perigo cheio vive:
    - nas três confirmações: `DialogoDeConfirmacao`, `ConfirmacaoDePerigo` e o `DialogoDeDecisao` dos pedidos de nome;
    - na galeria;
    - e que `perigo-cheio.test.ts` guarda essa lista fechada.
  - Depois, apontar a primeira linha da tabela de divergências para a 10.2.

Recomendações:
- `7_task.md:108`: a divergência do véu forte do `LoginPorCima` cita "`techspec.md` seção 6", mas essa seção não fala de véu. O registro de fato está na linha do `LoginPorCima` em `docs/interface.md` 10.2. Corrigir a citação.
- `7_task.md:106`: a divergência da `ConfirmacaoDePerigo` com os botões à direita cita só o próprio `7_task.md`, e ela já está em `docs/interface.md:1405`. Citar a 10.2.
- `apps/web/src/estilos.css:497-503`: o `dialog::backdrop` passa a ser o `veu` (35%) para todo `<dialog>`, e isso muda já o véu da gaveta da casca (`dialog` "Menu"), que é das tarefas 12.0 e 13.0. A mudança é coerente com a D80, mas vale uma linha no `cenarios.md` ou na 10.2 dizendo que a gaveta herda o véu a partir da 7.0, para a 12.0 não achar que é dela.
- `apps/web/src/estilos.css:512`: o véu forte do login vence o do escuro só porque tem a mesma especificidade e vem depois no arquivo. `estilos.test.ts` confere os seletores e os valores, mas não a cascata. Se alguém reordenar o bloco, o login fica com o véu leve no escuro sem nenhum teste de unidade reprovar.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/7_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/perigo-cheio.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/pedidos/DialogoDeDecisao.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.css

## revisor-geral · 2ª rodada · APROVADO · 2026-10-13 17:06:40 · `tasks/prd-pele-e-casca/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

A correção exigida na 1ª rodada foi feita:
- A linha da `DialogoDeConfirmacao` na 10.2 (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md:1405`) agora diz onde o `perigo` cheio vive: nas três confirmações (`DialogoDeConfirmacao`, `ConfirmacaoDePerigo` e `DialogoDeDecisao`), na definição do botão e na galeria. Diz também que `componentes/perigo-cheio.test.ts` guarda essa lista fechada.
- Conferi a lista com `USOS_DO_PERIGO_CHEIO` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/perigo-cheio.test.ts:21-28`. São os mesmos seis arquivos, e o `DialogoDeDecisao.tsx:142` está entre eles.
- A primeira linha das divergências em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/7_task.md:103` agora aponta para a 10.2.

As três recomendações que a ordem mandou aplicar também foram feitas:
- A divergência do véu do `LoginPorCima` agora cita a 10.2, e não mais a `techspec.md` seção 6.
- A divergência da `ConfirmacaoDePerigo` cita a 10.2.
- A 10.2 ganhou a linha dizendo que a gaveta herda o `veu` a partir da 7.0.

A cascata do véu forte, que ficou sem aplicar, agora tem teste: `e2e/inatividade.spec.ts` lê o `::backdrop` do login por cima nos dois temas, e o tema escuro é onde só a ordem do arquivo decide.

O e2e novo bate com o que a 10.2 descreve:
- Os botões "Aprovar 32 correções" e "Suspender a função" existem como `rotuloDeConfirmar` em `galeria/secoes/sobrepor.tsx:64` e `:94`.
- O rodapé do formulário com a ação primeiro e "Cancelar" por último segue a quarta linha das divergências.
- Mover `corDoToken` para `e2e/__fixtures__/verificacoes.ts` evita duas cópias da mesma função.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md:1404`: o texto diz "a gaveta da casca (12.0 e 13.0)", mas no `tasks.md` a gaveta é só da 13.0 (13.2). A 12.0 é a casca no computador, sem gaveta. Basta citar a 13.0.

## test-engineer · 2ª rodada · APROVADO · 2026-10-13 17:06:44 · `tasks/prd-pele-e-casca/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos nesta rodada.** As duas correções da 1ª rodada, e o que o diff r1→r2 afeta: a largura de 520 px e o rodapé à direita do `Dialogo`, a pele dos campos do `LoginPorCima` e do `CampoDoLink`, e o perigo cheio nos dois temas. O `apps/web` não mudou desde a 1ª rodada, e o que não mudou não foi reauditado.

**Cobertos.**

1. **Véu forte do login por cima.** Correção feita, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/inatividade.spec.ts:99-105`.
   - O teste lê o `::backdrop` calculado do login aberto pela sessão vencida e exige `rgba(13, 13, 13, 0.75)` com `data-tema` em `claro` e em `escuro`. Depois devolve o tema que a página tinha.
   - Ele fica vermelho se alguém apagar `data-sessao-vencida` (`LoginPorCima.tsx:86`): o véu cai para 0,35 no claro.
   - Também fica vermelho se a regra de `estilos.css:358` subir para antes da do escuro (`:347`). As duas têm a mesma especificidade, (0,2,2), e no escuro o véu viraria 0,6.
   - A cláusula está declarada na seção Mutações de `7_task.md`, entre as provadas no e2e.

2. **Tab preso na confirmação.** Correção feita, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/pecas-sobrepor.spec.ts:418-431`, nos dois casos do laço (oficial e perigo).
   - O foco começa no texto, e o Shift+Tab a partir dele tem de ir a Confirmar. Isso passa pelo ramo `shiftKey && !haAntes` de `dialogo-modal.ts:38`. Sem a armadilha, o Chrome levaria o foco para fora da caixa.
   - O Tab em Confirmar volta a Cancelar (ramo `!haDepois`), com `estaDentro(confirmacao)` verdadeiro a cada passo.

3. **Recomendações que a ordem mandou aplicar (itens 7, 8 e 9).**
   - **Campos do login e do link.** Borda de 2 px em `borda-campo` e fundo `campo`, lidos do token na página, nos dois temas. Estão em `inatividade.spec.ts:107-110` e em `professores.spec.ts:434-438`.
   - **Largura do `Dialogo` e rodapé.** A caixa fica entre `min(520, janela − 32) − 8` e esse valor, e a tolerância está explicada pelo `max-width` do `dialog` no navegador. O último botão termina no enchimento de 24 px (20 abaixo de 640), e sobra espaço à esquerda do primeiro. Está em `pecas-sobrepor.spec.ts:292-307`.
   - **Perigo cheio nos dois temas.** O fundo do botão de perigo é o `vermelho` do tema, e o oficial não é. Está em `pecas-sobrepor.spec.ts:597-605`.

4. **Sem `.skip` nem teste comentado, e nenhum mock esconde a regra.** A `corDoToken` foi movida para `e2e/__fixtures__/verificacoes.ts` sem mudar de comportamento.

Não rodei o e2e: ele depende da pilha de pé, e a seção Mutações o declara como provado pelo portão da tarefa.

**Bloqueantes:** nenhum.

**Recomendações:**
- `e2e/pecas-sobrepor.spec.ts:601-604`: o botão oficial só é provado como "não vermelho". Comparar com o token do `oficial` (`corDoToken(page, '<token do oficial>')`) provaria a cor certa, e não só a ausência da errada.
- `e2e/inatividade.spec.ts:112-114`: o Tab preso do login por cima continua com dois Tabs que não chegam ao fim da ordem; isso é anterior a esta tarefa. Repetir ali o Shift+Tab a partir do foco inicial, como na confirmação, provaria a volta ao último controle.
