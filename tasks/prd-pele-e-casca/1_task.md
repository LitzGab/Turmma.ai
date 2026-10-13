# Tarefa 1.0 — Os tokens da D80 existem no claro e no escuro, e nenhuma tela perde cor

**Funcionalidade:** pele-e-casca · **Depende de:** nenhuma
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O `estilos.css` passa a declarar os tokens da D80 nos dois temas, iguais aos do documento, e toda tela continua
pintada: com `data-tema="escuro"` no `<html>`, o produto inteiro escurece sem que nenhuma tela mude uma classe.

## Contexto necessário

- `techspec.md` seção 9, parágrafos **Tokens**, **Desvios do mockup** e **Foco** (só o token); seção 10, linha
  Unidade (Tokens, Contraste e Guarda de cor) e linha E2E (`tokens`); seção 13 (o risco do `white`)
- `cenarios.md`, parte A: as linhas marcadas com a tarefa 1.0
- `prd.md` RF1, RF2 e o caso de borda do Chrome 109
- `docs/interface.md` 9.1 (cor, e a tabela "Pares de contraste") e **9.10** (os dois blocos `css` que viram o código)
- `.claude/rules/50-frontend.md`, itens 1 e 11: o Chrome 109 descarta `oklch()` e `color-mix()`, e contraste é regra
- Código: `apps/web/src/estilos.css` (o comentário do topo diz por que a paleta é zerada);
  `apps/web/src/estilos.test.ts` (como o teste lê o bloco do documento e varre as classes);
  `e2e/tokens.spec.ts` (`tokensDaD72`, `coresServidas`); `e2e/casca.spec.ts`, caso "E5"; `apps/web/rebaixar-cor.ts`

## Subtarefas

- [x] 1.1 — `estilos.css`: trocar o `@theme static` pelo bloco claro da 9.10 e acrescentar o bloco
  `:root[data-tema='escuro']`, **fora de camada**, com os mesmos nomes. Os 33 nomes de hoje ficam. `veu` é hex de
  oito dígitos. O `html` ganha o chão e o texto do tema (até o React montar, é ele que aparece), e entra a cor da
  seleção de texto nos dois temas. O `dialog::backdrop` **não muda aqui**: o véu leve é das peças de diálogo (7.0).
  Não entram tipografia, degrau nem a regra do foco: são da 3.0 (o token `foco` entra aqui)
- [x] 1.2 — `docs/interface.md`: apagar o bloco `css` antigo da 9.9 e a linha que anuncia a troca; a 9.10 é a fonte
- [x] 1.3 — O texto sobre face forte deixa de depender do tema (lista em "Como testar", umas 22 linhas em 14
  arquivos): `text-white` sobre `noite` e sobre `erro` vira `text-sobre-grafite` (branco no claro, escuro no
  escuro; o perigo cheio muda de face na 3.0); `text-tinta` sobre `caramelo`, `caramelo-claro` e `caramelo-fundo`
  vira `text-sobre-cor` (escuro nos dois temas). O `CodigoQr` continua com fundo branco nos dois temas (o leitor
  de QR precisa do contraste): fica `bg-white`, com o comentário, e é o único da lista fechada
- [x] 1.4 — `estilos.test.ts`: ler os dois blocos da 9.10; o claro e o escuro do CSS iguais aos do documento, nome a
  nome, com o mesmo conjunto de nomes nos dois e o número fixo de cada bloco; todo valor em hex. A guarda de classes
  aceita os nomes novos e passa a reprovar também: `white` e `black` fora de uma lista fechada de arquivos (o
  `CodigoQr`), a variante `dark:`, o texto que não acompanha a face forte, e a cor escrita à mão em qualquer lugar dos `.ts` e
  `.tsx`, com a cor pelo nome entre aspas (como a guarda da cor escrita à mão ficou, e por quê, está em "Divergências"; o `CodigoQr` é a exceção
  nomeada, e a onça entra na lista na tarefa 8.0)
