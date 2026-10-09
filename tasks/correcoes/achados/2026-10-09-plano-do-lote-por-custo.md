# Achados das revisões — `tasks/correcoes/2026-10-09-plano-do-lote-por-custo.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## test-engineer · 1ª rodada · APROVADO · 2026-10-09 13:15:10 · `tasks/correcoes/2026-10-09-plano-do-lote-por-custo.md`

**VEREDITO: APROVADO**

A correção prova a regra, e prova mais do que o teste antigo. Rodei as mutações neste andar, com o banco no estado da causa: rodei `.processo/ordens/diagnostico-plano-do-lote-inchar.sql`, que deixou o `reivindicacao_decidida_idx` com 38 páginas para 12 linhas e o `reivindicacao_nome_idx` com 8 para 13. Os dois arquivos mutados voltaram ao original, conferidos por md5, e a árvore ficou como estava.

**Cenários exigidos:**
- Caminho feliz: os 13 alvos descem pelo índice deles, sem `Seq Scan` e sem `Sort`, com o banco acumulado e com os índices inchados.
- Borda 1: o empate de custo que dependia do tamanho físico do índice deixado por outras execuções.
- Borda 2: o índice parcial de expressão, de que o Postgres não lê estatística.
- Borda 3: a ordenação incremental do lote de pessoas, que não pode quebrar o `usuario`.
- Regra de produção: tirar a ordem ou o escopo da instrução do lote deixa o teste vermelho.
- Permissão e isolamento: não se aplicam, porque só muda um arquivo de teste. A cláusula de escola entra pela mutação M4.
- Concorrência: não se aplica, porque a correção não traz operação nova que possa rodar duas vezes.

**Cobertos (rodados por mim):**
- **Verde depois:** o caso isolado passou no banco inchado. O arquivo inteiro passou 3 vezes seguidas (109/109).
- **M1, sem `set local enable_sort = off`:** vermelho no alvo `reivindicacao`, com a mesma mensagem do documento (`Sort` sobre `Index Scan reivindicacao_nome_idx`, "to include 'reivindicacao_decidida_idx'"). Confere com a mutação declarada.
- **M3, produção com a `reivindicacao` ordenada por `solicitada_em`** (`packages/nucleo/src/retencao/expurgo-da-escola.repository.ts:253`): vermelho.
- **M4, produção sem `escola_id = ${escolaId}` no subselect da `reivindicacao`** (`expurgo-da-escola.repository.ts:252`): vermelho, e só pela asserção nova `not.toContain('Sort')`. O plano usou o `reivindicacao_decidida_idx` e não teve `Seq Scan`, então as duas asserções antigas passaram. Antes desta correção, tirar o escopo da escola desse lote passava sem ninguém ver. A asserção nova sustenta a regra de fato.
- **M5, sem `enable_bitmapscan = off`:** continua verde. Neste banco a linha não muda o resultado; ver recomendação 1.
- **Lote de pessoas:** o `usuario` passa, porque `Incremental Sort` é outro tipo de nó e não cai na asserção.
- **Resto do checklist:** a mensagem de falha agora traz o plano resumido. Não há `.skip`, nenhum mock e nenhum provedor de IA envolvido.

**Bloqueantes:** nenhum.

**Recomendações:**
1. `apps/worker/test/expurgo-da-escola.int.test.ts:909`: o `enable_bitmapscan = off` não fez diferença no banco medido (M5 verde). Ele protege os alvos sem `order by`. Vale dizer isso no comentário das linhas 900 a 906, para ninguém tirá-lo achando que é redundante, nem achar que ele resolve a `reivindicacao`.
2. `apps/worker/test/expurgo-da-escola.int.test.ts:939`: `Incremental Sort` é aceito em todos os alvos, e não só no `usuario`. Um índice que desse só o prefixo da ordem passaria. Uma saída é restringir a aceitação ao alvo `usuario`.
3. Documento da correção, seção "Mutação": vale registrar também a M4. É a que mostra o valor da asserção nova: o escopo da escola fora do lote ordenado era invisível ao teste antigo.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-09-plano-do-lote-por-custo.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/src/retencao/expurgo-da-escola.repository.ts (só mutado e restaurado)

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-09 13:15:38 · `tasks/correcoes/2026-10-09-plano-do-lote-por-custo.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A correção mexe só no teste de plano do lote de expurgo: três `set local` do planejador dentro da transação que o teste desfaz, uma asserção nova que proíbe `Sort` no plano, e uma mensagem de falha com o plano resumido. Não muda schema, migration, repository nem código de produção.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica, porque não há rota nem endpoint novo. A instrução do lote continua presa à escola por `instrucaoDoLoteDaEscola(alvo, a.escolaId, …)`, e o índice exigido em cada alvo continua sendo o que começa por `escola_id`.

Logs: limpos. A mensagem de falha (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts:934`) traz, por nó, só quatro campos do JSON do `explain`: tipo de nó, índice, custo e linhas estimadas.
- Os nomes de alvo e de índice são identificadores do schema.
- Custo e linhas são estimativas do planejador sobre a tabela, não valores de linha.
- O `explain` roda sem `analyze`, então nenhuma linha é lida nem devolvida.
- `Index Cond`, `Filter` e parâmetros ficam de fora. Por isso nem o `escolaId` nem o corte de data entram na mensagem, e menos ainda nome, matrícula ou conteúdo.
- Os dados que o teste cria são sintéticos ("Aluno ativo sintético n", "Tema sintético"), e a transação termina em `rollback`.

Auditoria: não se aplica. Nenhuma ação que a regra 20, item 10, manda auditar foi criada ou alterada.

