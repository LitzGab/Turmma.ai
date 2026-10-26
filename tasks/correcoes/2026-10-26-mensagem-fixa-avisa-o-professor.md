# Correção — a mensagem fixa do assunto delicado e a introdução do aluno dizem o aviso ao professor com palavras diferentes

**Origem:** decisão do Joaquim (26/10/2026, opção A da entrada "25/10/2026 ~17:20 — X4 tarefa 9.0" em `tasks/prd-telas-do-aluno-e-primeiro-acesso/estado.md`); `TODO.md`, "Aviso de privacidade em linguagem de faixa etária"; D36, D58.
**Subagentes obrigatórios:** `conformidade-reviewer`, `privacy-guardian`, `llm-integrator`, `pedagogia-reviewer`, `revisor-geral`, `tenancy-guardian`, `infra-guardian`
<!-- test-engineer é obrigatório em toda correção. Os quatro primeiros foram ditos pelo PEDIDO do Orquestrador; a Mesa 2 acrescentou revisor-geral (8 arquivos fora de tasks/, o limite é 5), tenancy-guardian e infra-guardian (apps/ e packages/). -->

## Sintoma

O aluno lê, na introdução (9.0), "Se você contar algo pessoal difícil, quem dá a aula é avisado." e, na hora em que conta, recebe uma mensagem fixa (`MENSAGEM_DE_ASSUNTO_DELICADO` e `MENSAGEM_DE_RISCO_A_VIDA`, em `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts`) que diz o aviso com **outra frase**: "Seu professor vai receber um aviso de que você precisa de atenção, sem o que você escreveu.", repetida à mão nas duas mensagens. São três redações da mesma promessa, e a decisão do Joaquim é que as duas telas digam a mesma coisa, por uma constante só.

## Fora desta correção

Nada. Sem tarefa em curso na árvore. A revisão do texto pela orientação educacional e por advogado continua pendente (`docs/aia/tutor.md`, pendência 12).

## Causa

A promessa ao aluno nasceu em dois lugares sem fonte comum: a mensagem fixa (camada de IA, `packages/nucleo`) e o aviso de privacidade (`apps/web`, `FRASE_DO_AVISO_DE_ATENCAO`). A web não importa de `@educa/nucleo`; o ponto em comum entre os dois é `@educa/shared`, onde já mora o sinal `atencao_humana` (`tutor/sinal.ts`). Cada lado escreveu a sua frase, e a duplicata dentro do próprio `turno-do-tutor.ts` (a mesma linha nas duas mensagens) a deixava sujeita a divergir de novo.

## Teste que reproduz

- `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › as duas mensagens fixas terminam na frase do aviso ao professor, a mesma da introdução`
- `apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › o aviso de atenção é a frase do aviso ao professor do shared, uma só, a mesma da mensagem fixa do Tutor`
- (rodada 1 da Mesa) `packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a última linha das mensagens fixas não é condicional, porque o aluno já contou` e `textos-da-introducao.test.ts › a frase do aviso ao professor vale antes e depois do relato, sem tempo hipotético`

## Correção

`FRASE_DO_AVISO_AO_PROFESSOR` entra em `packages/shared/src/tutor/sinal.ts` (exportada pelo `index.ts`): "Em assunto pessoal difícil, seu professor é avisado, mas não vê o que você escreveu." (15 palavras, cabe no limite do aviso; sem tempo hipotético, porque vale antes do relato, na introdução, e depois dele, na mensagem fixa). As duas mensagens fixas terminam nela, e `FRASE_DO_AVISO_DE_ATENCAO` passa a ser a mesma constante. A frase mantém as duas coisas que as redações antigas diziam: o professor é avisado e **não vê o que o aluno escreveu** (o sinal `atencao_humana` é estrito, sem conteúdo). Docs e `TODO.md` atualizados.

## Mutações

A frase sai de cada um dos três lugares que a usam (as duas mensagens fixas e o aviso do aluno), a constante troca de texto na introdução, e a frase volta ao condicional em dois deles (os testes de clareza da rodada 1 da Mesa).

````
```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › as duas mensagens fixas terminam na frase do aviso ao professor, a mesma da introdução
  'Se você estiver em perigo ou pensando em se machucar, ligue 188 (CVV). A ligação é gratuita e funciona a qualquer hora.',
-  FRASE_DO_AVISO_AO_PROFESSOR,
+  'Seu professor vai receber um aviso de que você precisa de atenção.',
```
````

````
```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › as duas mensagens fixas terminam na frase do aviso ao professor, a mesma da introdução
  'Eu sou uma inteligência artificial e não sou quem pode ajudar você nisso. Procure hoje um adulto da escola: seu professor ou a orientação educacional.',
-  FRASE_DO_AVISO_AO_PROFESSOR,
+  'Seu professor vai receber um aviso de que você precisa de atenção.',
```
````

