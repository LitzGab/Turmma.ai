# Achados das revisões — `tasks/prd-reengenharia/16_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 18:56:25 · `tasks/prd-reengenharia/16_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma. A tarefa não tem migration nem tabela nova.

Queries verificadas:
- **`RedefinicaoDeMfaRepository`** (`apps/api/src/sessao/redefinicao-de-mfa.repository.ts:15`): continua com `eq(usuario.escolaId, exigirEscolaDoContexto())`, ou seja, o escopo vem do contexto. O `IdPipe({ invalidAsUndefined: true })` mantém a conversão do id para minúsculas, que antes era o `toLowerCase()` do controller.
- **`ResolucaoDeTenantRepository.escolaPorSlug`**: não mudou. Agora só os controllers a alcançam, porque `AcessoDaEscolaService.ler` e `LoginExterno.iniciar` não têm outro chamador fora deles.
- **`painel.controller`**: `gerarConvite`, `refazerConvite` e `revogarConvite` recebem o id pelo `IdPipe`. Id fora do formato dá `NAO_ENCONTRADO`.
- **`escolaId` vindo do cliente**: nenhum endpoint passou a aceitar.
  - `esquemaPedidoTrocaDeEscola` é `{ usuarioId }.strict()`. Os testes provam que `escolaId` no corpo dá 400 nas duas rotas.
  - `esquemaConsultaDoPainel` recusa `escolaId` na query, e o teste novo de `painel-escrita.int.test.ts` prova isso.
  - Os logins por e-mail e por matrícula recusam `escolaId` no corpo.
  - O `slug` do login por matrícula é a resolução anônima que já existia (o endereço da escola), e não é escopo autenticado.

Teste de isolamento: presente e efetivo.
- **Escola de outra escola nas rotas tocadas:** os testes de isolamento que já existiam continuam válidos para o comportamento que a tarefa mexe.
  - `mfa.int.test.ts:462`: usuário só de B, no contexto de A, dá 202 sem efeito.
  - `troca-de-escola.int.test.ts`: `usuarioId` de B dá o mesmo 404 do inexistente.
  - `acesso-da-escola.int.test.ts`: o repository lê só a escola do contexto.
- **Regra 10.6 no que a tarefa acrescenta:** `slug` e `provedor` fora do formato respondem o 404 do inexistente. As mutações que tiram o pipe ou o `errorCode` deixam o teste vermelho, e o byte nulo prova o pipe sem a segunda conferência do service.
- **Formato do id:** id fora do formato no `redefinir-mfa` dá 202 sem efeito e sem rastro na auditoria. No painel dá 404. As duas mutações do `IdPipe` estão declaradas.

Bloqueantes: nenhum.

