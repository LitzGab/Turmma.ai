# Tarefa 10.0 — A turma aberta em três abas, com Hoje

**Funcionalidade:** telas-do-professor · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A turma aberta tem as abas Hoje, Atividades e Alunos no endereço. Hoje reúne o que "Seu time › Tutor" mostrava (atenção
humana, sinais, uso do Tutor) e o acerto por habilidade. O endereço antigo do Tutor leva para lá.

## Contexto necessário

- `techspec.md` seções 5 ("Abas no endereço", "Seu time"), 7, 7b e 9; `prd.md` RF2, RF6, RF15, RF16 e RF21; `mockup.md`
  5 e 5.1 (só a composição; a faixa da aula, "Quem precisa de atenção" e "Gerar revisão" não entram)
- Regras 70 (itens 4 e 7) e 20 (item 14); D34, D36, D69: sinal é fato do trabalho, a atenção humana vai sem conteúdo,
  nada abre conversa de aluno
- Código: `Turma.tsx` (abas em `useState`); `VisaoGeralDaTurma.tsx`; `Tutor.tsx`; `sinais.ts`; `api/tutor-da-turma.ts`
  (leituras nominais com `gcTime: 0`)

## Subtarefas

- [ ] 10.1 — `Turma.tsx`: Hoje, Atividades e Alunos em `?aba=` (`replace`; sem valor ou valor desconhecido, Hoje). O
  conteúdo de `VisaoGeralDaTurma.tsx` muda de aba sem mudar: o "Acerto por habilidade" vai a Hoje; "Atividades da
  turma", a `AtividadesDaTurma.tsx`; "Por aluno", com o acesso e os pedidos de hoje, a `AlunosDaTurma.tsx`. Os dois
  arquivos nascem aqui como cascas finas, para a 11.0 e a 12.0 não editarem o `Turma.tsx`. A tela some com a
  `VisaoGeralDaTurma.tsx`. O `h1` "Turma <nome>" e o "Voltar para Turmas" ficam
- [ ] 10.2 — `TurmaHoje.tsx`: a atenção humana no alto, sem conteúdo; "Sinais da turma", em agregado; "O que o Tutor
  faz sozinho"; o "Acerto por habilidade". Um botão abre o `PainelLado` em `?ver=tutor` com os sinais por aluno e o uso
  do Tutor por aluno, em ordem de nome. As leituras nominais só saem com o painel aberto
- [ ] 10.3 — `Tutor.tsx` vira redirecionamento (`replace`): uma turma confirmada leva a `…/turmas/:id?aba=hoje`; mais
  de uma, a `/professor/turmas`; a fixture `professor/tutor.ts` (`abrirSinaisDoTutor`) aponta para Hoje
- [ ] 10.4 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/professor/Turma.tsx`, `Tutor.tsx` | alterado (em `apps/web/src/areas/professor/`) |
| `TurmaHoje.tsx`, `AtividadesDaTurma.tsx`, `AlunosDaTurma.tsx`, `TurmaHoje.test.tsx`, `Turma.test.tsx` | novo (mesma pasta) |
| `apps/web/src/areas/professor/VisaoGeralDaTurma.tsx` | removido |
| `e2e/professor-turma-aberta.spec.ts`, `e2e/professor-tutor.spec.ts`, `e2e/__fixtures__/professor/tutor.ts` | alterado (a 2.5 e a 2.4 os criaram) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| a aba pelo endereço | componente | `?aba=alunos` abre Alunos; sem aba ou `?aba=visao-geral`, Hoje; trocar usa `replace`; `?ver=tutor` fora de Hoje não abre painel |
| estados de Hoje | componente | carregando; erro único com "Tentar de novo"; sem sinal, o vazio que diz o que o Tutor avisa (regra 50, item 6); sem correção aprovada, o vazio tracejado do acerto; com dado |
| atenção humana sem conteúdo | componente | só nome, hora e o que fazer; nenhum texto de mensagem; o aviso some quando não há sinal |
| nada abre conversa de aluno | componente e e2e | nenhuma linha, botão ou link do painel leva a conversa; sem tempo parado, ordem por recência nem lista de quem não usou |
| o acerto por habilidade | componente | só de correção aprovada; barra neutra; nenhum aluno em ordem de acerto |
| o endereço antigo do Tutor | e2e | `/professor/time/tutor` com uma turma leva a Hoje; com duas, a Turmas; sem turma confirmada, a Turmas |
| os blocos do Tutor | e2e | atenção, sinais, uso por aluno e funções do Tutor estão em Hoje; os do Assistente, pelo sino |
| isolamento e nome do aluno | e2e | a turma de outra escola e a inexistente respondem "Turma indisponível"; nome de aluno não vai a endereço nem a armazenamento; fechar o painel solta os nomes |
| recomeço | e2e | recarregar mantém aba e painel; a segunda pessoa não vê a turma; vínculo encerrado tira a página. Concorrência não se aplica: só leitura |

## Como testar

- Componente: copie `ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`)
- e2e: `a turma aberta: Visão Geral e Alunos (D69)` e `o Tutor na lateral…` (divididos pela 2.5). Muda o caminho até os
  blocos (aba e painel) e o `h1`; nenhuma asserção de regra
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/TurmaHoje.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-turma-aberta.spec.ts e2e/professor-tutor.spec.ts`
- Telas: `professora`, `/professor/turmas/:id`, `--clicar 'role=button[name=/uso do Tutor/]'`. Mockup:
  `/professor/turmas/2b?aba=hoje&ver=tutor`

## Fora do escopo desta tarefa

A faixa da aula, o assunto para revisar, "Quem precisa de atenção", "Gerar revisão", os ajustes da turma, o menu de
trocar de turma e a aula ao vivo (F6, F8, F10, D64); o sinal do Tutor no sino; Atividades (11.0); Alunos (12.0).

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
