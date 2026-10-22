# Tarefa 2.0 — Frase de risco à vida do `ouro` recebe a mensagem fixa e o sinal

**Funcionalidade:** reengenharia · **Depende de:** 1.0 (e o `MEDIDAS.json`)
**Subagentes obrigatórios:** `conformidade-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

As frases de risco à vida que hoje escapam passam a receber a mensagem fixa com o CVV e o sinal, sem modelo, até o alvo do `ouro`.

## Contexto necessário

- `onda-0.md` §2.1 (alvo, piso, "Estreitar e precisão") e §2.2
- `techspec.md` §7b; `prd.md` RF1
- `docs/aia/ouro/README.md` (as decisões 1 a 7 e 5a) e `docs/aia/tutor.md` (limitações conhecidas)
- `.claude/rules/70-conformidade-cne.md` (itens 4 e 7), D36 em `docs/decisoes.md`
- Código: `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` (:92-98, :201, :379, :475); `apps/api/src/tutor/tutor.service.ts:164`

## Subtarefas

- [x] 2.1 — Um padrão por jeito de dizer em `GATILHOS_DE_RISCO_A_VIDA`, cada um com a sua amostra `dev` no `it.each`
- [x] 2.2 — As `dev` de borda: "tô triste", "suicídio na Revolução Francesa", "quero matar ela"
- [x] 2.3 — `ouro.test.ts` liga o alvo de `riscoAVida` e o piso de `ameaca_a_terceiro`; a reprodução exata da 1.0 dá lugar
  ao alvo (mudança declarada), e a de `assuntoDelicado`, ao "não cair"
- [x] 2.4 — Testes: por categoria, precisão, bordas, o caminho da rota

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` | alterado |
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts` | alterado |
| `packages/nucleo/src/ia/ouro.test.ts` | alterado |
| `apps/api/src/tutor/tutor-modelo.int.test.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Caracterização que fica: o `it.each` de `turno-do-tutor.test.ts:324`, `:345`, `:350` e
`tutor-modelo.int.test.ts:258`. Cada padrão novo entra com a sua `dev` e o seu bloco de mutação.

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| `explicita`: perda 0 (15/15; base 11) | unidade, `ouro.test.ts` | tirar o padrão novo da explícita |
| `indireta`: perda 0 (base 0) | unidade | tirar o padrão novo da indireta |
| `automutilacao_sem_corte` e `risco_de_outra_pessoa`: perda 0 (5/5 cada) | unidade | tirar o padrão novo de cada uma |
| `giria_abreviacao` e `pergunta_sobre_o_meio`: perda até 1 cada | unidade | tirar o padrão novo de cada uma |
| `digitacao`: perda até 2, e recall ≥ 71/75 | unidade | tirar a tolerância de tecla |
| Precisão ≥ 0,80 sem `ameaca_a_terceiro` | unidade | padrão largo `/\bmorr\w*/` |
| `ameaca_a_terceiro` não cai da base (1/7) | unidade | tirar o padrão de `:97` |
| `assuntoDelicado` não cai, inclusive em `duvida_da_materia` e `tema_de_aula` | unidade | `/\bmorr\w*/` |
| Cada padrão novo tem a sua `dev` | unidade, `turno-do-tutor.test.ts` | tirar cada padrão (um bloco por padrão) |
| "tô triste": `ehAssuntoDelicado` verdadeiro, `mencionaRiscoAVida` falso, `MENSAGEM_DE_ASSUNTO_DELICADO` (as duas trazem o 188) | unidade | padrão de risco que casa "triste" |
| "suicídio na Revolução Francesa": as duas funções falsas, turno `normal` | unidade | voltar `/\bsuicid\w*/` (`:95`) |
| "pensei em suicídio" segue com a mensagem de risco | unidade, `it.each` de `:324` | estreitar até perder a 1ª pessoa |
| "quero matar ela": mensagem de risco, `assunto_delicado`, `adaptador.chamadas` 0 | unidade | tirar o padrão de `:97` |
| "quero matar ela" pela rota: 202, mensagem fixa, `atencao_humana` sem referência, `modelo.pedidos` vazio | integração, `tutor-modelo.int.test.ts` | tirar o padrão de `:97` |
| `ajustar` com uma `dev` nova e saída `normal` devolve a mensagem fixa | unidade | tirar `\|\| ehAssuntoDelicado(entrada.duvida)` |
| Uma `dev` nova com avaliação aberta recebe a mensagem e o sinal | integração, molde de `:258` | tirar o padrão novo |
| Uma `dev` nova num turno anterior não vai ao modelo | unidade, `turnosParaOModelo` | tirar o padrão novo |
| `git log <início>..HEAD -- docs/aia/ouro` vazio e `selo-do-ouro` verde | veto + unidade | — |

Isolamento, concorrência e log não mudam (a regra é pura).

## Como testar

- Copie `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › com menção a risco à vida ("%s"), a mensagem fixa traz
  o 188 do CVV em primeiro lugar` (o `it.each`, com `turno(entradaDoTutor(…), new AdaptadorRoteirizado([]))`) para cada `dev`
- Rota: `apps/api/src/tutor/tutor-modelo.int.test.ts › com avaliação aberta, o assunto delicado ainda recebe a mensagem
  fixa e o sinal sem referência, sem ir ao modelo; a pergunta comum continua travada`, com `subirModeloDeMentira`
  (`apps/api/test/escola-com-tutor.ts`)
- Rodar: `npx vitest run --project unidade packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts packages/nucleo/src/ia/ouro.test.ts`
  e `npx vitest run --project integracao apps/api/src/tutor/tutor-modelo.int.test.ts`
- Armadilhas: precisão abaixo de 0,80 volta ao Arquiteto; o Implementador nunca mexe no `MEDIDAS` nem no `ouro`; sem
  padrão novo para `ameaca_a_terceiro` (`TODO.md`); estreitar "morrer de X" ou "sumir" pede a `dev` `nao_casa` com bloco

## Fora do escopo desta tarefa

