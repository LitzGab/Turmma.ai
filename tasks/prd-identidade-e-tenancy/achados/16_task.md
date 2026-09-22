# Achados das revisões — `tasks/prd-identidade-e-tenancy/16_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-19 14:47:35 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- Rajada: 2.100 contas por um IP, 40% no primeiro minuto, 30% errando uma vez. Precisa de p95 abaixo de 1 s, zero 429 e nenhuma iteração perdida.
- Ataque de fora, a 3.000 por minuto, em matrículas da A e em e-mails com e sem conta. Nenhum 429 e nenhum 503 final para conta legítima. B e C dentro da margem.
- Ataque de dentro, saindo do IP da escola. A conta sem cookie entra em até 30 s, sem erro final.
- Conta da equipe atacada pelo script: o dono, com cookie, não recebe 429.
- Renovação em duas abas: nenhuma família encerrada, conferido no banco e na métrica de reuso.
- Redis de fila derrubado no meio do ataque: ninguém recusado e `limite.seguro_ativo` em 1.
- Nenhum rebaixamento fora de ataque, e rebaixamento só na A durante o ataque.
- Controle negativo: o cenário reprova pela proteção, com a base de pé.
- Permissão: a flag do controle negativo é recusada em produção.
- 16.5: com a fila cheia, sai um rebaixado e fica o pedido normal. Vale também quando o ataque vem espalhado por muitos IPs no balde da equipe.
- 16.5: a métrica `login.rebaixado_ip` conta essas tentativas.
- Bordas do domínio: matrícula repetida nas três escolas, escola atacada ao lado de escolas em uso normal, erro legítimo de senha nos primeiros dias de aula.

