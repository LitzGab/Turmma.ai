# Tarefa 2.0 — A retenção da escola existe e a operação a ajusta por comando

**Funcionalidade:** lgpd-e-titular · **Depende de:** 1.0 · **Paralelo com:** 7.0, 8.0, 9.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Cada escola tem um prazo por categoria do catálogo, a operação ajusta por `ops:retencao` dentro de piso, teto e travas, com auditoria, e a coordenação lê a retenção vigente por `GET /v1/privacidade/retencao`.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (catálogo, travas, classificação, colunas fora do arquivo), 4 (`GET retencao`) e 6
- `.claude/rules/20-lgpd-menores.md` itens 1 e 16
- `docs/lgpd.md` seção 2 (o mapa inteiro)
- Código: `apps/api/src/ops/comando.ts` e `escola.ts` (modelo de comando), `packages/nucleo/src/configuracao/*` (padrão de configuração por escola), `apps/api/test/arquitetura.test.ts`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 2.1 — `packages/shared/src/privacidade`: `CATEGORIAS_DE_RETENCAO`, `PRAZOS_FIXOS`, `CLASSIFICACAO_DAS_TABELAS` (com "entra no arquivo" e a coluna de ligação), `COLUNAS_FORA_DO_ARQUIVO` (inclui `mfa_ultimo_passo` e `mfa_chave_versao`), erro `RETENCAO_FORA_DO_LIMITE`
- [x] 2.2 — Migration própria: `retencao_escola`
- [x] 2.3 — `RetencaoDaEscolaRepository` (escopo do contexto) e prazo efetivo com as travas
- [x] 2.4 — `ops:retencao` (ajustar, listar), abrindo o contexto da escola; auditoria `retencao.ajustada`
- [x] 2.5 — Módulo `apps/api/src/privacidade` com `GET retencao` (coordenação, MFA) e DTO explícito
- [x] 2.6 — Teste de arquitetura da classificação; `docs/lgpd.md` (linhas do apelido do operador e retenção de `correcao.destaque_aberto_por`), `docs/modelo-de-dados.md`
- [x] 2.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/privacidade/*` | novo |
| migration e schema `retencao_escola` | novo |
| `packages/nucleo/src/retencao/retencao-da-escola.repository.ts` | novo |
| `apps/api/src/ops/retencao.ts` | novo |
| `apps/api/src/privacidade/*` (módulo, controller, service, DTO) | novo |
| `apps/api/test/arquitetura.test.ts` | alterado |
| `docs/lgpd.md`, `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| escola nova | integração | todas as categorias com origem "padrão" |
| tabela de migration fora da classificação; coluna proibida inexistente; tabela sem "entra no arquivo" | unidade | o teste de arquitetura falha |
| piso exato aceito, piso − 1 e acima do teto recusados | integração | `RETENCAO_FORA_DO_LIMITE` |
| categoria fixa | integração | recusada |
| travas: `texto_do_modelo` > `conversa_professor` e `consumo_por_aluno` > `conversa_tutor` | integração | recusadas; baixar a categoria-mãe é aceito |
| auditoria | integração | `retencao.ajustada` com operador e referência; o `GET` mostra a origem ajustada |
| isolamento: ajuste em A | integração | não muda o `GET retencao` de B |
| permissão | integração | aluno, professor e coordenação sem MFA não chegam; o teste percorre as rotas de `/v1/privacidade` e falha com lista vazia |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O expurgo (3.0 a 5.0) e a tela (6.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| `retencao_escola.referencia_contrato` é **inteiro positivo** (o número do contrato ou do aditivo, `--contrato`), e não texto até 200 caracteres | o cenário pede a referência na auditoria (`retencao.ajustada`), e a auditoria não aceita texto livre: `problemasDoMapaDeAcoes` recusa `z.string()` sem formato de id ou data no carregamento do módulo (regra 20, item 10; F1). Mudar a auditoria seria mudar regra; o número segue o precedente do `--pedido` do `ops:redefinir-mfa` (`pedidoDoOperador`) | `techspec.md` §3 (bloco das migrations); `cenarios.md` RF2; `docs/modelo-de-dados.md` ("Comunicação, conta e conformidade"); `docs/lgpd.md` (linha do apelido do operador) |
| `CLASSIFICACAO_DAS_TABELAS` e `COLUNAS_FORA_DO_ARQUIVO` trazem só as tabelas e colunas que já existem; as do pedido, do arquivo, do suboperador, do incidente e do expurgo (e a `chave_objeto` e a `chave_envio` do pedido) entram com a migration de cada uma | o teste de arquitetura confere a lista contra as migrations nos dois sentidos, como o cenário pede ("tabela fora da classificação" e "coluna proibida inexistente" falham); classificar tabela que ainda não existe deixaria o teste vermelho | `techspec.md` §3 (parágrafo antes de "Cada tabela da classificação") |
| `ops:retencao ajustar` trava a escola com `select … for no key update` no começo da transação | dois ajustes da mesma escola ao mesmo tempo leriam o mesmo "antes" e gravariam auditorias que não encadeiam; a trava os põe em fila, e não briga com as FKs que apontam para a escola (`for key share`) | `techspec.md` §7c (Corridas); `cenarios.md` RF2 (cenário [P]) |
| `GET retencao` traz também `contaDe` e `limitadaPor` (a categoria cuja trava encurtou o prazo); os prazos fixos são oito grupos (`PRAZOS_FIXOS`), com descrição e prazo em texto comum | a tela da 6.0 precisa dizer de quando o prazo conta e por que o prazo efetivo é menor que o ajuste; os prazos fixos têm unidades diferentes (6 meses, 30 dias, vigência + 5 anos) | `techspec.md` §4 (`GET retencao`) e §3 (grupos dos prazos fixos) |
| `apps/api/src/ops/escola.repository.test.ts`: a busca de quem importa o `RedeEEscolaRepository` passou de `/escola\.repository/` para `/[/'"]escola\.repository\b/` | o nome `retencao-da-escola.repository` (o arquivo que a tarefa prevê) terminava em `escola.repository` e caía na busca, que quer o caminho `./escola.repository`; o teste continua pegando quem importa o arquivo do operador | nenhuma: é o teste da A0b, e a regra dele não muda |
| `retencao.ajustada`: entidade `retencao_escola`, `entidadeId` = id da escola, `antes` = `{ meses, origem }`, `depois` = `{ categoria, meses, referenciaContrato }`, finalidade fixa `contrato_da_escola` | a auditoria exige uuid em `entidadeId`, e a linha não tem id próprio (a chave é escola + categoria); a seção 7 pede finalidade fixa | `techspec.md` §7 (O que entra em auditoria) |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `packages/shared/src/privacidade/retencao.ts` › `ajusteDeRetencaoCabe` › `chave === undefined` (devolvendo `true`) | `retencao.test.ts` › "prazo fixo, nome fora do catálogo e mês fracionado nunca cabem" |
| `retencao.ts` › `ajusteDeRetencaoCabe` › `!Number.isInteger(meses)` | `retencao.test.ts` › "prazo fixo, nome fora do catálogo e mês fracionado nunca cabem" |
| `retencao.ts` › `ajusteDeRetencaoCabe` › `meses < piso` | `retencao.test.ts` › "o piso e o teto exatos cabem…" |
| `retencao.ts` › `ajusteDeRetencaoCabe` › `meses > teto` | `retencao.test.ts` › "o piso e o teto exatos cabem…" |
| `retencao.ts` › `ajusteDeRetencaoCabe` › `if (mae === undefined) return true` (trocado por `false`) | `retencao.test.ts` › "as travas são as três da Tech Spec…", "o piso e o teto exatos cabem…", "baixar a mãe…" |
| `retencao.ts` › `ajusteDeRetencaoCabe` › `meses <= mesesProprios(mae, …)` (trocado por `true`) | `retencao.test.ts` › "a travada acima da mãe (ajustada ou no padrão) não cabe…" |
| `retencao.ts` › `retencaoDaEscola` › `daMae < proprio` (trocado por `<=`) | `retencao.test.ts` › "sem ajuste, todas as categorias no padrão…" e "a mãe igual à travada não conta como trava" |
| `retencao.ts` › `retencaoDaEscola` › `limitada` (trocado por `false`) | `retencao.test.ts` › "a mãe abaixo da travada encurta a travada…" |
| `retencao.ts` › `retencaoDaEscola` › `porCategoria.has(categoria) ? 'ajustada' : 'padrao'` (sempre `padrao`) | `retencao.test.ts` › "o ajuste vale só na categoria dele…" e "a mãe abaixo da travada…" |
| `packages/nucleo/src/retencao/retencao-da-escola.repository.ts` › `ajustes` › `eq(retencaoEscola.escolaId, exigirEscolaDoContexto())` | `retencao.int.test.ts` › "isolamento: o ajuste em A não muda o GET de B…" (e RF1, RF2, travas, auditoria) |
| `retencao-da-escola.repository.ts` › `travarEscola` › `linhas.length > 0` (sempre `true`) | `retencao.int.test.ts` › "escola inexistente: ajustar e listar dão NAO_ENCONTRADO…" |
| `retencao-da-escola.repository.ts` › `travarEscola` › `.for('no key update')` | `retencao.int.test.ts` › "concorrência: dois ajustes da mesma escola passam um de cada vez…" (pela espera) e "concorrência: baixar a mãe e subir a travada ao mesmo tempo…" (pelo efeito: sem a trava, `texto_do_modelo` 12 sai com código 0, gravado acima da mãe em 3) |
| `retencao-da-escola.repository.ts` › `gravar` › `set: { meses: ajuste.meses, … }` | `retencao.int.test.ts` › RF2 piso/teto, auditoria e concorrência |
| `retencao-da-escola.repository.ts` › `gravar` › `set: { …, referenciaContrato: ajuste.referenciaContrato, … }` | `retencao.int.test.ts` › "RF2, auditoria…" |
| `apps/api/src/ops/retencao.ts` › `ajustarRetencao` › `!(await repositorio.travarEscola())` → `NAO_ENCONTRADO` | `retencao.int.test.ts` › "escola inexistente…" |
| `ops/retencao.ts` › `ajustarRetencao` › `!ajusteDeRetencaoCabe(categoria, pedido.meses, ajustes)` | `retencao.int.test.ts` › "RF2: o piso exato é aceito…" e "RF2, travas: texto_do_modelo acima…" |
| `ops/retencao.ts` › `ajustarRetencao` › `categoria === undefined` | sem ela o typecheck falha (`ajusteDeRetencaoCabe` e `CATEGORIAS_DE_RETENCAO[categoria]` exigem a categoria do catálogo); o efeito (prazo fixo recusado) é provado pela linha `CATEGORIAS_ACEITAS` abaixo |
| `ops/retencao.ts` › `ajustarRetencao` › `anterior === undefined ? { …'padrao' } : { …'ajustada' }` | `retencao.int.test.ts` › "RF2, auditoria…" e "concorrência…" |
| `ops/retencao.ts` › `ajustarRetencao` › `const autorOperador = await autor(tx)` (trocado por um apelido fixo) | `retencao.int.test.ts` › "RF2, auditoria…"  e `ops-operador.int.test.ts` › C2 › "ops:retencao ajustar" (trocado por `'ana'`, sem conferir: `ninguem` e o desativado `bruno` passam) |
| `ops/retencao.ts` › `listarRetencao` › `await autor(tx)` (apagado) | `ops-operador.int.test.ts` › C2 › "ops:retencao listar" |
| `ops/retencao.ts` › `executarOpsRetencao` › `autorDoComando(operador)` (trocado por `async () => operador`) | `ops-operador.int.test.ts` › C2 › "ops:retencao ajustar" e "ops:retencao listar" (o `OPERADOR` inexistente ou desativado sai com código 0 e grava o ajuste) |
| `ops/retencao.ts` › `listarRetencao` › `nome() === undefined` → `NAO_ENCONTRADO` | `retencao.int.test.ts` › "escola inexistente…" |
| `ops/retencao.ts` › `CATEGORIAS_ACEITAS` › `...CHAVES_DE_PRAZO_FIXO` | `retencao.int.test.ts` › "RF2: as categorias fixas… são recusadas com RETENCAO_FORA_DO_LIMITE" (sem elas, sai 2 de argumento) |
| `ops/retencao.ts` › `lerPedidoDeRetencao` › `!CATEGORIAS_ACEITAS.includes(valores.categoria)` | `retencao.int.test.ts` › "sem OPERADOR, ou com argumento fora do formato…" |
| `ops/retencao.ts` › `lerPedidoDeRetencao` › `!MESES.test(valores.meses)` | idem |
| `ops/retencao.ts` › `lerPedidoDeRetencao` › `!CONTRATO.test(valores.contrato)` | idem |
| `ops/retencao.ts` › `lerPedidoDeRetencao` › `valores.categoria !== undefined \|\| valores.meses !== undefined \|\| valores.contrato !== undefined` (no `listar`) | idem |
| `ops/retencao.ts` › `lerPedidoDeRetencao` › `comando !== 'listar' && comando !== 'ajustar'` | idem |
| `ops/retencao.ts` › `lerPedidoDeRetencao` › `!escola.success` | idem |
| `apps/api/src/privacidade/privacidade.controller.ts` › `retencao` › `@Header('Cache-Control', 'no-store')` | `retencao.int.test.ts` › "RF1: a escola recém-criada…" |
| `privacidade.controller.ts` › `retencao` › `@Permite('privacidade_retencao', 'ler')` | a API não sobe (rota autenticada sem célula): todos os testes de `retencao.int.test.ts` |
| `packages/shared/src/permissao/matriz.ts` › `MATRIZ.professor.privacidade_retencao` (`nunca` trocado por `unidade`) | `retencao.int.test.ts` › "permissão: aluno, professor e a coordenação sem MFA…" (e `matriz.test.ts`, pela expectativa) |
| `packages/nucleo/drizzle/0024_retencao_escola.sql` › `retencao_escola_meses_validos` | `retencao.int.test.ts` › "banco: recusa, por fora do comando…" (com `EDUCA_BANCO_NOVO=1`) |
| `0024_retencao_escola.sql` › `retencao_escola_referencia_positiva` | idem |
| `0024_retencao_escola.sql` › `retencao_escola_alterada_por_formato` | idem, e `formato-do-operador.int.test.ts` |
| `0024_retencao_escola.sql` › `retencao_escola_categoria_valida` | idem, e "banco: o check de categoria… tem exatamente as categorias do catálogo" |
| `packages/shared/src/privacidade/classificacao.ts` › `CLASSIFICACAO_DAS_TABELAS` › sem `retencao_escola`; com `pedido_titular` a mais; `mensagem_tutor` ligado por `usuario_id` | `arquitetura.test.ts` › "a CLASSIFICACAO_DAS_TABELAS confere com as migrations…" |
| `classificacao.ts` › `CLASSIFICACAO_DAS_TABELAS` › `sinal_tutor` com a categoria `conversa_tutor` | `arquitetura.test.ts` › "toda categoria do catálogo tem ao menos uma tabela" |
| `classificacao.ts` › `COLUNAS_FORA_DO_ARQUIVO` › sem `conta.mfa_ultimo_passo`; sem `conta.mfa_chave_versao` | `arquitetura.test.ts` › "a CLASSIFICACAO_DAS_TABELAS confere com as migrations…" |
| `apps/api/test/arquitetura.test.ts` › `problemasDaClassificacao` › tabela sem classificação; classificada e inexistente; sem "entra no arquivo" | `arquitetura.test.ts` › "reprova a tabela de migration fora da classificação…" |
| `arquitetura.test.ts` › `problemasDaClassificacao` › classe desconhecida; sem pessoa no arquivo; ligação vazia; ligação inexistente; coluna fora do arquivo inexistente; segredo fora da lista (`NOME_DE_SEGREDO`) | `arquitetura.test.ts` › "reprova a ligação que falta ou não existe…" |
| `arquitetura.test.ts` › `colunasDasTabelas` › `ADD`, `DROP` e `RENAME COLUMN`, `RENAME TO`, `DROP TABLE`, `PALAVRAS_DE_RESTRICAO`, a vírgula de fora dos parênteses em `itensDoCorpo` | `arquitetura.test.ts` › "a leitura das colunas segue o ALTER…" e "a leitura das colunas enxerga as migrations…" |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `test-engineer`, 1ª | Incluir uma sessão de rede no teste de permissão de `/v1/privacidade` | recusada: a rede ainda não tem usuário nem sessão (`PAPEIS_DE_USUARIO` só tem coordenador, professor e aluno; a rede entra no F14), então não há token de rede para mandar. O `nunca` da rede fica provado pela expectativa da matriz (`matriz.expectativa.ts`); o comentário do controller passou a dizer isso, em vez de afirmar que a rede recebe a resposta do inexistente |
| `revisor-geral`, 1ª | Um formato só para a saída do `ops:retencao` (`listar` imprime `{ categorias }`, `ajustar` a categoria solta) | recusada: são respostas diferentes. O `ajustar` devolve o prazo efetivo da categoria que mudou, que é o que o operador confere depois de ajustar; o `listar` devolve a escola inteira. Os dois são JSON de uma linha, legíveis por script |
| `revisor-geral`, 1ª | Alinhar o texto de "quem aplica" de `operador` e `codigo_recuperacao_operador` com a Tech Spec §3 ("A0 e `sistema.expurgar-acesso`") | recusada: a linha da Tech Spec resume o grupo inteiro da equipe Turmma; o texto de cada tabela segue o `docs/lgpd.md`, que é mais exato (a conta do operador é limpa na desativação, e cada código de recuperação sai ao ser usado; quem passa pelo `sistema.expurgar-acesso` são o convite, a sessão e o acesso à operação, e esses dizem isso) |
| `privacy-guardian`, 1ª | A ligação ao aluno por caminho em jsonb (`auditoria.depois.alunoId` da decisão da reivindicação; o aluno do destaque na `validacao_do_lote`), que a ligação por coluna não alcança | destino: tarefa 13.0 (arquivo do titular, que lê `classificacao.ts`): estender o tipo da ligação ou registrar a divergência com o `docs/lgpd.md`. A Tech Spec §3 desta tarefa diz "a auditoria em que ele é autor" |
| `privacy-guardian`, 1ª | No arquivo do professor, a ligação por `correcao.destaque_aberto_por`, `reivindicacao.decidida_por` e `validacao_do_lote.confirmada_por` mostra só o ato e a data dele, nunca a linha do aluno | destino: tarefa 13.0, que monta o arquivo |
| `privacy-guardian`, 1ª | Decidir se as datas de `convite.usuario_id` e `acesso_turma.criado_por` entram no arquivo do titular | destino: tarefa 13.0; a classificação desta tarefa segue a lista da Tech Spec §3, que não as põe no arquivo |
| `privacy-guardian`, 1ª | Sentinela no teste de arquitetura: tabela fora do arquivo com coluna de pessoa (`*_por`, `usuario_id`, `aluno_id`) | destino: tarefa 13.0: a sentinela depende da decisão do item anterior (hoje `convite` e `acesso_turma` a acionariam), e precisa de uma lista de exceções que é dela |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-05 19:49:50 | 2026-10-05 19:51:33 | `test-engineer` | 1 | REPROVADO | ad516fe45ea22e560 |
| 2026-10-05 20:46:52 | 2026-10-05 20:47:43 | `test-engineer` | 2 | APROVADO | a37100383754dd05f |
| 2026-10-05 20:48:12 | 2026-10-05 20:48:53 | `tenancy-guardian` | 1 | APROVADO | a7deb6d2419d75ed8 |
| 2026-10-05 20:48:06 | 2026-10-05 20:49:48 | `revisor-geral` | 1 | APROVADO | a849727b90330ed45 |
| 2026-10-05 20:48:18 | 2026-10-05 20:50:20 | `privacy-guardian` | 1 | APROVADO | a98e018cf81655866 |
| 2026-10-05 21:05:00 | 2026-10-05 21:05:30 | `test-engineer` | 3 | APROVADO | a9f251cb1931ced88 |
| 2026-10-05 21:05:46 | 2026-10-05 21:06:04 | `revisor-geral` | 2 | APROVADO | afaee672d6b2b294e |
| 2026-10-05 21:05:53 | 2026-10-05 21:06:09 | `tenancy-guardian` | 2 | APROVADO | a246158e748028db3 |
| 2026-10-05 21:06:01 | 2026-10-05 21:06:20 | `privacy-guardian` | 2 | APROVADO | aa91b976ec2abb38e |
