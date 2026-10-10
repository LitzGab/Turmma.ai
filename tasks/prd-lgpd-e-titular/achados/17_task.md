# Achados das revisões — `tasks/prd-lgpd-e-titular/17_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-10 15:14:30 · `tasks/prd-lgpd-e-titular/17_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Prazo:** "faltam N dias" com a data, vencido com o ícone, concluído sem prazo, o dia do vencimento ainda é prazo, e cada abertura auditada.
- **Compartilhamento:** a empresa pelo nome cadastrado, a não cadastrada dita como tal, a origem de cada linha e o aviso de que a escola precisa avisar as empresas.
- **Ações:** concluir (o botão desliga no envio e o clique duplo conclui uma vez); corrigir o nome (atual e novo, igual ao atual recusado, auditoria sem nome); cancelar a eliminação (o acesso volta).
- **Baixar:** a finalidade da lista, o aviso, o nome do arquivo, a auditoria, e a falha com conta ativa.
- **Preparação:** relê a cada 10 s, para com a aba escondida, vira "pronto" sem recarregar e para de reler.
- **Recomeço:** segunda pessoa, resposta atrasada, troca de pedido com o diálogo aberto.
- **Estados:** os quatro, em `chromebook` e `celular`, com acessibilidade.
- **Isolamento e permissão:** pedido de outra escola, professor ou aluno.
- **Concorrência:** clique duplo em concluir, com chamadas em paralelo na API.

**Cobertos:**
- **Unidade:** prazo, ações, nome, orientação, falhas, empresas, o relógio de 10 s e a aba escondida (`preparacao-do-arquivo.test.ts`); a consulta sem releitura no foco nem na volta da rede, `gcTime: 0` e o id escapado (`privacidade.test.ts`, `caminhos.test.ts`); a âncora do download (`baixar-por-url.test.ts`). Os 58 testes passam.
- **e2e:** concluir com clique duplo segurado na rota, segunda pessoa, resposta atrasada, trocar de pedido, corrigir o nome conferido no banco e na auditoria, cancelar, cancelamento que já não vale, baixar com `waitForEvent('download')`, conta ativa, os quatro estados e o titular eliminado.
- **Na API** (`apps/api/test/pedido-titular.int.test.ts`): isolamento (:912), permissão de professor e aluno (:486) e clique duplo em paralelo no concluir (:1067).

**Bloqueantes:**

1. **O teste do prazo falha todo dia entre 21h e 24h de São Paulo.**
   - **Onde:** `e2e/__fixtures__/sessao.ts:1102`, com efeito em `e2e/pedido-do-titular.spec.ts:126` e `:140`.
   - **O que está errado:** o semeador grava `chegou_em = current_date - $5`, e `current_date` vem do Postgres em UTC: `infra/compose.yml` não define `TZ`. A tela (`hojeEmSaoPaulo`) e a expectativa (`somarDiasAHoje`, em `America/Sao_Paulo`) contam pelo dia de São Paulo. Das 21h à meia-noite o dia em UTC já virou, e o teste espera "Faltam 4 dias" quando a tela mostra 5, e "vencido há 5 dias" quando mostra 4.
   - **Correção:** gravar `(now() at time zone 'America/Sao_Paulo')::date - $5::int`, ou passar o dia já calculado por `somarDiasAHoje(-chegouHaDias)`.

2. **As verificações de "parou de reler" no e2e não falham com a regra removida.**
   - **Onde:** `e2e/pedido-do-titular.spec.ts:524-525` (aba escondida) e `:538-540` (depois de pronto). A ligação da regra à tela está em `apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx:84-87` (`agendarPreparacao(estado, ler, document)` dentro do `useEffect` com `[estado]`).
   - **O que está errado:**
     - `page.clock.fastForward` dispara cada timer no máximo uma vez, e o evento `request` chega ao processo do teste de forma assíncrona. A contagem é lida na linha seguinte, sem esperar nada. Uma leitura indevida chegaria depois do `expect`.
     - Na prática, um mutante que releia sempre (`agendarRelitura(ler, document, 10_000)` no lugar de `agendarPreparacao`, ou um objeto de aba sempre visível no lugar de `document`) passa no e2e.
     - Essa ligação só é provada pelo e2e, e ela não tem linha em "Mutações".
     - Ler o detalhe de um pedido `pronto` a cada 10 s enche a auditoria (regra 20, item 10).
   - **Correção:** depois de cada janela, disparar uma leitura conhecida e esperar a resposta dela antes de contar. As leituras chegam em ordem, então uma leitura indevida já estaria contada:
     - na aba escondida, use a volta da aba;
     - depois de pronto, use o "Atualizar".
     
     O padrão: `await Promise.all([page.waitForResponse(r => ehODetalhe(new URL(r.url())) && r.request().method() === 'GET'), <gatilho>])`, depois `expect(leituras).toBe(anterior + 1)`. Acrescente também a linha da ligação em "Mutações".

