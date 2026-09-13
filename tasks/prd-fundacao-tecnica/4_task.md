# Tarefa 4.0 — Identidade sintética e contexto de escola

**Funcionalidade:** fundacao-tecnica · **Depende de:** 2.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `test-engineer`

## Objetivo

A API passa a saber de qual escola e de qual usuário vem cada requisição, a partir de um
token assinado, nunca de um parâmetro do cliente. No F0 o token é sintético, e ele não
pode existir em produção.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `techspec.md`: seção 4 ("Token do F0") e seção 6 (isolamento)
- `.claude/rules/10-multitenancy.md`, itens 3 e 6: escopo vem do token, e "não encontrado"
  é igual a "sem permissão"
- `.claude/rules/20-lgpd-menores.md`: o token não carrega nome
- `ROADMAP.md`, F1: o login real vem depois; aqui só a verificação e um emissor de teste
- Código existente: `packages/nucleo/src/contexto/contexto.ts` (2.0)

## Subtarefas

- [x] 4.1 — `packages/nucleo/src/identidade`: verificação de JWT
  - assinatura com a chave do ambiente
  - claims `sub` e `esc` (UUIDs); `exp` é obrigatório
  - emissor aceito `sintetico`
  - preenche `escolaId` e `usuarioId` no contexto
  - token inválido, expirado ou sem `esc` → 401 tipado
- [x] 4.2 — Configuração validada no boot: a API não sobe com `AMBIENTE=producao` e
  `ACEITAR_TOKEN_SINTETICO=true`, e com a flag desligada recusa o emissor `sintetico`
- [x] 4.3 — `npm run ops:token-sintetico -- --escola <uuid> [--usuario <uuid>] [--validade 1h]`
- [x] 4.4 — `GET /v1/sistema/contexto` devolvendo `{ escolaId, usuarioId }` por DTO zod em
  `packages/shared`
- [x] 4.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/identidade/verificar-token.ts`, `guarda-autenticacao.ts` | novo |
| `packages/nucleo/src/config/validar-config.ts` | novo |
| `apps/api/src/ops/token-sintetico.ts` | novo |
| `apps/api/src/sistema/contexto.controller.ts` | novo |
| `packages/shared/src/sistema/contexto.ts` | novo |
| `.env.example`, `package.json` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz: token de `ops:token-sintetico` em `/contexto` devolve a escola e o usuário do token | integração | a identidade chega ao contexto |
| a API não sobe com `AMBIENTE=producao` e a flag ligada | unidade | a trava de produção existe |
| com a flag desligada, um token sintético válido dá 401 | integração | a flag é respeitada |
| borda: assinatura errada, token expirado ou sem `esc` dão 401 com o mesmo código | integração | não há token meio válido |
| isolamento: token da escola A com `x-escola-id` ou `?escolaId=` apontando para B devolve A | integração | quebra se o escopo for lido do cliente |

## Critério de conclusão

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] `npm run typecheck` limpo
- [x] E2E verde (se tocou tela)
- [x] Vetos aprovados (se aplicáveis)
- [x] Revisão aprovada
- [x] Commit feito, só com os arquivos desta tarefa

## Fora do escopo desta tarefa

Login, senha, MFA, papel e entidade `Escola` (F1). Rate limit (6.0). Realtime autenticado
(5.0 usa este guard).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit da tarefa fica bloqueado enquanto um revisor obrigatório não tiver rodada iniciada
depois da última alteração de código, com APROVADO quando o revisor tem veto.

> Rodadas reconstruídas em 13/09/2026 a partir dos registros locais das sessões (o transcript de
> cada revisor), antes de o hook existir. Horário de Brasília.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-13 05:47:58 | 2026-09-13 05:49:57 | `tenancy-guardian` | 1 | APROVADO | a0cbbba2c2d8d7d89 |
| 2026-09-13 05:48:21 | 2026-09-13 05:50:11 | `test-engineer` | 1 | APROVADO | a92bbc693fa99f2fc |
| 2026-09-13 05:48:09 | 2026-09-13 05:50:42 | `privacy-guardian` | 1 | APROVADO | a818804e71fba6813 |
