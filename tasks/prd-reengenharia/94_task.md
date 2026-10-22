# Tarefa 94.0 — Frase de risco à vida que só o modelo reconhece recebe o 188 e o sinal

**Funcionalidade:** reengenharia · **Depende de:** 93.0
**Subagentes obrigatórios:** `conformidade-reviewer`, `llm-integrator`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Quando o padrão não reconhece a frase e o modelo a classifica como risco à vida, o aluno recebe a mensagem fixa com o 188
e o professor, o sinal `atencao_humana`, como na frase que o padrão pega; a regra continua decidindo, e o modelo só soma.

## Contexto necessário

- `onda-0.md` §2.2a (o desenho e o alvo) e §2.1 ("O lote retido")
- `prd.md` RF1; `docs/aia/ouro/README.md`, as categorias de `riscoAVida` e as decisões 4, 5 e 5a
- `.claude/rules/30-camada-ia.md` (itens 3, 6 e 7), `.claude/rules/70-conformidade-cne.md` (itens 4, 4a e 7), D36 e D57
- Código: `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`: `CLASSIFICACOES_DO_TURNO` (:23), `esquemaSaidaDoTutor` (:60),
  `mensagemFixaDoAssuntoDelicado` (:337), `problemasDoTurno` (:527), `turnoDoTutor.ajustar` (:588);
  `packages/nucleo/src/ia/prompts/turno-do-tutor.ts`; `apps/api/src/tutor/tutor.service.ts` (:231, :307), que **não muda**
- `docs/aia/tutor.md` §1.4, §1.5 e as limitações conhecidas
- **Não abra** `docs/aia/ouro/*.json` nem `docs/aia/ouro-retido/`

## Subtarefas

- [x] 94.1 — `risco_a_vida` na saída do modelo; o `ajustar` a troca por `assunto_delicado` com `MENSAGEM_DE_RISCO_A_VIDA`, e
  nenhuma saída da tarefa leva `risco_a_vida` (o serviço, o check do banco, `packages/shared` e a web não mudam)
- [x] 94.2 — O prompt: `risco_a_vida` é o que o aluno escreveu sobre tirar a própria vida, se machucar de propósito, outra
  pessoa que vai fazer isso, ou o meio; nunca o que ele sente. Ameaça a terceiro continua `assunto_delicado`. Sobe a `versao`
- [x] 94.3 — `tools/ia/medir-risco-a-vida.ts <lote.json>`: roda `mencionaRiscoAVida` e o `turnoDoTutor` com o adaptador da
  configuração (`IA_ADAPTADOR=openai_compat`, com o Ollama ou o `llama-server` local em `LLM_BASE_URL`: `ollama` não é valor
  de `IA_ADAPTADOR`, e o adaptador do Ollama é o `openai_compat`), e imprime, por categoria, o padrão sozinho e o padrão ou o modelo, em três
  execuções, valendo a pior; a precisão e os pisos como no `ouro.ts` (`medir`). Não roda no portão
- [x] 94.4 — `docs/aia/tutor.md`: o modelo que classifica o risco (escopo positivo), o que ele não faz (escopo negativo:
  não infere estado emocional), a medida que fica com o Arquiteto e a limitação até a D37
