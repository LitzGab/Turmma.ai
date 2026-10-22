# Estado da execução — reengenharia

A missão é `.reengenharia/MISSAO.md`, e o que vale sobre ela é `.reengenharia/RESPOSTAS.md` (Etapa 0,
respondida pelo Joaquim em 20/10/2026). Este arquivo é o `ESTADO.md` da missão: não existe outro.

## Agora
- **22/10, ~10:55 — palavra do Joaquim no terminal do Orquestrador:** até o pouso da X5 vale
  `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/RECORTE.md` (por cima da MISSAO, das RESPOSTAS e do
  `tasks.md`). §6: **nenhuma parada chama o Joaquim** (o `Arquiteto` decide e registra em `DECISOES.md`); tarefa com
  mais de 4 h ou que trava duas vezes vai para a X6, o andar volta ao último verde e a linha pega a próxima (a 3.0, que
  já corria, termina normalmente); **sexta 23/10 às 22h nenhuma tarefa nova parte**; pouso com push autorizado com
  validação aprovada e esteira verde; meta sábado 24/10 às 08h; **três linhas ocupadas**; mensagem do "Claude Code #2"
  sobre a X5 vale como palavra dele. Memória: `x5-recorte-autonomia-ate-o-pouso`
- **Esclarecimento do "Claude Code #2" ao §5 (~11:02, vale como palavra do Joaquim), para a onda 0 (3.0, 93.0, 94.0):**
  o relógio das 4 h conta de 10:55 (vence às 14:55); passar disso ou travar duas vezes **não manda para a X6**: o
  `Arquiteto` fecha a tarefa com a melhor versão que os revisores com veto aprovem e declara, medida, a lacuna que sobra
  (`onda-0.md` e AIA do Tutor); só o refinamento do corpus vai para a X6. O limite das três vai ao diagnóstico do
  `Arquiteto`, nunca ao Joaquim. **Única parada que ainda o chamaria:** decisão que só se resolve afrouxando D1–D81 ou
  as regras 10, 20, 30, 40, 70 (o Arquiteto não pode decidir isso)
- **~11:05, ajustes do "Claude Code #2" para acelerar** (palavra do Joaquim), em `.processo/ordens/recorte-ajustes-cc2.md`
  (andar da spec), enviados ao `Arquiteto` junto do §7: a 95.0 é do Claude Code #2 (entrega em
  `Educa.ia/.processo/reengenharia/guia/` até ~15h; o Arquiteto revisa com o revisor-geral e commita); todos os
  documentos de tarefa numa passada (**feito**: os 36); **uma linha só para a web** (36.0, 97.0, 51.0, 53.0) e duas para API e pacotes;
  tarefa mecânica com test-engineer, revisor-geral e no máximo um guardião, movimento por script (`git mv` + ts-morph via npx)
- **§7 feito** pelo `Arquiteto` (`16ffbe9`, `d2dea6b`): D81, `tasks.md` com 32 na X5 (36 no quadro), X6 no roadmap, 14.0–17.0
  reescritas, ajustes do Claude Code #2 (R51–R54). os 36 documentos prontos
- **Construção começou às 20:01 de 21/10/2026**, sem palavra do Joaquim depois do aviso das 19:07.
  Três linhas abertas (`spec/reengenharia--l1..l3`, ambientes de teste 1 a 3)
- **Espero:**
  - linha 1 (`Implementador` e `Mesa`, `…--l1`): **3.0**, grande, desde 07:47, parada na DIVERGÊNCIA (desenho) de
    08:05. **Triagem do `Arquiteto` (09:45): detalhe que a spec não previu**, sem mudar desenho nem alvo, em
    `onda-0.md` §2.3 (sem commit, vai no da 3.0) e `.processo/divergencia-3.0-resposta.md` (l1). `PEDIDO de retomada`
    enviado ao Implementador. **~10:50, ESCALADA de Mesa** (revisor-geral e test-engineer 2 seguidas, conformidade a
    2ª; itens 1 e 3 da r2 em sentidos opostos; `saidaQualitativa` 53/58, piso 0,90). Ordem `.processo/ordens/3_task-r2.md`
    (l1), não enviada; o item 5 é do Arquiteto. `Arquiteto` reiniciado no l1 com o pedido de diagnóstico
    (`.processo/ordens/diagnostico-3.md`). **Diagnóstico pronto**, substitui a r2 (a saída barrava por exclusão, não por
    juízo; conferido numa cópia: 53/58, 0 legítimas barradas); item 5 feito no §2.3. `PEDIDO de retomada` enviado.
    **11:09, BLOQUEIO de Mesa** (revisor-geral e test-engineer 3 seguidas, conformidade 2; llm-integrator aprovou). Pelo
    recorte, o limite é do `Arquiteto` e a 3.0 (onda 0) não vai para a X6. Destravado registrado no `rodadas.md` (l1).
    Diagnóstico pedido ao `Arquiteto` (na fila dele, no andar da spec, como prioridade): `…--l1/.processo/ordens/diagnostico-3b.md`.
    **Diagnóstico 3b pronto** (cinco pontos estreitos + a lacuna medida no §2.3; a 4ª rodada avalia só isso).
    `PEDIDO de retomada` enviado. **Espero o `RELATÓRIO` do Implementador**
  - linha 2 (`Implementador 2` e `Mesa 2`, `…--l2`): **94.0**, grande, onda 0 (prazo 14:55, sem ir para a X6), desde 11:07
  - linha 3 (`Implementador 3` e `Mesa 3`, `…--l3`): **51.0**, grande, **linha da web** (depois 53.0, 36.0, 97.0), desde
    11:07; prazo de 4 h: 15:07
