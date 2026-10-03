# Achados das revisões — `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-03 18:58:14 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: encerrar o último vínculo confirmado do professor na turma, por `desligamento` e por `realocacao`, revoga o acesso que ele gerou, grava a auditoria e o link e o código deixam de abrir a sala.
- Eliminação do professor revoga o acesso que ele gerou.
- Borda: outro vínculo confirmado do mesmo professor na turma (outra disciplina) segura o acesso.
- Borda: quem sai não é quem gerou, e quem gerou já foi substituído por outro "Gerar novo".
- Borda: o acesso do mesmo professor em outra turma, onde ele continua, não cai.
- Link e código revogados respondem byte a byte como inexistentes.
- Permissão: a coordenação de B não encerra o vínculo de A.
- Isolamento: a cláusula de escola no repository, com contexto forjado.
- Concorrência com o gerar, nas duas ordens, tanto no encerrar quanto na eliminação.
- E27 revisto.

**Cobertos:**
- Sem a revogação, o teste do encerrar (as duas variantes do `describe.each`) quebra, e o da eliminação também (`acesso-fim-do-vinculo.int.test.ts:120` e `:214`).
- Sem a cláusula de escola, `:183-205` quebra. Esse teste tem controle positivo no contexto de B, então não passa por o acesso simplesmente não casar com nada.
- Sem o `criado_por`, `:150-166` quebra, porque o "outro" sai e revogaria o acesso do primeiro.
- Sem o `not exists`, `:128-148` quebra.
- Sem o `isNull(revogado_em)`, `:165` quebra, porque o acesso já revogado do primeiro seria auditado de novo.
- Sem a reconferência do vínculo no gerar, `:240` quebra. O gerar espera no `FOR SHARE`, a linha da turma não muda, o `exists` fica com o retrato antigo e o gerar devolve 201 onde o teste exige 404.
- Sem a trava no encerrar, `:220` quebra, pela espera em `for update` que estoura o prazo.
- As duas corridas são chamadas HTTP de verdade em paralelo, com gatilho de parada no banco, e não chamadas em sequência.
- Revogado igual a inexistente: `:102-108`.
- Permissão: `:174`.
- E27 (`decisao.int.test.ts:532-548` e `cenarios.md`): está coerente. O pedido chega antes, o link passa a dar 404 depois, a coordenação decide como `coordenacao`, e o "quebra sem" continua valendo.
- Nenhum `.skip`, nenhum mock de coisa nossa, nenhuma IA envolvida.

**Bloqueantes:**
1. A trava da eliminação não tem teste: `apps/api/src/sessao/ciclo-de-vida.service.ts:76` (`travarContraOGerarDoProfessor`), com a query em `apps/api/src/estrutura/turma.repository.ts:108-134`.
   - **O que está errado:** se a chamada for apagada, ou se o `where` for trocado por um que não trava nada, nenhum teste quebra. As duas corridas de `:219-261` passam só pelo encerrar.
   - **Por que é um furo real:** sem essa trava, o mesmo defeito volta na eliminação. Com o gerar parado depois do insert, o `revogarDeQuemSaiu` da eliminação não enxerga a linha ainda não confirmada. O `delete` do usuário espera o gerar, e depois o `set null` anula o `criado_por` de um acesso vigente. O resultado é um link aberto, sem autor e sem vínculo, que nenhum caminho revoga mais.
   - **Correção exigida:** um teste de corrida com `ciclo.eliminar` no lugar do encerrar, no formato de `:220`. O gerar fica parado no `GatilhoDeParada` de insert em `acesso_turma`, a eliminação roda em paralelo, `esperarNaTrava(... '%"turma"%for update%')`, depois o soltar, e no fim a asserção de zero acesso vigente na turma e o link e o código dando `NAO_ENCONTRADO`.
   - A outra ordem (eliminação parada depois da trava, gerar esperando e saindo `NAO_ENCONTRADO`) é recomendável. A reconferência é a mesma do encerrar e já está provada em `:240`.

**Recomendações:**
- `gt(expira_em, now())` em `acesso-da-turma.repository.ts:138` não tem teste. Um acesso vencido seria "revogado" de novo e ganharia uma auditoria a mais. Vale um caso com o relógio além do `expira_em`, conferindo que não sai `acesso_turma.revogado`.
- O filtro `turmaId` do encerrar (`acesso-da-turma.repository.ts:134`) não falharia se fosse removido. O `not exists` já segura a outra turma em `:123`. Vale uma linha na seção "Mutações" dizendo que ele é redundante, ou um caso que o diferencie.
- A eliminação pelo comando do operador, sem `usuarioId` nem ano no contexto, não tem caso nesta suíte. A autoria do operador em `acesso_turma.revogado` e o escopo sem ano ficam sem prova.
- No E27 (`decisao.int.test.ts:540`), a asserção só confere o 404. Pode reaproveitar a comparação byte a byte com o inexistente, como faz `naoAbreASala`, para o pedido pelo link revogado.
- A primeira corrida (`:220`) falha pelo estouro de prazo do `esperarNaTrava`, não por uma asserção sobre o resultado. É aceitável, mas a mensagem de falha fica pouco clara para quem a ler depois.

