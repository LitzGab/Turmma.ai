# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-09-25 22:42:41 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | Seção 7c, linha "Rate limit": o limite de tentativas usa o código errado, trava a turma inteira e não diz ao aluno o que fazer. |
| 2026-09-25 22:42:48 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | Techspec §10: a estratégia de testes não prova cada RF. |
| 2026-09-25 22:42:59 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | Seção 7c, "Rate limit": o limite de código errado (30 por escola em 10 min, recusando com `TEMPO_ESGOTADO`) tranca a entrada por código da escola inteira. |
| 2026-09-25 22:43:31 | `tenancy-guardian` | 1ª | REPROVADO | `revisao-spec` | Seções 2 e 6: onde a resolução sem escopo é chamada. As rotas públicas ficam no módulo novo `apps/api/src/sala` e resolvem o acesso chamando… |
| 2026-09-25 22:43:46 | `privacy-guardian` | 1ª | REPROVADO | `revisao-spec` | A coordenação lê os pedidos pendentes sem auditoria (`techspec.md`, seção 4, linha 64; seção 7, linha 108). |
| 2026-09-25 23:21:39 | `frontend-reviewer` | 2ª | AJUSTES NECESSÁRIOS | `revisao-spec` | `cenarios.md` W9 (e a linha "Pública" da tabela da §9): o texto de `NAO_ENCONTRADO` manda o aluno que só digitou errado chamar o professor. |
| 2026-09-25 23:22:05 | `tenancy-guardian` | 2ª | REPROVADO | `revisao-spec` | `techspec.md:79-81` (§5, passo 4) e `techspec.md:141-147` (tabela de limites): a leitura que decide se a falha conta no limite por nome não tem escopo… |
| 2026-09-25 23:22:21 | `privacy-guardian` | 2ª | APROVADO | `revisao-spec` | A conta global de professor, quarto afrouxamento da D71, ainda não está registrada em lugar nenhum: não aparece na D71, no TODO.md nem no ROADMAP.md. O… |
| 2026-09-25 23:22:49 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | §5, passo 4 (techspec.md:79-81), contra o C2 (cenarios.md:168-169): o reenvio em paralelo com a mesma chave recebe `REIVINDICACAO_RECUSADA`, e não `enviado`. |
| 2026-09-25 23:24:45 | `infra-guardian` | 2ª | REPROVADO | `revisao-spec` | techspec.md:79-81 (§5 passo 4) contra cenarios.md:168-169 (C2): o mesmo envio repetido em paralelo recebe `REIVINDICACAO_RECUSADA`. |
| 2026-09-26 02:18:55 | `frontend-reviewer` | 3ª | APROVADO | `revisao-spec` | Pedidos da coordenação, sem saída no vazio (W4): o vazio da tela Pedidos aponta para Acesso, mas a coordenação não alcança Acesso (P2), então o botão leva a… |
| 2026-09-26 02:19:22 | `tenancy-guardian` | 3ª | APROVADO | `revisao-spec` | "Quebra sem" do I10 e do I5 (cenarios.md, linhas 52-53 e 28): tirar só a escola ou só o ano não deixa o teste vermelho, porque `turma_id` é UUID global e a… |
| 2026-09-26 02:19:54 | `infra-guardian` | 3ª | REPROVADO | `revisao-spec` | `techspec.md:84-87` (§5 passo 4) contra `cenarios.md:204-209` (C2): a resposta ao reenvio em paralelo depende da ordem física dos índices. |
| 2026-09-26 02:20:10 | `test-engineer` | 3ª | REPROVADO | `revisao-spec` | techspec.md:36 e techspec.md:84-87, contra cenarios.md:204-209 (C2). O desenho ainda pode recusar o reenvio com a mesma chave. |
| 2026-09-26 02:20:18 | `privacy-guardian` | 3ª | REPROVADO | `revisao-spec` | Uso novo e guarda nova do IP, sem estar no `docs/lgpd.md`, em `docs/runbook.md:388-392` e `:397-398`, e em `docs/lgpd.md:98-105`. |
| 2026-09-26 02:27:57 | `privacy-guardian` | 4ª | APROVADO | `revisao-spec` | A4 (cenarios.md:309): pôr o IP na lista do que o log capturado não pode ter, já que o runbook conta com um log sala.limite_atingido sem IP |
| 2026-09-26 02:29:01 | `infra-guardian` | 4ª | REPROVADO | `revisao-spec` | `docs/runbook.md:394-395`, seção "Código da turma errado em massa numa escola", "Primeiro olhar", junto com a §6 e a linha "Alerta" da §7c da Tech Spec: não… |
| 2026-09-26 02:29:49 | `test-engineer` | 4ª | REPROVADO | `revisao-spec` | `cenarios.md:215-223` (C2, jeito (c)): nada força o segundo envio a passar pela leitura inicial antes de o primeiro gravar. |
| 2026-09-26 02:31:27 | `infra-guardian` | 5ª | APROVADO | `revisao-spec` | O E29 manda o id que não é UUID para `NAO_ENCONTRADO`. Os comandos que já existem (`apps/api/src/ops/revogar-convite.ts:27-31`) tratam argumento malformado… |
| 2026-09-26 02:33:02 | `test-engineer` | 5ª | APROVADO | `revisao-spec` | C11, "Quebra sem" (`cenarios.md:253-254`): tirar só o `for share` do gerar não deixa o teste vermelho. |
| 2026-09-26 10:55:08 | `test-engineer` | 1ª | APROVADO | `1_task` | P1 com o professor dono da turma (`escola-montada.int.test.ts:227-230`). Hoje o P1 usa `a.turma` e `a.disciplina`, com as quais o professor não tem vínculo. O… |
| 2026-09-26 11:05:58 | `test-engineer` | 2ª | APROVADO | `1_task` | nenhuma nova. |
| 2026-09-26 11:07:08 | `tenancy-guardian` | 1ª | APROVADO | `1_task` | `apps/api/src/estrutura/turma.service.ts`, no `renomear`: o `throw new Error('série da turma não encontrada')` é um erro sem tipo (regra 00, item 9). Hoje o… |
| 2026-09-26 11:07:19 | `revisor-geral` | 1ª | APROVADO | `1_task` | `apps/api/src/estrutura/turma.service.ts:37-38`: o comentário da classe ainda diz "Sem ano em curso, as duas rotas falham fechadas". Agora são quatro, e o… |
| 2026-09-26 11:16:21 | `revisor-geral` | 2ª | APROVADO | `1_task` | A recomendação 2 ficou marcada para a tarefa 4.0, mas só está anotada no `tasks/prd-apresentacao-escola/1_task.md:128`. O… |
| 2026-09-26 12:13:48 | `test-engineer` | 1ª | APROVADO | `3_task` | Clique duplo em refazer. Não há teste de dois refazer do mesmo professor em paralelo. Pelo desenho (o refazer vai pelo `usuarioId`, sem o id do convite de… |
| 2026-09-26 12:26:04 | `test-engineer` | 2ª | APROVADO | `3_task` | Em `3_task.md`, seção "Mutações", falta a linha do `corpo ?? {}` de `professores.controller.ts:35,44`, que seria derrubado pelo teste "refazer e revogar sem… |
| 2026-09-26 12:45:45 | `infra-guardian` | 1ª | APROVADO | `3_task` | `apps/api/src/professores/professores.repository.ts:89`: a página percorre `(escola_id, id)` e descarta os usuários com `papel <> 'professor'`. Com os alunos… |
| 2026-09-26 12:45:47 | `privacy-guardian` | 1ª | APROVADO | `3_task` | Texto do limite do E11 em `tasks/prd-apresentacao-escola/3_task.md`, "Divergências". O "(o bilhete vale 30 min)" dá a entender que a janela dura 30 minutos. Na… |
| 2026-09-26 12:46:43 | `tenancy-guardian` | 1ª | APROVADO | `3_task` | `apps/api/src/professores/professores.repository.ts:98`: a escola na segunda consulta (convites) não tem teste que a derrube sozinha. Já está declarada em… |
| 2026-09-26 12:46:54 | `revisor-geral` | 1ª | REPROVADO | `3_task` | A alocação antes do aceite ficou anotada só na tarefa. Está em `tasks/prd-apresentacao-escola/3_task.md:116-120`. |
| 2026-09-26 12:58:49 | `test-engineer` | 3ª | APROVADO | `3_task` | No teste da linha 507, vale explicitar `expect([primeiro.status, segundo.status]).toEqual([201, 201])` antes do `parse`. Hoje o 201 é provado de forma… |
| 2026-09-26 13:18:35 | `revisor-geral` | 2ª | APROVADO | `3_task` | Em `apps/api/src/professores/professores.service.ts:16`, a linha do docblock ficou longa depois de trocar o caminho do arquivo. Vale quebrá-la como as vizinhas. |
| 2026-09-26 13:18:38 | `tenancy-guardian` | 2ª | APROVADO | `3_task` | nenhuma nova. Aceito a recusa da recomendação sobre o teste da escola na consulta de convites, pelo motivo dado: a FK composta impede montar o cenário. A… |
| 2026-09-26 13:18:40 | `infra-guardian` | 2ª | APROVADO | `3_task` | nenhuma nova. |
| 2026-09-26 13:18:58 | `privacy-guardian` | 2ª | APROVADO | `3_task` | nenhuma nova. Continua valendo, para a tarefa do dossiê (D61), decidir se `convite.aceito.usuarioAtivo` e `usuario.ativado_por_convite` saem da exportação ou… |
| 2026-09-26 14:38:25 | `test-engineer` | 1ª | APROVADO | `2_task` | Clique duplo no avulso e na retirada. Hoje as duas coisas só são testadas em sequência (`lista.int.test.ts:338` e `:367`). O mecanismo já está provado, porque… |
| 2026-09-26 14:48:33 | `test-engineer` | 2ª | APROVADO | `2_task` | Tabela de Mutações: não tem linha para os dois testes novos. |
| 2026-09-26 14:49:58 | `tenancy-guardian` | 1ª | APROVADO | `2_task` | A escola nas buscas de `naLista`, `quantasNaTurma` e `pagina`, e sozinha no `delete`, é segunda camada que nenhum teste isola: o ano é por escola e a turma é… |
| 2026-09-26 14:50:53 | `revisor-geral` | 1ª | APROVADO | `2_task` | Finalidade da leitura opcional no contrato. Está em `packages/shared/src/estrutura/lista.ts:95`, e o service a exige em `apps/api/src/estrutura/lista.service.ts… |
| 2026-09-26 14:51:12 | `privacy-guardian` | 1ª | APROVADO | `2_task` | docs/lgpd.md:72: pôr por extenso na linha "Lista de nomes da turma" o "quem gravou (vira nulo se a pessoa for eliminada; a auditoria guarda o id)", como já… |
| 2026-09-26 15:02:37 | `test-engineer` | 3ª | APROVADO | `2_task` | `packages/shared/src/estrutura/lista.test.ts` poderia ter um caso de unidade com `esquemaConsultaListaDaTurma.safeParse({})` falhando. Assim a mutação do… |
| 2026-09-26 15:03:13 | `revisor-geral` | 2ª | APROVADO | `2_task` | `apps/api/src/estrutura/leitor-da-lista.ts:114`: esta linha do docblock de `errosDasLinhas` passa da largura que o resto do arquivo usa. É só estética. |
| 2026-09-26 15:03:13 | `tenancy-guardian` | 2ª | APROVADO | `2_task` | nenhuma nova. Continua registrada para o `/retro` a da 1ª rodada, sobre a segunda camada de defesa. |
| 2026-09-26 15:03:26 | `privacy-guardian` | 2ª | APROVADO | `2_task` | nenhuma nova. Seguem as da 1ª rodada com o destino já registrado em "Recomendações sem aplicar" do 2_task.md: no-store e contagem na auditoria para o /retro,… |
| 2026-09-26 16:09:05 | `test-engineer` | 1ª | APROVADO | `4_task` | Justificativa errada no filtro de ano. `turma.repository.ts:73`, filtro `turma.anoLetivoId = exigirAnoEmCurso()` do `travarComVinculoDoProfessor`. |
| 2026-09-26 16:11:32 | `test-engineer` | 2ª | REPROVADO | `4_task` | `apps/api/test/acesso-da-turma.int.test.ts:490-502`: o teste "revogar ao mesmo tempo que outro professor gera um novo" é intermitente e afirma algo que o… |
| 2026-09-26 16:41:01 | `test-engineer` | 3ª | APROVADO | `4_task` | Em `:541`, trocar `registros.at(-1)` por um filtro `acao === 'acesso_turma.gerado'` e pegar o último. Hoje o teste depende de a ordem por `uuidv7` acompanhar a… |
| 2026-09-26 16:51:33 | `tenancy-guardian` | 1ª | APROVADO | `4_task` | Na 5.0, a busca pelo código precisa estar presa à escola do slug. O `codigo_hmac` é único só dentro da escola e usa a mesma chave para todas, então o mesmo… |
| 2026-09-26 16:52:22 | `privacy-guardian` | 1ª | APROVADO | `4_task` | Não há teste que prove que eliminar o professor anula o `criado_por` de `acesso_turma`. Esse FK foi escrito à mão em `packages/nucleo/drizzle/0020_acesso_turma.… |
| 2026-09-26 17:09:00 | `revisor-geral` | 1ª | APROVADO | `4_task` | `tasks/prd-apresentacao-escola/cenarios.md`: o E13 não diz que o GET sem acesso vigente devolve `{ expiraEm: null }`, nem que revogar sem acesso vigente é… |
| 2026-09-26 17:12:15 | `test-engineer` | 4ª | APROVADO | `4_task` | Números de linha da tabela de Mutações do `4_task.md`. As linhas do `acesso-da-turma.service.ts` estão deslocadas em +1 no código atual: `SORTEIOS_DO_CODIGO`… |
| 2026-09-26 17:51:01 | `tenancy-guardian` | 2ª | APROVADO | `4_task` | nenhuma nova. As duas da 1ª rodada continuam valendo e serão cobradas na auditoria da 5.0. |
| 2026-09-26 17:51:13 | `privacy-guardian` | 2ª | APROVADO | `4_task` | Na 5.0, a busca pelo código e pelo token deve devolver a mesma resposta para "não existe", "vencido", "revogado" e "de outra escola", e ter teste com o mesmo… |
| 2026-09-26 18:11:02 | `revisor-geral` | 2ª | APROVADO | `4_task` | `packages/shared/src/professores/professores.ts:32` ainda pega o token por `esquemaRespostaConviteDaCoordenacao.shape.token`. Agora que existe o… |