- **Devo ainda:**
  - **95.0 (guia), entregue pelo Claude Code #2** em `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/guia/`
    (`guia-do-desenvolvedor.md`, `arquitetura.md` corrigido, `LEIA.md` com o que conferir). Quando o `Arquiteto` tiver
    folga: revisão do `revisor-geral` (pedida às ~11:30). **Publicar (commit) só depois das tarefas de pasta (33–36, 96,
    97) e da 14.0–17.0**
  - **antes de a 12.0, a 13.0, a 24.0 e a 25.0 partirem:** pedir ao `Arquiteto` que confira os caminhos de novo, depois
    das pastas
  - todos os 36 documentos existem (`504a041`, `43a6ae2`, `bc9241f`); R55 e R56 em `DECISOES.md`. A 96.0 depende da
    97.0; a 90.0 espera a 24.0; a 43.0 e a 90.0 não correm juntas (`infra/compose.yml`)
  - **depois do commit da 94.0** (que depende da 93.0): pedir ao `Arquiteto` o **lote retido 2**, que mede as duas, antes
    da validação. A 26.0 agora depende da 94.0
  - ler o veredito da esteira de `975bad2` no próximo encontro (`b5b7d11` e `63aac92` verdes; `f794080` cancelada pelo push seguinte)
  - ao fechar a 3.0: se ela não trouxer a base da `saidaQualitativa`, pedi-la ao `Arquiteto`; e pedir o lote retido
    dos alvos da 3.0, como o da 2.0
  - documentos de 1.0 a 29.0, 93.0 e 94.0; aviso de `N_task.md` ausente é o sinal para pedir a onda seguinte ao
    Arquiteto (R41). A 92.0 é a parada da Etapa 9
- **Base:** `spec/reengenharia` em `d2dea6b`. Vigia ligada

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
| 2.0 | `66d8b95` | Sonnet | 4 (test-engineer 5) | ouro lido para escrever o padrão: divergência, opção A (lote retido), escalada com diagnóstico, bloqueio destravado pelo Joaquim; npm audit fora do ar ~8 h |
| 93.0 | `c361eb8` | Sonnet | 3 (test-engineer 4) | linha 3, grande, 09:40–11:00; escalada (dose letal) com diagnóstico: volta ao HEAD, a 3ª piora fica declarada; absorveu a correção das pioras da l2 |

## Esperando o Joaquim
## 22/10/2026 08:15 — X5 medida independente do riscoAVida (lote retido) ⛔
Decisão: com 23/75 no lote retido (alvo ≥ 71/75), como o RF1 segue.
Contexto: os padrões da 2.0 decoraram o `ouro` v1. `.processo/ordens/medida-retido-riscoAVida.md` (andar da spec),
números em `docs/aia/ouro-retido/RETIDOS.json`. **Pergunta no terminal do `Arquiteto`.**
Opções: A só padrão, correção grande e lote retido 2 | B padrão e modelo somados (muda o RF1 "sem modelo", pede AIA e
llm-integrator) | C rever o alvo
Recomendo (Arquiteto): B; a `indireta` não chega ao alvo com palavra-chave sem derrubar a precisão.
Seguem sem depender: a 3.0 (mas a triagem da divergência dela espera o Arquiteto livre) e a correção das três pioras.
**Respondida em 22/10/2026:** B (a regra decide, o modelo soma), no terminal do `Arquiteto`: `onda-0.md` §2.2a, tarefas
93.0 e 94.0, commit `f794080`.

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
- 22/10 ~11:00 — soltei a linha 2 da correção absorvida editando o `.processo/linhas.json` (não há comando para
  abandonar uma linha; o Joaquim quer as três ocupadas). Retrospectiva: `linhas.ts abandonar <n>`.
- 22/10 — a correção das três pioras, pedida na linha 2 porque o Arquiteto disse "sem decisão, já vale", ficou
  inútil com a B, que a pôs na 93.0. Pedi ao Implementador 2 que guardasse o trabalho e limpasse a árvore, e levei a
  pasta à 93.0 como execução anterior. Lição: "já vale" com uma decisão de desenho aberta sobre o mesmo código, espere.
- 22/10, 00:03 — 2.0: DIVERGÊNCIA de portão por queda do endpoint de auditoria do npm. Não abri correção (nada a
  corrigir no repositório) nem pulei a guarda: o Implementador espera a volta com tentativa a cada 10 min, até 3 h.
- 20/10/2026: o Arquiteto faz, nas Etapas 1 a 6, o papel que a missão dá ao "orquestrador técnico"
  (dividir, distribuir a subagentes por unidade, consolidar, decidir o que cruza unidades); o
  Orquestrador não lê código. Detalhe em `RESPOSTAS.md`, "Como a missão roda aqui"
