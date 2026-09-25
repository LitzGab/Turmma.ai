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

- [x] 5.1 — `apps/api/src/operacao/painel.repository.ts`: `redes`, `escolas` e `uso`, cada um com
  `@SemEscopo` citando o painel; uma consulta por página, com subconsultas correlacionadas por
  `escola_id` no ano `em_curso` de cada escola: turmas; professores (`count(distinct)` de vínculo
  `professor` `confirmado` sem `encerrado_em`, de usuário ativo); alunos (o mesmo com vínculo `aluno` sem
  `encerrado_em`); `coordenadorAtivo` e o último convite de coordenação; uso do último dia fechado e do
  mês dele. Ordem por nome, ou por requisições do mês (decrescente, calculada antes de paginar), sempre
  com desempate por `id`; 25 por página e `total`. O `GET /redes` da 1.0 passa a ler daqui
- [x] 5.2 — `painel.service.ts` calcula o estado pela `estadoDaCoordenacao` e monta o DTO estrito:
  lista `id, nome, slug, rede{id,nome}, estado, conviteId?, turmas, professores, alunos`; uso `id, nome,
  dia{…}, mes{…}` com as datas de referência
- [x] 5.3 — `EXPLAIN (ANALYZE)` da lista com 30 escolas sintéticas, registrado numa seção "Plano da
  consulta" deste arquivo, mostrando que as subconsultas usam os índices de escopo
- [x] 5.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/operacao/painel.repository.ts` e `painel.repository.test.ts` | novo (o teste saiu: I1 no `arquitetura.test.ts`) |
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

## Divergências resolvidas nesta tarefa

- **Índice parcial novo em `usuario`** (`usuario_coordenador_ativo_idx (escola_id) where papel = 'coordenador' and
  desativado_em is null`, migration `0016`). A Tech Spec previa uma migration só (a do `convite_pendente_unico`). O
  `EXPLAIN` da lista (a recomendação do `infra-guardian` na 2.0) mostrou o "há coordenador ativo?" como uma varredura de
  `usuario` inteiro, de todas as escolas, a cada página: a tabela cresce com os alunos (regra 80, item 8). Com o índice,
  o plano lê uma linha por coordenador ativo. Não cria regra nem muda resultado (a L4 e a I6 passam iguais); subiu para a
  seção 3 da Tech Spec e para `docs/modelo-de-dados.md`. Não é `concurrently` porque o migrador roda cada migration numa
  transação; o MVP só tem dado sintético.
- **O mês do uso vai do dia 1 até o último dia fechado**, e não o mês inteiro como o `UsoRepository.doMes`: com o mês
  inteiro, a linha de hoje (a L2 exige que ela não apareça) entraria no mês. É o "setembro de 2026, até 23/09" da W5.
  Subiu para a seção 5 da Tech Spec. Prova: L2 (os quatro casos) e a mutação "mês inteiro" deixa a L2 vermelha.
- **Contrato da página**: `?pagina=` é o número da página, de 1 (até 10.000), e `?ordem=` `nome` ou `uso`, estritos (o
  parâmetro repetido ou a mais é 400); a resposta traz `itens`, `pagina` e `total`, e o uso também `dia` (`AAAA-MM-DD`) e
  `mes` (`AAAA-MM`) de referência. Não é o `proxima` por id das listagens da estrutura, porque a ordem por uso não tem
  chave estável para continuar de um id. Uma consulta pela página (as 25 escolas saem primeiro, na ordem, e só elas
  descem às subconsultas) e uma pelo total. Subiu para a seção 5 da Tech Spec.
- **I1 no `arquitetura.test.ts`**: o `painel.repository.test.ts` da 1.0 saiu, como ele mesmo anunciava; a cerca passou
  para a varredura do repositório inteiro, com a prova de que ela reprova quem importa de fora.
- **A L4 mora em `painel-convite.int.test.ts`**, e não no arquivo novo: usa as escolas em cada estado que aquele arquivo já
  monta pelos caminhos de verdade (`escolaEm`), e acrescenta a escola com dois convites (o refeito é o último).
- **I3 exata**: as três varreduras (C36 e C41 no `arquitetura.test.ts`, C46 no `operacao-isolamento.int.test.ts`) passam
  a comparar a lista inteira das rotas `@RotaDeOperacao` com o `/eu` e as oito do painel (`ROTAS_DO_PAINEL`, em
  `rotas-registradas.ts`), e as rotas do `PainelController` com as oito.
- **I6 com 503 em todas as rotas**: a leitura e a escrita de rede e escola esperam a tabela que o teste segura (`lock
  table … in access exclusive mode`), e as do convite a trava da escola, até o `statement_timeout` de uma API com prazo
  curto: 503 `TEMPO_ESGOTADO`. O banco parado responde pela guarda antes da rota (já provado na A0), então não prova nada
  do painel.

## Plano da consulta

`EXPLAIN (ANALYZE)` no Postgres 18 do compose de teste, com o banco recriado e 30 escolas sintéticas: cada uma com 2026
em curso e 2025 encerrado, 8 turmas (4 em cada ano), 10 professores (1 a 4 turmas cada), 240 alunos com vínculo,
coordenador ativo, um convite usado e 61 dias de uso (7.530 usuários, 7.890 vínculos, 1.830 linhas de uso). As tabelas
pequenas levam o planejador a varrer `turma`, `convite` e `ano_letivo` em vez de descer pelo índice; por isso cada
consulta foi medida também com `enable_seqscan = off`, que mostra o índice de escopo que ela usa quando a tabela cresce.

Lista, ordem por nome, página 1 (4,6 ms; trechos, sem `Buffers`):

```
Nested Loop Left Join (actual rows=25 loops=1)
  ->  Limit (rows=25)  ->  Sort (ordenadas.posicao)  ->  WindowAgg (ORDER BY e_1.nome, e_1.id)
        ->  Seq Scan on escola e_1 (rows=30)                      -- a ordem é de todas; só as 25 da página descem
  ->  Limit  ->  Sort (c.expira_em DESC, c.id DESC)               -- o último convite, por escola da página
        ->  Seq Scan on convite c  Filter: (escola_id = e.id AND tipo = 'coordenador')   [seqscan off: Index Scan using convite_escola_usuario_idx]
        ->  Index Scan using usuario_escola_id_unico on usuario convidado  Index Cond: (escola_id = e.id AND id = c.usuario_id)
  SubPlan 1 (turmas, loops=25)
        ->  Seq Scan on turma t  Filter: (escola_id = e.id AND ano_letivo_id = a.id)      [seqscan off: Bitmap Index Scan on turma_escola_id_unico]
  SubPlan 2 (professores, loops=25)
        ->  Bitmap Index Scan on vinculo_turma_idx  Index Cond: (escola_id = e.id AND ano_letivo_id = a.id AND estado = 'confirmado')
        ->  Index Scan using usuario_escola_id_unico on usuario pessoa  Index Cond: (escola_id = e.id AND id = v.usuario_id)
  SubPlan 3 (alunos, loops=25)
        ->  Bitmap Index Scan on vinculo_turma_idx  Index Cond: (escola_id = e.id AND ano_letivo_id = a.id)
        ->  Index Scan using usuario_escola_id_unico on usuario pessoa_1  Index Cond: (escola_id = e.id AND id = v_1.usuario_id)
  SubPlan 5 (coordenador ativo, uma vez, em hash)
        ->  Bitmap Index Scan on usuario_coordenador_ativo_idx (rows=30)
  [ano em curso, seqscan off: Index Scan using ano_letivo_um_em_curso_por_escola, loops=25]
