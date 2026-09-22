# Achados das revisões — `tasks/prd-identidade-e-tenancy/17_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-19 17:43:58 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** os da tabela da tarefa 17.0. São o caminho feliz do aluno desativado, o aluno transferido de A para B e a professora em A e B com a conta limpa só no fim. Depois vêm o isolamento da eliminação, a auditoria (RF19) e os limites do expurgo com relógio injetado. Por fim, o expurgo rodando duas vezes em paralelo, o expurgo que não apaga nada ainda no prazo, a redefinição do MFA (17.4: caminho feliz e isolamento) e a `saida` na troca de escola (17.5, também com o código recusado). Somo três cenários que vêm de decisões desta tarefa:
- o convite válido segura a conta;
- a desativação em paralelo da mesma conta em A e em B;
- o desafio do MFA na mão de quem foi desativado.

**Cobertos:**
- **Caminho feliz, transferido, professora em A e B, isolamento da eliminação, auditoria sem e-mail, nome nem matrícula, e as duas contas em paralelo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts`, linhas 206 a 310 e 357 a 500). São efetivos: o isolamento quebra sem a escola em `travarUsuario`, e a concorrência quebra sem `travarConta`, como vocês já confirmaram por mutação.
- **Limites do expurgo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts`). Fica o registro de 6 meses menos 1 dia e sai o de 6 meses mais 1 dia. Nas sessões, 29 contra 31 dias. Sai a sessão só expirada, fica a encerrada há 29 dias com expiração de 45 dias, o que prova o `coalesce`. Convite usado, revogado e expirado dos dois lados do prazo. A linha "1 hora além do prazo" só sai com o corte do relógio injetado (a conta fecha: o `now()` do banco fica de 4,5 h a 29 h antes do relógio).
- **Expurgo:** idempotência, execução em paralelo com `Promise.all`, lotes, índices sem varredura da tabela, permissão (job de escola falha sem apagar nada) e a trilha agendamento → despachante → worker.
- **17.4:** a sessão cai com 401 pela coordenação e pelo operador. A de B não cai, nem a da conta com a redefinição recusada, e a auditoria não diz quantas sessões caíram.
- **17.5:** `saida` em A e `login` em B. Com o código recusado, nada é gravado em nenhuma das duas escolas.
- Sem `.skip`, `.only` nem teste comentado. Nenhum teste chama provedor de IA.

**Bloqueantes:**

1. **A limpeza da conta com convite só tem o caso do convite revogado.** Estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts:312-338`. A consulta `limparContaSemUso` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`) trata como válido o convite que tem as três condições: `usado_em` nulo, `revogado_em` nulo e `expira_em > now()`. O teste só prova a do meio.
   - **Mutação que passa verde:** tirar `isNull(convite.usadoEm)` ou `gt(convite.expiraEm, now())`. Com isso, a conta nunca é limpa.
   - **Por que importa:** todo coordenador entra por convite (7.0), então todo coordenador desativado depois de aceitar ficaria com e-mail e hash de senha guardados para sempre. É exatamente o que a regra 20, item 18, e a 17.1 proíbem.
   - **Correção exigida:** no mesmo teste, acrescentar dois casos que terminem com `email: null, senha: false`. Primeiro, a conta cujo único convite em B **expirou** (não usado, não revogado, `expira_em` no passado). Segundo, a conta cujo convite em B foi **usado** e cujo usuário lá está desativado.

