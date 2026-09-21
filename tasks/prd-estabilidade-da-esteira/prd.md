# PRD — Estabilidade da esteira

**Status:** rascunho (rodada 3 do `/revisar-spec`, 21/09/2026; não implementado)
**Funcionalidade do roadmap:** a definir — ver seção 10
**Depende de:** F0 (a esteira e o compose de teste são dele)

## 1. Problema

O Joaquim roda o portão local de 20 minutos e commita. A esteira fica vermelha num teste sem relação
com o que ele mexeu. Roda de novo, sem mudar uma linha: passa. Perdeu 40 minutos.

**Sete vezes em uma sessão**, em 20 e 21/09/2026, somando esteira e portão local; quatro em
`infra/test/borda.int.test.ts` ou vizinhos, todas verdes na execução seguinte sem alteração de
código (`retro.md` do F1).

O custo não é o tempo perdido. São três coisas piores:

- **Trava o trabalho seguinte** (regra 40, D52): a próxima tarefa só commita com a esteira verde
- **Ensina a ignorar vermelho**, e o vermelho real vira mais um ruído
- **Esconde o que o teste prova:** a falha vem como `AssertionError` mudo ou `test timed out`

### O que se sabe, e o que não se sabe

Três rodadas de revisão (`revisao-spec.md`) estabeleceram **fatos** e derrubaram três tentativas
minhas de explicar a causa. A distinção importa.

**Fato 1 — há espera fixa onde deveria haver condição observável, em quatro sítios.**
`infra/test/borda.int.test.ts` tem `esperar(VOLTA_AO_BALANCEAMENTO_MS)` — 3 s fixos (`:25`) — nas
linhas `:96` (dentro de `voltarAoBalanceamento`), `:270`, `:317` e `:358`. O `:358` é o `afterEach`
do caso de `:361`, que para `realtime-1` e `realtime-2` e **não usa o helper**: repete a lógica na
mão. O `aguardarSaudavel` que precede as esperas lê a saúde do **contêiner**; quem decide se o pedido
chega ao upstream é a **borda**.

**Fato 2 — o caso seguinte é o handshake por polling** (`:426`), e a saída observada na execução
35525902277 foi `[200, 200, 503, 400, 400, …]`: um 503, e o 400 em cascata do socket.io não
conhecendo o `sid` na outra instância.

**O que NÃO está estabelecido: por que sai o 503.** A conta da readmissão não fecha, e a
configuração citada é quem a contradiz:

- `infra/Caddyfile:40-41` tem `lb_try_duration 5s` — mas ela só cobre requisição que a borda
  **repete**. O próprio repositório documenta (`borda.int.test.ts:105-106`): "O GET é repetido pela
  borda se a conexão cair; **o POST não**". E a saída observada veio de **20 POSTs em paralelo**
  (`:434`);
- a sonda da borda é `/prontidao` (`Caddyfile:34`) e o healthcheck do contêiner do realtime é **o
  mesmo `/prontidao`** (`infra/compose.yml:248`): quando `aguardarSaudavel` retorna, o endpoint que a
  borda sonda já responde 200, e falta no máximo um intervalo de 2 s.

**A hipótese da readmissão lenta não explica o vermelho.** Candidatas de pé, que a medição separa:

1. a readmissão demorar mais que a conta sob disputa real (a conta é de configuração, não medição);
2. a **saída** do pool no meio do caso — instância viva porém lenta some por `health_fails 2` com
   `health_timeout 3s`, que é mecanismo diferente do da volta e **não é o que o conserto da espera
   corrige**;
3. o pool ficar vazio — os dois upstreams fora ao mesmo tempo —, caso em que o 503 é inevitável;
4. **falha de conexão numa requisição não repetível contra upstream que está no pool** — conexão
   keepalive morta para o contêiner recém-parado, ou porta ainda recusando no `start`. Vira 502 e sai
   como 503. É a que a evidência aponta, porque o que falhou foram POSTs.

**E o status não distingue nenhuma delas:** `handle_errors 502 503 504` (`Caddyfile:75-81`) devolve as
três com o mesmo envelope e o mesmo 503, e o log do proxy que diria está excluído de propósito
(regra 20, item 9). Sobra o log `sonda`, que mostra a pertinência ao pool no instante.

