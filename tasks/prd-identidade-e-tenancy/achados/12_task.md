# Achados das revisões — `tasks/prd-identidade-e-tenancy/12_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-18 12:56:34 · `tasks/prd-identidade-e-tenancy/12_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- Caminho feliz: login por e-mail, depois `escolher` A, depois troca para B. A sessão de A fica encerrada com motivo `troca_de_escola`.
- Isolamento:
  - a turma de A, lida com o token de B, dá 404 igual a turma inexistente;
  - o token antigo de A dá 401;
  - `usuarioId` de outra conta dá 404, em `escolher` e na troca.
- Borda de MFA:
  - destino coordenador exige MFA, e sem o código a sessão de A continua e nenhuma sessão de B existe;
  - quem sai de A antes do código não ganha a sessão de B;
  - destino sem MFA configurado leva a `configurar_mfa`.
- Borda de inatividade: a regra do destino (60 min) vale sobre a da origem (120 min).
- Permissão: sessão de aluno, de matrícula e externa dá 404.
- Borda de fim de vínculo: a professora que saiu de B em março some de `acessos`, e A continua funcionando.
- Borda de convite: a coordenadora que ainda espera o convite (7.0) não aparece em `acessos` e não é alcançável.
- Concorrência de verdade, com duas chamadas em paralelo: troca e `escolher`.
- Privacidade (RF18) em `/v1/eu.acessos`.
- Segurança da rota nova: um JWT que diz no cabeçalho ser desafio, mas é falso, não pode abrir nada. Isso é consequência do `@AceitaDesafio`, que faz as quatro guardas tratarem a requisição como anônima.