- [x] 1.5 — `apps/web/src/contraste.test.ts` (novo): ler a tabela "Pares de contraste" da 9.1, de número fixo de
  linhas, e calcular cada par nos dois temas, pela fórmula da WCAG 2.1, contra o mínimo da linha
- [x] 1.6 — `e2e/tokens.spec.ts` e o "E5" de `e2e/casca.spec.ts`: o CSS servido tem os dois blocos com os valores do
  documento, e não tem `oklch(`, `color-mix(`, `:has(`, `scrollbar-width` nem `@font-face`
- [x] 1.7 — Medir o CSS servido em brotli, antes e depois, e escrever os dois números na seção "Divergências" deste
  documento (Tech Spec, seção 7c)
- [x] 1.8 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/estilos.css` | alterado |
| `apps/web/src/estilos.test.ts` | alterado |
| `apps/web/src/contraste.test.ts` | novo |
| `apps/web/src/componentes/botao-secundario.ts` | alterado |
| `apps/web/src/componentes/botao-secundario.test.ts` | alterado |
| `apps/web/src/componentes/itens-da-lateral.tsx` | alterado |
| `apps/web/src/componentes/CodigoQr.tsx` | alterado |
| `apps/web/src/componentes/Botao.tsx` | alterado (só o comentário) |
| `apps/web/src/componentes/ia/AvatarAgente.tsx` | alterado |
| `apps/web/src/areas/navegacao.ts` | alterado |
| `apps/web/src/areas/aluno/Atividade.tsx` | alterado |
| `apps/web/src/areas/professor/Home.tsx` | alterado |
| `apps/web/src/operacao/componentes/CascaDaOperacao.tsx` | alterado |
| `apps/web/src/operacao/componentes/NavegacaoDaLista.tsx` | alterado |
| `apps/web/src/operacao/paginas/Mfa.tsx` | alterado |
| `apps/web/src/operacao/paginas/ConfigurarMfa.tsx` | alterado |
| `apps/web/src/operacao/paginas/Uso.tsx` | alterado |
| `apps/web/src/paginas/SemDesafio.tsx` | alterado |
| `apps/web/src/paginas/AcessoSuspenso.tsx` | alterado |
| `apps/web/src/paginas/ConfigurarMfa.tsx` | alterado |
| `e2e/tokens.spec.ts` | alterado |
| `e2e/casca.spec.ts` | alterado |
| `docs/interface.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| os dois blocos do CSS iguais aos do documento | unidade | um hex trocado, em qualquer tema e em qualquer dos dois lados, reprova (RF1) |
| nome que só existe num tema | unidade | token do claro sem valor no escuro reprova: no escuro a tela herdaria a cor clara |
| cor fora da lista, arbitrária ou com opacidade | unidade | a guarda reprova a classe, com o arquivo, e aceita os nomes novos |
| `white`, `black`, `dark:` e cor em linha | unidade | `text-white` fora da lista fechada, `dark:bg-tinta` e a cor escrita à mão em qualquer posição (`fill="#333"`, a segunda camada de uma sombra, `inset-shadow-[#fff]`, `fill={aberto ? 'white' : 'none'}`) reprovam, com o arquivo; o `CodigoQr` passa |
| mesmo conjunto de nomes nos dois blocos | unidade | o número de cores de cada bloco é fixo, e o teste não passa com o bloco lido pela metade |
| contraste de cada par, nos dois temas | unidade | cada linha da tabela de pares passa do mínimo dela; um par abaixo reprova com o nome e o número; a tabela tem o número fixo de linhas (RF2) |
| os pares antigos e o desligado | unidade | `pendente`, `ok`, `erro`, `info` e `ia` sobre a `-cx` de cada um, e `apoio` sobre `borda` (o desligado), passam de 4,5:1 nos dois temas |
| o CSS servido, nos dois temas | e2e | o navegador recebe os dois blocos com os valores do documento, sem `oklch(`, `color-mix(`, `:has(`, `scrollbar-width` nem `@font-face` |
| borda de campo com 3:1 | unidade | `borda-campo` contra `fundo` e contra `campo`, nos dois temas |
| o texto sobre face forte, nos dois temas | unidade | `sobre-grafite` sobre `noite` e sobre `erro`, e `sobre-cor` sobre `caramelo`, `caramelo-claro` e `caramelo-fundo`, passam de 4,5:1 no claro e no escuro (estão na tabela de pares); e a guarda reprova `text-tinta` e `text-white` na mesma lista de classes e com a mesma variante de uma face forte |
| a seleção de texto, nos dois temas | unidade | o `::selection` pinta com `laranja-borda` e `tinta`, por variável, numa regra só; o par está na tabela de pares |
| nenhuma cor escrita fora dos tokens, no CSS | unidade | fora dos dois blocos de token, o `estilos.css` só escreve cor no véu do diálogo; um hex numa regra reprova |
| o QR continua lido no escuro | unidade | `CodigoQr.tsx` é o único arquivo da lista fechada: branco fixo e cor em linha passam nele e reprovam em qualquer outro |
| o escuro liga pelo atributo | e2e | com `data-tema="escuro"` no `<html>`, o chão e o texto calculados da página trocam, e voltam; sem violação do axe |

