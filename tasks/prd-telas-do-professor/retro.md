# Retrospectiva — telas-do-professor (X3)

19/10/2026, pelo Arquiteto, no térreo, depois do pouso (`f1cb6ee`) com a esteira da `develop` verde (39344097590).
Comparação com a retrospectiva da X2 (`tasks/prd-telas-da-coordenacao/retro.md`). É a primeira spec com **três linhas**
em paralelo, e a primeira com o código de processo M1 a M5 da X2 no portão.

Condições que pesam nos números:

- a **1.0 atravessou a noite de 17 para 18/10** esperando a resposta à retrospectiva da X2 e o diagnóstico; a **correção
  de processo M1 a M5** (oito correções, `cd4cecb` a `0aea52e`) rodou antes da 2.0 e não entra nas contas abaixo;
- a **2.0 parou** na divergência da régua do e2e contra a §10 (alternativa 1 do Joaquim, 18/10 ~15h15);
- de 19/10 00h às 02h30 o **detector de literal puxava quase toda a suíte** nas três linhas (diagnóstico 3, correção
  `detector-de-literal-compara-com-a-web`), e o portão de cada tarefa levava de 30 a 46 min;
- a **API caiu às 11h55 de 19/10** e parou dois turnos por alguns minutos.

## Medidas

```
Tarefas: 14 · Rodadas de revisor: 118 · Reprovações: 18 (15,3%), contando 1 AJUSTES NECESSÁRIOS do frontend-reviewer
Por revisor: test-engineer 30/12 · revisor-geral 30/4 · frontend-reviewer 25/1 · conformidade-reviewer 14/0
             privacy-guardian 10/0 · tenancy-guardian 7/0 · infra-guardian 2/1
Por modelo do implementador: Sonnet nas 14, 8,4 rodadas por tarefa, 1,3 reprovação por tarefa,
  2 escaladas com diagnóstico do Arquiteto (1.0 e 6.0, as duas aprovadas na rodada seguinte),
  mediana de ~112 min da partida ao commit em 11 tarefas (de 46 a 260; sem a 1.0, a 2.0 e a 3.0, que atravessaram paradas)
Rodadas por tarefa: média 8,4, pior 1.0 com 14, depois 10.0 com 12
Rodadas que caducaram sem reprovação do próprio revisor: 39 de 118 (33%)
Correções fora de tarefa: 19, mais 4 de conflito no encontro (encontro-6, -10, -13, -14), com 66 rodadas e 9 reprovações
  - 5 por prazo de e2e na esteira, de casos que a tarefa não tocou ou tocou pouco (areas:204, mfa:85, pecas-sobrepor:556,
    acesso-suspenso:165 com escola-e-vinculos:423, privacidade:142)
  - 2 por e2e fora do diff que a tarefa quebrou contando um texto na página (acesso-da-turma, da 1.0; a2-assistente, da 6.0)
  - 3 de processo: a régua contra o prazo declarado (2.0), o detector de literal (3.0), a sétima fatia do e2e
  - 9 da validação (C1 a C4, com o C4 em duas, e A1 a A4)
Duração: 17/10 21h43 (abertura) → 19/10 19h13 (último commit de código) → 20h11 (validação) → 20h49 (pouso).
  Com as três linhas correndo (19/10 02h38 → 15h47), 12 tarefas em 13 h 09: ~66 min por tarefa entregue
Revisão da spec (13/10): 16 rodadas de revisor, 7 não aprovadas
Ressalvas do /validar: rodada 1 REPROVADA (4 críticos, 4 maiores); rodada 2 APROVADA
```

Como contei: as linhas da tabela "Revisões" dos catorze `N_task.md` e dos documentos de correção do período, escritas
pelo hook; os blocos de `achados/` de cada reprovação; a partida de cada tarefa é o commit em que a linha dela recebeu a
spec (o pai do commit da tarefa), conferido com as quatro partidas que o `estado.md` registra (8.0, 11.0, 12.0, 13.0); os
vermelhos são os de `gh run list --branch spec/telas-do-professor`, com o caso lido no log de cada execução.

| | F3 | X1 | X2 | X3 |
|---|---|---|---|---|
| Tarefas | 20 | 15 | 14 | 14 |
| Reprovações nas tarefas | 22,9% | 23,8% | 22,4% | 15,3% |
| Rodadas por tarefa | 11,8 | 8,1 | 8,3 | 8,4 |
| Caducadas sem reprovação | 34% | 31% | 28% | 33% |
| Revisão da spec, não aprovadas | 19 de 27 | 5 de 9 | 9 de 15 | 7 de 16 |
| Correções fora de tarefa | 9, e 2 falhas | 7 | 18, e 4 de encontro | 19, e 4 de encontro |
| Crítico ou maior no 1º /validar | 1 crítico e 2 maiores | 1 maior | 4 críticos e 1 maior | 4 críticos e 4 maiores |
| Tarefas sem nenhuma reprovação | 1 de 20 | 4 de 15 | 2 de 14 | 4 de 14 |

