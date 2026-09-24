# Achados das revisões — `tasks/prd-apresentacao-operacao/5_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-23 23:16:30 · `tasks/prd-apresentacao-operacao/5_task.md`

VEREDITO: REPROVADO

**Cenários exigidos** (tabela da tarefa 5.0 e cenarios.md: C7 parte, C9, C10, C11, C21, C32 parte, C33 parte, C39 parte)
- Caminho feliz: consultar e depois aceitar. Grava a senha, zera o segundo fator e os códigos, marca o convite como usado e devolve o desafio `configurar_mfa` com `no-store`.
- Bordas: convite usado, vencido, revogado e inexistente respondem igual. Às 71h59 o convite vale, às 72h01 não. Link antigo depois de `ops:operador convite`. Revogação e vencimento acontecendo durante o hash.
- Permissão: credencial de escola não produz desafio de operador. O desafio do operador não serve de bearer em nenhuma rota.
- Isolamento: token de convite de escola na rota do operador, e o do operador na rota da escola.
- Concorrência: dois `aceitar` em paralelo (C10). Aceite correndo junto com o `desativar` (C11 com a trava declarada na Tech Spec).
- Limite: `consultar` responde 429 com `Retry-After`. `aceitar` rebaixa no semáforo e não responde 429.
- Contrato: entrada e saída estritas.

