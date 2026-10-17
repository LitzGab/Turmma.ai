# Correção — o Painel (com a faixa de incidente) e o detalhe do pedido de titular rolam a página a 1366 × 768

**Origem:** `tasks/prd-telas-da-coordenacao/validacao.md` seção 4, Críticos C1 e C2 (validação da X2, REPROVADA; RF23).
**Subagentes obrigatórios:** `frontend-reviewer`, `revisor-geral`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção altera 6 arquivos fora de `tasks/` (Painel.tsx e .test.tsx, DetalheDoPedido.tsx e .test.tsx, incidentes.spec.ts e pedido-do-titular.spec.ts), acima do limite de 5. -->

## Sintoma

A 1366 × 768, a página inteira rola, quando só o miolo deveria (RF23, critério de pronto):

- **C1:** o Painel rola 97 px quando há aviso de incidente adiado (a faixa); sem a faixa, 0. `Painel.tsx` limita só as duas listas (`LISTA_QUE_ROLA`, `clamp(9rem, 100dvh - 40rem, 18rem)`) e não desconta `--faixa-de-incidente`.
- **C2:** o detalhe do pedido (`privacidade/DetalheDoPedido.tsx`) rola 88 px sem a faixa e 186 px com ela, no estado mais curto (pedido "recebido", sem arquivo). A tela é uma `Tela` de leitura sem miolo que rola e está fora de todo `paginaNaoRola`.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

Cada tela da coordenação que não é de rolar a página tem um **miolo** com altura máxima `100dvh − <o que a casca e o cabeçalho gastam> − --faixa-de-incidente` (`miolo-que-rola.ts`). O Painel e o detalhe do pedido nasceram sem ele: o Painel tentou resolver com um teto nas listas, que não desconta a faixa e, a 768 px de altura, já está no piso de 9 rem (a conta `48 rem − 40 rem = 8 rem` é menor que o piso), então não cede o que a faixa toma; o detalhe do pedido não limitava nada. Os dois ficaram fora de `paginaNaoRola`: `incidentes.spec.ts` só media a Analista com a faixa, e o laço do `areas.spec.ts` não passa pelo detalhe.

## Teste que reproduz

- `e2e/incidentes.spec.ts › com o aviso adiado, o Painel, que não tem abas, também mantém a página sem rolar…`
- `e2e/incidentes.spec.ts › com o aviso adiado, o detalhe do pedido de titular também mantém a página sem rolar…`
- `e2e/pedido-do-titular.spec.ts › o prazo diz quantos dias faltam…` (ganhou `paginaNaoRola` no pedido recebido, sem faixa).

Vermelho antes (produto antigo, `chromebook`, 1366 × 768), medido por `paginaNaoRola`:

- detalhe do pedido com a faixa: `Received: 186` (o número da validação);
- detalhe do pedido recebido, sem a faixa: `Received: 88` (idem);
- o Painel com a faixa (97 px na validação): o primeiro run falhou porque a região "O Painel da escola" ainda não existia, e não pela medida; o caso foi reordenado para medir `paginaNaoRola` antes de procurar o miolo, e esse vermelho não foi rodado de novo contra o código antigo. Quem prova o Painel é a mutação 1 abaixo (a mesma `section` sem o miolo).

Verde depois: os dois specs inteiros, `chromebook` e `celular`, 60 de 60.

## Correção

