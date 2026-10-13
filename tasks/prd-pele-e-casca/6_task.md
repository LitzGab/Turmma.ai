# Tarefa 6.0 — Selo, contador, aviso e abas dizem o estado sem depender da cor

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Selo, faixa, abas e os estados de vazio, carregando e erro aparecem na pele nova, nos dois temas, dizendo o estado
por texto ou ícone, e a galeria ganha o aviso, o contador e o toque.

## Contexto necessário

- `techspec.md` seção 9 (**Peças revestidas**, **Peças novas**: `Toque` é botão com `aria-pressed`, `Abas` mantém o
  teclado de hoje), 7c (o que mora na entrada) e 10
- `prd.md` RF9 e RF11; `cenarios.md`, parte A, as linhas da 6.0
- `docs/interface.md` 10.2 e 9.1 (os pares antigos de estado); `mockup.md` 3.3 (`Selo`, `Contador`, `Aviso`), 3.1
  (`Toque`), 3.4 (`Abas`) e 7.4
- `.claude/rules/50-frontend.md`, itens 5 e 11; D8 (a faixa não fecha) e D59
- Código, em `apps/web/src/componentes/`: `SeloDeEstado.tsx` (o texto é obrigatório pelo tipo; `data-estado`),
  `Faixa.tsx` (`role="note"`, sem botão), `Abas.tsx` com `teclado-das-abas.ts`, e `estado/*.tsx`

## Subtarefas

- [x] 6.1 — Revestir **sem mudar props**. `Estado`: as quatro famílias com os tokens de hoje (`pendente`, `ok`, `erro`,
  `info` e os `-cx`), ícone e texto. `Faixa`: continua `role="note"`, sem botão e sem prop de fechar. `Abas`: 44 px, e
  a ativa com três pistas (texto `azul-texto`, sublinhado de 3 px e `aria-selected`)
- [x] 6.2 — Os três de `estado/` **moram na entrada**: não importam `Aviso`, `Contador`, `Toque` nem peça de
  `PECAS_FORA_DA_ENTRADA`. Borda de 2 px; no `EstadoErro`, `role="alert"` só na mensagem e o botão fora dele;
  `EstadoCarregando` continua texto, sem animação; o tracejado do `EstadoVazio` em `borda-campo`
- [x] 6.3 — `Aviso` (nova; `tom`: `info`, `atencao`, `erro` ou `certo`; `titulo`, `children`, `acao`): ícone e texto
  em todo tom; `role="alert"` só no `erro`, e **nenhum papel vivo nos outros** (o mockup põe `status` em texto
  parado: é ruído). Não fecha. **Não converta** os cerca de 30 avisos escritos à mão nas telas: é da spec da área
- [x] 6.4 — `Contador` (`n`, `oQueConta`, `familia`): número tabular, com o que conta em texto para leitor de tela;
  zero não desenha; não pisca. `Toque` (`selecionado`, `aoMudar`, `icone`, `desligado`): `<button aria-pressed>`,
  44 px abaixo de 768; o selecionado leva o visto, e não só a cor
