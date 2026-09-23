# Achados das revisões — `tasks/correcoes/2026-09-23-borda-manda-polling-sobreposto.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-23 14:25:03 · `tasks/correcoes/2026-09-23-borda-manda-polling-sobreposto.md`

VEREDITO: REPROVADO

**Cenários exigidos**
- O caso "handshake por polling" precisa continuar provando que, com o cookie, os 20 pacotes caem na mesma instância.
- O teste novo precisa provar que o 400 vem da sobreposição de POSTs e de nenhum outro motivo.
- Borda de carga: um POST ainda em andamento quando chega outro no mesmo `sid`.
- Contraprova: sem o cookie, a sessão cai na outra instância. Esse caso já existe e não mudou.

**Cobertos**
- O caso corrigido, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts:428-441`, continua provando o que diz. A borda usa `lb_policy cookie educa_realtime` (`/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile:64`), e sem o cookie a escolha entre as duas instâncias é aleatória. Então 20 POSTs em sequência, todos 200, só passam por acaso com chance de cerca de 2^-19. Mandar em sequência não enfraquece a prova. E a asserção do cookie na linha 430 continua lá.
- O teste novo espera por condição: repete até 50 vezes e para quando recebe 400. Não depende de tempo fixo. Se o engine.io aceitasse POST sobreposto, o segundo receberia 200 nas 50 tentativas e o teste ficaria vermelho. Nisso ele falha sem a regra.
- Não há `.skip`, mock nem provedor pago.

**Bloqueante**

1. `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts:444`, `:451`, `:462`, `:464`: o teste novo pode passar pelo motivo errado.
   - **O problema:** as duas asserções olham só `status === 400`. Só que o engine.io devolve 400 em dois casos diferentes:
     - na sobreposição (`polling.js:91-96`), com corpo vazio;
     - em "Session ID unknown" (`server.js:726-729`, código 1), com corpo JSON.
   - O segundo caso é justamente o que o teste vizinho usa como prova de que a sessão caiu na outra instância. Se o cookie não prender (instância trocada ou sessão já fechada), a primeira tentativa já recebe 400 "Session ID unknown", e o teste fica verde sem que haja sobreposição nenhuma.
   - Piora com a linha 451: `Cookie: ${cookie ?? ''}` manda um cookie vazio quando ele não veio, e o teste não confere se veio.
   - **Correção exigida:**
     - Depois de `pollingPelaBorda()` (linha 444), afirmar `expect(cookie).toMatch(/^educa_realtime=[0-9a-f]+$/)`.
     - No 400 que encerra o laço (linha 462), afirmar que o corpo **não** é o de sessão desconhecida. O mais simples é exigir corpo vazio, que é o que a linha 94 de `polling.js` responde.
     - Na chamada seguinte (linha 464), afirmar o corpo `{"code":1,"message":"Session ID unknown"}`. Isso prova que foi a sobreposição que fechou o transporte, e não outro motivo.
   - Na prática, guardar a `Response` inteira dentro do laço, e não só o `status`.

**Recomendações**
- Confirmar o outro lado do fenômeno: ler o socket cru `primeiro` e afirmar que ele recebe o 503 da borda ou é fechado. É a metade da assinatura da esteira (o `doClose` destrói o POST em andamento, `polling.js:299`) que o documento da correção descreve e o teste não prova.
- O nome do teste afirma uma regra do repositório ("nenhum teste manda pacotes em paralelo") que ele não verifica. Sugiro tirar a segunda metade do nome, ou deixá-la só no comentário.
- O limite de 50 tentativas com 100 ms de espera fica bem abaixo dos cerca de 45 s de `pingInterval` + `pingTimeout`. Então o teste não corre o risco de a sessão expirar no meio. Fica registrado como premissa, caso esses tempos mudem na configuração do realtime.

Eu só auditei, não editei nenhum arquivo. Não conferi o portão com `--infra`, que ainda está rodando.

## test-engineer · 2ª rodada · APROVADO · 2026-09-23 14:27:17 · `tasks/correcoes/2026-09-23-borda-manda-polling-sobreposto.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- O caso "handshake por polling" continua provando que, com o cookie, os 20 pacotes caem na mesma instância, agora mandados em sequência.
- O teste novo prova que o 400 vem da sobreposição de POSTs, e não da sessão desconhecida.
- Borda de carga: um POST ainda em andamento quando chega outro no mesmo `sid`.
- Contraprova: sem o cookie, a sessão cai na outra instância. Esse caso não mudou.