Envio externo: nenhum.

Seed/fixture: sintético, sem mudança no que o teste insere.

Prova do expurgo: ficou mais forte, não mais fraca. O teste agora exige que o índice sirva ao lote no predicado e na ordem, e não que o planejador o prefira pelo custo. Ele também proíbe `Sort`, que significaria ler a escola inteira antes de aplicar o limite. Nenhuma asserção sobre o que o expurgo apaga ou anonimiza foi tocada. Os `set local` valem só dentro da transação do teste e não alcançam outros testes nem a produção.

Bloqueantes: nenhum.

Recomendações:
- Se um dia a mensagem passar a incluir `Index Cond` ou `Filter` para ajudar na depuração, os valores de parâmetro aparecem nela (`escolaId`, data de corte). Hoje são sintéticos, mas convém manter a mensagem só com os quatro campos atuais.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-09 13:15:40 · `tasks/correcoes/2026-10-09-plano-do-lote-por-custo.md`

VEREDITO: APROVADO

Tabelas verificadas: nenhuma tabela nova nem alterada. A correção não traz migration nem schema.

Queries verificadas: nenhuma query de produção mudou. Conferi que as instruções do lote testadas continuam recebendo o escopo e são as mesmas de antes: `instrucaoDoLoteDaEscola`, `instrucaoDasPessoasDesativadas` e `instrucaoDoRegistroDoExpurgo`, todas com `a.escolaId`. No teste do plano (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts:860-945`), a mudança deixa a prova mais forte e não afrouxa nada:
- As afirmações de antes continuam: o índice `(escola_id, <data>)` de cada alvo aparece no plano e não há `Seq Scan`.
- Entrou uma afirmação nova: o plano não pode ter `Sort` (linha 939). Assim o teste exige que o lote desça pelo índice da escola já na ordem e pare no limite, sem ler a escola inteira para ordenar depois.
- Os `set local` de `enable_sort` e `enable_bitmapscan` ficam presos à transação, que termina em `rollback` (linha 942). Nada vaza para outros testes.
- A mensagem de falha mostra tipo de nó, nome do índice, custo e linhas estimadas. Não há dado de pessoa nem de outra escola nela.

Teste de isolamento: presente e efetivo. Os testes de isolamento do expurgo continuam no arquivo sem mudança. Neles a escola B, com dado mais antigo, não é tocada: linhas 576, 630, 1317, 1388, 1810, 1873 e 1928, entre outros. Se a cláusula `escola_id` sair do lote, a linha da escola B é apagada ou anonimizada e esses testes quebram. O teste do plano não é o teste de isolamento; ele prova o custo do lote por escola (regra 80, item 8).

Bloqueantes: nenhum

Recomendações:
- Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts:936`, hoje o teste deduz que o lote "começa pela escola" a partir do nome do índice. Seria mais forte afirmar que o `Index Cond` do nó do índice contém `escola_id`. Para isso, bastaria acrescentar `'Index Cond'?: string` à interface `NoDoPlano`, na linha 2594. Assim, um índice renomeado ou recriado sem a escola na frente também quebraria o teste.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-09 13:15:56 · `tasks/correcoes/2026-10-09-plano-do-lote-por-custo.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum (só um teste de integração do expurgo, que é um job de lote; nenhum código de produção mudou)
Rate limit: não se aplica
Fila e prioridade: ok (nenhuma mudança)
Concorrência: protegida (nenhuma mudança)
Índice e paginação: ok
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (nenhuma mudança)
Bloqueantes: nenhum

Recomendações:
- O teste agora prova que o índice consegue servir o lote. Não prova mais que o planejador o escolhe pelo custo. Com `enable_seqscan`, `enable_sort` e `enable_bitmapscan` desligados, o único plano sem nó desabilitado é o que desce pelo índice com escopo, então para o portão da regra 80 está certo. Mesmo assim, o comentário do teste deveria dizer, numa frase, que a escolha real do índice em produção, com estatística de escola grande, fica fora do teste. Isso pesa mais na `reivindicacao`, onde o planejador estima a data sempre em um terço da escola.
- `expect(tipos).not.toContain('Sort')` compara o tipo exato do nó, então deixa passar `Incremental Sort`. É de propósito por causa do `usuario`. Como o nome do índice também é exigido, o furo é pequeno, mas o comentário poderia dizer que a exceção vale só para o lote das pessoas.
- Quando fizer a próxima mudança nesse arquivo, vale aplicar o mesmo resumo do plano na mensagem de falha ao caso parecido das linhas 1033–1034, que ainda mostra só o texto da instrução.

O que conferi:
- Os índices exigidos começam todos por `escola_id`. Por exemplo, `reivindicacao_decidida_idx` é `("escola_id", coalesce("decidida_em","solicitada_em"))` com filtro `WHERE estado <> 'pendente'` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/packages/nucleo/drizzle/0027_expurgo_do_cadastro.sql:20`). Então o teste exige um índice com escopo e o lote sem varredura da tabela e sem `Sort`, que é o que a regra 80, item 8, pede.
- Rodei `npx vitest run --project integracao apps/worker/test/expurgo-da-escola.int.test.ts -t "desce pelo índice dele"` uma vez, isolado: passou. As 50 voltas sem falha, o vermelho antes da correção e a mutação estão descritos no documento da correção; não repeti nenhum deles.
- O teste não chama provedor pago, e os `set local` ficam dentro da transação que o próprio teste desfaz.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/apps/worker/test/expurgo-da-escola.int.test.ts` (linhas 897–940, 2594–2599)
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--speclgpd-e-titular/tasks/correcoes/2026-10-09-plano-do-lote-por-custo.md`
