# Achados das revisões — `tasks/correcoes/2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · REPROVADO · 2026-09-22 20:16:10 · `tasks/correcoes/2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo.md`

VEREDITO: REPROVADO

Rodei as suítes e fiz teste de mutação sobre o diff (árvore restaurada byte a byte no fim; `diff -q` contra cópia em `/tmp/claude-1000/.../scratchpad` confirma). Baseline: 34/34 em `tools/processo/revisoes.test.ts`, estável em 4 corridas.

**Cenários exigidos**
1. Caminho feliz: arquivo mutado e restaurado ao mesmo conteúdo (mtime novo) não caduca rodada nem carimbo — **no `avaliarPortao` e no `portao()`, que é quem bloqueia o commit**.
2. Controle negativo: conteúdo de verdade diferente volta a bloquear nos três (duas rodadas + carimbo).
3. Sem instantâneo (rodada antiga): volta ao `mtime` e bloqueia.
4. Instantâneo de outra chave (documento/revisor/rodada) não serve.
5. Arquivo que o revisor **não viu** (criado depois da rodada, ausente do instantâneo) caduca.
6. Arquivo editado **durante** a corrida do portão local continua bloqueando (código que nenhuma suíte rodou).
7. Concorrência: rodadas terminando ao mesmo tempo não perdem instantâneo (regra 80, item 7).

**Cobertos**
- (1) só na metade: `revisoes.test.ts:383` prova o repasse dentro de `avaliarPortao`. Tirando o instantâneo da rodada, o do portão, ou errando a chave, o caso fica vermelho (mutações confirmadas: `alteracaoQueCaduca(..., daRodada)` → sem o 4º argumento: 1 falha; `avaliarCarimbo(..., CHAVE_DO_PORTAO)` → sem o 4º: 1 falha; `ultima.rodada + 1` na chave: 1 falha). É teste de verdade, não de execução.
- (2) coberto no mesmo caso (`toHaveLength(3)` + `'mudou em'`).
- (3) e (4) cobertos pelos casos antigos que chamam `portaoDe` sem instantâneo.

**Bloqueantes**

1. **`tools/processo/revisoes.ts:688-696` — a fiação do hook não tem teste; é o mesmo defeito uma camada acima.** Mutei `portao()` para `instantaneos: {}` e, em outra rodada, para `documento: undefined`: **34/34 verdes nas duas**. Ou seja, a linha exatamente equivalente à que causou este defeito pode ser removida sem nenhum teste vermelho. Reproduzi o cenário fora do vitest (repo git temporário, `registrar` das rodadas, `gravarCarimbo` + `gravarInstantaneo(CHAVE_DO_PORTAO)`, mutar e restaurar, chamar `portao`): hoje dá `null`; com `instantaneos: {}` dá `Commit bloqueado … apps/codigo.ts mudou em 10:30`; com `documento: undefined` bloqueia a rodada. **Correção exigida:** um caso no describe `hooks sobre um repositório de verdade` (`revisoes.test.ts:249-304` é o molde) que registre as rodadas, carimbe, grave o instantâneo do portão, mute e restaure `apps/codigo.ts` com `mtime` posterior, e exija `expect(portao(commit, raiz)).toBeNull()`, com o controle negativo de conteúdo novo bloqueando. Sem ele, o único caminho que roda de verdade continua sem prova.

2. **`tools/processo/portao-local.ts:59` + `tools/processo/revisoes.ts:448` — passar o instantâneo do portão ao hook remove a última defesa contra carimbo sobre código que nenhuma suíte rodou.** O instantâneo do portão é gravado **depois** das suítes, então arquivo editado no meio da corrida entra nele como se tivesse sido testado. Até ontem o hook não lia o instantâneo e barrava esse caso pelo `mtime` (defesa acidental, mas real). Medido: com carimbo iniciado 14:55, arquivo editado 15:16 e instantâneo com o hash editado — `avaliarCarimbo` sem instantâneo **bloqueia**; com instantâneo **passa**; `avaliarPortao` hoje devolve `[]`. É o defeito que o `TODO.md:294-305` já descreve ("valida sem prova") e que diz, por escrito: "**Vai junto na mesma correção:** `avaliarPortao` chama … sem passar o instantâneo". Esta correção leva metade e desarma a outra. **Correção exigida:** gravar o instantâneo do portão no **início** da corrida em `portao-local.ts` (o conteúdo que as suítes vão rodar), com teste provando que arquivo editado durante a corrida continua bloqueando o commit e que mutar-e-restaurar depois do portão continua passando. Se a decisão for manter o escopo estreito, então o instantâneo do portão não pode ser repassado nesta correção — mas aí a terceira linha do sintoma não é resolvida, então o conserto é o mesmo.

