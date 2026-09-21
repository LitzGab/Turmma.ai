# Tech Spec — Estabilidade da esteira (fase 1: medir e isolar)

**PRD:** `tasks/prd-estabilidade-da-esteira/prd.md`
**Status:** rascunho (recortada em 21/09/2026; não implementada)

## 1. Resumo da abordagem

Duas metades independentes, e nenhuma delas conserta o vermelho.

**Instrumentar e medir.** Hoje não dá para saber qual das quatro candidatas do PRD produz o 503,
porque nenhum 503 da suíte carrega instante e o status não distingue caminho (`handle_errors 502 503
504` devolve os três como 503). Primeiro se acrescenta o carimbo, o método e o estado do pool; só
então se mede.

**Isolar o ambiente de teste de si mesmo.** O projeto `infra` herda o que estiver de pé, e o que
sobe no meio dele vaza para o arquivo seguinte. Isso é conhecido, tem mecanismo nomeado, e o conserto
não depende de medição nenhuma — e pode, sozinho, zerar os vermelhos do portão local.

O que **não** muda aqui: a espera fixa, a condição de readmissão e as asserções do
`borda.int.test.ts`. Mudar o objeto durante a medição invalidaria a medição.

## 2. Módulos afetados

| Arquivo | O que muda |
|---|---|
| `infra/test/borda.int.test.ts` | `Resultado` (`:98-102`), `inesperados` (`:167-176`), a rajada e o caso de `:426` ganham instante e método; nenhuma espera ou asserção muda |
| `tools/testes/integracao.setup.ts` | impõe o estado de entrada do projeto `infra` (RF4) |
| `infra/test/alertas.int.test.ts`, `infra/test/metricas.int.test.ts` | devolvem o ambiente ao conjunto declarado (RF5) |
| `tools/guardas/` | guarda do estado de entrada, com estado sujo fabricado |
| `tools/processo/portao-local.ts` | ordem das suítes (`infra` antes de `e2e`), passo barato |
| documento de medição | novo, commitado, com os números do RF2, RF3 e RF6 |

Nada em código de produto.

## 3. Modelo de dados · 4. API — não se aplicam.

## 5. Fluxo

### Etapa 1 — instrumentar (RF1)

`Resultado` passa a carregar o instante de cada resposta e o método. `inesperados` para de descartar
ordem. O caso de `:426` registra, para cada um dos 20 POSTs, instante e status. No bloco do realtime,
registra também a qual upstream o cookie prendia — `lb_policy cookie` existe só ali
(`Caddyfile:61`), e é o único lugar onde essa informação existe.

**Nada mais muda no arquivo nesta etapa.** É a condição para as etapas 2 e 3 terem contra o que
correlacionar.

### Etapa 2 — isolar o ambiente (RF4, RF5)

O projeto `infra` declara o conjunto de serviços da entrada e **impõe** no `globalSetup`, parando o
que estiver fora (`stop` de serviço já parado é no-op). A guarda **fabrica o estado sujo**: sobe um
serviço fora do conjunto, roda a imposição, e afirma que ele foi parado e que não entra no conjunto
de `borda.int.test.ts:363-367`. Guarda que só afirma o estado passa por construção em runner limpo,
onde nada está de pé antes.

O `globalSetup` roda **uma vez por projeto**, então não cobre o que muda no meio: `alertas:87` sobe
`redis-cache` e não para, `metricas:87` para os processos da fila e nunca religa. Os dois devolvem o
ambiente ao conjunto declarado — ou `:363-367` passa a usar conjunto declarado, que fecha os dois de
uma vez e é a saída preferida.

Trocar a ordem no portão (`infra` antes de `e2e`) entra como passo barato, não como requisito.

### Etapa 3 — medir (RF2, RF3, RF6)

Com a instrumentação de pé, rodar e registrar: execuções e vermelhos por job e no portão local, e,
para cada 503, instante, método e a transição mais próxima no log `sonda` (lido por `compose logs
--since` do instante do `start`). Separar o 503 da aplicação (guarda de sessão, semáforo de hash),
que usa o mesmo envelope.

