# Tarefa 8.0 — Professor ou coordenação decide os pedidos; o aluno aprovado vê a própria turma

**Funcionalidade:** apresentacao-escola · **Depende de:** 7.0 · **Paralelo com:** 11.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Professor com vínculo confirmado e coordenação leem os pedidos da turma e decidem os selecionados; só a aprovação
humana cria o aluno, com a matrícula da lista e a senha do pedido; o aprovado vê só a própria turma.

## Contexto necessário

- `docs/visao-produto.md`; `docs/fluxos.md`, fluxo 1; `docs/lgpd.md`, "Pedido de reivindicação"
- `techspec.md` seções 4 ("Uma resposta só"), 5 (passo 6), 6 e 7 (auditoria)
- `cenarios.md`: os ids da tabela abaixo
- Regras 10, 20 (itens 4, 5, 9, 10), 40, 60 (item 7), 70 (a decisão de identidade é humana), 80 (item 7)
- `TODO.md`: o vínculo de aluno com `decidido_em`
- Código:
  - `TurmaRepository.aberta` — o `exists` do vínculo confirmado; nunca `join` (duplica a linha, P3)
  - `apps/api/src/estrutura/turma.service.ts` — a finalidade conferida antes de procurar a turma
  - `credencial-matricula.repository.ts`, `vinculo.repository.ts`, `contador-de-tentativas.ts` (o contador de login
    que a aprovação zera); `apps/api/test/virada-do-ano.int.test.ts` (E19)

## Subtarefas

- [ ] 8.1 — `GET turmas/:id/reivindicacoes`: professor `turma_vinculada`; coordenação `nominal_auditado`, com
  `turma.reivindicacoes_lidas` na transação da leitura; o pedido traz nome, hora e `teveMatriculaErrada`
- [ ] 8.2 — `POST reivindicacoes/decidir`, até 40 ids, uma transação por id: `update` condicional (id, escola, ano em
  curso, pendente e, para o professor, o `exists`). Aprovada: usuário, credencial, vínculo `aluno` confirmado com
  `decidido_em`, a `lista_nome` aprovada sem nome e matrícula, o contador de login zerado. Recusada: o nome volta a
  `livre`. Nas duas, hash, chave e `teve_matricula_errada` saem. Sem linha, uma leitura com o mesmo alcance,
  **antes** do estado, separa `ja_decidida` de `nao_encontrada`. `reivindicacao.decidida` com `decidida_como`
- [ ] 8.3 — `GET minha-turma` (aluno, `proprio`): escola, turma e série, sem colegas. Passando de ~15 arquivos,
  sai como subtarefa separável, com I8 e P4
- [ ] 8.4 — A prévia da lista (2.0) marca `ja_existe` para a matrícula de aluno aprovado nesta turma
- [ ] 8.5 — Contratos `.strict()` e células; as rotas em `escola-montada.int.test.ts`, que fecha o A3 e o A4
- [ ] 8.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/sala/decisao.*`, `pedidos.controller.ts`, `minha-turma.*`; `packages/shared/src/sala/pedidos.ts`, `minha-turma.ts` | novo |
| `lista.repository.ts`, `acoes.ts`, `matriz*.ts` | alterado |
| `apps/api/test/decisao.int.test.ts`, `minha-turma.int.test.ts`; `escola-montada.int.test.ts` | novo, alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| I6 | integração | o lote misto: oito `nao_encontrada` iguais ao aleatório, um `decidida`; o da coordenação com B |
| I8, P4 | integração | cada aluno vê a sua; ano encerrado e `GET turmas/:id`: 404; aluno no `decidir`, professor e coordenação no `minha-turma`: 404 |
| P3, E12 (pedidos) | integração | sem vínculo confirmado, 404; coordenação sem finalidade, `ENTRADA_INVALIDA`; duas disciplinas, cada pedido uma vez |
| E18, E22 | integração | as escritas da aprovação; " 123 " de ponta a ponta; o login logo depois da aprovação |
| E19 | integração | depois do `encerrar`, o aprovado aparece nos alunos do ano encerrado |
| E20, E25, E27 | integração | três aprovados, recusa devolve o nome, 0 e 41 ids; nome do colega; turma sem professor decidida pela coordenação |
| E6, R2, E7 (aprovado) | integração | `ja_existe`; nome aprovado recusado; retirar aprovado: `CONFLITO` |
| E21, E30 (resto) | integração | chave e `teve_matricula_errada` nulos depois de aprovar e de recusar; a auditoria sem o campo |
| A1 a A4 | integração | `reivindicacao.decidida`; `turma.reivindicacoes_lidas` a cada leitura, o professor sem; sentinela e log (com IP) em todas as rotas da A1 |
| I3, I9 | integração, unidade | escola B nos pedidos e em `minha-turma`; células |
| C3 | integração, em paralelo | aprovar × recusar, professor × coordenação, o mesmo lote duas vezes: exatamente uma auditoria e um usuário |
| log novo | integração | só ids (A4) |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O `for share` no ano e o `encerrar` (10.0); as telas (12.0, 16.0); transferir ou desativar aluno (F2, F3).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
