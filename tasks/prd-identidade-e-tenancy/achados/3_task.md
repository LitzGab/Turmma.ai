# Achados das revisões — `tasks/prd-identidade-e-tenancy/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-16 05:17:26 · `tasks/prd-identidade-e-tenancy/3_task.md`

Auditei o diff inteiro da tarefa 3.0 (código, testes, migration, compose e scripts), conferi cada linha da tabela "Testes que provam a regra" e procurei `.skip`, mock que esconde regra e asserção vazia.

## O que verifiquei, linha a linha

**Permissão (emissor sintético recusado).** `packages/nucleo/src/identidade/verificar-token.test.ts:57-73` assina com a mesma chave e `iss: 'sintetico'` e exige 401, e ainda fecha a forma da `ConfiguracaoIdentidade`; `validar-config.test.ts:33-36` prova que mandar `ACEITAR_TOKEN_SINTETICO=true` não muda nada; `apps/api/test/contexto.int.test.ts:205-229` sobe a API nos dois ambientes e recusa o token sintético **com a sessão real gravada**, provando que o que recusou foi o emissor (a mesma sessão com `educa` dá 200). Todos falhariam se `issuer: EMISSOR_TOKEN` saísse de `verificar-token.ts:67`.

**FK nova.** `packages/nucleo/src/db/migrar.int.test.ts:163-190` prova as três tabelas recusando `escola_id` inexistente com `23503` **e** aceitando com a escola criada — o segundo trecho é o que impede o teste de passar por engano. `migrar.int.test.ts:192-238` monta as tabelas como eram antes do F1, insere órfã nas três, aplica a 0006 real (lida do disco), confere `convalidated = false`, que a linha antiga ficou, que a escrita nova já é barrada e que o `VALIDATE` ainda reprova. É o melhor teste do diff.

**Realtime.** `apps/realtime/test/sistema.int.test.ts` cobre isolamento nas duas direções (emissão de A não chega a B e vice-versa), intruso pedindo a sala de A no `auth`, na `query` e por quatro eventos, token com `sid` que nunca existiu, sessão encerrada no banco recusando o handshake seguinte com a sessão viva da mesma escola ainda entrando, e Postgres pausado devolvendo `INDISPONIVEL_TENTE_DE_NOVO` em três tentativas com **uma** linha de aviso, sem token, sem `select` e sem URL de conexão, voltando a conectar com o mesmo token depois do `unpause`. Nada disso é mockado: `app.module.ts:26` injeta `new SessaoRepository(criarBanco(pool))` de verdade.

**Sem perda de cobertura.** Os `it` removidos são exatamente os da flag e do emissor que deixaram de existir; `definirIdentidadeNoContexto` saiu do código e as invariantes dele ("só grava uma vez", "falha fora de requisição") continuam provadas em `definirSessaoNoContexto`. Nenhum `.skip`, `.only` ou teste comentado novo. Carimbo do portão (`.processo/portao.json`, início 07:49Z) é posterior ao último arquivo de código alterado (04:39 local).

## O furo

```
VEREDITO: REPROVADO

Cenários exigidos: caminho feliz (F0 verde com escola e sessão reais, sem .skip novo) ·
permissão (emissor sintético recusado, API sobe sem a variável) · borda (job de escola
inexistente recusado pelo banco) · migration NOT VALID sobre linha órfã · isolamento
(handshake de A não entra na sala de B) · borda (sessão encerrada recusa o handshake
seguinte) · falha (Postgres fora vira indisponível, não não-autenticado) · carga
(npm run carga e carga:controle-negativo com as escolas criadas pelo script)

Cobertos: os sete primeiros, com asserção sobre resultado e todos falhando se a regra sair.

Bloqueantes:
- infra/test/carga.test.ts:139-148 — o único teste do caminho reescrito do cenário de carga
  assere sobre o **texto** de infra/scripts/carga.ts (`toContain('ops:sessao-sintetica')`,
  `indexOf(...) < indexOf(...)`, `toContain('await escreverTokens(fase)')`). Isso prova a
  forma do código, não o resultado: passaria igual se `idDoOps` lesse o campo errado do JSON
  do `ops:escola`, se o ambiente dos `ops:*` não alcançasse o Postgres do projeto `educa-carga`,
  se as 1.000 sessões do grupo `c` estourassem o tempo entre as fases, ou se o k6 recebesse 401
  e o cenário medisse fila vazia. A linha 8 da tabela da própria tarefa exige o cenário rodado
  ("carga: `npm run carga` verde e `npm run carga:controle-negativo` reprovando pela justiça,
  com as escolas criadas pelo script"), e infra/scripts/carga.ts:187-300 foi reescrito nesta
  tarefa justamente nesse trecho.
  Correção exigida: rodar `npm run carga` e `npm run carga:controle-negativo` com este código e
  registrar no 3_task.md o veredito de cada um (critérios `espera_b` e `interativo_acima_de_30s`,
  e o código de saída do controle negativo). Se a execução for adiada, ela precisa sair da tabela
  "Testes que provam a regra" por mudança registrada na tarefa — não ficar listada como coberta
  por um teste de texto.

Recomendações:
- apps/realtime/src/autenticacao-do-handshake.ts:71-73 — a subtarefa 3.3 exige que o handshake
  não mova `ultimo_uso_em`, e hoje isso é verdade só porque `lerParaGuarda` é um SELECT puro e
  ninguém ainda escreve nessa coluna. Não há teste. Quando a tarefa da "atividade" implementar o
  toque, o teste (handshake não altera `ultimo_uso_em`; requisição da API altera) passa a ser
  obrigatório, senão a reconexão automática da web renova sessão ociosa para sempre.
- apps/realtime/src/configurar-app.ts:44 — `observarPoolDoBanco` no realtime não tem asserção em
  apps/realtime/test/metricas.int.test.ts, que já lê `conexoesRealtime` e `redisDisponivel` do
  medidor da instância. Uma linha a mais fecha a regra 80, item 10, para o pool novo do caminho
  quente; hoje remover a chamada não quebra teste nenhum.
- infra/test/carga.test.ts:139-148 — mesmo depois do cenário rodado, o teste por `indexOf` de
  nome de função quebra em renomeação e não quebra em falha real. Vale reduzi-lo ao que é
  contrato (`TOKENS_POR_GRUPO` e papéis, que o teste da linha 129 já faz bem) e deixar a ordem
  para o cenário provar.
- infra/scripts/carga.ts:187-210 — `idDoOps` roda sempre `ops:escola` (o nome sugere genérico;
  `idDoOpsEscola` diz o que é) e cada chamada refaz o build de shared/nucleo/api: são 4 builds
  para as escolas e 5 por fase para as sessões, 14 no total, somados ao tempo do cenário manual.
```

