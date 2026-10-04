# Correção — o job único de e2e voltou a bater no teto de 45 min sem nenhum teste vermelho

**Origem:** esteira run 37158950722 (commit `f075b44`) e run 37165931582 (commit `edd6f51`)
**Subagentes obrigatórios:** `infra-guardian` (esteira e ambiente)
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

O job "e2e (compose completo e Playwright)" de `.github/workflows/ci.yml` foi cancelado pelo
`timeout-minutes: 45` duas vezes seguidas, com a suíte verde até o corte:

| Execução | Commit | Casos terminados | Vermelhos | Resultado |
|---|---|---|---|---|
| 37158950722 | `f075b44` | 382 de 394 | 0 | `cancelled` aos 45 min |
| 37165931582, 1ª tentativa | `edd6f51` | 380 de 394 | 0 | `cancelled` aos 45 min |
| 37165931582, 2ª tentativa (só o job) | `edd6f51` | 394 de 394 | 0 | verde em 39 min |

Antes delas, a 37149724573 levou ~41,5 min. A correção `2026-10-02-teto-do-e2e-na-esteira` subiu o
teto de 30 para 45 min e registrou que ele seria alcançado entre 375 e 400 casos: foi em 394.

## Causa

**É o tempo, de novo, e agora sem número que resolva.** A suíte cresceu de 304 para 394 casos desde a
correção anterior, e um job único com 2 trabalhadores no runner não tem para onde crescer.

Pelos carimbos das duas tentativas da execução 37165931582 (mesmo commit, mesmos 394 casos):

| Trecho | 1ª tentativa (cancelada) | 2ª tentativa (verde) |
|---|---|---|
| preparo, navegador, build, subir o compose | 3 min 06 s | 2 min 26 s |
| testes | 42 min 07 s, até o caso 380, e cortado | 36 min 27 s (`394 passed (36.5m)`) |
| relógio por caso | **6,65 s** | 5,55 s |
| job inteiro | 45 min (teto) | 39 min |

A mesma suíte variou 5 min 40 s entre duas tentativas. Com o job inteiro a 39 a 47 min, qualquer teto
abaixo de uns 55 min cancela de vez em quando, e qualquer teto acima dele é alcançado de novo em duas ou
três tarefas de tela: a A2 traz mais telas.

**A guarda não pegou, e por dois motivos.** `tools/ci/esteira.test.ts` estimava `teto(4 + casos × 6 s)`
e comparava com o teto inteiro: 394 casos davam 44 min ≤ 45, verde. Os 6 s por caso já estavam abaixo do
medido (6,65 s na tentativa cancelada), e comparar com 100% do teto não deixa folga nenhuma para a
variação do runner, que é de minutos. A guarda só reprovaria a partir de 411 casos, já depois do estouro.
E o aviso que a correção anterior recomendou (avisar quando a etapa de testes passasse de um limiar) não
foi feito: a execução 37149724573, de ~41,5 min, passou verde sem chamar ninguém.

**Repartir resolve, e a divisão por projeto não basta.** Pesos por fatia, somando a duração de cada caso
nos dois logs e repartindo como o Playwright reparte (`npx playwright test --list --shard=<i>/<n>`),
dividido pelos 2 trabalhadores, mais ~3 min fixos:

| Divisão | Casos por fatia | Pior fatia (2ª tentativa) | Pior fatia (1ª, a lenta) | Do teto de 45 |
|---|---|---|---|---|
| por projeto (`chromebook`, `celular`) | 196 | 18,9 + 3 = ~22 min | 23,3 + 3 = ~26 min | **49% a 58%** |
| `--shard` em 3 | 131 a 132 | 13,7 + 3 = ~17 min | 17,1 + 3 = ~20 min | 38% a 45% |
| `--shard` em 4 | 98 a 99 | 9,6 + 3 = ~13 min | 12,7 + 3 = ~16 min | **28% a 36%** |

A matriz por projeto encosta nos 60% já hoje, com a suíte de agora, e não tem como crescer: o número de
projetos é fixo pela D51. O `--shard` reparte por contagem (`fullyParallel: true`), e o número de fatias
cresce com a suíte. Quatro fatias deixam a pior a ~16 min no runner lento, abaixo de 40% do teto, com
espaço para a A2 dobrar a suíte antes de a guarda pedir a quinta.

