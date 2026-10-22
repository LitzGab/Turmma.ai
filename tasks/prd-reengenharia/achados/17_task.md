# Achados das revisões — `tasks/prd-reengenharia/17_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## tenancy-guardian · 1ª rodada · APROVADO · 2026-10-22 19:52:20 · `tasks/prd-reengenharia/17_task.md`

VEREDITO: APROVADO
Tabelas verificadas: nenhuma tabela nova. O diff não traz migration nem schema.
Queries verificadas: nenhum repository mudou. Os 11 controllers de `atividade/`, `artefato/`, `material/`, `tutor/` e `privacidade/` só trocaram `lerEntrada`/`idDoCaminho`/`lerConsultaPaginada` por `ZodValidationPipe`/`IdPipe`, e o resultado é o mesmo. `IdPipe` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/entrada/id.pipe.ts`) devolve o UUID em minúsculas e responde `NAO_ENCONTRADO` quando o formato não serve. `ZodValidationPipe` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/entrada/zod-validation.pipe.ts`) lança só o código, sem `issues`, e não ecoa o valor recebido. Nenhuma rota passou a aceitar `escolaId` no corpo ou na query: os esquemas continuam estritos, e campo a mais dá `ENTRADA_INVALIDA`. Isso está provado com `escolaId` em `borda-de-entrada-ultimos-modulos.int.test.ts`, `artefato.int.test.ts:97`, `material.int.test.ts` e `pedido-titular.int.test.ts`. A `ferramenta` fora da lista e a `questao` fora do formato respondem o 404 do inexistente (`errorCode: NAO_ENCONTRADO`). Em 10 rotas, quando o id e o corpo são inválidos juntos, a resposta passou de 404 a 400. Isso não revela existência, porque nenhum pipe consulta o banco e o 400 sai igual para qualquer id. Nenhum `@SemEscopo` novo.
Teste de isolamento: presente e efetivo. O escopo continua no repository, sem mudança, e os testes que já existiam seguem cobrindo a cláusula de escola:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/material-isolamento.int.test.ts:95` e `:119`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/atividade/atividade.int.test.ts:306`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/pedido-titular.int.test.ts:261` e `:394`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/artefato/artefato.int.test.ts:226`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/tutor/tutor.int.test.ts:850` e `:887`

O teste novo, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts`, prova que o id fora do formato e o id inexistente recebem o mesmo 404, letra por letra, em toda rota com id.
Bloqueantes: nenhum
Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts`, no caso "com o id e o corpo ou a consulta inválidos ao mesmo tempo": hoje ele usa só `FORA_DO_FORMATO` e um id sorteado. Vale acrescentar um id real da escola B, para que o "de outra escola dá o mesmo 400", afirmado na divergência (2), fique provado em teste e não só no comentário.
- Esse mesmo caso fixa que o Nest resolve o corpo antes do id. Isso é detalhe de implementação do framework. Se uma atualização do Nest inverter a ordem, o teste fica vermelho sem nenhum vazamento real. Vale escrever no teste que a garantia exigida é "a resposta não depende da existência do id", e não "a resposta é 400".

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-22 19:52:32 · `tasks/prd-reengenharia/17_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum campo novo. As rotas que já levavam dado pessoal mudaram só no jeito de validar a entrada: `corrigir-nome` (nome do titular), `titulares/busca` (termo), `POST /v1/tutor/mensagens` (texto do aluno), `PUT …/respostas/:questao` (resposta), o pedido do titular e o arquivo dele. Nenhuma migration, nenhuma coluna nova e nenhum DTO de saída novo. Os tipos que entraram em `packages/shared` são todos de entrada: `ParametroFerramenta`, `esquemaQuestaoDoCaminho`, `esquemaPedidoSemCorpoOuAusente` e o tipo `BuscaDeTitulares`.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok.
- As guardas `@Permite` rodam antes dos pipes, então o papel errado continua recebendo o 404 da guarda. O `borda-de-entrada-ultimos-modulos.int.test.ts` testa isso em cada rota.
- O isolamento continua no service e no repository, que esta tarefa não tocou. Os testes de antes continuam valendo: material de B por `GET` e `DELETE`, atividade aplicada de B e pedido do titular de B, todos lidos no contexto de A.
- O `IdPipe` responde ao id fora do formato com o mesmo 404 do id inexistente e devolve o uuid em minúsculas, como o `idDoCaminho` fazia.
- `ferramenta` e `questao` usam `errorCode: NAO_ENCONTRADO`. O teste de `apps/api/src/artefato/artefato.int.test.ts` compara ao pé da letra a resposta de `adaptacao` com a de `x`.
- Mudou a ordem em 10 rotas: com o id e o corpo inválidos ao mesmo tempo, a resposta agora é 400 em vez de 404. Isso não revela que o registro existe, porque com o corpo inválido qualquer id dá o mesmo 400, seja de outra escola, inexistente ou fora do formato.

