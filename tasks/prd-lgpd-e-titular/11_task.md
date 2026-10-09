# Tarefa 11.0 — A coordenação acha o titular e registra o pedido

**Funcionalidade:** lgpd-e-titular · **Depende de:** 2.0 · **Paralelo com:** 12.0 (depois de 8.0)
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `conformidade-reviewer`, `infra-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Busca por `POST`, prévia, registro, lista, detalhe, concluir e corrigir nome funcionam pela API, auditados, com a prévia do professor igual para quem usou e quem não usou a IA.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (`pedido_titular`), 4 (rotas, "mesmo que inexistente", aluno só na lista) e 7
- `.claude/rules/20-lgpd-menores.md` itens 6, 10 e 19; D64
- Código: `apps/api/src/estrutura/lista.service.ts` (modelo de leitura auditada), `CicloDeVidaService` (o "si mesmo")
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 11.1 — Migration própria: `pedido_titular` (gatilho de inserção, imutáveis, único de `chave_envio`, índices)
- [ ] 11.2 — `POST titulares/busca` com `rl:busca-titular`; `GET titulares/:id/previa` (`homonimo`; D64)
- [ ] 11.3 — `POST pedidos` (chave decide primeiro), `GET pedidos` e `GET pedidos/:id`, auditoria na mesma transação
- [ ] 11.4 — `concluir` e `corrigir-nome`, com estados e erro tipado
- [ ] 11.5 — Harness de captura de log (termo, nome atual e anterior)
- [ ] 11.6 — `docs/lgpd.md` (linha do pedido)
- [ ] 11.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e schema | novo |
| `apps/api/src/privacidade/*` (rotas, service, repository, DTO) | alterado |
| `packages/shared/src/privacidade/*` (contratos) | alterado |
| limite da busca | alterado |
| `docs/lgpd.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| mesmo que inexistente | integração | `titularId` de B e o pedido sobre si mesmo (pela conta) respondem igual a inexistente |
| validação | integração | `chegouEm` futuro, nome vazio ou > 200, termo de 2 letras: erro tipado |
| imutabilidade | integração | `UPDATE` de `escola_id` ou `titular_id` recusado |
| corrigir nome | integração | muda; auditoria sem o nome; fora de correção ou com pedido fechado: `PEDIDO_EM_ESTADO_INVALIDO`; não muda B da mesma conta |
| auditoria | integração | sem `pedidos.listados`, `pedido.lido` e `titular.previa_lida` com finalidade, falha; a busca não grava o termo |
| D64 e homônimo | integração | prévia de professor sem contagem nem período; `homonimo` com aluno ativo e com nome livre |
| aluno da lista | integração | a busca não acha; o reivindicado passa por decidir e retirar com as duas auditorias |
| rate limit | integração | 31ª busca dá 429; duas coordenadoras do mesmo IP têm 30 cada |
| isolamento | integração | pedido, prévia, busca, concluir e corrigir de B; transferido; mesma matrícula |
| concorrência | integração [P] | mesma chave dá o mesmo pedido; clique duplo em concluir sem 500 |

## Como testar

- Molde: `apps/api/test/retencao.int.test.ts` (`subirApi`, `chamar`, `bancada.escolaComSessao`). Igual a inexistente: `apps/api/src/ia/ia.int.test.ts › de outra pessoa, de outra escola, inexistente…`.
- **auditoria:** `apps/api/test/lista.int.test.ts › A2: cada leitura da lista grava…`; **aluno da lista:** `› retirar o nome livre apaga a linha…`.
- **rate limit:** `apps/api/test/limite.int.test.ts › um usuário acima do próprio limite recebe 429…`.
- **concorrência:** `ia.int.test.ts › a mesma chave de envio duas vezes ao mesmo tempo…`; o clique duplo com `GatilhoDeParada` (`apps/api/test/gatilho-de-parada.ts`).
- **mesma conta:** `BancadaDeSessoes.sessaoDaMesmaConta`. **Log:** o terceiro argumento de `subirApi`, como `apps/api/test/acesso-da-escola.int.test.ts › privacidade: o log não traz o slug consultado`.
- Imutabilidade por gatilho: sem precedente.
- Rodar: `npx vitest run --project integracao <arquivo>`.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Compartilhamento (12.0), arquivo (13.0), eliminação (14.0, 15.0), telas (16.0, 17.0).

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
