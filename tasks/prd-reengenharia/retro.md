# Retrospectiva — reengenharia (X5)

23/10/2026, pelo Arquiteto, no térreo, depois do pouso (`5566974`) com a esteira da `develop` verde (`39907941527`, depois
de reexecutar três e2e do `celular` que caíram). Comparação com a retrospectiva da X3 (`tasks/prd-telas-do-professor/retro.md`);
a X4 está congelada e não teve retrospectiva.

Condições que pesam nos números:

- a X5 é uma missão de reengenharia (`MISSAO.md`, Etapas 0 a 12), recortada em 22/10 de 94 para 36 tarefas, com o resto na X6
  (D81, `RECORTE.md`); de 22/10 10h55 ao pouso, **nenhuma parada chamou o Joaquim** (`RECORTE.md` §6) e o Arquiteto decidiu
  e registrou em `DECISOES.md` (R55 a R64);
- a **onda 0** (1.0, 2.0, 3.0, 93.0, 94.0) é classificação de linguagem natural (risco à vida, julgamento de texto de
  aluno) com alvo medido em corpus, e se comporta como outra espécie de tarefa: os números saem também separados;
- a **2.0 atravessou a noite de 21 para 22/10** no limite das três reprovações (00h50 → 07h31), e a medida do lote retido
  parou de novo às 08h15 (resposta B, `f794080`);
- a 95.0 (guia do desenvolvedor) foi escrita pelo "Claude Code #2", fora das linhas, e revista depois (validação, maior 1).

## Medidas

```
Tarefas: 36 · Rodadas de revisor: 239 · Reprovações: 51 (21,3%)
  onda 0 (1.0, 2.0, 3.0, 93.0, 94.0): 50 rodadas, 25 reprovações (50%)
  as outras 31: 189 rodadas, 26 reprovações (13,8%)
Por revisor: test-engineer 77/23 · revisor-geral 77/15 · tenancy-guardian 26/4 · infra-guardian 19/0
             conformidade-reviewer 14/6 · llm-integrator 11/0 · privacy-guardian 8/2 · frontend-reviewer 7/1
Por modelo do implementador: Sonnet nas 35 das linhas (a 95.0 foi do Claude Code #2), 6,6 rodadas por tarefa,
  1,4 reprovação por tarefa; escaladas com diagnóstico do Arquiteto em 2.0, 93.0 e 9.0, e bloqueio destravado em
  2.0 (Joaquim), 3.0 (recorte) e 9.0 (R62); mediana de 42 min da partida ao commit (31 tarefas com hora registrada)
Rodadas por tarefa: média 6,6, pior 3.0 com 16, depois 2.0 com 13 e 9.0 com 12
Rodadas que caducaram sem reprovação do próprio revisor: 69 de 239 (29%)
Correções fora de tarefa: 6, com 22 rodadas e 1 reprovação (ouro-base-qualitativa, porta-unica-so-import,
  intermitentes-desafio-e-meus-dados, poda-supressao-orfa, knip-exportacoes-na-esteira, shared-sem-entrada-na-integracao),
  mais 1 fechada sem commit (arquivo-do-titular-datas: o defeito era o despachante do compose de teste de pé)
Duração: construção de 21/10 20h01 ao último commit de tarefa em 23/10 00h10 (25.0); último commit com código 01h59
  (107fd56); pouso 02h49. Do commit da 3.0 (22/10 11h25) ao da 25.0 (23/10 00h09), 29 tarefas em 12 h 44: ~26 min
  por tarefa entregue
Revisão da spec (21/10): 33 rodadas de revisor, 25 não aprovadas, aprovada na 5ª
Ressalvas do /validar: rodada 1 REPROVADA (1 crítico, 1 maior); rodadas 2 e 3 APROVADAS
```

Como contei: as linhas da tabela "Revisões" dos 36 `N_task.md` e das correções do período, escritas pelo hook (rodada não
aprovada inclui AJUSTES NECESSÁRIOS); os blocos de `achados/` de cada reprovação; a partida e o fim de cada tarefa pela
coluna "Observação" de "Concluídas" no `estado.md` (sem hora: 2.0, 51.0, 14.0, 19.0, que falta na tabela, e 95.0); os
vermelhos por `gh run list` de `spec/reengenharia`, das três linhas e da `develop`, com os jobs de cada execução.

