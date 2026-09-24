# Achados das revisões — `tasks/prd-apresentacao-painel/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-24 19:49:54 · `tasks/prd-apresentacao-painel/3_task.md`

VEREDITO: APROVADO

A tarefa 3.0 não tem bloqueante. Cada correção de código que o implementador disse ter testado deixa pelo menos um teste vermelho, e conferi isso lendo os testes. Não rodei a suíte: o carimbo em `.processo/portao.json` lista typecheck, lint, test e infra.

**Cenários exigidos:** E6 (refazer em cada estado; o vencido refeito não abre mais; refazer de convite que não é o último dá CONFLITO), E8 (dois refazer; refazer e revogar nas duas ordens), E9 (sem a trava da escola), E11 (autor desativado, nas duas ordens), E12, I6 (400, 404, 201, 409 e 503), I7, A1, A2, A3, permissão/I3, isolamento do repository. Casos de borda do domínio: clique duplo, convite vencido, dado de antes da trava, aceite no meio do refazer, tempo esgotado na trava.

**Cobertos** (todos em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts`, salvo onde digo outro arquivo):
- **E6 e A1:** `it.each(ESTADOS_DA_COORDENACAO)` passa pelos sete estados e confere `no-store` também na recusa. No estado não permitido, nada muda, nem o estado. No permitido:
  - o convite de origem sai revogado;
  - só o novo fica em aberto, e é do mesmo usuário;
  - usuário e conta não mudam;
  - o link antigo dá 404 e o novo abre;
  - a única auditoria nova é `convite.refeito`, com `origemId`, `usuarioId` e o mesmo `expiraEm` gravado (72 h), sem nome, e-mail nem token.
- **"Não é o último":** dois casos, o convite de origem de um refazer anterior e um convite em aberto de outro usuário. O segundo é o que prova a condição `conviteId !== ultimoConviteId`.
- **E8:** a ordem é forçada por `emOrdemNaTrava`, com as duas chamadas esperando de fato na trava. Os três casos terminam com no máximo um convite em aberto, o perdedor recebe o erro da matriz e a auditoria sai uma vez só.
- **E9:** o `Proxy` só do teste desliga a trava. Se ele não desligasse, a espera por dois processos parados em `update "convite"` estouraria o prazo e o teste falharia. O teste do aceite no meio do refazer prova o `isNull(usadoEm)`.
- **E11:** 401 sem gravar e sem convite novo; na outra ordem, o refazer entra com a auditoria.
- **I6:** as cinco respostas, incluindo o 503 com `Retry-After` e nada gravado.
- **I7:** o segundo caso (escola `ativa` com o último convite ainda em aberto) é o único que segura a linha `ativa` da matriz.
- **A2 e A3:** nem o token novo nem o de origem aparecem em coluna ou auditoria, `token_hash` é o SHA-256 do token, e o log dos casos de sucesso e de recusa leva só ids.
- **Isolamento do repository** (em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts`): o convite da escola A, chamado no contexto da escola B, não é revogado; convite já revogado não é revogado de novo; o usado não é revogado; o vencido é.
- **Permissão/I3:** a varredura C46 alcança toda rota `@RotaDeOperacao`, e a rota nova entrou nas listas de C36/C41, C46 e `convite.int.test.ts`.
- Nenhum `.skip`, `.only`, `any` nem mock de código nosso. A tarefa não tem IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **E15(d) na 4.0:** o teste da E9 cobre só "aceite primeiro, depois refazer". A outra ordem (o refazer revoga, o aceite espera a linha e deve responder como convite inválido, nunca 500 nem 40P01) ficou sem teste. É escopo da 4.0, que precisa cobrir as duas ordens.
2. **E9 não separa as duas camadas:** sem `isNull(convite.revogadoEm)`, o índice `convite_pendente_unico` também daria CONFLITO, e o teste continuaria verde. Quem prova essa condição é só o teste do repository. Está registrado nas divergências da tarefa; vale deixar um comentário no teste da E9.
3. **Linhas da matriz sem prova própria:** `revogado`, `aceito` e `sem_coordenacao` em `REFAZER` (`convite.service.ts`) dão o mesmo CONFLITO pelo `update` condicional, então não têm teste que falhe só por elas. Aceitável como defesa em profundidade.
4. **Asserção fraca no vencido:** "o link de origem não abre" já era verdade antes do refazer, porque o convite tinha vencido. O que prova a regra nesse estado é `revogado: true`, e essa asserção já está no teste.
5. **Espera frouxa no aceite da E9:** a espera aceita qualquer sessão do banco parada em `pg_advisory_xact_lock`. Hoje ninguém segura essa trava nesse ponto, mas restringir a busca à consulta do refazer (`set "revogado_em"`) deixa o teste mais preciso.
6. **Dois operadores no mesmo convite (W2):** o E8 usa a mesma sessão nas duas chamadas. O caminho no servidor é o mesmo, e o W2 da 7.0 cobre o caso pela tela.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-24 19:50:41 · `tasks/prd-apresentacao-painel/3_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** nenhum campo novo. O refazer cria uma nova linha em `convite` com `token_hash` (o SHA-256 do token) e `expira_em`, para o mesmo `usuario_id`. A auditoria `convite.refeito` grava só `origemId`, `usuarioId` e `expiraEm`, e o esquema estrito em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts` rejeita qualquer outro campo. Nome e e-mail não mudam no refazer.

