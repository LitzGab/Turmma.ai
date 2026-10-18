# Retrospectiva — telas-da-coordenacao (X2)

18/10/2026, pelo Arquiteto, no térreo, depois do pouso (`7092ee6`) com a esteira verde (39083730799). Comparação com
a retrospectiva da X1 (`tasks/prd-pele-e-casca/retro.md`). É a primeira spec com **duas linhas** em paralelo (D79).

Condições que pesam nos números:

- a **1.0 foi feita fora do Maestri**, pelo "Claude Code #2" (`conduzir.mjs`), em 16/10 de manhã; a X2 parou às 09h40
  e voltou às ~14h15, já com a `develop` da retrospectiva da X1 (`2029703`);
- da 2.0 em diante, **duas linhas**, ambas com o Implementador em Sonnet 5.5 (o `estado.md` escreve "Sonnet" nas
  primeiras linhas e "Sonnet 5.5" nas outras: é o mesmo papel);
- desde 16/10 17h15 as linhas rodaram **em fila por carga**: o e2e de duas linhas juntas estourava os 30 s (carga de
  9 a 24), e a terceira linha foi recusada duas vezes pelo mesmo motivo;
- **a máquina reiniciou às 03h13 de 17/10**, e a construção voltou perto das 10h.

## Medidas

```
Tarefas: 14 · Rodadas de revisor: 116 · Reprovações: 26 (22,4%), contando 4 AJUSTES NECESSÁRIOS do frontend-reviewer
Por revisor: test-engineer 32/14 · revisor-geral 31/8 · frontend-reviewer 25/4 · privacy-guardian 15/0
             conformidade-reviewer 9/0 · infra-guardian 4/0 (o tenancy-guardian não foi marcado: nenhuma tarefa tocou a API)
Por modelo do implementador:
  Sonnet, fora do Maestri (1.0): 1 tarefa, 14 rodadas, 3 reprovações
  Sonnet 5.5 no Maestri (2.0 a 14.0): 13 tarefas, 7,9 rodadas por tarefa, 23 reprovações (1,8 por tarefa),
    2 escaladas com diagnóstico do Arquiteto (14.0: mutações não declaradas; 11.0: o reset() que travava o envio único),
    mediana de 119 min do pedido ao commit (de 24 a 249), em 11 tarefas medidas (a 6.0 e a 13.0 atravessaram a queda)
Rodadas por tarefa: média 8,3, piores 1.0 com 14 e 11.0 com 12
Rodadas que caducaram sem reprovação do próprio revisor: 32 de 116 (28%)
Correções fora de tarefa: 18, mais 4 de conflito no encontro das linhas (encontro-4, -5, -7 e o da C1+C2)
  - 8 por tempo de teste: 7 casos de e2e acima dos 30 s na esteira (privacidade:298 e :295, material:180, areas:316,
    agentes:164 e :186, casca:134 no goto) e 1 de unidade acima dos 5 s com a máquina carregada (guarda de chaves)
  - 2 por corrida no teste, a ordem de duas respostas de rede (acesso-suspenso:169, painel-da-coordenacao:187)
  - 4 por defeito visto na esteira depois do commit: o W12 da casca quebrado pela 3.0, o link de 41 px da 5.0, o sino
    que relia sozinho a consulta em erro, a Analista que rolava com a fonte local
  - 3 da validação (C1+C2, C3, C4) e 1 de infraestrutura da esteira (a sexta fatia do e2e)
Duração: 16/10 14h15 (retomada) → 17/10 19h50 (último commit de código) → 21h18 (fechamento); 29 h 35 de relógio,
  com a queda das 03h13 e a manhã até perto das 10h no meio
Revisão da spec: 4 rodadas, 15 rodadas de revisor, 9 não aprovadas (o desenho do teste "o sino não relê", que o
  infra-guardian reprovou três vezes)
Ressalvas do /validar: rodada 1 REPROVADA (4 críticos, 1 maior); rodada 2 APROVADA
```

Como contei: as linhas da tabela "Revisões" dos catorze `N_task.md` e dos documentos de correção do período, escritas
pelo hook, e os blocos de `achados/` de cada reprovação. Cada reprovação está num grupo só. Tempo por tarefa é do
pedido ao commit, pelo `estado.md`. Os vermelhos da esteira são os de `gh run list --branch spec/telas-da-coordenacao`,
com o caso que caiu lido no log de cada execução.

