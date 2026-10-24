# Retrospectiva — harness (X7)

24/10/2026, pelo Arquiteto, no térreo, depois do pouso (`aad6d14`) com a esteira da `develop` verde (`40089007145`).
Comparação com a retrospectiva da X5 (`tasks/prd-reengenharia/retro.md`).

Condições que pesam nos números:

- a X7 é a Etapa 9 da missão da X5: **processo, não produto**. Todo o código está em `tools/`, `.claude/hooks/` e
  `.github/`; o que o portão sabe de produto (`apps/`, `packages/`) quase não aparece;
- três linhas, todas com Sonnet 5.5, de 23/10 14h08 a 24/10 02h33, numa noite só;
- duas paradas do Joaquim na construção (o RF13 da 2.0, a `--attr-source` da 10.0) e uma de escopo (a 21.0), todas
  respondidas com a recomendação;
- quatro avisos novos do `npm audit` (zod, vite e transitivas, multer) apareceram durante a construção, nenhum por causa dela.

## Medidas

```
Tarefas: 21 · Rodadas de revisor: 150 · Reprovações: 26 (17,3%)
Por revisor: test-engineer 43/14 · revisor-geral 43/9 · infra-guardian 27/2 · privacy-guardian 17/1
             conformidade-reviewer 11/0 · tenancy-guardian 9/0
Por modelo do implementador: Sonnet 5.5 nas 21; 7,1 rodadas e 1,2 reprovação por tarefa; um diagnóstico do Arquiteto
  (10.0, `diagnostico-10.md`), dois bloqueios destravados pelo Joaquim (2.0 e 10.0); mediana de 38 min da linha livre ao commit
Rodadas por tarefa: média 7,1, pior 10.0 com 12 rodadas e 5 reprovações (14.0 e 20.0 também com 12, por terem seis guardiões)
Rodadas que caducaram sem reprovação do próprio revisor: 44 de 150 (29%)
Correções fora de tarefa: 13, com 43 rodadas e nenhuma reprovação: 4 de `npm audit`, 2 de conflito no encontro, 2 de
  intermitente, 1 de complexidade antes da partição, 4 do fechamento (2 da validação, 2 pendências da 20.0)
Duração: construção de 23/10 14h08 ao último commit de tarefa em 24/10 02h33 (12 h 25, ~35 min por tarefa entregue);
  último commit com código 03h19 (`8df95e4`); fechamento 04h24; pouso 08h13, com a palavra do Joaquim
Revisão da spec (23/10): 37 rodadas, 29 não aprovadas, aprovada na 10ª rodada do test-engineer (11h47 → 14h02),
  mais as rodadas 11 a 13 para a 21.0
Ressalvas do /validar: rodada 1 REPROVADA (1 crítico, 1 maior, 3 menores); rodada 2 APROVADA (3 menores)
```

Como contei: as linhas da tabela "Revisões" dos 21 `N_task.md`, de `revisao-spec.md` e das 13 correções do período,
escritas pelo hook; os blocos de `achados/` de cada reprovação; o tempo de cada tarefa pelo `git log` de cada linha, da
hora em que ela ficou livre (o encontro anterior, ou a tarefa de que dependia) ao commit; a esteira por `gh run list` e
`gh run view` de `spec/harness` e das três linhas. A `casca-prazo-do-dado` (23/10 09h17) é da retrospectiva da X5 e
ficou de fora.

| | F3 | X3 | X5 | X7 |
|---|---|---|---|---|
| Tarefas | 20 | 14 | 36 | 21 |
| Reprovações nas tarefas | 22,9% | 15,3% | 21,3% (13,8% fora da onda 0) | 17,3% |
| Rodadas por tarefa | 11,8 | 8,4 | 6,6 | 7,1 |
| Caducadas sem reprovação | 34% | 33% | 29% | 29% |
| Revisão da spec, não aprovadas | 19 de 27 | 7 de 16 | 25 de 33 | 29 de 37 |
| Correções fora de tarefa | 9, e 2 falhas | 19, e 4 de encontro | 6, e 1 sem commit | 13, e 2 de encontro |
| Crítico ou maior no 1º /validar | 1 crítico e 2 maiores | 4 críticos e 4 maiores | 1 crítico e 1 maior | 1 crítico e 1 maior |
| Tarefas sem nenhuma reprovação | 1 de 20 | 4 de 14 | 15 de 36 | 7 de 21 |

