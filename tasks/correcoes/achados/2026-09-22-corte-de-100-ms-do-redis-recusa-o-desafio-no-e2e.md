# Achados das revisões — `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-22 16:24:40 · `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

VEREDITO: REPROVADO

**Cenários exigidos** (correção de prazo por ambiente no caminho do login)
1. Caminho feliz fora de produção: Redis de fila respondendo acima de 100 ms e o login concluindo a etapa `escolher`.
2. O corte de 100 ms continua valendo em produção e no staging — **na unidade** (cliente montado direto) **e na aplicação montada como o contêiner a monta** (é o que a correção mexeu: `sessao.module.ts:117`).
3. Prazo por ambiente: `local`, `staging`, `producao`.
4. Borda de configuração: `AMBIENTE` ausente ou inválido.
5. Borda de montagem: a opção de teste (`MONTAGEM_DE_TESTE`) continua vencendo a configuração.
6. Carga/concorrência (regra 80): Redis conectado e sem responder — não é o caminho do "Redis fora".
7. Contaminação entre casos: a pausa do Redis não pode vazar para o caso seguinte nem para o arquivo seguinte.
8. Permissão/isolamento: não se aplica — a correção não toca autorização, escopo de tenant nem campo de pessoa.

**Cobertos**
- (1) `apps/api/test/troca-de-escola.int.test.ts:700` — e prova mais que "respondeu 200": afirma `etapa === 'pronta'`, `cliente.status === 'ready'` (separa do caminho "Redis fora") e ausência de `login.desafio_sem_redis` no log da instância. Com o prazo antigo nesta montagem era 401, como o documento registra.
- (2, parte da unidade) `desafio.int.test.ts:66`, `contador-de-tentativas.int.test.ts:105`, `senha/contador-em-janela.int.test.ts:97`, `limite.int.test.ts:482-510`: todos criam o cliente com `criarClienteRedisDaApi(...)` sem prazo, ou seja, o padrão de 100 ms de `packages/nucleo/src/redis/clientes.ts:27`. **Nenhum deles passa pela configuração**, então nenhum foi afrouxado por esta mudança. A pergunta 2, para esses quatro, está respondida: seguem provando o corte.
- (3) `apps/api/src/config.test.ts:157-168`, com `local`, `staging` e `producao`.
- (5) `MONTAGEM_DE_TESTE` vence pelo `??` em `sessao.module.ts:117`, exercitada por todos os arquivos que montam com ela.
- (6) `travarRedis` (`CLIENT PAUSE ... ALL`) com `expect(cliente.status).toBe('ready')`.

**Bloqueantes**

1. `apps/api/test/ataque-de-senha.int.test.ts:581-601` — **o único teste que provava o corte de 100 ms na aplicação montada parou de prová-lo, e continua verde.** Ele monta de propósito com a montagem vazia (`subirApi(medidorDoDesafio.medidor, {}, undefined, {})`, linha 585) sob o comentário da linha 584: *"A montagem de produção (sem o prazo maior do teste): o corte dos 100 ms é o que se prova"*. Depois da mudança, montagem vazia não é mais montagem de produção: `app.module.ts:58` não passa nada, e `sessao.module.ts:117` cai em `opcoes.login.prazoDoRedisMs`, que no ambiente de teste é 2 s (`.env.example:4` tem `AMBIENTE=local`; `infra/teste.env` não sobrepõe; `config.test.ts:90` fixa `prazoDoRedisMs: 2000` para esse ambiente). Como a pausa do teste é de 3 s, `consumir` ainda rejeita — só que aos 2 s, não aos 100 ms. O teste passou a provar o prazo da fila, com o comentário dizendo o contrário.
   Consequência direta: **a linha que a correção escreveu não tem teste que falhe se ela estiver errada no sentido de produção.** Trocar `sessao.module.ts:117` por `opcoes.prazoDoRedisMs ?? TIMEOUT_COMANDO_REDIS_FILA_MS` (isto é, jogar fora a configuração e afrouxar produção) mantém a suíte inteira verde: `config.test.ts` só prova o valor lido, nunca a fiação até o cliente; o teste novo de `troca-de-escola` passa com 100 ms ou 2 s; e este aqui passa com 2 s.
   Correção exigida: fazer esse caso montar com o prazo de produção de novo e provar que o corte é curto. O caminho que exercita a fiação nova inteira é `configuracaoDeTeste({ ambiente: { AMBIENTE: 'staging' } })` (staging aceita `ROTAS_SINTETICAS`, só `producao` barra), e não `prazoDoRedisDeLoginMs`, que pula justamente a linha alterada; e acrescentar asserção de duração da recusa (`< TIMEOUT_COMANDO_REDIS_FILA_MS / 2`, na forma que `limite.int.test.ts:490` já usa), para que mover o corte para 2 s fique vermelho em vez de silencioso. Atualizar o comentário da linha 584 junto.

2. `apps/api/test/api-com-sessao.ts:19-21`, `apps/api/test/configuracao-de-teste.ts:11-16` e `apps/api/src/app.module.ts:40` — três docblocks afirmam um comportamento que a correção acabou de extinguir: que montar sem `MONTAGEM_DE_TESTE` / sem `prazoDoRedisDeLoginMs` dá "os 100 ms de produção", e que "os testes que provam o corte montam sem ela". Depois da mudança, montar sem ela dá 2 s em qualquer teste. É o comentário que escondeu o bloqueante 1 e que vai esconder o próximo: precisa dizer que, sem a opção, quem manda é o `AMBIENTE`, e apontar como um teste pede o prazo de produção.

**Recomendações**

- `apps/api/test/troca-de-escola.int.test.ts:32` — a margem de `PAUSA_DO_RUNNER_CARREGADO_MS = 250` é a mais apertada da casa: os outros quatro casos de Redis travado usam 3 s contra um corte de 100 ms (30x), este usa 250 ms contra 100 ms (2,5x). A instância roda no mesmo event loop do teste e o limitador bate no Redis de cache (que não está pausado), então o comando deve sair em dezenas de ms; ainda assim, se no runner carregado o `conferirLivre` sair depois dos 250 ms, o teste passa sem ter provado nada, e passa em silêncio — justamente na máquina para a qual ele foi escrito. O prazo novo é 2 s: dá para subir a pausa para ~1 s e manter zero risco de vermelho falso.
- `apps/api/test/troca-de-escola.int.test.ts:740` — `await travado.fim` está no fim do `try`. Se qualquer asserção acima falhar, a pausa de 250 ms segue viva pelo `afterAll` e pode entrar no arquivo seguinte (`fileParallelism: false` garante um arquivo por vez, mas não que a pausa tenha acabado). Na resposta à pergunta 3: no caminho verde não contamina nada — é o último caso do arquivo, a pausa é aguardada, e a integração não sobe contêiner de API/worker que use o Redis de fila; no caminho vermelho, contamina. Mover `await travado.fim` para o `finally` fecha isso.
- `apps/api/src/config.test.ts:167` — `expect(lerAmbienteExemplo()['AMBIENTE']).toBe('local')` olha só o `.env.example`, mas o contêiner do e2e recebe `.env.example` + `infra/teste.env` (`tools/ci/compose.ts:12,18`). Se um dia `teste.env` sobrepuser `AMBIENTE`, a asserção segue verde e o e2e volta a quebrar. `lerAmbienteDeTeste()['AMBIENTE']` é o valor que o contêiner vê de fato.
- `AMBIENTE` ausente ou inválido (pergunta 4): o documento afirma que vale como `producao`, e o código faz isso em `configuracao-de-login.ts:161`. Só que o ramo é inalcançável por `lerConfiguracao`: `esquemaAmbienteIdentidade` (`packages/nucleo/src/config/validar-config.ts:51`) exige `AMBIENTE: z.enum(AMBIENTES)` e derruba o boot antes. Por isso não bloqueio a falta do caso; vale uma linha em `configuracao-de-login.ts` dizendo que a leitura restrita é defesa em profundidade, porque o boot já cai, para ninguém ler o `?? 'producao'` como a garantia.
- Staging (pergunta 4): fica nos 100 ms, e o host de staging pode ser tão fraco quanto o runner. `docs/infra.md` 5.2 agora diz os dois prazos, mas não diz o que o operador vê se isso disparar lá — `login.desafio_sem_redis` + 401 em `POST /v1/sessao/escola`. Uma frase no runbook evita que a próxima pessoa procure um Redis travado.
- A correção moveu só o cliente do login. No mesmo runner, `limite.module.ts:40` (`api-limite`) e `uso.module.ts:24` (`api-uso`) continuam cortando em 100 ms. Nenhum dos dois recusa login (caem no seguro em memória), então não é o mesmo defeito, mas vão gerar `limite.seguro_ativo` e avisos durante o e2e: vale registrar no documento para o próximo intermitente não ser investigado do zero.
- `apps/api/test/troca-de-escola.int.test.ts:700` cria uma segunda instância cujo log (`logDoCompose`) não entra na varredura de segredos que o arquivo faz em `linhasDeLog` (linha 284). Os mesmos caminhos já são varridos pela primeira instância, então não é furo de regra 20; é coerência barata de manter.