3. **`tools/processo/revisoes.ts:79-82` — arquivo ausente do instantâneo não tem teste que prove que ainda caduca.** É a resposta direta à sua pergunta 3: o `anterior === undefined` é o que garante que arquivo criado depois da rodada (ou nunca hasheado pelo portão) continue caducando. Mutei para "instantâneo presente, arquivo desconhecido conta como inalterado" (`const anterior = instantaneo[alteracao.arquivo] ?? alteracao.hash`, preservando o caminho sem instantâneo): **34/34 verdes**. Com essa semântica, uma rodada valeria para arquivo que o revisor nunca viu, e nada avisaria. **Correção exigida:** caso com instantâneo não vazio que **não** contém o arquivo novo (`apps/worker/src/novo.ts`, `mtime` depois do início da rodada), exigindo bloqueio na rodada e no carimbo.

**Recomendações**

- **Suas perguntas 1 e 2, respondidas:** (1) sim, o caso novo prova a regra nos dois instantâneos — as três mutações ficam vermelhas; (2) a troca de `tocar` por `corrigir` (`revisoes.test.ts:244,283`) consertou um teste que passava pelo motivo errado: revertendo para `tocar` com o código corrigido, `o revisor registra a própria rodada…` fica **vermelho**, porque o hook agora enxerga o conteúdo. Não esconde comportamento — mas é justamente por isso que o comportamento oposto (tocar e não caducar) precisa virar o caso do bloqueante 1: hoje o repositório de verdade só afirma bloqueio, nunca liberação.
- `avaliarPortao` (`revisoes.ts:421-423`): tornar `documento` e `instantaneos` **obrigatórios**. Foi parâmetro opcional que deixou o defeito original passar despercebido; com obrigatório, esquecer o repasse vira erro de compilação, e não silêncio.
- `gravarInstantaneo` (`revisoes.ts:584-589`) faz ler-modificar-gravar em `.processo/conteudo.json` **sem trava do arquivo** — o `comTrava` de `registrar` é do documento, então duas sessões em documentos diferentes, ou `portao-local.ts` gravando junto com um `registrar`, podem perder uma chave. A direção é segura (bloqueio falso, não liberação falsa), mas agora é carregante. Tentei forçar com 6 processos e não reproduzi (a partida do node serializa), o que só diz que é raro. Duas linhas: trava própria no `.processo/conteudo.json` e, no teste paralelo que já existe (`revisoes.test.ts:649`), afirmar que as 6 chaves de rodada sobreviveram.
- **Sua pergunta 3, o outro lado:** o instantâneo da rodada é gravado no **fim** dela (`revisoes.ts:513`), então edição feita enquanto um revisor paralelo ainda roda entra como "visto por ele". Não dá para tapar com `mtime` — a mutação do próprio revisor mora nessa mesma janela —, então é limitação declarada, não bug: vale uma linha no comentário da função e um item no `TODO.md`, junto do item de `portao-local.ts`.
- **Sua pergunta 4:** varri o resto do arquivo. `comTrava` (`:469`) usa `mtime` para trava velha e `alteracoesDeCodigo` (`:568`) usa `mtime` só para o campo `quando` — os dois corretos. `alteracaoQueCaduca` e `avaliarCarimbo` filtram por hora **e depois** por conteúdo, na ordem certa. Fora do `revisoes.ts`, o único consumidor é `portao-local.ts:40` (`conferir`), que já passava o instantâneo. Não achei terceiro lugar decidindo por relógio onde deveria decidir por conteúdo — o que falta é o bloqueante 2, que é o instantâneo decidindo por conteúdo **errado**.
- Entradas de `conteudo.json` nunca são podadas: cresce por documento e por rodada, para sempre. Não atrapalha hoje; vale uma linha de expurgo quando o documento é commitado.

## test-engineer · 2ª rodada · REPROVADO · 2026-09-22 21:09:30 · `tasks/correcoes/2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo.md`

VEREDITO: REPROVADO