## As cinco medidas da D79

**1. Da partida ao commit.** Mediana de **38 min** (42 na X5, ~112 na X3, 99 no F3), medida da hora em que a linha ficou
livre. As três acima de uma hora tiveram parada no meio: a 10.0 (183 min, escalada, diagnóstico, bloqueio e duas correções
de `npm audit`), a 2.0 (102 min, o bloqueio do RF13) e a 11.0 (80 min, a correção do multer).

**2. Tarefas sem reprovação.** 7 de 21 (15 de 36 na X5). Tarefa de processo tem cláusula nova em quase toda linha.

**3. O grupo A.** **8 reprovações** de cláusula nova sem bloco de mutação, ou com bloco que não prova (5.0, 7.0, 8.0, 9.0,
4.0, 11.0, 16.0, 21.0), contra 10 na X5. **Todas em `tools/`.** O `mutacoes.ts --faltando` que a 9.0 entregou (a M4 da X5)
lê só `apps/` e `packages/` (`linhasNovasDaArvore`, `tools/processo/mutacoes.ts:678`), e por isso não listou nenhuma.
Mais 3 de ramo sem caso (6.0, o SIGINT e o SIGHUP; 10.0, a linha 62; 19.0, o `.git` da linha), que são a mesma coisa vista
pelo teste e não pela mutação.

**4. Vermelhos da esteira por push.** Em `spec/harness`, 49 execuções: **16 verdes, 10 vermelhas, 23 canceladas** (pelo
`concurrency` da 3.0, desde as 17h01); nas três linhas, 34 (16 verdes, 4 vermelhas, 14 canceladas). Dos 14 vermelhos,
**8 foram o `npm audit`** (o aviso do zod, que apareceu no meio da tarde e entrou em toda execução até a correção) e o resto
foi intermitente de e2e e integração, e um teste nosso: o do SIGINT no supervisor (`mutacoes.test.ts`, 255 em vez de
124), vermelho na linha 2 em `d76ef01` e verde na mesma árvore da spec. **Nenhum defeito de código da X7 foi visto só pela esteira.** O custo novo é a **fila**:
do push ao veredito, mediana de **70 min** e máximo de **4 h 26**; o primeiro job de uma execução esperou até **3 h 38**
por máquina (`40003164563`: criada às 15h25, jobs a partir das 18h16). As 34 execuções das linhas disputavam a fila com as
da spec.

**5. Do último commit ao pedido de pouso.** Do último commit com código (03h19) ao pedido (04h24), **1 h 05**, quase toda
a esteira de `d449457` (03h21 → 04h21). Era ~50 min na X5 e 5 h 29 no F3. O pouso foi às 08h13, quando o Joaquim respondeu.

## Grupos de causa

As 26 reprovações das tarefas, cada uma num grupo só; as 29 da revisão da spec, à parte; e o crítico e o maior da validação.

### Tarefas

