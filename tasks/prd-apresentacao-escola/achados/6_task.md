# Achados das revisões — `tasks/prd-apresentacao-escola/6_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-26 22:08:57 · `tasks/prd-apresentacao-escola/6_task.md`

VEREDITO: APROVADO

Cenários exigidos: pedido pendente pelo código e pelo link (hash argon2id, chave, `teve_matricula_errada` em `false`, o nome sai da sala); I4, I5, R1, R2 (os sete casos, sem "já aprovado"), R3 (unidade), R5; E2 e E7 (partes do pedido), E21 (sem contadores), E23, E24; C1, C2 (a), (b) e (c), C4 nos dois arranjos; L9 (rodízio, conexão presa, 503 com `Retry-After` e reenvio que grava), L10; P5, A3, A4, A6, A7; check, índices únicos e FKs da 0021. Bordas do domínio que a tarefa alcança: dois alunos com o mesmo nome, matrícula digitada com espaço nas pontas, virada de ano (acesso e nome de ano encerrado), nome de outra turma e de outra escola, clique duplo e reenvio depois de queda (C2 e L9), escola barulhenta ao lado de outra (L9).

Cobertos: todos, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-reivindicar.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/salas.test.ts` e na varredura de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts`. Rodei só o teste de unidade (7 verdes). Não rodei nenhuma mutação: para as de integração eu precisaria do banco de teste.

- **Tabela de mutações.** Bate com o diff: toda cláusula nova tem linha. As três sem teste vermelho estão justificadas e já aceitas no I5 do `cenarios.md`: escola e ano em `chaveGravada` e em `tomar` são segunda camada, porque a turma é UUID global vinda do acesso. Os dois índices não únicos são desempenho.
- **Asserções sobre o resultado.** Os casos de "nada gravado" comparam o retrato do banco antes e depois. As respostas de erro são comparadas byte a byte, sem o `requisicaoId`. O R2 confere `hashes.mock.calls == [[SENHA]]` em cada caso. O R5 confirma que a matrícula existente entra com a senha dela, então o 401 do pendente vem da credencial.
- **Concorrência de verdade.** C1 e C2 (a) usam `Promise.all`. No C2 (b) a vez é controlada pelo `semaforo.esperando`. No C2 (c) o hash do segundo envio fica segurado e um espião no `inserirPendente` confere o 23505 do `pendente_por_nome`. No C4, o `GatilhoDeParada` junta com o `esperarNaTrava` sobre o `pg_stat_activity`. No L9, `pool.totalCount - pool.idleCount === 0` com três pedidos esperando.
- **Sem `.skip`, `.only` nem `any`.** Nenhum teste chama provedor de IA. Os mocks são de pontos de injeção, e o R3 mocka os repositories, mas o R2 prova a mesma regra com o banco e o hash de verdade. Os mocks são o `tomar` no E23 (a falha injetada), o espião no `inserirPendente` do C2 (c), que chama o real, e o portão no hash.

Bloqueantes: nenhum.

Recomendações:
1. `salas-reivindicar.int.test.ts:309-319` (E23): `pedidosNaTransacao` igual a `[0]` não prova que o `insert` rodou antes da falha, embora o comentário da linha 311 diga que sim. Um espião no `inserirPendente`, com a ordem das chamadas, fecharia isso. Hoje a ordem "`insert` antes do `update`" é pega pelo C2 (c) e pelo C4, então não é lacuna de regra.
2. "A mesma chave em outra escola grava" (plano, linha do `tenancy-guardian`) só é provado por `insert` direto no teste "os únicos e as FKs". Um caso pela API ajudaria: a chave gravada num pedido de B, depois um pedido em A com a mesma chave, que responde `enviado` e grava em A.
3. Falta um caso de "matrícula repetida em escolas diferentes" pela rota. Por exemplo: um nome de A e um de B com a mesma matrícula; o pedido pelo acesso de A toma só o de A, e o de B continua `livre`. O `update` filtra pelo id, então hoje não há risco, mas a borda da regra 60, item 6 ficaria escrita.
4. O C2 (c) (`salas-reivindicar.int.test.ts:618-632`) deixa o índice recriado no banco de teste local, com o OID trocado, e as rodadas seguintes pulam a recriação. Está documentado na migration e no C2, mas vale uma linha no teste dizendo que o estado fica, para quem depurar os 23505 depois.

