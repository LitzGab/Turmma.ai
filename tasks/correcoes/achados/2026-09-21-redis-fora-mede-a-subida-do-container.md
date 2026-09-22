# Achados das revisões — `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-09-21 09:36:49 · `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

Auditei o diff de três linhas em `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/redis-fora.int.test.ts` e o documento `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`. Não editei nada; as conferências foram leitura, `git diff` e `git stash show -p` (nenhum deles toca a árvore). Não rodei o teste de integração: ele para, pausa e religa o `redis-fila`, e rodá-lo em paralelo sabotaria o portão local em andamento.

**1. A correção mantém o que o caso prova?** Mantém, integralmente. O diff é puramente aditivo e não toca nenhuma asserção: `:94` (`{ aguardando: 50 }` com o Redis fora), `:95` (nenhuma `rodada_falhou`), `:87-91` (aviso só com ids — a chave por chave, que é a asserção de privacidade), `:102` (`concluido === 50` depois da volta) e `:105-106` (cada job exatamente uma vez) continuam iguais. `aguardarSaudavel` só executa `docker compose ps` (`tools/testes/compose.ts:68-82`): não fala com o despachante, com o worker nem com o `job_registro`, então não há como ela fazer o caso passar vazio. Apague a recuperação do despachante e o `:102` continua vermelho. O healthcheck do `redis-fila` é `redis-cli ping` com `interval: 2s` (`infra/compose.yml`), ou seja, `healthy` é um proxy apertado de "o Redis responde" — a fronteira está no lugar certo, e custa no máximo ~2 s de tempo morto fora do orçamento. E, no stop/start, o Docker reinicia a saúde em `starting`, então não há risco de a espera voltar na hora com um `healthy` velho (o caso do `pause`, que o `afterEach` já trata em `:50-51`).

**2. Os 60 s são defensáveis?** São, e o argumento do documento é o certo — mas por uma razão mais forte do que a que ele dá. No caso de 20/09 o aperto de 30 s → 20 s tinha base: a recuperação medida era de 6 ms a 1,4 s, e a garantia do `clientes.ts` ("o Redis que volta é usado de novo em segundos") é uma garantia de *tempo*, que 30 s esconderiam. Aqui o que o caso prova, pelo próprio título, é *correção* — "ao religar cada job executa uma vez" —, não latência: o orçamento largo não esconde a regra que o teste existe para pegar. E o trabalho depois do `healthy` é de outra ordem de grandeza: reconexão do ioredis (recuo de até 2 s), sondagem do despachante a cada 500 ms (`apps/despachante/src/despachante.ts:24`), tomada de vaga por escola, publicação de 50 jobs e execução com concorrência 10 gravando no Postgres. Apertar isso de cabeça seria exatamente o palpite que a correção anterior evitou. Fica como recomendação medir uma vez (a estimativa analítica é de poucos segundos, o que sugere que 20-30 s caberiam) e registrar o número, para o aprendizado da classe ficar completo: a metade "orçamento não compartilhado" foi aplicada, a metade "orçamento dimensionado por medição" ficou pendente.

**3. "O lint reprova sem a linha" basta como vermelho-antes?** Basta, nesta ordem e com esta redação, por três motivos. A guarda existe e eu a li no stash `retro-do-f1` (`tools/guardas/regras-teste.mjs` e `tools/guardas/__fixtures__/esperar-servico.ts`): ela acusa `composeAssincronoOuFalha('start', …)` sem `aguardarSaudavel` nas instruções seguintes do mesmo bloco, e com a linha nova o `:97` passa a estar coberto pelo `:100` dentro do mesmo `try` — a evidência declarada é consistente com o código que vi. A ordem inversa não era possível: registrar a guarda antes da correção deixaria o `main` com lint vermelho, e o documento diz isso em letras (`:36`, `:38-39`), sem fingir que a prova está neste commit. E a causa não está em dúvida: é a mesma semântica do `start`, provada com medição no documento irmão, e verifiquei que `redis-fora.int.test.ts:97` era mesmo a última ocorrência do repositório — todos os outros pontos que sobem serviço (`reconciliacao:323,415`, `execucao:342`, `sistema:368`, `mfa:681`, `login-email:411`, `ataque-de-senha:538`, `limite:163`, `saude:15`) já pareiam com `aguardarSaudavel`, e `alertas.int.test.ts:87` usa `--wait`. O que eu exigiria se a causa fosse nova — a reprodução determinística por adiamento do `start`, como em 20/09 — aqui seria cerimônia sobre um mecanismo já provado.

