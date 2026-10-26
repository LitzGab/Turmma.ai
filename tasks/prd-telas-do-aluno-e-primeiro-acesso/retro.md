# Retrospectiva — telas-do-aluno-e-primeiro-acesso (X4)

26/10/2026, pelo Arquiteto, no térreo, depois do pouso (`83f1c6d8`, 14h05) com a esteira da `develop` verde (`40365440626`).
Comparação com a retrospectiva da X7 (`tasks/prd-harness/retro.md`).

Condições que pesam nos números:

- as 11 tarefas foram **geradas em 13/10**, congeladas em 20/10 pela X5 e retomadas em 24/10. A conferência do Arquiteto
  (`341deca`) alinhou caminhos e nomes ao código da X5 e da X7, e **não** trouxe para os documentos o que as retrospectivas da X3
  (20/10), da X5 (23/10) e da X7 (24/10) acrescentaram a `criar-tasks` e ao `task-template.md`;
- três linhas, todas com Sonnet 5.5; construção de 24/10 23h20 a 25/10 20h16 (11.0); fechamento de 25/10 ~20h30 a 26/10 14h05;
- duas decisões do Joaquim na construção (a 7.0, memória do transferido; a 9.0, a mensagem fixa) e três no fechamento (o MA1,
  o censo de 36 casos, o `privacidade:253`), todas com a recomendação.

## Medidas

```
Tarefas: 11 · Rodadas de revisor: 134 · Reprovações: 14 (10,4%)
Por revisor: test-engineer 25/9 · revisor-geral 25/2 · conformidade-reviewer 18/1 · privacy-guardian 17/1
             frontend-reviewer 15/1 · tenancy-guardian 17/0 · infra-guardian 17/0
Por modelo do implementador: Sonnet 5.5 nas 11; 12,2 rodadas e 1,3 reprovação por tarefa; 2 diagnósticos do Arquiteto
  (correção data-fixa e correção gitleaks-pasta, as duas com ESCALADA), 1 BLOQUEIO (7.0) destravado pelo Joaquim
Rodadas por tarefa: média 12,2, pior 3.0 com 21 (sete revisores, três rodadas, uma reprovação)
Rodadas que caducaram sem reprovação do próprio revisor: 44 de 134 (33%)
Correções fora de tarefa: 19, com 160 rodadas e 10 reprovações (6,3%)
Duração: construção 24/10 23h20 → 25/10 20h16 (~21 h); fechamento 25/10 ~20h30 → 26/10 14h05 (~17 h 30, seis rodadas de
  validação e nove correções)
Revisão da spec (13/10): 18 rodadas, 12 não aprovadas, aprovada na 4ª rodada
Validação: rodada 1 REPROVADA (C1), 2 REPROVADA (C2), 3 APROVADA COM RESSALVAS (MA1), 4 a 6 APROVADA; 12 menores (M) e 11 (MN)
```

Como contei: as linhas da tabela "Revisões" dos 11 `N_task.md`, de `revisao-spec.md` e das 19 correções do período (de
`2026-10-24-arquivo-do-titular-data-fixa` a `2026-10-26-material-sem-licenca-perto-do-prazo`), escritas pelo hook; os blocos
de `achados/` de cada reprovação; o tempo pelo `git log` (hora do commit de que a tarefa dependia na linha dela ao commit dela);
a esteira por `gh run list --branch spec/telas-do-aluno-e-primeiro-acesso`.

| | F3 | X3 | X5 | X7 | X4 |
|---|---|---|---|---|---|
| Tarefas | 20 | 14 | 36 | 21 | 11 |
| Reprovações nas tarefas | 22,9% | 15,3% | 21,3% | 17,3% | 10,4% |
| Rodadas por tarefa | 11,8 | 8,4 | 6,6 | 7,1 | 12,2 |
| Caducadas sem reprovação | 34% | 33% | 29% | 29% | 33% |
| Correções fora de tarefa | 9 | 19 | 6 | 13 | 19 |
| Crítico ou maior no 1º /validar | 1 c, 2 M | 4 c, 4 M | 1 c, 1 M | 1 c, 1 M | 1 c (e mais 1 c e 1 M depois) |
| Tarefas sem nenhuma reprovação | 1 de 20 | 4 de 14 | 15 de 36 | 7 de 21 | 2 de 11 |

