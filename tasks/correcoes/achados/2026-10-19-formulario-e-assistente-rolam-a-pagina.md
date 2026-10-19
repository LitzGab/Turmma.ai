# Achados das revisões — `tasks/correcoes/2026-10-19-formulario-e-assistente-rolam-a-pagina.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-19 17:06:42 · `tasks/correcoes/2026-10-19-formulario-e-assistente-rolam-a-pagina.md`

VEREDITO: APROVADO

Tela vista: sim. Li as 12 fotos (computador e celular, escola cheia e vazia): Adaptação cheia e vazia, Atividade objetiva e Plano de aula cheias, "O que o Assistente fez" cheia e vazia. As fotos da escola cheia mostram poucas entregas, então o caso das seis entregas só o e2e cobre. Não li a altura medida do e2e de seis entregas; li o código e o teste.

Estados: ok. Carregando e erro não aparecem na vitrine e não mudaram: a correção só mexe na casca de rolagem. O estado vazio da Adaptação ("Ainda não há atividade para adaptar", com o botão "Gerar uma atividade") e o do Assistente (explica o que ele faz e oferece "Pedir ao Assistente" e "Ver as ferramentas") convidam e dizem o próximo passo.

Acessibilidade: ok.
- O painel das abas do Assistente já tem `tabIndex={0}` (`apps/web/src/componentes/Abas.tsx:92`).
- O miolo do formulário só tem controles dentro, e o foco leva a rolagem até o botão.
- Nenhum texto mudou.

Chromebook fraco: ok. O mecanismo é o mesmo já aprovado no documento do professor (CSS mais uma medida do topo). `useTopoDoMiolo` mede só na montagem e em `ResizeObserver` e `resize`, e limpa tudo ao sair. Não há custo de CPU novo.

Celular: ok.
- Abaixo de 768 px as classes de altura só existem com `md:`, e o teste de componente prova isso.
- Nas fotos de 360 px não há rolagem horizontal nem corte.
- O botão principal ("Gerar versão adaptada", "Gerar atividade", "Gerar plano de aula") tem altura de 44 px ou mais.
- O e2e roda nos dois projetos e, no `celular`, mede só a rolagem de lado.

Ação oficial protegida: sim. Aprovar e Rejeitar continuam como estavam, e o texto da tela também. Só o botão "Ver mais entregas" mudou de lugar.

Bloqueantes: nenhum.

