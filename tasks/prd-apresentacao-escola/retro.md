# Retrospectiva — apresentacao-escola (A1)

04/10/2026. Os passos 1 a 4 da `/retro`, com a seção "Decisão", no fim, preenchida pelo orquestrador e as
propostas aceitas aplicadas. Comparação com a retrospectiva da A0b (`tasks/prd-apresentacao-painel/retro.md`).

## Medidas

```
Tarefas: 17 · Rodadas de revisor: 194 · Reprovações: 23 (11,9%), contando o AJUSTES NECESSÁRIOS do frontend-reviewer
Por revisor: test-engineer 65/12 · revisor-geral 41/6 · privacy-guardian 29/0 · tenancy-guardian 22/0
             frontend-reviewer 20/5 (AJUSTES NECESSÁRIOS) · infra-guardian 15/0 · conformidade-reviewer 2/0
Rodadas por tarefa: média 11,4, pior 13.0 com 17 (7 delas do test-engineer)
Rodadas que caducaram sem reprovação do próprio revisor: 94 de 194 (48%)
  - 74 depois de um lote de recomendações, sem nenhuma reprovação no meio. É o custo da proposta 5 da A0b:
    1,6 min de média por rodada, uns 2 h no total, contra 2,3 min das outras 120
  - 20 depois da reprovação ou do AJUSTES de outro revisor (3.0, 5.0, 9.0, 11.0, 13.0, 14.0, 15.0, 16.0)
Correções fora de tarefa: 6, todas com documento em tasks/correcoes/
  - 4 vieram de esteira vermelha com o portão local verde: teto-do-e2e-na-esteira (13.0),
    decididos-continuam-marcados (16.0), e2e-sem-dist-do-shared (17.0), e2e-em-fatias (f075b44 e edd6f51)
  - 2 vieram das maiores do /validar: acesso-sobrevive-ao-vinculo (G1), trava-de-documento-so-na-tela (G2)
  - mais 2 commits de processo sem marca (15ceca2, cache de 1 h dos subagentes; 9a93190, o /executar-tasks
    conferia o main)
Duração: 26/09 10:10 (tarefas geradas) → 04/10 02:14 (validação), com pausa de 27/09 12:12 a 01/10.
  As 12 primeiras tarefas levaram 26 h corridas
  Mediana entre commits: 2,1 h (16 tarefas; a 13.0 sai da conta, porque o intervalo dela tem a pausa)
  Distorções: a 14.0 aparece com 0,5 h e a 17.0 com 1,6 h porque foram feitas antes, guardadas em stash e
  commitadas depois de uma correção de esteira. Do commit anterior até o commit dela, a 15.0 levou 9,9 h e a
  17.0 levou 18,3 h (com a noite e a correção dos decididos no meio). Pelo que o orquestrador viu, foram uns
  3 h de subagente na 15.0 e uns 5 h na 17.0
Revisão da spec: 5 rodadas, 20 rodadas de revisor, 14 não aprovadas
Ressalvas do /validar: rodada 1 com 0 críticos, 2 maiores (G1, G2) e 8 menores (M1 a M8) · rodada 2 APROVADA,
  com 0 críticos, 0 maiores e as menores N1 a N5 somadas às da rodada 1 que continuam abertas
```

Como os números foram contados: as linhas da tabela "Revisões" dos 17 `N_task.md`, escrita pelo hook. Caducada
é a rodada de um revisor que já tinha aprovado na mesma tarefa. Para separar o lote de recomendações, olhei se
houve reprovação de qualquer revisor entre a aprovação e a rodada seguinte dele. Os intervalos vêm de
`git log --date=iso`, e o commit parcial da 15.0 e os três stashes vêm do `git reflog`.

| | A0 | A0b | A1 |
|---|---|---|---|
| Tarefas | — | 10 | 17 |
| Reprovações nas tarefas | 11,7% | 14,7% | **11,9%** |
| Rodadas por tarefa | 5,5 | 7,5 | **11,4** |
| Caducadas sem reprovação | 10% | 24% | 48% (38% por lote de recomendação) |
| Revisão da spec, não aprovadas | 17 de 22 | 9 de 18 | 14 de 20 |
| Mediana por tarefa | 1,3 h | 2,25 h | 2,1 h |
| Correções fora de tarefa | — | 7 | 6 (4 de esteira) |
| Maiores no 1º /validar | — | 1 | 2 |