```
VEREDITO: APROVADO

Cenários exigidos (o que a correção não pode perder, mais o que ela precisa passar a garantir):
- com o Redis fora, 50 POSTs em 202 e nada reservado, publicado ou executado
- o aviso de vaga indisponível sai só com ids (privacidade no log, regra 20 item 9)
- o laço do despachante não cai por exceção com a dependência fora
- com o Redis de volta, a rodada seguinte despacha e os 50 jobs concluem
- job executado uma única vez depois da religação (execução em duplicata, regra 80 item 7)
- quando o container não sobe, a falha diz o que houve, em vez de AssertionError mudo
- a classe do defeito (orçamento compartilhado com a subida do container) não volta

Cobertos:
- redis-fora.int.test.ts:81-84 (202 em menos de 1 s cada), :87-91 (chaves do aviso), :94 ({ aguardando: 50 }),
  :95 (nenhuma rodada_falhou), :102 (concluido === 50), :105-106 (exatamente uma execução por job) — todos
  intactos, o diff não toca asserção nenhuma
- :100 `aguardarSaudavel('redis-fila')` — teto próprio de 60 s e erro com estado e as últimas 40 linhas do
  log do serviço (tools/testes/compose.ts:76-81), no lugar do vermelho ilegível
- a classe: `guardas/esperar-servico-do-compose` (tools/guardas/regras-teste.mjs + fixture
  __fixtures__/esperar-servico.ts), hoje no stash `retro-do-f1`, entra no commit seguinte — ordem
  necessária, porque a guarda com a violação de pé deixaria o main vermelho

Bloqueantes: nenhum.

Recomendações:
1. tasks/correcoes/2026-09-21-...md:44-45 — medir uma vez a recuperação depois do `healthy` (instrumentação
   temporária, como em 20/09) e registrar o número no documento ou no TODO. Pelos parâmetros
   (sondagem de 500 ms, recuo do ioredis de até 2 s, 50 jobs com concorrência 10) a recuperação deve ficar
   em poucos segundos, e 60 s sobreviveriam a uma regressão grande. Não bloqueia: o que este caso prova é
   exatamente-uma-vez, não latência.
2. redis-fora.int.test.ts:100 vs :110 — o pior caso agora soma `aguardarSaudavel` (60 s) + poll (60 s) +
   laço dos 50 POSTs (teto de 1 s cada) + poll de :88 (10 s) + 1,5 s, e encosta nos 180 s do caso. Se
   encostar, a falha volta a ser "test timed out in 180000ms", justo o que a correção existe para evitar.
   `aguardarSaudavel` aceita `limiteMs`: um teto menor aqui (ou um timeout de caso maior) fecha a brecha.
3. Para o commit da retrospectiva, não para este: `CHAMADAS_DE_COMPOSE` em tools/guardas/regras-teste.mjs
   lista `compose`, `composeOuFalha` e `composeAssincronoOuFalha`, e deixa de fora `composeAssincrono` e
   `composeAssincronoCom`. Hoje nenhum deles sobe serviço sem `--wait` (o único uso é alertas.int.test.ts:87),
   então não há violação escondida — mas é um furo para a próxima vez.
4. tasks/correcoes/2026-09-21-...md:49-51 — dizer na própria seção de evidência que esses dois resultados
   foram obtidos com a guarda aplicada por cima (stash `retro-do-f1`) e que, neste commit, `npm run lint`
   passa com e sem a linha. O documento já explica a ordem em :36 e :38-39; faltou amarrar isso à tabela de
   evidência, que é o que alguém vai tentar reproduzir daqui a seis meses.
```

