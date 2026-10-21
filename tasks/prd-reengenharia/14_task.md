# Tarefa 14.0 — Handler sem esquema derruba o boot; sistema, IA, entrega, assistente e professores migram

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Nasce `packages/nucleo/src/entrada/` (pipe, decorators, conferência no boot); cinco módulos migram.

## Contexto necessário

- `onda-1a.md` §2 "T1" e §3; `techspec.md` §6 e §12 (a premissa, provada primeiro); `prd.md` RF5; regras 10.3, 10.6, 20.9, 20.11, 00.9
- Molde: `packages/nucleo/src/permissao/conferencia-das-permissoes.ts`, registrada em `apps/api/src/app.module.ts:131`
- Sai depois: `apps/api/src/estrutura/entrada.ts:8` (`idDoCaminho`)

## Subtarefas

- [ ] 14.1 — Caracterização, num commit antes: o inválido e o 404 de cada rota dos cinco módulos, e o uuid em maiúsculas
- [ ] 14.2 — `PipeDeEntrada`, `@Corpo`, `@Consulta`, `@IdDoCaminho`, `@IdDoCaminhoOuNada`, `@DoCaminho`, `@SemEntrada` e `SEM_ENTRADA`
- [ ] 14.3 — `ConferenciaDasEntradas` no `onModuleInit`, com a lista de pendentes que só encolhe
- [ ] 14.4 — `guardas/sem-req-cru` em `tools/guardas/`, na segunda passada
- [ ] 14.5 — Migram `sistema/`, `ia/`, `entrega/`, `assistente/` e `professores/`
- [ ] 14.6 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/entrada/*.ts` (pipe, decorators, `sem-entrada.ts`, conferência, pendentes) | novo |
| `packages/nucleo/src/entrada/entrada.test.ts`; `packages/nucleo/src/index.ts` | novo; alterado |
| `apps/api/src/app.module.ts`; `apps/api/test/entrada-no-boot.test.ts` | alterado; novo |
| `apps/api/src/{sistema,ia,entrega,assistente,professores}/*.controller.ts` | alterado |
| `tools/guardas/index.mjs`, `tools/guardas/guardas.test.ts`, `tools/guardas/__fixtures__/req-cru.ts` | alterado e novo |
| os `*.int.test.ts` dos cinco módulos | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| Controller sintético com `@Corpo`: o esquema sai de `ROUTE_ARGS_METADATA` pelo índice | unidade | o decorator não gravar |
| Módulo sem `APP_PIPE`: corpo ou `@Consulta` inválidos → 400 `ENTRADA_INVALIDA` | integração | pipe só global; `@Consulta` sem pipe |
| A resposta do inválido é exatamente `{ codigo: 'ENTRADA_INVALIDA' }` | integração | repassar `issues` |
| Sentinela do corpo inválido fora do log (`CapturaDeDadoPessoal`) | integração | logar `issues` |
| Corpo com `escolaId` de B → `ENTRADA_INVALIDA`, nada gravado | integração | sem `.strict()` |
| `@IdDoCaminho` fora do formato → o 404 do inexistente | integração | responder 400 |
| `@IdDoCaminho` normaliza maiúsculas | unidade | tirar o `.toLowerCase()` |
| Uuid de B em maiúsculas, no contexto de A → 404 | integração | tirar o `eq(…escolaId…)` |
| `@IdDoCaminhoOuNada` fora do formato → `undefined` | unidade | lançar `NAO_ENCONTRADO` |
| `@DoCaminho` fora do esquema → 404 | unidade | `ENTRADA_INVALIDA` |
| Caminho e corpo inválidos juntos → sempre 404, em 20 repetições | integração | validar o corpo antes |
| Sem sessão e corpo inválido → 401 | integração | pipe antes das guardas |
| Professor em rota da coordenação com corpo inválido → 404, sem auditoria | integração | pipe antes das guardas |
| Boot com `@Body()`, `@Query()` ou `@Param()` cru, sozinho ou ao lado de `@Corpo` → cai, com controller e método | unidade | tirar a conferência; conferir só o primeiro |
| `@SemEntrada('chave-da-lista')` sobe; chave fora não compila | unidade | aceitar `string` |
| Motivo de `SEM_ENTRADA` com 30 caracteres ou mais | unidade | `> 0` |
| Pendente que já tem esquema, ou inexistente, reprova; handler novo fora da lista cai | unidade | aceitar o pendente conforme |
| `sem-req-cru`: `requisicao.body`, `.query` e `.params` reprovam; `headers.authorization` passa | unidade | tirar a regra |
| `sem-req-cru` com `eslint-disable` → a segunda passada reprova | unidade | não acrescentar |
| `ia`: execução de outra pessoa, de outra escola, inexistente e fora do formato → o mesmo 404 | integração | tirar o `eq(…escolaId…)` |
| `assistente`: corpo inválido → nenhuma execução nem consumo | integração | o pipe passar `undefined` |
| `professores`: limite 101 reprova, 100 passa | integração | `.max(101)` |
| `sistema` e `entrega`: o inválido igual ao da caracterização | integração | caracterização |
| `permissao-no-boot.test.ts` verde | unidade | conferências somadas |

## Como testar

- Boot: copie `apps/api/test/permissao-no-boot.test.ts › … › rota sem @Permite, sem @RotaAnonima e sem marcador da
  operação derruba o boot…`, com `subir` e `moduloCom`.
- Isolamento: `apps/api/src/ia/ia.int.test.ts › de outra pessoa, de outra escola, inexistente e com id fora do formato
  respondem igual: 404, o mesmo corpo` (`:677`).
- Log: `CapturaDeDadoPessoal` (`apps/api/test/captura-de-dado-pessoal.ts`), com `subirApi` (`api-com-sessao.ts`).
- Guarda: fixture com `reprova:`, como em `tools/guardas/guardas.test.ts`.
- Isolado: `npx vitest run --project unidade packages/nucleo/src/entrada apps/api/test/entrada-no-boot.test.ts` e
  `npx vitest run --project integracao apps/api/src/ia/ia.int.test.ts`.
- Armadilha: os pipes de parâmetro rodam em paralelo; as 20 repetições seguram a ordem.

## Fora do escopo desta tarefa

Os outros módulos e apagar `lerEntrada`, `idDoCaminho` e `lerConsultaPaginada` (15.0 a 17.0).

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

