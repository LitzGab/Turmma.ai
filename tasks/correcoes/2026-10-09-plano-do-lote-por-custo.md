# Correção — o teste do plano do lote do expurgo deixava o custo escolher o índice, e com o banco acumulado escolhia o errado

**Origem:** teste intermitente (laços do Implementador em 09/10/2026, banco de teste acumulado; o teste é da tarefa 5.0, `tasks/prd-lgpd-e-titular/5_task.md`; diagnóstico do Arquiteto em `.processo/ordens/diagnostico-plano-do-lote.md`)
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `privacy-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador ("infra-guardian; se tocar repository, schema ou migration, também tenancy-guardian e privacy-guardian"). Esta correção só altera um arquivo de teste: não toca repository, schema nem migration; os dois últimos ficam marcados por precaução, como na correção anterior do mesmo teste. test-engineer é obrigatório em toda correção, marcado ou não. A correção altera um arquivo fora de tasks/, então revisor-geral não é exigido pelo passo 5. -->

## Sintoma

`apps/worker/test/expurgo-da-escola.int.test.ts` › `o lote de cada alvo desce pelo índice dele, que começa pela escola, sem varrer a tabela`
falhou no alvo `reivindicacao` (`reivindicacao_decidida_idx` ausente do plano; o plano usou `reivindicacao_nome_idx` com um `Sort` por cima),
4 vezes em 220 execuções do arquivo inteiro com o banco de teste acumulado, sempre perto da execução 22 de cada laço. Rodado isolado: 0 em 230.
Banco novo (`EDUCA_BANCO_NOVO=1`): não falhou.

Com o volume e o `analyze` nas três tabelas (a primeira tentativa de correção, a de `2026-10-09-plano-do-expurgo-intermitente` estendida a
`reivindicacao`, `material` e `vinculo`, que **não foi commitada**), um laço do arquivo inteiro falhou no mesmo alvo nas voltas 9 a 16,
seguidas; o plano dessas voltas não foi guardado.

## Fora desta correção

Nada: nenhuma tarefa em curso. O `estado.md` alterado na árvore é do Orquestrador e fica fora do commit.

## Causa

O teste pergunta ao planejador qual índice ele **prefere pelo custo**, e nos alvos em que a escola do teste não tem linhas o custo
empata em "1 linha" e quem desempata é o **tamanho físico do índice** que as outras execuções deixaram no banco (páginas por
linha, que o btree nunca devolve); o volume não conserta a `reivindicacao`, porque o planejador **não usa estatística de índice
parcial de expressão**, e estima a data sempre em um terço da escola.

Medido pelo Arquiteto em 09/10, 14:50 (hora do banco), no banco de teste, **só em leitura** (`begin read only`, `explain` sem
`analyze`, nenhum teste rodado). Medição inteira em `.processo/ordens/diagnostico-plano-do-lote-planos.txt`.

| Fato | Valor | Tipo |
|---|---|---|
| Postgres | 18.6, autovacuum ligado, `naptime` 60 s | medido |
| `reivindicacao` | 13 linhas em 38 páginas | medido |
| `reivindicacao_decidida_idx` (o do lote) | **12 linhas em 20 páginas** | medido |
| `reivindicacao_nome_idx` (o que ganhou nas falhas) | 13 linhas em 5 páginas | medido |
| Plano do lote, escola sem linhas, só `enable_seqscan = off` (o teste de antes) | `Sort` sobre `Index Scan reivindicacao_nome_idx`, custo 8,31. **O teste, como estava, falhava neste banco** | medido |
| O mesmo, pelo índice do lote | 12,29. A diferença é de 3,98: uma página de índice a mais (`ceil(20/12) = 2` contra `ceil(5/13) = 1`, a 4 de `random_page_cost`) | medido |
| Com `enable_sort = off` e `enable_bitmapscan = off` | os 13 alvos descem pelo índice esperado, nenhum com `Sort` nem nó desabilitado; a `reivindicacao` usa o `decidida_idx` mesmo custando mais | medido |
| `usuario` com `enable_sort = off` | `Incremental Sort` sobre `usuario_desativado_idx`: a ordenação incremental não é desligada | medido |
| Estatística de índice parcial de expressão não é lida | `selfuncs.c`, `examine_variable`: "we only consider stats for non-partial indexes". Sem ela, `coalesce(decidida_em, solicitada_em) < corte` vale 1/3 fixo | fonte do Postgres, não medido (o Arquiteto não pôde rodar `analyze`) |
| Por que o volume falhou 8 voltas seguidas | com 2.030 linhas na escola o planejador estima 677 pelo índice do lote (e não 30) contra 2.030 pelo `nome_idx`; a vantagem é de ~30 de custo, e some quando o `decidida_idx` incha ~3 páginas a mais que o `nome_idx` por volta sem vacuum (o `nome_idx` deduplica, a chave é a mesma em todas as linhas) | conta do Arquiteto; **não provada**, o plano daquelas voltas não foi guardado |

O que isso explica: banco novo não falha (índice de 1 ou 2 páginas, o empate cai para o lado certo); banco acumulado falha quando
o índice do lote passa a ter mais páginas que linhas, e volta a passar quando um vacuum ou uma análise regrava a conta; a correção
`1a405d2` segurou o `usuario` porque `desativado_em` é coluna simples, com estatística.

Era falha do teste, não da consulta: a instrução do lote usa o índice certo. Nenhuma tarefa antiga o causou além da 5.0, que escreveu o
teste.

## Teste que reproduz

`apps/worker/test/expurgo-da-escola.int.test.ts` › `o lote de cada alvo desce pelo índice dele, que começa pela escola, sem varrer a tabela`.

**Vermelho antes, determinístico.** Com o banco de teste no estado da causa, o teste antigo falha no alvo `reivindicacao`. O banco
estava novo (sem turma): rodei o arquivo uma vez para povoá-lo e depois `.processo/ordens/diagnostico-plano-do-lote-inchar.sql`
(4.000 reivindicações numa transação desfeita, mais `vacuum`). Estado medido: `reivindicacao_decidida_idx` com 38 páginas para 12
linhas, `reivindicacao_nome_idx` com 8 páginas para 13. Então
`npx vitest run --project integracao apps/worker/test/expurgo-da-escola.int.test.ts -t "desce pelo índice dele"`:

```
AssertionError: reivindicacao: expected [ 'reivindicacao_nome_idx', …(1) ] to include 'reivindicacao_decidida_idx'
```

**Verde depois**, no mesmo banco, o mesmo comando, com os itens 1 e 2 da "Correção".

**Mutação:** tirada só a linha `set local enable_sort = off`, no mesmo banco, o teste fica vermelho, e agora com o plano na mensagem:
`reivindicacao: ModifyTable - (custo 16.6, 0 linhas) > Limit - (custo 8.31, 1 linhas) > LockRows - (custo 8.31, 1 linhas) > Sort - (custo 8.3, 1 linhas) > Index Scan reivindicacao_nome_idx (custo 8.29, 1 linhas) > Index Scan reivindicacao_nome_idx (custo 8.29, 1 linhas)`.
A linha foi devolvida.

**Mutação de produção (test-engineer, 1ª rodada):** tirado o `escola_id = ${escolaId}` do subselect da `reivindicacao` em
`packages/nucleo/src/retencao/expurgo-da-escola.repository.ts` (linha 252), o teste fica vermelho, e só pela asserção nova
`not.toContain('Sort')`: o plano continuava usando o `reivindicacao_decidida_idx` e sem `Seq Scan`, então as duas asserções antigas passavam.
O teste antigo não via essa perda de escopo. Ordenar a `reivindicacao` por `solicitada_em` em vez da data do índice também o deixa vermelho.

**Laço:** 50 voltas do arquivo inteiro (109 testes cada), no banco acumulado e com os índices inchados, sem `EDUCA_BANCO_NOVO`: 0 falhas.

Os dois planos da `reivindicacao` medidos pelo Arquiteto (`.processo/ordens/diagnostico-plano-do-lote-planos.txt`), escola sem linhas:
com só `enable_seqscan = off`, `Sort` sobre `Index Scan using reivindicacao_nome_idx` a 8,29 (total do `Delete` 16,60); pelo índice do
lote, `Index Scan using reivindicacao_decidida_idx` a 12,28 (total 20,59).

## Correção

Só o arquivo de teste mudou; nenhum código de produção, migration nem critério de aceite.

1. No caso `o lote de cada alvo desce pelo índice dele…`, além de `enable_seqscan = off` o teste desliga `enable_sort` e
   `enable_bitmapscan` (`set local`, dentro da transação que ele desfaz). O teste passa a afirmar que o índice **serve** ao lote
   (predicado e ordem), e não que o planejador o prefere pelo custo: com a varredura sequencial, a ordenação e o bitmap desligados,
   o único plano sem nó desabilitado nos alvos com `order by` é o que desce pelo índice cuja chave é `(escola_id, <data>)`. No
   Postgres 18 o planejador compara primeiro o número de nós desabilitados e só depois o custo, então o plano com `Sort` perde de
   qualquer plano sem ele, com qualquer estatística. `enable_sort` não desliga a ordenação incremental, que é a do lote de pessoas
   (`order by desativado_em, id`), por isso o `usuario` continua passando pelo índice dele.
2. A asserção ganhou o que faltava e o plano resumido na mensagem de falha. O teste agora exige também que o plano **não tenha `Sort`**
   (o lote desce pelo índice já na ordem e para no limite; ordenar depois de ler é ler a escola inteira, como diz o comentário do
   repository acima de `INSTRUCAO_DO_LOTE`; antes disso o `mensagem_tutor` passava com `Sort` sobre `Bitmap Heap Scan`). A mensagem
   traz, para cada nó, tipo, índice, custo e linhas estimadas: a falha que não repete passa a deixar o plano que falhou. A interface
   `NoDoPlano` ganhou `'Total Cost'` e `'Plan Rows'`; os outros dois casos que a usam não mudaram.

O volume de `reivindicacao`, `material` e `vinculo` (a primeira tentativa) **não entrou**: na `reivindicacao` o planejador não lê a
data (1/3 fixo), então o volume não cria a margem que criou no `usuario`; e cada volta deixa 2.030 entradas mortas em cada índice das
três tabelas, que é o inchaço que desempata errado. Com o item 1, os três alvos não dependem mais de custo.

Seguem **por custo**, como estavam, e sem mudança: `execucao_agente_do_tutor` (dois índices dão a ordem, e o teste pede o menor; o
volume dele já está no teste, margem de ~2 vezes, 0 falhas em ~450 execuções) e `artefato_autoria` (sem `order by`, nunca falhou).
Se algum falhar, a mensagem já traz o plano.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Afirmar que o `Index Cond` do nó do índice contém `escola_id` (acrescentar `'Index Cond'?: string` a `NoDoPlano`) | Recusada nesta correção: é asserção nova, em teste que acabou de ser estabilizado, e o formato do `Index Cond` com parâmetros não foi medido. O nome do índice, exigido por alvo, e o teste de isolamento do expurgo já seguram o escopo. Reabrir se um índice for renomeado ou recriado sem a escola na frente |
| test-engineer (1ª) | Restringir a aceitação do `Incremental Sort` ao alvo `usuario` | Recusada: o nome do índice exigido já fecha o furo, e uma condição por alvo dentro do `for` é lógica nova no teste. A exceção ficou escrita no comentário (item 2) |
| privacy-guardian (1ª) | Manter a mensagem de falha só com tipo de nó, índice, custo e linhas | Sem ação: é a mensagem atual. Quem acrescentar `Index Cond` ou `Filter` à mensagem expõe parâmetros (`escolaId`, corte de data) e deve voltar ao `privacy-guardian` |
| infra-guardian (1ª) | Aplicar o resumo do plano na mensagem de falha ao caso parecido das linhas 1033–1034 | Para a próxima tarefa ou correção que mexer em `apps/worker/test/expurgo-da-escola.int.test.ts` nesse caso; fora do escopo desta correção, que só toca o caso do índice do lote |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-09 13:12:52 | 2026-10-09 13:15:10 | `test-engineer` | 1 | APROVADO | a75301b54fbf30528 |
| 2026-10-09 13:15:21 | 2026-10-09 13:15:38 | `privacy-guardian` | 1 | APROVADO | a3f68b6397c94de4d |
| 2026-10-09 13:15:18 | 2026-10-09 13:15:40 | `tenancy-guardian` | 1 | APROVADO | ac9a3944f974517dd |
| 2026-10-09 13:15:17 | 2026-10-09 13:15:56 | `infra-guardian` | 1 | APROVADO | a09876792b51d0988 |
