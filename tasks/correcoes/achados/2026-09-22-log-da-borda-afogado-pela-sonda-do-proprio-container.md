# Achados das revisões — `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-22 01:19:05 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

Auditei o diff (`infra/Caddyfile` + `tools/ci/borda.test.ts`), os guardas vizinhos, e **medi** o que você pediu para conferir ou derrubar, com a imagem fixada `caddy:2.11.4-alpine` e o próprio `infra/Caddyfile` montado em containers descartáveis (nenhum arquivo da árvore tocado; cópias em `/tmp` como entrada de ferramenta, containers removidos).

```
VEREDITO: REPROVADO

Cenários exigidos (correção de configuração de borda; sem dado de escola, sem endpoint e sem
papel envolvido, então permissão e isolamento não se aplicam — o que se aplica é regra 20
item 9, na forma do log, e regra 80 item 10, no diagnóstico):
  1. caminho feliz — a exclusão está declarada no `log default`
  2. caminho feliz de resultado — a linha de requisição deixa de chegar ao `docker logs` da borda
  3. borda — o logger pai `admin` não é arrastado (o `admin endpoint started` sobrevive)
  4. borda — a sonda (`health_checker`) continua chegando ao `docker logs` depois da mudança
  5. borda — um segundo `exclude`, em outro bloco de log, derrubando o pai
  6. borda — o token do `exclude` deixar de casar com o nome real do logger (Caddy aceita calado)

Cobertos: 1 (tools/ci/borda.test.ts:90) · 3 (tools/ci/borda.test.ts:96) · 4
(infra/test/borda.int.test.ts:586, prova de verdade, não coincidência) · 5
(tools/ci/borda.test.ts:96, medido por mim) · 6 parcialmente (só contra erro de digitação)

Bloqueantes:
  - infra/test/borda.int.test.ts:554 — a supressão do `admin.api` não tem nenhuma asserção de
    resultado. O único guarda é de texto de arquivo (tools/ci/borda.test.ts:90), e ele **não pode**
    falhar se o Caddy parar de honrar aquele token. Medido: troquei `admin.api` por
    `admin.apiX.nao.existe` no `exclude` e o Caddy subiu `running exit=0`, **sem um aviso**, com o
    `received request` de volta no log. Ou seja: entre nós e as 34.102 linhas existe uma string que
    o Caddy nunca valida, e o guarda só checa que a string está no arquivo — um bump de imagem que
    renomeie ou reaninhe esse logger devolve os 88% de ruído, quebra outra vez a janela de
    `--tail 4000` que a correção anterior dimensionou, refaz o furo de forma do item 9, e nada fica
    vermelho. Este repositório já decidiu que forma não basta para esta regra exata: a linha 554
    afirma o resultado para os outros três loggers e deixou o quarto fora.
    Correção exigida: estender a asserção de infra/test/borda.int.test.ts:554 para também negar o
    logger novo — `not.toMatch(/"logger":"admin\.api"/)` — ou, melhor, afirmar a **forma** que o item
    9 proíbe, independente de nome de logger: `not.toMatch(/"(remote_ip|headers|uri)":/)`. Medi as
    duas pontas nesse mesmo cenário: antes da correção, 1 wget em `:2019/config/` → 1 linha
    `admin.api` com `uri`, `remote_ip` e `headers`; depois, 2 wgets → zero linha, e nenhuma das
    chaves `remote_ip`, `headers`, `uri`, `client_ip` ou `request` sobra em linha nenhuma do log.
    O caso da linha 554 é o lugar certo e não custa nada: o serviço `borda` do compose tem
    healthcheck de `interval: 2s` (infra/compose.yml:400-404) e a janela do caso (`--since desde`,
    desde = início − 1 s, com dois `compose stop` no meio) cobre dezenas de segundos — era vermelho
    antes e é verde agora.

Recomendações:
  - Não ponha essa asserção no caso da borda descartável (infra/test/borda.int.test.ts:590):
    `subirBordaDescartavel` é `docker run` cru, sem healthcheck (infra/test/borda.int.test.ts:219),
    então nada bate em `:2019` ali e um `not.toMatch(/admin\.api/)` passaria **vazio**, inclusive
    antes da correção. A presença do `admin endpoint started` é o inverso: cabe em 590 (container
    recém-nascido) e nunca em 554, cuja janela começa muito depois do boot. Se quiser tornar o
    guarda do pai comportamental em vez de textual, é lá: `toMatch(/"logger":"admin"/)`.
  - `tools/ci/compose.int.test.ts:136` ficou apontando para `borda.test.ts:88`, que este diff
    transformou em linha de comentário; a asserção do `health_checker` no logger `sonda` está agora
    em `tools/ci/borda.test.ts:97`. A outra metade da frase (`borda.int.test.ts:586`) continua certa.
  - O `log default` não tem guarda de `level`: `level ERROR` (ou apagar o bloco) mata o
    `admin endpoint started` com as duas asserções novas verdes. Medido.
  - Sinal perdido ao excluir o logger inteiro (sua pergunta 3): existe um, e é pequeno — medido, o
    `admin.api` também emite `level: error`, `msg: "request error"` (e, por prefixo, os filhos
    `admin.api.*`). Nada no repositório faz POST na API de administração (`persist_config off`, e o
    healthcheck só faz GET em `/config/`), então falha ali aparece como container `unhealthy`. Se
    quiser o erro sem o ruído, o padrão já existe no arquivo: um terceiro bloco `log` com
    `include admin.api` e `level ERROR`, do mesmo jeito que o `log sonda` faz.
  - A asserção `\badmin\b(?!\.api)` tem duas imprecisões, nenhuma bloqueante: reprova um irmão
    legítimo (`exclude ... admin.identity` fica vermelho sem motivo — inócuo na prática, porque a
    asserção positiva já fixa a lista exata e qualquer token novo exige editar o teste de propósito);
    e o lookahead checa só o prefixo `.api`, então `admin.apis` escaparia dela (pego pela positiva).
```

**Sobre a pergunta 1, direto:** a asserção faz o que você quer, e ganha o lugar dela exatamente onde a positiva não alcança. Tentei quebrá-la com 11 variantes de `Caddyfile`: ela pega `admin` antes da lista, depois da lista, num **segundo** `exclude` dentro do `log default` e num `exclude` posto no bloco `log sonda` — os dois últimos passam verde pela asserção positiva, que os absorve no `[^}]*`. O que ela não vê é o que não é `exclude`: `level`, `output` e apagar o bloco.

**Sobre a pergunta 2:** `borda.int.test.ts:586` é prova, não coincidência — é `expect.poll(...).toBe(true)` com timeout de 10 s exigindo uma linha `health_checker.active` com `ts` posterior às interrupções no `docker logs` de um container que usa este mesmo `Caddyfile`; se a sonda parasse de chegar, o caso fica vermelho. Mas ela prova a sonda, e não a supressão do `admin.api` — e, pelo desenho daquele container, nunca vai poder provar. Falta o caso, e ele cabe em 554.

## test-engineer · 2ª rodada · APROVADO · 2026-09-22 02:15:47 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

Auditei o diff da rodada 2 e medi por conta própria, com containers descartáveis e a imagem fixada `caddy:2.11.4-alpine` (nada da árvore tocado; cópia mutada em `/tmp`, containers removidos, `git status` idêntico ao do prompt).