**Cobertos** (todos em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite-operador.int.test.ts`)
- Caminho feliz (184–212): confere a linha do operador depois do aceite, verifica o desafio e confirma que não sai cookie.
- C9 (216–244): os quatro casos iguais nas duas rotas, e nada gravado.
- Borda de 72 h (246–255).
- C7 parte (257–270).
- C11: operador desativado antes (274–283) e durante o hash (285–291).
- Trava contra revogação e vencimento durante o hash (295–315).
- C10 (319–347): paralelo de verdade, com barreira depois do hash para os dois. Confirma que a senha gravada é a de quem recebeu 200.
- C21 (351–388): percorre todas as rotas registradas com sessão, de operação e de escola, mais as duas rotas de desafio da escola. Confirma que não nasce sessão.
- Permissão e isolamento cruzado (392–411).
- C39 (415–433).
- C32 (458–466) e C33 (468–494). O C33 espiona o semáforo, confere `rebaixado: true` e mostra que convite inválido não gasta vez.
- Unidade: `apps/api/src/operacao/desafio-de-operador.test.ts` cobre typ, aud, etapa, chave, vencido, sem jti e troca entre as portas. `packages/nucleo/src/identidade/token-de-operador.test.ts:98-101` cobre o `bearerDeOperador` com o desafio do operador e com o da escola.
- As mutações que você declarou (`usado_em`, `revogado_em`, `expira_em`, `desativado_em`, `acimaDoLimiteDoIp`, `TIPO_DESAFIO_DE_OPERADOR`) de fato deixam algum teste vermelho. Não há `.skip`. Nenhum mock esconde a regra: o espião no `hash.gerar` só abre a janela de corrida.

**Bloqueantes**

1. **A trava "começa pelo `for update` da linha do operador ativo" não tem teste que a prove.** A regra está em `apps/api/src/operacao/operador.repository.ts:247-252` e foi escrita nesta tarefa em `techspec.md` ("Travas no banco") e nas divergências do `5_task.md`.
   - **O problema:** se `.for('update')` for removido, todos os testes continuam verdes. Os três testes com barreira no hash só cobrem a janela entre a consulta do convite e a transação. Nenhum cobre o `desativar` concorrente com a transação do aceite.
   - **O que acontece sem a trava:** o `desativarOperador` real trava e atualiza o `operador` primeiro e só depois revoga o convite. O aceite sem `for update` lê o operador como ativo, marca o convite como usado e bloqueia no `update operador`. Enquanto isso, o `desativar` bloqueia no convite. Resultado: deadlock no Postgres, que aborta um dos dois sem escolha determinística.
     - Se o abortado for o `desativar`, o operador que a equipe quis tirar (o caso "perdeu a conta para outra pessoa") sai com senha nova e desafio válido.
     - Se for o aceite, sai um 500 no lugar do erro tipado que a Tech Spec exige para quem perde.
   - **Correção exigida:** um teste de integração com concorrência de verdade entre o aceite e o `desativar`.
     1. Uma transação num cliente separado do pool faz `select ... from operador where id = $1 for update`, e depois o `update` que desativa, sem commit.
     2. Solte o aceite (barreira no hash, como em `aceitarMudandoDuranteOHash`) e espere até ele ficar bloqueado em lock, lendo `pg_locks` ou `pg_stat_activity.wait_event_type = 'Lock'`.
     3. Na mesma transação, revogue o convite pendente, como faz o `desativarOperador`, e faça o commit.
     4. Asserções: o aceite responde igual a inexistente (404 `NAO_ENCONTRADO`); `usado_em` fica nulo; `senha_hash` fica nulo; a transação do `desativar` conclui sem erro.

     Sem o `.for('update')`, esse teste falha por deadlock ou por 200.

**Recomendações** (não bloqueiam)
- `operador.repository.ts:268-271`: o `update operador set senha_hash` do aceite filtra só por `id`. Com `and desativado_em is null` e conferindo o `returning`, a proteção passaria a ter duas camadas.
- O teste do C11 "durante o hash" (285) usa `desativarSemRevogar`, que isola bem a cláusula. Vale um segundo caso com o `desativarOperador` real (revoga e encerra), para provar o caminho que a equipe vai usar. Pode ser o mesmo teste do bloqueante.
- A borda de 71h59 (247) tem só 1 minuto de folga entre o relógio do Node, que gera o `expira_em`, e o `now()` do Postgres. No compose local não dá problema. Numa esteira com container de relógio defasado pode ficar instável, e 71h50 daria a mesma prova com mais margem.
- O C33 prova os argumentos passados ao semáforo, não a ordem real de execução. Isso é aceitável porque o comportamento do semáforo já é testado no F1, mas vale citar o teste do F1 no comentário.
- O C39 prova "não deixa sair campo a mais" pelo `Object.keys` do caminho feliz e pelo `safeParse` do esquema. Está suficiente. Um teste de unidade do controller com um service falso que devolve um campo a mtornaria explícito que o `parse` do controller é quem barra.

## test-engineer · 2ª rodada · APROVADO · 2026-09-23 23:18:13 · `tasks/prd-apresentacao-operacao/5_task.md`

VEREDITO: APROVADO

**Cenários exigidos (rodada 2, só a correção pedida e o que ela afeta):** a trava do aceite, que começa pelo `for update` da linha do operador ativo, precisa de um teste de concorrência de verdade contra o `desativar`. Também conferi as duas recomendações aplicadas: o filtro com `returning` no update da senha e a borda de 71h50.

**Cobertos:**
- **A correção exigida foi feita.** O teste novo está em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite-operador.int.test.ts:318-364` e segue o roteiro pedido. O aceite fica preso na barreira do hash. Um cliente separado abre a transação, trava o operador com `for update` e o desativa sem commit. Depois o aceite é solto, e o teste espera até ele aparecer em `pg_stat_activity` aguardando lock (`wait_event_type = 'Lock'`, com pid diferente do cliente do desativar). Então a transação revoga o convite e faz commit. O teste confere que:
  - o aceite responde igual a um token inexistente;
  - `usado_em` e `senha_hash` continuam nulos;
  - o desativar conclui sem erro, porque uma falha no `query('commit')` ou no `update convite_operador` quebraria o teste.
- **O teste falha sem a regra.** Tirando o `.for('update')` de `apps/api/src/operacao/operador.repository.ts:251`, o aceite grava `usado_em` no convite sem esperar e fica preso no update do operador. Quando o desativar tenta revogar o convite, os dois se travam um ao outro. O Postgres aborta um deles: ou o desativar lança erro, ou o aceite devolve 500, com forma diferente da de inexistente. Nos dois casos o teste fica vermelho, o que bate com a conferência manual relatada (1 falhou, 14 passaram). Com a trava, o `select ... for update` refaz a checagem de `desativado_em is null` depois do commit, não encontra mais o operador ativo e devolve `false`.
- **O update da senha filtra operador desativado.** Em `operador.repository.ts:267-273`, o update passou a filtrar `desativado_em is null`, usa `returning` e lança erro se não gravou nada. O erro acontece dentro da transação, então desfaz também o uso do convite. É defesa em profundidade: com a trava de pé, esse caminho não é alcançável.
- **A borda de 71h50** está em `convite-operador.int.test.ts:246-247`. A prova é a mesma de antes, agora com folga entre o relógio do Node e o do Postgres.
- Não há `.skip`, `.only`, `.todo` nem teste comentado nos arquivos de teste da tarefa. O espião em `hash.gerar` só segura o tempo e depois chama o hash de verdade, então não esconde nenhuma regra.

**Bloqueantes:** nenhum.

**Recomendações:**
- Em `convite-operador.int.test.ts:343-351`, a espera conta qualquer processo parado em lock no mesmo banco, não só o aceite. Se um dia outros testes rodarem em paralelo no mesmo banco, a espera pode liberar cedo. A asserção final ainda pegaria o erro, mas o teste ficaria instável. Dá para filtrar pelo `pid` da conexão do aceite ou pelo texto da query (`query ilike '%for update%'`).
- O `throw` de `operador.repository.ts:273` não tem teste, e não teria como ter enquanto a trava existir. Vale deixar registrado para o `/validar` que esse caminho é intencionalmente inalcançável.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-23 23:18:57 · `tasks/prd-apresentacao-operacao/5_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok. Três pontos saem do texto original da Tech Spec, e todos foram registrados em "Divergências resolvidas nesta tarefa" (em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-operacao/5_task.md`). Os dois primeiros também entraram na seção 5 da `techspec.md`, e o PRD apoia os dois (seção 3 e a linha "Operador perde o app autenticador"):
- o aceite troca a senha e zera o segundo fator;
- a trava começa pelo `for update` da linha do operador;
- `consultar` devolve só `{ valido: true }`.
Portão local: portão local: apps/api/src/operacao/operador.repository.ts mudou em 2026-09-23 23:17:05, depois do início do último (2026-09-23 22:46:10). Rode `node tools/processo/portao-local.ts --infra` de novo.

