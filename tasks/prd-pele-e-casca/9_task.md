# Tarefa 9.0 — Os ícones ilustrados dos lugares e o ladrilho

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `infra-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Início, Turmas, Ferramentas e Atividades ganham ícone ilustrado que acompanha o tema, e o `Ladrilho` dá moldura de
família a eles e aos do `lucide`, sem passar do que a Tech Spec admite na entrada.

## Contexto necessário

- `techspec.md` 7c (**Orçamento**: os 4 kB, o teto de `pecas-*`), 9 (**Tokens**, **Peças novas**) e 12 (a premissa do peso)
- `prd.md` RF17, RF22; `docs/interface.md` 9.4, 10.2 (`Ladrilho`) e 10.4; `mockup.md`, seção dos ícones (as formas)
- `.claude/rules/50-frontend.md`, item 1
- Código: `apps/web/nome-dos-chunks.test.ts` (a soma do primeiro carregamento); `.size-limit.json`;
  `tools/ci/tamanho-web.test.ts` (o `26 kB` aparece em cinco casos); `apps/web/public/marca/` (precedente de SVG em arquivo)

## Subtarefas

- [x] 9.1 — `componentes/icones/lugares.tsx`: `inicio`, `turmas`, `tarefas` e `ferramentas` (os quatro quadradinhos:
  laranja, azul, verde e roxo), SVG 48 × 48, chapados, sem contorno. A cor é classe `fill-<família>`, `fill-icone-papel`
  ou `fill-icone-linha`: nenhum hex. `Icone` (`componentes/Icone.tsx`; `nome`, `tamanho` de 24 a 48, `rotulo?`): com
  `rotulo`, `role="img"` e nome; sem, `aria-hidden`
- [x] 9.2 — `componentes/Ladrilho.tsx` (`familia`, `tamanho` de 32 a 56, `rotulo?`, `children`): quadrado de canto 12, fundo
  `<família>-claro`, ícone a 72%; serve a `Icone` e ao `lucide`. O mapa de classes por família é literal (o Tailwind
  não acha classe montada por texto)
- [x] 9.3 — Medição. O bundler descarta os ícones até a 12.0 os ligar à casca: meça aqui o HTML renderizado dos quatro,
  em brotli, com teto de 3 kB (a folga do JSX até os 4 kB), e escreva o número em "Divergências" e na Tech Spec 7c e
  12. Acima de 4 kB, viram asset do build com hash (`lugares-*.svg`), usado por `<use>`, cor por `var(--color-…)` e
  teto próprio de 6 kB em brotli no `.size-limit.json`. A 12.0 mede a entrada de verdade
- [x] 9.4 — Só se a 9.3 passar dos 4 kB: o grupo `lugares-*.svg` no `.size-limit.json` e o caso que o reprova em
  `tools/ci/tamanho-web.test.ts`. O teto de `pecas-*` já subiu para 40 kB na 3.0: confira, não suba de novo
- [x] 9.5 — `galeria/secoes/marca-icones.tsx`: os quatro ícones, e o `Ladrilho` com ícone ilustrado e com `lucide`
- [x] 9.6 — Testes

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/icones/lugares.tsx` e `lugares.test.tsx` | novos |
| `apps/web/src/componentes/Icone.tsx` e `Icone.test.tsx` | novos |
| `apps/web/src/componentes/Ladrilho.tsx` e `Ladrilho.test.tsx` | novos |
| `apps/web/src/galeria/secoes/marca-icones.tsx` | novo |
| `e2e/pecas-marca-icones.spec.ts` | novo |
| `.size-limit.json`, `tools/ci/tamanho-web.test.ts` | alterados, só se os ícones saírem da entrada |
| `tasks/prd-pele-e-casca/techspec.md`, `docs/interface.md` | alterados (o número medido) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| nome quando está sozinho | componente | `Icone` e `Ladrilho` com `rotulo` são `img` com esse nome |
| escondido ao lado de rótulo | componente | sem `rotulo`, `aria-hidden="true"` e nenhum nome |
| os quatro existem e diferem | componente | cada `nome` dá um SVG `0 0 48 48`, e o HTML dos quatro é diferente entre si |
| nenhuma cor fora dos tokens | unidade | `lugares.tsx` sem `#`, `rgb(` nem `style=`; só `fill-*` com nome da 9.10, sem exceção na guarda |
| o peso | unidade | o HTML dos quatro, em brotli, cabe em 3 kB |
| o teto dos ícones, se saírem da entrada | unidade | `lugares-*.svg` de 6 kB em brotli passa e de 7 kB reprova; os outros tetos não mudaram |
| os dois temas | e2e | na galeria, o `fill` do papel é `#EFEFEF` no claro e `#37464F` no escuro, lido do estilo calculado |
| tamanho | e2e | `Ladrilho` e `Icone` quadrados nas medidas pedidas, sem passar da janela a 360 px |
| axe | e2e | a seção sem violação grave, nos dois temas e nos dois projetos |

