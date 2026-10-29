# Validação — correção 2026-10-28-onca-do-mockup (a onça do mockup)

## Rodada 3 — 28/10/2026 (revalidação)

**Escopo:** as correções `2026-10-28-onca-do-mockup`, `-v2`, `-v3` e `-v4` (`tasks/correcoes/`) e o registro `d12a9ba0`. Os requisitos
são os da rodada 2 (R1 a R11). O que mudou desde ela é só a v4 (`befdc575`): `Criados.tsx` (+1 linha), `EstadoVazio.tsx`,
`estados.test.tsx` e `e2e/professor-criados.spec.ts`. Nenhum arquivo de `componentes/ui/onca/` nem do avatar foi tocado
(`git diff --stat 26c94763 befdc575`).
**Commit validado:** `befdc575`
**Veredito: APROVADA**

**O C1 da rodada 2 fechou.** O vazio de Criados agora é o do mockup: a onça, a assinatura, o título, o texto e "Ir para Ferramentas"
ficam no mesmo eixo, no computador e no celular. Medi isso na tela: o centro do desenho, o do texto do título, o das duas linhas do
texto e o do botão estão todos em x = 811,0, que é o centro da caixa. O teste novo mede a tela, e não a classe. A mutação que tira o
`tracejado` o deixa vermelho, com a mensagem "onça em 811.0, texto do título em 400.9". Nada do que estava atendido regrediu. Restam
só menores (seção 4).

### 1. Requisito a requisito

A web de teste foi reconstruída em `befdc575` (`node tools/ci/e2e.ts --manter-ambiente`, seção 3) e a vitrine foi montada de novo.
As fotos estão em `.processo/vitrine/` e foram lidas como imagem: `vazia--professora--professor-criados--{computador,celular}.png`,
`professora--professor-criados--computador.png` (cheia, sem onça), e `{aluno--aluno,professora--professor,coordenacao--coordenacao}-bem-vindo--*.png`.
A vitrine diz "Nenhuma tela rola a 1366 × 768" em todas, cheia e vazia.

| Requisito | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| R1. O traço é o do mockup | ATENDIDO | sem mudança desde a rodada 2 | `fidelidade-ao-mockup.test.tsx`, `Onca.test.tsx`, verdes (seção 3) | Fotos das três introduções: o mesmo desenho |
| R2. As poses do mockup | ATENDIDO | sem mudança (`Onca.tsx`, `POSES_DO_CORPO`) | `fidelidade-ao-mockup.test.tsx`, verde | A mutação da pata, da rodada 2, segue valendo: o código e o teste não mudaram |
| R3. O rosto da pose; a cabeça neutra no avatar | ATENDIDO | sem mudança | os mesmos, verdes | — |
| R4. O avatar: recuo, descida de 6% e roseta | ATENDIDO | sem mudança | `avatar-com-funcao-e-selo.test.tsx`, verde; `e2e/pecas-marca-onca.spec.ts`, verde nos dois projetos | — |
| R5. O movimento, nada em laço, nada com "reduzir movimento" | ATENDIDO | sem mudança | `movimento-da-onca.test.tsx`; `e2e/introducao-pecas.spec.ts` ("um salto só…", "com 'reduzir movimento' nenhuma animação…"), verdes | — |
| R6. A `Comemoracao` com um salto só | ATENDIDO | sem mudança | `e2e/introducao-pecas.spec.ts`, verde | — |
| R7. Assinada pela função, com o selo "IA" | ATENDIDO | sem mudança | `Onca.test.tsx`, `Criados.test.tsx`, verdes | Fotos: "Tutor", "Assistente de ensino" e "Analista de desempenho escolar" com o selo; em Criados, "Assistente de ensino · IA" |
| R8. `pensando` no passo da letra | ATENDIDO | sem mudança | os mesmos da rodada 1, verdes | — |
| R9. A onça nos três papéis, no computador e no celular | ATENDIDO | sem mudança | `e2e/professor-introducao.spec.ts` e `introducao-pecas.spec.ts`, verdes nos dois projetos; os de aluno e coordenação, verdes na rodada 2 sobre o mesmo código | Fotos de hoje: aluno (celular), professora e coordenação (computador). Iguais às da rodada 2 |
| R10. A onça no vazio de Criados, como no mockup | **ATENDIDO** (era PARCIAL) | `Criados.tsx:184-186` (`variante="tracejado"`, `Onca` apontando, 120 px, parada); `EstadoVazio.tsx:49-56` | `e2e/professor-criados.spec.ts:82` ("vazio: a onça, o título e a ação ficam no mesmo eixo, como no mockup"), verde em `chromebook` (9,9 s) e `celular` (10,9 s), abaixo da metade do prazo de 30 s; `Criados.test.tsx` (pose, assinatura, selo, parada; sem onça no vazio do filtro); `estados.test.tsx` | O teste mede o `svg` dentro do `main` (e reprova sem ele), o texto do título por `Range` e a caixa do botão, com tolerância de 3 px. **Minha mutação A** (tirar o `tracejado`) deixou o teste vermelho pelo motivo certo. A medição que fiz sobre a web limpa: caixa com centro em 811,0; desenho de 120 px em 751 a 871; botão e as duas linhas do texto também com centro em 811,0. É o desenho do mockup (`mockups/src/components/duo/vazio.tsx:14`, tudo centralizado). O parágrafo a mais que o nosso vazio tem foi mantido com motivo (10.2 e regra 50, item 5) |
| R11. As duas linhas ao lado da pata que acena | ATENDIDO | sem mudança | `fidelidade-ao-mockup.test.tsx`, `Onca.test.tsx`, verdes | Fotos: as linhas aparecem nas três introduções, no computador e no celular |

