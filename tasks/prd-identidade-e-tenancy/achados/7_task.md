# Achados das revisões — `tasks/prd-identidade-e-tenancy/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-18 07:45:29 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- caminho feliz: o operador gera o convite, o coordenador consulta, aceita e vai para `configurar_mfa` sem sessão nem cookie
- privacidade do token: arquivo 0600, terminal limpo, só o hash no banco, log limpo
- concorrência: dois aceites em paralelo com o mesmo token
- borda: expirado, revogado, usado e inexistente dão a mesma resposta nas duas rotas
- isolamento: a conta que coordena B recebe convite de A
- borda: a pessoa abandona depois de `entrar`
- DTO do `consultar` sem e-mail nem nome
- permissão: não há rota de criação, e o comando recusa escola inexistente

Casos extras que o domínio pede aqui:
- a mesma conta nova convidada por A e por B, com os dois aceites ao mesmo tempo
- dois logins em paralelo ativando o convite pendente
- coordenador desativado que tenta voltar pelo convite antigo
- convite de novo para o mesmo coordenador (inativo volta a esperar; ativo dá CONFLITO)
- conta com MFA, que só é ativada depois do código
- escopo do `ConviteRepository` quando o contexto é de outra escola

**Cobertos:** todos os itens da tabela da tarefa e todos os extras acima.
- `apps/api/test/convite.int.test.ts`:
  - caminho feliz, com auditoria e validade de 72 h: linhas 211-269
  - privacidade do token: 271-293
  - aceites em paralelo com `Promise.all`: 295-311 e 313-329
  - expirado, revogado, usado e inexistente, com o corpo comparado sem o `requisicaoId`: 331-365
  - isolamento com MFA, senha de B intacta e auditoria só em A: 367-408
  - dois logins paralelos ativam uma vez: 410-420
  - abandono, convite vencido e convite revogado depois do aceite: 422-445
  - desativado depois de entrar, reconvite e CONFLITO: 447-475
  - conta nova sem senha: 477-484
  - DTO: 486-494
  - permissão, com a sentinela `GET /saude` para a lista de rotas não sair vazia: 496-535
- `apps/api/src/sessao/convite.repository.int.test.ts`:
  - escopo de B: linhas 58-73
  - cada condição de `ativarPorConvite` isolada, incluindo `usado_em >= desativado_em`: 75-91
  - concorrência: 93-97
  - falha fechada sem escola no contexto: 114-119
- `resolucao-de-tenant.repository.test.ts` passa a exigir `@SemEscopo` com justificativa nos 7 métodos novos, e nenhum no `ConviteRepository`.

Conferi pela leitura as mutações citadas (m1 e m2). Três outras quebrariam testes existentes:
- tirar o desvio `if (credencial.mfaAtivo) return pedirSegundoFator` do `login.service.ts` quebra a linha 387.
- tirar o `if (... pedido.senha === undefined) throw ENTRADA_INVALIDA` quebra as linhas 480-481.
- tirar o `gte(usadoEm, desativadoEm)` quebra a linha 79 do teste do repositório e a linha 464 do teste de integração.

