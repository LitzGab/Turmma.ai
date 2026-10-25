# Correção — o teste do arquivo do titular fixa o relógio em 12 a 19/10 e passa a falhar quando a data real passa de 12/10

**Origem:** pedido do Orquestrador, em 24/10/2026, durante a 1.0 de `telas-do-aluno-e-primeiro-acesso`: `apps/api/test/arquivo-do-titular.int.test.ts`, os casos "a versão da escola apagada ou vencida…", "\"Meus dados\" lista só os pedidos…" e "a URL vale 300 s…". Teste que depende da data de hoje.
**Subagentes obrigatórios:** `privacy-guardian`, `test-engineer`, `tenancy-guardian`, `conformidade-reviewer`, `infra-guardian`
<!-- O `privacy-guardian` veio no PEDIDO do Orquestrador; os outros três entraram pela devolução da Mesa: todo arquivo de `apps/` pede os quatro guardiões (`tools/processo/guardioes-por-caminho.ts`), testes inclusive. A correção só altera um arquivo de teste: não passa dos 5 arquivos nem toca .github, tools/ci ou tools/processo, então sem `revisor-geral`. -->

## Sintoma

Em 24/10/2026, dois casos dão `200` onde esperam `404` (a versão da escola e o `baixar` depois do 7º dia, com o relógio do teste em `2026-10-19T14:00:01Z`) e o terceiro
("Meus dados" com a validade) compara o vencimento listado com `relogio.atual` + 7 dias e recebe a hora real (`expected 1793500865487 to be 1793023201000`: o relógio do teste ficou parado em 19/10 pelo caso vencido que falhou antes). Os três passavam em 10/10, quando o arquivo foi escrito.

## Fora desta correção

A tarefa 1.0 de `telas-do-aluno-e-primeiro-acesso` está na árvore, sem commit, e a correção não mexe nela. Os arquivos dela (`.processo/ordens/arquivos-da-tarefa-1.0.txt`):

- `apps/api/src/sessao/eu/eu.controller.ts`
- `apps/api/src/sessao/eu/eu.repository.int.test.ts`
- `apps/api/src/sessao/eu/eu.repository.ts`
- `apps/api/src/sessao/eu/eu.service.ts`
- `apps/api/src/sessao/sessao.module.ts`
- `apps/api/src/sessao/tenant/resolucao-de-tenant.repository.test.ts`
- `apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts`
- `apps/api/test/arquivo-do-titular.int.test.ts`
- `apps/api/test/login-email.int.test.ts`
- `apps/api/test/sessao-matricula.int.test.ts`
- `apps/web/src/api/eu.ts`
- `apps/web/src/areas/aluno/Atividade.test.tsx`
- `apps/web/src/areas/aluno/espelho-da-fila.test.ts`
- `apps/web/src/areas/coordenacao/passagens.test.tsx`
- `apps/web/src/areas/professor/inicio/Home.test.tsx`
- `apps/web/src/areas/professor/turmas/Turma.test.tsx`
- `apps/web/src/areas/titulo-das-telas.test.tsx`
- `apps/web/src/componentes/CascaDaEscola.test.tsx`
- `apps/web/src/sino-por-area.test.tsx`
- `docs/lgpd.md`
- `docs/modelo-de-dados.md`
- `e2e/__fixtures__/governanca.ts`
- `e2e/__fixtures__/painel.ts`
- `e2e/__fixtures__/sessao.ts`
- `infra/grafana/paineis/fundacao.json`
- `packages/nucleo/drizzle/meta/_journal.json`
- `packages/nucleo/src/db/schema/usuario.ts`
- `packages/nucleo/src/telemetria/metricas.ts`
- `packages/nucleo/src/titular/leitura-do-titular.ts`
- `packages/shared/src/index.ts`
- `packages/shared/src/permissao/matriz.expectativa.ts`
- `packages/shared/src/permissao/matriz.test.ts`
- `packages/shared/src/permissao/matriz.ts`
- `packages/shared/src/sessao/eu.ts`
- `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md`
- `tasks/prd-telas-do-aluno-e-primeiro-acesso/techspec.md`
- `tools/testes/metricas.ts`
- `tools/vitrine/escola.ts`
- `apps/api/src/sessao/eu/eu.service.test.ts`
- `apps/api/test/introducao.int.test.ts`
- `apps/web/src/api/eu.test.ts`
- `packages/nucleo/drizzle/0039_introducao_vista.sql`
- `packages/nucleo/drizzle/meta/0039_snapshot.json`

