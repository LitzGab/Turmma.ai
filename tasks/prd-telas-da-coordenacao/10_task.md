# Tarefa 10.0 — Registros › IA: os números, a tabela com filtro por estado e o consumo

**Funcionalidade:** telas-da-coordenacao · **Depende de:** 4.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba IA de Registros mostra o que a IA gerou e se uma pessoa aprovou, como no mockup no que o produto tem: os quatro números, a tabela com o filtro por estado e o consumo do mês por função ao lado.

## Contexto necessário

- `techspec.md` seções 4, 5 (`?estado=`), 9 ("Registros › IA") e 12; `prd.md` RF18, RF22, RF23 e seção 6, pontos 2 e 3
- `mockup.md` seção 5.1: só a composição. As colunas "Turma" e "Aprovado por", a busca e o painel do registro **não entram**
- `.claude/rules/70-conformidade-cne.md` itens 6, 8 e 9
- Código: `apps/web/src/areas/coordenacao/Governanca.tsx` e `textos-da-governanca.ts` (os textos não mudam); `apps/web/src/api/governanca.ts`; `packages/shared/src/governanca/governanca.ts` (`esquemaConsultaResumoDaGovernanca`, só para ler)

## Subtarefas

- [x] 10.1 — Os quatro `NumeroPainel`, com os rótulos e os textos de apoio de hoje, e o link "Como cada IA trabalha" (`/coordenacao/agentes`)
- [x] 10.2 — `Segmentado` "Estado": "Todos", "Esperando o professor", "Aprovados" e "Rejeitados", no endereço (`?estado=`). A consulta passa a aceitar o estado, que entra na chave; os números são sempre os da escola inteira
- [x] 10.3 — A tabela "O que a IA gerou e quem aprovou", com as cinco colunas de hoje, `LinhaAprovacao` na decisão, "Carregar mais" e a frase de hoje sobre por que não há turma nem quem decidiu. A linha não é clicável
- [x] 10.4 — "Consumo do mês por função" ao lado da tabela a partir de 1024 px, e embaixo dela no celular, com as barras neutras e os textos de hoje
- [x] 10.5 — Os vazios de hoje ("A IA ainda não gerou nada nesta escola", "Nenhuma linha para mostrar ainda", "Nenhuma função trabalhou neste mês") e o do filtro que não acha nada
- [x] 10.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/Governanca.tsx`, `apps/web/src/api/governanca.ts` | alterado |
| `apps/web/src/areas/coordenacao/textos-da-governanca.ts`, `apps/web/src/areas/coordenacao/textos-da-governanca.test.ts` | alterado |
| `apps/web/src/areas/coordenacao/Governanca.test.tsx` | novo |
| `e2e/governanca.spec.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| estados da tela | componente | carregando; erro com "Tentar de novo"; os dois vazios da tabela, só com a leitura terminada; o do filtro; com dado; a falha de "Carregar mais" não apaga o que já foi lido |
| sem professor nem turma | componente | a tabela não tem coluna, filtro nem ordem por professor ou por turma, e a tela não manda esses campos à API |
| o filtro | componente | a rede falsa devolve números diferentes com `?estado=`; escolher "Aprovados" chama `resumo?estado=aprovada` e a tela mantém os quatro números do resumo sem filtro. Mutação: usar os números da resposta filtrada deixa o teste vermelho |
| o filtro no servidor | e2e | com `montarEscolaComEntregas`, `estado` filtra a lista e os números ficam (`governanca.controller.ts`; repository) |
| a governança de hoje | e2e | o caso `a coordenação abre em Governança…`, pelo lugar Registros: `[data-aprovacao]` com a espera e a decisão, o consumo em tokens, nenhum nome de professor na página |
| série com um professor só | e2e | a entrega conta nos números e não entra na lista, como hoje |
| recomeço: segunda pessoa; o filtro pelo endereço; resposta atrasada ao trocar de filtro | e2e | nada da escola anterior; a resposta do filtro antigo não cai na lista do novo. Sem diálogo, o quarto caso não se aplica |
| 1366 × 768 e 360 px | e2e | a página não rola e a tabela rola dentro; no celular vira lista, sem rolagem de lado |

