# Achados das revisões — `tasks/prd-apresentacao-operacao/7_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-24 02:24:16 · `tasks/prd-apresentacao-operacao/7_task.md`

VEREDITO: APROVADO

**Cenários exigidos (tabela da 7_task.md):** C12, C13, C14, C16, C17, C18, C18b, C19, C20, C34, C32 (configurar), C39 (configurar e mfa), C47 (cookie real), C6b (a), (b), (c) nas duas ordens e (d). Pelo domínio também entram: caminho feliz, permissão (operador desativado, desafio de outra etapa, segundo fator já ativo), isolamento entre operadores, e concorrência (clique duplo e duas abas).

**Cobertos:**
- **Caminho feliz, do convite à casca.** O segredo gravado é o que a pessoa recebeu, e os HMACs são os dos códigos entregues. O desafio `mfa` sai com `ver`. Os dois cookies saem com Path, HttpOnly, SameSite e `Max-Age=28800`. A sessão tem 8 h e o `refresh_hash` confere. O cookie de dispositivo é lido pela 6.0. A segunda entrada não regrava `ativadoEm`.
- **C12.** Mesmo desafio em `Promise.all` com dois códigos válidos: uma sessão só e um código gasto só (o passo ou a recuperação, nunca os dois). O reenvio depois é recusado.
- **C13.** Redis desconectado dá 503 com `Retry-After` e `no-store`, e o estado do banco fica idêntico. Com o Redis de volta, os mesmos desafios valem. O contador tem seguro em memória, então um consumo que aceitasse sem Redis deixaria o teste vermelho.
- **C14, C16 e C17.** A etapa trocada responde como desafio inválido e não queima o desafio. Com o fator ativo, o configurar não muda segredo, versão nem códigos. O desafio queimado não volta, e o código errado não ativa. O `mfa` sem versão não ativa um segredo pendente.
- **C18 e C18b.** Barreira real nas duas ordens, com a espera provada em `pg_stat_activity`/`pg_locks`. "Configure de novo" é 409, o contador fica nulo e `ultimoPasso` fica nulo. Se a conferência de versão saísse, ou a reserva viesse antes dela, o teste falharia.
- **C19 e C20.** Em sequência e em paralelo. A recuperação antes da ativação é recusada, conta tentativa e deixa os 10 HMACs. Isolamento: o código de recuperação de um operador não vale para outro e continua valendo para o dono.
- **C32 e C34.** 429 `LIMITE_EXCEDIDO` no configurar acima do `rl:ip`. No `/sessao/mfa`, quem recusa é a conta: 4 recusas 401 e a quinta 429 `CONTA_SEGURADA`. Segurado, o código não é gasto. Y entra pelo mesmo IP, e X entra pela origem `conhecido`. Sem o `@LimiteQueRebaixa`, o quarto pedido daria 429 e o teste quebraria.
- **C39.** Corpo estrito com `ENTRADA_INVALIDA` e `no-store`, sem gastar o desafio. O esquema de saída recusa campo a mais. As chaves exatas da resposta são conferidas.
- **C47.** Lista gerada das rotas de escola com sessão, com o cookie sozinho, o cookie com o dispositivo e o cookie com o bearer: todas respondem igual à rota inexistente. O cookie de dispositivo sozinho não é credencial. A renovação da escola não aceita. Há teste de unidade do `cookieDeOperador`.
- **C6b (a) a (d).** (a) segura depois do `jti` e termina no estado do C6. (b) prova com `pg_locks` e termina em `SESSAO_ENCERRADA`. (c) nas duas ordens: sem o filtro `desativado_em`, o check daria 500. (d) em sequência.
- **Unidade do `ver`.** Emissor e verificação, incluindo `ver` fora da etapa e valores 0, -1, 1.5 e '2'.
- **Privacidade do log.** Segredos, URIs, códigos, desafios, tokens e cookies vistos nas respostas não aparecem no log.
- **Adaptador de IA.** Não se aplica.
- Não há `.skip`, `.only` nem `any`.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/api/src/operacao/desafio-de-operador.ts:117`: a linha `operacao.desafio_sem_redis`, espaçada a cada 30 s, não tem teste. O F1 tem o equivalente em `apps/api/src/sessao/desafio.int.test.ts:67`. Vale um teste que a veja uma vez só em duas recusas seguidas (regra 80, item 10).
2. O C13 só cobre o Redis desconectado (`status 'end'`). Não cobre o Redis travado com a conexão aberta, que dependeria do corte do cliente (100 ms). O F1 tem esse caso; vale repetir para o `ConsumoDeDesafioDeOperador`.
3. `apps/api/test/segundo-fator-operador.int.test.ts:85-93`: o `guardar` só colhe o que sai nas respostas. Os códigos TOTP digitados e o e-mail do operador (`...@turmma.invalid`) não entram em `segredosVistos`, e o teste de log não os procuraria.
4. O cookie de dispositivo não tem o `Max-Age` conferido, e o `Secure` fora do ambiente local não é verificado aqui. Hoje dependem só do `serializarCookie` do F1.
5. O C47 do `cenarios.md` também pede que o cookie de operador "nas de entrada da escola nunca produz sessão nem desafio de escola". Aqui só a renovação está coberta. A 8.5 fecha C43, C44, C46 e os grupos de limite do C36; vale incluir as rotas de entrada da escola nessa varredura.

**Arquivos auditados:**
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/segundo-fator-operador.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/segundo-fator-operador-concorrencia.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/segundo-fator-de-operador.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/desafio-de-operador.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/token-de-operador.test.ts

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-24 02:25:09 · `tasks/prd-apresentacao-operacao/7_task.md`

VEREDITO: APROVADO

**Tabelas verificadas:** a tarefa não traz migration nem tabela nova. Os métodos novos tocam só `operador`, `codigo_recuperacao_operador` e `sessao_operador`, que são tabelas da equipe Turmma criadas antes desta tarefa. Pelo desenho da A0 elas não têm `escola_id`, e o C45 em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/arquitetura.test.ts` prova que só o `OperadorRepository` mexe nelas. Nenhuma tabela de escola é tocada.

