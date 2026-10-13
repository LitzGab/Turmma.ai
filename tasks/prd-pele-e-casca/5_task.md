# Tarefa 5.0 — Cartão, linha clicável, tabela e número na pele nova

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Cartão, tabela, número de painel e barras aparecem com borda de 2 px e sem sombra borrada, nos dois temas, e a
galeria ganha a linha inteira clicável.

## Contexto necessário

- `techspec.md` seção 9 (**Tokens**, **Foco**: o anel por dentro em linha, **Alvo de toque**, **Peças novas**), 7c e 10
- `prd.md` RF7, RF9, RF11, RF23; `cenarios.md`, parte A, as linhas da 5.0
- `docs/interface.md` 9.3 e 10.2; `mockup.md` 3.2 (`Cartao`, `Linha`, `Tabela`) e 3.3 (`NumeroGrande`)
- `.claude/rules/50-frontend.md`, itens 2a e 11; D59 (a barra não muda de cor)
- Código, em `apps/web/src/componentes/`: `Cartao.tsx`, `NumeroPainel.tsx`, `Tabela.tsx` (uma estrutura por vez no
  DOM, por `useMidia`; a região só recebe foco quando sobra), `BarraRotulada.tsx` ("Cor neutra, sempre") e
  `BarraPresa.tsx` (`sticky`, e o `scroll-padding-bottom` que ela reserva)

## Subtarefas

- [x] 5.1 — Revestir **sem mudar props**: `Cartao`, `NumeroPainel` e a moldura da `Tabela` com borda de 2 px em
  `borda` e canto de 16, **sem degrau** (cartão de leitura não é botão); cabeçalho da tabela em `t-selo`, o número
  em `t-numero`; a `BarraPresa` com o fio de 2 px e fundo cheio
- [x] 5.2 — A `BarraRotulada` continua **neutra**: trilho `ia-cx` e enchimento `sutil`, como hoje, sem cor de
  família e sem mudar perto do limite. Só a forma muda
- [x] 5.3 — `Linha` (nova; `inicio`, `titulo`, `abaixo`, `fim`, e `para` **ou** `aoAcionar`): a linha inteira é
  **um** alvo, um `<a>` ou um `<button>`, sem clicável dentro de clicável; chevron `aria-hidden` no fim; 64 px de
  altura mínima; título numa linha, com reticências; o anel de foco **por dentro** (−3 px). Sem ação, é um `div`
  sem chevron. Entra em `PECAS_FORA_DA_ENTRADA`
- [x] 5.4 — `galeria/secoes/superficies.tsx`: cada peça, e a linha como link, como botão, só de leitura e com título
  comprido, com nomes inventados
- [x] 5.5 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/Cartao.tsx` | alterado |
| `apps/web/src/componentes/NumeroPainel.tsx` | alterado |
| `apps/web/src/componentes/Tabela.tsx` | alterado |
| `apps/web/src/componentes/Tabela.test.tsx` | novo |
| `apps/web/src/componentes/BarraRotulada.tsx` | alterado |
| `apps/web/src/componentes/BarraPresa.tsx` | alterado |
| `apps/web/src/componentes/Linha.tsx` | novo |
| `apps/web/src/componentes/Linha.test.tsx` | novo |
| `apps/web/src/galeria/secoes/superficies.tsx` | alterado |
| `apps/web/nome-dos-chunks.ts` | alterado |
| `e2e/pecas-superficies.spec.ts` | alterado |
| `apps/web/src/componentes/Superficies.test.tsx` | novo |
| `apps/web/nome-dos-chunks.test.ts` | alterado |
| `docs/interface.md`, `tasks/prd-pele-e-casca/techspec.md` e `tasks/prd-pele-e-casca/cenarios.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| a tabela vira lista a 360 px | componente e e2e | abaixo de 768 só a lista existe, com `dt` e `dd`; a partir daí só a tabela, com `caption` e `th` de linha. O caso de hoje do `pecas` fica, sem perder asserção |
| a tabela que não cabe rola dentro dela | e2e | a região ganha foco e nome só com sobra, e a página não rola de lado |
| a barra de acerto continua neutra | e2e | `aluno-tutor` e `professor-turma` continuam afirmando os dois `fill` de hoje, **sem edição** |
| a linha é um alvo só | componente | um elemento focável por linha, com o título no nome acessível; Enter aciona; sem ação, nenhum focável e nenhum chevron |
| anel por dentro, nos dois temas | e2e | contorno de 3 px em `foco`, com afastamento negativo, inteiro dentro da moldura |
| alvo de toque | e2e (`celular`) | a linha com 44 px ou mais |
| axe nos dois temas | e2e | a seção sem violação grave, nos dois projetos |
| a barra presa não cobre o último item | e2e | o caso de hoje do `pecas` e o `position: sticky` de `professor-turma` continuam, com a margem do degrau dos botões |
| nenhum teste de regra enfraquecido | e2e | `governanca` (a tabela "O que a IA gerou e quem aprovou"), `estrutura` e `professores` sem edição |