| | F3 | X1 | X2 | X3 | X5 |
|---|---|---|---|---|---|
| Tarefas | 20 | 15 | 14 | 14 | 36 |
| Reprovações nas tarefas | 22,9% | 23,8% | 22,4% | 15,3% | 21,3% (13,8% fora da onda 0) |
| Rodadas por tarefa | 11,8 | 8,1 | 8,3 | 8,4 | 6,6 |
| Caducadas sem reprovação | 34% | 31% | 28% | 33% | 29% |
| Revisão da spec, não aprovadas | 19 de 27 | 5 de 9 | 9 de 15 | 7 de 16 | 25 de 33 |
| Correções fora de tarefa | 9, e 2 falhas | 7 | 18, e 4 de encontro | 19, e 4 de encontro | 6, e 1 sem commit |
| Crítico ou maior no 1º /validar | 1 crítico e 2 maiores | 1 maior | 4 críticos e 1 maior | 4 críticos e 4 maiores | 1 crítico e 1 maior |
| Tarefas sem nenhuma reprovação | 1 de 20 | 4 de 15 | 2 de 14 | 4 de 14 | 15 de 36 |

## As cinco medidas da D79

**1. Da partida ao commit.** Mediana de **42 min**, contra ~112 na X3, 119 na X2 e 99 no F3. Com três linhas, 29 tarefas
em 12 h 44, perto de 26 min por tarefa entregue (66 na X3). Parte é a natureza da tarefa: a maioria da onda 1 e 2 era
mecânica (`git mv` e import por script, R51 a R54), com dois revisores e no máximo um guardião.

**2. Tarefas sem reprovação.** 15 de 36 (4 de 14 na X3).

**3. O grupo A.** **10 reprovações** de cláusula nova sem bloco de mutação (1.0, 3.0, 93.0 ×2, 51.0, 53.0, 19.0, 43.0, 48.0,
25.0), contra 8 na X3. Agora **todas de backend** (a P1 da X3 acrescentou as formas de tela). Em seis delas o revisor diz
o mesmo: "os testes que as pegariam existem; falta o bloco". Quatro rodadas de texto sobre isso (F1, F3, X1, X3) não
tiraram o número de perto de 10.

**4. Vermelhos da esteira por push.** Na `spec/reengenharia`, 91 execuções: **32 verdes, 15 vermelhas e 44 canceladas**,
quase todas pelo Orquestrador, à mão, por estarem superadas; nas três linhas, 42 (21, 14 e 7). Na construção, **quatro
defeitos de código só a esteira viu**: o `ouro` com a base nula depois da 3.0 (`ouro-base-qualitativa`), a supressão órfã
que nasceu do encontro da 13.0 com a 90.0 (`poda-supressao-orfa`, o crítico da validação), o knip do `ci:verificar` que
o `npx` rodava sem o `--include` (24.0) e o `@educa/shared` sem entrada no `globalSetup` da integração (25.0, verde na
linha porque ela tinha o `dist` construído). **O knip ficou vermelho de 23h29 a ~01h50**, atravessou o encontro da 25.0
e da 90.0 e as rodadas 1 e 2 da validação: o `esteira.ts` lê execução **cancelada** como VERMELHA, e com 44 canceladas o
vermelho deixou de ser sinal. O resto foi intermitente: `casca.spec.ts:67` [celular] (três vezes, de 18 a 151 ms acima dos
5 s), e2e e integração das linhas (`intermitentes-desafio-e-meus-dados`), datas vencidas em `arquivo-do-titular`.

**5. Do último commit ao pedido de pouso.** Perto de 50 min (01h59 → 02h49, já com o pouso feito, pelo recorte §6),
contra ~1 h na X3.

## Grupos de causa

As 51 reprovações das tarefas, cada uma num grupo só, mais o crítico e o maior da validação.

