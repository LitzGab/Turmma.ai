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

- [x] 9.1 — `ALVOS_DO_EXPURGO_DE_ACESSO` ganha `convite_operador`, `sessao_operador` e
  `acesso_operacao`, cada um com o seu `APAGAR_LOTE`: convite 30 dias após usar, revogar ou vencer;
  sessão 30 dias após encerrar ou, sem encerramento, após `expira_em`; acesso 6 meses
- [x] 9.2 — Justificativa do `@SemEscopo` de `apagarLoteVencido` reescrita para cobrir as tabelas da
  equipe, que não têm escola
- [x] 9.3 — O teste de arquitetura do C45 confere que a entrada do expurgo na lista de quem pode
  tocar as tabelas da operação corresponde ao arquivo real
- [x] 9.4 — `docs/runbook.md`: com o Redis fora, o operador não entra (o desafio recusa com 503), e o
  caminho enquanto ele não volta é `ops:*`
- [x] 9.5 — Testes

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

- [x] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--infra`, porque toca o `docs/runbook.md` e o job)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Divergências resolvidas nesta tarefa

- **O teste de arquitetura mora em `apps/api/test/arquitetura.test.ts`**, e não em `apps/api/test/operacao/`, que não
  existe: é onde o C45 está desde a 3.0. A lista `QUEM_PODE_TOCAR_A_OPERACAO` ganhou o expurgo, com a conferência de
  que cada entrada é um arquivo que existe, de que o expurgo cita da operação só `acesso_operacao`, `sessao_operador` e
  `convite_operador` (nunca `operador`, `codigo_recuperacao_operador` nem `auditoria_operacao`), e de que o
  `ExpurgoDeAcessoRepository` continua com dois métodos `@SemEscopo`.
- **O job passou a percorrer `ALVOS_DO_EXPURGO_DE_ACESSO`** em vez de citar as três tabelas da escola uma a uma, e a
  linha `acesso.expurgado` ganhou `acessosDaOperacaoTotal`, `sessoesDeOperadorTotal` e `convitesDeOperadorTotal`, só
  contagens. A ordem é a das escolas e depois a da operação, e a conta continua por último.
- **Convite de operador pendente** tem um só por operador (único parcial): no teste, cada convite pendente (vencido há
  29 e 31 dias, e ainda válido) é de um operador desativado próprio.
- **Os operadores do teste têm o prefixo `expurgo-` no apelido**, e o `beforeAll` e o `afterEach` apagam todos os com
  esse prefixo e o que aponta para eles: um portão interrompido não deixa operador ativo para as outras suítes.
- **A linha do runbook virou uma entrada curta**, "Operador não entra no painel da operação (Redis de fila fora)", logo
  depois de "Rotina do sistema sem rodar", sem alerta próprio (a Tech Spec, seção 7c, não cria alerta novo).

## Fora do escopo desta tarefa

Apagar o dado pessoal do operador desativado (já é do `desativar`, 3.0); qualquer tabela de escola.

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-24 04:20:04 | 2026-09-24 04:21:19 | `test-engineer` | 1 | APROVADO | a1f5a2dcbb2bb205e |
| 2026-09-24 04:50:48 | 2026-09-24 04:51:11 | `test-engineer` | 2 | APROVADO | a9931c8c721cf1169 |
| 2026-09-24 04:51:29 | 2026-09-24 04:51:56 | `tenancy-guardian` | 1 | APROVADO | a543634c00c75f962 |
| 2026-09-24 04:51:31 | 2026-09-24 04:51:57 | `infra-guardian` | 1 | APROVADO | ae719119fba725c71 |
| 2026-09-24 04:51:27 | 2026-09-24 04:51:58 | `privacy-guardian` | 1 | APROVADO | a4d46111ee55c3692 |
| 2026-09-24 04:51:25 | 2026-09-24 04:52:04 | `revisor-geral` | 1 | APROVADO | ac7425bcda58200f8 |
