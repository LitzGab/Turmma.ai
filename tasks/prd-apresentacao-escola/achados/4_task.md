# Achados das revisões — `tasks/prd-apresentacao-escola/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-26 16:09:05 · `tasks/prd-apresentacao-escola/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** E13, E14, E15, E12 com P2, E2 (parte do acesso), A1, A5, I3 e I9 (acesso), C5, C6, C11 nos dois arranjos, o encerramento do ano contra o gerar (4.5), e as varreduras A3 e A4 das três rotas novas.

**Cobertos:**
- **E13** (`apps/api/test/acesso-da-turma.int.test.ts:142-231`)
  - `expira_em` certo para 1, 7 e 30 dias, igual na resposta e no GET.
  - 0, 2, 31, texto, corpo vazio e campo a mais recusados, sem gravar.
  - "Gerar novo" revoga o anterior no `now()` da mesma transação, e `substituidos` não repete o que já estava revogado.
  - Sem acesso vigente, o GET devolve `null` e o revogar responde `NAO_ENCONTRADO`, nos casos nunca gerado, revogado e vencido. O vencido não impede gerar outro.
  - O acesso de outra turma não é lido, não é revogado e não é substituído.
  - Gerar e ler respondem com `no-store`.
- **E14** (`:234`): o gerar do segundo professor derruba o do primeiro, com `criado_por` do segundo.
- **P2 com E12** (`:253`, `:296`)
  - Recebem o mesmo 404 de um id sorteado, e nada muda no banco: coordenação, aluno, professor sem vínculo, vínculo pendente, contestado ou encerrado, e professor de outra turma.
  - Professor com duas disciplinas na turma: os dois vínculos pendentes ou contestados dão 404; um confirmado basta para alcançar.
- **E2 do acesso** (`:325-357`)
  - Turma com acesso vigente: `CONFLITO`, e nada é apagado.
  - Acesso revogado ou vencido: a turma sai e o acesso sai junto pela cascata.
  - Turma com vínculo continua `CONFLITO`; turma inexistente dá `NAO_ENCONTRADO`; o acesso vigente de outra turma não barra a exclusão da turma vazia.
- **A1 e A5** (`:361`)
  - A auditoria é conferida inteira: autor, validade, `substituidos` e o revogado.
  - `token_hash` é o SHA-256 do token.
  - `codigo_hmac` é o HMAC com a chave da sala e é diferente do HMAC com a chave dos contadores.
  - Token e código não aparecem em claro em nenhuma coluna do acesso nem da auditoria.
  - O 400 e os 404 não gravam auditoria.
- **C5** (`:419`): dois gerar de verdade em paralelo, com a pausa por gatilho e a espera confirmada no `pg_stat_activity`, com e sem acesso antes. Um fica vigente, o outro recebe `CONFLITO`, e só um registro de auditoria é gravado.
- **C6** (`:451`): a colisão sorteia de novo dentro do savepoint. Três colisões seguidas dão 503 com `Retry-After`, sem gravar e sem auditoria, e o acesso anterior continua.
- **C11** (`:494`), nos dois arranjos, e o encerramento do ano contra o gerar (`:544`). Conferi a mecânica: o gatilho roda depois do insert e depois da checagem da FK. As mutações listadas das duas travas ficam vermelhas no arranjo que cada uma sustenta.
- **E15** na unidade (`packages/shared/src/sala/acesso.test.ts`, `apps/api/src/sala/codigo-da-sala.test.ts`): alfabeto, exibição em dois grupos, normalização, sorteio e HMAC com chave própria. A recusa de chave repetida está em `config.test.ts`.
- **I9** em `matriz.test.ts`.
- **I3, P1, A3 e A4** das três rotas em `escola-montada.int.test.ts`. O teste agora aceita o professor como quem chama a rota. O estado de B passou a incluir `acesso_turma`, e o token e o código da montagem entraram como sentinelas.

A tabela de Mutações cobre toda cláusula nova do diff. Não há `.skip`, `.only` nem `any`. Nenhum mock nosso esconde regra: o sorteio injetado é só a fonte de aleatoriedade.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Justificativa errada no filtro de ano.** `turma.repository.ts:73`, filtro `turma.anoLetivoId = exigirAnoEmCurso()` do `travarComVinculoDoProfessor`.
   - A tabela de Mutações diz que "o ano de outra turma nunca tem vínculo confirmado no ano em curso". Isso não confere: o `#comVinculoDoProfessor` compara o vínculo com o ano **da turma**, e não com o ano em curso.
   - O motivo real de a mutação não ficar vermelha é outro: o `encerrar` leva os vínculos a `fim_do_ano`. E, se o estado for montado pelo banco, a FK composta do insert dá 500, não 404.
   - Sugestão: um caso no P2 igual ao T5 da I6 (vínculo confirmado numa turma cujo ano foi posto em `encerrado` pelo banco), esperando nas três rotas o mesmo 404 do id sorteado. A cláusula passa a ser observável. Sem ela o gerar dá 500, mas não vaza nada.
