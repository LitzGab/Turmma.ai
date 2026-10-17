# Achados das revisões — `tasks/prd-telas-da-coordenacao/12_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## frontend-reviewer · 1ª rodada · APROVADO · 2026-10-17 00:19:07 · `tasks/prd-telas-da-coordenacao/12_task.md`

VEREDITO: APROVADO

Tela vista: sim (7 fotos lidas: lista no computador, no celular em duas partes, e vazia nos dois; detalhe do pedido no computador e no celular, escola cheia). Os pedidos da cheia foram semeados à mão. As fotos batem com o código da árvore.

Estados: ok.
- Carregando e erro com "Tentar de novo" estão em `Pedidos.tsx:104-108` e em `DetalheDoPedido.tsx:129-153`, e o `Pedidos.test.tsx` os cobre.
- O vazio é um convite: "Nenhum pedido registrado… registre aqui". O aviso do aluno e "Registrar pedido" continuam à vista nele.
- Com dado, a lista tem o vencido em texto e a falha de "Ver mais pedidos" não apaga o que já foi lido.

Acessibilidade: ok.
- A linha tem um link só, com o tipo do pedido no nome acessível ("Nome, Correção de dados"). O nome acessível contém o texto visível, como a WCAG 2.5.3 pede.
- O "Voltar para Pedidos" também contém o texto "Pedidos".
- O vencido é texto mais ícone na família `erro`, nunca só cor.
- O link do detalhe tem `min-h-11`.
- O e2e inclui `violacoesGraves` nos dois viewports.

Chromebook fraco: ok.
- A lista é paginada de 50 em 50, com "Ver mais pedidos".
- O prazo é calculado de `chegouEm` no cliente, sem chamada a mais, e há teste que prova uma leitura só por abertura.
- Não há imagem, animação nem biblioteca nova.

Celular: ok.
- Em 360 px a tabela vira lista, sem rolagem de lado e sem texto cortado. O "Prazo" aparece em cada item, e o vencido quebra em duas linhas sem esconder nada.
- "Registrar pedido" e "Ir para as turmas" ficam em ~44 px. O link do nome ocupa a linha inteira, então não depende de hover nem de atalho.
- O e2e cobre `larguraExcedente` e o toque fora do nome, nos projetos de computador e de celular.
- A barra inferior fixa aparece no meio das fotos longas do celular. É efeito da captura de página inteira, não defeito.

Ação oficial protegida: sim. `AcoesDoPedido.tsx` e `RegistrarPedido.tsx` não foram alterados. O detalhe continua mostrando pessoa, pedido e situação antes de "Concluir". A leitura continua auditada, e a lista não relê no foco nem com a rede que volta.

Bloqueantes: nenhum.
- Nenhum termo técnico, id ou texto em inglês na tela. Os sufixos como "c8826d56" nos nomes são do dado sintético da vitrine.
- A paleta e a pele seguem o sistema da D80, e o detalhe usa a largura de leitura de 880 px.
- "Estrutura" saiu de todos os textos, que agora dizem "Escola › Turmas".
- O e2e não perdeu asserção: só trocou os nomes dos links e acrescentou os casos novos.

