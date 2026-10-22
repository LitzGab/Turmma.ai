# Tarefa 48.0 — Provedor lento, 429 ou fora falha rápido, com orçamento

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`, `llm-integrator`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O adaptador do provedor de IA passa a ser decorado com o `cockatiel` (padrão de mercado, D81): prazo por perfil,
uma repetição só no que não cobrou, e disjuntor por provedor, modelo e perfil. Provedor lento, 429 ou fora não derruba a
aula, e o aluno nunca vê erro cru (RF19, a parte da X5; regra 80.4).

## Contexto necessário

- `onda-3c.md` "T10 — o provedor de IA", o parágrafo **48.0**, e o §3 ("Provedor lento", "Chamada lenta", "429 e saída
  inválida", "Provedor fora", "Configuração"); `prd.md` RF19 e §11 (tokens por minuto e a degradação, 49.0, são X6)
- Regras 30 (a porta, o perfil, o orçamento) e 80.4, 80.5 (o disjuntor em memória é saúde local, exceção declarada)
- `packages/nucleo/src/ia/provedor.ts:270` (`criarProvedorDeIa`, onde o decorador entra) e
  `adaptador-openai-compat.ts:144` (`pedirComRecuo`, que sai)
- `packages/nucleo/src/config/config-ia.ts:81-99` (`LLM_TIMEOUT_MS`, `IA_LATENCIA_FALSA_MS` e os invariantes)
- O orçamento da `onda-3c.md` conta a reserva de 8 s da 49.0: sem ela, vale o prazo do perfil, abaixo do corte da execução

## Subtarefas

- [x] 48.1 — Caracterização, num commit antes: o recuo de hoje em 429 e 5xx, e o `IA_TEMPO_ESGOTADO` no prazo _(já no HEAD `84ef3df`, sem commit à parte: ver Divergências)_
- [x] 48.2 — `cockatiel` em versão exata nas `dependencies` de `packages/nucleo` (`npm view cockatiel version`)
- [x] 48.3 — `adaptador-resiliente.ts`: `wrap(timeout, disjuntor, retry)`, a repetição só em 429 e conexão recusada; `pedirComRecuo` sai
- [x] 48.4 — `LLM_TIMEOUT_MS_RAPIDO` (20 s) e `LLM_TIMEOUT_MS_PADRAO` (60 s), com os invariantes por perfil no `config-ia.ts`, no `.env.example` e no `infra/compose.yml`
- [x] 48.5 — O disjuntor por provedor, modelo e perfil: abre com 5 falhas (5xx, timeout, conexão recusada; no `rapido`, a chamada acima de 10 s), meio-abre em 30 s
- [x] 48.6 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ia/adaptador-resiliente.ts`, `adaptador-resiliente.test.ts` | novo |
| `packages/nucleo/src/ia/provedor.ts`, `provedor.test.ts`, `adaptador-openai-compat.ts`, `adaptador-openai-compat.test.ts`, `erros.ts` | alterado |
| `packages/nucleo/src/config/config-ia.ts`, `config-ia.test.ts` | alterado |
| `packages/nucleo/package.json`, `package-lock.json` | alterado |
| `.env.example`, `infra/compose.yml`, `infra/carga.env`, `apps/api/src/config.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| Servidor falso além do prazo do perfil → `IA_TEMPO_ESGOTADO`, um `fetch`, a troca conta | unidade | repetir o timeout |
| 5xx → um `fetch`, sem repetição | unidade | repetir o 5xx (pode ter cobrado) |
| 429 → uma repetição com jitter; com `Retry-After` além do prazo, nenhuma | unidade | repetir além do prazo |
| Cinco 429 ou cinco `IA_SAIDA_INVALIDA` não abrem o disjuntor | unidade | contar 429 |
| Cinco recusas abrem; a sexta sai sem `fetch`, com o erro tipado; o relógio falso meio-abre em 30 s | unidade | tirar o disjuntor |
| O disjuntor do `padrao` aberto não fecha o `rapido` (o Tutor não cai com as ferramentas) | unidade | chave sem o perfil |
| `rapido` entre 10 s e o prazo: vale e conta como lenta; no `padrao`, 50 s não contam | unidade | a lenta em todo perfil |
| O prazo cobre a chamada e a repetição: o sinal aborta o `retry` | unidade | timeout dentro do retry |
| `IA_LATENCIA_FALSA_MS` igual ou acima do prazo do perfil, ou prazo fora da faixa → a subida recusa | unidade | invariante só no global |
| A saída que chega ao aluno no erro é a mensagem tipada, nunca o corpo do provedor | unidade | repassar o erro cru |

## Como testar

- O provedor: `subirServidorLlamaFalso` e `respostaDoChat` (`packages/nucleo/src/ia/__fixtures__/servidor-llama-falso.ts`),
  com o roteiro por número de pedido; copie `adaptador-openai-compat.test.ts › chama só chat/completions, com o modelo do
  perfil da tarefa, …` para montar o adaptador.
- O prazo e o orçamento: `provedor.test.ts › orçamento esgotado: erro tipado com a espera sugerida, e o modelo não é chamado`.
- A configuração: `config-ia.test.ts › o recuo da repetição em 429 e 5xx é configurável e precisa caber no prazo da
  chamada` e `› a latência simulada do adaptador falso …`.
- O relógio: `vi.useFakeTimers()` para os 30 s do meio-aberto; o `cockatiel` aceita o relógio pelo `setTimeout` global.
- Isolado: `npx vitest run --project unidade packages/nucleo/src/ia packages/nucleo/src/config`.
- Armadilha: o disjuntor é em memória por réplica, de propósito (saúde local); escreva a exceção à 80.5 em "Divergências
  resolvidas" com a seção da onda. Nenhum teste chama provedor pago (regra 30).

## Fora do escopo desta tarefa

Tokens por minuto, o modelo menor e as métricas de IA (49.0, X6); a IA no worker (47.0, X6).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| 48.1 não tem commit à parte: a caracterização é a que o HEAD (`84ef3df`) já tem, em `adaptador-openai-compat.test.ts` (« erro 500 duas vezes: uma repetição depois do recuo », « erro %i e depois resposta boa », « servidor que demora além do prazo ») | Esses três casos já prendem o recuo de hoje em 429 e 5xx e o `IA_TEMPO_ESGOTADO` no prazo; um commit só de teste não passaria no hook (código sem `(tarefa N.0)` e sem revisores da tarefa), e o mesmo teste foi reescrito aqui para o novo contrato | `onda-3c.md` T10 (« Como a 48.0 ficou ») |
| `IA_LATENCIA_FALSA_MS` continua **uma** variável, validada contra o **menor** dos três prazos; a `IA_LATENCIA_FALSA_MS_PADRAO` e o seu invariante contra `LLM_TIMEOUT_MS_PADRAO` nascem na 47.0 | A variável por perfil é do cenário de carga (`FASE=sala`, 47.0, X6); aqui o adaptador falso espera o mesmo em todo perfil, e a latência abaixo do menor prazo é o que o cenário `rapido` 6 s / `padrao` 50 s já respeita | `onda-3c.md` T10 (« A latência falsa »), `onda-3a.md` (« Latência e carga », 47.0) |
| O recuo (`LLM_RECUO_MS`) e a latência falsa são conferidos contra o **menor** prazo, e `IA_EXECUCAO_TIMEOUT_MS` contra o **maior**, em uma checagem cada (não uma por perfil); os três textos de `MOTIVO_*` passam a citar as três variáveis | Uma checagem por perfil emitiria três motivos para a mesma variável, e o menor/maior diz o mesmo; um caso por variável de prazo prova cada termo | `onda-3c.md` T10 (« A latência falsa » e « Configuração ») |
| `LLM_RECUO_MS` sobe de `modelo.recuoMs` para `ConfiguracaoDeIa.recuoMs`, e o `ProvedorDeIa` perde o `timeoutMs` | O recuo e o prazo são da política de resiliência, que decora o adaptador de qualquer origem (inclusive o falso); o adaptador do provedor não repete mais, e não os lê | `onda-3c.md` T10 (« O prazo por perfil » e « A repetição ») |
| O `Retry-After` do 429 vale quando é **menor que o prazo do perfil**: a repetição espera o que o provedor pediu; do contrário nenhuma repetição, e a espera vai em `tenteDeNovoEmSegundos` | A ordem da spec diz « nenhuma com `Retry-After` além do prazo »; antes valia « maior que o recuo », que mandava para quem chamou qualquer pedido de mais de 500 ms | `onda-3c.md` T10 (« A repetição ») e § 3 (« 429 e saída inválida ») |
| O adaptador do provedor lança `ErroDoProvedor` (um `ErroDeIa` com `falha`: `limite`, `recusada`, `servidor`, `tempo` ou `rejeitada`), e o decorador devolve sempre um `ErroDeIa` simples | A repetição (só 429 e conexão recusada) e o disjuntor (5xx, timeout e recusada; não 429 nem outro 4xx) precisam saber o que aconteceu, e o código de erro do contrato (`IA_INDISPONIVEL`) não diz | `onda-3c.md` T10 (« A repetição » e « O disjuntor ») |
| O prazo que acaba durante a espera da repetição dá `IA_TEMPO_ESGOTADO`; antes dava `IA_INDISPONIVEL` com a espera sugerida | O prazo agora é o do decorador (outermost) e cobre a chamada e a repetição: o que o aluno viu foi o tempo que passou do prazo. O 429 com `Retry-After` além do prazo não repete, e continua dando `IA_INDISPONIVEL` com a espera | `onda-3c.md` T10 (« A ordem ») e § 3 (« Provedor lento ») |
| O disjuntor é por **modelo e perfil**; o provedor não entra na chave | Cada decorador é de um provedor só (`criarProvedorDeIa` monta um), e o mapa vive nele: o « por provedor » da spec é por construção | `onda-3c.md` T10 (« O disjuntor ») |
| O disjuntor é em memória, por réplica, de propósito: **exceção à regra 80, item 5** | É saúde local do provedor vista por cada réplica; estado compartilhado por Redis faria o Redis fora derrubar a IA. Cada réplica abre sozinha com 5 falhas suas | `onda-3c.md` T10 (« O disjuntor »: « exceção aceita à 80.5, no ADR da onda 6 ») |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › além do prazo do perfil
- const criada = wrap(timeout(prazoMs, TimeoutStrategy.Aggressive), disjuntor, repeticao)
+ const criada = wrap(disjuntor, repeticao)
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › o prazo cobre a chamada e a repetição
- const criada = wrap(timeout(prazoMs, TimeoutStrategy.Aggressive), disjuntor, repeticao)
+ const criada = wrap(disjuntor, repeticao, timeout(prazoMs, TimeoutStrategy.Aggressive))
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › cinco falhas abrem
- const criada = wrap(timeout(prazoMs, TimeoutStrategy.Aggressive), disjuntor, repeticao)
+ const criada = wrap(timeout(prazoMs, TimeoutStrategy.Aggressive), repeticao)
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › cada perfil tem o seu prazo
- const prazoMs = this.politica.prazosMs[perfil]
+ const prazoMs = this.politica.prazosMs.padrao
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › é um disjuntor por perfil
- const chave = `${this.interno.modeloDoPerfil(perfil)}|${perfil}`
+ const chave = `${this.interno.modeloDoPerfil(perfil)}`
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › é um disjuntor por modelo
- const chave = `${this.interno.modeloDoPerfil(perfil)}|${perfil}`
+ const chave = `${perfil}`
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › 5xx: uma chamada só
- if (falha === 'recusada') return true
+ if (falha === 'recusada' || falha === 'servidor') return true
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › timeout: não se repete
- if (falha === 'recusada') return true
+ if (falha === 'recusada' || falha === 'tempo') return true
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › outro 4xx: uma chamada só
- if (falha === 'recusada') return true
+ if (falha === 'recusada' || falha === 'rejeitada') return true
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › conexão recusada: uma repetição
- if (falha === 'recusada') return true
+ if (falha === 'recusada') return false
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › 5xx: uma chamada só
- return falha === 'limite' && (sugerida === undefined || sugerida < prazoMs)
+ return sugerida === undefined || sugerida < prazoMs
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › 429: uma repetição
- return falha === 'limite' && (sugerida === undefined || sugerida < prazoMs)
+ return falha === 'limite' && sugerida < prazoMs
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › Retry-After além do prazo
- return falha === 'limite' && (sugerida === undefined || sugerida < prazoMs)
+ return falha === 'limite'
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › Retry-After dentro do prazo
- return sugerida ?? this.politica.recuoMs * (0.5 + 0.5 * this.politica.aleatorio())
+ return this.politica.recuoMs * (0.5 + 0.5 * this.politica.aleatorio())
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › o jitter
- return sugerida ?? this.politica.recuoMs * (0.5 + 0.5 * this.politica.aleatorio())
+ return sugerida ?? this.politica.recuoMs
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › o jitter
- return sugerida ?? this.politica.recuoMs * (0.5 + 0.5 * this.politica.aleatorio())
+ return sugerida ?? this.politica.recuoMs * (1 + 0.5 * this.politica.aleatorio())
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › 429 duas vezes
- maxAttempts: 1,
+ maxAttempts: 2,
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › Retry-After dentro do prazo
- return erro instanceof ErroDoProvedor && erro.tenteDeNovoEmSegundos !== undefined ? erro.tenteDeNovoEmSegundos * 1_000 : undefined
+ return erro instanceof ErroDoProvedor && erro.tenteDeNovoEmSegundos !== undefined ? erro.tenteDeNovoEmSegundos : undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › 429: uma repetição
- return erro instanceof ErroDoProvedor && erro.tenteDeNovoEmSegundos !== undefined ? erro.tenteDeNovoEmSegundos * 1_000 : undefined
+ return erro instanceof ErroDoProvedor ? erro.tenteDeNovoEmSegundos! * 1_000 : undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › cinco falhas abrem
- const FALHAS_PARA_ABRIR_O_DISJUNTOR = 5
+ const FALHAS_PARA_ABRIR_O_DISJUNTOR = 6
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › cinco falhas abrem
- const FALHAS_PARA_ABRIR_O_DISJUNTOR = 5
+ const FALHAS_PARA_ABRIR_O_DISJUNTOR = 4
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › meio-abre
- const MEIO_ABRE_O_DISJUNTOR_EM_MS = 30_000
+ const MEIO_ABRE_O_DISJUNTOR_EM_MS = 60_000
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › meio-abre
- const MEIO_ABRE_O_DISJUNTOR_EM_MS = 30_000
+ const MEIO_ABRE_O_DISJUNTOR_EM_MS = 15_000
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › entre metade do prazo e o prazo
- handleWhen(pesaNoDisjuntor).orWhenResult((resultado) => (resultado as Tentativa).lenta),
+ handleWhen(pesaNoDisjuntor),
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › a ferramenta normal de 50 s
- return { resposta, lenta: perfil === PERFIL_COM_CHAMADA_LENTA && Date.now() - inicio > this.politica.prazosMs[perfil] / 2 }
+ return { resposta, lenta: Date.now() - inicio > this.politica.prazosMs[perfil] / 2 }
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › entre metade do prazo e o prazo
- return { resposta, lenta: perfil === PERFIL_COM_CHAMADA_LENTA && Date.now() - inicio > this.politica.prazosMs[perfil] / 2 }
+ return { resposta, lenta: perfil === PERFIL_COM_CHAMADA_LENTA && Date.now() - inicio > this.politica.prazosMs[perfil] }
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › exatamente a metade do prazo
- return { resposta, lenta: perfil === PERFIL_COM_CHAMADA_LENTA && Date.now() - inicio > this.politica.prazosMs[perfil] / 2 }
+ return { resposta, lenta: perfil === PERFIL_COM_CHAMADA_LENTA && Date.now() - inicio >= this.politica.prazosMs[perfil] / 2 }
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › cinco falhas abrem
- return falha === 'servidor' || falha === 'recusada' || falha === 'tempo'
+ return falha === 'recusada' || falha === 'tempo'
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › conexão recusada pesa
- return falha === 'servidor' || falha === 'recusada' || falha === 'tempo'
+ return falha === 'servidor' || falha === 'tempo'
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › timeout pesa
- return falha === 'servidor' || falha === 'recusada' || falha === 'tempo'
+ return falha === 'servidor' || falha === 'recusada'
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › cinco 429 não abrem
- return falha === 'servidor' || falha === 'recusada' || falha === 'tempo'
+ return falha === 'servidor' || falha === 'recusada' || falha === 'tempo' || falha === 'limite'
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › outro 4xx e erro de IA
- return falha === 'servidor' || falha === 'recusada' || falha === 'tempo'
+ return falha === 'servidor' || falha === 'recusada' || falha === 'tempo' || falha === 'rejeitada'
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › pesa como falha de servidor
- if (erro instanceof ErroDeIa && erro.codigoDeIa === 'IA_INDISPONIVEL') return 'servidor'
+ if (erro instanceof ErroDeIa && erro.codigoDeIa === 'IA_INDISPONIVEL') return undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › pesa como timeout
- if (erro instanceof ErroDeIa && erro.codigoDeIa === 'IA_TEMPO_ESGOTADO') return 'tempo'
+ if (erro instanceof ErroDeIa && erro.codigoDeIa === 'IA_TEMPO_ESGOTADO') return undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › outro 4xx e erro de IA
- if (erro instanceof ErroDeIa && erro.codigoDeIa === 'IA_TEMPO_ESGOTADO') return 'tempo'
- return undefined
+ if (erro instanceof ErroDeIa && erro.codigoDeIa === 'IA_TEMPO_ESGOTADO') return 'tempo'
+ if (erro instanceof ErroDeIa) return 'servidor'
+ return undefined
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › o prazo que acaba durante a espera
- if (sinal.aborted) throw new ChamadaCancelada()
+ 
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › sinal que já chegou cancelado
- if (sinal.aborted) throw new ChamadaCancelada()
+ 
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › quem chamou cancela
- if (chamada.sinal.aborted) throw new ChamadaCancelada()
+ 
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › saem como erro tipado
- if (erro instanceof ErroDoProvedor) return new ErroDeIa(erro.codigoDeIa, erro.tenteDeNovoEmSegundos)
+ 
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › o erro de dentro leva a espera sugerida
- if (erro instanceof ErroDoProvedor) return new ErroDeIa(erro.codigoDeIa, erro.tenteDeNovoEmSegundos)
+ if (erro instanceof ErroDoProvedor) return new ErroDeIa(erro.codigoDeIa)
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › saem como erro tipado
- if (erro instanceof BrokenCircuitError) return new ErroDeIa('IA_INDISPONIVEL')
+ 
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › saem como erro tipado
- if (erro instanceof TaskCancelledError) return new ErroDeIa('IA_TEMPO_ESGOTADO')
+ 
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › a resposta boa passa inteira
- this.origem = interno.origem
+ this.origem = 'falso'
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › a resposta boa passa inteira
- this.envio = interno.envio
+ this.envio = { envioExterno: false, provedorId: null }
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › a resposta boa passa inteira
- return this.interno.modeloDoPerfil(perfil)
+ return 'modelo-fixo'
```

