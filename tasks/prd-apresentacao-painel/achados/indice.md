# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-09-24 12:34:48 | `infra-guardian` | 1ª | APROVADO | `revisao-spec` | Seção 7c, linha "Convite em aberto": a promessa do teste de mutação ("o mesmo cenário sem a trava continua com um só") não se cumpre em todos os casos. O… |
| 2026-09-24 12:35:02 | `tenancy-guardian` | 1ª | REPROVADO | `revisao-spec` | Refazer e revogar por `conviteId` não se limitam ao convite de coordenação (seção 5, "Convite da coordenação"; seção 6, linha `escolaDoConviteParaOperador`;… |
| 2026-09-24 12:35:21 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | Seção 9 (Uso) e seção 10 (E2E): o Uso não tem desenho para 360 px e a prova do RF5 não está no teste. |
| 2026-09-24 12:35:25 | `privacy-guardian` | 1ª | APROVADO | `revisao-spec` | §5, "refazer": escrever que o servidor recusa o refazer com CONFLITO quando o estado é `ativa`, e que só vale convite `tipo = 'coordenador'`. Hoje só a tela… |
| 2026-09-24 12:35:28 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | §5 "Convite da coordenação" e §9 "Escolas": o estado pode ficar sem ação possível, e isso não tem teste. |
| 2026-09-24 12:39:21 | `frontend-reviewer` | 2ª | APROVADO | `revisao-spec` | Seção 9 promete mais texto do que o grupo W tem. A seção diz que "o texto exato de cada estado e de cada mensagem" está no grupo W, mas lá só há o 503 ("Tentar… |
| 2026-09-24 12:39:34 | `tenancy-guardian` | 2ª | APROVADO | `revisao-spec` | I7: acrescentar um teste de alarme. Inserir um convite com `tipo = 'professor'` deve falhar com 23514. Quando a A1 afrouxar o check, esse teste quebra e obriga… |
| 2026-09-24 12:39:59 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | O aceite anterior não tem mecanismo definido nem teste de concorrência (Tech Spec seção 5, linha `aceito` da matriz; seção 7c, tabela de travas; cenário E6). |
| 2026-09-24 12:43:22 | `test-engineer` | 3ª | REPROVADO | `revisao-spec` | A E15 passa mesmo sem a trava na ativação (`tasks/prd-apresentacao-painel/cenarios.md:61-64`). |
| 2026-09-24 12:43:38 | `infra-guardian` | 2ª | APROVADO | `revisao-spec` | Seção 5 e 7c: dizer que a trava é a primeira instrução da transação de ativação. No aceite, ela precisa vir antes de `usarConvitePorHash`, não só antes de… |
| 2026-09-24 12:45:48 | `test-engineer` | 4ª | REPROVADO | `revisao-spec` | O código de erro da E15(e) não é o que o sistema devolve (`cenarios.md` E15(e); seção 5, fim do parágrafo antes de "Leitura"). |
| 2026-09-24 12:47:49 | `infra-guardian` | 3ª | APROVADO | `revisao-spec` | Seção 5: dizer se a ativação perdida chama `contador.zerar(chave)`, como faz o caminho de sucesso, ou só libera a reserva. "Sem somar" é ambíguo, porque a… |
| 2026-09-24 12:48:11 | `privacy-guardian` | 2ª | REPROVADO | `revisao-spec` | `tasks/prd-apresentacao-painel/techspec.md:81-82` (seção 5) e `:132` (seção 7, linha Auditoria). |
| 2026-09-24 12:48:21 | `test-engineer` | 5ª | REPROVADO | `revisao-spec` | Seção 5, na "Decisão" sobre quem perde, e `cenarios.md` E6 (linhas 42-44) e E15(b). A regra "senha certa não conta como falha" foi escrita só para quem perde a… |
| 2026-09-24 12:49:43 | `privacy-guardian` | 3ª | APROVADO | `revisao-spec` | Revogar convite já usado. Em `sem_coordenacao`, o último convite já foi usado. A spec agora grava `revogado_em` nele, mas não diz se é isso mesmo que se quer.… |
| 2026-09-24 12:49:50 | `test-engineer` | 6ª | APROVADO | `revisao-spec` | E16, com MFA. Dizer qual contador é conferido: o da senha, o do código ou os dois. `apps/api/src/sessao/mfa.service.ts:101` faz uma reserva própria na etapa do… |