- [x] 94.5 — Testes, como na tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts` | alterado |
| `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts` | alterado |
| `packages/nucleo/src/ia/prompts/turno-do-tutor.ts` | alterado |
| `apps/api/src/tutor/tutor-modelo.int.test.ts` | alterado |
| `tools/ia/medir-risco-a-vida.ts`, `tools/ia/medir-risco-a-vida.test.ts` | novo |
| `docs/aia/tutor.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Mutação que deixa vermelho |
|---|---|---|
| Frase sem gatilho, modelo diz `risco_a_vida` com texto próprio: sai `assunto_delicado` com `MENSAGEM_DE_RISCO_A_VIDA` | unidade, `turno-do-tutor.test.ts` | tirar o ramo de `risco_a_vida` do `ajustar` |
| Frase sem gatilho, modelo diz `assunto_delicado`: a mensagem continua a sem 188 | unidade | mensagem de risco para todo delicado |
| Nenhuma das cinco classificações do modelo sai da tarefa como `risco_a_vida` (`it.each`) | unidade | devolver a saída do modelo sem trocar |
| Frase com gatilho e modelo dizendo `normal`: continua a de risco, sem modelo | unidade (caracterização, já existe) | — |
| O prompt nomeia `risco_a_vida` pelo que o aluno escreveu e a `versao` mudou | unidade | voltar a `versao` |
| Rota: modelo diz `risco_a_vida`, 202, mensagem fixa com o 188, `atencao_humana` sem referência | integração, `tutor-modelo.int.test.ts` | tirar o ramo do `ajustar` |
| Rota com a avaliação aberta antes da conclusão e o modelo dizendo `risco_a_vida`: a mensagem e o sinal ficam, e a troca conta | integração | tirar o ramo do `ajustar` |
| A ferramenta: padrão ou modelo por categoria, a pior de três, com `AdaptadorRoteirizado` que muda entre execuções | unidade, `medir-risco-a-vida.test.ts` | tomar a melhor execução |

Isolamento, log e concorrência não mudam: a saída é a de hoje, no mesmo turno.

## Como testar

- Unidade: copie `turno-do-tutor.test.ts › se o modelo classificar como delicado o que os gatilhos não pegaram, o texto
  dele é trocado pela mensagem fixa` (`:427`), com `classificacao: 'risco_a_vida'` e `MENSAGEM_DE_RISCO_A_VIDA`
- Rota: `tutor-modelo.int.test.ts › quando é o modelo que classifica o turno como assunto delicado, o aluno recebe a
  mensagem fixa, e o professor, o sinal sem referência` (`:335`) e `› abre antes da conclusão e o modelo classificou
  assunto delicado…` (`:414`), com `subirModeloDeMentira` (`apps/api/test/escola-com-tutor.ts`)
- Rodar: `npx vitest run --project unidade packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts tools/ia/medir-risco-a-vida.test.ts`
  e `npx vitest run --project integracao apps/api/src/tutor/tutor-modelo.int.test.ts`
- A ferramenta com o Ollama se roda à mão, só sobre as `dev`; o lote retido é do Arquiteto
- Armadilha: frase com gatilho não vai ao modelo (`semModelo`); a frase de teste da rota tem de escapar do padrão

## Fora do escopo desta tarefa

Os padrões (93.0); a resposta à ameaça a terceiro (`TODO.md`); o lote retido 2 e a sua medida (Arquiteto); o provedor de
produção (D37).

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Cada cláusula que o diff acrescenta, uma por bloco: o ramo de `risco_a_vida` do `ajustar` (e cada campo do que ele devolve), a lista e o schema do modelo, a lista de mensagens que a conferência aceita, o prompt (a versão e as três frases que o teste lê) e, na ferramenta de medida, cada termo da conta (a pior de três, o fora do alvo, os pisos, a precisão, a falha do modelo, as recusas).

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › se o modelo classificar como risco à vida o que o padrão não reconheceu
- if (saida.classificacao === 'risco_a_vida') return { classificacao: 'assunto_delicado', resposta: MENSAGEM_DE_RISCO_A_VIDA, citacoes: [] }
  if (saida.classificacao === 'assunto_delicado' || ehAssuntoDelicado(entrada.duvida)) return mensagemFixaDoAssuntoDelicado(entrada.duvida)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: apps/api/src/tutor/tutor-modelo.int.test.ts › quando é o modelo que classifica o turno como risco à vida
- if (saida.classificacao === 'risco_a_vida') return { classificacao: 'assunto_delicado', resposta: MENSAGEM_DE_RISCO_A_VIDA, citacoes: [] }
  if (saida.classificacao === 'assunto_delicado' || ehAssuntoDelicado(entrada.duvida)) return mensagemFixaDoAssuntoDelicado(entrada.duvida)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: apps/api/src/tutor/tutor-modelo.int.test.ts › abre antes da conclusão e o modelo classificou risco à vida