2. **Concorrência do revogar.** Hoje só o gerar tem teste em paralelo. Faltam dois:
   - Clique duplo em "Revogar", com `Promise.all`: um 204, o outro `NAO_ENCONTRADO`, e exatamente um `acesso_turma.revogado`.
   - Revogar ao mesmo tempo que outro professor faz "Gerar novo": documentar o resultado esperado.
   - O `update` condicional já garante o resultado; falta o teste que prove.
3. **Status sem conferência.** Em `acesso-da-turma.int.test.ts:410-416`, o teste "o 400 e os 404 não gravam auditoria" não confere o status de cada chamada. Afirmar 400, 404 e 404 deixa claro o que se testa e dá uma mensagem de falha útil.

## test-engineer · 2ª rodada · REPROVADO · 2026-09-26 16:11:32 · `tasks/prd-apresentacao-escola/4_task.md`

VEREDITO: REPROVADO

Cenários exigidos (desta rodada, a partir das recomendações da 1ª):
- P2: a turma de um ano encerrado, com o vínculo confirmado nela, dá 404 nas três rotas.
- Clique duplo em revogar, com as duas chamadas em paralelo.
- Revogar ao mesmo tempo que outro professor gera um acesso novo.
- O 400 e os 404 conferidos um a um, sem gravar auditoria.

Cobertos:
- **P2 do ano encerrado** (`acesso-da-turma.int.test.ts:296`). O teste é efetivo. O vínculo antigo se amarra ao ano da própria turma (`vinculo.anoLetivoId = turma.anoLetivoId` em `#comVinculoDoProfessor`). Então, se o ano em curso sair de `turma.repository.ts:73`, o `exists` continua achando o vínculo, o gerar esbarra na FK composta e o teste fica vermelho, como a tabela de Mutações diz.
- **Clique duplo em revogar** (`:480`). É determinístico. O segundo UPDATE espera a trava da linha, relê e não acha nada com `revogado_em is null`, e sai 404. Se o `isNull` de `acesso-da-turma.repository.ts:80` sair, os dois dão 204 e aparecem dois `acesso_turma.revogado`, e o teste fica vermelho.
- **O 400 e os 404 sem auditoria** (`:438`). Cada resposta é conferida pelo corpo.

Bloqueantes:
- **`apps/api/test/acesso-da-turma.int.test.ts:490-502`: o teste "revogar ao mesmo tempo que outro professor gera um novo" é intermitente e afirma algo que o sistema não garante.**
  - **Por quê:** o `revogar` (`acesso-da-turma.service.ts:81-88`) não trava a turma nem o ano, e o `Promise.all` não controla a ordem entre as duas chamadas. Há três ordens válidas:
    1. O revogar confirma antes: 204, e o novo fica vigente.
    2. O revogar para na trava da linha anterior, que o gerar está revogando: 404, e o novo fica vigente.
    3. O gerar confirma inteiro antes do UPDATE do revogar. Como cada comando do UPDATE lê de novo o que já foi confirmado, o revogar enxerga o acesso novo e o revoga: sai 204 e não sobra acesso vigente.
  - **O que falha:** na ordem 3, as linhas 499 a 501 ficam vermelhas (`vigentes` vazio, e o GET traz `expiraEm: null`). O comentário da linha 495 ("o que chega depois do gerar não enxerga o novo") está errado: só não enxerga o revogar que está parado na trava enquanto o gerar roda. Com o banco compartilhado e carregado (portão, esteira), essa ordem aparece.
  - **Não protege nenhuma regra:** tirar o `isNull` do `revogarVigente` não o deixa vermelho. Na ordem 2 o revogar relê a linha anterior e a revoga de novo, com o novo ainda vigente.
  - **Correção exigida:** forçar a ordem, como no C5 e no C11 (`GatilhoDeParada` e `esperarNaTrava` com o `pg_stat_activity`):
    - **(a)** O gerar parado no gatilho de `insert` do `acesso_turma`, com o revogar esperando na trava da linha anterior. Depois de soltar: o revogar sai `NAO_ENCONTRADO` sem `acesso_turma.revogado`, o gerar sai 201 e o acesso vigente é o novo, de `criado_por` do segundo professor.
    - **(b)** O revogar confirmado antes do gerar: 204, e o `acesso_turma.gerado` com `substituidos: []`.
    - Se preferir não parar as chamadas, a alternativa é afirmar só o que vale nas três ordens: 201 no gerar, nenhum 5xx, no máximo um acesso não revogado, e, se o revogar deu 204, o id em `acesso_turma.revogado` é o anterior ou o novo, com o estado final coerente com isso. Nesse caso o título deixa de dizer "só alcança o anterior".

