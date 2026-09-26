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

- [x] 1.1 — Células `disciplina.{renomear,excluir}` e `turma.{renomear,excluir}`: coordenador `unidade`, os
  outros `nunca`. Contrato `.strict()` do renomear em `packages/shared`
- [x] 1.2 — Repository: `renomear` e `excluir` com a escola do contexto e, na turma, o ano em curso. O 23503 da FK
  (vínculo hoje; nome da lista, pedido e acesso nas tarefas seguintes) vira `CONFLITO`, e nada é apagado. O
  mapeamento fica num lugar só, porque 2.0, 4.0 e 6.0 dependem dele
- [x] 1.3 — Rotas `PATCH` e `DELETE` de `disciplinas/:id` e `turmas/:id`
- [x] 1.4 — Cria `apps/api/test/escola-montada.int.test.ts`, com as varreduras I3 (o recurso da escola B pedido pela
  A, corpo igual ao de um UUID aleatório), A1 (auditoria), A3 (sentinela na resposta) e A4 (log capturado), cada
  uma sobre uma lista de rotas que as tarefas seguintes estendem
- [x] 1.5 — Testes

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

- [x] Subtarefas concluídas
- [x] Testes verdes, 100%
- [x] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [x] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Turma com nome na lista (2.0), com acesso vigente, o `for update` da turma e a cascata do acesso revogado (4.0),
com pedido (6.0). Telas (13.0). Auditoria de renomear e excluir: o RF16 não pede.

## Divergências resolvidas nesta tarefa

- **O mapeamento do 23503 mora em arquivo próprio**, `apps/api/src/estrutura/exclusao.ts` (`excluirSemReferencia`), que
  não estava em "Arquivos previstos": as duas exclusões desta tarefa e as das 2.0, 4.0 e 6.0 passam por ele. O
  `mapearErroPostgres` global continua com o 23503 como `ERRO_INTERNO`, porque numa gravação ele é defeito nosso. Anotado
  na `techspec.md`, seção 4. `packages/shared/src/index.ts` exporta os dois contratos novos.
- **O vínculo encerrado também segura a exclusão.** A FK não olha o estado, e o vínculo encerrado é o histórico da turma e
  da disciplina. Anotado na `techspec.md`, seção 4, com teste no E2.
- **A turma de outro ano não se renomeia nem se exclui** (`NAO_ENCONTRADO`), como toda escrita de turma. Anotado na
  `techspec.md`, seção 4, com teste no E2.
- **Na turma, a escola é a segunda camada.** O repository filtra por escola e pelo ano em curso do contexto, que é da
  escola: tirar só a escola não deixa o I3 vermelho, porque a turma de B nunca está no ano de A. O ano é provado pela turma
  do ano encerrado da mesma escola (E2); tirar os dois deixa o I3 vermelho. Anotado no I3 do `cenarios.md`, como já está
  no I5 e no I10.
- **P1 mora no arquivo transversal**, como varredura sobre a mesma `ROTAS_DA_A1` do I3: as tarefas 2.0 e 3.0 estendem a
  lista e ganham o P1 das rotas delas sem mudar o teste.