**Placar:** 11 requisitos atendidos, nenhum parcial, nenhum não atendido e nenhum não verificável.

Provas de mutação (minhas, três, uma a uma, cada uma com a web reconstruída e só o caso do alinhamento, em `chromebook`; todas
restauradas com `git checkout --`. Depois delas, rodei um controle na árvore limpa, que ficou verde e deixou a web de teste de novo em `befdc575`. A
árvore terminou limpa):

| | Cláusula alterada | Resultado |
|---|---|---|
| A | `Criados.tsx`: sem a linha `variante="tracejado"` | **Vermelho**: "onça em 811.0, texto do título em 400.9" |
| B | `EstadoVazio.tsx`, `TopoDoVazio`: `'flex justify-center'` → `'flex justify-start'` | Verde, e é o certo: mutante equivalente. Na caixa `flex-col items-center` do tracejado, o invólucro encolhe à largura da figura (193 px medidos, iguais aos da `figure`), então o `justify-*` de dentro não move nada. A tela não muda (m1) |
| C | `EstadoVazio.tsx`, linha do botão: sem o `justify-center` do tracejado | Verde pelo mesmo motivo: a linha encolhe à largura do botão (214 px medidos, iguais aos do botão). A tela não muda (m1) |

### 2. Decisões, regras e o que as correções prometeram

| Item | Situação | Evidência |
|---|---|---|
| C1 da rodada 2 (o vazio de Criados não era o do mockup, e o teste conferia a classe) | **fechado** | R10, a mutação A e as fotos `vazia--professora--professor-criados--*.png` |
| Comentário de `EstadoVazio.tsx` e o caso de `estados.test.tsx` dizendo o que a peça faz (item 3 do caminho da rodada 2) | fechado | `EstadoVazio.tsx:22-27` e `estados.test.tsx:136-137` agora dizem que o padrão não alinha a ilustração e que o vazio centralizado é o `tracejado`, medido no e2e |
| O `gap-3` só com `emAndamento` (efeito fora de Criados) | conferido | Toca todo `EstadoVazio` com ação. No padrão, a região vazia fica no fim da linha e nada se move. No tracejado do Analista (`coordenacao/governanca/Analista.tsx:105-110`), o botão também deixa de ficar 6 px fora do eixo. O caso novo de `estados.test.tsx` ("o espaço entre o botão e o 'Verificando…'…") cobre os dois ramos, e a mutação que a v4 declarou sobre ele passou no portão |
| D80, item 3, D58, D59, regra 70 (4a, 4b), regra 20 | cumpridas, sem mudança | A v4 não tocou a onça, o movimento nem o navegador. O `conformidade-reviewer` e o `privacy-guardian` aprovaram a 1ª rodada |
| Regra 50: item 2a (360 px sem rolagem lateral, ação principal de 44 px) e item 5 (o vazio convida para agir) | cumpridas | Foto do celular; `professor-criados.spec.ts` ("vazio: 'Nada gerado ainda' leva a Ferramentas, sem rolagem para o lado e sem violação de acessibilidade"), verde nos dois projetos |
| Regra 40, item 1 (apagar a regra derruba o teste) | cumprida | Mutação A. O teste mede o que se vê, e não a classe, que era o defeito da rodada 2 |
| Regras 10, 30 e 80 | não se aplicam | Não há API, banco, IA nem fila. Os guardiões disseram isso na v4 |

