# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-10-13 02:40:06 | `frontend-reviewer` | 1ª | APROVADO | `revisao-spec` | Tech Spec §5/§9: o texto de Criados diz "Ver mais" só nas tarefas (`tasks.md` 5.2). Escreva na Tech Spec que a lista é limitada ou paginada, sem virtualização… |
| 2026-10-13 08:30:52 | `frontend-reviewer` | 2ª | AJUSTES NECESSÁRIOS | `revisao-spec` | Tech Spec §5, "A fila do professor", e §7c (carga e falha). A spec manda o sino ler "quando a aba volta a ter foco". Isso é releitura sozinha, e contradiz o… |
| 2026-10-13 08:31:26 | `tenancy-guardian` | 1ª | APROVADO | `revisao-spec` | Tech Spec §6, texto do cache. Diz que as chaves do sino "começam pelas de hoje, que `main.tsx` esvazia". Na verdade `main.tsx` faz `resetQueries()` em todas as… |
| 2026-10-13 08:32:17 | `conformidade-reviewer` | 1ª | REPROVADO | `revisao-spec` | Tech Spec §5 ("Seu time") e §7b, com reflexo nas tarefas 10.2 e 10.4. A Tech Spec não garante que a aba Hoje continue mostrando a turma ao vivo (regra 70, item… |
| 2026-10-13 08:32:20 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | O teto de 12 turmas do sino faz ele dizer "Tudo em dia" sem ter lido tudo. Está na Tech Spec §7c, linhas "Carga na manhã de segunda" e "Rate limit", e em… |
| 2026-10-13 08:32:43 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | O sino relê ao voltar o foco, o que contraria o contexto fixado. |
| 2026-10-13 08:34:06 | `privacy-guardian` | 1ª | REPROVADO | `revisao-spec` | Tech Spec §9 (Turma aberta, aba Hoje), §7 e PRD RF16; tarefa 10.2. A atenção humana (D36) mostra o nome do aluno logo que a turma abre. Hoje esse sinal fica em… |
| 2026-10-13 08:42:04 | `frontend-reviewer` | 3ª | APROVADO | `revisao-spec` | Na 10.2, escrever que o DTO de `consultaSinais` não traz linhas por aluno quando o painel está fechado. Se trouxer, os nomes ficam em memória por `gcTime: 0`,… |
| 2026-10-13 08:42:37 | `tenancy-guardian` | 2ª | APROVADO | `revisao-spec` | Invalidação da contagem só para a professora (Tech Spec §7 e 1_task.md item 1.3). Escrever que `aplicarDecisao` invalida a chave da contagem só quando `quem… |
| 2026-10-13 08:42:59 | `conformidade-reviewer` | 2ª | APROVADO | `revisao-spec` | 10.2 e §7b: escrever que o botão "Ver quem" fica dentro do aviso e que o PainelLado aberto por ele começa pela lista de atenção humana (nome · hora, como em… |
| 2026-10-13 08:43:00 | `privacy-guardian` | 2ª | APROVADO | `revisao-spec` | prd.md RF16. O texto ainda diz só "sem conteúdo (D36)". Acrescentar "e sem nome; o nome por 'Ver quem'", para o PRD não divergir da §7b. |
| 2026-10-13 08:43:25 | `infra-guardian` | 2ª | APROVADO | `revisao-spec` | §7c "Carga na manhã de segunda". Somar a leitura de Hoje: 4 por minuto por professor com Hoje à vista, pausada com a aba escondida. Hoje passa a ser a aba de… |
| 2026-10-13 08:43:41 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | `1_task.md`, cenário "sem nome no cache": o teste fica vermelho com o código certo. Com a `ListaDePedidos` montada ao mesmo tempo, a consulta nominal dela está… |
| 2026-10-13 08:46:35 | `frontend-reviewer` | 4ª | APROVADO | `revisao-spec` | `13_task.md` 13.1 diz "um `Dialogo` de 560 px" e, na mesma linha, que o passo é "tela inteira". O `Dialogo` atual (`apps/web/src/componentes/Dialogo.tsx:150`)… |
| 2026-10-13 08:48:29 | `test-engineer` | 3ª | REPROVADO | `revisao-spec` | `10_task.md:62`, cenário "sem painel, sem rota nominal": a parte "o `QueryCache` não tem linha por aluno" fica vermelha com o código certo. É o mesmo defeito… |
| 2026-10-13 08:51:20 | `test-engineer` | 4ª | APROVADO | `revisao-spec` | `10_task.md:69`, "fechar o painel solta os nomes": com a opção (a), os nomes dos sinais continuam em memória depois de fechar o painel. Vale escrever o que o… |
| 2026-10-17 23:18:21 | `frontend-reviewer` | 1ª | APROVADO | `1_task` | `apps/web/src/areas/professor/fila-do-professor.ts` (`itensDeEntrega`, linhas 98 a 112): "Correção para revisar" e "Versão adaptada para decidir" apontam para… |
| 2026-10-17 23:18:26 | `privacy-guardian` | 1ª | APROVADO | `1_task` | Contar sem baixar os nomes. `apps/web/src/api/pedidos.ts:433` baixa a página nominal inteira só para contar (até `PEDIDOS_POR_LEITURA` nomes por turma, até 12… |
| 2026-10-17 23:18:36 | `tenancy-guardian` | 1ª | APROVADO | `1_task` | `fila-do-professor.ts:262`. O estado `liberadas` (`useState(1)`) não volta a 1 na troca de escola. O `SinoDoProfessor` continua montado, porque a área do… |
| 2026-10-17 23:19:32 | `infra-guardian` | 1ª | REPROVADO | `1_task` | A série e a parada na primeira recusa por limite só valem na primeira montagem. Ponto: `apps/web/src/areas/professor/fila-do-professor.ts:262` e `:264`. |
| 2026-10-17 23:20:22 | `revisor-geral` | 1ª | APROVADO | `1_task` | A lista fecha quando a largura cruza 768 px. Quem gira um tablet com a lista aberta perde a lista, porque o `Sino` remonta na âncora nova… |
| 2026-10-17 23:21:50 | `test-engineer` | 1ª | REPROVADO | `1_task` | A leitura em série quebra depois da troca de escola, e nenhum teste prova a série no recomeço. O problema está em `apps/web/src/areas/professor/fila-do-professo… |
| 2026-10-17 23:45:15 | `frontend-reviewer` | 2ª | APROVADO | `1_task` | Em `apps/web/src/areas/professor/fila-do-professor.ts`, a contagem lida fica desligada e só é relida por clique ou por decisão de pedido. Vale registrar no… |
| 2026-10-17 23:45:38 | `tenancy-guardian` | 2ª | APROVADO | `1_task` | `apps/web/src/areas/professor/fila-do-professor.ts:362-368` decide se a consulta fica ligada lendo `cliente.getQueryState` durante a renderização. Esse… |
| 2026-10-17 23:45:42 | `privacy-guardian` | 2ª | APROVADO | `1_task` | Em `apps/web/src/api/pedidos.ts`:131, a releitura depois de uma decisão sai fora da série e da parada por limite. É uma leitura só, de uma turma, então não… |
| 2026-10-17 23:46:09 | `infra-guardian` | 2ª | APROVADO | `1_task` | Uma contagem que ainda estava sendo lida na hora do reset sai mais uma vez, com o token novo, e volta 404. É no máximo uma leitura por troca de sessão, mas dá… |
| 2026-10-17 23:46:45 | `revisor-geral` | 2ª | APROVADO | `1_task` | `apps/web/src/areas/professor/fila-do-professor.ts:248-249`: o comentário do `useFilaDoProfessor` ainda diz que "Atualizar" relê cada leitura "por… |
| 2026-10-17 23:47:20 | `test-engineer` | 2ª | REPROVADO | `1_task` | `apps/web/src/api/pedidos.ts:31`: a condição nova não tem bloco nem teste. A cláusula é esta: |
| 2026-10-18 09:56:54 | `revisor-geral` | 3ª | APROVADO | `1_task` | `apps/web/src/api/pedidos.test.ts`, teste "dois cliques em decidir…". O nome diz "uma releitura só", mas a asserção é `toHaveLength(2)`, porque conta também a… |
| 2026-10-18 09:57:31 | `test-engineer` | 3ª | APROVADO | `1_task` | O teste de dois cliques protege, na prática, a deduplicação do próprio TanStack Query. Nenhuma linha nossa o deixa vermelho: tirar o `refetchType: 'none'` não… |
| 2026-10-18 21:41:33 | `conformidade-reviewer` | 1ª | APROVADO | `2_task` | `apps/web/src/areas/professor/SinoDoProfessor.tsx:11` e `docs/interface.md:102-103` dizem que o Tutor fica "a um clique, de qualquer tela". São dois cliques:… |
| 2026-10-18 21:43:25 | `test-engineer` | 1ª | REPROVADO | `2_task` | Os textos novos da 2.3 em Aprovar, Artefato e Home não têm teste na tela, e "Voltar para a turma" não tem teste no componente. |
| 2026-10-18 21:43:56 | `revisor-geral` | 1ª | APROVADO | `2_task` | Código morto: `apps/web/src/api/entregas.ts:52`. Desde que a casca deixou de ler entregas, `quantasEsperam` e o tipo `QuantasEsperam` só são usados pelo… |
| 2026-10-18 21:44:46 | `frontend-reviewer` | 1ª | APROVADO | `2_task` | Os nomes do pé não batem com os títulos das telas. O link diz "O que o Assistente fez" e "O que o Tutor viu", e as telas se chamam "Assistente de ensino"… |
| 2026-10-18 22:36:35 | `frontend-reviewer` | 2ª | APROVADO | `2_task` | Em `apps/web/src/areas/navegacao.ts:61` e em `SinoDoProfessor.tsx:10`, os comentários ainda citam "Seu time" como histórico. Isso não vaza para o usuário, mas… |
| 2026-10-18 22:36:36 | `test-engineer` | 2ª | APROVADO | `2_task` | `apps/web/src/areas/navegacao.test.ts:98`: a lista completa do que `navegacao.ts` exporta virou só `not.toHaveProperty('SEU_TIME')`. A regra continua provada… |
| 2026-10-18 22:38:21 | `conformidade-reviewer` | 2ª | APROVADO | `2_task` | A asserção `expect(navegacao).not.toHaveProperty('SEU_TIME')` em `apps/web/src/areas/navegacao.test.ts:62` é mais fraca que a lista exata de chaves que ela… |
| 2026-10-19 02:56:38 | `frontend-reviewer` | 1ª | APROVADO | `9_task` | Na foto de 360 px, o texto do cabeçalho da casca está truncado ("Colég…"). Isso é da casca, não desta tarefa, mas vale registrar para o `/validar`. |
| 2026-10-19 02:57:03 | `privacy-guardian` | 1ª | APROVADO | `9_task` | `e2e/inatividade.spec.ts`: no caso do recomeço com o painel aberto, saiu a checagem de acessibilidade (`violacoesGraves`) do login por cima, sob o argumento de… |
| 2026-10-19 02:57:59 | `test-engineer` | 1ª | REPROVADO | `9_task` | O selo só no cartão do vínculo confirmado é cláusula nova sem bloco e sem teste. Fica em `apps/web/src/areas/professor/Turmas.tsx:154` (`{vinculo.estado ===… |
| 2026-10-19 02:58:26 | `revisor-geral` | 1ª | APROVADO | `9_task` | No celular, a professora pode enviar a contestação sem ver o efeito. A foto `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--spectelas-do-professor--l2/… |
| 2026-10-19 03:22:48 | `frontend-reviewer` | 2ª | APROVADO | `9_task` | Os nomes das turmas na vitrine trazem sufixos como "d8fa74ae". Vêm do dado sintético da vitrine, não do código. Confira que não existe sufixo igual no dado… |
| 2026-10-19 03:23:11 | `privacy-guardian` | 2ª | APROVADO | `9_task` | A linha do `TODO.md` sobre o painel que fecha sozinho quando o vínculo é decidido por fora tem um lado de regra 20. Quando a correção própria vier, ela também… |
| 2026-10-19 03:24:07 | `revisor-geral` | 2ª | APROVADO | `9_task` | `e2e/professor-turmas.spec.ts:57-63`: o teste de quebra da faixa usa `?? 0` nos dois lados. Se uma caixa vier nula, a comparação passa com zero. O… |
| 2026-10-19 03:24:08 | `test-engineer` | 2ª | APROVADO | `9_task` | Declarar um bloco de mutação para `contestar.reset()` (`apps/web/src/areas/professor/Turmas.tsx:110`), apontando para "a falha de uma contestação não vai junto… |
| 2026-10-19 02:48:50 | `frontend-reviewer` | 1ª | APROVADO | `3_task` | `apps/web/src/areas/professor/Home.tsx:56-110`: a regra 50, item 6 (o feed de agentes nunca aparece vazio para quem tem turmas), é cumprida pelo sino, não pelo… |
| 2026-10-19 02:49:10 | `conformidade-reviewer` | 1ª | APROVADO | `3_task` | A frase "Nada chega à turma sem você aprovar" é uma promessa da regra 70, item 3, e hoje só é verdade porque nenhuma ferramenta entrega direto à turma. Vale… |
| 2026-10-19 02:49:53 | `test-engineer` | 1ª | APROVADO | `3_task` | `Home.test.tsx:123-125`: o caso de erro diz "a mensagem do catálogo", mas só confere que o alerta tem algum texto e não mostra o código. O e2e do HEAD conferia… |
| 2026-10-19 02:49:57 | `revisor-geral` | 1ª | APROVADO | `3_task` | Código morto. `apps/web/src/areas/professor/fila-do-professor.ts:199`: `esperandoVoce` (e o tipo `ItemEsperando`, se ninguém mais o usa) ficou sem quem chame… |
| 2026-10-19 03:12:53 | `frontend-reviewer` | 2ª | APROVADO | `3_task` | A foto mostra "Boa noite" e "2°B c5064cf7 · Química". O sufixo hexadecimal é dado sintético da vitrine. Confirme que a turma real nunca mostra id. |
| 2026-10-19 03:13:11 | `conformidade-reviewer` | 2ª | APROVADO | `3_task` | nenhuma nova. As da 1ª rodada foram aplicadas. A tabela "Recomendações sem aplicar" do documento fica para o `/validar` e o `/retro`. |
| 2026-10-19 03:13:21 | `test-engineer` | 2ª | APROVADO | `3_task` | nenhuma nova. |