3. **A linha 141 de "Mutações" não fica vermelha.**
   - **Onde:** `DetalheDoPedido.tsx:91`.
   - **O que está errado:** com a condição trocada por `estado === 'pronto'` (ou `true`), todo pedido aberto já `pronto` anuncia "O arquivo ficou pronto." ao carregar, o que é um anúncio falso para o leitor de tela. Nenhum teste confere a ausência desse anúncio: os testes que abrem pedido pronto (`spec:290`, `:320`, `:665`) só olham outros textos. A metade `anterior.current === 'em_preparacao'` fica sem prova.
   - **Correção:** no teste "a leitura que estava no ar…", logo depois da linha 290, acrescentar `await expect(anuncios(page).filter({ hasText: 'O arquivo ficou pronto.' })).toHaveCount(0)`.

**Recomendações:**
- `spec:583`: o comentário diz "outra escola, inexistente e o apagado respondem igual", mas só o id sorteado é testado. Semear um pedido de outra escola e abrir o endereço dele custa pouco e prova o mesmo texto na tela. Na API isso já está provado em `pedido-titular.int.test.ts:912`.
- `spec:648`: o host `127.0.0.1:28343` está fixo no teste. Se a porta mudar, a asserção passa sem verificar nada. Melhor tirar a URL da resposta interceptada de `POST …/arquivo`.
- Falta o clique duplo em "Baixar o arquivo", onde cada clique é um download auditado: `doisCliquesNoMesmoInstante`, uma chamada `POST /arquivo` e uma linha `titular.arquivo_baixado`.
- O nome do teste de `privacidade.test.ts` "…não o da leitura que estava no ar" promete mais do que testa: não há leitura no ar. Renomear, ou segurar a primeira leitura no teste.
- `spec:305`: o `waitForTimeout(500)` pode ser trocado por esperar a promessa do `rota.fulfill` da leitura segurada.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedido-do-titular.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/__fixtures__/sessao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/__fixtures__/pedidos-do-titular.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/AcoesDoPedido.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.ts` e `.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/preparacao-do-arquivo.ts` e `.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/privacidade.ts` e `.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/caminhos.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/baixar-por-url.test.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-10 15:17:51 · `tasks/prd-lgpd-e-titular/17_task.md`

**VEREDITO: APROVADO**

A tarefa 17.0 é só de web e de e2e. Não cria campo, migration, log nem envio externo. Os pontos de LGPD que ela toca (leitura auditada, download por URL assinada, correção de nome, compartilhamento) estão certos no código e nas fotos.

**Campos pessoais tocados:** só os que a 16.0 já trazia. São o nome e a turma do titular (`esquemaTitularDoPedido`, só `nome` e `turmas`, sem matrícula) e a foto do compartilhamento. O nome novo da correção vai no corpo do `POST` e nunca na URL, e um teste prova isso (`apps/web/src/api/privacidade.test.ts`, "o nome novo e a finalidade vão no corpo da chamada").

**Fora da tabela de dados do docs/lgpd.md:** nada.

**Autorização por objeto:** ok.
- O endereço leva só o id do pedido, escapado (`apps/web/src/caminhos.ts`, `caminhoDoPedidoDoTitular`).
- O pedido inexistente e o de outra escola caem no mesmo texto, "Este pedido não está mais disponível nesta escola" (`DetalheDoPedido.tsx`, ramo `naoAchado`). A foto `coordenacao--coordenacao-privacidade-pedidos-00000000-…--computador.png` mostra isso.
- Na API, o isolamento e o bloqueio de professor e aluno já estão provados em `apps/api/test/pedido-titular.int.test.ts:912` e `:486`.

**Logs:** limpos. Não há `console` nem logger nos arquivos novos.
- O título da aba do navegador é fixo, "Pedido de titular", sem nome.
- O detalhe sai do cache quando a tela fecha (`gcTime: 0`), e as ações também (`useEnvioUnico` usa `gcTime: 0`).
- O nome do arquivo anunciado é `meus-dados-AAAA-MM-DD.json`, sem nome de pessoa.

