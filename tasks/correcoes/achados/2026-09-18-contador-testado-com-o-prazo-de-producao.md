# Achados das revisões — `tasks/correcoes/2026-09-18-contador-testado-com-o-prazo-de-producao.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-18 08:17:27 · `tasks/correcoes/2026-09-18-contador-testado-com-o-prazo-de-producao.md`

VEREDITO: APROVADO

A correção se sustenta. A regra continua provada, e rodei os dois arquivos com `npx vitest run --project integracao ...`: 6 de 6 verdes. Não encontrei bloqueante. Uma frase do comentário e do documento promete mais do que os testes cobrem, e outros testes de integração têm a mesma fragilidade. As duas coisas estão nas recomendações.

**Cenários exigidos:**
- (a) O script Lua do contador continua provado: a quinta falha segura 30 s, a espera dobra, para em 15 min, o acerto zera só aquela origem, e dez tentativas em paralelo liberam exatamente cinco.
- (b) O desafio só pode ser usado uma vez, também com duas conclusões em paralelo.
- (c) A contagem passa pelo Redis e não pelo seguro em memória.
- (d) Com o Redis fora, o login cai no seguro e o desafio é recusado.
- (e) Com o Redis travado (conectado, mas sem responder), o comando corta no prazo e o seguro atende.

