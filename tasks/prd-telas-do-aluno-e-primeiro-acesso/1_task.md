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
- Código: `eu.repository.ts` e `eu.service.ts`, em `apps/api/src/sessao/eu/`; `acessosDaConta`, em
  `apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts`;
  `LEITURAS_DO_ARQUIVO.usuario`; em `docs/lgpd.md`, a linha da eliminação agendada

## Subtarefas

- [x] 1.1 — `introducaoVistaEm` em `usuario`, com a migration do drizzle-kit (o número que ele der; hoje, 0039); a coluna entra em
  `LEITURAS_DO_ARQUIVO.usuario.colunas`
- [x] 1.2 — `esquemaRespostaEu` ganha `introducaoVistaEm`. Um método próprio do repository, ao lado de
  `acessosDaConta`, devolve a data só para o service, com a justificativa do `@SemEscopo` citando a data, o filtro por
  papel e que ela não sai em `acessos`, e com a entrada nova na lista de `resolucao-de-tenant.repository.test.ts`; o service responde
  a mais antiga entre a do usuário e a dos acessos **do mesmo papel** (aluno: só a da própria linha). Se a data é
  emprestada e a linha da sessão está nula, o GET chama o **mesmo método de repository do POST**, que não recebe data:
  `coalesce(introducao_vista_em, now())` por `escola_id` e `id` do contexto, nunca o valor emprestado (techspec seção 3,
  "Primeira saída"). Os acessos da conta com a data vêm de método próprio (`@SemEscopo`, filtro de papel na query,
  devolve só a mais antiga), sem quebrar o `escolher` do login nem o esquema estrito do acesso; teste de que o `escolher`
  não leva a data (`troca-de-escola.int.test.ts › a etapa escolher não leva a data da introdução`, na tabela). Gravação do GET que falha: o GET devolve a data lida, sem gravar; o teste provoca a falha no banco de teste, e não
  com mock do repository, e a falha conta num contador só com ids. O `acessos` da resposta não muda
- [x] 1.3 — `POST /v1/eu/introducao`: corpo vazio e estrito, por `@Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente))`,
  como `aprovarLote` em `apps/api/src/atividade/correcao/lote.controller.ts`; `@Permite('eu', 'concluir_introducao')` (`proprio` nos
  três papéis, `nunca` na rede, escrito na matriz e em `matriz.expectativa.ts`), `no-store`. Usa
  `identidadeDaRequisicao()`, nunca `sessaoDaRequisicao()` nem `exigirAnoEmCurso()`. Responde a mesma data que o GET.
  Sem linha achada, `NAO_AUTENTICADO`
- [x] 1.4 — `concluirIntroducao()` na web. Todo `insert into usuario` das fixtures e da vitrine grava a data; as
  fábricas de pessoa aceitam `introducao: 'por_ver'`
- [x] 1.5 — `docs/lgpd.md` (linha nova no mapa, base legal "execução de contrato") e `docs/modelo-de-dados.md`. Na
  migration nova, a nota "só expande" da `0035`. A versão `coordenacao` do arquivo do titular não traz a data do professor (D64)
