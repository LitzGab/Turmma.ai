# Validação — fundacao-tecnica (F0)

## Rodada 1 — 14/09/2026

**Escopo:** funcionalidade completa
**Commit validado:** `6cda14e54fa69f0d7796a380fd9946508ef1ea81`
**Veredito: APROVADA COM RESSALVAS**

Árvore limpa no início e no fim. Tudo abaixo foi executado nesta rodada, no commit validado, e não
tirado dos relatórios das tarefas.

### 1. RF a RF

| RF | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| RF1 | ATENDIDO | `compose.yaml:5`, `infra/compose.yml` (web, api-1/2, realtime-1/2, despachante-1/2, worker-interativo-1/2, worker-lote-1/2, postgres, redis-fila, redis-cache, storage, observabilidade, borda, migrar) | `tools/ci/compose.int.test.ts` ("sobe só com .env.example…", "`docker compose up` na raiz resolve…"), `tools/ci/ambiente.test.ts` ("toda variável do compose é obrigatória…"); job `e2e` da esteira sobe o compose completo num runner limpo | Nenhuma imagem exige conta. O e2e local (`npm run test:e2e`) subiu o compose inteiro com `--build --wait` e passou |
| RF2 | ATENDIDO | `apps/*/src/main.ts` separados; `packages/nucleo/src/limite/limitador.ts` (Redis de cache) | `infra/test/borda.int.test.ts` ("com worker, despachante, realtime, Redis e storage parados, a API segue respondendo pela borda", "`docker compose restart api-1` … zero 502"), `apps/api/test/limite.int.test.ts` ("o limite gasto numa instância vale na outra: o 21º pedido, na API 2, recebe 429", "rajada … nas duas APIs aceita exatamente o limite") | As três partes do critério têm teste próprio |
| RF3 | ATENDIDO | `apps/realtime/src/adaptador-redis.ts`, `sistema.gateway.ts` | `apps/realtime/test/sistema.int.test.ts` ("clientes da mesma escola em instâncias diferentes recebem a mesma emissão"), `infra/test/borda.int.test.ts` ("um realtime morre e os clientes reconectam na outra instância…") | Isolamento da sala por escola também testado |
| RF4 | ATENDIDO | `packages/nucleo/src/fila/filas.ts`, `apps/despachante/src/despachante.ts:131` (filas em ordem de prioridade), pools separados em `infra/compose.yml` (`FILAS`) | `apps/despachante/test/vagas.int.test.ts` ("caminho feliz: com 1.000 lotes na fila, um interativo novo começa antes de qualquer lote não iniciado"), `infra/test/jobs.int.test.ts` ("cada fila no seu pool…") | |
| RF5 | ATENDIDO | `packages/nucleo/src/fila/vaga.lua:71`, `vagas-por-escola.ts`, `configuracao_operacional_escola.vagas` | `vagas.int.test.ts` ("a escola A com 1.000 lotes nunca passa de 2 vagas em uso, com dois despachantes; um lote da B começa sem esperar", "borda: vagas nula usa o padrão; vagas.lote=5 vale só para aquela escola", "A sem vaga não atrasa B") | Prova de mutação abaixo |
| RF6 | ATENDIDO | `packages/nucleo/src/fila/janela-letiva.ts:51`, `apps/despachante/src/despachante.ts:160`, `.env.example:93-96` (seg–sex, 07:00–18:00) | `apps/despachante/test/janela.int.test.ts` ("não urgente criado numa terça às 10h fica aguardando … e sai às 18h00", "não urgente criado num sábado sai na hora", "a janela é lida da configuração da escola…"), `janela-letiva.test.ts` | |
| RF7 | ATENDIDO | `apps/worker/src/executor.ts:224` (chave = id do job), `packages/nucleo/src/fila/publicacao.ts:18` (5 tentativas, recuo exponencial), `efeito-sintetico.repository.ts:141` | `infra/test/jobs.int.test.ts` ("kill -9 no worker-interativo no meio do job…"), `apps/worker/test/execucao.int.test.ts` ("falha permanente: 5 tentativas com recuo e depois falhou, com a escola e o código tipado"), `apps/worker/test/reexecucao.int.test.ts` ("worker morto depois de gravar o efeito e antes de concluir…", "a fila perde o job ativo e a reconciliação o republica…") | As três partes do critério (retoma, falha tipada com escola, efeito não duplica) têm teste. Prova de mutação abaixo |
| RF8 | ATENDIDO | `packages/nucleo/src/limite/guarda-limite.ts`, `chaves.ts` (`rl:u`, `rl:e`, `rl:ip` só em `@RotaAnonima`) | `apps/api/test/limite.int.test.ts` ("caminho feliz: 400 usuários da escola C pelo mesmo IP não recebem 429; um acima do próprio limite recebe, com Retry-After, e os outros seguem"); cenário de carga desta rodada: 429 só no VU abusivo (361), zero nos 400 da C e nos 400 anônimos | |
| RF9 | ATENDIDO | `packages/nucleo/src/contexto/contexto.ts`, `apps/despachante/src/despachante.ts:318`, `apps/worker/src/executor.ts:173` | `infra/test/jobs.int.test.ts` ("o mesmo requisicaoId aparece no log da API, de um despachante e de um worker…"), `apps/worker/test/execucao.int.test.ts` ("o worker restaura escola e requisição do job…"), `apps/api/test/erro.int.test.ts` ("50 requisições das escolas A e B em paralelo…") | |
| RF10 | ATENDIDO | `packages/nucleo/src/erro/filtro-global.ts`, `mapear-erro-postgres.ts`, `packages/shared/src/erros/mensagens.ts` | `apps/api/test/erro.int.test.ts` ("exceção não tratada vira ERRO_INTERNO 500 com requisicaoId, sem stack, consulta nem valor", "violação de unicidade com \"Enzo Martins\" no detail vira CONFLITO 409, sem o valor na resposta nem no log") | |
| RF11 | ATENDIDO | `tools/guardas/index.mjs`, `regras-log.mjs`, `tools/ci/etapas-de-guarda.ts` | `tools/guardas/guardas.test.ts` (fixtures `log-dado-pessoal.ts`, `log-conteudo-montado.ts`, `sdk-de-ia.ts`, diretivas de desligar), `tools/guardas/gitleaks.int.test.ts` ("reprova a fixture de segredo falso…", "…commitado e apagado no commit seguinte"), `tools/ci/scripts.test.ts` ("ci:verificar sai vermelho quando \"npm audit --audit-level=high --omit=dev\" falha") | O `npm audit` é provado só por imitação do comando (ver menores) |
| RF12 | ATENDIDO | `.github/workflows/ci.yml` (push no `main`, jobs `verificar`, `integracao`, `infra`, `e2e`, sem segredo) | `tools/ci/esteira.test.ts`, `tools/ci/executar.test.ts` ("script de esteira com teste de fixture vermelho sai com código diferente de zero…"); histórico real: run 34798430932 (`7fdc61d`) vermelha, run 34874278659 (`6cda14e`) verde | O mecanismo atende. O uso não seguiu "todo commit" (ver maiores) |
| RF13 | ATENDIDO | `apps/web/src/paginas/Casca.tsx`, `componentes/estado/*`, `api/cliente.ts` (mensagem pelo código) | `e2e/casca.spec.ts` ("com dado…", "vazio…", "carregando…", "erro: a mensagem vem do catálogo pelo código … nenhum status HTTP na tela"), nos projetos `chromebook` e `celular` | 16 casos × 2 projetos = 32 passaram nesta rodada |
| RF14 | ATENDIDO | `.size-limit.json` (150 kB brotli), `e2e/__fixtures__/verificacoes.ts` (axe com `target-size`, largura) | `e2e/guardas.spec.ts` (fixtures de 361 px, botão de 16 px, violação serious), `tools/ci/tamanho-web.test.ts` ("bundle de fixture acima de 150 kB em brotli reprova"), `e2e/casca.spec.ts` ("teclado: o percurso inteiro só com Tab, Enter e espaço, com foco visível…"; toque com `tap()` no projeto `celular`) | Bundle medido: 89,67 kB |
| RF15 | ATENDIDO | `packages/nucleo/src/telemetria/metricas.ts`, `apps/despachante/src/metricas-espera.ts`, `infra/grafana/paineis/fundacao.json` | `infra/test/metricas.int.test.ts` ("caminho feliz: depois de jobs das escolas A e B, a espera do mais antigo tem uma série por escola e fila…", "o painel provisionado está no Grafana … respondem com as séries das escolas"), `infra/test/painel.test.ts` ("o que o RF15 pede está no painel…") | A separação A/B é provada com jobs das duas escolas no compose, e não depois do cenário de carga (ver menores) |
| RF16 | ATENDIDO | `infra/grafana/alertas/{job-interativo-esperando,seguro-limite-ativo,taxa-5xx}.yaml`, `docs/runbook.md:35,78,110`, `infra/scripts/ensaio-alertas.ts` | `infra/test/alertas.int.test.ts` ("caminho feliz: `ensaio:alertas` leva as três regras a disparadas…", "borda: espera curta não dispara…"), `tools/guardas/alerta-tem-runbook.test.ts` ("reprova: regra nova sem entrada no runbook") | |
| RF17 | ATENDIDO | `packages/nucleo/src/uso/*`, `apps/worker/src/processadores/consolidar-uso.ts`, `apps/api/src/ops/uso.ts` | `apps/api/test/ops-uso.int.test.ts` ("o dia é o do pedido; o mês soma requisições e jobs … e leva o pico de bytes"), `apps/worker/test/uso.int.test.ts` ("caminho feliz: N requisições e M jobs da escola A…", "borda: os bytes de escolas/{a}/ não somam escolas/{a}x/…") | |
| RF18 | ATENDIDO | `infra/k6/justica-entre-escolas.js`, `infra/scripts/carga.ts`, `infra/scripts/conferir-carga.ts`, `infra/compose.carga.yml` | Execução nesta rodada: `npm run carga` passou (base p95 da B 8 ms; carga p95 14 ms ≤ 508 ms; interativos da A máx. 10,9 s e da B máx. 51 ms em `job_registro`; 0 falhos; 429 só no abusivo). `npm run carga:controle-negativo` reprovou pela justiça (espera_b p95 2,63 s). `infra/test/carga.test.ts`, `infra/test/conferir-carga.int.test.ts` | Manual, fora da esteira, como declarado na 15.0 |

