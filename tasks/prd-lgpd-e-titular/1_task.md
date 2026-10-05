# Tarefa 1.0 — O ciclo de vida mora no nucleo, sem mudar comportamento

**Funcionalidade:** lgpd-e-titular · **Depende de:** nenhuma · **Paralelo com:** 7.0, 8.0, 9.0
**Subagentes obrigatórios:** `privacy-guardian`, `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O worker passa a alcançar o `CicloDeVidaService`: ele e os repositórios dele saem de `apps/api/src/sessao` para `packages/nucleo/src/ciclo-de-vida`, o `eliminar` aceita a transação de quem chama, e os dois `@SemEscopo` da conta global vão para a `ContaGlobalRepository`, que só o `sessao` e o ciclo de vida importam.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 2, 6 (tabela de consultas sem escopo) e 13
- `.claude/rules/10-multitenancy.md` item 9
- Código: `apps/api/src/sessao/ciclo-de-vida.service.ts` e `.repository.ts`, `resolucao-de-tenant.repository.ts` (`travarConta`, `limparContaSemUso`), `apps/api/test/arquitetura.test.ts` (exceção da `Conta`)
- `docs/modelo-de-dados.md`, regras transversais, item 1 (exceção da `Conta`)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 1.1 — Mover serviço e repositórios; a API importa do `@educa/nucleo` (subcaminho), sem export no barrel da `ContaGlobalRepository`
- [ ] 1.2 — `eliminar`/`desativar` aceitam `tx` opcional de quem chama; sem ela, abrem a própria transação como hoje
- [ ] 1.3 — Teste de arquitetura: a exceção da `Conta` aceita só `sessao` e `nucleo/ciclo-de-vida`, e lista quem importa a `ContaGlobalRepository`; `docs/modelo-de-dados.md` atualizado
- [ ] 1.4 — Testes: os de ciclo de vida e de fim de vínculo mudam só de lugar, sem mudar asserção

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/ciclo-de-vida/*` (serviço, repositórios, conta global) | novo (movido) |
| `apps/api/src/sessao/*` (importações) | alterado |
| `apps/api/test/arquitetura.test.ts` | alterado |
| `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| terceiro caminho importa a `ContaGlobalRepository` | unidade | o teste de arquitetura falha |
| barrel do `@educa/nucleo` | unidade | não exporta a `ContaGlobalRepository` |
| `eliminar` na transação de quem chama, que depois lança | integração | o usuário continua lá |
| testes do F1 e da A1 de ciclo de vida | integração | verdes sem mudar asserção |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Qualquer mudança de comportamento do ciclo de vida; rota de eliminação (14.0, 15.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
