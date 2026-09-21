# Revisão de spec — estabilidade-da-esteira

**Subagentes obrigatórios:** `test-engineer`, `infra-guardian`

Os demais não se aplicam e o motivo fica escrito: não há tabela, repository, query nem endpoint
(`tenancy-guardian`); não há dado de pessoa, log, storage, exportação nem envio externo
(`privacy-guardian`); não há nota, correção, tutor, autonomia de agente nem indicador de professor
(`conformidade-reviewer`); não há chamada de modelo (`llm-integrator`); não há tela
(`frontend-reviewer`) — o `playwright.config.ts` muda, mas os perfis `chromebook` e `celular` e o que
eles emulam ficam como estão.

**Tamanho.** Os dois revisores leram o teto de 2.000 palavras **por documento**, e o `test-engineer`
fundamentou: `/criar-prd` e `/criar-techspec` põem o limite no checklist de cada artefato. Depois das
quatro rodadas: PRD 1.965, **Tech Spec 2.220** — acima do teto, com aceite **pendente** declarado no
topo do arquivo. Enquanto o aceite não for escrito, é achado aberto.

## Rodada 1 — 21/09/2026

**Veredito: REPROVADA**

| Revisor | Veredito | Bloqueantes |
|---|---|---|
| `test-engineer` | REPROVADO | 9 |
| `infra-guardian` | REPROVADO | 8 |

Os dois convergiram no essencial, e a auditoria fez o que a etapa 1 da própria spec prometia fazer
depois: **estabeleceu o mecanismo** em vez de listar hipóteses. Os achados abaixo estão agrupados por
assunto, não por revisor.

### Correções exigidas na Tech Spec

**A. A hipótese do `borda.int.test.ts` aponta o caso errado** (`test-engineer` B4, `infra-guardian` 1)

`infra/test/borda.int.test.ts:445` (o caso que mata um realtime) roda **depois** do handshake em
`:426` — o Vitest executa na ordem do arquivo e `vitest.config.ts` não declara `sequence.shuffle`.
Não pode contaminá-lo. O predecessor real é o caso de `:361` ("API não depende do resto"), que para
`realtime-1` e `realtime-2` (`:368-369`) e restaura no `afterEach` de `:354-359`.

**B. Falta a terceira hipótese, que é a provável** (`test-engineer` B4, `infra-guardian` 2)

A restauração termina com `esperar(VOLTA_AO_BALANCEAMENTO_MS)` — **3 s fixos** (`:25`) — depois de um
`aguardarSaudavel` que só lê `{{.Health}}` do contêiner e nada diz sobre a borda ter recolocado o
upstream no balanceamento. O `infra/Caddyfile:34-38` sonda com `health_interval 2s` e
`health_timeout 3s`, e com `health_fails 2` o pior caso passa dos 3 s sob disputa. Daí o 503; o 400
em cascata é o socket.io não conhecendo o `sid` na outra instância. **É a mesma classe da guarda
`esperar-servico-do-compose`, um nível acima dela: espera fixa no lugar de condição observável.**

**C. O conserto proposto para contaminação é no-op** (`test-engineer` B5)

`voltarAoBalanceamento` (`:93-96`) já faz `start` + `aguardarSaudavel` + espera. Nomear a constante
que muda (trocar a espera fixa por condição observada na borda) é o conserto real.

**D. Tirar `observabilidade` pode introduzir a classe de flake que se quer remover**
(`test-engineer` B3, `infra-guardian` 3)

`TELEMETRIA_OTLP_URL` aponta fixo para `observabilidade:4318` em `infra/compose.yml` e é obrigatório
em `packages/nucleo/src/telemetria/iniciar.ts:28`, com exportação a cada 5 s. Sem o serviço, o nome
não resolve, a consulta sai para o resolvedor da máquina e **atrasa a saída no SIGTERM em ~3 s** — o
próprio `borda.int.test.ts:238-243` mede isso, e são os casos de drenagem que medem essa saída. O RF3
só vale junto com desligar o destino OTLP naquele ambiente.

**E. As alavancas da etapa 2 não alcançam o job onde o sintoma mora**
(`test-engineer` B9, `infra-guardian` 4)

