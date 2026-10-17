# Achados das revisões — `tasks/correcoes/2026-10-17-painel-e-pedido-rolam-a-pagina.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 18:14:59 · `tasks/correcoes/2026-10-17-painel-e-pedido-rolam-a-pagina.md`

VEREDITO: APROVADO
Tela vista: sim (8 fotos lidas: Painel e lista de pedidos, cheia e vazia, em 1366 e 360 px). O detalhe do pedido e o Painel com a faixa de incidente não têm foto, porque a vitrine não os produz. Esses dois casos foram revistos pelo código e pelo e2e.
Estados: ok. A correção não mexe em carregando, erro, vazio nem com dado. As fotos mostram o Painel com dado e o vazio ("Nenhuma função da IA trabalhou neste mês", "Tudo em dia", "A escola está montada") e a lista de pedidos vazia convidando a registrar.
Acessibilidade: ok.
- O miolo do Painel é uma `section` com nome ("O Painel da escola") e `tabIndex 0` a partir de 768 px (`Painel.tsx:44`). Segue o padrão da Analista (`Analista.tsx:84`), então o teclado rola o miolo.
- No detalhe do pedido, o `outline-none` só vale sem o miolo (`DetalheDoPedido.tsx:173`), então o foco aparece quando o miolo tem foco.
- Os testes `Painel.test.tsx` e `DetalheDoPedido.test.tsx` conferem o `tabindex` a 1366 e a 360 px. Rodei os dois arquivos: 43 de 43 passam.

Chromebook fraco: ok.
- A 1366 × 768 só o miolo rola. O Painel desconta a faixa de incidente por `--faixa-de-incidente`, e o detalhe do pedido também.
- Não rodei o e2e (precisa de infra). Confio no relato de 60 de 60 da correção e na conta do `miolo-que-rola.ts`.
- As fotos confirmam que o Painel, sem a faixa, não rola, nem cheio nem vazio.

Celular: ok.
- Em 360 px não há rolagem horizontal, e o `matchMedia` desliga o miolo e o foco abaixo de 768 px.
- Os botões "VER EM REGISTROS", "REGISTRAR PEDIDO" e "IR PARA AS TURMAS" têm altura de 44 px ou mais. As abas e a barra inferior também.
- Nas fotos de celular, a barra inferior cobre parte do conteúdo. É efeito da captura de página inteira com barra fixa, não defeito.

Ação oficial protegida: sim. A correção só muda altura e foco, e as ações do detalhe (`AcoesDoPedido`) continuam fora do miolo, no cabeçalho da `Tela`.
Bloqueantes: nenhum.
Recomendações:
- O miolo do detalhe do pedido (`DetalheDoPedido.tsx:173`) é um `div` focável sem nome, então o leitor de tela não o anuncia. Um `role="region"` com `aria-label` (por exemplo "Pedido do titular") resolveria. Isso também simplificaria o seletor `div[tabindex="0"]` do e2e (`e2e/incidentes.spec.ts`).
- Dentro do miolo do Painel ainda existem as duas listas com rolagem própria e `tabIndex 0` (`Painel.tsx:65-69`). Com a janela baixa há rolagem dentro de rolagem, e o teclado para duas vezes. Vale reavaliar no `/retro`, já que o miolo agora resolve a altura.
- A primeira mutação do Painel (sem a classe do miolo) é provada pelo e2e com a janela a 600 px. O vermelho contra o código antigo do Painel não foi reproduzido, como a própria tarefa admite. É aceitável porque a mutação cobre o caso.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/miolo-que-rola.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/incidentes.spec.ts`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-17 18:15:10 · `tasks/correcoes/2026-10-17-painel-e-pedido-rolam-a-pagina.md`

**VEREDITO: REPROVADO**

**Escopo:** respeitado. A correção trata só C1 e C2 da validação. Não mexe em C3 nem em outra tarefa.

**Aderência à Tech Spec:** diverge na seção "Altura" (`tasks/prd-telas-da-coordenacao/techspec.md:110`). O miolo do detalhe do pedido entra no ciclo do Tab sem ser uma região com nome.

**Portão local:** carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

**Bloqueantes:**

1. O miolo do detalhe do pedido é um `<div>` sem papel e sem nome que recebe Tab.
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx:173`.
   - **O que está errado:** a partir de 768 px esse `<div>` ganha `tabIndex 0`, mas não tem papel nem nome. A Tech Spec diz: "A partir de 768 px só o miolo rola, numa região com nome e `tabIndex={0}`". Os outros quatro miolos seguem isso:
     - `Analista.tsx:84`: `section aria-label="Resumo do Analista"`
     - `Agentes.tsx:166`: `section aria-label="O que cada função da IA faz"`
     - `ListaDaTurma.tsx:211`: `section aria-labelledby="titulo-da-turma"`
     - `Painel.tsx:44`, nesta mesma correção: `section aria-label="O Painel da escola"`

     Só o detalhe ficou de fora. Quem usa leitor de tela cai num ponto de foco que não diz o que é. A divergência não está na Tech Spec nem no documento da correção.

     Os testes mostram o desvio, porque não acham o miolo pelo nome:
     - `e2e/incidentes.spec.ts:686` usa `locator('div[tabindex="0"]').filter(...)`;
     - `DetalheDoPedido.test.tsx:111` usa `.closest('[tabindex]')`.
   - **Correção exigida:**
     - Trocar o `<div>` por uma `section` com nome próprio, sem repetir o "O pedido" do cartão de dentro. Mantém o `ref` e o `tabIndex -1` abaixo de 768 px, que é o foco de reserva.
     - Nos dois testes, achar o miolo por `getByRole('region', { name: … })`.
     - Ajustar as mutações 3 a 5 do documento da correção à linha nova.