Rodei as 38 do arquivo sobre uma cópia da árvore no scratchpad (nada tocado no repositório: `git status` continua com os mesmos 23 arquivos) e fiz 11 mutações mais dois experimentos com o script e com processos em paralelo.

**Cenários exigidos:** caminho feliz do hook com instantâneo; mutar-e-restaurar não caduca rodada nem carimbo; edição de verdade caduca as duas; arquivo ausente do instantâneo caduca; rodada antiga sem instantâneo cai no `mtime`; o portão não carimba conteúdo que as suítes não rodaram, e carimba o do início; **a leitura do conteúdo acontece no início da corrida**; **rodadas terminando ao mesmo tempo não perdem o instantâneo**.

**Cobertos:** os seis primeiros. Mortas as mutações `instantaneos: {}` no `portao()` (1 vermelho), chave de rodada errada (2), `?? alteracao.hash` em `mudouDeVerdade` (6), guarda de `carimbarSeNadaMudou` removida (1), tirar o instantâneo só do `avaliarCarimbo` (2) ou só do `alteracaoQueCaduca` (2), `arquivosQueMudaram` só com as chaves de `antes` (1), `arquivosQueMudaram` devolvendo `[]` (2), chave errada no `gravarInstantaneo` do `registrar` (1) e `documento` errado no `portao()` (1). Os três casos novos provam regra, e nenhum é "rodou e respondeu".

## Bloqueantes

**1. `tools/processo/portao-local.ts:48` — a linha que carrega a segunda metade não tem teste, e removê-la deixa as 38 verdes.** A decisão foi para `carimbarSeNadaMudou` e está provada; o que não está é *onde* o conteúdo é lido. Movi só a linha `const noInicio = …` para depois das suítes, na cópia, e rodei o script de verdade contra um repositório de fixture cujo `test` edita um arquivo no meio da corrida:

- código atual: `exit=1`, `✗ apps/codigo.ts mudou enquanto o portão rodava`, nenhum `.processo`;
- com a linha movida: `exit=0`, carimbo gravado, e `conteudo.json` com `"apps/codigo.ts": "aac6f6c4…"`, que é exatamente o `sha256` do conteúdo **editado no meio** — o defeito do `TODO.md` inteiro de volta, "valida sem prova". **`Tests 38 passed (38)`.**

A justificativa escrita em `revisoes.ts:618` e na tarefa ("lá é script de topo, e provar a decisão exigiria rodar o portão inteiro") não se sustenta: o portão do fixture roda em menos de um segundo, porque quem decide as suítes é o `package.json` da raiz que o script recebe. Correção exigida: um caso que execute `node tools/processo/portao-local.ts` como processo, com `CLAUDE_PROJECT_DIR` num repositório de fixture com `"typecheck": "true"`, `"lint": "true"` e `"test"` escrevendo em `apps/codigo.ts`, afirmando (a) saída diferente de zero, sem `.processo/portao.json` e sem a chave `portao`; e (b) o controle negativo com `"test": "true"` → saída zero, carimbo, e o instantâneo com o hash do conteúdo do início. E ajustar as duas frases que dizem que isso não é testável.

**2. `tools/processo/revisoes.ts:600-604` — `gravarInstantaneo` faz ler-modificar-gravar sem trava, e com as rodadas em paralelo o instantâneo se perde.** Você não reproduziu com 6 processos; reproduzi com o `registrar` de verdade, seis revisores em paralelo sobre seis documentos na mesma árvore (que é como este processo roda: `revisor-geral` com os guardiões em paralelo, e o `TODO.md` ainda tem o item das duas sessões na mesma árvore): **4 de 6 execuções perderam o instantâneo de um revisor** (`frontend-reviewer` sumindo do `conteudo.json` numa delas). Com 10 escritores sintéticos, uma execução ficou com 2 de 10 chaves.

O efeito é o sintoma que esta correção existe para matar: rodada sem instantâneo cai no `mtime` (`mudouDeVerdade` com `anterior === undefined`), e o revisor que fez teste de mutação volta a bloquear o commit. Ou seja, a regra é provada no `avaliarPortao` e furada no caminho que roda de verdade — a mesma forma do defeito original. É a regra 80, item 7, e a casa já tem o idioma: `comTrava` (`revisoes.ts:477`).

