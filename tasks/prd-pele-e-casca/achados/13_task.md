# Achados das revisões — `tasks/prd-pele-e-casca/13_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-15 21:49:46 · `tasks/prd-pele-e-casca/13_task.md`

VEREDITO: APROVADO

Tela vista: sim. Li 16 fotos (professora `/professor/turmas`, aluno `/aluno/tutor`, coordenação `/coordenacao/estrutura`, cada uma a 1366 e a 360 px, cheia e vazia). Fotografei também, por script meu, a gaveta aberta a 360 px do professor e do aluno, que a vitrine não pega: `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specpele-e-casca--l1/0020bb60-0469-4f19-8d19-5074f82857c3/scratchpad/gaveta-prof.png` e `gaveta-aluno.png`. A BarraPresa acima da barra e a faixa do Tutor a 360 px não aparecem em foto; revisei pelo código e pelo e2e `casca-no-celular.spec.ts`.

Estados:
- ok. Com dado e vazio nas fotos, e o vazio do Tutor convida ("Quando houver uma, ela aparece aqui").
- Carregando e erro, pelo código: sem `/v1/eu` não há barra, a gaveta vem sem itens e a barra de topo mostra a escola em branco por instantes. É o comportamento herdado, e a barra aparece sem pulo porque o `useLayoutEffect` reserva o lugar antes da pintura.

Acessibilidade:
- `navigation "Seções"` única, com `aria-current`. A pílula do ícone é decorativa e o rótulo está escrito.
- Gaveta é `dialog` modal, e a barra é irmã dela, portanto inerte com a gaveta aberta.
- Anel de foco por dentro (−3 px) no item que encosta no pé da janela.
- O rótulo de 12 px é a exceção prevista na seção 9.2 da `docs/interface.md`. Os testes de contraste e `violacoesGraves` estão nos e2e.

Chromebook fraco:
- Sem blur, sem animação de largura, `fixed` e `sticky` simples. A leitura de `matchMedia` é por `useSyncExternalStore`.
- Rodei `BarraDeBaixo.test`, `CascaDaEscola.test` e `Superficies.test`: 31 testes, todos passam.

Celular:
- A 360 px não há rolagem horizontal em nenhuma foto.
- Medi na gaveta aberta (script meu): escola, Meus dados, Sair e Fechar com 44 px ou mais, e `scrollWidth` igual a 360.
- Barra de topo de 56 px com "Sair" visível. O nome da escola corta com reticências e o "Sair" nunca sai da janela.
- A medição dos itens da barra de baixo (68 px e 44 px mínimo) está no e2e `casca-no-celular.spec.ts`, que não rodei.
- Nada depende de hover, e nenhum fluxo exige o celular.

Ação oficial protegida: sim. A tarefa não cria nem altera ação oficial. A BarraPresa da aprovação do lote sobe acima da barra de baixo e continua à vista.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/componentes/CascaDaEscola.tsx:128` e `:324`, vistas em `coordenacao--coordenacao-estrutura--computador-1.png`: a lateral da coordenação a 1366×768 corta "PRIVACIDADE" pela metade, porque o pé de 240 px toma a altura e o resto rola por dentro. É da 12.0, fora do escopo desta tarefa, e o item continua alcançável. Anotar para a X2, que reduz os lugares da coordenação a quatro, ou para o `/retro`. Vale conferir se o recorte parcial é pista suficiente de rolagem para quem não é técnico.
2. `BarraDeBaixo.tsx:69` com o header de 56 px, em celular deitado (cerca de 640×360): barra de topo mais barra de baixo tomam 124 px dos 360 px de altura. É legível, mas vale um caso no `celular` quando houver projeto de paisagem.
3. A barra de topo mostra a escola como texto, sem ser o seletor. O professor com duas escolas troca abrindo a gaveta. Segue a `docs/interface.md` 11.1 e a regra 50, item 13, mas é um toque a mais do que o do computador; vale lembrar na X3.
4. `docs/interface.md` 11.1 não cita que a `BarraPresa` sobe acima da barra de baixo (`--barra-baixo`). Está só no comentário do componente. Uma linha na seção ajuda quem desenhar a próxima tela com barra presa.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-15 21:50:26 · `tasks/prd-pele-e-casca/13_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência no anel de foco do item da barra de baixo e no oráculo do A5. Ela só está registrada no `13_task.md`.
Portão local: carimbo válido

**Bloqueantes:**