## test-engineer · 2ª rodada · APROVADO · 2026-09-26 22:20:38 · `tasks/prd-apresentacao-escola/6_task.md`

VEREDITO: APROVADO

Cenários exigidos: os mesmos da 1ª rodada (pedido pendente pelo código e pelo link, I4, I5, R1 a R3, R5, E2, E7, E21, E23, E24, C1, C2 (a), (b) e (c), C4, L9, L10, P5, A3, A4, A6, A7, e o check, os índices e as FKs da 0021). Nesta rodada conferi só o que as quatro recomendações exigiam. O código de produção não mudou.
- E23: o `insert` roda antes da falha, dentro da transação.
- A mesma chave em duas escolas, pela API.
- Matrícula repetida em escolas diferentes, pela rota (regra 60, item 6).
- A nota sobre o índice recriado no C2 (c).

Cobertos: as quatro, todas em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-reivindicar.int.test.ts`.
- **E23 (`:306-334`).** O espião chama o `inserirPendente` real, que devolve `Promise<void>`. Por isso o `mockImplementationOnce` não muda o que o service recebe. A ordem só se completa se o `insert` gravar antes de o `tomar` falhar, e a asserção `:323` confere as duas coisas: a ordem e "0 pedido visível de fora". As asserções `:328-333` continuam provando que as duas escritas voltaram e que o pedido seguinte grava.
- **A mesma chave em duas escolas (`:518-529`).** O teste falharia se a regra caísse. Se o índice `reivindicacao_chave_na_escola_unica` (hoje `escola_id, chave_envio`) passasse a valer para o sistema todo, o pedido de A levaria o 23505. A releitura em `chaveGravada` não acharia a chave em A e a resposta seria RECUSADA, o que quebra a `:527`. A `:528` também quebra, porque espera o pedido gravado em A com a chave. A `:529` confirma que o pedido de B não mudou.
- **Matrícula repetida em escolas diferentes (`:518-537`).** A primeira parte grava a mesma matrícula num nome de A e num de B, e cada escola acaba com o seu pedido. A segunda parte (`:531-536`) é só registro da borda: o `tomar` filtra pelo id, então hoje nenhuma mutação a deixaria vermelha, como eu já tinha dito na 1ª rodada. Por isso não entra como teste de regra.
- **C2 (c), `:645-647`.** O comentário diz que o índice recriado fica no banco de teste até ele ser recriado, e explica o `if` das rodadas seguintes.

Procurei `.skip`, `.only`, `.todo` e `any` nos dois arquivos de teste e não achei nenhum. Nenhum teste chama provedor de IA. A linha em "Recomendações sem aplicar" do `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/6_task.md` bate com o que foi feito. Não rodei os testes de integração (precisam do banco de teste); confio no portão local carimbado de novo, e não reprovo pela falta do `--infra`, como o Joaquim decidiu.

Bloqueantes: nenhum.

Recomendações: nenhuma nova.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-26 22:21:35 · `tasks/prd-apresentacao-escola/6_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `reivindicacao` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0021_reivindicacao.sql`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/reivindicacao.ts`).
- Tem `escola_id` e `ano_letivo_id`, ambos `not null`.
- O id é UUID (`uuidv7()`).
- As FKs são compostas com a escola: com a turma pela escola e pelo ano (`escola_id, ano_letivo_id, turma_id`), e com o nome e com quem decidiu pela escola. As duas com `SET NULL` usam a forma com coluna (`SET NULL ("lista_nome_id")`, `SET NULL ("decidida_por")`), que não anula a escola.
- Os índices únicos parciais estão dentro da escola: `(escola_id, chave_envio)` e `(escola_id, lista_nome_id)` só no pendente.
- Os dois índices não únicos começam pela escola.