**Arquivos:**
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md

## test-engineer · 2ª rodada · APROVADO · 2026-10-03 19:10:47 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

VEREDITO: APROVADO

O bloqueante da primeira rodada foi resolvido, e as recomendações também.

**Cenários exigidos:** os mesmos da primeira rodada. Eram eles:
- encerrar o último vínculo, por `desligamento` e por `realocacao`;
- eliminação pela coordenação e pelo operador;
- outro vínculo do mesmo professor na mesma turma;
- quem sai não é quem gerou o acesso, ou quem gerou já foi substituído;
- o acesso da outra turma, onde ele continua, fica;
- link e código revogados respondem igual ao inexistente;
- o acesso já vencido não é revogado de novo;
- permissão: a coordenação de B não encerra o vínculo de A;
- isolamento no repository;
- as duas ordens da corrida com o gerar, no encerrar e na eliminação;
- o E27 revisto.

**Cobertos:**
- **O bloqueante** (a trava da eliminação, `ciclo-de-vida.service.ts:76`). As duas corridas da eliminação agora existem (`apps/api/test/acesso-fim-do-vinculo.int.test.ts:295-314` e `:316-335`). Nas duas, o gerar e a eliminação correm de fato em paralelo, com o gatilho de parada e a espera pela trava (`esperarNaTrava`).
  - **Gerar parado depois de gravar:** a eliminação precisa esperar em `for update` na turma. Se a chamada `travarContraOGerarDoProfessor` for apagada, a espera estoura o prazo e o teste quebra. Ele também confere que nenhum acesso fica vigente e que o link e o código recém-gerados respondem como inexistentes.
  - **Eliminação parada no `delete` do vínculo:** o gerar precisa esperar em `for share` na turma. Se a trava sair, a espera estoura o prazo e o teste quebra.
  - O executor diz ter conferido as duas vermelhas sem a chamada e verdes com ela.
- **Pool próprio da eliminação** (`:41`): está justificado. O pool da bancada tem só duas conexões, e numa corrida uma delas fica presa no gatilho. O pool é encerrado no `afterAll` (`:54`).
- **Eliminação pelo operador** (`:223-236`): roda sem usuário nem ano no contexto. A auditoria tem `autor_operador` preenchido e `autor_usuario_id` nulo, e o link e o código não abrem mais a sala. Isso prova também que a revogação funciona sem ano no contexto.
- **Acesso vencido** (`:238-247`): o acesso continua com `revogado_em` nulo e sem auditoria. Se o filtro `gt(expira_em, now())` for apagado, o teste quebra.
- **E27** (`apps/api/test/decisao.int.test.ts:540-543`): o 404 do link revogado agora é comparado byte a byte com o de um token inexistente.
- **Filtro `turmaId` do encerrar**: aceito como estreitamento, sem teste próprio. Ele não muda o resultado, porque o `not exists` já protege a outra turma; serve para a busca não varrer todos os acessos da escola. A justificativa ficou registrada.

**Bloqueantes:** nenhum.

**Recomendações:**
- `:332`: a corrida em que a eliminação para no `delete` do vínculo só confere `status 404`. Sem a reconferência do vínculo no gerar, o 404 poderia vir de outro lugar. Quando a eliminação termina, o usuário já foi apagado, e o insert do acesso esbarraria na FK do `criado_por`. Vale conferir também `corpo.erro.codigo === NAO_ENCONTRADO`, como faz `:284`. De todo modo, a reconferência já está provada pela corrida do encerrar (`:270`).
- Registrar a justificativa do filtro `turmaId` na seção "Mutações" do documento da correção, e não só na mensagem desta rodada, para que o `/validar` e o `/retro` a encontrem.

**Arquivos:**
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-03 19:13:26 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

**VEREDITO: APROVADO**

**Campos pessoais tocados:** nenhum campo novo e nenhuma migration. A correção usa o `acesso_turma.criado_por`, que já existia, para revogar o acesso de quem saiu da turma. Os novos registros `acesso_turma.revogado` guardam só o id do acesso como entidade, `depois: { turmaId }` e o autor (a coordenação, a sessão ou o operador). Não levam nome, matrícula, token nem código.

