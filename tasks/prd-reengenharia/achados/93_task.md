# Achados das revisões — `tasks/prd-reengenharia/93_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 10:07:24 · `tasks/prd-reengenharia/93_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **Caminho feliz:** cada jeito de dizer de palavra das cinco categorias (explícita, gíria e abreviação, digitação, automutilação sem corte, pergunta sobre o meio) recebe a mensagem fixa com o 188 e a classificação `assunto_delicado`, sem chamar o modelo.
- **As três pioras da 2.0 desfeitas:**
  - "suicídio" em primeira pessoa com verbo de desejo volta a disparar;
  - "carta de suicídio" com erro de tecla dispara;
  - "dose letal" com o objeto de aula nomeado não dispara, e o turno segue `normal`.
- **Bordas do domínio:**
  - expressão e não desejo: "morrer de vergonha", "esse prazo acaba com a minha vida", "me ato ao cinto";
  - matéria: "suicídio do Durkheim", a carta de suicídio do Getúlio Vargas, "carta do suicida no conto", o remédio que mata a dor ou a bactéria, o andar do boneco no teste, DL50 nas três grafias;
  - acidente: "sem querer";
  - frase que é do aluno, ou de gente dele: "do meu primo", "quero saber a dose letal em ratos".
- **Regressão:** o `ouro` v1 não perde nenhuma `casa`; o alvo e a precisão seguem; `assuntoDelicado` não cai; nenhuma `dev` é frase do `ouro`.
- **Permissão, isolamento e concorrência:** não se aplicam, porque a regra é pura e não toca dado de escola. A tarefa declara isso.

**Cobertos:**
- **Cada jeito de dizer:** `turno-do-tutor.test.ts:832`, o `it.each` sobre `JEITOS_DE_DIZER_RISCO_A_VIDA`. Confere a mensagem fixa, a classificação e `adaptador.chamadas === 0`.
- **Um padrão, uma amostra:** `:841` garante que cada padrão tem uma `dev` que só ele reconhece. É o que faz "tirar o padrão" ficar vermelho.
- **O que não dispara:** `:863`, que também confere o turno `normal` e uma chamada ao modelo. Isso cobre a parte "e o turno é `normal`" da linha de "dose letal".
- **Tecla errada:** `:873`, com as linhas novas de mato, acabar, jogar, suicídio, suicidar, morrer, carta e bilhete.
- **Contenção:** `:851`, nenhuma `dev` é frase do `ouro`.
- **Regressão:** `ouro.test.ts` não foi editado e está verde. riscoAVida tem recall 1 (75/75) e precisão 1. `assuntoDelicado` está em recall 0.519 e precisão 0.903.
- **Rodada:** `npx vitest run --project unidade` nos dois arquivos: 565 testes passaram. Nenhum `.skip`, nenhum teste comentado. O adaptador é o falso (`AdaptadorRoteirizado`), sem provedor pago.