**Recomendações:**
- `miolo-que-rola.ts` diz quem usa cada constante e ficou desatualizado. O comentário de `O_MIOLO_QUE_ROLA` cita "molduras Escola e Registros e a lista da turma" e não cita o detalhe do pedido. O de `O_MIOLO_SEM_ABAS_QUE_ROLA` cita só a Analista e não cita o Painel.
- O comentário de `LISTA_QUE_ROLA` (`Painel.tsx:64`) atribui às listas o "a página não rola (RF23)". Quem garante isso agora é o miolo. As listas só limitam a própria altura dentro dele.
- O documento da correção admite que o vermelho do caso do Painel nunca foi medido contra o código antigo, com a página rolando 97 px. A mutação 1 cobre a falta, mas vale rodar uma vez e registrar o número no documento, como foi feito para o detalhe (88 e 186 px).

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 18:15:37 · `tasks/correcoes/2026-10-17-painel-e-pedido-rolam-a-pagina.md`

VEREDITO: REPROVADO

Cenários exigidos:
- C1: o Painel não deixa a página rolar com a faixa do aviso adiado, a 1366 × 768 e numa janela baixa, onde o conteúdo passa da altura do miolo.
- C2: o detalhe do pedido não deixa a página rolar, com a faixa e sem ela, no estado mais curto (pedido "recebido", sem arquivo).
- O miolo recebe foco pelo teclado a partir de 768 px e não recebe abaixo disso (no Painel e no detalhe).
- Com o miolo, o foco do teclado aparece no detalhe, porque o `outline-none` agora só vale sem ele.
- No celular, a página rola e nada passa da largura.
- Permissão e isolamento: não se aplicam. A correção é só de layout e não toca escopo, leitura nem dado novo.

Cobertos:
- C1: `e2e/incidentes.spec.ts` (o caso do Painel). Mede `paginaNaoRola` a 768 px, baixa a janela a 600 px, prova `scrollHeight > clientHeight` no miolo e mede de novo. A mutação 1 tira a classe do miolo, que é o código antigo, e cobre o vermelho que não foi visto antes da correção. A mutação 2 cobre `tabindex 0`.
- C2 com a faixa: o caso do detalhe em `incidentes.spec.ts` (vermelho 186, mutações 3 e 5).
- C2 sem a faixa: `e2e/pedido-do-titular.spec.ts:140` (vermelho 88, mutação 4).
- O foco a 1366 px e a falta dele a 360 px: os novos casos de `Painel.test.tsx` e `DetalheDoPedido.test.tsx`. Os dois arquivos passam (43 de 43).
- O celular: `paginaNaoRola` confere a largura, e `toHaveCount(0)` confere o miolo do detalhe.
- Não há `.skip`. O `matchMedia` falso só faz o que o `jsdom` não faz e não esconde a regra.

Bloqueantes:
- `apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx:173`: a cláusula nova `${comMiolo ? '' : ' outline-none'}` não tem bloco de mutação nem teste.
  - O documento a declara como parte da correção ("o `outline-none` só vale sem ele, para o foco do teclado aparecer").
  - Se ela voltar a ser ` outline-none` sempre, nenhum teste fica vermelho. O miolo continua com `tabIndex 0` e alcançável pelo teclado, mas sem anel de foco.
  - Correção exigida: no caso do detalhe em `e2e/incidentes.spec.ts`, a partir de 768 px e sem toque, levar o foco ao miolo pelo teclado. Pode ser com `Tab` a partir de "Voltar para Pedidos", porque `.focus()` por código pode não casar com `:focus-visible`. Depois, conferir `expect(await focoVisivel(page)).toBe(true)`.
  - Acrescentar o bloco: `- ...${comMiolo ? '' : ' outline-none'}` → `+ ... outline-none` (sempre), apontando para esse caso.

