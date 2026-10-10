# Tarefa 15.0 — No 8º dia a eliminação acontece, com o nome trocado nos textos livres

**Funcionalidade:** lgpd-e-titular · **Depende de:** 4.0, 5.0, 12.0, 13.0, 14.0 · **Paralelo com:** 16.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A rotina enfileira a eliminação vencida, o `titular.eliminar` troca o nome completo em faixas, refaz a foto, anonimiza, elimina e conclui, com autor `rotina` restrito por check.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (check do autor), 5 ("Eliminação", etapas 1 a 3) e 13 (limite do nome anterior)
- Regra 70 itens 3 e 6; regra 80 item 7
- Código: `CicloDeVidaService` (1.0), `Compartilhamento` (12.0), `packages/nucleo/src/db/schema/auditoria.ts`, `executor.ts` (`falharInterrompidas`)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 15.1 — Migration própria: check do autor `rotina` (NOT VALID, VALIDATE); apelido reservado; índices `(escola_id, id)` parciais de texto
- [x] 15.2 — Enfileiramento pela rotina (`eliminacao_enfileirada_em`, 20 h)
- [x] 15.3 — `TrocaDeNome`: faixas de 1.000 examinadas, janela entre faixas, escapes, `titular.nome_trocado` no `returning`
- [x] 15.4 — Etapa 3 com `for update`, foto, anonimização, `eliminar` na transação, `apagado_em`, autor
- [x] 15.5 — Alerta `agendado` > 48 h e runbook
- [x] 15.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration, `auditoria.ts`, operador | alterado |
| `packages/nucleo/src/titular/troca-de-nome.ts` | novo |
| `apps/worker/src/processadores/eliminar-titular.ts` | novo |
| `expurgo-da-escola.repository.ts` | alterado |
| regra de alerta e runbook | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| prazo | integração | cancelado no 6º nada sai; no 8º tudo sai; antes de `eliminar_em` não faz nada |
| troca | integração | sentinela por coluna some; primeiro nome fica; caixa; apóstrofo, acento e regex com JSON válido; "Ana Souza" em "Mariana Souza" fica; 1.001 linhas em duas faixas |
| homônimo e professor | integração | sem troca e `homonimo`; professor sem troca |
| janela e falha | integração | janela entre faixas não conclui e a seguinte termina; falha no `eliminar` desfaz a etapa 3 |
| foto | integração | aluno com provedor sem cadastro: `origem` ≠ `periodo`; concluída ainda devolve o provedor |
| o que fica | integração | mapa guardado com o id; `apagado_em` marcado; "Titular eliminado"; só `nomeTrocado` |
| autor | integração | coordenadora ativa ou `rotina`; check aceita só a lista; apelido `rotina` recusado |
| linha antiga | integração | `consumo_ia` sem `provedor` passa pelo expurgo e pela troca |
| isolamento e log | integração | troca em A não toca B; log e respostas sem nome atual, anterior, termo nem URL |
| concorrência | integração [P] | dois `eliminar`; cancelar contra enfileirar; `pessoa_desativada` com eliminação |
| reenfileirar e alerta | integração e infra [F] | 20 h sim, menos não; 47 h não alerta, 48 h alerta |

## Como testar