**Recomendações (não bloqueiam):**
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:226-230`: o comentário diz "nenhuma linha saiu duas vezes", mas a asserção é `toBeGreaterThanOrEqual`, que não prova isso. O que a regra pede já está garantido por `conferir()`. Ajustar o texto do comentário ou tirá-lo.
- Mesmo arquivo, linha 253: `rejects.toThrow()` é genérico. Melhor conferir que o erro é `FalhaDeJob` com `DADOS_INVALIDOS`.
- Faltam testes de concorrência em quatro pontos:
  - a mesma desativação em paralelo (clique duplo): uma dá certo, a outra dá `NAO_ENCONTRADO`, e sai um registro de auditoria só;
  - eliminação em A em paralelo com desativação em B da mesma conta;
  - no teste de concorrência da troca, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts:620-636`: uma `saida` só no registro de A;
  - o gatilho de autor (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0013_ciclo_de_vida.sql`) no `UPDATE OF escola_id/autor` e com o autor eliminado enquanto outra transação grava (o `for key share`).
- O teste de idempotência do expurgo exige 0 linhas apagadas na segunda passada. Se outra suíte gravar linha vencida no mesmo banco entre as duas passadas, ele pode falhar sem motivo. Conferir pelos ids semeados deixaria o teste imune a isso.

## test-engineer · 2ª rodada · APROVADO · 2026-09-19 17:45:38 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** a correção 1 da 1ª rodada. Uma conta sai da escola A e tem um convite em B. Se esse convite está vencido (não usado, não revogado, prazo no passado), a conta termina com `email: null, senha: false`. O mesmo vale quando o convite foi usado e o usuário em B foi desativado depois.

**Cobertos:**
- **Correção 1, feita.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts:312-342`. Ele cobre os quatro estados do convite, cada um com uma conta própria:
  - `expirado`: `expira_em = now() - 1 hour`, sem data de uso nem de revogação.
  - `usado`: `usado_em` uma hora antes, com o usuário de B criado desativado agora.
  - `revogado`: `revogado_em = now()`.
  - `valido`: a única conta que mantém e-mail e senha.

  Conferi contra a consulta em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:311`, tirando mentalmente uma condição por vez:
  - Sem `isNull(convite.usadoEm)`, o caso `usado` passa a valer como convite pendente e o teste falha.
  - Sem `gt(convite.expiraEm, now())`, o caso `expirado` falha.
  - Sem `isNull(convite.revogadoEm)`, o caso `revogado` falha.
  - Sem a checagem de convite inteira, o caso `valido` falha.

  Cada estado é provado por um caso próprio. A mensagem da asserção leva o nome do estado, então a falha aponta qual deles quebrou.
- **Novo teste de clique duplo em desativar** (`ciclo-de-vida.int.test.ts:344-353`). As duas chamadas rodam de fato em paralelo, com `Promise.allSettled`. O teste exige uma chamada aceita e uma recusada, a recusa tipada como `NAO_ENCONTRADO` e uma única linha de auditoria. Isso prova a regra 80, item 7.
- **Troca de escola em paralelo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts:637`). O teste agora exige exatamente um registro de `saida` em A, da professora. Se a sessão de A fosse encerrada duas vezes, o registro sairia em dobro e o teste falharia.
- **Permissão do expurgo** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:254-258`). O teste deixou de aceitar qualquer erro (`toThrow()`) e passou a exigir `FalhaDeJob` com `DADOS_INVALIDOS` e `definitiva: true`. Uma falha qualquer, por exemplo de banco, não passa mais por recusa de permissão. O comentário do teste de concorrência (linha 227) agora diz o que a asserção verifica.

**Bloqueantes:** nenhum.

**Recomendações:**
- No caso `usado`, o usuário de B é criado já desativado e só depois recebe o convite com `usado_em` no passado. A ordem no banco não é a do aceite real, mas não muda o que a consulta de limpeza avalia. Registrar para o `/validar`, sem ação.
- No teste de clique duplo, `esperarNaoEncontrado(Promise.reject(recusa?.reason))` funciona, mas é indireto. Comparar `recusa.reason` direto com `toMatchObject({ codigo: CodigoDeErro.NAO_ENCONTRADO })` seria mais legível.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-19 17:47:01 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** `conta` (agora aceita `email` nulo; é global por desenho, seção 3 da Tech Spec), `usuario`, `credencial_matricula`, `conta_externa`, `vinculo` (tem `escolaId` e `anoLetivoId`), `sessao`, `convite`, `registro_acesso` (ganhou o índice `(em)` para o expurgo), `auditoria`. A migration `0013_ciclo_de_vida.sql` não cria tabela nova. Ela troca as FKs compostas de `auditoria.autor_usuario_id` e de `vinculo.criado_por` por gatilho de restrição `AFTER`. O gatilho continua exigindo que o autor seja usuário da mesma `escola_id` do registro, com `for key share`, mesmo código de erro e mesmo nome de restrição. Nenhum id deixa de ser UUID.

**Queries verificadas:**
- `CicloDeVidaRepository` (`travarUsuario`, `desativar`, `apagarSenhaDaMatricula`, `apagarCredencialDaMatricula`, `apagarContaExterna`, `apagarSessoes`, `apagarVinculos`, `apagarUsuario`). Todas filtram por `exigirEscolaDoContexto()`. Nenhuma recebe a escola por argumento.
- `EscritaDeSessaoRepository.encerrarDoUsuario` filtra pela escola do contexto.
- `SessaoDeOrigemRepository.encerrarParaTroca` e a gravação de `saida` na origem rodam no contexto da escola de origem, com o usuário de origem. O registro de A não traz nada de B.
- Na `ResolucaoDeTenantRepository`, `encerrarSessoesDaConta`, `travarConta` e `limparContaSemUso` usam `@SemEscopo` com justificativa. Partem de `conta_id` lido do banco, nunca do cliente, e devolvem só contagem ou booleano. Isso está coberto pela seção 6 da Tech Spec.
- `ExpurgoDeAcessoRepository.apagarLoteVencido` usa `@SemEscopo` com justificativa. O critério é só o prazo, o job exige `rotinaDoSistema` e não devolve linha. O teste do decorator fixa a lista de métodos sem escopo.
- Nenhuma rota nova. Nada aceita `escolaId` do corpo ou da query.
- A camada de rede não é tocada.

**Teste de isolamento:** presente e efetivo.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ciclo-de-vida.int.test.ts`, A pedindo `eliminar(camilaEmB)` recebe `NAO_ENCONTRADO` e nada muda em B. Se a cláusula de escola sair de `travarUsuario`, a eliminação passa e o teste quebra.
- Desativar em A com usuário ativo em B preserva a conta e o login em B.
- `desligarContaExterna` com o id de B dá `NAO_ENCONTRADO`.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/mfa.int.test.ts`, redefinir em A não derruba sessão de B.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts`, os limites de prazo valem para todas as escolas, e só a rotina do sistema consegue expurgar.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts`, `contaLimpa` vai para o `depois` da auditoria de A. O valor depende do estado de outras escolas: `false` quando B ainda tem usuário ativo ou convite válido, como o teste da linha 291 confirma. A regra 20, item 6, e a regra 10, item 6, pedem que a resposta não revele a existência de registro de outra escola. Hoje isso não bloqueia: não há leitura de auditoria no F1, e a 6.0 já grava a recusa do MFA em A pelo mesmo critério. Mesmo assim, antes do F3 expor a auditoria à coordenação, decidam entre tirar `contaLimpa` da auditoria da escola ou mostrá-lo só ao operador. O `/validar` deve registrar essa decisão.
2. No mesmo arquivo de teste de ciclo de vida, só `travarUsuario` sustenta o isolamento de `apagarSessoes`, `apagarVinculos`, `apagarCredencialDaMatricula` e `apagarContaExterna`. As quatro filtram por `usuarioId`, que já é por escola, então tirar a cláusula de escola delas não deixa nenhum teste vermelho. A cláusula serve de defesa em profundidade. Vale um teste unitário da instrução gerada, como já existe para o expurgo, que confirme `escola_id` em cada `where`.
3. A `ResolucaoDeTenantRepository` chegou a 25 métodos `@SemEscopo`. É aceito pela seção 6 da Tech Spec, mas a próxima tarefa que acrescentar método ali deveria justificar por que ele não cabe num repository escopado.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-19 17:47:23 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:** hash de senha da matrícula (apagado na desativação), `conta_externa` com provedor, `sub`, `oid` e `tid` (apagada na desativação e na eliminação), e-mail, senha, segredo TOTP e códigos de recuperação da conta global (apagados pela limpeza da conta), `usuario.nome` (sai com o usuário na eliminação), sessão, convite e `registro_acesso` (expurgo por prazo). A tarefa não cria nenhum campo pessoal. `conta.email` passou a aceitar nulo só para a conta limpa, em que sobra apenas o id.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. As linhas de identificador externo, hash, e-mail global, sessão, convite e registro de acesso foram atualizadas com a retenção nova. Não há campo proibido para aluno.

**Autorização por objeto:** ok.
- O F1 não tem rota nova.
- Toda escrita de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts` filtra pela escola do contexto.
- Dão a mesma resposta `NAO_ENCONTRADO` o id de outra escola, o id inexistente, o usuário já desativado e o próprio usuário.
- A eliminação pedida por A não alcança nada de B, e a conta global só é limpa quando não serve a escola nenhuma. Há teste de isolamento para isso.
- A redefinição do MFA não informa quantas sessões encerrou.

**Logs:** limpos. O serviço de ciclo de vida não loga nada. O expurgo loga só `acesso.expurgado` com três contagens. A mensagem do gatilho `exigir_usuario_da_escola` é fixa e não leva nenhum valor.

**Auditoria:** presente.
- `usuario.desativado`, `usuario.eliminado` e `conta_externa.desligada` são gravadas na mesma transação da ação.
- `antes` e `depois` são objetos fechados (`strictObject`) só com ids, papel, datas, contagens e booleanos.
- Um teste confere que matrícula, nome e e-mail não aparecem no registro.
- A FK do autor virou gatilho, e com isso a auditoria continua existindo depois que o usuário é eliminado.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os e-mails são `@escola.invalid` e os nomes são "Pessoa sintética" ou "Lara Sintética".

**Pergunta de fechamento:** a consulta do titular por código fica para o F3, como a Tech Spec (seção 13) e a própria tarefa declaram. Esta tarefa não piora a resposta: `registro_acesso` e `auditoria` continuam com o `usuario_id` depois da eliminação, e o registro de `usuario.eliminado` diz o que foi apagado. Por isso não considerei a pendência um bloqueante desta tarefa. Ela continua valendo para o F3.