### 3. Portão

| Portão | Resultado |
|---|---|
| Unidade, isolada: `vitest run --project unidade` em `componentes/ui/onca/`, `avatar-com-funcao-e-selo`, `estados`, `Criados` e `avatar-so-nas-duas-pecas` | ✅ 9 arquivos, 131 casos |
| e2e com `node tools/ci/e2e.ts --manter-ambiente`, que reconstruiu a web de teste em `befdc575`: `professor-criados`, `pecas-marca-onca`, `introducao-pecas`, `professor-introducao` (`chromebook` e `celular`) | ✅ 112 casos, nenhum vermelho nem intermitente |
| As três mutações e o controle (seção 1) | A vermelha; B e C equivalentes; o controle verde |
| `npm run typecheck`, `lint`, a unidade inteira e `test:infra` | não rodados: só os testes de evidência, como pede o validador. O hook só aceitou `befdc575` com o carimbo do portão da v4, que aplica as cinco mutações declaradas |
| Esteira do GitHub | conferida no fechamento |
| Revisões com veto registradas e aprovadas | ✅ v4: os seis obrigatórios com a última rodada APROVADO (`test-engineer` na 2ª, os outros na 1ª). O `revisor-geral` não entra, porque são 4 arquivos fora de `tasks/` e nada em `.github/`, `tools/ci/` ou `tools/processo/` (`.claude/skills/corrigir/SKILL.md:87-88`) |
| `npm ci` | não foi preciso: o `node_modules` é mais novo que o `package-lock.json` |
| Commits `Fora do processo:` em `origin/develop..HEAD` | nenhum |

### 4. Achados

**Críticos**
- Nenhum.

**Maiores**
- Nenhum.

**Menores** (o dono é o Orquestrador, que os leva ao `TODO.md` no fechamento)
- m1. `apps/web/src/componentes/estado/EstadoVazio.tsx:33` (`'flex justify-center'` do `TopoDoVazio`) e `:56` (o `justify-center` da linha do botão)
  não fazem nada no tracejado: o `items-center` da caixa (`:49`) já encolhe e centraliza os dois (mutações B e C, e as larguras medidas).
  Não é defeito, e o e2e mede a tela, que é o que importa. Fica anotado para ninguém ler essas classes como o que segura o alinhamento.
  Arrumação opcional, para quem tocar a peça.
- m2. `e2e/professor-criados.spec.ts:82` mede a onça, o título e o botão, mas não o texto da descrição. Tirar o `text-center` da caixa
  deixaria as duas linhas do texto alinhadas à esquerda dentro do bloco centralizado, e o teste não ficaria vermelho. Hoje elas estão centradas
  (medido: centro 811,0 nas duas). A sugestão é medir também o centro de cada linha do `Range` da descrição.
- m3. O `-v4.md` manda para o `TODO.md` a recomendação de exigir no tipo que quem passa `ilustracao` passe também `variante="tracejado"`
  (test-engineer e conformidade-reviewer, 1ª rodada). O `befdc575` não tocou o `TODO.md`, e o item não está lá: é recomendação sem destino.
- m4. `TODO.md:2283-2286` (o alinhamento da onça no vazio padrão) caiu com a v4. Marcar como feito no fechamento.
- m5. O m2 da rodada 2 (o mockup usa `pensando` em dois passos da introdução do professor e `acolhendo` no da coordenação) segue sem
  destino no `TODO.md`.
- m6. Seguem no `TODO.md`, sem mudança: o m1 da rodada 2 (Criados "parado" e o mockup animado, só anotação), a mão de cada pose
  (`TODO.md:2270`), o seed no texto da introdução da coordenação (`TODO.md:2264`) e o "FERRAMEN…" da barra de baixo a 360 px
  (`TODO.md:1656`, item a; aparece na foto `vazia--professora--professor-criados--celular.png`).

