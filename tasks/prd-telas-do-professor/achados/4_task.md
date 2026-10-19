# Achados das revisões — `tasks/prd-telas-do-professor/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-19 04:27:11 · `tasks/prd-telas-do-professor/4_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só mexe no frontend (`Conversa.tsx`, `CartaoDeFerramenta.tsx`, `MotorFormulario.tsx`, `avisos.tsx`, `Home.tsx`) e nos e2e. Nenhum caminho novo grava Nota, e os que já existiam não mudaram. Todos com autor humano? sim, nada mudou.

Decisão autônoma sobre aluno: ausente.

Aprovação registrada: ok.
- O resultado da ferramenta continua sendo uma `MensagemIA`, assinada pela função. A versão adaptada nasce pendente, com "Ver e decidir" e o texto "Esta versão só pode ir aos alunos depois que você aprovar" (`apps/web/src/areas/professor/ResultadoDaFerramenta.tsx:39-60`, sem alteração).
- A pergunta da D18 continua. O cartão só abre com o "sim", e os testes `Conversa.test.tsx` › "nenhum cartão sem o 'sim'" e › "a pergunta da D18" provam isso.
- A Adaptação abre sem o texto da caixa (D35, D67), provado em `Conversa.test.tsx` › "a Adaptação" e em `CartaoDeFerramenta.test.tsx` › "a Adaptação não tem onde receber texto".
- A frase "Nada chega à turma sem você aprovar" agora existe num lugar só, o `AvisoDeIA` em `avisos.tsx:27-39`, e é verdade hoje: nenhuma ferramenta entrega direto à turma.

Supervisão do tutor: ok. A tarefa não toca o tutor.

Autonomia declarada e visível: sim. A tarefa não muda nada nisso.

Fotos da tela (as seis, cheia e vazia, computador e celular, com e sem o menu aberto):
- A frase de IA aparece sob a caixa nas duas larguras.
- Não há nota, conceito, sugestão de nota, placar, contador de uso nem nada que induza uso (D59).
- O menu "Ferramenta" descreve a Adaptação como "Você escolhe o tipo de adaptação", sem campo sobre o aluno.
- A resposta assinada e o cartão aberto não foram fotografados. Conferi pelo código e pelos testes: `Conversa.test.tsx` › "a IA se identifica" prova que cada resposta tem o nome da função e um único `[data-selo-ia]`. O ícone do cartão tem `aria-hidden` (`icones-de-ferramenta.tsx:84`), então não muda o nome do título.

Recomeço entre pessoas na mesma aba (privacidade, não regra 70, mas toca o que o professor vê): o caso em `e2e/professor-sino.spec.ts:256-303` prova que a segunda professora não vê a conversa nem o cartão da primeira, e que o texto da primeira não fica no cache.

Bloqueantes: nenhum.

Recomendações:
- O comentário do `AvisoDeIA` (`apps/web/src/areas/professor/avisos.tsx:27-32`) diz que a frase sai se alguma ferramenta passar a entregar direto à turma. Vale registrar esse gatilho também na seção 9 da `techspec.md` ou no `docs/agentes.md`, para que quem criar essa ferramenta encontre a frase pela regra e não só pelo comentário.
- Nas fotos de `/professor/conversa`, a navegação marca "Início" como ativo (`professora--professor-conversa--computador.png`, `professora--professor-conversa--celular.png`). Não é da regra 70, então fica para o `frontend-reviewer` decidir se a conversa deve ter item próprio ou herdar o Início.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 04:27:49 · `tasks/prd-telas-do-professor/4_task.md`

VEREDITO: APROVADO
Tela vista: sim (6 fotos lidas, cheia e vazia, computador e celular, mais o menu "Ferramenta" aberto nas duas escolas). O cartão aberto e os balões não saem na vitrine, e os revisei pelo código e pelos testes.
Estados: ok. Carregando, erro com "Tentar de novo", vazio, com dado, sem turma com "Ir para Turmas" e função suspensa têm cada um um teste de componente em `Conversa.test.tsx`. Rodei esse arquivo, o de `CartaoDeFerramenta` e o de `Home`: 46 testes passaram.
Acessibilidade: ok.
- O ícone é `aria-hidden` e o nome fica ao lado dele (`icones-de-ferramenta.tsx:84`).
- O cartão é uma região com nome ("Ferramenta X"), recebe o foco ao abrir e o devolve à caixa em "Cancelar". Os testes cobrem isso.
- A frase de IA é texto, sem link.
- O menu tem teclado, foco e Esc, mas é do 7.0 e não mudou.

