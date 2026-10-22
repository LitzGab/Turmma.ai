# Achados das revisões — `tasks/prd-reengenharia/15_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 13:01:28 · `tasks/prd-reengenharia/15_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration. A tarefa só muda a borda de entrada.

Queries verificadas: nenhum repository foi alterado. Conferi o escopo a partir do contexto onde a tarefa toca:
- **Turma:** `apps/api/src/estrutura/turma.repository.ts:57, 100, 123, 153, 166, 193`. A escola vem de `exigirEscolaDoContexto()` e o ano de `exigirAnoEmCurso()`. O `?anoLetivoId` do cliente só restringe a busca, e a escola continua vindo do contexto.
- **Governança:** `apps/api/src/governanca/governanca.repository.ts:235, 246, 260`. A suspensão é lida e gravada com `escolaId` do contexto.
- **Corpo e consulta:** passam pelo `ZodValidationPipe` com esquemas estritos. `escolaId` ou `turmaId` a mais no corpo ou na consulta dá `ENTRADA_INVALIDA`, e nenhuma rota dos três módulos usa `escolaId` vindo do cliente para decidir o que ler.
- **Id do caminho:** o `IdPipe` devolve o mesmo 404 do id inexistente para id fora do formato, como fazia o `idDoCaminho`, e continua passando o id para minúsculas.
- **`chave` da governança:** fora do catálogo, dá o mesmo 404 do inexistente (`errorCode: NAO_ENCONTRADO`).
- **Id e corpo inválidos ao mesmo tempo:** em 15 rotas a resposta passou de 404 para 400. Isso não revela existência: o corpo é validado antes de qualquer leitura no banco, então todo id dá o mesmo 400, seja fora do formato, inexistente ou de outra escola. O teste `borda-de-entrada.int.test.ts › com o id e o corpo ou a consulta inválidos ao mesmo tempo` cobre isso.
- **Guarda antes do pipe:** a guarda responde antes do pipe. Sem sessão dá 401. O aluno, mesmo com id e corpo inválidos, recebe o 404 da guarda.
- **`@SemEscopo()` e camada de rede:** nenhum `@SemEscopo()` no diff, e nada da camada de rede foi tocado.

Teste de isolamento: presente e efetivo. Os testes de outra escola trocam o id e o `escolaId` do corpo e da consulta, e o banco é conferido depois de cada chamada:
- `apps/api/test/estrutura-isolamento.int.test.ts:93`
- `apps/api/src/governanca/governanca.int.test.ts:340`
- `apps/api/test/borda-de-entrada.int.test.ts`

O caso em que a cláusula de escola é a única barreira já está coberto em `apps/api/test/historico.int.test.ts:262` e `:279`.

Bloqueantes: nenhum

