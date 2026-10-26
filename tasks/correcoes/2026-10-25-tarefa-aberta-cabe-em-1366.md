# Correção — a tarefa aberta (`/aluno/atividades/<id>`) não cabe em 1366 × 768, e a barra presa cobre "Enviar a atividade" e o ponto de parada

**Origem:** `tasks/prd-telas-do-aluno-e-primeiro-acesso/validacao.md` (2ª rodada, §4, achado C2)
**Subagentes obrigatórios:** `frontend-reviewer`, `test-engineer`, `conformidade-reviewer`, `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
<!-- test-engineer é obrigatório em toda correção. `revisor-geral`: marcar aqui se a correção passar de 5 arquivos fora de tasks/. -->

## Sintoma

A validação abriu a tarefa "Para fazer" com uma questão de 4 alternativas a 1366 × 768: a página tem 871 px, e a barra presa "Anterior / Próxima" (y ≈ 695 a 768) cobre a metade de baixo de "Pedir ajuda ao Tutor nesta questão" e de "Enviar a atividade" (y 665 a 709). O texto do ponto de parada ("Pode parar quando quiser…") só aparece depois de rolar. A forma corrigida ("Seu resultado", 4 questões) tem 1194 px. O RF20 pede que a tela caiba na janela do Chromebook, e o `docs/interface.md` (11) diz que a tela de trabalho cabe na janela e rola por dentro.

## Fora desta correção

Nada. Sem tarefa em curso na árvore.

## Causa

A 6.1 pedia "a barra presa embaixo **no celular**", mas o `BarraPresa` de `Atividade.tsx` ficou presa (`sticky`) em toda largura, e essa diferença não foi registrada. Na janela larga ela é o último de três blocos empilhados (ações, ponto de parada, barra), e a soma passa de 768 px: a barra, presa no pé da janela, cobre o bloco de cima. O ponto de parada escondido toca a D59 (regra 70, item 4b: "esconder o ponto de parada"). Quanto à forma corrigida, a lista "Questão por questão" cresce com a atividade e não tinha limite de altura. A rodada 1 não viu nada disso porque não fotografou a tarefa aberta (a vitrine não tem tarefa "Para fazer", M5), e nenhum e2e media a tarefa aberta no `chromebook`.

## Teste que reproduz

`e2e/aluno-atividade.spec.ts › a tarefa aberta na janela do aluno (RF20)`, dois casos, nos dois projetos (a medida de altura vale na janela de 1024 px ou mais; no celular o caso confere que a barra continua presa embaixo e que a lista não vira segunda rolagem):

- `"Para fazer", na questão de enunciado mais longo, cabe em 1366 × 768: "Enviar a atividade" e o ponto de parada à vista, sem nada por cima`
- `corrigida, com quatro questões, cabe em 1366 × 768: o resumo e a lista em duas colunas, a lista rola por dentro, com foco, e o resto fica à vista`

Mais dois casos de unidade em `apps/web/src/areas/aluno/Atividade.test.tsx` (a linha única e o foco da lista, só as classes: o jsdom não calcula CSS) e o stub de `matchMedia`, que a tela passou a usar.

- Antes (código da validação, `77e6a060`..`fb8f28a2`): vermelho. O "Para fazer" com a questão 2 das sintéticas tinha 833 px a 1366 × 768 e a barra presa (`position: sticky`) em y 721; a corrigida com quatro questões, 1174 px.
- Depois: verde nos dois projetos (`aluno-atividade.spec.ts`, 24 casos). "Para fazer": o conteúdo termina em y ≈ 720 (`scrollHeight` ≤ 768), "Enviar a atividade", "Anterior", "Próxima", o ponto de parada e "Pedir ajuda ao Tutor" à vista (`ratio: 1`) e sem nada por cima (`elementFromPoint` no centro e na borda de baixo). Corrigida: ≤ 768, a lista rola por dentro (`scrollHeight > clientHeight`) e tem `tabindex="0"`.
- Fotografei as duas formas a 1366 × 768 e a 360 px e li cada arquivo.

**Duas armadilhas da medida, achadas no caminho.** (1) O `scrollHeight` da página não caiu quando limitei a altura da lista (1174 px, com a lista em 192): o `sr-only` do chip de fonte é `absolute`, e só um ancestral posicionado o recorta. Por isso a lista leva `relative`. (2) A questão que o caso usa tem de ser a 2 das sintéticas, e não uma inventada mais comprida: a medida é a do critério da validação.

## Correção

Mudaram `apps/web`, o e2e e este documento (`Atividade.tsx`, `BarraPresa.tsx`, `midia.ts`, `Atividade.test.tsx`, `aluno-atividade.spec.ts`):

- **`Atividade.tsx`, "Para fazer": uma linha só a partir de 768 px.** "Enviar a atividade", o ponto de parada e "Anterior" e "Próxima" ficam na mesma linha (`md:flex md:flex-wrap`), e a barra deixa de ser presa a partir de 768 px (`md:static`, pela prop nova `className` do `BarraPresa`; o `md:flex-1` do ponto de parada é que a empurra para a direita): presa, ela cobria "Enviar a atividade" e o ponto de parada. No celular nada muda: continua presa embaixo, como a 6.1 pedia (`contents` faz os três blocos filhos da coluna, como antes). O ponto de parada ocupa o vão entre "Enviar" e a navegação (`md:flex-1`) e fica sempre à vista (D59).
- **`Atividade.tsx`: "Pedir ajuda ao Tutor nesta questão" passa para o cartão da questão**, na linha do estado da resposta. A linha de ações com ele dentro tem 901 px e a coluna da leitura 880 (`docs/interface.md` 9.3): não cabia, e a barra voltava para uma segunda linha. A ajuda é desta questão, e no cartão dela fica mais perto do que ela pede. **Isto muda também o celular**: ali o link passa a vir logo abaixo do estado da resposta, dentro do cartão, e "Enviar a atividade" fica sozinha na linha de baixo. Em avaliação o link continua não existindo.
- **`Atividade.tsx`, corrigida: o resultado em duas colunas a partir de 1024 px** (o resumo, as habilidades e quem aprovou à esquerda; "Questão por questão" à direita) e **a lista rola por dentro** (`lg:max-h-[clamp(9rem,calc(100dvh_-_30rem),24rem)] lg:overflow-y-auto`), com `relative` (o recorte do `sr-only` do chip) e, só quando rola, `role="group"` com nome próprio ("Questões corrigidas": o da seção é o do título) e `tabIndex={0}` (`useMidia(A_PARTIR_DE_1024)`, constante nova em `midia.ts`). Abaixo de 1024 px é uma coluna e rola a página, como antes. Duas colunas era o que faltava: só a lista rolando deixava 894 px.
- **`BarraPresa.tsx`: prop `className`** (opcional, sem efeito onde não é passada). As outras três barras (Tutor, Conversa, Aprovar) não a passam.
- **O que o "cabe" prova.** O RF20 vale para a tarefa aberta com uma questão de quatro alternativas e enunciado de uma a duas linhas, e para o resultado com quatro questões e duas habilidades, no tamanho de letra Padrão, a 1366 × 768. Com enunciado de muitas linhas, ou mais habilidades, a página volta a rolar, o que o PRD aceita (o miolo rola, `docs/interface.md` 11); com a letra Maior vale o RF11. A forma corrigida segue o caminho (a) do achado: o resultado cabe, e a lista é que rola. **A Tech Spec §12b não muda**, porque o critério do RF20 é o mesmo.

## Mutações

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: e2e/aluno-atividade.spec.ts › "Para fazer", na questão de enunciado mais longo, cabe em 1366 × 768: "Enviar a atividade" e o ponto de parada à vista, sem nada por cima
-      <div className="contents md:flex md:flex-wrap md:items-center md:gap-x-4 md:gap-y-3">
+      <div className="contents md:items-center md:gap-x-4 md:gap-y-3">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: e2e/aluno-atividade.spec.ts › "Para fazer", na questão de enunciado mais longo, cabe em 1366 × 768: "Enviar a atividade" e o ponto de parada à vista, sem nada por cima
-        <BarraPresa rotulo="Trocar de questão" className="md:static md:border-t-0 md:py-0">
+        <BarraPresa rotulo="Trocar de questão" className="md:border-t-0 md:py-0">
```

