# Tarefa 3.0 — O botão ganha o degrau e os seis desenhos da D80, em todo o produto

**Funcionalidade:** pele-e-casca · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Todo botão do produto passa a ter canto de 12 px, rótulo em caixa-alta e degrau, nos seis desenhos da D80; o foco
vira o anel azul de 3 px em toda peça; e entram no CSS a tipografia `t-*` e a regra de movimento reduzido. A decisão
oficial continua com um botão que não se parece com nenhum outro.

## Contexto necessário

- `techspec.md` seção 9, parágrafos **Degrau**, **Foco**, **Peças revestidas** e **Chromebook**; seção 10 (as
  regras de produto presas a cor)
- `prd.md` RF5, RF6, RF7 e RF8
- `docs/interface.md` 9.2 (tipografia), 9.3 (degrau: altura por peça e o que afunda), 9.5 (movimento) e 10.2 (botão)
- `.claude/rules/50-frontend.md`, itens 2a, 8 e 11; `.claude/rules/70-conformidade-cne.md`: aprovar não vira clique
  reflexo, e por isso o oficial tem desenho próprio
- Código: `apps/web/src/componentes/botao-secundario.ts` (a tabela de variantes e as constantes para `<button>` e
  `<a>` escritos à mão: as duas têm de dizer o mesmo botão) e o teste dela; `apps/web/src/componentes/Botao.tsx`;
  `apps/web/src/estilos.css`; `e2e/tokens.spec.ts` (o botão primário e o anel de foco)

## Subtarefas

- [x] 3.1 — `estilos.css`: as classes `t-*` da 9.2; o **degrau** de um elemento só (`box-shadow` sólido de
  `--altura-degrau` em `--lado`, margem de baixo igual, e apertado com `translateY` e a sombra menor), com as
  classes de cor `degrau-laranja`, `degrau-grafite`, `degrau-borda`, `degrau-vermelho` e `degrau-azul`; o anel de
  foco de 3 px em `foco`, afastado 2 px; a regra global de `prefers-reduced-motion`. A sombra do degrau e a cor do
  hover **trocam sem transição**: só o `transform` anima, em 100 ms
- [x] 3.2 — `botao-secundario.ts`: primário (face `laranja`, texto `sobre-cor`, degrau laranja), oficial (face
  `grafite`, texto `sobre-grafite`, degrau grafite), secundário (face `superficie`, borda de 2 px e degrau em
  `borda`), discreto (sem face nem degrau, texto `azul-texto`), perigo (como o secundário, texto e borda da família
  vermelha) e perigo cheio (face `vermelho`, texto `sobre-cor`; **só dentro da confirmação**). Desligado: sem
  degrau, face `borda`, texto `apoio` (o teste resolve a cor por tema e exige 4,5:1 contra a face). Tamanhos: `principal` com 44 px de face, `compacto` com 36 no computador e 44
  abaixo de 768, `icone` de 44. As constantes (`CLASSES_DO_BOTAO_*`) continuam dizendo o mesmo que a tabela
- [x] 3.3 — A seção de botões da galeria (`galeria/secoes/botoes.tsx`): cada desenho, cada tamanho, ligado e
  desligado, com ícone e sem
- [x] 3.4 — Os specs que afirmam a cor e a medida do botão e do foco (lista em "Como testar"): troque o `rgb()` e a
  medida, e mantenha a regra que cada um prova
- [x] 3.5 — O teto de `pecas-*` sobe de 26 para 40 kB, em `.size-limit.json` e nos cinco casos de
  `tools/ci/tamanho-web.test.ts` (Tech Spec, 7c). Fica aqui, no tronco, porque as tarefas 4.0 a 10.0 correm em
  linhas e qualquer uma delas pode passar dos 26 kB primeiro
