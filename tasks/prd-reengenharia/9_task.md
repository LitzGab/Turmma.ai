# Tarefa 9.0 — Importar tabela fora de repository reprova o lint

**Funcionalidade:** reengenharia · **Depende de:** 6.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

A guarda `guardas/tabela-so-no-repository` reprova importar de `@educa/nucleo` uma tabela do schema fora de
`*.repository.ts`, de teste e de `packages/nucleo/src/db/**`, e não pode ser desligada por comentário.

## Contexto necessário

- `onda-1a.md` §2, "T6", "Tabela só no repository (9.0)"; `techspec.md` §6; `prd.md` RF9
- Regra 00, item 3; regra 10, item 3
- `tools/guardas/index.mjs`: `guardas.rules`, `REGRAS_DAS_GUARDAS` e `EXCECOES_DAS_GUARDAS`; `tools/guardas/eslint-das-guardas.ts`,
  a segunda passada que ignora `eslint-disable`
- Hoje só `apps/api/src/assistente/time.service.ts` viola, e a 6.0 tira de lá a classe que importa `suspensaoDeFuncao`
- A 13.0 também edita `tools/guardas/index.mjs`: em série

## Subtarefas

- [ ] 9.1 — `tools/guardas/tabelas-do-nucleo.mjs`: a lista dos nomes de tabela exportados por `@educa/nucleo`
- [ ] 9.2 — A regra, em `tools/guardas/regras-tenant.mjs`, registrada em `index.mjs` e em `REGRAS_DAS_GUARDAS`, cobrindo
  import, alias, reexport e namespace
- [ ] 9.3 — Testes: um `describe` em `tools/guardas/guardas.test.ts` com as fixtures, e o teste da lista contra as
  exportações `PgTable`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/guardas/regras-tenant.mjs` | novo |
| `tools/guardas/tabelas-do-nucleo.mjs` | novo |
| `tools/guardas/tabelas-do-nucleo.test.ts` | novo |
| `tools/guardas/index.mjs` | alterado |
| `tools/guardas/guardas.test.ts` | alterado |
| `tools/guardas/__fixtures__/tabela-fora-do-repository.ts` | novo |

## Testes que provam a regra

Unidade.

| Cenário | O que prova | Mutação |
|---|---|---|
| Fixture como `apps/api/src/x/x.service.ts`: `import { escola } from '@educa/nucleo'` | reprova, na linha marcada | tirar a regra da configuração |
| A mesma como `x.repository.ts` | passa no repository | aplicar a regra a `*.repository.ts` |
| A mesma como `x.int.test.ts` | passa em teste | apagar a exceção de teste |
| A mesma como `packages/nucleo/src/db/schema/x.ts` | passa no schema | apagar a exceção de `db/**` |
| A mesma como `infra/scripts/x.ts` e `tools/x.ts` | fora de `apps/*/src` também reprova | restringir a `apps/**` |
| Fixture: `import { escola as e }` | alias não escapa | comparar só o nome local |
| Fixture: `export { escola } from '@educa/nucleo'` num service | reexport não escapa | olhar só `ImportDeclaration` |
| Fixture: `import * as nucleo` e `nucleo.escola` num service | namespace não escapa (ou o limite declarado, com fixture que fixa "passa") | não seguir o membro |
| Fixture: `import { exigirEscolaDoContexto, type Banco }` num service | nome que não é tabela passa | reprovar todo import do pacote |
| `// eslint-disable-next-line guardas/tabela-so-no-repository` | a segunda passada reprova igual | deixar a regra fora de `REGRAS_DAS_GUARDAS` |
| `tabelas-do-nucleo.mjs` contra as exportações `PgTable`, nos dois sentidos | tabela nova entra, e o que não é tabela sai | apagar `suspensaoDeFuncao` da lista |
| Repositório real: zero violações | vale hoje | devolver o import de `suspensaoDeFuncao` a `time.service.ts` |

Sem isolamento em banco (a trava é estática), concorrência nem log.

## Como testar

- Fixture com marca "reprova: <regra>" e caminho simulado: `tools/guardas/guardas.test.ts › guarda de SDK de provedor de IA ›
  reprova import, alias, subcaminho, export, require, import() e typeof import() em %s` (`lintar`, `marcasDeViolacao`), e
  o par "deixa o mesmo código passar dentro dos adaptadores"
- Comentário que desliga: `guardas.test.ts › guarda desligada por comentário`
- Lista contra o pacote: `apps/api/test/arquitetura.test.ts` usa `is(valor, PgTable)` de `drizzle-orm` sobre `import * as
  nucleo from '@educa/nucleo'`
- Isolado: `npx vitest run --project unidade tools/guardas/guardas.test.ts tools/guardas/tabelas-do-nucleo.test.ts`
- Armadilha: regra em `warn` não reprova (`--max-warnings=0` só no lint inteiro); registre como `error`

## Fora do escopo desta tarefa

O depcruise e as camadas (12.0).

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

