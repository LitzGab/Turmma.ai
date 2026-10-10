# Tarefa 12.0 — O pedido guarda por quais empresas o dado do titular passou

**Funcionalidade:** lgpd-e-titular · **Depende de:** 7.0, 8.0, 11.0 · **Paralelo com:** 13.0, 14.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `llm-integrator`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A foto do compartilhamento é gravada no registro do pedido: o aluno pelo rastro com `provedor`, o professor só por período, com reserva por período e "provedor não cadastrado".

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 5 ("Compartilhamento", com "O período é o do titular na escola": triagem de 09/10 da lacuna da 8.0) e 6 (`SuboperadorDaEscolaRepository`)
- D64; LGPD art. 18, VII e § 6º
- Código: `consumo_ia`, `execucao_agente`, os repositórios da 8.0
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 12.1 — `Compartilhamento` em `packages/nucleo/src/titular`, chamável pela API e pelo worker
- [x] 12.2 — Gravado no `POST pedidos` e devolvido no detalhe
- [x] 12.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/titular/compartilhamento.ts` | novo |
| `packages/nucleo/src/titular/compartilhamento.repository.ts` | novo |
| `privacidade` service | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| escopo | integração | chave de suboperador só de B aparece como "não cadastrado" em A; reserva não lista o de B |
| com e sem `provedor` | integração | agrupa por provedor; linhas antigas pela reserva |
| rastro expirado | integração | depois de 12 meses, lista os do período do titular; o `todas` encerrado antes de o aluno entrar fica fora, e `primeiroEm` não é anterior à entrada |
| D64 | integração | dois professores, um que usou e outro não: foto e detalhe iguais |
| mesma conta | integração | consumo feito em B não entra na foto de A |
| sem uso e vigência | integração | aluno sem uso: só hospedagem; provedor fora da vigência não casa |

## Como testar

- Molde da escola e do consumo: `apps/worker/test/expurgo-da-escola.int.test.ts` (`escolaNova`, `consumo`, `execucaoDoTutor`, `professorNovo`), que grava `consumo_ia` com `em` no passado; a soma que não muda em `› o que fica: a execução, as sete FKs…`.
- **escopo:** o teste de isolamento do `SuboperadorDaEscolaRepository`, que a 8.0 cria: copie de lá a montagem dos dois suboperadores.
- **D64:** `apps/api/src/governanca/governanca.int.test.ts › a série com um professor só com entrega fica fora da lista…`; aqui, a foto e o detalhe dos dois professores comparados com `toEqual`.
- **mesma conta:** `BancadaDeSessoes.sessaoDaMesmaConta` (`apps/api/test/sessao-de-teste.ts`).
- Rastro expirado e vigência: sem precedente; o relógio é injetado, como o `relogioEm` do arquivo do worker. `escolaNova` cria o aluno sem credencial: insira `credencial_matricula` com `criada_em` no passado, senão o período anterior ao rastro é vazio.
- Armadilha da 8.0: `suboperador` é global e o banco acumula; chave aleatória por teste.
- Rodar: `npx vitest run --project integracao <arquivo>`.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O refazer antes de anonimizar (15.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| "A hospedagem aparece sempre" sem dizer qual empresa é a hospedagem: a foto trata o `alcance = 'todas'` (a empresa que atende toda escola) como hospedagem, que sempre aparece, e o `lista` como a contratada, que entra pelo rastro ou pela reserva | O modelo não tem outra marca de hospedagem, e é o `alcance` que separa as duas (`packages/shared/src/privacidade/suboperador.ts`; `ops:suboperador`) | `techspec.md` §5, "Compartilhamento" ("A hospedagem aparece sempre") |
| A reserva lista **as demais empresas da escola** (as de `lista`), e a linha do `todas` não se repete nela | A spec separa "os suboperadores de IA" de "a hospedagem" e não diz como o código distingue os dois; com a distinção acima, "os suboperadores de IA da escola" são as contratadas | `techspec.md` §5 ("As linhas antigas sem `provedor` e o período anterior ao prazo (rastro expirado) somam os suboperadores de IA da escola vigentes no período") |
| O gatilho da reserva e o titular sem data de entrada: a reserva entra pelas linhas antigas sem `provedor`, pela entrada anterior ao horizonte do rastro, e sempre no professor; sem nenhuma das datas de entrada, o período começa no horizonte e a reserva só pelas linhas antigas | A spec diz o que somam as linhas antigas e o período expirado, mas não o gatilho em código nem o que acontece com o titular sem credencial nem conta externa | `techspec.md` §5 ("As linhas antigas…"; "O aluno sem nenhuma das duas datas não tem período anterior ao rastro") |
| O horizonte do rastro é o prazo de `consumo_por_aluno` da escola | "o período anterior ao prazo" não nomeia o prazo; é o da categoria que `docs/lgpd.md` liga à lista de compartilhamento | `techspec.md` §5; `docs/lgpd.md`, linha "Consumo de IA por aluno" |
| O fim do período do titular aberto é o fim do dia de uso (São Paulo), e o do vínculo encerrado é o `encerrado_em` | A foto devolve instante: sem o dia, dois pedidos do mesmo dia levam minutos diferentes e o D64 ("foto e detalhe iguais", com `toEqual`) não fecha | `techspec.md` §5 ("O período é o do titular na escola"); `cenarios.md` RF13, D64 |
| No rastro, o mesmo `provedor` que casa com dois suboperadores (a chave encerrada e recadastrada) rende duas linhas, uma por empresa | A spec manda casar pela data da chamada e agrupar por `provedor`, sem dizer o que fazer quando o grupo casa com mais de uma empresa | `techspec.md` §5 ("agrupado por `provedor` e casado com a `chave` vigente no período"; "a `chave` casa com o suboperador vigente na data da chamada") |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `packages/nucleo/src/titular/compartilhamento.ts` › `doTitular` › o rastro só do aluno (`alvo.papel === 'aluno' ? … : []`) | D64 |
| › `doTitular` › gatilho da reserva: `alvo.papel === 'professor'` | D64 |
| › `doTitular` › gatilho da reserva: `rastro.some((chamada) => chamada.provedor === null)` | com e sem `provedor` |
| › `doTitular` › gatilho da reserva: `periodo.entradaConhecida && periodo.inicio < horizonte` | rastro expirado |
| › `doTitular` › a hospedagem (`alcance = 'todas'`) entra sem reserva | sem uso e vigência |
| › `#intersecao` › a interseção vazia não entra (`primeiroEm >= ultimoEm`) | rastro expirado (o `todas` encerrado antes de o aluno entrar) |
| › `#intersecao` › `primeiroEm` é o mais tarde entre a vigência e a entrada do titular | rastro expirado |
| › `#intersecao` › `ultimoEm` é o mais cedo entre o `fim` do suboperador e o fim do período | D64 (o professor que saiu, com a empresa que encerrou depois dele) |
| › `#linhasDoRastro` › `primeiroEm` recortado na entrada do titular | com e sem `provedor` |
| › `#vigenteEm` › o início (`suboperador.inicio <= em`) | sem uso e vigência (o provedor fora da vigência) |
| › `#vigenteEm` › o fim (`suboperador.fim === null \|\| em < suboperador.fim`) | chave recadastrada |
| › `#linhasDoRastro` › a chave do grupo inclui o suboperador (`${provedor}/${casa?.id}`) | chave recadastrada |
| › `#linhasDoRastro` › o grupo todo anterior à entrada não entra (`primeiroEm > ultimoEm`) | com e sem `provedor` |
| › `#linhasDoRastro` › sem casa, `suboperadorId: null` ("não cadastrado") | escopo |
| › `#linhasDoRastro` › `ultimoEm` do grupo é o mais tardio das chamadas | com e sem `provedor` |
| › `#linhasDoRastro` › uma linha por (`provedor`, suboperador), e não por chamada | com e sem `provedor` (e escopo e sem uso) |
| `packages/nucleo/src/titular/compartilhamento.repository.ts` › `datasDeReferencia` › o fim do dia é o do fuso do uso (`::timestamp at time zone`), não o da sessão | fim do dia |
| › `rastroDoAluno` › `eq(consumoIa.envioExterno, true)` | sem uso e vigência (o uso local não vira reserva) |
| › `rastroDoAluno` › atribuição por `consumo_ia.aluno_id` | escopo, com e sem `provedor`, rastro expirado, sem uso e vigência |
| › `rastroDoAluno` › atribuição pela execução que o titular pediu | com e sem `provedor` |
| › `#periodoDoTitular` › o vínculo aberto segue até o fim do dia, o encerrado até o `encerrado_em` | D64 (o professor que saiu) |
| › `#periodoDoTitular` › o vínculo aberto vence o encerrado (`abertos > 0`) | professor com dois vínculos |
| › `#periodoDoTitular` › sem data de entrada o período começa no horizonte (`entrada ?? horizonte`) | sem data de entrada |
| › `entradaDoProfessor` › o `criado_em` mais antigo (`min`) | professor com dois vínculos |
| › `entradaDoAluno` › a entrada é a mais antiga entre a conta externa e a credencial (`least`) | rastro expirado |
| › `doTitular` › o instante é o do relógio injetado (`this.relogio.agora()`), e não o do sistema | rastro expirado (a foto com o relógio vinte meses atrás não tem reserva) |
| `apps/api/src/privacidade/pedidos.repository.ts` › `registrar` › `compartilhamento: pedido.compartilhamento` | os seis (a foto nascia vazia) |