**Fora da tabela de dados do docs/lgpd.md:** nada. A linha "Acesso da turma" em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md` (l. 74) ganhou a nova regra de retenção: a revogação quando termina o último vínculo confirmado de quem gerou, pelo encerramento ou pela eliminação, na mesma transação e com auditoria. Também diz que o acesso gerado por outro professor fica. O texto confere com o código. O `docs/modelo-de-dados.md` também foi atualizado, com o ciclo de vida e as travas do acesso.

**Autorização por objeto:** ok.
- `encerrar` continua com o escopo de escola em `VinculoRepository.travar`. O teste confirma que a coordenação de B leva 404 ao encerrar um vínculo de A.
- `revogarDeQuemSaiu` filtra pela escola do contexto, não por parâmetro. O `not exists` está ligado à escola, ao ano e à turma do próprio acesso.
- O teste de isolamento no repository forja o contexto de A e mostra que o acesso de B não cai. O controle positivo no contexto de B mostra que cai. Ou seja, o teste quebra se a cláusula de escola for tirada.
- O link revogado responde igual ao inexistente, com `semRequisicao(...)` comparado a um token e a um código sorteados (`acesso-fim-do-vinculo.int.test.ts:107-111`; `decisao.int.test.ts`, E27). Isso cumpre a regra 20, item 6.

**Logs:** limpos. O encerramento só emite `'vinculo.encerrado'`, sem complemento, e a eliminação não ganhou log novo.

**Auditoria:** presente. Sai um `acesso_turma.revogado` por acesso revogado, na mesma transação, nos dois caminhos.
- No encerramento, o autor é a coordenação. Isso é provado em `acesso-fim-do-vinculo.int.test.ts:126`.
- Na eliminação, o autor vem da `...autoria`: a sessão (`:220`) ou o operador sem contexto de ano (`:223`).
- O acesso vencido não ganha registro duplicado (`:238`).

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os nomes do teste são gerados, conforme o cabeçalho do arquivo.

**Bloqueantes:** nenhum.

**Os três itens da regra 20 que você pediu:**
- **Item 9 (log):** cumprido, como acima.
- **Item 10 (auditoria):** cumprido. O pacote "alteração de permissão" se completa: o fim do vínculo agora tira também o caminho público que ele abria.
- **Item 18 (fim de vínculo):** fechado para os dois caminhos que terminam vínculo, o encerramento e a eliminação. A corrida com o gerar está coberta nas duas ordens. O gerar agora reconfere o vínculo num comando próprio depois da trava `FOR SHARE`, e quem encerra trava a turma em `FOR UPDATE`. As travas da eliminação são tomadas em ordem de id.

**Sobre o "Fora do escopo" (desativação): concordo.**
- Desativar não termina vínculo, então revogar ali sem decidir antes se a desativação encerra os vínculos criaria uma regra pela metade.
- O dado hoje é sintético, pelos afrouxamentos da D71. A coordenação também já tem um remédio direto: encerrar os vínculos do professor desativado, o que agora revoga o acesso.
- O item no `TODO.md` tem destino explícito antes do portão da primeira escola real. Com escola real, o furo voltaria a ser bloqueante pelo item 18. Por isso ele precisa entrar como critério do portão da primeira escola real, e não só como pendência solta do F2.

**Recomendações:**
1. Escrever no texto da linha da `docs/lgpd.md` (ou no `TODO.md`) que a desativação ainda **não** revoga o acesso. Hoje a tabela não diz isso, e quem ler a linha pode supor que todo fim de acesso do professor derruba o link.
2. O registro `acesso_turma.revogado` não diz o motivo (encerramento, eliminação, revogação manual ou operação). Ele dá para deduzir cruzando com o `vinculo.encerrado` ou o `usuario.eliminado` da mesma transação. Mas um `depois: { turmaId, motivo: 'fim_do_vinculo' }` responderia direto à pergunta de fechamento ("o que aconteceu com o link desta turma e por quê").
3. Ao fechar a desativação no F2, reutilizar o `revogarDeQuemSaiu` com a mesma trava da turma, como o próprio item do `TODO.md` já propõe.

**Pergunta de fechamento:** quanto a este dado, sim. A auditoria mostra cada acesso revogado, a turma e o autor, na mesma transação que encerrou o vínculo ou eliminou o professor. Nada foi enviado para fora.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md`

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-03 19:13:28 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration. Os campos usados já existem: `acesso_turma` tem `escola_id`, `ano_letivo_id`, `turma_id`, `criado_por`, `revogado_em` e `expira_em`, e `vinculo` e `turma` têm `escola_id` e `ano_letivo_id`. Os ids são UUID.