- [x] 3.6 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/estilos.css` | alterado |
| `apps/web/src/estilos.test.ts` | alterado |
| `apps/web/src/componentes/botao-secundario.ts` | alterado |
| `apps/web/src/componentes/botao-secundario.test.ts` | alterado |
| `apps/web/src/componentes/Botao.tsx` | alterado |
| `apps/web/src/componentes/Botao.test.tsx` | novo |
| `apps/web/src/galeria/secoes/botoes.tsx` | alterado |
| `e2e/tokens.spec.ts` | alterado |
| `e2e/pecas-botoes.spec.ts` | alterado |
| `e2e/pedidos.spec.ts` | alterado |
| `e2e/professor-turma.spec.ts` | alterado |
| `e2e/professor-assistente.spec.ts` | alterado |
| `e2e/acesso-da-turma.spec.ts` | alterado |
| `e2e/material.spec.ts` | alterado |
| `e2e/__fixtures__/pedidos-do-titular.ts` | alterado |
| `docs/interface.md` | alterado (9.3 e 10.2, se a medida construída divergir) |
| `.size-limit.json`, `tools/ci/tamanho-web.test.ts` | alterados |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| só o oficial é grafite | unidade | a face e o degrau do oficial não são os de nenhuma outra variante, com os valores dos dois temas lidos do CSS (RF6) |
| contraste das classes de verdade | unidade | as classes de `classesDoBotao` de cada variante (face e texto: ligado, hover, apertado e desligado), resolvidas em hex por tema, têm 4,5:1 em cada combinação; mutação declarada: `disabled:text-sutil` no lugar de `disabled:text-apoio` fica vermelho no escuro |
| grafite só onde é oficial | unidade (guarda de `estilos.test.ts`) | `bg-grafite` e `bg-noite` (com `-alto` e `-baixo`) só aparecem como face na lista fechada: as constantes do oficial e os quatro usos de antes (`Atividade.tsx`, `Home.tsx`, `NavegacaoDaLista.tsx`, a dica de `itens-da-lateral.tsx`), cada um com a justificativa e a tarefa ou spec que o tira; arquivo novo com a classe reprova (RF6) |
| o teto das peças | unidade (`tools/ci/tamanho-web.test.ts`) | `pecas-*` de 40 kB passa e de 41 kB reprova; os tetos da entrada, das fachadas das áreas e da operação não mudaram |
| o anel sobre a face escura de antes | e2e | o anel de foco tem 3:1 contra cada face `bg-noite` que ainda existe (cabeçalho da Operação, dica da lateral, avatares), nos dois temas: hoje `.bg-noite :focus-visible` usa `caramelo-noite`, que no escuro dá menos de 2:1 (achado da 1ª rodada da 1.0); o comentário da linha 44 de `CascaDaOperacao.tsx` acompanha |
| o texto que não acompanha a face nova | unidade (guarda de `estilos.test.ts`) | `FACE_FORTE` passa a listar as faces que a 3.0 cria (`laranja` e as variantes dela, `grafite`): `text-tinta` ou `text-white` com a mesma variante de uma delas reprova, e o fixture ganha o caso da face em variante com o texto sem ela |
| só o primário é laranja | unidade | nenhuma outra variante tem a face `laranja`; o texto em cima é `sobre-cor` |
| perigo cheio só com `cheio` | unidade e componente | sem `cheio`, o perigo nunca tem face vermelha; o tipo não aceita `cheio` em outra variante |
| a constante e a tabela dizem o mesmo botão | unidade | `CLASSES_DO_BOTAO_SECUNDARIO`, `_OFICIAL`, `_PERIGO` e `_PERIGO_CHEIO` iguais a `classesDoBotao` da variante |
| desligado é outro desenho | componente e e2e | sem degrau, com face e texto próprios; o clique não faz nada; distinguível do ligado sem depender de cor de marca |
| alvo de 44 px | e2e (`celular`) | toda variante e tamanho, na galeria; o `compacto` tem 36 só a partir de 768 |
| apertado sem hover | e2e (`celular`) | o toque desce a face (o `transform` muda) sem depender de ponteiro |
| a aprovação continua oficial, e a tela de aprovar não tem botão laranja | e2e | `pedidos`, `professor-turma` e `professor-assistente` continuam provando a regra, com o `rgb()` do grafite |
| no máximo um botão laranja por tela | e2e | `material` e `professor-turma` continuam contando |
| o anel de foco, nos dois temas | e2e | 3 px, afastado 2 px, na cor `foco`; a cor é medida, e não só a largura (RF7) |
| movimento reduzido | e2e | com `reducedMotion: 'reduce'`, apertar não desloca; e nenhuma propriedade além de `transform` e `opacity` tem transição no CSS servido (RF8) |
| o `rgb()` de cada spec | e2e | cada spec da lista passa, com a cor nova e a mesma asserção de regra |

A linha de log não se aplica. A de recomeço não se aplica: a tarefa não muda tela com sessão, link ou formulário.

## Como testar

- Copie `apps/web/src/componentes/botao-secundario.test.ts` (os sete casos de hoje): cada um ganha o equivalente,
  nenhum sai
- Cor e contraste no navegador: `e2e/tokens.spec.ts › botão primário` (`corDe`, `contraste`)
- Quem afirma cor de botão: `grep -rn "rgb(13, 13, 13)\|rgb(232, 115, 46)\|rgb(180, 35, 24)\|rounded-full" e2e apps/web/src --include='*.ts' --include='*.tsx'`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/botao-secundario.test.ts apps/web/src/componentes/Botao.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/tokens.spec.ts e2e/pecas-botoes.spec.ts e2e/pedidos.spec.ts`
- Armadilha: há 77 `<button>` escritos à mão; os que usam as constantes mudam junto, e os de classe solta ficam
  como estão até a spec da área. Não os converta aqui
- Armadilha: a margem do degrau soma 4 px embaixo de cada botão; confira as barras presas (`BarraPresa`) e os rodapés
  de diálogo na foto
- Telas: `coordenacao`, `/coordenacao/estrutura`; `professora`, `/professor/turmas`; `aluno`, `/aluno/atividades`;
  `/galeria`. Mockup: `/fundamentos` (a seção Botões)

## Fora do escopo desta tarefa