- `Painel.tsx`: o conteúdo do Painel (suspensão, "A IA nesta escola", fila e passos) vai numa `section` de nome "O Painel da escola" com o miolo `O_MIOLO_SEM_ABAS_QUE_ROLA`, o mesmo da Analista: o título do Painel é de 64 px e não tem abas, o cabeçalho que a conta de 13 rem prevê. A partir de 768 px ela recebe foco (`tabIndex 0`), como as outras. As listas mantêm o teto delas.
- `DetalheDoPedido.tsx`: a coluna de dentro da tela, que era um `div` sem papel, vira a `section` "Tudo sobre este pedido" (como o miolo das outras telas: região com nome e `tabIndex 0`; o nome não repete o "O pedido" do cartão de dentro) e ganha `O_MIOLO_QUE_ROLA` (o "‹ Pedidos" e o título com descrição ocupam o lugar do título e das abas, a mesma altura de cabeçalho da lista da turma, 17 rem) e o foco a partir de 768 px; o `tabIndex` que já existia (-1, para o foco de reserva) vira 0 com o miolo, e o `outline-none` só vale sem ele, para o foco do teclado aparecer.
- `e2e/incidentes.spec.ts`: dois casos, o Painel e o detalhe do pedido com a faixa adiada; o do Painel baixa a janela a 600 px para o conteúdo passar do miolo. Nos dois, a partir de 768 px, o miolo leva o foco, mostra o anel (`focoVisivel`) e rola com `End` (`scrollTop > 0`), e a página continua parada.
- `Painel.test.tsx` e `DetalheDoPedido.test.tsx`: o `jsdom` não tem `matchMedia`, que o miolo lê; os dois ganharam o `janelaDe` da Analista, e um caso cada confere o foco do miolo a 1366 px e a ausência dele a 360 px.
- `e2e/pedido-do-titular.spec.ts`: o detalhe do pedido recebido, sem a faixa, passa por `paginaNaoRola`.

## Mutações