**Auditoria:** presente, e o e2e confere no banco:
- cada leitura do detalhe grava `pedido.lido` (`privacidade.service.ts:287`);
- concluir grava `pedido.concluido`;
- cancelar grava `pedido.cancelado`;
- a correção grava `pedido.nome_corrigido`, e o e2e prova que não leva nem o nome anterior nem o novo (`e2e/pedido-do-titular.spec.ts:408-409`);
- o download grava `titular.arquivo_baixado` com a finalidade (`privacidade.service.ts:361`). A finalidade vem de uma lista fechada e exclui `acesso_do_proprio_titular`.

A tela também não relê o detalhe sozinha quando a janela volta ao foco ou a rede volta (`refetchOnWindowFocus`/`refetchOnReconnect: false`, com teste). Isso evita encher a auditoria.

**Envio externo:** nenhum. O arquivo sai por URL assinada de 5 minutos, entregue por uma âncora temporária (`apps/web/src/componentes/baixar-por-url.ts`). A URL não fica guardada na tela, e o diálogo avisa para entregar o arquivo e apagá-lo do computador. A versão da escola só existe quando a pessoa já não tem conta ativa.

**Seed/fixture:** sintético. São "Aluno Sintético Caio", "Aluna Sintética Lia" e "Professora Sintética Helena", com sufixo aleatório, e o semeador `criarPedidoDoTitularNoBanco` (`e2e/__fixtures__/sessao.ts`) não traz dado real.

**Fotos:**
- O titular eliminado aparece só como "Titular eliminado", com a turma "Não consta" (`…Titular-eliminado--celular.png`).
- A coordenação vê o nome no detalhe, o que está certo: é ela quem atende o pedido, e cada abertura fica auditada.
- Na foto do computador, o detalhe da "Aluna Sintética Lia" e o do titular eliminado saíram em branco, provavelmente tirados antes de a página carregar. Conferi esses dois pelas fotos do celular. A qualidade da foto é com o `frontend-reviewer`.

**Pergunta de fechamento:** sim. O detalhe mostra por quais empresas passou dado da pessoa, e o arquivo de acesso reúne o que a escola guarda dela. Esta tarefa melhora a resposta.

**Bloqueantes:** nenhum.

**Recomendações:**
1. O bloqueante 2 do `test-engineer` também é assunto de auditoria. O e2e não prova que a tela para de reler com a aba escondida ou com o pedido já pronto (`e2e/pedido-do-titular.spec.ts:524-525` e `:538-540`). Se a ligação em `DetalheDoPedido.tsx:84-87` quebrar, cada releitura grava um `pedido.lido`. Já é correção exigida pelo `test-engineer`; não repito como bloqueante, mas confira junto quando a correção vier.
2. Em `e2e/pedido-do-titular.spec.ts:648`, a verificação de que a URL assinada não aparece na página usa o host `127.0.0.1:28343` fixo. Se a porta mudar, o teste passa sem verificar nada. Melhor tirar a URL da resposta de `POST …/arquivo`, como o `test-engineer` também recomendou.
3. Falta um teste do clique duplo em "Baixar o arquivo": o esperado é uma chamada e uma linha `titular.arquivo_baixado`, porque cada clique é um download auditado.
4. O comentário em `AcoesDoPedido.tsx`, em `DialogoDeBaixar`, diz que a URL "nunca vai a estado". Com `gcTime: 0` isso vale na prática, mas `mutacao.data` guarda a URL enquanto o diálogo está montado. Vale ajustar o texto para não prometer mais do que o código faz.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/AcoesDoPedido.tsx`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/textos-do-pedido.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/privacidade/preparacao-do-arquivo.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/api/privacidade.ts` e `privacidade.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/componentes/baixar-por-url.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/caminhos.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/__fixtures__/sessao.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedido-do-titular.spec.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/privacidade.service.ts` (só leitura)

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-10 15:18:21 · `tasks/prd-lgpd-e-titular/17_task.md`

VEREDITO: REPROVADO

**Escopo:** respeitado. "Meus dados" (18.0) não foi tocado. Tirar a `agendarRelitura` de `atualizacao-dos-pedidos.ts` e levar ajudantes do e2e para `e2e/__fixtures__/pedidos-do-titular.ts` é só reaproveitamento, não trabalho de outra tarefa.

**Aderência à Tech Spec:** uma divergência, em `techspec.md` §9, "Tarefa 17.0, como ficou no código": o texto diz que a ação relê o detalhe e a lista, e o código relê só o detalhe. As outras divergências da tabela da tarefa estão registradas na `techspec.md` §9, no `cenarios.md` e no `docs/interface.md`.

