# Validação — correção 2026-10-28-onca-do-mockup (a onça do mockup)

## Rodada 1 — 28/10/2026

**Escopo:** correção `tasks/correcoes/2026-10-28-onca-do-mockup.md` (sem PRD; os requisitos são o pedido do Joaquim, "pegue
exatamente o que tem no mockup e utilize", em tudo e nos três papéis, e a seção "O que entra e o que não entra" da correção)
**Commit validado:** `fbf7400a` (código em `10bc0985`; o `fbf7400a` só mexe no `TODO.md`)
**Veredito: REPROVADA**

**O desenho está certo, e o motivo da reprovação é só a falta de teste.** Comparei, linha a linha e renderizado em tamanho
grande, a onça do `apps/web` com a de `mockups/src/components/duo/onca/`: caminhos, nove cores, rosetas, orelhas, máscara, olhos,
focinho, bocas, rabos, patas, punhos, pés, sombra do chão e o giro de cada pose são **os mesmos**, e a pata da pose acenando está
onde o mockup a põe. O que falta é o teste que segure isso. As **posições das quatro poses** (o giro do corpo, das patas, dos pés
e do rabo) e a **descida de 6% da cabeça no avatar** não têm teste nenhum: mudei a pata da pose acenando de lugar e os testes da
onça continuaram verdes. A causa escrita da própria correção é "nenhum teste comparava o desenho com o mockup", e para as poses
isso continua igual. A correção pedida é pequena, e o caminho está na seção 5.

### 1. Requisito a requisito

Fotos da tela em `.processo/vitrine/` (a vitrine monta a escola cheia e a vazia; 1366 px e 360 px). Comparação lado a lado,
mockup × `apps/web`, renderizada dos dois códigos-fonte com 360 px por pose:
`/tmp/claude-1000/-home-joaquimdp-Documents-git--maestri-floors-educaia--correcao2026-10-28-onca-do-mockup/302db326-c351-465b-847b-2642f587dc4a/scratchpad/comparacao.png`.

| Requisito | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| R1. O traço é o do mockup: `CORPO_D`, `CABECA_D`, a pinta, as cinco rosetas, os ombros, as orelhas com miolo, a máscara, os olhos com pupila e brilho, o focinho, o nariz, a boca em "w", e as nove cores | ATENDIDO | `componentes/ui/onca/geometria.ts:8-37`, `CabecaOnca.tsx:10-20` (cores), `:44-175` (peças) | `fidelidade-ao-mockup.test.tsx` (as impressões dos caminhos, "as rosetas são as cinco do mockup…", "a máscara são dois círculos…", "os olhos de frente…", "as cores desenhadas…"); `Onca.test.tsx` ("usa só as cores da 9.7…") | Conferido também à mão contra `mockups/.../geometria.ts`, `partes.tsx` e `paleta.ts`: idênticos. A mutação 2 (cor da pata) deu vermelho. Foto: `comparacao.png` |
| R2. As poses do corpo inteiro são as do mockup: o giro e o deslocamento de `figura`, das patas, dos pés, das orelhas, do rabo e da sombra do chão, em acenando, apontando, comemorando e pensando | **PARCIAL** | `Onca.tsx:80-135` (`POSES_DO_CORPO`) | Só partes isoladas: o braço longo e o lado de trás de apontando, os punhos e a mão creme **antes do giro** (`fidelidade-ao-mockup.test.tsx:118-147`). **Nenhum teste guarda os `transform` de nenhuma pose** | O código é igual ao do mockup (`mockups/.../Onca.tsx`, `POSES`), conferido valor a valor e na foto. **A mutação 1 sobreviveu**: a pata da pose acenando foi para outro lugar e os 72 casos da pasta da onça, mais os da `Introducao`, passaram. Era justamente a peça que o Joaquim pediu para ver |
| R3. O rosto de cada pose é o do mockup, e só a pose o escolhe; a cabeça do avatar é sempre a neutra | ATENDIDO | `CabecaOnca.tsx:128-147` (`Olhos`), `:157-191` (`Boca`); campos `olhar` e `boca` em `Onca.tsx:80-135` | `Onca.test.tsx` ("o rosto de cada pose é o do mockup…", "a conferência do rosto é de verdade…", "no `pensando` só o olho direito…"); `fidelidade-ao-mockup.test.tsx` ("a boca e o olhar de cada pose…"); `CabecaOnca.test.tsx` ("só tem a prop `tamanho`…") | Onze mutações declaradas na correção cobrem o rosto, e o portão as exigiu vermelhas |
| R4. O avatar dos três agentes é a cabeça do mockup no anel da cor do agente, com o recuo de 3 px (24) e 4 px (32 em diante), a descida de 6% e a roseta da testa só a partir de 40 px | **PARCIAL** | `componentes/ui/ia/AvatarAgente.tsx:29-34` (`LUGAR_DA_CABECA`), `CabecaOnca.tsx:223-246` | Recuo: `e2e/pecas-marca-onca.spec.ts:42` ("cada avatar é um círculo `fundo`…", verde nos dois projetos e nos dois temas). Roseta: `CabecaOnca.test.tsx` ("o tamanho é só o tamanho…"). **A descida de 6% não tem teste** | Fiz a conta para os quatro tamanhos: 24 → 4,44 px, 32 → 5,92, 40 → 6,4 e 48 → 6,88. São os mesmos números do `AvatarIA` do mockup. Foto dos avatares a 4×, sem defeito: `…/scratchpad/avatares.png` |
| R5. O movimento é o que ficou (entrar 240 ms, acenar uma vez por sessão e só na pose acenando, saltar na comemoração 500 ms), nada fica em laço, e nada roda com "reduzir movimento" (D59; regra 70, item 4b) | ATENDIDO | `onca/Onca.css`, `onca/movimento-da-onca.ts:37-45`, `Onca.tsx:157-163` | `movimento-da-onca.test.tsx` (os onze casos); `fidelidade-ao-mockup.test.tsx` ("o movimento que fica é o do mockup…"); `estilos.test.ts` (nenhum CSS de `apps/web/src` com `infinite`) | A mutação 3 (tirar a regra de "reduzir movimento") deu vermelho em três testes. No navegador, `getAnimations` na comemoração devolve uma animação só, `onca-comemorar`, de 500 ms e uma iteração; com `reducedMotion: 'reduce'`, nenhuma |
| R6. A `Comemoracao` tem um salto só (o `onca-comemora`), sem o `.comemoracao-salto` nem o invólucro do mockup | ATENDIDO | `componentes/ui/Comemoracao.tsx:21-28`; `Comemoracao.css` apagado | `Comemoracao.test.tsx` ("o salto é um só…", "roda uma vez, em 500 ms…", "com 'reduzir movimento'…"); `e2e/aluno-atividade.spec.ts:322-327` e a conferência da árvore (`:71`) | Fotos da comemoração no computador, no celular e com "reduzir movimento": `…/scratchpad/comemoracao-tres.png`. A onça comemora assinada "Tutor · IA", com "Atividade enviada.", sem número |
| R7. A onça é sempre assinada pela função, com o selo "IA", nunca se chama "onça" e nunca tem traço de pessoa (D58; D80, item 3; regra 70, item 4a) | ATENDIDO | `Onca.tsx:217-273` (`figure` com `figcaption`, `aria-hidden` no SVG) | `Onca.test.tsx` ("traz o nome da função e o selo 'IA'…", "o nome acessível é a função…"); `e2e/pecas-marca-onca.spec.ts:85,120` | Nas fotos dos três papéis a onça vem com "Tutor", "Assistente de ensino" ou "Analista de desempenho escolar", e o selo "IA" |
| R8. A pose `pensando` entra no passo da letra da introdução do aluno, com os três pontos parados | ATENDIDO | `areas/aluno/introducao/textos-da-introducao.ts:40`; `Onca.tsx:159-171` (`DesenhoDoBalao`, sem classe) | `textos-da-introducao.test.ts`; `movimento-da-onca.test.tsx` ("os três pontos do `pensando` ficam parados…") | Foto: `.processo/vitrine/aluno--aluno-bem-vindo--Continuar-Continuar-Continuar--celular.png` (e `--computador`) |
| R9. A onça do mockup aparece nos três papéis, no computador e no celular | ATENDIDO | `areas/{aluno,professor,coordenacao}/introducao/` | `e2e/introducao-pecas.spec.ts` (verde, `chromebook` e `celular`, nos dois temas) | Fotos: `aluno--aluno-bem-vindo--{computador,celular}.png`, `professora--professor-bem-vindo{,--Continuar}--*.png`, `coordenacao--coordenacao-bem-vindo{,--Continuar}--*.png` e `vazia--aluno--aluno-bem-vindo--computador.png`. Nenhuma tela rola a 1366 × 768 |

**Placar:** 7 requisitos atendidos, 2 parciais (R2 e R4), nenhum não atendido e nenhum não verificável.

Provas de mutação (minhas, três, todas restauradas com `git checkout --`; a árvore terminou limpa):

| Requisito | Cláusula alterada | Resultado |
|---|---|---|
| R2 | `Onca.tsx:83`, pose acenando: `pataD` de `translate(30 -16) rotate(-150 …)` para `translate(0 0) rotate(-150 …)` | **Sobreviveu.** `vitest --project unidade componentes/ui/onca/ Introducao.test.tsx` passou: 5 arquivos, 72 casos |
| R1 | `CabecaOnca.tsx:12`, `sombra: '#D75F18'` para `'#000000'` (a cor das patas) | Vermelho em `Onca.test.tsx` › "usa só as cores da 9.7, sem degradê…" |
| R5 | `Onca.css`, sem o bloco `@media (prefers-reduced-motion: reduce)` | Vermelho em três: `Comemoracao.test.tsx` › "com 'reduzir movimento'…", `fidelidade-ao-mockup.test.tsx` › "o movimento que fica…" e `movimento-da-onca.test.tsx` › "o CSS desliga todo movimento…" |

### 2. Decisões, regras e o que a correção prometeu

| Item | Situação | Evidência |
|---|---|---|
| D80, item 3: a onça é a mascote e o avatar, sempre com a função e o selo; "pose, expressão e movimento só entram com parecer do `conformidade-reviewer`" | cumprida no código | O parecer está na correção (rodada 1: aprovados `pensando`, as quatro expressões, entrar e acenar; vetados o piscar, o laço dos pontos e o salto duplo). Os vetados não estão no código: `fidelidade-ao-mockup.test.tsx` reprova `onca-pisc`, `onca-ponto`, `onca-olho` e `infinite` |
| D80, item 3: "com uma expressão neutra só" | **o texto da decisão contradiz o código** | A onça de corpo inteiro tem quatro rostos. Ver o achado maior M1 |
| D80, item 7(a): a comemoração uma vez, só na entrega, e some com `prefers-reduced-motion` | cumprida | R6; `e2e/aluno-atividade.spec.ts` (24 casos verdes) |
| D58 e regra 70, item 4a | cumprida | R7 |
| D59 e regra 70, item 4b | cumprida | R5. Sem laço, sem temporizador (o piscar saiu), e o aceno é uma vez por sessão |
| Regra 50, item 2a: 360 px sem rolagem horizontal | cumprida | Fotos do celular; `e2e/pecas-marca-onca.spec.ts:132` |
| Regra 50, item 11: acessibilidade | cumprida | O SVG é `aria-hidden` e `focusable="false"`; a figura é nomeada pela função; axe sem violação grave em `introducao-pecas` e `pecas-marca-onca` |
| Regra 20: nada de dado pessoal | cumprida | A única coisa gravada é `turmma-onca-acenou` no `sessionStorage`, um "1" sem pessoa. A lista dela está no `TODO.md` |
| Regras 10, 30 e 80 | não se aplicam | Não há API, banco, IA nem fila. Os três guardiões disseram isso nas rodadas 1 e 2 |
| "Não trouxe" da correção: `acolhendo`, `dormindo`, avatar pensando, cabeça feliz, marcas de movimento, pintas que voam | justificado | Cada item tem motivo escrito: decisão (D80, item 3), regra 50 ou veto. `Onca.test.tsx` prova que o tipo recusa `acolhendo` e `dormindo` |
| A pata da pose acenando, nas três telas (pedido do Orquestrador) | conferida: é a do mockup | No tamanho grande ela sobe ao lado do rosto, com o punho na altura dos olhos, igual ao mockup (`comparacao.png`). Na tela, a 120 e a 88 px, ela fica entre o corpo e o rabo e se lê pouco como aceno (`…/scratchpad/zoom-acenando.png`). O mockup tem o mesmo traço, mas com duas linhas de movimento ao lado da pata, e essas a correção não trouxe. Ver o menor m2 |
| A comemoração vista, um salto só e parada com "reduzir movimento" (pendência deixada ao Validador) | conferida | R5 e R6 |
| Medir no Chromebook se a rolagem da conversa do Tutor segue fluida com o avatar novo (pendência do `infra-guardian`) | não feita aqui | Precisa do aparelho de referência. Segue no `TODO.md` |

### 3. Portão

| Portão | Resultado |
|---|---|
| Unidade, isolada: `vitest run --project unidade` nos 11 arquivos de evidência (pasta `onca/`, `Comemoracao`, os dois do avatar, `Introducao`, `textos-da-introducao`, `estilos`, `nome-dos-chunks`) | ✅ 208 casos |
| `e2e/pecas-marca-onca.spec.ts` + `e2e/introducao-pecas.spec.ts` (`chromebook` e `celular`), com `node tools/ci/e2e.ts --manter-ambiente`, que também reconstruiu a web de teste no commit validado antes das fotos | ✅ 70 casos |
| `e2e/aluno-atividade.spec.ts` (a comemoração no fluxo de verdade) | ✅ 24 casos |
| `npm run typecheck`, `lint`, a unidade inteira e `test:infra` | não rodados, por pedido do Orquestrador (só o teste que serve de evidência). O hook só aceitou o commit `10bc0985` com o carimbo do portão da correção |
| Esteira do GitHub | conferida no fechamento |
| Revisões com veto registradas e aprovadas | ✅ Os sete obrigatórios têm rodada 2 APROVADO (seção "Revisões" da correção) |
| `npm ci` | não foi preciso: o `node_modules` é mais novo que o `package-lock.json` |

### 4. Achados

**Críticos**
- `apps/web/src/componentes/ui/onca/Onca.tsx:80-135` × `fidelidade-ao-mockup.test.tsx:118`: as transformações de cada pose (`figura`,
  `pataE`, `pataD`, `peE`, `peD`, `orelhaE`, `orelhaD`, `rosto`, `sombraDoChao` e o `d` do rabo) não estão congeladas em teste, e a
  mutação 1 sobreviveu. O código está igual ao do mockup hoje, mas nada impede que ele se afaste, e esse é o defeito que a correção
  diz ter fechado ("nenhum teste comparava o desenho com o mockup"). O test-engineer pediu isso na rodada 1 e o pedido foi para o
  `TODO.md`, que o descreve como "poucas linhas por pose". **Correção:** em `fidelidade-ao-mockup.test.tsx`, um caso que congela,
  pose a pose, os valores do `POSES` do mockup (texto literal ou impressão sha256, como os caminhos) e confere o atributo
  `transform` de `[data-parte="corpo"]`, `pata-e`, `pata-d`, `pe-e`, `pe-d`, `sombra`, `rosto`, dos grupos das orelhas e o `d`
  do rabo. Vale declarar a mutação 1 desta validação como bloco ` ```mutacao ` da correção.
- `apps/web/src/componentes/ui/ia/AvatarAgente.tsx:29-34`: a descida de 6% da cabeça (`top-[2.44px]`, `top-[3.92px]`, `top-[4.4px]`,
  `top-[4.88px]`) não tem teste. Trocar por `top-px` não deixa nada vermelho: o e2e confere o recuo, não a descida, e o `TODO.md`
  confirma. **Correção:** um caso de unidade que lê a classe do `span` interno para cada tamanho e confere os quatro números, ou
  a medida no e2e que já existe (`pecas-marca-onca.spec.ts:42`), com o `top` da cabeça igual a recuo + 6% do tamanho.

**Maiores**
- M1. `docs/decisoes.md:1446` (D80, item 3) diz "com uma expressão neutra só", e o código dá quatro rostos à onça de corpo inteiro
  (`CabecaOnca.tsx:128-191`). O `docs/interface.md` 9.7 já diz o certo (o avatar é neutro e o corpo inteiro tem rosto por pose), mas a
  decisão não foi revista. Hoje o parecer do conformidade-reviewer existe, mas não há registro. **Correção:** `registrar-decisao`,
  pelo Orquestrador, com a palavra do Joaquim, antes do pouso. Já é recomendação sem aplicar das rodadas 1 e 2.
- M2. `CLAUDE.md:193` diz "Nada de mockup é copiado para o `apps/web`", e a correção copiou a onça (o `docs/interface.md:637`
  registra a exceção, o `CLAUDE.md` não). **Correção:** acrescentar a exceção na linha, pelo Orquestrador, com a palavra do Joaquim.
  Já está em "Sem aplicar" das rodadas 1 e 2.

**Menores** (o dono de todos é o Orquestrador, que os leva ao `TODO.md` ou ao Joaquim)
- m1. **"Em tudo", quanto ao lugar.** A correção trocou o desenho em todo lugar onde a web já tinha a onça. O mockup ainda a põe em
  lugares onde a web não tem nenhuma, e a seção "Não trouxe" só explica o `dormindo`: `apontando` no vazio de Criados
  (`mockups/src/areas/professor/Criados.tsx:179`), no "Ninguém entrou ainda" da aba Hoje (`abas-turma/Hoje.tsx:83`), em Eu
  (`aluno/Eu.tsx:109`), na Estrutura da coordenação (`coordenacao/Estrutura.tsx:259`) e na atividade do aluno
  (`aluno/Atividade.tsx:324`, e `pensando` em `:362`); e a onça ao lado da conversa do Tutor (`aluno/_conversa-tutor.tsx:290`).
  Cada uma seria pose nova num lugar novo, e precisaria de parecer (D80, item 3). **O Joaquim precisa saber que "em tudo" ficou
  "no lugar onde ela já estava"** e decidir se quer as outras.
- m2. A pata da pose acenando se lê pouco como aceno na tela (120 px no computador, 88 px no celular): fica entre o corpo e o rabo.
  É o traço do mockup. Lá, as duas linhas de movimento ao lado da pata ajudam a ler, e a correção não as trouxe. O aceno animado
  roda uma vez por sessão, e depois a onça fica parada nessa pose. Foto: `…/scratchpad/zoom-acenando.png`. Decisão de desenho para
  o Joaquim: trazer as duas linhas, que são paradas e não são movimento, ou aceitar como está.
- m3. `docs/interface.md:1182`: a tabela de poses diz "Dormindo | O vazio 'Tudo em dia' do sino | X2, com parecer", e a correção diz
  que o web não tem onça em vazio nenhum. Alinhar a linha ("não entra; falta decidir quem assina").
- m4. Na introdução do professor, o mockup usa `pensando` em dois passos (`professor/BemVindo.tsx:261,282`), e no passo de "limites"
  da coordenação usa `acolhendo` (vetada). Os passos do web são outros, desde a X4, e as poses foram escolhidas para eles. Não é
  defeito, mas é mais um lugar em que o web não é "exatamente o mockup".
- m5. Os menores das rodadas 1 e 2 que já têm destino no `TODO.md:2260-2282` (o `t-salto` da 9.5, a busca de pasta repetida em
  `estilos.test.ts`, o nome do caso em `Introducao.test.tsx:313`, o `rostoConfere` fora de `<svg>` e outros) seguem lá.

**Positivos**
- O teste de fidelidade congela o original (impressões sha256 e medidas) sem importar nem ler a pasta do protótipo. É o jeito
  certo de prender uma cópia a uma fonte que pode mudar. Falta só estendê-lo às poses.
- Cada coisa nova mora num lugar só (a pose, a expressão, o movimento), e por isso o veto do conformidade-reviewer saiu apagando
  um lugar, sem espalhar condição pelo código.

### 5. Conclusão

**REPROVADA**, por dois críticos do mesmo tipo: requisito com código certo e sem teste que o segure (R2, as poses; R4, a descida
do avatar). Nada que a pessoa vê está errado. O desenho, as cores, os rostos, o movimento, a comemoração e as assinaturas estão
fiéis ao mockup e às regras, e conferi isso no código, na foto e no navegador.

Caminho até APROVADA, numa correção curta:
1. Um caso em `fidelidade-ao-mockup.test.tsx` com as transformações de cada pose congeladas, e a mutação 1 desta validação
   declarada como bloco ` ```mutacao `.
2. Um caso (de unidade ou no e2e do avatar) que prove a descida de 6% nos quatro tamanhos, também com mutação declarada.
3. Antes do pouso, fora da correção: M1 (`registrar-decisao` da D80, item 3) e M2 (exceção no `CLAUDE.md`), com a palavra do Joaquim.

Na revalidação, eu rodo de novo a mutação 1 e a da descida.

### 6. Pendências herdadas

- Medir no Chromebook de referência a rolagem da conversa do Tutor com o avatar novo: `TODO.md` (infra-guardian, rodada 1).
- m1 e m2 (onde mais a onça aparece; as linhas de movimento do aceno): para o Joaquim decidir, pelo Orquestrador.
- m3 e m4: `TODO.md`, na próxima spec que mexer na 9.7.
- As recomendações das rodadas 1 e 2 já anotadas no `TODO.md:2260-2282`.
- Nenhum commit `Fora do processo:` no intervalo `origin/develop..HEAD`.