Campos (4.0), cartões (5.0), diálogos (7.0); converter botão escrito à mão em `Botao`.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|
| São **seis** classes de cor do degrau, e não cinco: `degrau-laranja`, `degrau-grafite`, `degrau-borda`, `degrau-vermelho`, `degrau-vermelho-borda` e `degrau-azul` | O `perigo` tem a borda e o texto da família vermelha, e o `docs/interface.md` 10.2 manda o degrau dele em `vermelho-borda`; o `perigo` cheio é que leva o `vermelho-degrau`. Uma classe só para os dois deixaria o `perigo` de linha com o degrau escuro de um botão cheio. A `degrau-azul` é da peça selecionada (cartões, a 5.0) | `techspec.md` §9 ("Degrau"), que passou a dizer as seis; `docs/interface.md` 9.3 |
| O anel de foco sobre a face `noite` **não some** no escuro: a regra `.bg-noite :focus-visible` fica, trocando a cor do anel para o `sobre-grafite`, e não é mais o `caramelo-noite` | O `cenarios.md` A7 dizia "a regra sai". No escuro a `noite` é clara (`#f1f7fb`) e o `foco` (`#60b9f4`) dá 1,99:1 sobre ela, e a tarefa exige 3:1 nos dois temas. O `sobre-grafite` é o texto da própria face (15:1). No claro o `foco` dá 3,55:1 sobre a `noite` e a regra não existe. O grupo da `Aparencia` na faixa da operação tem chão próprio, e o anel dentro dele volta ao `foco`. A regra sai de vez com a faixa preta, na 15.0 | `cenarios.md` A7 (reescrita); `techspec.md` §9 ("Foco"); `docs/interface.md` 10.1, item 2; comentário de `CascaDaOperacao.tsx` |
| `FACE_FORTE` da guarda lista também `vermelho`, e a guarda ganhou uma regra: a face que troca sob uma variante (`hover:bg-laranja`) com o texto do estado normal em `tinta` ou `white` e nenhum texto da mesma variante reprova | A tarefa pedia `laranja` e `grafite`. O `perigo` cheio tem face `vermelho` com `sobre-cor`, e o mesmo erro de texto escuro sobre ela passaria sem a guarda. A regra da face em variante é a recomendação do `test-engineer` na 2ª rodada da 1.0; os limites dela (lista em várias linhas, template ternário) estão dados em fixtures | `techspec.md` §9; `cenarios.md` U3 e U4 (a guarda de cor) |
| O desligado é **um** só para todas as variantes, o discreto inclusive: `disabled:border-borda disabled:bg-borda disabled:text-apoio`, e `.degrau:disabled { box-shadow: none }` guarda a margem | A tarefa descreve o desligado do botão com face; o discreto não tem face nem degrau, e um desenho de desligado próprio para ele daria um sexto estado. Com a mesma peça (`borda` com `apoio`), o desligado é distinguível do ligado em todos, sem depender de cor de marca. O apertado não troca cor: só desce e encolhe a sombra | `techspec.md` §9 ("Degrau"); `cenarios.md` U10, A38 e A41 |
| O botão só de ícone usa `[--altura-degrau:3px]` na própria classe de tamanho, e não uma classe de degrau a mais | A 9.3 manda 3 px para o botão só de ícone. A altura é uma variável do mesmo `.degrau`, e a peça diz o que muda; uma classe `degrau-3` só repetiria o `.degrau` | `docs/interface.md` 9.3 |
| O `apertado` do e2e no projeto `celular` força o `:active` pelo protocolo do navegador (`CSS.forcePseudoState`), e não pelo toque sintético | O Chromium sem tela não acende o `:active` com `Input.dispatchTouchEvent` nem com `Input.synthesizeTapGesture` (medido: `matches(':active')` falso em 50 ms, 300 ms e 1 s). O estado forçado não força o `hover`, e é o que a regra afirma: a face desce sem ponteiro passando por cima. No `chromebook` o botão do mouse continua | a linha "apertado sem hover" da tabela de testes desta tarefa |
| Cinco arquivos fora da lista: `e2e/operacao.spec.ts` (o anel da faixa da operação, A62), `e2e/__fixtures__/verificacoes.ts` (`focoVisivel` exige o contorno sólido de 3 px na cor do token `foco`, lido por sonda, e não aceita sombra), `e2e/pecas-sobrepor.spec.ts` (A45 e A46), `e2e/pecas-ia.spec.ts` (a negativa da A32: nenhum `caramelo` nem `grafite` fora do oficial) e `apps/web/src/operacao/componentes/CascaDaOperacao.tsx` (o comentário da linha 44) | Cada um afirmava o `rgb()`, o anel ou a medida que mudou aqui. O comentário da `CascaDaOperacao` estava citado no cenário "o anel sobre a face escura de antes". A asserção de regra de cada um continua, com a cor e a medida novas; só o `focoVisivel` ficou mais estrito (exige o contorno sólido de 3 px na cor do `foco`, que antes aceitava sombra) | `cenarios.md` A32, A45, A46 e A62 |
| `e2e/material.spec.ts` **não** foi alterado | Ele conta os botões laranja da tela e não afirma o `rgb()`; o caso passa com a cor nova (rodado com os outros) | a linha "no máximo um botão laranja por tela" da tabela de testes desta tarefa |
| O teto de `pecas-*` sobe a 40 kB no `.size-limit.json`, em `tools/ci/tamanho-web.test.ts` e **também** no texto do nome do grupo do `.size-limit.json` | O nome do grupo diz o teto e o histórico dele; ficar com "26 kB" no texto e `40 kB` no limite era a divergência de documentação que o teste de teto lê | `techspec.md` §7c |
| A guarda "grafite só onde é oficial" tem **oito** entradas, e não cinco: o oficial e sete usos de antes, três deles fora da lista da Tech Spec (`areas/navegacao.ts`, `ia/AvatarAgente.tsx`, `CascaDaOperacao.tsx`) | A varredura de `bg-noite` achou sete arquivos, e não os quatro que a tarefa cita. Cada entrada diz as classes que o arquivo pode escrever (a `noite` e, na faixa da operação, o hover e o apertado), a justificativa e a tarefa ou a spec que a tira: 8.0 (avatar), 12.0 (dica da lateral e "Seu time"), 15.0 (a operação), X3 (Início da professora) e X4 (mapa da atividade). O teto da lista não sobe, e entrada de classe que o arquivo já não escreve reprova | `techspec.md` §10 ("Guarda de cor"), que passou a dizer os sete usos; `cenarios.md` U3 e U4 |
| No escuro, a `noite` e o `grafite` valem os dois `#f1f7fb`: a questão aberta do mapa da atividade (`Atividade.tsx`, `bg-noite`) fica com a mesma face do botão oficial "Enviar a atividade", na mesma tela. **Não é corrigido aqui** | A tela é do aluno e entra na X4 (a lista da guarda a nomeia); mexer nela agora é desenho que a 3.0 não decide e pode quebrar o e2e do aluno. A guarda fecha o que a 3.0 controla: nenhum arquivo novo escreve a face do oficial, e o que existe tem a saída escrita | `techspec.md` §10; `cenarios.md` U3; item 1 da ordem de correção da 1ª rodada |
| A galeria alinha as fileiras de botão pelo alto (`items-start`), e o `perigo cheio` e o desligado dele passam a ter `data-variante="perigo-cheio"`, com os rótulos em português com acento | O `discreto` não tem degrau e, portanto, não tem a margem de 4 px: num `items-center` ficava 2 px mais baixo que os vizinhos. A causa é a fileira, e o contrato do `discreto` (sem face, sem degrau, sem margem) continua o da 9.3. O `data-variante` do perigo cheio põe o sexto desenho na medida de 44 px e na ordem do Tab (37 peças na medida, 21 ligadas no anel) | `docs/interface.md` 9.3 e 10.2; a linha "alvo de 44 px" da tabela de testes desta tarefa |
| O grupo da `Aparencia`, com chão próprio dentro da faixa `noite`, entra no teste do anel do `e2e/tokens.spec.ts` (a 4ª face), e a busca de `declaracoesDe` ignora o espaço em branco do seletor | A unidade só confere a declaração da regra `.bg-noite .bg-fundo :focus-visible`; o navegador prova o contraste do anel contra o chão do grupo (o `foco` sobre o `fundo`) nos dois temas. A busca por seletor com `\n  ` literal quebraria com qualquer reformatação do CSS | `cenarios.md` A7 e A62; `techspec.md` §10 |