Correção exigida: envolver o corpo de `gravarInstantaneo` em `comTrava(join(raiz, CAMINHO_CONTEUDO), …)`, com o `mkdirSync` antes da trava (a trava é um diretório irmão), e **uma asserção no caso paralelo que já existe**, `tools/processo/revisoes.test.ts:732`: `expect(Object.keys(lerInstantaneos(raiz))).toHaveLength(quantos)`. Verificado na cópia: com a asserção e sem a trava, 2 de 5 execuções vermelhas; com a trava, 6 de 6 verdes e as 38 passando. Ordem documento → conteúdo, sem ciclo, igual à da trava do índice.

## Recomendações

- **Mutação que sobrevive e é equivalente:** trocar `gravarInstantaneo(raiz, CHAVE_DO_PORTAO, noInicio)` por `alteracoesDeCodigo(…)` em `revisoes.ts:624` mantém as 38 verdes. É legítimo — depois da guarda os dois conteúdos são idênticos por construção —, então `expect(…).toEqual(instantaneoDe(noInicio))` (`revisoes.test.ts:365`) não prova o "do início" sozinho; quem prova é a guarda, e depois do bloqueante 1, o teste do script. Não precisa de teste novo, mas o comentário do caso pode dizer isso, para ninguém achar que aquela asserção cobre a placement.
- **Sua pergunta 2 — `carimbarSeNadaMudou` fazer o efeito além de decidir: está bem.** A parte pura (`arquivosQueMudaram`, `instantaneoDe`) tem caso próprio em `revisoes.test.ts:454`, e a parte com efeito é provada contra repositório de verdade em `:348`, com asserção sobre os dois lados do estado (carimbo e instantâneo ausentes na recusa, presentes e corretos no sucesso). O único preço é o que virou o bloqueante 1: com o efeito aqui, o script ficou com uma decisão só — e é justo ela que não tem teste.
- A mensagem de recusa não diz o que fazer. Vale terminar com "rode `node tools/processo/portao-local.ts …` de novo", no formato que o `avaliarCarimbo` já usa, porque quem a lê acabou de perder os ~20 min das suítes.
- Sobras registradas: concordo em deixar o expurgo das entradas antigas de `conteudo.json` fora daqui (cresce devagar e não afeta veredito). A trava não é mais sobra — virou o bloqueante 2.
- Concordo com a não-mudança do instantâneo da rodada, que continua gravado no fim: a mutação do revisor mora dentro dessa janela, e fechá-la invalidaria o teste de mutação que se pede a ele.

## Sua pergunta 3 — dá para fechar o item do `TODO.md`?