**Cobertos:**
1. **A prova continua de pé.** Os valores exatos de espera, o teto de 15 min, o zerar por origem e a concorrência de 5 em 10 continuam em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.int.test.ts`. Um script errado quebra esses testes. A asserção `proporcaoDoSeguro === 0` (linha 49) ainda prova que a contagem passou pelo Redis, e é justamente ela que separa o Redis do seguro, porque o seguro devolve os mesmos números. `keys` e `pttl` também só respondem pelo Redis. Com o prazo de 2 s a asserção não fica mais fraca: se uma resposta ainda cair no seguro, o teste fica vermelho em vez de passar calado. No desafio, tirar o `NX` ou a marca faz o teste de concorrência cumprir as duas conclusões e falhar. O teste roda duas chamadas em paralelo de verdade (`Promise.allSettled`).
2. **A queda com o Redis fora continua provada.** O contador está coberto em `apps/api/test/login-email.int.test.ts:372`, que para o `redis-fila` e confere o seguro, `seguro_ativo = 1` e a conta segurada. O desafio está coberto em `apps/api/src/sessao/desafio.int.test.ts:50`, que segue com `criarClienteRedisDaApi` na porta 9. O corte de 100 ms com o Redis travado está provado para o cliente em `apps/api/test/limite.int.test.ts:501` e para o limitador em `:539`.
3. Nada de produção mudou. Não há `.skip`, e nenhum mock esconde a regra.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **O comentário e o documento prometem o caso travado, e ninguém o prova para o contador nem para o desafio.** O comentário (`contador-de-tentativas.int.test.ts:30`, `desafio.int.test.ts:26`) e a seção "Correção" do documento dizem que a queda com o Redis "fora ou travado" está provada. Não está.
   - Os dois testes citados provam só o Redis fora. Com o Redis parado, o status não fica `ready`, e o caminho usado é o do `if`.
   - O ramo `catch` de `ContadorDeTentativas.reservar` (`apps/api/src/sessao/contador-de-tentativas.ts:149-151`) não tem teste. É o ramo em que o status está `ready` mas o comando estoura o prazo, e é nele que a tentativa pode ser contada duas vezes, para o lado de segurar.
   - O mesmo falta para o `catch` de `ConsumoDeDesafio.consumir` com o Redis travado.
   - A lacuna já existia antes desta correção; a correção só a deixou escrita como coberta.
   - Duas saídas: trocar o texto para "fora", ou abrir uma correção com o Redis pausado (`CLIENT PAUSE`, como em `uso.int.test.ts:137`). Esse teste provaria que o contador cai no seguro e que o desafio é recusado.
2. **Os testes que sobem a aplicação inteira têm a mesma fragilidade, e não dá para trocar o cliente neles.** O `SessaoModule` cria `CLIENTE_REDIS_LOGIN` com `criarClienteRedisDaApi` (`apps/api/src/sessao/sessao.module.ts:80`). Todo teste que passa pela aplicação usa esse cliente de 100 ms para provar lógica que não depende do prazo:
   - `login-email.int.test.ts:204, 215, 268, 276, 286, 304`: se parte das reservas cair no seguro, a contagem fica dividida entre Redis e memória, e os números "cinco hashes" e "cinco seguradas" podem sair errados.
   - `mfa.int.test.ts:205, 307, 339, 352, 369` e `convite.int.test.ts:221, 379, 449`: o desafio recusa quando o Redis não responde a tempo, então um 200 esperado vira 401 no runner carregado.
   - Para esses a troca de cliente não serve. Seria preciso uma opção de teste em `configuracaoDeTeste()` para o prazo do cliente de login, ou aceitar o risco e registrá-lo. Fica para o `/retro` ou para uma correção à parte.
3. `ops-uso.int.test.ts` e `uso.int.test.ts`, pelo `uso.module.ts:24`, e `limite.int.test.ts:466`, que espera `seguroAtivo` 0 com o Redis de cache, estão expostos do mesmo jeito a uma resposta acima de 100 ms. Vale olhar junto com o item 2.

## test-engineer · 2ª rodada · APROVADO · 2026-09-18 08:18:08 · `tasks/correcoes/2026-09-18-contador-testado-com-o-prazo-de-producao.md`

VEREDITO: APROVADO

**Cenários exigidos:** os mesmos da rodada 1. O script do contador e a marca de uso único do desafio continuam provados, inclusive em paralelo. A contagem passa pelo Redis e não pelo seguro em memória. Com o Redis fora, o login cai no seguro. Com o Redis travado, o caso ficou declarado como sem teste.

**Cobertos:** conferi a correção desta rodada no `git diff`, sem rodar testes, como você pediu.
- **Comentários dos dois testes.** O comentário em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/contador-de-tentativas.int.test.ts:27-31` e em `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.int.test.ts:23-27` já não diz que o caso "fora ou travado" está provado. Agora diz que a queda com o Redis fora é provada e que o caso travado "ainda não há teste". Isso fecha a minha recomendação 1 na forma "trocar o texto".
- **Documento.** Em `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-18-contador-testado-com-o-prazo-de-producao.md`, a seção "Correção" fala só em "com o Redis fora". A seção nova "O que fica em aberto" registra três coisas:
  - o ramo `catch` do contador e o do desafio sem teste, com o caminho por `CLIENT PAUSE`;
  - os testes que sobem a API inteira (`login-email`, `mfa`, `convite`, uso e limite), expostos ao prazo de 100 ms;
  - a saída por configuração do compose de teste, que mantém os 100 ms em produção e nos testes que provam o corte.

  Isso cobre as minhas recomendações 2 e 3.
- **Código.** Não mudou desde a rodada 1. As duas linhas que trocam para `criarClienteRedisDaFila` são as que eu já tinha aprovado.

**Bloqueantes:** nenhum.

**Recomendações:** nenhuma nova. As lacunas de "O que fica em aberto" já estão registradas para o `/retro`: o Redis travado no contador e no desafio, e o prazo de 100 ms nos testes que sobem a API inteira.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-18 08:18:45 · `tasks/correcoes/2026-09-18-contador-testado-com-o-prazo-de-producao.md`

VEREDITO: APROVADO
Caminho quente tocado: login (só nos testes; nenhum código de produção mudou)
Rate limit: ok (o contador continua por conta, pela chave `login:{HMAC}:{origem}`, e nunca por IP)
Fila e prioridade: ok (não se aplica ao diff)
Concorrência: protegida (os scripts que os dois testes provam continuam provados: 5 de 10 em paralelo no contador e `SET NX` no desafio)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (a proporção do seguro do contador alimenta `limite.seguro_ativo`, e o runbook já cobre `login.contador_no_seguro`)
Bloqueantes: nenhum

