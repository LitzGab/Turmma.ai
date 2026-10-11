# Achados das revisões — `tasks/correcoes/2026-10-10-ordem-da-lista-de-pedidos.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-10 23:33:45 · `tasks/correcoes/2026-10-10-ordem-da-lista-de-pedidos.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** a lista sai com a chegada mais recente primeiro e o id no empate. O pedido registrado agora abre a primeira página, mesmo com mais de 50 pedidos.
- **Borda (data):** a chegada não segue a ordem do registro. O último registrado é o de chegada mais antiga.
- **Borda (empate):** dois pedidos com a mesma chegada, desempatados pelo id.
- **Borda (paginação):** a `proxima` é o id do último item. As páginas, juntas, são a lista toda, sem repetir nem pular, e a última não tem `proxima`.
- **Borda (cursor ruim):** um cursor que não existe devolve a página vazia, e nunca a primeira página de novo, que a tela leria em laço.
- **Permissão:** o cursor do pedido sobre a própria pessoa de quem lê se comporta como inexistente. A página depois de um cursor válido não traz o pedido sobre si mesma que chegou depois.
- **Isolamento:** o cursor de um pedido de outra escola devolve a mesma resposta que o inexistente. A página depois de um cursor válido não traz o pedido de outra escola, nem quando a chegada dele vem depois na ordem.
- **Auditoria:** `pedidos.listados` leva os ids de cada página, na ordem em que saem.
- **e2e:** a lista relida depois do registro traz o pedido novo na primeira página, e a leitura atrasada da segunda página não vence a lista nova.
- **Concorrência:** não se aplica a esta correção. A rota só lê, e o registro em paralelo já é coberto pela `chave_envio`, que não mudou.

**Cobertos:** todos.
- Os dois testes de integração estão em `apps/api/test/pedido-titular.int.test.ts:308` (ordem e páginas) e `:362` (os três cursores, a página depois de um cursor válido e o filtro antes do limite).
- O e2e está em `e2e/pedidos-do-titular.spec.ts:454` e `:631`. Ele passou a afirmar a ordem certa, e não mais o defeito.
- Rodei o arquivo de integração e os 23 testes passaram.
- Refiz duas das mutações da tabela, e as duas ficaram vermelhas como ela diz:
  - Tirar a escola e a exclusão de quem lê da busca do cursor quebrou `o cursor de um pedido de outra escola…` e o teste de auditoria.
  - Tirar o `gt(id)` do empate quebrou os dois testes novos.
- Depois de cada mutação, devolvi o repository da cópia em scratchpad. Ele ficou idêntico ao da correção (`cmp`). Não usei `git checkout`, que apagaria a correção ainda sem commit.
- Não há `.skip`, nem mock que esconda a regra, nem chamada de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `apps/api/test/pedido-titular.int.test.ts:317-318`, o teste calcula `haDias(dias)` duas vezes, uma para o registro e outra para a ordem esperada. Se o teste rodar exatamente na virada do dia em São Paulo, os dois valores divergem. Calcular uma vez só e usar nos dois lugares tira essa chance.
2. A cláusula `ne(pedidoTitular.titularId, deQuemPediu.usuarioId)`, de `apps/api/src/privacidade/pedidos.repository.ts:156`, ainda não tem teste que falhe sem ela. A exclusão pela conta cobre o mesmo caso. A cláusula é da 11.0, e a própria correção já registra isso. Falta um caso com quem lê sem conta (`contaId === null`), para a cláusula não sair por engano.
3. Só uma mutação da tabela não refiz: a do e2e (4 vermelhos em 22, nos projetos chromebook e celular). Ela fica sustentada pelo registro do Implementador. As asserções novas, em `e2e/pedidos-do-titular.spec.ts:527` e `:644`, afirmam diretamente o que era o defeito.