**Dependência entre specs.** Não há `globalSetup`, `beforeAll` com estado nem `describe.serial` em
`e2e/`; cada caso cria a escola e as pessoas de que precisa, e a suíte já roda com `fullyParallel` em
trabalhadores independentes, sem ordem garantida. Com fatias, cada uma sobe o compose com o banco vazio
e roda só a parte dela: a evidência de que nada depende de outro spec ter rodado antes é cada fatia
verde sozinha, na máquina e na esteira (seção "Correção").

O que **não** é causa, conferido: nenhum caso falhou nas duas tentativas canceladas (sem `✘` no log), o
compose subiu no tempo de sempre, e os outros três jobs passaram nas duas execuções.

## Teste que reproduz

`tools/ci/esteira.test.ts` › **"o teto do e2e cobre a suíte que existe, fatia a fatia e com folga:
estourado, a esteira cancela o job sem nenhum teste vermelho"**.

O vermelho original é a execução cancelada, que não se repete na máquina (aqui o e2e roda com mais
trabalhadores e sem teto). A evidência substituta é a da correção anterior, com a conta corrigida: a
guarda pergunta ao Playwright quantos casos cada fatia da matriz do job vai rodar
(`npx playwright test --list --shard=<i>/<n>`; sem matriz, a suíte inteira) e exige que o custo
estimado de cada uma caiba em **60% do teto**:

```
minutos = teto(4 + casos × 7 s / 60)        precisa ser ≤ 0,6 × timeout-minutes do e2e
```

As constantes moram em `tools/ci/prazo-do-e2e.ts`, usado também pelo `e2e.ts`. Os 7 s por caso vêm dos
6,65 s medidos na tentativa cancelada, arredondados para cima (eram 6). A guarda também confere que as
fatias juntas são a suíte inteira (nenhum caso some nem roda duas vezes).

| Configuração | Casos na pior fatia | Conta | Guarda |
|---|---|---|---|
| job único, teto 45 (como estava), guarda antiga (6 s, 100% do teto) | 394 | 44 min ≤ 45 | ✅ — o furo: verde e cancelada na esteira |
| job único, teto 45 (como estava), guarda nova | 394 | 50 min > 27 | ❌ `expected 50 to be less than or equal to 27` |
| matriz em 4, teto 45 | 99 | 16 min ≤ 27 | ✅ |

O vermelho da segunda linha foi rodado sobre o `ci.yml` de antes da correção, com a guarda nova.

## Correção

**O e2e roda em quatro fatias paralelas** (decisão do orquestrador, com a delegação do Joaquim), cada
uma num job próprio, com o seu runner e o seu compose:

- `.github/workflows/ci.yml`, job `e2e`: `strategy.matrix.fatia: [1, 2, 3, 4]`, `fail-fast: false`
  (uma fatia vermelha não cancela as outras nem o traço delas), nome `e2e <i>/4 (…)`, passo
  `npm run ci:e2e -- --shard=${{ matrix.fatia }}/4` e artefato `traco-do-e2e-${{ matrix.fatia }}`, um
  por fatia. O `timeout-minutes: 45` ficou, e agora é de cada fatia: a pior delas fica abaixo de 40%
  dele. O comentário diz que o sinal pede fatia, não teto maior.
- `tools/ci/prazo-do-e2e.ts` (novo): as constantes da conta (4 min fixos, 7 s por caso, 60% de folga),
  o teto lido do próprio workflow, o limiar da etapa de testes (60% do teto menos o custo fixo: 23 min
  num teto de 45), o aviso, a leitura de `--shard=<i>/<n>` (malformado reprova antes de subir
  qualquer coisa) e a etapa dos testes com o aviso ligado.
- `tools/ci/e2e.ts`: passa a fatia ao Playwright e, quando a etapa de testes passa do limiar, escreve
  `::warning title=e2e perto do teto::…`, que vira anotação no resumo da execução, verde ou vermelha.
  É a recomendação da correção anterior que tinha ficado para o `/retro`. Sem `--shard`, a suíte
  inteira, como o `npm run test:e2e` da máquina. A lista de etapas é montada por `etapasDoE2e`, em
  `prazo-do-e2e.ts`, para o teste alcançar a lista que roda de verdade com o aviso ligado (bloqueante da
  1ª rodada do `test-engineer`). A anotação é sinal antecipado: no job cancelado pelo teto o processo
  morre antes de a etapa terminar, e ela não sai; aí o sinal é o próprio cancelamento.
