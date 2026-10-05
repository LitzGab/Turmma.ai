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