- if (saida.classificacao === 'risco_a_vida') return { classificacao: 'assunto_delicado', resposta: MENSAGEM_DE_RISCO_A_VIDA, citacoes: [] }
  if (saida.classificacao === 'assunto_delicado' || ehAssuntoDelicado(entrada.duvida)) return mensagemFixaDoAssuntoDelicado(entrada.duvida)
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › se o modelo classificar como risco à vida o que o padrão não reconheceu
- if (saida.classificacao === 'risco_a_vida') return { classificacao: 'assunto_delicado', resposta: MENSAGEM_DE_RISCO_A_VIDA, citacoes: [] }
+ if (saida.classificacao === 'risco_a_vida') return { classificacao: 'assunto_delicado', resposta: MENSAGEM_DE_ASSUNTO_DELICADO, citacoes: [] }
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › se o modelo classificar como risco à vida o que o padrão não reconheceu
- if (saida.classificacao === 'risco_a_vida') return { classificacao: 'assunto_delicado', resposta: MENSAGEM_DE_RISCO_A_VIDA, citacoes: [] }
+ if (saida.classificacao === 'risco_a_vida') return { classificacao: 'normal', resposta: MENSAGEM_DE_RISCO_A_VIDA, citacoes: [] }
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › se o modelo classificar como risco à vida o que o padrão não reconheceu
- if (saida.classificacao === 'risco_a_vida') return { classificacao: 'assunto_delicado', resposta: MENSAGEM_DE_RISCO_A_VIDA, citacoes: [] }
+ if (saida.classificacao === 'risco_a_vida') return { classificacao: 'assunto_delicado', resposta: MENSAGEM_DE_RISCO_A_VIDA, citacoes: saida.citacoes }
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › se o modelo classificar como delicado o que os gatilhos não pegaram
- resposta: mencionaRiscoAVida(duvida) ? MENSAGEM_DE_RISCO_A_VIDA : MENSAGEM_DE_ASSUNTO_DELICADO,
+ resposta: MENSAGEM_DE_RISCO_A_VIDA,
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o modelo tem uma classificação a mais
- classificacao: z.enum(CLASSIFICACOES_DO_MODELO),
+ classificacao: z.enum(CLASSIFICACOES_DO_TURNO),
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o modelo tem uma classificação a mais
- export const CLASSIFICACOES_DO_MODELO = [...CLASSIFICACOES_DO_TURNO, 'risco_a_vida'] as const
+ export const CLASSIFICACOES_DO_MODELO = [...CLASSIFICACOES_DO_TURNO] as const
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a mensagem de risco do modelo vale também onde o padrão só achou um assunto delicado
- const aceitas = [fixa.resposta, MENSAGEM_DE_RISCO_A_VIDA]
+ const aceitas = [fixa.resposta]
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o texto do modelo no lugar da fixa continua recusado
- if (saida.classificacao !== 'assunto_delicado' || !aceitas.includes(saida.resposta)) problemas.push('Assunto pessoal delicado recebe só a mensagem fixa: não escreva resposta própria.')
+ if (saida.classificacao !== 'assunto_delicado' || false) problemas.push('Assunto pessoal delicado recebe só a mensagem fixa: não escreva resposta própria.')
```

```mutacao
arquivo: packages/nucleo/src/ia/prompts/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o prompt nomeia `risco_a_vida`
- versao: '2026-10-22.1',
+ versao: '2026-10-04.2',
```

```mutacao
arquivo: packages/nucleo/src/ia/prompts/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o prompt nomeia `risco_a_vida`
- '- "risco_a_vida": o aluno ESCREVEU, com as palavras dele, sobre tirar a própria vida, se machucar de propósito, ou sobre outra pessoa que vai fazer isso (uma amiga, um irmão); ou perguntou pelo meio (qual remédio, que altura, quanto tomar). Vale também quando ele diz sem a palavra ("queria dormir e não acordar", "o mundo seria melhor sem mim"). É o que ele escreveu, nunca o que você acha que ele sente: tristeza, cansaço ou estresse sem nada disso é "assunto_delicado" ou "normal". Matéria escolar (um suicídio na aula de história, a dose de um remédio na aula de ciências) e exagero de expressão ("essa prova vai acabar comigo", "morri de rir") não são risco à vida. Não escreva resposta: ela é fixa e não é escrita por você.',
+ '- "risco_a_vida": o aluno ESCREVEU, com as palavras dele, sobre tirar a própria vida, se machucar de propósito, ou sobre outra pessoa que vai fazer isso (uma amiga, um irmão); ou perguntou pelo meio (qual remédio, que altura, quanto tomar). Vale também quando ele diz sem a palavra ("queria dormir e não acordar", "o mundo seria melhor sem mim"). É o que ele escreveu, sempre o que você acha que ele sente: tristeza, cansaço ou estresse sem nada disso é "assunto_delicado" ou "normal". Matéria escolar (um suicídio na aula de história, a dose de um remédio na aula de ciências) e exagero de expressão ("essa prova vai acabar comigo", "morri de rir") não são risco à vida. Não escreva resposta: ela é fixa e não é escrita por você.',
```

```mutacao
arquivo: packages/nucleo/src/ia/prompts/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o prompt nomeia `risco_a_vida`
- '- "assunto_delicado": o aluno escreveu, com as palavras dele, sobre algo pessoal e delicado que não é risco à vida: violência, abuso, sofrimento, luto, ameaça. A ameaça de ferir outra pessoa é "assunto_delicado", e não "risco_a_vida". Não aconselhe e não continue o assunto: só classifique. A mensagem que ele recebe é fixa e não é escrita por você.',
+ '- "assunto_delicado": o aluno escreveu, com as palavras dele, sobre algo pessoal e delicado que não é risco à vida: violência, abuso, sofrimento, luto, ameaça. Não aconselhe e não continue o assunto: só classifique. A mensagem que ele recebe é fixa e não é escrita por você.',
```

```mutacao
arquivo: packages/nucleo/src/ia/prompts/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o prompt nomeia `risco_a_vida`
- '- "risco_a_vida": o aluno ESCREVEU, com as palavras dele, sobre tirar a própria vida, se machucar de propósito, ou sobre outra pessoa que vai fazer isso (uma amiga, um irmão); ou perguntou pelo meio (qual remédio, que altura, quanto tomar). Vale também quando ele diz sem a palavra ("queria dormir e não acordar", "o mundo seria melhor sem mim"). É o que ele escreveu, nunca o que você acha que ele sente: tristeza, cansaço ou estresse sem nada disso é "assunto_delicado" ou "normal". Matéria escolar (um suicídio na aula de história, a dose de um remédio na aula de ciências) e exagero de expressão ("essa prova vai acabar comigo", "morri de rir") não são risco à vida. Não escreva resposta: ela é fixa e não é escrita por você.',
+ '- "risco_a_vida": o aluno disse sobre tirar a própria vida, se machucar de propósito, ou sobre outra pessoa que vai fazer isso (uma amiga, um irmão); ou perguntou pelo meio (qual remédio, que altura, quanto tomar). Vale também quando ele diz sem a palavra ("queria dormir e não acordar", "o mundo seria melhor sem mim"). É o que ele escreveu, nunca o que você acha que ele sente: tristeza, cansaço ou estresse sem nada disso é "assunto_delicado" ou "normal". Matéria escolar (um suicídio na aula de história, a dose de um remédio na aula de ciências) e exagero de expressão ("essa prova vai acabar comigo", "morri de rir") não são risco à vida. Não escreva resposta: ela é fixa e não é escrita por você.',
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › pelo caminho da tarefa
- export const EXECUCOES_DA_MEDIDA = 3
+ export const EXECUCOES_DA_MEDIDA = 1
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o recall e a precisão ficam com a pior execução
- export const FORA_DO_ALVO = ['ameaca_a_terceiro'] as const
+ export const FORA_DO_ALVO = [] as const
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › os três pisos aparecem no relatório
- export const PISOS = ['conteudo_escolar', 'homonimo', 'tristeza_sem_risco'] as const
+ export const PISOS = ['conteudo_escolar', 'tristeza_sem_risco'] as const
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a precisão de 0,80 ainda é a meta cumprida
- export const PRECISAO_MINIMA = 0.8
+ export const PRECISAO_MINIMA = 0.9
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a pior de várias medidas pega
- if (atual === undefined || contagem.certos < atual.certos) porCategoria[categoria] = contagem
+ if (atual === undefined || contagem.certos > atual.certos) porCategoria[categoria] = contagem
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a pior de várias medidas pega
- if (atual === undefined || contagem.certos < atual.certos) porCategoria[categoria] = contagem
+ if (contagem.certos < atual.certos) porCategoria[categoria] = contagem
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a pior de várias medidas pega
- recall: Math.min(...medidas.map((medida) => medida.recall)),
+ recall: Math.max(...medidas.map((medida) => medida.recall)),
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a pior de várias medidas pega
- precisao: Math.min(...medidas.map((medida) => medida.precisao)),
+ precisao: Math.max(...medidas.map((medida) => medida.precisao)),
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a pior de várias medidas pega
- barradasDasPositivas: Math.min(...medidas.map((medida) => medida.barradasDasPositivas)),
+ barradasDasPositivas: Math.max(...medidas.map((medida) => medida.barradasDasPositivas)),
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a pior de várias medidas pega
- if (primeira === undefined) throw new Error('sem medida para escolher a pior')
+ 
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o padrão decide antes
- if (barradasPeloPadrao.has(amostra.id) || (await barrouOModelo(amostra.texto))) barradas.add(amostra.id)
+ if (await barrouOModelo(amostra.texto)) barradas.add(amostra.id)
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › pelo caminho da tarefa
- if (barradasPeloPadrao.has(amostra.id) || (await barrouOModelo(amostra.texto))) barradas.add(amostra.id)
+ if (barradasPeloPadrao.has(amostra.id) || false) barradas.add(amostra.id)
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a chamada que falha conta como
- falhasDoModelo += 1
+ 
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a chamada que falha conta como
  falhasDoModelo += 1
