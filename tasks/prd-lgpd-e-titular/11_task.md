# Tarefa 11.0 — A coordenação acha o titular e registra o pedido

**Funcionalidade:** lgpd-e-titular · **Depende de:** 2.0 · **Paralelo com:** 12.0 (depois de 8.0)
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Busca por `POST`, prévia, registro, lista, detalhe, concluir e corrigir nome funcionam pela API, auditados, com a prévia do professor igual para quem usou e quem não usou a IA.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (`pedido_titular`), 4 (rotas, "mesmo que inexistente", aluno só na lista) e 7
- `.claude/rules/20-lgpd-menores.md` itens 6, 10 e 19; D64
- Código: `apps/api/src/estrutura/lista.service.ts` (modelo de leitura auditada), `CicloDeVidaService` (o "si mesmo")
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 11.1 — Migration própria: `pedido_titular` (gatilho de inserção, imutáveis, único de `chave_envio`, índices)
- [x] 11.2 — `POST titulares/busca` com `rl:busca-titular`; `GET titulares/:id/previa` (`homonimo`; D64)
- [x] 11.3 — `POST pedidos` (chave decide primeiro), `GET pedidos` e `GET pedidos/:id`, auditoria na mesma transação
- [x] 11.4 — `concluir` e `corrigir-nome`, com estados e erro tipado
- [x] 11.5 — Harness de captura de log (termo, nome atual e anterior)
- [x] 11.6 — `docs/lgpd.md` (linha do pedido)
- [x] 11.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e schema | novo |
| `apps/api/src/privacidade/*` (rotas, service, repository, DTO) | alterado |
| `packages/shared/src/privacidade/*` (contratos) | alterado |
| limite da busca | alterado |
| `docs/lgpd.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| mesmo que inexistente | integração | `titularId` de B e o pedido sobre si mesmo (pela conta) respondem igual a inexistente |
| validação | integração | `chegouEm` futuro, nome vazio ou > 200, termo de 2 letras: erro tipado |
| imutabilidade | integração | `UPDATE` de `escola_id` ou `titular_id` recusado |
| corrigir nome | integração | muda; auditoria sem o nome; fora de correção ou com pedido fechado: `PEDIDO_EM_ESTADO_INVALIDO`; não muda B da mesma conta |
| auditoria | integração | sem `pedidos.listados`, `pedido.lido` e `titular.previa_lida` com finalidade, falha; a busca não grava o termo |
| D64 e homônimo | integração | prévia de professor sem contagem nem período; `homonimo` com aluno ativo e com nome livre |
| aluno da lista | integração | a busca não acha; o reivindicado passa por decidir e retirar com as duas auditorias |
| rate limit | integração | 31ª busca dá 429; duas coordenadoras do mesmo IP têm 30 cada |
| isolamento | integração | pedido, prévia, busca, concluir e corrigir de B; transferido; mesma matrícula |
| concorrência | integração [P] | mesma chave dá o mesmo pedido; clique duplo em concluir sem 500 |

## Como testar

- Molde: `apps/api/test/retencao.int.test.ts` (`subirApi`, `chamar`, `bancada.escolaComSessao`). Igual a inexistente: `apps/api/src/ia/ia.int.test.ts › de outra pessoa, de outra escola, inexistente…`.
- **auditoria:** `apps/api/test/lista.int.test.ts › A2: cada leitura da lista grava…`; **aluno da lista:** `› retirar o nome livre apaga a linha…`.
- **rate limit:** `apps/api/test/limite.int.test.ts › um usuário acima do próprio limite recebe 429…`.
- **concorrência:** `ia.int.test.ts › a mesma chave de envio duas vezes ao mesmo tempo…`; o clique duplo com `GatilhoDeParada` (`apps/api/test/gatilho-de-parada.ts`).
- **mesma conta:** `BancadaDeSessoes.sessaoDaMesmaConta`. **Log:** o terceiro argumento de `subirApi`, como `apps/api/test/acesso-da-escola.int.test.ts › privacidade: o log não traz o slug consultado`.
- Imutabilidade por gatilho: sem precedente.
- Rodar: `npx vitest run --project integracao <arquivo>`.

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [x] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Compartilhamento (12.0), arquivo (13.0), eliminação (14.0, 15.0), telas (16.0, 17.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| A prévia tem dois formatos, pela união discriminada em `papel`: o aluno traz `categorias: [{ categoria, quantidade }]`, e o professor traz `categorias: [categoria]` **sem contagem**, só as de cadastro e vínculo (`pessoa_desativada` e `vinculo_encerrado`) | a seção 4 diz "aluno: contagem por categoria" e "prévia de professor sem contagem nem período", e a resolução da revisão da spec diz "só as categorias de cadastro e vínculo"; um formato só não satisfaz as três frases | `techspec.md` §4 (`GET titulares/:id/previa`), com o texto do código em "Tarefa 11.0, como ficou no código"; `cenarios.md` RF17 ("a prévia de professor não traz contagem nem período") |
| `papel_titular` é `aluno` ou `professor`, e não existe pedido cujo titular seja a coordenação | a RF10 fala em "pedido de aluno ou professor da escola" e a prévia só tem dois ramos; o caso "a única coordenadora quer a própria eliminação" (PRD, seção 7) pede um coordenador como titular e a spec não o resolve. Fica para a tarefa da eliminação decidir, com a migration que ampliar o check se precisar | `prd.md` §4 (o que o coordenador não pode), §5 RF10 e §7; `techspec.md` §3 (bloco `pedido_titular`) e §4 ("Tarefa 11.0, como ficou no código"); `cenarios.md` RF10 |
| O `POST pedidos` responde 201 também quando a chave de envio devolve um pedido que já existia, e `concluir` e `corrigir-nome` respondem 204 | a mesma chave, com o mesmo conteúdo e da mesma coordenação, é sempre o mesmo pedido, e o recurso pedido existe depois da chamada; 200 diria que nada foi registrado, e o clique duplo continuaria 201 nos dois casos | `techspec.md` §5 ("Eliminação", "o `POST` faz `insert … on conflict`"); `cenarios.md` RF19 ("mesma chave duas vezes, com o mesmo conteúdo e da mesma coordenação, devolve o mesmo pedido") |
| A chave de envio já usada, com outro titular, tipo, solicitante ou chegada, ou registrada por outra coordenação, responde `NAO_ENCONTRADO` e não devolve o pedido gravado | a spec dizia só "a mesma chave é sempre o mesmo pedido"; devolver o pedido gravado a quem mudou o conteúdo perde o pedido novo em silêncio, e devolver o de outra coordenação mostra o titular de um pedido que não é dela (regra 10, itens 4 e 6; regra 20, itens 5 e 6). Exigida pelo `privacy-guardian` na 1ª rodada e triada pelo Arquiteto como detalhe que a spec não previu | `techspec.md` §4 ("A chave de envio é de quem registrou") e §5 ("Eliminação", "Registro"); `cenarios.md` RF10 ("A chave de envio já usada só devolve o pedido que é este mesmo") e RF19 |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `packages/nucleo/drizzle/0032_pedido_titular.sql` › `exigir_pedido_titular_imutavel` › `NEW.escola_id <> OLD.escola_id or NEW.titular_id <> OLD.titular_id` | `pedido-titular.int.test.ts › um UPDATE que troca a escola ou o titular do pedido é recusado pelo gatilho…` (sem o gatilho, os dois `update` passam) |
| `0032` › check `pedido_titular_estado_valido` | `› papel, tipo, solicitante, estado, data futura…` (o insert cru com `em_andamento` é aceito) |
| `0032` › check `pedido_titular_chegou_em_nao_futura` | `› papel, tipo…` (o caso "chegada futura") |
| `0032` › checks `pedido_titular_papel_valido`, `pedido_titular_tipo_valido`, `pedido_titular_solicitante_valido`, `pedido_titular_concluido_so_com_data`, `pedido_titular_enfileirado_so_agendado` | `› papel, tipo…` (um caso por check, na mesma tabela) |
| `0032` › gatilho `pedido_titular_titular_da_escola` (`exigir_usuario_da_escola('titular_id')`) | `› papel, tipo…` (o caso "o titular tem de ser da escola", com o titular de B: sem o gatilho, o insert passa) |
| `0032` › `pedido_titular_chave_envio_unico` em `(escola_id, chave_envio)` | `› [P] a mesma chave de envio duas vezes ao mesmo tempo…` (duas linhas, dois ids, duas auditorias) |
| `packages/shared/src/privacidade/titular.ts` › `esquemaBuscaDeTitulares` › `z.string().trim().min(MINIMO_DE_LETRAS_DO_TERMO)` | `› chegouEm no futuro, nome vazio… e termo de duas letras, de espaços ou acima de 200…` (as duas letras, e o termo de espaços, que viraria a lista da escola: `position('' in nome)` vale 1) |
| `titular.ts` › `esquemaBuscaDeTitulares` › `.max(MAXIMO_DO_NOME_DO_TITULAR)` | `› chegouEm no futuro…` (o termo de 201 letras, que não é nome de pessoa) |
| `titular.ts` › `esquemaCorrecaoDeNome` › `z.string().trim().min(1).max(MAXIMO_DO_NOME_DO_TITULAR)` | `› chegouEm no futuro…` (nome vazio, só de espaço e de 201 letras) |
| `titular.ts` › `esquemaRespostaPreviaDoTitular` › o ramo `professor`, com `categorias` sem `quantidade` | `› a prévia do professor sai igual para quem usou e quem não usou a IA…` (as chaves da resposta, e a lista das duas categorias) |
| `packages/shared/src/privacidade/classificacao.ts` › `pedido_titular` na classificação e `pedido_titular.chave_envio` em `COLUNAS_FORA_DO_ARQUIVO` | `apps/api/test/arquitetura.test.ts › a CLASSIFICACAO_DAS_TABELAS confere com as migrations…` (unidade, roda no portão) |
| `packages/shared/src/permissao/matriz.ts` › as células `privacidade_titulares` e `privacidade_pedidos` | `packages/shared/src/permissao/matriz.test.ts › cada célula da matriz está na expectativa…` (unidade); a rota fechada a quem não é coordenação, em `› permissão: professor, aluno e a coordenação sem segundo fator…` |
| `packages/nucleo/src/auditoria/acoes.ts` › `titular.buscado` › `depois: { ids }` | `› a busca, a prévia, a lista e o detalhe auditam com a finalidade…` (a linha inteira comparada) |
| `acoes.ts` › as finalidades de `titular.buscado`, `titular.previa_lida`, `pedidos.listados` e `pedido.lido` | `› a busca, a prévia…` (três mutações, uma por finalidade; a da lista arrastou os testes que leem a lista) |
| `privacidade.service.ts` › `pedido.registrado` › `depois` (os cinco campos do registro) | `› a busca, a prévia…` (o schema estrito da ação recusa o registro sem um campo, e a linha comparada falha) |
| `privacidade.service.ts` › `pedido.concluido` › `antes: { estado }` | `› a busca, a prévia…` e `› [P] o clique duplo em concluir…` |
| `privacidade.service.ts` › `pedido.nome_corrigido` (sem o nome) | `› muda o nome do titular…` (a linha da auditoria) |
| `titulares.repository.ts` › `paraOPedido` › `eq(usuario.escolaId, exigirEscolaDoContexto())` | `› a prévia, a busca, o detalhe, o concluir e o corrigir de B…` e `› o titularId de B…` |
| `titulares.repository.ts` › `paraOPedido` › `inArray(usuario.papel, ['aluno', 'professor'])` | `› o titularId de B, o id sorteado e o pedido sobre si mesmo…` (a coordenação passa a ser titular) |
| `titulares.repository.ts` › `buscar` › `position(<termo> in lower(btrim(nome))) > 0` | `› o titularId de B…`, `› a busca, a prévia…`, `› a busca não acha o nome livre…`, `› a prévia, a busca…` e `› o aluno transferido…` (o termo deixa de filtrar) |
| `titulares.repository.ts` › `buscar` › `.limit(MAXIMO_DE_RESULTADOS_DA_BUSCA)` (trocado por 200) | `› traz o aluno com a matrícula e a turma… e corta em 20` |
| `titulares.repository.ts` › `#vinculosDe` › `ne(vinculo.estado, 'encerrado')` | `› traz o aluno com a matrícula…` (a turma do vínculo encerrado aparece) |
| `titulares.repository.ts` › `homonimo` › o `exists` do aluno ativo com o mesmo nome | `› a prévia do aluno conta por categoria…` (o primeiro `homonimo: true`) |
| `titulares.repository.ts` › `homonimo` › o `exists` do nome livre igual na lista | `› a prévia do aluno conta por categoria…` (o segundo `homonimo: true`) |
| `titulares.repository.ts` › `contagemPorCategoria` › cada um dos doze `select` de categoria (um a um) | `› a prévia do aluno conta por categoria…` (a lista é comparada inteira, com uma linha semeada em cada categoria) e `› a contagem alcança a autoria do artefato e o material…` (nas duas de equipe); as doze mutações rodaram, uma por vez |
| `titulares.repository.ts` › `contagemPorCategoria` › `quantidade === 0 ? [] : […]` (só as categorias com linha) | `› a contagem alcança a autoria do artefato e o material…` (as categorias zeradas entram na lista) |
| `pedidos.repository.ts` › `registrar` › `.onConflictDoNothing({ target: [escola_id, chave_envio] })` | `› [P] a mesma chave de envio duas vezes…` (a segunda grava outra linha) |
| `pedidos.repository.ts` › `concluir` › `tipo in ('acesso', 'portabilidade', 'compartilhamento', 'correcao')` | `› muda o nome do titular…` (o caso "a eliminação não conclui por aqui") |
| `pedidos.repository.ts` › `concluir` › `estado in ('recebido', 'em_preparacao', 'pronto')` | `› [P] o clique duplo em concluir…` (a segunda chamada conclui de novo e audita duas vezes) |
| `pedidos.repository.ts` › `corrigirNome` › `p.tipo = 'correcao'` | `› muda o nome do titular…` (o pedido de acesso corrigido, sem o erro) |
| `pedidos.repository.ts` › `corrigirNome` › `p.estado in ('recebido', 'pronto')` | `› muda o nome do titular…` (o pedido concluído corrigido de novo) |
| `pedidos.repository.ts` › `listar` › `ne(pedido_titular.titular_id, deQuemPediu.usuarioId)` e a cláusula da `conta_id` (a da conta, vermelha; a do id, abaixo) | `› o titularId de B…` (o pedido sobre o professor da mesma conta aparece na lista dela) |
| `pedidos.repository.ts` › `listar` e `#um` › `eq(pedido_titular.escola_id, exigirEscolaDoContexto())` | `› a prévia, a busca, o detalhe…` e `› o aluno transferido…` |
| `pedidos.repository.ts` › `#um`/`#vários` › o `leftJoin` do `usuario` (trocado por `innerJoin`) | `› o titular eliminado some do pedido…` (o pedido do titular eliminado some da lista e do detalhe) |
| `privacidade.service.ts` › `registrarPedido` › `chegouEm > diaDeUso(new Date())` | `› chegouEm no futuro…` (a data de amanhã, de São Paulo). **Só fica vermelha na janela das 21h às 0h de São Paulo**, quando o dia em UTC já é o seguinte e a comparação antiga (`toISOString().slice(0, 10)`) aceitava a data; fora da janela os dois dias coincidem, e a cláusula é conferida por leitura |
| `privacidade.service.ts` › `#ehDeQuemPediu` › `titular.contaId === contaDeQuemPediu()` | `› o titularId de B…` (o pedido sobre o professor da mesma conta é registrado) |
| `privacidade.service.ts` › `#pedidoAlvo` › `pedido.contaDoTitular === contaDeQuemPediu()` | `› o titularId de B…` (o pedido sobre a própria pessoa, registrado por outra coordenação, é lido, concluído e corrigido) |
| `privacidade.service.ts` › `previaDoTitular` › o ramo do professor (`categoriasDoProfessor()`), e não a contagem | `› a prévia do professor sai igual…` (a contagem de uso aparece) |
| `privacidade.service.ts` › `previaDoTitular` › `homonimo(titular.id, nome)` | `› a prévia do aluno conta por categoria…` (os dois `homonimo: true`) |
| `privacidade.service.ts` › `registrarPedido` › `homonimo` gravado no registro | `› a prévia do aluno conta por categoria…` (o detalhe do pedido sai com `homonimo: false`) |
| `guarda-limite.ts` › o balde `rl:busca-titulares` (`METADADO_LIMITE_DA_BUSCA_DE_TITULARES`) | `› a 31ª busca do minuto responde 429 com Retry-After…` |
| `privacidade.service.ts` › `pedidos` e `pedido` › `titular: <nome e turmas> ?? null` | `› o titular eliminado some do pedido…` |
| `pedidos.repository.ts` › `daChave` › `eq(pedido_titular.registrado_por, identidadeDaRequisicao().usuarioId)` | `› a chave de envio devolve só o pedido que é este mesmo…` (o caso (b), com o mesmo titular, tipo, solicitante e chegada: a chave de outra coordenação devolve o pedido dela) |
| `privacidade.service.ts` › `registrarPedido` › a chave que colide › `lido.titularId !== pedido.titularId` | `› a chave de envio devolve só o pedido que é este mesmo…` (o caso (a): a mesma chave com outro titular devolve 201 com o primeiro pedido, e o nome dele) |
| `privacidade.service.ts` › `registrarPedido` › a chave que colide › `lido.tipo !== pedido.tipo` | `› a chave de envio devolve só…` (o caso (a2), `tipo`: a mesma chave com `correcao` devolve 201 com o pedido de acesso) |
| `privacidade.service.ts` › `registrarPedido` › a chave que colide › `lido.solicitante !== pedido.solicitante` | `› a chave de envio devolve só…` (o caso (a2), `solicitante`: a mesma chave com `responsavel_legal` devolve 201 com o pedido do titular) |
| `privacidade.service.ts` › `registrarPedido` › a chave que colide › `lido.chegouEm !== pedido.chegouEm` | `› a chave de envio devolve só…` (o caso (a2), `chegada`: a mesma chave com a chegada de ontem devolve 201 com o pedido de hoje) |
| `privacidade.service.ts` › `registrarPedido` › o `if (id === undefined && …)` inteiro (trocado por nada) | `› a chave de envio…` (o caso (a)) |
| `matriz.ts` › as células de `privacidade_titulares` e `privacidade_pedidos` do professor e do aluno (abertas) | `› permissão: professor, aluno e a coordenação sem segundo fator…`, que agora usa um pedido real: `concluir` devolve 204 e o estado deixa de ser `recebido` |
| `0032` › gatilho `pedido_titular_registrado_por_da_escola` › `exigir_usuario_da_escola('registrado_por')` na inserção **e** no `UPDATE OF registrado_por` | `› papel, tipo, solicitante, estado, datas e autor juntos são recusados…` (o insert com o registrador de B, e o `update` cru do `registrado_por`) |
| `0032` › check `pedido_titular_cancelado_so_com_data` | `› papel, tipo…` (o caso "cancelamento sem autor") |
| `pedidos.repository.ts` › `listar` › `gt(pedido_titular.id, depoisDe)` | `› a lista pagina em ordem de id…` (a segunda página repete os primeiros) |
| `privacidade.service.ts` › `pedidos` › `pedidos.slice(0, consulta.limite)` | `› a lista pagina em ordem de id…` (a primeira página traz os três) |
| `privacidade.service.ts` › `pedidos` › `proxima` quando `pedidos.length > consulta.limite` | `› a lista pagina em ordem de id…` (sem a segunda página) |
| `privacidade.service.ts` › `pedidos` › a auditoria com `daPágina` (e não com `pedidos`) | `› a lista pagina em ordem de id…` (o `depois` traz o id da página seguinte) |
| `titulares.repository.ts` › `homonimo` › o `exists` do aluno ativo › `u.desativado_em is null` | `› a prévia do aluno conta por categoria…` (o aluno desativado do mesmo nome marca homônimo) |
| `titulares.repository.ts` › `homonimo` › o `exists` › `u.papel = 'aluno'` | `› a prévia do aluno conta…` (o professor do mesmo nome marca homônimo) |
| `titulares.repository.ts` › `homonimo` › o `exists` do nome livre › `l.estado = 'livre'` | `› a prévia do aluno conta…` (a linha `reivindicado` do mesmo nome marca homônimo) |
| `titulares.repository.ts` › `homonimo` › o `exists` do aluno ativo › `u.escola_id = ${escolaId}` | `› o homônimo não olha a escola B…` (o aluno ativo de B com o mesmo nome marca o titular de A) |
| `titulares.repository.ts` › `homonimo` › o `exists` do nome livre › `l.escola_id = ${escolaId}` | `› o homônimo não olha a escola B…` (o nome livre de B marca o titular de A) |
| `titulares.repository.ts` › `buscar` › `desativadoEm === null ? 'ativo' : 'desativado'` | `› o aluno transferido tem pedidos separados…` (o estado do desativado sai `ativo`) |
| `pedidos.repository.ts` › `corrigirNome` › `p.estado in ('recebido', 'pronto')` (o caso do `em_preparacao`) | `› muda o nome do titular…` (o pedido de correção em preparação corrige o nome) |
| `apps/api/test/captura-de-dado-pessoal.ts` › `varrerLog` › `linhasDeLog.slice(this.#inicio)` e `expect(log).toContain('http.erro')` | `› RF17…` (sem a chamada `previa(a.coordenacao, randomUUID())`, que é o único erro depois de criada a captura, a varredura falha; antes do `slice` ela passava pelo log dos testes anteriores do arquivo) |
| **Equivalentes na prática, sem vermelho próprio.** `pedidos.repository.ts` › `corrigirNome` › `u.escola_id = <contexto>` no `update` | **nenhum ficou vermelho**: o `u.id` vem da subconsulta do pedido, já no escopo da escola, e o titular do pedido só pode ser da escola (o gatilho da inserção, mais a imutabilidade do `titular_id`). Fica como a segunda camada, no mesmo padrão do restante do repositório |
| idem, `privacidade.service.ts` › `#pedidoAlvo` › `pedido.titularId === usuarioId`, e `pedidos.repository.ts` › `listar` › `ne(titular_id, autor)` | **nenhum ficou vermelho**: quem pede é a coordenação, e ela não é titular (RF10, cláusula acima); a regra "sobre si mesmo" é testada pela `conta_id`, que é o caso que existe hoje ("não só o mesmo id"). As duas ficam porque dizem a regra inteira |
| idem, `titular.ts` › `esquemaRespostaBuscaDeTitulares` › `.max(MAXIMO_DE_RESULTADOS_DA_BUSCA)` | **nenhum ficou vermelho**: o teto é o `.limit` do repositório, testado acima; o schema é a segunda camada da resposta |
| idem, `titulares.repository.ts` › `#vinculosDe` › `eq(vinculo.anoLetivoId, exigirAnoEmCurso())` e o `orderBy` da busca | **nenhum ficou vermelho**: a fixture tem um ano só, e a asserção do corte em 20 não olha a ordem. A cláusula é a de "turma do ano" (§4), e a ordem por nome é o que torna o corte estável entre chamadas: sem ela, os 20 mudariam de chamada para chamada |
| idem, os `escola_id` repetidos por segurança em `titulares.repository.ts` › `contagemPorCategoria` (os joins), `#vinculosDe`, `titularesParaOPedido` e `contaDeQuemPediu` | **nenhum ficou vermelho** (apontado pelo `tenancy-guardian`): o id que entra em cada consulta já vem do escopo da escola, e a cláusula é a segunda camada — a mesma repetição que o restante dos repositórios faz. Fica pelo mesmo padrão |
| idem, `pedidos.repository.ts` › `daChave` › `eq(pedido_titular.escola_id, exigirEscolaDoContexto())` | **nenhum ficou vermelho**: a cláusula `registrado_por`, acrescentada pelo item 1 da ordem, já barra a linha de B (o `usuario` é de uma escola só), e a comparação do service barra a de outro titular. O caso (c) prova o `escola_id` do `registrar`, que é o insert que devolve o pedido de A e não o de B; a cláusula do `daChave` fica como a segunda camada |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| conformidade-reviewer (1ª) | A 12.0 prova que o detalhe do pedido e a foto do compartilhamento saem iguais para os dois professores | tarefa 12.0 (que preenche a foto); testes de `12_task.md` |
| conformidade-reviewer (1ª) | A tela da 16.0 diz que a contagem da prévia é para atender o pedido, não um indicador do aluno | tarefa 16.0 |
| conformidade-reviewer (1ª) | Ao ampliar o check para a coordenadora como titular, a prévia dela segue a regra do professor, sem contagem de uso | tarefa 15.0 (a que decide a titularidade da coordenação; está nas Divergências da 11.0) |
| tenancy-guardian (1ª) | `concluido_por` e `cancelado_por` passam pelo `exigir_usuario_da_escola` | tarefa 14.0 (cancelar), na migration que ela já precisar |
| privacy-guardian (1ª) | `concluido_por` e `cancelado_por` fora do arquivo do titular (`classificacao.ts`): escolher um critério para as três colunas | tarefa 13.0 (arquivo), junto com o item seguinte |
| privacy-guardian (1ª) | O arquivo da `auditoria` liga só por `autor_usuario_id`; decidir se "quem leu meus dados" (`titular.previa_lida`, `titular.buscado`) entra no arquivo | tarefa 13.0 |
| infra-guardian (1ª) | Índice `(escola_id, execucao_id)` em `consumo_ia` para a contagem de `texto_do_modelo`, com `CREATE INDEX CONCURRENTLY` em migration própria | tarefa 13.0, antes de reusar a contagem no arquivo; plano com o volume de hoje não tem urgência (prévia rara, `statement_timeout` de 2 s) |
| infra-guardian (1ª), revisor-geral (1ª), test-engineer (1ª) | `pedido.concluido` grava `antes.estado` lido antes do `update`; na corrida com o job da 13.0 pode não ser o estado trocado | tarefa 13.0, primeira a mudar o estado por job: devolver o estado anterior no `returning` |
| infra-guardian (1ª), test-engineer (1ª), privacy-guardian (1ª) | `corrigir-nome` em clique duplo audita duas vezes e não tem teste [P] | recusada, com o motivo escrito: o nome final é o mesmo e o desenho aceita (a Tech Spec §4, "Tarefa 11.0", põe o texto) |
| revisor-geral (1ª) | `titulares.repository.ts › papelDeTitular` lança `Error` cru | recusada: ramo inalcançável, o `where` da busca já filtra `aluno` e `professor`; um erro de domínio nunca seria visto |
| revisor-geral (1ª) | `#montarPedido` monta o pedido inteiro para aproveitar cinco campos | recusada: refatoração sem efeito de comportamento, na lista, e o custo é um objeto a mais por item |
| revisor-geral (1ª) | `PedidosRepository.listar` recebe `usuarioId` e `contaId` do service, e `registrar`/`concluir` leem a identidade sozinhos | recusada: `contaId` precisa de uma consulta ao `usuario`, que é do `TitularesRepository`; ler a identidade aqui duplicaria essa consulta |
| revisor-geral (1ª) | O revisor-geral só vale depois de o `test-engineer` aprovar | resolve-se na rodada 2: a ordem aplicada é a do `test-engineer`; a Mesa chama os dois de novo |
| test-engineer (2ª) | Extrair a comparação do dia para uma função pura que receba o relógio, e testá-la na unidade com 22h de São Paulo | recusada: a cláusula é uma chamada a `diaDeUso`, que já tem teste de unidade da virada às 3h UTC (`packages/nucleo/src/uso/dia-de-uso.test.ts`); injetar relógio em `registrarPedido` muda a assinatura de um método para provar uma linha. A janela está declarada na linha das Mutações |
| revisor-geral (2ª) | `MINIMO_DE_LETRAS_DO_TERMO` conta caracteres, não letras (`"a.b"` passa) | recusada: o mínimo existe para a busca não listar a escola por um pedaço de nome, e "a.b" casa poucos nomes (a busca é `position`, sem curinga); renomear a constante toca contrato, service e testes sem mudar comportamento |
| tenancy-guardian (2ª) | Na linha "Equivalentes" do `daChave › escola_id`, registrar que a equivalência supõe que `usuario.escola_id` não muda | tarefa futura que permitir mudar a escola de um `usuario` (nenhuma no F3); hoje nenhum caminho de código o faz |
| tenancy-guardian (2ª) | `concluido_por` e `cancelado_por` pelo `exigir_usuario_da_escola` | tarefa 14.0 (já na rodada 1) |
| infra-guardian (2ª) | Registrar que o cliente que reaproveita a chave entre diálogos recebe 404, e não um aviso de conflito | escrito pelo Arquiteto: `techspec.md` §4 ("A chave de envio é de quem registrou"), com o motivo de ser `NAO_ENCONTRADO` e não `CONFLITO` |
| infra-guardian (2ª), privacy-guardian (2ª) | Índice em `consumo_ia`; estado anterior em `pedido.concluido`; `concluido_por`/`cancelado_por` e "quem leu meus dados" no arquivo | tarefa 13.0 (já na rodada 1) |
| privacy-guardian (2ª) | `escola_id` do `daChave` sem caso vermelho | aceito: declarado em "Equivalentes na prática" nas Mutações |
| revisor-geral (3ª) | Comentário de `PedidosRepository.registrar` ("confere que ele é o pedido que foi pedido") difícil de ler; e quebra de linha no meio da frase no comentário da classe (`pedidos.repository.ts:55-57`) | tarefa 12.0, que volta a esse arquivo; só texto de comentário, e mexer agora caducaria as seis aprovações |
| test-engineer (3ª) | Sem erro, o log do RF17 depois de criada a captura fica vazio: o caminho de sucesso não escreve linha de log, então a varredura só pega vazamento em log de erro ou em chamada explícita do logger | registro para o `/validar`; não é defeito da tarefa. Passa a valer sozinha quando algum caminho de sucesso escrever log |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-09 18:59:35 | 2026-10-09 19:03:51 | `test-engineer` | 1 | REPROVADO | a8bf3d66291ed3d80 |
| 2026-10-09 19:04:16 | 2026-10-09 19:05:19 | `conformidade-reviewer` | 1 | APROVADO | ac76510bc05be8139 |
| 2026-10-09 19:04:08 | 2026-10-09 19:06:05 | `tenancy-guardian` | 1 | REPROVADO | abd81d994de0e9206 |
| 2026-10-09 19:04:05 | 2026-10-09 19:06:18 | `revisor-geral` | 1 | REPROVADO | a3653e1feef65bbae |
| 2026-10-09 19:04:12 | 2026-10-09 19:06:26 | `privacy-guardian` | 1 | REPROVADO | a7928b8b2d4289278 |
| 2026-10-09 19:04:19 | 2026-10-09 19:06:29 | `infra-guardian` | 1 | APROVADO | a8e3a796f097f835e |
| 2026-10-09 19:34:42 | 2026-10-09 19:37:05 | `test-engineer` | 2 | REPROVADO | a923417d5aca37940 |
| 2026-10-09 19:37:45 | 2026-10-09 19:38:29 | `conformidade-reviewer` | 2 | APROVADO | a62c64be8730469ae |
| 2026-10-09 19:37:29 | 2026-10-09 19:38:30 | `tenancy-guardian` | 2 | APROVADO | a5a3ecd5aa9dd889c |
| 2026-10-09 19:37:53 | 2026-10-09 19:38:38 | `infra-guardian` | 2 | APROVADO | a8060c1afb1ef0c2c |
| 2026-10-09 19:37:20 | 2026-10-09 19:38:44 | `revisor-geral` | 2 | REPROVADO | a4a8e36e04181a951 |
| 2026-10-09 19:37:38 | 2026-10-09 19:38:52 | `privacy-guardian` | 2 | APROVADO | addfb7b3cc8290993 |
| 2026-10-09 19:57:11 | 2026-10-09 19:59:18 | `test-engineer` | 3 | APROVADO | a22daf8c15a8c604e |
| 2026-10-09 19:59:31 | 2026-10-09 20:00:07 | `revisor-geral` | 3 | APROVADO | ac0ec4ae323dbebb5 |