```mutacao
arquivo: apps/web/src/areas/coordenacao/Painel.tsx
teste: e2e/incidentes.spec.ts › com o aviso adiado, o Painel
-      <section aria-label="O Painel da escola" {...(comMiolo ? { tabIndex: 0 } : {})} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_SEM_ABAS_QUE_ROLA}`}>
+      <section aria-label="O Painel da escola" {...(comMiolo ? { tabIndex: 0 } : {})} className="flex min-w-0 flex-col gap-4">
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Painel.tsx
teste: e2e/incidentes.spec.ts › com o aviso adiado, o Painel
-      <section aria-label="O Painel da escola" {...(comMiolo ? { tabIndex: 0 } : {})} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_SEM_ABAS_QUE_ROLA}`}>
+      <section aria-label="O Painel da escola" {...(comMiolo ? { tabIndex: -1 } : {})} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_SEM_ABAS_QUE_ROLA}`}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: e2e/incidentes.spec.ts › com o aviso adiado, o detalhe do pedido de titular
-      <section ref={inicio} aria-label="Tudo sobre este pedido" tabIndex={comMiolo ? 0 : -1} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_QUE_ROLA}${comMiolo ? '' : ' outline-none'}`}>
+      <section ref={inicio} aria-label="Tudo sobre este pedido" tabIndex={comMiolo ? 0 : -1} className={`flex min-w-0 flex-col gap-4${comMiolo ? '' : ' outline-none'}`}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: e2e/pedido-do-titular.spec.ts › o prazo diz quantos dias faltam
-      <section ref={inicio} aria-label="Tudo sobre este pedido" tabIndex={comMiolo ? 0 : -1} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_QUE_ROLA}${comMiolo ? '' : ' outline-none'}`}>
+      <section ref={inicio} aria-label="Tudo sobre este pedido" tabIndex={comMiolo ? 0 : -1} className={`flex min-w-0 flex-col gap-4${comMiolo ? '' : ' outline-none'}`}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: e2e/incidentes.spec.ts › com o aviso adiado, o detalhe do pedido de titular
-      <section ref={inicio} aria-label="Tudo sobre este pedido" tabIndex={comMiolo ? 0 : -1} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_QUE_ROLA}${comMiolo ? '' : ' outline-none'}`}>
+      <section ref={inicio} aria-label="Tudo sobre este pedido" tabIndex={-1} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_QUE_ROLA}${comMiolo ? '' : ' outline-none'}`}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/DetalheDoPedido.tsx
teste: e2e/incidentes.spec.ts › com o aviso adiado, o detalhe do pedido de titular
-      <section ref={inicio} aria-label="Tudo sobre este pedido" tabIndex={comMiolo ? 0 : -1} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_QUE_ROLA}${comMiolo ? '' : ' outline-none'}`}>
+      <section ref={inicio} aria-label="Tudo sobre este pedido" tabIndex={comMiolo ? 0 : -1} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_QUE_ROLA} outline-none`}>
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | "Dentro do miolo do Painel ainda existem as duas listas com rolagem própria e `tabIndex 0` (`Painel.tsx:65-69`). Com a janela baixa há rolagem dentro de rolagem, e o teclado para duas vezes. Vale reavaliar no `/retro`, já que o miolo agora resolve a altura." | Muda comportamento e desenho da tela do Painel: vai para o `/retro` da X2 e para `TODO.md` |
| frontend-reviewer (1ª) e revisor-geral (1ª) | "A primeira mutação do Painel … O vermelho contra o código antigo do Painel não foi reproduzido" / "vale rodar uma vez e registrar o número no documento, como foi feito para o detalhe (88 e 186 px)" | Recusada: exige rodar o e2e contra o código antigo, fora do que uma recomendação barata cobre; a mutação 1 (a mesma `section` sem o miolo) é a prova, e o documento já declara a lacuna |
| test-engineer (1ª) | "O detalhe só é medido no estado mais curto. Um estado longo, com o arquivo pronto ou com o compartilhamento preenchido, mostraria que o miolo segura a tela no pior caso" | Pede fixture nova de pedido com arquivo pronto e compartilhamento: `TODO.md` |
| test-engineer (1ª) | "Nos testes de unidade, `className` contendo `overflow-y-auto` é só a string. Quem prova a medida é o e2e… Vale não contar esse trecho como prova." | Nada a mudar no código: o documento já cita o e2e como prova; recusada |
| frontend-reviewer (2ª) | "`Painel.tsx:69`: as listas internas ainda têm `tabIndex 0` e rolagem própria dentro do miolo…" | Já acima: `/retro` da X2 e `TODO.md` (entrada acrescentada) |
| frontend-reviewer (2ª) | "O detalhe do pedido só é medido no estado mais curto. Falta um caso longo, com arquivo pronto e compartilhamento preenchido." | Já acima: `TODO.md` (entrada acrescentada) |
| frontend-reviewer (2ª) | "Falta uma foto do detalhe do pedido na vitrine, e não existe fixture com pedido registrado." | `TODO.md`: pedido de titular na escola cheia da vitrine, tarefa própria (entrada acrescentada) |
| frontend-reviewer (2ª) | "O texto 'Painel não lê, porque cada leitura fica na auditoria' está correto, mas denso para a coordenadora." | Texto de tela fora desta correção: `TODO.md`, para a próxima tarefa que tocar o Painel (entrada acrescentada) |
| revisor-geral (2ª) | "registrar o número uma vez, como foi feito para o detalhe (88 e 186 px), deixaria a prova completa. Não bloqueia." | Recusada, como na 1ª: exige rodar o e2e contra o código antigo; a mutação 1 é a prova |
| test-engineer (2ª) | "No teste de unidade `DetalheDoPedido.test.tsx:106-119`, conferir também que a 1366 px o `className` não contém `outline-none` e que a 360 px contém." | Recusada: o e2e já prova a cláusula, e checar `className` é só a string |
| test-engineer (2ª) | "O truque de apertar `Shift` antes do `focus()` funciona por um comportamento do Chromium… Vale registrar no `/retro`." | `/retro` da X2; os projetos de e2e são só Chromium (`chromebook`, `celular`) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 18:14:23 | 2026-10-17 18:14:59 | `frontend-reviewer` | 1 | APROVADO | a3b1788dd558fc1ec |
| 2026-10-17 18:14:25 | 2026-10-17 18:15:10 | `revisor-geral` | 1 | REPROVADO | a10bb1099c270dc73 |
| 2026-10-17 18:14:27 | 2026-10-17 18:15:37 | `test-engineer` | 1 | REPROVADO | ab4227d3a2b8c93d4 |
| 2026-10-17 18:36:59 | 2026-10-17 18:37:17 | `frontend-reviewer` | 2 | APROVADO | ae897a7521fb91b27 |
| 2026-10-17 18:37:05 | 2026-10-17 18:37:27 | `revisor-geral` | 2 | APROVADO | a8a37b80367be2f2e |
| 2026-10-17 18:37:11 | 2026-10-17 18:37:48 | `test-engineer` | 2 | APROVADO | ada29426fd1adb2e3 |