**Queries verificadas** em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts`:
- `gravarSegredoParaConfigurar`, `trocarCodigosDeRecuperacao`, `ativoParaSegundoFator` (`for update`, com `desativado_em is null`), `avancarPassoDoSegundoFator`, `usarCodigoDeRecuperacao`, `ativarSegundoFator` e `abrirSessao`.
- Todas filtram pelo `operadorId`. Esse id vem do `sub` do desafio assinado (HS256, `typ` e audiência próprios, `jti` de uso único), nunca de um campo livre que o cliente escolhe.
- Os contratos em `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/segundo-fator.ts` são estritos (`.strict()`) e não aceitam `escolaId` nem qualquer outro seletor de dado.
- Nenhuma query lê dado de escola, então a camada de rede e dado individual de aluno não entram aqui.
- Os ids continuam UUID: o `sub` é validado por `z.uuid()`, e a sessão e o operador usam UUID.
- `@SemEscopo()` não aparece.
- As recusas não revelam se algo existe:
  - Desafio inválido, desafio já usado, etapa trocada, operador desativado e segundo fator ativo no configurar respondem todos `NAO_AUTENTICADO`.
  - O 409 `CONFLITO` só sai depois de passar por um desafio válido e consumido do próprio operador. Não diz nada sobre outra conta.

**Teste de isolamento:** presente e efetivo. O C47, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/segundo-fator-operador.int.test.ts:376-415`, usa o cookie real que a rota emitiu:
- Varre todas as rotas de escola que exigem sessão e compara cada resposta com a de uma rota inexistente. Faz isso com o cookie sozinho, com cookie mais dispositivo e com cookie mais bearer de operador.
- Se tirarmos o `|| cookieDeOperador(...)` em `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/guarda-autenticacao.ts:34`, o cookie sozinho volta a dar 401 em vez de 404, e o teste quebra.
- Também prova que `/v1/sessao/renovar` não aceita o cookie do operador nem grava sessão de escola.