Queries verificadas:
- **`AcessoDaTurmaRepository.revogarDeQuemSaiu`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts`): o filtro da escola vem de `exigirEscolaDoContexto()`. O `not exists` está preso à escola, ao ano e à turma do próprio acesso. O `usuarioId` e o `turmaId` não vêm do cliente. No encerrar, eles saem do vínculo travado sob `#escopo()`, que filtra escola e ano em curso pelo contexto. Na eliminação, saem do id que `travarUsuario` já conferiu na escola do contexto.
- **Escopo sem o ano**: a decisão se sustenta. Escola continua sendo a fronteira de tenant. Sem o ano, o update só fica mais largo entre os anos da mesma escola, e o `not exists` amarrado ao ano do acesso e o filtro `gt(expira_em, now())` limitam esse alcance. O caminho do operador roda sem ano no contexto, e exigir o ano ali quebraria a eliminação.
- **`TurmaRepository.travarContraOGerarDoProfessor`**: o escopo é só a escola do contexto, e o `exists` em `vinculo` está ligado à escola e ao ano da própria turma. É só uma trava, não devolve nem altera dado.
- **`travarContraOGerar`** (antes `travarParaExcluir`): continua filtrando escola e ano em curso pelo contexto.
- **Reconferência em `travarComVinculoDoProfessor`**: usa o mesmo predicado escopado.
- **`VinculoRepository.travar`**: o escopo não mudou. Só passa a devolver `usuarioId` e `turmaId`, e nada disso sai em DTO.
- **Endpoints**: nenhum endpoint novo, e nenhum recebe `escolaId` do corpo ou da query. O encerrar de vínculo de outra escola responde 404, igual a id inexistente. O link revogado responde idêntico ao token inexistente (`semRequisicao`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/decisao.int.test.ts:328-331`).
- **`@SemEscopo()`**: nenhum uso novo.
- **Camada de rede**: não é tocada.

Teste de isolamento: presente e efetivo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts:187-209`: o contexto da escola A é forjado e recebe o `usuarioId` e o `turmaId` de B, com o vínculo de B encerrado direto no banco. Se a cláusula `eq(acessoTurma.escolaId, escolaId)` for tirada, o update revoga o acesso de B e o teste falha nas linhas 201-203. O controle positivo no contexto de B (linhas 205-208) garante que o vazio não vem de o pedido não casar com nada.
- Linhas 172-185: cobre o caminho HTTP. A coordenação de B recebe 404 no vínculo de A, e o encerramento em B não toca o acesso de A.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts:56-82` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts:286-289`: falta um caso de professor com vínculo confirmado em duas escolas (regra 60, item 8a). A eliminação em A deveria manter vigente o acesso que ele gerou em B e não travar turma de B. Hoje só a cláusula de escola garante isso nos dois métodos, sem teste que a prove no caminho da eliminação. Não bloqueia: o teste do repository já prova a cláusula do update, e a trava não expõe nem altera dado.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts:215-217`: o comentário que justifica o escopo sem ano poderia dizer de forma explícita que o limite de tenant continua sendo a escola do contexto. Isso evita que um revisor futuro leia a falta do ano como furo na regra 10, item 2.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-03 19:14:31 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência em `tasks/prd-apresentacao-escola/techspec.md`, seção 3 (linhas 33-34) e seção 8, "Travas das escritas em turma" (linhas 237-244)
Portão local: `portão local: apps/api/test/acesso-fim-do-vinculo.int.test.ts mudou em 2026-10-03 19:12:44, depois do início do último (2026-10-03 18:47:41). Rode node tools/processo/portao-local.ts de novo.`

Bloqueantes:

1. **Portão local sem carimbo válido.** O carimbo é anterior à última mudança no teste novo, que veio da 2ª rodada do `test-engineer`. Também não vale a frase do documento da correção (linha 101) que diz "verde, 9 de 9": ela não se refere à árvore atual.
   - Correção: rodar `node tools/processo/portao-local.ts` de novo sobre a árvore final.

2. **`apps/api/src/estrutura/vinculo.service.ts:125` e `:131`: travas em ordem cruzada, com deadlock.**
   - O encerrar trava o vínculo em `FOR UPDATE` (linha 125) e só depois a turma em `FOR UPDATE` (linha 131).
   - O excluir da turma (`turma.service.ts:89-90`) faz o contrário: trava a turma e depois apaga. A FK `vinculo_turma_do_ano_da_escola_fk` é `no action` (`0010_vinculo.sql:32`), então a checagem da FK no `delete` pede `FOR KEY SHARE` nas linhas de `vinculo`. Essa trava conflita com o `FOR UPDATE` que o encerrar já segura.
   - A eliminação (`ciclo-de-vida.service.ts:76-77`) também trava a turma antes e depois apaga o vínculo.
   - Um encerrar ao mesmo tempo que um excluir da mesma turma, ou que a eliminação do mesmo professor, fecha o ciclo. O Postgres aborta uma das duas com 40P01, e ela vira erro 500 em vez de `CONFLITO` ou de sucesso.
   - Antes da correção o encerrar não travava a turma, e esse ciclo não existia. A Tech Spec diz "nenhuma ordem cruzada" (linha 241), e isso deixou de ser verdade.
   - Correção exigida: o encerrar pega a turma antes do vínculo. Um caminho é ler o `turmaId` do vínculo sem trava (no escopo do contexto), travar a turma com `travarContraOGerar` e só então rodar `vinculos.travar(id)`, conferindo de novo o estado.
   - Teste exigido: uma corrida que prove que o encerrar e o excluir da mesma turma, e o encerrar e a eliminação do mesmo professor, terminam sem 40P01.

3. **`tasks/prd-apresentacao-escola/techspec.md:33-34` e `:237-244` não foram atualizadas.** A correção muda três coisas que a Tech Spec descreve, mas só registrou a mudança no documento da correção, no `cenarios.md` (E27) e no `docs/modelo-de-dados.md`:
   - o fim do último vínculo confirmado de quem gerou o acesso agora revoga esse acesso;
   - o encerrar e a eliminação passaram a travar a turma em `FOR UPDATE`;
   - o gerar passou a reconferir o vínculo num comando próprio.

   A Tech Spec continua dizendo que só o `delete` da turma e o gerar travam a turma, e não traz a nova corrida entre C1 e C11. Pelas regras desta revisão, divergência que não está na Tech Spec é bloqueante.
   - Correção: atualizar a seção 3, a seção 8 (travas, a ordem delas e a corrida nova) e a seção 7, onde está a auditoria `acesso_turma.revogado`, citando a correção.

Recomendações:
- `vinculo.service.ts:131`: o retorno de `travarContraOGerar` é descartado, e a justificativa fica só no comentário sobre a FK. Se a turma não for achada (por exemplo, por ano fora do contexto), seria melhor sair `NAO_ENCONTRADO` explicitamente do que seguir sem a trava.
- `prd.md:85` ainda diz "pedido que chegue por link antigo é decidido pela coordenação". Agora o link de quem saiu deixa de aceitar pedido. Vale ajustar a frase para "pedido que chegou antes do encerramento", para o PRD não contradizer o E27 revisto.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0010_vinculo.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/prd.md`

## infra-guardian · 1ª rodada · REPROVADO · 2026-10-03 19:15:07 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

VEREDITO: REPROVADO
Caminho quente tocado: sala (o gerar do acesso da turma), mais o encerrar e a eliminação, que são da coordenação
Rate limit: ok (a correção não mexe nele)
Fila e prioridade: ok (nada vai para a fila; a revogação é limitada às turmas da escola e roda dentro do request)
Concorrência: corrida em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts:125-131` e em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts:126`
Índice e paginação: ok. O encerrar filtra `escola_id`, `turma_id` e `revogado_em is null`, e isso bate no `acesso_turma_um_por_turma`. A eliminação usa o prefixo `escola_id` do mesmo índice parcial; são no máximo um acesso vigente por turma, e o `acesso_turma` não cresce com aluno. O `exists` usa `vinculo_ativo_unico` e `vinculo_turma_idx`.
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhuma métrica ou alerta novo é exigido no gerar; a latência dele continua medida pelo request)

