# Tarefa 2.0 — Lista de nomes da turma: prévia, gravação, avulso, retirada e leitura auditada

**Funcionalidade:** apresentacao-escola · **Depende de:** 1.0 · **Paralelo com:** 3.0, 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A coordenação envia a lista de nomes e matrículas da turma, vê linha a linha o que entra, o que já existe e o que
tem erro, e grava só a lista limpa; acrescenta nome avulso, retira nome livre e lê a lista com auditoria.

## Contexto necessário

- `docs/visao-produto.md`; `docs/lgpd.md`, "Lista de nomes da turma" (já escrita: o código bate com ela)
- `techspec.md` seções 3 (`lista_nome`), 4 (as rotas da lista), 6, 7 (auditoria; "Nome livre sai de fato") e 11
  (regra 00)
- `cenarios.md`: E2, E3 a E7, C8, C9, A1, A2, I3, P1, I9
- Regras 10, 20 (itens 1, 4, 9, 10), 40, 60 (item 6), 80 (itens 3, 7, 8)
- Código:
  - A rota e o mapeamento de FK da 1.0
  - `packages/nucleo/src/db/schema/` (o padrão das FKs compostas com a escola e do `uuidv7()`) e
    `packages/nucleo/drizzle/0015_convite_pendente_unico.sql` (um único parcial escrito à mão)
  - `packages/nucleo/src/db/schema/credencial-matricula.ts` — a matrícula de aluno aprovado, sempre com a escola do
    contexto (E5); `apps/api/test/arquitetura.test.ts` diz quem pode importar o quê
  - `apps/api/src/estrutura/turma.service.ts` — o `turma.alunos_lidos` com finalidade, modelo do `turma.lista_lida`

## Subtarefas

- [ ] 2.1 — Migration 0019 e schema: FKs compostas (turma; `usuario_id` sem ação; `criado_por` com `set null
  (criado_por)`), o check `aprovado ⇔ usuario_id ⇔ nome e matrícula nulos`, a matrícula única por escola e ano
  com `trim`, e o índice `(escola_id, ano_letivo_id, turma_id, estado)`
- [ ] 2.2 — Leitor do texto (unidade): separadores, cabeçalho, aspas, BOM, linha em branco, `trim`; 200 linhas e
  64 KB, acima disso `ENTRADA_INVALIDA`
- [ ] 2.3 — Prévia (`entra`, `ja_existe`, `erro` com código por linha) e gravação (só sem erro, `on conflict do
  nothing`, `lista.gravada` com ids e contagens). Turma excluída no meio: `NAO_ENCONTRADO` (C9)
- [ ] 2.4 — Nome avulso (`ENTRADA_INVALIDA` ou `CONFLITO`, nada gravado; também grava `lista.gravada`), retirada
  (`delete` condicional em `livre`, senão `CONFLITO`; `lista_nome.retirado`) e `GET turmas/:id/lista`
  (`nominal_auditado`, com `turma.lista_lida` e a finalidade na transação da leitura)
- [ ] 2.5 — Contratos `.strict()` e células da `MATRIZ`
- [ ] 2.6 — Documentos: nota em `docs/infra.md` 3.5 (a lista roda na hora, sem fila, porque tem teto; seção 11,
  regra 00); `ListaNome` sai do bloco "Ainda não existe — F2" de `docs/modelo-de-dados.md` e vira a tabela real
- [ ] 2.7 — Testes; rotas em `escola-montada.int.test.ts` e `matriz.test.ts`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo`: `drizzle/0019_lista_nome.sql`, `schema/lista-nome.ts`, `auditoria/acoes.ts` | novo, alterado |
| `apps/api/src/estrutura/lista.*`, `leitor-da-lista.ts`; `packages/shared/src/estrutura/lista.ts` | novo |
| `apps/api/test/lista.int.test.ts`; `escola-montada.int.test.ts`, `matriz*.ts`, os dois `docs/` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| E3 | unidade | cada regra do leitor, e o limite de linhas e bytes |
| E4, E5 | integração | erro por linha e nada gravado; a matrícula de outra escola, ou só na `credencial_matricula` de B, entra em A |
| E6 (sem o aprovado) | integração | a mesma lista duas vezes não muda a contagem |
| E7 (sem retirar reivindicado ou aprovado) | integração | avulso e os quatro `CONFLITO`/`ENTRADA_INVALIDA`; retirar livre apaga |
| E2 (esta parte) | integração | turma com nome na lista: `CONFLITO` ao excluir |
| check da `lista_nome` | integração | `insert` aprovado com nome, ou sem `usuario_id`, falha com 23514 |
| A1, A2 (lista) | integração | `lista.gravada` (também no avulso) e `lista_nome.retirado` só com ids; `turma.lista_lida` a cada leitura |
| I3, P1, I9 (lista) | integração, unidade | escola B, professor e aluno, e as células |
| C8, C9 | integração, em paralelo | a mesma lista duas vezes com `Promise.all`; excluir a turma × gravar |
| log novo | integração | só ids: nada de nome, matrícula nem texto da lista (A4) |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O `ja_existe` do aprovado e retirar aprovado (8.0); retirar reivindicado (6.0); a tela e o windows-1252 (13.0); o
`encerrar` (10.0).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
