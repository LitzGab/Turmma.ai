# Achados das revisões — `tasks/prd-harness/4_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-23 18:07:33 · `tasks/prd-harness/4_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só mexe na ferramenta do processo: o job `e2e` do CI, `tools/processo/esteira.ts` e a régua de duração do e2e. Nada disso roda em request, fila, gateway de IA ou migration do produto.
Rate limit: não se aplica
Fila e prioridade: não se aplica
Concorrência: protegida. Cada fatia baixa o relatório numa pasta temporária própria (`mkdtempSync`) e apaga a pasta depois. Com `overwrite: true`, rodar a fatia de novo não recusa o artefato de mesmo nome.
Índice e paginação: não se aplica. A consulta de artefatos usa `per_page=100`, e a execução tem no máximo 14 (7 de traço e 7 de censo).
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: não se aplica. O censo mede a duração do e2e. Ele sai com 0, 1 ou 2, e a saída 2 diz qual fatia falta ou expirou.
Bloqueantes: nenhum

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/.github/workflows/ci.yml:136-141`: o comentário diz "sem ... anexo", mas o repórter `json` do Playwright grava em cada resultado o `stdout`, o `stderr`, a mensagem de erro e o caminho dos anexos. O conteúdo do anexo não vai, mas o texto da saída vai, e o repositório é público. Isso só é aceitável enquanto todo dado do e2e for sintético (regra 20, item 17). Vale dizer isso por extenso no comentário, como o passo do traço já faz, e deixar a decisão final com o `privacy-guardian`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/esteira.ts`, função `fazerOCenso`: as execuções verdes anteriores a esta mudança não têm artefato de censo. O primeiro `--censo` de cada branch vai sair com 2 até a esteira rodar de novo. A mensagem já manda rodar `gh workflow run`. Para o `/seguir` (17.0) não ler isso como falha, convém registrar o caso no texto dele.
- Os três arquivos de teste passam: 100 casos, rodados com `npx vitest run --project unidade tools/processo/esteira.test.ts tools/ci/esteira.test.ts tools/ci/duracao-do-e2e.test.ts`. Nenhum chama o `gh` de verdade nem provedor pago.

## privacy-guardian · 1ª rodada · APROVADO · 2026-10-23 18:07:33 · `tasks/prd-harness/4_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. A tarefa só mexe em ferramentas de processo: o censo do prazo do e2e, a régua de duração e o `ci.yml`. Não há migration, entidade, DTO, rota nem campo de pessoa.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica, porque nenhum endpoint foi criado ou alterado.

Logs: limpos. O `relatorioDoCenso` (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/esteira.ts`) imprime só arquivo:linha, projeto, fatia, duração, prazo e o título do caso de e2e, que é texto de teste e não dado de titular.

Auditoria: não se aplica. Não há leitura de dado de aluno, exportação de dado de titular, nota, permissão nem saída de IA.

Envio externo: o relatório JSON do repórter do Playwright de cada fatia sobe como artefato `censo-do-e2e-<fatia>` no GitHub Actions, por 7 dias, também quando a execução fica verde (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/.github/workflows/ci.yml:142-149`). O repositório é público. Mesmo assim isso não vaza dado pessoal, por três motivos:
- O e2e roda só com dado sintético (regra 20, item 17).
- O passo sobe só `censo-do-e2e.json`, sem `test-results/`, traço ou captura. O teste em `tools/ci/esteira.test.ts` confirma o `path`, os 7 dias e o `overwrite`.
- Nenhum spec de `e2e/` usa `testInfo.attach`, e o `ci.yml` não usa segredo nem `env` de credencial. A única `env` nova é o nome do arquivo, e o teste exige exatamente esse valor.

Na volta, o `--censo` baixa cada fatia para uma pasta temporária, lê o arquivo e apaga a pasta no `finally` (`baixarORelatorio`). Nada do artefato fica na máquina.