## test-engineer · 2ª rodada · REPROVADO · 2026-09-22 17:04:30 · `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

Auditei o diff da rodada 2 e rodei as mutações eu mesmo (com os contêineres de teste de pé), restaurando a árvore ao estado original depois — `git diff --stat` confere com o de entrada.

```
VEREDITO: REPROVADO

Cenários exigidos (os mesmos da rodada 1)
1. Caminho feliz fora de produção: Redis de fila acima de 100 ms e o login concluindo `escolher`.
2. O corte de 100 ms continua valendo em produção/staging, na unidade e na aplicação montada.
3. Prazo por ambiente: `local`, `staging`, `producao`.
4. Borda: `AMBIENTE` ausente ou inválido.
5. Borda: a opção de montagem continua vencendo a configuração.
6. Carga (regra 80): Redis conectado e sem responder, não "Redis fora".
7. Contaminação entre casos: a pausa não vaza para o caso/arquivo seguinte.
8. Permissão/isolamento: não se aplica.

Cobertos
- (1) troca-de-escola.int.test.ts:702 — verificado por mutação: com `sessao.module.ts:117` fixo em 100,
  o caso fica vermelho ("expected 401 to be 200"). Falha se a regra sumir.
- (2) ataque-de-senha.int.test.ts:585-601 — B1 fechado. Verificado por mutação: com
  `opcoes.prazoDoRedisMs ?? 2_000`, vermelho em "expected 2010.46 to be less than 1000".
  A asserção de duração é o que segura; sem ela a mutação passaria em silêncio.
- (2, unidade) desafio/contador/janela/limite seguem montando o cliente direto, fora da configuração.
- (3) config.test.ts:157-168 — verificado por mutação: com `prazoDoRedisDoLogin` devolvendo sempre
  o prazo da fila, vermelho em "expected 2000 to be 100".
- (4) inalcançável por `lerConfiguracao`; nota de defesa em profundidade acrescentada — aceito.
- (5) `??` em sessao.module.ts:117. (6) `travarRedis` + `cliente.status === 'ready'`.
- (7) `await travado?.fim` no `finally` (troca-de-escola.int.test.ts:748) — corrigido.

Bloqueantes

1. Resto do B2 da rodada 1 — três docblocks que o diff acabou de tornar falsos, e que são
   exatamente a instrução que produziu o buraco da rodada 1. (Sub-escopei o B2 na rodada 1:
   grepei só `apps/api/test` e `app.module.ts`. A falha de escopo é minha; o conserto é mecânico.)
   - `packages/nucleo/src/redis/clientes.ts:23-25` — o pior dos três, porque é o docblock do
     parâmetro que a linha alterada preenche: "`timeoutMs` só muda na montagem de teste (a opção
     `prazoDoRedisDeLoginMs` do `AppModule`, que o `main.ts` não passa) […] Produção usa sempre os
     100 ms, e os testes que provam o corte também." É falso em duas frentes: o `main.ts` agora
     passa `timeoutMs` em todo boot (via `config.login.prazoDoRedisMs`), e em `local` o cliente do
     login roda com 2 s em tempo de execução de verdade, não só numa montagem de teste. Quem for
     escrever o próximo teste do corte lê isto e repete a rodada 1.
     Correção exigida: dizer que o cliente do login recebe o prazo da configuração
     (`prazoDoRedisDoLogin`), que `prazoDoRedisDeLoginMs` o fixa por cima, e que quem prova o corte
     ou monta o cliente direto ou passa `login.prazoDoRedisMs`.
   - `apps/api/src/sessao/sessao.module.ts:89-91` — o docblock da classe ainda diz "com o cliente
     da API (sem fila offline, 100 ms por comando)", doze linhas abaixo do docblock da opção que o
     diff corrigiu. O mesmo arquivo afirma as duas coisas.
   - `apps/api/src/sessao/desafio.ts:131-132` — "não respondeu no prazo do cliente (100 ms)": é o
     componente cujo ponto de corte a correção moveu.

2. `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md:83-88` — o
   documento descreve um teste que não existe: "monta com `{ ambiente: { AMBIENTE: 'staging' } }`,
   que é o que exercita a linha alterada". O que está no código é
   `{ login: { prazoDoRedisMs: TIMEOUT_COMANDO_REDIS_API_MS } }`, por um motivo que só existe na
   sua mensagem e em lugar nenhum do repositório: `staging` derruba a configuração em
   `MOTIVO_EMISSOR_SEM_TLS` (`configuracao-externa.ts:83,98`), porque o `oidc-falso` é http.
   Correção exigida: trocar esse parágrafo pelo caminho real, registrar por que o `AMBIENTE`
   não serve (senão a próxima pessoa tenta de novo e leva o `ConfiguracaoInvalida`), e dizer que a
   fiação fica provada em duas metades que se encontram em `ConfiguracaoLogin.prazoDoRedisMs`:
   `config.test.ts` do `AMBIENTE` até o campo, `ataque-de-senha`/`troca-de-escola` do campo até o
   cliente. Citar também o `SobreposicaoDeTeste.login` novo, que o documento não menciona.

Recomendações
- `apps/api/test/configuracao-de-teste.ts:26-35` — `login?: Partial<ConfiguracaoLogin>` é uma porta
  larga demais para o caso de uso: ela também alcança `protecaoDesligada`, que a configuração recusa
  em `AMBIENTE=producao` de propósito, e `hash`/`concorrenciaDoHash`. Nenhum teste faz isso hoje;
  `Pick<ConfiguracaoLogin, 'prazoDoRedisMs'>` fecha a porta sem custo e mantém o docblock honesto.
- `apps/api/test/troca-de-escola.int.test.ts:708` — a segunda instância continua com `logDoCompose`
  fora da varredura de `segredosVistos` (linha 284). Os mesmos caminhos já são varridos pela
  primeira instância, então **não** é furo de regra 20 e minha resposta à sua pergunta é: não precisa
  fazer. Fica registrada porque o log novo é `nivel: 'trace'` sobre um fluxo de login com e-mail e
  desafio, e o laço de varredura é uma linha.
- Nada a fazer sobre a fiação: com as três mutações acima verificadas, não sobrou trecho sem teste
  entre `AMBIENTE` → `prazoDoRedisMs` → cliente. A única mutação não coberta é inverter a ordem do
  `??` em sessao.module.ts:117, e ela é inócua: em `local` os dois lados valem 2 s.
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/redis/clientes.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/sessao.module.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/desafio.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/test/configuracao-de-teste.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`.

## infra-guardian · 1ª rodada · REPROVADO · 2026-09-22 17:05:19 · `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