- [x] 6.5 — As três novas entram em `PECAS_FORA_DA_ENTRADA`; `galeria/secoes/estado.tsx`, com nomes inventados
- [x] 6.6 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/SeloDeEstado.tsx` | alterado |
| `apps/web/src/componentes/Faixa.tsx` | alterado |
| `apps/web/src/componentes/Abas.tsx` | alterado |
| `apps/web/src/componentes/Abas.test.tsx` | novo |
| `apps/web/src/componentes/SeloEFaixa.test.tsx` | novo |
| `apps/web/src/componentes/estado/EstadoCarregando.tsx` | alterado |
| `apps/web/src/componentes/estado/EstadoErro.tsx` | alterado |
| `apps/web/src/componentes/estado/EstadoVazio.tsx` | alterado |
| `apps/web/src/componentes/estado/estados.test.tsx` | novo |
| `apps/web/src/componentes/Aviso.tsx` | novo |
| `apps/web/src/componentes/Aviso.test.tsx` | novo |
| `apps/web/src/componentes/Contador.tsx` | novo |
| `apps/web/src/componentes/Contador.test.tsx` | novo |
| `apps/web/src/componentes/Toque.tsx` | novo |
| `apps/web/src/componentes/Toque.test.tsx` | novo |
| `apps/web/src/galeria/secoes/estado.tsx` | alterado |
| `apps/web/nome-dos-chunks.ts` | alterado |
| `apps/web/nome-dos-chunks.test.ts` | alterado |
| `e2e/pecas-estado.spec.ts` | novo |
| `docs/interface.md` | alterado |
| `tasks/prd-pele-e-casca/techspec.md` | alterado |
| `tasks/prd-pele-e-casca/cenarios.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| texto ou ícone em todo estado | componente | `Estado` nas quatro famílias, `Aviso` nos quatro tons, `Contador` e `Toque` selecionado: o estado está no texto, no ícone ou no ARIA, sem ler classe de cor |
| o aviso e a região viva | componente | `erro` é `alert`; os outros tons não têm papel vivo; não existe botão de fechar |
| abas pelo teclado | componente | uma parada de Tab, setas com volta, Home e End, `aria-selected` e `aria-controls`; os cinco casos de `teclado-das-abas.test.ts` ficam |
| vazio, carregando e erro | componente | `EstadoErro`: `alert` só com a mensagem, "Tentar de novo" fora dele e "Tentando de novo…" em `status`; `EstadoCarregando` é `status`, sem nó animado; `EstadoVazio` com a ação e o "Verificando…" |
| nos dois temas, com axe | e2e | a seção sem violação grave, nos dois projetos; o contraste calculado de cada família e tom |
| alvo de toque | e2e (`celular`) | aba e `Toque` com 44 px |
| a faixa não fecha | componente e e2e | `Faixa` sem botão nem link; `aluno-tutor` continua afirmando a faixa presa, sem edição |
| os três de `estado/` na entrada | unidade | `apps/web/nome-dos-chunks.test.ts` sem peça da lista no primeiro carregamento |
| nenhum teste de regra enfraquecido | e2e | "Tentar de novo" (18 specs), `[data-estado]` em `governanca` e `pedido-do-titular`, e a linha de aprovação igual ao selo, sem edição |

Concorrência, recomeço e log não se aplicam: peça sem servidor, sem sessão e sem log.

## Como testar

- Componente a copiar: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`; teclado, com `userEvent`
- e2e a copiar: o caso das abas de hoje (`pecas`), onde a 2.0 o deixou. Se ele ficou em outro `pecas-*`, não o
  edite: a prova das abas no navegador entra como caso novo em `e2e/pecas-estado.spec.ts`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/Aviso.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-estado.spec.ts e2e/aluno-tutor.spec.ts`
- Armadilha: `mensagemDoErro` vem de `api/cliente`: no teste do `EstadoErro`, passe um erro com código do catálogo
- Armadilha: os `rgb()` de `ok-cx`, `pendente-cx` e `erro-cx` em outros specs não mudam: os tokens são os de hoje
- Telas: `/galeria` (Estado), claro e escuro; `aluno`, `/aluno/tutor`; `professora`, `/professor/turmas`. Mockup:
  `/fundamentos` (Marcar e informar)

## Fora do escopo desta tarefa

