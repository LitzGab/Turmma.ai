# Tarefa 12.0 — O pedido guarda por quais empresas o dado do titular passou

**Funcionalidade:** lgpd-e-titular · **Depende de:** 7.0, 8.0, 11.0 · **Paralelo com:** 13.0, 14.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `llm-integrator`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A foto do compartilhamento é gravada no registro do pedido: o aluno pelo rastro com `provedor`, o professor só por período, com reserva por período e "provedor não cadastrado".

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 5 ("Compartilhamento", com "O período é o do titular na escola": triagem de 09/10 da lacuna da 8.0) e 6 (`SuboperadorDaEscolaRepository`)
- D64; LGPD art. 18, VII e § 6º
- Código: `consumo_ia`, `execucao_agente`, os repositórios da 8.0
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 12.1 — `Compartilhamento` em `packages/nucleo/src/titular`, chamável pela API e pelo worker
- [ ] 12.2 — Gravado no `POST pedidos` e devolvido no detalhe
- [ ] 12.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/nucleo/src/titular/compartilhamento.ts` | novo |
| `privacidade` service | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| escopo | integração | chave de suboperador só de B aparece como "não cadastrado" em A; reserva não lista o de B |
| com e sem `provedor` | integração | agrupa por provedor; linhas antigas pela reserva |
| rastro expirado | integração | depois de 12 meses, lista os do período do titular; o `todas` encerrado antes de o aluno entrar fica fora, e `primeiroEm` não é anterior à entrada |
| D64 | integração | dois professores, um que usou e outro não: foto e detalhe iguais |
| mesma conta | integração | consumo feito em B não entra na foto de A |
| sem uso e vigência | integração | aluno sem uso: só hospedagem; provedor fora da vigência não casa |

## Como testar

- Molde da escola e do consumo: `apps/worker/test/expurgo-da-escola.int.test.ts` (`escolaNova`, `consumo`, `execucaoDoTutor`, `professorNovo`), que grava `consumo_ia` com `em` no passado; a soma que não muda em `› o que fica: a execução, as sete FKs…`.
- **escopo:** o teste de isolamento do `SuboperadorDaEscolaRepository`, que a 8.0 cria: copie de lá a montagem dos dois suboperadores.
- **D64:** `apps/api/src/governanca/governanca.int.test.ts › a série com um professor só com entrega fica fora da lista…`; aqui, a foto e o detalhe dos dois professores comparados com `toEqual`.
- **mesma conta:** `BancadaDeSessoes.sessaoDaMesmaConta` (`apps/api/test/sessao-de-teste.ts`).
- Rastro expirado e vigência: sem precedente; o relógio é injetado, como o `relogioEm` do arquivo do worker. `escolaNova` cria o aluno sem credencial: insira `credencial_matricula` com `criada_em` no passado, senão o período anterior ao rastro é vazio.
- Armadilha da 8.0: `suboperador` é global e o banco acumula; chave aleatória por teste.
- Rodar: `npx vitest run --project integracao <arquivo>`.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O refazer antes de anonimizar (15.0).

## Divergências resolvidas nesta tarefa

Preenchida por quem implementa, com a coluna "Onde está na spec" antes dos revisores. Sem nenhuma, "nenhuma".

| Divergência | Motivo | Onde está na spec (`techspec.md` §, `cenarios.md`, documento da seção 11) |
|---|---|---|

## Mutações

Preenchida por quem implementa, antes dos revisores: uma linha por cláusula que o diff acrescenta.

| Cláusula (`arquivo` › função › o texto da condição) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

Preenchida por quem implementa. Sem nenhuma, "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