**Portão local:** carimbo válido para o código atual (typecheck, lint, segredo, dependências, unidade, alvo).

**Bloqueantes:**

1. **A página fica em branco enquanto o pedaço do detalhe carrega.**
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/rotas.tsx:58`.
   - **O que está errado:** o `<Suspense fallback={null}>` em volta do `DetalheDoPedido` passa por cima do `Suspense` da área (`apps/web/src/rotas.tsx:130` e `:208`, que mostra `EstadoCarregando`). No Chromebook com rede lenta, quem clica no nome vê uma área vazia, sem "Carregando". Isso fura o estado de carregamento (regra 50, item 5) e cria um segundo jeito de carregar tela, contra a convenção de `apps/web/src/areas/navegacao.ts:7`, que diz que o `Suspense` da área cobre toda tela `lazy`.
   - **Na foto:** `.processo/vitrine/coordenacao--coordenacao-privacidade-pedidos--Aluna-Sintética-Lia--computador.png` saiu com a área principal toda em branco.
   - **Correção:** tirar esse `Suspense` e deixar o `<DetalheDoPedido key=… />` direto no `Route`, como as outras telas. Se ele precisar ficar, o fallback tem de ser `<EstadoCarregando rotulo="Carregando o pedido…" />`.

2. **A Tech Spec descreve um código que não existe.**
   - **Onde:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:818`.
   - **O que está errado:** o texto diz que "a mutação espera `invalidateQueries` do detalhe e da lista". O código, `relerPedidoDoTitular` em `apps/web/src/api/privacidade.ts`, relê só o detalhe, e o comentário dele diz "A lista não entra".
   - **Correção:** alinhar o texto ao código (só o detalhe, e o motivo: a lista tem `gcTime: 0` e é relida quando a aba abre de novo). A outra saída é reler a lista também, se esse for o desenho que se quer.

