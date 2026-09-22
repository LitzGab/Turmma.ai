# Correção — o log que a esteira despeja na falha não tem carimbo de hora, e não dá para correlacionar

**Origem:** rodada 5 do `/revisar-spec` de `estabilidade-da-esteira`, e as sete falhas intermitentes
de 20 e 21/09/2026 (`tasks/prd-identidade-e-tenancy/retro.md`)
**Subagentes obrigatórios:** `infra-guardian` (esteira e ambiente)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Sete vermelhos intermitentes em dois dias, quatro deles em `infra/test/borda.int.test.ts`, e nenhum
diagnosticado. Para saber **por que** sai um 503 é preciso cruzar duas coisas que acontecem em
serviços diferentes: o instante da requisição que falhou e o instante em que a borda tirou ou
recolocou o upstream no balanceamento.

Hoje o despejo da falha (`tools/ci/compose.ts` e `tools/ci/e2e.ts`) roda
`docker compose logs --no-color --tail 200`. **Sem `--timestamps`**, cada linha vem com o carimbo que
o próprio serviço decidiu imprimir — o Caddy tem `ts` no JSON, o Postgres tem o formato dele, o Redis
o dele — e nenhum deles é comparável com o outro sem tradução. Correlacionar vira adivinhação.

## Causa

`--timestamps` é a única forma de ter carimbo **do lado do Docker**, uniforme, na mesma escala, em
todas as linhas de todos os serviços. Ele não é passado em nenhum dos dois despejos.

**O que NÃO é a causa, e vale registrar porque quase entrou neste documento como fato:** a rodada 5
da revisão afirmou que o job despeja "200 linhas **no total**, para os 19 serviços", e que o
`down --volumes` seguinte destrói a evidência. Conferi as duas:

- `docker compose logs --help` diz, e o teste prático confirma, que `--tail` é **por contêiner**:
  pedir 3 linhas devolveu 3 de `postgres` e 3 de `redis-fila`. Hoje já saem 200 linhas **de cada**
  serviço — o que, medido depois, mostrou-se suficiente para 11 dos 12 serviços nossos, e é por isso
  que o `--tail` **não** era o defeito principal: o carimbo era;
- o `down` roda **depois** do despejo, e o despejo vai para o log do job, que o GitHub retém. Ele não
  apaga nada.

Ou seja: a evidência não está sendo destruída. Ela está sendo gravada **sem a única coisa que a
tornaria cruzável**.

## Teste que reproduz

`tools/ci/compose.test.ts` (novo) › "o despejo da falha carimba a hora e alcança a execução inteira",
sobre `etapasDeEncerramento`, que esta correção extrai de `executarTestesComInfra` para poder ser
afirmada. O caminho de falha dos scripts da esteira não tinha teste nenhum.

Vermelho antes: sem `--timestamps` nos argumentos, a asserção falha. Verde depois.

## Correção

Duas linhas de comportamento, nos dois despejos (`tools/ci/compose.ts` e `tools/ci/e2e.ts`):

1. **`--timestamps`**, que é o conserto;
2. **`--tail 4000` em vez de 200**, por medição — ver a seção seguinte. O piso é o maior log de
   serviço **nosso** numa execução real (`api-2`, 3.899 linhas): em 4.000 o despejo leva o log
   inteiro dos doze serviços cujo código escrevemos. Cinco serviços de terceiro vão truncados de
   propósito.

E a extração de `etapasDeEncerramento` como função exportada, para o caminho de falha passar a ter
teste — hoje ele não tinha.

**Por que isto e não um artefato.** A alternativa discutida era publicar os logs como artefato, no
molde do `traco-do-e2e`. Ficou de fora de propósito: o log do job já é retido pelo GitHub, já é
público do mesmo jeito, e o artefato acrescentaria superfície sem acrescentar informação. O
`infra-guardian` já havia dito, na correção de 21/09, que log de serviço não tem a mesma garantia de
sinteticidade que o traço do Playwright tem por construção — o que é verdade, com a ressalva de que
o log das APIs é guardado por lint (`guardas/log-sem-dado-pessoal`, que não se desliga por
comentário). Publicar menos, e no lugar que já existe, é a decisão conservadora.