## test-engineer · 2ª rodada · APROVADO · 2026-09-21 10:02:06 · `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

Auditei o diff da rodada 2 (apenas `apps/despachante/test/redis-fora.int.test.ts`, mais o documento), a guarda no stash `retro-do-f1` e o healthcheck do `redis-fila`. Não editei nada; só leitura, `git diff` e `git stash show -p`.

**Recomendação 2 (a de risco real) — aplicada e correta.** `aguardarSaudavel('redis-fila', 30_000)` em `apps/despachante/test/redis-fora.int.test.ts:102`, com o comentário `:98-101` dizendo as duas coisas certas: por que a subida fica fora do orçamento e por que o teto é menor que o padrão. A aritmética fecha: pior caso agora ≈ 50 s (laço dos 50 POSTs, com teto de 1 s por POST asseverado em `:81`) + 10 s (`:88`) + 1,5 s (`:93`) + 30 s (espera) + 60 s (poll) ≈ 151,5 s, mais a montagem — dentro dos 180 s do `it`, ao contrário dos ~181,5 s da rodada 1. E o teto é folgado para o que precisa cobrir: o healthcheck é `redis-cli ping` com `interval: 2s`, `timeout: 3s`, sem `start_period` (`infra/compose.yml:42-46`), então `healthy` depois de um `start` chega em poucos segundos; 30 s é ordem de grandeza acima. Quando não chegar, a falha é a mensagem de `tools/testes/compose.ts:79` com estado e 40 linhas de log, não "test timed out".

**A linha continua satisfazendo a guarda.** Conferi na regra em stash: `esperaAlgumServico` procura `aguardarSaudavel(` nas instruções seguintes do mesmo bloco e casa pelo nome do serviço no texto; `aguardarSaudavel('redis-fila', 30_000)` contém `'redis-fila'`, então o `:97` segue coberto. O segundo argumento não muda nada para a guarda — a evidência de lint da rodada 1 continua valendo para este código.

**Recomendação 4 — aplicada.** A seção "Evidência" (`:58-61`) agora diz que os dois resultados vieram da guarda aplicada por cima, que **neste commit o lint passa com e sem a linha**, e por que a ordem é esta. E a seção "Correção" (`:46-54`) separa os dois orçamentos com o argumento certo: aqui o caso prova exatamente-uma-vez, não latência.

**Nenhuma asserção mudou.** O diff é aditivo: `:94` (`{ aguardando: 50 }`), `:95` (nenhuma `rodada_falhou`), `:87-91` (aviso só com ids), `:104` (`concluido === 50`) e `:107-108` (uma execução por job) estão intactos. `aguardarSaudavel` só roda `docker compose ps`, não fala com despachante, worker nem `job_registro` — não há como ela fazer o caso passar vazio.

As duas não aplicadas (1 e 3) eram recomendações, e o encaminhamento declarado é o correto: a 3 pertence mesmo ao commit onde a guarda vive.