- **A1 nas rotas desta tarefa espera nenhum registro.** O RF16 não pede auditoria de renomear e excluir ("Fora do
  escopo"); a varredura compara a lista exata de ações que o sucesso grava, e as tarefas seguintes declaram as delas.
- **E1** já estava provado pelos testes do F1 em `estrutura.int.test.ts` (as mesmas rotas que a tela da 13.0 usa); os
  dois ganharam o identificador no nome.

## Mutações

Cada cláusula apagada, rodada e restaurada. Rodadas sobre `escola-montada.int.test.ts`, `estrutura.int.test.ts` e
`matriz.test.ts`.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|
| `disciplina.repository.ts:43` (escola no `update` do renomear) | I3 `PATCH /v1/disciplinas/:id` |
| `disciplina.repository.ts:57` (escola no `delete` do excluir) | I3 `DELETE /v1/disciplinas/:id` |
| `turma.repository.ts:66` (ano em curso no `update` do renomear) | E2 "a turma de um ano encerrado…" |
| `turma.repository.ts:66` (escola no `update` do renomear) | nenhum, sozinha: segunda camada (divergência acima) |
| `turma.repository.ts:80` (ano em curso no `delete`) | E2 "a turma de um ano encerrado…" |
| `turma.repository.ts:80` (escola no `delete`) | nenhum, sozinha: segunda camada; escola e ano juntos: I3 `DELETE /v1/turmas/:id` |
| `turma.repository.ts:67` (`returning` com as colunas, no lugar da linha inteira) | E2 renomear, I3, P1, A1, A3, A4 `PATCH /v1/turmas/:id` |
| `exclusao.ts:22` (23503 → `CONFLITO`) | E2 "excluir disciplina com vínculo…"; A3 e A4 dos dois `DELETE` |
| `disciplina.service.ts:29` (renomeada `undefined` → `NAO_ENCONTRADO`) | I3, A3 `PATCH /v1/disciplinas/:id`; A4 |
| `disciplina.service.ts:34` (nada apagado → `NAO_ENCONTRADO`) | I3, A3 `DELETE /v1/disciplinas/:id`; A4; E2 excluir e concorrência |
| `turma.service.ts:69` (renomeada `undefined` → `NAO_ENCONTRADO`) | I3, A3 `PATCH /v1/turmas/:id`; A4; E2 ano encerrado |
| `turma.service.ts:83` (nada apagado → `NAO_ENCONTRADO`) | I3, A3 `DELETE /v1/turmas/:id`; A4; E2 excluir, concorrência e ano encerrado |
| `disciplina.controller.ts:32` e `turma.controller.ts:56` (`@HttpCode(204)`) | I3, P1, A1, A3 do `DELETE`; A4; E2 |
| `disciplina.controller.ts:34` (`idDoCaminho` do `DELETE`) e `turma.controller.ts:50` (do `PATCH`) | I3 (id fora do formato) |
| `disciplina.controller.ts:24` (`@Permite('disciplina', 'renomear')` trocado por uma célula do professor) | P1 `PATCH /v1/disciplinas/:id` |
| `matriz.ts` (professor `turma.excluir` aberto) | I9; a comparação com a expectativa; P1 `DELETE /v1/turmas/:id` |
| `disciplina.ts` e `turma.ts` de `packages/shared` (`.strict()` do renomear) | E2 "renomear: nome vazio…"; A3 e A4 do `PATCH` |

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `test-engineer`, 1ª | As quatro: P1 com o professor dono, renomear sem conflito entre ano e entre escola, sem ano em curso, vínculo confirmado no E2 | Aplicadas antes da 2ª rodada |
| `revisor-geral`, 1ª | Comentário de `TurmaService` que contava "as duas rotas" | Aplicada |
| `revisor-geral`, 1ª | `renomear` da turma sem `travarAnoEmCurso()`, que o `criar` tem | Tarefa 4.0 (anotada na 4.5 do `4_task.md`), que põe o `for update` da turma no `excluir`: decidir lá uma política só de trava para as escritas em turma. Hoje renomear durante o encerramento só troca o nome da turma que está sendo encerrada, sem dano |
| `tenancy-guardian`, 1ª | `throw new Error('série da turma não encontrada')` sem código | Recusada: é o padrão do repositório para invariante que a FK composta torna inalcançável (`'turma não criada'`, `#lido` do `VinculoService`), e sai como `ERRO_INTERNO`, que é o certo se um dia acontecer. Erro tipado é para o que o cliente distingue (regra 00, item 9) |
| `tenancy-guardian`, 1ª | Sessão de rede na varredura P1 | Recusada nesta funcionalidade: a rede não tem usuário nem sessão (`PAPEIS_DE_USUARIO`; F14), então não há como pedir pela HTTP; o I9 prova a célula `nunca` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-26 10:53:24 | 2026-09-26 10:55:08 | `test-engineer` | 1 | APROVADO | a8dc5d0aa3f2984a1 |
| 2026-09-26 11:05:04 | 2026-09-26 11:05:58 | `test-engineer` | 2 | APROVADO | a294e6dafb799544a |
| 2026-09-26 11:06:11 | 2026-09-26 11:07:08 | `tenancy-guardian` | 1 | APROVADO | aedf9027029ea3566 |
| 2026-09-26 11:06:05 | 2026-09-26 11:07:19 | `revisor-geral` | 1 | APROVADO | aca845db38a06e9f2 |
| 2026-09-26 11:16:06 | 2026-09-26 11:16:21 | `revisor-geral` | 2 | APROVADO | a33fc9cc2618054e9 |