## Evidência

**`--tail` é por contêiner, conferido na prática** (era a afirmação que eu quase copiei como fato):

```
$ docker compose ... logs --no-color --tail 3 postgres redis-fila | awk '{print $1}' | sort | uniq -c
      3 postgres-1
      3 redis-fila-1
```

**De onde sai o 4.000: medição, não estimativa.** A primeira versão desta correção dizia "2.000
cobre a execução inteira". Medi, e é falso. Execução de `npm run test:infra` em 21/09/2026, 35 testes
verdes, 20,2 min, contando linha por contêiner (Docker Compose 5.5.1):

| Serviço | Linhas | | Serviço | Linhas |
|---|---:|---|---|---:|
| `postgres` | 50.970 | | `api-2` | **3.899** |
| `borda` | 38.787 | | `api-1` | 187 |
| `redis-fila` | 35.886 | | `realtime-2` | 129 |
| `redis-cache` | 15.705 | | `web` | 60 |
| `storage` | 7.974 | | os outros 10 | ≤ 42 cada |

O que isso derruba e o que sustenta:

| `--tail` | Linhas no log do job | Serviços completos | **Serviços nossos completos** |
|---|---:|---:|---:|
| 200 | 1.768 | 13 de 19 | 11 de 12 |
| 2.000 | 12.568 | 13 de 19 | 11 de 12 |
| **4.000** | **24.467** | 14 de 19 | **12 de 12** |

Ir de 200 para 2.000 **não completa o log de nenhum serviço a mais**: em 200 e em 2.000 os truncados
são os mesmos seis, e o sexto deles é a `api-2`, que é **nossa**. O 2.000 era número chutado e, nos
próprios termos em que eu o justifiquei, inútil.

4.000 é o primeiro valor com um critério atrás: é o que tira a `api-2` da lista e faz caber o log
inteiro de **todo serviço cujo código é nosso**, que é o que se vai ler para diagnosticar. Sobram
**cinco** truncados, todos de terceiro — `postgres`, `borda`, `redis-fila`, `redis-cache` e `storage`
—, somando 149.322 linhas. Neles nenhum `--tail` praticável alcança o começo, e o que serve é o
carimbo, não o começo. `--since` ancorado no início da execução foi considerado e descartado: levaria
essas 149 mil para o log público do job.

(Os outros dois serviços de terceiro, `oidc-falso` e `observabilidade`, saem **completos** já em 200:
são sete de terceiro ao todo, não seis. Contei por `image:` contra `build:` no `config --format json`,
depois de a rodada 6 pegar o erro — que estava escrito neste documento e no comentário de
`tools/ci/compose.ts`.)

**E o nono vermelho, que esta correção achou por acidente e tem causa estabelecida.** No portão
seguinte, `packages/nucleo/src/log/logger.test.ts` › "remove nome de aluno aninhado…" falhou em 11 ms
com `expected '{"level":"info","time":"2026-09-22T01…' not to contain '7.5'`. A redação está
**correta** — todo campo pessoal saiu como `[removido]`. O que contém `7.5` é o **carimbo de hora**:
`"time":"2026-09-22T01:45:37.569Z"`, onde `37.569` casa com a substring.

O teste loga `nota: 7.5` e depois afirma que a linha crua não contém `'7.5'`, sobre uma carga que
inclui o timestamp com milissegundos. Medi a frequência em um milhão de carimbos sorteados: **1,00%
das execuções**, e só o `'7.5'` da lista colide. Ele roda no projeto `unidade`, isto é, em todo portão
e em todo push da esteira.

