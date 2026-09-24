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
| 2026-09-24 12:57:42 | `test-engineer` | 7ª | REPROVADO | `revisao-spec` | A 4.0 roda a E15(d) sem o refazer existir (`tasks.md:82`, `4_task.md:3` e `4_task.md:66`). A E15(d) põe o aceite contra o refazer, mas a 4.0 depende só da 2.0… |
| 2026-09-24 12:59:46 | `test-engineer` | 8ª | APROVADO | `revisao-spec` | Cabeçalhos desatualizados: `2_task.md:3` diz "Paralelo com: 5.0" e `3_task.md:3` diz "Paralelo com: 4.0, 5.0", mas a 5.0 e a 4.0 agora dependem da 3.0. A… |
| 2026-09-24 14:02:13 | `test-engineer` | 1ª | APROVADO | `1_task` | A3, e-mail do operador: `painel-escrita.int.test.ts:177`. A lista de sentinelas não inclui o e-mail nem o apelido do operador da sessão… |
| 2026-09-24 14:03:42 | `tenancy-guardian` | 1ª | APROVADO | `1_task` | `packages/shared/src/operacao/eu.ts:5-8`: o comentário diz que os checks do banco "são gerados desta expressão", mas eles estão escritos por extenso e são… |
| 2026-09-24 14:03:52 | `privacy-guardian` | 1ª | APROVADO | `1_task` | O comentário em `packages/shared/src/operacao/eu.ts` diz que os checks do banco "são gerados desta expressão". Isso é falso: os checks estão escritos por… |
| 2026-09-24 14:03:57 | `infra-guardian` | 1ª | APROVADO | `1_task` | `apps/api/src/operacao/operador.repository.ts:141`: a espera do `for share` no request está sujeita ao `statement_timeout` de 300 ms do pool da API. Se um… |
| 2026-09-24 14:05:05 | `revisor-geral` | 1ª | APROVADO | `1_task` | `packages/shared/src/operacao/eu.ts:6`: o comentário diz que os três checks do banco "são gerados desta expressão". Não são: estão escritos por extenso no… |
| 2026-09-24 17:46:17 | `test-engineer` | 1ª | REPROVADO | `2_task` | O índice `convite_pendente_unico` e o mapeamento dele para `CONFLITO` não têm teste. |
| 2026-09-24 17:48:07 | `test-engineer` | 2ª | APROVADO | `2_task` | `convite.repository.int.test.ts:171-173`: o comentário diz que o erro cru do Postgres traria o valor da linha no `detail`. Dá para fixar isso com uma asserção… |
| 2026-09-24 18:18:12 | `privacy-guardian` | 1ª | APROVADO | `2_task` | Na linha "Convite de coordenador" de `docs/lgpd.md:72`, a finalidade diz "primeiro acesso (F1)". Vale acrescentar que o convite agora nasce também pelo painel… |
| 2026-09-24 18:18:16 | `infra-guardian` | 1ª | APROVADO | `2_task` | `packages/nucleo/drizzle/0015_convite_pendente_unico.sql:5`: o índice falha em banco que já tem dois convites em aberto do mesmo usuário, como aconteceu no… |
| 2026-09-24 18:18:16 | `tenancy-guardian` | 1ª | APROVADO | `2_task` | `tasks/prd-apresentacao-painel/techspec.md:122` diz que "só `painel.service.ts` abre o contexto pelo `:id`". Na verdade, quem abre é… |
| 2026-09-24 18:19:35 | `revisor-geral` | 1ª | REPROVADO | `2_task` | O nome digitado no gerar é descartado quando o usuário é reaproveitado. Isso quebra a promessa da seção 5 da Tech Spec. |
| 2026-09-24 18:21:53 | `test-engineer` | 3ª | APROVADO | `2_task` | A função `retrato` (`painel-convite.int.test.ts:109`) não lê `usuario.nome`. Nos estados que dão 409, "nada muda" não inclui o nome. Hoje o `ativa` volta 409… |
| 2026-09-24 18:50:57 | `infra-guardian` | 2ª | APROVADO | `2_task` | A recomendação da 1ª rodada continua valendo. `packages/nucleo/drizzle/0015_convite_pendente_unico.sql` agora diz que a migration "falha alto" quando um seed… |
| 2026-09-24 18:51:05 | `revisor-geral` | 2ª | APROVADO | `2_task` | da 1ª rodada: aplicadas |
| 2026-09-24 18:51:11 | `tenancy-guardian` | 2ª | APROVADO | `2_task` | Nome em duas escolas. No E10 (`apps/api/test/painel-convite.int.test.ts:401`), gerar na escola B com um nome diferente do usado na A, e verificar que o usuário… |
| 2026-09-24 18:51:14 | `privacy-guardian` | 2ª | APROVADO | `2_task` | Na correção de nome, `convite.criado` poderia levar um marcador sem dado pessoal, como `{ usuarioReaproveitado: true }` ou `{ nomeAlterado: true }`. Assim o… |
| 2026-09-24 19:49:54 | `test-engineer` | 1ª | APROVADO | `3_task` | E15(d) na 4.0: o teste da E9 cobre só "aceite primeiro, depois refazer". A outra ordem (o refazer revoga, o aceite espera a linha e deve responder como convite… |
| 2026-09-24 19:50:41 | `privacy-guardian` | 1ª | APROVADO | `3_task` | Em `docs/lgpd.md:72`, trocar "gerado pelo comando do operador ou pelo painel da operação" por "gerado ou refeito pelo painel da operação". Assim o dossiê deixa… |
| 2026-09-24 19:50:48 | `tenancy-guardian` | 1ª | APROVADO | `3_task` | Em `convite.repository.ts:129`, pôr também `eq(convite.tipo, 'coordenador')` no `where` de `revogarParaRefazer`, como defesa em profundidade. Hoje só o… |
| 2026-09-24 19:50:54 | `infra-guardian` | 1ª | APROVADO | `3_task` | Na 4.0 o aceite passa a pegar a mesma trava, com o `statement_timeout` de 300 ms do pool da API. Falta um teste de que o aceite que perde a trava para um… |
| 2026-09-24 19:51:12 | `revisor-geral` | 1ª | APROVADO | `3_task` | `tasks/prd-apresentacao-painel/cenarios.md:69-70`: a E9 ainda diz "pelo índice (23505 vira `CONFLITO`)". A divergência foi para a Tech Spec, mas não para o… |
