# Achados das revisões — `tasks/prd-lgpd-e-titular/10_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-09 15:32:56 · `tasks/prd-lgpd-e-titular/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** o aviso aparece ao entrar, mostra todos os campos e a coordenação confirma. Ficam gravados quem confirmou e quando.
- **"Ver depois" e Esc:** deixam uma faixa fixa, sem botão de fechar, que acompanha as telas. O "Sair" continua a um toque.
- **Leitura única:** a consulta lê uma vez por sessão. Um novo login traz o diálogo de volta.
- **Duas coordenadoras:** a confirmação de uma aparece para a outra. Confirmar de novo não dá erro e a primeira confirmação é a que fica.
- **Dois incidentes:** os dois são contados, um por vez no diálogo, com o foco no texto.
- **Clique duplo:** manda uma confirmação só. A falha diz o que fazer e aparece só no aviso que falhou.
- **Aba Incidentes:** quatro estados, a 360 px, só com teclado, com acessibilidade.
- **Isolamento e permissão por papel:** já provados na API pela 9.0, em `apps/api/test/incidente.int.test.ts`.
- **Troca de escola:** a coordenadora que troca de escola não vê o aviso da anterior.

**Cobertos:** todos os itens acima, menos o último, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/incidentes.spec.ts`, nos projetos `chromebook` e `celular`, contra a API real. Os textos estão em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-dos-incidentes.test.ts`. Para a troca de escola há só a prova genérica, ver a recomendação 1.

O que conferi:
- **Mutações:** a tabela tem uma linha para cada cláusula do diff, e cada uma aponta um teste que tem asserção sobre o resultado:
  - `staleTime: Infinity`: relógio avançado com `visibilitychange`, e a contagem de leituras fica em 1 (`incidentes.spec.ts:230-233`).
  - O filtro dos pendentes: um incidente já confirmado está na mesma escola, e o teste confere que ele fica de fora (`:119`, `:138-141`).
  - O foco no aviso seguinte: `:396`.
  - A trava `noAr`: `:427` e, sem depender de tempo, a contagem total `:452` (`toBe(2)` depois da nova tentativa).
  - A releitura segurada: `:445-451`.
  - `refetchOnMount: 'always'`: `:239` e `:309-313`.
  - A falha e o botão desligado por cartão: `:481-491`.
  - `whitespace-pre-line` e `break-words`: `:143` e `:148`, com a palavra de 120 letras.
- **Sem atalhos:** não há `.skip` nem teste comentado. Os `page.route` só simulam a falha, o vazio e a espera. Nenhum deles esconde a regra testada.
- **Persistência:** a gravação de quem e quando é conferida no banco (`:174-176`, `:247`, `:338`, `:453`). O clique duplo é provado com o pedido parado no ar.
- **IA:** nenhuma parte da tarefa usa IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Troca de escola com o aviso guardado.** A consulta do aviso nunca fica velha (`staleTime: Infinity`) e a chave não tem a escola. Hoje o que impede o aviso da escola A de aparecer na B é só o `resetQueries` de `apps/web/src/main.tsx:26-28`. Esse reset é provado por `e2e/privacidade.spec.ts:131`, mas com a retenção. A Tech Spec §9 afirma que "trocar de escola" desfaz o adiamento, e nenhum teste prova isso. Sugestão: um caso com incidente só em A, adiado, troca para B, e nem o diálogo nem a faixa aparecem.
2. **Permissão pelo lado da web.** Falta um caso em que um professor da mesma escola, com incidente pendente, não vê aviso nem faixa e não dispara `GET /v1/privacidade/incidentes`. Hoje isso é estrutural, porque o aviso fica em `areas/coordenacao/rotas.tsx`, e a API recusa pelo papel (9.0). Se alguém mover o aviso para a `CascaDaEscola`, nenhum teste da web avisa.
3. **D59, "os dois botões têm o mesmo tamanho".** A Tech Spec §9 afirma isso e não há asserção. Comparar o tamanho (`boundingBox`) de "Confirmo que recebi" e "Ver depois" em `incidentes.spec.ts` resolve.
4. **As duas datas.** Em `incidentes.spec.ts:135-136` o teste confere só os rótulos "Quando a Turmma soube" e "Quando o aviso chegou à escola". O teste de unidade prova as funções de texto, mas não que `DetalhesDoIncidente.tsx` liga cada rótulo ao campo certo. Semear `conhecidoHaHoras: 30` e conferir que as duas datas diferem cobriria a troca de campos.
5. **Verificação imediata que pode passar sem provar.** As asserções `incidentes.spec.ts:158` (Enter não confirma) e `:427` (uma confirmação) rodam logo depois da ação, e um pedido atrasado poderia passar despercebido. Hoje outros pontos as cobrem: `:155` e `:160` para o Enter, `:452` para a confirmação. Se essas linhas mudarem, vale esperar a contagem com `expect.poll` ou `waitForTimeout` antes de conferir.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-09 15:35:04 · `tasks/prd-lgpd-e-titular/10_task.md`

