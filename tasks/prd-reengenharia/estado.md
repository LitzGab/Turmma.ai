# Estado da execução — reengenharia

A missão é `.reengenharia/MISSAO.md`, e o que vale sobre ela é `.reengenharia/RESPOSTAS.md` (Etapa 0,
respondida pelo Joaquim em 20/10/2026). Este arquivo é o `ESTADO.md` da missão: não existe outro.

## Agora
- **Espero:** o Arquiteto (sessão nova no andar, 21/10) escrevendo o **PRD da X5** (Etapa 6), a partir de
  `DIAGNOSTICO.md` §3 e §5. Ele para no terminal dele com o Joaquim nas perguntas (P1–P10, N1–N11) e na
  aprovação do PRD ⛔; depois segue para a Tech Spec (aviso) e as tarefas. 1ª tentativa. Vigia ligada
- **Devo ainda:** ler o veredito da esteira de `148617a` (execução 39642502289; as anteriores, de
  `0b1d65a` a `4b4711e`, verdes) no próximo relatório
- **Base:** `spec/reengenharia` em `148617a` (Etapa 5: 202 achados em 18 temas, R20–R31, S20–S24; o
  Arquiteto apagou `apps/web/src/api:`, sobra de subagente)

## Etapas da missão
| Etapa | Situação | Onde |
|---|---|---|
| 0 Entrevista ⛔ | respondida em 20/10/2026 | `.reengenharia/RESPOSTAS.md` |
| 1 Descoberta e pesquisa | feita, `2d9ad5e` | `DESCOBERTA.md` |
| 2 Compreensão por unidade | feita, `2d9ad5e` | `MAPA.md`, `unidades/U01`–`U12` |
| 3 Material de trabalho | feita, `2d9ad5e` | `CONTRATOS`, `RISCOS`, `SUSPEITOS-MORTOS`, `DECISOES` |
| 4 Linha de base ⛔ | medida, `5c2db6a`; §6 ajustada, `0b1d65a`; aprovada pelo Joaquim em 20/10 | `LINHA-DE-BASE.md` |
| 5 Diagnóstico por lentes | feita, `148617a` (limite semanal derrubou os subagentes em 20/10; retomada em 21/10, sem perda) | `DIAGNOSTICO.md` |
| 6 Arquitetura-alvo ⛔ | PRD pedido ao Arquiteto em 21/10 | PRD e Tech Spec da X5 |
| 7 e 8 Ondas e testes | | tarefas, nas linhas |
| 9 Skills, agentes, regras ⛔ | | |
| 10 Revisão independente | | Validador |
| 11 Docs oficiais, apagar `.reengenharia/` | | |
| 12 Relatório e pouso | | parada |

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|

## Esperando o Joaquim
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
- 20/10/2026: o Arquiteto faz, nas Etapas 1 a 6, o papel que a missão dá ao "orquestrador técnico"
  (dividir, distribuir a subagentes por unidade, consolidar, decidir o que cruza unidades); o
  Orquestrador não lê código. Detalhe em `RESPOSTAS.md`, "Como a missão roda aqui"