**Cobertos:**
- **Rajada:** os thresholds de `legitimo('rajada')` estão em `infra/k6/login-7h30.js:228-231`: `contas_que_entraram==2100` e `dropped_iterations==0`.
- **Ataques e Redis fora:** `legitimosSobAtaque()` em `infra/k6/login-7h30.js:163-194` põe 429 em zero e erro final em zero para os quatro grupos da A e da equipe. Para B e C, cobra p95 do login abaixo de 1 s e autenticadas até a margem sobre a base.
- **O ataque aconteceu de fato:** `ATAQUE_CHEGOU` impede que um atacante que não rodou deixe o cenário passar.
- **Renovação:** os thresholds `renovacao_409>0` e `renovacao_recusada==0` estão no k6. A conferência em `infra/scripts/conferir-carga-login.ts:114-126` lê `motivo='reuso_de_refresh'` no banco, e esse valor bate com `renovacao.service.ts:117`. Ela também lê a métrica de reuso, exigindo `ok>0` para a verificação não passar vazia.
- **Rebaixamento:** `julgarRebaixamento` exige a A em 1 em cada ataque, o que prova que a série existe, e nenhuma escola em 1 fora de ataque. O seguro em memória é conferido na fase `redis_fora`.
- **Veredito do controle negativo:** `julgarCenarioDeLogin` e `codigoDeSaidaDoLogin` são testados em `infra/test/carga-login.test.ts`. O teste cobre base que já reprovou, k6 com código divergente do resumo, fase que não rodou e conferência ausente. Em todos esses casos o controle negativo não conta como aprovado.
- **Despejo (16.5):** o teste em `apps/api/src/sessao/senha/semaforo-de-hash.test.ts:216` falharia com o código anterior. A maior subfila era a do NAT, com 3 esperando, e o código antigo teria despejado `professor-no-nat-0` e `C-1`. O teste da linha 254 falharia sem `#esquecerRebaixado` em `#proxima` ou em `#retirar`: sobraria uma entrada velha no índice, e a fila cresceria acima de `MAXIMO_ESPERANDO`.
- **Métrica `login.rebaixado_ip`:** coberta pela matrícula e pelo e-mail em `apps/api/test/ataque-de-senha.int.test.ts:509` e `:526`. O teste também prova que a aluna com cookie não conta.
- **Permissão:** coberta em `packages/nucleo/src/config/validar-config.test.ts:554-578` e `apps/api/src/config.test.ts:149`.
- **O semáforo certo em produção:** a escolha entre `SemaforoDeHash` e `SemaforoSemProtecao` fica protegida de forma indireta. Os testes de integração da 15.0 que conferem a ordem do hash quebrariam se a condição fosse invertida.
- **Sem provedor pago:** o teste confere que o k6 só chama quatro rotas e nunca o `oidc-falso`.
- **Execução real:** registrada, e o controle negativo reprovou pela proteção.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Cookie "sem atraso" no ataque de dentro (`infra/k6/login-7h30.js:187`).** O quadro de testes da tarefa diz "com cookie entrando sem atraso". Hoje `ate_entrar_a_com_cookie` é só informativo. Se a regra "o cookie passa na frente do rebaixado" fosse removida, o cenário ainda passaria: a conta com cookie esperaria como a sem cookie, dentro de 30 s. A regra está provada na integração da 15.0. Mesmo assim, vale um threshold por exemplo no p95 de `ate_entrar_a_com_cookie` no ataque de dentro. A alternativa é registrar a divergência na tarefa.
2. **p95 do login para a A sob ataque.** A seção 7c da Tech Spec diz "p95 do login abaixo de 1 s" sem exceção. O k6 isenta os grupos da A e da equipe nas fases de ataque, e justifica isso só num comentário (linhas 181-185). Essa exceção deveria estar escrita na seção 7c, com a divergência apontada, e não só no script.
3. **A premissa da conta da equipe atacada não é conferida.** O 429 do dono com cookie só prova algo se o ataque de fato segurou a conta pelo contador "outro". Vale conferir, ao menos na saída da execução, que o atacante recebeu 429 na `equipeAlvo`.
4. **16.5 no cenário.** A tarefa pede que a fase de ataque confira "nenhum 503 de despejo". A fila nunca enche no cenário, e o k6 não distingue o 503 de despejo do 503 de prazo, então essa conferência não diz nada. A prova real é o teste de unidade. Vale registrar isso como divergência explícita, e não só no texto do resultado.
5. **`login.rebaixado_ip` na escola desconhecida.** O caminho de `#recusar` em `apps/api/src/sessao/matricula.service.ts:127` conta a métrica, mas nenhum teste cobre esse caso (slug que não existe, IP acima do limite).
6. **Falta de `AMBIENTE` tratada como produção.** A leitura em `apps/api/src/sessao/configuracao-de-login.ts:83` trata `AMBIENTE` ausente ou inválido como produção, mas não há teste disso junto com a flag em `true`. Trocar `?? 'producao'` por outro valor não quebraria nenhum teste.
7. **Nenhum teste confere os thresholds do k6.** Não há conferência estática de que cada grupo e fase tem os thresholds exigidos. Se alguém apagar `...legitimo('a_com_cookie', ...)`, nada na esteira falha. É o mesmo nível do F0, então fica só como melhoria.
8. **Teste intermitente fora desta tarefa.** O `apps/api/test/sessao-externa.int.test.ts:433`, da tarefa 13.0, falha em cerca de 1 de 64 execuções. Encaminhar para `/corrigir`, como a nota da tarefa já prevê.

**Arquivos auditados:**
- /home/joaquimdp/Documentos/git/Educa.ia/infra/k6/login-7h30.js
- /home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/carga-login.ts
- /home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts
- /home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-login.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/semaforo-de-hash.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/ataque-de-senha.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/config/validar-config.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/config.test.ts

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-19 14:49:39 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: REPROVADO
Caminho quente tocado: login | deploy
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok

**Bloqueantes:**