**Pergunta 1: os 100 ms em produção.** O prazo está certo, e o estouro no runner não prova que ele cortaria em produção. Com Redis gerenciado na mesma região, um `EVAL` curto ou um `EXISTS`/`SET NX` leva poucos milissegundos no p99, então 100 ms dá uma folga de dezenas de vezes. O runner da esteira roda Postgres, dois Redis, observabilidade e a suíte na mesma máquina com CPU disputada. Esse cenário não representa o Redis gerenciado.

Às 7h30, 400 logins por escola e dez escolas dão algumas dezenas de comandos por segundo. Isso é carga trivial para o Redis. O que pode passar de 100 ms em produção é outra coisa: o Redis de fila travado por um script longo de outro cliente, ou em failover. Nesse caso cair no seguro é exatamente o desenho: o login não trava, e o erro puxa para segurar a conta, nunca para liberar. O alerta `seguro-limite-ativo` fica de sentinela. Se ele disparar com frequência em staging, a causa é a latência do Redis, não o prazo.

Existe uma assimetria que o documento não registra. No contador, o corte cai no seguro e o login segue. No desafio, o corte recusa (`desafio.ts:113-131`). E se o `SET NX` chegou a rodar e só a resposta atrasou, a marca fica gravada: o usuário recebe 401 e precisa recomeçar o login. Isso atinge só quem tem MFA ou vínculo em mais de uma escola, e fechar é a escolha certa. Mas esse caminho não emite log nem métrica. Está na recomendação 1.

**Pergunta 2: o risco em aberto e o caminho proposto.** O risco é real, e o caminho faz sentido com duas condições:
- **Prazo maior sem virar opção de produção.** O ideal é trocar o provider `CLIENTE_REDIS_LOGIN` (`apps/api/src/sessao/sessao.module.ts:80`) na montagem de teste, por `configuracaoDeTeste()` ou `overrideProvider`, em vez de criar uma variável de ambiente que a API lê em produção. Se virar variável, a validação de ambiente precisa recusá-la fora do perfil de teste. Assim ninguém sobe produção com um prazo de 2 s que penduraria o login com o Redis travado.
- **O corte continua provado com 100 ms.** `limite.int.test.ts:466`, `:501` e `:539` e o caso "Redis fora" de `desafio.int.test.ts:50` precisam seguir com o prazo de produção, fixado de forma explícita.

Discordo de um ponto do documento: esperar "se isso aparecer na esteira". Os testes afetados são `login-email`, `mfa` e `convite`, e o `mfa`/`convite` espera 200 e recebe 401 quando o Redis atrasa. Eles falham de forma intermitente e seguram a tarefa seguinte, pela regra 40. Vale abrir a correção agora.

Recomendações:
1. `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts:117` e `:128`: o `catch` recusa sem log nem métrica. Com o Redis de fila lento em produção, o coordenador com MFA recebe 401 sem que ninguém veja a causa. Emitir, com espaçamento e usando só ids, um aviso como `login.desafio_sem_redis` e somá-lo ao sinal de seguro ativo, com a linha correspondente no runbook.
2. Abrir já a correção do prazo do cliente de login nos testes que sobem a API inteira, nas condições descritas na pergunta 2, em vez de esperar a esteira falhar.
3. Fazer o teste com `CLIENT PAUSE` que o documento já registra. Ele deve provar duas coisas: com o Redis travado, o contador cai no seguro (e conta em dobro para o lado de segurar), e o desafio é recusado. É o único caminho de degradação do login que hoje não tem prova.
4. Documentar em `/home/joaquimdp/Documentos/git/Educa.ia/docs/infra.md` que o contador e o desafio dividem o Redis de fila com o BullMQ. Um `addBulk` grande ou um script de fila longo às 7h30 é o que, em produção, faria os 100 ms cortarem. Isso reforça a regra de que lote não roda no horário letivo.