Concorrência, recomeço e log não se aplicam: peça sem servidor, sem sessão e sem log.

## Como testar

- Componente a copiar: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`. O `jsdom` não tem `matchMedia`:
  o teste da `Tabela` põe um `window.matchMedia` de teste (API do navegador, e não peça nossa)
- e2e a copiar: o caso "a tabela vira lista" de `e2e/pecas-superficies.spec.ts` (`secao`, `caixa`, `desenho`)
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/Linha.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-superficies.spec.ts e2e/professor-turma.spec.ts`
- Armadilha: os 46 cartões escritos à mão nas telas mudam de cor pelo token e ficam como estão: não converta
- Armadilha: caso de outro `pecas-*` que quebrar é arquivo de outra linha: pare e avise
- Telas: `/galeria` (Superfícies), claro e escuro; `coordenacao`, `/coordenacao/governanca`; `professora`,
  `/professor/turmas`. Mockup: `/fundamentos` (Conter e listar)

## Fora do escopo desta tarefa

Linha clicável e ordenação na `Tabela` (X2); a `Tela` (11.0); a barra presa acima da barra de baixo (13.0);
converter cartão escrito à mão (spec da área).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| A `BarraRotulada` fica com o trilho `ia-cx` e o enchimento `sutil` de hoje, e **não** passa ao trilho `borda` da `docs/interface.md` 10.2. Só a forma muda: 12 px de altura e ponta redonda (`rx` 6) | A subtarefa 5.2 e o cenário "a barra de acerto continua neutra" mandam `aluno-tutor` e `professor-turma` seguirem **sem edição**, e os dois afirmam `rgb(240, 240, 240)` e `rgb(93, 93, 93)`, que são `ia-cx` e `sutil`. Trocar o trilho para `borda` (`#E5E5E5`) exigiria editar duas asserções que provam a regra da barra neutra (D59) | `techspec.md` §9 "Desvios do mockup" (acrescentei); `cenarios.md` A56, A78 e "O que ficou em aberto" 6 (fechado); `docs/interface.md` 10.2, linha da `BarraRotulada` (marcada "(produto)") |
| A `BarraRotulada` continua `aria-hidden`, sem `role="progressbar"`, e o enchimento continua a `width` do `rect`, sem `scaleX` | O valor está escrito ao lado ("72%", "188 de 300 trocas"): `progressbar` o leria duas vezes. O seletor `svg rect` dos dois e2e fica, e a `scaleX` do mockup anima 400 ms que a regra de movimento (RF8) não pede | `techspec.md` §9 "Desvios do mockup"; `cenarios.md` A56; `docs/interface.md` 10.2 |
| O fio de 2 px entre uma `Linha` e a de cima **não** é da `Linha`: é da moldura que as junta (`divide-y-2 divide-borda`) | A linha sozinha não sabe se é a primeira, e quem a põe num `<li>` a faria sempre a primeira (`first:`). A 10.2 dizia "separada da de cima por 2 px" na linha | `techspec.md` §9 "Desvios do mockup"; `docs/interface.md` 10.2, linha da `Linha` (marcada "(produto)") |
| A expressão `^Aluno:` de `professor-turma.spec.ts:510-512` **não** muda, ao contrário do que a nota da A79 previa | O primeiro campo do item da lista vai em `t-cartao`, sem caixa-alta, e o prefixo escrito só para o leitor de tela chega como `Aluno:`. Só o `dt` (o nome das outras colunas) é `t-selo`, e ele não passa por `allInnerTexts()`. O `innerText` devolve o prefixo e o valor em linhas separadas (o `sr-only` é `absolute`); a expressão tolera isso por `\s*` | `cenarios.md` A79 (a nota foi reescrita); `professor-turma.spec.ts` sem edição |
| O título do `Cartao` passa de 16 px / 600 a `t-cartao` (17 px / 700), o texto da tabela de 14 a `t-apoio` (15 px / 500) e o rótulo do `NumeroPainel` de 13 px / 500 a `t-selo` (13 px / 700 em caixa-alta) | "Revestir" na 5.1 pede borda e tipografia da D80; a 9.2 da `docs/interface.md` diz `t-cartao` para "título de cartão, de linha e de aviso" e `t-selo` para "cabeçalho de tabela". A caixa-alta é do CSS, e os e2e leem `textContent` (`toHaveText`), que não a vê | `docs/interface.md` 9.2 (já dizia); nenhuma linha de `cenarios.md` afirma o tamanho |
| Arquivos fora da lista prevista: `apps/web/src/componentes/Superficies.test.tsx` (o teste de componente das quatro peças que só trocam de pele: a lista dizia só `Tabela.test.tsx` e `Linha.test.tsx`, e as mutações de `Cartao`, `NumeroPainel` e das duas barras precisam de teste que falhe sem a classe), `apps/web/nome-dos-chunks.test.ts` (a `Linha` fora da entrada, como a 4.0 fez com as três de campo), `docs/interface.md`, `techspec.md` e `cenarios.md` | O `jsdom` não calcula cor nem medida: sem o teste de classe, a mutação de `border-2` do cartão não ficaria vermelha | Lista de "Arquivos previstos" desta tarefa |
| A galeria ganha três seções (`cartao-e-numero`, `barra-rotulada` e `linha`) além das duas que já tinha (`barra-presa`, `tabela`) | A 5.4 pede "cada peça, e a linha como link, como botão, só de leitura e com título comprido"; as seções antigas ficam como estavam, sem asserção mexida | `techspec.md` §9 "Galeria" (uma seção por arquivo, `secoes/superficies.tsx`) |