Provas de mutação (cada arquivo restaurado com `git checkout --`; árvore limpa conferida depois de cada uma):

| RF | Cláusula removida | Teste que ficou vermelho |
|---|---|---|
| Isolamento (seção 6 da Tech Spec) | `packages/nucleo/src/fila/job-registro.repository.ts:92`: `and(eq(id), eq(escolaId))` → `eq(id)` | `apps/api/test/jobs-sinteticos.int.test.ts` "a escola A consulta job da B e recebe 404…" (`expected 200 to be 404`) |
| RF5 | `packages/nucleo/src/fila/vaga.lua:71`: `elseif emUso < limite` → `elseif true` | `apps/despachante/test/vagas.int.test.ts` "a escola A com 1.000 lotes nunca passa de 2 vagas em uso…" (`expected 4 to be 2`) |
| RF7 (D49) | `apps/worker/src/executor.ts:224`: `chaveIdempotencia: jobId` → `randomUUID()` | `apps/worker/test/reexecucao.int.test.ts` "worker morto depois de gravar o efeito e antes de concluir…" |

### 2. Regras de negócio, casos de borda e critério de pronto

| Item | Situação | Evidência |
|---|---|---|
| Regra: ambiente local e esteira só com dado sintético | cumprida | tokens de `ops:token-sintetico`, escolas sintéticas nos testes; `apps/api/test/contexto.int.test.ts` ("um token sintético válido dá 401" com a flag desligada) |
| Regra: rate limit por usuário e escola; IP só em rota anônima | cumprida | `limite.int.test.ts` ("permissão: X-Forwarded-For forjado…", "turma com token vencido às 7h30…") |
| Regra: lote nunca atrasa interativo; uma escola não degrada outra | cumprida | RF4, RF5, RF18 |
| Regra: limite, horário letivo e teto são configuração | cumprida | `.env.example`, `configuracao_operacional_escola`, `.size-limit.json`; `vagas.int` e `janela.int` com configuração por escola |
| Regra: sem plataforma proprietária no caminho crítico | cumprida | BullMQ OSS, Lua próprio (não o BullMQ Pro), SeaweedFS pela API S3, OTLP |
| Regra: a esteira é o portão | cumprida no mecanismo, não no uso | ver maior 2 |
| Regra: alerta novo com entrada no runbook | cumprida | `alerta-tem-runbook.test.ts` |
| Regra: uso nasce marcado por escola (D30) | cumprida | RF17 |
| Regra: entrega pelo menos uma vez, com chave de idempotência (D49) | cumprida | RF7; `expurgo.int.test.ts` e `uso.int.test.ts` com reexecução |
| Regra: tela responsiva e usável no celular (D51) | cumprida | RF13, RF14 |
| Borda: 7h30, 400 alunos pelo IP do colégio | coberta | `limite.int.test.ts` caminho feliz; fase 3 da carga |
| Borda: 300 apostilas contra ferramenta de outra escola | coberta | `vagas.int.test.ts` caminho feliz; RF18 |
| Borda: worker reinicia no meio | coberta | `jobs.int.test.ts` (kill -9 e SIGTERM), `execucao.int.test.ts` |
| Borda: API trava na aula | coberta | `borda.int.test.ts` ("uma API trava durante a aula…") |
| Borda: restrição única com "Enzo Martins" no texto do banco | coberta | `erro.int.test.ts` |
| Borda: commit vermelho no `main` segura a próxima tarefa | sem teste nem mecanismo, e descumprida | ver maior 2 |
| Borda: feriado numa quarta | coberta | `janela-letiva.test.ts`, `janela-letiva.ts:5` |
| Borda: escola com aula aos sábados | coberta | `janela.int.test.ts` ("a janela da escola A (sábado letivo) não segura o job da B…") |
| Borda: outra máquina | coberta | `compose.int.test.ts`; job `e2e` da esteira em runner limpo |
| Pronto: compose sobe tudo em duas instâncias | cumprido | `infra/compose.yml`; e2e local e esteira |
| Pronto: esteira verde no último commit, com todas as guardas | cumprido | run 34874278659 em `6cda14e`: `verificar`, `integracao`, `infra` e `e2e` verdes |
| Pronto: e2e da casca em `chromebook` e `celular` | cumprido | 32 passaram; `tools/ci/playwright.test.ts` |
| Pronto: todo processador recebe chave e a reexecução não duplica (D49) | cumprido | `executor.ts:42,224`; mutação 3 |
| Pronto: RF1 a RF18 com teste que falharia sem a regra | cumprido | seção 1 e mutações |
| Pronto: cenário passa e controle negativo reprova | cumprido | executados nesta rodada |
| Pronto: três alertas disparam no ensaio e têm runbook | cumprido | `alertas.int.test.ts` verde nesta rodada |
| Pronto: todos os vetos aprovados | cumprido | seção 3 |
| Pronto: `ROADMAP.md` com o F0 `[x]` | faltando, por construção | é o passo de fechamento do `/validar` depois do aceite das ressalvas |