## test-engineer · 2ª rodada · APROVADO · 2026-09-16 06:04:58 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos** (os da rodada 1, mais a correção exigida): caminho feliz do F0 com escola e sessão reais · permissão (emissor `sintetico` recusado, em todo caminho) · borda de FK (`escola_id` inexistente recusado; migration `NOT VALID` com órfã) · isolamento entre escolas (realtime e uso) · sessão encerrada · Postgres fora → indisponível, não "não autenticado" · handshake não move `ultimo_uso_em` · execução registrada do cenário de carga (a correção exigida).

**Cobertos:**
- **Correção exigida — cumprida.** `npm run carga` e `npm run carga:controle-negativo` foram rodados e os dois vereditos estão registrados em `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/3_task.md:89-105`, com os números dos critérios `espera_b` e `interativo_acima_de_30s` e o código de saída do controle negativo. A não reprovação do controle negativo está explicada, reproduzida duas vezes, e virou pendência com dono em `TODO.md:92-96`. Não é regressão desta tarefa: a vaga por escola continua provada por teste direto em `apps/despachante/test/vagas.int.test.ts` (controle negativo na linha 210, concorrência de dois despachantes na 223, A não atrasa B na 436), então a regra 80, item 3, não fica sem prova.
- O teste que restou em `infra/test/carga.test.ts:139-144` agora só afirma o que ele de fato prova (o `ops:token-sintetico` sumiu do cenário) e declara no comentário que o resto é a execução. Aceito.
- Recomendações da rodada 1 aplicadas e com asserção que falha se a regra sair: `apps/realtime/test/sistema.int.test.ts:259-275` (o `ultimo_uso_em` quebraria se o handshake o tocasse), `apps/realtime/test/metricas.int.test.ts:50`, `infra/test/carga.test.ts:129-137` (papel pela `MATRIZ`, em vez de `indexOf` de nome de função), `idDoOpsEscola`.
- Diff auditado sem perda de cobertura: os testes do worker e da conferência passaram a criar escola real (`apps/worker/test/fila-de-teste.ts:168-171`, `infra/test/conferir-carga.int.test.ts:13-27`) mantendo os mesmos casos, inclusive os de isolamento e concorrência (`apps/worker/test/uso.int.test.ts:138,151`). `verificar-token.test.ts:57-61` continua provando a recusa do emissor do F0 e ainda fecha a forma da `ConfiguracaoIdentidade`. Nenhum `.skip`, `.only`, teste comentado ou mock novo escondendo regra. Grep no repositório: só sobram citações em docs de tarefa e nos testes negativos.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `tasks/prd-identidade-e-tenancy/3_task.md:87` — a linha da tabela ainda diz "`npm run carga:controle-negativo` **reprovando pela justiça**", que as linhas 98-105 do mesmo arquivo desmentem. Reescrever a linha para o que de fato valeu (carga verde; controle negativo não reprovou nesta máquina, com a pendência apontada), para o `/validar` não ler uma prova que não aconteceu.
2. `infra/test/carga.test.ts:139` — o nome diz "em lugar nenhum do cenário", mas a asserção olha dois arquivos. Um grep sobre `infra/` e `package.json` cumpriria o nome e pegaria a volta do comando por outro caminho.
3. `apps/realtime/test/metricas.int.test.ts:50` — `length > 0` passa com qualquer série de pool. Asseverar os atributos esperados faria o teste distinguir o pool do handshake de outro qualquer.
4. `apps/realtime/test/sistema.int.test.ts:259` — hoje nada no código escreve `ultimo_uso_em` depois da criação, então o teste só guarda a direção negativa. Quando a renovação de sessão entrar, acrescentar o contraste (requisição da API move, handshake não) na mesma bancada.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-09-16 06:09:07 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: APROVADO