Queries verificadas:
- `ReivindicacaoRepository.chaveGravada` e `inserirPendente` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.repository.ts`): escola e ano vêm de `exigirEscolaDoContexto()` e `exigirAnoEmCurso()`, e a turma é só filtro.
- `ListaLivreRepository.tomar` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/lista-livre.repository.ts:61-77`): filtra por escola e ano do contexto, pela turma do acesso, pelo id, por `livre` e pela matrícula.
- A turma sai da linha do acesso vigente que `AcessoDaSala.naSala` resolve pelo slug e pelo token ou código. É ele que abre o contexto (`naEscolaSemUsuario`), e o cliente não informa escola, ano nem turma.
- O contrato `esquemaPedidoReivindicarSala` é `strictObject`: `escolaId` ou `turmaId` no corpo dá 400. O teste P5 cobre isso.
- O `listaNomeId` que o cliente manda só é aceito dentro do escopo: a FK composta e o `update` filtrado barram o de outra escola.
- Não há `@SemEscopo()`.
- O que o nome faz não revela nada. O nome inexistente, o de outra turma, o de outra escola, o de ano encerrado, o já tomado e a matrícula errada recebem o mesmo 409 `REIVINDICACAO_RECUSADA`, com o corpo comparado byte a byte e um hash em cada caso (R2, I5). Acesso que não vale dá o mesmo `NAO_ENCONTRADO`, sem hash (R1, I4).
- A tarefa não tem consulta da camada de rede.

