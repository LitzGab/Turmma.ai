# Achados das revisões — `tasks/prd-identidade-e-tenancy/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 02:20:15 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: REPROVADO

Cenários exigidos:
- **Caminho feliz:** o professor recebe `pronta`, o token e `educa_sessao`. O `/v1/eu` devolve o contrato e o `registro_acesso` grava `login`.
- **Privacidade (RF6):** senha errada, e-mail que não existe, conta sem senha e usuário desativado dão status e corpo iguais, com um argon2 cada. Isso vale também para o bloqueio: a conta segurada não pode revelar se o e-mail existe.
- **Recuo:** 5 falhas dão 30 s, a sexta dá 60 s com relógio simulado, a espera para em 15 min e o acerto zera.
- **Concorrência:** 10 senhas erradas em `Promise.all` avaliam no máximo 5 hashes.
- **Outro navegador:** o script sem cookie segura só o contador `outro`, e o `educa_dispositivo` válido continua entrando. Cookie com chave antiga ou forjado não conta.
- **35 logins do mesmo IP:** um é segurado e os outros 34 entram (regra 80, item 1).
- **Etapas:** `escolher`, `configurar_mfa` e `mfa` não gravam sessão nem `educa_sessao`.
- **Permissão:** o desafio usado como Bearer é recusado, e o token de acesso usado como desafio também. Usuário com papel `aluno` numa conta não entra por e-mail.
- **Banco:** `login_falho` grava com escola nula, e `login` sem escola é recusado.
- **Redis de fila fora:** o seguro em memória segura a conta e `limite.seguro_ativo` fica em 1.
- **Log:** redact sem e-mail, senha, cookie ou desafio.
- **Isolamento:** o `/v1/eu` e o registro de acesso usam a escola do contexto.
- **Configuração:** o argon2 não sobe abaixo da OWASP.

Cobertos:
- Todos os cenários da tabela do `4_task.md` estão cobertos, com asserção sobre o resultado.
- A concorrência é de verdade, com `Promise.all`, no HTTP (`login-email.int.test.ts:223`) e no script Lua (`contador-de-tentativas.int.test.ts:71`). O consumo do desafio também é testado em paralelo (`desafio.int.test.ts:31`).
- A queda do Redis é real (`compose stop redis-fila`).
- O recuo é testado com relógio simulado na unidade e na integração.
- O Chromebook do carrinho (50 entradas) e a troca de versão da chave têm teste.
- O isolamento do `EuRepository` e do `RegistroDeAcessoRepository` falharia sem a cláusula de escola.
- Nenhum teste chama provedor pago.
- Não há `.skip`, `.only` nem `any` nos testes. O espião no argon2 conta as chamadas sem trocar o hash real.

Bloqueantes:
1. **`apps/api/test/login-email.int.test.ts:170-202`: o bloqueio pode revelar se o e-mail existe, e nenhum teste impede isso.**
   - **O que falta:** o teste de privacidade faz uma tentativa só por caminho. Nenhum teste prova que o e-mail inexistente e a conta sem usuário ativo também chegam a `CONTA_SEGURADA` na quinta falha.
   - **Por que importa:** hoje isso vale só porque `login.service.ts:89` reserva a tentativa antes de `contaPorEmail`. Se alguém passar a reserva para depois da consulta, ou pular a contagem quando `credencial === undefined`, a suíte continua verde. Aí quem tenta descobre quais e-mails de professor existem: uma conta real segura com 429 e um e-mail inventado responde 401 para sempre. Isso fere o RF6 e a regra 20, item 6.
   - **Correção exigida:** um teste de integração com cinco senhas erradas para um e-mail inexistente e para uma conta com usuário desativado. As duas devem dar 429 `CONTA_SEGURADA` com o mesmo `Retry-After` e o mesmo corpo, fora o `requisicaoId`, de uma conta que existe.
2. **`apps/api/src/sessao/login.service.ts:94`: o filtro `ativo.papel !== 'aluno'` não tem teste.**
   - **O que falta:** o banco aceita usuário `aluno` com `conta_id` preenchido. O check `usuario_conta_so_falta_para_aluno` só exige conta para quem não é aluno. Por isso o filtro é a única coisa que impede um aluno de entrar por e-mail e senha (regra 20, item 2; o aluno entra por matrícula). Apagar o filtro não deixa nenhum teste vermelho.
   - **Correção exigida:** um teste de integração com dois casos:
     - conta com senha e só um usuário `aluno` ativo, com a senha certa: 401 `NAO_AUTENTICADO` igual aos outros, sem sessão, sem `educa_dispositivo` e com `login_falho` de escola nula;
     - conta com um `professor` e um `aluno` ativos: `pronta` na escola do professor, e não `escolher`.