**Bloqueantes:** nenhum.

**Recomendações:**
1. No caminho da eliminação, `limparContaSemUso` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`, próximo da linha 318) encerra as sessões que sobraram com o motivo `desativacao`. Um motivo próprio, como `conta_limpa`, deixaria o rastro mais fiel.
2. `apagarContaExterna` informa na auditoria só a primeira ligação apagada. Se um usuário puder ter mais de uma ligação, vale registrar a contagem.
3. Convite pendente em outra escola segura o e-mail da conta, e isso está documentado. Vale deixar explícito no runbook que, para limpar a conta nesse caso, a escola precisa revogar o convite.
4. No F3, a consulta do titular deve juntar `registro_acesso` e `auditoria` pelo `usuario_id` eliminado, que não tem FK, para responder à pergunta de fechamento.

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-19 17:47:54 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | fila | migration
Rate limit: ok (a tarefa não cria rota nem limitador novo; o login continua com o limite por conta das 14.0 a 16.0)
Fila e prioridade: ok (`sistema.expurgar-acesso` entra na fila `lote` como não urgente, às 4h30 de São Paulo, só na réplica de lote, em lotes de 5.000 com `for update skip locked`)
Concorrência: protegida (o usuário e a conta ficam travados com `FOR UPDATE` na desativação e na eliminação; a troca de escola decide a corrida com o `update` condicional; o expurgo usa `skip locked`. Há teste com 5 contas em paralelo, com clique duplo e com dois expurgos ao mesmo tempo)
Índice e paginação: faltando
Degradação de IA: não se aplica
Migration: compatível (o `DROP NOT NULL` e o `CHECK` refeito só afrouxam a regra; os `CREATE INDEX` sem `CONCURRENTLY` são aceitáveis porque as tabelas nascem vazias no deploy do F1)
Métrica e alerta: ok (o job usa a telemetria genérica de fila do F0 e o log `acesso.expurgado` só com contagens; o alerta de rotina sem rodar é pendência anterior, já no `TODO.md`)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:283`: `encerrarSessoesDaConta` faz `update sessao ... where conta_id = $1 and encerrada_em is null`, e `sessao` não tem índice por `conta_id`. Os índices dela são `refresh_hash_anterior`, `(escola_id, usuario_id)` e o novo `sessao_fim_idx`. A consulta é nova e varre `sessao` inteira, que cresce com aluno: um login por aluno por dia, mais 30 dias de retenção. A varredura roda dentro da transação que já segura `FOR UPDATE` na conta e no usuário. Isso acontece em toda redefinição de MFA (17.4) e em toda limpeza de conta chamada por `limparContaSemUso` na desativação e na eliminação de professor e coordenador (17.1). A partir do F2, a desativação da coordenação e a virada do ano vão chamar isso em série. Viola a regra 80, item 8.
  **Correção exigida:** criar em `packages/nucleo/drizzle/0013_ciclo_de_vida.sql` um índice parcial `sessao_conta_aberta_idx ON sessao (conta_id) WHERE conta_id IS NOT NULL AND encerrada_em IS NULL`, e declarar o mesmo índice em `packages/nucleo/src/db/schema/sessao.ts` com o snapshot regenerado. Acrescentar ao teste de plano um caso que prove que `encerrarSessoesDaConta` desce por esse índice, sem `Seq Scan`, como já fazem os lotes do expurgo em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:262`.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts:133`: `travarUsuario` usa `FOR UPDATE`, que conflita com o `FOR KEY SHARE` da FK de `sessao`, `vinculo` e `credencial_matricula` e agora também do gatilho `exigir_usuario_da_escola`. A desativação não muda a chave do usuário, então `FOR NO KEY UPDATE` basta. A troca serializaria as duas desativações do mesmo jeito e deixaria de bloquear a criação de sessão e a gravação de auditoria que dependem daquele usuário. Também reduz a chance, pequena, de impasse entre desativar a mesma conta em A e em B e uma troca de escola dessa conta ao mesmo tempo.
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`: o lote de `convite` não tem `order by` nem índice, e varre a tabela a cada lote. A tabela é pequena, um convite por coordenador, então não bloqueia. Vale registrar no comentário que o custo cresce com o número de convites, se o convite de professor passar a usar a mesma tabela.
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`: a seção "Rotina do sistema sem rodar" continua "a preencher". O expurgo do acesso aumenta o custo de a rotina parar, porque agora é descumprimento da LGPD. Vale subir a prioridade dessa pendência no `TODO.md`.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-19 17:48:03 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. As escolhas desta tarefa estão registradas na techspec, seção 3 ("Autor") e seção 5 ("Ciclo de vida"), e não foram tomadas em silêncio. A troca da FK do autor por gatilho resolve a pendência que o `tenancy-guardian` deixou para a 17.0. O desligamento da conta externa estava previsto na seção 3 da techspec original.
Portão local: carimbo inválido. A mensagem do `conferir` é: "apps/worker/test/expurgo-de-acesso.int.test.ts mudou em 2026-09-19 17:44:29, depois do início do último (2026-09-19 17:14:29). Rode `node tools/processo/portao-local.ts --infra` de novo." O `portao-local.ts --infra` estava rodando quando conferi (saída em `/tmp/portao17.log`). Confira de novo quando ele terminar.

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:307` (`limparContaSemUso`), junto com `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts`.
   - **O que está errado:** a conta só é conferida no momento da desativação ou da eliminação. Se naquele momento ela tem um convite válido em outra escola, a limpeza é adiada, e nada volta a olhar essa conta depois.
   - **Quando isso acontece:** professora desativada em A enquanto espera um convite de coordenadora em B. Depois o convite de B vence ou é revogado. Ela não tem mais usuário ativo nem convite válido em escola nenhuma, mas a conta fica com e-mail e hash de senha para sempre. Nesse ponto o `CicloDeVidaService.desativar` recusa o usuário de B, que já está inativo, então a coordenação de B não tem como disparar a limpeza.
   - **O mesmo furo vale para** a conta criada pelo convite que nunca foi aceito.
   - **O que isso contraria:** o objetivo da tarefa ("a conta global some quando não resta usuário ativo em escola nenhuma"), a regra 20, item 18, e a retenção que esta própria tarefa escreveu em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:52` ("enquanto houver `usuario` ativo em alguma escola (ou convite ainda válido para um)"). O código cumpre essa frase só no instante da ação, não depois.
   - **Correção exigida:** a limpeza precisa voltar a olhar a conta quando o convite deixa de valer. O caminho natural é um passo no `sistema.expurgar-acesso` que limpa, em lotes, as contas com e-mail, sem usuário ativo e sem convite válido, reusando o mesmo critério de `limparContaSemUso`, com a conta travada.
   - **Junto com a correção:**
     - registrar o novo `@SemEscopo` na tabela da seção 6 da techspec e no teste de `sem-escopo.decorator.test.ts`;
     - ajustar a linha 52 do `lgpd.md`;
     - teste com relógio injetado: conta segurada por convite válido; o convite vence e a rotina roda; a conta termina com `email` nulo e sem senha; uma conta com usuário ativo em outra escola fica intacta.
   - **Alternativa, se o Joaquim preferir outro desenho:** parar e registrar a decisão com ele, mas não deixar a credencial guardada sem prazo.

