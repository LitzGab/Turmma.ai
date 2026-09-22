# Achados das revisões — `tasks/prd-identidade-e-tenancy/11_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 11:52:55 · `tasks/prd-identidade-e-tenancy/11_task.md`

VEREDITO: APROVADO

Cenários exigidos (os da 1ª rodada, sem mudança):
- caminho feliz do login por matrícula
- isolamento: a mesma matrícula existe em duas escolas, e o bloqueio de uma não afeta a outra
- privacidade: resposta e custo iguais para slug inexistente, slug fora do formato, matrícula inexistente, aluno desativado e senha errada
- o bloqueio também não revela se a conta existe
- 400 logins do mesmo IP (regra 80, item 1)
- concorrência de verdade: 10 tentativas em paralelo avaliam no máximo 5 hashes
- `educa_dispositivo` preso à escola e à matrícula, incluindo o Chromebook compartilhado no carrinho
- aluno transferido
- dois alunos com o mesmo nome
- inatividade configurada por escola
- permissão: a sessão do aluno não lê a turma
- entrada fora do contrato é recusada
- matrícula e slug nunca aparecem no log

Cobertos: todos. As duas correções e as três recomendações novas conferem.

1. **Arquivo renomeado.** Só `apps/api/src/sessao/acesso-da-escola.service.ts:3` e `apps/api/test/acesso-da-escola.int.test.ts:6` importam `acesso-publico.repository.js`. Nenhum `.ts` fora de `dist` cita mais `acesso-da-escola.repository`. A troca só evita um falso positivo da varredura em `apps/api/src/ops/escola.repository.test.ts:61`. Nenhuma regra perdeu teste, porque o conteúdo e a classe são os mesmos.
2. **`matriculaRara()` no teste do bloqueio** (`apps/api/test/sessao-matricula.int.test.ts:255`). O conserto é certo: todo slug inexistente conta na mesma "escola desconhecida", então o que precisa variar entre execuções é a matrícula. As outras três sequências usam escola nova a cada execução, e por isso `1234`, `5678` e `9999` fixas não trazem contador de uma execução anterior. A asserção continua forte. Se o slug inexistente ou a conta desativada tivessem outro caminho, o status e o corpo mudariam em algum ponto das seis tentativas.
3. **Chromebook do carrinho** (linhas 349 a 366). O teste falharia sem a regra. Se o cookie da 1234 tornasse a 5678 "conhecida", os erros das linhas 360 e 361 cairiam no contador `conhecido`, e a linha 362 (sem cookie, contador `outro`) daria 200 em vez de 429. Isso bate com a chave de `matricula.service.ts:103-104`, que usa o identificador de escola mais matrícula. A linha 364 mostra que o aluno das 8h segue entrando no próprio usuário.
4. **Inatividade com 17 e 20 min** (linhas 427 a 435). Agora o limite fica provado dos dois lados: com 17 min passa, dentro da tolerância, e com 20 min vence. O `semUsoHa(20)` regrava `ultimo_uso_em`, então a leitura aos 17 min não mascara o vencimento.
5. **Chaves exatas do `/v1/eu`** (linhas 164 e 165). O teste falha se algum campo da credencial, como a matrícula, entrar no DTO de saída.

Não há `.skip`, teste comentado nem mock escondendo a regra. O espião em `HashDeSenha.verificar` só conta chamadas e não troca o comportamento. Nenhum teste chama provedor de IA.

Bloqueantes: nenhum.

Recomendações:
- `apps/api/dist/sessao/acesso-da-escola.repository.js` e o `.map` ainda têm o nome antigo. Não afeta teste nem varredura (`dist` fica de fora), mas vale limpar o build para ninguém se confundir com o nome.
- Linha 365: `expect(dasNove).not.toBe(dasOito)` é quase decorativo, porque `alunosComMatricula` sempre cria dois usuários. Ficaria mais forte provar que a 5678, com a senha certa, entra no próprio usuário `dasNove` depois que o bloqueio vence, ou numa escola separada.
- Continua valendo da 1ª rodada, para o `/validar`: o arquivo renomeado (`acesso-publico.repository.ts`) não bate mais com o nome da classe (`AcessoDaEscolaRepository`). Se renomear a classe também, a organização fica igual à dos outros repositories.

