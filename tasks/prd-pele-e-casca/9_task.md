# Tarefa 9.0 — Os ícones ilustrados dos lugares e o ladrilho

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `infra-guardian`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Início, Turmas, Ferramentas e Atividades ganham ícone ilustrado que acompanha o tema, e o `Ladrilho` dá moldura de
família a eles e aos do `lucide`, sem passar do que a Tech Spec admite na entrada.

## Contexto necessário

- `techspec.md` 7c (**Orçamento**: os 4 kB, o teto de `pecas-*`), 9 (**Tokens**, **Peças novas**) e 12 (a premissa do peso)
- `prd.md` RF17, RF22; `docs/interface.md` 9.4, 10.2 (`Ladrilho`) e 10.4; `mockup.md`, seção dos ícones (as formas)
- `.claude/rules/50-frontend.md`, item 1
- Código: `apps/web/nome-dos-chunks.test.ts` (a soma do primeiro carregamento); `.size-limit.json`;
  `tools/ci/tamanho-web.test.ts` (o `26 kB` aparece em cinco casos); `apps/web/public/marca/` (precedente de SVG em arquivo)

## Subtarefas

- [ ] 9.1 — `componentes/icones/lugares.tsx`: `inicio`, `turmas`, `tarefas` e `ferramentas` (os quatro quadradinhos:
  laranja, azul, verde e roxo), SVG 48 × 48, chapados, sem contorno. A cor é classe `fill-<família>`, `fill-icone-papel`
  ou `fill-icone-linha`: nenhum hex. `Icone` (`componentes/Icone.tsx`; `nome`, `tamanho` de 24 a 48, `rotulo?`): com
  `rotulo`, `role="img"` e nome; sem, `aria-hidden`
- [ ] 9.2 — `componentes/Ladrilho.tsx` (`familia`, `tamanho` de 32 a 56, `rotulo?`, `children`): quadrado de canto 12, fundo
  `<família>-claro`, ícone a 72%; serve a `Icone` e ao `lucide`. O mapa de classes por família é literal (o Tailwind
  não acha classe montada por texto)
- [ ] 9.3 — Medição. O bundler descarta os ícones até a 12.0 os ligar à casca: meça aqui o HTML renderizado dos quatro,
  em brotli, com teto de 3 kB (a folga do JSX até os 4 kB), e escreva o número em "Divergências" e na Tech Spec 7c e
  12. Acima de 4 kB, viram asset do build com hash (`lugares-*.svg`), usado por `<use>`, cor por `var(--color-…)` e
  teto próprio de 6 kB em brotli no `.size-limit.json`. A 12.0 mede a entrada de verdade
- [ ] 9.4 — Só se a 9.3 passar dos 4 kB: o grupo `lugares-*.svg` no `.size-limit.json` e o caso que o reprova em
  `tools/ci/tamanho-web.test.ts`. O teto de `pecas-*` já subiu para 40 kB na 3.0: confira, não suba de novo
- [ ] 9.5 — `galeria/secoes/marca-icones.tsx`: os quatro ícones, e o `Ladrilho` com ícone ilustrado e com `lucide`
- [ ] 9.6 — Testes

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/icones/lugares.tsx` e `lugares.test.tsx` | novos |
| `apps/web/src/componentes/Icone.tsx` e `Icone.test.tsx` | novos |
| `apps/web/src/componentes/Ladrilho.tsx` e `Ladrilho.test.tsx` | novos |
| `apps/web/src/galeria/secoes/marca-icones.tsx` | novo |
| `e2e/pecas-marca-icones.spec.ts` | novo |
| `.size-limit.json`, `tools/ci/tamanho-web.test.ts` | alterados, só se os ícones saírem da entrada |
| `tasks/prd-pele-e-casca/techspec.md`, `docs/interface.md` | alterados (o número medido) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| nome quando está sozinho | componente | `Icone` e `Ladrilho` com `rotulo` são `img` com esse nome |
| escondido ao lado de rótulo | componente | sem `rotulo`, `aria-hidden="true"` e nenhum nome |
| os quatro existem e diferem | componente | cada `nome` dá um SVG `0 0 48 48`, e o HTML dos quatro é diferente entre si |
| nenhuma cor fora dos tokens | unidade | `lugares.tsx` sem `#`, `rgb(` nem `style=`; só `fill-*` com nome da 9.10, sem exceção na guarda |
| o peso | unidade | o HTML dos quatro, em brotli, cabe em 3 kB |
| o teto dos ícones, se saírem da entrada | unidade | `lugares-*.svg` de 6 kB em brotli passa e de 7 kB reprova; os outros tetos não mudaram |
| os dois temas | e2e | na galeria, o `fill` do papel é `#EFEFEF` no claro e `#37464F` no escuro, lido do estilo calculado |
| tamanho | e2e | `Ladrilho` e `Icone` quadrados nas medidas pedidas, sem passar da janela a 360 px |
| axe | e2e | a seção sem violação grave, nos dois temas e nos dois projetos |

## Como testar

- Componente: `pedidos/ListaDePedidos.test.tsx`; peso por `renderToStaticMarkup` e `brotliCompressSync` (`node:zlib`)
- Teto: copie o caso `as peças acima de 26 kB em brotli reprovam…` de `tamanho-web.test.ts` com os números novos
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/Icone.test.tsx tools/ci/tamanho-web.test.ts`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-marca-icones.spec.ts`
- Armadilha: Rolldown descarta módulo que ninguém importa; `npm run build -w @educa/web` não mostra os ícones
- **Telas**: `/galeria` (Marca e ícones), claro e escuro. Mockup: `/fundamentos` (os ícones)

## Fora do escopo desta tarefa

Ligar os ícones à casca (12.0); os outros 44 ícones, que nascem com a tela deles.

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2). Sem cláusula nova, escreva "nenhuma".

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino. Sem nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->