VEREDITO: APROVADO

Tela vista: sim (17 fotos lidas: diálogo, faixa e aba, no computador e no celular, na escola cheia e na vazia). Li o código com a foto ao lado.

Estados: ok.
- A aba tem carregando (`Incidentes.tsx:78`), erro com "Tentar de novo" (`Incidentes.tsx:79`), vazio e com dado.
- O vazio diz o que vai acontecer ("o aviso aparece aqui e ao entrar"). Não há ação possível, então não pede uma. O vazio da escola nova está na foto `vazia--...incidentes--computador.png`.
- O diálogo e a faixa não têm carregando nem erro próprios (`AvisoDeIncidente.tsx:59`). Isso é intencional e está documentado; ver a recomendação 2.

Acessibilidade: ok.
- O foco começa no texto, não no botão que confirma (`AvisoDeIncidente.tsx:78`).
- Um Enter a mais não confirma nada, e o e2e prova (`e2e/incidentes.spec.ts:155-158`).
- O Dialogo prende o foco e usa `alertdialog` com a descrição ligada ao título.
- O Esc leva à faixa, e o foco vai para "Ver o aviso" (`AvisoDeIncidente.tsx:45-48`).
- Depois de confirmar na aba, o foco vai para o título do cartão (`Incidentes.tsx:50`).
- O estado é dito em texto e em cor (selo "Aguardando…" ou "Recebimento confirmado em…"), não só em cor.
- Há verificação de violações graves de acessibilidade e de rolagem lateral no e2e.

Chromebook fraco: ok.
- O aviso fica num chunk próprio (`rotas.tsx:17`, import preguiçoso), então a entrada do aluno não cresce.
- A leitura é uma por sessão (`staleTime: Infinity`), sem polling.
- Não há lista longa: são poucos avisos, e o diálogo mostra um por vez.
- A trava do clique duplo é síncrona (`confirmar-o-incidente.ts:27`), pensada para máquina lenta.

Celular: ok.
- Nas fotos a 360 px não há rolagem horizontal, nem texto cortado ou sobreposto.
- O texto longo quebra por `break-words` (`DetalhesDoIncidente.tsx:29`).
- As abas quebram em duas linhas, de propósito (`Abas.tsx`); nenhuma fica escondida.
- "Confirmo que recebi", "Ver depois" e "Ver o aviso" usam o `Botao` principal, de 44 px.
- Nada depende de hover nem de atalho.
- Com o diálogo aberto o "Sair" fica inerte, porque o diálogo é modal. "Ver depois" tem o mesmo tamanho de "Confirmo que recebi" e leva à faixa com o "Sair" a um toque, que o e2e confere (`e2e/incidentes.spec.ts:221-223`). Isso cumpre a D59 e a seção 11.1 do `docs/interface.md`.

Ação oficial protegida: sim.
- Quem confirma vê todos os campos do aviso: o que aconteceu, o que foi alcançado, quantas pessoas, o risco, a contenção, a correção e as datas.
- Vê também o texto fixo "Confirmar diz à Turmma que a coordenação recebeu… Confirmar não comunica a ANPD nem os titulares: isso é da escola."
- O botão é da variante `oficial` e fica desligado enquanto o pedido está no ar.
- A data da confirmação vem do servidor, sem otimismo na tela.
- A falha aparece só no cartão ou aviso que falhou, em português e dizendo o que fazer.

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
1. `AvisoDeIncidente.tsx:56`: o `inicio.current?.focus()` rola o diálogo até o começo do texto. Com texto longo, o título "Aviso de incidente de segurança" e a frase de introdução abrem rolados para fora.
   - Está visível em `coordenacao--coordenacao-governanca--computador.png` e em `...--celular-1.png`: a primeira linha visível já é "2 avisos esperam a sua confirmação".
   - Com o texto realista, de poucas linhas, isso não aparece. Mesmo assim, `focus({ preventScroll: true })` mantém o título à vista ao abrir. O mesmo vale para o `focoInicial` do `Dialogo`.
