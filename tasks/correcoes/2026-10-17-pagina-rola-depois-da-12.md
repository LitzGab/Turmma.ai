# Correção — a página da Analista rola inteira a 1366 × 768 em vez de só o miolo

**Origem:** `e2e/areas.spec.ts:316` (W2, `chromebook`) vermelho na máquina do Joaquim, isolado e sempre; pedido do Orquestrador em 17/10/2026. A esteira `38999161158` (`c325472`) tem os 6 shards de e2e verdes.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em dois arquivos fora de `tasks/` (a tela e o teste dela), abaixo do limite de 5, e fora de `.github/`, `tools/ci/` e `tools/processo/`. -->

## Sintoma

O W2 da coordenação (`a coordenação abre no Painel, vê Painel, Analista, Escola e Registros…`) cai em `paginaNaoRola`, na tela **Analista**:

```
a página inteira rola a partir de 768 px: só o miolo deveria
Expected: <= 0
Received:    10
```

A página mede 778 px contra os 768 px da janela: o `main` fecha em 778 (o conteúdo da Analista termina em 746 e o `main` tem 32 px de margem de baixo).

## Fora desta correção

Nada: nenhuma tarefa em curso na árvore (`git status` limpo).

## Causa

**Não é a tarefa 12.0.** O primeiro palpite (o `relative` que a 12.0 pôs no `tr` e no `li` de `Tabela.tsx`) não se sustenta: a Analista não usa `Tabela`, e com o `apps/web` de `f279dde` (antes da 12.0) o mesmo teste falha igual na máquina, com os mesmos 10 px.

A causa é de layout. A Analista é uma `Tela` solta: o cabeçalho, o cartão da assinatura, o aviso, o resumo (ou o vazio) e o dado nominal são filhos diretos da coluna, sem um miolo que rola. A altura da página é a do conteúdo, e **ela só cabe nos 768 px pela métrica de fonte da máquina que a mede**: na fonte da esteira o conteúdo termina uns pixels antes da base; na fonte do sistema da máquina local, 10 px depois. É a mesma tela, com o mesmo dado, e uma fonte que muda a altura de uma linha basta para a página rolar. As telas de Escola e Registros não sofrem disso porque o painel da aba é o miolo (`O_MIOLO_QUE_ROLA`: `md:max-h-[calc(100dvh-17rem)] md:overflow-y-auto`), e a página tem sempre a altura da janela, qualquer que seja a fonte (RF23; Tech Spec da X2, seção 9, "Altura").

A Analista ficou de fora do padrão porque o RF23 e o comentário do teste falam de Escola e Registros, mas o laço do W2 mede `paginaNaoRola` em **todas** as telas da coordenação, e uma tela com conteúdo que cresce (o resumo com vários alertas e recortes) rolaria a página inteira com qualquer fonte.

## Teste que reproduz

- `apps/web/src/areas/coordenacao/Analista.test.tsx › o miolo da tela › …`: o conteúdo da Analista (assinatura, vazio ou resumo, dado nominal) está dentro de uma região que rola só a partir de 768 px (`md:overflow-y-auto`, `md:max-h-[calc(100dvh-…)]`, `md:relative`, nenhuma classe de altura sem o prefixo `md:`), com o `h1` fora dela; a 1366 px a região recebe foco (`tabindex="0"`), e a 360 px não, porque ali rola a página. **Vermelho antes:** a tela não tem a região.
- A prova do efeito é o W2 em `e2e/areas.spec.ts:316`, **sem alteração**: vermelho antes na máquina (10 px), verde depois. Na esteira ele já passava, e continua passando.

## Correção

O conteúdo da Analista (assinatura, aviso, resumo ou vazio e dado nominal) passa a ficar numa `section` de nome "Resumo do Analista", o **miolo**, e o título e o botão "Gerar resumo" ficam parados em cima:

- **`apps/web/src/areas/coordenacao/miolo-que-rola.ts`**: a constante nova `O_MIOLO_SEM_ABAS_QUE_ROLA` (`md:relative md:max-h-[calc(100dvh-13rem)] md:overflow-y-auto`). É a `O_MIOLO_QUE_ROLA` com a conta de uma tela sem abas: o miolo começa a 164 px do alto, e não a 226. Com os 17 rem das molduras ele terminaria 100 px acima da base, com a página em branco embaixo; com 13 rem termina a 12 px dela, a mesma folga. A página passa a ter a altura da janela (`min-h-screen` da casca contra um miolo de altura máxima), e a altura do conteúdo deixa de decidir se ela rola.
- **`Analista.tsx`**: a `section` do miolo, com `tabindex="0"` só a partir de 768 px (`useMidia(A_PARTIR_DE_768)`, como a lista da turma): rolar pelo teclado, e abaixo disso rola a página e não há o que focar.
- **`Analista.test.tsx`**: o caso novo, e o `matchMedia` de 1366 px que a tela agora lê (o `jsdom` não o tem).