## Como testar

- Copie o padrão de `apps/web/src/estilos.test.ts › estilos.css declara exatamente as cores da 9.9`: o teste lê o
  documento, e não uma cópia. O que muda: dois blocos, e a comparação nos dois sentidos em cada um
- O contraste já tem a conta em `e2e/tokens.spec.ts` (`luminancia`, `contraste`): leve a fórmula para o teste de
  unidade, sem importar do e2e
- Isolado: `npx vitest run --project unidade apps/web/src/estilos.test.ts apps/web/src/contraste.test.ts`; depois
  `node tools/ci/e2e.ts --manter-ambiente e2e/tokens.spec.ts e2e/casca.spec.ts`
- As faces fortes: `grep -rnE "bg-(caramelo|caramelo-claro|caramelo-fundo|noite|erro)\b" apps/web/src --include='*.tsx' --include='*.ts'`,
  fora os testes; e `grep -rn "text-white\|bg-white"`
- Armadilha: os 18 valores de `rgb()` do e2e são do tema claro e **não mudam aqui** (nenhum valor claro que eles
  afirmam muda nesta tarefa; `lateral` e `linha` mudam e nenhum spec os afirma: confira com `grep "249, 249, 249\|232, 232, 232" e2e`)
- Armadilha: o Tailwind só emite variável de token que alguma classe usa, salvo no `@theme static`. O bloco escuro
  é CSS comum, fora do `@theme`
- Telas: `coordenacao`, `/coordenacao/governanca`; `professora`, `/professor/nova-conversa`; `aluno`,
  `/aluno/atividades`. No claro, devem ficar como antes (a escolha do escuro só existe na 2.0; aqui o escuro se
  prova pelo CSS servido). Mockup: `/fundamentos` (a seção Cor)

## Fora do escopo desta tarefa

A escolha da aparência e o script do `index.html` (2.0); tipografia, degrau, foco e botão (3.0); qualquer mudança
de desenho de peça.

