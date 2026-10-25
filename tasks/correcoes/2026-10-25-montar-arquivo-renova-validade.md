# Correção — o job `montar-arquivo` regrava o `pronto_em` e renova a validade de 7 dias do arquivo do titular na reentrega de um pedido que já não está em preparação

**Origem:** achado do `test-engineer` (2ª e 3ª rodadas) e do `infra-guardian` (1ª e 2ª) em `tasks/correcoes/2026-10-24-arquivo-do-titular-data-fixa.md`, seção "Recomendações sem aplicar", e do `privacy-guardian` (1ª) no mesmo ponto. Pedido do Orquestrador em 25/10/2026.
**Subagentes obrigatórios:** `privacy-guardian`, `infra-guardian`, `tenancy-guardian`, `conformidade-reviewer`, `test-engineer`
<!-- Os três primeiros vieram no PEDIDO do Orquestrador. O `conformidade-reviewer` entra porque todo arquivo de `apps/` e de `packages/` pede os quatro guardiões (`tools/processo/guardioes-por-caminho.ts`). A correção altera 4 arquivos fora de `tasks/` (2 de código, 2 de teste), não toca .github, tools/ci nem tools/processo: sem `revisor-geral`. -->

## Sintoma

A entrega ao menos uma vez (D49) reentrega o job `titular.montar-arquivo` de um pedido cujo arquivo já foi montado. O job:

1. regrava a linha de `arquivo_titular` com `on conflict do update set bytes, pronto_em, expira_em`: o `pronto_em` vira o instante da reentrega e o `expira_em` esse instante + 7 dias. Um arquivo pronto ontem passa a valer por mais 7 dias, e o titular (ou a coordenação, na versão da escola) o alcança por mais tempo do que a escola configurou (regra 20, itens 14 e 16). O mesmo vale para dois jobs do mesmo pedido ao mesmo tempo: quem grava por último renova a validade;
2. grava de novo o JSON no storage, também quando a rotina da escola ou a eliminação do titular já o apagou: o dado pessoal volta ao storage, e a linha nova o expira só daqui a 7 dias.

O teste atual do job, `o job repetido depois de pronto grava a mesma linha de novo…`, afirmava o comportamento ("a validade conta de novo").

## Fora desta correção

A linha 1 faz a 2.0 (só web). Esta correção não mexe em `apps/web` nem em `e2e/`. "Arquivos da tarefa em curso": nenhum.

## Causa

`criarMontagemDoArquivo` (`apps/worker/src/processadores/montar-arquivo.ts`) lê o pedido, mas **não olha se o arquivo dele já foi montado**: monta, grava o objeto e, na transação, chama `ArquivoDoTitularRepository.gravar`, cujo `on conflict do update` sobrescreve `pronto_em` e `expira_em`. Dois defeitos juntos:

- falta a guarda de entrada para o arquivo já montado;
- o conflito da linha troca a validade em vez de só os bytes, de modo que até os dois jobs simultâneos do mesmo pedido (a trava de concorrência prevista no cabeçalho do repository) deixam a validade do último.

**Por que a guarda não é "estado diferente de `em_preparacao`"**: a coordenação pode concluir o pedido enquanto ele está em preparação, e o job que roda depois ainda tem de montar o arquivo, para o titular baixá-lo (`apps/api/test/arquivo-do-titular.int.test.ts › o job que roda depois de a coordenação concluir o pedido grava o arquivo…`; a primeira versão desta correção a quebrou, e o teste pegou). O arquivo já foi montado quando o pedido está `pronto` (só este job o passa para lá) ou quando a linha da versão completa existe. Fica um caso sem guarda: pedido `concluido` cujo arquivo já foi montado **e** já foi apagado pela rotina (a linha some junto), reentregue depois de 7 dias; a reentrega do BullMQ acontece em minutos, não em dias, e o job continua montando um arquivo que vale 7 dias a partir de agora, o que o pedido concluído sempre fez.

## Teste que reproduz