3. **Os três bloqueantes do `test-engineer`, 1ª rodada (15:14), continuam sem correção.**
   - **Situação:** os arquivos são anteriores à reprovação e nenhum dos três foi corrigido. A tabela "Revisões" da tarefa ainda não tem rodada aprovada do `test-engineer`.
   - **O mais grave é um bug que confirmei:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/__fixtures__/sessao.ts:1102` grava `current_date - $5::int`. O `current_date` vem do Postgres em UTC (o compose não define `TZ`), enquanto a tela e a expectativa contam pelo dia de São Paulo. Por isso o e2e do prazo falha todo dia entre 21h e meia-noite, justamente quando o time trabalha.
   - **Correção:** gravar `(now() at time zone 'America/Sao_Paulo')::date - $5::int`, ou passar o dia já calculado por `somarDiasAHoje`.
   - **Os outros dois**, na ordem do próprio `test-engineer`:
     - `e2e/pedido-do-titular.spec.ts:524-525` e `:539-540`: a contagem é lida logo depois do `fastForward`, sem esperar nada, então uma leitura indevida chegaria depois do `expect`. O conserto é disparar uma leitura conhecida e esperar a resposta dela antes de contar.
     - A linha 141 de "Mutações" não fica vermelha: falta conferir que o pedido já aberto como `pronto` não anuncia "O arquivo ficou pronto.".

**Recomendações:**
- `DetalheDoPedido.tsx:77-81`: o `ler` repete o `invalidateQueries` de `relerPedidoDoTitular`. Use a função que já existe.
- `AcoesDoPedido.tsx:138-150`: a mutação do "Corrigir nome" repete o corpo de `useAcaoDoPedido` (chamar, reler, `onError` com `listaMudou`). Dá para fazer o hook aceitar argumento.
- `textos-do-pedido.ts:274`: `TEXTO_DO_PEDIDO_NAO_ENCONTRADO` é só outro nome de `TEXTO_DO_PEDIDO_AUSENTE`. Fique com um nome só.
- `17_task.md`, Divergências, última linha: a dívida da paginação é da 16.0, não uma divergência desta tarefa. Ela cabe melhor em "Recomendações sem aplicar", ou só no `estado.md`.
- O título da página (o nome) repete a linha "Pessoa", e a descrição repete a linha "Pedido". Vale olhar se as duas linhas precisam ficar.

## frontend-reviewer · 1ª rodada · AJUSTES NECESSÁRIOS · 2026-10-10 15:18:32 · `tasks/prd-lgpd-e-titular/17_task.md`

VEREDITO: AJUSTES NECESSÁRIOS

Tela vista: sim (26 fotos lidas, cheia e vazia). Cinco fotos do computador (as dos detalhes abertos pelo clique na lista) estão em branco e têm todas o mesmo tamanho de arquivo, 32329 bytes; não abri as quatro que repetem a de "Aluna Sintética Lia". A foto antiga do mesmo detalhe (`coordenacao--coordenacao-privacidade-pedidos-01a126d7-8c02-78ea-a0a3-d18975bd6ed3--computador.png`) mostra o conteúdo, e a causa do branco está no código (bloqueante abaixo).

Estados: carregando com defeito (branco enquanto o pedaço da tela baixa); erro, vazio e com dado ok.
- Erro: "O sistema está indisponível…" com "Tentar de novo" e "Este pedido não está mais disponível nesta escola. Volte à lista de pedidos.", ambos conferidos pelo e2e (`e2e/pedido-do-titular.spec.ts:545`).
- Vazio: "Nenhum pedido registrado" convida a registrar, no computador e no celular.
- Com dado: lista e detalhe nos cinco tipos e estados fotografados.

Acessibilidade: ok pelo código e pelo e2e.
- Anúncios por `aria-live`, foco devolvido, `alertdialog`, campo com rótulo e dica.
- O e2e roda `violacoesGraves` e `larguraExcedente` nos projetos `chromebook` e `celular`.
- Contraste visto nas fotos: ok.

Chromebook fraco: o detalhe é um pedaço próprio com `lazy`, e a leitura sozinha só roda em preparação, a cada 10 s e com a aba à vista. O defeito de carregamento (abaixo) é justamente o caso de rede fraca. Não há lista longa nova.

Celular: ok em 360 px nas fotos, sem rolagem horizontal. A lista vira cartões e o detalhe empilha. Botões e rádios têm 44 px, e "Voltar" e "Atualizar" também. Os diálogos rolam por dentro, e "Cancelar" fica ao lado de confirmar, com o mesmo tamanho (D59). Um único ponto fica de recomendação, o link do nome na lista.

Ação oficial protegida: sim. Os quatro diálogos (`oficial`) mostram Pessoa, Pedido, Quem pediu, Chegou em e Situação, mais o efeito e o aviso de auditoria. Baixar exige a finalidade antes de habilitar o botão. Corrigir nome mostra o nome atual e o novo, e o botão fica desligado com o nome igual ou vazio. Cancelar diz que o acesso volta, e o botão que fecha se chama "Manter a eliminação".

Bloqueantes:
1. `apps/web/src/areas/coordenacao/rotas.tsx:58`, `<Suspense fallback={null}>` em volta de `DetalheDoPedido`. Enquanto o pedaço `DetalheDoPedido` baixa, a área principal fica em branco, sem texto nem indicador.
   - Está visível nas cinco fotos do computador em branco: `…--Aluna-Sintética-Lia--computador.png`, `…--Titular-eliminado--computador.png`, `…--tr-has-text-Correção-de-dados-a--computador.png`, `…--tr-has-text-Acesso-aos-dados-has-text-Recebido-nth-0-a--computador.png` e `…--tr-has-text-Eliminação-agendada-a--computador.png`. A barra lateral aparece, e o conteúdo não.
   - Num Chromebook em rede compartilhada esse branco dura segundos, e é a "tela vazia em branco" que a regra 50, item 5, proíbe.
   - O `Suspense` da área (`apps/web/src/rotas.tsx:130`, com "Carregando…") já cobre toda tela `lazy`, como diz `apps/web/src/areas/navegacao.ts:7`; o `Suspense` interno o contorna com `null`.
   - O e2e do carregando (`e2e/pedido-do-titular.spec.ts:545`) só segura a resposta da API, depois de o pedaço já ter baixado, e por isso não pega o branco.
   - Correção exigida: tirar o `Suspense` interno e deixar o da área cobrir, ou trocar o `fallback` por `<EstadoCarregando rotulo="Carregando o pedido…" />`, com o "Voltar para os pedidos" visível.

Recomendações:
- `apps/web/src/areas/coordenacao/privacidade/Pedidos.tsx:36` (o link do nome): o link é o único caminho da lista ao detalhe e tem `min-h-6` (24 px). Passar a `min-h-11` no celular, para a ação principal da lista chegar a 44 px.
- `textos-do-pedido.ts`, `EFEITO_DE_CONCLUIR`: "Não apaga o arquivo, que continua valendo pelos 7 dias" aparece também em correção, compartilhamento e acesso `recebido`, que não têm arquivo (foto `…Concluir--computador.png`). Variar o texto por tipo e estado.
- `DetalheDoPedido.tsx`, linha "Concluído em": usa `10/10/2026, 10:11`, enquanto "Chegou à escola em" usa "10 de outubro de 2026". Padronizar o formato.
- `textos-do-pedido.ts`, `nomeDaEmpresa`: "Provedor não cadastrado: {chave}" mostra a chave técnica do provedor. Considerar um texto sem a chave, ou deixá-la só como detalhe.
- O prazo vencido (com o ícone) e o detalhe "em preparação" não aparecem nas fotos: a vitrine não os tem, e a foto "vencido" na verdade mostra "Faltam 3 dias". Ficam cobertos só pelo e2e (`e2e/pedido-do-titular.spec.ts:107` e `:494`) e pelo código; confirmar na `/validar`.

## test-engineer · 2ª rodada · APROVADO · 2026-10-10 15:55:19 · `tasks/prd-lgpd-e-titular/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** as três correções da 1ª rodada, mais as cláusulas novas desde então: `efeitoDeConcluir`, o detalhe sem `Suspense` próprio e o clique duplo em "Baixar o arquivo".

