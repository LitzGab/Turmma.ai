# Tarefa 14.0 — Semáforo de hash justo entre escolas

**Funcionalidade:** identidade-e-tenancy · **Depende de:** 4.0, 11.0
**Subagentes obrigatórios:** `infra-guardian`, `privacy-guardian`, `test-engineer`

## Objetivo

Às 7h30 o hash de senha não toma a CPU da API. O semáforo limita quantos hashes rodam ao mesmo
tempo e atende as escolas em rodízio, de modo que uma escola lotando o login não atrasa a
outra. Quem espera demais recebe 503 com `Retry-After`, e esse 503 não revela se o
identificador existe. Ao terminar, login por e-mail e por matrícula passam pelo semáforo, com
métricas e dois alertas com runbook.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF21 e o caso de borda "35 logins do mesmo IP"; métrica "p95 do login na rajada
  das 7h30"
- `techspec.md`:
  - seção 5, "Baldes do semáforo" (matrícula, e-mail e teste de taxa igual) e "Hash" (algoritmo, concorrência, capacidade, fila, inexistente);
  - seção 7c: métricas e os alertas `login-lento` e `login-hash-recusado`;
  - seção 12: custo do argon2 ⚠️;
  - seção 13: ataque distribuído ao balde "equipe".
- `docs/infra.md` seção 3.1: ~7 logins/s, hash de 100 a 250 ms, e o login não pode competir por
  CPU com o resto; seção 5.1
- `.claude/rules/80-infra-e-carga.md`, itens 1, 3 e 10: uma escola não degrada outra; caminho
  quente mede a si mesmo; alerta novo com parágrafo do runbook
- `.claude/rules/20-lgpd-menores.md`, item 6: resposta igual para quem existe e quem não existe,
  inclusive sob carga
- D27 no `CLAUDE.md`: deploy só fora do horário letivo
- Código existente:
  - `packages/nucleo/src/config/validar-config.ts`: validação de variável obrigatória no boot, que só aponta o nome;
  - `packages/nucleo/src/telemetria/metricas.ts`: `METRICAS` e `METRICAS_COM_ESCOLA` (hoje `escola_id` só em job);
  - `infra/grafana/alertas/`: formato das regras (`job-interativo-esperando.yaml`, `seguro-limite-ativo.yaml`, `taxa-5xx.yaml`);
  - `docs/runbook.md`: formato da entrada por alerta;
  - `tools/guardas/alerta-tem-runbook.ts`: a guarda que reprova alerta sem runbook;
  - `infra/scripts/ensaio-alertas.ts` e `infra/test/alertas.int.test.ts`: o ensaio;
  - `infra/compose.yml` e `.env.example`: onde entram `UV_THREADPOOL_SIZE` e `LOGIN_HASH_CONCORRENCIA`.
- O que as tarefas anteriores criam:
  - hash argon2id e hash fixo no login por e-mail (criados na 4.0);
  - login por matrícula com contexto de escola aberto pelo slug (criado na 11.0);
  - `ResolucaoDeTenantRepository` com escola por slug (criado na 2.0).

## Subtarefas

- [x] 14.1 — Semáforo com baldes.
  - **Variáveis:** `LOGIN_HASH_CONCORRENCIA` é obrigatória, sem padrão no código, e o boot recusa valor acima de `UV_THREADPOOL_SIZE − 8`, a folga para DNS e arquivo de `docs/infra.md` ("Threads e DNS"). `UV_THREADPOOL_SIZE` já é explícito no compose de cada processo Node (16) desde a correção da borda.
  - **Algoritmo:** `@node-rs/argon2`, argon2id, p=1, com m=19456 e t=2 como piso (OWASP). O `t` final sai da 16.0.
  - **Baldes:** um por escola (matrícula, pelo slug, exista a matrícula ou não), um de slug inexistente e um "equipe" (todo login por e-mail, exista a conta ou não). Dentro da "equipe", o atendimento roda por IP.
  - **Ordem:** o semáforo atende os baldes em rodízio. A resolução de balde acontece antes do semáforo e não depende de a credencial existir.
- [x] 14.2 — Espera e métricas.
  - **Espera:** quem espera mais de 2 s sai com 503 `INDISPONIVEL_TENTE_DE_NOVO` e `Retry-After` aleatório entre 2 e 6 s. O hash fixo do inexistente também passa pelo semáforo.
  - **Métricas:** `login.duracao{metodo}`, `login.hash_espera{escola_id}` e `login.hash_recusado`. `METRICAS_COM_ESCOLA` passa a admitir `escola_id` só nas três métricas de login da Tech Spec 7c, e o teste de cardinalidade existente é ajustado para essa lista fechada.