Em `apps/worker/test/montar-arquivo.int.test.ts`, vermelhos no `HEAD` (4 casos, 10 verdes no mesmo arquivo; saída em 25/10):

- `o job repetido depois de pronto e concluído não regrava a linha nem o objeto…`: o `pronto_em` avançava um dia e o armazém recebia a segunda gravação;
- `a reentrega de um pedido pronto cujo objeto e cuja linha já foram apagados…`: o objeto e a linha voltavam;
- `o job que perde a disputa pelo pedido… deixa o pronto_em, a validade e o apagado_em de quem gravou primeiro`: o job de fora, que termina depois, regravava a validade do que terminou antes (o `apagado_em` entrou na ordem da rodada 1, e a mutação `apagadoEm: null` no `set` também o deixa vermelho);
- `o pedido que a coordenação concluiu antes de o job rodar é montado…`: **verde no HEAD e depois**; é o guarda da regra de produto que a guarda não pode quebrar.

## Correção

- `montar-arquivo.ts`: depois de ler o pedido, termina sem efeito (`titular.arquivo_ja_montado`) quando o pedido está `pronto` ou quando a linha da versão completa já existe;
- `arquivo-do-titular.repository.ts` (`gravar`): o `on conflict` do único `(escola_id, pedido_id, versao)` atualiza só os `bytes`; o `pronto_em` e o `expira_em` de quem gravou primeiro ficam;
- o teste que afirmava a validade renovada vira o que afirma o contrário, e o do job duplo deixa de exigir 4 gravações no armazém (com a guarda, o segundo job pode nem montar);
- o escopo da escola não muda: `doPedido` lê a escola do contexto, como os outros métodos.

## Estabilidade

Os dois arquivos que falam com o job, rodados juntos em 25/10 (`montar-arquivo.int.test.ts`, 14 casos, e `arquivo-do-titular.int.test.ts`, 39): 53 de 53 verdes.

## Mutações

```mutacao
arquivo: apps/worker/src/processadores/montar-arquivo.ts
teste: apps/worker/test/montar-arquivo.int.test.ts › a reentrega de um pedido `pronto` cujo objeto e cuja linha já foram apagados pela validade vencida não recria nenhum dos dois
-    if (pedido.estado === 'pronto' || (await arquivos.doPedido(pedido.id, 'completa')) !== undefined) {
+    if ((await arquivos.doPedido(pedido.id, 'completa')) !== undefined) {
```

```mutacao
arquivo: apps/worker/src/processadores/montar-arquivo.ts
teste: apps/worker/test/montar-arquivo.int.test.ts › o job repetido depois de pronto e concluído não regrava a linha nem o objeto: o `pronto_em` e a validade seguem os do primeiro job
-    if (pedido.estado === 'pronto' || (await arquivos.doPedido(pedido.id, 'completa')) !== undefined) {
+    if (pedido.estado === 'pronto') {
```

```mutacao
arquivo: packages/nucleo/src/titular/arquivo-do-titular.repository.ts
teste: apps/worker/test/montar-arquivo.int.test.ts › o job que perde a disputa pelo pedido porque o outro terminou enquanto ele montava deixa o `pronto_em`, a validade e o `apagado_em` de quem gravou primeiro
-      .onConflictDoUpdate({ target: [arquivoTitular.escolaId, arquivoTitular.pedidoId, arquivoTitular.versao], set: { bytes } })
+      .onConflictDoUpdate({ target: [arquivoTitular.escolaId, arquivoTitular.pedidoId, arquivoTitular.versao], set: { bytes, prontoEm, expiraEm } })
```

```mutacao
arquivo: apps/worker/src/processadores/montar-arquivo.ts
teste: apps/worker/test/montar-arquivo.int.test.ts › o pedido que a coordenação concluiu antes de o job rodar é montado: a linha nasce, e o pedido continua `concluido`
-    if (pedido.estado === 'pronto' || (await arquivos.doPedido(pedido.id, 'completa')) !== undefined) {
+    if (pedido.estado !== 'em_preparacao') {
```