Recomendações:
- Na tabela de Mutações do `4_task.md`, depois de corrigido o teste acima, anotar que teste fica vermelho em cada ordem (a e b). Se nenhuma cláusula ficar vermelha só por ele, registrar que ele prova "nunca 5xx e no máximo um vigente".

Não rodei o arquivo de teste, a pedido, por causa do portão no banco compartilhado. O bloqueante vem da leitura do service e do repository do revogar e do gerar, não de uma execução.

Arquivos citados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-turma.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/4_task.md

## test-engineer · 3ª rodada · APROVADO · 2026-09-26 16:41:01 · `tasks/prd-apresentacao-escola/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (3ª rodada, só a correção da 2ª):
- (a) O "Gerar novo" do segundo professor fica parado depois do insert. O revogar fica na trava da linha anterior. Resultado esperado: o revogar sai `NAO_ENCONTRADO`, sem nenhum `acesso_turma.revogado`; o gerar sai 201; o único acesso vigente é o novo, criado pelo segundo professor.
- (b) O revogar é confirmado antes do gerar. Resultado esperado: o revogar sai 204, e o `acesso_turma.gerado` leva `substituidos: []`.

**Cobertos:**
- **(a)**, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-turma.int.test.ts:490-514`.
  - A ordem é forçada de verdade. O gatilho `after insert` para o gerar quando a linha anterior já foi revogada e a trava dela continua com ele. O `esperarNaTrava(…, '%acesso_turma%', 2)` só solta quando o próprio gerar e o `update` do revogar estão em espera `Lock`. Antes disso o revogar só faz uma leitura sem trava (`aberta`), então não conta.
  - Ao soltar, o Postgres relê a linha anterior no revogar, e o `revogado_em` já preenchido a exclui. O acesso novo não está no retrato da consulta.
  - Todas as asserções exigidas estão lá.
  - Mutação: sem o `isNull` do `revogarVigente` (`acesso-da-turma.repository.ts:80`), a releitura aceita a linha, o revogar sai 204 e grava a auditoria, e o teste fica vermelho. Confere com a tabela de Mutações.
- **(b)**, em `:516-542`.
  - A condição do gatilho (`new.id = anterior and new.revogado_em is not null`) para só o revogar. O gerar fica na trava da linha e, relida, ela já está revogada, então o `update` dele não pega nada e o gatilho não dispara para ele.
  - As asserções cobrem o 204, o 201, um vigente do segundo professor, um único `.revogado` com o id do anterior e `substituidos: []`.
  - Mutação: sem o `isNull` do `revogarNaoRevogados` (`:37`), o gerar revoga de novo com o gatilho já solto, `substituidos` sai `[anterior]` e o teste fica vermelho. Confere com a tabela.
- **O teste intermitente saiu.** Os dois novos resultados são determinísticos. O `.at(-1)` de `:541` é confiável: a auditoria ordena por `uuidv7()`, e a auditoria do gerar só é gravada depois que o revogar confirmou.
- **Nada proibido.** Não há `.skip`, mock de coisa nossa nem chamada a provedor. A concorrência é real, com duas requisições HTTP ao mesmo tempo em transações separadas.
- **Mutações e Recomendações.** A tabela de Mutações (`4_task.md`) cita os dois testes nas linhas `:37` e `:80`, e a tabela de Recomendações registra por que o teste sem pausa virou dois.

Não rodei a suíte, como pedido. A conferência é por leitura do código e do helper `gatilho-de-parada.ts`.

**Bloqueantes:** nenhum.

**Recomendações:**
- Em `:541`, trocar `registros.at(-1)` por um filtro `acao === 'acesso_turma.gerado'` e pegar o último. Hoje o teste depende de a ordem por `uuidv7` acompanhar a ordem de confirmação. Está correto, mas o filtro deixa a intenção explícita.
- O `esperarNaTrava` com `'%acesso_turma%'` conta qualquer processo do banco compartilhado esperando numa trava com consulta sobre `acesso_turma`. Hoje só este arquivo escreve na tabela em paralelo, então não há falso positivo. Se outro arquivo de integração passar a fazer isso, vale estreitar o padrão, por exemplo com `update "acesso_turma"` em (a).

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-26 16:51:33 · `tasks/prd-apresentacao-escola/4_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** `acesso_turma` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0020_acesso_turma.sql` e `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/acesso-turma.ts`).
- A tabela tem `escola_id` e `ano_letivo_id`, os dois `not null`.
- O id é UUID, gerado por `uuidv7()`, como nas migrations anteriores.
- A turma entra por FK composta `(escola_id, ano_letivo_id, turma_id)` e o autor por `(escola_id, criado_por)`, com `set null (criado_por)` escrito à mão.
- Os índices únicos parciais começam pela escola. A exceção é `token_hash`, único no sistema de propósito (256 bits).

**Queries verificadas:**
- Em `AcessoDaTurmaRepository`, o filtro `#daTurma`, `revogarNaoRevogados`, `inserir`, `temNaoRevogado`, `revogarVigente` e `vigente` tiram a escola e o ano de `exigirEscolaDoContexto()` e `exigirAnoEmCurso()`, e o `criado_por` de `sessaoDaRequisicao().usuarioId`. Nada disso vem de argumento.
- Em `TurmaRepository`, `travarComVinculoDoProfessor` usa escola, ano e o vínculo confirmado do usuário do token (`#comVinculoDoProfessor`). `travarParaExcluir` e o `not exists` do acesso vigente no `excluir` seguem o mesmo escopo, e o `not exists` se liga à turma pela escola, pelo ano e pelo id.
- `TurmaService.excluir` só trava a turma que achou na própria escola, e só depois disso o `CONFLITO` pode sair.
- Os contratos `esquemaPedidoGerarAcesso` e `esquemaPedidoRevogarAcesso` são `strictObject`. Um corpo com `escolaId` sai 400, e o E13 e a varredura A3 cobrem isso.
- Em revogar e ler, `aberta(..., 'turma_vinculada')` vem antes de qualquer acesso ao repository.
- As mensagens de erro não revelam dado de outra escola. A colisão do código (503) e o `CONFLITO` só olham índices da própria escola, e as duas só acontecem depois da checagem do vínculo. O GET com `{ expiraEm: null }` também só responde depois dessa checagem.
- Não há `@SemEscopo()` nem consulta da camada de rede.