## Como testar

- Componente: `pedidos/ListaDePedidos.test.tsx`; peso por `renderToStaticMarkup` e `brotliCompressSync` (`node:zlib`)
- Teto: copie o caso `as peças acima de 26 kB em brotli reprovam…` de `tamanho-web.test.ts` com os números novos
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/Icone.test.tsx tools/ci/tamanho-web.test.ts`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-marca-icones.spec.ts`
- Armadilha: Rolldown descarta módulo que ninguém importa; `npm run build -w @educa/web` não mostra os ícones
- **Telas**: `/galeria` (Marca e ícones), claro e escuro. Mockup: `/fundamentos` (os ícones)

## Fora do escopo desta tarefa

Ligar os ícones à casca (12.0); os outros 44 ícones, que nascem com a tela deles.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| **A 9.4 não se aplica.** O HTML renderizado dos quatro ícones pesa 2.197 bytes e **484 bytes em brotli**, com o teto de 3 kB no teste: ficam na entrada, e `lugares-*.svg`, o teto de 6 kB e o caso em `tamanho-web.test.ts` **não nascem**. O `.size-limit.json` e `tools/ci/tamanho-web.test.ts` não mudam, e o teto de `pecas-*` continua em 40 kB (conferido, como a 9.4 manda) | A medição da 9.3 deu 484 bytes, bem abaixo dos 3 kB e dos 4 kB da Tech Spec. A medida é a do HTML renderizado, como a subtarefa pede, e não a do JS compilado; a entrada de verdade, com os ícones ligados à casca, é da 12.0 | `techspec.md` 7c (**Orçamento**, com o número) e 12 (a premissa passou de `NÃO VERIFICADO` a `VERIFICADO na 9.0`); `docs/interface.md` 9.4 |
| `Ladrilho` aceita **seis** tamanhos (32, 36, 40, 44, 48 e 56), e não só 32, 40, 44 e 56 do mockup | A lateral desenha o ícone numa caixa de **36** (Tech Spec 9, **Casca da escola**; 12.1): sem o 36 a 12.0 teria de escolher entre 32 e 40 ou de ganhar um tamanho fora da tabela. Cada tamanho é uma classe literal (`size-8` a `size-14`) e o teste prova que dois tamanhos não dão a mesma | `techspec.md` 9 (**Peças novas**); `docs/interface.md` 10.2 (`Ladrilho`) |
| `Ladrilho` põe `text-<família>-texto` no quadrado, e é com essa cor que o `lucide` dentro dele desenha (`currentColor`) | A tarefa diz que o ladrilho "serve ao `lucide`", e o `lucide` não tem cor própria: sem a cor da família ele herdaria `tinta` e ficaria igual em todas. O `texto` da família sobre o `claro` dela é o par que a tabela de contraste já prova nos dois temas (e o selo de estado usa o mesmo), e o teste do ladrilho calcula 4,5:1 nas dez famílias | `techspec.md` 9 (**Peças novas**); `docs/interface.md` 10.2 (`Ladrilho`) |
| O visto do ícone `tarefas` é feito de **dois retângulos de ponta redonda**, e não de um traço | A 9.1 manda a cor ser `fill-*` e o teste manda "só `fill-*`, sem exceção na guarda": um `stroke` pediria `stroke-<família>`, que é outra classe e outra linha na lista fechada | `docs/interface.md` 9.4 |
| `Icone` tem cinco tamanhos (24, 28, 32, 40 e 48), e o ícone das ferramentas se chama `ferramentas` (o mockup o chama `mais`) | A 9.4 diz "de 24 a 48" e o mockup usa esses cinco; o nome é o que o PRD e a lateral dão ao lugar (RF17) | `docs/interface.md` 9.4 |

## Mutações

