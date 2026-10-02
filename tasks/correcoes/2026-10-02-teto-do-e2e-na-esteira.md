# Correção — o teto de 30 min do job de e2e cancelava a esteira sem nenhum teste vermelho

**Origem:** esteira run 36964887709 (commit `baf332e`, tarefa 13.0 da A1)
**Subagentes obrigatórios:** `infra-guardian` (esteira e ambiente)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

Na execução 36964887709, o job "e2e (compose completo e Playwright)" terminou `cancelled`, e a
execução inteira com ele. Os outros três jobs passaram (`verificar`, `integração`, `infra`).

```
2026-10-02T05:01:03Z   ✓  286 [celular] › e2e/operacao.spec.ts:185:3 › … (7.6s)
2026-10-02T05:01:12Z ##[error]The operation was canceled.
```

286 dos 304 casos tinham terminado, **todos verdes**: nenhum `✘` no log. O job começou às 04:30:59 e
foi cancelado às 05:01:12, que é o `timeout-minutes: 30` de `.github/workflows/ci.yml`.

Pela regra do passo 7 da `/executar-task`, `cancelled` segura a tarefa seguinte como qualquer
vermelho. Só que aqui não há teste para consertar: a suíte passa, e não cabe.

## Causa

**É o tempo, e não uma espera presa.** A suíte de e2e cresce a cada tarefa de tela e o teto do job
ficou parado em 30 min.

Para onde foram os 30 min da execução cancelada, pelos carimbos do log:

| Trecho | Início | Duração | Do teto |
|---|---|---|---|
| preparo do job (checkout, Node, `npm ci`) | 04:30:59 | 18 s | 1,0% |
| navegador do Playwright | 04:31:17 | 22 s | 1,2% |
| build da web e teto do bundle | 04:31:39 | 2 s | 0,1% |
| **subir o compose completo** | 04:31:41 | **2 min 35 s** | **8,6%** |
| **testes** (até o cancelamento) | 04:34:19 | **26 min 53 s** | **89,6%** |

Antes do primeiro teste vão 3 min 18 s; a subida do compose é a maior parte disso. O resto é teste.

Faltavam 18 casos, todos do `celular` (`operacao`, `tokens`, `troca-de-escola`), que na execução
anterior somaram 154 s de caso, ou ~77 s de relógio com os 2 trabalhadores do runner. Com mais ~10 s
para derrubar o ambiente, o job terminaria em **~31 min 40 s**: passou do teto por um minuto e meio.

**O runner não estava lento.** Os 266 casos comuns à execução anterior (36328693912, `403a551`)
somaram 2.643 s nesta e 2.737 s naquela: 3% mais rápidos. O que cresceu foi a suíte: os 20 casos de
`e2e/estrutura.spec.ts`, da tarefa 13.0, somaram 555 s (27,7 s por caso, contra 10,2 s da média de
antes), que são 4 min 38 s de relógio.

A série das execuções verdes mostra o teto chegando, sem nada que avisasse:

| Execução | Commit | Casos | Testes | Job inteiro |
|---|---|---|---|---|
| 36261222426 | `e77f6ff` | 226 | 19,6 min | 22 min 35 s |
| 36293941357 | `6a220a4` | 226 | 20,5 min | 24 min 05 s |
| 36299627969 | `c2a01c7` | 226 | 19,0 min | 21 min 56 s |
| 36307497313 | `3aeec3b` | 226 | 19,5 min | 22 min 36 s |
| 36313587368 | `7a5b87d` | 226 | 20,0 min | 23 min 21 s |
| 36322867730 | `f7dce30` | 260 | 22,8 min | 26 min 02 s |
| 36328693912 | `403a551` | 284 | 24,2 min | 27 min 21 s |
| 36964887709 | `baf332e` | 304 | 26,9 min até o caso 286 | cancelado aos 30 min |

De 5,0 a 5,6 s de relógio por caso, e de 2 min 43 s a 3 min 37 s de custo fixo (preparo, navegador,
build, compose, derrubada). Nenhuma guarda ligava o tamanho da suíte ao teto: `tools/ci/esteira.test.ts`
só afirmava que o job **tinha** prazo (`toBeGreaterThan(0)`), e o estouro só aparecia depois de
30 min de esteira, como cancelamento.

O que **não** é causa, conferido: nenhum caso falhou nem ficou preso (o mais longo dos 286 levou
1,2 min, a paginação da lista de nomes em `estrutura.spec.ts`, e o último terminou 8 s antes do
corte), o compose subiu no tempo de sempre, e os outros três jobs da mesma execução passaram.

## Teste que reproduz

`tools/ci/esteira.test.ts` › **"o teto do e2e cobre a suíte que existe: estourado, a esteira cancela
o job sem nenhum teste vermelho"**.

