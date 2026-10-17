# Correção — o painel lateral aberto pelo endereço cobre o aviso de incidente e o deixa inerte

**Origem:** `tasks/prd-telas-da-coordenacao/validacao.md` seção 4, Crítico C3 (validação da X2, REPROVADA; RF12 a RF15).
**Subagentes obrigatórios:** `frontend-reviewer`, `revisor-geral`
<!-- O `frontend-reviewer` veio no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. `revisor-geral`: a correção altera 7 arquivos fora de `tasks/` (dialogo-prioritario.ts e seu teste, dialogo-modal.ts, PainelLado.tsx e seu teste, AvisoDeIncidente.tsx, incidentes.spec.ts), acima do limite de 5. -->

## Sintoma

Com um incidente sem confirmação, abrir (ou recarregar) `/coordenacao/professores?professor=<id>`, `/coordenacao/material?material=<id>` ou
`/coordenacao/estrutura?painel=ano` abre dois `<dialog>` modais: o `Dialogo` do aviso (`AvisoDeIncidente.tsx`) e o `PainelLado`. O painel
fica no alto da camada, cobre o texto do aviso e o deixa inerte até ser fechado (o Playwright não alcança "Ver depois":
"`<dialog data-painel-lado>` intercepts pointer events").

## Fora desta correção

Nada: o pedido veio sem arquivos da tarefa em curso, e a árvore estava limpa.

## Causa

A ordem dos modais na camada de cima do navegador (`top layer`) é a do `showModal`: o último a abrir fica por cima. O aviso espera a leitura
dos incidentes e é um pedaço que se baixa (`lazy`); o painel pelo endereço abre assim que a tela monta com o id no endereço. Quem chega depois
cobre o outro, e o `PainelLado` não sabia que existia um aviso que precisa ser lido antes de qualquer outro trabalho.

## Teste que reproduz

- `e2e/incidentes.spec.ts › Aviso de incidente: o painel aberto pelo endereço` (o `describe`): um caso por endereço, `?professor=`, `?material=` e `?painel=ano` ("<endereço>: o aviso fica por cima, confirma pelo aviso, e só então o painel abre"); o caso de "Ver depois" com o painel esperando; e o caso inverso, o painel já aberto quando o aviso chega. A ordem de chegada é controlada com `page.route` (a tela do painel só chega depois de o aviso estar na tela; no inverso, a leitura dos incidentes só volta depois de o painel estar aberto).
- `apps/web/src/componentes/dialogo-prioritario.test.ts` (o registro) e `apps/web/src/componentes/PainelLado.test.tsx` (o painel que espera).

## Correção

- `componentes/dialogo-prioritario.ts` (novo): o registro do diálogo prioritário. O aviso de incidente se registra enquanto está na tela (`useDialogoPrioritario`), e quem quer abrir sozinho pergunta `quandoNaoHouverPrioritario(abrir)`: abre já, ou quando o último prioritário sai.
- `componentes/dialogo-modal.ts`: `useDialogoModal` ganha `cedeAoPrioritario`. Com ele, o `showModal` e o foco no miolo esperam o registro; o foco de "quem abriu" é o de quando o diálogo abre de fato; a limpeza desiste da espera e só devolve o foco ao reserva se chegou a abrir.
- `componentes/PainelLado.tsx`: liga `cedeAoPrioritario`. Os três painéis do endereço (`?professor=`, `?material=`, `?painel=ano`) são `PainelLado`. O `Dialogo` não cede: o que ele abre nasce de um toque, com a página inerte atrás do aviso.
- `areas/coordenacao/privacidade/AvisoDeIncidente.tsx`: um filho do `Dialogo`, `PrioridadeDoAviso`, registra o aviso (o efeito dos filhos roda antes do que abre o `dialog`). "Ver depois" e a confirmação do último aviso o desmontam, e o painel que esperava abre; o painel que já estava aberto antes do aviso não é mexido (o aviso, que abre depois, já fica por cima).
- `e2e/incidentes.spec.ts`: um caso por endereço (entra com incidente pendente, recarrega no endereço do painel, vê só o aviso aberto, confirma pelo aviso e só então vê o painel) e um caso do "Ver depois" com o painel esperando, que termina na faixa e no "Ver o aviso".
- `dialogo-prioritario.test.ts` e `PainelLado.test.tsx`: a regra de quando quem espera é chamado, e o painel que não chama `showModal` enquanto há prioritário, que desmontado sem ter aberto não manda o foco à reserva, e que devolve o foco a quem o tinha quando ele abriu. Os dois têm um `afterEach` que confere que nenhum prioritário ficou na tela.
- `techspec.md`: seções 2 e 5, com o módulo novo e o que mudou em `dialogo-modal.ts` e `PainelLado.tsx`.

**Onde o foco termina** (ordem 1, item 12, regra 50, item 11), medido no e2e e não suposto: depois de confirmar ou de "Ver depois", o painel que esperava abre com o foco no miolo; fechado com o Esc, o foco vai ao título da lista ("Turmas de …"), a reserva que cada tela já tem para o painel aberto pelo endereço, e não ao `body` nem a "Ver o aviso". O produto não mudou por isso.

