# Tarefa 17.0 — A coordenação conduz o pedido até o fim pela tela

**Funcionalidade:** lgpd-e-titular · **Depende de:** 13.0, 14.0, 16.0 · **Paralelo com:** 18.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
**Porte:** grande
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O detalhe do pedido mostra prazo e compartilhamento e permite concluir, cancelar, corrigir o nome e baixar a versão da escola com finalidade e aviso.

## Contexto necessário

- `docs/visao-produto.md` (sempre)
- `prd.md` e `revisao-spec.md` (rodada 6: recomendações que vão para as tarefas)
- `techspec.md` seção 9 (detalhe)
- PRD seção 6 (exceção do Tutor e da D64)
- Código: os diálogos da 16.0
- `cenarios.md`: os cenários desta tarefa estão na tabela abaixo

## Subtarefas

- [ ] 17.1 — Prazo ("faltam N dias", vencido com ícone) e compartilhamento
- [ ] 17.2 — Concluir, Cancelar (diz que o acesso volta), Corrigir nome (antes e depois, aviso do nome anterior)
- [ ] 17.3 — Baixar a versão da escola (`oficial`, finalidade, entregar e apagar)
- [ ] 17.4 — "Em preparação" a cada 10 s, parando com a aba escondida
- [ ] 17.5 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| detalhe do pedido e diálogos | novo |
| consultas | alterado |
| e2e | novo |

## Testes que provam a regra

Definidos com o `test-engineer` a partir do `cenarios.md`.

| Cenário | Tipo | O que prova |
|---|---|---|
| baixar | e2e | finalidade, aviso e nome do arquivo conferido |
| preparação | e2e e unidade | vira "pronto" sem recarregar; para com a aba escondida |
| ações | e2e | conclui; corrige nome; registra eliminação e cancela; Concluir desabilita no envio |
| prazo | e2e | "faltam N dias" e vencido com ícone |
| recomeço | e2e | falha com o diálogo aberto limpa foco e aviso; segunda pessoa; resposta atrasada |
| estados | e2e | quatro estados, `chromebook` e `celular`, acessibilidade |

## Como testar

- **baixar:** `e2e/a2-assistente.spec.ts › a coordenação sobe o material; a professora pede a atividade…` (`page.waitForEvent('download')`, com o nome do arquivo).
- **preparação:** a unidade em `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.test.ts › com a aba escondida, para…`; no e2e, `page.clock.install`, `fastForward` e o evento `visibilitychange`, como `e2e/acesso-da-turma.spec.ts › a releitura que cai com o código projetado…`.
- **ações:** `e2e/pedidos.spec.ts › o 41º pedido não é marcável…` (dois cliques, um pedido).
- **recomeço:** `e2e/pedidos.spec.ts › lista recarregada com o diálogo aberto…` e `› resposta atrasada: a atualização que chega depois da decisão…`.
- **estados:** `e2e/governanca.spec.ts › os quatro estados…`.
- **prazo:** semeie o pedido no banco com `chegou_em` no passado, como `ajustarRetencaoDaEscola` (`e2e/__fixtures__/sessao.ts`).
- Armadilha da 6.0: a linha de Mutações só vale se o e2e fica vermelho sem a cláusula; confira antes de escrever.
- Rodar: `node tools/ci/e2e.ts --manter-ambiente e2e/<arquivo>.spec.ts`.
- **Telas** (`coordenacao`, sem mockup): o detalhe, da aba Pedidos (`/coordenacao/privacidade/<id da aba>`) com `--clicar` no pedido da lista, ou no endereço que a tarefa criar; cada diálogo, com mais um `--clicar`: `text=Concluir`, `text=Cancelar`, `text=Corrigir nome`, `text=Baixar a versão da escola`. A vitrine não tem pedido: registre um na escola cheia, pela tela da 16.0, antes de fotografar.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts` --e2e)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que vale para o código
  atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

"Meus dados" (18.0).

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