Recomendações:
- `apps/api/src/sessao/acesso-da-escola.service.ts:20` e `apps/api/src/sessao/externa/externa.service.ts:99`: os services deixaram de conferir o formato do `slug` e passaram a confiar no controller. Hoje não vaza nada, porque o único chamador é o controller e a consulta parametrizada não cruza escola. Mas uma chamada futura vinda de outro caminho, como um job ou outro módulo, entra sem conferência. Vale registrar no docblock que o contrato do método exige o `slug` já validado. A alternativa é tipar o `slug` como um tipo nominal produzido só pelo esquema.
- O `slug` digitado no caminho (`acesso-da-escola`) e na query (`externa`) não é tratado do mesmo jeito: só o da query é cortado por `.trim()`. Não fura o isolamento, mas é uma diferença a alinhar quando a tela `/e/:slug` for revista.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 18:57:41 · `tasks/prd-reengenharia/16_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

O que conferi para chegar aqui:
- **Controllers:** os 12 de `sessao/` e os 6 de `operacao/` estão migrados. Os que não leem entrada (`atividade`, `eu`, `renovacao`, `saida`, `operacao/eu`) não precisavam mudar. O `@Req()` ficou só onde se lê cookie, `Authorization` ou IP.
- **Ordem dos erros:** a troca do 401 pelo 400 em `/conta/mfa/ativar` e em `/sessao/mfa` já estava prevista em `onda-1a.md` T1 ("mudança declarada na 16.0"). A tarefa a registrou, com o motivo, na T1 e no docblock.
- **Validação do slug e do provedor:** a conferência de formato saiu de `AcessoDaEscolaService.ler` e de `LoginExterno.iniciar`. Os dois services só são chamados pelos controllers (`sessao.module.ts:210`, `:220`). O `esquemaSlugDaEscola` usa as mesmas constantes de `estrutura/rede-e-escola.ts` que o service usava. O slug ausente ou repetido continua dando o 404 de antes.
- **Ordem entre caminho e corpo:** no `gerarConvite`, no `refazer` e no `revogar` ela não muda, porque o corpo já era conferido antes do id. No `redefinir-mfa` o comportamento é o que a T1 pede: id fora do formato com corpo válido dá 202 sem efeito, com corpo inválido dá 400.
- **ESLint:** o segundo bloco vem depois do primeiro e por isso o vence, como a T1 descreve. A divergência (6) explica por que os dois módulos ficam também no primeiro.
- **Higiene:** não há `any`, `.skip`, `TODO` nem `eslint-disable` no diff.
- **Onde as divergências estão registradas:** as seis estão em `onda-1a.md` T1, no comentário do ESLint ou no docblock que a coluna "Onde está na spec" aponta. Esta spec não tem `cenarios.md`.

Recomendações:
1. **`retorno` lê a consulta por fora do pipe.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sessao/externa/externa.controller.ts:50`, `retorno` lê a consulta de `requisicao.url`. Os seletores do lint não pegam isso: barram só `requisicao.body`, `.query` e `.params`. É o jeito certo de entregar a URL de volta do OIDC ao `openid-client`, mas não está nos motivos do segundo bloco (`eslint.config.mjs`, o comentário do bloco de `sessao` e `operacao`). Vale nomear lá esse terceiro uso do `@Req()`, para a 17.0 não tratar como furo nem copiar para outro módulo.
2. **`esquemaSemCorpo` aparece duas vezes.** Está em `apps/api/src/operacao/painel.controller.ts:24` e em `apps/api/src/operacao/sessao.controller.ts:9`, e o `revogar` da 15.0 tem uma terceira cópia. Um `esquemaPedidoSemCorpoDeOperador.default({})` exportado de `packages/shared` tira a repetição.
3. **A mutação do `files` com `{sessao}` mede outra coisa.** Chaves com um item só não são expandidas pelo minimatch, então a mutação tira `sessao` e `operacao` do bloco, e não só `operacao`. O teste fica vermelho do mesmo jeito, mas `apps/api/src/sessao/**/*.controller.ts` diria com mais precisão o que se quer provar.
4. **A explicação do 400 antes do 401 está só em `ContaMfaController`.** Em `apps/api/src/sessao/mfa.controller.ts:22-23` ela vale também para `SessaoMfaController` (docblock em `:46-50`), que muda do mesmo jeito. Repita a frase lá ou suba-a para o topo do arquivo.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 18:58:03 · `tasks/prd-reengenharia/16_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok (a tarefa não mexe na fila)
Concorrência: protegida
Índice e paginação: ok (nenhuma consulta nova; o `ConsultaDoPainel` continua paginado e estrito)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

Os pontos da manhã de segunda que eu conferi:

- **Limite por IP antes da validação.** O Nest roda a guarda antes do pipe, então o corpo inválido continua contando no balde do IP da rota anônima e no `rl:ip:op`. O teste novo prova isso, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/borda-de-entrada-sessao.int.test.ts`, e passou junto com o `semaforo-de-login.int.test.ts` (35 logins do mesmo IP). Acima do limite, quem passa de válido sai rebaixado no semáforo do hash, nunca com 429. O limite por conta não mudou.
- **Corpo inválido não gasta tentativa.** Nos logins por e-mail e por matrícula e em `/v1/sessao/mfa`, seis corpos inválidos dão 400. Nenhum chama a verificação nem grava `registro_acesso`, e a senha ou o código certo ainda entra.
- **401 que virou 400 no MFA.** Em `/v1/conta/mfa/ativar` e `/v1/sessao/mfa`, corpo inválido sem token agora dá 400 em vez de 401. A mudança está declarada em `onda-1a.md` T1. Ela não revela se o token existe e não chega a conferir o desafio.
- **Métricas e cabeçalhos.** O pipe roda dentro da cadeia de interceptadores e o `@Header('Cache-Control', 'no-store')` é aplicado antes dele. A medição de latência e erro e o `no-store` na resposta de erro continuam como antes.
- **Estado em memória.** `ZodValidationPipe`, `IdPipe` e o `esquemaSemCorpo` não guardam estado entre requisições; com duas instâncias não muda nada.
- **`slug` e `provedor`.** A conferência de formato saiu dos services e ficou só no pipe, com `NAO_ENCONTRADO`. O único caminho até `AcessoDaEscolaService.ler` e `LoginExterno.iniciar` é o controller. O byte nulo no `slug` é barrado antes de chegar ao Postgres, que responderia com 500.