Recomendações:
- `tasks/prd-reengenharia/15_task.md:47`: a tabela diz que o caso novo de `estrutura-isolamento.int.test.ts:93` fica vermelho ao tirar `eq(turma.escolaId, …)`. Não fica. Sem `?anoLetivoId`, a cláusula `eq(turma.anoLetivoId, exigirAnoEmCurso())`, que também vem do contexto, já exclui a turma de B, então o teste só quebra se o escopo inteiro sair. Há duas saídas:
  - corrigir o texto da mutação para "tirar o escopo de escola e ano do contexto";
  - ou acrescentar ao caso a leitura com `?anoLetivoId=<ano encerrado de B>`, que é onde o `eq(turma.escolaId, …)` é a única barreira.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 13:01:41 · `tasks/prd-reengenharia/15_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O que conferi:

- **Escopo.** Os 14 controllers de entrada saíram de `lerEntrada`, `idDoCaminho`, `lerConsultaPaginada` e `safeParse`: 8 em `estrutura/`, 3 em `sala/` e 2 em `governanca/`. O `minha-turma.controller.ts` não lê entrada e completa os 4 de `sala/`. `entrada.ts` e o `paginar` ficam para a 17.0, como pede `onda-1a.md` T1. Os três módulos entraram no `files` do `eslint.config.mjs`. `sessao/` e `operacao/` não foram tocados.
- **Comportamento.** `ZodValidationPipe` e `IdPipe` fazem o mesmo que `lerEntrada` e `idDoCaminho`: o mesmo código de erro e o id em minúsculas. O `pipeDaChave` com `errorCode: NAO_ENCONTRADO` mantém o 404 da `chave` fora do catálogo. O `revogar` aceita a requisição sem corpo pelo `.default({})`, que antes era o `?? {}`. O `retomar` sem corpo continua recusado, como no código antigo.
- **Divergências.** As três estão registradas: a caracterização no commit da tarefa, as 15 rotas que passam do 404 a 400 quando id e corpo são inválidos juntos, e o "sem finalidade" que vira "corpo fora do esquema". A (1) e a (2) estão em `onda-1a.md` T1, no parágrafo "A 15.0 repete a conduta". Esta spec não tem `cenarios.md`. A mudança para 400 não revela se o id existe, porque com a entrada inválida qualquer id ou `chave` dá o mesmo 400. O caso de `borda-de-entrada.int.test.ts:266` prova isso.
- **Mutações.** Há uma por parâmetro migrado, mais o `errorCode` da `chave` e as três entradas do `files` do ESLint. Todas apontam para casos que existem.

Recomendações:

1. A tabela "Arquivos previstos" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/15_task.md:37` ainda lista como alterados `lista`, `vinculo`, `virada-do-ano`, `salas-reivindicar` e `acesso-da-turma`, que não mudaram. O arquivo novo, `apps/api/test/borda-de-entrada.int.test.ts`, não aparece. Vale corrigir a tabela.
2. Pela regra 40, o portão da tarefa só roda os testes de integração que a tarefa alterou. Os casos da tabela que vivem nesses cinco arquivos não rodaram antes do commit: dois alunos com o mesmo nome, lote inválido, virada do ano, duas disciplinas no vínculo e a corrida da sala. Também não vi o código da sala fora do formato coberto: a rota `salas/abrir` em `borda-de-entrada.int.test.ts:170` usa um código no formato certo. Isso é do `test-engineer`; fica o registro.
3. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sala/acesso-da-turma.controller.ts:34` o esquema `.default({})` é montado na linha do handler. `professores.controller.ts:15`, da 14.0, guarda o mesmo esquema numa constante do módulo (`esquemaSemCorpo`). Melhor seguir um jeito só.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 13:04:26 · `tasks/prd-reengenharia/15_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os 16 da tabela da 15.0. São: a paginação de estrutura (101 e página fora do formato recusados, 100 passa); a turma de B vista do contexto de A; a borda e a permissão de `escola-sessao`; dois alunos com o mesmo nome na lista; lote inválido que não grava nada; ano letivo e virada; duas disciplinas na mesma turma; reivindicação inválida que deixa o nome livre; corrida de dois pedidos no mesmo nome com `Promise.all`; link ou código fora do formato; `chave` fora de `FUNCOES`; `chave` de outra função e a inexistente respondendo igual; suspender com corpo inválido; suspender em A sem suspender em B; e a trava do lint nos três módulos. Somam-se a ordem da guarda antes do pipe e a ordem do Nest com id e corpo inválidos ao mesmo tempo.