Recomendações:
- **Teste de log sem dente (`login-email.int.test.ts:351`).** Hoje nada no caminho do login escreve cabeçalho ou corpo no log: o `http.erro` leva só status, código e erro. Por isso o teste passaria mesmo sem o redact novo. Quem prova o redact é `logger.test.ts`. Vale dizer isso no nome do teste, ou forçar uma linha com `cookie`, `set-cookie` e `desafio` no caminho do login.
- **Ligação do `main.ts` não testada.** O teste do Redis fora chama `observarSeguroDoLimite(..., ContadorDeTentativas)` à mão (`login-email.int.test.ts:328`). Se o `main.ts` deixar de passar o contador, nada fica vermelho.
- **Conta ativa em A e desativada em B.** Isso deve dar `pronta` em A, e só está provado no repository, não no login ponta a ponta.
- **Mensagem de `CONTA_SEGURADA`.** A tarefa pede que a mensagem diga quanto esperar. O texto é fixo ("de 30 segundos a 15 minutos, como indicado") e o tempo exato vai só no `Retry-After`. Confirme se a tela da 18.0 vai mostrar esse número.
- **Tentativa segurada fica fora do `registro_acesso`.** A tentativa que recebe 429 não grava `login_falho`. Se isso for intencional, registre a escolha nas "Notas da implementação".

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookie-dispositivo.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookie-dispositivo.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookies.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookies.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/hash-de-senha.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/hash-de-senha.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/eu.repository.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/log/logger.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/usuario.ts

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 02:43:16 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

**Cenários exigidos (nesta rodada, as duas correções da 1ª):**
1. O bloqueio também não pode revelar a conta. Com cinco senhas erradas, um e-mail que não existe e uma conta com usuário desativado precisam chegar a 429 CONTA_SEGURADA, com o mesmo Retry-After e o mesmo corpo (fora o requisicaoId) de uma conta que existe.
2. O filtro `ativo.papel !== 'aluno'` em `apps/api/src/sessao/login.service.ts:94` precisa de teste:
   - conta só com aluno e a senha certa deve dar 401 NAO_AUTENTICADO, sem sessão, sem cookie `educa_dispositivo` e com um `login_falho` de escola nula;
   - conta com professor e aluno ativos deve entrar como professor (`pronta`), e não cair em `escolher`.

**Cobertos:**
- **Correção 1**, em `apps/api/test/login-email.int.test.ts:215-239`:
  - O teste manda seis senhas erradas para cada um dos três (conta existente, desativado, inexistente). Cada conta recebe as suas seis em sequência, e as três contas rodam em paralelo. Isso é válido, porque o contador é por e-mail.
  - Na conta que existe, confere quatro respostas 401 e duas 429 de 30 s.
  - Nas outras duas, compara com a conta que existe o status, o corpo sem requisicaoId e o Retry-After de cada resposta.
  - O teste ficaria vermelho se o e-mail que não existe ou o usuário desativado deixassem de contar no contador: a 5ª resposta seria 401, não 429.
- **Correção 2**, em `apps/api/test/login-email.int.test.ts:241-266`:
  - Na conta só com aluno, `esperarNaoAutenticado` confere o 401, o corpo e que nenhum cookie é enviado (`setCookie` vazio, logo sem `educa_dispositivo`). Também confere um hash, `login_falho` sem escola +1 e nenhuma sessão.
  - Sem o filtro, esse aluno entraria com etapa `pronta` e status 200, e o teste falharia.
  - Na conta com professor em A, aluno em B e professor desativado em B, o teste exige etapa `pronta` e uma única sessão, na escola A e no usuário professor. Sem o filtro, a conta teria dois usuários e cairia em `escolher`, e o teste falharia. Se o desativado passasse a contar, também falharia.
  - O relato de que a mutação do filtro deixou o teste vermelho bate com essa leitura.
- **Recomendações da 1ª rodada:** as duas foram feitas. O teste do log agora aponta para `logger.test.ts`, e a nota sobre o 429 que não grava `login_falho` entrou em `tasks/prd-identidade-e-tenancy/4_task.md`.
- Não há `.skip`, `.only` nem teste comentado. Nenhum mock esconde a regra: o espião em `HashDeSenha.verificar` só conta chamadas e não muda o resultado.

Não rodei nenhum teste, porque o portão estava usando o compose `educa-teste`. A auditoria foi feita só lendo o arquivo de teste, o `login.service.ts` e o diff do `4_task.md`.

**Bloqueantes:** nenhum.