As rodadas por tarefa sobem porque tarefa de tela da X4 leva sete revisores (os quatro guardiões, o `frontend-reviewer`, o
`test-engineer` e o `revisor-geral`); a taxa de reprovação é a menor das cinco.

## As cinco medidas da D79

**1. Da partida ao commit.** Mediana de **~99 min** (38 na X7, 42 na X5, ~112 na X3, 99 no F3), aproximada: 57 (4.0), 68 (11.0),
92 (9.0), 99 (6.0 e 8.0), 115 (10.0), 118 (1.0, com a correção data-fixa no meio), 166 (3.0), 173 (2.0, com o erro 500 da Mesa);
a 7.0 ficou de fora (BLOQUEIO e decisão do Joaquim) e a 5.0 não tem início legível. Tarefa de tela tira e lê fotos em duas
rodadas; não é a mesma medida que a X7, de processo.

**2. Tarefas sem reprovação.** 2 de 11 (7.0, 11.0).

**3. O grupo A (mutação).** **2** (4.0 `materia.ts:46`, 6.0 `nome-dos-chunks.ts:143`), contra 8 na X7 e 10 na X5. Nas duas, o
`mutacoes.ts --faltando` apontava a linha, e o `test-engineer` o citou; nenhum passo do `executar-task` nem do `corrigir` manda
rodá-lo (é a P4 da X7 de novo: peça pronta sem o caminho de uso).

**4. Vermelhos da esteira por push.** Na `spec/…`, de 25/10 em diante: 54 execuções, **11 verdes, 8 vermelhas, 35 canceladas**
(pelo `concurrency`, superadas). Do push ao veredito, mediana de **39 min** e máximo de 42 (70 e 4 h 26 na X7): a M4 da X7, a
esteira sem as branches de linha, resolveu a fila. Dos 8 vermelhos, **3 foram e2e de outro arquivo que passava pela tela mudada**
(W12 da casca, o Tutor pausado do `aluno-fluxo`, o W1 da `escola-montada`), 1 foi teste que contava com escola semeada por
outro caso (`operacao-uso`), 2 foram trava ou prazo de e2e da dívida (`areas:619`; 6 casos do celular a 30–32 s no push do
pouso, `40365404286`, no mesmo `83f1c6d8` que ficou verde na `develop`), e 2 foram de soma (o teto da fatia antes da oitava, e
`4f9a4ab0` com integração e unidade, superado no push seguinte).

**5. Do último commit ao pedido de pouso.** Último commit com mudança fora de `tasks/` às 13h08 (`b507c078`), pouso às 14h05:
**~1 h**, a validação da rodada 6. Era 1 h 05 na X7.

O número que pesa é outro: o **fechamento levou ~17 h 30**, quase o tempo da construção. Seis rodadas de validação e nove
correções; dessas, quatro vieram do RF20 (grupo B), três do censo do e2e (grupo E) e duas de texto (o roteiro e a mensagem fixa).

## Grupos de causa

### Tarefas (14 reprovações)

| # | Causa | Ocorrências | Onde | Onde evitar |
|---|---|---|---|---|
| A | Linha da tabela de testes sem caso, ou com metade dela | 7 | 1.0 ×2 (o `escolher` sem data; só faltava citar o caso), 2.0 (recomeço do Início), 5.0 (metade de "passo obrigatório"), 8.0 (o cookie nunca conferido), 9.0 (`BemVindo.test.tsx:306`), 10.0 (RF20 no último passo) | autoconferência: os 11 documentos não têm a seção (nasceram antes de 24/10), e nenhuma pergunta dela pede o caso de cada linha |
| A′ | Cláusula nova sem bloco de mutação | 2 | 4.0, 6.0 | autoconferência: o `--faltando` não está em passo nenhum |
| C | Defeito real que só a revisão viu | 3 | 3.0 (regressão a 360 px trazida pela correção da rodada), 9.0 (o aviso não dizia que o professor recebe o sinal, privacy), 9.0 (`Eu.tsx:53` com `Linha.tsx:58`, frontend) | é para isso que a revisão existe |
| D | Texto de documento que afirma o que não aconteceu | 2 | 4.0 (sete destinos errados em "Sem aplicar"), 5.0 (data do parecer no `interface.md`) | autoconferência, pergunta 7, já cobre |

**Falsos positivos.** Nenhum.

### Validação e esteira (o que custou o fechamento)

