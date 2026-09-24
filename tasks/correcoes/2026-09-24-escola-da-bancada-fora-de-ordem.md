# Correção — os testes de fila supõem que a escola criada primeiro tem o id menor, e a bancada passou a sortear UUID v4

**Origem:** esteira run 36036824412 (commit `829ab8d`, tarefa 1.0 de `apresentacao-painel`), job de integração; e um portão local
**Subagentes obrigatórios:** infra-guardian, tenancy-guardian
<!-- test-engineer é obrigatório em toda correção, marcado ou não. -->

## Sintoma

`apps/worker/test/reexecucao.int.test.ts › … › isolamento › jobs da escola A e da B reexecutados em sequência na mesma
réplica…` falhou na esteira com `expected [ { …(3) }, { …(3) } ] to deeply equal [ { …(3) }, { …(3) } ]`: as duas
linhas de efeito certas, na ordem trocada. `apps/despachante/test/metricas-espera.int.test.ts:84` (`caminho feliz: as
filas da escola A e da B saem em séries separadas…`) falhou do mesmo jeito num portão local. Rodados de novo, passam
cerca de metade das vezes.

## Causa

Defeito dos testes, exposto pela tarefa 1.0. Até o `829ab8d`, `BancadaDeFila.escola()` (e `BancadaDeSessoes.escola()`)
criava a escola sem id, e o banco dava o padrão da coluna, `uuidv7()`: ordenado pelo tempo, a escola criada primeiro
quase sempre tinha o id menor. A 1.0 passou a mandar o id do pedido (`criarEscola(…, { id: randomUUID(), … })`), como o
`ops:escola` e o painel agora fazem, e `randomUUID()` é v4: a ordem entre dois ids virou cara ou coroa.

Dois testes comparavam listas na ordem do id da escola supondo que A < B:

- `reexecucao.int.test.ts` lê os efeitos com `order by escola_id` e compara com `[linha de A, linha de B]`;
- `metricas-espera.int.test.ts:84` ordena as chaves `fila:escola_id` com `.sort()` e compara com
  `[interativa:A, interativa:B, lote:A]`.

A suposição já era frágil antes: as duas escolas nascem num `Promise.all`, e nada garante que a A chegue ao banco
primeiro, nem que `uuidv7()` de duas conexões saia em ordem. O v4 só tirou o "quase sempre".

Varredura para achar outras (evidência do alcance): as duas bancadas (`apps/worker/test/fila-de-teste.ts` e
`apps/api/test/sessao-de-teste.ts`) foram trocadas, só localmente, por um gerador de id **decrescente** (a escola criada
depois com o id menor), e a suíte de integração inteira rodou: `2 failed | 715 passed (717)`, exatamente estes dois.
As outras bancadas e scripts que a 1.0 mudou (`infra/scripts/carga-login.ts`, `infra/scripts/ensaio-alertas.ts`,
`apps/api/test/ops-escola.int.test.ts`) não comparam escolas por ordem de id, e as fixtures do e2e e os testes que
inserem escola por SQL continuam com o `uuidv7()` do banco. O projeto `infra`, fora da varredura, foi conferido por
leitura: `borda` e `alertas` usam uma escola por teste, `metricas.int.test.ts` já ordena o esperado e compara com
`arrayContaining`, e `conferir-carga.int.test.ts` acha cada linha por `find` na escola.

**Produção não supõe que o id cresce com a criação.** Conferido: as leituras com `order by` no id de rede ou escola são
`painel.repository.ts` (`order by nome, id`, o id só desempata), `resolucao-de-tenant.repository.ts`
(`usuariosAtivosDaConta` e `travarContaParaRedefinir`, ordem estável sem sentido de "mais recente"; o login só olha o
primeiro quando há um só usuário), `despacho.repository.ts` (rodízio e medição saltam pelo índice `fila, escola_id`, e
a justiça do rodízio não depende de qual escola vem primeiro) e `infra/scripts/conferir-carga.ts` (relatório). Nenhuma
paginação por keyset, "a mais recente" ou cursor usa o id de rede ou escola: o cursor da reconciliação é de job
(`prioridade, criado_em, id`), com id do banco. O painel e o `ops:escola` gravarem v4 não é defeito de desenho.

## Teste que reproduz

Os próprios dois testes, com a ordem ruim fixada no `beforeEach`: as duas escolas são criadas e ordenadas, e a A fica
com o id **maior** (`[ESCOLA_B, ESCOLA_A] = (…).sort()`). Assim a asserção que dependa da ordem dos ids falha sempre,
não em metade das vezes.

- `apps/worker/test/reexecucao.int.test.ts › … › isolamento › jobs da escola A e da B reexecutados em sequência na
  mesma réplica…`
- `apps/despachante/test/metricas-espera.int.test.ts › … › caminho feliz: as filas da escola A e da B saem em séries
  separadas…`

Vermelho antes, com a ordem fixada e as asserções antigas, em duas execuções seguidas: `2 failed | 8 passed (10)`,
`expected [ { …(3) }, { …(3) } ] to deeply equal [ { …(3) }, { …(3) } ]` e `expected [ …(3) ] to deeply equal [ …(3) ]`.
Verde depois, em três execuções seguidas: `10 passed (10)`.

## Correção

As asserções deixam de depender da ordem dos ids, que não é garantida em produção nem na bancada:

- `reexecucao.int.test.ts`: os efeitos são exatamente duas linhas, a da A e a da B, em qualquer ordem
  (`toHaveLength(2)` e `arrayContaining`). A prova de isolamento continua: a reexecução no escopo errado gravaria uma
  terceira linha, ou a linha na escola trocada.
- `metricas-espera.int.test.ts`: o esperado também é ordenado antes de comparar.

A bancada continua sorteando v4, de propósito: é o que o produto grava agora, e voltar a v7 só esconderia a suposição
(o `Promise.all` já não garantia a ordem). O comentário de `escola()` nas duas bancadas passa a dizer que o id não cresce
com a criação.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 16:03:57 | 2026-09-24 16:04:57 | `test-engineer` | 1 | APROVADO | af72ef4d1b1ee4bb6 |
| 2026-09-24 16:05:18 | 2026-09-24 16:05:53 | `tenancy-guardian` | 1 | APROVADO | a9c5aa52edbef7e59 |
| 2026-09-24 16:05:14 | 2026-09-24 16:05:57 | `infra-guardian` | 1 | APROVADO | a250b997bdbee6e3c |
