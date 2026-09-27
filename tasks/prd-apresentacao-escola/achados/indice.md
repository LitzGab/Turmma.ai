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
| 2026-09-26 19:15:16 | `test-engineer` | 1ª | REPROVADO | `5_task` | O A4 não cobre o caminho do token nem o código do 404 em `salas/abrir`. Em `apps/api/test/escola-montada.int.test.ts:303-311`, a entrada da rota na varredura… |
| 2026-09-26 20:07:34 | `test-engineer` | 2ª | APROVADO | `5_task` | O HMAC do código não é sentinela do A4. Um log de `entrada.codigoHmac` no ramo do código do `AcessoDaSala` não ficaria vermelho. O risco é menor que o do hash… |
| 2026-09-26 20:08:47 | `revisor-geral` | 1ª | REPROVADO | `5_task` | `tasks/prd-apresentacao-escola/cenarios.md:152` (E17) e `:81` (R1). Duas divergências registradas em `5_task.md:124-133` criam regra nova e têm teste próprio,… |
| 2026-09-26 20:08:55 | `infra-guardian` | 1ª | APROVADO | `5_task` | Adivinhação de código até a 7.0. Hoje a busca pelo código (`apps/api/src/sessao/resolucao-de-tenant.repository.ts:505`) só tem o `rl:ip` anônimo de 3.000/min.… |
| 2026-09-26 20:08:58 | `tenancy-guardian` | 1ª | APROVADO | `5_task` | `naEscolaSemUsuario` ganhou o ano como terceiro argumento opcional (`apps/api/src/sessao/escola-sem-usuario.ts:10`). Um objeto nomeado (`{ escolaId,… |
| 2026-09-26 20:09:01 | `privacy-guardian` | 1ª | APROVADO | `5_task` | Adivinhar código de turma. Até a 7.0, o único freio contra quem tenta códigos em volume é o `rl:ip` anônimo. Quem sabe o slug de uma escola e usa muitos IPs… |
| 2026-09-26 20:20:59 | `test-engineer` | 3ª | APROVADO | `5_task` | Em `tasks/prd-apresentacao-escola/5_task.md:157`, a tabela de Mutações ainda aponta `acesso-da-sala.ts:36` para "o ano no contexto". Depois da retirada do… |
| 2026-09-26 20:21:43 | `revisor-geral` | 2ª | APROVADO | `5_task` | `apps/api/src/sessao/escola-sem-usuario.ts:12`: o ternário que monta o contexto repete `requisicaoId` e `escolaId` nos dois ramos. `{ requisicaoId, escolaId,… |
| 2026-09-26 20:22:06 | `privacy-guardian` | 2ª | APROVADO | `5_task` | Quando a asserção do `AcessoDaSala` entrar no `arquitetura.test.ts`, incluir também que o parâmetro `anoLetivoId` de `naEscolaSemUsuario` só é passado de… |
| 2026-09-26 20:22:07 | `infra-guardian` | 2ª | APROVADO | `5_task` | As três recomendações que você deixou pendentes na 1ª rodada continuam valendo e estão registradas. As duas primeiras estão em `TODO.md`, e a terceira fica… |
| 2026-09-26 20:31:43 | `test-engineer` | 4ª | APROVADO | `5_task` | nenhuma nova. As da 3ª rodada já foram aplicadas. |
| 2026-09-26 20:32:20 | `privacy-guardian` | 3ª | APROVADO | `5_task` | nenhuma nova. A da 2ª rodada (a trava no `arquitetura.test.ts`) continua pendente no `TODO.md` até a próxima tarefa que tocar o teste. |
| 2026-09-26 20:32:23 | `infra-guardian` | 3ª | APROVADO | `5_task` | nenhuma nova. |
| 2026-09-26 22:08:57 | `test-engineer` | 1ª | APROVADO | `6_task` | `salas-reivindicar.int.test.ts:309-319` (E23): `pedidosNaTransacao` igual a `[0]` não prova que o `insert` rodou antes da falha, embora o comentário da linha… |
| 2026-09-26 22:20:38 | `test-engineer` | 2ª | APROVADO | `6_task` | nenhuma nova. |
| 2026-09-26 22:21:35 | `tenancy-guardian` | 1ª | APROVADO | `6_task` | `apps/api/src/sala/reivindicacao.repository.ts:24-26` e `apps/api/src/sala/lista-livre.repository.ts:67-68`: nenhum teste quebra se escola e ano saírem daqui,… |
| 2026-09-26 22:22:22 | `privacy-guardian` | 1ª | APROVADO | `6_task` | Os contadores de matrícula errada por nome só chegam na 7.0. Até lá, adivinhar a matrícula de um nome esbarra só no `rl:ip` e no custo do hash. Não é… |
| 2026-09-26 22:22:32 | `revisor-geral` | 1ª | APROVADO | `6_task` | `apps/api/src/sala/salas.service.ts:126`: `entradaDaSala` virou função compartilhada, mas continua no arquivo do `SalasService`, e `reivindicacao.service.ts:9`… |
| 2026-09-26 22:22:44 | `infra-guardian` | 1ª | APROVADO | `6_task` | Alerta do semáforo mistura reivindicação e login. A reivindicação agora soma em `login.hash_recusado` e em `login.hash_espera`. O alerta `login-hash-recusado`… |
| 2026-09-26 22:36:05 | `test-engineer` | 3ª | APROVADO | `6_task` | A tarefa 10.0 (virada do ano) e a eliminação de aluno precisam fechar ou apagar o pedido pendente antes de apagar o nome. Se não fizerem isso, o 23514 sobe… |
| 2026-09-26 22:36:55 | `tenancy-guardian` | 2ª | APROVADO | `6_task` | nenhuma nova. A da 1ª rodada, o teste com a turma que não vem da linha do acesso, já está anotada no 8_task.md. |
| 2026-09-26 22:37:10 | `privacy-guardian` | 2ª | APROVADO | `6_task` | Na 10.0, o 23514 do `reivindicacao_pendente_com_nome` não deve chegar ao cliente como 500. Se a ordem das escritas quebrar num caminho futuro, o erro precisa… |
| 2026-09-26 22:37:13 | `infra-guardian` | 2ª | APROVADO | `6_task` | nenhuma nova. As duas da 1ª rodada seguem abertas no 9_task.md e no TODO.md. |
| 2026-09-26 22:37:14 | `revisor-geral` | 2ª | APROVADO | `6_task` | nenhuma nova. |
| 2026-09-27 00:09:19 | `test-engineer` | 1ª | REPROVADO | `7_task` | O teto do nome não vale com pedidos em paralelo, e nenhum teste de paralelo prova esse teto. |
| 2026-09-27 00:32:42 | `test-engineer` | 2ª | APROVADO | `7_task` | Uma errada ainda pode escapar da marca do E30. Uma errada que faça a leitura do nome livre depois que a certa leu a marca (`reivindicacao.service.ts:109`), mas… |
| 2026-09-27 00:34:26 | `privacy-guardian` | 1ª | APROVADO | `7_task` | `docs/lgpd.md:73`: a linha "Reivindicação" diz que a marca registra tentativa com matrícula errada "antes do pedido". Pelo `reivindicacao.service.ts:380`, a… |
| 2026-09-27 00:34:43 | `tenancy-guardian` | 1ª | APROVADO | `7_task` | `apps/api/src/sessao/acesso-da-sala.ts:54`: quem conhece o slug de uma escola percebe pelo tempo de resposta (a espera de 1 s) que ela está acima do teto de… |
| 2026-09-27 00:34:47 | `infra-guardian` | 1ª | APROVADO | `7_task` | apps/api/src/sala/limites-da-sala.ts:128 com packages/nucleo/src/limite/chaves.ts:80. Com o Redis de fila fora, o teto do nome vira max(1, floor(5 /… |
| 2026-09-27 00:35:01 | `revisor-geral` | 1ª | APROVADO | `7_task` | `tasks/prd-apresentacao-escola/cenarios.md:315`: o L6, escrito nesta tarefa, diz "porque a leitura depois da volta atrás confere também a matrícula". Isso… |
| 2026-09-27 00:46:54 | `test-engineer` | 3ª | APROVADO | `7_task` | `limites-da-sala.int.test.ts:109`: `linhasDeLog` só é zerado no L3, então nas outras linhas o isolamento entre testes depende do filtro por `escolaId`. Hoje… |
| 2026-09-27 00:47:47 | `test-engineer` | 4ª | APROVADO | `7_task` | Ordem da tabela em `tasks/prd-apresentacao-escola/7_task.md:232-233`: a linha da 3ª rodada ficou antes de uma linha da 1ª rodada do `test-engineer` (a de… |
| 2026-09-27 01:58:04 | `test-engineer` | 1ª | APROVADO | `8_task` | A trava do C3 não tem linha na seção "Mutações". Em `apps/api/src/sala/decisao.repository.ts:110`, o `.for('update')` é a única coisa que resolve o C3:… |
| 2026-09-27 02:09:21 | `test-engineer` | 2ª | APROVADO | `8_task` | O `.strict()` de `packages/shared/src/sala/pedidos.ts:19` agora tem teste que o derruba (o P3 com `escolaId`), mas não tem linha na seção "Mutações". Vale… |
| 2026-09-27 02:11:00 | `conformidade-reviewer` | 1ª | APROVADO | `8_task` | Texto da marca de matrícula errada (tela da 12.0 e 16.0). Apresente a marca como fato sobre o pedido ("alguém tentou este nome com outra matrícula"), nunca… |
| 2026-09-27 02:11:16 | `tenancy-guardian` | 1ª | APROVADO | `8_task` | `apps/api/src/sala/decisao.repository.ts:150`: o `fechar` depende só da trava do `travarPendente` na mesma transação. Acrescentar `eq(reivindicacao.estado,… |
| 2026-09-27 02:11:23 | `revisor-geral` | 1ª | APROVADO | `8_task` | `apps/api/src/sala/decisao.service.ts:125` e `:127` (numeração do arquivo): quando uma invariante quebra, sai um `throw new Error(...)` genérico, e o lote para… |
| 2026-09-27 02:11:51 | `privacy-guardian` | 1ª | APROVADO | `8_task` | A eliminação do aluno aprovado ainda falha. Desde esta tarefa pode existir aluno aprovado com linha na `lista_nome`, cujo `usuario_id` tem FK sem ação. Por… |
| 2026-09-27 02:12:23 | `infra-guardian` | 1ª | APROVADO | `8_task` | `apps/api/src/sala/decisao.service.ts:328-330`: o `zerar` do contador roda um por id, em sequência, dentro do request. Se o Redis de login conectar mas não… |
| 2026-09-27 02:24:48 | `test-engineer` | 3ª | APROVADO | `8_task` | O `Promise.all` do zerar hoje só é exercitado com uma aprovação por lote, tanto no E18 quanto no teste do lote parado. Um erro que zerasse só a primeira… |
| 2026-09-27 02:35:29 | `test-engineer` | 4ª | APROVADO | `8_task` | O lote de hoje põe o quebrado por último. Um lote `[aprovado, quebrado, pendente]` provaria a outra metade do contrato descrito em `decisao.service.ts:90-91`:… |
| 2026-09-27 02:45:48 | `test-engineer` | 5ª | APROVADO | `8_task` | nenhuma nova. |
| 2026-09-27 02:46:35 | `tenancy-guardian` | 2ª | APROVADO | `8_task` | As duas recomendações da 1ª rodada foram recusadas com motivo em `tasks/prd-apresentacao-escola/8_task.md`: `fechar` com `pendente` e ano, e o erro tipado da… |
| 2026-09-27 02:46:45 | `privacy-guardian` | 2ª | APROVADO | `8_task` | nenhuma nova. A recomendação 1 da 1ª rodada continua aberta para a 10.0 e o `/validar`. |
| 2026-09-27 02:46:45 | `conformidade-reviewer` | 2ª | APROVADO | `8_task` | nenhuma nova. As duas da 1ª rodada seguem registradas para o `/validar`, com destino na 16.0 e na 17.0. |
| 2026-09-27 02:46:47 | `infra-guardian` | 2ª | APROVADO | `8_task` | `tasks/prd-apresentacao-escola/9_task.md:49-53`: quando o K2 da 9.0 medir o `decidir` em lote de 40, vale medir também o p95 com o Redis de login lento. É o… |
| 2026-09-27 02:46:55 | `revisor-geral` | 2ª | APROVADO | `8_task` | `apps/api/src/sala/decisao.service.ts:108`: `exigirEscolaDoContexto()` roda no `finally` mesmo quando não há aprovada, por exemplo num lote só de recusas. Se… |
| 2026-09-27 04:37:07 | `test-engineer` | 1ª | REPROVADO | `9_task` | O `OPERADOR` inativo ou inexistente não tem teste neste comando. O ponto está em `apps/api/src/ops/revogar-acessos-sala.ts:52` (`const autorOperador = await… |
| 2026-09-27 04:49:01 | `test-engineer` | 2ª | APROVADO | `9_task` | A escola que o `beforeAll` da C2 monta fica no banco de teste depois do arquivo. Isso segue o padrão dos outros testes de sala e não quebra nada, porque as… |
| 2026-09-27 04:50:14 | `tenancy-guardian` | 1ª | APROVADO | `9_task` | Hoje o E29 só confere o isolamento pela turma do acesso vigente de B. Um segundo acesso vigente em outra turma de B tornaria mais explícito que nenhum acesso… |
| 2026-09-27 04:50:29 | `privacy-guardian` | 1ª | APROVADO | `9_task` | O `contas-<fase>.json` fica com permissão 0644 dentro de uma pasta 0777 enquanto a carga roda (`carga-sala.ts:369` e `:423`). Com senha e tokens sintéticos… |
| 2026-09-27 04:51:24 | `infra-guardian` | 1ª | APROVADO | `9_task` | Janela do teste da rajada pode pegar o fim do ensaio. Em `infra/test/alertas.int.test.ts:224`, a janela do `increase` é `ceil(decorrido)+1` minutos. Ela começa… |
| 2026-09-27 04:51:51 | `revisor-geral` | 1ª | REPROVADO | `9_task` | `tasks/prd-apresentacao-escola/cenarios.md:348`, no L12. O cenário diz que o L12 inteiro roda "pelo `ensaio:alertas`", e isso inclui "a rajada do primeiro dia… |
| 2026-09-27 05:03:26 | `test-engineer` | 3ª | APROVADO | `9_task` | Em `alertas.int.test.ts:229-231`, se o Prometheus raspar o último incremento do ensaio depois de `inicio`, ele entra na janela. O resultado seria vermelho… |
| 2026-09-27 05:13:28 | `test-engineer` | 4ª | APROVADO | `9_task` | nenhuma nova. |
| 2026-09-27 05:13:57 | `revisor-geral` | 2ª | APROVADO | `9_task` | Em `apps/api/src/sala/limites-da-sala.ts:172`, usar a própria `EVENTO_DO_LIMITE_DA_SALA` no `logger.warn` em vez do literal `'sala.limite_atingido'` com um… |
| 2026-09-27 05:14:08 | `infra-guardian` | 2ª | APROVADO | `9_task` | Continua pendente, para o `/validar`, a recomendação do critério da entrada do aprovado no `k2_redis_lento`, já registrada em "Recomendações sem aplicar". |
| 2026-09-27 05:14:13 | `privacy-guardian` | 2ª | APROVADO | `9_task` | nenhuma nova. A recomendação 2 da rodada anterior fica registrada no `/retro` e na tarefa do dossiê. |
| 2026-09-27 06:34:24 | `test-engineer` | 1ª | REPROVADO | `10_task` | A eliminação do aluno aprovado num ano já encerrado não tem teste. |
| 2026-09-27 06:45:47 | `test-engineer` | 2ª | APROVADO | `10_task` | nenhuma nova. |
| 2026-09-27 06:46:59 | `tenancy-guardian` | 1ª | APROVADO | `10_task` | `ciclo-de-vida.repository.ts:105`: não existe índice `(escola_id, usuario_id)` em `lista_nome`, então a busca pelo usuário percorre a lista inteira da escola… |
| 2026-09-27 06:47:10 | `privacy-guardian` | 1ª | APROVADO | `10_task` | O comentário de `apagarDaListaDeNomes` diz que "a busca pelo usuário desce pelo índice da lista, que começa pela escola". Vale confirmar que existe índice com… |
| 2026-09-27 06:48:14 | `infra-guardian` | 1ª | APROVADO | `10_task` | apps/api/src/sessao/ciclo-de-vida.repository.ts:105. A |
| 2026-09-27 06:48:21 | `revisor-geral` | 1ª | APROVADO | `10_task` | `apps/api/src/sala/reivindicacao.service.ts:77` (166 colunas) e `apps/api/src/estrutura/lista.service.ts:119` (174 colunas): linhas de JSDoc bem mais longas… |
| 2026-09-27 06:59:24 | `revisor-geral` | 2ª | APROVADO | `10_task` | `apps/api/src/sala/reivindicacao.service.ts:78`: a quebra de linha que eu pedi no item 5 do JSDoc não foi feita. |
| 2026-09-27 07:09:17 | `revisor-geral` | 3ª | APROVADO | `10_task` | A recomendação da 2ª rodada foi aplicada. Em `apps/api/src/sala/reivindicacao.service.ts:78-79`, a última linha do item 5 do JSDoc agora está quebrada em duas.… |
| 2026-09-27 09:02:55 | `test-engineer` | 1ª | REPROVADO | `11_task` | O teste da resposta atrasada passa sem provar nada (`e2e/areas.spec.ts:344-367`). |
| 2026-09-27 09:23:50 | `test-engineer` | 2ª | APROVADO | `11_task` | `e2e/areas.spec.ts:387`: `await (await resposta)?.finished()` pula a espera em silêncio se a resposta vier `null`. Um `expect(await resposta).not.toBeNull()`… |
| 2026-09-27 09:28:01 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `11_task` | `apps/web/src/paginas/Inicio.tsx:33`: o texto ficou falso e custa ao professor o fluxo de confirmar vínculo. |
| 2026-09-27 09:47:03 | `test-engineer` | 3ª | REPROVADO | `11_task` | A condição por papel em `apps/web/src/paginas/Inicio.tsx:36` não tem teste que a prove. |
| 2026-09-27 10:00:38 | `test-engineer` | 4ª | APROVADO | `11_task` | No portão final com `--e2e`, confirmar que `areas.spec.ts` e `casca.spec.ts` continuam verdes nos projetos `chromebook` e `celular`. Nesta rodada eles só foram… |
| 2026-09-27 10:01:17 | `frontend-reviewer` | 2ª | APROVADO | `11_task` | As três já registradas em "Recomendações sem aplicar" do `11_task.md` (trilho em tablet de toque, "Pular para o conteúdo", variantes do `Botao` em Turmas)… |
| 2026-09-27 10:03:47 | `revisor-geral` | 1ª | REPROVADO | `11_task` | A operação mudou de comportamento sem registro. Estão em `apps/web/src/componentes/FronteiraDaArea.tsx:156` e em `e2e/operacao.spec.ts:286-299`. |
| 2026-09-27 10:14:37 | `revisor-geral` | 2ª | APROVADO | `11_task` | `tasks/prd-apresentacao-operacao/techspec.md:202`: o parêntese novo deixou a linha bem mais longa que as outras. Quebre a linha na largura do resto do… |
| 2026-09-27 10:16:20 | `test-engineer` | 5ª | APROVADO | `11_task` | `tasks/prd-apresentacao-operacao/cenarios.md:134-135`: o texto novo do E4 fala da troca de "Tente de novo" para "Tentar de novo", mas não diz que a falha leva… |
| 2026-09-27 10:17:41 | `revisor-geral` | 3ª | APROVADO | `11_task` | No portão final com `--e2e`, confirmar o E4 verde nos projetos `chromebook` e `celular`. Até agora ele só rodou à mão, no compose de teste. |