```
VEREDITO: APROVADO
Cenários exigidos: os mesmos da rodada 1, mais as duas correções exigidas por recomendação —
  (a) teto de espera que não encoste nos 180 s do `it`, e (b) evidência de lint que diga em que árvore
  cada resultado foi obtido.
Cobertos: apps/despachante/test/redis-fora.int.test.ts:102 (teto de 30 s) com a justificativa em
  :98-101; documento :46-54 (por que o poll fica em 60 s aqui e caiu para 20 s em 20/09) e :58-61
  (evidência amarrada ao stash, e lint verde com e sem a linha neste commit). Asserções do caso
  inalteradas: :81-84, :87-91, :94, :95, :104, :107-108.
Bloqueantes: nenhum.
Recomendações:
1. Mantida da rodada 1, e o encaminhamento ao TODO.md está aceito: medir uma vez a recuperação depois
   do `healthy` e registrar o número. Com ele, o poll de 60 s em :104 passa a ser dimensionado, não
   herdado.
2. Mantida da rodada 1, para o commit da retrospectiva: `CHAMADAS_DE_COMPOSE` não cobre
   `composeAssincrono` nem `composeAssincronoCom`. Sem violação hoje; furo para a próxima.
3. Nova, não bloqueia: o maior termo do pior caso agora é o laço dos 50 POSTs (até 50 s pelo teto de
   :81), não a espera. Se um dia este `it` voltar a encostar nos 180 s, é ali que a folga está, não em
   :102.
4. apps/despachante/test/redis-fora.int.test.ts:51 — o `aguardarSaudavel` do `afterEach` segue no padrão
   de 60 s dentro de um hook de 120 s. Está certo assim (ali o prazo não é compartilhado com medição
   nenhuma); registro só para que a diferença entre as duas chamadas não pareça descuido depois.
```

Arquivos relevantes: `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/redis-fora.int.test.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`, `/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts`, `/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml`.

## infra-guardian · 1ª rodada · APROVADO · 2026-09-21 10:03:47 · `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

VEREDITO: APROVADO
Caminho quente tocado: fila (teste de resiliência do despachante contra o Redis de fila; nenhuma linha de produção no diff)
Rate limit: ok (não tocado)
Fila e prioridade: ok
Concorrência: protegida — `apps/despachante/test/redis-fora.int.test.ts:106-108` continua provando execução única por job depois da religação, e `:94`/`:95` continuam provando que nada é reservado nem publicado com o Redis fora. `aguardarSaudavel` só executa `docker compose ps` (`/home/joaquimdp/Documentos/git/Educa.ia/tools/testes/compose.ts:68-80`): não fala com despachante, worker nem `job_registro`, logo não há como ela fazer o caso passar vazio. Removida a recuperação do despachante, o poll de `:104` segue vermelho.
Índice e paginação: ok (não tocado)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não tocado)

Respondendo às três perguntas do prompt:

1. **Continua provando a resiliência da regra 80?** Sim. O diff é puramente aditivo, não toca asserção nenhuma, e a fronteira está no lugar certo: o healthcheck do `redis-fila` é `redis-cli ping` com `interval: 2s` (`/home/joaquimdp/Documentos/git/Educa.ia/infra/compose.yml:42-46`), ou seja, `healthy` é um proxy apertado de "o Redis responde", e o que fica dentro do poll é só o produto (reconexão do ioredis, sondagem de 500 ms, tomada de vaga, publicação e execução dos 50 jobs). Confirmei também que `:97` era a última ocorrência do repositório: os outros nove pontos que sobem serviço já pareiam com `aguardarSaudavel`.

2. **O teto de 30 s é o certo?** A aritmética do `test-engineer` procede (com 60 s o pior caso soma 60 + 60 + 10 + 1,5 + o laço dos 50 POSTs com teto de 1 s cada e a subida da API, e encosta nos 180 s do `it`), e o saldo é favorável: a tolerância total do trecho passa de 60 s para 90 s, e a falha deixa de ser `AssertionError` mudo. Mas o número escolhido contradiz o documento irmão — ver recomendação 1.

3. **Manter o poll em 60 s é defensável?** Sim. O título do caso é "ao religar cada job executa uma vez": o que ele prova é correção, não latência, e um orçamento largo não esconde a regra que ele existe para pegar. Diferente do caso de 20/09, onde a garantia provada era de tempo ("o Redis que volta é usado de novo em segundos") e 30 s a esconderiam.

Bloqueantes: nenhum.

Recomendações:

1. `apps/despachante/test/redis-fora.int.test.ts:102` — o teto de 30 s contradiz a conclusão escrita do documento irmão: `tasks/correcoes/2026-09-20-reconciliacao-espera-o-redis-subir-dentro-do-orcamento.md` afirma "O runner da esteira tem menos núcleos e roda quatro tarefas em paralelo, e nele **a subida sozinha passa dos 30 s**". Se aquela frase estiver certa, esta linha nasce vermelha na esteira. A frase é inferência, não medição (o vermelho da esteira foi o caso inteiro em 36,9 s com poll de 30 s, e cada iteração do poll custava até `TIMEOUT_COMANDO_REDIS_FILA_MS` = 2 s, de `packages/nucleo/src/redis/clientes.ts:35`; a medição local foi `healthy` em 11,2 s sob contenção total). Não bloqueia porque o vermelho resultante seria legível e atribuído (`redis-fila não voltou a healthy em 30000 ms` com estado e 40 linhas de log), mas as duas saídas honestas são: medir a subida no runner uma vez e fixar o teto pelo número, ou subir o timeout do `it` (`:112`) e manter o padrão de 60 s. Escolher entre elas sem medir é o mesmo palpite que a correção diz evitar.

2. A rodada 1 do `test-engineer` (fim 2026-09-21 09:36:49) auditou o código com o padrão de 60 s — o texto dela em `tasks/correcoes/achados-revisoes.md` cita `:100 aguardarSaudavel('redis-fila')` e "teto próprio de 60 s". O arquivo foi editado às 10:00:46, depois dela, justamente para aplicar a recomendação 2 daquela rodada. O número que está na árvore nunca passou por revisor de teste. O hook deve exigir rodada nova; se não exigir, é o defeito de caducidade que a retrospectiva corrige.

3. `TODO.md:118` é exatamente este item e continua aberto; feche-o no commit desta correção, junto com o registro da medição prometida em `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md:49`.

4. Este é o único teto não padrão entre os 29 usos de `aguardarSaudavel` no repositório, e a razão vive só no comentário. Se a classe voltar, vale expressar o orçamento do caso como constante derivada do timeout do `it`, em vez de dois números soltos que só um comentário liga.

## infra-guardian · 2ª rodada · APROVADO · 2026-09-21 10:05:55 · `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

VEREDITO: APROVADO
Caminho quente tocado: fila (teste de resiliência do despachante contra o Redis de fila; nenhuma linha de produção no diff)
Rate limit: ok (não tocado)
Fila e prioridade: ok
Concorrência: protegida — `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/redis-fora.int.test.ts:104-106` continua provando execução única por job depois da religação, e `:94`/`:95` continuam provando que nada é reservado nem publicado com o Redis fora. O diff da rodada 2 segue puramente aditivo em relação às asserções.
Índice e paginação: ok (não tocado)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não tocado)

Conferência das correções exigidas (minha recomendação 1 da rodada 1):

1. **Teto padrão restaurado.** `:100` é `await aguardarSaudavel('redis-fila')`, sem segundo argumento. Confirmei no repositório: são 29 chamadas de `aguardarSaudavel` e **nenhuma** passa `limiteMs` — o padrão de `tools/testes/compose.ts:68` (`limiteMs = 60_000`) vale para todas. O teto não padrão que eu apontei sumiu, e com ele a contradição com o documento irmão e a recomendação 4 da minha rodada 1.
2. **Prazo do caso em 240 s.** `:113`. A aritmética do pior caso fecha com folga: ≤50 s do laço dos 50 POSTs (teto de 1 s por POST asseverado em `:81`) + 10 s (`:88`) + 1,5 s (`:93`) + 60 s (espera) + 60 s (poll `:102`) ≈ 181,5 s, sobrando ~58 s para a montagem do Nest, da sessão e da bancada. A falha, quando vier, é a mensagem de `tools/testes/compose.ts:79` com estado e 40 linhas de log, não "test timed out". Os 240 s cabem no `timeout-minutes: 45` do job de integração (`.github/workflows/ci.yml:54`) e não colidem com nada em `vitest.config.ts` (o `testTimeout: 60_000` do projeto é sobreposto pelo prazo do `it`).
3. **A frase errada foi registrada como inferência.** Documento `:58-62`. É a saída certa: o "passa dos 30 s" não tinha medição atrás, e alargar o prazo do caso não aposta em número de runner nenhum.