**Positivos**
- O e2e novo mede o **desenho** (o `svg`, dentro do `main`) e o **texto** (por `Range`), e não as caixas que ocupam a largura toda. Foi
  esse o engano que deixou o defeito da rodada 2 passar, e o jeito vale para todo teste de alinhamento.

### 5. Conclusão

**APROVADA.** Os onze requisitos estão atendidos, com código, teste e foto. O C1 da rodada 2 fechou na tela e no teste, e a mutação
que o desfaz fica vermelha. A v4 não tocou a onça, e os testes e fotos de R1 a R9 e R11 seguem como na rodada 2. Os menores não mudam o veredito.

### 6. Pendências herdadas

- Medir no Chromebook de referência a rolagem da conversa do Tutor com o avatar novo: `TODO.md:2262` (infra-guardian).
- m2, m3 e m5 vão para o `TODO.md`; m4 é marcar como feito; m1 e m6 são anotação ou já estão lá.
- O que dizer ao Joaquim sobre "em tudo" continua na linha do m1 da rodada 1, na seção 2 da rodada 2.

---

## Rodada 2 — 28/10/2026 (revalidação)

**Escopo:** as correções `2026-10-28-onca-do-mockup`, `-v2` e `-v3` (`tasks/correcoes/`) e o registro `d12a9ba0` (D80, item 3 revista;
`CLAUDE.md`, `ROADMAP.md`, `mockups/README.md`). Os requisitos são os da rodada 1 (R1 a R9), mais os que a v3 trouxe: R10, a onça no
vazio de Criados, e R11, as duas linhas do aceno.
**Commit validado:** `26c94763`
**Veredito: REPROVADA**

**O que a rodada 1 pediu está fechado.** As transformações das quatro poses e a descida de 6% do avatar agora têm teste. Rodei de
novo a mutação 1 da rodada 1 (a pata da pose acenando) e a da descida, e as duas ficaram vermelhas. M1 e M2 estão registrados. O
traço continua igual ao do mockup nas quatro poses, e as linhas do aceno também. **O motivo da reprovação é só o vazio de Criados:**
a onça aparece centralizada, e o título, o texto e o botão ficam à esquerda. Isso não é o mockup, onde o vazio inteiro é
centralizado, e não é o que o próprio componente diz fazer ("no padrão à esquerda"). O teste que deveria segurar isso passa sem
segurar nada. A correção é de uma linha (seção 5).

### 1. Requisito a requisito

Fotos tiradas com a web de teste reconstruída em `26c94763` (`node tools/ci/e2e.ts --manter-ambiente`) e a vitrine montada de novo,
em `.processo/vitrine/`, a 1366 px e a 360 px. A comparação lado a lado do mockup e do `apps/web`, renderizados dos dois
códigos-fonte com 300 px por pose, está em `.processo/vitrine/validacao-r2/comparacao.png`. Nela, a sombra do chão do mockup sai preta
porque o meu render não carrega o CSS dele, e isso não é diferença de desenho.