### 3. Portão

| Portão | Resultado |
|---|---|
| `npm run typecheck` | ✅ |
| `npm run lint` | ✅ (guardas sem violação) |
| `npm run test` | ✅ (69 arquivos, 839 testes) |
| `npm run test:e2e` | ✅ (32 passaram; bundle 89,67 kB de 150 kB) |
| `npm run test:infra` | ✅ (5 arquivos, 33 testes) |
| `npm run carga` / `carga:controle-negativo` | ✅ passou / ✅ reprovou pela justiça |
| Esteira do GitHub no commit validado | ✅ run 34874278659, `success` em `6cda14e` |
| Revisões com veto registradas e aprovadas | ✅ as 16 tarefas têm rodada de todo revisor obrigatório do `tasks.md`, com a última APROVADO |

### 4. Achados

**Críticos**
- Nenhum.

**Maiores**
1. `docs/infra.md:193-200`: a seção 5.3 ainda diz que "a Tech Spec do F0 decide entre a licença, um limitador
   próprio em Redis ou fila por escola … Não verificado". A decisão foi tomada e implementada (vaga por escola
   em `packages/nucleo/src/fila/vaga.lua`, despachante com rodízio, Tech Spec seção 5). Quem abrir o doc de infra
   no F1 lê o desenho como aberto. Correção: reescrever a 5.3 com o desenho implementado (job no Postgres,
   despachante, ZSET `vaga:{fila}:{escola}` em Lua, padrões 5/5/2, entrega pelo menos uma vez) e apontar para a
   Tech Spec do F0.