**Cobertos:** as três correções exigidas na 1ª rodada foram feitas.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts:447` confere o cookie da borda (`/^educa_realtime=[0-9a-f]+$/`) antes de qualquer POST. Sem essa conferência, o 400 da outra instância podia deixar o teste verde.
- `:460-466`: o laço agora guarda o status e o corpo da resposta, e exige `{ status: 400, corpo: '' }`. Corpo vazio só sai do 400 de sobreposição (`polling.js:94`). O 400 de sessão desconhecida vem com JSON, então não fecha mais o teste.
- `:469-470`: a chamada seguinte exige `{"code":1,"message":"Session ID unknown"}`. Isso prova que foi a sobreposição que fechou o transporte.
- `:451`: `String(cookie)` substituiu o `cookie ?? ''`. Como a linha 447 já garante que o cookie veio, o cabeçalho nunca vai vazio.
- O teste falharia sem o comportamento do protocolo em três situações:
  - se o engine.io aceitasse POST sobreposto, as 50 tentativas receberiam 200 e o teste ficaria vermelho;
  - se o Caddy retivesse o corpo e o primeiro POST não chegasse ao realtime, também ficaria vermelho, e não verde por engano;
  - se a sessão estivesse presa na instância errada, o corpo JSON derrubaria a asserção.
- A espera é por condição, não por tempo fixo. Não há `.skip`, mock nem provedor pago.

**Bloqueantes:** nenhum.

**Recomendações:**
- Continua em aberto, da rodada anterior: ler o socket cru `primeiro` e afirmar que ele recebe o 503 da borda ou é fechado. É a outra metade da assinatura da esteira (`polling.js:299`), que o documento da correção descreve e o teste não prova.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts:433` ainda tem `cookie ?? ''`. É inofensivo, porque a linha 430 garante o cookie, mas vale trocar por `String(cookie)` para ficar consistente com o caso novo.
- Continua registrada a premissa de tempo: 50 tentativas × 100 ms ficam bem abaixo do `pingInterval` + `pingTimeout` do realtime. Se esses tempos mudarem, o limite do laço precisa ser revisto.

Não conferi o resultado do portão `--infra`, que ainda está rodando.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-23 14:28:30 · `tasks/correcoes/2026-09-23-borda-manda-polling-sobreposto.md`

VEREDITO: APROVADO

Caminho quente tocado: nenhum. Só o teste de infra da borda mudou (`/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts`), sem mudança no Caddyfile, no compose nem no realtime.

Rate limit: não se aplica (nada mudou)

Fila e prioridade: não se aplica

Concorrência: não se aplica ao código de produção. O teste novo mostra de forma determinística que o engine.io recusa POST sobreposto. A troca do `Promise.all` por envio em sequência deixa o teste igual ao cliente real, que enfileira os pacotes.

Índice e paginação: não se aplica

Degradação de IA: não se aplica

Migration: não se aplica

Métrica e alerta: não se aplica

Bloqueantes: nenhum.

Conferido contra a sua lista:
- **Espera por serviço:** o teste espera por condição, com no máximo 50 tentativas de 100 ms, uns 5 a 10 s. Fica abaixo do `testTimeout` de 60 s em `/home/joaquimdp/Documentos/git/Educa.ia/vitest.config.ts:16`.
- **Recursos do compose:** não mudam.
- **Socket cru:** é fechado no `finally` com `destroy()`.
- **Borda:** o `reverse_proxy` repassa o corpo ao realtime sem esperar ele chegar inteiro. Por isso o POST retido fica mesmo em andamento no realtime, e o 400 com corpo vazio só pode vir da sobreposição.
- **Restante da suíte:** a sessão que o teste encerra é descartável. A política de cookie e a sonda não mudam.

Recomendações:
- **Socket cru sem ouvinte de erro.** Em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts:448`, depois de `once(primeiro, 'connect')` o `primeiro` não tem ouvinte de `'error'`. Quando a sobreposição fecha o transporte, a borda responde e fecha a conexão com o corpo ainda pendente. Um `ECONNRESET` nessa hora, se vier, sai como erro sem tratamento e derruba o worker do vitest, não só este caso. A correção é acrescentar `primeiro.on('error', () => {})` ou guardar o erro para conferir no fim.
- **Corrida na primeira tentativa.** Em `borda.int.test.ts:460-465`, na primeira volta do laço o `fetch` sai logo depois de o cabeçalho cru ser escrito. Se o POST curto do `fetch` chegar antes ao realtime e ainda estiver lendo o corpo quando o cru chegar, a recusa cai no POST cru. Aí o `fetch` recebe 503 e a tentativa seguinte recebe 400 "Session ID unknown", que para o laço e falha no `toEqual({ status: 400, corpo: '' })`. A janela é de menos de 1 ms, mas é o mesmo tipo de sorte de agendamento que esta correção tira. Dá para fechar de dois jeitos:
  - só parar o laço no 400 com corpo vazio, e aceitar como fechamento pela sobreposição também o 400 que o socket cru receber;
  - ler a resposta do socket cru e aceitar qualquer um dos dois como o recusado.
- **Assinatura da esteira.** O 503 seguido de 400 em cascata ainda está no `TODO.md` desde 20/09/2026. Registre lá que esta correção fecha esse item, para o `/retro` não reabrir.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-23 14:29:27 · `tasks/correcoes/2026-09-23-borda-manda-polling-sobreposto.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A correção mexe só no teste de integração da borda (`infra/test/borda.int.test.ts`) e no `TODO.md`. Não muda código de realtime, de borda nem de produção.
Rate limit: ok. Não foi tocado.
Fila e prioridade: ok. Não foi tocada.
Concorrência: protegida. O teste agora envia os 20 pacotes em sequência, como o engine.io-client faz. A sobreposição virou um caso próprio, que espera por condição com teto de 50 tentativas de 100 ms, e não por tempo fixo.
Índice e paginação: ok. Não se aplica.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Não se aplica.
Bloqueantes: nenhum.