`borda.int.test.ts` roda no projeto `infra`, pelo job `infra` do `ci.yml`, que não usa Playwright nem
a lista de serviços de `tools/ci/e2e.ts`. Quatro dos sete vermelhos ficam intocados. A etapa 2
precisa carregar ao menos uma medida para o job `infra`.

**F. O mecanismo dos vermelhos do portão local tem nome** (`infra-guardian` 5)

`tools/processo/portao-local.ts` roda `e2e` **antes** de `infra`, e `test:e2e` usa
`--manter-ambiente`, que pula o `down` (`tools/ci/e2e.ts:26`). Os testes de infra herdam os 19
serviços do e2e de pé, e `borda.int.test.ts:364-368` monta o conjunto a parar a partir do que está
rodando — o conjunto cresce e o ciclo stop/start fica mais longo que os 3 s fixos. Explica os três
vermelhos locais, e a etapa 5 precisa rodar também no portão local com `--e2e --infra`, nessa ordem.

**G. O critério do RF7 não é fixo nem declarado** (`test-engineer` B1, `infra-guardian` 6)

N é escolhido depois do resultado; o PRD diz "dez execuções" e a spec diz "N"; "sob contenção" não é
definido; e não há linha de base — "sete numa sessão" não tem denominador. A estatística: com
probabilidade de 10% por execução, dez execuções verdes acontecem por sorte em 35% das vezes; para
descartar p ≥ 10% com 95% de confiança são ~29 execuções. Exigido: medir a taxa de hoje, derivar N da
taxa-alvo com a confiança, declarar a contenção de forma determinística, e usar **repetição por caso
afetado** como prova principal (barata), com a suíte inteira como amostra menor em job próprio.

**H. As guardas do RF3 e RF4 provam forma, não resultado** (`test-engineer` B2)

É a classe que o F1 reprovou duas vezes. Exigido: RF3 provado pelo ambiente efetivo
(`docker compose ps --services --status running` sem `observabilidade` e igual à lista declarada —
lista no fonte não prova nada, porque `up <serviços>` sobe `depends_on` junto); RF4 provado pelo
config resolvido com `CI=true`, afirmando valor numérico e substituição por ambiente.

**I. "Medir antes de consertar" é só intenção escrita** (`test-engineer` B6)

A seção 1 diz que nenhum conserto começa sem número, e a etapa 2 diz que RF3 e RF4 não dependem da
investigação — que é exatamente o que mede os dois. Exigido: etapa 1 como tarefa 1.0 com documento de
medição commitado, tarefas seguintes citando o número de lá, e o RF4 rebaixado a pergunta em aberto
até a medição dizer que há ganho.

**J. O registro de flake do RF6 não existe** (`test-engineer` B7, `infra-guardian` 7)

"Três semanas seguidas" exige registro que dure três semanas; o único mecanismo em pé
(`traco-do-e2e`) guarda 7 dias e **só na falha** — teste que passa na segunda tentativa deixa o job
verde e não publica nada. Sem definir lugar, leitor e retenção, `retries: 1` é a retentativa
silenciosa que a própria seção chama de inaceitável. E RF5 e RF6 não têm uma linha de teste.

**K. A ramificação de produto não diz o que fazer com o teste enquanto isso**
(`infra-guardian` 8, `test-engineer` B4)

Se o 503 for defeito de produto, a regra 40 proíbe `.skip` e a D52 faz o vermelho segurar a próxima
tarefa. Exigido: declarar que a tarefa de produto pertence a esta funcionalidade, antes da etapa 5, e
que o teste não é desligado enquanto isso. A pergunta também precisa ser feita no ramo "contaminação",
não só no de disputa.

**L. Bordas do PRD sem cenário** (`test-engineer` B8)

Runner menor ou mais carregado; **dois jobs simultâneos na mesma máquina** — o projeto compose é fixo
(`educa-teste`) e as portas do host são fixas em `infra/teste.env`, então duas execuções colidem, e
isso é candidato direto aos vermelhos do portão local; e `restart` com AOF carregado.

**M. A premissa 2 deve fechar antes de virar tarefa** (`test-engineer` B4)

Decide de quem é o trabalho. E o RF2 já está escrito como se a resposta fosse conhecida
("um 503 transitório não cascateia"), o que prejulga a investigação.

