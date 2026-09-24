# Tarefa 5.0 — Leitura entre escolas: lista e uso

**Funcionalidade:** apresentacao-painel · **Depende de:** 3.0 · **Paralelo com:** 4.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

`GET /v1/operacao/escolas` e `GET /v1/operacao/uso` devolvem, por escola, estado, contagens e uso,
paginados e ordenáveis, sem nenhum dado de pessoa, a partir de um só repository com `@SemEscopo`.

## Contexto necessário

- `docs/visao-produto.md`
- `techspec.md` seções 4, 5 ("Leitura", "Falhas"), 6, 7 (DTO de saída) e 7c (índices)
- `cenarios.md`: I1, I4, I5, I6, L1–L4
- `.claude/rules/10-multitenancy.md` (itens 8 e 9), `20-lgpd-menores.md` (item 4), `40-testes.md`,
  `80-infra-e-carga.md` (item 8)
- Código:
  - `packages/nucleo/src/uso/uso.repository.ts` e `dia-de-uso.ts` — `doDia`, `doMes`, `diaAnterior`,
    `diaDeUso`, `limitesDoMes`: a mesma regra de soma e pico, agora para todas as escolas numa consulta
  - `apps/api/src/sessao/alunos-ativos.repository.ts` — a contagem de hoje, que só olha o usuário
  - `packages/nucleo/src/db/schema/vinculo.ts`, `turma.ts`, `ano-letivo.ts`, `usuario.ts`, `convite.ts`
  - `estadoDaCoordenacao` (2.0)
  - `apps/api/src/ops/escola.repository.test.ts` — o padrão de teste de `@SemEscopo` com justificativa

## Subtarefas

- [ ] 5.1 — `apps/api/src/operacao/painel.repository.ts`: `redes`, `escolas` e `uso`, cada um com
  `@SemEscopo` citando o painel; uma consulta por página, com subconsultas correlacionadas por
  `escola_id` no ano `em_curso` de cada escola: turmas; professores (`count(distinct)` de vínculo
  `professor` `confirmado` sem `encerrado_em`, de usuário ativo); alunos (o mesmo com vínculo `aluno` sem
  `encerrado_em`); `coordenadorAtivo` e o último convite de coordenação; uso do último dia fechado e do
  mês dele. Ordem por nome, ou por requisições do mês (decrescente, calculada antes de paginar), sempre
  com desempate por `id`; 25 por página e `total`. O `GET /redes` da 1.0 passa a ler daqui
- [ ] 5.2 — `painel.service.ts` calcula o estado pela `estadoDaCoordenacao` e monta o DTO estrito:
  lista `id, nome, slug, rede{id,nome}, estado, conviteId?, turmas, professores, alunos`; uso `id, nome,
  dia{…}, mes{…}` com as datas de referência
- [ ] 5.3 — `EXPLAIN (ANALYZE)` da lista com 30 escolas sintéticas, registrado numa seção "Plano da
  consulta" deste arquivo, mostrando que as subconsultas usam os índices de escopo
- [ ] 5.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/operacao/painel.repository.ts` e `painel.repository.test.ts` | novo |
| `apps/api/src/operacao/painel.service.ts`, `painel.controller.ts` | alterado |
| `packages/shared/src/operacao/painel.ts` | alterado |
| `apps/api/test/painel-leitura.int.test.ts` | novo |
| `apps/api/test/arquitetura.test.ts` | alterado (I1) |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| I1 | arquitetura | só `painel.service.ts` importa o `PainelRepository`, e os `@SemEscopo` dele são exatamente os três |
| I4 | integração | duas escolas com contagens diferentes: cada uma com a sua |
| I5 | integração | duas escolas com uso diferente: `/uso` e a lista em `ordem=uso` trazem cada uma o seu |
| I6 | integração | sentinelas de nome, e-mail, matrícula e turma não aparecem em nenhuma resposta das oito rotas, inclusive de erro |
| L1 | integração | as bordas: duas disciplinas contam uma; vínculo `pendente`/`contestado` não conta; aluno desativado não conta; professor `confirmado` com usuário desativado não conta; transferido e ano anterior não contam; sem ano em curso, zero; professor em duas escolas conta em cada uma |
| L2 | integração | pico × soma nos bytes; hoje fora; dia 1 e 1º de janeiro; relógio entre 22h e 23h59 de São Paulo |
| L3 | integração | 30 escolas nas duas ordens, página a página: nenhuma repete nem some, com várias em zero de uso e o desempate por `id` estável entre páginas; `total` certo |
| I3 | arquitetura | as varreduras da A0 enxergam exatamente as oito rotas do painel |
| L4 | integração | o estado e o `conviteId` da lista batem com a matriz da E6 |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --infra`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada válida
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As telas (6.0 e 8.0); consumo de IA (A2).