É defeito próprio e vai em correção própria, não aqui. Mas é o achado mais valioso desta noite por dois
motivos: é a primeira das nove intermitências com **causa estabelecida**, e ela falha *parecendo* que a
redação de dado pessoal quebrou — um vermelho que grita regra 20 sem motivo é o que faz a equipe deixar
de confiar na suíte.

**O oitavo vermelho intermitente aconteceu durante esta correção, e eu apaguei a evidência dele.** No
portão depois da rodada 10, `test:infra` ficou vermelho em 325 s — contra os ~1.200 s de uma execução
completa, ou seja, morreu cedo. Rodado de novo em seguida, sem nenhuma mudança: **35 de 35 verdes,
1.192 s**. Causa não estabelecida, e ela não será: eu havia canalizado a saída do portão por `tail -4`
na minha própria chamada, então o que sobrou foi a linha "portão local vermelho em infra" e nada mais.

Vale registrar sem atenuação, porque é a tese da correção provada contra o autor dela: **o vermelho
intermitente só é diagnosticável se alguém guardar o log inteiro no momento em que ele acontece.** Eu
passei nove rodadas instrumentando o despejo da esteira para isso e perdi o meu próprio caso por cortar
a saída em quatro linhas. A mudança anterior a esse vermelho tinha sido só comentário e texto, o que
torna improvável que ela seja a causa — mas "improvável" não é diagnóstico, e este documento não
registra palpite como causa.

**O limite desta medição, que a rodada 9 apontou e eu não tinha visto.** O piso de 3.899 linhas vem de
uma execução **verde** (35 testes passando). Mas o despejo só roda em execução **vermelha**, e nela o
serviço que falhou costuma escrever mais: erro, tentativa, rastro. Ou seja, o piso foi medido na classe
de execução em que o despejo nunca acontece. O 4.000 continua estritamente melhor que 200 e melhor que
2.000 — isso a tabela sustenta —, mas ele **pode estar subdimensionado para o caso real**, e a forma de
saber é contar numa execução vermelha. Fica registrado como limite conhecido, não como número fechado:
quem revisitar o `--tail` deve medir num vermelho antes de mexer.

**O teto, para o `infra-guardian`:** um job vermelho passa a publicar ~24,5 mil linhas, contra ~1,8
mil hoje. É aceitável porque o dado da esteira é sintético (regra 20, itens 12 e 17) e o log das APIs
é guardado por lint (`guardas/log-sem-dado-pessoal`, que não se desliga por comentário).

**A fresta de configuração do compose.** O `--tail 4000` só entrega 4.000
linhas porque nada limita o log do contêiner: `infra/compose.yml` não declara `logging:` em nenhum dos
19 serviços, e não há `/etc/docker/daemon.json`. Declarar `logging` com **teto**, ou com **driver sem
leitura**, matava a evidência com o argv intacto, **exit 0** e toda a suíte de argv verde — hoje o
guarda o pega, com 1 vermelho. Nem toda declaração de `logging` faz isso, como a tabela mostra:

| Declaração | Efeito no despejo, **medido** |
|---|---|
| `options: {max-size: 100k}` | entrega **menos** que as 3.899 linhas do maior serviço nosso, matando o piso que justifica o 4.000 |
| `driver: none` | entrega **zero** linha, com exit 0 e só um `warning` em stderr: *"configured logging driver does not support reading"* |
| `driver: local` | **entrega tudo** (6.000 de 6.000). Tem teto, mas de 20 MB, que 3.899 linhas não alcançam — não é porta |
| `driver: syslog` | **entrega tudo** (6.000 de 6.000), pelo cache de *dual logging* |
| `gelf`, `fluentd`, `awslogs` | não medidos; a asserção os proíbe do mesmo jeito |

Das quatro declarações medidas, **duas** são porta. E esta tabela **errou três vezes**, sempre por eu medir
metade — vale registrar as três, porque o padrão é mais útil que o resultado:

1. **"os seis drivers entregam zero linha."** Medi com um compose descartável, *três linhas por
   serviço*, e só `none` zerava. Certo até aqui.
2. **"os cinco restantes entregam *menos*."** Mas três linhas escritas não podem revelar truncamento
   nenhum: a medição provava que *entregam*, nunca *quanto*. Erro de origem do revisor, que eu herdei
   sem conferir — revisor e revisado mediram exatamente a mesma metade.
3. **"o `syslog` eu não sei medir sem subir um servidor."** Também errado, e este é o pior: eu
   registrei um `0` como evidência apoiado na hipótese de que o contêiner não subia. A hipótese se
   refuta com **um comando**:

```
$ docker run -d --log-driver syslog --log-opt syslog-address=udp://127.0.0.1:514 alpine  (6000 linhas)
$ docker inspect → status=exited exit=0 erro=[] driver=syslog      ← o contêiner SOBE
$ docker logs    → 6000 linhas                                    ← e entrega tudo
```

O contêiner sobe, sai 0 e entrega as 6.000 — cache de *dual logging*, ligado por padrão desde o Docker
20.10. O `0` que eu havia registrado era artefato do meu arranjo, não comportamento do driver.

O que continua **não medido**, e agora com o nome certo: o teto do cache de dual logging
(`cache-max-size`) e o comportamento de `gelf`, `fluentd` e `awslogs`. Nada disso muda a asserção, que
proíbe `logging` inteiro e cobre os cinco de qualquer forma.

A primeira porta foi achada pela rodada 4. A do `driver: none` pela rodada 5, e ela é **pior**: zero
linha em vez de menos linhas. Pior ainda, ela existia porque eu havia escrito no comentário do teste que "trocar o
driver também apareceria aqui, porque `logging` inteiro tem de estar ausente" — e a asserção era sobre
`logging.options`, não sobre `logging`. Era afirmação minha sem prova, no meio da correção que existe
justamente para não afirmar sem medir. A porta do driver é também a **mais provável** das duas: a
seção acima registra que 88% do log da borda é ruído de healthcheck, e `driver: none` na borda é o que
alguém escreve para calar isso.

**A terceira porta — que existe, mas já está guardada.** Eu havia escrito que a do compose era "o
último caminho": afirmação de exaustividade sem medição, derrubada pela rodada 6. O serviço também
decide **o que escreve**, e o `infra/Caddyfile` já usa esse botão (`output stderr`, e o `include` do
logger `sonda`). Escrevi então que mexer nele passaria "com tudo verde" — e **isso também estava
errado**, agora por herança: a frase veio da recomendação da rodada 6, e a rodada 7 a mediu. As duas
metades já têm guarda:

| Mexida | Quem pega | Onde roda |
|---|---|---|
| tirar o `health_checker` do logger `sonda` | `tools/ci/borda.test.ts:88` | portão da tarefa (`npm run test`) |
| `output stderr` → `output file` | `infra/test/borda.int.test.ts:586` (poll por `health_checker.active` em `docker logs`: 28 linhas → 0) | esteira (`test:infra`) |

Conferi as duas por leitura do código dos guardas; a contagem 28 → 0 é medição da rodada 7. Continua
valendo o registro de que a correção do ruído de `admin.api` mexe nesse mesmo bloco — o que ela altera
é o `include`/`exclude`, não o `output`.

**E uma porta de código que fica sem teste, de propósito.** O despejo só chega ao log do job por
`stdio: 'inherit'` em `tools/ci/executar.ts`. Trocado por `'pipe'` descartado, a evidência some com
tudo verde. Não peço teste porque isso apagaria a saída da esteira inteira, o que ninguém deixa passar
numa revisão — mas fica o registro de que a proteção aqui é social, não automática.

