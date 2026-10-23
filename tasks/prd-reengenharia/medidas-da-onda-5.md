# Medidas da onda 5

Só a máquina da linha de base (a da reengenharia, 22/10/2026). O bruto está em `.processo/reengenharia/medidas/`
(`build-antes.log`, `build-depois.log`, `tempo-*.txt`, `imagens-*.txt`, `up-depois.log`).

## 90.0 — Um Dockerfile com `target`

**Como:** `docker compose --project-name educa-medida --env-file .env.example -f infra/compose.yml build --no-cache`, uma vez
no commit pai (`94aca7d`, num `git worktree` em `.processo/pai-90`) e uma no commit da tarefa; depois
`docker image ls`. As duas corridas com o Docker 29.8.2, a máquina parada para o resto (só os ambientes de teste de pé).

| | Antes (cinco Dockerfiles) | Depois (`servico.Dockerfile`) |
|---|---|---|
| `build --no-cache` de tudo (6 serviços, 5 imagens) | 80 s | 78 s |
| `educa-api:local` (e `migrar`) | 547 MB | 547 MB |
| `educa-despachante:local` | 375 MB | 375 MB |
| `educa-realtime:local` | 361 MB | 361 MB |
| `educa-worker:local` | 376 MB | 376 MB |
| `web` | 1,03 GB | 1,03 GB |
| Linhas de Dockerfile | 172 (39 + 36 + 37 + 24 + 36) | 113 |
| `RUN npm ci` | 9 | 6 |

**Leitura:**
- O produto não mudou: as imagens têm o mesmo tamanho ao megabyte, e `docker inspect` dá o mesmo usuário (`node`),
  comando, porta, diretório de trabalho e `NODE_ENV` em `api`, `despachante`, `realtime` e `worker`, comparado com as de
  antes (`:teste-3`, construídas pelos Dockerfiles antigos). O compose de teste sobe saudável (`up --build --wait`, todos
  `Healthy`, `migrar` com saída 0).
- O ganho de tempo do `--no-cache` é de 2 s: dentro do ruído. O `base` (dependências e `shared` e `nucleo`) agora é um
  passo só no log (`#51 … base 11/15 RUN npm ci`, uma vez, no lugar de quatro `npm ci` completos mais o da web), mas os
  quatro Dockerfiles antigos já corriam em paralelo e a máquina tem 12 núcleos: o trabalho repetido ocupava núcleo que
  sobrava, não tempo de relógio. O que o `base` compartilhado deve mudar, e não foi medido aqui, é o **recomeço com cache** (mexer em
  `apps/<x>` refaz só `construcao-<x>` e o alvo dele) e a esteira, que tem menos núcleos que esta máquina.
- O ganho que se mede é de manutenção: de cinco arquivos quase iguais (36 a 39 linhas, só o nome do app mudava) para um,
  e de nove `RUN npm ci` para seis (o `base` roda uma vez; os quatro de produção instalam só o pacote do alvo). Cada
  `npm ci` a menos é uma ida a menos ao registro na esteira (`TODO.md`, `npm ci` das imagens sem nova tentativa).
- A `web` continua com 1,03 GB: leva as dependências de desenvolvimento e roda `vite preview`. Imagem de produção da web é
  a R28, fora desta tarefa.
