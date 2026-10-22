# Achados das revisões — `tasks/prd-reengenharia/48_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## llm-integrator · 1ª rodada · APROVADO · 2026-10-22 17:17:43 · `tasks/prd-reengenharia/48_task.md`

VEREDITO: APROVADO

Perfis usados: nenhum perfil novo. A tarefa decora o adaptador de todos os perfis e dá prazo próprio a `rapido` (20 s, `LLM_TIMEOUT_MS_RAPIDO`) e a `padrao` (60 s, `LLM_TIMEOUT_MS_PADRAO`). `complexo` e `visao` ficam no `LLM_TIMEOUT_MS` (60 s). Nenhuma chamada sobe de perfil.

Custo estimado por professor/mês: R$ 0 a mais. A tarefa não cria chamada de modelo nem prompt. A única repetição possível é uma por chamada, e só em 429 ou conexão recusada, onde o provedor não cobrou. Timeout e 5xx não repetem, porque podem ter cobrado. O disjuntor aberto corta chamadas e reduz gasto. O limite de tokens por minuto e a degradação para modelo menor são da 49.0 (X6). A estimativa por professor continua a das tarefas que usam o modelo.

Prompt versionado: não se aplica (não toca prompt)
Validação de schema: não se aplica. O `ProvedorDeIa` continua validando a saída, e há um teste de que `IA_SAIDA_INVALIDA` não pesa no disjuntor.
Aprovação humana no caminho: não se aplica

Bloqueantes: nenhum

Verifiquei o seguinte.
- **SDK de provedor:** o único SDK novo é o `cockatiel` 4.0.0, em versão exata em `packages/nucleo/package.json:43` e no lockfile. Nenhum SDK de provedor fora do adaptador.
- **Ordem do decorador:** `adaptador-resiliente.ts:165` monta `wrap(timeout, disjuntor, retry)`. O prazo cobre a chamada e a repetição, e o sinal dele aborta o `fetch` e a espera. A repetição é uma só, com jitter, só em `limite` e `recusada`. O `Retry-After` a corta quando passa do prazo do perfil.
- **Disjuntor:**
  - Abre com 5 falhas seguidas (5xx, timeout, conexão recusada; no `rapido`, chamada acima de metade do prazo) e meio-abre em 30 s.
  - A chave é modelo e perfil, e 429, outro 4xx e `IA_SAIDA_INVALIDA` não pesam.
  - O provedor fica fora da chave, mas `ia.module.ts:68` cria um provedor só por réplica, então o mapa persiste.
- **Erro para o aluno:** `ErroDoProvedor` não carrega corpo nem status do provedor. A função `traduzir` devolve sempre um `ErroDeIa` simples (`BrokenCircuitError` vira `IA_INDISPONIVEL`, `TaskCancelledError` vira `IA_TEMPO_ESGOTADO`). Isso fecha o item 4 da regra 80 e o item 11 da regra 20.
- **Configuração:** os invariantes por perfil estão no `config-ia.ts`. O recuo e a latência falsa ficam abaixo do menor prazo, e `IA_EXECUCAO_TIMEOUT_MS` fica acima do maior. As variáveis novas aparecem em `.env.example`, `infra/compose.yml` e `docs/roteiro-da-demonstracao.md`.
- **Testes:** nenhum teste chama provedor pago (servidor falso e roteiro). Rodei `vitest --project unidade` em `packages/nucleo/src/ia` e `packages/nucleo/src/config`: 15 arquivos e 1059 testes passam. O `tsc --noEmit` do `packages/nucleo` ficou limpo. Os testes de `adaptador-resiliente.test.ts` cobrem a tabela da tarefa. Os blocos de mutação são extensos e citam teste por cláusula.
- **Exceção à regra 80, item 5:** o disjuntor em memória por réplica está declarado como divergência na tarefa, com a seção da `onda-3c.md`.