Auditoria concluída. Observação de método: a árvore mudou durante a auditoria — às 17:02:07 `apps/api/src/sessao/sessao.module.ts:117` esteve com `opcoes.prazoDoRedisMs ?? 2_000` (mutante), e às 17:02:30 voltou para `opcoes.prazoDoRedisMs ?? opcoes.login.prazoDoRedisMs`. Auditei este último estado, que é o que `node tools/processo/portao-local.ts conferir` dá como coberto pelo carimbo (typecheck, lint, test, e2e, infra).

```
VEREDITO: REPROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
```

**Bloqueantes**

1. `infra/carga.env` (+ `.env.example:4`, `infra/scripts/carga-login.ts:17-35`) — o cenário de carga **"login às 7h30" passou a rodar com 2 s** e ninguém registrou. `ARQUIVOS_AMBIENTE_CARGA = ['.env.example', 'infra/carga.env']` (`infra/scripts/carga.ts:31`), `carga.env` não sobrepõe `AMBIENTE` e `infra/compose.carga.yml` também não, então as APIs do projeto `educa-carga` sobem com `AMBIENTE=local` → `prazoDoRedisMs = 2000`. Antes deste diff o mesmo cenário rodava com os 100 ms do padrão de `criarClienteRedisDaApi`. Consequência: o único lugar onde o corte de 100 ms é medido com 2.100 contas em rajada — exatamente o risco escrito em `docs/infra.md` 5.2 ("um `addBulk` grande às 7h30 é o que faria esses 100 ms cortarem no meio da entrada dos alunos") — deixou de exercitar produção, e um `npm run carga:login` verde não prova mais que o corte sobrevive à rajada. A fase `redis_fora` não cobre isso: ela usa `compose stop` (`carga-login.ts:477`), o cliente fica `not ready` e a recusa é imediata, independente do prazo. A calibração do hash da 16.0 também foi medida com o prazo antigo. **Correção exigida:** fixar o prazo de produção no projeto de carga (não dá para trocar `AMBIENTE` para `staging`: `configuracao-externa` exige emissor e retorno https e o `oidc-falso` é http — então precisa ser por opção de montagem do compose de carga ou equivalente); se ficar em aberto, registrar no documento da correção, em `docs/infra.md` 5.2 e no docblock de `infra/scripts/carga-login.ts` que o cenário roda com 2 s e o que ele deixou de provar, com o item correspondente no `TODO.md`.

2. `packages/nucleo/src/redis/clientes.ts:23-25` — docblock agora falso, no arquivo mais próximo da mudança: *"`timeoutMs` só muda na montagem de teste (a opção `prazoDoRedisDeLoginMs` do `AppModule`, que o `main.ts` não passa)… Produção usa sempre os 100 ms, e os testes que provam o corte também."* Desde este diff o `timeoutMs` do cliente do login muda também pelo `AMBIENTE`, sem opção de montagem. É a mesma classe do bloqueante 2 do `test-engineer` (os três docblocks corrigidos em `api-com-sessao.ts`, `configuracao-de-teste.ts` e `app.module.ts`), e este quarto ficou. Mesmo defeito em `apps/api/src/sessao/desafio.ts:131-132`: *"não respondeu no prazo do cliente (100 ms)"*. **Correção exigida:** os dois docblocks dizem que o prazo do cliente do login sai do `AMBIENTE` (100 ms em produção e staging, 2 s em `local`) e apontam `prazoDoRedisDoLogin`.

3. `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md:86` — o documento diz que o caso refeito *"monta com `{ ambiente: { AMBIENTE: 'staging' } }`, que é o que exercita a linha alterada"*. O código em `apps/api/test/ataque-de-senha.int.test.ts:589` monta com `{ login: { prazoDoRedisMs: TIMEOUT_COMANDO_REDIS_API_MS } }` — caminho diferente (e correto, porque `staging` exigiria https no emissor externo, como o próprio `configuracao-de-teste.ts:29-34` explica). O documento é o artefato que o `/validar` e a próxima rodada leem, e repete o erro que originou o achado 1: o texto afirma uma coisa, o código faz outra. **Correção exigida:** descrever o que o teste faz de fato e dizer que a fiação é provada em duas peças (`config.test.ts` para o mapa `AMBIENTE`→prazo; `ataque-de-senha` para o prazo da configuração chegar ao cliente, com a asserção de duração).

**Recomendações**

- `apps/api/test/troca-de-escola.int.test.ts:747` — a margem do caso novo é 2x (pausa de 1 s contra corte de 2 s), a mais apertada dos casos de Redis travado da casa. O erro cai para o lado seguro (vermelho, não verde silencioso), mas é o mesmo runner que motivou a correção.
- `limite.module.ts:40` / `uso.module.ts:24`: concordo com o recorte. `ContadorDeUso` é fire-and-forget e `LimitadorDeRequisicoes` cai no seguro em memória sem nunca recusar por causa do Redis (`packages/nucleo/src/limite/limitador.ts:127-131`). Só acrescente ao "O que fica em aberto" que o seguro usa `limite ÷ instâncias` (`limiteDoSeguro`): no runner, Redis de cache lento derruba o teto pela metade e o sintoma do próximo intermitente pode ser **429**, não só aviso.
- `apps/api/src/config.test.ts:90` usa o literal `2000` onde as outras linhas do mesmo arquivo usam `TIMEOUT_COMANDO_REDIS_FILA_MS`.
- `docs/runbook.md` cobre o sintoma em produção e staging; falta a linha de `local`: com o `redis-fila` pausado, a pessoa vê o login **lento** (são ~3–4 idas sequenciais ao Redis em `/v1/sessao/email` — `limitePorIp.rebaixar`, a reserva do contador, o `zerar` — mais duas em `/v1/sessao/escola`, ou seja 6–10 s por tentativa) antes da mesma mensagem de sessão inválida, em vez da recusa quase imediata de antes.

**Respostas diretas**