| # | Causa | Ocorrências | Onde | Onde evitar |
|---|---|---|---|---|
| L | Classificador de linguagem natural por padrão de texto: cada rodada fecha um furo e abre outro | 21 | 2.0 (9), 3.0 (7), 93.0 (5) | Tech Spec: o alvo foi medido no corpus lido para escrever os padrões, e "sem modelo" foi desenho até a resposta B (22/10 08h15) |
| C | Guarda nova (lint ou teste estrutural) com escape ou que se cala | 9 | 9.0 (5: `schema` reexportado, pacote como texto em outra posição), 12.0 (3: cerca que se cala se o arquivo cercado mudar de lugar), 24.0 (o teste não prova "sem buraco por configuração") | autoconferência e tabela de testes da tarefa de guarda |
| A | Cláusula nova sem bloco de mutação | 10 | 1.0, 3.0, 93.0 (2), 51.0, 53.0, 19.0, 43.0, 48.0, 25.0 | autoconferência, sem efeito em quatro rodadas de texto: precisa de máquina |
| D | Subtarefa marcada feita sem a evidência, ou decisão só no documento da tarefa | 5 | 36.0 (36.5, o `grep` dos nomes antigos), 97.0 (caminho velho numa AIA; o commit único só nos documentos de tarefa), 48.0 (48.1 sem o commit de caracterização), 14.0 (a divergência dizia que a Tech Spec não dizia) | autoconferência: a P4 da X3 pôs a subtarefa; faltou mostrar que ela foi feita |
| E | Defeito que só a revisão viu | 5 | 53.0 (limpeza no "Sair" só com a tela aberta, `privacy` e `revisor-geral`), 44.0 (a tela de Retenção ainda diz 7 dias), 94.0 (a frase que só o modelo pegou volta ao modelo sem teste), 16.0 (`/v1/sessao/matricula`) | é para isso que a revisão existe |
| — | Código morto e comentário errado | 1 | 96.0 (`RAIZES_DA_TRAVA`) | uma vez |
| — | Leitura "do HEAD" igual à do índice | 1 | 13.0 | uma vez |
| V1 | Encontro junta duas linhas verdes num lint vermelho | 1 (crítico da validação) | 13.0 × 90.0 | `linhas.ts encontro` |
| V2 | Documento sem "Revisões" no andar (95.0, fora das linhas) | 1 (maior da validação) | 95.0 | caso único: tarefa feita fora do processo |

**Falsos positivos.** Nenhum. Na onda 0 as reprovações repetidas parecem rigor, mas cada uma era uma frase real de risco que
escapava (bater e morder, "vão" e "iam", "chumbinho" depois de "pra rato") ou uma pergunta legítima barrada; o grupo L é
do desenho, não do revisor.

## Fora das reprovações

- **`esteira.ts` lê cancelada como vermelha.** Registrado três vezes no `estado.md` (18h13, 15h20, ~00h46) e contornado
  com `gh run list` à mão. Custou o knip vermelho por ~2 h 20 sem ninguém ver, e a validação rodou duas vezes sobre ele.
- **44 execuções canceladas à mão.** Cada push de documento na spec dispara as suítes inteiras; o Orquestrador cancelou em
  lote quatro vezes. O GitHub faz isso sozinho (`concurrency` com `cancel-in-progress`).
- **Mutação que trava segurou o `flock` de carga por 41 min** (19.0, 22/10 16h12): o `mutacoes.ts` roda o teste com
  `spawnSync` sem timeout e conta a morte do processo como vermelho, o que ainda faz a mutação parecer provada.
- **O portão não derruba os despachantes do compose de teste** antes da integração: o `worker-interativo` do
  `educa-teste-3`, de pé, consumia o job do teste, e virou uma DIVERGÊNCIA e uma correção fechada sem commit.
- **Falta `linhas.ts abandonar <n>`.** O Orquestrador soltou linha editando `.processo/linhas.json` à mão duas vezes.
- **Guarda com duas entradas.** O knip rodava pelo `guarda:dependencias` no portão e por outra linha de comando no
  `ci:verificar`: verde na máquina, vermelho na esteira.
- **"Já vale" com decisão de desenho aberta sobre o mesmo código** (as três pioras, 22/10): a correção ficou inútil com a
  resposta B. Lição do Orquestrador, já no `estado.md`; uma vez.
- Uma vez cada: a queda do `npm audit` por ~8 h (2.0); o merge de uma linha em outra que quebra o encontro (`7f6ed10`); a
  sugestão-fantasma na caixa de entrada; o `MAESTRI_CLI` apontando para a montagem velha do AppImage (já na memória).
- **e2e do `celular` acima do prazo.** `casca.spec.ts:67` caiu duas vezes (5117 ms em `d6eb2f0`, 5018 ms na `develop`;
  prazo do dado de 5 s), e `areas.spec.ts:647` e `troca-de-escola.spec.ts:156` uma vez cada na `develop`. O censo de prazo
  do e2e (M1 da X3) **ainda não foi feito**: era "antes da primeira tarefa da X4", e a X4 congelou. Correção do `casca` no
  `TODO.md`, para depois desta retrospectiva.

## O que funcionou

- **O recorte com autonomia.** De 94 para 36 tarefas, sem parada do Joaquim depois de 22/10 10h55, e o pouso às 02h49 de
  sexta, 29 h antes da meta de sábado 08h.
- **As três linhas com tarefa mecânica por script.** 29 tarefas em 12 h 44; 15 de 36 sem reprovação.
- **O diagnóstico do Arquiteto.** 93.0 e 9.0 aprovadas na rodada seguinte ao diagnóstico; a 2.0, depois da decisão do Joaquim.
- **A revisão da spec em cinco rodadas.** 25 de 33 não aprovadas, mas fora da onda 0 as tarefas reprovaram 13,8%, o menor
  número até aqui.
