# Tarefa 5.0 — Cartão, linha clicável, tabela e número na pele nova

**Funcionalidade:** pele-e-casca · **Depende de:** 3.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Cartão, tabela, número de painel e barras aparecem com borda de 2 px e sem sombra borrada, nos dois temas, e a
galeria ganha a linha inteira clicável.

## Contexto necessário

- `techspec.md` seção 9 (**Tokens**, **Foco**: o anel por dentro em linha, **Alvo de toque**, **Peças novas**), 7c e 10
- `prd.md` RF7, RF9, RF11, RF23; `cenarios.md`, parte A, as linhas da 5.0
- `docs/interface.md` 9.3 e 10.2; `mockup.md` 3.2 (`Cartao`, `Linha`, `Tabela`) e 3.3 (`NumeroGrande`)
- `.claude/rules/50-frontend.md`, itens 2a e 11; D59 (a barra não muda de cor)
- Código, em `apps/web/src/componentes/`: `Cartao.tsx`, `NumeroPainel.tsx`, `Tabela.tsx` (uma estrutura por vez no
  DOM, por `useMidia`; a região só recebe foco quando sobra), `BarraRotulada.tsx` ("Cor neutra, sempre") e
  `BarraPresa.tsx` (`sticky`, e o `scroll-padding-bottom` que ela reserva)

## Subtarefas

- [ ] 5.1 — Revestir **sem mudar props**: `Cartao`, `NumeroPainel` e a moldura da `Tabela` com borda de 2 px em
  `borda` e canto de 16, **sem degrau** (cartão de leitura não é botão); cabeçalho da tabela em `t-selo`, o número
  em `t-numero`; a `BarraPresa` com o fio de 2 px e fundo cheio
- [ ] 5.2 — A `BarraRotulada` continua **neutra**: trilho `ia-cx` e enchimento `sutil`, como hoje, sem cor de
  família e sem mudar perto do limite. Só a forma muda
- [ ] 5.3 — `Linha` (nova; `inicio`, `titulo`, `abaixo`, `fim`, e `para` **ou** `aoAcionar`): a linha inteira é
  **um** alvo, um `<a>` ou um `<button>`, sem clicável dentro de clicável; chevron `aria-hidden` no fim; 64 px de
  altura mínima; título numa linha, com reticências; o anel de foco **por dentro** (−3 px). Sem ação, é um `div`
  sem chevron. Entra em `PECAS_FORA_DA_ENTRADA`
- [ ] 5.4 — `galeria/secoes/superficies.tsx`: cada peça, e a linha como link, como botão, só de leitura e com título
  comprido, com nomes inventados
- [ ] 5.5 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/Cartao.tsx` | alterado |
| `apps/web/src/componentes/NumeroPainel.tsx` | alterado |
| `apps/web/src/componentes/Tabela.tsx` | alterado |
| `apps/web/src/componentes/Tabela.test.tsx` | novo |
| `apps/web/src/componentes/BarraRotulada.tsx` | alterado |
| `apps/web/src/componentes/BarraPresa.tsx` | alterado |
| `apps/web/src/componentes/Linha.tsx` | novo |
| `apps/web/src/componentes/Linha.test.tsx` | novo |
| `apps/web/src/galeria/secoes/superficies.tsx` | alterado |
| `apps/web/nome-dos-chunks.ts` | alterado |
| `e2e/pecas-superficies.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| a tabela vira lista a 360 px | componente e e2e | abaixo de 768 só a lista existe, com `dt` e `dd`; a partir daí só a tabela, com `caption` e `th` de linha. O caso de hoje do `pecas` fica, sem perder asserção |
| a tabela que não cabe rola dentro dela | e2e | a região ganha foco e nome só com sobra, e a página não rola de lado |
| a barra de acerto continua neutra | e2e | `aluno-tutor` e `professor-turma` continuam afirmando os dois `fill` de hoje, **sem edição** |
| a linha é um alvo só | componente | um elemento focável por linha, com o título no nome acessível; Enter aciona; sem ação, nenhum focável e nenhum chevron |
| anel por dentro, nos dois temas | e2e | contorno de 3 px em `foco`, com afastamento negativo, inteiro dentro da moldura |
| alvo de toque | e2e (`celular`) | a linha com 44 px ou mais |
| axe nos dois temas | e2e | a seção sem violação grave, nos dois projetos |
| a barra presa não cobre o último item | e2e | o caso de hoje do `pecas` e o `position: sticky` de `professor-turma` continuam, com a margem do degrau dos botões |
| nenhum teste de regra enfraquecido | e2e | `governanca` (a tabela "O que a IA gerou e quem aprovou"), `estrutura` e `professores` sem edição |

Concorrência, recomeço e log não se aplicam: peça sem servidor, sem sessão e sem log.

## Como testar

- Componente a copiar: `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`. O `jsdom` não tem `matchMedia`:
  o teste da `Tabela` põe um `window.matchMedia` de teste (API do navegador, e não peça nossa)
- e2e a copiar: o caso "a tabela vira lista" de `e2e/pecas-superficies.spec.ts` (`secao`, `caixa`, `desenho`)
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/Linha.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/pecas-superficies.spec.ts e2e/professor-turma.spec.ts`
- Armadilha: os 46 cartões escritos à mão nas telas mudam de cor pelo token e ficam como estão: não converta
- Armadilha: caso de outro `pecas-*` que quebrar é arquivo de outra linha: pare e avise
- Telas: `/galeria` (Superfícies), claro e escuro; `coordenacao`, `/coordenacao/governanca`; `professora`,
  `/professor/turmas`. Mockup: `/fundamentos` (Conter e listar)

## Fora do escopo desta tarefa

Linha clicável e ordenação na `Tabela` (X2); a `Tela` (11.0); a barra presa acima da barra de baixo (13.0);
converter cartão escrito à mão (spec da área).

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