A taxa de reprovação caiu, e as rodadas subiram. A subida é quase toda de rodadas curtas de lote, que existem de
propósito desde a proposta 5 da A0b. O custo novo da A1 foi outro: a esteira. Quatro vezes ela pegou o que o
portão local deixou passar. Cada vez custou uma correção, um stash da tarefa seguinte e um portão inteiro de novo.

## As propostas da A0b, uma por uma

| Proposta da A0b | Resultado | Evidência |
|---|---|---|
| 1. Rode a mutação, com a seção "Mutações" | **em parte** | Todas as 17 tarefas preencheram a seção. Mesmo assim, 7 reprovações do `test-engineer` foram por cláusula sem teste (5.0, 9.0, 10.0, 11.0, 13.0 duas vezes, 17.0), contra 6 na A0b. Elas mudaram de lugar: cinco são condição de tela em `.tsx`; duas (11.0 3ª, 13.0 4ª) são condição posta para atender um AJUSTES do `frontend-reviewer`, depois da mutação feita; e uma (17.0) teve a condição composta mutada inteira (`→ true`), o que escondeu dois dos três termos |
| 2. Divergência na spec antes dos revisores | **funcionou no /validar, mas custou no meio** | O /validar não achou spec atrás do código: o "Pronto: desvios nos documentos" está cumprido, e sobrou só o texto do RF14 no PRD (M1). O preço foram 4 reprovações do `revisor-geral` por divergência que só estava no `N_task.md` (3.0, 5.0, 9.0, 11.0). O revisor pega; a autoconferência ainda não |
| 3. `frontend-reviewer` sozinho antes dos guardiões | **funcionou** | Nenhum guardião caducou por AJUSTES do frontend. Na 13.0 e na 14.0, que tiveram quatro AJUSTES, os guardiões só rodaram depois do frontend aprovar |
| 4. Linha de recomeço com os quatro casos | **em parte** | A linha esteve nas tarefas de tela. Mesmo assim: resposta atrasada que o teste não provava (11.0 1ª), guarda de resposta atrasada sem teste (14.0 1ª), e o quarto caso (lista relida com o diálogo aberto) escapou para a esteira no W6 da 16.0 (correção `decididos-continuam-marcados`). O caso estava listado. Faltou forçar a ordem de chegada no teste (grupo B) |
| 5. Recomendação barata aplicada também depois de aprovar | **funcionou, com custo conhecido** | As 17 tarefas têm "Recomendações sem aplicar" com destino, e nenhum comentário falso ficou para trás. O custo foram 74 rodadas de lote, curtas |
| 6. Banco de teste limpo no `test` do portão | **funcionou** | Nenhuma correção por banco acumulado ou por ordem de id na A1. A classe "local diferente da esteira" saiu da integração e foi para o e2e: `dist`, tempo e corrida de render (grupo E) |

## Grupos de causa