**Cobertos:** todos os cenários da tabela da tarefa, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts`.
- **Os testes falhariam sem a regra:**
  - sem o filtro por conta, falham o teste de outra conta (linha 295) e o de privacidade (linha 513, com a outra conta em B);
  - sem o filtro de desativado, falham o de março (linha 439) e o do convite (linha 459);
  - sem o `update` condicional, o teste de concorrência (linha 482, com `Promise.all`) acharia duas sessões em B;
  - sem a regra do destino, o teste de inatividade (linha 397) daria 200.
- **Isolamento do repositório:** `sessao-de-origem.repository.int.test.ts` cobre o escopo pela escola do contexto e a recusa de outra conta ou de método que não é e-mail.
- **Desafio:** `desafio.test.ts` cobre destino e origem no desafio, e recusa a origem incompleta.
- **Guardas:** `rota-sem-sessao.test.ts` cobre a decisão das guardas.
- **Outros pontos checados:** não há `.skip` nem mock escondendo a regra, e nenhuma IA é envolvida.

**Bloqueantes:**
1. **`apps/api/test/troca-de-escola.int.test.ts:295`: falta provar, na rota, que o cabeçalho `typ: desafio+jwt` não é confiado.**
   - **O problema:** com esse `typ`, as guardas de autenticação, sessão, permissão e limite deixam passar a requisição de `POST /v1/sessao/escola`. Aí a única defesa é a chamada `verificarDesafio(...)` em `troca-de-escola.service.ts:43`.
   - **O que os testes provam hoje:** `rota-sem-sessao.test.ts:61` mostra que `bearerDeDesafio` aceita JWT assinado com outra chave. O único teste de integração da rota com um desafio inválido usa o desafio `mfa` (linha 344), que é bem assinado e tem só a etapa errada.
   - **O risco:** se o service passasse a só decodificar o JWT e conferir a etapa, nenhum teste falharia.
   - **Correção exigida:** um teste de integração que mande a `POST /v1/sessao/escola` três desafios `escolher` com `conta_id` real da professora e `usuarioId` válido dela:
     - (a) assinado com outra chave;
     - (b) vencido;
     - (c) com `aud` diferente de `sessao`.

     Os três devem dar 401 `NAO_AUTENTICADO`, sem `Set-Cookie` e sem nenhuma linha em `sessao` para esse usuário.

**Recomendações (não bloqueiam):**
- `troca-de-escola.int.test.ts:325`: depois do código, conferir que `registro_acesso` de B tem um único `login` do coordenador. A 12.2 exige o registro também no caminho do MFA, e hoje ele só é provado na troca direta.
- Faltam casos pelo token, e não pelo `escolher`:
  - destino coordenador sem MFA configurado leva a `configurar_mfa` e não encerra a origem (hoje isso só é provado na linha 372, pelo `escolher`);
  - coordenadora em A trocando para coordenação em B também é cobrada do MFA. Isso prova a escolha registrada nas notas da tarefa de pedir o MFA sempre na troca pelo token.
- Fluxo do MFA: o usuário de destino é desativado entre a emissão do desafio `mfa` e o código. O esperado é 401 e nenhuma sessão, com a origem ainda aberta.
- Troca para o próprio usuário da sessão atual: registrar e provar o comportamento, que hoje encerra e recria a sessão na mesma escola.
- Limite: provar que o caminho do desafio em `/v1/sessao/escola` consome o balde anônimo por IP, e não fica sem limite. É assunto do `infra-guardian`, mas o teste seria da tarefa.
- Privacidade (linha 513): a asserção em ordem depende de "Colégio" vir antes de "Escola" no `orderBy(escola.nome)`. Vale deixar isso explícito num comentário ou usar prefixos que não deixem dúvida.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/troca-de-escola.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessao-de-origem.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessao-de-origem.repository.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/rota-sem-sessao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/rota-sem-sessao.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.test.ts`

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 13:02:13 · `tasks/prd-identidade-e-tenancy/12_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** a correção da 1ª rodada. Um desafio `escolher` assinado com outra chave, um vencido e um com `aud` diferente de `sessao`, todos com o `conta_id` real da professora e um `usuarioId` válido, mandados a `POST /v1/sessao/escola`. Os três precisam dar 401 `NAO_AUTENTICADO`, sem `Set-Cookie` e sem nenhuma linha em `sessao`. Conferi também os testes acrescentados e a mudança em `ops-escola.int.test.ts`.

**Cobertos:**
- **A correção foi feita** (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts:327-358`). Cada desafio falso é mandado duas vezes, com o `usuarioId` de A e com o de B. Os três casos pedem 401, `NAO_AUTENTICADO` e `Set-Cookie` vazio, e depois nenhuma sessão em A nem em B.
  - Cada caso falha sozinho se a verificação correspondente sair de `verificarDesafio` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts:97-104`).
    - O desafio de outra chave sai do `EmissorDeDesafio`, que põe `typ: desafio+jwt`. Então só a assinatura o recusa.
    - O vencido usa a chave verdadeira com o relógio recuado além dos 5 min. Só `exp` e `maxTokenAge` o recusam.
    - O de outro `aud` usa `typ` e `iss: 'educa'` corretos: conferi que `EMISSOR_TOKEN` vale `'educa'`. Então só a audiência o recusa.
  - O controle com o desafio verdadeiro no fim dá `pronta`. Isso mostra que os 401 vêm da verificação, e não de a rota estar quebrada por outro motivo.
- **Recomendações da 1ª rodada que foram aplicadas:**
  - O registro de acesso de B fica com um único `login` da coordenadora depois do código (`:387-388`).
  - Coordenação em A não dispensa o código para a coordenação de B, e a conta sem MFA leva a `configurar_mfa` sem encerrar A (`:391-422`).
  - Destino desativado entre a troca e o código (`:424-440`).
  - Troca para o próprio usuário da sessão (`:442-455`).
  - Em todos eles a asserção é sobre o estado: sessões no banco, 401 do token antigo, `motivo`. Nenhum se limita a conferir o status da resposta.
- **`ops-escola.int.test.ts:163-166`:** a rota entra na lista de permitidas com justificativa, e a lista continua fechada. Faz sentido: a rota recebe só `usuarioId`, e a escola vem do banco. O teste continua pegando uma rota nova que crie escola ou rede.
- Não há `.skip`, teste comentado nem mock escondendo a regra. As duas concorrências (`:585`, `:603`) seguem em paralelo de verdade.

**Bloqueantes:** nenhum.

**Recomendações:**
- `troca-de-escola.int.test.ts:339`: importar `EMISSOR_TOKEN` em vez de escrever `'educa'` à mão. Se o emissor mudar, o caso de outro `aud` passaria a ser recusado pelo `iss` e deixaria de provar a audiência sem ninguém perceber.
- `:357`: o controle aninha três chamadas numa linha. Separar em passos com `expect(status).toBe(200)` deixa mais claro o motivo quando ele falhar.

Não rodei nenhum teste. A auditoria foi só por leitura, como você pediu.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 13:27:15 · `tasks/prd-identidade-e-tenancy/12_task.md`

VEREDITO: APROVADO
Tabelas verificadas: nenhuma tabela nova e nenhuma migration. As tabelas que a tarefa usa são `sessao`, `usuario`, `escola`, `conta` e `registro_acesso`. Os ids são UUID, e o corpo da requisição valida `usuarioId` com `z.uuid()` em modo estrito.
Queries verificadas:
- **`SessaoDeOrigemRepository.metodoEConta` e `encerrarParaTroca`:** filtram pela escola do contexto (`exigirEscolaDoContexto()`), e não por argumento. `encerrarParaTroca` também confere `conta_id`, `metodo = 'email'` e `encerrada_em is null`.
- **`ResolucaoDeTenantRepository.acessosDaConta`:** é um `@SemEscopo` novo, com justificativa escrita. A `contaId` vem do usuário da sessão lido com escopo em `EuRepository.doContexto`, nunca do cliente. A consulta traz só `usuarioId`, `escolaNome` e `papel`, apenas de usuários ativos que não são aluno.
- **`TrocaDeEscolaService.#destinoDaConta`:** a escola de destino sai do banco. Ela só é lida depois que o `usuarioId` é conferido entre os usuários ativos de equipe da conta, seja a do desafio assinado, seja a da sessão verificada. O corpo não aceita `escolaId`.
- **`MfaService` com `destinoUsuarioId`:** o destino é conferido de novo contra a conta do desafio. A origem (`origem_esc` e `origem_sid`) vem só do JWT assinado, e só é aceita inteira.
- **`ConclusaoDeLogin.#criarSessao`:** a origem é encerrada no contexto da escola dela, e a sessão nova é criada no contexto do destino, dentro da mesma transação.
- **`rotaSemSessao` e `@AceitaDesafio`:** tratam a requisição como anônima só naquela rota, e só com `typ: desafio+jwt`. O service verifica assinatura, `aud`, prazo, etapa e `jti`. Um cabeçalho forjado não abre nada, e os testes cobrem outra chave, desafio vencido, outro `aud` e o desafio `mfa` usado como escolha.

