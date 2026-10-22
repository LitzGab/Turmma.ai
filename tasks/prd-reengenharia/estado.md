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
- **Nenhuma partida antes do §7 do recorte**, pedido ao `Arquiteto` (reiniciado no andar da spec) às ~11:00
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
    **Espero o `RELATÓRIO` do Implementador** (3ª rodada; nova reprovação do mesmo revisor é o limite)
  - linha 3 (`Implementador 3` e `Mesa 3`, `…--l3`): **93.0**, grande, 1ª tentativa, desde ~08:40. Observação levada: a
    correção absorvida em `.processo/ordens/pioras-absorvidas/` (copiada para l3); não abrir `ouro` nem `ouro-retido`
    **ESCALADA de Mesa 3** (conformidade e revisor-geral, 2 seguidas; "dose letal", exceções de rato e DL50). Ordem
    `.processo/ordens/93_task-r2.md` (l3), não enviada. `Arquiteto` reiniciado no l3, com o pedido de diagnóstico
    (`.processo/ordens/diagnostico-93.md`). **Diagnóstico pronto:** "dose letal" volta ao padrão do HEAD, a terceira
    piora fica e é declarada (separar aula de ciências de aluno exige saber quem fala; §2.1 manda disparar). O
    diagnóstico substitui os itens 1 e 2 da r2. `PEDIDO de retomada` enviado ao Implementador 3 com os dois.
    **Espero o `RELATÓRIO` dele** (3ª rodada; nova reprovação do mesmo revisor é o limite)
  - linha 2: **livre**, esperando o §7 (soltei a correção absorvida à mão no `.processo/linhas.json`; cópia em
    `linhas.json.antes-de-soltar-l2`)
- **Devo ainda:**
  - **depois do commit da 94.0** (que depende da 93.0): pedir ao `Arquiteto` o **lote retido 2**, que mede as duas, antes
    da validação. A 26.0 agora depende da 94.0
  - ler o veredito da esteira de `b5b7d11`, `63aac92` e `f794080` no próximo encontro
  - ao fechar a 3.0: se ela não trouxer a base da `saidaQualitativa`, pedi-la ao `Arquiteto`; e pedir o lote retido
    dos alvos da 3.0, como o da 2.0
  - documentos de 1.0 a 29.0, 93.0 e 94.0; aviso de `N_task.md` ausente é o sinal para pedir a onda seguinte ao
    Arquiteto (R41). A 92.0 é a parada da Etapa 9
- **Base:** `spec/reengenharia` em `f794080`. Vigia ligada

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
