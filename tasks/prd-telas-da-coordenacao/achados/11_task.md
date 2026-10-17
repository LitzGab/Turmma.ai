# Achados das revisões — `tasks/prd-telas-da-coordenacao/11_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 15:33:53 · `tasks/prd-telas-da-coordenacao/11_task.md`

VEREDITO: APROVADO
Tela vista: sim (18 fotos lidas, cheia e vazia; computador, celular, Tutor e diálogo de suspender)
Estados: ok. Carregando e erro foram conferidos só pelo código e pelos testes, porque a vitrine não os mostra.
- Carregando: `EstadoCarregando` em `Agentes.tsx:96`, com o seletor "Qual IA" já à mão.
- Erro: `EstadoErro` com "Tentar de novo" em `Agentes.tsx:98`.
- Vazio: não existe, e está certo. Os três agentes sempre existem. A foto da escola vazia é igual à da cheia, ou seja, o argumento do produto aparece na primeira tela.
- Com dado: coberto para as três IAs em `Agentes.test.tsx:151`.
Acessibilidade:
- O seletor é `radiogroup`, e o e2e cobre a navegação pelas setas e por Home.
- O miolo que rola recebe `tabIndex=0` e `aria-label` só a partir de 768 px (`Agentes.tsx:151`).
- Os botões têm nome acessível que começa pelo texto visível, como em "Suspender esta função: Conversa e ferramentas".
- O diálogo é `alertdialog`, devolve o foco ao botão da mesma função e tem região de anúncio.
- Há axe nas três IAs no e2e.
- O contraste visto nas fotos está ok.
Chromebook fraco: a lista é curta (no máximo 3 funções por IA), sem imagem pesada, e a leitura das funções é uma só (o teste confere). O miolo tem conta própria de altura (`miolo-que-rola.ts`), e `paginaNaoRola` agora espera a tela sair de "Carregando…" antes de medir.
Celular:
- Em 360 px não há rolagem horizontal nem texto cortado. O seletor quebra "Analista de desempenho escolar" em três linhas sem esconder nada.
- `Botao` `compacto` e o `Segmentado` têm `min-h-11` no celular e 36 px a partir de `md`, acima dos 24 px mínimos. O e2e exige 44 px em toque.
- Nada depende de hover.
- O e2e roda nos dois projetos.
- A barra de baixo que aparece no meio das fotos longas é efeito da captura de página inteira. O espaço no fim da página existe (`celular-2`).
Ação oficial protegida: sim. O diálogo de suspender mostra a função e o agente, o efeito sobre pedidos novos e sobre o que já foi feito, e o aviso de que a suspensão fica na auditoria (`Agentes.tsx:245-258`). O botão de confirmar traz o nome da função, o motivo é opcional e de lista fechada, e o clique duplo manda uma suspensão só (e2e). O servidor também devolve a suspensão que já existia (e2e).
Bloqueantes: nenhum.
Recomendações:
- A 1366 × 768, "O que a IA nunca faz" fica abaixo da dobra, dentro do miolo que rola, sem sinal visual de que há mais. A tela diz "sempre à vista" no sentido de sempre presente. Um sinal de continuação, como uma borda ou sombra no pé do miolo, ajudaria quem não rola.
- O selo "Alto risco: tem avaliação de impacto" (`Agentes.tsx:194`) usa o termo "avaliação de impacto", que é da D60 e pouco comum para a coordenação. Vale um texto de apoio ou o termo "avaliação de risco" no `/validar`.
- Não revisei o modo escuro, porque não havia foto dele.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-17 15:34:08 · `tasks/prd-telas-da-coordenacao/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido
Bloqueantes: nenhum

O que conferi:

- **Escopo.** As subtarefas 11.1 a 11.6 estão feitas. A AIA recolhível e "Pausar o agente inteiro" ficaram de fora, como a tarefa manda.
- **Divergências.** As quatro da tabela da tarefa estão escritas na `techspec.md` §9, no parágrafo "Como ficou na 11.0", e a 11.7 de `docs/interface.md` foi atualizada. São estas:
  - o cartão leva `data-cartao-do-agente`, e não `data-agente`;
  - `paginaNaoRola` agora espera a tela terminar de carregar antes de medir;
  - `?ia=` é gravado também quando se escolhe o Assistente;
  - entraram arquivos além dos previstos.
- **Fotos.** Batem com o RF19 e com a 7b:
  - o "‹ Registros", o `h1` "Como cada IA trabalha", o seletor "Qual IA" com os nomes do glossário e Registros aceso;
  - um cartão só, com o avatar e o selo "IA";
  - em cada função, a autonomia, "Alto risco: tem avaliação de impacto" e o texto da API em "Faz sozinha" e "Espera aprovação";
  - "O que a IA nunca faz" igual para as três;
  - o diálogo "Suspender a função …" com motivo de lista fechada.

  Nenhuma tela mostra algo que a tarefa não pediu.
- **Regra 00.** Os tipos vêm de `@educa/shared` (`AGENTES`, `NOMES_DOS_AGENTES`, `Agente`). O estado do servidor fica no TanStack Query, e `aplicarFuncao` não foi duplicado em `useState`.

Recomendações:

- **`apps/web/src/areas/coordenacao/Agentes.tsx:108-112` e `:106`.** Ao trocar de IA no seletor, o aviso "Esta função já não estava suspensa…" e o anúncio da última suspensão ou retomada continuam na tela, agora acima do cartão de outro agente. Vale limpar os dois no `aoMudar` do `Segmentado` (`definirAnuncio('')` e `retomada.mutacao.reset()`).
- **`apps/web/src/areas/coordenacao/Agentes.test.tsx:99-108` e `:175-183`.** `montar` e `renderizarTelaEm` montam a tela do mesmo jeito; só muda o que cada uma devolve. Bastaria uma, devolvendo a localização e o `unmount`.
- **`e2e/agentes.spec.ts`, caso "a função que outra pessoa já suspendeu".** A tela aberta antes continua oferecendo "Suspender", e o servidor devolve a suspensão que já existia. Que só reste "Retomar" o teste só confere depois do `reload`. A cobertura dessa linha da tabela de testes é decisão do `test-engineer`; anoto aqui só para ele ver.

## conformidade-reviewer · 1ª rodada · APROVADO · 2026-10-17 15:34:15 · `tasks/prd-telas-da-coordenacao/11_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. A tarefa só mexe na tela e nos testes. O único texto novo que grava no banco é a fixture de teste `suspenderFuncaoPorOutraPessoa` (`e2e/__fixtures__/governanca.ts:243`), que escreve em `suspensao_de_funcao` e não em `nota`. Todos com autor humano? sim, porque não há nenhum caminho.

