# Correção — a auditoria de alvo de toque reprova um controle que a barra de topo cobre no meio da rolagem, e o pedido atribuía isso à barra de baixo

**Origem:** pedido do Orquestrador em 16/10/2026 (`e2e/a2-assistente.spec.ts:140` e `e2e/pedidos.spec.ts:495`, vermelhos só no projeto `celular`, com a regra `target-size` do axe; caem isolados).
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. A correção altera 2 arquivos fora de `tasks/`: abaixo do limite do `revisor-geral`. -->

## Sintoma

No celular (360 × 800), a asserção `expect(await violacoesGraves(page)).toEqual([])` reprova com `target-size` (`serious`):

- `a2-assistente.spec.ts:172`: o alvo é `.min-h-7`, o botão "Fonte: …" (28 px) que fica ao lado de outros iguais;
- `pedidos.spec.ts:566`: o alvo é `li:nth-child(34) > .border-noite.cursor-pointer > input`, a caixa de seleção de 24 px da 34ª linha.

No projeto `chromebook` (a janela larga, sem a barra de topo) passam. Os dois tinham passado até a 13.0.

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

O pedido dizia que a caixa fica "sob a barra de baixo da 13.0". Não fica. Medi a página no instante da auditoria (um `getBoundingClientRect` no teste, tirado depois):

- W6: `scrollY` 3743, a caixa em `y = −6…18` (24 px), a **barra de topo** em `0…56`, a barra de baixo em `732…800`;
- A2: o botão em `y = 32…60`, a barra de topo em `0…56`.

Nos dois, o controle está meio por baixo da **barra de topo** (`<header class="sticky top-0 z-10">`, que já era presa antes da 13.0). O axe (4.13) calcula o `target-size` subtraindo do alvo a área de qualquer elemento que se sobrepõe a ele e ignora o que tem `pointer-events: none` (`getTargetRects`): sobram 4 a 18 px à vista, menos que os 24 px, e há um vizinho ao lado, o que tira a exceção do espaçamento. O mesmo botão passa ou reprova conforme o ponto onde a rolagem parou.

O que a 13.0 mudou foi esse ponto: o `<main>` ganhou `padding-bottom` de 68 px + 2 rem, o documento ficou 68 px mais comprido, e o fim da rolagem (onde `.check()` do Playwright do 40º pedido e a conversa que rola para a última mensagem deixam a página) subiu esses 68 px, empurrando o 34º pedido e o botão "Fonte" para baixo da barra de topo. Não é defeito de produto: a pessoa rola e vê o controle inteiro, e a reserva do pé e o foco do teclado já são provados por medida (`casca-no-celular.spec.ts`). É defeito da auditoria, que depende do acaso da rolagem.

A barra de baixo, fixa, **não** reprova: com uma fileira de três botões de 28 px com 8 px à vista sob ela, a auditoria passa sem a correção (medi). Por isso a correção trata só o que reprova, o `position: sticky`; a barra de baixo (`fixed`) e o `dialog` (também `fixed`) ficam como estão.

Fora desta correção, e dito ao Orquestrador no relatório: a barra de topo não tem `scroll-padding-top`, então o foco do teclado pode parar atrás dela (WCAG 2.4.11) como a 13.0 evitou para a barra de baixo. É anterior à 13.0 e não é o que esta correção conserta.

## Teste que reproduz

- Os dois testes do sintoma, no projeto `celular`: vermelhos hoje, verdes depois.
- `e2e/casca-no-celular.spec.ts › o controle cortado pela barra de topo no meio da rolagem não reprova a auditoria de alvo de toque, e a auditoria devolve as barras como estavam`: três botões de 28 px postos na tela comprida, rolados até ficarem 8 px à vista sob a barra de topo. Vermelho sem a correção (`target-size` nos três botões), verde com ela. Não depende da rolagem em que a tela calhou. Também prova que a auditoria devolve as barras como estavam (a de topo, com um `pointer-events: auto !important` em linha que o teste põe antes, volta com o valor e a prioridade; uma barra presa sem nenhum valor volta sem nenhum) e que não deixa marca na página.

## Correção

