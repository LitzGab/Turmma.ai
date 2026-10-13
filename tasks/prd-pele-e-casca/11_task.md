# Tarefa 11.0 — Toda tela aberta pela lateral mostra o título

**Funcionalidade:** pele-e-casca · **Depende de:** 5.0, 6.0
**Subagentes obrigatórios:** `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O `h1` deixa de ser só para leitor de tela: toda tela aberta pela lateral mostra o título, com o texto de hoje, num
cabeçalho de 64 px, e a aba diz a tela. A conversa é a exceção.

## Contexto necessário

- `techspec.md` 9 (**Página**) e 10; `prd.md` RF12, RF23; `cenarios.md`: A44 e `esperarGovernanca` (parte B)
- `docs/interface.md` 9.3 e 11.2; `.claude/rules/50-frontend.md`, itens 2a e 5
- Código: `componentes/Tela.tsx` (`h1` `sr-only`, `objeto`); `titulo.ts`; as seis telas: `Estrutura.tsx:219` (`sr-only`,
  sem `h1` no carregando), `Professores.tsx:100` (o `h1` tem `ref`, `id` e `tabIndex`), `ListaDaTurma.tsx:139` e
  `Turma.tsx:87` ("Turma {nome}" e a série), `Turmas.tsx:148`, `MinhaTurma.tsx:60`

## Subtarefas

- [ ] 11.1 — `Tela`: título visível em `t-titulo`, cabeçalho de no mínimo 64 px, ação à direita; larguras `conversa` 768,
  `leitura` 880 (nova), `formulario` 1040, `grade` 1200; `comMargem` com 32 px a partir de 768. Props novas:
  `tituloSoParaLeitor?` (a exceção da conversa), `idDoTitulo?` e `refDoTitulo?`. O resto não muda
- [ ] 11.2 — As seis telas passam à `Tela`, **sem mudar o miolo**: o `h1` aparece também no carregando, no erro e no vazio;
  sem a turma lida, o título é "Turma". Passam `tituloSoParaLeitor` as cinco da conversa: `professor/Home.tsx`,
  `Conversa.tsx`, `Time.tsx`, `Tutor.tsx` e `aluno/Tutor.tsx`
- [ ] 11.3 — O caso da `Tela` em `pecas-superficies.spec.ts` passa a 32 px; `material.spec.ts` ganha o `h1` medido e continua
  afirmando o padding do `main`, que ainda é o de hoje: o `main` é da 12.0
- [ ] 11.4 — Testes (tabela abaixo)

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/Tela.tsx` e `Tela.test.tsx` | alterado e novo |
| `apps/web/src/areas/coordenacao/Estrutura.tsx`, `ListaDaTurma.tsx`, `Professores.tsx` | alterados |
| `apps/web/src/areas/professor/Turmas.tsx`, `Turma.tsx` | alterados |
| `apps/web/src/areas/aluno/MinhaTurma.tsx` | alterado |
| `apps/web/src/areas/professor/Home.tsx`, `Conversa.tsx`, `Time.tsx`, `Tutor.tsx`; `areas/aluno/Tutor.tsx` | alterados (uma prop) |
| `apps/web/src/areas/titulo-das-telas.test.tsx` | novo |
| `e2e/titulo-da-tela.spec.ts` | novo |
| `e2e/pecas-superficies.spec.ts` | alterado (A44) |
| `e2e/material.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| o título aparece | componente | `Tela` tem um `h1` com o texto dado e sem `sr-only`; `tituloSoParaLeitor` o esconde; `idDoTitulo` e `refDoTitulo` chegam ao `h1` |
| as seis telas, quatro estados | componente | cada uma, carregando (rede segurada), com erro, vazia e com dado, tem **um** `h1`, com o texto de hoje |
| a caixa do `h1` | e2e | em cada item da lateral de cada papel: largura e altura maiores que zero, fonte de 24 px, fora de `clip` e de posição absoluta; cabeçalho de 64 px ou mais. Medir, e não `toBeVisible` |
| a conversa é a exceção | e2e | no Início do professor, o `h1` existe e fica escondido, com o texto de hoje |
| o título da aba | e2e | `toHaveTitle` de cada item: "Governança · Turmma" e os demais |
| vazio e erro, na tela | e2e | `Turmas` com a rota interceptada (`areas › vazio e erro com a rota interceptada…`): `h1` medido; `professores` passa sem edição |
| margem única | e2e | `material`: `[data-tela]` com 0 px e `main` com o padding de hoje; fora da casca, `Tela` com 32 px a partir de 768 e 16 abaixo (A44) |
| nada rola de lado | e2e | `larguraExcedente` zero nos itens, a 360 px |

Recomeço, concorrência e log: `acesso-da-turma`, `pedidos` e `areas` seguem sem edição.

## Como testar

- Componente a copiar: `componentes/pedidos/ListaDePedidos.test.tsx`, com `prepararTela`, `redeFalsa().segurar()` e
  `renderizarTela` de `src/__fixtures__/tela.ts`
- e2e a copiar: o preparo e as listas `ITENS_DO_*` de `areas.spec.ts`
- Isolado: `npx vitest run --project unidade apps/web/src/componentes/Tela.test.tsx apps/web/src/areas/titulo-das-telas.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/titulo-da-tela.spec.ts e2e/material.spec.ts e2e/professores.spec.ts`
- Armadilha: o `h1` de `Professores` recebe o foco (`tabIndex={-1}`): a `Tela` precisa repassar o `ref`
- **Telas**: `coordenacao`, `/coordenacao/estrutura`, `/coordenacao/professores`, `/coordenacao/governanca`; `professora`,
  `/professor/turmas` e `text=Abrir a turma`; `aluno`, `/aluno/minha-turma`; `/galeria`. Mockup: `/professor`

## Fora do escopo desta tarefa

O `main` e a moldura de 1200 (12.0); recompor o miolo (X2 a X4); o voltar em linha própria.

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
