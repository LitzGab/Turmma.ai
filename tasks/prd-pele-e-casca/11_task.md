# Tarefa 11.0 — Toda tela aberta pela lateral mostra o título

**Funcionalidade:** pele-e-casca · **Depende de:** 5.0, 6.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O `h1` deixa de ser só para leitor de tela: toda tela aberta pela lateral mostra o título, com o texto de hoje, num
cabeçalho de 64 px, e a aba diz a tela. A conversa é a exceção.

## Contexto necessário

- `techspec.md` 9 (**Página**) e 10; `prd.md` RF12, RF23; `cenarios.md`: A44 e `esperarGovernanca` (parte B)
- `docs/interface.md` 9.3 e 11.2; `.claude/rules/50-frontend.md`, itens 2a e 5
- Código: `componentes/Tela.tsx` (`h1` `sr-only`, `objeto`); `titulo.ts`; as seis telas: `Estrutura.tsx:219` (`sr-only`,
  sem `h1` no carregando), `Professores.tsx:100` (o `h1` tem `ref`, `id` e `tabIndex`), `ListaDaTurma.tsx:139` e
  `Turma.tsx:87` ("Turma {nome}" e a série), `Turmas.tsx:148`, `MinhaTurma.tsx:60`

## Subtarefas

- [x] 11.1 — `Tela`: título visível em `t-titulo`, cabeçalho de no mínimo 64 px, ação à direita; larguras `conversa` 768,
  `leitura` 880 (nova), `formulario` 1040, `grade` 1200; `comMargem` com 32 px a partir de 768. Props novas:
  `tituloSoParaLeitor?` (a exceção da conversa), `idDoTitulo?` e `refDoTitulo?`. O resto não muda
- [x] 11.2 — As seis telas passam à `Tela`, **sem mudar o miolo**: o `h1` aparece também no carregando, no erro e no vazio;
  sem a turma lida, o título é "Turma". Passam `tituloSoParaLeitor` as cinco da conversa: `professor/Home.tsx`,
  `Conversa.tsx`, `Time.tsx`, `Tutor.tsx` e `aluno/Tutor.tsx`
- [x] 11.3 — O caso da `Tela` em `pecas-superficies.spec.ts` passa a 32 px; `material.spec.ts` ganha o `h1` medido e continua
  afirmando o padding do `main`, que ainda é o de hoje: o `main` é da 12.0
- [x] 11.4 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/Tela.tsx` e `Tela.test.tsx` | alterado e novo |
| `apps/web/src/areas/coordenacao/Estrutura.tsx`, `ListaDaTurma.tsx`, `Professores.tsx` | alterados |
| `apps/web/src/areas/professor/Turmas.tsx`, `Turma.tsx` | alterados |
| `apps/web/src/areas/aluno/MinhaTurma.tsx` | alterado |
| `apps/web/src/areas/professor/Home.tsx`, `Conversa.tsx`, `Time.tsx`, `Tutor.tsx`; `areas/aluno/Tutor.tsx` | alterados (uma prop) |
| `apps/web/src/areas/titulo-das-telas.test.tsx` | novo |
| `e2e/titulo-da-tela.spec.ts` | novo |
| `e2e/pecas-superficies.spec.ts` | alterado (A44) |
| `e2e/material.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| o título aparece | componente | `Tela` tem um `h1` com o texto dado e sem `sr-only`; `tituloSoParaLeitor` o esconde; `idDoTitulo` e `refDoTitulo` chegam ao `h1` |
| as seis telas, quatro estados | componente | cada uma, carregando (rede segurada), com erro, vazia e com dado, tem **um** `h1`, com o texto de hoje |
| a caixa do `h1` | e2e | em cada item da lateral de cada papel: largura e altura maiores que zero, fonte de 24 px, fora de `clip` e de posição absoluta; cabeçalho de 64 px ou mais. Medir, e não `toBeVisible` |
| a conversa é a exceção | e2e | no Início do professor, o `h1` existe e fica escondido, com o texto de hoje |
| o título da aba | e2e | `toHaveTitle` de cada item: "Governança · Turmma" e os demais |
| vazio e erro, na tela | e2e | `Turmas` com a rota interceptada (`areas › vazio e erro com a rota interceptada…`): `h1` medido; `professores` passa sem edição |
| margem única | e2e | `material`: `[data-tela]` com 0 px e `main` com o padding de hoje; fora da casca, `Tela` com 32 px a partir de 768 e 16 abaixo (A44) |
| nada rola de lado | e2e | `larguraExcedente` zero nos itens, a 360 px |