| | F3 | X1 | X2 |
|---|---|---|---|
| Tarefas | 20 | 15 | 14 |
| Reprovações nas tarefas | 22,9% | 23,8% | 22,4% |
| Rodadas por tarefa | 11,8 | 8,1 | 8,3 |
| Caducadas sem reprovação | 34% | 31% | 28% |
| Revisão da spec, não aprovadas | 19 de 27 | 5 de 9 | 9 de 15 |
| Correções fora de tarefa | 9, e 2 falhas | 7 | 18, e 4 de encontro |
| Crítico ou maior no 1º /validar | 1 crítico e 2 maiores | 1 maior | 4 críticos e 1 maior |
| Tarefas sem nenhuma reprovação | 1 de 20 | 4 de 15 | 2 de 14 |

## As cinco medidas da D79

**1. Do pedido ao commit.** Mediana de 119 min, contra 71,5 na X1 e 99 no F3. Pesa a fila por carga: com as duas linhas
abertas, cada tarefa esperava o e2e da outra. Por tarefa entregue, o relógio quase não mudou (perto de 1 h 45 na X2, sem a queda,
contra 1 h 35 na X1, que tinha uma linha só): **o paralelo foi comido pela máquina e pelas correções da esteira**.

**2. Tarefas sem reprovação.** 2 de 14 (9.0 e 12.0), contra 4 de 15.

**3. O grupo A.** 9 reprovações, contra 11 na X1 e 17 no F3, e nenhuma por linha de "Mutações" que afirmasse um
vermelho que não acontece. Nenhuma foi medida nomeada na subtarefa ausente da tabela de testes, que era a proposta 1
da X1: as nove são cláusula de lógica (o predicado do ano em curso, o `cancelRefetch`, o `fecharSeAinda`, o
`fetchNextPage` do filtro, a guarda do carregando) ou cópia da mesma regra em outro arquivo (14.0, duas vezes).

**4. Vermelhos da esteira por push.** **27 das 39 execuções da spec foram vermelhas**, 9 verdes e 3 canceladas. Os
vermelhos foram 13 casos distintos, e um caso ficava vermelho por várias execuções seguidas enquanto as linhas
andavam: o W12 da casca em cinco (1 h 30), o link de 41 px em quatro (8 h 25, com a queda no meio), o `agentes:164` em
nove (2 h 15, e a validação rodada 1 rodou sobre ele). Custaram 11 correções, perto de 6 h de linha e umas 30 rodadas
de revisor. Só três eram defeito de produção (o link de 41 px, o sino que relia sozinho, a Analista que rolava); o
resto era prazo ou corrida do teste.

**5. Do último commit ao pedido de pouso.** Perto de 1 h 10 (19h50 → ~21h), contra 6 h 26 na X1 e 5 h 29 no F3: a
validação rodada 2 e a esteira verde couberam nesse intervalo.

## Grupos de causa

As 26 reprovações das tarefas, cada uma num grupo só. Entre parênteses, as reprovações das correções do mesmo tipo.

| # | Causa | Reprovações | Tarefas | Onde evitar |
|---|---|---|---|---|
| A | Cláusula nova sem bloco de mutação, às vezes sem teste que a prove | 9 (+1) | 1.0, 2.0, 3.0, 7.0, 8.0, 10.0, 13.0, 14.0 (×2); correção C1+C2 | autoconferência, que já pede; o aviso automático do portão seria ruído (abaixo) |
| E | Defeito de tela ou de código que só a revisão viu | 7 (+1) | 3.0 (×2), 5.0, 7.0, 8.0, 11.0, 14.0; correção C1+C2 | é para isso que a revisão existe; três deles são o grupo R, abaixo |
| B | Decisão que vive só no `N_task.md`, ou subtarefa marcada sem ter sido feita | 4 (+1) | 1.0, 2.0, 7.0, 14.0; correção C3 | caiu de 7 para 4 com a proposta 2 da X1; sem proposta nova |
| G | Teste fora do diff que a tarefa quebrou ou esvaziou | 3 | 5.0, 6.0 (×2) | o portão, que só roda os e2e alterados: M3, abaixo |
| H | Teste que depende da ordem da rede ou da máquina folgada | 1 (+2) | 11.0; correções duas-abas e C3 | o texto já existe (`executar-task`, autoconferência); e mais duas correções do tipo, fora das reprovações |
| F | Destino `TODO.md` sem a linha escrita | 1 | 4.0 | a proposta 5 da X1; a revisão pegou antes do commit |
| — | Teste de cenário da tabela que não foi escrito | 1 | 1.0 | sem proposta: uma vez |