2. Processo, borda do PRD `prd.md:94` e D23/D31: a esteira ficou vermelha em `7fdc61d` (13.0, run 34798430932,
   `infra/test/metricas.int.test.ts:125` e `pool.ts:101`), e as tarefas 14.0, 15.0 e 16.0 foram executadas e
   commitadas sem a esteira voltar a verde; a correção `16199e5` e as três tarefas só passaram pela esteira no
   push de `6cda14e`. Os pushes também são agrupados: 7 execuções para 22 commits no `main`, então a maior parte
   dos commits de tarefa nunca teve execução própria. Nada no processo verifica isso:
   `.claude/skills/executar-task/SKILL.md` e `executar-tasks` não mencionam a esteira. Correção: no
   `/executar-tasks`, fazer o push depois de cada commit de tarefa e só iniciar a próxima com
   `gh run list --branch main --limit 1` verde no commit dela (ou parar e reportar), e registrar isso na regra 40
   ou na skill.

**Menores**
- `ROADMAP.md:46`: o bloco do F0 ainda cita MinIO; o storage é SeaweedFS (`infra/compose.yml:69`, Tech Spec seção
  12). Corrigir no mesmo commit que fecha o F0.
- `infra/compose.yml:201`: comentário "evitam publicar ou executar em dobro" contradiz a D49 (a execução pode
  repetir). Trocar por "evitam publicar em dobro; a execução é pelo menos uma vez".