| # | Causa | Ocorrências | Onde evitar |
|---|---|---|---|
| B | **RF de toda tela ("cabe em 1366 × 768") fora das tarefas** | C1 (Eu e Início) e C2 (a tarefa aberta), quatro correções (`inicio-cabe`, `eu-cabe`, `tarefa-aberta-cabe`, e o W1 que a do Eu derrubou), três rodadas de validação | criar-tasks: a diretriz existe desde a retro da X3 (20/10), mas a 3.0, a 6.0 e a 7.0 foram geradas em 13/10 e a conferência de 24/10 não a trouxe. E o `frontend-reviewer` viu o Eu a 822 px na 7.0 e deixou como recomendação, que a tarefa recusou com "o PRD não pede" (`7_task.md:193`), e o RF20 pede com essas palavras. A vitrine sem tarefa "Para fazer" (M5) escondeu o Início e a tarefa aberta das fotos |
| W | **E2e de outro arquivo que passa pela tela mudada caiu só na esteira** | 3 (W12 de `casca.spec.ts` pela 2.0; `aluno-fluxo.spec.ts:167` pela 3.0; W1 de `escola-montada.spec.ts:228` pela correção do Eu) | o portão só puxa o e2e que cita texto **removido**; nos três o e2e procurava por papel e lugar (`navegacoes`, `getByRole('link', { name })`, `getByRole('heading', { name: turma })`), sem literal tirado. Os três são specs de jornada |
| R | O roteiro da demonstração não acompanha a tela | 2 (MA1 da X4; o MN1, "Estrutura" e "IA" que a X2 deixou) | tasks-template: o critério de pronto não o cita |
| E | **Caso de e2e da dívida da develop oscilando perto do prazo** | 3 correções um a um (`tres-casos`, `areas-entrar`, `material-sem-licenca`), duas paradas do Joaquim, o `privacidade:253` ao `TODO.md`, e 6 casos a 30–32 s no push do pouso | o passo 8 manda corrigir todo caso acima de 2/3 antes de fechar, sem separar o que a spec tocou da dívida; e as três correções acharam a mesma causa (a entrada pela tela e a primeira carga sob a rede do perfil), que é também onde mora a trava do `goto('/entrar')` |

## Os pontos apontados no pedido

- **`getByRole('heading'` no portão (W1).** É o grupo W. Os três casos têm em comum ser spec de jornada, e não o seletor: pôr
  `getByRole('heading'` no portão pegaria só o W1. Proposta P4 (aviso) e M2 (confirmação).
- **MN6.** O roteiro no critério de pronto: P5. O `forEach` de `convite.spec.ts` por causa da contagem de
  `tools/ci/duracao-do-e2e.ts` (`casosAlterados` conta como do caso tudo até o `test(` seguinte, e um `for` solto puxa o vizinho):
  uma ocorrência, vai ao `TODO.md` com a correção sugerida (o caso termina na linha que fecha o `test(` na indentação dele).
- **MN7.** Testado nesta retro: com `npm_config_yes=false`, `npx cowsay` sai com "npx canceled due to missing packages and no YES
  option" sem baixar nada, e `npx playwright` e `npx vitest`, que estão no `package-lock.json`, rodam. Proposta M3.
- **MN11.** Os revisores da `material-sem-licenca` levaram de 13 a 41 s, e as correções de 25 e 26/10 têm mediana de 26 s por
  rodada (47 s nas tarefas da X4, 50 s nas da X7). O diff vai no prompt (`revisar-tarefa`, seção 3), e numa correção de um
  arquivo só de teste o revisor não precisa abrir nada; os achados citam linha e nome do ajudante, e o `infra-guardian` de 13 s
  achou o nome enganoso de `abrirMaterialPeloEndereco`. **Não proponho mudança:** a medida sustenta "na medida", não "rápida
  demais". O custo de verdade é outro: seis revisores, quatro deles guardiões sem nada no domínio, em correção só de e2e; tirar
  guardião de arquivo que pode provar isolamento (o W1 prova "só a turma dela") não entra pela retro.
- **O `goto('/entrar')` no harness na 3ª ocorrência.** A trava foi vista duas vezes (17/10 e 26/10). Não proponho esperar a
  terceira: o mesmo lugar (a primeira carga de um contexto novo sob `Network.emulateNetworkConditions`, em
  `e2e/__fixtures__/perfis.ts`) explica as três correções do censo, e a investigação entra na correção em lote do grupo E (M4).
