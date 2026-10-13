# Tarefa 7.0 — Ferramentas: o catálogo por categoria

**Funcionalidade:** telas-do-professor · **Depende de:** 5.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Ferramentas mostra uma seção por categoria da D74 que tenha ferramenta, com um cartão de ícone ilustrado por
ferramenta. Só existem as três que o produto tem. A lista do que foi gerado já saiu (5.0).

## Contexto necessário

- `techspec.md` seção 9 (Ferramentas: grade, uma seção por categoria); `prd.md` RF10 e RF22; `mockup.md` 8
- D74 (categorias), D18 (o cartão leva ao mesmo motor); PRD seção 3: sem Simulado, sem "Também dá para só pedir" e sem
  "Que prova corrigir?"
- Código: `Ferramentas.tsx`; `ferramentas.ts` (`catalogoPorCategoria`, `CATALOGO_DE_FERRAMENTAS`);
  `icones-de-ferramenta.tsx` (da 3.0, o ícone por ferramenta)

## Subtarefas

- [ ] 7.1 — `Ferramentas.tsx`: o `h1` "Ferramentas"; uma seção por categoria com ferramenta (Planejar, Preparar a aula,
  Avaliar; "Corrigir" não aparece, porque nenhuma ferramenta dela existe); o cartão é uma `Linha` de 108 px com o
  ícone de 48 px, o nome, a descrição em até 3 linhas e, se for o caso, o selo "Suspensa pela coordenação". Grade de
  3 colunas a partir de 1280 px, 2 a partir de 768, 1 abaixo. O `data-ferramenta` e o endereço do formulário ficam
- [ ] 7.2 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Ferramentas.tsx` | alterado |
| `apps/web/src/areas/professor/Ferramentas.test.tsx` | novo |
| `apps/web/src/areas/professor/ferramentas.test.ts` | alterado (a ordem das categorias) |
| `e2e/professor-ferramentas.spec.ts` | alterado (o catálogo; a lista foi para `professor-criados.spec.ts`) |

`ferramentas.ts` não muda aqui: a 8.0 o altera.

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| só as três | unidade | `catalogoPorCategoria` devolve plano de aula, Adaptação e atividade objetiva, nas categorias da D74, e nenhuma outra |
| categoria vazia | componente | "Corrigir" não aparece; nenhum cartão desligado ou "em breve" no lugar do que não existe |
| estados | componente | com a função suspensa, o cartão mostra o selo e o texto explica; a leitura do que está suspenso falha: os cartões ficam e um aviso diz que não foi possível conferir, com "Tentar de novo"; sem turma confirmada, um aviso leva a Turmas e os cartões ficam |
| o cartão leva ao motor | e2e | cada cartão abre `/professor/ferramentas/<id>`; o ícone é decoração (`aria-hidden`) e o nome acessível é o da ferramenta |
| 360 px e axe | e2e | uma coluna, sem rolar de lado, alvo de 44 px, sem violação grave, nos dois projetos |
| recomeço | e2e | a segunda pessoa na mesma aba vê o catálogo e o selo conforme a escola dela. Concorrência e log não se aplicam: só leitura |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`)
- e2e: o caso `o catálogo tem só as três ferramentas… nas categorias da D74` de
  `professor-assistente.spec.ts › Ferramentas (D74) e o formulário`, hoje em `professor-ferramentas.spec.ts`. Muda a
  estrutura do cartão; a asserção das três ferramentas fica
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Ferramentas.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-ferramentas.spec.ts`
- Telas: `professora`, `/professor/ferramentas`, `--clicar 'role=link[name=/Ferramentas/]'`. Mockup: `/professor/ferramentas`

## Fora do escopo desta tarefa

O seletor "Para a turma" no cabeçalho, o Simulado ENEM, "Também dá para só pedir ao Assistente", "Que prova corrigir?",
as seis ferramentas que o produto não tem (F7, D55) e o texto "Como vai sair" (8.0).

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
