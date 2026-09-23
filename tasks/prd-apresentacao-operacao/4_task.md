# Tarefa 4.0 — Marcadores e cercas da área do operador

**Funcionalidade:** apresentacao-operacao (A0) · **Depende de:** 3.0
**Subagentes obrigatórios:** `tenancy-guardian`, `infra-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Só sessão de operador alcança `/v1/operacao/*`, e credencial de operador não alcança rota de escola:
as duas respondem como rota inexistente. A primeira rota é `GET /v1/operacao/eu`.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 1, 4 (cookie e token), 5 ("Conferência da sessão" e "Limite", só a parte de
  `rl:op`) e 6 (isolamento, com os testes de arquitetura)
- `cenarios.md`: C6, C35, C36, C40–C42, C46–C49
- `.claude/rules/10-multitenancy.md` (itens 4, 6 e 9), `20-lgpd-menores.md` (itens 4, 6 e 9),
  `40-testes.md`, `80-infra-e-carga.md` (itens 1 e 5)
- Código do F1:
  - `packages/nucleo/src/identidade/`: `rota-sem-sessao.ts` (reconhece os marcadores),
    `verificar-token.ts` (nasce `verificarTokenDeOperador`, `typ: operador+jwt`),
    `guarda-autenticacao.ts` (bearer de operador em rota de escola → 404), `guarda-sessao.ts` e
    `../contexto/` (o operador leva só `operadorId`)
  - `packages/nucleo/src/limite/guarda-limite.ts` (entra `rl:op:{sub}`),
    `packages/nucleo/src/permissao/conferencia-das-permissoes.ts` com
    `apps/api/test/permissao-no-boot.test.ts`, `apps/api/src/app.module.ts` (ordem das guardas) e
    `apps/api/test/arquitetura.test.ts`

## Subtarefas

- [ ] 4.1 — `@RotaDeOperacao()` (`applyDecorators` com a `GuardaDeOperador`) e `@EntradaDeOperacao()`,
  ambos em `apps/api/src/operacao/`; `rotaSemSessao` e a conferência de permissões os reconhecem
- [ ] 4.2 — `verificarTokenDeOperador` e a emissão do acesso de 10 min, sem `esc`; bearer com `typ` de
  operador em rota de escola → 404 pelo mesmo filtro de rota inexistente
- [ ] 4.3 — `GuardaDeOperador`: credencial que não é de operador → 404; acesso vencido com sessão viva →
  401 `ACESSO_VENCIDO`; sessão terminada (30 min, 8 h, saída, desativado) → 401 `SESSAO_ENCERRADA`;
  banco fora → 503; contexto só com `operadorId`; `ultimoUsoEm` gravado no máximo uma vez por minuto
- [ ] 4.4 — `GuardaDeLimite` conta `rl:op:{sub}` nas rotas `@RotaDeOperacao`, com valor na
  configuração operacional; sem token de operador válido, não conta
- [ ] 4.5 — `GET /v1/operacao/eu` (apelido e nome), com contrato estrito em `packages/shared`
- [ ] 4.6 — Testes (tabela abaixo)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/operacao/marcadores.ts`, `guarda-de-operador.ts` | novo |
| `apps/api/src/operacao/eu.controller.ts`, `operacao.module.ts` | novo |
| `apps/api/src/app.module.ts` | alterado |
| `packages/nucleo/src/identidade/rota-sem-sessao.ts`, `verificar-token.ts`, `guarda-autenticacao.ts` | alterado |
| `packages/nucleo/src/limite/guarda-limite.ts` | alterado |
| `packages/nucleo/src/permissao/conferencia-das-permissoes.ts` | alterado |
| `packages/shared/src/operacao/eu.ts` | novo |
| `apps/api/test/operacao-isolamento.int.test.ts`, `apps/api/test/sessao-de-operador.ts` (fixture) | novo |
| `apps/api/test/arquitetura.test.ts` | alterado |

## Testes que provam a regra

A fixture de sessão de operador assina com a **mesma chave e o mesmo `typ`** do código real; a 7.0
repete o C47 com o cookie de verdade.

| Cenário | Tipo | O que prova |
|---|---|---|
| C40 | arquitetura | os marcadores só existem em `apps/api/src/operacao/`, em método e em classe |
| C41 | arquitetura | toda rota `@RotaDeOperacao` tem a guarda no handler resolvido |
| C42 | arquitetura | todo caminho `/v1/operacao` tem marcador, e todo marcador está sob `/v1/operacao` |
| C46 | isolamento | sessão de coordenador, professor e aluno em toda rota `/v1/operacao/*` com sessão (lista gerada das rotas registradas): igual a rota inexistente, em status e corpo |
| C47 | isolamento | token de operador em toda rota de escola com sessão: igual a rota inexistente |
| C48 | isolamento | tirar a guarda de um handler deixa C41 e C46 vermelhos |
| C49 | integração | repository de escola chamado numa rota de operador falha com erro |
| C6 (parte) | integração | depois de `ops:operador desativar`, a sessão aberta recebe `SESSAO_ENCERRADA` na requisição seguinte |
| C35 | integração | dois operadores atrás do mesmo IP: `rl:op` recusa um em `/eu`, e o outro continua |
| C36 (parte) | arquitetura | toda rota `@RotaDeOperacao` conta pelo `rl:op:{sub}` |
| borda: acesso vencido | integração | sessão viva com acesso de 10 min vencido → `ACESSO_VENCIDO`, não `SESSAO_ENCERRADA` |
| borda: banco fora | integração | Postgres parado na conferência → 503, nunca 401 nem 404 |
| concorrência: `ultimoUsoEm` | integração | 20 requisições em `Promise.all` na mesma sessão gravam `ultimoUsoEm` uma vez só no minuto |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- As rotas `@EntradaDeOperacao` (5.0 a 8.0); por isso C43, C44 e a parte de entrada de C36 e C46
  ficam para a 8.0, quando as sete existem
- Emitir sessão de verdade pelo login (7.0): aqui a sessão nasce pela fixture
