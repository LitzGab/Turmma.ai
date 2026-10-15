# Correção — o anel da caixa de opção do motor usa `:has()`, que a pele proíbe, e o E5 do `casca.spec.ts` fica vermelho

**Origem:** pedido do Orquestrador em 15/10/2026 (E5 de `e2e/casca.spec.ts:306`, vermelho nos projetos `chromebook` e `celular`).
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- Os guardiões vieram no PEDIDO do Orquestrador. test-engineer é obrigatório em toda correção, marcado ou não. A correção altera 2 arquivos fora de `tasks/`: abaixo do limite do `revisor-geral`. -->

## Sintoma

`apps/web/src/componentes/ia/MotorFormulario.tsx` (a caixa de cada opção de múltipla escolha, tarefa 10.0) escreve o anel
como `has-[:focus-visible]:outline-*`. O Tailwind gera `:has(:focus-visible)` no CSS servido, e o E5 de `e2e/casca.spec.ts`
(`expect(css).not.toContain(':has(')`) reprova, nos dois projetos. O `techspec.md` (§ da pele, "nada depende de `:has()`",
linha 148) proíbe: `:has()` não existe antes do Chrome 105, e o laboratório roda o 109 com atualização por rede.

## Fora desta correção

Os 27 caminhos que o `git status --short` mostrava ao receber o pedido são da tarefa 12.0, em curso, e nenhum está em
`apps/web/src/componentes/ia/`: ficam na árvore, não entram na revisão nem no commit desta correção.

## Causa

A 10.0 desenhou o anel "só no teclado" com `has-[:focus-visible]` e escreveu o teste dela para exigir exatamente isso e
proibir `focus-within`, o contrário do que a 4.0 decidiu e registrou em `4_task.md` (Revisões, frontend-reviewer 1ª: o anel por
`focus-within` aparece também no clique do mouse, **aceito e registrado como decisão**, porque o desenho só pelo teclado
exigiria `:has()`). A `Opcao` já faz assim (`focus-within:outline-*`); o motor repetiu a caixa sem repetir a decisão. O teste
unitário (`pecas-revestidas.test.tsx`) olhava a classe que a 10.0 escolheu, e o único teste que olha o CSS gerado é o E5, que
só roda na esteira.

## Teste que reproduz

`apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a lista de tipos é uma caixa por tipo`: passa a exigir o anel
por `focus-within:outline-*` no rótulo e **nenhuma** classe com `has-` nem `:has(` (`has-[...]`, `has-checked:`, `group-has-*`, `peer-has-*`: todas geram `:has()`, e o filtro é o do `Opcao.test.tsx`). Vermelho antes da correção, verde depois.

## Correção

No rótulo da `CampoDeVarias`, as quatro classes `has-[:focus-visible]:outline-*` viram `focus-within:outline-*`, as mesmas da
`Opcao` (3 px, afastado 2 px, `outline-foco`). O comentário do teste, que defendia o `:focus-visible`, passa a dizer a decisão
da 4.0.

## Mutações

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a lista de tipos é uma caixa por tipo
-focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-solid focus-within:outline-foco
+has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-solid has-[:focus-visible]:outline-foco
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-15 16:49:59 | 2026-10-15 16:50:16 | `frontend-reviewer` | 1 | APROVADO | af22721fd34d8f8a1 |
| 2026-10-15 16:50:02 | 2026-10-15 16:50:33 | `test-engineer` | 1 | APROVADO | a7b00d8943978f497 |

```mutacao
arquivo: apps/web/src/componentes/ia/MotorFormulario.tsx
teste: apps/web/src/componentes/ia/pecas-revestidas.test.tsx › a lista de tipos é uma caixa por tipo
-border-2 px-3 py-2 focus-within:outline-3
+border-2 px-3 py-2 has-checked:border-azul focus-within:outline-3
```

## Recomendações da rodada 1 que ficaram sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| frontend-reviewer (1ª) | "A mutação do documento troca `focus-within:*` por `has-[:focus-visible]:*`. O teste da correção também proíbe `has-[`, o que cobre a regressão pelo lado do `:has()`." | Observação, sem ação: nada a aplicar |
| frontend-reviewer (1ª) | "O `:has()` só era pego pelo E5 na esteira. Vale uma checagem estática barata, por exemplo em `apps/web/src/estilos.test.ts`, que reprove `has-[` em qualquer `.tsx` de produção. A 12.0 já mexe nesse arquivo, então isso fica para depois dela, sem bloquear." | Tarefa 12.0 (ou `TODO.md` se ela fechar sem tocar): `estilos.test.ts` é da árvore da 12.0, fora desta correção; o Orquestrador leva ao Arquiteto |
| test-engineer (1ª) | "O documento não traz a revisão de qualquer outra cópia da caixa da `Opcao` fora de `componentes/ia/`. A busca não achou nenhuma, mas registrar na causa que ela foi feita evita repetir a 10.0 numa peça futura." | Recusada: a busca foi do revisor e o resultado ("nenhuma") já está em `achados/2026-10-15-anel-do-motor-sem-has.md`; o documento não afirma o que o Implementador não conferiu |
| 2026-10-15 16:59:30 | 2026-10-15 17:00:37 | `test-engineer` | 2 | APROVADO | afe43379a899bf64b |