`Segmentado` (2.0); o contador de "Seu time" na lateral (12.0, escrito lá: a casca é da entrada); converter aviso
escrito à mão; o sino (X2 e X3).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| `Abas` tem 44 px em **toda** largura, e não os 48 px da linha de abas da `docs/interface.md` 10.2 | A 10.2 dizia 48 px "(44 no cabeçalho de página)" e a subtarefa 6.1 e o cenário de alvo de toque pedem 44. A aba daqui é a de página, que leva o número; a de 48 é a do mockup solta. O `md:min-h-9` de 36 px do computador era da barra de controles de antes da D80 e saiu | `techspec.md` §9 "Desvios do mockup" (acrescentei); `docs/interface.md` 10.2, linha das `Abas` (marcada "produto") |
| O `Contador` diz o que conta em texto escondido (`sr-only`) depois do número, e **não** por `role="img"` com `aria-label`; e tem um tamanho só, 24 px, e não 22, 24 ou 28 | Com `role="img"` o nome acessível da aba e o da linha perdiam o texto do número, e `Abas.test.tsx` (`/Pedidos.*2.*pedidos de nome/`) e o caso das abas de `e2e/pecas-sobrepor.spec.ts` (`toHaveText(/2 pedidos de nome/)`, que fica sem edição) leem o texto. Os três tamanhos do mockup eram de telas que não existem; a lateral (12.0) é de outra tarefa | `techspec.md` §9 "Desvios do mockup"; `docs/interface.md` 10.2, linha do `Contador` |
| O `Aviso` só é região viva no `erro`, e só no texto dele: a `acao` fica fora do `alert`. Informação, atenção e certo **não têm papel nenhum** | O mockup põe `status` em texto que já está na tela, e o leitor de tela o anuncia a cada abertura: é ruído. A subtarefa 6.3 já dizia "nenhum papel vivo nos outros", e a `acao` fora do `alert` evita que o botão seja anunciado junto | `techspec.md` §9 "Desvios do mockup"; `docs/interface.md` 10.2, linha do `Aviso` |
| O `EstadoVazio` **de lista** continua à esquerda, com o título em `t-secao`; só o tracejado centraliza | O vazio de lista mora dentro de lista e de cartão, e quem recompõe a tela é a spec de área; centralizar o padrão mudaria o desenho de todas as telas que já o usam, antes de elas serem recompostas. A 10.2 dizia "coluna centrada" para os três | `techspec.md` §9 "Desvios do mockup"; `docs/interface.md` 10.2, linha dos três de `estado/` |
| O `EstadoCarregando` continua texto parado em `status`, sem pulso, e a linha A53 do `cenarios.md` foi reescrita (o "carregando novo é pulso de opacidade" é do "Pensando…" da 10.0) | A subtarefa 6.2 diz "continua texto, sem animação"; a A53 (`aluno-tutor.spec.ts:67-77`) proíbe animação em laço dentro de `main`, e o `EstadoCarregando` está em `main`. O contrato do teste não mudou | `cenarios.md` A53 |
| Arquivos fora da lista prevista: `apps/web/src/componentes/SeloEFaixa.test.tsx` (o teste de componente do `Estado` e da `Faixa`, que a lista não trazia e cujas mutações precisam de teste que falhe sem a classe), `apps/web/nome-dos-chunks.test.ts` (as três peças novas fora da entrada, como a 5.0 fez com a `Linha`), `docs/interface.md`, `techspec.md` e `cenarios.md`. `e2e/pecas-estado.spec.ts` é **novo**, e não "alterado" como a lista dizia | O `jsdom` não calcula cor nem medida: sem o teste de classe, a mutação de `border-2` do selo não ficaria vermelha. O spec `pecas-estado` não existia na árvore | Lista de "Arquivos previstos" desta tarefa |
| A galeria ganha as seções `aviso`, `contador`, `toque` e `estados-de-tela`, e **mantém** `estado`, `painel` e `abas` com o conteúdo e os seletores que `pecas-ia`, `pecas-galeria` e `pecas-sobrepor` usam | A 6.5 pede as três novas na galeria; os nomes das três antigas são o que os specs de regra procuram (`[data-galeria="abas"]`) e não se editam | `techspec.md` §9 "Galeria" |