Bloqueantes:

1. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts:125-131`: a ordem das travas no encerrar inverte a do excluir e a da eliminação, e isso cria deadlock.**
   - **O que está errado.** O encerrar trava o vínculo em `FOR UPDATE` (`vinculos.travar`) e só depois a turma em `FOR UPDATE` (`travarContraOGerar`). Os outros dois caminhos fazem o contrário:
     - O excluir (`turma.service.ts:89`) trava a turma primeiro. Depois, no `delete from turma`, a checagem da FK `vinculo_turma_do_ano_da_escola_fk` (NO ACTION) faz `FOR KEY SHARE` nas linhas de `vinculo` da turma, e esse modo conflita com o `FOR UPDATE` que o encerrar já tem.
     - A eliminação (`ciclo-de-vida.service.ts:76-77`) trava as turmas e depois apaga os vínculos, o que precisa da trava da linha do vínculo.
   - **Consequência.** Se o excluir ou a eliminação pegam a turma entre os dois comandos do encerrar, há ciclo. O Postgres detecta, aborta uma das transações com `40P01`, e o `mapearErroPostgres` devolve `ERRO_INTERNO` (500) à coordenação. Antes desta correção o encerrar não travava a turma, então esse deadlock é novo. Nenhum dos quatro testes de corrida cobre encerrar × eliminar nem encerrar × excluir.
   - **Correção exigida.** No encerrar, travar a turma antes do vínculo:
     1. ler o `turmaId` do vínculo sem trava, dentro do escopo (o `turmaId` de um vínculo não muda);
     2. chamar `travarContraOGerar(turmaId)`;
     3. só então `vinculos.travar(id)`.
   - Assim a ordem fica a mesma nos três caminhos: turma, depois vínculo. Junto, um teste de integração com `GatilhoDeParada` que para a eliminação logo depois de travar a turma, dispara o encerrar do mesmo professor, e prova que os dois terminam sem 500 (o mesmo para encerrar × excluir).

2. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts:126`: a eliminação escolhe quais turmas travar por `estado = 'confirmado'`, no retrato tirado antes de travar.**
   - **O que está errado.** É o padrão "busca, verifica, grava" que esta correção quer fechar:
     1. o vínculo ainda está `pendente`, então a turma dele não é travada;
     2. o professor confirma (`#decidir`) e o commit sai antes do `delete` da eliminação;
     3. o gerar passa pela `FOR SHARE`, reconfere, vê o vínculo `confirmado` e grava o acesso;
     4. se esse commit sai depois do snapshot do `revogarDeQuemSaiu`, o acesso não é revogado;
     5. o `delete` do usuário espera o `KEY SHARE` do gerar e depois anula o `criado_por`.
   - O resultado é o furo original: acesso vigente, sem dono, de quem foi eliminado.
   - **Correção exigida.** Travar toda turma em que o usuário tem vínculo de professor em qualquer estado, tirando o filtro de `estado` do `exists` em `travarContraOGerarDoProfessor`. O vínculo apagado não volta, e o gerar que esperou reconfere e sai `NAO_ENCONTRADO`. Junto, um teste com o vínculo `pendente` confirmado durante a eliminação.