| # | Causa | Ocorrências | Tarefas | Onde evitar |
|---|---|---|---|---|
| A | Cláusula nova sem teste: condição de tela, termo de condição composta, ou condição posta para atender um revisor depois da mutação | 7 reprovações | 5.0, 9.0, 10.0, 11.0, 13.0 (×2), 17.0 | autoconferência (executar-task, passo 2) |
| B | Ordem de chegada não controlada no teste: corrida no banco com `Promise.all` solto, resposta atrasada na tela | 4 reprovações + 1 esteira vermelha | 4.0, 7.0, 11.0, 14.0; W6 da 16.0 | autoconferência e `task-template.md` |
| C | Divergência registrada só no `N_task.md` | 4 reprovações do `revisor-geral` | 3.0, 5.0, 9.0, 11.0 | autoconferência e `task-template.md` (a seção "Divergências" não existe no template; cada tarefa a cria à mão) |
| D | `revisor-geral` reprovou pelo carimbo do portão, ausente, sem `--e2e` ou anterior à mudança | 3 (duas só por isso) | 15.0 (sem `--e2e`); `trava-de-documento-so-na-tela` (carimbo anterior); `acesso-sobrevive-ao-vinculo` (carimbo anterior, junto com um deadlock real) | executar-task passo 5, ou `revisor-geral.md` §5 |
| E | Esteira vermelha com o portão local verde | 4 execuções, 3 causas | `dist` velho na máquina (17.0); corrida de render que só aparece com 2 trabalhadores e o relógio da aba (16.0); suíte maior que o teto do job (13.0, e de novo em f075b44 e edd6f51) | portão local (`tools/processo/portao-local.ts`) e executar-task passo 4 |
| F | Tarefa pronta e esteira anterior vermelha: o caminho stash → correção → pop → portão não está escrito, e o `/corrigir` manda esperar o verde, que é justamente o que ele vai consertar | 3 stashes e 3 correções commitadas sobre esteira vermelha | 14.0 (stash em `baf332e` para o teto), 17.0 (stash em `45af31a` para os decididos), stash em `caa1071` para o `dist`; correções `241ba1c`, `ef2bed0`, `509cfc3` | `executar-tasks`, `executar-task` passo 7, `corrigir` passo 6 |
| G | Pendência com destino "antes do /validar" que chegou aberta ao validador | 4 itens do `TODO.md`, 2 viraram maiores | G1, G2, M3 e "encerrar alocação pela tela" (M8) | `executar-tasks`, encerramento |
| H | Tarefa de tela muito maior que o previsto | 4 tarefas com mais de 25 arquivos de código | 11.0 (35), 13.0 (previa 11, levou 53, com 17 rodadas), 14.0 (39), 15.0 (27) | `criar-tasks` |
| I | Estado de tela errado no carregando ou no erro, e foco perdido depois de um ajuste | 4 AJUSTES | 13.0 (o "falta" no carregando e na falha; o foco do campo), 14.0 (o vazio ignora `isError`; o "Voltar e corrigir" regrediu) | `task-template.md` (tabela de testes) |
| J | Tabela "Mutações" fora do código: linha que falta ou número de linha que andou | 12 rodadas do `test-engineer` com isso como recomendação principal, 4 só por número de linha | 2.0, 3.0, 4.0, 5.0, 8.0 (×2), 13.0, 14.0, 17.0 (×3) | `task-template.md` e executar-task passo 2 |
| K | Correção com mais de ~5 arquivos sem `revisor-geral` | 2 | `decididos-continuam-marcados` (7 arquivos), `e2e-em-fatias` (11 arquivos, N5 do /validar) | `corrigir` passo 5 |
| L | Commit parcial: um `git add` falhou e o commit saiu sem parte da tarefa | 1, com peso | 15.0 (`f0a0caa`, desfeito com `reset HEAD~1` antes do push e refeito em `7e2ceac`) | executar-task passo 7 e `corrigir` passo 6 |
| M | Revisão da spec: o reenvio com a mesma chave em paralelo dependia da ordem física dos índices | 5 não aprovações em 3 rodadas | `revisao-spec`, rodadas 2 a 4 (`test-engineer`, `infra-guardian`) | Tech Spec, seção 7c |

**Grupo E, a causa por baixo.** A esteira e a máquina diferem em três coisas que o portão não iguala. A esteira
começa do clone, sem `packages/*/dist`. Ela roda o e2e com 2 trabalhadores, e a máquina com 6. E ela tem teto de
tempo por job. A correção do teto (`241ba1c`) previu o estouro "entre 375 e 400 casos", que veio em 394. Ela também
mandou para esta retro o aviso de "job perto do teto". As fatias (`b55842e`) resolveram o teto, e a guarda de 60%
do `tools/ci/esteira.test.ts` agora reprova no próprio portão local. O `dist` ganhou a guarda específica do
`tools/ci/playwright.test.ts`, que vale para import `@educa/*` alcançado pelo e2e, mas não para outro caminho que
leia o `dist` do host. A corrida de render não tem nada que a pegue antes da esteira.

**Grupo D e o tempo.** O `revisor-geral` da 15.0 escreveu por que não relevou: as tarefas 10.0 a 14.0 tinham
registrado "como combinado" uma rodada sem `--e2e`, e esse combinado vinha do executor, não da definição do
revisor. O portão completo leva uns 45 min na máquina (`test` 9 min, `test:e2e` 11 min, `test:infra` 27 min). Exigir
carimbo novo em cada rodada do `revisor-geral` é o que faz o executor ir e voltar entre portão e revisores. Foi o
que pesou na 15.0 e na 17.0, junto com as rodadas de mutação do e2e. O hook já recusa o commit sem carimbo mais novo
que a última mudança, e mudança de código depois do portão caduca as aprovações. Então a conferência do revisor é
uma segunda trava da mesma coisa.

**Falsos positivos.** Nenhum. As reprovações e os AJUSTES eram reais. O custo do grupo D é de ordem, não de conteúdo.

## Propostas

**1. A mutação vale termo a termo e também depois do ajuste**

