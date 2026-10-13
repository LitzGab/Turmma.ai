# Tarefa 10.0 — A turma aberta em três abas, com Hoje

**Funcionalidade:** telas-do-professor · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`, `tenancy-guardian`
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
- [ ] 10.2 — `TurmaHoje.tsx`: o aviso de atenção humana no alto, **sem abrir painel e sem nome de aluno**, com a
  contagem, a hora e o que fazer (Hoje é a aba que a professora projeta em sala: D34, D36, art. 14); "Sinais da turma",
  em agregado; "O que o Tutor faz sozinho" e o bloco "Quando o Tutor avisa você"; o "Acerto por habilidade". Hoje lê
  `consultaSinais` ao abrir, com `refetchInterval` de 15 s enquanto a aba está à vista; "não relê por tempo" vale só
  para o sino. O nome só aparece por ação explícita ("Ver quem"), no `PainelLado` em `?ver=tutor`, com os "Sinais por
  aluno" e `consultaUsoDoTutor`, em ordem de nome. Só a leitura de `consultaUsoDoTutor` espera o painel: os "Sinais por aluno" saem da mesma `consultaSinais` que
  Hoje já leu, e o que espera o painel é **mostrar** os nomes (eles ficam em memória, fora da tela); a rota nominal de
  `api/tutor-da-turma.ts` além dos sinais não sai sem `?ver=tutor`. O aviso que chega aos 15 s entra sem piscar,
  sem som e sem mover o foco, com `aria-live="polite"`. "Ver quem" é botão dentro do aviso, e o painel começa pela lista
  de atenção humana. Com o painel fechado, `consultaSinais` não traz linha por aluno à tela
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
| atenção humana sem nome nem conteúdo | componente e e2e | Hoje recém-aberta, com sinal de atenção: o aviso está no alto, sem abrir painel, com contagem, hora e o que fazer, e **nenhum nome de aluno no DOM** nem texto de mensagem; o nome só aparece depois de "Ver quem". O aviso some quando não há sinal. Mutação: renderizar o nome no aviso deixa o teste vermelho |
| Hoje relê os sinais | componente | relógio falso: aos 15 s sai nova leitura, e o sinal novo aparece no alto sem recarregar. Mutação: tirar o `refetchInterval` deixa o teste vermelho |
| sem painel, sem rota nominal | componente | sem `?ver=tutor`, só `consultaSinais` é chamada; nenhuma outra rota de `api/tutor-da-turma.ts` (uso por aluno); nenhum nome de aluno no DOM, e nenhuma consulta `CHAVE_DO_USO_DO_TUTOR` no `QueryCache` (os nomes dos sinais ficam em memória, na resposta de `consultaSinais`, e não na tela). Ao fechar o painel, os nomes saem da tela e a consulta de uso sai do cache, por `gcTime: 0`. Com Atividades ou Alunos aberta, ou a aba escondida (`focusManager.setFocused(false)`, restaurado no `afterEach`), nenhuma leitura aos 15 s; mutação: o intervalo sem a condição da aba à vista deixa o teste vermelho. O aviso novo traz `aria-live="polite"` e não move o foco. Mutação: tirar a condição do painel deixa o teste vermelho |
| vocabulário | unidade | o teste de `aprovar.test.ts` é estendido aos textos de Hoje; "Média de acertos" vira "acerto médio" |
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
