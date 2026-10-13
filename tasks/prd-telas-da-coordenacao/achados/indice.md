# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-10-13 02:20:49 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | Fila do sino e do Painel diz "Tudo em dia" com leitura incompleta (Tech Spec seções 5, "A fila", e 7c "Quando cada dependência cai"; PRD RF4 e caso de borda… |
| 2026-10-13 02:21:01 | `tenancy-guardian` | 1ª | APROVADO | `revisao-spec` | Tech Spec, seção 6: a lista de testes cita só o `?professor=`. Falta citar o `?material=` (tarefa 8), o `?painel=ano` (tarefa 5) e o endereço da lista da turma… |
| 2026-10-13 02:21:44 | `privacy-guardian` | 1ª | REPROVADO | `revisao-spec` | Tech Spec §5 ("O sino", "A fila") e §7c ("Releitura"): o sino pode reler a lista de nomes e os pedidos de titular sem a coordenação pedir. |
| 2026-10-13 02:22:05 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | A regra de não reler sozinho está escrita, mas nenhum teste a prova. Onde está: `techspec.md` §7c ("Releitura") e §10 (linha "Componente"). Na tarefa, a tabela… |
| 2026-10-13 02:22:41 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | RF5, "não relê por tempo": nenhum teste prova (Tech Spec 7c "Releitura" e seção 10; `1_task.md`, "Testes que provam a regra"). |
| 2026-10-13 02:23:44 | `conformidade-reviewer` | 1ª | REPROVADO | `revisao-spec` | A onça dormindo no vazio do sino. Está em PRD RF4 e §8b, Tech Spec §2 (`componentes/onca/`, pose dormindo) e §7b, e na tarefa 1.3 (`OncaDormindo`, "só o `Sino`… |
| 2026-10-13 02:30:39 | `frontend-reviewer` | 2ª | APROVADO | `revisao-spec` | Em `tasks.md:16`, a linha da subtarefa 1.4 não cita `completa: false` nem "sem professor não é calculada com vínculos incompletos". Isso só está na 1.3, na… |
| 2026-10-13 02:31:15 | `privacy-guardian` | 2ª | REPROVADO | `revisao-spec` | Tech Spec §7c ("Releitura", última frase) e tarefa 1.0 (subtarefas e cenários): o botão "Atualizar" do sino pode reler leituras auditadas sem a coordenação… |
| 2026-10-13 02:31:44 | `infra-guardian` | 2ª | REPROVADO | `revisao-spec` | O teste do foco e da reconexão está desenhado de um jeito que não fica vermelho. O problema está em `techspec.md` §7c ("Releitura") e §10 (linha "Componente"),… |
| 2026-10-13 02:32:30 | `conformidade-reviewer` | 2ª | APROVADO | `revisao-spec` | `tasks/prd-telas-da-coordenacao/11_task.md`, linha 16 ("Contexto necessário"): "'Alto risco' por função … não entram" contradiz a Tech Spec §7b e o e2e de… |
| 2026-10-13 02:32:35 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | O teste "o sino não relê" não prova a regra do foco nem a da reconexão (Tech Spec 7c, "Releitura"; `1_task.md`, linha "o sino não relê"). |
| 2026-10-13 02:36:04 | `privacy-guardian` | 3ª | APROVADO | `revisao-spec` | A linha 1.6 de `tasks.md` diz "nem por tempo, foco ou retry" e não cita o "Atualizar". O teste está em `1_task.md`, mas vale repetir no resumo. |
| 2026-10-13 02:36:10 | `infra-guardian` | 3ª | REPROVADO | `revisao-spec` | `techspec.md` §7c "Releitura" e §10 "Componente"; `1_task.md`, linha "o sino não relê", tempo (b). As duas mutações do foco e da reconexão sobrevivem com o… |
| 2026-10-13 02:36:14 | `test-engineer` | 3ª | APROVADO | `revisao-spec` | Diga na 7c e em `1_task.md:49` como o caso (b) dispara o foco e a reconexão. Na versão instalada do TanStack (5.102.8): |
| 2026-10-13 02:37:50 | `infra-guardian` | 4ª | APROVADO | `revisao-spec` | `tasks/prd-telas-da-coordenacao/2_task.md:45`: incluir também a volta da rede (`onlineManager.setOnline(false)` e depois `setOnline(true)`) e a mutação de… |