Decisão autônoma sobre aluno: ausente. A tela só lê e suspende funções. "O que a IA nunca faz" continua sempre à vista, com "Decidir aprovação, reprovação ou encaminhamento de aluno, nem como sugestão aplicada sozinha" (`apps/web/src/areas/coordenacao/nunca-faz.ts:10`). Isso aparece nas fotos `coordenacao--coordenacao-agentes--celular-2.png` e `vazia--coordenacao--coordenacao-agentes--Tutor--celular-2.png`.

Aprovação registrada: ok.
- **O que espera aprovação vem da API:** o texto de cada função é o da resposta da API, e o teste de componente prova isso com frases que o catálogo não tem (`Agentes.tsx:204-209`; `Agentes.test.tsx:250-264`).
- **A exceção do tutor fica só no tutor (D47):** só o "Tutor com o aluno" diz "Responde na hora, sem que o professor aprove cada resposta". A Correção de objetiva diz "só chega ao aluno depois que o professor abre os casos destacados e aprova o lote", e a Adaptação diz "só chega ao aluno depois que o professor aprova". Fotos: `coordenacao--coordenacao-agentes--Tutor--computador.png` e `coordenacao--coordenacao-agentes--celular-1.png`.
- **Suspender e retomar ficam registrados:** o e2e confere no banco quem fez e o motivo, e a auditoria `funcao.suspensa` e `funcao.retomada` com o autor (`e2e/agentes.spec.ts:214-221`).

Supervisão do tutor: ok. A tela não muda nada no tutor. Em português comum ela diz que o professor da turma acompanha: vê quem está usando, quanto e em que atividade, e recebe os avisos. Os "Sinais para o professor" dizem "não decide nada sobre o aluno", e não há inferência emocional em nenhum texto (`Tutor--celular-1.png`).

Autonomia declarada e visível: sim.
- **Toda função mostra o nível:** cada uma leva o selo de autonomia em português comum ("Faz e registra", "Faz e avisa", "Propõe e espera aprovação") e o selo "Alto risco: tem avaliação de impacto" onde vale (`Agentes.tsx:193-194`; `Agentes.test.tsx:266-281`; e2e `agentes.spec.ts:193`).
- **O nível 3 espera aprovação:** a Adaptação tem nível 3 e o texto dela diz que espera aprovação.
- **O nível 4 não age:** existe só como rótulo "Nunca faz" e como a lista do que a IA nunca faz.
- **Uma IA por vez:** o seletor só passa a mostrar uma IA de cada vez. As três continuam ao alcance da coordenação, cada uma com o nome de função e o selo "IA" (`[data-selo-ia]`, `Agentes.test.tsx:151-171`).
- **Nas fotos:** cheia e vazia, no computador e no celular, mostram a mesma coisa, sem nota, conceito nem sugestão de nota. No diálogo de suspender, o aviso "A suspensão fica na auditoria da escola, com quem suspendeu e quando" está à vista antes de confirmar. Cancelar fica ao lado de confirmar, e o motivo é opcional: sair não custa mais que entrar.

Bloqueantes: nenhum.