`e2e/__fixtures__/verificacoes.ts`: `violacoesGraves` põe `pointer-events: none` nos elementos com `position: sticky` enquanto o axe roda e, em um `finally`, devolve a cada um o valor e a prioridade que tinha em linha (ou tira a propriedade, se não tinha). O produto não muda. Os 329 usos da função ganham a mesma garantia: o resultado deixa de depender da rolagem.

O custo, dito: durante a auditoria, **todo** elemento com `position: sticky` deixa de contar como cobertura de controle, e não só a barra de topo: a `BarraPresa` (`componentes/BarraPresa.tsx:78`), a faixa de supervisão do Tutor do aluno (`areas/aluno/Tutor.tsx:55`), a faixa "esperando" (`areas/professor/Time.tsx:272`) e as laterais da janela larga (`componentes/CascaDaEscola.tsx:128` e `:324`). Como `pointer-events` é herdado, os botões dentro dessas regiões também deixam de contar como sobreposição, uns dos outros inclusive; o tamanho de cada alvo e o espaçamento continuam auditados, porque o `target-offset` do axe não olha `pointer-events`. Hoje só a barra de topo é provada por teste de rolagem; o que é cobertura de verdade (o último controle atrás da barra de baixo, o foco atrás dela) tem teste de medida próprio em `casca-no-celular.spec.ts`. Um teste com um controle sob a `BarraPresa` é da tarefa que mexer nela.

## Mutações

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/casca-no-celular.spec.ts › o controle cortado pela barra de topo no meio da rolagem não reprova a auditoria de alvo de toque, e a auditoria devolve as barras como estavam
      if (getComputedStyle(elemento).position !== 'sticky') continue
-      presas.push({ elemento, valor: elemento.style.getPropertyValue('pointer-events'), prioridade: elemento.style.getPropertyPriority('pointer-events') })
      elemento.style.setProperty('pointer-events', 'none', 'important')
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/casca-no-celular.spec.ts › o controle cortado pela barra de topo no meio da rolagem não reprova a auditoria de alvo de toque, e a auditoria devolve as barras como estavam
      presas.push({ elemento, valor: elemento.style.getPropertyValue('pointer-events'), prioridade: elemento.style.getPropertyPriority('pointer-events') })
-      elemento.style.setProperty('pointer-events', 'none', 'important')
    }
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/casca-no-celular.spec.ts › o controle cortado pela barra de topo no meio da rolagem não reprova a auditoria de alvo de toque, e a auditoria devolve as barras como estavam
-      if (getComputedStyle(elemento).position !== 'sticky') continue
+      if (getComputedStyle(elemento).position !== 'fixed') continue
      presas.push({ elemento, valor: elemento.style.getPropertyValue('pointer-events'), prioridade: elemento.style.getPropertyPriority('pointer-events') })
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/casca-no-celular.spec.ts › o controle cortado pela barra de topo no meio da rolagem não reprova a auditoria de alvo de toque, e a auditoria devolve as barras como estavam
    }
-    Object.assign(window, { barrasPresasDaAuditoria: presas })
+    Object.assign(window, { outraCoisa: presas })
  })
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/casca-no-celular.spec.ts › o controle cortado pela barra de topo no meio da rolagem não reprova a auditoria de alvo de toque, e a auditoria devolve as barras como estavam
-        if (valor === '') elemento.style.removeProperty('pointer-events')
+        if (valor !== '') elemento.style.removeProperty('pointer-events')
        else elemento.style.setProperty('pointer-events', valor, prioridade)
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/casca-no-celular.spec.ts › o controle cortado pela barra de topo no meio da rolagem não reprova a auditoria de alvo de toque, e a auditoria devolve as barras como estavam
        if (valor === '') elemento.style.removeProperty('pointer-events')
-        else elemento.style.setProperty('pointer-events', valor, prioridade)
      }
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/casca-no-celular.spec.ts › o controle cortado pela barra de topo no meio da rolagem não reprova a auditoria de alvo de toque, e a auditoria devolve as barras como estavam
        if (valor === '') elemento.style.removeProperty('pointer-events')