**Fora da tabela de dados do docs/lgpd.md:** nada. A linha 72 ("Convite de coordenador (hash do token, datas)") já cobre o convite gerado pelo painel, com finalidade, base legal e retenção (30 dias, pelo `sistema.expurgar-acesso`).

**Autorização por objeto:** ok.
- A escola vem do convite (`escolaDoConviteParaOperador`, filtrado por `tipo = 'coordenador'`). O cliente não manda a escola.
- `revogarParaRefazer` filtra por `escolaDoContexto()`. O teste do repository prova que no contexto da escola B o convite da escola A não é achado nem revogado.
- Se alguém trocar o id na URL por um convite de outro tipo ou inexistente, recebe `NAO_ENCONTRADO`. Um id fora do formato UUID também.
- Uma sessão de escola cai no 404 de rota inexistente, e a rota nova entrou nas varreduras C36, C41 e C46.
- `sem_convite` responde `NAO_ENCONTRADO`, igual ao revogar.

**Logs:** limpos. `operacao.convite.refeito` sai só com os ids do contexto (a escola e a requisição). Um teste confere que o log do refazer e das recusas não traz nome, e-mail, slug, token novo, token de origem nem o nome do operador.

**Auditoria:** presente. `convite.refeito` fica na mesma transação da escrita, com o apelido do operador conferido como primeira instrução. O caminho recusado (409) não grava nada, e o teste prova isso.

**Exposição:**
- A resposta é o DTO estrito `esquemaRespostaConviteDaCoordenacao` (`conviteId` e `token`), com `Cache-Control: no-store`. O token só aparece nessa resposta, e o teste A2/A3 confirma que o `token_hash` é o SHA-256 dele e que o token não está em nenhuma coluna nem na auditoria.
- O convite continua com expiração de 72 h, uso único e revogação. A origem fica revogada, e o `update` condicional (`usado_em is null and revogado_em is null`) garante que ela é revogada uma vez só, inclusive com dois refazer ao mesmo tempo ou com o aceite no meio.
- O teste I6 cobre as respostas 400, 404, 201, 409 e 503 com sentinelas de coordenação, aluno e turma. Nenhuma sentinela aparece no corpo, e os erros saem tipados.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. As sentinelas são geradas com `randomUUID` e usam o domínio `@escola.invalid`.

