# Tarefa 10.0 — Virada de ano, eliminação e expurgo alcançam as tabelas novas

**Funcionalidade:** apresentacao-escola · **Depende de:** 8.0 · **Paralelo com:** 9.0, 11.0 a 16.0
**Subagentes obrigatórios:** `privacy-guardian`, `tenancy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Encerrar o ano revoga os acessos, fecha os pedidos pendentes sem decisão humana e apaga os nomes não aprovados; a
eliminação do aluno leva a linha da lista e os pedidos dele; o expurgo alcança o acesso da turma e o convite de
professor; e nenhuma reivindicação ou aprovação escapa do ano que está sendo encerrado.

## Contexto necessário

- `docs/lgpd.md`, as linhas da A1 (retenção de cada uma)
- `techspec.md` seções 3 (FKs `set null`), 5 (passos 4 e 6: o `for share` no ano) e 7 ("Virada de ano", "Nome
  livre sai de fato", "Eliminação", "Retenção")
- `cenarios.md`: V1, V3, V4, V5, C10
- Regras 20 (itens 15, 16), 40, 60 (item 5), 70 (item 2: encerrar não é recusar), 80 (item 7)
- Código:
  - `apps/api/src/estrutura/ano-letivo.service.ts` e `ano-letivo.repository.ts` — o `encerrar`
  - `TurmaRepository.travarAnoEmCurso` — o modelo do `for share` no ano
  - `apps/api/src/sessao/ciclo-de-vida.service.ts` e `ciclo-de-vida.repository.ts` — o `eliminar`
    (`apagarUsuario`, `apagarVinculos`)
  - `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts` (`AlvoDoExpurgoDeAcesso` e o `@SemEscopo`) e
    `apps/worker/src/processadores/expurgar-acesso.ts`
  - Testes: `apps/api/test/virada-do-ano.int.test.ts`, `ciclo-de-vida.int.test.ts`,
    `apps/worker/test/expurgo-de-acesso.int.test.ts`; `apps/api/test/gatilho-de-parada.ts`

## Subtarefas

- [ ] 10.1 — `encerrar`, na mesma transação: revoga os acessos do ano; os pendentes viram `encerrada`, sem hash,
  chave, `teve_matricula_errada` nem `decidida_por`; apaga os nomes livres e reivindicados; o recusado fica com
  `lista_nome_id` nulo
- [ ] 10.2 — `for share` no ano dentro da transação de `salas/reivindicar` (6.0) e de cada id do `decidir` (8.0)
- [ ] 10.3 — Eliminação do aluno: antes do usuário, na mesma transação, apaga a `lista_nome` dele e os pedidos que
  apontam para ela. Do professor: `criado_por` e `decidida_por` ficam nulos pela FK
- [ ] 10.4 — Expurgo: `acesso_turma` sai 30 dias depois de vencer ou ser revogado; o convite de professor entra no
  alvo do convite; o `@SemEscopo` reescrito com as tabelas novas; o lote com `order by`
- [ ] 10.5 — Declarar por escrito: a retenção de "vigência + 5 anos" do pedido decidido não tem expurgo na A1 —
  nota em `docs/lgpd.md` na linha do pedido e item no `TODO.md` (F3)
- [ ] 10.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/estrutura/ano-letivo.service.ts`, `ano-letivo.repository.ts` | alterado |
| `apps/api/src/sala/reivindicacao.repository.ts`, `decisao.repository.ts` | alterado |
| `apps/api/src/sessao/ciclo-de-vida.service.ts`, `ciclo-de-vida.repository.ts` | alterado |
| `packages/nucleo/src/retencao/expurgo-de-acesso.repository.ts`, `apps/worker/src/processadores/expurgar-acesso.ts` | alterado |
| `apps/api/test/virada-do-ano.int.test.ts`, `ciclo-de-vida.int.test.ts`, `apps/worker/test/expurgo-de-acesso.int.test.ts` | alterado |
| `docs/lgpd.md`, `TODO.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| V1 | integração | cada escrita do `encerrar`, com a anulação do `teve_matricula_errada` e o `set null` do recusado; depois, link e código `NAO_ENCONTRADO` e o pedido `nao_encontrada` |
| V3 | integração | pelos ids guardados antes, nada sobra; o marcador do nome não sobra em tabela nenhuma; falha no meio não apaga nada |
| V4 | integração | eliminar o professor não falha, as colunas ficam nulas, a auditoria guarda o id |
| V5 | integração, em paralelo | dia 29 fica, dia 31 sai; dois expurgos com `Promise.all` não falham nem apagam em dobro |
| C10 | integração, em paralelo | `encerrar` × reivindicar e `encerrar` × aprovar: nunca pendente com hash nem aluno aprovado no ano encerrado |
| log novo | integração | o expurgo loga só contagens por alvo; o `encerrar`, só ids |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O pedido do titular (acesso e portabilidade) cobrindo as tabelas novas: F3, já no `TODO.md`. O expurgo dos pedidos
decididos depois de 5 anos. O aluno do ano seguinte com a matrícula já em `credencial_matricula` (F2).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