2. Se a leitura do aviso falhar, a coordenação não vê nada (`AvisoDeIncidente.tsx:59`, `consulta.data === undefined`). O comentário diz que a aba tem o erro. Mesmo assim, o aviso de um incidente de segurança sumir calado é o pior caso. Vale mostrar uma faixa discreta "Não foi possível conferir os avisos de incidente. Abra Privacidade › Incidentes".
3. No diálogo com texto muito longo, "Confirmo que recebi" fica depois da rolagem (`...governanca--computador.png`). Um rodapé de ação fixo no diálogo ajudaria. O foco por teclado já o traz à vista (`toBeInViewport`, `e2e/incidentes.spec.ts:161`), então não é defeito.
4. A foto mostra o que o último e2e construiu. Ela confere com o código da árvore: faixa sem botão de fechar, "Ver o aviso" como único botão, diálogo `alertdialog`.

Arquivos de referência (todos em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/`):
- `apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx`
- `apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx`
- `apps/web/src/areas/coordenacao/privacidade/DetalhesDoIncidente.tsx`
- `e2e/incidentes.spec.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-09 15:35:04 · `tasks/prd-lgpd-e-titular/10_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. A tela só lê o DTO `esquemaIncidenteDaEscola` (`packages/shared/src/privacidade/incidente.ts:52`), que veio da 9.0. Ele não tem `confirmadoPor`, não tem quem registrou o incidente nem dado de outra escola, e o `id` que vem é o da seção da escola, não o do incidente. As categorias aparecem por extenso, e o número de pessoas alcançadas vem como estimativa agregada. Nada identifica um aluno ou outra pessoa.

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok. A tarefa não muda a API. `GET /v1/privacidade/incidentes` e `POST /v1/privacidade/incidentes/:id/confirmar` (`apps/api/src/privacidade/privacidade.controller.ts:33` e `:44`) exigem `@Permite('privacidade_incidentes', …)`, buscam pelo repository com o escopo da escola do token, e o id de outra escola recebe o mesmo `NAO_ENCONTRADO` do id inexistente. Na web, o aviso só aparece na área da coordenação (`apps/web/src/areas/coordenacao/rotas.tsx`), nunca na casca que os três papéis usam.

Também conferi se uma sessão herda dado da anterior. A chave `['privacidade','incidentes']` fica sob `CHAVE_DA_PRIVACIDADE`, e `apps/web/src/main.tsx:26-28` limpa o cache com `resetQueries` a cada troca de sessão ou de escola. Assim, o `staleTime: Infinity` do aviso não mostra a uma escola o incidente de outra.

**Logs:** limpos. Nenhum `console` ou log nos arquivos novos. Quando a confirmação falha, a tela mostra o texto do catálogo (`textoDaFalha`, em `apps/web/src/areas/coordenacao/privacidade/confirmar-o-incidente.ts:39`), nunca o erro cru.

**Auditoria:** presente. A confirmação grava `incidente.confirmado`, com a finalidade `comunicar_o_incidente`, na mesma transação e só quando essa chamada é a que de fato confirmou (`apps/api/src/privacidade/privacidade.service.ts:95-102`, da 9.0). Nesta tarefa nada mais exige auditoria: não há leitura de dado de aluno, exportação, nota, permissão nem saída de IA.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os novos `criarIncidenteNoBanco` e `confirmacaoDoIncidenteNoBanco` (`e2e/__fixtures__/sessao.ts:931-991`) usam textos inventados com marca aleatória e `registrado_por 'equipe-de-teste'`. Todas as fotos mostram só "Colégio sintético…" e "Coordenadora sintética…".

**Fotos da tela:** nada da minha regra aparece onde não devia.
- O diálogo (`coordenacao--coordenacao-governanca--computador.png`, `…--celular-1.png`), a faixa (`…--Ver-depois--*.png`) e a aba (`coordenacao--coordenacao-privacidade-incidentes--Ver-depois--computador-1.png`, `-2.png` e `celular-1…4`) mostram só os textos da operação, as categorias por extenso, a contagem estimada, o risco e as datas.
- O cartão já confirmado diz só "Recebimento confirmado em 09/10/2026, 14:57", sem o nome de quem confirmou, o que respeita a minimização (`textos-dos-incidentes.ts:329`).
- Nas fotos da escola vazia (`vazia--coordenacao--coordenacao-privacidade-incidentes--computador.png`, `vazia--coordenacao--coordenacao-governanca--celular-1.png`), não aparece aviso nem faixa, e a aba fica no estado vazio.

**Pergunta de fechamento:** esta tarefa não muda a resposta. O incidente não guarda dado de titular, só categorias e uma estimativa por escola, e o envio externo não muda.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O texto fixo `TEXTO_DO_QUE_CONFIRMAR_FAZ` (`apps/web/src/areas/coordenacao/privacidade/textos-dos-incidentes.ts:348`) diz "Ficam registrados quem confirmou e quando". Hoje a coordenação não tem tela onde ler o "quem", e ele não deve entrar no DTO desta aba. Vale dizer, quando a tela de auditoria da escola existir, que é lá que ele aparece, para a frase não prometer algo que a tela não mostra.
2. A semente da vitrine com os três incidentes da escola cheia não está no diff (a tarefa manda semear à mão). Se ela virar script em `tools/vitrine/`, que continue com texto inventado e sem nome de escola real.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-09 15:36:23 · `tasks/prd-lgpd-e-titular/10_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As quatro divergências estão registradas na `techspec.md` (§5 e §9) e, onde mudam um cenário, no `cenarios.md`. Nenhuma foi decidida em silêncio.
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx:56` e `:78` (o `focoInicial={inicio}`, que o `Dialogo` foca em `apps/web/src/componentes/Dialogo.tsx:87`). O diálogo abre sem o título e sem a frase que explica o que ele é.
   - **O que acontece:** o foco cai no `div` do linha 86 com `focus()` sem `preventScroll`. Esse `div` fica abaixo do `h2` "Aviso de incidente de segurança" e da descrição "A Turmma registrou um incidente de segurança…". Quando o aviso é mais alto que a janela, o navegador rola o `dialog` até alinhar esse `div` no topo. Com três textos de até 1.000 caracteres, isso é o caso normal.
   - **Onde aparece:** em `.processo/vitrine/coordenacao--coordenacao-governanca--computador.png` o diálogo começa em "2 avisos esperam a sua confirmação. Este é o primeiro.", sem título nem descrição. Em `coordenacao--coordenacao-governanca--celular-1.png` sobra só o fim cortado da descrição.
   - **Efeito:** a coordenadora entra e vê um bloco de texto solto, sem saber que é um aviso de incidente de segurança nem o que fazer com ele. O efeito do linha 56 repete o problema quando o segundo aviso da fila assume o lugar do primeiro.
   - **Nenhum teste pega:** o e2e só confere que o `alertdialog` está visível, nunca que o título está à vista.
   - **Correção exigida:**
     - Manter o foco no texto, sem rolar: `focus({ preventScroll: true })` ou `scrollTop = 0` no `dialog` depois do foco, tanto na abertura quanto na troca para o aviso seguinte.
     - Acrescentar em `e2e/incidentes.spec.ts`, nos testes `› o aviso traz todos os campos…` e `› dois incidentes no diálogo…`, a asserção de que o `heading` "Aviso de incidente de segurança" está `toBeInViewport()` ao abrir e depois de confirmar o primeiro aviso.
     - Refazer as fotos do diálogo.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Privacidade.tsx:32`: o ternário aninhado vai ganhar um terceiro ramo com Pedidos (16.0). Um mapa de `id` para componente lê melhor.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx:22-23`: o comentário diz que trocar de escola desmonta a área e desfaz o "Ver depois". Nenhum teste prova isso. Se a área continuar montada na troca, a escola nova recebe a faixa no lugar do diálogo. Vale um e2e da troca de escola com um aviso pendente na segunda.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx:85`: o `div` que envolve uma única `section` não faz nada e pode sair.

## test-engineer · 2ª rodada · REPROVADO · 2026-10-09 16:05:55 · `tasks/prd-lgpd-e-titular/10_task.md`

VEREDITO: REPROVADO

Cenários exigidos (2ª rodada, só o diff desde a 1ª):
- O diálogo abre no topo, com o título e a frase de apresentação à vista, quando o texto é longo. Isso vale nos três casos em que ele abre: ao entrar, no aviso seguinte depois de confirmar o primeiro, e ao reabrir por "Ver o aviso".
- Cada data aparece no rótulo certo.
- Os dois botões têm a mesma altura, de pelo menos 44 px.
- O efeito do foco devolve o foco à faixa depois de "Ver depois" e do Esc.

Cobertos:
- **Diálogo no topo ao entrar.** `e2e/incidentes.spec.ts:128-130`, com texto longo nos três campos. Só passa com o `scrollTo` e, pela linha de Mutações, fica vermelho se as duas linhas voltarem ao `focus()` com rolagem. Ao entrar, o efeito do `Dialogo` filho roda antes do efeito do aviso, então o `scrollTo` corrige a rolagem.
- **Diálogo no topo no aviso seguinte.** `e2e/incidentes.spec.ts:408-410`, agora com texto longo nos três campos. A dependência `idDoAtual` faz o efeito rodar de novo.
- **Datas pelo rótulo.** `e2e/incidentes.spec.ts:141-145`. O `dd` de cada `dt` é conferido contra a data de hoje, com `conhecidoHaHoras: 30`. Não é frágil: 30 horas sempre caem em outro dia. O `formatarDataHora` e o `toLocaleDateString` rodam no mesmo fuso do navegador (`timezoneId: 'America/Sao_Paulo'` no `playwright.config.ts`), e o formato curto `dd/mm/aaaa` está contido no texto. A mutação que troca os valores fica vermelha.
- **Altura dos botões.** `e2e/incidentes.spec.ts:164-169`. A comparação vale porque o `boundingBox` nulo não passa. A Mutações explica por que só o projeto `celular` prova a altura própria de cada botão.
- **Foco na faixa.** `e2e/incidentes.spec.ts:223,233` continua verde com `adiado` na lista de dependências. A ref do diálogo já é nula quando a faixa está montada, então o efeito novo sai cedo e não rouba o foco.
- **Mutação `preventScroll`.** A Mutações declara que trocar `preventScroll` não deixa nada vermelho, e o motivo é aceitável: é cosmético, evita o salto antes do `scrollTo`, e a prova da regra é a linha do `scrollTo`.
- **Incidentes.tsx.** A retirada do `div` externo não muda comportamento que algum teste prove.

Bloqueantes:
1. **A reabertura por "Ver o aviso" não tem teste que prove o título à vista.**
   - **Onde.** `apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx:63`, a dependência `adiado` em `[idDoAtual, adiado]`. É cláusula nova desta correção, e o comentário em `AvisoDeIncidente.tsx:56-57` diz que ela existe só para esse caso.
   - **O que está errado.** Ao reabrir por "Ver o aviso", o `AvisoDeIncidente` não monta de novo; só o `Dialogo` monta, e ele foca o texto com rolagem (`Dialogo.tsx:87`). Sem `adiado` na lista, o `scrollTo` não roda e o diálogo reabre rolado, sem o título, que é o defeito que fez o `revisor-geral` reprovar a 1ª rodada. Nenhum teste fica vermelho com essa mutação:
     - `"Ver depois" e o Esc…` (`e2e/incidentes.spec.ts:202-233`) e `dois incidentes: os dois esperam…` (`:356-389`) reabrem pela faixa, mas com texto curto, que não rola, e sem `toBeInViewport`.
     - As asserções novas, em `:128-130` e `:408-410`, cobrem só a entrada e o aviso seguinte.
     - A tabela de Mutações de `tasks/prd-lgpd-e-titular/10_task.md` não tem linha para essa dependência.
   - **Correção exigida.**
     - No teste `"Ver depois" e o Esc…` (ou num teste novo), semear o incidente com `textoLongo` nos três campos (`circunstancias`, `contencao`, `correcao`).
     - Depois de `acionar(botao(aFaixa, VER_O_AVISO), hasTouch)` (`e2e/incidentes.spec.ts:227`), afirmar `toBeInViewport()` do título (`TITULO_DO_AVISO`) e da frase "A Turmma registrou um incidente de segurança que afetou dados desta escola.".
     - Acrescentar à Mutações a linha "`useEffect` › `adiado` retirado das dependências", com o teste que fica vermelho, conferida nos dois projetos (`chromebook` e `celular`).

Recomendações:
- O teste do foco ao reabrir pode também afirmar `div[tabindex="-1"]` focado depois de "Ver o aviso". Hoje isso é garantido pelo `focoInicial` do `Dialogo` e não pelo efeito da tarefa, então não bloqueia.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/incidentes.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/10_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/Dialogo.tsx (contexto)

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-09 16:07:00 · `tasks/prd-lgpd-e-titular/10_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o diff r1→r2 (`.processo/ordens/diff-10-r1-r2.txt`) e as fotos refeitas. A 1ª rodada não exigiu correção, então não havia correção para conferir. As minhas duas recomendações estão no `TODO.md`: o "quem" do texto de confirmação e a semente da vitrine.

Campos pessoais tocados: nenhum. O diff mexe em duas coisas de tela: o foco e a rolagem do diálogo em `AvisoDeIncidente.tsx`, e a retirada de um `div` em `Incidentes.tsx`. O resto são asserções novas no e2e. Não muda DTO, API, armazenamento nem envio.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Nenhuma rota ou leitura nova. A leitura `GET /v1/privacidade/incidentes` continua presa à escola ativa e ao papel de coordenação, como foi aprovado na 1ª rodada (a recusa por papel está provada em `apps/api/test/incidente.int.test.ts`, da 9.0).

Logs: limpos. Não há `console` nem `logger` nos arquivos de `apps/web/src/areas/coordenacao/privacidade/` nem em `e2e/incidentes.spec.ts`.

Auditoria: presente, sem mudança desde a 1ª rodada. A confirmação de recebimento grava quem confirmou e quando; o diff não toca nisso.

Envio externo: nenhum.

Seed/fixture: sintético. O texto novo do e2e em `e2e/incidentes.spec.ts:155-156` é inventado: "Contenção", "Correção" e `textoLongo(marca())`. O incidente "conhecido há 30 horas" é só a data relativa (`conhecidoHaHoras: 30`). Nas fotos aparecem só "Colégio sintético da vitrine cheia/vazia" e "Coordenadora sintética", com textos de preenchimento.

Fotos da tela (todas em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/.processo/vitrine/`):
- **O diálogo** (`coordenacao--coordenacao-governanca--computador.png`, `--celular-1.png`, `--celular-2.png`) mostra só categorias de dado ("Conversa do aluno com o Tutor; Respostas e correção…"), a contagem estimada ("1.200 pessoas") e o nível de risco. Não mostra nome, matrícula nem conteúdo de aluno. Com o `scrollTo` novo, o título e a frase de abertura estão à vista.
- **A faixa** (`--Ver-depois--*`) traz só a contagem de avisos pendentes.
- **A aba Incidentes** (`coordenacao--coordenacao-privacidade-incidentes--Ver-depois--computador-1.png` e `-2.png`, celular 1 a 4) mostra o mesmo recorte por categoria. O aviso confirmado aparece com a data de confirmação e sem o nome de quem confirmou, como foi aprovado na 1ª rodada.
- **A Governança** continua agregada, sem nome de professor nem de aluno.
- **A escola vazia** (`vazia--*`) mostra só os estados vazios, sem vazamento.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. Sobre o efeito de `AvisoDeIncidente.tsx:58-63`, que agora também depende de `adiado`: quando a faixa aparece, `inicio.current` é `null` e o efeito para logo no começo. Por isso ele não disputa o foco com o efeito da faixa (`AvisoDeIncidente.tsx:45-48`), e não tem efeito sobre privacidade.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-09 16:07:07 · `tasks/prd-lgpd-e-titular/10_task.md`