**Teste de isolamento:** presente e efetivo.
- O I3 de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts` roda nas três rotas. O professor da escola A pede a turma da escola B e recebe o mesmo 404 do id sorteado e do id fora do formato, e o estado de `acesso_turma` na B não muda.
- A barreira que o teste realmente prova é o `exists` do vínculo confirmado, que parte do usuário do token. Esse usuário pertence a uma escola só (`usuario_escola_id_unico`), e sem essa cláusula o P2 fica vermelho.
- A escola e o ano no `#daTurma` e na trava são segunda camada. O modelo não deixa montar um dado em que uma delas, sozinha, seja a única barreira, e isso está declarado na tabela de Mutações do `4_task.md`. Não bloqueia.

**Bloqueantes:** nenhum.

**Recomendações:**
- Na 5.0, a busca pelo código precisa estar presa à escola do slug. O `codigo_hmac` é único só dentro da escola e usa a mesma chave para todas, então o mesmo código em duas escolas dá o mesmo HMAC. Uma busca só por `codigo_hmac` acharia acesso de outra escola. Vale anotar isso agora no `5_task.md` e exigir lá um teste I3 com o mesmo código vigente em duas escolas.
- Na 5.0, a busca pelo `token_hash` não tem escola, porque o link não diz a escola. A escola e o ano do contexto da página pública precisam vir da linha achada, nunca do cliente. Isso deve ficar escrito na Tech Spec antes da tarefa.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-26 16:52:22 · `tasks/prd-apresentacao-escola/4_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: a tabela nova `acesso_turma` guarda `criado_por` (o id do professor que gerou o acesso), `turma_id`, `validade_dias`, `expira_em`, `revogado_em`, e o `token_hash` e o `codigo_hmac`, que ligam o registro à turma. Nenhum dado de aluno. A auditoria nova, `acesso_turma.gerado` e `acesso_turma.revogado`, leva só ids, a validade e a lista `substituidos`, sem token, código ou hash.

Fora da tabela de dados do docs/lgpd.md: nenhum. A linha "Acesso da turma" (`/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:74`) cobre tudo o que foi gravado: hash do token, HMAC do código com chave própria, turma, validade e quem gerou. Ela também traz a finalidade e a retenção.

Autorização por objeto: ok.
- As três rotas exigem a célula `turma_vinculada` e, no repository, que o professor da sessão tenha vínculo `confirmado` na turma do ano em curso. O gerar faz isso em `travarComVinculoDoProfessor`; o ler e o revogar, em `aberta(…, 'turma_vinculada')`.
- Troquei o id na URL mentalmente. Coordenação, aluno, professor sem vínculo, com vínculo pendente, contestado ou encerrado, e professor de outra turma ou de outra escola recebem o mesmo 404 de um id sorteado. Isso está provado no P2 e no I3.
- O ler devolve só `expiraEm`. O token e o código saem uma única vez, na resposta do gerar, com `no-store`. A varredura A3 usa os dois como sentinelas.

Logs: limpos. Não há logger em `apps/api/src/sala/`. O 23505 da colisão é tratado sem ir ao log. O A4 procura o token e o código devolvidos em todo o log das rotas novas, no sucesso e em cada erro.

Auditoria: presente no gerar e no revogar, gravada na mesma transação e com o autor. O "Gerar novo" registra em `substituidos` também o acesso derrubado que era de outro professor. Nenhuma das ações obrigatórias da regra 20, item 10, é tocada aqui.

Envio externo: nenhum. A chave `SALA_CHAVE_CODIGO` é separada de todas as outras `_CHAVE_*`, e a API não sobe com ela repetida. O código de 8 caracteres é sorteado com `randomInt`, e o token tem 256 bits de `randomBytes`. No link, o token vai no fragmento (`#<token>`), que o navegador não envia ao servidor nem a log de acesso.