2. Portão local sem carimbo válido para a árvore atual. Rode `node tools/processo/portao-local.ts --infra` depois da correção acima e confira com `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/17_task.md`.

Recomendações:
- A troca da FK do autor da auditoria e de `vinculo.criado_por` por gatilho (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0013_ciclo_de_vida.sql`) muda uma garantia estrutural da auditoria. Está registrada na techspec, mas vale ratificação explícita do Joaquim, como foi feito com o semáforo na 14.0. Também vale um teste de que o gatilho recusa `UPDATE OF autor_usuario_id` para um autor de outra escola; hoje só a inserção está provada.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`: `limparContaSemUso` encerra as sessões com o motivo `desativacao` também quando quem chamou foi a eliminação. Hoje não há diferença prática, porque a eliminação já apagou as sessões da escola dela, mas o motivo passaria a mentir se aparecer outro chamador. Vale receber o motivo por parâmetro.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.service.ts:95`: a guarda do próprio usuário depende de `toLowerCase()` sobre um id que o `z.uuid()` já validou. Normalizar o id uma vez só, no começo, deixaria a intenção mais clara.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-19 17:53:47 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Conta segurada por convite:** a conta que um convite válido segurava é limpa quando o convite vence, segundo o relógio injetado, e também quando é revogado.
- **Contas que ficam:** a conta com convite ainda válido fica intacta, e a com usuário ativo em outra escola também.
- **Estado final da conta limpa:** sem e-mail, sem senha, sem segredo e sem segundo fator, com 0 códigos de recuperação e a sessão aberta encerrada como `conta_limpa`.
- **Idempotência:** a segunda execução devolve 0 no passo `conta`.
- **Lotes:** o passo `conta` também roda em lotes.
- **Permissão:** só a rotina do sistema roda o expurgo.
- **Índice `sessao_conta_aberta_idx`:** o plano não tem Seq Scan, e a chamada encerra só a sessão da conta; a segunda chamada devolve 0.
- **Concorrência:** a limpeza de conta rodando junto com a criação de convite para a mesma conta. Esta é a operação que pode acontecer duas vezes ao mesmo tempo, e o item 7 da regra 80 exige que o banco resolva.

**Cobertos:**
- **Correção do revisor-geral feita.** O teste de `apps/worker/test/expurgo-de-acesso.int.test.ts:259-308` quebraria se a regra saísse:
  - O convite `vencida` expira 1 h antes do `AGORA`, que é amanhã às 04:30, e depois do `now()` do banco. Se o corte usasse o `now()`, o teste falharia.
  - Se a condição do convite válido fosse removida, `aindaValida` seria limpa e o teste falharia.
  - Se `u.desativado_em is null` fosse removido, `ativaEmB` seria limpa e o teste falharia.
- **Idempotência:** com `['conta', 0]`, a partir da linha 226.
- **Lotes:** o passo `conta` entra na checagem, a partir da linha 250.
- **`@SemEscopo`:** o teste do decorador inclui o método novo.
- **Correção do infra-guardian feita:**
  - O índice parcial está no schema e na migration 0013, linha 16.
  - O teste de plano e de efeito está em `apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts:193-231`. Se `isNull(encerradaEm)` sumisse, a segunda chamada devolveria 1 e o teste falharia.
- **Gatilho do autor:** agora recusa também o `UPDATE`, com teste em `apps/api/test/ciclo-de-vida.int.test.ts`.

**Bloqueantes:**

1. **A limpeza em lote corre em paralelo com o reconvite e pode apagar a conta que acabou de receber convite. Não há teste de concorrência.**
   - **O comentário não confere.** `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:72-73` diz que "a criação de usuário para ela (convite, com a FK) espera o commit do lote". Isso não vale no reconvite de um coordenador que já existe inativo, e esse é justamente o caso que a correção quis cobrir.
   - **Por que o reconvite não trava a conta:** em `apps/api/src/sessao/convite.repository.ts:29-39`, `usuarioConvidado` faz upsert com `onConflictDoUpdate` e só troca `desativado_em`. Como não mexe em `conta_id`, o Postgres não checa a FK e não põe trava nenhuma na conta. `criarConvite` aponta para o usuário, não para a conta. E `contaParaConvite`, em `apps/api/src/sessao/resolucao-de-tenant.repository.ts:444-450`, faz `insert on conflict do nothing` seguido de `select` sem trava.
   - **O que acontece:**
     1. A transação do convite (`apps/api/src/sessao/convite.service.ts:156-165`) está aberta.
     2. A CTE do lote (`expurgo-de-acesso.repository.ts:76-103`) não enxerga o convite ainda sem commit.
     3. O `skip locked` não pula nada, porque a conta não está travada.
     4. As duas transações fazem commit.
   - **Resultado:** fica um convite válido ligado a uma conta sem e-mail. O aceite grava a senha nessa conta, e o coordenador nunca consegue entrar por e-mail. No caminho do convidado novo, o lote pode travar primeiro, então o insert do usuário espera a trava e segue com a conta já limpa, com o mesmo resultado.
   - **Correção exigida:**
     - Em `contaParaConvite`, travar a conta achada (`select ... for share` ou `for no key update`) e verificar de novo o e-mail depois da trava.
     - Se a conta foi limpa enquanto esperava, repetir o insert para criar uma conta nova.
     - O `skip locked` do lote passa então a pular a conta travada pelo convite, e a trava do convite passa a esperar o lote.
     - Corrigir o comentário das linhas 72-73.
     - Escrever teste de concorrência de verdade, com as duas transações abertas ao mesmo tempo, sem rodar uma depois da outra. Primeiro caso: uma transação manual segura o lote com a conta travada, `criarConviteDeCoordenador` roda para o mesmo e-mail, o lote faz commit, e o teste verifica que a conta do usuário convidado tem e-mail. Segundo caso: o convite segura a trava, o lote roda e devolve 0 para aquela conta.
   - **Alcance:** a mesma janela existe entre `limparContaSemUso` na desativação e o reconvite, e a mesma trava resolve as duas.

**Recomendações:**
- **Teste de plano:** em `resolucao-de-tenant.repository.int.test.ts:201-205`, o teste monta de novo a instrução do update em vez de usar a do repository. Se o `where` de `encerrarSessoesDaConta` mudar, o plano conferido deixa de ser o real. Vale expor a instrução, como `instrucaoDoLoteDeAcesso` faz.
- **Concorrência sem as contas:** o teste de concorrência em `expurgo-de-acesso.int.test.ts:231-241` não confere as contas. Vale semear uma conta a limpar e verificar que a soma de `conta` nas duas execuções é pelo menos 1 e que a conta termina limpa.
- **Lotes da conta sem amostra:** no teste de lotes, a partir da linha 243, o passo `conta` pode rodar só com `[0]`, porque não há contas semeadas nele. Vale semear três contas para provar que o laço de lotes roda de fato.
- **Sobras entre testes:** o teste da linha 259 não apaga as contas e os usuários que cria. Como a limpeza é global, um expurgo rodando ao mesmo tempo que testes da API no mesmo banco pode limpar uma conta de `equipeComEmail`, em `apps/api/test/sessao-de-teste.ts:122-129`, entre o insert da conta e o do usuário. Vale limpar as sobras ou garantir que os projetos de integração não rodam em paralelo no mesmo banco.

## test-engineer · 4ª rodada · APROVADO · 2026-09-19 17:59:22 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (correção da 3ª rodada):
- **(a)** A limpeza trava a conta primeiro. O convite para o mesmo e-mail espera, a limpeza faz commit, e o convite termina com uma conta que tem o e-mail.
- **(b)** O convite trava a conta primeiro. O lote real da madrugada roda no meio e não limpa aquela conta.
- Travar a conta achada e verificar de novo o e-mail em `contaParaConvite`. Se a conta sumiu, repetir o insert.
- Corrigir o comentário de `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`.

**Cobertos:** li o código e os testes, mas não rodei nada, por causa do portão com `--infra` que está rodando.
- **Código:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:449-457` trava a conta achada com `for no key update`. Se a leitura travada não acha o e-mail, volta ao insert, com até 3 tentativas. Esse lock conflita com o `for update of c skip locked` do lote, então o lote pula a conta travada. O comentário em `expurgo-de-acesso.repository.ts:72-74` foi corrigido e bate com o comportamento.
- **(b):** `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts:241-265` é concorrência de verdade. A transação do convite fica aberta enquanto o `limparLoteDeContasSemUso` real roda. Há asserção sobre o e-mail antes e depois da liberação, e sobre `{ id: contaId, nova: false }`. A mutação relatada, tirar o `.for('no key update')`, deixa o teste vermelho, então ele falharia sem a regra.
- **(a):** `resolucao-de-tenant.repository.int.test.ts:267-288` abre as duas transações. Prova que o convite ainda espera antes do commit (Promise.race de 300 ms). Depois confere `nova: true`, um id diferente, o e-mail na conta nova e o e-mail nulo na conta antiga.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **O teste (a) não passa pelo laço de repetição.** No Postgres, o `insert ... on conflict do nothing` já espera sozinho a transação da limpeza, porque a versão antiga da linha, com o e-mail, continua no índice único até o commit. Depois do commit o conflito some e o insert cria a conta direto. O ramo "leitura travada não acha, volta ao insert" (`resolucao-de-tenant.repository.ts:453-455`) só roda quando a limpeza trava entre o conflito do insert e o `select`. Hoje nenhum teste passa por ele, e o teste (a) passaria também sem o laço. O resultado que a correção exigiu está provado. Fica para o `/validar`:
   - ajustar o nome do teste (a), que diz "não acha mais o e-mail", ou o comentário de `expurgo-de-acesso.repository.ts:73`, que descreve o mesmo caminho;
   - se der, provar o ramo de repetição com um teste que force essa janela.
2. **Erro sem tipo.** `resolucao-de-tenant.repository.ts:456` lança `new Error('conta do convite não achada nem criada')`. É uma invariante interna, mas a regra 00, item 9, pede erro de domínio tipado e com código.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-19 18:00:15 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** nenhuma tabela nova de domínio nesta rodada. Em `sessao` (já tem `escolaId`) entrou o índice parcial `sessao_conta_aberta_idx` sobre `conta_id` e o motivo `conta_limpa` nos dois lugares (constante e `check`). A `conta` continua global e sem escola, como a rodada anterior já tinha aceito.

**Queries verificadas:**
- `ExpurgoDeAcessoRepository.limparLoteDeContasSemUso` (`/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:77-105`, `:133-140`): tem `@SemEscopo` com justificativa escrita e devolve só a contagem. Uma conta com usuário ativo em qualquer escola não é limpa. O convite válido só conta quando é do próprio usuário, na escola dele (`cv.escola_id = u.escola_id and cv.usuario_id = u.id`). Nenhum dado de escola sai da rotina.
- `ResolucaoDeTenantRepository.contaParaConvite` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:449-457`): a trava `for('no key update')` e a repetição do insert não mudam o que sai. Continua devolvendo só o id e se a conta é nova. A justificativa foi atualizada.
- `limparContaSemUso` e `encerrarSessoesDaConta` (mesmo arquivo, `:279-326`): alcançam todas as escolas só pelo `conta_id`, já verificado na escola do contexto. O resultado é um número ou um booleano e não aparece em resposta nem em auditoria de outra escola.
- `CicloDeVidaRepository.travarUsuario` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/ciclo-de-vida.repository.ts:26-34`): continua limitado a `escolaId` do contexto (`exigirEscolaDoContexto()`); só a trava mudou.
- `EscritaDeSessaoRepository.encerrarDoUsuario`: escopo de escola vindo do contexto.
- `sem-escopo.decorator.test.ts` fixa a lista exata de métodos com `@SemEscopo` no `ExpurgoDeAcessoRepository` e confere a justificativa de cada um.