Recomendações:
1. **A trava contra "o agente se diz pessoa" (D58) não pega "nós".** O teste em `apps/web/src/areas/coordenacao/Agentes.test.tsx:263` usa `/\b(eu|sou|meu|minha|nós)\b|humano|colega|amig[oa]/i`. No JavaScript o `\b` não trata "ó" como letra, então "nós" seguido de espaço nunca casa. Sugestão: trocar os `\b` por `(?<![\p{L}])…(?![\p{L}])` com a flag `u`.
2. **A fixture de "outra pessoa suspendeu" pula a auditoria.** `suspenderFuncaoPorOutraPessoa` (`e2e/__fixtures__/governanca.ts:243-250`) grava a suspensão direto no banco, sem o registro que a API gravaria. O teste só confere `suspensao_de_funcao`, então não há furo. Vale um comentário dizendo que essa suspensão não passa pela API nem pela auditoria, para ninguém usar a fixture num teste da auditoria da regra 70, item 6.
3. **A tela velha ainda abre o diálogo de suspender.** O cenário da tarefa diz "o diálogo não oferece suspender de novo", mas na tela desatualizada o diálogo abre, e só o servidor evita a segunda suspensão (`e2e/agentes.spec.ts:230-246`). Não fere a regra 70. É uma questão de comportamento da tela, que fica para o `frontend-reviewer` e o `revisor-geral`.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Agentes.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Agentes.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/nunca-faz.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/textos-da-governanca.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/agentes.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/__fixtures__/governanca.ts

## test-engineer · 1ª rodada · REPROVADO · 2026-10-17 15:35:35 · `tasks/prd-telas-da-coordenacao/11_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** a página "Como cada IA trabalha" abre no Assistente de ensino. Escolher uma IA no seletor "Qual IA" grava `?ia=` sem criar entrada nova no histórico e mostra um cartão só. Suspender a correção de objetiva pelo diálogo grava quem suspendeu e o motivo, e retomar fecha a suspensão.
- **Borda 1:** endereço com `?ia=` inválido, vazio, em maiúscula ou com dois valores.
- **Borda 2:** função já suspensa por outra pessoa da coordenação, com a tela velha ainda aberta.
- **Borda 3:** falha de rede com o diálogo aberto, e o aviso sumindo ao reabrir.
- **Borda 4:** a tela ainda carregando não pode passar na medida de rolagem.
- **Concorrência:** clique duplo em confirmar, com o pedido segurado no ar.
- **Isolamento e recomeço:** a coordenação da escola B entra na mesma aba da escola A, sem recarregar, e não vê a suspensão de A.
- **Permissão:** professor ou aluno não alcança a página nem o `POST …/suspender`.
- **Estados da tela:** carregando, erro com "Tentar de novo", com dado em cada IA, e o foco depois de suspender e de retomar.
- **Texto e selos:** "faz sozinha" e "espera aprovação" vêm da API; autonomia e "Alto risco" aparecem por função; nenhuma frase diz que o agente é pessoa.
- **360 px e teclado:** setas no seletor, alvos de 44 px, sem rolagem de lado, axe limpo.

**Cobertos:**
- **Testes de componente** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Agentes.test.tsx`): os estados da tela, com o seletor presente também carregando e com erro. A API devolve textos que o catálogo não tem, então a tela não passa mostrando o texto do catálogo. A autonomia usa os níveis 1, 2 e 3, todos diferentes, e "Alto risco" aparece só onde a API diz. Também cobrem a função suspensa, o foco depois de suspender e de retomar, "Cancelar" sem gravar nada, a retomada que outra aba já fez e a falha que fica no diálogo. Os 44 casos de `Agentes.test.tsx`, `textos-da-governanca.test.ts` e `passagens.test.tsx` passam aqui.
- **Testes de ponta a ponta** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/agentes.spec.ts`): as três IAs com o endereço, o nome de função, o selo "IA" e o avatar de 48 px. O seletor pelas setas e por Home, os alvos de toque, o axe e `paginaNaoRola` em cada IA. A prova de que `paginaNaoRola` recusa a tela carregando. A suspensão e a retomada com o registro no banco e a auditoria. A outra pessoa que suspendeu antes: a suspensão continua sendo dela, sem motivo, e não se grava uma segunda. A falha e o reabrir, o clique duplo com dois cliques no mesmo instante e o pedido segurado, e o recomeço com a escola B e a leitura segurada.
- **Roteiro da demonstração:** passa pelas três IAs pelo seletor, com um cartão por vez.
- **Seção "Mutações":** confere com o `git diff`. Cada cláusula nova tem bloco: `agenteDoEndereco` (os dois ramos), o filtro por IA, `replace`, a busca preservada, o valor da opção, o `tabIndex` (nos dois sentidos), carregando, erro, largura, título, a espera de `paginaNaoRola` e o miolo de 21 rem. Todas caem num teste que chega à cláusula.
- **Proibidos:** nenhum `.skip`, nenhum teste comentado e nenhum mock de código nosso. A rede é falsa só no teste de componente; no de ponta a ponta o servidor e o banco são de verdade.

**Bloqueantes:**
- **`e2e/agentes.spec.ts:293`:** `expect(pedidos).toHaveLength(1)` é síncrono e vem logo depois de `toBeDisabled()`. O botão desligado é conferido no processo que desenha a página. O `pedidos.push` só acontece quando a interceptação do pedido chega ao Playwright, e ela passa pelo processo de rede do Chromium. Com a máquina carregada, o botão pode já estar desligado com `pedidos` ainda vazio, e o teste fica vermelho sem defeito nenhum. É teste que só passa com a máquina folgada.
  - **Correção exigida:** trocar por `await expect.poll(() => pedidos.length).toBe(1)`, o padrão que o repositório já usa no mesmo cenário (`e2e/professores.spec.ts:728`, `e2e/acesso-da-turma.spec.ts:770`). A conferência final da linha 297, depois de `segurada.abrir()`, continua pegando um segundo pedido.