Bloqueantes:
- **O carimbo do portão é de antes da última mudança.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts:267-273`, o filtro `desativado_em is null` com `returning` no update da senha entrou às 23:17:05. O último portão começou às 22:46:10, então o 1850/1850 não cobre esse código nem a nova versão de `apps/api/test/convite-operador.int.test.ts`. Correção exigida: rodar `node tools/processo/portao-local.ts --infra` sobre a árvore atual e só depois pedir a rodada nova. Se nada mudar no código, a rodada nova é só conferir o carimbo.

Recomendações:
- **`operador.repository.ts:272`:** o `throw new Error('operador do aceite não gravado')` é uma string sem tipo. Hoje não é alcançável e desfaz a transação, mas pela regra 00, item 9, um erro de invariante com código deixaria o 500 identificável no log.
- **`apps/api/src/operacao/token-do-convite.ts:2`:** o arquivo importa `BYTES_DO_TOKEN_DE_CONVITE` e `hashDoToken` de `sessao/convite.service.ts`. Com isso o módulo de operação passa a depender de um arquivo de service da escola. Tirar as duas peças para um arquivo próprio em `sessao/` (ou para o `nucleo`) evitaria essa dependência. Pelo mesmo motivo, o alias `export const hashDoTokenDeConvite = hashDoToken` pode virar reexportação direta.
- **Sessões abertas no aceite:** o aceite recupera a conta, mas as sessões que já estavam abertas continuam valendo até 8 h. A justificativa está registrada (o `motivo` é uma lista fechada, e para conta tomada o caminho é o `desativar`). Mesmo assim, vale abrir o motivo `convite_aceito` numa tarefa futura. Hoje, quem recupera a conta depois de perder o autenticador para outra pessoa não derruba a sessão dela sem desativar a conta inteira.
- **`SessaoModule` global:** ele passou a ser global (`sessao.module.ts:292`) para o `OperacaoModule` usar o mesmo semáforo. Faltou registrar em `docs/arquitetura.md` que agora são três módulos globais, e por quê.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-23 23:19:04 · `tasks/prd-apresentacao-operacao/5_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: todos do operador Turmma, nenhum de aluno. São `operador.senha_hash` (gravada no aceite), os campos do segundo fator (`mfa_segredo_cifrado`, `mfa_chave_versao`, `mfa_ativado_em`, `mfa_ultimo_passo`, zerados no aceite), os códigos de recuperação (apagados) e `convite_operador.usado_em`. O desafio leva só `sub` (id do operador), `etapa` e `jti`. Não há migration nova.