No mesmo esforço, e **sem mudar nada**: custo do `observabilidade` no e2e (tempo de job, pico de CPU
e saída dos processos no SIGTERM) e efeito de `workers` sobre a estabilidade.

A saída é um documento commitado. Se a correlação não separar as candidatas, isso é resultado válido
e é escrito como tal — com o que falta para separá-las.

## 6. Isolamento · 7. Dado pessoal · 7b. Conformidade

Não se aplicam: sem query, sem dado de pessoa (ambiente sintético). A instrumentação grava instante,
método e estado do pool — nada de URL, IP ou cabeçalho (regra 20, item 9).

## 7c. Carga e falha (obrigatório)

Os testes instrumentados são os que provam a resiliência do produto (regra 80): nenhuma asserção
deles muda aqui, justamente para a medição valer. Se a medição apontar a candidata 4 — POST não
repetido contra upstream no pool —, a fase 2 passa a ter objeto de produto: é o mesmo caminho do
POST do aluno salvando resposta de prova numa rolagem (regra 80, item 6), e a alavanca que a regra
prescreve é gravação idempotente com reenvio no cliente, não retentativa na borda (item 7).

## 8. Uso de IA · 9. Frontend

Nenhum dos dois.

## 10. Testes

| Cenário | Tipo | O que prova |
|---|---|---|
| estado de entrada com estado sujo fabricado | guarda | a imposição para o que está fora do conjunto declarado — não passa por construção (RF4) |
| `alertas` e `metricas` seguidos de `borda` | infra | o que eles sobem ou param não muda o conjunto que `:363-367` monta (RF5) |
| duas execuções na mesma máquina | guarda | projeto e portas fixas colidem; falha cedo e legível, em vez de poluir a linha de base |
| instrumentação: 503 forçado | infra | o registro traz instante, método e estado do pool — sem os três, a correlação do RF3 é impossível |

**RF2, RF3 e RF6 não têm linha** de propósito: provam-se por documento commitado, não por teste. E
nenhuma asserção existente do `borda.int.test.ts` muda — se alguma mudar, a medição perde o objeto.

## 11. Conformidade com as regras

**Regra 40**: sem `.skip`, sem retentativa silenciosa; a instrumentação não afrouxa asserção nenhuma.
**Regra 80**: os testes de resiliência seguem provando o que provam. **Regra 20**: ambiente
sintético, e o que se grava não é dado de requisição. **D52**: a engrenagem que isto destrava.

## 12. Premissas não verificadas

1. **Que o log `sonda` basta para reconstruir o estado do pool.** Ele registra transição, não estado
   contínuo; a etapa 1 confirma ao instrumentar, e se não bastar a etapa 3 diz o que falta.
2. **Que o RF4 e o RF5 zeram os vermelhos do portão local.** É o esperado, e a medição do RF2 antes
   e depois responde.
3. **Que as quatro candidatas cobrem o espaço.** Quatro rodadas de revisão chegaram a elas; a quinta
   pode achar a quinta.
4. **Que a esteira continua disparando só no push do `main`.** É o que vale hoje
   (`.github/workflows/ci.yml`), mas a D23 revista prevê branches, com ajuste do hook, do
   `/executar-task`, do `/corrigir` e da regra 40. Se essa decisão vier primeiro, o recorte "por
   job" do RF2 precisa incluir **onde** a esteira roda, e a linha de base medida antes não compara
   com a de depois.

## 13. Riscos técnicos

- **Instrumentar e mudar o objeto sem perceber** — por isso a etapa 1 é explicitamente só carimbo, e
  a seção 10 afirma que nenhuma asserção muda
- **A medição não separar as candidatas.** Resultado válido, escrito como tal; a fase 2 então começa
  pela pergunta que sobrou, não por um conserto adivinhado
- **A linha de base ser poluída** por colisão de duas execuções ou por 503 da aplicação — os dois têm
  cenário na seção 10 e tratamento no RF2