No `apps/api/test/arquivo-do-titular.int.test.ts` há um caso da 1.0 (a data da introdução vista, antes do "o arquivo do aluno não leva o id da coordenação…"): esse trecho fica na árvore, e o commit da correção leva só os trechos dela.

## Causa

O pedido de acesso é montado duas vezes. O teste monta o arquivo com o `relogio` dele (`montar`, que chama `criarMontagemDoArquivo`), mas a API também enfileira o job `montar-arquivo` ao registrar o pedido, e
um worker de pé na pilha de teste (o `test:e2e --manter-ambiente` os deixa; foi o caso da pilha `educa-teste-1` em 24/10, e a subida limpa do portão o derrubou) o consome e **regrava** a linha (`on conflict do update` em `ArquivoDoTitularRepository.gravar`) com o relógio de verdade. Medido: logo depois do `pedidoPronto` o
`pronto_em` é `2026-10-12T14:00:00Z` (o do teste), e três segundos depois é a hora real. Quem escreve por último muda o `pronto_em`, e o `expira_em` acompanha (`pronto_em` + 7 dias).

Em 10/10 isso não aparecia: a data real (até 12/10) mais 7 dias ainda caía antes de `2026-10-19T14:00:01Z`, e o arquivo regravado vencia no teste do mesmo jeito. Desde que a data real passou de 12/10,
o vencimento regravado (`hoje + 7 dias`) fica depois das datas fixas do teste, e o arquivo "vencido" ainda vale. A regra de produção está certa (a rota lê `expira_em` da linha e compara com o
relógio injetado); o defeito é do teste, que escreveu a regra de 7 dias em datas do calendário.

## Teste que reproduz

Os três casos do sintoma, em `apps/api/test/arquivo-do-titular.int.test.ts`. A versão do `HEAD` do arquivo, rodada inteira em 24/10: **3 vermelhos** (`expected 200 to be 404` nos de "apagada ou vencida" e "URL vale 300", e o de "Meus dados" com a diferença de data acima), 35 verdes. Depois da correção: **verdes**. Não há o que
reproduzir de forma nova: o relógio do computador é o gatilho, e a prova do vermelho é a execução de hoje, com a data real.

## Correção

Só teste, sem código de produção (`Sem mutação`, abaixo). Rodada 1 da Mesa: a primeira versão lia o prazo da linha e agia depois, sem conferir, e a regravação no meio ainda derrubava o caso; esta é a versão que atende a ordem.