| Requisito | Situação | Código | Teste | Observação |
|---|---|---|---|---|
| R1. O traço é o do mockup | ATENDIDO | `componentes/ui/onca/geometria.ts`, `CabecaOnca.tsx` (sem mudança desde a rodada 1) | `fidelidade-ao-mockup.test.tsx`, `Onca.test.tsx` | `comparacao.png`: o mesmo desenho nas quatro poses |
| R2. As poses são as do mockup: o giro e o deslocamento da figura, das patas, dos pés, das orelhas, do rosto, do rabo e da sombra | **ATENDIDO** (era PARCIAL) | `Onca.tsx:83-135` (`POSES_DO_CORPO`) | `fidelidade-ao-mockup.test.tsx:161` (`TRANSFORMACOES_DO_MOCKUP`, em texto literal) e os dois `it.each` de `:227` e `:231` ("%s gira a figura…", "%s põe a ponta escura do rabo…"), mais "as quatro poses estão congeladas…" | Conferi valor a valor `TRANSFORMACOES_DO_MOCKUP` contra o `POSES` de `mockups/src/components/duo/onca/Onca.tsx:43-104`: os dez campos das quatro poses são iguais. **A mutação 1 da rodada 1, rodada de novo, ficou vermelha.** A mão de cada pose (`maoD`) segue presa só em parte (m3) |
| R3. O rosto é o da pose; a cabeça do avatar é a neutra | ATENDIDO | sem mudança | os mesmos da rodada 1 | `comparacao.png` |
| R4. O avatar: recuo, descida de 6% e roseta da testa | **ATENDIDO** (era PARCIAL) | `componentes/ui/ia/AvatarAgente.tsx:30-34` (`LUGAR_DA_CABECA`) | `avatar-com-funcao-e-selo.test.tsx:98` ("a cabeça recua do anel e desce 6%…"), que lê a classe de topo do `span` nos quatro tamanhos; o recuo segue no `e2e/pecas-marca-onca.spec.ts` | **Mutação de `top-[3.92px]` para `top-0.5` (32 px): vermelha.** O teste lê a classe, e não a posição desenhada. O que liga a classe ao pixel é o Tailwind gerar a classe arbitrária, e o e2e de recuo, verde, roda sobre o mesmo build |
| R5. O movimento (entrar, acenar uma vez por sessão, saltar), nada em laço, nada com "reduzir movimento" | ATENDIDO | `onca/movimento-da-onca.ts:16-41`, `Onca.css` | `movimento-da-onca.test.tsx` ("só a primeira onça acenando…", "a marca de já acenou não vai para o navegador…", "a onça não acena, e o aceno não é gasto…") | "Já acenou" saiu do `sessionStorage` para a memória da página (v2). Aceito o que o revisor-geral deixou para mim: sair da conta sem recarregar não zera a marca, e quem entra depois na mesma aba não vê o aceno. Não é dado de pessoa, e é o que o `sessionStorage` do mockup também fazia |
| R6. A `Comemoracao` tem um salto só | ATENDIDO | sem mudança | os mesmos da rodada 1 | — |
| R7. Sempre assinada pela função, com o selo "IA" | ATENDIDO | `Onca.tsx:231-289` | `Onca.test.tsx`; `Criados.test.tsx` (vazio) confere a assinatura "Assistente de ensino" e o selo | Fotos: "Tutor", "Assistente de ensino" e "Analista de desempenho escolar", com o selo, nos três papéis e em Criados |
| R8. `pensando` no passo da letra, com os pontos parados | ATENDIDO | sem mudança | os mesmos da rodada 1 | — |
| R9. A onça do mockup nos três papéis, no computador e no celular | ATENDIDO | `areas/{aluno,professor,coordenacao}/introducao/` | `e2e/introducao-pecas.spec.ts` e os três `*-introducao.spec.ts`, verdes nos dois projetos | Fotos: `aluno--aluno-bem-vindo--{computador,celular}.png`, `professora--professor-bem-vindo--{computador,celular}.png` e `coordenacao--coordenacao-bem-vindo--{computador,celular}.png`. A vitrine diz "Nenhuma tela rola a 1366 × 768" em todas |
| R10. A onça do mockup no vazio de Criados (`apontando`, 120 px, parada, assinada pelo Assistente de ensino; só no vazio de verdade) | **PARCIAL** | `areas/professor/artefatos/Criados.tsx:184-185`; `componentes/estado/EstadoVazio.tsx:24,30-31` | `Criados.test.tsx` (pose, assinatura, selo, parada; o vazio do filtro sem onça), `estados.test.tsx:116-133`, `avatar-so-nas-duas-pecas.test.ts` (`TELAS_COM_A_ONCA`) | Pose, tamanho, assinatura, selo, onça parada e a ausência no vazio do filtro estão certos, com teste. **A mutação que tira a onça de Criados deixou dois testes vermelhos.** O que está errado se vê na foto `vazia--professora--professor-criados--computador.png` (e `--celular`): a onça e a assinatura estão **centralizadas** na caixa, e o título, o texto e o botão estão **à esquerda**. No mockup (`mockups/src/areas/professor/Criados.tsx:176-181` com `components/duo/vazio.tsx:14`) o vazio inteiro é centralizado. O comentário do componente (`EstadoVazio.tsx:24`) e o teste (`estados.test.tsx:128-129`) dizem "no padrão à esquerda". O teste confere que o invólucro não tem `justify-center` e passa, mas a `figure` da `Onca` (`Onca.tsx:231`, `flex-col items-center`, largura inteira) centraliza a onça mesmo assim. Ver crítico C1 |
| R11. As duas linhas ao lado da pata que acena, as do mockup, paradas | ATENDIDO | `Onca.tsx:91,162-169,280` | `fidelidade-ao-mockup.test.tsx:244` ("as duas linhas… traço de 5 na cor da sombra, parado"); `Onca.test.tsx` ("só a acenando leva as duas linhas…") | Iguais ao `extra` do `acenando` do mockup (`Onca.tsx:52-57` de lá): os mesmos dois `d`, traço 5, cor da sombra, ponta redonda. Fotos: elas aparecem ao lado da pata nas três introduções, no computador e no celular, e o gesto agora se lê como aceno (fecha o m2 da rodada 1). Duas mutações declaradas na v3 cobrem isso |

