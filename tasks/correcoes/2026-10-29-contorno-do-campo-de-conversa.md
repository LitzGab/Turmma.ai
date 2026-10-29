# Correção — o contorno de foco do campo de conversa fica em volta do `textarea` e não acompanha a caixa

**Origem:** uso (o Joaquim, ao digitar no chat do Tutor e no do Assistente de ensino).
**Subagentes obrigatórios:** `test-engineer`, `frontend-reviewer`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`
<!-- O PEDIDO do Orquestrador ditou `frontend-reviewer`; a Mesa conferiu a linha contra os arquivos alterados e o caminho
     `apps/web/src/componentes/ui/ia/` pede também `privacy-guardian`, `conformidade-reviewer` e `infra-guardian`
     (`tools/processo/guardioes-por-caminho.ts`). A correção leva 2 arquivos fora de tasks/ e não toca `.github/`, `tools/ci/` nem
     `tools/processo/`, então o `revisor-geral` não é obrigatório pelo limite do passo 5. -->

## Sintoma

Ao digitar no campo de conversa com IA (a `CaixaPedido`: chat do Tutor, do aluno, e a caixa do Assistente de ensino, da
professora), o anel de foco aparece em volta do `textarea` de dentro, 2 px afastado, dentro da moldura da caixa (borda de 2 px
e enchimento de 8 px). Ele não acompanha a caixa. No mockup de outubro (`mockups/src/components/ui/input-bar.tsx`) o `textarea`
não tem contorno (`outline-none`) e quem reage ao foco é a moldura inteira (`focus-within`).

## Fora desta correção

Nada: a árvore estava limpa.

## Causa

`apps/web/src/estilos.css` dá a todo `:focus-visible` o anel de 3 px com 2 px de afastamento, e o `textarea` da `CaixaPedido`
é o elemento que recebe o foco. A moldura (o `<form>` de borda `borda-campo` e canto `rounded-caixa`) é quem o usuário lê como
"o campo", mas ela não reage: o anel fica desenhado no `textarea`, dentro dela. O `docs/interface.md` já resolve este caso nas
peças em que a moldura é maior que o `input` (a `Opcao` e o `MotorFormulario`: "o anel é do rótulo, por `focus-within`"), e a
`CaixaPedido` ficou fora desse padrão.

## Teste que reproduz

`apps/web/src/componentes/ui/ia/CaixaPedido.test.tsx` › `CaixaPedido, o desenho` › `o anel de foco é da caixa, por focus-within,
e o campo de dentro não desenha contorno`: vermelho antes (a caixa não tem `focus-within:outline-*` e o campo não tem
`outline-none`), verde depois.

## Correção

Na `CaixaPedido`, o `<form>` ganha o anel por `focus-within` (`outline-3`, `outline-solid`, `outline-foco`, afastamento 0, colado
à borda como o do `Campo`, `docs/interface.md` 10.1 e 11.x) e o `textarea` ganha `outline-none`. O anel continua o do produto
(`foco`, 3 px, nos dois temas), só muda de dono: acende com o foco em qualquer controle de dentro da caixa, o campo e o botão
de enviar, e acompanha a moldura, que cresce com o texto.

## Telas vistas

Pela vitrine (`tools/vitrine/`), com o campo focado por clique, antes e depois, a 1366 e a 360 px: o Assistente de ensino da
professora (`/professor/nova-conversa`) e o Tutor do aluno (`/aluno/tutor/<atividade>`). Antes, o anel de 3 px abraçava só o
`textarea`, dentro da moldura cinza; depois, ele acompanha a moldura inteira, com o botão de enviar dentro, nos dois tamanhos.
A caixa é uma só (`CaixaPedido`, variantes `completa` e `so-texto`): não há outro campo de conversa com IA no produto.

## Mutações

```mutacao
arquivo: apps/web/src/componentes/ui/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ui/ia/CaixaPedido.test.tsx › o anel de foco é da caixa, por focus-within, e o campo de dentro não desenha contorno
-p-2 focus-within:outline-3 focus-within:outline-offset-0 focus-within:outline-solid focus-within:outline-foco">
+p-2">
```

```mutacao
arquivo: apps/web/src/componentes/ui/ia/CaixaPedido.tsx
teste: apps/web/src/componentes/ui/ia/CaixaPedido.test.tsx › o anel de foco é da caixa, por focus-within, e o campo de dentro não desenha contorno
-px-3 py-2.5 text-tinta outline-none disabled:bg-fundo-suave
+px-3 py-2.5 text-tinta disabled:bg-fundo-suave
```

## Revisões

Preenchida pelo hook `tools/processo/revisoes.ts` quando cada revisor termina. Não edite à mão:
o commit fica bloqueado enquanto um revisor obrigatório não tiver rodada que valha para o código
atual, com APROVADO quando o revisor tem veto.

| Início | Fim | Revisor | Rodada | Veredito | Agente |
|---|---|---|---|---|---|
| 2026-10-29 12:26:55 | 2026-10-29 12:27:12 | `privacy-guardian` | 1 | APROVADO | a76d0fca6f82afb84 |
| 2026-10-29 12:27:02 | 2026-10-29 12:27:12 | `infra-guardian` | 1 | APROVADO | aafb067c44e7e3eab |
| 2026-10-29 12:26:52 | 2026-10-29 12:27:17 | `frontend-reviewer` | 1 | APROVADO | acf0958cad38d511c |
| 2026-10-29 12:26:59 | 2026-10-29 12:27:22 | `conformidade-reviewer` | 1 | APROVADO | ad8b0f5536f03f273 |
| 2026-10-29 12:26:49 | 2026-10-29 12:27:29 | `test-engineer` | 1 | APROVADO | a7080bac25d7acb2b |

## Recomendações da rodada 1 que ficaram sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
| test-engineer (1ª) | A correção depende de o `:focus-visible` global ficar em `@layer base`; se alguém o tirar da camada, o `outline-none` perde, o anel duplo volta e o teste de classes continua verde. Vale uma asserção em `apps/web/src/estilos.test.ts` (ou checagem e2e do `outline-style` calculado do `textarea` focado). | `TODO.md`. `estilos.test.ts` não é arquivo desta correção e a prova nova caduca nada aqui: é teste novo de outra peça. |
| test-engineer (1ª) | O comentário de `apps/web/src/estilos.css:337-338` diz que "nenhuma peça apaga o contorno", e a `CaixaPedido` agora apaga o do `textarea`; ajustar para "nenhuma peça apaga o contorno sem dar o anel a quem a contém". | `TODO.md`. `estilos.css` não é arquivo desta correção, e tocá-lo soma o `conformidade-reviewer` e caduca a rodada de todos por um texto de comentário. |
| test-engineer (1ª) | Na variante `completa`, ao focar por Tab o seletor de turma ou o enviar, aparecem dois anéis: o da moldura (`focus-within`) e o do próprio controle (`:focus-visible`). | Fica para a validação: o `frontend-reviewer` viu as telas e o código e aprovou sem apontar isso. Se o Joaquim achar feio, é correção própria, com foto do foco por Tab. Registrar no `TODO.md`. |
| frontend-reviewer (1ª) | No tema escuro, sobre `.bg-noite`, o anel global muda de cor por `:focus-visible` (`estilos.css:351`), mas o da `CaixaPedido` fica sempre em `foco` (1,99:1 se a caixa um dia ficar sobre `bg-noite`). | `TODO.md`. Hoje a caixa só aparece sobre `bg-fundo` e `bg-superficie`; não há tela afetada. Entra na tarefa que puser a caixa sobre `bg-noite`. |
| frontend-reviewer (1ª) | `docs/interface.md` não cita a `CaixaPedido` entre as peças com anel por `focus-within`; vale uma linha. | `TODO.md`. Documento fora desta correção, e o RF dela é só o contorno. |
| frontend-reviewer (1ª) | `focus-within` acende também com clique de mouse no campo, e não só com teclado; é o que o mockup faz. | Sem ação: o revisor o chamou de aceitável, igual ao mockup e à `Opcao`. |
| infra-guardian (1ª) | Anel por `focus-within` acende também no clique do botão de enviar; sem efeito em carga. | Sem ação: observação, igual ao mockup. |