Recomendações:
- Nos dois e2e novos, provar a rolagem pelo teclado como faz `e2e/lista-da-turma.spec.ts:693`: `miolo.focus()`, `End`, `scrollTop > 0` e `paginaNaoRola` de novo. Hoje o `tabindex 0` é conferido, mas não que o teclado role o miolo.
- Conferir `focoVisivel` também no miolo do Painel (a `section`), mesmo sem `outline-none` nela, para travar o anel contra regressão.
- O detalhe só é medido no estado mais curto. Um estado longo, com o arquivo pronto ou com o compartilhamento preenchido, mostraria que o miolo segura a tela no pior caso, e não só no menor.
- Nos testes de unidade, `className` contendo `overflow-y-auto` é só a string. Quem prova a medida é o e2e, e o próprio `miolo-que-rola.ts` já diz isso. Vale não contar esse trecho como prova.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/correcoes/2026-10-17-painel-e-pedido-rolam-a-pagina.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Painel.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/incidentes.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/pedido-do-titular.spec.ts

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-17 18:37:17 · `tasks/correcoes/2026-10-17-painel-e-pedido-rolam-a-pagina.md`

VEREDITO: APROVADO
Tela vista: sim (4 fotos lidas: Painel no computador e no celular, escola cheia e vazia). O detalhe do pedido de titular e o Painel com a faixa de incidente adiada não têm foto, e os revisei pelo código e pelo e2e.
Estados: ok. Nesta rodada só mudaram o contêiner e o foco do miolo. Carregando, erro, vazio e com dado ficaram como estavam. As duas fotos do Painel mostram o estado vazio como convite: "Tudo em dia" e "A escola está montada", com a instrução do próximo passo.
Acessibilidade: ok. As duas correções desta rodada melhoram o item 6.
- O miolo do detalhe do pedido virou `<section aria-label="Tudo sobre este pedido">` (`DetalheDoPedido.tsx:78`). Isso aplica a recomendação da rodada anterior (o `div` sem nome).
- O miolo recebe `tabIndex 0` a partir de 768 px. O `outline-none` só vale sem o miolo, então o anel de foco aparece. O e2e confere isso com `focoVisivel` e rola com `End`.
- O Painel segue o mesmo padrão: `Painel.tsx:44`, região "O Painel da escola" com `tabIndex 0` só quando `comMiolo`.
Chromebook fraco: ok. A página não rola a 1366 × 768, como mostra a foto do Painel. Quem rola é o miolo, com `max-h` calculado pela janela e pela faixa de incidente. Não há custo de CPU novo.
Celular: ok. O Painel a 360 px, cheia e vazia, não tem rolagem horizontal nem texto cortado.
- Os botões "Ver em registros" e "Sair" e a navegação inferior têm alvo de toque adequado.
- A barra de abas aparece no meio da foto só porque a captura é de página inteira com barra fixa. Não é defeito.
- Abaixo de 768 px o miolo não existe e rola a página, com `tabIndex -1`, sem anel de foco. O e2e confere `tabindex="-1"` nesse caso.
Ação oficial protegida: sim. A tarefa não toca ação oficial. É só layout e foco, e nenhuma ação oficial foi alterada.
Bloqueantes: nenhum.
Recomendações:
- `Painel.tsx:69`: as listas internas ainda têm `tabIndex 0` e rolagem própria dentro do miolo. Com a janela baixa há rolagem dentro de rolagem e o teclado para duas vezes. O documento da correção já registra isso para o `/retro`.
- O detalhe do pedido só é medido no estado mais curto. Falta um caso longo, com arquivo pronto e compartilhamento preenchido, que já está no `TODO.md`.
- Falta uma foto do detalhe do pedido na vitrine, e não existe fixture com pedido registrado. Vale criá-la para que as próximas rodadas vejam essa tela.
- O texto "Painel não lê, porque cada leitura fica na auditoria" está correto, mas denso para a coordenadora. Dá para encurtar.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-17 18:37:27 · `tasks/correcoes/2026-10-17-painel-e-pedido-rolam-a-pagina.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. O miolo do detalhe do pedido agora é uma região com nome e com `tabIndex={0}` a partir de 768 px, como a Tech Spec pede.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade e alvo).

Bloqueantes: nenhum.

A correção exigida na 1ª rodada foi feita:
- **O miolo virou região com nome.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx:173`, o miolo é uma `section` com `aria-label="Tudo sobre este pedido"`. O nome não repete o "O pedido" do cartão de dentro, que continua único com `exact: true` em `e2e/pedido-do-titular.spec.ts:56` e em `e2e/pedidos-do-titular.spec.ts:788`.
- **O foco de reserva continua igual.** O `ref` virou `HTMLElement`, o `tabIndex` é -1 abaixo de 768 px e o `outline-none` só vale sem o miolo.
- **Os dois testes acham o miolo pela região.** O de unidade usa `getByRole('region', { name: 'Tudo sobre este pedido' })` em `DetalheDoPedido.test.tsx:111`, e o e2e faz o mesmo em `e2e/incidentes.spec.ts:693`.
- **O e2e confere o teclado no miolo.** A partir de 768 px ele verifica que o miolo pode receber foco com o anel visível, que rola com `End` e que a página não rola.
- **As mutações 3 a 5 seguem a linha nova.** Elas foram reescritas para a `section`, e entrou uma mutação nova para o `outline-none`.