| # | Causa | Ocorrências | Onde | Onde evitar |
|---|---|---|---|---|
| A | Cláusula nova de processo sem bloco de mutação, ou com bloco que não prova | 8 | 5.0, 7.0, 8.0, 9.0, 4.0 (bloco com erro de sintaxe), 11.0, 16.0, 21.0 | máquina: o `--faltando` não lê `tools/` |
| A′ | Ramo novo sem caso de teste | 3 | 6.0, 10.0 (1ª), 19.0 | autoconferência; é o grupo A visto pelo teste |
| E | Defeito real que só a revisão viu | 7 | 5.0 ×2 (a volta do `abrir` não sabe se a abertura é dela), 7.0 ×2 (o chamador não acompanhou o tipo novo de `Rodar`), 8.0 (o `stop` que não muda nada), 10.0 (o `decidirCommit` lia o disco), 14.0 (o RF16 pedia o `revisor-geral` e o teste escondia) | é para isso que a revisão existe |
| C | Guarda que lê linguagem aberta: cada rodada acha uma forma nova | 3 | 10.0 (`$'…'` no meio da palavra, `--config-env=`, opção global fora das seis), com a escalada e o bloqueio | Tech Spec: a §5(a) só ganhou "todo o resto é limite" depois do diagnóstico |
| D | Divergência ou critério só no documento da tarefa | 3 | 15.0 (o `CLAUDE.md` com 227 linhas contra as ~150 do RF20), 18.0 e 19.0 (divergências fora da Tech Spec e do `cenarios.md`) | a regra já está no `executar-task` ("antes dos revisores, entra na `techspec.md`"); na X5 foram 2 |
| F | A checagem citada na regra não prova o item | 2 | 16.0 (a regra 20, item 13; a regra 10, item 8) | uma tarefa só, de texto; os revisores fizeram o trabalho |

**Falsos positivos.** Nenhum. A 4.0 e a 18.0 trouxeram o mesmo achado por dois lados: mutação que fica vermelha por erro
de sintaxe ou por exceção, e não por asserção, parece provada sem provar nada.

### Revisão da spec

| Causa | Ocorrências | Onde evitar |
|---|---|---|
| Tabela caminho → guardião (RF15) escrita de memória, sem passar pasta a pasta no repositório | 12 (os quatro guardiões, rodadas 1 a 3) | Tech Spec: a lista fechada sai de uma listagem do repositório |
| Trava das linhas (RF4, §5f): cada correção criava um estado novo sem caso, ou um prazo sem o que acontece ao estourar | 8 (test-engineer nas rodadas 2, 3, 4, 6, 7, 8 e 9; infra-guardian na 4) | Tech Spec: a tabela de estados e transições, com o prazo de cada um |
| Requisito sem teste, ou definição que tornava o teste impossível | 9 (test-engineer 1, 5 e 11; revisor-geral 1, 2, 3, 4, 6 e 7) | é o que a revisão da spec existe para pegar |

### Validação

- **C1**: o `aviso-de-sessao.sh` reconhecia `/seguir ` só no começo, e a mensagem colada chega embrulhada
  (`<pasted_content …>`). O teste usava a forma que o autor imaginava, não a gravada.
- **M1**: o `linhas.ts abandonar` (RF6) existia e estava provado, mas nenhum passo do `/seguir` o ensinava.
- Do mesmo tipo, sem chegar à validação: a correção `fixture-maestri-list`, porque a fixture tinha sido gravada no terminal
  errado.

São três vezes a mesma causa: **peça de processo nova pronta, mas sem o caminho de uso real** (a entrada como ela chega, o
passo que a chama).

## Fora das reprovações

- **Quatro correções de `npm audit` numa noite** (zod nas linhas 3 e 2, vite, multer). O zod foi corrigido duas vezes,
  uma em cada linha, porque cada linha tem a sua seção "Revisões" e a sua rodada. Custou ~25 min e duas rodadas a mais.
  Uma vez; não proponho mudança.
- **Dois conflitos no `cenarios.md` no encontro** (8.0, 6.0): a linha registrou divergência de detalhe no mesmo arquivo que
  a spec tinha mudado (o RF13). Cada um virou uma correção de 2 ou 3 rodadas, ~15 min. Os dois são legítimos; não proponho
  mudança, mas o próximo `cenarios.md` grande vale ser partido por seção.
- **O slug `encontro-6` já existia** de outra spec, e a correção virou `encontro-6-harness`. Uma vez.
- **O orçamento de leitura do `/seguir`** (`SKILL.md` + `protocolo.md` + `passos/6-tarefa.md`) está em 23.979 B de 24.000,
  e a base fixa a ~465 B de 40.000. O próximo acréscimo nesses arquivos precisa tirar texto antes.