Chromebook fraco: ok.
- O diff não traz dependência, animação nem efeito novo. É um ícone SVG estático e classes de utilitário.
- A conversa já vinha paginada ("Ver mensagens anteriores").

Celular: ok.
- Em 360 px não há rolagem horizontal nem texto cortado. A caixa quebra em duas linhas, a turma e o enviar têm cerca de 44 px, e a frase de IA quebra em duas linhas sem sair do bloco.
- O fluxo funciona sem hover e sem o celular.
- O e2e do cartão e da folga de 24 px roda nos projetos `chromebook` e `celular`.

Ação oficial protegida: sim. Esta tarefa não cria ação oficial.
- O cartão só abre com "Usar a ferramenta" (com a turma e o tema já preenchidos), ou ao escolher uma ferramenta no menu. Antes disso `[data-cartao-de-ferramenta]` não existe.
- A Adaptação não recebe o texto da caixa (D35, D67), com teste.
- A frase "Nada chega à turma sem você aprovar" é um componente só (`AvisoDeIA`, `avisos.tsx:27`), usado no Início e na conversa.
- Cada resposta do Assistente tem o nome da função e `[data-selo-ia]` no mesmo bloco.

Bloqueantes: nenhum.

Recomendações:
1. Na foto de 360 px com o menu aberto (`professora--professor-conversa--button-name-Ferramenta--celular.png`), a lista aparece em y≈650, longe do botão, e cortada pela barra de baixo da casca.
   - Pelo código, essa foto é artefato da captura da página inteira: o menu é `fixed` ancorado ao pé (`flutuante.ts`), e o redimensionamento da captura o desloca.
   - Mesmo assim, `posicaoDoFlutuante` mede o espaço até o pé da janela e ignora `--barra-baixo` (68 px), então num celular o menu pode abrir para baixo sobre a barra de baixo. Um dos 4 itens (Atividade objetiva) fica abaixo da dobra no desktop e rola por dentro.
   - O componente é do 7.0, e esta tarefa não o mexeu. Fica para o `/validar`: abrir o menu num viewport real de 360 × 740 e ver se o último item fica acima da barra. Se não ficar, descontar `--barra-baixo` em `apps/web/src/componentes/flutuante.ts:79` (a conta do `espaco`).
2. Na conversa vazia, a caixa sobe até logo abaixo do convite (fotos vazia e cheia) em vez de ficar no pé da janela, porque a `BarraPresa` é `sticky` no fluxo e a página é curta. Se o mockup `/professor/conversa/:id` a quer no pé também com a conversa curta, é ajuste de altura mínima da `Tela`. Não bloqueia, porque o convite continua acima da caixa.
3. Em `Conversa.tsx:193`, o `pb-3` empilha a folga de 24 px sobre a `BarraPresa`, que não mudou. A divergência está declarada na tarefa e travada no e2e, então fica só o aviso: se a `BarraPresa` mudar de padding, o e2e quebra de propósito.