- [x] 1.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/usuario.ts`, `packages/nucleo/src/titular/leitura-do-titular.ts`, `packages/nucleo/src/telemetria/metricas.ts` | alterado |
| `packages/nucleo/drizzle/meta/` | alterado |
| `packages/nucleo/drizzle/0039_introducao_vista.sql`, `apps/api/test/introducao.int.test.ts`, `apps/api/src/sessao/eu/eu.service.test.ts` | novo |
| `packages/shared/src/sessao/eu.ts`, `packages/shared/src/permissao/matriz.ts`, `packages/shared/src/permissao/matriz.expectativa.ts` | alterado |
| `apps/api/src/sessao/eu/eu.controller.ts`, `apps/api/src/sessao/eu/eu.service.ts`, `apps/api/src/sessao/eu/eu.repository.ts`, `apps/api/src/sessao/eu/eu.repository.int.test.ts` | alterado |
| `apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts`, `apps/api/src/sessao/tenant/resolucao-de-tenant.repository.test.ts` | alterado |
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
| corrida do GET | integração | dois GET em B presos na trava da linha (`for update` do teste), soltos em ordem e reunidos depois, e um GET com um POST: a gravação do primeiro fica, comparada com a hora do banco tirada entre os dois. `introducao.int.test.ts › corrida do GET, com um valor conhecido` e `› corrida do GET: dois GET juntos em B` |
| gravação do GET que falha | integração | a falha provocada no banco de teste: o GET devolve a data lida, a linha fica nula e o contador `eu.introducao_falha` sobe sem rótulo. `introducao.int.test.ts › gravação do GET que falha no banco` |
| dois papéis; outra conta | integração | professora em A e coordenadora em B não herdam; outra conta com a data gravada não empresta; a eliminação agendada não empresta |
| `coalesce` | integração | data antiga conhecida pré-gravada: o POST repetido e os dois em paralelo devolvem exatamente ela. **Mutação:** tirar o `coalesce` deixa vermelho |
| rede | unidade (matriz) | a rede é `nunca` no POST: `packages/shared/src/permissao/matriz.test.ts › marcar a introdução como vista`; sessão de rede não existe hoje (ver Divergências) |
| concorrência: dois POST com `Promise.all` | integração | os dois respondem 200 com a mesma data |
| arquivo do titular | integração | a data sai no arquivo da própria pessoa, e a versão `coordenacao` não traz a do professor |
| escolher sem a data | integração | com a data gravada nas duas linhas da conta, cada item de `acessos` traz só `escolaNome`, `papel`, `redeNome` e `usuarioId`, e o corpo não contém a data: `apps/api/test/troca-de-escola.int.test.ts › a etapa escolher não leva a data da introdução: com a data gravada nas duas linhas, cada acesso traz só os quatro campos` |

## Como testar

- Isolamento: `apps/api/src/sessao/eu/eu.repository.int.test.ts › isolamento: o /v1/eu lê o usuário…`, com a escrita
- Rota: `apps/api/test/escola-sessao.int.test.ts › borda: fora de 5 a 480 minutos…` e `› concorrência: duas
  alterações…` (`subirApi`, `chamar`, `BancadaDeSessoes`)
- Duas escolas: `apps/api/test/troca-de-escola.int.test.ts`
- Rodar: `npx vitest run --project integracao apps/api/test/introducao.int.test.ts`
- Armadilha: teste que monta o corpo do `/v1/eu` ganha o campo
- Consulta: a 1.0 de antes da X5, `git show 14778505` (branch local `spec/telas-do-aluno-e-primeiro-acesso--congelada`), com os
  caminhos velhos (`sessao/eu.*`, `0037`). Serve de leitura, não de cópia: o número e as pastas mudaram

## Fora do escopo desta tarefa

Tela, desvio da primeira entrada (9.0 a 11.0) e log novo.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A linha "rede" da tabela de testes é de unidade (a matriz), e não de integração: não existe sessão de rede para o POST receber (`PAPEIS_DE_USUARIO` exclui `rede`, e `sessao-guarda.int.test.ts` recusa `--papel rede` como papel desconhecido) | O `nunca` da rede fica provado na matriz (`matriz.test.ts › marcar a introdução como vista`); um caso de integração não teria sessão para montar. Não muda desenho nem critério | `techspec.md` §3 (a frase depois da tabela de rotas) |
| O contador da gravação do GET que falha (`eu.introducao_falha`, sem rótulo) e o painel dele, `infra/grafana/paineis/fundacao.json`, com o nome em `tools/testes/metricas.ts`: arquivos fora de "Arquivos previstos" | A subtarefa 1.2 manda contar a falha, e `infra/test/painel.test.ts` recusa métrica sem painel e sem o nome no Prometheus. É consequência do que o documento já pedia, e não muda desenho nem critério | `techspec.md` §3 ("Primeira saída") e §7c ("Métrica, alerta, teste de carga"), que ganharam a frase do contador |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo. A revisão da spec
exige ao menos cinco: tirar `id = <contexto>` da escrita do POST; tirar `id = <contexto>` da escrita do GET; tirar o `coalesce`
(do GET e do POST, se forem duas instruções); tirar a gravação do GET; gravar o valor emprestado no lugar de `now()`.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/api/src/sessao/eu/eu.repository.ts
teste: apps/api/src/sessao/eu/eu.repository.int.test.ts › isolamento: a marca da introdução
  .set({ introducaoVistaEm: sql`coalesce(${usuario.introducaoVistaEm}, now())` })
- .where(and(eq(usuario.escolaId, escolaId), eq(usuario.id, usuarioId)))
+ .where(eq(usuario.id, usuarioId))
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.repository.ts
teste: apps/api/test/introducao.int.test.ts › só a própria linha
  .set({ introducaoVistaEm: sql`coalesce(${usuario.introducaoVistaEm}, now())` })
- .where(and(eq(usuario.escolaId, escolaId), eq(usuario.id, usuarioId)))
+ .where(eq(usuario.escolaId, escolaId))
```

