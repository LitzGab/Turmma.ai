# Tarefa 6.0 — Selo, contador, aviso e abas dizem o estado sem depender da cor

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Selo, faixa, abas e os estados de vazio, carregando e erro aparecem na pele nova, nos dois temas, dizendo o estado
por texto ou ícone, e a galeria ganha o aviso, o contador e o toque.

## Contexto necessário

- `techspec.md` seção 9 (**Peças revestidas**, **Peças novas**: `Toque` é botão com `aria-pressed`, `Abas` mantém o
  teclado de hoje), 7c (o que mora na entrada) e 10
- `prd.md` RF9 e RF11; `cenarios.md`, parte A, as linhas da 6.0
- `docs/interface.md` 10.2 e 9.1 (os pares antigos de estado); `mockup.md` 3.3 (`Selo`, `Contador`, `Aviso`), 3.1
  (`Toque`), 3.4 (`Abas`) e 7.4
- `.claude/rules/50-frontend.md`, itens 5 e 11; D8 (a faixa não fecha) e D59
- Código, em `apps/web/src/componentes/`: `SeloDeEstado.tsx` (o texto é obrigatório pelo tipo; `data-estado`),
  `Faixa.tsx` (`role="note"`, sem botão), `Abas.tsx` com `teclado-das-abas.ts`, e `estado/*.tsx`

## Subtarefas

- [ ] 6.1 — Revestir **sem mudar props**. `Estado`: as quatro famílias com os tokens de hoje (`pendente`, `ok`, `erro`,
  `info` e os `-cx`), ícone e texto. `Faixa`: continua `role="note"`, sem botão e sem prop de fechar. `Abas`: 44 px, e
  a ativa com três pistas (texto `azul-texto`, sublinhado de 3 px e `aria-selected`)
- [ ] 6.2 — Os três de `estado/` **moram na entrada**: não importam `Aviso`, `Contador`, `Toque` nem peça de
  `PECAS_FORA_DA_ENTRADA`. Borda de 2 px; no `EstadoErro`, `role="alert"` só na mensagem e o botão fora dele;
  `EstadoCarregando` continua texto, sem animação; o tracejado do `EstadoVazio` em `borda-campo`
- [ ] 6.3 — `Aviso` (nova; `tom`: `info`, `atencao`, `erro` ou `certo`; `titulo`, `children`, `acao`): ícone e texto
  em todo tom; `role="alert"` só no `erro`, e **nenhum papel vivo nos outros** (o mockup põe `status` em texto
  parado: é ruído). Não fecha. **Não converta** os cerca de 30 avisos escritos à mão nas telas: é da spec da área
- [ ] 6.4 — `Contador` (`n`, `oQueConta`, `familia`): número tabular, com o que conta em texto para leitor de tela;
  zero não desenha; não pisca. `Toque` (`selecionado`, `aoMudar`, `icone`, `desligado`): `<button aria-pressed>`,
  44 px abaixo de 768; o selecionado leva o visto, e não só a cor
- [ ] 6.5 — As três novas entram em `PECAS_FORA_DA_ENTRADA`; `galeria/secoes/estado.tsx`, com nomes inventados
- [ ] 6.6 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/SeloDeEstado.tsx` | alterado |
| `apps/web/src/componentes/Faixa.tsx` | alterado |
| `apps/web/src/componentes/Abas.tsx` | alterado |
| `apps/web/src/componentes/Abas.test.tsx` | novo |
| `apps/web/src/componentes/estado/EstadoCarregando.tsx` | alterado |
| `apps/web/src/componentes/estado/EstadoErro.tsx` | alterado |
| `apps/web/src/componentes/estado/EstadoVazio.tsx` | alterado |
| `apps/web/src/componentes/estado/estados.test.tsx` | novo |
| `apps/web/src/componentes/Aviso.tsx` | novo |
| `apps/web/src/componentes/Aviso.test.tsx` | novo |
| `apps/web/src/componentes/Contador.tsx` | novo |
| `apps/web/src/componentes/Contador.test.tsx` | novo |
| `apps/web/src/componentes/Toque.tsx` | novo |
| `apps/web/src/componentes/Toque.test.tsx` | novo |
| `apps/web/src/galeria/secoes/estado.tsx` | alterado |
| `apps/web/nome-dos-chunks.ts` | alterado |
| `e2e/pecas-estado.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| texto ou ícone em todo estado | componente | `Estado` nas quatro famílias, `Aviso` nos quatro tons, `Contador` e `Toque` selecionado: o estado está no texto, no ícone ou no ARIA, sem ler classe de cor |
| o aviso e a região viva | componente | `erro` é `alert`; os outros tons não têm papel vivo; não existe botão de fechar |
| abas pelo teclado | componente | uma parada de Tab, setas com volta, Home e End, `aria-selected` e `aria-controls`; os cinco casos de `teclado-das-abas.test.ts` ficam |
| vazio, carregando e erro | componente | `EstadoErro`: `alert` só com a mensagem, "Tentar de novo" fora dele e "Tentando de novo…" em `status`; `EstadoCarregando` é `status`, sem nó animado; `EstadoVazio` com a ação e o "Verificando…" |
| nos dois temas, com axe | e2e | a seção sem violação grave, nos dois projetos; o contraste calculado de cada família e tom |
| alvo de toque | e2e (`celular`) | aba e `Toque` com 44 px |
| a faixa não fecha | componente e e2e | `Faixa` sem botão nem link; `aluno-tutor` continua afirmando a faixa presa, sem edição |
| os três de `estado/` na entrada | unidade | `apps/web/nome-dos-chunks.test.ts` sem peça da lista no primeiro carregamento |
| nenhum teste de regra enfraquecido | e2e | "Tentar de novo" (18 specs), `[data-estado]` em `governanca` e `pedido-do-titular`, e a linha de aprovação igual ao selo, sem edição |

Concorrência, recomeço e log não se aplicam: peça sem servidor, sem sessão e sem log.

## Como testar

- Componente a copiar: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`; teclado, com `userEvent`
- e2e a copiar: o caso das abas de hoje (`pecas`), onde a 2.0 o deixou. Se ele ficou em outro `pecas-*`, não o
  edite: a prova das abas no navegador entra como caso novo em `e2e/pecas-estado.spec.ts`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/Aviso.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-estado.spec.ts e2e/aluno-tutor.spec.ts`
- Armadilha: `mensagemDoErro` vem de `api/cliente`: no teste do `EstadoErro`, passe um erro com código do catálogo
- Armadilha: os `rgb()` de `ok-cx`, `pendente-cx` e `erro-cx` em outros specs não mudam: os tokens são os de hoje
- Telas: `/galeria` (Estado), claro e escuro; `aluno`, `/aluno/tutor`; `professora`, `/professor/turmas`. Mockup:
  `/fundamentos` (Marcar e informar)

## Fora do escopo desta tarefa

`Segmentado` (2.0); o contador de "Seu time" na lateral (12.0, escrito lá: a casca é da entrada); converter aviso
escrito à mão; o sino (X2 e X3).

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
