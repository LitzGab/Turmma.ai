# Correção — o link "Lista de nomes" da Estrutura mede 41 px a 360 px, e o alvo de toque mínimo é 44

**Origem:** esteira `39005178313`, em `77f80e6` (tarefa 5.0): `e2e/estrutura.spec.ts:765` (W12, `chromebook` e `celular`) vermelho; pedido do Orquestrador em 17/10/2026.
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção mexe em dois arquivos fora de `tasks/` (a tela e o teste dela), abaixo do limite de 5, e fora de `.github/`, `tools/ci/` e `tools/processo/`. -->

## Sintoma

O W12 da Estrutura (`a Estrutura a 360 px e só com teclado`) cai em `alvoDeToque` (`estrutura.spec.ts:72`, chamado em `:795`), no alvo `Lista de nomes`:

```
expect(received).toBeGreaterThanOrEqual(expected)
Expected: >= 44
```

O link da linha mede 41 px de altura (`ALVO_DE_TOQUE_PRINCIPAL_PX` é 44).

## Fora desta correção

Nada: nenhuma tarefa em curso na árvore (`git status` limpo).

## Causa

**É da tarefa 5.0.** `CLASSES_DO_LINK_DA_LINHA` (`Estrutura.tsx`) dá ao link da primeira célula o texto em negrito e o `::after` que o estende pela linha, mas nenhuma altura mínima: o `<a>` é `inline`, e o `boundingBox` dele é a caixa da linha de texto (41 px com a fonte e a `line-height` do `t-cartao` na esteira), e não a da linha do cartão que o `::after` cobre. O teste mede o elemento do link, como o dedo de quem toca o texto; a linha inteira ser clicável não faz o link ter 44 px.

O mesmo desenho já está resolvido na tela vizinha: o link da primeira célula de `Professores.tsx` (`inline-flex min-h-11 max-w-full items-center gap-1 …`). A 5.0 copiou o `after:` e não o `min-h-11`.

## Teste que reproduz

- `apps/web/src/areas/coordenacao/Estrutura.test.tsx › o link da linha é um alvo de toque de 44 px, na tabela e na lista de 360 px`: o link "Lista de nomes da turma <nome>" tem `min-h-11`, `items-center` e `wrap-anywhere`, com `inline-flex` (sem `inline-flex` o `min-h-11` não vale num `<a>` inline), na tabela (1366 px) e no cartão (360 px). O jsdom não mede altura: as classes são a aproximação, e **a medida é a do W12**, `e2e/estrutura.spec.ts:765`, **sem alteração**. **Vermelho antes:** o link não tem as classes (e o W12 deu 41 px na esteira).

## Correção

`CLASSES_DO_LINK_DA_LINHA` ganha `inline-flex min-h-11 max-w-full min-w-0 items-center` e `wrap-anywhere`, como o link de `Professores.tsx`. O `wrap-anywhere` é necessário: o texto de um `inline-flex` é um item flex anônimo, que não quebra um nome comprido e sem espaço, e o primeiro teste desta correção no W12 a 360 px (nome de 29 letras) mediu 13 px de rolagem horizontal sem ele. O `::after` continua cobrindo a linha. Nenhum outro arquivo da tela muda, e o W12 não muda.

## Mutações

Cada bloco tira uma das classes que dão os 44 px ao link, e o teste do alvo tem de ficar vermelho.

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › o link da linha é um alvo de toque de 44 px
- "inline-flex min-h-11 max-w-full min-w-0 items-center font-semibold wrap-anywhere text-tinta after:absolute
+ "inline-flex max-w-full min-w-0 items-center font-semibold wrap-anywhere text-tinta after:absolute
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › o link da linha é um alvo de toque de 44 px
- "inline-flex min-h-11 max-w-full min-w-0 items-center font-semibold wrap-anywhere text-tinta after:absolute
+ "inline-flex min-h-11 max-w-full min-w-0 font-semibold wrap-anywhere text-tinta after:absolute
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › o link da linha é um alvo de toque de 44 px
- "inline-flex min-h-11 max-w-full min-w-0 items-center font-semibold wrap-anywhere text-tinta after:absolute
+ "min-h-11 max-w-full min-w-0 items-center font-semibold wrap-anywhere text-tinta after:absolute
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/Estrutura.tsx
teste: apps/web/src/areas/coordenacao/Estrutura.test.tsx › o link da linha é um alvo de toque de 44 px
- "inline-flex min-h-11 max-w-full min-w-0 items-center font-semibold wrap-anywhere text-tinta after:absolute
+ "inline-flex min-h-11 max-w-full min-w-0 items-center font-semibold text-tinta after:absolute
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | `Estrutura.tsx:87`: `max-w-full` e `min-w-0` sem bloco de mutação nem asserção; tirar as duas ou declarar o papel de cada uma e escrever um bloco para cada | Recusada: tirar classe muda o layout que o W12 já mediu verde com elas, e o revisor mesmo diz que nenhuma regra depende delas neste layout. Mesma família de classes do link de `Professores.tsx`. Sem comportamento novo a provar |
| test-engineer (1ª) | O W12 não roda no portão da tarefa (o `e2e/estrutura.spec.ts` não mudou); conferir o W12 verde nos dois projetos na esteira seguinte antes de fechar a correção | Vai ao Orquestrador no relatório: ele lê o veredito da esteira |
| frontend-reviewer (1ª) | `after:absolute` depende de a célula ou o cartão ser `relative` | Sem ação: o teste da linha 290 já cobre, como o revisor diz |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 10:31:27 | 2026-10-17 10:31:45 | `frontend-reviewer` | 1 | APROVADO | acc85b4a53f856970 |
| 2026-10-17 10:31:28 | 2026-10-17 10:32:25 | `test-engineer` | 1 | APROVADO | ae698f3e0ab8e1890 |