Cada bloco tira uma cláusula do desenho dos quatro ícones (a cor de cada forma, a posição dos quadradinhos, a cor escrita
à mão, o `style`, o contorno, a opacidade, o `<title>`, as formas além de dez, dois lugares com o mesmo desenho), do
`Icone` (o `viewBox`, o tamanho, o papel de imagem, o nome, o `aria-hidden` nos dois sentidos, o rótulo vazio, o foco e o
`shrink-0`) e do `Ladrilho` (o nome e o `aria-hidden`, o fundo e o texto de cada família, o lado de cada tamanho, o canto
12, o `shrink-0`, os 72% e o `svg` que preenche), e exige o teste de unidade vermelho. São só do e2e
(`e2e/pecas-marca-icones.spec.ts`), que o portão da tarefa não roda como mutação: o `fill` do papel e da linha, lido do
estilo calculado, em `#EFEFEF` e `#37464F` e em `#D7D7D7` e `#52656D`; a face de cada família nas formas; o quadrado
de cada ícone e de cada ladrilho nas medidas pedidas, com o ícone a 72% e centrado, nos dois projetos; o fundo `claro`
e o canto de 12 px do ladrilho nas dez famílias, e a cor `texto` no `lucide`; `animationName` e `transitionDuration` em
`none`; o axe nos dois temas; e a página sem rolagem horizontal a 360 px. O ícone e o ladrilho ficam fora de
`PECAS_FORA_DA_ENTRADA`, como a Tech Spec 7c manda, e nada os importa antes da 12.0: o bundler os descarta, e a tarefa
não altera a entrada.

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-<rect x="9" y="21" width="30" height="22" rx="4" className="fill-icone-papel" />
+<rect x="9" y="21" width="30" height="22" rx="4" className="fill-icone-linha" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-<path d="M20 43V33a4 4 0 0 1 8 0v10z" className="fill-laranja" />
+<path d="M20 43V33a4 4 0 0 1 8 0v10z" className="fill-azul" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-<rect x="12.5" y="29" width="5" height="5" rx="1.5" className="fill-icone-linha" />
+<rect x="12.5" y="29" width="5" height="5" rx="1.5" className="fill-icone-papel" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-<rect x="33" y="8" width="5" height="11" rx="1.5" className="fill-laranja" />
+<rect x="33" y="8" width="5" height="11" rx="1.5" className="fill-vermelho" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-<circle cx="24" cy="15" r="7" className="fill-turquesa" />
+<circle cx="24" cy="15" r="7" className="fill-verde" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-<circle cx="10" cy="21" r="4.5" className="fill-icone-linha" />
+<circle cx="10" cy="21" r="4.5" className="fill-icone-papel" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-<rect x="9" y="7" width="30" height="37" rx="5" className="fill-azul" />
+<rect x="9" y="7" width="30" height="37" rx="5" className="fill-anil" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-<rect x="17" y="3" width="14" height="9" rx="3" className="fill-icone-linha" />
+<rect x="17" y="3" width="14" height="9" rx="3" className="fill-icone-papel" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-<rect x="14" y="27.5" width="11" height="4" rx="2" transform="rotate(45 19.5 29.5)" className="fill-azul" />
+<rect x="14" y="27.5" width="11" height="4" rx="2" transform="rotate(45 19.5 29.5)" className="fill-verde" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada forma tem a cor que a 9.4 dá a ela
-<rect x="26" y="26" width="17" height="17" rx="5" className="fill-roxo" />
+<rect x="26" y="26" width="17" height="17" rx="5" className="fill-anil" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › as ferramentas são os quatro quadradinhos
-<rect x="26" y="5" width="17" height="17" rx="5" className="fill-azul" />
+<rect x="26" y="26" width="17" height="17" rx="5" className="fill-azul" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › nenhuma cor é escrita
-<rect x="5" y="26" width="17" height="17" rx="5" className="fill-verde" />
+<rect x="5" y="26" width="17" height="17" rx="5" fill="#2fbf5b" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › nenhuma cor é escrita
-<rect x="30.5" y="29" width="5" height="5" rx="1.5" className="fill-icone-linha" />
+<rect x="30.5" y="29" width="5" height="5" rx="1.5" className="fill-icone-linha" style={{ display: 'block' }} />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › nenhuma cor é escrita
-<circle cx="38" cy="21" r="4.5" className="fill-icone-linha" />
+<circle cx="38" cy="21" r="4.5" className="fill-icone-linha" stroke="none" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › são chapados e parados
-<circle cx="38" cy="21" r="4.5" className="fill-icone-linha" />
+<circle cx="38" cy="21" r="4.5" className="fill-icone-linha" opacity=".5" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › são chapados e parados
-<rect x="33" y="8" width="5" height="11" rx="1.5" className="fill-laranja" />
+<title>Casa</title>
+<rect x="33" y="8" width="5" height="11" rx="1.5" className="fill-laranja" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada um tem de 3 a 10 formas
-<rect x="30.5" y="29" width="5" height="5" rx="1.5" className="fill-icone-linha" />
+<rect x="30.5" y="29" width="5" height="5" rx="1.5" className="fill-icone-linha" />
+<circle cx="1" cy="1" r="1" className="fill-icone-linha" />
+<circle cx="1" cy="1" r="1" className="fill-icone-linha" />
+<circle cx="1" cy="1" r="1" className="fill-icone-linha" />
+<circle cx="1" cy="1" r="1" className="fill-icone-linha" />
+<circle cx="1" cy="1" r="1" className="fill-icone-linha" />
```

```mutacao
arquivo: apps/web/src/componentes/icones/lugares.tsx
teste: apps/web/src/componentes/icones/lugares.test.tsx › cada um é um desenho diferente
-turmas: Turmas,
+turmas: Inicio,
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › cada nome dá um SVG de 0 0 48 48
-viewBox="0 0 48 48"
+viewBox="0 0 24 24"
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › cada nome dá um SVG de 0 0 48 48
-data-icone={nome}
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › o tamanho é a largura e a altura
-width={tamanho}
+width={48}
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › o tamanho é a largura e a altura
-height={tamanho}
+height={48}
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › com `rotulo` é uma imagem com esse nome
-role={nomeado ? 'img' : undefined}
+role={undefined}
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › com `rotulo` é uma imagem com esse nome
-aria-label={nomeado ? rotulo : undefined}
+aria-label={undefined}
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › com `rotulo` é uma imagem com esse nome
-aria-hidden={nomeado ? undefined : true}
+aria-hidden={true}
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › sem `rotulo` some da leitura de tela
-aria-hidden={nomeado ? undefined : true}
+aria-hidden={undefined}
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › `rotulo` vazio é o mesmo que sem rótulo
-const nomeado = rotulo !== undefined && rotulo !== ''
+const nomeado = rotulo !== undefined
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › sem `rotulo` some da leitura de tela
-const nomeado = rotulo !== undefined && rotulo !== ''
+const nomeado = rotulo !== ''
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › não recebe foco nem encolhe na linha
-focusable="false"
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › não recebe foco nem encolhe na linha
-className="block shrink-0"
+className="block"
```

```mutacao
arquivo: apps/web/src/componentes/Icone.tsx
teste: apps/web/src/componentes/Icone.test.tsx › não recebe foco nem encolhe na linha
-className="block shrink-0"
+className="shrink-0"
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › com `rotulo` é uma imagem com esse nome
-role={nomeado ? 'img' : undefined}
+role={undefined}
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › com `rotulo` é uma imagem com esse nome
-aria-label={nomeado ? rotulo : undefined}
+aria-label={undefined}
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › com `rotulo` é uma imagem com esse nome
-aria-hidden={nomeado ? undefined : true}
+aria-hidden={true}
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › sem `rotulo` some da leitura de tela
-aria-hidden={nomeado ? undefined : true}
+aria-hidden={undefined}
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › `rotulo` vazio é o mesmo que sem rótulo
-const nomeado = rotulo !== undefined && rotulo !== ''
+const nomeado = rotulo !== undefined
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › sem `rotulo` some da leitura de tela
-const nomeado = rotulo !== undefined && rotulo !== ''
+const nomeado = rotulo !== ''
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › cada uma das dez famílias tem o fundo
-laranja: 'bg-laranja-claro text-laranja-texto',
+laranja: 'bg-azul-claro text-laranja-texto',
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › cada uma das dez famílias tem o fundo
-rosa: 'bg-rosa-claro text-rosa-texto',
+rosa: 'bg-rosa-claro text-lima-texto',
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › cada tamanho é o lado dele
-36: 'size-9',
+36: 'size-8',
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › cada tamanho é o lado dele
-56: 'size-14',
+56: 'size-12',
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › é o quadrado de canto 12 que não encolhe
-className={`inline-flex shrink-0 items-center justify-center rounded-controle ${LADO[tamanho]} ${COR_DA_FAMILIA[familia]}`}
+className={`inline-flex items-center justify-center rounded-controle ${LADO[tamanho]} ${COR_DA_FAMILIA[familia]}`}
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › é o quadrado de canto 12 que não encolhe
-className={`inline-flex shrink-0 items-center justify-center rounded-controle ${LADO[tamanho]} ${COR_DA_FAMILIA[familia]}`}
+className={`inline-flex shrink-0 items-center justify-center ${LADO[tamanho]} ${COR_DA_FAMILIA[familia]}`}
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › cada uma das dez famílias tem o fundo
-className={`inline-flex shrink-0 items-center justify-center rounded-controle ${LADO[tamanho]} ${COR_DA_FAMILIA[familia]}`}
+className={`inline-flex shrink-0 items-center justify-center rounded-controle ${LADO[tamanho]}`}
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › cada tamanho é o lado dele
-className={`inline-flex shrink-0 items-center justify-center rounded-controle ${LADO[tamanho]} ${COR_DA_FAMILIA[familia]}`}
+className={`inline-flex shrink-0 items-center justify-center rounded-controle ${COR_DA_FAMILIA[familia]}`}
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › serve ao ícone ilustrado e ao do `lucide`
-<span className="flex size-[72%] items-center justify-center [&>svg]:size-full">{children}</span>
+<span className="flex size-[70%] items-center justify-center [&>svg]:size-full">{children}</span>
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › serve ao ícone ilustrado e ao do `lucide`
-<span className="flex size-[72%] items-center justify-center [&>svg]:size-full">{children}</span>
+<span className="flex size-[72%] items-center justify-center">{children}</span>
```

```mutacao
arquivo: apps/web/src/componentes/Ladrilho.tsx
teste: apps/web/src/componentes/Ladrilho.test.tsx › cada uma das dez famílias tem o fundo
-data-ladrilho={familia}
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | "A medida da entrada inteira, com a casca ligada, ficou para a 12.0. Ela precisa sair lá com o número no documento da tarefa, porque o primeiro quadro no Chromebook às 7h30 depende dela." | `tasks/prd-pele-e-casca/12_task.md`: a 12.0 já é quem mede a entrada de verdade (9.3 desta tarefa e Tech Spec 7c); o número vai para o documento dela |
| frontend-reviewer (1ª) | No tema claro, o corpo da casa é `#EFEFEF` sobre fundo branco e quase some; se a lateral ficar fraca, o ladrilho dá o fundo | `12_task.md`: só se vê na lateral, que a 12.0 liga; é o desenho do mockup, e mudar a cor mudaria a 9.1 |
| frontend-reviewer (1ª) | O ícone `tarefas` a 24 px ainda é legível, mas o visto fica fino; reconferir a 36 px dentro do ladrilho | `12_task.md`: a foto da lateral, na 12.0, é onde o ícone aparece nessa medida |
| test-engineer (1ª) | `Ladrilho` com `rotulo` que contém um `Icone` também com `rotulo` daria dois nomes na mesma imagem: provar que o de dentro some, ou documentar que o filho vai sem rótulo | `12_task.md`: é a tarefa que põe `Icone` dentro de `Ladrilho` na casca; a escolha muda o contrato da peça, e hoje nada a usa assim |
| test-engineer (1ª) | Nada falha se `Icone` ou `Ladrilho` forem postos em `PECAS_FORA_DA_ENTRADA` | `12_task.md`: a 12.0 mede a entrada de verdade, e é lá que o ícone passa a ser importado e o teto passa a valer |
| test-engineer (1ª) | O e2e mede o ícone só a 24, 32 e 48 px; 28 e 40 só têm o atributo provado na unidade | `12_task.md`: a galeria não mostra o 28, e o 40 só aparece no ladrilho; o e2e da lateral mede cada tamanho que a casca usa |

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
| 2026-10-13 18:45:30 | 2026-10-13 18:45:48 | `infra-guardian` | 1 | APROVADO | a34013272191faf7e |
| 2026-10-13 18:45:26 | 2026-10-13 18:45:58 | `frontend-reviewer` | 1 | APROVADO | a3c14b5d1c2b5d6f2 |
| 2026-10-13 18:45:37 | 2026-10-13 18:46:38 | `revisor-geral` | 1 | APROVADO | a99e63193dc87a9b7 |
| 2026-10-13 18:45:33 | 2026-10-13 18:48:06 | `test-engineer` | 1 | APROVADO | a98dfed02af988b93 |
