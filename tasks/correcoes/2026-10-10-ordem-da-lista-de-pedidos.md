# Correção — a lista de pedidos do titular pagina por id crescente: com mais de 50 pedidos, o registrado agora só aparece em "Ver mais pedidos"

**Origem:** dívida da 16.0, declarada em `16_task.md` (linhas 79, 174 e 183: "a API devia ordenar por chegada"), registrada como pendência da validação em `estado.md` e triada pelo Arquiteto em `.processo/ordens/triagem-ordem-dos-pedidos.md`; pedido do Orquestrador em 10/10/2026.
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `revisor-geral`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral` porque a correção passa de 5 arquivos fora de `tasks/` (o repository, os dois testes da API, o e2e, o comentário da tela e o do schema). `frontend-reviewer` não: nenhuma tela muda, só o e2e dela. -->

## Sintoma

`GET /v1/privacidade/pedidos` devolve a página em ordem de **id crescente** (`apps/api/src/privacidade/pedidos.repository.ts`, `listar` e
`#vários`: `gt(pedidoTitular.id, depoisDe)` e `.orderBy(asc(pedidoTitular.id))`). O id é `uuidv7()`, a ordem do **registro**. A tela
ordena pela chegada mais recente primeiro, com o id no empate (`textos-dos-pedidos.ts`, `ordenarOsPedidos`), mas só entre as páginas já
lidas. Com mais de 50 pedidos na escola, a primeira página traz os 50 registrados há mais tempo, e o pedido que a coordenação acabou de
registrar fica na segunda página, atrás de "Ver mais pedidos". A pessoa registra e não o vê na lista.

## Fora desta correção

Nada: nenhuma tarefa em curso (as 20 estão feitas). O `tasks/prd-lgpd-e-titular/estado.md`, alterado na árvore, é do Orquestrador e entra
no commit desta correção, a pedido dele.

Também não entram: "Meus dados" (`packages/nucleo/src/titular/arquivo-do-titular.repository.ts`), que já lê por `desc(id)` com teto de 50
e não tem o defeito; e o `16_task.md`, que está fechado e não se edita.

## Causa

A 16.0 escolheu o id como chave da página porque o cursor é o id do último item (`proxima`, um uuid, no contrato da 11.0), e a ordem por
id é a única que o cursor de um campo só dá sem consulta a mais. A tela foi escrita para compensar (`ordenarOsPedidos`), e a 16.0 deixou
a dívida dita. O repository nunca ordenou pela chave que a tela e o `docs/interface.md` (a lista, "a mais recente primeiro") pedem.

## Teste que reproduz

`apps/api/test/pedido-titular.int.test.ts` › `a lista pagina pela chegada mais recente primeiro e pelo id no empate…`: registra cinco pedidos
com a chegada fora da ordem do registro (o último a ser registrado é o de chegada mais antiga, e dois chegaram no mesmo dia), lê com
`?limite=2` e confere a ordem, a `proxima`, os ids da auditoria por página e que nenhuma página repete nem pula. Vermelho antes: a primeira
página trazia os dois pedidos registrados primeiro.

## Correção

1. `apps/api/src/privacidade/pedidos.repository.ts` › `listar` e `#vários`: a página sai na **chave que a tela já usa**, `chegou_em`
   decrescente e `id` crescente no empate (`orderBy(desc(chegouEm), asc(id))`). O cursor continua sendo o id do último item da página
   (`proxima`, o contrato não muda): o repository acha a linha dele **na escola do contexto e entre os pedidos que a pessoa pode ler**
   (a mesma `daLista`: escola, `ne(titularId)` e a exclusão pela conta) e devolve o que vem depois dela na chave
   (`chegou_em < dele`, ou `chegou_em = dele` com `id > dele`). Cursor de outra escola, cursor que não existe e cursor do pedido sobre a
   própria pessoa de quem lê não são achados e respondem **a página vazia, sem `proxima`** (regra 10, item 6; nunca a primeira página de
   novo, que a tela leria em laço). O filtro da lista fica antes do limite, como estava.
2. `apps/api/src/privacidade/privacidade.service.ts` › `pedidos`: **não muda**. `proxima` segue sendo o id do último item da página, e a
   auditoria `pedidos.listados` leva os ids da página na ordem em que saem.
3. `apps/api/test/pedido-titular.int.test.ts`: o caso que fixava a ordem por id virou o da chegada (vermelho primeiro), e um caso novo
   para o cursor (o de outra escola, o inexistente e o do pedido sobre si mesmo; e a página depois de um cursor válido não traz o de B
   nem o sobre si mesmo que chegaram depois).