Não rodei nenhum teste, como você pediu. A auditoria foi só pela leitura do código.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 12:17:21 · `tasks/prd-identidade-e-tenancy/11_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** `credencial_matricula` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0011_credencial_matricula.sql`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/credencial-matricula.ts`)
- Tem `escola_id NOT NULL` e id UUID (`uuidv7()`).
- A matrícula é única dentro da escola: `unique (escola_id, matricula)`. Esse é também o índice que a leitura do login usa, e ele começa pelo escopo.
- Uma FK composta `(escola_id, usuario_id)` aponta para `usuario (escola_id, id)`, então a credencial nunca aponta para aluno de outra escola.
- A tabela não tem `anoLetivoId`, e está certo: a credencial acompanha o aluno de um ano para o outro.

**Queries verificadas:**
- `CredencialMatriculaRepository.doAlunoAtivo` e `criar`: a escola vem de `exigirEscolaDoContexto()`. O join com `usuario` também exige a mesma escola e filtra `papel = 'aluno'` e aluno não desativado.
- `AcessoDaEscolaRepository.nome` (`acesso-publico.repository.ts`): a escola vem do contexto.
- `RegistroDeAcessoRepository.gravarFalha`: grava na escola do contexto, sem usuário.
- `ConclusaoDeLogin.#criarSessao` com `metodo = 'matricula'`: grava num contexto que tem só a escola, e a FK composta recusa usuário de outra escola.
- `ResolucaoDeTenantRepository.escolaPorSlug`: já existia desde a 7.0 e não mudou. É a resolução prevista antes do login.
- Corpo do `POST /v1/sessao/matricula`: o esquema é estrito, e `escolaId` no corpo é recusado com 400 (há teste). A escola vem só do slug, resolvido no servidor, e é aberta por `naEscolaSemUsuario`.
- Nenhum `@SemEscopo()` novo.
- A camada rede não é tocada.

**Teste de isolamento:** presente e efetivo. Conferi mentalmente o que quebra sem cada cláusula:
- **Sem a escola no `where` de `doAlunoAtivo`:**
  - `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/credencial-matricula.repository.int.test.ts:25` quebra: com o contexto de A, ele passaria a achar a matrícula que só existe em B.
  - `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-matricula.int.test.ts:181-182` também quebra. A senha de uma escola passaria a entrar no slug da outra, ou a FK composta devolveria 500 no lugar de 401.
