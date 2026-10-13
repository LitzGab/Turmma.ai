# Tarefa 7.0 — Diálogo, confirmação, menu e painel ao lado na pele nova

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Diálogo, confirmação, menu e login por cima aparecem com borda de 2 px e degrau sólido, nos dois temas, e a galeria
ganha o painel ao lado, que no celular é folha de baixo.

## Contexto necessário

- `techspec.md` seção 9 (**Peças novas**: `<dialog>` modal, com prisão de foco e Esc do navegador e a devolução do
  foco nossa; **Degrau**; **Foco**), 6 (o login por cima) e 10 (foco e Esc no e2e, **sem dublar `showModal`**)
- `prd.md` RF5, RF7, RF9 e o caso de borda da sessão vencida com diálogo aberto; `cenarios.md`, parte A, linhas da 7.0
- `docs/interface.md` 10.2 e 9.3; `mockup.md` 3.5 (as medidas de `Dialogo`, `DialogoConfirmar` e `PainelLado`) e 3.1
- `.claude/rules/50-frontend.md`, itens 8 e 11; `.claude/rules/80-infra-e-carga.md`, item 7
- Código, em `apps/web/src/componentes/`: `Dialogo.tsx` (`showModal`, `prenderOFoco`, a devolução do foco e o
  `focoDeReserva`), `DialogoDeConfirmacao.tsx`, `dialogos.tsx` (`useEnvioUnico`, `ConfirmacaoDePerigo`), `Menu.tsx`
  com `flutuante.ts`, `LoginPorCima.tsx`, `copia-unica.tsx` e `DialogoDoConvite.tsx`

## Subtarefas

- [ ] 7.1 — Revestir **sem mudar props, texto nem ordem de foco**: caixa com borda de 2 px, canto de 16 e degrau
  sólido, sobre o `veu`; o rodapé à direita. Os campos escritos à mão em `LoginPorCima` e `copia-unica` ganham
  aqui a borda de 2 px em `borda-campo` e o fundo `campo` (a 4.0 corre ao lado e não exporta as classes)
- [ ] 7.2 — `DialogoDeConfirmacao`: os dois botões **do mesmo tamanho**, em duas colunas iguais (empilhados a
  360 px), cancelar antes de confirmar; o foco continua começando no texto, nunca em confirmar. **Perigo cheio só
  aqui e na `ConfirmacaoDePerigo`**
- [ ] 7.3 — `Menu`: a caixa com borda e degrau, item de 44 px, realce em `fundo-suave`, perigoso em
  `vermelho-texto`; `teclado-do-menu.ts` e `flutuante.ts` não mudam
- [ ] 7.4 — `PainelLado` (nova; `titulo`, `aoFechar`, `children`, `rodape`, `descritoPor`, `focoDeReserva`): sobre
  `<dialog>` com `showModal`, reaproveitando a prisão e a devolução do foco do `Dialogo` (extraia o que é comum,
  sem copiar). A partir de 768 px, 480 px colados à direita, na altura da janela; abaixo, folha de baixo com até
  88% da altura e a área segura no rodapé. Cabeçalho de 64 px com o título e "Fechar" (44 px); o foco entra no
  miolo, e não no "Fechar"; não anima largura nem altura. Entra em `PECAS_FORA_DA_ENTRADA`
- [ ] 7.5 — `galeria/secoes/sobrepor.tsx`: cada peça, com gatilho, com nomes inventados
- [ ] 7.6 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/Dialogo.tsx` | alterado |
| `apps/web/src/componentes/DialogoDeConfirmacao.tsx` | alterado |
| `apps/web/src/componentes/dialogos.tsx` | alterado |
| `apps/web/src/componentes/copia-unica.tsx` | alterado |
| `apps/web/src/componentes/DialogoDoConvite.tsx` | alterado |
| `apps/web/src/componentes/Menu.tsx` | alterado |
| `apps/web/src/componentes/LoginPorCima.tsx` | alterado |
| `apps/web/src/componentes/PainelLado.tsx` | novo |
| `apps/web/src/componentes/perigo-cheio.test.ts` | novo |
| `apps/web/src/galeria/secoes/sobrepor.tsx` | alterado |
| `apps/web/nome-dos-chunks.ts` | alterado |
| `e2e/pecas-sobrepor.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| foco preso e devolvido | e2e | em `Dialogo`, confirmação e `PainelLado`: Tab e Shift+Tab não saem; ao fechar, o foco volta a quem abriu, e ao `focoDeReserva` quando o gatilho sumiu |
| Esc | e2e | fecha cada um dos três; o Esc do menu fecha o menu, e não o diálogo de trás |
| o painel, ao lado e em folha | e2e | a 1366 px, 480 px colados à direita; no `celular`, folha de baixo com `larguraExcedenteDoDialogo` zero; o foco começa no miolo |
| os dois botões da confirmação iguais | e2e | mesma largura e mesma altura, nas duas famílias e nos dois projetos; nenhum começa com o foco |
| perigo cheio só na confirmação | unidade | lista fechada: só os arquivos de hoje usam `cheio` ou `CLASSES_DO_BOTAO_PERIGO_CHEIO`; um uso novo reprova |
| menu pelo teclado | unidade e e2e | os seis casos de `teclado-do-menu.test.ts`, os dez de `flutuante.test.ts` e os dois do menu no `pecas` ficam |
| nos dois temas, com axe e toque | e2e | a seção sem violação grave; "Fechar" e item de menu com 44 px no `celular` |
| sessão vencida com diálogo aberto | e2e | `inatividade › a sessão vence sozinha…` e `acesso-suspenso › duas abas…`: o login abre por cima, prende o foco e o que estava escrito continua |
| recomeço | e2e | segunda pessoa: `inatividade › Chromebook do carrinho…`; mesma entrada e resposta atrasada: `acesso-da-turma`; falha com o diálogo aberto: `professores` e `pedidos` (o aviso anterior sai) |
| clique duplo em confirmar | e2e | `pedidos` e `acesso-da-turma` continuam mandando um pedido só |
| nenhum teste de regra enfraquecido | e2e | `alertdialog` pelo nome e `larguraExcedenteDoDialogo` (18 specs), sem edição |

Log não se aplica. Concorrência no servidor também não: o que a tarefa guarda é o clique duplo, já provado.

## Como testar

- O `jsdom` não tem `showModal`: a `PainelLado` não ganha teste de componente nem dublê; a prova dela é o e2e
- e2e a copiar: `e2e/pecas-sobrepor.spec.ts › o diálogo de confirmação…` (abrir, medir, fechar, conferir o foco);
  gaveta com foco preso: `e2e/casca.spec.ts › W12: abaixo de 768 px…`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/perigo-cheio.test.ts`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-sobrepor.spec.ts e2e/inatividade.spec.ts e2e/pedidos.spec.ts`
- Armadilha: `showModal` duas vezes lança sob `StrictMode` (veja o comentário do `Dialogo`)
- Armadilha: caso de outro `pecas-*` que quebrar é arquivo de outra linha: pare e avise
- Telas: `/galeria` (Sobrepor), claro e escuro; `coordenacao`, `/coordenacao/professores`, `text=Cadastrar professor`;
  `professora`, `/professor/turmas`. Mockup: `/fundamentos` (Sobrepor)

## Fora do escopo desta tarefa

A gaveta da casca (12.0 e 13.0); usar o `PainelLado` nas telas e o sino (X2 e X3); `Campo` (4.0).

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