- **O censo que oscila perto de 90%.** Grupo E: M4 e M5.

## Propostas

### Aviso (só skill, papel ou modelo; aplico às 15h30 se o Joaquim não objetar)

**P1. Cada linha da tabela de testes cita o caso** (grupo A, 7)

```
Mudança: .claude/skills/criar-tasks/task-template.md, "Testes que provam a regra": a tabela ganha a coluna "Caso", que quem
  implementa preenche antes da Mesa com `arquivo › nome do caso`, um por comportamento da linha; e a Autoconferência ganha
  a pergunta 13: "Cada linha da tabela tem o caso escrito na coluna 'Caso', e a linha que diz duas coisas ('fecha e volta',
  'em endereço, cabeçalho ou corpo') tem um caso para cada? Na X4, 7 das 14 reprovações foram linha sem caso ou com metade."
  E .claude/skills/executar-task/SKILL.md, autoconferência: documento sem a coluna, escreva a lista "linha → caso" no plano.
Efeito esperado: a reprovação mais comum do test-engineer em toda retro passa a ser vista por quem implementa
```

**P2. O `--faltando` antes da Mesa** (grupo A′, 2)

```
Mudança: .claude/skills/executar-task/SKILL.md, depois do bloco de mutação da autoconferência, e .claude/skills/corrigir/SKILL.md,
  no mesmo passo: "Antes de pedir a rodada, rode `node tools/processo/mutacoes.ts --faltando <documento>`: cada linha que ele
  lista ganha bloco na seção 'Mutações', ou a meia linha do motivo. Na X4, a 4.0 e a 6.0 reprovaram por linha que ele apontava."
Efeito esperado: zero reprovação por cláusula que o próprio portão já lista
```

**P3. Página que rola a 1366 × 768 contra o RF da spec é bloqueante** (grupo B; o `frontend-reviewer` é sem veto)

```
Mudança: .claude/agents/frontend-reviewer.md, no parágrafo da linha `Rolam a 1366 × 768`: "Antes das fotos, procure `1366` no
  `prd.md` da spec. Se um RF diz que a tela cabe, a tela dele na lista `Rolam` é bloqueante, com o número do RF. Na X4, a 7.0
  viu o Eu a 822 px e deixou como recomendação; a validação reprovou duas vezes pelo mesmo RF20."
  E .claude/skills/executar-task/SKILL.md, "Recomendações sem aplicar": "Recusa com 'o PRD não pede' ou 'a Tech Spec não pede'
  cita o RF ou a seção que você leu. Se um RF trata do assunto, não é recusa: aplique, ou abra DIVERGÊNCIA."
Efeito esperado: o C1 da X4 seria visto na 7.0, e não na validação
```

**P4. Tela com estrutura mudada roda os specs de jornada** (grupo W, 3)

```
Mudança: .claude/skills/executar-task/SKILL.md, depois de "O portão roda também o e2e que cita um texto…": "Mudou a estrutura
  de uma tela (tirou um título, um cartão, um item da navegação, ou levou um texto para outro elemento)? Rode isolados, antes
  do portão, os specs de jornada que passam por ela: `e2e/casca.spec.ts`, `e2e/escola-montada.spec.ts`,
  `e2e/aluno-fluxo.spec.ts` (aluno) e `e2e/roteiro-da-demonstracao.spec.ts`. Eles procuram por papel e lugar, não por texto
  removido, e o portão não os puxa: na X4, os três caíram só na esteira."
Efeito esperado: três correções a menos por spec de tela
```

**P5. O roteiro da demonstração no critério de pronto** (grupo R, 2)

```
Mudança: .claude/skills/criar-tasks/tasks-template.md, "Critério de pronto da funcionalidade": "Spec que muda tela que o
  `docs/roteiro-da-demonstracao.md` percorre: o roteiro conferido passo a passo contra `e2e/roteiro-da-demonstracao.spec.ts`,
  na tarefa que muda a tela."
Efeito esperado: o MA1 da X4 e o MN1 da X2 não chegam à validação
```

### Confirmação, item a item

**M1. Tarefa mais velha que a última retro é refeita pelas diretrizes de agora** (`criar-tasks`, que decide a marcação; grupos A e B)