**Cobertos:**

1. **O prazo no fuso de São Paulo.** O dia do pedido semeado agora sai de `(now() at time zone 'America/Sao_Paulo')::date - $5::int` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/__fixtures__/sessao.ts:1102`). Como `now()` guarda o fuso, o dia é o de São Paulo seja qual for o fuso da sessão do banco. Feito.
2. **"Parou de reler" agora falha sem a regra.** O teste espera uma requisição marcadora (`esperarOQueJaSaiu`, `e2e/pedido-do-titular.spec.ts:65`) antes de cada contagem: depois da aba escondida (`:543`), na volta (`:550-552`, com contagem exata de 3) e antes e depois da janela que segue o "pronto" (`:559-563`). Os eventos de requisição chegam ao teste na ordem em que saem. Assim, a leitura que um mutante dispara dentro do `fastForward` (o mutante que relê sempre, ou o de aba sempre visível) já foi contada quando a marcadora chega. A linha nova em "Mutações" (`agendarPreparacao(estado, ler, document)`) também entrou. Feito.
3. **O anúncio de "pronto".** Em "a leitura que estava no ar…", logo depois de `Pronto`, há `toHaveCount(0)` para "O arquivo ficou pronto." (`spec:296`), e a linha de "Mutações" aponta para esse teste. O mutante `estado === 'pronto'` passa a anunciar ao carregar e fica vermelho. Feito.

**O que entrou desde a 1ª rodada:**

- **`efeitoDeConcluir`.** O teste de unidade cobre acesso e portabilidade prontos, os outros tipos e os estados sem arquivo (`textos-do-pedido.test.ts`). O e2e confere os dois lados: sem arquivo, o diálogo não fala de arquivo (`spec:238`); com arquivo pronto, fala (`spec:314`). Tirar ou inverter a condição fica vermelho. Rodei `textos-do-pedido.test.ts` e `privacidade.test.ts`: 34 de 34 passam.
- **Detalhe sem `Suspense` próprio.** O teste novo segura o pedaço `tela-coordenacao-DetalheDoPedido-*.js` (o nome confere com `nome-dos-chunks.ts:151`) e espera "Carregando…", que só o `Suspense` de fora de `apps/web/src/rotas.tsx` mostra. Se o `fallback={null}` voltar, a área fica em branco e o teste fica vermelho.
- **Clique duplo em "Baixar o arquivo".** Usa `doisCliquesNoMesmoInstante`, que dá os dois cliques na mesma tarefa, e confere uma chamada e um registro. Tirar só o `useEnvioUnico` já deixa a segunda chamada sair e fica vermelho.
- **Recomendações da 1ª rodada.** Todas atendidas: o comentário do `spec:583`, o host fixo (agora é o caminho tirado da resposta da API), o clique duplo, o nome do teste em `privacidade.test.ts` e o `waitForTimeout(500)`, trocado por um portão de entrega e dois quadros de animação.

**Bloqueantes:** nenhum.

**Recomendações:**
- `e2e/pedido-do-titular.spec.ts:296`: o `toHaveCount(0)` do anúncio passa no primeiro instante em que a contagem é zero. O mutante só aparece depois do efeito do React, que roda após a pintura. Na prática a ordem das idas e voltas ao navegador o pega, mas a prova ficaria firme esperando dois quadros (o mesmo `requestAnimationFrame` duplo do `spec:303`) antes de contar.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/17_task.md:152`: a linha diz que o teste "só fica vermelho sem as duas" travas. Na verdade tirar só o `useEnvioUnico` já basta, porque os dois cliques saem na mesma tarefa, antes de o React desligar o botão. O que fica sem prova é a outra metade: `confirmando={mutacao.isPending}` no diálogo de baixar. Nenhum teste confere o botão desligado durante o envio, como "Concluir" confere. Vale uma asserção de botão desligado com a resposta do `POST …/arquivo` segurada.
- Não rodei as mutações do e2e. A web roda num container compartilhado, e cada mutante pede o build e o compose de novo; os vereditos acima vêm da leitura do código e da ordem dos eventos.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-10 15:57:10 · `tasks/prd-lgpd-e-titular/17_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. O efeito de concluir agora muda conforme o pedido tenha ou não arquivo pronto (`efeitoDeConcluir`). Isso continua dentro do que a seção 9 pede para o diálogo ("o efeito e o aviso do que fica registrado"), e por isso não conta como divergência que precise ir para a `techspec.md` ou para o `cenarios.md`.

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo).

Bloqueantes: nenhum. As três correções da 1ª rodada foram feitas:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/web/src/areas/coordenacao/rotas.tsx:56`: o `Suspense` interno saiu, e o detalhe passou a usar o fallback "Carregando…" da área (`apps/web/src/rotas.tsx:208`). O e2e novo, "o pedaço do detalhe que demora a chegar mostra 'Carregando…'", prova isso.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:818`: o texto agora diz que a ação relê só o detalhe, como o código faz, e explica por que a lista fica de fora.
3. Os três bloqueantes do `test-engineer` foram resolvidos:
   - o prazo é semeado no fuso `America/Sao_Paulo`;
   - a função `esperarOQueJaSaiu` substituiu o `waitForTimeout(500)` e a contagem feita cedo demais;
   - as linhas novas de "Mutações" têm prova.

   O `test-engineer` aprovou a 2ª rodada.

As recomendações da 1ª rodada também foram atendidas:
- o `ler` do detalhe agora usa `relerPedidoDoTitular`;
- `TEXTO_DO_PEDIDO_AUSENTE` ficou como o único nome do texto;
- a dívida da paginação saiu de "Divergências" e foi para "Recomendações sem aplicar".

Conferi também o comentário novo sobre `gcTime: 0` em `AcoesDoPedido.tsx:209`. Ele está correto: `useEnvioUnico` força `gcTime: 0` em `apps/web/src/componentes/dialogos.tsx:28`.

Recomendações:
- O e2e do "Carregando…" (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedido-do-titular.spec.ts`) depende do formato `tela-coordenacao-DetalheDoPedido-*.js` dado aos pedaços do código por `apps/web/nome-dos-chunks.ts`. Se esse formato mudar, o teste fica vermelho sem dizer por quê. Uma linha de comentário apontando para `nome-dos-chunks.ts` resolve.
- A barreira `/barreira-do-teste` supõe que as requisições chegam ao teste na mesma ordem em que a página as fez. A suposição está documentada no comentário da função, mas vale repetir onde mais ela for usada, para ninguém trocar a função por um `waitForTimeout`.