Não há `.skip`, `.only` nem mock de coisa nossa. Não há chamada de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Registrar na 12.0 o que ficou para depois.** A tabela pede que o usuário pendente "não apareça em `acessos`". Isso foi adiado para a 12.0, mas `tasks/prd-identidade-e-tenancy/12_task.md` não fala em convite nem em usuário inativo. Convém acrescentar lá o cenário "usuário que espera convite aceito não aparece em `/v1/eu.acessos`", para o adiamento não se perder.
2. **Revogação no meio do login sem teste.** Em `apps/api/src/sessao/login.service.ts:73`, o caso do convite revogado entre `pendentes` e `ativar` numa conta sem outro usuário ativo cai em `NAO_AUTENTICADO`, e nenhum teste passa por essa linha. A regra está coberta no repositório; falta o desfecho no login.
3. **Nome da escola não discrimina nada.** Em `apps/api/test/convite.int.test.ts:223`, todas as escolas da bancada se chamam "Escola sintética de teste". Se o `consultar` devolvesse o nome de outra escola, esse teste não perceberia. Dar nomes distintos a A e B no teste HTTP fecha a lacuna. Hoje ela é coberta só no repositório, nas linhas 66-67.
4. **Margem de 1 s depende do relógio.** O caso "72 h + 1 s" em `apps/api/test/convite.int.test.ts:334` compara o relógio do Node com o `now()` do Postgres. Com o container atrasado mais de 1 s, o teste fica instável. Uma margem de alguns segundos, ou `expira_em` ajustado direto no banco, evita isso.
5. **Comando rodado duas vezes em paralelo sem teste.** O mesmo `ops:convite-coordenador` (mesmo e-mail e escola) em paralelo não tem teste. O código se apoia em `onConflictDoNothing` e `onConflictDoUpdate`, e o caso é raro por ser comando manual. Mesmo assim, um teste com `Promise.all` provaria uma conta, um usuário e um só convite não revogado.
6. **Token perdido se a gravação do arquivo falhar.** Em `apps/api/src/ops/convite-coordenador.ts:87`, o token é escrito depois do commit. Se essa escrita falhar, o convite fica no banco sem token recuperável. O operador resolve gerando outro, que revoga o anterior. Vale uma linha nas Notas da implementação ou no runbook.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/convite-coordenador.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/convite-coordenador.ts`

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-18 07:50:48 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. A divergência sobre o aceite de conta existente está nas "Notas da implementação" e a Tech Spec foi atualizada nas seções 5 e 6. Não foi decidida em silêncio.
Portão local: `portão local: apps/api/src/ops/comando.ts mudou em 2026-09-18 07:43:43, depois do início do último (2026-09-18 07:43:43). Rode node tools/processo/portao-local.ts de novo.`

Bloqueantes:
- `.processo/portao.json`: o `conferir` recusa o carimbo, e o hook vai bloquear o commit. O `mtime` de `apps/api/src/ops/comando.ts` (10:43:43.433Z) é 39 ms anterior ao início do carimbo (10:43:43.472Z). Mas o `avaliarCarimbo` (`tools/processo/revisoes.ts:205-206`) compara por segundo com `>=`, então a edição e o início do portão no mesmo segundo contam como alteração depois do portão. Correção exigida: rodar `node tools/processo/portao-local.ts` de novo, sem mexer em código depois, e confirmar que o `conferir` sai com código 0.

Recomendações:
- `apps/api/src/sessao/convite.service.ts:101-103,120`: a tarefa diz que a conta com senha "recusa o campo senha"; o código ignora a senha e responde `entrar`. A senha da conta nunca muda, então não é bug, e a leitura está nas notas. Ainda assim, recusar com `ENTRADA_INVALIDA` seria mais fiel ao texto e evitaria que a tela da 19.0 mostre "senha definida" a quem só deve entrar.
- `apps/api/src/sessao/resolucao-de-tenant.repository.ts:325` e `convite.repository.ts:282`: a ativação no login exige `expira_em > now()`. Quem aceita perto das 72 h e entra minutos depois fica inativo sem aviso e precisa de convite novo. É o que a Tech Spec atualizada diz, mas vale registrar isso no runbook do operador ou contar o prazo da ativação a partir do `usado_em`.
- `apps/api/src/sessao/convite.service.ts:113-115`: no aceite por conta que já tem senha, `convite.aceito` sai com o usuário convidado ainda inativo como autor, antes de ele provar a credencial. Uma saída é gravar sem `usuarioId` no contexto e deixar a autoria para `usuario.ativado_por_convite`.
- `apps/api/src/sessao/login.service.ts:101`: se `ativados.length === 0` depois da ativação (convite revogado no meio), a resposta é `NAO_AUTENTICADO`, sem `gravarFalhaDeLoginPorEmail` e com o contador já zerado. É raro e inofensivo, mas destoa do caminho de falha logo acima.
- `apps/api/src/ops/escola.ts:41-42`: sobrou uma linha em branco dupla onde saiu o `esquemaNome`.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/7_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.ts`