```
VEREDITO: APROVADO

Cenários exigidos (os mesmos seis da rodada 1; correção de configuração de borda, sem dado de
escola, endpoint ou papel — o que se aplica é a regra 20 item 9, na forma do log, e a regra 80
item 10, no diagnóstico):
  1. caminho feliz — a exclusão está declarada no `log default`
  2. caminho feliz de resultado — a linha de requisição deixa de chegar ao `docker logs` da borda
  3. borda — o logger pai `admin` não é arrastado (o `admin endpoint started` sobrevive)
  4. borda — a sonda (`health_checker`) continua chegando ao log depois da mudança
  5. borda — um segundo `exclude`, em outro bloco, derrubando o pai
  6. borda — o token do `exclude` deixar de casar com o nome real do logger (Caddy aceita calado)

Cobertos: 1 (tools/ci/borda.test.ts:90) · 2 (infra/test/borda.int.test.ts:561 e :565, o que
faltava) · 3 (tools/ci/borda.test.ts:96) · 4 (infra/test/borda.int.test.ts:599) ·
5 (tools/ci/borda.test.ts:96) · 6 (infra/test/borda.int.test.ts:561 pelo nome, :565 pela forma)

Bloqueantes: nenhum.

  A correção exigida na rodada 1 foi feita, e na opção mais forte. Medi as duas pontas outra vez,
  sozinho:
  - mutação (tirar `admin.api` do `exclude`, container novo, dois wgets em `:2019/config/`):
    2 linhas `{"logger":"admin.api","msg":"received request",...,"uri":"/config/",
    "remote_ip":"127.0.0.1","headers":{"User-Agent":["Wget"]...}}` — casam com as duas asserções
    novas, cada uma sozinha;
  - `Caddyfile` como ficou, com a sonda falhando (upstreams sem resolver) e dois wgets em `:2019`:
    33 linhas, `admin.api` 0, chaves `remote_ip|client_ip|headers|uri` 0, `"logger":"admin"` 1
    (`admin endpoint started` preservado), `health_checker.active` 20 (a sonda continua).
    Chaves presentes: addr, address, cache, error, file, host, level, logger, msg, name, network,
    origins, previous, protocols, server_name, storage, ts — nenhuma proibida.
  Sensibilidade fora de dúvida: o healthcheck da borda no compose é `interval: 2s`
  (infra/compose.yml:401) e a janela do caso (`--since` início − 1 s, com dois `compose stop` e as
  duas voltas ao balanceamento) cobre dezenas de segundos.
  Não pôr nada no caso da borda descartável (infra/test/borda.int.test.ts:568) está certo, pelo
  motivo que você deu: `docker run` sem healthcheck, ninguém bate em `:2019`, a asserção passaria
  vazia até antes da correção.
```

**1. As duas asserções fecham o bloqueante?** Sim, e conferi que são independentes: a linha da sonda do healthcheck casa com `"logger":"admin.api` e, separadamente, com `"uri":`, `"remote_ip":` e `"headers":`. O caminho residual é estreito e exige duas coisas ao mesmo tempo: um bump de imagem que **renomeie o logger e também renomeie os campos** (`uri` → `url`/`path`, `remote_ip` → outro nome). Como a forma vale para chave aninhada também (o regex procura `"uri":` em qualquer ponto da linha, inclusive dentro de um `"request":{...}`), o formato de log de acesso do Caddy continua pego. Não é hipótese que se cubra com mais regex; fica no bump de imagem, que recria o contêiner e passa pelos dois guardas.

**2. Vermelho falso quando um serviço atrás da borda mudar?** Não. Confirmei no código: `composeOuFalha('logs', …, 'borda')` chama `docker compose logs` com um único serviço (`tools/testes/compose.ts:17-23` e `:56`), então o log da API, do realtime e dos workers não entra nessa string — só o `logs` de :551, que tem asserção própria (`not.toContain(sentinela)`). A única fonte de vermelho falso seria o próprio Caddy passar a carregar uma dessas chaves em linha legítima, e a candidata é `health_checker.active` ganhar `remote_ip` do upstream num bump. Se isso acontecer, o vermelho é legítimo como convite a reexaminar o item 9 — decida na tarefa, e não afrouxe o regex em silêncio.

**3. A surpresa do bind mount merece guarda?** O aviso no documento (linhas 74-80) é o mínimo certo, e o furo é menor do que parece, porque os dois guardas se cobrem: edição de conteúdo do `Caddyfile` cai no guarda de texto (`tools/ci/borda.test.ts:90` fixa a lista exata, na ordem exata, e reprova até erro de digitação), e o caso que só o guarda de resultado pega — o nome do logger mudar — vem junto de bump de imagem, que altera a definição do serviço e **faz** o `docker compose up` recriar o contêiner. Sobra o cruzamento improvável (conteúdo do arquivo mudado de um jeito que o guarda de texto aceite). Por isso: recomendação, não bloqueante.

```
Recomendações:
  - infra/test/borda.int.test.ts:554-565 — falta controle positivo do que se está lendo. O
    `expect(logs.length).toBeGreaterThan(0)` de :552 é do log combinado (borda + serviços atrás), e
    pode ser satisfeito só por linha da API: se o log da borda sumir, as três negativas passam
    vazias. Uma linha resolve e é garantida nessa janela (os dois realtimes são parados e voltam):
    `expect(logDaBorda).toMatch(/"logger":"http\.handlers\.reverse_proxy\.health_checker/)`. De
    quebra, passaria a pegar `output file` e `driver: none` na borda **do compose**, que hoje só são
    pegos no contêiner descartável (:599) e no guarda do compose.
  - Guarda para o bind mount, se quiser fechar: afirmar a configuração **carregada**, não a do
    disco — `docker compose exec borda wget -qO- 127.0.0.1:2019/config/` e conferir o `exclude` do
    `log default` na resposta. É GET, `persist_config` não entra, e a própria sonda serve de estímulo
    (com a exclusão no lugar ela não gera linha; sem ela, gera). O que eu **não** recomendo é
    `--force-recreate` no `beforeAll` de `borda.int.test.ts`: é exatamente o comando da corrida de
    porta que você relatou na observabilidade.
  - tools/ci/compose.int.test.ts:136 — a outra metade da frase ficou obsoleta por este diff: o
    guarda de `output stderr` (o `expect.poll` do `health_checker`) saiu de `borda.int.test.ts:588`
    para `:599` com as 11 linhas novas. A referência ainda diz `:586`, que hoje é
    `await expect(caida.text()).rejects.toThrow()`. A metade `borda.test.ts:97` está certa.
  - Concordo com as duas coisas que você não fez. Guarda de `level` no `log default`: é furo
    pré-existente, fora do que esta correção mudou, e fica registrado (o `admin endpoint started`
    não é asserido em nenhum teste, e nada depende dele além da leitura humana). Terceiro bloco
    `log` com `include admin.api` + `level ERROR`: reconferi que ninguém no repositório escreve na
    API de administração — só o healthcheck com GET em `/config/`, e `reload` não aparece em
    `infra/scripts` nem em `tools/ci` —, então o `request error` perdido não é sinal que hoje exista.
    Se alguma tarefa futura passar a usar a API de administração, esse bloco volta à mesa.
  - Continuam valendo as duas imprecisões do `\badmin\b(?!\.api)` apontadas na rodada 1 (reprova
    irmão legítimo como `admin.identity`; `admin.apis` escapa do lookahead), inócuas porque a
    asserção positiva fixa a lista exata.
```

**Estado verificado:** `.processo/portao.json` com `inicio` 2026-09-22T04:43:01.040Z e as quatro suítes (`typecheck`, `lint`, `test`, `infra`), igual ao informado; sem `.skip`, sem teste comentado, sem `any` nos três arquivos de teste; árvore intacta (os mesmos cinco modificados e o documento novo), nada editado por mim. A nota de ambiente do `alertas.int.test.ts` é outra correção, concordo em não misturar.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`.

## test-engineer · 3ª rodada · APROVADO · 2026-09-22 02:46:41 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

Auditei o diff da rodada 3 (os cinco arquivos, mais `infra/compose.yml` e o contexto do caso em `borda.int.test.ts`). Confirmei as três correções aplicadas e não editei nada.

```
VEREDITO: APROVADO

Cenários exigidos (rodada 3 — só o que o diff mudou):
  - Rec 1: controle positivo antes das três negativas, para que log da borda vazio não
    as faça passar vazias
  - Rec 3: referências de linha em compose.int.test.ts apontando para linhas reais
  - Rec 2: recusada — julgar o argumento
  - Rec 4: registrada como furo pré-existente fora de escopo

Cobertos:
  - Rec 1 — infra/test/borda.int.test.ts:560. No lugar certo (antes de :561, :567 e :571)
    e afirma a coisa certa. Sensibilidade conferida de forma independente: o caso para os
    dois realtimes em :532 e os devolve em :547-548 dentro da janela `--since` de :519, e o
    healthcheck da borda é `interval: 2s` (infra/compose.yml:402) — a janela cobre dezenas
    de segundos, então a negativa de `admin.api` fica de fato vermelha na mutação.
  - Rec 3 — tools/ci/compose.int.test.ts:135-136. As três âncoras existem:
    borda.test.ts:97 é o `include http.handlers.reverse_proxy.health_checker` do `log sonda`;
    borda.int.test.ts:560 é o controle positivo; :603 é o predicado do `expect.poll` do
    contêiner descartável.
  - Rec 2 — recusa aceita. Concordo, e por um motivo a mais do que o seu: o estímulo que a
    sugestão traria já existe de graça (a sonda do compose bate em :2019 a cada 2 s), então
    o `exec wget` só acrescentaria a leitura da configuração carregada — cujo modo de falha
    (bind mount velho) é artefato de máquina de desenvolvimento, não da esteira, e já está
    escrito nas linhas 78-84 do documento. Não vale a dependência nova.
  - Rec 4 — registrada em achados-revisoes.md, com a reconferência de que ninguém escreve
    na API de administração. Correto.

Bloqueantes: nenhum.
```

**Q2 — o controle positivo está no lugar certo e afirma a coisa certa?** Sim, e sim. E a sua desconfiança está certa: **ele depende da parada dos realtimes.** O `health_checker.active` do Caddy só escreve em falha (`HTTP request failed`, `status code out of tolerances`) e na transição de volta (`host is up`) — em regime saudável ele não emite nada. A sua própria medição de 20 min confirma (484 linhas de `host is up` num período em que uma linha a cada 2 s por upstream daria milhares). Então, sem o `compose stop` de `borda.int.test.ts:532`, o controle vira vermelho falso. O comentário de :557 já diz isso, mas está do lado errado da distância: quem reescrever o caso vai ler :532, não :557. O risco real não é o vermelho falso — é alguém "consertar" esse vermelho apagando o controle e restaurando a vacuidade que a rodada 2 fechou.

**Q3 — há uma quarta forma no diff?** Há, e é o resíduo direto da Rec 1. O controle positivo controla o bloco **`log sonda`**; as três negativas que ele guarda são sobre o bloco **`log default`**. São blocos independentes. Um único edit — `log default { output stderr }` para `output file` ou `output discard` — deixa :560 verde (a sonda não foi tocada) e faz :561, :567 e :571 passarem **vazias**. E não há guarda: `grep -n "output" tools/ci/borda.test.ts` não retorna nada, e o regex de :90-92 usa `[^}]*`, que atravessa a linha do `output` sem afirmá-la. É exatamente a mesma forma das três que você já levou ao `/retro`: asserção negativa cuja entrada pode ser esvaziada por um edit que nenhum teste vê.

Uma quinta, mais fraca, no mesmo diff: `tools/ci/borda.test.ts:96` não consegue falhar pela mutação que o comentário de :93-95 nomeia. Trocar `admin.api` por `admin` no `exclude` já reprova em :91, porque aquele regex fixa a lista exata terminando em `admin\.api\n`, e o arquivo tem um `exclude` só. :96 só falha sozinho se surgir um segundo bloco `log` com `admin` cru. Não é vácuo, mas é guarda cujo modo de falha independente é mais estreito do que o comentário sugere — a mesma família.

```
Recomendações:
  - infra/Caddyfile / tools/ci/borda.test.ts:90-92 — fechar a quarta forma com uma linha de
    texto, sem tocar na API de administração: afirmar `output stderr` dentro do bloco
    `log default` (hoje o `[^}]*` passa por cima dele). É o que impede que um edit só do
    `output` esvazie :561, :567 e :571.
  - tools/ci/compose.int.test.ts:135-136 — a frase afirma mais do que os guardas entregam:
    `borda.int.test.ts:560` e `:603` pegam `output stderr` → `output file` apenas no bloco
    `log sonda`. Trocar só o `output` do `log default` passa pelos dois. A afirmação é
    pré-existente (vinha do `:586`), mas este diff a ampliou ao acrescentar `:560`. Ou
    estreitar a redação, ou aplicar a recomendação acima e então a frase fica verdadeira.
  - infra/test/borda.int.test.ts:532 — pôr no `compose stop` uma referência de volta ao
    controle positivo de :560 ("o controle positivo depende desta parada"). O comentário de
    :557 explica a dependência para quem lê a asserção, não para quem reescreve o caso.
  - tools/ci/compose.int.test.ts:136 — `:603` é o predicado; a asserção é o `expect.poll` de
    `:605`. Apontar para `:605` envelhece melhor.
  - tools/ci/borda.test.ts:96 — mantenha pela mensagem de falha, mas o comentário de :93-95
    promete cobertura que :90-92 já dá. Vale uma palavra dizendo que é guarda de um segundo
    bloco `log`, não da troca do token.
  - Continuam valendo, inócuas, as duas imprecisões do `\badmin\b(?!\.api)` já registradas
    nas rodadas 1 e 2 (`admin.identity` reprovaria; `admin.apis` escapa do lookahead).
```