```mutacao
arquivo: packages/nucleo/src/ia/erros.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › timeout: não se repete
- super(falha === 'tempo' ? 'IA_TEMPO_ESGOTADO' : 'IA_INDISPONIVEL', tenteDeNovoEmSegundos)
+ super('IA_INDISPONIVEL', tenteDeNovoEmSegundos)
```

```mutacao
arquivo: packages/nucleo/src/ia/erros.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › 429 com Retry-After além do prazo
- super(falha === 'tempo' ? 'IA_TEMPO_ESGOTADO' : 'IA_INDISPONIVEL', tenteDeNovoEmSegundos)
+ super(falha === 'tempo' ? 'IA_TEMPO_ESGOTADO' : 'IA_INDISPONIVEL')
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-openai-compat.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › 429 é limite
- if (resposta.status === 429) throw new ErroDoProvedor('limite', esperaSugerida(resposta))
+ if (resposta.status === 429) throw new ErroDoProvedor('servidor', esperaSugerida(resposta))
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-openai-compat.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › 429 é limite
- if (resposta.status === 429) throw new ErroDoProvedor('limite', esperaSugerida(resposta))
+ if (resposta.status === 429) throw new ErroDoProvedor('limite')
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-openai-compat.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › 429 é limite
- throw new ErroDoProvedor(resposta.status >= 500 ? 'servidor' : 'rejeitada')
+ throw new ErroDoProvedor('servidor')
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-openai-compat.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › 429 é limite
- throw new ErroDoProvedor(resposta.status >= 500 ? 'servidor' : 'rejeitada')
+ throw new ErroDoProvedor(resposta.status > 500 ? 'servidor' : 'rejeitada')
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-openai-compat.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › cinco respostas 400
- throw new ErroDoProvedor(resposta.status >= 500 ? 'servidor' : 'rejeitada')
+ throw new ErroDoProvedor('servidor')
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-openai-compat.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › a conexão recusada é recusada
- throw new ErroDoProvedor(sinal.aborted ? 'tempo' : conexaoRecusada(erro) ? 'recusada' : 'servidor')
+ throw new ErroDoProvedor(sinal.aborted ? 'tempo' : 'servidor')
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-openai-compat.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › a conexão recusada é recusada
- return typeof causa === 'object' && causa !== null && 'code' in causa && causa.code === 'ECONNREFUSED'
+ return typeof causa === 'object' && causa !== null && 'code' in causa && causa.code === 'ECONNRESET'
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-openai-compat.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › o sinal cancelado com a resposta em curso
- throw new ErroDoProvedor(sinal.aborted ? 'tempo' : conexaoRecusada(erro) ? 'recusada' : 'servidor')
+ throw new ErroDoProvedor(conexaoRecusada(erro) ? 'recusada' : 'servidor')
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-openai-compat.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › o sinal cancelado com a resposta em curso
- throw new ErroDoProvedor(chamada.sinal.aborted ? 'tempo' : 'servidor')
+ throw new ErroDoProvedor('servidor')
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-openai-compat.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › resposta 200 que não é do padrão, ou que nem é JSON
- if (!lido.success) throw new ErroDoProvedor('servidor')
+ 
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o recuo da repetição
- const prazos = [valores.LLM_TIMEOUT_MS, valores.LLM_TIMEOUT_MS_RAPIDO, valores.LLM_TIMEOUT_MS_PADRAO]
+ const prazos = [valores.LLM_TIMEOUT_MS_RAPIDO, valores.LLM_TIMEOUT_MS_PADRAO]
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o recuo da repetição
- const prazos = [valores.LLM_TIMEOUT_MS, valores.LLM_TIMEOUT_MS_RAPIDO, valores.LLM_TIMEOUT_MS_PADRAO]
+ const prazos = [valores.LLM_TIMEOUT_MS, valores.LLM_TIMEOUT_MS_PADRAO]
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o recuo da repetição
- const prazos = [valores.LLM_TIMEOUT_MS, valores.LLM_TIMEOUT_MS_RAPIDO, valores.LLM_TIMEOUT_MS_PADRAO]
+ const prazos = [valores.LLM_TIMEOUT_MS, valores.LLM_TIMEOUT_MS_RAPIDO]
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › a latência simulada cabe no prazo de cada perfil
- const menorPrazo = Math.min(...prazos)
+ const menorPrazo = valores.LLM_TIMEOUT_MS
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o recuo da repetição
- if (valores.LLM_RECUO_MS >= menorPrazo) problema('LLM_RECUO_MS', MOTIVO_RECUO_MAIOR_QUE_O_PRAZO)
+ if (valores.LLM_RECUO_MS > menorPrazo) problema('LLM_RECUO_MS', MOTIVO_RECUO_MAIOR_QUE_O_PRAZO)
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o prazo da execução precisa ser maior
- if (valores.IA_EXECUCAO_TIMEOUT_MS <= Math.max(...prazos)) problema('IA_EXECUCAO_TIMEOUT_MS', MOTIVO_EXECUCAO_MAIS_CURTA_QUE_A_CHAMADA)
+ if (valores.IA_EXECUCAO_TIMEOUT_MS < Math.max(...prazos)) problema('IA_EXECUCAO_TIMEOUT_MS', MOTIVO_EXECUCAO_MAIS_CURTA_QUE_A_CHAMADA)
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o prazo da execução precisa ser maior
- if (valores.IA_EXECUCAO_TIMEOUT_MS <= Math.max(...prazos)) problema('IA_EXECUCAO_TIMEOUT_MS', MOTIVO_EXECUCAO_MAIS_CURTA_QUE_A_CHAMADA)
+ if (valores.IA_EXECUCAO_TIMEOUT_MS <= valores.LLM_TIMEOUT_MS) problema('IA_EXECUCAO_TIMEOUT_MS', MOTIVO_EXECUCAO_MAIS_CURTA_QUE_A_CHAMADA)
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › a latência simulada cabe no prazo de cada perfil
- if (valores.IA_LATENCIA_FALSA_MS >= menorPrazo) problema('IA_LATENCIA_FALSA_MS', MOTIVO_LATENCIA_FALSA_MAIOR_QUE_O_PRAZO)
+ if (valores.IA_LATENCIA_FALSA_MS > menorPrazo) problema('IA_LATENCIA_FALSA_MS', MOTIVO_LATENCIA_FALSA_MAIOR_QUE_O_PRAZO)
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o prazo de cada perfil
- LLM_TIMEOUT_MS_RAPIDO: inteiro(1_000, 600_000, 20_000),
+ LLM_TIMEOUT_MS_RAPIDO: inteiro(1_000, 600_000, 10_000),
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o prazo de cada perfil
- LLM_TIMEOUT_MS_PADRAO: inteiro(1_000, 600_000, 60_000),
+ LLM_TIMEOUT_MS_PADRAO: inteiro(1_000, 600_000, 50_000),
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › recusa LLM_TIMEOUT_MS_RAPIDO="999"
- LLM_TIMEOUT_MS_RAPIDO: inteiro(1_000, 600_000, 20_000),
+ LLM_TIMEOUT_MS_RAPIDO: inteiro(0, 600_000, 20_000),
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › recusa LLM_TIMEOUT_MS_RAPIDO="600001"
- LLM_TIMEOUT_MS_RAPIDO: inteiro(1_000, 600_000, 20_000),
+ LLM_TIMEOUT_MS_RAPIDO: inteiro(1_000, 700_000, 20_000),
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › recusa LLM_TIMEOUT_MS_PADRAO="0"
- LLM_TIMEOUT_MS_PADRAO: inteiro(1_000, 600_000, 60_000),
+ LLM_TIMEOUT_MS_PADRAO: inteiro(0, 600_000, 60_000),
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › recusa LLM_TIMEOUT_MS_PADRAO="600001"
- LLM_TIMEOUT_MS_PADRAO: inteiro(1_000, 600_000, 60_000),
+ LLM_TIMEOUT_MS_PADRAO: inteiro(1_000, 700_000, 60_000),
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o prazo de cada perfil
- prazosMs: { rapido: valores.LLM_TIMEOUT_MS_RAPIDO, padrao: valores.LLM_TIMEOUT_MS_PADRAO, complexo: valores.LLM_TIMEOUT_MS, visao: valores.LLM_TIMEOUT_MS },
+ prazosMs: { rapido: valores.LLM_TIMEOUT_MS, padrao: valores.LLM_TIMEOUT_MS_PADRAO, complexo: valores.LLM_TIMEOUT_MS, visao: valores.LLM_TIMEOUT_MS },
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o prazo de cada perfil
- prazosMs: { rapido: valores.LLM_TIMEOUT_MS_RAPIDO, padrao: valores.LLM_TIMEOUT_MS_PADRAO, complexo: valores.LLM_TIMEOUT_MS, visao: valores.LLM_TIMEOUT_MS },
+ prazosMs: { rapido: valores.LLM_TIMEOUT_MS_RAPIDO, padrao: valores.LLM_TIMEOUT_MS, complexo: valores.LLM_TIMEOUT_MS, visao: valores.LLM_TIMEOUT_MS },
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o prazo de cada perfil
- prazosMs: { rapido: valores.LLM_TIMEOUT_MS_RAPIDO, padrao: valores.LLM_TIMEOUT_MS_PADRAO, complexo: valores.LLM_TIMEOUT_MS, visao: valores.LLM_TIMEOUT_MS },
+ prazosMs: { rapido: valores.LLM_TIMEOUT_MS_RAPIDO, padrao: valores.LLM_TIMEOUT_MS_PADRAO, complexo: valores.LLM_TIMEOUT_MS_PADRAO, visao: valores.LLM_TIMEOUT_MS },
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o prazo de cada perfil
- prazosMs: { rapido: valores.LLM_TIMEOUT_MS_RAPIDO, padrao: valores.LLM_TIMEOUT_MS_PADRAO, complexo: valores.LLM_TIMEOUT_MS, visao: valores.LLM_TIMEOUT_MS },
+ prazosMs: { rapido: valores.LLM_TIMEOUT_MS_RAPIDO, padrao: valores.LLM_TIMEOUT_MS_PADRAO, complexo: valores.LLM_TIMEOUT_MS, visao: valores.LLM_TIMEOUT_MS_RAPIDO },
```

