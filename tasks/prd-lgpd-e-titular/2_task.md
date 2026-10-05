# Tarefa 2.0 — A retenção da escola existe e a operação a ajusta por comando

**Funcionalidade:** lgpd-e-titular · **Depende de:** 1.0 · **Paralelo com:** 7.0, 8.0, 9.0
**Subagentes obrigatórios:** `tenancy-guardian`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Cada escola tem um prazo por categoria do catálogo, a operação ajusta por `ops:retencao` dentro de piso, teto e travas, com auditoria, e a coordenação lê a retenção vigente por `GET /v1/privacidade/retencao`.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seções 3 (catálogo, travas, classificação, colunas fora do arquivo), 4 (`GET retencao`) e 6
- `.claude/rules/20-lgpd-menores.md` itens 1 e 16
- `docs/lgpd.md` seção 2 (o mapa inteiro)
- Código: `apps/api/src/ops/comando.ts` e `escola.ts` (modelo de comando), `packages/nucleo/src/configuracao/*` (padrão de configuração por escola), `apps/api/test/arquitetura.test.ts`
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 2.1 — `packages/shared/src/privacidade`: `CATEGORIAS_DE_RETENCAO`, `PRAZOS_FIXOS`, `CLASSIFICACAO_DAS_TABELAS` (com "entra no arquivo" e a coluna de ligação), `COLUNAS_FORA_DO_ARQUIVO` (inclui `mfa_ultimo_passo` e `mfa_chave_versao`), erro `RETENCAO_FORA_DO_LIMITE`
- [ ] 2.2 — Migration própria: `retencao_escola`
- [ ] 2.3 — `RetencaoDaEscolaRepository` (escopo do contexto) e prazo efetivo com as travas
- [ ] 2.4 — `ops:retencao` (ajustar, listar), abrindo o contexto da escola; auditoria `retencao.ajustada`
- [ ] 2.5 — Módulo `apps/api/src/privacidade` com `GET retencao` (coordenação, MFA) e DTO explícito
- [ ] 2.6 — Teste de arquitetura da classificação; `docs/lgpd.md` (linhas do apelido do operador e retenção de `correcao.destaque_aberto_por`), `docs/modelo-de-dados.md`
- [ ] 2.7 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `packages/shared/src/privacidade/*` | novo |
| migration e schema `retencao_escola` | novo |
| `packages/nucleo/src/retencao/retencao-da-escola.repository.ts` | novo |
| `apps/api/src/ops/retencao.ts` | novo |
| `apps/api/src/privacidade/*` (módulo, controller, service, DTO) | novo |
| `apps/api/test/arquitetura.test.ts` | alterado |
| `docs/lgpd.md`, `docs/modelo-de-dados.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| escola nova | integração | todas as categorias com origem "padrão" |
| tabela de migration fora da classificação; coluna proibida inexistente; tabela sem "entra no arquivo" | unidade | o teste de arquitetura falha |
| piso exato aceito, piso − 1 e acima do teto recusados | integração | `RETENCAO_FORA_DO_LIMITE` |
| categoria fixa | integração | recusada |
| travas: `texto_do_modelo` > `conversa_professor` e `consumo_por_aluno` > `conversa_tutor` | integração | recusadas; baixar a categoria-mãe é aceito |
| auditoria | integração | `retencao.ajustada` com operador e referência; o `GET` mostra a origem ajustada |
| isolamento: ajuste em A | integração | não muda o `GET retencao` de B |
| permissão | integração | aluno, professor e coordenação sem MFA não chegam; o teste percorre as rotas de `/v1/privacidade` e falha com lista vazia |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O expurgo (3.0 a 5.0) e a tela (6.0).

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