**Recomendações:**
1. **Permissão:** nenhum teste desta tarefa prova que professor ou aluno não abre `/coordenacao/agentes`. A guarda já existe no W2 de `e2e/areas.spec.ts`. Vale citá-la na tabela de testes da tarefa, ou incluir um caso curto de professor em `agentes.spec.ts`.
2. **Agente que se diz pessoa** (`Agentes.test.tsx:263`): a asserção é só negativa, sobre uma lista curta de palavras, e nenhuma cláusula do diff a faria falhar. Prova pouco, como está.
3. **Folga da medida de rolagem** (`miolo-que-rola.ts`, 21 rem): sobram 16 px a 1366 × 768. O comentário vizinho registra uma fonte que já custou +10 px no Chromebook. Se a fonte da esteira for outra, a margem é curta, e vale anotar no runbook do teste como medir se ela estourar.
4. **"Já suspensa por outra pessoa":** o teste prova que nada se duplica e que, depois do reload, só sobra "Retomar". A frase da tabela da tarefa, "o diálogo não oferece suspender de novo", só vale depois que a tela é lida de novo. Vale ajustar o texto da linha para o que o teste prova.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-17 15:48:46 · `tasks/prd-telas-da-coordenacao/11_task.md`

VEREDITO: APROVADO
Tela vista: sim (18 fotos lidas das 18 listadas, no computador e no celular, escola cheia e vazia; ignorei as de "Analista-de-desempenho-escolar", como pedido)
Estados: ok. O carregando (`EstadoCarregando`) e o erro (`EstadoErro`, com "tentar de novo") continuam presentes em `apps/web/src/areas/coordenacao/Agentes.tsx:~118-122`. O seletor "Qual IA" aparece nos três estados. Não há lista que possa ficar vazia, porque as três IAs e as funções vêm do catálogo. A escola vazia mostra a mesma tela útil que a cheia, o que é o esperado: a página descreve as IAs, não os dados da escola.
Acessibilidade: ok. O seletor é um grupo de rádio com rótulo "Qual IA". O foco volta ao botão novo depois de suspender ou retomar. O anúncio fica numa região viva (`Anuncio`). O aviso de falha tem `role="alert"`. O miolo que rola recebe `tabIndex=0` só a partir de 768 px. O botão "Voltar para Registros" tem `min-h-11`.
Chromebook fraco: ok. Não há lista longa, imagem nem trabalho pesado. A mudança do round é só estado local e um `reset` da mutação.
Celular: ok.
- Em 360 px não há rolagem horizontal nem texto cortado.
- O seletor de três opções quebra "Analista de desempenho escolar" em três linhas sem esconder a ação.
- "Suspender esta função" tem cerca de 44 px de altura e largura suficiente.
- O diálogo de suspensão cabe em 360 px, com "Cancelar" e "Suspender conversa e ferramentas" empilhados e legíveis.
- Nada depende de hover. A barra de baixo aparece no meio das fotos compridas: é efeito da captura de página inteira, não defeito.
Ação oficial protegida: sim. A suspensão passa por diálogo que mostra a função e o agente, o efeito ("deixa de responder pedido novo... o que já produziu não é apagado") e o aviso de que fica na auditoria. Tem motivo opcional, "Cancelar" e botão de confirmar com o nome da função. Os testes de dois cliques seguidos (`e2e/agentes.spec.ts:290-294`) provam que só um pedido sai.

Correção do diff da rodada 2:
- `Agentes.tsx:~85-90`: `escolherIA` limpa o anúncio e chama `retomada.mutacao.reset()` antes de navegar. Os dois restos (anúncio da última ação e aviso da retomada que falhou) eram de uma IA que sai da tela, e o código resolve isso. O teste novo em `Agentes.test.tsx` cobre as duas coisas: o `alert` some ao trocar para o Tutor, e a frase "voltou a funcionar" some também.
- O resto do diff (`montar` devolvendo `unmount`, regex com `\p{L}` e flag `u` para o teste de primeira pessoa, `expect.poll` no e2e, comentário da fixture) é teste ou comentário, sem efeito na tela. O `expect.poll` torna o teste de duplo clique mais estável. A regex nova pega melhor palavras acentuadas, como "nós".
- Termo técnico, id ou texto em inglês: nenhum na tela. Não vi saída de IA nesta página, e os cartões se apresentam como função com o selo "IA", sem primeira pessoa (D58).
- Contradição com `docs/interface.md` ou a pele da D80 (a onça como avatar, bordas e cores por família): nenhuma visível.