### Recomendações

- Limite de CPU no compose de teste: **partir a pergunta**. Teto só para quem fica de pé sem ser
  medido (`observabilidade`, `storage`, `oidc-falso`); nunca para `borda`, `api-*`, `realtime-*`,
  `postgres` e `redis-*`, cujas asserções são de relógio (`borda.int.test.ts:480-482`) — capar CPU
  neles fabrica o 503 sob investigação (`infra-guardian`)
- Alavanca mais barata para o job `infra`: apontar `TELEMETRIA_OTLP_URL` para um endereço que falha
  rápido, em vez de subir o otel-lgtm inteiro durante o teste mais instável (`infra-guardian`)
- A guarda de `observabilidade` precisa valer **só** para a lista do job de e2e:
  `metricas.int.test.ts:89`, `alertas.int.test.ts:81` e `borda.int.test.ts:238` sobem o serviço de
  propósito (`infra-guardian`)
- Nomear `voltarAoBalanceamento` e `VOLTA_AO_BALANCEAMENTO_MS` na tabela de módulos da seção 2
- Dizer qual é o valor padrão de `workers` e o efeito dele no portão local de 12 núcleos; a spec
  descreve o padrão vindo do runner e o ambiente sobrepondo, que é o inverso do uso
- Trocar a renarrativa do F1 (PRD §6, Tech Spec §1 e §13) por citação ao `retro.md`: paga o espaço
  das correções sem passar do teto
- Dizer no PRD que o RF3 rende no máximo 1 dos 19 serviços, para o ganho não ser lido como maior
- Puxar o `--repeat-each` no perfil `celular` (pendência da retro do F1) para dentro da prova da
  etapa 5
- Reconciliar o "zero em dez execuções" do PRD §9 com o N do RF7 depois da correção G

### Tamanho

Os dois revisores leram o teto de 2.000 palavras **por documento**, e os dois passam (1.538 e 1.600).
O `test-engineer` fundamentou: `/criar-prd` e `/criar-techspec` põem o limite no checklist de cada
artefato. Não é bloqueante. O que os dois apontaram é que a renarrativa do F1 ocupa espaço que as
correções vão precisar.


## Rodadas 2, 3 e 4 — 21/09/2026

**Veredito: REPROVADA** (nas três). `test-engineer` e `infra-guardian` reprovaram em todas.

Bloqueantes: rodada 1, **17** (9 + 8) · rodada 2, **9** (5 + 4) · rodada 3, **3** (1 + 2) ·
rodada 4, **5** (3 + 2). Converge, mas não fechou.

### O que estas três rodadas realmente produziram

Elas não melhoraram um desenho: **derrubaram três explicações minhas para o 503**, cada uma com
evidência no código. Vale registrar, porque é o aprendizado mais caro desta spec.

1. **Rodada 1 — o caso errado.** Eu acusava `borda.int.test.ts:445` (o que mata um realtime) de
   contaminar o handshake de `:426`. Ele roda **depois**, e o Vitest não embaralha: não pode
   contaminar. O predecessor real é `:361`.
2. **Rodada 2 — a aritmética não fechava.** Eu explicava o 503 pela readmissão lenta (até 5 s contra
   3 s de espera fixa). Mas `Caddyfile:40-41` tem `lb_try_duration 5s`, e a sonda da borda é o
   **mesmo `/prontidao`** do healthcheck do contêiner (`compose.yml:248`) — quando `aguardarSaudavel`
   retorna, falta no máximo um intervalo de 2 s. A configuração que eu citava contradizia a conta.
3. **Rodada 3 — a asserção não discriminava.** Minha "asserção positiva" (pedido fixado na instância
   atendido na primeira tentativa) não existe para a API: `lb_policy cookie` está só no bloco do
   realtime (`Caddyfile:61`). Nos três sítios de API ela degenerava em "retornou 200".
4. **Rodada 4 — e nem a corrigida basta.** `lb_try_duration` faz a borda repetir a seleção
   internamente e devolver 200: "atendido na primeira tentativa" **não é observável de fora**, e uma
   condição que retorne 2 s cedo passa. Além disso, a positiva do realtime passa por vacuidade —
   `handle_errors` responde sem `Set-Cookie`, então "não reescreveu o cookie" é verdade num 503,
   que é o estado que ela deveria excluir.