**Equivalentes declarados** (rodados sem vermelho, e por quê): o `escolaId` do rastro e das consultas de período
(`eq(consumoIa.escolaId, escolaId)`, `eq(execucaoAgente.escolaId, escolaId)`) — as FKs compostas
(`consumo_ia_aluno_da_escola_fk`, `consumo_ia_execucao_da_escola_fk`, `execucao_agente_solicitada_por_da_escola_fk`,
`credencial_matricula_usuario_da_escola_fk`, `vinculo_usuario_da_escola_fk`) já impedem que a linha de outra escola
aponte para o titular, e o cenário "mesma conta" guarda o resultado e a armadilha de quem buscar o titular pela `conta`;
`#vigenteEm` com `em < fim` (o `fim` é exclusivo) — o igual também fica fora, como na correção da 8.0, e não dá para
pousar uma chamada exatamente no instante do `fim`; `grupo.primeiroEm` atualizado a cada chamada — com o `order by em`
da consulta, a primeira do grupo já é o mínimo (rodado: o teste fica verde sem ela);
`› doTitular › periodo.entradaConhecida && (gatilho da reserva)`: redundante enquanto o período sem entrada começa no
horizonte (`inicio = horizonte`, e `inicio < horizonte` é falso);
`› #linhasDoRastro › maisCedo(grupo.ultimoEm, periodo.fim)`: o rastro é só do aluno, cujo fim é o fim do dia de `agora`,
e a chamada não é posterior a `agora`.

