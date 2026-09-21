# Tech Spec — Estabilidade da esteira

**PRD:** `tasks/prd-estabilidade-da-esteira/prd.md`
**Status:** rascunho (rodada 4 do `/revisar-spec`, 21/09/2026; **REPROVADA**, não implementado)

**Aceite de tamanho:** 2.157 palavras, acima do teto de 2.000. O excesso é conteúdo que as quatro
rodadas de revisão acrescentaram e verificaram no código — as quatro candidatas do 503, os seis
sítios de chamada do helper, o mascaramento do `lb_try_duration` e a lacuna de instrumentação —, e
cortá-lo desfaria exatamente o que a revisão comprou. **Aceite pendente:** quem retomar o trabalho
decide entre aceitar o excesso por escrito aqui ou encolher a spec; até lá, o teto segue estourado e
é achado aberto da revisão.

## 1. Resumo da abordagem

**A medição vem primeiro:** quatro rodadas de revisão derrubaram três explicações minhas para o 503
(PRD, seção 1). Ficou uma **classe estabelecida** e uma **causa não estabelecida**.

**A classe:** espera fixa onde deveria haver condição observável, em `infra/test/borda.int.test.ts`.
O `aguardarSaudavel` lê a saúde do **contêiner**; quem decide se o pedido chega ao upstream é a
**borda**. Trocar por condição observada é certo **independentemente** da causa — mas não é o
conserto do vermelho enquanto a medição não disser que é.

## 2. Módulos afetados

| Arquivo | O que muda |
|---|---|
| `infra/test/borda.int.test.ts` | as três esperas inline (`:270`, `:317`, `:358`) e o helper (`:93-96`, seis chamadas) passam a usar condição observada; `VOLTA_AO_BALANCEAMENTO_MS` vira teto. E `Resultado`/`inesperados`/`:426` ganham instante, para o RF1 |
| `tools/ci/borda.test.ts` | ganha a relação da **volta** ao pool; hoje só prende a da saída (`:47-51`) |
| `tools/processo/portao-local.ts` | ordem das suítes (passo barato do RF4) |
| `tools/testes/integracao.setup.ts` | impõe o estado de entrada do projeto `infra` (RF4) |
| `tools/ci/e2e.ts` | lista explícita de serviços (RF5) |
| `infra/compose.yml` ou sobreposição de teste | destino OTLP no e2e, se `observabilidade` sair (RF5) |
| `tools/guardas/` | guardas de resultado para RF4 e RF5 e, se virar requisito, para `workers` |
| `docs/runbook.md` | parágrafo novo, se a etapa 3 concluir defeito de produto (regra 80, item 10) |
| `.github/workflows/ci.yml` | job próprio para a repetição do RF8 |

Nada em código de produto — **exceto** se o RF3 concluir defeito da borda, e aí entram `infra/Caddyfile`,
`tools/ci/borda.test.ts` e um parágrafo de `docs/runbook.md`.

## 3. Modelo de dados · 4. API — não se aplicam.

## 5. Fluxo

### Etapa 1 — linha de base (RF1)

**É a tarefa 1.0, e nenhuma outra commita antes dela.** "Sete numa sessão" não é taxa. Medir por job
e no portão local, registrando para cada 503 **o instante, o estado do pool (log `sonda`) e o
método** — sem os três, as quatro candidatas não se separam, porque `handle_errors` devolve 502, 503
e 504 como o mesmo 503. **Instrumentar primeiro:** hoje `Resultado` (`:98-102`) não tem carimbo de
tempo e `inesperados` (`:167-176`) descarta ordem — não há contra o que correlacionar a transição do
`sonda`. Separar também o 503 da aplicação (guarda de sessão, semáforo de hash), que usa o mesmo
envelope. A saída é documento commitado, e as tarefas seguintes **citam o número de lá**.

Mede também as perguntas em aberto do PRD: custo do `observabilidade` no e2e (tempo de job, pico de
CPU e **saída no SIGTERM**, com limiar), e se `workers` muda a **estabilidade** ou só a duração.

### Etapa 2 — trocar espera fixa por condição observada (RF2)

**Inventário completo:** três esperas inline (`:270`, `:317`, `:358`) mais o helper `:93-96`, que é
chamado de **seis** lugares (`:297`, `:484`, `:492`, `:499`, `:547`, `:548`). Consertar quatro e
deixar cinco é o risco. Todos passam por um helper só, que espera a **borda** readmitir o upstream. Vale para
`SERVICOS_ATRAS_DA_BORDA` (`:23`); redis, storage e fila continuam em `aguardarSaudavel`. O prazo
vira **teto com erro legível**, não medida de sucesso.

**A condição:** estado por upstream pela API de administração (`admin 127.0.0.1:2019`, por
`compose exec borda`); alternativa, o log `sonda`, lido por `compose logs --since` do instante do
`start`. A prova "da lacuna" (admin fora do pool antes, no pool depois) **não conta como positiva**:
a segunda metade lê o mesmo sinal que a condição esperou.

