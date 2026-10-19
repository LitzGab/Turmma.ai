# Tarefa 5.0 — Criados: o que a professora já gerou, por turma, com filtros

**Funcionalidade:** telas-do-professor · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `tenancy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A professora tem um quarto lugar, Criados, com tudo o que gerou, agrupado por turma e filtrado por tipo, turma e
estado. A lista sai de Ferramentas. Nenhum dado novo: é a leitura de `GET /v1/artefatos` de hoje.

## Contexto necessário

- `techspec.md` seções 2, 4, 6 e 9 (Criados: grade, filtros à direita do título, grupos por turma em `Linha`);
  `prd.md` RF1, RF2, RF12 e RF22; `mockup.md` 10.1
- Regra 10, itens 3 a 6: o filtro de turma vai ao servidor, e o id de outra escola responde como o inexistente
- Código: `Ferramentas.tsx` (linhas 80 a 113, a lista de hoje, e `SELO_DA_ENTREGA`); `api/artefatos.ts`
  (`consultaArtefatos`); `caminhos.ts`; `areas/navegacao.ts`; `componentes/itens-da-lateral.tsx`

## Subtarefas

- [x] 5.1 — `/professor/criados`: `ROTAS_DO_PROFESSOR.criados`, a rota em `rotas.tsx` por `lazy()`, o quarto lugar na
  lateral e na barra de baixo, e o ícone (no arquivo de lugares da X1)
- [x] 5.2 — `Criados.tsx` e `criados.ts`: um grupo por turma e disciplina, cada linha com tipo, data e, na versão
  adaptada, o estado da decisão; filtros `?tipo=`, `?turma=` e `?estado=` no endereço (trocar usa `replace`); "Ver
  mais". A turma vai ao servidor: `consultaArtefatos` ganha o parâmetro, com a chave começando por `artefatos`. Tipo e
  estado filtram o que já foi lido. A 360 px os filtros viram o botão "Filtrar", com diálogo
- [x] 5.3 — "O que você já gerou" sai de Ferramentas; a fixture `professor/criados.ts` (`abrirOQueFoiGerado`) aponta
  para Criados
- [x] 5.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Criados.tsx`, `criados.ts`, `criados.test.ts`, `Criados.test.tsx` | novo |
| `apps/web/src/areas/professor/rotas.tsx`, `Ferramentas.tsx`, `apps/web/src/caminhos.ts` | alterado |
| `apps/web/src/api/artefatos.ts`, `apps/web/src/areas/navegacao.ts`, `apps/web/src/areas/navegacao.test.ts` | alterado |
| `apps/web/src/componentes/itens-da-lateral.tsx` | alterado (o ícone de Criados) |
| `e2e/professor-criados.spec.ts` | novo |
| `e2e/__fixtures__/professor/criados.ts`, `e2e/professor-ferramentas.spec.ts`, `e2e/areas.spec.ts` | alterado (`ITENS_DO_PROFESSOR`; `/professor/criados` entra nos laços de papel errado) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| os filtros | unidade | tipo, turma e estado juntos; a versão adaptada tem estado e o original não (com "Esperando você" ativo, o original não passa); valor desconhecido no endereço cai em "todos" |
| estados | componente | carregando; erro com "Tentar de novo"; vazio ("Nada gerado ainda", com o caminho para Ferramentas); com dado, agrupado por turma |
| filtro sem resultado | componente | com tipo ou estado sem resultado e mais páginas, a tela diz "até aqui" e mantém "Ver mais"; sem mais páginas, diz "Nada com estes filtros", com "Limpar filtros" |
| o filtro de turma vai ao servidor | componente | trocar a turma faz uma leitura com `turmaId`; trocar o tipo não faz nenhuma |
| o voltar devolve os filtros | e2e | filtrar, abrir um documento, voltar pelo histórico: os filtros e a lista voltam |
| os lugares | e2e | Início, Turmas, Ferramentas e Criados, nesta ordem, nas três larguras; a barra de baixo tem os quatro |
| isolamento | e2e | trocar de escola esvazia Criados; a turma de B tem ao menos um artefato gerado, e com `?turma=<turma de B>` o título dele não aparece e a tela mostra o mesmo que um id inexistente (regra 10, itens 4 e 6). Mutação: o servidor deixar de filtrar a turma pela escola do token deixa o e2e vermelho |
| recomeço | e2e | a segunda pessoa na mesma aba não vê a lista nem os filtros da primeira; resposta atrasada da lista anterior não entra. Concorrência e log não se aplicam: só leitura |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`), e o filtro por consulta de
  `Ferramentas`, hoje coberto em `e2e/professor-assistente.spec.ts › Ferramentas (D74)…` (lista com os quatro estados)
- e2e: esse caso se divide: o catálogo fica em `professor-ferramentas.spec.ts`, a lista passa a `professor-criados.spec.ts`
  sem mudar a asserção. A 5.0 e a 9.0 não correm juntas: as duas editam `e2e/areas.spec.ts`
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Criados.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-criados.spec.ts e2e/areas.spec.ts`
- Telas: `professora`, `/professor/criados`, `--clicar 'role=link[name=/Criados/]'`. Mockup: `/professor/criados`