Fechado por `tools/ci/compose.int.test.ts` › "nenhum serviço declara `logging`", que afirma a ausência
de `logging` inteiro e enumera os 19 serviços pelo nome — "mais de um" deixaria dezessete sem checar,
e uma contagem não pegaria serviço renomeado nem trocado um por um.
Medido:

```
AssertionError: borda declara logging: o despejo da falha deixa de ser confiável:
expected { driver: 'none' } to be undefined

AssertionError: postgres declara logging: o despejo da falha deixa de ser confiável:
expected { driver: 'json-file', …(1) } to be undefined
```

**O defeito, visto de perto.** Tirando o `--timestamps` da chamada do teste de integração novo, o
vermelho mostra literalmente o problema que esta correção conserta:

```
AssertionError: linha sem carimbo do Docker:
redis-fila-1  | 1:M 21 Sep 2026 20:55:01.773 * DB loaded from base file appendonly.aof.1.base.rdb
```

`1:M 21 Sep 2026 20:55:01.773` é o formato do Redis. O Postgres escreve `2026-09-21 20:55:01.773 UTC`,
o Caddy escreve `"ts":1789870704.789`. Três escalas, nenhuma comparável sem tradução — e é por isso
que nenhum dos sete vermelhos foi diagnosticado.

**Combinação aceita pelo compose instalado:** `logs --no-color --timestamps --tail N` rodou nesta
medição com N de 40 a 1.000.000. E isso deixou de ser conferência manual: `tools/ci/compose.int.test.ts`
passa a afirmar o **resultado** — carimbo RFC3339 do Docker em toda linha, nos dois serviços, e os
carimbos caindo na escala do relógio de parede do host. É a única asserção que não é sobre argv, e ela
existe porque, se uma versão futura do compose recusar a combinação, o passo sairia não-zero dentro de
uma execução **já vermelha** e `executar.ts` preservaria o código original: o despejo falharia em
silêncio exatamente na execução em que é a única evidência.

A primeira versão desse caso fechava com `Math.max(...) - Math.min(...) >= 0`, que é **asserção que
sempre passa** — proibida pela regra 40 — e era justamente ela que carregava a afirmação "numa linha
do tempo só". A claim estava sem nenhuma asserção capaz de ficar vermelha. Quem pegou foi a rodada 3
do `test-engineer`, depois de eu pedir que ele olhasse esse ponto especificamente.

Trocada por limites de relógio de parede (`<= agora + 60 s` e `> agora − 30 dias`), largos dos dois
lados porque apertá-los custa vermelho falso por motivos alheios à regra: o `integracao.setup.ts` sobe
o ambiente de forma idempotente e **não derruba**, então numa máquina de desenvolvimento de pé há dias
as últimas linhas podem ser antigas; e a VM do Docker Desktop derrapa o relógio ao suspender.

**Medido, com a direção — e a primeira medição que este documento trouxe estava obsoleta.** Eu havia
escrito "conferi que ela falha, deslocando o `agora` em 48 h", número medido contra a janela antiga de
24 h. A rodada 5 mandou remedir:

| Deslocamento do `agora` | Resultado |
|---|---|
| **+48 h** | ✅ passa — o limite **não** pega desvio para frente dessa ordem |
| −48 h | ❌ 1 vermelho |
| −40 dias | ❌ 1 vermelho |

E a divisão de trabalho, que o meu comentário creditava errado: **quem separa carimbo do Docker de
carimbo do serviço é a regex**, que exige o `T` e o `Z` literais e por isso reprova os três formatos
reais e qualquer forma com deslocamento `-03:00`. Os limites de relógio pegam só **erro de época**.
Um carimbo em hora local de fuso a oeste rotulado `Z` passa por eles — e isso é aceito, porque a regex
já o teria barrado se não fosse `Z`, e a hospedagem é em região Brasil (D28).