Seed/fixture: sintético. `.env.example` tem `SALA_CHAVE_CODIGO=educa_local_sintetica_codigo_da_turma`, e os testes usam dados gerados.

Pergunta de fechamento: a tabela não guarda nada do aluno. Do professor, guarda o `criado_por`, que a auditoria também registra. O pedido do titular cobrindo as tabelas novas já está marcado para o F3 no `TODO.md`, citado no `10_task.md`. Esta tarefa não abre lacuna nova nisso.

Bloqueantes: nenhum.

Recomendações:
1. **Não há teste que prove que eliminar o professor anula o `criado_por` de `acesso_turma`.** Esse FK foi escrito à mão em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0020_acesso_turma.sql:31` e é a única linha que garante isso. Sem ele (`no action`), eliminar um professor que já gerou acesso falha com 23503. Com o `set null` completo que o drizzle-kit gera, falha no `NOT NULL` de `escola_id`. Não está na tabela de Mutações. O teste está previsto no V4 da 10.0, e por isso não bloqueia. Mas até lá o direito de eliminação do professor fica sem prova. Sugiro trazer para esta tarefa o equivalente de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/lista.int.test.ts:472`: eliminar o autor deixa `criado_por` nulo e a linha continua, e autor de outra escola é recusado pela FK.
2. Nada ainda revoga o acesso no encerramento do ano nem apaga o registro 30 dias depois de vencer ou ser revogado, retenções que a linha do `docs/lgpd.md` declara. As duas estão na 10.1 e na 10.4. Até lá, o acesso revogado fica no banco só como hash e HMAC. Convém conferir que a 10.0 não sai sem as duas.
3. `validadeDias` no esquema da auditoria (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`, em `acesso_turma.gerado`) aceita qualquer inteiro positivo. Se usar `z.literal(VALIDADES_DO_ACESSO_DIAS)`, a auditoria fica do mesmo tamanho que o `CHECK` do banco.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/codigo-da-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/configuracao-da-sala.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/turma.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/acesso.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0020_acesso_turma.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/acesso-turma.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-turma.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts`

Não rodei nenhuma suíte, porque o portão está usando o banco de teste compartilhado.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-26 17:09:00 · `tasks/prd-apresentacao-escola/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, infra). Na primeira conferência o carimbo estava velho, porque `acesso-da-turma.int.test.ts` mudou depois do início do último portão. Esperei o `portao-local.ts --infra` em curso terminar, e a segunda conferência passou.
Bloqueantes: nenhum

Conferi o que costuma quebrar numa tarefa assim, e está certo:
- **Travas contra deadlock.** O gerar trava o ano e depois a turma. O excluir trava só a turma, em `FOR UPDATE`, num comando próprio antes do `delete`. O revogar não trava a turma e não muda coluna de FK, então não pega trava de chave nela.
- **Resposta ao gerar concorrente.** Depois do 23505 no savepoint, o `temNaoRevogado` só enxerga linha de outra transação já confirmada, porque a própria transação já revogou as anteriores. Assim, `CONFLITO` e novo sorteio saem certos.
- **Escopo por escola e ano.** Nos dois repositories, escola e ano vêm do contexto.
- **Contrato.** Os DTOs são estritos, e o token e o código saem só no gerar, com `no-store`.
- **Política de trava da 4.5.** Está registrada na seção 7c da `techspec.md`, no C11 do `cenarios.md` e no `10_task.md`.
- Não achei `.skip`, `any` nem `TODO`.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/cenarios.md`: o E13 não diz que o GET sem acesso vigente devolve `{ expiraEm: null }`, nem que revogar sem acesso vigente é `NAO_ENCONTRADO`. Também faltam, fora do 4_task e do modelo de dados, que "Gerar novo" revoga também o vencido e que a auditoria lista os acessos derrubados em `substituidos`. A `techspec.md` já traz as duas primeiras (seção 4) e o `substituidos` (seção 7); falta levar essas regras ao cenário. A tela (15.0) depende das duas primeiras.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/acesso.ts:66`: o token vem de `esquemaRespostaConviteDaCoordenacao.shape.token`, o contrato do painel da operação. Isso amarra a sala a um contrato que não tem nada a ver com ela. Extrair um esquema de token opaco comum aos dois.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/acesso.ts:15`: `VALIDADE_PADRAO_DO_ACESSO_DIAS` é exportado e ninguém usa; é o padrão da tela (15.0). Pode entrar junto com a tela.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/codigo-da-sala.ts:22`: `hashDoTokenDaSala` é só outro nome para o `hashDoToken`. Usar o original evita dois nomes para a mesma peça.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/configuracao-da-sala.ts:3`: o tamanho mínimo da chave vem de `sessao/configuracao-de-login.ts`. Se ele mudar lá por um motivo do login, a chave da sala muda junto sem ninguém ver. Vale uma constante comum de tamanho de chave.

## test-engineer · 4ª rodada · APROVADO · 2026-09-26 17:12:15 · `tasks/prd-apresentacao-escola/4_task.md`

VEREDITO: APROVADO

Cenários exigidos (esta rodada, pelo diff desde a 3ª): o último `gerado` achado por filtro de `acao`; a espera mais estreita nos dois testes do "revogar em paralelo"; o teste novo do `set null` do `criado_por`, com a FK do autor de outra escola; e a troca para `esquemaTokenDeLink`, `hashDoToken` direto, `TAMANHO_MINIMO_CHAVE_DA_SALA` e `z.literal(VALIDADES_DO_ACESSO_DIAS)` na auditoria, conferindo que nenhum teste perdeu força com ela.

Cobertos:
- **O último `gerado` por filtro.** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-turma.int.test.ts:559` filtra por `acao === 'acesso_turma.gerado'` antes do `at(-1)`. A mutação do `isNull` no `revogarNaoRevogados` faria o `substituidos` sair `[anterior]`, e o teste ficaria vermelho.
- **A espera do teste (a), linha 519.** O padrão `%update "acesso_turma"%` com 1 casa só o revogar. O gerar está parado no gatilho de `insert`, e o texto da consulta dele não contém "update": o `inserir` do repository não usa `on conflict do update`. A espera não passa mais por causa do backend errado.
- **A espera do teste (b), linha 546.** Com 2, ela exige os dois backends no `update`: o revogar parado no gatilho de `update` (a trava consultiva aparece como `wait_event_type = 'Lock'`) e o gerar na trava da mesma linha. A ordem fica forçada. As asserções de 204/201, do `revogado` único com o id anterior e do `substituidos: []` provam a releitura em READ COMMITTED.
- **O "quem gerou vira nulo" (linhas 438 a 454).** O teste falha com a FK em `no action`, porque o `delete from usuario` seria recusado. A FK composta é provada pela recusa `23503` com o nome `acesso_turma_criado_por_da_escola_fk`. O "com a escola" é provado porque a linha é achada por `acessosDa(e, …)` com `criado_por: null` e `revogado_em: null`. A linha correspondente está na tabela de Mutações.
- **O `esquemaTokenDeLink`.** O regex continua provado pelos casos negativos de `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/painel.test.ts:75-77` (42, 44, `=`, `+`), que usam o mesmo objeto. Na sala, o `esquemaRespostaAcessoGerado.parse` do service (linha 74) faria as integrações saírem 500 se o formato quebrasse.
- **Os nomes que saíram.** O grep não acha mais `hashDoTokenDaSala` nem `VALIDADE_PADRAO_DO_ACESSO_DIAS`.
- **Nenhum `.skip`, `.only` ou teste comentado** nos arquivos tocados.
- **Os docs.** O E13 do `cenarios.md` e as notas da 4.0 no `5_task.md` batem com o que os testes provam.

Bloqueantes: nenhum.

Recomendações:
1. **Números de linha da tabela de Mutações do `4_task.md`.** As linhas do `acesso-da-turma.service.ts` estão deslocadas em +1 no código atual: `SORTEIOS_DO_CODIGO` está em `:18` e não `:17`. As demais passam de `:51/52/54/61/63/64/68/71/83/85/86/92` para `:52/53/55/62/64/65/69/72/84/86/87/93`. Em `configuracao-da-sala.ts`, o mínimo de 32 caracteres está em `:16` (constante) e `:19` (uso). Vale acertar para o `/validar` achar a cláusula.
2. **O limite de 32 caracteres da chave da sala não está provado no ponto exato.** Hoje o `config.test.ts` testa com `'curta_sintetica'` (15 caracteres). Trocar o 32 por qualquer valor de 16 a 52 não deixa nada vermelho, e 52 é o tamanho da chave válida do teste. Um caso de 31 recusado e 32 aceito prova o piso de 256 bits que o comentário declara. A linha da tabela ("`:17` (32 caracteres) → `config.test.ts`") promete mais do que o teste entrega.
3. **Nenhum teste prova o `z.literal(VALIDADES_DO_ACESSO_DIAS)` da auditoria.** Voltar para `z.number()` não deixa nada vermelho, porque o 400 do pedido barra o 2 antes. Um caso em `packages/nucleo/src/auditoria/acoes.test.ts` bastaria: o esquema `depois` de `acesso_turma.gerado` recusando `validadeDias: 2` e aceitando 1, 7 e 30. A mesma linha entra na tabela de Mutações.
4. **Opcional, sem mudar o que é provado.** Um caso negativo de token em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/acesso.test.ts:53-58`, para o contrato da sala não depender do teste do painel.

Não rodei nenhuma suíte, porque o portão com `--infra` está usando o banco de teste compartilhado. A auditoria foi feita lendo o diff, os arquivos novos e o `gatilho-de-parada.ts`.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-26 17:51:01 · `tasks/prd-apresentacao-escola/4_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `acesso_turma`. Esta rodada não mexeu em migration nem em schema. A tabela continua com `escola_id` e `ano_letivo_id`, com a FK composta `(escola_id, criado_por)` e a FK `(escola_id, ano_letivo_id, turma_id)`.

Queries verificadas:
- As cinco consultas de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.repository.ts` não mudaram. São `revogarNaoRevogados`, `inserir`, `temNaoRevogado`, `revogarVigente` e `vigente`. Em todas, a escola e o ano vêm de `exigirEscolaDoContexto()` e `exigirAnoEmCurso()`, e o autor vem de `sessaoDaRequisicao()`. Nenhuma recebe escola ou ano por argumento.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.service.ts` (`gerar`, `revogar`, `ler`), a turma do professor é conferida antes de cada acesso ao repository, por `travarComVinculoDoProfessor` ou `aberta(turmaId, 'turma_vinculada')`. A falha devolve `NAO_ENCONTRADO`, a mesma resposta de id inexistente.
- `acesso_turma.gerado` e `acesso_turma.revogado` levam só ids, a validade e o `expiraEm`. Não levam token, código nem hash.
- `esquemaTokenDeLink` substitui o regex local com o mesmo formato. Não tem efeito no escopo.

Teste de isolamento: presente e efetivo.
- O teste novo "quem gerou vira nulo" prova que a FK recusa um autor de outra escola, com a constraint `acesso_turma_criado_por_da_escola_fk`. Ele também prova que a linha continua na escola depois de o autor ser eliminado. `acessosDa` filtra pela escola, então o teste quebraria se o `set null` limpasse o `escola_id` junto com o `criado_por`.
- Os testes de `revogar em paralelo` são de concorrência e não mudam o isolamento.
- As notas que exigi para a 5.0 estão registradas em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/5_task.md`, seção "Notas da 4.0". São duas: a busca pelo código presa à escola do slug, com o mesmo código vigente em duas escolas, e a escola vinda da linha na busca pelo token.

Bloqueantes: nenhum.

Recomendações: nenhuma nova. As duas da 1ª rodada continuam valendo e serão cobradas na auditoria da 5.0.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-26 17:51:13 · `tasks/prd-apresentacao-escola/4_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo nesta rodada. Continua só o `acesso_turma.criado_por`, o id do professor que gerou o acesso, já aprovado na 1ª rodada e agora com o `set null` provado por teste. O token e o código não são dado pessoal. O banco guarda só o SHA-256 do token e o HMAC do código.

Fora da tabela de dados do docs/lgpd.md: nenhum.

Autorização por objeto: ok. O diff não mexe na autorização. As três rotas seguem exigindo o vínculo `confirmado` na turma do ano em curso (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/acesso-da-turma.service.ts:52-53`, `:84`, `:93`). Quem não tem esse vínculo recebe o mesmo `NAO_ENCONTRADO` da turma que não existe.