## privacy-guardian · 1ª rodada · REPROVADO · 2026-09-18 07:51:13 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: REPROVADO

Campos pessoais tocados: `conta.email` e `usuario.nome` do coordenador convidado, gravados pelo `ops:convite-coordenador`. A tarefa também cria a tabela `convite`, que guarda só ids, `token_hash`, `tipo` e datas. Nenhum campo de aluno.

Fora da tabela de dados do docs/lgpd.md: nada. "Convite de coordenador (hash do token, datas)" está na linha 59, com finalidade e retenção de 30 dias. Conta e usuário da equipe já estavam no mapa.

Autorização por objeto: falha na ativação por convite de conta existente. A ativação acontece no `POST /v1/sessao/login` e no MFA, e é essa a falha bloqueante descrita abaixo. `consultar` e `aceitar` estão ok: acham o convite pelo hash e usam a escola dele como contexto. O `ConviteRepository` tira o escopo do contexto e falha se ele não existir. As FKs compostas impedem convite com usuário de outra escola. Não existe rota que crie convite.

Logs: limpos. O teste de integração varre o log do aceite (que falhou e que passou) e confirma que não aparecem token, e-mail, senha nem nome. O terminal do comando mostra só o id do convite e o caminho do arquivo. Mensagens de erro têm texto fixo por código, e o erro do Postgres sai resumido por `resumirErro`.

Auditoria: presente. `convite.criado` e `convite.revogado` registram `autor_operador`. `convite.aceito` e `usuario.ativado_por_convite` registram o convidado como autor. Os esquemas são estritos e levam só ids, datas e booleanos.

Envio externo: nenhum. Não há IA nem envio de e-mail; no F1 o operador manda o link à mão.

Seed/fixture: sintético (`@escola.invalid`, "Renata Convidada Sintética").

Bloqueantes:

1. **O link aceito por uma pessoa ativa a conta de outra.**
   - **Onde:** `apps/api/src/sessao/login.service.ts:87-98`, `apps/api/src/sessao/mfa.service.ts:115-116`, `apps/api/src/sessao/convite.service.ts:79` e `:95`.
   - **O que está errado:** no caminho de conta existente, a ativação depende de duas coisas: o convite estar marcado como usado e a conta dona do e-mail fazer um login qualquer. Nada liga o login a quem aceitou o link.
   - **Cenário concreto:**
     1. O operador digita errado o e-mail. Por coincidência, é o de X, coordenadora da escola B.
     2. O operador manda o link à pessoa certa, Y.
     3. Y abre o link e recebe `entrar`. O convite fica marcado como usado.
     4. Na próxima vez que X entra na escola B (senha e MFA dela, dentro das 72 h), `AtivacaoPorConvite.pendentes` encontra o usuário de A e o ativa.
     5. X passa a ser coordenadora da escola A, com acesso aos dados dos alunos.
   - **Contradição com a documentação:** a nota da tarefa e a Tech Spec (seção 5, "Etapas") dizem que "só a credencial não basta, para um e-mail digitado errado pelo operador não ativar a conta de outra pessoa". Isso só vale enquanto ninguém aceita o link. O destinatário certo aceita, então a proteção não funciona no caso real. Isso é vazamento entre escolas por um caminho previsível, e nenhum teste o cobre.
   - **Correção exigida:**
     - O aceite de conta existente responde `entrar` com um bilhete assinado e de validade curta, ligado ao `conviteId` e ao `contaId` do convite.
     - O login por e-mail (e o MFA na sequência) só ativa o usuário pendente quando esse bilhete vem junto e a conta autenticada é a do bilhete.
     - Login rotineiro sem o bilhete nunca ativa.
     - Nota da 7.0 e seção 5 da Tech Spec corrigidas para refletir isso.
   - **Testes exigidos:**
     - convite aceito pelo link, depois login da conta dona do e-mail sem o bilhete: A continua inativo;
     - bilhete apresentado no login de outra conta: não ativa;
     - bilhete e conta certos: ativa, com `usuario.ativado_por_convite`.