- `tasks/prd-fundacao-tecnica/prd.md:120-128`: as quatro perguntas em aberto foram respondidas na Tech Spec
  (vaga em Lua, `grafana/otel-lgtm`, valores iniciais, seguro em memória) e continuam listadas como abertas.
  Marcar cada uma como fechada, com a seção da Tech Spec.
- `tasks/prd-fundacao-tecnica/techspec.md:4`: status "rascunho" com a funcionalidade implementada; o `/validar`
  troca no fechamento.
- `tasks/prd-fundacao-tecnica/tasks.md:44` e `7_task.md:1,9`: título "executado uma única vez" ficou com a
  promessa anterior à D49. Histórico, mas confunde quem ler a lista; acrescentar "(revista pela D49, 16.0)".
- RF11, `tools/ci/scripts.test.ts:75`: a guarda de dependência vulnerável é provada só com o `npm` trocado por
  imitação; nenhum caso roda `npm audit` real contra uma dependência vulnerável, e `--omit=dev` deixa
  dependência de desenvolvimento fora. Aceitável para o F0; considerar uma fixture com `package-lock` de
  dependência sabidamente vulnerável.
- RF15: o critério diz "depois do cenário de carga"; a prova é com jobs de A e B no compose de teste
  (`infra/test/metricas.int.test.ts`), e `infra/scripts/carga.ts` não confere o painel. O comportamento está
  provado; se o critério importar literalmente, a conferência da carga pode consultar `job_espera_mais_antiga_s`
  por escola no Prometheus do projeto `educa-carga`.
