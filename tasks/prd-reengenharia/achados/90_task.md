# Achados das revisões — `tasks/prd-reengenharia/90_task.md`

Escrito pelo hook `tools/processo/revisoes.ts`. O resumo de cada rodada está em `indice.md`, nesta pasta. Não edite à mão.

## revisor-geral · 1ª rodada · APROVADO · 2026-10-22 23:51:26 · `tasks/prd-reengenharia/90_task.md`

VEREDITO: APROVADO

Escopo: respeitado

Aderência à Tech Spec: ok. A tarefa diverge da spec num ponto: a subtarefa 90.2 pedia o `imagensDosServicos` por `yaml` num commit anterior, e ele entrou no mesmo commit da tarefa. Essa divergência está registrada na `onda-5.md`, seção RF29, no item "Antes do Dockerfile, no mesmo commit da tarefa". A `onda-5.md` é parte da Tech Spec, porque a `techspec.md` foi partida em ondas, e a reengenharia não tem `cenarios.md`. A medida "antes" foi tirada no commit pai `94aca7d`, e o bruto está em `.processo/reengenharia/medidas/`.

Portão local: carimbo válido. A suíte conferida foi typecheck, lint, segredo, dependências, unidade e alvo.

Bloqueantes: nenhum.

- **Dockerfile:** comparei o `servico.Dockerfile` instrução por instrução com os cinco arquivos antigos do HEAD. Base, `NODE_ENV`, `USER`, `WORKDIR`, `EXPOSE`, `CMD`, as migrations no alvo `api`, o `ARG VITE_COM_GALERIA` e a web fora do `base` ficaram iguais. As instruções mudaram só de lugar: o build de `shared` e `nucleo` passou para o `base`.
- **Compose:** os seis `build:` apontam para o arquivo único com o `target` certo, e as etiquetas `image: educa-<x>:local` ficaram.
- **Referências:** fora dos diagnósticos em `.reengenharia/`, nada no código, na esteira (`.github`) ou nos `docs/` cita mais os Dockerfiles antigos.
- **Dependência:** `yaml` está declarado no `package.json` da raiz, então o import novo em `tools/ci/compose.ts` não abre buraco no knip da 24.0.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/compose.int.test.ts:51`: o `servico.build ?? { context: '' }` nunca é usado, porque o `filter` da linha 49 já descarta quem não tem `build`. Dá para tirar o fallback ou estreitar o tipo no `filter`.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/dockerfile.test.ts:47`: `servicosComBuild` devolve tuplas `[nome, build, imagem]`. Um objeto `{ nome, build, imagem }` leria melhor nos três lugares que a consomem.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/.reengenharia/RISCOS.md:26`: o risco S14 aponta para `infra/docker/web.Dockerfile:1`, que não existe mais. O novo lugar é o estágio `web` de `infra/docker/servico.Dockerfile`. Vale atualizar quando a R28 tocar nesse ponto.

## infra-guardian · 1ª rodada · APROVADO · 2026-10-22 23:52:02 · `tasks/prd-reengenharia/90_task.md`

VEREDITO: APROVADO
Caminho quente tocado: deploy
Rate limit: ok (a tarefa não mexe nele)
Fila e prioridade: ok (não muda; `worker-interativo` e `worker-lote` continuam com a mesma imagem e o mesmo `<<:` de antes)
Concorrência: protegida (não se aplica: a tarefa não cria operação que possa correr duas vezes)
Índice e paginação: ok (não se aplica: sem query nova)
Degradação de IA: não se aplica
Migration: não se aplica (o `COPY packages/nucleo/drizzle` continua no alvo `api`, que o `migrar` usa)
Métrica e alerta: ok (não há código novo no caminho quente)
Bloqueantes: nenhum

As cinco imagens saem iguais no que importa. Comparei os Dockerfiles antigos com `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/infra/docker/servico.Dockerfile`: imagem base, `NODE_ENV`, `USER node`, `WORKDIR`, `EXPOSE`, `CMD`, as migrations no `api` e o `ARG VITE_COM_GALERIA` na `web` continuam. Cada alvo de produção ainda instala só o próprio pacote, com `--omit=dev --workspace`. Os tamanhos medidos batem ao megabyte. Nenhum arquivo de código, de CI ou de documentação ainda cita os Dockerfiles antigos; só sobram citações no diagnóstico histórico em `.reengenharia/`.

Rodei os testes:
- **Unidade** (`dockerfile.test.ts`, `ambiente-de-teste.test.ts` e `guardas.test.ts`): 169 passaram.
- **Integração** (`compose.int.test.ts`): na primeira rodada falharam os dois casos de "recriar serviço do compose", enquanto o ambiente `teste-2` ainda subia. Rodei de novo sem mudar nada e os 13 passaram, inclusive o caso novo do `build`. A falha é do ambiente compartilhado, não do diff.

Recomendações:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/compose.ts:261`: `parse(...)` devolve `null` com texto vazio ou sem `services`, e a desestruturação quebra com `TypeError` em vez de um erro que diga o que faltou. Hoje todo chamador passa um compose de verdade; vale um erro explícito.
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/compose.int.test.ts:51`: `join(context, dockerfile)` supõe que o `docker compose config` devolve o `dockerfile` relativo. Com caminho absoluto, o `join` monta um caminho errado. Usar `resolve` cobre os dois casos.
- O tempo do `build --no-cache` caiu de 80 s para 78 s, dentro do ruído. O ganho real, que é o recomeço com cache e a esteira com menos núcleos, continua sem medida. Fica para quando a tarefa de `fetch-retries` e cache do npm, já escrita no `TODO.md`, for feita.

## test-engineer · 1ª rodada · APROVADO · 2026-10-22 23:52:52 · `tasks/prd-reengenharia/90_task.md`

**VEREDITO: APROVADO**

**Cenários exigidos** (é uma tarefa mecânica, de infra, sem dado de escola, sem permissão e sem concorrência; então não entram caso de isolamento, de permissão nem de corrida):
- **Caminho feliz:** todo serviço com `build` usa `servico.Dockerfile`, com um `target` que existe e que bate com a imagem.
- **Borda: âncora.** `api-2`, `realtime-2`, `despachante-2`, `worker-interativo-2` e os `worker-lote-*` herdam o `build` e o `image` pelo `<<`, inclusive na âncora de âncora.
- **Borda: a `web`.** Ela não declara `image`, não parte do `base` e não constrói o `nucleo`.
- **Borda: o `yaml` escrito de outro jeito.** Imagem entre aspas, comentário na linha, `image` depois de `<<`.
- **O que fica igual:** `USER node`, `CMD`, `NODE_ENV=production`, `EXPOSE`, as migrations no alvo `api`, o `ARG VITE_COM_GALERIA`.
- **Instalação:** cada alvo instala só o próprio pacote, com `--omit=dev`.
- **`.dockerignore`:** tem `mockups`, `.processo` e `.reengenharia`.
- **Compose de verdade:** resolve, aponta para um Dockerfile que existe e tem o estágio pedido.
- **Imagens sobem:** as cinco constroem e sobem saudáveis (fica com a esteira).

**Cobertos:** as 9 linhas da tabela têm teste citado pelo nome.
- **Linhas 1 a 5 e 7:** em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/dockerfile.test.ts`, um caso por linha.
  - A linha 2 vai além do pedido: o teste também exige que `target` seja igual a `educa-<alvo>:local`. Com isso a unidade já pega "target trocado entre apps", que a tabela tinha deixado só para a esteira.