Teste de isolamento: presente e efetivo (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-reivindicar.int.test.ts`).
- Sem a turma no `tomar`, o I5 (nome de T2 e nome de B pelo acesso de T1) e o R2 quebram.
- Sem a turma no `chaveGravada`, o E21 quebra (a mesma chave pelo acesso de T2).
- Se o único da chave valesse para o sistema todo, o caso "a mesma chave em duas escolas" quebraria.
- Escola e ano em `tomar` e `chaveGravada` são segunda camada: a turma é UUID que vem da linha do acesso, resolvida no servidor, e a FK composta com a escola barra o nome de B no `insert`. É o mesmo arranjo aceito na 5.0.

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.repository.ts:24-26` e `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/lista-livre.repository.ts:67-68`: nenhum teste quebra se escola e ano saírem daqui, e a tabela de mutações registra isso. Quando a 8.0 ler os pedidos pela turma com sessão de professor, vale um teste em que a turma não venha da linha do acesso, para essas cláusulas deixarem de depender só da FK.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-26 22:22:22 · `tasks/prd-apresentacao-escola/6_task.md`

**VEREDITO: APROVADO**

A tarefa 6.0 não viola a regra 20. Não há bloqueante.

**Campos pessoais tocados:** a tabela nova `reivindicacao` guarda o hash argon2id da senha, a chave de envio, o `teve_matricula_errada`, o estado, as datas, a turma, a referência ao nome da lista e quem decidiu. A matrícula do aluno só aparece no filtro do `update` de `lista_nome`, que já existia. Não há campo proibido para aluno. Não existe `dispositivo`, IP nem cookie.

**Fora da tabela de dados do `docs/lgpd.md`:** nada. A linha "Reivindicação" (`docs/lgpd.md:73`) bate com a migration. Ela prevê o hash, a chave e a marca de matrícula errada só enquanto o pedido está pendente, e o check `reivindicacao_segredo_so_pendente` garante isso nos dois sentidos. O resto fica pela vigência mais 5 anos, e o pedido perde o nome quando a linha da lista sai, porque a FK anula só a coluna `lista_nome_id`.

**Autorização por objeto:** ok.
- A escola, o ano e a turma saem do acesso vigente (`AcessoDaSala.naSala`) e nunca do corpo. O contrato é estrito, então mandar `escolaId` ou `turmaId` dá 400.
- Os dois repositórios aplicam escola e ano do contexto, e a turma entra como filtro. As FKs compostas com a escola são a segunda camada.
- Nome inexistente, de outra turma, de outra escola, de ano encerrado, já tomado ou com a matrícula errada recebem a mesma resposta, `REIVINDICACAO_RECUSADA`, e nada é gravado. O hash roda em todos esses casos, então o tempo de resposta também não diz qual dos dois errou.
- Acesso que não vale responde `NAO_ENCONTRADO`, igual ao da rota de abrir a sala.
- A mesma chave mandada pelo acesso de outra turma não é tratada como reenvio.
- O login com a matrícula e a senha de um pedido ainda pendente responde igual a senha errada.

**Logs:** limpos. Não há `logger` nem `console` em `apps/api/src/sala/`. Pelo filtro global de erros sai só o SQLSTATE e o nome da restrição, sem mensagem nem `detail`. A varredura A4 em `escola-montada.int.test.ts` usa como sentinelas a senha (num formato que passa pelo `LoggerDoNest`), as chaves de envio, as matrículas e o hash. A tabela de mutações mostra que um log com a senha deixou a A4 vermelha.

**Auditoria:** nesta tarefa não precisa. Pedido anônimo não é leitura de dado de aluno pela coordenação ou pela rede, nem exportação, nota, permissão ou saída de IA. A auditoria da decisão é da tarefa 8.0.

**Envio externo:** nenhum. Não há IA nem terceiro envolvido.

**Seed/fixture:** sintético. Nomes como `Aluno N <sufixo>`, matrículas `sala-…` e `lista-…`, hash `$argon2id$sintetico` e senha de teste gerada na hora.

**Exposição:**
- A resposta é validada pelo esquema estrito `{ resultado: 'enviado' }`.
- A rota responde com `Cache-Control: no-store`. Segredos vão só no corpo, nunca na URL.
- O erro volta com o código e a mensagem do catálogo, sem stack trace.
- A rota é anônima e conta no limite `rl:ip`.

**Pergunta de fechamento:** o que se guarda sobre o aluno no pedido fica preso a ele por `lista_nome_id` e documentado em `docs/lgpd.md:73` e `docs/modelo-de-dados.md`. Nada foi enviado para fora. A exportação por código ainda é do F3 e não é uma lacuna nova desta tarefa.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Os contadores de matrícula errada por nome só chegam na 7.0. Até lá, adivinhar a matrícula de um nome esbarra só no `rl:ip` e no custo do hash. Não é bloqueante, porque o dado é sintético e o escopo foi declarado, mas a 6.0 não deveria ir a nenhum ambiente de demonstração sem a 7.0.
2. Um check a mais em `packages/nucleo/drizzle/0021_reivindicacao.sql:35`, `estado <> 'pendente' or lista_nome_id is not null`, fecharia por estrutura um pedido pendente com o hash da senha e sem nome, caso algum caminho futuro (eliminação ou encerramento) apague a linha da lista antes de fechar o pedido. Hoje nenhum caminho faz isso, porque a retirada só apaga nome livre e a 10.0 encerra o pendente na mesma transação. Com o check, esse caminho futuro falharia com erro em vez de deixar o pendente órfão.
3. Quando o pedido do titular chegar (F3), a consulta de "tudo sobre o aluno" precisa incluir `reivindicacao` por `lista_nome_id` enquanto a linha da lista existir. Depois do `set null` o pedido não se liga mais à pessoa, como a tabela da LGPD prevê.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0021_reivindicacao.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/reivindicacao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/lista-livre.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/salas.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sala/salas.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/erro/filtro-global.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/escola-montada.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-reivindicar.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/modelo-de-dados.md`

## revisor-geral · 1ª rodada · APROVADO · 2026-09-26 22:22:32 · `tasks/prd-apresentacao-escola/6_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: o `conferir` falha com esta mensagem: "portão local: o último não rodou infra. Rode `node tools/processo/portao-local.ts --infra`." Chamei `avaliarCarimbo` direto, exigindo só typecheck, lint e test, e o carimbo está fresco: começou em 2026-09-27T01:09:41Z e nenhum arquivo auditado mudou depois dele. Não reprovei por isso porque você informou que o Joaquim decidiu rodar `--infra` só no portão final. Não consigo confirmar essa decisão. O hook vai barrar o commit até alguém rodar `node tools/processo/portao-local.ts --infra`.

Bloqueantes: nenhum.

O que conferi e está ok:
- **Subtarefas 6.1 a 6.5:** todas feitas.
- **Tarefas vizinhas:** o `for share` no ano ficou para a 10.0 (item 10.2 e C10). Contadores, métricas `sala.*` e `teve_matricula_errada` real ficaram para a 7.0 (item 7.6). Nada disso entrou antes da hora.
- **Divergências:** as seis estão registradas também na `techspec.md` (§3 e §4) e no `cenarios.md` (P5, R1, R2, E2, E21, E24, C4), não só no `6_task.md`.
- **Serviço:** segue a ordem do passo 4. Checa a chave, roda o hash no semáforo com o balde da escola fora da transação, faz o `insert` e depois o `update` condicional. Nos erros, volta atrás e relê a chave com um comando novo, sem ler o nome da restrição.
- **Escopo de escola:** escola e ano saem do contexto aberto por `naEscolaSemUsuario`, sem transação nem conexão presa durante o hash. A turma sai da linha do acesso.
- **Contrato e erro:** o contrato está em `packages/shared`. O erro é tipado (`REIVINDICACAO_RECUSADA`, 409), e a mensagem é igual ao texto do W9 no `cenarios.md:409`.
- **Dado pessoal:** `docs/lgpd.md:73` já tinha a linha do pedido. O `docs/modelo-de-dados.md` foi atualizado e o bloco F2 ficou só com o `Responsavel`.
- **Testes:** nenhum `.skip`, `any` ou `TODO` no código nem nos testes novos.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/salas.service.ts:126`: `entradaDaSala` virou função compartilhada, mas continua no arquivo do `SalasService`, e `reivindicacao.service.ts:9` importa de outro serviço. Um arquivo próprio no módulo `sala` evita que um serviço dependa do outro.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/sala.module.ts:190-196`: no mesmo módulo, o `SalasService` recebe argumentos posicionais e o `ReivindicacaoService` recebe um objeto de dependências. É bom escolher um estilo para os serviços do `sala`.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.repository.ts:28-42`: `chaveGravada` não filtra por `estado`. A correção depende de a 8.0 e a 10.0 anularem a chave na decisão e no encerramento, como o check `reivindicacao_segredo_so_pendente` obriga. Vale uma linha no comentário do método dizendo isso.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-26 22:22:44 · `tasks/prd-apresentacao-escola/6_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login (a reivindicação usa o mesmo semáforo de hash do login), sala, migration

Rate limit: nesta tarefa a rota só tem o `rl:ip` anônimo, com teto de 3.000/min, acima de uma escola inteira, que dá ~1.300/min. Então esse limite não bloqueia a escola. A justiça entre escolas já existe, pelo balde da escola no `SemaforoDeHash`. Os limites por escola, por nome e por turma estão escritos na 7.0, que o pedido desta revisão deixa fora do escopo. Aceito para esta tarefa, mas a 7.0 precisa entrar antes de qualquer ambiente com escola real.

Fila e prioridade: ok. Não há job. O argon2id roda no request, pelo mesmo semáforo do login, no balde da escola e fora da transação. O teste L9 prova que nenhuma conexão fica presa e que o 503 sai com `Retry-After`.

Concorrência: protegida.
- O reenvio, o clique duplo e a corrida no mesmo nome caem nos dois índices únicos parciais, `reivindicacao_chave_na_escola_unica` e `reivindicacao_pendente_por_nome`.
- O `update` condicional da `lista_nome` fica dentro da transação, depois do `insert`.
- Qualquer falha volta atrás e relê a chave num comando novo (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts:246-249`). O "busca, verifica, grava" da `chaveGravada` antes do hash não depende da leitura, porque o índice único decide.
- A ordem das travas não trava em ciclo. Com a FK, o `insert` pega `FOR KEY SHARE` no nome, e o `update` do estado é compatível com isso.
- C1, C2 (a, b, c) e C4 rodam em paralelo de verdade.
- O `for share` no ano (C10) fica na 10.0, como diz o pedido.

Índice e paginação: ok.
- `chaveGravada` lê pelo único parcial `(escola_id, chave_envio)`, e `tomar` pela chave primária.
- Os índices da turma e do nome começam pela escola.
- Não há listagem nova.

Degradação de IA: não se aplica.

Migration: compatível. A `0021_reivindicacao.sql` só cria uma tabela nova e vazia. O `SET NULL (coluna)` exige Postgres 15 ou mais, e o `uuidv7()` já aparece em migrations anteriores.

Métrica e alerta: ok para o escopo.
- A latência e o erro da rota já saem em `http.server.request.duration`, por rota template.
- `sala.reivindicacao{resultado}` e `sala.limite_atingido` estão na 7.0.
- O cenário k6 `reivindicacao-em-sala` está na 9.3.

Bloqueantes: nenhum

Recomendações:
1. **Alerta do semáforo mistura reivindicação e login.** A reivindicação agora soma em `login.hash_recusado` e em `login.hash_espera`. O alerta `login-hash-recusado` divide esse contador por `login_duracao_seconds_count`, e o denominador só conta login. No primeiro dia, com muitas reivindicações e poucos logins, a razão sobe sem que o login esteja pior. O runbook (`/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:256-262`) também só fala de login e da tela "entrando…". Proposta para a 7.0 ou a 9.0:
   - dizer no runbook que a reivindicação usa o mesmo semáforo;
   - ou separar o 503 da reivindicação com um rótulo, ou somá-lo também ao denominador.
2. **Registrar na 7.0 o que fica exposto até ela entrar.** Até lá, um código válido permite tentar matrículas num nome livre, e cada tentativa só custa um hash. O que segura hoje é o `rl:ip` e a vez da escola no semáforo. A 7.0 precisa entrar antes do staging (D31).

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/lista-livre.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/salas.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0021_reivindicacao.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/reivindicacao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-reivindicar.int.test.ts`

## test-engineer · 3ª rodada · APROVADO · 2026-09-26 22:36:05 · `tasks/prd-apresentacao-escola/6_task.md`

VEREDITO: APROVADO

A rodada 3 audita só o diff desde a 2ª, que tinha sido aprovada.

**Cenários exigidos:** os mesmos da 2ª rodada. O único item novo é o check `reivindicacao_pendente_com_nome`: um pedido pendente sempre aponta para um nome da lista, e o nome não pode sair enquanto o pedido estiver pendente.

**Cobertos:**
- **O check novo tem teste que falha sem ele.** O caso "pendente sem nome" em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-reivindicar.int.test.ts:405` passa a gravar sem o check. Os três segredos vêm preenchidos, então o check antigo `segredo_so_pendente` não o pega, e a FK aceita nome nulo. Com isso o `rejects` fica vermelho.
- **O `delete` do nome de um pendente também tem teste.** Está na linha 419 e confere o código 23514 e o nome da constraint. Sem o check, o `set null` da FK passaria e o teste quebraria. A linha 420 confere que o nome continua `livre`, ou seja, que ele não saiu.
- **A tabela de Mutações bate com o diff.** O `6_task.md:168` tem a linha nova. Conferi os números de linha contra a `0021_reivindicacao.sql`: 35 é o estado, 36 o check novo, 37 o decisor, 38 os segredos, 42 a FK da turma e 45 e 46 os índices únicos. Estão certos.
- **O check novo não quebra nenhum caminho de produção.** O único `delete` de `lista_nome` fora de teste é o `retirarLivre` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts:108`), que só apaga nome `livre`. A corrida entre retirar e reivindicar já tem os dois testes C4 com concorrência real (linhas 706 e 728), que continuam valendo.
- **`entradaDaSala` só mudou de arquivo.** A função em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/entrada-da-sala.ts` é igual à que estava em `salas.service.ts`, e os dois serviços importam dela. Os testes de abrir e reivindicar pelo link e pelo código já a exercitam, então não precisa de teste novo.
- **O docblock do `chaveGravada`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.repository.ts:28-29`) só acrescenta comentário. A explicação confere com o check `segredo_so_pendente`.
- Não há `.skip`, teste comentado, mock novo nem chamada a provedor de IA no diff.