- [x] 14.3 — Alertas e runbook.
  - **`login-lento`:** p95 de `login.duracao` acima de 1 s por 3 min.
  - **`login-hash-recusado`:** 503 do semáforo acima de 1% dos logins por 3 min.
  - **Runbook:** cada alerta ganha entrada em `docs/runbook.md` (o que olhar: espera por balde, CPU da API, instâncias; o que fazer: subir instância, rever `LOGIN_HASH_CONCORRENCIA` e o custo do hash, conferir se é ataque ao balde "equipe").
  - **Ensaio:** `ensaio:alertas` passa a provocar os dois.
- [x] 14.4 — Testes (tabela abaixo).

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sessao/senha/semaforo-de-hash.ts`, `baldes-de-login.ts`, `hash-de-senha.ts` | novo |
| `apps/api/src/config.ts`, `.env.example`, `infra/compose.yml`, `infra/compose.carga.yml` | alterado |
| `packages/nucleo/src/telemetria/metricas.ts` | alterado |
| `infra/grafana/alertas/login-lento.yaml`, `login-hash-recusado.yaml` | novo |
| `docs/runbook.md`, `infra/scripts/ensaio-alertas.ts` | alterado |
| `apps/api/src/sessao/senha/semaforo-de-hash.test.ts`, `apps/api/test/semaforo-de-login.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| boot: `LOGIN_HASH_CONCORRENCIA` ausente, e acima de `UV_THREADPOOL_SIZE − 8`, derruba a subida apontando só o nome da variável | unidade | não há padrão escondido nem threadpool esgotada |
| rodízio: com 3.000 pedidos na fila do balde de A, um pedido de B é o próximo atendido depois do que está em andamento | unidade | uma escola não degrada outra |
| rodízio "equipe": 100 pedidos de um IP e 1 de outro IP no mesmo balde; o de outro IP é atendido antes de 100 do primeiro | unidade | ataque de um IP não toma o balde |
| borda: espera acima de 2 s responde 503 com `Retry-After` entre 2 e 6, e o pedido não chega ao hash | integração | fila com prazo, sem requisição pendurada |
| privacidade: sob saturação do balde de A, a taxa de 503 de matrícula existente e inexistente é a mesma dentro da margem declarada no teste; o mesmo para e-mail com e sem conta | integração | resposta sob carga não revela existência |
| borda: 35 alunos do mesmo IP em 1 min com `LOGIN_HASH_CONCORRENCIA` de teste baixa entram todos, com no máximo espera; nenhum 429 | integração | rajada da escola vira fila, não recusa |
| métrica: depois de logins de A e B, `login.hash_espera` tem uma série por escola e nenhum rótulo de usuário, matrícula ou IP | integração | regra 80, item 10, sem dado pessoal |
| alertas: `promtool`/regra provisionada com série sintética acima e abaixo de cada limiar; a guarda reprova alerta novo sem entrada no runbook | infra | alerta dispara e tem o que fazer |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] `npm run test:infra` verde (a tarefa mexe em alertas e compose, D52)
- [ ] E2E verde (se tocou tela)
- [ ] Todos os revisores obrigatórios com rodada na seção "Revisões", iniciada depois da
  última alteração de código, e APROVADO nos que têm veto
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Rebaixamento por IP×escola, limite por IP na rota de e-mail e seus alertas: 15.0
- Calibração do custo do argon2 e do valor de `LOGIN_HASH_CONCORRENCIA` no cenário: 16.0
- "Entrando…" na web repetindo o 503: 18.0

## Notas da implementação

Leituras que tomei onde a tarefa deixava margem, escolhendo a que protege o aluno e a escola:

- **A vez no semáforo vem antes de a tentativa ser contada.** A ordem da 4.0 era reservar no contador, ler a
  credencial e fazer o hash. Se o semáforo ficasse só em volta do hash, o 503 de quem esperou demais já teria contado
  como senha errada, e a web, que repete o login no 503 por até 30 s, seguraria a conta do próprio aluno com
  `CONTA_SEGURADA` no meio da rajada das 7h30. Por isso a vez envolve reservar, ler a credencial e o hash, e é devolvida
  logo depois do hash (a conclusão do login, com a gravação da sessão, fica fora). O teste de borda da integração prova:
  seis 503 seguidos e o aluno entra na sétima.