Teste de isolamento: presente e efetivo.
- `apps/api/test/troca-de-escola.int.test.ts:275` falharia se a sessão nova ficasse presa a A. O teste de controle antes da troca prova que o 200 vinha do vínculo.
- `apps/api/test/troca-de-escola.int.test.ts:297` falharia sem a conferência do `usuarioId` contra a conta: uma sessão de B seria gravada, e o 404 não seria igual ao do id inexistente.
- `apps/api/test/troca-de-escola.int.test.ts:258` falharia se a origem não fosse encerrada.
- Os testes das linhas 521, 542 e 562 cobrem sessão de matrícula ou externa, usuário desativado e convite pendente, todos com o mesmo 404 e sem gravar nada.

Bloqueantes: nenhum

Recomendações:
- **`@SemEscopo` demais no mesmo repository.** `apps/api/src/sessao/resolucao-de-tenant.repository.ts:354` leva a 21 os `@SemEscopo` desse repository, e a regra 10, item 9, trata a terceira no mesmo módulo como sinal de desenho errado. `acessosDaConta` repete o filtro de `usuariosAtivosDaConta`: dá para unificar num método só, com o join em `escola`, que sirva ao `/v1/eu` e à troca. Registrar para o `/retro`.
- **Cláusula de conta sem teste próprio.** Nenhum teste isola o `eq(sessao.contaId, contaId)` em `apps/api/src/sessao/sessao-de-origem.repository.ts:42`. É defesa em profundidade, porque a origem já vem de sessão verificada ou de desafio assinado, mas um teste de repository com uma sessão de outra conta na mesma escola fixaria a cláusula.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-18 13:27:22 · `tasks/prd-identidade-e-tenancy/12_task.md`

VEREDITO: APROVADO

**Campos pessoais tocados:**
- Nenhum campo pessoal novo.
- A tarefa escreve em `sessao`, marcando `encerrada_em` e o motivo `troca_de_escola`. Esse valor já existe no CHECK da migration 0005 e em `MOTIVOS_DE_ENCERRAMENTO`.
- Também escreve em `registro_acesso`, com o evento `login` gravado na escola de destino.
- Passa a ler `usuario.conta_id` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/eu.repository.ts`. Essa leitura serve só para montar `acessos` e não sai na resposta, porque o esquema é `.strict()` e o service mapeia campo a campo.
- `acessos` expõe `usuarioId`, `escolaNome` e `papel` das outras escolas da mesma conta. Nome de escola não é dado pessoal, e a seção 7 da Tech Spec prevê exatamente isso.

**Fora da tabela de dados do docs/lgpd.md:** nada. A sessão, com método, motivo e conta, está na linha 54. O registro de acesso está na linha 61.

**Autorização por objeto:** ok.
- **A escola de destino nunca vem do cliente.** O corpo aceita só `{ usuarioId }`. `#destinoDaConta` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/troca-de-escola.service.ts` só aceita um usuário ativo de equipe da conta, e essa conta vem do desafio verificado ou da sessão lida no escopo da guarda.
- **Respostas iguais.** Um id de outra conta, de alguém desativado, de aluno ou inexistente recebe o mesmo `NAO_ENCONTRADO`. Sessão de matrícula ou externa e o aluno pela matriz (`nunca` → 404) também recebem esse mesmo 404.
- **Encerramento da origem conferido.** O `update` que encerra a sessão de origem confere escola do contexto, `conta_id`, `metodo = 'email'` e `encerrada_em is null`.
- **O cabeçalho `typ: desafio+jwt` não abre nada sozinho.** O service verifica assinatura, `aud`, prazo, etapa e `jti`, e há teste para chave errada, desafio vencido e `aud` trocado.
- **O MFA não é contornado.** Na troca pelo token, o segundo fator é pedido sempre que o destino é coordenador. O desafio `mfa` leva só ids, e a origem precisa vir inteira ou é recusada.