Medida do orçamento (Tech Spec, seção 7c), no build de produção (`vite build`), em brotli, antes (HEAD `8449020`, a 5.0
pronta) e depois desta tarefa, com o mesmo script (a entrada, a soma da entrada com os pedaços que ela importa
estaticamente, o CSS e os `pecas-*.js`):

| | Antes | Depois | Diferença |
|---|---|---|---|
| Entrada (`index-*.js`) | 343.346 bytes, 91.076 em brotli | 345.088 bytes, 91.615 em brotli | mais 539 bytes em brotli |
| Primeiro carregamento (entrada e as partes que ela importa estaticamente) | 480.934 bytes, 128.175 em brotli | 482.891 bytes, 129.552 em brotli | mais 1.377 bytes em brotli |
| CSS (`index-*.css`) | 40.367 bytes, 7.472 em brotli | 41.571 bytes, 7.574 em brotli | mais 102 bytes em brotli |
| Pedaços `pecas-*.js` | 23 arquivos, 32.020 bytes, 14.629 em brotli | 27 arquivos, 47.835 bytes, 20.787 em brotli | mais 6.158 bytes em brotli |

O primeiro carregamento sobe 1,4 kB porque os três de `estado/` moram na entrada e levam a pele nova (a caixa de 2 px, o
texto do contador, o papel só na mensagem), e fica em 129,6 kB, abaixo do teto de 150 kB. O `Aviso`, o `Contador` e o
`Toque` ficam fora da entrada, nos `pecas-*`: eles somam 6,2 kB em brotli, e o teto de 40 kB do `pecas-*` fica em 20,8 kB.

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

Cada bloco tira uma cláusula da pele ou da regra (a borda de 2 px, a classe tipográfica, o papel, o botão que não existe,
o alvo de 44 px, o visto, o `alert` só na mensagem, o tracejado em `borda-campo`, a peça fora da entrada) e exige o teste
de componente vermelho: o `jsdom` não calcula cor nem medida, e por isso o teste lê a classe que carrega a regra. O que
depende da cascata (a cor resolvida por tema, os 24 px do selo, o círculo de 28 px, o sublinhado de 3 px, o contraste,
o degrau cabendo) é do e2e da galeria, `e2e/pecas-estado.spec.ts`, que o portão da tarefa não roda como mutação. A
mutação de `aria-hidden` dos glifos não existe de propósito: a biblioteca de ícones já o põe por padrão, e o teste
cobre o resultado.

```mutacao
arquivo: apps/web/src/componentes/SeloDeEstado.tsx
teste: apps/web/src/componentes/SeloEFaixa.test.tsx › canto de 8, 24 px de altura mínima e o fundo e o texto da família de hoje
-t-selo inline-flex min-h-6 max-w-full
+text-[13px] inline-flex min-h-6 max-w-full
```

```mutacao
arquivo: apps/web/src/componentes/SeloDeEstado.tsx
teste: apps/web/src/componentes/SeloEFaixa.test.tsx › canto de 8, 24 px de altura mínima e o fundo e o texto da família de hoje
-items-start gap-1.5 rounded-selo px-2 py-1
+items-start gap-1.5 rounded-none px-2 py-1
```

```mutacao
arquivo: apps/web/src/componentes/SeloDeEstado.tsx
teste: apps/web/src/componentes/SeloEFaixa.test.tsx › diz o estado em texto e em glifo, uma forma por família
-pendente: Clock, ok: Check, erro: X, info: Info
+pendente: Info, ok: Info, erro: Info, info: Info
```

```mutacao
arquivo: apps/web/src/componentes/SeloDeEstado.tsx
teste: apps/web/src/componentes/SeloEFaixa.test.tsx › sem texto diz "Esperando você"
-{props.children ?? TEXTO_DO_PENDENTE}
+{props.children ?? ''}
```