Recomendações:
- `Pedidos.tsx:63` (coluna "Chegou em") e `:70-74` (coluna "Prazo"). A mesma linha mistura "14 de outubro de 2026" com "até 29/10/2026". Os dois são formatos locais, mas um só deixaria a leitura mais limpa.
- `Pedidos.tsx:53-58`. O foco por teclado desenha o anel só no nome. Como o link cobre a linha, vale um `focus-within` na linha, em `Tabela.tsx`, para o anel marcar a linha toda. Pode ir para o `/retro`.
- `Tabela.tsx:62` e `:96`. O `relative` na linha e no item vale para toda `Tabela`. A tarefa 5.0 faz a mesma mudança, então o merge deve juntar as duas sem conflito. Confira ao juntar.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/Tabela.tsx

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-17 00:19:20 · `tasks/prd-telas-da-coordenacao/12_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A lista e o detalhe mostram o que já mostravam (nome do titular, turma, tipo, quem pediu, chegada, situação). O prazo é calculado na tela a partir de `chegouEm` e `estado`, que o DTO já trazia. A tarefa não acrescenta chamada, campo de DTO, migration nem contrato.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. O backend não mudou. O link da linha leva só o id do pedido (`caminhoDoPedidoDoTitular(pedido.id)`). O detalhe continua respondendo igual para "não encontrado" e para pedido de outra escola, e a tela mostra um único texto, `TEXTO_DO_PEDIDO_AUSENTE`, nos dois casos. O teste disso está em `DetalheDoPedido.test.tsx` e em `e2e/pedido-do-titular.spec.ts:606`.

Logs: limpos. Nenhum `console` nem `logger` nos arquivos da privacidade.

Auditoria: presente. A leitura do detalhe continua gerando um `pedido.lido` por abertura. O e2e que prova isso (`e2e/pedido-do-titular.spec.ts:165-169`) passou a abrir pelo link novo, sem perder asserção. A lista continua com uma leitura por abertura, sem releitura no foco nem quando a rede volta. Isso agora tem teste de componente: `apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx`, bloco "uma leitura por abertura". Concluir, cancelar, corrigir e baixar não mudaram, e os testes de auditoria deles seguem iguais.

Envio externo: nenhum.

Seed/fixture: sintético. Os nomes são inventados ("Pessoa N", "Ana Souza", "Vera <marca> Lopes", "Bia <marca> Reis"), os ids são UUID fixos de teste e as datas são relativas a "hoje".

Bloqueantes: nenhum.

Recomendações:
- Com a linha inteira virando link, fica mais fácil abrir um detalhe sem querer, e cada abertura vira um `pedido.lido` na auditoria. Não é vazamento: a leitura é real e fica registrada. Só vale a pena olhar o efeito no ruído da auditoria quando a consulta de auditoria da coordenação ganhar filtro por finalidade (destino: `/retro`).
- O `aria-label` do link (`${nome}, ${tipo}`) repete na leitura de tela o que já aparece na linha. Não expõe nada novo, mas qualquer coluna acrescentada no futuro ao nome acessível do link precisa ser só dado que já aparece na linha.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/textos-dos-pedidos.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/componentes/Tabela.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/pedidos-do-titular.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/pedido-do-titular.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/__fixtures__/pedidos-do-titular.ts

Pergunta de fechamento: a tarefa não muda o que o sistema guarda sobre o aluno nem para onde isso é enviado. A lista de compartilhamento do detalhe ("Empresas que receberam dado desta pessoa") continua no lugar, em tabela, e é ela que responde à secretaria. Se a pergunta for respondida hoje, a resposta é a mesma de antes desta tarefa.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-17 00:20:38 · `tasks/prd-telas-da-coordenacao/12_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum

O que conferi:
- **Subtarefas 12.1 a 12.6 estão todas feitas:**
  - a coluna "Prazo" sai de `prazoDoPedido`/`textoDoPrazo` com o `Estado` da família, e a ordem continua a da chegada;
  - há um link por linha, esticado pela linha, com o tipo do pedido no nome acessível;
  - "Ir para as turmas" e "Escola › Turmas" aparecem nos cinco textos citados, e a frase "O prazo de cada um aparece no detalhe" saiu;
  - o detalhe abre como página de leitura nos três estados, com "‹ Pedidos" e o prazo no topo;
  - o m3 está marcado no TODO.
- **Nada do que estava fora do escopo entrou:** m4, m5, avisos, encaminhamento e sino ficaram de fora, e `AcoesDoPedido.tsx` e `RegistrarPedido.tsx` não mudaram.
- **As duas divergências estão registradas na `techspec.md`.** A mudança na `Tabela` está na §9, com a frase acrescentada nesta tarefa. Os testes de componente a mais estão cobertos pela §10. A spec não tem `cenarios.md`.
- **A mudança em `Tabela.tsx` não afeta as outras telas.** Ela deixa `tr` e `li` como `relative`, e nenhuma das outras 11 telas que usam `Tabela` põe `Menu` ou elemento `absolute` na célula. Só Pedidos usa `after:absolute`. O e2e novo prova que, com duas linhas, um toque em cada linha abre o pedido dela.
- **O "‹ Pedidos" segue o padrão da coordenação:** `aria-label="Voltar para Pedidos"` com o texto "Pedidos" à vista, igual a `Agentes.tsx:70` e `ListaDaTurma.tsx:125`.
- **Nenhuma leitura auditada a mais:** o prazo é calculado na tela a partir de `chegouEm`, e o teste confirma que o foco e a volta da rede não fazem uma segunda chamada.
- **Os testes estão limpos:** nenhum `.skip`, `any` ou `TODO` nos testes novos. Os e2e de hoje mantêm as asserções que tinham e trocam só os nomes.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/TODO.md:502`: o m5 tinha destino na X2 e agora diz "continua sem spec", sem dono nem momento. Vale dar a ele um destino, por exemplo a próxima correção ou tarefa que mexer em `AcoesDoPedido.tsx`, para não ficar órfão.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/pedido-do-titular.spec.ts:92` (e as linhas 592, 623 e 635), e `e2e/pedidos-do-titular.spec.ts:733`: `getByRole('link', { name: nome })` perdeu o `exact` e agora casa por pedaço do nome. Hoje funciona porque `marca()` torna os nomes únicos. Usar o nome inteiro (`` `${nome}, ${tipo}` ``, `exact: true`) deixaria a busca tão firme quanto antes.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx:210`: o título do teste diz "no computador e no celular", mas ele só confere o `tr`. O celular está no teste da linha 229. Basta tirar "e no celular" do título.

## test-engineer · 1ª rodada · APROVADO · 2026-10-17 00:20:58 · `tasks/prd-telas-da-coordenacao/12_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- Caminho feliz: a lista mostra o prazo de cada pedido, a linha inteira abre o detalhe do próprio pedido, e o detalhe abre como página de leitura, com o prazo no topo e "‹ Pedidos".
- Bordas do prazo: pedido aberto, pedido que vence hoje, pedido vencido há N dias (família `erro`, com ícone), e concluído ou cancelado antigos sem prazo a cumprir. O dia conta pelo fuso de São Paulo.
- Ordem: continua a da chegada, e o vencido não sobe.
- Titular eliminado: a linha continua com link, e o nome acessível leva o tipo do pedido.
- Duas linhas: o link esticado de uma não cobre a outra.
- 360 px: a tabela vira lista com "Prazo" em cada item, sem rolagem de lado.
- Os quatro estados da lista, incluindo a falha de "Ver mais pedidos" sem apagar o que já foi lido.
- Uma leitura por abertura: sem nova leitura quando a janela volta ao foco ou a rede volta.
- O detalhe em carregando e em "não se acha" também é página de leitura.
- Os textos de 12.3: "Escola › Turmas" e "Ir para as turmas", no mesmo endereço.
- Permissão e isolamento: a tarefa não traz endpoint, query nem DTO novos. Os casos de outra escola continuam nos e2e de hoje, e o diff não tira nenhuma asserção deles.