O GET e o POST chamam este mesmo método (`marcarIntroducaoVista`), uma instrução só; o mesmo corte, pelo caminho do GET, tem o seu bloco:

```mutacao
arquivo: apps/api/src/sessao/eu/eu.repository.ts
teste: apps/api/test/introducao.int.test.ts › escrita do GET, só a própria linha
  .set({ introducaoVistaEm: sql`coalesce(${usuario.introducaoVistaEm}, now())` })
- .where(and(eq(usuario.escolaId, escolaId), eq(usuario.id, usuarioId)))
+ .where(eq(usuario.escolaId, escolaId))
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.repository.ts
teste: apps/api/test/introducao.int.test.ts › coalesce: com uma data antiga
  .update(usuario)
- .set({ introducaoVistaEm: sql`coalesce(${usuario.introducaoVistaEm}, now())` })
+ .set({ introducaoVistaEm: sql`now()` })
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.repository.ts
teste: apps/api/test/introducao.int.test.ts › corrida do GET, com um valor conhecido
  .update(usuario)
- .set({ introducaoVistaEm: sql`coalesce(${usuario.introducaoVistaEm}, now())` })
+ .set({ introducaoVistaEm: sql`now()` })
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.repository.ts
teste: apps/api/test/introducao.int.test.ts › duas escolas: marca em A
  .update(usuario)
- .set({ introducaoVistaEm: sql`coalesce(${usuario.introducaoVistaEm}, now())` })
+ .set({ introducaoVistaEm: sql`coalesce(${usuario.introducaoVistaEm}, (select min(o.introducao_vista_em) from usuario o where o.conta_id = usuario.conta_id))` })
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.repository.ts
teste: apps/api/test/introducao.int.test.ts › caminho feliz
  inatividadeEquipeMin: escola.inatividadeEquipeMin,
- introducaoVistaEm: usuario.introducaoVistaEm,
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/test/introducao.int.test.ts › vínculo encerrado
  let propria = linha.introducaoVistaEm
- if (propria === null && emprestada !== null) propria = await this.#gravarSemEmprestar()
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/test/introducao.int.test.ts › caminho feliz
  let propria = linha.introducaoVistaEm
- if (propria === null && emprestada !== null) propria = await this.#gravarSemEmprestar()
+ if (propria === null) propria = await this.#gravarSemEmprestar()
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/test/introducao.int.test.ts › com a data de B mais antiga
  if (b === null) return a
- return a.getTime() <= b.getTime() ? a : b
+ return a.getTime() <= b.getTime() ? b : a
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/test/introducao.int.test.ts › gravação do GET que falha
  } catch {
- this.#naoGravadas.add(1)
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/test/introducao.int.test.ts › gravação do GET que falha
  this.#naoGravadas.add(1)
- return null
+ throw new Error('a gravação do GET derrubou a resposta')
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/src/sessao/eu/eu.service.test.ts › o aluno não tem conta
  async #emprestada(linha: LinhaDoEu): Promise<Date | null> {
- return linha.contaId === null ? null : this.resolucao.introducaoMaisAntigaDaConta(linha.contaId, linha.papel)
+ return this.resolucao.introducaoMaisAntigaDaConta(linha.contaId ?? '', linha.papel)
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/src/sessao/eu/eu.service.test.ts › a pessoa que saiu entre a guarda
  async concluirIntroducao(): Promise<RespostaIntroducao> {
  const linha = await this.eu.doContexto()
- if (linha === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/src/sessao/eu/eu.service.test.ts › a pessoa que saiu entre a guarda
  const gravada = await this.eu.marcarIntroducaoVista()
- if (gravada === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/src/sessao/eu/eu.service.test.ts › o POST responde a mais antiga
  const gravada = await this.eu.marcarIntroducaoVista()
  if (gravada === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
- const vista = maisAntiga(gravada, await this.#emprestada(linha)) ?? gravada
+ const vista = gravada
```