Recomendações:
- **`Retry-After` próximo do prazo:** no `padrao`, um `Retry-After` de 59 s é aceito (59 s < 60 s), mas a repetição nasce sem tempo e acaba em `IA_TEMPO_ESGOTADO`. Um corte tipo "espera + tempo mínimo de uma chamada < prazo" evitaria prender a vaga da escola à toa. Pode ir para a 49.0.
- **Prazo contado por chamada ao modelo:** `ProvedorDeIa` repete a geração quando a saída é inválida, e cada tentativa tem o prazo cheio. A execução pode chegar a 2 × prazo, e `IA_EXECUCAO_TIMEOUT_MS` só exige ser maior que um prazo. Isso já era assim antes. Vale conferir na 47.0 ou na 49.0, que somam o orçamento das duas tentativas.
- **Limiar de chamada lenta:** o limiar de 10 s é a metade do prazo (`prazo / 2`), não uma constante. Se alguém subir `LLM_TIMEOUT_MS_RAPIDO`, a "chamada lenta" sobe junto. Fica registrado no `runbook`, no parágrafo do alerta da 49.0.
- **Registro do disjuntor aberto:** a tarefa não registra nem mede o evento do disjuntor aberto. As métricas de IA são da 49.0 (X6), e o parágrafo do runbook deve nascer com elas (regra 80, item 10).

Arquivos relevantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/adaptador-resiliente.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/adaptador-openai-compat.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/erros.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/config/config-ia.ts`

## revisor-geral · 1ª rodada · REPROVADO · 2026-10-22 17:18:45 · `tasks/prd-reengenharia/48_task.md`

VEREDITO: REPROVADO

Escopo: respeitado

Aderência à Tech Spec: divergência em 48.1 (fica só no documento da tarefa)

Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)

Bloqueantes:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/48_task.md:85`: a subtarefa 48.1 pedia a caracterização "num commit antes". Ela foi marcada como feita sem esse commit, e a coluna "Onde está na spec" diz "Só nesta tarefa (subtarefa 48.1)". Divergência que existe só no `N_task.md` é bloqueante. As tarefas anteriores com o mesmo desvio o registraram na onda: a 18.0 em `onda-1b.md` §2 T4, "Como a 18.0 ficou", e a 19.0 em `onda-1b.md`, "Como a 19.0 ficou". A `onda-3c.md` desta tarefa ganhou as outras oito divergências em T10, mas esta ficou de fora. Correção exigida: registrar na `onda-3c.md`, em T10, no parágrafo 48.0 ou num item "Como a 48.0 ficou", que a caracterização 48.1 é a que já está no HEAD `84ef3df`, nos três casos citados de `adaptador-openai-compat.test.ts`, e não teve commit à parte, com o motivo do hook. Depois, trocar a coluna da linha 85 por essa seção.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/adaptador-resiliente.ts:126` e `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/config/config-ia.ts:110`: a subida só exige `IA_LATENCIA_FALSA_MS` abaixo do menor prazo (20 s). Com uma latência falsa entre 10 s e 20 s, toda chamada `rapido` do adaptador falso conta como lenta, e o disjuntor abre na quinta, o que derruba o Tutor no teste de carga. Vale recusar na subida a latência falsa acima da metade do prazo do `rapido`, ou ao menos escrever esse limite no comentário do `.env.example`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/adaptador-resiliente.ts:161-164`: o disjuntor abre e fecha sem nenhum log por id. Isso cumpre o "métricas de IA na 49.0", mas o operador sozinho (regra 80.10) não fica sabendo que o provedor caiu numa réplica. Uma linha `ia.disjuntor.aberto` com modelo e perfil, pelo `onBreak` do `cockatiel`, custa pouco.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/adaptador-resiliente.ts:66-76`: o comentário diz que "tudo o que sobe daqui é `ErroDeIa` simples", mas `traduzir` devolve sem tradução qualquer erro que não reconhece, e a `ChamadaCancelada` só não escapa porque a política de prazo `Aggressive` responde primeiro. Ajustar o comentário ou traduzir o resto para `IA_INDISPONIVEL`. Hoje o `ProvedorDeIa` cobre esse caso.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.ts:195`: `pedido.sinal ?? new AbortController().signal` cria um sinal que nunca aborta, só para preencher o tipo. Tornar `sinal` opcional em `ChamadaAoModelo`, ou montar o sinal no decorador, deixa a intenção mais clara.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 17:19:02 · `tasks/prd-reengenharia/48_task.md`