Recomendações:
- Registrar em `convite.criado` se a conta já existia, sem o e-mail. Isso ajuda a auditoria a reconstituir o erro do operador.
- `aceitar` sem senha em conta nova responde `ENTRADA_INVALIDA`, e o convite inválido responde `NAO_ENCONTRADO`. Isso só distingue as duas situações para quem já tem o token de 256 bits, então é aceitável. Vale deixar escrito na Tech Spec.
- Revogar um convite não desfaz a ativação que já aconteceu. Deixar claro no README que, nesse caso, o operador precisa desativar o usuário.

Pergunta de fechamento: a tarefa não trata dado de aluno. O que ela guarda sobre o coordenador (conta, usuário, convite e as quatro ações de auditoria) é rastreável por id.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.controller.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/convite-coordenador.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/ops/revogar-convite.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0008_convite.sql`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/auditoria/acoes.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/convite.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts`.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-18 07:51:17 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO

Tabelas verificadas:
- `convite`, em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0008_convite.sql` e `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/db/schema/convite.ts`. Tem `escola_id NOT NULL`. A FK composta `(escola_id, usuario_id)` aponta para `usuario(escola_id, id)`, o que impede um convite de apontar para um usuário de outra escola. O id é UUID (`uuidv7()`). O índice `(escola_id, usuario_id)` começa pelo escopo. A tabela não varia por período, então não precisa de `anoLetivoId`. Não tem nome, e-mail nem token em claro.

Queries verificadas:
- `ConviteRepository`: `nomeDaEscola`, `usuarioConvidado`, `revogarConvitesDoUsuario`, `criarConvite`, `ativarPorConvite` e `revogar`. Todas pegam a escola do contexto e falham fechado quando o contexto não tem escola. Nenhuma recebe `escolaId` por argumento.
- `ResolucaoDeTenantRepository`, métodos novos: `conviteValidoPorHash`, `usarConvitePorHash`, `definirSenhaNoAceite`, `usuariosComConviteAceito`, `escolaPorSlug`, `contaParaConvite` e `escolaDoConviteParaOperador`. Todos têm `@SemEscopo` com justificativa escrita. O teste de `resolucao-de-tenant.repository.test.ts` confere cada justificativa e confere que o `ConviteRepository` não tem nenhum método sem escopo.
- Rotas `POST /v1/convites/consultar` e `/aceitar`: os esquemas são `.strict()`, então o corpo não aceita `escolaId`, e a query string não é lida. A escola sai do convite achado pelo hash do token. O token vai só no corpo.
- A escola dos comandos `ops:*` vem do slug (operador) ou do próprio convite (revogação), nunca do cliente.
- Expirado, revogado, usado e inexistente devolvem o mesmo `NAO_ENCONTRADO` 404 nas duas rotas, com o corpo igual. O teste compara isso.

Teste de isolamento: presente e efetivo.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.int.test.ts:58`: no contexto de B, `ativarPorConvite`, `revogar` e `revogarConvitesDoUsuario` sobre o convite de A não mudam nada, e `nomeDaEscola` devolve o nome de B. Se eu tiro mentalmente o filtro de escola do `update`, o usuário de A seria ativado e o convite seria revogado, e o teste quebra.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts:367`: se eu tiro o `where senha_hash is null`, a senha de B muda e o teste quebra. Se eu tiro a exigência de convite aceito na ativação, o teste de abandono (linha 422) quebra.

Bloqueantes: nenhum.

Recomendações:
1. **A ativação no login não prova que quem aceitou o link é a mesma pessoa que entrou.** Esse ponto pesa para a Tech Spec e para o `/validar`.
   - A nota da implementação diz que, se o operador digitar o e-mail de outra pessoa que já tem conta, o login rotineiro dela não a torna coordenadora de A. Isso só vale enquanto ninguém aceita o link.
   - O cenário: o operador erra e digita o e-mail de P, que coordena B. Ele manda o link à pessoa certa, Q. Q aceita e recebe `entrar`. No próximo login rotineiro, P é ativada como coordenadora de A sem ter pedido (`AtivacaoPorConvite.pendentes` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:87`) e passa a ver os dados de A.
   - O código segue o fluxo que a tarefa pede, por isso não bloqueia. Mas depende só de um erro do operador para vazar dado entre escolas.
   - Sugestão: ligar a ativação à posse do link. Por exemplo, o `aceitar` com conta existente devolve um desafio assinado do convite, e só o login que traz esse desafio ativa o usuário. Registrar o caso na Tech Spec (seção 5) e corrigir a nota da 7.0.
