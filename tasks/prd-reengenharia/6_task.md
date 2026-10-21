# Tarefa 6.0 — Repository sem prova de escopo nem motivo reprova o teste

**Funcionalidade:** reengenharia · **Depende de:** nenhuma
**Subagentes obrigatórios:** `tenancy-guardian`, `test-engineer`, `revisor-geral`
**Porte:** pequeno

## Objetivo

Um teste por AST reprova o método público de repository que toca o banco sem prova de escopo, `@SemEscopo` com motivo
ou entrada na lista fechada.

## Contexto necessário

- `onda-1a.md` §2, "T6 — Trava de tenant"
- `techspec.md` §6; `prd.md` RF9
- Regra 10, itens 3, 5 e 9
- `packages/nucleo/src/db/sem-escopo.decorator.ts`: o limite de 30 é `TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO`
- `apps/api/src/assistente/time.service.ts:9`: o repository que mora num service

## Subtarefas

- [ ] 6.1 — O analisador, com `PROVAS_DE_ESCOPO` e `REPOSITORIES_SEM_ESCOPO` (`{ arquivo, motivo, metodos }`)
- [ ] 6.2 — A lista exata, por método e com evidência: os 9 da 7.0, os 3 da 8.0 e os seis da `onda-1a.md` T6
- [ ] 6.3 — `SuspensoesDaEscolaRepository` sai de `time.service.ts` para um `*.repository.ts`
- [ ] 6.4 — Testes: `repositories-com-escopo.test.ts`, com as fixtures em `tools/guardas/__fixtures__/repositories/`

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `tools/guardas/escopo-dos-repositories.ts` | novo |
| `tools/guardas/repositories-com-escopo.test.ts` | novo |
| `apps/api/src/assistente/suspensoes-da-escola.repository.ts` | novo |
| `apps/api/src/assistente/time.service.ts` | alterado |
| `tools/guardas/__fixtures__/repositories/` | novo |

## Testes que provam a regra

Unidade, em `repositories-com-escopo.test.ts`.

| Cenário | O que prova | Mutação |
|---|---|---|
| Acha `sessao/alunos-ativos.repository.ts` e `fila/job-registro.repository.ts`; total > 0 | o glob enxerga o código | glob em pasta vazia |
| Todo método público real tem (a), (b) ou (c) | vale hoje | tirar o `exigir…` de `AlunosAtivosRepository.contar` |
| Fixture: toca `this.banco` sem prova | reprova, com arquivo e método | aceitar todo método |
| Fixture: `this.tx.execute(sql…)` sem prova | SQL cru também "toca o banco" | reconhecer só `.select/.insert/.update/.delete` |
| Fixture: `exigir…` em comentário ou string | prova é chamada | regex no texto |
| Fixture: função local com o mesmo nome | cópia local não vale | aceitar sem o import |
| Fixture: import com alias | alias conta (positivo) | só o identificador literal |
| Fixture: ajudante do mesmo arquivo | prova indireta passa | não seguir ajudante |
| Fixture: ajudante de outro arquivo | não conta | seguir import |
| Fixtures: só `identidadeDaRequisicao`; só `escopoDoJobNoContexto` | cada uma vale | tirar uma da lista |
| Fixture: motivo de 29 reprova, de 30 passa | a fronteira | `>= 30` vira `> 0` |
| Fixture: `@SemEscopo(MOTIVO)` e template | motivo literal | aceitar expressão |
| Fixture: `escolaId` por parâmetro | reprova | ignorar o parâmetro |
| Fixture: privado sem prova | só o público exige | exigir no privado |
| Fixture: propriedade arrow pública | não escapa | só `MethodDeclaration` |
| Fixture: público que não toca o banco | não exige | exigir em todo público |
| Fixture "chama e não usa" | o limite declarado: passa | nenhuma |
| Lista: método com prova | reprova | aceitá-lo |
| Lista: arquivo inexistente | reprova | ignorá-lo |
| Lista: método inexistente | reprova | ignorá-lo |
| Lista: método fora de `metodos`, sem prova | exceção por método | o arquivo todo |
| Lista: `motivo` de 29 caracteres | reprova | não medir |
| A lista real, por `toEqual` | não cresce calada | uma entrada a mais |
| Fixture: `XRepository` em `x.service.ts` | reprova | olhar só `*.repository.ts` |
| Real: nenhum `*Repository` fora de `*.repository.ts` | o de hoje sumiu | devolvê-lo a `time.service.ts` |
| Fixture com decorator e `satisfies`; erro de parse | parser da raiz; erro reprova | engolir o arquivo |

A 2.ª linha é o "remova e quebra" (regra 10.5). Sem concorrência nem log.

## Como testar

- AST: `tools/processo/revisoes.ts` (`carregarTypescript`, `impressaoSemComentarios`: `createSourceFile` e
  `parseDiagnostics`), só leitura. "Acha o conhecido": `apps/api/test/arquitetura.test.ts › a varredura enxerga o código:
  acha a própria classe dentro do módulo de sessão`
- Fixture com marca: `tools/guardas/guardas.test.ts` (`lerFixture`, `marcasDeViolacao`)
- Isolado: `npx vitest run --project unidade tools/guardas/repositories-com-escopo.test.ts`
- Armadilhas: varredura que passa vazia (a 1.ª linha); a prova (a) não vê o `where` (a 7.0 o cobre por mutação)

## Fora do escopo desta tarefa

Os 9 (7.0), as portas de IA (8.0) e o lint de tabela (9.0).

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