Medida do orçamento (Tech Spec, seção 7c), no build de produção (`vite build`, sem a galeria), em brotli, antes (HEAD
`e1927a3`, a 4.0 pronta) e depois desta tarefa, as duas com o mesmo script:

| | Antes | Depois | Diferença |
|---|---|---|---|
| Entrada (`index-*.js`) | 343.346 bytes, 90.955 em brotli | 343.346 bytes, 91.076 em brotli | mais 121 bytes em brotli |
| Primeiro carregamento (entrada e as partes que ela importa estaticamente) | 480.934 bytes, 128.054 em brotli | 480.934 bytes, 128.175 em brotli | mais 121 bytes em brotli |
| CSS (`index-*.css`) | 39.485 bytes, 7.343 em brotli | 40.367 bytes, 7.472 em brotli | mais 129 bytes em brotli |
| Pedaços `pecas-*.js` (23 arquivos) | 32.135 bytes, 14.686 em brotli | 32.020 bytes, 14.629 em brotli | menos 57 bytes em brotli |

A entrada tem o mesmo tamanho em bytes: o que muda nela são os nomes com hash dos pedaços que ela referencia. A `Linha`
fica fora da entrada e fora do `pecas-*` (nenhuma tela a usa ainda, e só a galeria a importa), então o primeiro
carregamento sobe só aquilo e fica em 128,2 kB, abaixo do teto de 150 kB. O teto de 40 kB do `pecas-*` não sobe.

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

Cada bloco tira uma cláusula da pele (a borda de 2 px, a classe tipográfica, a forma da barra, o anel, o alvo) e exige o
teste de componente vermelho: o `jsdom` não calcula cor nem medida, e por isso o teste lê a classe que carrega a regra. O
que depende da cascata (a borda resolvida por tema, o anel desenhado por dentro, a altura de 64 px, as reticências, o
degrau cabendo na barra presa) é do e2e da galeria, `e2e/pecas-superficies.spec.ts`, que o portão da tarefa não roda como
mutação. A mutação de `aria-hidden` do chevron não existe de propósito: a biblioteca de ícones já o põe por padrão, e o
teste cobre o resultado.

