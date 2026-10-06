# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-10-05 14:43:51 | `llm-integrator` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | A anonimização de `execucao_agente` viola checks que já existem no banco. |
| 2026-10-05 14:44:12 | `tenancy-guardian` | 1ª | REPROVADO | `revisao-spec` | Seções 2, 6, 11 e 13 (mover o `CicloDeVidaService` para `packages/nucleo`). |
| 2026-10-05 14:44:18 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | RF2 sem teste de integração (seções 10 e 6). "Piso e teto" em unidade não prova o comando: um `ops:retencao` que pula a validação passa no teste. Correção… |
| 2026-10-05 14:44:36 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | Não dá para saber de quem é o pedido (seções 4, 7 e 9). |
| 2026-10-05 14:45:08 | `conformidade-reviewer` | 1ª | REPROVADO | `revisao-spec` | Seção 5 "Arquivo", seção 7b e seção 10 (Unidade). A versão `coordenacao` exclui só a "conversa do professor", e o catálogo da seção 3 define isso como… |
| 2026-10-05 14:45:48 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | Seção 7c, "Corridas de concorrência". A spec manda verificar o pedido `agendado` antes da `chave_envio`. Na eliminação, o clique duplo ou o reenvio depois de a… |
| 2026-10-05 14:45:56 | `privacy-guardian` | 1ª | REPROVADO | `revisao-spec` | Seção 4 (`GET titulares/:id/previa` e `GET pedidos/:id`) e seção 7 (o que entra em auditoria). |
| 2026-10-05 14:59:55 | `frontend-reviewer` | 2ª | AJUSTES NECESSÁRIOS | `revisao-spec` | O que está errado: o diálogo de confirmação promete "a prévia e o aviso de homônimo". Mas `homonimo` só existe como coluna de `pedido_titular` (seção 3, linha… |
| 2026-10-05 14:59:58 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | O rate limit da busca perdeu o teste (seção 7c e `cenarios.md`, Transversais). |
| 2026-10-05 15:00:00 | `llm-integrator` | 2ª | AJUSTES NECESSÁRIOS | `revisao-spec` | Onde: `techspec.md:94-95`, `techspec.md:168-169` e `cenarios.md:91`. |
| 2026-10-05 15:00:02 | `tenancy-guardian` | 2ª | REPROVADO | `revisao-spec` | `techspec.md:216-217` (seção 6), `:114`, `:115` e `:164-171`: a escola lê `suboperador` e `incidente` sem repository declarado, e o compartilhamento pode citar… |
| 2026-10-05 15:00:51 | `infra-guardian` | 2ª | REPROVADO | `revisao-spec` | `techspec.md:135-136`, `:139` e `:251`, com a migration em `:73-97`. A chave de idempotência "escola + noite" não existe em lugar nenhum: |
| 2026-10-05 15:01:02 | `privacy-guardian` | 2ª | REPROVADO | `revisao-spec` | da rodada 1, um a um |
| 2026-10-05 15:01:58 | `conformidade-reviewer` | 2ª | REPROVADO | `revisao-spec` | O que a coordenação vê de um professor ainda separa quem usou a IA de quem não usou (D64; regra 70, itens 8 e 9). |
| 2026-10-05 15:14:07 | `tenancy-guardian` | 3ª | APROVADO | `revisao-spec` | `cenarios.md:200`: hoje quatro caminhos tocam `suboperador` e `incidente`: os dois da operação e os dois da escola. "Terceiro caminho" está errado; o certo é… |
| 2026-10-05 15:14:08 | `frontend-reviewer` | 3ª | APROVADO | `revisao-spec` | techspec seção 13 (linha 369) diz que "a tela de Corrigir nome avisa" que o nome anterior a uma correção só sai pelo expurgo, mas a seção 9 (linha 314) não… |
| 2026-10-05 15:14:14 | `test-engineer` | 3ª | REPROVADO | `revisao-spec` | O segundo check de `consumo_ia.provedor` não tem cenário. Fica em `techspec.md:103-104`, seção 3, Migration 0024, e o cenário que falta seria em… |
| 2026-10-05 15:14:19 | `conformidade-reviewer` | 3ª | APROVADO | `revisao-spec` | da rodada 2 que entraram: RF15 agora diz "só se houve troca" (`prd.md:65`). O texto "Em as duas versões" foi corrigido. O arquivo do aluno não traz o conteúdo… |
| 2026-10-05 15:14:34 | `privacy-guardian` | 3ª | APROVADO | `revisao-spec` | techspec seção 4, GET pedidos: dizer que pedidos.listados e pedido.lido gravam na mesma transação da leitura, como turma.lista_lida em… |
| 2026-10-05 15:14:45 | `llm-integrator` | 3ª | APROVADO | `revisao-spec` | Seção 3 e seção 7c ("Migration ... compatível"): o corte do check e a versão anterior do código. |
| 2026-10-05 15:15:13 | `infra-guardian` | 3ª | REPROVADO | `revisao-spec` | Seção 3, l.103-104, e seção 7c, l.290 ("Migration: compatível") |
| 2026-10-05 15:17:05 | `test-engineer` | 4ª | REPROVADO | `revisao-spec` | O autor da etapa 3 não tem cenário. A regra está em `techspec.md:228-229` (seção 5, eliminação, etapa 3). O texto novo diz que o autor é quem registrou, se… |
| 2026-10-05 15:18:44 | `infra-guardian` | 4ª | REPROVADO | `revisao-spec` | `techspec.md:119-122` (seção 3), `techspec.md:298` (7c) e `cenarios.md:62-63`. |
| 2026-10-05 15:20:05 | `test-engineer` | 5ª | REPROVADO | `revisao-spec` | `expurgo_execucao.concluida` não tem cenário, e o texto que a define é ambíguo. Locais: `techspec.md:100` (seção 3), `techspec.md:174` e `:304` (seções 5 e… |
| 2026-10-05 15:20:06 | `infra-guardian` | 5ª | APROVADO | `revisao-spec` | `techspec.md:100` (seção 3), definição de `expurgo_execucao.concluida`. O texto "a categoria terminou ou parou pela janela" admite duas leituras. Lido como… |
| 2026-10-05 15:20:51 | `test-engineer` | 6ª | APROVADO | `revisao-spec` | O [I] não prova que a noite seguinte começa pela pendente (`cenarios.md:41-43`, seção 5 em `techspec.md:174`). As categorias anteriores já terminaram, então um… |
| 2026-10-05 15:30:46 | `test-engineer` | 7ª | SEM VEREDITO | `revisao-spec` | Nenhum cenário de `cenarios.md` ficou sem tarefa. Seis linhas reúnem várias regras de tarefas diferentes e não cabem inteiras em nenhuma. Dividi cada uma em… |
| 2026-10-05 17:03:23 | `test-engineer` | 1ª | REPROVADO | `1_task` | `packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.repository.ts:107`: tirei `eq(vinculo.usuarioId, usuarioId)` do `vinculoQueSegura` e os 35 testes de… |
| 2026-10-05 17:19:18 | `test-engineer` | 2ª | APROVADO | `1_task` | No teste do colega (`apps/api/test/acesso-fim-do-vinculo.int.test.ts:171-208`), com a mutação 1 o teste quebra já na metade do encerrar. A metade do eliminar… |
| 2026-10-05 17:20:41 | `tenancy-guardian` | 1ª | APROVADO | `1_task` | O módulo `packages/nucleo/src/ciclo-de-vida` reúne três `@SemEscopo` na `ContaGlobalRepository`. É exatamente o limite que a regra 10, item 9 aponta como sinal… |
| 2026-10-05 17:20:47 | `privacy-guardian` | 1ª | APROVADO | `1_task` | Erro dentro da transação de quem chama. Sem ponto de salvamento, um erro de SQL no `desativar` ou no `eliminar` aborta a transação inteira de quem chama. A… |
| 2026-10-05 17:21:02 | `revisor-geral` | 1ª | APROVADO | `1_task` | `docs/modelo-de-dados.md:58` ainda diz que a `ResolucaoDeTenantRepository` é o "único módulo autorizado a consultar sem escopo", e a frase seguinte, escrita… |
| 2026-10-05 17:34:53 | `test-engineer` | 3ª | APROVADO | `1_task` | O JSDoc do `CicloDeVidaService` (`packages/nucleo/src/ciclo-de-vida/ciclo-de-vida.service.ts`, linhas 35–36) diz que quem elimina em lote usa uma transação por… |
| 2026-10-05 17:47:09 | `revisor-geral` | 2ª | APROVADO | `1_task` | `docs/modelo-de-dados.md`, linhas 413–414: a frase "as três escritas na `Conta` (travar, limpar a conta sem uso e encerrar as sessões dela)" não é exata.… |
| 2026-10-05 19:51:33 | `test-engineer` | 1ª | REPROVADO | `2_task` | Nenhum teste prova que `ops:retencao` recusa `OPERADOR` inexistente ou desativado. |
| 2026-10-05 20:47:43 | `test-engineer` | 2ª | APROVADO | `2_task` | `ops-operador.int.test.ts:259`: o `passou` de `retencao listar` poderia conferir que a saída traz as doze categorias, e não só o código 0. Não bloqueia:… |
| 2026-10-05 20:48:53 | `tenancy-guardian` | 1ª | APROVADO | `2_task` | `apps/api/test/retencao.int.test.ts:234`: o teste de isolamento confere só a auditoria de B. Vale conferir também que a auditoria de A não leva o ajuste de B,… |
| 2026-10-05 20:49:48 | `revisor-geral` | 1ª | APROVADO | `2_task` | Texto do prazo da equipe Turmma. Em `packages/shared/src/privacidade/retencao.ts:96`, o prazo de `equipe_turmma` diz "registro, 5 anos". O `docs/lgpd.md:95` e… |
| 2026-10-05 20:50:20 | `privacy-guardian` | 1ª | APROVADO | `2_task` | A ligação ao aluno não alcança o que está em jsonb, e precisa estar resolvida antes da tarefa 13.0. |
| 2026-10-05 21:05:30 | `test-engineer` | 3ª | APROVADO | `2_task` | A linha 99 da seção "Mutações" em `tasks/prd-lgpd-e-titular/2_task.md` ainda cita `eq(retencaoEscola.escolaId, this.#escolaId())`, e esse método não existe… |
| 2026-10-05 21:06:20 | `privacy-guardian` | 2ª | APROVADO | `2_task` | nenhuma nova. As quatro da 1ª rodada continuam valendo e precisam ser fechadas na 13.0. |
| 2026-10-06 00:44:57 | `test-engineer` | 1ª | APROVADO | `3_task` | Cláusulas novas sem linha na seção "Mutações". Cada uma pede declaração de equivalente ou um teste: |
| 2026-10-06 00:46:13 | `tenancy-guardian` | 1ª | APROVADO | `3_task` | A justificativa do `@SemEscopo` em `packages/nucleo/src/rotina/escolas-da-rotina.repository.ts:18` fala só da "rotina noturna", mas a `MedicaoDoExpurgo` também… |
| 2026-10-06 00:46:41 | `privacy-guardian` | 1ª | APROVADO | `3_task` | `expurgo_execucao` não guarda o prazo em meses que foi aplicado. Com o ajuste por escola pelo `ops:retencao`, gravar `meses` na linha deixaria a escola… |
| 2026-10-06 00:47:23 | `infra-guardian` | 1ª | APROVADO | `3_task` | Em `packages/nucleo/drizzle/0025_expurgo_execucao.sql`, linha final: `ADD CONSTRAINT job_registro_chave_so_com_escola CHECK` percorre `job_registro` inteira… |
| 2026-10-06 00:48:02 | `revisor-geral` | 1ª | REPROVADO | `3_task` | O alerta não dispara para a escola cujo expurgo falha desde a primeira noite. |
| 2026-10-06 01:34:10 | `test-engineer` | 2ª | REPROVADO | `3_task` | `apps/worker/test/expurgo-da-escola.int.test.ts:413-441` e `:443-451`: o cenário exato da correção exigida (falha no primeiro lote, duas noites desde a… |
| 2026-10-06 02:15:50 | `test-engineer` | 3ª | APROVADO | `3_task` | Os testes de `:413` e `:443` repetem igualzinho a montagem de `MedicaoDoExpurgo`, e o `describe` de medição já tem a mesma montagem em `medicaoDe`. Vale levar… |
| 2026-10-06 02:16:38 | `tenancy-guardian` | 2ª | APROVADO | `3_task` | A minha recomendação 2 da rodada anterior (as cláusulas `escola_id` repetidas no `delete` externo e no `select` interno de `APAGAR_LOTE`) ficou registrada em… |
| 2026-10-06 02:16:50 | `privacy-guardian` | 2ª | APROVADO | `3_task` | No novo `catch` (`apps/worker/src/processadores/expurgar-escola.ts:80`), a falha ao gravar a linha `false` some sem rastro. Um `logger.warn({ evento:… |
| 2026-10-06 02:16:55 | `revisor-geral` | 2ª | APROVADO | `3_task` | `expurgar-escola.ts`, no `catch`: o `.catch(() => undefined)` descarta em silêncio a falha ao gravar a linha `false`. Um `logger.warn` só com o evento, sem a… |
| 2026-10-06 02:17:05 | `infra-guardian` | 2ª | APROVADO | `3_task` | `apps/worker/src/processadores/expurgar-escola.ts:80`: a linha `false` gravada pela falha entra em `categoriaPendente` do mesmo jeito que a da janela. A noite… |
| 2026-10-06 02:57:50 | `test-engineer` | 4ª | APROVADO | `3_task` | O comentário novo de `apps/worker/src/processadores/expurgar-escola.ts:78-81` diz que, se a gravação da janela letiva falhar, o `catch` tenta a mesma linha de… |
| 2026-10-06 02:58:23 | `revisor-geral` | 3ª | APROVADO | `3_task` | `expurgar-escola.ts:88`: se o `registrar(..., true, ...)` falhar, por estar fora do `try`, a categoria fica sem linha nenhuma. Pela causa 2 do runbook, isso… |
| 2026-10-06 02:58:31 | `privacy-guardian` | 3ª | APROVADO | `3_task` | nenhuma nova. A causa 3 do runbook (`docs/runbook.md:464-470`) e o `TODO.md` descrevem o comportamento novo sem expor dado pessoal. |
| 2026-10-06 02:58:31 | `infra-guardian` | 3ª | APROVADO | `3_task` | nenhuma nova. Das duas que deixei na rodada anterior, a 1 está registrada em `TODO.md` (seção "Infra e operação") e o runbook a cita na causa 3. A 2 foi… |