Medida do orçamento (Tech Spec, seção 7c), no build de produção (`vite build`, sem a galeria), em brotli, antes (HEAD
`13977c9`) e depois desta tarefa:

| | Antes | Depois | Diferença |
|---|---|---|---|
| Entrada (`index-*.js`) | 345.850 bytes, 91.874 em brotli | 345.598 bytes, 91.715 em brotli | menos 159 bytes em brotli |
| CSS (`index-*.css`) | 35.211 bytes, 6.663 em brotli | 37.355 bytes, 7.087 em brotli | mais 424 bytes em brotli |

A entrada fica em 91,7 kB em brotli, abaixo do teto de 150 kB do primeiro carregamento; a tipografia `t-*`, o degrau, o
anel e o movimento reduzido são o que o CSS ganhou.

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

Cada bloco tira uma cláusula da folha ou da tabela do botão e exige o teste vermelho. A guarda de `FACE_FORTE` é
mutada dentro do próprio `estilos.test.ts`, onde ela mora, com o caso que a exercita sobre fixtures.

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › o degrau é sombra sólida e margem do mesmo tamanho
- box-shadow: 0 var(--altura-degrau, 4px) 0 0 var(--lado, var(--color-borda));
+ box-shadow: 0 var(--altura-degrau, 4px) 8px 0 var(--lado, var(--color-borda));
  margin-bottom: var(--altura-degrau, 4px);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › o degrau é sombra sólida e margem do mesmo tamanho
- margin-bottom: var(--altura-degrau, 4px);
  transition: transform var(--t-toque) linear;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › só o transform anima, em --t-toque, sem curva
