# Tarefa 22.0 — Todas as rotas estão no registro, sem lista de pendentes

**Funcionalidade:** reengenharia · **Depende de:** 21.0
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não.
     O porte diz quanto a tarefa deve levar (criar-tasks, "Porte da tarefa"). -->

## Objetivo

Toda rota montada pela API entra no registro de `packages/shared/src/rotas/`, com `@Rota` no handler; a lista de pendentes
da 21.0 deixa de existir, e nenhuma rota muda de método, caminho nem acesso.

## Contexto necessário

- `onda-1b.md` §2, "T2 — Registro de rotas" ("Na API" e "O teste (21.0)"); `techspec.md` §6 (nenhuma trava é afrouxada);
  `prd.md` RF6
- `.claude/rules/10-multitenancy.md` itens 3, 4 e 6 (a migração não pode abrir rota de escola sem token); D76 (a operação
  não vê dado de pessoa)
- Código: o que a 21.0 deixou em `apps/api/test/rotas-do-registro.test.ts` e `packages/shared/src/rotas/`;
  `apps/api/test/rotas-registradas.ts` (`rotasDe`, `daOperacao`, `ROTAS_DO_PAINEL`); os controllers de `apps/api/src/`

## Subtarefas

- [ ] 22.1 — Caracterização, num commit antes: a foto de (método, caminho, acesso) de toda rota montada, por `rotasDe`, gravada no teste
- [ ] 22.2 — As áreas que faltam ganham o seu arquivo em `packages/shared/src/rotas/` e `@Rota` nos handlers, uma área por commit
- [ ] 22.3 — A lista de pendentes e o ramo da varredura que lia os exportados saem; o `openapi.json` é regenerado
- [ ] 22.4 — Testes: os da tabela

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/rotas/*.ts` (as áreas que faltam e `index.ts`) | novo e alterado |
| `apps/api/src/*/*.controller.ts` (todos os que a 21.0 não registrou) | alterado |
| `apps/api/test/rotas-do-registro.test.ts`, `apps/api/test/contratos.test.ts` | alterado |
| `packages/shared/src/rotas/openapi.test.ts`, `docs/gerado/openapi.json` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer`.

| Cenário | Tipo | O que prova | Mutação |
|---|---|---|---|
| Carac.: a foto de toda rota montada, tirada antes, é igual ao registro depois | unidade (`rotas-do-registro.test.ts`, foto no commit anterior) | migrar não muda rota nem acesso, mesmo com registro e decorator mudando juntos | trocar o acesso de uma rota no registro e no decorator |
| As rotas `anonima` são as da foto, por nome | unidade | nenhuma rota de escola sem token (regra 10) | `GET /v1/turmas` como `anonima` com `@RotaAnonima` |
| Nenhuma rota de escola ganhou `operacao`, nem rota da operação perdeu o marcador | unidade | D76 | marcar uma rota de escola como `operacao` |
| Toda rota montada está no registro, e a lista de pendentes não existe | unidade | cobertura total | uma pendente de volta |
| A varredura de credencial itera só o registro e cobre toda `resposta`, também as da operação | unidade (`contratos.test.ts`) | o registro é a fonte | pular as rotas de operação |
| O OpenAPI tem um par (caminho, método) por rota montada | unidade (`openapi.test.ts`) | o arquivo cobre a API | gerar só rotas com corpo |
| Isolamento: os testes por módulo seguem verdes sem mudar expectativa | integração (`*-isolamento.int.test.ts`, `acesso-*.int.test.ts` de `apps/api/test/`) | nenhum handler mudou de escopo | tirar o `eq(…escolaId…)` de um repository |

## Como testar

- A foto: `rotasDe(controladoresDoModulo(AppModule))` de `apps/api/test/rotas-registradas.ts`, serializada e comparada
  com o registro; o precedente de lista fixa por nome é `apps/api/test/arquitetura.test.ts › arquitetura: a rota
  @RotaDeOperacao tem a GuardaDeOperador no handler resolvido (C41) › toda rota @RotaDeOperacao registrada tem a guarda`
  (`ROTAS_COM_SESSAO_DE_OPERADOR`, `ROTAS_DO_PAINEL`).
- O resto: os casos que a 21.0 deixou em `rotas-do-registro.test.ts` e `contratos.test.ts`.
- Isolado: `npx vitest run --project unidade apps/api/test/rotas-do-registro.test.ts apps/api/test/contratos.test.ts` e,
  ao fim, `npx vitest run --project integracao apps/api/test/estrutura-isolamento.int.test.ts apps/api/test/operacao-isolamento.int.test.ts`.
- Armadilha: um commit por área deixa o diff legível; a foto entra num commit antes do primeiro, senão ela nasce igual ao
  registro e não prova nada.

## Fora do escopo desta tarefa

Trocar as URLs da web (23.0); mudar qualquer rota, acesso ou esquema.

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