Bloqueantes: nenhum.
Recomendações:
- A fixture `suspenderFuncaoPorOutraPessoa` (`e2e/__fixtures__/governanca.ts:~239-241`) agora avisa no comentário que grava só a linha de `suspensao_de_funcao`, sem a auditoria. Se algum teste futuro conferir o registro de auditoria dessa suspensão, ele deve usar a API.
- No computador, o cartão do primeiro agente fica cortado na parte de baixo da primeira foto, porque só o miolo rola, como pede a RF23. O que fica visível já traz o botão e o texto principal, então não bloqueia.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-17 15:49:16 · `tasks/prd-telas-da-coordenacao/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

As cinco correções da rodada anterior foram feitas:
- **Clique duplo:** `e2e/agentes.spec.ts:293-294` usa `expect.poll(() => pedidos.length).toBe(1)`, como pediu o test-engineer.
- **Trocar de IA limpa os avisos:** `apps/web/src/areas/coordenacao/Agentes.tsx:86-90` (`escolherIA`) limpa o anúncio e o aviso da retomada que falhou.
  - O teste novo cobre os dois ramos: o aviso de falha e o anúncio de retomada bem-sucedida.
  - As duas mutações estão declaradas em `11_task.md:168-181`. Cada uma remove uma das duas limpezas, e o teste novo pega as duas.
- **Trava do "nós":** a regex de `Agentes.test.tsx:276` agora usa `(?<!\p{L})…(?!\p{L})` com a flag `u`, e pega "nós".
- **`montar` e `renderizarTelaEm`:** viraram uma função só, que devolve `{ localizacao, unmount }`. As chamadas foram ajustadas.
- **Comentário da fixture:** o de `e2e/__fixtures__/governanca.ts:238-242` diz que a fixture não passa pela API nem grava a auditoria.

Nas fotos (`coordenacao--coordenacao-agentes--computador.png`, `...--Tutor--celular-1.png`, `...--Suspender-esta-função--computador.png`, `vazia--...--Tutor--computador.png`), a tela mostra o que a tarefa pede:
- uma IA por vez, escolhida no seletor "Qual IA";
- "Faz sozinha" e "Espera aprovação" em cada função;
- o selo de alto risco só no Tutor;
- a confirmação da suspensão de uma função só, com motivo opcional e o aviso da auditoria;
- o vocabulário do glossário.

Não aparece nada fora do escopo.

Recomendações:
- **Retomada ainda no ar:** em `apps/web/src/areas/coordenacao/Agentes.tsx:86-90`, se a coordenadora troca de IA enquanto a retomada ainda não terminou, o `reset()` não cancela a resposta que vem depois. Quando ela chega, o `onSuccess` (linhas 76-80) mostra "A função X voltou a funcionar" acima do cartão da outra IA, o mesmo problema que esta correção resolveu. Na prática a chance é pequena, porque o pedido é curto. Se quiser fechar o caso, o `onSuccess` pode só anunciar quando a IA da função retomada for a que está na tela.
- **Pendências que seguem para o `/validar`:** as recomendações que ficaram na seção "Sem aplicar" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/ordens/11_task-r1.md` já têm destino lá. Destaco duas: a frase da tabela da tarefa sobre "já suspensa por outra pessoa", que na tela antiga ainda abre o diálogo, e o texto do selo "Alto risco: tem avaliação de impacto".

## test-engineer · 2ª rodada · REPROVADO · 2026-10-17 15:49:59 · `tasks/prd-telas-da-coordenacao/11_task.md`

VEREDITO: REPROVADO

**Cenários exigidos (2ª rodada):**
- O bloqueante da 1ª rodada, no clique duplo em confirmar a suspensão.
- A cláusula nova `escolherIA`: trocar de IA limpa o anúncio e o aviso da retomada. Ela pede o caminho feliz, o teste que falha sem cada uma das duas linhas, e o caso de borda de trocar de IA com a retomada ainda no ar (rede lenta da escola).
- As três recomendações aplicadas: a regex com `\p{L}`, a junção de `montar` com `renderizarTelaEm`, e o comentário da fixture.

**Cobertos:**
- **Bloqueante da 1ª rodada, corrigido.** Em `e2e/agentes.spec.ts:294` a contagem agora é `await expect.poll(() => pedidos.length).toBe(1)`. A conferência síncrona da linha 298, depois de `segurada.abrir()`, continua pegando um segundo pedido. Se um segundo pedido chegar antes, o poll vê 2 e fica vermelho.
- **Caminho feliz de `escolherIA`.** O teste está em `apps/web/src/areas/coordenacao/Agentes.test.tsx:216-244`. O `Anuncio` e o `<p role="alert">` ficam fora do cartão do agente (`Agentes.tsx:112-119`), e por isso continuam na tela se a limpeza for removida. Os dois blocos de "Mutações" (`11_task.md:169-181`) atingem a cláusula pelo motivo certo: sem `definirAnuncio('')` cai a asserção da linha 99, e sem `reset()` cai a da linha 92.
- **As três recomendações estão corretas.** A regex agora pega "nós". `montar` devolve `{ localizacao, unmount }` em todos os usos. O comentário da fixture diz que a suspensão não passa pela auditoria.
- `npx vitest run src/areas/coordenacao/Agentes.test.tsx` passou: 15 de 15.

**Bloqueantes:**