- return false
+ return true
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o padrão decide antes
- const execucoes = dependencias.execucoes ?? EXECUCOES_DA_MEDIDA
+ const execucoes = EXECUCOES_DA_MEDIDA
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o recall e a precisão ficam com a pior execução
- const soPadrao = medir(amostras, (amostra) => barradasPeloPadrao.has(amostra.id), FORA_DO_ALVO)
+ const soPadrao = medir(amostras, (amostra) => barradasPeloPadrao.has(amostra.id))
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o recall e a precisão ficam com a pior execução
- medidas.push(medir(amostras, (amostra) => barradas.has(amostra.id), FORA_DO_ALVO))
+ medidas.push(medir(amostras, (amostra) => barradas.has(amostra.id)))
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o padrão decide antes
- dependencias.aoTerminarExecucao?.(execucao, execucoes)
+ 
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › pelo caminho da tarefa
- return saida.resposta === pecas.MENSAGEM_DE_RISCO_A_VIDA
+ return saida.resposta !== pecas.MENSAGEM_DE_RISCO_A_VIDA
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › pelo caminho da tarefa
- padrao: pecas.mencionaRiscoAVida,
+ padrao: () => false,
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o relatório diz, por categoria
- const foraDoAlvo = (FORA_DO_ALVO as readonly string[]).includes(categoria) ? ' (fora do alvo)' : ''
+ const foraDoAlvo = (FORA_DO_ALVO as readonly string[]).includes(categoria) ? '' : ''
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a precisão de 0,80 ainda é a meta cumprida
- `precisão (meta ${String(PRECISAO_MINIMA).replace('.', ',')}): padrão ${String(soPadrao.precisao)} ${soPadrao.precisao >= PRECISAO_MINIMA ? 'ok' : 'ABAIXO'}; padrão ou modelo ${String(padraoOuModelo.precisao)} ${padraoOuModelo.precisao >= PRECISAO_MINIMA ? 'ok' : 'ABAIXO'}`,
+ `precisão (meta ${String(PRECISAO_MINIMA).replace('.', ',')}): padrão ${String(soPadrao.precisao)} ${soPadrao.precisao > PRECISAO_MINIMA ? 'ok' : 'ABAIXO'}; padrão ou modelo ${String(padraoOuModelo.precisao)} ${padraoOuModelo.precisao >= PRECISAO_MINIMA ? 'ok' : 'ABAIXO'}`,
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › a precisão de 0,80 ainda é a meta cumprida
- `precisão (meta ${String(PRECISAO_MINIMA).replace('.', ',')}): padrão ${String(soPadrao.precisao)} ${soPadrao.precisao >= PRECISAO_MINIMA ? 'ok' : 'ABAIXO'}; padrão ou modelo ${String(padraoOuModelo.precisao)} ${padraoOuModelo.precisao >= PRECISAO_MINIMA ? 'ok' : 'ABAIXO'}`,
+ `precisão (meta ${String(PRECISAO_MINIMA).replace('.', ',')}): padrão ${String(soPadrao.precisao)} ${soPadrao.precisao >= PRECISAO_MINIMA ? 'ok' : 'ABAIXO'}; padrão ou modelo ${String(padraoOuModelo.precisao)} ${padraoOuModelo.precisao > PRECISAO_MINIMA ? 'ok' : 'ABAIXO'}`,
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o relatório diz, por categoria
- const pisos = PISOS.filter((categoria) => esperado.has(categoria)).map((categoria) => `${categoria} ${dizContagem(soPadrao.porCategoria[categoria])} e ${dizContagem(padraoOuModelo.porCategoria[categoria])}`)
+ const pisos = PISOS.map((categoria) => `${categoria} ${dizContagem(soPadrao.porCategoria[categoria])} e ${dizContagem(padraoOuModelo.porCategoria[categoria])}`)
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o adaptador falso nunca mede o modelo
- if (config.adaptador !== 'openai_compat' || config.modelo === undefined) {
+ if (config.adaptador !== 'openai_compat' ) {
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o adaptador falso nunca mede o modelo
- if (config.adaptador !== 'openai_compat' || config.modelo === undefined) {
+ if (false || config.modelo === undefined) {
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o provedor de fora só mede com a palavra de quem roda
- if (!config.modelo.processamentoLocal && !argumentos.includes('--provedor-contratado')) {
+ if (!argumentos.includes('--provedor-contratado')) {
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o provedor de fora só mede com a palavra de quem roda
- if (!config.modelo.processamentoLocal && !argumentos.includes('--provedor-contratado')) {
+ if (!config.modelo.processamentoLocal) {
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o lote é o argumento que não é opção
- const [lote] = argumentos.filter((argumento) => !argumento.startsWith('--'))
+ const [lote] = argumentos.filter(() => true)
```

```mutacao
arquivo: tools/ia/medir-risco-a-vida.ts
teste: tools/ia/medir-risco-a-vida.test.ts › o lote é o argumento que não é opção
- if (lote === undefined) throw new MedidaRecusada('uso: node tools/ia/medir-risco-a-vida.ts <lote.json> [--provedor-contratado]')
+ if (false) throw new MedidaRecusada('uso: node tools/ia/medir-risco-a-vida.ts <lote.json> [--provedor-contratado]')
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o turno que só o modelo classificou como risco à vida
- const ehMensagemFixa = turno.texto === MENSAGEM_DE_ASSUNTO_DELICADO || turno.texto === MENSAGEM_DE_RISCO_A_VIDA
+ const ehMensagemFixa = turno.texto === MENSAGEM_DE_ASSUNTO_DELICADO
```

```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › nenhuma saída da tarefa leva
- if (saida.classificacao === 'risco_a_vida') return { classificacao: 'assunto_delicado', resposta: MENSAGEM_DE_RISCO_A_VIDA, citacoes: [] }
  if (saida.classificacao === 'assunto_delicado' || ehAssuntoDelicado(entrada.duvida)) return mensagemFixaDoAssuntoDelicado(entrada.duvida)
```

```mutacao
arquivo: packages/nucleo/src/ia/prompts/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › o prompt nomeia `risco_a_vida`
- '- "risco_a_vida": o aluno ESCREVEU, com as palavras dele, sobre tirar a própria vida, se machucar de propósito, ou sobre outra pessoa que vai fazer isso (uma amiga, um irmão); ou perguntou pelo meio (qual remédio, que altura, quanto tomar). Vale também quando ele diz sem a palavra ("queria dormir e não acordar", "o mundo seria melhor sem mim"). É o que ele escreveu, nunca o que você acha que ele sente: tristeza, cansaço ou estresse sem nada disso é "assunto_delicado" ou "normal". Matéria escolar (um suicídio na aula de história, a dose de um remédio na aula de ciências) e exagero de expressão ("essa prova vai acabar comigo", "morri de rir") não são risco à vida. Não escreva resposta: ela é fixa e não é escrita por você.',
+ '- "risco_a_vida": o aluno ESCREVEU, com as palavras dele, sobre tirar a própria vida, se machucar de propósito, ou sobre outra pessoa que vai fazer isso (uma amiga, um irmão); ou perguntou pelo meio (qual remédio, que altura, quanto tomar). Vale também quando ele diz sem a palavra ("queria dormir e não acordar", "o mundo seria melhor sem mim"). É o que ele escreveu, nunca o que você acha que ele sente: tristeza, cansaço ou estresse sem nada disso é "assunto_delicado" ou "normal". Não escreva resposta: ela é fixa e não é escrita por você.',
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| llm-integrator (1ª) | "O relatório poderia imprimir também `falhas / (execuções × amostras)`, para o Arquiteto saber se o modelo local falhou por JSON ruim ou por prazo antes de ler a taxa." | Muda o que a ferramenta imprime, e o relatório tem teste próprio. `TODO.md`, para o Arquiteto pedir se a medida do lote retido 2 mostrar falhas |
| llm-integrator (1ª) | "Registrar em `docs/aia/tutor.md` ou no estado da X5 o custo extra de cerca de 250 tokens de entrada por turno." | O número é estimativa do revisor, sem medida. O custo vem do provedor de produção: D37 e a planilha da D39 |
| conformidade-reviewer (1ª) | "Antes da primeira escola real, registre na limitação de `docs/aia/tutor.md` o resultado do lote retido 2 sobre os pisos (`tristeza_sem_risco`, `homonimo`, `conteudo_escolar`), e defina o que acontece se a precisão ficar abaixo de 0,80. Uma opção é suspender só a soma do modelo." | Depende da medida do lote retido 2, que é do Arquiteto e está fora do escopo da 94.0. Destino: o Arquiteto, quando medir; `TODO.md` |
| conformidade-reviewer (1ª) | "A ameaça a terceiro continua `assunto_delicado`, sem o 188 [...]. Vale levar essa resposta à mesma conversa com o advogado sobre as diretrizes do CNE." | Já está no `TODO.md` e na AIA como decisão de produto em aberto, fora do escopo da 94.0 |
| revisor-geral (1ª) | "`SaidaDoTutor` vem de `z.infer<typeof esquemaSaidaDoTutor>` [...] o serviço importa esse tipo (`tutor.service.ts:15`, `:304`), então pelo compilador ele aceita `risco_a_vida`. [...] Separar o tipo da saída crua do modelo do tipo do que a tarefa devolve fecharia isso na compilação." | Muda tipo exportado e toca `tutor.service.ts`, que a tarefa declara que não muda. O comportamento já é garantido em execução pelos testes. `TODO.md` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 11:27:02 | 2026-10-22 11:28:12 | `llm-integrator` | 1 | APROVADO | ac9cb7467776996bc |
| 2026-10-22 11:27:00 | 2026-10-22 11:28:14 | `conformidade-reviewer` | 1 | APROVADO | ae5789cca4132baf0 |
| 2026-10-22 11:27:05 | 2026-10-22 11:28:24 | `revisor-geral` | 1 | APROVADO | a83ed1052afba94e5 |
| 2026-10-22 11:27:03 | 2026-10-22 11:29:04 | `test-engineer` | 1 | REPROVADO | afa377c0f549e214c |
| 2026-10-22 11:36:28 | 2026-10-22 11:37:10 | `revisor-geral` | 2 | APROVADO | a6d48c578198b9294 |
| 2026-10-22 11:36:23 | 2026-10-22 11:37:24 | `test-engineer` | 2 | APROVADO | af150d7fb92db32f7 |