````
```mutacao
arquivo: apps/web/src/areas/aluno/introducao/aviso-de-privacidade.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › o aviso de atenção é a frase do aviso ao professor do shared, uma só, a mesma da mensagem fixa do Tutor
-export const FRASE_DO_AVISO_DE_ATENCAO = FRASE_DO_AVISO_AO_PROFESSOR
+export const FRASE_DO_AVISO_DE_ATENCAO = 'Se você contar algo pessoal difícil, quem dá a aula é avisado.'
```
````

````
```mutacao
arquivo: packages/shared/src/tutor/sinal.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › diz quem vê: em assunto pessoal difícil, o professor é avisado, mas não vê o que o aluno escreveu
-export const FRASE_DO_AVISO_AO_PROFESSOR = 'Em assunto pessoal difícil, seu professor é avisado, mas não vê o que você escreveu.'
+export const FRASE_DO_AVISO_AO_PROFESSOR = 'Em assunto pessoal difícil, seu professor é avisado.'
```
````

````
```mutacao
arquivo: packages/shared/src/tutor/sinal.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › a frase do aviso ao professor vale antes e depois do relato, sem tempo hipotético
-export const FRASE_DO_AVISO_AO_PROFESSOR = 'Em assunto pessoal difícil, seu professor é avisado, mas não vê o que você escreveu.'
+export const FRASE_DO_AVISO_AO_PROFESSOR = 'Se você contar algo pessoal difícil, seu professor é avisado, mas não vê o que você escreveu.'
```
````

````
```mutacao
arquivo: packages/nucleo/src/ia/tarefas/turno-do-tutor.ts
teste: packages/nucleo/src/ia/tarefas/turno-do-tutor.test.ts › a última linha das mensagens fixas não é condicional, porque o aluno já contou
  'Se você estiver em perigo ou pensando em se machucar, ligue 188 (CVV). A ligação é gratuita e funciona a qualquer hora.',
-  FRASE_DO_AVISO_AO_PROFESSOR,
+  'Se você contar algo pessoal difícil, seu professor é avisado.',
```
````

## Recomendações sem aplicar

Da ordem de correção da Mesa 2 (`.processo/ordens/2026-10-26-mensagem-fixa-avisa-o-professor-r1.md`), rodada 1.

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | `e2e/__fixtures__/aluno.ts:250-255`: a fixture `MENSAGEM_FIXA` não traz a frase do aviso; terminá-la em `FRASE_DO_AVISO_AO_PROFESSOR` e fazer `e2e/aluno-tutor.spec.ts` e `e2e/aluno-fluxo.spec.ts` conferirem a frase no cartão | `TODO.md`, na entrada do aviso de privacidade: mexe em três arquivos de e2e que a correção não toca, e e2e só roda na esteira |
| privacy-guardian (1ª) | Um teste que ligue a frase ao schema estrito de `atencao_humana` | Recusada: o comentário da constante registra o gatilho; o schema estrito já tem teste próprio e a ligação é por texto, não por código |
| revisor-geral, conformidade-reviewer (1ª) | A frase diz "seu professor" e `TEXTO_DA_SUPERVISAO` diz "quem dá a aula"; levar à revisão de texto | `docs/aia/tutor.md`, pendência 12 (revisão de texto pela orientação educacional): é escolha de redação, não defeito de código |
| revisor-geral (1ª) | `tasks/prd-telas-do-aluno-e-primeiro-acesso/estado.md:60`: a decisão ainda aparece como esperando resposta | Orquestrador, antes do pouso: o `estado.md` é documento dele |
| llm-integrator, conformidade-reviewer, test-engineer (1ª) | O tempo verbal da frase na mensagem fixa | Atendida pelo item 1; o que sobrar vai à pendência 12 |
| llm-integrator, infra-guardian (1ª) | `mockups/.antes-da-remodelagem/src/areas/aluno/Tutor.tsx:30` ainda tem a redação antiga | Recusada: é histórico e não é copiado para o `apps/web` |
| privacy-guardian (1ª) | Os dois testes novos não rodaram neste checkout (`@educa/shared` não compilado) | Sem ação: o test-engineer rodou os dois (533 de 533) e a esteira confere |

