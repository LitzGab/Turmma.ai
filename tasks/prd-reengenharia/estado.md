# Estado da execução — reengenharia

A missão é `.reengenharia/MISSAO.md`, e o que vale sobre ela é `.reengenharia/RESPOSTAS.md` (Etapa 0,
respondida pelo Joaquim em 20/10/2026). Este arquivo é o `ESTADO.md` da missão: não existe outro.

## Agora
- **Espero:** a palavra do Joaquim na **⛔ parada da Etapa 4** (ver "Esperando o Joaquim"), no
  terminal do Orquestrador. Nenhum agente trabalha; vigia desligada
- **Devo ainda:** com a resposta, marcar a entrada como respondida, levar a decisão ao Arquiteto
  (sessão nova no andar) para registrar na §6 e em `DECISOES.md` (P4), e pedir a Etapa 5
  (diagnóstico por lentes). Conferir a esteira de `0b1d65a` (rodando em 20/10; a de `08dc125` caiu
  no `verificar` pelo guarda do protótipo, que o `0b1d65a` corrige)
- **Base:** `spec/reengenharia` em `0b1d65a` (relatório do Arquiteto: §6 ajustada à §5; exclusões
  redundantes de `mockups/` tiradas dos arquivos de medição, knip igual, hook aceitou)

## Etapas da missão
| Etapa | Situação | Onde |
|---|---|---|
| 0 Entrevista ⛔ | respondida em 20/10/2026 | `.reengenharia/RESPOSTAS.md` |
| 1 Descoberta e pesquisa | feita, `2d9ad5e` | `DESCOBERTA.md` |
| 2 Compreensão por unidade | feita, `2d9ad5e` | `MAPA.md`, `unidades/U01`–`U12` |
| 3 Material de trabalho | feita, `2d9ad5e` | `CONTRATOS`, `RISCOS`, `SUSPEITOS-MORTOS`, `DECISOES` |
| 4 Linha de base ⛔ | medida, `5c2db6a`; §6 ajustada, `0b1d65a`; parada aberta | `LINHA-DE-BASE.md` |
| 5 Diagnóstico por lentes | | |
| 6 Arquitetura-alvo ⛔ | | PRD e Tech Spec da X5 |
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

## O que falhou

## O que decidi sem perguntar
- 20/10/2026: o Arquiteto faz, nas Etapas 1 a 6, o papel que a missão dá ao "orquestrador técnico"
  (dividir, distribuir a subagentes por unidade, consolidar, decidir o que cruza unidades); o
  Orquestrador não lê código. Detalhe em `RESPOSTAS.md`, "Como a missão roda aqui"