**Teste de isolamento:** presente e efetivo. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:259`, a conta desativada em A mas com usuário ativo em B (`ativaEmB`) e a conta com convite válido em B (`aindaValida`) precisam continuar intactas. Se eu tiro mentalmente o `not exists` de usuário ativo, ou a correlação do convite com o usuário, o teste quebra. `ciclo-de-vida.int.test.ts:256` e `:312` cobrem o mesmo critério na desativação.

**Bloqueantes:** nenhum.

**Recomendações:**
- O comentário da classe `ExpurgoDeAcessoRepository` (linhas 107-112 do mesmo arquivo) ainda diz "é a única exceção ao escopo fora da resolução de tenant". Agora são dois métodos nessa classe e, somando `ExpurgoDeJobsRepository.apagarLoteVencido`, o módulo `retencao` chega a três `@SemEscopo`. A regra 10, item 9, trata a terceira exceção no mesmo módulo como sinal de problema no desenho. Todas são rotinas nossas e justificadas, mas vale registrar isso na Tech Spec, seção 6, e corrigir o texto do comentário.
- `contaParaConvite` (linha 456) lança `new Error` sem tipo depois de três tentativas. Isso não afeta o isolamento, mas contraria a regra 00, item 9. Fica para o `revisor-geral`.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-19 18:00:21 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: o e-mail de login da conta global, o hash de senha, o segredo TOTP e o passo do MFA, os códigos de recuperação e a sessão (novo motivo `conta_limpa`, novo índice `sessao_conta_aberta_idx`). Nenhum campo novo foi coletado. A mudança só apaga dados e amplia a retenção.

Fora da tabela de dados do docs/lgpd.md: nenhum. As linhas do e-mail global, do hash de senha, da sessão e do convite foram atualizadas com o critério "ou convite ainda válido" e com a limpeza de madrugada pelo `sistema.expurgar-acesso`.

Autorização por objeto: ok. Nenhuma rota nova. As operações de `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts` são rotina do sistema, marcadas `@SemEscopo` com justificativa. `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts` recusa a execução fora de `rotinaDoSistema`. Elas devolvem só contagens. `mfaDaConta` trata a conta limpa como credencial inválida, sem resposta distinguível.

Logs: limpos. O evento `acesso.expurgado` leva só números, entre eles `contasLimpasTotal`. O erro de `contaParaConvite` não carrega o e-mail.

Auditoria: presente onde a regra exige. A desativação e a eliminação, que originam a limpeza, já são auditadas. A limpeza de madrugada não é uma das ações da lista do item 10.

Envio externo: nenhum.

Seed/fixture: sintético. Os testes usam `equipe-<uuid>@escola.invalid` e o nome "Pessoa sintética".

Conferi o que o diff afeta:
- **Mesmo critério nos dois caminhos.** O lote `LIMPAR_LOTE_DE_CONTAS` usa a mesma regra de `limparContaSemUso`: nenhum usuário ativo e nenhum convite não usado, não revogado e no prazo do `agora` injetado.
- **Tudo apagado na mesma instrução.** No mesmo comando saem e-mail, senha, todas as colunas de MFA e os códigos de recuperação. As sessões abertas são encerradas com `conta_limpa`, e a linha da conta fica só com o id.
- **Corrida entre convite e limpeza.** O `FOR NO KEY UPDATE` em `contaParaConvite` conflita com o `FOR UPDATE OF c SKIP LOCKED` do lote.
  - Se o convite trava a conta primeiro, o lote pula essa conta. Depois do commit do convite, ele fica válido e segura a conta.
  - Se o lote trava primeiro, a releitura do convite (read committed) não acha mais o e-mail e cai no `insert`, que cria uma conta nova.
  - Não há caminho em que o e-mail de uma conta recebendo convite seja apagado.
- **Retenção.** A conta limpa depois da desativação não fica com credencial esperando indefinidamente. Isso fecha o item 18 da regra 20 no caso do convite pendente.
- **Pedido de secretaria sobre um aluno.** A resposta não muda: aluno não tem conta, e nenhuma sessão de aluno é alcançada pela limpeza, porque `conta_id` é nulo e está fora do índice parcial.
- **Minha recomendação 1 da rodada anterior** (motivo próprio para a limpeza) foi aplicada como `conta_limpa`, no enum, no check e na migration `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0013_ciclo_de_vida.sql`.

Bloqueantes: nenhum.

Recomendações:
1. **Relógio único na limpeza de madrugada.** O lote grava `encerrada_em = now()` nas sessões que encerra, mas o corte do convite usa o `agora` injetado. Para o teste com relógio conseguir provar também a data de encerramento, dá para usar o mesmo `agora` nos dois lugares. Não afeta a conformidade.
2. **Contagem para o `/validar`.** O nightly limpa conta sem registro por escola. Isso é aceitável, porque a conta é global e o fato que a originou já está auditado na escola. Vale deixar o `/validar` confirmar que o runbook explica como a escola vê essa contagem se perguntar.

## infra-guardian · 2ª rodada · REPROVADO · 2026-09-19 18:00:39 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | fila | migration
Rate limit: ok
Fila e prioridade: ok (lote às 4h30, na fila de lote, preso pela janela letiva)
Concorrência: corrida em /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:77-95
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok

**Correção exigida na rodada anterior:** feita. O índice parcial `sessao_conta_aberta_idx` está na migration 0013, no schema e no snapshot. O teste de plano está em `resolucao-de-tenant.repository.int.test.ts:212-216`: com `enable_seqscan=off`, o plano usa o índice e não tem Seq Scan. O `UPDATE sessao` do lote novo também usa esse índice. O `not exists` usa `usuario_conta_idx` e `convite_escola_usuario_idx`.

Bloqueantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:77-95` (`LIMPAR_LOTE_DE_CONTAS`), junto com `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:449` (`contaParaConvite`). A mesma instrução faz a checagem ("sem usuário ativo e sem convite válido") e a trava (`for update of c skip locked`). O problema é que, em READ COMMITTED, o `not exists` lê a visão do banco do começo da instrução. A trava só relê a conta quando a linha dela foi alterada, e o `contaParaConvite` apenas trava a conta com `FOR NO KEY UPDATE`, sem alterá-la.
  - A corrida: o lote começa a instrução. Uma transação de convite trava a conta, cria o usuário e o convite e faz commit antes de o lote chegar àquela linha. O lote então acha a linha livre, trava sem reler, não vê o usuário novo e apaga o e-mail, a senha e o MFA de uma conta que acabou de receber convite válido. O coordenador fica com um convite que não leva a login.
  - O teste atual, com as duas transações abertas, só cobre o caso em que a trava ainda está segura. O comentário "o lote nunca apaga o e-mail de uma conta recebendo convite" não vale para esse caso.
  - Correção exigida: separar a trava da checagem, na mesma transação.
    1. Primeira instrução: `select id from conta where email is not null ... order by id limit N for update skip locked`, que escolhe e trava as candidatas.
    2. Segunda instrução, com visão nova do banco depois da trava: reavaliar o `not exists` (usuário ativo ou convite válido no `agora`) só sobre os ids travados, e só então limpar a conta, apagar os códigos e encerrar as sessões com `conta_limpa`.
  - O caminho da desativação (`travarConta` e depois `limparContaSemUso`) já faz nessa ordem e está correto.
  - Teste exigido: um convite com commit depois de a instrução do lote começar e antes da trava daquela conta. Um jeito determinístico é travar as candidatas num passo, fazer o commit do convite noutra conexão e só depois rodar a reavaliação e a limpeza. O teste precisa mostrar que a conta mantém o e-mail e que ele falha na versão de instrução única.