**Recomendações:**
- `apps/api/test/login-email.int.test.ts:237`: o Retry-After é comparado com igualdade exata entre três sequências em paralelo. A 6ª resposta usa a espera que ainda falta, arredondada para cima. Se a máquina estiver muito carregada e passar mais de 1 s entre a 5ª e a 6ª, uma sequência pode dar 29 e a outra 30. É pouco provável. Se o teste oscilar um dia, basta comparar com a mesma folga de `esperarSegurada`.
- `apps/api/test/login-email.int.test.ts:135-138`: `falhasSemEscola` conta em todo o banco. Se outro arquivo de integração gravar `login_falho` sem escola em paralelo, os +1 e +4 oscilam. O risco já existia na 1ª rodada. Filtrar pelo intervalo de tempo do teste deixaria a conta estável.
- Linha 265, `expect(desativadoEmB).toHaveLength(1)`: só confirma que o insert funcionou e não prova regra. Pode sair, ou virar uma verificação de que o desativado ficou sem sessão.
- O cenário "usuário desativado com a senha certa chega a CONTA_SEGURADA" não está coberto no teste do bloqueio (ele usa senha errada). O caminho é o mesmo do código, então é cobertura extra, não uma falta.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 02:53:54 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova e nenhuma migration nova. Conferi `registro_acesso` (migration 0005). O check `registro_acesso_escola_so_falta_na_falha_sem_usuario` só deixa a escola nula em `login_falho` sem usuário, que é o que a seção 6 da Tech Spec pede. O índice `(escola_id, em)` já existia.

Queries verificadas:
- `ResolucaoDeTenantRepository.contaPorEmail` (linha 75) e `gravarFalhaDeLoginPorEmail` (linha 85). As duas têm `@SemEscopo` com justificativa escrita e estão na tabela da seção 6 da Tech Spec. A primeira devolve só id, hash e se o MFA está ativo, nunca o e-mail. A segunda grava escola e usuário nulos.
- `EuRepository.doContexto`: a escola e o usuário vêm de `identidadeDaRequisicao()`, e o método não recebe id nenhum.
- `RegistroDeAcessoRepository.gravar`: a escola vem de `contextoAtual()`, e sem escola no contexto ele falha fechado.
- `LoginService.#criarSessao` (`login.service.ts:129`): monta o contexto com a `escolaId` da linha de `usuariosAtivosDaConta`, lida do banco, nunca do cliente. A FK composta da `sessao` recusa usuário de outra escola.
- `esquemaPedidoLoginEmail` é `.strict()`, então um corpo com `escolaId` é recusado. Isso tem teste em `login-email.int.test.ts:363`.
- A etapa `escolher` devolve só o desafio, sem listar escolas.
- A rede está como `nunca` em `eu/ler` na matriz.

Teste de isolamento: presente e efetivo.
- `eu.repository.int.test.ts:15`: sem `eq(usuario.escolaId, escolaId)`, o usuário de A no contexto de B seria achado pelo join, e `naOutra` deixaria de ser `undefined`. O teste quebra.
- `eu.repository.int.test.ts:25`: prova que o registro de acesso grava na escola do contexto e falha sem ela.
- `resolucao-de-tenant.repository.test.ts`: trava a lista dos métodos sem escopo e prova que `EuRepository` e `RegistroDeAcessoRepository` não têm `@SemEscopo`.
- `login-email.int.test.ts:241`: prova que o usuário desativado em outra escola não conta e que a sessão nasce só na escola A.
- `login-email.int.test.ts:170`: senha errada, e-mail inexistente, conta sem senha e usuário desativado dão o mesmo status e o mesmo corpo.

Bloqueantes: nenhum.