2. `ResolucaoDeTenantRepository` já tem 20 métodos `@SemEscopo`. A Tech Spec concentra ali a fronteira de propósito, mas a regra 10, item 9, pede atenção a isso. Vale conferir na seção 6 que os 7 métodos novos estão listados um a um.
3. O `CONFLITO` do `ops:convite-coordenador` ("esta pessoa já é coordenadora ativa desta escola") diz ao operador que aquele e-mail tem conta ativa na escola. Como só o operador vê, é aceitável. Fica registrado caso o comando um dia vire rota.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 07:58:13 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **O que o privacy-guardian pediu:**
  - a dona do e-mail aceita o link e depois entra no login de sempre, sem o bilhete: A fica inativo;
  - o bilhete é usado no login de outra conta: nada é ativado;
  - bilhete e conta certos: ativa, e grava `usuario.ativado_por_convite`.
- **Casos de borda:** conta com MFA (ativa só depois do código); conta sem MFA (ativa já com a senha); bilhete forjado ou quebrado; bilhete vencido (30 min); convite revogado depois do aceite; bilhete de um convite usado para ativar outro convite da mesma conta; coordenador desativado depois de entrar.
- **Permissão:** o bilhete não serve como desafio nem como token de acesso, e o desafio e o token não servem como bilhete.
- **Concorrência:** dois logins em paralelo com o mesmo bilhete ativam uma vez só.

Cobertos:
- **O login sem bilhete nunca ativa.**
  - `apps/api/test/convite.int.test.ts:394-399`: conta com MFA, login de sempre e depois o código. Continua inativo em A.
  - `convite.int.test.ts:436`: a dona do e-mail sem o bilhete.
  - `convite.int.test.ts:475-480`: login sem o bilhete de A.
  - Se a ativação sem bilhete da rodada anterior voltasse, esses três testes quebrariam.
- **Bilhete no login de outra conta** (`convite.int.test.ts:434`): falharia se o filtro por conta saísse das duas camadas. O filtro está em `AtivacaoPorConvite.pendentePeloBilhete` e também em `usuario.conta_id` na consulta. Com só uma delas removida, o teste ainda passa.
- **Bilhete e conta certos:**
  - com MFA, `convite.int.test.ts:402-421`. Continua inativo depois da senha (linha 404), ativa depois do código (linha 407) e a linha exata de `usuario.ativado_por_convite` é conferida (linhas 411-420);
  - sem MFA, `convite.int.test.ts:449-459`.
