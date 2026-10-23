# Tarefa 90.0 — Um Dockerfile com `target`, imagens medidas antes e depois

**Funcionalidade:** reengenharia · **Depende de:** 24.0
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande

## Objetivo

Os cinco Dockerfiles viram `infra/docker/servico.Dockerfile`, multi-stage, com um `target` por app. O `base` instala e
constrói `shared` e `nucleo` uma vez. As imagens ficam iguais no que importa (nome, usuário, porta, comando) e o tamanho
e o tempo do `build --no-cache` se medem antes e depois (RF29). **Tarefa mecânica:** o produto não muda.

## Contexto necessário

- `onda-5.md` "RF29 — Dockerfile, profiles e aviso de prazo", item "Dockerfile único (90.0)"; `prd.md` RF29 (§11)
- Regras 00 (item 8: tudo sobe com `docker compose up`) e 80 (item 9)
- Hoje: `infra/docker/{api,despachante,realtime,worker,web}.Dockerfile`, seis `build:` em `infra/compose.yml` (`migrar`,
  `api-1`, `realtime-1`, `despachante-1`, `worker-interativo-1`, `web`), `.dockerignore`, `imagensDosServicos` em `tools/ci/compose.ts`
- Nenhum teste lê Dockerfile, e `ci.yml` não o cita: a esteira o prova por `up --build --wait`
- A 24.0 declara cada dependência no pacote que a usa, e a imagem final instala por `npm ci --omit=dev --workspace`: sem ela,
  falta `pg`, `ioredis` ou `bullmq` na imagem. A `onda-5.md` diz que a 90.0 espera a 54.0 (X6); vale o `tasks.md`: 24.0

## Subtarefas

- [x] 90.1 — Medida antes, no commit pai: `build --no-cache` de tudo (tempo) e `docker image ls` (tamanho por imagem)
- [x] 90.2 — Num commit antes: `imagensDosServicos` lê por `parse(texto, { merge: true })` de `yaml`, no lugar da regex; os testes de hoje ficam
- [x] 90.3 — `servico.Dockerfile`: `base` (manifestos, `npm ci --ignore-scripts`, build de `shared` e `nucleo`); `construcao-<app>` e o alvo `<app>` para `api`, `despachante`, `realtime` e `worker`; `web` com as instruções de hoje, sem o `base` (não constrói o `nucleo`)
- [x] 90.4 — Os seis `build:` do compose passam a `dockerfile: infra/docker/servico.Dockerfile` e `target:`; os cinco arquivos antigos saem; `.dockerignore` ganha `mockups`, `.processo` e `.reengenharia`
- [x] 90.5 — `tools/ci/dockerfile.test.ts`: a trava
- [x] 90.6 — Medida depois, no commit da tarefa; a tabela antes/depois em `tasks/prd-reengenharia/medidas-da-onda-5.md` (bruto em `.processo/reengenharia/medidas/`)
- [x] 90.7 — Testes: os da tabela

**Fica igual:** `node:22.23.2-alpine3.23`, `NODE_ENV=production`, `USER node`, `WORKDIR`, `EXPOSE` (api e realtime 3000, web
4173), `CMD`, `COPY packages/nucleo/drizzle` no `api` (o `migrar` usa a mesma imagem), `ARG VITE_COM_GALERIA`, e as
etiquetas `image: educa-<x>:local` (as `teste-N` dependem delas).

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `infra/docker/servico.Dockerfile` | novo |
| `infra/docker/api.Dockerfile`, `despachante.Dockerfile`, `realtime.Dockerfile`, `worker.Dockerfile`, `web.Dockerfile` | removido |
| `infra/compose.yml`, `.dockerignore` | alterado |
| `tools/ci/compose.ts`, `tools/ci/ambiente-de-teste.test.ts` | alterado |
| `tools/ci/dockerfile.test.ts` | novo |
| `tools/guardas/guardas.test.ts`, `tools/ci/compose.int.test.ts`, `TODO.md`, `tasks/prd-reengenharia/onda-5.md` | alterado (lista fechada de quem cita `mockups`; caso de integração do `build`; o texto dos `npm ci`; o "antes" da 90.2) |
| `tasks/prd-reengenharia/medidas-da-onda-5.md` | novo |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação) |
|---|---|---|
| Todo serviço do compose com `build` usa `servico.Dockerfile` | unidade | um `build` volta a `api.Dockerfile` |
| Todo `target` citado existe como `FROM … AS <alvo>` | unidade | `target: workr` |
| `infra/docker/` só tem o `servico.Dockerfile` | unidade | restaurar `web.Dockerfile` |
| Cada alvo final tem `USER node` e `CMD`, e os quatro de produção `NODE_ENV=production` | unidade | tirar o `USER node` do `worker` |
| Cada alvo final instala só o seu pacote: `--omit=dev --workspace @educa/<app>` | unidade | `@educa/api` no alvo `worker` |
| `image` com aspas, comentário e `<<` antes de `image` resolve, com a âncora de âncora | unidade | voltar à regex |
| `.dockerignore` tem `mockups`, `.processo` e `.reengenharia` | unidade | tirar `mockups` |
| `docker compose config --quiet` resolve (sem `docker build`) | integração | `dockerfile:` com caminho que não existe |
| As cinco imagens constroem e o compose sobe saudável | esteira (`up --build --wait`) | `target` trocado entre apps |