Recomendações:
1. Adaptação a 1366 × 768: o miolo termina em 727 px, colado ao botão "Gerar versão adaptada". A borda de baixo do cartão fica cortada, sem pista visual de que há 14 px para rolar (`professora--professor-ferramentas-adaptacao--computador.png`; `apps/web/src/areas/professor/Ferramenta.tsx:45`). Um respiro embaixo do miolo, como `md:pb-1`, deixaria a borda à vista. O e2e já garante que o botão chega inteiro à vista.
2. Faixa "Esperando você" aberta com muitas pendências: ela é `sticky` e cresce, e a altura do painel (`max-h` com `calc`) pode chegar a zero. Aí a página volta a rolar. O e2e só cobre três entregas (`apps/web/src/areas/professor/Time.tsx:299`). Vale um teto de altura com rolagem própria na lista da faixa.
3. `apps/web/src/areas/professor/Time.tsx:302`: o `<div ref={topoDoPainel}>` e o `<Abas>` dentro dele estão sem indentação, o que o formatador vai reclamar.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-19 17:06:51 · `tasks/correcoes/2026-10-19-formulario-e-assistente-rolam-a-pagina.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O documento da correção pedia o miolo que rola por dentro em duas telas, e só nelas: o formulário da Adaptação e "O que o Assistente fez". O código faz isso. Hoje e Alunos, as outras duas telas do achado C4, ficaram de fora, como o documento diz. As duas telas seguem o padrão que o C4 da `validacao.md` manda copiar, o do documento, com a altura medida pelo `miolo-do-documento.ts`. Isso cumpre o RF22 ("cabe em 1366 × 768") e não muda a arquitetura. A spec não tem `cenarios.md`. Nas fotos, abaixo de 768 px a página continua rolando inteira e o estado vazio está igual ao de antes. Não há texto novo na tela nem algo que a tarefa não pediu.

Recomendações:
1. **Painel que pode sumir.** Em `apps/web/src/areas/professor/Time.tsx:302-304`, a 1366 × 768, abrir ao mesmo tempo "O que cada função faz sozinha" (`Time.tsx:184`) e a faixa com várias entregas esperando pode levar o `max-h` do painel a perto de zero. A conversa some até a professora fechar um dos dois. Antes da correção isso não acontecia, porque a página rolava. Vale pôr uma altura mínima do `md` para cima, por exemplo `md:min-h-48`, ou um caso no e2e com as duas partes abertas. Isso é da área do `frontend-reviewer`.
2. **Código duplicado.** Em `apps/web/src/areas/professor/miolo-do-documento.ts:55-74`, o `useTopoDoMiolo` repete quase todo o corpo do `useTopoDoPainel` (medir, `ResizeObserver`, `resize`, limpeza). Muda só o elemento que é medido. Dá para tirar um ajudante comum que recebe o elemento a medir.
3. **Recuo.** Em `apps/web/src/areas/professor/Time.tsx:302-370`, o `<Abas>` e os filhos dele não ganharam recuo dentro da nova `<div ref={topoDoPainel}>`, e a leitura confunde onde a caixa fecha.
4. **Comentário e classe que já não valem.** Em `apps/web/src/areas/professor/Time.tsx:274-275`, o comentário diz que a faixa fica "presa no alto enquanto a conversa rola … no alto no computador". Do `md` para cima a página não rola mais, e `md:top-0` ficou sem efeito. Atualize o comentário ou tire a classe.
5. **Tech Spec.** A seção "(8) A página não rola, rola a mesa" (`tasks/prd-telas-do-professor/techspec.md:211-213`) ainda fala só do documento. Uma linha dizendo que o formulário de ferramenta e "O que o Assistente fez" usam o mesmo miolo, e que o "Ver mais entregas" fica dentro do painel, deixa a spec em dia com o código.

## test-engineer · 1ª rodada · APROVADO · 2026-10-19 17:07:37 · `tasks/correcoes/2026-10-19-formulario-e-assistente-rolam-a-pagina.md`

VEREDITO: APROVADO

Cenários exigidos:
- **Caminho feliz:** a 1366 × 768, com o conteúdo cheio, a página não rola. Só o miolo rola por dentro, e o que fica acima dele não se move.
- **Conteúdo que muda de altura acima do miolo:** a faixa "Esperando você" aberta, um título ou uma descrição mais longos, e a troca de ferramenta sem remontar o `Formulario`.
- **"Ver mais entregas":** fica dentro do miolo e continua alcançável.
- **Abaixo de 768 px:** nada muda, a página rola inteira e não sobra largura.
- **A medida do topo:** é gravada no elemento certo e sai quando a tela fecha.
- **Botão de gerar:** chega à vista em todas as ferramentas.
- **Permissão, isolamento, concorrência e IA:** não se aplicam, porque a correção mexe só no contêiner de rolagem, sem dado, sem regra e sem rede.

Cobertos:
- **e2e de entregas** (`e2e/professor-entregas.spec.ts`, caso novo): seis entregas com `paginaNaoRola` e um painel com `scrollHeight > clientHeight`. A faixa e as abas ficam com o mesmo `y` depois de rolar até o fim, e as caixas são afirmadas como não nulas antes. A última entrega termina dentro do painel e o painel termina dentro da janela. Abrir a lista da faixa continua sem rolar a página, e isso exercita a segunda medida do `useTopoDoPainel`. No `celular`, o caso confere só a largura.
- **e2e de ferramentas** (`e2e/professor-ferramentas.spec.ts`, caso novo): as três ferramentas, a Adaptação primeiro, em navegação do lado do cliente, ou seja, na mesma instância do `Formulario`. O caso confere `paginaNaoRola`, o título parado com o miolo rolado e `toBeInViewport({ ratio: 1 })` no botão de gerar.
- **`Time.test.tsx`:** as classes do miolo só com `md:`, a faixa e a `tablist` fora do painel, e o "Ver mais" dentro. A variável fica na caixa acima do painel (`0px`) e é retirada no `cleanup`. O botão some quando não há próxima página.
- **`Ferramenta.test.tsx`,** com `it.each` nas três ferramentas: o cartão e "Como vai sair" dentro do miolo, o `h1` e o "Voltar" fora. Confere as classes só com `md:`, a variável gravada no próprio miolo e retirada ao sair.
- **Mutações contra o diff:** as seis declaradas alcançam as cláusulas novas.
  - No `Ferramenta.tsx`, a classe do miolo e a `ref`. Tirar a `ref` também derruba o `medir()` inicial, porque no jsdom não há `ResizeObserver`.
  - No `miolo-do-documento.ts`, o `removeProperty`.
  - No `Time.tsx`, o `classeDoPainel`, a `ref` da caixa das abas e o "Ver mais" dentro das `Abas`.
  - O argumento `todas.length > 0` corresponde exatamente à condição que monta a caixa (`Time.tsx:271`). Tirar a `ref` deixa vermelho o caso 2 do `Time.test.tsx`.
- **Execução:** rodei `npx vitest run` nos dois arquivos de componente e passaram 17 de 17. Não há `.skip`, mock que esconda a regra nem provedor de IA.

Bloqueantes: nenhum

Recomendações:
1. **Remedida do `useTopoDoMiolo` sem bloco** (`apps/web/src/areas/professor/miolo-do-documento.ts:64-66`). O `ResizeObserver` e o `resize` são código novo, e nenhum bloco separa a segunda medida da primeira. A 6.0 tratou isso como recomendação no `useTopoDoPainel` (`achados/6_task.md:304`), e mantenho o mesmo critério.
   - O `resize` dá para provar no jsdom: troque o `getBoundingClientRect` do miolo por um que devolva `top: 120` e dispare `window.dispatchEvent(new Event('resize'))`. O caso espera `'120px'`, e o bloco tira o `addEventListener`.
   - O `ResizeObserver` sustenta a troca de ferramenta na mesma instância, porque o efeito tem dependências `[]` e não roda de novo. Hoje só o laço do e2e passa por esse caminho, e só se a descrição mudar a altura do cabeçalho.
2. **Formulário com mais conteúdo** (`e2e/professor-ferramentas.spec.ts`, caso novo). O caso só mede o formulário em branco. Vale um `paginaNaoRola` depois de gerar sem preencher, com as mensagens de erro na tela, e com o resultado da geração aparecendo no cartão. São os dois estados em que o miolo mais cresce.
3. **"Ver" da faixa com a rolagem dentro do painel** (`Time.tsx:115-117`). O `scrollIntoView` agora acontece dentro do painel, e o `scroll-mt-48` do cartão (`Time.tsx:319`) foi pensado para a rolagem da página. Vale uma linha no caso novo de entregas: acionar "Ver" de uma entrega pendente e conferir `toBeInViewport()` do cartão dentro do painel, a 1366 × 768.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/correcoes/2026-10-19-formulario-e-assistente-rolam-a-pagina.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/miolo-do-documento.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramenta.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramenta.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Time.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Time.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-entregas.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/e2e/professor-ferramentas.spec.ts

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-19 17:19:41 · `tasks/correcoes/2026-10-19-formulario-e-assistente-rolam-a-pagina.md`

VEREDITO: APROVADO
Tela vista: sim (14 fotos lidas, escola cheia e vazia: adaptação, atividade objetiva, plano de aula e assistente, em 1366 px e 360 px, mais o diff da rodada). Nenhuma das fotos de computador foi refeita com a página rolada: ver Recomendações.
Estados: ok. Carregando e erro não aparecem na vitrine, e eu não os reconferi no código. Esta rodada só mexeu em casca de rolagem, recuo e comentário. A escola vazia mostra convites ("Ainda não há atividade para adaptar" com "Gerar uma atividade", e "O que o Assistente de ensino faz por você" com "Pedir ao Assistente" e "Ver as ferramentas"). A escola cheia mostra o feed com a faixa "Esperando você".
Acessibilidade: sem regressão no diff. O foco, o rótulo dos campos e o texto só para leitor de tela ("Aprovar<span sr-only>") ficaram como estavam. O `<div ref={topoDoPainel}>` e o `md:pb-1` não mudam a ordem de foco.
Chromebook fraco: sem novidade. A medida do topo roda só no `resize` e no `ResizeObserver` da tela, e os dois são desligados ao sair (`miolo-do-documento.ts:55-74`). Isso cabe em máquina fraca. A página não rola a partir de 768 px, como o PRD pede. Nenhuma tela passa da janela a 1366 × 768.
Celular: sem rolagem horizontal a 360 px. Nas fotos de celular a barra de baixo aparece no meio da imagem, mas é efeito da foto de página inteira com a barra presa, e não defeito. Os botões "Gerar versão adaptada", "Aprovar" e "Ver" têm altura de ação principal. Abaixo de 768 px a página rola inteira, como antes.
Ação oficial protegida: sim. "Aprovar" e "Rejeitar…" continuam abrindo o diálogo de revisão (`abrir(entrega, …)`), e o diff não tocou nisso. Cada balão traz a marca "IA" e a aprovação humana à vista.
Bloqueantes: nenhum.
- A correção da 1ª rodada, feita só em recomendações, está presente.
- `md:pb-1` está em `Ferramenta.tsx:46`, com `toContain('md:pb-1')` no teste.
- O comentário e o `top-0` da faixa "Esperando você" foram corrigidos em `Time.tsx:274-275`: a faixa ficou só com `sticky top-14`, e o comentário explica por quê.
- O recuo do `<Abas>` não mudou nenhum comportamento.
- O caso novo de teste do `resize` e do `ResizeObserver` do `useTopoDoMiolo` cobre a medida na janela, a medida na tela por cima e o desligamento ao sair. Ele tem quatro blocos de mutação, um para cada cláusula.

Recomendações:
- Adaptação a 1366 × 768 (`professora--professor-ferramentas-adaptacao--computador.png`): a borda de baixo do cartão fica cortada em y≈727. É o corte do miolo que rola, e o `md:pb-1` dá só 4 px de respiro. Vale conferir se um respiro maior, ou uma sombra de rolagem, deixa mais claro que há conteúdo abaixo.
- No celular, o placeholder do campo "Tema" da atividade objetiva fica truncado ("…reagente limitar"). É só placeholder, mas um exemplo mais curto evita o corte.
- Fica registrada a recomendação da rodada anterior que ainda não foi aplicada: a faixa "Esperando você" aberta com muitas pendências, junto de "O que cada função faz sozinha" também aberto, pode deixar o painel da conversa quase sem altura. O destino é o `TODO.md`.
- O `TODO.md` também recebe a duplicação entre `useTopoDoMiolo` e `useTopoDoPainel` e o ajuste da seção (8) da Tech Spec.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Ferramenta.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/Time.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/apps/web/src/areas/professor/miolo-do-documento.ts`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-19 17:20:07 · `tasks/correcoes/2026-10-19-formulario-e-assistente-rolam-a-pagina.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A divergência que já existia continua registrada em "Recomendações sem aplicar" e vai ao Arquiteto no fechamento da spec: a seção (8) de `tasks/prd-telas-do-professor/techspec.md` (211-213) ainda fala só do documento do professor. Ela não é silenciosa e não bloqueia esta rodada.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As quatro mudanças desta rodada vieram de recomendações minhas e da Mesa, e conferem:
- **`md:pb-1` no formulário.** Está no miolo, tem asserção no teste e tem mutação.
- **Recuo do `<Abas>`.** Mudou só o espaço: o `git diff -w` não mostra alteração de lógica.
- **Faixa "Esperando você".** O `md:top-0` saiu e o comentário agora bate com o que a tela faz.
- **Teste do `resize` e do `ResizeObserver`.** O caso novo cobre as duas medidas e o desligamento ao sair da tela. Pelo que o caso afirma, cada uma das quatro mutações deixa o teste vermelho.

As fotos a 1366 px (`.processo/vitrine/professora--professor-ferramentas-adaptacao--computador.png` e `professora--professor-time-assistente--computador.png`) mostram o título e as abas parados e o miolo cortado dentro da janela. A tela não ganhou texto nem elemento novo.

Recomendações:
1. **Os quatro blocos `mutacao` novos estão no lugar errado no documento.** No arquivo `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l3/tasks/correcoes/2026-10-19-formulario-e-assistente-rolam-a-pagina.md`, eles ficaram em "## Revisões", logo abaixo da tabela do hook (linhas 115-166), e não em "## Mutações". A skill `revisar-tarefa` (linha 234) e a `corrigir` (linha 79) pedem "Mutações". A seção "## Recomendações sem aplicar" também ficou depois de "## Revisões".
   - O hook (`tools/processo/revisoes.ts:382`) acrescenta cada rodada no fim do arquivo. As linhas desta rodada vão cair grudadas na tabela de recomendações, de três colunas, e não na tabela de revisões.
   - A leitura continua funcionando, porque `lerRevisoes` filtra por `| 2026-` a partir do título "## Revisões". O documento é que fica ilegível.
   - Correção sugerida: mover os blocos para "## Mutações" e pôr "Recomendações sem aplicar" antes de "## Revisões".
2. **`Ferramenta.test.tsx`: desfazer o `vi.stubGlobal` com `vi.unstubAllGlobals()`.** Hoje o `finally` usa `Reflect.deleteProperty(globalThis, 'ResizeObserver')`. Isso funciona porque o `jsdom` não tem `ResizeObserver`, mas apaga em vez de restaurar o que existia antes.

## test-engineer · 2ª rodada · APROVADO · 2026-10-19 17:20:31 · `tasks/correcoes/2026-10-19-formulario-e-assistente-rolam-a-pagina.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada, sobre o diff desde a 1ª):
- a recomendação 1 da 1ª rodada: o `useTopoDoMiolo` mede de novo no `resize` e no `ResizeObserver`, e as duas medidas acabam junto com a tela;
- o `md:pb-1` do miolo do formulário com teste que o prova;
- tirar o `md:top-0` e mudar o recuo em `Time.tsx` sem mudar o comportamento já provado;
- as mutações novas chegando à cláusula certa.

