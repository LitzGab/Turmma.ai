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
