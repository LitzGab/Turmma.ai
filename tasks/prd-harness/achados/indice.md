# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-10-23 11:50:02 | `tenancy-guardian` | 1ª | REPROVADO | `revisao-spec` | Tech Spec §5(b) (RF15): a tabela não exige a rodada do `tenancy-guardian` em todo commit que cria query, endpoint ou escopo. A regra 10 tem veto. Pela tabela… |
| 2026-10-23 11:50:09 | `privacy-guardian` | 1ª | REPROVADO | `revisao-spec` | Tech Spec §5(b), tabela do RF15. A tabela não faz o hook exigir a minha rodada em boa parte do que toca dado de pessoa, log, storage, exportação, autorização… |
| 2026-10-23 11:51:43 | `conformidade-reviewer` | 1ª | REPROVADO | `revisao-spec` | `techspec.md:71-77` (§5(b), linha da conformidade): a tabela deixa de fora código da regra 70 que existe hoje. Por isso o §7b (`techspec.md:119`) e o §11… |
| 2026-10-23 11:53:11 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | §5(b), tabela caminho → guardião (RF15): o `infra-guardian` fica fora de boa parte do caminho quente. Conferi no repositório o que nenhuma linha da tabela… |
| 2026-10-23 11:53:52 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | §10 / §2: seis requisitos sem teste nenhum. |
| 2026-10-23 11:56:26 | `revisor-geral` | 1ª | REPROVADO | `revisao-spec` | §5c, o hook congelado não chega a todas as linhas e pode travar o time. |
| 2026-10-23 13:04:52 | `tenancy-guardian` | 2ª | REPROVADO | `revisao-spec` | Linhas 56 e 62 da tabela, e §5(b): há repositories que não pedem o `tenancy-guardian`. |
| 2026-10-23 13:06:07 | `privacy-guardian` | 2ª | REPROVADO | `revisao-spec` | `tabela-de-guardioes.md`, linhas que ainda não pedem `privacy` (Tech Spec §5b, RF15). Conferi pasta a pasta no código. Estas linhas guardam dado de pessoa,… |
| 2026-10-23 13:06:40 | `conformidade-reviewer` | 2ª | REPROVADO | `revisao-spec` | `tabela-de-guardioes.md:27, 57, 61, 62, 74 e 48`. Código que hoje impõe a regra 70 continua sem pedir C, e com isso o §7b (`techspec.md:130`) e o PRD §8b ficam… |
| 2026-10-23 13:06:46 | `infra-guardian` | 2ª | REPROVADO | `revisao-spec` | Front-end sem `infra-guardian` (`tasks/prd-harness/tabela-de-guardioes.md:44`, `:46`, `:48`). O lado cliente da regra 80 fica sem guardião: |
| 2026-10-23 13:08:12 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | `cenarios.md:15`, RF4: o caso que passa usa o vocabulário errado, e falta o mutado lento. |
| 2026-10-23 13:08:37 | `revisor-geral` | 2ª | REPROVADO | `revisao-spec` | A terceira camada do RF14 reaproveita uma função que não serve para ela. Está em `tasks/prd-harness/techspec.md:26` e `:67-70`, e em `cenarios.md:58-60`. A… |
| 2026-10-23 13:34:41 | `tenancy-guardian` | 3ª | REPROVADO | `revisao-spec` | `tabela-de-guardioes.md:15-17` e `:49-50` (com `cenarios.md:73-76`): três regras de casamento não têm teste. |
| 2026-10-23 13:35:01 | `test-engineer` | 3ª | REPROVADO | `revisao-spec` | `cenarios.md:16`, RF4: dos três termos do prazo, só o piso tem prova. |
| 2026-10-23 13:35:23 | `conformidade-reviewer` | 3ª | REPROVADO | `revisao-spec` | `tabela-de-guardioes.md:17` e `:50`. A regra "arquivo de exceção que cita regra 10, 20 ou 70 soma o guardião da regra citada" só tem teste para "regra 20 → P". |
| 2026-10-23 13:35:46 | `infra-guardian` | 3ª | REPROVADO | `revisao-spec` | Exceção de `componentes/ui/` e regra de soma sem a regra 80 (`tasks/prd-harness/tabela-de-guardioes.md:24` e `:17`). A exceção dá só C, com o motivo "peça… |
| 2026-10-23 13:35:59 | `privacy-guardian` | 3ª | REPROVADO | `revisao-spec` | `infra/` pede só I, e o resto de `tools/` não pede guardião nenhum (`tabela-de-guardioes.md:41` e `:42`; Tech Spec §5e). Isso contradiz o RF16 do PRD e a D53… |
| 2026-10-23 13:37:33 | `revisor-geral` | 3ª | REPROVADO | `revisao-spec` | §5(a), "Limites declarados (RF14)", `techspec.md:68-74`. A linha `Fora do processo:` não identifica quem escreveu, e isso não está declarado. |
| 2026-10-23 13:41:24 | `conformidade-reviewer` | 4ª | APROVADO | `revisao-spec` | Texto do §5(b). `techspec.md:79` diz "Código em `apps/`, `packages/` e `e2e/` pede os quatro" e omite `tools/guardas/` e `tools/testes/`, que estão na tabela… |
| 2026-10-23 13:41:27 | `privacy-guardian` | 4ª | APROVADO | `revisao-spec` | techspec.md, §5(b) (linha que começa em "Código em apps/, packages/ e e2e/"): o diff tirou tools/guardas/ dessa lista, mas tabela-de-guardioes.md:9-10 mantém… |
| 2026-10-23 13:41:35 | `tenancy-guardian` | 4ª | APROVADO | `revisao-spec` | `techspec.md:79`: o diff tirou `tools/guardas/` da frase do padrão, que agora diz só "apps/, packages/ e e2e/". `tools/testes/` também não está nela. A tabela… |
| 2026-10-23 13:41:54 | `infra-guardian` | 4ª | REPROVADO | `revisao-spec` | `techspec.md:117` e `cenarios.md:15`: o prazo do encontro não diz o que acontece com a verificação que estourou. |
| 2026-10-23 13:43:05 | `revisor-geral` | 4ª | REPROVADO | `revisao-spec` | `texto.md:56-58` e `cenarios.md:114` (RF26): o orçamento soma três arquivos, mas o passo 6 manda ler outros passos em toda tarefa. |
| 2026-10-23 13:43:20 | `test-engineer` | 4ª | REPROVADO | `revisao-spec` | `cenarios.md:16`, RF4: o piso de 60 s continua sem prova, e "ou o do caso" não tem caso. |
| 2026-10-23 13:44:28 | `infra-guardian` | 5ª | APROVADO | `revisao-spec` | `techspec.md:117-120`: a ordem dos passos no prazo fica implícita. Escrever a sequência: matar o grupo, voltar a linha ao commit de antes do merge, soltar o… |
| 2026-10-23 13:45:36 | `test-engineer` | 5ª | REPROVADO | `revisao-spec` | `tabela-de-guardioes.md:20`: `@SemEscopo(` numa linha do RF16 não tem caso. |
| 2026-10-23 13:45:38 | `revisor-geral` | 5ª | APROVADO | `revisao-spec` | `texto.md:59`: nomear o reinício do par da linha entre o que vai para o `6-tarefa.md`. O item 4 do passo 6 de hoje (`.claude/skills/seguir/SKILL.md:218-219`)… |
| 2026-10-23 13:47:15 | `test-engineer` | 6ª | REPROVADO | `revisao-spec` | `techspec.md:116`: o `abrir` grava a linha como ocupada antes de soltar a trava, e nenhum caso prova isso. |
| 2026-10-23 13:49:45 | `test-engineer` | 7ª | REPROVADO | `revisao-spec` | `cenarios.md:15` com `techspec.md:116`: o caso novo do `abrir` não chega à cláusula. O erro vem da minha correção da rodada 6, que partiu de uma premissa… |
| 2026-10-23 13:52:30 | `test-engineer` | 8ª | REPROVADO | `revisao-spec` | `techspec.md:116` com `cenarios.md:15`: depois do `npm ci`, a linha marcada ocupada não tem caso que prove a saída desse estado. A cláusula nova cria um estado… |
| 2026-10-23 13:54:38 | `test-engineer` | 9ª | REPROVADO | `revisao-spec` | Falta um caso para a volta à trava, e falta dizer o que acontece se ela demorar. |
| 2026-10-23 13:56:17 | `test-engineer` | 10ª | APROVADO | `revisao-spec` | Em `tasks/prd-harness/cenarios.md:15`, o "não termina enquanto o encontro segura a trava" (e o "tira a linha 1 só então") precisa de uma observação escrita. A… |
| 2026-10-23 14:37:55 | `infra-guardian` | 1ª | REPROVADO | `5_task` | `tools/processo/linhas.ts:407` (com as linhas 393 e 469): a volta do `abrir` não sabe se a abertura no quadro é a dela. |
| 2026-10-23 14:38:31 | `revisor-geral` | 1ª | REPROVADO | `5_task` | `tools/processo/linhas.ts:407`, com as linhas 393 e 468: a volta do `abrir` não sabe se a abertura que está no quadro é a dela. |
| 2026-10-23 14:38:55 | `test-engineer` | 1ª | REPROVADO | `5_task` | O `abrir` pega a trava no começo, mas isso não tem bloco de mutação nem teste. |
| 2026-10-23 14:49:28 | `infra-guardian` | 2ª | APROVADO | `5_task` | Se alguém rodar `abandonar` enquanto o `abrir` original ainda vive, o `npm ci` de A e o de B rodam ao mesmo tempo no mesmo checkout. Os dois escrevem no mesmo… |
| 2026-10-23 14:49:35 | `revisor-geral` | 2ª | APROVADO | `5_task` | A marca por execução (`abertura`) está no `cenarios.md`, mas não no trecho "No código (5.0)" do §5(f) da `techspec.md` (`techspec.md:120-121`, que só cita… |
| 2026-10-23 14:50:25 | `test-engineer` | 2ª | APROVADO | `5_task` | Mutação que mostra para que serve a marca. Os dois blocos de `aindaAbrindo` (`5_task.md:264-276`) usam a mesma mutação, `aindaAbrindo = true`, e o segundo não… |
| 2026-10-23 14:30:11 | `infra-guardian` | 1ª | REPROVADO | `7_task` | `tools/processo/portao-local.ts:197`: a tarefa mudou o tipo `Rodar` para devolver `boolean \| 'estourou'`, e quem chama não acompanhou. Hoje a linha está assim: |
| 2026-10-23 14:30:31 | `revisor-geral` | 1ª | REPROVADO | `7_task` | `tools/processo/portao-local.ts:197`. A tarefa trocou o retorno de `Rodar` de `boolean` para `boolean \| 'estourou'`, mas o único chamador fora do teste… |
| 2026-10-23 14:31:41 | `test-engineer` | 1ª | REPROVADO | `7_task` | Cláusulas novas sem bloco de mutação. A introdução da seção "Mutações" diz que cobre "o supervisor (o grupo, …)", mas o grupo não tem bloco. Cada item abaixo é… |
| 2026-10-23 14:44:45 | `infra-guardian` | 2ª | APROVADO | `7_task` | O teste do tratador lento afrouxou o limite de 3,5 s para 10 s, com espera de 20 s. Ainda prova que o grupo terminou sem esperar a espera inteira, mas a margem… |
| 2026-10-23 14:44:53 | `revisor-geral` | 2ª | APROVADO | `7_task` | O parágrafo do topo de "Mutações" (`tasks/prd-harness/7_task.md:73`) lista o que os blocos cobrem, mas não cita as cláusulas novas da reconstrução e de… |
| 2026-10-23 14:45:51 | `test-engineer` | 2ª | APROVADO | `7_task` | `tasks/prd-harness/7_task.md:39-53`: a tabela "Testes que provam a regra" não tem linha para a reconstrução da web que estoura, cai ou roda com mutação… |
| 2026-10-23 14:25:07 | `revisor-geral` | 1ª | APROVADO | `1_task` | `tools/processo/revisoes.ts:362`: o rótulo dos subagentes é lido por `split`, enquanto o `estado.ts` usa `escaparTexto` com `RegExp`. São dois jeitos de fazer… |
| 2026-10-23 14:26:07 | `test-engineer` | 1ª | APROVADO | `1_task` | `rotulos.test.ts:230`. No teste `quem contorna é acusado`, a asserção confere só o rótulo, não o modelo. `ROTULO_DO_VEREDITO` aparece em dois modelos… |
| 2026-10-23 14:32:40 | `test-engineer` | 2ª | APROVADO | `1_task` | A premissa de que o subagente herda o papel do terminal ainda vale só para a Mesa (linhas 57-60 do documento). Antes da 11.0, a Tech Spec (§12) precisa… |
| 2026-10-23 14:32:50 | `revisor-geral` | 2ª | APROVADO | `1_task` | Antes de abrir a 11.0, o Orquestrador precisa de fato levar ao Arquiteto a atualização do `techspec.md` §12, primeira premissa. Ela deve deixar de dizer "NÃO… |
| 2026-10-23 15:08:22 | `infra-guardian` | 1ª | APROVADO | `8_task` | O `stop` antes da integração não faz diferença no fluxo atual. No alvo, a integração sempre roda com `bancoNovo: true` (`EDUCA_BANCO_NOVO=1`). Com essa… |
| 2026-10-23 15:10:08 | `revisor-geral` | 1ª | REPROVADO | `8_task` | `tools/processo/sequencia-do-portao.ts:60` e `tools/processo/portao-local.ts:157`. O `stop` que a tarefa acrescenta não muda nada, e o portão continua deixando… |
| 2026-10-23 15:11:46 | `test-engineer` | 1ª | REPROVADO | `8_task` | `tools/processo/portao-local.ts:131`: a linha nova `EDUCA_BANCO_NOVO: passo.bancoNovo ? '1' : undefined` tem um ternário e nenhum bloco de mutação no documento. |
| 2026-10-23 15:19:41 | `infra-guardian` | 2ª | APROVADO | `8_task` | `tools/ci/duracao-do-e2e.test.ts:610-623`: o teste "o portão liga a sequência pura" procura em `portao-local.ts` a linha inteira, caractere por caractere… |
| 2026-10-23 15:20:28 | `revisor-geral` | 2ª | APROVADO | `8_task` | Uma ordem de mutações ainda deixa o RF7 aberto. Uma mutação de e2e sobre `apps/` ou `packages/` usa `pedeReconstrucao` e roda `node tools/ci/e2e.ts… |
| 2026-10-23 15:20:39 | `test-engineer` | 2ª | APROVADO | `8_task` | Em `tasks/prd-harness/8_task.md:51-57`, a tabela "Testes que provam a regra" não tem linha para a divergência 5 (o `stop` antes das mutações de integração). As… |
| 2026-10-23 16:03:08 | `revisor-geral` | 1ª | APROVADO | `2_task` | `tools/processo/hook-revisoes.ts:1`: o comentário ainda diz "A lógica e o teste ficam em revisoes.ts". Agora a lógica está nos quatro módulos. Os comentários… |
| 2026-10-23 16:03:18 | `test-engineer` | 1ª | APROVADO | `2_task` | "Só reexporta" sem teste. Nenhum teste prova que o `revisoes.ts` só reexporta. Uma função nova colada nele de volta passa sem nada ficar vermelho. Como as… |
| 2026-10-23 16:15:09 | `revisor-geral` | 2ª | APROVADO | `2_task` | `tools/processo/harness/particao.test.ts:196`: a linha que monta a mensagem de falha passa de 150 colunas. Ela é citada literalmente em dois blocos de mutação.… |
| 2026-10-23 16:15:20 | `test-engineer` | 2ª | APROVADO | `2_task` | Os blocos novos citam o teste por um trecho do nome: "o arquivo de hoje passa", "de um módulo que sumiu: vermelho" e "o arquivo que não existe: vermelho". O… |
| 2026-10-23 16:16:28 | `revisor-geral` | 6ª | REPROVADO | `revisao-spec` | techspec §9 (Receitas), cenarios RF32 (coluna "o repositório de hoje") e 21.0 ("Fora do escopo" e "Testes que provam a regra"). A spec não define o que é um… |
| 2026-10-23 16:16:28 | `test-engineer` | 11ª | REPROVADO | `revisao-spec` | O verde do "repositório de hoje" é impossível do jeito que a spec está (techspec §9, "Receitas"; `21_task.md`, "Como testar" e "Fora do escopo"). |
| 2026-10-23 16:19:41 | `revisor-geral` | 7ª | REPROVADO | `revisao-spec` | `tasks/prd-harness/techspec.md`, §9, parágrafo "O que conta como caminho" (diff +183 a +190): o critério quebra a 16.0 do jeito que está escrito. |
| 2026-10-23 16:20:03 | `test-engineer` | 12ª | APROVADO | `revisao-spec` | `techspec.md` §9, "a linha 'Exemplo:'". Na 5.6 o "Exemplo:" fica no meio da linha ("Todo módulo novo entrega um (regra 10.5). Exemplo: ..."). Um leitor com… |
| 2026-10-23 16:22:23 | `revisor-geral` | 8ª | APROVADO | `revisao-spec` | 16_task.md, 16.2, e techspec §9: a 21.0 agora depende do que a extração da 16.0 devolve. Ela precisa receber o token cru, com `<...>`, `*` e a `/` final (o… |
| 2026-10-23 16:53:12 | `revisor-geral` | 1ª | APROVADO | `6_task` | `tools/processo/linhas.ts:517`: o `abrir` ainda usa o literal `'npm ci'`, embora a tarefa tenha criado `COMANDO_DE_INSTALACAO`. Isso deixa dois jeitos de dizer… |
| 2026-10-23 16:53:47 | `infra-guardian` | 1ª | APROVADO | `6_task` | `tools/processo/linhas.ts:1102`: quando o lock mudou e a verificação fica vermelha, o `npm ci` já instalou o `node_modules` do lock da spec. O `reset --hard`… |
| 2026-10-23 16:55:08 | `test-engineer` | 1ª | REPROVADO | `6_task` | `linhas.ts:445`: o SIGINT e o SIGHUP não têm teste. |
| 2026-10-23 17:09:49 | `infra-guardian` | 2ª | APROVADO | `6_task` | nenhuma nova. Conferi o diff da rodada contra o código: |
| 2026-10-23 17:09:56 | `revisor-geral` | 2ª | APROVADO | `6_task` | `tools/processo/linhas.test.ts:1309`: o `it` dentro do `for (const sinal …)` não foi indentado, e o `}` de fechamento na linha 1326 fica alinhado com o `it`.… |
| 2026-10-23 17:10:29 | `test-engineer` | 2ª | APROVADO | `6_task` | Em `linhas.test.ts:1279`, o `expect(encontroDaLinha1.jaSaiu()).toBe(false)` só prova que o encontro ainda estava vivo na hora em que o `spawn` da espia foi… |
