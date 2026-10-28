# Correção — a onça do `apps/web` está desenhada diferente da do mockup de outubro

**Origem:** uso (o Joaquim subiu o sistema e pediu: "pegue exatamente o que tem no mockup e utilize ele").
**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `conformidade-reviewer`, `revisor-geral`, `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- Os guardiões vieram no PEDIDO do Orquestrador: `frontend-reviewer` e `conformidade-reviewer`. O `revisor-geral` entra porque a
     correção passa de 5 arquivos fora de `tasks/` (passo 5 de `corrigir`). Os três guardiões de tenant, privacidade e infra são o
     conjunto do padrão que o portão exige para os arquivos alterados (`portao-local.ts revisores`); a correção não toca tenant,
     dado de pessoa nem infra, e cada um deles deve dizer isso. -->

## Sintoma

A cabeça e a onça de corpo inteiro de `apps/web/src/componentes/ui/onca/` foram desenhadas à mão na X1 e na X4, com peças
próprias (cabeça de 48 × 48 com rosto de retângulo, corpo de retângulos, sem as rosetas da marca, sem a máscara clara,
sem o rabo e sem a sombra do chão). O desenho do mockup de outubro (`mockups/src/components/duo/onca/`) é outro: o corpo e a
cabeça numa forma só (`CORPO_D`), as orelhas com miolo, a máscara de dois círculos, os olhos com pupila recortada e brilho,
o focinho com o nariz arredondado, a pinta da marca repetida nas rosetas, o rabo com anéis e a pata com o punho. Quem abre
o produto vê uma onça que não é a do mockup, em todo lugar onde ela aparece: o avatar dos três agentes, a introdução de cada
papel (`Introducao`, `IntroducaoDoPapel`) e a `Comemoracao`.

## Fora desta correção

Nada: a árvore estava limpa.

## O que entra e o que não entra (D80, item 3; D58; D59; regra 70, itens 4a e 4b)

O pedido foi alargado pelo Orquestrador, com a palavra do Joaquim: a onça do mockup **em tudo** (as três introduções, a
`Comemoracao`, o avatar dos agentes), com as animações de `onca.css` e as poses e expressões que o mockup usa nesses lugares.
**O que é pose, expressão ou movimento novo precisa de parecer do `conformidade-reviewer` na rodada; o que ele vetar sai, e
entra no relatório.** Por isso cada coisa nova mora num lugar só, e tirá-la é apagar esse lugar.

- **Traço (sem parecer, é só o desenho):** formas, medidas, cores, a pinta, as rosetas, o rabo, a pata e o punho, o balão, a
  sombra do chão (token `onca-chao`). Copiado para `componentes/ui/onca/`; o mockup **não é importado**.
- **Pose nova: `pensando`** (a mão no queixo, o balão de três pontos), no passo da letra da introdução do aluno, onde o mockup
  a usa. Lugar: `POSES_DO_CORPO.pensando` em `Onca.tsx`, `DesenhoDoBalao`, e `pose: 'pensando'` em `areas/aluno/introducao/`.
- **Expressões novas, só por pose** (nunca por quem usa): acenando e comemorando de boca aberta (com língua), comemorando de
  olhos fechados em arco, apontando de olhar de lado e sorrindo, pensando de olhar para cima com a pálpebra baixa. Lugar:
  `Olhos` e `Boca` de `CabecaOnca.tsx`, e os campos `olhar` e `boca` de cada pose. **A cabeça do avatar continua só neutra**
  (olhos de frente e boca em "w"): ela não aceita expressão.
- **Movimento** (`Onca.css` e `movimento-da-onca.ts`, só com `animada`, padrão ligado): entrar (240 ms, uma vez), acenar (uma
  vez por sessão, na primeira onça acenando, e só enquanto a pose é `acenando`) e saltar na comemoração (`onca-comemora`, uma
  vez; é o único salto da `Comemoracao`). **Nada fica em laço e nada roda com "reduzir movimento"** (D59): o CSS desliga tudo,
  e o acenar nem é ligado. **Parecer do `conformidade-reviewer` (rodada 1): aprovados** a pose `pensando`, as quatro
  expressões, entrar e acenar; **vetados e removidos** o piscar por temporizador, o laço dos três pontos do `pensando` (os
  pontos ficam parados) e o salto próprio da `Onca` somado ao da `Comemoracao` (item 3 da ordem, decidido pelo Arquiteto:
  fica o `onca-comemora`).
- **Não trouxe, e vai para o relatório:**
  - **`acolhendo`** (pose, olhos e boca): a D80, item 3, escreve que a expressão de preocupação **não entra**. Não é parecer,
    é decisão; o mockup a usa no passo "avisar" do aluno e no "limites" da coordenação, e o web não tem esses passos.
  - **`dormindo`** (os vazios "Tudo em dia"): o web não tem onça nos vazios (o vazio do sino é ícone, sem mascote, e a onça
    sempre vai assinada por uma função, o que um vazio de sistema não tem). Precisa de decisão do Joaquim sobre quem assina.
  - **O avatar "pensando"** (a cabeça de olhar para cima e o balão de pontos ao lado do avatar): o `Pensando` do web é texto
    parado, por regra escrita (regra 50, item 1, e 9.5, regra 7: "sem três pontos pulando, nada em laço"). Mudar isso é
    decisão, não só parecer.
  - **A cabeça "feliz"** do avatar, que só existe na bancada do mockup, e as marcas de movimento ao lado da pata que acena.
  - **As cinco pintas que voam na `Comemoracao`** do mockup (`pinta-voa`): não é da onça nem do `onca.css`.
  - **Vetados pelo `conformidade-reviewer` (rodada 1) e removidos:** o piscar por temporizador (`usePiscar`, `onca-pisca`,
    `onca-olho`, `@keyframes onca-piscar`) e o laço dos três pontos do `pensando` (`onca-pontos`, `@keyframes onca-ponto`;
    o balão fica, com os pontos parados).
  - **O invólucro da `Comemoracao` do mockup** (`animate-salta`, escala de 0,01 a 1) e o `.comemoracao-salto` nosso da X4
    (700 ms): saem, para a árvore da comemoração ter uma animação só.
  - **`onPointerEnter`/`onFocus` que reiniciam o piscar** e a prop `rotulo`: o primeiro é interação sem alvo (a11y), e o
    segundo daria nome de "onça" ao desenho (D17, D58).

## Causa

O desenho foi refeito à mão a partir do texto de `docs/interface.md` 9.7 ("três formas, sem contorno, sem degradê"), e não
a partir do desenho do mockup. Nenhum teste comparava o desenho com o mockup: os testes de `Onca.test.tsx` e
`CabecaOnca.test.tsx` provam a regra (parada, neutra, nove cores), e por isso passavam com qualquer onça que obedecesse à
regra, inclusive a errada.

## Teste que reproduz

`apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx` — guarda, congelados no arquivo, os valores do
desenho do mockup (impressões dos caminhos longos e as medidas, sem ler a pasta do protótipo) e confere que o que o `apps/web` desenha
tem o mesmo traço: os três caminhos
(`CORPO_D`, `CABECA_D`, a pinta), as medidas da máscara, do focinho, do nariz, da boca em "w", dos olhos e das orelhas, as
rosetas, os ombros, e as nove cores. Vermelho antes (o desenho antigo não tem nenhum dos caminhos), verde depois.

## Correção

- `componentes/ui/onca/geometria.ts` (novo): os caminhos `CORPO_D`, `CABECA_D` e a pinta, os ombros e as cinco rosetas, copiados
  do mockup.
- `componentes/ui/onca/CabecaOnca.tsx`: reescrita pelo traço do mockup (orelhas com miolo, máscara de dois círculos, olhos
  com pupila recortada e brilho, focinho, nariz, boca), com as nove cores; as peças do rosto são exportadas para a `Onca`, que
  as usa com a expressão da pose. A `CabecaOnca` (o avatar) só aceita `tamanho` e é sempre neutra.
- `componentes/ui/onca/Onca.tsx`: reescrita pelo mockup, quadro de 240 × 240, quatro poses, `animada`.
- `componentes/ui/onca/Onca.css` e `movimento-da-onca.ts` (novos): o movimento que ficou (entrar, acenar, comemorar), sem o piscar e sem laço.
- `componentes/ui/Comemoracao.tsx` e `Comemoracao.css` (apagado): o salto é o `onca-comemora` da `Onca`, um só; `nome-dos-chunks.test.ts` e `nome-dos-chunks.ts` passam a citar o `Onca.css` como o estilo ao lado da peça.
- `componentes/ui/ia/AvatarAgente.tsx`: a cabeça recua do anel como no avatar do mockup (3 px em 24, 4 px a partir de 32, e desce
  6%).
- `estilos.css`, `docs/interface.md` (9.7 e 9.10) e `estilos.test.ts`: o token `onca-chao`, a sombra do chão.
- `apps/web/nome-dos-chunks.ts`: as peças novas da pasta da onça ficam fora do primeiro carregamento.
- `areas/aluno/introducao/textos-da-introducao.ts`: o passo da letra pensa.
- Testes: `fidelidade-ao-mockup.test.tsx` e `movimento-da-onca.test.tsx` (novos), `Onca.test.tsx`, `CabecaOnca.test.tsx`, `Comemoracao.test.tsx`, `estilos.test.ts` (nenhum CSS de `apps/web/src` tem `infinite`),
  `avatar-com-funcao-e-selo.test.tsx`, `Introducao.test.tsx`, `textos-da-introducao.test.ts`, `__fixtures__/ids-do-desenho.ts` (o
  `id` do SVG vem do `useId`, e os testes que comparam dois desenhos o tiram) e os e2e `introducao-pecas.spec.ts`, `aluno-atividade.spec.ts` e
  `pecas-marca-onca.spec.ts`.
- `docs/interface.md` (9.7 e a Parte B): o movimento que fica, a tabela de poses e a exceção à regra "nada de mockup é copiado".

## Divergências resolvidas

- Item 3 da r1: fica o `onca-comemora` (mockup, `onca.css`) e sai o `.comemoracao-salto`; decisão do Arquiteto em
  `.processo/ordens/2026-10-28-onca-do-mockup-r1-item3.md`.

## Recomendações sem aplicar

Da rodada 1 (`.processo/ordens/2026-10-28-onca-do-mockup-r1.md`):

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| infra-guardian (1ª) | Medir no Chromebook de referência (D51) se a rolagem da conversa do Tutor segue fluida com o avatar novo, e anotar no relatório | `TODO.md`: medição do avatar novo no Chromebook, na validação (o avatar do mockup só é medido com tela real) |
| privacy-guardian (1ª) | Listar a chave `turmma-onca-acenou` (`sessionStorage`) quando a regra 20 listar o que o produto grava no navegador | `TODO.md`: não há essa lista hoje; a chave não é dado pessoal |
| frontend-reviewer (1ª) | "Colégio sintético da vitrine … 4abf251d" nas fotos da coordenação: conferir que o seed não vaze id | `TODO.md`: é do seed da vitrine (`tools/vitrine/`), fora desta correção |
| frontend-reviewer (1ª) | No celular de 360 px, o balão do `pensando` fica rente à borda direita | Recusada: a posição do balão é a do mockup e está congelada em `fidelidade-ao-mockup.test.tsx`; dentro do quadro e sem corte, segundo o revisor |
| frontend-reviewer (1ª) | A `Comemoracao` não foi fotografada: a validação deve ver o salto uma vez e a ausência de movimento com "reduzir movimento" | Validador, no fim da correção (a vitrine não tem esse passo) |
| conformidade-reviewer (1ª) | Anotar em `docs/decisoes.md` que o avatar segue neutro e a onça de corpo inteiro tem rosto por pose (D80, item 3) | `registrar-decisao`, pelo Orquestrador, com a palavra do Joaquim: revisão de decisão não cabe na correção |
| conformidade-reviewer (1ª) | O balão de pontos no passo da letra pode ler "a IA está processando" | Coberta pelo item 1 (pontos parados); balão sem pontos é decisão de desenho, vai ao Orquestrador |
| conformidade-reviewer (1ª) | A pata da pose `acenando` não aparece levantada de forma legível nas fotos (para o frontend-reviewer) | Validador: o traço é o congelado do mockup; olhar na validação |
| conformidade-reviewer (1ª) | `CLAUDE.md` linha 193, "Nada de mockup é copiado para o `apps/web`": registrar a exceção | Orquestrador, com a palavra do Joaquim: `CLAUDE.md` é regra do projeto e não é arquivo desta correção |
| revisor-geral (1ª) | `Onca.tsx`: `` `${pose}` `` é só `pose` | Some com o item 2 (a linha do `usePiscar` sai) |
| revisor-geral (1ª) | `estilos.test.ts:822` não cobre o `Onca.css` | Coberta pelo item 1 |
| revisor-geral (1ª) | Dois saltos sobrepostos na comemoração | Item 3 |
| test-engineer (1ª) | `Introducao.test.tsx:313`: o nome "nenhum temporizador entre um passo e outro" ficou falso | Perde o sentido com o item 2 (sem o piscar o nome volta a valer): reavaliar depois |
| test-engineer (1ª) | "Pisca entre 3 e 6 s": faltam `random` perto de 1 e o reinício da contagem | Recusada: o piscar sai (item 2) |
| test-engineer (1ª) | Impressão congelada das transformações de cada pose (`figura`, patas, pés, rabos) | `TODO.md`: ampliar `fidelidade-ao-mockup.test.tsx`; mais que poucas linhas |
| test-engineer (1ª) | `AvatarAgente`: o e2e não prova a descida de 6% | `TODO.md`: e2e a mais, e o recuo de 3 e 4 px já tem prova |
| test-engineer (1ª) | E2e com "reduzir movimento" no passo `pensando` e na árvore da comemoração | `TODO.md`: sem o laço (item 1) o primeiro cai; o da comemoração depende do item 3 |
| test-engineer (1ª) | Duas onças acenando montadas no mesmo render acenam as duas | Recusada: nenhuma tela monta duas; o revisor a deixou registrada |

Da rodada 2 (`.processo/ordens/2026-10-28-onca-do-mockup-r2.md`, os sete aprovaram; as entradas novas no `TODO.md` entram depois do commit):

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| revisor-geral (2ª), frontend-reviewer (2ª) | `docs/interface.md:1102` (tabela da 9.5) diz que a comemoração usa o `t-salto` (600 ms, `curva-quique`), e o salto que ficou é o `onca-comemorar` (500 ms, `ease-out`); nenhum CSS de `apps/web/src` usa o token | `TODO.md`: alinhar a linha ou tirar o token (`estilos.css`, `--t-salto`) |
| revisor-geral (2ª) | `estilos.test.ts:827` cria uma segunda busca recursiva de pasta; o arquivo já tem uma na l. 317, e o `join(raizDaWeb)` com um argumento só não faz nada | `TODO.md`: reaproveitar a busca que existe |
| revisor-geral (2ª), test-engineer (2ª) | `Introducao.test.tsx:313`, nome do caso "a onça não se mexe: nenhum temporizador entre um passo e outro": o revisor-geral diz que não vale mais (ela entra e acena por CSS); o test-engineer diz que, sem o piscar, voltou a ser verdadeiro | `TODO.md`: reavaliar o nome; os dois revisores aprovaram com o nome como está |
| revisor-geral (2ª) | `Onca.tsx:27`, o comentário da prop `animada` virou uma linha só, longa | `TODO.md`: estilo, sem efeito no comportamento |
| revisor-geral (2ª), conformidade-reviewer (2ª) | Registrar no `CLAUDE.md` (linha 193) a exceção de que a onça foi copiada do mockup; o `docs/interface.md:637` já a tem | Orquestrador, com a palavra do Joaquim, antes do pouso (já estava em "Sem aplicar" da r1) |
| conformidade-reviewer (2ª) | Registrar em `docs/decisoes.md` que o avatar segue neutro e a onça de corpo inteiro tem rosto por pose (D80, item 3) | `registrar-decisao`, pelo Orquestrador, com a palavra do Joaquim (já estava na r1) |
| conformidade-reviewer (2ª) | Os 30 s no caso "nenhuma pose agenda temporizador" (`movimento-da-onca.test.tsx`) são arbitrários; basta a contagem antes de avançar o relógio | `TODO.md`: melhoria, o caso prova a regra como está |
| test-engineer (2ª) | `Comemoracao.test.tsx:55`: a lista de classes proibidas não pega um invólucro novo com outra animação (por exemplo `animate-*`); só o e2e da árvore pega. Citar isso no comentário do caso | `TODO.md`: o e2e já cobre |
| test-engineer (2ª) | `Onca.test.tsx` (`rostoConfere`): o HTML do rosto é lido num `div`, fora de um `svg`; embrulhar num `<svg>` evita falhar pelo motivo errado se a conferência passar a usar propriedade de SVG | `TODO.md`: hoje funciona, a busca é por tag e atributo |
| frontend-reviewer (2ª) | `docs/interface.md:1169` ainda diz que a `Comemoracao` leva "movimento próprio do conformidade-reviewer" | `TODO.md`: ajuste de texto |
| frontend-reviewer (2ª) | A coordenação mostra "Colégio sintético da vitrine cheia 4abf251d" com id | Já está no `TODO.md` (r1); é do seed de `tools/vitrine/` |
| frontend-reviewer (2ª) | A `Comemoracao` não foi fotografada: a validação deve ver um salto só e a onça parada com "reduzir movimento" | Validador, no fim da correção |
| frontend-reviewer (2ª) | Impressão congelada das transformações de cada pose, e2e da descida de 6% do avatar, e2e com "reduzir movimento" no passo `pensando` | Já estão no `TODO.md` (r1) |
| privacy-guardian (2ª) | Listar a chave `turmma-onca-acenou` quando a regra 20 listar o que o produto grava no navegador | Já está no `TODO.md` (r1) |

## Mutações

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/CabecaOnca.test.tsx › dois renders do mesmo tamanho dão o mesmo HTML: nada muda com o tempo, com a ordem nem com quem usa
-  return prefixo + useId().replace(/[^a-zA-Z0-9-]/g, '')
+  return prefixo + useId()
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › a máscara são dois círculos de r 38, e as orelhas têm o miolo de r 11
-  const cx = lado === 'e' ? 68 : 172
+  const cx = lado === 'e' ? 68 : 68
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › o rosto de cada pose é o do mockup para ela: boca, olhar e pálpebra, e nenhum rosto vem de quem usa
-  const abertura = palpebraBaixa ? `M${String(o.x - 4)} ${String(o.y + o.h * 0.22)} H${String(o.x + o.w + 4)} V${String(o.y + o.h + 4)} H${String(o.x - 4)} Z` : null
+  const abertura = false ? `M${String(o.x - 4)} ${String(o.y + o.h * 0.22)} H${String(o.x + o.w + 4)} V${String(o.y + o.h + 4)} H${String(o.x - 4)} Z` : null
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › toda referência do desenho, de `url` e de `href`, aponta para um `id` que existe nele, em cada pose
-        {abertura !== null && (
+        {false && (
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › o rosto de cada pose é o do mockup para ela: boca, olhar e pálpebra, e nenhum rosto vem de quem usa
-      {abertura === null ? olho : <g clipPath={`url(#${clip}-abre)`}>{olho}</g>}
+      {olho}
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › o rosto de cada pose é o do mockup para ela: boca, olhar e pálpebra, e nenhum rosto vem de quem usa
-  if (tipo === 'feliz') {
+  if (false) {
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › o rosto de cada pose é o do mockup para ela: boca, olhar e pálpebra, e nenhum rosto vem de quem usa
-  const olhar = tipo === 'cima' || tipo === 'pensando' ? 'cima' : tipo === 'lado' ? 'lado' : 'frente'
+  const olhar = tipo === 'cima' ? 'cima' : tipo === 'lado' ? 'lado' : 'frente'
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › o rosto de cada pose é o do mockup para ela: boca, olhar e pálpebra, e nenhum rosto vem de quem usa
-  const olhar = tipo === 'cima' || tipo === 'pensando' ? 'cima' : tipo === 'lado' ? 'lado' : 'frente'
+  const olhar = tipo === 'cima' || tipo === 'pensando' ? 'cima' : 'frente'
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › a boca e o olhar de cada pose são os que o mockup dá a ela, e só a cabeça do avatar não os troca
-  if (tipo === 'aberta' || tipo === 'muito-aberta') {
+  if (tipo === 'aberta') {
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › a boca e o olhar de cada pose são os que o mockup dá a ela, e só a cabeça do avatar não os troca
-    const d = aberta ? 'M109 146 Q121 150 133 145 Q133 158 122 160 Q110 160 109 146 Z' : 'M104 145 Q120 151 137 145 Q137 168 121 169 Q104 168 104 145 Z'
+    const d = !aberta ? 'M109 146 Q121 150 133 145 Q133 158 122 160 Q110 160 109 146 Z' : 'M104 145 Q120 151 137 145 Q137 168 121 169 Q104 168 104 145 Z'
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › a boca e o olhar de cada pose são os que o mockup dá a ela, e só a cabeça do avatar não os troca
-          <circle cx={aberta ? 124 : 121} cy={aberta ? 164 : 172} r={aberta ? 9 : 13} fill={ONCA.lingua} />
+          <circle cx={121} cy={aberta ? 164 : 172} r={aberta ? 9 : 13} fill={ONCA.lingua} />
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/CabecaOnca.test.tsx › o tamanho é só o tamanho: a mesma cabeça nos quatro, e só a roseta da testa sai abaixo de 40 px
-      {tamanho >= MENOR_TAMANHO_COM_ROSETA && <Rosetas pinta={pinta} clip={clip} lista={ROSETAS.slice(0, 1)} />}
+      {true && <Rosetas pinta={pinta} clip={clip} lista={ROSETAS.slice(0, 1)} />}
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › `animada={false}` deixa a onça parada: nenhuma classe de movimento e nenhum temporizador
-  return ['onca', animada ? 'onca-animada' : '', 'block shrink-0 overflow-visible'].filter(Boolean).join(' ')
+  return ['onca', 'onca-animada', 'block shrink-0 overflow-visible'].filter(Boolean).join(' ')
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › `animada={false}` deixa a onça parada: nenhuma classe de movimento e nenhum temporizador
-  if (!animada) return undefined
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › animada, que é o padrão: o corpo entra, e a comemorando salta em vez de entrar
-  return pose === 'comemorando' ? 'onca-comemora' : 'onca-entra'
+  return 'onca-entra'
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › os três pontos do `pensando` ficam parados: existem só nessa pose e não levam classe nenhuma
-      <g fill={ONCA.olho}>
+      <g className="onca-pontos" fill={ONCA.olho}>
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › os ombros das patas são os do mockup
-  const ombro = lado === 'e' ? OMBRO_E : OMBRO_D
+  const ombro = OMBRO_D
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › apontando estica o braço de 54 para 64 e mostra o lado de trás do corpo em 3/4
-  const altura = longa === true ? 64 : 54
+  const altura = 54
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › a mão é o punho, círculo da cor da pata com a almofada creme, quando o braço sai da silhueta, e creme quando cai no corpo
-        {mao === 'creme' && <circle cx={ombro.x} cy={160 + altura - 12} r={14} fill={ONCA.creme} />}
+        {false && <circle cx={ombro.x} cy={160 + altura - 12} r={14} fill={ONCA.creme} />}
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › a mão é o punho, círculo da cor da pata com a almofada creme, quando o braço sai da silhueta, e creme quando cai no corpo
-        {mao === 'punho' && (
+        {false && (
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › `animada={false}` deixa a onça parada: nenhuma classe de movimento e nenhum temporizador
-  const acena = useAcenarNaPrimeiraVez(animada && pose === 'acenando')
+  const acena = useAcenarNaPrimeiraVez(pose === 'acenando')
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/fidelidade-ao-mockup.test.tsx › apontando estica o braço de 54 para 64 e mostra o lado de trás do corpo em 3/4
-            {c.ladoDeTras === true && <DesenhoDoLadoDeTras clip={clip} />}
+            {false && <DesenhoDoLadoDeTras clip={clip} />}
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › só a primeira onça acenando da sessão acena, e só uma vez
-            <DesenhoDaPata lado="d" transform={c.pataD} longa={c.pataLonga} mao={c.maoD} classe={acena && pose === 'acenando' ? 'onca-acena' : undefined} />
+            <DesenhoDaPata lado="d" transform={c.pataD} longa={c.pataLonga} mao={c.maoD} classe={undefined} />
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › os três pontos do `pensando` ficam parados: existem só nessa pose e não levam classe nenhuma
-            {c.balao === true && <DesenhoDoBalao />}
+            {false && <DesenhoDoBalao />}
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/movimento-da-onca.ts
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › só a primeira onça acenando da sessão acena, e só uma vez
-  const [acena] = useState(() => acenando && !reduzMovimento() && !acenouNestaSessao())
+  const [acena] = useState(() => acenando && !reduzMovimento())
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/movimento-da-onca.ts
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › a onça não acena, e a marca de "já acenou" não é gravada
-  const [acena] = useState(() => acenando && !reduzMovimento() && !acenouNestaSessao())
+  const [acena] = useState(() => acenando && !acenouNestaSessao())
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/movimento-da-onca.ts
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › o gancho só liga o aceno para quem pede: `acenando` falso não acena nem gasta o aceno da sessão
-  const [acena] = useState(() => acenando && !reduzMovimento() && !acenouNestaSessao())
+  const [acena] = useState(() => !reduzMovimento() && !acenouNestaSessao())
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/movimento-da-onca.ts
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › a onça não acena, e a marca de "já acenou" não é gravada
-    if (acena) marcarQueAcenou()
+    marcarQueAcenou()
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/Onca.tsx
teste: apps/web/src/componentes/ui/onca/movimento-da-onca.test.tsx › o aceno acaba com a pose: da acenando para a apontando, a pata não fica girando
-            <DesenhoDaPata lado="d" transform={c.pataD} longa={c.pataLonga} mao={c.maoD} classe={acena && pose === 'acenando' ? 'onca-acena' : undefined} />
+            <DesenhoDaPata lado="d" transform={c.pataD} longa={c.pataLonga} mao={c.maoD} classe={acena ? 'onca-acena' : undefined} />
```

```mutacao
arquivo: apps/web/src/componentes/ui/onca/CabecaOnca.tsx
teste: apps/web/src/componentes/ui/onca/Onca.test.tsx › no `pensando` só o olho direito leva a pálpebra baixa: o esquerdo fica aberto
-      <Olho lado="e" uid={uid} olhar={olhar} palpebraBaixa={false} />
+      <Olho lado="e" uid={uid} olhar={olhar} palpebraBaixa={tipo === 'pensando'} />
```

```mutacao
arquivo: apps/web/src/areas/aluno/introducao/textos-da-introducao.ts
teste: apps/web/src/areas/aluno/introducao/textos-da-introducao.test.ts › o passo 1 diz que o Tutor é um programa e que pode errar, e nenhum passo traz a pose da comemoração
-  { id: 'letra', pose: 'pensando', fala: FALA_DA_LETRA, linhas: [], obrigatorio: false },
+  { id: 'letra', pose: 'acenando', fala: FALA_DA_LETRA, linhas: [], obrigatorio: false },
```

```mutacao
arquivo: apps/web/src/componentes/ui/Comemoracao.tsx
teste: apps/web/src/componentes/ui/Comemoracao.test.tsx › o salto é um só, o do corpo da onça, e o texto fica parado: a peça não põe outro movimento por cima
-      <Onca pose="comemorando" agente={agente} tamanho={120} />
+      <div className="comemoracao-salto"><Onca pose="comemorando" agente={agente} tamanho={120} /></div>
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-28 20:21:58 | 2026-10-28 20:22:17 | `tenancy-guardian` | 1 | APROVADO | a0eb5e6236c8250b2 |
| 2026-10-28 20:22:05 | 2026-10-28 20:22:23 | `infra-guardian` | 1 | APROVADO | a21099c7d5ac70c32 |
| 2026-10-28 20:22:02 | 2026-10-28 20:22:26 | `privacy-guardian` | 1 | APROVADO | a3e66fce9cd4b71a1 |
| 2026-10-28 20:21:42 | 2026-10-28 20:22:50 | `frontend-reviewer` | 1 | AJUSTES NECESSÁRIOS | a04326c740e0f5f7d |
| 2026-10-28 20:21:54 | 2026-10-28 20:24:25 | `revisor-geral` | 1 | REPROVADO | a6f2bf9b29de3d70b |
| 2026-10-28 20:21:51 | 2026-10-28 20:25:10 | `conformidade-reviewer` | 1 | REPROVADO | a7bf8ea6b9a0a56f6 |
| 2026-10-28 20:21:36 | 2026-10-28 20:25:22 | `test-engineer` | 1 | REPROVADO | a19770d5499d76d9b |
| 2026-10-28 20:56:21 | 2026-10-28 20:57:20 | `conformidade-reviewer` | 2 | APROVADO | a9a6af49bf96555a6 |
| 2026-10-28 20:57:20 | 2026-10-28 20:57:36 | `tenancy-guardian` | 2 | APROVADO | af0ce583bcaf795c6 |
| 2026-10-28 20:56:53 | 2026-10-28 20:57:40 | `revisor-geral` | 2 | APROVADO | a5f71acbdb1634dc3 |
| 2026-10-28 20:57:30 | 2026-10-28 20:57:50 | `privacy-guardian` | 2 | APROVADO | ae069057306953f3b |
| 2026-10-28 20:56:39 | 2026-10-28 20:57:50 | `test-engineer` | 2 | APROVADO | aa3135ef2ec8c2af3 |
| 2026-10-28 20:57:09 | 2026-10-28 20:57:52 | `frontend-reviewer` | 2 | APROVADO | af785d1bca19135f0 |
| 2026-10-28 20:57:41 | 2026-10-28 20:57:58 | `infra-guardian` | 2 | APROVADO | a374463de3434d17c |