**Cobertos (teste por linha da tabela):**
- **Limite 101 e página fora do formato:** `estrutura.int.test.ts:94` ("listagens paginadas", com `limite=101`, `limite=0` e `pagina=nao-e-uuid`), mais o caso novo em `:110` (100 passa e traz as três). Além disso, `borda-de-entrada.int.test.ts` testa 100 e 101 em cada GET paginado.
- **Turma de B no contexto de A:** `estrutura-isolamento.int.test.ts › a turma de B, no contexto de A, abrir, renomear e excluir dão o mesmo 404 do inexistente…`. Compara o id de B, o de B em maiúsculas, um sorteado e um fora do formato, e confere que B não mudou. Sem o `eq(escolaId)`, o id de B daria 200.
- **`escola-sessao`, borda:** o caso existente em `escola-sessao.int.test.ts:87`. **Permissão:** `:41`, agora com corpo inválido e campo a mais para professor e aluno, e mais o quarto `it.each` da borda, que cobre todas as rotas com guarda.
- **Homônimos:** `lista.int.test.ts:307-317`. **Lote inválido não grava:** os dois casos G2 de `lista.int.test.ts` (`:432` e `:463`), mais o `retrato()` da borda em `POST /v1/turmas/:id/lista`.
- **Ano letivo:** `estrutura.int.test.ts:213` (mesmo ano dá CONFLITO, período invertido dá ENTRADA_INVALIDA) e `virada-do-ano.int.test.ts`, verde.
- **Duas disciplinas na mesma turma:** `vinculo.int.test.ts:76` (Química e Física no 2ºB).
- **Reivindicação inválida deixa o nome livre:** `salas-reivindicar.int.test.ts › P5`. Usa o `retrato`, confere que nenhum hash foi gerado e que o mesmo pedido válido depois dá ENVIADO.
- **Corrida:** `salas-reivindicar.int.test.ts › C1` (`:627`).
- **Link ou código fora do formato:** `salas-abrir.int.test.ts:290-310` ("token fora do formato", "código fora do alfabeto", "slug fora do formato" dão NAO_ENCONTRADO).
- **`chave` fora do catálogo:** `governanca.int.test.ts:331` e a borda (suspender e retomar), com a mutação do `errorCode` provada.
- **Respondem igual com o mesmo corpo:** `governanca.int.test.ts › a chave fora do catálogo e a de uma função sem suspensão respondem igual…` (`:340`).
- **Suspender com corpo inválido:** o mesmo caso `:340`, que confere que suspensões e auditorias não mudam e que a função segue ativa. A divergência (3) está registrada com o lugar na spec.
- **Suspender em A não suspende em B:** `governanca.int.test.ts:520`, e as três suspensões por função (`:368`, `:398`, `:419`) com a outra escola seguindo.
- **Lint:** `guardas.test.ts`, no `it.each(MODULOS_MIGRADOS)` com os três módulos. O caso negativo passou a usar `sessao/`.

**Mutações contra o diff:** cada parâmetro que ganhou `IdPipe` ou `ZodValidationPipe` nos 13 controllers alterados tem o seu bloco. A rota com id e corpo tem dois blocos. O `.default({})` do revogar, o `errorCode: NAO_ENCONTRADO` do `pipeDaChave` (suspender e retomar) e as três entradas do `files` do ESLint também têm. Não há cláusula nova sem bloco. Cada caso da borda é uma rota só e compara o corpo do erro inteiro (só sem o `requisicaoId`), então a mutação cai no caso certo.

**Execução:**
- `borda-de-entrada` (99) e os quatro arquivos de integração alterados (57) passaram.
- `guardas.test.ts` (86) passou.
- O ESLint nos três módulos saiu limpo.
- Também rodei 14 arquivos não alterados que usam essas rotas e não entram no portão da tarefa: `lista`, `vinculo`, `virada-do-ano`, `salas-reivindicar`, `salas-abrir`, `acesso-da-turma`, `decisao`, `turma-acesso`, `analista`, `acesso-fim-do-vinculo`, `escola-montada`, `ciclo-de-vida`, `minha-turma` e `troca-de-escola`. Os 313 passaram.

Não há `.skip`, `.only` nem mock nos arquivos alterados. Nenhum teste chama provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em "Arquivos previstos", `lista`, `vinculo`, `virada-do-ano`, `salas-reivindicar` e `acesso-da-turma` constam como "alterado", mas a tarefa não os alterou. Com isso o portão da tarefa não os rodou; só a esteira roda. Eu os rodei e estão verdes. Vale registrar em "Divergências resolvidas" que a caracterização dessas linhas ficou nos testes existentes, que só a esteira cobre.
2. A tabela de testes cita a mutação e não o nome do teste. Para as linhas atendidas por testes existentes, vale escrever o nome, como no mapa acima, para o `/validar` não precisar refazer a busca.
3. Em `borda-de-entrada.int.test.ts:198`, a mutação do pipe no `retomar` só fica vermelha pelo byte nulo, que vira 500 no Postgres. Sem ele, o service já responde 404 a uma `chave` desconhecida. A prova vale, mas está presa a um detalhe do banco. Fica melhor com um comentário que diga isso, ou com um teste de unidade do `pipeDaChave`.
4. Em `borda-de-entrada.int.test.ts:288`, a chamada sem sessão confere só o status 401, e não o corpo inteiro, ao contrário do resto do arquivo.