**Bloqueantes:** nenhum.

**Recomendações:**
- A tarefa 10.0 (virada do ano) e a eliminação de aluno precisam fechar ou apagar o pedido pendente antes de apagar o nome. Se não fizerem isso, o 23514 sobe como 500. Vale deixar esse cenário escrito no `cenarios.md` da 10.0 e na tarefa de eliminação, para que o teste delas cubra a ordem das operações.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-26 22:36:55 · `tasks/prd-apresentacao-escola/6_task.md`

VEREDITO: APROVADO
Tabelas verificadas: `reivindicacao`. Esta rodada só acrescentou o check `reivindicacao_pendente_com_nome` na 0021 e no schema. `escolaId` e `anoLetivoId` continuam `not null`. As FKs compostas com a escola não mudaram: a do nome, a da turma com escola e ano, e a de quem decidiu. O id continua UUID (`uuidv7()`). O check não mexe no escopo. Conferi também o único caminho que apaga `lista_nome`, o `ListaRepository.retirarLivre` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts:108`. Ele apaga só nome `livre`. O nome com pedido pendente já saiu de `livre` na mesma transação do `inserirPendente` (`reivindicacao.service.ts:64-66`), então o check novo não cria um 500 nesse caminho.
Queries verificadas: `ReivindicacaoRepository.chaveGravada` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/reivindicacao.repository.ts:31`). Só o docblock mudou, e a consulta segue filtrando escola e ano pelo contexto, mais a turma do acesso. O `entradaDaSala`, agora em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/entrada-da-sala.ts`, apenas mudou de arquivo. Ele só calcula a busca da sala (slug mais o hash do token ou o HMAC do código), e quem resolve a escola e a turma continua sendo o `AcessoDaSala.naSala`. Nenhum `escolaId` entra pelo pedido. Os dois pontos que o chamam, `salas.service.ts:25` e `reivindicacao.service.ts:59`, fazem a mesma coisa que antes.
Teste de isolamento: presente e efetivo. Desde a 1ª rodada nenhuma query mudou. O check novo tem teste próprio em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-reivindicar.int.test.ts:419`.
Bloqueantes: nenhum
Recomendações: nenhuma nova. A da 1ª rodada, o teste com a turma que não vem da linha do acesso, já está anotada no 8_task.md.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-26 22:37:10 · `tasks/prd-apresentacao-escola/6_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o que mudou desde a 1ª e conferi as três recomendações, que foram todas aplicadas.

Campos pessoais tocados: nenhum campo novo nesta rodada. Entrou só o check `reivindicacao_pendente_com_nome` na tabela `reivindicacao`, que já existia na 1ª rodada. Ele não coleta nada: só impede que um pedido pendente fique sem nome.

Fora da tabela de dados do docs/lgpd.md: nada. A linha "Reivindicação" (`/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:73`) continua batendo com a migration. O `docs/modelo-de-dados.md` agora descreve o pedido e o check, e tirou a `Reivindicacao` antiga, que ainda tinha o campo `dispositivo`, da seção "Ainda não existe".

Autorização por objeto: ok. O `entradaDaSala` foi movido para `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/entrada-da-sala.ts` sem mudar o que faz: o token vira SHA-256 e o código vira HMAC com a chave da sala. O abrir e o reivindicar usam a mesma função, e a turma continua saindo do acesso resolvido no servidor. O `chaveGravada` só ganhou docblock e continua filtrando por escola, chave, ano e turma.

Logs: limpos. Não há `logger` nem `console` em `apps/api/src/sala/`.

Auditoria: não é exigida nesta tarefa. Nenhuma ação desta rodada entra no item 10 da regra 20. A auditoria da decisão sobre o pedido fica para a 8.0.

Envio externo: nenhum.

Seed/fixture: sintético. O teste novo usa `$argon2id$sintetico` e `randomUUID()`.

As três recomendações da 1ª rodada:
1. **Nenhum ambiente com a 6.0 sem a 7.0: feito.** O item "A página pública da sala só com a 7.0 junto", no `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md:192-198`, agora cobre também `salas/reivindicar`: até o contador por nome da 7.0, quem tem um código válido pode ir tentando matrículas num nome livre.
2. **O check: feito.** Ele está em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0021_reivindicacao.sql:37` e no schema. O teste, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-reivindicar.int.test.ts:405` e `:419`, é efetivo:
   - O caso "pendente sem nome" tem os três segredos preenchidos. Então só o check novo pode recusar a gravação, e o teste falharia sem ele.
   - O `delete` do nome de um pendente confere a restrição pelo nome, e confere que o nome continua `livre` depois.
   - Nenhum caminho de hoje esbarra no check. O único `delete(listaNome)` do código, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts:110`, só apaga nome `livre`, e o nome com pedido pendente já está `reivindicado`.
   - A ordem que a 10.0 precisa seguir está anotada em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-escola/10_task.md`: primeiro fechar os pendentes, depois apagar os nomes; na eliminação, primeiro apagar os pedidos, depois a `lista_nome`.
3. **Pedido do titular: feito.** O item do F3 em `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md:13-16` diz como o pedido se liga ao aluno: por `lista_nome_id` enquanto a linha da lista existe, e a ninguém depois que a referência vira nula.

Pergunta de fechamento: nada mudou em relação à 1ª rodada. O pedido fica ligado ao aluno por `lista_nome_id`, e nada sai para fora. Responder por código ao pedido de tudo sobre um aluno continua sendo trabalho do F3, e ele está registrado no TODO.

Bloqueantes: nenhum.

Recomendações:
1. Na 10.0, o 23514 do `reivindicacao_pendente_com_nome` não deve chegar ao cliente como 500. Se a ordem das escritas quebrar num caminho futuro, o erro precisa sair tipado. A mutação que a nota do `10_task.md` já pede (inverter as duas escritas e ver o teste ficar vermelho) cobre isso.

Nenhuma outra recomendação nova.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-26 22:37:13 · `tasks/prd-apresentacao-escola/6_task.md`

VEREDITO: APROVADO
Caminho quente tocado: sala | migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

Esta rodada auditou só o que mudou desde a 1ª. Nenhuma query nem trava do caminho quente mudou.

- **Check novo `reivindicacao_pendente_com_nome`** (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0021_reivindicacao.sql`):
  - Fica dentro do `CREATE TABLE` de uma tabela nova e vazia. Não trava tabela grande e o código anterior não conhece a tabela.
  - O schema e o `0021_snapshot.json` estão coerentes com a migration, e o journal registra a 0021.
  - Conferi se ele quebra algum caminho que já existe. O único `delete` de `lista_nome` fora dos testes é `retirarLivre` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/estrutura/lista.repository.ts:108`), e ele só apaga nome `livre`.
  - Quando o pedido nasce pendente, o nome passa a `reivindicado` na mesma transação (`ListaLivreRepository.tomar`). Por isso a retirada nunca chega a um nome com pedido pendente, e o check não vira 500 ali.
  - A turma com pedido continua sem poder ser excluída (a FK sem ação responde `CONFLITO`).
  - O teste prova o check: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/salas-reivindicar.int.test.ts:392-420`. Ele recusa o insert do pendente sem nome, recusa o delete do nome de um pendente (23514, com a restrição nomeada) e confere que o nome não mudou.
