# Tarefa 53.0 — Pendente sobrevive ao F5 e à sessão vencida

**Funcionalidade:** reengenharia · **Depende de:** 51.0
**Subagentes obrigatórios:** `privacy-guardian`, `infra-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** pequeno
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

A escolha da prova que o servidor ainda não confirmou sobrevive ao F5, à aba reaberta e à sessão que vence com o mesmo
aluno, guardada só com ids em `sessionStorage`; outra pessoa no mesmo Chromebook nunca a vê (RF21, regra 80.6). É da
linha da web, depois da 51.0.

## Contexto necessário

- `onda-3c.md` T13, "53.0, o espelho da prova", e o §3 ("Espelho"); `prd.md` RF21 e §8 (a linha "Escolha pendente no
  `sessionStorage`"); regras 20 (só ids, sem nome, sem resposta de texto) e 80.6
- `apps/web/src/areas/aluno/fila-de-respostas.ts` (a fila em memória, `parar`, `aoTrocarDeSessao`) e `respostas.ts`
  (`esperaAntesDeTentar`, o recuo que ganha jitter)
- `apps/web/src/api/sessao.ts:73` (hoje diz que nada da sessão vive em `sessionStorage`: o espelho não é sessão, e o
  comentário passa a dizer isso), `:110-115` (`quemEstaNaAba`, o `usuarioId` que separa "a mesma pessoa voltou" de
  "sentou outra pessoa"), `:316` (`usuarioAntesDeVencer`)
- O que a 51.0 entregou: a `sequencia` de cada pendente

## Subtarefas

- [ ] 53.1 — `espelho-da-fila.ts`: uma chave por atividade, `{ dono: usuarioId, atividade, pendentes: [{ questao, alternativa, sequencia }] }`, lido por esquema zod estrito; inválido ou de outro dono é descartado
- [ ] 53.2 — A fila grava o espelho a cada mudança e hidrata dele ao abrir, só com o mesmo dono
- [ ] 53.3 — Limpa no envio, no "Sair" e na troca de dono; **não** limpa na sessão vencida
- [ ] 53.4 — O recuo de `esperaAntesDeTentar` ganha ±25 % de jitter
- [ ] 53.5 — `docs/lgpd.md`: a linha da escolha pendente no `sessionStorage` (só ids; até o envio, o "Sair", a troca de dono ou o fechamento da aba)
- [ ] 53.6 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/aluno/espelho-da-fila.ts`, `espelho-da-fila.test.ts` | novo |
| `apps/web/src/areas/aluno/fila-de-respostas.ts`, `respostas.ts`, `respostas.test.ts`, `Atividade.test.tsx` | alterado |
| `apps/web/src/api/sessao.ts` (o comentário de `:73`, e o aviso de "Sair" se a fila precisar dele) | alterado |
| `docs/lgpd.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| F5 com duas pendentes: a fila nova hidrata as duas, com a `sequencia`, e as manda | unidade | não hidratar |
| Sessão vencida e o mesmo aluno volta: as pendentes ficam e saem | unidade | limpar na sessão vencida |
| Outro dono (inclusive na aba reaberta, em que o Chrome devolve o `sessionStorage`): descarta, nada é mandado nem mostrado | unidade | hidratar sem conferir o dono |
| "Sair": limpa o espelho de todas as atividades | unidade | limpar só a atual |
| Duas atividades: cada uma hidrata a sua | unidade | chave sem a atividade |
| Envio confirmado: a pendente sai do espelho | unidade | gravar só na entrada |
| Espelho com campo a mais, nome, texto ou tipo errado: descartado inteiro | unidade | esquema sem `.strict()` |
| `sessionStorage` que lança (cota, modo restrito): a fila segue em memória, sem erro na tela | unidade | sem `try/catch` |
| O jitter fica entre 75 % e 125 % da espera e respeita o teto | unidade | sem jitter; passar do teto |

## Como testar

- A fila: copie `apps/web/src/areas/aluno/respostas.test.ts › o reenvio das respostas › a sessão que acaba esvazia a
  fila: nada da pessoa anterior é mandado nem mostrado à seguinte` (é o caso do outro dono) e `› a resposta que falha ao
  salvar continua marcada e é mandada de novo sozinha…` (é o caso do F5, com uma fila nova sobre o mesmo espelho).
- A troca de dono: `apps/web/src/api/sessao.test.ts › limpa o que vive fora do módulo (o cache de consultas) em todo
  caminho que muda o dono da aba`.
- O recuo: `respostas.test.ts › a espera entre as tentativas cresce e tem teto…`, com `Math.random` fixado por `vi.spyOn`.
- Isolado: `npx vitest run --project unidade apps/web/src/areas/aluno apps/web/src/api/sessao.test.ts`.
- Armadilha: o espelho guarda id de atividade, número de questão, índice de alternativa e `sequencia`; nunca o enunciado,
  o nome do aluno nem o `usuarioId` em texto legível além do campo `dono`. `localStorage` não: sobreviveria à aba fechada.

## Fora do escopo desta tarefa

O prazo do `fetch` e o "Tentar de novo" (52.0, X6); o corte da tela da Atividade (onda 4, X6).

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
`+` entra, com espaço é contexto. Cláusula que só vale no celular leva a linha `projeto: celular` depois de
`teste:` (só em teste de e2e; sem ela o caso roda no `chromebook`). Sem cláusula nova, escreva "nenhuma".

```mutacao
arquivo: [caminho do arquivo que tem a cláusula]
teste: [caminho do teste] › [nome do caso]
  [linha de contexto, que fica]
- [a cláusula que sai]
```

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. Destino `TODO.md` é a linha já escrita no `TODO.md`, no commit da tarefa, e
não promessa. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem nenhuma, escreva
"nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