**Os vermelhos do portão local têm mecanismo próprio.** O portão roda `e2e` **antes** de `infra`, e
`test:e2e` usa `--manter-ambiente`, que pula o `down`: os testes de infra herdam os 19 serviços de
pé, e `borda.int.test.ts:363-367` monta o que parar a partir do que está rodando.

## 2. Objetivo

A esteira só fica vermelha quando há defeito no código, e quando fica vermelha ela diz o que houve.

Não é "eliminar teste lento": vários desses testes existem para provar resiliência sob queda de
serviço (regra 80) e continuam caros. É trocar espera fixa por condição observável, tirar a disputa
que a própria suíte cria, e declarar o que hoje é herdado da máquina.

## 3. Fora de escopo

- Reescrever os testes de resiliência: provam a regra 80 e ficam. Muda o orçamento, não o que provam
- Trocar de provedor de esteira, ou pagar runner maior
- Mascarar flake com retentativa silenciosa (regra 40)
- A guarda `esperar-servico-do-compose`, o carimbo por conteúdo e o `traco-do-e2e` — já feitos
- Desempenho do produto em produção

## 4. Papéis envolvidos

| Papel | O que precisa |
|---|---|
| Joaquim (implementa) | não perder meia hora em vermelho que não é dele, e confiar que vermelho quer dizer defeito |
| Escola (indiretamente) | processo que ensina a ignorar vermelho deixa passar o defeito que chega nela |

## 5. Requisitos funcionais

| # | Requisito | Como se prova |
|---|---|---|
| RF1 | A taxa de vermelho falso de hoje é **medida**, por job, e vira a linha de base; e cada 503 é registrado com **o estado do pool no instante (log `sonda`) e o método da requisição** — sem os dois, as quatro candidatas não se separam | Documento commitado com execuções e vermelhos por job, e com a correlação que diz qual candidata é. Separa também o 503 da aplicação (guarda de sessão, semáforo de hash), que usa o mesmo envelope |
| RF2 | Toda restauração de serviço atrás da borda espera **condição observada na borda**, não prazo fixo, e passa por um helper só — os quatro sítios (`:96`, `:270`, `:317`, `:358`) deixam de repetir a lógica | Asserção **positiva**: depois de a condição retornar, um pedido pela borda fixado naquela instância é atendido na primeira tentativa; antes de retornar, não é. Mais a mutação, com critério de falha declarado |
| RF3 | Fica escrito qual estado do 503 se aplica, e a alavanca de cada um | (a) um upstream voltando com o outro atendendo: 503 não deveria existir — se existir, é defeito de produto. (b) pool vazio: 503 inevitável, alavanca `lb_try_duration` × readmissão. (c) **requisição não repetível contra upstream no pool**: a alavanca não é a retentativa, é o desenho de drenagem e keepalive — e isso é produto, porque é o POST do aluno salvando resposta de prova numa rolagem de instância (regra 80, item 6) |
| RF4 | O projeto `infra` **declara e impõe o estado de entrada**, em vez de herdar o que estiver de pé | A prova **fabrica o estado sujo**: sobe um serviço fora do conjunto declarado, roda a imposição, e afirma que ele foi parado e que não entra no conjunto de `borda.int.test.ts:363-367`. Guarda que só afirma o estado passa por construção em runner limpo |
| RF5 | O job de e2e não sobe serviço que não usa, **sem** quebrar o exportador OTel | Ambiente efetivo (`compose ps --services --status running`) sem `observabilidade`, e a saída dos processos no SIGTERM medida antes e depois |
| RF6 | Vermelho por estouro de prazo nomeia o serviço ou o passo | Teste que força o estouro e afirma que a mensagem nomeia |
| RF7 | Se houver retentativa, o flake fica **registrado** em lugar declarado, com leitor e retenção | Teste falha se um caso que passou na segunda tentativa não aparece no registro |
| RF8 | A taxa de vermelho falso fica **abaixo do limite superior declarado**, com N e contenção escritos antes da rodada | Repetição por caso afetado sob a contenção definida na seção 6, mais a suíte inteira como amostra em job próprio |
| RF9 | A relação da **volta** ao pool fica presa em teste | `tools/ci/borda.test.ts` ganha `health_interval × health_passes ≤ lb_try_duration` (2 s ≤ 5 s); hoje ele só prende a da **saída** |