As três recomendações da rodada anterior foram aplicadas:
- **Ouvinte de `error` no socket cru:** `primeiro.on('error', () => undefined)` fica antes de `await once(primeiro, 'connect')`. O reset que a borda manda ao fechar o transporte não derruba mais o worker.
- **Janela de menos de 1 ms da primeira tentativa:** está resolvida pela espera por condição e pelo comentário que explica o motivo. Se o POST de teste chegar antes do primeiro, recebe 200 e o laço tenta de novo. Não vira falso positivo nem falso negativo.
- **`TODO.md`:** o item do "503 seguido de 400" está marcado como fechado, com a causa real (POST sobreposto no mesmo `sid`, não ordem entre casos) e o link para `tasks/correcoes/2026-09-23-borda-manda-polling-sobreposto.md`.

Recomendações:
- O teste de sobreposição depende de o Caddy repassar o cabeçalho ao realtime antes de chegar o corpo. Hoje o `reverse_proxy` faz isso. Se um dia a borda passar a juntar o corpo da requisição antes de repassar (`request_buffers`), o laço esgota as 50 tentativas e o teste fica vermelho. Vale uma linha no comentário do caso, ligando essa premissa à configuração da borda em `infra/`.
- O veredito vale para o diff. O resultado do portão `--infra`, que ainda está rodando, continua sendo condição para o commit.

## test-engineer · 3ª rodada · APROVADO · 2026-09-23 14:29:29 · `tasks/correcoes/2026-09-23-borda-manda-polling-sobreposto.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** com o cookie da borda, 20 pacotes enviados em sequência no mesmo `sid` recebem 200 e ficam na mesma instância.
- **Borda 1:** um POST sobreposto no mesmo `sid` recebe 400 com corpo vazio, e o transporte fecha.
- **Borda 2:** o pacote seguinte no mesmo `sid` recebe 400 "Session ID unknown". Isso prova que foi a sobreposição que fechou a sessão, e não uma troca de instância.
- **Pré-condição:** o cookie veio antes do teste. Sem ele, o 400 poderia ser o de sessão desconhecida na outra instância.
- **Robustez:** quando a borda fecha a conexão crua, o reset não derruba o worker do vitest.
- **Permissão e isolamento de escola:** não se aplicam, porque é teste de infra da borda e não toca dado de escola.

**Cobertos:** todos os cenários acima. Neste diff:
- **O ouvinte de `error` não esconde falha de conexão.** Ele está em `infra/test/borda.int.test.ts`, no caso "o engine.io recusa POST sobreposto", logo antes do `once(primeiro, 'connect')`. O `events.once` do Node registra o próprio ouvinte de `error` enquanto espera `connect` e rejeita se ele disparar. Se a borda estiver fora, o teste continua falhando. O ouvinte só absorve o `ECONNRESET` que chega depois, quando a borda fecha a conexão com o corpo retido. É exatamente o caso que o infra-guardian apontou.
- **O `destroy()` no `finally` continua fechando o socket** em qualquer saída.
- **O teste ainda prova a regra.** Se a recusa de sobreposição não existisse, o laço terminaria sem 400 e o `toEqual({ status: 400, corpo: '' })` falharia. Se o 400 viesse de sessão desconhecida, o corpo não seria vazio e o teste também falharia.
- **O TODO.md fecha o item antigo** com a causa correta: POSTs em paralelo no mesmo `sid`, e não contaminação de ordem entre casos. Aponta para o documento da correção.
- Não há `.skip`, teste comentado nem mock de coisa nossa.

**Bloqueantes:** nenhum.

**Recomendações:**
- **A janela aceita, se ocorrer, gera um vermelho confuso.** Se o `fetch` da primeira tentativa chegar ao realtime antes do POST cru, é o cru que recebe o 400 da sobreposição, e o `fetch` volta 503 da borda. O laço segue, a tentativa seguinte recebe 400 com o corpo "Session ID unknown", e a asserção de corpo vazio falha. É vermelho, não verde falso, mas a mensagem de erro não diz o motivo. Vale uma linha no documento: se esse caso ficar vermelho com esse corpo, olhe primeiro essa janela.
- Fica para o `/retro`: a outra falha da borda da mesma semana (porta do host tomada na religação do `realtime-2`, run 35884794643) precisa de uma entrada no `TODO.md` até ganhar correção própria, para não se perder.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts
- /home/joaquimdp/Documentos/git/Educa.ia/TODO.md
- /home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-23-borda-manda-polling-sobreposto.md
