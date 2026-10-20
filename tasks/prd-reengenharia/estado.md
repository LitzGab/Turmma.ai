# Estado da execução — reengenharia

A missão é `.reengenharia/MISSAO.md`, e o que vale sobre ela é `.reengenharia/RESPOSTAS.md` (Etapa 0,
respondida pelo Joaquim em 20/10/2026). Este arquivo é o `ESTADO.md` da missão: não existe outro.

## Agora
- **Espero:** o `RELATÓRIO` do Arquiteto (sessão nova no andar, 20/10) com a §6 de
  `.reengenharia/LINHA-DE-BASE.md` ajustada aos números da §5, e o vermelho de
  `tools/guardas/guardas.test.ts` ("nada fora de mockups/ aponta para o protótipo") resolvido: quem o
  causa são `.reengenharia/medicao/depcruise.cjs` e `knip.json`, do `2d9ad5e`. 1ª tentativa
- **Devo ainda:** com o relatório, **⛔ parada da Etapa 4** com a §5 e a §6 ao Joaquim. Se o hook
  recusar ao Arquiteto o commit dos dois arquivos de medição, abro uma correção (`corrigir`) no andar
- **Base:** `spec/reengenharia` em `5c2db6a` (linha de base do Implementador: e2e 1304 e infra 57
  verdes, rodados à parte; a esteira desta branch fica vermelha até o guarda ser resolvido)

## Etapas da missão
| Etapa | Situação | Onde |
|---|---|---|
| 0 Entrevista ⛔ | respondida em 20/10/2026 | `.reengenharia/RESPOSTAS.md` |
| 1 Descoberta e pesquisa | feita, `2d9ad5e` | `DESCOBERTA.md` |
| 2 Compreensão por unidade | feita, `2d9ad5e` | `MAPA.md`, `unidades/U01`–`U12` |
| 3 Material de trabalho | feita, `2d9ad5e` | `CONTRATOS`, `RISCOS`, `SUSPEITOS-MORTOS`, `DECISOES` |
| 4 Linha de base ⛔ | medida, `5c2db6a`; §6 pedida ao Arquiteto | `LINHA-DE-BASE.md` |
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

## O que falhou

## O que decidi sem perguntar
- 20/10/2026: o Arquiteto faz, nas Etapas 1 a 6, o papel que a missão dá ao "orquestrador técnico"
  (dividir, distribuir a subagentes por unidade, consolidar, decidir o que cruza unidades); o
  Orquestrador não lê código. Detalhe em `RESPOSTAS.md`, "Como a missão roda aqui"