**Estado verificado:** árvore intacta (os mesmos cinco modificados e o documento novo); sem `.skip`, teste comentado ou `any` nos três arquivos de teste; nenhuma asserção do diff depende de provedor pago. Pode seguir para `infra-guardian` e `privacy-guardian` em paralelo.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## test-engineer · 4ª rodada · APROVADO · 2026-09-22 03:21:09 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

Audited round 4: the diff (5 files), the guards it touches, the four-forms table in the document, and I re-measured the mutations myself with disposable `caddy:2.11.4-alpine` containers and copies in `/tmp` (tree untouched; containers removed; `git status` identical to the prompt).

```
VEREDITO: APROVADO

Cenários exigidos (rodada 4 — só o que o diff mudou; correção de configuração de borda, sem
dado de escola, endpoint ou papel: o que se aplica é regra 20 item 9, na forma do log, e
regra 80 item 10, no diagnóstico):
  - Q3 rodada 3: fechar a quarta forma — um edit só no `output` do `log default` esvazia as
    três negativas de `borda.int.test.ts` com tudo verde
  - Rec: referência de `compose.int.test.ts` estreitada para o que cada guarda de fato pega
  - Rec: `:603` → `:605`
  - Rec: aviso no `compose stop` de que o controle positivo depende daquela parada
  - Rec: comentário de `borda.test.ts:96` dizendo que guarda um segundo bloco `log`

Cobertos:
  - Quarta forma — tools/ci/borda.test.ts:103 e :104. Medi as duas pontas, sozinho, sem usar a
    sua tabela: `output file /tmp/x.log` no `log default` → vermelho **só** em "default output
    stderr"; `output discard` no `log sonda` → vermelho **só** em "sonda output stderr". 1 de 7
    cada, e são independentes — nenhuma das duas cobre a outra, que era o ponto.
  - Referência estreitada — tools/ci/compose.int.test.ts:135-138. A redação agora diz o que
    cada guarda pega (os números estão errados; ver recomendação 1).
  - Aviso da parada — infra/test/borda.int.test.ts:533-536. No lugar certo (imediatamente
    acima do `compose stop` de :537, que é o que quem reescreve o caso lê) e diz a coisa certa:
    o conserto de um vermelho ali é reproduzir a parada, não apagar o controle.
  - Comentário do segundo bloco — tools/ci/borda.test.ts:95-96. Correto e verificável.

Bloqueantes: nenhum.
```

**Q2 — existe uma quinta? Sim na letra do padrão, e medi. Mas ela não derruba a regra, e é aqui que o retorno vira marginal.**

As duas diretivas que sobraram sem guarda dentro do `log default` são `format` e `level`. Medido com 3 `wget` em `:2019/config/` por container:

| mutação só no `log default` | 7 casos de texto | `received request` no log | `"logger":"admin.api` (int:566/572) | chaves `uri\|remote_ip\|headers` (int:576) |
|---|---|---|---|---|
| `format console` | ✅ 7 de 7 | **3 linhas** | 0 — **cega** | 3 — **pega** |
| `level ERROR` | ✅ 7 de 7 | 0 linhas | 0 — vazia | 0 — vazia |

- `format console` é a quinta de verdade: o encoder de console imprime o logger como campo solto (`INFO⇥admin.api⇥received request`), então as duas negativas por **nome** ficam cegas com três linhas ofensivas dentro do log. O que salva é a negativa por **forma**: o console mantém os campos em JSON (`"uri": "/config/"`, `"remote_ip": "127.0.0.1"`, `"headers": {...}`), e o regex de `borda.int.test.ts:576` casa. Ou seja: a escolha que exigi na rodada 1 — afirmar a forma, não o nome — é o que impede esta quinta de virar furo. Vale registrar isso no `/retro`: foi a única asserção que sobreviveu a todas as cinco formas.
- `level ERROR` esvazia as três, mas **não esconde nada**: medi o cenário do bump (token do `exclude` não casando com o logger real) com `level ERROR` e o `received request` não chega ao log — a linha deixa de existir, em vez de existir e passar despercebida. É perda de sensibilidade, não vazamento.