Recomendações:
- No encerrar e na eliminação, `FOR NO KEY UPDATE` basta para barrar o gerar (que é `FOR SHARE`). Diferente do `FOR UPDATE`, ele não segura o `FOR KEY SHARE` dos `insert` com FK para a turma: pedido de reivindicação do aluno, lista de nomes (`travarContraExclusao`). Só o excluir precisa de `FOR UPDATE`. A espera hoje é de milissegundos, mas cai justamente sobre a reivindicação.
- O `40P01` continua mapeado como `ERRO_INTERNO`. Vale decidir se ele vira `CONFLITO` ou uma nova tentativa única, como rede de segurança para ordens de trava que escapem.
- O comentário em `turma.repository.ts:103-107` diz que a ordem de id "evita que duas eliminações se prendam". Ele deveria registrar também a ordem global turma → vínculo que o item 1 fixa, para quem escrever o próximo caminho que trava os dois.

## test-engineer · 3ª rodada · APROVADO · 2026-10-03 19:21:28 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

VEREDITO: APROVADO

Esta foi a 3ª rodada, e audito só o que mudou: a ordem das travas no encerrar, a trava da eliminação em `FOR NO KEY UPDATE` sobre vínculo de professor em qualquer estado, e os dois testes novos.

**Cenários exigidos:**
- Os da 1ª e da 2ª rodadas.
- Novo: ordem fixa turma → vínculo, sem deadlock entre o encerrar e quem já segura a turma (o excluir, a eliminação).
- Novo: a eliminação trava também a turma em que o professor só tem vínculo pendente, porque ele poderia confirmar no meio da eliminação.

**Cobertos:**
- **Ordem turma → vínculo** (`apps/api/test/acesso-fim-do-vinculo.int.test.ts:250-273`):
  - Um segurador trava a turma, o encerrar fica esperando na turma, e o segurador então pede `FOR KEY SHARE` no vínculo, com `lock_timeout`.
  - Com a ordem antiga (o vínculo `FOR UPDATE` primeiro), o pedido do segurador entraria em conflito com a trava que o encerrar já teria no vínculo. Daria `lock_timeout` ou 40P01, e o teste quebra.
  - Também quebra se o modo da trava da turma voltar a `for update`, porque o padrão de espera passou a ser `for no key update`.
  - O teste confere o resultado: o encerrar responde 200 e o link e o código deixam de abrir a sala.
- **Turma do vínculo pendente travada** (`:275-302`): a sonda com `for share nowait` recebe 55P03 só porque a turma do pendente está presa. Com o filtro antigo, só por `confirmado`, a sonda conseguiria a trava e o teste quebra. Ela não se confunde com a `outraTurma`, que tem vínculo confirmado.
- **Corridas:** as quatro passaram a esperar `for no key update` e continuam quebrando se a trava sair. A da eliminação parada agora confere `codigo: NAO_ENCONTRADO` (`:383`).
- **`turmaDe` sem trava seguido de `travarContraOGerar`:** o vínculo de outra escola sai 404 antes de travar qualquer coisa. Isso está coberto pelo isolamento em `:174`.
- **Excluir:** continua em `FOR UPDATE`, e o padrão `%from "turma"%for update%` de `lista.int.test.ts:626` segue valendo.
- **Seção "Mutações"** (`tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md:70-79`): ganhou uma linha para cada peça nova, e a ausência de teste do filtro `turmaId` ficou justificada.

**Bloqueantes:** nenhum.

**Recomendações:**
- `:275-302` termina em `await eliminando` sem asserção depois. Vale conferir também que a eliminação apagou o vínculo pendente e que não ficou acesso vigente na `outraTurma`. Isso amarraria a trava ao efeito, e não só à presença da trava.
- No encerrar, a turma agora é lida antes de o vínculo ser travado, e o `travarContraOGerar` exige o ano em curso. Encerrar um vínculo de ano já virado passa a sair `NAO_ENCONTRADO` pela trava da turma, e não pelo escopo do vínculo. O resultado é o mesmo, mas vale uma linha no documento da correção para o `/validar`.

**Arquivos:**
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md

## infra-guardian · 2ª rodada · APROVADO · 2026-10-03 19:31:09 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