Ainda não. As duas metades estão implementadas, mas a metade "gravar no início" está apoiada numa linha sem nenhum teste, e desfazê-la não deixa nada vermelho (bloqueante 1) — é o mesmo tipo de afirmação não provada que o item original denunciava. E a metade do hook só vale quando o instantâneo da rodada sobrevive, o que hoje não acontece em 2 de 3 execuções paralelas (bloqueante 2). Com os dois bloqueantes fechados, o item fecha junto e a nota no `TODO.md:294-298` fica verdadeira.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/portao-local.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/TODO.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo.md`.

## test-engineer · 3ª rodada · REPROVADO · 2026-09-22 22:04:41 · `tasks/correcoes/2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo.md`

Auditei só o diff da rodada 2 para cá (`tools/processo/revisoes.test.ts`, `tools/processo/revisoes.ts`, `tools/processo/portao-local.ts`, `TODO.md` e o documento). Não editei nada: `git status` continua com os mesmos 27 itens do início.

**O que medi**

- Mutação do bloqueante 1 (mover `const noInicio = …` para depois das suítes, em cópia no scratchpad): **1 vermelho, e só o caso novo** — `expect(editou.saida.status).not.toBe(0)`, `revisoes.test.ts:388`. A placement está provada. Restaurei a cópia e conferi com `diff -q` contra a árvore.
- Estabilidade do caso de processo: 8 execuções seguidas do arquivo, 39/39 em ~1 s, com o caso em 452 ms; e por `npm run test -- tools/processo/revisoes.test.ts` (que é o caminho do portão) também 39/39 em 988 ms — não há recursão pelo `npm_config_*` do npm de fora, o `package.json` do fixture vence. Sem falso verde possível nos dois ramos: o `editou` afirma o texto da recusa, e o `limpo` afirma saída zero, carimbo e instantâneo.
- Trava: sem `comTrava`, o caso paralelo ficou vermelho **1 vez em 16** nesta máquina (você mediu 3 de 5); com a trava, 8 de 8 verdes. Ciclo não há: `gravarInstantaneo` é folha (só lê/escreve dentro da trava), e a ordem em `registrar` é sempre documento → conteúdo, documento → índice; ninguém segura conteúdo e pede documento.
- `npx eslint` limpo nos três arquivos. E o `.processo/portao.json` de hoje, com as cinco suítes e 20 arquivos no instantâneo, é prova prática de que a guarda nova não recusa por artefato de `test:e2e`/`test:infra`.

---

VEREDITO: REPROVADO

Cenários exigidos (rodada 3): a leitura do conteúdo acontece no início da corrida, provada pelo caminho que roda de verdade · o instantâneo sobrevive a rodadas em paralelo · e as duas correções exigidas na rodada 2 feitas por inteiro.

Cobertos: a placement, pelo caso `o portão local, rodado como processo…` (`revisoes.test.ts:368-403`), que mata a mutação e é o único a morrer com ela · a concorrência, pela trava em `revisoes.ts:609-616` com a asserção em `revisoes.test.ts:803`, com duas chamadas realmente em paralelo (seis processos).

Bloqueantes:

1. **`tools/processo/revisoes.ts:629-630` — a frase que a rodada 2 exigiu ajustar continua lá, e agora é comprovadamente falsa.** O texto é: *"Mora aqui, e não no `portao-local.ts`, para ter teste: lá é script de topo, e provar a decisão exigiria rodar o portão inteiro."* O caso que você acabou de escrever prova exatamente a decisão rodando o script de topo, em 452 ms. O seu relato desta rodada diz que as duas frases foram corrigidas; nenhuma das duas foi. O agravante não é estilo: é que essa frase foi a justificativa que deixou a linha sem teste na rodada 2, e é o que o próximo a mexer aqui vai ler antes de decidir se apaga o caso. **Correção exigida:** trocar a frase pelo que é verdade — a decisão mora na função para ter teste de unidade, e *onde* o conteúdo é lido está provado pelo caso do script em `revisoes.test.ts:368`.

2. **`tasks/correcoes/2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo.md:126` — a mesma frase, e o documento se contradiz consigo mesmo.** A linha 126 diz *"prová-la exigiria rodar o portão inteiro"*, e a linha 102-104 do mesmo documento diz *"Eu tinha escrito que isso exigiria rodar o portão inteiro — não exige"*. Como o documento é o registro que as próximas rodadas leem, ele não pode sair com as duas versões. **Correção exigida:** reescrever a linha 126 na seção "Correção" para dizer que a decisão mora em `carimbarSeNadaMudou` para ter teste de unidade **e** que a leitura no início é provada pelo caso do script.

Recomendações:

- **`revisoes.test.ts:381` — `spawnSync` bloqueia o event loop, então o timeout de 60 s não corta nada.** Com a máquina saturada (12 `yes` em 12 núcleos) o caso levou 131 s e 199 s antes de o vitest reportar o estouro. Não é falso verde, e nessa carga quatro casos pré-existentes do arquivo estouram antes (os de 5 s), então não é regressão sua; mas `spawn` com promessa deixaria o timeout realmente cortar. Sem carga: 452 ms, oito de oito.
- **O fixture não tem `.gitignore`**, então `git status -uall` lista `node_modules/.package-lock.json`, `package.json` e `package-lock.json` dentro do `noInicio`. Hoje o npm não escreve lá e o controle negativo passa; no dia em que escrever, o `limpo` vira recusa e o vermelho vai parecer do produto. Um `.gitignore` com `node_modules/` no fixture fecha isso.
- **A asserção do caso paralelo é um detector fraco:** matou a mutação da trava 1 vez em 16 aqui. Mantenha-a (a trava é a defesa estrutural, e é ela que vale pela regra 80, item 7), mas se quiser que a mutação morra sempre, um número maior de escritores ou uma barreira de partida entre os processos resolveria.
- **Sobre a mensagem de recusa: vale, e o lugar é o script.** `carimbarSeNadaMudou` devolve o motivo; quem conhece as flags é o `portao-local.ts`, que tem `argumentos` na mão. Escrever lá `✗ ${recusa} Rode \`node tools/processo/portao-local.ts ${argumentos.join(' ')}\` de novo.` mantém a decisão na função testada e o comando onde a informação existe. Não bloqueia.
- **O comentário sobre `toEqual(instantaneoDe(noInicio))`: não precisa mais.** Quem prova a placement agora é o caso do script, e o comentário dele (`revisoes.test.ts:369-371`) já diz isso com todas as letras.
- O expurgo das entradas antigas de `conteudo.json` está bem em "O que fica em aberto" (67 chaves hoje, nenhuma consequência de veredito).

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/portao-local.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo.md`.

## test-engineer · 4ª rodada · APROVADO · 2026-09-22 22:40:26 · `tasks/correcoes/2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo.md`

VEREDITO: APROVADO

Cenários exigidos (rodada 4, escopo curto): as duas frases corrigidas batem com o código; as duas recomendações aceitas (comando na mensagem de recusa, `.gitignore` do fixture) não quebram nada; em especial a asserção do caso do processo continua casando com a nova mensagem.

Cobertos — o que eu conferi, e como:

1. **Docblock de `carimbarSeNadaMudou`** (`/home/joaquimdp/Documentos/git/Educa.ia/tools/processo/revisoes.ts:625-633`). A frase falsa saiu. O texto agora diz que a decisão mora na função para ter teste de unidade e que **onde** o conteúdo é lido é do `portao-local.ts`, "provado pelo caso que roda o script como processo ('o portão local, rodado como processo…')". A citação bate com o nome real do caso (`revisoes.test.ts:355`), e a afirmação é verdadeira: mutei o script numa cópia em scratchpad, trocando `noInicio` por uma leitura no fim (`carimbarSeNadaMudou(raiz, {inicio, suites}, alteracoesDeCodigo(...))`) e só o caso do processo fica vermelho (`expect(editou.saida.status).not.toBe(0)`). A decisão em si (guarda removida) mata dois casos: o de unidade e o do processo. As duas coisas têm caso próprio, como o texto diz.

2. **Documento da correção, seção "Correção"** (linhas 130-133): "a decisão mora em `carimbarSeNadaMudou` … **onde** o conteúdo é lido é do script, e está provado pelo caso que o roda como processo" — verdadeira pelas mutações acima. A linha 103 ficou como registro do erro, que era o combinado. `grep "portão inteiro"` só acha a linha 103.

3. **Mensagem de recusa com o comando** (`portao-local.ts:65`): a asserção do caso do processo (`revisoes.test.ts:392`) casa com o prefixo `apps/codigo.ts mudou enquanto o portão rodava`, que é o começo de `recusa`; o sufixo do comando vem depois e não interfere. Suíte inteira verde (39/39, 941 ms; o caso do processo em 445 ms — o que confirma o "menos de um segundo" por corrida do fixture na linha 105). `typecheck` e `lint` limpos.

4. **`.gitignore` do fixture** (`revisoes.test.ts:381`): faz o que a recomendação prometia, e provei nos dois sentidos — com a suíte "limpa" trocada por `printf '{}' > node_modules/algo.json`, verde com o `.gitignore` e **vermelha sem ele** (`expected 1 to be +0`, o carimbo recusado por escrita em `node_modules`). Não afraquece o controle negativo: a edição que o caso usa é em `apps/codigo.ts`, que continua fora do ignore, e as mutações 1 e 2 seguem vermelhas com o `.gitignore` no lugar.

5. **"O que fica em aberto"** traz os três itens combinados sem fazer: `spawnSync` que não deixa o timeout cortar com a medição de 199 s, a fraqueza do detector da trava com as duas taxas (1 em 16 e 3 em 5), e a poda do `conteudo.json`.

Bloqueantes: nenhum.

Recomendações:
- O comando na mensagem de recusa não tem asserção: mutei `portao-local.ts:65` para `✗ ${recusa}` sem o comando e a suíte fica **verde**. Não é regra de negócio, é ergonomia de ferramenta do processo, então não bloqueia; se quiser fixá-lo, uma linha no caso do processo resolve — `expect(editou.saida.stdout).toMatch(/portao-local\.ts.*de novo/)`.
- A árvore continua intocada por mim (27 arquivos, os mesmos do início) e `portao-local.ts conferir` segue respondendo "válido para o código atual (typecheck, lint, test, e2e, infra)". As mutações rodaram em cópias em `/tmp/claude-1000/.../scratchpad/mut`.