Logs: limpos. O `AcessoDaTurmaService` não loga nada. O teste novo em `config.test.ts` confirma que a recusa da chave repetida não traz o valor da chave na mensagem.

Auditoria: presente.
- `acesso_turma.gerado` agora leva `validadeDias: z.literal(VALIDADES_DO_ACESSO_DIAS)`, com teste que aceita 1, 7 e 30 e recusa 0, 2 e 31 (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`, `acoes.test.ts`).
- `acesso_turma.revogado` leva só o `turmaId`.
- As duas usam `z.strictObject` e não levam token, código nem hash.

Envio externo: nenhum.

Seed/fixture: sintético.
- A chave em `.env.example:116` é sintética e tem 37 caracteres, acima do piso de 32.
- As chaves de teste em `config.test.ts` também são sintéticas.
- Os e-mails do teste novo usam o domínio `@escola.invalid` e pertencem a usuários da equipe, não a alunos.

Confirmei as três correções da 1ª rodada:
1. **`set null` do `criado_por`**: feita. O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-turma.int.test.ts:438-454`. Ele cobre a FK composta que recusa o autor de outra escola (`acesso_turma_criado_por_da_escola_fk`) e o `criado_por` que fica nulo, com o acesso mantido, quando o usuário é eliminado. A mutação para `no action` está registrada na tabela de Mutações. Pela instrução do portão, não rodei a suíte de integração.
2. **Revogar no encerramento e expurgo de 30 dias**: já estão na 10.1 e na 10.4, e isso ficou registrado em "Recomendações sem aplicar" no `4_task.md`.
3. **`validadeDias` preso a 1, 7 e 30**: feita, com o teste de unidade citado acima.

Também conferi o resto do lote:
- `esquemaTokenDeLink` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/token.ts` tem o mesmo regex de antes (43 caracteres base64url). É usado pelo convite do painel e pela sala, sem mudar o formato.
- `hashDoToken` é chamado direto no service.
- `TAMANHO_MINIMO_CHAVE_DA_SALA = 32` agora é próprio, e o piso tem teste no ponto exato: 31 caracteres recusa, 32 sobe.
- A chave da sala não pode repetir nenhuma variável com `_CHAVE_` no nome.
- As notas no `5_task.md` sobre a busca pelo código presa à escola do slug ajudam o isolamento da 5.0.

Pergunta de fechamento: o código responde. O acesso da turma se liga ao aluno só pela turma, não é enviado para fora e cada geração e revogação fica na auditoria.

Bloqueantes: nenhum.

Recomendações:
- Na 5.0, a busca pelo código e pelo token deve devolver a mesma resposta para "não existe", "vencido", "revogado" e "de outra escola", e ter teste com o mesmo código vigente em duas escolas. Isso já está anotado no `5_task.md`; fica registrado aqui para o `privacy-guardian` da 5.0.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-26 18:11:02 · `tasks/prd-apresentacao-escola/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, infra)