Tabelas verificadas: `job_registro`, `configuracao_operacional_escola`, `uso_infra_diario` (FK `escola_id → escola` `NOT VALID`, migration `/Users/joaquim/Git/Educa.ia/packages/nucleo/drizzle/0006_fk_escola_nas_tabelas_do_f0.sql`, snapshot e `_journal` coerentes); `escola` e `sessao` como referência. Nenhuma tabela nova. `job_registro.escola_id` segue anulável só para `tipo` `sistema.*`, com check no banco, e a consulta de órfãos do `TODO.md` respeita isso. Id é UUIDv7 em `escola` e `job_registro`. Nenhuma tabela desta tarefa varia por período, então `ano_letivo_id` não se aplica.

Queries verificadas: `SessaoRepository.lerParaGuarda` (`packages/nucleo/src/identidade/sessao.repository.ts:54`) — escopo `(sessao.escola_id, sessao.id)` vindo do `TokenVerificado`, com `usuario`, `escola` e `ano_letivo` juntados pela mesma escola; é a única query que o realtime passou a fazer (`apps/realtime/src/app.module.ts:24`). Handshake (`apps/realtime/src/autenticacao-do-handshake.ts:104-112`): identidade só de `avaliarSessao`, `handshake.auth` e `handshake.query` zerados depois de verificar, sala montada só em `salaDaEscola(identidade.escolaId)` (`apps/realtime/src/sistema.gateway.ts:41`). Nenhum endpoint passou a aceitar `escolaId` de corpo, query ou cabeçalho; `jobs-sinteticos` continua recusando o campo e respondendo 404 idêntico para job de outra escola. `@SemEscopo()` não ganhou ocorrência nova; as existentes seguem com justificativa e teste de forma. `verificarToken` deixou de ter emissor configurável (`packages/nucleo/src/identidade/verificar-token.ts:67`), e `ACEITAR_TOKEN_SINTETICO` não existe mais em código, compose, `.env.example` nem `package.json`.

Teste de isolamento: presente e efetivo. `apps/realtime/test/sistema.int.test.ts` — emissão de A não chega a cliente de B e vice-versa nas duas instâncias; cliente de B não entra na sala de A pedindo por `auth`, query ou evento; token de emissor `sintetico` com sessão real recusado e a mesma sessão com emissor `educa` aceita; sessão encerrada recusa o handshake seguinte enquanto a sessão viva da mesma escola entra. Removendo o escopo da sala (usar algo que o cliente manda) o segundo e o terceiro caso quebram; removendo o `eq(sessao.escolaId, token.escolaId)` do repository quebra `apps/api/test/sessao-guarda.int.test.ts:155`. `packages/nucleo/src/db/migrar.int.test.ts` prova que escrita com `escola_id` inexistente é recusada (23503) nas três tabelas e que a `0006` aplica sobre linha órfã. `apps/worker/test/uso.int.test.ts:137` mantém o isolamento de uso por escola com escolas reais. Nenhum `.skip` e nenhum teste apagado: os que perderam as constantes `ESCOLA_A`/`ESCOLA_B` passaram a criar escolas reais por caso.

Bloqueantes: nenhum.

Recomendações:
- `/Users/joaquim/Git/Educa.ia/apps/api/test/sessao-de-teste.ts:103` — `encerrar()` faz `update sessao ... where id = $1` sem `escola_id`. É helper de teste e o id é UUID, então não vaza nada, mas o resto da bancada escreve `where escola_id = $1 and id = $2` (ver `apps/api/test/sessao-guarda.int.test.ts:112`); manter o mesmo formato evita que o padrão solto seja copiado para um repository.
- Não há caso no handshake que prove diretamente o escopo `(esc, sid)` entre escolas (token de B com `sid` de A). Hoje isso só é impossível porque o token é assinado pelo servidor, e o repository já tem o caso na API. Uma linha no `sistema.int.test.ts` usando o `EmissorDeToken` para cruzar `esc` e `sid` amarraria a sala ao escopo sem depender do teste da API.
- O pool do realtime (`REALTIME_BANCO_POOL_MAXIMO=5` por instância) passa a ser consultado a cada handshake. A métrica `poolEmUso` já é exportada e testada, mas não há limiar nem caso de carga para a onda de reconexão das 7h30; vale entrar no cenário `login-7h30` da 16.0.

## revisor-geral · 1ª rodada · REPROVADO · 2026-09-16 06:11:23 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: REPROVADO
Escopo: incompleto — o critério de carga declarado na tarefa foi reescrito em vez de cumprido
Aderência à Tech Spec: ok (seções 2, 3, 5 "Requisição", 6 e 10 conferidas; a remoção de `emissoresAceitos` e de `definirIdentidadeNoContexto` é consequência direta de "saem o emissor sintético e `ACEITAR_TOKEN_SINTETICO`", e o pool de banco no realtime é o que a seção 5 pede)
Portão local: carimbo válido para o código atual (typecheck, lint, test, infra)