Logs: limpos.
- `packages/nucleo/src/entrada/zod-validation.pipe.ts` lança só o código do erro, sem as `issues`, e não loga nada.
- Há testes novos com sentinela que provam que o valor recusado não vai ao log nem à resposta: `apps/api/src/tutor/tutor.int.test.ts` para o texto do tutor, longo ou com campo a mais, e `apps/api/test/pedido-titular.int.test.ts` para o nome da correção e o termo da busca, pelo `CapturaDeDadoPessoal`.
- O teste do tutor também confere que a linha `http.erro` foi registrada. Sem isso, a falta da sentinela no log não provaria nada.

Auditoria: presente.
- Nenhuma auditoria saiu nem mudou de lugar: a prévia do titular, o arquivo do pedido e a correção de nome continuam no service.
- Há um teste que prova que uma busca de titulares inválida não grava `titular.buscado`.

Envio externo: nenhum novo.
- Um corpo inválido em `ferramentas/:ferramenta/gerar` ou em `tutor/mensagens` não cria `execucao_agente` e não gasta a troca do dia. Os testes contam isso no banco e no `uso.hoje`.

Seed/fixture: sintético. Os testes usam `randomUUID`, sentinelas e "Editora sintética".

Bloqueantes: nenhum.

Também conferi:
- O upload de material fica só na memória (`apps/api/src/material/recebimento.ts:27`) e nunca vai para disco nem para o storage. Com campo inválido, o service não é chamado, e o teste prova que o extrator não roda e que nenhuma linha entra em `material`.
- Nenhum `@Body()`, `@Query()` ou `@Param('x')` sem pipe sobrou em `apps/api/src/**/*.controller.ts`. `lerEntrada`, `idDoCaminho` e `lerConsultaPaginada` não aparecem em mais nenhum lugar, e não há `eslint-disable` de `no-restricted-syntax`.
- `npx eslint 'apps/api/src/**/*.controller.ts'` saiu limpo.

Recomendações:
- `apps/api/src/atividade/minha-atividade.controller.ts`: o `listar` tipa a consulta como `ConsultaPaginada` enquanto o esquema é `esquemaConsultaMinhasAtividades`. Um tipo próprio, inferido desse esquema, evitaria que os dois se separem sem ninguém perceber. É questão de nome e organização, sem efeito sobre privacidade.