Recomendações:
1. `apps/api/src/sessao/registro-de-acesso.repository.ts:13`: `gravar` recebe o `usuarioId` como argumento, e `registro_acesso.usuario_id` não tem FK composta com `escola_id` (não tem FK nenhuma). Hoje não há risco: no login, o par escola e usuário sai da mesma linha do banco, e a `sessao` gravada antes, na mesma transação, confere o par. Quando a 5.0 e a 12.0 usarem este método em outros caminhos, vale conferir o par ou documentar por que não há FK.
2. `apps/api/src/sessao/resolucao-de-tenant.repository.ts`: a classe chega a seis métodos com `@SemEscopo`. É o desvio já declarado da regra 10, item 9, contido pelo teste de arquitetura e previsto na Tech Spec, que fala em dezesseis. Vale registrar no `/retro` se o número passar do que a seção 6 prevê.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/registro-de-acesso.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/eu.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/eu.repository.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts`

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 02:54:07 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

Auditei lendo o código e os testes, sem rodar nada, porque o portão local estava ocupando o compose `educa-teste`.

**Campos pessoais tocados:**
- e-mail da conta global (consulta `citext`; nunca é gravado fora de `conta`)
- hash de senha argon2id
- `usuario.nome`, que só aparece no `GET /v1/eu`, para a própria pessoa
- sessão (hash SHA-256 do refresh, método, conta)
- contador de tentativas (HMAC do e-mail, no Redis de fila, por 15 min)
- cookie `educa_dispositivo` (HMACs de 128 bits com data, sem nome nem e-mail)
- `registro_acesso` (evento, usuário, IP, hora; `login_falho` sem escola e sem usuário)

**Fora da tabela de dados do docs/lgpd.md:** nenhum. Hash, e-mail global, sessão, contador e cookie de dispositivo estão nas linhas 51 a 56; registro de acesso na 61; nome e e-mail da equipe na 47. A retenção de 15 min do contador coincide com o `PEXPIRE` de `max(15 min, espera)`. Aluno fica fora do login por e-mail: `login.service.ts` filtra `papel !== 'aluno'`, e há teste de integração para isso.

**Autorização por objeto:** ok.
- `GET /v1/eu` não recebe id. O `EuRepository` lê escola e usuário do contexto, e o teste de isolamento de `eu.repository.int.test.ts` mostra que o usuário de A, no contexto de B, não é encontrado.
- O login responde igual (401 `NAO_AUTENTICADO`, mesmo corpo, sem cookie) para senha errada, e-mail que não existe, conta sem senha e usuário desativado. Nos quatro casos roda um hash (hash fixo gerado no boot), e os quatro contam no contador. Por isso nem o bloqueio (`CONTA_SEGURADA` na quinta falha) revela se a conta existe. Os testes das linhas 170 e 215 de `login-email.int.test.ts` provam isso.
- O desafio e o token de acesso não servem um no lugar do outro, separados por `typ` e `aud`, com teste.
- Os dois `@SemEscopo` novos (`contaPorEmail`, `gravarFalhaDeLoginPorEmail`) têm justificativa e devolvem só id, hash e se o MFA está ativo.

**Logs:** limpos.
- Os eventos novos (`login.contador_no_seguro`, `login.redis_indisponivel`) não levam dado.
- O redact passou a cobrir `set-cookie`, `cookie` em qualquer nível e todas as chaves da seção 7 da Tech Spec (inclusive `desafio`, `refresh`, `token`, `dispositivo`), com teste que compara a lista escrita à mão.
- O teste de integração da linha 404 junta todo e-mail, senha, cookie, token e desafio vistos (mais de 40 valores) e confere que nenhum aparece no log em nível `trace`.
- O erro para o cliente é curto e tipado, e o `Retry-After` vem do filtro global.

**Auditoria:** presente onde a regra exige. Nenhuma ação nova desta tarefa exige auditoria. O login fica no `registro_acesso` (Marco Civil), gravado na escola do contexto, e a falha fica com escola nula, com check no banco que recusa `login` sem escola.

**Envio externo:** nenhum. Não há IA nem terceiro. O Redis de fila é nosso e só recebe o HMAC do e-mail e o `jti` do desafio.

**Seed/fixture:** sintético. Os e-mails de teste são `Equipe-<uuid>@Escola.invalid`, o nome é "Pessoa sintética", e as chaves do `.env.example` estão marcadas como públicas e sintéticas.

**Pergunta de fechamento:** para um aluno, esta tarefa não grava nada novo. Para um professor, o que ela grava está ligado ao `usuarioId` (sessão e `registro_acesso`) ou é efêmero e sem identidade (contador por 15 min, cookie só no navegador). Não há envio externo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/api/src/sessao/login.service.ts:95`: com a senha certa e sem usuário ativo, o login ainda faz a consulta `usuariosAtivosDaConta` antes de responder 401. A diferença de tempo é pequena e só aparece para quem já tem a senha, então não bloqueia. Vale registrar para a 16.0, quando o tempo do hash for calibrado.
2. `packages/shared/src/erros/mensagens.ts`: a mensagem de `CONTA_SEGURADA` diz "de 30 segundos a 15 minutos, como indicado". A subtarefa 4.2 pede que ela diga quanto esperar, e hoje o tempo exato só vai no `Retry-After`. A tela da 18.0 deveria mostrar esse valor.
3. As linhas de `login_falho` com escola nula não têm escola para aplicar retenção configurável. O expurgo de 6 meses delas precisa entrar explicitamente na 17.2 (`sistema.expurgar-acesso`), com um teste que cubra a linha sem escola.
4. Cada falha que chega ao hash grava uma linha no Postgres. A tentativa segurada não grava, o que é certo. Mas com milhares de e-mails distintos em rodízio (sem contador segurado), o volume de `registro_acesso` cresce na mesma proporção. Isso é assunto do `infra-guardian` e da 15.0, não de privacidade.