- **Linha 6:** `ambiente-de-teste.test.ts:310`. A âncora de âncora já vinha provada por `:298` (`worker-lote-2`).
- **Linha 8:** `compose.int.test.ts:44`.
- **Linha 3:** a mutação foi provada à mão, porque o formato não cria arquivo. A justificativa está escrita e aceito: o `toEqual(['servico.Dockerfile'])` sobre o `readdirSync` fica vermelho com qualquer arquivo a mais.
- **Linha 9:** vai para a esteira, e isso está declarado.

Conferi as mutações contra o `git diff`:
- Há bloco para todas as cláusulas novas: os dois ramos de `compose.ts`, `dockerfile` e `target` no compose (alvos diferentes), `USER`, `CMD`, `NODE_ENV`, `--workspace`, `--omit=dev`, os três `EXPOSE`, o `drizzle`, o `ARG`, as duas mutações da `web`, as três linhas do `.dockerignore` e as duas entradas da lista do `guardas.test.ts`.
- Os contextos das mutações do compose são únicos (o `target: api` do `migrar` é preso por `command: [node, dist/ops/migrar.js]`).
- Li cada teste e cada um chega à cláusula que o bloco tira.
- Não há `.skip`, nem mock, nem `docker` na unidade.

Rodei os testes, e passaram:
- `npx vitest run --project unidade` com `dockerfile.test.ts`, `ambiente-de-teste.test.ts` e `guardas.test.ts`: 169 testes verdes.
- `npx vitest run --project integracao tools/ci/compose.int.test.ts`: 13 testes verdes.