Bloqueantes: nenhum

As cinco correções que pedi na 1ª rodada foram feitas:
- **E13 no `cenarios.md`:** já cobre o `{ expiraEm: null }` do GET, o `NAO_ENCONTRADO` do revogar sem acesso vigente, o acesso vencido revogado pelo "Gerar novo" e o `substituidos` sem repetir o já revogado.
- **Token do link:** o `esquemaTokenDeLink`, em `packages/shared/src/sessao/token.ts`, é a única definição em `packages/shared`. O painel (`painel.ts:156`) e a sala (`acesso.ts:64`) usam o mesmo esquema, e o regex local do painel saiu.
- **`VALIDADE_PADRAO_DO_ACESSO_DIAS` e `hashDoTokenDaSala`:** nenhum dos dois aparece mais no código. O service usa o `hashDoToken`.
- **Tamanho mínimo da chave:** o `TAMANHO_MINIMO_CHAVE_DA_SALA = 32` é próprio da sala (`configuracao-da-sala.ts:16`). O `config.test.ts` confere o limite exato: 31 caracteres recusa, 32 aceita.

As mudanças pedidas pelos outros revisores também não trazem problema:
- **Validade na auditoria:** o `z.literal(VALIDADES_DO_ACESSO_DIAS)` do `acesso_turma.gerado` está coberto por teste com 0, 2 e 31.
- **Autor apagado:** o teste de que `criado_por` vira nulo cobre também a recusa pela FK do autor de outra escola.
- **Notas para a 5.0:** estão no `5_task.md`.
- **Pendência da 10.0:** o `10_task.md` registra que a gravação e o avulso da lista ainda não travam o ano, com a política escrita na seção 7c da `techspec.md`.

Quando entrei, o carimbo estava velho: `configuracao-da-sala.ts` mudou às 17:21 e o último portão tinha começado às 16:39. Esperei o portão `--infra` que já estava rodando terminar, sem rodar nada novo. Ele começou às 17:40 e saiu verde, e o `conferir` agora responde "portão local válido para o código atual".

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/professores/professores.ts:32` ainda pega o token por `esquemaRespostaConviteDaCoordenacao.shape.token`. Agora que existe o `esquemaTokenDeLink`, o convite do professor pode usá-lo direto, como fazem o painel e a sala.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/codigo-da-sala.test.ts:36` repete o regex `/^[A-Za-z0-9_-]{43}$/`. Conferir com `esquemaTokenDeLink.safeParse` amarra o teste ao contrato.
- `FORMATO_DO_REFRESH` repete o mesmo regex em `apps/api/src/sessao/renovacao.service.ts:43` e `apps/api/src/operacao/sessao.service.ts:37`. Já estava assim antes e é outro token, então fica fora desta tarefa. Vale unificar numa correção própria.