## As cinco medidas da D79

**1. Da partida ao commit.** Mediana de ~112 min, contra 119 na X2, 71,5 na X1 e 99 no F3. Por tarefa, quase igual; o
que mudou foi o paralelo: com três linhas, **12 tarefas saíram em 13 h**, perto de 66 min por tarefa entregue, contra
1 h 45 na X2 e 1 h 35 na X1. O que comeu o começo foi o detector de literal (até 46 min de portão por tarefa) e a fila de
carga no `flock`; depois da correção dele, as três linhas andaram.

**2. Tarefas sem reprovação.** 4 de 14 (3.0, 4.0, 7.0, 8.0), contra 2 de 14.

**3. O grupo A.** 8 reprovações, contra 9 na X2, 11 na X1 e 17 no F3. **As oito foram cláusula de tela**: o efeito que
devolve o foco (6.0, 14.0), a medida gravada com `style.setProperty` (6.0), a condição que mostra um pedaço do JSX (9.0,
11.0, 13.0), o id na `queryKey` (12.0) e a condição de uma chamada (1.0). Nenhuma por bloco que afirmasse um vermelho
que não acontece; uma (5.0) por bloco vermelho pelo motivo errado.

**4. Vermelhos da esteira por push.** **18 das 45 execuções da spec foram vermelhas**, 19 verdes e 8 canceladas (na X2,
27 de 39). Foram 8 casos distintos e 2 quedas de rede no `npm ci`. **Nenhum era defeito de produção**: 6 eram prazo
de e2e no `celular` (areas:204, mfa:85, escola-e-vinculos:423, acesso-suspenso:165, pecas-sobrepor:556,
privacidade:142) e 2 eram teste fora do diff contando um texto na página (acesso-da-turma, a2-assistente). O a2-assistente
ficou vermelho em quatro execuções (~2 h 30), o privacidade:142 em duas (~2 h 40). Custaram 7 correções. O
privacidade:142 já levava de 27 a 29,6 s nas execuções verdes antes de cair.

**5. Do último commit ao pedido de pouso.** Perto de 1 h (19h13 → ~20h15), contra 1 h 10 na X2, 6 h 26 na X1 e 5 h 29
no F3.

## Grupos de causa

As 18 reprovações das tarefas, cada uma num grupo só, e os oito achados críticos e maiores da validação.

| # | Causa | Ocorrências | Onde | Onde evitar |
|---|---|---|---|---|
| A | Cláusula de tela sem bloco de mutação | 8 | 1.0, 6.0 (×2), 9.0, 11.0, 12.0, 13.0, 14.0 | autoconferência: a lista de cláusulas dela só tem exemplos de backend |
| J | Item juntado por ponto e vírgula numa linha da tabela de testes, sem teste | 3 da validação, mais 1 reprovação | "100 ou mais" e "decidir tira o item" (1.0 → A1, C1), "vínculo encerrado tira a página" (10.0 → A2); a ordem de nome "não provada inteira" (10.0) | criar-tasks e o `test-engineer`, item 3 |
| T | RF de toda tela sem linha na tabela de nenhuma tarefa | 3 da validação, mais 1 reprovação | RF22 "cabe em 1366 × 768" (C4: Hoje, Alunos, formulário, "O que o Assistente fez"), RF18 uma ação cheia (C3), RF21 vocabulário (M3); 6.0 `frontend-reviewer` | criar-tasks: o RF22 está no "Contexto" de oito tarefas e em nenhuma tabela; as tabelas só dizem "sem rolar de lado" a 360 px |
| N | Lugar tirado ou renomeado, com o nome antigo em outro arquivo | 2 da validação, mais 1 reprovação | 5.0 (`Conversa.tsx`, "Salva em Ferramentas"); A4 ("Seu time" em roteiro, glossário, agentes, fluxos, AIAs); A3 (a Parte A do `docs/interface.md` sem o que a 9.0 a 13.0 fizeram); e, sem reprovar, a 7.0 (`avisos.tsx`) e os títulos de e2e (M5, N4) | criar-tasks: a busca de "Seu time" da 2.3 foi só nos textos de tela, e só a 2.0 tinha a subtarefa do `docs/interface.md` |
| B | Decisão que vive só no `N_task.md` | 2 | 6.0, 13.0 (`revisor-geral`) | caiu de 7 para 4 para 2; sem proposta |
| G | e2e fora do diff que conta um texto na página | 2 correções, 6 execuções vermelhas | 1.0 (o sino em `main`), 6.0 (o rótulo "Gabarito" do interruptor) | autoconferência; o detector de literal (M3 da X2) só puxa texto **removido** |
| E | Defeito que só a revisão viu | 3 | 1.0 (a série só na primeira montagem, `infra-guardian` e `test-engineer`), 10.0 ("Sinais da turma" em branco) | é para isso que a revisão existe |
| — | Texto novo sem teste na tela | 1 | 2.0 | uma vez |
| — | Bloco vermelho pelo motivo errado | 1 | 5.0 | uma vez; o texto já existe |