## frontend-reviewer · 2ª rodada · APROVADO · 2026-10-10 15:58:18 · `tasks/prd-lgpd-e-titular/17_task.md`

VEREDITO: APROVADO

Tela vista: sim (28 fotos lidas, computador e celular; escola cheia e vazia). Fotografei a lista, os cinco detalhes (pronto, correção, recebido, eliminação agendada, titular eliminado), os quatro diálogos (baixar, corrigir nome, concluir, cancelar eliminação) e o pedido inexistente, nas duas escolas. Não há foto do carregando, do detalhe "em preparação" nem do prazo vencido; os conferi pelo código e pelo e2e.

Estados: ok.
- **Carregando:** `DetalheDoPedido.tsx` usa `EstadoCarregando` ("Carregando o pedido…") enquanto a consulta não volta. Enquanto o pedaço do detalhe baixa, a fronteira da área em `apps/web/src/rotas.tsx:130` mostra "Carregando…". O e2e novo segura o `tela-coordenacao-DetalheDoPedido-*.js` e confere o texto.
- **Vazio:** a lista vazia (`vazia--…-pedidos--computador.png` e `--celular.png`) convida, com "Nenhum pedido registrado. Quando uma pessoa ou o responsável pedir acesso…, registre aqui…", e traz "Registrar pedido" e "Ir para a Estrutura" à vista.
- **Erro:** `EstadoErro` com "Tentar de novo". O pedido que não se acha diz "Este pedido não está mais disponível nesta escola. Volte à lista de pedidos." e mantém o link de volta; é a mesma resposta nas duas escolas, como pede a regra 10, item 6.
- **Com dado:** nos cinco detalhes e na lista.

