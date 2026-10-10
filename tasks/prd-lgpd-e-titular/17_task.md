# Tarefa 17.0 — A coordenação conduz o pedido até o fim pela tela

**Funcionalidade:** lgpd-e-titular · **Depende de:** 13.0, 14.0, 16.0 · **Paralelo com:** 18.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O detalhe do pedido mostra prazo e compartilhamento e permite concluir, cancelar, corrigir o nome e baixar a versão da escola com finalidade e aviso.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 9 (detalhe)
- PRD seção 6 (exceção do Tutor e da D64)
- Código: os diálogos da 16.0
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 17.1 — Prazo ("faltam N dias", vencido com ícone) e compartilhamento
- [x] 17.2 — Concluir, Cancelar (diz que o acesso volta), Corrigir nome (antes e depois, aviso do nome anterior)
- [x] 17.3 — Baixar a versão da escola (`oficial`, finalidade, entregar e apagar)
- [x] 17.4 — "Em preparação" a cada 10 s, parando com a aba escondida
- [x] 17.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| detalhe do pedido e diálogos | novo |
| consultas | alterado |
| e2e | novo |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| baixar | e2e | finalidade, aviso e nome do arquivo conferido |
| preparação | e2e e unidade | vira "pronto" sem recarregar; para com a aba escondida |
| ações | e2e | conclui; corrige nome; registra eliminação e cancela; Concluir desabilita no envio |
| prazo | e2e | "faltam N dias" e vencido com ícone |
| recomeço | e2e | falha com o diálogo aberto limpa foco e aviso; segunda pessoa; resposta atrasada |
| estados | e2e | quatro estados, `chromebook` e `celular`, acessibilidade |

## Como testar