1. **Produção intacta?** Sim no código auditado: `main.ts:20` monta sem opções → `prazoDoRedisMs` indefinido → `opcoes.login.prazoDoRedisMs` = `prazoDoRedisDoLogin(AMBIENTE)`, que só devolve 2 s em `local`; `esquemaAmbienteIdentidade` exige o enum e derruba o boot antes do `?? 'producao'`; não há variável que afrouxe. Fail-closed, `login.desafio_sem_redis`, `proporcaoDoSeguro` e `limite.seguro_ativo` intactos. O único caminho para produção ler 2 s é alguém subir produção com `AMBIENTE=local` — o que já destravaria `LOGIN_PROTECAO_DESLIGADA` e `ROTAS_SINTETICAS`, então não é regressão nova.
2. **Staging nos 100 ms:** escolha certa — é o único ensaio que resta do corte de produção, e mais ainda depois do bloqueante 1, que tira esse ensaio da carga local. O risco de falso vermelho na demonstração existe e o mitigador certo é o que foi feito (runbook com o sintoma) mais dimensionar o Redis de staging como gerenciado na mesma região (D26); isso deve entrar na lista de criação do staging (`docs/infra.md` 6/9).
3. **`local` com 2 s:** aceitável para máquina de desenvolvimento — o caminho "Redis fora" continua instantâneo (`status !== 'ready'`), só o "conectado e mudo" espera. O custo é o login lento descrito acima; vale a linha no runbook.
4. **Recorte de `limite`/`uso`:** concordo, com o adendo do 429 acima.
5. **`SET NX` (regra 80, item 7):** continua valendo. A unicidade é do Redis, não do prazo; `conferirLivre`/`consumir` seguem recusando em vez de liberar. O único efeito do prazo maior é esperar mais antes de recusar. Permanece verdadeiro (e inalterado pelo diff) que um comando que estourou no cliente pode ter sido executado no servidor: o desafio fica marcado como usado e a pessoa entra de novo — fail-closed, nunca dois consumos válidos.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-22 17:45:11 · `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

Auditei o diff desta rodada e as quatro perguntas, com `docker compose config` nos três projetos.

**Confirmações de fato (não só de leitura):**
- `educa-carga` → `LOGIN_REDIS_PRAZO_MS: "100"`, `LOGIN_ARGON2_ITERACOES: "12"`, `AMBIENTE: local` nas duas APIs (`api-2` herda por `<<: *api`). A calibração do hash da 16.0 está intacta e o cenário "login às 7h30" volta a medir o corte de 100 ms que media antes.
- `educa-teste` → `"2000"`; projeto de desenvolvimento → `"2000"`.
- `prazoDoRedisDoLoginVale` (`apps/api/src/sessao/configuracao-de-login.ts:39`) cobre os três ambientes que existem (`packages/shared/src/sistema/estado.ts:4`: `local`, `staging`, `producao`); não há quarto valor que escape, e `AMBIENTE` ausente ou inválido cai em `producao`.
- Não há default escondido: o esquema zod não tem `.default()`, `infra/docker/api.Dockerfile` só define `NODE_ENV`, e `criarClienteRedisDaApi` mantém 100 ms como padrão para `api-limite` e `api-uso`.
- `apps/api/src/config.test.ts` passa (69 casos). A mutação que importa está fechada: apagar a linha de `infra/carga.env` derruba `lerAmbienteDeCarga()['LOGIN_REDIS_PRAZO_MS']`, que era o bloqueante 1.
- Ordem de `--env-file` e `.env` local não abrem caminho para produção: o `--env-file` posterior vence (medido), e mesmo que vencesse o anterior, o guarda está no código, não no arquivo — com `AMBIENTE=producao` ou `staging` acima de 100 a API não sobe. Nenhum outro script sobe a API sem a variável (`ops:*` e `ensaio:alertas` usam `--env-file=.env.example`, `AMBIENTE=local`).
- `.env.example` com 2000: é a falha alta e cedo, não armadilha. Quem copiar para staging ou produção recebe `ConfiguracaoInvalida: LOGIN_REDIS_PRAZO_MS` no primeiro boot, antes de qualquer escola, e `tools/ci/compose.int.test.ts:29` garante que a variável está no exemplo.

```
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
```

**Recomendações** (não bloqueiam; ficam para o `/validar` e o `/retro`):

1. `tools/ci/compose.ts:94` — `lerAmbienteDeCarga()` repete a lista `['.env.example', 'infra/carga.env']` em vez de usar `ARQUIVOS_AMBIENTE_CARGA` (`infra/scripts/carga.ts:31`), e fica a um caractere de `lerAmbienteDaCarga()` (`infra/scripts/carga.ts:178`), que faz a mesma coisa. Se um terceiro arquivo entrar na carga, o teste segue afirmando a composição antiga e deixa de provar o que prova hoje — a mesma forma de silêncio do bloqueante 1. Exportar a constante de um lugar que os dois importem resolve.
2. Na interpolação do compose, a variável do shell vence o `--env-file`: `LOGIN_REDIS_PRAZO_MS=2000 npm run carga:login` mede o prazo de desenvolvimento sem avisar. É a mesma classe do argon2 e já existia, mas agora há mais um botão. `conferir-carga-login.ts` poderia ler o valor efetivo do contêiner e reprovar o cenário quando diferir de `infra/carga.env`.
3. Nem o item de staging do `TODO.md` nem `docs/infra.md` 9 dizem qual é o valor certo. O boot que falha é bom sinal, mas quem estiver criando o staging às pressas pode "consertar" baixando o `AMBIENTE` para `local` — que hoje é a única saída, e vale também para `LOGIN_PROTECAO_DESLIGADA`. Uma linha na lista de staging evita a tentação.
4. `docs/runbook.md:113` descreve bem o sintoma no staging e no desenvolvimento; falta a mesma linha no caminho do operador que sobe a carga localmente e vê 401 no login (hoje ele só encontraria a explicação no documento da correção).

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/configuracao-de-login.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/config.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/carga.env`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml`.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-22 17:45:48 · `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

Auditei o diff da rodada 3 (variável `LOGIN_REDIS_PRAZO_MS`, `prazoDoRedisDoLoginVale`, `lerAmbienteDeCarga`, os testes e os docblocks), mais o que ele afeta: `infra/test/carga.test.ts`, `infra/test/carga-login.test.ts`, `tools/ci/ambiente.test.ts`, `packages/nucleo/src/config/validar-config.test.ts` e o comportamento real do `commandTimeout` no ioredis.