**O que a medição achou e não cabe aqui.** 34.102 das 38.787 linhas da `borda` (88%) são o logger
`admin.api` registrando o *healthcheck do próprio contêiner* (`Wget` em `127.0.0.1:2019/config/`),
com `uri`, `remote_ip` e `headers`. O `Caddyfile` já exclui `http.log.access`, `http.log.error` e
`reverse_proxy` de propósito (regra 20, item 9); `admin.api` escapou. Isso afoga as linhas que
diagnosticam um 503 — `HTTP request failed` (1.753), `status code out of tolerances` (1.080),
`host is up` (484) — e quatro dos sete vermelhos foram na borda. **É correção própria**, com
`privacy-guardian` junto pelo item 9, e não entra nesta para não misturar dois defeitos num review só.

**Vermelho antes, verde depois**, nos três arquivos de teste desta correção:

Quinze mutações, todas medidas **no estado final**, uma a uma, restaurando entre elas. As onze
primeiras contra `compose.test.ts` + `scripts.test.ts` (base 19 de 19 verdes); as quatro últimas contra
`compose.int.test.ts` (base 9 de 9), que é por isso que os vermelhos delas são 1 e não 5.

| Mutação | Casos vermelhos | Sobrevivia até a |
|---|---:|---|
| sem `--timestamps` | 5 | — (é o conserto) |
| `--tail` de volta a 200 | 5 | — |
| **derrubar antes de despejar** (ordem invertida) | 4 | rodada 1 |
| **call site desviado**: `e2e.ts` com o array embutido de antes | 2 | rodada 1 |
| **call site desviado**: `executarTestesComInfra`, o outro | 2 | rodada 2 |
| **`--tail` duplicado** (o Docker usa o último; `indexOf` achava o primeiro) | 5 | rodada 2 |
| **lista de serviços no fim**, que some com os doze serviços nossos | 5 | rodada 2 |
| **arquivo de compose trocado** no despejo, sem `--project-name` | 2 | rodada 2 |
| **`--since 1m` acrescentado**, que corta o despejo ao último minuto | 5 | **rodada 3** |
| **`--no-color` removido** | 5 | **rodada 3** |
| nome do projeto trocado (`educa-teste` → `educa`) | 7 | — |
| **`logging: {options: {max-size: 100k}}`** no `postgres` (configuração) | 1 | rodada 4 |
| **`logging: {driver: none}`** na `borda` (configuração) | 1 | **rodada 5** |
| `agora` deslocado em −48 h no limite de relógio | 1 | — |
| `agora` deslocado em **+48 h** | **0 — passa** | ver acima |

Três coisas que o processo produziu e que valem mais que a tabela:

- a rodada 1 estava certa nas duas: antes dela, **inverter a ordem passava com 4 verdes** — e nesse
  mundo o `down --volumes` já teria levado os contêineres, o despejo sairia vazio, e a correção
  inteira seria letra morta sem nenhum vermelho;
- **a tabela da rodada 2 estava errada, e quem achou foi o revisor.** Eu havia escrito "1 caso" para
  a ordem invertida; são 4. A medição era do estado da rodada 1, de antes de
  `afirmarDespejoCarimbado` existir, e ficou misturada com as outras linhas — subestimando a própria
  proteção;
- **as duas últimas mutações são a lição.** Até a rodada 3 os testes afirmavam *propriedades* do
  comando (tem `--timestamps`, o tail é ≥ 4.000). `--since 1m` satisfaz as duas **e destrói a
  evidência**: corta o despejo ao último minuto, e a falha aos 15 min desaparece. É a mesma
  alternativa que este documento diz ter considerado e descartado, entrando pela porta de trás do
  teste. Por isso `scripts.test.ts` deixou de afirmar propriedades e passou a afirmar a **linha
  inteira** do despejo, e `compose.test.ts` o **argv inteiro** com `toEqual`. Uma lista de
  propriedades protege contra o que você pensou; a linha inteira protege contra o que você não
  pensou.