Rodada 2 (`.processo/ordens/2026-10-26-mensagem-fixa-avisa-o-professor-r2.md`), aprovada por todos:

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (2ª) | A asserção `/ é avisado,/` do teste novo do nucleo prende uma vírgula da redação; exigir `toBe(FRASE_DO_AVISO_AO_PROFESSOR)` e deixar a forma só no teste da web | `docs/aia/tutor.md`, pendência 12: a revisão de texto é quem muda a redação, e a asserção muda junto com ela |
| test-engineer, conformidade-reviewer, llm-integrator, infra-guardian, tenancy-guardian, privacy-guardian, revisor-geral (2ª) | A fixture `MENSAGEM_FIXA` (`e2e/__fixtures__/aluno.ts`) e os specs `e2e/aluno-tutor.spec.ts` e `e2e/aluno-fluxo.spec.ts` não conferem a frase no cartão; fechar antes do pouso | `TODO.md`, na entrada do aviso de privacidade (já escrita pela correção, com "Falta"): e2e só roda na esteira e a correção não os toca |
| pedagogia-reviewer (2ª) | `docs/aia/tutor.md:398` ainda parafraseia o conteúdo do aviso como "se ele contar algo pessoal difícil" | `docs/aia/tutor.md`, pendência 12: alinhar a paráfrase na revisão de texto |
| pedagogia-reviewer, revisor-geral (2ª) | "Em assunto pessoal difícil" é abstrato para um aluno de 11 anos; testar a compreensão | `docs/aia/tutor.md`, pendência 12 (orientação educacional) |
| revisor-geral, conformidade-reviewer (2ª) | "seu professor" convive com "quem dá a aula" em `TEXTO_DA_SUPERVISAO` | `docs/aia/tutor.md`, pendência 12 (revisão de texto) |
| privacy-guardian (2ª) | Avaliar se "não vê o que você escreveu" deve ressalvar o acesso auditado da coordenação ao atender pedido do titular | `docs/aia/tutor.md`, pendência 12 (revisão por advogado) |
| conformidade-reviewer (2ª) | `tasks/prd-telas-do-aluno-e-primeiro-acesso/9_task.md:90` e `validacao.md:452` ainda citam a redação anterior; uma nota de que a correção os substitui | Orquestrador, na conferência de documentos antes do pouso: são documentos históricos da tarefa e da validação |
| llm-integrator (2ª) | Um `expect` de contagem de palavras (teto de 15) no teste novo da web | Recusada: o caso `cada frase é uma frase só, de até 15 palavras` já cobre, e o test-engineer confirmou |
| revisor-geral (2ª) | Gerar de novo o build `apps/web/dist`, que ainda tem a frase antiga, antes de qualquer demonstração | Recusada na correção: o build não é versionado e o portão da próxima tarefa o refaz; fica o aviso ao Orquestrador |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-26 10:29:27 | 2026-10-26 10:29:44 | `tenancy-guardian` | 1 | APROVADO | a5124c7efa18ba406 |
| 2026-10-26 10:29:22 | 2026-10-26 10:29:46 | `llm-integrator` | 1 | APROVADO | a1ac2ee8f780624d1 |
| 2026-10-26 10:29:29 | 2026-10-26 10:29:53 | `infra-guardian` | 1 | APROVADO | aba8f18355f81084e |
| 2026-10-26 10:29:24 | 2026-10-26 10:30:04 | `pedagogia-reviewer` | 1 | AJUSTES NECESSÁRIOS | a602fddddb0b1ad13 |
| 2026-10-26 10:29:21 | 2026-10-26 10:30:16 | `privacy-guardian` | 1 | APROVADO | afa1c30d5284a241b |
| 2026-10-26 10:29:26 | 2026-10-26 10:30:18 | `revisor-geral` | 1 | APROVADO | abe0f1562da225082 |
| 2026-10-26 10:29:31 | 2026-10-26 10:30:35 | `test-engineer` | 1 | APROVADO | ac361973698cf63ce |
| 2026-10-26 10:29:19 | 2026-10-26 10:30:57 | `conformidade-reviewer` | 1 | APROVADO | a6a8e7d0b6614bbdf |
| 2026-10-26 10:37:43 | 2026-10-26 10:38:06 | `pedagogia-reviewer` | 2 | APROVADO | aca6ba8a1b95c1922 |
| 2026-10-26 10:37:56 | 2026-10-26 10:38:10 | `llm-integrator` | 2 | APROVADO | a9e85388134990516 |
| 2026-10-26 10:38:04 | 2026-10-26 10:38:29 | `tenancy-guardian` | 2 | APROVADO | a04f61bc9c4526dd5 |
| 2026-10-26 10:38:00 | 2026-10-26 10:38:41 | `revisor-geral` | 2 | APROVADO | ac5201ae73729bee4 |
| 2026-10-26 10:38:08 | 2026-10-26 10:38:44 | `infra-guardian` | 2 | APROVADO | a3abd75a337a48a4d |
| 2026-10-26 10:37:51 | 2026-10-26 10:38:45 | `privacy-guardian` | 2 | APROVADO | a4ace8b425aecc4b6 |
| 2026-10-26 10:37:47 | 2026-10-26 10:38:49 | `conformidade-reviewer` | 2 | APROVADO | ab8c0045573323687 |
| 2026-10-26 10:38:12 | 2026-10-26 10:39:17 | `test-engineer` | 2 | APROVADO | ad68b48cdcf81e474 |
