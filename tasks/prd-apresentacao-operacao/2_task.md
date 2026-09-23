# Tarefa 2.0 — As telas do F1 na pele da D72, a paleta antiga removida e as guardas de estilo estritas

**Funcionalidade:** apresentacao-operacao (A0) · **Depende de:** 1.0
**Subagentes obrigatórios:** `frontend-reviewer`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O `apps/web` inteiro fica na pele da D72: as telas do F1 migradas, a paleta antiga (`slate`, `blue`,
`amber`, `red`, `emerald`) removida do `@theme`, e as guardas passam a reprovar qualquer cor fora dos
tokens e qualquer declaração que o Chrome 109 descarte. O orçamento de 150 kB passa a valer só para a
entrada, abrindo lugar para o chunk do operador (10.0).

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `tasks/prd-apresentacao-operacao/techspec.md` seção 9 e `cenarios.md` (U3, E5, B1)
- `.claude/rules/50-frontend.md`
- `docs/interface.md` 9.1, 9.9 (inclusive o parágrafo "Modificador de opacidade em cor não entra": ele
  vira `color-mix()`, que só existe a partir do Chrome 111) e 11.1
- A tarefa 1.0 (tokens e componentes já migrados)
- `apps/web/src/estilos.test.ts` — a lista `FAMILIAS` e o porquê no comentário do topo
- `e2e/casca.spec.ts:286-298` — a guarda do CSS servido de hoje (`#1d4ed8`, classes `amber`)
- `.size-limit.json` e `tools/ci/tamanho-web.test.ts` — hoje o limite soma todo JS de
  `apps/web/dist/assets/*.js`

## Subtarefas

- [ ] 2.1 — Migrar as dez telas de `paginas/` e o `rotas.tsx` pela tabela da seção 9 da techspec; o fundo
  do diálogo `#0f172abf` vira `rgba()` literal
- [ ] 2.2 — Remover do `@theme` do `estilos.css` a paleta antiga, deixando exatamente o bloco da 9.9
- [ ] 2.3 — `estilos.test.ts`: aceitar só os nomes do `@theme` da 9.9 (inclui `white` e `black`) e
  reprovar modificador de opacidade em classe de cor (`bg-x/80`, `text-x/50`)
- [ ] 2.4 — `e2e/casca.spec.ts`: trocar `#1d4ed8` e as classes `amber` pelos hex e classes dos tokens
  novos; reprovar `oklch(` e `color-mix(` no CSS servido
- [ ] 2.5 — Orçamento: `.size-limit.json` com 150 kB brotli só para o chunk de entrada; o teste em
  `tools/ci/tamanho-web.test.ts` passa a provar que o limite mede a entrada e não a soma dos chunks
- [ ] 2.6 — Testes (tabela abaixo); portão com `--e2e`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/paginas/Casca.tsx`, `ConfigurarMfa.tsx`, `Convite.tsx`, `Entrar.tsx`, `EntrarNaEscola.tsx` | alterado |
| `apps/web/src/paginas/EscolherEscola.tsx`, `Inicio.tsx`, `Mfa.tsx`, `SemDesafio.tsx`, `Vinculos.tsx` | alterado |
| `apps/web/src/rotas.tsx` | alterado |
| `apps/web/src/estilos.css` | alterado |
| `apps/web/src/estilos.test.ts` | alterado |
| `e2e/casca.spec.ts` | alterado |
| `.size-limit.json` | alterado |
| `tools/ci/tamanho-web.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| **U3** — classe de cor fora do `@theme` da 9.9, ou com `/NN`, em qualquer arquivo de `apps/web/src` | unidade | a guarda reprova; o teste leva um caso de cada no fixture e mostra o arquivo e a classe |
| **E5** — o e2e do F1 inteiro verde na pele nova, em `chromebook` e `celular` | e2e | a migração não quebrou fluxo nenhum |
| **E5** — o CSS servido tem os hex dos tokens e não tem `oklch(` nem `color-mix(` | e2e | cobre o que o navegador recebe, que o teste de fonte não vê |
| aviso de atenção ("este convite não vale mais", "guarde estes códigos agora") com fundo e borda visíveis | e2e | a classe do aviso gera regra no CSS servido; era o caso que sumiu calado no F0 |
| **B1** (entrada) — entrada acima de 150 kB brotli reprova; soma de chunks acima de 150 kB com a entrada abaixo não reprova | unidade | o limite mede a entrada, e o chunk do operador não conta contra ela |
| contraste AA em todas as telas do F1 | e2e (axe) | a troca de cor manteve a leitura, inclusive `borda-campo` `#8F8F8F` (3,2:1) |

Não há concorrência nesta tarefa.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

- Mudar o texto, o fluxo ou a navegação das telas do F1: só a cor muda
- A casca da escola na navegação da D73: A1
- O chunk e as telas do operador e o teto de 60 kB: 10.0
- As pendências de web do F1 (`BroadcastChannel`, `details` do seletor, `saidaConfirmada`): primeira
  tarefa de web da A1
