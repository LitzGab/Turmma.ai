# Tarefa 3.0 — Início: a saudação com a onça, a caixa de pedido e os atalhos

**Funcionalidade:** telas-do-professor · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O Início mostra a saudação com a onça do Assistente, a caixa de pedido com a turma e um atalho por ferramenta. O
que espera a professora deixa de aparecer nele: está no sino.

## Contexto necessário

- `techspec.md` seções 7b e 9; `prd.md` RF7, RF8 e RF22
- Regra 70, item 4a (função e selo "IA" junto da onça); D18 e D35
- `mockup.md` 1 e 3: sem a pílula da aula, sem o "+" e sem link no aviso de IA
- Código: `apps/web/src/areas/professor/Home.tsx`; `CaixaDoAssistente.tsx` (`abrirCartaoNaConversa`,
  `iniciaisDoPedido`); `saudacao.ts`; `componentes/ia/AssinaturaIA.tsx`

## Subtarefas

- [ ] 3.1 — `Home.tsx`: `Tela` de conversa, com o `h1` só para leitor de tela; o grupo a um terço da altura
  livre; a `AssinaturaIA` do Assistente (onça de 44 px; 36 abaixo de 768) acima da saudação, que continua num
  elemento só dela, com o texto de hoje; "O que vamos preparar hoje?"; a caixa; os atalhos; e a frase "O Assistente
  é uma IA e pode errar · Nada chega à turma sem você aprovar". A seção "Esperando você" e o erro dela saem; o link
  "Abrir a conversa com o Assistente" fica
- [ ] 3.2 — `AtalhosDeFerramenta.tsx`: um botão secundário de 44 px por item de `CATALOGO_DE_FERRAMENTAS`, com o
  ícone ilustrado, e o link "Ferramentas". Atividade e plano abrem o cartão na conversa com a turma e, como tema,
  o que está na caixa; a Adaptação abre sem ler a caixa. A função suspensa desliga o atalho dela. A
  `CaixaDoAssistente` ganha `semMenu`, que o Início usa
- [ ] 3.3 — `icones-de-ferramenta.tsx`: três desenhos nossos (atividade, plano, adaptação), `aria-hidden`, só com
  tokens
- [ ] 3.4 — Testes

## Arquivos previstos

<!-- Caminho de verdade, um por linha (`apps/web/src/…`): é o que diz com quem a tarefa corre em paralelo. -->
| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Home.tsx`, `apps/web/src/areas/professor/CaixaDoAssistente.tsx` | alterado |
| `apps/web/src/areas/professor/Home.test.tsx`, `apps/web/src/areas/professor/AtalhosDeFerramenta.tsx`, `apps/web/src/areas/professor/icones-de-ferramenta.tsx` | novo |
| `e2e/professor-inicio.spec.ts`, `e2e/professor-entregas.spec.ts`, `e2e/professor-ferramentas.spec.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| estados | componente | carregando; erro com "Tentar de novo"; sem turma confirmada, sem caixa nem atalho, com "Ir para Turmas"; com dado |
| saudação | componente | relógio fixo em 8h, 14h e 20h: as três saudações, com o primeiro nome e o ponto |
| o agente se identifica | componente | "Assistente de ensino" e o selo "IA" no bloco da onça |
| atalho | componente | atividade abre o cartão com a turma e o texto da caixa como tema; a Adaptação abre sem o texto (D35); pedido escrito e enviado não abre cartão: vai ao Assistente (D18) |
| nada espera no Início | componente e e2e | com entrega pendente, o Início não tem `[data-esperando-voce]`; o sino tem |
| função suspensa | componente | o aviso de hoje; a caixa e os atalhos desligados |
| recomeço | e2e | a segunda pessoa na mesma aba não vê o texto que a primeira deixou na caixa; os outros casos não se aplicam: a tela não tem link nem diálogo |
| 360 px e 1366 × 768 | e2e | os atalhos quebram sem rolar de lado; a caixa aparece sem rolar |

## Como testar

- Os estados de `e2e/professor-inicio.spec.ts › carregando, erro com "Tentar de novo"…` passam ao componente; o
  e2e fica com o fluxo. O caso do menu "Ferramenta" vira o do atalho, com as mesmas três ferramentas
- Relógio: `vi.setSystemTime`, nunca a hora da máquina
- `esperarNovaConversa` (`e2e/__fixtures__/casca.ts`) lê a saudação por texto exato: a onça fica fora do elemento
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/Home.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-inicio.spec.ts`
- Telas: `professora`, `/professor/nova-conversa`, e com `--vazia`. Mockup: `/professor`

## Fora do escopo desta tarefa

Anexo, busca na web e a faixa da aula (F7, F8); o menu "Ferramenta" da Conversa (4.0).

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