Vermelho antes (código antigo, `chromebook` e `celular`): os quatro casos novos falharam nos dois projetos (8 de 8): com o painel já montado, `dialog[data-painel-lado]` estava com `open`, e no "Ver depois" havia dois `dialog[open]`. A primeira versão do e2e esperava `toHaveCount(0)` no painel e passou no `?material=` com o código antigo, porque o painel ainda não tinha chegado; por isso o teste espera o painel montado antes de conferir que ele não abriu.

## Mutações

```mutacao
arquivo: apps/web/src/componentes/PainelLado.tsx
teste: e2e/incidentes.spec.ts › o painel aberto pelo endereço
-  const { dialogo, fechadoPeloNavegador, prender } = useDialogoModal({ focoInicial: miolo, focoDeReserva, cedeAoPrioritario: true })
+  const { dialogo, fechadoPeloNavegador, prender } = useDialogoModal({ focoInicial: miolo, focoDeReserva })
```

```mutacao
arquivo: apps/web/src/areas/coordenacao/privacidade/AvisoDeIncidente.tsx
teste: e2e/incidentes.spec.ts › o painel aberto pelo endereço
-      <PrioridadeDoAviso />
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-prioritario.ts
teste: apps/web/src/componentes/dialogo-prioritario.test.ts › com prioritário na tela, quem quer abrir espera
-    if (prioritarios > 0) return
+    if (prioritarios > 1) return
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/PainelLado.test.tsx › com prioritário, não abre ao montar
-    const desistir = cedeAoPrioritario ? quandoNaoHouverPrioritario(abrir) : (abrir(), undefined)
+    const desistir = (abrir(), undefined)
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/PainelLado.test.tsx › o painel desmontado sem ter chegado a abrir
-      else if (abriu) reserva.current?.()
+      else reserva.current?.()
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/PainelLado.test.tsx › quem abriu é quem tem o foco quando o painel de fato abre
-    let quemAbriu: HTMLElement | undefined
+    let quemAbriu: HTMLElement | undefined = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
     let abriu = false
     desmontando.current = false
     const abrir = () => {
       abriu = true
-      quemAbriu = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-modal.ts
teste: apps/web/src/componentes/PainelLado.test.tsx › o painel desmontado enquanto esperava não abre depois
-      desistir?.()
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-prioritario.ts
teste: apps/web/src/componentes/dialogo-prioritario.test.ts › tirar duas vezes o mesmo prioritário
-    if (saiu) return
```

```mutacao
arquivo: apps/web/src/componentes/dialogo-prioritario.ts
teste: apps/web/src/componentes/dialogo-prioritario.test.ts › quem desistiu da espera
-    aoLiberar = aoLiberar.filter((chamar) => chamar !== abrir)
+    void abrir
```

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | Conferir no e2e que o painel que espera não está na árvore de acessibilidade | Recusada pela Mesa: `getByRole('dialog', ...)` com contagem 0 já a cobre |
| frontend-reviewer (1ª) | Uma linha de texto "O painel abre depois do aviso" | Recusada pela Mesa: muda texto de tela, decisão de produto; fica para o Joaquim |
| revisor-geral (1ª) | Tornar `haDialogoPrioritario` privada | Recusada pela Mesa: o `afterEach` dos dois testes a usa |
| test-engineer (1ª) | e2e com dois incidentes pendentes | Recusada pela Mesa: a regra do último prioritário tem teste de unidade |
| revisor-geral (2ª) | O filtro da rota chama `ehLeituraDosIncidentes(url, 'GET')` e o handler confere o método de novo; deixar só um dos dois | Recusada: só legibilidade; fica para a próxima tarefa que tocar `e2e/incidentes.spec.ts` |
| test-engineer (2ª) | No caso inverso do e2e, conferir também que o foco foi para dentro do aviso quando ele abre por cima do painel | Recusada: o foco do aviso aberto é regra do `Dialogo`, fora do que a correção muda; fica para a próxima tarefa que tocar `e2e/incidentes.spec.ts` |
| test-engineer (2ª) | No caso inverso, um comentário dizendo que o `page.route` da leitura de incidentes continua ligado depois de solto | Recusada: só comentário em teste; fica para a próxima tarefa que tocar `e2e/incidentes.spec.ts` |

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-17 19:29:26 | 2026-10-17 19:30:07 | `frontend-reviewer` | 1 | APROVADO | a9536724f28828825 |
| 2026-10-17 19:29:33 | 2026-10-17 19:32:02 | `test-engineer` | 1 | REPROVADO | a519b3a5dc0335e4f |
| 2026-10-17 19:29:30 | 2026-10-17 19:32:10 | `revisor-geral` | 1 | REPROVADO | ab0550a426a352032 |
| 2026-10-17 19:48:09 | 2026-10-17 19:48:29 | `revisor-geral` | 2 | APROVADO | ae9a4348cb6890633 |
| 2026-10-17 19:48:03 | 2026-10-17 19:49:36 | `test-engineer` | 2 | APROVADO | ad39a0b59d8186ddf |