Arquivos principais auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/cookie-dispositivo.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/eu.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/log/logger.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 02:54:32 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login | migration (não; nenhuma migration nesta tarefa)
Rate limit: ok
Fila e prioridade: ok (nada vai para fila; só o argon2 fica no request, e é trabalho que precisa ficar ali)
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

Não rodei testes nem mexi em container, porque o portão está em andamento no `educa-teste`. A auditoria foi só pela leitura do código e dos testes.

**Por que cada item passou**
- **Rate limit:** a rota é anônima e só tem o limite por IP, que foi pensado para uma escola inteira atrás de um mesmo IP (3000/min). Quem segura senha errada é o contador por conta, guardado pelo HMAC do e-mail e separado em `conhecido` e `outro`. O teste com 35 professores do mesmo IP (`login-email.int.test.ts:304`) prova que ninguém é barrado pelo IP.
- **Concorrência:**
  - O contador é um script Lua atômico, e a tentativa é contada antes do hash.
  - Dez senhas erradas ao mesmo tempo avaliam exatamente cinco hashes. Isso está provado na integração (`login-email.int.test.ts:276`) e direto no Redis (`contador-de-tentativas.int.test.ts:71`).
  - O desafio é consumido uma vez só, com `SET NX` (`desafio.int.test.ts:31`).
  - A sessão e o registro de acesso são gravados na mesma transação.
- **Redis fora ou travado:**
  - O cliente do login não guarda comando para depois (`enableOfflineQueue: false`) e desiste em 100 ms (`commandTimeout`).
  - Nesse caso, o contador em memória aplica a mesma regra, e a métrica `limite.seguro_ativo` passa a valer o maior entre o rate limit e o contador.
  - O runbook ganhou o passo 4 no alerta que já existia.
  - O teste de queda está em `login-email.int.test.ts:371`.
- **Índices:** as consultas usam `conta_email_unico` e `usuario_conta_idx`, e não há listagem.
- **Métrica:** a latência e o erro vêm do `http.server.request.duration`, que já mede por rota. `login.conta_segurada` foi para o painel e para `NOMES_NO_PROMETHEUS`. Nenhum alerta novo foi criado, então não falta runbook.
- **Teste de carga:** o cenário "login às 7h30" já está planejado para a tarefa 16.0. Nenhum teste chama provedor pago.

Recomendações:
- `apps/api/src/sessao/contador-de-tentativas.ts:86` e `:94-96`: com o Redis fora e um ataque espalhado por muitos e-mails, o mapa em memória passa de 10 mil entradas ainda válidas. A partir daí, toda tentativa percorre o mapa inteiro, custo O(n). Vale varrer no máximo uma vez por intervalo de tempo, ou pôr um teto que descarte primeiro as entradas mais antigas.
- `apps/api/src/sessao/contador-de-tentativas.ts:140`: o `eval` manda o script inteiro a cada login. Registrar com `defineCommand` faz o ioredis usar `EVALSHA`, e o pedido fica menor na rajada das 7h30.
- `apps/api/src/sessao/contador-de-tentativas.ts:140-147`: se o Redis executar o script e a resposta passar dos 100 ms, a tentativa é contada no Redis e também em memória. O erro é para o lado seguro, mas vale uma linha de comentário dizendo isso.
- `apps/api/src/sessao/login.service.ts:93`: o argon2 roda no pool de threads do libuv, que por padrão tem 4 threads e é o mesmo usado pela resolução de DNS. Na tarefa 14.0 (semáforo do hash), ou nas instâncias separadas de login citadas em `docs/infra.md` 3.1, vale considerar `UV_THREADPOOL_SIZE` junto com o semáforo, para a rajada não atrasar reconexão de Postgres e Redis.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-18 02:54:36 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: há divergência em `educa_dispositivo`, que é gravado antes de o login terminar (seção 5, "Passagem", e subtarefa 4.3), e no contador sem `rate-limiter-flexible` (seção 5, "Tentativas").
Portão local: `apps/api/src/sessao/login.service.ts mudou em 2026-09-18 02:42:23, depois do início do último (2026-09-18 02:18:30). Rode node tools/processo/portao-local.ts --infra de novo.`

Bloqueantes:

1. **O cookie de dispositivo é gravado antes do MFA e antes da escolha de escola.**
   - **Onde:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:102-111`. O teste que fixa esse comportamento está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts:338`.
   - **O que está errado:** `educa_dispositivo` sai em qualquer etapa, inclusive `configurar_mfa`, `mfa` e `escolher`. A subtarefa 4.3 e a Tech Spec (seção 5, "Passagem") dizem "gravado só depois de login bem-sucedido". Para o coordenador, o login só termina depois do MFA.
   - **Por que isso pesa:** a nota da implementação diz que "quem tem a senha já passou pelo que o cookie protege". Não passou. Quem roubou a senha de um coordenador ganha a marca de navegador `conhecido` sem ter o segundo fator. Na 6.0, o `/v1/sessao/mfa` conta no mesmo contador. Então o atacante que erra o código cai no mesmo contador `conhecido` do coordenador de verdade e passa a travar a conta dele. É exatamente o que os dois contadores existem para evitar.
   - **Por que não basta estar nas notas:** a mudança contradiz um critério escrito da própria tarefa e enfraquece uma garantia de segurança. Estar registrada nas notas não torna a decisão aceita.
   - **Correção exigida:** gravar `educa_dispositivo` só em `pronta`, e deixar para as rotas que concluem a etapa (6.0 e 12.0) gravarem o cookie quando o login termina. Inverter a asserção da linha 338: nenhuma das três etapas com desafio devolve `educa_dispositivo`. Se quiserem manter o comportamento atual, parem e aprovem a mudança na Tech Spec antes, pelo processo, com a análise do contador do MFA.

2. **O portão local não tem carimbo válido para a árvore atual.**
   - **O que está errado:** `login.service.ts` mudou depois do início do último portão.
   - **Correção exigida:** deixar terminar o `node tools/processo/portao-local.ts --infra` que está rodando, ou rodar de novo depois da correção 1, e conferir com `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/4_task.md` antes do commit.

Recomendações:

- **Contador em script Lua em vez de `rate-limiter-flexible`.** A justificativa se sustenta: o recuo que dobra, montado com a biblioteca, faria "lê e depois grava". Mas a Tech Spec (seção 5, "Tentativas") continua citando a biblioteca, e a 6.0 vai ler que o MFA usa "o mesmo contador". Corrijam essa linha da Tech Spec para quem implementar o MFA encontrar o `ContadorDeTentativas`.
- **Mensagem de `CONTA_SEGURADA`** (`/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/erros/mensagens.ts`). Ela diz "de 30 segundos a 15 minutos, como indicado", e não quanto esperar de fato. Como a mensagem é fixa, deixem registrado no contrato que a tela da 18.0 mostra o tempo a partir do `Retry-After`.
- **Ligação do contador no `main.ts`** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/main.ts`). O `main.ts` passa o `ContadorDeTentativas` a `observarSeguroDoLimite`, e nenhum teste cobre isso: se a ligação sair, nada fica vermelho. O `test-engineer` já apontou.
- **Consulta a mais com a senha certa** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:94`). Numa conta com usuário desativado, a senha certa faz uma consulta que a errada não faz. O tempo da resposta só revela algo a quem já tem a senha, então não bloqueia. Vale um comentário para ninguém reaproveitar esse padrão em outro caminho.

## test-engineer · 3ª rodada · APROVADO · 2026-09-18 03:06:38 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

A correção exigida pelo revisor-geral está feita e tem teste que a prova. Não rodei nenhum teste, como você pediu: auditei lendo o código atual.

**Cenários exigidos (desta rodada):**
- `educa_dispositivo` só sai quando o login termina (`pronta`).
- Nenhuma das etapas com desafio (`escolher`, `configurar_mfa`, `mfa`) grava cookie.
- `pronta` continua gravando `educa_dispositivo` com os atributos certos, junto com `educa_sessao`.
- A varredura do seguro em memória roda no máximo uma vez a cada 60 s.

**Cobertos:**
- **Correção no serviço:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:105-110`, toda etapa diferente de `pronta` devolve `cookies: []`. O `educa_dispositivo` sai só em `pronta` (linhas 114-124), junto com `educa_sessao`. A doc da classe (linhas 73-75) diz o mesmo.
- **Teste das etapas invertido e efetivo:** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts:339`, a asserção agora é `expect(resposta.setCookie, etapa).toEqual([])`, e roda nas três etapas: conta com usuário nas escolas A e B, coordenador sem MFA e coordenador com MFA. Se o cookie voltasse a ser gravado em qualquer uma delas, o teste falharia. As linhas 343-346 continuam provando que nenhuma sessão nem registro de `login` foi gravado.
- **Caminho feliz:** o teste das linhas 142-151 exige o `educa_dispositivo` com `HttpOnly`, `Max-Age=2592000`, `Path=/v1/sessao` e `SameSite=Strict`. Se a mudança tivesse tirado o cookie também de `pronta`, o texto vazio não bateria com essa lista e o teste falharia. O teste da linha 286 (o script que erra a senha em outro navegador não segura a professora) continua usando o cookie de uma resposta `pronta`, então segue válido.
- **Comentário sobre a consulta a mais com a senha certa** (linhas 95-96): é só texto, a lógica não mudou. A resposta de senha errada, e-mail inexistente e conta sem usuário ativo continua igual, conferida por `esperarNaoAutenticado`, que exige `setCookie` vazio.
- **Varredura com intervalo mínimo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts:17,80,89,97-100`): `#ultimaVarredura` começa em `-Infinity`, então a primeira varredura acima de 10 mil entradas acontece na hora, e as seguintes esperam 60 s. Nenhuma regra de contagem ou de espera mudou, e os testes do seguro em memória (a partir da linha 35 de `contador-de-tentativas.test.ts`) continuam cobrindo essa regra.