VEREDITO: APROVADO
Caminho quente tocado: sala (o gerar do acesso da turma), mais o encerrar e a eliminação, que são da coordenação
Rate limit: ok (a correção não mexe nele)
Fila e prioridade: ok (nada vai para a fila; a revogação é limitada às turmas da escola)
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhuma métrica ou alerta novo é exigido)

Bloqueantes: nenhum. As duas correções que exigi na 1ª rodada foram feitas:

1. **Ordem das travas.** Agora é turma e depois vínculo nos três caminhos:
   - o encerrar (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts:128-131`) lê a turma do vínculo sem trava (`turmaDe`), trava a turma e só depois trava e relê o vínculo;
   - o excluir trava a turma em `FOR UPDATE`;
   - a eliminação trava as turmas em ordem de id antes de apagar os vínculos.

   Com isso, o ciclo com o `FOR KEY SHARE` da FK no `delete` da turma e com o `delete` dos vínculos deixa de existir. O teste "o encerrar espera a turma sem segurar o vínculo…" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts:250`) reproduz o deadlock da ordem antiga: o vínculo é pedido com `lock_timeout` enquanto o encerrar espera a turma.
2. **Eliminação trava o vínculo em qualquer estado.** `travarContraOGerarDoProfessor` não filtra mais por `estado`. O teste da linha 274 prova que a turma do vínculo pendente fica presa: o `for share nowait` recebe `55P03` enquanto a eliminação está parada no `delete` dos vínculos.

O `FOR NO KEY UPDATE` no encerrar e na eliminação continua barrando o `FOR SHARE` do gerar, e não segura mais o `FOR KEY SHARE` dos `insert` com FK para a turma (pedido de reivindicação, lista). O excluir segue em `FOR UPDATE`, que ele precisa por causa do `delete`. Esses três caminhos se serializam na turma sem inverter a ordem.

Recomendações (não bloqueiam):
- O `40P01` continua saindo como `ERRO_INTERNO` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/erro/mapear-erro-postgres.ts`. Fica registrado para uma correção geral fora desta: mapear para `CONFLITO` ou tentar de novo uma vez.
- Sobra uma janela teórica na eliminação. É preciso que, enquanto ela roda, a coordenação crie um vínculo novo do mesmo professor numa turma que ainda não foi travada, e que ele confirme e gere o acesso antes do `delete` dos vínculos. É improvável, porque pede três ações seguidas de duas pessoas dentro da mesma transação. Vale registrar no `TODO.md`, junto da desativação que ficou fora do escopo, para ser tratada quando a trava passar a ser feita no usuário.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-03 19:31:10 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

**VEREDITO: APROVADO** (2ª rodada, só o que mudou desde a minha aprovação)

**Campos pessoais tocados:** nenhum campo novo. `VinculoRepository.turmaDe` lê só o `turma_id`, dentro do `#escopo()` do vínculo (`vinculo.repository.ts:176`).

**Fora da tabela de dados do docs/lgpd.md:** nada. A recomendação 1 entrou: a linha "Acesso da turma" agora diz que a desativação do professor ainda **não** revoga o acesso e aponta o `TODO.md` (F2).

**Autorização por objeto:** ok.
- No `encerrar`, o vínculo de outra escola, o de outro ano e o inexistente caem todos em `turmaDe → undefined`, ou na turma fora do ano em curso, e as duas saídas dão `NAO_ENCONTRADO`. Sem permissão e não encontrado continuam respondendo igual.
- Depois da espera na trava da turma, o vínculo é relido com `FOR UPDATE` no escopo. Assim o estado lido antes não decide nada.
- `travarContraOGerarDoProfessor` continua filtrando pela escola do contexto. Passar a travar o vínculo em qualquer estado só amplia o que é travado; não amplia o que é revogado. A revogação continua presa ao `criado_por`, ao `not exists` do vínculo confirmado e à escola.

**Logs:** limpos. Nada novo; o encerramento continua emitindo só `'vinculo.encerrado'`.

**Auditoria:** presente, sem mudança. Cada acesso revogado gera um `acesso_turma.revogado` na mesma transação, com `depois: { turmaId }` e o autor certo nos dois caminhos.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os testes novos, entre eles a corrida da eliminação com o vínculo pendente confirmado no meio (`acesso-fim-do-vinculo.int.test.ts:274`), usam o mesmo gerador de nomes.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Aceito deixar a recomendação 2 (motivo na auditoria) de fora, com a justificativa que está no documento: a causa se lê pelo `vinculo.encerrado` ou pelo `usuario.eliminado` da mesma transação. Ela fica registrada para o `/retro`. Se o dossiê de conformidade (D61) precisar responder isso numa consulta só, vale retomar.
2. Mantenho a recomendação anterior: a desativação deve entrar como critério do portão da primeira escola real. A correção agora deixa isso explícito no `docs/lgpd.md` e no `TODO.md`.