- `npm run test:e2e` (`tools/ci/e2e.ts`, `--manter-ambiente`) deixa o projeto `educa-teste` de pé; uma validação
  seguida de outro teste de integração herda o ambiente. Documentado no README, só registrar.
- `docs/runbook.md:198`: "Como avisar as escolas" está "a definir antes do piloto". Já tem destino no texto.

**Positivos**
- Toda regra com veto tem teste de controle negativo (a carga sem vaga por escola reprova, a guarda com fixture
  reprova), e as três mutações desta rodada ficaram vermelhas na primeira tentativa.
- O modo `efeito` do job sintético é um exemplo de referência executável da D49, com teste de reexecução
  sobreposta e de isolamento entre escolas.
- Os casos de borda do PRD viraram nomes de teste literais, o que tornou a rastreabilidade RF → teste direta.

### 5. Conclusão

Os 18 RF têm código e teste efetivo, os casos de borda de comportamento estão cobertos, o portão inteiro
(typecheck, lint, test, e2e, infra) e a esteira do GitHub estão verdes no commit validado, e o cenário de carga
passa com o controle negativo reprovando. Não há crítico. Ficam dois maiores que não bloqueiam o F1 no código,
mas bloqueiam o veredito limpo: o `docs/infra.md` descrevendo como aberto um desenho já implementado, e o
processo que deixou três tarefas serem feitas com a esteira vermelha e sem execução por commit.

Caminho até APROVADA: corrigir a seção 5.3 do `docs/infra.md` e colocar no `/executar-tasks` a espera da esteira
verde entre tarefas (ou aceitar as duas ressalvas por escrito neste arquivo, com quem aceitou e o motivo).

### 6. Pendências herdadas

| Pendência | Destino |
|---|---|
| Push por tarefa e esteira verde antes da próxima | `.claude/skills/executar-tasks/SKILL.md` antes da primeira tarefa do F1 |
| `docs/infra.md` 5.3 com o desenho implementado | correção antes de fechar o F0, ou `TODO.md` se a ressalva for aceita |
| `migrar` sem caminho fora da transação para `CREATE INDEX CONCURRENTLY` (Tech Spec seção 3) | `/criar-techspec` da primeira funcionalidade com índice em tabela que cresce com aluno em produção |
| FK de `escola_id` para `escola` (Tech Spec seção 11) | F1 (`identidade-e-tenancy`) |
| Troca do emissor de token sintético, mantendo a verificação | F1 |
| Idempotência de negócio de cada processador real, e reserva da chave antes de efeito pago | PRD e Tech Spec de cada funcionalidade com job (F4 em diante; F5 no gateway) |
| Achados da auditoria não decididos: renovação da vaga durante o recuo, devolução do ponto no limitador, despachante serial (`16_task.md`, fora do escopo) | `TODO.md` |
| Alerta no celular, check externo, custo do ambiente, "Sistema fora do ar" | `notas-staging.md`, quando o staging for criado (D31, D42) |
| Canal e texto para avisar as escolas (`docs/runbook.md:198`) | antes do piloto |
| Guarda de `npm audit` com fixture real | `TODO.md` |