**Bloqueantes:** nenhum.

**Recomendações:**
1. **`ambiente-de-teste.test.ts:310-334`:** o nome promete "até na âncora de âncora", mas o `api-3` (`<<: *api-dois`) declara `image` própria, e então só prova que o que ele declara vale sobre o herdado. Vale acrescentar um serviço com `<<: *api-dois` e sem `image`, esperando `educa-api:local`, ou tirar a âncora de âncora do nome. A regra continua provada pelo `COMPOSE_DE_EXEMPLO` em `:287-290`.
2. **`dockerfile.test.ts:82-92`:** o teste confere que existe um `CMD`, mas não o valor dele, e não confere o `WORKDIR` de cada alvo. Os dois estão na lista "Fica igual" da tarefa.
   - Hoje só a esteira os prova: com um caminho errado o contêiner sai e o `up --wait` falha.
   - Uma asserção de valor por alvo levaria isso para a unidade. Por exemplo: `WORKDIR /repo/apps/<alvo>`, e `CMD ["node", "dist/main.js"]` nos quatro de produção.
3. **A versão da imagem base:** `node:22.23.2-alpine3.23` é "Fica igual", mas só é conferida no estágio da `web` (`dockerfile.test.ts:115`). Trocar a versão do `base` ou do `producao` não deixa nenhum teste vermelho. Uma linha a mais no teste fecha isso.
4. **`compose.int.test.ts:55`:** com `target` indefinido, a mensagem de falha sai como "sem o estágio" vazio. Vale dizer "sem target" de forma explícita, como já faz `dockerfile.test.ts:70`.

Arquivos auditados:
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/90_task.md`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/infra/docker/servico.Dockerfile`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/dockerfile.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/ambiente-de-teste.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/compose.int.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/compose.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/guardas/guardas.test.ts`
- `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/infra/compose.yml`

## revisor-geral · 2ª rodada · APROVADO · 2026-10-23 00:02:31 · `tasks/prd-reengenharia/90_task.md`

VEREDITO: APROVADO
Escopo: respeitado
Aderência à Tech Spec: ok
Portão local: carimbo válido (typecheck, lint, segredo, dependências, unidade, alvo)
Bloqueantes: nenhum

As duas recomendações que eu fiz na 1ª rodada para este código foram aplicadas:
- **Fallback em `compose.int.test.ts`:** o `?? { context: '' }` saiu. No lugar dele entrou um laço que só guarda o serviço que tem `build`, e há asserções explícitas de `sem dockerfile` e `sem target` antes do `resolve`.
- **Tuplas em `dockerfile.test.ts`:** `servicosComBuild` agora devolve objetos `{ nome, build, imagem }`, e os três pontos que o chamam leem esses campos.

O que mudou nesta rodada é só teste, documento da tarefa e `TODO.md`. Nenhum arquivo de produção mudou. Conferi que as cinco mutações novas acham o trecho que alteram em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/infra/docker/servico.Dockerfile`:
- `WORKDIR /repo/apps/worker` na linha 87;
- `CMD` da api na linha 60;
- `--port 4173` da web na linha 113;
- `FROM` de `base` na linha 5 e de `producao` na linha 38.

O caso novo "todo estágio que não herda de outro" bate com os três estágios que partem da imagem do Node: `base`, `producao` e `web`.