**Bloqueantes:** nenhum.

**Recomendações:**
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/guarda-autenticacao.ts:34`: se uma requisição de escola chegar com um bearer válido e também com um `turmma_operacao` montado à mão, ela recebe 404. Hoje isso está certo, porque o navegador só manda esse cookie em `/v1/operacao/sessao`. Mesmo assim, vale um caso de teste que fixe esse comportamento, para ninguém transformar o 404 num fallback para o bearer da escola.
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts`: o contador reservado dentro da transação `for update` é uma escolha registrada nas divergências. A parte de infra fica com o `infra-guardian`; não afeta o isolamento.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-24 02:25:11 · `tasks/prd-apresentacao-operacao/7_task.md`

VEREDITO: APROVADO

Esta tarefa não toca nenhum dado de aluno. Só trata dados da conta do operador Turmma, e todos eles já constam da tabela de dados do `docs/lgpd.md`.

**Campos pessoais tocados:** todos são da conta do operador.
- O e-mail só é lido dentro do service. Ele serve para calcular o HMAC do cookie de dispositivo e nunca sai na resposta.
- O segredo do segundo fator é gravado cifrado, com o `operador.id` como dado autenticado. Segredo e códigos aparecem em texto uma única vez, na resposta do configurar, com `no-store`.
- Dos códigos de recuperação, o banco guarda só o HMAC.
- A sessão guarda o hash do refresh e as datas, sem IP.
- O cookie de dispositivo guarda o HMAC do e-mail com chave própria do operador.

**Fora da tabela de dados do docs/lgpd.md:** nenhum. As linhas 69, 76 e 78 cobrem conta, sessão e cookie de dispositivo, com finalidade e retenção. O contador usa `login-op:{HMAC(operador.id)}`, sem identificador em claro.

**Autorização por objeto:** ok.
- As duas rotas não têm sessão. O objeto é o `sub` de um desafio assinado com `typ` e audiência próprios e `jti` de uso único (`SET NX` em `desafio-op:usado:`). Com o `jti` já usado, o desafio não tem como ser reaproveitado.
- Toda recusa de desafio responde igual, 401 `NAO_AUTENTICADO`: desafio inválido, já usado, de outra etapa, de operador desativado, ou com o segundo fator ainda inativo.
- A guarda de escola agora responde 404 também ao cookie `turmma_operacao` (`packages/nucleo/src/identidade/guarda-autenticacao.ts:34`), igual a uma rota inexistente (C47).

**Logs:** limpos.
- A única linha nova é `operacao.desafio_sem_redis`, sem dado nenhum (`apps/api/src/operacao/desafio-de-operador.ts:135`).
- O teste de integração junta segredo, URI, códigos, desafios, tokens e cookies e confere que nada disso vai para o log.

**Auditoria:** ausente em `operador.mfa_configurado` por decisão registrada (divergência no `7_task.md`, entregue à 8.0 pelo C37 "inteiro" na tabela de testes do `8_task.md`). Não bloqueia: é dado da equipe, não leitura de dado de aluno, e a ação que audita está marcada para a tarefa seguinte da mesma spec.

**Envio externo:** nenhum. Não há IA nem provedor terceiro envolvido.

**Seed/fixture:** sintético. O apoio `apps/api/test/segundo-fator-de-operador.ts` gera contas de teste e não tem e-mail real.

**Pergunta de fechamento:** não se aplica a aluno. Para o operador, a tabela diz o que é guardado, e o estado depois da desativação é provado (C6b (a): só id, apelido e datas, sem código, sem sessão).