Arquivos principais: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Conversa.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/CartaoDeFerramenta.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/avisos.tsx`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/componentes/ia/MotorFormulario.tsx`.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 04:28:04 · `tasks/prd-telas-do-professor/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum

Recomendações:
- **Divergência do recomeço sem registro na Tech Spec.** A divergência 4 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/4_task.md` (o recomeço da conversa no caso de `e2e/professor-sino.spec.ts`) aponta para "`techspec.md` §10 (divergência da 2.0 sobre a duração do e2e)". Aquele parágrafo trata da régua de duração e não diz onde o recomeço fica. A 3.0 fez o mesmo e passou. Também não bloqueio aqui: a linha "Isolamento" da §10 já prevê o sino "na segunda pessoa". Mesmo assim, vale uma frase na §10 dizendo que o recomeço do Início (3.0) e o da conversa (4.0) moram no caso de recomeço de `professor-sino.spec.ts`, para a Tech Spec não depender dos documentos de tarefa.
- **Asserção presa à classe CSS.** Em `apps/web/src/areas/professor/Conversa.test.tsx:205`, `document.querySelectorAll('p[class*="text-center"]')` com tamanho 1 depende de uma classe Tailwind. Se alguém centralizar outro parágrafo da tela, o teste quebra sem que nenhuma regra tenha sido violada. A unicidade da frase dá para provar pelo texto (`fraseDeIA`) com `getAllByText` e tamanho 1.
- **Gatilho da frase de IA só no comentário.** A condição em que a frase sai ("se uma ferramenta passar a entregar direto à turma") está só no comentário de `apps/web/src/areas/professor/avisos.tsx:27-32`. Repetir essa condição na §9 da `techspec.md` ou em `docs/agentes.md` (o `conformidade-reviewer` já recomendou o mesmo).
- **Fotos, fora da minha regra, para o `frontend-reviewer` olhar:**
  - Em `professora--professor-conversa--button-name-Ferramenta--celular.png`, o menu "Ferramentas" aparece cortado pela barra de baixo da casca. Não deu para saber, pela foto, se é a folha ainda subindo ou se ela fica atrás da barra. O que mudou nesta tarefa é a altura da `BarraPresa`, que agora inclui a frase, em `apps/web/src/areas/professor/Conversa.tsx:193-196`.
  - Em `professora--professor-conversa--computador.png` e `--celular.png`, a navegação marca "Início" como ativo em `/professor/conversa`. Não foi esta tarefa que mudou isso.

Arquivos auditados, todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/`:
- `apps/web/src/areas/professor/Conversa.tsx`
- `apps/web/src/areas/professor/CartaoDeFerramenta.tsx`
- `apps/web/src/componentes/ia/MotorFormulario.tsx`
- `apps/web/src/areas/professor/avisos.tsx`
- `apps/web/src/areas/professor/Home.tsx`
- `apps/web/src/areas/professor/Conversa.test.tsx`
- `apps/web/src/areas/professor/CartaoDeFerramenta.test.tsx`
- `e2e/professor-conversa.spec.ts`
- `e2e/professor-sino.spec.ts`
- `tasks/prd-telas-do-professor/techspec.md` (§9, parágrafo "O cartão da conversa")

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 04:28:56 · `tasks/prd-telas-do-professor/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Estados da conversa:** carregando, erro com "Tentar de novo", vazio, sem turma confirmada (sem caixa, com "Ir para Turmas"), função suspensa, com dado.
- **Pergunta da D18:** as duas opções com o mesmo desenho, e nenhuma vem escolhida.
- **Nenhum cartão sem o "sim":** nem com a pergunta aberta, nem por "Só conversar", nem por um envio pela caixa.
- **Adaptação (D35, D67):** abre sem o texto da caixa.
- **A IA se identifica (D58):** cada resposta tem o nome da função e o selo `[data-selo-ia]` no mesmo contêiner, e o cartão tem o ícone e o nome.
- **Foco:** o cartão que abre recebe o foco, "Cancelar" o devolve à caixa, e o pedido enviado deixa o foco na caixa.
- **Fluxo completo em e2e:** os dois projetos, sem rolar de lado a 360 px.
- **Permissão:** o vínculo pendente não dá caixa.
- **Isolamento na aba:** a segunda pessoa na mesma aba não vê a conversa nem o cartão da primeira.
- **Concorrência:** dois Enter mandam um pedido só.