**Placar:** 10 requisitos atendidos, 1 parcial (R10), nenhum não atendido e nenhum não verificável.

Provas de mutação (minhas, três, todas restauradas com `git checkout --`; a árvore terminou limpa):

| Requisito | Cláusula alterada | Resultado |
|---|---|---|
| R2 | `Onca.tsx`, pose acenando: `pataD` de `translate(30 -16) …` para `translate(0 0) …` (a mutação 1 da rodada 1) | Vermelho: `fidelidade-ao-mockup.test.tsx` › "acenando gira a figura, as orelhas, o rosto, as patas, os pés, a sombra e o rabo como o mockup" |
| R4 | `AvatarAgente.tsx:32`, `top-[3.92px]` para `top-0.5` | Vermelho: `avatar-com-funcao-e-selo.test.tsx` › "a cabeça recua do anel e desce 6%…" |
| R10 | `Criados.tsx`, sem a prop `ilustracao` e sem o `import` da `Onca` | Vermelho em dois: `Criados.test.tsx` › "vazio: 'Nada gerado ainda'…" e `avatar-so-nas-duas-pecas.test.ts` › "só a `Introducao`, a `Comemoracao`, a introdução de cada papel e o vazio de Criados importam a `Onca`…" |

### 2. Decisões, regras e o que as correções prometeram

| Item | Situação | Evidência |
|---|---|---|
| Crítico 1 da rodada 1 (as poses sem teste) | fechado | R2 e a mutação 1 |
| Crítico 2 da rodada 1 (a descida de 6% sem teste) | fechado | R4 e a mutação 2 |
| M1 da rodada 1 (D80, item 3, "uma expressão neutra só") | fechado | `d12a9ba0`: `docs/decisoes.md` (D80, item 3 reescrito, e a revisão de 28/10/2026 com a palavra do Joaquim e o motivo) |
| M2 da rodada 1 (a exceção da cópia no `CLAUDE.md`) | fechado | `d12a9ba0`: `CLAUDE.md:193-195`, `ROADMAP.md:368-369`, `mockups/README.md:19-20` |
| m1 da rodada 1 ("em tudo" ficou "onde ela já estava") | tratado | v3: os seis lugares do mockup passaram pelo `conformidade-reviewer`. Entrou o vazio de Criados. Foram vetados, com motivo escrito, a pausa do Tutor com `dormindo`, o roteiro da Estrutura, a atividade indisponível com `pensando` e o vazio de "Como estou indo". Dois lugares não existem na web (D73). **Para o Joaquim:** "a onça em tudo" ficou em três introduções, na comemoração, no avatar e num vazio. O resto foi vetado por regra (D58, D59, regra 70, itens 4a e 5), e o critério ficou escrito na 9.7 |
| m2 da rodada 1 (a pata que acena se lia pouco) | fechado | R11 |
| m3 da rodada 1 (a linha do `dormindo` na 9.7) | fechado | `docs/interface.md:1191` agora diz "não entra" |
| Esteira `40768156174` vermelha (a chave `turmma-onca-acenou` e o 97 → 98 do `tokens:143`) | verde nos casos que falhavam | Rodei `aluno-introducao`, `professor-introducao`, `coordenacao-introducao`, `aparencia` e `tokens`: verdes nos dois projetos (seção 3) |
| D80, item 3 (pose, lugar e movimento novos só com parecer) | cumprida | O parecer de cada lugar está na seção "O que entra e o que não entra" da v3, e o `conformidade-reviewer` aprovou a rodada 2 |
| D58 e regra 70, item 4a | cumprida | R7. Na v3, a onça só assina onde o agente produz o que a região mostra (`docs/interface.md` 9.7, "O critério da assinatura") |
| D59 e regra 70, item 4b | cumprida | R5, R11. As linhas são traço parado, sem classe nem animação |
| Regra 20 (nada no navegador além do contrato do RF24) | cumprida | `movimento-da-onca.test.tsx` e os e2e do "nada fica no navegador", verdes |
| Regra 50, item 2a (360 px sem rolagem lateral) | cumprida | Fotos de celular; `professor-criados.spec.ts` ("vazio: … sem rolagem para o lado e sem violação de acessibilidade"), verde |
| Regras 10, 30 e 80 | não se aplicam | Não há API, banco, IA nem fila. Os guardiões disseram isso nas v2 e v3 |
| `docs/interface.md` 10.2 (vazio padrão à esquerda, tracejado centralizado) | **contrariada na tela** | C1 |

