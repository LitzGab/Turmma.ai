# Achados das revisões — `tasks/prd-harness/3_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-23 16:42:28 · `tasks/prd-harness/3_task.md`

VEREDITO: APROVADO

Esta tarefa não toca dados de pessoas. Ela mexe só no processo de CI: o gatilho de pull request, o `concurrency` e a forma como `esteira.ts` lê uma execução cancelada. Nenhum dado de aluno, professor ou responsável é coletado, guardado, registrado em log ou enviado a algum lugar.

Campos pessoais tocados: nenhum. O que muda está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.github/workflows/ci.yml`, `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/esteira.ts` e nos testes. São só metadados de execução do GitHub Actions: id, sha, estado, data, branch e evento.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica. A tarefa não cria rota, repository nem endpoint.

Logs: limpos. O relatório da esteira mostra commit, execução e nome de job. Em `esteira.ts:127`, `CAMPOS_DA_EXECUCAO` pede ao `gh` só `databaseId,headSha,status,conclusion,createdAt,event,headBranch`. Não pede `actor` nem `displayTitle`, então nem o login de quem fez o push nem o texto livre do commit chegam ao script.

Auditoria: não se aplica. Não há leitura de dado de aluno, exportação, alteração de nota ou permissão, nem aprovação de saída de IA.

Envio externo: nenhum dado pessoal. A mudança relevante é que a esteira passa a rodar também em `pull_request` para a `develop` (`ci.yml:17-18`), e isso inclui PRs vindos de fork, já que o repositório é público.
- Isso não abre vazamento. Continua com `permissions: contents: read`, nenhum segredo e `persist-credentials: false`, e o evento é `pull_request`, não `pull_request_target`.
- O grupo do `concurrency` (`ci.yml:29-31`) usa só valores que o próprio GitHub preenche. Não usa `head_ref`, título nem corpo do PR. `tools/ci/esteira.test.ts` testa isso com uma lista fechada de nomes, e o teste recusa `secrets.*`.

Seed/fixture: não há dado de pessoa. Os fixtures em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/__fixtures__/esteira/` são saídas reais do `gh run list` e do `gh run view --json jobs` deste repositório público. Contêm ids de execução e de job, shas, a branch `spec/reengenharia--l2`, nomes de job e URLs do Actions. Não têm actor, e-mail, login nem conteúdo de teste.

Pergunta de fechamento: a tarefa não muda o que o sistema guarda sobre um aluno nem para onde isso vai. A resposta continua igual à de antes.

Bloqueantes: nenhum.