**Arquivos:**
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-10-ordem-da-lista-de-pedidos.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/pedidos-do-titular.spec.ts

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-10 23:34:27 · `tasks/correcoes/2026-10-10-ordem-da-lista-de-pedidos.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. A correção só muda a ordem e o cursor da `GET /v1/privacidade/pedidos`. O schema (`packages/nucleo/src/db/schema/pedido-titular.ts`) mudou apenas num comentário, sem migration.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok.
- **Como o cursor é achado.** O `pagina` é procurado com o mesmo filtro da lista (`daLista`: escola do contexto, `ne(titularId)` e a exclusão pela conta) em `apps/api/src/privacidade/pedidos.repository.ts:151`. A página que vem depois dele também passa por `daLista` (linha 154).
- **Troca do id na URL.** Um cursor de outra escola, um inexistente e o do pedido sobre a própria pessoa respondem igual: `{ itens: [] }`, sem `proxima` (linha 152). Isso cumpre a regra 10, item 6, e a tela não entra em laço.
- **Testes.** O teste novo cobre os três casos e prova que o pedido de outra escola e o sobre a própria pessoa não aparecem na página depois de um cursor válido (`apps/api/test/pedido-titular.int.test.ts:236-282`).
- **Saída.** O DTO continua explícito: `esquemaRespostaPedidos.parse` em `privacidade.service.ts:277`. A busca interna do cursor não sai da API.

Logs: limpos. Nenhum log foi acrescentado.

Auditoria: presente. O registro `pedidos.listados` continua com os ids da página na ordem em que saem (`privacidade.service.ts:271`). O teste confere a auditoria das três páginas. A busca interna do cursor não entrega dado, por isso não precisa de registro.

Envio externo: nenhum.

Seed/fixture: sintético. Os nomes vêm de `marca()` e `nome(...)`, e a mudança em `e2e/__fixtures__/sessao.ts:1070,1087` só troca `current_date` pelo dia de São Paulo.

Bloqueantes: nenhum.

Recomendações:
- `pedidos.repository.ts:151`: a busca do cursor traz a linha inteira (colunas do pedido mais a conta do titular) só para usar `chegouEm` e `id`. Bastaria selecionar só essas duas colunas, ou usar `#um`. Não vaza nada, mas é o mínimo necessário aplicado também dentro da API.
- O `ne(pedidoTitular.titularId, deQuemPediu.usuarioId)` continua sem teste que o distinga da exclusão pela conta (o caso de quem lê sem conta). É da 11.0, e a própria correção já declara isso. Vale um caso de integração antes do pouso, porque essa cláusula é a que impede a pessoa de ler um pedido sobre si mesma.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-10 23:34:36 · `tasks/correcoes/2026-10-10-ordem-da-lista-de-pedidos.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts:163` e `:230`: a nova ordem `(chegou_em desc, id asc)` não tem índice próprio. Hoje o `(escola_id, id)` já limita a busca a uma escola, e a ordenação fica em centenas de linhas na vida da conta, então o volume não justifica bloquear. O índice `(escola_id, chegou_em desc, id)`, numa migration que só crie o índice, deve virar item no `TODO.md`. O gatilho para criá-lo é um `EXPLAIN` com dado sintético em volume de rede pública.
- A página por cursor só é estável porque nada muda o `chegou_em` e nada apaga linha de `pedido_titular` (conferi: só há `update` de estado e de marca da eliminação). Vale registrar isso como invariante no comentário do schema (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/pedido-titular.ts`). Se um expurgo futuro apagar pedido, o cursor que apontava para ele passa a devolver página vazia, e a tela para de paginar no meio da lista.
- A mudança das duas fábricas do e2e para o dia de São Paulo (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/e2e/__fixtures__/sessao.ts:1070` e `:1087`) não viola o `check` do banco `chegou_em <= current_date`, porque o dia de São Paulo nunca passa do dia em UTC. A terceira fábrica (`PedidoDoTitularSemeado`, que usa `chegouHaDias`) ainda calcula o dia pelo `current_date` em UTC e falha no mesmo horário, das 21h à meia-noite de São Paulo. Fica para o `/retro`.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-10 23:34:37 · `tasks/correcoes/2026-10-10-ordem-da-lista-de-pedidos.md`

VEREDITO: APROVADO

Tabelas verificadas: `pedido_titular`. Não há migration nem coluna nova. A tabela continua com `escola_id`, id UUID e o índice `(escola_id, id)`, que começa pelo escopo. A mudança em `packages/nucleo/src/db/schema/pedido-titular.ts` é só comentário.

