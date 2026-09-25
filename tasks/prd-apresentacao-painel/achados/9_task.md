# Achados das revisões — `tasks/prd-apresentacao-painel/9_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-25 10:58:41 · `tasks/prd-apresentacao-painel/9_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:** aceite auditado · aceite encerra as sessões da conta · aceite recusado não encerra nem audita · dois aceites em paralelo com uma auditoria só · a senha certa zera o contador · `zerar` que falha depois do commit · `zerar` que funciona não escreve a linha · renovar e sair juntos, nas duas ordens · log do reuso · balde próprio da operação, nos dois sentidos e com o rebaixamento · lote `convite_operador` ordenado · alvo sem total no objeto do processador · isolamento entre operadores (o aceite de um não toca nas sessões nem na auditoria de outro).

**Cobertos:**
- **Aceite auditado** (`apps/api/test/convite-operador.int.test.ts:239`): confere autor e alvo, e que a linha da auditoria não leva a senha, o token, o hash do token, o hash da senha nem o e-mail. Também confere que o outro operador fica sem auditoria.
- **Aceite encerra sessões** (`convite-operador.int.test.ts:254`): as duas sessões abertas terminam com `convite_aceito` e recebem `SESSAO_ENCERRADA` no `/eu`. A sessão já encerrada mantém o motivo, e a sessão de outro operador segue aberta. Isso cobre o isolamento pelo filtro do operador e o `isNull(encerradaEm)`.
- **Aceite recusado** ("revogado durante o hash", :352): a sessão continua aberta e não há auditoria.
- **Dois aceites em paralelo** (C10): a concorrência é de verdade, com barreira e `Promise.all`, e sai uma auditoria só.
- **Senha certa zera** (`entrada-operador.int.test.ts:369`): lê o contador direto no Redis, `'4'` antes e `null` depois.
- **`zerar` que falha** (`segundo-fator-operador.int.test.ts:295`): recusa só o `del` do Redis. A resposta é 200 com os dois cookies e uma sessão aberta, o contador fica em `'2'`, e as chaves da linha de log são exatas, sem nada da pessoa. O caso contrário, com o Redis zerando e sem linha, também está lá. Os dois testes do contador cobrem o valor que o `zerar` devolve.
- **Renovar e sair juntos** (`sessao-operador.int.test.ts:410-460`): a linha fica segura por `for update` e a espera na trava é conferida no `pg_stat_activity`. A ordem é forçada nos dois sentidos, e o resultado final é conferido: sessão encerrada, nenhum refresh válido, acesso novo recusado.
- **Log do reuso** (:387): chaves exatas, e nenhum valor da pessoa ou da sessão no log inteiro da requisição.
- **Balde próprio** (:467): Redis real, com as contagens de `rl:ip`, `rl:ip-login` e `rl:ip:op` e a marca de rebaixamento nos dois IPs. O C36 do `arquitetura.test.ts` cobre as sete rotas de entrada.
- **Lote ordenado** (`apps/worker/test/expurgo-de-acesso.int.test.ts:403`): o mais antigo foi semeado por último e a ordem de saída é conferida passo a passo. A mutação sem o `order by` fica vermelha.
- **Linha de log com o `operadorId`** (`logger.test.ts`): prova o `mixin`, e também que a linha da escola não leva o `operadorId`.

Nenhum `.skip`, nenhum teste comentado, nenhum provedor de IA envolvido.

