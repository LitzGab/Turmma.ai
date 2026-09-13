# Tarefa 6.0 — Rate limit por usuário e por escola, com seguro em memória

**Funcionalidade:** fundacao-tecnica · **Depende de:** 5.0
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `privacy-guardian`, `test-engineer`

## Objetivo

A API passa a limitar requisições por usuário e por escola, somando as duas instâncias.
400 alunos atrás do mesmo IP não são bloqueados, e a queda do Redis de cache não gera erro
nem requisição pendurada.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF8 e caso de borda "7h30, 400 alunos pelo IP do colégio"
- `techspec.md`: seção 5 ("Rate limit") e seção 7c (o que o usuário vê quando o Redis de
  cache cai)
- `.claude/rules/80-infra-e-carga.md`, item 1: nunca só por IP; `docs/infra.md`, seção 5.1
- `.claude/rules/10-multitenancy.md`: a chave de escola vem do contexto
- `.claude/rules/20-lgpd-menores.md`: IP só na chave de limite anônimo, com TTL curto
- Código existente: contexto e identidade (2.0 e 4.0), Caddy e duas APIs (5.0)

## Subtarefas

- [x] 6.1 — `packages/nucleo/src/limite`: guard global sobre `rate-limiter-flexible` no
  Redis de cache
  - chaves `rl:u:{usuario}` e `rl:e:{escola}`
  - `rl:ip:{ip}` só em rotas com o decorator `@RotaAnonima`
  - IP de `X-Forwarded-For` aceito só quando a conexão vem do Caddy
  - padrões do ambiente: 120/min por usuário, 30.000/min por escola, 3.000/min por IP
    anônimo; limites de escola lidos da configuração quando ela existir (9.0)
- [x] 6.2 — Cliente Redis da API com `enableOfflineQueue:false` e `commandTimeout` 100 ms.
  `insuranceLimiter` em memória com limite ÷ número de instâncias; estado
  `limite.seguro_ativo` exposto para a métrica da 12.0. Excesso responde 429
  `LIMITE_EXCEDIDO` com `Retry-After`
- [x] 6.3 — Testes. Nos testes de escola, use um limite configurado baixo, senão o teste não
  quebra

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/limite/guarda-limite.ts`, `rota-anonima.decorator.ts`, `chaves.ts` | novo |
| `packages/nucleo/src/redis/clientes.ts` | novo |
| `apps/api/src/main.ts`, `.env.example` | alterado |
| testes em `apps/api/test/limite.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: 400 usuários sintéticos da escola C pelo mesmo IP sem 429; um usuário acima do próprio limite recebe 429 com `Retry-After` e os outros seguem | integração (via Caddy) | quebra se a chave for por IP |
| concorrência: rajadas do mesmo usuário em paralelo nas duas APIs aceitam exatamente o limite | integração | quebra se o limite for em memória |
| borda: Redis de cache parado → seguro limita a limite ÷ instâncias, `seguro_ativo=1`, latência abaixo de 150 ms e nenhum 5xx | integração | quebra sem `enableOfflineQueue:false` ou sem timeout |
| borda: mesmo `sub` em duas escolas tem limite de usuário único e limite de escola separado | integração | as duas dimensões não se misturam |
| permissão: `X-Forwarded-For` forjado sem passar pelo Caddy é ignorado na rota anônima | integração | não confia em qualquer proxy |
| isolamento: limite de escola esgotado em A não gera 429 para B | integração | quebra se a chave de escola for global |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Proteção de força bruta por conta (escola + matrícula), que vem com o login (F1). Métrica e
alerta do seguro (12.0 e 13.0). Configuração de limite por escola no banco (9.0).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

> Rodadas reconstruídas em 13/09/2026 a partir dos registros locais das sessões (o transcript de
> cada revisor), antes de o hook existir. Horário de Brasília.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-13 07:46:17 | 2026-09-13 07:47:39 | `tenancy-guardian` | 1 | APROVADO | a9bdb9a8d4126bf81 |
| 2026-09-13 07:46:25 | 2026-09-13 07:48:26 | `privacy-guardian` | 1 | APROVADO | a7873b326c6544a47 |
| 2026-09-13 07:46:09 | 2026-09-13 07:49:54 | `infra-guardian` | 1 | APROVADO | a2fc731d633be0bdb |
| 2026-09-13 07:46:37 | 2026-09-13 07:50:45 | `test-engineer` | 1 | REPROVADO | ab94acacf4a005333 |
| 2026-09-13 07:53:35 | 2026-09-13 07:54:42 | `test-engineer` | 2 | APROVADO | ab94acacf4a005333 |