A guarda continua satisfeita: ela casa `aguardarSaudavel(` com o nome do serviço no texto, e `'redis-fila'` está lá sem o segundo argumento.

Bloqueantes: nenhum.

Recomendações:

1. `/home/joaquimdp/Documentos/git/Educa.ia/tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md:43` — a seção "Correção" ainda abre com `Uma linha: await aguardarSaudavel('redis-fila', 30_000)`, número que não existe mais na árvore. O parágrafo `:51-62` desmente, mas quem ler de cima para baixo vê primeiro o valor errado. Trocar por `aguardarSaudavel('redis-fila')` e deixar o 30 s só na narrativa da tentativa descartada.
2. Documento `:73-74` — "`tools/guardas/guardas.test.ts` 65 de 65" e "Portão local desta correção, verde" foram obtidos na árvore da rodada 1 (com 30 s e `it` de 180 s), que mudou depois. O portão roda de novo agora; vale reescrever essas duas linhas com o resultado desta árvore, senão a evidência aponta para um estado que não existe.
3. Mantida da rodada 1: `TODO.md:118` continua aberto e é exatamente este item. Fechar no commit, como combinado.
4. Mantida da rodada 1: medir uma vez a recuperação depois do `healthy` e registrar o número, para o poll de `:102` passar a ser dimensionado em vez de herdado. Não bloqueia — o que este caso prova é exatamente-uma-vez, não latência.
5. Novo, sem violação hoje: com 240 s, o maior termo do pior caso é o laço dos 50 POSTs (até 50 s pelo teto de `:81`), não a espera. Se este `it` voltar a encostar no prazo um dia, é ali que a folga está.

## test-engineer · 3ª rodada · APROVADO · 2026-09-21 10:06:46 · `tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md`

Audit complete. I verified the diff since round 2 (three lines in the test, plus the document), recomputed the arithmetic myself, and checked the helper's default ceiling, the sibling document's claim, the vitest project config and the CI job caps. I edited nothing — only reads, `git diff` and `git status`.

**A conta, conferida de forma independente.** Termos com teto duro dentro do `it`, em `/home/joaquimdp/Documentos/git/Educa.ia/apps/despachante/test/redis-fora.int.test.ts`:

| Termo | Linha | Teto |
|---|---|---|
| laço dos 50 POSTs, 1 s asseverado por POST | `:81` | 50,0 s |
| poll do aviso de vaga indisponível | `:88` | 10,0 s |
| espera fixa antes de conferir `{ aguardando: 50 }` | `:93` | 1,5 s |
| `aguardarSaudavel('redis-fila')`, teto padrão | `:100` + `tools/testes/compose.ts:68` | 60,0 s |
| poll do `concluido === 50` | `:102` | 60,0 s |
| **soma** | | **181,5 s** |

A conta do prompt está certa, e o ponto que importa é a folga, não a soma: rodada 1 = 181,5 s contra 180 s (negativa, o risco que levantei); rodada 2 = 151,5 s contra 180 s (28,5 s); rodada 3 = 181,5 s contra 240 s (**58,5 s**). Subir a espera em 30 s e o prazo em 60 s deixa saldo de +30 s — a troca **resolve** o risco, não o move. E o pior caso agora falha legivelmente antes do prazo: se o container não subir, a espera estoura aos 60 s com ~121,5 s consumidos, e o vermelho é a mensagem de `tools/testes/compose.ts:79` (estado + 40 linhas de log), não "test timed out".

