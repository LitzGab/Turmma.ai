# Achados das revisões — `tasks/correcoes/2026-09-21-nota-do-teste-de-log-colide-com-o-carimbo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 2ª rodada · APROVADO · 2026-09-22 00:01:08 · `tasks/correcoes/2026-09-21-nota-do-teste-de-log-colide-com-o-carimbo.md`

Auditei o diff desde a rodada 1 (só `packages/nucleo/src/log/logger.test.ts`), medi as três perguntas com o pino real do repositório e com o código do runner instalado. Não editei nada.

```
VEREDITO: APROVADO

Cenários exigidos (rodada 1, reconferidos):
- regressão determinística: relógio preso no instante colidente e a negativa de privacidade
  ainda sobre a linha inteira → logger.test.ts:70-71, 88-91
- o carimbo continua no registro, com valor exato (prova que o relógio falso pegou) → :87
- a substituição não é atalho: a linha crua desta execução contém '7.5' → :94
- a substituição não cega a asserção: valor pessoal em chave `time` do payload continua pego → :53 (sem /g)
- a redação de cada chave pessoal continua provada (não é o carimbo que segura o verde)
- relógio real devolvido mesmo com o caso vermelho, e sem vazar para os outros describes → :60-62

Cobertos: todos. As três recomendações da rodada 1 estão aplicadas e medidas:
  rec 1 (/g) :53 · rec 3 (INSTANTE_COLIDENTE) :30, :71, :87 · rec 2 (afterEach no topo) :60

Bloqueantes: nenhum.

Recomendações:
1. logger.test.ts:92-94 — o comentário diz que a asserção prova "que a substituição não é
   atalho". Ela também é o único lugar que ainda amarra o **formato** do carimbo (ver resposta 1).
   Vale dizer isso na linha, senão ela parece redundante e é a primeira candidata a sair.
2. logger.test.ts:60 — o `afterEach` de topo é o **último** afterEach a rodar (ordem medida
   abaixo). Se um dia um `describe` deste arquivo ganhar `afterEach` próprio que **lance**, o de
   topo não roda e o relógio falso vaza. Uma linha no comentário ("se algum describe ganhar
   afterEach, o de topo continua sendo o último, e um throw lá dentro o pula") evita a pegadinha.
   Não bloqueia: hoje não existe afterEach interno neste arquivo.
```

## Resposta 1 — `toBe(INSTANTE_COLIDENTE)` perdeu algo? Não, e o formato continua amarrado

A troca é só ganho, e o formato **não** ficou sem guarda: quem o guarda agora é a asserção de `:94`, e ela guarda melhor que um regex de forma, porque afirma a propriedade que motiva o helper existir (a colisão), não a aparência.

Medido com o logger real, trocando `isoTime` por `epochTime`:

```
EPOCH: {"level":"info","time":1790045905729,"servico":"teste","correcao":{"nota":"[removido]"}}
raw contem 7.5?  false      ← expect(linhas.join('')).toContain('7.5') fica VERMELHO
```

E o `toBe` também cai (número `1790045905729` ≠ string ISO). Para passar, alguém teria que trocar `INSTANTE_COLIDENTE` por um número — `new Date(1790045905729)` funciona, o `toBe` volta ao verde — e **aí `:94` continua vermelho**, porque sem o ponto entre segundo e milissegundo `7.5` não aparece mais na linha. Para silenciar tudo é preciso apagar `:94`, que é justamente a asserção comentada como "não é atalho". Um formato de string diferente do ISO também derruba o `toBe`, porque a mesma constante alimenta `setSystemTime` e a expectativa. Zelo desnecessário adicionar regex de forma: ela seria mais fraca que `:94`.

## Resposta 2 — resíduo sem `/g`: confirmado, não sobra

`pino` monta a linha como `'{"level":...' + time + chindings + mixin + objeto`, então o carimbo é sempre o primeiro `"time":` — medido nos três vetores:

