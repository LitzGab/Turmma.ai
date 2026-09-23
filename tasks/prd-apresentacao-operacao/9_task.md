# Tarefa 9.0 — Expurgo das tabelas da operação

**Funcionalidade:** apresentacao-operacao · **Depende de:** 3.0, 8.0 · **Paralelo com:** 10.0, 11.0
**Subagentes obrigatórios:** `privacy-guardian`, `tenancy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O `sistema.expurgar-acesso` passa a apagar, nos prazos da seção 7, o convite, a sessão e o registro
de acesso da operação, sem nunca tocar a auditoria da operação nem a conta do operador.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 3, 6 (critério das tabelas fora do modelo de tenant) e 7 (linha "Retenção")
- `cenarios.md`: C38 e C45
- `docs/lgpd.md` — linhas do operador (convite, sessão, acesso, auditoria da operação)
- `.claude/rules/10-multitenancy.md` (item 9), `20-lgpd-menores.md` (itens 15 e 16), `40-testes.md`
- Código do F1:
  - `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts` — `ALVOS_DO_EXPURGO_DE_ACESSO`,
    `APAGAR_LOTE` e `apagarLoteVencido`, com o `@SemEscopo` e a justificativa que precisa ser
    reescrita. O repository já tem dois métodos marcados; esta tarefa **não** cria um terceiro
  - `apps/worker/src/processadores/expurgar-acesso.ts` — o job que percorre os alvos
  - `apps/worker/test/expurgo-de-acesso.int.test.ts` — como os prazos são testados com relógio
    controlado
  - `docs/runbook.md` — seção "Rotina do sistema sem rodar", onde a linha nova entra perto

## Subtarefas

- [ ] 9.1 — `ALVOS_DO_EXPURGO_DE_ACESSO` ganha `convite_operador`, `sessao_operador` e
  `acesso_operacao`, cada um com o seu `APAGAR_LOTE`: convite 30 dias após usar, revogar ou vencer;
  sessão 30 dias após encerrar ou, sem encerramento, após `expira_em`; acesso 6 meses
- [ ] 9.2 — Justificativa do `@SemEscopo` de `apagarLoteVencido` reescrita para cobrir as tabelas da
  equipe, que não têm escola
- [ ] 9.3 — O teste de arquitetura do C45 confere que a entrada do expurgo na lista de quem pode
  tocar as tabelas da operação corresponde ao arquivo real
- [ ] 9.4 — `docs/runbook.md`: com o Redis fora, o operador não entra (o desafio recusa com 503), e o
  caminho enquanto ele não volta é `ops:*`
- [ ] 9.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts` | alterado |
| `apps/worker/src/processadores/expurgar-acesso.ts` | alterado, se o job listar os alvos |
| `apps/worker/test/expurgo-de-acesso.int.test.ts` | alterado |
| `apps/api/test/operacao/arquitetura.test.ts` | alterado |
| `docs/runbook.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| C38 — convite | integração | com relógio controlado, pelo `apagarLoteVencido`: convite usado, revogado e vencido com 29 dias fica, com 31 sai |
| C38 — sessão | integração | sessão encerrada e sessão só expirada: 29 dias fica, 31 sai |
| C38 — acesso | integração | `AcessoOperacao` com 6 meses menos um dia fica, mais um dia sai |
| C38 — o que nunca sai | integração | `AuditoriaOperacao` intacta em qualquer idade, e `Operador` (também o desativado) nunca apagado |
| C45 — expurgo | arquitetura | só o repository do operador e o expurgo tocam as seis tabelas, por `import` e pelo nome físico em SQL, e a entrada do expurgo aponta para o arquivo que existe |
| número de `@SemEscopo` | arquitetura | o `ExpurgoDeAcessoRepository` continua com dois métodos marcados |
| concorrência: dois expurgos em `Promise.all` | integração | cada linha vencida sai uma vez só, e a contagem somada bate com o que havia |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--infra`, porque toca o `docs/runbook.md` e o job)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Apagar o dado pessoal do operador desativado (já é do `desativar`, 3.0); qualquer tabela de escola.