```mutacao
arquivo: apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts
teste: apps/api/test/introducao.int.test.ts › dois papéis
- .where(and(eq(usuario.contaId, contaId), eq(usuario.papel, papel), isNull(usuario.desativadoEm), isNull(usuario.eliminacaoAgendadaEm)))
+ .where(and(eq(usuario.contaId, contaId), isNull(usuario.desativadoEm), isNull(usuario.eliminacaoAgendadaEm)))
```

```mutacao
arquivo: apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts
teste: apps/api/test/introducao.int.test.ts › sem GET intermediário
- .where(and(eq(usuario.contaId, contaId), eq(usuario.papel, papel), isNull(usuario.desativadoEm), isNull(usuario.eliminacaoAgendadaEm)))
+ .where(and(eq(usuario.contaId, contaId), eq(usuario.papel, papel), isNull(usuario.eliminacaoAgendadaEm)))
```

```mutacao
arquivo: apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts
teste: apps/api/test/introducao.int.test.ts › outra conta com a data gravada
- .where(and(eq(usuario.contaId, contaId), eq(usuario.papel, papel), isNull(usuario.desativadoEm), isNull(usuario.eliminacaoAgendadaEm)))
+ .where(and(eq(usuario.contaId, contaId), eq(usuario.papel, papel), isNull(usuario.desativadoEm)))
```

```mutacao
arquivo: apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts
teste: apps/api/test/introducao.int.test.ts › outra conta com a data gravada
- .where(and(eq(usuario.contaId, contaId), eq(usuario.papel, papel), isNull(usuario.desativadoEm), isNull(usuario.eliminacaoAgendadaEm)))
+ .where(and(eq(usuario.papel, papel), isNull(usuario.desativadoEm), isNull(usuario.eliminacaoAgendadaEm)))
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.controller.ts
teste: apps/api/test/introducao.int.test.ts › permissão: sem sessão é 401
- concluirIntroducao(@Body(new ZodValidationPipe(esquemaPedidoSemCorpoOuAusente)) _corpo: PedidoSemCorpo): Promise<RespostaIntroducao> {
+ concluirIntroducao(@Body() _corpo: PedidoSemCorpo): Promise<RespostaIntroducao> {
```

```mutacao
arquivo: packages/shared/src/permissao/matriz.ts
teste: packages/shared/src/permissao/matriz.test.ts › marcar a introdução como vista
- eu: { ler: 'nunca', concluir_introducao: 'nunca' },
+ eu: { ler: 'nunca', concluir_introducao: 'proprio' },
```

```mutacao
arquivo: packages/shared/src/permissao/matriz.ts
teste: packages/shared/src/permissao/matriz.test.ts › marcar a introdução como vista
  sistema_job_sintetico: { criar: 'nunca', ler: 'nunca' },
- eu: { ler: 'proprio', concluir_introducao: 'proprio' },
+ eu: { ler: 'proprio', concluir_introducao: 'nunca' },
```

```mutacao
arquivo: packages/nucleo/src/titular/leitura-do-titular.ts
teste: apps/api/test/arquivo-do-titular.int.test.ts › a data da introdução vista
- sql`select ${colunasDoSelect('id', 'papel', 'nome', 'desativado_em')}, ${versao === 'completa' ? sql.raw('t.introducao_vista_em') : sql.raw("case when t.papel = 'aluno' then t.introducao_vista_em end as introducao_vista_em")} from usuario t where t.escola_id = ${escolaId} and t.id = ${titularId}`,
+ sql`select ${colunasDoSelect('id', 'papel', 'nome', 'desativado_em')}, ${sql.raw('t.introducao_vista_em')} from usuario t where t.escola_id = ${escolaId} and t.id = ${titularId}`,
```