**Pergunta de fechamento:** responde para o que esta tarefa toca. O convite refeito fica ligado à origem por `origemId` na auditoria, e a retenção e a eliminação seguem pelo `sistema.expurgar-acesso` que já existe.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:72`, trocar "gerado pelo comando do operador ou pelo painel da operação" por "gerado ou refeito pelo painel da operação". Assim o dossiê deixa explícito que um mesmo coordenador pode ter uma cadeia de convites, e que cada um cai no expurgo de 30 dias após ser revogado.
2. Como o refazer grava só `convite.refeito` no convite novo, uma consulta de auditoria por `entidade_id` do convite de origem não mostra quando ele foi revogado. Vale citar essa ligação por `origemId` na consulta de "tudo sobre o titular" quando ela chegar, para que a resposta ao pedido de acesso junte a cadeia inteira.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-24 19:50:48 · `tasks/prd-apresentacao-painel/3_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration. A rota nova escreve em `convite` (tem `escola_id`, id UUID) e em `auditoria` (grava pela escola do contexto).

Queries verificadas:
- `ConviteRepository.revogarParaRefazer` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts:125`). O `where` usa `escolaDoContexto()`, e o argumento é só o `conviteId`.
- `ConviteRepository.criarConvite`, `travarEscola` e `dadosDaCoordenacao` já existiam, e todos tiram a escola do contexto.
- `ResolucaoDeTenantRepository.escolaDoConviteParaOperador` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:464`) já existia. Tem `@SemEscopo` com justificativa escrita, filtra `tipo = 'coordenador'`, e a escola devolvida vira o contexto em vez de passar como argumento.
- `refazerConviteDaCoordenacao` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:181`) abre o contexto da escola do convite e só então usa o repository. O `usuarioId` do convite novo vem da linha revogada da mesma escola.
- O controller (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/painel.controller.ts:63`) aceita só o `:id` do caminho no formato UUID. Um corpo com qualquer campo, `escolaId` incluído, dá 400 `ENTRADA_INVALIDA`, e o teste E12 cobre isso.
- Não há query agregada nova da camada de rede.

Teste de isolamento: presente e efetivo. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts:86`, `revogarParaRefazer` roda no contexto da escola B com o convite da escola A e deve devolver `undefined`, com a linha sem revogação. Se a cláusula `eq(convite.escolaId, escolaDoContexto())` sair, o convite de A é revogado e o teste falha nas duas asserções. A I6 do refazer (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts`, bloco "I6 (refazer)") confirma que nenhuma resposta 400, 404, 409 ou 503 traz nome, e-mail, matrícula ou turma da escola.

Bloqueantes: nenhum.