**Falsos positivos.** Nenhum. A reprovação da 12.0 (o id na `queryKey` sem bloco) parece formal, mas tirar o id junta o
cache das turmas, que é o defeito que a regra 20 olha.

## Fora das reprovações

- **Prazo do e2e em casos que ninguém toca.** Seis dos oito casos vermelhos. A régua do portão (metade do prazo na
  máquina) só olha o caso que o diff alterou; os outros vão subindo com a suíte (1 332 casos na esteira do pouso) e caem um
  por vez. O `TODO.md` já guarda uma lista feita à mão ("(X3, a vigiar)").
- **Conflito no encontro**, quatro vezes: dois na `techspec.md` §9, com dois parágrafos de divergência no mesmo ponto,
  resolvidos "mantendo os dois" (encontro-6, encontro-13); um em `rotas.tsx`, as duas tarefas fazendo rota lazy
  (encontro-10); um em `aprovar.test.ts` e no roteiro da demonstração (encontro-14). **Nenhum no `TODO.md`**, depois do
  `merge=union` da X2.
- **`linhas.ts conferir` recusa a correção feita em branch `correcao/` saída da spec**, porque compara com a `develop`.
  Uma vez (o detector), contornada à mão.
- **A régua acha o prazo declarado pelo título do caso no HEAD**: retitular o faz parecer novo, com 15 s. Uma vez
  (docs-sem-seu-time), já no `TODO.md`.
- **Recomendação aplicada depois de todos aprovarem.** Na 3.0, 4.0, 7.0 e 8.0 todos aprovaram na 1ª rodada, e as
  recomendações aplicadas pediram uma 2ª: 13 das 39 rodadas caducadas, de 18 a 87 min de linha cada. É o desenho da
  `revisar-tarefa` ("anularia as aprovações não é motivo para não aplicar"); com três linhas, não ficou no caminho
  crítico. Sem proposta.
- Uma vez cada: o reinício do Arquiteto descartou um texto que estava na caixa de entrada dele sem ter sido enviado; o
  `tasks.md` ficou com a 7.1 e a 7.2 em `[ ]` com a 7.0 `[x]`.

## O que funcionou

- **As três linhas.** 12 tarefas em 13 h, quando o portão parou de puxar a suíte inteira.
- **O código de processo M1 a M5 da X2.** A régua do e2e alterado e o detector de literal pegaram antes do commit o que
  na X2 caía na esteira; os vermelhos da esteira caíram de 27 de 39 para 18 de 45, e nenhum foi defeito de produção.
- **O `TODO.md merge=union`**: zero conflito nele, contra três na X2.
- **O diagnóstico do Arquiteto na segunda reprovação**: 1.0 e 6.0, as duas aprovadas na rodada seguinte.
- **O fechamento.** As ~60 recomendações com destino `TODO.md` (M2 da validação) entraram no fechamento, agrupadas por
  tarefa (`7a56ed6`), e o pouso veio uma hora depois do último commit.
- **A validação em paralelo**: nove correções, três linhas, de 16h22 a 19h13.

## Propostas

### De texto

**P1. As cláusulas de tela na autoconferência**

```
Causa: grupo A — 8 ocorrências (1.0, 6.0 ×2, 9.0, 11.0, 12.0, 13.0, 14.0), todas cláusula de tela
Onde evitar: autoconferência do executar-task
Mudança: .claude/skills/executar-task/SKILL.md, "Declare a mutação de cada cláusula" — depois de
  "cada termo de uma condição composta (`a && b && c` são três)" entra:
  "e, na tela, a condição que mostra ou esconde um pedaço do JSX (`{confirmado && <Selo />}`, o vazio do
  filtro), cada efeito (o foco devolvido, a medida gravada com `style.setProperty`, a guarda dele) e o id
  dentro de uma `queryKey`"
  e, no fim do item: "Na X3, as oito reprovações deste tipo foram dessas três formas."
Efeito esperado: as reprovações do grupo A numa spec de tela
```