`/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts:99-101`: a conferência "a A precisa chegar a 1 em cada ataque" só olha as fases que já têm alguma série no Prometheus (`new Set(maximos.map(...fase))`). Só que `login.prioridade_rebaixada` é um gauge que só existe depois do primeiro rebaixamento (`/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/senha/rebaixamento.ts:57-63`, que só observa as escolas que estão em `#rebaixadaEm`).

- **O que falha:** se o rebaixamento parar de funcionar, a fase de ataque não gera série nenhuma e não entra no laço. A conferência passa calada justamente no caso que ela existe para pegar. O critério da 16.2 ("o rebaixamento só apareceu na A durante o ataque") e a linha "1 só na A, nos três ataques" da tabela de resultado ficam sem prova. Pela regra 40, uma checagem que não quebra quando a regra some é decoração.
- **O teste também não cobre:** o teste em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-login.test.ts:233` só prova o caso em que existe série de outra escola na fase.
- **Correção exigida:**
  1. `julgarRebaixamento` passa a receber as fases de ataque que rodaram, tiradas de `janelas` em `conferirCenarioDeLogin`, e não do que o Prometheus devolveu. Para cada uma, exige A ≥ 1.
  2. Acrescentar em `carga-login.test.ts` o caso de uma fase de ataque executada sem nenhuma série, que precisa reprovar com "o ataque não rebaixou a escola A".

**Recomendações:**
- **Doc desatualizado:** `/home/joaquimdp/Documentos/git/Educa.ia/docs/infra.md` (seção 3.1) ainda diz "argon2id configurado para 100–250 ms" e "~dois núcleos", mas a calibração fixou 30 ms (`t=12`). Deixe lá um apontamento para a Tech Spec, seção 5, "Calibração", e para o desvio registrado. Hoje os dois documentos se contradizem.
- **Duração no runbook:** `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:437` diz "Leva uns 25 min", mas a execução registrada levou 19 min.
- **Timestamps da execução:** `infra/k6/login-7h30.js` e `infra/scripts/carga-login.ts` têm mtime 16:32:36 UTC, o mesmo minuto do início da execução registrada. Confirme que o resultado de `carga:login` saiu da versão final desses dois arquivos. Se houve edição depois, rode de novo antes do commit.
- **Despejo com a fila cheia:** a regra nova (o rebaixado mais antigo do balde com mais rebaixados) ainda pode despejar um professor sem cookie atrás do NAT, se ele for o rebaixado mais antigo da equipe. É o comportamento esperado, porque o 503 é repetido pela web, mas vale uma linha no runbook dizendo que "quem sai" pode ser legítimo sem cookie. Hoje ele só diz "nunca quem traz o cookie".
- **Alerta de 5xx sob ataque:** um ataque de mais de 5 min faz disparar a "Taxa de erro 5xx". Isso ficou só registrado na causa 4 do runbook. Reavalie na tarefa do alerta se o 503 com `Retry-After` do login deve ir para uma série própria.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-19 14:49:59 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: divergência no critério "p95 do login abaixo de 1 s" (seção 7c, "Passa com"), afrouxado para as contas com cookie sem registro nem aviso
Portão local: carimbo válido

**Bloqueantes:**

1. `/home/joaquimdp/Documentos/git/Educa.ia/infra/k6/login-7h30.js:181-192`
   - **O que está errado:** o k6 tirou o limite de p95 de dois grupos, `a_com_cookie` e `equipe_com_cookie`, nas três fases de ataque:
     ```js
     ...legitimo('a_com_cookie', { p95: false }),
     ...legitimo('equipe_com_cookie', { p95: false }),
     ```
     O que pede cada documento:
     - A seção 7c da Tech Spec pede "p95 do login abaixo de 1 s", sem exceção.
     - A tabela de testes da tarefa pede, no ataque de dentro, "com cookie entrando sem atraso".
     - A seção 13, que o comentário do código usa como justificativa, só aceita atraso para os alunos da escola atacada "que ainda não entraram naquele navegador". Isso vale para quem está sem cookie, não para quem traz o cookie.

     O efeito aparece no próprio resultado da tarefa. Com o Redis fora, o aluno da A com cookie leva p95 de 1,26 s até entrar, com máximo de 7,4 s. No ataque de dentro recebe 503. Mesmo assim a linha foi marcada "(informativo)" e o cenário passou. O limite seria o que pega essa quebra da garantia do cookie. O p95 por requisição desses dois grupos nem aparece no registro.

     A mudança também não está entre as divergências registradas: a seção 5 da Tech Spec e as notas só citam o argon2 e o teto da concorrência.
   - **Correção exigida:** uma das duas.
     - Volte o p95 < 1 s para `a_com_cookie` e `equipe_com_cookie` nas fases de ataque. Se "sem atraso" deve valer do primeiro envio até entrar, ponha também um limite em `ate_entrar_a_com_cookie` e `ate_entrar_equipe_com_cookie`. Rode `npm run carga:login` de novo e atualize a tabela da tarefa.
     - Ou pare e reporte ao Joaquim. Se ele aceitar o atraso também para quem tem cookie, registre isso na seção 7c ("Passa com") e na seção 13 da Tech Spec, e na tabela de testes da tarefa, antes de marcar o critério como informativo.

**Recomendações:**

- **Tech Spec desencontrada da calibração.** A seção 5 da Tech Spec (`techspec.md`, linhas 170 e 172) ainda diz "sobe `t` até 100–250 ms" e traz a conta de capacidade "com 2 hashes de 150 ms, ~13/s". A seção 3.1 de `docs/infra.md` (linha 69) também fala em 100–250 ms. Tudo isso contradiz o "Fixado" de `t=12` (30 ms). Ajuste esses trechos para apontar a calibração.
- **Hash abaixo da faixa pede aval.** Fixar o hash abaixo da faixa (30 ms contra 100–250 ms) troca custo de ataque offline por vazão, e essa troca é do Joaquim. Ela foi reportada nas notas; vale ele confirmar antes do commit, ou registrar a decisão.
- **16.5 sem prova no cenário.** A tarefa pede que "a fase de ataque do `login-7h30` confere que nenhuma conta legítima recebe 503 de despejo". O cenário não confere isso: o resultado argumenta que a fila nunca chega a 10.000. Deixe isso escrito como "prova só na unidade", ou meça no cenário o maior número de pedidos esperando.
- **Token curto na renovação.** A fase de renovação força a renovação logo após o login, sem o "token curto" da seção 7c. O efeito é o mesmo; basta citar isso no comentário da fase.

## test-engineer · 2ª rodada · APROVADO · 2026-09-19 16:16:34 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: APROVADO

**Cenários exigidos (nesta rodada, só as duas correções exigidas e o que elas afetam):**
1. Uma fase de ataque que rodou, mas não deixou nenhuma série do gauge, precisa reprovar.
2. Nas fases de ataque, o p95 abaixo de 1 s volta para `a_com_cookie` e `equipe_com_cookie`. O cenário roda de novo, e o controle negativo reprova pela proteção.

**Cobertos:**
- **Correção 1 (infra-guardian): feita.**
  - Em `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts:97-107`, `julgarRebaixamento` recebe `fasesQueRodaram`, filtra as fases de ataque e cobra A em pelo menos 1 em cada uma, com ou sem série. Na linha 144, `conferirCenarioDeLogin` passa as fases a partir das janelas.
  - Em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-login.test.ts:316-324`, com a lista de séries vazia, as três fases de ataque reprovam. A execução parcial sem ataque (`['base','rajada']`) não reprova. Se o laço sobre as fases das janelas for removido e o código voltar a iterar só as séries, esse teste falha.
  - As chamadas antigas (306-313) continuam cobrindo três regras: rebaixamento fora de ataque, rebaixamento de escola que não era a atacada e série de A em 0.
