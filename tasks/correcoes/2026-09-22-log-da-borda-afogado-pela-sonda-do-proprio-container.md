# Correção — 88% do log da borda é a sonda do próprio container, e afoga o que diagnostica um 503

**Origem:** medição feita durante a correção `2026-09-21-log-da-falha-sem-carimbo-de-hora`; o
`infra-guardian` daquela rodada apontou que esta entrega mais diagnóstico da borda do que aumentar o
`--tail` entregou
**Subagentes obrigatórios:** `infra-guardian` (borda e ambiente), `privacy-guardian` (regra 20, item 9)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Quatro dos sete vermelhos intermitentes de 20 e 21/09/2026 foram em `infra/test/borda.int.test.ts`, e
nenhum foi diagnosticado. O log da borda é onde a resposta estaria — e ele é quase todo ruído.

Contado numa execução de `npm run test:infra` de 20 min: a `borda` escreveu **38.787 linhas**, das
quais **34.102 (88%)** são do logger `admin.api` registrando `received request`. As linhas que
realmente diagnosticam um 503 somam 3.317:

| Logger e mensagem | Linhas |
|---|---:|
| `admin.api` › `received request` | **34.102** |
| `health_checker.active` › `HTTP request failed` | 1.753 |
| `health_checker.active` › `status code out of tolerances` | 1.080 |
| `health_checker.active` › `host is up` | 484 |
| boot do Caddy (`using config from file`, `server running`, …) | 76 cada |

O `received request` não é tráfego de aluno nem de professor: é o **healthcheck do próprio container**
batendo na API de administração. Confere pelo conteúdo da linha:

```json
{"level":"info","logger":"admin.api","msg":"received request","method":"GET",
 "host":"127.0.0.1:2019","uri":"/config/","remote_ip":"127.0.0.1",
 "headers":{"User-Agent":["Wget"],"Accept":["*/*"],"Connection":["close"]}}
```

## Causa

O `infra/Caddyfile` já exclui do log padrão, **de propósito**, tudo que registra requisição —
`http.log.access`, `http.log.error` e `http.handlers.reverse_proxy` —, com o comentário citando o item
9 da regra 20. **O `admin.api` escapou dessa lista.**

Ele é o único logger de requisição que sobrou ligado, e registra `uri`, `remote_ip` e `headers`. Aqui
o tráfego é loopback do próprio container, então não há dado pessoal por trás — mas a forma é
exatamente a que o item 9 proíbe, e o `Caddyfile` é a base do que vai para o staging.

Dois danos, e o segundo é o que motivou a correção:

1. **forma**: log de requisição ligado num arquivo cujo comentário diz que nenhum está;
2. **diagnóstico**: 34 mil linhas de `wget` empurram para fora de qualquer janela de `--tail` as 3.317
   linhas que dizem quando a borda tirou e recolocou cada upstream no balanceamento. Com o
   `--tail 4000` que a correção anterior instalou, o despejo da falha pegava ~2 minutos de sonda; sem
   o ruído, a borda inteira cabe em 4.000 linhas.

## Teste que reproduz

Dois, e o segundo existe porque o primeiro **não basta** — a rodada 1 reprovou a correção por isso.

1. **`tools/ci/borda.test.ts`** › "nada de requisição no log…" afirma os **dois blocos `log` por
   inteiro** — as diretivas, na ordem — e que existem só esses dois. Vermelho antes: 1 de 7 casos. É
   guarda de **texto de arquivo**.
