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
