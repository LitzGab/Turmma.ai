# Tarefa 1.0 — A pessoa marca que viu a introdução, e o `/v1/eu` devolve a data

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A API guarda e devolve a data em que a pessoa viu a introdução do papel dela. Nenhuma tela muda.

## Contexto necessário

- `techspec.md` seções 3 a 7 e 7c; `prd.md` RF12, RF16, RF18 e seção 8
- Regras 10 (itens 3, 5 e 9), 20 (item 1) e 80 (itens 7 e 9)
- Código: `eu.repository.ts`, `eu.service.ts` e `acessosDaConta`, em `apps/api/src/sessao/`;
  `LEITURAS_DO_ARQUIVO.usuario`; em `docs/lgpd.md`, a linha da eliminação agendada

## Subtarefas

- [ ] 1.1 — `introducaoVistaEm` em `usuario`, com a migration do drizzle-kit; a coluna entra em
  `LEITURAS_DO_ARQUIVO.usuario.colunas`
- [ ] 1.2 — `esquemaRespostaEu` ganha `introducaoVistaEm`. Um método próprio do repository, ao lado de
  `acessosDaConta`, devolve a data só para o service, com a justificativa do `@SemEscopo` citando a data, o filtro por
  papel e que ela não sai em `acessos`, e com a entrada nova na lista de `resolucao-de-tenant.repository.test.ts`; o service responde
  a mais antiga entre a do usuário e a dos acessos **do mesmo papel** (aluno: só a da própria linha). Se a data é
  emprestada e a linha da sessão está nula, o GET chama o **mesmo método de repository do POST**, que não recebe data:
  `coalesce(introducao_vista_em, now())` por `escola_id` e `id` do contexto, nunca o valor emprestado (techspec seção 3,
  "Primeira saída"). Os acessos da conta com a data vêm de método próprio (`@SemEscopo`, filtro de papel na query,
  devolve só a mais antiga), sem quebrar o `escolher` do login nem o esquema estrito do acesso; teste de que o `escolher`
  não leva a data. Gravação do GET que falha: o GET devolve a data lida, sem gravar; o teste provoca a falha no banco de teste, e não
  com mock do repository, e a falha conta num contador só com ids. O `acessos` da resposta não muda
- [ ] 1.3 — `POST /v1/eu/introducao`: corpo vazio e estrito, `@Permite('eu', 'concluir_introducao')` (`proprio` nos
  três papéis, `nunca` na rede, escrito na matriz e em `matriz.expectativa.ts`), `no-store`. Usa
  `identidadeDaRequisicao()`, nunca `sessaoDaRequisicao()` nem `exigirAnoEmCurso()`. Responde a mesma data que o GET.
  Sem linha achada, `NAO_AUTENTICADO`
- [ ] 1.4 — `concluirIntroducao()` na web. Todo `insert into usuario` das fixtures e da vitrine grava a data; as
  fábricas de pessoa aceitam `introducao: 'por_ver'`
- [ ] 1.5 — `docs/lgpd.md` (linha nova no mapa, base legal "execução de contrato") e `docs/modelo-de-dados.md`. Na
  `0037`, a nota "só expande" da `0035`. A versão `coordenacao` do arquivo do titular não traz a data do professor (D64)