```
Causa: A — 7 reprovações (5.0, 9.0, 10.0, 11.0, 13.0 ×2, 17.0)
Onde evitar: autoconferência (executar-task, passo 2)
Mudança: .claude/skills/executar-task/SKILL.md — no primeiro item da autoconferência, depois de
  "Registre na seção "Mutações" do `N_task.md`: `arquivo:linha → teste vermelho`.", acrescentar:
  "Condição composta (`a && b && c`) se muta termo a termo: trocar a expressão inteira por `true`
  deixou dois de três termos sem teste na 17.0 da A1. E a mutação vale para a cláusula que entra
  depois, para atender um revisor: na 11.0 e na 13.0 da A1, a condição posta pelo ajuste do
  `frontend-reviewer` chegou sem linha nova em "Mutações" e o `test-engineer` reprovou."
Efeito esperado: deixam de acontecer as reprovações por termo de condição composta e por cláusula
  vinda de um ajuste (3 das 7).
```

**2. A ordem de chegada é forçada no teste**

```
Causa: B — 4 reprovações e 1 esteira vermelha (4.0, 7.0, 11.0, 14.0; W6 da 16.0)
Onde evitar: autoconferência e N_task.md
Mudança: .claude/skills/executar-task/SKILL.md — novo item na autoconferência, logo depois de
  "Toda operação que pode acontecer duas vezes ao mesmo tempo tem teste com as duas chamadas
  **em paralelo** (`Promise.all`), não em sequência?":
  "- **Corrida entre duas operações diferentes, ou resposta que chega fora de ordem, tem a ordem
    forçada no teste.** No banco, `GatilhoDeParada` e `esperarNaTrava`
    (`apps/api/test/gatilho-de-parada.ts`), como o C5 e o C11 da A1. Na tela, a resposta segurada
    com `page.route` ou o relógio parado com `page.clock.pauseAt`, como o teste da correção
    `2026-10-03-decididos-continuam-marcados`. `Promise.all` solto prova a ordem que sair, e vira
    intermitente no banco carregado da esteira: 4.0, 7.0, 11.0, 14.0 e o W6 da 16.0, na A1."
  .claude/skills/criar-tasks/task-template.md — na linha de recomeço da tabela de testes, trocar
  "a resposta atrasada da entrada anterior;" por "a resposta atrasada da entrada anterior, com a
  resposta segurada no teste (`page.route` ou `page.clock.pauseAt`);".
Efeito esperado: o teste de corrida deixa de ficar verde pela ordem que calhou, e a 5ª ocorrência
  (a da esteira) aparece no portão local.
```

**3. A divergência tem seção no template, com o lugar na spec**

```
Causa: C — 4 reprovações do revisor-geral (3.0, 5.0, 9.0, 11.0)
Onde evitar: N_task.md e autoconferência
Mudança: .claude/skills/criar-tasks/task-template.md — nova seção antes de "## Mutações":
  "## Divergências resolvidas nesta tarefa

  Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
  Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
  revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
  reprovações na A1). Sem nenhuma, escreva "nenhuma".

  | Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
  |---|---|---|"
Efeito esperado: a divergência chega ao revisor-geral já escrita na spec. Com a coluna vazia, quem
  implementa vê que falta antes de chamar o revisor.
```

**4. Carimbo e portão completo (escolher 4a ou 4b)**

```
Causa: D — 3 reprovações do revisor-geral pelo carimbo (15.0, trava-de-documento-so-na-tela,
  acesso-sobrevive-ao-vinculo), e o vaivém entre portão completo e revisor que pesou na 15.0 e na 17.0
Onde evitar: executar-task passo 5 (4a) ou revisor-geral.md §5 (4b)
Mudança 4a: .claude/skills/executar-task/SKILL.md, passo 5, "Ordem", item 2 — acrescentar ao fim:
  "Antes de cada rodada do `revisor-geral`, rode
  `node tools/processo/portao-local.ts conferir tasks/prd-<funcionalidade>/<N>_task.md`. Se der inválido,
  rode o portão com as suítes que a mensagem pede antes de chamar. Na A1, três rodadas dele reprovaram
  só ou também pelo carimbo, que é uma conferência de um comando."
  .claude/skills/corrigir/SKILL.md, passo 5 — a mesma frase, com o documento da correção.
Mudança 4b: .claude/agents/revisor-geral.md, §5 — trocar
  "Carimbo ausente, velho ou sem a suíte exigida é bloqueante, com o comando que a mensagem indica."
  por
  "Carimbo ausente, velho ou sem a suíte exigida vai na linha `Portão local` do veredito, com o
  comando que a mensagem indica, e não é bloqueante. O hook recusa o commit sem carimbo mais novo que
  a última mudança, e o portão que mexer em código caduca esta rodada. Assim, aprovar sem o carimbo
  não deixa passar nada que o portão não tenha visto verde."
  e, em "Severidade e rodada nova", tirar "ou deixa o portão local sem carimbo válido" da lista do
  bloqueante. Em .claude/skills/executar-task/SKILL.md, passo 4, trocar "O `revisor-geral` confere o
  carimbo em vez de rodar tudo de novo." por "Quem barra o commit sem carimbo é o hook. O
  `revisor-geral` só diz o que o `conferir` respondeu." e, depois de "Rode o portão antes dos
  revisores. Mexeu em código depois dele, rode de novo antes do commit.", acrescentar: "As rodadas
  intermediárias não pedem portão novo. Antes de cada rodada do `test-engineer` basta rodar os testes
  que a correção tocou (`npx vitest run <arquivos>`, `npx playwright test <specs>`). O portão completo
  roda de novo uma vez, depois do lote de recomendações, e o passo 6 o confere."
Efeito esperado: 4a acaba com a rodada perdida por carimbo, mas mantém um portão completo antes de
  cada rodada do revisor-geral. 4b acaba com a rodada perdida e também com o vaivém: o portão
  completo roda duas vezes por tarefa (antes do test-engineer e antes do commit), e não uma vez por
  rodada.
```

