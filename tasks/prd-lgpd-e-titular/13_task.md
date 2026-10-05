# Tarefa 13.0 — O titular baixa o próprio arquivo, e a escola a versão dela

**Funcionalidade:** lgpd-e-titular · **Depende de:** 3.0, 11.0, 12.0 · **Paralelo com:** 14.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`, `infra-guardian`, `conformidade-reviewer`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O pedido de acesso gera o JSON fora da requisição, no storage privado, e "Meus dados" e a versão da escola entregam URL de 5 min, sem nenhuma coluna proibida e sem correção não aprovada.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (o que entra no arquivo, colunas fora), 4 (`meus-dados`, `arquivo`) e 5 ("Arquivo")
- Regra 20 item 7; regra 70 itens 3 e 8
- Código: `apps/worker/src/storage/medidor-de-storage.ts` (cliente S3)
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 13.1 — Migration própria: `arquivo_titular` (único `(escola_id, pedido_id, versao)`, índice de validade)
- [ ] 13.2 — Porta `ArmazemDeArquivos` (S3 e falso); confirmar a URL assinada no SeaweedFS (seção 12)
- [ ] 13.3 — `LeituraDoTitular` a partir da classificação; `titular.montar-arquivo` (normal, só ids no job)
- [ ] 13.4 — Versões `completa` e `coordenacao` (conta ativa por escola); correção não aprovada só como estado
- [ ] 13.5 — `GET`/`POST meus-dados`, `POST pedidos/:id/arquivo`, `no-store`, auditoria `titular.arquivo_baixado`
- [ ] 13.6 — Expurgo dos arquivos vencidos ou com `apagado_em` na rotina; alerta `em_preparacao` > 2 h
- [ ] 13.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| migration e schema | novo |
| `packages/nucleo/src/titular/leitura-do-titular.ts`, `armazem-*.ts` | novo |
| `apps/worker/src/processadores/montar-arquivo.ts` | novo |
| rotas em `privacidade` e `meus-dados` | novo/alterado |
| `expurgo-da-escola.repository.ts` | alterado |
| regra de alerta e runbook | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| conteúdo | integração | sentinela por tabela aparece; nada de outro titular nem de B; e-mail do professor nas duas |
| proibidas | integração | nenhuma de `COLUNAS_FORA_DO_ARQUIVO` nas duas versões; aluno sem conteúdo do artefato |
| versão da escola | integração | sem conversa do professor, com Tutor; só sem conta ativa nesta escola |
| correção | integração | lote pendente ou rejeitado não aparece como resultado |
| quem baixa | integração | coordenação não baixa a `completa`; colega não baixa; B não lista A; responsável: conta do aluno |
| D64 | integração | datas reais de uso só na `completa` |
| validade | integração | 7 dias fica, 8 sai; falha ao apagar volta pelo `apagado_em`; URL de 300 s |
| cabeçalhos | integração | `no-store`, `attachment`, `meus-dados-AAAA-MM-DD.json`; nenhum DTO com `chave_objeto` |
| falha | integração | armazém fora: "em preparação" e `INDISPONIVEL`; volta e conclui |
| concorrência | integração [P] | dois `montar-arquivo` do mesmo pedido |
| alerta | infra [F] | `em_preparacao` > 2 h |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As telas (17.0, 18.0); a eliminação (15.0).

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