**Bloqueantes:**
1. **O teste "alvo sem total" não falharia sem a regra.** Está em `apps/worker/test/expurgo-de-acesso.int.test.ts:397-401`.
   - **O que está errado:** o `@ts-expect-error` roda sobre um objeto que o próprio teste monta, e não sobre o objeto do processador. Ele prova que o TypeScript confere um `Record<AlvoDoExpurgoDeAcesso, number>`, não que o código confere. Se o processador voltar ao que a 9.4 tirou (`const totais = {} as TotaisDoExpurgoDeAcesso` mais o `for` sobre `ALVOS_DO_EXPURGO_DE_ACESSO`, em `apps/worker/src/processadores/expurgar-acesso.ts:57`), o typecheck, o teste e o lint continuam verdes. Nenhuma guarda do ESLint pega essa afirmação de tipo: em `tools/guardas/` só `regras-log.mjs` trata disso.
   - **Correção exigida:** uma prova que quebre quando o próprio processador usa afirmação de tipo. Qualquer uma destas serve:
     - (a) a regra `@typescript-eslint/consistent-type-assertions` com `objectLiteralTypeAssertions: 'never'`, pelo menos em `apps/worker/src/processadores/`;
     - (b) um caso no `arquitetura.test.ts` ou no teste do worker que leia a fonte de `expurgar-acesso.ts` e recuse ` as Record<` e ` as TotaisDoExpurgoDeAcesso`.

     Nos dois casos, confira que a mutação `{} as TotaisDoExpurgoDeAcesso` deixa o portão vermelho. O `@ts-expect-error` atual pode ficar como prova do tipo.

**Recomendações:**
- **Títulos desatualizados:** os títulos do C32 (`apps/api/test/sessao-operador.int.test.ts:413`) e do C36b (:470) ainda dizem `rl:ip` para o renovar e o sair do operador, que agora contam no `rl:ip:op`.
- **Aceite e renovar em paralelo:** falta um teste com o aceite do convite e a renovação da mesma conta ao mesmo tempo, com a ordem forçada como em "renovar e sair juntos". A trava por `encerrada_em is null` resolve o caso por construção, mas nenhum teste a exercita contra o `encerrarSessoes` do aceite.
- **Aceite e segundo fator em paralelo:** o mesmo vale para o aceite ao mesmo tempo que uma entrada pelo segundo fator do mesmo operador. O `for update` do operador e a versão do segundo fator devem fazer uma das duas perder, e nenhum teste prova isso.
- **Rebaixamento no aceite:** o "balde próprio" confere a marca de rebaixamento só na entrada por e-mail. O `convite/aceitar` e o `sessao/mfa` estão cobertos apenas pelo C36, com o limitador falso. Um caso de integração no `convite/aceitar` fecharia a prova pelo Redis real também ali.

## test-engineer · 2ª rodada · APROVADO · 2026-09-25 11:31:34 · `tasks/prd-apresentacao-painel/9_task.md`

VEREDITO: APROVADO

Cenários exigidos: a correção 1 da rodada anterior. Um alvo novo do expurgo sem total precisa deixar o portão vermelho. Isso vale também se o processador voltar a `{} as TotaisDoExpurgoDeAcesso` com o `for`. Nesta rodada só audito o diff; o resto foi aprovado na 1ª rodada e não mudou.