O que rodei: `borda-de-entrada-sessao` e `semaforo-de-login` passaram (9 de 9). `sessao-externa`, `acesso-da-escola`, `segundo-fator-operador-concorrencia` e `painel-escrita` passaram. `tools/guardas/guardas.test.ts` passou (110 de 110) e o `eslint` em `sessao/` e `operacao/` saiu limpo.

Os 25 testes de `mfa.int.test.ts` nunca rodaram juntos. Na rodada com os outros quatro arquivos, os 5 testes do `describe('ops:redefinir-mfa')` falharam com "OPERADOR não é um operador ativo da equipe"; os outros 20 dessa rodada passaram, incluindo os 3 novos da tarefa. Isso não vem do diff: o comando (`executarOpsRedefinirMfa`) e o setup desses testes não foram alterados, e o `operador-teste` só existe no banco se outro arquivo de teste o criar antes. Não bloqueia, mas o portão com banco limpo precisa confirmar.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/eslint.config.mjs`: o segundo bloco libera o `@Req()` em todo controller de `sessao/` e `operacao/`, inclusive nos que não leem cookie nem IP (`convite.controller.ts`, `acesso-da-escola.controller.ts`, `painel.controller.ts`, `redefinir-mfa.controller.ts`). Listar só os arquivos que precisam fecha a porta para um `@Req()` novo nesses quatro.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/mfa.int.test.ts:589`: o `describe('ops:redefinir-mfa')` depende de outro arquivo ter criado o `operador-teste`. Ele deveria criar o próprio operador, para passar isolado (regra 40, banco limpo). Isso vai para o `TODO.md` ou para a tarefa que mexer nesse teste.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 19:00:36 · `tasks/prd-reengenharia/16_task.md`

**VEREDITO: REPROVADO**

Há um bloqueante: o teste novo de matrícula depende de estado que outras execuções deixam. Eu o rodei duas vezes nesta árvore e ele falhou nas duas.

**Cenários exigidos:** as 18 linhas da tabela da 16.0.
- A ordem 401/400 em `/conta/mfa/ativar` e `/sessao/mfa`.
- Corpo inválido sem gastar tentativa (MFA, e-mail, matrícula).
- O limite por IP vem antes do pipe, nas rotas anônimas e da operação.
- Os 35 logins do mesmo IP.
- A mesma matrícula em A e em B.
- `slug` e `provedor` fora do formato dão o 404 do inexistente.
- `redefinir-mfa`: id inválido com corpo válido dá 202, com corpo inválido dá 400, e o id de B no contexto de A dá 202.
- Troca para escola sem vínculo.
- Dois segundos fatores do operador ao mesmo tempo.
- Consulta do painel inválida.
- Criar escola estrito.
- A fixture de lint em `sessao/` e `operacao/`.