```mutacao
arquivo: apps/web/src/componentes/Faixa.tsx
teste: apps/web/src/componentes/SeloEFaixa.test.tsx › tem o glifo decorativo e a pele da D80
-rounded-controle border-2 border-borda bg-info-cx px-4 py-3 text-info
+rounded-controle border border-linha bg-info-cx px-4 py-3 text-info
```

```mutacao
arquivo: apps/web/src/componentes/Faixa.tsx
teste: apps/web/src/componentes/SeloEFaixa.test.tsx › é uma nota, e não uma região viva
-<p role="note" className=
+<p role="status" className=
```

```mutacao
arquivo: apps/web/src/componentes/Faixa.tsx
teste: apps/web/src/componentes/SeloEFaixa.test.tsx › não fecha: nenhum botão, nenhum link e nada que se alcance pelo Tab
-<span className="min-w-0 break-words">{children}</span>
+<span className="min-w-0 break-words">{children}</span><button type="button">Fechar</button>
```

```mutacao
arquivo: apps/web/src/componentes/Abas.tsx
teste: apps/web/src/componentes/Abas.test.tsx › a ativa diz que é por três pistas
-'text-azul-texto' : 'text-sutil hover:text-tinta'
+'text-tinta' : 'text-sutil hover:text-tinta'
```

```mutacao
arquivo: apps/web/src/componentes/Abas.tsx
teste: apps/web/src/componentes/Abas.test.tsx › a ativa diz que é por três pistas
-absolute inset-x-2 -bottom-0.5 h-0.75 rounded-full bg-azul
+absolute inset-x-2 -bottom-0.5 h-0.5 rounded-full bg-azul
```

```mutacao
arquivo: apps/web/src/componentes/Abas.tsx
teste: apps/web/src/componentes/Abas.test.tsx › a aba tem 44 px de altura em qualquer largura
-relative inline-flex min-h-11 shrink-0
+relative inline-flex min-h-9 shrink-0
```

```mutacao
arquivo: apps/web/src/componentes/Abas.tsx
teste: apps/web/src/componentes/Abas.test.tsx › a aba tem 44 px de altura em qualquer largura
-flex-wrap gap-x-1 border-b-2 border-borda
+flex-wrap gap-x-1 border-b border-linha
```

```mutacao
arquivo: apps/web/src/componentes/Abas.tsx
teste: apps/web/src/componentes/Abas.test.tsx › o número ao lado do rótulo diz o que conta
-oQueConta={aba.oQueConta ?? 'esperando você'}
+oQueConta={aba.oQueConta ?? ''}
```

```mutacao
arquivo: apps/web/src/componentes/Contador.tsx
teste: apps/web/src/componentes/Contador.test.tsx › zero, negativo e o que não é número não desenham nada
-if (!(n > 0)) return null
+if (Number.isNaN(n)) return null
```

```mutacao
arquivo: apps/web/src/componentes/Contador.tsx
teste: apps/web/src/componentes/Contador.test.tsx › diz o número e o que ele conta, em texto
-<span className="sr-only"> {oQueConta}</span>
+<span> {oQueConta}</span>
```

```mutacao
arquivo: apps/web/src/componentes/Contador.tsx
teste: apps/web/src/componentes/Contador.test.tsx › o número é tabular, em 700
-font-bold tabular-nums text-sobre-cor
+font-bold tabular-nums text-white
```

```mutacao
arquivo: apps/web/src/componentes/Contador.tsx
teste: apps/web/src/componentes/Contador.test.tsx › não pisca
-rounded-full px-2 text-sm leading-6
+rounded-full px-2 animate-pulse text-sm leading-6
```

```mutacao
arquivo: apps/web/src/componentes/Toque.tsx
teste: apps/web/src/componentes/Toque.test.tsx › que diz o estado em texto de ARIA e entrega o valor novo no clique
-aria-pressed={selecionado}
+aria-pressed={undefined}
```