## Fora do escopo desta tarefa

Busca, renomear e apagar na lista; os selos "Do arquivo" e "Só você vê"; o filtro "Para aprovar" do original (o
original não passa por aprovação: só a versão adaptada e "Aplicar à turma" são atos); o documento aberto (6.0);
Ferramentas (7.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `consultaArtefatos` deixou de ser um objeto e virou a função `consultaArtefatos(turmaId?)`; quem a usava sem turma (`CartaoDeFerramenta.tsx`) a chama sem argumento | a subtarefa 5.2 manda a turma ao servidor e a chave de cada turma começar por `artefatos`: o parâmetro precisa de função, e a chave sem turma continua a mesma de antes | `techspec.md` §4 (consulta com a turma no servidor); a chave `[...CHAVE_DOS_ARTEFATOS, 'lista']` não mudou |
| O ícone de Criados é ilustrado e mora em `componentes/icones/lugares.tsx` (a pasta amarela com duas folhas), e não em `componentes/itens-da-lateral.tsx`, que o quadro de arquivos previstos citava | o arquivo de lugares da X1 é onde os ícones dos quatro papéis moram (a própria subtarefa 5.1 diz "no arquivo de lugares da X1"); `itens-da-lateral.tsx` só os lê pelo nome e não mudou | `techspec.md` §2 (lugares); `docs/interface.md` 11.1 |
| O `li` de cada documento leva `data-artefato` (e `data-artefato-id`), e a turma vai em `sr-only` na linha, além de ser o título do grupo | os e2e que abrem um documento (`a2-assistente`, `professor-artefato`, `roteiro-da-demonstracao`, `casca-no-celular`) localizam por `[data-artefato]` e afirmam "Atividade objetiva · {turma}"; manter os dois preserva a asserção, como manda a seção "Como testar" | `techspec.md` §9 (a lista de Criados) |
| `e2e/__fixtures__/assistente.ts`: a rota simulada `GET /v1/artefatos` passou a honrar `?turmaId=` (só restringe, como a API) | sem isso o filtro de turma no e2e simulado não teria o que provar; o isolamento de verdade está no caso com a API real | `techspec.md` §6 (isolamento) |
| `e2e/acesso-suspenso.spec.ts` (caso "duas abas"): o caso abre as duas abas em Ferramentas, pede Criados, entra pela API e usa a primeira carga sem a rede lenta do perfil (`carregarSemRedeLenta`); a rede lenta da segunda aba caiu de 1,5 s para 0,5 s | o caso é alterado pela troca de Ferramentas por Criados e o portão reprova o e2e alterado acima de 15 s; a lentidão forçada continua (a espera por nenhuma requisição a caminho é o que garante a ordem), e o que o caso prova vem depois da primeira carga | `techspec.md` §9 (Como testar); `.claude/rules/40-testes.md` (portão da tarefa) |
| Um caso só para a troca de escola (a lista e a turma da escola A, ambas, na B), em vez de dois; e o e2e fica em 1 180 casos, 197 ou menos por fatia, no teto de `tools/ci/esteira.test.ts` (60% de 45 min, 7 s por caso) com as seis fatias que esta árvore tem | a junção foi feita quando um caso a mais por fatia reprovava a esteira; a sétima fatia da spec (`52f43fe`) entra no encontro e tira o aperto, e o caso junto continua inteiro (cabe nos 15 s), sem motivo para desfazer. Esta tarefa não acrescenta caso de e2e: o recomeço da resposta atrasada saiu para `Criados.test.tsx` | `tools/ci/esteira.test.ts`; `docs/runbook.md` |
| `Conversa.tsx` ("Usar a ferramenta…": "Salva em Criados…"), `Artefato.tsx` (o vazio do artefato indisponível: "O que você gerou está em Criados.") e o comentário de `Ferramenta.tsx` deixam de mandar a professora para Ferramentas | a 5.3 tirou de Ferramentas o que foi gerado, e a 4.0, dona da Conversa, já fechou com o texto antigo; os arquivos não estão em "Arquivos previstos" (ordem de correção 1, itens 1 e 2 e R2). Nenhum e2e cita as frases | `docs/interface.md` 11.1 (D74) |
| `apps/web/src/__fixtures__/tela.tsx`: a função de `responderPor` recebe o caminho da própria chamada | `instalar`, em `Criados.test.tsx`, lia a turma da última chamada da rede, e a leitura dos vínculos no meio o desviaria (R5); quem passa função sem parâmetro continua igual | `.claude/rules/40-testes.md` |
| `Criados.tsx`: os grupos só aparecem depois de `carregando` acabar, e as três escolhas dos filtros viraram `escolherTipo`, `escolherTurma` e `escolherEstado` | com os vínculos ainda sem resposta, a lista já lida pintava todos os grupos como "Outra turma" (o que o `carregando` queria evitar); os três `aoEscolher` repetidos nos menus e no diálogo viraram um só cada (R3) | `techspec.md` §9 (estados da lista) |

## Mutações

Cada bloco é uma cláusula nova desta tarefa. O portão aplica o bloco, roda o teste citado, exige vermelho e restaura
(`tools/processo/mutacoes.ts`). Os de `lerFiltros`, `enderecoComFiltros`, `filtrosLigados`, `filtrar`, `agruparPorTurma` e
`rotuloDeVerDocumentos` são as regras puras dos filtros; os de `Criados.tsx` e `artefatos.ts`, a turma no servidor, os
estados da lista e o foco; o de `navegacao.ts`, o quarto lugar; o de `lugares.tsx`, o ícone; o de `artefato.repository.ts`, o
isolamento visto da tela (a lista inteira sem escopo mostra o documento de outra escola e quebra a contagem do e2e com a API
de verdade); o de `rotas.tsx`, a rota. Os dois últimos são e2e e reconstroem a imagem.

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › sem parâmetro, ou com valor que a tela não conhece
-    tipo: ehTipo(tipo) ? tipo : 'todos',
+    tipo: (tipo ?? 'todos') as TipoFiltrado,
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › sem parâmetro, ou com valor que a tela não conhece
-    turma: turma !== null && UUID.test(turma) ? turma.toLowerCase() : undefined,
+    turma: turma !== null ? turma.toLowerCase() : undefined,
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › lê os três filtros do endereço
-    turma: turma !== null && UUID.test(turma) ? turma.toLowerCase() : undefined,
+    turma: turma !== null && UUID.test(turma) ? turma : undefined,
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › sem parâmetro, ou com valor que a tela não conhece
-    estado: ehEstado(estado) ? estado : 'todos',
+    estado: (estado ?? 'todos') as EstadoFiltrado,
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › põe o filtro, troca o que já estava
-    if (valor === undefined || valor === 'todos') parametros.delete(nome)
+    if (valor === undefined) parametros.delete(nome)
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › põe o filtro, troca o que já estava
-  if ('turma' in mudanca) definir(PARAMETRO_DA_TURMA, mudanca.turma)
+  if (mudanca.turma !== undefined) definir(PARAMETRO_DA_TURMA, mudanca.turma)
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › mexe só no filtro que a mudança cita
-  if ('tipo' in mudanca) definir(PARAMETRO_DO_TIPO, mudanca.tipo)
+  definir(PARAMETRO_DO_TIPO, mudanca.tipo)
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › conta cada um dos três filtros
-  return Number(filtros.tipo !== 'todos') + Number(filtros.turma !== undefined) + Number(filtros.estado !== 'todos')
+  return Number(filtros.tipo !== 'todos') + Number(filtros.estado !== 'todos')
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › o tipo deixa passar só os desse tipo
-  return artefatos.filter((artefato) => (filtros.tipo === 'todos' || artefato.tipo === filtros.tipo) && (filtros.estado === 'todos' || artefato.entrega?.estado === filtros.estado))
+  return artefatos.filter((artefato) => filtros.estado === 'todos' || artefato.entrega?.estado === filtros.estado)
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › o estado é o da decisão
-  return artefatos.filter((artefato) => (filtros.tipo === 'todos' || artefato.tipo === filtros.tipo) && (filtros.estado === 'todos' || artefato.entrega?.estado === filtros.estado))
+  return artefatos.filter((artefato) => (filtros.tipo === 'todos' || artefato.tipo === filtros.tipo) && (filtros.estado === 'todos' || artefato.entrega === null || artefato.entrega.estado === filtros.estado))
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › um grupo por turma e disciplina
-    const chave = `${artefato.turmaId}:${artefato.disciplinaId}`
+    const chave = artefato.turmaId
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › sem o nome da disciplina
-    grupos.set(chave, { titulo: turma === undefined ? TITULO_DA_TURMA_SEM_NOME : disciplina === undefined ? turma : `${turma} · ${disciplina}`, itens: [artefato] })
+    grupos.set(chave, { titulo: turma === undefined ? artefato.turmaId : disciplina === undefined ? turma : `${turma} · ${disciplina}`, itens: [artefato] })
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › sem o nome da disciplina
-    grupos.set(chave, { titulo: turma === undefined ? TITULO_DA_TURMA_SEM_NOME : disciplina === undefined ? turma : `${turma} · ${disciplina}`, itens: [artefato] })
+    grupos.set(chave, { titulo: turma === undefined ? TITULO_DA_TURMA_SEM_NOME : disciplina === undefined ? `${turma} · ${artefato.disciplinaId}` : `${turma} · ${disciplina}`, itens: [artefato] })
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › diz quantos documentos a lista tem
-  if (quantos === 0) return 'Ver a lista'
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › diz quantos documentos a lista tem
-  return `Ver ${String(quantos)}${maisPaginas ? ' ou mais' : ''} ${quantos === 1 && !maisPaginas ? 'documento' : 'documentos'}`
+  return `Ver ${String(quantos)}${maisPaginas ? ' ou mais' : ''} ${quantos === 1 ? 'documento' : 'documentos'}`
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/Criados.test.tsx › com dado: um grupo por turma e disciplina
-export const SELO_DA_ENTREGA: Readonly<Record<EstadoDeEntrega, string>> = { pendente: 'Esperando você', aprovada: 'Aprovada', rejeitada: 'Rejeitada' }
+export const SELO_DA_ENTREGA: Readonly<Record<EstadoDeEntrega, string>> = { pendente: 'Pendente', aprovada: 'Aprovada', rejeitada: 'Rejeitada' }
```

```mutacao
arquivo: apps/web/src/api/artefatos.ts
teste: apps/web/src/areas/professor/Criados.test.tsx › trocar a turma faz uma leitura com
-      if (turmaId !== undefined) consulta.set('turmaId', turmaId)
```

```mutacao
arquivo: apps/web/src/api/artefatos.ts
teste: apps/web/src/areas/professor/Criados.test.tsx › trocar a turma faz uma leitura com
-    queryKey: turmaId === undefined ? [...CHAVE_DOS_ARTEFATOS, 'lista'] : [...CHAVE_DOS_ARTEFATOS, 'lista', turmaId],
+    queryKey: [...CHAVE_DOS_ARTEFATOS, 'lista'],
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › trocar a turma faz uma leitura com
-  const artefatos = useInfiniteQuery(consultaArtefatos(filtros.turma))
+  const artefatos = useInfiniteQuery(consultaArtefatos())
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › com mais páginas por ler, diz "até aqui"
-        {lido && visiveis.length === 0 && (lidos.length > 0 || ligados > 0) && !artefatos.hasNextPage && (
+        {lido && visiveis.length === 0 && (lidos.length > 0 || ligados > 0) && (
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › a turma do endereço que a professora não tem
-        {lido && visiveis.length === 0 && lidos.length === 0 && !artefatos.hasNextPage && ligados === 0 && (
+        {lido && visiveis.length === 0 && lidos.length === 0 && !artefatos.hasNextPage && (
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › sem mais páginas, diz "Nada com estes filtros"
     // O botão que limpou sai da tela com o resultado novo: o foco vai para o título (regra 50, item 11).
-    tituloDaTela.current?.focus()
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › com dado: um grupo por turma e disciplina
-                        {...(artefato.entrega === null ? {} : { fim: <Estado familia={FAMILIA_DA_ENTREGA[artefato.entrega.estado]}>{SELO_DA_ENTREGA[artefato.entrega.estado]}</Estado> })}
+                        {...(artefato.entrega === null ? {} : {})}
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › com dado: um grupo por turma e disciplina
-                            {turma !== undefined && <span className="sr-only"> · {turma}</span>} · {formatarDataHora(artefato.criadoEm)}
+                            {' · '}{formatarDataHora(artefato.criadoEm)}
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › trocar o tipo no menu muda a lista e o endereço
-    navegar(enderecoComFiltros(caminho, busca, mudanca), { replace: true })
+    navegar(enderecoComFiltros(caminho, busca, mudanca))
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › com mais páginas por ler, diz "até aqui"
-    if (link) link.focus()
+    if (link) link.blur()
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › "Limpar filtros" do diálogo fica desligado sem filtro
-            <Botao variante="secundario" onClick={() => mudar(SEM_FILTROS)} disabled={ligados === 0}>
+            <Botao variante="secundario" onClick={() => mudar(SEM_FILTROS)}>
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › os três menus viram o botão "Filtrar"
-            {ligados === 0 ? 'Filtrar' : `Filtrar (${String(ligados)})`}
+            Filtrar
```

```mutacao
arquivo: apps/web/src/areas/navegacao.ts
teste: apps/web/src/areas/navegacao.test.ts › W2: os quatro lugares da coordenação
-    { rotulo: 'Criados', caminho: ROTAS.criados, icone: { lugar: 'criados' } },
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx
-      <path d="M4 14a5 5 0 0 1 5-5h9a4 4 0 0 1 3.2 1.6l2 2.4H39a5 5 0 0 1 5 5V38a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" className="fill-amarelo" />
+      <path d="M4 14a5 5 0 0 1 5-5h9a4 4 0 0 1 3.2 1.6l2 2.4H39a5 5 0 0 1 5 5V38a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z" className="fill-azul" />
```

```mutacao
arquivo: apps/api/src/artefato/artefato.repository.ts
teste: e2e/professor-criados.spec.ts › isolamento \(regra 10\)
-      .where(and(this.#noAlcance(), condicao))
+      .where(and(condicao))
```

```mutacao
arquivo: apps/web/src/areas/professor/rotas.tsx
teste: e2e/professor-criados.spec.ts › o voltar devolve os filtros
-        <Route path={ROTAS_DO_PROFESSOR.criados} component={Criados} />
```

```mutacao
arquivo: apps/web/src/areas/professor/criados.ts
teste: apps/web/src/areas/professor/criados.test.ts › mexe só no filtro que a mudança cita
-  if ('estado' in mudanca) definir(PARAMETRO_DO_ESTADO, mudanca.estado)
+  definir(PARAMETRO_DO_ESTADO, mudanca.estado)
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › com a lista já lida e os vínculos sem resposta
-  const carregando = artefatos.isPending || (vinculos.isPending && !artefatos.isError)
+  const carregando = artefatos.isPending
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › com a lista com erro e os vínculos sem resposta
-  const carregando = artefatos.isPending || (vinculos.isPending && !artefatos.isError)
+  const carregando = artefatos.isPending || vinculos.isPending
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › com a lista já lida e os vínculos sem resposta
-          {!carregando && porTurma.map((grupo) => (
+          {porTurma.map((grupo) => (
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › "Ver mais" que não traz documento visível
-    else if (document.activeElement === null || document.activeElement === document.body) tituloDaTela.current?.focus()
```

```mutacao
arquivo: apps/web/src/api/artefatos.ts
teste: apps/web/src/areas/professor/Criados.test.tsx › "Ver mais" com a turma filtrada
-      if (turmaId !== undefined) consulta.set('turmaId', turmaId)
+      if (turmaId !== undefined && pageParam === undefined) consulta.set('turmaId', turmaId)
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › trocar a turma faz uma leitura com
-    ...[...new Map(turmasDaProfessora(vinculosLidos).map((turma) => [turma.turmaId, turma.turmaNome] as const))].map(([id, rotulo]) => ({ id, rotulo })),
+    ...turmasDaProfessora(vinculosLidos).map((turma) => ({ id: turma.turmaId, rotulo: turma.turmaNome })),
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › a turma do endereço, enquanto os vínculos carregam
-rotuloDoDesconhecido={vinculos.isPending ? 'Turma' : 'Outra turma'}
+rotuloDoDesconhecido="Outra turma"
```

```mutacao
arquivo: apps/web/src/areas/professor/Criados.tsx
teste: apps/web/src/areas/professor/Criados.test.tsx › trocar a turma faz uma leitura com
-  const escolherTurma = (id: string): void => mudar({ turma: id === '' ? undefined : id })
+  const escolherTurma = (id: string): void => mudar({ turma: id })
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| tenancy-guardian (1ª) | Mutação só sobre `eq(artefato.escolaId, ...)` no teste de integração, se o repositório for mexido | Recusada: a tarefa não toca `artefato.repository.ts`; a cláusula já é coberta por `artefato.int.test.ts` |
| frontend-reviewer (1ª) | Barra de baixo a 360 px corta "FERRAMEN…"; reduzir o `tracking` ou a caixa-alta do rótulo | `TODO.md`: próxima tarefa que mexer em `BarraDeBaixo.tsx`; muda desenho de componente que a tarefa não toca |
| frontend-reviewer (1ª) | Título do documento corta no celular (`Linha.tsx:60`, `truncate`): duas linhas de título | `TODO.md`: é o desenho da `Linha` da D80 (`docs/interface.md` 10.2); a tarefa não toca `Linha.tsx` |
| frontend-reviewer (1ª) | A linha de Criados não tem marca de IA; conferir no documento aberto (regra 70, item 4a) | Tarefa 6.0, e o `/validar` |
| frontend-reviewer (1ª) | Registrar as três acima no `/validar` | Orquestrador, ao fechar a spec |
| revisor-geral (1ª) | `CartaoDeFerramenta.tsx:46` conflita com a 4.0 no encontro (`...consultaArtefatos` virou `...consultaArtefatos()`) | Orquestrador, no encontro das linhas (`tools/processo/linhas.ts`) |
| revisor-geral (1ª) | `tasks/prd-telas-do-professor/mockup.md:229` e `:273` ainda descrevem a lista dentro de Ferramentas | Tarefa 7.0 (Ferramentas); o `mockup.md` é da spec, não desta tarefa |
| revisor-geral (1ª) | Falha nos vínculos passa calada: todos os grupos viram "Outra turma" sem aviso | Muda comportamento e texto de tela: `TODO.md` e `/validar` |
| revisor-geral (1ª) | Texto "Nenhum documento seu tem este tipo, nesta turma e neste estado." cita os três filtros mesmo com um só ligado | Muda texto de tela e os testes que o citam: `TODO.md` e `/validar` |
| test-engineer (1ª) | O e2e do voltar põe o filtro por `irPara` (`pushState`), não pelo menu | Recusada: o `replace` já é provado no componente, e caso de e2e a mais bate no teto da esteira |
| test-engineer (1ª) | No primeiro caso de recomeço, trocar a coordenação por uma professora | Resolvida dentro do item 5 |
| revisor-geral (2ª), test-engineer (2ª) | A linha da divergência do e2e ainda citava a `entrarComSegundoFatorNaMesmaAba`, que a rodada 2 tirou de `casca.ts` | Aplicada ao copiar esta tabela: o trecho saiu da divergência |
| test-engineer (2ª) | `Criados.test.tsx`, caso "com a lista já lida e os vínculos sem resposta": a espera fixa de 50 ms pode deixar o caso verde com a mutação aplicada em máquina carregada; esperar um sinal de que a resposta chegou | `TODO.md`: a próxima tarefa que toca `Criados.test.tsx` (6.0 ou a validação) |
| test-engineer (2ª) | Comentário no caso de componente do recomeço dizendo que quem prova o `resetQueries` de `main.tsx` é o e2e | `TODO.md`, junto com a anterior |
| test-engineer (2ª) | Comentário no e2e do recomeço ligando o caso ao `staleTime` de 30 s (`cliente-de-consultas.ts:25`) | `TODO.md`, junto com a anterior |
| tenancy-guardian (2ª), revisor-geral (2ª) | O caso removido (coordenação em `/professor/criados` recebe "Página não encontrada") é guarda de papel: conferir que `e2e/areas.spec.ts` ainda cobre | `/validar`: o test-engineer já confirmou que `areas.spec.ts` percorre os itens do professor |
| frontend-reviewer (2ª) | Título do documento corta a 360 px (`Linha.tsx:60`) e a barra de baixo corta "FERRAMEN…" | `TODO.md` e `/validar`, como na ordem da rodada 1 |
| frontend-reviewer (2ª) | A linha de Criados não traz a marca de IA (regra 70, item 4a) | Tarefa 6.0 e `/validar` |
| frontend-reviewer (2ª) | Falha nos vínculos vira "Outra turma" sem aviso; o texto "Nenhum documento seu tem este tipo, nesta turma e neste estado." cita os três filtros com um só ligado | `TODO.md` e `/validar`, como na rodada 1 |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-19 07:27:10 | 2026-10-19 07:28:09 | `tenancy-guardian` | 1 | APROVADO | af640519818b65f0b |
| 2026-10-19 07:27:06 | 2026-10-19 07:28:27 | `frontend-reviewer` | 1 | APROVADO | aa3dc764fcf4acfc1 |
| 2026-10-19 07:27:18 | 2026-10-19 07:30:32 | `revisor-geral` | 1 | REPROVADO | ae9f1933ddafdc022 |
| 2026-10-19 07:27:14 | 2026-10-19 07:30:59 | `test-engineer` | 1 | REPROVADO | a31007c1df9cdf9e3 |
| 2026-10-19 07:56:58 | 2026-10-19 07:57:23 | `frontend-reviewer` | 2 | APROVADO | a0114572a4a90f0ba |
| 2026-10-19 07:57:05 | 2026-10-19 07:57:25 | `tenancy-guardian` | 2 | APROVADO | ac1b203ad44672d7c |
| 2026-10-19 07:57:24 | 2026-10-19 07:57:56 | `revisor-geral` | 2 | APROVADO | a9423a1c640b0f343 |
| 2026-10-19 07:57:15 | 2026-10-19 07:58:46 | `test-engineer` | 2 | APROVADO | a374da292b0107d7d |