```
Mudança: .claude/skills/criar-tasks/SKILL.md, seção nova "Tarefas geradas antes": "Spec retomada (congelada, ou com `tasks.md`
  mais velho que o último `tasks/prd-*/retro.md`): a conferência do Arquiteto passa por `git log -p --since=<data do tasks.md>
  -- .claude/skills/criar-tasks/` e aplica a cada `N_task.md` pendente cada diretriz e seção do modelo que entrou depois (a
  linha do RF de toda tela, a Autoconferência, a coluna Caso), sem mudar objetivo nem critério. Na X4, a 3.0, a 6.0 e a 7.0
  nasceram em 13/10 sem a linha 'cabe em 1366' que a retro da X3 pôs em 20/10, e a validação reprovou duas vezes por ela."
Efeito esperado: o C1 e o C2 da X4, e parte do grupo A
```

**M2. O portão puxa os specs de jornada** (código de processo; a versão de máquina da P4)

```
Mudança: tools/processo/portao.ts (`alvosDoPortao`): diff em `apps/web/src/areas/<papel>/` ou em `apps/web/src/componentes/`
  põe nos alvos `casca.spec.ts`, `escola-montada.spec.ts` e o de jornada do papel (`aluno-fluxo.spec.ts` para o aluno), com a
  linha `▶ e2e/<arquivo> entra nos alvos: jornada`; sem cobrança de duração (não foram tocados). Teste e bloco de mutação.
Custo: uns 3 a 5 min de portão por tarefa de tela (o W1 leva ~45 s por projeto)
Efeito esperado: os três vermelhos do grupo W vistos antes do commit
```

**M3. `npx` nunca baixa pacote de fora** (`.claude/settings.json`; MN7)

```
Mudança: .claude/settings.json, "env": { "npm_config_yes": "false" }. Vale para toda sessão do Claude e os subagentes; a
  esteira não lê o arquivo. O `npx skills update -p` (time.md) continua com o Joaquim no terminal dele; pelo Claude, precisa
  de `--yes` explícito, que o pedido mostra
Efeito esperado: um revisor não executa pacote baixado da rede no checkout com as credenciais do GitHub
```

**M4. Correção em lote "primeira carga do e2e", antes da X8** (código de teste; grupo E e o `goto('/entrar')`)

```
Mudança: a linha do TODO.md "(X4, censo do e2e) 36 casos…" passa a ser uma correção só, em três partes, a primeira antes da
  X8 (que vai tocar muitos e2e no rename): (a) a investigação que a correção areas-entrar deixou para a 3ª ocorrência: laço de
  contextos novos que só fazem `goto('/entrar')` sob o perfil, com e sem a limitação, em `e2e/__fixtures__/perfis.ts`;
  (b) a receita das três correções (entrada pela API, `carregarSemRedeLenta` com `aguardar` na primeira tela) num ajudante
  de `e2e/__fixtures__/`, com o nome do que ele não mede; (c) os casos da linha, por grupo, com o `privacidade:253` primeiro, e os cinco
  `pecas-*` e `coordenacao-introducao:201` que passaram de 30 s no push do pouso (`40365404286`)
Efeito esperado: o censo do próximo fechamento sai 0 sem correção um a um
```

**M5. O censo separa o caso da spec da dívida da develop** (passo 8 do `/seguir`, muda o que segura o pouso; grupo E)

```
Mudança: .claude/skills/seguir/passos/8-validacao-e-pouso.md, "Sai 1": "Separe os casos dos arquivos que a spec alterou
  (`git diff --name-only develop... -- e2e/`): esses viram correção antes de fechar. Os outros são dívida da develop: uma linha
  no grupo dela no TODO.md, com o número da execução, sem parada; acima de 90% do prazo, a linha vai ao topo do grupo."
Efeito esperado: as duas paradas do Joaquim da X4 pelo censo (01h20 e o `privacidade:253`), que tiveram a mesma resposta
```

**M6. Correção só de e2e depois da validação não pede rodada nova do Validador** (passo 8; regra 70 intocada)

```
Mudança: passos/8-validacao-e-pouso.md, depois de "valide de novo": "salvo a correção que só muda `e2e/`, `tasks/` e o
  TODO.md, sem tirar nem mudar asserção: ela passa pela Mesa e pela esteira, e a próxima rodada do Validador, se houver, a lê."
Efeito esperado: as rodadas 5 e 6 da X4 (~40 e ~55 min), que validaram código de produção que não mudou
Risco: a correção que afrouxa um e2e sem o Validador ver; a Mesa, com o test-engineer, é quem segura isso
```

