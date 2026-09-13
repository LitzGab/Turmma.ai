# Tarefa 5.0 — Duas instâncias de API e realtime trocam sem derrubar requisição

**Funcionalidade:** fundacao-tecnica · **Depende de:** 4.0
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `privacy-guardian`, `test-engineer`

## Objetivo

O compose passa a subir duas APIs e dois realtimes atrás de um Caddy local. Reiniciar uma
instância no meio de uma rajada não gera 502, e uma mensagem de realtime chega ao cliente
em qualquer instância, sempre dentro da sala da própria escola.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md`: RF2, RF3 e caso de borda "instância de API trava durante a aula"
- `techspec.md`: seção 4 (`/prontidao`) e seção 5 ("Realtime" e "Instâncias e troca")
- `.claude/rules/80-infra-e-carga.md`, item 5: sessão e sala ao vivo não ficam em memória
- `.claude/rules/10-multitenancy.md`: sala escopada por escola
- `.claude/rules/20-lgpd-menores.md`, item 9: Caddy sem log de acesso no F0
- `docs/infra.md`, seção 3.4 (WebSocket com mais de um nó)
- Código existente: `infra/compose.yml` (1.0), guard de autenticação (4.0)

## Subtarefas

- [x] 5.1 — `infra/Caddyfile`: balanceia `api-1/api-2` e `realtime-1/realtime-2`, com
  `health_uri /prontidao` a cada 2 s, `lb_try_duration 5s`, `lb_policy cookie` no
  realtime e sem log de acesso
- [x] 5.2 — `/prontidao` responde 200 enquanto a instância não drena e não consulta nenhuma
  dependência. No SIGTERM, a instância passa `/prontidao` para 503, termina as requisições
  em até 10 s e sai (`enableShutdownHooks`)
- [x] 5.3 — `apps/realtime` (NestJS + socket.io):
  - `@socket.io/redis-streams-adapter` no Redis de fila, com `maxLen`
  - namespace `/sistema` autenticado pelo mesmo JWT
  - sala `escola:{esc}` definida pelo token, nunca pelo cliente
  - cliente com reconexão e espalhamento aleatório
- [x] 5.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `infra/Caddyfile` | novo |
| `infra/compose.yml` | alterado |
| `packages/nucleo/src/instancia/drenagem.ts` | novo |
| `apps/api/src/sistema/prontidao.controller.ts` | novo |
| `apps/realtime/src/main.ts`, `sistema.gateway.ts`, `adaptador-redis.ts` | novo |
| testes de integração em `apps/realtime/test/` e `infra/test/` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: `docker compose restart api-1` durante uma rajada contínua dá zero 502 e zero erro cru | integração (compose) | quebra sem fechamento gracioso (SIGKILL no lugar do restart); a espera da drenagem e o `health_uri` são provados pelo SIGTERM em api-2, pela drenagem in-process e pela API travada |
| clientes em `realtime-1` e `realtime-2` recebem a mesma emissão | integração | quebra sem o adaptador Redis |
| borda: handshake por polling mantém a instância pelo cookie | integração | quebra sem `lb_policy cookie` |
| borda: com o worker parado, a API segue respondendo | integração | a API não depende do worker (RF2) |
| borda: um realtime morre e o cliente reconecta na outra instância | integração | a queda de uma instância não derruba a sala |
| isolamento: emissão para a sala da escola A não chega a cliente da B em outra instância; cliente não entra na sala de outra escola pedindo por nome | integração | quebra se a sala não for escopada pelo token |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Rate limit (6.0). Worker e despachante com duas réplicas (7.0 e 9.0). Emissão da API para o
realtime, e sinais do modo sala (F10). HTTPS, acesso fechado e deploy (`notas-staging.md`).