O único termo não modelado é a montagem (`BancadaDeFila`, boot do Nest, `escolaComSessao`, `compose stop` — cujo pior caso prático é a carência de 10 s do Docker — e o `app.close()` do `finally`, que conta). Ela cabe nos 58,5 s com margem larga; na rodada 2 cabia em 28,5 s e ninguém reclamou, porque a espera típica é 6,5–11,2 s, não 60. Contra o cap do job (`.github/workflows/ci.yml:37`, 20 min para uma suíte de ~5 min), +60 s de pior caso é irrelevante.

O ponto 3 confere: `tasks/correcoes/2026-09-20-reconciliacao-espera-o-redis-subir-dentro-do-orcamento.md:44-50` traz a tabela medida (11.180 ms sob contenção total) e, logo depois, a frase "no runner da esteira a subida sozinha passa dos 30 s" sem número que a sustente — é inferência mesmo, e o novo documento a registra como tal em vez de silenciar.

```
VEREDITO: APROVADO

Cenários exigidos (rodada 3, só o que o diff afeta):
- a aritmética do pior caso cabe no prazo do caso, com folga demonstrável
- a falha do container continua legível (mensagem do serviço, não "test timed out")
- nenhuma asserção do caso muda com a troca do teto
- o teto de espera não nasce vermelho num runner mais lento que esta máquina
- o registro diz o que foi medido e o que foi inferido

Cobertos:
- 181,5 s de termos com teto duro contra 240 s (:113): folga de 58,5 s, contra 28,5 s na rodada 2
  e -1,5 s na rodada 1. Conferido termo a termo (:81, :88, :93, :100, :102)
- :100 volta ao teto padrão de 60 s (tools/testes/compose.ts:68), igual aos outros 28 usos; a
  falha sai por tools/testes/compose.ts:79 com estado e 40 linhas de log
- diff puramente aditivo/numérico: :94, :95, :87-91, :102, :105-106 intactos. `aguardarSaudavel`
  só roda `docker compose ps` — não fala com despachante, worker nem `job_registro`, e não há
  como fazer o caso passar vazio. Apague a recuperação do despachante e :102 continua vermelho
- a contradição com o documento irmão desaparece: o teto de 60 s não depende de nenhuma
  estimativa do runner, medida ou inferida
- 2026-09-21-...md:58-62 registra a inferência como inferência, com os números medidos (11,2 s
  sob contenção, ~6,5 s na esteira, execução 35517746419)

Bloqueantes: nenhum.

Recomendações:
1. tasks/correcoes/2026-09-21-redis-fora-mede-a-subida-do-container.md:43-44 — a abertura da seção
   "Correção" ainda diz que o conserto é `await aguardarSaudavel('redis-fila', 30_000)`, que é
   exatamente a forma revertida oito linhas abaixo (:51-62) e não é o que está no código (:100).
   Corrigir antes do commit: é a mesma falha que esta rodada existe para consertar — um número
   errado parado num documento que alguém vai ler daqui a seis meses e citar como fato.
2. :110-112 — o comentário justifica o 240 s, mas não mostra a conta. Uma linha com a soma
   (50 + 10 + 1,5 + 60 + 60 = 181,5 s, mais a montagem) poupa a próxima pessoa de refazê-la, e é
   o que impede o número de ser apertado de novo por palpite.
3. Mantida da rodada 1 (recomendação 1): medir uma vez a recuperação depois do `healthy` e
   registrar o número. O que este caso prova é exatamente-uma-vez, não latência, então 60 s de
   poll não escondem a regra — mas a metade "orçamento dimensionado por medição" do aprendizado
   segue pendente, e está no TODO (:49).
4. Mantida da rodada 1 (recomendação 3), para o commit da retrospectiva, não para este:
   `CHAMADAS_DE_COMPOSE` em tools/guardas/regras-teste.mjs deixa `composeAssincrono` e
   `composeAssincronoCom` de fora. Hoje não há violação escondida; é furo para a próxima vez.
```