## Como testar

- A leitura do compose: `tools/ci/ambiente-de-teste.test.ts › imagens construídas, por ambiente › a imagem de cada serviço
  sai com a âncora resolvida, e o que não é serviço fica de fora` (o `COMPOSE_DE_EXEMPLO`) e `› no compose de verdade,
  nenhum serviço fica com a imagem do ambiente 0 e dois ambientes não dividem etiqueta`.
- A trava nova, no molde de `tools/ci/ambiente.test.ts`: `parse(lerArquivo('infra/compose.yml'))`, com `raizRepositorio` de `tools/ci/executar.ts`
  e um `lerArquivo` local, como o de `tools/ci/ambiente.test.ts:11`; as linhas `FROM … AS` por regex sobre o texto do Dockerfile.
- Isolado: `npx vitest run --project unidade tools/ci/dockerfile.test.ts tools/ci/ambiente-de-teste.test.ts`; e
  `npx vitest run --project integracao tools/ci/compose.int.test.ts` (precisa de Docker).
- À mão antes do commit, por alvo: `docker build -f infra/docker/servico.Dockerfile --target worker -t educa-worker:local .`;
  depois `docker compose --env-file .env.example -f infra/compose.yml up --detach --build --wait`.
- A medida: `docker compose --env-file .env.example -f infra/compose.yml build --no-cache`, depois
  `docker image ls --format '{{.Repository}}:{{.Tag}} {{.Size}}' 'educa-*'`. O commit pai vai num `git worktree` em
  `.processo/`, em sequência (as etiquetas `:local` colidem).
- Armadilhas: sem `merge: true`, `api-2` e os workers (`<<: *api`) perdem o `image`; a `web` não declara `image:`; teste
  de unidade não chama `docker`; o `npm ci --workspace` precisa dos manifestos de todos os workspaces copiados antes.

## Fora do escopo desta tarefa