**P2. Um item, uma linha da tabela de testes**

```
Causa: grupo J — 3 achados da validação (A1, A2, C1) e 1 reprovação (10.0)
Onde evitar: criar-tasks, e o test-engineer na revisão da tarefa
Mudança: .claude/skills/criar-tasks/SKILL.md, Diretrizes — item novo:
  "**Uma linha da tabela de testes, um comportamento.** O que a célula junta com ponto e vírgula se perde: na
  X3, "100 ou mais", "decidir tira o item" e "vínculo encerrado tira a página" estavam numa célula com
  outros, ninguém escreveu o teste, e três dos oito achados da validação foram eles."
  .claude/agents/test-engineer.md, "Ao auditar", item 3 — "Os casos de borda listados estão cobertos?" vira:
  "Cada linha da tabela de testes do documento tem o seu teste, citado pelo nome? Um item juntado a outro
  por ponto e vírgula conta sozinho: na X3, três ficaram sem teste e só a validação viu."
Efeito esperado: os críticos e maiores da validação que eram cenário previsto e não provado
```

**P3. O RF de toda tela entra na tabela de cada tarefa de tela**

```
Causa: grupo T — 3 achados da validação (C3, C4 em duas correções, M3) e 1 reprovação (6.0)
Onde evitar: criar-tasks
Mudança: .claude/skills/criar-tasks/SKILL.md, Diretrizes — item novo:
  "**O RF que vale para toda tela vira linha na tabela de testes de cada tarefa que cria ou altera tela**:
  cabe a 1366 × 768 sem a página rolar, uma ação cheia por tela, o vocabulário proibido. Com a peça que
  mede: `paginaNaoRola` (`e2e/__fixtures__/coordenacao.ts`), `soOPainelDaAbaRola`
  (`e2e/__fixtures__/professor/cena.ts`), `VOCABULARIO_DE_NOTA`. Na X3 o RF22 estava no "Contexto" de oito
  tarefas e na tabela de nenhuma, que só diziam "sem rolar de lado" a 360 px; quatro telas rolavam a
  página, e só a validação mediu."
Efeito esperado: o crítico da validação que a X2 (C1, C2) e a X3 (C3, C4) tiveram pelo mesmo motivo
```

**P4. O nome antigo e a Parte A na tarefa que muda o lugar**

```
Causa: grupo N — 2 achados da validação (A3, A4, com 4 reprovações nas duas correções) e 1 reprovação (5.0)
Onde evitar: criar-tasks
Mudança: .claude/skills/criar-tasks/SKILL.md, Diretrizes, depois de "Cada desvio da seção 11..." — item novo:
  "**Tarefa que tira, move ou renomeia um lugar leva a busca pelo nome antigo** em `apps/web/src`, `e2e/` e
  `docs/` (`grep -rn '<nome antigo>'`), com cada ocorrência trocada ou justificada no documento. E **toda
  tarefa que muda uma tela que o `docs/interface.md` descreve leva a subtarefa da Parte A daquela tela**:
  o critério de pronto da spec não tem dono. Na X3 a busca por "Seu time" foi só nos textos de tela (2.3),
  e só a 2.0 tinha a subtarefa do `interface.md`."
Efeito esperado: as duas correções de documento da validação e a reprovação da 5.0
```

**P5. O texto que a tarefa repete na tela**

```
Causa: grupo G — 2 correções e 6 execuções vermelhas da esteira (1.0, 6.0)
Onde evitar: autoconferência do executar-task
Mudança: .claude/skills/executar-task/SKILL.md, autoconferência — item novo:
  "- **O texto que você põe na tela já aparece nela?** O sino em `main` (1.0) e o rótulo "Gabarito" do
  interruptor (6.0) quebraram e2e que contavam o texto na página inteira, fora do diff; o portão só puxa
  os specs que citam texto **removido**. Procure o texto novo em `e2e/` (`grep -rln '<texto>' e2e/`) e rode
  isolados os specs que o contam (`toHaveCount`, `nth`)."
Efeito esperado: os dois vermelhos de G, que custaram uma correção cada e até 2 h 30 de esteira vermelha
```

### De configuração

**P6. `techspec.md` com `merge=union`**