- transition: transform var(--t-toque) linear;
+ transition: all var(--t-toque) linear;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › apertado, a peça desce o degrau
- transform: translateY(var(--afunda, var(--altura-degrau, 4px)));
+ transform: none;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › apertado, a peça desce o degrau
- box-shadow: 0 calc(var(--altura-degrau, 4px) - var(--afunda, var(--altura-degrau, 4px))) 0 0 var(--lado, var(--color-borda));
+ box-shadow: 0 var(--altura-degrau, 4px) 0 0 var(--lado, var(--color-borda));
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › desligado perde a sombra e guarda a margem
  .degrau[aria-disabled='true'] {
- box-shadow: none;
+ box-shadow: 0 var(--altura-degrau, 4px) 0 0 var(--lado, var(--color-borda));
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › cada classe de cor do degrau resolve para um token
  .degrau-laranja {
- --lado: var(--color-laranja-degrau);
+ --lado: var(--color-laranja);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › cada classe de cor do degrau resolve para um token
  .degrau-grafite {
- --lado: var(--color-grafite-degrau);
+ --lado: var(--color-grafite);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › cada classe de cor do degrau resolve para um token
  .degrau-borda {
- --lado: var(--color-borda);
+ --lado: var(--color-vermelho-borda);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › cada classe de cor do degrau resolve para um token
  .degrau-vermelho {
- --lado: var(--color-vermelho-degrau);
+ --lado: var(--color-laranja-degrau);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › cada classe de cor do degrau resolve para um token
  .degrau-vermelho-borda {
- --lado: var(--color-vermelho-borda);
+ --lado: var(--color-borda);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › cada classe de cor do degrau resolve para um token
  .degrau-azul {
- --lado: var(--color-azul-degrau);
+ --lado: var(--color-laranja-degrau);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › o anel de foco é contorno sólido de 3 px em foco
- outline: 3px solid var(--color-foco);
+ outline: 2px solid var(--color-foco);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › o anel de foco é contorno sólido de 3 px em foco
- outline-offset: 2px;
+ outline-offset: 0;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › sobre a face noite do escuro, onde ela é clara
  :root[data-tema='escuro'] .bg-noite :focus-visible {
- outline-color: var(--color-sobre-grafite);
+ outline-color: var(--color-caramelo-noite);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › sobre a face noite do escuro, onde ela é clara
  :root[data-tema='escuro'] .bg-noite .bg-superficie :focus-visible {
- outline-color: var(--color-foco);
+ outline-color: var(--color-sobre-grafite);
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › movimento reduzido desliga a transição e a animação de tudo
- transition-duration: 0.01ms !important;
+ transition-duration: 0.2s !important;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › movimento reduzido desliga a transição e a animação de tudo
- animation-iteration-count: 1 !important;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › movimento reduzido desliga a transição e a animação de tudo
  .degrau:active:not(:disabled):not([aria-disabled='true']) {
- transform: none;
+ transform: translateY(var(--altura-degrau, 4px));
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › todo estado de todo desenho passa de 4,5:1
- const DESLIGADO = 'disabled:border-borda disabled:bg-borda disabled:text-apoio'
+ const DESLIGADO = 'disabled:border-borda disabled:bg-borda disabled:text-sutil'
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › só o oficial é grafite
- const COR_DO_OFICIAL = 'bg-grafite text-sobre-grafite degrau degrau-grafite'
+ const COR_DO_OFICIAL = 'bg-grafite text-sobre-grafite degrau degrau-borda'
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › só o oficial é grafite
- const COR_DO_SECUNDARIO = 'border-2 border-borda bg-superficie text-apoio degrau degrau-borda'
+ const COR_DO_SECUNDARIO = 'border-2 border-borda bg-grafite text-sobre-grafite degrau degrau-grafite'
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › o perigo cheio leva a face vermelha
- const COR_DO_PERIGO_CHEIO = 'bg-vermelho text-sobre-cor degrau degrau-vermelho'
+ const COR_DO_PERIGO_CHEIO = 'bg-vermelho text-tinta degrau degrau-vermelho'
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › o perigo só é cheio quando pedido
- const cor = variante === 'perigo' && cheio ? COR_DO_PERIGO_CHEIO_COM_DESLIGADO : COR_DO_BOTAO[variante]
+ const cor = variante === 'perigo' ? COR_DO_PERIGO_CHEIO_COM_DESLIGADO : COR_DO_BOTAO[variante]
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › só a primária pinta de laranja
- secundario: `${COR_DO_SECUNDARIO} enabled:hover:bg-fundo-suave ${DESLIGADO}`,
+ secundario: `${COR_DO_SECUNDARIO} bg-laranja enabled:hover:bg-fundo-suave ${DESLIGADO}`,
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › o discreto não tem degrau nem face
- discreto: `text-azul-texto enabled:hover:bg-fundo-suave ${DESLIGADO}`,
+ discreto: `text-azul-texto degrau degrau-azul enabled:hover:bg-fundo-suave ${DESLIGADO}`,
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › a face tem 44 px no principal
- principal: 'rounded-botao min-h-11 min-w-11 px-4',
+ principal: 'rounded-botao min-h-10 min-w-10 px-4',
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › a face tem 44 px no principal
- compacto: 'rounded-botao min-h-11 min-w-11 px-3 text-[14px] md:min-h-9 md:min-w-9',
+ compacto: 'rounded-botao min-h-9 min-w-9 px-3 text-[14px] md:min-h-9 md:min-w-9',
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › todos têm o canto de 12 px
- const FORMA_COM_TEXTO = 'inline-flex items-center justify-center rounded-botao t-rotulo px-4 min-h-11 min-w-11'
+ const FORMA_COM_TEXTO = 'inline-flex items-center justify-center rounded-lg t-rotulo px-4 min-h-11 min-w-11'
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › a variante do Botao e a constante escrita à mão dizem o mesmo botão
- export const CLASSES_DO_BOTAO_SECUNDARIO = `${FORMA_COM_TEXTO} ${COR_DO_SECUNDARIO} enabled:hover:bg-fundo-suave ${DESLIGADO}`
+ export const CLASSES_DO_BOTAO_SECUNDARIO = `${FORMA_COM_TEXTO} ${COR_DO_SECUNDARIO} ${DESLIGADO}`
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda reprova o texto que não acompanha a face forte
- const FACE_FORTE = /^bg-(?:noite|erro|caramelo|caramelo-claro|caramelo-fundo|laranja|grafite|vermelho)$/
+ const FACE_FORTE = /^bg-(?:noite|erro|caramelo|caramelo-claro|caramelo-fundo|grafite|vermelho)$/
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda reprova o texto que não acompanha a face forte
- const FACE_FORTE = /^bg-(?:noite|erro|caramelo|caramelo-claro|caramelo-fundo|laranja|grafite|vermelho)$/
+ const FACE_FORTE = /^bg-(?:noite|erro|caramelo|caramelo-claro|caramelo-fundo|laranja|vermelho)$/
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda reprova o texto que não acompanha a face forte
- const FACE_FORTE = /^bg-(?:noite|erro|caramelo|caramelo-claro|caramelo-fundo|laranja|grafite|vermelho)$/
+ const FACE_FORTE = /^bg-(?:noite|erro|caramelo|caramelo-claro|caramelo-fundo|laranja|grafite)$/
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda reprova a face que troca sob uma variante
- const faceTrocaSemTexto = face.variante !== '' && texto.variante === '' && !textoDaVariante
+ const faceTrocaSemTexto = false
```

```mutacao
arquivo: .size-limit.json
teste: tools/ci/tamanho-web.test.ts › as peças acima de 40 kB em brotli reprovam
    "path": "apps/web/dist/assets/pecas-*.js",
-   "limit": "40 kB",
+   "limit": "26 kB",
```

Da 1ª rodada: a lista fechada do oficial e o que a tabela do botão e a folha ainda não tinham bloco.

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › grafite e noite só são face onde a lista fechada do oficial diz
- 'areas/professor/Home.tsx': {
+ 'areas/professor/HomeAntiga.tsx': {
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › grafite e noite só são face onde a lista fechada do oficial diz
- classes: ['bg-grafite', 'enabled:hover:bg-noite-alto'],
+ classes: ['bg-grafite'],
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda da face do oficial reprova o arquivo novo
- .filter((classe) => !permitidas.has(classe))
+ .filter(() => false)
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda da face do oficial reprova o arquivo novo
- const FACE_DO_OFICIAL_NA_CLASSE = /(?:^|[\s"'`:[])((?:[a-z-]+:)*bg-(?:grafite|noite)(?:-[a-z]+)?)(?![\w-])/g
+ const FACE_DO_OFICIAL_NA_CLASSE = /(?:^|[\s"'`:[])((?:[a-z-]+:)*bg-(?:grafite)(?:-[a-z]+)?)(?![\w-])/g
```

```mutacao
arquivo: apps/web/src/estilos.test.ts
teste: apps/web/src/estilos.test.ts › a guarda da face do oficial reprova o arquivo novo
- return Object.keys(lista).length > TETO_DA_LISTA_DO_OFICIAL
+ return Object.keys(lista).length > TETO_DA_LISTA_DO_OFICIAL + 100
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › o perigo só é cheio quando pedido
- const COR_DO_PERIGO = 'border-2 border-vermelho-borda bg-superficie text-vermelho-texto degrau degrau-vermelho-borda'
+ const COR_DO_PERIGO = 'border-2 border-vermelho-borda bg-superficie text-vermelho-texto degrau degrau-borda'
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › o perigo só é cheio quando pedido
- const COR_DO_PERIGO = 'border-2 border-vermelho-borda bg-superficie text-vermelho-texto degrau degrau-vermelho-borda'
+ const COR_DO_PERIGO = 'border-2 border-vermelho-borda bg-superficie text-apoio degrau degrau-vermelho-borda'
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › o perigo só é cheio quando pedido
- const COR_DO_PERIGO = 'border-2 border-vermelho-borda bg-superficie text-vermelho-texto degrau degrau-vermelho-borda'
+ const COR_DO_PERIGO = 'border-2 border-borda bg-superficie text-vermelho-texto degrau degrau-vermelho-borda'
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › só a primária pinta de laranja
- primario: `bg-laranja text-sobre-cor degrau degrau-laranja enabled:hover:bg-caramelo-claro ${DESLIGADO}`,
+ primario: `bg-caramelo text-sobre-cor degrau degrau-laranja enabled:hover:bg-caramelo-claro ${DESLIGADO}`,
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › só a primária pinta de laranja
- primario: `bg-laranja text-sobre-cor degrau degrau-laranja enabled:hover:bg-caramelo-claro ${DESLIGADO}`,
+ primario: `bg-laranja text-tinta degrau degrau-laranja enabled:hover:bg-caramelo-claro ${DESLIGADO}`,
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › só a primária pinta de laranja
- primario: `bg-laranja text-sobre-cor degrau degrau-laranja enabled:hover:bg-caramelo-claro ${DESLIGADO}`,
+ primario: `bg-laranja text-sobre-cor degrau degrau-borda enabled:hover:bg-caramelo-claro ${DESLIGADO}`,
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › só a primária pinta de laranja
- primario: `bg-laranja text-sobre-cor degrau degrau-laranja enabled:hover:bg-caramelo-claro ${DESLIGADO}`,
+ primario: `bg-laranja text-sobre-cor degrau degrau-laranja enabled:hover:bg-fundo-suave ${DESLIGADO}`,
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › a face tem 44 px no principal
- icone: 'rounded-full size-11 shrink-0 [--altura-degrau:3px]',
+ icone: 'rounded-full size-11 shrink-0',
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › o link secundário é o secundário sem o desligado
- export const CLASSES_DO_LINK_SECUNDARIO = `${FORMA_COM_TEXTO} ${COR_DO_SECUNDARIO} hover:bg-fundo-suave`
+ export const CLASSES_DO_LINK_SECUNDARIO = `${FORMA_COM_TEXTO} ${COR_DO_SECUNDARIO}`
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › a variante do Botao e a constante escrita à mão dizem o mesmo botão
- export const CLASSES_DO_BOTAO_OFICIAL = `${FORMA_COM_TEXTO} ${COR_DO_OFICIAL} enabled:hover:bg-noite-alto ${DESLIGADO}`
+ export const CLASSES_DO_BOTAO_OFICIAL = `${FORMA_COM_TEXTO} ${COR_DO_OFICIAL} ${DESLIGADO}`
```

```mutacao
arquivo: apps/web/src/componentes/botao-secundario.ts
teste: apps/web/src/componentes/botao-secundario.test.ts › a variante do Botao e a constante escrita à mão dizem o mesmo botão
- export const CLASSES_DO_BOTAO_PERIGO = `${FORMA_COM_TEXTO} ${COR_DO_PERIGO} enabled:hover:bg-fundo-suave ${DESLIGADO}`
+ export const CLASSES_DO_BOTAO_PERIGO = `${FORMA_COM_TEXTO} ${COR_DO_PERIGO} ${DESLIGADO}`
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › t-rotulo tem o tamanho, a altura, o peso e a caixa do documento
  line-height: 18px;
  font-weight: 700;
- text-transform: uppercase;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › t-corpo tem o tamanho, a altura, o peso e a caixa do documento
 .t-corpo {
- font-size: 17px;
+ font-size: 16px;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › t-numero-g tem o tamanho, a altura, o peso e a caixa do documento
  line-height: 40px;
  font-weight: 700;
- font-variant-numeric: tabular-nums;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › movimento reduzido desliga a transição e a animação de tudo
- animation-duration: 0.01ms !important;
+ animation-duration: 0.4s !important;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › movimento reduzido desliga a transição e a animação de tudo
- scroll-behavior: auto !important;
```

```mutacao
arquivo: apps/web/src/estilos.css
teste: apps/web/src/estilos.test.ts › sobre a face noite do escuro, onde ela é clara
- :root[data-tema='escuro'] .bg-noite .bg-fundo :focus-visible,
+ :root[data-tema='escuro'] .bg-noite .bg-fundo-suave :focus-visible,
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| `frontend-reviewer` (1ª) | Placeholder cortado a 360 px na `CaixaPedido` (`CaixaPedido.tsx:112-125`) | Tarefa 10.0, subtarefa 10.1, que reveste `CaixaPedido`; já está registrado em `2_task.md`, a peça não foi tocada aqui e já era assim antes da 3.0. Quem revisar a 10.0 trata como bloqueante, como o revisor disse |
| `frontend-reviewer` (1ª) | O "Sair" do cabeçalho de celular ainda é pílula (`rounded-full`), ao lado de botões de canto 12 | Spec da área ou tarefa 15.0: é botão escrito à mão, e "converter botão escrito à mão em `Botao`" está em "Fora do escopo desta tarefa" |
| `frontend-reviewer` (1ª) | Foto com foco sobre botão com degrau, para ver o anel sobre a faixa de 4 px | Não é código nem teste que cabe aqui: o Validador da spec fotografa o requisito de foco (RF7) no fim da spec; o `e2e/tokens.spec.ts` já mede cor e largura |
| `conformidade-reviewer` (1ª) | Trocar o hover do oficial (`bg-noite-alto`) por um token `grafite-*` próprio, para o oficial não depender da família `noite` | Tarefas 15.0 e 8.0, quando a `noite` sair: é token novo nos dois temas, muda o contrato do CSS. Até lá a guarda do item 1 aceita o hover só nas constantes do oficial |
| `frontend-reviewer` (2ª) | O "Sair" do cabeçalho no celular é contorno de pílula, sem o degrau do secundário (visto em `coordenacao--coordenacao-estrutura--celular-1.png`); vale alinhar ao desenho da 10.2 quando a casca for revista | Repete a da 1ª rodada: spec da área ou tarefa 15.0. É botão escrito à mão, e converter botão escrito à mão está em "Fora do escopo desta tarefa" |
| `frontend-reviewer` (2ª), `conformidade-reviewer` (2ª), `revisor-geral` (2ª) | No escuro, a `noite` e o `grafite` valem os dois `#f1f7fb`: a questão aberta do mapa de `areas/aluno/Atividade.tsx:150` (`bg-noite`) fica com a face do botão oficial "Enviar a atividade", na mesma tela. `revisor-geral`: uma linha em `tasks/prd-telas-do-aluno-e-primeiro-acesso/6_task.md` (6.1, o mapa de questões) dizendo que a face nova não pode ser a do oficial em nenhum tema; `conformidade-reviewer`: quem revisar a X4 trata como bloqueante se o uso não tiver saído | X4, tarefa 6.1, que reveste `Atividade.tsx`. A guarda `FACE_DO_OFICIAL` nomeia o arquivo com a saída escrita, e o uso já está em "Divergências resolvidas". A `6_task.md` é de outra spec e hoje não tem a linha: o Orquestrador a registra ao abrir a X4 |
| `frontend-reviewer` (2ª), `conformidade-reviewer` (2ª) | O hover `noite-alto` do oficial (`botao-secundario.ts`) e o de `CascaDaOperacao.tsx:109` dependem da família `noite`; a 15.0 precisa tirar o da faixa preta junto com ela, para o `noite-alto` voltar a ser só do oficial, até virar token `grafite-*` próprio | Tarefas 15.0 e 8.0, quando a `noite` sai. Repete a da 1ª rodada; a entrada da guarda já traz a saída escrita |
| `conformidade-reviewer` (2ª), `test-engineer` (2ª) | A regex de `FACE_DO_OFICIAL_NA_CLASSE` (`estilos.test.ts:324`) não pega o modificador de importância (`!bg-grafite`) nem a face por estilo em linha (`style={{ background: 'var(--color-grafite)' }}`): incluir o `!` e um fixture para cada, ou deixar escrito que a guarda não os vê | A primeira tarefa que tira uma entrada de `FACE_DO_OFICIAL` e reabre `estilos.test.ts`: 8.0 ou 15.0. É o mesmo arquivo e a mesma lista |
| `test-engineer` (2ª) | A lista conta arquivos, não classes: uma entrada antiga pode ganhar `bg-grafite` se o arquivo já escreve a classe. Um `expect` de que só a entrada de `componentes/botao-secundario.ts` cita `bg-grafite` fecha isso | A mesma tarefa da linha acima (8.0 ou 15.0), no mesmo teste |
| `revisor-geral` (2ª) | `estilos.test.ts:592-594`: o comentário diz que "outra família" passa em qualquer arquivo, mas a asserção espera que `bg-noite-ia` reprove, porque o padrão `bg-(?:grafite|noite)(?:-[a-z]+)?` pega qualquer sufixo. Ajustar o comentário ou restringir o padrão a `-alto` e `-baixo` | A mesma tarefa (8.0 ou 15.0), junto com a regex acima |
| `test-engineer` (2ª) | A 4ª face de `e2e/tokens.spec.ts` (o grupo da `Aparencia`) é uma réplica montada em DOM, e não a `Aparencia` de verdade na faixa da operação: se a classe do chão do componente mudar, o teste continua verde. Medir o anel no componente real, em `e2e/operacao.spec.ts` | Tarefa 15.0, quando ela mexer na faixa da operação |

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
| 2026-10-13 11:47:37 | 2026-10-13 11:49:31 | `frontend-reviewer` | 1 | APROVADO | a0c4709bc7473215d |
| 2026-10-13 11:47:44 | 2026-10-13 11:49:34 | `conformidade-reviewer` | 1 | REPROVADO | a6b57e6639ce2eaca |
| 2026-10-13 11:47:31 | 2026-10-13 11:49:36 | `revisor-geral` | 1 | REPROVADO | a0fb56985db8e8955 |
| 2026-10-13 11:47:25 | 2026-10-13 11:49:40 | `test-engineer` | 1 | REPROVADO | a3a98077f86f45592 |
| 2026-10-13 12:12:36 | 2026-10-13 12:13:27 | `frontend-reviewer` | 2 | APROVADO | a6e5b9553e65271a8 |
| 2026-10-13 12:12:27 | 2026-10-13 12:13:41 | `conformidade-reviewer` | 2 | APROVADO | a252db8440ff2fcb6 |
| 2026-10-13 12:12:00 | 2026-10-13 12:13:52 | `test-engineer` | 2 | APROVADO | ac1673f755ccbb4d1 |
| 2026-10-13 12:12:14 | 2026-10-13 12:13:52 | `revisor-geral` | 2 | APROVADO | a45937ce3d74e5398 |