- **Rodízio pela vez mais antiga, contando a vez sem fila.** "B é a próxima atendida depois do que está em andamento"
  só vale se o balde com o hash em andamento for para o fim da roda, mesmo tendo pegado a vez sem esperar. O semáforo
  guarda em que vez cada balde (e cada IP, na equipe) foi atendido e dá a vez ao que foi atendido há mais tempo. Quem
  entra na roda sem vez anterior entra logo antes da vez atual: na frente de quem acabou de ser atendido, atrás de quem
  já esperava. Assim, num ataque ao balde da equipe com um IP novo a cada pedido, os IPs novos não passam na frente da
  professora que já tinha entrado antes (teste de unidade com o controle negativo conferido).
- **`login.hash_espera{escola_id}`** leva a escola do endereço (matrícula), `equipe` (todo login por e-mail) ou
  `desconhecida` (endereço que não existe). Nunca IP: o IP da subfila da equipe fica só na memória do semáforo.
  `METRICAS_COM_ESCOLA` passou a ter as quatro de job e a espera pelo hash; `login.falhas` e
  `login.prioridade_rebaixada` entram na lista quando nascerem, na 15.3 (a lista não ganha nome de métrica que ainda
  não existe, porque o teste do painel exige painel para toda métrica do catálogo).
- **`UV_THREADPOOL_SIZE` também é obrigatória na configuração da API**, sem padrão: o teto só pode ser conferido contra
  as threads que o processo tem de fato. Sem ela, o padrão do Node (4) não deixaria thread nenhuma para o hash.
- **`LOGIN_HASH_CONCORRENCIA=2` no `.env.example`**, a conta de capacidade da Tech Spec (dois hashes por instância de
  1 CPU). O valor final sai do cenário da 16.0. O `infra/compose.carga.yml` não mudou: o cenário usa o valor do
  `.env.example`, e quem o fixa é a 16.0.
- **Testes que já existiam e fazem rajada de logins** (400 alunos na matrícula, 35 professores no e-mail) passaram a
  repetir no 503 como a web faz (`comoAWebNo503`): o 503 do semáforo é comportamento novo e esperado. O de 400 alunos
  sobe a API com `LOGIN_HASH_CONCORRENCIA=4`, as quatro threads do libuv do processo do vitest, a vazão que ele tinha
  antes do semáforo.
- **Teto de 10.000 pedidos esperando por instância:** acima dele o pedido sai com o mesmo 503 na hora. Com o prazo de
  2 s, só uma inundação muito acima da rajada das 7h30 chega lá; é o que impede a memória de crescer sem limite.
- **O ensaio provoca os dois alertas de login** recriando as APIs com um hash por vez e o argon2 com 32 iterações
  (`HASH_LENTO_DO_ENSAIO`, sobreposto na interpolação do compose, sem arquivo a mais) e mandando logins a um endereço
  que não existe, com matrícula nova a cada pedido. No fim, recria as APIs com o ambiente de sempre. Com o hash de
  sempre, saturar o semáforo pediria mais logins por segundo que o limite anônimo por IP deixa passar.
- **"Abaixo do limiar"** está no teste de integração dos alertas: logins sem fila, as duas expressões abaixo do limiar e
  as duas regras normais por quatro avaliações.
- **`hash-de-senha.ts` ficou em `apps/api/src/sessao/`**, onde a 4.0 o criou; a pasta `senha/` tem o semáforo, os
  baldes e a duração do login. Mover o hash só mudaria importações.
- **O aceite de convite também gera hash e não passa pelo semáforo:** só roda depois de o token de convite ser validado,
  e é raro. A tarefa pede o semáforo no login por e-mail e por matrícula.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina. Não a escreva à mão e não acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-18 15:43:40 | 2026-09-18 15:44:57 | `test-engineer` | 1 | REPROVADO | a01f7d0f4451a55e1 |
| 2026-09-18 16:14:38 | 2026-09-18 16:15:01 | `test-engineer` | 2 | APROVADO | a683f439a602e0d6f |
| 2026-09-18 16:41:15 | 2026-09-18 16:42:15 | `privacy-guardian` | 1 | APROVADO | a85de384f7530f638 |
| 2026-09-18 16:41:10 | 2026-09-18 16:42:27 | `infra-guardian` | 1 | APROVADO | acbc4c11869f28d3d |
| 2026-09-18 16:41:04 | 2026-09-18 16:42:49 | `revisor-geral` | 1 | APROVADO | a8d0b640953234244 |