**Bloqueantes:** nenhum.

**Recomendações:**
1. `tasks/prd-apresentacao-operacao/8_task.md:38`: o texto da subtarefa 8.4 cita só o `AcessoOperacao`. A auditoria `operador.mfa_configurado` (com o autor tirado da sessão) aparece apenas na linha C37 da tabela de testes. Vale escrever na 8.4, ou numa subtarefa própria, que a rota de configurar da 7.0 grava em `AuditoriaOperacao`, para o `/validar` não deixar passar.
2. `apps/api/src/operacao/segundo-fator.service.ts:136` e `apps/api/src/operacao/operador.repository.ts:389` usam `throw new Error(...)` sem tipo nem código (regra 00, item 9). Hoje isso é inalcançável com a linha travada e sai como 500 genérico, sem vazar dado. É o mesmo apontamento já feito na 5.0.
3. `apps/api/src/operacao/desafio-de-operador.ts:135`: o aviso espaçado `operacao.desafio_sem_redis` não tem teste que prove que ele sai sem dado e no máximo a cada 30 s. É o mesmo ponto que o `test-engineer` levantou.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-24 02:25:25 · `tasks/prd-apresentacao-operacao/7_task.md`

VEREDITO: APROVADO

Caminho quente tocado: login. A `GuardaDeAutenticacao` roda em toda rota de escola e agora também confere o cookie `turmma_operacao`. O resto da tarefa é a área da operação, que só a nossa equipe usa.

Rate limit: ok

Fila e prioridade: ok (nada vai para a fila, e nada demorado roda dentro do request)

Concorrência: protegida

Índice e paginação: ok

Degradação de IA: não se aplica

Migration: não se aplica

Métrica e alerta: ok

Bloqueantes: nenhum

O que sustenta cada item:
- **Rate limit.** A recusa do `/sessao/mfa` vem do contador `login-op:` pelo `operador.id`. O `@LimiteQueRebaixa` impede que a rota responda 429 pelo IP. O teste C34 prova isso com dois operadores atrás do mesmo IP.
- **Concorrência.**
  - O desafio vale uma vez só, com `SET NX` no `jti`.
  - O configurar grava com `update … returning mfa_versao` numa só transação.
  - O `/sessao/mfa` começa pelo `for update` na linha do operador ativo. Dentro dele, o passo do app é gasto por `update` condicional e o código de recuperação por `delete … returning`.
  - A ativação só casa com a versão conferida.
  - O `desativar` trava a mesma linha.
  - Os testes rodam em paralelo com barreira nas duas ordens (C18, C18b, C6b de (a) a (d)), com a espera provada em `pg_locks`.
- **Índice.** A PK `(operador_id, hmac)` cobre o `delete`, e as tabelas crescem com a equipe, não com os alunos.
- **Redis fora.** O consumo do desafio responde 503 `INDISPONIVEL_TENTE_DE_NOVO`, nunca aceita, e deixa uma linha espaçada no log (C13).
- **Custo na guarda da escola.** A mudança é um `split` do cabeçalho `Cookie`, sem I/O, e roda depois do `rotaSemSessao`.

Recomendações:
1. **Trava de linha durante a chamada ao Redis.** Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts:131`, o `contador.reservar` roda dentro da transação, com a linha do operador travada. O custo é o prazo do cliente, 100 ms. A escolha está justificada no 7_task.md, e o volume é pequeno. Se esse padrão for copiado para uma rota de escola, a trava vira gargalo na rajada das 7h30. Vale uma linha na Tech Spec avisando que ele não se reaproveita fora da operação.
2. **Limite só por IP no configurar.** O `mfa/configurar` só tem o limite anônimo `rl:ip` (C32). Aqui não é bloqueante: cada chamada exige um desafio de uso único, que só sai depois da senha, e essa etapa já é contada por conta. O `docs/runbook.md` poderia registrar que um 429 nessa rota vem do IP da equipe, e não de um operador segurado.
3. **Contador zerado depois do commit.** Em `segundo-fator.service.ts:150`, o `contador.zerar` roda depois de a transação confirmar. Se o Redis cair nesse instante, a conta continua contando por até 15 min, mesmo com a entrada feita. Não bloqueia, porque o erro fica do lado de segurar. Só o registro para a 8.0.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.controller.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/operador.repository.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/desafio-de-operador.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/guarda-autenticacao.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/segundo-fator-operador-concorrencia.int.test.ts`
- `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/segundo-fator-operador.int.test.ts`