- **`entradaDaSala`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/entrada-da-sala.ts`): é função pura, sem estado. `salas.service.ts` e `reivindicacao.service.ts` usam a mesma função, e o comportamento não mudou.
- **Docblock do `chaveGravada`:** só comentário. A query continua com escopo de escola, ano e turma.
- **Minhas duas recomendações da 1ª rodada:** o alerta e o runbook ficaram anotados no 9_task.md, e a exposição até a 7.0 ficou no TODO.md. As duas estão registradas para decidir na tarefa certa, como pedido.

Recomendações: nenhuma nova. As duas da 1ª rodada seguem abertas no 9_task.md e no TODO.md.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-26 22:37:14 · `tasks/prd-apresentacao-escola/6_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: o `conferir` falha com esta mensagem: "portão local: o último não rodou infra. Rode `node tools/processo/portao-local.ts --infra`."

**Bloqueantes:** nenhum.

**Sobre o portão:** as outras três suítes estão válidas. Conferi o carimbo exigindo só typecheck, lint e test: ele começou em 2026-09-27T01:25:13Z, e nenhum arquivo de código mudou depois disso. Não reprovei pela falta do infra porque você disse que o Joaquim decidiu rodá-lo só no portão final. Não consigo confirmar essa decisão. A tarefa tem `infra-guardian` obrigatório, então o hook vai barrar o commit até alguém rodar `node tools/processo/portao-local.ts --infra`.