```mutacao
arquivo: packages/nucleo/src/titular/leitura-do-titular.ts
teste: apps/api/test/arquivo-do-titular.int.test.ts › a data da introdução vista
- sql`select ${colunasDoSelect('id', 'papel', 'nome', 'desativado_em')}, ${versao === 'completa' ? sql.raw('t.introducao_vista_em') : sql.raw("case when t.papel = 'aluno' then t.introducao_vista_em end as introducao_vista_em")} from usuario t where t.escola_id = ${escolaId} and t.id = ${titularId}`,
+ sql`select ${colunasDoSelect('id', 'papel', 'nome', 'desativado_em')}, ${versao !== 'completa' ? sql.raw('t.introducao_vista_em') : sql.raw("case when t.papel = 'aluno' then t.introducao_vista_em end as introducao_vista_em")} from usuario t where t.escola_id = ${escolaId} and t.id = ${titularId}`,
```
```mutacao
arquivo: apps/api/src/sessao/eu/eu.repository.ts
teste: apps/api/src/sessao/eu/eu.repository.int.test.ts › isolamento: a marca da introdução
- return linha?.introducaoVistaEm ?? undefined
+ return linha?.introducaoVistaEm ?? null
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/test/introducao.int.test.ts › gravação do GET que falha
  const maisAntiga = (a: Date | null, b: Date | null): Date | null => {
- if (a === null) return b
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/test/introducao.int.test.ts › caminho feliz
- introducaoVistaEm: maisAntiga(propria, emprestada)?.toISOString() ?? null,
+ introducaoVistaEm: maisAntiga(propria, emprestada)?.toISOString() ?? undefined,
```

```mutacao
arquivo: apps/api/src/sessao/eu/eu.service.ts
teste: apps/api/src/sessao/eu/eu.service.test.ts › só a emprestada, e a linha sumiu
- return (await this.eu.marcarIntroducaoVista()) ?? null
+ return (await this.eu.marcarIntroducaoVista()) ?? undefined
```

```mutacao
arquivo: apps/api/src/sessao/sessao.module.ts
teste: apps/api/test/introducao.int.test.ts › gravação do GET que falha
- { provide: EuService, useFactory: (eu: EuRepository, resolucao: ResolucaoDeTenantRepository) => new EuService(eu, resolucao, opcoes.medidor ?? medidorGlobal()), inject: [EuRepository, ResolucaoDeTenantRepository] },
+ { provide: EuService, useFactory: (eu: EuRepository, resolucao: ResolucaoDeTenantRepository) => new EuService(eu, resolucao, medidorGlobal()), inject: [EuRepository, ResolucaoDeTenantRepository] },
```

