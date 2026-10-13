# Tarefa 11.0 — Turma › Atividades

**Funcionalidade:** telas-do-professor · **Depende de:** 6.0, 10.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Atividades lista as atividades aplicadas à turma, uma linha por atividade, com o estado e os envios. A linha abre um
painel ao lado com o que fazer: abrir a atividade, revisar a correção e encerrar.

## Contexto necessário

- `techspec.md` seções 5 e 9 (o painel ao lado fica no endereço, `?atividade=`); `prd.md` RF17 e RF22; `mockup.md` 5.2
- Regra 70, itens 1 e 3; D55: atividade é só objetiva, e a aba não tem "Para corrigir" nem "a discursiva é sua". D46:
  acertos e correção, nunca nota
- Código: `AtividadesDaTurma.tsx` (a casca da 10.0, com a lista de `VisaoGeralDaTurma`); `aprovar.ts`
  (`situacaoDaAplicacao`, `semCorrecao`, `TEXTO_SEM_CORRECAO`); `EncerramentoDaAtividade.tsx` (da 6.0);
  `api/atividades.ts` (`consultaAtividadesAplicadas`)

## Subtarefas

- [ ] 11.1 — `AtividadesDaTurma.tsx`: uma `Linha` por atividade, a mais nova primeiro, com título, a situação de hoje
  (`situacaoDaAplicacao`), "N de M enviaram" e o selo do estado em texto (Aberta, Encerrada, Correção para revisar,
  Correção aprovada, Correção rejeitada, Sem correção). Com mais de oito linhas, o `Segmentado` "Todas · Abertas ·
  Para revisar · Encerradas". O painel da atividade em `?atividade=<id>` (`PainelLado`; folha de baixo a 360 px)
- [ ] 11.2 — O painel traz "Abrir a atividade", "Revisar a correção" ou "Ver a correção", "Corrigir de novo" quando não
  há lote, e "Encerrar a atividade" (o `EncerramentoDaAtividade` da 6.0, com a mesma confirmação). A ação da aba,
  "Aplicar uma atividade", leva a Criados com a turma e o tipo (`?turma=<id>&tipo=atividade_objetiva`)
- [ ] 11.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/AtividadesDaTurma.tsx` | alterado (a 10.0 o criou) |
| `apps/web/src/areas/professor/AtividadesDaTurma.test.tsx` | novo |
| `e2e/professor-turma-atividades.spec.ts` | novo (cada aba tem o seu spec; o `professor-turma-aberta.spec.ts` é da 10.0) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| o estado de cada linha | unidade e componente | aberta; encerrada com lote pendente, aprovado e rejeitado; encerrada sem ninguém ter respondido; correção suspensa. Cada uma diz o que é e o que fazer, em texto |
| estados | componente | carregando; erro com "Tentar de novo"; vazio ("Nenhuma atividade aplicada a esta turma", com o caminho para Criados); filtro sem resultado, com "Limpar filtro"; com dado |
| o painel pelo endereço | componente | `?atividade=<id>` abre o painel; id de outra turma ou inexistente não abre painel e a lista segue; Esc fecha, tira o parâmetro e devolve o foco à linha |
| encerrar com a confirmação | e2e | o diálogo diz o que acontece (as respostas param, a correção é feita e espera a professora); dois cliques mandam um pedido só; a linha vira "Encerrada" e o link da correção aparece |
| é avaliativa | e2e | a atividade avaliativa aberta diz que o Tutor está pausado até encerrar (caso de hoje) |
| vocabulário | unidade | nenhum texto da aba tem "nota", "média", "conceito" nem "pontuação"; nada ordena por acerto (D46, D69) |
| "Aplicar uma atividade" | e2e | leva a Criados já filtrado pela turma, sem nome de aluno no endereço |
| recomeço | e2e | recarregar mantém o painel; a segunda pessoa não vê a lista; trocar de turma fecha o painel; resposta atrasada do encerrar não troca o estado da outra turma |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`); o diálogo, de
  `EncerramentoDaAtividade.test.tsx`
- e2e: o encerrar de `aplicar à turma e encerrar, no artefato (A3)` já está na 6.0; aqui o caminho é o painel da aba, que
  chama o mesmo componente. `a3-a4-professor.spec.ts` não muda
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/AtividadesDaTurma.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-turma-atividades.spec.ts`
- Telas: `professora`, `/professor/turmas/:id?aba=atividades`, `--clicar 'role=button[name=/atividade/]'` na linha.
  Mockup: `/professor/turmas/2b?aba=atividades&atividade=<id>`

## Fora do escopo desta tarefa

Prazo, agendada, discursiva e "Corrigir as discursivas" (D55); "Acerto", "Abaixo de 6", "Erros que se repetiram" e a lista
de quem não entregou (F6; a API só devolve a contagem); "Ver as notas"; "Aprovar as notas" no painel (a aprovação é
a tela da 14.0); o botão "Nova atividade" que abre conversa.

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