Bloqueantes:

1. `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/3_task.md:87` — a linha da tabela "Testes que provam a regra" foi **reescrita pelo implementador** depois do resultado. O texto original era `carga: npm run carga verde e npm run carga:controle-negativo reprovando pela justiça, com as escolas criadas pelo script`; virou `... o controle negativo rodado e o resultado registrado abaixo`. O controle negativo não reprovou, e a resposta foi baixar a régua da própria tarefa. Baixar critério de aceite é decisão do dono da tarefa, não de quem implementa. **Correção exigida:** restaurar a linha original do `3_task.md` e subir a decisão (manter o critério e consertar, ou aceitar a dívida) para o Joaquim, registrada como decisão dele — não como edição do documento da tarefa. Não estou exigindo recalibrar o cenário nesta tarefa: isso seria escopo de outra.

2. `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/3_task.md:98-105` e `/Users/joaquim/Git/Educa.ia/TODO.md:92-100` — o diagnóstico registrado está errado, e o errado é o que vai guiar quem pegar a pendência. Os dois textos dizem que é "calibração do cenário do F0 para este hardware" / "Recalibrar ... por máquina", e o `TODO.md` já aponta caminhos derivados disso ("apertar a CPU de `infra/compose.carga.yml`, subir a taxa da B"). O registro do próprio projeto contradiz: `/Users/joaquim/Git/Educa.ia/tasks/prd-fundacao-tecnica/15_task.md:105-107` mostra o controle negativo reprovando **na mesma máquina do Joaquim**, em 14/09, com a B em p95 2,53 s contra o limite de 507 ms — agora são 84–125 ms. Não é a máquina que mudou: entre as duas execuções entrou o commit `364049c`, que pôs `UV_THREADPOOL_SIZE=16` e `dns_opt` em api, realtime, despachante e worker, e a espera dos interativos da própria A caiu de p95 10,3 s (15.0) para 6,1 s — a vazão do worker subiu. A afirmação "não é desta tarefa" pode até estar certa, mas está sustentada por um motivo que o histórico desmente. **Correção exigida:** corrigir o parágrafo do `3_task.md` e o item do `TODO.md` para citar a medição de 14/09 na mesma máquina e a mudança de ambiente do `364049c` como causa candidata, e trocar os "caminhos" propostos por essa investigação; se a comparação com 15.0 for feita e apontar outra causa, registrar a que for.

Recomendações:

- `/Users/joaquim/Git/Educa.ia/apps/api/src/sessao/sessoes-sinteticas.ts:57-58`: o ternário é morto — `relogio` já tem padrão (`relogioDoSistema`) em `EmissorDeToken`, e passar `undefined` usa o padrão. `return new EmissorDeToken(codificada, relogio)` basta.
- `/Users/joaquim/Git/Educa.ia/infra/test/conferir-carga.int.test.ts:13-27`: cria escola por SQL cru, um segundo jeito de fazer o que o projeto faz por `ops:escola`/`BancadaDeSessoes`. O guarda de `escola.repository.test.ts` não alcança arquivo de teste, mas é uma porta paralela a mais para manter.
- A subtarefa 3.2 pedia `criarEscolaComSessao({ papel })` em `apps/api/test/configuracao-de-teste.ts`; o que existe é o `BancadaDeSessoes` de `apps/api/test/sessao-de-teste.ts`, da tarefa 2.0. A intenção está cumprida, mas a letra da subtarefa não — vale uma linha no `3_task.md` dizendo que o helper já existia, para a próxima tarefa não procurar o nome que não foi criado.
- `/Users/joaquim/Git/Educa.ia/apps/worker/test/fila-de-teste.ts:36`: teste do worker passa a depender de `apps/api/src/ops/escola.ts`. É o terceiro importador na lista permitida; se aparecer um quarto, vale mover a criação de escola sintética para um helper compartilhado em vez de ampliar a lista.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-16 06:12:57 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: sala (handshake do realtime) · migration · fila (cenário de carga)
Rate limit: ok — nenhum limite por IP foi introduzido; a API mantém o limitador por usuário e por escola antes da leitura de sessão (`packages/nucleo/src/identidade/guarda-sessao.ts`)
Fila e prioridade: ok — vaga por escola e prioridades intocadas; `apps/despachante/test/vagas.int.test.ts` não mudou
Concorrência: protegida — nada novo no padrão "busca, verifica, grava"; escolas do cenário nascem com slug sorteado sob restrição única, e a FK nova é do banco
Índice e paginação: ok — a leitura do handshake é `(escola_id, id)`, coberta pelo índice único `sessao_escola_id_unico` (`packages/nucleo/src/db/schema/sessao.ts:50`), uma linha por conexão
Degradação de IA: não se aplica
Migration: compatível — `packages/nucleo/drizzle/0006_fk_escola_nas_tabelas_do_f0.sql` só adiciona FK `NOT VALID` (sem varredura), migrador com `lock_timeout` de 5 s e 3 tentativas (`packages/nucleo/src/db/migrar.ts:17-19`), `VALIDATE` adiado com consulta de órfãos e dono no `TODO.md`; prova em `packages/nucleo/src/db/migrar.int.test.ts` (aplica sobre linha órfã, barra escrita nova com 23503, `VALIDATE` ainda reprova)
Métrica e alerta: ok — pool do realtime medido (`apps/realtime/src/configurar-app.ts:44`) e já aparece no painel por `job` (`infra/grafana/paineis/fundacao.json:548,597`), somado a `realtime.conexoes`; nenhum alerta novo foi criado, então não falta runbook novo
Bloqueantes: nenhum