Recomendações:
- O `LIMPAR_LOTE_DE_CONTAS` usa `now()` no `encerrada_em` das sessões e `agora` no critério. Usar `agora` nos dois deixa o teste com relógio injetado coerente com o expurgo de 30 dias.
- `contaParaConvite` lança `Error` genérico depois de 3 tentativas. A regra 00, item 9, pede erro de domínio tipado com código.
- O comentário da migration diz que as tabelas "nascem vazias". Registrar no runbook que, se a 0013 for aplicada separada do F1, `CREATE INDEX` sem `CONCURRENTLY` em `sessao` e `registro_acesso` trava escrita em tabela com dado.

## test-engineer · 5ª rodada · APROVADO · 2026-09-19 18:03:17 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos (5ª rodada, o diff):**
- A correção do infra-guardian: um convite faz commit entre a trava do lote e a reconferência. A conta dele fica com o e-mail. Uma outra conta travada no mesmo lote é limpa.
- O teste precisa falhar na versão de instrução única.
- Em `contaParaConvite`, as três tentativas esgotadas lançam erro tipado (regra 00, item 9).
- O laço do processador continua terminando com a nova limpeza em duas instruções.

**Cobertos:**
- **Separação entre trava e reconferência:** feita em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`.
  - `TRAVAR_CANDIDATAS` (linhas 94-100) usa `for update of c skip locked`.
  - `LIMPAR_TRAVADAS` (linhas 102-117) repete `SEM_USO(agora)` sobre os ids travados, numa instrução seguinte da mesma transação (linhas 151-159). Em READ COMMITTED, essa segunda instrução enxerga o convite que fez commit na janela.
  - As sessões são encerradas com o mesmo `agora` do lote, como foi recomendado.
- **Teste determinístico:** `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:310-332`.
  - O gancho `depoisDeTravar` roda depois da trava e grava o convite por `bancada.pool`, que é outra conexão, com commit.
  - Não há risco de travamento mútuo. A chave estrangeira do convite aponta para `usuario`, e não para a `conta` travada.
  - O convite expira 3 dias depois do `AGORA` injetado, então vale no critério.
  - As asserções verificam o resultado: a conta reconvidada fica com o e-mail e a outra é limpa. Assim o teste também prova que a reconferência não barra a conta que continua sem uso.
  - Sobre a mutação que vocês rodaram: sem o critério na segunda instrução, a limpeza decide pelo que a trava viu no começo da primeira instrução, e isso equivale à versão de instrução única. O vermelho que vocês relataram é plausível pelo que li.
- **Erro tipado:** `resolucao-de-tenant.repository.ts:457` agora lança `ErroDeDominio(INDISPONIVEL_TENTE_DE_NOVO)`, que responde 503.
- **Laço do processador:** em `apps/worker/src/processadores/expurgar-acesso.ts:44-48`, quando a reconferência descarta alguma conta, o lote volta com menos que o limite e o laço termina. Não há laço infinito. As contas que sobrarem ficam para a noite seguinte, como diz a documentação.
- **Rodadas anteriores:** o que já estava aprovado não mudou fora deste diff. Os chamadores existentes (`resolucao-de-tenant.repository.int.test.ts:260` e o processador) continuam compatíveis, porque o gancho é opcional.

Não rodei nenhum teste, como foi pedido; a auditoria é só leitura de código.

**Bloqueantes:** nenhum.

**Recomendações:**
- **`expurgo-de-acesso.int.test.ts:331`:** `toBeGreaterThanOrEqual(1)` é fraco. Dá para afirmar que as duas contas foram travadas, por exemplo com um contador dentro do gancho ou lendo os ids travados. Hoje o teste só prova a janela se a conta reconvidada entrou no lote. Com `LOTE_DO_EXPURGO = 5_000` e o banco compartilhado, na prática ela entra, mas isso não fica declarado.
- **`resolucao-de-tenant.repository.ts:457`:** o caminho de três tentativas esgotadas não tem teste. É difícil de provocar, então basta um teste de unidade com o banco falso devolvendo vazio nas duas consultas, verificando o código `INDISPONIVEL_TENTE_DE_NOVO`.
- **`expurgo-de-acesso.repository.ts:150`:** o gancho `depoisDeTravar` só existe para o teste e fica na assinatura pública. Uma opção é movê-lo para um objeto de opções nomeado (`{ depoisDeTravar }`) com um comentário de uso exclusivo em teste, para ninguém passá-lo em produção por engano.

## tenancy-guardian · 3ª rodada · APROVADO · 2026-09-19 18:03:53 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nesta rodada. `conta`, `usuario`, `convite`, `sessao` e `codigo_recuperacao` só são tocadas pela limpeza de contas, com o mesmo critério da 2ª rodada.

Queries verificadas:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`
  - `TRAVAR_CANDIDATAS` (linhas 94-100) e `LIMPAR_TRAVADAS` (linhas 102-117) usam o mesmo `SEM_USO` (linhas 66-79).
  - O convite continua amarrado à escola do próprio usuário (`cv.escola_id = u.escola_id and cv.usuario_id = u.id`).
  - Os ids da segunda instrução vêm da trava feita no banco, nunca do chamador.
  - O método devolve só a contagem.
  - O `@SemEscopo` e a justificativa ficaram iguais, e as marcações seguem cobertas por `sem-escopo.decorator.test.ts:42-43`.
  - O gancho `depoisDeTravar` só é passado pelo teste (`expurgo-de-acesso.int.test.ts:325`). O processador `apps/worker/src/processadores/expurgar-acesso.ts:45` não o passa.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:449-458`
  - `contaParaConvite` recebe apenas o e-mail, e a conta é global, então o escopo não muda.
  - Depois de 3 tentativas lança o erro tipado `INDISPONIVEL_TENTE_DE_NOVO`. Esse erro não depende de dado de nenhuma escola e não revela que um registro existe.

Teste de isolamento: presente e efetivo.
- O teste novo está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:310-332`. Se a reconferência de `SEM_USO` sair de `LIMPAR_TRAVADAS`, a conta reconvidada é limpa e a asserção da linha 329 falha.
- O teste de borda das linhas 259-308 continua provando o critério por escola do usuário: a conta com usuário ativo em outra escola fica intacta.
- Pedido: não rodei testes de integração, porque o portão com `--infra` já está rodando. O veredito vem da leitura do código.