O vermelho original é a própria execução cancelada, e ela não se repete na máquina: aqui o e2e roda
com mais trabalhadores e sem teto. O que se reproduz de forma determinística é a conta que faltava. O
teste pergunta ao Playwright quantos casos ele vai rodar (`npx playwright test --list`, pelos dois
projetos, 0,6 s) e compara o custo estimado no runner com o `timeout-minutes` do job de e2e:

```
minutos = teto(4 + casos × 6 s / 60)        precisa ser ≤ timeout-minutes do e2e
```

As duas constantes vêm da tabela da seção "Causa", arredondadas para cima: 4 min fixos (medido até
3 min 37 s) e 6 s de relógio por caso (medido até 5,6 s).

| `timeout-minutes` do e2e | Casos | Conta | Guarda |
|---|---|---|---|
| 30 (como estava) | 334, a árvore de agora | 38 min | ❌ `expected 38 to be less than or equal to 30` |
| 30 (como estava) | 304, o commit `baf332e` | 35 min | ❌ pela mesma conta |
| 37 (mutação de fronteira) | 334 | 38 min | ❌ `expected 38 to be less than or equal to 37` |
| 45 | 334 | 38 min | ✅ 10 de 10 no arquivo |

A linha dos 304 casos é aritmética sobre o número que o log da execução cancelada imprime
(`Running 304 tests using 2 workers`): a árvore de agora já tem os 334 da tarefa 14.0, ainda sem
commit, e não foi mexida para medir.

Se a contagem falhar (o Playwright não lista, ou a linha `Total:` muda de formato), o teste reprova
em vez de passar com zero casos: `expect(casos).toBeGreaterThan(0)`, e `NaN` não é maior que zero.

**O limite desta guarda, dito por extenso.** Ela conta caso, não peso. É piso, não previsão: caso de
tela com muita ida à API custa mais que os 6 s (os de `estrutura.spec.ts` saíram a 13,9 s de
relógio), e uma sequência deles estoura o teto de verdade antes de a conta daqui passar dele. O que
ela fecha é o caso certo: a suíte que não cabe nem pela média deixa de ser descoberta depois de
45 min de esteira.

## Correção

`.github/workflows/ci.yml`, job `e2e`: `timeout-minutes` de 30 para **45** (decisão do Joaquim, em
02/10/2026). O job não foi repartido em matriz e o Playwright não mudou.

Junto, o que citava o número antigo ou ficava sem dono:

- o comentário do passo de publicação do traço dizia "com `timeout-minutes: 30`"; agora cita o
  teto do job, sem o número, para não envelhecer de novo;
- o teto ganhou um comentário com a conta, como os de `integracao` e de `infra` já tinham;
- `docs/runbook.md`, seção "Esteira vermelha no e2e": um parágrafo sobre o job `cancelled` com a
  suíte verde — como reconhecer, por que repetir não resolve, que a guarda é piso e não previsão, e
  que a saída é decisão (subir o teto com a conta refeita, ou repartir o job), não baixar as
  constantes do teste.

Procurado e sem ocorrência do número: `tools/ci/` (fora o teste), `docs/infra.md` e o resto do
`docs/runbook.md`. O `timeout-minutes: 45` do job `infra` é outro teto, já existia e não foi tocado.

## A folga dos 45 min

O job custa o tempo de caso somado, dividido por 2 (os trabalhadores do runner), mais os ~3 min 30 s
fixos. Os 304 casos do commit `baf332e` somam 3.352 s no runner (3.198 s medidos nos 286 que rodaram,
mais 154 s dos 18 que faltaram, pela execução anterior).

Para a 14.0 há medida, e não só hipótese: o portão local desta correção rodou os 334 casos da árvore
(`334 passed (8.9m)`, 6 trabalhadores), somando 3.165 s de caso. Nos 278 casos que existem nos dois
lados, o runner custa **1,22 vez** o tempo local (3.147 s contra 2.574 s). Os 334 casos dão então
~3.870 s no runner: os 30 casos que a 14.0 acrescenta custam uns 17 s cada, entre a média antiga
(10,2 s) e os da `estrutura` (27,7 s).

| Suíte | Casos | Job estimado | Folga em 45 min |
|---|---|---|---|
| commit `baf332e` (13.0), medido | 304 | ~31 min 40 s | 13 min (30%) |
| com a 14.0, pela medida local × 1,22 | 334 | **~36 min** | **9 min (20%)** |
| ~400 casos, os 66 seguintes na média antiga (10,2 s) | 400 | ~41 min | 4 min (8%) |
| ~400 casos, os 66 seguintes no peso dos da 14.0 (17 s) | 400 | ~45 min | **nenhuma** |
| ~400 casos, os 66 seguintes no peso dos da `estrutura` (27,7 s) | 400 | ~51 min | **não cabe** |