**Pergunta de fechamento:** quanto ao acesso da turma, o código responde. O que foi revogado, de qual turma, por quem e na transação de qual encerramento ou eliminação fica todo na auditoria.

Arquivos auditados nesta rodada:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

## tenancy-guardian · 2ª rodada · APROVADO · 2026-10-03 19:31:11 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration nesta rodada. As tabelas tocadas continuam sendo `acesso_turma`, `vinculo` e `turma`, todas com `escola_id` e `ano_letivo_id`, e os ids são UUID.

Queries verificadas (o diff desde a rodada aprovada):
- **`VinculoRepository.turmaDe(id)`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`): usa `#escopo()`, que filtra escola e ano em curso pelo contexto e o papel. Se o vínculo for de outra escola, devolve `undefined`, e o encerrar responde `NAO_ENCONTRADO`, a mesma resposta do id inexistente. O teste em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts:178` cobre esse caminho, porque o vínculo de A passa a ser recusado já nesta leitura.
- **`TurmaRepository.travarContraOGerar(id, modo)`**: o escopo continua escola e ano em curso pelo contexto. O `turmaId` que ele recebe vem de `turmaDe`, já escopado, e não do cliente. O `modo` é um literal escolhido no service.
- **`travarContraOGerarDoProfessor` sem o filtro de estado**: o escopo continua sendo a escola do contexto, e o `exists` continua amarrado à escola, ao ano e à turma da própria linha. Tirar o estado só amplia a trava dentro da mesma escola: a consulta não lê nem altera dado.
- **Encerrar na ordem turma → vínculo**: o `usuarioId` e o `turmaId` passados a `revogarDeQuemSaiu` continuam vindo do vínculo travado sob `#escopo()`.
- **`revogarDeQuemSaiu`**: não mudou, exceto o comentário, que agora diz que o limite de tenant continua sendo a escola. Isso atende a recomendação da rodada anterior.
- **Endpoints**: nenhum endpoint novo, nenhum `escolaId` vindo de corpo ou query, e nenhum `@SemEscopo()`.

Teste de isolamento: presente e efetivo. O teste do repository com contexto forjado e controle positivo em B (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts:187-209`) e o teste pelo HTTP (linhas 172-185) continuam no arquivo, com a mesma lógica. Sem a cláusula de escola no update, o teste das linhas 201-203 fica vermelho.

Bloqueantes: nenhum.

Recomendações:
- Fica pendente a da rodada anterior: falta um caso de professor com vínculo em duas escolas, em que a eliminação em A não revoga o acesso que ele gerou em B nem trava turma de B (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts`, nas chamadas a `travarContraOGerarDoProfessor` e `revogarDeQuemSaiu`). Não bloqueia.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-03 19:31:15 · `tasks/correcoes/2026-10-03-acesso-sobrevive-ao-vinculo.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, test)")
Bloqueantes: nenhum

As três correções exigidas na 1ª rodada estão feitas:

1. **Portão local:** o `conferir` passa sobre a árvore atual.
2. **Ordem das travas:** agora é sempre a turma e depois o vínculo.
   - O encerrar lê a turma sem trava (`vinculo.repository.ts`, `turmaDe`), trava a turma em `FOR NO KEY UPDATE` e só então trava o vínculo (`vinculo.service.ts:128-130`). Se a turma não for achada, sai `NAO_ENCONTRADO`.
   - A eliminação trava em ordem de id as turmas onde o professor tem vínculo em qualquer estado, e depois apaga os vínculos.
   - O excluir continua travando a turma antes de a FK pedir `FOR KEY SHARE` no vínculo.
   - Não sobrou nenhum caminho que trave o vínculo antes da turma. O `#decidir` trava só o vínculo, e a criação de vínculo pede só `KEY SHARE` na turma, que não conflita com `NO KEY UPDATE`.
   - O `NO KEY UPDATE` conflita com o `FOR SHARE` do gerar, então o gerar continua barrado.
   - O teste de ordem existe (`acesso-fim-do-vinculo.int.test.ts:250`, com um segurador pedindo `FOR KEY SHARE` no vínculo), e o teste da linha 274 cobre o vínculo pendente.
3. **Tech Spec e PRD:** a seção 3 ganhou as travas e a regra do fim do vínculo de quem gerou, a seção 7 ganhou a auditoria `acesso_turma.revogado` e a seção 8 ganhou "Turma e vínculo". A linha "Turma sem professor alocado" do PRD agora bate com o E27 revisto.

Recomendações:
- `apps/api/src/sessao/ciclo-de-vida.service.ts:73`: o comentário novo passa da largura das linhas vizinhas e quebra em lugar estranho. Vale realinhar.
- `apps/api/src/sala/acesso-da-turma.repository.ts`, na doc de `revogarDeQuemSaiu`: a última frase quebra a linha no meio ("…e da turma" / "do próprio acesso."). Vale juntar.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/vinculo.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-fim-do-vinculo.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/techspec.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/prd.md`