**Rodada 1 da tarefa 48.0: APROVADO.** Não há bloqueante. Os testes unitários de `packages/nucleo/src/ia` e `packages/nucleo/src/config` passaram (1059).

```
VEREDITO: APROVADO
Caminho quente tocado: tutor | IA
Rate limit: ok (não tocado)
Fila e prioridade: ok (não tocada)
Concorrência: protegida
Índice e paginação: ok (não se aplica)
Degradação de IA: ok (sobe sempre ErroDeIa tipado; fila curta, modelo menor e tokens por minuto são da 49.0, X6, conforme onda-3c.md T10)
Migration: não se aplica
Métrica e alerta: ok (latência e erro seguem no ia.geracao.falhou e no ia.geracao.concluida de provedor.ts:153 e :257; ia.disjuntor.aberto e o alerta "Provedor de IA fora", com runbook, ficaram para a 49.0)
Bloqueantes: nenhum
Recomendações:
- packages/nucleo/src/ia/adaptador-resiliente.ts:121 e :129 — no meio-aberto, o cockatiel conta como sucesso todo erro que o handleWhen não trata (node_modules/cockatiel/dist/CircuitBreakerPolicy.js:205-209). Com isso, o ChamadaCancelada da chamada de teste fecha o disjuntor com o provedor ainda fora, e o mesmo vale para um 429 ou outro 4xx. Ele só reabre depois de mais 5 falhas. Isso acontece quando quem chamou desiste ou quando um pedido que esperava a decisão do meio-aberto volta com o sinal já vencido. Sugestão: o ChamadaCancelada vira resultado neutro, ou o meio-aberto descarta a amostra cancelada. Faltam também um teste e uma linha em "Divergências".
- packages/nucleo/src/ia/adaptador-resiliente.ts:161-164 — o disjuntor abre sem nenhum rastro. Hoje, às 10h, o operador vê só uma rajada de IA_INDISPONIVEL e não distingue "disjuntor aberto" de "provedor caiu". Sugestão: um logger.warn({ evento: 'ia.disjuntor.aberto', modelo, perfil }) no onBreak e no onReset, sem escola nem usuário, até a métrica da 49.0 chegar.
- infra/test/carga.test.ts — o cenário de carga "provedor recusando por limite no meio da aula" (regra 40) ainda não existe. O lugar dele é a 47.0 ou a 49.0 (X6); convém deixar a linha no TODO.md para não depender de memória.
- packages/nucleo/src/config/config-ia.ts:110 — o invariante confere IA_EXECUCAO_TIMEOUT_MS > maior prazo. Só que o ProvedorDeIa faz até 2 tentativas e cada uma ganha um prazo novo: o correto seria > 2 × maior prazo. Os valores padrão passam (2 × 60 s = 120 s < 150 s), mas uma configuração com LLM_TIMEOUT_MS_PADRAO=100000 sobe e corta a segunda tentativa. A regra já era assim antes desta tarefa; vale fechar junto com o orçamento da 49.0.
```

A exceção à regra 80.5 está aceita. O disjuntor fica em memória, um por réplica, e a montagem é única por processo: `criarProvedorDeIa` sai de um `useFactory` singleton em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/ia/ia.module.ts:68`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/adaptador-resiliente.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/adaptador-resiliente.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/adaptador-openai-compat.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/erros.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/config/config-ia.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/infra/compose.yml`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/infra/carga.env`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/.env.example`

## test-engineer · 1ª rodada · REPROVADO · 2026-10-22 17:19:26 · `tasks/prd-reengenharia/48_task.md`