Queries verificadas:
- `PedidosRepository.listar` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts:154-165`):
  - **Escopo da escola:** sai de `exigirEscolaDoContexto()`, no `daLista`. Não vem de parâmetro.
  - **Busca do cursor:** usa `and(daLista, eq(id, depoisDe))`, com escola e com a exclusão do pedido sobre quem lê. O id de outra escola não serve de âncora. Um cursor de B, inexistente ou sobre si mesmo responde igual: a página vazia, sem `proxima`. Não revela que o id existe.
  - **Página seguinte:** usa `and(daLista, depoisDele)`, e o escopo continua aplicado.
- `#vários` (`pedidos.repository.ts:223-232`): mudou só o `orderBy`. O `leftJoin` com `usuario` continua preso por `usuario.escolaId = pedidoTitular.escolaId`.
- O endpoint não ganhou parâmetro. `?pagina=` é id de pedido e passa pela busca com escopo. Nenhum `escolaId` vem do cliente.
- Nenhum `@SemEscopo()` foi adicionado. A mudança não toca consulta da camada de rede.

Teste de isolamento: presente e efetivo. Está em `apps/api/test/pedido-titular.int.test.ts`, no caso "o cursor de um pedido de outra escola, o inexistente e o do pedido sobre a própria pessoa…". Tirei mentalmente cada cláusula, e em todos os casos o teste quebra:
- **Escola fora da busca do cursor:** o `idDeB` é de hoje e tem id menor que o pedido do aluno de A. O cursor seria achado, o pedido do aluno entraria na página e ela deixaria de ser vazia.
- **Escola fora da página seguinte:** o `deBDepois`, de 3 dias atrás, apareceria depois do cursor válido, e `depoisDoSeu` deixaria de ser `{ itens: [] }`.
- **Exclusão do pedido sobre si mesmo fora do cursor ou da página seguinte:** aparecem `idSobreEla` ou `sobreElaDepois`.

Bloqueantes: nenhum

Recomendações:
- A chave `(chegou_em desc, id)` não tem índice próprio, e a escolha está justificada pelo volume de pedidos por escola. A decisão sobre o índice `(escola_id, chegou_em, id)` cabe ao `infra-guardian`.
- `ne(pedidoTitular.titularId, deQuemPediu.usuarioId)` não tem teste que a distinga, porque a exclusão pela conta cobre o mesmo caso. Só faria diferença com quem lê sem `contaId`. A cláusula não é deste diff, e a própria correção já registra isso.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-10 23:34:53 · `tasks/correcoes/2026-10-10-ordem-da-lista-de-pedidos.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A ordem nova (a chegada mais recente primeiro, o id no empate) e a página vazia para cursor que não pode ser lido estão na `techspec.md` §4, na `techspec.md` §9 ("Tarefa 16.0, como ficou no código") e nos dois cenários novos da RF16 em `cenarios.md`. O contrato não mudou: continuam `?pagina=<uuid>`, `proxima` e a página de 50. A mudança na fábrica do e2e não estava na triagem, mas está declarada e justificada no item 5 do documento da correção. Ela troca o `current_date` em UTC pelo dia de São Paulo, que é o que `hoje()` usa. Não é divergência de arquitetura.

Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)

Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/prd-lgpd-e-titular/techspec.md:179`: a linha de `GET pedidos` lista o cursor de outra escola e o inexistente, mas não o cursor do pedido sobre a própria pessoa de quem lê. Esse caso o repository e o `cenarios.md` já tratam como página vazia. Acrescentar o terceiro caso deixa a spec igual ao código.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts:161`: o cursor é procurado com `#vários(..., 1)`, que faz a junção completa e a ordenação para achar uma linha só. Funciona e aplica `daLista`, que é o importante. Um comentário de uma linha diria que a junção é proposital, porque é ela que aplica a exclusão pela conta. Sem isso, alguém pode trocar por `#um`/`de` mais tarde e perder o filtro.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts:157`: o próprio documento da correção já registra que `ne(titularId, usuarioId)` não tem teste que o distinga quando quem lê não tem conta. Isso fica para a seção "Recomendações sem aplicar" do documento.

## test-engineer · 2ª rodada · APROVADO · 2026-10-10 23:41:58 · `tasks/correcoes/2026-10-10-ordem-da-lista-de-pedidos.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada, sem mudança. A página sai pela chegada mais recente primeiro, com o id desempatando quando dois pedidos chegam no mesmo dia. A paginação por cursor não repete nem pula pedido, e a auditoria leva os ids de cada página. Cursor de outra escola, cursor que não existe e cursor do pedido sobre quem lê devolvem a página vazia, sem `proxima`. A página seguinte não traz pedido de outra escola nem o pedido sobre quem lê. O e2e dos estados da lista e da segunda página lida atrasada também continua igual.