- Molde: `apps/worker/test/expurgo-da-escola.int.test.ts` (`escolaNova`, `relogioEm`, `rodar`, `rodarRotina`). **janela:** `› a janela abre no meio…`; **faixas:** `› 5.001 linhas vencidas saem em dois lotes…`; **autor:** `› o desativado além do prazo é eliminado pelo ciclo de vida…`; **concorrência:** `› [P] dois jobs da mesma escola ao mesmo tempo eliminam cada pessoa uma vez…`.
- **check:** `packages/nucleo/src/auditoria/auditoria.int.test.ts › registro sem autor nenhum é recusado…`.
- **falha desfaz:** `apps/api/test/ciclo-de-vida.int.test.ts › na transação de quem chama…`.
- **alerta:** `infra/test/alerta-do-expurgo.int.test.ts`.
- Troca de nome: sem precedente.
- Rodar: `npx vitest run --project integracao <arquivo>`; `--project infra` no alerta.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As telas (16.0, 17.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| `titular.nome_trocado` grava **uma entrada por linha** (tabela e id), com a entidade `texto_livre`, e não uma por coluna | `consumo_ia` (entrada e saída) e `artefato` (título e conteúdo) têm duas colunas na lista; duas entradas para a mesma linha dariam a contagem errada de "o que a IA gerou e foi alterado" | `techspec.md` §5, bloco "Tarefa 15.0, como ficou no código"; `cenarios.md`, RF15 |
| Índice parcial só em `consumo_ia` (entrada e saída), `entrega` e `mensagem_agente`: `execucao_agente` e `artefato` já têm `(escola_id, id)` único | a coluna é `not null` nessas duas, então o parcial de texto não nulo não existe; o único `(escola_id, id)` serve à faixa | `techspec.md` §5 (bloco da 15.0) e §7c |
| O apelido `rotina` fica recusado também **na tabela** (`operador_apelido_formato <> 'rotina'`), além do comando | a spec dizia "reservado na criação de operador"; só o comando deixaria a linha entrar por fora dele, e a rotina assinaria como operador de verdade | `techspec.md` §3 e §5 |
| A eliminação **conclui os outros pedidos abertos do titular** (`recebido`, `em_preparacao`, `pronto`), cada um com `pedido.concluido` | o de acesso `em_preparacao` ficaria disparando o alerta de 2 h (pendência da 13.0, que a spec deixou para a 15.0 decidir) | `techspec.md` §5 (bloco da 15.0); `TODO.md` (item da 13.0, marcado) |
| `incidente` e `incidente_escola` ficam **fora** da lista de colunas da troca de nome | o texto é da nossa equipe, a regra "nenhum dado de titular" é do runbook; o motivo está em `COLUNAS_DA_TROCA_DE_NOME` | `techspec.md` §5 (bloco da 15.0); `docs/lgpd.md`; `TODO.md` (item da 9.0, marcado) |
| O pedido da **coordenação como titular** não existe: `papel_titular` segue `aluno` ou `professor` | decisão que a 11.0 deixou para esta tarefa; a spec não tem o caso nem a prévia dele, e a operação atende a única coordenadora | `techspec.md` §5 (bloco da 15.0); `TODO.md` (item novo) |
| O enfileiramento leva **no máximo 500 pedidos por noite**, do `eliminar_em` mais antigo, e a rotina da escola o faz (não um job novo) | a regra 80, item 3 (uma escola não degrada outra): sem teto, uma escola com milhares de pedidos vencidos grava milhares de jobs numa transação só | `techspec.md` §5 e §7c |
| O homônimo é **uma consulta em SQL** (`haHomonimoDoTitular`), usada pela prévia, pelo registro e pelo job; a comparação em JS da 11.0 saiu | uma regra, três lugares: a comparação em JS (`toLowerCase` do Node) e a do banco (`lower()`) podiam divergir em caixa e acento | `techspec.md` §5 (bloco da 15.0) |
| O padrão do nome é **sem a flag `i`**: cada letra vira `[aA]`, montado no Node | o `lower()` e a flag `i` do Postgres dependem da configuração de caractere do banco; o teste e a produção podem ter outra; limite aceito: a fronteira de palavra (`[[:alnum:]]`) e o homônimo (`lower()`) dependem da classificação de caractere do banco, e num banco com `LC_CTYPE=C` "é" não é alfanumérico e "MÜLLER" não casa com "Müller": o efeito é trocar a mais ou a menos o texto de outro aluno, e não vazar | `techspec.md` §5 (bloco da 15.0) |
| O texto de coluna com limite (`artefato.titulo`, 160; `entrega.justificativa`, 500) é **cortado no limite** depois da troca | `[nome removido]` é mais comprido que um nome curto, e o check da coluna derrubaria a faixa e a eliminação inteira | `techspec.md` §5 (bloco da 15.0) |
| O `eliminar` que responde `NAO_ENCONTRADO` (a pessoa saiu entre a leitura e a trava) **falha o job** em vez de ser engolido | a tentativa seguinte já não a encontra e só conclui; o `catch` não tinha teste que o derrubasse (mutação equivalente) | `techspec.md` §5 (bloco da 15.0); `TODO.md` |
| A faixa da troca de nome tem **dois** tetos: 1.000 linhas examinadas e 4 MB de texto (`ORCAMENTO_DA_FAIXA_EM_BYTES`), com ao menos uma linha por faixa | o custo do regex cresce com os bytes: 1.000 linhas de ~50 KB passam do `statement_timeout` de 2 s (medido pelo infra-guardian na 1ª rodada) | `techspec.md` §5 (bloco da 15.0) e §7c ("Limite por escola"); `cenarios.md`, RF15 |
| A **chave** de um documento JSON que é igual ao nome completo fica na coluna; só os **valores** são trocados | trocar a chave mudaria o formato do documento que o schema estrito de cada tarefa fixa (`consumo-ia.ts`), e um nome completo de aluno não coincide com uma chave do contrato; aceito pelo privacy-guardian na 1ª rodada | `techspec.md` §5 (bloco da 15.0) |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `eliminacao-do-titular.repository.ts` › `vencido` › `estado = 'agendado'` | `eliminar-titular.int.test.ts` › o pedido cancelado e o concluído não são eliminados |
| `eliminacao-do-titular.repository.ts` › `vencido` › `eliminar_em <= now()` | `eliminar-titular.int.test.ts` › antes do 8º dia nada acontece: a pessoa fica, o pedido continua `agendado` e o texto não é trocado |
| `eliminacao-do-titular.repository.ts` › `vencido` › `tipo = 'eliminacao'` | **equivalente**: `pedido_titular_agendado_com_prazo` só admite `agendado` com `eliminar_em` na eliminação, e `travarVencido` repete o filtro |
| `eliminacao-do-titular.repository.ts` › `travarVencido` › `estado = 'agendado'` | `eliminar-titular.int.test.ts` › [P] dois jobs do mesmo pedido ao mesmo tempo eliminam uma vez |
| `eliminacao-do-titular.repository.ts` › `travarVencido` › `eliminar_em <= now()` | **equivalente**: `eliminar_em` não muda depois de gravado e o `vencido` da mesma execução já a conferiu; fica por ser a leitura sob a trava |
| `eliminacao-do-titular.repository.ts` › `travarVencido` › `for update` | `eliminar-titular.int.test.ts` › [P] dois jobs do mesmo pedido ao mesmo tempo eliminam uma vez |
| `eliminacao-do-titular.repository.ts` › `registradorAtivo` › `desativado_em is null` | `eliminar-titular.int.test.ts` › a coordenação que registrou e já foi desativada não assina |
| `eliminacao-do-titular.repository.ts` › `anonimizarExecucoes` › `c.execucao_id in (select id from execucoes)` | `eliminar-titular.int.test.ts` › o nome sai de cada coluna de texto livre… |
| `eliminacao-do-titular.repository.ts` › `anonimizarExecucoes` › `c.escola_id = ${escolaId}` | **equivalente**: `consumo_ia_execucao_da_escola_fk` é composta `(escola_id, execucao_id)`; a cláusula fica pelo índice `consumo_ia_execucao_idx`, que começa pela escola (regra 80, item 8) |
| `eliminacao-do-titular.repository.ts` › `anonimizarExecucoes` › `solicitada_por = ${titularId}` | `eliminar-titular.int.test.ts` › o nome sai de cada coluna de texto livre… |
| `eliminacao-do-titular.repository.ts` › `anonimizarExecucoes` › `anonimizada_em is null` | **equivalente**: a anonimização zera `solicitada_por`, e a linha já anonimizada não casa mais com o titular |
| `eliminacao-do-titular.repository.ts` › `marcarArquivosApagados` › `p.titular_id = ${titularId}` | `eliminar-titular.int.test.ts` › conclui o pedido, apaga a pessoa e deixa o que a IA gerou sem ela… |
| `eliminacao-do-titular.repository.ts` › `marcarArquivosApagados` › `apagado_em is null` | `eliminar-titular.int.test.ts` › conclui o pedido, apaga a pessoa e deixa o que a IA gerou sem ela… |
| `eliminacao-do-titular.repository.ts` › `concluirOutrosAbertos` › `titular_id = ${titularId}` | `eliminar-titular.int.test.ts` › conclui o pedido, apaga a pessoa e deixa o que a IA gerou sem ela… |
| `eliminacao-do-titular.repository.ts` › `concluirOutrosAbertos` › `estado in ('recebido', 'em_preparacao', 'pronto')` | `eliminar-titular.int.test.ts` › conclui o pedido, apaga a pessoa e deixa o que a IA gerou sem ela… |
| `eliminacao-do-titular.repository.ts` › `concluirOutrosAbertos` › `id <> ${pedidoDaEliminacaoId}` | **equivalente**: o pedido da eliminação está `agendado`, fora dos três estados da cláusula acima |
| `eliminacao-do-titular.repository.ts` › `concluir` › `estado = 'agendado'` | **equivalente**: só é chamada com a linha que `travarVencido` acabou de travar `agendado` |
| `eliminacao-do-titular.repository.ts` › `concluir` › `nome_trocado`, `homonimo` | `eliminar-titular.int.test.ts` › o homônimo ativo, ou o mesmo nome livre na lista… |
| `eliminacao-do-titular.repository.ts` › `concluir` › `concluido_por = registrado_por` | `eliminar-titular.int.test.ts` › o nome sai de cada coluna de texto livre… |
| `eliminacao-do-titular.ts` › `eliminar` › `papel === 'aluno'` (só o aluno troca) | `eliminar-titular.int.test.ts` › o professor é eliminado sem troca de nome… |
| `eliminacao-do-titular.ts` › `eliminar` › `!homonimo` | `eliminar-titular.int.test.ts` › o homônimo ativo, ou o mesmo nome livre na lista… |
| `eliminacao-do-titular.ts` › `eliminar` › `!troca.concluida` (janela) | `eliminar-titular.int.test.ts` › a janela que abre entre as faixas para a troca sem eliminar… |
| `eliminacao-do-titular.ts` › `eliminar` › `existe` | `eliminar-titular.int.test.ts` › a pessoa que já saiu por outro caminho não tem o que eliminar… |
| `eliminacao-do-titular.ts` › `eliminar` › autor decidido sob a trava (`ativo ? registradoPor : rotina`) | `eliminar-titular.int.test.ts` › a coordenação que registrou e já foi desativada não assina… |
| `eliminacao-do-titular.ts` › `eliminar` › autor da troca de nome | `eliminar-titular.int.test.ts` › a coordenação que registrou e já foi desativada não assina… |
| `eliminacao-do-titular.ts` › `eliminar` › `gravarCompartilhamento` (foto) e a ordem foto → anonimização | `eliminar-titular.int.test.ts` › conclui o pedido, apaga a pessoa e deixa o que a IA gerou sem ela… (o consumo sem `aluno_id`, `provedor_so_pela_execucao`, só aparece na foto se ela vier antes da anonimização); e › falha ao eliminar desfaz a etapa 3 inteira… (a foto fora da transação) |
| `eliminacao-do-titular.ts` › `eliminar` › `anonimizarExecucoes` | `eliminar-titular.int.test.ts` › o professor é eliminado sem troca de nome… |
| `eliminacao-do-titular.ts` › `eliminar` › `marcarArquivosApagados`, `concluirOutrosAbertos` | `eliminar-titular.int.test.ts` › conclui o pedido, apaga a pessoa e deixa o que a IA gerou sem ela… |
| `eliminacao-do-titular.ts` › `eliminar` › `cicloDeVida.eliminar` na transação | `eliminar-titular.int.test.ts` › a janela que abre entre as faixas para a troca sem eliminar… e falha ao eliminar desfaz a etapa 3 inteira… |
| `troca-de-nome.ts` › `trocar` › `janelaAberta()` antes de cada faixa | `eliminar-titular.int.test.ts` › a janela que abre entre as faixas… |
| `troca-de-nome.ts` › `trocar` › nome em branco | `eliminar-titular.int.test.ts` › nome em branco não troca nada… |
| `troca-de-nome.ts` › `ANTES_DO_NOME_EM_TEXTO`, `DEPOIS_DO_NOME_EM_TEXTO` | `eliminar-titular.int.test.ts` › a fronteira de palavra vale também nas colunas de texto… |
| `troca-de-nome.ts` › `ANTES_DO_NOME_EM_JSON` (inclusive depois do escape `\n`) | `eliminar-titular.int.test.ts` › o nome logo depois de uma quebra de linha do JSON (`\n`) é trocado, e o nome dentro de outra palavra não |
| `troca-de-nome.ts` › `DEPOIS_DO_NOME_EM_JSON` (fronteira e chave do documento) | `eliminar-titular.int.test.ts` › o nome logo depois de uma quebra de linha do JSON… e a chave do documento que é o nome fica |
| `troca-de-nome.ts` › `#trocar` › `left(…, limite)` | `eliminar-titular.int.test.ts` › o nome curto que alonga o texto além do limite da coluna é cortado nele… |
| `troca-de-nome.ts` › `trocar` › uma entrada de auditoria por linha (`auditadas`) | `eliminar-titular.int.test.ts` › o nome sai de cada coluna de texto livre… |
| `troca-de-nome.ts` › `trocar` › só as quatro tabelas auditadas | `eliminar-titular.int.test.ts` › o nome sai de cada coluna de texto livre… |
| `troca-de-nome.ts` › `#trocar` e `#examinar` › `escola_id = ${escolaId}` (cada uma sozinha) | **equivalente** uma a uma: o `update` só recebe `id`s que o `select` da mesma transação trouxe da escola, e `id` é UUID; juntas, as três cláusulas tiradas fazem vermelhos o teste do nome por coluna (a outra escola é tocada) e o das 1.001 linhas |
| `troca-de-nome.ts` › `#examinar` › `id > cursor` | `eliminar-titular.int.test.ts` › mais de mil linhas examinadas passam por mais de uma faixa… (vermelho por tempo: sem o cursor a troca não termina) |
| `homonimo.ts` › `u.papel = 'aluno'` | `eliminar-titular.int.test.ts` › o professor com o mesmo nome e o nome que outra pessoa reivindicou… não são homônimo |
| `homonimo.ts` › `u.desativado_em is null` | `eliminar-titular.int.test.ts` › o homônimo desativado não impede a troca |
| `homonimo.ts` › `l.estado = 'livre'` | `eliminar-titular.int.test.ts` › o professor com o mesmo nome e o nome que outra pessoa reivindicou… não são homônimo |
| `homonimo.ts` › `lower(btrim(…))` da lista | `eliminar-titular.int.test.ts` › o homônimo ativo, ou o mesmo nome livre na lista… (a lista com o nome em outra caixa) |
| `homonimo.ts` › `t.escola_id = ${escolaId}` | `eliminar-titular.int.test.ts` › o repositório da eliminação, o homônimo e o arquivo respondem como inexistentes… |
| `expurgo-da-escola.repository.ts` › `enfileirarEliminacoes` › `estado = 'agendado'` e `eliminar_em <= now()` (o `update` externo e o da subconsulta) | **equivalente**: o predicado está nos dois níveis, e a subconsulta trava as linhas com `for update skip locked` antes de o `update` externo as rever; tirar de um nível só não muda o conjunto |
| `expurgo-da-escola.repository.ts` › `enfileirarEliminacoes` › `eliminacao_enfileirada_em < now() - 20 h` | `expurgo-da-escola.int.test.ts` › enfileirado há menos de 20 h espera; há mais de 20 h entra de novo, com a marca renovada |
| `expurgo-da-escola.repository.ts` › `enfileirarEliminacoes` › `eliminacao_enfileirada_em is null` | `expurgo-da-escola.int.test.ts` › o pedido vencido vira um job na fila de lote, não urgente, só com o id do pedido, e ganha a marca… |
| `expurgo-da-escola.repository.ts` › `enfileirarEliminacoes` › `limit 500` | `expurgo-da-escola.int.test.ts` › a noite leva no máximo 500 pedidos, os de prazo mais antigo primeiro… |
| `expurgo-da-escola.repository.ts` › `enfileirarEliminacoes` › `order by eliminar_em, id` | `expurgo-da-escola.int.test.ts` › a noite leva no máximo 500 pedidos, os de prazo mais antigo primeiro… (o prazo mais antigo tem o `id` maior) |
| `expurgo-da-escola.repository.ts` › `enfileirarEliminacoes` › `for update skip locked` | `expurgo-da-escola.int.test.ts` › [P] o pedido que o cancelamento está tocando fica para a noite seguinte |
| `expurgo-da-escola.repository.ts` › `enfileirarEliminacoes` › fila `lote`, `naoUrgente`, chave `eliminacao:<id>` | `expurgo-da-escola.int.test.ts` › o pedido vencido vira um job na fila de lote, não urgente, só com o id do pedido… |
| `expurgo-da-escola.repository.ts` › `vencimentoDoAgendadoMaisAntigo` › `estado`, `vencido`, `escola` | `medicao-da-eliminacao.int.test.ts` › a série é a idade do vencimento do agendado mais antigo… |
| `medicao-da-eliminacao.ts` › registro no `montarWorker` | `medicao-da-eliminacao.int.test.ts` › montada no worker de lote: mede no boot as escolas do banco e para com o worker |
| `troca-de-nome.ts` › `idsDentroDoOrcamento` › `somados + bytes > ORCAMENTO_DA_FAIXA_EM_BYTES` (o `break`) | `eliminar-titular.int.test.ts` › a faixa leva só as linhas que cabem no orçamento de bytes… (sem o `break` as três linhas saem na primeira faixa: `comNome: '0'` no lugar de `'1'`, sem depender de tempo); e › linhas grandes (1.000 de ~60 KB)… (sem o `break` a faixa passa de 2 s e o `rodar` lança `57014`) |
| `troca-de-nome.ts` › `idsDentroDoOrcamento` › `ids.length > 0` (ao menos uma linha por faixa) | `eliminar-titular.int.test.ts` › a linha sozinha acima do orçamento da faixa entra sozinha… (sem a guarda a faixa fica vazia, a coluna termina e as quatro linhas ficam com o nome: `comNome: '4'`) |
| `troca-de-nome.ts` › `trocar` › `examinadas.rows.length === 0` (a saída antecipada da faixa vazia) | **equivalente**: sem ela a faixa vazia chega a `#trocar` com a lista vazia (`'{}'::uuid[]`), nada muda, e `fim` dá verdadeiro do mesmo jeito (`0 === 0 && 0 < faixa`); fica por poupar um `update` |
| `troca-de-nome.ts` › `trocar` › `faixaFeita.ultimo === undefined` (a segunda condição de parada do laço) | **equivalente** com o código correto: `ultimo` só fica `undefined` na faixa vazia, que já sai por `fim`. Só se observa junto da mutação de `ids.length > 0` (linha acima), em que impede o laço sem fim e faz o teste falhar por asserção, e não por prazo |
| `troca-de-nome.ts` › `trocar` › `ids.length === examinadas.rows.length` (o fim com orçamento cortado) | `eliminar-titular.int.test.ts` › linhas grandes (1.000 de ~60 KB)… (com a condição tirada, a faixa cortada termina a coluna e as linhas seguintes ficam com o nome) |
| `eliminacao-do-titular.repository.ts` › `travarVencido` › `for update` (o cancelamento que chega antes da trava) | `eliminar-titular.int.test.ts` › o cancelamento que chega antes da trava vence…: o laço da `pg_stat_activity` estoura os 10 s sem o job esperando a trava |
| `montagem.ts` › `[TIPO_ELIMINAR_TITULAR]` | `eliminar-titular.int.test.ts` › o job enfileirado pela rotina é despachado e executado pelo worker… |
| `0036_eliminacao_do_titular.sql` › `auditoria_rotina_so_nas_acoes` sem `pedido.concluido` | `auditoria.int.test.ts` › aceita pedido.concluido; e `eliminar-titular.int.test.ts` › a coordenação que registrou e já foi desativada não assina… |
| `0036_eliminacao_do_titular.sql` › `auditoria_rotina_so_nas_acoes` com `entrega.decidida` | `auditoria.int.test.ts` › recusa entrega.decidida: aprovar, rejeitar e validar são de pessoa… |
| `0036_eliminacao_do_titular.sql` › `operador_apelido_formato` sem `rotina` | `auditoria.int.test.ts` › o apelido `rotina` não entra na tabela de operadores, nem por fora do comando |
| `operador.ts` › `apelidoValido` › `valor === AUTOR_DA_ROTINA` | `operador.test.ts` › "rotina" está no formato, mas é o autor reservado da eliminação e do expurgo e não vira apelido |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Um caso que derrube cada camada do escopo (seleção e escrita) de `#examinar`/`#trocar` sozinha, ou uma linha na §5 dizendo que a escrita é a defesa que fica | Recusada: a linha de "Mutações" de `#trocar` e `#examinar` › `escola_id` já declara o equivalente uma a uma e o vermelho das três juntas; `#trocar` é privado e o `id` é UUID da própria seleção |
| conformidade-reviewer (1ª) | Esconder `entidadeId` de `titular.nome_trocado` (execução e consumo) na leitura da coordenação, ou agregar por pedido | `TODO.md`: item para a tarefa que abrir a consulta da auditoria à coordenação ou o dossiê (D61); hoje nenhuma rota expõe a auditoria |
| conformidade-reviewer (1ª) | Ampliar o check para exigir `autor_usuario_id` em `entrega.decidida` e `lote.aprovado`, ou reescrever o teste "outro operador assina qualquer ação" | `TODO.md`: muda o contrato do check da 0036 e o gatilho `entrega_decidida_por_da_equipe` já protege a decisão real |
| conformidade-reviewer (1ª) | Dizer em `docs/lgpd.md` que a autoria da conclusão é a da auditoria (quando a coordenadora que registrou foi desativada, `concluido_por` é dela e a auditoria diz `rotina`) | Tarefa 16.0 (a tela mostra o autor da auditoria, e não `concluido_por`); `TODO.md` com a nota |
| conformidade-reviewer (1ª) | Teste de que a entrega `pendente` continua `pendente`, sem `decidida_por`, depois do job | `TODO.md`: pede fixture nova de entrega `pendente` e artefato; sem relação com a regra 70 item 3 (o job não decide entrega) |
| revisor-geral (1ª) | Trocar o `throw new Error('pedido de eliminação não concluído sob a trava')` por erro tipado (regra 00, item 9) | `TODO.md`: invariante inalcançável (sob a trava `agendado` não muda); tipar com `FalhaDeJob` muda a política de repetição do job e pede decisão |
| revisor-geral (1ª) | Cortar o texto antigo dos itens `[x]` do `TODO.md` | Recusada: o texto antigo é o histórico da pendência e cortar pede interpretação, sem regra que o exija |
| privacy-guardian (1ª) | Afirmar no teste do professor que `compartilhamento` sai com `origem: 'periodo'` | `TODO.md`: depende de o cenário ter suboperador vigente para o período do professor; o valor da foto do professor é provado em `compartilhamento.int.test.ts` |
| test-engineer (1ª), privacy-guardian (1ª) | Leitura de `GET pedidos/:id` depois do job (`titular: null`, `nomeTrocado`, provedor na foto), fim a fim pela API | Tarefa 16.0: é a que lê esse DTO na tela |
| test-engineer (1ª) | Uma linha de texto de ano `encerrado` no teste da troca, para mostrar que a troca não filtra por ano | `TODO.md`: pede fixture de ano encerrado; a troca não tem cláusula de ano e a regra de ano não se aplica à troca (é por escola) |
| infra-guardian (1ª) | Guardar o cursor da troca por coluna no pedido, para a noite seguinte não recomeçar da primeira faixa | `TODO.md`: muda o modelo de dados (coluna nova no pedido); o item 3 limita o custo da faixa e a causa 3 do runbook cobre o sintoma |
| infra-guardian (1ª) | Travar todos os pedidos do titular logo depois de `travarVencido`, para não inverter a ordem pedido → usuário (deadlock com o job de arquivo da 13.0) | `TODO.md`: muda a ordem de trava de `concluirOutrosAbertos`; a fila repete (D49) e não há deadlock medido |
| test-engineer (2ª) da 12.0 | "Professor com dois vínculos" confere o `ultimoEm` exato, com relógio injetado no service | Não aplicada: a 15.0 injeta o relógio na eliminação, mas o valor exato da foto do professor segue provado em `compartilhamento.int.test.ts` pelas duas mutações que o derrubam; a eliminação não muda a regra do período |
| privacy-guardian (1ª) da 12.0 | `docs/lgpd.md`, linha "Pedido do titular": dizer que a foto guarda por 5 anos a primeira e a última data de envio externo | Aplicada nesta tarefa: `docs/lgpd.md`, linha "Pedido do titular" |
| test-engineer (2ª) da 13.0 | Um caso direto por camada para a rota da escola (`doPedido` e `contaAtiva` com o id de um usuário de A no contexto de B) | Aplicada: `eliminar-titular.int.test.ts › isolamento` |
| tenancy-guardian (2ª) da 13.0 | Asserção no `arquitetura.test.ts`: nenhuma ação de professor ou aluno com `entidade: 'usuario'` | Aplicada: `arquitetura.test.ts › o que a auditoria diz de outra pessoa…` |
| conformidade-reviewer (1ª) da 11.0 | A prévia da coordenadora como titular segue a regra do professor | Não aplicada: a coordenação não é titular nesta fase (divergência acima); `TODO.md` |
| test-engineer (2ª), revisor-geral (2ª) | Exportar `idsDentroDoOrcamento` e provar o `break` e a guarda num teste de unidade | Aplicada de outro jeito, pelo diagnóstico do Arquiteto: os dois testes de integração novos provam as duas cláusulas pelo resultado, sem depender de tempo; exportar a função mudaria código de produção e caducaria as quatro aprovações dos guardiões |
| test-engineer (2ª), revisor-geral (2ª) | Filtrar a sondagem da `pg_stat_activity` pelo `pid` da conexão do job, ou pela escola | Recusada: o job usa uma conexão do pool, sem `pid` conhecido do teste, e o texto da consulta é parametrizado (sem o id do pedido); a serialização dos arquivos é do projeto `integracao` (`fileParallelism: false`) |
| infra-guardian (2ª) | `#examinar` converte o jsonb inteiro das 1.000 linhas a cada faixa (`octet_length(campo::text)`); usar `pg_column_size` ou reduzir o `limit` quando a faixa foi cortada | `TODO.md`: medido em 574 ms para 1.000 linhas de ~1 MB, dentro dos 2 s; rever com volume real no piloto |
| infra-guardian (2ª) | Juntar a 0036 ao item da 0031 do `TODO.md` ("fora do horário letivo e com `lock_timeout`"), porque `auditoria` cresce com o aluno | `TODO.md`: item novo, ao lado do da 0031 |
| privacy-guardian (2ª) | Deixar pronta, na causa 6 do runbook, a consulta que devolve só `id` e `octet_length` da maior linha por tabela da escola | `TODO.md`: item de runbook (mexer no runbook agora caducaria as aprovações) |
| privacy-guardian (2ª) | Teste do registrador desativado entre a leitura e a faixa, na etapa 2 (a faixa falha e a tentativa seguinte assina como `rotina`) | Tarefa 16.0, quando a tela mostrar o autor; `TODO.md` com a nota |
| conformidade-reviewer (2ª) | Manter o log do `job.tentativa_falhou` sem a mensagem crua do Postgres | Recusada: já é assim; `apps/worker/src/executor.ts:293` usa `resumirErro`, que só emite `sqlstate` e `constraint` |
| tenancy-guardian (2ª) | As duas camadas do escopo (seleção e escrita) só caem juntas; fica para o `/retro` | Recusada pela 2ª vez, com o motivo já na linha de Mutações de `#trocar`/`#examinar`; fica para o `/retro` |
| test-engineer (3ª), revisor-geral (3ª) | A linha de ~4,9 MB do teste da guarda roda o regex numa faixa só, contra o `statement_timeout` de 2 s (margem medida: cerca de dez vezes); se ficar instável na esteira, baixar para pouco acima de 4 MB | Só se a esteira da spec mostrar instabilidade; sem mudança agora. Registrar em `TODO.md` junto das outras recomendações desta tarefa, se o Implementador ainda for editá-lo |
| revisor-geral (3ª) | Levar ao `/retro` a recusa de filtrar a sondagem da `pg_stat_activity` pelo `pid` (motivo: `fileParallelism: false` no projeto `integracao`) e as duas camadas do escopo que o `tenancy-guardian` levantou | `/retro` da funcionalidade `lgpd-e-titular` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-10 05:17:03 | 2026-10-10 05:23:10 | `test-engineer` | 1 | REPROVADO | a4c75ac1c3ba37c9f |
| 2026-10-10 05:23:30 | 2026-10-10 05:24:45 | `tenancy-guardian` | 1 | APROVADO | a7cf5881617a30631 |
| 2026-10-10 05:23:24 | 2026-10-10 05:25:39 | `revisor-geral` | 1 | REPROVADO | a3314e6db5b8e3d4d |
| 2026-10-10 05:23:46 | 2026-10-10 05:26:18 | `conformidade-reviewer` | 1 | APROVADO | a8face0c26a6588f0 |
| 2026-10-10 05:23:35 | 2026-10-10 05:26:32 | `privacy-guardian` | 1 | REPROVADO | a3b567cde1e6ff169 |
| 2026-10-10 05:23:41 | 2026-10-10 05:27:51 | `infra-guardian` | 1 | REPROVADO | a5e3b448e3f8921d0 |
| 2026-10-10 05:39:54 | 2026-10-10 05:42:45 | `test-engineer` | 2 | REPROVADO | a2bb6d1e89804602c |
| 2026-10-10 05:43:12 | 2026-10-10 05:43:47 | `tenancy-guardian` | 2 | APROVADO | ad561f42e96a6bc34 |
| 2026-10-10 05:43:39 | 2026-10-10 05:44:05 | `conformidade-reviewer` | 2 | APROVADO | a9c1aba16594aaeff |
| 2026-10-10 05:43:22 | 2026-10-10 05:44:07 | `privacy-guardian` | 2 | APROVADO | a3c12c99a54f9c6cf |
| 2026-10-10 05:43:04 | 2026-10-10 05:44:27 | `revisor-geral` | 2 | REPROVADO | a6d78de50d12e6a67 |
| 2026-10-10 05:43:31 | 2026-10-10 05:45:12 | `infra-guardian` | 2 | APROVADO | acc4d879ac2a790bc |
| 2026-10-10 06:01:00 | 2026-10-10 06:03:05 | `test-engineer` | 3 | APROVADO | a1d1ab6a25c595c0f |
| 2026-10-10 06:03:23 | 2026-10-10 06:04:15 | `revisor-geral` | 3 | APROVADO | a98e779bcd9fc6703 |