- **Sem a escola na chave do contador:** `sessao-matricula.int.test.ts:200` quebra, porque a matrícula 1234 de B ficaria segurada junto com a de A.
- **Sem a escola no `nome()` do `/acesso`:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-escola.int.test.ts:123` quebra, porque uma escola que não existe no contexto passaria a devolver o nome de alguma escola.

**Existência não é revelada:**
- Slug inexistente, slug fora do formato, matrícula inexistente, aluno desativado e senha errada recebem a mesma resposta, com um hash cada e o mesmo ponto de bloqueio. Os testes das linhas 209 e 247 cobrem isso.
- O registro de acesso da falha não leva usuário.
- A sessão de aluno em `/v1/turmas/:id` e `/v1/turmas/:id/alunos` responde 404, igual ao id que não existe.

**Bloqueantes:** nenhum

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessoes-sinteticas.ts:354`: o seed `criarAlunosComMatricula` recebe `escolaId` por parâmetro. Hoje isso é aceitável, porque só roda com `AMBIENTE=local` e abre o próprio contexto. Quando o F2 criar credencial pela reivindicação, isso deve passar pelo contexto do token, nunca por esse caminho.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts:162`: todos os slugs inexistentes usam o mesmo contador, o da `ESCOLA_DESCONHECIDA`. Não vaza dado. Vale registrar na 15.0 que esse contador pode ser disputado por terceiros com a mesma matrícula, mas o efeito é só sobre respostas que já são de recusa.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 12:17:42 · `tasks/prd-identidade-e-tenancy/11_task.md`

VEREDITO: APROVADO

A tarefa 11.0 não tem nenhum bloqueante de privacidade. Li o código e os testes sem rodar nada, como você pediu.

**Campos pessoais tocados:** matrícula do aluno, hash argon2id da senha, contador de tentativas (HMAC de `escola_id|matricula`), entrada do cookie `educa_dispositivo` (HMAC de `escola_id|matricula`) e `registro_acesso` (IP e hora, e a falha gravada sem usuário). A sessão tem `metodo = matricula` e `conta_id` nulo.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. Matrícula, hash, contador, cookie de dispositivo, sessão e registro de acesso já estão no mapa, com finalidade e retenção. O aluno continua sem e-mail, telefone, CPF, foto, endereço ou nascimento. O seed cria o aluno com `contaId: null` e nome sintético.

**Autorização por objeto:** ok.
- **Escola vem do slug:** a credencial é lida por `CredencialMatriculaRepository.doAlunoAtivo`, com a escola do contexto aberto a partir do slug (`exigirEscolaDoContexto()`), nunca do corpo. O contrato é `.strict()` e recusa `escolaId` no pedido, com teste.
- **Só aluno ativo:** a leitura exige papel aluno e usuário não desativado.
- **Credencial presa à escola:** a FK composta `(escola_id, usuario_id)` impede credencial apontando para usuário de outra escola.
- **Troca de id:** a senha de A no slug de B é recusada, e 5 erros na 1234 de A não seguram a 1234 de B. Os dois testes usam linha real na escola B.
- **Respostas iguais:** slug inexistente, slug fora do formato, matrícula inexistente, aluno desativado e senha errada dão o mesmo status e o mesmo corpo. Cada caso roda o hash uma vez, e o bloqueio chega na mesma quinta tentativa, também para a "escola desconhecida".
- **`/acesso`:** o 404 para slug inexistente é aceitável, porque o slug é o endereço público da escola.
- **Sessão de aluno:** recebe 404 em `GET /v1/turmas/:id/alunos`, igual ao inexistente.

**Logs:** limpos.
- Os logs novos não trazem matrícula nem slug.
- O Redis vê só o HMAC com `LOGIN_CHAVE_CONTADOR`, e o cookie só o HMAC com a chave versionada de dispositivo.
- O redact do logger cobre `matricula` e `senha`.
- Não existe log de acesso HTTP com a URL.
- Um teste procura no log as matrículas raras e os slugs digitados, nas duas rotas.

**Auditoria:** presente onde a regra 20 exige. O login não está entre as ações do item 10, e o `registro_acesso` do Marco Civil é gravado no acerto e na falha. A falha fica sem usuário, para a linha não dizer se a matrícula existe.

**DTO e erro:**
- `/acesso` passa por esquema estrito só com `{ nome, provedores }` e nunca devolve domínio (`hd`) nem tenant (`tid`).
- O login devolve só `{ etapa, token, expiraEm }`, validado por esquema.
- O hash da senha nunca sai do service.
- Os erros são tipados (`NAO_AUTENTICADO`, `CONTA_SEGURADA` com tempo de espera, `ENTRADA_INVALIDA`, `NAO_ENCONTRADO`).

**Envio externo:** nenhum. A tarefa não usa IA, storage, exportação nem convite.

**Seed/fixture:** sintético. A escola é "Colégio Sintético", e as senhas e matrículas são fictícias. `criarAlunosComMatricula` só roda com `AMBIENTE=local`.

**Ciclo de vida:**
- A credencial sai com o usuário (`on delete cascade`), então a eliminação do titular alcança a matrícula e o hash.
- Aluno desativado é recusado com a resposta da senha errada. Apagar o hash na desativação fica para a 17.0, como a tarefa declara.

**Pergunta de fechamento:** para o que esta tarefa guarda, sim. A credencial é da escola, presa ao usuário, e nada é enviado para fora. O `registro_acesso` de falha fica sem usuário, então não entra no que se diz sobre um aluno específico.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Quando a exportação de direitos do titular for implementada, ela precisa incluir `credencial_matricula` (a matrícula, nunca o hash) e as linhas de `registro_acesso` e `sessao` com `metodo = matricula`. Hoje nada impede de esquecer a tabela nova. Vale registrar isso no `/retro`.
2. O teste de log em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-matricula.int.test.ts:472` depende de rodar depois dos outros do mesmo arquivo ("depois de tudo acima"). Isolado, ele só confere `http.erro`. Seria mais forte se provocasse sozinho a falha e o acerto que quer inspecionar.
3. A retenção de 6 meses de `registro_acesso` ainda não tem rotina de expurgo. Isso já existia antes desta tarefa, mas a 11.0 aumenta o volume com as falhas por matrícula, então vale acompanhar no roadmap.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/credencial-matricula.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/acesso-da-escola.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/registro-de-acesso.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0011_credencial_matricula.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/matricula.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/acesso-da-escola.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-matricula.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/acesso-da-escola.int.test.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 12:17:45 · `tasks/prd-identidade-e-tenancy/11_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login, migration
Rate limit: ok
Fila e prioridade: ok (a tarefa não toca fila; o argon2 fica no request por desenho, e o semáforo do hash é da 14.0)
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

**Por que cada item passou:**
- **Rate limit:** a tentativa de login é segurada pela chave `HMAC(escola_id|matricula)` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts`. O contador é reservado antes do hash, pelo script Lua atômico do contador da 4.0. O limite por IP da rota anônima tem teto de 3000/min, que cabe uma escola inteira atrás de um NAT. O teste com Enzo e mais 399 colegas atrás do mesmo IP prova que só a conta dele fica segurada.
- **Concorrência:** o teste de 10 senhas erradas em paralelo com `Promise.all` confere que o argon2 roda no máximo 5 vezes. A tabela tem `unique (escola_id, matricula)` e `unique (escola_id, usuario_id)`.
- **Índice:** a leitura da credencial usa o unique `(escola_id, matricula)`. O join com `usuario` usa a chave `(escola_id, id)`, e `escola.slug` já tem unique. Não há listagem nova.
- **Migration:** `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0011_credencial_matricula.sql` cria uma tabela nova e vazia, sem `ALTER` em tabela com dado.
- **Métrica:** a latência e o erro das duas rotas entram no `http.server.request.duration` por rota, e `login.conta_segurada` também conta a matrícula, com teste. Não há alerta novo. Deixar `login.falhas{escola_id}` para a 15.3 está justificado nas notas da tarefa.
- **Estado em memória:** não há estado novo em memória. O seguro em memória do contador, usado só com o Redis fora, já vinha da 4.0.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts:67`: toda falha com escola conhecida grava uma linha em `registro_acesso`. Quem trocar a matrícula a cada tentativa grava até 3000 linhas por minuto por IP. O login por e-mail já tem esse padrão. Vale medir isso no cenário `login-7h30` da 16.0 e avaliar se o rebaixamento IP×escola da 15.0 cobre o caso.
- `GET /v1/escolas/:slug/acesso` é chamado por toda a escola às 7h30 e faz duas consultas por requisição. Um cache curto no Redis de cache, por slug, alivia o banco na rajada. Não é urgente para dez escolas.
- Todo slug inexistente conta na mesma "escola desconhecida", então o mesmo slug errado com a mesma matrícula divide um contador. O efeito é inofensivo, mas convém uma linha no runbook para quem investigar `CONTA_SEGURADA` de slug digitado errado.
- O cenário de carga `login-7h30` com matrícula ainda não existe. Ele é da 16.0, e esta tarefa não pode ser dada como pronta para produção sem ele.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 12:17:47 · `tasks/prd-identidade-e-tenancy/11_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, test, infra)
Bloqueantes: nenhum

