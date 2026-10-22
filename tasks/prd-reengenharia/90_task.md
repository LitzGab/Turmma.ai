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

- [ ] 90.1 — Medida antes, no commit pai: `build --no-cache` de tudo (tempo) e `docker image ls` (tamanho por imagem)
- [ ] 90.2 — Num commit antes: `imagensDosServicos` lê por `parse(texto, { merge: true })` de `yaml`, no lugar da regex; os testes de hoje ficam
- [ ] 90.3 — `servico.Dockerfile`: `base` (manifestos, `npm ci --ignore-scripts`, build de `shared` e `nucleo`); `construcao-<app>` e o alvo `<app>` para `api`, `despachante`, `realtime` e `worker`; `web` com as instruções de hoje, sem o `base` (não constrói o `nucleo`)
- [ ] 90.4 — Os seis `build:` do compose passam a `dockerfile: infra/docker/servico.Dockerfile` e `target:`; os cinco arquivos antigos saem; `.dockerignore` ganha `mockups`, `.processo` e `.reengenharia`
- [ ] 90.5 — `tools/ci/dockerfile.test.ts`: a trava
- [ ] 90.6 — Medida depois, no commit da tarefa; a tabela antes/depois em `tasks/prd-reengenharia/medidas-da-onda-5.md` (bruto em `.processo/reengenharia/medidas/`)
- [ ] 90.7 — Testes: os da tabela

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
- A trava nova, no molde de `tools/ci/ambiente.test.ts`: `parse(lerArquivo('infra/compose.yml'))` com `lerArquivo` e
  `raizRepositorio` de `executar.ts`; as linhas `FROM … AS` por regex sobre o texto do Dockerfile.
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

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