- `tools/ci/executar.ts`: a etapa ganhou `aoTerminar(codigo, duracaoMs)`, chamado quando ela roda.
- Guardas em `tools/ci/esteira.test.ts`: a do teto (seção acima); a matriz é `1..n` sem buraco, e o
  `/n` do passo é o tamanho dela (uma fatia a menos na matriz é suíte que não roda, sem vermelho); a
  única expressão aceita no workflow é `${{ matrix.fatia }}`, que vem da lista fixa do próprio YAML
  (antes nenhuma era aceita); `fail-fast: false` e o nome com a fatia; o artefato com a fatia no nome.
  Testes novos em `prazo-do-e2e.test.ts`, `executar.test.ts` e `scripts.test.ts`.
- `docs/runbook.md`, "Esteira vermelha no e2e": as fatias, o artefato por fatia, repetir só uma fatia
  na máquina, e os dois sinais antes do cancelamento (a guarda e a anotação), com a saída: mais fatias.
  `README.md`: a linha do `ci:e2e` diz que a esteira o roda em fatias. `docs/infra.md` não descreve o
  job e não mudou.

**O passo 7 da `/executar-task` continua valendo.** Ele confere a `conclusion` da execução inteira
(`gh run list --json conclusion`), e a execução de um workflow com matriz só fica `success` com todos os
jobs dela `success`; uma fatia `failure` ou `cancelled` deixa a execução `failure` ou `cancelled`. Com
`fail-fast: false`, as outras fatias ainda terminam, e o vermelho de cada uma aparece.

**Cada fatia sozinha, na máquina**, com `node tools/ci/e2e.ts --shard=<i>/4`, compose subido limpo e
derrubado entre uma e outra (o mesmo que a esteira faz):

| Fatia | Casos | Testes | Job local (com subir e derrubar) | Resultado |
|---|---|---|---|---|
| 1/4 | 99 | 3,0 min | 3 min 31 s | `99 passed` |
| 2/4 | 99 | 3,5 min | 4 min 07 s | `99 passed` |
| 3/4 | 98 | 3,1 min | 3 min 47 s | `98 passed` |
| 4/4 | 98 | 3,0 min | 3 min 38 s | `98 passed` |

As quatro somam os 394 casos, todas verdes com o banco vazio e sem nenhum outro spec antes: nenhum caso
depende de estado deixado por outro na partição de hoje. Spec novo ou fatia a mais trocam casos de
fatia; daí em diante quem segura é a própria esteira, em que cada fatia começa com o banco vazio.

**Esteira desta correção:** execução 37173864338 (commit `b55842e`), `success` na 1ª tentativa, sem
rerun, e nenhuma anotação "e2e perto do teto".

| Fatia | Casos | Testes | Job inteiro | Do teto de 45 |
|---|---|---|---|---|
| 1/4 | 99 | 10,4 min | 13 min 47 s | 31% |
| 2/4 | 99 | 11,6 min | 14 min 51 s | **33%** (a mais lenta) |
| 3/4 | 98 | 9,4 min | 12 min 44 s | 28% |
| 4/4 | 98 | 9,7 min | 12 min 35 s | 28% |

A pior fatia levou 14 min 51 s, contra os ~13 a ~16 min estimados pelos logs, e a etapa de testes
ficou a 11,6 min do limiar de 23 min. O job `infra` (29 min 50 s) passou a ser o mais longo da execução.

## Recomendações sem aplicar

| Recomendação | Destino |
|---|---|
| Grupo de `concurrency` com `cancel-in-progress` na `develop`, para não deixar quatro composes rodando sobre um commit já substituído. Precisa de uma expressão (`github.ref`) que a guarda hoje recusa (`infra-guardian` 1, rec. 3) | `/retro` da A1: decisão à parte, que amplia a superfície de expressão do workflow |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-03 23:20:19 | 2026-10-03 23:21:36 | `test-engineer` | 1 | REPROVADO | a5c57a7d86d8f60b5 |
| 2026-10-03 23:22:54 | 2026-10-03 23:23:47 | `test-engineer` | 2 | APROVADO | a5c57a7d86d8f60b5 |
| 2026-10-03 23:24:01 | 2026-10-03 23:25:05 | `infra-guardian` | 1 | APROVADO | a021a5b5e5a2c73d9 |
| 2026-10-03 23:33:18 | 2026-10-03 23:33:41 | `test-engineer` | 3 | APROVADO | a5c57a7d86d8f60b5 |
| 2026-10-03 23:33:51 | 2026-10-03 23:34:12 | `infra-guardian` | 2 | APROVADO | a021a5b5e5a2c73d9 |