**Cobertos:**
- Os seis estados: `Conversa.test.tsx:120-206`. A permissão é o caso de `SEM_CONFIRMADA`, com o vínculo pendente, em `:158`.
- A pergunta da D18: `:210`. A mesma classe vale como prova da mesma variante; o mesmo tamanho medido fica no e2e, em `professor-conversa.spec.ts:73-77`.
- Nenhum cartão sem o "sim": `:230`, `:247` e `:263`.
- A Adaptação: `:279`. A palavra "laudo" é digitada na caixa e não chega ao cartão, nem à memória, nem a nenhuma chamada de rede.
- A IA se identifica: `:298` e `:318`.
- O foco: `:335`, `:354` e `:368`.
- Os quatro estados do cartão e o ícone nos dois lugares do motor (o título e o pedido recolhido): `CartaoDeFerramenta.test.tsx`. O caso sem `comIcone` também está lá.
- A folga de 24 px, a frase depois da caixa, o ícone de 32×32, a borda de 2 px e a largura a 360 px: `e2e/professor-conversa.spec.ts:38-43` e `:91-99`.
- O isolamento na aba: `e2e/professor-sino.spec.ts`. A troca de tela é feita com `pushState`, sem recarregar a página, então o teste prova de fato que a memória da aba (`CARTAO_DA_CONVERSA`) é limpa ao sair, e o cache também é conferido. Os dois testes rodam como componente (`.test.tsx`) e e2e.
- A concorrência é um caso que já existia e esta tarefa não tocou: `apps/web/src/api/ciclo-de-execucao.test.ts:59`.
- Mutações: conferi os 14 blocos contra o `git diff`. Toda cláusula nova tem o seu bloco, e cada bloco aponta para um teste que chega à cláusula: a frase e a posição dela depois da caixa, as duas metades do texto, a frase no Início (`Home.test.tsx:155`), `comIcone` no seu uso, no repasse e no padrão, o tamanho e a ferramenta do ícone, o ícone no título e no pedido recolhido, o `pb-3` e a `border-2`.
- Rodei o Vitest sobre `Conversa.test.tsx`, `CartaoDeFerramenta.test.tsx` e `Home.test.tsx`: os 3 arquivos e os 46 testes passaram. Não há `.skip` nem teste comentado. A rede é falsa, mas o cliente de consultas, a memória da aba e o roteador são os reais, e nenhum provedor de IA é chamado.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `e2e/professor-conversa.spec.ts:99`: o teste confere só a largura da borda (`borderTopWidth`). Se a cor voltasse sozinha para `border-linha`, ele não falharia. Conferir também `borderTopColor` contra o token `borda`.
2. `apps/web/src/areas/professor/Conversa.tsx`: o `gap-2` entre a caixa e a frase não tem asserção. A primeira medida do e2e (frase abaixo do campo) passaria com folga zero. Ou se mede o vão, ou se registra que é só visual.
3. `apps/web/src/areas/professor/Conversa.test.tsx:205`: `querySelectorAll('p[class*="text-center"]')` depende de uma classe de Tailwind para provar que a frase aparece uma vez só. Contar pelo texto (`getAllByText` com a função de `fraseDeIA`) diz a mesma coisa e não quebra quando o estilo muda.
4. `apps/web/src/areas/professor/Conversa.test.tsx:86-97`: `vi.stubGlobal` e a troca de `Element.prototype.scrollIntoView` não são desfeitos no `afterEach`. Acrescentar `vi.unstubAllGlobals()` e restaurar o protótipo, a menos que o config do Vitest já tenha `unstubGlobals`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Conversa.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/CartaoDeFerramenta.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-conversa.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/e2e/professor-sino.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/4_task.md

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 04:57:34 · `tasks/prd-telas-do-professor/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

As três correções da 1ª rodada foram feitas:
- **Recomeço registrado na Tech Spec.** A §10 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/tasks/prd-telas-do-professor/techspec.md` (linha 218) agora diz que o recomeço da 3.0 e o da 4.0 ficam no caso de recomeço de `e2e/professor-sino.spec.ts`, e por quê.
- **Unicidade da frase provada pelo texto.** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/apps/web/src/areas/professor/Conversa.test.tsx:212` usa `expect(frasesDeIA()).toHaveLength(1)`. A mutação nova, que duplica o `<AvisoDeIA />` em `Conversa.tsx:195`, aponta para esse mesmo caso ("caixa presa embaixo").
- **Gatilho da frase de IA na §9.** A condição está escrita lá (linha 176): a frase sai das duas telas antes de existir ferramenta que entregue à turma sem aprovação.

O resto do diff confere:
- **Cor da borda.** O e2e compara o `borderTopColor` do cartão (`Conversa.tsx:171`, `border-2 border-borda`) com o da linha `[data-escolha="feita"]` (`Escolha.tsx:66`, também `border-2 border-borda`). Os dois têm a mesma origem, e a mutação para `border-borda-forte` muda essa cor, então o teste fica vermelho.
- **Limpeza do `afterEach`.** `vi.unstubAllGlobals()` e a volta do `scrollIntoView` original estão certos.

Recomendações:
- A frase nova da §10 está numa linha de tabela com a primeira coluna vazia (`techspec.md:218`). Lê melhor como parágrafo depois da tabela, ou com a camada "E2E" na primeira coluna.
- `fraseDeIA` e `frasesDeIA` em `Conversa.test.tsx:38-39` repetem o mesmo filtro. Dá para tirar o filtro para uma função só e montar as duas a partir dela.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 04:57:41 · `tasks/prd-telas-do-professor/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (os mesmos da 1ª rodada; esta rodada só mexe em teste e em texto):
- a caixa de pedido presa embaixo, com a frase de IA depois dela e uma vez só;
- o cartão aberto com borda de 2 px na cor do token `borda`;
- os quatro estados da conversa e a função suspensa;
- o recomeço da conversa, em `e2e/professor-sino.spec.ts`.