- A saída é a (b) da rodada 1 do `test-engineer`, na forma que o Arquiteto diagnosticou depois da escalada (`.processo/ordens/diagnostico-2026-10-24-arquivo-do-titular-data-fixa.md`): **tirar o segundo escritor na origem**, em vez de conviver com ele. As versões anteriores (ler o prazo e agir; ler a linha antes e depois e repetir, o `comALinhaParada`) deixavam uma janela nova a cada passo e saíram.
- `tirarDaFila(escolaId, pedidoId)`, um auxiliar do arquivo, chamado pelo `pedidoPronto` entre o `registrar` e o `montar`: um `update job_registro set estado = 'concluido' … where estado = 'aguardando'` decide a disputa de forma atômica. O despachante só reserva job `aguardando` (com a condição repetida no `update`) e o executor não roda job `concluido`; então ou o teste ganha a linha e nenhum worker roda esse job, ou o despachante já a tinha, e o teste espera o job terminar (teto de 15 s, que falha dizendo por quê) e desfaz o que ele fez (apaga a linha do arquivo e devolve o pedido a `em_preparacao`). Nos casos que chamam o auxiliar (todo `pedidoPronto` e o pedido em preparação do caso da versão da escola), depois da chamada a linha só muda pela mão do próprio teste (rodada 2, itens 1 e 2); os outros casos do arquivo que usam `registrar` direto seguem como estavam (ver a primeira linha da rodada 3, abaixo).
- O pedido "em preparação" do caso da versão da escola também passa por `tirarDaFila`, sem `montar`: fica `em_preparacao` sem arquivo, por construção, e a asserção não corre mais contra o worker (rodada 2, item 2).
- Os três casos leem a linha uma vez (`validadeDoArquivo`), sem laço; em "Meus dados" o `update` que move o vencimento devolve a linha (`returning pronto_em, expira_em`) e é dela que saem as asserções.
- No caso da "URL vale 300 s", `expect(prontoEm).toEqual(relogio.atual)` volta a provar que o job grava com o relógio injetado: o `beforeEach` fixa o relógio, o `montar` do teste é o único escritor, e a hora real no momento do `montar` é sempre posterior.
- Os três casos deixam de fixar `2026-10-12`/`2026-10-19`. Um `beforeEach` devolve o relógio do teste à hora real antes de cada caso, e os dois `relogio.atual = new Date()` do fim dos casos saíram (item 6).
- A fronteira dos 7 dias é a da linha: `expira_em − 1 s` baixa (200) e `expira_em + 1 s` responde como o id inexistente (404). No caso da versão da escola a leitura é da versão `coordenacao`, o objeto que a rota lê (item 4).
- O 6º dia é `pronto_em` + 6 dias às 15:00Z (meio-dia de Brasília), e o nome do arquivo e o `validaAte` saem desse instante (`meus-dados-<diaDeUso>.json`, instante + 300 s), sem depender da hora em que o teste roda (item 5). Esse instante cai entre 5 dias e 15 h e 6 dias e 14 h depois do `pronto_em`: o que se prova é "antes dos 7 dias", e o comentário do caso diz isso (rodada 2, item 3).
- "Meus dados": antes de listar, o teste move o `expira_em` da linha para `pronto_em` + 7 dias + 1 h; o `expiraEm` listado tem de ser o da linha, e não `pronto_em` + 7 dias nem relógio + 7 dias, que agora dão outro valor (item 7).

## Estabilidade

O arquivo inteiro do teste (39 casos, com o da 1.0), rodado sozinho em 25/10, na pilha `educa-teste-1` desta linha:

- **sem despachante nem worker** (a subida limpa do portão, a que a esteira também tem): 3 de 3 verdes;
- **com `despachante-1`, `worker-interativo-1` e `worker-lote-1` de pé** (subidos com `docker compose … up --no-build`, na imagem `teste-1`; 450 jobs `titular.montar-arquivo` `concluido` ao fim, ou seja, o consumidor regravou de verdade): 5 de 5 verdes.

O ambiente onde o defeito aparece é o segundo. As versões anteriores desta correção são as que a Mesa reprovou por esse motivo.

Depois do `tirarDaFila`, em 25/10 (mesma pilha, 39 casos): **5 de 5 verdes com `despachante-1`, `worker-interativo-1` e `worker-lote-1` de pé** (765 jobs `titular.montar-arquivo` `concluido` ao fim) e **3 de 3 verdes sem eles**. O ramo de espera (o despachante ganhou a disputa) foi exercido: numa contagem temporária, em arquivo, de 3 execuções com worker, o teste ganhou o `update` em 113 dos 114 pedidos e o despachante ganhou 1 (na 2ª execução), e esse caso passou; o contador saiu antes do commit.

## Sem mutação