### 3. Portão

| Portão | Resultado |
|---|---|
| Unidade, isolada: `vitest run --project unidade` em `componentes/ui/onca/`, `avatar-com-funcao-e-selo`, `avatar-so-nas-duas-pecas`, `estados`, `Criados`, `Estrutura` e `Comemoracao` | ✅ 10 arquivos, 157 casos |
| e2e com `node tools/ci/e2e.ts --manter-ambiente`, que também reconstruiu a web de teste em `26c94763`: `aluno-introducao`, `professor-introducao`, `coordenacao-introducao`, `aparencia`, `tokens`, `pecas-marca-onca`, `introducao-pecas`, `professor-criados` (`chromebook` e `celular`) | ✅ 188 casos, nenhum intermitente |
| `npm run typecheck`, `lint`, a unidade inteira e `test:infra` | não rodados: só os testes de evidência, como pede o validador. O hook só aceitou `0222d2f6` e `26c94763` com o carimbo do portão de cada correção |
| Esteira do GitHub | conferida no fechamento |
| Revisões com veto registradas e aprovadas | ✅ v2: os sete com a última rodada APROVADO (test-engineer e revisor-geral na 2ª; os outros na 1ª). v3: os sete com a 2ª rodada APROVADO |
| `npm ci` | não foi preciso: o `node_modules` é mais novo que o `package-lock.json` |
| Commits `Fora do processo:` em `origin/develop..HEAD` | nenhum. `d12a9ba0` só mexe em documento (`CLAUDE.md`, `ROADMAP.md`, `docs/decisoes.md`, `mockups/README.md`), sem código |

### 4. Achados