- **Push TLS que falhou no encontro da 7.0**, refeito à mão. Uma vez.

## O que funcionou

- **O `concurrency` da 3.0 e a leitura da cancelada.** Desde as 17h01, nenhuma execução cancelada à mão (44 na X5), e o
  `esteira.ts` passou a pular a cancelada. Nenhum vermelho escondido.
- **O encontro com tipagem e lint (6.0).** Nenhum vermelho de junção na spec depois dele.
- **O fechamento.** Validação reprovada às 03h03, duas correções em duas linhas, revalidação aprovada e fechamento às 04h24.
- **Os diagnósticos e as paradas curtas.** As três perguntas ao Joaquim tiveram recomendação e foram respondidas em minutos.

## Propostas

### Aviso (só skill, papel ou modelo; aplico às 09h40 se o Joaquim não objetar)

**P1. Tech Spec de mecanismo com estado escreve a tabela de estados**

```
Causa: trava das linhas na revisão da spec — 8 reprovações (test-engineer 2, 3, 4, 6, 7, 8, 9; infra-guardian 4)
Onde evitar: Tech Spec
Mudança: .claude/skills/criar-techspec/SKILL.md, "5. Seções obrigatórias", depois do parágrafo do texto livre:
  "Se a funcionalidade tem **trava, fila ou estado gravado** que mais de um processo lê (quadro das linhas, job,
  sessão), a seção de carga traz a **tabela de estados**: cada estado, quem entra nele, quem sai, o prazo, e o que
  acontece quando o prazo estoura ou o processo morre no meio. Na X7, a trava das linhas levou oito reprovações na
  revisão da spec, porque cada correção do texto criava um estado novo sem saída nem caso."
Efeito esperado: a trava ou fila nova chega à revisão da spec com os estados fechados, e o test-engineer cobra o caso
  de cada linha da tabela numa rodada
```

**P2. Guarda que lê linguagem aberta nega o que não reconhece**

```
Causa: grupo C — 3 reprovações, uma escalada e um bloqueio (10.0)
Onde evitar: Tech Spec
Mudança: .claude/skills/criar-techspec/SKILL.md, mesmo lugar:
  "Se a funcionalidade tem uma **guarda que lê linguagem aberta** (linha de comando do shell, opções do git,
  expressão regular sobre código), a Tech Spec escreve a gramática que a guarda aceita e diz que **o resto é negado
  ou é limite declarado**, com a lista dos limites. Lista de formas de escapar é piso, não desenho. Na X7, a 10.0
  levou três reprovações de forma nova, uma por rodada (`$'…'`, `--config-env=`, opção global), uma escalada e um
  bloqueio, até a §5(a) ganhar 'todo o resto é limite'."
Efeito esperado: a próxima guarda desse tipo sai da Tech Spec com a fronteira escrita, e o revisor discute a
  fronteira uma vez, não a forma de escapar a cada rodada
```

**P3. Lista fechada sobre o repositório nasce de uma listagem**

```
Causa: tabela caminho → guardião na revisão da spec — 12 reprovações (os quatro guardiões, rodadas 1 a 3)
Onde evitar: Tech Spec
Mudança: .claude/skills/criar-techspec/SKILL.md, "2. Explorar o projeto", item novo:
  "Tabela que reparte o repositório (caminho → guardião, caminho → suíte, pasta → dono) sai de
  `git ls-files | cut -d/ -f1-3 | sort -u`, com cada pasta numa linha ou na lista do que fica fora, e o motivo. Na X7,
  a tabela do RF15 foi escrita de memória, e os quatro guardiões reprovaram três rodadas seguidas apontando pastas
  que faltavam."
Efeito esperado: a revisão da spec discute quem pede qual guardião, não quais pastas existem
```