```mutacao
arquivo: apps/web/src/componentes/ui/BarraPresa.tsx
teste: e2e/aluno-atividade.spec.ts › "Para fazer", na questão de enunciado mais longo, cabe em 1366 × 768: "Enviar a atividade" e o ponto de parada à vista, sem nada por cima
-    <div ref={barra} role="group" aria-label={rotulo} data-barra-presa="" className={`sticky bottom-[var(--barra-baixo,0px)] z-10 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-fundo py-3 ${semLinha ? '' : 'border-t-2 border-borda'} ${className}`.trimEnd()}>
+    <div ref={barra} role="group" aria-label={rotulo} data-barra-presa="" className={`sticky bottom-[var(--barra-baixo,0px)] z-10 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-3 bg-fundo py-3 ${semLinha ? '' : 'border-t-2 border-borda'}`.trimEnd()}>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › "Enviar a atividade", o ponto de parada e a navegação são uma linha só em janela larga; a barra presa embaixo é do celular
-        <p className="text-sm text-sutil md:min-w-56 md:flex-1">Pode parar quando quiser. O que você respondeu fica guardado, e dá para continuar depois.</p>
+        <p className="text-sm text-sutil ">Pode parar quando quiser. O que você respondeu fica guardado, e dá para continuar depois.</p>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › "Enviar a atividade", o ponto de parada e a navegação são uma linha só em janela larga; a barra presa embaixo é do celular
-        <BarraPresa rotulo="Trocar de questão" className="md:static md:border-t-0 md:py-0">
+        <BarraPresa rotulo="Trocar de questão" className="md:static md:py-0">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › "Enviar a atividade", o ponto de parada e a navegação são uma linha só em janela larga; a barra presa embaixo é do celular
-        <div className="flex min-w-0 justify-end border-t border-linha pt-4 md:justify-start md:border-t-0 md:pt-0">
+        <div className="flex min-w-0 justify-end border-t border-linha pt-4 md:border-t-0 md:pt-0">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › "Enviar a atividade", o ponto de parada e a navegação são uma linha só em janela larga; a barra presa embaixo é do celular
-        <div className="flex min-w-0 justify-end border-t border-linha pt-4 md:justify-start md:border-t-0 md:pt-0">
+        <div className="flex min-w-0 justify-end border-t border-linha pt-4 md:justify-start md:pt-0">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › "Enviar a atividade", o ponto de parada e a navegação são uma linha só em janela larga; a barra presa embaixo é do celular
-        <div className="flex min-w-0 justify-end border-t border-linha pt-4 md:justify-start md:border-t-0 md:pt-0">
+        <div className="flex min-w-0 justify-end border-t border-linha pt-4 md:justify-start md:border-t-0">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: e2e/aluno-atividade.spec.ts › a 360 px: sem rolagem lateral, "Próxima" com 44 px e à vista na barra presa, e a comemoração cabe
projeto: celular
-      <div className="contents md:flex md:flex-wrap md:items-center md:gap-x-4 md:gap-y-3">
+      <div className="md:flex md:flex-wrap md:items-center md:gap-x-4 md:gap-y-3">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: e2e/aluno-atividade.spec.ts › corrigida, com quatro questões, cabe em 1366 × 768: o resumo e a lista em duas colunas, a lista rola por dentro, com foco, e o resto fica à vista
-const LISTA_QUE_ROLA = 'relative lg:max-h-[clamp(9rem,calc(100dvh_-_30rem),24rem)] lg:overflow-y-auto'
+const LISTA_QUE_ROLA = 'lg:max-h-[clamp(9rem,calc(100dvh_-_30rem),24rem)] lg:overflow-y-auto'
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: e2e/aluno-atividade.spec.ts › corrigida, com quatro questões, cabe em 1366 × 768: o resumo e a lista em duas colunas, a lista rola por dentro, com foco, e o resto fica à vista
-const LISTA_QUE_ROLA = 'relative lg:max-h-[clamp(9rem,calc(100dvh_-_30rem),24rem)] lg:overflow-y-auto'
+const LISTA_QUE_ROLA = 'relative lg:overflow-y-auto'
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: e2e/aluno-atividade.spec.ts › corrigida, com quatro questões, cabe em 1366 × 768: o resumo e a lista em duas colunas, a lista rola por dentro, com foco, e o resto fica à vista
-const LISTA_QUE_ROLA = 'relative lg:max-h-[clamp(9rem,calc(100dvh_-_30rem),24rem)] lg:overflow-y-auto'
+const LISTA_QUE_ROLA = 'relative lg:max-h-[clamp(9rem,calc(100dvh_-_30rem),24rem)]'
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: e2e/aluno-atividade.spec.ts › corrigida, com quatro questões, cabe em 1366 × 768: o resumo e a lista em duas colunas, a lista rola por dentro, com foco, e o resto fica à vista
-      <div className="flex min-w-0 flex-col gap-4 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-6">
+      <div className="flex min-w-0 flex-col gap-4 lg:items-start lg:gap-x-6">
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: e2e/aluno-atividade.spec.ts › corrigida, com quatro questões, cabe em 1366 × 768: o resumo e a lista em duas colunas, a lista rola por dentro, com foco, e o resto fica à vista
-          <div {...(listaRola ? { role: 'group', 'aria-label': 'Questões corrigidas', tabIndex: 0 } : {})} className={`min-w-0 ${LISTA_QUE_ROLA}`}>
+          <div className={`min-w-0 ${LISTA_QUE_ROLA}`}>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › a lista "Questão por questão" rola por dentro e ganha foco só a partir de 1024 px; abaixo disso a página é que rola
-          <div {...(listaRola ? { role: 'group', 'aria-label': 'Questões corrigidas', tabIndex: 0 } : {})} className={`min-w-0 ${LISTA_QUE_ROLA}`}>
+          <div {...(listaRola ? { role: 'group', tabIndex: 0 } : {})} className={`min-w-0 ${LISTA_QUE_ROLA}`}>
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: apps/web/src/areas/aluno/Atividade.test.tsx › a lista "Questão por questão" rola por dentro e ganha foco só a partir de 1024 px; abaixo disso a página é que rola
-  const listaRola = useMidia(A_PARTIR_DE_1024)
+  const listaRola = true
```