Cobertos:
- **A regra de lint entra em vigor.** `/home/joaquimdp/Documentos/git/Educa.ia/eslint.config.mjs:43-51` liga `@typescript-eslint/consistent-type-assertions` com `objectLiteralTypeAssertions: 'never'` em `apps/worker/src/processadores/**/*.ts`. O bloco vem depois de `tseslint.configs.strict`. Depois dele só vêm as guardas, que não desligam a regra: ela disparou no teste abaixo.
- **Conferi a mutação eu mesmo, sem editar arquivo.** Passei ao ESLint pelo stdin, com o mesmo caminho, o processador de volta a `const totais = {} as TotaisDoExpurgoDeAcesso` com o `for`. Resultado: `57:20 error Always prefer const x: T = { ... } @typescript-eslint/consistent-type-assertions`, saída 1. O arquivo real passa limpo, saída 0.
- **O lint faz parte do portão.** Está em `tools/processo/portao-local.ts:49`, e o `npm run lint` usa `--max-warnings=0`. A correção exigida foi feita.
- **O processador monta os totais sem afirmação de tipo.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/worker/src/processadores/expurgar-acesso.ts:57-64` os totais são um objeto literal com o tipo declarado. Faltar uma chave é erro de compilação, e o lint impede voltar ao `{} as`.
- **A troca de títulos não mexe em asserção.** Os C32 e o C36b passaram a dizer `rl:ip:op`, e nada mais mudou nesses testes.

Bloqueantes: nenhum.

Recomendações:
- **Uma forma de contornar a regra continua aberta.** `const t: Partial<TotaisDoExpurgoDeAcesso> = {}`, preenchido no `for` e afirmado no fim com `t as TotaisDoExpurgoDeAcesso`, passa pelo lint. A afirmação não é sobre um objeto literal. Contornar assim é deliberado, então não bloqueia; registro para o `/validar`.
- **Três lacunas continuam para o `/validar`, como vocês registraram:**
  - aceite e renovar em paralelo;
  - aceite e segundo fator em paralelo;
  - o rebaixamento do `convite/aceitar` provado por integração. Hoje só o C36, com limitador falso, prova isso.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-25 11:33:05 · `tasks/prd-apresentacao-painel/9_task.md`

VEREDITO: APROVADO

A tarefa 9.0 não viola a regra 20 nem `docs/lgpd.md`. Ela não toca em dado de aluno, professor ou coordenação, só em credencial, sessão, auditoria e limite de requisições da equipe Turmma.

**Campos pessoais tocados:**
- `sessao_operador.motivo` ganha o valor `convite_aceito`.
- `auditoria_operacao.acao` ganha `convite_operador.aceito`. O autor é o apelido do operador, que já está na tabela como "Identificador do operador Turmma na auditoria".
- O IP entra como chave do novo balde `rl:ip:op`, no Redis de cache, por 1 minuto. É o mesmo IP que essas rotas já contavam no `rl:ip` e no `rl:ip-login`, só em outro balde.
- As linhas de log das rotas de operador passam a levar o `operadorId`, que é um UUID.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. As linhas da sessão e da auditoria da operação foram atualizadas em `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:78` e `:80`, com o motivo novo e a ação nova, e dizem "nunca a senha nem o token do convite".

**Autorização por objeto:** ok.
- O aceite encerra só as sessões do `operadorId` que o convite (conferido pelo hash) aponta. O teste "aceite encerra sessões" prova que a sessão de outro operador continua aberta e que a sessão já encerrada mantém o motivo.
- O aceite recusado, por convite revogado durante o hash, não encerra nada nem audita.
- As respostas do C9 ficam iguais: usado, vencido, revogado e inexistente dão o mesmo 404.

**Logs:** limpos.
- `operacao.contador_nao_zerado` (`apps/api/src/operacao/segundo-fator.service.ts:190-193`) leva só o evento, o `requisicaoId` e o `operadorId`. O teste confere as chaves exatas e confirma que não aparecem apelido, nome, e-mail nem a chave do contador (`apps/api/test/segundo-fator-operador.int.test.ts`).
- `operacao.reuso_de_refresh` agora tem teste de conteúdo. As chaves são exatas, e nem essa linha nem o resto do log da renovação levam e-mail, apelido, nome, refresh, hash, token, `sessaoId` ou `operadorId`.
- O `mixin` do logger (`packages/nucleo/src/log/logger.ts:182`) só acrescenta o `operadorId` do contexto. Esse id vem do `sub` verificado pela `GuardaDeOperador`, é UUID e nunca é apelido. O `logger.test.ts` prova que a linha da escola não o recebe.

**Auditoria:** presente. O aceite do convite troca a senha e zera o segundo fator, o que equivale a alterar credencial, e agora grava `convite_operador.aceito` na mesma transação, só no aceite que venceu. Os testes provam:
- a linha não contém senha, token, hash do token, hash da senha nem e-mail;
- dois aceites em paralelo geram uma única auditoria;
- a ordem aparece no C37 (`registros-operador.int.test.ts`).

A migration `0017` só amplia os dois checks e é compatível com o código anterior.

**Envio externo:** nenhum. A tarefa não envolve IA nem provedor externo.

**Seed/fixture:** sintético. Os e-mails usam `@turmma.invalid`, e os nomes são do tipo "Pessoa Sintética da Operação".

**Pergunta de fechamento:** nada muda para dado de aluno. A tarefa não cria, expõe nem envia dado de titular da escola, e a resposta que o sistema já dava continua valendo.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `/home/joaquimdp/Documentos/git/Educa.ia/docs/lgpd.md:93-94`: citar o `rl:ip:op` no parágrafo "IP só em memória". Ele guarda o IP no Redis de cache só pela janela de 1 minuto, como o `rl:ip`. Não é dado novo, mas o parágrafo hoje fala só dos limites "das rotas de login" e "do F0".
2. `docs/lgpd.md` ou `docs/arquitetura.md`: registrar numa linha que as linhas de log das rotas `@RotaDeOperacao` levam o `operadorId`. É id da nossa equipe e já está declarado no `9_task.md`, mas deve sobreviver à tarefa, porque quem responder a um pedido sobre o operador vai procurar isso na documentação.
3. Continuam valendo, para o `/validar`, as lacunas de teste que o `test-engineer` apontou:
   - o aceite e a renovação da mesma conta em paralelo;
   - o aceite e o segundo fator em paralelo;
   - o rebaixamento do `convite/aceitar` provado com o Redis real.

   A trava garante isso hoje, mas nenhum teste o exercita.

## revisor-geral · 1ª rodada · APROVADO · 2026-09-25 11:33:40 · `tasks/prd-apresentacao-painel/9_task.md`

VEREDITO: APROVADO

Escopo: respeitado. As subtarefas 9.1 a 9.6 estão feitas, e todas as linhas da tabela "Pendências para a A0b" do `retro.md` têm destino no documento da tarefa. Nada da 10.0 (web, e2e, `tabelasSemEscola`) foi tocado.

Aderência à Tech Spec: ok. A tarefa mudou o desenho em um ponto: as três rotas `@LimiteQueRebaixa` saíram do `rl:ip-login` e foram para o `rl:ip:op`. Essa mudança está declarada em "Divergências resolvidas nesta tarefa" e também foi escrita na seção 7c da `techspec.md`, na `docs/arquitetura.md` e no C36. As outras mudanças também estão declaradas e registradas: a migration é a `0017`, o `zerar` agora devolve `Promise<boolean>`, e o `operadorId` entrou no `mixin` do logger.

Portão local: carimbo válido (typecheck, lint, test, infra).

Bloqueantes: nenhum.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts:177`: o `contextoAtual() ?? { requisicaoId: randomUUID() }` é um caminho morto. Nas rotas HTTP o contexto sempre existe. Se faltar, é falha de montagem, e inventar um `requisicaoId` esconde essa falha. Fica mais claro usar o contexto atual e falhar fechado quando ele não existir, como a `GuardaDeLimite` já faz com o `'contexto da requisição ausente'`.
2. O `rl:ip:op` agora é um balde só para as rotas que recusam com 429 (`renovar`, `sair`, `consultar`, `mfa/configurar`) e para as que só rebaixam (`convite/aceitar`, `sessao/email`, `sessao/mfa`). Na escola, esses dois grupos ficam em baldes separados, `rl:ip` e `rl:ip-login`. Com um balde só, uma rajada no `sessao/email` vinda do IP do operador faz o `renovar` desse mesmo IP responder 429. A justificativa ("só a nossa equipe usa") está escrita e está no terreno do `infra-guardian`. Mesmo assim, vale registrar esse acoplamento na seção 7c, para que ninguém o descubra depois.
3. `/home/joaquimdp/Documentos/git/Educa.ia/docs/arquitetura.md:67`: a lista do que o `SessaoModule` exporta está incompleta. O módulo também exporta o `SeguroDoLogin` e o `RegistroDeAtividade`. Ou a lista fica completa, ou vira "entre outros".
4. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/prd-apresentacao-painel/tasks.md:61-66`: a 9.0 e as subtarefas dela continuam `[ ]`. O commit da 8.0 marcou o `tasks.md` e o da 9.0 deve fazer o mesmo. Além disso, o `tasks.md` numera as subtarefas de um jeito e o `9_task.md` de outro: no `tasks.md`, a 9.2 junta o `zerar` com o `rl:ip:op`.
5. Três cenários de concorrência continuam sem teste, como o `test-engineer` já registrou para o `/validar`:
   - o aceite e a renovação ao mesmo tempo;
   - o aceite e a entrada pelo segundo fator ao mesmo tempo;
   - o rebaixamento do `convite/aceitar` pelo Redis real.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-25 11:33:49 · `tasks/prd-apresentacao-painel/9_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login (o limite por IP da entrada do operador e o `ContadorDeTentativas` que o login da escola também usa), migration