1. **O anel de foco por dentro e a troca do Tab só foram registrados no `13_task.md`.**
   - **Onde:** `apps/web/src/componentes/BarraDeBaixo.tsx:78` e `e2e/tokens.spec.ts:246-259`.
   - **O que está errado:** o item da barra leva `focus-visible:-outline-offset-3`, e o A5 no celular deixou de chegar ao item "Turmas" pelo Tab. Agora fecha a gaveta com Esc, chama `itemTurmas.focus()` e espera `afastamento: '-3px'`.
   - **Por que diverge da spec:** a `techspec.md` (§ Foco, linha 150) só põe o anel por dentro em "linha de tabela e de lista". O `docs/interface.md` 10.1, item 2, só põe na "linha de tabela". O `cenarios.md` A5 espera afastamento de `2px` no item "Turmas". Sobre a `:185`, ele diz apenas que a linha "muda de lugar no celular (parte B)": troca o seletor, não o jeito de percorrer.
   - **A tabela de divergências cita fontes que não dizem isso:** a 3ª linha cita "`cenarios.md` A5" e "`docs/interface.md` 10.1", e nenhum dos dois foi alterado nem traz essa regra. É divergência que vive só no `N_task.md`.
   - **Correção exigida:** levar a decisão à `techspec.md` § Foco (o item da barra de baixo com anel de −3 px), ao `docs/interface.md` 10.1 item 2 e ao `cenarios.md` A5. No A5, escrever a parada nova da `:185` no celular: Esc fecha a gaveta, o foco vai ao item e o afastamento esperado é `-3px`. A outra saída é voltar aos 2 px e ao percurso por Tab que o A5 declara.

2. **No celular, o foco do teclado fica escondido atrás da barra de baixo.** Isso viola a WCAG 2.4.11, a regra 50, item 11, e o RF23.
   - **Onde:** `apps/web/src/estilos.css:304-310` e `apps/web/src/componentes/BarraDeBaixo.tsx:62-66`.
   - **O que está errado:** a barra é `fixed` e cobre os 68 px de baixo da janela, mas nada reserva esse espaço na rolagem do documento. Só o padding do `<main>` reserva, e ele só vale no fim da página. Ao andar de Tab por qualquer tela do professor ou do aluno abaixo de 768 px, o navegador para o controle focado no pé da janela, atrás da barra.
   - **Onde a barra já se protege:** só nas telas com `BarraPresa`, porque ela grava `scroll-padding-bottom` à mão (`BarraPresa.tsx:57-61`). Nas outras telas, nada protege.
   - **Quem é atingido:** quem usa o Chromebook com 200% de zoom cai na faixa estreita (683 px) e navega pelo teclado. É o caso de edital.
   - **O que o teste não cobre:** o e2e da `casca-no-celular.spec.ts` só confere o fim da página rolada.
   - **Correção exigida:** pôr `scroll-padding-bottom: var(--barra-baixo)` no `:root[data-barra-de-baixo]`. O valor inline da `BarraPresa` continua sobrepondo esse, porque ela já soma o quanto sobe. Também é preciso um e2e a 360 px que leve o foco por Tab a um controle no meio de uma tela comprida e prove que a caixa dele termina acima de `secoes(page)`.

**Recomendações:**
- A barra de topo `sticky top-0` de 56 px tem o mesmo problema no Shift+Tab: falta `scroll-padding-top`. O problema já existia antes desta tarefa, então vale levar a uma correção própria ou à 14.0.
- No A5, o `itemTurmas.focus()` programático não prova que o item da barra é alcançável pelo Tab com a gaveta fechada. Um Tab a partir do "Sair" da barra de topo, ou do último controle do `<main>`, provaria isso.
- O item do `lucide` na barra usa `Ladrilho` de 32 px (`BarraDeBaixo.tsx:39`), e a spec diz "ícone de 28". Vale escrever no `docs/interface.md` 11.1 que, para esse item, os 28 px são o miolo do ladrilho. Assim o teste `cada ícone tem 28 px` deixa de ter de explicar a exceção.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/BarraDeBaixo.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.css
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/tokens.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md