VEREDITO: APROVADO

Tela vista: sim (20 fotos lidas, escola cheia e vazia: 3 do diálogo, 3 da faixa em Governança, 6 da aba Incidentes com a faixa, 3 de Governança vazia e 2 de Incidentes vazia). Os 3 arquivos `sessao-*.json` da pasta não são foto e não entraram na contagem. Nas fotos de página inteira, o fundo escurecido do diálogo cobre só a primeira janela (768 px), e a rolagem interna do diálogo aparece cortada em "Risco para as pessoas / Alto". É efeito da captura, não defeito. O código manda: `<dialog>` modal com rolagem própria.

Estados: ok. O código e as fotos mostram vazio ("Nenhum incidente afetou esta escola", com o que fazer) e com dado. Carregando e erro vêm da rodada 1, e o diff não os tocou. A aba tem o erro com "Tentar de novo", e a ausência de faixa quando a leitura falha está no TODO.

Acessibilidade:
- O diálogo é um `alertdialog` descrito pela frase de apresentação.
- O foco inicial está no texto (`tabIndex={-1}`), e não no botão que confirma, então um Enter a mais não confirma nada.
- O foco volta à faixa depois de "Ver depois" ou do Esc.
- Há `role="alert"` para a falha e `role="status"` oculto para "Confirmando…".
- As datas por rótulo usam `dt` e `dd`.
- O correto da correção desta rodada:
  - `preventScroll: true` mais `closest('dialog')?.scrollTo({ top: 0 })`, em `AvisoDeIncidente.tsx:58-63`.
  - O efeito roda depois do foco do `Dialogo` (efeito filho antes do pai), então o título volta à vista também em "Ver o aviso".
  - Com `atual` indefinido ou com a faixa montada, `inicio.current` é nulo e o efeito sai.