**O W2 não mudou**: continua medindo `paginaNaoRola` em todas as telas da coordenação. Com a correção, `areas.spec.ts` e `analista.spec.ts` passam (44 casos, `chromebook` e `celular`), contra o vermelho de 10 px de antes. O `Painel` não tem o problema hoje (0 px) e não foi tocado: é tela de números de altura fixa, e o pedido é só da Analista.

## Mutações

Cada bloco tira uma cláusula do miolo e o teste do miolo da Analista tem de ficar vermelho: sem `md:overflow-y-auto`, sem `md:relative`, sem o `max-h`, sem o `tabindex` (nunca e sempre), sem o nome da região, o dado nominal fora do miolo (1ª ordem da Mesa, item 1) e o estado vazio fora dele (item 2).

```mutacao
arquivo: apps/web/src/areas/coordenacao/miolo-que-rola.ts
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › só o miolo rola a partir de 768 px
- export const O_MIOLO_SEM_ABAS_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-13rem)] md:overflow-y-auto'
+ export const O_MIOLO_SEM_ABAS_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-13rem)]'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/miolo-que-rola.ts
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › só o miolo rola a partir de 768 px
- export const O_MIOLO_SEM_ABAS_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-13rem)] md:overflow-y-auto'
+ export const O_MIOLO_SEM_ABAS_QUE_ROLA = 'md:max-h-[calc(100dvh-13rem)] md:overflow-y-auto'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/miolo-que-rola.ts
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › só o miolo rola a partir de 768 px
- export const O_MIOLO_SEM_ABAS_QUE_ROLA = 'md:relative md:max-h-[calc(100dvh-13rem)] md:overflow-y-auto'
+ export const O_MIOLO_SEM_ABAS_QUE_ROLA = 'md:relative md:overflow-y-auto'
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › só o miolo rola a partir de 768 px
-       <section aria-label="Resumo do Analista" {...(comMiolo ? { tabIndex: 0 } : {})} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_SEM_ABAS_QUE_ROLA}`}>
+       <section aria-label="Resumo do Analista" className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_SEM_ABAS_QUE_ROLA}`}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › só o miolo rola a partir de 768 px
-       <section aria-label="Resumo do Analista" {...(comMiolo ? { tabIndex: 0 } : {})} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_SEM_ABAS_QUE_ROLA}`}>
+       <section aria-label="Resumo do Analista" {...{ tabIndex: 0 }} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_SEM_ABAS_QUE_ROLA}`}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › só o miolo rola a partir de 768 px
-       <section aria-label="Resumo do Analista" {...(comMiolo ? { tabIndex: 0 } : {})} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_SEM_ABAS_QUE_ROLA}`}>
+       <section {...(comMiolo ? { tabIndex: 0 } : {})} className={`flex min-w-0 flex-col gap-4 ${O_MIOLO_SEM_ABAS_QUE_ROLA}`}>
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › só o miolo rola a partir de 768 px
- <DadoNominal />
- </section>
+ </section>
+ <DadoNominal />
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Analista.tsx
teste: apps/web/src/areas/coordenacao/Analista.test.tsx › o estado vazio também fica dentro do miolo
- {resumo.data !== undefined &&
+ </section><section>{resumo.data !== undefined &&
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª), test-engineer (1ª, item 5) | A 1366 × 768 o miolo corta o botão "Abrir dado nominal de uma turma" ao meio na base e nada diz que ali rola; avaliar uma sombra de continuação no rodapé do miolo, nas três telas ao mesmo tempo | `TODO.md` (uma linha), spec própria: mexe em Escola e Registros, que a correção não toca, e muda a aparência |
| frontend-reviewer (1ª), test-engineer (1ª, item 3) | O `13rem` depende da altura do cabeçalho do `Tela`, e nenhum teste prende o valor (o W2 prende só o teto) | Recusada: o W2 (`e2e/areas.spec.ts`, `paginaNaoRola`) vermelho pega o valor baixo, e o valor alto é só uma faixa em branco; o motivo dos 13 rem já está no comentário da constante |
| test-engineer (1ª, item 4) | O comentário de `e2e/areas.spec.ts:347-348` ainda diz que `paginaNaoRola` mede "Escola e Registros" | `TODO.md` (uma linha): o arquivo está fora desta correção e mexer nele caduca o e2e; a próxima tarefa que tocar `e2e/areas.spec.ts` corrige o texto |
| frontend-reviewer (1ª) | A barra de baixo fixa aparece no meio da foto do celular | Não é defeito: efeito da captura de página inteira; a 360 px a tela não muda (todas as classes novas levam `md:`) |
| test-engineer (2ª) | O caso do vazio podia conferir também `tabindex="0"` a 1366 px | Recusada: o atributo não depende do estado da tela e o caso com resumo já o prende (o próprio revisor diz que é só cobertura extra) |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 01:56:50 | 2026-10-17 01:57:20 | `frontend-reviewer` | 1 | APROVADO | afa2f0ef2373f2dd9 |
| 2026-10-17 01:56:53 | 2026-10-17 01:58:00 | `test-engineer` | 1 | APROVADO | a66dd6a33027cb763 |
| 2026-10-17 02:01:36 | 2026-10-17 02:02:26 | `test-engineer` | 2 | APROVADO | a25d6ffcf75e1b079 |