2. **`infra/test/borda.int.test.ts`** › "a borda não registra acesso nem a URL de requisição que
   falhou…" passou a afirmar o **resultado**: nenhuma linha com `"logger":"admin.api`, e nenhuma com
   as chaves `remote_ip`, `client_ip`, `headers` ou `uri`. Com **controle positivo antes** das
   negativas — exigir uma linha da sonda —, porque a rodada 2 apontou que log da borda vazio faria as
   três passarem **vazias**: o `expect(logs.length)` que existia ali é do log combinado (borda mais os
   serviços atrás) e pode ser satisfeito só por linha da API. De quebra, esse controle passou a pegar
   `output file` e `logging: {driver: none}` na borda **do compose**, que nenhum outro caso alcançava.

**Por que o guarda de texto não basta, medido pela rodada 1.** O token do `exclude` **não é validado
pelo Caddy**: trocando `admin.api` por `admin.apiX.nao.existe`, o Caddy sobe com `exit 0`, **sem um
aviso**, e o `received request` volta ao log. Entre nós e as 34 mil linhas havia só uma string que
ninguém valida, com um teste que checava apenas se a string estava no arquivo. Um bump de imagem que
renomeie ou reaninhe o logger devolveria o ruído em silêncio, refazendo o furo de forma do item 9 e
quebrando outra vez a janela de `--tail 4000` que a correção anterior dimensionou.

A segunda asserção é a que fecha isso — e é deliberadamente sobre a **forma** (`remote_ip`, `uri`,
`headers`), não só sobre o nome do logger, para valer mesmo que o nome mude.

**A armadilha que apareceu cinco vezes nesta correção, e o conserto que fechou a classe.** Vale
registrar junto, porque o padrão é mais útil que os casos: **asserção negativa cuja entrada pode ser
esvaziada por um edit que nenhum guarda enxerga.**

| # | Rodada | Forma | Como esvaziava a negativa |
|---|---|---|---|
| 0 | 1 | pôr a asserção no contêiner descartável | `docker run` sem healthcheck: ninguém bate em `:2019`, e ela passaria vazia **inclusive antes da correção** |
| 1 | 1 | guarda só de texto do `Caddyfile` | o token do `exclude` não é validado pelo Caddy: escrito errado, sobe sem aviso e o log volta |
| 2 | 2 | as três negativas sobre o log da borda | log da borda vazio as faria passar vazias; o `expect(logs.length)` que existia é do log **combinado** |
| 3 | 3 | o controle positivo que consertou a 2 | guarda o bloco `log sonda`; as negativas são do `log default` — blocos independentes |
| 4 | 4 | `format console` no `log default` | muda o encoder e **cega qualquer negativa por nome de logger**; só a negativa por **forma** sobrevive |

A de número 0 é a mais pura da família e é anterior a todas: eu quase pus a asserção onde ela nunca
poderia falhar. As outras apareceram em sequência, e **três delas depois de eu consertar a anterior**.
A 3 e a 4 saíram na mesma rodada.

**Uma asserção que sobreviveu às cinco:** a negativa por **forma**
(`/"(remote_ip|client_ip|headers|uri)":/`), exigida na rodada 1. Com `format console`, o Caddy troca o
encoder e o nome do logger deixa de aparecer como `"logger":"admin.api"` — as negativas por nome ficam
cegas com três linhas ofensivas no log, e só a de forma pega. Afirmar a forma do dado, e não o nome de
quem o produz, foi a única escolha robusta a todas as variações.

**E o conserto que encerrou a família, em vez de fechar uma forma por rodada.** A família é aberta por
construção: toda diretiva do bloco `log` é um jeito de mudar a entrada das negativas, e a próxima
versão do Caddy pode acrescentar outra. Então `tools/ci/borda.test.ts` passou a afirmar os **dois blocos
por inteiro** — as diretivas, na ordem, sem comentário —, e que existem **só** esses dois. Quatro
regexes por diretiva viraram três asserções. Medido:

| Mutação no `Caddyfile` | Resultado |
|---|---|
| `exclude` sem `admin.api` | ❌ 1 de 7 |
| `log default` com `output file` | ❌ 1 de 7 |
| `log sonda` com `output discard` | ❌ 1 de 7 |
| `log default` com `format console` | ❌ 1 de 7 |
| `log default` com `level ERROR` | ❌ 1 de 7 |
| terceiro bloco `log extra` | ❌ 1 de 7 |
| como ficou | ✅ 7 de 7 |

As duas últimas antes desta mudança **passavam verdes**: nenhum guarda olhava `format`, `level`, nem a
quantidade de blocos.

**E uma sutileza que achei ao provar o vermelho, que vale para qualquer guarda deste arquivo.** Na
primeira tentativa a mutação passou **verde**: o contêiner da borda já estava de pé com o `Caddyfile`
correto, e o Caddy lê o arquivo **no boot**. Mudar o arquivo no disco não recarrega, e
`docker compose up` não recria por mudança em conteúdo de bind mount. Só com `--force-recreate` o
vermelho apareceu. Na esteira isso não é problema, porque o ambiente nasce limpo; numa máquina de
desenvolvimento com a borda de pé, **um guarda deste arquivo pode passar verde validando configuração
que não é a do disco**. Quem for medir mutação aqui precisa recriar o contêiner.

## Correção

Uma linha: `admin.api` entra no `exclude` do bloco `log default` do `infra/Caddyfile`.

E a parte não óbvia: **o logger `admin` precisa continuar fora da exclusão**. É ele que emite
`admin endpoint started`, o boot da sonda usada pelo healthcheck do compose, e excluir o pai por engano
derrubaria isso em silêncio. Isso chegou a ser uma asserção própria (com lookahead sobre o texto), mas
deixou de ser: com o bloco `log` fixado por inteiro, trocar `admin.api` por `admin` — ou somar ` admin`
à lista — já quebra a igualdade exata do `exclude`. Cobertura mais forte, e uma asserção a menos.

**O que foi recusado.** Trocar o healthcheck do container para não bater na API de administração. Isso
resolveria o volume, mas mexeria na sonda que o compose usa para saber se a borda subiu — risco
desproporcional para um problema que uma linha de `exclude` resolve, e a API de administração
continuaria com log de requisição ligado.

## Evidência

**Que só o `admin.api` produz `received request`, e que o logger `admin` é outro.** Contado com a
borda de pé, agrupando por logger e mensagem:

```
    506  admin.api                     received request
    228  health_checker.active         HTTP request failed
    107  health_checker.active         status code out of tolerances
     50  health_checker.active         host is up
     17  admin                         admin endpoint started      ← logger diferente
