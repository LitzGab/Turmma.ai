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
  - linha 1 (`Implementador` e `Mesa`, `…--l1`): **6.0**, pequena (tenant), desde 11:27; prazo de 4 h 15:27. Avisado de
    que o `ouro.test.ts` está vermelho na spec até a base da 3.0 (traz com `git merge spec/reengenharia` antes do portão)
    **A base virou correção** (R57: o hook trata o `MEDIDAS.json` como código, e `ouro.test.ts:267`/`:273` precisam mudar):
    pedi ao Implementador da l1 a **correção `ouro-base-qualitativa`** antes de seguir a 6.0 (ordem
    `.processo/ordens/correcao-ouro-base-qualitativa.md`, copiada para l1; guardiões test-engineer e llm-integrator). O
    commit `05aa2fe` na l1, segue com o da 6.0; **a esteira da spec fica vermelha nos 3 casos do `ouro.test.ts` até o
    primeiro encontro que o leve (l1 ou l2)**
    **DIVERGÊNCIA (ordem) da correção:** gravar a base muda o hash que o `SELO.json` guarda (6 testes do `selo-do-ouro`
    vermelhos). **O `Arquiteto` gravou a base e o selo na spec** (`256fb62`, R58 em `cef19e6`); retomada enviada: restaurar
    o `MEDIDAS.json`, trazer a spec, a correção leva só o `ouro.test.ts` e o documento, portão, Mesa, commit; depois a 6.0
  - **guia (95.0): o revisor-geral REPROVOU na 1ª** (5 bloqueantes de texto, `Educa.ia/.processo/reengenharia/guia/REVISAO.md`).
    **2ª rodada: REPROVADA com 2 bloqueantes novos** (`proprio` pelo dono da linha; teste HTTP também em `apps/api/src`);
    os 5 da 1ª resolvidos. 3ª rodada **REPROVADA** (uma frase falsa em cada ponto); diagnóstico do `Arquiteto` com o texto exato no fim do
    `REVISAO.md`; **4ª rodada APROVADA** (sem bloqueante). Na publicação, o `Arquiteto` aplica as duas recomendações de
    redação, a lista "Conferir depois das pastas" e a linha no `README.md`. A lista
    "Conferir depois das pastas" fica com o Arquiteto, antes da publicação
  - `Arquiteto` (andar da spec): o lote retido dos alvos da 3.0 antes da validação. Os exemplos "Sem
    aplicar" entraram na lacuna do §2.3 (`0366ce1`)
  - linha 2 (`Implementador 2` e `Mesa 2`, `…--l2`): **14.0 pronta** (`ca057e8`, 2 rodadas; tenancy, test-engineer,
    revisor-geral). **Encontro recusado** por falso positivo: o merge `7f6ed10` (l1 → l2, que eu mandei) não traz
    resolução (`--remerge-diff` vazio), mas `linhas.ts` julga merge de linha pelo diff contra o 1º pai. Pedi ao `Arquiteto`
    a decisão e o conserto (merge julgado pelo `--remerge-diff`). Com o relatório dele: `encontro 2`, depois a partida da
    linha 2 (o quadro diz qual; 15.0 espera a 14.0)
  - linha 3 (`Implementador 3` e `Mesa 3`, `…--l3`): **correção `arquivo-do-titular-datas`** desde ~12:20 (casos de data
    fixa vencidos em `apps/api/test/arquivo-do-titular.int.test.ts`, esteira vermelha; guardião privacy-guardian). É correção
    de esteira: tem encontro próprio. Depois dela, a linha 3 pega a **53.0** (o quadro já a mostra)
- **Devo ainda:**
  - **95.0 (guia), entregue pelo Claude Code #2** em `/home/joaquimdp/Documentos/git/Educa.ia/.processo/reengenharia/guia/`
    (`guia-do-desenvolvedor.md`, `arquitetura.md` corrigido, `LEIA.md` com o que conferir). Quando o `Arquiteto` tiver
    folga: revisão do `revisor-geral` (pedida às ~11:30). **Publicar (commit) só depois das tarefas de pasta (33–36, 96,
    97) e da 14.0–17.0**
  - **antes de a 12.0, a 13.0, a 24.0 e a 25.0 partirem:** pedir ao `Arquiteto` que confira os caminhos de novo, depois
    das pastas
  - todos os 36 documentos existem (`504a041`, `43a6ae2`, `bc9241f`); R55 e R56 em `DECISOES.md`. A 96.0 depende da
    97.0; a 90.0 espera a 24.0; a 43.0 e a 90.0 não correm juntas (`infra/compose.yml`)
  - **onda 0 fechada pelo recorte**: lote retido 2 do riscoAVida (R59) e lotes retidos 1 da 3.0 (`3b44efe`, medida abaixo
    do alvo: saidaQualitativa 22/58 e 3/41 legítimas barradas; julgamento 33/57), lacuna em `2fe1d73` (R60, `onda-0.md`
    §2.3, `TODO.md`). Ponto de produto para a X6: a entrada recusa pedido do professor sobre o próprio material com palavra
    de nota ou correção (10/10, já antes da 3.0). **Dizer ao Joaquim no fim** que a AIA do Tutor e esta lacuna merecem o
    olhar dele antes do piloto
  - esteira: `f6913ee` na fila e `3f100df` rodando (ler no próximo encontro); `3b44efe` e `1f770ea` canceladas pelo push
    seguinte. A vermelha conhecida é a do `arquivo-do-titular` (correção na linha 3)
  - documentos de 1.0 a 29.0, 93.0 e 94.0; aviso de `N_task.md` ausente é o sinal para pedir a onda seguinte ao
    Arquiteto (R41). A 92.0 é a parada da Etapa 9
  - retro: `linhas.ts abandonar <n>`; sugestão-fantasma na caixa; merge de outra linha numa linha quebra o encontro
    (`7f6ed10`); `MAESTRI_CLI` do ambiente aponta para montagem velha (usar `/tmp/.mount_MaestrKFhlcN/…`)
- **Base:** `spec/reengenharia` em `2fe1d73`. Vigia ligada

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
| 3.0 | `1566521` | Sonnet | 4 | linha 1, grande, 07:47–11:25; divergência (triagem: detalhe), escalada, bloqueio destravado pelo recorte; saidaQualitativa 54/58, 0 legítimas barradas; lacuna declarada no §2.3 |
| 94.0 | `0975b97` | Sonnet | 2 | linha 2, grande, 11:07–11:36; dentro do prazo de 14:55, escopo inteiro; três recomendações no TODO.md |
| 51.0 | `50e04d0` | Sonnet | 2 | encontro adiado até o commit dos lotes retidos da 3.0 (`3b44efe`); lacuna da 3.0 em `2fe1d73` (R60); o ponto de produto do material do professor com palavra de nota vai para a X6 |

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
- 22/10 12:00 — a linha 2 trouxe a correção `05aa2fe` da `spec/reengenharia--l1` (merge, mesmo commit) para o portão da
  14.0 passar, em vez de esperar o encontro da 6.0.
- 22/10 11:40 — cancelei 7 execuções da esteira na fila da `spec/reengenharia` que o `3f100df` já cobria (pushes de
  documento acumulavam execuções inteiras).
- 22/10 ~11:35 — a base da `saidaQualitativa` (correção) foi para a linha 1, antes da 6.0, com a árvore limpa: não havia
  linha ociosa, e é a 6.0 que precisa dela primeiro. A spec fica vermelha até o encontro da 6.0.
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