Os dois despejos passam pela mesma função agora (`etapasDeEncerramento`), então o e2e herda o
conserto sem ter código próprio — e o `--manter-ambiente` continua valendo, como o terceiro caso de
`compose.test.ts` afirma no nível da função e o de `scripts.test.ts` afirma no script real.

**O caso que apareceu enquanto esta correção esperava o portão, e que é o melhor argumento a favor
dela.** Em 21/09/2026, `infra/test/alertas.int.test.ts` falhou **três vezes seguidas** e depois
passou **duas vezes seguidas**, sem nenhuma mudança no que o teste usa:

| Execução | Contexto | Resultado |
|---|---|---|
| 1 | portão com `--infra` | ❌ 2 casos |
| 2 | `npm run test:infra` | ❌ os mesmos 2 |
| 3 | arquivo isolado, **com esta correção guardada** | ❌ os mesmos 2 |
| 4 | arquivo isolado | ✅ 5 de 5 |
| 5 | arquivo isolado, repetição | ✅ 5 de 5 |

A execução 3 é a que importa para esta correção: ela prova que o vermelho **não** vinha daqui. E o
que sobrou das três falhas foi `AssertionError: expected false to be true` — sem hora, sem log
cruzável, sem como saber o que o Grafana ou a borda estavam fazendo naquele instante. **Causa não
estabelecida, e registrada como dado, não como diagnóstico.** É exatamente o vermelho que esta
correção existe para tornar legível da próxima vez.

## O que esta correção ensinou sobre o processo

Uma correção de duas linhas de comportamento, com as rodadas de `test-engineer` que a tabela de
Revisões lista no fim deste arquivo.

**A primeira versão desta seção dizia que o código foi reprovado duas vezes. Foram três, e a terceira
é a mais grave.** A rodada 8 pegou o erro, e ele é exatamente do tipo que esta seção existe para
nomear: eu classifiquei uma reprovação de **asserção** como se fosse deslize de prosa.

| Rodada | O que foi reprovado |
|---|---|
| 1 | a ordem dos passos não tinha teste: inverter para "derrubar antes de despejar" passava com 4 verdes |
| 3 | `Math.max − Math.min >= 0`, **asserção que sempre passa** (regra 40) |
| 5 | `expect(servico.logging?.options)` não alcançava troca de driver: **`driver: none` — zero linha de evidência, exit 0 — passava com os dezenove casos verdes** |

A da rodada 5 é o pior resultado possível desta correção: a evidência sumindo em silêncio na execução
em que é a única que existe. Eu a havia arquivado na linha "comportamento de ferramenta de terceiro".

Fora essas três, o que sobreviveu intacto a todas as rodadas foi **o `--timestamps`**: o conserto em si
nunca foi contestado. O `--tail` **não** sobreviveu — até a rodada 4 este documento trazia 2.000, que ele
mesmo chama de número chutado e inútil, e o 4.000 só ganhou critério depois da medição que derrubou o
2.000. Dizer que "o argumento central sobreviveu" era retroprojetar a versão final sobre as rodadas em
que ela não existia. A tabela do `--tail` reproduz ao dígito (recomputei as três linhas e a soma
149.322); a de mutações é a que foi remedida três vezes.

**O resto foi texto, e o texto errou nas rodadas que a tabela abaixo lista.** A primeira versão dela dizia "prosa sobre o
mundo fora do repositório, nunca uma asserção de teste". Também falso: metade das linhas é prosa sobre
o alcance dos **próprios testes**.