```

**Depois da exclusão**, com a borda recriada:

```
linhas JSON: 13
     1  admin                  ← `admin endpoint started` preservado
     1  http.auto_https
     1  tls.cache.maintenance
     1  http.log
     ... (só boot)
admin.api presente? False
```

Ou seja: **excluir `admin.api` não arrasta o logger `admin`.** Era suposição minha sobre como o Caddy
casa prefixo de logger, e foi medida antes de virar afirmação.

**E a sonda continua funcionando**, que é o que não podia quebrar. Parei um upstream e reiniciei:

```
      8  health_checker.active   HTTP request failed
      2  health_checker.active   status code out of tolerances
admin.api presente?      False
health_checker presente? True
```

**Que nenhuma linha legítima da borda carrega as chaves proibidas**, o que era preciso conferir antes
de afirmar forma em vez de nome de logger. Numa execução com a sonda falhando (upstream parado e
reiniciado), 121 linhas JSON:

```
loggers: health_checker.active 72 · (boot sem logger) 21 · http 8 · tls 6 · admin 5 · ... · admin.api 0
chaves:  error, host, status_code, addr, upstream-afins, ts, level, logger, msg, ...
chaves proibidas pelo item 9 (remote_ip, client_ip, headers, uri, request): NENHUMA
```

**Vermelho antes, verde depois**, nos dois guardas:

| `infra/Caddyfile` | `borda.test.ts` (texto) | `borda.int.test.ts` (resultado) |
|---|---|---|
| sem `admin.api` no `exclude` | ❌ 1 de 7 | ❌ — `expected … not to match /"logger":"admin\.api/` |
| token inválido (`admin.apiX.nao.existe`) | ✅ **passa** (é o furo) | ❌ pega |
| como ficou | ✅ 7 de 7 | ✅ passa |

A linha do meio é a razão de a correção ter sido reprovada na rodada 1 e de existir o segundo guarda.
O vermelho do de resultado traz a evidência literal, uma linha a cada 2 s:

```
{"logger":"admin.api","msg":"received request","method":"GET","host":"127.0.0.1:2019",
 "uri":"/config/","remote_ip":"127.0.0.1","headers":{"User-Agent":["Wget"],...}}
```

**O efeito no despejo da falha.** A borda sai de 38.787 para ~4.685 linhas por execução de
`test:infra` (38.787 − 34.102). Com o `--tail 4000` da correção anterior, ela passa de "últimos ~2
minutos" para "quase a execução inteira" — e é por isso que o `infra-guardian` disse que esta correção
entrega mais diagnóstico da borda do que o aumento do tail entregou, e que o tail deve ser remedido
**depois** dela, não antes.

## O que fica para o staging, e por quê

Os dois guardiões marcaram itens que **não** entram aqui, e o motivo de cada um está escrito para a
tarefa que os herdar não precisar redescobrir.