1. **`apps/web/src/areas/coordenacao/Agentes.tsx:86-90`, junto com `apps/web/src/componentes/dialogos.tsx:27-33`: trocar de IA com uma retomada ainda no ar trava todas as retomadas seguintes.**
   - **O que acontece:** `escolherIA` chama `retomada.mutacao.reset()` sem ver se há pedido pendente. No TanStack Query v5, `reset()` tira o observador da mutação em curso (`node_modules/@tanstack/query-core/build/modern/mutationObserver.js:49-54`). Daí em diante, os callbacks passados ao `mutate` não disparam mais (`#notify` só os chama com o observador ligado).
   - **Primeira consequência:** o `onSettled: () => (noAr.current = false)` de `useEnvioUnico` nunca roda. `noAr` fica `true` até a tela ser desmontada, e todo clique seguinte em "Retomar esta função", de qualquer função e de qualquer IA, é descartado em silêncio. O botão continua com cara de ligado, porque `isPending` já é `false` depois do `reset`. A coordenadora não consegue retomar a função e não recebe aviso nenhum.
   - **Segunda consequência:** o `onSuccess` das opções (`Agentes.tsx:76-80`) é da própria mutação e continua disparando. "A função X voltou a funcionar nesta escola." aparece acima do cartão da outra IA, que é justamente o que a cláusula nova quer evitar.
   - **Quando acontece:** clicar em "Retomar" e trocar de aba antes da resposta. Com a rede da escola instável, isso é corriqueiro.
   - **O mesmo caminho já existia** em `aoSuspender` (`Agentes.tsx:129-133`): clicar em "Suspender" de outra função com uma retomada no ar trava do mesmo jeito.
   - **Correção exigida:**
     - Liberar a trava no `onSettled` das opções da mutação dentro de `useEnvioUnico`, que sobrevive ao `reset`, em vez do `onSettled` do `mutate`. A alternativa é não chamar `reset()` com `isPending`. A primeira opção corrige os dois pontos que chamam `reset()`.
     - Decidir o que acontece com o anúncio que chega depois da troca. Por exemplo: guardar a IA da retomada e só anunciar se ela ainda for a IA da tela.
     - Escrever um teste de componente com a resposta da retomada segurada: retomar, trocar de IA, deixar a resposta chegar, voltar, retomar outra função, e conferir que o segundo pedido sai e que o anúncio não aparece na IA errada.
     - Acrescentar o bloco em "Mutações" para a liberação da trava.