**5. O portão local sem o `dist` dos pacotes**

```
Causa: E (dist) — 1 esteira vermelha (17.0), dentro de uma classe com 4 (N4/M6 do /validar)
Onde evitar: portão local
Mudança: tools/processo/portao-local.ts — logo antes da linha
  "const falhou = !dependencias ? 'dependências' : suites.find(...)", acrescentar
  "// A esteira começa do clone, sem `packages/*/dist`. Um dist velho na máquina deixa passar import
  // pelo nome do pacote, que o Playwright resolve para o dist (correção 2026-10-03-e2e-sem-dist-do-shared).
  rodar('rm -rf packages/*/dist')"
  e repetir o `rm` antes da suíte `e2e`, porque um `ops:*` rodado pelo `test` reconstrói o dist. Com o
  teste do caso que roda o `portao-local.ts` como processo (`tools/processo/revisoes.test.ts`): com um
  `packages/shared/dist` plantado, o e2e não o vê.
Efeito esperado: o portão local reproduz a falta de dist da esteira para qualquer caminho, não só
  para o import do e2e que a guarda de tools/ci/playwright.test.ts cobre. Quem precisa do dist
  (os `ops:*`, o `ensaio:alertas`) já o constrói.
```

**6. O spec de e2e da tarefa roda repetido, com os trabalhadores da esteira**

```
Causa: E (corrida de render) — 1 esteira vermelha (16.0, W6), dentro da mesma classe de 4
Onde evitar: executar-task passo 4
Mudança: .claude/skills/executar-task/SKILL.md, passo 4 — depois do bloco de comandos, acrescentar:
  "Com `--e2e`, os specs que a tarefa criou ou alterou rodam também repetidos, com os trabalhadores da
  esteira, sobre o ambiente que o `test:e2e` deixou de pé:
  `npx playwright test <specs da tarefa> --repeat-each 3 --workers 2`. A máquina roda o e2e com 6
  trabalhadores e a esteira com 2. O W6 da 16.0 passou em três portões locais e caiu na esteira por
  uma ordem de entrega que só a máquina lenta produziu (correção `2026-10-03-decididos-continuam-marcados`,
  que reproduziu com `--repeat-each 3`)."
Efeito esperado: a corrida de render que depende da ordem aparece antes do commit, por alguns minutos
  só com os specs da tarefa.
```

**7. Esteira vermelha com a tarefa pronta: o caminho escrito**

```
Causa: F — 3 stashes e 3 correções commitadas sobre esteira vermelha (14.0, 17.0, a do dist;
  241ba1c, ef2bed0, 509cfc3). O stash@{0} "tarefa 1.0 A0 aprovada, aguardando esteira", de 23/09,
  continua na lista