**P5. Dois ajustes de texto que o `TODO.md` guardava** (sem efeito no comportamento; o terceiro, o da `vigia/SKILL.md`,
já está feito: a linha 31 aponta `passos/3-time-e-andar.md`)

- `.claude/skills/seguir/passos/7-paradas.md:32`: o aviso da retro ganha a ressalva "salvo as do grupo de confirmação"
  (17.0, revisor-geral 2ª)
- `.claude/agents/validador.md:135-137`: o commit `Fora do processo:` que toca nota, correção, tutor ou saída de IA é lido
  contra a regra 70 (17.0, conformidade-reviewer 2ª)

### Confirmação, item a item

**P4. Peça de processo nova sai com o caminho de uso real** (`criar-tasks`, que decide a marcação)

```
Causa: C1 e M1 da validação, e a correção fixture-maestri-list — 3 ocorrências (20.0, 5.0, 20.0)
Onde evitar: criar-tasks
Mudança: .claude/skills/criar-tasks/SKILL.md, Diretrizes, item novo:
  "**Tarefa que cria comando, hook ou script de processo** leva duas linhas fixas: (a) a subtarefa que põe o
  comando no passo do `/seguir` ou no papel que o usa, com o termo no teste do passo; (b) a entrada real gravada
  como fixture (a mensagem colada como chega, com o embrulho; a saída do terminal de quem roda o comando), e o
  teste lê a fixture, não um exemplo escrito à mão. Na X7, o aviso da mensagem colada (C1) testava a forma
  imaginada, o `abandonar` (M1) não estava em passo nenhum, e a fixture do `maestri list` veio do terminal errado."
Efeito esperado: o crítico e o maior da validação de spec de processo
```

**M1. O `--faltando` lê também `tools/`** (código de processo, correção própria)

```
Causa: grupo A — 8 reprovações, todas em tools/, que o --faltando não lê
Mudança: tools/processo/mutacoes.ts, `linhasNovasDaArvore`: o diff e os arquivos novos passam a incluir `tools/`,
  fora `*.test.ts`, `__fixtures__/` e `tools/guardas/` de fixture; teste e bloco de mutação para a pasta nova
Efeito esperado: as linhas de condição de `tools/` aparecem antes da Mesa, como já aparecem as de produto
```

**M2. Mutação vermelha só vale por asserção** (código de processo)

```
Causa: 4.0 (mutação com erro de sintaxe) e 18.0 (três mutações vermelhas por exceção) — 2 ocorrências
Mudança: tools/processo/mutacoes.ts: a mutação que deixa o teste vermelho por erro de carga (sintaxe, módulo que não
  carrega, nenhum teste rodou) é recusada com o motivo, e não conta como provada
Efeito esperado: o test-engineer deixa de achar à mão o bloco que não prova
```

**M3. O portão avisa a divergência que ficou só no documento da tarefa** (código de processo)

```
Causa: grupo D — 3 reprovações (15.0, 18.0, 19.0), mais 2 na X5
Mudança: tools/processo/portao-local.ts: se a seção "Divergências resolvidas" do documento ganhou linha no diff e nem
  a `techspec.md` nem o `cenarios.md` da spec mudaram, o portão imprime o aviso (só informa, como o --faltando)
Efeito esperado: a reprovação do revisor-geral por divergência fora da Tech Spec
```

**M4. A esteira não roda no push das branches de linha** (`.github/workflows/ci.yml`)

```
Causa: a fila — push → veredito com mediana de 70 min e máximo de 4 h 26; 34 das 83 execuções eram das linhas
Mudança: em `on.push.branches`, depois de 'spec/**', o padrão '!spec/**--l*'. A linha chega à spec pelo encontro, que
  roda tipagem e lint (6.0), e a execução da spec cobre a soma; o portão local já roda na linha
Efeito esperado: perto de 40% menos execuções na fila, e o veredito da spec mais cedo
Risco: o vermelho que só a esteira vê aparece no encontro, e não antes; na X7 nenhum dos 4 vermelhos das linhas foi
  só delas
```