- A foto do computador confirma o título e a frase de apresentação à vista com texto longo.

Chromebook fraco: sem peso novo. O aviso é carregado sob demanda (`lazy`), a leitura é uma só por sessão (`staleTime: Infinity`) e não há animação nem efeito de CPU. A lista de incidentes é curta por natureza.

Celular: 360 px sem rolagem horizontal e sem texto cortado nas fotos. Cobriu o diálogo, a faixa em coluna, o texto longo quebrado, os cartões e o estado vazio. Os dois botões do diálogo têm a mesma altura e pelo menos 44 px (prova no e2e), e o "Ver o aviso" da faixa também usa o botão padrão de 44 px. Nada depende de hover.

Ação oficial protegida: sim. A confirmação é "Confirmo que recebi", em variante `oficial`, com o aviso inteiro à vista no diálogo. O texto diz o que a confirmação faz e que não comunica a ANPD. Recusar ("Ver depois") não é mais difícil que aceitar, e o "Sair" continua a um toque (D59).

Pele e texto:
- A pele está na paleta da D72: faixa e estado pendente em laranja-avermelhado e confirmado em verde.
- O texto está em português do Brasil, com datas em dd/mm/aaaa e número com ponto de milhar.
- Não há termo técnico, id nem texto em inglês.
- Não há saída de IA nesta tela.

