# Tarefa 14.0 — A eliminação fica agendada por 7 dias, com o acesso suspenso e o cancelamento

**Funcionalidade:** lgpd-e-titular · **Depende de:** 1.0, 11.0 · **Paralelo com:** 12.0, 13.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Registrar a eliminação suspende o acesso na requisição seguinte, sem revelar nada a quem não tem a credencial, e cancelar devolve o acesso.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (`eliminacao_agendada_em`), 4 ("Login suspenso") e 5 ("Eliminação": registro e cancelar)
- `.claude/rules/80-infra-e-carga.md` itens 1 e 7
- Código: `packages/nucleo/src/identidade/sessao.repository.ts`, `apps/api/src/sessao/matricula.service.ts`, os logins por e-mail e conta externa, o seletor de escola
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [x] 14.1 — Migration própria: `usuario.eliminacao_agendada_em`; único parcial de `agendado`
- [x] 14.2 — Registro de eliminação (sessões encerradas com `eliminacao_agendada`); cancelar com a trava pedido → usuário
- [x] 14.3 — Guarda, renovação e logins: `ACESSO_SUSPENSO` só depois da credencial; e-mail e seletor sem a escola
- [x] 14.4 — `pessoa_desativada` pula quem tem pedido `agendado` (5.0)
- [x] 14.5 — Runbook do rollback
- [x] 14.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e `usuario.ts` | alterado |
| `sessao` (guarda, logins, renovação, seletor) | alterado |
| `privacidade` service | alterado |
| `expurgo-da-escola.repository.ts` | alterado |
| `docs/runbook.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| suspensão | integração | token anterior recusado; login certo, renovação e conta Google/Microsoft dão `ACESSO_SUSPENSO` |
| não revela | integração | senha errada na conta suspensa igual à matrícula inexistente (status, corpo e contagem) |
| escolhas | integração | no login por e-mail e no seletor, a escola agendada não aparece; em B continua entrando |
| cancelar | integração | a mesma senha volta; depois do prazo ou enfileirado: `PEDIDO_EM_ESTADO_INVALIDO` |
| auditoria | integração | registrado, agendado, cancelado; sessões com o motivo |
| rotina | integração | `pessoa_desativada` com pedido agendado é pulada |
| isolamento | integração | `cancelar` de B como inexistente |
| concorrência | integração [P] | duas chaves: uma `agendado`, outra erro; dois `cancelar` |

## Como testar

- **suspensão:** `apps/api/test/ciclo-de-vida.int.test.ts › caminho feliz (RF5; regra 20, item 18)…` (a sessão aberta dá 401 na requisição seguinte); renovação em `apps/api/test/renovacao.int.test.ts`; conta externa em `apps/api/test/sessao-externa.int.test.ts › borda: a professora ligada e depois desativada não entra mais pela conta`.
- **não revela:** `apps/api/test/sessao-matricula.int.test.ts › privacidade (regra 20, item 6): slug inexistente…` (mesmo status, mesmo corpo, um hash cada).
- **escolhas:** `apps/api/test/troca-de-escola.int.test.ts › caminho feliz (RF14)…`; e-mail em `apps/api/test/login-email.int.test.ts › permissão: aluno não entra por e-mail e senha…`.
- **rotina:** `apps/worker/test/expurgo-da-escola.int.test.ts › a pessoa reativada entre a escolha do lote e a trava não é eliminada…` (`alunoDesativado`).
- **concorrência:** `GatilhoDeParada` e `esperarNaTrava`, como `apps/api/test/retencao.int.test.ts › concorrência: dois ajustes da mesma escola…`.
- Armadilha (`estado.md`): o teste de plano do expurgo depende de estatística (`1a405d2`). Mexeu no lote de `pessoa_desativada`, rode `› o lote de cada alvo desce pelo índice dele…`.
- Rodar: `npx vitest run --project integracao <arquivo>`.

## Critério de conclusão

- [x] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

A execução (15.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|
| O gatilho `exigir_usuario_da_escola` entrou em `cancelado_por`, e **não** em `concluido_por` | O job da eliminação (15.0) conclui com o autor `rotina` quando quem registrou já saiu da escola, e o gatilho o impediria. O `cancelado_por` é sempre pessoa da escola (a rota exige a matriz) | `techspec.md` §5, bloco "Tarefa 14.0, como ficou no código"; `cenarios.md`, RF14 |
| A marca `usuario.eliminacao_agendada_em` é gravada na mesma transação do registro, pelo `CicloDeVidaService` (`agendarEliminacao`), e o pedido nasce `agendado` já com `eliminar_em = now() + 7 dias` (relógio do banco) | A spec dizia o efeito, não onde a marca nascia; o caso de uso do ciclo de vida já é o dono do usuário (trava, sessões) e a unidade da trava é pedido → usuário | `techspec.md` §3 (`eliminacao_agendada_em`) e §5 ("Eliminação": registro) |
| O `ACESSO_SUSPENSO` no login por e-mail sai só quando a conta **não tem nenhuma escola utilizável** e tem uma suspensa; com outra escola ativa, entra nela, sem a suspensa no seletor | É a leitura de "a escola com eliminação agendada não aparece" sem revelar a suspensão a quem a credencial não prova: o `ACESSO_SUSPENSO` só depois da senha certa, e o zero acesso passa pelo mesmo tempo e contador | `techspec.md` §5, bloco "Tarefa 14.0, como ficou no código"; `cenarios.md`, RF14 |
| A renovação responde `ACESSO_SUSPENSO` pelo cookie de renovação atual que valeria sem a suspensão (a credencial dela; o vencido, o encerrado por outro motivo e o rotacionado dão 401), e a senha errada na matrícula suspensa é idêntica à matrícula inexistente (status, corpo, hash e contador) | A credencial da renovação é o cookie; a spec pedia "token válido" para a conta externa e a renovação | `techspec.md` §5, bloco "Tarefa 14.0, como ficou no código"; `cenarios.md`, RF14 |
| A redefinição de MFA usa `usuariosAtivosDaConta(..., { comSuspensos: true })` | A auditoria da redefinição lista todos os acessos da conta, inclusive o suspenso, que a guarda recusa mas que existe | `techspec.md` §5, bloco "Tarefa 14.0, como ficou no código"; `cenarios.md`, RF14 |
| A tela web "Login suspenso" (texto da §9) **não** está nesta tarefa nem na 15.0 a 19.0: a API entrega o código `ACESSO_SUSPENSO` (403) e, na conta externa, `?falha=acesso_suspenso`, com o texto do catálogo compartilhado | Nenhuma subtarefa 14.x tem tela; o contrato e o texto estão em `packages/shared` para a tela consumir | `techspec.md` §9 ("Login suspenso") |

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta. Cada uma foi **apagada, rodada
e restaurada** (um harness trocou o trecho no arquivo, rodou só o arquivo de teste da coluna ao lado e devolveu o arquivo); todas
ficaram vermelhas, e a coluna traz o primeiro teste que falhou. Duas cláusulas sobreviveram na primeira passada e saíram do
diff em vez de ganhar teste: o `eq(pedidoTitular.tipo, 'eliminacao')` do `cancelar` (o check `pedido_titular_agendado_com_prazo`
já impede `agendado` de outro tipo) e a segunda cópia de `suspenso ? SUSPENSO` da releitura da ligação externa (só alcançável
numa corrida, agora a mesma `entrarSeNaoSuspensa` da ligação achada). As duas outras (`devolverAcesso` sem `isNotNull` e a
seleção do lote de `pessoa_desativada`) ganharam teste. Na ordem da 1ª rodada, a cláusula única da renovação deu lugar às quatro que ela passou a ter (`pelo === 'atual'`, `encerradaEm === null`, `motivo === 'eliminacao_agendada'` e o `sessaoAindaVale` sem a suspensão), mais o `motivo` lido por `sessaoParaRenovar`, e entraram as cláusulas dos itens 3, 5 e 6. Nome do teste sem número de linha.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|
| `ciclo-de-vida.repository.ts` › suspender › `set({ eliminacaoAgendadaEm: now() })` | `eliminacao-agendada.int.test.ts` › `agenda o pedido para 7 dias, suspende o acesso e encerra as sessões da pessoa com o motivo, sem tocar nas dos colegas` |
| `ciclo-de-vida.repository.ts` › suspender › `isNull(usuario.eliminacaoAgendadaEm)` | `eliminacao-agendada.int.test.ts` › `a marca sem pedido agendado, que o registro nunca deixa, é recusada como PEDIDO_EM_ESTADO_INVALIDO e não deixa pedido pela metade` |
| `ciclo-de-vida.repository.ts` › suspender › `eq(usuario.escolaId, exigirEscolaDoContexto())` | `eliminacao-agendada.int.test.ts` › `cancelar, suspender e devolver o acesso, com o contexto de A e o id de B, não encontram a linha nem mudam nada` |
| `ciclo-de-vida.repository.ts` › devolverAcesso › `isNotNull(usuario.eliminacaoAgendadaEm)` | `eliminacao-agendada.int.test.ts` › `o pedido agendado cuja marca já foi apagada cancela, e a auditoria diz que não havia acesso a devolver` |
| `ciclo-de-vida.repository.ts` › devolverAcesso › `eq(usuario.escolaId, exigirEscolaDoContexto())` | `eliminacao-agendada.int.test.ts` › `cancelar, suspender e devolver o acesso, com o contexto de A e o id de B, não encontram a linha nem mudam nada` |
| `ciclo-de-vida.repository.ts` › devolverAcesso › `set({ eliminacaoAgendadaEm: null })` | `eliminacao-agendada.int.test.ts` › `cancelar devolve o acesso com a mesma senha, e o que foi encerrado não volta: token e cookie de antes seguem recusados` |
| `ciclo-de-vida.service.ts` › agendarEliminacao › `encerrarSessoesDoUsuario(usuarioId, 'eliminacao_agendada')` | `eliminacao-agendada.int.test.ts` › `agenda o pedido para 7 dias, suspende o acesso e encerra as sessões da pessoa com o motivo, sem tocar nas dos colegas` |
| `ciclo-de-vida.service.ts` › agendarEliminacao › `sessoesEncerradas: await repositorio.encerrarSessoesDoUsuario(...)` | `eliminacao-agendada.int.test.ts` › `agenda o pedido para 7 dias, suspende o acesso e encerra as sessões da pessoa com o motivo, sem tocar nas dos colegas` |
| `ciclo-de-vida.service.ts` › agendarEliminacao › `if (agendadaEm === undefined) throw PEDIDO_EM_ESTADO_INVALIDO` | `eliminacao-agendada.int.test.ts` › `a marca sem pedido agendado, que o registro nunca deixa, é recusada como PEDIDO_EM_ESTADO_INVALIDO e não deixa pedido pela metade` |
| `ciclo-de-vida.service.ts` › cancelarEliminacao › `return repositorio.devolverAcesso(usuarioId)` (o resultado, e não `true`) | `eliminacao-agendada.int.test.ts` › `a pessoa que já não está na escola (eliminada por outro caminho) não tem a quem devolver: o pedido cancela, e a auditoria diz que o acesso não foi devolvido` |
| `avaliar-sessao.ts` › sessaoAindaVale › `|| linha.eliminacaoAgendadaEm !== null` | `avaliar-sessao.test.ts` › `recusa usuário com a eliminação agendada, sessão ainda aberta` |
| `avaliar-sessao.ts` › sessaoAindaVale › `|| linha.eliminacaoAgendadaEm !== null` (pelo HTTP) | `eliminacao-agendada.int.test.ts` › `a guarda e a renovação recusam pela marca do usuário, mesmo com a sessão ainda aberta: a recusa não depende de o registro ter encerrado a sessão` |
| `sessao.repository.ts` › linha da sessão › `eliminacaoAgendadaEm: usuario.eliminacaoAgendadaEm` | `eliminacao-agendada.int.test.ts` › `a guarda e a renovação recusam pela marca do usuário, mesmo com a sessão ainda aberta: a recusa não depende de o registro ter encerrado a sessão` |
| `matricula.service.ts` › entrar › `if (credencial.suspenso)` depois de `contador.zerar` | `eliminacao-agendada.int.test.ts` › `login por matrícula: a senha certa dá ACESSO_SUSPENSO, sem cookie e sem sessão nova; a senha errada é a de sempre` |
| `credencial-matricula.repository.ts` › doAlunoAtivo › `suspenso: linha.eliminacaoAgendadaEm !== null` | `eliminacao-agendada.int.test.ts` › `login por matrícula: a senha certa dá ACESSO_SUSPENSO, sem cookie e sem sessão nova; a senha errada é a de sempre` |
| `renovacao.service.ts` › resposta da recusa › `decisao.suspenso === true ? ACESSO_SUSPENSO` | `eliminacao-agendada.int.test.ts` › `renovação: o cookie de quem tem a eliminação agendada dá ACESSO_SUSPENSO e é apagado; o do colega renova; o cookie qualquer dá 401` |
| `resolucao-de-tenant.repository.ts` › usuariosAtivosDaConta › `isNull(usuario.eliminacaoAgendadaEm)` (sem `comSuspensos`) | `eliminacao-agendada.int.test.ts` › `com a eliminação agendada em A, o login por e-mail não oferece A e entra direto em B; antes, a pessoa escolhia` |
| `resolucao-de-tenant.repository.ts` › acessos › `isNull(usuario.eliminacaoAgendadaEm)` | `eliminacao-agendada.int.test.ts` › `o seletor (acessos do /v1/eu) deixa de listar a escola agendada, e a lista volta quando a eliminação é cancelada` |
| `resolucao-de-tenant.repository.ts` › temAcessoSuspenso › `return linha !== undefined` | `eliminacao-agendada.int.test.ts` › `a conta só com A agendada: a senha certa recebe ACESSO_SUSPENSO e a errada, a resposta de sempre` |
| `login.service.ts` › zero acessos › `if (await temAcessoSuspenso(credencial.id))` | `eliminacao-agendada.int.test.ts` › `a conta só com A agendada: a senha certa recebe ACESSO_SUSPENSO e a errada, a resposta de sempre` |
| `redefinicao-de-mfa.ts` › `usuariosAtivosDaConta(contaId, { comSuspensos: true })` | `mfa.int.test.ts` › `eliminação agendada (14.0): a escola em que a pessoa está agendada também recebe o registro da redefinição, porque o usuário continua sendo dela` |
| `externa.service.ts` › entrarSeNaoSuspensa › `ligacao.suspenso ? SUSPENSO` | `sessao-externa.int.test.ts` › `eliminação agendada: a professora ligada, com a conta do provedor certa, recebe a falha acesso_suspenso e nenhuma sessão nasce; cancelada, entra` |
| `externa.service.ts` › #decidir › `if (professor.suspenso) return SUSPENSO` | `sessao-externa.int.test.ts` › `eliminação agendada: a professora ainda sem ligação não é ligada, e o login dela diz acesso_suspenso` |
| `externa.service.ts` › retorno › `decisao.tipo === 'suspenso' ? 'acesso_suspenso'` | `sessao-externa.int.test.ts` › `eliminação agendada: a professora ligada, com a conta do provedor certa, recebe a falha acesso_suspenso e nenhuma sessão nasce; cancelada, entra` |
| `conta-externa.repository.ts` › ligacao › `suspenso: linha.eliminacaoAgendadaEm !== null` | `sessao-externa.int.test.ts` › `eliminação agendada: a professora ligada, com a conta do provedor certa, recebe a falha acesso_suspenso e nenhuma sessão nasce; cancelada, entra` |
| `pedidos.repository.ts` › cancelar › `eliminarEm > now()` | `eliminacao-agendada.int.test.ts` › `depois de eliminar_em o cancelamento é recusado, e a pessoa segue suspensa: o prazo é do pedido, não do clique` |
| `pedidos.repository.ts` › cancelar › `isNull(pedidoTitular.eliminacaoEnfileiradaEm)` | `eliminacao-agendada.int.test.ts` › `com a eliminação já enfileirada o cancelamento é recusado, mesmo dentro do prazo` |
| `pedidos.repository.ts` › cancelar › `eq(pedidoTitular.estado, 'agendado')` | `eliminacao-agendada.int.test.ts` › `cancela o pedido com quem e quando, devolve o acesso e audita sem dado de pessoa; o clique duplo não cancela nem audita de novo` |
| `pedidos.repository.ts` › cancelar › `eq(pedidoTitular.escolaId, exigirEscolaDoContexto())` | `eliminacao-agendada.int.test.ts` › `cancelar, suspender e devolver o acesso, com o contexto de A e o id de B, não encontram a linha nem mudam nada` |
| `pedidos.repository.ts` › registrar › `make_interval(days => PRAZO_DA_ELIMINACAO_DIAS)` | `eliminacao-agendada.int.test.ts` › `agenda o pedido para 7 dias, suspende o acesso e encerra as sessões da pessoa com o motivo, sem tocar nas dos colegas` |
| `pedidos.repository.ts` › registrar › `pedido.estado === 'agendado' ? { eliminarEm }` | `eliminacao-agendada.int.test.ts` › `agenda o pedido para 7 dias, suspende o acesso e encerra as sessões da pessoa com o motivo, sem tocar nas dos colegas` |
| `privacidade.service.ts` › #gravarPedido › `code === '23505' && constraint === 'pedido_titular_agendado_unico'` | `eliminacao-agendada.int.test.ts` › `uma segunda eliminação do mesmo titular, com outra chave, é recusada sem gravar nada: o pedido agendado é um só` |
| `privacidade.service.ts` › registrarPedido › `agendarEliminacao(titular.id, tx)` | `eliminacao-agendada.int.test.ts` › `agenda o pedido para 7 dias, suspende o acesso e encerra as sessões da pessoa com o motivo, sem tocar nas dos colegas` |
| `privacidade.service.ts` › cancelarPedido › `cancelarEliminacao(cancelado.titularId, tx)` | `eliminacao-agendada.int.test.ts` › `cancelar devolve o acesso com a mesma senha, e o que foi encerrado não volta: token e cookie de antes seguem recusados` |
| `privacidade.service.ts` › cancelarPedido › `if (cancelado === undefined) throw PEDIDO_EM_ESTADO_INVALIDO` | `eliminacao-agendada.int.test.ts` › `cancela o pedido com quem e quando, devolve o acesso e audita sem dado de pessoa; o clique duplo não cancela nem audita de novo` |
| `privacidade.service.ts` › registrarPedido › `pedido.tipo === 'eliminacao' ? 'agendado'` | `eliminacao-agendada.int.test.ts` › `agenda o pedido para 7 dias, suspende o acesso e encerra as sessões da pessoa com o motivo, sem tocar nas dos colegas` |
| `expurgo-da-escola.repository.ts` › PESSOAS_DESATIVADAS › `eliminacao_agendada_em is null` | `expurgo-da-escola.int.test.ts` › `a pessoa agendada não ocupa o lote: com o limite de 1 e a mais antiga agendada, pelo pedido ou pela marca, quem sai é a seguinte` |
| `expurgo-da-escola.repository.ts` › PESSOAS_DESATIVADAS › `not exists (… p.estado = 'agendado')` | `expurgo-da-escola.int.test.ts` › `a pessoa agendada não ocupa o lote: com o limite de 1 e a mais antiga agendada, pelo pedido ou pela marca, quem sai é a seguinte` |
| `expurgo-da-escola.repository.ts` › #eliminarPessoasDesativadas › `${usuario.eliminacaoAgendadaEm} is null` | `expurgo-da-escola.int.test.ts` › `a eliminação agendada entre a escolha do lote e a trava também protege: a pessoa fica, sem auditoria, e a seguinte sai` |
| `expurgo-da-escola.repository.ts` › #eliminarPessoasDesativadas › `not exists (… p.estado = 'agendado')` | `expurgo-da-escola.int.test.ts` › `o pedido agendado registrado depois da escolha do lote, e antes da trava da própria pessoa, também a protege: a trava relê o pedido` |
| `arquivo-do-titular.repository.ts` › contaAtiva › `linha.eliminacaoAgendadaEm === null` | `arquivo-do-titular.int.test.ts` › `com a eliminação agendada o titular não tem conta ativa: o job faz a versão da escola, e ela vale enquanto a eliminação segue agendada` |
| `renovacao.service.ts` › #decidir › `achada.pelo === 'atual'` | `eliminacao-agendada.int.test.ts` › `renovação: o cookie vencido por inatividade ou pelas 12 h, encerrado por saída ou já rotacionado, de quem tem a eliminação agendada, responde 401 e apaga o cookie, como o desconhecido: nunca ACESSO_SUSPENSO` |
| `renovacao.service.ts` › #decidir › `achada.encerradaEm === null` | `eliminacao-agendada.int.test.ts` › `a guarda e a renovação recusam pela marca do usuário, mesmo com a sessão ainda aberta: a recusa não depende de o registro ter encerrado a sessão` |
| `renovacao.service.ts` › #decidir › `achada.motivo === 'eliminacao_agendada'` | `eliminacao-agendada.int.test.ts` › `renovação: o cookie de quem tem a eliminação agendada dá ACESSO_SUSPENSO e é apagado; o do colega renova; o cookie qualquer dá 401` |
| `renovacao.service.ts` › #decidir › `sessaoAindaVale({ ...achada, encerradaEm: null, eliminacaoAgendadaEm: null })` | `eliminacao-agendada.int.test.ts` › `renovação: o cookie vencido por inatividade ou pelas 12 h, encerrado por saída ou já rotacionado, de quem tem a eliminação agendada, responde 401 e apaga o cookie, como o desconhecido: nunca ACESSO_SUSPENSO` |
| `resolucao-de-tenant.repository.ts` › sessaoParaRenovar › `motivo: sessao.motivo` | `eliminacao-agendada.int.test.ts` › `renovação: o cookie de quem tem a eliminação agendada dá ACESSO_SUSPENSO e é apagado; o do colega renova; o cookie qualquer dá 401` |
| `mensagens.ts` › mensagemDaFalhaExterna › `if (valor === 'acesso_suspenso')` | `mensagens.test.ts` › `a conta suspensa pela eliminação agendada tem o texto do catálogo, e não o do provedor (F3, 14.0)` |
| `login.service.ts` › ramo suspenso do e-mail › `await contador.zerar(chave)` | `eliminacao-agendada.int.test.ts` › `a conta só com A agendada: a senha certa recebe ACESSO_SUSPENSO e a errada, a resposta de sempre` |
| `matricula.service.ts` › entrar › ramo `credencial.suspenso` › `gravarFalha(ipParaRegistro(origem.ip))` | `eliminacao-agendada.int.test.ts` › `login por matrícula: a senha certa dá ACESSO_SUSPENSO, sem cookie e sem sessão nova; a senha errada é a de sempre` |

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | `temAcessoSuspenso`: os filtros `isNull(desativadoEm)` e `ne(papel, 'aluno')` sem teste que os derrube | `TODO.md`, item "Ressalvas da 14.0", (i): o login só chega ao método sem usuário ativo que possa entrar; os filtros são defensivos |
| test-engineer (1ª) | `Cache-Control: no-store` e o corpo vazio (`esquemaPedidoSemCorpo`) do `cancelar` não afirmados | `TODO.md`, item "Ressalvas da 14.0", (ii) |
| test-engineer (1ª), infra-guardian (1ª), revisor-geral (1ª) | os [P] usam `Promise.all` sem `GatilhoDeParada`/`esperarNaTrava` | `TODO.md`, item "Ressalvas da 14.0", (iii): a regra decide no `where` do `update` e no único parcial, e cada um tem mutação vermelha na tabela "Mutações"; forçar o entrelaçamento pede três testes com trava |
| infra-guardian (1ª) | [P] da eliminação com a mesma chave de envio nas duas chamadas | `TODO.md`, item "Ressalvas da 14.0", (iv): o teste pode mostrar um defeito de idempotência, e isso pede decisão de desenho (o que o reenvio recebe), que não cabe numa correção desta rodada |
| infra-guardian (1ª), revisor-geral (1ª) | o ramo suspenso do login por e-mail não grava `gravarFalha`, e o da matrícula e o da conta externa gravam | `TODO.md`, item "Ressalvas da 14.0", (v): muda o registro de acesso (Marco Civil, art. 15) e pede teste do registro com escola nula, que não é determinístico com as outras suítes no mesmo banco |
| infra-guardian (1ª) | `temAcessoSuspenso` roda fora do `.catch` que desfaz a reserva do contador | `TODO.md`, item "Ressalvas da 14.0", (vi): é uma tentativa a mais contada quando o banco cai bem ali; prova só com injeção de falha |
| infra-guardian (1ª) | separar `suspensa` na métrica da renovação | `TODO.md`, item "Ressalvas da 14.0", (vii): muda o rótulo de uma métrica que o alerta de reuso lê |
| tenancy-guardian (1ª) | 26 `@SemEscopo` em `resolucao-de-tenant.repository.ts`, acima do limite da regra 10, item 9 | `/retro` do F3: decidir se o repository vira exceção declarada da regra ou se parte em módulos |
| revisor-geral (1ª) | a tela "Login suspenso" não está em nenhuma tarefa da 15.0 à 19.0, e o 403 da renovação cai em `indisponivel` (`apps/web/src/api/sessao.ts`) | registrado no bloco da `techspec.md` (item 4); o Arquiteto aloca a tela em uma tarefa antes da validação |
| privacy-guardian (2ª), tenancy-guardian (2ª), infra-guardian (2ª), revisor-geral (2ª) | A sessão que um agendamento anterior (já cancelado) encerrou com `motivo = 'eliminacao_agendada'` volta a receber `ACESSO_SUSPENSO`, e não o 401, se a pessoa for agendada de novo dentro das 12 h e da inatividade. Comparar `encerradaEm` da sessão com o `eliminacaoAgendadaEm` atual do usuário e cobrir com teste (cancelar, agendar de novo, usar o cookie antigo) | `TODO.md`, item "Ressalvas da 14.0", como **(viii)**. Risco pequeno: o cookie é da própria pessoa, da mesma escola, e a janela é de no máximo 12 h; os quatro revisores aprovaram com isso dito |
| privacy-guardian (2ª) | Teste da inatividade na fronteira (logo depois de "inatividade do papel + tolerância"), em vez de `now() - 1 day` | `TODO.md`, item "Ressalvas da 14.0", como **(ix)**: a conta é a mesma de `sessaoAindaVale`, que a guarda já prova na fronteira em `avaliar-sessao.test.ts` |
| test-engineer (2ª) | No teste do aluno transferido, comparar também o `setCookie` da renovação com o do desconhecido | `TODO.md`, item "Ressalvas da 14.0", como **(x)**. **Não mexa no teste agora**: mudança em arquivo de teste caduca a aprovação do `test-engineer` e do `revisor-geral`, e custaria uma rodada |
| test-engineer (2ª) | Comentário no teste do transferido dizendo que é cenário de comportamento (passa por duas defesas: o motivo `desativacao` e `desativadoEm` em `sessaoAindaVale`), e não a prova de uma cláusula | `TODO.md`, item "Ressalvas da 14.0", como **(x)**, junto da linha anterior; comentário em `.test.ts` também caduca o `revisor-geral` |
| revisor-geral (2ª) | Em `14_task.md`, a linha da renovação na tabela "Divergências resolvidas" aponta para `techspec.md` §4 ("Login suspenso"), que não fala da renovação; o texto está na §5, bloco "Tarefa 14.0, como ficou no código" | Corrigir o ponteiro **no próprio commit**: só `.md`, não caduca rodada nem carimbo |
| revisor-geral (2ª) | `techspec.md:34` (tabela de módulos) diz que "guarda, logins e renovação recusam `eliminacao_agendada_em` com `ACESSO_SUSPENSO`", e a guarda responde 401 | Ajustar o texto **no próprio commit**, para "a guarda recusa com 401; logins e renovação, com `ACESSO_SUSPENSO` depois da credencial": só `.md`, não caduca |
| revisor-geral (2ª) | O bloco "Tarefa 14.0" ficou na §5, e a ordem o pedia na §3 e na §4 | Recusada: o conteúdo está na spec, e a §5 é onde o fluxo da eliminação mora; não contradiz a §4 |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-10 03:49:21 | 2026-10-10 03:52:32 | `test-engineer` | 1 | REPROVADO | ab82100391d6b80d5 |
| 2026-10-10 03:53:03 | 2026-10-10 03:54:19 | `tenancy-guardian` | 1 | APROVADO | af324ddd7197b7df5 |
| 2026-10-10 03:53:09 | 2026-10-10 03:54:26 | `privacy-guardian` | 1 | REPROVADO | ab7a15b0862256b2c |
| 2026-10-10 03:53:15 | 2026-10-10 03:56:08 | `infra-guardian` | 1 | APROVADO | ae988e6c2c99fd400 |
| 2026-10-10 03:52:57 | 2026-10-10 03:56:54 | `revisor-geral` | 1 | REPROVADO | abdd8976050886e14 |
| 2026-10-10 04:11:18 | 2026-10-10 04:12:15 | `test-engineer` | 2 | APROVADO | a2ca884ec7e0a6d08 |
| 2026-10-10 04:13:00 | 2026-10-10 04:13:29 | `tenancy-guardian` | 2 | APROVADO | a766a9ca8ad8c31c2 |
| 2026-10-10 04:12:44 | 2026-10-10 04:13:44 | `revisor-geral` | 2 | APROVADO | aaab0717eab89a543 |
| 2026-10-10 04:13:32 | 2026-10-10 04:13:59 | `infra-guardian` | 2 | APROVADO | af0c61e0bf0e5af0e |
| 2026-10-10 04:13:18 | 2026-10-10 04:14:08 | `privacy-guardian` | 2 | APROVADO | a2cba97faf77fc6f8 |
