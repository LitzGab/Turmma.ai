# Estado da execução — reengenharia

A missão é `tasks/prd-reengenharia/MISSAO.md`, e o que vale sobre ela é `tasks/prd-reengenharia/RESPOSTAS.md` (Etapa 0,
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
  - **36 de 36 tarefas encontradas**; linhas ociosas; não rodar `linhas.ts fechar` antes da validação aprovada (correção da validação usa uma linha)
  - **Validação 1 REPROVADA** (~00:30 de 23/10, sobre `65f7e3c`, `validacao.md`): crítico 1 = supressão órfã de
    `tools/ci/compose.ts` em `eslint-suppressions.json` (lint e `catraca.test.ts:205` vermelhos); maior 1 = 95.0 sem
    "Revisões" no andar e `c88231a` sem rodada nova
  - **Linha 1, correção `poda-supressao-orfa`: feita e encontrada** (~00:45): `3c3d582` (poda + TETO da catraca 249→248),
    encontro em `83cc03a`, test-engineer e revisor-geral 1ª APROVADO. Sugestão para a retro: `npm run lint` no encontro,
    logo depois do merge (`.processo/ordens/poda-supressao-orfa-r1.md` na l1). Linhas todas ociosas
  - **`Arquiteto`: feito** (~00:50, só docs): (a) maior 1, `revisor-geral` sobre `c88231a` APROVADO, rodadas da 95.0 no andar,
    6 recomendações → TODO/X6 (`5283042`); (b) RF31, `.reengenharia/` apagada, inventário em `saida-do-temporario.md`, R64,
    tag `reengenharia/temporario` (`d928b2f`); (c) RF33, `relatorio-final.md` (`8802ea5`, `f76c553`): suíte, cobertura e
    bundle não medidos; vite alto e o `.dockerignore` que ainda cita a pasta no `TODO.md`
  - **Revalidação (rodada 2): APROVADA** (23/10, sobre `d6eb2f0`; `validacao.md` alterado na árvore, sem commit: entra no
    commit de fechamento). RF 20 atendidos; falta só a esteira verde em `83cc03a`
  - **Esteira de `83cc03a` (`39896272821`): VERMELHA**, com dois defeitos anteriores à validação (o último verde foi `4d0219d`):
    (1) knip no `ci:verificar`, "Unused exports (166)", desde a 24.0 (`62b5fc2`); (2) integração e infra:
    "Failed to resolve entry for package @educa/shared", desde `2b68e74` (25.0 ou 90.0). A de `d6eb2f0` (`39896375281`) deve dar o mesmo
  - **Duas correções em curso (~01:50 de 23/10), 1ª tentativa:** linha 1, `knip-exportacoes-na-esteira` (Implementador/Mesa;
    test-engineer e revisor-geral); linha 2, `shared-sem-entrada-na-integracao` (Implementador 2/Mesa 2; + infra-guardian).
    Cada `RELATÓRIO` → `linhas.ts encontro <n>`. Com as duas encontradas: esteira do último push verde (`esteira.ts --fechamento`) e
    **revalidação** (rodada 3, `Validador` reiniciado; correção depois da validação). Depois `linhas.ts fechar`, `TODO.md`,
    commit de fechamento (o `validacao.md` da rodada 2 entra nele), pouso e push (recorte), `floor delete` das L1–L3, retro.
    Sugestão para a retro: o Validador não lê a esteira; a de `83cc03a` já estava vermelha antes da rodada 2
  - **Linha 2 encontrada** (23/10): `shared-sem-entrada-na-integracao` em `2e2a2e2` (test-engineer 2ª, infra-guardian 1ª,
    revisor-geral 2ª, APROVADO), encontro em `dcd189f`, esteira `39903026138` rodando.
  - **Linha 1 encontrada** (23/10): `knip-exportacoes-na-esteira` em `eb515ae` (test-engineer 2ª, revisor-geral 2ª, APROVADO),
    encontro em `107fd56` (último commit com código).
  - **Revalidação (rodada 3): APROVADA** (23/10, sobre `087b0b2`, último com código `107fd56`; `validacao.md` na árvore, sem
    commit: entra no fechamento). Menores feitos: `Arquiteto` alinhou `onda-1b.md` e `24_task.md` (`b50e2b0`, só docs); a linha
    do `TODO.md` (`arquivosDeCodigo`) escrita na árvore, entra no fechamento
  - **Fechada em 23/10/2026:** esteira `39903756120` VERDE em `b50e2b0` (todos os jobs; daí à ponta só documento),
    `linhas.ts fechar` feito, `ROADMAP.md` `[x]`, `techspec.md` implementada, `TODO.md` com a linha de `arquivosDeCodigo`.
    **Devo agora:** pouso na `develop` e push (autorizado pelo recorte §6, com validação aprovada e esteira verde), esteira
    da `develop` em segundo plano, `floor delete` das L1–L3, retrospectiva pelo `Arquiteto` no térreo; dizer ao Joaquim que
    a AIA do Tutor e a lacuna da onda 0 merecem o olhar dele antes do piloto
  - (histórico) **Esperava a esteira de `b50e2b0` (`39903756120`) verde**, que leva o código de `107fd56` (`esteira.ts --fechamento`).
    Cancelei as superadas `39903026138`, `39903109912`, `39903276665`, `39903304846`. Verde: `linhas.ts fechar`, commit de
    fechamento (`validacao.md`, `ROADMAP.md`, `techspec.md`, `TODO.md`, `estado.md`), pouso e push (recorte), `floor delete`
    das L1–L3, retro. Vermelha: correção numa linha e revalidação
    A esteira de `d6eb2f0` (`39896375281`, só docs) teve também `e2e/casca.spec.ts:67` [celular] em 5117 ms (limite 5 s),
    que não caiu em `83cc03a` com o mesmo código: tratado como intermitente; se cair de novo em `dcd189f` ou depois, é correção
- **Devo ainda:**
  - 95.0 (guia): publicada (`202cb47`) e fechada (`c88231a`); nada a fazer
  - todos os 36 documentos existem (`504a041`, `43a6ae2`, `bc9241f`); R55 e R56 em `DECISOES.md`. A 96.0 depende da
    97.0; a 90.0 espera a 24.0; a 43.0 e a 90.0 não correm juntas (`infra/compose.yml`)
  - **onda 0 fechada pelo recorte**: lote retido 2 do riscoAVida (R59) e lotes retidos 1 da 3.0 (`3b44efe`, medida abaixo
    do alvo: saidaQualitativa 22/58 e 3/41 legítimas barradas; julgamento 33/57), lacuna em `2fe1d73` (R60, `onda-0.md`
    §2.3, `TODO.md`). Ponto de produto para a X6: a entrada recusa pedido do professor sobre o próprio material com palavra
    de nota ou correção (10/10, já antes da 3.0). **Dizer ao Joaquim no fim** que a AIA do Tutor e esta lacuna merecem o
    olhar dele antes do piloto
  - esteira: veredito mais novo VERMELHO em `2fe1d73` (`39803274227`): `ouro.test.ts` (resolvido por `05aa2fe`) e os
    dois intermitentes da correção da linha 3. Às ~13:50 cancelei 10 execuções superadas na fila (9 da spec, 1 da l1).
    Às 14:17–14:19 cancelei as de `8b11df1`, `5e3e01a` e `f89c847`, superadas; fica a de `f7a835c` (`39821539919`). No encontro da 97.0 (15:20) o
    `esteira.ts` disse VERMELHA em `6fca958`, mas a execução `39821617559` foi só **cancelada** (superada); a de `32edb79`
    (`39830662684`) está na fila. Ler de novo no próximo encontro. O `esteira.ts` lê execução **cancelada** como VERMELHA (`aca066e`): conferir com `gh run list`
  - documentos de 1.0 a 29.0, 93.0 e 94.0; aviso de `N_task.md` ausente é o sinal para pedir a onda seguinte ao
    Arquiteto (R41). A 92.0 é a parada da Etapa 9
  - retro: `linhas.ts abandonar <n>`; sugestão-fantasma na caixa; merge de outra linha numa linha quebra o encontro
    (`7f6ed10`); `MAESTRI_CLI` do ambiente aponta para montagem velha (usar `/tmp/.mount_MaestrKFhlcN/…`); `esteira.ts` conta execução cancelada como vermelha
- **Base:** `spec/reengenharia` em `83cc03a` (encontro da poda; último commit com código). Esteira de `83cc03a` (`39896272821`) na fila: é a que vale para o fechamento (`esteira.ts --fechamento`); `2b68e74` (`39893548090`) rodando. ~00:46 cancelei 6 execuções só de documento superadas (`39893614951`, `39893870904`, `39893958763`, `39895587965`, `39896000711`, `39896070739`): o `esteira.ts` vai lê-las como VERMELHAS. O VERMELHO de `7789cc2` é execução cancelada. Vigia ligada

## Etapas da missão
| Etapa | Situação | Onde |
|---|---|---|
| 0 Entrevista ⛔ | respondida em 20/10/2026 | `tasks/prd-reengenharia/RESPOSTAS.md` |
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
| 6.0 | `f49c095` | Sonnet | 2 (test-engineer, revisor-geral; tenancy na 1ª) | linha 1, pequena, 11:27–12:52; duas correções na linha antes dela: `ouro-base-qualitativa` (`05aa2fe`) e `porta-unica-so-import` (`9dd7a6b`, divergência de portão) |
| 53.0 | `c090987` | Sonnet | 2 (os cinco aprovados na 2ª) | linha 3, web, 12:25–13:05; a Mesa viu 6 fotos; acabamentos do espelho e a falta de atividade "para responder" na vitrine no TODO.md; integração não rodou (só web e shared) |
| 14.0 | `2164719` | Sonnet | — | linha 2; encontro depois do conserto R61 do `Arquiteto` (`1744468`) |
| 15.0 | `0c75678` | Sonnet | 2 (tenancy, test-engineer, revisor-geral aprovados na 2ª) | linha 2, ~12:25–13:15; divergências (ordem id e corpo, 15 rotas 404→400; suspender sem finalidade vira corpo fora do esquema) no documento e em `onda-1a.md` T1 |
| 7.0 | `b59fe0a` | Sonnet | 1 (tenancy, test-engineer, revisor-geral aprovados na 1ª) | linha 1, grande, 12:55–13:26; sem tela |
| 18.0 | `3ecaa07` | Sonnet | 2 (tenancy, privacy, test-engineer, revisor-geral aprovados na 2ª) | linha 3, grande, 13:07–13:50; sem tela |
| 8.0 | `a8398c3` | Sonnet | 2 (tenancy, infra, llm-integrator aprovados na 1ª; test-engineer, revisor-geral na 2ª) | linha 1, grande, 13:27–14:16; sem tela |
| 36.0 | `88fc287` | Sonnet | 2 (frontend-reviewer, test-engineer, revisor-geral aprovados na 2ª) | linha 2, grande, 13:20–14:18; sem tela |
| 97.0 | `b760b65` | Sonnet | 2 (frontend-reviewer e test-engineer na 1ª; revisor-geral na 2ª) | linha 2, grande, 14:19–15:20; 49 fotos vistas; um commit só (divergência no 97_task.md) |
| correção intermitentes-desafio-e-meus-dados | `6cc6c91` | Sonnet | 2 (privacy, frontend, infra na 1ª; test-engineer na 2ª) | linha 3, 14:10–16:50; desafio: defeito do teste; meus dados: foco caía no body (produto) |
| 44.0 | `ccdba9a` | Sonnet | 2 (infra, privacy, llm-integrator, test-engineer, revisor-geral aprovados na 2ª) | linha 2, pequena, 15:22–16:59; sem tela; migration 0038 e painel/uid do alerta como divergências registradas; 8 linhas no TODO.md |
| 48.0 | `41d65df` | Sonnet | 2 (test-engineer, revisor-geral; infra e llm-integrator na 1ª) | linha 1, grande, 16:38–17:40; 48.1 sem commit à parte (onda-3c.md T10); 2 linhas no TODO.md, 49.0 dona do disjuntor |
| 10.0 | `303cbac` | Sonnet | 2 (test-engineer, revisor-geral aprovados na 2ª) | linha 2, pequena, 17:00–17:39; sem tela; uma falha do portão na unidade sem causa achada, passou em 3 repetições; 1 linha no TODO.md da 12.0 |
| 9.0 | `02d3412` | Sonnet | 4 (tenancy-guardian 1ª–3ª, test-engineer 2ª–3ª; destravada pelo Arquiteto, R62) | linha 3, pequena, 16:52–18:13; ESCALADA na r2 (diagnóstico), BLOQUEIO na r3 (guarda só olhava `arguments[0]`) |
| 11.0 | `d58b563` | Sonnet | 2 (test-engineer, revisor-geral aprovados na 2ª) | linha 2, grande, 17:40–18:18; sem tela; esperou o commit da 95.0 no andar da spec para o encontro |
| 43.0 | `0eea211` | Sonnet | 2 (infra-guardian, llm-integrator, revisor-geral na 1ª; test-engineer na 2ª) | linha 1, grande, 17:45–18:32; sem tela |
| 16.0 | `21fc8e8` | Sonnet | 2 (tenancy-guardian, infra-guardian, test-engineer, revisor-geral aprovados na 2ª) | linha 2, grande, 18:19–19:17; sem tela |
| 17.0 | `e7426f9` | Sonnet | 2 (tenancy-guardian, privacy-guardian, test-engineer, revisor-geral aprovados na 2ª) | linha 1, grande, 19:18–20:15; sem tela |
| 33.0 | `c8e369e` | Sonnet | 2 (infra-guardian e test-engineer na 1ª; revisor-geral na 2ª) | linha 1, grande, 20:18–20:55; sem tela; 3 divergências no 33_task.md (commit único; `token-do-convite.ts` fica por causa do e2e, exceção em onda-2.md e 12_task.md; script fora do repo) |
| 34.0 | `af6fdb7` | Sonnet | 2 (tenancy-guardian, test-engineer, revisor-geral aprovados na 2ª) | linha 1, grande, 20:58–21:12; sem tela |
| 35.0 | `17e5608` | Sonnet | 2 (tenancy-guardian na 1ª; test-engineer e revisor-geral aprovados na 1ª e na 2ª) | linha 1, pequena, 21:14–21:38; sem tela |
| 96.0 | `47faf4d` | Sonnet | 2 (tenancy-guardian na 1ª; test-engineer e revisor-geral aprovados na 2ª) | linha 1, grande, 21:40–22:08; sem tela |
| 12.0 | `3ffe292` | Sonnet | 2 (tenancy-guardian, infra-guardian, test-engineer, revisor-geral aprovados na 2ª) | linha 1, grande, 22:14–22:45; sem tela; o `it` da 11.0 (login.service) fica no `arquitetura.test.ts` (fora da tabela da 12.0); recomendações da r2 no documento e no TODO.md |
| 24.0 | `32b277d` | Sonnet | 2 (infra-guardian na 1ª; test-engineer e revisor-geral aprovados na 2ª) | linha 2, pequena, 22:48–23:30; sem tela; divergências no 24_task.md e onda-1b.md (11 devDependencies na raiz, knip.json com ignores, guarda:dependencias roda audit e knip); test:infra só na esteira |
| 13.0 | `6f10b86` | Sonnet | 2 (test-engineer reprovou na 1ª; revisor-geral aprovado nas duas) | linha 1, pequena, 22:48–23:34; sem tela |
| 90.0 | `a3505d9` | Sonnet | 2 (infra-guardian na 1ª; test-engineer e revisor-geral aprovados na 2ª) | linha 2, grande, 23:32–00:03; sem tela; `medidas-da-onda-5.md`: build --no-cache 80 s → 78 s, imagens do mesmo tamanho; a 90.2 foi no commit da tarefa (Divergências) |
| 25.0 | `7aecd99` | Sonnet | 2 (test-engineer e revisor-geral aprovados na 2ª) | linha 1, grande, 23:34–00:10; sem tela; seis divergências no 25_task.md e onda-1b.md (ErroDeInvariante em packages/shared; a guarda isenta __fixtures__: 76 convertidos, não 84) |

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
Contexto: `tasks/prd-reengenharia/LINHA-DE-BASE.md` §5 (números) e §6 (ordem e ondas); `DECISOES.md` P4.
Opções: aprovar as três | ajustar alguma (dizer qual)
Recomendo: aprovar as três; os números sustentam a troca de ordem, e a P4 ganha conceito, não volume,
com risco de segurança.
**Respondida em 20/10/2026:** "faça o melhor que eu aprovo sua escolha" — aprovadas as três, como
recomendado: a ordem da §6, a P4 como não unificar (só extrair o literal) e a meta da onda 4 como
critério de aceite.

## O que falhou
- 22/10 18:13: o `esteira.ts` leu como VERMELHA a execução `39849855954` (8240170), que foi **cancelada** por um push mais novo (todos os jobs "caíram"); a última concluída, `39845850533`, é verde. Não abri correção. Para a retro: `cancelled` não é vermelho
- 22/10 16:12, linha 1, 19.0: mutação que trava o teste (laço síncrono) segurou `/tmp/educa-carga.lock` por 41 min; o `mutacoes.ts` usa `spawnSync` sem timeout e conta a morte do processo como vermelho. Para a retro: timeout por mutação, com o estouro contado como `recusada`

## O que decidi sem perguntar
- 22/10, 23:32 — esteira VERMELHA em `a0f1974` só no `casca.spec.ts:67` [celular], por 151 ms acima dos 5 s, num commit só de documento cujo código é o da `561ff3b`, verde. Não abri correção antes da partida da 90.0: o vermelho não vem de código da spec. Se as execuções seguintes repetirem, vira correção.
- 22/10, ~12:28 — DIVERGÊNCIA (portão) da 6.0 (l1): a regra do guarda da 1.0 (`porta-unica.test.ts:56`) casa a menção ao
  nome, não a importação. Aceitei a proposta do Implementador (estreitar à importação) como correção `porta-unica-so-import`
  na l1, e recusei a alternativa de quebrar o caminho em pedaços para a varredura não ver.
- 22/10, ~12:25 — correção `arquivo-do-titular-datas` (l3): DIVERGÊNCIA (ordem) do Implementador 3. Não havia defeito:
  as datas não vencem (relógio injetado); o vermelho local vinha do despachante e do worker-interativo do compose
  `educa-teste-3`, de pé, consumindo o job do teste. Com eles parados, 38/38; a integração da esteira (39797493843,
  `3f100df`) está verde. O vermelho da esteira é o `ouro.test.ts`, que já é a correção `ouro-base-qualitativa` da l1.
  Não abri nenhuma das duas correções propostas: fechei a l3 sem commit (quadro editado à mão, cópia em
  `.processo/linhas.json.antes-de-soltar-l3`; o encontro recusa correção sem commit). Para a retro: o portão não derruba
  os despachantes do compose de teste antes da integração, e falta `linhas.ts abandonar <n>`
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