**Cobertos:** todos têm teste.
- **Testes novos:**
  - `mfa.int.test.ts` › "a ordem dos erros", "o corpo inválido não gasta tentativa" e "redefinir: o id em maiúsculas…".
  - `login-email.int.test.ts` e `sessao-matricula.int.test.ts` › "o corpo fora do contrato não gasta tentativa…".
  - `borda-de-entrada-sessao.int.test.ts` (o arquivo inteiro).
  - `acesso-da-escola.int.test.ts` › "o slug fora do formato…".
  - `sessao-externa.int.test.ts` › "iniciar: o provedor e o slug fora do formato…" e "…com espaços em volta".
  - `painel-escrita.int.test.ts` › "ordem fora da lista, página zero…".
  - `troca-de-escola.int.test.ts` e `convite.int.test.ts` › "borda (16.0)…".
  - `guardas.test.ts` › o `it.each` dos módulos que podem usar `@Req()`.
- **Testes que já existiam:**
  - `sessao-matricula.int.test.ts:172` (a matrícula 1234 em A e em B).
  - `mfa.int.test.ts:462` (o usuário só de B dá 202 sem efeito).
  - `troca-de-escola.int.test.ts:364` (escolher e trocar com o usuário de outra conta dão 404).
  - `segundo-fator-operador-concorrencia.int.test.ts:151` e `:173` (os dois segundos fatores em paralelo).
  - `painel-escrita.int.test.ts:279` (corpo com autor ou campo a mais).
  - `semaforo-de-login.int.test.ts:227` (os 35 logins do mesmo IP).
- **Mutações:** toda cláusula nova do diff tem bloco, e em cada um o cenário chega à cláusula. Conferi três casos que pareciam frágeis:
  - O `.default({})` do painel fica vermelho porque o Nest valida o `@Body` antes do `@Param` (os decoradores entram de trás para frente). Sem o `.default`, o refazer sem corpo dá 400 antes do 404 do id.
  - Ficaram sem bloco três coisas, e as três estão justificadas na divergência: o pipe inteiro do `provedor` (o service dá o mesmo 404), o `if (alvo === undefined)` e o primeiro bloco do ESLint (o segundo bloco vence o primeiro).
- **Outras checagens:** sem `.skip`, sem mock que esconda a regra e sem provedor de IA.
- **Execução:** `guardas.test.ts` passou (110). Passaram também `login-email`, `sessao-matricula`, `sessao-externa`, `acesso-da-escola`, `troca-de-escola`, `painel-escrita`, `painel-convite` e os testes 16.0 de `mfa` e de `convite`. As falhas de `ops:*` vêm do `OPERADOR` do meu ambiente ("OPERADOR não é um operador ativo da equipe") e não têm a ver com este diff.

**Bloqueantes:**

1. **`apps/api/test/borda-de-entrada-sessao.int.test.ts:49`**, caso `/v1/sessao/matricula`.
   - **O que está errado:** o pedido válido usa um `slug` sorteado e inexistente com a matrícula fixa `'1234'`. Para todo slug inexistente, a chave do contador é a mesma: a "escola desconhecida" (`ESCOLA_DESCONHECIDA`, `matricula.service.ts:22` e `:140`) mais a matrícula. Então todas as execuções somam falhas na mesma chave.
   - **O efeito:** da quinta falha acumulada em diante, a conta fica segurada e o teste recebe 429 no lugar do 401 esperado em `:60`. Reproduzi duas vezes seguidas nesta árvore: "expected 429 to be 401".
   - **Por que o portão não viu:** ele passou porque começa com o banco limpo. A regra 40 exige que o teste passe também com o estado acumulado e na esteira. Lá, o próprio `sessao-matricula` e qualquer outro teste que erre a 1234 num slug inexistente podem segurar essa chave.
   - **O próprio repositório já resolve isso:** `sessao-matricula.int.test.ts:257-259` sorteia a matrícula ("para o contador não trazer tentativas de outra execução").
   - **Correção exigida:** sortear a matrícula do pedido válido, como faz o `matriculaRara()`, ou usar o slug de uma escola criada no teste. Depois, rodar o arquivo de novo duas vezes seguidas, sem limpar banco nem Redis, e ver os dois verdes.