-        else elemento.style.setProperty('pointer-events', valor, prioridade)
+        else elemento.style.setProperty('pointer-events', valor)
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/casca-no-celular.spec.ts › o controle cortado pela barra de topo no meio da rolagem não reprova a auditoria de alvo de toque, e a auditoria devolve as barras como estavam
-      Reflect.deleteProperty(window, 'barrasPresasDaAuditoria')
+      Reflect.has(window, 'barrasPresasDaAuditoria')
```

```mutacao
arquivo: e2e/__fixtures__/verificacoes.ts
teste: e2e/casca-no-celular.spec.ts › o controle cortado pela barra de topo no meio da rolagem não reprova a auditoria de alvo de toque, e a auditoria devolve as barras como estavam
    resultado = await new AxeBuilder({ page }).withTags([...TAGS_WCAG]).analyze()
  } finally {
-    await desfazer()
+    await Promise.resolve(desfazer)
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer 1ª (rec. 2) | A barra de topo `sticky top-0` não tem `scroll-padding-top`; o foco do teclado pode parar atrás dela (WCAG 2.4.11); `Time.tsx:272` e `Tutor.tsx:55` na mesma conta | Fora da correção e anterior à 13.0 (já dito na seção "Causa"). Muda `apps/web`, não e2e: tarefa própria; o Orquestrador decide se vai a `TODO.md` ou a uma correção, pelo relatório |
| frontend-reviewer 1ª (rec. 3) | Registrar no `/retro` que, desde 16/10, o `target-size` ignora barras `sticky` e que a cobertura delas é por medida | `/retro` da funcionalidade |
| test-engineer 1ª (rec. 2) | Nenhum teste prova que o `finally` desfaz quando o axe lança erro | Recusada: o próprio revisor diz impacto baixo, "fica para registro"; exigiria forçar erro do axe, mais caro que a regra que protege |
| test-engineer 1ª (rec. 3, metade do teste) | Teste com um controle sob a `BarraPresa` | Recusada: o texto do "Custo" já deixa o efeito explícito; o teste é da tarefa que mexer na `BarraPresa` |
| test-engineer 1ª (rec. 5) | Os dois testes do sintoma (`a2-assistente.spec.ts:140`, `pedidos.spec.ts:495`, projeto `celular`) não rodaram antes do commit | Não é código: o Orquestrador lê o veredito da esteira antes de fechar a correção. Rodei os dois no `celular` junto do portão (verdes) |
| test-engineer 1ª (rec. 6) | O nome do arquivo ainda diz "sob a barra de baixo" | `/retro`: renomear agora quebraria os caminhos já registrados nas rodadas e nos achados |
| test-engineer 2ª (a tabela "Revisões" mostra 1ª: a seção foi recriada pelo hook) | `casca-no-celular.spec.ts:319` marca a barra com `document.querySelector('header')` e a linha 338 a confere por `getByRole('banner')`; hoje apontam para o mesmo elemento | Recusada por ora: não muda a regra nem o resultado; entra na primeira tarefa que mexer no spec ou na casca, se a tela ganhar outro `<header>` |
| test-engineer 2ª | A asserção da barra sem valor (linha 339) não derruba sozinha nenhuma das nove mutações; protege contra tirar o `removeProperty`, sem bloco próprio | `/retro`: `setProperty` com valor vazio também tira a propriedade, o resultado é o mesmo |
| frontend-reviewer 2ª | `scroll-padding-top` da barra de topo, `Time.tsx:272` e `Tutor.tsx:55` (WCAG 2.4.11) | Já está na rodada 1: muda `apps/web`, o Orquestrador decide entre `TODO.md` e correção |
| frontend-reviewer 2ª | Registrar no `/retro` que o `target-size` ignora barras `sticky` desde 16/10 | `/retro` da funcionalidade |
| frontend-reviewer 2ª | Renomear o arquivo da correção ("sob a barra de baixo") | `/retro`: renomear quebra os caminhos já registrados nas rodadas e nos achados |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-16 01:12:36 | 2026-10-16 01:12:53 | `frontend-reviewer` | 1 | APROVADO | a9d6f4fd0ec802558 |
| 2026-10-16 01:12:41 | 2026-10-16 01:13:22 | `test-engineer` | 1 | APROVADO | a114af3fa78602433 |