**Prova, em duas asserções — e a positiva é declarada por sítio**, porque não existe um
discriminador único: `lb_policy cookie` está só no bloco do realtime (`Caddyfile:61`); o da API usa a
política padrão, então nos sítios de API um 200 pela borda não diz qual instância atendeu.

- **realtime (`:358`):** pedido com o cookie capturado **antes** do `stop`, e asserção de que a
  resposta **não** reescreve `educa_realtime` — a reescrita prova que a borda caiu na outra instância
  (é o que `:438` já prova);
- **API (`:270`, `:297`, `:317`):** manter a outra instância parada durante a asserção, de modo que um
  200 na primeira tentativa só possa ter vindo da restaurada;
- **onde nenhuma couber:** a prova é a da **lacuna** (admin diz "fora do pool" logo após
  `aguardarSaudavel`, "no pool" depois do helper), sem asserção pela borda;
- **mutação:** removida a condição, o handshake falha em **≥ 8 de 10** execuções mutadas.

A metade negativa vale **só** onde o pool fica vazio — `:358` **e `:547`** —; nos sítios de API é
falsa, porque a outra instância está de pé.

**Limite conhecido destas asserções, e é bloqueante aberto** (rodada 4 do `test-engineer`):
`lb_try_duration 5s` faz a borda repetir a seleção internamente e devolver 200, então "atendido na
primeira tentativa" **não é observável de fora** — uma condição que retorne 2 s cedo passa nas três.
Fechar isso exige prazo de cliente declarado e bem abaixo de 5 s, ou asserção sobre o tempo medido
contra limiar escrito. E a positiva do realtime precisa ser **conjunção** (handshake bem-sucedido
**e** ausência de reescrita do cookie), porque `handle_errors` responde sem `Set-Cookie`: "não
reescreveu" é verdade num 503, o estado que ela deveria excluir.

### Etapa 3 — separar os estados do 503 (RF3)

A pergunta "aceitável ou defeito" é indecidível como estava: junta estados sem nada em comum. A
medição do RF1 diz qual se aplica:

- **(a) um upstream voltando, o outro atendendo.** Não deveria existir 503: se existir, é **defeito
  de produto** e vira tarefa desta funcionalidade, antes da etapa 5.
- **(b) pool vazio, os dois upstreams fora.** O 503 é inevitável; a alavanca é `lb_try_duration`
  (5 s) × janela de readmissão. Em produção é o restart do pool inteiro, que a regra 80, item 9, já
  põe fora do horário letivo — trabalho do teste, não do produto.
- **(c) requisição não repetível contra upstream no pool.** A borda repete GET, **não repete POST**
  (`borda.int.test.ts:105-106`), e foi POST que falhou: `lb_try_duration` não cobre nada, e a alavanca
  é drenagem e keepalive. **É produto** — o mesmo caminho é o POST do aluno salvando resposta de prova
  numa rolagem (regra 80, item 6).

`handle_errors 502 503 504` devolve os três como 503 com o mesmo envelope: quem separa (a), (b) e (c)
é o log `sonda` mais o método da requisição.

O teste **não é desligado** enquanto isso (regra 40; D52).

### Etapa 4 — tirar a disputa que a suíte cria (RF4, RF5)

**RF4 — o requisito é o estado de entrada, não a ordem.** O acoplamento está em `:363-367`, que monta
o conjunto a parar a partir de `ps --status running`: rodar `test:e2e` e depois `test:infra` na mão
— o laço de quem conserta teste de infra, e `test:e2e` tem `--manter-ambiente` fixo — reproduz a
herança. O projeto `infra` passa a **declarar e impor** o estado de entrada no `globalSetup`, parando
o que não está no conjunto declarado.

**A prova fabrica o estado sujo:** sobe serviço fora do conjunto, roda a imposição, afirma que ele foi
parado e que não entra no conjunto de `:363-367`. Guarda que só afirma o estado passa por construção
em runner limpo — é o achado H da rodada 1 de volta. Decidir também o que muda **durante** o projeto: `alertas.int.test.ts:87` sobe `redis-cache` e não o
para; `metricas.int.test.ts:87` para os processos da fila e nunca os religa; e `vitest.config.ts` não
declara `sequence.sequencer`, então a ordem dos arquivos não é estável. O `globalSetup` roda **uma
vez**, não cobre isso — ou `:363-367` passa a usar conjunto declarado, e aí o RF4 cobre o mecanismo
inteiro.

Trocar a ordem no portão fica como **passo barato**, não requisito.

**RF5:** tirar `observabilidade` do e2e **só junto** com desligar o destino OTel ali.
`TELEMETRIA_OTLP_URL` aponta fixo para `observabilidade:4318` e é obrigatório
(`telemetria/iniciar.ts:28`); sem o serviço o nome não resolve, a consulta sai para o resolvedor da
máquina e **atrasa a saída no SIGTERM** (`borda.int.test.ts:238-243`) — que é o que os casos de
drenagem medem. Alternativa mais barata: destino que **falha rápido**.

### Etapa 5 — provar (RF8)