### O achado que saiu do escopo: uma pergunta de produto

A borda **repete GET e não repete POST** — está escrito no próprio repositório
(`borda.int.test.ts:105-106`) —, e o que falhou na execução 35525902277 foram **20 POSTs em
paralelo** (`:434`). Logo, `lb_try_duration` não cobre o caminho que produziu o vermelho, e a quarta
candidata é falha de conexão em requisição não repetível contra upstream **no** pool.

Isso tem consequência fora do teste: é o mesmo caminho do **POST do aluno salvando resposta de
prova** durante rolagem de instância. Regra 80, item 6 — "resposta de prova nunca se perde" — e a
alavanca que a regra prescreve é gravação idempotente com reenvio no cliente, não retentativa na
borda (que seria escrita dupla, item 7). **Uma revisão de spec sobre flakiness de teste encontrou
uma pergunta de produto.**

### Bloqueantes que seguem abertos (rodada 4)

| # | O quê | Onde |
|---|---|---|
| 1 | As três asserções positivas passam com condição prematura, por `lb_try_duration 5s`. Exige prazo de cliente bem abaixo de 5 s, ou asserção sobre tempo medido contra limiar escrito | `techspec.md`, etapa 2 |
| 2 | A positiva do realtime passa por vacuidade num 503 (`handle_errors` não manda `Set-Cookie`). Precisa ser **conjunção**: handshake bem-sucedido **e** ausência de reescrita | idem |
| 3 | Seis sítios de chamada do helper, não um; `:547` é um **segundo** sítio de pool vazio; e a prova "da lacuna" é tautológica na segunda metade | idem |
| 4 | O RF1 exige correlacionar o 503 ao instante, e **nenhum 503 tem instante**: `Resultado` (`:98-102`) não carimba tempo e `inesperados` (`:167-176`) descarta ordem. Instrumentar antes de medir | `techspec.md`, etapa 1 |
| 5 | O que muda **durante** o projeto `infra`: `alertas:87` sobe `redis-cache` sem parar, `metricas:87` para a fila sem religar, e a ordem dos arquivos não é estável. O `globalSetup` roda uma vez e não cobre | `techspec.md`, etapa 4 |

Corrigido na rodada 4, por erro meu: eu havia escrito que `alertas` e `metricas` sobem
`observabilidade` e não o param — repetindo o que um revisor dissera, **sem conferir**. Os dois param;
o vazamento é outro. É a mesma classe de erro das três explicações derrubadas.

### Recomendações registradas, não aplicadas

Tamanho (Tech Spec acima do teto, com aceite pendente no topo do arquivo) · prazo do cliente e
limiar de tempo por sítio · `borda.int.test.ts:499` (restauração depois de `SIGKILL`) como o lugar
mais provável de achar a evidência de keepalive morto · confirmar se o hash do cookie é do endereço
configurado e não do IP resolvido · guarda que afirma `retries = 0` enquanto a pergunta da
retentativa não fecha · a borda "runner menor ou mais carregado" ainda sem cenário nem descarte
escrito.

### Onde isto parou, e por quê

Quatro rodadas, oito execuções de revisor. A spec deixou de afirmar o que não sabe, e ganhou fatos
que só vieram da leitura do código. Os bloqueantes que restam deixaram de ser erro de spec e viraram
**o desenho da instrumentação** — que é o trabalho da tarefa 1.0. Continuar seria fazer a
investigação dentro da revisão, pagando agora por um trabalho decidido para depois.

**Para quem retomar:** os cinco bloqueantes acima são o roteiro, e a etapa 1 da Tech Spec é por onde
começar. Não gere tarefas sem fechar o bloqueante 4 — sem instante no 503, a medição não separa as
candidatas, e a tarefa 1.0 não entrega o número de que todas as outras dependem.


## Recorte — 21/09/2026, depois da rodada 4

**A funcionalidade foi partida em duas, e esta passa a ser só a fase 1: medir e isolar.**