```

Antes do índice novo (medido com as mesmas 30 escolas e as que os outros testes deixam no banco), o `SubPlan 5` era `Seq
Scan on usuario coordenador  Filter: (desativado_em IS NULL AND papel = 'coordenador')  Rows Removed by Filter: 7552`: os
usuários de todas as escolas, a cada página.

Lista, ordem por uso, página 2 (1,3 ms): a chave da ordem é calculada para as 30 escolas antes do corte, uma descida por
escola na chave primária de `uso_infra_diario`, que começa pela escola:

```
WindowAgg (ORDER BY (SubPlan) DESC, e_1.id)
  ->  Seq Scan on escola e_1 (rows=30)
        SubPlan (loops=30)  ->  Bitmap Index Scan on uso_infra_diario_escola_id_dia_pk
              Index Cond: (escola_id = e_1.id AND dia >= '2026-09-01' AND dia <= '2026-09-24')
```

O resto do plano é o da ordem por nome, com `loops=25`.

Uso, ordem por uso, página 1 (0,5 ms; 0,35 ms com `enable_seqscan = off`): a mesma chave; o dia, `Index Scan using
uso_infra_diario_escola_id_dia_pk on uso_infra_diario no_dia  Index Cond: (escola_id = e.id AND dia = '2026-09-24')`
(com as tabelas pequenas, um hash de `uso_infra_diario` filtrado pelo dia); o mês, `Bitmap Index Scan on
uso_infra_diario_escola_id_dia_pk  Index Cond: (escola_id = e.id AND dia >= '2026-09-01' AND dia <= '2026-09-24')`,
`loops=25`.

O que não desce por índice é a ordem sobre `escola` (uma linha por escola, dez no primeiro ano, D25), que precisa de todas
para ordenar; nenhuma tabela que cresce com aluno é varrida.

## Fora do escopo desta tarefa

As telas (6.0 e 8.0); consumo de IA (A2).

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-09-25 02:31:05 | 2026-09-25 02:34:27 | `test-engineer` | 1 | REPROVADO | aacd9a4d1acf10653 |
| 2026-09-25 02:36:00 | 2026-09-25 02:37:03 | `test-engineer` | 2 | APROVADO | a62c5430890cc5eb6 |
| 2026-09-25 02:47:46 | 2026-09-25 02:48:36 | `tenancy-guardian` | 1 | APROVADO | a5a00082b9c2bd4e4 |
| 2026-09-25 02:47:50 | 2026-09-25 02:48:52 | `privacy-guardian` | 1 | APROVADO | ad8da39ae0b92156a |
| 2026-09-25 02:47:57 | 2026-09-25 02:49:02 | `infra-guardian` | 1 | APROVADO | af81295c27d2f2d30 |
| 2026-09-25 02:47:41 | 2026-09-25 03:04:50 | `revisor-geral` | 1 | APROVADO | a2d61d70a6b34c789 |