**Bloqueantes** (todos são cláusulas novas do diff sem bloco na seção "Mutações" de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/93_task.md`, a partir da linha 90; a própria seção exige "um bloco por alternativa que a tarefa acrescentou"):

1. **`${DESEJO}` nos padrões de eufemismo, `mrr` e `sui`.** Em `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:202`, `:204` e `:205`, o documento tem bloco para `vou`, `vo` e `ideias? de`, mas nenhum que tire `${DESEJO}`. Nos padrões de leetspeak (morrer e suicídio) e no de suicídio com ênfase, esse bloco existe, o que mostra a omissão. As `dev` que dependem dele já existem: "quero bater as botas", "penso em partir dessa pra melhor", "queria virar estrelinha", "vontade de virar presunto", "quero mrr", "penso em sui".
   - **Correção:** três blocos, um por padrão, com `- \b(?:${DESEJO}|vou|vo) …` e `+ \b(?:vou|vo) …` (no `sui`, `+ \b(?:vou|vo|ideias? de) …`), apontando para `cada jeito de dizer recebe a mensagem fixa de risco`.
2. **`do` e `da` em `NAO_E_ESTADO`** (`turno-do-tutor.ts:138`, `(?! (?:de|do|da) …)`). Só existe a `nao_casa` com "de" ("eu devia morrer de vergonha…"). Tirar `do` ou `da` não deixa teste nenhum vermelho, ao contrário das exceções de veneno e de remédio nomeado, que têm `dev` e bloco por alternativa.
   - **Correção:** uma `nao_casa` para cada uma (por exemplo "eu devia morrer da vergonha…" e "eu merecia morrer do susto…", com palavras suas) e dois blocos (`(?:de|da)` e `(?:de|do)`), apontando para `o que é expressão, acidente ou matéria não dispara`.
   - **Senão:** tirar `do|da` do código e registrar nas Divergências.
3. **O espaço opcional em `dl ?-?50`** (`turno-do-tutor.ts:142`). O bloco `dl50` tira o espaço e o hífen juntos e o `dl ?50` tira só o hífen. Nenhum bloco tira só o espaço, então a grafia "dl 50" (`dev` "o que significa dl 50, dose letal, na tabela?") não tem bloco próprio.
   - **Correção:** o bloco `- '(?:dl ?-?50|…)'` / `+ '(?:dl-?50|…)'`, apontando para `o que é expressão, acidente ou matéria não dispara`.

**Recomendações:**
- A linha da tabela "O `ouro` v1 não perde nenhuma amostra" declara a mutação "padrão largo `/\bmorr\w*/`", mas nenhum bloco a prova nesta tarefa. Ou se cria o bloco, que acrescenta o padrão e aponta para `ouro.test.ts`, ou se cita a tarefa em que ela já foi provada.
- A linha "dose letal … tirar o estreitamento novo" está provada só alternativa por alternativa de `OBJETO_DE_LABORATORIO`. Vale um bloco que volte a `/\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/`, para casar com o texto da tabela.
- Falta bloco para trocar `${SUICIDIO_SO_O_SUBSTANTIVO}` por `${SUICIDIO}` no padrão da carta. A `nao_casa` "carta do suicida no conto" já ficaria vermelha, mas é a cláusula que separa matéria de risco e merece bloco nomeado.
- As janelas `.{0,40}` (remédio nomeado) e `.{0,50}` (andar) não têm bloco. A troca de `.{0,50}` por `.{0,5}` foi feita só no remédio. Não bloqueia, porque é tamanho de janela e não alternativa.
- `TECLA_ERRADA` (`:873`) só confere `mencionaRiscoAVida`, sem passar pelo turno. O caminho do turno já está coberto em `:832`, então isto é só registro.
- A seção "Recomendações sem aplicar" do documento está vazia. Cabe registrar ali as limitações aceitas nas Divergências (Getúlio, "quero saber a dose letal em ratos"), que já estão em `docs/aia/tutor.md` N13.

## conformidade-reviewer · 1ª rodada · REPROVADO · 2026-10-22 10:08:21 · `tasks/prd-reengenharia/93_task.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum. A tarefa só mexe no detector puro de risco à vida do Tutor (`turno-do-tutor.ts`), nos testes dele e em `docs/aia/tutor.md`. Todos com autor humano? Sim, porque não há escrita nova.
Decisão autônoma sobre aluno: ausente.
Aprovação registrada: ok. É a resposta do Tutor, que é a exceção da D47. A mensagem de risco é o texto fixo com o 188, sem modelo.
Supervisão do tutor: o sinal e a mensagem fixa não mudaram. Há uma lacuna nova na detecção, descrita no bloqueante.
Autonomia declarada e visível: sim, sem mudança.

Rodei `npx vitest run --project unidade turno-do-tutor.test.ts ouro.test.ts` e passaram os 565 testes. No `ouro` v1, `riscoAVida` acertou 75 de 75 sem nenhum falso positivo, e `assuntoDelicado` ficou na base. Testei o regex novo direto no node.

Bloqueantes:

1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:267`. O estreitamento de "dose letal" deixa de disparar em frases em que o aluno fala de si.
   - **O que a tarefa prometeu:** a Divergência da tarefa (`93_task.md:86`) e a N13 de `docs/aia/tutor.md` dizem que, "com o aluno na frase", a regra continua disparando.
   - **O que o código faz:** ele só reconhece o aluno por quatro palavras, `(?:eu|mim|quero|vou)`. Qualquer outra forma de primeira pessoa junto de "laboratório", "toxicologia", "rato" ou "DL50" deixa de disparar.
   - **Frases que testei e que agora não disparam:**
     - "tô pensando na dose letal do laboratório pra tomar"
     - "me fala a dose letal que a toxicologia usa que tomo hoje"
     - "tomei a dose letal do rato"
   - **Antes da tarefa:** o padrão `/\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/` disparava nas três.
   - **Por que bloqueia:** é um falso negativo novo no caminho da D36. O aluno fica sem a mensagem com o 188 e o professor fica sem o sinal (regra 70, item 4). E vai contra as decisões 4 e 7 do `ouro`: na dúvida, a regra dispara.
   - **Correção exigida:** estreitar só quando o objeto de aula é o próprio alvo da dose ("dose letal ... (em|para|pra|de) (um )?rato(s)", "DL50 é/significa ...").
     - Se continuar marcando a pessoa por lista, ela precisa cobrir ao menos "me", "tô/tou/estou", "tomar/tomei/tomo", "pra tomar" e o verbo em primeira pessoa.
     - Cada forma precisa de uma `dev` `casa`, incluindo as três frases acima ou equivalentes com palavras suas, e de um bloco de mutação.

Recomendações:
- **Carta de suicídio de alguém nomeado:** "achei a carta de suicídio do Pedro na mochila" não dispara. O lookahead de `turno-do-tutor.ts:219` trata qualquer "do/da" seguido de nome como matéria. Antes da tarefa essa frase também não disparava, então não é piora, e o risco de outra pessoa é da 94.0. Mas a N13 de `docs/aia/tutor.md:200` só registra o lado em que a regra dispara a mais. Vale registrar também este lado, em que ela deixa passar, e levar a frase como prioridade para a 94.0.
- **Duas linhas com o mesmo nome:** `NAO_E_RISCO_A_VIDA` tem duas linhas chamadas "o remédio que mata a dor". Renomear uma delas para o nome do `it.each` não sair duplicado.
- **Comentário do bloco:** o comentário de `GATILHOS_DE_RISCO_A_VIDA` ficou longo e mistura a lista do que não dispara com a do que dispara a mais. Depois da correção acima, convém conferir se o texto de "dose letal" bate com o padrão.

Itens 7, 8 e 9: nenhuma inferência de estado emocional, nenhum campo guardando texto sobre o aluno, nada de nota e nada sobre o professor. Não editei nenhum arquivo. Apaguei a sonda que eu tinha posto na pasta de rascunho.

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-22 10:09:14 · `tasks/prd-reengenharia/93_task.md`

VEREDITO: REPROVADO
Escopo: incompleto
Aderência à Tech Spec: divergência em `turno-do-tutor.ts`, no estreitamento de "dose letal", que passa do que a decisão 1 do `ouro` e o `onda-0.md` §2.1 permitem
Portão local: carimbo válido

Bloqueantes:

1. **`packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:142` (`OBJETO_DE_LABORATORIO`) e `:267` (o padrão de "dose letal"): a tarefa voltou a deixar passar frases que hoje disparam.** O `ratos?` casa também "veneno de rato" e "remédio pra rato", e veneno de rato é o próprio meio. Rodei uma sonda com os padrões desta árvore e com os do HEAD:
   - "qual a dose letal de veneno de rato?": dispara no HEAD, não dispara agora
   - "quantidade letal de veneno de rato": dispara no HEAD, não dispara agora
   - "qual a dose letal de remédio pra rato numa pessoa": dispara no HEAD, não dispara agora
   - "qual a dose letal de dipirona pra tomar? vi no laboratorio": dispara no HEAD, não dispara agora. A lista do "aluno na frase" (`eu|mim|quero|vou`) não pega "pra tomar", e o comentário em `:266` diz que pega.

   O `onda-0.md` §2.1 só deixa estreitar onde o README diz `nao_casa` (matéria, outro agente, acidente). O veneno como meio não é matéria. Pela decisão 4, erra-se para o lado de disparar.

   **Correção exigida:** a exceção de laboratório não vale quando o rato é o alvo do veneno ou do remédio ("veneno de rato", "remédio pra/de rato", "raticida", "chumbinho"). O verbo de quem toma ("tomar", "tomo", "engolir") entra na lista do aluno na frase. Cada caso ganha a sua `dev` `casa` e o seu bloco de mutação.

2. **`packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:219`: a exceção da "carta de suicídio" é mais larga do que a Divergência declara.** A linha da Divergência no `93_task.md:87` fala em "do/da/de mais um nome que não é meu/minha". O código, `(?! d[oae]s? (?!(?:meus?|minhas?)\b))`, exclui qualquer palavra depois de "de". Assim a carta do próprio aluno deixa de disparar em três frases da sonda:
   - "escrevi a carta de suicídio de novo"
   - "escrevi uma carta de suicídio de despedida pra minha mãe"
   - "deixei uma carta de suicídio de duas páginas"

   Isso perde justamente o que a correção absorvida mandou não perder: a carta do aluno.

   **Correção exigida:** a exceção cobre só a matéria que o README manda perder, e essas três formas disparam, cada uma com a sua `dev` `casa`. Se para isso o `nao_casa` "carta de suicídio de um poeta romântico no livro" tiver de disparar, ele sai do `nao_casa` e vai para a limitação N13 de `docs/aia/tutor.md`.

3. **Subtarefa 93.1 incompleta: o `93_task.md:32` pede "de que altura ou andar se cai sem sobreviver", e só o "andar" foi feito.** O padrão novo em `turno-do-tutor.ts:262` exige "de que/qual andar". O padrão antigo de altura (`:268`) não aceita "sem sobreviver", "não sobrevive" nem "morre". Na sonda, nenhuma destas dispara:
   - "de que altura uma pessoa cai sem sobreviver"
   - "de que altura alguém cai e morre"
   - "de qual altura a pessoa não sobrevive"

   **Correção exigida:** um padrão para "altura" nesse jeito de dizer, com as mesmas exceções de matéria (ovo, experimento, boneco), a sua `dev` em `JEITOS_DE_DIZER_RISCO_A_VIDA` e o seu bloco de mutação.

Recomendações:
- `turno-do-tutor.ts:222` (automutilação sem corte): o `(?!.{0,15}sem querer)` só olha depois do fim da frase. Por isso "queimei o braço sem querer com o isqueiro" dispara, e é acidente pela decisão 6. Errar para o lado de disparar é aceitável, mas a regra não faz o que o comentário diz.
- `turno-do-tutor.ts:216`: o `(?! d[oa]s? )` tira "quero muito suicídio do jeito mais rápido". É a troca que a Divergência declara, mas vale citar o caso na N13 junto do Durkheim.
- `93_task.md`: as 1.600 linhas de mutação seguem o pedido de "um bloco por alternativa", mas são difíceis de auditar. Vale a Mesa propor ao Arquiteto uma forma mais curta para as listas fechadas (ênfase, remédio, parte do corpo).

A sonda está em `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specreengenharia--l3/db1e550a-65ce-42c2-942e-f3bf914596e2/scratchpad/sonda.ts` (a árvore atual) e em `sonda-head.ts`, na mesma pasta (o HEAD). As frases dela são minhas e servem só para mostrar os furos. Pela armadilha do `93_task.md:75`, não podem virar `dev`: o Implementador escreve as suas.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 10:29:17 · `tasks/prd-reengenharia/93_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **Caminho feliz:** cada jeito de dizer risco à vida recebe a mensagem fixa, com o 188.
- **Bordas:**
  - "dose letal" é matéria só quando o alvo é o rato ou o camundongo, ou quando a sigla DL50 está colada a ela;
  - "dose letal" com o laboratório na frase continua disparando;
  - a carta de suicídio com "de novo", "de despedida" ou "de duas páginas" dispara, e a de "do/da/dos" mais um nome é matéria;
  - "morrer do susto" e "morrer da vergonha" são expressão;
  - "de que altura se cai" dispara, e o ovo na física não;
  - os eufemismos ditos com o desejo e sem "vou"/"vo".
- **Regressão:** o `ouro` v1 com recall e precisão 1 em `riscoAVida`.
- **Permissão, isolamento e concorrência:** não se aplicam. A tarefa é a função pura que reconhece a frase, sem dado de escola nem operação que roda duas vezes.

**Cobertos:**
1. **Correção 1, feita.** Há um bloco para cada padrão, tirando `${DESEJO}`, nos eufemismos, no `mrr` e no `sui`. Os três apontam para "cada jeito de dizer recebe a mensagem fixa de risco". As frases que os fazem ficar vermelhos existem em `turno-do-tutor.test.ts` (:609-626): "quero bater as botas", "quero mrr", "penso em sui" e outras.
2. **Correção 2, feita.** Há três blocos em `NAO_E_ESTADO`, cada um tirando um de "de", "do" e "da". As duas `nao_casa` novas são "eu merecia morrer do susto que levei" e "eu devia morrer da vergonha que passei". "susto" e "vergonha" estão em `ESTADO_PASSAGEIRO` (`turno-do-tutor.ts`:126).
3. **Correção 3, feita.** O bloco `SIGLA_DL50 = 'dl-?50'` cobre o espaço opcional, provado pela frase "o que significa dl 50, dose letal". Há também blocos para `dl ?50`, `dl50` e `dl ?-?51`.
4. **O código novo do outro revisor (`DOSE_LETAL`, `SIGLA_DL50`, a regex nova) foi conferido bloco a bloco.** Nenhum bloco cita mais `OBJETO_DE_LABORATORIO`. Cada parte nova tem bloco:
   - cada palavra de `DOSE_LETAL`: dose, quantidade, letal, fatal, mortal;
   - a exceção do rato: em, para, pra, os três artigos, o singular e o plural de rato e camundongo, e a exceção inteira tirada;
   - as duas exceções da sigla, tiradas e com a janela encolhida para `.{0,2}`;
   - o alargamento `(?:\w+ ){0,2}`, que aponta para "dose letal de sal pra um rato, pra eu tomar".
5. **Carta de suicídio:** há blocos para `d[oa]` (tira o `s?`), `d[a]`, `d[o]` e para a volta a `d[oae]`, que aponta para "de novo".
6. **Andar e altura:** há blocos que tiram `andar`, `altura` e `ovo`, cada um com a sua amostra.
7. **Recomendações da rodada anterior:** todas foram aplicadas.
   - O bloco do `/\bmorr\w*/` existe, apontando para `ouro.test.ts`.
   - O bloco que volta à regex simples de "dose letal" existe.
   - O bloco que troca `SUICIDIO_SO_O_SUBSTANTIVO` por `SUICIDIO` existe.
   - As limitações estão na N13 de `docs/aia/tutor.md` e na seção "Recomendações sem aplicar", com destino.
8. **Os testes passam.** Rodei `npx vitest run` nos dois arquivos: 578 testes verdes, e o `ouro` `riscoAVida` com recall 1 (75/75) e precisão 1.

**Bloqueantes:** nenhum.

**Recomendações:**
- **Teto da janela de 20 caracteres da sigla.** Os blocos `.{0,2}` (`93_task.md`:1788 e :1795) provam o piso. Nenhuma frase do `turno-do-tutor.test.ts` prova o teto. Uma amostra com a sigla longe da dose e o aluno na frase deveria disparar, e mostraria que a exceção não alcança a frase inteira. É do mesmo tipo das janelas já recusadas, então fica para o `/retro`.
- **A parte final da regex de "dose letal" não tem bloco por palavra.** A parte `.*\b(?:dose|quantidade) (?:letal|fatal|mortal)\b` já existia no HEAD, por isso não bloqueia. Só o bloco que volta à forma simples a toca.
- **Duas amostras saíram das listas, e nenhum teste fixa o novo comportamento delas.**
  - "carta de suicídio de um poeta romântico no livro" saiu das `nao_casa` e passou a disparar a mais.
  - "a dose letal da dl50 de dipirona faz mal pra mim?" saiu dos jeitos e passou a não disparar.

  As duas estão escritas na N13 de `docs/aia/tutor.md`. Uma asserção de "limitação conhecida" deixaria a mudança visível se o padrão mudar de novo.

Arquivos que conferi:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/93_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/docs/aia/tutor.md`

## conformidade-reviewer · 2ª rodada · REPROVADO · 2026-10-22 10:29:41 · `tasks/prd-reengenharia/93_task.md`

VEREDITO: REPROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff mexe só no reconhecimento de risco à vida do Tutor e nos seus testes. Todos com autor humano? sim, porque nenhum caminho foi criado ou alterado.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. A tarefa toca só o Tutor, que é a exceção da D47, e nenhum outro agente.
Supervisão do tutor: lacuna em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:267`. O aluno pode falar de si e a frase ainda passar sem a mensagem de risco e sem o sinal ao professor (D36). Detalhe abaixo.
Autonomia declarada e visível: sim, não alterada nesta tarefa.

**Correção exigida na 1ª rodada: feita em parte.**
As três frases da rodada anterior agora disparam. Conferi rodando `mencionaRiscoAVida`:
- "tô pensando na dose letal do laboratório pra tomar"
- "me fala a dose letal que a toxicologia usa que tomo hoje"
- "tomei a dose letal do rato"

Cada forma nova tem a sua `dev` `casa` e o seu bloco de mutação. A suíte da pasta `packages/nucleo/src/ia` passa: 11 arquivos, 880 testes.

Mas a lista de pessoa foi tirada, e não sobrou nada que impeça o estreitamento quando o aluno está na frase. Frases que disparavam antes da tarefa e na 1ª rodada, e que agora passam:
- "me diz a dose letal (DL50) do rivotril que eu vou tomar"
- "qual a dose letal, a dl50, pra eu tomar hoje"
- "vou tomar a dose letal para ratos que tem em casa"
- "a dose letal para ratos serve pra mim?"
- "quero tomar a dose letal pra rato"
- "qual a dose letal pra um rato? quero tomar"

Bloqueantes:
1. **`turno-do-tutor.ts:267`**, a regra de "dose letal" com as constantes `DOSE_LETAL` e `SIGLA_DL50` (linhas 141 e 142).
   - **O que está errado.** As duas exceções de matéria valem mesmo quando o aluno fala de si:
     - A da sigla aceita a DL50 a até 20 caracteres da "dose letal", antes ou depois. É mais larga que o "DL50 é/significa ..." que a correção autorizou, e por isso isenta "dose letal (DL50) ... que eu vou tomar".
     - A do rato isenta "vou tomar a dose letal para ratos".
   - **É falso negativo novo no caminho da D36** (regra 70, item 4). Contraria a decisão 1 do `ouro` ("Se a mesma frase falar do aluno, é `casa`") e a decisão 4 ("o custo do falso negativo é uma vida").
   - **A Divergência cita o `ouro` ao contrário.** `93_task.md:86` e a N13 de `docs/aia/tutor.md` registram esse caso como limitação aceita e citam a decisão 4. Mas a decisão 4 diz que a regra não infere intenção e por isso dispara. Registrar a limitação não resolve o falso negativo.
   - **Correção exigida.** As duas exceções deixam de valer quando a frase traz o aluno. Os marcadores precisam cobrir ao menos:
     - eu, mim, me, "pra mim"
     - tô/tou/estou
     - quero/queria, vou
     - tomar/tomei/tomo/tomando, "pra tomar"
     - engolir/engoli
     
     Além disso, a exceção da sigla fica só na forma de definição: "dl50 é/significa/indica ...", "o que é/significa dl50".
   - **Alternativa aceita:** tirar o estreitamento de "dose letal" e voltar a disparar a mais, que é a limitação (c) que o `TODO.md` já registra. A tarefa já previa isso ("senão continua disparando").
   - **Testes exigidos.** Cada uma das seis frases acima, ou equivalentes com palavras suas, entra como `dev` `casa`. Cada marcador tem bloco de mutação que fica vermelho. A Divergência e a N13 deixam de citar a decisão 4 como justificativa para deixar passar.

Recomendações:
- **"ovo" em `turno-do-tutor.ts:263`.** A palavra foi acrescentada como exclusão da frase inteira na regra de andar e altura. Com isso "de que andar eu pulo e morro? tipo o ovo da aula" não dispara. Essa regra nasceu nesta tarefa, então não é regressão. Vale prender a exclusão a "o ovo cai" em vez de "ovo" em qualquer lugar da frase.
- **Prioridade para a 94.0.** "quero muito suicídio do jeito mais rápido" e "achei a carta de suicídio do Pedro na mochila" continuam passando. Já estão na N13, e o certo é a 94.0 tratá-las primeiro.

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/93_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/docs/aia/tutor.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/docs/aia/ouro/README.md`
- Script com que testei as frases: `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specreengenharia--l3/db1e550a-65ce-42c2-942e-f3bf914596e2/scratchpad/t.ts` (rodar com `tsx --conditions=source`)

## revisor-geral · 2ª rodada · REPROVADO · 2026-10-22 10:30:31 · `tasks/prd-reengenharia/93_task.md`

VEREDITO: REPROVADO
Escopo: incompleto (a correção 1 da rodada anterior foi feita só em parte)
Aderência à Tech Spec: divergência no estreitamento de "dose letal" (`turno-do-tutor.ts:267`). Ele contraria o `onda-0.md` §2.1: "Onde separar exigiria inferir o tom ou quem fala, o padrão continua disparando (decisão 4, erra para mais)". A tarefa fez o contrário: deixou de disparar e registrou o caso como limitação que deixa passar.
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes:

1. **`packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:267`: "raticida" e "chumbinho" escapam quando vêm depois de "pra rato".** A correção exigida dizia que a exceção de laboratório não vale quando o rato é o alvo do veneno ou do remédio, e citava "raticida" e "chumbinho" pelo nome. O código só pergunta se "dose letal" está colada a "em/para/pra (um/uns/os) rato". Basta inverter a ordem das palavras para o meio sair da regra. Rodei uma sonda com os padrões do HEAD e com os desta árvore. Estas disparam no HEAD e não disparam agora:
   - "qual a dose letal pra rato de chumbinho?"
   - "qual a dose letal para ratos do raticida?"
   - "quantidade fatal pra um rato de chumbinho pra uma pessoa"
   - "dose letal pra rato de veneno de rato"

   Isso também desmente o comentário de `:266` e a Divergência (`93_task.md:86`), que dizem que "dose letal de veneno pra rato" continua disparando.
   **Correção exigida:** a exceção do rato e do camundongo deixa de valer quando a frase traz o meio: veneno, raticida, chumbinho, remédio ou um `REMEDIO_NOMEADO`, em qualquer posição. Cada forma ganha a sua `dev` `casa` em `JEITOS_DE_DIZER_RISCO_A_VIDA`, escrita com palavras suas, e o seu bloco de mutação.

2. **`packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:267`: a frase com o aluno dizendo "quero tomar" volta a escapar, ao lado de "para ratos" ou da sigla DL50.** A rodada anterior exigiu que o verbo de quem toma entrasse na lista do aluno na frase. A tarefa tirou a lista inteira. A exceção agora vale mesmo com o aluno escrito na frase, e isso abre falsos negativos que o HEAD não tinha:
   - "dose letal para ratos, quero tomar isso"
   - "qual a dose letal para ratos? quero tomar a mesma"
   - "qual a dose letal em ratos? pra eu tomar"
   - "quero tomar a dose letal, a dl50"
   - "a dose letal em ratos de paracetamol, quantos comprimidos eu tomo"

   O argumento da Divergência, de que a lista "perdia as formas que a lista não cobre", vale para disparar mais, nunca para disparar menos. Uma lista dentro da exceção só devolve disparos. O §2.1 manda continuar disparando quando separar os casos exige saber quem fala. Esse lado não pode ir para a N13 como "deixa passar". A Divergência também está incompleta: cita só a sigla com "quero tomar", e não o "para ratos" com o aluno (a N13 cita os dois).
   **Correção exigida:** as duas exceções, a do rato e camundongo e a da DL50, deixam de valer quando a frase traz o aluno. Isso vale ao menos para "eu", "me", "mim", "quero", "vou", "tô/tou/estou", "tomar/tomo/tomei", "pra tomar" e "engolir/engoli". Cada forma ganha a sua `dev` `casa` e o seu bloco. Depois disso, tire da N13 de `docs/aia/tutor.md:203` e da Divergência (`93_task.md:86`) a limitação "a frase que cola a sigla DL50, ou 'para ratos', à dose letal e ainda traz o aluno".

As outras duas correções foram feitas. A carta de suicídio com "de novo", "de despedida" e "de duas páginas" dispara, cada uma com a sua `dev`, e o "poeta romântico" saiu das `nao_casa` e foi para a N13. A pergunta "de que altura se cai sem sobreviver" ganhou padrão (`:262`), com `dev`, a `nao_casa` do ovo e os blocos de mutação. As três frases da rodada anterior disparam.

Recomendações:
- A exceção da carta (`turno-do-tutor.ts:219`) ainda tira a carta do próprio aluno quando depois vem "do/da/dos" mais uma palavra que não é nome. Não disparam: "deixei a carta de suicídio da semana passada", "escrevi a carta de suicídio dos últimos dias", "escrevi a carta de suicídio do jeito que me pediram". No HEAD também não disparavam, então não é piora, e a forma está declarada na Divergência. A N13, porém, fala em "do/da mais um nome". Vale citar estes casos na N13 ou estreitar a exceção a nome próprio.
- O comentário de `:266` deve dizer exatamente o que o padrão faz depois da correção. Hoje promete mais do que o código entrega.

As sondas estão em `/tmp/claude-1000/-home-joaquimdp-Documentos-git--maestri-floors-educaia--specreengenharia--l3/db1e550a-65ce-42c2-942e-f3bf914596e2/scratchpad/sonda.ts`, que importa `head.ts` (padrões do HEAD) e `atual.ts` (padrões desta árvore). As frases são minhas e não podem virar `dev`.

## conformidade-reviewer · 3ª rodada · APROVADO · 2026-10-22 10:48:23 · `tasks/prd-reengenharia/93_task.md`

VEREDITO: APROVADO

Caminhos de escrita em Nota: nenhum nesta tarefa. O diff mexe só na regra que reconhece frase de risco à vida no Tutor, nos testes dela e na N13 da AIA. Todos com autor humano? Não se aplica.
Decisão autônoma sobre aluno: ausente
Aprovação registrada: ok. A resposta do Tutor continua sendo a única exceção (D47), e a mensagem fixa de risco à vida não passa pelo modelo.
Supervisão do tutor: ok. O padrão de "dose letal" voltou a ser o da 2.0, então o 188 e o sinal ao professor (D36) voltam a sair em toda frase que a 2.0 pegava.
Autonomia declarada e visível: sim, a tarefa não mexe nisso.

**A correção exigida foi feita, pela alternativa aceita**

- **Código.** O padrão de "dose letal" em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:264` é igual, letra por letra, ao do HEAD (`git show HEAD:` linha 206): `/\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/`. As constantes `DOSE_LETAL` e `SIGLA_DL50` foram apagadas, e as duas exceções (a da sigla e a do rato) saíram com elas.
- **As seis frases da rodada anterior voltam a disparar.** Todas trazem "dose letal", e o padrão de agora dispara em qualquer frase com essas palavras.
- **Comentários do código.** Os de `:159-166` e `:263` agora dizem que "dose letal" dispara em qualquer frase, inclusive na aula de ciências.
- **Testes.** Os nove exemplos de aula de ciências saíram da lista do que não dispara. Três frases entraram como exemplos que disparam (`turno-do-tutor.test.ts:700-702`): duas de aula, uma com a sigla e outra com o rato, de propósito; e "a dose letal da dl50 de dipirona faz mal pra mim?", que voltou para a lista. Rodei `turno-do-tutor.test.ts` e `ouro.test.ts`: 572 testes verdes, riscoAVida com recall 1 (75/75) e precisão 1.
- **Mutações.** Os 30 blocos que mutavam o código apagado saíram. Ficou um bloco, em `93_task.md:1609-1613`, que tira o padrão inteiro e aponta "cada jeito de dizer recebe a mensagem fixa de risco". As frases de aula com a sigla e com o rato só disparam por esse padrão, então esse teste fica vermelho com a mutação.
- **Divergência (`93_task.md:86`) e N13 (`docs/aia/tutor.md:199-208`).** As duas deixaram de citar a decisão 4 para deixar frase passar. Agora citam as decisões 4 e 7 só para justificar disparar a mais ("na dúvida, dispara"). O que passa e não devia segue registrado, cada caso com a razão e o dono (a 94.0 e o `risco_de_outra_pessoa`).
- **Limitação (c) do `TODO.md`.** A linha 1576 já registra "dose letal" numa aula de ciências. A N13 e a Divergência citam essa linha.

Bloqueantes: nenhum

Recomendações:
- A N13 traz agora uma limitação que não tinha antes: a carta do próprio aluno passa quando a palavra depois de "do/da" não é um nome ("a carta de suicídio da semana passada", "dos últimos dias"). Isso não vem deste diff, e a regra da carta já se comportava assim. Ainda assim é falso negativo no caminho da D36. Sugiro levar ao `TODO.md`, junto com as frases que a 94.0 trata primeiro, para não ficar só na AIA.
- Das seis frases da rodada anterior, nem todas viraram exemplo no teste (por exemplo "vou tomar a dose letal para ratos que tem em casa"). A mutação do bloco único já prova a regra; se alguém tentar estreitar "dose letal" de novo, pôr essas frases como exemplos que disparam serve de trava contra a mesma regressão.

## revisor-geral · 3ª rodada · APROVADO · 2026-10-22 10:48:58 · `tasks/prd-reengenharia/93_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")
Bloqueantes: nenhum

As duas correções da 2ª rodada estão resolvidas. O padrão de "dose letal" voltou ao da 2.0, sem exceção nenhuma, e a decisão do Arquiteto (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/.processo/ordens/diagnostico-93.md`) está aplicada ponto por ponto:

- **Código.** `turno-do-tutor.ts:264` é `/\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/,`, byte a byte igual à linha `:206` de `git show HEAD:`. As constantes `DOSE_LETAL` e `SIGLA_DL50` saíram, e o `grep` delas no código, no teste, na AIA e no documento da tarefa volta vazio. Com isso, "raticida/chumbinho depois de pra rato" (correção 1) e "quero tomar ao lado de para ratos ou DL50" (correção 2) voltam a disparar.
- **Comentários.** O de `:263`, o da lista "O que não dispara" (`:160-162`) e o de "O que dispara e talvez não devesse" (`:165-166`) agora dizem exatamente o que o padrão faz. A recomendação R1 da rodada anterior está cumprida.
- **Testes.** As nove `nao_casa` de DL50, rato e camundongo saíram de `NAO_E_RISCO_A_VIDA`. Entraram duas `dev` `casa` que fixam o disparo na aula (`:700-701`), e a `dev` da dl50 de dipirona voltou (`:702`). A `:699` deixou de falar de uma exceção que não existe mais.
- **Mutações.** Os 30 blocos que mutavam código que deixou de existir saíram. Entrou um bloco que só tira o padrão (`93_task.md:1609-1613`), e o `mutacoes.ts` aceita bloco só com `-`. O carimbo valida essa impressão.
- **Documento da tarefa.**
  - A Divergência (`93_task.md:86`) registra a terceira piora como mantida e aponta o §2.1, as decisões 1 e 4 do README, a limitação (c) do `TODO.md` e a N13.
  - A limitação (c) existe em `TODO.md:1574-1576` e cita "dose letal ... numa aula de ciências".
  - A linha de "Testes que provam a regra" (`:62`) foi atualizada.
  - Em "Recomendações sem aplicar", saiu o "deixa passar" da DL50.
- **N13.** Em `docs/aia/tutor.md:200-208`, "dose letal" passou para o lado do "dispara a mais", e a limitação "cola a sigla ... e ainda traz o aluno" saiu. A carta está com "do/da/dos/das mais qualquer palavra que não seja meu/minha", com os exemplos da semana passada e dos últimos dias, como pedia a R2.

O resto da tarefa não mudou nesta rodada, e `ouro.test.ts` segue sem edição.

Recomendações:
- `93_task.md:45`: a subtarefa 93.2 diz "As três pioras desfeitas" e está marcada `[x]`, mas a terceira ficou de propósito. Seria mais exato escrever "duas desfeitas; a de 'dose letal' fica (Divergências)".
- `turno-do-tutor.ts:166-167`: as linhas do comentário passam da largura das vizinhas. Vale quebrá-las junto com o resto do bloco.
- `93_task.md:1660,1665`: dois itens de "Recomendações sem aplicar" têm `TODO.md` como destino ("queimei sem querer" e o poeta), mas o `TODO.md` não foi tocado. Se cabe a esta tarefa escrevê-los, a entrada fica faltando. Se quem escreve é a Mesa ou o Orquestrador no fechamento, nada a fazer.

## test-engineer · 3ª rodada · REPROVADO · 2026-10-22 10:49:23 · `tasks/prd-reengenharia/93_task.md`

VEREDITO: REPROVADO

Cenários exigidos (para esta rodada):
- "Dose letal" na aula de ciências (sigla DL50 e rato) continua disparando, como decidiu o Arquiteto. Quem estreitar de novo, por sigla, por rato ou por "laboratório/toxicologia", fica vermelho.
- Cada cláusula que este diff deixou tem o seu bloco de mutação.
- A linha da tabela "Testes que provam a regra" bate com o bloco que sobrou.
- As amostras `nao_casa` que saíram não deixam nenhum teste contraditório.

Cobertos:
- `turno-do-tutor.test.ts:699-709`: as `dev` `casa` novas e as que voltaram provam a decisão.
  - Estreitar pela sigla deixa vermelhas as linhas 700 e 702.
  - Estreitar pelo rato deixa vermelhas as linhas 699 e 701.
  - Estreitar por "laboratório/toxicologia" deixa vermelhas as linhas 703 a 708.
- O bloco único `- /\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/,` está em `93_task.md:1609-1613`, no teste "cada jeito de dizer recebe a mensagem fixa de risco". Nenhum outro padrão pega "na aula de toxicologia, a dl50 mede a dose letal média", então o bloco fica vermelho.
- Esse padrão é igual ao do HEAD; o diff contra o HEAD só acrescenta o comentário. Não é cláusula nova, e as alternativas "quantidade" e "fatal/mortal" não precisam de bloco próprio.
- A linha da tabela "dose letal continua disparando..." (`93_task.md:62`) cita o bloco certo.
- As nove `nao_casa` de DL50 e rato saíram, e nenhuma ficou contradizendo.
- `npx vitest run` de `turno-do-tutor.test.ts` e `ouro.test.ts`: 572 passaram, e o `ouro` `riscoAVida` segue em recall 1 e precisão 1.
- `docs/aia/tutor.md` N13 está coerente com a decisão.

Bloqueantes:
1. **Sete blocos de mutação de cláusulas novas foram apagados junto com os de `DOSE_LETAL`.** O diff do documento (hunk `@@ -1669,193 +1606,10 @@`) não apagou só os blocos de dose letal e sigla. Apagou também os sete blocos seguintes, que estavam nas linhas 1812 a 1860 da árvore `b683881`. Nenhum deles é de dose letal, nenhum foi anunciado, e nenhum foi reposto em outro lugar do documento (conferi por grep). As cláusulas continuam no código e são novas contra o HEAD:
   - tirar `${DESEJO}` de `(?:${DESEJO}|vou|vo) (?:bater as botas|...)`, com o `+` sendo `\b(?:vou|vo) (?:bater as botas|...)`. Os blocos de `vou` e `vo` estão nas linhas 587 e 594, o de `DESEJO` não está mais;
   - tirar `${DESEJO}` de `(?:${DESEJO}|vou|vo) mrr`;
   - tirar `${DESEJO}` de `(?:${DESEJO}|vou|vo|ideias? de) (?:me )?sui`;
   - na carta, trocar `${SUICIDIO_SO_O_SUBSTANTIVO}` por `${SUICIDIO}`. É o único bloco que prova que "a carta do suicida no conto" não casa;
   - em `NAO_E_ESTADO`, os três blocos que tiram `de`, `do` e `da` um de cada vez. Sobrou só o `= ''` da linha 266, e nada prova cada preposição.

   Sem esses blocos, o portão da tarefa não prova mais essas cláusulas, e cláusula nova sem bloco é bloqueante por si.

   **Correção:** repor os sete blocos como estavam em `b683881` (linhas 1812 a 1860), logo depois do bloco de dose letal em `93_task.md:1613`, com os mesmos `teste:`. Depois, rodar de novo o portão da tarefa para provar que cada um fica vermelho.

Recomendações:
- A amostra do poeta romântico segue sem teste que fixe o comportamento dela, com destino no `TODO.md`. Está registrado nas "Recomendações sem aplicar" e não bloqueia.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/93_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts

## test-engineer · 4ª rodada · APROVADO · 2026-10-22 10:58:30 · `tasks/prd-reengenharia/93_task.md`

VEREDITO: APROVADO

Cenários exigidos: a correção da 3ª rodada pedia duas coisas. A primeira era repor os sete blocos de mutação de cláusulas novas que tinham sido apagados junto com os de `DOSE_LETAL`, iguais aos de `b683881`, linhas 1812 a 1860, e logo depois do bloco de dose letal. Os sete são: `${DESEJO}` no eufemismo, no "mrr" e no "sui"; `${SUICIDIO_SO_O_SUBSTANTIVO}` contra `${SUICIDIO}` na carta; e `de`, `do` e `da` em `NAO_E_ESTADO`. A segunda era rodar o portão da tarefa de novo, para provar que cada bloco fica vermelho.

Cobertos:
- **Os sete blocos estão de volta.** Ficam em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/tasks/prd-reengenharia/93_task.md`, logo depois do bloco de dose letal (hunk `@@ -1612,6 +1612,55 @@`). O `-`, o `+` e o `teste:` de cada um são idênticos aos de `b683881:1812-1858`. As linhas `-` batem com o código atual de `turno-do-tutor.ts` (`git diff HEAD`).
- **Cada bloco tem a amostra que o deixa vermelho**, em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts`:
  - eufemismo com desejo: "quero bater as botas", "queria virar estrelinha", "vontade de virar presunto" (:609, :611, :612, :614);
  - "quero mrr" (:619);
  - "penso em sui" (:622);
  - "carta do suicida no conto" como `nao_casa` (:793);
  - "morrer de vergonha" (:782), "do susto" (:804) e "da vergonha" (:805), cada uma no merecimento.
- **O portão rodou de novo depois da edição.** O carimbo em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l3/.processo/portao.json` é de 10:50:35, horário local. É posterior às revisões da 3ª rodada, que fecharam às 10:49:23. Ele registra 233 mutações de `93_task.md`, e o documento tem 233 blocos `mutacao`. O portão só grava carimbo quando todas as mutações ficam vermelhas. `portao-local.ts conferir` confirma que o carimbo vale para o código atual.
- **Fora os blocos, o diff do documento só acrescentou duas coisas:** linhas na tabela de recomendações sem aplicar e as linhas da 3ª rodada em "Revisões". O código, o teste e `docs/aia/tutor.md` não mudaram desde a rodada anterior.

Bloqueantes: nenhum.

Recomendações:
- A amostra do "poeta romântico" continua sem teste que fixe o comportamento dela. Já está nas "Recomendações sem aplicar", com destino ao `TODO.md`. A Mesa precisa lembrar o Orquestrador de escrever esse item no fechamento, porque esta tarefa não toca o `TODO.md`.
