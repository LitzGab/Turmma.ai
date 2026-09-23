# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-09-23 13:41:29 | `privacy-guardian` | 1ª | REPROVADO | `revisao-spec` | Seções 3 e 7 (Retenção), eventos `operador_criado`, `operador_desativado` e `mfa_configurado` no `registro_operacao`. |
| 2026-09-23 13:41:53 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | Seção 7c ("Rate limit") e seção 2 (módulos): o limite por operador (`rl:op:{id}`) está declarado, mas nada o aplica. |
| 2026-09-23 13:42:17 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | Seção 10: RF1 sem teste. Faltam três provas: |
| 2026-09-23 13:42:19 | `tenancy-guardian` | 1ª | REPROVADO | `revisao-spec` | Seção 6 e seção 11 (regra 10, item 9): o inventário das consultas sem escopo está incompleto. A spec diz que as únicas são as três do `PanoramaRepository`, e a… |
| 2026-09-23 13:42:22 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | Seção 5 (Entrada) e seção 9: sessão vencida responde 404, e a web não consegue distinguir isso de um id que não existe. |
| 2026-09-23 13:49:54 | `privacy-guardian` | 2ª | REPROVADO | `revisao-spec` | Retenção de convite vencido e de sessão expirada sem prazo (`tasks/prd-apresentacao-operacao/techspec.md:138` e `docs/lgpd.md:77-78`). |
| 2026-09-23 13:50:11 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | O desafio vale uma vez, mas nenhum teste prova isso (`techspec.md:90`, `techspec.md:184`). |
| 2026-09-23 13:50:24 | `infra-guardian` | 2ª | REPROVADO | `revisao-spec` | O problema: a spec aplica "rebaixa por IP, e quem recusa é o contador por conta" a todas as sete rotas `@EntradaDeOperacao`. Em… |
| 2026-09-23 13:50:46 | `frontend-reviewer` | 2ª | AJUSTES NECESSÁRIOS | `revisao-spec` | `tasks/prd-apresentacao-operacao/techspec.md:159-165`: a tabela de troca não diz o que vira o botão primário do F1, a cor branca e o modificador de opacidade. |
| 2026-09-23 13:50:47 | `tenancy-guardian` | 2ª | REPROVADO | `revisao-spec` | Seção 6, linha 113, e seção 11, linha 193. A spec afirma que "o módulo não consulta dado de escola" e que o item 9 da regra 10 fica "sem desvio", mas não diz… |
| 2026-09-23 13:55:00 | `tenancy-guardian` | 3ª | APROVADO | `revisao-spec` | Seção 6, os dois testes de arquitetura. Os testes olham só o `import`, mas o expurgo que já existe (`packages/nucleo/src/retencao/expurgo-de-acesso.repository.t… |
| 2026-09-23 13:55:10 | `infra-guardian` | 3ª | REPROVADO | `revisao-spec` | `tasks/prd-apresentacao-operacao/techspec.md:194` (seção 10, linha de Integração). A rodada 2 exigiu duas coisas: o novo roteamento do limite e um teste de 429… |
| 2026-09-23 13:55:13 | `frontend-reviewer` | 3ª | APROVADO | `revisao-spec` | da rodada 2: todas atendidas. |
| 2026-09-23 13:55:15 | `privacy-guardian` | 3ª | APROVADO | `revisao-spec` | Caminho da referência na seção 10. A seção 10 aponta `revisao-spec.md`, mas lá o item da privacidade é uma linha só ("testes da desativação e do expurgo prazo… |
| 2026-09-23 13:55:28 | `test-engineer` | 3ª | REPROVADO | `revisao-spec` | `techspec.md` seção 10, linha 194: apontar para a revisão não basta como especificação. A pergunta era se a referência a `revisao-spec.md` serve. Não serve,… |
| 2026-09-23 13:57:35 | `infra-guardian` | 4ª | APROVADO | `revisao-spec` | `cenarios.md`, C36: exigir também que toda rota `@RotaDeOperacao` conte pelo `rl:op:{sub}`. Hoje C35 prova isso só em `/eu`. |
| 2026-09-23 13:58:40 | `test-engineer` | 4ª | REPROVADO | `revisao-spec` | `cenarios.md:41-42` (C18) e `techspec.md:85-88`: o "configurar em duas abas" continua sem teste de concorrência, e o desenho deixa estado misturado. |
| 2026-09-23 14:00:37 | `test-engineer` | 5ª | REPROVADO | `revisao-spec` | Falta a condição de operador ativo nas travas de `configurar` e da ativação. Em techspec.md:84-89 as travas não exigem `desativado_em is null`. O mesmo vale… |
| 2026-09-23 14:02:04 | `test-engineer` | 6ª | REPROVADO | `revisao-spec` | Seção 5, "Travas no banco", itens TOTP e código de recuperação (techspec.md:80-82). Criar a sessão não está preso à trava, e o C6b exige "sem sessão criada". |
| 2026-09-23 14:03:20 | `test-engineer` | 7ª | REPROVADO | `revisao-spec` | `cenarios.md:21-25` (C6b): a correção 2 foi escrita de um jeito que o teste não consegue passar. |
