# Tarefa 12.0 — Turma › Alunos

**Funcionalidade:** telas-do-professor · **Depende de:** 10.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`, `tenancy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A aba Alunos mostra a lista de nomes da turma em ordem de nome, com os acertos de correção aprovada de cada um, e os pedidos
de nome no alto, com as regras de hoje. A web passa a ler `GET /v1/turmas/:id/alunos`, que o professor da turma já alcança.

## Contexto necessário

- `techspec.md` seções 4, 6, 7 e 12 (a rota nunca foi lida pela web como professor; a API devolve em ordem de id);
  `prd.md` RF18, RF21 e a seção 8; `mockup.md` 5.3
- Regras 10 e 20 (itens 5, 6 e 10); D34, D35 e D46. Sem situação do aluno, sem média, sem ordem por acerto (o Ranking saiu
  de vez), sem selo "Adaptação" por aluno, sem busca nominal e sem "Abrir a conversa"
- Código: `AlunosDaTurma.tsx` (da 10.0: "Por aluno", acesso e pedidos); `ListaDePedidos.tsx`;
  `api/pedidos.ts` (modelo de `gcTime: 0`); `esquemaRespostaAlunosDaTurma`, em `packages/shared`

## Subtarefas

- [ ] 12.1 — `api/alunos-da-turma.ts`: `consultaAlunosDaTurma(turmaId)`, página por página, com `gcTime: 0`, chave
  começando por `alunos-da-turma`. `AlunosDaTurma.tsx`: a lista em ordem de nome (`localeCompare` em `pt-BR`, empate
  pelo id), com os acertos de cada aluno vindos do desempenho aprovado; o aluno sem correção aprovada diz "Sem
  correção aprovada". Confira a rota em `apps/api/test/turma-acesso.int.test.ts` (paginação, auditoria `turma.alunos_lidos`,
  se a leitura do professor leva finalidade) antes de chamar
- [ ] 12.2 — Os pedidos de nome no alto da aba, com a `ListaDePedidos` e as regras de hoje (40 por vez, sem "aprovar todos",
  a confirmação que diz o efeito). O acesso da turma segue como está até a 13.0
- [ ] 12.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/api/alunos-da-turma.ts`, `apps/web/src/api/alunos-da-turma.test.ts` | novo |
| `apps/web/src/areas/professor/AlunosDaTurma.tsx` | alterado (a 10.0 o criou) |
| `apps/web/src/areas/professor/AlunosDaTurma.test.tsx`, `alunos-da-turma.ts`, `alunos-da-turma.test.ts` | novo (mesma pasta; a ordem e a junção dos acertos) |
| `e2e/professor-turma-alunos.spec.ts` | novo |
| `e2e/pedidos.spec.ts` (`W4 e W15, pelo professor`, `W6: a decisão do professor`) | alterado (o caminho até a aba) |

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| a ordem de nome | unidade | a lista chega em ordem de id e sai em ordem de nome; dois alunos de mesmo nome ficam em duas linhas, em ordem estável |
| aluno sem correção aprovada | unidade e componente | aparece com "Sem correção aprovada", e não some nem vira "0 de 0"; correção pendente ou rejeitada não entra na conta |
| nenhuma ordem por acerto | componente | nenhum controle ordena por acerto; a ordem não muda com os números (D69) |
| estados | componente | carregando; erro com "Tentar de novo"; vazio ("A lista ainda não chegou", com o caminho para a coordenação); mais de uma página, com "Ver mais"; com dado |
| a lista não fica no cache | componente | ao sair da aba e voltar, a lista é lida de novo (`gcTime: 0`); nada do nome em `localStorage`, `sessionStorage` ou endereço |
| isolamento | e2e | a turma de outra escola, a de outro professor e a de vínculo pendente respondem "Turma indisponível" e não leem a lista (regra 10, itens 4 e 6); trocar de escola esvazia |
| os pedidos de nome | e2e | os casos de hoje, pela aba: o 41º não é marcável, não há "aprovar todos", a confirmação diz a turma e os nomes, dois cliques decidem uma vez |
| recomeço | e2e | a segunda pessoa na mesma aba não vê a lista nem os pedidos; resposta atrasada da lista não troca a da outra turma. Log: nenhum nome em log da web; a auditoria da leitura é a da API |
| 360 px | e2e | a lista vira linhas de 56 px sem rolar de lado; nome comprido quebra |

## Como testar

- Componente: copie `componentes/pedidos/ListaDePedidos.test.tsx` (`prepararTela`, `redeFalsa`, `segurar`)
- e2e: `W4 (Pedidos) e W15, pelo professor` e `W6: a decisão do professor` em `pedidos.spec.ts`: o caminho passa a ser
  a aba Alunos; títulos e asserções ficam
- Isolado: `npx vitest run --project unidade apps/web/src/areas/professor/AlunosDaTurma.test.tsx`;
  `node tools/ci/e2e.ts --manter-ambiente e2e/professor-turma-alunos.spec.ts e2e/pedidos.spec.ts`
- Telas: `professora`, `/professor/turmas/:id?aba=alunos`, `--clicar 'role=tab[name="Alunos"]'`. Mockup:
  `/professor/turmas/2b?aba=alunos`

## Fora do escopo desta tarefa

A situação ("Atenção: entregas"), a média, o boletim, a ficha do aluno, "Exportar notas", a busca por nome, o selo
"Adaptação" e "Abrir a conversa" (F6, F17, D35, D64, D70); o diálogo de convite (13.0).

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