## Divergências resolvidas nesta tarefa

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| O `borda-campo` do escuro é `#6b7f88`, e o `caramelo-fundo` do escuro, `#d4651f`; o mockup usa `#37464f` e `#ba5c25` | O primeiro precisa de 3:1 contra o chão e contra o campo; o segundo é face com texto em cima (4,5:1) | `techspec.md` §9, "Desvios do mockup"; `docs/interface.md` 9.1 e 9.10 |
| O primário desligado leva `disabled:text-tinta` | A face desligada (`inativo`) vira com o tema, e `sobre-cor` em cima dela dá 2,7:1 no escuro | `docs/interface.md` 9.1, tabela de pares ("desligado de antes") |
| A tabela de pares tem 88 linhas, e não as 65 do começo da tarefa | A rodada 2 da revisão da spec exigiu os pares em uso que faltavam: o `texto` de oito famílias sobre o chão e o fundo suave, `apoio` e `sutil` sobre a linha selecionada, `ok` e `pendente` sobre o chão e o hover do oficial de antes | `revisao-spec.md`, rodada 2, item 4; `docs/interface.md` 9.1 |
| A seleção de texto pinta com `laranja-borda` e `tinta`, por variável, numa regra só | Os dois hex escritos à mão da primeira versão (`#fbd9c3` e `#734528`) estavam fora da 9.10; com token a regra vira sozinha com o tema e entra na tabela de pares | Ordem de correção da 1ª rodada, item 3; `docs/interface.md` 9.1, par "texto selecionado" |
| A guarda procura a cor escrita à mão (hex ou função de cor, sem diferença de caixa) no arquivo inteiro, inclusive entre os colchetes de uma classe, e a cor pelo nome quando ela é o texto inteiro entre aspas; a Tech Spec dizia "em `fill`, `stroke` e `style`" | Toda regra presa à posição ou à forma da classe deixou passar um caso: a segunda camada da sombra, o segundo hex do gradiente, o atributo com valor condicional, o objeto de estilo numa constante e, na 3ª rodada, `inset-shadow-[#fff]`, que a guarda de classes não conhece. Hoje a web inteira tem uma cor escrita, a do QR, que é a exceção nomeada. Falsos positivos aceitos: o hex num comentário, a âncora e o `url(#…)` com nome que parece hex, e o texto entre aspas que é exatamente um nome de cor do CSS (`'tan'`, `'gold'`, `'navy'`), em qualquer caixa. Limite declarado: a cor pelo nome dentro de um valor composto e a cor montada em tempo de execução, que ficam com o axe no tema escuro (2.0) | `techspec.md` §10, "Guarda de cor", que passou a dizer o mesmo; ordem de correção da 2ª rodada, item 1 |
| O E5 de `casca.spec.ts` procura o grafite como `#333`, e não `#333333` | O build encurta o hex de dígitos repetidos; os outros seis hex da A9 entram por extenso | `cenarios.md`, A9 |
| O `docs/interface.md` leva, neste commit, também as correções das rodadas 2 a 4 da revisão da spec (medidas do botão, o `.svg` com hash no lugar de `public/`, "nenhum laço", a onça fora do catálogo de `estado/`) | A tabela de pares e a 9.10, que os testes desta tarefa leem, moram no mesmo arquivo, e as duas coisas correram na mesma árvore | `revisao-spec.md`, rodadas 2 a 4 |
| O `html` ganha `background-color` e `color` do tema | Cada casca pinta o próprio fundo, mas até o React montar o que aparece é o `html`: no escuro, o primeiro quadro seria o cinza do navegador | `techspec.md` §5, "O tema" |

Medida do CSS servido (Tech Spec, seção 7c), no build de produção: **antes** 30.133 bytes, 5.685 em brotli; **depois**
34.709 bytes, 6.584 em brotli (mais 899 bytes em brotli, com os dois temas).

## Mutações

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › o claro e o escuro têm o mesmo conjunto de nomes
  --color-borda-forte: #52656d;
- --color-borda-campo: #6b7f88;
  --color-apagado: #52656d;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/contraste.test.ts › no tema escuro, todo par passa do mínimo dele
  --color-apoio: #dce6ec;