## 6. Regras de negócio

- **Flake não se mascara.** Retentativa sem registro é proibida (regra 40)
- **Prazo se aperta com medição, nunca por palpite.** Tentado duas vezes no F1, falhou as duas
- **Espera de infraestrutura não mora no orçamento da regra** (correções de setembro; a guarda
  `esperar-servico-do-compose` já cobre a parte automatizável)
- **N se declara antes do resultado, e "alvo zero" não gera N.** Com `N = ⌈ln(1−c)/ln(1−p)⌉`, `p = 0`
  dá infinito. O alvo é **limite superior**: p < 2% com 95% de confiança dá N = 149; p < 5% dá N = 59.
  O número, a confiança e a fórmula ficam no documento do RF1 **antes** da rodada. Para calibrar: dez
  execuções verdes com p = 10% acontecem por sorte em 35% das vezes
- **Contenção é carga declarada, não repetição.** Repetir em máquina ociosa não prova nada num
  fenômeno de relógio. A prova declara núcleos disponíveis, trabalhadores em paralelo e job
  concorrente, em termos reproduzíveis
- **Teste de resiliência continua caro.** Reduzir custo tirando o que ele prova não é ganho

## 7. Casos de borda

- **Dois jobs ou portões na mesma máquina:** projeto compose e portas do host são fixos — colidem
- Runner com menos núcleos, ou mais carregado
- Máquina de desenvolvedor mais rápida que o runner: é o caso normal, e a razão de os vermelhos não
  reproduzirem localmente
- `restart` com o AOF carregado — **aceito sem cenário**: nenhum dos sete vermelhos veio daí, e a
  medição do RF1 diz se aparecer
- **Serviço vivo porém lento, que sai do pool no meio de um caso** por `health_fails 2` com
  `health_timeout 3s`. É a candidata 2 da seção 1, e o conserto do RF2 **não a cobre**: ele trata a
  volta, não a saída. Precisa de cenário próprio, ou de decisão escrita de que foi descartada pela
  medição do RF1
- Teste que só falha quando roda depois de outro no mesmo arquivo

## 8. Dado pessoal envolvido

Nenhum. Ambiente sintético (regra 20, item 17); não cria campo, rota nem log. A superfície
relacionada — o artefato `traco-do-e2e` — já foi decidida com o `privacy-guardian` em 21/09/2026.

## 8b. Risco regulatório

Nenhum.

## 9. Métricas

- **Taxa de vermelho falso por job**, medida no RF1 e ao fim: **abaixo do limite superior declarado**
  (nunca "zero", que não gera N)
- **Tempo do job de e2e** antes e depois do RF5, lembrando que ele rende no máximo 1 dos 19 serviços
- **Tempo da saída dos processos no SIGTERM**, antes e depois do RF5 — é o que o acoplamento do OTel
  ameaça

## 10. Perguntas em aberto

| Pergunta | Quem decide | Quando |
|---|---|---|
| Qual número do roadmap, e se entra antes do F2 | Joaquim | antes de começar |
| Qual das quatro candidatas da seção 1 produz o 503 — e, se for o pool vazio, se a relação `lb_try_duration` × readmissão é suficiente | medição do RF1 | primeiro passo |
| Fixar `workers` do Playwright traz ganho de **estabilidade**, ou só muda a duração? | medição do RF1 | antes de virar requisito |
| Retentativa registrada entra, ou fica em zero? | Joaquim, com o número que sobrar depois de RF2, RF4 e RF5 | depois de medir |
| Teto de CPU no compose de teste: só para quem fica de pé sem ser medido (`observabilidade`, `storage`, `oidc-falso`) — nunca para `borda`, `api-*`, `realtime-*`, `postgres`, `redis-*`, cujas asserções são de relógio | investigação | junto do RF5 |

---

**Nota de contexto.** Escrito para ficar guardado, sem o trabalho iniciado. Números e fatos vêm da
sessão de 20 e 21/09/2026: `retro.md` do F1 e as rodadas do `revisao-spec.md`.