**Bloqueantes:** nenhum.

**Recomendações:**
- A varredura do seguro em memória não tem teste, nem o gatilho de 10 mil entradas (que já existia na rodada aprovada) nem o novo intervalo de 60 s. Um teste de unidade com o relógio falso resolveria. Por exemplo: encher com mais de 10 mil chaves vencidas, provar que uma reserva as remove, e provar que uma segunda reserva antes de 60 s não varre de novo. Para observar isso sem expor o estado interno, dá para expor o tamanho do seguro ou contar as varreduras. Não bloqueia porque protege memória e CPU, não uma regra de negócio, mas fica para o `/retro`.
- A nota do `4_task.md` e a seção 5 do `techspec.md` são só texto e estão coerentes com o código. Não há o que exigir.

## revisor-geral · 2ª rodada · REPROVADO · 2026-09-18 03:16:49 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A seção 5 "Tentativas" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/techspec.md` agora registra o `ContadorDeTentativas` com o script Lua. Com isso a escolha deixou de ser silenciosa.
Portão local: `portão local: apps/api/test/login-email.int.test.ts mudou em 2026-09-18 03:05:16, depois do início do último (2026-09-18 02:42:31). Rode `node tools/processo/portao-local.ts --infra` de novo.`

Bloqueantes:
1. **Portão local sem carimbo para a árvore atual** (correção 2 da 1ª rodada). O carimbo que existe é da rodada iniciada às 02:42:31, antes da última mudança no teste. Há um `node tools/processo/portao-local.ts --infra` rodando desde as 03:05:42, depois dessa mudança (03:05:16), mas ele ainda não gravou carimbo. Correção exigida: deixar esse portão terminar verde e confirmar que `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/4_task.md` passa. Se ele terminar vermelho ou algum arquivo mudar de novo, rode `node tools/processo/portao-local.ts --infra` outra vez. Nenhum código precisa mudar para este ponto. Quando a conferência passar, basta uma rodada curta só para registrar o carimbo.

A correção 1 da rodada anterior foi feita:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:105-111`: as etapas com desafio devolvem `cookies: []`, e `educa_dispositivo` só sai em `pronta` (linhas 117-123).
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts:339`: exige `setCookie` vazio nas três etapas.

A varredura com intervalo mínimo em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts:80-98` está correta e não trouxe problema novo.

Recomendações: nenhuma nova. As mensagens de `CONTA_SEGURADA` e a ligação no `main.ts` continuam anotadas para a 18.0 e o `/validar`, como você registrou.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-18 03:17:00 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o diff desde a minha rodada aprovada. Não rodei testes nem mexi em container.

Campos pessoais tocados: nenhum campo novo. O diff mexe no `educa_dispositivo`, que já existia: o cookie guarda uma marca do e-mail, e a chave no Redis continua sendo o HMAC do e-mail. O contador segue com a mesma chave HMAC e a mesma retenção de 15 min que já está no `docs/lgpd.md`.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok. Nas etapas `escolher`, `configurar_mfa` e `mfa` agora não sai cookie nenhum nem é criada sessão (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:106-111`). O `educa_dispositivo` sai só em `pronta`, junto com o `educa_sessao` (`login.service.ts:115-124`). Isso fecha um risco: quem tinha só a senha do coordenador ganhava a marca de navegador conhecido sem o segundo fator, e com ela escapava do contador `outro`. As respostas de falha continuam iguais (`NAO_AUTENTICADO`) para senha errada, e-mail inexistente e conta sem usuário ativo. A consulta a mais só acontece depois do hash e só com a senha certa, e o comentário das linhas 95-96 explica por quê.