**Recomendações:**
- O teste novo (`Agentes.test.tsx:216-244`) cobre a troca só depois que a retomada já terminou. Vale nomear no título que o caso com a resposta pendente é coberto por outro teste, o do bloqueante acima.
- `humano|colega|amig[oa]` na regex da linha 119 continua sem limite de palavra. Hoje isso não causa falso positivo, mas um texto futuro com "desumano" ou "amigável" quebraria o teste sem haver defeito.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-17 16:19:54 · `tasks/prd-telas-da-coordenacao/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As duas correções desta rodada estão feitas.

- **A trava presa:** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/dialogos.tsx:33-37` a trava agora solta quando o próprio pedido termina. Um `reset()` com a retomada no ar já não a prende. A falha também solta a trava (`.then(soltar, soltar)`), sem rejeição solta. As outras 13 telas que usam `useEnvioUnico` continuam com o mesmo comportamento, porque nenhuma passa opção própria ao `enviar`. A única diferença é que a trava solta também se a tela já saiu, o que não faz mal.
- **O anúncio na IA errada:** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/Agentes.tsx:75-97` a resposta só anuncia e só move o foco se a IA da função retomada ainda for a que está na tela. A atualização da lista continua acontecendo antes dessa conferência, então ela não se perde. O aviso de falha da retomada antiga também não aparece em outra IA, porque o `reset()` desliga essa leitura.

As duas mudanças têm teste que fica vermelho sem elas. As duas mutações novas em `11_task.md` desfazem exatamente o que esta rodada mudou e apontam o teste novo, e o carimbo do portão as cobre.

Recomendações:
- Ainda sobra um descarte em silêncio, só que curto. Depois de `escolherIA`, o `reset()` deixa `isPending` em `false` e o botão "Retomar" da IA nova aparece ativo. Mas, enquanto a resposta da IA anterior não chega, `enviar` descarta o clique sem nenhum aviso. Isso dura o tempo de um pedido. Saídas possíveis: deixar o botão desabilitado enquanto a trava está presa, ou aceitar e registrar a janela no `11_task.md`.
- O nome `iaNaTela` é atualizado em dois lugares: no efeito sobre `[ia]` e em `escolherIA`. A escrita em `escolherIA` cobre a resposta que chega antes do próximo render. Vale uma linha no comentário da linha 74 dizendo isso, para ninguém tirá-la como repetida.

## frontend-reviewer · 3ª rodada · APROVADO · 2026-10-17 16:20:12 · `tasks/prd-telas-da-coordenacao/11_task.md`

VEREDITO: APROVADO
Tela vista: sim (18 fotos lidas das 18 listadas: computador e celular, escola cheia e vazia, aba Tutor e diálogo "Suspender esta função"). Ignorei as fotos antigas do Analista.
Estados: ok. Carregando e erro (com "tentar de novo") continuam em `apps/web/src/areas/coordenacao/Agentes.tsx:110-113`, conferidos no código porque a vitrine não os mostra. O seletor "Qual IA" aparece nos três estados. Não existe lista que possa ficar vazia: as funções vêm do catálogo. A escola vazia mostra a mesma tela útil que a cheia, o que é certo, porque a página descreve o que cada IA faz e não os dados da escola.
Acessibilidade: ok.
- O seletor é um grupo de opções com o rótulo "Qual IA".
- O anúncio fica em região viva e o aviso de falha tem `role="alert"`.
- O foco vai para o botão novo depois de retomar, e só quando a IA da função retomada é a que está na tela (`Agentes.tsx:68-73, 84-86`). Nos outros casos não há anúncio nem foco, o que é o certo: antes o anúncio apareceria acima do cartão de outra IA.
Chromebook fraco: ok. Não há lista longa, imagem nem trabalho pesado. O diff acrescenta só uma ref e uma promessa.
Celular: ok.
- Em 360 px não há rolagem horizontal nem texto cortado.
- O seletor quebra "Analista de desempenho escolar" em três linhas sem esconder a ação.
- "Suspender esta função" tem cerca de 44 px de altura.
- O diálogo cabe em 360 px, com "Cancelar" e "Suspender conversa e ferramentas" empilhados.
- Nada depende de hover. A barra de baixo no meio das fotos compridas é efeito da captura de página inteira, não defeito.
Ação oficial protegida: sim. A suspensão abre um diálogo com a função e o agente, o efeito ("o que ela já produziu não é apagado"), o aviso de que fica na auditoria e o motivo opcional. Tem "Cancelar" e um confirmar que leva o nome da função. A retomada é a volta ao estado anterior, não é uma ação oficial, e sai com um clique.

Correção da rodada 3 (efeito na tela, conferido no código e no teste):
- **Trava do clique duplo, `apps/web/src/componentes/dialogos.tsx:26-40`.**
  - Antes, o `onSettled` do `mutate` ficava ligado ao observador. Um `reset()` com o pedido no ar o desligava, e a trava ficava presa: todo "Retomar" seguinte era ignorado em silêncio.
  - Agora `mutateAsync(...).then(soltar, soltar)` solta a trava quando o próprio pedido termina. Os dois ramos tratam a rejeição, então não há promessa rejeitada solta.
  - A soltura acontece um passo depois do `onSuccess` das opções, e antes vinha depois dele também, então os outros chamadores veem a mesma ordem.
- **Alcance.** `useEnvioUnico` é usado em 13 telas: Estrutura, ListaDaTurma, RegistrarPedido, DadoNominal, AnoEDisciplinas, Alocacao, DialogoDeEnvioDeMaterial, AcoesDoPedido, AcessoDaTurma, Material, MeusDados, DialogoDeDecisao e Agentes. A assinatura não mudou. Só `Agentes.tsx` chama `reset()` com o pedido no ar, e nenhum chamador usava o `onSettled` por chamada. O efeito nas outras telas é só a trava ficar mais robusta. Em `AcessoDaTurma` o teste que a cobre é de unidade das opções.
- **Anúncio e foco, `Agentes.tsx:74-90, 93-98`.**
  - A ref `iaNaTela` é atualizada pelo efeito, para a volta pelo histórico do navegador, e por `escolherIA`, na hora do clique, antes da navegação.
  - A resposta que chega com outra IA na tela atualiza a lista, mas não anuncia nem tira o foco. Quando a coordenadora volta à IA da função, o botão já é "Suspender".
  - Se ela volta antes da resposta chegar, o anúncio aparece normalmente.
- **Botão "Retomar".**
  - Depois do `reset()`, `isPending` é falso e o botão da função parece livre, mas a trava segue ocupada até a resposta. Um clique nessa janela é ignorado sem aviso (ver a primeira recomendação). Não fica preso.
- **Teste.** Rodei `Agentes.test.tsx`: 16 de 16 passam. O teste novo cobre retomar, trocar de IA, a resposta chegar depois, a nova retomada sair e a ausência de anúncio na IA errada. As mutações declaradas em `11_task.md` removem a mudança em `dialogos.tsx` e a guarda `agente !== iaNaTela.current`.

Bloqueantes: nenhum.
Recomendações:
- `Agentes.tsx:93-98` e `dialogos.tsx:29-38`: depois de trocar de IA com a retomada no ar, o botão volta a parecer livre, mas o clique é descartado até a resposta chegar. É uma janela curta e sem perda de dado. Se quiser fechar, `retomando` pode vir de um estado próprio que sobreviva ao `reset()`, ou o botão pode seguir desligado enquanto a trava estiver ocupada.
- `e2e/__fixtures__/governanca.ts` (`suspenderFuncaoPorOutraPessoa`): a fixture grava só a linha da suspensão, sem a auditoria. Teste futuro que confira o registro de auditoria dessa suspensão deve usar a API.
- No computador, o primeiro cartão fica cortado embaixo na primeira foto, porque só o miolo rola (RF23). O botão e o texto principal já aparecem.
- Seguem para o `/validar` as pendências de texto das rodadas anteriores: o selo "Alto risco: tem avaliação de impacto" e a frase da tabela da tarefa sobre "já suspensa por outra pessoa".

## test-engineer · 3ª rodada · APROVADO · 2026-10-17 16:21:40 · `tasks/prd-telas-da-coordenacao/11_task.md`

VEREDITO: APROVADO

**Cenários exigidos (3ª rodada):**
- A correção da trava: depois de um `reset()` com um pedido ainda no ar, a próxima retomada sai, nas duas chamadas a `reset()` (`escolherIA` e `aoSuspender`).
- O anúncio de uma resposta que chega depois da troca de IA não aparece no cartão da outra IA.
- Um teste de componente com a resposta segurada, que fica vermelho sem cada uma das duas cláusulas novas.
- Os dois blocos novos em "Mutações".
- As outras telas que usam `useEnvioUnico` continuam funcionando.
- As duas recomendações da 2ª rodada.

**Cobertos:**
- **A trava solta mesmo depois do `reset()`.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/dialogos.tsx:34-37`, a trava agora solta quando a promessa do `mutateAsync` termina. Essa promessa termina mesmo com o observador desligado pelo `reset()`. A falha também solta a trava, pelo segundo argumento do `then`, e não fica rejeição sem tratamento. A ordem das coisas não muda para as outras telas: o `onSuccess`/`onSettled` das opções roda antes, e o `ConfirmacaoDePerigo` continua esperando o `aoTerminar`. A correção vale para as duas chamadas a `reset()`, a de `escolherIA` e a de `aoSuspender`.
- **O anúncio fica na IA certa.** `Agentes.tsx:74-87` guarda a IA da retomada no pedido e confere com `iaNaTela`. A ref é atualizada em `escolherIA` e também por efeito, quando o endereço muda por outro caminho. A função retomada continua sendo gravada no cache pelo `aplicarFuncao`, então a lista fica certa.
- **O teste novo, `Agentes.test.tsx:223-252`, é vermelho pelo motivo certo nas duas mutações:**
  - Mutação `mutate(entrada, { onSettled: soltar })`: o `reset()` desliga o observador, a trava fica presa, o clique em "Retomar esta função: Tutor com o aluno" é descartado, e a linha 250 (`findByText` do anúncio) falha.
  - Mutação que remove `if (agente !== iaNaTela.current) return`: o `definirAnuncio` roda no mesmo tick do `aplicarFuncao`, antes de a 2ª leitura voltar. Por isso a linha 247 encontra "Correção de objetiva voltou a funcionar" e falha.
  - A 2ª leitura da lista (Sinais passa a mostrar "Retomar") é um sinal de que a resposta chegou que não depende de relógio. A linha 251 confere os dois POSTs, na ordem.
