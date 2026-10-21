# Tarefa 21.0 — Rota fora do registro ou divergente reprova, e o OpenAPI sai dele

**Funcionalidade:** reengenharia · **Depende de:** 17.0, 20.0
**Subagentes obrigatórios:** `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Rota montada e registro (`packages/shared/src/rotas/`) se conferem nos dois sentidos, com pendentes que só encolhem, e o
OpenAPI sai do registro.

## Contexto necessário

- `onda-1b.md` §2 "T2 — Registro de rotas", §3 e §4; `techspec.md` §12 (a premissa dos `union`); `prd.md` RF6; regras 00
  (item 6) e 20 (item 4)
- Código: `apps/api/test/permissao-no-boot.test.ts`, `rotas-registradas.ts`, `contratos.test.ts:90`,
  `permite.decorator.ts`, `rota-anonima.decorator.ts`, `packages/nucleo/src/entrada/` (14.0), `config.ts:46`
  (`ROTAS_SINTETICAS`); a lista de pendentes copia a da 14.0 (`ConferenciaDasEntradas`)

## Subtarefas

- [ ] 21.1 — `definirRota`, `ROTAS` e o marcador `@Rota(chave)`; as primeiras áreas registradas
- [ ] 21.2 — `apps/api/test/rotas-do-registro.test.ts`, com a lista de pendentes que só encolhe
- [ ] 21.3 — A varredura de credencial de `contratos.test.ts` itera o registro e as pendentes
- [ ] 21.4 — `gerarOpenApi(ROTAS)`, `docs/gerado/openapi.json` e `npm run docs:openapi`
- [ ] 21.5 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/rotas/*.ts` (`definir-rota.ts`, áreas, `index.ts`, `openapi.ts`, `.test.ts`) | novo |
| `packages/shared/src/index.ts`, `packages/shared/package.json` | alterado |
| `packages/nucleo/src/permissao/rota.decorator.ts`, `packages/nucleo/src/index.ts` | novo, alterado |
| `apps/api/src/*/*.controller.ts` (as áreas registradas) | alterado |
| `apps/api/test/rotas-do-registro.test.ts`, `docs/gerado/openapi.json` | novo |
| `apps/api/test/contratos.test.ts`, `package.json` (script) | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| Rota montada fora do registro reprova | unidade (`rotas-do-registro.test.ts`) | API → registro | tirar uma entrada |
| Entrada sem handler reprova | unidade | registro → API | entrada sem handler |
| Método divergente (`PUT` × `@Patch`) reprova | unidade | o método | comparar só o caminho |
| Caminho divergente reprova | unidade | caminho | comparar só o método |
| `:serieId` × `id` reprova | unidade | os nomes | normalizar `:qualquer` |
| `corpo` de mesma forma e outra instância reprova | unidade | identidade | comparar por forma |
| Idem `consulta` | unidade | identidade | não conferir `consulta` |
| Idem `caminhoParams` | unidade | identidade | não conferir `caminhoParams` |
| `['serie','criar']` × `@Permite('serie','ler')` reprova | unidade | o acesso | comparar só o recurso |
| `'anonima'` sem `@RotaAnonima` reprova | unidade | anônima | aceitar sem conferir |
| `@RotaAnonima` com permissão no registro reprova | unidade | o inverso | conferir só pelo registro |
| `'operacao'` sem marcador (método ou classe) reprova | unidade | operação | ler só o método |
| `@Rota('x')` fora do registro reprova | unidade | o marcador | ignorar `@Rota` sem entrada |
| Dois handlers com a mesma chave reprovam | unidade | um por entrada | guardar o último num `Map` |
| Pendente já registrada reprova | unidade | só encolhe | não conferir pendente registrada |
| Pendente inexistente reprova | unidade | só encolhe | não conferir pendente inexistente |
| A rota sintética se confere com `ROTAS_SINTETICAS=true` | unidade | rota condicional | subir só com a flag desligada |
| `resposta` com `senhaHash` reprova pelo registro | unidade (`contratos.test.ts:110`) | itera o registro | iterar lista vazia |
| Pendente com `senhaHash` segue reprovado | unidade | sem perder cobertura | iterar só o registro |
| `openapi.json` velho reprova byte a byte | unidade (`openapi.test.ts`) | velho falha | comparar só `paths` |
| Gerado duas vezes, mesmos bytes | unidade | estável | data no arquivo |
| `default` opcional no `requestBody`, obrigatório na resposta | unidade | `io` dos dois lados | `io: 'output'` nos dois |
| Não representável sai aberto | unidade | `unrepresentable: 'any'` | `'throw'` |
| Cada um dos 22 `union` sai com todos os ramos | unidade | premissa do §12 | só o primeiro ramo |
| Nenhum `example`/`examples` no OpenAPI | unidade | §4 | `.meta({ example: 'Maria' })` em fixture |

## Como testar

- Nest sem banco: copie `apps/api/test/permissao-no-boot.test.ts › … › rota sem @Permite, sem @RotaAnonima e sem
  marcador da operação derruba o boot…`, com `moduloCom` e `subir`; as rotas de `rotasDe(controladoresDoModulo(AppModule))`.
- Varredura: `contratos.test.ts › privacidade: reprova o contrato de fixture com senhaHash, em qualquer profundidade e forma`.
- OpenAPI: sem precedente; compare o gerado com o arquivo por `readFileSync`.
- Isolado: `npx vitest run --project unidade apps/api/test/rotas-do-registro.test.ts packages/shared/src/rotas`
- Armadilha: o `dist` de `shared` e `nucleo` fica velho; importe pela condição `source`.

## Fora do escopo desta tarefa

Zerar as pendentes (22.0); a web pelo registro (23.0); o `docs:gerar` (onda 6).

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