Recomendações:
- Em `convite.repository.ts:129`, pôr também `eq(convite.tipo, 'coordenador')` no `where` de `revogarParaRefazer`, como defesa em profundidade. Hoje só o chamador filtra o tipo, e o método é público no repository.
- O convite que existe mas não é o último responde 409, e o inexistente responde 404. Só o operador global alcança essa rota, então não há vazamento entre escolas. Registrar isso na Tech Spec ajuda a não reabrir a discussão quando uma rota parecida for exposta à coordenação.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-24 19:50:54 · `tasks/prd-apresentacao-painel/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. É uma rota do painel da operação, só para o operador. Ela toca a trava do convite da escola, e essa trava entra no aceite na 4.0.
Rate limit: ok. A rota é `@RotaDeOperacao`, então usa o limite `rl:op:{sub}`, por operador e não por IP.
Fila e prioridade: ok. Não há trabalho demorado no request: são uma trava, dois `update`/`insert` pela chave primária e uma auditoria.
Concorrência: protegida. A trava `pg_advisory_xact_lock(7_000_003, …)` vem antes da leitura do estado. Por baixo dela há o `update` condicional da origem (`usado_em is null and revogado_em is null`), com o `returning`. O índice `convite_pendente_unico` é a última rede de segurança. Os testes são estes, todos em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts`:
- E8 força a ordem das duas chamadas;
- E9 tira a trava por um Proxy que só existe no teste, sem nenhum gancho no código de produção;
- E9 também cobre o aceite no meio do refazer;
- E11 cobre o autor desativado no meio.
Índice e paginação: ok. O `update` usa `escola_id` e `id`, que é a chave primária. A leitura do estado é a mesma da 2.0. Não há listagem nova.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. A rota não está no caminho quente de escola e usa a métrica HTTP comum. A espera na trava tem teto no `statement_timeout` e responde 503 `TEMPO_ESGOTADO` com `Retry-After`, sem gravar nada. O teste I6 prova isso. Não há alerta novo.
Bloqueantes: nenhum.
Recomendações:
1. Na 4.0 o aceite passa a pegar a mesma trava, com o `statement_timeout` de 300 ms do pool da API. Falta um teste de que o aceite que perde a trava para um refazer ou gerar do operador responde 503 `TEMPO_ESGOTADO`, com `Retry-After`, e não gasta a tentativa de login. É a E15(d) nas duas ordens, que o test-engineer já registrou.
2. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/painel-convite.int.test.ts:814`, o aceite da E9 espera qualquer sessão parada em `pg_advisory_xact_lock`. Restringir a espera à consulta do refazer (`set "revogado_em"`) deixa a ordem mais precisa.
3. A E9 não separa o `update` condicional do índice: sem a condição `isNull(convite.revogadoEm)`, o 23505 do índice daria o mesmo `CONFLITO`. Quem prova a condição sozinho é o teste do repository (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts`). Vale um comentário no teste da E9 dizendo isso.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-24 19:51:12 · `tasks/prd-apresentacao-painel/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As divergências estão registradas e não foram decididas em silêncio: a E9 é segurada pelo `update` condicional e não pelo índice, o refazer responde 201 e `sem_convite` responde `NAO_ENCONTRADO`. Estão em "Divergências resolvidas nesta tarefa" no `3_task.md`, na seção 5 da `techspec.md` e na linha "Convite em aberto" da 7c.
Portão local: carimbo válido. O `conferir` devolve "portão local válido para o código atual (typecheck, lint, test, infra)".
Bloqueantes: nenhum

O que conferi e está certo:
- **Matriz do refazer.** `REFAZER` em `convite.service.ts:163` segue a seção 5. Um convite que não é o último da escola dá `CONFLITO`.
- **Revogação da origem.** `revogarParaRefazer` usa exatamente o `update … where escola_id and id and usado_em is null and revogado_em is null returning usuario_id` que a subtarefa 3.2 pede. O convite novo sai na mesma transação, depois do autor, da trava e da leitura do estado.
- **Controller.** Não tem regra: só valida o corpo e o formato do id, e responde com `no-store`. O DTO é o `esquemaRespostaConviteDaCoordenacao`, que é estrito, e o contrato vem de `packages/shared`.
- **Log e auditoria.** O log `operacao.convite.refeito` leva só ids. A auditoria `convite.refeito` usa o esquema estrito `{ origemId, usuarioId, expiraEm }`.
- **Escopo.** Não entra na 4.0: o aceite continua sem a trava, como o documento declara, e não há tela.
- **Testes.** Não há `.skip`, `.only`, `any` nem `TODO`. A mutação da E9, o `Proxy` que desliga a trava, existe só no teste, sem gancho no código de produção.

Recomendações:
1. `tasks/prd-apresentacao-painel/cenarios.md:69-70`: a E9 ainda diz "pelo índice (23505 vira `CONFLITO`)". A divergência foi para a Tech Spec, mas não para o cenário. Vale alinhar o texto ao que a tarefa decidiu, para quem abrir a spec depois não esperar o 23505.
2. `apps/api/src/sessao/convite.repository.ts:158`: pôr também `eq(convite.tipo, 'coordenador')` no `where` de `revogarParaRefazer`, como o `tenancy-guardian` já recomendou. Hoje só o chamador filtra o tipo, e o método é público.
3. `apps/api/test/painel-convite.int.test.ts`: o `describe` de fora ainda se chama "gerar e revogar (tarefa 2.0)", mas agora cobre o refazer da 3.0.
4. `apps/api/test/painel-convite.int.test.ts`, no teste da E9 com dois refazer: um comentário curto de que é o teste do repository que prova a condição `revogado_em is null`. Sem ela, o índice também daria `CONFLITO` e este teste continuaria verde.
5. `docs/lgpd.md:72`: citar o convite "refeito" junto do "gerado", como o `privacy-guardian` sugeriu.