Sobre a pergunta do controle negativo: **basta, não é bloqueante.** A regra 80, item 3, continua com teste que quebra se ela for removida — `apps/despachante/test/vagas.int.test.ts:210` (controle negativo com a vaga desligada, escola passa do teto) e `:436` (A sem vaga não atrasa B), com Redis e Postgres reais. O cenário de carga perdeu sensibilidade, não perdeu a prova. Mas a explicação registrada está fraca e entra como recomendação abaixo.

Recomendações:
1. `tasks/prd-identidade-e-tenancy/3_task.md:98-105` e `TODO.md` — a justificativa "é calibração desta máquina" não se sustenta sozinha: no F0, na mesma máquina, o controle negativo deu `espera_b` p95 2,63 s (`tasks/prd-fundacao-tecnica/validacao.md:201`) e agora dá 84–125 ms, vinte vezes menos. Antes de apertar CPU ou limiar, achar por que a carga da A deixou de saturar o worker (sessão real por requisição, papel/limite da A, tempo entre criar as sessões e a fase). Se a A não satura mais, o `npm run carga` verde também prova menos do que diz. Vale anexar essa comparação ao item do `TODO.md`, que hoje só fala em folga de máquina.
2. `apps/realtime/src/autenticacao-do-handshake.ts:76-99` — o handshake não tem limitador por usuário e por escola. Na API a ordem das guardas existe justamente para rajada não chegar ao Postgres; no realtime não há nada equivalente. Hoje o dano é contido pelo pool de 5 por instância e pelo recuo espalhado do cliente, mas antes de o modo sala (F10) botar tráfego real ali, um limite por `(escola, usuário)` em Redis no handshake deveria entrar.
3. `apps/realtime/src/autenticacao-do-handshake.ts:79-96` — o handshake não conta o próprio desfecho (aceito, `NAO_AUTENTICADO`, `INDISPONIVEL_TENTE_DE_NOVO`) nem mede a latência da leitura, e o aviso de indisponível é espaçado em 30 s de propósito: a taxa de recusa fica sem série. Um contador por código de desfecho (sem usuário e sem escola, regra 20) fecharia o buraco; hoje só se enxerga de lado, por `realtime.conexoes` caindo e pelo pool.
4. `REALTIME_BANCO_POOL_MAXIMO=5` (`.env.example:81`) — dois realtimes dão 10 conexões para ~1.800 clientes voltando juntos depois de uma queda. A consulta é curta e o `connectionTimeoutMillis` corta em 2 s, mas o número merece medida no cenário `login-7h30` da 16.0 em vez de estimativa.
5. `docs/runbook.md` não cita o realtime em nenhuma linha. Agora que ele depende do Postgres, cabe um parágrafo: o que significa `realtime.conexoes` caindo com `db_pool_em_uso` do `job=educa/realtime` no teto, e que recusa de handshake não aparece no alerta de 5xx (socket.io devolve `connect_error`, não status HTTP).
6. `apps/realtime/test/sistema.int.test.ts:18` e `metricas.int.test.ts:9` importam `apps/api/test/sessao-de-teste.js`: o teste do realtime passa a depender da árvore de teste da API. Mover a bancada para `tools/testes/` deixaria a dependência explícita.

## revisor-geral · 2ª rodada · REPROVADO · 2026-09-16 06:14:24 · `tasks/prd-identidade-e-tenancy/3_task.md`

**VEREDITO: REPROVADO**

**Escopo:** respeitado — o diff desta rodada é só `tasks/prd-identidade-e-tenancy/3_task.md` e `/Users/joaquim/Git/Educa.ia/TODO.md`; nenhum arquivo de código, teste, migration ou infra tem mtime posterior a 05:18:34 (conferido arquivo a arquivo). O critério de carga da tabela segue não cumprido, mas isso é agora, como exigi na rodada 1, decisão do Joaquim registrada no documento, não pendência desta tarefa.

**Aderência à Tech Spec:** ok.

**Portão local:** inválido. `node tools/processo/portao-local.ts conferir tasks/prd-identidade-e-tenancy/3_task.md` responde:

```
portão local: TODO.md mudou em 2026-09-16 06:12:08, depois do início do último (2026-09-16 05:39:58). Rode `node tools/processo/portao-local.ts --infra` de novo.
```

**Bloqueantes**