Arquivos centrais da auditoria:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/entrada/zod-validation.pipe.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/packages/nucleo/src/entrada/id.pipe.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/privacidade/privacidade.controller.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/tutor/tutor.controller.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/material/material.controller.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 19:53:05 · `tasks/prd-reengenharia/17_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** esta tarefa só muda a validação da entrada. Por isso os cenários que importam são estes:
- **Caminho feliz:** o corpo e a consulta válidos passam pelo pipe e chegam ao service.
- **Borda:** questão `0`, `-1`, `abc`, `0x3`, `+3`, `001`, ou acima do total da prova; avaliação já fechada; `enviar` sem corpo nenhum; resposta já salva que recebe um corpo inválido; id e corpo inválidos ao mesmo tempo.
- **Permissão:** a guarda responde antes do pipe (401 sem sessão, 404 para outro papel).
- **Isolamento:** atividade, material e pedido do titular de B, pedidos no contexto de A, respondem 404.
- **LGPD:** a sentinela do tutor, da correção do nome e da busca do titular não aparece no log nem na resposta.
- **Custo:** o corpo inválido não gasta a troca do Tutor nem abre execução da ferramenta.
- **Trava:** o lint vale em todo controller, e as três funções antigas não existem mais.
- **Concorrência:** não se aplica. A tarefa não cria operação que possa rodar duas vezes ao mesmo tempo.

**Cobertos:** todas as 20 linhas da tabela têm teste, confirmado arquivo por arquivo.
- `apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts` (novo) cobre as rotas dos 11 controllers. Cada rota é um caso próprio e testa:
  - id fora do formato contra id sorteado, com a mesma resposta;
  - corpo e consulta inválidos dando `ENTRADA_INVALIDA`;
  - nada gravado, com uma contagem por escola em 12 tabelas;
  - id e corpo inválidos ao mesmo tempo, que é a divergência (2);
  - pedido sem corpo;
  - a guarda respondendo antes do pipe.
- `atividade.int.test.ts`:
  - as questões `0x3`, `+3` e `001`;
  - "o corpo fora do contrato não apaga nem troca a resposta que já estava salva";
  - "enviar sem corpo nenhum vale como corpo vazio…".
  - Os testes que já existiam cobrem a atividade de B (`:306`), a encerrada (`:421`) e a questão acima do total (6 e 21).
- `tutor.int.test.ts › a mensagem acima do tamanho, ou com um campo a mais…`: confere `uso.hoje` parado, nenhuma mensagem gravada, a sentinela fora do log e da resposta, e exige que o log tenha `http.erro`, para a busca da sentinela provar alguma coisa.
- `material.int.test.ts › os campos ao lado do arquivo passam pelo ZodValidationPipe`: o extrator não é chamado e nenhuma linha vai para `material`. O `material-isolamento` (`:95`, `:119`) cobre o GET e o DELETE de B.
- `artefato.int.test.ts`: a ferramenta de fora e a inexistente respondem igual, ao pé da letra; o corpo inválido com ferramenta inexistente dá 400; nenhuma `execucao_agente` nova.
- `pedido-titular.int.test.ts`: o teste da sentinela com `CapturaDeDadoPessoal`, o nome que não muda e nenhuma auditoria `titular.buscado`. O pedido de B fica com o teste que já existia (`:1023`).
- O lint e a trava das funções:
  - `guardas.test.ts › o controller de um módulo que ainda não existe já nasce barrado`;
  - `arquitetura.test.ts › nenhum controller chama safeParse…`;
  - `arquitetura.test.ts › …não são declaradas…`;
  - a varredura com controllers que devem reprovar e arquivos que devem passar.
- Todos os pipes novos dos 11 controllers têm o seu bloco em "Mutações". Conferi grep contra blocos e não sobra nenhum. As mutações do esquema `esquemaQuestaoDoCaminho` (regex e limites) e do `.default({})` caem nos testes do shared.
- Rodei os três arquivos de unidade (`arquitetura`, `atividade.test`, `guardas`): 199 testes, todos verdes.
- Não há `.skip`, `.only`, `any` nem mock da regra. Não há chamada a provedor de IA.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Consumo de IA.** A linha da tabela diz "sem execução nem consumo", mas `apps/api/src/artefato/artefato.int.test.ts:221` só conta `execucao_agente`. Vale contar também `consumo_ia` da escola antes e depois.
2. **Mensagem vazia e o freio.** O caso da mensagem vazia (`'   '`, em `tutor.int.test.ts:236`) não confere o freio do dia (`uso.hoje`). Basta pôr `{ texto: '' }` no laço do teste novo (`:243`), que já faz essa conferência.
3. **A ferramenta de fora e a inexistente.** Em `artefato.int.test.ts:218`, `adaptacao` e `x` caem as duas no mesmo enum do pipe, então a igualdade entre elas é quase automática. O que de fato a protege é o laço de `:210`, que exige o 404. Fica como nota, porque a regra 10.6 está provada.
4. **A linha do lint limpo.** A última linha da tabela ("`npm run lint` limpo, sem `eslint-disable` de `no-restricted-syntax`") não cita teste pelo nome. Quem prova são o `npm run lint` do portão e os testes de `guardas.test.ts:117` e `:132`, que mostram que o `eslint-disable` não fura a segunda passada. Vale citar esses testes na tabela.
5. **Testes que já existiam.** A divergência (7) descreve em texto os testes que já existiam, mas a tabela não os cita pelo nome (atividade `:306` e `:421`, material-isolamento `:95` e `:119`, pedido-titular `:1023`). Pôr o nome deixaria a auditoria da próxima rodada direta.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/17_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/artefato/artefato.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/tutor/tutor.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/atividade/atividade.int.test.ts`

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 19:53:13 · `tasks/prd-reengenharia/17_task.md`

VEREDITO: APROVADO

Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)

Bloqueantes: nenhum

