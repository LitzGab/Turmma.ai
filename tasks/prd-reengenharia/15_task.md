# Tarefa 15.0 — Estrutura, sala e governança validam pelo `ZodValidationPipe`

**Funcionalidade:** reengenharia · **Depende de:** 14.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Os controllers de `estrutura/`, `sala/` e `governanca/` recebem a entrada pelo `ZodValidationPipe` e pelo `IdPipe` da
14.0 (D81), sem `lerEntrada`, `idDoCaminho`, `lerConsultaPaginada` nem `safeParse`, e entram no bloco do ESLint.

## Contexto necessário

- `onda-1a.md` §2, "T1" (revista pela D81: o `ZodValidationPipe` com `errorCode: NAO_ENCONTRADO` na `chave`,
  `governanca.controller.ts:52`); `techspec.md` §6
- `prd.md` RF5; `.claude/rules/10-multitenancy.md` itens 4 a 6, `80-infra-e-carga.md` item 7, `60-dominio.md` itens 5 e 6
- O que a 14.0 entregou em `packages/nucleo/src/entrada/` e o bloco de `no-restricted-syntax` em `eslint.config.mjs`
- `apps/api/src/governanca/governanca.controller.ts:20` (`chaveDoCaminho`, avaliada antes do corpo)

## Subtarefas

- [ ] 15.1 — Caracterização, num commit antes: o inválido e o 404 de cada rota dos três módulos, incluindo a `chave` e o link da sala
- [ ] 15.2 — Migram os 8 controllers de `estrutura/`, os 4 de `sala/` e os 2 de `governanca/`
- [ ] 15.3 — Os três módulos entram no `files` do bloco de `no-restricted-syntax`
- [ ] 15.4 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/api/src/estrutura/*.controller.ts` (8) | alterado |
| `apps/api/src/sala/*.controller.ts` (4) | alterado |
| `apps/api/src/governanca/governanca.controller.ts`, `analista.controller.ts` | alterado |
| `eslint.config.mjs`, `tools/guardas/guardas.test.ts` | alterado |
| `apps/api/test/{estrutura,estrutura-isolamento,escola-sessao,lista,vinculo,virada-do-ano,salas-reivindicar,acesso-da-turma}.int.test.ts` | alterado |
| `apps/api/src/governanca/governanca.int.test.ts` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| Estrutura: limite 101 e página fora do formato → `ENTRADA_INVALIDA`, 100 passa | integração | `.max(101)` |
| Estrutura: turma de B, no contexto de A → o 404 do inexistente e do fora do formato | integração | tirar o `eq(turma.escolaId, …)` |
| `escola-sessao`: fora de 5 a 480, número quebrado, campo a mais ou faltando → `ENTRADA_INVALIDA`, sem mudar nada | integração | sem `.strict()` |
| `escola-sessao`: professor e aluno, com corpo inválido, → o 404 de rota inexistente | integração | validar antes da guarda |
| Lista: dois alunos com o mesmo nome na turma continuam aceitos | integração | `.refine` de nomes únicos |
| Lista: lote inválido não grava nenhum nome | integração | validação antes da escrita |
| Ano letivo: datas invertidas ou ano repetido dão o código de hoje, e a virada fica verde | integração | caracterização da virada |
| Vínculo: duas disciplinas na mesma turma, dois vínculos | integração | o par turma e disciplina fica |
| Sala: reivindicação inválida → `ENTRADA_INVALIDA`, e o nome continua livre | integração | inválido não reserva nome |
| Sala: dois pedidos no mesmo nome ao mesmo tempo (`Promise.all`) → um fica, o outro com o código de hoje | integração | a restrição do banco continua |
| Sala: link ou código fora do formato → o 404 do inexistente | integração | responder 400 |
| Governança: `chave` fora de `FUNCOES` → 404 | integração | `ENTRADA_INVALIDA` |
| Governança: `chave` de outra função e a inexistente, com o mesmo corpo (válido ou inválido), respondem igual | integração | regra 10.6 |
| Governança: suspender sem finalidade → `ENTRADA_INVALIDA`, função ativa, sem auditoria | integração | inválido não suspende |
| Governança: suspender em A não suspende em B | integração | tirar o `eq(…escolaId…)` da escrita |
| Lint: a fixture da 14.0 em `apps/api/src/{estrutura,sala,governanca}/x.controller.ts` reprova | unidade | tirar o módulo do `files` |

## Como testar

- A borda: copie `apps/api/test/escola-sessao.int.test.ts › borda: fora de 5 a 480 minutos, número quebrado, campo a
  mais (a escola, por exemplo) ou faltando dão ENTRADA_INVALIDA, sem mudar nada` (`:87`) e o `:41` (permissão).
- O isolamento: o caso de `apps/api/test/estrutura-isolamento.int.test.ts:74` ("abrir e encerrar com id de B dão o
  mesmo 404 do inexistente e não mudam nada em B").
- A corrida: `apps/api/test/salas-reivindicar.int.test.ts › C1: dois pedidos no mesmo nome, com a matrícula certa e
  chaves diferentes: um pendente, o outro recusado, nunca 5xx` (`:627`).
- O link: `apps/api/test/acesso-da-turma.int.test.ts › 0, 2, 31, texto e campo a mais são ENTRADA_INVALIDA, e nada é
  gravado nem revogado`.
- Isolado: `npx vitest run --project integracao apps/api/test/escola-sessao.int.test.ts` (troque pelo arquivo do módulo).
- Armadilha: a caracterização entra num commit antes da migração; o corpo do erro se compara inteiro, não só o status.
  Se a ordem entre corpo e caminho mudar (a do Nest), escreva em "Divergências resolvidas", com `onda-1a.md` T1.

## Fora do escopo desta tarefa

Sessão e operação (16.0); atividade, artefato, material, tutor e privacidade (17.0); apagar as funções antigas (17.0).

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