Rate limit: ok. As sete rotas `@EntradaDeOperacao` saíram do `rl:ip` e do `rl:ip-login` da escola e agora contam no `rl:ip:op`, um balde separado. Com isso, o NAT de uma escola lotando o login às 7h30 não afeta o operador, e o contrário também vale. Nas três `@LimiteQueRebaixa`, passar do limite continua só marcando a requisição, sem 429. A recusa por conta continua no contador. O teste "balde próprio" confere os dois sentidos.

Fila e prioridade: ok. O expurgo roda um lote atrás do outro, e o `order by least(...)` agora leva primeiro o convite mais antigo. A tabela `convite_operador` tem dezenas de linhas, então a ordenação sem índice custa pouco.

Concorrência: protegida.
- **Aceite do convite:** ele trava a linha do operador com `for update` antes de tudo (`operador.repository.ts:390`). Só depois do aceite feito, e na mesma transação, ele encerra as sessões e grava a auditoria. O `/sessao/mfa` trava a mesma linha (`:462`), então abrir sessão e aceitar nunca acontecem juntos.
- **Encerrar sessões com renovar ou sair no meio:** o `encerrarSessoes` e o `rotacionarSessao` gravam com a condição `encerrada_em is null`, e o Postgres relê essa condição depois de pegar a trava da linha.
- **Testes:** o C10 prova uma única linha de auditoria com dois aceites juntos. O "renovar e sair juntos" força a ordem nos dois sentidos.