- --color-sutil: #8fa3ad;
+ --color-sutil: #52656d;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › o bloco claro de estilos.css declara exatamente as cores da 9.10
- --color-foco: #146eaa;
+ --color-foco: #146eab;
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/estilos.test.ts › nenhum arquivo da web pede cor fora do @theme da 9.10
- const COR_DO_PERIGO_CHEIO = 'bg-erro text-sobre-grafite disabled:bg-inativo disabled:text-tinta'
+ const COR_DO_PERIGO_CHEIO = 'bg-erro text-white disabled:bg-inativo disabled:text-tinta'
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › só a primária pinta de laranja
- primario: 'bg-caramelo text-sobre-cor enabled:hover:bg-caramelo-claro enabled:active:bg-caramelo-fundo disabled:bg-inativo disabled:text-tinta',
+ primario: 'bg-caramelo text-tinta enabled:hover:bg-caramelo-claro enabled:active:bg-caramelo-fundo disabled:bg-inativo disabled:text-tinta',
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: e2e/tokens.spec.ts › o escuro liga pelo atributo do html
  html {
-   background-color: var(--color-fundo);
    color: var(--color-tinta);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: e2e/tokens.spec.ts › o escuro liga pelo atributo do html
  html {
    background-color: var(--color-fundo);
-   color: var(--color-tinta);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › a seleção de texto pinta com token
  ::selection {
    background-color: var(--color-laranja-borda);
-   color: var(--color-tinta);
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda reprova o que não vira com o tema
  for (const achado of conteudo.matchAll(COR_ESCRITA)) {
-   achados.set(achado.index, classeArbitraria(conteudo, achado.index) ?? `${nomeDe(achado.index)} ${achado[0]}`)
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda reprova o que não vira com o tema
  for (const achado of conteudo.matchAll(COR_ESCRITA)) {
-   achados.set(achado.index, classeArbitraria(conteudo, achado.index) ?? `${nomeDe(achado.index)} ${achado[0]}`)
+   if (conteudo[achado.index - 1] !== '[') achados.set(achado.index, classeArbitraria(conteudo, achado.index) ?? `${nomeDe(achado.index)} ${achado[0]}`)
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda reprova o que não vira com o tema
- const COR_ESCRITA = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/gi
+ const COR_ESCRITA = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix)\(/g
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda reprova o que não vira com o tema
- const COR_PELO_NOME = new RegExp(String.raw`(["'\`])(${NOMES_DE_COR_DO_CSS})\1`, 'gi')
+ const COR_PELO_NOME = new RegExp(String.raw`(["'\`])(${NOMES_DE_COR_DO_CSS})\1`, 'g')
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda reprova o que não vira com o tema
  for (const achado of conteudo.matchAll(COR_PELO_NOME)) {
-   achados.set(achado.index, `${nomeDe(achado.index)} ${achado[2] ?? ''}`)
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › a seleção de texto pinta com token
  ::selection {
-   background-color: var(--color-laranja-borda);
    color: var(--color-tinta);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › fora dos dois blocos de token
  ::placeholder {
-   color: var(--color-sutil);
+   color: #5d5d5d;
```

```mutacao
arquivo: apps/web/src/componentes/ia/AvatarAgente.tsx
teste: apps/web/src/estilos.test.ts › nenhum arquivo da web pede cor fora do @theme da 9.10
-   tutor: { icone: MessageCircleQuestion, cor: 'bg-caramelo text-sobre-cor' },
+   tutor: { icone: MessageCircleQuestion, cor: 'bg-caramelo text-tinta' },
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › só a primária pinta de laranja
- primario: 'bg-caramelo text-sobre-cor enabled:hover:bg-caramelo-claro enabled:active:bg-caramelo-fundo disabled:bg-inativo disabled:text-tinta',
+ primario: 'bg-caramelo text-sobre-cor enabled:hover:bg-caramelo-claro enabled:active:bg-caramelo-fundo disabled:bg-inativo',
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `frontend-reviewer` (1ª), `revisor-geral` (1ª) | `.bg-noite :focus-visible` usa `caramelo-noite`, que no escuro, sobre `noite` (`#f1f7fb`), dá cerca de 1,6:1 a 2:1: o foco some no cabeçalho da Operação, na dica da lateral e nos avatares; o comentário da linha 44 de `CascaDaOperacao.tsx` precisa acompanhar | Tarefa 3.0 (foco), com teste de contraste do anel contra cada face `bg-noite`; registrado no `3_task.md` |
| `frontend-reviewer` (1ª) | O texto de exemplo do campo "Peça uma atividade, um plano de aula…" é cortado na segunda linha a 360 px (`CaixaDoAssistente.tsx`); não vem desta tarefa | A tarefa que recompõe o compositor (10.0 da X1 ou 3.0 da X3) |
| `frontend-reviewer` (1ª) | "Abrir dado nominal de uma turma" usa `oficial` (preto sólido) no claro; conferir se o mockup pede o grafite com degrau | Tarefa 3.0 (botão) |
| `test-engineer` (2ª) | A guarda do texto sobre face forte só compara classes com a mesma variante: `bg-superficie text-tinta hover:bg-caramelo` passa | Tarefa 3.0, onde as peças passam a ter a face em variante: um caso de fixture a mais |
| `test-engineer` (2ª) | A lista de classes é lida uma linha por vez: lista quebrada em várias linhas, template com ternário e texto herdado de filho de `bg-noite` ficam de fora; hoje nenhum arquivo cai nisso | Limite conhecido; o axe no escuro (2.0) cobre o herdado. Caso de fixture na 3.0 |
| `revisor-geral` (2ª) | A divergência da seleção cita "item 3" da ordem, e para ele o item 3 era o `infinite` | Recusada pela Mesa: o item 3 da ordem dela é a seleção de texto; a numeração do revisor era a dele |
| `frontend-reviewer` (2ª) | O texto "Aprovado por gente", na governança, soa estranho | Não é desta tarefa: X2 `telas-da-coordenacao`, que recompõe a tela |
| `test-engineer` (4ª) | `classeArbitraria` só decide o texto da mensagem; um bloco de mutação deixaria isso dito | Recusada pela Mesa: o próprio revisor diz que não precisa; a mutação do `[` prova o comportamento que importa |
| `revisor-geral` (4ª) | `bg-[#1d4ed8]` reprova duas vezes, como classe fora do `@theme` e como cor escrita | Recusada pela Mesa: o revisor a chama de aceitável; o fixture declara as duas mensagens, e a duplicação é para o lado seguro |

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
| 2026-10-13 02:13:14 | 2026-10-13 02:14:00 | `frontend-reviewer` | 1 | APROVADO | aef3672b6d53c00b7 |
| 2026-10-13 02:13:17 | 2026-10-13 02:15:06 | `test-engineer` | 1 | REPROVADO | ab98af485fceb5cc1 |
| 2026-10-13 02:13:20 | 2026-10-13 02:15:46 | `revisor-geral` | 1 | REPROVADO | abddee412ecdf7944 |
| 2026-10-13 02:24:36 | 2026-10-13 02:25:00 | `frontend-reviewer` | 2 | APROVADO | a60710593c97cd915 |
| 2026-10-13 02:24:45 | 2026-10-13 02:25:39 | `test-engineer` | 2 | APROVADO | a4b2ed3959d14e030 |
| 2026-10-13 02:24:53 | 2026-10-13 02:26:21 | `revisor-geral` | 2 | REPROVADO | a91cf6327548e5103 |
| 2026-10-13 02:35:34 | 2026-10-13 02:35:52 | `frontend-reviewer` | 3 | APROVADO | a7c74a666c0ace307 |
| 2026-10-13 02:35:24 | 2026-10-13 02:36:39 | `test-engineer` | 3 | APROVADO | a5ad28a9250c6a116 |
| 2026-10-13 02:35:16 | 2026-10-13 02:36:53 | `revisor-geral` | 3 | REPROVADO | a1bc148fb1ab2274e |
| 2026-10-13 07:58:05 | 2026-10-13 07:59:06 | `test-engineer` | 4 | REPROVADO | a0c1bad5f2416f21e |
| 2026-10-13 07:58:11 | 2026-10-13 07:59:08 | `revisor-geral` | 4 | REPROVADO | aa525ac64bebfa345 |
| 2026-10-13 08:05:19 | 2026-10-13 08:05:45 | `test-engineer` | 5 | APROVADO | a9c13ebfb6b1ebf26 |
| 2026-10-13 08:05:28 | 2026-10-13 08:05:53 | `revisor-geral` | 5 | REPROVADO | ac955b8ec2b36b927 |
| 2026-10-13 08:12:27 | 2026-10-13 08:13:39 | `revisor-geral` | 6 | REPROVADO | aba625d89bfeabc8a |
| 2026-10-13 08:20:05 | 2026-10-13 08:20:43 | `revisor-geral` | 7 | APROVADO | a9325ba0eee84e2eb |