**Grupo R, que atravessa os outros: "a 1366 × 768 só o miolo rola" (RF23).** Três reprovações (3.0 do
`frontend-reviewer` e do `revisor-geral`, 13.0 do `test-engineer`), mais a do miolo do painel sem foco (7.0) e a do
miolo sem nome (correção C1+C2); duas correções (`pagina-rola-depois-da-12`, `painel-e-pedido-rolam-a-pagina`); e dois
dos quatro críticos da validação (C1, C2). A causa é de desenho: cada tela calcula a sua altura
(`miolo-que-rola.ts`: 17, 13 e 21 rem, mais a variável da faixa de incidente; o `Painel.tsx` com um `clamp`), e cada
peça nova no topo quebra todas. Ao lado, a fonte: a do sistema (D72) muda de máquina para máquina, e duas correções
foram medida que passava numa e não na outra (o link de 41 px na esteira e 44 aqui; a Analista com 778 px aqui).

**Falsos positivos.** Nenhum. A 11.0 r1 (o `expect` síncrono depois do `toBeDisabled`) foi defeito de teste real, e o
mesmo padrão derrubou duas correções.

## Fora das reprovações

Do "O que falhou" do `estado.md`, das correções e da validação:

- **Laço de espera com `pgrep`**, cinco vezes: 16/10 17h15 (linha 1, saiu sozinho), 18h00 (linha 2, 37 min), 19h00
  (impasse entre as duas, 38 min), 19h43 (linha 1, 2 h 25) e 17/10 09h40 (linha 2, 30 min). Perto de 4 h de linha
  parada. O padrão casa com a linha de comando do próprio laço. O Orquestrador deixou passar dois deles em duas vigias.
- **Conflito no `TODO.md` no encontro**, três vezes (encontro-4, encontro-5, o da C1+C2), e um no `Estrutura.test.tsx`
  (encontro-7). Cada um virou correção com revisão.
- **O código de processo da X1 ficou no `TODO.md` sem ser feito**, e a X2 pagou de novo: o portão não mede a duração
  do e2e (M1 da X1), e o `tools/ci/e2e.ts` ainda não repassa `--repeat-each` (a 2.0 perdeu 33 min com a suíte
  inteira; a 10.0 disparou outra sem querer).
- **A C3 da validação** (o painel aberto pelo endereço por cima do aviso de incidente) é a combinação de peças de
  tarefas diferentes (13.0 com 5.0, 6.0 e 8.0) que nenhuma tarefa testava. Uma vez; sem proposta.
- **A C4** (o vazio conferido pela ausência da tabela, e não do texto do vazio) repetiu o mesmo erro em seis telas. É
  uma causa só; a correção já trouxe as asserções.
- Uma vez cada: a Mesa escreveu o RELATÓRIO só no próprio terminal, sem `maestri ask` (02h02); o commit da 13.0 não
  marcou o `tasks.md`.

## O que funcionou

- **O fim da spec:** do último commit ao pedido de pouso em 1 h 10, contra mais de 5 h nas duas anteriores.
- **O diagnóstico do Arquiteto na segunda reprovação:** duas escaladas (14.0, 11.0), as duas aprovadas na rodada
  seguinte. Na 11.0 o defeito era de produção (a retomada travada para sempre).
- **A foto na revisão:** o "só o miolo rola" da 3.0 foi visto pela altura das fotos da vitrine, e o select cortado
  da 8.0 só na foto.
- **As propostas da X1:** o grupo B caiu de 7 para 4; nenhuma reprovação por medida nomeada fora da tabela; nos
  documentos que li, nenhuma seção "Revisões" recomeçou a contagem.
- **A divergência de portão virando correção própria na linha:** a sexta fatia do e2e, feita uma vez e trazida para a
  outra linha por `cherry-pick`, sem conflito no encontro.

## Propostas

### De texto e configuração

**T1. Fila de carga por `flock`, nunca laço de `pgrep`**

```
Causa: cinco laços de espera que não saíam, perto de 4 h de linha parada; e o e2e de duas linhas juntas estourando os 30 s
Onde evitar: o /seguir (a fila entre as linhas) e o executar-task (os comandos)
Mudança: .claude/skills/executar-task/SKILL.md, passo 4 — os comandos do e2e e o do portão ganham
  `flock /tmp/educa-carga.lock`, com o parágrafo "O e2e e o portão rodam sempre com flock… Nunca escreva laço de espera
  com pgrep…"; o mesmo prefixo no portão do .claude/skills/corrigir/SKILL.md; e no .claude/skills/seguir/SKILL.md, seção
  das linhas, "as linhas rodam portão ao mesmo tempo" vira "a máquina é uma só… todo e2e e todo portão rodam com flock…
  Não mande uma linha esperar a outra com laço de pgrep"
Efeito esperado: a espera entre linhas some como trabalho de alguém; o flock é do util-linux e já está na máquina
```