Bloqueantes: nenhum. As duas correções desta rodada foram feitas. A retirada do `div` externo de `Incidentes.tsx` não mudou o visual: a foto da aba continua igual.

Recomendações:
1. Com texto muito longo, "Confirmo que recebi" fica abaixo da dobra do diálogo e exige rolagem. É aceitável porque o aviso precisa ser lido antes de confirmar e o Tab chega ao botão. A recusa de um rodapé fixo, registrada na 1ª rodada, vale. Reavaliar no `/validar` com aviso real, se o texto da operação vier longo.
2. O texto "Ficam registrados quem confirmou e quando" promete um "quem" sem tela que o mostre. O destino é o TODO já registrado, para quando a auditoria da escola existir.
3. Faixa discreta quando a leitura do aviso falha: já está no TODO, com o texto a decidir com o Gabriel.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/Incidentes.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/incidentes.spec.ts`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-09 16:07:12 · `tasks/prd-lgpd-e-titular/10_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

A correção exigida na 1ª rodada foi feita:
- **O título abre à vista.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx:58-63`, o efeito põe o foco no texto com `focus({ preventScroll: true })` e leva o `dialog` ao topo com `scrollTo({ top: 0 })`. Isso vale ao abrir, no aviso seguinte da fila e ao reabrir por "Ver o aviso".
- **A ordem dos efeitos está certa.** O efeito do `Dialogo` (filho) roda antes do efeito do aviso, então o `scrollTo` desfaz a rolagem que o `focoInicial` provoca. Com `adiado=true` o diálogo desmonta, o `inicio.current` fica `null` e o efeito não tira o foco do "Ver o aviso".
- **O e2e prova o título à vista.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/incidentes.spec.ts`, o título e a frase descritiva estão em `toBeInViewport()` ao abrir e depois de confirmar o primeiro aviso, agora com texto longo nos três campos. A tabela de mutações mostra que tirar o `scrollTo` deixa os dois testes vermelhos.
- **As fotos foram refeitas.** Em `coordenacao--coordenacao-governanca--computador.png` e `coordenacao--coordenacao-governanca--celular-1.png`, o diálogo abre com "Aviso de incidente de segurança" e a frase que diz o que ele é no alto, seguidos da fila "2 avisos esperam a sua confirmação. Este é o primeiro."
- **O resto do diff está certo.** O `div` solto saiu de `Incidentes.tsx`. As cinco recomendações que ficaram sem aplicar estão no `TODO.md` e na tabela "Recomendações sem aplicar" do `10_task.md`. A Tech Spec §5 e §9 e o `cenarios.md` registram como ficou no código.