1. `/Users/joaquim/Git/Educa.ia/TODO.md` (mtime 2026-09-16 06:12:08) contra `.processo/portao.json` (`inicio` 2026-09-16T08:39:58.852Z = 05:39:58 local) — o carimbo é anterior à última alteração que o processo conta como código. `alteracoesDeCodigo` (`tools/processo/revisoes.ts:338-343`) só exclui `tasks/` e `.processo/`; `TODO.md` entra. A afirmação da mensagem de entrega ("Portão local: carimbo válido ... posterior à última alteração de código") era falsa no momento em que foi escrita: a edição do `TODO.md` é desta rodada e veio depois do carimbo. O hook bloqueia o commit com a mesma mensagem. **Correção exigida:** terminar as edições de documento e rodar `node tools/processo/portao-local.ts --infra`, e só então pedir a rodada seguinte.

**O que foi verificado e está certo** (para não refazerem):

- Correção 1 — a linha de carga da tabela ("Testes que provam a regra") está idêntica ao `HEAD`: aparece como contexto no `git diff HEAD`, sem `+`/`-`. A decisão foi subida ao Joaquim em `3_task.md:121-123`, com o critério declarado como não cumprido em `3_task.md:106-108`.
- Correção 2 — os dois textos (`3_task.md:114-119` e `TODO.md:92-101`) agora citam a medição de 14/09 e o `364049c` como causa candidata, e o "primeiro passo" é repetir o cenário com o `UV_THREADPOOL_SIZE` anterior. Confiro os números contra as fontes: `tasks/prd-fundacao-tecnica/15_task.md:107` traz "2,53 s contra o limite de 507 ms" e a linha 101 traz "espera p95 10,3 s" dos interativos da A; o commit `364049c` (15/09, entre as duas medições) põe `UV_THREADPOOL_SIZE=16` e `dns_opt` em api, realtime, despachante e worker. A inversão do código de saída do controle negativo (saída 0 = reprovou) também bate com a 15.0.
- A "Nota sobre a subtarefa 3.2" é verdadeira: `escolaComSessao` existe em `/Users/joaquim/Git/Educa.ia/apps/api/test/sessao-de-teste.ts:97` e é usada em nove arquivos de teste.

**Recomendações**

- Levar ao `/retro`: o carimbo tratar `TODO.md` e outros `.md` fora de `tasks/` como código custa uma rodada de `test:infra` (uns 16 min) por edição de documento, o que empurra o implementador a editar doc antes do portão por disciplina. Um filtro por extensão, ou uma lista curta de documentos de processo, resolveria sem afrouxar o que o carimbo protege.
- As três recomendações de código da rodada 1 (`apps/api/src/sessao/sessoes-sinteticas.ts:57-58`, `infra/test/conferir-carga.int.test.ts`, o quarto importador de `ops:escola`) seguem em aberto e continuam sendo recomendação; deixá-las para o `/validar` está correto.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-16 06:40:56 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: fila | migration (inalterados desde a rodada aprovada)
Rate limit: ok
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: compatível
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
1. Reaplicadas, ainda pendentes e de propósito não feitas nesta rodada (registradas para `/validar` e `/retro`): limitador por usuário e por escola no handshake do realtime (`/Users/joaquim/Git/Educa.ia/apps/realtime/src/autenticacao-do-handshake.ts`); contador por desfecho do handshake; `REALTIME_BANCO_POOL_MAXIMO` medido na 16.0; parágrafo do realtime em `/Users/joaquim/Git/Educa.ia/docs/runbook.md`; bancada de teste compartilhada entre api e realtime.
2. A dívida do controle negativo (`/Users/joaquim/Git/Educa.ia/TODO.md`, "Processo e dívida do F0") deveria ser fechada antes da 16.0 (`login-7h30`), porque o mesmo cenário é a base de comparação dela: sem saber por que a escola A parou de saturar o worker, o cenário novo nasce medindo a mesma coisa duvidosa.

Verificação desta rodada: confirmei que nenhum arquivo de código, teste, migration ou infra mudou desde a minha rodada aprovada (`infra-guardian` rodada 1, 06:06:06–06:12:57). O arquivo de código mais recente entre os modificados é `/Users/joaquim/Git/Educa.ia/infra/test/carga.test.ts`, com mtime 05:18:34. Só `/Users/joaquim/Git/Educa.ia/TODO.md` (06:14:46), `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/achados-revisoes.md` (06:14:24, escrito pelo hook), `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/3_task.md` (06:38:42) e `tasks.md` (06:39:11) são posteriores, e o diff deles é texto. A recomendação 1 da rodada anterior foi cumprida: os dois documentos deixaram de atribuir o resultado à máquina, citam as duas medições anteriores e o commit `364049c`, e o primeiro passo registrado é repetir o cenário com o `UV_THREADPOOL_SIZE` anterior. A regra 80, item 3, segue provada por `/Users/joaquim/Git/Educa.ia/apps/despachante/test/vagas.int.test.ts:210` (controle negativo da vaga) e `:436` ("A sem vaga não atrasa B"), que rodam no portão. Nenhum `.skip`, `.only` ou `todo(` novo no diff de testes.