Recomeço, concorrência e log: `acesso-da-turma`, `pedidos` e `areas` seguem sem edição.

## Como testar

- Componente a copiar: `componentes/pedidos/ListaDePedidos.test.tsx`, com `prepararTela`, `redeFalsa().segurar()` e
  `renderizarTela` de `src/__fixtures__/tela.ts`
- e2e a copiar: o preparo e as listas `ITENS_DO_*` de `areas.spec.ts`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/Tela.test.tsx apps/web/src/areas/titulo-das-telas.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/titulo-da-tela.spec.ts e2e/material.spec.ts e2e/professores.spec.ts`
- Armadilha: o `h1` de `Professores` recebe o foco (`tabIndex={-1}`): a `Tela` precisa repassar o `ref`
- **Telas**: `coordenacao`, `/coordenacao/estrutura`, `/coordenacao/professores`, `/coordenacao/governanca`; `professora`,
  `/professor/turmas` e `text=Abrir a turma`; `aluno`, `/aluno/minha-turma`; `/galeria`. Mockup: `/professor`

## Fora do escopo desta tarefa

O `main` e a moldura de 1200 (12.0); recompor o miolo (X2 a X4); o voltar em linha própria.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| Arquivos fora dos "previstos": `areas/aluno/Atividades.tsx` e `componentes/meus-dados/MeusDados.tsx`, só o comentário | Os dois diziam que o `h1` "existe só para o leitor de tela, como o de toda aba", e com a `Tela` mostrando o título isso deixou de ser verdade: é o comentário que o próximo a mexer lê como regra. Nenhuma linha de código muda | `techspec.md` 9 (**Página**); `docs/interface.md` 11.2 |
| `Tela` continua aceitando `objeto`, mas a prop não muda mais nada: o cabeçalho (título, descrição abaixo e ação à direita) é o mesmo em tela de objeto e em aba. `descricao` passa a aparecer sem `objeto` | A Tech Spec manda mostrar o título em toda tela e diz que o resto das props não muda. Tirar `objeto` mexeria em seis telas que não são desta tarefa (`Atividade`, `Aprovar`, `Ferramenta`, `Artefato`, `DetalheDoPedido` e a galeria); a tarefa que recompuser cada uma o tira | `techspec.md` 9 (**Página**); `docs/interface.md` 11.2 |
| As seis telas ficam na largura `grade` (a de hoje), e não em `leitura` | "Sem mudar o miolo": a coluna de cada uma é da spec da área (X2 a X4), e `leitura` entra na `Tela` sem usuário nesta tarefa. O teto de 1200 só passa dos 1024 da casca quando a 12.0 liberar o `main` | `techspec.md` 9 (**Página**); `docs/interface.md` 9.3 e 11.2 |

## Mutações

Cada bloco tira uma cláusula da `Tela` ou da passagem das seis telas a ela e exige o teste de componente vermelho. A caixa
que o navegador desenha (24 px, 64 px de cabeçalho, margem de 32 px) é do e2e `titulo-da-tela.spec.ts`, que o portão da
tarefa roda porque a árvore o criou; aqui o que o `jsdom` sabe: o elemento, a classe e o atributo.

A `Tela`: o título visível.

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › o título dado, visível
-<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-titulo break-words text-tinta">
+<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="sr-only">
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › o título dado, visível
-<header className="flex min-h-16 min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-3">
+<header className="flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-3">
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › o título dado, visível
-{descricao !== undefined && <p className="mt-1 text-sm break-words text-sutil">{descricao}</p>}
+{false && <p className="mt-1 text-sm break-words text-sutil">{descricao}</p>}
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › o título dado, visível
 </div>
-{controles}
 </header>
```

