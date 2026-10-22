# Estado da execução — reengenharia

A missão é `.reengenharia/MISSAO.md`, e o que vale sobre ela é `.reengenharia/RESPOSTAS.md` (Etapa 0,
respondida pelo Joaquim em 20/10/2026). Este arquivo é o `ESTADO.md` da missão: não existe outro.

## Agora
- **Construção começou às 20:01 de 21/10/2026**, sem palavra do Joaquim depois do aviso das 19:07.
  Três linhas abertas (`spec/reengenharia--l1..l3`, ambientes de teste 1 a 3)
- **Espero:**
  - linha 1 (`Implementador` e `Mesa`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1`): **2.0**, pequena, 1ª tentativa, desde 20:38.
    **DIVERGÊNCIA de Mesa (desenho)** na 1ª rodada: o `ouro` de `riscoAVida` foi lido para escrever os
    padrões. Triagem em `.processo/ordens/divergencia-2_task.md` (linha 1). **O Joaquim escolheu A (lote
    retido v2)**, no terminal do `Arquiteto`, que escreveu sem commit no l1 o `onda-0.md` §2.1, a `3_task.md`
    e a `26_task.md` (26.6): o Implementador os leva no commit da 2.0, com a linha em "Divergências resolvidas".
    **ESCALADA de Mesa na 2ª rodada:** `revisor-geral` e `test-engineer` duas vezes seguidas, `conformidade`
    na 2ª. **Diagnóstico** do `Arquiteto` em `.processo/ordens/diagnostico-2.md` (22:13): a sonda não é
    bloqueante, a regressão do v1 passa a ser exata, a dev por alternativa cai e volta o "padrasto quer me
    matar" (C8); a D36 segue, medida no lote retido. Às 22:14: `PEDIDO` à `Mesa` para ajustar a r2 pela
    seção D e enviar a ORDEM ao Implementador; `PEDIDO de retomada` ao Implementador (commit liberado com a
    aprovação da Mesa, levando `onda-0.md`, `3_task.md` e `26_task.md`). **Espero o `RELATÓRIO` dele**
    (3ª rodada; nova reprovação do mesmo revisor é o limite das três, parada)
    **22/10, 00:03:** ordem r2 aplicada (unidade verde, 422 mutações vermelhas à parte), mas o portão para na
    `guarda:dependencias`: o `npm audit` não responde (status.npmjs.org: "Minor Service Outage"). Não é
    correção: o Implementador tenta a guarda a cada 10 min por até 3 h, em segundo plano, e então roda o portão
    e pede a 3ª rodada. Sem volta em 3 h (≈03:00), ele manda nova DIVERGÊNCIA de portão
    **22/10, ~00:50: BLOQUEIO de Mesa** (limite das três: `revisor-geral` e `test-engineer`, 3 seguidas).
    **O Joaquim destravou (opção a)**: as três linhas `destravado` estão em `.processo/ordens/rodadas.md` (l1).
    Pedi ao `Arquiteto` (mesma sessão) a ordem `.processo/ordens/2_task-r3.md`, decidindo a tensão (recomendei
    "dar bloco, não tirar"). Ordem pronta, 9 itens: a alternativa sem bloco **fica** (D36); dev e bloco só no
    que a tarefa acrescentou ou mudou; a 26.0 ganha a trava contra remoção silenciosa. Às 01:0x: `PEDIDO de
    retomada` ao Implementador com a r3. **Espero o `RELATÓRIO` dele** (4ª rodada, contagem recomeçada)
  - **a 3.0 parte só depois do encontro da 2.0** (o `Arquiteto` liberou; a armadilha está na `3_task.md`)
  - linhas 2 e 3: **ociosas** (desde 20:32 e 20:12). Com a 2.0 correndo nada mais parte: a 3.0 prevê o
    mesmo `ouro.test.ts`; 6.0, 10.0, 11.0, 14.0 e 29.0 não estão autorizadas junto com a 2.0
- **Devo ainda:**
  - ler o veredito da esteira de `c112874`, `d2e9fcd` e `0d61c28` no próximo encontro (`6623cab` e
    `32072a5` verdes)
  - **depois do encontro da 2.0:** pedir ao `Arquiteto` o lote retido v2 (commit `(ouro: riscoAVida)`), antes
    da validação; e a 3.0 ganha o lote retido dela depois do commit dela
  - **na partida da 3.0**, levar como observação o aviso do Implementador da 1.0: `semBaseAte` lê o
    `tasks.md`, e marcar a 3.0 `[x]` deixa o `ouro.test.ts` vermelho até o Arquiteto gravar a base da
    `saidaQualitativa`. Ao fechar a 3.0, pedir essa base ao Arquiteto se a tarefa não a trouxer
  - documentos só de 1.0 a 29.0; aviso de `N_task.md` ausente é o sinal para pedir a onda seguinte ao
    Arquiteto (R41). A 92.0 é a parada da Etapa 9
- **Base:** `spec/reengenharia` em `0d61c28`. Vigia ligada

## Etapas da missão
| Etapa | Situação | Onde |
|---|---|---|
| 0 Entrevista ⛔ | respondida em 20/10/2026 | `.reengenharia/RESPOSTAS.md` |
| 1 Descoberta e pesquisa | feita, `2d9ad5e` | `DESCOBERTA.md` |
| 2 Compreensão por unidade | feita, `2d9ad5e` | `MAPA.md`, `unidades/U01`–`U12` |
| 3 Material de trabalho | feita, `2d9ad5e` | `CONTRATOS`, `RISCOS`, `SUSPEITOS-MORTOS`, `DECISOES` |
| 4 Linha de base ⛔ | medida, `5c2db6a`; §6 ajustada, `0b1d65a`; aprovada pelo Joaquim em 20/10 | `LINHA-DE-BASE.md` |
| 5 Diagnóstico por lentes | feita, `148617a` (limite semanal derrubou os subagentes em 20/10; retomada em 21/10, sem perda) | `DIAGNOSTICO.md` |
| 6 Arquitetura-alvo ⛔ | PRD aprovado pelo Joaquim, `827697a`; Tech Spec `3eebeb7`; spec aprovada na 5ª rodada, `7fac74f`; tarefas `6623cab`, em 21/10 | PRD e Tech Spec da X5 |
| 7 e 8 Ondas e testes | | tarefas, nas linhas |
| 9 Skills, agentes, regras ⛔ | | |
| 10 Revisão independente | | Validador |
| 11 Docs oficiais, apagar `.reengenharia/` | | |
| 12 Relatório e pouso | | parada |

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|
| 1.0 | `ca32720` | Sonnet | 2 (test-engineer, revisor-geral; conformidade na 1ª) | linha 1, pequena, 20:01–20:38; divergência: mutação `/\bmae\b/` no lugar de `/\bmateria\b/` (1_task.md) |
| 4.0 | `de26c03` | Sonnet | 2 (test-engineer, revisor-geral; tenancy, conformidade e infra na 1ª) | linha 2, grande, 20:01–20:32 |
| 5.0 | `259ca64` | Sonnet | 2 (test-engineer, revisor-geral) | linha 3, pequena, 20:01–20:12 |

## Esperando o Joaquim
## 22/10/2026 00:50 — X5 tarefa 2.0 (riscoAVida), limite das três reprovações ⛔
Decisão: destravar a 2.0 para uma 4ª rodada, ou mudar o rumo dela.
Contexto: `revisor-geral` e `test-engineer` reprovaram 3 vezes seguidas, e o `conformidade-reviewer` 2. Os três pedem o mesmo
em `turno-do-tutor.ts:170`: devolver `vao|iam` na ameaça contada (C8 do diagnóstico). Faltam blocos para alternativas novas
(:191, :193, :195, tomo/engoli), e há texto que afirma cobertura que não existe (`:131`, `2_task.md:106-110`). A tensão: o
test-engineer quer tirar do padrão a alternativa sem bloco, e o revisor-geral não quer tirar sem decisão do Arquiteto (D36).
Achados: `tasks/prd-reengenharia/achados/2_task.md` (l1).
Opções: destravar, com o Arquiteto escrevendo a ordem r3 e decidindo a tensão | destravar e decidir você a tensão (tirar ou dar bloco) | outro rumo
Recomendo: destravar, com a regra "dar bloco, não tirar" (D36: errar para mais) e o Arquiteto escrevendo a ordem; o que falta é pequeno e mecânico.
**Respondida em 22/10/2026:** "a": destravar, com o Arquiteto escrevendo a ordem r3 e decidindo a tensão.

## 21/10/2026 — X5 tarefa 2.0 (riscoAVida) ⛔
Decisão: como medir se os padrões de risco à vida reconhecem frase nova, já que o `ouro` v1 foi lido para escrevê-los.
Contexto: 75/75 no `ouro` v1, mas a sonda do test-engineer deixou passar 14 de 25 frases novas. Triagem em
`.processo/ordens/divergencia-2_task.md`, no checkout da linha 1. A parte sem parada segue; o commit da 2.0 e a 3.0 esperam.
Opções: A) lote retido v2, escrito em contexto limpo, revisado pelo conformidade-reviewer, medido uma vez depois do
commit da 2.0, com piso em `conteudo_escolar`, `homonimo` e `tristeza_sem_risco` | B) declarar a medida não independente.
Recomendo: A, porque só ela responde o que o RF1 pergunta, a um custo pequeno; em D36 o falso negativo custa uma vida.
**Respondida em 21/10/2026:** A, "com o lote retido v2", no terminal do `Arquiteto`; registrada na seção "Decisão"
de `divergencia-2_task.md`.

## 20/10/2026 — X5 Etapa 4 (linha de base) ⛔
Decisão: aprovar a priorização da §6 para seguir à Etapa 5: (a) a ordem, com a web em 3.º e os
testes em 4.º; (b) P4, agora recomendada como NÃO unificar a pilha de sessão do operador (só extrair
as ~60 linhas literais); (c) a meta de saída da onda 4 (ramos ≥ 85 % na web, nenhuma função de tela
acima de 80 linhas) como critério de aceite.
Contexto: `.reengenharia/LINHA-DE-BASE.md` §5 (números) e §6 (ordem e ondas); `DECISOES.md` P4.
Opções: aprovar as três | ajustar alguma (dizer qual)
Recomendo: aprovar as três; os números sustentam a troca de ordem, e a P4 ganha conceito, não volume,
com risco de segurança.
**Respondida em 20/10/2026:** "faça o melhor que eu aprovo sua escolha" — aprovadas as três, como
recomendado: a ordem da §6, a P4 como não unificar (só extrair o literal) e a meta da onda 4 como
critério de aceite.

## O que falhou

## O que decidi sem perguntar
- 22/10, 00:03 — 2.0: DIVERGÊNCIA de portão por queda do endpoint de auditoria do npm. Não abri correção (nada a
  corrigir no repositório) nem pulei a guarda: o Implementador espera a volta com tentativa a cada 10 min, até 3 h.
- 20/10/2026: o Arquiteto faz, nas Etapas 1 a 6, o papel que a missão dá ao "orquestrador técnico"
  (dividir, distribuir a subagentes por unidade, consolidar, decidir o que cruza unidades); o
  Orquestrador não lê código. Detalhe em `RESPOSTAS.md`, "Como a missão roda aqui"