- **O convite do bilhete tem que ser o que ativa** (`convite.int.test.ts:477-479`): o bilhete de C, revogado, não ativa A, que está pendente e não revogado. Falharia se o filtro por `conviteId` saísse de `usuarioComConviteAceito`.
- **Bilhete forjado, lixo, e convite revogado usado com bilhete:** `convite.int.test.ts:438-446`.
- **Desativado depois de entrar não volta pelo bilhete antigo:** `convite.int.test.ts:503-505`.
- **Vencimento e outra chave, com a borda de 30 min ±1 s:** `apps/api/src/sessao/bilhete-de-convite.test.ts:25-33`.
- **Separação por `typ`/`aud` nos dois sentidos:** `bilhete-de-convite.test.ts:35-45`.
- **`convite_id` no desafio, que só existe quando é emitido com ele:** `apps/api/src/sessao/desafio.test.ts:28-35`.
- **O aceite responde exatamente `{ etapa: 'entrar', bilhete }`, sem cookie:** helper em `convite.int.test.ts:158-164`.
- **`contaNova` no `convite.criado`:** linhas 261 e 409.
- **Concorrência de verdade:** `Promise.all` com o mesmo bilhete, e uma única auditoria (`convite.int.test.ts:455-458`).
- Não achei `.skip`, teste comentado nem mock que esconda a regra. Nenhum teste chama provedor de IA.

Bloqueantes: nenhum