**`http.stdlib` — o único caminho que sobra para endereço de cliente no log da borda.** É onde o Caddy
pendura o `ErrorLog` do servidor Go, e a mensagem leva o endereço **dentro do `msg`**
(`"http: TLS handshake error from <ip>:<porta>"`), sem chave nenhuma — logo cego às negativas por nome
**e** à negativa por forma. O `privacy-guardian` exercitou HTTPS, preface h2, cabeçalho de 80 KB e
requisição malformada: em HTTP/1 sem TLS ele não dispara, então hoje não é furo. **Vira furo quando o
staging ligar HTTPS**, e lá o log do Docker vai para o Alloy e o Grafana Cloud
(`tasks/prd-fundacao-tecnica/notas-staging.md`), o que torna uma linha dessas dado retido e pesquisável.
Acrescentar `http.stdlib` ao `exclude` **na mesma tarefa que ligar HTTPS**, não antes: hoje ele custaria
erro de servidor Go sem ganho nenhum.

**Quando o log de acesso voltar, a negativa por forma se converte — não se apaga.** Ela vira asserção
**positiva** sobre quais campos aquele log guarda (sem `uri` com query, sem `headers`). Apagá-la reabre
a família inteira de cinco armadilhas que esta correção fechou. E a lista ganha `user_id` (que o access
log do Caddy emite, vindo de basicauth) e `resp_headers` — este último a âncora atual não pega, porque
`"(remote_ip|...)":` exige que o grupo comece logo depois da aspa. Nenhum dos dois aparece hoje, e
nenhum aparece sem `uri` ou `headers` na mesma linha, então hoje ficam pegos por arrasto.

**O rastro de mudança de configuração da borda é o git, não o log.** Com `persist_config off` e o bind
mount `:ro`, toda alteração passa pelo `Caddyfile` versionado. Se o staging mantiver a API de
administração ligada, isso continua valendo — e não se resolve religando log de requisição.

**O que o `--tail` exige antes de ser redimensionado.** O piso de 4.000 não vem da borda: vem do maior
log **nosso** (`api-2`, 3.899 linhas), que não mudou. Então nada regride aqui. Mas o docstring de
`tools/ci/compose.ts` diz que os cinco logs de terceiro somam 149.322 linhas, e com este ruído fora cai
para algo em torno de 115 mil — **por subtração, não por medição**. O `infra-guardian` exigiu recontagem
numa execução real antes de mexer na régua. Está no `TODO.md`.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-22 01:12:15 | 2026-09-22 01:19:05 | `test-engineer` | 1 | REPROVADO | a993ad9fc78419198 |
| 2026-09-22 02:10:48 | 2026-09-22 02:15:47 | `test-engineer` | 2 | APROVADO | a635c18dfc5a220ea |
| 2026-09-22 02:43:41 | 2026-09-22 02:46:41 | `test-engineer` | 3 | APROVADO | ace676b94850eb964 |
| 2026-09-22 03:14:56 | 2026-09-22 03:21:09 | `test-engineer` | 4 | APROVADO | a9f277f505c1f9a7d |
| 2026-09-22 03:51:00 | 2026-09-22 03:53:22 | `test-engineer` | 5 | APROVADO | acd2abe4b79a3d2c9 |
| 2026-09-22 04:21:10 | 2026-09-22 04:25:32 | `infra-guardian` | 1 | APROVADO | ae6ebac6fb4c1df96 |
| 2026-09-22 04:21:32 | 2026-09-22 04:26:40 | `privacy-guardian` | 1 | APROVADO | a2b356bf56afdb858 |
| 2026-09-22 04:55:46 | 2026-09-22 04:59:18 | `test-engineer` | 6 | APROVADO | a290a8742aa78e7f5 |
| 2026-09-22 05:00:03 | 2026-09-22 05:01:18 | `infra-guardian` | 2 | APROVADO | abf055b4d1fcbc741 |
| 2026-09-22 05:00:17 | 2026-09-22 05:01:45 | `privacy-guardian` | 2 | APROVADO | a781bd71937725edd |
| 2026-09-22 05:29:12 | 2026-09-22 05:30:13 | `test-engineer` | 7 | APROVADO | a523a5a82d978b0c1 |
| 2026-09-22 05:30:37 | 2026-09-22 05:31:19 | `infra-guardian` | 3 | APROVADO | abda4ad18753d5418 |
| 2026-09-22 05:30:28 | 2026-09-22 05:31:25 | `privacy-guardian` | 3 | APROVADO | a2ed401ea7edac971 |