## test-engineer · 1ª rodada · REPROVADO · 2026-10-15 21:52:19 · `tasks/prd-pele-e-casca/13_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os da tabela da 13.0:
- quatro itens na barra e cinco na gaveta
- itens de cada papel, com a A14 em `toHaveCount(1)` e a coordenação só na gaveta (A90, A93)
- nome comprido a 360 px
- alvo de 44 px (A13, A93, A95)
- último botão acima da barra, com a `BarraPresa` à vista (A75) e a faixa do Tutor com "Hoje: N de 60" (A54, A55)
- gaveta modal (A15, A16) e barra inerte
- a gaveta fecha por rota, pessoa e escola
- a pessoa troca sob o mesmo caminho (`usuarioDaSessao`)
- as negativas de `areas:171` e `meus-dados:289` com controle positivo
- a fixture nos dois projetos
- recomeço

Isolamento: a tarefa só mexe na tela. O nome da escola vem do `/v1/eu` da própria sessão, e o `renomearEscolaNoBanco` mexe só na escola que o teste criou. Permissão: a coordenação fica sem barra, e o aluno não tem "Turmas" (`escola-e-vinculos:197`).

**Cobertos:** `ondeFicamOsItens` com 0, 1, 4, 5 e 7 itens, e os papéis reais. `BarraDeBaixo`: links, `aria-current`, pílula acesa e apagada, ícone de 28 px, rótulo cortado, `fixed`, e a marca no `<html>` que entra e sai. Casca no jsdom: estreita, média e larga para professor, aluno e coordenação, e a barra de topo. A pessoa troca sob o mesmo caminho, com as duas mutações do `usuarioDaSessao`. A troca de rota. A14 negativa (`casca.spec:348`, `casca-no-celular:76`, `areas`). A15 e A16. A barra inerte (`casca.spec:398-408`, que olha a URL). Nome comprido, com reticências, `larguraExcedente` zero e "Sair" dentro da janela. Alvos de 44 px nos três papéis. A75 com a presa acima da barra em toda rolagem. A54 e A55. As negativas de `areas:191-193` e `meus-dados:271-272` e `:293-294` com controle positivo. A `BarraPresa` com o `MutationObserver` e o `disconnect` provados.

Não há `.skip` nem mock que esconda regra: o `matchMedia` e o `showModal` instalados no jsdom só suprem o que o jsdom não tem. Não há IA nem concorrência em jogo. Rodei os três testes de unidade (BarraDeBaixo, CascaDaEscola e Superficies): 31 verdes.

**Bloqueantes:**

1. **A pílula de 48 × 36 não tem teste nem bloco.** `apps/web/src/componentes/BarraDeBaixo.tsx:27` (`h-9 w-12`) é medida exigida na 13.1, e trocar `h-9 w-12` por qualquer outra coisa não deixa nada vermelho. O comentário de `apps/web/src/componentes/BarraDeBaixo.test.tsx:14` diz que "a pílula de 48 × 36" é medida em `e2e/casca-no-celular.spec.ts`, mas aquele spec nunca lê `[data-pilula]`.
   - Correção: medir a caixa da pílula no e2e (48 × 36) ou checar `h-9` e `w-12` no teste de unidade.
   - Acrescentar o bloco de mutação e corrigir o comentário.

2. **O e2e "o último botão termina acima da barra" não chega ao `<main>`.** Em `e2e/casca-no-celular.spec.ts:146-153` o botão mais baixo da tela é sempre o da `BarraPresa`, que é `sticky`. Ela é a última coisa do `<main>` em `Aprovar.tsx:339-355`, e no Tutor também (`Tutor.tsx:311`). A presa sobe pela própria `bottom-[var(--barra-baixo)]`. Mesmo tirando a presa da conta, o último item da lista fica acima da posição natural dela, ou seja, acima da barra. Resultado: trocar o `pb-[calc(var(--barra-baixo,0px)+2rem)]` de `CascaDaEscola.tsx` por `pb-8` deixa esse e2e verde. A cláusula só é presa pela string de classe no jsdom, que não prova reserva nenhuma no navegador.
   - Correção: a 360 px, numa tela sem `BarraPresa` e com conteúdo que role (`/professor/turmas` com turmas suficientes, ou `/aluno/minha-turma`), rolar até o fim e afirmar que o último controle que não é `sticky` termina em `≤ top` da barra.
   - Fazer o bloco do `pb-8` citar também esse e2e.