Cobertos:
- **O caso de componente novo** (`apps/web/src/areas/professor/Ferramenta.test.tsx:136-180`) põe um `ResizeObserver` falso e prova quatro coisas. Cada uma tem um bloco de mutação que chega à cláusula pelo motivo certo:
  - o `resize` da janela grava `120px`. Sem o `addEventListener`, fica o `0px` da primeira medida;
  - o observador vigia o `[data-tela]` e o aviso grava `200px`. Sem o `observe`, `observados` fica vazio;
  - ao desmontar, o `disconnect` é chamado (`desligado`);
  - depois de desmontar, um `resize` não grava `300px` de novo. Sem o `removeEventListener`, o ouvinte grava na caixa solta.
- **Os blocos de mutação de `miolo-do-documento.ts` caem só no `useTopoDoMiolo`.** O contexto `}, [])` e o `return miolo` separam esse hook do `useTopoDoPainel`, que termina em `[aberto]`.
- **O `md:pb-1`** tem asserção em `Ferramenta.test.tsx:127` e um bloco que o tira. Os dois blocos antigos foram atualizados para o texto novo da linha.
- **`Time.tsx`:** quase todo o diff é recuo. Tirar o `md:top-0` não muda nada enquanto a página não rola a partir de 768 px. Isso já é provado: `e2e/professor-entregas.spec.ts:66-75` confere a faixa parada e o `paginaNaoRola`.
- **Testes:** `npx vitest run` dos dois arquivos de componente passou com 18 de 18. Não há `.skip`, mock de coisa nossa nem provedor de IA.
- **Recomendações 2 e 3 da 1ª rodada:** ficaram sem aplicar, com destino no `TODO.md` declarado no documento. Vale como recomendação.