- **O fechamento.** Validação reprovada às 00h30, três correções em duas linhas, revalidação e pouso em pouco mais de 2 h.

## Propostas

### De texto

**P1. Classificador de linguagem natural tem medida independente e modelo desde a Tech Spec**

```
Causa: grupo L — 21 reprovações (2.0 ×9, 3.0 ×7, 93.0 ×5), 2 paradas do Joaquim, 3 escaladas e 2 bloqueios
Onde evitar: Tech Spec
Mudança: .claude/skills/criar-techspec/SKILL.md, "5. Seções obrigatórias" — depois do parágrafo "Se a funcionalidade
  chama modelo, uma quarta" entra:
  "Se a funcionalidade **classifica texto livre** contra um alvo (risco à vida, julgamento de texto de aluno, pedido de
  resposta pronta), a seção de conformidade diz também: (a) o **lote retido** que mede o alvo, escrito em contexto limpo
  antes dos padrões e nunca lido por quem os escreve, com piso nas categorias que não podem disparar; (b) o que o padrão
  de texto cobre sozinho e o que o modelo soma, com a AIA e o `llm-integrator` já na revisão da spec: padrão sozinho é
  piso, não alvo; (c) a sonda de frases novas que o `test-engineer` usa na revisão. Na X5 o `ouro` foi lido para escrever
  os padrões, 75 de 75 viraram 23 de 75 no lote retido, e a 2.0, a 3.0 e a 93.0 somaram 21 reprovações, cada rodada
  fechando um furo e abrindo outro, até a decisão B (a regra decide, o modelo soma)."
Efeito esperado: a próxima classificação (sinais do Tutor, F6; pedido de resposta pronta) começa com a medida e o desenho
  que a X5 só teve no segundo dia
```

**P2. Guarda nova não deixa escapar nem se cala**

```
Causa: grupo C — 9 reprovações (9.0 ×5, 12.0 ×3, 24.0)
Onde evitar: autoconferência do executar-task e tabela de testes do criar-tasks
Mudança: .claude/skills/executar-task/SKILL.md, autoconferência — item novo, depois de "A asserção olha o resultado":
  "- **Guarda nova (regra de lint, teste estrutural, trava de pasta) tem fixture de quem a contorna, e falha quando o
  alvo some?** Para cada forma de escrever o mesmo que a regra conhece (reexportação, `import *`, `import()` e
  `require`, o caminho como texto em outra posição, alias), uma fixture e o teste vermelho; a cerca sobre arquivo que
  mudou de lugar reprova, e não se cala; o `ignore` da configuração tem caso que prova que não esconde o real. Na X5, a
  9.0 levou cinco reprovações, uma forma de escape por rodada, e a 12.0 três, com cercas que paravam de vigiar sem
  teste falhar."
  .claude/skills/criar-tasks/SKILL.md, Diretrizes — item novo:
  "**Tarefa que cria guarda leva duas linhas fixas na tabela de testes**: 'quem contorna é acusado' (uma por forma) e
  'a guarda reprova quando o alvo dela não existe'."
Efeito esperado: as reprovações de guarda caem de uma rodada por escape para uma rodada só
```

**P3. Subtarefa feita mostra a evidência**

```
Causa: grupo D — 5 reprovações (36.0, 97.0 ×2, 48.0, 14.0)
Onde evitar: autoconferência do executar-task
Mudança: .claude/skills/executar-task/SKILL.md, autoconferência, no item "A coluna 'Onde está na spec' diz a verdade?" —
  acrescentar no fim:
  "Subtarefa que pede uma busca ou um commit à parte só fica `[x]` com a prova no documento: a saída do `grep` dos nomes
  antigos (vazia, ou cada linha justificada) e o hash do commit de caracterização. Na X5, a 36.0 e a 97.0 marcaram a
  busca feita com caminho velho no `README` e numa AIA, e a 48.0 marcou a caracterização sem o commit."
Efeito esperado: as reprovações do revisor-geral por subtarefa marcada sem ter sido feita
```

### De configuração

**P4. A esteira cancela sozinha a execução superada da mesma branch de spec**