N e contenção saem da seção 6 do PRD e ficam escritos no documento da etapa 1 **antes** da rodada. A
prova principal é repetição por caso afetado (`vitest --repeats`, `--repeat-each` no `celular`); a
suíte inteira entra como amostra menor, em **job próprio**, fora do caminho do commit. Roda também
**no portão local com `--e2e --infra`**, que é onde três dos sete vermelhos aconteceram.

## 6. Isolamento · 7. Dado pessoal · 7b. Conformidade

Não se aplicam: sem query, sem dado de pessoa (ambiente sintético), sem nota nem tutor.

## 7c. Carga e falha (obrigatório)

Os testes que esta spec mexe provam a resiliência do produto: reduzir o custo deles tirando o que
provam perderia a prova. Se a etapa 3 cair na candidata (c), a regra 80 **item 6** vira objeto
direto — é o POST da resposta de prova, e a alavanca que a própria regra prescreve é **gravação
idempotente e reenvio no cliente**, não retentativa na borda (que seria escrita dupla, item 7).

## 8. Uso de IA · 9. Frontend

Nenhum. O `playwright.config.ts` pode mudar, mas os perfis `chromebook` e `celular` ficam como
estão (D51, regra 50).

## 10. Testes

| Cenário | Tipo | O que prova |
|---|---|---|
| condição removida do helper, 10 execuções | infra | o handshake falha em ≥ 8 — critério declarado (RF2) |
| positiva no realtime: cookie capturado antes do `stop` | infra | depois do helper, a resposta não reescreve `educa_realtime` — a borda não caiu na outra instância (RF2) |
| positiva na API: outra instância parada durante a asserção | infra | um 200 na primeira tentativa só pode ter vindo da restaurada (RF2) |
| `:361` seguido do handshake, sob contenção declarada | infra | a sequência que produzia 503 deixa de produzir (RF2) |
| ambiente efetivo do e2e | guarda | `compose ps --services --status running` sem `observabilidade` e igual à lista declarada — lista no fonte não prova, porque `up` sobe `depends_on` junto (RF5) |
| saída no SIGTERM, com e sem o coletor | infra | tirar o serviço não reintroduziu o atraso de DNS, contra o limiar da etapa 1 (RF5) |
| estado de entrada do projeto `infra`, com estado sujo fabricado | guarda | a imposição para o que está fora do conjunto declarado — não passa por construção (RF4) |
| `health_interval × health_passes ≤ lb_try_duration` | unidade | baixar `lb_try_duration` ou subir `health_interval` fica vermelho antes de ressuscitar o flake (RF9) |
| saída do pool: instância viva porém lenta | infra | candidata 2 do PRD, que o RF2 **não** cobre — cenário, ou decisão escrita de descarte pela medição |
| duas execuções na mesma máquina | guarda | projeto e portas fixas colidem; falha cedo e legível, em vez de poluir a linha de base |
| estouro de prazo forçado | infra | a mensagem nomeia o serviço ou o passo (RF6) |
| caso que passa na segunda tentativa | guarda | ele aparece no registro de flake; se não aparecer, vermelho (RF7) |
| repetição por caso afetado, N declarado | infra/e2e | RF8, com critério fixo antes do resultado |

**RF1 e RF3 não têm linha** de propósito: provam-se por documento commitado e decisão escrita.

**Cuidado declarado:** teste de ausência de flake é probabilístico — N declarado e critério fixo,
nunca "rodei e passou". E a guarda de `observabilidade` vale só para a lista do job de e2e:
`metricas`, `alertas` e `borda.int.test.ts:238` sobem o serviço de propósito.

## 11. Conformidade com as regras

**Regra 40** é o que este trabalho defende: sem `.skip`, sem retentativa silenciosa. **Regra 80**: os
testes de resiliência seguem provando o que provam, e a etapa 3 pode virar trabalho direto dela
(item 6, resposta de prova). **Regra 20**: ambiente sintético. **D52**: a engrenagem hoje emperrada.

## 12. Premissas não verificadas

1. **Que a espera fixa é a causa do vermelho.** Não está estabelecida; a configuração a contradiz.
2. **Que tirar `observabilidade` compensa.** Rende 1 dos 19 serviços e tem o acoplamento do OTel.
3. **Que fixar `workers` traz estabilidade.** Pergunta em aberto do PRD.
4. **Que os demais vermelhos têm a mesma causa.** A linha de base dirá.
5. **Que as asserções positivas do RF2 são suficientes.** A rodada 4 mostrou que não, enquanto o
   prazo de cliente e o limiar de tempo não estiverem escritos — é bloqueante aberto.

## 13. Riscos técnicos

- **Corrigir o sintoma e achar que acabou.** O critério de pronto é o RF8 com N declarado
- **A etapa 3 cair na candidata (c)** e o escopo virar produto — desfecho legítimo
- **Colisão de duas execuções na mesma máquina** poluir a linha de base (tem guarda)
- **A etapa 1 não achar causa determinística.** Aí o RF8 diz se sobrou