Cobertos:
- Rodei `npx vitest run --project unidade` nos quatro arquivos de teste da tarefa: 4 arquivos e 66 testes verdes. Os e2e eu não rodei.
- Cada cláusula nova do diff tem bloco de mutação, e cada bloco cai num teste que chega a ela:
  - A coluna "Prazo": tanto trocar o dia de hoje por `chegouEm` quanto trocar o título deixam o teste vermelho.
  - O `aria-label` com o tipo, o `after:absolute after:inset-0` e o `relative` no `tr` e no `li` da `Tabela` têm bloco cada um.
  - O apoio do cabeçalho sem "O prazo de cada um aparece no detalhe".
  - "Ir para as turmas" na lista e no detalhe.
  - `largura="leitura"` nas três `Tela` do detalhe.
  - O "‹ Pedidos": `aria-label` e texto.
  - O prazo antes de "O pedido" (o teste usa `compareDocumentPosition`).
  - Os cinco textos de "Escola › Turmas".
  - A mudança do comentário em `DetalheDoPedido.tsx:193` não é cláusula.
- O comportamento da linha inteira está provado de verdade no e2e `e2e/pedidos-do-titular.spec.ts:589-646`:
  - O clique ou toque cai em "Quem pediu", fora do nome, com `force`, e por isso só passa se o link esticado estiver por cima.
  - Com duas linhas, a primeira precisa abrir o próprio id. Sem o `relative`, o link da última linha venceria.
  - O mesmo teste prova o vencido em texto, o ícone, a `data-tela="leitura"`, o prazo acima de "O pedido", sem rolagem de lado e sem violação grave nos dois projetos.
- Não há asserção perdida nos e2e de hoje: as mudanças só trocam o nome dos links, e não sobrou nenhum seletor com "Voltar para os pedidos" ou "Ir para a Estrutura" em `e2e/`.
- Não há `.skip`, teste comentado nem mock de coisa nossa. A rede é falsa pelo `__fixtures__/tela`, só o `Date` é falso, e `matchMedia` e `ResizeObserver` são API do navegador. A tarefa não envolve IA.
- Concorrência não se aplica: a tarefa não grava nada.

Bloqueantes: nenhum.

Recomendações:
1. `apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx:100`: o uso do dia de São Paulo na lista não tem caso de borda próprio.
   - O `hojeEmSaoPaulo` em si está provado em `textos-dos-pedidos.test.ts:175`.
   - Com `AGORA = 2026-10-16T15:00Z` (`Pedidos.test.tsx:23`), trocar a chamada pelo dia em UTC não deixa nenhum teste vermelho.
   - Correção sugerida: um caso com `AGORA = 2026-10-17T01:00Z` (22h de 16/10 em São Paulo) e um pedido que vence em 16/10. Ele precisa dizer "vence hoje", e não "vencido há 1 dia".