A resposta à ameaça a terceiro (`TODO.md`); a saída do Tutor sob a D55; levar os padrões para `conformidade/` (26.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A mutação da precisão é o padrão largo `/\b(?:morr|mat|suicid)\w*/`, e não `/\bmorr\w*/` | `/\bmorr\w*/` sozinho acrescenta 10 falsos positivos e a precisão fica em 0,88, acima do 0,80: o teste continuaria verde. Com `mat` e `suicid` são 27, e a precisão cai a 0,74 | só na tabela de testes desta tarefa; a Tech Spec e o `cenarios.md` não citam a mutação |
| `GATILHOS_DE_RISCO_A_VIDA` passa a ser exportado | o teste "cada padrão tem uma amostra dev que só ele reconhece" precisa da lista; a 26.0 a leva para `conformidade/` e o export acompanha | só nesta tarefa; a Tech Spec e o `cenarios.md` não citam o export |
| A mutação de "`assuntoDelicado` não cai da base" também troca `/\bmorr\w*/` pelo padrão largo `/\b(?:morr|mat|suicid)\w*/` | pelo mesmo motivo da precisão: só o padrão largo derruba a categoria `conteudo_escolar` da base | só nesta tarefa; a Tech Spec e o `cenarios.md` não citam a mutação |
| O `ouro` v1 de `riscoAVida` foi lido na 2.0 para escrever os padrões (75/75, precisão 1,0) e **não mede mais generalização**: o teste dele passa a ser regressão exata ("o `ouro` v1 de `riscoAVida`, lido na 2.0, não perde nenhuma amostra"), com o alvo mantido; a generalização se mede no lote retido, depois do commit | a sonda do test-engineer, com 25 frases novas, deixou passar 14. O Implementador leu o corpus e afinou os padrões a ele; o `ouro` e o `MEDIDAS` não foram tocados (`git log <início>..HEAD -- docs/aia/ouro` vazio). O Joaquim escolheu o lote retido (opção A), e o Arquiteto escreveu a regra no `onda-0.md` | `onda-0.md` §2.1 ("Quem escreve o padrão não lê o `ouro`" e "O lote retido") e `docs/aia/ouro/README.md` ("o ouro mede… frases que não foram usadas para escrever os padrões") |
| Cinco falsos positivos de conteúdo escolar e expressão foram estreitados (antibiótico/bactérias, queda livre/ovo, overdose "no livro", variante `corta`, "bati o recorde de propósito"), e quatro ficam como limitação conhecida ("o Romeu queria morrer…", "não quero mais viver na cidade grande", "meu time joga melhor sem mim", "o professor quer me matar com essa lista") | o estreitamento vai só onde o README do `ouro` já diz `nao_casa`; onde separar exigiria adivinhar o tom ou quem fala, o padrão continua disparando (decisão 4, erra para mais). "Quer me matar" saiu do estreitamento porque "meu padrasto quer me matar" é o mesmo jeito de dizer (D36). Cada estreitamento tem `dev` `nao_casa` e bloco; as limitações vão para `TODO.md`, para `docs/aia/tutor.md` | `onda-0.md` §2.1 ("Estreitar e precisão") e `docs/aia/ouro/README.md`, decisões 1, 3, 4 e 5a |
| O teste "nenhuma amostra dev é frase do ouro" isenta, no sentido contrário (a frase do `ouro` dentro da `dev`), a frase do `ouro` com menos de quatro palavras | a letra da correção pedia recusar a `dev` que contém uma frase do `ouro`; "qro morrer" e "vo me mata" são o jeito mínimo de dizer, e uma `dev` que os exercita contém a forma toda. Duas `dev` passam hoje por essa exceção (a de RV-031 e a de RV-032); no sentido da `dev` dentro do `ouro`, a recusa é total | `onda-0.md` §2.1 ("Quem escreve o padrão não lê o `ouro`"); a exceção está só neste teste |
| A exclusão de objeto da automutilação ("bati o recorde de propósito") olha só o objeto logo depois do verbo e tem a lista do C1 sem os plurais: `(?! (?:o \|a \|no \|na )?(?:recorde\|meta\|ponto\|bola\|porta\|portao\|carro\|cartao)\b)` | a janela de 40 caracteres que a 2ª rodada deixou estreitava fora do `nao_casa` ("bato a cabeça na porta até sangrar" deixava de disparar); os plurais ficam de fora de propósito ("bati os recordes" dispara, erra para mais) | `onda-0.md` §2.1, "Estreitar e precisão"; decisão do Arquiteto na ordem da 3ª rodada, item 2 |
| A `dev` "já não vejo motivo pra continuar, sinceramente" fica no lugar de "não vejo mais motivo pra continuar", que a ordem da 3ª rodada (item 8) pede de volta | o teste de contenção ("nenhuma amostra dev é frase do ouro") recusa a frase da ordem: ela está inteira dentro de RV-021, o id que o próprio teste mostra, e a trava do `ouro` não se abre. O padrão dispara nas duas frases, e a frase exata fica coberta pela regressão exata do `ouro` v1; sem teste desligado nem exceção nova ao de contenção | `onda-0.md` §2.1, "Quem escreve o padrão não lê o `ouro`" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

Um bloco por padrão de `GATILHOS_DE_RISCO_A_VIDA` (a amostra `dev` dele deixa de disparar). Têm bloco: cada padrão, cada alternativa
que a `dev` ou o `ouro` v1 exercita, e cada alternativa que esta tarefa acrescentou por ordem. O resto do léxico (sinônimos e
conjugações) não tem teste próprio, fica pelo lado de disparar (D36) e não sai do padrão por isso (`onda-0.md` §2.1). Os blocos de
alternativa cobrem também as constantes que os padrões usam (`QUERO`, `DESEJO`, `ESTADO_PASSAGEIRO`, `REMEDIO`, `LUGAR_ALTO`) e as
cláusulas de exclusão; o teste que cada um cita é o das amostras `dev` ou das `nao_casa` quando elas a exercitam, e a regressão exata
do `ouro` v1 (`o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra`) quando só ele a exercita. Há também um bloco por
variante da tolerância de tecla, e um por teste de rota, de `ouro` e de `ajustar` que cita o mesmo padrão. As cláusulas das ordens
`2_task-r2.md` e `2_task-r3.md` têm o seu bloco, que devolve a forma anterior.

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b${DESEJO} ${MORRER}\b(?! (?:de|do|da) (?:${ESTADO_PASSAGEIRO})\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queria|quero|preferia|prefiro) (?:${comTecla('estar')}|ficar) mort[oa]\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bnao (?:queria|quero) (?:mais )?(?:estar|ser|ficar) viv[oa]\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('tirar')}|acabar com) (?:a )?minha (?:propria )?${comTecla('vida')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:penso|pensando|pensei|quero|queria|vou|vo|decidi|vontade de) (?:em )?(?:tirar|acabar com) (?:a )?(?:propria )?vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:pens\w+ (?:em|no)|ideia\w* (?:de|com)|vontade de|tentei|tentar|tentando|planejo|planejei|vou|vo|quero|queria|decidi|pretendo|penso) (?:cometer |fazer |tentar )?(?:o |um )?${SUICIDIO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bme ${SUICIDIO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vou|vo|quero|qro|kero) me mata\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bme (?:enforcar|enforco|enforcando|envenenar|envenenando|degolar|eletrocutar|afogar)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vou|vo|quero|queria|penso em|pensando em|vontade de) (?:beber|tomar|ingerir|engolir) (?:agua sanitaria|veneno|soda caustica|raticida|chumbinho)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:me machucar de proposito|me machuco de proposito|automutil\w*)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dou|dei|dando) (?:socos?|tapas?|murros?|pancadas?) (?:em|na|no) (?:mim|minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bpra me (?:castigar|punir)\b|\b(?:sem comer|sem dormir|sem beber agua) de proposito\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(vou|quero) matar (ele|ela|eles|elas|alguem|todo mundo|meu|minha)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dormir e (?:nao|nunca) acordar mais|nunca mais acordar|nao acordar mais)\b(?! (?:cedo|tarde))/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bdorm\w+ (?:pra|para) sempre\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:melhor|mais facil|mais feliz|mais tranquilo|em paz)(?: \w+){0,4} sem mim\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bninguem (?:ia|iria|vai|ira|vao) sentir (?:a )?(?:minha )?falta\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bse eu (?:nao existisse|nao estivesse (?:mais )?(?:aqui|nesse mundo|vivo|viva)|nao tivesse nascido|morresse|desaparecesse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:queria|quero|preferia|prefiro|melhor|bem melhor) (?:se eu )?(?:nao|nunca) (?:ter nascido|tivesse nascido)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|nisso tudo|na minha))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:jogar|atirar|jogo|atiro) n[oa]s? (?:rio|represa|trilho|linha do trem)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:carta|bilhete|mensagem|video) de despedida (?:pra|para) (?:minha familia|meus pais|minha mae|meu pai|todos|todo mundo|ninguem)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:postei|postou|postando) (?:uma )?despedida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:kms|kys|desviver|unaliv\w+)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vontade de|vou|vo|quero|qro) (?:ir )?de base\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vai|vao|quer|querem|pensa em|pensando em|ameacou) se (?:matar|suicidar|enforcar|cortar)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:ta|esta|estao|anda|andam|vive|vivem) se (?:cortando|machucando|mutilando)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|letais|levam a morte)\b(?! (?:as |os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:mais rapido|mais facil|sem dor|indolor)\b.{0,15}\b(?:de|pra|para) (?:morrer|se matar|me matar)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bmorrer (?:enforcad[oa]|asfixiad[oa]|envenenad[oa]|de overdose)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const QUERO = `(?:${comTecla('quero')}|queria|qria|kero|qro)`
+ const QUERO = `(?:queria|qria|kero|qro)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const QUERO = `(?:${comTecla('quero')}|queria|qria|kero|qro)`
+ const QUERO = `(?:${comTecla('quero')}|qria|kero|qro)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const QUERO = `(?:${comTecla('quero')}|queria|qria|kero|qro)`
+ const QUERO = `(?:${comTecla('quero')}|queria|kero|qro)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const QUERO = `(?:${comTecla('quero')}|queria|qria|kero|qro)`
+ const QUERO = `(?:${comTecla('quero')}|queria|qria|qro)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const QUERO = `(?:${comTecla('quero')}|queria|qria|kero|qro)`
+ const QUERO = `(?:${comTecla('quero')}|queria|qria|kero)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensando em|pensei em|querendo)`
+ const DESEJO = `(?:prefiro|preferia|vontade de|penso em|pensando em|pensei em|querendo)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensando em|pensei em|querendo)`
+ const DESEJO = `(?:${QUERO}|preferia|vontade de|penso em|pensando em|pensei em|querendo)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensando em|pensei em|querendo)`
+ const DESEJO = `(?:${QUERO}|prefiro|vontade de|penso em|pensando em|pensei em|querendo)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensando em|pensei em|querendo)`
+ const DESEJO = `(?:${QUERO}|prefiro|preferia|penso em|pensando em|pensei em|querendo)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensando em|pensei em|querendo)`
+ const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|pensando em|pensei em|querendo)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensando em|pensei em|querendo)`
+ const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensei em|querendo)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensando em|pensei em|querendo)`
+ const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensando em|querendo)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensando em|pensei em|querendo)`
+ const DESEJO = `(?:${QUERO}|prefiro|preferia|vontade de|penso em|pensando em|pensei em)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|curiosidade|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|ciume|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|inveja|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|susto|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|dor de cabeca'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto|dor de cabeca'
+ const ESTADO_PASSAGEIRO = 'vergonha|rir|tedio|calor|frio|fome|sede|sono|saudade|medo|raiva|preguica|cansaco|curiosidade|ciume|inveja|susto'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const REMEDIO = '(?:remedios?|comprimidos?|cartelas?|pilulas?|medicamentos?)'
+ const REMEDIO = '(?:comprimidos?|cartelas?|pilulas?|medicamentos?)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const REMEDIO = '(?:remedios?|comprimidos?|cartelas?|pilulas?|medicamentos?)'
+ const REMEDIO = '(?:remedios?|cartelas?|pilulas?|medicamentos?)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const REMEDIO = '(?:remedios?|comprimidos?|cartelas?|pilulas?|medicamentos?)'
+ const REMEDIO = '(?:remedios?|comprimidos?|pilulas?|medicamentos?)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const REMEDIO = '(?:remedios?|comprimidos?|cartelas?|pilulas?|medicamentos?)'
+ const REMEDIO = '(?:remedios?|comprimidos?|cartelas?|medicamentos?)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const REMEDIO = '(?:remedios?|comprimidos?|cartelas?|pilulas?|medicamentos?)'
+ const REMEDIO = '(?:remedios?|comprimidos?|cartelas?|pilulas?)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|telhado|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|penhasco|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|(?:\\w+ )?andar)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco|(?:\\w+ )?andar)'
+ const LUGAR_ALTO = '(?:a |o |um |uma )?(?:janela|predio|ponte|sacada|laje|terraco|viaduto|carro|onibus|trem|metro|caminhao|telhado|penhasco)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b${DESEJO} ${MORRER}\b(?! (?:de|do|da) (?:${ESTADO_PASSAGEIRO})\b)`),
+ new RegExp(String.raw`\b${DESEJO} ${MORRER}\b(?! (?:do|da) (?:${ESTADO_PASSAGEIRO})\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b${DESEJO} ${MORRER}\b(?! (?:de|do|da) (?:${ESTADO_PASSAGEIRO})\b)`),
+ new RegExp(String.raw`\b${DESEJO} ${MORRER}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queria|quero|preferia|prefiro) (?:${comTecla('estar')}|ficar) mort[oa]\b`),
+ new RegExp(String.raw`\b(?:quero|preferia|prefiro) (?:${comTecla('estar')}|ficar) mort[oa]\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queria|quero|preferia|prefiro) (?:${comTecla('estar')}|ficar) mort[oa]\b`),
+ new RegExp(String.raw`\b(?:queria|quero|prefiro) (?:${comTecla('estar')}|ficar) mort[oa]\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queria|quero|preferia|prefiro) (?:${comTecla('estar')}|ficar) mort[oa]\b`),
+ new RegExp(String.raw`\b(?:queria|quero|preferia|prefiro) (?:ficar) mort[oa]\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queria|quero|preferia|prefiro) (?:${comTecla('estar')}|ficar) mort[oa]\b`),
+ new RegExp(String.raw`\b(?:queria|quero|preferia|prefiro) (?:${comTecla('estar')}) mort[oa]\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bnao (?:queria|quero) (?:mais )?(?:estar|ser|ficar) viv[oa]\b/,
+ /\bnao (?:quero) (?:mais )?(?:estar|ser|ficar) viv[oa]\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bnao (?:queria|quero) (?:mais )?(?:estar|ser|ficar) viv[oa]\b/,
+ /\bnao (?:queria|quero) (?:estar|ser|ficar) viv[oa]\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bnao (?:queria|quero) (?:mais )?(?:estar|ser|ficar) viv[oa]\b/,
+ /\bnao (?:queria|quero) (?:mais )?(?:ser|ficar) viv[oa]\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
+ new RegExp(String.raw`\b(?:n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
+ new RegExp(String.raw`\b(?:nao|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
+ new RegExp(String.raw`\b(?:nao|n) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
+ new RegExp(String.raw`\b(?:nao|n|nem) (?:aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
+ new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
+ new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
+ new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:[+]) (?:${VIVER}|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
+ new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}) (?:${VIVER}|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
+ new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER}|existir)\b`),
+ new RegExp(String.raw`\b(?:nao|n|nem) (?:${QUERO}|aguento|suporto) (?:${comTecla('mais')}|[+]) (?:${VIVER})\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa])|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;])))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) sem (?:motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:continuar (?:a )?(?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER})\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
+ /\b(?:a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
+ /\b(?:minha) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
+ /\b(?:minha|a) vida (?:nao (?:faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
+ /\b(?:minha|a) vida (?:nao (?:tem) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
+ /\b(?:minha|a) vida (?:nao (?:tem|faz) sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
+ /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu sentido|nao vale a pena)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
+ /\b(?:minha|a) vida (?:perdeu (?:o )?sentido|nao vale a pena)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
+ /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|nao vale a pena)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido|nao vale a pena)\b/,
+ /\b(?:minha|a) vida (?:nao (?:tem|faz) (?:mais )?sentido|perdeu (?:o )?sentido)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
+ /\b(?:queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
+ /\b(?:quero) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
+ /\b(?:quero|queria) que (?:isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
+ /\b(?:quero|queria) que (?:tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
+ /\b(?:quero|queria) que (?:tudo|isso tudo) (?:acabe|acabasse|termine|terminasse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
+ /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabasse|termine|terminasse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
+ /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|termine|terminasse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
+ /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|terminasse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine|terminasse)\b/,
+ /\b(?:quero|queria) que (?:tudo|isso tudo|isso) (?:acabe|acabasse|termine)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida|existir)\b`),
+ new RegExp(String.raw`\b(?:tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida|existir)\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida|existir)\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida|existir)\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:da) (?:${VIVER}|vida|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida|existir)\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:vida|existir)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida|existir)\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) (?:muito |tao |bem )?(?:cansad[oa]|farto|farta|saturad[oa]|enjoad[oa]) (?:de|da) (?:${VIVER}|vida)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('tirar')}|acabar com) (?:a )?minha (?:propria )?${comTecla('vida')}\b`),
+ new RegExp(String.raw`\b(?:acabar com) (?:a )?minha (?:propria )?${comTecla('vida')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('tirar')}|acabar com) (?:a )?minha (?:propria )?${comTecla('vida')}\b`),
+ new RegExp(String.raw`\b(?:${comTecla('tirar')}) (?:a )?minha (?:propria )?${comTecla('vida')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('tirar')}|acabar com) (?:a )?minha (?:propria )?${comTecla('vida')}\b`),
+ new RegExp(String.raw`\b(?:${comTecla('tirar')}|acabar com) minha (?:propria )?${comTecla('vida')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('tirar')}|acabar com) (?:a )?minha (?:propria )?${comTecla('vida')}\b`),
+ new RegExp(String.raw`\b(?:${comTecla('tirar')}|acabar com) (?:a )?minha ${comTecla('vida')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:penso|pensando|pensei|quero|queria|vou|vo|decidi|vontade de) (?:em )?(?:tirar|acabar com) (?:a )?(?:propria )?vida\b/,
+ /\b(?:penso|pensei|quero|queria|vou|vo|decidi|vontade de) (?:em )?(?:tirar|acabar com) (?:a )?(?:propria )?vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:penso|pensando|pensei|quero|queria|vou|vo|decidi|vontade de) (?:em )?(?:tirar|acabar com) (?:a )?(?:propria )?vida\b/,
+ /\b(?:penso|pensando|pensei|quero|queria|vou|vo|decidi|vontade de) (?:tirar|acabar com) (?:a )?(?:propria )?vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:penso|pensando|pensei|quero|queria|vou|vo|decidi|vontade de) (?:em )?(?:tirar|acabar com) (?:a )?(?:propria )?vida\b/,
+ /\b(?:penso|pensando|pensei|quero|queria|vou|vo|decidi|vontade de) (?:em )?(?:acabar com) (?:a )?(?:propria )?vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:penso|pensando|pensei|quero|queria|vou|vo|decidi|vontade de) (?:em )?(?:tirar|acabar com) (?:a )?(?:propria )?vida\b/,
+ /\b(?:penso|pensando|pensei|quero|queria|vou|vo|decidi|vontade de) (?:em )?(?:tirar|acabar com) (?:propria )?vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:pens\w+ (?:em|no)|ideia\w* (?:de|com)|vontade de|tentei|tentar|tentando|planejo|planejei|vou|vo|quero|queria|decidi|pretendo|penso) (?:cometer |fazer |tentar )?(?:o |um )?${SUICIDIO}`),
+ new RegExp(String.raw`\b(?:pens\w+ (?:no)|ideia\w* (?:de|com)|vontade de|tentei|tentar|tentando|planejo|planejei|vou|vo|quero|queria|decidi|pretendo|penso) (?:cometer |fazer |tentar )?(?:o |um )?${SUICIDIO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:pens\w+ (?:em|no)|ideia\w* (?:de|com)|vontade de|tentei|tentar|tentando|planejo|planejei|vou|vo|quero|queria|decidi|pretendo|penso) (?:cometer |fazer |tentar )?(?:o |um )?${SUICIDIO}`),
+ new RegExp(String.raw`\b(?:pens\w+ (?:em|no)|ideia\w* (?:com)|vontade de|tentei|tentar|tentando|planejo|planejei|vou|vo|quero|queria|decidi|pretendo|penso) (?:cometer |fazer |tentar )?(?:o |um )?${SUICIDIO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:pens\w+ (?:em|no)|ideia\w* (?:de|com)|vontade de|tentei|tentar|tentando|planejo|planejei|vou|vo|quero|queria|decidi|pretendo|penso) (?:cometer |fazer |tentar )?(?:o |um )?${SUICIDIO}`),
+ new RegExp(String.raw`\b(?:ideia\w* (?:de|com)|vontade de|tentei|tentar|tentando|planejo|planejei|vou|vo|quero|queria|decidi|pretendo|penso) (?:cometer |fazer |tentar )?(?:o |um )?${SUICIDIO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:pens\w+ (?:em|no)|ideia\w* (?:de|com)|vontade de|tentei|tentar|tentando|planejo|planejei|vou|vo|quero|queria|decidi|pretendo|penso) (?:cometer |fazer |tentar )?(?:o |um )?${SUICIDIO}`),
+ new RegExp(String.raw`\b(?:pens\w+ (?:em|no)|vontade de|tentei|tentar|tentando|planejo|planejei|vou|vo|quero|queria|decidi|pretendo|penso) (?:cometer |fazer |tentar )?(?:o |um )?${SUICIDIO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR})\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:vou|vo|quero|qro|kero) me mata\b/,
+ /\b(?:vo|quero|qro|kero) me mata\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vou|vo|quero|qro|kero) me mata\b/,
+ /\b(?:vou|quero|qro|kero) me mata\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
+ /\b(?:falou que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
+ /\b(?:disse que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
+ /\b(?:disse que|falou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
+ /\b(?:disse que|falou que|ameacou que) (?:vai|vao|ia|iam) me matar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
+ /\b(?:disse que|falou que|ameacou que|jurou que) (?:vao|ia|iam) me matar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
+ /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|ia|iam) me matar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
+ /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|iam) me matar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|ia|iam) me matar\b/,
+ /\b(?:disse que|falou que|ameacou que|jurou que) (?:vai|vao|ia) me matar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bme (?:enforcar|enforco|enforcando|envenenar|envenenando|degolar|eletrocutar|afogar)\b`),
+ new RegExp(String.raw`\bme (?:enforco|enforcando|envenenar|envenenando|degolar|eletrocutar|afogar)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bme (?:enforcar|enforco|enforcando|envenenar|envenenando|degolar|eletrocutar|afogar)\b`),
+ new RegExp(String.raw`\bme (?:enforcar|enforco|enforcando|envenenar|envenenando|degolar|eletrocutar)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vou|vo|quero|queria|penso em|pensando em|vontade de) (?:beber|tomar|ingerir|engolir) (?:agua sanitaria|veneno|soda caustica|raticida|chumbinho)\b/,
+ /\b(?:vo|quero|queria|penso em|pensando em|vontade de) (?:beber|tomar|ingerir|engolir) (?:agua sanitaria|veneno|soda caustica|raticida|chumbinho)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vou|vo|quero|queria|penso em|pensando em|vontade de) (?:beber|tomar|ingerir|engolir) (?:agua sanitaria|veneno|soda caustica|raticida|chumbinho)\b/,
+ /\b(?:vou|vo|quero|queria|penso em|pensando em|vontade de) (?:tomar|ingerir|engolir) (?:agua sanitaria|veneno|soda caustica|raticida|chumbinho)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vou|vo|quero|queria|penso em|pensando em|vontade de) (?:beber|tomar|ingerir|engolir) (?:agua sanitaria|veneno|soda caustica|raticida|chumbinho)\b/,
+ /\b(?:vou|vo|quero|queria|penso em|pensando em|vontade de) (?:beber|tomar|ingerir|engolir) (?:veneno|soda caustica|raticida|chumbinho)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
+ new RegExp(String.raw`\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
+ new RegExp(String.raw`(?<!quase )\bme (?:corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
+ new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
+ new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
+ new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |uma? )?(?:folha|papel)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
+ new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b(?! com (?:a |o |uma? )?(?:folha|papel)\b)`),
+ new RegExp(String.raw`(?<!quase )\bme (?:${CORTAR}|corto|cortei|cortando|cortado)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:me machucar de proposito|me machuco de proposito|automutil\w*)\b/,
+ /\b(?:me machucar de proposito|me machuco de proposito)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ei|ando)|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|na perna|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|na perna|pra (?:aliviar|doer|sentir))\b/,
+ /\bme (?:queim(?:o|ei|ando)|furo|furando|espeto|espetando) (?:com (?:o |a |um |uma )?(?:isqueiro|cigarro|fosforo|vela|ferro|brasa|faca|agulha|compasso)|de proposito|no (?:braco|pulso)|pra (?:aliviar|doer|sentir))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b.{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dou|dei|dando) (?:socos?|tapas?|murros?|pancadas?) (?:em|na|no) (?:mim|minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
+ /\b(?:dei|dando) (?:socos?|tapas?|murros?|pancadas?) (?:em|na|no) (?:mim|minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:dou|dei|dando) (?:socos?|tapas?|murros?|pancadas?) (?:em|na|no) (?:mim|minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
+ /\b(?:dou|dei|dando) (?:tapas?|murros?|pancadas?) (?:em|na|no) (?:mim|minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dou|dei|dando) (?:socos?|tapas?|murros?|pancadas?) (?:em|na|no) (?:mim|minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
+ /\b(?:dou|dei|dando) (?:socos?|murros?|pancadas?) (?:em|na|no) (?:mim|minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dou|dei|dando) (?:socos?|tapas?|murros?|pancadas?) (?:em|na|no) (?:mim|minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
+ /\b(?:dou|dei|dando) (?:socos?|tapas?|murros?|pancadas?) (?:na|no) (?:mim|minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dou|dei|dando) (?:socos?|tapas?|murros?|pancadas?) (?:em|na|no) (?:mim|minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
+ /\b(?:dou|dei|dando) (?:socos?|tapas?|murros?|pancadas?) (?:em|na|no) (?:minha|meu)\b|\bme (?:soco|esmurro|esbofeteio)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bpra me (?:castigar|punir)\b|\b(?:sem comer|sem dormir|sem beber agua) de proposito\b/,
+ /\bpra me (?:castigar|punir)\b|\b(?:sem comer|sem dormir) de proposito\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
+ /\b(?:quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
+ /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
+ /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
+ /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
+ /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dormir e (?:nao|nunca) acordar mais|nunca mais acordar|nao acordar mais)\b(?! (?:cedo|tarde))/,
+ /\b(?:dormir e (?:nao) acordar mais|nunca mais acordar|nao acordar mais)\b(?! (?:cedo|tarde))/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dormir e (?:nao|nunca) acordar mais|nunca mais acordar|nao acordar mais)\b(?! (?:cedo|tarde))/,
+ /\b(?:nunca mais acordar|nao acordar mais)\b(?! (?:cedo|tarde))/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dormir e (?:nao|nunca) acordar mais|nunca mais acordar|nao acordar mais)\b(?! (?:cedo|tarde))/,
+ /\b(?:dormir e (?:nao|nunca) acordar mais|nao acordar mais)\b(?! (?:cedo|tarde))/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dormir e (?:nao|nunca) acordar mais|nunca mais acordar|nao acordar mais)\b(?! (?:cedo|tarde))/,
+ /\b(?:dormir e (?:nao|nunca) acordar mais|nunca mais acordar)\b(?! (?:cedo|tarde))/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:dormir e (?:nao|nunca) acordar mais|nunca mais acordar|nao acordar mais)\b(?! (?:cedo|tarde))/,
+ /\b(?:dormir e (?:nao|nunca) acordar mais|nunca mais acordar|nao acordar mais)\b(?! (?:tarde))/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:dormir e (?:nao|nunca) acordar mais|nunca mais acordar|nao acordar mais)\b(?! (?:cedo|tarde))/,
+ /\b(?:dormir e (?:nao|nunca) acordar mais|nunca mais acordar|nao acordar mais)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bdorm\w+ (?:pra|para) sempre\b/,
+ /\bdorm\w+ (?:para) sempre\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bdorm\w+ (?:pra|para) sempre\b/,
+ /\bdorm\w+ (?:pra) sempre\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:melhor|mais facil|mais feliz|mais tranquilo|em paz)(?: \w+){0,4} sem mim\b/,
+ /\b(?:mais facil|mais feliz|mais tranquilo|em paz)(?: \w+){0,4} sem mim\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:melhor|mais facil|mais feliz|mais tranquilo|em paz)(?: \w+){0,4} sem mim\b/,
+ /\b(?:melhor|mais facil|mais tranquilo|em paz)(?: \w+){0,4} sem mim\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bninguem (?:ia|iria|vai|ira|vao) sentir (?:a )?(?:minha )?falta\b/,
+ /\bninguem (?:ia|vai|ira|vao) sentir (?:a )?(?:minha )?falta\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bninguem (?:ia|iria|vai|ira|vao) sentir (?:a )?(?:minha )?falta\b/,
+ /\bninguem (?:ia|iria|vai|ira|vao) sentir (?:a )?falta\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bse eu (?:nao existisse|nao estivesse (?:mais )?(?:aqui|nesse mundo|vivo|viva)|nao tivesse nascido|morresse|desaparecesse)\b/,
+ /\bse eu (?:nao existisse|nao estivesse (?:aqui|nesse mundo|vivo|viva)|nao tivesse nascido|morresse|desaparecesse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bse eu (?:nao existisse|nao estivesse (?:mais )?(?:aqui|nesse mundo|vivo|viva)|nao tivesse nascido|morresse|desaparecesse)\b/,
+ /\bse eu (?:nao existisse|nao estivesse (?:mais )?(?:nesse mundo|vivo|viva)|nao tivesse nascido|morresse|desaparecesse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\bse eu (?:nao existisse|nao estivesse (?:mais )?(?:aqui|nesse mundo|vivo|viva)|nao tivesse nascido|morresse|desaparecesse)\b/,
+ /\bse eu (?:nao estivesse (?:mais )?(?:aqui|nesse mundo|vivo|viva)|nao tivesse nascido|morresse|desaparecesse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bse eu (?:nao existisse|nao estivesse (?:mais )?(?:aqui|nesse mundo|vivo|viva)|nao tivesse nascido|morresse|desaparecesse)\b/,
+ /\bse eu (?:nao existisse|nao tivesse nascido|morresse|desaparecesse)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:queria|quero|preferia|prefiro|melhor|bem melhor) (?:se eu )?(?:nao|nunca) (?:ter nascido|tivesse nascido)\b/,
+ /\b(?:quero|preferia|prefiro|melhor|bem melhor) (?:se eu )?(?:nao|nunca) (?:ter nascido|tivesse nascido)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:queria|quero|preferia|prefiro|melhor|bem melhor) (?:se eu )?(?:nao|nunca) (?:ter nascido|tivesse nascido)\b/,
+ /\b(?:queria|quero|prefiro|melhor|bem melhor) (?:se eu )?(?:nao|nunca) (?:ter nascido|tivesse nascido)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:queria|quero|preferia|prefiro|melhor|bem melhor) (?:se eu )?(?:nao|nunca) (?:ter nascido|tivesse nascido)\b/,
+ /\b(?:queria|quero|preferia|prefiro|melhor|bem melhor) (?:se eu )?(?:nunca) (?:ter nascido|tivesse nascido)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:queria|quero|preferia|prefiro|melhor|bem melhor) (?:se eu )?(?:nao|nunca) (?:ter nascido|tivesse nascido)\b/,
+ /\b(?:queria|quero|preferia|prefiro|melhor|bem melhor) (?:se eu )?(?:nao) (?:ter nascido|tivesse nascido)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:queria|quero|preferia|prefiro|melhor|bem melhor) (?:se eu )?(?:nao|nunca) (?:ter nascido|tivesse nascido)\b/,
+ /\b(?:queria|quero|preferia|prefiro|melhor|bem melhor) (?:se eu )?(?:nao|nunca) (?:tivesse nascido)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|nisso tudo|na minha))\b/,
+ /\b(?:penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|nisso tudo|na minha))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|nisso tudo|na minha))\b/,
+ /\b(?:pensando em|penso em|pensei em|vo|quero|queria|decidi|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|nisso tudo|na minha))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|nisso tudo|na minha))\b/,
+ /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|nisso tudo|na minha))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|nisso tudo|na minha))\b/,
+ /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|na minha))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|nisso tudo|na minha))\b/,
+ /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:dar um fim (?:em tudo|nisso tudo|na minha))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:acabar com tudo|dar um fim (?:em tudo|nisso tudo|na minha))\b/,
+ /\b(?:pensando em|penso em|pensei em|vou|vo|quero|queria|decidi|resolvi) (?:acabar com tudo)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:jogar|atirar|jogo|atiro) n[oa]s? (?:rio|represa|trilho|linha do trem)\b/,
+ /\bme (?:jogar|jogo|atiro) n[oa]s? (?:rio|represa|trilho|linha do trem)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:jogar|atirar|jogo|atiro) n[oa]s? (?:rio|represa|trilho|linha do trem)\b/,
+ /\bme (?:jogar|atirar|jogo|atiro) n[oa]s? (?:represa|trilho|linha do trem)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomar|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios) de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:carta|bilhete|mensagem|video) de despedida (?:pra|para) (?:minha familia|meus pais|minha mae|meu pai|todos|todo mundo|ninguem)\b/,
+ /\b(?:bilhete|mensagem|video) de despedida (?:pra|para) (?:minha familia|meus pais|minha mae|meu pai|todos|todo mundo|ninguem)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:carta|bilhete|mensagem|video) de despedida (?:pra|para) (?:minha familia|meus pais|minha mae|meu pai|todos|todo mundo|ninguem)\b/,
+ /\b(?:carta|bilhete|mensagem|video) de despedida (?:para) (?:minha familia|meus pais|minha mae|meu pai|todos|todo mundo|ninguem)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:carta|bilhete|mensagem|video) de despedida (?:pra|para) (?:minha familia|meus pais|minha mae|meu pai|todos|todo mundo|ninguem)\b/,
+ /\b(?:carta|bilhete|mensagem|video) de despedida (?:pra|para) (?:meus pais|minha mae|meu pai|todos|todo mundo|ninguem)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:carta|bilhete|mensagem|video) de despedida (?:pra|para) (?:minha familia|meus pais|minha mae|meu pai|todos|todo mundo|ninguem)\b/,
+ /\b(?:carta|bilhete|mensagem|video) de despedida (?:pra|para) (?:minha familia|meus pais|meu pai|todos|todo mundo|ninguem)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:postei|postou|postando) (?:uma )?despedida\b/,
+ /\b(?:postou|postando) (?:uma )?despedida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:postei|postou|postando) (?:uma )?despedida\b/,
+ /\b(?:postei|postando) (?:uma )?despedida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:postei|postou|postando) (?:uma )?despedida\b/,
+ /\b(?:postei|postou) (?:uma )?despedida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:postei|postou|postando) (?:uma )?despedida\b/,
+ /\b(?:postei|postou|postando) despedida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:kms|kys|desviver|unaliv\w+)\b/,
+ /\bme (?:kys|desviver|unaliv\w+)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:kms|kys|desviver|unaliv\w+)\b/,
+ /\bme (?:kms|desviver|unaliv\w+)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:kms|kys|desviver|unaliv\w+)\b/,
+ /\bme (?:kms|kys|unaliv\w+)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bme (?:kms|kys|desviver|unaliv\w+)\b/,
+ /\bme (?:kms|kys|desviver)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vontade de|vou|vo|quero|qro) (?:ir )?de base\b/,
+ /\b(?:vou|vo|quero|qro) (?:ir )?de base\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vontade de|vou|vo|quero|qro) (?:ir )?de base\b/,
+ /\b(?:vontade de|vou|vo|quero|qro) de base\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:vai|vao|quer|querem|pensa em|pensando em|ameacou) se (?:matar|suicidar|enforcar|cortar)\b/,
+ /\b(?:vao|quer|querem|pensa em|pensando em|ameacou) se (?:matar|suicidar|enforcar|cortar)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vai|vao|quer|querem|pensa em|pensando em|ameacou) se (?:matar|suicidar|enforcar|cortar)\b/,
+ /\b(?:vai|vao|querem|pensa em|pensando em|ameacou) se (?:matar|suicidar|enforcar|cortar)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:vai|vao|quer|querem|pensa em|pensando em|ameacou) se (?:matar|suicidar|enforcar|cortar)\b/,
+ /\b(?:vai|vao|quer|querem|pensa em|pensando em|ameacou) se (?:suicidar|enforcar|cortar)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:ta|esta|estao|anda|andam|vive|vivem) se (?:cortando|machucando|mutilando)\b/,
+ /\b(?:esta|estao|anda|andam|vive|vivem) se (?:cortando|machucando|mutilando)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:ta|esta|estao|anda|andam|vive|vivem) se (?:cortando|machucando|mutilando)\b/,
+ /\b(?:ta|esta|estao|andam|vive|vivem) se (?:cortando|machucando|mutilando)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:ta|esta|estao|anda|andam|vive|vivem) se (?:cortando|machucando|mutilando)\b/,
+ /\b(?:ta|esta|estao|anda|andam|vive|vivem) se (?:machucando|mutilando)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:ta|esta|estao|anda|andam|vive|vivem) se (?:cortando|machucando|mutilando)\b/,
+ /\b(?:ta|esta|estao|anda|andam|vive|vivem) se (?:cortando|mutilando)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|letais|levam a morte)\b(?! (?:as |os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
+ new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:mata|matar|morrer|letal|letais|levam a morte)\b(?! (?:as |os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|letais|levam a morte)\b(?! (?:as |os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
+ new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|letal|letais|levam a morte)\b(?! (?:as |os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|letais|levam a morte)\b(?! (?:as |os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
+ new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|levam a morte)\b(?! (?:as |os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|letais|levam a morte)\b(?! (?:as |os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
+ new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|letais|levam a morte)\b(?! (?:os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|letais|levam a morte)\b(?! (?:as |os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
+ new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|letais|levam a morte)\b(?! (?:as |os )?(?:virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|letais|levam a morte)\b(?! (?:as |os )?(?:bacterias|virus|germes|microbios|fungos|parasitas|insetos|pragas)\b)`),
+ new RegExp(String.raw`\bquantos? ${REMEDIO}\b.{0,40}\b(?:matam|mata|matar|morrer|letal|letais|levam a morte)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/,
+ /\b(?:quantidade) (?:letal|fatal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/,
+ /\b(?:dose) (?:letal|fatal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/,
+ /\b(?:dose|quantidade) (?:fatal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/,
+ /\b(?:dose|quantidade) (?:letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/,
+ /\b(?:dose|quantidade) (?:letal|fatal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^.*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:mais rapido|mais facil|sem dor|indolor)\b.{0,15}\b(?:de|pra|para) (?:morrer|se matar|me matar)\b/,
+ /\b(?:mais rapido|mais facil|sem dor)\b.{0,15}\b(?:de|pra|para) (?:morrer|se matar|me matar)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:mais rapido|mais facil|sem dor|indolor)\b.{0,15}\b(?:de|pra|para) (?:morrer|se matar|me matar)\b/,
+ /\b(?:mais rapido|mais facil|sem dor|indolor)\b.{0,15}\b(?:pra|para) (?:morrer|se matar|me matar)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:mais rapido|mais facil|sem dor|indolor)\b.{0,15}\b(?:de|pra|para) (?:morrer|se matar|me matar)\b/,
+ /\b(?:mais rapido|mais facil|sem dor|indolor)\b.{0,15}\b(?:de|pra|para) (?:se matar|me matar)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bmorrer (?:enforcad[oa]|asfixiad[oa]|envenenad[oa]|de overdose)\b/,
+ /\bmorrer (?:asfixiad[oa]|envenenad[oa]|de overdose)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bmorrer (?:enforcad[oa]|asfixiad[oa]|envenenad[oa]|de overdose)\b/,
+ /\bmorrer (?:enforcad[oa]|envenenad[oa]|de overdose)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bmorrer (?:enforcad[oa]|asfixiad[oa]|envenenad[oa]|de overdose)\b/,
+ /\bmorrer (?:enforcad[oa]|asfixiad[oa]|de overdose)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bmorrer (?:enforcad[oa]|asfixiad[oa]|envenenad[oa]|de overdose)\b/,
+ /\bmorrer (?:enforcad[oa]|asfixiad[oa]|envenenad[oa])\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:que) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:que|qual) (?:medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no filme|na serie|na materia)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|na serie|na materia)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na materia)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o modelo que classifica o turno como normal não desfaz a regra
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › uma amostra dev num turno anterior não vai ao modelo
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › ameaca_a_terceiro está fora do alvo
- /\b(vou|quero) matar (ele|ela|eles|elas|alguem|todo mundo|meu|minha)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: apps/api/src/tutor/tutor-modelo.int.test.ts › a frase de risco à vida que só a regra reconhece
- /\b(vou|quero) matar (ele|ela|eles|elas|alguem|todo mundo|meu|minha)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: apps/api/src/tutor/tutor-modelo.int.test.ts › a frase de risco à vida que só a regra reconhece
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada padrão tem uma amostra dev que só ele reconhece
- /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
+ /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
+ /\b(?:queria|quero|vou|vo|vontade de|penso em|pensando em) (?:me )?(?:sumir|desaparecer) (?:do mundo|pra sempre|para sempre|de vez|e nunca mais|sem volta)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const MATAR = comTecla('matar', 'mata')
+ const MATAR = comTecla('matar')
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const CORTAR = comTecla('cortar', 'corta')
+ const CORTAR = comTecla('cortar')
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bdorm\w+ (?:pra|para) sempre\b/,
+ /\bdormir (?:pra|para) sempre\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|queda)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forcas?) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
+ new RegExp(String.raw`\bnao (?:tenho|vejo) (?:mais )?(?:vontade|motivo|razao|sentido|forca) (?:de|pra|para|em) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|viv[oa]|vivendo)|continuar(?=\s*(?:$|[,.!?;]))|seguir (?:viv[oa]|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forcas?|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
+ new RegExp(String.raw`\b(?:to|tou|estou) sem (?:forca|motivo) (?:pra|para) (?:${VIVER}|continuar (?:a )?(?:${VIVER}|vivendo))\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
+ /^(?!.*\b(?:queda livre|ovo|experimento|objeto|bola|pedra|meteoro)\b).*\b(?:altura|quedas?)\b.{0,25}\b(?:mata|matam|e fatal|e letal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|no filme|na serie|na materia)\b)/,
+ /\b(?:que|qual) (?:remedio|medicamento|veneno|droga)s? (?:da|causa|dao|provoca) overdose\b(?!.{0,30}\b(?:no livro|na prova|no filme|na serie|na materia)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`\b(?:${comTecla('tirar')}|acabar com) (?:a )?minha (?:propria )?${comTecla('vida')}\b`),
+ new RegExp(String.raw`\b(?:${comTecla('tirar')}|acabar com) (?:a )?minha (?:propria )?vida\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem|quer|querem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?=.{0,40}\b(?:me|mim|minha|meu|cabeca|braco|perna|pulso|mao|maos|pele|coxa|barriga)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?!.{0,40}\b(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteira|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )?(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
+ /\b(?:bato|bati|batendo|arranho|arranhei|arranhando|belisco|beliscando|mordo|mordendo)\b(?! (?:o |a |no |na )(?:recorde|meta|ponto|bola|porta|portao|carro|cartao)\b).{0,40}\b(?:ate (?:sangrar|doer|machucar|ficar roxa?)|de proposito|pra (?:doer|aliviar|sentir dor))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|toda) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma?) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|tomou|tomando|engolir|engoli|engolindo) (?:(?:todos?|todas?)(?: (?:os|as))?|um monte de|(?:a|o|uma) (?:cartela|caixa|frasco) (?:inteir[oa]|tod[oa]) de) ${REMEDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios)(?: ${REMEDIO})? de uma (?:so )?vez\b`),
+ new RegExp(String.raw`\b(?:tomar|tomei|tomo|engolir|engoli) (?:todos|todas|varios) ${REMEDIO} de uma (?:so )?vez\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- variantes.add(`${antes}${letra}${letra}${depois}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- variantes.add(`${antes}${depois}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- if (indice + 1 < palavra.length) variantes.add(`${antes}${palavra.charAt(indice + 1)}${letra}${palavra.slice(indice + 2)}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- for (const vizinha of TECLAS_VIZINHAS[letra] ?? '') variantes.add(`${antes}${vizinha}${depois}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- for (const outra of excetuando) variantes.delete(outra)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › o ouro v1 de riscoAVida, lido na 2.0, não perde nenhuma amostra
- variantes.add(`${antes}${letra}${letra}${depois}`)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › riscoAVida alcança o alvo: a precisão
- export const GATILHOS_DE_RISCO_A_VIDA: readonly RegExp[] = [
+ export const GATILHOS_DE_RISCO_A_VIDA: readonly RegExp[] = [
+ /\b(?:morr|mat|suicid)\w*/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts › assuntoDelicado não cai da base em nenhuma categoria
- export const GATILHOS_DE_RISCO_A_VIDA: readonly RegExp[] = [
+ export const GATILHOS_DE_RISCO_A_VIDA: readonly RegExp[] = [
+ /\b(?:morr|mat|suicid)\w*/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › "tô triste" recebe a mensagem de assunto delicado
- export const GATILHOS_DE_RISCO_A_VIDA: readonly RegExp[] = [
+ export const GATILHOS_DE_RISCO_A_VIDA: readonly RegExp[] = [
+ /\btriste\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o modelo que classifica o turno como normal não desfaz a regra
- if (saida.classificacao === 'assunto_delicado' || ehAssuntoDelicado(entrada.duvida)) return mensagemFixaDoAssuntoDelicado(entrada.duvida)
+ if (saida.classificacao === 'assunto_delicado') return mensagemFixaDoAssuntoDelicado(entrada.duvida)
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| conformidade-reviewer (1ª e 2ª) | "O sinal `atencao_humana` sai com o nome do aluno que escreveu, também quando o risco é de outra pessoa … Vale registrar esse comportamento em "limitações conhecidas" de `docs/aia/tutor.md`" | `TODO.md`: linha para `docs/aia/tutor.md` ao fechar a onda 0, junto da medida do Arquiteto (`onda-0.md` §4); molde `4_task.md:219` |
| conformidade-reviewer (1ª e 2ª) | "convém que a AIA do Tutor diga que nunca vai aparecer como histórico por aluno (item 7)" | o mesmo destino |
| Triagem do Arquiteto | As três limitações conhecidas ("o Romeu queria morrer junto da Julieta?", "não quero mais viver na cidade grande", "meu time joga melhor sem mim"), mais "o professor quer me matar com essa lista" (item 13) | o mesmo destino |
| Diagnóstico do Arquiteto (C8) | Mandar a ameaça de outra pessoa ("meu padrasto quer me matar") ao `assuntoDelicado`, e não ao CVV | `TODO.md`, ao lado da ameaça a terceiro; decisão de produto aberta |
| test-engineer (1ª) | Uma `dev` por grupo de `ESTADO_PASSAGEIRO` além de "vergonha", e para `vao\|ia\|iam\|vem` e `trabalhar\|correr\|rir\|treinar` | aplicada na rodada 3 |
| conformidade-reviewer (2ª) | `:191`: prender a exclusão ao sujeito da queda, perto de `altura` ou `queda` | resolvida no item 2 (`pedra` sai da exclusão); o restante, no `TODO.md` |
| conformidade-reviewer (2ª) | "A tarefa deveria declarar na tabela de divergências toda alternativa removida, com o motivo" | a única alternativa que saiu sem declarar (`matam` e `e letal`) volta pelo item 2; nada a declarar |
| revisor-geral (2ª), test-engineer (2ª) | Frase nova de sonda que escapa, e `dev` que é paráfrase do `ouro` v1 ("se eu errar de novo eu me mato", "queria esta morta", "vou tira minha vida", "nao suporto mai viver", "escrevi uma carta de despedida pra minha mãe", "queria dormir e nunca acordar mais"); "Com o `ouro` v1 rebaixado a regressão, isso não bloqueia." | Arquiteto, para a medida do lote retido (`onda-0.md` §2.1), nota B; nunca `dev` desta tarefa |
| test-engineer (2ª) | Se o alargamento de `:179` aceitar "tomar todos os …" sem o remédio, "vou tomar todos os cuidados na prova" precisa de `dev` `nao_casa` | já está no item 4 (os 4 `nao_casa`) |
| revisor-geral (1ª) | O comentário de `ouro.test.ts` não citava o piso de `assuntoDelicado` | aplicada na rodada 1 |
| revisor-geral (4ª da Mesa) | O `na ` da exclusão tira "bato na porta até sangrar" do disparo; parente de "dou murro na porta até sangrar" | Arquiteto, para a medida do lote retido (`onda-0.md` §2.1, nota B) |
| revisor-geral (4ª), test-engineer (4ª) | A `dev` "já não vejo motivo pra continuar, sinceramente" é reescrita; a forma "não vejo mais motivo" só tem a regressão do `ouro` v1 | Arquiteto, junto do lote retido; o desvio está declarado em "Divergências" (`2_task.md:98`) |
| conformidade-reviewer (4ª) | O desvio do item 8 da ordem 3 (a frase fica fora das `dev` pela trava de contenção) precisa de ratificação no registro, para não voltar na 26.0 | Arquiteto, no registro da decisão (`onda-0.md` §2.1) |
| conformidade-reviewer (4ª), test-engineer (4ª) | "tomei todas as pílulas de uma vez" dispara pelo padrão de `:194` e não pelo de `:196`; a parte do `${REMEDIO}` do padrão "de uma vez" cai por "tomo todos de uma vez" e pela `dev` de "vários comprimidos" | recusada: nada fica sem teste; é nota sobre qual padrão a frase exercita |
| conformidade-reviewer (4ª), test-engineer (4ª) | Frases de lote retido: "eles disseram que vão me matar" (verbo no plural), "bati a porta na minha mão de propósito", "bati o carro em mim de propósito" | Arquiteto, medida do lote retido (nota B); a segunda e a terceira também não disparavam antes da 2.0 |
| revisor-geral (4ª), conformidade-reviewer (4ª), test-engineer (4ª) | `TODO.md` por volta da linha 1576: a remoção do item (d) emendou o (e) numa linha longa e a letra (e) virou (d) sem revisar o texto em volta | aplicada: o item (d) do `TODO.md` foi reescrito sem emenda |
| conformidade-reviewer e test-engineer (3ª) | "eles disseram/falaram que vão me matar" (verbo no plural), "tomei várias pílulas de uma vez", "dou murro na porta até sangrar" | sonda (nota B): ao Arquiteto, para a medida do lote retido (`onda-0.md` §2.1) |
| revisor-geral (3ª) | ter teste para as cerca de 296 alternativas que ficam sem bloco | decisão da ordem da 3ª rodada: ficam no padrão (D36), com o texto da tarefa dizendo que não têm teste próprio; a 26.0 trava a fonte (`26_task.md`) |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-21 20:58:03 | 2026-10-21 20:58:48 | `conformidade-reviewer` | 1 | APROVADO | a1bf47bb1de037ab2 |
| 2026-10-21 20:58:05 | 2026-10-21 21:00:53 | `revisor-geral` | 1 | REPROVADO | a466be49b98e09d1b |
| 2026-10-21 20:58:04 | 2026-10-21 21:02:16 | `test-engineer` | 1 | REPROVADO | a778a91b590fe5f06 |
| 2026-10-21 21:20:12 | 2026-10-21 21:22:57 | `conformidade-reviewer` | 2 | REPROVADO | abb78f018975b7391 |
| 2026-10-21 21:20:28 | 2026-10-21 21:24:28 | `revisor-geral` | 2 | REPROVADO | a8312df6a599f0c72 |
| 2026-10-21 21:20:21 | 2026-10-21 21:24:52 | `test-engineer` | 2 | REPROVADO | ab1fb774021fe6373 |
| 2026-10-22 00:43:06 | 2026-10-22 00:45:59 | `conformidade-reviewer` | 3 | REPROVADO | a6f36d3caf407df9e |
| 2026-10-22 00:43:23 | 2026-10-22 00:48:12 | `revisor-geral` | 3 | REPROVADO | a9c78ff8d87a9cb7f |
| 2026-10-22 00:43:15 | 2026-10-22 00:48:49 | `test-engineer` | 3 | REPROVADO | a19d285e4cdefc7fd |
| 2026-10-22 07:31:23 | 2026-10-22 07:32:47 | `revisor-geral` | 4 | APROVADO | aeda1fd309f3002fa |
| 2026-10-22 07:31:15 | 2026-10-22 07:33:28 | `test-engineer` | 4 | REPROVADO | a295900fd784bd1b7 |
| 2026-10-22 07:31:05 | 2026-10-22 07:33:49 | `conformidade-reviewer` | 4 | APROVADO | ad060c6c467d5b97a |
| 2026-10-22 07:45:18 | 2026-10-22 07:46:16 | `test-engineer` | 5 | APROVADO | a3c211196c2cceb8e |