**M5. Correção "processo seguro"** (código de processo; junta itens do `TODO.md`)

- `.processo/limpeza.json` ancorado no térreo, no comando dos passos 6 e 9 e no hook, e o JSON que não é objeto com motivo
  legível na vigia (20.0)
- Ctrl-C no portão devolve o arquivo mutado (o `finally` não roda hoje), e SIGTERM ao grupo também no `close` (7.0, 1ª)
- o ramo `if ('vermelho' in conferencia)` do `portao-local.ts` com bloco de mutação (7.0, 2ª)
- `git config --get core.hooksPath` liberado em sessão de papel, como leitura (m1 da validação)
- o CLI de `linhas.ts` avisa na saída quando `EDUCA_ENCONTRO_SOB_A_TRAVA` ou `EDUCA_COMANDO_DE_INSTALACAO` estão ligadas, e a
  marca `abertura` sai junto com `abrindo: false` (5.0)
- o teste do SIGINT no supervisor (`mutacoes.test.ts`, "o Ctrl-C do portão não deixa neto") sem a corrida que o deixou
  vermelho em `d76ef01` (esperava 124, veio 255)

**M6. A citação por número de decisão soma o `conformidade-reviewer`** (muda a marcação de guardião)

```
Causa: recomendação da revisão da spec, rodada 4 (conformidade-reviewer), que não entrou por mudar a lista fechada
Mudança: tools/processo/guardioes-por-caminho.ts, "Regras de casamento": o arquivo de exceção que cita D45, D47, D55 a
  D59 ou D64 soma o conformidade-reviewer, como a citação da regra 70 já soma
Efeito esperado: o código que impõe a regra 70 por número de decisão não escapa do guardião dela
```

**M7. Correção "acabamento de texto da X7"** (código de processo só por causa de teste e comentário)

- os comentários que dizem que a lógica mora em `revisoes.ts` (`tools/ci/etapas-de-guarda.ts:119`, `tools/ci/e2e-que-cita-literal.ts:4`,
  `tools/processo/sequencia-do-portao.ts:80`, e o `executar-task`), o cabeçalho de `metadados.test.ts:12`, e a frase morta do
  `contexto-inicial.sh:27` (2.0, 11.0, 19.0)
- a regex do `hook-git.int.test.ts:184` exige o nome do módulo, com `replaceAll` (11.0)
- `retro/SKILL.md:91`, "salvo as do grupo seguinte", com o termo do `seguir.test.ts` (17.0)
- o retoque do `passos/6-tarefa.md` (m6) e uns 300 B de folga no orçamento de 24.000 (m3), tirando explicação, não instrução
- `docs/aia/ouro-retido/README.md:4` sem o `(ouro: <política>)` (18.0)

**D1. Revisão da D79: o grupo de confirmação da `retro` ganha o arquivo inteiro dos revisores com veto**

```
Causa: 17.0, conformidade-reviewer 1ª e 2ª — hoje só a lista "O que verificar" é confirmação, e uma proposta que mude
  outra parte de um revisor com veto (quem aprova, como classifica o achado) cairia no aviso de 30 minutos
Mudança: docs/decisoes.md (D79, revisão), CLAUDE.md sem mudança de título, e .claude/skills/retro/SKILL.md seção 5:
  "a lista 'O que verificar' de um guardião com veto" vira "o arquivo inteiro de um revisor com veto, o
  `mesa-de-revisao.md` e a seção 6 do `validador.md`"
Efeito esperado: nenhuma mudança no veto passa por aviso
```

**R1. Regra 80, item 5: o caminho certo da métrica** (regra; erro de fato)

`.claude/rules/80-infra-e-carga.md`: `sessao.leitura.duracao` é medida em `packages/nucleo/src/identidade/guarda-sessao.ts`, não em
`apps/api/src/main.ts`, que só tem `observarPoolDoBanco` (18.0, revisor-geral 2ª).

### Tirar do `TODO.md` (recuso, com o motivo)

