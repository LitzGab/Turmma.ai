# Índice dos achados das revisões

Uma linha por rodada que exigiu alguma coisa. O texto inteiro está no arquivo do documento, nesta
pasta (`<documento>.md`), no bloco com o mesmo fim. Escrito pelo hook `tools/processo/revisoes.ts`.
Não edite à mão.

Leia este índice antes de codar, e abra só os blocos que interessam à tarefa de agora.

| Fim | Revisor | Rodada | Veredito | Documento | O que exigiu |
|---|---|---|---|---|---|
| 2026-10-13 08:36:46 | `frontend-reviewer` | 1ª | AJUSTES NECESSÁRIOS | `revisao-spec` | Tech Spec seção 9 ("Peças novas") e seção 5 ("Rever"), tarefa 9.5, 10.3 e 11.3: a `BemVindo` não tem estados definidos. |
| 2026-10-13 08:37:12 | `tenancy-guardian` | 1ª | REPROVADO | `revisao-spec` | Tech Spec, seções 6 e 10: a regra de que cada um só grava a própria data fica sem prova. Os quatro testes da seção 6 e o "repetida, em paralelo, por papel" da… |
| 2026-10-13 08:38:25 | `infra-guardian` | 1ª | REPROVADO | `revisao-spec` | Tech Spec, seção 7c ("Carga na manhã de segunda" e "Métrica, alerta, teste de carga"), e seção 9 ("Início"). A spec trata a requisição nova do Início como leve… |
| 2026-10-13 08:38:42 | `privacy-guardian` | 1ª | REPROVADO | `revisao-spec` | Tech Spec §7b, PRD RF14 e tarefa 9.1: o aviso promete uma coisa e o sistema faz outra, e o teste da RF14 prende o texto errado. |
| 2026-10-13 08:38:59 | `conformidade-reviewer` | 1ª | REPROVADO | `revisao-spec` | B1. Tech Spec §9 ("Peças novas"), PRD RF19 e tarefa 5.1: a onça das poses pode ter expressão. |
| 2026-10-13 08:40:02 | `test-engineer` | 1ª | REPROVADO | `revisao-spec` | Tarefa 1.0, Tech Spec §6 e §10: falta o caso da escola sem ano letivo em curso. |
| 2026-10-13 08:48:42 | `frontend-reviewer` | 2ª | APROVADO | `revisao-spec` | Com zero tarefas, o Início não oferece rota até o Tutor, porque a conversa é sempre atrelada a uma atividade (`EscolhaDaAtividade`, `Tutor.tsx:147`). Isso é o… |
| 2026-10-13 08:49:52 | `test-engineer` | 2ª | REPROVADO | `revisao-spec` | O PRD promete mais do que a saída escolhida entrega. |
| 2026-10-13 08:49:57 | `conformidade-reviewer` | 2ª | APROVADO | `revisao-spec` | Tarefa 6.0: pôr o texto da `Comemoracao` ("Atividade entregue.", "Quem dá a aula vê a correção antes de você.") no mesmo teste de falas da regra 70, item 4a.… |
| 2026-10-13 08:50:26 | `tenancy-guardian` | 2ª | REPROVADO | `revisao-spec` | Tech Spec §3 ("Primeira saída") e §12b item 1; tarefa 1.0, subtarefa 1.2 e caso "duas escolas" ("devolve a data e a grava na linha de B"). |
| 2026-10-13 08:50:36 | `privacy-guardian` | 2ª | REPROVADO | `revisao-spec` | Tech Spec §7b, PRD RF14 e tarefa 9.1 (frase "A escola escolhe por quanto tempo guarda: de 6 a 24 meses.", e a linha "texto do aviso" da tabela de testes da… |
| 2026-10-13 08:50:58 | `infra-guardian` | 2ª | REPROVADO | `revisao-spec` | Tech Spec §7c ("Métrica, alerta, teste de carga"), §10 ("Carga") e tarefa 3.1 (`tasks/prd-telas-do-aluno-e-primeiro-acesso/3_task.md`): o cenário novo não… |
| 2026-10-13 08:55:39 | `test-engineer` | 3ª | APROVADO | `revisao-spec` | `tasks.md:10` não acompanhou a correção. A subtarefa 1.2 ainda diz "copia a emprestada para a própria linha", que é o contrário da Tech Spec §3 ("nunca grava o… |
| 2026-10-13 08:55:39 | `privacy-guardian` | 3ª | APROVADO | `revisao-spec` | `tasks.md`, item 1.2, contradiz a Tech Spec. Diz que o GET "copia a emprestada para a própria linha", que é justamente o desenho recusado na rodada 2. O teste… |
| 2026-10-13 08:55:43 | `tenancy-guardian` | 3ª | REPROVADO | `revisao-spec` | `tasks.md` 1.2 e Tech Spec §7c ("Carga na manhã de segunda"). |
| 2026-10-13 08:56:23 | `infra-guardian` | 3ª | REPROVADO | `revisao-spec` | O limite de p95 que deveria valer na rajada não existe. Afeta a Tech Spec §7c ("Métrica, alerta, teste de carga"), a §10 ("Carga") e a subtarefa 3.1 de… |
| 2026-10-13 08:58:13 | `tenancy-guardian` | 4ª | APROVADO | `revisao-spec` | Sobrou uma recomendação da rodada 3 sobre o método da leitura entre escolas, e a `1_task.md` 1.2 agora se contradiz por dentro: |
| 2026-10-13 08:58:20 | `infra-guardian` | 4ª | APROVADO | `revisao-spec` | Limite por rota. O p95 da rajada mistura, por conta, três `GET /v1/sistema/contexto` com um `/v1/eu` e um `minhas-atividades`. Uma `minhas-atividades` lenta em… |
| 2026-10-25 00:53:38 | `tenancy-guardian` | 1ª | APROVADO | `1_task` | A tabela de testes da tarefa (`tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md:76`) pede um teste de integração em que a sessão de rede é recusada no… |
| 2026-10-25 00:53:57 | `conformidade-reviewer` | 1ª | APROVADO | `1_task` | A tabela de testes da tarefa promete "rede: a sessão de rede é recusada no POST" como teste de integração. Não achei esse caso em… |
| 2026-10-25 00:54:02 | `infra-guardian` | 1ª | APROVADO | `1_task` | `apps/api/test/introducao.int.test.ts:61-67`: o teste da gravação que falha cria e apaga um trigger em `usuario`, a tabela que todos os testes usam. Esse… |
| 2026-10-25 00:54:06 | `privacy-guardian` | 1ª | APROVADO | `1_task` | A tabela de testes da tarefa pede "rede: a sessão de rede é recusada no POST" como integração. Hoje isso só está provado pela matriz… |
| 2026-10-25 00:55:01 | `revisor-geral` | 1ª | APROVADO | `1_task` | Falta o teste do `escolher` que a subtarefa 1.2 pede. A 1.2 está marcada `[x]` e pede "teste de que o `escolher` não leva a data". Esse teste não existe. O… |
| 2026-10-25 00:56:19 | `test-engineer` | 1ª | REPROVADO | `1_task` | O teste de que o `escolher` não leva a data não existe. A subtarefa 1.2 pede isso com todas as letras (`tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md:31`… |
| 2026-10-25 01:07:03 | `tenancy-guardian` | 2ª | APROVADO | `1_task` | `packages/nucleo/dist/telemetria/metricas.{js,d.ts}` ainda tem a chave antiga `introducaoNaoGravada`. O `dist` é artefato de build e não está no git, mas o… |
| 2026-10-25 01:07:07 | `privacy-guardian` | 2ª | APROVADO | `1_task` | O comentário em `packages/nucleo/src/titular/leitura-do-titular.ts:32` ainda diz que a versão `coordenacao` não traz só a data do professor. O código também… |
| 2026-10-25 01:07:16 | `infra-guardian` | 2ª | APROVADO | `1_task` | `packages/nucleo/dist/telemetria/metricas.js:95` e `metricas.d.ts:98` ainda têm a chave antiga `introducaoNaoGravada`. É artefato de build e não entra na… |
| 2026-10-25 01:07:31 | `test-engineer` | 2ª | REPROVADO | `1_task` | `tasks/prd-telas-do-aluno-e-primeiro-acesso/1_task.md:58-78` (tabela "Testes que provam a regra") e `1_task.md:31` (subtarefa 1.2, "teste de que o `escolher`… |
| 2026-10-25 01:07:32 | `conformidade-reviewer` | 2ª | APROVADO | `1_task` | `docs/lgpd.md:105`: a proibição de usar a data como indicador está só escrita. Quando a coordenação ganhar painel de adoção, vale um caso em… |
| 2026-10-25 01:07:38 | `revisor-geral` | 2ª | APROVADO | `1_task` | O parâmetro `opcoes.introducao` de `criarProfessoraNaEscola` e `criarCoordenadoraNaEscola` (`e2e/__fixtures__/sessao.ts:218,223`) não tem chamador nesta… |
| 2026-10-25 01:17:28 | `test-engineer` | 3ª | APROVADO | `1_task` | Para quem procura o nome com busca de texto, convém citar o nome inteiro dos testes de `introducao.int.test.ts`, como já foi feito em… |
| 2026-10-25 01:17:34 | `revisor-geral` | 3ª | APROVADO | `1_task` | No comentário de `introducao.int.test.ts:275`, dizer com precisão que o `now()` dá a hora do início da transação, que num update avulso coincide com a da… |
| 2026-10-25 03:44:42 | `frontend-reviewer` | 1ª | APROVADO | `2_task` | `apps/web/src/componentes/CascaDaEscola.tsx:300` e `:361`: o `<ContextoDaSaida>` ficou sem recuo em volta do `<div>` que ele envolve. Rodar o formatador. Se o… |
| 2026-10-25 03:44:50 | `conformidade-reviewer` | 1ª | APROVADO | `2_task` | `e2e/__fixtures__/aluno.ts:57-61`: o comentário de `memoria` diz que Eu trata `NAO_ENCONTRADO` como "sem resultado", mas o Eu desta tarefa nem chama… |
| 2026-10-25 03:44:58 | `infra-guardian` | 1ª | APROVADO | `2_task` | `e2e/__fixtures__/aluno.ts`: a API simulada passa a responder `GET /v1/tutor/memoria` e `GET /v1/tutor/conversa` sem atividade, mas nada no código desta tarefa… |
| 2026-10-25 03:45:45 | `privacy-guardian` | 1ª | APROVADO | `2_task` | A tabela de testes da tarefa promete "o aluno seguinte no mesmo Chromebook vê o Início e o Eu dele". O Eu está provado (`e2e/minha-turma.spec.ts`, "recomeço de… |
| 2026-10-25 03:46:03 | `revisor-geral` | 1ª | APROVADO | `2_task` | Comentário que contradiz a Tech Spec. Em `e2e/__fixtures__/aluno.ts`, logo antes de `const atividade = url.searchParams.get('atividadeAplicadaId')`, está… |
| 2026-10-25 03:46:33 | `test-engineer` | 1ª | REPROVADO | `2_task` | O recomeço do Início não tem teste. A linha "recomeço da tela" (`tasks/prd-telas-do-aluno-e-primeiro-acesso/2_task.md:56`) pede "o aluno seguinte… vê o Início… |
| 2026-10-25 04:11:54 | `revisor-geral` | 2ª | APROVADO | `2_task` | `e2e/minha-turma.spec.ts:261`: o padrão `/v1/minhas-atividades` não pega `?pagina=`. Hoje não faz diferença, porque o fixture devolve uma página só, mas… |
| 2026-10-25 04:12:23 | `test-engineer` | 2ª | APROVADO | `2_task` | O caso novo do Início prova o cache que sobreviveria à troca de sessão. Ele não prova uma resposta do primeiro aluno que ainda estivesse no ar e chegasse… |
| 2026-10-25 04:43:23 | `frontend-reviewer` | 1ª | APROVADO | `4_task` | O throttling de rede e de CPU desta tela não foi registrado. Vale rodar o perfil `chromebook` antes do pouso da spec. |
| 2026-10-25 04:43:38 | `infra-guardian` | 1ª | APROVADO | `4_task` | `apps/web/src/areas/aluno/Atividades.tsx:99-101`: o vazio de cada grupo olha só as páginas já carregadas. Se a primeira página não trouxer nenhuma corrigida, a… |
| 2026-10-25 04:43:39 | `conformidade-reviewer` | 1ª | APROVADO | `4_task` | "Encerrada" no grupo "Entregues". O grupo inclui `encerrada`, que é a tarefa que o professor encerrou antes de o aluno enviar… |
| 2026-10-25 04:43:48 | `privacy-guardian` | 1ª | APROVADO | `4_task` | A prova de que a resposta atrasada do aluno anterior não vaza existe só no e2e. Uma prova em teste de componente, com `redeFalsa` e a troca de sessão, pegaria… |
| 2026-10-25 04:43:49 | `revisor-geral` | 1ª | APROVADO | `4_task` | Texto que ainda diz "atividade" numa tela que agora se chama "Tarefas" (glossário, "Tarefas", linha 232: "tarefa" é o nome no título da lista). Aparece no… |
| 2026-10-25 04:44:40 | `test-engineer` | 1ª | REPROVADO | `4_task` | `apps/web/src/areas/aluno/materia.ts:46`, a linha `.replace(/\p{M}/gu, '')`, é uma cláusula nova sem bloco de mutação. O `node tools/processo/mutacoes.ts… |
| 2026-10-25 04:57:33 | `test-engineer` | 2ª | APROVADO | `4_task` | `apps/web/src/areas/aluno/Atividades.test.tsx:181-184`. As asserções de tela do teste do contrato podem rodar ainda no estado de carregando. O `waitFor` só… |
| 2026-10-25 04:58:03 | `revisor-geral` | 2ª | REPROVADO | `4_task` | `tasks/prd-telas-do-aluno-e-primeiro-acesso/4_task.md:207,208,210,212,214,215,216`. O que está errado: sete linhas da tabela "Recomendações sem aplicar" mandam… |
| 2026-10-25 05:09:37 | `revisor-geral` | 3ª | APROVADO | `4_task` | `apps/web/src/areas/aluno/Atividades.test.tsx:184`: o teste exige exatamente duas chamadas com `toBe(2)`. Isso o amarra a quantas vezes a consulta tenta de… |
| 2026-10-25 05:09:50 | `test-engineer` | 3ª | APROVADO | `4_task` | `Atividades.test.tsx:184`: o `toBe(2)` depende de `TENTATIVAS_AUTOMATICAS = 1`. Se essa constante mudar, o teste quebra por um motivo que não é o contrato… |
