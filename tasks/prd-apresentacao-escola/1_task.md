# Tarefa 1.0 — Coordenação renomeia e exclui disciplina e turma

**Funcionalidade:** apresentacao-escola · **Depende de:** nenhuma · **Paralelo com:** 3.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação renomeia e exclui disciplina e turma pela API; excluir o que tem vínculo responde `CONFLITO` sem
apagar nada, e a turma vazia sai. Nasce também o arquivo transversal de testes da A1.

## Contexto necessário

- `docs/visao-produto.md`; `docs/fluxos.md`, fluxo 1
- `techspec.md` seções 3 (FKs) e 4 (a primeira linha), 6
- `cenarios.md`: E1, E2, I3, P1, I9
- Regras 10 (itens 3 a 6), 40, 60 (item 5)
- Código:
  - `apps/api/src/estrutura/turma.controller.ts`, `turma.service.ts`, `turma.repository.ts` — o padrão de rota,
    `@Permite`, `exigirAnoEmCurso` e `idDoCaminho` (`entrada.ts`: id fora do formato vira `NAO_ENCONTRADO`)
  - `apps/api/src/estrutura/disciplina.*` — hoje só `criar` e `porId`
  - `packages/shared/src/permissao/matriz.ts`, `matriz.expectativa.ts` e `matriz.test.ts` — a célula por
    recurso e ação, e o `ALCANCES_INDIVIDUAIS` que pega a rede
  - `packages/shared/src/estrutura/turma.ts`, `disciplina.ts` — os contratos
  - `apps/api/test/estrutura.int.test.ts` e `estrutura-isolamento.int.test.ts` — os testes do F1 que o E1 estende

## Subtarefas

- [ ] 1.1 — Células `disciplina.{renomear,excluir}` e `turma.{renomear,excluir}`: coordenador `unidade`, os
  outros `nunca`. Contrato `.strict()` do renomear em `packages/shared`
- [ ] 1.2 — Repository: `renomear` e `excluir` com a escola do contexto e, na turma, o ano em curso. O 23503 da FK
  (vínculo hoje; nome da lista, pedido e acesso nas tarefas seguintes) vira `CONFLITO`, e nada é apagado. O
  mapeamento fica num lugar só, porque 2.0, 4.0 e 6.0 dependem dele
- [ ] 1.3 — Rotas `PATCH` e `DELETE` de `disciplinas/:id` e `turmas/:id`
- [ ] 1.4 — Cria `apps/api/test/escola-montada.int.test.ts`, com as varreduras I3 (o recurso da escola B pedido pela
  A, corpo igual ao de um UUID aleatório), A1 (auditoria), A3 (sentinela na resposta) e A4 (log capturado), cada
  uma sobre uma lista de rotas que as tarefas seguintes estendem
- [ ] 1.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/estrutura/turma.*`, `disciplina.*` (controller, service, repository) | alterado |
| `packages/shared/src/estrutura/turma.ts`, `disciplina.ts` | alterado |
| `packages/shared/src/permissao/matriz.ts`, `matriz.expectativa.ts`, `matriz.test.ts` | alterado |
| `apps/api/test/estrutura.int.test.ts` | alterado |
| `apps/api/test/escola-montada.int.test.ts` | novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E1 | integração | ano, série, disciplina e turma pelas rotas que a tela da 13.0 usa; "5º ano" com o erro tipado da série |
| E2 (esta parte) | integração | renomear as duas; excluir disciplina com vínculo e turma com vínculo: `CONFLITO`, nada apagado; turma vazia sai |
| I3 (estas rotas) | integração | `PATCH` e `DELETE` com id da escola B: `NAO_ENCONTRADO`, corpo igual ao do UUID aleatório, B intacta |
| P1 (estas rotas) | integração | professor e aluno recebem 404 |
| I9 (estas células) | unidade | as quatro células com o alcance da seção 4; rede `nunca` |
| concorrência | — | não se aplica aqui: as corridas do excluir são o C9 (2.0) e o C11 (4.0), que dependem das tabelas novas |
| log novo | integração | se a tarefa escrever log, entra na lista do A4: só ids |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Turma com nome na lista (2.0), com acesso vigente, o `for update` da turma e a cascata do acesso revogado (4.0),
com pedido (6.0). Telas (13.0). Auditoria de renomear e excluir: o RF16 não pede.

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