**Escopo.** Os cinco módulos migraram. Os 11 controllers usam `ZodValidationPipe` e `IdPipe` no parâmetro, com os tipos de `@educa/shared`. O `files` do ESLint passou a `apps/api/src/**/*.controller.ts`. `lerEntrada`, `idDoCaminho` e `lerConsultaPaginada` saíram de `apps/api/src/estrutura/entrada.ts`, e só `paginar` e `paginarPor` ficaram. Não sobrou `eslint-disable` de `no-restricted-syntax` em `apps/api/src`. A validação de job (18.0) e o OpenAPI (X6) não foram tocados.

**Tech Spec.** As divergências (1), (2), (3), (4) e (6) estão registradas em `tasks/prd-reengenharia/onda-1a.md`, no parágrafo "A 17.0 repete a conduta". Seguem a mesma conduta já aceita na 14.0, na 15.0 e na 16.0.

O 400 do corpo antes do 404 do id não revela existência: qualquer id, inexistente, fora do formato ou de outra escola, recebe o mesmo 400. O teste das linhas 207 a 217 de `apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts` prova isso com o id fora do formato e com o sorteado.

O `IdPipe` mantém o `toLowerCase()` do `idDoCaminho` antigo. As rotas de privacidade sem corpo continuam recusando o corpo ausente, como faziam antes.

Recomendações:
1. `tasks/prd-reengenharia/17_task.md:91`, divergência (2): o texto atribui `aprovar-lote` e `desempenho` ao artefato ("`aprovar-lote`, `desempenho`, `renomear` e `adaptar` do artefato"). Os dois são da atividade, como o `onda-1a.md` já diz corretamente. Vale alinhar o texto.
2. `tasks/prd-reengenharia/17_task.md:91`: a coluna "Onde está na spec" não cita a (5) nem a (7) em lugar nenhum fora da própria tarefa. A (5) não chega a ser divergência, porque exportar o tipo ao lado do esquema é a regra 00.6, e poderia ser retirada da lista. A (7) é uma decisão de cobertura de testes, que cabe ao `test-engineer`. Ela também explica por que `material-isolamento.int.test.ts` e `ops-privacidade.int.test.ts`, listados em "Arquivos previstos", não mudaram.
3. Em `apps/api/src/atividade/minha-atividade.controller.ts:51-55`, a `questao` fora do formato com corpo inválido também passou do 404 ao 400, pela mesma ordem de resolução do Nest. A divergência (2) só fala de "id e corpo". Vale dizer isso numa linha e, se o `test-engineer` quiser, cobrir com um caso.
4. Agora há dois jeitos de montar o corpo vazio que pode faltar. Um é a constante local `const esquemaSemCorpo = X.default({})`, em `professores.controller.ts:15`, `operacao/sessao.controller.ts:9`, `operacao/painel.controller.ts:24` e `sala/acesso-da-turma.controller.ts:8`. O outro é `esquemaPedidoSemCorpoOuAusente`, novo em `packages/shared`. O guia (`docs/guia-do-desenvolvedor.md` §5.1) só aponta o segundo. Fica para uma próxima tarefa que já mexa nesses controllers unificar num só, ou registrar no `TODO.md`.

Arquivos lidos por completo:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/tasks/prd-reengenharia/17_task.md
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/atividade/minha-atividade.controller.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/artefato/ferramentas.controller.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/material/material.controller.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/tutor/tutor.controller.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/privacidade/privacidade.controller.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts

Os demais arquivos alterados (outros controllers, testes, `packages/shared`, `eslint.config.mjs` e os dois `docs/`) foram conferidos pelo diff.

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-22 20:14:36 · `tasks/prd-reengenharia/17_task.md`

VEREDITO: APROVADO

