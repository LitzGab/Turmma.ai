# Tarefa 14.0 — Corpo, consulta ou id fora do esquema não chegam ao service; sistema, IA, entrega, assistente e professores migram

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Nasce a validação de entrada do padrão NestJS (D81): `ZodValidationPipe` e `IdPipe` no parâmetro, e o
`no-restricted-syntax` do ESLint reprova o controller que recebe entrada sem pipe. Cinco módulos migram.

## Contexto necessário

- `onda-1a.md` §2 "T1" (reescrita pela D81); `docs/decisoes.md` D81; `prd.md` §11 (RF5 revisto); regras 10.3, 10.6,
  20.9, 20.11, 00.9
- NestJS, "Pipes" › *Object schema validation* e o `ParseUUIDPipe`. **Sem conferência no boot, sem lista de pendentes,
  sem `nestjs-zod`**
- O que sai depois (17.0): `apps/api/src/estrutura/entrada.ts` (`lerEntrada`, `idDoCaminho`, `lerConsultaPaginada`)

## Subtarefas

- [ ] 14.1 — Caracterização, num commit antes: o inválido e o 404 de cada rota dos cinco módulos, e o uuid em maiúsculas
- [ ] 14.2 — `ZodValidationPipe` e `IdPipe` em `packages/nucleo/src/entrada/` (D81), sem `issues` na resposta nem no log
- [ ] 14.3 — O bloco de `no-restricted-syntax` em `eslint.config.mjs`: `@Body()`, `@Query()` e `@Param()` sem pipe, `@Req()` e `requisicao.body`, `.query` e `.params`, valendo nos cinco módulos migrados
- [ ] 14.4 — Migram `sistema/`, `ia/`, `entrega/`, `assistente/` e `professores/`
- [ ] 14.5 — Testes: os da tabela

O desenho (os dois pipes, o bloco do ESLint que cresce por tarefa e a ordem dos erros) está em `onda-1a.md` T1.

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/entrada/zod-validation.pipe.ts`, `id.pipe.ts`, `index.ts`, `entrada.test.ts` | novo |
| `packages/nucleo/src/index.ts` | alterado |
| `eslint.config.mjs`, `tools/guardas/index.mjs`, `tools/guardas/guardas.test.ts` | alterado |
| `tools/guardas/__fixtures__/entrada-sem-esquema.ts`, `entrada-com-esquema.ts` | novo |
| `apps/api/src/{sistema,ia,entrega,assistente,professores}/*.controller.ts` | alterado |
| `apps/api/src/ia/ia.int.test.ts`, `apps/api/src/entrega/entrega.int.test.ts`, `apps/api/src/assistente/assistente.int.test.ts` | alterado |
| `apps/api/test/{professores,jobs-sinteticos,contexto,estado-avisos}.int.test.ts` | alterado |

## Testes que provam a regra

| Cenário | Tipo | Fica vermelho se (a mutação), ou o que prova |
|---|---|---|
| `ZodValidationPipe`: inválido → `ENTRADA_INVALIDA`; válido → o valor do esquema (com `default` aplicado) | unidade | devolver o valor cru |
| `ZodValidationPipe` com `errorCode: NAO_ENCONTRADO` → 404 | unidade | ignorar a opção |
| `IdPipe` normaliza maiúsculas; fora do formato → `NAO_ENCONTRADO`; com `invalidAsUndefined` → `undefined` | unidade | tirar o `.toLowerCase()`; responder 400 |
| A resposta do inválido é exatamente `{ codigo: 'ENTRADA_INVALIDA' }` | integração | repassar `issues` |
| Sentinela do corpo inválido fora do log (`CapturaDeDadoPessoal`) | integração | logar `issues` |
| Corpo com `escolaId` de B → `ENTRADA_INVALIDA`, nada gravado | integração | sem `.strict()` |
| Uuid de B em maiúsculas, no contexto de A → o mesmo 404 do inexistente | integração | tirar o `eq(…escolaId…)` |
| `ia`: execução de outra pessoa, de outra escola, inexistente e fora do formato → o mesmo 404, o mesmo corpo | integração | tirar o `eq(…escolaId…)` |
| `assistente`: corpo inválido → nenhuma execução nem consumo | integração | o pipe passar o valor cru |
| `professores`: limite 101 reprova, 100 passa | integração | `.max(101)` |
| `sistema` e `entrega`: o inválido igual ao da caracterização | integração | caracterização |
| Sem sessão e corpo inválido → 401; professor em rota da coordenação com corpo inválido → 404, sem auditoria | integração | validar antes da guarda |
| Lint: `@Body()`, `@Query()`, `@Param('id')` sem pipe, `@Req()` e `requisicao.body` reprovam no controller migrado | unidade | tirar um seletor |
| Lint: o jeito certo passa; o mesmo arquivo como `x.service.ts`, ou num módulo ainda não migrado, passa | unidade | o bloco subir para todo arquivo |
| Lint: `eslint-disable-next-line no-restricted-syntax` → a segunda passada reprova | unidade | não entrar em `REGRAS_DAS_GUARDAS` |
| `permissao-no-boot.test.ts` verde | unidade | o pipe quebrar a guarda |

## Como testar

- Lint: copie `tools/guardas/guardas.test.ts › processadores do worker: nenhuma afirmação de tipo …` (os dois `it`: a
  fixture com `reprova: no-restricted-syntax` no caminho simulado `apps/api/src/ia/x.controller.ts`, e o "vale só em…"
  com `apps/api/src/estrutura/x.controller.ts` e `apps/api/src/ia/x.service.ts`). O comentário: `guarda desligada por
  comentário › a passada sem comentários do npm run lint ainda pega a violação`, com `eslintDasGuardas`.
- Seletores sugeridos (a fixture é a prova): `Decorator > CallExpression[callee.name=/^(Body|Query|Param)$/][arguments.length=0]`,
  `…[callee.name=/^(Body|Query|Param)$/][arguments.length=1] > Literal.arguments`, `Decorator > CallExpression[callee.name='Req']`,
  `MemberExpression[object.name='requisicao'][property.name=/^(body|query|params)$/]`.
- Isolamento: `apps/api/src/ia/ia.int.test.ts › de outra pessoa, de outra escola, inexistente e com id fora do formato
  respondem igual: 404, o mesmo corpo`.
- Log: `CapturaDeDadoPessoal` (`apps/api/test/captura-de-dado-pessoal.ts`), com `subirApi` (`api-com-sessao.ts`).
- Isolado: `npx vitest run --project unidade packages/nucleo/src/entrada tools/guardas/guardas.test.ts` e
  `npx vitest run --project integracao apps/api/src/ia/ia.int.test.ts`.
- Armadilha: o tipo do parâmetro não sai do pipe; declare-o com o tipo de `@educa/shared` (`PedidoX`), nunca `unknown`.

## Fora do escopo desta tarefa

Os outros módulos (15.0 a 17.0), apagar as funções de `estrutura/entrada.ts` (17.0), o OpenAPI e o registro de rotas (X6).

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