```mutacao
arquivo: packages/nucleo/src/config/config-ia.ts
teste: packages/nucleo/src/config/config-ia.test.ts › o recuo da repetição
- recuoMs: valores.LLM_RECUO_MS,
+ recuoMs: 500,
```

```mutacao
arquivo: packages/nucleo/src/ia/provedor.ts
teste: packages/nucleo/src/ia/adaptador-openai-compat.test.ts › o sinal de quem chamou cancela
- const sinal = pedido.sinal ?? new AbortController().signal
+ const sinal = new AbortController().signal
```

```mutacao
arquivo: packages/nucleo/src/ia/provedor.ts
teste: packages/nucleo/src/ia/provedor.test.ts › o prazo é o do perfil da tarefa
- const adaptador = new AdaptadorResiliente(interno, { prazosMs: config.prazosMs, recuoMs: config.recuoMs, aleatorio: Math.random })
+ const adaptador = new AdaptadorResiliente(interno, { prazosMs: { ...config.prazosMs, rapido: config.prazosMs.padrao }, recuoMs: config.recuoMs, aleatorio: Math.random })
```

```mutacao
arquivo: packages/nucleo/src/ia/provedor.ts
teste: packages/nucleo/src/ia/provedor.test.ts › a repetição do 429 espera o recuo
- const adaptador = new AdaptadorResiliente(interno, { prazosMs: config.prazosMs, recuoMs: config.recuoMs, aleatorio: Math.random })
+ const adaptador = new AdaptadorResiliente(interno, { prazosMs: config.prazosMs, recuoMs: 0, aleatorio: Math.random })
```

