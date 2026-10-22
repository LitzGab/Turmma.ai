# Tarefa 93.0 — Frase de risco à vida de palavra que o lote retido mostrou escapar recebe a mensagem fixa e o sinal

**Funcionalidade:** reengenharia · **Depende de:** 2.0
**Subagentes obrigatórios:** `conformidade-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Os jeitos de dizer de palavra que escaparam no lote retido 1 passam a receber a mensagem fixa com o 188 e o sinal, sem
modelo, e as três pioras da 2.0 são desfeitas.

## Contexto necessário

- `onda-0.md` §2.1 ("Quem escreve o padrão não lê o `ouro`", "Estreitar e precisão") e §2.2a
- `docs/aia/ouro/README.md`: as categorias de `riscoAVida` e as decisões 1 a 7 e 5a
- `.claude/rules/70-conformidade-cne.md` (itens 4 e 7), D36 em `docs/decisoes.md`
- Código: `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`, `GATILHOS_DE_RISCO_A_VIDA` (:148) e `mencionaRiscoAVida` (:310)
- **Não abra** `docs/aia/ouro/*.json` nem `docs/aia/ouro-retido/`. O lote 1 está consumido, e o 2 mede esta tarefa

## O jeito de dizer que escapou (lote retido 1, sem as frases)

Escreva a sua `dev` para cada linha, com palavras suas:
- **explicita:** "morrer" como desejo ou merecimento fora de "quero/vou" ("eu devia", "preferia já ter", "minha vontade
  é"); "dar fim na própria vida"; "a data da minha morte".
- **giria_abreviacao:** eufemismo brasileiro (bater as botas, partir dessa pra melhor, virar estrelinha, virar presunto,
  ir de arrasta pra cima, dar game over ou logout da vida, "mrr"); inglês da internet (wanna die, kill myself, ending it,
  sewerslide, rope); "sui" abreviado; leetspeak com números no lugar de letras.
- **digitacao:** erro de tecla **no meio** de "matar/mato", "morrer", "suicídio", "acabar", "jogar" (letra trocada,
  invertida, faltando, dobrada), e não só no fim da palavra.
- **automutilacao_sem_corte:** queimar com isqueiro, esfregar até abrir ferida, apertar até ficar roxo, com "de propósito"
  ou "pra doer".
- **pergunta_sobre_o_meio:** quantidade fatal de um remédio nomeado; de que altura ou andar se cai sem sobreviver; qual
  veneno mata uma pessoa; qual remédio faz o coração parar.

**As três pioras da 2.0:** "suicídio" (substantivo) em primeira pessoa com verbo de desejo, que voltou a escapar; "carta
de suicídio" com erro de tecla na palavra; e "dose letal" numa pergunta de laboratório com o objeto escolar nomeado
(decisão 1), que passou a disparar. Esta última só se estreita se nenhuma `casa` do `ouro` v1 nem das `dev` se perde;
senão continua disparando, como a limitação (c) do `TODO.md` já diz, e a tarefa declara isso nas Divergências.

`indireta` e `risco_de_outra_pessoa` ficam para o modelo (94.0): não force padrão para plano, despedida ou "não existir".

## Subtarefas

- [x] 93.1 — Um padrão por jeito de dizer acima, nas cinco categorias de palavra, cada um com a sua `dev` no `it.each`
- [x] 93.2 — As três pioras desfeitas, cada uma com a sua `dev` (`casa` ou `nao_casa`)
- [x] 93.3 — Testes: as `dev`, a regressão exata do `ouro` v1, o alvo e o piso de `assuntoDelicado`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` | alterado |
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Cada jeito de dizer tem a sua `dev` e recebe a mensagem de risco, sem modelo | unidade, `turno-do-tutor.test.ts` | tirar cada padrão novo (um bloco por padrão) |
| "suicídio" em 1ª pessoa com verbo de desejo volta a casar | unidade | o estreitamento de "suicídio" da 2.0 |
| "carta de suicídio" com erro de tecla casa | unidade | tirar a tolerância de tecla dessa palavra |
| "dose letal" na aula de ciências, com a sigla DL50 ou com o rato, continua disparando: a terceira piora fica (Divergências) | unidade | tirar o padrão de "dose letal" |
| O `ouro` v1 não perde nenhuma amostra, e o alvo e a precisão seguem | unidade, `ouro.test.ts` (sem editar) | padrão largo `/\bmorr\w*/` |
| `assuntoDelicado` não cai da base | unidade, `ouro.test.ts` (sem editar) | idem |
| Nenhuma `dev` é frase do `ouro` | unidade, teste de contenção (`:700`) | — |

Isolamento, concorrência e log não mudam (a regra é pura).

## Como testar

- Copie `turno-do-tutor.test.ts › risco à vida: um padrão por jeito de dizer… › cada jeito de dizer recebe a mensagem
  fixa de risco, sem modelo: $jeito` (`:681`): cada `dev` nova é uma linha de `JEITOS_DE_DIZER_RISCO_A_VIDA` (`:441`)
- A `nao_casa` nova: o caso de "suicídio na Revolução Francesa" do mesmo arquivo, com a sua frase
- Rodar: `npx vitest run --project unidade packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts packages/nucleo/src/ia/ouro.test.ts`
- Armadilhas da 2.0: procurar no `ouro` o id que o teste mostra é ler o `ouro`; sonda de revisor não vira `dev`;
  estreitar só onde o README diz `nao_casa`; o `ouro.test.ts` não muda aqui

## Fora do escopo desta tarefa

O modelo, `indireta` e `risco_de_outra_pessoa` (94.0); `ameaca_a_terceiro` (`TODO.md`); `conformidade/` (26.0); o lote retido 2.

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| "Dose letal" continua disparando em qualquer frase, como na 2.0: também na aula de ciências, com a sigla DL50 ou com o rato. A terceira piora da 2.0 não se desfaz. As duas tentativas de estreitar (a lista de "o aluno na frase" e depois o rato e a sigla) deixaram passar frases do aluno que a 2.0 pegava, porque separar a matéria da pergunta do aluno exige saber quem fala | "As três pioras" desta tarefa ("senão continua disparando"); diagnóstico do Arquiteto (`.processo/ordens/diagnostico-93.md`) | `onda-0.md` §2.1 ("Estreitar e precisão"); `docs/aia/ouro/README.md`, decisões 1 e 4; `TODO.md`, limitação (c); `docs/aia/tutor.md` N13 |
| "Carta de suicídio" casa em qualquer pessoa, **menos** quando a palavra é seguida de "do/da/dos/das" mais uma palavra que não é "meu/minha" ("do Getúlio Vargas", "da rainha"); "carta do suicida" não casa (a palavra tem de ser "suicídio"). "De novo", "de despedida" e "de duas páginas" disparam, assim como "de um poeta romântico no livro" (saiu das `nao_casa`). "O Getúlio deixou uma carta de suicídio" continua disparando: só se separaria de "meu primo deixou…" sabendo quem escreve | as duas reprovações da correção absorvida (`revisor-geral` exigiu tirar Vargas e Werther; `conformidade-reviewer` exigiu não perder a carta do próprio aluno) e a rodada 1 desta tarefa (item 3) | `onda-0.md` §2.1 ("Estreitar e precisão", decisões 1 e 4); `docs/aia/ouro/README.md`, decisão 1; limitação em `docs/aia/tutor.md` N13 (arquivo fora dos "Arquivos previstos", por ordem do §2.1) |
| "Suicídio" como desejo: lista fechada de palavras de ênfase entre o verbo e a palavra ("só", "muito", "mesmo", "logo", "agora", "hoje", "realmente", "de verdade", "já"), e fica de fora "suicídio do/da/dos X" (matéria). Uma lista aberta de uma palavra qualquer pegaria "quero saber sobre suicídio", que o README manda não casar | decisão 1 do `docs/aia/ouro/README.md` | `onda-0.md` §2.2a, §2.1 |

## Mutações

Um bloco por padrão novo e por alternativa que a tarefa acrescentou: cada palavra de ênfase, cada fim de frase, cada artigo e cada forma de tecla têm a sua `dev` (nas tabelas de `turno-do-tutor.test.ts`) e o seu bloco. Cláusula com a `dev` `nao_casa` (a exceção de matéria, o objeto de laboratório, "sem querer") se prova pelo teste "o que é expressão, acidente ou matéria não dispara"; a tolerância de tecla, pelo "a tecla errada em".

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- const MATO = comTecla('mato', 'ato')
+ const MATO = 'mato'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const MATO = comTecla('mato', 'ato')
+ const MATO = comTecla('mato')
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- const ACABAR = comTecla('acabar', 'acaba')
+ const ACABAR = 'acabar'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const ACABAR = comTecla('acabar', 'acaba')
+ const ACABAR = comTecla('acabar')
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- const JOGAR = comTecla('jogar')
+ const JOGAR = 'jogar'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- const SUICIDIO = `(?:s[ui]{1,2}ci?d\\w*|${comTecla('suicidio')}|${comTecla('suicidar')})`
+ const SUICIDIO = `(?:s[ui]{1,2}ci?d\\w*|${comTecla('suicidar')})`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- const SUICIDIO = `(?:s[ui]{1,2}ci?d\\w*|${comTecla('suicidio')}|${comTecla('suicidar')})`
+ const SUICIDIO = `(?:s[ui]{1,2}ci?d\\w*|${comTecla('suicidio')})`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- const SUICIDIO_SO_O_SUBSTANTIVO = `(?:suicidio|${comTecla('suicidio')})`
+ const SUICIDIO_SO_O_SUBSTANTIVO = `(?:suicidio)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LEET: Readonly<Record<string, string>> = { o: '[o0]', e: '[e3]', a: '[a4]', i: '[i1]' }
+ const LEET: Readonly<Record<string, string>> = { e: '[e3]', a: '[a4]', i: '[i1]' }
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LEET: Readonly<Record<string, string>> = { o: '[o0]', e: '[e3]', a: '[a4]', i: '[i1]' }
+ const LEET: Readonly<Record<string, string>> = { o: '[o0]', a: '[a4]', i: '[i1]' }
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LEET: Readonly<Record<string, string>> = { o: '[o0]', e: '[e3]', a: '[a4]', i: '[i1]' }
+ const LEET: Readonly<Record<string, string>> = { o: '[o0]', e: '[e3]', i: '[i1]' }
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const LEET: Readonly<Record<string, string>> = { o: '[o0]', e: '[e3]', a: '[a4]', i: '[i1]' }
+ const LEET: Readonly<Record<string, string>> = { o: '[o0]', e: '[e3]', a: '[a4]' }
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const MINHA_VONTADE = 'minha vontade (?:e|era)'
+ const MINHA_VONTADE = 'minha vontade (?:era)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const MINHA_VONTADE = 'minha vontade (?:e|era)'
+ const MINHA_VONTADE = 'minha vontade (?:e)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
+ const ENFASE = '(?: (?:muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
+ const ENFASE = '(?: (?:so|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
+ const ENFASE = '(?: (?:so|muito|logo|agora|hoje|realmente|de verdade|ja))*'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
+ const ENFASE = '(?: (?:so|muito|mesmo|agora|hoje|realmente|de verdade|ja))*'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
+ const ENFASE = '(?: (?:so|muito|mesmo|logo|hoje|realmente|de verdade|ja))*'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
+ const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|realmente|de verdade|ja))*'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
+ const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|de verdade|ja))*'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
+ const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|ja))*'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
+ const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade))*'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))*'
+ const ENFASE = '(?: (?:so|muito|mesmo|logo|agora|hoje|realmente|de verdade|ja))?'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const NAO_E_ESTADO = `(?! (?:de|do|da) (?:${ESTADO_PASSAGEIRO})\\b)`
+ const NAO_E_ESTADO = ''
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const REMEDIO_NOMEADO = '(?:paracetamol|dipirona|rivotril|ibuprofeno|insulina)'
+ const REMEDIO_NOMEADO = '(?:dipirona|rivotril|ibuprofeno|insulina)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const REMEDIO_NOMEADO = '(?:paracetamol|dipirona|rivotril|ibuprofeno|insulina)'
+ const REMEDIO_NOMEADO = '(?:paracetamol|rivotril|ibuprofeno|insulina)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const REMEDIO_NOMEADO = '(?:paracetamol|dipirona|rivotril|ibuprofeno|insulina)'
+ const REMEDIO_NOMEADO = '(?:paracetamol|dipirona|ibuprofeno|insulina)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const REMEDIO_NOMEADO = '(?:paracetamol|dipirona|rivotril|ibuprofeno|insulina)'
+ const REMEDIO_NOMEADO = '(?:paracetamol|dipirona|rivotril|insulina)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const REMEDIO_NOMEADO = '(?:paracetamol|dipirona|rivotril|ibuprofeno|insulina)'
+ const REMEDIO_NOMEADO = '(?:paracetamol|dipirona|rivotril|ibuprofeno)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const PARTE_DO_CORPO = '(?:braco|perna|mao|pulso|pele)s?'
+ const PARTE_DO_CORPO = '(?:perna|mao|pulso|pele)s?'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const PARTE_DO_CORPO = '(?:braco|perna|mao|pulso|pele)s?'
+ const PARTE_DO_CORPO = '(?:braco|mao|pulso|pele)s?'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const PARTE_DO_CORPO = '(?:braco|perna|mao|pulso|pele)s?'
+ const PARTE_DO_CORPO = '(?:braco|perna|pulso|pele)s?'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const PARTE_DO_CORPO = '(?:braco|perna|mao|pulso|pele)s?'
+ const PARTE_DO_CORPO = '(?:braco|perna|mao|pele)s?'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const PARTE_DO_CORPO = '(?:braco|perna|mao|pulso|pele)s?'
+ const PARTE_DO_CORPO = '(?:braco|perna|mao|pulso)s?'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- const PARTE_DO_CORPO = '(?:braco|perna|mao|pulso|pele)s?'
+ const PARTE_DO_CORPO = '(?:braco|perna|mao|pulso|pele)'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
+ new RegExp(String.raw`\b(?:eu (?:merecia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
+ new RegExp(String.raw`\b(?:eu (?:devia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
+ new RegExp(String.raw`\b(?:eu (?:devia|merecia)) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
+ new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
+ new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:${MORRER})\b${NAO_E_ESTADO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
+ new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:${MORRER}|morrido)\b${NAO_E_ESTADO}`),
+ new RegExp(String.raw`\b(?:eu (?:devia|merecia)|mereco) (?:ter )?(?:morrer|morrido)\b${NAO_E_ESTADO}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\bmelhor eu ${MORRER}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`\bmelhor eu ${MORRER}\b`),
+ new RegExp(String.raw`\bmelhor eu morrer\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:preferia|queria) (?:ja )?ter morrido\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:preferia|queria) (?:ja )?ter morrido\b/,
+ /\b(?:queria) (?:ja )?ter morrido\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:preferia|queria) (?:ja )?ter morrido\b/,
+ /\b(?:preferia) (?:ja )?ter morrido\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:preferia|queria) (?:ja )?ter morrido\b/,
+ /\b(?:preferia|queria) ter morrido\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b${MINHA_VONTADE} ${MORRER}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`\b${MINHA_VONTADE} ${MORRER}\b`),
+ new RegExp(String.raw`\b${MINHA_VONTADE} morrer\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
+ /\b(?:dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
+ /\b(?:dar) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
+ /\b(?:dar|dei) fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
+ /\b(?:dar|dei) (?:um )?fim (?:a) (?:(?:minha|propria) )+vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
+ /\b(?:dar|dei) (?:um )?fim (?:na) (?:(?:minha|propria) )+vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
+ /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:propria) )+vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
+ /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha) )+vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )+vida\b/,
+ /\b(?:dar|dei) (?:um )?fim (?:na|a) (?:(?:minha|propria) )vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:data|dia) da minha morte\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:data|dia) da minha morte\b/,
+ /\b(?:dia) da minha morte\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:data|dia) da minha morte\b/,
+ /\b(?:data) da minha morte\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar presunto|(?:ir )?de arrasta pra cima)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|(?:ir )?de arrasta pra cima)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|de arrasta pra cima)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bdar (?:game over|logout) (?:na|da) (?:minha )?vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bdar (?:game over|logout) (?:na|da) (?:minha )?vida\b/,
+ /\bdar (?:logout) (?:na|da) (?:minha )?vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bdar (?:game over|logout) (?:na|da) (?:minha )?vida\b/,
+ /\bdar (?:game over) (?:na|da) (?:minha )?vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bdar (?:game over|logout) (?:na|da) (?:minha )?vida\b/,
+ /\bdar (?:game over|logout) (?:da) (?:minha )?vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bdar (?:game over|logout) (?:na|da) (?:minha )?vida\b/,
+ /\bdar (?:game over|logout) (?:na) (?:minha )?vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bdar (?:game over|logout) (?:na|da) (?:minha )?vida\b/,
+ /\bdar (?:game over|logout) (?:na|da) vida\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) mrr\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) mrr\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vo) mrr\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) mrr\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou) mrr\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo|ideias? de) (?:me )?sui\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo|ideias? de) (?:me )?sui\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vo|ideias? de) (?:me )?sui\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo|ideias? de) (?:me )?sui\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|ideias? de) (?:me )?sui\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo|ideias? de) (?:me )?sui\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:me )?sui\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo|ideias? de) (?:me )?sui\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo|ideia de) (?:me )?sui\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo|ideias? de) (?:me )?sui\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo|ideias? de) sui\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:wanna|want to) die\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:wanna|want to) die\b/,
+ /\b(?:want to) die\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:wanna|want to) die\b/,
+ /\b(?:wanna) die\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bkill(?:ing)? myself\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bkill(?:ing)? myself\b/,
+ /\bkill myself\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:ending it|end it all|end my life)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:ending it|end it all|end my life)\b/,
+ /\b(?:end it all|end my life)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:ending it|end it all|end my life)\b/,
+ /\b(?:ending it|end my life)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:ending it|end it all|end my life)\b/,
+ /\b(?:ending it|end it all)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bsewer ?slide\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bsewer ?slide\b/,
+ /\bsewerslide\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\bsewer ?slide\b/,
+ /\bsewer slide\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:wanna|gonna) rope\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:wanna|gonna) rope\b/,
+ /\b(?:gonna) rope\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:wanna|gonna) rope\b/,
+ /\b(?:wanna) rope\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) ${leetComNumero('morrer')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) ${leetComNumero('morrer')}\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) ${leetComNumero('morrer')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) ${leetComNumero('morrer')}\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vo) ${leetComNumero('morrer')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) ${leetComNumero('morrer')}\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou) ${leetComNumero('morrer')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) ${leetComNumero('morrer')}\b`),
+ new RegExp(String.raw`\b(?:${leet('quero')}|vou|vo) ${leetComNumero('morrer')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) ${leetComNumero('morrer')}\b`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) ${leet('morrer')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|${QUERO}|${leet('quero')}) me ${leetComNumero('matar')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|${QUERO}|${leet('quero')}) me ${leetComNumero('matar')}\b`),
+ new RegExp(String.raw`\b(?:vo|${QUERO}|${leet('quero')}) me ${leetComNumero('matar')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|${QUERO}|${leet('quero')}) me ${leetComNumero('matar')}\b`),
+ new RegExp(String.raw`\b(?:vou|${QUERO}|${leet('quero')}) me ${leetComNumero('matar')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|${QUERO}|${leet('quero')}) me ${leetComNumero('matar')}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|${leet('quero')}) me ${leetComNumero('matar')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:vou|vo|${QUERO}|${leet('quero')}) me ${leetComNumero('matar')}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|${QUERO}) me ${leetComNumero('matar')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:vou|vo|${QUERO}|${leet('quero')}) me ${leetComNumero('matar')}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|${QUERO}|${leet('quero')}) me ${leet('matar')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:o |um )?${leetComNumero('suicidio')}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:o |um )?${leetComNumero('suicidio')}`),
+ new RegExp(String.raw`\b(?:${leet('quero')}|vou|vo) (?:o |um )?${leetComNumero('suicidio')}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:o |um )?${leetComNumero('suicidio')}`),
+ new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:o |um )?${leetComNumero('suicidio')}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:o |um )?${leetComNumero('suicidio')}`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vo) (?:o |um )?${leetComNumero('suicidio')}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:o |um )?${leetComNumero('suicidio')}`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou) (?:o |um )?${leetComNumero('suicidio')}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:o |um )?${leetComNumero('suicidio')}`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:um )?${leetComNumero('suicidio')}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:o |um )?${leetComNumero('suicidio')}`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:o )?${leetComNumero('suicidio')}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:o |um )?${leetComNumero('suicidio')}`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${leet('quero')}|vou|vo) (?:o |um )?${leet('suicidio')}`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${DESEJO}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE})${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta) (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:um )?${SUICIDIO}\b(?! d[oa]s? )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o )?${SUICIDIO}\b(?! d[oa]s? )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}(?! d[oa]s? )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! do )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! da )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa]s? )`),
+ new RegExp(String.raw`\b(?:${DESEJO}|${MINHA_VONTADE}|me resta)${ENFASE} (?:o |um )?${SUICIDIO}\b(?! d[oa] )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? )`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meu|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minha)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:carta|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|bilhete) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa] (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[a]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[o]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oae]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert) (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,1}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,5}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar)|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar roxa)|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar roxo)|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|pra doer)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito)\b(?!.{0,15}sem querer)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b(?!.{0,15}sem querer)`),
+ new RegExp(String.raw`\b(?:queim|esfreg|apert)\w* (?:\w+ ){0,2}${PARTE_DO_CORPO}\b.{0,30}\b(?:ate (?:abrir|sangrar|ficar rox[oa])|com (?:um |o )?isqueiro|de proposito|pra doer)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]s?)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quanto|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer)\b(?! (?:a )?(?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,5}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:dor|febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:febre)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor|febre)\b)`),
+ new RegExp(String.raw`\b(?:quant[oa]s?|qual)\b.{0,50}\b${REMEDIO_NOMEADO}\b.{0,40}\b(?:matam|mata|morrer|letal)\b(?! (?:a )?(?:dor)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^.*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /^(?!.*\b(?:experimento|boneco|personagem|ovo)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
+ /^(?!.*\b(?:experimento|boneco|personagem)\b).*\bde (?:que|qual) (?:andar|altura)\b.{0,50}\b(?:nao sobrevi\w+|sem sobreviver|morr\w+|mata)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual|que) (?:remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual|que) (?:veneno) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual|que) (?:veneno|remedio) (?:e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual|que) (?:veneno|remedio) (?:mata)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:a )?(?:dor|formigas|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as )?(?:dor|formigas|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:formigas|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|bacterias)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas|bacterias)\b)/,
+ /\b(?:qual|que) (?:veneno|remedio) (?:mata|e fatal)\b(?! (?:as |a )?(?:dor|formigas)\b)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:remedio|veneno) faz (?:o )?coracao parar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:remedio|veneno) faz (?:o )?coracao parar\b/,
+ /\b(?:que) (?:remedio|veneno) faz (?:o )?coracao parar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:remedio|veneno) faz (?:o )?coracao parar\b/,
+ /\b(?:qual) (?:remedio|veneno) faz (?:o )?coracao parar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:remedio|veneno) faz (?:o )?coracao parar\b/,
+ /\b(?:qual|que) (?:veneno) faz (?:o )?coracao parar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:remedio|veneno) faz (?:o )?coracao parar\b/,
+ /\b(?:qual|que) (?:remedio) faz (?:o )?coracao parar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:qual|que) (?:remedio|veneno) faz (?:o )?coracao parar\b/,
+ /\b(?:qual|que) (?:remedio|veneno) faz coracao parar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- /\b(?:dose|quantidade) (?:letal|fatal|mortal)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
+ new RegExp(String.raw`\b(?:vou|vo) (?:bater as botas|partir dessa pra melhor|virar estrelinha|virar presunto|(?:ir )?de arrasta pra cima)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo) mrr\b`),
+ new RegExp(String.raw`\b(?:vou|vo) mrr\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › cada jeito de dizer recebe a mensagem fixa de risco
- new RegExp(String.raw`\b(?:${DESEJO}|vou|vo|ideias? de) (?:me )?sui\b`),
+ new RegExp(String.raw`\b(?:vou|vo|ideias? de) (?:me )?sui\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO_SO_O_SUBSTANTIVO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
+ new RegExp(String.raw`\b(?:${comTecla('carta')}|${comTecla('bilhete')}) (?:de|do) ${SUICIDIO}\b(?! d[oa]s? (?!(?:meus?|minhas?)\b))`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const NAO_E_ESTADO = `(?! (?:de|do|da) (?:${ESTADO_PASSAGEIRO})\\b)`
+ const NAO_E_ESTADO = `(?! (?:de|da) (?:${ESTADO_PASSAGEIRO})\\b)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const NAO_E_ESTADO = `(?! (?:de|do|da) (?:${ESTADO_PASSAGEIRO})\\b)`
+ const NAO_E_ESTADO = `(?! (?:de|do) (?:${ESTADO_PASSAGEIRO})\\b)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o que é expressão, acidente ou matéria não dispara
- const NAO_E_ESTADO = `(?! (?:de|do|da) (?:${ESTADO_PASSAGEIRO})\\b)`
+ const NAO_E_ESTADO = `(?! (?:do|da) (?:${ESTADO_PASSAGEIRO})\\b)`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`\b(?:${comTecla('tirar')}|${ACABAR} com) (?:a )?minha (?:propria )?${comTecla('vida')}\b`),
+ new RegExp(String.raw`\b(?:${comTecla('tirar')}|acabar com) (?:a )?minha (?:propria )?${comTecla('vida')}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`\b(?:penso|pensando|pensei|quero|queria|vou|vo|decidi|vontade de) (?:em )?(?:tirar|${ACABAR} com) (?:a )?(?:propria )?vida\b`),
+ new RegExp(String.raw`\b(?:penso|pensando|pensei|quero|queria|vou|vo|decidi|vontade de) (?:em )?(?:tirar|acabar com) (?:a )?(?:propria )?vida\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:${JOGAR}|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
+ new RegExp(String.raw`\b(?:vou|vo|vai|vao|quero|queria|penso em|pensando em|pensei em|vontade de|ameacou) (?:me )?(?:jogar|pular|atirar) (?:d[aoe]s?|pel[ao]s?|em cima d[aoe]s?|de cima d[aoe]s?|na frente d[aoe]s?|(?:em|de)baixo d[aoe]s?) ${LUGAR_ALTO}\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a tecla errada em
- new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|${MATO})\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
+ new RegExp(String.raw`(?<!\b(?:vai|vao|ia|iam|vem) )\bme (?:${MATAR}|mato)\b(?! de (?:estudar|trabalhar|correr|rir|treinar)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/ouro.test.ts
- // Querer morrer: "queria morrer", "vontade de morrer"; "morrer de rir" é expressão.
+ // Querer morrer: "queria morrer", "vontade de morrer"; "morrer de rir" é expressão.
+ /\bmorr\w*/,
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | Blocos para as janelas `.{0,40}` (remédio nomeado) e `.{0,50}` (andar e altura) | Recusada: o próprio revisor diz que não bloqueia ("é tamanho de janela e não alternativa"), e o revisor-geral aponta que as ~1.600 linhas de mutação já são difíceis de auditar |
| test-engineer (1ª) | `TECLA_ERRADA` só confere `mencionaRiscoAVida`, sem passar pelo turno | Recusada: o revisor deu como "só registro"; o caminho do turno está coberto no `it.each` de `turno-do-tutor.test.ts` |
| conformidade-reviewer (1ª) | Levar "achei a carta de suicídio do Pedro na mochila" como prioridade para a 94.0 | Tarefa futura 94.0 (`risco_de_outra_pessoa`); fica anotada na N13 de `docs/aia/tutor.md`, que a 94.0 lê |
| revisor-geral (1ª) | Automutilação sem corte: o `(?!.{0,15}sem querer)` só olha depois do fim da frase, e "queimei o braço sem querer com o isqueiro" dispara | `TODO.md`: mudar o padrão muda comportamento. Errar para o lado de disparar é aceito pelo revisor |
| revisor-geral (1ª) | "As 1.600 linhas de mutação [...] são difíceis de auditar. Vale a Mesa propor ao Arquiteto uma forma mais curta para as listas fechadas (ênfase, remédio, parte do corpo)" | `/retro` da spec: a Mesa cita no relatório ao Orquestrador. Não é mudança desta tarefa |
| test-engineer (1ª) | Limitações aceitas das Divergências: "o Getúlio deixou uma carta de suicídio", "carta de suicídio de um poeta romântico" (disparam a mais) | Registradas em `docs/aia/tutor.md` N13: separar exigiria saber quem escreve ou inferir a intenção (decisão 4 do `ouro`) |
| conformidade-reviewer (2ª) | Prender a exclusão "ovo" do padrão de andar e altura a "o ovo cai", em vez de "ovo" em qualquer lugar da frase ("de que andar eu pulo e morro? tipo o ovo da aula" não dispara) | `TODO.md`: muda comportamento. A regra nasceu nesta tarefa, e o revisor diz que não é regressão |
| conformidade-reviewer (2ª) | "quero muito suicídio do jeito mais rápido" e "achei a carta de suicídio do Pedro na mochila" continuam passando; a 94.0 trata primeiro | Já registrado na N13 (R5 e R8 da rodada 1); a 94.0 lê a N13 |
| test-engineer (2ª) | O teto da janela de 20 caracteres da sigla não tem amostra | Sem objeto: o estreitamento de "dose letal" saiu (diagnostico-93) |
| test-engineer (2ª) | A parte final da regex de "dose letal" (`.*\b(?:dose|quantidade) (?:letal|fatal|mortal)\b`) não tem bloco por palavra | Sem objeto: o estreitamento de "dose letal" saiu (diagnostico-93) |
| test-engineer (2ª) | Duas amostras saíram das listas (a "carta de suicídio de um poeta romântico no livro" e "a dose letal da dl50 de dipirona faz mal pra mim?") e nenhum teste fixa o novo comportamento delas | A da dl50 de dipirona voltou como `dev` `casa`; a do poeta segue para o `TODO.md`: asserção de "limitação conhecida" é decisão de teste sobre o que o `ouro` manda não fixar. As duas estão na N13 |
| conformidade-reviewer (3ª) | A carta do próprio aluno passa quando a palavra depois de "do/da" não é um nome ("a carta de suicídio da semana passada", "dos últimos dias"); levar ao `TODO.md` com as frases que a 94.0 trata primeiro | `TODO.md`, escrito pelo Orquestrador no fechamento da tarefa (arquivo que a tarefa não toca); já está na N13 |
| conformidade-reviewer (3ª) | Pôr as outras frases da rodada anterior ("vou tomar a dose letal para ratos que tem em casa" etc.) como `dev` que disparam | Recusada: o bloco único do padrão de "dose letal" já deixa vermelho quem estreitar, e o diagnóstico do Arquiteto já mandou as duas `dev` novas |
| revisor-geral (3ª) | A subtarefa 93.2 diz "As três pioras desfeitas" e está `[x]`, mas a terceira ficou de propósito | Recusada: editar a subtarefa para acomodar o resultado não cabe à ordem; a Divergência de "Dose letal" registra a exceção que a própria tarefa previa. O Orquestrador decide o texto no fechamento |
| revisor-geral (3ª) | As linhas de `turno-do-tutor.ts:166-167` passam da largura das vizinhas | Recusada: estilo de comentário, e comentário em `.ts` caducaria a aprovação do `revisor-geral` |
| revisor-geral (3ª) | Dois itens de "Recomendações sem aplicar" têm `TODO.md` como destino ("queimei sem querer" e o poeta), mas o `TODO.md` não foi tocado | `TODO.md`, escrito pelo Orquestrador no fechamento (arquivo fora dos "Arquivos previstos" da tarefa); a Mesa avisa no relatório final |
| test-engineer (3ª) | A amostra do poeta romântico segue sem teste que fixe o comportamento dela | `TODO.md`, junto com o item acima (já está nas "Recomendações sem aplicar") |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 10:04:40 | 2026-10-22 10:07:24 | `test-engineer` | 1 | REPROVADO | aebaed4ecc6342631 |
| 2026-10-22 10:04:39 | 2026-10-22 10:08:21 | `conformidade-reviewer` | 1 | REPROVADO | a0366d436f61671e9 |
| 2026-10-22 10:04:41 | 2026-10-22 10:09:14 | `revisor-geral` | 1 | REPROVADO | a8a452c3ea94e0026 |
| 2026-10-22 10:27:31 | 2026-10-22 10:29:17 | `test-engineer` | 2 | APROVADO | a2d848a04f6bd680f |
| 2026-10-22 10:27:22 | 2026-10-22 10:29:41 | `conformidade-reviewer` | 2 | REPROVADO | a7f07f22cdac179b0 |
| 2026-10-22 10:27:40 | 2026-10-22 10:30:31 | `revisor-geral` | 2 | REPROVADO | a565ca73517186d50 |
| 2026-10-22 10:47:31 | 2026-10-22 10:48:23 | `conformidade-reviewer` | 3 | APROVADO | a4e4eb3413f8f4a34 |
| 2026-10-22 10:47:47 | 2026-10-22 10:48:58 | `revisor-geral` | 3 | APROVADO | a66c12f94d3411209 |
| 2026-10-22 10:47:38 | 2026-10-22 10:49:23 | `test-engineer` | 3 | REPROVADO | a06eaf0aaf256f76a |
| 2026-10-22 10:57:40 | 2026-10-22 10:58:30 | `test-engineer` | 4 | APROVADO | a1250464f559b1aab |