3. **Cláusulas novas sem bloco de mutação:**
   - `apps/web/src/estilos.css:305`, o `--barra-baixo: 0px` padrão. A divergência 2 da própria tarefa o justifica: a variável vale zero para a coordenação no celular, no trilho e no computador. Hoje o único teste que pega a mutação para `68px` é `pecas-superficies.spec:40` e `:46`, que esta tarefa não alterou e por isso não roda no portão da tarefa. O caso da coordenação (`casca-no-celular:203`) e o A20 (`casca.spec:518`) olham só o atributo, não a variável.
     - Correção: no caso da coordenação a 360 px e no A20 a 900 px, afirmar que `--barra-baixo` calculado é `0px` (ou o `padding-bottom` do `<main>` em 32 px).
     - Acrescentar o bloco.
   - `apps/web/src/componentes/BarraDeBaixo.tsx:78`, o `focus-visible:-outline-offset-3`, que é a divergência 3 desta tarefa. Já há asserção em `tokens.spec:255`; falta o bloco que a prove.
   - `apps/web/src/componentes/CascaDaEscola.tsx:303`, o `border-b-2 border-borda` da barra de topo (a borda de 2 px da D80, no lugar do `border-b border-linha`). Não tem asserção nem bloco.
     - Correção: checar a classe no caso da barra de topo de `CascaDaEscola.test.tsx:189`, sem a antiga, como `Superficies.test.tsx` faz com a presa.
     - Acrescentar o bloco.