Acessibilidade: ok.
- Os diálogos usam `<dialog>` modal com foco preso e devolvido (`Dialogo.tsx`).
- O diálogo oficial é `alertdialog`, e o foco inicial fica no botão que cancela, não no que confirma.
- Os campos têm rótulo ("Nome correto", com a dica).
- O anúncio de "arquivo pronto" e o do download saem por `role="status"`.
- O título da aba não traz nome de pessoa.

Chromebook fraco: ok.
- O detalhe é um pedaço próprio (`lazy`), então a aba Pedidos não paga pelos diálogos.
- O relógio de 10 s só roda com o arquivo em preparação e a aba à vista.
- A lista é paginada com "Ver mais pedidos".
- Nenhuma imagem é enviada nesta tela.

Celular: ok.
- Nenhuma foto de 360 px tem rolagem horizontal ou texto cortado. A lista vira cartões, e os blocos "Pessoa" e "Chegou à escola em" quebram em linhas sem sobrepor.
- A ação principal tem 44 px: "Baixar a versão da escola", "Concluir", "Corrigir nome", "Cancelar eliminação" e "Atualizar" medem de 43 a 44 px nas fotos.
- O link com o nome na lista tem `min-h-11` (`Pedidos.tsx:37`), e "Voltar para os pedidos" também (`DetalheDoPedido.tsx:131`).
- Nada depende de hover nem de atalho.
- Nos diálogos de 360 px, o conteúdo longo rola dentro da caixa (`overflow-y-auto` e a `max-height` nativa do `dialog`).
- Nenhum fluxo exige o celular.

Ação oficial protegida: sim. Concluir, Cancelar eliminação, Corrigir nome e Baixar a versão da escola mostram antes de confirmar a pessoa, o pedido, quem pediu, quando chegou e a situação. Todos dizem que ficam registrados na auditoria. O download exige a finalidade escolhida e avisa que o arquivo deve ser entregue e apagado do computador. O "Concluir" só fala de arquivo quando há arquivo pronto (`textos-do-pedido.ts`, `efeitoDeConcluir`). A foto do "Concluir" num acesso "Recebido" mostra só "Concluir encerra o atendimento na lista de pedidos."

Correções exigidas na rodada anterior:
1. **Suspense em branco:** feita. `apps/web/src/areas/coordenacao/rotas.tsx:56` não tem mais `<Suspense fallback={null}>` em volta do `DetalheDoPedido`. A fronteira da área cobre o carregamento com `EstadoCarregando`, e o teste e2e "o pedaço do detalhe que demora a chegar mostra 'Carregando…'" prova isso.
2. **Recomendações aplicadas:**
   - `min-h-11` no link do nome da lista.
   - `efeitoDeConcluir` condicionado ao arquivo pronto, com teste de unidade.
3. **Texto do pedido ausente:** `TEXTO_DO_PEDIDO_AUSENTE` ficou exportado e único, sem o alias duplicado. A foto do pedido inexistente mostra o texto correto.

Bloqueantes: nenhum.

Recomendações (não bloqueiam):
- **Diálogo "Baixar" no celular** (`apps/web/src/componentes/Dialogo.tsx`, usado por `AcoesDoPedido.tsx`): a ação principal fica abaixo da dobra e se alcança rolando dentro da caixa (fotos `…Baixar-a-versão-da-escola--celular.png` e `…Corrigir-nome--celular.png`). Vale avaliar um rodapé de botões fixo ou um texto mais curto. Serve a todos os diálogos longos, então é decisão do componente, não desta tarefa.
- **"Concluído em"** aparece como `10/10/2026, 10:11` e "Chegou à escola em" como "10 de outubro de 2026". Está justificado nas recomendações recusadas (`formatarDataHora` contra `formatarData`), mas a foto mostra os dois formatos no mesmo bloco. O `/validar` pode decidir se unifica.
- **Fotos que faltam para o `/validar`:** o prazo vencido (com ícone) e o detalhe "em preparação". Os dois estão cobertos pelo e2e.
- **Chave técnica do provedor não cadastrado** em "Empresas que receberam dado": já registrada como recusada, com justificativa de LGPD, art. 18, § 6º. Nenhuma foto mostra esse caso, porque a vitrine só tem pedidos sem empresa.