Recomendações:
- **Destino de uma recomendação que não existe.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/90_task.md:357`, a recomendação sobre o S14 de `.reengenharia/RISCOS.md:26` foi mandada para "a tarefa da R28". Essa tarefa não existe. A R28 está só registrada, fora da X5 (`.reengenharia/DECISOES.md:56`), e espera o staging. Na prática, o S14 continua apontando para `infra/docker/web.Dockerfile:1`, que foi apagado, e nenhuma tarefa está marcada para corrigir isso. Vale trocar o destino por uma linha no `TODO.md`, junto das pendências de staging, ou corrigir a referência agora, que é uma linha só.
- **Tuplas que sobraram.** Em `/home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/compose.int.test.ts:51`, `construidos` ainda é uma lista de tuplas `[string, Build]`, com o `for` e o `push` na mesma linha. Isso destoa do formato em objeto que o `dockerfile.test.ts` passou a usar. Não bloqueia.

## test-engineer · 2ª rodada · APROVADO · 2026-10-23 00:02:35 · `tasks/prd-reengenharia/90_task.md`

VEREDITO: APROVADO

**Cenários exigidos:** nesta rodada só mudaram testes e documentos. Nenhum arquivo de produção mudou desde a rodada aprovada (`git diff --stat 4a9954eb..63a18d02`). Por isso o que precisava conferir era:
- se as quatro recomendações da 1ª rodada foram aplicadas;
- se cada uma das cinco mutações novas chega à cláusula que diz testar.

**Cobertos:**
1. **"Âncora de âncora" (recomendação 1).** Em `tools/ci/ambiente-de-teste.test.ts:320-321`, o serviço `api-4` tem `<<: *api-dois` e não tem `image`. O teste espera `educa-api:local`, ou seja, dois saltos de herança. Ele falha se o `merge: true` sair de `tools/ci/compose.ts:261`, porque aí o `api-4` some do mapa.
2. **`WORKDIR` e `CMD` com valor por alvo (recomendação 2).** Em `tools/ci/dockerfile.test.ts:90-91`, o teste confere o último `WORKDIR` e o último `CMD` de cada alvo, já com a herança de `producao` resolvida. As três mutações novas caem nele, e cada contexto delas só existe em um lugar do arquivo:
   - o `WORKDIR` do `worker` trocado por `/repo/apps/api`;
   - o `CMD` da `api` trocado por `dist/server.js` (o contexto `WORKDIR /repo/apps/api`/`EXPOSE 3000` existe só na `api`);
   - a porta da `web` trocada por 4174.
3. **Versão da imagem base em todo estágio raiz (recomendação 3).** O teste em `tools/ci/dockerfile.test.ts:121-126` pega os estágios que não herdam de outro e exige exatamente `['base', 'producao', 'web']`, todos em `IMAGEM_DO_NODE`. As duas mutações de `FROM` (a do `base` e a do `producao`) deixam o estágio na lista com a versão errada, e o teste fica vermelho pelo motivo certo. A `web` já estava coberta por `:115-119`.
4. **Mensagem com `target` indefinido (recomendação 4).** Em `tools/ci/compose.int.test.ts:54-55` entraram `toBeDefined` com as mensagens "sem dockerfile" e "sem target". A troca de `join` por `resolve` é correta, porque o `context` vem absoluto do `docker compose config`. O fallback morto para `'Dockerfile'` saiu.
5. **Refatorações dos outros revisores.** A troca de tupla por objeto em `servicosComBuild` não muda o que os testes conferem.
6. **Registro do que ficou sem aplicar.** A linha nova do `TODO.md` (o caso de compose vazio em `imagensDosServicos`) e a tabela "Recomendações sem aplicar" registram destino e motivo. Não há cláusula nova sem bloco de mutação.
7. **Itens da lista de auditoria.** Não há `.skip`, não há mock e não há chamada a provedor de IA. Concorrência não se aplica nesta tarefa.

Rodei `npx vitest run tools/ci/dockerfile.test.ts tools/ci/ambiente-de-teste.test.ts`: 53 testes passaram. O `compose.int.test.ts` precisa do Docker e não foi rodado aqui.

**Bloqueantes:** nenhum.

**Recomendações:**
- As mutações de `WORKDIR` e `CMD` atacam um alvo cada (o `worker`, a `api` e a `web`). O laço por alvo cobre os outros, então não falta prova. Se quiser deixar isso explícito, vale um bloco a mais no `despachante` ou no `realtime`.
- Em `tools/ci/compose.int.test.ts:57-58`, o `?? ''` ficou redundante depois do `toBeDefined`. É só ruído para o tipo; dá para trocar por uma afirmação de tipo, ou deixar como está.

Arquivos auditados:
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/dockerfile.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/ambiente-de-teste.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tools/ci/compose.int.test.ts
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/infra/docker/servico.Dockerfile
- /home/joaquimdp/Documentos/git/.maestri/floors/educaia--specreengenharia--l2/tasks/prd-reengenharia/90_task.md