Logs: limpos. O único log novo ou tocado é `login.contador_no_seguro` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts:118`), sem identificador nenhum. A mudança da varredura (linhas 89 e 97-100) não traz dado novo.

Auditoria: presente. O login bem-sucedido grava `registro_acesso` na transação da sessão. As etapas sem sessão não gravam nada, e o teste confirma isso (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts:343-344`). Esta tarefa não tem leitura por coordenação ou rede, exportação nem alteração de nota.

Envio externo: nenhum.

Seed/fixture: sintético. O teste usa `'Pessoa sintética'` e e-mails gerados pela bancada.

Bloqueantes: nenhum.

Recomendações:
1. Como as etapas intermediárias não gravam mais o `educa_dispositivo`, quem o grava para `escolher` e para o MFA são as rotas das tarefas 6.0 e 12.0. Elas precisam de um teste que prove que o cookie sai só depois do segundo fator, ou da escolha, concluído. Vale deixar isso escrito nos `_task.md` dessas tarefas, para não se perder.
2. O teste da linha 339 exige que nenhum cookie saia nas três etapas, o que cobre a regra. Um caso a mais no `pronta`, conferindo que saem só os dois cookies esperados, deixaria o contrato explícito dos dois lados.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-18 03:17:02 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok

Bloqueantes: nenhum

Esta é a rodada 2. Auditei só o diff desde a rodada aprovada. Não rodei testes nem mexi em container.

- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.ts:89,97-100`: a varredura agora roda no máximo uma vez por minuto, e só quando o seguro em memória passa de 10 mil entradas. A contagem por conta continua igual, e o seguro nunca libera uma tentativa sem contá-la. As entradas continuam limitadas pela validade de 15 min, como antes. Isso não mudou o que acontece com uma escola.
- `contador-de-tentativas.ts:149-152`: o comentário descreve a contagem dupla quando a resposta do Redis demora, e o erro fica do lado de segurar a conta, nunca de liberar. Está correto.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:106-111`: nas etapas com desafio, a resposta sai sem cookie nenhum; `educa_dispositivo` só sai em `pronta` (linhas 117-123). A reserva continua antes do hash, e a chave continua por conta e origem, nunca por IP. A consulta a mais (linha 97) só acontece com a senha certa.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/login-email.int.test.ts:339`: o teste exige `setCookie` vazio em cada uma das etapas com desafio. Se o cookie voltar a sair em alguma delas, o teste quebra.

Recomendações:
1. Continua em aberto trocar o `eval` do script por `defineCommand`/`EVALSHA`. Sem isso, o script inteiro vai ao Redis a cada tentativa na rajada das 7h30. A decisão de medir isso na 16.0 está registrada, e a 16.0 precisa confirmar o custo com a rajada de login do teste de carga.
2. O contador é zerado quando a senha confere, antes de o segundo fator do coordenador ser cumprido (`login.service.ts:104`). Com isso, as tentativas do segundo fator precisam de um limite próprio por conta na 6.0. Vale a 6.0 declarar esse limite para ele não depender deste contador.
3. Um coordenador que nunca concluiu o segundo fator fica sempre como origem `outro`, porque só recebe `educa_dispositivo` depois de concluí-lo. A 6.0 e a 12.0 precisam gravar esse cookie ao concluir a etapa, como diz o comentário. Vale conferir isso na auditoria delas.

## revisor-geral · 3ª rodada · APROVADO · 2026-09-18 03:51:33 · `tasks/prd-identidade-e-tenancy/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O `conferir` devolve "portão local válido para o código atual (typecheck, lint, test, infra)" e sai com código 0.
Bloqueantes: nenhum.

A única correção pedida na 2ª rodada era o carimbo do portão local para a árvore atual, e ela foi feita. Na lista de arquivos alterados só entrou o que o hook escreve, `tasks/prd-identidade-e-tenancy/4_task.md` e `tasks/prd-identidade-e-tenancy/achados-revisoes.md`. Não há arquivo de código, teste ou documento novo desde a rodada anterior. Como o código não mudou, o resto da auditoria daquela rodada continua valendo.

Recomendações:
- O teste `infra/test/borda.int.test.ts` > "handshake por polling fica na mesma instância pelo cookie da borda…" falha de vez em quando. Ele manda 20 POSTs em paralelo no mesmo `sid` de polling, e o engine.io recusa pedido sobreposto no mesmo `sid` com 400 "data request overlap from client" (`node_modules/engine.io/build/transports/polling.js:93`). O teste fica vermelho de forma intermitente e pode segurar a esteira de outra tarefa. Vale abrir uma correção própria, fora desta tarefa, que mande os pedidos em sequência ou que abra um `sid` por pedido. O log da falha está em `/tmp/portao-4-vermelho.log`.