```mutacao
arquivo: packages/nucleo/src/titular/arquivo-do-titular.repository.ts
teste: apps/worker/test/montar-arquivo.int.test.ts › o job que perde a disputa pelo pedido porque o outro terminou enquanto ele montava deixa o `pronto_em`, a validade e o `apagado_em` de quem gravou primeiro
-      .onConflictDoUpdate({ target: [arquivoTitular.escolaId, arquivoTitular.pedidoId, arquivoTitular.versao], set: { bytes } })
+      .onConflictDoUpdate({ target: [arquivoTitular.escolaId, arquivoTitular.pedidoId, arquivoTitular.versao], set: { bytes, apagadoEm: null } })
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | Janela de corrida entre a guarda (`montar-arquivo.ts:53`) e a gravação do objeto (`:69`): se outro job termina e a eliminação do titular marca `apagado_em` e apaga o objeto nesse intervalo, o job grava o objeto de novo, e o `apagarLinhas` pode já ter removido a linha. Sugere conferir de novo dentro da transação, ou o expurgo varrer objetos sob `titular/<escola>/` sem linha. | `TODO.md`. Muda comportamento do job (conferência nova na transação ou rotina nova de expurgo); o próprio revisor diz que a janela é de segundos e que o defeito já existia antes. |
| privacy-guardian (1ª) e infra-guardian (1ª) | Registrar o caso sem guarda (pedido `concluido` cujo arquivo foi montado e apagado junto com a linha, reentregue depois de 7 dias) no mapa de retenção de `docs/lgpd.md` e como risco conhecido no runbook do arquivo do titular. | `TODO.md`. `docs/lgpd.md` e o runbook são arquivos que esta correção não toca. |
| tenancy-guardian (1ª) | Caso em `arquivo-do-titular.int.test.ts` em que `doPedido`, no contexto da escola A, não devolve a linha da escola B (nenhum teste quebraria se a cláusula `escola_id` saísse do `doPedido`, `arquivo-do-titular.repository.ts:133`). | `TODO.md`, para a próxima tarefa que toque `apps/api/test/arquivo-do-titular.int.test.ts`. Arquivo que esta correção não toca; hoje não abre vazamento. |
| test-engineer (1ª) | Fechar o caso sem guarda com um marcador no pedido (por exemplo `arquivo_montado_em`), gravado na mesma transação. | `TODO.md`/retro. Exige coluna e migration: muda contrato e está fora do pedido desta correção. |
| test-engineer (3ª) da correção `2026-10-24-arquivo-do-titular-data-fixa`, três itens de `apps/api/test/arquivo-do-titular.int.test.ts` (`:1136-1144`, `:880`, `:1021`) | `tirarDaFila` depois do `registrar` no caso "com o armazém fora…", `expect(movida).toHaveLength(1)` e fixar o relógio uma hora atrás | Correção própria de teste, ainda a abrir pelo Orquestrador; fora do pedido desta. |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.
| 2026-10-25 01:34:38 | 2026-10-25 01:35:01 | `conformidade-reviewer` | 1 | APROVADO | a199a43edc1b6970e |
| 2026-10-25 01:34:36 | 2026-10-25 01:35:05 | `tenancy-guardian` | 1 | APROVADO | a4b912913046a350b |
| 2026-10-25 01:34:33 | 2026-10-25 01:35:18 | `privacy-guardian` | 1 | APROVADO | ad6ed29d906aae7f5 |
| 2026-10-25 01:34:35 | 2026-10-25 01:35:20 | `infra-guardian` | 1 | APROVADO | ab4d8f36783efb37f |
| 2026-10-25 01:34:39 | 2026-10-25 01:36:21 | `test-engineer` | 1 | APROVADO | aadfdf32b5492bab3 |
| 2026-10-25 01:44:14 | 2026-10-25 01:45:07 | `test-engineer` | 2 | APROVADO | a5aff16fe08a3cd1f |