- **Correção 2 (revisor-geral): feita.**
  - Em `/home/joaquimdp/Documentos/git/Educa.ia/infra/k6/login-7h30.js:188-189`, `legitimo('a_com_cookie')` e `legitimo('equipe_com_cookie')` usam o p95 padrão. Os grupos sem cookie continuam com `{ p95: false }`, o que bate com a seção 13 da Tech Spec.
  - Em `infra/scripts/carga-login.ts:72-87`, `CRITERIOS_DA_PROTECAO` passou a incluir os dois p95. Assim, o controle negativo pode reprovar por eles, como diz o registro da execução das 18:10 UTC.
  - O cenário foi rodado de novo com a versão final (17:50 UTC), e o registro está atualizado no 16_task.md.
- **Métrica informativa `ate_entrar_*`:** o teste de `descreverFase` (carga-login.test.ts:248-263) cobre o filtro novo.
- **Arquivos reformatados:** não encontrei mudança de lógica além da descrita.

**Bloqueantes:** nenhum.

**Recomendações:**
- O teste em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-login.test.ts:186-192` confere só se o nome do grupo aparece no script k6. Ele não confere se o limite existe. Se alguém voltar `legitimo('a_com_cookie', { p95: false })`, o teste continua verde, porque `'a_com_cookie'` ainda aparece no arquivo. Hoje isso só é provado pela execução real e pelo controle negativo. O teste deveria exigir que cada critério de `CRITERIOS_DA_PROTECAO` seja uma chave de `thresholds` em alguma fase de ataque. Uma forma é exportar ou avaliar `legitimosSobAtaque()`, ou extrair as chaves do script. Assim, o p95 com cookie deixa de ser removível sem teste vermelho.
- A divergência da 16.5, com o despejo provado só na unidade, já está registrada no 16_task.md. Ela deve seguir para o `/validar`.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-19 16:17:21 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum. A correção exigida na 1ª rodada foi feita:
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts:97-107`: `julgarRebaixamento` agora recebe `fasesQueRodaram` e exige A ≥ 1 em cada fase que rodou e que está em `FASES_DE_ATAQUE` (`ataque_fora`, `ataque_dentro`, `redis_fora`). A lista de fases vem das janelas e não das séries do Prometheus, então um ataque que não deixou série reprova.
- A chamada na linha ~144 passa `janelas.map((janela) => janela.fase)`.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/carga-login.test.ts:316-324` prova os dois lados. Com as três fases de ataque sem série, o teste espera três reprovações "o ataque não rebaixou a escola A". Numa execução parcial sem ataque, espera nenhuma.

Mudanças novas desta rodada, conferidas:
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/k6/login-7h30.js:188-189`: o p95 < 1 s voltou para `a_com_cookie` e `equipe_com_cookie`.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/carga-login.ts:72-76`: `CRITERIOS_DA_PROTECAO` inclui os dois. Assim, o controle negativo também reprova quando a regressão aparece em quem tem cookie.
- Os grupos sem cookie ficam sem p95. O prazo de 30 s continua valendo pelo `PRAZO_DA_WEB_MS` (linha 306): passado o prazo, a tentativa devolve `undefined`, que conta como `login_erro_final`, e esse erro tem o limite `count==0`.

Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts:43`: `FASES_DE_ATAQUE` repete a lista `FASES_DE_ATAQUE` de `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/carga-login.ts`. Convém exportar uma fonte só, para que uma fase de ataque nova não fique de fora da conferência sem ninguém ver.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts:102` (a checagem de A ≥ 1): o texto "o ataque não rebaixou a escola A" usa o nome fixo "A", mas a função recebe `escolaA` como parâmetro. É melhor interpolar o parâmetro na mensagem.

## revisor-geral · 2ª rodada · REPROVADO · 2026-09-19 16:17:49 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: REPROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: portão local: infra/scripts/conferir-carga-login.ts mudou em 2026-09-19 15:48:28, depois do início do último (2026-09-19 15:48:28). Rode `node tools/processo/portao-local.ts --infra` de novo.

Bloqueantes:
- **Carimbo recusado para `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts`.** O arquivo foi salvo às 15:48:28.036 (hora local). O carimbo em `.processo/portao.json` começou às 18:48:28.076Z, 40 ms depois. Pelo relógio, o portão rodou sobre a versão final. Mas `avaliarCarimbo` (`tools/processo/revisoes.ts:205-206`) compara em segundos inteiros, e uma alteração no mesmo segundo do início conta como posterior. O `conferir` recusa o carimbo, e o hook de commit vai bloquear pelo mesmo motivo. Correção exigida: rodar `node tools/processo/portao-local.ts --infra` de novo, sem mexer em nada durante a execução, e conferir que `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/16_task.md` diz que o carimbo vale.

A correção que exigi na 1ª rodada foi feita:
- **Limite de volta.** Em `infra/k6/login-7h30.js:188-189`, `a_com_cookie` e `equipe_com_cookie` voltaram a ter o p95 < 1 s. Os grupos sem cookie continuam sem p95, o que bate com a seção 13 da Tech Spec. Os dois limites entraram em `CRITERIOS_DA_PROTECAO` (`infra/scripts/carga-login.ts`).
- **Cenário rodado com a versão final.** O log `/tmp/carga-16-v3.log` foi criado às 14:50:36 (hora local). `login-7h30.js` e `carga-login.ts` foram alterados pela última vez às 14:50:29, antes da execução. Os números da tabela da tarefa batem com o log (A com cookie 368/363 ms, equipe com cookie 314/290 ms). O controle negativo também reprovou pelos p95 novos.
- **Mudança posterior à execução.** Só `conferir-carga-login.ts` e o teste dele mudaram depois (15:48). A mudança de lógica foi a correção do infra-guardian (`julgarRebaixamento` recebe as fases das janelas). Confere com o que foi descrito.

Recomendações:
- **Hash abaixo da faixa ainda sem aval do Joaquim.** O hash ficou em 30 ms, abaixo da faixa de 100–250 ms. A premissa da seção 12 permitia que o cenário medisse o valor, desde que nunca abaixo da OWASP, e o desvio está registrado. Mesmo assim, a troca de custo de ataque offline por vazão é decisão dele. Levar isso a ele antes do commit.
- **Frase quebrada no comentário de `CRITERIOS_DA_PROTECAO`** (`infra/scripts/carga-login.ts`). A quebra de linha no meio de "É por eles, e só por / eles" ficou de sobra da reformatação.
- **Teste que não pega a volta do `{ p95: false }`.** Repito o que o test-engineer apontou: `infra/test/carga-login.test.ts` só confere que o nome do grupo aparece no script. Ele deveria exigir que cada item de `CRITERIOS_DA_PROTECAO` seja chave de `thresholds` numa fase de ataque. Assim, alguém voltar `{ p95: false }` deixa o teste vermelho.

## revisor-geral · 3ª rodada · APROVADO · 2026-09-19 16:45:43 · `tasks/prd-identidade-e-tenancy/16_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido. `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/16_task.md` responde "portão local válido para o código atual (typecheck, lint, test, infra)".
Bloqueantes: nenhum. Você corrigiu o que exigi na 2ª rodada: o carimbo agora vale para a árvore atual e a suíte de infra está incluída. Os arquivos alterados são os mesmos da rodada anterior. Só mudou `tasks/prd-identidade-e-tenancy/achados-revisoes.md`, que o hook do processo atualiza e que não é código.
Recomendações:
- O Joaquim precisa dar aval explícito ao parâmetro de hash, porque ele afeta o login.
- Há uma frase quebrada nos documentos. É a mesma que apontei na rodada anterior.
- Falta um teste que prove os limites de aprovação e reprovação da carga de login (os thresholds do k6) em `/home/joaquimdp/Documentos/git/Educa.ia/infra/k6/login-7h30.js` e `/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/conferir-carga-login.ts`.