**Logs:** limpos. Nenhum log foi acrescentado no diff.

**Auditoria:** presente onde a regra exige. A troca não é leitura de dado de aluno por coordenação ou rede, nem exportação, alteração de nota, alteração de permissão ou aprovação de saída de IA. O rastro fica em `registro_acesso` (login no destino) e em `sessao.motivo = 'troca_de_escola'` na origem.

**Envio externo:** nenhum.

**Seed/fixture:** sintético. Os testes usam "Pessoa sintética" e ids gerados.

**Pergunta de fechamento:** o código responde para esta tarefa. A troca não cria dado sobre aluno: o aluno não tem conta, `acessos` vem vazio para ele e a rota dá 404. O que é gravado sobre a equipe fica em tabelas escopadas por escola, com retenção declarada.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Na troca, a origem não ganha um evento `saida` em `registro_acesso`. O motivo gravado na sessão já registra o encerramento, mas a sessão guarda 30 dias e o registro de acesso guarda 6 meses. Depois de 30 dias, o rastro de que a sessão de A foi encerrada por troca some. Fica para o `/retro` avaliar se vale gravar `saida` na escola de origem.
2. `acessosDaConta` leva a contagem de `@SemEscopo` a 21 no `ResolucaoDeTenantRepository`. A justificativa está correta e testada. A contagem é assunto do `tenancy-guardian`, e fica registrada só como observação.
3. No teste de privacidade de `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/troca-de-escola.int.test.ts` (linhas 616 a 635), valeria também afirmar que o `nome` do usuário de B não aparece no corpo de `/v1/eu` quando a sessão é de A. Hoje o esquema estrito já garante isso, e a asserção só daria cobertura extra.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-18 13:27:34 · `tasks/prd-identidade-e-tenancy/12_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As três subtarefas estão feitas. Não há tela, nem troca pelo login externo, nem redefinição de MFA, que pertencem às tarefas 20.0, 13.0 e 6.0. As mudanças nas quatro guardas de `@educa/nucleo` são o mínimo para a rota aceitar o desafio. `eu.service.ts` foi alterado no lugar do `eu.controller.ts` previsto, o que respeita a regra 00, item 2 (controller sem regra).

Aderência à Tech Spec: ok. A rota aceita o desafio `escolher` ou o token de uma sessão de e-mail, como a seção 4 já previa. A origem é encerrada na mesma transação com motivo `troca_de_escola`, e o MFA e a inatividade valem os do destino. Duas coisas foram acrescentadas e estão escritas na própria `techspec.md` (seção 4 e contagem de `@SemEscopo` agora em 21) e nas "Notas da implementação" do `12_task.md`:
- `@AceitaDesafio`;
- `origem_esc` e `origem_sid` no desafio `mfa`.

Como estão declaradas, não contam como divergência silenciosa. Mesmo assim, o Joaquim precisa ratificá-las, como aconteceu na 10.0 e na 11.0.

Portão local: carimbo válido (typecheck, lint, test, infra).

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts`: `export { TIPO_DESAFIO }` reexporta a constante que agora mora em `@educa/nucleo`. Assim, o mesmo símbolo passa a ter dois caminhos de import. Vale trocar os imports antigos para `@educa/nucleo` e remover a reexportação.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/troca-de-escola.service.ts:88`: o service cria `new SessaoDeOrigemRepository(this.dependencias.banco)` direto, enquanto as outras dependências chegam por `DependenciasDaTroca`. Vale passar o repositório pelas dependências também, para seguir o padrão do próprio service.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/troca-de-escola.controller.ts:30`: a escolha entre `escolher` e `trocar` pelo `typ` do cabeçalho existe no controller e também em `rotaSemSessao`. Hoje as duas batem, porque usam a mesma `bearerDeDesafio`. Se no futuro alguém mudar uma sem a outra, uma requisição pode ser tratada como anônima pelas guardas e cair no caminho autenticado, ou o contrário. Vale um comentário ligando os dois pontos, ou centralizar a decisão.
- A origem não ganha `saida` em `registro_acesso` na troca (nota declarada). Hoje só o motivo na sessão registra o encerramento, o que é aceitável. Vale confirmar essa escolha na ratificação, porque a pergunta "quando essa pessoa saiu da escola A" passa a depender da tabela `sessao`, e não do registro de acesso.