## revisor-geral · 1ª rodada · APROVADO · 2026-09-24 02:25:38 · `tasks/prd-apresentacao-operacao/7_task.md`

**VEREDITO: APROVADO**

A tarefa 7.0 pode seguir. As duas rotas e o cookie `turmma_operacao` fazem o que a seção 5 da Tech Spec pede, e não achei nenhum bloqueante.

- **Escopo:** respeitado. Registrar a entrada em `acesso_operacao` e a auditoria `operador.mfa_configurado` fica mesmo com a 8.0: a subtarefa 8.4 diz "gravados pelas rotas de 6.0, 7.0 e 8.0". Renovar e sair não foram tocados. A resposta 404 ao cookie de operador numa rota de escola (C47) está na tabela de testes desta tarefa e na seção 6 da Tech Spec, então também é desta tarefa.
- **Aderência à Tech Spec:** ok. As divergências estão declaradas no fim do `7_task.md` e em "Da tarefa 7.0" na `techspec.md`, e nenhuma contradiz a seção 5:
  - "Configure de novo" responde 409 `CONFLITO`.
  - A tentativa é reservada no contador pelo `operador.id` dentro da transação, depois do `for update`. É o que faz a versão divergente não contar tentativa.
  - Com o Redis fora, o desafio responde 503.
  - O código errado também queima o desafio ("queimado não volta").
- **Portão local:** carimbo válido para o código atual (typecheck, lint, test, infra).

**Bloqueantes:** nenhum.

**Recomendações:**
1. Em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts:150`, o `contador.zerar` roda depois de a transação que insere a `SessaoOperador` já ter confirmado. Se o Redis cair entre as duas coisas, o cliente recebe 503 e fica no banco uma sessão ativa sem cookie, que só some quando vencerem as 8 h. Vale zerar sem deixar o erro subir, ou documentar o caso.
2. A função `contaSegurada` (`segundo-fator.service.ts:191`) repete o que o `entrada.service.ts:111` já faz. Dá para ter uma só em `operacao/`.
3. O serviço novo tira `BYTES_DO_REFRESH`, `hashDoRefresh` e `normalizarEmail` de `sessao/login.service.ts`. A tarefa pede para reaproveitar as peças puras, não o service do F1, então essas funções ficariam melhor num módulo puro. A entrada da 6.0 já faz o mesmo, então é uma dívida anterior.
4. A falha de código no `/sessao/mfa` não soma na métrica `operacao.entrada_falha` nem na de conta segurada, que a entrada por e-mail alimenta. A seção 7c mede `entrada_falha` por minuto. Confirme na 8.0 se a falha do segundo fator entra nessa contagem.
5. O `export { COOKIE_SESSAO_DE_OPERADOR }` em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/cookie-de-operador.ts:13` só repassa a constante do núcleo e hoje só o teste o usa. O teste pode importar direto de `@educa/nucleo`.

Arquivos que li: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/operacao/segundo-fator.service.ts`, `segundo-fator.controller.ts`, `cookie-de-operador.ts`, `desafio-de-operador.ts` e `operador.repository.ts` na mesma pasta, `/home/joaquimdp/Documentos/git/Educa.ia/packages/shared/src/operacao/segundo-fator.ts` e `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/identidade/guarda-autenticacao.ts`.