```
VEREDITO: REPROVADO

Cenários exigidos (para a regra desta correção)
  1. variável → campo → cliente, em toda a extensão
  2. só aperta: no corte, um acima, muito acima, nos três ambientes
  3. ausente / vazia / zero / negativa / fracionária / não numérica
  4. montagem do contêiner (sem MONTAGEM_DE_TESTE) com o Redis lento entra
  5. quem prova o corte de 100 ms pela aplicação montada continua provando
  6. o cenário de carga volta a medir com o corte de produção
  7. .env.example inválido em produção não quebra teste existente

Cobertos
  1. sim, em duas metades que se encontram no campo:
     apps/api/src/config.test.ts:159-183 (variável → campo, com os três ambientes e os dois arquivos
     de compose) e apps/api/test/ataque-de-senha.int.test.ts:584-600 (campo → cliente, com a asserção
     de duração < TIMEOUT_COMANDO_REDIS_FILA_MS/2, que é o que impede afrouxar produção em silêncio)
  2. sim: config.test.ts:167-169 (100 em local, staging e producao), :171 (2000 em local),
     :172-175 (2000 recusado em producao e staging), :177 (101 recusado — prova que o limite é o
     valor, não uma faixa)
  3. só a ausência: config.test.ts:224-230 cobre "não sobe sem LOGIN_REDIS_PRAZO_MS" porque a chave
     entrou em ambienteValido:36. Zero, negativo, fracionário e texto não têm caso — é o bloqueante
  4. sim: apps/api/test/troca-de-escola.int.test.ts:702-749, montando sem MONTAGEM_DE_TESTE, com
     CLIENT PAUSE de 1 s, afirmando cliente 'ready', 200/'pronta' e ausência de
     'login.desafio_sem_redis'. Removida a leitura de opcoes.login.prazoDoRedisMs em
     apps/api/src/sessao/sessao.module.ts:117, este teste fica vermelho (401). É teste de verdade
  5. sim, e a asserção de duração é o que separa esse caso do resto da suíte
  6. em parte: config.test.ts:182 prova que infra/carga.env dá 100 ao projeto de carga; o elo
     "o projeto usa esses dois arquivos, nessa ordem" está preso por infra/test/carga.test.ts:97
     (que roda na esteira, não no portão da tarefa). Basta — com a ressalva da recomendação 2
  7. sim. Nenhum teste sobe .env.example com AMBIENTE=producao: config.test.ts:218-222 e :259-263
     espalham o próprio AMBIENTE=local do arquivo; tools/ci/borda.test.ts, tools/ci/ambiente.test.ts
     e infra/test/alertas.test.ts:118 só leem variáveis soltas. A base com '100' não escondeu
     cobertura: a ausência continua coberta pelo it.each, o 2000 tem caso dedicado (:171), e um
     valor cravado em lerConfiguracaoLogin ficaria vermelho em :171. Concordo com a escolha

Bloqueantes
  - apps/api/src/config.test.ts:159-183 — nenhum caso de valor inválido para LOGIN_REDIS_PRAZO_MS.
    A única defesa contra 0, negativo, fracionário e texto é
    apps/api/src/sessao/configuracao-de-login.ts:111 (`z.coerce.number().int().min(1)`), e trocar
    `.int().min(1)` por `.min(0)` deixa typecheck, lint, test, e2e e infra verdes. O valor 0 não é
    hipótese de laboratório: passa por prazoDoRedisDoLoginVale (0 <= 100, vale em producao), a API
    sobe normalmente, e ioredis aplica `command.setTimeout(0)`
    (node_modules/ioredis/built/Redis.js:368 → Command.js:203-211), o que faz todo comando do cliente
    do login estourar no tick seguinte: em produção, todo desafio recusado com
    'login.desafio_sem_redis' e todo contador no seguro em memória — exatamente o sintoma que esta
    correção existe para eliminar, agora com a escola inteira às 7h30 (regra 80). Negativo tem o
    mesmo efeito.
    Correção exigida: caso de valores inválidos para LOGIN_REDIS_PRAZO_MS, no molde que o próprio
    arquivo já usa em :138-140 para LIMITE_LOGIN_EMAIL_IP_MIN e que
    packages/nucleo/src/config/validar-config.test.ts:110-112 usa para LOGIN_PROTECAO_DESLIGADA —
    para cada valor de ['', '0', '-1', '1.5', 'dois mil'], erroDe(...).variaveis igual a
    ['LOGIN_REDIS_PRAZO_MS']. É a única variável do esquemaAmbienteLogin sem o piso testado.

Recomendações
  1. apps/api/src/sessao/sessao.module.ts:117 — inverter a precedência
     (`opcoes.login.prazoDoRedisMs ?? opcoes.prazoDoRedisMs`) não deixa nenhum teste vermelho, porque
     MONTAGEM_DE_TESTE e o compose de teste valem os mesmos 2000, e o único caso com montagem vazia
     (ataque-de-senha) não passa a opção. Impacto é só de teste; se quiser fechar, basta um caso com
     montagem MONTAGEM_DE_TESTE e configuração { login: { prazoDoRedisMs: 100 } } afirmando que a
     montagem vence.
  2. tools/ci/compose.ts:94 — lerAmbienteDeCarga repete à mão a lista ['.env.example',
     'infra/carga.env'], enquanto lerAmbienteDeTeste:85 usa a constante. Pior: já existe
     lerAmbienteDaCarga em infra/scripts/carga.ts:176, com a constante ARQUIVOS_AMBIENTE_CARGA de
     verdade — duas funções que diferem por uma letra ("Da"/"De"). Importar ARQUIVOS_AMBIENTE_CARGA
     (ou reusar a função existente) tira o risco de o cenário voltar a medir 2 s com o teste verde,
     que foi o bloqueante da rodada 1 do infra-guardian. Note também que lerAmbienteDeCarga não
     enxerga infra/compose.carga.yml: um override de environment por lá passaria despercebido.
  3. apps/api/src/config.test.ts:182 — a asserção é sobre a string do arquivo. Um passo a mais prova
     o que interessa: lerConfiguracao({ ...ambienteValido, ...lerAmbienteDeCarga(), <urls> })
     .login.prazoDoRedisMs === TIMEOUT_COMANDO_REDIS_API_MS, que prova que o valor do cenário
     atravessa o esquema e chega ao campo. Vale o mesmo para lerAmbienteDeTeste em :181.
  4. apps/api/src/sessao/configuracao-de-login.ts:163 — o ramo `?? 'producao'` (AMBIENTE ausente ou
     inválido vale como produção) não tem teste: por lerConfiguracao ele é inalcançável, e ninguém
     chama lerConfiguracaoLogin direto. Um caso curto sobre lerConfiguracaoLogin, com AMBIENTE
     ausente e prazo acima do corte, fecharia a defesa em profundidade que o docblock promete.
  5. apps/api/src/sessao/configuracao-de-login.ts:38 — prazoDoRedisDoLoginVale é exportada e não tem
     consumidor fora do módulo (só MOTIVO_PRAZO_DO_REDIS_DO_LOGIN é importado pelo teste). Ou ganha
[… 6 linhas cortadas]

## test-engineer · 4ª rodada · APROVADO · 2026-09-22 18:25:11 · `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 4, sobre o diff desde a rodada 3): valor inválido de `LOGIN_REDIS_PRAZO_MS` que passe pelo zod e chegue ao ioredis · `AMBIENTE` ausente/inválido lido como produção (defesa em profundidade) · a mudança da constante de carga não quebrar carga, `carga-login` nem a ordem de import · e o que já valia: prazo do compose de teste chegando ao cliente, corte de 100 ms ainda provado pela aplicação montada, teto em `producao`/`staging`, valor efetivo de cada projeto compose.

Cobertos (verifiquei cada um por mutação, com a árvore restaurada ao fim — `git diff --stat` idêntico e carimbo ainda válido):

- **Bloqueante da rodada 3 fechado.** `apps/api/src/config.test.ts:194` — laço `[undefined, '', '0', '-1', '1.5', 'cem']`. Mutação `apps/api/src/sessao/configuracao-de-login.ts:111` `.int().min(1)` → `.min(0)`: vermelho (`Error: a configuração deveria ter sido recusada`, `config.test.ts:195`). Mutação apagando o `if` de `configuracao-de-login.ts:165`: dois casos vermelhos.
- **Pergunta 1 — não sobrou valor perigoso vindo de fora.** Com `z.coerce.number().int().min(1)`: `''` e `'0'` → 0 (recusado), `'-1'`, `'1.5'`, `'cem'` → recusados, `'Infinity'`/`'1e400'` caem no `.int()`, `'1e3'`/`'0x64'` viram inteiros legítimos. O único que ainda passa e machuca é `1`–`99` ms em produção (passa pelo teto, e 1 ms tem o mesmo efeito do 0 no `command.setTimeout`) — fica como recomendação, não bloqueante: é aperto deliberado pelo desenho "só aperta", e não é regressão deste diff.
- **Pergunta 2 — não é fachada.** `config.test.ts:207` tem controle positivo (`local` com 2 s passa) e mutação que mata: trocar `?? 'producao'` por `?? 'local'` em `configuracao-de-login.ts:161` deixa o caso vermelho. `erroDeLogin` (`config.test.ts:51`) afirma variável e `MOTIVO_PRAZO_DO_REDIS_DO_LOGIN`, não só "lançou".
- **Pergunta 3 — a constante mudou de casa sem efeito colateral.** `tools/ci/compose.ts` só define constantes no topo (leitura de arquivo é dentro das funções) e importa `./executar.ts`, que `infra/scripts/carga.ts` já importava: sem ciclo e sem ordem nova. `carga-login.ts:13` continua vindo por `lerAmbienteDaCarga` de `carga.ts`, que usa a constante reexportada. `npm run typecheck` limpo, `test:unidade` 1132/1132 (inclui `infra/test/carga.test.ts`, `infra/test/carga-login.test.ts`, `tools/ci/*`), e `ambiente.test.ts:21` já cobre a variável nova do `infra/compose.yml:160` contra o `.env.example`.
- **Fiação, nos dois sentidos.** `apps/api/test/troca-de-escola.int.test.ts:702` morre com a mutação `opcoes.prazoDoRedisMs ?? opcoes.login.prazoDoRedisMs` → `opcoes.prazoDoRedisMs` (`expected 401 to be 200`), e `apps/api/test/ataque-de-senha.int.test.ts:600` morre com `?? 2_000` (`expected 2002.20 to be less than 1000`). Rodei os dois arquivos inteiros verdes depois (33/33). Nada de `.skip`, `.only` ou mock escondendo a regra nos três arquivos tocados.
- **Recorte da recomendação 1 (precedência do `??`): aceito, não bloqueia.** `main.ts` nunca passa `prazoDoRedisDeLoginMs`, então em produção as duas ordens dão o mesmo valor: o ramo sem teste é código só de teste, e está registrado em "O que fica em aberto" (linhas 146-150 do documento).

Bloqueantes: nenhum.