Onde evitar: executar-tasks, executar-task passo 7, corrigir passo 6
Mudança: .claude/skills/executar-task/SKILL.md, passo 7 — no item "`conclusion` diferente de
  `success` (...)", depois de "Corrigir ou reexecutar a esteira não é escopo desta tarefa",
  acrescentar: ". Deixe o trabalho na árvore, sem stash e sem descartar nada, e ponha no relatório
  `Trabalho: pronto, sem commit`, com o `git status --short` dos arquivos da tarefa."
  .claude/skills/executar-tasks/SKILL.md — trocar "Se a esteira ficou vermelha, ele para sem commitar e
  a execução para aqui." por:
  "Se a esteira ficou vermelha, ele para sem commitar, com o trabalho na árvore. O orquestrador então:
  (1) guarda a tarefa com `git stash push --include-untracked -m "tarefa N.0 pronta, esteira de <hash>
  vermelha"`; (2) roda o `/corrigir` da esteira, que commita por cima do vermelho (ver o passo 6 dele);
  (3) espera a esteira da correção ficar verde; (4) volta a tarefa com `git stash pop` e confere que o
  `git stash list` não guardou mais nada dela; (5) dispara um subagente novo para a mesma tarefa, só
  para os passos 4 a 7: portão de novo (a base mudou), rodada nova de quem o hook apontar, conferência,
  commit e push. Stash que sobra é trabalho perdido: o da 1.0 da A0, de 23/09, continua na lista."
  .claude/skills/corrigir/SKILL.md, passo 6 — trocar "Com a esteira do commit anterior verde (passo 7
  da `executar-task`):" por "Com a esteira do commit anterior verde (passo 7 da `executar-task`), salvo
  quando a origem desta correção é a esteira vermelha do commit anterior: aí ela commita por cima dela,
  porque é ela que a fecha, e a esteira que precisa ficar verde é a dela. Correção de outra origem
  espera o verde, como tarefa. Na A1, `241ba1c`, `ef2bed0` e `509cfc3` seguiram essa exceção sem ela
  estar escrita:"
Efeito esperado: o orquestrador não improvisa o caminho, o /corrigir deixa de se contradizer, e
  nenhum stash fica esquecido.
```

**8. Pendência com destino no /validar se fecha antes dele**

```
Causa: G — 4 itens do TODO.md com destino no /validar da A1 chegaram abertos; G1 e G2 viraram as duas
  maiores e custaram duas correções e uma 2ª rodada de validação
Onde evitar: executar-tasks, encerramento
Mudança: .claude/skills/executar-tasks/SKILL.md, seção 3 — trocar "Com todas as tarefas concluídas, o
  próximo passo é `/validar <funcionalidade>` e, depois dele, `/retro <funcionalidade>`." por:
  "Com todas as tarefas concluídas, antes do `/validar`, procure o que tem destino nele:
  `grep -n "/validar\` da <spec>" TODO.md tasks/prd-<funcionalidade>/*_task.md`. Cada item sai com um de
  três destinos: fechado por `/corrigir`; decidido pelo Joaquim, com destino novo escrito (fase ou
  portão); ou levado ao `/validar` como pergunta explícita, no relatório de encerramento. O validador
  confere, não decide. Na A1, G1 e G2 tinham "destino: antes do /validar", chegaram abertas e viraram
  as duas maiores. Depois disso, `/validar <funcionalidade>` e, depois dele, `/retro <funcionalidade>`."
Efeito esperado: o /validar recebe as pendências já decididas, e uma ressalva prevista não custa uma
  rodada de validação a mais.
```

**9. Tarefa de tela é uma tela**

```
Causa: H — 4 tarefas de tela com mais de 25 arquivos de código (11.0, 13.0, 14.0, 15.0); a 13.0 previa
  11 arquivos, levou 53 e teve 17 rodadas
Onde evitar: criar-tasks
Mudança: .claude/skills/criar-tasks/SKILL.md, diretriz "Tarefa cabe numa rodada de revisão" — acrescentar
  ao fim: "Tarefa de tela conta as telas: uma tela, ou um diálogo grande, por tarefa, com o e2e dela.
  A 13.0 da A1 juntou Estrutura, Lista e Alocação, previa 11 arquivos e levou 53, com 17 rodadas e 7 do
  `test-engineer`. A 11.0, a 14.0 e a 15.0 também passaram de 25."
Efeito esperado: menos rodadas por tarefa de tela, e e2e de mutação mais curto por rodada.
```

**10. Estados da tela na tabela de testes**

```
Causa: I — 4 AJUSTES do frontend-reviewer (13.0 ×2, 14.0 ×2)
Onde evitar: N_task.md
Mudança: .claude/skills/criar-tasks/task-template.md — nova linha na tabela de testes, antes da linha
  de recomeço:
  "| estados da tela: [carregando, erro, vazio, com dado; o vazio e o "falta" só com a leitura
  terminada e sem erro; o foco depois de cada ação que troca o que aparece] | e2e | |"
Efeito esperado: deixam de acontecer o "falta" mostrado no carregando, o vazio que esconde o erro e o
  foco que se perde depois de um ajuste.
```

**11. "Mutações" aponta o trecho, não o número da linha**

```
Causa: J — 12 rodadas do test-engineer com a tabela como recomendação principal, 4 só por número de
  linha que andou (4.0, 5.0, 17.0 ×2)
