# Correção — o teste do arquivo do titular tem três pontas soltas (um caso sem `tirarDaFila`, um `returning` sem conferência, um relógio que depende da hora real) e nenhum caso prova o escopo da escola em `doPedido`

**Origem:** pedido do Orquestrador, em 25/10/2026: os três itens do `test-engineer` (3ª rodada) de `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md` e o item do `tenancy-guardian` (1ª) de `tasks/correcoes/2026-10-25-montar-arquivo-renova-validade.md`, ambos na tabela "Recomendações sem aplicar".
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `test-engineer`, `conformidade-reviewer`, `infra-guardian`
<!-- Os dois primeiros vieram no PEDIDO do Orquestrador. Os outros três entram porque todo arquivo de `apps/` pede os quatro guardiões (`tools/processo/guardioes-por-caminho.ts`), testes inclusive, como na correção `2026-10-24-arquivo-do-titular-data-fixa`. A correção altera um arquivo fora de `tasks/` e não toca .github, tools/ci nem tools/processo: sem `revisor-geral`. -->

## Sintoma

Em `apps/api/test/arquivo-do-titular.int.test.ts`:

1. **"com o armazém fora o pedido fica em preparação…"**: depois do `registrar` há três asserções (estado `em_preparacao`, nenhuma linha em `arquivo_titular`, 404 no download) sem `tirarDaFila`. Com um despachante e um worker de pé na pilha, o job `titular.montar-arquivo` que a API enfileirou pode ser consumido antes delas (o armazém está fora, mas o `armazem` do teste não é o do worker: ele monta, grava a linha e passa o pedido a `pronto`), e as asserções ficam vermelhas por causa do ambiente, e não do código.
2. **"Meus dados" lista só os pedidos…**: se o `update … returning` não achar linha, `movida[0]` é `undefined`, as datas viram `NaN` e `expect(listado).toBe(NaN)`… não distingue nada; só a asserção seguinte pega por acaso.
3. **"a URL vale 300 s…"**: `expect(prontoEm).toEqual(relogio.atual)` só prova que o job usa o relógio injetado se a hora real tiver andado entre o `beforeEach` e o `montar`; no mesmo milissegundo o teste passaria também com o relógio de verdade.
4. **Escopo da escola em `doPedido`**: nenhum teste quebra se a cláusula `escola_id` sair de `ArquivoDoTitularRepository.doPedido` (regra 10, item 5).

## Fora desta correção

A linha 1 faz a 2.0 (só web). Esta correção só mexe em `apps/api/test/arquivo-do-titular.int.test.ts`. "Arquivos da tarefa em curso": nenhum.

## Causa

- Itens 1 e 3: o teste depende do ambiente (worker de pé; resolução do relógio), a mesma família do defeito da `2026-10-24-arquivo-do-titular-data-fixa`, em casos que aquela correção não cobriu.
- Item 2: a asserção sobre o resultado do `update … returning` tem um valor padrão (`new Date(NaN)`) que esconde a ausência da linha.
- Item 4: faltava o caso. O repository está certo (`doPedido` lê a escola do contexto); o teste de isolamento do módulo passa pela API, que checa o objeto antes por outro caminho.

## Teste que reproduz

A correção só muda teste, e o código de produção está certo: o vermelho vem das mutações da seção "Mutações", e não de um caso que falhava.

- Item 4 (`o repository lê a escola do contexto…`, novo): vermelho com a cláusula `escola_id` fora do `doPedido` (mutação 1).
- Item 3 (`a URL vale 300 s…`): vermelho com o job gravando com a hora real em vez do relógio injetado (mutação 2); agora o relógio do teste fica uma hora antes, e a diferença é de uma hora, e não de milissegundos.
- Itens 1 e 2 são de robustez do teste (ambiente e asserção explícita): a prova é a estabilidade, abaixo.

## Correção

- **Item 1**: `await tirarDaFila(cenario.escolaId, pedidoId)` logo depois do `registrar`, ainda com o armazém fora, no caso do armazém.
- **Item 2**: `expect(movida).toHaveLength(1)` antes de montar `linha`, e a `linha` lê `movida[0]` sem valor padrão `NaN`.
- **Item 3**: `relogio.atual` volta uma hora, antes do `pedidoPronto`, no caso da URL de 300 s: o `prontoEm` gravado só é igual ao `relogio.atual` se o job usou o relógio injetado, porque a hora real é uma hora depois.
- **Item 4**: caso novo, na descrição "quem baixa", que monta o arquivo na escola B e lê `doPedido(pedidoB, 'completa')` no contexto da escola A: tem de devolver `undefined`; no contexto de B, a linha.

## Estabilidade

O arquivo inteiro (40 casos, com o novo), rodado sozinho em 25/10 na pilha `educa-teste-2` desta linha: 40 de 40 verdes.

## Mutações

```mutacao
arquivo: packages/nucleo/src/titular/arquivo-do-titular.repository.ts
teste: apps/api/test/arquivo-do-titular.int.test.ts › o repository lê a escola do contexto: no contexto de A, o arquivo do pedido de B não vem; no de B, vem
-      .where(and(eq(arquivoTitular.escolaId, exigirEscolaDoContexto()), eq(arquivoTitular.pedidoId, pedidoId), eq(arquivoTitular.versao, versao)))
+      .where(and(eq(arquivoTitular.pedidoId, pedidoId), eq(arquivoTitular.versao, versao)))
```

```mutacao
arquivo: apps/worker/src/processadores/montar-arquivo.ts
teste: apps/api/test/arquivo-do-titular.int.test.ts › a URL vale 300 s, o arquivo vale até o 7º dia, e no 8º a rota responde como o id inexistente
-    const agora = relogio.agora()
+    const agora = new Date()
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | Repetir a leitura no contexto de A com a versão `'coordenacao'` ("cobriria as duas versões que o arquivo do titular grava") | Recusada: o `pedidoPronto` desse caso só monta a versão `'completa'` (a "da coordenação… não existe aqui", como diz o comentário do caso anterior). Sem linha dessa versão, a leitura devolveria `undefined` com ou sem a cláusula `escola_id`, e a asserção não provaria nada. O `where` é um só para as duas versões e a mutação 1 já o prova |
| test-engineer (1ª) | Criar também um pedido em A e conferir que ele vem no contexto de A | Recusada: custa um pedido e uma montagem a mais no caso, e a mutação 1 já prova o vermelho sem a cláusula `escola_id`; a leitura positiva no contexto de B mostra que a leitura funciona |
| test-engineer (1ª) | O `throw` depois do `toHaveLength(1)` nunca é alcançado; trocar por auxiliar que devolva a linha tipada | Recusada: o `throw` é o que estreita o tipo de `movido` para o TypeScript (índice que pode ser `undefined`), e o próprio revisor diz que "pode ficar assim" |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 02:07:07 | 2026-10-25 02:07:28 | `infra-guardian` | 1 | APROVADO | adf792104607496ac |
| 2026-10-25 02:07:03 | 2026-10-25 02:07:29 | `tenancy-guardian` | 1 | APROVADO | a2a110e3e94210c7a |
| 2026-10-25 02:07:06 | 2026-10-25 02:07:30 | `conformidade-reviewer` | 1 | APROVADO | a0d30b024646c11e0 |
| 2026-10-25 02:07:04 | 2026-10-25 02:07:36 | `privacy-guardian` | 1 | APROVADO | aab7f2f55c69b4417 |
| 2026-10-25 02:07:05 | 2026-10-25 02:08:27 | `test-engineer` | 1 | APROVADO | ae941bfd2dcf5be50 |
