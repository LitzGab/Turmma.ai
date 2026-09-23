# Tarefa 5.0 — O operador aceita o convite e cria a senha

**Funcionalidade:** apresentacao-operacao (A0) · **Depende de:** 4.0
**Subagentes obrigatórios:** `privacy-guardian`, `infra-guardian`, `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Quem recebeu o convite do `ops:operador` confere se ele vale e, aceitando, cria a senha e recebe o
desafio de etapa `configurar_mfa`. O segundo fator em si é da 7.0.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 4 (as duas rotas de convite), 5 ("Travas no banco": aceite; "Limite": grupos
  de `convite/consultar` e `convite/aceitar`; "Etapas") e 7
- `cenarios.md`: C7, C9–C11, C21, C32, C33, C39
- `.claude/rules/20-lgpd-menores.md` (itens 6, 8 e 9), `40-testes.md`, `80-infra-e-carga.md` (itens
  1 e 7)
- Código do F1, que faz o mesmo para a coordenação:
  - `apps/api/src/sessao/convite.controller.ts` e `convite.service.ts` — consultar e aceitar pelo
    token do `#`, com `update` condicional
  - `apps/api/src/sessao/desafio.ts` e `packages/nucleo/src/identidade/verificar-token.ts` — o
    desafio de 5 min; aqui nasce o `typ: desafio-operador+jwt`
  - `apps/api/src/sessao/senha/` — hash de senha e o semáforo do hash (rebaixamento por IP)
  - `packages/nucleo/src/limite/guarda-limite.ts` — `@LimiteQueRebaixa` e o limite anônimo `rl:ip`
  - `apps/api/test/convite.int.test.ts` — os casos do convite do coordenador, que servem de molde

## Subtarefas

- [ ] 5.1 — `POST /v1/operacao/convite/consultar` com `@EntradaDeOperacao`: diz se o convite vale;
  usado, vencido, revogado e inexistente respondem igual; limite anônimo `rl:ip` recusável
- [ ] 5.2 — `POST /v1/operacao/convite/aceitar` com `@EntradaDeOperacao`: senha com as regras do F1,
  `update ... set usado_em = now() where ... usado_em is null and revogado_em is null and expira_em >
  now()` junto de `desativado_em is null`; devolve desafio `configurar_mfa`; rebaixa por IP no
  semáforo do hash
- [ ] 5.3 — Desafio `desafio-operador+jwt` com `jti` (o consumo do `jti` é da 7.0) e
  `Cache-Control: no-store` nas respostas com desafio
- [ ] 5.4 — Contratos estritos em `packages/shared/src/operacao/convite.ts`
- [ ] 5.5 — Testes (tabela abaixo)

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/operacao/convite-operador.controller.ts`, `convite-operador.service.ts` | novo |
| `apps/api/src/operacao/desafio-de-operador.ts` | novo |
| `apps/api/src/operacao/operador.repository.ts` | alterado |
| `apps/api/src/operacao/operacao.module.ts` | alterado |
| `packages/nucleo/src/identidade/verificar-token.ts` | alterado |
| `packages/shared/src/operacao/convite.ts` | novo |
| `apps/api/test/convite-operador.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| C9 | integração | usado, vencido, revogado e inexistente: status e corpo iguais, em `consultar` e em `aceitar` |
| C7 (parte) | integração | depois de `ops:operador convite`, o link antigo responde igual a revogado |
| C11 | integração | operador desativado com convite pendente não aceita |
| C21 | integração | o desafio devolvido pelo `aceitar` não serve de bearer em nenhuma rota, de operação ou de escola |
| C32 (parte) | integração | `convite/consultar` acima do `rl:ip` responde 429 `LIMITE_EXCEDIDO` com `Retry-After` |
| C33 (parte) | integração | `convite/aceitar` acima do limite do IP não responde 429: rebaixa no semáforo do hash |
| C39 (parte) | integração | a resposta do `aceitar` tem `no-store`; o contrato recusa campo a mais na entrada e não deixa sair campo a mais |
| borda: vencido às 72 h | integração | com relógio controlado, o convite vale às 71h59 e responde igual a inexistente às 72h01 |
| permissão | integração | credencial de escola nunca produz desafio de operador pelo `aceitar` |
| concorrência: C10 | integração | dois `aceitar` com o mesmo token em `Promise.all`: uma senha gravada, o outro recusado com erro tipado |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Consumir o `jti` e configurar o segundo fator (7.0); o C13 é de lá
- Entrar por e-mail e senha (6.0)
- A tela do convite (11.0)
