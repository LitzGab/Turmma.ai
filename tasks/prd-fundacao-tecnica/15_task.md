# Tarefa 15.0 — Cenário "justiça entre escolas" passa local

**Funcionalidade:** fundacao-tecnica · **Depende de:** 6.0, 9.0, 14.0
**Subagentes obrigatórios:** `infra-guardian`, `test-engineer`

## Objetivo

Um comando roda o cenário de carga versionado contra o compose local e decide sozinho se
passa. O cenário prova quatro coisas:
- uma escola barulhenta não atrasa o interativo de outra
- 400 usuários atrás de um IP não são bloqueados
- só quem abusa recebe 429
- nenhum job falha

Com a vaga por escola desligada, ele reprova.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF18 e RF8; `techspec.md`: seção 7c ("Cenário")
- `.claude/rules/80-infra-e-carga.md`, itens 3 e 11: uma escola não degrada outra, e teste de
  carga não chama provedor pago
- `docs/infra.md`, seções 3 e 10: o cenário completo "manhã de segunda" é F16; este é o
  mínimo
- Código existente: jobs sintéticos (7.0), filas e vagas (9.0), rate limit (6.0), casca e
  rotas anônimas (14.0), identidade sintética (4.0)

## Subtarefas

- [x] 15.1 — Processador de job sintético em sandbox (`useWorkerThreads`; feito com pool próprio de `worker_threads` e
  `WORKER_THREADS_MAXIMO`, ver techspec seção 12), queimando
  `cpuMs` de CPU sem travar o event loop. `infra/compose.carga.yml` fixa `cpus:` por serviço
  e `maxWorkerThreads` coerente, para o lote não roubar CPU do interativo e o resultado não
  depender da máquina
- [x] 15.2 — `infra/k6/justica-entre-escolas.js`, rodando num container na mesma rede (todos
  os VUs saem de um IP). Tokens gerados por `ops:token-sintetico`. Fases:
  1. base: por 2 min, a escola B manda 2 interativos por segundo de 100 ms
  2. carga: a escola A manda 2.000 lotes urgentes de 2 s e 500 interativos em rajada, com a
     B repetindo a base
  3. 400 VUs da escola C chamam `contexto` uma vez por segundo, e 1 VU da C chama cinco vezes
     por segundo
  4. 400 VUs anônimos recarregam a casca a cada 30 s
- [x] 15.3 — Thresholds do k6 derrubam o código de saída:
  - p95 de espera da B ≤ base + 500 ms
  - 429 só para o VU abusivo
  - zero 429 nos anônimos

  Ao final, um script confere em `job_registro` que nenhum job está `falhou` e nenhum
  interativo esperou mais de 30 s. `npm run carga` executa tudo.
- [x] 15.4 — Controle negativo: `npm run carga:controle-negativo` sobe com
  `VAGAS_POR_ESCOLA_DESLIGADAS=true` e espera reprovação. A API e o despachante recusam subir
  com essa flag em `AMBIENTE=producao` (feito: despachante e worker, que tomam a vaga, recusam;
  a API não toma vaga e não lê a flag)