```mutacao
arquivo: apps/web/src/areas/aluno/Atividade.tsx
teste: e2e/aluno-atividade.spec.ts › a avaliação avisa que o Tutor fica pausado e não oferece o caminho até ele; a que a professora encerra para de receber resposta
-          {!prova.avaliativa && (
+          {true && (
```

As demais linhas que o `mutacoes.ts --faltando` lista (o estado da resposta, o resultado por habilidade e por questão) são código que já existia e só mudou de indentação, ao entrar no cartão e na coluna: a regra delas não mudou e já tem os casos de antes.

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Degradê ou sombra no pé da lista que rola, para mostrar que há mais questões | `TODO.md`: é visual novo, que a validação pode pedir; não muda a regra do RF20 |
| frontend-reviewer (1ª) | Foto em 800 px (entre 768 e 1023 px a linha quebra e a barra deixa de ser presa) | Validação: a vitrine não alcança a tarefa aberta (M5), e a foto entra com ela |
| frontend-reviewer (1ª) | Manter o caso do e2e de "cabe" no portão do `chromebook` | Já atendido: o caso está no spec e roda nos dois projetos |
| infra-guardian (1ª) | Trocar o nome da prop `className` do `BarraPresa` por um específico (`soltaApartirDe`) | Recusada: `className` opcional, sem efeito onde não é passada, é o padrão dos componentes `ui/`, e há um único uso; reabre se aparecer um segundo que sobrescreva o `sticky` |
| infra-guardian (1ª), conformidade-reviewer (1ª), test-engineer (1ª) | Fotografar de novo a tarefa aberta e a corrigida com quatro questões, pois a vitrine não tem tarefa "Para fazer" (M5) | Validação: o Validador fotografa cada requisito com tela; a medida do código de agora é o e2e, que roda nos dois projetos |
| conformidade-reviewer (1ª) | No celular (360 px) o ponto de parada fica no fim da página e só aparece depois de rolar (D59, regra 70 item 4b); deixá-lo à vista também ali, ou registrar por que o fim da página basta | Validação, via Orquestrador: não é regressão (é a 6.1 de antes), e à vista no celular muda o comportamento da barra presa |
| conformidade-reviewer (1ª) | O seed da vitrine mostra "respondeu 0 de 4" com "acertou 3 de 4" e todas as questões "em branco" | `TODO.md`, junto da M5 da validação: é `tools/vitrine/escola.ts`, que esta correção não toca |
| test-engineer (1ª) | Com a letra Maior a 1366 × 768 a página volta a rolar (RF11); nenhum caso prova que "Enviar" e o ponto de parada continuam alcançáveis | Validação: o documento já declara o limite (RF11) |
| frontend-reviewer (2ª) | `Atividade.tsx:303`: o comentário novo acima de `listaRola` ficou numa linha só, bem comprida; quebrar em duas | Não aplicar agora: é só comentário, e só o `revisor-geral` (que não é obrigatório aqui) o revisaria; quem tocar o `Diagnostico` na validação ou na próxima tarefa de `Atividade.tsx` quebra a linha |
| test-engineer (2ª) | `e2e/aluno-atividade.spec.ts:656`: prender o localizador à seção, com `resultado.getByRole('region', { name: 'Questão por questão' }).locator('ol').locator('xpath=..')`, para um segundo `ol` no resumo não mudar o elemento medido | Não aplicar agora: hoje o `ol` é único em "Seu resultado" (o revisor conferiu) e o caso passa; a tarefa futura que tocar o resumo do resultado ajusta o localizador |
| conformidade-reviewer (2ª), frontend-reviewer (2ª), privacy-guardian (2ª) | O seed da vitrine mostra "respondeu 0 de 4" com "acertou 3 de 4" e as quatro questões "em branco" | `TODO.md`, junto da M5 da validação: é `tools/vitrine/escola.ts`, que esta correção não toca (mesmo destino da rodada 1). A linha no `TODO.md` é do Orquestrador: este commit leva só os arquivos da correção |
| conformidade-reviewer (2ª), test-engineer (2ª), infra-guardian (2ª) | Seguem o destino da rodada 1: ponto de parada no celular, fotos da tarefa aberta e da corrigida com quatro questões (M5), letra Maior a 1366 × 768, renome da prop `className` | Sem fato novo; o destino de cada uma é o que esta tabela já registra |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-25 23:35:46 | 2026-10-25 23:36:00 | `tenancy-guardian` | 1 | APROVADO | aa648774ba97cbfcc |
| 2026-10-25 23:35:53 | 2026-10-25 23:36:10 | `infra-guardian` | 1 | APROVADO | a8b28d16a6ae9c8ee |
| 2026-10-25 23:36:03 | 2026-10-25 23:36:19 | `privacy-guardian` | 1 | APROVADO | a613a4d439baed239 |
| 2026-10-25 23:35:55 | 2026-10-25 23:36:21 | `conformidade-reviewer` | 1 | APROVADO | a28a74c0acb9b8dd2 |
| 2026-10-25 23:35:40 | 2026-10-25 23:36:22 | `frontend-reviewer` | 1 | APROVADO | a327cffb24ac97bf2 |
| 2026-10-25 23:35:39 | 2026-10-25 23:36:48 | `test-engineer` | 1 | APROVADO | a90b8870bd2b2c4e9 |
| 2026-10-25 23:55:40 | 2026-10-25 23:55:52 | `frontend-reviewer` | 2 | APROVADO | a01adb88f21cc6c03 |
| 2026-10-25 23:55:53 | 2026-10-25 23:56:07 | `tenancy-guardian` | 2 | APROVADO | a39d7a0231894a7fd |
| 2026-10-25 23:56:04 | 2026-10-25 23:56:18 | `infra-guardian` | 2 | APROVADO | a734c61d347b7b00c |
| 2026-10-25 23:55:58 | 2026-10-25 23:56:18 | `privacy-guardian` | 2 | APROVADO | ace3e7f0e771d433c |
| 2026-10-25 23:55:47 | 2026-10-25 23:56:19 | `conformidade-reviewer` | 2 | APROVADO | ad57d40e323861a6e |
| 2026-10-25 23:55:39 | 2026-10-25 23:56:22 | `test-engineer` | 2 | APROVADO | a5fd02b3fd09c34a8 |