**M7. A vitrine semeia tarefa "Para fazer" e a entregar** (`tools/vitrine/escola.ts`; o M5 da validação, já no TODO.md)

```
Mudança: subir a linha do TODO.md para correção antes da próxima spec de tela, com o seed "respondeu 0 de 4" (C2) e a lista de
  Física com habilidade de Química (MN10) juntos
Efeito esperado: a foto do Início com dado e da tarefa aberta sai do `vitrine.ts foto`; foi a falta delas que escondeu o C1 e o C2
```

### Ao `TODO.md` (uma ocorrência; não viram proposta)

- O `forEach` imposto pela contagem de `casosAlterados` (`tools/ci/duracao-do-e2e.ts`): o caso termina na linha que fecha o seu
  `test(`, e não no `test(` seguinte (MN6, revisor-geral da correção `tres-casos`)
- O push da branch da spec no pouso roda a esteira no mesmo commit que a da `develop` (`40365404286` vermelha e `40365440626`
  verde, ambas em `83f1c6d8`): ninguém lê a primeira. Fica registrado; se voltar a confundir, o pouso não empurra a spec

### O que tirar

Nada. Nenhum item de checklist ficou sem pegar nada a ponto de valer a leitura: a Autoconferência nem estava nos documentos.

## Decisão

Perguntei ao Joaquim em 26/10/2026, às 14h58, no terminal do Arquiteto. Ele respondeu "faça o melhor e o recomendado para o
projeto": apliquei os avisos às 15h12, sem esperar as 15h30, junto com as confirmações. Recomendei as sete; as que mudam código
viram correção no `TODO.md`, como na X7 (M2, M3, M4 e M7).

| Proposta | Decisão | Onde |
|---|---|---|
| P1. Coluna "Caso" na tabela de testes (aviso) | aplicada; a pergunta virou parte da 11 da Autoconferência, porque o modelo tem teto de 12 perguntas (`tools/processo/harness/revisores.test.ts`, `MAXIMO_DE_PERGUNTAS`) | `task-template.md`, `executar-task/SKILL.md` |
| P2. `--faltando` antes da Mesa (aviso) | aplicada | `executar-task/SKILL.md`, `corrigir/SKILL.md` |
| P3. Rolar a 1366 contra o RF é bloqueante; recusa cita o RF (aviso, com a parte da recusa na Mesa) | aplicada | `.claude/agents/frontend-reviewer.md`; `revisar-tarefa/SKILL.md` (quem decide o destino da recomendação é a Mesa, e o arquivo é de confirmação) |
| P4. Specs de jornada antes do portão (aviso) | aplicada | `executar-task/SKILL.md` |
| P5. Roteiro da demonstração no critério de pronto (aviso) | aplicada | `criar-tasks/tasks-template.md` |
| M1. Tarefa mais velha que a última retro segue as diretrizes de agora | aplicada | `criar-tasks/SKILL.md`, seção "Tarefas geradas antes" |
| M2. O portão puxa os specs de jornada | aceita, como correção | `TODO.md`, "Da X4", item (X4, retro, M2) |
| M3. `npx` não baixa pacote de fora | aceita, como correção (o hook recusa `.claude/settings.json` fora de tarefa ou correção) | `TODO.md`, item (X4, validação, MN7) |
| M4. Correção em lote "primeira carga do e2e", antes da X8 | aceita, como correção | `TODO.md`, item do censo do e2e |
| M5. O censo separa o caso da spec da dívida | aplicada | `seguir/passos/8-validacao-e-pouso.md` |
| M6. Correção só de e2e depois da validação não pede rodada nova | aplicada | `seguir/passos/8-validacao-e-pouso.md` |
| M7. A vitrine semeia "Para fazer" e tarefa a entregar | aceita, como correção | `TODO.md`, item (Telas do aluno, 3.0) |

Também no `TODO.md`: o MN11 fechado, o item do `goto('/entrar')` apontando para a M4, o `casosAlterados` (MN6) e o push
da spec no pouso. Os testes do processo que leem esses arquivos passaram (`tools/processo/harness`, `hook-portao`, `vigia`,
`revisoes`, `linhas`: 1103 casos).