Onde evitar: N_task.md e autoconferência
Mudança: .claude/skills/criar-tasks/task-template.md, seção "Mutações" — trocar o cabeçalho
  "| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |" por
  "| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |".
  .claude/skills/executar-task/SKILL.md, passo 2 — trocar "`arquivo:linha → teste vermelho`" por
  "`arquivo` › função › trecho da cláusula → teste vermelho, sem número de linha, que muda a cada
  edição (o `test-engineer` apontou linha deslocada em quatro rodadas da A1)".
Efeito esperado: some a rodada de lote só para acertar número de linha.
```

**12. Correção grande tem revisor-geral obrigatório**

```
Causa: K — 2 (decididos-continuam-marcados com 7 arquivos, e2e-em-fatias com 11, a N5 do /validar)
Onde evitar: corrigir passo 5
Mudança: .claude/skills/corrigir/SKILL.md, passo 5 — trocar "`revisor-geral` não é obrigatório aqui;
  chame-o se a correção passou de ~5 arquivos." por "`revisor-geral` é obrigatório quando a correção
  altera mais de 5 arquivos fora de `tasks/`, ou toca `.github/`, `tools/ci/` ou `tools/processo/`.
  Escreva-o na linha "Subagentes obrigatórios" do documento, no passo 1 ou assim que passar do limite,
  para o hook cobrar (`revisoresObrigatorios`, em `tools/processo/revisoes.ts`)."
Efeito esperado: o "~5 arquivos" deixa de ser lembrete e passa a ser cobrado pelo hook.
```

**13. Conferir o que entrou no commit**

```
Causa: L — 1 ocorrência, com peso (15.0: f0a0caa saiu parcial, desfeito e refeito antes do push)
Onde evitar: executar-task passo 7 e corrigir passo 6
Mudança: .claude/skills/executar-task/SKILL.md, passo 7 — depois de "nunca `--amend` em commit
  existente, nunca `--no-verify`", acrescentar: "Antes do commit, `git diff --cached --name-only`
  confere com a lista dos arquivos da tarefa (um `git add` que falha num caminho errado não
  prepara nada daquele comando). Depois do commit e antes do push, `git show --stat HEAD` e
  `git status --short`: nada da tarefa pode ter ficado de fora. Se ficou e o commit ainda não foi
  enviado, `git reset --soft HEAD~1`, prepare de novo e refaça. Na 15.0 da A1, o commit saiu
  parcial e só foi refeito porque alguém olhou."
  .claude/skills/corrigir/SKILL.md, passo 6 — a mesma conferência, no item do stage.
Efeito esperado: nenhum commit parcial chega à esteira.
```

**14. Reenvio em paralelo com duas restrições únicas, na Tech Spec**

```
Causa: M — 5 não aprovações em 3 rodadas da revisão da spec (test-engineer e infra-guardian, C2)
Onde evitar: Tech Spec, seção 7c
Mudança: .claude/skills/criar-techspec/template.md, seção 7c, linha "Corridas de concorrência" —
  acrescentar ao fim da resposta: "; quando a mesma escrita pode violar duas restrições únicas (a
  chave de idempotência e a regra de negócio), qual delas decide, e que a resposta ao perdedor não
  depende da ordem em que o Postgres as confere"
Efeito esperado: a spec já nasce com a resposta que a A1 levou três rodadas para fechar.
```

**15. `concurrency` com `cancel-in-progress` na `develop` (recomendação: recusar)**

```
Causa: recomendação do infra-guardian na correção e2e-em-fatias, marcada para esta retro — 1
Onde evitar: .github/workflows/ci.yml
Mudança: .github/workflows/ci.yml — bloco `concurrency: { group: esteira-${{ github.ref }},
  cancel-in-progress: true }`, e tools/ci/esteira.test.ts aceitando `${{ github.ref }}` ao lado de
  `${{ matrix.fatia }}` na guarda das expressões