```mutacao
arquivo: packages/nucleo/src/ia/provedor.ts
teste: packages/nucleo/src/ia/provedor.test.ts › a repetição do 429 espera o recuo
- const adaptador = new AdaptadorResiliente(interno, { prazosMs: config.prazosMs, recuoMs: config.recuoMs, aleatorio: Math.random })
+ const adaptador = new AdaptadorResiliente(interno, { prazosMs: config.prazosMs, recuoMs: config.recuoMs, aleatorio: () => 5 })
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › 429: uma repetição
- if (erro instanceof ErroDoProvedor) return erro.falha
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › quem chamou cancela
- const { resposta } = await this.resiliencia(perfil).execute((contexto) => this.tentar(chamada, contexto.signal), chamada.sinal)
+ const { resposta } = await this.resiliencia(perfil).execute((contexto) => this.tentar(chamada, contexto.signal))
```

```mutacao
arquivo: packages/nucleo/src/ia/adaptador-resiliente.ts
teste: packages/nucleo/src/ia/adaptador-resiliente.test.ts › cinco falhas abrem
- this.politicas.set(chave, criada)
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | Recusar na subida a `IA_LATENCIA_FALSA_MS` acima da metade do prazo do `rapido` (ou dizê-lo no `.env.example`) | 47.0: nela nasce a `IA_LATENCIA_FALSA_MS_PADRAO` com o invariante por perfil (`onda-3c.md` T10, "A latência falsa"). Muda comportamento da subida e o `.env.example` caduca todos os revisores |
| revisor-geral (1ª), infra-guardian (1ª), llm-integrator (1ª) | Log `ia.disjuntor.aberto` (modelo e perfil) no `onBreak`/`onReset` | 49.0: a métrica `ia.disjuntor.aberto{provedor,modelo,perfil}` e o alerta "Provedor de IA fora", com o parágrafo do runbook, estão na `onda-3c.md` T10 (« As métricas (C32) ») |
| revisor-geral (1ª) | `sinal` opcional em `ChamadaAoModelo` em vez de `pedido.sinal ?? new AbortController().signal` | Recusada: muda o contrato de `ChamadaAoModelo`, lido pelo decorador e pelo adaptador, e o sinal sempre presente simplifica os dois; a mutação em `provedor.ts` já prende a linha |
| infra-guardian (1ª) | No meio-aberto, o `ChamadaCancelada` (e o 429 e outro 4xx) conta como sucesso e fecha o disjuntor com o provedor ainda fora | `TODO.md` (linha escrita no commit da tarefa, com a 49.0 como dona do disjuntor): muda comportamento, pede teste e linha em "Divergências" |
| infra-guardian (1ª) | Cenário de carga « provedor recusando por limite no meio da aula » em `infra/test/carga.test.ts` | `TODO.md` (linha escrita no commit da tarefa), para a 47.0 ou a 49.0 |
| infra-guardian (1ª) | `IA_EXECUCAO_TIMEOUT_MS` > 2 × o maior prazo (o `ProvedorDeIa` faz até 2 tentativas) | 49.0: o orçamento de 2 tentativas × (prazo + 8 s) é dela (`onda-3c.md` T10, « O orçamento »); a regra já era assim antes da 48.0 |
| llm-integrator (1ª) | `Retry-After` próximo do prazo nasce sem tempo e acaba em `IA_TEMPO_ESGOTADO` | 49.0 (degradação e métricas de IA) |
| llm-integrator (1ª) | O limiar de chamada lenta é `prazo / 2`, e sobe junto com `LLM_TIMEOUT_MS_RAPIDO` | 49.0: fica dito no parágrafo do runbook do alerta |
| llm-integrator (1ª) | Registro do evento do disjuntor aberto | Igual à segunda linha desta tabela (49.0) |
| revisor-geral (2ª), test-engineer (2ª) | Os tetos de tempo real de `provedor.test.ts` (`< 1_100`, linhas 209 e 226) afrouxaram a prova; subir o `atrasoMs` do servidor falso do teste do Tutor (~3 000) ou escrever o teto em função do atraso e do recuo | Recusada: a regra segue presa fora do relógio real (o `codigoDeIa` `IA_TEMPO_ESGOTADO`, `› o jitter` e `› provedor além do prazo do perfil` com relógio falso, `servidor que demora além do prazo` contra `< 1_500`); estes dois só provam a ligação em `criarProvedorDeIa`, e o teto largo foi o que o `test-engineer` propôs na 1ª rodada |
| revisor-geral (2ª) | O comentário de `traduzir` afirma que a `ChamadaCancelada` "não chega" ao `traduzir`, sem teste que prenda isso | 49.0: ela volta a mexer em `adaptador-resiliente.ts` (disjuntor e métricas); o `ProvedorDeIa` acima já cobre qualquer erro que não seja `ErroDeIa` |

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
| 2026-10-22 17:16:44 | 2026-10-22 17:17:43 | `llm-integrator` | 1 | APROVADO | a6748be8daf405165 |
| 2026-10-22 17:16:50 | 2026-10-22 17:18:45 | `revisor-geral` | 1 | REPROVADO | a1b74f20c3b95dc54 |
| 2026-10-22 17:16:42 | 2026-10-22 17:19:02 | `infra-guardian` | 1 | APROVADO | ac3791c0a19430f23 |
| 2026-10-22 17:16:47 | 2026-10-22 17:19:26 | `test-engineer` | 1 | REPROVADO | ada9fb8ed5aa6fa4d |
| 2026-10-22 17:30:30 | 2026-10-22 17:30:54 | `revisor-geral` | 2 | APROVADO | a4f6c081e4ce39cf7 |
| 2026-10-22 17:30:22 | 2026-10-22 17:31:35 | `test-engineer` | 2 | APROVADO | a21c91e0a45dead6d |