```
payload {time}:  {"level":"info","time":"...Z","servico":"teste","time":"Enzo Martins",...}
                 sem /g mantém 'Enzo Martins' → true    com /g → false (asserção cega)
msg imitando:    ..."msg":"a\"time\":\"Enzo Martins"    sem /g mantém → true
chave imitando:  ..."x\"time\":\"y":"Enzo Martins"      sem /g mantém → true
```

`JSON.stringify` escapa as aspas em **valor e em chave**, e a regex exige `"time":` sem escape — o seu raciocínio está certo nas duas frentes, inclusive na que você não testou (chave, não só `msg`).

Achado lateral, sem ação: com chave `time` no payload, `JSON.parse` devolve a **do payload** (chave duplicada, vence a última). Isso só reforça `:87`: quem um dia logar `time` neste caso descobre pela asserção, não pelo silêncio.

E a mutação por caminho de redact confirma que o helper não afrouxou nada:

```
regra inteira            → nenhum valor pego (verde)
redact removido          → pega os 5
só 'nota' fora do redact → pega '7.5'
só 'nome' fora do redact → pega 'Enzo Martins'
```

## Resposta 3 — ordem do `afterEach`: o de topo roda por último, e é a direção segura

Lido no runner instalado (`node_modules/vitest/dist/chunks/run.CQOUYP-x.js:3574-3591`): em `callSuiteHook`, para `beforeEach` a recursão no pai vem **antes** (linha 3579); para `afterEach` ela vem **depois** (linha 3590). Ou seja: hook do `describe` interno → ... → hook do arquivo. `sequence.hooks` default é `parallel` (cac.D805sv8h.js:978), o que só paraleliza hooks do **mesmo** nível; a ordem pai/filho é da recursão, não da configuração.

Consequência prática: relógio parado não vaza entre casos, porque `vi.useRealTimers()` é o último a rodar antes do próximo teste, e um eventual `afterEach` interno rodaria ainda com o relógio falso — que é o comportamento desejável (ele veria o mesmo mundo do teste). Confirmei também que o hook roda quando o caso **falha**: a falha do corpo do teste é capturada em `failTask` e o bloco do `afterEach` vem depois, em `try` próprio (:3885-3896). A única ordem que machuca é a da recomendação 2: `afterEach` interno que lança interrompe a recursão antes de chegar ao do arquivo.

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/log/logger.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/log/logger.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-nota-do-teste-de-log-colide-com-o-carimbo.md`. Árvore intacta: `git status` continua com `logger.test.ts` modificado e a tarefa não rastreada; 53 de 53 verdes na minha execução independente do projeto `unidade`; carimbo do portão em `.processo/portao.json` com `inicio` 2026-09-22T02:49:43.887Z, igual ao informado.

## test-engineer · 3ª rodada · APROVADO · 2026-09-22 00:12:36 · `tasks/correcoes/2026-09-21-nota-do-teste-de-log-colide-com-o-carimbo.md`

```
VEREDITO: APROVADO

Cenários exigidos (rodada 1, reconferidos — nenhuma asserção mudou na rodada 3):
- regressão determinística: relógio preso no instante colidente, negativa de privacidade ainda
  sobre a linha inteira → logger.test.ts:73-74, 91-93
- carimbo continua no registro, com valor exato (prova que o relógio falso pegou) → :88
- a substituição não é atalho: a linha crua desta execução contém '7.5' → :100
- a substituição não cega a asserção: valor pessoal em chave `time` do payload continua pego → :53 (sem /g)
- redação de cada chave pessoal continua provada, não é o carimbo que segura o verde
- relógio real devolvido mesmo com o caso vermelho e sem vazar entre casos → :63-65

Cobertos: todos. As duas recomendações da rodada 2 estão aplicadas: rec 1 em :95-100, rec 2 em :61-62.

Bloqueantes: nenhum.