```
Causa: 44 de 91 execuções da spec canceladas à mão, e o cancelamento confundindo o veredito
Onde evitar: .github/workflows/ci.yml
Mudança: no topo, depois de `permissions:`:
  concurrency:
    group: esteira-${{ github.ref }}
    cancel-in-progress: ${{ startsWith(github.ref, 'refs/heads/spec/') || startsWith(github.ref, 'refs/heads/correcao/') }}
  A `develop`, a `release` e o `main` continuam rodando cada push até o fim.
Efeito esperado: nenhum cancelamento à mão; o `esteira.ts --fechamento` já aceita a execução de um commit posterior só
  de documento
Risco: um push de documento logo depois do commit de código cancela a execução desse commit; o código é o mesmo, e é a
  execução do documento que vale. A M1 abaixo é o que impede o cancelamento de virar vermelho
```

### De código de processo (no `TODO.md`, uma correção própria, antes da primeira tarefa da próxima spec)

- **M1. `esteira.ts`: cancelada não é vermelha.** `estadoDaExecucao` passa a ter `superada` para `cancelled`, e o veredito
  é o da execução concluída mais nova; o texto cita os jobs vermelhos. Sem isso, o knip da 24.0 ficou ~2 h 20 sem ninguém
  ver.
- **M2. `linhas.ts encontro` roda `npm run typecheck` e `npm run lint` depois do merge**, antes do push, e recusa o
  encontro vermelho. Pega o crítico da validação (13.0 × 90.0) no encontro, com dois minutos.
- **M3. `mutacoes.ts` com timeout por mutação** (o prazo do teste vezes três, com teto), e o estouro conta como mutação
  recusada, não como vermelho (19.0, 41 min de `flock`).
- **M4. `mutacoes.ts --faltando`**: lista as linhas acrescentadas de código de produção com condição (`if`, `&&`, `||`,
  `??`, `?:`, `case`, `where`, expressão regular) que nenhum bloco do documento alcança; o portão imprime a lista, e o
  Implementador declara o bloco ou o motivo antes da Mesa. É o grupo A, que texto não moveu em quatro specs.
- **M5. `linhas.ts abandonar <n>`**, para soltar a linha sem editar o `linhas.json`.
- **M6. O portão para o despachante e os workers do compose de teste antes da integração.**
- **M7. Guarda com uma entrada só**: o portão chama as guardas pelas mesmas etapas de `tools/ci/etapas-de-guarda.ts` que o
  `ci:verificar`, e não por outro comando do `package.json`.
- Junto, as **M1 a M3 da X3**, ainda pendentes (o censo de prazo do e2e cobre o `casca`, o `areas:647` e o
  `troca-de-escola:156`).

### O que não entrou

- **Validador lendo a esteira.** Ele valida sem esperar a esteira por desenho (D79); quem lê é o Orquestrador no
  fechamento, e com a M1 o vermelho do knip teria sido visto antes da primeira validação.
- **Recomendação depois de todos aprovarem** (parte das 69 caducadas): o desenho da `revisar-tarefa`, como na X3.
- **Nada a tirar.** `infra-guardian` (19 rodadas) e `llm-integrator` (11) não reprovaram tarefa; os dois reprovaram na
  revisão da spec, e o `infra-guardian` defende a regra 80. As tarefas mecânicas já rodaram com no máximo um guardião.

## Decisão

Perguntei ao Joaquim em 23/10/2026, no terminal do Arquiteto. Ele escolheu as quatro propostas de texto e configuração e o
código de processo antes da próxima spec, que eram a minha recomendação.

| Proposta | Decisão | Motivo |
|---|---|---|
| P1. Classificador com lote retido e modelo desde a Tech Spec | aplicada | grupo L, 21 reprovações e duas paradas |
| P2. Guarda que não escapa nem se cala | aplicada | grupo C, 9 reprovações |
| P3. Subtarefa feita mostra a evidência | aplicada | grupo D, 5 reprovações |
| P4. `concurrency` no `ci.yml` | aceita, **na correção de código de processo** | o `ci.yml` conta como código para o hook e é lido por `tools/ci/esteira.test.ts`: não cabe num commit de documento, e precisa entrar junto da M1 |
| M1 a M7 | no `TODO.md`, **antes da primeira tarefa da próxima spec**, junto das M1 a M3 da X3 | a M1 e a M2 pegam os dois vermelhos que a validação e a esteira acharam tarde |
| Correção do `casca.spec.ts:67` | no `TODO.md`, parte logo depois desta retrospectiva | caiu duas vezes na esteira, uma na `develop` |

Arquivos alterados: `.claude/skills/criar-techspec/SKILL.md` (P1), `.claude/skills/executar-task/SKILL.md` (P2, P3),
`.claude/skills/criar-tasks/SKILL.md` (P2) e o `TODO.md` (o código de processo da X5 e a correção do `casca`).