**Recomendações:**
- O `describe` de `apps/web/src/componentes/CascaDaEscola.test.tsx:87` promete "com a escola da sessão", mas não há caso de troca de escola com o mesmo `usuarioId`. Ou o caso entra, ou o nome muda (a escola fica com o `areas › troca de escola…`).
- No celular, o A5 de `e2e/tokens.spec.ts:247-255` põe o foco no item com `.focus()`, e nenhum teste prova que o Tab chega à barra de baixo depois que a gaveta fecha. Vale um caminho por Tab do `<main>` até "Turmas".
- O `areas › segunda pessoa…` (`e2e/areas.spec.ts:421-461`) está na linha "recomeço", mas não afirma que a barra da professora sumiu para a coordenação. Faltam `secoes(page)` com `toHaveCount(0)` antes de abrir a gaveta e o `<html>` sem `data-barra-de-baixo`.
- O `inatividade.spec` está na tabela, mas não foi alterado, então não rodou no portão da tarefa, mesmo usando o `irPelaNavegacao` novo. Só a esteira vai dizer se ele passa.
- No A20, na rotação de 900 para 360 com a gaveta aberta (`casca.spec:530-532`), o `cenarios.md` diz que a gaveta perde `Seções`, e nada afirma isso.
- `e2e/casca.spec.ts:401`: o `if (turmas === null) return` é caminho morto depois do `expect`.
- As classes `rounded-controle hover:bg-fundo-suave` da marca e o `t-cartao` da escola (`CascaDaEscola.tsx:314` e `:317`) não têm asserção. São só aparência e ficam para o `/validar`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-15 22:42:32 · `tasks/prd-pele-e-casca/13_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As duas correções da 1ª rodada foram feitas.

1. **O anel de foco por dentro e a troca do Tab agora estão nos três documentos.**
   - `techspec.md` § Foco põe o item da barra de baixo entre os anéis de −3 px.
   - `docs/interface.md` 10.1, item 2, diz o mesmo.
   - `cenarios.md` A5 descreve a parada `:185` no celular: o Esc fecha a gaveta, o foco volta ao botão do menu, o Tab percorre o `<main>` até o item e o afastamento esperado é `-3px`.
   - `e2e/tokens.spec.ts` faz exatamente esse percurso por Tab, sem `.focus()` direto. O `tabAteOAnel` ganhou o parâmetro de afastamento.
   - A divergência do `13_task.md` aponta para os três lugares.

2. **O foco do teclado não fica mais escondido atrás da barra de baixo.**
   - `apps/web/src/estilos.css:315` traz `scroll-padding-bottom: var(--barra-baixo)` no `:root[data-barra-de-baixo]`.
   - A `BarraPresa` continua gravando o valor dela em linha e soma o quanto sobe, então o valor dela continua valendo por cima deste.
   - O e2e novo em `e2e/casca-no-celular.spec.ts` usa uma tela comprida sem barra presa ("Ferramentas" com 12 artefatos). Ele percorre por Tab 15 ou mais controles do `<main>` e exige que a tela tenha rolado, para a prova valer. Cada controle tem de terminar acima de `secoes(page)`. O teste também confere o anel de −3 px no item da barra.
   - A mutação que tira o `scroll-padding-bottom` está declarada contra esse teste.

O resto do diff da rodada só reforça o que a tarefa já fazia: a pílula de 48 × 36, a reserva em zero sem barra, a borda da barra de topo e o controle positivo do W12. Não entra em tarefa futura. As fotos refeitas (por exemplo `professora--professor-turmas--celular.png`) mostram a barra de baixo com os três itens de hoje e os nomes do glossário.

Recomendações:
- O `scroll-padding-top` da barra de topo foi para o `TODO.md` com destino em `/corrigir`. Convém abrir essa correção antes da X2, porque o mesmo furo do WCAG 2.4.11 continua no Shift+Tab.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/ordens/13_task-diff-r1-r2.patch
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.css
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/BarraPresa.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-no-celular.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/tokens.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/techspec.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/cenarios.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/docs/interface.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-15 22:43:06 · `tasks/prd-pele-e-casca/13_task.md`

VEREDITO: APROVADO

Cenários exigidos (desta rodada, as três correções da 1ª):
1. A pílula de 48 × 36, com teste e bloco de mutação.
2. A reserva do `<main>` provada numa tela sem `BarraPresa`, rolada até o fim.
3. Bloco de mutação e asserção para três cláusulas: o `--barra-baixo: 0px` padrão, o `focus-visible:-outline-offset-3` e o `border-b-2 border-borda` da barra de topo.

Também conferi a cláusula nova desta rodada, o `scroll-padding-bottom` em `apps/web/src/estilos.css`.

Cobertos:
1. **A pílula.** O teste de unidade (`BarraDeBaixo.test.tsx`, "a pílula que segura o ícone é de 48 × 36") checa `h-9`, `w-12` e `shrink-0` em cada item. O e2e (`casca-no-celular.spec.ts`) mede a caixa de `[data-pilula]` em `[48, 36]`. Há dois blocos de mutação (`h-8` e `w-10`), e o comentário do teste foi corrigido.
2. **A reserva do `<main>`.** O e2e "sem barra presa, rolada até o fim…" abre "Ferramentas" com 12 artefatos e confirma que a tela não tem barra presa (`[data-barra-presa]` existe em `BarraPresa.tsx:78`, então o `toHaveCount(0)` não passa à toa). Também exige que a tela role mais que 136 px. Depois de rolar até o fim, afirma que o último `[data-artefato]` termina em `≤ barra.y + 1`. O bloco do `pb-8` agora cita esse teste.
3. **As três cláusulas:**
   - (a) O `--barra-baixo: 0px` padrão é afirmado com `{ variavel: '0px', paddingDoMain: '32px' }` em dois lugares: no caso da coordenação a 360 px e no W12 a 900 px, cada um com seu bloco `68px`. O caso da professora também confere o `padding-bottom` de 100 px.
   - (b) O `-outline-offset-3` tem bloco, com o Tab chegando ao item da barra e a asserção de `afastamento: '-3px'` e `:focus-visible`.
   - (c) O `border-b-2 border-borda` é checado na barra de topo em `CascaDaEscola.test.tsx`, que também exige que as classes antigas `border-b` e `border-linha` não estejam lá. Tem dois blocos.
4. **O `scroll-padding-bottom`.** O teste do Tab na tela comprida exige que a tela tenha rolado para levar o foco, que o Tab passe por pelo menos 15 controles do `<main>`, e que cada um termine acima da barra. Tem bloco. Esse teste não depende de animação: com `prefers-reduced-motion`, o `estilos.css:529` força `scroll-behavior: auto`, e a rolagem não é suave.
5. **As recomendações aplicadas.** O `describe` foi renomeado, o A5 agora chega à barra por Tab (`tokens.spec`), o `areas.spec` afirma que a barra sumiu na troca de pessoa, o A20 tem o positivo e o negativo da gaveta, e o `return` morto saiu.
6. Rodei `BarraDeBaixo.test.tsx` e `CascaDaEscola.test.tsx`: 19 de 19 verdes. Os nomes de teste citados nos blocos novos batem com os títulos que existem nos specs.

Bloqueantes: nenhum.

Recomendações:
- `e2e/casca-no-celular.spec.ts`, teste do foco na tela comprida: ele prova só a borda de baixo. Quando entrar a correção do `scroll-padding-top` (está no `TODO.md`), o mesmo laço pode afirmar também que `top >= 56` no Shift+Tab, em vez de criar um e2e à parte.
- A prova do anel de −3 px saiu do `tokens.spec` e foi para o `casca-no-celular.spec`, porque o runner de mutação só roda o projeto `chromebook`. Vale registrar isso no `/retro` como limite do `mutacoes.ts`: qualquer cláusula que só existe no celular precisa de teste num spec que já roda a 360 px dentro do projeto `chromebook`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/.processo/ordens/13_task-diff-r1-r2.patch`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-no-celular.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/BarraDeBaixo.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaDaEscola.test.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/tasks/prd-pele-e-casca/13_task.md`

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-15 22:43:37 · `tasks/prd-pele-e-casca/13_task.md`

VEREDITO: APROVADO
Tela vista: sim (14 fotos lidas, escola cheia e vazia: professora `/professor/turmas`, aluno `/aluno/tutor` e coordenação `/coordenacao/estrutura`, a 1366 px e a 360 px)
Estados: ok. A tela vazia convida ("Nenhuma atividade para pedir ajuda agora… Quando houver uma, ela aparece aqui"). Carregando e erro vêm da casca e do e2e, não da vitrine.
Acessibilidade: ok. O diff acrescenta `scroll-padding-bottom: var(--barra-baixo)` em `:root[data-barra-de-baixo]` (`apps/web/src/estilos.css:315`). Revi o que isso muda:
- A rolagem da página é a do documento (`min-h-screen` na casca, sem contêiner interno), então a regra no `<html>` vale para o foco.
- A `BarraPresa` grava o `scrollPaddingBottom` em linha no bloco que rola, somando a altura dela ao quanto sobe (`BarraPresa.tsx:57-65`). O valor em linha sobrepõe o do CSS e volta a ele ao desmontar, e um `MutationObserver` reage ao atributo, então não há duas reservas brigando.
- O anel do item da barra de baixo é por dentro (−3 px) e provado por Tab em `tokens.spec.ts` e em `casca-no-celular.spec.ts`.
- O teste novo percorre o `<main>` por Tab numa tela de 12 artefatos, sem `BarraPresa`. Exige que cada controle termine acima da barra e que a tela tenha rolado, e a mutação do `scroll-padding` é declarada contra ele.
Chromebook fraco: ok. A mudança é uma propriedade de CSS, sem JS novo, sem transparência e sem animação.
Celular:
- A 360 px não há rolagem horizontal nem texto cortado fora de reticências intencionais (o nome da escola na barra de topo).
- A barra de baixo tem 68 px, com itens de 120 × 68 px, o "Sair" e o menu de 44 px, e a pílula de 48 × 36 medida no e2e.
- O `<main>` guarda 100 px embaixo (68 + 32) e zero na coordenação e de 768 px para cima, com teste dos dois lados.
- Nada depende de hover.
Ação oficial protegida: sim. A tarefa não toca ação oficial, e a `BarraPresa` do Aprovar continua com o `oficial` e o contador, agora acima da barra de baixo.

Bloqueantes: nenhum.

As fotos não mostram a gaveta aberta no celular nem a `BarraPresa` acima da barra de baixo, como o prompt já avisava. Elas valem pelo código e pelos specs de e2e. Nada nas fotos contradiz o código da árvore.

Recomendações (nenhuma bloqueia, todas já no `TODO.md` ou em "Recomendações sem aplicar"):
- `apps/web/src/componentes/CascaDaEscola.tsx:303`: a barra de topo `sticky top-0` de 56 px não tem `scroll-padding-top`, então no Shift+Tab o foco pode parar atrás dela (WCAG 2.4.11). Já existia antes da 13.0. O mesmo laço do teste novo pode afirmar `top >= 56` quando a correção própria entrar.
- `coordenacao--coordenacao-estrutura--computador-1.png` e `vazia--…--computador-1.png`: a 1366 × 768 a lateral da coordenação corta "PRIVACIDADE" ao meio, porque o pé de 240 px toma a altura. A lista rola, então o item é alcançável. É da 12.0 e vai para a X2.
- Os fios do `mutacoes.ts` só rodam o projeto `chromebook`. Vale registrar no `/retro` que cláusula que só existe a 360 px precisa de teste num spec que já fixe essa largura, como o `casca-no-celular.spec.ts` faz.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/estilos.css`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/BarraDeBaixo.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/BarraPresa.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/apps/web/src/componentes/CascaDaEscola.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specpele-e-casca--l1/e2e/casca-no-celular.spec.ts`