Índice e paginação: ok. Nenhuma query nova em tabela que cresce com aluno.

Degradação de IA: não se aplica

Migration: compatível. A `0017` só amplia os dois checks, e o código anterior nunca grava o valor novo. Recriar o check trava a tabela enquanto confere as linhas, mas `auditoria_operacao` e `sessao_operador` são tabelas da equipe, com poucas linhas.

Métrica e alerta: ok. Nenhum alerta novo. A falha do Redis ao zerar vira a linha `operacao.contador_nao_zerado`, só com ids. As chamadas do `zerar` no F1 ignoram o valor devolvido, como antes.

Bloqueantes: nenhum

Recomendações:
1. `packages/nucleo/src/limite/chaves.ts:434`: o prefixo `rl:ip:op` fica dentro do espaço de nomes `rl:ip:`, ao contrário do `rl:ip-login`, que foi separado de propósito. Uma varredura `rl:ip:*`, seja de teste ou de operação, pega também os baldes do operador. Hoje isso já acontece em `apps/api/test/limite.int.test.ts:155-158`: o `chavesDeIp` passa a devolver entradas `op:<ip>`. As asserções de `:399` e `:588` só não quebram porque `:585` apaga tudo antes de conferir. Vale trocar para um prefixo fora de `rl:ip:`, como `rl:ip-op`, ou filtrar o `op:` no `chavesDeIp`.
2. `packages/nucleo/drizzle/0017_operador_aceite.sql`: para manter o padrão em tabelas que venham a crescer, criar o check com `NOT VALID` e depois rodar `VALIDATE CONSTRAINT`. Aqui não faz diferença, porque as tabelas são pequenas.
3. O caso "aceite com renovação em paralelo" não tem teste próprio. Hoje ele está coberto pela forma do código: a mesma condição `encerrada_em is null` que o "renovar e sair juntos" já prova. Um caso segurando a linha da sessão durante o aceite deixaria isso explícito para o `/validar`.

Arquivos citados:
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/limite/chaves.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/limite.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/drizzle/0017_operador_aceite.sql`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts`