```mutacao
arquivo: apps/api/src/sessao/tenant/resolucao-de-tenant.repository.ts
teste: apps/api/test/introducao.int.test.ts › dois papéis
- return linha?.maisAntiga == null ? null : new Date(linha.maisAntiga)
+ return new Date(linha?.maisAntiga ?? 0)
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | `introducao.int.test.ts:61-67`: o trigger criado e apagado em `usuario` pode deixar instável outro arquivo de integração que rode ao mesmo tempo; "isolar esse teste […] se aparecer instabilidade" | Recusada: o próprio revisor a condiciona a aparecer instabilidade, e o `finally`/`soltar` já apaga o trigger. Se aparecer, entra por `/corrigir` |
| infra-guardian (1ª) | `eu.service.ts`: `lock_timeout` curto só na gravação do GET, para transação longa que segura a linha | `TODO.md` (seção "Infra e operação"): muda comportamento e só vale se o painel novo mostrar falhas junto com latência alta do `/v1/eu` |
| test-engineer (1ª) | `eu.service.test.ts:49,56`: repositories feitos à mão com `as unknown as`; uma interface mínima tipada evitaria o cast | Recusada: o revisor mesmo os chama de aceitáveis, porque a parte do banco tem integração |
| tenancy-guardian e infra-guardian (2ª) | `packages/nucleo/dist/telemetria/metricas.{js,d.ts}` ainda tem a chave antiga `introducaoNaoGravada`; refazer o build do `nucleo` antes de rodar a API fora do Vitest | Recusada: `dist` é artefato de build, fora do git, e a esteira reconstrói o `nucleo` |
| privacy-guardian (2ª) | O comentário em `packages/nucleo/src/titular/leitura-do-titular.ts:32` ainda diz que a versão `coordenacao` não traz só a data do professor; o código também esconde a do coordenador | `TODO.md`, ou a tarefa futura que tocar `leitura-do-titular.ts`: só de comentário, e não é de quem reprovou |
| privacy-guardian (2ª) | Nenhum teste prova que o arquivo do titular na versão `coordenacao` omite a data quando o titular é coordenador | `TODO.md`: o próprio revisor condiciona a "se esse caminho existir na prática" |
| conformidade-reviewer (2ª) | Quando a coordenação ganhar painel de adoção, um caso em `apps/api/src/governanca/governanca.int.test.ts` que prove que a data não entra | A tarefa futura que criar o painel de adoção (hoje não existe consumidor, e a proibição já está escrita em `docs/lgpd.md`) |
| revisor-geral (2ª) | `opcoes.introducao` de `criarProfessoraNaEscola` e `criarCoordenadoraNaEscola` (`e2e/__fixtures__/sessao.ts:218,223`) sem chamador nesta tarefa | Recusada: a subtarefa 1.4 manda as fábricas de pessoa aceitarem `introducao: 'por_ver'`, e o próprio revisor-geral a pediu na 1ª rodada, porque a 9.0 a 11.0 vão precisar dela |
| revisor-geral (2ª) | O campo `#naoGravadas` (`eu.service.ts:46`) com o nome antigo ao lado da chave `introducaoFalha` | `TODO.md`: nome de campo privado, e não é de quem reprovou |
| test-engineer (3ª) | Citar o nome inteiro dos testes de `introducao.int.test.ts` na tabela, e não só o começo, para quem procura por busca de texto | Recusada: a convenção da tarefa cita o começo do nome, e o próprio revisor reconhece que as demais citações fazem assim; o nome do `escolher`, o único que a correção exigia, já está inteiro |
| revisor-geral (3ª) | No comentário de `introducao.int.test.ts:275`, dizer que o `now()` dá a hora do início da **transação**, que num update avulso coincide com a da instrução, para quem envolver `marcarIntroducaoVista` numa transação ver que a premissa deixa de valer | A tarefa futura que envolver `marcarIntroducaoVista` em transação (hoje a escrita é avulsa, e o comentário está certo para o código de agora) |
| revisor-geral (3ª) | Quebrar a linha da subtarefa 1.2 em `1_task.md:32`, que ficou bem mais longa que as vizinhas | Recusada: só formatação de documento |

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 00:52:37 | 2026-10-25 00:53:38 | `tenancy-guardian` | 1 | APROVADO | aa0aa8fc3faaf148e |
| 2026-10-25 00:53:02 | 2026-10-25 00:53:57 | `conformidade-reviewer` | 1 | APROVADO | a1d179b6156d52e17 |
| 2026-10-25 00:52:47 | 2026-10-25 00:54:02 | `infra-guardian` | 1 | APROVADO | add6cf1056a20312f |
| 2026-10-25 00:52:42 | 2026-10-25 00:54:06 | `privacy-guardian` | 1 | APROVADO | afa5bf93fd1ece28c |
| 2026-10-25 00:52:57 | 2026-10-25 00:55:01 | `revisor-geral` | 1 | APROVADO | aa863ad955be7f807 |
| 2026-10-25 00:52:52 | 2026-10-25 00:56:19 | `test-engineer` | 1 | REPROVADO | adda1d68770aadb5f |
| 2026-10-25 01:06:34 | 2026-10-25 01:07:03 | `tenancy-guardian` | 2 | APROVADO | a582e9dfc68b43b36 |
| 2026-10-25 01:06:42 | 2026-10-25 01:07:07 | `privacy-guardian` | 2 | APROVADO | a9fa164a4813a4d89 |
| 2026-10-25 01:06:50 | 2026-10-25 01:07:16 | `infra-guardian` | 2 | APROVADO | ac2ab1b01333256e3 |
| 2026-10-25 01:06:25 | 2026-10-25 01:07:31 | `test-engineer` | 2 | REPROVADO | a7c813659747c6b77 |
| 2026-10-25 01:07:07 | 2026-10-25 01:07:32 | `conformidade-reviewer` | 2 | APROVADO | a0fe591f0fd28a2e3 |
| 2026-10-25 01:06:59 | 2026-10-25 01:07:38 | `revisor-geral` | 2 | APROVADO | a4a1d7c999e0e90cd |
| 2026-10-25 01:16:59 | 2026-10-25 01:17:28 | `test-engineer` | 3 | APROVADO | a804a71ad1bb982e7 |
| 2026-10-25 01:17:08 | 2026-10-25 01:17:34 | `revisor-geral` | 3 | APROVADO | a4c6627b3a0209d2f |