Profiles e e2e sem observabilidade (91.0, X6), imagem de produção da web (R28), aviso de prazo dos jobs (89.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| 90.2 (`imagensDosServicos` por `yaml`) vai no commit da tarefa, e não num commit antes | Um commit de código com `(tarefa 90.0)` já precisa de portão, de rodada dos revisores e de carimbo; duas rodadas para um troca de 20 linhas cujo teste é o de hoje. A medida "antes" continua no commit pai (`94aca7d`), que é o `HEAD` de onde a tarefa parte | `tasks/prd-reengenharia/onda-5.md` RF29, item "Antes" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

Uma mutação não é bloco: restaurar `infra/docker/web.Dockerfile` (teste `infra/docker/ só tem o servico.Dockerfile`), porque o
formato não cria arquivo. Ela foi provada à mão (arquivo criado, teste vermelho, arquivo apagado). O `docker build` de cada
alvo e o `up --build --wait` não têm bloco: a esteira os prova.

```mutacao
arquivo: tools/ci/compose.ts
teste: tools/ci/ambiente-de-teste.test.ts › a imagem de cada serviço sai com a âncora resolvida
-  const { services } = parse(conteudoCompose, { merge: true }) as { services: Record<string, { image?: string }> }
+  const { services } = parse(conteudoCompose) as { services: Record<string, { image?: string }> }
```

```mutacao
arquivo: tools/ci/compose.ts
teste: tools/ci/ambiente-de-teste.test.ts › imagem entre aspas, com comentário
   for (const [nome, servico] of Object.entries(services)) {
-    if (servico.image !== undefined) imagens.set(nome, servico.image)
+    imagens.set(nome, servico.image as string)
```

```mutacao
arquivo: infra/compose.yml
teste: tools/ci/dockerfile.test.ts › todo serviço do compose que constrói imagem usa
     image: educa-worker:local
     build:
       context: ..
-      dockerfile: infra/docker/servico.Dockerfile
+      dockerfile: infra/docker/api.Dockerfile
       target: worker
```

```mutacao
arquivo: infra/compose.yml
teste: tools/ci/dockerfile.test.ts › todo target citado pelo compose existe
       dockerfile: infra/docker/servico.Dockerfile
-      target: worker
+      target: workr
```

```mutacao
arquivo: infra/compose.yml
teste: tools/ci/dockerfile.test.ts › todo target citado pelo compose existe
       dockerfile: infra/docker/servico.Dockerfile
-      target: realtime
+      target: despachante
```

```mutacao
arquivo: infra/compose.yml
teste: tools/ci/dockerfile.test.ts › todo target citado pelo compose existe
       dockerfile: infra/docker/servico.Dockerfile
-      target: web
+      target: api
```

```mutacao
arquivo: infra/compose.yml
teste: tools/ci/compose.int.test.ts › aponta para um Dockerfile que existe
     build:
       context: ..
-      dockerfile: infra/docker/servico.Dockerfile
+      dockerfile: infra/docker/inexistente.Dockerfile
       target: api
     command: [node, dist/ops/migrar.js]
```

```mutacao
arquivo: infra/compose.yml
teste: tools/ci/compose.int.test.ts › aponta para um Dockerfile que existe
       dockerfile: infra/docker/servico.Dockerfile
-      target: api
+      target: workr
     command: [node, dist/ops/migrar.js]
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › todo alvo final roda como
 COPY --from=construcao-worker /repo/apps/worker/dist apps/worker/dist
-USER node
 WORKDIR /repo/apps/worker
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › todo alvo final roda como
 WORKDIR /repo/apps/despachante
-CMD ["node", "dist/main.js"]
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › todo alvo final roda como
 FROM node:22.23.2-alpine3.23 AS producao
-ENV NODE_ENV=production
 WORKDIR /repo
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › cada alvo de produção instala só o pacote dele
 FROM producao AS worker
-RUN npm ci --omit=dev --ignore-scripts --workspace @educa/worker && npm cache clean --force
+RUN npm ci --omit=dev --ignore-scripts --workspace @educa/api && npm cache clean --force
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › cada alvo de produção instala só o pacote dele
 FROM producao AS api
-RUN npm ci --omit=dev --ignore-scripts --workspace @educa/api && npm cache clean --force
+RUN npm ci --ignore-scripts --workspace @educa/api && npm cache clean --force
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › o que a imagem tinha antes continua
 USER node
 WORKDIR /repo/apps/api
-EXPOSE 3000
 CMD ["node", "dist/main.js"]
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › o que a imagem tinha antes continua
 USER node
 WORKDIR /repo/apps/realtime
-EXPOSE 3000
 CMD ["node", "dist/main.js"]
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › o que a imagem tinha antes continua
 WORKDIR /repo/apps/web
-EXPOSE 4173
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › o que a imagem tinha antes continua
 # As migrations, para o serviço `migrar` (mesma imagem, outro comando).
-COPY packages/nucleo/drizzle packages/nucleo/drizzle
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › o que a imagem tinha antes continua
-ARG VITE_COM_GALERIA=
 RUN VITE_COM_GALERIA=$VITE_COM_GALERIA npm run build -w @educa/web
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › a web não parte do
-FROM node:22.23.2-alpine3.23 AS web
+FROM base AS web
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › a web não parte do
-RUN VITE_COM_GALERIA=$VITE_COM_GALERIA npm run build -w @educa/web
+RUN npm run build -w @educa/nucleo && VITE_COM_GALERIA=$VITE_COM_GALERIA npm run build -w @educa/web
```

```mutacao
arquivo: .dockerignore
teste: tools/ci/dockerfile.test.ts › o contexto de build fica fora
 tasks
-mockups
 .processo
```

```mutacao
arquivo: .dockerignore
teste: tools/ci/dockerfile.test.ts › o contexto de build fica fora
 mockups
-.processo
 .reengenharia
```

```mutacao
arquivo: .dockerignore
teste: tools/ci/dockerfile.test.ts › o contexto de build fica fora
 .processo
-.reengenharia
 e2e
```

```mutacao
arquivo: tools/guardas/guardas.test.ts
teste: tools/guardas/guardas.test.ts › nada fora de mockups/ aponta para o protótipo
-  const CITAM_O_PROTOTIPO = ['eslint.config.mjs', 'vitest.config.ts', 'tools/guardas/guardas.test.ts', '.dockerignore', 'tools/ci/dockerfile.test.ts']
+  const CITAM_O_PROTOTIPO = ['eslint.config.mjs', 'vitest.config.ts', 'tools/guardas/guardas.test.ts', 'tools/ci/dockerfile.test.ts']
```

```mutacao
arquivo: tools/guardas/guardas.test.ts
teste: tools/guardas/guardas.test.ts › nada fora de mockups/ aponta para o protótipo
-  const CITAM_O_PROTOTIPO = ['eslint.config.mjs', 'vitest.config.ts', 'tools/guardas/guardas.test.ts', '.dockerignore', 'tools/ci/dockerfile.test.ts']
+  const CITAM_O_PROTOTIPO = ['eslint.config.mjs', 'vitest.config.ts', 'tools/guardas/guardas.test.ts', '.dockerignore']
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › todo alvo final roda como
 COPY --from=construcao-worker /repo/apps/worker/dist apps/worker/dist
 USER node
-WORKDIR /repo/apps/worker
+WORKDIR /repo/apps/api
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › todo alvo final roda como
 WORKDIR /repo/apps/api
 EXPOSE 3000
-CMD ["node", "dist/main.js"]
+CMD ["node", "dist/server.js"]
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › todo alvo final roda como
 EXPOSE 4173
-CMD ["../../node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "4173", "--strictPort"]
+CMD ["../../node_modules/.bin/vite", "preview", "--host", "0.0.0.0", "--port", "4174", "--strictPort"]
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › todo estágio que não herda
-FROM node:22.23.2-alpine3.23 AS base
+FROM node:22.23.1-alpine3.23 AS base
```

```mutacao
arquivo: infra/docker/servico.Dockerfile
teste: tools/ci/dockerfile.test.ts › todo estágio que não herda
-FROM node:22.23.2-alpine3.23 AS producao
+FROM node:22.23.1-alpine3.23 AS producao
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | `tools/ci/compose.ts:261`: `parse(...)` devolve `null` com texto vazio ou sem `services`, e a desestruturação quebra com `TypeError`; vale um erro explícito | `TODO.md` (linha nova, no commit da tarefa). Erro novo é comportamento novo e pede teste e mutação próprios; hoje todo chamador passa um compose de verdade |
| revisor-geral (1ª) | `.reengenharia/RISCOS.md:26`: o risco S14 aponta para `infra/docker/web.Dockerfile:1`, que não existe mais; o novo lugar é o estágio `web` de `servico.Dockerfile` | Aplicada no commit da tarefa: a referência do S14 em `.reengenharia/RISCOS.md:26` agora aponta para o estágio `web` de `servico.Dockerfile` (a R28 não tem tarefa na X5, então não havia onde esperar) |
| infra-guardian (1ª) | O tempo do `build --no-cache` caiu de 80 s para 78 s, dentro do ruído; o ganho real continua sem medida | `TODO.md`: a tarefa de `fetch-retries` e cache do npm, já escrita lá |
| revisor-geral (2ª) | `tools/ci/compose.int.test.ts:51`: `construidos` ainda é lista de tuplas `[string, Build]`, destoa do objeto de `dockerfile.test.ts` | Recusada: teste de integração local, mesma leitura; trocar caducaria os revisores de teste por estilo, e o próprio revisor diz "Não bloqueia" |
| test-engineer (2ª) | As mutações de `WORKDIR` e `CMD` atacam um alvo cada (`worker`, `api`, `web`); e `compose.int.test.ts:57-58`, o `?? ''` ficou redundante depois do `toBeDefined` | Recusada: o laço por alvo cobre os outros (o revisor: "não falta prova"); o `?? ''` é só ruído de tipo ("ou deixar como está") |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-22 23:50:21 | 2026-10-22 23:51:26 | `revisor-geral` | 1 | APROVADO | a2bdef8c090222c6c |
| 2026-10-22 23:50:17 | 2026-10-22 23:52:02 | `infra-guardian` | 1 | APROVADO | a4b35f5bc5859506b |
| 2026-10-22 23:50:19 | 2026-10-22 23:52:52 | `test-engineer` | 1 | APROVADO | ac1e54f4d15a5a71b |
| 2026-10-23 00:01:57 | 2026-10-23 00:02:31 | `revisor-geral` | 2 | APROVADO | a99c77c613918a229 |
| 2026-10-23 00:01:49 | 2026-10-23 00:02:35 | `test-engineer` | 2 | APROVADO | af373ea93862a3563 |
