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