```mutacao
arquivo: apps/web/src/componentes/Toque.tsx
teste: apps/web/src/componentes/Toque.test.tsx › o escolhido leva o visto no lugar do ícone
-<Check aria-hidden="true" size={18} strokeWidth={3} className="shrink-0" />
+<span aria-hidden="true" />
```

```mutacao
arquivo: apps/web/src/componentes/Toque.tsx
teste: apps/web/src/componentes/Toque.test.tsx › o escolhido leva o visto no lugar do ícone
-'border-azul-borda bg-azul-claro text-azul-texto degrau-azul'
+'border-azul-borda bg-azul-claro text-tinta degrau-azul'
```

```mutacao
arquivo: apps/web/src/componentes/Toque.tsx
teste: apps/web/src/componentes/Toque.test.tsx › desligado não troca
-disabled={desligado}
+disabled={false}
```

```mutacao
arquivo: apps/web/src/componentes/Toque.tsx
teste: apps/web/src/componentes/Toque.test.tsx › desligado não troca
-disabled:cursor-not-allowed disabled:border-borda disabled:bg-borda disabled:text-apoio
+disabled:cursor-not-allowed
```

```mutacao
arquivo: apps/web/src/componentes/Toque.tsx
teste: apps/web/src/componentes/Toque.test.tsx › tem 44 px de face abaixo de 768
-inline-flex min-h-11 max-w-full cursor-pointer
+inline-flex min-h-9 max-w-full cursor-pointer
```

```mutacao
arquivo: apps/web/src/componentes/Aviso.tsx
teste: apps/web/src/componentes/Aviso.test.tsx › informação, atenção e certo não têm nenhum papel vivo
-role={tom === 'erro' ? 'alert' : undefined}
+role="alert"
```

```mutacao
arquivo: apps/web/src/componentes/Aviso.tsx
teste: apps/web/src/componentes/Aviso.test.tsx › o `alert` é só a mensagem: o título e o corpo entram, e o botão da ação fica fora dele
-<div className="flex min-w-0 flex-1 flex-col gap-2">
-<div role={tom === 'erro' ? 'alert' : undefined} className="flex min-w-0 flex-col gap-1">
+<div role={tom === 'erro' ? 'alert' : undefined} className="flex min-w-0 flex-1 flex-col gap-2">
+<div className="flex min-w-0 flex-col gap-1">
```

```mutacao
arquivo: apps/web/src/componentes/Aviso.tsx
teste: apps/web/src/componentes/Aviso.test.tsx › a caixa é de leitura
-rounded-controle border-2 px-4 py-3
+rounded-controle border px-4 py-3
```

```mutacao
arquivo: apps/web/src/componentes/Aviso.tsx
teste: apps/web/src/componentes/Aviso.test.tsx › cada tom usa a borda e o fundo da família dele
-info: { caixa: 'border-azul-borda bg-azul-claro'
+info: { caixa: 'border-amarelo-borda bg-amarelo-claro'
```

```mutacao
arquivo: apps/web/src/componentes/Aviso.tsx
teste: apps/web/src/componentes/Aviso.test.tsx › cada tom tem o glifo dele
-glifo: 'text-azul-texto', Icone: Info }
+glifo: 'text-azul-texto', Icone: TriangleAlert }
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoErro.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › o `alert` é só a mensagem do catálogo
-<p role="alert" className="t-apoio text-erro">
+<p className="t-apoio text-erro">
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoErro.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › o `alert` é só a mensagem do catálogo
-<div className="rounded-cartao border-2 border-erro bg-erro-cx p-4">
-<p role="alert" className="t-apoio text-erro">
+<div role="alert" className="rounded-cartao border-2 border-erro bg-erro-cx p-4">
+<p className="t-apoio text-erro">
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoErro.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › a caixa é de 2 px, nas famílias
-rounded-cartao border-2 border-erro bg-erro-cx p-4
+rounded-cartao border border-erro bg-erro-cx p-4
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoCarregando.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › a caixa é de 2 px em
-rounded-cartao border-2 border-borda bg-superficie p-4
+rounded-cartao border border-borda bg-superficie p-4
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoVazio.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › o tracejado é de 2 px em
-border-2 border-dashed border-borda-campo
+border border-dashed border-linha
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoVazio.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › nenhum importa
 import type { LucideIcon } from 'lucide-react'
-import { Botao } from '../Botao'
+import { Botao } from '../Botao'
+import { Toque } from '../Toque'
```

