# Tarefa 1.0 — A pessoa marca que viu a introdução, e o `/v1/eu` devolve a data

**Funcionalidade:** telas-do-aluno-e-primeiro-acesso · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A API guarda e devolve a data em que a pessoa viu a introdução do papel dela. Nenhuma tela muda.

## Contexto necessário

- `techspec.md` seções 3 a 7 e 7c; `prd.md` RF12, RF16, RF18 e seção 8
- Regras 10 (itens 3, 5 e 9), 20 (item 1) e 80 (itens 7 e 9)
- Código: `eu.repository.ts`, `eu.service.ts` e `acessosDaConta`, em `apps/api/src/sessao/`;
  `LEITURAS_DO_ARQUIVO.usuario`; em `docs/lgpd.md`, a linha da eliminação agendada

## Subtarefas

- [ ] 1.1 — `introducaoVistaEm` em `usuario`, com a migration do drizzle-kit; a coluna entra em
  `LEITURAS_DO_ARQUIVO.usuario.colunas`
- [ ] 1.2 — `esquemaRespostaEu` ganha `introducaoVistaEm`. `acessosDaConta` devolve a data só para o service, com
  a justificativa do `@SemEscopo` atualizada; o service responde a mais antiga entre a do usuário e a dos acessos
  **do mesmo papel**. `acessos`, na resposta, não muda
- [ ] 1.3 — `POST /v1/eu/introducao`: corpo vazio e estrito, `@Permite('eu', 'concluir_introducao')` (`proprio` nos
  três papéis, `nunca` na rede), `no-store`
- [ ] 1.4 — `concluirIntroducao()` na web. Todo `insert into usuario` das fixtures e da vitrine grava a data; as
  fábricas de pessoa aceitam `introducao: 'por_ver'`
- [ ] 1.5 — `docs/lgpd.md` (linha nova no mapa) e `docs/modelo-de-dados.md`
- [ ] 1.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/db/schema/usuario.ts`, `packages/nucleo/src/titular/leitura-do-titular.ts` | alterado |
| `packages/nucleo/drizzle/0037_introducao_vista.sql`, `packages/nucleo/drizzle/meta/`, `apps/api/test/introducao.int.test.ts` | novo |
| `packages/shared/src/sessao/eu.ts`, `packages/shared/src/permissao/matriz.ts` | alterado |
| `apps/api/src/sessao/eu.controller.ts`, `apps/api/src/sessao/eu.service.ts`, `apps/api/src/sessao/eu.repository.ts`, `apps/api/src/sessao/eu.repository.int.test.ts`, `apps/api/src/sessao/resolucao-de-tenant.repository.ts` | alterado |
| `apps/api/test/arquivo-do-titular.int.test.ts`, `apps/web/src/api/eu.ts`, `tools/vitrine/escola.ts` | alterado |
| `e2e/__fixtures__/sessao.ts`, `e2e/__fixtures__/governanca.ts`, `e2e/__fixtures__/painel.ts`, `docs/lgpd.md`, `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz | integração | antes do POST, o `/v1/eu` devolve nulo; depois, a data, nos três papéis |
| borda: repetida, e virada do ano | integração | o segundo POST devolve a primeira data; o ano novo não a apaga |
| permissão | integração | sem sessão, 401; campo no corpo, `ENTRADA_INVALIDA`; nada gravado |
| isolamento entre escolas | integração | com o contexto de B, o usuário de A não é lido nem alterado |
| duas escolas | integração | a professora de A e B marca em A: o `/v1/eu` em B devolve a data, e a linha de B fica nula |
| dois papéis | integração | professora em A e coordenadora em B não herdam; o desativado não empresta |
| concorrência: dois POST com `Promise.all` | integração | os dois respondem 200 com a mesma data |
| arquivo do titular | integração | a data sai no arquivo da própria pessoa |

## Como testar

- Isolamento: `apps/api/src/sessao/eu.repository.int.test.ts › isolamento: o /v1/eu lê o usuário…`, com a escrita
- Rota: `apps/api/test/escola-sessao.int.test.ts › borda: fora de 5 a 480 minutos…` e `› concorrência: duas
  alterações…` (`subirApi`, `chamar`, `BancadaDeSessoes`)
- Duas escolas: `apps/api/test/troca-de-escola.int.test.ts`
- Rodar: `npx vitest run --project integracao apps/api/test/introducao.int.test.ts`
- Armadilha: teste que monta o corpo do `/v1/eu` ganha o campo

## Fora do escopo desta tarefa

Tela, desvio da primeira entrada (9.0 a 11.0) e log novo.

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