Motivo, que é a conclusão das quatro rodadas: os bloqueantes que sobravam não eram erro de redação —
eram o desenho de uma asserção para provar um conserto **cuja causa não se conhece**. Três
explicações minhas foram derrubadas com evidência no código, e a quarta rodada mostrou que nem a
asserção corrigida discrimina, porque `lb_try_duration` mascara "atendido na primeira tentativa".

Aprovar aquela spec teria produzido tarefas mandando consertar a espera fixa com asserções
elaboradas, para um mecanismo que a medição pode mostrar que não é a causa. Tarefa que conserta a
coisa errada é pior que tarefa nenhuma.

**O que ficou nesta fase:** instrumentar o 503 (instante, método, estado do pool), medir a linha de
base por job, separar as quatro candidatas, e isolar o projeto `infra` do que ele mesmo deixa de pé.
Nada disso depende de saber a causa, e o isolamento pode sozinho zerar os vermelhos do portão local.

**O que foi para a fase 2:** a espera fixa, a condição de readmissão e as asserções do
`borda.int.test.ts`. Escrita depois, contra o mecanismo medido. Os bloqueantes 1, 2 e 3 da rodada 4
são o roteiro dela, e seguem válidos:

1. a positiva precisa de **prazo de cliente bem abaixo de 5 s** (ou asserção sobre tempo medido
   contra limiar escrito), senão `lb_try_duration` a mascara;
2. a positiva do realtime precisa ser **conjunção** — handshake bem-sucedido **e** ausência de
   reescrita do cookie —, porque `handle_errors` responde sem `Set-Cookie` e "não reescreveu" é
   verdade num 503;
3. são **seis** sítios de chamada do helper, `:547` é um segundo sítio de pool vazio, e a prova "da
   lacuna" é tautológica na segunda metade.

**E a pergunta de produto que apareceu no caminho** fica registrada para a fase 2: a borda repete GET
e **não repete POST** (`borda.int.test.ts:105-106`), e o que falhou foram 20 POSTs. Se a medição
confirmar a candidata 4, o mesmo caminho é o POST do aluno salvando resposta de prova numa rolagem de
instância — regra 80, item 6 —, com gravação idempotente e reenvio no cliente como alavanca, não
retentativa na borda (item 7). Isso é tarefa de produto, com PRD próprio.


## Rodada 5 — 21/09/2026, sobre o escopo recortado

**Veredito: REPROVADA.** `test-engineer` 6 bloqueantes, `infra-guardian` 7.

Bloqueantes por rodada: 17 · 9 · 3 · 5 · **13**. Subiu. E a razão de ter subido é o achado
principal desta rodada.

### O padrão, que agora é o dado mais importante deste arquivo

Cinco rodadas, dez execuções de revisor. Em **todas** elas, uma afirmação minha sobre este
subsistema foi invertida pela leitura do código:

| Rodada | O que eu afirmei | O que o código diz |
|---|---|---|
| 1 | `:445` contamina o handshake | roda **depois** dele |
| 2 | readmissão lenta explica o 503 | `lb_try_duration 5s` e a sonda no mesmo `/prontidao` contradizem |
| 3 | a asserção positiva discrimina | `lb_policy cookie` só existe no realtime |
| 4 | `alertas` e `metricas` sobem `observabilidade` sem parar | os dois param (repeti um revisor sem conferir) |
| 5 | `alertas:87` vaza `redis-cache` | ele **restaura** — está em `SERVICOS_INFRA`, e `borda:367` exige o serviço de pé |

Não é falta de cuidado pontual: é que **eu não consigo escrever uma spec correta deste subsistema
por leitura**. Cada rodada encontra uma inversão nova, e não uma correção da anterior — o modelo não
está convergindo.

### Os dois achados que mudam o plano

**O 503 da aplicação é indistinguível do 503 da borda, e é uma quinta candidata.**
`erro-de-dominio.ts:23` fixa `TENTE_DE_NOVO_PADRAO_SEGUNDOS = 5`, que é exatamente o `Retry-After 5`
do `Caddyfile:78`; o `filtro-global.ts` devolve o mesmo código, a mesma mensagem e os mesmos
cabeçalhos. E o caso de `borda:361` derruba **todas** as conexões das APIs com o Postgres, que é a
condição em que `guarda-sessao.ts:82` devolve 503. A premissa 3 da Tech Spec descartava isso por
afirmação.