Bloqueantes: nenhum.

Recomendações:
- `expurgo-de-acesso.int.test.ts:331`: `toBeGreaterThanOrEqual(1)` é uma asserção frouxa. Se o teste reservar um estado isolado, `toBe(1)` fixaria que só a conta esquecida entrou na contagem.

## privacy-guardian · 3ª rodada · APROVADO · 2026-09-19 18:03:54 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: `conta.email`, `conta.senha_hash`, os campos de MFA (`mfa_segredo_cifrado`, `mfa_chave_versao`, `mfa_ativado_em`, `mfa_ultimo_passo`) e `codigo_recuperacao`. Todos só são apagados ou anulados. Nesta rodada nenhum campo foi criado e nenhum foi lido para ser devolvido.

Fora da tabela de dados do docs/lgpd.md: nenhum. O diff não traz campo novo.

Autorização por objeto: ok. Nenhuma rota nova. Os dois métodos do expurgo continuam `@SemEscopo`, com justificativa, e devolvem só contagens. `contaParaConvite` mantém o contrato anterior. Depois de 3 tentativas ele lança `ErroDeDominio(INDISPONIVEL_TENTE_DE_NOVO)`, um erro tipado que não leva o e-mail (/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:457).

Logs: limpos. O processador registra só os totais do `acesso.expurgado` (/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts:54).

Auditoria: presente. Nesta rodada não entrou ação que a regra 20, item 10, obrigue a auditar. A limpeza de credencial é rotina de retenção e não lê dado de aluno.

Envio externo: nenhum.

Seed/fixture: sintético. O teste novo de concorrência usa `equipe-<uuid>@escola.invalid`, `'Pessoa sintética'` e `'hash-sintetico'` (/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:314-315).