Recomendações:
- **Convite vencido depois do aceite.** A condição `expira_em > now()` saiu da ativação (`resolucao-de-tenant.repository.ts`, `usuarioComConviteAceito`), então o prazo depois do aceite passou a ser só o do bilhete. Não há teste de integração para o caso "aceito antes do vencimento, login com bilhete válido depois das 72 h, e ainda ativa". Hoje isso só está documentado. Vale um teste que fixe o comportamento escolhido, para ninguém reintroduzir a condição sem perceber.
- **Conta com MFA cujos outros usuários foram todos desativados.** Se ela aceita o convite de A, `LoginService.entrarPorEmail` segue para `mfa` pelo `esperaCodigo`, mesmo com zero usuários ativos. Nenhum teste cobre esse ramo, nem o espelho dele, em que o convite é revogado entre a senha e o código e o `MfaService` tem de responder `NAO_AUTENTICADO` sem ativar.
- **Bilhete que passa do tamanho.** Não há teste de contrato para `bilhete` acima de 1.024 caracteres em `esquemaPedidoLoginEmail`, onde o esperado é 400, e não "ignorado".
- **Nome de teste desatualizado.** O teste em `convite.int.test.ts:524` ainda se chama "aceitar só a etapa e o desafio". O caminho `entrar` agora tem `bilhete`. A asserção cobre, mas o nome pode mencionar os dois formatos.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/bilhete-de-convite.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/bilhete-de-convite.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/conclusao-de-login.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/login.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/sessao/convite.ts`

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-18 08:03:31 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO

A correção exigida na 1ª rodada foi feita. Auditei lendo, sem rodar testes, porque o portão local já estava verde.

**Campos pessoais tocados:** e-mail e nome do coordenador. Os dois chegam só como argumento do `ops:convite-coordenador`, e só o e-mail é gravado, em `conta.email`. A tabela `convite` guarda o hash do token e datas. O novo bilhete leva só `conta_id` e `convite_id`. O desafio ganhou só o claim opcional `convite_id`.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. O convite está em `docs/lgpd.md:59`, com finalidade e retenção. O bilhete não é gravado em lugar nenhum.

**Autorização por objeto:** ok.
- **Qual conta pode ativar:** `AtivacaoPorConvite.pendentePeloBilhete` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts:175-180`) só ativa quando a conta do bilhete é a mesma que acabou de provar a senha. `usuarioComConviteAceito` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts:526`) filtra pela conta e pelo convite do bilhete.
- **Login rotineiro:** sem bilhete, nada é ativado (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts:363`).
- **Conta com MFA:** a ativação fica para depois do código. O `conviteId` vai assinado no desafio e o `MfaService` só ativa depois do acerto (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts:420-421`).
- **Conta de aluno:** nunca é ativada por convite.
- **Respostas iguais:** convite expirado, revogado, usado ou inexistente dá a mesma `NAO_ENCONTRADO`. Bilhete vencido, forjado ou de outra conta é ignorado sem mudar a resposta do login.
- **Separação dos tokens:** o bilhete (`typ: convite+jwt`, `aud: sessao`) não passa por token de acesso nem por desafio.

**Logs:** limpos. Não há logger nos arquivos novos. Os comandos do operador imprimem só o id do convite e o caminho do arquivo, e os erros saem com texto fixo ou `resumirErro`, sem o valor recebido.

**Auditoria:** presente. Ficam registrados `convite.criado` (com operador e `contaNova`, sem e-mail), `convite.revogado`, `convite.aceito` e `usuario.ativado_por_convite` (com o `conviteId`). A ativação e a auditoria acontecem na mesma transação, e dois logins ao mesmo tempo ativam uma vez só.

**Envio externo:** nenhum. O link é mandado à mão pelo operador no F1.

**Seed/fixture:** sintético.

**Correção exigida na rodada anterior:** feita.
- O aceite com conta existente responde `entrar` com um bilhete de 30 min, ligado à conta e ao convite.
- Os três testes exigidos estão em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite.int.test.ts`:
  - login da dona do e-mail sem bilhete, com A continuando inativo: linhas 379 e 426;
  - bilhete no login de outra conta, que não ativa: linha 426;
  - bilhete e conta certos, que ativam com `usuario.ativado_por_convite`: linhas 379 e 449.
- Há também casos extras: bilhete forjado, convite revogado depois do aceite, usuário desativado depois de entrar.
- A nota da 7.0 e as seções 4, 5 e 6 da Tech Spec foram atualizadas.

**Pergunta de fechamento:** o código responde. Os registros de auditoria acima reconstituem a criação do convite, a conta usada, o aceite, a ativação e a revogação, sem guardar o e-mail na auditoria. Nada foi enviado a terceiros.

**Bloqueantes:** nenhum.

**Recomendações:**
1. Na tela do `/entrar` (tarefa de frontend), o bilhete deve ir por estado em memória ou pelo corpo, nunca por query string, para não parar em histórico nem em log de borda. Vale registrar isso como exigência na tarefa da tela, como já foi feito com a janela de 2 s da renovação.
2. Se a pessoa com conta existente aceitar o link e não entrar em 30 min, o convite fica usado e o usuário fica inativo, e só um convite novo do operador resolve. Vale uma linha no README ou no runbook explicando essa saída ao operador.
3. Quem tiver o link de uma conta existente consegue gastar o convite sem ativar nada. É só um incômodo, não um vazamento, e o reenvio pelo operador cobre. Vale registrar no `/retro`.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-18 08:03:42 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** `convite` (tem `escolaId`, id UUID e FK composta para `usuario`), `usuario` e `conta`. `conta` é global por desenho da seção 6. Nesta rodada não entrou tabela nova.

**Queries verificadas:**
- `ResolucaoDeTenantRepository.usuarioComConviteAceito(contaId, conviteId)`: tem `@SemEscopo` com justificativa, filtra por conta e por convite, só aceita convite usado e não revogado com `usado_em >= desativado_em`, e devolve só ids e papel.
- `ConviteRepository.ativarPorConvite`: a escola vem do contexto. Sem a condição `expira_em > now()`, o prazo depois do aceite passa a ser o do bilhete (30 min). O usuário desativado depois de entrar continua barrado pela condição `usado_em >= desativado_em`, e o convite revogado também fica barrado.
- `AtivacaoPorConvite.pendentePeloBilhete` e `pendenteDoConvite`: a ativação roda no contexto da escola do convite. `contaId` e `conviteId` saem de JWT que nós assinamos (bilhete ou desafio `mfa`), nunca do corpo em texto livre.
- `LoginService`: o bilhete só é conferido depois da senha certa. Bilhete inválido, forjado ou de outra conta é ignorado sem resposta diferente, então não revela nada.
- `MfaService`: ativa só depois do código e só com o `convite_id` do desafio da mesma conta.
- `BilheteDeConvite` e `desafio`: `typ` e `aud` separados, e nenhum dado da pessoa. Nenhum endpoint aceita `escolaId` de fora.

**Correções exigidas na rodada anterior:**
- Recomendação 1 (ligar a ativação à posse do link): feita.
- Recomendação 2 (seção 6 da Tech Spec citando os métodos): feita. `usuarioComConviteAceito` está na linha 261 de `tasks/prd-identidade-e-tenancy/techspec.md`, e o teste de `resolucao-de-tenant.repository.test.ts` confere a lista de métodos e as justificativas.

**Teste de isolamento:** presente e efetivo.
- `apps/api/test/convite.int.test.ts:426` quebra se o bilhete de outra conta ativar o convite, ou se o login sem bilhete ativar.
- `apps/api/test/convite.int.test.ts:461` quebra se o convite revogado depois do aceite ativar.
- `apps/api/src/sessao/convite.repository.int.test.ts:57` quebra sem o `escolaId` do contexto em `ativarPorConvite`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. A regra "o bilhete de outra conta não ativa" tem duas proteções: a comparação `verificado?.contaId !== contaId` em `apps/api/src/sessao/convite.service.ts:109` e o filtro `eq(usuario.contaId, contaId)` em `apps/api/src/sessao/resolucao-de-tenant.repository.ts`. O teste de ponta a ponta só quebra se as duas forem removidas. Vale um teste de integração de `usuarioComConviteAceito` com a conta errada e o convite certo, esperando `undefined`, para o filtro do repository ter prova própria.
2. O bilhete é um JWT e qualquer um lê o conteúdo sem a chave. Quem aceita o link recebe nele o `conta_id` da dona do e-mail, o que importa quando o operador digitou o e-mail errado. Não vaza dado pessoal, e a etapa `entrar` já revela que a conta existe. Se quiserem esconder o id da conta, dá para assinar só o `convite_id` e resolver a conta no servidor.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-18 08:03:48 · `tasks/prd-identidade-e-tenancy/7_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. O `conferir` respondeu "portão local válido para o código atual (typecheck, lint, test)".
Bloqueantes: nenhum

**Correções exigidas antes desta rodada**
- **Portão local da 1ª rodada:** resolvido. O carimbo vale para a árvore atual.
- **Exigência do `privacy-guardian`:** a ativação por convite agora depende de quem tem o link. O login só ativa o usuário que espera o convite com duas condições juntas: o bilhete precisa conferir com a conta que provou a senha, em `apps/api/src/sessao/convite.service.ts:175-179`; e a credencial precisa estar completa. Numa conta com MFA, a ativação acontece só em `apps/api/src/sessao/mfa.service.ts:117-118`, depois do código, com o `convite_id` levado no desafio assinado.
- **Recomendações que fiz na rodada anterior:** as três foram feitas. A ativação sem MFA vem antes da contagem de usuários e, se não sobra usuário, cai no caminho de falha com registro e contador. O `expira_em` saiu da ativação e o prazo passou a ser o do bilhete. `convite.criado` ganhou `contaNova`.
- **Alterações de texto:** a Tech Spec foi atualizada nas seções 4, 5 e 6, junto com a contagem de `@SemEscopo`, e a nota de implementação registra a contradição resolvida. O cenário de `acessos` foi para a 12.0, com o motivo escrito. Nenhuma divergência ficou sem registro.

Recomendações:
- **Senha curta de quem já tem conta:** em `packages/shared/src/sessao/convite.ts`, o `senha` com mínimo de 12 vale também para a conta que já tem senha. Nesse caminho a senha é ignorada. Mesmo assim, uma senha curta enviada ali recebe `ENTRADA_INVALIDA` em vez de `entrar`. O comportamento fica diferente do caminho ignorado, embora a web da 19.0 não deva mandar senha nesse caso. Vale anotar para a 19.0.
- **Quebra de linha em `apps/api/src/sessao/mfa.service.ts:49`:** o item "Fim" do comentário da classe passou da largura em que os outros quebram. É só formatação.

Arquivos centrais da revisão:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/bilhete-de-convite.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/convite.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/login.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/mfa.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/resolucao-de-tenant.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/7_task.md`
- `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-identidade-e-tenancy/techspec.md`