Fora da tabela de dados do docs/lgpd.md: nada. A conta e o convite do operador estão em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md` (linhas 76 e 77), com finalidade e retenção. Não entra nenhum campo proibido para aluno.

Autorização por objeto: ok.
- O token de 256 bits vai só no corpo e é conferido pelo hash, com `usado_em`, `revogado_em`, `expira_em` e operador ativo.
- A trava com `for update` repete as condições dentro da transação. O `update` do operador também repete `desativado_em is null`.
- Credencial de escola não gera desafio de operador, e o convite de coordenador não abre o aceite do operador. Os dois casos têm teste em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite-operador.int.test.ts:399` e `:440`.
- Usado, vencido, revogado, de operador desativado e inexistente dão o mesmo `NAO_ENCONTRADO`, provado em `:216`, `:246`, `:257` e `:274`.
- Saída mínima e explícita: `consultar` devolve só `{ valido: true }`, sem apelido nem nome, e `aceitar` devolve só `{ etapa, desafio }`. Os contratos são estritos (`/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/convite.ts`), e o `.parse` na saída do controller impede campo a mais. As duas respostas saem com `no-store`.
- Erros: entrada inválida dá `ENTRADA_INVALIDA` sem detalhe. O `throw new Error('operador do aceite não gravado')` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts:255`) não carrega dado nenhum.

Logs: limpos. Os arquivos novos não têm logger, e nem senha nem token vão para log. O teste sobe o app com `logger: false`.

Auditoria: presente onde a regra 20 exige. O aceite não é leitura de dado de aluno, nem exportação, nem nota, nem alteração de permissão. A lista fechada da `AuditoriaOperacao` (Tech Spec, seção 3, e `docs/lgpd.md:80`) não prevê ação para o aceite. O acesso só passa a existir com o segundo fator, e `operador.mfa_configurado` é auditado na 7.0. O uso do convite fica marcado em `convite_operador.usado_em`.

Envio externo: nenhum. Não há chamada de IA nem de serviço terceiro.

Seed/fixture: sintético. Os e-mails usam o domínio `.invalid` com UUID, o nome é "Coordenação Sintética", e os operadores vêm da fábrica de teste.

Pergunta de fechamento: a tarefa não toca dado de aluno nem cria envio novo, então a resposta sobre o aluno fica como estava.

Bloqueantes: nenhum.

Recomendações:
1. **Auditar o aceite.** O aceite troca a senha e zera o segundo fator de uma conta que pode estar ativa, porque é o caminho de recuperar a conta. Como está, esse reset só aparece em `convite_operador.usado_em`, que o expurgo apaga em 30 dias, enquanto a `AuditoriaOperacao` guarda por vigência + 5 anos. Vale levar ao `/retro` a proposta de uma ação `convite_operador.aceito` na lista fechada. Hoje o aceite não altera permissão, e só a 7.0 fecha o rastro com `mfa_configurado`.
2. **Registrar as sessões que ficam abertas.** O aceite não encerra as sessões abertas do operador; elas terminam sozinhas em até 8 h. Isso está declarado na tarefa, mas quando a recuperação for por comprometimento da conta, a sessão de quem tomou a conta continua viva até o `desativar`. Vale registrar isso no runbook da operação.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/convite-operador.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/convite-operador.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/desafio-de-operador.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/convite.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/verificar-token.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite-operador.int.test.ts`

## infra-guardian · 1ª rodada · APROVADO · 2026-09-23 23:19:10 · `tasks/prd-apresentacao-operacao/5_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login (o aceite usa o mesmo semáforo do hash de senha do login)
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum

Por que nenhum item vira bloqueante:

- **Rate limit.** A rota `consultar` é anônima e usa o `rl:ip` que o F1 já usa. O token do convite tem 256 bits, e a rota de convite do operador não recebe tráfego de escola. A rota `aceitar` nunca responde 429 acima do limite do IP. Ela manda o pedido para o fim do balde `equipe`, na subfila daquele IP (`baldeDaEquipe`), e o balde de cada escola continua no rodízio sem atraso. O teste C33 prova isso.
- **Concorrência.** `apps/api/src/operacao/operador.repository.ts:228-258` faz tudo numa transação: primeiro trava a linha do operador ativo com `for update`, depois grava o uso do convite com `update` condicional e `returning`, e por fim grava a senha repetindo `desativado_em is null`. Os testes cobrem dois aceites no mesmo `Promise.all` (C10), o `desativar` concorrente, e o convite revogado, vencido ou do operador desativado durante o hash.
- **Hash fora da transação.** O hash roda antes de abrir a transação, então a linha do operador não fica travada durante o argon2. O convite que não vale é recusado antes do hash e não ocupa vez no semáforo.
- **Estado em memória.** Com `SessaoModule` global, o `OperacaoModule` recebe o mesmo semáforo do login, que é um por instância e limita as threads do processo. Nenhum estado precisa ser dividido entre instâncias. `SessaoModule.com` só é montado uma vez, em `apps/api/src/app.module.ts:53`.
- **Índice.** A busca é por `token_hash`, que tem restrição única (`convite_operador_token_hash_unico`). A tabela não cresce com o número de alunos.

