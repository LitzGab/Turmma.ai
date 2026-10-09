# Tarefa 8.0 — A escola vê as empresas que recebem dados dela

**Funcionalidade:** lgpd-e-titular · **Depende de:** 2.0 · **Paralelo com:** 3.0 a 7.0, 9.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `frontend-reviewer`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

A operação cadastra e encerra suboperadores por comando, e a coordenação vê, na aba "Empresas que recebem dados", os vigentes e os passados da escola dela.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3, 4 (`GET suboperadores`) e 6 (consultas sem escopo, repositórios da escola)
- `docs/modelo-de-dados.md`, "Operação Turmma"
- Código: `apps/api/src/ops/*`, `apps/api/test/arquitetura.test.ts` (`TABELAS_DA_OPERACAO`, `QUEM_PODE_TOCAR_A_OPERACAO`)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 8.1 — Migration própria: `suboperador` (chave única onde `fim is null`), `suboperador_escola`
- [ ] 8.2 — `OperacaoPrivacidadeRepository` e `ops:suboperador` (cadastrar, encerrar), com auditoria da operação
- [ ] 8.3 — `SuboperadorDaEscolaRepository` (só leitura, `exists` correlacionado, parênteses) e `GET suboperadores`
- [ ] 8.4 — Aba "Empresas que recebem dados"
- [ ] 8.5 — Arquitetura e `docs/modelo-de-dados.md`
- [ ] 8.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e schemas | novo |
| `apps/api/src/ops/suboperador.ts` e repositório | novo |
| `packages/nucleo/src/titular/suboperador-da-escola.repository.ts` | novo |
| rota e DTO em `privacidade` | alterado |
| aba na web e e2e | novo |
| `arquitetura.test.ts`, `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| comando | integração | cadastra e encerra com auditoria; encerrado fica no histórico; chave encerrada recadastra |
| isolamento | integração | B não vê o `lista` só de A e vê o `todas`; S2 só de B não aparece em A (sem a correlação, quebra) |
| passado | integração | ligação com `fim` aparece como passada |
| arquitetura | unidade | caminho fora da lista falha; o repositório da escola não escreve |
| concorrência | integração [P] | dois cadastros da mesma chave: o único deixa um |
| estados | e2e | quatro estados, `chromebook` e `celular`, acessibilidade |

## Como testar

- **comando, passado, isolamento:** molde de `apps/api/test/retencao.int.test.ts` (`rodar`, `bancada.escolaComSessao('coordenador')`, `chamar`), com `› isolamento: o ajuste em A não muda o GET de B`. Auditoria: `apps/api/test/ops-operador.int.test.ts › C4`. Ponha o comando na lista de `› C2`: a 2.0 reprovou por faltar.
- **concorrência:** `retencao.int.test.ts › concorrência: dois ajustes da mesma escola…` (`GatilhoDeParada` no `insert` de `suboperador`, `esperarNaTrava`), nunca `Promise.all` solto.
- **arquitetura:** `apps/api/test/arquitetura.test.ts › só o OperadorRepository e o expurgo tocam as seis tabelas` e `› reprova o repository que importa outra tabela…`.
- **e2e:** `e2e/privacidade.spec.ts › os estados: carregando, erro…` (`portao`, `page.route`, `criarEquipeComSenha`, `violacoesGraves`); semeie como `ajustarRetencaoDaEscola` (`e2e/__fixtures__/sessao.ts`).
- Armadilha: `suboperador` é global e o banco acumula. Chave aleatória por teste; afirme só sobre as chaves criadas. Um `todas` alheio aparece em toda escola: o vazio não sai do banco (sem precedente; `rota.fulfill`).
- Rodar: `npx vitest run --project integracao <arquivo>`; `node tools/ci/e2e.ts --manter-ambiente e2e/<arquivo>.spec.ts`.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O compartilhamento do titular (12.0).

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
