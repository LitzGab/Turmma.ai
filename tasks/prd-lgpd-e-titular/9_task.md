# Tarefa 9.0 — A operação registra incidente e a escola afetada confirma o recebimento

**Funcionalidade:** lgpd-e-titular · **Depende de:** 2.0 · **Paralelo com:** 3.0 a 8.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Incidente registrado por comando, com números e textos por escola, lido e confirmado só pela escola afetada, guardado 5 anos e com alerta de 24 h sem confirmação.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (`incidente`, `incidente_escola`), 4 (`GET incidentes`), 5 ("Incidente") e 6
- `docs/lgpd.md` seção 8
- Código: `expurgo-de-acesso.repository.ts` (alvos e justificativa)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 9.1 — Migration própria: `incidente`, `incidente_escola`, índice de pendentes
- [x] 9.2 — `ops:incidente registrar` (seção por escola; recusa nome ou id de outra escola, com caixa e acento)
- [x] 9.3 — `IncidenteDaEscolaRepository`, `GET incidentes` e `POST incidentes/:id/confirmar`, auditoria `incidente.confirmado`
- [x] 9.4 — Alvo `incidente` no `sistema.expurgar-acesso`, justificativa reescrita
- [x] 9.5 — Alerta de 24 h e runbook; `docs/lgpd.md` (linhas do incidente)
- [x] 9.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e schemas | novo |
| `apps/api/src/ops/incidente.ts` | novo |
| `packages/nucleo/src/titular/incidente-da-escola.repository.ts` | novo |
| rotas em `privacidade` | alterado |
| `expurgo-de-acesso.repository.ts` | alterado |
| regra de alerta, `docs/runbook.md`, `docs/lgpd.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| registro | integração | sem dado de titular; números e categorias por escola; texto citando outra escola recusado |
| isolamento | integração | A não recebe contagem nem texto de B; confirmar em A não confirma B; incidente só de B dá `NAO_ENCONTRADO` |
| confirmação | integração | grava `confirmado_por` |
| concorrência | integração [P] | duas confirmações mantêm a primeira |
| expurgo | integração | 5 anos e um dia sai, com as ligações |
| alerta | infra [F] | 23 h não dispara, 25 h dispara |
| arquitetura | unidade | parte `incidente` |

## Como testar

- **registro, isolamento, confirmação:** molde de `apps/api/test/retencao.int.test.ts` (`rodar`, `bancada.escolaComSessao('coordenador')`, `chamar`). Igual a inexistente: `apps/api/src/ia/ia.int.test.ts › de outra pessoa, de outra escola, inexistente…`. Ponha o comando em `apps/api/test/ops-operador.int.test.ts › C2`: a 2.0 reprovou por faltar.
- **concorrência:** `retencao.int.test.ts › concorrência: dois ajustes da mesma escola…`, com `GatilhoDeParada` no `update` de `incidente_escola` e `esperarNaTrava`.
- **expurgo:** `apps/worker/test/expurgo-de-acesso.int.test.ts › borda: nos limites de cada prazo…`. O alvo novo quebra `› alvo sem total` e `› log: cada contagem…`: atualize os dois.
- **alerta:** `infra/test/alerta-do-expurgo.int.test.ts › duas noites parciais disparam…` (linha gravada antes do `composeAssincronoOuFalha`; `alertaCom`, `expect.poll`); a regra entra em `REGRAS_PROVISIONADAS` (`infra/scripts/ensaio-alertas.ts`).
- **arquitetura:** `apps/api/test/arquitetura.test.ts › o expurgo toca da operação só o acesso, a sessão e o convite`.
- Comando que lê arquivo: sem precedente; o mais próximo é `ops-operador.int.test.ts › C8`.
- Rodar: `npx vitest run --project integracao <arquivo>`; `--project infra` no alerta.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As telas (10.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| `incidente_escola` ganha `id` próprio, e é ele que a escola vê e confirma (`GET incidentes` devolve `id`; `POST incidentes/:id/confirmar` recebe esse id). A Tech Spec não dava id à seção e não listava `id` no DTO | O `incidente_id` é dividido entre as escolas afetadas: mostrá-lo diria a uma escola que outra foi alcançada (tenancy-guardian, rodada 1 da revisão da spec: "incidente compartilhado revela outra escola"). O teste de isolamento confere que o id que A lê não é o do incidente | §3 (tabela `incidente_escola`), §4 (linha `GET incidentes`), §5 (bloco "Tarefa 9.0"); `cenarios.md` RF9 (bloco "Tarefa 9.0"); `docs/modelo-de-dados.md` ("O incidente de segurança"); `docs/lgpd.md` |
| O prazo fixo do incidente é uma chave nova, `registro_de_incidente`, a nona de `PRAZOS_FIXOS` (a Tech Spec só dizia "5 anos", e as outras tabelas de registro estão em `registro_de_decisao`) | `registro_de_decisao` diz, na tela de Retenção que a coordenação lê, "enquanto durar o contrato, e mais 5 anos": não descreve o incidente, que sai 5 anos depois do registro. A chave nova mostra o texto certo e não mexe nas outras. `ops:retencao` continua recusando todo prazo fixo (o teste do shared e o de integração percorrem `CHAVES_DE_PRAZO_FIXO`) | §3 (linha "prazo fixo, com quem aplica"); `docs/lgpd.md` (duas linhas do incidente); `packages/shared/src/privacidade/retencao.ts` |
| `IncidenteDaEscolaRepository` escreve na `incidente_escola` (a confirmação), e a Tech Spec o chamava de "só leitura" | `incidente_escola` tem `escola_id`: é tabela de tenant, e confirmar é `update … where confirmado_em is null` no escopo da escola. O que ele nunca faz é escrever em `incidente`, e o teste de arquitetura confere as escritas do arquivo (`.update(incidenteEscola)` e mais nenhuma) | §6 (bloco do `IncidenteDaEscolaRepository`); `apps/api/test/arquitetura.test.ts` |
| A medição das horas do incidente reaproveita o laço da medição do expurgo: nasce a base `MedicaoPorEscola`, e `MedicaoDoExpurgo` passa a herdá-la (mesma API pública e mesmo comportamento) | "Qual peça que já existe faz isto?": o laço de 5 min, a lista de escolas, o contexto de cada uma, a falha por escola, o encerramento no meio da volta e a exportação seriam copiados. Os 109 testes de `expurgo-da-escola.int.test.ts` passam sem mudar | §7c (linha "Métrica e alerta"); `apps/api/test/arquitetura.test.ts` (`QUEM_USA_A_ROTINA` ganha os dois arquivos novos) |
| O teste de permissão de `retencao.int.test.ts` percorre só as rotas `GET` de `/v1/privacidade`; a de escrita (`POST incidentes/:id/confirmar`) tem a permissão provada em `incidente.int.test.ts` | Para a coordenação, o `POST` com id sorteado responde 404, igual ao que a guarda devolve ao professor: o teste antigo (200 para a coordenação) não distingue os dois. O teste agora também afirma a lista exata das rotas de escrita, para a próxima que entrar não saia sem teste de permissão | `cenarios.md` RF9 (bloco "Tarefa 9.0"); `apps/api/test/retencao.int.test.ts` |
| Formato do arquivo do `ops:incidente`: JSON, de até 256 KB, com até 200 escolas | A Tech Spec dizia só "um arquivo com uma seção por escola" e o `Como testar` registrava "comando que lê arquivo: sem precedente" | §5 (bloco "Tarefa 9.0"); `README.md` (linha do comando) |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `incidente-da-escola.repository.ts` › daEscola › `where escola_id = contexto` | `incidente.int.test.ts` › isolamento, eliminação, lista de 50, confirmação |
| › daEscola › `order by (confirmado_em is not null)` (pendentes primeiro) | `incidente.int.test.ts` › lista de 50, confirmação |
| › daEscola › `desc(incidente.conhecido_em)` | `incidente.int.test.ts` › lista de 50, confirmação |
| › daEscola › `limit(50)` | `incidente.int.test.ts` › lista de 50 |
| › existe › `escola_id = contexto`; › existe › `id = $id` (duas mutações) | `incidente.int.test.ts` › isolamento (o id de B e o inexistente respondem igual) |
| › confirmar › `escola_id = contexto`; › `id = $id` (duas mutações) | `incidente.int.test.ts` › isolamento; confirmação |
| › confirmar › `confirmado_em is null` | `incidente.int.test.ts` › concorrência; confirmação (segunda chamada) |
| › confirmar › `confirmado_por = usuário da requisição` | `incidente.int.test.ts` › confirmação; concorrência; eliminação |
| › conhecidoEmDoPendenteMaisAntigo › `escola_id = contexto`; › `confirmado_em is null` (duas mutações) | `medicao-do-incidente.int.test.ts` › série por escola; B não aparece em A |
| `privacidade.service.ts` › confirmarIncidente › auditoria só `if (confirmar(id))` | `incidente.int.test.ts` › concorrência; confirmação |
| `privacidade.service.ts` › confirmarIncidente › `if (!existe(id)) throw NAO_ENCONTRADO` | `incidente.int.test.ts` › isolamento |
| `privacidade.controller.ts` › confirmarIncidente › `idDoCaminho(id)` (o `:id` que não é UUID) | `incidente.int.test.ts` › isolamento (id que não é id) |
| `privacidade.controller.ts` › confirmarIncidente › `lerEntrada(esquemaPedidoSemCorpo)` | `incidente.int.test.ts` › permissão (corpo a mais dá 400) |
| `ops/incidente.ts` › lerPedidoDeIncidente › `conhecidoEm > Date.now()` | `incidente.int.test.ts` › o arquivo e a escola |
| › lerPedidoDeIncidente › `new Set(escolaId).size !== secoes.length` | `incidente.int.test.ts` › o arquivo e a escola; normalização |
| › lerPedidoDeIncidente › `[...new Set(categorias)]` | `incidente.int.test.ts` › normalização |
| › lerPedidoDeIncidente › `escola.toLowerCase()` | `incidente.int.test.ts` › normalização |
| › esquemaTexto › `.regex(SEM_CONTROLE)`; › esquemaArquivo/esquemaSecao `strictObject` (duas); › `.max(MAXIMO_DE_ESCOLAS)`; › tamanho do arquivo (`stat`) | `incidente.int.test.ts` › o arquivo e a escola |
| › registrarIncidente › `nome === undefined → NAO_ENCONTRADO` | `incidente.int.test.ts` › o arquivo e a escola (desfaz a seção da que existe) |
| › registrarIncidente › `.some(citaOutraEscola)` e cada um dos três textos (três mutações) | `incidente.int.test.ts` › texto que cita outra escola (21 casos) |
| › registrarIncidente › `incidente.registrado` na auditoria | `incidente.int.test.ts` › registro |
| › citaOutraEscola › descartar a ocorrência do nome da outra que fica dentro do nome da própria | `incidente.test.ts` e `incidente.int.test.ts` › o nome da própria escola passa, também quando contém o da outra |
| › citaOutraEscola › a ocorrência do nome da outra que contém o da própria conta (não apagar o nome próprio do texto) | `incidente.test.ts` › curta citando a longa e "Alfa" contra "Escola Alfabeto"; `incidente.int.test.ts` › o nome da outra escola que contém o da própria é recusado |
| `incidente.ts` › esquemaArquivo › `z.iso.datetime({ offset: true })` | `incidente.int.test.ts` › conhecidoEm com fuso |
| `incidente.ts` › esquemaSecao › `.max(MAXIMO_DE_TITULARES_ESTIMADOS)` | `incidente.int.test.ts` › o arquivo e a escola (número acima do teto) |
| › citaOutraEscola › `id.replaceAll('-', '')` | `incidente.int.test.ts` › o id sem hífen |
| › citaOutraEscola › fronteira de palavra `(?<![\p{L}\p{N}])…(?![\p{L}\p{N}])` | `incidente.test.ts` › não casa no meio de uma palavra |
| `operacao-privacidade.repository.ts` › registrarIncidente › `conhecidoEm` gravado | `incidente.int.test.ts` › registro |
| `expurgo-de-acesso.repository.ts` › incidente › `years => 5` (prazo) | `expurgo-de-acesso.int.test.ts` › borda dos prazos |
| › incidente › `order by registrado_em` | `expurgo-de-acesso.int.test.ts` › lote ordenado (F3, 9.0) |
| › incidente › `for update skip locked` | `expurgo-de-acesso.int.test.ts` › skip locked (F3, 9.0) |
| `medicao-do-incidente.ts` › medirEscola › `/ MS_POR_HORA`; › `undefined` sem pendente (duas mutações) | `medicao-do-incidente.int.test.ts` › série por escola; série nova a cada volta |
| `montagem.ts` › `medicaoDoIncidente?.iniciar()` | `medicao-do-incidente.int.test.ts` › montada no worker de lote |
| `matriz.ts` › `privacidade_incidentes.confirmar` da coordenação | `matriz.test.ts` › cada célula está na expectativa |
| `classificacao.ts` › `incidente_escola` classificada | `arquitetura.test.ts` › a CLASSIFICACAO_DAS_TABELAS confere com as migrations |
| `montagem.ts` › `await medicaoDoIncidente?.encerrar()` | **sem teste**: o laço de 5 min não é injetável por `montarWorker`; o encerramento da classe tem teste (o do expurgo, `expurgo-da-escola.int.test.ts`, que a `MedicaoPorEscola` agora serve às duas) |
| `0031_incidente.sql` › cada check, o único e as FKs | não mutadas: nenhum teste roda migration; `incidente.int.test.ts` › "banco: recusa…" nomeia cada constraint pelo nome que o Postgres devolve, e a de categorias é comparada com o contrato |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | A mensagem `NAO_ENCONTRADO` do comando cita a posição da seção que falhou | `TODO.md`: muda a saída fixa `NAO_ENCONTRADO: escola não encontrada` que o teste afirma (contrato do comando); fica para quando houver operador reclamando |
| tenancy-guardian, infra-guardian, test-engineer (1ª) | `await medicaoDoIncidente?.encerrar()` em `montagem.ts` sem teste próprio | `TODO.md`: já declarada na tabela de Mutações; o teste exige o intervalo injetável em `montarWorker`, que é mudança de contrato do worker, fora desta tarefa |
| privacy-guardian (1ª) | Conferir que `incidente` e `incidente_escola` entram na troca de nome da eliminação | Tarefa 15.0 (eliminação no 8º dia): anotado em `TODO.md`, com a remissão à 15.0 |
| privacy-guardian (1ª) | Caso explícito do papel `rede` por HTTP em `incidente.int.test.ts` | Recusada: a rede ainda não tem usuário (F14), então não há token de rede para o teste; a matriz (`matriz.test.ts`) prova `nunca` para `privacidade_incidentes` |
| infra-guardian (1ª) | Migration com FK para `usuario` e `escola` só fora do horário letivo, com `lock_timeout` | `TODO.md`, junto dos índices `concurrently` pendentes |
| infra-guardian (1ª) | Juntar as medições do expurgo e do incidente numa volta só, se surgir a terceira | A tarefa que criar a terceira medição por escola; nada a fazer agora |
| revisor-geral (1ª) | Critério de conclusão do `9_task.md` ainda pede `--infra` | Recusada: é o texto do modelo de tarefa, e o portão da tarefa carimbado já rodou as suítes de infra do alerta; mudar o critério para acomodar a rodada não cabe ao Implementador |
| revisor-geral (1ª) | `test-engineer` sem rodada aprovada antes do commit | Não é item de código: a Mesa chama o `test-engineer` na rodada 2 |
| test-engineer (2ª) | A linha de mutação do controller descrevia a cláusula antiga | Aplicada: a linha cita `idDoCaminho(id)` |
| test-engineer (2ª), tenancy-guardian (2ª) | Casos de unidade que fixam: duas escolas com o mesmo nome; "Escola Alfa" contra "Alfa Norte" num texto "Escola Alfa Norte"; nome da própria com fronteira quebrada ("Colégio Ametista Nortex") | `TODO.md` (teste de borda do `citaOutraEscola`): o comportamento hoje é o lado seguro (recusa), documentado no comentário da função |
| revisor-geral (2ª) | O caso "Alfa" contra "Escola Alfabeto" só na unidade, não na integração | Recusada: a função é pura, a unidade falha sem a fronteira de palavra, e a ligação com o comando está provada pelo caso Ametista na integração |
| revisor-geral (2ª) | Auxiliar que devolva o intervalo `{ ini, fim }` de cada ocorrência, no lugar do `?? 0` repetido | Recusada: refatoração de estilo, sem mudança de comportamento, que caducaria os cinco revisores |
| infra-guardian (2ª) | Chave de idempotência opcional no JSON do `ops:incidente` | `/retro` da funcionalidade; hoje o runbook e o README avisam |
| privacy-guardian (2ª) | Citar no runbook o caso em que a escola longa escreve o próprio nome inteiro e a curta fica "dentro" dele | Recusada nesta rodada: o parágrafo "Ao registrar o incidente" já manda ler cada seção como a coordenação da escola dela; o caso fica no `/validar` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-09 14:18:30 | 2026-10-09 14:21:04 | `test-engineer` | 1 | REPROVADO | a271b0512d1d47ca0 |
| 2026-10-09 14:21:21 | 2026-10-09 14:22:05 | `tenancy-guardian` | 1 | APROVADO | ab9cc8624eed35681 |
| 2026-10-09 14:21:27 | 2026-10-09 14:22:33 | `privacy-guardian` | 1 | APROVADO | af2ac0b0a04cbf73d |
| 2026-10-09 14:21:32 | 2026-10-09 14:22:39 | `infra-guardian` | 1 | APROVADO | aa1acc3e40ab5257f |
| 2026-10-09 14:21:15 | 2026-10-09 14:22:55 | `revisor-geral` | 1 | REPROVADO | a788e2ed2d9da0e85 |
| 2026-10-09 14:34:12 | 2026-10-09 14:35:53 | `test-engineer` | 2 | APROVADO | ad3acb24778c2a4d5 |
| 2026-10-09 14:36:21 | 2026-10-09 14:36:43 | `tenancy-guardian` | 2 | APROVADO | a7546b56d51687b29 |
| 2026-10-09 14:36:13 | 2026-10-09 14:36:51 | `revisor-geral` | 2 | APROVADO | af0b957df2cf4d088 |
| 2026-10-09 14:36:38 | 2026-10-09 14:36:59 | `infra-guardian` | 2 | APROVADO | a93d64c90a21f10d0 |
| 2026-10-09 14:36:30 | 2026-10-09 14:36:59 | `privacy-guardian` | 2 | APROVADO | a0e78b803c8c1fabf |