| Item | Motivo |
|---|---|
| (rev. spec 4) a linha `Sem mutação:` em arquivo que pede conformidade exigir a rodada dele | o caminho já exige a rodada; seria repetir |
| (rev. spec 4) `.dockerignore`, `.nvmrc`, `package-lock.json` no §5(e) | mudaria a D53; o lock já passa pelo `npm audit` |
| (7.0, 1ª) o `testTimeout` lido do primeiro projeto; dois `rodarCalado` em paralelo | nenhuma corrida nem prazo errado visto na X7 |
| (7.0, 2ª) itens 1, 2, 3, 5 e 6 (texto do `7_task.md`, folgas de tempo de teste) | documento de tarefa fechada; nenhuma intermitência vista |
| (2.0) a linha do §2 da Tech Spec, e os itens 3 e 5 de teste | Tech Spec de spec pousada; os testes de partição não caíram |
| (5.0) itens 2 e 3 (bloco de `aindaAbrindo`, tabela do `5_task.md`) | documento de tarefa fechada |
| (12.0) o `catch` do `rev-list` | fecha na falha, que é o que importa; a 12.0 já tirou a linha por redundante |
| (18.0) o `pedagogia-reviewer` na frase do §9 | Tech Spec de spec pousada |
| (19.0) a 19.3 do `19_task.md` | documento de tarefa fechada |
| (17.0) a `vigia/SKILL.md` apontar o passo 3 | já feito |
| (validação) m2 e m5 | documentos de correção fechados; a seção "Revisões" é do hook |

Ficam no `TODO.md` como estão: o merge octopus do `conferir-entregas.ts` (12.0), a guarda do anexo do censo e o upload
dele antes da primeira escola real (4.0), a revisão da `lgpd-brasil` na atualização (19.0, do Joaquim), a remoção do
`separar-achados.ts` (do Joaquim, com o Gabriel), e os itens 1 e 2 da nota "(X7) Para a retro" (o lote 5/7 no limite de 45 min
e o MFA da `casca`), que voltam se caírem de novo. O item 3 da mesma nota é a M4.

## Decisão

Perguntei ao Joaquim em 24/10/2026, às 09h02, no terminal do Arquiteto. Ele respondeu "tudo o recomendado": os avisos
foram aplicados junto com as confirmações, sem esperar as 09h40.

| Proposta | Decisão | Onde |
|---|---|---|
| P1. Tabela de estados na Tech Spec (aviso) | aplicada | `.claude/skills/criar-techspec/SKILL.md`, seção 5 |
| P2. Guarda de linguagem aberta nega o resto (aviso) | aplicada | `.claude/skills/criar-techspec/SKILL.md`, seção 5 |
| P3. Lista fechada sai de `git ls-files` (aviso) | aplicada | `.claude/skills/criar-techspec/SKILL.md`, seção 2 |
| P5. Ressalva no passo 7 e regra 70 no `Fora do processo:` (aviso) | aplicada | `passos/7-paradas.md`, `.claude/agents/validador.md` |
| P4. Peça de processo com o caminho de uso real | aplicada | `.claude/skills/criar-tasks/SKILL.md`, Diretrizes |
| D1. Revisão da D79: o arquivo inteiro dos revisores com veto é confirmação | aplicada | `docs/decisoes.md` (D79), `.claude/skills/retro/SKILL.md`, `passos/7-paradas.md` |
| R1. Caminho da métrica na regra 80 | aplicada | `.claude/rules/80-infra-e-carga.md`, item 5 |
| M1 a M7 | aceitas, como **correções antes da primeira tarefa da X4** | `TODO.md`, "Da X7 (harness), fora dela" |
| Itens que saem do `TODO.md` | aceito | tabela "Tirar do `TODO.md`" acima |

O título da D79 no `CLAUDE.md` não muda. Também marquei feitos no `TODO.md` dois itens da X5 que a X7 cumpriu: o lint no
encontro e o código de processo da retrospectiva da X5.