- **baixar:** `e2e/a2-assistente.spec.ts › a coordenação sobe o material; a professora pede a atividade…` (`page.waitForEvent('download')`, com o nome do arquivo).
- **preparação:** a unidade em `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.test.ts › com a aba escondida, para…`; no e2e, `page.clock.install`, `fastForward` e o evento `visibilitychange`, como `e2e/acesso-da-turma.spec.ts › a releitura que cai com o código projetado…`.
- **ações:** `e2e/pedidos.spec.ts › o 41º pedido não é marcável…` (dois cliques, um pedido).
- **recomeço:** `e2e/pedidos.spec.ts › lista recarregada com o diálogo aberto…` e `› resposta atrasada: a atualização que chega depois da decisão…`.
- **estados:** `e2e/governanca.spec.ts › os quatro estados…`.
- **prazo:** semeie o pedido no banco com `chegou_em` no passado, como `ajustarRetencaoDaEscola` (`e2e/__fixtures__/sessao.ts`).
- Armadilha da 6.0: a linha de Mutações só vale se o e2e fica vermelho sem a cláusula; confira antes de escrever.
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/<arquivo>.spec.ts`.
- **Telas** (`coordenacao`, sem mockup): o detalhe, da aba Pedidos (`/coordenacao/privacidade/<id da aba>`) com `--clicar` no pedido da lista, ou no endereço que a tarefa criar; cada diálogo, com mais um `--clicar`: `text=Concluir`, `text=Cancelar`, `text=Corrigir nome`, `text=Baixar a versão da escola`. A vitrine não tem pedido: registre um na escola cheia, pela tela da 16.0, antes de fotografar.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

"Meus dados" (18.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| O detalhe é uma **página** (`/coordenacao/privacidade/pedidos/<id>`), e não um diálogo nem uma aba nova | A seção 9 diz "o detalhe tem…" sem dizer a forma. Com o prazo, as empresas e quatro ações, é uma tela, e o endereço com o id deixa o "Voltar" e o recarregar funcionarem | `techspec.md` §9, "Tarefa 17.0, como ficou no código"; `docs/interface.md` 3, "Privacidade"; `cenarios.md`, RF20, "Tarefa 17.0" |
| O prazo de 15 dias é constante da web (`PRAZO_DA_DECLARACAO_COMPLETA_DIAS`), e não campo da API | O DTO do pedido traz `chegouEm`, e o prazo da LGPD (art. 19, II) é fixo; a API não o devolve nem a seção 4 o prevê. O dia do vencimento ainda é prazo | `techspec.md` §9, "O que cada seção diz" |
| A tela não diz a data da eliminação, o papel do titular nem se ele tem conta ativa, e o botão "Baixar a versão da escola" aparece em todo acesso ou portabilidade `pronto` | O DTO não traz `eliminarEm`, o papel nem a conta ativa, e a seção 4 não pede mais. A orientação fala em "7 dias depois do registro", e a versão da escola que não existe (conta ativa, ou arquivo com mais de 7 dias) é a falha do download, com o texto dos dois casos, sem mudar a API | `techspec.md` §9, "O que o DTO não traz"; `cenarios.md`, RF12, "com o titular ainda com conta ativa" |
| O botão do cancelamento se chama "Cancelar eliminação", e o que fecha o diálogo, "Manter a eliminação" | "Cancelar" ao lado de "Cancelar a eliminação" não diria qual desfaz o quê; o texto do diálogo diz que o acesso volta, como a seção 9 pede | `techspec.md` §9, "Os diálogos"; `docs/interface.md` 3 |
| "Corrigir nome" é um diálogo só, com o campo, o nome atual e o novo no resumo e o aviso do nome anterior, e o ponteiro para a lista e a turma é um link "Ir para a Estrutura" no pedido de correção | A seção 9 pede "mostra o nome atual e o novo antes de confirmar" e "aponta para a lista e a turma da A1": um diálogo de duas etapas repetiria o resumo; o link fica onde a coordenação lê o pedido | `techspec.md` §9, "Os diálogos" |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `privacidade/textos-do-pedido.ts` › `prazoDoPedido` › `pedido.estado === 'concluido'` | `textos-do-pedido.test.ts` › o pedido que terminou não tem prazo a cumprir, por mais antigo que seja |
| `privacidade/textos-do-pedido.ts` › `prazoDoPedido` › `pedido.estado === 'cancelado'` | `textos-do-pedido.test.ts` › o pedido que terminou não tem prazo a cumprir, por mais antigo que seja |
| `privacidade/textos-do-pedido.ts` › `prazoDoPedido` › `faltam >= 0` (o dia do vencimento ainda é prazo) | `textos-do-pedido.test.ts` › o pedido aberto diz quantos dias faltam e o dia em que vence; o dia do vencimento |
| `privacidade/textos-do-pedido.ts` › `textoDoPrazo` › `prazo.faltam === 0` (vence hoje) | `textos-do-pedido.test.ts` › o texto: faltam N dias com a data; o vencido diz vencido, com o erro e há quantos |
| `privacidade/textos-do-pedido.ts` › `textoDoPrazo` › `prazo.faltam === 1 ? 'Falta' : 'Faltam'` | `textos-do-pedido.test.ts` › o texto: faltam N dias com a data; … |
| `privacidade/textos-do-pedido.ts` › `dias` › `quantidade === 1 ? 'dia' : 'dias'` | `textos-do-pedido.test.ts` › o texto: faltam N dias com a data; … |
| `privacidade/textos-do-pedido.ts` › `acoesDoPedido` › concluir: `pedido.tipo !== 'eliminacao'` | `textos-do-pedido.test.ts` › concluir: acesso, portabilidade, compartilhamento e correção abertos; nunca a eliminação |
| `privacidade/textos-do-pedido.ts` › `acoesDoPedido` › concluir: `ESTADOS_ABERTOS_DO_PEDIDO.includes(pedido.estado)` | `textos-do-pedido.test.ts` › concluir: acesso, portabilidade, compartilhamento e correção abertos; … |
| `privacidade/textos-do-pedido.ts` › `acoesDoPedido` › cancelar: `tipo === 'eliminacao' && estado === 'agendado'` | `textos-do-pedido.test.ts` › cancelar: só a eliminação agendada |
| `privacidade/textos-do-pedido.ts` › `acoesDoPedido` › corrigir nome: `pedido.titular !== null` | `textos-do-pedido.test.ts` › corrigir o nome: só o pedido de correção recebido ou pronto, e só enquanto a pessoa existe |
| `privacidade/textos-do-pedido.ts` › `acoesDoPedido` › corrigir nome: `estado === 'recebido' || estado === 'pronto'` | `textos-do-pedido.test.ts` › corrigir o nome: só o pedido de correção recebido ou pronto, … |
| `privacidade/textos-do-pedido.ts` › `acoesDoPedido` › baixar: `TIPOS_DE_PEDIDO_COM_ARQUIVO.includes(pedido.tipo)` | `textos-do-pedido.test.ts` › baixar a versão da escola: acesso e portabilidade com o arquivo pronto, e só … |
| `privacidade/textos-do-pedido.ts` › `acoesDoPedido` › baixar: `pedido.estado === 'pronto'` | `textos-do-pedido.test.ts` › baixar a versão da escola: acesso e portabilidade com o arquivo pronto, e só … |
| `privacidade/textos-do-pedido.ts` › `textoDaTrocaDeNome` › `pedido.tipo !== 'eliminacao'` | `textos-do-pedido.test.ts` › fora da eliminação, e eliminação cancelada, não diz nada |
| `privacidade/textos-do-pedido.ts` › `textoDaTrocaDeNome` › `pedido.estado === 'agendado'` (só o homônimo fala) | `textos-do-pedido.test.ts` › agendada, só o homônimo fala: o nome não será trocado |
| `privacidade/textos-do-pedido.ts` › `textoDaTrocaDeNome` › `pedido.estado !== 'concluido'` | `textos-do-pedido.test.ts` › fora da eliminação, e eliminação cancelada, não diz nada |
| `privacidade/textos-do-pedido.ts` › `textoDaTrocaDeNome` › `pedido.nomeTrocado === true` e `pedido.homonimo === true` | `textos-do-pedido.test.ts` › concluída, diz se houve troca, ou por que não houve |
| `privacidade/textos-do-pedido.ts` › `nomeNovoDoTitular` › `nome === ''`, `nome.length > MAXIMO_DO_NOME_DO_TITULAR`, `nome === atual.trim()` e `digitado.trim()` | `textos-do-pedido.test.ts` › RF13b: o nome novo é conferido antes de confirmar > aceita o nome com as pontas aparadas; recusa vazio, igual ao atual e comprido demais (as quatro) |
| `privacidade/textos-do-pedido.ts` › `orientacaoDoPedido` › acesso e portabilidade: `estado === 'em_preparacao'` e `'pronto'` | `textos-do-pedido.test.ts` › o arquivo em preparação diz que a página se atualiza; o pronto, por quantos dias fica |
| `privacidade/textos-do-pedido.ts` › `orientacaoDoPedido` › eliminação: `'agendado'` | `textos-do-pedido.test.ts` › a eliminação agendada diz que o cancelamento devolve o acesso, com os 7 dias |
| `privacidade/textos-do-pedido.ts` › `orientacaoDoPedido` › compartilhamento `'recebido'`; correção `'recebido' || 'pronto'`; eliminação `'concluido'` e `'cancelado'` | `textos-do-pedido.test.ts` › a orientação existe só nos estados que pedem uma ação ou uma espera, e cada uma diz o que a coordenação faz (as quatro) |
| `privacidade/textos-do-pedido.ts` › `CODIGOS_QUE_MUDAM_O_PEDIDO` › `PEDIDO_EM_ESTADO_INVALIDO` e `NAO_ENCONTRADO` | `textos-do-pedido.test.ts` › o pedido que mudou de estado e o pedido que sumiu têm texto próprio em cada ação |
| `privacidade/textos-do-pedido.ts` › `TEXTOS_DA_FALHA_DE_CORRIGIR_NOME` › `ENTRADA_INVALIDA`; `TEXTOS_DA_FALHA_DE_BAIXAR` › `INDISPONIVEL_TENTE_DE_NOVO` | `textos-do-pedido.test.ts` › o nome fora do tamanho e o download que não saiu têm texto, e dizem o que fazer |
| `privacidade/textos-do-pedido.ts` › `nomeDaEmpresa` › `linha.suboperadorId === null` | `textos-do-pedido.test.ts` › RF13: … o nome vem do cadastro pela chave; sem cadastro, diz que não está cadastrada, … |
| `privacidade/textos-do-pedido.ts` › `nomeDaEmpresa` › a vigência (`inicio <= ultimoEm && (fim === null || ultimoEm <= fim)`) | `textos-do-pedido.test.ts` › a chave recadastrada rende duas empresas: vale a que estava vigente na última chamada |
| `privacidade/textos-do-pedido.ts` › `periodoDaLinha` › `primeiro === ultimo` | `textos-do-pedido.test.ts` › o período é o dia, quando começa e termina no mesmo, ou de um dia até o outro; … |
| `privacidade/textos-do-pedido.ts` › `ordenarOCompartilhamento` › o desempate pela chave e `primeiroEm < primeiroEm` | `textos-do-pedido.test.ts` › a ordem é a do primeiro dado e, no empate, a da chave (as duas) |
| `privacidade/preparacao-do-arquivo.ts` › `relerEnquantoPrepara` › `estado === 'em_preparacao'` | `preparacao-do-arquivo.test.ts` › só o pedido em preparação se relê sozinho: cada leitura é auditada, … |
| `privacidade/preparacao-do-arquivo.ts` › `agendarPreparacao` › `!relerEnquantoPrepara(estado)` | `preparacao-do-arquivo.test.ts` › fora de em preparação nada é agendado: nem relógio, nem ouvinte da aba |
| `privacidade/preparacao-do-arquivo.ts` › `INTERVALO_DA_PREPARACAO_MS = 10_000` | `preparacao-do-arquivo.test.ts` › o intervalo é de 10 segundos; em preparação, uma leitura a cada 10 s… |
| `componentes/pedidos/atualizacao-dos-pedidos.ts` › `agendarRelitura` › `aba.visibilityState === 'visible'` | `atualizacao-dos-pedidos.test.ts` › W15: … com a aba escondida, para …; `preparacao-do-arquivo.test.ts` › com a aba escondida, para; ao voltar, relê na hora … |
| `componentes/pedidos/atualizacao-dos-pedidos.ts` › `agendarRelitura` › `setInterval(atualizar, intervaloMs)` | `preparacao-do-arquivo.test.ts` › em preparação, uma leitura a cada 10 s: nenhuma antes, três em meio minuto |
| `componentes/pedidos/atualizacao-dos-pedidos.ts` › `agendarAtualizacao` › `!atualizaSozinha(quem)` | `atualizacao-dos-pedidos.test.ts` › W15: a coordenação não tem leitura sem o clique > nenhuma leitura sai em 60 s … |
| `api/privacidade.ts` › `consultaPedidoDoTitular` › `refetchOnWindowFocus: false` e `refetchOnReconnect: false` | `privacidade.test.ts` › o detalhe não relê ao voltar o foco nem ao voltar a rede: cada leitura é auditada … |
| `api/privacidade.ts` › `consultaPedidoDoTitular` › `gcTime: 0` | `privacidade.test.ts` › o pedido do titular não fica no cache depois que a tela sai: … |
| `api/privacidade.ts` › `caminhoDoPedido` › `encodeURIComponent(pedidoId)` | `privacidade.test.ts` › o id do pedido vai escapado no caminho: o que vem do endereço da aba não muda a rota da API |
| `api/privacidade.ts` › `relerPedidoDoTitular` › `invalidateQueries` do detalhe | `privacidade.test.ts` › depois da ação, a página relê e o estado que aparece é o do servidor |
| `privacidade/AcoesDoPedido.tsx` › `useAcaoDoPedido` › `await relerPedidoDoTitular(cliente, pedido.id)` antes de fechar o diálogo | `e2e/pedido-do-titular.spec.ts` › Concluir mostra o que faz, desliga o botão no envio, o clique duplo conclui uma vez … (`Concluído` visível na página) |
| `privacidade/AcoesDoPedido.tsx` › `useAcaoDoPedido` › `onError` › `listaMudou(erro, CODIGOS_QUE_MUDAM_O_PEDIDO)` | `e2e/pedido-do-titular.spec.ts` › outra pessoa concluiu antes: …; o cancelamento que já não vale: … |
| `privacidade/AcoesDoPedido.tsx` › `DialogoDeConcluir` › `impedido={mudou}` | `e2e/pedido-do-titular.spec.ts` › outra pessoa concluiu antes: … (botão `Concluir pedido` desligado) |
| `privacidade/AcoesDoPedido.tsx` › `DialogoDeCancelar` › `impedido={mudou}` | `e2e/pedido-do-titular.spec.ts` › o cancelamento que já não vale: … (botão `Cancelar a eliminação` desligado) |
| `privacidade/AcoesDoPedido.tsx` › `DialogoDeCancelar` › `rotuloDeCancelar={mudou ? 'Fechar' : 'Manter a eliminação'}` | `e2e/pedido-do-titular.spec.ts` › registra a eliminação, o detalhe diz que o acesso está suspenso e o cancelamento o devolve, … |
| `privacidade/AcoesDoPedido.tsx` › `DialogoDeCorrigirNome` › `impedido={!nome.ok || mudou}` | `e2e/pedido-do-titular.spec.ts` › mostra o nome atual e o novo antes de confirmar, … (confirmar desligado com o nome igual) |
| `privacidade/AcoesDoPedido.tsx` › `DialogoDeCorrigirNome` › `confirmar` › `if (nome.ok)` (o Enter com o nome igual não envia) | `e2e/pedido-do-titular.spec.ts` › mostra o nome atual e o novo antes de confirmar, … (uma só chamada saiu) |
| `privacidade/AcoesDoPedido.tsx` › `DialogoDeBaixar` › `impedido={finalidade === undefined}` | `e2e/pedido-do-titular.spec.ts` › pede a finalidade, avisa que fica registrado …, e baixa o arquivo do pedido pronto, … |
| `privacidade/AcoesDoPedido.tsx` › `DialogoDeBaixar` › `baixarPorUrl(arquivo.url, arquivo.nome)` | `e2e/pedido-do-titular.spec.ts` › pede a finalidade, avisa que fica registrado …, e baixa o arquivo do pedido pronto, … (o download não sai) |
| `privacidade/AcoesDoPedido.tsx` › `AcoesDoPedido` › `{algumaAcao && (` (o grupo de botões só existe com ação) | `e2e/pedido-do-titular.spec.ts` › o prazo diz quantos dias faltam, …; o titular que já foi eliminado aparece como tal no detalhe, … |
| `privacidade/DetalheDoPedido.tsx` › `DetalheDoPedido` › `anterior.current === 'em_preparacao' && estado === 'pronto'` (o anúncio) | `e2e/pedido-do-titular.spec.ts` › a leitura que estava no ar quando a ação terminou …(o pedido que já abre pronto não anuncia); em preparação se relê a cada 10 s e vira pronto sem recarregar; … |
| `privacidade/DetalheDoPedido.tsx` › `DetalheDoPedido` › `consulta.error instanceof ErroDaApi && codigo === NAO_ENCONTRADO` | `e2e/pedido-do-titular.spec.ts` › as quatro situações da página: carregando, erro com nova tentativa, pedido que não existe e o dado |
| `privacidade/DetalheDoPedido.tsx` › `DetalheDoPedido` › `acoesDoPedido(pedido).corrigirNome` (o link `Ir para a Estrutura`) | `e2e/pedido-do-titular.spec.ts` › o pedido que não é de correção não oferece "Corrigir nome", … |
| `privacidade/DetalheDoPedido.tsx` › `DetalheDoPedido` › `pedido.concluidoEm !== null` | `e2e/pedido-do-titular.spec.ts` › o prazo diz quantos dias faltam, o vencido diz há quantos dias … |
| `privacidade/DetalheDoPedido.tsx` › `DetalheDoPedido` › `consulta.isFetching ? 'Atualizando…' : 'Atualizar'` | `e2e/pedido-do-titular.spec.ts` › a leitura que estava no ar quando a ação terminou não desfaz o resultado: … |
| `privacidade/DetalheDoPedido.tsx` › `DetalheDoPedido` › `enabled: temEmpresas` | `e2e/pedido-do-titular.spec.ts` › o prazo diz quantos dias faltam, … (nenhuma leitura da lista de empresas) |
| `privacidade/DetalheDoPedido.tsx` › `DetalheDoPedido` › `orientacao !== undefined` | `e2e/pedido-do-titular.spec.ts` › o prazo diz quantos dias faltam, … (nenhum parágrafo vazio) |
| `privacidade/DetalheDoPedido.tsx` › `DetalheDoPedido` › `troca !== undefined` | `e2e/pedido-do-titular.spec.ts` › o prazo diz quantos dias faltam, …; a leitura que estava no ar quando a ação terminou … |
| `areas/coordenacao/rotas.tsx` › `RotasDaCoordenacao` › `<DetalheDoPedido key={parametros.pedidoId} …>` | `e2e/pedido-do-titular.spec.ts` › ir a outro pedido pelo histórico fecha o diálogo aberto e deixa o aviso para trás: nada do primeiro vale para o segundo |
| `privacidade/DetalheDoPedido.tsx` › `DetalheDoPedido` › `agendarPreparacao(estado, ler, document)` (a ligação do estado e da aba ao relógio) | `e2e/pedido-do-titular.spec.ts` › em preparação se relê a cada 10 s e vira pronto sem recarregar; … (a contagem não sobe com a aba escondida nem depois de pronto) |
| `areas/coordenacao/rotas.tsx` › `RotasDaCoordenacao` › `DetalheDoPedido` sem `Suspense` próprio (o da área cobre) | `e2e/pedido-do-titular.spec.ts` › o pedaço do detalhe que demora a chegar mostra "Carregando…", e não uma área em branco |
| `privacidade/textos-do-pedido.ts` › `efeitoDeConcluir` › `!acoesDoPedido(pedido).baixar` | `textos-do-pedido.test.ts` › concluir só fala do arquivo quando há arquivo pronto: … |
| `privacidade/AcoesDoPedido.tsx` › `DialogoDeBaixar` › `useEnvioUnico` (um clique só decide) **e** `confirmando={mutacao.isPending}` (o botão desliga no envio): uma trava cobre a outra, e o teste só fica vermelho sem as duas | `e2e/pedido-do-titular.spec.ts` › pede a finalidade, avisa que fica registrado … (uma chamada e um registro com dois cliques) |
| `caminhos.ts` › `caminhoDoPedidoDoTitular` › `encodeURIComponent(pedidoId)` | `caminhos.test.ts` › leva só o id do pedido, na aba Pedidos da Privacidade, e nada além dele vira trecho do endereço |
| `componentes/baixar-por-url.ts` › `baixarPorUrl` › `ancora.href = url`, `ancora.download = nome`, `ancora.rel = 'noopener noreferrer'` e `ancora.hidden = true` | `baixar-por-url.test.ts` › clica uma âncora oculta com o endereço, o nome e o rel seguro, e a tira da página (as quatro) |
| `componentes/baixar-por-url.ts` › `baixarPorUrl` › `ancora.remove()` e a ordem anexar, clicar, remover | `baixar-por-url.test.ts` › clica depois de anexar e remove depois de clicar: a âncora fora da página não baixa |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| (implementador) | O papel do titular, `eliminarEm` e a conta ativa não vêm no DTO do pedido: com eles a tela diria a data exata da eliminação e esconderia "Baixar a versão da escola" quando a pessoa tem conta ativa, em vez de explicar a falha | Mudança de contrato e de API, que não é desta tarefa; o Orquestrador decide se vai para a validação |
| (implementador) | A dívida da paginação dos pedidos (a API pagina por id, e a tela ordena só as páginas lidas) não foi corrigida | Não é desta tarefa (é da 16.0); segue como pendência para o `/validar` (`estado.md`, "Pendente para a validação") |
| revisor-geral (1ª) | `AcoesDoPedido.tsx`: a mutação do "Corrigir nome" repete o corpo de `useAcaoDoPedido` | Recusada: são dois usos, o segundo leva argumento e `onSuccess` próprios, e a tabela de Mutações amarra as cláusulas ao corpo de cada um. Volta a valer com a terceira mutação com argumento |
| revisor-geral (1ª) | O título da página repete a linha "Pessoa", e a descrição repete "Pedido" | Recusada: a linha "Pessoa" traz a turma, e o resumo da tela é o mesmo dos diálogos (regra 50, item 8); o título é o nome para quem chega pelo histórico |
| frontend-reviewer (1ª) | "Concluído em" usa `10/10/2026, 10:11` e "Chegou à escola em" usa "10 de outubro de 2026" | Recusada: `formatarDataHora` é o formato de data e hora das telas de auditoria da coordenação (Agentes, Analista, Governança); data sem hora usa `formatarData`. Dois formatos, duas coisas |
| frontend-reviewer (1ª) | `nomeDaEmpresa`: "Provedor não cadastrado: {chave}" mostra a chave técnica | Recusada: a chave é o único identificador que a coordenação tem de uma empresa sem cadastro, e é a quem ela precisa avisar (RF13; LGPD, art. 18, § 6º) |
| frontend-reviewer (1ª) | O prazo vencido (com ícone) e o detalhe "em preparação" não têm foto; a foto "vencido" mostra "Faltam 3 dias" | Validador (`/validar`): fotografa com pedido vencido e em preparação semeados. Cobertos pelo e2e (`pedido-do-titular.spec.ts`, prazo e preparação) |
| test-engineer (1ª) | Semear um pedido de outra escola e abrir o endereço dele no e2e | Já provado na API (`apps/api/test/pedido-titular.int.test.ts`, isolamento, linha ~912); o comentário do e2e já não promete isso |
| test-engineer (1ª) | `current_date` em UTC também em `criarPedidosDoTitularNoBanco` e `criarPedidoDeTitularEliminadoNoBanco` (`e2e/__fixtures__/sessao.ts`, linhas ~1047 e ~1064) | Fora do diff: código da 16.0, já aprovado. O Orquestrador decide se vai para a validação |
| test-engineer (2ª) | `e2e/pedido-do-titular.spec.ts`, o `toHaveCount(0)` do anúncio "O arquivo ficou pronto." logo depois de `Pronto`: esperar dois quadros (`requestAnimationFrame` duplo) antes de contar, porque o efeito do React roda depois da pintura | Fica para a próxima tarefa que tocar `pedido-do-titular.spec.ts`; o mutante da cláusula já fica vermelho pela ordem das idas e voltas ao navegador (o test-engineer o disse) |
| test-engineer (2ª) | `17_task.md`, linha de Mutações do `useEnvioUnico` de `DialogoDeBaixar` diz que o teste "só fica vermelho sem as duas" travas; tirar só o `useEnvioUnico` já basta. E nenhum teste confere `confirmando={mutacao.isPending}` (botão desligado com o `POST …/arquivo` segurado), como o "Concluir" confere | `/validar`: o Validador confere a regra do botão desligado no envio (RF14). Ajuste do texto da linha de Mutações, se o Implementador for ao documento por outro motivo |
| test-engineer (2ª) | As mutações do e2e não foram rodadas pelo revisor (a web roda num container compartilhado) | Sem ação: o Implementador viu as de Mutações 2, 3, 4, 8 e 14 vermelhas (pedido de rodada) |
| revisor-geral (2ª) | O e2e do "Carregando…" depende do nome `tela-coordenacao-DetalheDoPedido-*.js` de `apps/web/nome-dos-chunks.ts`; uma linha de comentário apontando para ele | Próxima tarefa que tocar `pedido-do-titular.spec.ts` (comentário, não muda comportamento) |
| revisor-geral (2ª) | A barreira `esperarOQueJaSaiu` supõe que as requisições chegam ao teste em ordem; repetir a suposição onde ela for usada | Próxima tarefa que tocar `pedido-do-titular.spec.ts`; a suposição já está no comentário da função |
| frontend-reviewer (2ª) | Diálogo "Baixar" e "Corrigir nome" no celular: a ação principal fica abaixo da dobra e se alcança rolando dentro da caixa; rodapé de botões fixo ou texto mais curto | Decisão do componente `apps/web/src/componentes/Dialogo.tsx`, que serve a todos os diálogos longos; não é desta tarefa. `/validar` e o Joaquim decidem; vale para a pendência de interface |
| frontend-reviewer (2ª) | "Concluído em" (`10/10/2026, 10:11`) e "Chegou à escola em" ("10 de outubro de 2026") no mesmo bloco | Já recusada na 1ª rodada (`formatarDataHora` contra `formatarData`); o `/validar` pode decidir se unifica |
| frontend-reviewer (2ª) | Sem foto do prazo vencido, do detalhe "em preparação" e da chave técnica do provedor não cadastrado | Validador (`/validar`): semeia os três na vitrine; todos têm cobertura no e2e |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-10 15:10:31 | 2026-10-10 15:14:30 | `test-engineer` | 1 | REPROVADO | aabd0aa51169e5b65 |
| 2026-10-10 15:16:19 | 2026-10-10 15:17:51 | `privacy-guardian` | 1 | APROVADO | a3e47066b56233856 |
| 2026-10-10 15:16:09 | 2026-10-10 15:18:21 | `revisor-geral` | 1 | REPROVADO | af883680fa062ef6b |
| 2026-10-10 15:16:29 | 2026-10-10 15:18:32 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a2e7a7349457c3d45 |
| 2026-10-10 15:52:55 | 2026-10-10 15:55:19 | `test-engineer` | 2 | APROVADO | ada818b9216fcaca6 |
| 2026-10-10 15:56:40 | 2026-10-10 15:57:02 | `privacy-guardian` | 2 | APROVADO | a68844a6d743aedea |
| 2026-10-10 15:56:32 | 2026-10-10 15:57:10 | `revisor-geral` | 2 | APROVADO | a096daee376c9984f |
| 2026-10-10 15:56:54 | 2026-10-10 15:58:18 | `frontend-reviewer` | 2 | APROVADO | a60a60dce1161fe13 |