Recomendações:
1. **Duas leituras suas da tarefa pedem ratificação do Joaquim.** A implementação está certa nas duas, mas cada uma diverge do texto e hoje está registrada só nas "Notas da implementação":
   - **`login.falhas{escola_id}` foi adiada para a 15.3.** A 11.2 pede essa métrica, mas a 15.3 é quem a cria (`/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/15_task.md:59`), então o adiamento se sustenta.
   - **Slug inexistente não grava `registro_acesso`.** A seção 5 da Tech Spec diz "login, falha, renovação e saída gravam `registro_acesso`", e a seção 6 só admite escola nula na falha por e-mail. As duas regras não cabem juntas nesse caso. Vale uma linha na seção 5 da Tech Spec dizendo que a falha com slug inexistente não gera registro.
2. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/escola-sem-usuario.ts` é um segundo jeito de fazer o que o módulo já faz.** O `convite.service.ts` abre o contexto de escola sem usuário direto com `executarNoContexto({ requisicaoId, escolaId })`. Ou se usa o helper novo nos dois lugares, ou nenhum.
3. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/acesso-publico.repository.ts:11` repete a leitura do nome da escola.** O `ConviteRepository.nomeDaEscola()` (`convite.repository.ts:19`) já faz exatamente essa consulta com escopo. Além disso, o nome do arquivo não bate com o da classe (`AcessoDaEscolaRepository`).
4. **`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/matricula.service.ts:91-98` duplica lógica.** O `#recusar` repete a sequência reservar, conferir `liberada`, `esperaSeFalharMs` e `#segurada` do caminho principal. Dá para extrair a parte comum e deixar os dois caminhos iguais por construção, não por cópia.
5. **Comentário desatualizado em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/telemetria/metricas.ts:38`.** Ele diz que `login.conta_segurada` não tem rótulo porque "a conta é global". Agora a métrica conta também a matrícula, que é por escola.
6. **Build velho em `apps/api/dist/sessao/`.** Sobrou o `acesso-da-escola.repository.js` com o nome antigo; vale limpar.
7. **O teste de log depende da ordem.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/sessao-matricula.int.test.ts:472`, ele só vale se rodar depois dos outros do mesmo `describe`. Com a execução sequencial padrão funciona, mas quebra em silêncio se alguém ligar `sequence.shuffle`. Um `afterAll` com essa asserção não depende da ordem.
