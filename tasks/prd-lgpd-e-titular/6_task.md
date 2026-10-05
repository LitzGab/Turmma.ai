# Tarefa 6.0 — A coordenação vê por quanto tempo a escola guarda cada dado

**Funcionalidade:** lgpd-e-titular · **Depende de:** 2.0 · **Paralelo com:** 3.0 a 5.0, 7.0 a 9.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

Nasce o item Privacidade da coordenação, no grupo Conformidade, com a aba "Por quanto tempo guardamos".

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 9
- `docs/interface.md` 3 e 11.1
- `.claude/rules/50-frontend.md`
- Código: `apps/web/src/areas/navegacao.ts` e `.test.ts`, `apps/web/src/areas/coordenacao/*`, as peças de tabela e abas da A1
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 6.1 — Item Privacidade com abas no endereço; aba Retenção lendo `GET retencao`
- [ ] 6.2 — `docs/interface.md` (o item no grupo Conformidade)
- [ ] 6.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/areas/coordenacao/privacidade/*` | novo |
| `navegacao.ts`, `.test.ts`, rotas | alterado |
| e2e | novo |
| `docs/interface.md` | alterado |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| navegação | unidade | Privacidade só para a coordenação |
| estados | e2e | carregando, erro e com dado; o vazio não se aplica (toda escola tem todas as categorias) |
| origem ajustada | e2e | aparece |
| recomeço | e2e | segunda pessoa na aba e troca de escola não mostram a retenção anterior |
| projetos | e2e | `chromebook` e `celular`, com acessibilidade |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

As outras abas (8.0, 10.0, 16.0).

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
