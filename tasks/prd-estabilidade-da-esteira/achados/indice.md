# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-09-21 12:39:42 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | B1 §5 etapa 5 + §10 + PRD RF7/§9 — critério do RF7 não é fixo nem declarado: N é escolhido |
| 2026-09-21 12:39:47 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | Tech Spec seção 5, etapa 1, item 1 — a hipótese nomeia o caso errado. infra/test/borda.int.test.ts:445 roda DEPOIS de :426 (ordem do arquivo, sem… |
| 2026-09-21 12:47:59 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | `techspec.md:60-61` e `prd.md:81` — a mutação do RF2 não tem critério de falha, então não é executável nem auditável. "Removida a condição, o caso do handshake… |
| 2026-09-21 12:49:40 | `infra-guardian` | 2ª | REPROVADO | `revisao-spec` | `tasks/prd-estabilidade-da-esteira/prd.md:31` e `techspec.md:14,27,55,123` — o conserto aponta para o sítio errado, de novo. O `afterEach` do caso de `:361`… |
| 2026-09-21 12:57:55 | `test-engineer` | 3ª | REPROVADO | `revisao-spec` | `techspec.md:70-72` e `prd.md:102` — a asserção positiva do RF2, a que a própria spec diz |
| 2026-09-21 12:58:15 | `infra-guardian` | 3ª | REPROVADO | `revisao-spec` | `tasks/prd-estabilidade-da-esteira/prd.md:53-62` (as três candidatas), `:101` (prova do RF1), `:103` (RF3) e `techspec.md:48` e `:85-88` — falta a quarta… |
| 2026-09-21 13:06:04 | `infra-guardian` | 4ª | REPROVADO | `revisao-spec` | `tasks/prd-estabilidade-da-esteira/techspec.md:110-112` — a afirmação sobre o que sobe durante o projeto está errada, e é justamente a metade da correção 2 da… |
| 2026-09-21 13:07:30 | `test-engineer` | 4ª | REPROVADO | `revisao-spec` | `techspec.md:68-72` e `techspec.md:149-150` (linhas da tabela), `prd.md:96` — as três positivas passam com condição prematura, por `infra/Caddyfile:41`.… |
| 2026-09-21 14:08:11 | `test-engineer` | 5ª | REPROVADO | `revisao-spec` | `techspec.md:39-47` (etapa 1) não produz o "estado do pool" que `prd.md:73` (RF1) e `techspec.md:101` exigem. A etapa 1 acrescenta instante, método e o… |
| 2026-09-21 14:08:14 | `infra-guardian` | 5ª | REPROVADO | `revisao-spec` | `techspec.md:51-60` (RF5, "saída preferida") — trocar `borda.int.test.ts:364` por conjunto declarado transforma a asserção de `:367`… |