| Rodada | Afirmação minha, errada | Sobre o quê |
|---|---|---|
| — | "2.000 cobre a execução inteira" | ferramenta de terceiro, derrubado por medição minha |
| 2 | "a ordem invertida dá 1 vermelho" (davam 4) | **alcance dos meus testes**, medido num estado e citado em outro |
| 3→4 | "conferi que ela falha deslocando o `agora` em 48 h" (+48 h **passa**) | **alcance dos meus testes** — e superestimava a proteção, que é o pior sentido de errar |
| 5 | "trocar o driver também apareceria aqui" | **alcance da minha asserção** |
| 6 | "os seis de infraestrutura" (sete), "passa de 150 mil" (149.322), "os outros 9" (10) | contagem que eu não contei |
| 6 | "o último caminho que mata a evidência" | exaustividade |
| 7 | "`local`, `syslog`… entregam zero linha" (entregam) | ferramenta de terceiro |
| 7 | "com tudo verde" na porta do Caddyfile | exaustividade, herdada do revisor sem conferir |
| 8 | "`local`, `syslog`… entregam **menos**" | ferramenta de terceiro — medido com 3 linhas, que não podem revelar truncamento |

São dois vícios, e os dois têm conserto barato:

1. **afirmar comportamento que eu não medi — de ferramenta de terceiro *ou do meu próprio teste* —,
   ou afirmar que "nada mais pega isso", sem colar o comando e a saída ao lado.** Vale como critério
   para o próximo documento: frase dessas só entra com a medição embaixo. E a medição tem de ser da
   escala que importa: três linhas não provam nada sobre truncamento em 3.899;
2. **medir num estado e deixar a frase sobreviver quando o código muda embaixo dela.** A tabela de
   mutações foi remedida inteira três vezes por isso, e duas frases sobre números deste documento
   contradiziam outras a 250 linhas de distância.

E duas observações que não são só sobre mim:

- **repetir recomendação de revisor sem conferir** produziu dois dos erros (rodadas 7 e 8). O revisor
  acerta muito, e por isso é fácil copiá-lo — mas ele também erra, e a medição é de quem escreve;
- no caso dos drivers, **revisor e revisado mediram a mesma metade**, e o erro sobreviveu duas rodadas
  porque ninguém perguntou "essa medição *poderia* ter mostrado o contrário?". Essa pergunta é mais
  barata que a medição e pega mais.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-21 16:24:22 | 2026-09-21 16:28:14 | `test-engineer` | 1 | REPROVADO | acbbe73e3bea883dc |
| 2026-09-21 17:21:37 | 2026-09-21 17:26:58 | `test-engineer` | 2 | APROVADO | a569f46f612a2f73e |
| 2026-09-21 17:57:51 | 2026-09-21 18:06:38 | `test-engineer` | 3 | REPROVADO | a45839fc3e15a283b |
| 2026-09-21 18:38:50 | 2026-09-21 18:44:14 | `test-engineer` | 4 | APROVADO | aaa46f4fe97c48330 |
| 2026-09-21 19:14:09 | 2026-09-21 19:19:00 | `test-engineer` | 5 | REPROVADO | aecd081688cedaebb |
| 2026-09-21 19:48:58 | 2026-09-21 19:53:25 | `test-engineer` | 6 | APROVADO | aeb7498bb49e727e6 |
| 2026-09-21 20:22:47 | 2026-09-21 20:30:01 | `test-engineer` | 7 | APROVADO | a39726b319161ad10 |
| 2026-09-21 20:59:57 | 2026-09-21 21:05:42 | `test-engineer` | 8 | APROVADO | ab9dce813553b8d23 |
| 2026-09-21 21:34:29 | 2026-09-21 21:39:34 | `test-engineer` | 9 | APROVADO | ab5c190c16420341e |
| 2026-09-21 22:08:36 | 2026-09-21 22:11:29 | `test-engineer` | 10 | APROVADO | a5dbe40884a264e66 |
| 2026-09-21 23:21:15 | 2026-09-21 23:25:22 | `test-engineer` | 11 | APROVADO | a16285906f3c323d9 |
| 2026-09-21 23:26:08 | 2026-09-21 23:32:42 | `infra-guardian` | 1 | APROVADO | a66210449f2212157 |