Recomendações:
1. `apps/api/src/sessao/configuracao-de-login.ts:111` — `min(1)` ainda aceita 1–99 ms em produção, que produz o mesmo sintoma do zero descrito no comentário do teste (todo comando estourando no tick seguinte). Um piso com significado (por exemplo 10 ms, ou fração de `TIMEOUT_COMANDO_REDIS_API_MS`) fecharia a faixa sem ferir o "só aperta".
2. `infra/scripts/carga.ts:178` (`lerAmbienteDaCarga`) e `tools/ci/compose.ts:103` (`lerAmbienteDeCarga`) continuam sendo duas funções idênticas que diferem por uma letra. A constante já é uma só; juntar as funções tira o resto da armadilha da rodada 2 do `infra-guardian`.
3. `apps/api/src/config.test.ts:194` — o `undefined` do laço é redundante com o `it.each(Object.keys(ambienteValido))` de `config.test.ts:257` ("não sobe sem %s"). Inofensivo, só ruído.
4. A remoção de `MONTAGEM_DE_TESTE.prazoDoRedisDeLoginMs` vive hoje só no documento da correção. Uma linha no `TODO.md` a mantém viva se o `/retro` não a pegar — é o que sustenta o recorte aceito acima.
5. O novo item do `TODO.md` ("valores que o staging e a produção não herdam do `.env.example`") é hoje prosa. Um caso em `config.test.ts` no molde do `.env.example sobe com o argon2…` (`config.test.ts:252`), afirmando que `lerConfiguracao({ ...lerAmbienteExemplo(), AMBIENTE: 'producao' })` recusa e listando exatamente quais variáveis, tornaria a lista executável e a manteria correta quando outra variável entrar na mesma classe.

## infra-guardian · 3ª rodada · APROVADO · 2026-09-22 19:02:38 · `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

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
- `apps/api/src/sessao/configuracao-de-login.ts:23` — o piso de 10 ms ainda deixa a API subir em produção com um prazo que cai no seguro em todo login (`login.desafio_sem_redis` + contador em memória, escola inteira às 7h30). É valor posto por operador e documentado, então não bloqueia, mas não há alerta sobre a *taxa* de `login.desafio_sem_redis` que denuncie um valor mal posto — só a linha de log espaçada. Vale uma guarda de taxa ou uma linha no runbook dizendo "se este aviso aparece em todo login, confira `LOGIN_REDIS_PRAZO_MS` antes de procurar o Redis".
- `apps/api/src/sessao/configuracao-de-login.ts:120` — `min(TIMEOUT_COMANDO_REDIS_API_MS / 10)` combinado com `.int()` vira um mínimo fracionário se o corte deixar de ser múltiplo de 10 (ex.: 105 → `min(10.5)`, e o erro do zod passa a falar de um número que não existe como inteiro). `Math.ceil` na constante fecha isso.
- O item em aberto que sobrou (variável de shell vencendo o `--env-file`, e `conferir-carga-login.ts` ler o valor efetivo do contêiner) continua sendo o seguimento de maior valor: `npm run carga:login` é o único lugar onde o corte de 100 ms é medido com a rajada, e hoje um `LOGIN_REDIS_PRAZO_MS=2000` no shell o desliga em silêncio. Está registrado no documento; fica para o `/retro`.

O que foi conferido, e como:
- **`docker compose config` do projeto `educa-carga`** (`--project-name educa-carga --env-file .env.example --env-file infra/carga.env -f infra/compose.yml -f infra/compose.carga.yml`), renderizado de verdade: `api-1` e `api-2` saem com `LOGIN_REDIS_PRAZO_MS: 100`, `LOGIN_ARGON2_MEMORIA_KIB: 19456`, `LOGIN_ARGON2_ITERACOES: 12`, `LOGIN_HASH_CONCORRENCIA: 2`, `UV_THREADPOOL_SIZE: 16`, `AMBIENTE: local`. Nenhum `environment:` de `infra/compose.carga.yml` sobrepõe o prazo. A ordem dos `--env-file` é a mesma de antes: `ARQUIVOS_AMBIENTE_CARGA` mudou de arquivo, não de conteúdo, e `argumentosDoCompose()` (`/home/joaquimdp/Documentos/git/Educa.ia/infra/scripts/carga.ts:141`) continua consumindo a mesma constante. O projeto `educa-teste` — o que o e2e sobe — rende `2000`, que é o ponto da correção.
- **`carga-login.ts` lê o ambiente certo.** `lerAmbienteDeCarga` de `tools/ci/compose.ts:103` é semanticamente idêntica à `lerAmbienteDaCarga` removida (mesmo `parseEnv`, mesmo descarte de `undefined`, mesma precedência do último arquivo), e o `doArquivo` continua alimentando os três consumidores que importam: o filtro de `process.env` que impede o shell de vencer o `--env-file`, o argon2 de `semearContas` (`carga-login.ts:330`) e a porta do Prometheus da conferência (`carga-login.ts:435`). Sem ciclo de import: `tools/ci/compose.ts` só importa `./executar.ts`, que `carga.ts` já importava.
- **O piso novo não mexe em nenhum valor em uso.** Os únicos arquivos com a variável são `.env.example` (2000) e `infra/carga.env` (100); não há arquivo de staging/produção no repositório. `worker`, `despachante` e `realtime` têm `lerConfiguracao` próprio e não leem configuração de login, então a variável ausente neles não derruba boot. Os testes que fixam o prazo usam 100 ou 2000.
- `apps/api/src/config.test.ts` verde (71 casos) e `node tools/processo/portao-local.ts conferir` devolve carimbo válido para typecheck, lint, test, e2e e infra sobre esta árvore.

## test-engineer · 5ª rodada · APROVADO · 2026-09-22 19:03:20 · `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

Auditei só o diff desde a rodada 4 (a árvore inteira está em `git diff`, nada em stage — `git diff --cached` está vazio). Verifiquei por mutação, com a árvore restaurada ao fim (`20 files changed, 311 insertions(+), 52 deletions(-)`, idêntico ao início; `git status --porcelain` com as mesmas 22 entradas).

