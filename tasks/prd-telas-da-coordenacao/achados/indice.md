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
| 2026-10-16 08:47:48 | `conformidade-reviewer` | 1ª | APROVADO | `1_task` | A foto da escola cheia também mostra "Tudo em dia", então nenhuma foto mostra um item com nome de professor. Vale semear na vitrine cheia um convite vencido ou… |
| 2026-10-16 08:47:53 | `infra-guardian` | 1ª | APROVADO | `1_task` | apps/web/src/areas/coordenacao/fila-da-coordenacao.ts: o comentário de useFilaDaCoordenacao diz que a releitura é "pelo `refetch` do próprio observador", mas o… |
| 2026-10-16 08:48:51 | `revisor-geral` | 1ª | REPROVADO | `1_task` | `apps/web/src/areas/coordenacao/fila-da-coordenacao.ts:263-265` (e o comentário em `:210`): "Tentar de novo" relê o que falhou e também o que veio truncado: |
| 2026-10-16 08:48:52 | `privacy-guardian` | 1ª | APROVADO | `1_task` | Minimização. `GET /v1/vinculos` devolve também os vínculos de aluno (`usuarioId` e turma, sem nome), e agora o sino os lê ao entrar em qualquer tela da… |
| 2026-10-16 08:49:05 | `frontend-reviewer` | 1ª | APROVADO | `1_task` | `apps/web/src/componentes/CascaDaEscola.tsx` (âncora, duas instâncias por faixa): trocar de faixa de largura (por exemplo, girar um tablet) remonta o sino e… |
| 2026-10-16 08:50:18 | `test-engineer` | 1ª | REPROVADO | `1_task` | Falta o e2e sem ano letivo. A tabela da tarefa pede "sem ano letivo \| componente, e2e", e a seção 130 do `techspec.md` diz "`sino-da-coordenacao` (também… |
| 2026-10-16 09:04:58 | `infra-guardian` | 2ª | APROVADO | `1_task` | `fila-da-coordenacao.ts:263`: quando a fila está parcial só por truncamento, cada clique em "Tentar de novo" custa até 10 requisições e, com o dado real, volta… |
| 2026-10-16 09:05:04 | `privacy-guardian` | 2ª | APROVADO | `1_task` | A minimização que pedi na 1ª rodada foi registrada no `TODO.md`, item (2) do "Sino da coordenação": `GET /v1/vinculos` traz os vínculos de aluno junto. Ela… |
| 2026-10-16 09:05:05 | `frontend-reviewer` | 2ª | APROVADO | `1_task` | O vitrine não captura o painel modal aberto. Vale ajustar `tools/vitrine` para fotografar o `<dialog>` aberto, para o `/validar` ver a lista de verdade. |
| 2026-10-16 09:05:12 | `conformidade-reviewer` | 2ª | APROVADO | `1_task` | Continua aberta a minha recomendação 1 da rodada anterior. Nenhuma foto mostra a fila com um item que tenha nome de professor, como "Refazer o convite de…" ou… |
| 2026-10-16 09:05:30 | `revisor-geral` | 2ª | APROVADO | `1_task` | `tasks/prd-telas-da-coordenacao/techspec.md:87`: a célula de carga agora descreve o sino duas vezes. Primeiro diz "pior caso do sino: seis leituras ao entrar…"… |
| 2026-10-16 09:07:47 | `test-engineer` | 2ª | REPROVADO | `1_task` | `apps/web/src/componentes/sino/Sino.tsx:137`: `disabled={tentandoDeNovo}` não tem bloco de mutação, e nada prova que o teste de clique duplo fica vermelho sem… |
| 2026-10-16 09:17:59 | `revisor-geral` | 3ª | APROVADO | `1_task` | `apps/web/src/sino-por-area.test.tsx`: a espera invertida de 300 ms prova que o sino não pede a fila em 300 ms, não que ele nunca a peça. Na rodada nova, o… |
| 2026-10-16 09:18:57 | `test-engineer` | 3ª | APROVADO | `1_task` | `apps/web/src/sino-por-area.test.tsx:114`: a espera de 300 ms só vale porque o teste de controle, que roda antes no mesmo arquivo, já carregou o código do… |
| 2026-10-16 17:48:28 | `frontend-reviewer` | 1ª | APROVADO | `2_task` | `Painel.tsx:59` e `Painel.tsx:288`. A escola recém-criada tem até 6 passos em "Para terminar a escola". A 1366 × 768 a altura da lista cai para o mínimo de… |
| 2026-10-16 17:48:34 | `conformidade-reviewer` | 1ª | APROVADO | `2_task` | Texto do cartão "Aprovado por gente". A descrição do "Gerado por IA" conta atividades e planos, mas a do "Aprovado por gente" fala só de versões adaptadas e… |
| 2026-10-16 17:49:13 | `infra-guardian` | 1ª | APROVADO | `2_task` | Conta errada em `tasks/prd-telas-da-coordenacao/2_task.md:75`. A divergência diz "cerca de 55 pedidos", mas o pior caso é perto de 74: |
| 2026-10-16 17:49:34 | `revisor-geral` | 1ª | REPROVADO | `2_task` | A leitura do Painel saiu da Tech Spec, e a mudança só está registrada no `2_task.md`. |
| 2026-10-16 17:50:53 | `test-engineer` | 1ª | REPROVADO | `2_task` | Cláusulas novas sem bloco de mutação em `apps/web/src/areas/coordenacao/Painel.tsx`. Cada uma precisa de bloco na seção "Mutações": |
| 2026-10-16 19:22:00 | `frontend-reviewer` | 2ª | APROVADO | `2_task` | `Painel.tsx:280`: o "Tentar de novo" do aviso do roteiro não fica desligado enquanto lê, ao contrário do da fila. Já está no destino da rodada anterior:… |
| 2026-10-16 19:22:06 | `conformidade-reviewer` | 2ª | APROVADO | `2_task` | `apps/web/src/areas/coordenacao/Painel.tsx:81`: no plural, "Elas recusam pedido novo até ser retomada" deveria ser "até serem retomadas". É só texto, e é com o… |
| 2026-10-16 19:22:19 | `infra-guardian` | 2ª | APROVADO | `2_task` | O Painel (`useQuery`) e a Governança (`useInfiniteQuery`) agora usam a mesma chave, `[...CHAVE_DA_GOVERNANCA, 'resumo']`. Hoje não dá problema, porque as duas… |
| 2026-10-16 19:23:18 | `revisor-geral` | 2ª | APROVADO | `2_task` | `apps/web/src/areas/coordenacao/Painel.tsx:81`: no plural, a frase "Elas recusam pedido novo até ser retomada." deveria ser "até serem retomadas". O teste em… |
| 2026-10-16 19:24:56 | `test-engineer` | 2ª | APROVADO | `2_task` | A Governança lendo o que o Painel gravou. `consultaPrimeiraPaginaDoResumo` (`apps/web/src/api/governanca.ts:28-31`) divide a chave com a consulta paginada da… |