**T2. Altura com dono único, e nada medido pela fonte**

```
Causa: grupo R — 3 reprovações, 2 correções e 2 críticos da validação; mais 2 correções de medida que dependia da fonte
Onde evitar: Tech Spec
Mudança: .claude/skills/criar-techspec/template.md, "## 9. Frontend" — parágrafo "Altura.": se a tela tem limite de
  altura, a Tech Spec diz qual peça é dona dela (de preferência a casca), que nenhuma tela calcula a própria altura com
  calc(100dvh − N rem), e que alvo de toque e altura não dependem da métrica da fonte
Efeito esperado: vale para a próxima Tech Spec escrita. A X3 e a X4 já estão escritas, e a X3 não tem o "só o miolo
  rola"; a coordenação fica como está, com os testes que a X2 deixou
```

**T3. `TODO.md merge=union`**

```
Causa: três conflitos no TODO.md no encontro das linhas, três correções com revisão
Onde evitar: .gitattributes
Mudança: .gitattributes — a linha `TODO.md merge=union`, como já é `tasks/**/achados/indice.md`
Efeito esperado: as duas linhas acrescentam ao TODO.md sem conflito. O risco do union é duplicar uma linha que as duas
  editaram; num TODO, isso se vê e se apaga
```

### De código de processo (no `TODO.md`, como uma correção própria)

- **M1 (da X1).** O portão da tarefa mede a duração do e2e alterado: acima de 15 s na máquina, vermelho. Na X2, quatro
  dos sete casos de prazo já passavam de 15 s aqui (`material:180` a 18 s, `areas:316` a 22, `agentes:164` a 22,
  `agentes:186` a 21).
- **M2 (da X1).** `tools/ci/e2e.ts` repassa `--repeat-each` e `--workers` (e os outros dois consertos da X1).
- **M3.** O portão roda também os e2e que citam um texto que o diff tirou de `apps/web/src` (grupo G e o W12 da 3.0).
- **M4.** A vitrine lista as telas cuja página rola a 1366 × 768 (grupo R): ela já mede a altura para tirar a foto.
- **M5.** O `flock` dentro do `portao-local.ts` e do `tools/ci/e2e.ts`, para a T1 não depender de quem digita.

### O que não entrou

- **O aviso do portão para linha sem bloco** (M4 da X1, que ficou para medir na X2). Medi: as tarefas da X2
  acrescentam de 8 a 82 linhas de lógica cada uma (6.0: 42; 7.0: 43; 8.0: 82; 10.0: 27; 11.0: 8), e o grupo A vem
  caindo sem ele (17, 11, 9). Seria ruído.
- **Nada a tirar.** Os guardiões sem reprovação (`privacy`, `conformidade`, `infra`) defendem as regras 20, 70 e 80, e
  a revisão da spec foi onde o `infra-guardian` pesou.

## Decisão

Perguntei ao Joaquim em 18/10/2026, no terminal do Arquiteto. Ele aceitou tudo o que foi proposto e escolheu fazer o
código de processo antes da primeira tarefa da X3.

| Proposta | Decisão | Motivo |
|---|---|---|
| T1. Fila de carga por `flock` | aplicada | cinco laços e perto de 4 h paradas |
| T2. Altura com dono único, nada pela fonte | aplicada | grupo R, a maior causa da validação |
| T3. `TODO.md merge=union` | aplicada | três conflitos e três correções de encontro |
| M1 a M5 | no `TODO.md`, **antes da primeira tarefa da X3** | o M1 e o M2 ficaram sem prazo na X1 e a X2 pagou de novo |
| Aviso de linha sem bloco | não entrou | 8 a 82 linhas por tarefa; o grupo A cai sem ele |

Arquivos de processo alterados: `.claude/skills/executar-task/SKILL.md`, `.claude/skills/corrigir/SKILL.md`,
`.claude/skills/seguir/SKILL.md`, `.claude/skills/criar-techspec/template.md`, `.gitattributes` e o `TODO.md` (a entrada
do código de processo da X1, com o que a X2 acrescentou e o destino).

**Para quem conduz a X3:** o andar dela já abriu sobre `7092ee6`, e estas mudanças só chegam com o merge da `develop`.
A correção de processo (M1 a M5) roda antes da primeira tarefa.
