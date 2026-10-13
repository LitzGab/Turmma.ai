# Tarefa 8.0 — O formulário da ferramenta com "Como vai sair"

**Funcionalidade:** telas-do-professor · **Depende de:** 7.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O formulário de uma ferramenta ganha, ao lado, "Como vai sair": um texto fixo que diz o que a ferramenta entrega e o que
acontece depois. O motor, os campos e o pedido são os de hoje.

## Contexto necessário

- `techspec.md` seção 9 (Formulário: o motor e, ao lado a partir de 1024 px, "Como vai sair"); `prd.md` RF11, RF21 e
  RF22; `mockup.md` 9.1 e 9.2, e a tabela das ferramentas em (b), só pela forma
- Regra 70, itens 2a e 3; D35 e D67: a Adaptação não tem campo de texto e não fala de aluno; D46: acertos e diagnóstico,
  nunca nota. O texto é fixo porque o motor não tem o que mostrar antes de gerar (PRD seção 10): nada de prévia
- Código: `Ferramenta.tsx`; `ferramentas.ts` (`CATALOGO_DE_FERRAMENTAS`); `CartaoDeFerramenta.tsx`, que não muda

## Subtarefas

- [ ] 8.1 — `Ferramenta.tsx` em duas colunas a partir de 1024 px (o formulário e, ao lado, "Como vai sair"); abaixo, a
  coluna única, com "Como vai sair" depois do formulário. O texto fixo por ferramenta mora em `ferramentas.ts`
  (`COMO_VAI_SAIR`), de três linhas no máximo: o que sai, onde fica (Criados) e se vai à turma e como. A Adaptação diz
  que nasce esperando a aprovação e que só o tipo da adaptação é registrado
- [ ] 8.2 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Ferramenta.tsx`, `apps/web/src/areas/professor/ferramentas.ts` | alterado |
| `apps/web/src/areas/professor/ferramentas.test.ts` | alterado (o texto por ferramenta e o vocabulário) |
| `apps/web/src/areas/professor/Ferramenta.test.tsx` | novo |
| `e2e/professor-ferramentas.spec.ts` | alterado (a Adaptação sem campo de texto; a função suspensa) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| o texto por ferramenta | unidade | `COMO_VAI_SAIR` tem uma entrada por ferramenta do catálogo, de até três linhas; ferramenta nova sem texto reprova |
| o vocabulário | unidade | nenhum texto contém "nota", "conceito", "pontuação", "média", "ranking" nem "diagnóstico do aluno"; a Adaptação não cita aluno nem condição (D35) |
| estados do formulário | componente | carregando; erro com "Tentar de novo"; sem turma confirmada, com "Ir para Turmas"; função suspensa, com o aviso no lugar do formulário e "Como vai sair" ainda à vista; com dado |
| a Adaptação sem campo de texto | componente e e2e | só a atividade, os tipos da lista fechada e o tempo extra; nenhum `textarea` nem campo livre; o pedido manda só isso (caso de hoje) |
| sem prévia | componente | "Como vai sair" não muda ao preencher o formulário nem ao gerar: é o mesmo texto |
| o endereço de ferramenta que não existe | e2e | `/professor/ferramentas/xyz` responde como página não encontrada |
| 360 px e 1366 × 768 | e2e | uma coluna a 360 px, sem rolar de lado; duas colunas a 1366 px; o botão de gerar à vista |
| recomeço | e2e | o formulário aberto de novo começa em branco (`esquecerGeracaoTerminada`); a segunda pessoa na mesma aba não vê a geração da primeira. Concorrência: dois cliques em "Gerar" mandam um pedido (caso de hoje). Log não se aplica |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`)
- Vocabulário: o teste de `aprovar.test.ts` que varre os textos por palavra proibida, ampliado a `COMO_VAI_SAIR`
- e2e: `D35, D67: a Adaptação não tem campo de texto…` e `a função suspensa pela escola tira o formulário…`, hoje em
  `professor-ferramentas.spec.ts`; muda a estrutura (a segunda coluna), não a asserção
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/ferramentas.test.ts`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-ferramentas.spec.ts`
- Telas: `professora`, `/professor/ferramentas/atividade_objetiva`, `--clicar 'role=link[name=/Atividade/]'` em
  Ferramentas. Mockup: `/professor/ferramentas/redacao`, só pela composição

## Fora do escopo desta tarefa

"Mais opções" e os campos novos (BNCC, estilo, versões), anexo, busca na web, a declaração "De quem é este material?"
(D5, D75, D68); a janela de três passos da Adaptação e a escolha de alunos; Redação e discursiva (F7, D55); o cartão
dentro da conversa (4.0).

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