- [x] 15.5 — Registrar o resultado da execução na conclusão da tarefa

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/worker/src/processadores/sintetico.sandbox.ts` | novo |
| `apps/worker/src/main.ts`, `apps/despachante/src/despachante.ts` | alterado |
| `infra/compose.carga.yml` | novo |
| `infra/k6/justica-entre-escolas.js`, `infra/scripts/conferir-carga.ts` | novo |
| `packages/nucleo/src/config/validar-config.ts`, `package.json` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: as quatro fases passam com os thresholds | carga | justiça entre escolas e rate limit sob carga |
| controle negativo: com a vaga por escola desligada, o cenário reprova | carga | quebra se a regra for removida, que é o critério de um teste de verdade |
| borda: 429 só para o VU abusivo; nenhum bloqueio dos 400 anônimos pelo mesmo IP | carga | limite por usuário e IP com teto de escola |
| borda: nenhum job `falhou` e nenhum interativo acima de 30 s, conferido em `job_registro` e não só no k6 | carga e integração | o banco confirma o que o k6 mediu |
| permissão: a flag de controle negativo não sobe em `AMBIENTE=producao` | unidade | a flag de teste não vira porta aberta |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela): não se aplica, a tarefa não toca tela
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Resultado da execução (15.5)

Em 14/09/2026, na máquina do Joaquim (12 núcleos, 30 GB), com `infra/compose.carga.yml` (worker
interativo com `cpus: 2.5` e 2 threads por réplica, worker de lote com `cpus: 1.5` e 1 thread) e k6 2.2.0.

**`npm run carga`: passou, saída 0** (início 15:33 UTC, 5 min com a subida do compose).

| Critério | Medido | Limite |
|---|---|---|
| p95 da espera da B na base (2 min, 240 jobs) | 7 ms | — |
| p95 da espera da B na carga | 9 ms (máxima 53 ms) | ≤ 507 ms |
| duração da B até `concluidoEm`, informativa | p95 169 ms, máxima 299 ms (na base, p95 110 ms) | sem threshold |
| jobs aceitos da A | 2.000 lotes e 500 interativos | todos |
| 429 por grupo | abusivo 361; C (400 usuários) 0; anônimos (400, mesmo IP) 0; A 0; B 0 | só o abusivo |
| respostas inesperadas por grupo | 0 em todos | 0 |
| interativos da A em `job_registro` | 500 concluídos, espera p95 10,3 s, máxima 10,8 s | < 30 s |
| interativos da B em `job_registro` | 482 concluídos, espera p95 9 ms, máxima 53 ms | < 30 s |
| jobs `falhou` | 0 | 0 |

**`npm run carga:controle-negativo`: saída 0, o cenário reprovou pela justiça** (início 15:38 UTC, 6 min).
Com `VAGAS_POR_ESCOLA_DESLIGADAS=true`, a base ficou em 7 ms e a carga cruzou só `espera_b`: p95 de
2,53 s contra o limite de 507 ms (máxima 6,79 s; duração p95 5,05 s). Os 429 continuaram só no
abusivo (361), e nenhum job falhou.

O que o resultado não cobre:
- "Nenhum job falhou" vale para os jobs que executaram até a conferência. Com 2 vagas de lote e jobs de
  2 s, dos 2.000 lotes da A só 139 concluíram e 2 estavam ativos; os outros 1.859 ainda esperavam
  quando o compose foi derrubado.
- A espera medida vai de `criado_em` a `iniciado_em`, e o worker marca `ativo` antes de o job pegar
  thread no sandbox. A espera por thread aparece só na duração, que fica no resumo sem threshold.
- Local não mede rede real nem máquina de escola (Tech Spec, seção 13).

A primeira execução reprovou por duas causas legítimas, corrigidas nesta tarefa:
- os 400 anônimos receberam 403 do `vite preview`, que recusa o nome de host `web`: o k6 passou a mandar
  o mesmo `Host` do navegador;
- os 500 interativos da A esperaram até 38,6 s, porque com a escola no teto o próximo job só saía na
  sondagem de 500 ms: o worker passou a avisar o despachante (`pg_notify`) quando libera a vaga, e a
  máxima caiu para 10,8 s.

Ajustes em relação ao texto da tarefa: o sandbox é um pool próprio de `worker_threads` com
`WORKER_THREADS_MAXIMO`, porque o BullMQ não tem `maxWorkerThreads` e o `useWorkerThreads` dele
levaria o executor inteiro para a thread (techspec, seção 12). A flag do controle negativo é lida e
recusada em produção por despachante e worker, que tomam a vaga; a API não toma vaga e não a lê. O
teste de borda do alerta de job interativo (`infra/test/alertas.int.test.ts`) passou a usar uma vaga
interativa na escola dele: com o job sintético queimando CPU de verdade, cinco jobs de 50 s
disputavam as threads e esticavam a espera além do `for:` da regra.

Recomendações dos revisores que ficam para a próxima tarefa que mexer na fila: contador de rodadas do
despachante e de avisos de vaga livre, e um intervalo mínimo entre rodadas acordadas por aviso.

## Fora do escopo desta tarefa

Cenário "manhã de segunda" completo, com login, tutor e prova (F16). Carga contra o staging
(`notas-staging.md`). Rodar carga na esteira a cada commit: o cenário é manual e roda de novo
quando uma tarefa mexe no caminho quente.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-14 11:53:05 | 2026-09-14 11:56:51 | `test-engineer` | 1 | APROVADO | a71364485a7b71519 |
| 2026-09-14 11:52:52 | 2026-09-14 11:58:08 | `infra-guardian` | 1 | APROVADO | a9fef97b901a0e6d4 |
| 2026-09-14 12:44:57 | 2026-09-14 12:47:01 | `infra-guardian` | 2 | APROVADO | a07bcabc43545105e |
| 2026-09-14 12:45:08 | 2026-09-14 12:47:56 | `test-engineer` | 2 | APROVADO | a8dfec11c088c6dbd |