Então, com franqueza: **estamos no ponto de retorno marginal para caçar diretiva por diretiva.** A família é aberta por construção — cada diretiva do bloco é um jeito de mudar a entrada das negativas, e a próxima versão do Caddy pode acrescentar outra. O que fecha a classe inteira em uma linha, em vez de uma por rodada, é **fixar os dois blocos `log` por inteiro** (asserção do texto exato esperado do `log default` e do `log sonda`), no lugar de um regex por diretiva: pega `output`, `format`, `level`, `exclude` e o que vier, e a mensagem de falha mostra o que mudou. Se você aplicar isso, as três asserções de diretiva do bloco viram uma. Recomendação, não bloqueante — a regra 20 item 9 está provada hoje, nas duas pontas, contra as mutações que de fato vazam.

**Q3 — a tabela arredondou, em três pontos.**

1. **Falta um membro da família, e é o mais puro.** A rodada 1 recomendou *não* pôr a asserção no caso da borda descartável (`subirBordaDescartavel`, `docker run` sem healthcheck: ninguém bate em `:2019`, a negativa passaria vazia **inclusive antes da correção**). Isso é exatamente "negativa cuja entrada é vazia", e é anterior às quatro listadas. Numa tabela que se propõe a catalogar o padrão, a ausência dele enfraquece o caso.
2. **A linha 4 não é o mesmo padrão.** Nada esvazia a entrada de `\badmin\b(?!\.api)`; ela é uma **guarda cujo modo de falha independente é mais estreito do que o comentário prometia**. Enfiá-la na tabela faz o número quatro, mas dilui o nome do padrão que vai para o `/retro`. Sugiro "quatro achados, três da mesma família", ou uma linha à parte.
3. **A narrativa da linha 89-91 não bate com as rodadas.** As formas 3 e 4 saíram na **mesma** rodada (a 3), as duas achadas pelo `test-engineer` — então "as três primeiras" e "sempre depois de eu consertar a anterior" não valem para a linha 4: a asserção `\badmin\b(?!\.api)` existe desde a rodada 1 e não apareceu depois de eu consertar a forma 3.

Recomendações:
  1. `tools/ci/compose.int.test.ts:135-138` — a redação foi estreitada, mas **as âncoras estão erradas**: `borda.test.ts:97` é a guarda do `admin` cru, não o `include http.handlers.reverse_proxy.health_checker` (que é `:105`); `borda.test.ts:98-99` são linhas de comentário, as asserções dos dois `output` são `:103-104`; `borda.int.test.ts:560` é comentário (a asserção é `:565`); e `:605` ficou obsoleto **pelo próprio diff desta rodada** — as 5 linhas novas de :533-536 empurraram o `expect.poll` para `:610`. É a terceira rodada seguida com referência velha. Troque número de linha por âncora estável (título do `it` ou o texto do regex citado); linha nova nesse arquivo invalida a referência toda vez.
  2. `tasks/correcoes/2026-09-22-...md:161-167` — a tabela "vermelho antes, verde depois" não ganhou linha para as duas asserções novas. A medição existe (você a pôs no prompt, e eu a reproduzi: 1 de 7 em cada ponta); o lugar dela é o documento, que é o que sobrevive à conversa.
  3. `tools/ci/borda.test.ts:103-104` — os regexes fixam `\n\t\t`. Reformatar o `Caddyfile` para espaços deixa os dois vermelhos com mensagem que não explica o motivo. `[ \t]+` custa nada. (Se aplicar a fixação do bloco inteiro da Q2, isso se resolve junto.)
  4. Continuam valendo, inócuas, as duas imprecisões já registradas nas rodadas 1-3 (`admin.identity` reprovaria; `admin.apis` escapa do lookahead), porque a positiva fixa a lista exata.

**Estado verificado:** `.processo/portao.json` com `inicio` 2026-09-22T05:47:47.087Z e as quatro suítes (`typecheck`, `lint`, `test`, `infra`), igual ao informado; sem `.skip`, teste comentado ou `any` nos três arquivos de teste; nenhuma asserção do diff chama provedor pago; árvore intacta (os mesmos cinco modificados e o documento novo), nada editado por mim. Pode seguir para `infra-guardian` e `privacy-guardian` em paralelo.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.

## test-engineer · 5ª rodada · APROVADO · 2026-09-22 03:53:22 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

Auditei só a rodada 5 (diff no working tree) e reproduzi as mutações em memória, sem tocar em arquivo.

**O que conferi de fato**

Simulei as três asserções novas de `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts:100-125` contra o `Caddyfile` mutado (script em `/tmp/sim.mjs`, nada escrito na árvore). As seis mutações da sua tabela batem: `exclude` sem `admin.api`, `output file` no `default`, `output discard` na `sonda`, `format console`, `level ERROR` e terceiro bloco com tabulação — **todas vermelhas**; o arquivo como está, verde. Acrescentei quatro mutações que você não mediu:

| mutação | resultado |
|---|---|
| diretiva comentada (`# format json`) | ❌ vermelho — responde a Q2 |
| comentário inline (`output stderr # ruído`) | ❌ vermelho (falso vermelho, direção segura) |
| arquivo inteiro reformatado com espaços | ❌ vermelho (lista de blocos vem `[]`) |
| **terceiro bloco `log extra` indentado com espaços** | ✅ **verde** — único furo |
| `exclude` com os mesmos tokens reordenados | ❌ vermelho (falso vermelho; o Caddy não liga para a ordem) |

Rec 1 confirmada: `grep` em `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.int.test.ts` não deixou nenhuma referência `arquivo:linha` (só restam carimbos de hora nas linhas 216-217), e os dois títulos citados existem literalmente — `tools/ci/borda.test.ts:100` e `infra/test/borda.int.test.ts:517`. Rec 2/Q3 do doc também: cinco formas com a de número 0 (linha 84), `\badmin\b(?!\.api)` fora da tabela, e "a 3 e a 4 saíram na mesma rodada" (linha 92).

**Respostas diretas**

1. Não sobrou bloqueante.
2. **Q2 — o filtro de comentário não abre porta.** Comentar uma diretiva a *remove* do array extraído e o `toEqual` fica vermelho (medido). E nenhuma diretiva do Caddy pode começar com `#` em início de linha, que é a única coisa que o filtro descarta. Sua suposição está certa, e agora medida.
3. **Q3 — a tabulação literal importa em uma direção só, e é a estreita.** Reformatação geral do arquivo dá vermelho barulhento (bom). O furo real é misto: um terceiro `log extra { output stderr; format json }` indentado com espaços passa verde nessa asserção, e um logger sem filtro reativa tudo que os dois de cima desligam. Não é bloqueante porque as negativas de resultado em `infra/test/borda.int.test.ts:571-576` pegam esse caso (o bloco extra despeja `"logger":"admin.api"` e `uri`/`remote_ip`/`headers` no `docker logs`) — o furo só sobrevive se o terceiro bloco usar `output file`, que é ruído zero e violação de forma apenas. Não existe `.editorconfig` nem `caddy fmt` no repositório para fechar isso por fora, então vale a recomendação.