VEREDITO: REPROVADO

**Cenários exigidos**
- **Caminho feliz:** a resposta boa passa inteira, com a origem, o envio e o modelo do adaptador de dentro.
- **Prazo por perfil:** `rapido` de 20 s e `padrao` de 60 s. O prazo cobre a chamada e a repetição. O prazo que acaba durante a espera da repetição a cancela.
- **Repetição:** só em 429 e em conexão recusada, com jitter. Nenhuma em 5xx, timeout ou outro 4xx. Nenhuma quando o `Retry-After` passa do prazo, e a espera sugerida vai para quem chamou.
- **Disjuntor:** abre com 5 falhas (5xx, timeout, conexão recusada) e meio-abre em 30 s. 429, outro 4xx e `IA_SAIDA_INVALIDA` não pesam. É um por perfil e um por modelo.
- **Chamada lenta:** só conta no `rapido`, acima de metade do prazo. A ferramenta `padrao` de 50 s não conta.
- **Configuração:** cada prazo dentro da faixa. Os invariantes contra o menor e o maior prazo: recuo, latência falsa e execução.
- **Erro que chega ao aluno:** sempre o tipado, nunca o corpo do provedor.
- **Casos de borda do domínio:** o Tutor não cai com as ferramentas; o provedor recusando por limite no meio da aula; quem chamou desiste.
- **Permissão e isolamento de escola:** não se aplicam, a tarefa não toca dado de escola.

**Cobertos**
- As dez linhas da tabela têm teste. O principal está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/adaptador-resiliente.test.ts`, com relógio falso e adaptador de roteiro. Os outros:
  - a classificação do `ErroDoProvedor` e a recusa com o `fetch` de verdade, em `adaptador-openai-compat.test.ts`;
  - a ligação em `criarProvedorDeIa`, em `provedor.test.ts` (`o prazo é o do perfil da tarefa`, `a repetição do 429 espera o recuo`);
  - os invariantes e as faixas, em `config-ia.test.ts`.
- As linhas juntadas com "ou" ou "e" foram conferidas uma a uma:
  - "cinco 429 ou cinco `IA_SAIDA_INVALIDA`": `cinco 429 não abrem` e `cinco gerações com saída inválida…`;
  - "meio-abre": o mesmo teste prova a falha que reabre e o sucesso que fecha;
  - "`rapido` vale e conta / `padrao` 50 s não": testes separados, com o limite exato da metade do prazo.
- Nenhum `.skip`, `.only` ou teste comentado. Nenhum teste chama provedor pago: só o adaptador de roteiro, o servidor llama falso e a porta fechada local.
- Rodei `npx vitest run --project unidade` nos quatro arquivos: 178 passaram.

**Bloqueantes**
Três cláusulas novas do diff ficaram sem bloco em "Mutações". Os testes que as prenderiam já existem; falta só declarar o bloco.

1. **`adaptador-resiliente.ts:49`** — `if (erro instanceof ErroDoProvedor) return erro.falha`.
   - É a linha que faz a classificação do adaptador decidir. Sem ela, todo `ErroDoProvedor` cai na linha 50 como `'servidor'`: o 429 e a recusa deixam de repetir, e o 429 passa a pesar no disjuntor.
   - Correção: um bloco que tira a linha, citando `adaptador-resiliente.test.ts › 429: uma repetição`.
2. **`adaptador-resiliente.ts:112`** — o `chamada.sinal` passado como segundo argumento de `.execute(...)`.
   - É ele que liga a desistência de quem chamou ao prazo e ao `fetch`. O bloco que existe é de outra linha (`provedor.ts`, `pedido.sinal ?? …`) e não prova este repasse.
   - Correção: um bloco `.execute((contexto) => this.tentar(chamada, contexto.signal), chamada.sinal)` → `.execute((contexto) => this.tentar(chamada, contexto.signal))`, citando `› quem chamou cancela`.
3. **`adaptador-resiliente.ts:140-141` e `:166`** — o disjuntor guardado no mapa por chave (`this.politicas.get` / `this.politicas.set`).
   - É a cláusula "o disjuntor só vale compartilhado". Sem o `set`, cada chamada nasce com um disjuntor novo, que nunca abre.
   - Correção: um bloco que tira `this.politicas.set(chave, criada)`, citando `› cinco falhas abrem`.

**Recomendações**
- **Meio-aberto com várias chamadas ao mesmo tempo:** hoje o meio-aberto só é provado com chamadas em fila. Falta um teste com várias chamadas em paralelo quando ele chega aos 30 s, provando que só a de teste chega ao provedor e as outras saem com `IA_INDISPONIVEL`. É o que acontece às 10h, com a escola inteira no Tutor.
- **Testes com relógio real em `provedor.test.ts`:** `› o prazo é o do perfil da tarefa` (`< 500` ms) e `› a repetição do 429 espera o recuo` (`< 700` ms) têm folga de 300 a 350 ms. Passaram aqui, mas valem um teto mais largo, como `< 1_100` (ainda pega a mutação de 1.200 ms), ou o relógio falso.
- **`adaptador-openai-compat.test.ts › erro 429 duas vezes`:** confira também `String(erro.cause)`, como o teste do 500 já faz.
- **Linha 1 da tabela, "a troca conta":** no caso com o servidor llama falso (`› servidor que demora além do prazo`), afirme também o registro de consumo `{ estado: 'falhou', codigoDeErro: 'IA_TEMPO_ESGOTADO' }`. Hoje "conta" só está provado no disjuntor (`› timeout pesa`), com o adaptador de roteiro.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 17:30:54 · `tasks/prd-reengenharia/48_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido ("portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)")