2. `apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx:75`: o nome do teste diz "e erro", mas ele só exercita o 404.
   - O erro que não é 404 passa pelo mesmo `Tela`, então a cláusula está coberta.
   - Acrescentar uma resposta 500 que mostra "Tentar de novo", ou tirar "e erro" do nome.
3. `apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx`: falta o caso que justificou o nome acessível novo, "uma pessoa pode ter dois pedidos" (`techspec.md` §9).
   - Sugestão: a mesma pessoa com dois pedidos de tipos diferentes na lista, cada um com o próprio nome acessível e o próprio `href`.
   - Também vale cobrir dois alunos homônimos.
4. `Pedidos.test.tsx:210-218` prova o `after:inset-0` e o `relative` pela presença da classe, o que é detalhe de implementação.
   - O comportamento está provado no e2e, então não bloqueia.
   - Vale um comentário no teste apontando o e2e que prova o clique de verdade.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/12_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/pedidos-do-titular.spec.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/e2e/pedido-do-titular.spec.ts

## test-engineer · 2ª rodada · APROVADO · 2026-10-17 00:31:13 · `tasks/prd-telas-da-coordenacao/12_task.md`

VEREDITO: APROVADO

Cenários exigidos (2ª rodada, só o diff desde a 1ª):
- Item 1: o dia de São Paulo na lista, com uma mutação que troca `hojeEmSaoPaulo()` pelo dia em UTC.
- Item 2: a mesma pessoa com dois pedidos, e dois homônimos.
- Item 3: o erro que não é 404 no detalhe.
- Itens 4 e 5: o título do teste de classe e o comentário que aponta o e2e.
- Item 6: a busca do link no e2e ancorada no nome inteiro.
- Item 7: o m5 do `TODO.md` com dono e momento.

Cobertos:
- **Item 1:** coberto em `apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx:161-171`. O relógio fica em `2026-10-17T01:00Z`. `VENCE_HOJE` chegou em 01/10, e o prazo dele vence em 16/10. Com o dia em UTC, a tela diria "vencido há 1 dia", e o teste afirma "O prazo vence hoje, 16/10/2026", `data-estado="pendente"` e a ausência de "vencido há". A mutação nova está em `12_task.md:92-97`, e a linha alvo existe (`Pedidos.tsx:100`). O teste chega à cláusula pelo motivo certo.
- **Item 2:** coberto em `Pedidos.test.tsx:222-235`. A Ana Souza tem dois pedidos de tipos diferentes, e há uma segunda Ana Souza em outra turma. O teste afirma o `aria-label` e o `href` de cada um, na ordem. Ele falharia se o tipo saísse do nome acessível (`Pedidos.tsx:52`) ou se o link apontasse para o id errado. Não precisa de bloco novo, porque não há cláusula nova de produção.
- **Item 3:** coberto em `DetalheDoPedido.test.tsx:87-93`, com um 429 `LIMITE_EXCEDIDO` em vez do 500 sugerido. O teste afirma "Tentar de novo", a largura de leitura e o "Voltar para Pedidos". Com isso, o título deixou de prometer mais do que prova.
- **Itens 4 e 5:** feitos. Os títulos que os blocos de "Mutações" citam continuam achando os testes. Conferi os 22 `teste:` contra os títulos atuais, e todos casam por prefixo.
- **Item 6:** coberto por `linkDoPedido`, em `e2e/__fixtures__/pedidos-do-titular.ts:118`. O nome entra escapado e ancorado em `^<nome>, `, e os cinco pontos dos dois e2e usam o fixture. O motivo de não usar o `exact` com o tipo está em "Recomendações sem aplicar".
- **Item 7:** o m4 e o m5 ganharam momento e dono no `TODO.md`. O formato misto das datas também entrou lá.
- Rodei `npx vitest run` nos dois arquivos de teste da tela: 24 testes verdes. Não há `.skip`, não há mock novo, e nenhum arquivo de produção mudou.

Bloqueantes: nenhum.

Recomendações:
- `e2e/__fixtures__/pedidos-do-titular.ts:118`: `linkDoPedido` ainda aceita qualquer tipo depois da vírgula. Onde o tipo estiver à mão, fica mais firme passá-lo como argumento opcional.
- `DetalheDoPedido.test.tsx:87`: o comentário diz "o limite de pedidos", mas o código de erro é o genérico `LIMITE_EXCEDIDO`. Ajustar o texto evita supor que ele é próprio dos pedidos.

Arquivos lidos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/.processo/ordens/diff-12_task-r2.patch
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/Pedidos.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.test.tsx
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-da-coordenacao--l1/tasks/prd-telas-da-coordenacao/12_task.md
