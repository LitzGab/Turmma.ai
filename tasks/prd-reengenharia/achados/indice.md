# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-10-21 15:21:26 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | A origem da `sequencia` do cliente não está definida (`onda-3.md` §2, T13, 51.0 e 53.0). O servidor só grava com `where excluded.sequencia >… |
| 2026-10-21 15:22:27 | `tenancy-guardian` | 1ª | REPROVADO | `revisao-spec` | O worker de IA não diz de onde vem a escola (onda-3.md, §2 "T9 — o worker da API" e §4; techspec.md §6, item 47.0; onda-1a.md, T6, linha `ia/execucao`). |
| 2026-10-21 15:23:32 | `llm-integrator` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | Contexto do worker de IA, `onda-3.md` §2 T9 (42.0 e 47.0). |
| 2026-10-21 15:23:58 | `privacy-guardian` | 1ª | REPROVADO | `revisao-spec` | O PDF passa a ser guardado no storage sem ciclo de vida definido (`onda-3.md` §2, "O PDF (45.0)", e §4). Hoje os bytes nunca são gravados… |
| 2026-10-21 15:24:08 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | Limite de IA por escola sem lugar definido, e a conta das 10h não fecha. `onda-3.md` §2, "Limites mantidos (R39)", e `techspec.md` §7c, linhas "Limite por… |
| 2026-10-21 15:24:14 | `conformidade-reviewer` | 1ª | REPROVADO | `revisao-spec` | `onda-0.md` §2.4 (RF3), repetido em `onda-3.md` §2, T9, 42.0 ("a conferência da 4.0 fica no `preparar` e no `concluir`"). O erro: no `aoConcluir`, a… |
| 2026-10-21 15:24:40 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | Teste do `ouro` sem limite (onda-0 §2.1 e §2.2, RF1 e RF2). |
| 2026-10-21 15:36:50 | `frontend-reviewer` | 2ª | AJUSTES NECESSÁRIOS | `revisao-spec` | `onda-4.md` §2.6 (79.0) e `onda-4.md:93-98`. A C34 pedia a tabela dos estados do sino com os textos antes e depois. O que veio é uma frase corrida sobre o… |
| 2026-10-21 15:37:50 | `tenancy-guardian` | 2ª | REPROVADO | `revisao-spec` | `onda-1a.md:77-81` (12.0): as pastas da trava se contradizem. |
| 2026-10-21 15:38:18 | `infra-guardian` | 2ª | REPROVADO | `revisao-spec` | O prazo dos jobs de IA foi escrito por fila, e devia ser por perfil (a C22 está incompleta). Está em `tasks/prd-reengenharia/onda-3b.md`, §2, "48.0, O… |
| 2026-10-21 15:38:23 | `llm-integrator` | 2ª | AJUSTES NECESSÁRIOS | `revisao-spec` | `onda-3a.md` §2 "O worker da API (45.0 e 47.0)" e `onda-3b.md` §2 "48.0 (C22)": `prazoMs` de 60 s para `ia.executar-agente` contradiz o pior caso do `padrao`. |
| 2026-10-21 15:38:55 | `privacy-guardian` | 2ª | REPROVADO | `revisao-spec` | O apagamento do PDF por varredura depende de coisas que o código não tem (`onda-3a.md` §2 "O PDF (45.0)", linhas 81, 94 e 95; C17). |
| 2026-10-21 15:39:56 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | `docsREADME.md`: o corpus selado contradiz o desenho. |
| 2026-10-21 15:40:52 | `conformidade-reviewer` | 2ª | REPROVADO | `revisao-spec` | O alvo de `julgamentoDeTextoDeAluno` não tem tarefa que o alcance. |
| 2026-10-21 15:48:57 | `privacy-guardian` | 3ª | APROVADO | `revisao-spec` | onda-3b.md §2, "Órfão": chaveDoTemporario usa exigirEscolaDoContexto(), mas a varredura tem @SemEscopo e não tem contexto. Escrever que ela monta a chave pelo… |
| 2026-10-21 15:48:58 | `frontend-reviewer` | 3ª | AJUSTES NECESSÁRIOS | `revisao-spec` | `onda-4b.md` §2.3 (79.0) e §1: a 79.0 apaga um módulo que outras telas ainda usam, e a frase "a pessoa só vê o sino mudar" é falsa. |
| 2026-10-21 15:49:13 | `llm-integrator` | 3ª | AJUSTES NECESSÁRIOS | `revisao-spec` | `onda-0.md` §2.1 ("Leitor e selo") e §2.2 ("1.0 mede e sela… liga as três"): o `base` não tem ordem executável. |
| 2026-10-21 15:49:23 | `tenancy-guardian` | 3ª | REPROVADO | `revisao-spec` | A varredura do órfão não tem como montar a chave (`onda-3b.md:43-45` contra `onda-3b.md:65`; e `onda-3b.md:64`). |
| 2026-10-21 15:50:35 | `test-engineer` | 3ª | REPROVADO | `revisao-spec` | A 1.0 não consegue ligar o teste com a `base` nula, e a `saidaQualitativa` não tem `base` possível (`onda-0.md:53-54`, `:61-63`; `MEDIDAS.json:60-65`). |
| 2026-10-21 15:50:47 | `infra-guardian` | 3ª | REPROVADO | `revisao-spec` | A conta fecha por escola e não fecha no total. Arquivo: `tasks/prd-reengenharia/onda-3a.md:53` e `:64-65`. |
| 2026-10-21 15:51:55 | `conformidade-reviewer` | 3ª | REPROVADO | `revisao-spec` | `onda-4b.md:118` (73.0) e `:115` (70.0): duas telas da regra 70 são cortadas sem o `conformidade-reviewer` no veto. Achei ao conferir a lista de mutações que… |
| 2026-10-21 16:06:26 | `llm-integrator` | 4ª | AJUSTES NECESSÁRIOS | `revisao-spec` | `onda-3c.md:24` conta como falha do disjuntor a "chamada acima de metade do prazo". Com `LLM_TIMEOUT_MS_PADRAO` = 60 s, o limite é 30 s. Mas `onda-3a.md`… |
| 2026-10-21 16:06:38 | `conformidade-reviewer` | 4ª | APROVADO | `revisao-spec` | `onda-0.md:52` diz "`base` nula depois da 1.0 falha", mas o `MEDIDAS.json` traz `saidaQualitativa.base: null` com `semBaseAte: "3.0"`. Lido ao pé da letra, o… |
| 2026-10-21 16:06:50 | `frontend-reviewer` | 4ª | AJUSTES NECESSÁRIOS | `revisao-spec` | `onda-4b.md` §2.3, saída de `parcial` do `Sino.tsx` (`:44`, `:98`, `:196`). |
| 2026-10-21 16:06:57 | `tenancy-guardian` | 4ª | REPROVADO | `revisao-spec` | `tasks/prd-reengenharia/onda-3b.md:53` e `:74-75`: a E4 pedia que a varredura pegasse material `pronto`, `falhou` ou excluído. Hoje o `processado_em` só é… |
| 2026-10-21 16:07:29 | `test-engineer` | 4ª | REPROVADO | `revisao-spec` | O órfão de material `falhou` nunca é apagado, e nenhum teste vê isso (`onda-3b.md:53`, `:64-66`, `:74-75`, `:104`). |
| 2026-10-21 16:09:10 | `infra-guardian` | 4ª | REPROVADO | `revisao-spec` | O disjuntor abre com a duração normal de uma ferramenta. Está em `onda-3c.md:23-24` contra `onda-3a.md:64` e `:97-99`. Ele conta como falha toda chamada acima… |
| 2026-10-21 16:15:35 | `privacy-guardian` | 4ª | APROVADO | `revisao-spec` | Na linha 68 do `onda-3b.md`, escrever "da retenção do material configurada pela escola, fora da janela letiva, parando quando ela abre" e citar… |
| 2026-10-21 16:16:02 | `frontend-reviewer` | 5ª | APROVADO | `revisao-spec` | A 4B não diz o nome do botão do sino no estado `sem-ano-letivo`. O `:298` clica em "Esperando você, parte não carregou", que deixa de existir sem o `parcial`.… |
| 2026-10-21 16:16:07 | `test-engineer` | 5ª | APROVADO | `revisao-spec` | `onda-3b.md:106`: escrever que o `falhou` de 25 h nasce da reconciliação real, com relógio falso, e não de linha inserida já com `processado_em`. Se for… |
| 2026-10-21 16:16:11 | `tenancy-guardian` | 5ª | APROVADO | `revisao-spec` | `onda-3b.md:36`: a contagem diz "`operacao/` já tem cinco e `ops/`, oito". No código são três e três: `painel.repository.ts` em `operacao/`;… |
| 2026-10-21 16:16:45 | `llm-integrator` | 5ª | APROVADO | `revisao-spec` | Pior caso do menor (3c): a espera de 8 s é por reserva, e a reserva é por chamada. Com as 2 tentativas do `chamarAteValer` o pior caso é 2×(8+prazo), ou seja… |
| 2026-10-21 16:17:03 | `infra-guardian` | 5ª | APROVADO | `revisao-spec` | `onda-3a.md:98`: falta dizer de onde vem o número de "jobs ativos da réplica". Hoje não há nada que o dê: `job_registro` não grava o worker e não existe gauge… |
| 2026-10-21 20:19:36 | `conformidade-reviewer` | 1ª | APROVADO | `1_task` | Brechas medidas em `saidaComNota`, para a 2.0 tratar primeiro. A medida de hoje mostra onde o filtro deixa passar nota ou conceito sobre texto de aluno:… |
| 2026-10-21 20:20:01 | `revisor-geral` | 1ª | APROVADO | `1_task` | `packages/nucleo/src/ia/ouro.test.ts:76`: `recusa()` dá certo com qualquer exceção, e não só com a recusa do zod. Os testes que deviam ser vermelhos hoje são,… |
| 2026-10-21 20:20:42 | `test-engineer` | 1ª | REPROVADO | `1_task` | Cláusulas novas sem bloco em `packages/nucleo/src/ia/__fixtures__/ouro.ts`. Nenhum teste fica vermelho se qualquer uma delas sair: |
| 2026-10-21 20:36:09 | `revisor-geral` | 2ª | APROVADO | `1_task` | `packages/nucleo/src/ia/ouro.test.ts`: `quaisErraram`, a constante de 40 ids e `recusa()` são auxiliares do teste que agora têm testes e mutações próprios. Se… |
| 2026-10-21 20:37:15 | `test-engineer` | 2ª | APROVADO | `1_task` | O bloco de `1_task.md:335-339` só tem a linha `-`, ou seja, apaga o `throw`. É válido, mas um `+` explícito (por exemplo `+ if (false) throw new… |
| 2026-10-21 20:22:55 | `tenancy-guardian` | 1ª | APROVADO | `4_task` | `apps/api/src/tutor/tutor.int.test.ts`: falta um caso com uma avaliação aberta na escola B durante a janela, para que a mutação "tirar `escolaId` de… |
| 2026-10-21 20:23:10 | `revisor-geral` | 1ª | APROVADO | `4_task` | Funções repetidas nos testes. `execucaoLida`, `pausada` e `consumoDaExecucao` aparecem com quase o mesmo corpo nos dois arquivos de teste (`tutor.int.test.ts`… |
| 2026-10-21 20:23:11 | `conformidade-reviewer` | 1ª | APROVADO | `4_task` | O texto diz que a pergunta pausada fica "no registro que o professor vê", e isso não bate com o código. Está em `tasks/prd-reengenharia/onda-0.md` §2.4 e no… |
| 2026-10-21 20:23:23 | `infra-guardian` | 1ª | APROVADO | `4_task` | apps/api/src/tutor/tutor.int.test.ts:559: o nome do caso diz "parados na vez de rodar (o teto de execuções por escola)", mas quem segura as duas execuções é o… |
| 2026-10-21 20:24:12 | `test-engineer` | 1ª | APROVADO | `4_task` | Segunda janela sem duas asserções. O caso "abre entre a execução e a conclusão" em `tutor-modelo.int.test.ts` não afirma que a pergunta continua em… |
| 2026-10-21 20:30:55 | `revisor-geral` | 2ª | APROVADO | `4_task` | `apps/api/src/tutor/tutor.int.test.ts:514`: o comentário "A pergunta continua no registro que o professor vê" repete a frase do `onda-0.md` §2.4. O próprio… |
| 2026-10-21 20:30:59 | `test-engineer` | 2ª | APROVADO | `4_task` | A linha 60 da tabela diz que a marca é procurada também no Redis. As asserções novas da segunda janela não olham o Redis, só as tabelas e o log. Essa janela… |
| 2026-10-21 20:06:27 | `revisor-geral` | 1ª | APROVADO | `5_task` | `hook-portao.test.ts:24-25`: `comandoDe` chama `expect` fora de um `it`. Em `const portao = comandoDe(...)`, dentro do `describe`, esse `expect` roda na… |
| 2026-10-21 20:06:36 | `test-engineer` | 1ª | APROVADO | `5_task` | `hook-portao.test.ts:41` copia só os `.ts` de `tools/processo/`. Se o hook passar a importar arquivo de outra pasta, ou que não seja `.ts`, os casos do hook… |
| 2026-10-21 20:12:14 | `test-engineer` | 2ª | APROVADO | `5_task` | nenhuma nova. |
| 2026-10-21 20:58:48 | `conformidade-reviewer` | 1ª | APROVADO | `2_task` | O sinal `atencao_humana` sai com o nome do aluno que escreveu, também quando o risco é de outra pessoa ("meu irmão disse que quer se matar", "meu colega postou… |
| 2026-10-21 21:00:53 | `revisor-geral` | 1ª | REPROVADO | `2_task` | Os padrões foram escritos a partir das frases do `ouro`, e isso invalida a medida de `riscoAVida`. |
| 2026-10-21 21:02:16 | `test-engineer` | 1ª | REPROVADO | `2_task` | O `ouro` de `riscoAVida` foi usado para escrever os padrões, e o teste do alvo prova memorização, não a regra. |
| 2026-10-21 21:22:57 | `conformidade-reviewer` | 2ª | REPROVADO | `2_task` | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:163`: automutilação por bater, arranhar e morder agora escapa. |
| 2026-10-21 21:24:28 | `revisor-geral` | 2ª | REPROVADO | `2_task` | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:140-194`, com o comentário de `:130-131`. A correção 1 da rodada anterior foi feita só para os exemplos que… |
| 2026-10-21 21:24:52 | `test-engineer` | 2ª | REPROVADO | `2_task` | A correção (c) não foi cumprida: os padrões novos copiam a frase da sonda e não o jeito de dizer. É o mesmo sobreajuste da rodada 1, agora à sonda. |
| 2026-10-22 00:45:59 | `conformidade-reviewer` | 3ª | REPROVADO | `2_task` | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:170`, a ameaça contada não cobre "vão" nem "iam". |
| 2026-10-22 00:48:12 | `revisor-geral` | 3ª | REPROVADO | `2_task` | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:131-132` e `tasks/prd-reengenharia/2_task.md:106-110` afirmam uma cobertura que não existe. É a mesma… |
| 2026-10-22 00:48:49 | `test-engineer` | 3ª | REPROVADO | `2_task` | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:170`: o C8 saiu com `(?:vai\|ia)`, e a decisão manda `(?:vai\|vao\|ia\|iam)`. |
| 2026-10-22 07:32:47 | `revisor-geral` | 4ª | APROVADO | `2_task` | O `na ` da exclusão tira "bato na porta até sangrar" (o punho na porta) do disparo; a "cabeça na porta" continua disparando. A forma é decisão do Arquiteto e é… |
| 2026-10-22 07:33:28 | `test-engineer` | 4ª | REPROVADO | `2_task` | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:179` (o padrão de bater/arranhar/beliscar/morder): o `?` do artigo em `(?! (?:o \|a \|no \|na… |
| 2026-10-22 07:33:49 | `conformidade-reviewer` | 4ª | APROVADO | `2_task` | O item 8 desviou da ordem com justificativa. Cabe ao Arquiteto ratificar o desvio no registro, para que não volte na 26.0. |
| 2026-10-22 07:46:16 | `test-engineer` | 5ª | APROVADO | `2_task` | O `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/.processo/portao.json` mostra um portão iniciado às 10:35Z, com 444 mutações e… |
| 2026-10-22 10:07:24 | `test-engineer` | 1ª | REPROVADO | `93_task` | `${DESEJO}` nos padrões de eufemismo, `mrr` e `sui`. Em `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:202`, `:204` e `:205`, o documento tem bloco para… |
| 2026-10-22 10:08:21 | `conformidade-reviewer` | 1ª | REPROVADO | `93_task` | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:267`. O estreitamento de "dose letal" deixa de disparar em frases em que o aluno fala de si. |
| 2026-10-22 10:09:14 | `revisor-geral` | 1ª | REPROVADO | `93_task` | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:142` (`OBJETO_DE_LABORATORIO`) e `:267` (o padrão de "dose letal"): a tarefa voltou a deixar passar frases… |
| 2026-10-22 10:29:17 | `test-engineer` | 2ª | APROVADO | `93_task` | Teto da janela de 20 caracteres da sigla. Os blocos `.{0,2}` (`93_task.md`:1788 e :1795) provam o piso. Nenhuma frase do `turno-do-tutor.test.ts` prova o teto.… |
| 2026-10-22 10:29:41 | `conformidade-reviewer` | 2ª | REPROVADO | `93_task` | `turno-do-tutor.ts:267`, a regra de "dose letal" com as constantes `DOSE_LETAL` e `SIGLA_DL50` (linhas 141 e 142). |
| 2026-10-22 10:30:31 | `revisor-geral` | 2ª | REPROVADO | `93_task` | `packages/nucleo/src/ia/tarefas/turno-do-tutor.ts:267`: "raticida" e "chumbinho" escapam quando vêm depois de "pra rato". A correção exigida dizia que a… |
| 2026-10-22 10:48:23 | `conformidade-reviewer` | 3ª | APROVADO | `93_task` | A N13 traz agora uma limitação que não tinha antes: a carta do próprio aluno passa quando a palavra depois de "do/da" não é um nome ("a carta de suicídio da… |
| 2026-10-22 10:48:58 | `revisor-geral` | 3ª | APROVADO | `93_task` | `93_task.md:45`: a subtarefa 93.2 diz "As três pioras desfeitas" e está marcada `[x]`, mas a terceira ficou de propósito. Seria mais exato escrever "duas… |
| 2026-10-22 10:49:23 | `test-engineer` | 3ª | REPROVADO | `93_task` | Sete blocos de mutação de cláusulas novas foram apagados junto com os de `DOSE_LETAL`. O diff do documento (hunk `@@ -1669,193 +1606,10 @@`) não apagou só os… |
| 2026-10-22 10:58:30 | `test-engineer` | 4ª | APROVADO | `93_task` | A amostra do "poeta romântico" continua sem teste que fixe o comportamento dela. Já está nas "Recomendações sem aplicar", com destino ao `TODO.md`. A Mesa… |