Bloqueantes: nenhum.

A correção que exigi na rodada anterior foi feita:
- **Registro na onda:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/onda-3c.md:34-38` ganhou o parágrafo "Como a 48.0 ficou", em T10. Ele diz que a caracterização da 48.1 é a que já está no HEAD `84ef3df`, nos três casos de `adaptador-openai-compat.test.ts`. Também diz por que não houve commit à parte: o hook `tools/processo/revisoes.ts` barraria um commit só de teste.
- **Linha 85 da tarefa:** `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/48_task.md:85` agora aponta para `onda-3c.md` T10 ("Como a 48.0 ficou").

O resto do diff desta rodada também está em ordem:
- **Mutações novas (48_task.md:666-683):** as três citam linhas que existem em `adaptador-resiliente.ts` (linhas 49, 114 e 168) e testes que existem em `adaptador-resiliente.test.ts` (linhas 219, 169 e 295).
- **Teste novo do meio-aberto:** é coerente com o disjuntor. Com seis chamadas ao mesmo tempo, só a de teste chega ao provedor, e todas saem como `ErroDeIa` com `IA_INDISPONIVEL`.
- **Comentário do `traduzir`:** só reescreve o texto, sem mudar comportamento.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/provedor.test.ts:209` e `:226`: os dois limites de tempo subiram para `< 1_100`, e isso afrouxa o que eles provavam:
  - **Teste do Tutor:** o limite agora fica acima do atraso de 600 ms do servidor. A prova de que o prazo `rapido` corta cedo passa a depender só do `codigoDeIa`, e não do tempo medido.
  - **Teste do 429:** com recuo de 400 ms, o limite de 1.100 ms deixaria passar um recuo dobrado sem falhar.
  
  Se a folga é para a máquina lenta, convém escrever o limite em função do atraso e do recuo, em vez de um número fixo. O dono desse ponto é o `test-engineer`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/ia/adaptador-resiliente.ts:67-71`: o comentário afirma que a `ChamadaCancelada` "não chega" ao `traduzir`. Sem um teste que prenda isso, é uma promessa que pode envelhecer. Vale testar ou encurtar a frase.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 17:31:35 · `tasks/prd-reengenharia/48_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** as três correções da 1ª rodada, mais o que mudou depois dela:
- o ceilinho de tempo real afrouxado no `provedor.test.ts`
- o registro do consumo no prazo vencido
- o `cause` que não pode levar texto do aluno
- o meio-aberto do disjuntor com chamadas concorrentes

**Cobertos:**

1. **`adaptador-resiliente.ts:49`** (`if (erro instanceof ErroDoProvedor) return erro.falha`). O bloco está em `48_task.md:666-670` e cita `› 429: uma repetição`. Sem a linha, o `ErroDoProvedor('limite')` cai no `IA_INDISPONIVEL → 'servidor'`. Aí a repetição não sai, e o `expect(interno.chamadas).toBe(2)` em `adaptador-resiliente.test.ts:225` fica vermelho pela cláusula certa.

2. **`adaptador-resiliente.ts:114`** (o `chamada.sinal` como segundo argumento do `.execute`). O bloco está em `48_task.md:672-677` e cita `› quem chamou cancela`. Sem o repasse, o `demora` escuta só o `contexto.signal`, e o `abort()` de quem chamou não chega a ele. A chamada fica pendente, e o `codigoDe(desfecho)` em `:177` sai `undefined`. O vermelho vem do motivo certo.

3. **`adaptador-resiliente.ts:168`** (`this.politicas.set(chave, criada)`). O bloco está em `48_task.md:679-683` e cita `› cinco falhas abrem`. Sem o `set`, cada chamada nasce com um disjuntor novo, a sexta chega ao provedor, e `:303` fica vermelho.

Os três blocos passam no parser (`tools/processo/mutacoes.ts:71-97`). Bloco só com `-` é aceito, e o trecho aparece uma vez no arquivo.

**Teste novo, `meio-aberto com a escola inteira chamando junto` (`adaptador-resiliente.test.ts:329`).** As 6 chamadas saem de fato em paralelo, com relógio falso, e o teste afirma o resultado: uma chamada só ao provedor e todas com `IA_INDISPONIVEL`, como `ErroDeIa`. Ele falharia de dois jeitos: sem a tradução do `BrokenCircuitError` (`:74`), porque o erro do cockatiel vazaria, e sem o disjuntor, porque as seis chegariam ao provedor.

**`adaptador-openai-compat.test.ts`.** O prazo vencido agora afirma o registro `{ estado: 'falhou', codigoDeErro: 'IA_TEMPO_ESGOTADO' }`, e o teste do 429 duas vezes confere também o `String(erro.cause)`. As duas asserções são sobre o resultado.

Rodei `npx vitest run` nos três arquivos (`adaptador-resiliente.test.ts`, `adaptador-openai-compat.test.ts`, `provedor.test.ts`), a partir da raiz: 130 de 130 passaram. Não há `.skip` nem mock de coisa nossa, e todo o teste de IA usa adaptador de roteiro ou servidor llama falso.

**Bloqueantes:** nenhum.

**Recomendações:**
- **`provedor.test.ts:209`.** O teto subiu de `< 500` para `< 1_100`, e o servidor falso responde aos 600 ms. Com isso o teto não prova mais que a chamada não esperou a resposta. A regra continua presa por outros testes:
  - a asserção `IA_TEMPO_ESGOTADO` na linha anterior;
  - a mutação do prazo do perfil, que fica vermelha pelo código de erro;
  - o caso `servidor que demora além do prazo` (3 s contra `< 1_500`);
  - o caso `provedor além do prazo do perfil`, com relógio falso.

  Ainda assim, vale subir o `atrasoMs` para uns 3 000, para que o teto volte a dizer alguma coisa sem ficar sensível à carga da máquina.
- **`provedor.test.ts:226`.** O teto `< 1_100` ainda derruba a mutação `aleatorio: () => 5`, que dá pelo menos 1 200 ms, mas a folga caiu para 100 ms. Ela continua segura, porque com carga o valor mutado só cresce. O jitter fino continua provado com relógio falso em `› o jitter`.