**45 min cobre esta correção e a 14.0, e não deixa folga para ~400 casos.** Depois da 14.0 sobram
uns 9 min, que são de 40 a 65 casos novos no peso que as telas da A1 têm tido (17 a 28 s por caso):
o teto volta a ser alcançado entre **375 e 400 casos**, isto é, entre a 16.0 e a 17.0 se cada uma
trouxer uns 25 casos. Só na média antiga os 400 cabem, e com 4 min, que é menos que a variação do
runner (o mesmo conjunto de 226 casos foi de 19,0 a 20,5 min de teste, e o custo fixo de 2 min 43 s
a 3 min 37 s).

O número decidido não foi mudado: fica registrado que ele compra duas ou três tarefas de tela, e não
o fim da A1. A guarda de `esteira.test.ts` reprova a partir de 411 casos, que é o limite pela média;
o estouro pelo peso aparece antes, na esteira, como job chegando a 5 min do teto, e é esse o sinal
que o runbook manda olhar. O que não foi feito aqui, por decisão: repartir o e2e em mais de um job,
que é o que tira o teto do caminho de vez.

## Recomendações dos revisores

Aplicadas em lote, depois das duas primeiras rodadas (as duas APROVADO, sem bloqueante):

- o comentário do teto no `ci.yml` e o parágrafo do runbook diziam que a guarda "reprova antes de a
  esteira cancelar", sem ressalva. Só vale pela média: os dois agora dizem que ela é piso e que caso
  pesado estoura o teto antes (`test-engineer` 1, `infra-guardian` 1);
- o runbook guardava "(45 min)" e "40 min" em texto, o mesmo envelhecimento que a correção tirou do
  comentário do YAML: o primeiro saiu, o segundo virou "5 min do teto" (`test-engineer` 3,
  `infra-guardian` 3);
- "custa o dobro" virou "mais que o dobro" no teste e no runbook: 13,9 s contra 5,0 a 5,6 s
  (`test-engineer` 4).

### Recomendações sem aplicar

| Recomendação | Destino |
|---|---|
| Dar reserva à guarda (`minutos ≤ teto − 5`): reprovaria a partir de 361 casos, perto de onde o teto estoura pelo peso, e anteciparia a próxima decisão para a 16.0 (`test-engineer` 1, saída B; `infra-guardian` 2) | **Decisão do Joaquim.** Muda quando o portão local de uma tarefa futura reprova, e ele decidiu só o número do teto. Vai no relatório desta correção |
| O sinal "job de e2e perto do teto" não tem quem olhe: o passo 7 da `/executar-task` confere só a `conclusion`, e execução verde de 43 min não chama ninguém. Conferir a duração no passo 7, ou `tools/ci/e2e.ts` avisar quando a etapa de testes passar do limiar (`test-engineer` 2, `infra-guardian` 2) | `/retro` da A1: é mudança de skill do processo, fora de uma correção de teto. Vai no relatório |
| Job `infra` da esteira: 29 a 30 min desde `3aeec3b` (tarefa 9.0), contra 22 a 23 min antes; teto de 45, sem guarda; e "uns 16 min" e "uns 11 min" vencidos em `ci.yml:54-55`, `vitest.config.ts:7`, `README.md:60` e `.claude/rules/40-testes.md:102` (`test-engineer` 5, `infra-guardian` 4) | Correção própria por `/corrigir`, antes da próxima tarefa que acrescentar teste com espera de relógio em `infra/**/*.int.test.ts`. A linha no `TODO.md` fica para o orquestrador: o arquivo está na árvore com alteração da 14.0, sem commit, e esta correção não pode levá-lo. Vai no relatório |
| `docs/runbook.md`: "reprova no portão local" está certo e incompleto, porque o teste é de unidade e reprova também no job `verificar` da esteira (2ª rodada, `test-engineer` e `infra-guardian`) | A correção do job `infra`, que mexe no mesmo `ci.yml` e na mesma seção do runbook. A frase não afirma nada falso, e o runbook conta como código para o carimbo |

Dito pelos dois revisores na 2ª rodada, e que vai no relatório com estas palavras: o `/retro` da A1 vem
depois da 17.0, e o teto é alcançado, pela conta acima, entre a 16.0 e a 17.0. Nessa janela, de 375 a
410 casos, nada avisa antes do cancelamento aos 45 min, a não ser a reserva na guarda, que é decisão
do Joaquim. O pior caso é um job cancelado que segura a tarefa seguinte, sem efeito em produto.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-02 07:08:37 | 2026-10-02 07:12:55 | `test-engineer` | 1 | APROVADO | a566d30ff67da8a69 |
| 2026-10-02 07:13:22 | 2026-10-02 07:17:25 | `infra-guardian` | 1 | APROVADO | a8d1222d86506066c |
| 2026-10-02 08:25:32 | 2026-10-02 08:26:25 | `test-engineer` | 2 | APROVADO | acdda940e231863f4 |
| 2026-10-02 08:25:52 | 2026-10-02 08:26:48 | `infra-guardian` | 2 | APROVADO | a9e56dd03ed481da1 |