Recomendações:
1. Agora o trace do Playwright (`upload-artifact`, `ci.yml`, último passo) também é publicado para PRs, com 7 dias de retenção, num repositório público. Hoje isso é aceitável porque todo dado do e2e é sintético (regra 20, item 17). Vale deixar escrito no comentário do passo que ele depende dessa garantia: um seed com dado real passaria a vazar também por PR de fork.
2. Em `esteira.ts:127`, vale um comentário dizendo que `actor` e `displayTitle` ficam de fora de propósito. Assim, quem regravar o fixture ou ampliar os campos não traz por descuido o login de quem fez o push ou o texto livre do commit. Hoje só o teste "o fixture é o que diz ser" segura isso, e ele trava os campos pela igualdade, não pelo motivo.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 16:42:52 · `tasks/prd-harness/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só mexe na esteira de CI (`.github/workflows/ci.yml`) e na ferramenta de processo (`tools/processo/esteira.ts`). Login, tutor, sala, prova, fila, IA, migration e deploy da aplicação ficam de fora.
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: protegida. Push novo em `spec/**`, `correcao/**` e no PR cancela o anterior do mesmo grupo. Em `develop`, `release`, `main` e na execução manual o grupo é o `run_id`, que nunca cancela nem enfileira. Para valer como superada, a sucessora precisa ser um push na mesma branch e ter sido criada estritamente depois. O empate conta como vermelho. Os casos de (a) a (g) têm teste e mutação declarada.
Índice e paginação: não se aplica
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica. A tarefa não cria código no caminho quente nem alerta.
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/esteira.ts:57`: `foiSuperada` não separa a cancelada pelo `concurrency` da cancelada por prazo que só teve um push depois. Basta existir um push mais novo na branch remota para a cancelada sair da lista, mesmo que o commit dele não esteja na janela local de 30 commits. O próprio teste em `esteira.test.ts:165` mostra o efeito: o resultado é `sem-execucao`, e na pergunta da tarefa isso segue com saída 0. Se a janela tiver ainda um verde mais antigo, a tarefa sai verde mesmo com o HEAD cancelado por prazo. No fluxo atual, em que cada linha tem a sua branch e o checkout está em dia, isso não acontece. Se quiserem fechar a brecha, a sucessora deve contar só quando o commit dela estiver em `commits`.
- O repositório é público e agora o `pull_request` para a `develop` roda as suítes inteiras, com sete fragmentos de e2e de até 45 min cada. Uma branch de spec com PR aberto roda a esteira duas vezes por push, uma pelo `push` e outra pelo `pull_request`. Vale registrar esse custo no `/retro`, e também conferir se a aprovação de workflow para PR de quem contribui de fora continua ligada no repositório.
- O fixture `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/__fixtures__/esteira/run-view-jobs-cancelada-por-prazo.json` guarda os passos e as URLs inteiros, quando o teste só lê `name`, `conclusion`, `startedAt` e `completedAt`. Não tem dado pessoal. Dá para enxugar e deixar o diff menor.

Os dois arquivos de teste da tarefa passaram (38 casos), com o comando de "Como testar".

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 16:43:29 · `tasks/prd-harness/3_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (`portão local válido para o código atual (typecheck, lint, segredo, dependencias, unidade, alvo)`)
Bloqueantes: nenhum

O que conferi:
- **Escopo.** A tarefa não invade a 4.0 (censo e artefato) nem a 12.0 (terceira camada no `verificar`), e nenhum outro módulo importa `esteira.ts`.
- **Divergências.** As cinco registradas no `3_task.md` estão na `techspec.md` §5(f) e no `cenarios.md`, nas linhas RF1 e RF2 da seção A: o estado `cancelada` sem `superada` guardado, o `gh run list` por evento, o `cancel-in-progress` do PR, o empate que não supera e o avaliador com lista fechada de nomes. O PRD (RF1, RF2, RF19) diz o mesmo.
- **Fixture.** É saída real do `gh`, com o job `e2e 4/7` cancelado aos 45 minutos, que é o `timeout-minutes` da fatia. Não traz dado de pessoa.

Recomendações:
1. `tasks/prd-harness/tasks.md:26` ainda diz "Veredito com superada e `--event push`". A divergência está na `techspec.md`, então não bloqueia, mas a lista ficou desatualizada. O texto certo é: `push` e `workflow_dispatch`, uma chamada por evento.
2. Em `.github/workflows/ci.yml`, o passo de upload do traço do e2e roda com `if: failure() || cancelled()`. Com o `cancel-in-progress`, toda execução superada em `spec/**` também sobe artefato (`test-results/`). Isso gasta tempo de runner e armazenamento com execução que não vale. Vale olhar junto com a 4.0, que já mexe nos artefatos.
3. Em `tools/processo/esteira.ts:57-67`, `foiSuperada` não separa o cancelamento pelo `concurrency` do cancelamento por prazo quando há push mais novo. A própria fixture mostra isso: a 39821519092 caiu por prazo e entra no teste (c) como superada. A Tech Spec aceita esse comportamento e o comentário do teste explica. Fica registrado como limite conhecido, não como defeito.
4. O avaliador de expressões em `tools/ci/esteira.test.ts`, com cerca de 90 linhas, só reconhece string sem espaço dentro de aspas, por causa da comparação com o texto sem espaços. Se uma expressão futura precisar disso, ele reprova sem dizer o motivo. Basta uma linha de comentário avisando.

## test-engineer · 1ª rodada · APROVADO · 2026-10-23 16:44:08 · `tasks/prd-harness/3_task.md`

VEREDITO: APROVADO

**Cenários exigidos:**
- **RF1, cancelamento pelo `concurrency`:**
  - Em `spec/**` e `correcao/**`, o grupo é a ref e cancela. Dois pushes seguidos na mesma branch caem no mesmo grupo, e branches diferentes não se cancelam.
  - Em `develop`, `release`, `main` e na execução manual (inclusive numa branch de spec), o grupo é o `run_id` e não cancela.
  - Os casos de borda das refs: `spec-x`, `feature/spec/x` e `correcoes/x` não são branch de spec.
  - No PR, o grupo é `pr-<n>` e cancela.
- **Permissão e RF19:** sem `pull_request_target` e sem `secrets.`. As expressões só leem do contexto o que o GitHub preenche sozinho: `head_ref`, título do PR e `secrets` são recusados.
- **RF2, veredito:**
  - (a) Cancelada por prazo, sem sucessora: vermelha, citando o job, com saída real do `gh`.
  - (b) Vermelha mais nova que uma verde.
  - (c) Superada por push concluído.
  - (d) Superada com a sucessora ainda rodando.
  - (e) Os jobs da superada não aparecem.
  - (f) Commit só de documento.
  - (g) Não supera: outra branch, `pull_request`, execução manual, mesmo instante ou execução mais antiga.
  - A superada não esconde o verde que o mesmo commit já tinha.
- **Concorrência:** dois pushes na mesma branch, cancelados no grupo. Quem cancela é o GitHub; o que o código nosso faz é ler a cancelada, e isso está coberto.
- **Isolamento:** não se aplica, a tarefa não toca dado de escola.

**Cobertos:**
- Todas as linhas da tabela "Testes que provam a regra" têm teste com o nome citado.
- A linha "RF1/RF19", desmembrada pelos ponto e vírgula, fica coberta assim:
  - `pull_request_target` e `branches: [develop]`: o primeiro teste de `tools/ci/esteira.test.ts`.
  - `secrets.`: os testes "não usa segredo" e "só lê do contexto".
- Os casos (c), (d) e (e) rodam em `situacaoDaTarefa` e em `situacaoDoFechamento`.
- Toda cláusula nova do diff tem bloco de mutação:
  - No `ci.yml`: o `pull_request`, a sua `branches` e a ausência de `pull_request_target`; no `group`, a cláusula do PR, a de `spec/`, a de `correcao/`, a do `event_name == 'push'` e o `run_id`; no `cancel-in-progress`, a do PR, a de `spec/`, a de `correcao/` e a do push.
  - No `esteira.ts`: em `foiSuperada`, as quatro condições, incluindo `>` contra `>=` e contra `<`; em `execucoesQueValem`, o filtro e o map; o `cancelled` de `estadoDaExecucao`; `CAMPOS_DA_EXECUCAO`; `EVENTOS_DO_VEREDITO`, para mais e para menos; `--event` e `--branch`; `branch` e `evento` em `execucoesDoGh`; `jobsQueCairam`; a troca para `execucoesQueValem` nas duas situações.
- Conferi três mutações à mão contra o teste citado e as três fariam o teste falhar:
  - O map `cancelada → vermelha` ligado ao teste (a).
  - `execucoes = todas` no fechamento: a cancelada não casa com verde, rodando nem vermelha, e a situação vira `sem-execucao`.
  - Tirar `estado === 'cancelada'` de `foiSuperada`: o verde de c1 seria descartado.
- Os dois arquivos rodaram verdes: 38 testes passaram.
- Não há `.skip`, nem chamada de rede. Os fixtures são saída real do `gh` e não têm dado pessoal, só nome de job e URL de execução. A divergência do teste "cancelada é vermelha" está registrada.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **Título do teste (f) promete mais do que prova** (`tools/processo/esteira.test.ts:190`). O título diz que "a cancelada do documento superado não tira o verde do código". Mas `situacaoDoFechamento` procura o verde antes do resto, então a primeira asserção passaria mesmo sem a regra da superada. Duas saídas:
   - acrescentar `situacaoDaTarefa(ordem, execucoes)` esperando `rodando` (sem a regra, daria `vermelha` com "rodando depois");
   - ou deixar no título só o que o teste prova: o commit só de documento vale pelo de código.
2. **Grupo de concorrência sem o nome do workflow** (`.github/workflows/ci.yml:24`). O grupo do GitHub vale para o repositório inteiro, não por workflow. Hoje o `ci.yml` é o único workflow, então não há problema. Se entrar um segundo workflow com o grupo `github.ref`, os dois passam a se cancelar. Fica como recomendação para o `/retro`: prefixar o grupo com `github.workflow` (o que exige pôr esse nome na lista fechada do teste), ou anotar o risco na Tech Spec.
3. **Prazo escondido por um push mais novo** (`tools/processo/esteira.ts:57`). Uma cancelada por `timeout-minutes` com um push mais novo na mesma branch vira superada, e o prazo some do relatório. É o que a Tech Spec decide, e o push mais novo cobre o código. Mesmo assim, um job que estoura o prazo toda vez só aparece quando é o último. Vale registrar para o `/validar`, sem mudar o código agora.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/3_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.github/workflows/ci.yml`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/esteira.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/esteira.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/esteira.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/__fixtures__/esteira/`

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-23 17:00:02 · `tasks/prd-harness/3_task.md`

VEREDITO: APROVADO

Esta é a 2ª rodada. Auditei só o diff entre 9bec807 e 505288f e conferi as duas recomendações que deixei na 1ª.

Campos pessoais tocados: nenhum. As mudanças são comentários no `ci.yml`, em `esteira.ts` e em `tools/ci/esteira.test.ts`, mais uma asserção num teste de processo e um bloco de mutação no documento da tarefa.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica. A tarefa não cria nem muda nenhuma rota.

Logs: limpos.

Auditoria: não se aplica. Nenhuma ação desta tarefa exige auditoria.

Envio externo: nenhum novo. O artefato de traço do e2e já subia ao GitHub. Agora o comentário diz que ele também sobe em execução de pull request, que o repositório é público e que isso só é aceitável porque todo dado do e2e é sintético.

Seed/fixture: sintético. A pasta `tools/processo/__fixtures__/` não mudou desde a rodada aprovada.

As duas recomendações da 1ª rodada foram feitas:
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.github/workflows/ci.yml:119-120`: o passo do traço agora explica que ele depende de todo dado do e2e ser sintético (regra 20, item 17), e que um seed com dado real vazaria também por PR de fork.
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/esteira.ts:180-184`: o comentário de `CAMPOS_DA_EXECUCAO` explica por que `actor` (o login de quem fez o push) e `displayTitle` (o texto livre do commit) ficam de fora de propósito, e manda quem ampliar a lista ou regravar o fixture manter os dois fora.

Bloqueantes: nenhum.

Recomendações: nenhuma nova.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-23 17:00:05 · `tasks/prd-harness/3_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A mudança é só no processo e na esteira: `tools/processo/esteira.ts`, `.github/workflows/ci.yml` e testes.
Rate limit: ok. A tarefa não toca rate limit.
Fila e prioridade: ok. A tarefa não toca fila.
Concorrência: protegida. A asserção nova em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/esteira.test.ts:199` prova que a execução superada sai de `situacaoDaTarefa`. A mutação nova em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/3_task.md:329` remove o `.filter(!foiSuperada)` de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/esteira.ts:76`. Sem o filtro, a cancelada do `doc1` vira vermelha, e a asserção espera `rodando` em `doc2`, então o teste fica vermelho. O texto da mutação bate com o código, porque `mutacoes.ts` ignora a indentação ao comparar.
Índice e paginação: ok. A tarefa não tem query.
Degradação de IA: não se aplica.
Migration: não se aplica.
Métrica e alerta: ok. Não há código novo no caminho quente.
Bloqueantes: nenhum.
Recomendações: as quatro recomendações da 1ª rodada foram aplicadas.
- O comentário sobre o traço subir em PR de repositório público está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/.github/workflows/ci.yml:119-120`.
- O comentário sobre `actor` e `displayTitle` ficarem fora de `CAMPOS_DA_EXECUCAO` está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/esteira.ts:180-184`.
- O limite da conferência sem espaços no avaliador de expressões está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/ci/esteira.test.ts:125-126`.
- A asserção nova no RF2 (f) e o bloco de mutação dela são os da linha "Concorrência" acima.

As recomendações que ficaram sem aplicar estão registradas com destino na tabela de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/3_task.md`. Uma delas é minha: conferir se a aprovação de workflow para quem contribui de fora continua ligada no repositório público. Essa conferência é do Joaquim.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 17:00:25 · `tasks/prd-harness/3_task.md`

VEREDITO: APROVADO

Cenários exigidos: na 2ª rodada, que a asserção nova do RF2 (f) (`situacaoDaTarefa` dá `rodando` no `doc2` quando a cancelada do `doc1` foi superada) falhe sem a regra, e que o bloco de mutação novo seja válido. O resto do diff, de `9bec807` para `505288f`, é só comentário: um no `ci.yml` sobre o traço que também sobe no PR, um sobre o limite da gramática em `tools/ci/esteira.test.ts` e um sobre `actor` e `displayTitle` fora de `CAMPOS_DA_EXECUCAO`. Nenhum muda comportamento.

Cobertos:
- **A asserção falha sem a regra, e pelo motivo certo.** A mutação tira o `.filter(!foiSuperada)` de `execucoesQueValem` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/esteira.ts:76`).
  - Sem o filtro, a cancelada do `doc1` vira vermelha. Em `situacaoDaTarefa`, o `doc2` (rodando) é guardado e o `doc1` devolve `vermelha` com `rodandoDepois`. A asserção da linha 199 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tools/processo/esteira.test.ts` espera `rodando` e fica vermelha.
  - A asserção anterior, da linha 197 (`situacaoDoFechamento`), continua verde com a mutação, porque o verde do `codigo` é achado primeiro. Assim, o vermelho cai exatamente na cláusula nova.
- **O bloco de mutação é válido.** Fica nas linhas 329 a 335 de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l1/tasks/prd-harness/3_task.md`.
  - O `mutacoes.ts` apara os espaços do começo e do fim de cada linha (linhas 20 e 83 dele), então o contexto sem o recuo original casa.
  - O trecho `return execucoes` / `.filter` / `.map` aparece uma vez só no arquivo.
  - O nome do caso, "o commit só de documento vale pelo de código", cai num único teste, o RF2 (f).
- `npx vitest run tools/processo/esteira.test.ts`: 23 de 23 passam, sem `.skip`.

Bloqueantes: nenhum.

Recomendações:
- O bloco novo aplica a mesma mutação do bloco das linhas 220 a 226, e só o teste citado muda. Está certo, porque cada um prova um teste diferente. Uma linha de comentário no documento dizendo isso evitaria que alguém tome um dos dois por duplicata e o apague.