## tenancy-guardian · 2ª rodada · APROVADO · 2026-09-16 06:41:01 · `tasks/prd-identidade-e-tenancy/3_task.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma mudou desde a minha rodada aprovada. Conferi arquivo a arquivo o mtime dos 58 arquivos do `git status`: o mais recente de código, teste, migration, schema ou infra é `/Users/joaquim/Git/Educa.ia/infra/test/carga.test.ts` em 2026-09-16 05:18:34, anterior à minha aprovação (06:09:07). Os únicos arquivos posteriores são `TODO.md` (06:14:46), `tasks/prd-identidade-e-tenancy/3_task.md` (06:38:42), `tasks/prd-identidade-e-tenancy/tasks.md` (06:39:11) e `achados-revisoes.md` (06:14:24, escrito pelo hook). A afirmação do prompt confere.

Queries verificadas: nenhuma. O diff desde a minha aprovação não contém `select`, `where`, repository, controller, DTO nem migration. `git diff HEAD` dos três documentos traz só prosa, marcação de subtarefa concluída, a tabela de revisões escrita pelo hook e o contador de `2 de 20` para `3 de 20`.

Teste de isolamento: presente e efetivo, inalterado desde a rodada 1 (`apps/realtime/test/sistema.int.test.ts`, `packages/nucleo/src/db/migrar.int.test.ts`, `apps/api/test/sessao-guarda.int.test.ts:155`, `apps/worker/test/uso.int.test.ts:137`).

Sobre o que auditei do texto novo, por tocar matéria minha:

- O item de FK do `TODO.md` está igual ao que aprovei. A consulta de órfãos respeita `job_registro.escola_id` anulável (`j.escola_id is not null`), como manda o check de `tipo` `sistema.*`, e não usa esse filtro nas outras duas, que são `not null`. Os três nomes de restrição do comando `VALIDATE` batem literalmente com os da migration `/Users/joaquim/Git/Educa.ia/packages/nucleo/drizzle/0006_fk_escola_nas_tabelas_do_f0.sql`: `configuracao_operacional_escola_escola_id_escola_id_fk`, `job_registro_escola_id_escola_id_fk`, `uso_infra_diario_escola_id_escola_id_fk`.
- O item novo do controle negativo de carga e a "Execução do cenário de carga" do `3_task.md` são de justiça entre escolas sob carga (regra 80, item 3), não de isolamento de leitura. Nada ali afrouxa escopo: o texto declara o critério como não cumprido, aponta a causa candidata e sobe a decisão ao dono, e a regra segue provada por `apps/despachante/test/vagas.int.test.ts`. Não é bloqueante meu.
- A "Nota sobre a subtarefa 3.2" apenas registra que `BancadaDeSessoes.escolaComSessao` já cumpre o papel. O helper cria escola real e sessão real, que é justamente o que tirou as constantes `ESCOLA_A`/`ESCOLA_B` de fantasia dos testes.

Bloqueantes: nenhum.

Recomendações: as mesmas três da rodada 1, conscientemente não aplicadas e registradas pelo hook para o `/validar` e o `/retro`. Repito para não se perderem:

1. `/Users/joaquim/Git/Educa.ia/apps/api/test/sessao-de-teste.ts:103` — `encerrar()` faz `update sessao ... where id = $1` sem `escola_id`, fora do formato `where escola_id = $1 and id = $2` do resto da bancada.
2. Falta caso no handshake que cruze `esc` e `sid` entre escolas usando o `EmissorDeToken`, amarrando a sala ao escopo sem depender do teste da API.
3. `REALTIME_BANCO_POOL_MAXIMO=5` passa a ser consultado a cada handshake, sem limiar nem caso de carga para a onda das 7h30; entra no cenário `login-7h30` da 16.0.

## test-engineer · 3ª rodada · APROVADO · 2026-09-16 06:42:17 · `tasks/prd-identidade-e-tenancy/3_task.md`

## Auditoria — 3ª rodada (só documentos no diff)

Conferi o diff (só `3_task.md` e `TODO.md`; nenhum arquivo de código, teste, migration ou infra mudou — `git status` bate com isso) e checei fonte por fonte cada afirmação do registro de carga.

**Tudo que é verificável no registro confere:**

| Afirmação no `3_task.md` | Fonte conferida |
|---|---|
| "não reprovou, código de saída 1" | `infra/scripts/carga.ts:132` — `if (controleNegativo) return veredito.reprovadoPelaJustica ? 0 : 1`. Saída 1 = não reprovou. Coerente, não contraditório |
| critérios `espera_b` e `interativo_acima_de_30s` | `infra/scripts/carga.ts:64` (`CRITERIOS_DE_JUSTICA`) |
| "limiar de base + 500 ms" | `infra/k6/justica-entre-escolas.js:31,86` (`MARGEM_SOBRE_A_BASE_MS = 500`). Com base 14 ms, limite ≈ 514 ms; 84 e 125 ms ficam longe dele, consistente com "não reprovou" |
| "14/09: B em p95 2,53 s contra 507 ms" | `tasks/prd-fundacao-tecnica/15_task.md:106-107`, palavra por palavra |
| "interativos da A caíram de p95 10,3 s para 6,1 s" | `15_task.md:101` traz "espera p95 10,3 s" |
| "validação do F0, RF18: `espera_b` p95 2,63 s" | `tasks/prd-fundacao-tecnica/validacao.md:201` |
| "`364049c` pôs `UV_THREADPOOL_SIZE=16` e `dns_opt` em api, realtime, despachante e worker" | commit de 15/09, entre as duas medições; a mudança está lá |
| "regra 80, item 3, não ficou sem prova" | `apps/despachante/test/vagas.int.test.ts:210` (vaga desligada → `maximo('A') === 12`, com o evento `worker.vagas_por_escola_desligadas` no log) e `:436` (B conclui em 3 s enquanto os 20 da A ficam `aguardando`). Os dois morrem se a vaga por escola sair, e rodam no `npm run test` |
| "`escolaComSessao` já existia" | `apps/api/test/sessao-de-teste.ts:97` |