- **Os blocos de "Mutações"** (`11_task.md:204-215`): os dois novos citam o teste por um prefixo que bate com o título. Os dois de `escolherIA` agora apontam para o teste renomeado.
- **As duas recomendações foram feitas:**
  - O título do teste da linha 254 diz que o caso com a resposta ainda no ar é o de cima.
  - A regex da linha de primeira pessoa usa limite de palavra em todos os termos (`human[oa]s?|colegas?|amig[oa]s?` dentro do grupo com `(?<!\p{L})…(?!\p{L})`).
- **Testes rodados:**
  - `npx vitest run src/areas/coordenacao/Agentes.test.tsx`: 16 de 16.
  - `npx vitest run apps/web/src`, a partir da raiz: 141 arquivos e 1632 testes passando. Entram aí as 13 outras telas que usam `useEnvioUnico`, inclusive `DadoNominal`, que também chama `reset()`. Nenhuma depende do `onSettled` passado ao `mutate`.
  - Rodando o vitest de dentro de `apps/web`, 51 arquivos falham com "Failed to resolve entry for package @educa/shared". É a configuração de onde o comando roda, não a tarefa.
- Não há `.skip`, nem teste comentado, nem mock que esconda a regra. A rede é falsa, e o cliente de consultas e o roteador são os de verdade.

**Bloqueantes:** nenhum.

**Recomendações:**
- O cenário pedido incluía "voltar": depois de a resposta chegar, voltar ao Assistente de ensino. O teste retoma a função do Tutor sem voltar. Uma volta ao Assistente provaria duas coisas que hoje só se deduzem: que a Correção de objetiva aparece retomada lá e que nenhum anúncio atrasado aparece ao voltar.
- O caminho de `aoSuspender` com uma retomada no ar (`Agentes.tsx:137-141`) não tem teste próprio. A trava está coberta pela mutação de `dialogos.tsx`. Mesmo assim, a resposta que chega com o diálogo de suspensão aberto, na mesma IA, ainda anuncia e põe a função em `focarFuncao`. Vale um caso, ou uma linha dizendo que é intencional.
- O comentário em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/ListaDaTurma.tsx:396-397` diz que "a trava do envio único ficaria presa" com um `reset()` no meio do pedido. Com esta correção, isso deixou de ser verdade. Vale atualizar, mantendo o outro motivo, que continua valendo: perder o fim do pedido.
- Com a trava solta depois do `reset()`, a coordenadora pode trocar de IA, voltar e clicar de novo em "Retomar" na mesma função antes de a primeira resposta chegar. Sai um segundo POST, e o servidor responde que ela não estava suspensa (`NAO_ENCONTRADO`); a tela mostra o aviso e lê a lista de novo. O resultado é aceitável, mas não está declarado em lugar nenhum. Vale uma linha na tabela de cenários da tarefa.