**Críticos**
- C1. `apps/web/src/areas/professor/artefatos/Criados.tsx:184-185` × `apps/web/src/componentes/estado/EstadoVazio.tsx:24,31` ×
  `apps/web/src/componentes/estado/estados.test.tsx:128-129`. **O vazio de Criados não é o do mockup e não faz o que o próprio
  componente diz.** Na foto (`.processo/vitrine/vazia--professora--professor-criados--computador.png` e `--celular.png`), a onça e
  a assinatura ficam no centro da caixa, e o título, o texto e "Ir para Ferramentas" ficam à esquerda. O mockup centraliza o vazio
  inteiro (`mockups/src/components/duo/vazio.tsx:14`). O comentário de `EstadoVazio.tsx:24` diz "no padrão à esquerda", e
  `estados.test.tsx:128-129` diz o mesmo e passa, porque confere a classe do invólucro e não onde a onça é desenhada: a `figure` da
  `Onca` (`Onca.tsx:231`) ocupa a largura toda e centraliza. É o defeito da lista do frontend-reviewer ("o que contradiz
  `docs/interface.md` … ou o mockup que a tarefa cita"), e o teste prova outra coisa (regra 40). O frontend-reviewer, o revisor-geral
  e o conformidade-reviewer apontaram isso nas rodadas 1 e 2 da v3, e o assunto foi para o `TODO.md` como "escolha de desenho".
  **Correção** (a que aproxima do mockup e da 10.2): em `Criados.tsx:184`, `variante="tracejado"`. O tracejado centraliza a onça, o
  título, o texto e a ação, e a ilustração já toma o lugar do ícone. Assim o ramo do `tracejado` de `TopoDoVazio` passa a ter uma tela
  que o usa (era a recomendação do revisor-geral). Depois, um teste que meça na tela, e não na classe: no `professor-criados.spec.ts`
  (vazio), conferir que o centro horizontal da onça e o do título coincidem, com tolerância de poucos px; e acertar o comentário de
  `EstadoVazio.tsx:24` e o caso de `estados.test.tsx:116-133` para o que a peça faz. Se a escolha for manter o vazio padrão à
  esquerda, a onça tem de ir para a esquerda de verdade (por exemplo, `items-start` no invólucro), e o teste tem de medir isso. A
  mutação a declarar: tirar a `variante` de `Criados.tsx`, e o e2e fica vermelho.

**Maiores**
- Nenhum.

**Menores** (o dono é o Orquestrador, que os leva ao `TODO.md` ou ao Joaquim)
- m1. `docs/interface.md:1190` registra Criados "parado", e o mockup anima a onça desse vazio (`<Onca pose="apontando" tamanho={120} />`,
  que entra). É escolha do parecer, sem defeito. Fica anotado para quem comparar com o mockup não ler como esquecimento.
- m2. Na introdução, o mockup do professor usa `pensando` em dois passos (`mockups/src/areas/professor/BemVindo.tsx:261,282`) e o da
  coordenação usa `acolhendo` (vetada) no passo de limites. Os passos da web são outros desde a X4. Era o m4 da rodada 1 e não tem
  destino no `TODO.md`.
- m3. A mão de cada pose (`maoD`, punho ou creme, e o `cy` da pata longa em apontando) ainda está presa só em parte
  (`fidelidade-ao-mockup.test.tsx:131-142` cobre comemorando e pensando). Já está no `TODO.md:2270`.
- m4. Os menores da v2 e da v3 que já estão no `TODO.md:2266-2292` (`esquecerQueAcenou` exportado para teste, o texto do aceno em
  `tasks/prd-pele-e-casca/mockup.md:1369` e `docs/interface.md:1154`, o "ainda" da `dormindo` em `Onca.tsx:10`, a classe nula do grupo
  das linhas, a onça de Criados medir 120) seguem lá. O primeiro item do alinhamento (`TODO.md:2283`) cai com C1.
- m5. "Colégio sintético da vitrine cheia 4abf251d" aparece no texto da introdução da coordenação (foto
  `coordenacao--coordenacao-bem-vindo--celular.png`). É o seed da vitrine, e já está no `TODO.md:2264`.

**Positivos**
- A v2 congelou as poses em **texto literal copiado do original**, e não lendo o `Onca.tsx`. Um teste que copiasse o código de
  produção passaria com qualquer mudança. Esse jeito vale para toda cópia presa a uma fonte externa.
- A v3 passou cada lugar novo pelo `conformidade-reviewer` antes, tirou o que ele vetou apagando um lugar só, e escreveu o critério
  (a onça só assina onde o agente produz o que a região mostra) na 9.7, junto com a lista fechada `TELAS_COM_A_ONCA`, que um teste guarda.

### 5. Conclusão

**REPROVADA**, por um crítico só: o vazio de Criados (R10) é a única peça em que a tela não é a do mockup, e o teste que deveria
segurar o alinhamento passa sem prová-lo. Todo o resto está fechado e conferido no código, na mutação e na foto. Os dois críticos e os
dois maiores da rodada 1 fecharam. O traço das quatro poses e as linhas do aceno são os do mockup, e a esteira que estava vermelha
ficou verde nos casos que falhavam.

Caminho até APROVADA, numa correção curta:
1. `Criados.tsx:184`, `variante="tracejado"` (ou a onça à esquerda de verdade, se o Joaquim preferir o vazio padrão).
2. Um e2e em `professor-criados.spec.ts` que meça o alinhamento da onça com o título na tela, com a mutação declarada.
3. O comentário de `EstadoVazio.tsx:24` e o caso de `estados.test.tsx:116-133` dizendo o que a peça faz.

Na revalidação, eu fotografo o vazio de Criados de novo e rodo a mutação do alinhamento.

### 6. Pendências herdadas

- Medir no Chromebook de referência a rolagem da conversa do Tutor com o avatar novo: `TODO.md:2262` (infra-guardian). Não foi feito
  aqui, porque precisa do aparelho.
- m1 a m5 acima: m2 vai para o `TODO.md` (a próxima spec que mexer nas introduções), e os outros já estão lá ou são só anotação.
- O que a validação deve dizer ao Joaquim sobre "em tudo": a linha do m1 da rodada 1 na seção 2.

---

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