Seed/fixture: sintético. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/__fixtures__/esteira/censo-do-e2e-fatia.json` traz só um caso inventado ("sobe o PDF licenciado"), com durações e o caminho do runner, sem nome de pessoa.

Bloqueantes: nenhum.

Recomendações:
1. Corrigir os comentários em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/.github/workflows/ci.yml:137-138`, no JSDoc de `ARQUIVO_DO_CENSO_DO_E2E` em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/duracao-do-e2e.ts` e no 4.1 de `tasks/prd-harness/4_task.md`. Eles dizem que o relatório leva só "título, arquivo, tempo e prazo, sem anexo". Na verdade, o repórter `json` do Playwright também grava `errors`, `stdout`, `stderr` e os metadados de `attachments` de cada resultado. Isso não vaza nada hoje: o dado é sintético e o log público do job já mostra o mesmo texto pelos repórteres `list` e `github`. Mas o comentário promete mais do que o arquivo garante, e quem ler pode concluir que um e2e com dado diferente estaria coberto. Basta descrever o arquivo como ele é e repetir que a garantia vem do dado sintético.
2. Para fechar essa garantia, uma opção barata é um teste no `tools/ci/esteira.test.ts` que falhe se algum spec de `e2e/` passar a usar `testInfo.attach({ body })`. O repórter `json` grava esse corpo dentro do arquivo, em base64, e ele iria junto para o artefato público que agora sobe também no verde.

Pergunta de fechamento: esta tarefa não acrescenta dado de aluno nem destino novo para dado de aluno, então não muda a resposta.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-23 18:08:07 · `tasks/prd-harness/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

**Escopo.** As quatro subtarefas foram feitas.
- 4.1: o artefato `censo-do-e2e-<fatia>` sobe só o JSON, também no verde, por 7 dias, sem `test-results/`.
- 4.2: o `--censo` tem a branch opcional, lê a última verde, sai 2 quando falta fatia ou o artefato expirou e diz qual.
- 4.3: o caso que só mudou de título herda o prazo do caso de corpo idêntico.

Nada do texto do `/seguir` (17.0) entrou.

**Tech Spec.** As quatro divergências da tabela do `4_task.md` estão escritas no §5(f) da `techspec.md` e no RF9 e no RF11 do `cenarios.md`:
- o prazo vem do relatório (`casosMedidos`), e não de `prazosDosCasos`;
- os códigos de saída 0, 1 e 2;
- o `success() || failure()` com `overwrite` e a `env` única;
- o corpo tem de ser único no HEAD e na árvore para herdar o prazo.

**Conferências que fiz:**
- O caminho da `env` ao Playwright fecha. O `tools/ci/e2e.ts` herda o ambiente, e o `relatoriosDoPlaywright` só liga o repórter `json` com `outputFile` quando a variável existe.
- A sugestão `gh workflow run esteira --ref` funciona: o `ci.yml` tem `workflow_dispatch`.
- Se o `gh` falha no meio do download, cai no `catch` que já existia e sai 2. Bate com "não há o que ler".
- O teste "sem segredo nem ambiente" aceita a `env` só no passo `npm run ci:e2e`, com valor literal. Ele foi apertado, não afrouxado.
- O teste "nenhum outro job publica artefato" continua valendo: o artefato novo é do job `e2e`.