**A evidência é destruída antes de chegar ao artefato.** `tools/ci/compose.ts:43-46`: em falha o job
roda `logs --tail 200` — 200 linhas **no total**, para 19 serviços — e em seguida
`down --volumes --remove-orphans`. O log `sonda` da janela do caso não sobrevive. Ou seja: **a fonte
que a etapa 3 pretende correlacionar não existe quando o vermelho acontece na esteira**, que é
justamente onde os quatro vermelhos aconteceram.

### Conclusão: parar de especificar e começar a preservar evidência

O segundo achado dá o caminho, e ele é pequeno. Antes de qualquer spec, o barato é **parar de jogar
fora o que explicaria o vermelho** — do mesmo jeito que a correção de 21/09 fez para o e2e com o
artefato `traco-do-e2e`. Com a evidência preservada, o próximo vermelho entrega dado real, e a spec
passa a ser escrita contra medição em vez de contra a minha leitura, que já errou cinco vezes.

**Recomendação registrada:** uma correção curta que publique, na falha dos jobs `infra` e
`integração`, a janela de log que interessa (`sonda` da borda e `http.erro` das APIs, que carrega
status e código e é correlacionável por instante). Sem spec, sem tarefa, sem esperar decisão de
roadmap. Depois disso, retomar esta spec com dado.

### Os 13 bloqueantes, para quem retomar

`test-engineer`: (1) a etapa 1 não produz o estado do pool que o RF1 exige — o admin do Caddy só
escuta dentro do contêiner; (2) o `compose logs --since` da etapa 3 lê log que já foi embora; (3) o
503 da aplicação é indistinguível e é a quinta candidata; (4) a ordem das etapas destrói a linha de
base, porque a etapa 2 muda o ambiente do caso medido; (5) o `globalSetup` é compartilhado com o
projeto `integracao`; (6) a prova do RF5 passa por construção sob a própria saída preferida.

`infra-guardian`: (1) trocar `borda:364` por lista fixa torna `:367` tautológica; (2) `alertas:87`
não vaza, restaura; (3) instante da **resposta** não correlaciona — precisa de início e duração,
porque o POST tem prazo de 10 s e a borda repete por 5 s; (4) o canal do estado do pool não é
nomeado; (5) o `globalSetup` é dos dois projetos; (6) o estado de entrada não cobre contêineres fora
do projeto (`educa-teste-caddy-*` e afins) nem conteúdo em serviço com estado; (7) o RF2 não tem
número de execuções nem regra de parada — o achado G da rodada 1, que sumiu na reescrita.


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-21 12:34:34 | 2026-09-21 12:39:42 | `test-engineer` | 1 | REPROVADO | ac942db4202400710 |
| 2026-09-21 12:34:50 | 2026-09-21 12:39:47 | `infra-guardian` | 1 | REPROVADO | a9ed776a98d02592a |
| 2026-09-21 12:44:17 | 2026-09-21 12:47:59 | `test-engineer` | 2 | REPROVADO | a10f2241275898c9c |
| 2026-09-21 12:44:32 | 2026-09-21 12:49:40 | `infra-guardian` | 2 | REPROVADO | a445ca6333462ea24 |
| 2026-09-21 12:54:03 | 2026-09-21 12:57:55 | `test-engineer` | 3 | REPROVADO | a5ec0329fc69f0363 |
| 2026-09-21 12:53:50 | 2026-09-21 12:58:15 | `infra-guardian` | 3 | REPROVADO | ab008ee7e81ccc463 |
| 2026-09-21 13:02:39 | 2026-09-21 13:06:04 | `infra-guardian` | 4 | REPROVADO | afcb0455df6d69dda |
| 2026-09-21 13:02:52 | 2026-09-21 13:07:30 | `test-engineer` | 4 | REPROVADO | ae2d82b88d358d72c |
| 2026-09-21 14:03:04 | 2026-09-21 14:08:11 | `test-engineer` | 5 | REPROVADO | adec63aaf894927a2 |
| 2026-09-21 14:03:16 | 2026-09-21 14:08:14 | `infra-guardian` | 5 | REPROVADO | ac5872aa6fbf5186e |