```mutacao
arquivo: apps/web/nome-dos-chunks.ts
teste: apps/web/nome-dos-chunks.test.ts › as peças novas de estado
 'texto-longo',
-'Toque',
 ] as const
```

```mutacao
arquivo: apps/web/src/componentes/Aviso.tsx
teste: apps/web/src/componentes/Aviso.test.tsx › não fecha: sem ação, nenhum botão, nenhum link e nada que se alcance pelo Tab, em tom nenhum
-<div className="min-w-0 text-[15px] leading-[21px] font-medium break-words text-tinta">{children}</div>
+<div className="min-w-0 text-[15px] leading-[21px] font-medium break-words text-tinta">{children}</div><button type="button">Fechar</button>
```

```mutacao
arquivo: apps/web/src/componentes/Aviso.tsx
teste: apps/web/src/componentes/Aviso.test.tsx › o título é opcional, em `t-cartao`; o corpo é `tinta`, e sem título só o corpo aparece
-t-cartao break-words text-tinta
+t-apoio break-words text-tinta
```

```mutacao
arquivo: apps/web/src/componentes/Aviso.tsx
teste: apps/web/src/componentes/Aviso.test.tsx › o título é opcional, em `t-cartao`; o corpo é `tinta`, e sem título só o corpo aparece
-t-cartao break-words text-tinta
+t-cartao break-words text-apoio
```

```mutacao
arquivo: apps/web/src/componentes/Aviso.tsx
teste: apps/web/src/componentes/Aviso.test.tsx › o título é opcional, em `t-cartao`; o corpo é `tinta`, e sem título só o corpo aparece
-min-w-0 text-[15px] leading-[21px] font-medium break-words text-tinta
+min-w-0 text-[15px] leading-[21px] font-medium break-words text-apoio
```

```mutacao
arquivo: apps/web/src/componentes/Abas.tsx
teste: apps/web/src/componentes/Abas.test.tsx › a ativa diz que é por três pistas
-absolute inset-x-2 -bottom-0.5 h-0.75 rounded-full bg-azul
+absolute inset-x-2 -bottom-0.5 h-0.75 rounded-full bg-borda
```

```mutacao
arquivo: apps/web/src/componentes/Abas.tsx
teste: apps/web/src/componentes/Abas.test.tsx › o rótulo da aba é `t-rotulo`
-t-rotulo relative inline-flex min-h-11
+relative inline-flex min-h-11
```

```mutacao
arquivo: apps/web/src/componentes/estado/EstadoVazio.tsx
teste: apps/web/src/componentes/estado/estados.test.tsx › sem ação não tem botão nem `status`; o título é `t-secao`
-<p className="t-secao text-tinta">{titulo}</p>
+<p className="t-apoio text-tinta">{titulo}</p>
```