Esta foi a 2ª rodada. Auditei só o diff r1→r2 (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/.processo/ordens/diff-17_task-r1-r2.txt`). A 1ª rodada não exigiu nenhuma correção. A recomendação que deixei nela (um tipo próprio para a consulta de `listar`) foi aplicada.

Campos pessoais tocados: nenhum. O diff só traz um tipo de consulta paginada (`ConsultaMinhasAtividades`), ajustes de teste e texto de documentação.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: ok.
- No teste de "id e corpo inválidos ao mesmo tempo" (`apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts:205-221`), a asserção agora é que as duas respostas são iguais (id fora do formato e id sorteado), além de serem o mesmo 400. É a garantia da regra 10, item 6.
- A leitura do id de B a partir da escola A continua coberta pelos testes de isolamento que a tabela da tarefa cita pelo nome: `material-isolamento.int.test.ts`, `atividade.int.test.ts`, `atividade-isolamento.int.test.ts` e `pedido-titular.int.test.ts`.

Logs: limpos.
- `apps/api/src/tutor/tutor.int.test.ts:247` passou a cobrir também o texto vazio.
- A varredura confere que a sentinela não aparece no log nem na resposta (linhas 250 e 256).
- Antes disso, o teste confere que houve linha `http.erro` no log (linha 255). Sem essa conferência, a ausência da sentinela não provaria nada.
- O esquema `esquemaPedidoMensagemAoTutor` (`.trim().min(1)`) recusa o vazio de fato.
- A mutação nova, que tira o `ZodValidationPipe` de `tutor.controller.ts`, é pega por esse teste.

Auditoria: não se aplica. O diff não traz leitura nominal por coordenação ou rede, nem exportação, nem alteração de nota ou permissão.

Envio externo: nenhum. O corpo inválido em `/v1/ferramentas/*/gerar` agora tem prova de que não cria `execucao_agente` e não consome orçamento de IA (`consumo_ia`) (`apps/api/src/artefato/artefato.int.test.ts:206-207, 222-223`).

Seed/fixture: sintético. Os testes usam `randomUUID()` e dados criados pela bancada.

Bloqueantes: nenhum.

Recomendações:
- `tasks/prd-reengenharia/17_task.md`, divergência (2): o texto ainda diz "qualquer id, fora do formato, inexistente ou de outra escola, dá o mesmo 400". O teste da borda já não usa o id de outra escola, e a justificativa ficou só no comentário do teste (o pipe não consulta o banco). Vale levar essa frase para a divergência, para que ela não prometa mais do que o teste prova.

Pergunta de fechamento: o diff não muda o que o sistema guarda sobre o aluno nem para onde envia. A resposta continua a da 1ª rodada.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-22 20:14:51 · `tasks/prd-reengenharia/17_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok

Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)

Bloqueantes: nenhum

Recomendações:
- Mexer no texto de `tasks/prd-reengenharia/17_task.md` e de `onda-1a.md` não reabre a revisão. Mas a coluna "Onde está na spec" da divergência ficou longa, uma célula de tabela difícil de ler. Na próxima tarefa, vale quebrar cada item numerado da divergência em uma linha própria da tabela.

Conferi o diff da 2ª rodada inteiro, com o que ele afeta:
- **Tipo `ConsultaMinhasAtividades`:** ele está em `packages/shared/src/atividade/prova.ts:112` e é exportado em `packages/shared/src/index.ts`. O controller `apps/api/src/atividade/minha-atividade.controller.ts` usa ele e não guarda mais nenhuma referência a `ConsultaPaginada`. A mutação correspondente acompanhou a assinatura nova.
- **Tutor com mensagem vazia:** o caso entrou em `apps/api/src/tutor/tutor.int.test.ts`, e o esquema recusa de fato a mensagem vazia (`.trim().min(1)` em `packages/shared/src/tutor/tutor.ts:52`). A mutação nova do tutor bate ao pé da letra com `apps/api/src/tutor/tutor.controller.ts:35`.
- **Corpo inválido no artefato:** em `apps/api/src/artefato/artefato.int.test.ts` o teste passou a provar também que nada do orçamento de IA é consumido (`consumo_ia`), e não só que nenhuma execução nasce. Agora ele cobre o "sem execução nem consumo" da linha da tabela.
- **Teste da borda** (`apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts`): o caso de id e corpo inválidos ao mesmo tempo agora exige primeiro que a resposta seja a mesma para o id fora do formato e para o id inexistente (regra 10, item 6). Só depois ele confere o 400. É uma asserção mais forte que a anterior.
- **Divergência (2):** o texto agora inclui a `questao` fora do formato, igual ao de `onda-1a.md`.
- **Divergência (5):** passou a incluir `ConsultaMinhasAtividades`. As justificativas de (5) e (7) na coluna da spec estão coerentes.
- **Recusas registradas:** a do `tenancy-guardian` (id real da escola B) e a do `test-engineer` têm motivo escrito.
- **Pendência do `revisor-geral`:** o `esquemaSemCorpo` local continua em `apps/api/src/professores/professores.controller.ts:15`, `apps/api/src/operacao/sessao.controller.ts:9`, `apps/api/src/operacao/painel.controller.ts:24` e `apps/api/src/sala/acesso-da-turma.controller.ts:8`. Foi para o `TODO.md` com destino. Mexer nesses quatro arquivos de outros módulos ficava fora do escopo da 17.0, então o destino está certo.

Das quatro recomendações da minha 1ª rodada, as quatro foram aplicadas como relatado.

## test-engineer · 2ª rodada · APROVADO · 2026-10-22 20:14:57 · `tasks/prd-reengenharia/17_task.md`

VEREDITO: APROVADO

Cenários exigidos (os mesmos da 1ª rodada; aqui confiro só o diff r1→r2 e as recomendações aplicadas):
- Tutor: mensagem vazia, longa ou com campo a mais dá `ENTRADA_INVALIDA`, sem gravar `mensagem_tutor`, sem gastar a troca do dia e sem eco da sentinela no log nem na resposta.
- Artefato: corpo inválido não cria execução nem consome orçamento de IA.
- Rotas com id e corpo (ou consulta) inválidos ao mesmo tempo: a resposta não depende de o id existir (regra 10, item 6).
- Cada linha da tabela de testes tem um teste citado pelo nome.
- Cada cláusula nova tem o seu bloco de mutação.

Cobertos:
- **Recomendação 1, `consumo_ia`.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/artefato/artefato.int.test.ts:206-233`, `gastos()` conta `execucao_agente` e `consumo_ia` da escola A, e a asserção final exige `toEqual(antes)`. O "sem consumo" da tabela agora tem asserção própria.
- **Recomendação 2, `{ texto: '' }`.** Entrou no laço de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/src/tutor/tutor.int.test.ts:243-257`. O título do teste agora cobre "vazia, longa, campo a mais", que é a linha da tabela inteira. A varredura do log continua com a guarda de que houve algum `http.erro`, então não passa por vazio.
- **Bloco de mutação novo para o `enviar` do tutor.** Ele tira o pipe de `@Body` e cita o teste acima. Sem o pipe, os três corpos chegam ao service e o 400 esperado cai, então o teste fica vermelho pelo motivo certo. Antes, essa cláusula só era alcançada pela mutação que devolvia o `safeParse`, e agora tem bloco próprio.
- **Mutação do `listar` de `minha-atividade.controller.ts`.** O texto foi ajustado ao tipo `ConsultaMinhasAtividades`. O tipo é só um `z.infer` do mesmo esquema, sem mudança de comportamento, e o bloco continua tirando o `ZodValidationPipe`.
- **Caso "id e corpo inválidos ao mesmo tempo".** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l1/apps/api/test/borda-de-entrada-ultimos-modulos.int.test.ts:207-221`, a resposta do id fora do formato agora é comparada com a do id sorteado antes de exigir o 400. A asserção ficou estritamente mais forte e prova a regra 10, item 6 sem depender da ordem dos parâmetros no Nest.
- **Recomendações 4 e 5.** As linhas da tabela que já tinham teste (prova de B, avaliação fechada, material de B em GET e DELETE, pedido do titular de B) e a linha do `eslint-disable` agora citam os testes pelo nome, com arquivo e título.
- **Recomendação 3.** Recusada com motivo, o que vale, porque era só nota. As duas recusas que vieram de outros revisores também ficaram registradas com motivo.
- **Divergência (2).** Passou a citar a `questao` do caminho entre as rotas que vão do 404 ao 400, coerente com o `onda-1a.md`.

Não consegui rodar os três arquivos de integração. O vitest parou antes de executar qualquer caso (`Failed to resolve entry for package "@educa/nucleo"`), porque os pacotes não estão compilados nesta árvore, e não compilei para não gerar arquivo. Fico com a prova do portão da tarefa, que rodou os testes e as mutações.

Bloqueantes: nenhum.

Recomendações:
- O `{ texto: '' }` repete, no teste novo, o que `{ texto: '   ' }` já prova no caso "recusa o corpo fora do contrato". Está correto, porque a tabela pede o vazio junto de "freio parado" e "nada gravado". Só registro que a sentinela não está nesse corpo, então o `not.toContain(sentinela)` dele passa por construção.
- A linha da tabela "Artefato: corpo inválido → sem execução nem consumo" ainda não cita o teste pelo nome, ao contrário das que ganharam citação nesta rodada. Vale acrescentar `artefato.int.test.ts › o corpo é o contrato estrito, e ferramenta fora da lista não existe`.
