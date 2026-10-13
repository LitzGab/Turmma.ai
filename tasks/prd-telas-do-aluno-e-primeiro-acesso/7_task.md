# Tarefa 7.0 — Eu: a turma, como estou indo, Privacidade e Sair

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** 2.0
**Subagentes obrigatórios:** `frontend-reviewer`, `conformidade-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Eu mostra a turma, "Como estou indo" com as tarefas de correção aprovada e as linhas "Privacidade" e "Sair", sem dado de colega.

## Contexto necessário

- `techspec.md` seções 7b e 9 ("Eu"); `prd.md` RF3, RF9, RF10 e RF20, e o caso do aluno transferido (seção 7); `mockup.md` seção 2.5
- Regras 20 (item 14), 50 (itens 5 e 9) e 70 (itens 3 e 4d); D66
- Código: `areas/aluno/Eu.tsx` (da 2.0: cartão da turma e as linhas); `api/minha-turma.ts`;
  `esquemaRespostaMemoriaDoTutor` em `packages/shared/src/tutor/tutor.ts`
- A 3.0 corre junto: esta tarefa **não edita** `api/tutor.ts` nem `e2e/__fixtures__/aluno.ts`

## Subtarefas

- [ ] 7.1 — `consultaMemoriaDoTutor`, em `api/memoria-do-tutor.ts`: `GET /v1/tutor/memoria`, com a `queryFn` (não o `select`) devolvendo só
  os `trabalhos` com `resultado` não nulo e **descartando os `sinais`**, para não irem ao cache. Chave própria; esvaziada com a sessão,
  nunca em armazenamento do navegador. Mostra os 50 mais recentes (o teto da API). Aluno sem turma (`NAO_ENCONTRADO`) é "sem resultado"
- [ ] 7.2 — "Como estou indo" em `ComoEstouIndo.tsx`: uma linha por tarefa corrigida, com o título, "N de M certas" (texto e
  `BarraRotulada` neutra) e as habilidades a rever **como a API mandou** (`aReforcar`, código e descrição), na ordem dela. Sem
  limiar, sem "Vale revisar", sem matéria, sem professor. O vazio: "Nada corrigido ainda" e "Depois que quem dá a aula aprovar a
  primeira correção, ela aparece aqui." Uma linha "Achou algo errado? Fale com quem dá a aula." (contestação até o F9, regra 70, item 4d). Eu fica na ordem: cartão da turma,
  "Como estou indo", linhas
- [ ] 7.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/api/memoria-do-tutor.ts`, `apps/web/src/areas/aluno/como-estou-indo.ts`, `apps/web/src/areas/aluno/como-estou-indo.test.ts` | novo |
| `apps/web/src/areas/aluno/ComoEstouIndo.tsx`, `apps/web/src/areas/aluno/Eu.test.tsx`, `e2e/aluno-eu.spec.ts`, `e2e/__fixtures__/memoria-do-aluno.ts` | novo |
| `apps/web/src/areas/aluno/Eu.tsx`, `e2e/minha-turma.spec.ts` | alterado |

`memoria-do-aluno.ts`, que já existe, é o ciclo do Tutor e não muda.

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| só correção aprovada | componente | o trabalho com `resultado: null` não aparece, nem a contagem dele; só o de resultado |
| sinais fora | componente | a memória chega com `sinais`, e nada deles vai à tela nem ao cache |
| nada de colega (RF10) | componente | a varredura de texto não acha média, posição, ranking, pontos nem sequência; a rede vê só turma e memória |
| quatro estados | componente | carregando; vazio ("Nada corrigido ainda"); erro com "Tentar de novo" sem derrubar o cartão da turma; com dado |
| borda: sem turma no ano | componente | o texto de hoje no cartão, e "Como estou indo" segue |
| borda: aluno transferido | integração (existente) | confira que `/v1/tutor/memoria` só traz a turma do ano; se não trouxer, pare e avise, a API não muda aqui |
| armazenamento vazio | e2e | depois de abrir Eu, `localStorage`, `sessionStorage` e IndexedDB seguem vazios |
| recomeço da tela | e2e | o aluno seguinte no mesmo computador vê o Eu dele; a resposta atrasada do anterior não aparece |
| 360 px | e2e | sem rolagem lateral; "Sair" e "Privacidade" com 44 px |

Concorrência não se aplica (só leitura). Log: nenhuma linha nova.

## Como testar

- Copie `apps/web/src/componentes/pedidos/ListaDePedidos.test.tsx`; os dados vêm de `e2e/__fixtures__/memoria-do-aluno.ts`
  (`trabalhoNaMemoria({ resultado })`)
- Os quatro casos de `e2e/minha-turma.spec.ts` (já em `/aluno/eu`, pela 2.0) seguem verdes; muda só o que o cartão ganha em volta
- Rodar: `npx vitest run --project unidade apps/web/src/areas/aluno/Eu.test.tsx` e
  `node tools/ci/e2e.ts --manter-ambiente e2e/aluno-eu.spec.ts`
- Telas: `aluno`, `/aluno/eu` (pelo item "Eu"; com e sem tarefa corrigida; sem turma); mockup `/aluno/eu`

## Fora do escopo desta tarefa

Desempenho por assunto, "Vale revisar" com limiar e "A prof. pediu" (D66 e F9); contestar a memória, pedir dados e "O que o Tutor
lembra" com sessões (F9); o diálogo "Ajustes" (8.0) e "Rever a introdução" (9.0); onça no vazio; trocar a senha (F2).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa (`/executar-task`, passo 2). Uma linha por decisão que se afasta da
Tech Spec, do `cenarios.md` ou da subtarefa. A coluna "Onde está na spec" é preenchida **antes dos
revisores**: divergência sem ela está só na tarefa, e o `revisor-geral` reprova (foram quatro
reprovações na A1). Sem nenhuma, escreva "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, id do `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa (`/executar-task`, passo 2): um bloco por cláusula que o diff
acrescenta, inclusive as que a tabela de testes não cita e as cópias da mesma regra em outro arquivo.
O portão da tarefa aplica cada bloco, roda o teste citado e exige vermelho. Linha com `-` sai, com
`+` entra, com espaço é contexto. Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada pelo hook tools/processo/revisoes.ts: não a escreva à mão nem acrescente seção depois dela. -->