```
Causa: dois conflitos na techspec.md §9 no encontro (encontro-6, encontro-13), os dois resolvidos "mantendo os dois parágrafos"
Onde evitar: .gitattributes
Mudança: .gitattributes — a linha `tasks/prd-*/techspec.md merge=union`, como já são o TODO.md e o achados/indice.md
Efeito esperado: a divergência registrada por duas linhas na mesma seção entra sem conflito.
Risco: se duas linhas editarem a mesma frase, as duas versões voltam lado a lado, sem conflito; quem lê a Tech
  Spec (revisor-geral, validador) vê a contradição. Na X3 nenhuma linha editou frase de outra: as duas
  acrescentaram parágrafo
```

### De código de processo (no `TODO.md`, como uma correção própria)

- **M1. Censo de prazo do e2e.** `tools/processo/esteira.ts` ganha um comando que lê o log do e2e da última execução
  verde da spec e lista os casos acima de dois terços do próprio prazo (o prazo declarado, que `duracao-do-e2e.ts` já sabe
  ler; 20 s nos que não declaram). O Orquestrador, ao fechar cada tarefa, abre uma correção para a lista que não estiver
  vazia, antes de o caso ficar vermelho. Seis dos oito vermelhos da X3 e sete da X2; o privacidade:142 já levava 27 a 29,6 s
  nas verdes.
- **M2.** `tools/processo/linhas.ts conferir` compara com a base da branch (a spec, na `correcao/` saída dela), e não
  sempre com a `develop`.
- **M3.** A régua do e2e acha o prazo declarado no HEAD pelo título do caso: o retitulado vira novo. Já no `TODO.md`
  ("(X3, `tools/ci/duracao-do-e2e.ts`)"); junto, na mesma correção.

### Pendência minha, da validação (N1)

A `techspec.md` da X3, "(8) A página não rola, rola a mesa", só fala do documento; o mesmo miolo
(`O_MIOLO_DO_DOCUMENTO`, `miolo-do-documento.ts`) é hoje o da turma aberta (`Turma.tsx`, `useTopoDoPainel`), o de "O que
o Assistente fez" (`Time.tsx`, `useTopoDoPainel`) e o do formulário de ferramenta (`Ferramenta.tsx`, `useTopoDoMiolo`).
Estendo o parágrafo e fecho a linha do `TODO.md`.

### O que não entrou

- **Recomendação depois de todos aprovarem** (13 rodadas caducadas): é o desenho da `revisar-tarefa`, e com três linhas
  não estava no caminho crítico.
- **Nada a tirar.** `tenancy-guardian`, `privacy-guardian` e `conformidade-reviewer` não reprovaram tarefa nenhuma, mas
  defendem as regras 10, 20 e 70, que retrospectiva não afrouxa; e as tarefas que os marcaram tinham leitura nominal e
  isolamento pela tela.

## Decisão

Perguntei ao Joaquim em 19/10/2026, no terminal do Arquiteto. Nas propostas de texto e configuração ele respondeu
"você decide", e apliquei as seis, que eram a minha recomendação; o código de processo entra antes da primeira tarefa da X4.

| Proposta | Decisão | Motivo |
|---|---|---|
| P1. Cláusulas de tela na autoconferência | aplicada | grupo A, oito reprovações, todas de tela |
| P2. Um item, uma linha da tabela de testes | aplicada | três achados da validação |
| P3. O RF de toda tela na tabela de cada tarefa de tela | aplicada | três achados da validação; a X2 teve o mesmo |
| P4. O nome antigo e a Parte A na tarefa que muda o lugar | aplicada | duas correções de documento da validação |
| P5. O texto que a tarefa repete na tela | aplicada | duas correções e seis execuções vermelhas |
| P6. `techspec.md` com `merge=union` | aplicada | dois conflitos de encontro; nenhuma linha editou frase de outra |
| M1 a M3 | no `TODO.md`, **antes da primeira tarefa da X4** | o censo cobre seis dos oito vermelhos |
| N1 (a §9 (8) da Tech Spec da X3) | feito | pendência minha, da validação |

Arquivos alterados: `.claude/skills/executar-task/SKILL.md` (P1, P5), `.claude/skills/criar-tasks/SKILL.md` (P2, P3, P4),
`.claude/agents/test-engineer.md` (P2), `.gitattributes` (P6), `tasks/prd-telas-do-professor/techspec.md` (N1) e o
`TODO.md` (N1 fechado; a entrada do código de processo M1 a M3).

**Para quem conduz a X4:** o andar dela já existe (`spec/telas-do-aluno-e-primeiro-acesso`), e estas mudanças só chegam
com o merge da `develop`. As tarefas da X4 já estão escritas: P2, P3 e P4 valem para elas se o Arquiteto as revisar com o
"Contexto das tarefas" antes da partida; sem isso, só para a próxima spec. O código de processo roda antes da primeira tarefa.