**Cobertos.** As três recomendações aplicadas foram feitas, e cada uma tem mutação que a prova:

- **Recomendação 1 (cor da borda).** `e2e/professor-conversa.spec.ts:101-102` compara o `borderTopColor` do cartão com o da linha `[data-escolha="feita"]`. Essa linha é desenhada com `border-2 border-borda` em `apps/web/src/componentes/ia/Escolha.tsx:66`. A mutação nova, `border-borda` para `border-borda-forte` em `Conversa.tsx:171`, chega a essa asserção. A troca de `linha` por `borda-forte` na mutação faz sentido: `linha` e `borda` têm a mesma cor, então a mutação antiga para `border-linha` só a largura pega, e essa já tem bloco próprio.
- **Recomendação 3 (contar a frase pelo texto).** `Conversa.test.tsx:38` define `frasesDeIA`, que procura pelo `textContent` do parágrafo e não depende mais da classe Tailwind. A asserção `toHaveLength(1)` está na linha 212. A mutação que duplica o `<AvisoDeIA />` (`Conversa.tsx:195`, a única ocorrência) cai no caso "caixa presa embaixo" e fica vermelha pelo motivo certo: duas frases em vez de uma.
- **Recomendação 4 (desfazer o que o teste troca).** O `afterEach` agora roda `vi.unstubAllGlobals()` e devolve o `scrollIntoView` original, ou o apaga se o `jsdom` não tinha nenhum.

Rodei `npx vitest run apps/web/src/areas/professor/Conversa.test.tsx` uma vez, sem alterar nada: 16 de 16 verdes.

Na techspec, o texto novo do §9 diz quando a frase "Nada chega à turma sem você aprovar" deixa de valer (regra 70, item 3). A linha nova do §10 registra por que os testes do recomeço ficaram em `professor-sino.spec.ts`. As duas mudanças são coerentes com o que os testes provam.

**Recusa da recomendação 2.** O motivo registrado na tabela "Recomendações sem aplicar" do `4_task.md` se sustenta: o critério da tarefa fixa os 24 px até o pé da barra, e o e2e mede isso. O vão do `gap-2` entre a caixa e a frase é só visual.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A asserção em `e2e/professor-conversa.spec.ts:102` compara o cartão com um elemento vizinho que usa o mesmo token. Ela pega troca de token no cartão, mas não pega mudança do valor de `borda` no tema. Não é a regra desta tarefa; fica registrado para o `/validar`, caso a pele exija a cor absoluta.
