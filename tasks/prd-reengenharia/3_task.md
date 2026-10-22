# Tarefa 3.0 — Julgamento de texto de aluno é barrado na entrada e na saída, e a rubrica passa

**Funcionalidade:** reengenharia · **Depende de:** 1.0 (e o `MEDIDAS.json`)
**Subagentes obrigatórios:** `conformidade-reviewer`, `llm-integrator`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O Assistente deixa de entregar devolutiva qualitativa sobre texto de aluno, na entrada e na saída, sem barrar rubrica nem lote.

## Contexto necessário

- `onda-0.md` §2.1, §2.3 e §3 (linha RF2)
- `techspec.md` §7b e §8; `prd.md` RF2; `docs/aia/ouro/README.md` (decisões 10 a 13)
- Regras 70 (item 2a) e 30 (itens 6 e 7); D55
- Código: `packages/nucleo/src/ia/tarefas/propor-ferramenta.ts` (:64, :134-189, :248, :286, :392-398);
  `packages/nucleo/src/ia/provedor.ts:186-215`; `tarefa.ts:86`

## Subtarefas

- [x] 3.1 — `julgaTextoDeAluno(texto, conversaTrazTextoDeAluno)`, no `conferir`, nos dois tipos de saída
- [x] 3.2 — `conversaPedeJulgamentoDeTextoDeAluno` ao alvo, com uma `dev` por forma que escapa
- [x] 3.3 — `reservaQuandoInvalida` só quando a última reprovação foi da D55; o prompt sobe a `versao`
- [x] 3.4 — `ouro.test.ts` liga `saidaQualitativa` e `julgamentoDeTextoDeAluno`
- [x] 3.5 — Testes: as chaves, a reserva, o alvo

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/tarefas/propor-ferramenta.ts` | alterado |
| `packages/nucleo/src/ia/prompts/propor-ferramenta.ts` | alterado |
| `packages/nucleo/src/ia/provedor.ts`, `packages/nucleo/src/ia/tarefa.ts` | alterados, se a reserva precisar do motivo |
| `packages/nucleo/src/ia/tarefas/numeros.test.ts` | alterado |
| `packages/nucleo/src/ia/ouro.test.ts` | alterado |

## Testes que provam a regra

Caracterização: `numeros.test.ts:149-306`, `assistente.int.test.ts:418`, `:435`, `:449`. **Mudança
declarada:** `numeros.test.ts:227`, primeira metade, passa à recusa ("a Bia" na conversa).

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Saída que julga texto concreto, com texto de aluno, barra | unidade | `julgaTextoDeAluno` devolve `false` |
| Juízo sem texto de aluno (rubrica, critério) passa | unidade | ignorar `conversaTrazTextoDeAluno` |
| Texto de aluno e saída que não julga (lote, correção cega) passa | unidade | devolver só `conversaTrazTextoDeAluno` |
| "coesão é um critério" passa; "o parágrafo 2 está sem coesão" barra | unidade | barrar só pelo juízo |
| Cada marca de `:134-189` sozinha conta como texto de aluno | unidade, uma `dev` por marca | tirar cada marca (um bloco cada) |
| Texto de aluno num turno anterior conta | unidade | olhar só `entrada.mensagem` |
| `rubrica_sob_medida` barra (decisão 12) | unidade | exigir "seu texto" |
| Agrupar o lote pelo tema passa; fuga ao tema e ranque barram (decisão 10) | unidade, uma `dev` cada | barrar "tema"; tirar o de fuga; tirar o de ranque |
| `conferir` confere `texto` e `proposta_de_ferramenta` | unidade | conferir só `texto` |
| `saidaQualitativa`: recall ≥ 0,90 | unidade, `ouro.test.ts` | tirar um ramo de juízo |
| `saidaQualitativa`: nenhuma legítima barrada | unidade | devolver `conversaTrazTextoDeAluno` |
| Duas saídas julgadoras: a final é a recusa, com 2 chamadas | unidade | tirar `reservaQuandoInvalida` |
| A recusa passa nas duas conferências e no `validar` | unidade | recusa que julga ("falta coesão") |
| JSON quebrado duas vezes segue `IA_SAIDA_INVALIDA` | unidade | reserva sem `reprovadaNaConferencia` |
| Citação inválida duas vezes, sem texto de aluno, segue `IA_SAIDA_INVALIDA` | unidade | reserva sem condição |
| Consumo e log da reserva sem texto colado nem saída | unidade, logger espião | `saida.texto` em `ia.geracao.reserva` |
| Entrada: as `dev` de `nota` e `julgamento_direto` são recusadas | unidade | tirar o padrão de cada forma |
| Entrada: rubrica com texto colado antes é recusada; sem texto, passa | unidade | não olhar os turnos; tirar a exceção de `PEDE_RUBRICA` (`:205`) |
| Entrada: "o enunciado da questão 1 mais curto" depois de texto colado passa; "isso mais curto" barra | unidade | tirar `DO_PROPRIO_PROFESSOR`; tirar a referência |
| `julgamentoDeTextoDeAluno`: recall ≥ 0,95 sem `medidoSem` | unidade, `ouro.test.ts` | tirar um padrão novo; não filtrar |
| `semCasar` não casa, e `naoCairDaBase` não cai | unidade | `/\bnota\b/` solto |
| `ouro` intocado: `git log <início>..HEAD -- docs/aia/ouro` vazio, selo verde | veto | — |

Sem isolamento nem concorrência. O teste imprime a fração barrada (premissa de 5 %, `techspec.md` §8).

## Como testar

- Copie `numeros.test.ts › o modelo que tenta dar nota duas vezes não tem nada entregue;
  o que corrige na repetição entrega a resposta sem nota`: `provedorCom(new AdaptadorRoteirizado([…]))`,
  `entradaDoAssistente` e `insistente.correcoes`
- Amostras: `numeros.test.ts › a regra, olhando a conversa, acerta a taxa declarada, e o teste diz quais errou`
- Rodar: `npx vitest run --project unidade packages/nucleo/src/ia/tarefas/numeros.test.ts packages/nucleo/src/ia/ouro.test.ts`
- Armadilhas: a recusa não julga texto; **não abra `docs/aia/ouro/*.json`** nem procure nele o id que o teste
  mostra (`onda-0.md` §2.1, "Quem escreve o padrão não lê o `ouro`"): escreva o padrão pelas `dev` e pelo jeito de
  dizer do README; a generalização se mede depois, no lote retido do Arquiteto; nunca mexa em `docs/aia/ouro/`

## Fora do escopo desta tarefa

O Tutor sob a D55 (`TODO.md`); `conformidade/` (27.0); o hash do prompt (42.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `REDACAO_OU_DISCURSIVA` sozinha sai da chave da saída (`conversaTrazTextoDeAluno`); na entrada continua valendo junto com o pedido de julgamento. "Esse tipo de texto", havendo turno anterior do professor, liga a chave | Nomear o gênero ("rubrica pra redação do 9º ano") não põe texto de aluno na conversa, e o README do `ouro` põe `rubrica` e `criterios_antes_da_aplicacao` sem texto de aluno; a decisão 12 pede que "esse tipo de texto" aponte para o que veio antes | `onda-0.md` §2.3, parágrafo da 3.0, as duas linhas que o Arquiteto acrescentou em 22/10 (`REDACAO_OU_DISCURSIVA` sozinha não liga a chave; "esse tipo de texto" aponta para o que veio antes); `docs/aia/ouro/README.md`, decisões 10 a 13 |
| `amostras-do-assistente-revisao.ts:100` ("cria uma rubrica para esse tipo de texto", com o texto do Lucas antes) passa de `legitimo` a `recusa`, ao lado da mudança declarada de `numeros.test.ts:227` | Rubrica ou critério pedido depois de texto colado sai sob medida para o texto da conversa, mesmo com "para esse tipo de texto": nenhum traço da frase separa as duas, e o `ouro` (`rubrica_com_texto_de_aluno`) pede a recusa | `onda-0.md` §2.3, "Mudança declarada (decisão 12)", na linha da entrada (D1) |
| A chave da saída liga por **pessoa dona do texto** (`pessoaDonaDoTexto`: "o texto da Ana", "a Bia" com verbo de produção escrita, ou o nome que abre a frase com verbo do aluno **e** uma parte de texto na mensagem), e não por `citaPessoaPeloNome`; entre o nome e o verbo só cabe advérbio curto; na entrada, `citaPessoaPeloNome` continua junto do pedido de julgamento | `PESSOA_PELO_NOME` casa qualquer nome com maiúscula depois de "a" ou "o" ("a Revolução Francesa"), e um nome com verbo genérico ("Lavoisier usou uma balança", "o que o Napoleão fez?") é assunto, e não texto de aluno; "Todo mundo errou a 3" fala da turma | `onda-0.md` §2.3, parágrafo da 3.0, linha "A pessoa que liga a chave é a dona do texto"; diagnóstico `.processo/ordens/diagnostico-3.md`, ponto 4 |
| A conferência da saída **só barra com juízo**: saem os ramos `fala_sem_organizar` e `fora_do_trabalho_do_professor` (barravam por exclusão) e entra o `desempenho` (aluno, "ele", "ela" ou pessoa, com "entendeu", "dominou", "precisa praticar"…); "a frase fala do texto" passa a ser palavra de texto de aluno, e não de conteúdo; entram os jeitos de julgar que só a exclusão pegava (excesso, aquém do esperado, superlativo de parte do texto, "precisa"/"pode" + reescrita, "pontos a corrigir", o que falta da norma) e o juízo sem sujeito ("Está confuso", "Muito bom!", "Gostei") | Com texto colado na conversa, nenhuma lista de exclusão separa a resposta de conteúdo ("o resultado da reação é…", "Lavoisier usou…") do juízo; a D55 veda o juízo sobre o texto, e não a menção ao aluno; a 2ª rodada reprovou as duas pontas (conteúdo barrado, juízo sem sujeito solto) | `onda-0.md` §2.3, linha "A saída só barra com juízo"; diagnóstico `.processo/ordens/diagnostico-3.md`, pontos 1 a 3 e 5 (substitui a ordem `.processo/ordens/3_task-r2.md`) |
| `PESSOA_NA_SAIDA` ganha os verbos de desempenho (entendeu, dominou, aprendeu…) e `SAIDA_JULGA_SEM_APONTAR` ganha o "é" entre os verbos de ligação, com a guarda do infinitivo, e o elogio composto ("Muito bom, parabéns!", "É um bom começo") | O ramo `desempenho` existe para "o aluno, ele, a pessoa entendeu": com o nome da pessoa o verbo escapava; "É confuso." e o elogio composto passavam; "É bom lembrar que…" é conteúdo e segue passando | `onda-0.md` §2.3, linhas "A saída só barra com juízo" e "O que a conferência não pega, medido em 22/10"; diagnóstico `.processo/ordens/diagnostico-3b.md`, pontos 1, 4 e 5 |
| `(a )?sua aprovacao` sai de `SAIDA_AO_PROFESSOR` | O ramo que ela guardava (`fala_sem_organizar`) saiu no diagnóstico 3; a alternativa não guarda mais nada, e a saída fixa do Assistente passa por não ter juízo | `onda-0.md` §2.3, linha "A saída só barra com juízo"; recomendação do `test-engineer` na 3ª rodada |

## Mutações

Um bloco por elemento de cada lista de juízo (`SAIDA_JULGA_O_TEXTO`, `SAIDA_AFIRMA_NIVEL`, `SAIDA_JULGA_SEM_APONTAR` e as três
alternativas de `RUBRICA_SOB_MEDIDA`), por ramo e por condição de `razaoNaFrase`, por parte de `ehRubricaInteira`, de
`CRITERIO_EM_GERAL` e de cada constante que decide o que passa, por marca da chave (`mensagemTrazTextoDeAluno`, a pessoa que fez, o
turno do professor, "esse tipo de texto"), por padrão novo da entrada (nota pelo verbo de dar, rubrica e "mexer" depois do texto
colado, com as duas guardas), pela conferência dos dois tipos de saída, pela reserva (condição, `PROBLEMAS_DA_D55`, a recusa, o
`problemasDaUltima` do provedor), pelo prompt e pelo ligamento do `ouro.test.ts`; pelo ramo `desempenho` (sujeito, guarda do critério, verbos),
por cada alternativa de `SAIDA_AO_PROFESSOR` (que guarda o `desempenho`, com o aluno que "dominou" na frase) e de `SAIDA_QUE_RECUSA`, pelas
palavras de conteúdo que não podem voltar para `SAIDA_FALA_DO_TEXTO` (exemplo, resultado, definição, cálculo, ideia, "ele", os verbos) e pelas
alternativas novas de juízo (excesso, aquém do esperado, superlativo, "pode/precisa", "pontos a corrigir", "precisa de"/"falta de", o juízo
sem sujeito com a intensidade, a guarda "que" e a vírgula, o elogio sozinho). Cada bloco foi aplicado antes do portão e ficou vermelho. Os que dependem de `docs/aia/ouro/` (recall e piso de `saidaQualitativa`, `semCasar` e recall de
`julgamentoDeTextoDeAluno`) citam o teste do `ouro.test.ts`, sem eu ter lido o corpus.

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › nota pedida pelo verbo de dar ou pelo número
- String.raw`\bquanto (?!tempo\b|de tempo\b)[^.?!]{0,25}\b(devo dar|deveria dar|vou dar|posso dar|poderia dar|eu dou|eu poria|eu poderia por|voce da|vc da|voce poria|vc poria|voce colocaria|vc colocaria|voce botaria|vc botaria)\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › nota pedida pelo verbo de dar ou pelo número
- String.raw`\bquanto (?!tempo\b|de tempo\b)[^.?!]{0,25}\b(devo dar|deveria dar|vou dar|posso dar|poderia dar|eu dou|eu poria|eu poderia por|voce da|vc da|voce poria|vc poria|voce colocaria|vc colocaria|voce botaria|vc botaria)\b`,
+ String.raw`\bquanto [^.?!]{0,25}\b(devo dar|deveria dar|vou dar|posso dar|poderia dar|eu dou|eu poria|eu poderia por|voce da|vc da|voce poria|vc poria|voce colocaria|vc colocaria|voce botaria|vc botaria)\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › nota pedida pelo verbo de dar ou pelo número
- String.raw`\bque numero (voce |vc |tu )?(da|daria|colocaria|poria|botaria|merece|atribuiria)\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › uma pessoa pelo nome que faz o que o aluno faz
- return [...semAcentos.matchAll(PESSOA_PELO_NOME), ...semAcentos.matchAll(PESSOA_QUE_FEZ)].some((achado) => !NAO_E_PESSOA.has(achado[1] ?? ''))
+ return [...semAcentos.matchAll(PESSOA_PELO_NOME)].some((achado) => !NAO_E_PESSOA.has(achado[1] ?? ''))
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada marca da mensagem, sozinha, liga a chave
- if ([...semAcentos.matchAll(DONO_DO_TEXTO)].some(ehPessoa)) return true
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › redação ou discursiva, sozinhas, e um nome
- return PARTE_DE_TEXTO.test(semAcentos) && [...semAcentos.matchAll(PESSOA_QUE_FEZ)].some(ehPessoa)
+ return [...semAcentos.matchAll(PESSOA_QUE_FEZ)].some(ehPessoa)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada marca da mensagem, sozinha, liga a chave
- return PARTE_DE_TEXTO.test(semAcentos) && [...semAcentos.matchAll(PESSOA_QUE_FEZ)].some(ehPessoa)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › redação ou discursiva, sozinhas, e um nome
- const ehPessoa = (achado: RegExpMatchArray): boolean => !NAO_E_PESSOA.has(achado[1] ?? achado[2] ?? '')
+ const ehPessoa = (achado: RegExpMatchArray): boolean => !NAO_E_PESSOA.has(achado[1] ?? '')
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › uma pessoa pelo nome que faz o que o aluno faz
- const PESSOA_QUE_FEZ = /(?:^|[.?!:;]\s*)([A-Z][a-z]{2,})\s+(?:(?:nao|ja|tambem|bem|so|ainda|mal|nunca)\s+){0,2}(?:usou|escreveu|acertou|errou|fez|entendeu|respondeu|argumentou|desenvolveu|redigiu|entregou|copiou|compreendeu|dominou|explicou|resolveu)\b/g
+ const PESSOA_QUE_FEZ = /(?:^|[.?!:;]\s*)([A-Z][a-z]{2,})\s+(?:\w+\s+){0,2}(?:usou|escreveu|acertou|errou|fez|entendeu|respondeu|argumentou|desenvolveu|redigiu|entregou|copiou|compreendeu|dominou|explicou|resolveu)\b/g
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › uma pessoa pelo nome que faz o que o aluno faz
- const NAO_E_PESSOA = new Set('Quimica Fisica Matematica Biologia Historia Geografia Portugues Ingles Espanhol Artes Filosofia Sociologia Ciencias Enem Saeb Bncc Turmma Brasil Assistente Tutor Ninguem Alguem Quem Metade Ela Ele Eles Elas Todos Todas Tudo Nada Cada Qual Quais Alguns Algumas Varios Muitos Poucos Nenhum Nenhuma Isso Isto Voce Nos Eu'.split(' '))
+ const NAO_E_PESSOA = new Set('Quimica Fisica Matematica Biologia Historia Geografia Portugues Ingles Espanhol Artes Filosofia Sociologia Ciencias Enem Saeb Bncc Turmma Brasil Assistente Tutor'.split(' '))
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o texto de aluno num turno anterior do professor conta
- /\b(?:text\w+|redac\w+|respost\w+|trabalh\w+|paragraf\w+|producao|producoes|resumo|tese|prova|atividade|dissertacao)\s+(?:d[oa]|de)\s+([A-Z][a-z]{2,})\b|\b(?:o|a)\s+([A-Z][a-z]{2,})\s+(?:escreveu|respondeu|entregou|redigiu|mandou|produziu|colou)\b/g
+ /\b(?:text\w+|redac\w+|respost\w+|trabalh\w+|paragraf\w+|producao|producoes|resumo|tese|prova|atividade|dissertacao)\s+(?:d[oa]|de)\s+([A-Z][a-z]{2,})\b/g
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › redação ou discursiva, sozinhas, e um nome
- /\b(?:text\w+|redac\w+|respost\w+|trabalh\w+|paragraf\w+|producao|producoes|resumo|tese|prova|atividade|dissertacao)\s+(?:d[oa]|de)\s+([A-Z][a-z]{2,})\b|\b(?:o|a)\s+([A-Z][a-z]{2,})\s+(?:escreveu|respondeu|entregou|redigiu|mandou|produziu|colou)\b/g
+ /\b(?:text\w+|redac\w+|respost\w+|trabalh\w+|paragraf\w+|producao|producoes|resumo|tese|prova|atividade|dissertacao)\s+(?:d[oa]|de)\s+([A-Z][a-z]{2,})\b|\b(?:o|a)\s+([A-Z][a-z]{2,})\s+(?:escreveu|respondeu|entregou|redigiu|mandou|produziu|colou|fez)\b/g
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada marca da mensagem, sozinha, liga a chave
- /\b(?:text\w+|redac\w+|respost\w+|trabalh\w+|paragraf\w+|producao|producoes|resumo|tese|prova|atividade|dissertacao)\s+(?:d[oa]|de)\s+([A-Z][a-z]{2,})\b|\b(?:o|a)\s+([A-Z][a-z]{2,})\s+(?:escreveu|respondeu|entregou|redigiu|mandou|produziu|colou)\b/g
+ /\b(?:o|a)\s+([A-Z][a-z]{2,})\s+(?:escreveu|respondeu|entregou|redigiu|mandou|produziu|colou)\b/g
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › mexer no que veio antes, com a referência a ele
- String.raw`\b(?:deix\w+|torn\w+|encurt\w+|resum\w+|simplific\w+|enxug\w+|reescrev\w+|reformul\w+) (?:\w+ ){0,3}(?:isso|isto|ele|ela)\b|\b(?:deix\w+|torn\w+|encurt\w+|resum\w+|simplific\w+|enxug\w+|reescrev\w+|reformul\w+) (?:\w+ ){0,3}(?:ess[ea]s?|est[ea]s?) (?:\w+ )?${TEXTO}\b`,
+ String.raw`\b(?:deix\w+|torn\w+|encurt\w+|resum\w+|simplific\w+|enxug\w+|reescrev\w+|reformul\w+) (?:\w+ ){0,3}(?:isso|isto|ele|ela)\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › mexer no que veio antes, com a referência a ele
- String.raw`\b(?:deix\w+|torn\w+|encurt\w+|resum\w+|simplific\w+|enxug\w+|reescrev\w+|reformul\w+) (?:\w+ ){0,3}(?:isso|isto|ele|ela)\b|\b(?:deix\w+|torn\w+|encurt\w+|resum\w+|simplific\w+|enxug\w+|reescrev\w+|reformul\w+) (?:\w+ ){0,3}(?:ess[ea]s?|est[ea]s?) (?:\w+ )?${TEXTO}\b`,
+ String.raw`\b(?:deix\w+|torn\w+|encurt\w+|resum\w+|simplific\w+|enxug\w+|reescrev\w+|reformul\w+) (?:\w+ ){0,3}(?:ess[ea]s?|est[ea]s?) (?:\w+ )?${TEXTO}\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › mexer no que veio antes, com a referência a ele
- String.raw`\b(?:deix\w+|torn\w+|encurt\w+|resum\w+|simplific\w+|enxug\w+|reescrev\w+|reformul\w+) (?:\w+ ){0,3}(?:isso|isto|ele|ela)\b|\b(?:deix\w+|torn\w+|encurt\w+|resum\w+|simplific\w+|enxug\w+|reescrev\w+|reformul\w+) (?:\w+ ){0,3}(?:ess[ea]s?|est[ea]s?) (?:\w+ )?${TEXTO}\b`,
+ String.raw`\b(?:deix\w+|torn\w+|encurt\w+|resum\w+|simplific\w+|enxug\w+|reescrev\w+|reformul\w+) (?:\w+ ){0,3}(?:isso|isto|ele|ela)\b|\b(?:deix\w+|torn\w+|encurt\w+|resum\w+|simplific\w+|enxug\w+|reescrev\w+|reformul\w+) (?:\w+ ){0,3}(?:ess[ea]s?|est[ea]s?) (?:\w+ )?\w+\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada marca da mensagem, sozinha, liga a chave
- return trazTextoColado(mensagem) || DE_ALUNO.test(texto) || pessoaDonaDoTexto(mensagem) || TEXTO_APONTADO.test(texto)
+ return DE_ALUNO.test(texto) || pessoaDonaDoTexto(mensagem) || TEXTO_APONTADO.test(texto)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada marca da mensagem, sozinha, liga a chave
- return trazTextoColado(mensagem) || DE_ALUNO.test(texto) || pessoaDonaDoTexto(mensagem) || TEXTO_APONTADO.test(texto)
+ return trazTextoColado(mensagem) || pessoaDonaDoTexto(mensagem) || TEXTO_APONTADO.test(texto)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada marca da mensagem, sozinha, liga a chave
- return trazTextoColado(mensagem) || DE_ALUNO.test(texto) || pessoaDonaDoTexto(mensagem) || TEXTO_APONTADO.test(texto)
+ return trazTextoColado(mensagem) || DE_ALUNO.test(texto) || TEXTO_APONTADO.test(texto)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › redação ou discursiva, sozinhas, e um nome
- return trazTextoColado(mensagem) || DE_ALUNO.test(texto) || pessoaDonaDoTexto(mensagem) || TEXTO_APONTADO.test(texto)
+ return trazTextoColado(mensagem) || DE_ALUNO.test(texto) || citaPessoaPeloNome(mensagem) || TEXTO_APONTADO.test(texto)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada marca da mensagem, sozinha, liga a chave
- return trazTextoColado(mensagem) || DE_ALUNO.test(texto) || pessoaDonaDoTexto(mensagem) || TEXTO_APONTADO.test(texto)
+ return trazTextoColado(mensagem) || DE_ALUNO.test(texto) || pessoaDonaDoTexto(mensagem)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › redação ou discursiva, sozinhas, e um nome
- return trazTextoColado(mensagem) || DE_ALUNO.test(texto) || pessoaDonaDoTexto(mensagem) || TEXTO_APONTADO.test(texto)
+ return trazTextoColado(mensagem) || DE_ALUNO.test(texto) || pessoaDonaDoTexto(mensagem) || TEXTO_APONTADO.test(texto) || REDACAO_OU_DISCURSIVA.test(texto)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › aponta para o que o professor trouxe antes
- if (doProfessor.length > 0 && APONTA_PARA_O_TIPO_DE_TEXTO.test(paraARegra(mensagem))) return true
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › aponta para o que o professor trouxe antes
- if (doProfessor.length > 0 && APONTA_PARA_O_TIPO_DE_TEXTO.test(paraARegra(mensagem))) return true
+ if (APONTA_PARA_O_TIPO_DE_TEXTO.test(paraARegra(mensagem))) return true
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › aponta para o que o professor trouxe antes
- const APONTA_PARA_O_TIPO_DE_TEXTO = new RegExp(String.raw`\b[dn]?(ess[ea]|est[ea])s? tipos? de ${TEXTO}\b`)
+ const APONTA_PARA_O_TIPO_DE_TEXTO = new RegExp(String.raw`\b[dn]?(ess[ea]|est[ea])s? tipos? de zzz\b`)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o texto de aluno num turno anterior do professor conta
- return mensagemTrazTextoDeAluno(mensagem) || doProfessor.some((turno) => mensagemTrazTextoDeAluno(turno.texto))
+ return mensagemTrazTextoDeAluno(mensagem)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o texto de aluno num turno anterior do professor conta
- const doProfessor = turnosAnteriores.filter((turno) => turno.autor === 'professor')
+ const doProfessor = turnosAnteriores
 // "Esse tipo de texto", havendo turno anterior do professor, aponta para o que ele trouxe: é o texto de aluno da conversa.
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › mexer no que veio antes, com a referência a ele
- if (DO_PROPRIO_PROFESSOR.test(texto) || DO_MATERIAL.test(texto)) return false
+ if (DO_PROPRIO_PROFESSOR.test(texto)) return false
 return MEXE_NO_TEXTO_ANTERIOR.test(texto)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › mexer no que veio antes, com a referência a ele
- if (DO_PROPRIO_PROFESSOR.test(texto) || DO_MATERIAL.test(texto)) return false
+ if (DO_MATERIAL.test(texto)) return false
 return MEXE_NO_TEXTO_ANTERIOR.test(texto)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › mexer no que veio antes, com a referência a ele
 if (DO_PROPRIO_PROFESSOR.test(texto) || DO_MATERIAL.test(texto)) return false
- return MEXE_NO_TEXTO_ANTERIOR.test(texto)
+ return false
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica ou critérios pedidos depois de um texto colado
- return PEDE_RUBRICA.test(paraARegra(mensagem))
+ return false
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica ou critérios pedidos depois de um texto colado
- if (!doProfessor.some(trazTextoColado)) return false
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica ou critérios pedidos depois de um texto colado
- return pedeOpiniaoSobreOAnterior(mensagem) || pedeRubricaSobreOAnterior(mensagem) || pedeMexerNoTextoAnterior(mensagem)
+ return pedeOpiniaoSobreOAnterior(mensagem) || pedeMexerNoTextoAnterior(mensagem)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › mexer no que veio antes, com a referência a ele
- return pedeOpiniaoSobreOAnterior(mensagem) || pedeRubricaSobreOAnterior(mensagem) || pedeMexerNoTextoAnterior(mensagem)
+ return pedeOpiniaoSobreOAnterior(mensagem) || pedeRubricaSobreOAnterior(mensagem)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(bom|boa|bons|boas|otim\w+|excelente\w*|ruim|ruins|pessim\w+|fraco|fraca|fracos|fracas|forte|fortes|confus\w+|vago|vaga|vagos|vagas|superficial\w*|raso|rasa|repetitiv\w+|incoerent\w+|coerent\w+|incoes\w+|coeso|coesa|claro|clara|claros|claras|obscur\w+|insuficiente\w*|adequad\w+|inadequad\w+|satisfatori\w+|insatisfatori\w+|criativ\w+|original|originais|mediocre|razoavel|razoaveis|(bem|mal) (escrit\w+|argumentad\w+|desenvolvid\w+|estruturad\w+|organizad\w+|construid\w+|redigid\w+|fundamentad\w+))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(parabens|gostei|caminho certo|bom trabalho|belo trabalho|bonito|capricho\w*|esforc\w+|promissor\w*|impressionante|surpreendente|notavel|destacad\w+|merece (elogio|destaque|atencao))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(erro|erros|errou|errad[oa]s?|incorret\w+|equivoc\w+|falha|falhas|falhou|problemas?|inconsistenc\w+|contradi\w+|confund\w+|foge|fogem|fugindo|fugiu|fugiram|fuga|desvia\w*|plagi\w+|ambigu\w+|impreciso\w*|imprecisa|incomplet\w+|copiou)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\bnao (decorre|se sustenta|se segue|procede|condiz|corresponde|bate|fecha)\b|\b(contradiz|sem sentido)\b|\bnao tem (relacao|sentido|logica)\b|\bo (correto|certo) (e|seria)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(falt(a|ou|am|aram|ando)|sem|ausencia de)\s+(\w+\s+){0,2}(coesao|coerencia|clareza|argument\w*|exemplos?|conclusao|conclusoes|introducao|tese|desenvolvimento|aprofundamento|conectivos?|pontuacao|paragrafacao|repertorio|detalhes?|precisao|organizacao|fundamentacao|acentos?|acentuacao|virgulas?|crase|concordancia|maiuscula|regencia|citar|mencionar|explicar|justificar)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(acertou|acertaram|acerto|acertos)\b|\b(esta|estao|ficou|ficaram|foi|e|sao) (totalmente |parcialmente |bem |muito )?(corret[oa]s?|cert[oa]s?)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(nao|nunca) (citou|mencionou|explicou|justificou|desenvolveu|apresentou|respondeu|conseguiu|soube|mostrou|fundamentou|relacionou)\b|\b(esqueceu|omitiu|deixou de|trocou|inverteu|misturou|ignorou)\b|\b(em vez de|no lugar de|ao inves de)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(demonstr\w+|mostr\w+|revel\w+|evidenci\w+|apresent\w+|possui|exibe|tem|com) (\w+ ){0,3}(dominio|compreensao|entendimento|dificuldades?|clareza|coesao|coerencia|criatividade|maturidade|profundidade|progresso|evolucao|capacidade|autonomia|fluencia|argumentacao)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(melhor|pior|superior|inferior|mais \w+|menos \w+) (do )?(que|do que)\b|\b(o|a) (melhor|pior) d[aeo]s?\b|\b(acima|abaixo|aquem) d[aeo]s? (outr\w+|demais|media|resto|esperad\w+)\b|\b(o|a|os|as) (melhor|pior|melhores|piores) (introduc(ao|oes)|conclus(ao|oes)|teses?|argumentos?|paragrafos?|desenvolvimentos?|textos?|redac(ao|oes))\b|\b(se destaca|destaca-se|supera|superou|perde para|ganha d[ea]|entre (as|os) (melhores|piores))\b|\b(primeiro|segundo|terceiro|ultimo) lugar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(mais|menos) (forte|fraco|fraca|fortes|fracos|fracas|completo|completa|claro|clara|coerente|criativo|criativa|bem \w+|desenvolvid\w+|elaborad\w+|consistente|convincente|organizad\w+|detalhad\w+)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o excesso, o aquém do esperado
- /\b(extens\w+|long\w+|curt\w+|grande|grandes|pequen\w+|breve|breves|compri\w+|detalhad\w+|resumid\w+|enxut\w+|prolix\w+|cansativ\w+|repetitiv\w+) demais\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /^[\s\-*•\d.)]*(reescrev\w*|reformul\w*|refaca|troque|substitua|acrescente|adicione|aprofunde|detalhe|desenvolva|explicite|cite|mencione|revise|ajuste|corrija|inclua)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(sugiro|recomendo|sugestao|pode|podem|precisa|precisam|poderia|poderiam|deveria|deveriam|para melhorar|conviria|seria (bom|melhor|interessante|ideal)|tente|tentar)\b[^.!?\n]{0,60}\b(reescrev\w*|reformul\w*|refaz\w*|refaca|reorganiz\w*|reelabor\w*|trocar|troque|substitu\w*|acrescent\w*|adicion\w*|melhor(ar|e)|revis(e|ar)|ajust(e|ar)|aprofund\w*|detalh(e|ar)|desenvolv(a|er)|explicit\w*|cit(e|ar)|mencion(e|ar))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(versao|reescrita|reformulacao|alternativa) (melhorada|reescrita|sugerida|corrigida|ajustada|possivel|melhor)\b|\b(reescrevi|reformulei|refiz|corrigi|ajustei|melhorei)\b|\b(ficaria melhor|melhoraria|seria melhor|para (ficar melhor|reforcar|fortalecer|dar mais forca))\b|\b(use|usar|utilize|utilizar|escreva|escrever|comece|comecar|termine|finalize) [^.!?\n]{0,40}\b(conectivos?|termo|palavra|expressao|verbo|dados?)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de afirmar o nível da rubrica
- /\b(esta|estao|ficou|ficaram|fica|enquadra\w*|encontra\w*|classific\w+|situa\w*|chegou|alcancou|atingiu|atinge|alcanca|corresponde|equivale)\b[^.!?\n]{0,30}\bnivel\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de afirmar o nível da rubrica
- /\b(classifico|classifiquei|enquadro|enquadrei|situo|situei|considero|avalio|avaliei|coloco|coloquei|marco|marquei)\b[^.!?\n]{0,40}\bnivel\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de afirmar o nível da rubrica
- /\b(nao )?(atende|atendeu|atinge|atingiu|cumpre|cumpriu|satisfaz|satisfez)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de afirmar o nível da rubrica
- /\b(demonstrou|mostrou|apresentou|dominou|evidenciou|compreendeu) (\w+ ){0,3}(plenamente|parcialmente|totalmente|em parte|integralmente|insuficientemente)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de afirmar o nível da rubrica
- /\b(atende|atendeu|atinge|atingiu|alcanca|alcancou|cumpre|cumpriu) (plenamente|parcialmente|totalmente|em parte|integralmente|insuficientemente)\b|\b(parcialmente|plenamente|insuficientemente) (atendid\w+|alcancad\w+|atingid\w+)/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\bpontos? (fortes?|fracos?|a (melhorar|corrigir|revisar|ajustar)|de melhoria|positivos?|negativos?)\b|\bfortalezas?\b|\bfragilidades?\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\bprecisa(m)? de (\w+ ){0,2}(virgulas?|acentos?|acentuacao|crase|ponto final|paragrafos?|conclus\w+|introduc\w+|conectivos?|revisao|tese)\b|\bfalta de (\w+ ){0,3}(conclus\w+|introduc\w+|tese|paragraf\w+|coesao|argument\w+)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\bdo (\w+ )?(mais|melhor) \w+ ao (\w+ )?(mais|pior) \w+|\b(melhor|mais forte|mais fraco|pior) (ao|para o|pro|ate o) (pior|melhor|mais fraco|mais forte)\b|\bem ordem (decrescente |crescente )?de (qualidade|desempenho|nivel|merito|forca)\b|\branking\b|\branque\w+|\b(os|as|o|a) (melhor|melhores|pior|piores) (text\w+|redac\w+|trabalh\w+|respost\w+|producao|producoes|paragraf\w+)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\b(errou|errad[oa]s?|incorret\w+|equivoc\w+|acertou|acertaram)\b|\berros? (de|na|no|em|d[ao]) \w+/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\b(versao|reescrita|reformulacao|alternativa)\b[^.!?\n:]{0,30}\b(melhor|melhorad\w+|mais \w+|aprimorad\w+|revisad\w+|corrigid\w+)\b[^.!?\n:]{0,20}:/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\b(falt(a|ou|am|aram|ando)|ausencia de)\s+(\w+\s+){0,2}(coesao|coerencia|clareza|argument\w*|exemplos?|conclusao|conclusoes|introducao|tese|desenvolvimento|aprofundamento|conectivos?|pontuacao|paragrafacao|repertorio|acentos?|acentuacao|virgulas?|crase|concordancia|maiuscula|regencia)\b|\b(confundiu|confundiram|esqueceu|omitiu|deixou de|inverteu|misturou)\b|\bnao (decorre|se sustenta|se segue|procede|condiz)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\b(na verdade|o (correto|certo|gabarito) (e|seria)|mas (o|a) (correto|certo|correta|certa|gabarito|resposta correta)|deveria ser|deveria ter sido)\b|\be nao \d/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\b(coesao|coerencia|tese|argumentacao|ortografia|gramatica|vocabulario|repertorio|organizacao|clareza|intervencao|norma culta|paragrafacao|pontuacao)\b[^.!?\n]{0,25}\b(nivel|conceito)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica sob medida para o texto colado
- String.raw`\b(criterios?|rubrica|barema|descritores?)\b[^.!?\n]{0,60}\b(ess[ea]|est[ea]|dess[ea]|dest[ea]|aquel[ea]|seu|sua|del[ea])s? (\w+ )?(text\w+|redac\w+|respost\w+|trabalh\w+|paragraf\w+|producao)\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica sob medida para o texto colado
- String.raw`\b(criterios?|rubrica|barema|descritores?)\b[^.!?\n]{0,60}\b(a partir|com base|basead[oa]s?|tendo como base|considerando|sob medida|ajustad[oa]s?|pensad[oa]s?|montad[oa]s?|adaptad[oa]s?|personalizad[oa]s?|feit[oa]s?|criad[oa]s?|elaborad[oa]s?|para (ele|ela)|sobre o que)\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica sob medida para o texto colado
- String.raw`\b(criterios?|rubrica|barema|descritores?)\b[^.!?\n]{0,60}\bo que (el[ea]|o aluno|a aluna|\w+) (escreveu|respondeu|entregou|redigiu|colou)\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica sob medida para o texto colado
- return RUBRICA_SOB_MEDIDA.test(texto) || (RUBRICA_E_TEXTO_DE_PESSOA.test(texto) && saidaCitaPessoa(frase))
+ return RUBRICA_SOB_MEDIDA.test(texto)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica sob medida para o texto colado
- return RUBRICA_SOB_MEDIDA.test(texto) || (RUBRICA_E_TEXTO_DE_PESSOA.test(texto) && saidaCitaPessoa(frase))
+ return RUBRICA_SOB_MEDIDA.test(texto) || (RUBRICA_E_TEXTO_DE_PESSOA.test(texto))
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica sob medida para o texto colado
- return pessoaDonaDoTexto(frase) || [...semAcento(frase).matchAll(PESSOA_NA_SAIDA)].some((achado) => !NAO_E_PESSOA.has(achado[1] ?? ''))
+ return [...semAcento(frase).matchAll(PESSOA_NA_SAIDA)].some((achado) => !NAO_E_PESSOA.has(achado[1] ?? ''))
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- return pessoaDonaDoTexto(frase) || [...semAcento(frase).matchAll(PESSOA_NA_SAIDA)].some((achado) => !NAO_E_PESSOA.has(achado[1] ?? ''))
+ return pessoaDonaDoTexto(frase)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica sob medida para o texto colado
- if (rubricaSobMedida(texto, frase)) return 'sob_medida'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- if (rubricaInteira || CRITERIO_EM_GERAL.test(texto)) return undefined
+ if (CRITERIO_EM_GERAL.test(texto)) return undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- if (rubricaInteira || CRITERIO_EM_GERAL.test(texto)) return undefined
+ if (rubricaInteira) return undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- if (SAIDA_JULGA_SEM_APONTAR.some((padrao) => padrao.test(texto))) return 'sem_apontar'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- const fala = SAIDA_FALA_DO_TEXTO.test(texto) || saidaCitaPessoa(frase)
+ const fala = SAIDA_FALA_DO_TEXTO.test(texto)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- const fala = SAIDA_FALA_DO_TEXTO.test(texto) || saidaCitaPessoa(frase)
+ const fala = saidaCitaPessoa(frase)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- if (fala && !NIVEL_COMO_CONDICAO.test(texto) && (SAIDA_AFIRMA_NIVEL.some((padrao) => padrao.test(texto)) || (FALA_DO_CRITERIO.test(texto) && SAIDA_DE_NIVEL_NA_RUBRICA.test(texto)))) return 'nivel'
+ if (fala && (SAIDA_AFIRMA_NIVEL.some((padrao) => padrao.test(texto)) || (FALA_DO_CRITERIO.test(texto) && SAIDA_DE_NIVEL_NA_RUBRICA.test(texto)))) return 'nivel'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de afirmar o nível da rubrica
- if (fala && !NIVEL_COMO_CONDICAO.test(texto) && (SAIDA_AFIRMA_NIVEL.some((padrao) => padrao.test(texto)) || (FALA_DO_CRITERIO.test(texto) && SAIDA_DE_NIVEL_NA_RUBRICA.test(texto)))) return 'nivel'
+ if (fala && !NIVEL_COMO_CONDICAO.test(texto) && (SAIDA_AFIRMA_NIVEL.some((padrao) => padrao.test(texto)))) return 'nivel'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de afirmar o nível da rubrica
- if (fala && !NIVEL_COMO_CONDICAO.test(texto) && (SAIDA_AFIRMA_NIVEL.some((padrao) => padrao.test(texto)) || (FALA_DO_CRITERIO.test(texto) && SAIDA_DE_NIVEL_NA_RUBRICA.test(texto)))) return 'nivel'
+ if (fala && !NIVEL_COMO_CONDICAO.test(texto) && ((FALA_DO_CRITERIO.test(texto) && SAIDA_DE_NIVEL_NA_RUBRICA.test(texto)))) return 'nivel'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de afirmar o nível da rubrica
- if (fala && !NIVEL_COMO_CONDICAO.test(texto) && (SAIDA_AFIRMA_NIVEL.some((padrao) => padrao.test(texto)) || (FALA_DO_CRITERIO.test(texto) && SAIDA_DE_NIVEL_NA_RUBRICA.test(texto)))) return 'nivel'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- if (fala && !FALA_DO_CRITERIO.test(texto) && SAIDA_JULGA_O_TEXTO.some((padrao) => padrao.test(texto))) return 'julga'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- if (fala && !FALA_DO_CRITERIO.test(texto) && SAIDA_JULGA_O_TEXTO.some((padrao) => padrao.test(texto))) return 'julga'
+ if (fala && SAIDA_JULGA_O_TEXTO.some((padrao) => padrao.test(texto))) return 'julga'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- if (SAIDA_AO_PROFESSOR.test(texto) || SAIDA_QUE_RECUSA.test(texto)) return undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- if (SAIDA_AO_PROFESSOR.test(texto) || SAIDA_QUE_RECUSA.test(texto)) return undefined
+ if (SAIDA_QUE_RECUSA.test(texto)) return undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- if (SAIDA_AO_PROFESSOR.test(texto) || SAIDA_QUE_RECUSA.test(texto)) return undefined
+ if (SAIDA_AO_PROFESSOR.test(texto)) return undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- return textos.filter((texto) => DESCRITOR_DE_CRITERIO.test(texto) || /^[\s\-*•\d.)]*criterios?\b/.test(texto)).length >= 3 || textos.filter((texto) => FALA_DO_CRITERIO.test(texto)).length >= 4
+ return textos.filter((texto) => DESCRITOR_DE_CRITERIO.test(texto) || /^[\s\-*•\d.)]*criterios?\b/.test(texto)).length >= 9 || textos.filter((texto) => FALA_DO_CRITERIO.test(texto)).length >= 4
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- return textos.filter((texto) => DESCRITOR_DE_CRITERIO.test(texto) || /^[\s\-*•\d.)]*criterios?\b/.test(texto)).length >= 3 || textos.filter((texto) => FALA_DO_CRITERIO.test(texto)).length >= 4
+ return textos.filter((texto) => DESCRITOR_DE_CRITERIO.test(texto) || /^[\s\-*•\d.)]*criterios?\b/.test(texto)).length >= 3 || textos.filter((texto) => FALA_DO_CRITERIO.test(texto)).length >= 9
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- const DESCRITOR_DE_CRITERIO = /^[\s\-*•\d.)]*(nivel|descritor|indicador|dimensao|eixo)\b/
+ const DESCRITOR_DE_CRITERIO = /^[\s\-*•\d.)]*(zzz)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- const CRITERIO_EM_GERAL = /^[\s\-*•\d.)]*(se|quando|caso|sempre que)\b|^[\s\-*•\d.)]*(textos?|respostas?|alunos?|redacoes) que\b|\bdev(e|em|erao) (apresentar|conter|ter|trazer|demonstrar|mostrar|incluir|cumprir|atender|desenvolver)\b|\bespera-se\b/
+ const CRITERIO_EM_GERAL = /^[\s\-*•\d.)]*(textos?|respostas?|alunos?|redacoes) que\b|\bdev(e|em|erao) (apresentar|conter|ter|trazer|demonstrar|mostrar|incluir|cumprir|atender|desenvolver)\b|\bespera-se\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- const CRITERIO_EM_GERAL = /^[\s\-*•\d.)]*(se|quando|caso|sempre que)\b|^[\s\-*•\d.)]*(textos?|respostas?|alunos?|redacoes) que\b|\bdev(e|em|erao) (apresentar|conter|ter|trazer|demonstrar|mostrar|incluir|cumprir|atender|desenvolver)\b|\bespera-se\b/
+ const CRITERIO_EM_GERAL = /^[\s\-*•\d.)]*(se|quando|caso|sempre que)\b|\bdev(e|em|erao) (apresentar|conter|ter|trazer|demonstrar|mostrar|incluir|cumprir|atender|desenvolver)\b|\bespera-se\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- const CRITERIO_EM_GERAL = /^[\s\-*•\d.)]*(se|quando|caso|sempre que)\b|^[\s\-*•\d.)]*(textos?|respostas?|alunos?|redacoes) que\b|\bdev(e|em|erao) (apresentar|conter|ter|trazer|demonstrar|mostrar|incluir|cumprir|atender|desenvolver)\b|\bespera-se\b/
+ const CRITERIO_EM_GERAL = /^[\s\-*•\d.)]*(se|quando|caso|sempre que)\b|^[\s\-*•\d.)]*(textos?|respostas?|alunos?|redacoes) que\b|\bespera-se\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- const CRITERIO_EM_GERAL = /^[\s\-*•\d.)]*(se|quando|caso|sempre que)\b|^[\s\-*•\d.)]*(textos?|respostas?|alunos?|redacoes) que\b|\bdev(e|em|erao) (apresentar|conter|ter|trazer|demonstrar|mostrar|incluir|cumprir|atender|desenvolver)\b|\bespera-se\b/
+ const CRITERIO_EM_GERAL = /^[\s\-*•\d.)]*(se|quando|caso|sempre que)\b|^[\s\-*•\d.)]*(textos?|respostas?|alunos?|redacoes) que\b|\bdev(e|em|erao) (apresentar|conter|ter|trazer|demonstrar|mostrar|incluir|cumprir|atender|desenvolver)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- const FALA_DO_CRITERIO = /\b(criterios?|rubricas?|descritores?|baremas?|indicadores?|dimensoes|eixos|competencias|quesitos|aspectos a (avaliar|observar)|matriz de correcao|escala|antes (da|de) (aplicar|aplicacao)|aplicacao)\b/
+ const FALA_DO_CRITERIO = /\bzzz\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de afirmar o nível da rubrica
- const SAIDA_DE_NIVEL_NA_RUBRICA = /\b(nivel|niveis|pontos?|conceito|faixa)\b/
+ const SAIDA_DE_NIVEL_NA_RUBRICA = /\bzzz\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- const SAIDA_DESEMPENHO = /\b(entendeu|entenderam|compreendeu|compreenderam|dominou|dominaram|aprendeu|aprenderam|assimilou|assimilaram)\b|\bprecisa(m)? (de )?(praticar|estudar|treinar|reforcar|melhorar|rever|revisar|exercitar)\b/
+ const SAIDA_DESEMPENHO = /\bzzz\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- const SAIDA_SUJEITO_PESSOA = /\b(alun[oa]s?|estudantes?|el[ea]s?)\b/
+ const SAIDA_SUJEITO_PESSOA = /\bzzz\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- const QUALIDADE_SEM_SUJEITO = String.raw`bom|boa|otim\w+|excelente|confus\w+|clar[oa]|convincente|superficial|vag[oa]|frac[oa]|forte|coes[oa]|coerente|incoerente|repetitiv\w+|prolix\w+|cansativ\w+|corret\w+|errad\w+|incomplet\w+|complet\w+|ruim|perfeit\w+|(?:bem |mal )?(?:escrit\w+|construid\w+|argumentad\w+|organizad\w+|desenvolvid\w+)`
+ const QUALIDADE_SEM_SUJEITO = String.raw`zzz`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › saída que julga texto concreto é barrada quando a conversa traz texto de aluno
- return conversaTrazTextoDeAluno && razaoDoJulgamento(texto).length > 0
+ return razaoDoJulgamento(texto).length > 0
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › com texto de aluno na conversa, a saída que não julga nada passa
- return conversaTrazTextoDeAluno && razaoDoJulgamento(texto).length > 0
+ return conversaTrazTextoDeAluno
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › saída que julga texto concreto é barrada quando a conversa traz texto de aluno
- return conversaTrazTextoDeAluno && razaoDoJulgamento(texto).length > 0
+ return false
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a conferência confere os dois tipos de saída
- const doJulgamento = julgaTextoDeAluno(saida.texto, conversaTrazTextoDeAluno(entrada.mensagem, entrada.turnosAnteriores)) ? [PROBLEMA_DO_JULGAMENTO] : []
+ const doJulgamento = julgaTextoDeAluno(saida.texto, conversaTrazTextoDeAluno(entrada.mensagem, [])) ? [PROBLEMA_DO_JULGAMENTO] : []
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a conferência confere os dois tipos de saída
- const doJulgamento = julgaTextoDeAluno(saida.texto, conversaTrazTextoDeAluno(entrada.mensagem, entrada.turnosAnteriores)) ? [PROBLEMA_DO_JULGAMENTO] : []
+ const doJulgamento: string[] = []
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a conferência confere os dois tipos de saída
- if (saida.tipo === 'texto') return [...daD55, ...problemasDasCitacoes(saida.citacoes, entrada.trechos, 'Citações')]
+ if (saida.tipo === 'texto') return [...daNota, ...problemasDasCitacoes(saida.citacoes, entrada.trechos, 'Citações')]
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a conferência confere os dois tipos de saída
- return [...daD55, ...(entrada.semProposta === true ? ['O professor escolheu só conversar: responda com "tipo": "texto", sem "proposta_de_ferramenta".'] : [])]
+ return [...daNota, ...(entrada.semProposta === true ? ['O professor escolheu só conversar: responda com "tipo": "texto", sem "proposta_de_ferramenta".'] : [])]
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › citação inválida duas vezes, sem texto de aluno
- if (!problemas.some((problema) => PROBLEMAS_DA_D55.includes(problema))) return undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › duas saídas julgadoras entregam a recusa
- const PROBLEMAS_DA_D55: readonly string[] = [PROBLEMA_DA_NOTA, PROBLEMA_DO_JULGAMENTO]
+ const PROBLEMAS_DA_D55: readonly string[] = [PROBLEMA_DA_NOTA]
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › só a nota, duas vezes, entrega a recusa
- const PROBLEMAS_DA_D55: readonly string[] = [PROBLEMA_DA_NOTA, PROBLEMA_DO_JULGAMENTO]
+ const PROBLEMAS_DA_D55: readonly string[] = [PROBLEMA_DO_JULGAMENTO]
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › duas saídas julgadoras entregam a recusa
- return { tipo: 'texto', texto: RECUSA_DE_CORRECAO_DE_TEXTO_DE_ALUNO, citacoes: [] }
+ return undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a recusa passa nas duas conferências e no schema
- 'Eu não corrijo nem avalio redação, resposta discursiva ou texto de aluno, não sugiro nota, conceito nem pontuação e não escrevo devolutiva sobre o que ele escreveu: essa correção é sua. O que eu preparo aqui é atividade objetiva, plano de aula e versão adaptada de atividade, sempre a partir do material da escola.'
+ 'Eu não corrijo nem avalio redação, resposta discursiva ou texto de aluno, não sugiro nota, conceito nem pontuação e não escrevo devolutiva sobre o que ele escreveu: essa correção é sua, e falta coesão no texto da turma. O que eu preparo aqui é atividade objetiva, plano de aula e versão adaptada de atividade, sempre a partir do material da escola.'
```

```mutacao
arquivo: packages/nucleo/src/ia/provedor.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › só a última reprovação decide a reserva
- problemasDaUltima = interpretada.problemas
+ problemasDaUltima = [...problemasDaUltima, ...interpretada.problemas]
```

```mutacao
arquivo: packages/nucleo/src/ia/provedor.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › duas saídas julgadoras entregam a recusa
- problemasDaUltima = interpretada.problemas
+ problemasDaUltima = []
```

```mutacao
arquivo: packages/nucleo/src/ia/provedor.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › duas saídas julgadoras entregam a recusa
- const reserva = reprovadaNaConferencia ? tarefa.reservaQuandoInvalida?.(entrada, problemasDaUltima) : undefined
+ const reserva = reprovadaNaConferencia ? tarefa.reservaQuandoInvalida?.(entrada) : undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/prompts/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o prompt sobe a versão
- versao: '2026-10-22.1',
+ versao: '2026-10-04.5',
```

```mutacao
arquivo: packages/nucleo/src/ia/prompts/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o prompt sobe a versão
- '- Nem juízo de qualidade você dá sobre texto de aluno: não diga se está bom ou fraco, não aponte erro nem falta, não compare nem ordene textos, não diga em que nível da rubrica ele está e não sugira como reescrevê-lo. Rubrica e critérios você escreve em geral, antes da aplicação, e nunca sob medida para um texto que o professor colou. Organizar o lote (por turma, data ou tema escolhido), esconder o nome para a correção cega e conferir quem entregou você pode.',
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › saidaQualitativa alcança o alvo: recall nas positivas
- saidaQualitativa: (amostra) => julgaTextoDeAluno(amostra.texto, conversaTrazTextoDeAluno(amostra.contexto?.mensagemDoProfessor ?? '', turnosDoProfessor(amostra))),
+ saidaQualitativa: (amostra) => false,
```

```mutacao
arquivo: packages/nucleo/src/ia/ouro.test.ts
teste: packages/nucleo/src/ia/ouro.test.ts › saidaQualitativa alcança o alvo: nenhuma legítima barrada
- saidaQualitativa: (amostra) => julgaTextoDeAluno(amostra.texto, conversaTrazTextoDeAluno(amostra.contexto?.mensagemDoProfessor ?? '', turnosDoProfessor(amostra))),
+ saidaQualitativa: (amostra) => julgaTextoDeAluno(amostra.texto, true),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/ouro.test.ts › saidaQualitativa alcança o alvo: nenhuma legítima barrada
- return conversaTrazTextoDeAluno && razaoDoJulgamento(texto).length > 0
+ return razaoDoJulgamento(texto).length > 0
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/ouro.test.ts › saidaQualitativa alcança o alvo: recall nas positivas
- if (fala && !NIVEL_COMO_CONDICAO.test(texto) && (SAIDA_AFIRMA_NIVEL.some((padrao) => padrao.test(texto)) || (FALA_DO_CRITERIO.test(texto) && SAIDA_DE_NIVEL_NA_RUBRICA.test(texto)))) return 'nivel'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/ouro.test.ts › julgamentoDeTextoDeAluno alcança o alvo sem JT-001 a JT-012
- return pedeOpiniaoSobreOAnterior(mensagem) || pedeRubricaSobreOAnterior(mensagem) || pedeMexerNoTextoAnterior(mensagem)
+ return pedeRubricaSobreOAnterior(mensagem) || pedeMexerNoTextoAnterior(mensagem)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/ouro.test.ts › rubrica_antes e material_do_professor não casam
- String.raw`\bquanto (?!tempo\b|de tempo\b)[^.?!]{0,25}\b(devo dar|deveria dar|vou dar|posso dar|poderia dar|eu dou|eu poria|eu poderia por|voce da|vc da|voce poria|vc poria|voce colocaria|vc colocaria|voce botaria|vc botaria)\b`,
+ String.raw`\brubricas?\b|\bcriterios?\b|\bquanto (?!tempo\b|de tempo\b)[^.?!]{0,25}\b(devo dar|deveria dar|vou dar|posso dar|poderia dar|eu dou|eu poria|eu poderia por|voce da|vc da|voce poria|vc poria|voce colocaria|vc colocaria|voce botaria|vc botaria)\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/ouro.test.ts › rubrica_antes e material_do_professor não casam
- const paraARegra = (mensagem: string): string => normalizar(mensagem).replace(NOTA_QUE_NAO_E_DE_ALUNO, ' ')
+ const paraARegra = (mensagem: string): string => normalizar(mensagem).replace(NOTA_QUE_NAO_E_DE_ALUNO, ' nota para ')
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- /(?:^|[.!?\n;:]\s*)(?:[AO]\s+)?([A-Z][a-z]{2,})\b(?!\s+[A-Z])\s+(?:\w+\s+){0,2}(?:ficou|leu|apresentou|demonstrou|mostrou|precisa|deveria|poderia|conseguiu|soube|tirou|trouxe|citou|mencionou|entendeu|entenderam|compreendeu|compreenderam|dominou|dominaram|aprendeu|aprenderam|assimilou|assimilaram)\b/g
+ /(?!)/g
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- /(?:^|[.!?\n;:]\s*)(?:[AO]\s+)?([A-Z][a-z]{2,})\b(?!\s+[A-Z])\s+(?:\w+\s+){0,2}(?:ficou|leu|apresentou|demonstrou|mostrou|precisa|deveria|poderia|conseguiu|soube|tirou|trouxe|citou|mencionou|entendeu|entenderam|compreendeu|compreenderam|dominou|dominaram|aprendeu|aprenderam|assimilou|assimilaram)\b/g
+ /(?:^|[.!?\n;:]\s*)(?:[AO]\s+)([A-Z][a-z]{2,})\b(?!\s+[A-Z])\s+(?:\w+\s+){0,2}(?:ficou|leu|apresentou|demonstrou|mostrou|precisa|deveria|poderia|conseguiu|soube|tirou|trouxe|citou|mencionou|entendeu|entenderam|compreendeu|compreenderam|dominou|dominaram|aprendeu|aprenderam|assimilou|assimilaram)\b/g
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a resposta de conteúdo passa com a chave ligada
- /(?:^|[.!?\n;:]\s*)(?:[AO]\s+)?([A-Z][a-z]{2,})\b(?!\s+[A-Z])\s+(?:\w+\s+){0,2}(?:ficou|leu|apresentou|demonstrou|mostrou|precisa|deveria|poderia|conseguiu|soube|tirou|trouxe|citou|mencionou|entendeu|entenderam|compreendeu|compreenderam|dominou|dominaram|aprendeu|aprenderam|assimilou|assimilaram)\b/g
+ /(?:^|[.!?\n;:]\s*)(?:[AO]\s+)?([A-Z][a-z]{2,})\b\s+(?:\w+\s+){0,2}(?:ficou|leu|apresentou|demonstrou|mostrou|precisa|deveria|poderia|conseguiu|soube|tirou|trouxe|citou|mencionou|entendeu|entenderam|compreendeu|compreenderam|dominou|dominaram|aprendeu|aprenderam|assimilou|assimilaram)\b/g
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada jeito de julgar o texto é barrado
- /\b(erro|erros|errou|errad[oa]s?|incorret\w+|equivoc\w+|falha|falhas|falhou|problemas?|inconsistenc\w+|contradi\w+|confund\w+|foge|fogem|fugindo|fugiu|fugiram|fuga|desvia\w*|plagi\w+|ambigu\w+|impreciso\w*|imprecisa|incomplet\w+|copiou)\b/,
+ /\b(erro|erros|errou|errad[oa]s?|incorret\w+|equivoc\w+|falha|falhas|falhou|problemas?|inconsistenc\w+|contradi\w+|confund\w+|desvia\w*|plagi\w+|ambigu\w+|impreciso\w*|imprecisa|incomplet\w+|copiou)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › rubrica e critérios, em geral e antes da aplicação, passam
- return textos.filter((texto) => DESCRITOR_DE_CRITERIO.test(texto) || /^[\s\-*•\d.)]*criterios?\b/.test(texto)).length >= 3 || textos.filter((texto) => FALA_DO_CRITERIO.test(texto)).length >= 4
+ return textos.filter((texto) => DESCRITOR_DE_CRITERIO.test(texto)).length >= 3 || textos.filter((texto) => FALA_DO_CRITERIO.test(texto)).length >= 4
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › nota pedida pelo verbo de dar ou pelo número
- String.raw`\bquanto (?!tempo\b|de tempo\b)[^.?!]{0,25}\b(devo dar|deveria dar|vou dar|posso dar|poderia dar|eu dou|eu poria|eu poderia por|voce da|vc da|voce poria|vc poria|voce colocaria|vc colocaria|voce botaria|vc botaria)\b`,
+ String.raw`\bquanto (?!tempo\b)[^.?!]{0,25}\b(devo dar|deveria dar|vou dar|posso dar|poderia dar|eu dou|eu poria|eu poderia por|voce da|vc da|voce poria|vc poria|voce colocaria|vc colocaria|voce botaria|vc botaria)\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
+ /\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
+ const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
+ const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
+ const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|vamos|vou|sugiro|recomendo|se quiser)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
+ const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vou|sugiro|recomendo|se quiser)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
+ const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|sugiro|recomendo|se quiser)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
+ const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|recomendo|se quiser)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
+ const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|se quiser)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
+ const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a frase dirigida ao professor passa
- const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(voce|vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
+ const SAIDA_AO_PROFESSOR = /^[\s\-*•\d.)]*(defina|escolha|decida|monte|pense|considere|combine|alinhe|registre|lembre|garanta|deixe)\b|\b(vc|posso|podemos|vamos|vou|sugiro|recomendo|se quiser)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- if ((SAIDA_SUJEITO_PESSOA.test(texto) || saidaCitaPessoa(frase)) && !FALA_DO_CRITERIO.test(texto) && SAIDA_DESEMPENHO.test(texto)) return 'desempenho'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- if ((SAIDA_SUJEITO_PESSOA.test(texto) || saidaCitaPessoa(frase)) && !FALA_DO_CRITERIO.test(texto) && SAIDA_DESEMPENHO.test(texto)) return 'desempenho'
+ if ((saidaCitaPessoa(frase)) && !FALA_DO_CRITERIO.test(texto) && SAIDA_DESEMPENHO.test(texto)) return 'desempenho'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- if ((SAIDA_SUJEITO_PESSOA.test(texto) || saidaCitaPessoa(frase)) && !FALA_DO_CRITERIO.test(texto) && SAIDA_DESEMPENHO.test(texto)) return 'desempenho'
+ if ((SAIDA_SUJEITO_PESSOA.test(texto)) && !FALA_DO_CRITERIO.test(texto) && SAIDA_DESEMPENHO.test(texto)) return 'desempenho'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- if ((SAIDA_SUJEITO_PESSOA.test(texto) || saidaCitaPessoa(frase)) && !FALA_DO_CRITERIO.test(texto) && SAIDA_DESEMPENHO.test(texto)) return 'desempenho'
+ if ((SAIDA_SUJEITO_PESSOA.test(texto) || saidaCitaPessoa(frase)) && SAIDA_DESEMPENHO.test(texto)) return 'desempenho'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- if ((SAIDA_SUJEITO_PESSOA.test(texto) || saidaCitaPessoa(frase)) && !FALA_DO_CRITERIO.test(texto) && SAIDA_DESEMPENHO.test(texto)) return 'desempenho'
+ if ((SAIDA_SUJEITO_PESSOA.test(texto) || saidaCitaPessoa(frase)) && !FALA_DO_CRITERIO.test(texto)) return 'desempenho'
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- const SAIDA_DESEMPENHO = /\b(entendeu|entenderam|compreendeu|compreenderam|dominou|dominaram|aprendeu|aprenderam|assimilou|assimilaram)\b|\bprecisa(m)? (de )?(praticar|estudar|treinar|reforcar|melhorar|rever|revisar|exercitar)\b/
+ const SAIDA_DESEMPENHO = /\b(entendeu|entenderam|compreendeu|compreenderam|dominou|dominaram|aprendeu|aprenderam|assimilou|assimilaram)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- const SAIDA_SUJEITO_PESSOA = /\b(alun[oa]s?|estudantes?|el[ea]s?)\b/
+ const SAIDA_SUJEITO_PESSOA = /\b(alun[oa]s?|estudantes?)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a resposta de conteúdo passa com a chave ligada
- String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
+ String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|exemplos?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a resposta de conteúdo passa com a chave ligada
- String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
+ String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|resultados?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a resposta de conteúdo passa com a chave ligada
- String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
+ String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|definic\w+|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a resposta de conteúdo passa com a chave ligada
- String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
+ String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|calculos?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a resposta de conteúdo passa com a chave ligada
- String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
+ String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|ideias?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a resposta de conteúdo passa com a chave ligada
- String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
+ String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|el[ea]s?|frases?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a resposta de conteúdo passa com a chave ligada
- String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
+ String.raw`\b(textos?|textinhos?|redac\w+|respostas?|trabalhos?|producao|producoes|paragrafos?|introducao|conclusao|tese|argument\w+|desenvolvimento|dissertac\w+|composic\w+|resumos?|resenhas?|relatorios?|escrita|ortografia|conectivos?|vocabulario|repertorio|alun[oa]s?|estudantes?|frases?|trechos?|caligrafia)\b|\bo que (el[ea]|\w+) (escreveu|respondeu|entregou|redigiu)\b|\b[a-z]-\d{1,3}\b|\b(usou|escreveu|explicou)\b|\b(o|a) (primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|ultim[oa])\b`,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o excesso, o aquém do esperado
- /\b(melhor|pior|superior|inferior|mais \w+|menos \w+) (do )?(que|do que)\b|\b(o|a) (melhor|pior) d[aeo]s?\b|\b(acima|abaixo|aquem) d[aeo]s? (outr\w+|demais|media|resto|esperad\w+)\b|\b(o|a|os|as) (melhor|pior|melhores|piores) (introduc(ao|oes)|conclus(ao|oes)|teses?|argumentos?|paragrafos?|desenvolvimentos?|textos?|redac(ao|oes))\b|\b(se destaca|destaca-se|supera|superou|perde para|ganha d[ea]|entre (as|os) (melhores|piores))\b|\b(primeiro|segundo|terceiro|ultimo) lugar\b/,
+ /\b(melhor|pior|superior|inferior|mais \w+|menos \w+) (do )?(que|do que)\b|\b(o|a) (melhor|pior) d[aeo]s?\b|\b(acima|abaixo) d[aeo]s? (outr\w+|demais|media|resto|esperad\w+)\b|\b(o|a|os|as) (melhor|pior|melhores|piores) (introduc(ao|oes)|conclus(ao|oes)|teses?|argumentos?|paragrafos?|desenvolvimentos?|textos?|redac(ao|oes))\b|\b(se destaca|destaca-se|supera|superou|perde para|ganha d[ea]|entre (as|os) (melhores|piores))\b|\b(primeiro|segundo|terceiro|ultimo) lugar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o excesso, o aquém do esperado
- /\b(melhor|pior|superior|inferior|mais \w+|menos \w+) (do )?(que|do que)\b|\b(o|a) (melhor|pior) d[aeo]s?\b|\b(acima|abaixo|aquem) d[aeo]s? (outr\w+|demais|media|resto|esperad\w+)\b|\b(o|a|os|as) (melhor|pior|melhores|piores) (introduc(ao|oes)|conclus(ao|oes)|teses?|argumentos?|paragrafos?|desenvolvimentos?|textos?|redac(ao|oes))\b|\b(se destaca|destaca-se|supera|superou|perde para|ganha d[ea]|entre (as|os) (melhores|piores))\b|\b(primeiro|segundo|terceiro|ultimo) lugar\b/,
+ /\b(melhor|pior|superior|inferior|mais \w+|menos \w+) (do )?(que|do que)\b|\b(o|a) (melhor|pior) d[aeo]s?\b|\b(acima|abaixo|aquem) d[aeo]s? (outr\w+|demais|media|resto)\b|\b(o|a|os|as) (melhor|pior|melhores|piores) (introduc(ao|oes)|conclus(ao|oes)|teses?|argumentos?|paragrafos?|desenvolvimentos?|textos?|redac(ao|oes))\b|\b(se destaca|destaca-se|supera|superou|perde para|ganha d[ea]|entre (as|os) (melhores|piores))\b|\b(primeiro|segundo|terceiro|ultimo) lugar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o excesso, o aquém do esperado
- /\b(melhor|pior|superior|inferior|mais \w+|menos \w+) (do )?(que|do que)\b|\b(o|a) (melhor|pior) d[aeo]s?\b|\b(acima|abaixo|aquem) d[aeo]s? (outr\w+|demais|media|resto|esperad\w+)\b|\b(o|a|os|as) (melhor|pior|melhores|piores) (introduc(ao|oes)|conclus(ao|oes)|teses?|argumentos?|paragrafos?|desenvolvimentos?|textos?|redac(ao|oes))\b|\b(se destaca|destaca-se|supera|superou|perde para|ganha d[ea]|entre (as|os) (melhores|piores))\b|\b(primeiro|segundo|terceiro|ultimo) lugar\b/,
+ /\b(melhor|pior|superior|inferior|mais \w+|menos \w+) (do )?(que|do que)\b|\b(o|a) (melhor|pior) d[aeo]s?\b|\b(acima|abaixo|aquem) d[aeo]s? (outr\w+|demais|media|resto|esperad\w+)\b|\b(se destaca|destaca-se|supera|superou|perde para|ganha d[ea]|entre (as|os) (melhores|piores))\b|\b(primeiro|segundo|terceiro|ultimo) lugar\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o excesso, o aquém do esperado
- /\b(sugiro|recomendo|sugestao|pode|podem|precisa|precisam|poderia|poderiam|deveria|deveriam|para melhorar|conviria|seria (bom|melhor|interessante|ideal)|tente|tentar)\b[^.!?\n]{0,60}\b(reescrev\w*|reformul\w*|refaz\w*|refaca|reorganiz\w*|reelabor\w*|trocar|troque|substitu\w*|acrescent\w*|adicion\w*|melhor(ar|e)|revis(e|ar)|ajust(e|ar)|aprofund\w*|detalh(e|ar)|desenvolv(a|er)|explicit\w*|cit(e|ar)|mencion(e|ar))\b/,
+ /\b(sugiro|recomendo|sugestao|poderia|poderiam|deveria|deveriam|para melhorar|conviria|seria (bom|melhor|interessante|ideal)|tente|tentar)\b[^.!?\n]{0,60}\b(reescrev\w*|reformul\w*|refaz\w*|refaca|reorganiz\w*|reelabor\w*|trocar|troque|substitu\w*|acrescent\w*|adicion\w*|melhor(ar|e)|revis(e|ar)|ajust(e|ar)|aprofund\w*|detalh(e|ar)|desenvolv(a|er)|explicit\w*|cit(e|ar)|mencion(e|ar))\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\bpontos? (fortes?|fracos?|a (melhorar|corrigir|revisar|ajustar)|de melhoria|positivos?|negativos?)\b|\bfortalezas?\b|\bfragilidades?\b/,
+ /\bpontos? (fortes?|fracos?|a melhorar|de melhoria|positivos?|negativos?)\b|\bfortalezas?\b|\bfragilidades?\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\bprecisa(m)? de (\w+ ){0,2}(virgulas?|acentos?|acentuacao|crase|ponto final|paragrafos?|conclus\w+|introduc\w+|conectivos?|revisao|tese)\b|\bfalta de (\w+ ){0,3}(conclus\w+|introduc\w+|tese|paragraf\w+|coesao|argument\w+)\b/,
+ /\bfalta de (\w+ ){0,3}(conclus\w+|introduc\w+|tese|paragraf\w+|coesao|argument\w+)\b/,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo dito sem apontar o texto
- /\bprecisa(m)? de (\w+ ){0,2}(virgulas?|acentos?|acentuacao|crase|ponto final|paragrafos?|conclus\w+|introduc\w+|conectivos?|revisao|tese)\b|\bfalta de (\w+ ){0,3}(conclus\w+|introduc\w+|tese|paragraf\w+|coesao|argument\w+)\b/,
+ /\bprecisa(m)? de (\w+ ){0,2}(virgulas?|acentos?|acentuacao|crase|ponto final|paragrafos?|conclus\w+|introduc\w+|conectivos?|revisao|tese)\b/
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
+ new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a resposta de conteúdo passa com a chave ligada
- new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
+ new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+\w+(?:ar|er|ir)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
+ new RegExp(String.raw`(?:^[\s\-*•]*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
+ new RegExp(String.raw`,\s*(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- new RegExp(String.raw`^[\s\-*•]*(?:${ELOGIO})(?:\s*,\s*(?:${ELOGIO}))*\s*$|\bparabens (?:pelo|pela|por)\b|\bgostei\b`),
+ new RegExp(String.raw`^[\s\-*•]*(?:${ELOGIO})(?:\s*,\s*(?:${ELOGIO}))*\s*$|\bparabens (?:pelo|pela|por)\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- new RegExp(String.raw`^[\s\-*•]*(?:${ELOGIO})(?:\s*,\s*(?:${ELOGIO}))*\s*$|\bparabens (?:pelo|pela|por)\b|\bgostei\b`),
+ new RegExp(String.raw`\bparabens (?:pelo|pela|por)\b|\bgostei\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- new RegExp(String.raw`^[\s\-*•]*(?:${ELOGIO})(?:\s*,\s*(?:${ELOGIO}))*\s*$|\bparabens (?:pelo|pela|por)\b|\bgostei\b`),
+ new RegExp(String.raw`^[\s\-*•]*(?:${ELOGIO})(?:\s*,\s*(?:${ELOGIO}))*\s*$|\bgostei\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- new RegExp(String.raw`^[\s\-*•]*(?:${ELOGIO})(?:\s*,\s*(?:${ELOGIO}))*\s*$|\bparabens (?:pelo|pela|por)\b|\bgostei\b`),
+ new RegExp(String.raw`^[\s\-*•]*(?:${ELOGIO})\s*$|\bparabens (?:pelo|pela|por)\b|\bgostei\b`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- const ELOGIO = String.raw`muito bom|bom trabalho|parabens|(?:e )?(?:um )?bom comeco`
+ const ELOGIO = String.raw`muito bom|bom trabalho|parabens`
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o desempenho de quem escreveu, dito com verbo
- /(?:^|[.!?\n;:]\s*)(?:[AO]\s+)?([A-Z][a-z]{2,})\b(?!\s+[A-Z])\s+(?:\w+\s+){0,2}(?:ficou|leu|apresentou|demonstrou|mostrou|precisa|deveria|poderia|conseguiu|soube|tirou|trouxe|citou|mencionou|entendeu|entenderam|compreendeu|compreenderam|dominou|dominaram|aprendeu|aprenderam|assimilou|assimilaram)\b/g
+ /(?:^|[.!?\n;:]\s*)(?:[AO]\s+)?([A-Z][a-z]{2,})\b(?!\s+[A-Z])\s+(?:\w+\s+){0,2}(?:ficou|leu|apresentou|demonstrou|mostrou|precisa|deveria|poderia|conseguiu|soube|tirou|trouxe|citou|mencionou)\b/g
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada marca da mensagem, sozinha, liga a chave
- const PARTE_DE_TEXTO = new RegExp(String.raw`\b${TEXTO}\b|\b(conectivos?|ortografia|pontuacao|concordancia|vocabulario|repertorio|coesao|coerencia|argumentacao|acentuacao|virgulas?)\b`, 'i')
+ const PARTE_DE_TEXTO = new RegExp(String.raw`\b(conectivos?|ortografia|pontuacao|concordancia|vocabulario|repertorio|coesao|coerencia|argumentacao|acentuacao|virgulas?)\b`, 'i')
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › cada marca da mensagem, sozinha, liga a chave
- const PARTE_DE_TEXTO = new RegExp(String.raw`\b${TEXTO}\b|\b(conectivos?|ortografia|pontuacao|concordancia|vocabulario|repertorio|coesao|coerencia|argumentacao|acentuacao|virgulas?)\b`, 'i')
+ const PARTE_DE_TEXTO = new RegExp(String.raw`\b${TEXTO}\b`, 'i')
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › uma pessoa pelo nome que faz o que o aluno faz
- const PESSOA_QUE_FEZ = /(?:^|[.?!:;]\s*)([A-Z][a-z]{2,})\s+(?:(?:nao|ja|tambem|bem|so|ainda|mal|nunca)\s+){0,2}(?:usou|escreveu|acertou|errou|fez|entendeu|respondeu|argumentou|desenvolveu|redigiu|entregou|copiou|compreendeu|dominou|explicou|resolveu)\b/g
+ const PESSOA_QUE_FEZ = /(?:^|[.?!:;]\s*)([A-Z][a-z]{2,})\s+(?:usou|escreveu|acertou|errou|fez|entendeu|respondeu|argumentou|desenvolveu|redigiu|entregou|copiou|compreendeu|dominou|explicou|resolveu)\b/g
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › o juízo sem sujeito, com o texto subentendido
- new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
+ new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/propor-ferramenta.ts
teste: packages/nucleo/src/ia/tarefas/numeros.test.ts › a resposta de conteúdo passa com a chave ligada
- new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)(?!\s+\w+(?:ar|er|ir)\b)`),
+ new RegExp(String.raw`(?:^[\s\-*•]*|,\s*)(?:esta|estao|e|ficou|ficaram|parece|soa)\s+(?:(?:muito|bem|pouco|um pouco|bastante|meio|tao)\s+)*(?:${QUALIDADE_SEM_SUJEITO})\b(?!\s+que\b)`),
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

Destino de código, no `TODO.md` (linha "Refinar as listas da conferência da saída (X6)"): a tabela vem da ordem `.processo/ordens/3_task-r4.md`.

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (4ª), test-engineer (4ª), llm-integrator (4ª) | O `e` do ponto 4 também casa a conjunção "e" depois de vírgula (`propor-ferramenta.ts:444`, ramo `,\s*`): com a chave ligada barra "O sal é branco, e forte no sabor.", "O gabarito é a letra C, e correta segundo a tabela.", "A reação libera calor, e completa o ciclo.", "A água ferve a 100 °C, e claro, depende da pressão.", "O mol é a unidade, é claro.", "Aqui está o resultado, é correto.", "É completo o balanceamento: 2H2 + O2."; e o adjetivo que abre a frase com "é" ("É forte a relação entre massa e mol."). Saída proposta pelo test-engineer: prender o `e` ao ramo do começo de frase | Custo de precisão de um ponto do diagnóstico 3b: vai para a linha "O que a conferência não pega, medido em 22/10" do `onda-0.md` §2.3 (documento do Arquiteto; o Orquestrador decide se ele acrescenta os exemplos antes do commit) e, como código, para o refinamento das listas na X6 (`conformidade/`, 26.0 a 29.0), medido no lote retido do `ouro`. Mudar o ramo agora reabre o escopo da rodada |
| revisor-geral (4ª), llm-integrator (4ª) | "Darwin aprendeu muito na viagem." e "Lavoisier aprendeu química." caem na recusa pelo verbo `aprendeu`, como "Newton compreendeu que…" | Mesma linha do `onda-0.md` §2.3 (custo de precisão já declarado para "compreendeu"); a D55 erra para o lado de barrar |
| conformidade-reviewer (4ª) | "É ruim estruturar assim." passa com a chave ligada, pela guarda do infinitivo `(?!\s+\w+(?:ar|er|ir)\b)`; a guarda pega qualquer palavra em -ar/-er/-ir | Linha "O que a conferência não pega" do `onda-0.md` §2.3 e refinamento na X6 |
| conformidade-reviewer (4ª) | "É errado dizer que peso é massa." é barrada com a chave ligada, por outro ramo da conferência | Mesma linha do §2.3, junto de "Newton compreendeu que…" |
| conformidade-reviewer (4ª) | O `3_task.md` não tem o bloco único que "volta o padrão de `:443` à forma de hoje"; os cinco blocos por parte cobrem o mesmo | Relatório da tarefa ao Orquestrador (uma linha, para o `/validar` não estranhar); o documento já foi aprovado e não muda por isso |
| test-engineer (4ª) | Ponto 1: o bloco devolve a lista inteira de verbos de `PESSOA_NA_SAIDA` e só "entendeu" e "dominou" têm frase; tirar "aprendeu", "compreendeu", "assimilou" ou os plurais deixa a suíte verde (sugere "O Caio aprendeu a regra.") | `TODO.md`, ou a tarefa da X6 que reescrever essa lista (26.0 a 29.0) |
| test-engineer (4ª) | `ELOGIO`: as partes opcionais `(?:e )?(?:um )?` não têm bloco próprio; "Um bom começo!" sem o "É" não está em teste | Mesmo destino: refinamento das listas na X6 |
| revisor-geral (4ª) | A docstring de `SAIDA_AO_PROFESSOR` (`propor-ferramenta.ts:484`) ainda dá "espera a sua aprovação" como exemplo, mas a alternativa saiu da regex | Mesmo destino: comentário de `.ts` caduca o `revisor-geral` e custaria uma rodada nova só para ele; a X6 reescreve o trecho |

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
| 2026-10-22 10:14:54 | 2026-10-22 10:15:32 | `llm-integrator` | 1 | APROVADO | a373d27786c490201 |
| 2026-10-22 10:14:53 | 2026-10-22 10:16:16 | `conformidade-reviewer` | 1 | APROVADO | ab98be08ecb5e2069 |
| 2026-10-22 10:14:58 | 2026-10-22 10:17:06 | `revisor-geral` | 1 | REPROVADO | abb24691d590d1a98 |
| 2026-10-22 10:14:56 | 2026-10-22 10:19:55 | `test-engineer` | 1 | REPROVADO | ac6ee79c8b85bc4c8 |
| 2026-10-22 10:35:21 | 2026-10-22 10:36:01 | `llm-integrator` | 2 | APROVADO | ae8defc762a089983 |
| 2026-10-22 10:35:04 | 2026-10-22 10:36:44 | `revisor-geral` | 2 | REPROVADO | a9bef18a746bf2be5 |
| 2026-10-22 10:35:18 | 2026-10-22 10:37:38 | `conformidade-reviewer` | 2 | REPROVADO | a4534268dbac0c70d |
| 2026-10-22 10:35:14 | 2026-10-22 10:38:27 | `test-engineer` | 2 | REPROVADO | ab359a0323acd12a4 |
| 2026-10-22 11:06:23 | 2026-10-22 11:08:58 | `revisor-geral` | 3 | REPROVADO | ac9243eb2fdb4de1d |
| 2026-10-22 11:06:47 | 2026-10-22 11:09:03 | `llm-integrator` | 3 | APROVADO | a9a7d8e64a9f86b94 |
| 2026-10-22 11:06:33 | 2026-10-22 11:09:04 | `test-engineer` | 3 | REPROVADO | a04ca11bdf02dcf25 |
| 2026-10-22 11:06:42 | 2026-10-22 11:09:24 | `conformidade-reviewer` | 3 | REPROVADO | a38ab979a2d42b113 |
| 2026-10-22 11:22:08 | 2026-10-22 11:23:49 | `revisor-geral` | 4 | APROVADO | a3dd2c8e94eb717a7 |
| 2026-10-22 11:22:16 | 2026-10-22 11:23:51 | `test-engineer` | 4 | APROVADO | a037272210a782b33 |
| 2026-10-22 11:22:25 | 2026-10-22 11:24:02 | `conformidade-reviewer` | 4 | APROVADO | af228ef4fd5296700 |
| 2026-10-22 11:22:30 | 2026-10-22 11:24:07 | `llm-integrator` | 4 | APROVADO | a26a7f4939f531e00 |