Não achei nenhum ponto em que o texto diga mais do que foi medido. Ao contrário: o documento (a) mantém a régua original da tabela em vez de baixá-la, (b) declara em negrito que **esse é o critério e ele não foi cumprido**, (c) diz que o `npm run carga` verde "prova menos do que diz", que é a conclusão desconfortável e correta, e (d) separa o que continua provado (regra 80.3, por teste de portão) do que ficou sem prova (a sensibilidade do cenário). Varredura no repositório: nenhum `.skip`, `.only`, `xit` ou teste comentado.

**Minha recomendação 1 da 2ª rodada não virou bloqueante.** O risco que eu apontei era o `/validar` ler na tabela uma prova que não aconteceu; com a declaração em `3_task.md:106-108` e a decisão subida ao Joaquim em `:127-129`, o risco está fechado por um caminho melhor que o que eu sugeri — quem baixa critério de aceite é o dono da tarefa, não o implementador. As recomendações 2, 3 e 4 continuam abertas e continuam recomendações: nenhuma delas deixa regra sem prova.

```
VEREDITO: APROVADO
Cenários exigidos: os mesmos da 2ª rodada (caminho feliz do F0 com escola e sessão reais · emissor `sintetico` recusado em todo caminho · FK: escrita com `escola_id` inexistente e migration `NOT VALID` sobre órfã · isolamento no realtime e no uso · sessão encerrada · Postgres fora → indisponível, não "não autenticado" · handshake não move `ultimo_uso_em` · execução registrada do cenário de carga). Nenhum cenário novo: o diff não tem código.
Cobertos: todos, sem mudança desde a 2ª rodada. O cenário de carga continua registrado com os dois vereditos e os números; a regra 80, item 3, segue provada por apps/despachante/test/vagas.int.test.ts:210 e :436, que rodam no portão.
Bloqueantes: nenhum.
Recomendações:
1. tasks/prd-identidade-e-tenancy/3_task.md:107 — "não foi cumprido nesta execução" soa transitório, e o parágrafo seguinte diz o contrário ("não é intermitência"). "não foi cumprido, e não é intermitência" evita que o /validar leia como azar de uma rodada.
2. tasks/prd-identidade-e-tenancy/3_task.md:96-121 — os p95 citados vêm de `/execucao/resumo-base.json` e `resumo-carga.json`, que ficam no volume do compose e somem. O registro é testemunhal, não auditável. Guardar os dois resumos (ou o trecho de métricas) junto da tarefa tornaria a comparação com 14/09 reproduzível por quem pegar a pendência — vale como padrão para o /retro, porque a validação do F0 tem a mesma limitação.
3. tasks/prd-identidade-e-tenancy/3_task.md:101-104 — o que a 3.0 de fato precisava do cenário (as escolas e sessões novas funcionarem de ponta a ponta) está provado pelo run verde: 482 interativos da B concluídos e 1.866 lotes da A enfileirados só existem se o k6 autenticou e gravou job. Vale dizer isso em uma linha, porque é a parte da linha de carga que pertence a esta tarefa; hoje fica implícita no parágrafo final.
4. As recomendações 2, 3 e 4 da minha 2ª rodada seguem abertas e sem alteração: `infra/test/carga.test.ts:139` (nome fala do cenário inteiro, asserção olha dois arquivos), `apps/realtime/test/metricas.int.test.ts:50` (`length > 0` passa com qualquer série), `apps/realtime/test/sistema.int.test.ts:259` (só a direção negativa do `ultimo_uso_em`, até a renovação de sessão entrar).
```

Arquivos relevantes: `/Users/joaquim/Git/Educa.ia/tasks/prd-identidade-e-tenancy/3_task.md`, `/Users/joaquim/Git/Educa.ia/TODO.md`, `/Users/joaquim/Git/Educa.ia/apps/despachante/test/vagas.int.test.ts`, `/Users/joaquim/Git/Educa.ia/infra/scripts/carga.ts`, `/Users/joaquim/Git/Educa.ia/infra/k6/justica-entre-escolas.js`, `/Users/joaquim/Git/Educa.ia/tasks/prd-fundacao-tecnica/15_task.md`, `/Users/joaquim/Git/Educa.ia/tasks/prd-fundacao-tecnica/validacao.md`.
