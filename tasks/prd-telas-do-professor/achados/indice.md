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