```
VEREDITO: APROVADO

Cenários exigidos (rodada 5, só o diff desde a rodada 4)
1. O piso novo recusa o valor logo abaixo dele e aceita o piso exato, e mata a reversão para `min(1)`.
2. O teto de produção/staging continua provado depois da mudança do zod.
3. O caso novo do `.env.example` falha quando a regra que ele documenta some, e falha quando outra variável entra na mesma classe.
4. A lista por ambiente (staging × produção) está completa e na ordem que `lerConfiguracao` produz.
5. A fusão das duas funções de ambiente de carga não deixou cobertura para trás, nem mudou o valor que o cenário passa às APIs.
6. Permissão/isolamento: não se aplica — o diico não toca autorização, escopo de tenant nem campo de pessoa.

Cobertos
- (1) `apps/api/src/config.test.ts:194,197`. Mutação `configuracao-de-login.ts:120` `min(PRAZO_MINIMO_DO_REDIS_DO_LOGIN_MS)` → `min(1)`: vermelho em `config.test.ts:195` ("a configuração deveria ter sido recusada"), pelo `'9'`. O controle positivo do piso exato (`:197`) impede fechar o furo apertando até sumir.
- (2)+(3) Mutação apagando o `if (!prazoDoRedisDoLoginVale(...))` de `configuracao-de-login.ts:171`: três casos vermelhos, incluindo o novo do `.env.example` (`config.test.ts:210`). O caso novo prova a regra, não a execução.
- (3, extensão) Simulei "outra variável entra na mesma classe" com uma regra dependente de `AMBIENTE` em outro leitor (`config.ts`, `superRefine` recusando `VERSAO=local` fora de `local`): o caso do `.env.example` foi a vermelho, como o comentário promete.
- (4) `lerConfiguracao` (`apps/api/src/config.ts:107-118`) soma os erros dos oito leitores e ordena os nomes, então o `toEqual` exato é lista completa e não prefixo. A ordem afirmada confere: `LOGIN_EXTERNO_GOOGLE_EMISSOR` < `LOGIN_EXTERNO_MICROSOFT_EMISSOR` < `LOGIN_REDIS_PRAZO_MS` < `ROTAS_SINTETICAS`.
- (5) `lerAmbienteDaCarga` nunca teve chamador de teste: `git grep lerAmbienteDaCarga HEAD` dá só `carga.ts:177` e `carga-login.ts:13,376`. Nenhum caso de `infra/test/carga.test.ts` nem de `infra/test/carga-login.test.ts` a citava, e o único que depende dos arquivos (`carga.test.ts:94`, os `--env-file`) usa `ARQUIVOS_AMBIENTE_CARGA`, que continua exportada. A semântica é a mesma (`lerArquivoAmbiente` de `tools/ci/compose.ts:81` descarta `undefined` e o `Object.assign` mantém "o último arquivo sobrepõe"). Cobertura subiu: `config.test.ts:206` passou a afirmar que o projeto de carga entrega 100 ms.
- Suíte: `npm run test:unidade` 1133/1133 verde; `config.test.ts` + os dois `carga*.test.ts` 124/124. Sem `.skip`, `.only` ou mock escondendo regra nos arquivos tocados.
- **Pergunta 1 — o piso é defensável, mas fecha 1–9, não 1–99.** `TIMEOUT_COMANDO_REDIS_API_MS / 10` é exatamente uma das duas formas que eu sugeri, e tem significado: abaixo dele o prazo deixa de ser espera e vira o zero (estouro no tick seguinte). A faixa 10–99 em produção continua aceita, e está certo que continue: 10 ms ainda é espera real contra um `EXISTS` de poucos ms, e recusá-la feriria o "só aperta". Não é número solto.
- **Pergunta 3 — nada ficou para trás.** Ver (5).

Bloqueantes: nenhum.

Recomendações (nenhuma bloqueia; ficam para o `/validar` e o `/retro`)
1. `apps/api/src/config.test.ts:212` — o comentário "Se outra variável entrar na mesma classe, este caso falha" é verdade em outro leitor, e falso dentro de `lerConfiguracaoLogin`: ela lança no primeiro `if` (`configuracao-de-login.ts:171`) em vez de somar como `lerConfiguracao` faz. Mutação que confirma: acrescentei uma segunda recusa dependente de `AMBIENTE` logo depois do `if` do prazo — o caso do `.env.example` **continuou verde**, com a lista silenciosamente incompleta (outros três casos caíram, então a mutação não passa despercebida no repositório, mas a lista não é quem a pega). Ou estreite o comentário para "em outro leitor", ou faça `lerConfiguracaoLogin` somar os problemas.
2. `apps/api/src/sessao/configuracao-de-login.ts:24` — `TIMEOUT_COMANDO_REDIS_API_MS / 10` só é inteiro por sorte do 100. Se o corte virar 105, o piso vira 10,5 e o `String(PRAZO_MINIMO - 1)` do laço (`config.test.ts:194`) passaria a morrer pelo `.int()`, não pelo `min` — o caso segue verde pelo motivo errado. `Math.round` na constante, ou uma asserção de que o piso é inteiro, tira a armadilha.
3. O piso não aparece onde o operador lê: o comentário de `.env.example:90-96` e `docs/infra.md` 5.2 dizem só o teto de 100. E um valor abaixo do piso sai sem motivo — `validarAmbiente` (`packages/nucleo/src/config/validar-config.ts:31`) só transforma issue `custom` em motivo, então o boot aponta o nome da variável e mais nada. É o idioma de todas as numéricas do arquivo, mas uma frase no `.env.example` ("nunca abaixo de 10") custa uma linha.
4. `TODO.md` (item "Valores que o staging e a produção não herdam do `.env.example`") e `config.test.ts:210` provam o que o exemplo **derruba**, e podem ser lidos como "o resto pode ser copiado". Não pode: `IDENTIDADE_CHAVE_ASSINATURA=educa_local_sintetica_assinatura_f0`, `LOGIN_CHAVE_CONTADOR`, `IDENTIDADE_CHAVE_CIFRA_V1` e os segredos do login externo têm 32+ caracteres e **sobem em produção**. Uma linha no item do TODO separando "o que o boot recusa" de "o que o boot aceita e nunca deve ser herdado" evita a leitura errada. É anterior a esta correção.
5. Recomendação 3 da rodada 4 (o `undefined` no laço): **concordo com a recusa**, e ela cai. `config.test.ts:149` usa o mesmo laço com `undefined` para `LIMITE_LOGIN_EMAIL_IP_MIN`; consistência vale mais que a duplicação.
6. `infra/scripts/carga.ts:31` reexporta `ARQUIVOS_AMBIENTE_CARGA` e `lerAmbienteDeCarga` só para `carga-login.ts` não mudar de caminho de import. Agora que o nome é um só, `carga-login.ts` importar direto de `tools/ci/compose.ts` apagaria a última indireção. Cosmético.
```

## infra-guardian · 4ª rodada · APROVADO · 2026-09-22 19:45:57 · `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

Auditei só o diff desde a rodada 3 (o piso com `Math.round` e o docblock, a linha do runbook, a linha do `.env.example` e o item do `TODO.md`), mais o que eles afetam. O restante já estava aprovado e não mudou.

**Observação de método:** às 19:45:01 `apps/api/src/sessao/configuracao-de-login.ts:28` esteve por um instante sem o `Math.round` (mutação em curso, pelo jeito do `test-engineer`) e voltou em seguida. Auditei o estado restaurado, que é o que `node tools/processo/portao-local.ts conferir` dá como coberto pelo carimbo (typecheck, lint, test, e2e, infra) — confirmado agora.

```
VEREDITO: APROVADO
Caminho quente tocado: login
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
```

**As duas perguntas diretas**

1. **O `Math.round` não mexe em valor que ambiente nenhum usa hoje.** `TIMEOUT_COMANDO_REDIS_API_MS = 100` (`packages/nucleo/src/redis/clientes.ts:8`), então o piso é 10, idêntico ao da divisão crua. Os únicos arquivos que põem `LOGIN_REDIS_PRAZO_MS` são `.env.example` (2000) e `infra/carga.env` (100); não há arquivo de staging ou produção no repositório, e `worker`, `despachante` e `realtime` não leem configuração de login. Nenhum valor em uso chega perto do piso, e a recusa do teto (`prazoDoRedisDoLoginVale`) não foi tocada.

2. **O recorte do alerta é aceitável — e é mais do que o mínimo.** A taxa já é medida e já tem alerta: `ConsumoDeDesafio.proporcaoDoSeguro` entra no `SeguroDoLogin` (`apps/api/src/sessao/seguro-do-login.ts:19`, máximo entre as fontes) → `limite.seguro_ativo` → `infra/grafana/alertas/seguro-limite-ativo.yaml:45`, que dispara em ≥ 0,5. Um prazo mal posto recusa o desafio em todo login, joga a proporção para 1 e acende o alerta que já existe; o que faltava era o operador saber olhar a variável, e é exatamente o que `docs/runbook.md:119` passou a dizer, no parágrafo do alerta que dispara. A regra 80, item 10, cobra parágrafo de runbook para **alerta novo** — aqui não há alerta novo, então nada fica devendo. Uma guarda de taxa seria alerta novo, com limiar e runbook próprios: é tarefa, não correção. Concordo com o recorte.

**Recomendações** (não bloqueiam; ficam para o `/validar` e o `/retro`)