**Sem mutação:** a correção só altera `apps/api/test/arquivo-do-titular.int.test.ts`, que é teste; nenhuma linha de `apps/*/src` nem de `packages/*/src` muda.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| privacy-guardian (1ª) | Em `apps/worker/src/processadores/montar-arquivo.ts:51-64` e `packages/nucleo/src/titular/arquivo-do-titular.repository.ts:103`, o job grava o objeto e regrava a linha (`on conflict do update set prontoEm, expiraEm`) antes de saber se o pedido ainda está `em_preparacao`: reentrega (D49) renova a validade de 7 dias, e entrega tardia recria o objeto apagado. Mesmo ponto, de outro ângulo, no infra-guardian (1ª): "a regravação deve manter o `pronto_em` original". | Código de produção, fora do escopo de uma correção só de teste (o documento declara "Sem mutação"). Correção própria, a abrir pelo Orquestrador: vai no relatório final da Mesa. |
| privacy-guardian (1ª) | Com o segundo escritor fora, "volta a ser possível provar que o job usa o relógio injetado, coisa que a versão com datas fixas provava e esta não prova mais". | Fechada pelo `tirarDaFila`: o `montar` do teste é o único escritor, e o caso "a URL vale 300 s…" confere `prontoEm` igual ao relógio injetado. |
| conformidade-reviewer (1ª) | O caso "a data da introdução vista…" é da 1.0 e não foi auditado; confirmar que o campo não vira indicador de adoção por professor (regra 70, item 9). | Revisão da tarefa 1.0, quando ela pedir rodada. |
| tenancy-guardian (1ª), conformidade-reviewer (1ª) | A janela de corrida entre a leitura de `validadeDoArquivo` e a requisição. | Mesmo defeito do item 1; sem item próprio. Fechada pelo `tirarDaFila`: a linha tem um escritor só, lida uma vez. |
| test-engineer (2ª), infra-guardian (2ª) | Regravação em produção: `montar-arquivo.ts:57-61` e `arquivo-do-titular.repository.ts:103` renovam a validade na reentrega; a correção do job (não regravar o `pronto_em` de pedido já pronto) não é pré-requisito da prova (diagnóstico do Arquiteto: o `tirarDaFila` funciona com o job de hoje e com o corrigido). | Mesma linha da primeira linha da tabela: correção própria de produção, a abrir pelo Orquestrador depois da 1.0. |
| infra-guardian (2ª) | Registrar que a saída de conferir a linha antes e depois dependia de `pronto_em` diferir entre o relógio do teste e o do worker. | A saída saiu (a Mesa a reprovou): não há o que registrar aqui; vai para a retro. |
| test-engineer (3ª) | No caso "com o armazém fora…" (`:1136-1144`), o `registrar` vem seguido de três asserções (estado `em_preparacao`, nenhuma linha, 404) sem `tirarDaFila`; com worker de pé, o job pode terminar antes e deixá-las vermelhas. Já era assim antes da correção. | Mesmo padrão do item 2 da r2, em outro caso. Correção própria de teste (um `await tirarDaFila(cenario.escolaId, pedidoId)` depois do `registrar`), que o Orquestrador abre junto com a de produção do job `montar-arquivo`. |
| test-engineer (3ª) | `:880`: se o `update … returning` não achar linha, as datas viram `NaN` e `toBe(NaN)` passa; um `expect(movida).toHaveLength(1)` antes deixa a intenção explícita. | Mesma correção própria de teste. Hoje a asserção de `:888` pega o caso. |
| test-engineer (3ª) | `:1021`: a prova do relógio injetado depende de a hora real ter andado entre o `beforeEach` e o `montar`; fixar `relogio.atual` uma hora atrás antes do `pedidoPronto` tira a dependência. | Mesma correção própria de teste. |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 00:14:23 | 2026-10-25 00:14:44 | `tenancy-guardian` | 1 | APROVADO | add17a8162dcec9d4 |
| 2026-10-25 00:14:25 | 2026-10-25 00:14:45 | `conformidade-reviewer` | 1 | APROVADO | a0c76ec42ae381c18 |
| 2026-10-25 00:14:19 | 2026-10-25 00:15:31 | `privacy-guardian` | 1 | APROVADO | aaf8e63884cfb71f0 |
| 2026-10-25 00:14:27 | 2026-10-25 00:15:36 | `infra-guardian` | 1 | REPROVADO | ad07cd8165e5cc66d |
| 2026-10-25 00:14:21 | 2026-10-25 00:17:42 | `test-engineer` | 1 | REPROVADO | ab61b48afadd0ad72 |
| 2026-10-25 00:27:55 | 2026-10-25 00:28:55 | `infra-guardian` | 2 | APROVADO | adf219907f3519290 |
| 2026-10-25 00:27:50 | 2026-10-25 00:29:23 | `test-engineer` | 2 | REPROVADO | aea0314a55f813d04 |
| 2026-10-25 00:42:52 | 2026-10-25 00:44:41 | `test-engineer` | 3 | APROVADO | a7f2f99471e2cf831 |