## Como testar

- `e2e/governanca.spec.ts › a coordenação abre em Governança…` e `› os quatro estados…`; `montarEscolaComEntregas`, de `e2e/__fixtures__/governanca.ts`
- `textos-da-governanca.test.ts` já prova os textos: acrescente só os rótulos do filtro
- Resposta atrasada: segure a primeira com `page.route` e troque o filtro
- Rodar: `npx vitest run --project unidade apps/web/src/areas/coordenacao/Governanca.test.tsx`; `node tools/ci/e2e.ts --manter-ambiente e2e/governanca.spec.ts`
- A premissa do filtro foi verificada no código (`techspec.md` seção 12); se o e2e do servidor falhar, pare e avise
- Rode `EXPLAIN` da consulta com `?estado=rejeitada` numa escola com volume e anote o resultado na tarefa
- O roteiro lê os quatro números pelo rótulo: eles não mudam, e o roteiro não é tocado
- Telas: `coordenacao`, `/coordenacao/governanca`; também com `--vazia`; mockup `/coordenacao/registros?aba=ia`

## Fora do escopo desta tarefa

O painel de cada registro, "Por série", a busca, as colunas "Turma" e "Aprovado por"; "Como cada IA trabalha" (11.0); o dado nominal, que já foi para o Analista (4.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O `Segmentado` ganhou a prop opcional `emDuasColunasNoCelular` (`Segmentado.tsx`, `Segmentado.test.tsx` e a linha dele em `docs/interface.md`), fora dos arquivos previstos | A 360 px os quatro rótulos do filtro não cabem na linha: medido no e2e, "Esperando o professor", "Aprovados" e "Rejeitados" saem 5 a 6 px do botão, e texto saindo do bloco é bloqueante. A prop é opt-in (abaixo de 768 px as opções ficam duas por linha) e as outras telas não mudam | `techspec.md` §12, primeira premissa (o que faltar da API do `Segmentado` entra na tarefa) e §9, "Como ficou na 10.0"; `docs/interface.md`, linha do `Segmentado` |
| `ParametroDoEndereco` ganhou `'estado'` (`endereco-da-tela.ts`), fora dos arquivos previstos | `enderecoComParametro` é a peça que já põe e tira parâmetro no endereço (Turmas e Professores), e o tipo do nome é fechado | `techspec.md` §5 (`?estado=` da IA) e §9, "Como ficou na 10.0" |
| O e2e ganhou `acrescentarSerieDeUmProfessorSo`, em `e2e/__fixtures__/governanca.ts`, fora dos arquivos previstos | O caso "série com um professor só" da tabela de testes precisa de uma série assim, e `montarEscolaComEntregas` só monta a de três professoras | `techspec.md` §10 (E2E `governanca`) e §9, "Como ficou na 10.0" |
| A célula da coluna "Série" da tabela ganhou `min-w-28` (`Governanca.tsx`, `COLUNAS`), um detalhe de estilo que a tarefa não pedia | Sem largura mínima, o nome da série ("3º ano do Ensino Médio") quebrava em duas e três linhas na tabela estreita de 1024 a 1366 px, ao lado do consumo. A classe só fixa o piso da célula; o texto e a coluna são os de hoje | `techspec.md` §9, "Como ficou na 10.0" |
| Os quatro números vêm da consulta sem filtro, **sempre montada**; a consulta do estado leva o estado na chave e só entrega linhas, e só existe com `?estado=` no endereço | A resposta de um filtro traz números, e o teste da tarefa exige que a tela não os use. Sem filtro a Governança continua na chave que o Painel lê (`techspec.md` §7c): a chave sem estado não muda | `techspec.md` §9, "Como ficou na 10.0" |

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: apps/web/src/api/governanca.ts
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › escolher "Aprovados" chama
  const consulta = new URLSearchParams()
- if (estado !== undefined) consulta.set('estado', estado)
  if (pagina !== undefined) consulta.set('pagina', pagina)
```

```mutacao
arquivo: apps/web/src/api/governanca.ts
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › com dado: cinco colunas
  if (estado !== undefined) consulta.set('estado', estado)
- if (pagina !== undefined) consulta.set('pagina', pagina)
  const resto = consulta.toString()
```

```mutacao
arquivo: apps/web/src/api/governanca.ts
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › com dado: cinco colunas
  const resto = consulta.toString()
- return buscarComSessao(resto === '' ? `${CAMINHO_DA_GOVERNANCA}/resumo` : `${CAMINHO_DA_GOVERNANCA}/resumo?${resto}`, esquemaRespostaResumoDaGovernanca, signal)
+ return buscarComSessao(false ? `${CAMINHO_DA_GOVERNANCA}/resumo` : `${CAMINHO_DA_GOVERNANCA}/resumo?${resto}`, esquemaRespostaResumoDaGovernanca, signal)
```

```mutacao
arquivo: apps/web/src/api/governanca.ts
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › o endereço com o estado abre já filtrado
  queryKey: [...CHAVE_DA_GOVERNANCA, 'resumo', estado],
- queryFn: ({ pageParam, signal }) => lerPaginaDoResumo(pageParam, signal, estado),
+ queryFn: ({ pageParam, signal }) => lerPaginaDoResumo(pageParam, signal),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › escolher "Aprovados" chama
- const lista = estado === undefined ? todos : doEstado
+ const lista = todos
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › escolher "Aprovados" chama
- const numeros = todos.data.pages.at(-1)?.numeros ?? { geradoPorIa: 0, aprovadoPorPessoa: 0, rejeitado: 0, esperando: 0 }
+ const numeros = (lista.data ?? todos.data).pages.at(-1)?.numeros ?? { geradoPorIa: 0, aprovadoPorPessoa: 0, rejeitado: 0, esperando: 0 }
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › sem estado no endereço, a tela lê só
- const doEstado = useInfiniteQuery({ ...consultaResumoPorEstado(estado ?? 'pendente'), enabled: estado !== undefined })
+ const doEstado = useInfiniteQuery({ ...consultaResumoPorEstado(estado ?? 'pendente') })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › "Todos" tira o estado do endereço
- const filtrar = (novo: FiltroDeEstado): void => navegar(enderecoComParametro(caminho, busca, 'estado', novo === 'todos' ? undefined : novo), { replace: true })
+ const filtrar = (novo: FiltroDeEstado): void => navegar(enderecoComParametro(caminho, busca, 'estado', novo), { replace: true })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › "Todos" tira o estado do endereço
- const filtrar = (novo: FiltroDeEstado): void => navegar(enderecoComParametro(caminho, busca, 'estado', novo === 'todos' ? undefined : novo), { replace: true })
+ const filtrar = (novo: FiltroDeEstado): void => navegar(enderecoComParametro(caminho, busca, 'estado', novo === 'todos' ? undefined : novo))
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › com o filtro lendo
- {lista.isPending && <EstadoCarregando rotulo="Carregando a lista…" />}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › o filtro que falha mostra o erro
- {lista.isError && lista.data === undefined && <EstadoErro erro={lista.error} tentando={lista.isFetching} aoTentarDeNovo={() => void lista.refetch({ cancelRefetch: false })} />}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › a falha de "Carregar mais" não apaga
- {lista.isError && lista.data === undefined && <EstadoErro erro={lista.error} tentando={lista.isFetching} aoTentarDeNovo={() => void lista.refetch({ cancelRefetch: false })} />}
+ {lista.isError && <EstadoErro erro={lista.error} tentando={lista.isFetching} aoTentarDeNovo={() => void lista.refetch({ cancelRefetch: false })} />}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › com o filtro lendo
- {lista.data !== undefined && (
+ {true && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › a falha de "Carregar mais" de um filtro
- {lista.isError && (
+ {todos.isError && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › o filtro que não acha nada diz
- estado === undefined ? (
+ true ? (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › "Carregar mais" de um filtro lê
- {lista.hasNextPage && (
+ {todos.hasNextPage && (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › "Carregar mais" de um filtro lê
- <Botao variante="secundario" onClick={() => void lista.fetchNextPage()} disabled={lista.isFetchingNextPage}>
+ <Botao variante="secundario" onClick={() => void todos.fetchNextPage()} disabled={lista.isFetchingNextPage}>
  {lista.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › escolher "Aprovados" chama
- <Segmentado rotulo="Estado" rotuloVisivel opcoes={OPCOES_DO_ESTADO} valor={estado ?? 'todos'} aoMudar={filtrar} emDuasColunasNoCelular />
+ <Segmentado rotulo="Estado" rotuloVisivel opcoes={OPCOES_DO_ESTADO} valor="todos" aoMudar={filtrar} emDuasColunasNoCelular />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › o filtro "Estado" põe as quatro opções
- <Segmentado rotulo="Estado" rotuloVisivel opcoes={OPCOES_DO_ESTADO} valor={estado ?? 'todos'} aoMudar={filtrar} emDuasColunasNoCelular />
+ <Segmentado rotulo="Estado" rotuloVisivel opcoes={OPCOES_DO_ESTADO} valor={estado ?? 'todos'} aoMudar={filtrar} />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/textos-da-governanca.ts
teste: apps/web/src/areas/coordenacao/textos-da-governanca.test.ts › o estado do endereço vale só
  const valor = new URLSearchParams(busca).get('estado')
- return ESTADOS_DE_ENTREGA.find((estado) => estado === valor)
+ return (valor ?? undefined) as EstadoDeEntrega | undefined
```

```mutacao
arquivo: apps/web/src/componentes/Segmentado.tsx
teste: apps/web/src/componentes/Segmentado.test.tsx › com rótulos longos
  aria-labelledby={rotuloVisivel ? idDoRotulo : undefined}
- className={`min-w-0 gap-1 rounded-controle border-2 border-borda bg-fundo p-1 ${emDuasColunasNoCelular ? 'grid grid-cols-2 md:flex' : 'flex'}`}
+ className={`min-w-0 gap-1 rounded-controle border-2 border-borda bg-fundo p-1 ${'flex'}`}
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › a falha de "Carregar mais" de um filtro fica ao lado
- <Botao variante="secundario" onClick={() => void lista.fetchNextPage()} disabled={lista.isFetchingNextPage}>
+ <Botao variante="secundario" onClick={() => void todos.fetchNextPage()} disabled={lista.isFetchingNextPage}>
  Tentar de novo
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › dois cliques seguidos em "Carregar mais" de um filtro
- <Botao variante="secundario" onClick={() => void lista.fetchNextPage()} disabled={lista.isFetchingNextPage}>
+ <Botao variante="secundario" onClick={() => void lista.fetchNextPage()}>
  {lista.isFetchingNextPage ? 'Carregando…' : 'Carregar mais'}
```

```mutacao
arquivo: apps/web/src/api/governanca.ts
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › a resposta do filtro antigo, mesmo atrasada
  return infiniteQueryOptions({
- queryKey: [...CHAVE_DA_GOVERNANCA, 'resumo', estado],
+ queryKey: [...CHAVE_DA_GOVERNANCA, 'resumo', 'filtrado'],
  queryFn: ({ pageParam, signal }) => lerPaginaDoResumo(pageParam, signal, estado),
```

```mutacao
arquivo: apps/web/src/api/governanca.ts
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › "Carregar mais" de um filtro lê
  queryFn: ({ pageParam, signal }) => lerPaginaDoResumo(pageParam, signal, estado),
  initialPageParam: undefined as string | undefined,
- getNextPageParam: (ultima) => ultima.proxima,
+ getNextPageParam: () => undefined,
```

```mutacao
arquivo: apps/web/src/api/governanca.ts
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › escolher "Aprovados" chama
  pendente: consultaDoResumoDoEstado('pendente'),
- aprovada: consultaDoResumoDoEstado('aprovada'),
+ aprovada: consultaDoResumoDoEstado('pendente'),
  rejeitada: consultaDoResumoDoEstado('rejeitada'),
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Governanca.tsx
teste: apps/web/src/areas/coordenacao/Governanca.test.tsx › o filtro que falha mostra o erro
- {lista.isError && lista.data === undefined && <EstadoErro erro={lista.error} tentando={lista.isFetching} aoTentarDeNovo={() => void lista.refetch({ cancelRefetch: false })} />}
+ {lista.isError && lista.data === undefined && <EstadoErro erro={lista.error} tentando={lista.isFetching} aoTentarDeNovo={() => void todos.refetch({ cancelRefetch: false })} />}
```

## Plano do Postgres (`EXPLAIN`)

Medido em 17/10/2026, no banco de teste, numa escola sintética de volume (a "vitrine cheia", só dado inventado): 60.004 entregas
do ano em curso, em duas turmas de uma série com dois professores (35.883 aprovadas, 24.001 esperando, 120 rejeitadas).
`EXPLAIN (ANALYZE, BUFFERS)` da consulta que `GET /v1/governanca/resumo?estado=rejeitada` faz hoje (`governanca.repository.ts`,
grupo mínimo da D45, `limit 51`, `order by id desc`):

- **Tempo: 30,2 s** (planejamento 1,1 ms), 65 milhões de buffers lidos, sort em disco. A leitura de índices está certa: `turma` e
  `serie` por `escola_id` e `ano_letivo_id`, e `entrega_turma_idx` com o estado na condição do índice (120 linhas candidatas, nenhuma
  leitura sequencial da tabela).
- **O custo é a subconsulta do grupo mínimo, e não o filtro por estado.** O `SubPlan 1` (quantos professores distintos a série
  tem) roda **uma vez por entrega candidata** (`loops=120`) e cada vez lê as 60.004 entregas da série, junta com turma, artefato e
  atividade e ordena em disco: cerca de 250 ms por candidata. O custo é candidatas × entregas da série, ou seja, quadrático.
- **O filtro não cria o custo, mas o põe no caminho de toda consulta.** A subconsulta é a mesma de antes do filtro. Com `estado=`, o
  plano lê as candidatas pelo índice e precisa avaliar todas antes de ordenar. Em `pendente` (24.001 candidatas) a conta é de
  24.001 × 250 ms, cerca de 100 minutos nesse volume: **conta, não medida**; a medição de `pendente` e a da lista sem filtro foram
  interrompidas por não terminarem em tempo útil, e o plano da lista sem filtro não foi lido.
- **O que a tela faz com isso:** nada que a trave. O filtro só pede a lista; a tela não calcula nada. Com os volumes que a D25
  prevê (até dez escolas, em torno de novecentos alunos cada) a conta é de ordens de grandeza menor, mas o crescimento é quadrático
  e uma escola com anos de uso o sente primeiro no filtro "Esperando o professor". Fica no `TODO.md`, com a saída proposta: calcular
  as séries com dois ou mais professores uma vez (agrupar por `serie_id` e juntar), em vez de subconsulta por linha. É mudança da API
  (A5), fora desta tarefa, e o `infra-guardian` não está entre os revisores dela.

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| conformidade-reviewer (1ª) | O apoio de "Rejeitado" diz "O professor recusou, com justificativa", mas a linha rejeitada chega sem o motivo (`motivo: ''`); vale frase dizendo que a justificativa está na auditoria | `TODO.md`, item "O apoio de "Rejeitado" diz que o professor recusou "com justificativa", mas a linha chega sem o motivo": os textos de hoje não mudam nesta tarefa (Contexto necessário da 10.0), e a linha sem motivo vem da A5 |
| conformidade-reviewer (1ª), frontend-reviewer (1ª), revisor-geral (1ª) | A 1366 × 768 a foto termina no filtro "Estado" e a tabela fica abaixo da dobra | Recusada nesta tarefa: o frontend-reviewer aprovou (a página não rola e a tabela rola dentro, como a tarefa exige, "1366 × 768 e 360 px"); a Mesa fotografa a tabela na próxima rodada e o Validador a vê no `/validar` |
| frontend-reviewer (1ª) | A coluna "Decisão" fica estreita a 1366 px e "ESPERANDO O PROFESSOR" quebra em três linhas; dar largura mínima à coluna ou o consumo ao lado só de 1280 px | `TODO.md`, item "Registros › IA a 1366 px: a coluna "Decisão" fica estreita…": mexe na largura de uma coluna que o e2e de 1366 × 768 mede, e o revisor disse que fica legível |
| frontend-reviewer (1ª) | "tokens" e "execuções" no consumo são jargão para quem coordena | `/validar` e `/retro`, como o próprio revisor disse; o texto é o de hoje e a tarefa os mantém |
| frontend-reviewer (1ª) | Nas fotos do celular a barra de abas aparece no meio da página | Recusada: o próprio revisor diz que é efeito da captura de página inteira, e não defeito do código |
| revisor-geral (1ª), test-engineer (1ª) | O `EXPLAIN` mediu 30,2 s e deve ir ao `infra-guardian` e ao Joaquim | `TODO.md`, item "A lista de "O que a IA gerou" com `?estado=` custa candidatas × entregas da série" (completado com os dois testes de integração que o conserto não pode perder); a Mesa leva ao Orquestrador no relatório. Não é desta tarefa: o repository é da A5 |
| test-engineer (1ª) | `Governanca.test.tsx` e `Segmentado.test.tsx` provam as duas colunas só pelas classes; a prova real é o e2e | Nada a fazer: o revisor diz que "está correto assim; é só para registro" |
| revisor-geral (2ª) | `e2e/governanca.spec.ts`, caso da resposta atrasada: os ouvintes de `requestfinished` e `requestfailed` nunca saem da página; tirar os dois com `page.off(...)` | `TODO.md`, item "A espera da resposta atrasada, em `e2e/governanca.spec.ts` e em `Governanca.test.tsx`": hoje a promessa resolve uma vez e nada muda, e mexer agora caduca `test-engineer` e `revisor-geral` |
| test-engineer (2ª) | Mesmo caso: `requestfinished` chega antes de a página processar a resposta; esperar um quadro ou voltar a "Aprovados" antes de conferir "Esperando o professor" ("falso verde, nunca falso vermelho"; a chave por estado está provada no componente) | `TODO.md`, no mesmo item acima (as duas mexem na mesma espera) |
| test-engineer (2ª) | `Governanca.test.tsx`, caso da resposta atrasada: sobrou um `setTimeout(resolver, 50)` com o mesmo tipo de corrida; esperar a chamada da rede falsa ser resolvida | `TODO.md`, no mesmo item acima, para a mesma passada em `Governanca.test.tsx` |

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->


## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 12:20:12 | 2026-10-17 12:21:13 | `conformidade-reviewer` | 1 | APROVADO | a15efad60d3d78771 |
| 2026-10-17 12:20:07 | 2026-10-17 12:21:29 | `frontend-reviewer` | 1 | APROVADO | a89879c4b7e6695a3 |
| 2026-10-17 12:20:20 | 2026-10-17 12:21:38 | `revisor-geral` | 1 | APROVADO | abfd815d1aaa3ef69 |
| 2026-10-17 12:20:16 | 2026-10-17 12:22:25 | `test-engineer` | 1 | REPROVADO | a82000a98159bf0c8 |
| 2026-10-17 12:41:28 | 2026-10-17 12:41:58 | `revisor-geral` | 2 | APROVADO | a3089e3aac20dc03d |
| 2026-10-17 12:41:20 | 2026-10-17 12:42:50 | `test-engineer` | 2 | APROVADO | a2b73babbfd9b0a74 |