- `apps/api/src/sessao/configuracao-de-login.ts:28` — `Math.ceil` continua servindo melhor que `Math.round`, pelos dois casos que o `round` deixa abertos: um corte que não seja múltiplo de 10 pode dar piso **abaixo** do décimo (104 → 10, não 11), e um corte abaixo de 5 ms daria piso 0 — justamente o valor que o piso existe para barrar, porque `.int().min(0)` aceita zero. Custa o mesmo e nunca arredonda para baixo. Não bloqueia: o corte é 100 e está fixado por `apps/api/src/sessao/contador-de-tentativas.int.test.ts:112`.
- `apps/api/src/config.test.ts:194-200` — as bordas do piso usam a própria constante, e a asserção nova só afirma que ela é inteira: `Math.floor`, `Math.trunc` ou um literal `10` mantêm tudo verde. Se a intenção é fixar "um décimo do corte", a relação é que precisa ser afirmada (`>= 1` e `<= TIMEOUT_COMANDO_REDIS_API_MS / 10`, ou `toBe(10)` direto).
- `.env.example:96` repete o 10 em prosa ("Nunca abaixo de 10"), como `docs/infra.md` 5.2 e `docs/runbook.md` repetem o 100 e os 2 s. Se o corte mudar, os três envelhecem sem nada ficar vermelho — a lista dos lugares já está no documento da correção, vale só manter os quatro juntos.
- `TODO.md` — no item dos valores que o staging não herda, a segunda metade (chaves sintéticas que sobem caladas) ficou colada à frase do `infra-guardian` sobre baixar o `AMBIENTE`, sem separação. É só leitura, mas é a lista que alguém vai ler às pressas na criação do staging.

## test-engineer · 6ª rodada · APROVADO · 2026-09-22 19:46:27 · `tasks/correcoes/2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e.md`

VEREDITO: APROVADO

Auditei só o diff desde a rodada 5 (os quatro itens aplicados), por mutação, com a árvore restaurada byte a byte ao fim (`git diff --stat` e `git status --porcelain` idênticos ao início; carimbo do portão local continua válido — `node tools/processo/portao-local.ts conferir` responde "válido para o código atual (typecheck, lint, test, e2e, infra)").

Cenários exigidos (rodada 6, só o diff)
1. O `Math.round` não muda o valor efetivo em nenhum ambiente.
2. A armadilha do piso fracionário fica vermelha, e fica vermelha **naquela asserção**, não por acidente de outra.
3. O comentário estreitado descreve o que o caso do `.env.example` realmente prova.
4. As linhas novas de `.env.example`, `TODO.md` e `docs/runbook.md` são verdadeiras sobre o código.
5. Nada regrediu no que a rodada 5 já tinha aprovado.
6. Permissão/isolamento: não se aplica — o diff não toca autorização, escopo de tenant nem campo de pessoa.

Cobertos
- (1) `apps/api/src/sessao/configuracao-de-login.ts:28` — `TIMEOUT_COMANDO_REDIS_API_MS` é 100 (`packages/nucleo/src/redis/clientes.ts:8`), então `Math.round(100/10) = 10`, o mesmo valor de antes. A constante só é consumida pelo `min()` do zod (`configuracao-de-login.ts:125`) e pelo teste (`git grep PRAZO_MINIMO_DO_REDIS_DO_LOGIN_MS` dá quatro linhas, todas em `config.test.ts` e nessas duas). `.env.example=2000`, `infra/carga.env=100` e o `${LOGIN_REDIS_PRAZO_MS:?}` do `infra/compose.yml:160` não mudaram. `npm run test:unidade` 1133/1133 verde, o mesmo número da rodada 5. **Nenhum ambiente mudou de valor.**
- (2) Mutação realista do futuro (corte para 105 **e** `ambienteValido.LOGIN_REDIS_PRAZO_MS: '105'`, com a divisão crua): a suíte dá exatamente **um** vermelho, e é `apps/api/src/config.test.ts:198` (`expected false to be true`). Os 70 restantes passam — inclusive o laço de `config.test.ts:194`, que com piso 10,5 testa `'9.5'` e é recusado pelo `.int()`, ou seja, verde pelo motivo errado, que era o buraco. A asserção nova é a única rede, e ela pega. Com o `Math.round` de volta e o corte em 105, o `:198` fica verde e o vermelho restante passa a ser `:208` (`expected 100 to be 105`, o `infra/carga.env` pedindo atualização) — que é o comportamento certo.
- (2, detalhe) A asserção ficou **depois** do laço (`:198`, laço em `:194-196`), não "logo antes" como você descreveu. Não muda nada: as duas rodam no mesmo `it` e a mutação foi vermelha ali mesmo.
- (3) `config.test.ts:212` — conferi as duas metades da afirmação contra o código. `lerConfiguracao` (`apps/api/src/config.ts:104-119`) realmente chama oito leitores, junta com `flatMap` e `.sort()`; e `lerConfiguracaoLogin` (`configuracao-de-login.ts:171-181`) realmente lança no primeiro `if` — o do prazo agora é o primeiro, antes do de `LOGIN_HASH_CONCORRENCIA`. O comentário agora é verdadeiro. **Sobre a sua pergunta:** o comentário honesto basta, e eu não faria a soma nesta correção — fazer `lerConfiguracaoLogin` somar muda a saída de erro de boot de um leitor de configuração de produção inteiro (todas as variáveis de login), por um ganho que é de canário de lista. Fica para o `/retro`, junto com o `MONTAGEM_DE_TESTE` que já está no `TODO.md`.
- (4) `.env.example:96` ("não sobe com mais que 100 em produção e staging"), `docs/runbook.md:112-120` e `docs/infra.md` 5.2 batem com `prazoDoRedisDoLoginVale` e com o `min()`. A frase do runbook sobre "aviso em todo login, confira `LOGIN_REDIS_PRAZO_MS`" descreve o sintoma real de um prazo perto do piso.
- (5) Sem `.skip`, `.only` nem mock novo nos arquivos tocados. O item 4 do `TODO.md` e o parágrafo correspondente do documento da correção ("A lista executável é do que o boot **recusa**…") dizem a mesma coisa, e a lista de chaves aceitas confere com o `.env.example` (as quatro têm 32+ caracteres e passam o `TAMANHO_MINIMO_CHAVE_DE_LOGIN`).

Bloqueantes: nenhum.

Recomendações (nenhuma bloqueia; ficam para o `/validar` e o `/retro`)
1. `.env.example:96` — "Nunca abaixo de 10" é o piso derivado escrito à mão, e nada amarra o texto à constante: se o corte mudar, o comentário envelhece calado, do mesmo jeito que os três "100 ms" das linhas acima. É o idioma do arquivo; só registro que o `Math.round` agora deixa o piso variar sem o comentário variar junto.
2. `.env.example:96` — a frase é conselho ("nunca abaixo de 10") para uma coisa que o boot **recusa**. Uma palavra ("a API não sobe abaixo de 10") deixa o operador saber que é regra, não etiqueta.
3. `apps/api/src/config.test.ts:212` — o comentário ficou levemente pessimista: variável nova **no próprio leitor do login** também entra na lista quando a recusa é de esquema (o `validarAmbiente` soma os issues do zod antes de qualquer `if`); o que não entra é uma segunda recusa dependente de `AMBIENTE`, que só cabe em `if`. Prometer menos do que se entrega não é perigoso, então não mexeria agora.
4. `TODO.md:121` — falta o ponto final (ou a quebra de item) entre "…precisa das duas metades (`test-engineer`)" e "Sob pressão, a saída errada é…". As duas frases são de revisores diferentes e hoje se leem como uma só.
5. Suas recomendações 3 (motivo do erro do zod) e 6 (reexportação em `infra/scripts/carga.ts:31`) continuam abertas e continuam fora do escopo desta correção — concordo com as duas recusas. Elas já estão neste registro e no da rodada 5, então o `/retro` as alcança.

Arquivos auditados nesta rodada: `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/sessao/configuracao-de-login.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/apps/api/src/config.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/.env.example`, `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md`, `/home/joaquimdp/Documentos/git/Educa.ia/docs/infra.md`.