- [ ] 1.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/usuario.ts`, `packages/nucleo/src/titular/leitura-do-titular.ts` | alterado |
| `packages/nucleo/drizzle/0037_introducao_vista.sql`, `packages/nucleo/drizzle/meta/`, `apps/api/test/introducao.int.test.ts` | novo |
| `packages/shared/src/sessao/eu.ts`, `packages/shared/src/permissao/matriz.ts`, `packages/shared/src/permissao/matriz.expectativa.ts` | alterado |
| `apps/api/src/sessao/eu.controller.ts`, `apps/api/src/sessao/eu.service.ts`, `apps/api/src/sessao/eu.repository.ts`, `apps/api/src/sessao/eu.repository.int.test.ts`, `apps/api/src/sessao/resolucao-de-tenant.repository.ts` | alterado |
| `apps/api/test/arquivo-do-titular.int.test.ts`, `apps/web/src/api/eu.ts`, `tools/vitrine/escola.ts` | alterado |
| `e2e/__fixtures__/sessao.ts`, `e2e/__fixtures__/governanca.ts`, `e2e/__fixtures__/painel.ts`, `docs/lgpd.md`, `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz | integração | antes do POST, o `/v1/eu` devolve nulo; depois, a data, nos três papéis |
| borda: repetida, e virada do ano | integração | o segundo POST devolve a primeira data; o ano novo não a apaga |
| permissão | integração | sem sessão, 401; campo no corpo, `ENTRADA_INVALIDA`; nada gravado |
| isolamento entre escolas | integração | com o contexto de B, o usuário de A não é lido nem alterado |
| só a própria linha | integração | dois alunos da mesma turma e dois professores da mesma escola: um faz o POST, a linha do outro fica nula e o `/v1/eu` dele devolve nulo. **Mutação:** tirar `id = <contexto>` da escrita deixa este teste vermelho |
| escola sem ano em curso | integração | no molde de `sessao-guarda.int.test.ts` (`escola sem ano letivo em curso`): escola sem ano e escola entre anos (um encerrado, um planejado): POST 200 e GET com a data |
| duas escolas | integração | a professora de A e B marca em A: o `/v1/eu` em B devolve a data de A e grava `now()` em B; com datas nas duas, vale a mais antiga, e o POST responde essa. Data antiga pré-gravada em A: a linha de B fica não nula e diferente dela. **Mutação:** gravar o valor emprestado no lugar de `now()` deixa vermelho |
| escrita do GET, só a própria linha | integração | a professora de A e B e um colega da mesma escola B sem data: ela marca em A e lê B; a linha do colega fica nula e o `/v1/eu` dele devolve nulo. **Mutação:** tirar `id = <contexto>` da escrita do GET deixa vermelho |
| vínculo encerrado (RF12) | integração | ordem inteira: marca em A, `/v1/eu` em B, A desativada, `/v1/eu` em B devolve a data. **Mutação:** tirar a gravação do GET deixa vermelho |
| sem GET intermediário | integração | marca em A, A desativada, primeiro `/v1/eu` em B: devolve nulo (a introdução reabre). É o comportamento declarado (ressalva do RF12); o desativado não empresta |
| B sem ano em curso | integração | a professora de A entra em B sem ano em curso: o GET grava e responde, sem `exigirAnoEmCurso()` |
| corrida do GET | integração | `Promise.all` de dois GET em B (e um GET com um POST): a primeira data fica; gravação que falha devolve a data lida |
| dois papéis; outra conta | integração | professora em A e coordenadora em B não herdam; outra conta com a data gravada não empresta; a eliminação agendada não empresta |
| `coalesce` | integração | data antiga conhecida pré-gravada: o POST repetido e os dois em paralelo devolvem exatamente ela. **Mutação:** tirar o `coalesce` deixa vermelho |
| rede | integração | a sessão de rede é recusada no POST |
| concorrência: dois POST com `Promise.all` | integração | os dois respondem 200 com a mesma data |
| arquivo do titular | integração | a data sai no arquivo da própria pessoa, e a versão `coordenacao` não traz a do professor |

## Como testar

- Isolamento: `apps/api/src/sessao/eu.repository.int.test.ts › isolamento: o /v1/eu lê o usuário…`, com a escrita
- Rota: `apps/api/test/escola-sessao.int.test.ts › borda: fora de 5 a 480 minutos…` e `› concorrência: duas
  alterações…` (`subirApi`, `chamar`, `BancadaDeSessoes`)
- Duas escolas: `apps/api/test/troca-de-escola.int.test.ts`
- Rodar: `npx vitest run --project integracao apps/api/test/introducao.int.test.ts`
- Armadilha: teste que monta o corpo do `/v1/eu` ganha o campo

## Fora do escopo desta tarefa

Tela, desvio da primeira entrada (9.0 a 11.0) e log novo.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo. A revisão da spec
exige ao menos cinco: tirar `id = <contexto>` da escrita do POST; tirar `id = <contexto>` da escrita do GET; tirar o `coalesce`
(do GET e do POST, se forem duas instruções); tirar a gravação do GET; gravar o valor emprestado no lugar de `now()`.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->
