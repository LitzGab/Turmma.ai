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

- [ ] 15.1 — Processador de job sintético em sandbox (`useWorkerThreads`), queimando
  `cpuMs` de CPU sem travar o event loop. `infra/compose.carga.yml` fixa `cpus:` por serviço
  e `maxWorkerThreads` coerente, para o lote não roubar CPU do interativo e o resultado não
  depender da máquina
- [ ] 15.2 — `infra/k6/justica-entre-escolas.js`, rodando num container na mesma rede (todos
  os VUs saem de um IP). Tokens gerados por `ops:token-sintetico`. Fases:
  1. base: por 2 min, a escola B manda 2 interativos por segundo de 100 ms
  2. carga: a escola A manda 2.000 lotes urgentes de 2 s e 500 interativos em rajada, com a
     B repetindo a base
  3. 400 VUs da escola C chamam `contexto` uma vez por segundo, e 1 VU da C chama cinco vezes
     por segundo
  4. 400 VUs anônimos recarregam a casca a cada 30 s
- [ ] 15.3 — Thresholds do k6 derrubam o código de saída:
  - p95 de espera da B ≤ base + 500 ms
  - 429 só para o VU abusivo
  - zero 429 nos anônimos

  Ao final, um script confere em `job_registro` que nenhum job está `falhou` e nenhum
  interativo esperou mais de 30 s. `npm run carga` executa tudo.
- [ ] 15.4 — Controle negativo: `npm run carga:controle-negativo` sobe com
  `VAGAS_POR_ESCOLA_DESLIGADAS=true` e espera reprovação. A API e o despachante recusam subir
  com essa flag em `AMBIENTE=producao`
- [ ] 15.5 — Registrar o resultado da execução na conclusão da tarefa

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

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] `npm run typecheck` limpo
- [ ] E2E verde (se tocou tela)
- [ ] Vetos aprovados (se aplicáveis)
- [ ] Revisão aprovada
- [ ] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Cenário "manhã de segunda" completo, com login, tutor e prova (F16). Carga contra o staging
(`notas-staging.md`). Rodar carga na esteira a cada commit: o cenário é manual e roda de novo
quando uma tarefa mexe no caminho quente.