`D64 › os dois POST do mesmo dia de uso`: o `toEqual` de foto e detalhe depende de os dois pedidos caírem no mesmo dia
de São Paulo; a janela é de milissegundos, uma vez por dia, às 03:00 UTC, e o relógio do `POST pedidos` é o do sistema
(o `Compartilhamento` aceita relógio injetado, o service não o repassa).

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª, bloqueante 3); llm-integrator (1ª) | Índice `consumo_ia (escola_id, execucao_id)` e consulta do rastro em `union all` de dois ramos indexados, com `infra-guardian` marcado na tarefa | tarefa 13.0; techspec.md seção 5, O índice do rastro |
| tenancy-guardian (1ª); revisor-geral (1ª); llm-integrator (1ª) | A foto é calculada antes do `insert … on conflict`, e jogada fora no reenvio idempotente | Recusada: a foto é um valor do próprio `insert` (`PedidosRepository.registrar`); calculá-la depois pede um `update` e abre uma janela com pedido sem foto. O reenvio idempotente é o caso raro, e a consulta é de leitura |
| llm-integrator (1ª) | Decidir entre descartar e recortar o grupo do rastro que cai todo antes da entrada | Recusada: a Tech Spec §5 já decide ("nenhuma data da foto é anterior à entrada dele"); o teste do item 6 fixa a escolha |
| llm-integrator (1ª); privacy-guardian (1ª) | `throw new Error` cru na invariante das datas de referência | Recusada: ramo inalcançável, sem dado, não chega ao cliente; mesmo motivo da recusa de `papelDeTitular` na 11.0 |
| revisor-geral (1ª) | O `todas` que também aparece no rastro gera duas linhas da mesma empresa (`rastro` e `periodo`) | `/validar` (RF13): decidir se é intencional e dizê-lo na §5; o texto depende de decisão de desenho |
| test-engineer (1ª); privacy-guardian (1ª); revisor-geral (1ª) | O fim do período do aluno é sempre hoje, também para o transferido ou desativado | `/validar` (RF13): a Tech Spec não trata da saída do aluno, e o dado segue vivo na hospedagem até a eliminação |
| test-engineer (1ª); privacy-guardian (1ª) | "Eliminação concluída ainda devolve o provedor" e "foto refeita antes de anonimizar" | tarefa 15.0 (já em "Fora do escopo desta tarefa") |
| privacy-guardian (1ª) | `apagarCredencialDaMatricula` e `apagarContaExterna` apagam as datas de entrada: a foto precisa ser refeita antes | tarefa 15.0 |
| privacy-guardian (1ª) | `docs/lgpd.md`, linha "Pedido do titular": dizer que a foto guarda por 5 anos a primeira e a última data de envio externo | tarefa 15.0, que mexe na retenção da foto e no mapa de dados do expurgo; `docs/lgpd.md` não é arquivo desta tarefa |
| conformidade-reviewer (1ª) | A tela do detalhe diz "por onde o dado passou", e não "quando o aluno usou" | tarefa 16.0 (a tela dos pedidos) |
| test-engineer (2ª) | O teste "fim do dia" só pega a expressão antiga com a sessão do banco em UTC; prender o fuso da sessão ou declarar na linha de Mutações | Recusada: o banco de teste e o da esteira sobem com o fuso padrão do Postgres (`Etc/UTC`, o que o `revisor-geral` mediu em `educa-teste-postgres-1`); não há sessão de teste em outro fuso |
| test-engineer (2ª) | "Professor com dois vínculos" confere `ultimoEm` como "depois de `ha(MES)`", e não igual ao fim do dia, com relógio injetado | Recusada: a ordem da Mesa aceitou a forma, e ela fica vermelha nas duas mutações (`abertos > 0 \|\|` e `min`); o valor exato pede relógio no service, que a 15.0 injeta |
| test-engineer (2ª) | Pré-condição explícita (contagem zero de `credencial_matricula` e `conta_externa`) no caso "sem data de entrada" | Recusada: a bancada (`bancada.sessoes`) é a premissa também de "sem uso e vigência" e "mesma conta"; a guarda é dela, e não de cada caso |
| conformidade-reviewer (2ª) | Colega com os mesmos dois vínculos e sem uso, com `toEqual` entre as fotos, no caso "professor com dois vínculos" | Recusada: o D64 já prova a igualdade com o vínculo simples, e o rastro de professor é vazio por construção (gatilho `alvo.papel === 'aluno'`, mutação do D64) |
| tenancy-guardian (2ª) | Uma linha no JSDoc da classe dizendo que o filtro por `escola_id` das quatro consultas é a segunda camada atrás das FKs compostas | Tarefa 13.0, que reescreve `rastroDoAluno` em `union all` e toca esse arquivo; comentário em `.ts` caduca o `revisor-geral` e custaria uma rodada aqui |
| tenancy-guardian (2ª) | O regex do teste de arquitetura não pegaria o parâmetro com outro nome (`escola: string`); exigir que todo método público, menos `datasDeReferencia`, chame `exigirEscolaDoContexto()` | Recusada: o regex cobre o nome que o projeto usa, e o `tenancy-guardian` audita cada repository novo |
| llm-integrator (2ª) | Incluir `postgres`/`pg` no padrão de import do teste de arquitetura | Recusada: o pacote só chega ao driver por `db/`, e o teste já barra `drizzle-orm` e `db/schema/` |
| revisor-geral (2ª) | `#periodoDoTitular` decide `alvo.papel` duas vezes; dois ramos explícitos | Recusada: refatoração sem efeito de comportamento, mesmo critério da recusa de `#montarPedido` na 11.0 |
| revisor-geral (2ª) | A triagem do índice tirou da `13_task.md` o comentário "test-engineer e revisor-geral são obrigatórios em toda tarefa", a linha do `cenarios.md` em "Contexto necessário" e o "Definidos com o `test-engineer`"; o cenário "plano" da 13.0 não tem linha em `cenarios.md` | Orquestrador, que leva ao Arquiteto (a `13_task.md` é da triagem, não desta tarefa); não bloqueia o commit da 12.0 |
| privacy-guardian (2ª) | Refazer a foto antes de `apagarCredencialDaMatricula` e `apagarContaExterna`; nota em `docs/lgpd.md` sobre as datas de envio externo guardadas por 5 anos | tarefa 15.0 (já em "Sem aplicar" da rodada 1) |
| privacy-guardian (2ª) | O fim do período do aluno transferido ou desativado é "hoje" | `/validar` (RF13) (já em "Sem aplicar" da rodada 1) |
| llm-integrator (2ª); revisor-geral (2ª) | O índice `consumo_ia (escola_id, execucao_id)` e o rastro em `union all` | tarefa 13.0, subtarefa 13.1 (`techspec.md` §5, "O índice do rastro"). O `revisor-geral` aprovou a consulta como está **só nesta condição**: se a 13.1 não trouxer o índice, os dois ramos e o teste de plano, o bloqueante volta lá |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-09 22:32:22 | 2026-10-09 22:35:20 | `test-engineer` | 1 | REPROVADO | a79dbee462681a533 |
| 2026-10-09 22:35:36 | 2026-10-09 22:36:18 | `conformidade-reviewer` | 1 | APROVADO | ad8ecfccd8d5a74f1 |
| 2026-10-09 22:35:31 | 2026-10-09 22:36:23 | `tenancy-guardian` | 1 | APROVADO | ac602eec6c76f7dd8 |
| 2026-10-09 22:35:38 | 2026-10-09 22:37:21 | `llm-integrator` | 1 | APROVADO | af083b9000c24724d |
| 2026-10-09 22:35:33 | 2026-10-09 22:37:27 | `privacy-guardian` | 1 | REPROVADO | ab9c181e321419fc1 |
| 2026-10-09 22:35:28 | 2026-10-09 22:38:12 | `revisor-geral` | 1 | REPROVADO | a080fa6f3cb79a67e |
| 2026-10-09 23:03:08 | 2026-10-09 23:04:25 | `test-engineer` | 2 | APROVADO | afdbd62426e9b472c |
| 2026-10-09 23:05:07 | 2026-10-09 23:05:20 | `llm-integrator` | 2 | APROVADO | aff41a21ab18724dd |
| 2026-10-09 23:04:49 | 2026-10-09 23:05:25 | `tenancy-guardian` | 2 | APROVADO | a2b6c5ebf19df360c |
| 2026-10-09 23:05:01 | 2026-10-09 23:05:37 | `conformidade-reviewer` | 2 | APROVADO | aa52f637122197484 |
| 2026-10-09 23:04:56 | 2026-10-09 23:05:39 | `privacy-guardian` | 2 | APROVADO | a5ce4aca7ad77a191 |
| 2026-10-09 23:04:43 | 2026-10-09 23:06:04 | `revisor-geral` | 2 | APROVADO | a23aad3a6dd681d19 |