A exceção da conversa.

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › esconde só o
-{tituloSoParaLeitor ? (
+{false ? (
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › esconde só o
 </h1>
-{controles}
 </>
```

O `idDoTitulo` e o `refDoTitulo`, no `h1` visível e no escondido.

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › nas duas formas
-<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-titulo break-words text-tinta">
+<h1 ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-titulo break-words text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › nas duas formas
-<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="sr-only">
+<h1 ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="sr-only">
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › poder receber o foco
-<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-titulo break-words text-tinta">
+<h1 id={idDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-titulo break-words text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › poder receber o foco
-<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-titulo break-words text-tinta">
+<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={undefined} className="t-titulo break-words text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › poder receber o foco
-<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="t-titulo break-words text-tinta">
+<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={-1} className="t-titulo break-words text-tinta">
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › também chega ao
-<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="sr-only">
+<h1 id={idDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="sr-only">
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › também chega ao
-<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={refDoTitulo === undefined ? undefined : -1} className="sr-only">
+<h1 id={idDoTitulo} ref={refDoTitulo} tabIndex={undefined} className="sr-only">
```

As quatro larguras, cada uma com o teto que a 9.3 dá.

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › limita a coluna a
-conversa: 'max-w-[768px]',
+conversa: 'max-w-[760px]',
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › limita a coluna a
-leitura: 'max-w-[880px]',
+leitura: 'max-w-[860px]',
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › limita a coluna a
-formulario: 'max-w-[1040px]',
+formulario: 'max-w-[1024px]',
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › limita a coluna a
-grade: 'max-w-[1200px]',
+grade: 'max-w-[1480px]',
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › sem largura, a tela é a grade
-export function Tela({ titulo, largura = 'grade', descricao, acoes, antes, comMargem = false, tituloSoParaLeitor = false, idDoTitulo, refDoTitulo, children }: PropsDaTela) {
+export function Tela({ titulo, largura = 'conversa', descricao, acoes, antes, comMargem = false, tituloSoParaLeitor = false, idDoTitulo, refDoTitulo, children }: PropsDaTela) {
```

A margem da página, fora da casca: 16 e 32 dos lados, 24 em cima e 32 embaixo, e nenhuma sem `comMargem`.

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › põe 16 px dos lados
-<div data-tela={largura} className={`mx-auto flex w-full min-w-0 flex-col gap-4 ${comMargem ? 'px-4 pt-6 pb-8 md:px-8' : ''} ${LARGURA_DA_TELA[largura]}`}>
+<div data-tela={largura} className={`mx-auto flex w-full min-w-0 flex-col gap-4 ${comMargem ? 'px-4 pt-6 pb-8 md:px-6' : ''} ${LARGURA_DA_TELA[largura]}`}>
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › põe 16 px dos lados
-<div data-tela={largura} className={`mx-auto flex w-full min-w-0 flex-col gap-4 ${comMargem ? 'px-4 pt-6 pb-8 md:px-8' : ''} ${LARGURA_DA_TELA[largura]}`}>
+<div data-tela={largura} className={`mx-auto flex w-full min-w-0 flex-col gap-4 ${comMargem ? 'px-4 pt-4 pb-8 md:px-8' : ''} ${LARGURA_DA_TELA[largura]}`}>
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › põe 16 px dos lados
-<div data-tela={largura} className={`mx-auto flex w-full min-w-0 flex-col gap-4 ${comMargem ? 'px-4 pt-6 pb-8 md:px-8' : ''} ${LARGURA_DA_TELA[largura]}`}>
+<div data-tela={largura} className={`mx-auto flex w-full min-w-0 flex-col gap-4 ${comMargem ? 'px-4 pt-6 pb-6 md:px-8' : ''} ${LARGURA_DA_TELA[largura]}`}>
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › põe 16 px dos lados
-<div data-tela={largura} className={`mx-auto flex w-full min-w-0 flex-col gap-4 ${comMargem ? 'px-4 pt-6 pb-8 md:px-8' : ''} ${LARGURA_DA_TELA[largura]}`}>
+<div data-tela={largura} className={`mx-auto flex w-full min-w-0 flex-col gap-4 ${true ? 'px-4 pt-6 pb-8 md:px-8' : ''} ${LARGURA_DA_TELA[largura]}`}>
```

A `Estrutura`: o título nos três ramos que existem, e não só no com dado.

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Estrutura > carregando
-<Tela titulo="Estrutura">
+<Tela titulo="Estrutura" tituloSoParaLeitor>
 <EstadoCarregando rotulo="Carregando a estrutura da escola…" />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Estrutura > com erro
-<Tela titulo="Estrutura">
+<Tela titulo="Estrutura" tituloSoParaLeitor>
 <EstadoErro erro={anos.error} tentando={anos.isFetching} aoTentarDeNovo={() => void anos.refetch({ cancelRefetch: false })} />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Estrutura > vazia
-<Tela titulo="Estrutura">
+<Tela titulo="Estrutura" tituloSoParaLeitor>
 <section className="flex min-w-0 flex-col gap-8">
```

`Professores`, `Turmas` e `Minha turma`: o título, a região que ele nomeia e, em `Professores`, o foco.

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Professores > carregando
-<Tela titulo="Professores" idDoTitulo={idDoTitulo} refDoTitulo={tituloDaTela}>
+<Tela titulo="Professores" idDoTitulo={idDoTitulo} refDoTitulo={tituloDaTela} tituloSoParaLeitor>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Professores > com dado
-<Tela titulo="Professores" idDoTitulo={idDoTitulo} refDoTitulo={tituloDaTela}>
+<Tela titulo="Professores" refDoTitulo={tituloDaTela}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Professores.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › entra na ordem de foco por código
-<Tela titulo="Professores" idDoTitulo={idDoTitulo} refDoTitulo={tituloDaTela}>
+<Tela titulo="Professores" idDoTitulo={idDoTitulo}>
```

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Turmas > carregando
-<Tela titulo="Turmas" idDoTitulo="titulo-turmas">
+<Tela titulo="Turmas" idDoTitulo="titulo-turmas" tituloSoParaLeitor>
```

```mutacao
arquivo: apps/web/src/areas/professor/Turmas.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Turmas > com dado
-<Tela titulo="Turmas" idDoTitulo="titulo-turmas">
+<Tela titulo="Turmas">
```

```mutacao
arquivo: apps/web/src/areas/aluno/MinhaTurma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Minha turma > carregando
-<Tela titulo="Minha turma" idDoTitulo="titulo-minha-turma">
+<Tela titulo="Minha turma" idDoTitulo="titulo-minha-turma" tituloSoParaLeitor>
```

```mutacao
arquivo: apps/web/src/areas/aluno/MinhaTurma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Minha turma > com dado
-<Tela titulo="Minha turma" idDoTitulo="titulo-minha-turma">
+<Tela titulo="Minha turma">
```

`Turma`, do professor: o título sem a turma lida, o título e a série com ela, e a turma que sai com a tela aberta.

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Turma, do professor > carregando
-<Tela titulo={nomeDaTurma} descricao={serieDaTurma} antes={voltar}>
+<Tela titulo={nomeDaTurma} descricao={serieDaTurma} antes={voltar} tituloSoParaLeitor>
```

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Turma, do professor > com dado
-<Tela titulo={nomeDaTurma} descricao={serieDaTurma} antes={voltar} idDoTitulo={idDoTitulo}>
+<Tela titulo={nomeDaTurma} descricao={serieDaTurma} antes={voltar} idDoTitulo={idDoTitulo} tituloSoParaLeitor>
```

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Turma, do professor > com dado
-<Tela titulo={nomeDaTurma} descricao={serieDaTurma} antes={voltar} idDoTitulo={idDoTitulo}>
+<Tela titulo={nomeDaTurma} descricao={serieDaTurma} antes={voltar}>
```

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › o aviso toma o lugar da turma
-const nomeDaTurma = turma.data === undefined || indisponivel ? 'Turma' : `Turma ${turma.data.nome}`
+const nomeDaTurma = turma.data === undefined ? 'Turma' : `Turma ${turma.data.nome}`
```

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › o aviso toma o lugar da turma
-const serieDaTurma = turma.data === undefined || indisponivel ? undefined : nomeDaSerie(turma.data.serie)
+const serieDaTurma = turma.data === undefined ? undefined : nomeDaSerie(turma.data.serie)
```

`ListaDaTurma`, da coordenação: os dois ramos sem a turma e o com dado.

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Lista da turma, da coordenação > carregando
-<Tela titulo={nomeDaTurma} antes={voltar}>
+<Tela titulo={nomeDaTurma} antes={voltar} tituloSoParaLeitor>
 <EstadoCarregando rotulo="Carregando a turma…" />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Lista da turma, da coordenação > com erro
-<Tela titulo={nomeDaTurma} antes={voltar}>
+<Tela titulo={nomeDaTurma} antes={voltar} tituloSoParaLeitor>
 {perdida || (turma.error instanceof ErroDaApi && turma.error.codigo === CodigoDeErro.NAO_ENCONTRADO) ? (
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Lista da turma, da coordenação > com dado
-<Tela titulo={nomeDaTurma} descricao={nomeDaSerie(turma.data.serie)} antes={voltar} idDoTitulo="titulo-da-turma">
+<Tela titulo={nomeDaTurma} descricao={nomeDaSerie(turma.data.serie)} antes={voltar} idDoTitulo="titulo-da-turma" tituloSoParaLeitor>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Lista da turma, da coordenação > com dado
-<Tela titulo={nomeDaTurma} descricao={nomeDaSerie(turma.data.serie)} antes={voltar} idDoTitulo="titulo-da-turma">
+<Tela titulo={nomeDaTurma} descricao={nomeDaSerie(turma.data.serie)} antes={voltar}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/ListaDaTurma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › o aviso toma o lugar da lista
-const nomeDaTurma = turma.data === undefined || perdida ? 'Turma' : `Turma ${turma.data.nome}`
+const nomeDaTurma = turma.data === undefined ? 'Turma' : `Turma ${turma.data.nome}`
```

A turma lida com a leitura de `/v1/eu` falhando, e a descrição que some com o título escondido (ordem da rodada 1,
itens 2 e 3).

```mutacao
arquivo: apps/web/src/areas/professor/Turma.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › o erro toma o lugar das abas
-const falha = turma.isError ? turma : eu.isError ? eu : undefined
+const falha = turma.isError ? turma : undefined
```

```mutacao
arquivo: apps/web/src/componentes/Tela.tsx
teste: apps/web/src/componentes/Tela.test.tsx › esconde só o
 </h1>
-{controles}
+{descricao !== undefined && <p>{descricao}</p>}
+{controles}
```

As cinco telas da conversa: o `h1` continua escondido.

```mutacao
arquivo: apps/web/src/areas/professor/Home.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Início do professor
-<Tela titulo="Nova conversa" largura="conversa" tituloSoParaLeitor>
+<Tela titulo="Nova conversa" largura="conversa">
```

```mutacao
arquivo: apps/web/src/areas/professor/Conversa.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › conversa com o Assistente de ensino
-<Tela titulo="Conversa com o Assistente de ensino" largura="conversa" tituloSoParaLeitor>
+<Tela titulo="Conversa com o Assistente de ensino" largura="conversa">
```

```mutacao
arquivo: apps/web/src/areas/professor/Time.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › time: Assistente de ensino
-<Tela titulo="Seu time: Assistente de ensino" largura="conversa" tituloSoParaLeitor>
+<Tela titulo="Seu time: Assistente de ensino" largura="conversa">
```

```mutacao
arquivo: apps/web/src/areas/professor/Tutor.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › time: Tutor, do professor
-<Tela titulo="Seu time: Tutor" largura="conversa" tituloSoParaLeitor>
+<Tela titulo="Seu time: Tutor" largura="conversa">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Tutor.tsx
teste: apps/web/src/areas/titulo-das-telas.test.tsx › Tutor do aluno
-<Tela titulo="Tutor" largura="conversa" tituloSoParaLeitor>
+<Tela titulo="Tutor" largura="conversa">
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (1ª) | A prop `objeto` ficou sem efeito: registrar o destino concreto para ela não ficar esquecida | Destino: a spec da área que recompuser cada tela a tira (X2 a X4): `Atividade`, `Aprovar`, `Ferramenta`, `Artefato`, `DetalheDoPedido` e a galeria, que são as telas que ainda a passam. Não se aplica aqui: tirar a prop mexe em seis telas que não são desta tarefa (divergência já declarada na tabela da tarefa) |
| revisor-geral (1ª) | Extrair as listas `ITENS_DO_*` de `titulo-da-tela.spec.ts` e `areas.spec.ts` para uma fixture de `e2e/__fixtures__/` | Destino: tarefa 13.0, que já altera `e2e/areas.spec.ts`. Não se aplica aqui: `areas.spec.ts` não é arquivo desta tarefa, e a duplicação já está avisada no comentário do arquivo novo |
| test-engineer (1ª) | Um caso de e2e que abra "Abrir a turma" e meça o `h1` e o `larguraExcedente` da turma aberta | Destino: tarefa 13.0, que altera `acesso-da-turma.spec.ts` (onde está a turma alocada à professora; `entrarComoProfessora` não a cria) e mede a casca no celular. A turma aberta tem o título coberto por componente aqui, nos quatro estados |
| test-engineer (1ª) | Telas fora da lateral que usam a `Tela` sem `objeto` (`Atividade`, `Aprovar`, `DetalheDoPedido`, `Artefato`, `MeusDados`) passam a mostrar o título sem teste próprio | Sem ação: o revisor diz que segue a Tech Spec e que o e2e dessas telas, na esteira, mostra se algum seletor dependia do `h1` escondido. O Orquestrador lê o veredito da esteira ao fechar a tarefa seguinte |
| frontend-reviewer (1ª) | O campo de arquivo da lista de nomes (`ListaDaTurma`) é o nativo do navegador ("Choose File"), e o `Material` usa um botão próprio ("Escolher arquivo") | Destino: spec da área, X2 (a Estrutura). Não se aplica aqui: é o miolo da tela, e a tarefa é "sem mudar o miolo" |
| frontend-reviewer (1ª) | `h1` seguido de um `h2` quase igual em `Turmas` ("Turmas" e "Suas turmas") e em `Professores` ("Professores" e "Professores da escola") | Destino: recomposição da tela na spec da área (X2 a X4) |
| frontend-reviewer (1ª) | O voltar de `Turma` e `ListaDaTurma` está no desenho antigo, em link sublinhado, e não em linha própria de 28 px em `t-selo` | Já declarado em "Fora do escopo desta tarefa" ("o voltar em linha própria"); destino: spec da área |
| frontend-reviewer (1ª) | As telas ficaram em `grade` de 1200, mas a casca limita o conteúdo a 1024 | Destino: tarefa 12.0 (o `main` e a moldura de 1200), já declarado |
| test-engineer (2ª) | Um caso com a turma e `/v1/eu` falhando ao mesmo tempo prenderia o comentário "a turma primeiro" (`Turma.tsx:69-70`): conferir que "Tentar de novo" chama de novo a leitura da turma | Recusada, com o motivo: o revisor diz que "não bloqueia" e que os dois ramos desenham o mesmo `EstadoErro`; o que muda é só qual leitura o botão repete. A rodada 1 já fixou o ramo que a tarefa alterou (o título no erro). Se a turma passar a ter retentativa própria, o caso entra na tarefa que a mexer |

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
| 2026-10-15 16:03:30 | 2026-10-15 16:05:01 | `revisor-geral` | 1 | APROVADO | a6f77d861a0db17e7 |
| 2026-10-15 16:03:22 | 2026-10-15 16:05:04 | `test-engineer` | 1 | APROVADO | ac05176edd6b1d481 |
| 2026-10-15 16:03:15 | 2026-10-15 16:05:55 | `frontend-reviewer` | 1 | APROVADO | a2421c3fb747a72e2 |
| 2026-10-15 16:18:45 | 2026-10-15 16:19:06 | `revisor-geral` | 2 | APROVADO | ae67ed08a8e2c70da |
| 2026-10-15 16:18:36 | 2026-10-15 16:19:08 | `test-engineer` | 2 | APROVADO | a9bf5d271b304e50a |
