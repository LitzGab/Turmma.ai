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

- [ ] 48.1 — Caracterização, num commit antes: o recuo de hoje em 429 e 5xx, e o `IA_TEMPO_ESGOTADO` no prazo
- [ ] 48.2 — `cockatiel` em versão exata nas `dependencies` de `packages/nucleo` (`npm view cockatiel version`)
- [ ] 48.3 — `adaptador-resiliente.ts`: `wrap(timeout, disjuntor, retry)`, a repetição só em 429 e conexão recusada; `pedirComRecuo` sai
- [ ] 48.4 — `LLM_TIMEOUT_MS_RAPIDO` (20 s) e `LLM_TIMEOUT_MS_PADRAO` (60 s), com os invariantes por perfil no `config-ia.ts`, no `.env.example` e no `infra/compose.yml`
- [ ] 48.5 — O disjuntor por provedor, modelo e perfil: abre com 5 falhas (5xx, timeout, conexão recusada; no `rapido`, a chamada acima de 10 s), meio-abre em 30 s
- [ ] 48.6 — Testes: os da tabela

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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