Bloqueantes: nenhum

Recomendações:
1. **Os blocos de mutação novos estão no lugar errado do documento.** Estão em `tasks/correcoes/2026-10-19-formulario-e-assistente-rolam-a-pagina.md:115-166`, dentro da seção "## Revisões", que o hook preenche e que não se edita à mão. O lugar deles é a seção "## Mutações". "## Recomendações sem aplicar" (linhas 168-178) também ficou depois da tabela de rodadas.
   - O portão leu os blocos assim mesmo: 6 + 5 = 11 mutações vermelhas.
   - O defeito aparece na próxima rodada. `acrescentarRevisao` (`tools/processo/revisoes.ts:382`) acrescenta a linha no fim do arquivo, e ela vai colar na tabela de recomendações, com outro número de colunas.
   - A contagem do hook não quebra, porque `lerRevisoes` lê toda linha `| 2026-…` depois do título. A correção é mover os quatro blocos para "## Mutações" e as recomendações para antes de "## Revisões".
2. **O `finally { Reflect.deleteProperty(globalThis, 'ResizeObserver') }` em `Ferramenta.test.tsx:177-179` sobra.** O `vi.stubGlobal` já é desfeito pelo `vi.unstubAllGlobals()` do `prepararTela` (`apps/web/src/__fixtures__/tela.tsx:99-103`). Os dois juntos não quebram nada, mas o `try/finally` pode sair.
3. **Duas recomendações da 1ª rodada continuam sem teste**, com destino no `TODO.md`:
   - o formulário com mais conteúdo (as mensagens de erro e o resultado da geração) sob `paginaNaoRola`;
   - o "Ver" da faixa com a rolagem dentro do painel (`scroll-mt-48`).

   Ficam para o `/validar`. Com o `md:top-0` fora, o caso em que a faixa cheia faz a página rolar de novo a partir de 768 px deixaria a faixa presa 56 px abaixo do alto, sem barra em cima. Vale entrar no mesmo item do `TODO.md`.