Recomendações:
1. logger.test.ts:97 — "esta é a única asserção que ainda amarra o formato do carimbo" é forte
   demais como está. Medi: com `epochTime` o `toBe(INSTANTE_COLIDENTE)` de :88 também fica
   vermelho (`time` vira o número 1790041537569, que não é igual à string ISO). O que só o
   `toContain('7.5')` tem é resistir à troca **com o INSTANTE_COLIDENTE atualizado junto` — que é
   exatamente o que a frase seguinte diz. Texto mais fiel: "a única que resiste à troca de formato
   feita com o INSTANTE_COLIDENTE atualizado junto". Não bloqueia: a conclusão prática
   ("não apague") está certa.
2. Documento, linhas 144-148 — o parágrafo da ordem dos `afterEach` diz "conferida no runner
   instalado" sem dizer por quem, enquanto os outros dizem "o test-engineer mediu". Como essa é a
   categoria de afirmação que o retro pegou (comportamento de ferramenta escrito a partir de
   medição de terceiro), vale atribuir explicitamente, e trocar "conferida no runner instalado"
   pelos números da rodada 3 (execução, não leitura de código) — colados abaixo.
```

## Respondendo às suas duas perguntas

**1. Sobrou bloqueante?** Não. Siga para o `privacy-guardian`.

**2. Os comentários descrevem o mecanismo corretamente?** Sim, com a única ressalva da recomendação 1. E não: você não precisa medir (a) e (b) por si — **eu medi as duas nesta rodada por execução**, não por leitura de código como na rodada 2. Pode citar como medição do revisor, com atribuição.

**(a) Ordem dos `afterEach`** — Vitest 5.0.0 do repositório, três sondas em `/tmp` (já removidas):

```
pai/filho:        ["beforeEach-arquivo","beforeEach-interno","corpo",
                   "afterEach-interno","afterEach-arquivo", ...]   ← o de arquivo é o último
hook interno que lança: ["corpo","afterEach-interno-lanca"]        ← o de arquivo NÃO roda
corpo do caso falha:    ["afterEach-arquivo"]                      ← roda mesmo com vermelho
vazamento real:   caso seguinte lê new Date() → 2026-09-22T01:45:37.569Z  (vazou: true)
```

A terceira sonda fecha o que o comentário afirma como consequência: com um `afterEach` interno que lança, o relógio falso **chega ao caso seguinte**, não só fica sem restauração. O comentário de `:61-62` está correto nas três partes.

**(b) `epochTime` derruba a asserção do `7.5`** — replicando a configuração de `logger.ts:167-172` com o pino real do repositório, mesmo instante fixado:

```
iso:   {"level":"info","time":"2026-09-22T01:45:37.569Z",...}
       linha crua contém '7.5'? true   ·  time === INSTANTE? true   ·  semCarimbo contém '7.5'? false
epoch: {"level":"info","time":1790041537569,...}
       linha crua contém '7.5'? false  ·  time === INSTANTE? false
```

Confirmado, e mais forte do que o caso particular: epoch em ms é inteiro, `JSON.stringify` não escreve ponto, então **nenhum** valor de epoch pode conter `7.5`. Atualizar o `INSTANTE_COLIDENTE` para o número deixa o `toBe` verde e `:100` continua vermelho — é o que o comentário diz.

**Frequência, remedida por mim** (1 milhão de instantes, independente da sua medição e da rodada 2): `'7.5'` casa em **0,985%**; `'Enzo Martins'`, `'2026001'`, `'letra C'`, `'segredo-sintetico'` em 0,000%; e os recusados continuam colidindo — `'7.55'` 0,095%, `'10.5'` 0,171%.

**Estado verificado:** `packages/nucleo/src/log/logger.test.ts` 53 de 53 verdes na minha execução do projeto `unidade`; `.processo/portao.json` com `inicio` 2026-09-22T03:01:50.883Z, igual ao informado; sem `.skip`, sem teste comentado, sem `any`; árvore intacta (os mesmos três itens de `git status`), nada editado por mim.

Arquivos auditados: `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/log/logger.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/packages/nucleo/src/log/logger.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-nota-do-teste-de-log-colide-com-o-carimbo.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/achados-revisoes.md`.