```mutacao
arquivo: apps/web/src/componentes/Faixa.tsx
teste: apps/web/src/componentes/SeloEFaixa.test.tsx › tem o glifo decorativo e a pele da D80
-t-apoio flex min-w-0 items-start gap-2 rounded-controle
+text-sm flex min-w-0 items-start gap-2 rounded-controle
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Defeito herdado: em 360 px o placeholder da caixa de pedido do professor quebra em duas linhas e "Só conversar" o cobre (`ia/CaixaPedido.tsx`, `rows={1}` com `min-h-11`; também em `CaixaDoAssistente`) | Tarefa 10.0: `CaixaPedido.tsx` está nos arquivos previstos dela e a 10.1 o reveste. Arquivo que esta tarefa não toca |
| frontend-reviewer (1ª) | O `EstadoVazio` de lista fica à esquerda e o tracejado centraliza, na mesma galeria | Recusada nesta tarefa: é a quarta linha de "Divergências resolvidas" e está na `docs/interface.md` 10.2. A spec de área que recompuser as telas unifica |
| frontend-reviewer (1ª) | `Aviso`, `Contador` e `Toque` sem consumidor fora da galeria; converter os cerca de 30 avisos à mão; manter `pecas-estado` quando o `Contador` ganhar a lateral | Spec de área (os avisos) e tarefa 12.0 (a lateral); a própria tarefa proíbe converter nesta (subtarefa 6.3) |
| test-engineer (1ª) | `e2e/pecas-estado.spec.ts:370`: o "Tentando de novo…" da galeria é fixo, e o clique ali só prova o contador de tentativas; a troca está provada em `estados.test.tsx:41-48` | Nada a fazer: o próprio revisor diz que a prova do componente basta. É aviso de leitura |
| test-engineer (2ª) | `e2e/pecas-estado.spec.ts`: o laço que acha o primeiro fundo pintado acima da lista só serve a este caso; se outro caso de contraste precisar dele, levá-lo para um auxiliar ao lado de `desenho` e `estiloDe` | Recusada nesta tarefa: um uso só, e o auxiliar nasce com o segundo. Quem escrever o segundo caso de contraste nesse spec o extrai |
| test-engineer (2ª) | Em `6_task.md`, os nomes de teste dos blocos de mutação repetem crases e a frase inteira do `it(...)`: se um título mudar, o bloco quebra sem a regra ter mudado. Preferir prefixos curtos e estáveis | `/retro` da spec: é convenção dos blocos de toda tarefa (o portão casa por substring, `-t`), e os desta tarefa estão vermelhos pelo motivo certo |
| revisor-geral (2ª) | `docs/interface.md` 10.2 (linha dos três de `estado/`) e `techspec.md` §9 dizem que "o vazio tracejado centraliza e o de lista continua à esquerda", mas as duas variantes têm borda tracejada em `borda-campo` (`EstadoVazio.tsx:31`): o que muda é só a variante `tracejado`, que centraliza. Escrever "a variante `tracejado` centraliza" | Spec de área que unificar o `EstadoVazio` (a quarta linha de "Divergências resolvidas"): a redação das duas muda junto. É texto de documento, sem efeito em comportamento |
| frontend-reviewer (2ª) | `e2e/pecas-estado.spec.ts` não foi rodado por ele: o contraste calculado e os 3 px do sublinhado são do e2e e do portão | Nada a fazer: é aviso de leitura. O e2e roda na esteira de todo push |

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
| 2026-10-13 14:55:25 | 2026-10-13 14:57:08 | `revisor-geral` | 1 | APROVADO | abf10ba5249f40319 |
| 2026-10-13 14:55:19 | 2026-10-13 14:57:26 | `test-engineer` | 1 | REPROVADO | ab6d538eee129eb86 |
| 2026-10-13 14:55:13 | 2026-10-13 14:57:31 | `frontend-reviewer` | 1 | APROVADO | a9c33422b8928f68b |
| 2026-10-13 15:07:43 | 2026-10-13 15:08:14 | `test-engineer` | 2 | APROVADO | a20b0038aab0df6dc |
| 2026-10-13 15:07:57 | 2026-10-13 15:08:27 | `revisor-geral` | 2 | APROVADO | a6fa90696ce806449 |
| 2026-10-13 15:07:27 | 2026-10-13 15:08:38 | `frontend-reviewer` | 2 | APROVADO | a662a4bacda9b759f |
