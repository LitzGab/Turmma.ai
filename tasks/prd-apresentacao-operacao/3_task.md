# Tarefa 3.0 — O operador nasce por comando

**Funcionalidade:** apresentacao-operacao (A0) · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O operador Turmma passa a ser uma conta de verdade: `ops:operador` cria, desativa e reconvida, e todo
`ops:*` só roda com `OPERADOR` de um operador ativo. Ainda não há rota nem tela.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 3 (modelo), 5 ("Nascimento" e "Travas no banco", só o que é do comando), 6
  (critério das tabelas fora do modelo de tenant), 7 e 11
- `cenarios.md`: C1–C8, C45, U1
- `.claude/rules/10-multitenancy.md` (item 1 e o desvio declarado), `20-lgpd-menores.md` (itens 9, 10
  e 15), `40-testes.md`, `80-infra-e-carga.md` (item 7)
- `docs/lgpd.md`, linhas da conta, do convite e da auditoria da operação
- Código do F1:
  - `apps/api/src/ops/comando.ts` (`lerOperador`) e os cinco `ops:*` (`escola.ts`,
    `convite-coordenador.ts` com `criarArquivoDoToken`, `revogar-convite.ts`, `redefinir-mfa.ts`,
    `uso.ts`, que hoje nem lê `OPERADOR`)
  - `packages/nucleo/src/db/schema/` (`conta.ts`, `convite.ts`, `codigo-recuperacao.ts`,
    `auditoria.ts`), `packages/nucleo/src/db/banco.ts` e `npm run db:gerar`
  - `apps/api/test/arquitetura.test.ts` e `apps/api/src/ops/escola.repository.test.ts`, moldes do C45

## Subtarefas

- [ ] 3.1 — Schema e migration das seis tabelas da seção 3 (`Operador` com `mfaVersao`,
  `CodigoRecuperacaoOperador`, `ConviteOperador` com o único parcial de pendente, `SessaoOperador`,
  `AcessoOperacao`, `AuditoriaOperacao`), ids UUID do banco, sem `escolaId`
- [ ] 3.2 — `OperadorRepository` em `apps/api/src/operacao/`, único a tocar as seis tabelas (o
  expurgo entra na 9.0), com gravação da `AuditoriaOperacao`
- [ ] 3.3 — `ops:operador criar --apelido --nome --email --saida`: grava operador e convite de 72 h, token
  em arquivo 0600; sem operador ativo, bootstrap com o `OPERADOR` do ambiente, sob
  `pg_advisory_xact_lock`
- [ ] 3.4 — `ops:operador desativar --apelido`: mesmo lock; recusa a si mesmo e o último ativo; numa
  transação, apaga nome, e-mail, senha, segredo e códigos, revoga o convite e encerra as sessões
- [ ] 3.5 — `ops:operador convite --apelido --saida`: revoga o pendente e gera outro na mesma transação
- [ ] 3.6 — `comando.ts`: com operador ativo, os cinco `ops:*` e o `criar` exigem `OPERADOR` de operador
  ativo; script `ops:operador` no `package.json`
- [ ] 3.7 — Testes (tabela abaixo) e as linhas do mapa conferidas em `docs/lgpd.md`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/operador.ts` (as seis tabelas) | novo |
| `packages/nucleo/src/db/banco.ts` | alterado |
| `packages/nucleo/drizzle/0014_operador.sql` e `meta/` | novo |
| `apps/api/src/operacao/operador.repository.ts` | novo |
| `apps/api/src/ops/operador.ts` | novo |
| `apps/api/src/ops/comando.ts` e os cinco `ops:*` | alterado |
| `package.json` | alterado |
| `apps/api/src/ops/operador.test.ts`, `apps/api/test/ops-operador.int.test.ts` | novo |
| `apps/api/test/arquitetura.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| C1 bootstrap | integração | sem operador ativo, `criar` aceita o `OPERADOR` e grava autor `bootstrap` |
| C2, um caso por comando: `escola`, `convite-coordenador`, `revogar-convite`, `redefinir-mfa`, `uso`, `criar` | integração | com operador ativo, `OPERADOR` inexistente ou desativado é recusado em cada um; falta um e o teste dele fica vermelho |
| C4 | integração | `criar`, `desativar` e `convite` gravam a `AuditoriaOperacao` com autor e alvo certos |
| C5 | integração | apelido inexistente dá erro tipado; desativar a si e o último ativo é recusado |
| C6 | integração | depois de `desativar`, a linha tem só id, apelido e datas; códigos somem; convite revogado; sessões encerradas; falha injetada no meio não deixa estado parcial |
| C7 (parte) | integração | o único parcial impede dois convites pendentes; `convite` revoga o anterior |
| C8 | integração | o arquivo nasce com modo 0600 |
| C45 | arquitetura | só o repository toca as seis tabelas, por `import` e pelo nome físico em `sql\`\`` (fora schema, barrel e migrations) |
| U1 | unidade | `FORMATO_OPERADOR` no comando |
| concorrência: C3 | integração | dois `criar` de bootstrap em `Promise.all`: um cria, o outro é recusado |
| concorrência: C5 | integração | com exatamente dois ativos, A desativa B e B desativa A em `Promise.all`: um passa, e resta um ativo |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Rotas `/v1/operacao/*`, marcadores e `GuardaDeOperador` (4.0); a resposta `SESSAO_ENCERRADA` do C6 é
  provada na 4.0
- A resposta do link antigo no `convite/consultar` (C7, 5.0)
- O expurgo das tabelas (9.0) e qualquer tela