Arquivos citados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/borda-de-entrada.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/governanca/governanca.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/estrutura-isolamento.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/15_task.md

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-22 13:16:43 · `tasks/prd-reengenharia/15_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. O caso novo grava `ano_letivo` e `turma` com `escola_id` e `ano_letivo_id`, e os ids são UUID gerados pelo banco.

Queries verificadas:
- `apps/api/src/estrutura/turma.repository.ts:186-216` (`aberta` com `anoEncerrado`). A escola vem de `exigirEscolaDoContexto()`. O `?anoLetivoId` do cliente só restringe a busca. O `exists` de `#doAnoDaLeitura` liga o ano a `turma.escolaId` e não ao contexto. Por isso, com o ano de B na consulta, `eq(turma.escolaId, …)` é a única cláusula que impede A de ler a turma de B.
- `turma.repository.ts:256-274` (`alunos` com `anoEncerrado`). O escopo de escola vem do contexto, e o service só chama `alunos` depois de `aberta`.
- `apps/api/src/sala/acesso-da-turma.controller.ts:7-8,38`. Só a constante `esquemaSemCorpo` foi extraída. O controller continua sem aceitar `escolaId` de fora, e o `IdPipe` continua no id.

Teste de isolamento: presente e efetivo. A correção pedida na 1ª rodada foi feita. Em `apps/api/test/estrutura-isolamento.int.test.ts:112-133`, a coordenação de A lê a turma de B passando o `anoLetivoId` encerrado de B. Testei mentalmente a mutação: sem `eq(turma.escolaId, exigirEscolaDoContexto())`, o `exists` continua satisfeito (o ano é de B e está encerrado), `aberta` devolve a turma e `abrir` responde 200 em vez de 404, então o caso fica vermelho. A leitura de controle da coordenação de B, que responde 200, garante que o teste não passa por montagem errada. A tabela de `tasks/prd-reengenharia/15_task.md` já aponta esse caso como o teste da mutação.

Bloqueantes: nenhum.

Recomendações:
- `apps/api/test/estrutura-isolamento.int.test.ts:128`: cada resposta é comparada com `mensagem: expect.any(String)`, mas as respostas não são comparadas entre si. Se a mensagem do 404 da turma de B fosse diferente da mensagem do inexistente, o teste não pegaria. O caso vizinho (`:104-105`) compara todas com a primeira. Vale fazer igual aqui (regra 10, item 6).

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 13:17:00 · `tasks/prd-reengenharia/15_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

As três recomendações da 1ª rodada foram atendidas:

1. **Tabela "Arquivos previstos"**: agora lista só `estrutura`, `estrutura-isolamento` e `escola-sessao` como alterados, e `borda-de-entrada.int.test.ts` como novo. Os cinco arquivos de teste que não mudaram estão explicados na divergência (4) de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/15_task.md`. Ela trata de onde a cobertura de teste roda, não de arquitetura, e o arquivo novo já está registrado em `onda-1a.md:139`.
2. **Casos fora do portão**: estão registrados nessa mesma divergência (4), com o nome de cada teste na tabela "Testes que provam a regra". Os cinco arquivos rodaram à mão, isolados; não há o que corrigir.
3. **Esquema sem corpo**: `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sala/acesso-da-turma.controller.ts:8` guarda agora o esquema na constante do módulo `esquemaSemCorpo`, como `professores.controller.ts` faz. As três mutações que citavam a linha antiga foram reescritas e continuam válidas. A que tira o `.default({})` agora muda a constante, e o efeito é o mesmo.

O resto do diff desta rodada também está correto:

- **Teste novo de isolamento** (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/estrutura-isolamento.int.test.ts:112`): a coordenação de A lê a turma de B passando o ano de B na consulta. Assim o filtro de ano não barra nada, e só a cláusula de escola do repository separa as duas escolas. O teste fica vermelho se essa cláusula sair. O controle positivo é a coordenação de B, dona da turma, lendo com 200, o que confirma que `esquemaConsultaTurma` aceita `anoLetivoId`.
- **Caso do anônimo** (`borda-de-entrada.int.test.ts:291`): antes conferia só o status 401; agora confere o corpo inteiro, com código e mensagem.
- **Comentário sobre o byte nulo** (`borda-de-entrada.int.test.ts:198`): explica por que a `chave` fora do catálogo sozinha não provaria o pipe.

Recomendações:
- O teste novo de isolamento cobre a remoção da cláusula de escola, mas nenhum bloco de mutação declara essa remoção. A tarefa é de controller, então não bloqueia. Se o `test-engineer` quiser a prova executada pelo portão, vale declarar a mutação no repository de turma citando esse caso.
- No mesmo teste, a função `ler(id, rota)` recebe `'?'` ou `'&'` para montar a consulta, o que deixa a montagem do caminho difícil de ler. Montar o caminho completo em cada chamada ficaria mais claro.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 13:17:36 · `tasks/prd-reengenharia/15_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** os quatro ajustes da 1ª rodada, e o que a rodada nova acrescenta:
- a constante `esquemaSemCorpo`, com as três mutações do revogar reescritas para ela;
- o 401 conferido com o corpo inteiro;
- o caso novo de isolamento: a coordenação de A lê a turma de 2025 de B passando o `anoLetivoId` de B.

**Cobertos:**
- **(1) Arquivos previstos:** a tabela agora lista só o que a tarefa mudou, mais o `borda-de-entrada.int.test.ts` como novo. A divergência (4) registra que lista, vínculo, virada do ano, reivindicação e acesso da turma ficaram nos testes que já existiam, e que só a esteira roda esses arquivos.
- **(2) Nomes dos testes:** cada linha de "Testes que provam a regra" agora cita o teste pelo nome. A linha "suspender sem finalidade" aponta para o mesmo caso da linha de cima, pela divergência (3).
- **(3) Comentário do retomar:** o comentário em `apps/api/test/borda-de-entrada.int.test.ts:198-200` explica por que só o byte nulo prova o pipe, e diz que a prova depende desse detalhe do banco.
- **(4) O 401:** em `apps/api/test/borda-de-entrada.int.test.ts:291` ele passou a ser conferido com o corpo inteiro (`NAO_AUTENTICADO`, sem o `requisicaoId`).
- **`esquemaSemCorpo`:** as três mutações (sem `IdPipe`, `@Body()` cru, e a constante sem `.default({})`) correspondem ao código atual em `apps/api/src/sala/acesso-da-turma.controller.ts:8,38`. A terceira fica vermelha pelo motivo certo: sem o default, o pedido sem corpo é recusado como inválido e não responde 204.
- **Caso novo de isolamento** (`apps/api/test/estrutura-isolamento.int.test.ts:112`), conferido contra o repository:
  - Com o ano encerrado de B na consulta, `#doAnoDaLeitura` não barra a turma de B, porque a subconsulta compara com a escola da própria turma (`turma.repository.ts:213`).
  - A coordenação de A não passa pelo filtro de vínculo.
  - Sobra só o `eq(turma.escolaId, exigirEscolaDoContexto())` de `turma.repository.ts:193`. Sem essa cláusula, abrir responde 200 com a turma de B, e a lista de alunos responde 200 com página vazia. O teste ficaria vermelho nos dois.
  - A asserção compara status, código e mensagem com o inexistente e com o id fora do formato. O caso também confere que a dona (B) lê a turma com 200.
- **Execução:** rodei `estrutura-isolamento.int.test.ts` (8/8 verdes) e `borda-de-entrada.int.test.ts` (99/99 verdes).

**Bloqueantes:** nenhum.

**Recomendações:**
1. A linha "Estrutura: turma de B, no contexto de A" diz que o teste fica vermelho se tirar o `eq(turma.escolaId, …)`, mas não há bloco de mutação para essa cláusula em `turma.repository.ts:193`. O portão não provou essa afirmação, só a minha leitura. A cláusula não é nova nesta tarefa, então não bloqueia. Mesmo assim, um bloco citando o caso novo deixaria a prova no portão.
2. O comentário em `turma.repository.ts:177-178` diz que "o ano precisa ser da escola do contexto". Isso só é verdade por causa da linha 193: a subconsulta da linha 213 compara com `turma.escolaId`, não com o contexto. Vale dizer isso no comentário, para ninguém achar que a subconsulta protege sozinha.

Arquivos relevantes:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/estrutura-isolamento.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/borda-de-entrada.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sala/acesso-da-turma.controller.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/estrutura/turma.repository.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/15_task.md