**Recomendações:**
- A tabela "Testes que provam a regra" não cita o teste pelo nome em sete linhas: 35 logins, mesma matrícula em A e B, id de B no contexto de A, troca sem vínculo, `rl:ip:op`, dois segundos fatores e criar escola estrito. Encontrei todos, listados acima. Pôr o `arquivo › nome` em cada linha ajuda o `/validar`.
- As linhas de concorrência e de carga (os segundos fatores em paralelo e os 35 logins) dependem de testes que a tarefa não alterou, então o portão não os roda. A divergência (5) declara isso, e eles ficam com a esteira.
- O "sem tentativa" de `/conta/mfa/ativar` sai verdadeiro de graça, porque o `ativar` não usa contador (`mfa.service.ts:80`). Vale uma linha dizendo isso, para ninguém achar que há um teste de contador ali.
- `guardas.test.ts`: o `toBeGreaterThanOrEqual(3)` sobre as marcas de `requisicao.body|query|params` é fraco perto do `toEqual(esperadas)` logo acima, que já prova o mesmo. Pode sair ou virar contagem exata.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/borda-de-entrada-sessao.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/src/sessao/matricula.service.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/sessao-matricula.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/16_task.md`

## infra-guardian · 2ª rodada · APROVADO · 2026-10-22 19:15:21 · `tasks/prd-reengenharia/16_task.md`

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
Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/borda-de-entrada-sessao.int.test.ts:49`, `valido()` sorteia um `slug` e uma matrícula novos a cada chamada. As duas tentativas válidas, uma pelo IP saturado e outra pelo outro IP, caem portanto em contas diferentes. O teste continua provando o que deve: o balde do IP vem antes do pipe e a tentativa sai rebaixada no semáforo, nunca em 429. Mas a linha da matrícula não confere o `id` do balde, porque `balde` é `undefined`. Se a intenção for que as duas tentativas usem a mesma conta, gere a matrícula uma vez por caso.
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/guardas.test.ts:97`, a asserção `>= 3` saiu e o `toEqual(esperadas)` ficou. O `toEqual` ainda prova que `body`, `query` e `params` continuam barrados em `sessao` e `operacao`, desde que a fixture mantenha as três marcas dentro de `daRequisicao`. Quem confere isso é o `test-engineer`. Não bloqueia na infra.

Nesta rodada não houve correção exigida para conferir. As quatro linhas novas do `TODO.md` registram o que a 1ª rodada recomendou, incluindo a do `operador-teste` em `mfa.int.test.ts`. O diff não mexe em limite, fila, gateway de IA, estado em memória, migration nem métrica. No código de produção mudaram só comentários, nos três arquivos de `src` e no `eslint.config.mjs`.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 19:15:52 · `tasks/prd-reengenharia/16_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

O diff desta rodada só mexe em comentário, documento e teste. Nenhum código de produção muda de comportamento.