```
VEREDITO: APROVADO

Cenários exigidos (rodada 5): fechar a classe "edit que esvazia a negativa" no bloco `log`
inteiro, em vez de uma diretiva por rodada · `exclude` sem `admin.api` · `output` trocado nos
dois blocos · `format` trocado · `level` acrescentado · bloco `log` a mais · logger `admin`
(sem `.api`) continua fora da exclusão · controle positivo contra vacuidade preservado ·
referências que não envelheçam no diff seguinte.

Cobertos: todos. `tools/ci/borda.test.ts:113-124` fixa os dois blocos por inteiro e a lista de
blocos — as seis mutações da tabela reproduzidas vermelhas aqui, mais "diretiva comentada". O
"logger `admin` continua fora" deixou de ser asserção própria e passou a ser garantido pela
igualdade exata do `exclude` (trocar `admin.api` por `admin`, ou somar ` admin`, quebra o
`toEqual`) — cobertura mais forte que o lookahead que havia antes.
`infra/test/borda.int.test.ts:564-576` mantém o controle positivo antes das três negativas, e
`:532-536` protege a parada de upstream de que ele depende. Sem `.skip`, sem teste comentado,
sem mock; nada de IA nem de concorrência neste escopo.

Bloqueantes: nenhum.

Recomendações:
1. `tools/ci/borda.test.ts:124` — `/^\tlog (\S+) \{$/gm` com tabulação literal deixa passar
   verde um terceiro bloco indentado com espaços (medido). Use `^[ \t]+log (\S+) \{$`, por
   coerência com `diretivasDoBloco`, que a rec 3 já tornou tolerante. Não bloqueia porque as
   negativas de resultado em `infra/test/borda.int.test.ts:571-576` cobrem o caso que produz
   ruído; o `[ \t]+` fecha também o terceiro bloco com `output file`.
2. `tools/ci/borda.test.ts:29` — comentário no fim da linha (`output stderr # x`) e reordenar
   os tokens do `exclude` dão falso vermelho, embora o Caddy não ligue para nenhum dos dois.
   Direção segura, então é opcional: se quiser, tire o trecho `\s+#.*$` antes do `trim()` e
   compare o `exclude` por conjunto de tokens.
3. `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md:57-59` e
   `:131-133` ainda descrevem "a segunda asserção" sobre o logger `admin` como asserção
   separada; ela virou consequência do bloco fixado. Ajuste o texto para o /validar não
   procurar uma asserção que não existe mais.
4. Vale registrar no `/retro` o achado que você já isolou no doc: em guarda de arquivo de
   configuração, fixar o bloco inteiro custa menos que uma regex por diretiva e fecha a
   família; e negativa por **forma** do dado vence negativa por **nome** de quem o produz.
```

Segue para `infra-guardian` e `privacy-guardian`.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-22 04:25:32 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy (borda e despejo de log da esteira)
Rate limit: não se aplica (nada de login, semáforo ou balde tocado)
Fila e prioridade: ok (não tocada)
Concorrência: protegida (nenhuma operação nova; a única corrida na área é ambiental, item 5 abaixo)
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhum alerta de `infra/grafana/alertas/` lê log da borda; nenhuma métrica muda)
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/compose.ts:43-46` — o docstring afirma que os cinco logs de terceiro truncados "somam 149.322 linhas". Com a borda em ~4.685, o número passa a ~115.220. Corrigir junto do redimensionamento do `--tail`, com medição nova, não de cabeça.
- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts:124` — o contador de blocos usa `^[ \t]+log (\S+) \{$`, com `+`. Medi contra uma cópia em `/tmp`: um `log acesso { output stderr }` escrito **na coluna 0 dentro do bloco `:8080 {`** passa verde nas três asserções (o `not.toMatch(/^\s*log\s*\{/m)` não pega porque é nomeado). `^[ \t]*` fecha. Não é bloqueante porque a negativa por forma em `borda.int.test.ts:576` pega o resultado desse edit; é profundidade, não furo de regra.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts:519` — a janela `--since` começa 1 s antes do caso, então nenhuma asserção de resultado prova que o logger pai `admin` sobreviveu (o `admin endpoint started` é do boot, fora da janela). O guarda de texto cobre o edit (medi: trocar `admin.api` por `admin` e somar ` admin` ao `exclude` ficam vermelhos), mas a preservação do pai hoje só tem prova em medição manual registrada no documento.
- `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/metricas.int.test.ts:89` tem o mesmo `up --detach --force-recreate --wait observabilidade` de `alertas.int.test.ts:81`. A correção do item 5 precisa cobrir os dois, de preferência por um helper em `tools/testes/compose.ts`, senão o vermelho migra de arquivo.
- `/home/joaquimdp/Documentos/git/Educa.ia/docs/runbook.md:276` — pré-existente, fora deste diff, e vale registrar: o passo manda "olhe a borda (`docker compose logs --since 10m borda`)" para descobrir de onde vem a varredura de endereço de escola. O log da borda não tem, e por desenho não pode ter, IP nem URL de requisição (regra 20, item 9). É beco sem saída para quem opera. O conserto é reescrever o passo, nunca religar log de requisição.

Respostas, na ordem pedida:

1. **Não exijo o redimensionamento do `--tail` aqui, e não mexer nele está certo.** O piso dos 4.000 nunca foi justificado pela borda: ele vem do maior log **nosso** (`api-2`, 3.899 linhas), e isso não mudou — `tools/ci/compose.ts:48` e os guardas de argv (`compose.test.ts`, `scripts.test.ts`) seguem válidos, nada regride. O que a correção faz é melhorar o que cabe na janela, sem tocar a régua. Redimensionar agora exigiria medição nova de 20 min dos três que continuam grandes (`postgres` 50.970, `redis-fila` 35.886, `redis-cache` 15.705) e misturaria isso com o "vermelho antes" desta correção. Exijo, sim, que a correção do tail seja aberta com o número de `compose.ts:43-46` recontado, e não estimado por subtração.

2. **Não vejo perda de operação.** O que sai é só o log de requisição de loopback: a API de administração continua ligada (`infra/Caddyfile:6`) e o healthcheck continua em `/config/` (`infra/compose.yml:400`). Nenhum runbook, alerta, script ou teste lê `received request` (procurei em `tools`, `infra`, `docs`, `.github`). Uma ressalva para o staging, não para agora: se algum dia a borda for recarregada pela API (`POST /load`), o resultado dessa recarga também sai sob o logger `admin.api` e ficaria silencioso. Hoje não existe esse caminho — `persist_config off`, configuração vinda de arquivo, nenhum `caddy reload` no repositório. Quando o staging ganhar recarga por API, esta exclusão volta à mesa.

3. **Proporcional.** O guarda não impede log de acesso no staging; ele obriga quem for ligar a editar o teste, dizendo em qual bloco e por quê — falha alto, não em silêncio, que é exatamente o oposto da classe de cinco edits que esta correção perseguiu. E ligar log de acesso na borda não é uma liberdade que exista: bate no item 9 da regra 20. A nota no documento basta. Medi as mutações da tabela contra uma cópia e todas ficam vermelhas, incluindo `level`, `format`, terceiro bloco indentado com espaços e o `admin` no lugar do `admin.api`; a única sobrevivente é a da coluna 0, na recomendação acima.

4. **Confirmado.** O diff são cinco arquivos: `infra/Caddyfile` (uma linha de `exclude` mais comentário), dois testes, um comentário em `tools/ci/compose.int.test.ts` e o registro do hook em `achados-revisoes.md`. Nada de fila, prioridade, concorrência por escola, gateway de IA, migration, `deploy.sh`, semáforo de login ou script de carga. `ETAPA_DO_LOG_DA_FALHA` intacta.

5. **Concordo com o diagnóstico.** `alertas.int.test.ts:81` recria a observabilidade enquanto o contêiner anterior — parado pelo `afterAll` de `borda.int.test.ts:259` — ainda pode segurar a publicação de `127.0.0.1:59100` (`infra/teste.env:15`); `up --force-recreate` cria o novo antes de o proxy do antigo liberar a porta. Preferência de conserto, em ordem: (a) tornar a remoção **síncrona** — `rm --force --stop observabilidade` e depois `up --detach --wait` —, que preserva a intenção de estado limpo (é ela que o `--force-recreate` compra: a imagem não tem volume, então `restart` guardaria série e estado de alerta); (b) se o bind ainda competir, uma nova tentativa limitada só em `address already in use`, com espera curta; (c) alternativa mais estrutural, tirar a porta publicada e falar com o Prometheus de dentro da rede do compose. O que **não** aceito como conserto é só remover o `--force-recreate`: devolveria série e estado de alerta de execução anterior, e o ensaio de alertas passaria a depender de sujeira. Aplicar nos dois arquivos, `alertas.int.test.ts:81` e `metricas.int.test.ts:89`.

## privacy-guardian · 1ª rodada · APROVADO · 2026-09-22 04:26:40 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

Audited. I ran the current `infra/Caddyfile` in the real `caddy:2.11.4-alpine` image standalone (with the compose healthcheck attached), exercised it with query strings, cookies, custom User-Agent, an aborted response, a malformed request line, a cleartext HTTP/2 preface, an 80 KB header, and four admin-API calls including a bad `POST /load`, a 404 and a cross-origin request — then dumped all 137 log lines. Container removed afterwards; I changed no file (`git status` unchanged).

```
VEREDITO: APROVADO
Campos pessoais tocados: nenhum campo novo. A mudança retira do log da borda a forma que carregaria
  dado pessoal (uri com query, remote_ip, headers/User-Agent/Cookie de requisição)
Fora da tabela de dados do docs/lgpd.md: nada a acrescentar. O registro de acesso à aplicação (IP,
  data, hora) já está lá (docs/lgpd.md:76, 6 meses, Marco Civil art. 15) e é da aplicação, não da
  borda — a borda já excluía `http.log.access` antes desta correção
Autorização por objeto: não se aplica (camada de rede, sem rota de domínio). A API de administração
  escuta só no loopback do container (infra/Caddyfile:6) e a :2019 não é publicada (infra/compose.yml:387-388)
Logs: limpos. Medido com a imagem e o Caddyfile atuais: 137 linhas, 0 com `admin.api`, 0 com
  `remote_ip|client_ip|headers|uri`, 0 com as sentinelas. Loggers vivos: health_checker.active (124),
  tls, http, http.log, http.auto_https, admin — todos sem dado de requisição
Auditoria: presente onde a regra 20, item 10 exige. Nada do que o item 10 lista passava por esse log
Envio externo: nenhum nesta correção
Seed/fixture: sintético (sentinelas `sentinela-${Date.now()}`, upstreams do compose)
Bloqueantes: nenhum
Recomendações: 5, abaixo
```

**1. Fecha o furo de verdade, ou só o caso visível?** Fecha a classe, com uma sobra que só acorda no staging. Hoje as quatro famílias de logger de requisição do Caddy estão cobertas: `http.log.access*` e `http.log.error` (e nem há diretiva `log` dentro de `:8080`, então nem existem), `http.handlers.reverse_proxy` — com a sonda reabrindo só `.health_checker`, que emite `host`, `status_code` e `error` de upstream (`api-1:3000`), endereço de serviço e não de pessoa — e agora `admin.api`, inclusive os filhos por prefixo: o `POST /load` malformado, o 404 e a requisição cross-origin ao `:2019` não produziram uma linha. A sobra é o `http.stdlib`, onde o Caddy pendura o `ErrorLog` do servidor Go: ele não está no `exclude`, e a mensagem dele leva o endereço do cliente **dentro do `msg`** ("http: TLS handshake error from <ip>:<porta>"), livre de qualquer chave — não é pega nem pelas negativas por nome nem pela negativa por forma. Em cleartext HTTP/1 ele não disparou em nenhum dos meus casos (medido, inclusive com preface h2 e cabeçalho de 80 KB), então não é bloqueante. Ele vira real quando o staging ligar HTTPS e h2 — e ali o log do Docker vai para o Alloy e o Grafana Cloud (`tasks/prd-fundacao-tecnica/notas-staging.md:55`), o que transforma uma linha dessas em dado retido e pesquisável. Vai como recomendação com destino marcado.

**2. A negativa por forma é a certa?** Sim, e é a escolha que eu exigiria se não estivesse lá: o nome do logger é um dado do fornecedor, a chave é a forma do dado que o item 9 proíbe. Para query, cookie e corpo o Caddy não tem chave própria — query vive dentro de `uri`, cookie dentro de `headers`, e corpo ele não loga —, então as quatro cobrem as três. Duas chaves que a sua lista não pega e que valem anotar para quando o log de acesso voltar: `user_id` (o access log do Caddy emite, vindo de basicauth) e `resp_headers` — a âncora `"(...)":` não casa `"resp_headers":`, porque o grupo tem de começar logo depois da aspa. Nenhuma das duas aparece hoje, e nenhuma aparece sem `uri` ou `headers` na mesma linha, então ficam pegas por arrasto. Recomendação, não bloqueante.

**3. O que se perde de auditoria (item 10).** Nada que a regra 20 exija. O item 10 tem lista fechada — leitura de dado de aluno por coordenação ou rede, indicador nominal de professor, exportação, alteração de nota, alteração de permissão, aprovação de saída de IA — e acesso à configuração da borda não é nenhuma delas. E o que você tirou não era auditoria em nenhum sentido: sem autor, sem finalidade, sem consulta, era `Wget` do próprio container a cada 2 s. O registro do Marco Civil, art. 15 é outro artefato, já na tabela de dados com retenção própria e expurgo (`docs/lgpd.md:76`), e é da aplicação: a borda nunca o produziu, porque `http.log.access` já estava excluído antes desta correção. O único cenário em que eu quereria rastro na API de administração é **chamada que muda configuração** — e ali o rastro é o git, porque `persist_config off` e o bind mount `:ro` fazem toda mudança passar pelo `Caddyfile` versionado.

**4. O guarda do bloco inteiro no staging: ajuda.** É exatamente o momento em que um log de acesso de verdade voltaria por dentro de um bloco `log`, junto de HTTPS e de cinco outras mudanças, e o guarda obriga esse retorno a ser um edit explícito da lista esperada, com a mensagem de falha mostrando qual diretiva mudou. O custo é uma linha de teste por mudança legítima — barato demais para chamar de estorvo, e a rodada 1 desta correção mostrou o preço de não ter isso. O pedido que faço para lá: quando o log de acesso voltar, a negativa por forma **se converte**, não se apaga — vira asserção positiva sobre quais campos aquele log guarda (sem `uri` com query, sem `headers`), senão a família de armadilhas que você fechou em cinco rodadas reabre inteira.

**5. A linha de exemplo no repositório público.** Confirmado que o repositório é `LitzGab/Turmma.ai` e está `PUBLIC`, e confirmado que a linha não é exposição: `127.0.0.1` é o loopback do próprio container, não há titular por trás; `Wget` é o User-Agent do healthcheck; `/config/` e a porta 2019 são o padrão documentado do Caddy e já estão no `infra/compose.yml:400`, público desde antes. Nada ali identifica pessoa, escola ou ambiente. (À parte: o `CLAUDE.md` ainda aponta o repositório como `LitzGab/Educa.ia` — vale alinhar.)

**Recomendações registradas para o `/validar` e o `/retro`**
1. `infra/Caddyfile:18` — acrescentar `http.stdlib` ao `exclude` na mesma tarefa que ligar HTTPS no staging: é o único caminho restante em que endereço de cliente chega ao log da borda, e ele chega dentro do `msg`, cego às negativas atuais.
2. `infra/test/borda.int.test.ts:578` — quando um log de acesso voltar, somar `user_id` e `resp_headers` à negativa por forma (a âncora atual não pega `resp_headers`).
3. `tools/ci/borda.test.ts:100` — no staging, converter a negativa por forma em asserção positiva sobre os campos mantidos, em vez de removê-la.
4. `tasks/prd-fundacao-tecnica/notas-staging.md` — registrar que, se a API de administração continuar ligada no staging, o rastro de mudança de configuração fica no git (`persist_config off` + bind mount `:ro`) e não se resolve religando o log de requisição.
5. `CLAUDE.md` — o link do repositório aponta para `LitzGab/Educa.ia`; o remoto é `LitzGab/Turmma.ai` (público).

## test-engineer · 6ª rodada · APROVADO · 2026-09-22 04:59:18 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

Auditei o delta desde a rodada 5 e medi as três perguntas em vez de raciocinar sobre elas. Árvore intacta (só leitura; os experimentos rodaram em `/tmp` e em contêiner descartável, já removidos).

```
VEREDITO: APROVADO
```

**Cenários exigidos** (os da rodada 5, mais o que o `infra-guardian` abriu): o `admin.api` some do log sem levar o `admin` junto · a sonda continua escrevendo · nenhuma linha da borda com URL, IP ou cabeçalho, por nome **e** por forma · negativa não pode passar vazia · nenhum edit de bloco `log` (diretiva, ordem, quantidade, indentação) reabre o log sem guarda vermelho.

**Cobertos:** `tools/ci/borda.test.ts:113-128` (os dois blocos inteiros + contagem) e `infra/test/borda.int.test.ts:557-576` (resultado no `docker logs`, com controle positivo em `:565` antes das três negativas).

**Bloqueantes:** nenhum.

---

**1. Sobrou bloqueante?** Não. Pode revalidar os dois guardiões e commitar.

**2. O `*` abriu vermelho falso?** Não — medido contra nove variantes do arquivo:

| Variante | `+` | `*` |
|---|---|---|
| como está | verde | **verde** |
| terceiro bloco na coluna 0 | verde (o furo) | **vermelho** |
| arquivo todo reformatado com 4 espaços | verde | **verde** |
| arquivo em CRLF | verde | **verde** (o `$` do JS casa antes do `\r`) |
| `output file` com bloco aninhado no `default` | vermelho | **vermelho** |

O `*` só afrouxa a âncora à esquerda; no arquivo atual continuam existindo exatamente duas ocorrências. Nenhum vermelho falso.

**Duas recomendações que a medição levantou, nenhuma bloqueante** (o guarda de resultado pega as duas):

- `tools/ci/borda.test.ts:128` — a contagem exige **um espaço literal** entre `log` e o nome. `log␣␣acesso {` (dois espaços) e `log\tacesso {` (tabulação) são Caddyfile válido e passam **verdes** nas três asserções. Medi o de dois espaços até o fim: `caddy adapt` gera uma terceira entrada em `logging.logs` (`acesso`, com `include: http.log.access.acesso`), e o contêiner de pé emitiu

  `{"logger":"http.log.access.acesso","msg":"handled request","request":{"remote_ip":"172.17.0.1","client_ip":...,"uri":"/saude?nome=sentinela-auditoria","headers":{...}},"user_id":"","resp_headers":{...}}`

  ou seja, `borda.int.test.ts:558` (sentinela), `:566` (nome) e `:576` (forma) ficam vermelhos — a regra segue provada, só o guarda rápido é cego. Conserto de um caractere quando alguém voltar aqui: `^[ \t]*log\s+(\S+)\s*\{$`.
- Vale registrar no documento um falso furo que perseguiu e **não** é furo: a diretiva `log` **nua** dentro de `:8080 {` (que em geral liga o access log) não reabre nada aqui — `caddy adapt` devolve `servers.srv0.logs = {}` e o `default.exclude` já lista `http.log.access`, então nenhum sink a inclui. Medido. Sem isso, o próximo leitor vai "consertar" um buraco que não existe.

**3. Há algo estruturalmente melhor que afirmar texto de arquivo de configuração?** Há, e é mais barato do que subir o Caddy: **`caddy adapt`**. Rodei contra o arquivo atual e ele devolve a configuração efetiva, já normalizada:

```
logging.logs = {"default":{"writer":{"output":"stderr"},"encoder":{"format":"json"},
  "exclude":["admin.api","http.handlers.reverse_proxy","http.handlers.reverse_proxy.health_checker",
             "http.log.access","http.log.error"]},
 "sonda":{"writer":{"output":"stderr"},"encoder":{"format":"json"},
  "include":["http.handlers.reverse_proxy.health_checker"]}}
```

Um `toEqual` nesse objeto seria imune à **família inteira de formatação** — espaço, tabulação, coluna 0, CRLF, bloco aninhado, ordem, e a entrada gerada por diretiva de site que nenhum regex de `log X {` enxerga (foi assim que o `acesso` apareceu). Repare que ele inclusive mostra o `health_checker` que o **Caddy** acrescentou sozinho ao `exclude`, coisa que o texto do arquivo não diz.

Três ressalvas honestas, que mudam onde isso entra:

- `caddy adapt` **não valida token de logger**: `admin.apiX.nao.existe` adapta limpo. Então ele substituiria o guarda de **texto**, nunca o de **resultado**. O teto desta correção não é "perguntar ao Caddy qual configuração carregou" — é o que `borda.int.test.ts:576` já faz, porque só o log real prova que o token existe.
- Custa o binário do Caddy, então não cabe em `npm run test` (regra 00, item 8): o lugar é `test:infra`, como `docker compose exec borda caddy adapt --config /etc/caddy/Caddyfile` — ou `GET 127.0.0.1:2019/config/` pelo loopback, que responde literalmente "qual configuração carregou" e que, agora que `admin.api` está excluído, não suja mais o log ao ser chamado.
- Perde a velocidade e a localização do erro: hoje o vermelho do guarda de texto aparece em segundos e aponta a diretiva. Trocar cedo demais empurra tudo para os 16 min do `test:infra`.

Minha leitura: o guarda de texto atual está no ponto certo de retorno — o que ele deixa passar, o de resultado pega, e isso está medido. A troca por `adapt` é o próximo passo natural **quando alguém abrir este arquivo de novo** (a tarefa do `http.stdlib`/HTTPS no staging é a candidata óbvia, porque lá o `exclude` volta a mudar), não uma oitava rodada agora.

**Recomendações:** (a) `\s+` no lugar do espaço literal em `tools/ci/borda.test.ts:128`; (b) registrar no documento o falso furo da diretiva `log` nua, com a evidência do `adapt`; (c) anotar no `TODO.md`, junto do item do `http.stdlib`, que o guarda de texto de `tools/ci/borda.test.ts` deve virar `toEqual` sobre `logging.logs` do `caddy adapt` na tarefa que ligar HTTPS no staging.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/Caddyfile`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-22 05:01:18 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

Delta auditado: `tools/ci/borda.test.ts` (regex de contagem `^[ \t]+` → `^[ \t]*`), três entradas no `TODO.md`, comentários em `infra/test/borda.int.test.ts` e `tools/ci/compose.int.test.ts`. `infra/Caddyfile` inalterado desde a rodada aprovada.

Conferi por medição própria, sem tocar na árvore:

- `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts:126` — rodei o regex novo contra o `Caddyfile` e contra duas mutações. Atual: `['default','sonda']`. `log acesso {` na coluna 0 dentro do `:8080 {`: `['default','sonda','acesso']` (pegado, era o furo). `log acesso {` indentado com espaços: pegado. O furo que apontei está fechado, e o `not.toMatch(/^\s*log\s*\{/m)` continua cobrindo o bloco sem nome, que a contagem por `(\S+)` não alcança — os dois se complementam, sem vão.
- `npx vitest run tools/ci/borda.test.ts`: 7 de 7 verdes.
- `diretivasDoBloco('default')` devolve as três diretivas na ordem, e com `admin.apiX` somado ao `exclude` o array muda — a igualdade exata quebra.
- As três exigências de registro estão no `TODO.md:54-77`, com o teor que pedi: runbook:276 com a proibição explícita de religar log de requisição; corrida de porta nos **dois** arquivos com a ressalva sobre o `--force-recreate`; recontagem do 149.322 em execução real.
- `tools/ci/compose.ts:43` continua com o número velho, mas o `--tail 4000` deriva da `api-2` (3.899), que não mudou — nada regride, e a recontagem está registrada.

```
VEREDITO: APROVADO
Caminho quente tocado: deploy
Rate limit: não se aplica (nenhum limite tocado neste diff)
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
  - tools/ci/compose.ts:43 — o 149.322 do docstring ficou velho neste commit e só é recontado
    na tarefa do `--tail`. Está no TODO.md:74; até lá, quem ler o docstring lê número que não
    vale mais. Não bloqueia porque a régua (4.000) vem da `api-2`, não da borda.
  - docs/runbook.md:276 continua impossível de seguir depois deste commit. Registrado em
    TODO.md:54, e o defeito é anterior a esta correção — o log da borda já não tinha `uri`
    nem IP antes dela.
  - infra/test/alertas.int.test.ts:81 e infra/test/metricas.int.test.ts:89: a corrida de porta
    segue de pé e vai continuar produzindo vermelho intermitente no portão até a tarefa sair.
    Registrada em TODO.md:63.
  - Quando a tarefa de HTTPS no staging abrir, `http.stdlib` no `exclude` e o guarda de texto
    virando `toEqual` sobre `logging.logs` do `caddy adapt` — já escrito na seção "O que fica
    para o staging" do documento da correção.
```

Pode commitar.

## privacy-guardian · 2ª rodada · APROVADO · 2026-09-22 05:01:45 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

Auditei o delta desde meu APROVADO (rodada 1), não do zero: o diff de `infra/Caddyfile`, `tools/ci/borda.test.ts`, `infra/test/borda.int.test.ts`, `tools/ci/compose.int.test.ts`, `TODO.md` e o documento da correção.

**O que conferi no delta**

1. **O caractere no guarda de texto.** `/home/joaquimdp/Documentos/git/Educa.ia/tools/ci/borda.test.ts:651` agora é `/^[ \t]*log (\S+) \{$/gm`. A mudança de `+` para `*` só **amplia** o que o guarda enxerga (passa a alcançar bloco na coluna 0); não afrouxa nada e não pode fazer um caso passar verde que antes ficava vermelho. `diretivasDoBloco` (`:605`) usa a mesma âncora, pelo mesmo motivo.
2. **As asserções de privacidade estão intactas**, palavra por palavra, em `/home/joaquimdp/Documentos/git/Educa.ia/infra/test/borda.int.test.ts`: controle positivo (`:565`), negativa por nome dos loggers de requisição (`:566`), negativa do `admin.api` (`:572`) e a negativa **por forma** `/"(remote_ip|client_ip|headers|uri)":/` (`:576`) — que é a única que sobrevive a troca de encoder e a rename de logger, e é a que eu exigi na rodada 1.
3. **Os meus quatro itens estão registrados por escrito**, com o motivo, na seção "O que fica para o staging, e por quê" (`tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md:211-241`): `http.stdlib` amarrado à tarefa que ligar HTTPS, com a razão medida (endereço do cliente dentro do `msg`, cego às duas negativas, e log retido no Alloy/Grafana no staging); a negativa por forma **convertida** em positiva quando o log de acesso voltar, nunca apagada; `user_id` e `resp_headers` na lista desse momento, com a explicação da âncora; e o git como rastro de mudança de configuração da borda. Nada ficou implícito para quem herdar.
4. **Nenhuma superfície de dado pessoal no delta.** Não há migration, campo, DTO, rota, seed nem envio externo. O efeito líquido da correção sobre a regra 20 continua sendo **menos** dado no log, não mais: `admin.api` registrava `uri`, `remote_ip` e `headers` a cada 2 s, e some.

**Sua pergunta 2 — o `log␣␣acesso {` que o guarda rápido não pega**

Não exige conserto aqui, e o item 9 não fica sem prova. O critério que uso para bloquear é "a regra fica sem teste que a prove". Ela não fica: no cenário que o `test-engineer` mediu, o Caddy gera o sink `http.log.access.acesso`, e o log da borda passa a carregar `request.remote_ip`, `client_ip`, `uri` com query, `headers`, `user_id` e `resp_headers` — o que deixa **três** asserções de resultado vermelhas ao mesmo tempo: `:557` (`not.toContain(sentinela)`, porque a query entra no `uri`), `:566` (o logger casa `"logger":"http.log.access`) e `:576` (a forma). Uma delas basta; três é folga.

O guarda de texto é profundidade — ele existe para dar vermelho rápido e mensagem legível, não para ser a última linha. Item 9 exige que o dado não chegue ao log e que exista teste que prove isso; exigir que **todo** guarda pegue toda variação de sintaxe do Caddyfile é perseguir uma família aberta por construção, que é exatamente o erro que esta correção já documentou e fechou pelo lado certo (afirmando o resultado, e a forma do dado em vez do nome de quem o produz). Vai como recomendação, com o conserto de um caractere já escrito.

Sobre o `CLAUDE.md` apontando para `LitzGab/Educa.ia`: concordo que é fora do escopo desta correção e não bloqueia. Está reportado ao usuário, que é o encaminhamento certo.

```
VEREDITO: APROVADO

Campos pessoais tocados: nenhum. O delta é configuração de log da borda, dois arquivos de
  teste, TODO e documento de correção. Sem migration, sem campo, sem DTO, sem rota.
Fora da tabela de dados do docs/lgpd.md: nada — nenhum dado novo é coletado. A correção
  retira do log `uri`, `remote_ip` e `headers` que o `admin.api` emitia a cada 2 s.
Autorização por objeto: não se aplica (nenhum endpoint, papel ou escopo de tenant no delta).
Logs: limpos, e mais limpos que antes. infra/Caddyfile:18 exclui `http.log.access`,
  `http.log.error`, `http.handlers.reverse_proxy` e `admin.api`; a supressão é provada no
  resultado em infra/test/borda.int.test.ts:566, :572 e :576, com controle positivo em :565
  contra asserção vazia.
Auditoria: não se aplica — nenhuma leitura de dado de aluno, exportação, nota ou permissão
  no delta. O rastro de mudança da borda é o git (`persist_config off` + bind mount `:ro`),
  registrado no documento em :233-235.
Envio externo: nenhum. Registrado no documento que o `http.stdlib` vira furo quando o
  staging ligar HTTPS, porque ali o log do Docker sai para Alloy e Grafana Cloud — com a
  exigência de entrar no `exclude` na mesma tarefa que ligar HTTPS (:216-224).
Seed/fixture: sintético. As sentinelas dos testes são strings geradas com `Date.now()`;
  o único endereço que aparece no log é loopback e nome de serviço do compose.
Bloqueantes: nenhum.
Recomendações:
  - tools/ci/borda.test.ts:651 — a contagem de blocos exige um espaço literal entre `log` e
    o nome, então `log␣␣acesso {` e `log\tacesso {` passam verdes no guarda rápido. A regra
    segue provada (três asserções de resultado vermelhas nesse caso), mas o conserto é de um
    caractere quando alguém voltar aqui: `^[ \t]*log\s+(\S+)\s*\{$`. Vale também para o
    `not.toMatch(/^\s*log\s*\{/m)` vizinho, que não vê um `log acesso` sem bloco.
  - Os quatro itens da seção "O que fica para o staging" precisam de dono e tarefa, não só de
    parágrafo: o `http.stdlib` é o único deles com efeito de privacidade real, e ele só
    acontece se a tarefa de HTTPS souber que ele existe. Uma linha no TODO.md amarrando-o à
    tarefa de HTTPS fecha isso (as outras três entradas de TODO desta correção já foram
    escritas assim).
  - CLAUDE.md aponta o repositório para `LitzGab/Educa.ia`. Fora do escopo desta correção,
    sem efeito sobre a regra 20; concordo em deixar para o usuário decidir.
```

Pode commitar, no que me diz respeito.

## infra-guardian · 3ª rodada · APROVADO · 2026-09-22 05:31:19 · `tasks/correcoes/2026-09-22-log-da-borda-afogado-pela-sonda-do-proprio-container.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy
Rate limit: não se aplica (nada de limite tocado nesta rodada)
Fila e prioridade: ok
Concorrência: protegida
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md` (entrada do HTTPS no staging): a linha carrega quatro obrigações distintas num único item — acrescentar `http.stdlib` ao `exclude`, converter a negativa por forma em asserção positiva, somar `user_id` e `resp_headers`, e trocar o guarda de texto por `toEqual` sobre `logging.logs` do `caddy adapt`. Item único vira execução parcial. Quebrar em quatro caixas marcáveis, mantendo a referência ao documento da correção.
- A corrida de porta de `infra/test/alertas.int.test.ts:81` e `infra/test/metricas.int.test.ts:89` continua ativa na esteira enquanto o item do `TODO.md` não for feito; é o vermelho intermitente mais provável da próxima tarefa que rodar `test:infra`. Vale puxá-la antes das entradas de staging.

Verificado nesta rodada:
- Delta confirmado: `git diff --stat` e mtimes batem com o declarado. Únicos arquivos posteriores ao meu veredito são `TODO.md` (05:02), `achados-revisoes.md` (05:01) e o documento da correção (05:30). `infra/Caddyfile` (04:27), `tools/ci/borda.test.ts` (04:27), `infra/test/borda.int.test.ts` (02:47) e `tools/ci/compose.int.test.ts` (03:23) são anteriores e o conteúdo é idêntico ao auditado — o `^[ \t]*` está nas duas pontas (`diretivasDoBloco` e a contagem de blocos), o `admin.api` está no `exclude`, o controle positivo sobre `health_checker` precede as três negativas, e a negativa por forma cobre `remote_ip|client_ip|headers|uri`.
- As três exigências de registro estão em `TODO.md`, com o conteúdo que exigi: beco de `docs/runbook.md:276` com a proibição explícita de religar log de requisição na borda; corrida de porta citando os dois arquivos e a ressalva de que tirar `--force-recreate` não é conserto; recontagem do 149.322 em execução real antes de mexer na régua do `--tail`.
- Carimbo conferido por mim, não só declarado: `node tools/processo/portao-local.ts conferir` responde "portão local válido para o código atual (typecheck, lint, test, infra)", início `2026-09-22T08:02:11.382Z`.
- `auto_https off` segue no `infra/Caddyfile`, o que confirma que `http.stdlib` não dispara hoje e é legitimamente trabalho de staging, não furo aberto agora.

Pode commitar.