**Minhas recomendações da rodada anterior:**
- `entradaDaSala` virou a função única em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sala/entrada-da-sala.ts`. O corpo é o mesmo de antes, e `salas.service.ts` e `reivindicacao.service.ts` importam de lá. Não sobrou cópia nem import antigo de `hashDoToken` ou `hmacDoCodigoDaTurma`.
- O comentário do `chaveGravada` (`reivindicacao.repository.ts:28-29`) está correto. O check `reivindicacao_segredo_so_pendente` garante que a chave de envio só existe em pedido pendente.
- A recusa do estilo de construtor está registrada com o motivo, e aceito.

**O check novo `reivindicacao_pendente_com_nome`:**
- Está igual na migration `0021_reivindicacao.sql:36`, no schema `reivindicacao.ts:71` e no `0021_snapshot.json`. Também foi levado à `techspec.md:39`, ao `cenarios.md:176`, ao `docs/modelo-de-dados.md` e à tabela de mutações do `6_task.md:168`.
- O teste em `salas-reivindicar.int.test.ts:405-420` cobre o pendente sem nome. Cobre também o `delete` de um nome com pedido pendente, conferindo o código 23514 e o nome exato da restrição.
- Procurei algum caminho atual que apague uma linha de `lista_nome` com pedido pendente e só achei o `ListaRepository.retirarLivre` (`apps/api/src/estrutura/lista.repository.ts:108-114`). Ele apaga apenas nome `livre`, e o nome com pedido pendente já está `reivindicado`, porque as duas escritas vão na mesma transação. A turma com pedido não se exclui (FK sem ação). Então o check não quebra nenhum fluxo que já existe.

**As notas em `TODO.md`, `8_task.md`, `9_task.md` e `10_task.md`:** só registram o que as próximas tarefas precisam tratar e não adiantam código delas. A nota da 10.0, que pede fechar o pedido antes de apagar o nome, é a consequência certa do check novo.

**Recomendações:** nenhuma nova.