Efeito esperado: não sobram quatro composes rodando sobre um commit já substituído.
```

## O que tirar

Nada do checklist. O `tenancy-guardian`, o `privacy-guardian` e o `infra-guardian` não reprovaram nenhuma tarefa
(66 rodadas), mas reprovaram a spec nas rodadas 1 a 4. É a prova de que o trabalho deles foi para onde devia, e
as regras 10, 20 e 70 não se afrouxam por retrospectiva. Os itens da autoconferência que não tiveram ocorrência
nesta funcionalidade (o segundo dado, a checagem anterior, o comentário falso) tiveram na A0 e na A0b. "Qual peça
que já existe faz isto?" ainda pegou dois casos (`entradaDaSala` na 6.0, e `codigoEmDoisGrupos`, que é
`exibirCodigoDaTurma` com outro nome, na 15.0).

Se a 4b for aceita, sai a frase "O `revisor-geral` confere o carimbo em vez de rodar tudo de novo." do passo 4,
como está escrito na proposta.

## Pendências fora das propostas

- `stash@{0}` "tarefa 1.0 A0 aprovada, aguardando esteira" (23/09) continua no `git stash list`. Conferir com o
  Joaquim se o conteúdo já está em algum commit antes de qualquer `drop`. A retro não mexeu nele.
- Job `infra` da esteira a 29 a 30 min de um teto de 45, sem guarda (`TODO.md:144`). É a mesma classe do teto do
  e2e, e é a próxima a estourar.
- M2 (carga sem a trava da 10.0 nem a reconferência do gerar), N2 e N3 (casos do teste do fim de vínculo) e M1
  (texto do RF14 no PRD) seguem com o destino do `validacao.md`.

## Decisão

Decidido pelo orquestrador em 04/10/2026, por delegação do Joaquim dada em 03/10/2026. As aceitas foram aplicadas nos arquivos que cada
proposta aponta; as aceitas em correção própria estão no `TODO.md`, em "Processo e dívida do F0".

| Proposta | Decisão | Motivo |
|---|---|---|
| 1. Mutação termo a termo e depois do ajuste | aceita | deixam de acontecer as reprovações por termo de condição composta e por cláusula vinda de um ajuste (3 das 7) |
| 2. Ordem de chegada forçada no teste | aceita | o teste de corrida deixa de ficar verde pela ordem que calhou, e a ocorrência da esteira aparece no portão local |
| 3. Seção de divergências no template | aceita | a divergência chega ao `revisor-geral` já escrita na spec, e a coluna vazia avisa antes de chamá-lo |
| 4a. `conferir` antes de cada rodada do `revisor-geral` | aceita | acaba com a rodada perdida por carimbo sem mexer na semântica do carimbo; aplicada no `executar-task` e no `corrigir` |
| 4b. Carimbo não bloqueante no `revisor-geral` | recusada | muda a semântica do carimbo no `revisor-geral`, fixada pela D53; a 4a resolve a rodada perdida sem revisar a decisão |
| 5. Portão local sem o `dist` dos pacotes | aceita em correção própria | mexe em código de `tools/processo/portao-local.ts`, que pede teste e revisão; a guarda de `tools/ci/playwright.test.ts` (correção `e2e-sem-dist-do-shared`) já fecha o caminho que causou o vermelho |
| 6. Spec de e2e da tarefa repetido com 2 trabalhadores | aceita | a corrida de render que depende da ordem aparece antes do commit, em poucos minutos |
| 7. Caminho escrito para esteira vermelha com a tarefa pronta | aceita | o orquestrador não improvisa, o `/corrigir` deixa de se contradizer e nenhum stash fica esquecido |
| 8. Pendência com destino no `/validar` fechada antes dele | aceita | o `/validar` recebe as pendências já decididas, e uma ressalva prevista não custa outra rodada de validação |
| 9. Tarefa de tela é uma tela | aceita | menos rodadas por tarefa de tela, e e2e de mutação mais curto por rodada |
| 10. Estados da tela na tabela de testes | aceita | deixam de acontecer o "falta" no carregando, o vazio que esconde o erro e o foco perdido depois de um ajuste |
| 11. "Mutações" aponta o trecho, não a linha | aceita | some a rodada de lote só para acertar número de linha |
| 12. `revisor-geral` obrigatório em correção grande, texto do `/corrigir` | aceita | o "~5 arquivos" deixa de ser lembrete e vira regra escrita |
| 12. A cobrança pelo hook | aceita em correção própria | mexe em código de `tools/processo/revisoes.ts`, que pede teste e revisão |
| 13. Conferir o que entrou no commit | aceita | nenhum commit parcial chega à esteira |
| 14. Duas restrições únicas na Tech Spec, seção 7c | aceita | a spec já nasce com a resposta que a A1 levou três rodadas para fechar |
| 15. `cancel-in-progress` na `develop` | recusada | tiraria de cada commit a esteira própria que o passo 7 confere, e abriria a guarda de expressões do workflow para um caso raro |

O stash antigo da A0 (23/09) e o "resto do pop abortado do stash de 18/09" ficaram no `TODO.md` para o Joaquim decidir.
Ninguém os descarta sem ele.
