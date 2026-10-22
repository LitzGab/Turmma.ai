# Tarefa 51.0 — Resposta atrasada não sobrescreve, nem depois do F5 nem em outra aba

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `infra-guardian`, `tenancy-guardian`, `frontend-reviewer`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

O `PUT` da resposta da prova leva uma `sequencia`, e o banco só grava a mais nova: o reenvio atrasado, o F5 e a outra
aba não trocam a escolha mais recente do aluno (regra 80.6, RF21). É a tarefa da linha da web.

## Contexto necessário

- `onda-3c.md` T13, "51.0, a sequência", e o §3 ("Prova", "Outra aba"); `techspec.md` §7c; `prd.md` RF21 (§11)
- Regras 80.6 e 80.7 (concorrência no banco, não "verifica e depois grava"), 10.3, 50 (alvo de 44 px, `role="status"`)
- `apps/api/src/atividade/minha-atividade.repository.ts` › `responder` (o `onConflictDoUpdate` de hoje) e `respostas`
- `packages/shared/src/atividade/prova.ts` › `esquemaPedidoResponderQuestao`, `esquemaRespostaQuestaoSalva`, a leitura da prova
- `apps/web/src/areas/aluno/respostas.ts` (a fila pura) e `fila-de-respostas.ts` (a fila com rede), `Atividade.tsx`

## Subtarefas

- [ ] 51.1 — Caracterização, num commit antes: os cinco reenvios em `Promise.all` e a troca de alternativa, como hoje
- [ ] 51.2 — Migration: `resposta_atividade.sequencia bigint not null default 0`, sob `lock_timeout`, e o schema Drizzle
- [ ] 51.3 — `shared`: `sequencia` opcional no pedido e presente na resposta salva e na lida (`z.number().int().nonnegative()`)
- [ ] 51.4 — O upsert grava só `where excluded.sequencia > resposta_atividade.sequencia`; o `PUT` que perde devolve a gravada; sem `sequencia`, grava `resposta_atividade.sequencia + 1`
- [ ] 51.5 — A web: a fila manda `max(local, servidor) + 1`; a aba que perde adota a do servidor, não reenvia e mostra o aviso
- [ ] 51.6 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/drizzle/0037_sequencia_da_resposta.sql`, `packages/nucleo/drizzle/meta/` | novo e alterado |
| `packages/nucleo/src/db/schema/resposta-atividade.ts` | alterado |
| `packages/shared/src/atividade/prova.ts`, `packages/shared/src/atividade/atividade.test.ts` | alterado |
| `apps/api/src/atividade/minha-atividade.repository.ts`, `minha-atividade.service.ts`, `minha-atividade.controller.ts` | alterado |
| `apps/api/src/atividade/atividade.int.test.ts` | alterado |
| `apps/web/src/areas/aluno/respostas.ts`, `respostas.test.ts`, `fila-de-respostas.ts`, `atividade.ts`, `Atividade.tsx` | alterado |
| `apps/web/src/areas/aluno/Atividade.test.tsx` | novo |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| `sequencia` 5 e 7 em `Promise.all`, nas duas ordens → fica a 7, 20 repetições | integração | tirar o `where excluded.sequencia > …` |
| A 5 chega depois da 7 → responde 200 com a 7 gravada (alternativa e `sequencia`) | integração | devolver o que foi pedido |
| Cliente antigo (sem `sequencia`) e depois o novo com `servidor + 1` → o novo vence; o antigo sobe a sequência em 1 | integração | gravar 0 sem `sequencia` |
| Os cinco reenvios iguais continuam uma linha só | integração | caracterização |
| `sequencia` negativa, texto ou chave a mais → `ENTRADA_INVALIDA`, nada gravado | integração | sem `.strict()` |
| Aluno de A com a atividade de B → o mesmo 404 do inexistente | integração | tirar o `eq(…escolaId…)` |
| Depois do envio, `ATIVIDADE_ENCERRADA` com qualquer `sequencia` | integração | o prazo não muda |
| A fila manda `max(local, servidor) + 1`, e a escolha nova depois da leitura vence | unidade | mandar `local + 1` |
| A aba que perde adota a `sequencia` do servidor e não manda nada | unidade | "reenviar sobrescreve a mais nova" |
| Na tela: o aviso "Sua resposta foi alterada em outra janela" em `role="status"`, e a alternativa que ficou marcada | unidade | o aviso fora do `status`; a alternativa local |
| Migration aplicada sobre linhas antigas: todas com `sequencia` 0 | integração | sem `default 0` |

## Como testar

- A corrida: copie `apps/api/src/atividade/atividade.int.test.ts › o aluno responde › a resposta é gravada de forma
  idempotente: a mesma questão duas vezes, e cinco ao mesmo tempo depois da queda de rede, …` (o `Promise.all` de
  `rotas.responder`), trocando os cinco iguais por 5 e 7.
- O isolamento: o mesmo `describe`, com `montarEscolaComAssistente` duas vezes (A e B).
- A fila: `apps/web/src/areas/aluno/respostas.test.ts › a fila das respostas ainda não salvas › a última escolha da mesma
  questão é a que vale`, e `› o reenvio das respostas` para a rede.
- A tela: `renderizarTela` e `redeFalsa` (`apps/web/src/__fixtures__/tela.tsx`), no molde de
  `apps/web/src/areas/coordenacao/Governanca.test.tsx`.
- A migration: a última de `packages/nucleo/drizzle/` como molde, gerada pelo `drizzle-kit`, com `set lock_timeout`.
- Isolado: `npx vitest run --project integracao apps/api/src/atividade/atividade.int.test.ts` e
  `npx vitest run --project unidade apps/web/src/areas/aluno`.
- Armadilha: a tabela cresce com aluno (regra 80.8); a coluna nova não precisa de índice, porque a escrita já vai pelo
  índice único do escopo. A `sequencia` é do aluno da sessão: nunca vem com `alunoId`.

## Fora do escopo desta tarefa

O espelho em `sessionStorage` (53.0), o prazo do `fetch` e o "Tentar de novo" (52.0, X6) e o corte da tela (onda 4, X6).

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