Cobertos: todos. Nesta rodada conferi só o que mudou desde a aprovada.
- **O teste** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts:316-319`): agora a data de chegada é calculada uma vez e usada tanto no registro quanto na lista `registrados`. O teste afirma o mesmo que antes, e um efeito colateral é bom: antes a data era calculada duas vezes, e um teste rodado em cima da meia-noite podia pegar dois dias diferentes. O arquivo roda verde, 23 de 23.
- **Mutação refeita sobre o teste novo:** troquei o desempate `asc(pedidoTitular.id)` por `desc(pedidoTitular.id)` em `pedidos.repository.ts:232`. Escolhi essa porque é a que depende dos dois pedidos do mesmo dia, justamente o trecho que o refactor mexeu. O caso da chegada mais recente ficou vermelho na linha 332 (primeira página com os ids trocados). Desfiz a mutação e conferi que a linha 232 voltou ao original. As outras alterações da árvore desse arquivo não foram tocadas.
- **`pedidos.repository.ts` e `pedido-titular.ts`:** só comentário, sem mudança de comportamento. Confere com o diff.
- **`techspec.md`, `TODO.md` e o documento da correção:** só texto. A linha `GET pedidos` da Tech Spec agora diz o mesmo que o cenário do cursor sobre quem lê.
- **Correções exigidas na 1ª rodada:** nenhuma, então não há o que conferir.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. As da 1ª rodada seguem registradas na seção "Recomendações sem aplicar" do documento da correção e no `TODO.md`, com o momento de cada uma. São duas:
- A cláusula `ne(titularId)` não tem teste que a distinga da exclusão pela conta. Fica para a validação do F3.
- O índice `(escola_id, chegou_em, id)` ainda não existe. Entra se um `EXPLAIN` no volume de uma rede pública mostrar custo.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-10 23:42:33 · `tasks/correcoes/2026-10-10-ordem-da-lista-de-pedidos.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A linha `GET pedidos` da `techspec.md` §4 agora inclui o cursor do pedido sobre a própria pessoa de quem lê, que devolve a página vazia. É o mesmo que fazem o repository e o teste `o cursor de um pedido de outra escola…`.

Portão local: carimbo válido (`conferir` saiu com 0: typecheck, lint, segredo, dependências, unidade e alvo, para o código atual).

Bloqueantes: nenhum.

O que conferi nesta rodada, contra `.processo/ordens/diff-ordem-r2.txt`:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/test/pedido-titular.int.test.ts:316-320`: o `chegouEm` agora é calculado uma vez e serve ao registro e a `registrados`. Isso tira o risco de o dia virar entre as duas chamadas de `haDias`. O resto do caso não mudou.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/api/src/privacidade/pedidos.repository.ts:161-162`: o diff só acrescenta um comentário, e ele confere com o código. O cursor é achado por `#vários` com `daLista`, que aplica a escola e as duas exclusões.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/db/schema/pedido-titular.ts:39-41`: o comentário diz que nenhum caminho apaga a linha nem muda `chegou_em`. Procurei e confirmei: em `apps/api/src`, `packages/nucleo/src` e no worker, nenhum caminho apaga linha de `pedido_titular`. Os `update` (`pedidos.repository.ts:113`, `:182` e `arquivo-do-titular.repository.ts:113`) só mexem em estado e nas marcas.
- `TODO.md` e a tabela "Recomendações sem aplicar" do documento: cada recomendação da 1ª rodada tem destino, dono e gatilho, ou o motivo de ter sido recusada. A recusa de usar `#um` no cursor se sustenta: perderia a exclusão pela conta, que vem da junção.

Recomendações:
- A cláusula `ne(pedidoTitular.titularId, deQuemPediu.usuarioId)`, em `listar`, ainda não tem teste que fique vermelho sem ela. Já está no `TODO.md` para a validação do F3. Não deixe passar dali: é uma regra de privacidade que hoje só se sustenta porque outra cláusula cobre o mesmo caso.