**Recomendações:**
1. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/esteira.ts:234`: o comentário diz "passaria por a suíte inteira"; o certo é "passaria pela suíte inteira".
2. `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/duracao-do-e2e.ts`, `casosDoSpec`: o corpo do último caso de um `describe` vai até o próximo `test(` ou até o fim do arquivo. Assim ele leva junto o `})` de fechamento e o que vier depois. Esse erro cobra mais, nunca menos, e o comentário de `prazosDosRetitulados` já fala do caso que muda de lugar. Falta dizer também que mexer no código depois do último caso já basta para ele perder o prazo herdado.
3. O artefato do censo também sobe na execução de pull request, num repositório público. O comentário do passo do traço já avisa que isso só é seguro com o dado do e2e sintético; vale repetir o aviso no passo do censo. A decisão é do `privacy-guardian`.

## test-engineer · 1ª rodada · REPROVADO · 2026-10-23 18:09:04 · `tasks/prd-harness/4_task.md`

VEREDITO: REPROVADO

**Cenários exigidos:**
- **RF9:** um caso a 70% do prazo é listado, com fatia e prazo; um caso a 60% não é listado; um caso a exatos dois terços não é listado; um caso com prazo de 90 s também é medido; fatia faltando sai 2 e diz qual; artefato expirado sai 2 e diz qual, separado da fatia faltando; sem execução verde sai 2; havendo uma execução vermelha mais nova, o censo lê a verde (a lista de artefatos e o download); o `ci.yml` sobe só o JSON, também no verde, sem o cancelado, por 7 dias, com `overwrite`, e só o passo do e2e tem `env`.
- **RF11:** título novo com o mesmo corpo do caso com `test.slow()` herda 90 s, também num spec novo ainda fora do git; corpo mudado não herda; dois corpos iguais no HEAD fazem nenhum herdar; um corpo copiado com o título velho ainda na árvore não herda; spec apagado, ignorado pelo git ou que não termina em `.spec.ts` fica fora da leitura.
- Concorrência: não se aplica, porque nada grava e o comando só lê.

**Cobertos:** as 9 linhas da tabela têm teste citado pelo nome. Os três arquivos passam: 100 testes, com `npx vitest run --project unidade tools/processo/esteira.test.ts tools/ci/esteira.test.ts tools/ci/duracao-do-e2e.test.ts`. Não há `.skip`, nem teste comentado, nem chamada a provedor pago. O `gh` é injetado e o relatório de exemplo está em `tools/processo/__fixtures__/esteira/censo-do-e2e-fatia.json`.

**Bloqueantes:**

1. **Mutação com erro de sintaxe** (`tasks/prd-harness/4_task.md:241-246`, bloco de `artefatosDoGh`).
   - A troca é `.map(({ name, expired: false }) => …)`. Isso não é JavaScript válido: `node -e` devolve "SyntaxError: Invalid destructuring assignment target".
   - O teste fica vermelho porque o arquivo não carrega, e não porque a regra foi tirada. O bloco não prova nada.
   - Correção: `+…artifacts.map(({ name }) => ({ name, expired: false }))`.

2. **O censo pode baixar o relatório da execução errada sem nenhum teste falhar** (`tools/processo/esteira.ts:245`, `relatorioDe(execucao.id, fatia)`).
   - Essa cláusula nova não tem bloco de mutação.
   - O teste `com uma vermelha mais nova que a verde…` (`tools/processo/esteira.test.ts:374`) só registra o id passado a `artefatosDe`.
   - O `dasFatias` (`esteira.test.ts:294`) ignora o id da execução. Se o download pegar a vermelha mais nova (`relatorioDe(execucoes[0].id, …)`), ou pular uma fatia (`FATIAS_DO_E2E.filter(f => f !== 7)`), tudo continua verde.
   - Isso é exatamente o "o censo lê a verde" do RF9, provado só pela metade.
   - Correção: o teste registra os pares `(execução, fatia)` que `relatorioDe` recebe e exige `[[11,1]…[11,7]]`. Mais um bloco de mutação nessa linha.

3. **O `.trim()` do corpo não tem teste nem bloco** (`tools/ci/duracao-do-e2e.ts:284`, `corpo: doCaso.trim()`).
   - Se o `.trim()` for tirado, todos os casos de RF11 continuam passando: nos testes, o corpo no HEAD e o corpo na árvore terminam igual (`})\n`).
   - O comportamento está declarado na doc de `casosDoSpec` ("sem as pontas em branco"), mas nada o prova.
   - Correção: um caso que muda de título e passa a ser o último de um spec sem `\n` final, ou ganha uma linha em branco antes do próximo `test(`, e ainda herda 90 s. Mais o bloco `-corpo: doCaso.trim()` / `+corpo: doCaso`.

4. **A proteção "nada além do relatório vai para o artefato público" ficou mais fraca** (`tools/ci/esteira.test.ts:326`).
   - Antes, o teste do traço exigia uma única publicação de artefato no job `e2e`. Agora ele filtra pelo prefixo `traco-`, e `publicacaoDoCenso` (`:372`) filtra pelo prefixo do censo.
   - Um terceiro `upload-artifact` no `e2e`, com outro nome, `path: test-results/` e `if: always()`, passa por todos os testes.
   - O repositório é público e o artefato do traço leva captura de tela e corpo de requisição.
   - Correção: exigir que o job `e2e` tenha exatamente dois `upload-artifact`, o do traço e o do censo, mais um bloco que acrescenta um terceiro.

**Recomendações:**
- `esteira.test.ts`, teste `o relatório do censo sobe também na execução verde`: ele aceita `if: success()` sem o `|| failure()`, que o `cenarios.md` RF9 declara. Use `toBe('success() || failure()')`, ou registre no documento que o `failure()` é dispensável, já que o censo só lê a verde.
- RF11: falta um caso que prove que só mudar um comentário conta como corpo idêntico. O techspec §5(f) diz que o corpo é lido sem comentário.
- O relatório JSON do Playwright guarda `stdout`, `stderr` e `attachments[].body` (em base64, quando o anexo vai embutido) dentro do próprio arquivo. O `path` restrito não impede esse conteúdo de ir para o artefato público. O dado é sintético (regra 20, item 17), mas vale o `privacy-guardian` confirmar que o e2e não anexa corpo nem imprime segredo.
- A ligação do `--censo` na linha de comando (`esteira.ts:374-387`) não tem teste. Ela segue o padrão que já existia, e o `catch` sai 2, o que está correto.

## infra-guardian · 2ª rodada · APROVADO · 2026-10-23 18:18:17 · `tasks/prd-harness/4_task.md`

VEREDITO: APROVADO
Caminho quente tocado: nenhum. A tarefa só mexe na esteira e nas ferramentas de processo. No `ci.yml` mudou apenas o comentário do passo do censo.
Rate limit: ok (não se aplica)
Fila e prioridade: ok (não se aplica)
Concorrência: protegida (não se aplica)
Índice e paginação: ok (não se aplica)
Degradação de IA: não se aplica
Migration: não se aplica
Métrica e alerta: ok (não se aplica)
Bloqueantes: nenhum

Situação das duas recomendações da 1ª rodada:
- **Comentário do censo no `ci.yml`:** feito. O comentário (linhas 136-144) agora diz que o repórter `json` grava `errors`, `stdout` e `stderr` e os metadados dos anexos. Diz também que o censo sobe na execução de pull request de um repositório público e que a garantia é todo dado do e2e ser sintético (regra 20, item 17). O mesmo texto está no JSDoc de `tools/ci/duracao-do-e2e.ts`, ao lado de `ARQUIVO_DO_CENSO_DO_E2E`.
- **O primeiro `--censo` sair 2 em branch sem artefato:** está registrado em "Recomendações sem aplicar" do `4_task.md`, com destino na tarefa 17.0 (texto do `/seguir`). O destino é aceitável.

Rodei `tools/ci/esteira.test.ts` e `tools/processo/esteira.test.ts`: 54 de 54 passaram. Os dois testes novos de `tools/ci/esteira.test.ts` batem com a árvore. O job e2e tem só dois passos `upload-artifact` (linhas 127 e 146) e nenhum arquivo de `e2e/` usa `.attach(`.

Recomendações: nenhuma nova.

Arquivos:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/.github/workflows/ci.yml
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/duracao-do-e2e.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/esteira.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/esteira.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tasks/prd-harness/4_task.md

## privacy-guardian · 2ª rodada · APROVADO · 2026-10-23 18:18:19 · `tasks/prd-harness/4_task.md`

VEREDITO: APROVADO

Campos pessoais tocados: nenhum. Desde a 1ª rodada, o diff mexe só em comentários, testes, mutações declaradas e no texto do documento da tarefa. Nenhum código de produto, migration, repository ou endpoint mudou.

Fora da tabela de dados do docs/lgpd.md: nada.

Autorização por objeto: não se aplica. A tarefa é de ferramenta de processo e esteira e não tem rota.

Logs: limpos. As saídas de `tools/processo/esteira.ts:385-399` imprimem o relatório do censo (título, arquivo e tempo de cada caso) e a primeira linha do erro do `gh`. Nenhuma delas leva dado de pessoa.

Auditoria: não se aplica. A tarefa não tem leitura de aluno, exportação de dado de titular, nota nem permissão.

Envio externo: o artefato `censo-do-e2e-<fatia>`, com o JSON do repórter do Playwright, sobe para o GitHub Actions por 7 dias e também em PR de repositório público. O destino é declarado no `ci.yml`. Conferi as duas recomendações da rodada anterior.
- **Comentários corrigidos.** O comentário de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/.github/workflows/ci.yml:136-144` e o JSDoc de `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/duracao-do-e2e.ts:152-157` agora dizem a verdade. O JSON leva `errors`, `stdout`, `stderr` e os metadados dos anexos, e a garantia é todo dado do e2e ser sintético (regra 20, item 17).
- **Teste novo.** `nenhum arquivo de e2e/ anexa corpo ao resultado` está em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/esteira.test.ts:405-411`. Ele prova a garantia e tem mutação declarada em `e2e/casca-publica.spec.ts`.
- **Busca na árvore.** Hoje nenhum `.attach(` e nenhum `console.log` aparecem em `e2e/`.
- **Limite de artefatos.** Também entrou `o job e2e publica exatamente dois artefatos`, que impede um terceiro upload, por exemplo de `test-results/`, sem declaração. Isso fecha a outra porta de saída.

Seed/fixture: sintético. `tools/processo/__fixtures__/esteira/censo-do-e2e-fatia.json` traz títulos de caso inventados, id fictício e `errors`, `stdout`, `stderr` e `attachments` vazios.

Bloqueantes: nenhum.

Recomendações:
- O teste de anexo procura só `.attach(` e só em `e2e/**/*.ts`. Um `console.log` num spec, ou um `page.on('console')` que repasse o console do navegador, cairia em `stdout` dentro do artefato público sem que nada quebre. Se o e2e um dia passar a usar dado que não seja montado na hora, vale estender a mesma guarda a `console.` em `e2e/`. Hoje está limpo.
- A garantia depende de o e2e continuar 100% sintético. Quando o staging (D31) ou um e2e contra ambiente com dado real existir, o upload do censo em PR público tem de ser revisto antes. Vale registrar isso no `TODO.md` do portão da primeira escola real.

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 18:18:35 · `tasks/prd-harness/4_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependencias, unidade, alvo)
Bloqueantes: nenhum

Conferi o diff da 2ª rodada (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/.processo/ordens/4_task-diff-r2.patch`) contra as quatro correções que o `test-engineer` exigiu na 1ª rodada. As quatro foram feitas, e as três recomendações que eu tinha dado também.

**Correções exigidas na 1ª rodada:**
- **Mutação com erro de sintaxe:** o bloco de `artefatosDoGh` agora troca por `.map(({ name }) => ({ name, expired: false }))`, que é JavaScript válido (`tasks/prd-harness/4_task.md:245`).
- **Execução e fatia do download:** o teste `com uma vermelha mais nova` agora registra cada par (execução, fatia) passado a `relatorioDe` e exige `[[11,1]…[11,7]]` (`tools/processo/esteira.test.ts:384-393`). Dois blocos de mutação cobrem a linha: um baixa da execução errada, o outro pula uma fatia.
- **O `.trim()` do corpo:** há um caso novo em que o último caso do spec muda de título e ganha linhas em branco no fim, e ainda herda os 90 s (`tools/ci/duracao-do-e2e.test.ts:567`). O bloco de mutação tira o `.trim()`.
- **Terceiro artefato no job e2e:** o teste agora exige exatamente os dois `upload-artifact`, o do traço e o do censo, nessa ordem (`tools/ci/esteira.test.ts:405-408`). O bloco de mutação acrescenta um terceiro com `test-results/`.

**Recomendações do `test-engineer` que entraram nesta rodada:**
- O `if` do censo agora tem de ser exatamente `success() || failure()`, com bloco de mutação.
- Há um caso que prova que mudar só um comentário mantém o corpo idêntico, com bloco de mutação no `semComentarios`.
- Um teste novo falha se algum arquivo de `e2e/` usar `.attach(`. Hoje não há nenhum, e o arquivo da mutação (`e2e/casca-publica.spec.ts`) existe com a linha de import que ela troca.

**Minhas recomendações da 1ª rodada:**
- "pela suíte inteira" foi corrigido em `tools/processo/esteira.ts`.
- O comentário de `prazosDosRetitulados` agora diz até onde vai o corpo do último caso.
- O passo do censo no `ci.yml` agora repete o aviso de dado sintético e de repositório público, e descreve o que o relatório `json` leva de fato (`errors`, `stdout`, `stderr` e os metadados dos anexos).

As recomendações recusadas estão registradas com motivo na tabela do `4_task.md`. A do `/seguir` foi para a tarefa 17.0, que está fora do escopo desta.

Recomendações:
- Dá para escapar do teste dos anexos (`/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/esteira.test.ts:410-416`). A busca procura só o texto `.attach(`, então `testInfo['attach'](...)` ou um helper fora de `e2e/` chamado pelos specs passaria. Não bloqueia: hoje não há nada disso, e a garantia principal continua sendo o dado sintético.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 18:19:08 · `tasks/prd-harness/4_task.md`

VEREDITO: APROVADO

Cenários exigidos:
- **RF9 (censo):**
  - um caso a 70% do prazo é listado; um a 60% não é, e um a exatos dois terços também não;
  - um caso de 90 s é medido pelo prazo que a corrida deu a ele;
  - fatia faltando e artefato expirado saem 2, cada um com a sua mensagem;
  - sem nenhuma verde, sai 2;
  - com uma vermelha mais nova, o censo lê a verde: a lista de artefatos e o download de cada fatia, sem pular nenhuma;
  - o `ci.yml` sobe só o JSON, com `if` igual a `success() || failure()`, por 7 dias e com `overwrite`;
  - o job `e2e` publica exatamente dois artefatos;
  - nenhum spec de `e2e/` anexa corpo.
- **RF11 (prazo herdado):**
  - título novo com corpo idêntico herda o prazo, também num spec novo;
  - corpo mudado não herda; corpo duplicado no HEAD ou copiado também não;
  - pontas em branco e comentários não mudam o corpo;
  - spec apagado, ignorado ou que não termina em `.spec.ts` fica fora da leitura.
- **Concorrência:** não se aplica. O comando só lê.

Cobertos: as quatro correções da 1ª rodada foram feitas e conferi cada uma no código.
1. **Mutação de `artefatosDoGh`.** Agora é `.map(({ name }) => ({ name, expired: false }))`, que é JavaScript válido. Fica vermelha porque a regra sai, não por erro de sintaxe.
2. **Download da execução certa.** O teste em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/processo/esteira.test.ts:374` registra os pares (execução, fatia) e exige `FATIAS_DO_E2E.map((fatia) => [11, fatia])`.
   - O primeiro item do array é a vermelha 13, então a mutação `execucoes[0]?.id` dá vermelho pelo motivo certo. A mutação que pula a fatia 7 também.
   - As duas trocas batem palavra por palavra com `esteira.ts:245`.
3. **`.trim()` do corpo.** O corpo do último caso vai até o fim do arquivo, porque o `FIM_DE_CASO` só corta em `test.describe` e afins. O `})\n` do HEAD contra o `})\n\n\n` da árvore só fica igual com o `.trim()`, então o teste "as pontas em branco não mudam o corpo" prova a cláusula. O bloco cita `duracao-do-e2e.ts:286` palavra por palavra.
4. **Exatamente dois `upload-artifact` no job `e2e`.** O teste compara a lista de nomes com `[traço, censo-<fatia>]`.
   - A mutação entra com o recuo da linha de origem (`mutacoes.ts:149`) e é YAML válido em fluxo, então fica vermelha pelo terceiro nome, não por erro de parse.
   - A âncora `- if: success() || failure()` aparece uma vez só no `ci.yml` (linha 145).
- As recomendações aplicadas têm teste e bloco de mutação:
  - o `toBe('success() || failure()')`, com a mutação para `success()`;
  - o caso RF11 em que só o comentário muda, com a mutação que tira o `semComentarios`;
  - o teste que proíbe `.attach(` em `e2e/`, com a mutação no `casca-publica.spec.ts`.
- Rodei `npx vitest run --project unidade` nos três arquivos: 104 testes passam (eram 100, mais os 4 novos).
- Nesta rodada, o diff no código de produção do processo (`esteira.ts`, `duracao-do-e2e.ts` e `ci.yml`) só mexe em comentário e JSDoc. Não há cláusula nova sem bloco, `.skip`, teste comentado nem chamada a provedor pago.

Bloqueantes: nenhum.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specharness--l3/tools/ci/esteira.test.ts`, teste "nenhum arquivo de e2e/ anexa corpo": a busca por `/\.attach\(/` não pega `testInfo.attachments.push({ name, body })`, que também põe o corpo dentro do relatório JSON. Vale acrescentar `attachments.push` à expressão.
- O caso do `.trim()` cobre só a ponta final do último caso do spec. A linha em branco antes do próximo `test(` num caso do meio também passa pelo `.trim()`. A mutação já prova a cláusula; este seria um caso extra, sem bloco novo.