- **Correção do `test-engineer`:** feita. Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/apps/api/test/borda-de-entrada-sessao.int.test.ts:49`, o pedido válido de `/v1/sessao/matricula` agora usa uma matrícula sorteada a cada execução, no lugar do `'1234'` fixo. O caso já não depende do que outras execuções deixaram no banco.
- **Asserção retirada de `guardas.test.ts`:** a que saiu era `toBeGreaterThanOrEqual(3)`. O `toEqual(esperadas)` logo acima continua provando que `requisicao.body`, `requisicao.query` e `requisicao.params` seguem barrados em `sessao` e `operacao`. Conferi que a fixture `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/__fixtures__/entrada-sem-esquema.ts` ainda marca as três leituras, nas linhas 52 a 54.
- **Mutação do ESLint corrigida:** passou de `{sessao}` para `sessao`. Uma chave com um único item pode não ser expandida pelo glob, e aí a mutação poderia ficar vermelha pelo motivo errado. Agora tira só o `operacao`.
- **Comentários conferidos contra o código:**
  - o do ESLint diz que `retorno` lê `requisicao.url`, e lê (`externa.controller.ts:50`);
  - a divergência (2) diz que `/v1/conta/mfa/ativar` não tem contador, e não tem (`mfa.service.ts:80`).
- **Recomendações da 1ª rodada:** as quatro foram para o `TODO.md` com motivo e tarefa de destino. A recusa do ponto do `test-engineer` está registrada na seção de recomendações não aplicadas e apoiada na divergência (5).

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/guardas.test.ts:96`: o `toEqual(esperadas)` vem da própria fixture. Se alguém apagar as três marcas de `daRequisicao`, o teste continua verde sem provar o bloqueio das leituras da requisição. Uma contagem exata das marcas dessas três linhas, como o `toBe(2)` que já existe para o `@Req()`, fecharia isso.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 19:15:54 · `tasks/prd-reengenharia/16_task.md`

**VEREDITO: APROVADO**

**Cenários exigidos:** os mesmos da 1ª rodada. São 17 linhas na tabela de `16_task.md`:
- corpo inválido dá `ENTRADA_INVALIDA` e não gasta tentativa nem grava `registro_acesso`;
- o limite por IP vem antes do pipe, na rota anônima e no `rl:ip:op`;
- 35 logins do mesmo IP ao mesmo tempo;
- a mesma matrícula com o `slug` de A e de B;
- `slug` e `provedor` fora do formato dão o mesmo 404;
- os três casos do `redefinir-mfa`, incluindo o isolamento de B no contexto de A;
- troca para escola sem vínculo;
- dois segundos fatores ao mesmo tempo;
- consulta do painel inválida;
- criar escola com corpo fora do contrato;
- a fixture de lint.

**Cobertos:** todos. O que mudou nesta rodada:
- **A correção exigida está feita.** Em `apps/api/test/borda-de-entrada-sessao.int.test.ts:49` a matrícula do pedido válido agora é sorteada a cada chamada (`m${randomUUID().slice(0, 12)}`). Cada execução usa uma chave nova no contador da escola desconhecida, e o acúmulo entre execuções acabou. O pedido do `outro` IP chama `valido()` de novo e também ganha matrícula própria. Rodei o arquivo duas vezes seguidas, sem limpar banco nem Redis, sobre o estado que a 1ª rodada deixou: os dois deram verde, 5 de 5.
- **`tools/guardas/guardas.test.ts`:** a asserção `toBeGreaterThanOrEqual(3)` saiu e nada se perdeu. O `toEqual(esperadas)` da linha 97 já compara a lista exata de violações, inclusive as três marcas de `requisicao.body|query|params`. O arquivo passou, 110 de 110.
- **Mutação do `files` do ESLint:** o `+` passou de `{sessao}` para `sessao`. Com a chave de um elemento só, o glob provavelmente não casava nada e tirava os dois módulos de uma vez; agora só `operacao` sai do segundo bloco. O teste `no controller de operacao` passa a falhar pelo motivo certo: o primeiro bloco barra o `@Req()` e as violações a mais quebram o `toEqual`.
- **Tabela de testes:** as sete linhas que já tinham teste na suíte agora citam o nome do teste, e cada nome aponta para um teste que existe.
- **Divergência (2):** a frase nova sobre o `ativar` sem contador está correta e não muda nenhum teste.
- **O resto do diff** é docblock e comentário (`acesso-da-escola.service.ts`, `externa.service.ts`, `mfa.controller.ts`, `eslint.config.mjs`) e quatro linhas no `TODO.md`, sem efeito nos testes.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. A recusa da minha recomendação da 1ª rodada (concorrência e carga ficam com testes que a tarefa não alterou) está registrada com motivo na tabela "Recomendações sem aplicar" e segue a regra 40 ("O portão"). Ela fica para o `/validar` conferir com a esteira verde.