O que conferi no diff (/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:94-160):
- **Duas instruções numa transação.** A primeira trava as contas candidatas. A segunda confere de novo o critério de conta sem uso, só sobre os ids travados. Assim, um convite que faz commit no meio da limpeza não perde o e-mail, e o teste novo prova isso nas linhas 321-330.
- **O que é apagado não mudou.** Continuam saindo o e-mail, a senha, os campos de MFA e os códigos de recuperação. As sessões abertas são encerradas com motivo `conta_limpa`.
- **Mesmo relógio.** O `encerrada_em` usa o mesmo `agora` do lote, que era a minha recomendação 1 da 2ª rodada, agora aplicada.
- **Parâmetro só de teste.** O `depoisDeTravar` só existe para o teste abrir a janela entre a trava e a reconferência. Não expõe dado.
- **Lista de ids.** Os ids vêm do próprio banco e seguem como um único parâmetro de consulta, sem entrar no texto do SQL.

Correções exigidas na rodada anterior: nenhuma.

Bloqueantes: nenhum.

Recomendações:
1. `depoisDeTravar` é um gancho só de teste num método público de produção (linha 150). Para ninguém usá-lo depois fora de teste, vale deixá-lo `@internal` ou recebê-lo por uma dependência injetada.

Pergunta de fechamento: nesta tarefa, o código responde. A limpeza da conta deixa o id, que os usuários desativados continuam apontando, sem nenhuma credencial. Os prazos de retenção estão em constantes explícitas. Não há envio externo para rastrear.

## infra-guardian · 3ª rodada · APROVADO · 2026-09-19 18:03:55 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login | migration
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum

As duas exigências da 2ª rodada foram atendidas:

- **Trava e reconferência separadas.** Em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:150-159`, `limparLoteDeContasSemUso` abre uma transação. A primeira instrução, `TRAVAR_CANDIDATAS` (linhas 94-100), trava as contas com `for update of c skip locked`. A segunda, `LIMPAR_TRAVADAS` (linhas 102-117), confere de novo `SEM_USO(agora)` só nas contas já travadas (`c.id = any($ids)`). Como o Postgres está em READ COMMITTED, essa segunda instrução lê o banco de novo e enxerga o convite que fez commit depois da trava.
- **Teste determinístico.** O teste está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:310-333`. O gancho `depoisDeTravar` grava, noutra conexão e com commit, um convite válido (`expiraHa: '-3 days'` quer dizer que vence daqui a 3 dias). A conta reconvidada mantém o e-mail e a outra conta do mesmo lote é limpa. Vocês informaram que a mutação deixa o teste vermelho. Não rodei o teste, porque o portão está com o Postgres pausado.

Outras conferências:

- **Único caminho que cria convite.** É `convite.service.ts:157`, e ele passa por `contaParaConvite`, que trava a conta com `for no key update`. Essa trava conflita com o `for update` do lote. Se o convite trava primeiro, o lote pula a conta (`skip locked`). Se o lote trava primeiro, o convite espera, lê a linha de novo, não acha mais o e-mail e cria outra conta. Nenhum outro caminho grava convite sem travar a conta, então não sobra janela depois da segunda instrução.
- **Três tentativas em `contaParaConvite`.** Depois delas sai `ErroDeDominio(INDISPONIVEL_TENTE_DE_NOVO)` em vez de `Error` cru (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:449-458`).
- **Transação curta.** Cada lote de contas é uma transação curta. O processador do worker em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts` roda os lotes um depois do outro, sem sobreposição dentro do mesmo job.

Recomendações:
- `expurgo-de-acesso.int.test.ts:332`: `expect(limpas).toBeGreaterThanOrEqual(1)` é uma asserção fraca. Ela passa com contas limpas de outros testes. Quem prova a regra são as asserções por conta das linhas 330-331. Vale isolar as contas do teste para poder exigir o número exato.
- `expurgo-de-acesso.repository.ts:104`: o array de uuid é montado juntando texto (`{a,b}`). Hoje é seguro porque os ids saem do próprio banco. Passar o array como parâmetro tipado evita que alguém copie o padrão para dado que vem de fora.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-19 18:32:36 · `tasks/prd-identidade-e-tenancy/17_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok (a seção 5 descreve o desenho de duas instruções que o código implementa; seção 3 registra a troca da FK do autor por gatilho, seção 6 lista os dois métodos `@SemEscopo` em `retencao`)
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, test, infra)`; EXIT 0 em /tmp/portao17.log, início 2026-09-19T21:02:29Z, posterior à última edição de código, 18:02:21)

Bloqueantes: nenhum.

As duas correções exigidas na 1ª rodada estão feitas e conferem com o que se pediu:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:150` — `limparLoteDeContasSemUso` trava candidatas (`for update of c skip locked`), reconfere `SEM_USO` com a visão de depois da trava e só então limpa e-mail, senha, MFA, códigos e encerra sessões abertas com `conta_limpa`. O critério é o mesmo de `limparContaSemUso` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:308`), incluindo o convite válido que segura a conta. `@SemEscopo` justificado, refletido na techspec seção 6 e no `sem-escopo.decorator.test.ts`, e `docs/lgpd.md` (linha do e-mail global) descreve a limpeza tardia pelo `sistema.expurgar-acesso`.
- Os testes exigidos existem com relógio injetado: conta segurada por convite vencido/revogado limpa, conta com convite válido e conta com usuário ativo em outra escola intactas (`/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/test/expurgo-de-acesso.int.test.ts:259`), mais a janela trava→reconferência (`:310`) e as corridas limpeza × convite em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.int.test.ts:240`.

Condição a conferir antes do commit (não é achado meu, é o critério de conclusão da tarefa): na tabela "Revisões" de `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/17_task.md`, todas as rodadas registradas começaram até 17:58, antes da última alteração de código (18:02:21) — e `infra-guardian` não tem nenhuma rodada APROVADO. O desenho de duas instruções e o parâmetro de teste nasceram depois da 4ª rodada do `test-engineer`. Se as rodadas que estão correndo em paralelo comigo não cobrirem o código de 18:02, o hook barra o commit com razão.

Recomendações:
- `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:101` — `LIMPAR_TRAVADAS` monta o array de ids por concatenação de string (`{${ids.join(',')}}::uuid[]`). Os ids vêm do próprio banco, então não há injeção, mas o padrão do repositório em outros lotes é `id = any(array(...))`/parâmetro tipado; `= any(${ids})` com o array ligado evita o formato literal feito à mão.
- `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:150` — `depoisDeTravar` é um parâmetro de produção que só o teste usa. Funciona e está comentado, mas é um segundo jeito de abrir janela de corrida no projeto; um `Relogio`/gancho já existente ou um teste com duas conexões (como o de `resolucao-de-tenant.repository.int.test.ts:266`) deixaria a assinatura pública sem ponta de teste.
- `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts:110` — a sessão é encerrada com `encerrada_em = agora` (relógio do worker), enquanto `limparContaSemUso` usa `now()` do banco para a mesma coisa. Duas fontes de hora para o mesmo campo; vale escolher uma.