```mutacao
arquivo: apps/web/src/componentes/Cartao.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › sem título é só a caixa
-border-2 border-borda bg-superficie
+border border-linha bg-superficie
```

```mutacao
arquivo: apps/web/src/componentes/Cartao.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › com título, é uma região com nome
-className="t-cartao min-w-0 break-words text-tinta"
+className="min-w-0 text-base break-words text-tinta"
```

```mutacao
arquivo: apps/web/src/componentes/NumeroPainel.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › é um cartão de leitura
-border-2 border-borda bg-superficie
+border border-linha bg-superficie
```

```mutacao
arquivo: apps/web/src/componentes/NumeroPainel.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › é um cartão de leitura
-className="t-selo break-words text-sutil"
+className="text-[13px] break-words text-sutil"
```

```mutacao
arquivo: apps/web/src/componentes/NumeroPainel.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › é um cartão de leitura
-className="t-numero mt-2 break-words text-tinta"
+className="text-[28px] mt-2 break-words text-tinta"
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/componentes/Tabela.test.tsx › tem a pele da D80
-overflow-x-auto rounded-cartao border-2 border-borda
+overflow-x-auto rounded-cartao border border-linha
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/componentes/Tabela.test.tsx › tem a pele da D80
-className="h-11 border-b-2 border-borda"
+className="border-b border-linha"
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/componentes/Tabela.test.tsx › tem a pele da D80
-`t-selo px-4 whitespace-nowrap text-sutil
+`px-4 text-[13px] whitespace-nowrap text-sutil
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/componentes/Tabela.test.tsx › tem a pele da D80
-className="h-16 border-b-2 border-borda last:border-b-0"
+className="border-b border-linha last:border-b-0"
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/componentes/Tabela.test.tsx › tem a pele da D80
-`t-apoio px-4 py-3 text-tinta ${primeira
+`px-4 py-3 text-sm text-tinta ${primeira
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/componentes/Tabela.test.tsx › tem a pele da D80
-`t-apoio px-4 py-3 text-tinta ${coluna
+`px-4 py-3 text-sm text-tinta ${coluna
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/componentes/Tabela.test.tsx › na lista, cada item é um cartão
-rounded-cartao border-2 border-borda bg-superficie p-4
+rounded-cartao border border-linha bg-superficie p-4
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/componentes/Tabela.test.tsx › na lista, cada item é um cartão
-className="t-cartao min-w-0 break-words text-tinta"
+className="min-w-0 font-medium break-words text-tinta"
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/componentes/Tabela.test.tsx › na lista, cada item é um cartão
-className="t-selo text-sutil"
+className="text-sm text-sutil"
```

```mutacao
arquivo: apps/web/src/componentes/Tabela.tsx
teste: apps/web/src/componentes/Tabela.test.tsx › na lista, cada item é um cartão
-className="t-apoio min-w-0 break-words text-tinta"
+className="min-w-0 break-words text-tinta"
```

```mutacao
arquivo: apps/web/src/componentes/BarraRotulada.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › a forma é de 12 px
-className="block h-3 w-full"
+className="block h-2 w-full"
```

```mutacao
arquivo: apps/web/src/componentes/BarraRotulada.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › a forma é de 12 px
-rx="6" className="fill-ia-cx"
+rx="4" className="fill-ia-cx"
```

```mutacao
arquivo: apps/web/src/componentes/BarraRotulada.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › a forma é de 12 px
-rx="6" className="fill-sutil"
+rx="4" className="fill-sutil"
```

```mutacao
arquivo: apps/web/src/componentes/BarraRotulada.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › é neutra: trilho
-className="fill-ia-cx"
+className="fill-borda"
```

```mutacao
arquivo: apps/web/src/componentes/BarraRotulada.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › é neutra: trilho
-className="fill-sutil"
+className="fill-ok"
```

```mutacao
arquivo: apps/web/src/componentes/BarraPresa.tsx
teste: apps/web/src/componentes/Superficies.test.tsx › tem o fio de 2 px
-'border-t-2 border-borda'
+'border-t border-linha'
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › a linha tem 64 px no mínimo
-flex min-h-16 w-full
+flex w-full
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › a linha tem 64 px no mínimo
-flex min-h-16 w-full min-w-0
+flex min-h-16 min-w-0
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › a linha tem 64 px no mínimo
-focus-visible:-outline-offset-3
+focus-visible:outline-offset-2
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › a linha tem 64 px no mínimo
-hover:bg-fundo-suave focus-visible
+hover:bg-realce-suave focus-visible
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › o título é de uma linha
-className="t-cartao truncate text-tinta"
+className="t-cartao text-tinta"
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › o título é de uma linha
-className="t-cartao truncate text-tinta"
+className="truncate text-tinta"
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › o título é de uma linha
-<span title={titulo} className=
+<span className=
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › o título é de uma linha
-className="t-apoio break-words text-sutil"
+className="text-sm break-words text-sutil"
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › o chevron do fim
-{acionavel && <ChevronRight
+{true && <ChevronRight
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › o chevron do fim
-size-5 shrink-0 text-apagado
+size-5 shrink-0 text-sutil
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › o chevron do fim
-size-5 shrink-0 text-apagado
+size-4 shrink-0 text-apagado
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › é um botão só
-if (aoAcionar !== undefined)
+if (aoAcionar === undefined)
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › é um botão só
-<button type="button" onClick
+<button onClick
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › com `para`, a linha inteira é um link só
-if (para !== undefined)
+if (para === undefined)
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › sem ação, é só leitura
-<div className={CAIXA}>
+<div className={CAIXA_QUE_ACIONA}>
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › ficam dentro do alvo e não encolhem
-<span className="flex shrink-0 items-center">{inicio}
+<span className="flex items-center">{inicio}
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › ficam dentro do alvo e não encolhem
-<span className="flex shrink-0 items-center gap-2 self-start sm:self-center">{fim}
+<span className="flex items-center gap-2 self-start sm:self-center">{fim}
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › ficam dentro do alvo e não encolhem
-flex min-w-0 flex-1 flex-col">
+flex min-w-0 flex-col">
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › o fim desce para baixo do texto
-flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center sm:gap-3
+flex min-w-0 flex-1 flex-row items-center gap-3
```

```mutacao
arquivo: apps/web/src/componentes/Linha.tsx
teste: apps/web/src/componentes/Linha.test.tsx › o fim desce para baixo do texto
-gap-2 self-start sm:self-center
+gap-2
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › a peça nova de lista
  'Interruptor',
-  'Linha',
  'Menu',
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Cartão de 1 px ao lado de 2 px: "Consumo do mês por função" em `/coordenacao/governanca` e "Suas turmas" em `/professor/turmas` seguem com 1 px de borda `linha` | Spec da área: é a conversão dos cartões escritos à mão, que "Fora do escopo desta tarefa" e a "Armadilha" de "Como testar" proíbem nesta |
| frontend-reviewer (1ª) | Título truncado no toque; uma linha em `docs/interface.md` 10.2 dizendo que a tela de destino mostra o título inteiro | A tarefa que levar a `Linha` à primeira tela real, fora da galeria: é ela que sabe qual é a tela de destino, e a linha de 10.2 nasce com a regra conferida nessa tela. Hoje a `Linha` só é importada pela galeria |
| frontend-reviewer (1ª) | Chevron em `apagado`, cerca de 2,3:1 no claro | Recusada: `docs/interface.md` 10.2 manda "chevron de 20 em `apagado`, decoração", e a tabela de cores (linha 624) já diz que `apagado` é para "chevron e série tracejada". É `aria-hidden`; o revisor mesmo diz que não reprova |
| frontend-reviewer (1ª) | Trilho da `BarraRotulada` em `ia-cx`, e não `borda` | Recusada: divergência declarada e fechada nesta tarefa ("Divergências resolvidas", `cenarios.md` A56 e A78, `docs/interface.md` 10.2 marcada "(produto)"). Reabre só quando alguém editar as duas asserções de `aluno-tutor` e `professor-turma` |
| revisor-geral (1ª) | O comentário de `Cartao.tsx:16-19` diz "20 px a partir de 1024 px" e a 10.2 e a 9.3 dizem 768 | Spec da área, a que unifica os cartões: o `lg:p-5` (1024) é anterior à tarefa e é o mesmo de `NumeroPainel` e dos cartões escritos à mão; escolher 768 ou 1024 é decisão de uma vez para todos, e não cabe numa tarefa que "reveste sem mudar props". Até lá o comentário descreve o código |
| test-engineer (1ª) | Nada impede um clicável dentro do `fim` ou do `inicio`: aviso em desenvolvimento ou caso de componente que documente a fronteira | Recusada: `fim` e `inicio` são `ReactNode`, e o tipo não expressa isso; o aviso é comportamento novo que a 5.3 não pede. A regra já está no comentário do componente e em 10.2 ("sem clicável dentro de clicável") |
| test-engineer (1ª) | `rgbDoToken` compara com o valor do próprio token, e um `borda` errado no escuro passaria | Recusada: o próprio revisor a chama de "aceitável aqui", porque o valor do token é da 2.0 e tem teste lá |
| revisor-geral (2ª), frontend-reviewer (2ª) | O comentário longo de `Linha` ("A linha de lista da D80…") ficou acima de `interface PropsDoMiolo` (`Linha.tsx:26-45`), e `export function Linha` (linha 70) está sem documentação: o editor deixa de mostrá-lo ao passar o mouse em `Linha`. Mover o bloco para a linha 70 e deixar só a frase de `PropsDoMiolo` | A tarefa que levar a `Linha` à primeira tela real: ela toca `Linha.tsx` de qualquer jeito. Só de comentário, sem mudar comportamento nem contrato; mover agora custaria uma rodada do `revisor-geral` |
| revisor-geral (2ª), test-engineer (2ª) | `Linha.test.tsx:71`: `expect(duas.type).toBe(Linha)` passa sempre; quem prova a regra é o `@ts-expect-error` da linha 69. Trocar por `void duas`, ou tirar | A próxima edição de `Linha.test.tsx`. A prova é do `tsc` do portão, e o comentário das linhas 67-68 diz isso; os dois revisores aprovaram com a asserção |
| test-engineer (2ª) | O caso "`para` e `aoAcionar` não vão juntos" falha no `tsc`, não no vitest: uma linha no "Como testar" do `5_task.md` dizendo isso | Recusada: o comentário das linhas 67-68 de `Linha.test.tsx`, em cima do `@ts-expect-error`, já diz que quem prova é o `tsc` do portão, e é onde quem ler o vermelho vai olhar |
| frontend-reviewer (2ª) | Placeholder da `CaixaPedido` cortado a 360 px, claro e escuro (`professora--galeria--celular-5.png`, `escuro--professora--galeria--celular-5.png`; `apps/web/src/componentes/ia/CaixaPedido.tsx:112-125`): "…um plano de aula…" quebra e a segunda linha some atrás do botão "Só conversar" | Tarefa 10.0/10.1, onde já está registrada (`2_task.md`, `3_task.md`, `4_task.md`). A peça não foi tocada nesta tarefa. O revisor pede que quem revisar a 10.0 trate como bloqueante, "como já combinado" |

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
| 2026-10-13 13:39:02 | 2026-10-13 13:40:37 | `frontend-reviewer` | 1 | APROVADO | abc7c01c13e318e8c |
| 2026-10-13 13:39:13 | 2026-10-13 13:40:49 | `revisor-geral` | 1 | APROVADO | aec9523d83a9ddc7d |
| 2026-10-13 13:39:07 | 2026-10-13 13:41:20 | `test-engineer` | 1 | REPROVADO | ac65277ab10a37afd |
| 2026-10-13 13:51:47 | 2026-10-13 13:52:13 | `revisor-geral` | 2 | APROVADO | a46c20981b64f410b |
| 2026-10-13 13:51:39 | 2026-10-13 13:52:16 | `test-engineer` | 2 | APROVADO | ab9bb2840b26a039c |
| 2026-10-13 13:51:28 | 2026-10-13 13:53:18 | `frontend-reviewer` | 2 | APROVADO | ad6defba742f3e78a |