4. `e2e/pedidos-do-titular.spec.ts` › `a leitura atrasada da segunda página…` e `estados da lista…`: deixaram de fixar o defeito. O
   pedido registrado agora abre a primeira página (a fábrica `criarPedidosDoTitularNoBanco` serve como está), e a segunda traz só os
   mais antigos.
5. `e2e/__fixtures__/sessao.ts` › `criarPedidosDoTitularNoBanco` e `criarPedidoDeTitularEliminadoNoBanco`: o dia da chegada passou de
   `current_date` (UTC, no banco) para `(now() at time zone 'America/Sao_Paulo')::date`, o dia de `hoje()` e o que a API aceita. **Não
   estava no pedido** (a triagem dizia que a fábrica servia como estava), e entrou porque o e2e dos estados falhou às 22h55 de São Paulo
   (01h55 UTC, já o dia seguinte): a linha "de ontem" da fábrica trazia o dia de hoje de São Paulo, e a asserção da data
   (`ontem` de `hoje()`) ficava vermelha, com ou sem esta correção. É o `current_date` em UTC que o `17_task.md` já deixou como recomendação
   sem aplicar para essas duas fábricas; a terceira (`PedidoDoTitularSemeado`, `chegouHaDias`) não foi tocada. Fora das 21h à meia-noite de
   São Paulo o resultado é o mesmo de antes.
6. Comentários e documentos: `textos-dos-pedidos.ts` (`ordenarOsPedidos`) e `Pedidos.tsx` (diziam que a API pagina por id),
   `packages/nucleo/src/db/schema/pedido-titular.ts` (o índice da página), `techspec.md` §4 e §9 ("Tarefa 16.0, como ficou no código") e
   `cenarios.md` (os dois cenários novos, em RF16). `16_task.md` não se edita: a tarefa está fechada.

**Sem migration, e a conta para o `infra-guardian`.** O índice `(escola_id, id)` já filtra pelo escopo (regra 80, item 8): a query lê só
os pedidos **de uma escola**, ordena em memória por `(chegou_em desc, id)` e corta em `limite + 1`. Um pedido nasce de um titular que
pede à escola (acesso, portabilidade, compartilhamento, correção, eliminação): dezenas por ano numa escola de novecentos alunos, e a
retenção é vigência + 5 anos, então centenas na vida da conta. A tabela não cresce com o uso do aluno (nenhuma linha por mensagem,
resposta ou evento), a rota não está no caminho quente do horário de aula (é da coordenação, com a finalidade registrada) e a
paginação por página de 50 passa a custar a ordenação de centenas de linhas, e não de milhões. Se o `infra-guardian` exigir o índice
`(escola_id, chegou_em, id)`, é migration de expansão com só o índice, como a triagem previu.

## Mutações

Cada cláusula que o diff acrescenta, apagada ou trocada, com o teste vermelho (rodadas em `apps/api/test/pedido-titular.int.test.ts`,
depois da última edição do repository):

| Cláusula | Mutação | Teste vermelho |
|---|---|---|
| `orderBy`: `desc(chegouEm)` | `asc(chegouEm)` | › `a lista pagina pela chegada mais recente primeiro…` |
| `orderBy`: `asc(id)` no empate | `desc(id)` | › `a lista pagina pela chegada mais recente primeiro…` |
| `depoisDele`: `lt(chegouEm, cursor.chegouEm)` | removida (`false`) | › `a lista pagina pela chegada mais recente primeiro…` |
| `depoisDele`: o ramo do empate (`eq(chegouEm)` e `gt(id)`) | só o `lt` | › `a lista pagina pela chegada mais recente primeiro…` |
| `depoisDele`: `gt(id, cursor.id)` | só `eq(chegouEm)` | › `a lista pagina pela chegada…` e › `o cursor de um pedido de outra escola…` |
| `if (cursor === undefined) return []` | cai na primeira página | › `o cursor de um pedido de outra escola…` |
| cursor achado só por `eq(id)` (sem a escola e sem a exclusão) | sem `daLista` | › `o cursor de um pedido de outra escola…` |
| cursor achado só por escola e `eq(id)` (sem a exclusão do pedido sobre si) | sem `ne` e sem a conta | › `o cursor de um pedido de outra escola…` |
| a página seguinte sem o filtro da lista (`daLista`) | só a escola | › `o cursor de um pedido de outra escola…` |
| a página seguinte sem a escola | só `ne(titularId)` | › `a lista pagina pela chegada…` e › `o cursor de um pedido de outra escola…` |
| a primeira página sem a escola | só `ne(titularId)` | seis testes do arquivo, entre eles os dois novos |
| `limite + 1` na página seguinte | `limite` | › `a lista pagina pela chegada mais recente primeiro…` (sem `proxima` na 2ª página) |
| e2e › `a leitura atrasada da segunda página…` e `estados da lista…`: a API ordena só por `asc(id)` | `orderBy(asc(id))` | os dois, nos projetos `chromebook` e `celular` (4 vermelhos de 22; os outros 18 passaram) |
| a exclusão pela conta (`usuario.contaId <> contaId`, que **não é do diff**: só mudou de nome, `criterio` → `daLista`) | removida | › `o titularId de B, o id sorteado e o pedido sobre si mesmo…` e › `o cursor de um pedido de outra escola…` |