Recomendações:
- O aceite não tem contador próprio de sucesso e recusa. O volume é baixo e o fluxo fica fora da manhã de aula, mas um contador sem rótulo de pessoa, junto do `login.hash_espera{escola_id="equipe"}`, ajudaria a separar o aceite do login por e-mail quando alguém investigar fila no balde `equipe`.
- No C10, quem perde a corrida já pagou um argon2 inteiro antes de ser recusado. Não muda o veredito, porque é um pedido por convite. Deixar isso escrito no comentário de `apps/api/src/operacao/convite-operador.service.ts` evita que alguém "otimize" pondo o hash dentro da transação.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-23 23:19:11 · `tasks/prd-apresentacao-operacao/5_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `operador`, `convite_operador` e `codigo_recuperacao_operador`, todas da área da operação e sem dono escola. Nenhuma tabela nem migration é nova nesta tarefa. O novo código não lê nem escreve nenhuma tabela de escola.

Queries verificadas:
- `OperadorRepository.conviteValidoPorHash` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts:199`). Busca pelo hash do token, com o operador ativo, e devolve só os dois ids.
- `OperadorRepository.aceitarConvite` (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts:228`). Primeiro trava a linha do operador ativo com `for update`. Depois faz o `update` condicional do convite, preso ao `operadorId` e ao `conviteId` que vieram da consulta pelo hash, nunca do cliente. Por fim grava a senha, zera o segundo fator e apaga os códigos de recuperação, sempre pelo mesmo `operadorId`.
- A cerca das duas rotas `@EntradaDeOperacao`:
  - `rotaSemSessao` põe as duas rotas fora das guardas de escola, e nenhuma sessão de escola entra no contexto.
  - A `GuardaDeLimite` aplica `rl:ip` anônimo em `consultar` e `@LimiteQueRebaixa` em `aceitar`.
  - A `ConferenciaDasPermissoes` reconhece o marcador.
  - Os contratos são `.strict()` e aceitam só `token` e `senha`. Não há `escolaId` no corpo nem na query.
  - O desafio sai com `typ: desafio-operador+jwt` e `aud: operacao`. A escola o recusa pelo `typ`, e o `bearerDeOperador` o manda para o 404 de rota inexistente.

Teste de isolamento: presente e efetivo.
- O teste "permissão" (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite-operador.int.test.ts:440`) prova que o convite de coordenador, com bearer e cookie de escola, dá o mesmo corpo que um token inexistente e continua valendo na rota da escola. Também prova o sentido inverso. Se o aceite do operador passasse a olhar a tabela de convite da escola, ou a credencial de escola, o teste quebraria.
- O C21 (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/convite-operador.int.test.ts:399`) monta a lista de rotas pela aplicação que subiu e compara cada uma com uma rota inexistente. Sem o `TIPO_DESAFIO_DE_OPERADOR` em `TIPOS_DA_OPERACAO`, as rotas de escola responderiam 401 e não 404, e o teste falharia.
- O C9 cobre os quatro casos de convite que não vale (usado, vencido, revogado e inexistente) e o de operador desativado, todos com a mesma resposta. Não há confirmação de que o convite existe.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts:255`: o `throw new Error(...)` desfaz a transação, o que está correto, mas sai como erro sem tipo nem código (regra 00, item 9). O caminho não é alcançável hoje; se passar a ser, o erro precisa de tipo e código.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessao.module.ts:306`: o `global: true` passa a expor para todos os módulos também o `ContadorDeTentativas`, o `SeguroDoLogin` e o `CLIENTE_REDIS_LOGIN`, além do que o `OperacaoModule` precisava. Vale registrar no `/retro` se convém um módulo menor, só com o semáforo e o hash.

## revisor-geral · 2ª rodada · APROVADO · 2026-09-23 23:46:10 · `tasks/prd-apresentacao-operacao/5_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. `conferir` responde "portão local válido para o código atual (typecheck, lint, test, infra)", com saída 0.

Bloqueantes: nenhum. Só havia uma correção exigida na 1ª rodada, e ela foi feita. O carimbo agora cobre a árvore atual e inclui a suíte de infra. Os arquivos alterados são os mesmos da 1ª rodada. Não há mudança de código a auditar além da que foi revista nela.

Recomendações:
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts:255`, o `throw new Error(...)` dentro da transação sai sem tipo nem código (regra 00, item 9). Hoje esse caminho não é alcançável. Se um dia passar a ser, o erro precisa de tipo e código.
- Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessao.module.ts:306`, o `global: true` expõe a todos os módulos mais do que o `OperacaoModule` precisa: o contador de tentativas, o seguro do login e o cliente Redis do login. Vale avaliar no `/retro` um módulo menor, só com o semáforo e o hash.