Recomendações:
- O motivo dado para recusar a recomendação de medir o vermelho do Painel contra o código antigo é aceitável, porque a mutação 1 cobre a regra. Mesmo assim, registrar o número uma vez, como foi feito para o detalhe (88 e 186 px), deixaria a prova completa. Não bloqueia.
- O documento manda para o `TODO.md` duas recomendações recusadas: a rolagem dentro de rolagem das listas do Painel e a fixture de pedido no estado longo. Esta árvore não altera o `TODO.md`, então confirme que as duas entradas entram antes do commit.

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 18:37:48 · `tasks/correcoes/2026-10-17-painel-e-pedido-rolam-a-pagina.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- A partir de 768 px, o miolo do detalhe do pedido e o do Painel rolam por dentro, e a página continua parada mesmo com a faixa de incidente adiada.
- O teclado alcança cada miolo, o anel de foco aparece e a tecla `End` rola o miolo.
- Abaixo de 768 px não há miolo: `tabIndex -1` e a página rola.
- A troca do `div` sem papel pela `section` "Tudo sobre este pedido" não quebra o localizador dos testes que já existiam.

**Cobertos:**
- **A correção exigida na 1ª rodada foi feita.**
  - O caso do detalhe em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/incidentes.spec.ts:694-707` agora leva o foco ao miolo pelo teclado (`Shift` e depois `focus()`), confere `focoVisivel(page)`, rola com `End` até `scrollTop > 0` e repete `paginaNaoRola`.
  - O `focoVisivel` (`e2e/__fixtures__/verificacoes.ts:113-124`) exige `:focus-visible` e um contorno sólido de 3 px na cor de foco. Com `outline-none` sempre, o contorno fica `none` e o teste fica vermelho, ou seja, ele chega à cláusula.
  - O bloco de mutação novo (`... ${O_MIOLO_QUE_ROLA} outline-none`) existe no documento e aponta para esse caso.
  - A ordem aceitava `Tab` a partir de "Voltar para Pedidos" ou outro caminho. A tecla antes do `focus()` resolve o mesmo problema do `:focus-visible` depois de um clique, e o comentário no teste explica o motivo.
- **Painel:** o mesmo trio (foco visível, `End` e `scrollTop`) está em `e2e/incidentes.spec.ts:662-668`.
- **Localizadores:** os dois testes que usavam o `div` passaram a usar `getByRole('region', { name: 'Tudo sobre este pedido' })`, o de unidade (`DetalheDoPedido.test.tsx:111`) e o e2e (`incidentes.spec.ts:693`). Não sobrou nenhum `div[tabindex]` apontando para o detalhe do pedido.
- **Blocos de mutação:** os três que já existiam foram atualizados para a linha nova com `section`, e a cláusula de cada um continua a mesma.
- **Unidade:** rodei `DetalheDoPedido.test.tsx` e `Painel.test.tsx`, 43 de 43 verdes.
- Não há `.skip`, teste comentado nem mock que esconda a regra.
- Isolamento, concorrência e IA não se aplicam: a correção é só de layout e foco, sem dado novo.

**Bloqueantes:** nenhum.

**Recomendações:**
- No teste de unidade `DetalheDoPedido.test.tsx:106-119`, vale conferir também que a 1366 px o `className` não contém `outline-none` e que a 360 px contém. Custa uma linha e avisa antes do e2e. Não bloqueia, porque o e2e já prova a cláusula.
- O truque de apertar `Shift` antes do `focus()` funciona por um comportamento do Chromium. Se o projeto um dia rodar em WebKit ou Firefox, apertar `Tab` a partir de "Voltar para Pedidos", como a ordem sugeria, é o caminho mais portátil. Vale registrar no `/retro`, junto do mesmo padrão no caso do Painel.