**Uma não fica vermelha, e não é do diff:** `ne(pedidoTitular.titularId, deQuemPediu.usuarioId)`, apagada, deixa tudo verde, porque a
exclusão pela conta cobre o mesmo caso (o pedido sobre o `usuarioId` de quem lê tem a mesma `conta_id` dele). Só distingue quando quem
lê não tem conta, que o teste não semeia; a cláusula é da 11.0, não foi tocada, e fica como recomendação sem aplicar abaixo.

## Recomendações sem aplicar

Da 1ª rodada (cinco aprovados; quatro recomendações baratas **aplicadas**: o `chegouEm` calculado uma vez no teste, o comentário
do cursor em `listar`, o item do cursor no comentário do schema e o cursor do pedido sobre quem lê na linha `GET pedidos` da Tech
Spec). As que ficaram:

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª), privacy-guardian (1ª), tenancy-guardian (1ª), revisor-geral (1ª) | `ne(pedidoTitular.titularId, deQuemPediu.usuarioId)` (`pedidos.repository.ts`, `listar`) não tem teste que fique vermelho sem ela: a exclusão pela conta cobre o mesmo caso, e só distinguem quando quem lê não tem conta, o que `escolaComPessoas` não semeia | `TODO.md`, antes do pouso do F3 (validação). A cláusula é da 11.0 e não é do diff; o caso novo pede uma coordenação sem conta na fixture (muda o seed do arquivo todo), não é barato |
| privacy-guardian (1ª) | A busca do cursor traz a linha inteira só para usar `chegouEm` e `id`; selecionar só essas duas colunas, ou usar `#um` | Recusada: a linha não sai da API (o DTO continua explícito e a busca não é devolvida), e é a junção de `#vários` que aplica a exclusão pela conta; `#um` perderia o filtro (revisor-geral, 1ª, item 2 da ordem) |
| infra-guardian (1ª) | A chave `(chegou_em desc, id)` não tem índice próprio | `TODO.md`, com o gatilho que o revisor deu: `EXPLAIN` com dado sintético no volume de rede pública. Seria migration de expansão só com `(escola_id, chegou_em, id)`; hoje a ordenação roda sobre dezenas de pedidos por escola por ano |
| infra-guardian (1ª) | A terceira fábrica do e2e (`criarPedidoDoTitularNoBanco`, `chegouHaDias`) ainda usa o `current_date` em UTC e falha das 21h à meia-noite de São Paulo | Não procede: ela já usa `(now() at time zone 'America/Sao_Paulo')::date` no `HEAD` (`e2e/__fixtures__/sessao.ts`, linha 1127). Nada a fazer |
| test-engineer (1ª) | A mutação do e2e (4 vermelhos de 22) não foi refeita pelo revisor | Sem ação: observação. Fica sustentada pelo registro da seção "Mutações"; as asserções novas afirmam direto o que era o defeito |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-10-10 23:32:06 | 2026-10-10 23:33:45 | `test-engineer` | 1 | APROVADO | abf8419acaba66182 |
| 2026-10-10 23:34:02 | 2026-10-10 23:34:27 | `privacy-guardian` | 1 | APROVADO | af05f2b7c8e06211a |
| 2026-10-10 23:34:04 | 2026-10-10 23:34:36 | `infra-guardian` | 1 | APROVADO | a8489b20a357ea4eb |
| 2026-10-10 23:34:00 | 2026-10-10 23:34:37 | `tenancy-guardian` | 1 | APROVADO | aff78162dab0d0ba4 |
| 2026-10-10 23:34:07 | 2026-10-10 23:34:53 | `revisor-geral` | 1 | APROVADO | abc14791123311e15 |
| 2026-10-10 23:41:20 | 2026-10-10 23:41:58 | `test-engineer` | 2 | APROVADO | a835a2727487a182f |
| 2026-10-10 23:42:06 | 2026-10-10 23:42:33 | `revisor-geral` | 2 | APROVADO | a716b20f531bc0df6 |