Recomendações:
- Falta teste da reabertura por "Ver o aviso" com texto longo, que é o motivo da dependência `adiado` no efeito. O `test-engineer` já cobrou e a correção vem na próxima ordem, então não bloqueio por isso. Confira que o teste novo verifica o título com `toBeInViewport()` depois do "Ver o aviso".
- O `preventScroll: true` sobreviveu à mutação: o `scrollTo` logo depois já cobre o caso, e nenhum dos 20 testes ficou vermelho. A justificativa no `10_task.md` (evitar o salto visível) é aceitável. Se preferir ficar só com o que é provado, o `scrollTo` sozinho basta.

## test-engineer · 3ª rodada · APROVADO · 2026-10-09 16:14:51 · `tasks/prd-lgpd-e-titular/10_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** o mesmo conjunto das rodadas anteriores. Esta 3ª rodada audita só o diff r2→r3, que muda dois arquivos: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/incidentes.spec.ts` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/10_task.md`. Nenhum arquivo de `apps/web` mudou.

**Cobertos:** a correção exigida na 2ª rodada (reabrir por "Ver o aviso" com o título à vista) foi feita por inteiro.
- **Semeadura:** o teste `"Ver depois" e o Esc…` (`e2e/incidentes.spec.ts:206`) agora semeia `textoLongo` nos três campos (`circunstancias`, `contencao`, `correcao`). É a mesma carga que já faz o diálogo passar da janela nos testes que provam o `scrollTo` (linhas 111 e 400–401).
- **Asserções:** depois de `acionar(botao(aFaixa, VER_O_AVISO), hasTouch)` vêm, em `e2e/incidentes.spec.ts:231-233`, o título com `toBeInViewport()`, a frase "A Turmma registrou um incidente de segurança que afetou dados desta escola." com `toBeInViewport()`, e `div[tabindex="-1"]` com `toBeFocused()`. A asserção de foco era recomendação na 2ª rodada e foi acatada.
- **Mutação:** a linha nova da Mutações (`10_task.md`) cobre a retirada de `adiado` de `[idDoAtual, adiado]` e fica vermelha nos dois projetos. Pelo código, a afirmação procede. Em `AvisoDeIncidente.tsx:68-80` o diálogo sai da árvore quando `adiado` é verdadeiro e volta a ser montado em "Ver o aviso". Sem `adiado` nas dependências, o efeito das linhas 58-63 não roda de novo, porque `idDoAtual` não muda. Sobra só o foco com rolagem do `Dialogo` (`focoInicial={inicio}`), que leva o começo do `div` longo para o topo e deixa título e frase acima da janela. As duas asserções `toBeInViewport` falhariam com a regra removida.

**Bloqueantes:** nenhum.

**Recomendações:**
- A asserção `div[tabindex="-1"]` com `toBeFocused()` (`e2e/incidentes.spec.ts:233`) não pega a mutação de `adiado`, porque o `Dialogo` já foca esse `div` pelo `focoInicial`. Ela documenta o foco no começo do texto, mas a prova da regra fica com as duas asserções `toBeInViewport`. Fica o registro para quem ler a Mutações não atribuir a ela o vermelho.

Não rodei o e2e com a mutação aplicada. O vermelho nos dois projetos vem do registro da implementação e bate com a minha leitura do código.
