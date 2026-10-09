# Correção — o teste do plano do lote do expurgo troca de índice para `usuario` conforme a estatística que o banco tinha

**Origem:** uso (o portão local da tarefa 6.0 de `lgpd-e-titular`, em 09/10/2026; o teste é da tarefa 5.0, `tasks/prd-lgpd-e-titular/5_task.md`)
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `privacy-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. A correção altera um arquivo fora de tasks/, então revisor-geral não é exigido pelo passo 5. -->

## Sintoma

`apps/worker/test/expurgo-da-escola.int.test.ts` › `o lote de cada alvo desce pelo índice dele, que começa pela escola, sem varrer a tabela`
falhou no portão da 6.0 porque, no alvo `usuario`, o plano de `instrucaoDasPessoasDesativadas` usou
`usuario_escola_conta_papel_unico` e não `usuario_desativado_idx`. Rodado de novo, o teste passa. Em 55 execuções isoladas antes da
correção (15 + 40), a falha apareceu uma vez, e num alvo vizinho da mesma tabela de casos (veja "Fora desta correção"), o que
confirma a intermitência.

## Fora desta correção

Os 14 arquivos de `.processo/ordens/arquivos-da-tarefa-6.txt` (a 6.0, na árvore) não são alterados nem entram no commit:

- `apps/web/src/areas/coordenacao/rotas.tsx`, `apps/web/src/areas/navegacao.test.ts`, `apps/web/src/areas/navegacao.ts`, `apps/web/src/caminhos.ts`
- `docs/interface.md`, `e2e/__fixtures__/sessao.ts`, `e2e/areas.spec.ts`, `e2e/privacidade.spec.ts`
- `tasks/prd-lgpd-e-titular/6_task.md`, `tasks/prd-lgpd-e-titular/achados/indice.md`, `tasks/prd-lgpd-e-titular/estado.md`, `tasks/prd-lgpd-e-titular/achados/6_task.md`
- `apps/web/src/api/privacidade.ts`, `apps/web/src/areas/coordenacao/privacidade/`

Também fica fora: em uma das 55 execuções falhou o alvo `execucao_agente_do_tutor`
(`execucao_agente_do_tutor_a_anonimizar_idx` ausente do plano). É outro alvo, de outra tabela, e a causa provável é outra (a
amostra aleatória do `analyze` sobre a tabela que cresce, com as linhas de outros testes). Não foi investigado aqui, uma correção
por execução; vai no relatório ao Orquestrador.

## Causa

O teste mede o plano de cada lote com o volume de uma escola real e `analyze`, mas **só deu volume e `analyze` às tabelas que o
Tutor e as ferramentas enchem**. A `usuario` ficou de fora: o teste só cria 40 alunos ativos nela, nenhum desativado, e não a
analisa. O índice parcial `usuario_desativado_idx (escola_id, desativado_em) where desativado_em is not null` e a chave única
`usuario_escola_conta_papel_unico (escola_id, conta_id, papel)` começam os dois por `escola_id`, e com a escola estimada em uma
linha o planejador dá o **mesmo custo** aos dois (`cost=0.27..8.29 rows=1`). Quando o custo empata, quem decide é a estatística
global que o banco tinha de `usuario` naquele momento: tabela nunca analisada (banco limpo, `EDUCA_BANCO_NOVO=1`, o caso do portão),
`reltuples` velho depois de um teste que a encheu e desfez, ou autoanálise no meio.

Evidência da causa, no banco de teste, numa transação com rollback: com a escola do teste e a consulta do lote, trocar só
`pg_class.reltuples` de `usuario` de 1.000 para 100 trocou o plano de `usuario_desativado_idx` para
`usuario_escola_conta_papel_unico`, ambos a 8.29. Com 2.000 ativas, 30 desativadas e `analyze usuario`, o plano usa
`usuario_desativado_idx` (`Bitmap Index Scan`, `rows=30`) com `reltuples` em 100, 6.000 e 1.000.000.

Era falha do teste, não da consulta: a instrução do lote usa o índice certo, e é o que o teste prova quando a tabela tem volume.
Nenhuma tarefa antiga o causou além da 5.0, que escreveu o teste.

## Teste que reproduz

Não há vermelho determinístico pelo teste real. O empate de custo só se quebra para a chave única com certas estatísticas
acumuladas no banco (as de outros testes), e o `reltuples` baixo sozinho, contra a data de corte fixa do teste
(`QUARTA_1H`), não bastou para trocar o plano: ele só trocou com o corte em `now()`, na simulação em SQL descrita acima.
Evidência que substitui o vermelho:

- a simulação em SQL acima, que mostra o empate (8.29 nos dois) e a troca do plano pela estatística;
- o teste corrigido, rodado 30 vezes seguidas com `reltuples` de `usuario` deixado em 100 de propósito: 0 falhas;
- antes da correção, 55 execuções com 1 falha, e em outro alvo; a do portão da 6.0 foi em `usuario`.

## Correção

No teste `o lote de cada alvo desce pelo índice dele…`, o volume da escola, só dentro da transação que o teste desfaz, ganhou
as pessoas: 2.000 alunos ativos e 30 desativados há mais de 12 meses de `QUARTA_1H`. E `usuario` entrou na lista do `analyze`.
Com isso ler as 2.030 pessoas pela chave única custa muito mais que ler as 30 desativadas pelo parcial, e o planejador deixa de
depender da estatística de antes. Nenhum código de produção mudou, e o teste continua exigindo `usuario_desativado_idx` e nenhuma
`Seq Scan`.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª), infra-guardian (1ª), tenancy-guardian (1ª), privacy-guardian (1ª) | A intermitência do alvo `execucao_agente_do_tutor` (`execucao_agente_do_tutor_a_anonimizar_idx` ausente do plano), que o documento já declara em «Fora desta correção», precisa de correção própria antes do pouso | correção própria, que o Orquestrador abre: uma correção por execução; o Implementador cita no relatório (já está dito em «Fora desta correção») |
| test-engineer (1ª) | Conferir se existe teste de comportamento de que o lote de pessoas desativadas de uma escola não alcança as de outra | recusada: já existe, `o lote de A não escolhe a pessoa de B, mesmo a mais antiga: com o limite de 1, é a de A que sai` (`expurgo-da-escola.int.test.ts`, na seção de eliminação de pessoa desativada) |
| tenancy-guardian (1ª) | A verificação do plano olha o nome do índice e a ausência de `Seq Scan`, mas não confere que o predicado do índice usa `escola_id` | recusada nesta correção: já era assim, vale para os 13 alvos da tabela de casos e não nasceu aqui; o escopo do lote tem teste de comportamento (linha acima). O `/retro` de `lgpd-e-titular` lê `achados/` e pode retomar |
| privacy-guardian (1ª) | Comentário dizendo que o `analyze` dentro da transação é desfeito junto com o `rollback` | recusada: a premissa é só em parte verdadeira. O `analyze` grava `reltuples` em `pg_class` no lugar, fora da transação, e esse `reltuples` que sobra é justamente o «velho» que a «Causa» do documento descreve. O comentário diria o que não é |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-09 07:40:19 | 2026-10-09 07:41:21 | `test-engineer` | 1 | APROVADO | ac39c808959dd0555 |
| 2026-10-09 07:41:32 | 2026-10-09 07:41:50 | `privacy-guardian` | 1 | APROVADO | a42dee4451c885c3b |
| 2026-10-09 07:41:30 | 2026-10-09 07:41:53 | `tenancy-guardian` | 1 | APROVADO | a20ff513ed05fc493 |
| 2026-10-09 07:41:28 | 2026-10-09 07:41:53 | `infra-guardian` | 1 | APROVADO | a4face7fffab3da34 |
