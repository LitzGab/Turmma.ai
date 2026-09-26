# Tarefa 16.0 — Web: pedidos com os diálogos de decisão, do professor e da coordenação

**Funcionalidade:** apresentacao-escola · **Depende de:** 15.0, 13.0, 8.0 · **Paralelo com:** 9.0, 10.0, 12.0
**Subagentes obrigatórios:** `frontend-reviewer`, `privacy-guardian`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O professor vê os pedidos da turma chegando sozinhos, seleciona até 40 e aprova ou recusa depois de revisar turma,
nomes e efeito; a coordenação faz o mesmo de dentro da turma, com "Atualizar" e o aviso de que fica registrado; e
cada pedido termina com o resultado dele em texto.

## Contexto necessário

- `docs/interface.md` 11.1 (variantes `oficial` e `perigo`) e 8.4 (decisão oficial)
- `techspec.md` seções 4 (reivindicações, `decidir`) e 9 ("Decisão")
- `cenarios.md`: W6, W15, W4 (linha "Pedidos"), W12; A2 (a coordenação audita cada leitura)
- `.claude/rules/50-frontend.md`; regras 20 (item 10), 70 (ação oficial clara)
- Código:
  - As rotas da 8.0; a turma do professor (15.0) e a da coordenação em Estrutura (13.0)
  - O diálogo em `apps/web/src/componentes/` (14.0) e o padrão de foco devolvido
  - `tasks/prd-apresentacao-painel/achados/indice.md`, 7.0: a chave da linha pela posição, o anúncio vazio

## Subtarefas

- [ ] 16.1 — Pedidos do professor na turma: nome, hora e a marca "Houve tentativa com matrícula errada neste nome;
  pode ter sido erro de digitação", sem número nem hora; atualiza a cada 15 s só com a aba visível, mantendo a
  seleção por id, o foco e os ids do diálogo aberto, e anuncia os novos em `aria-live="polite"` sem roubar o foco
- [ ] 16.2 — Pedidos da coordenação dentro da turma: só com o clique em "Atualizar", mandando a finalidade; o vazio
  próprio, sem botão
- [ ] 16.3 — Seleção por caixa, até 40, o 41º desabilitado com o texto do limite; não existe "aprovar todos"
- [ ] 16.4 — "Aprovar N" (`oficial`): turma, nomes, efeito e, pela coordenação, o aviso de auditoria; "Recusar"
  (`perigo`): confirma e diz que o nome volta à lista. Depois, texto por pedido: `ja_decidida` é "Já decidido por
  outra pessoa", `nao_encontrada` é "Este pedido não está mais disponível"
- [ ] 16.5 — Tetos dos chunks `professor-*` e `coordenacao-*` revistos
- [ ] 16.6 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|
| `apps/web/src/componentes/pedidos/ListaDePedidos.tsx`, `DialogoDeDecisao.tsx`, `textos.ts` | novo |
| `apps/web/src/componentes/pedidos/atualizacao-dos-pedidos.ts` (e teste) | novo |
| `apps/web/src/api/pedidos.ts`; `areas/professor/Turma.tsx`, `areas/coordenacao/Estrutura.tsx` | novo, alterado |
| `.size-limit.json`, `e2e/pedidos.spec.ts` | alterado, novo |

## Testes que provam a regra

| Cenário | Tipo | O que prova |
|---|---|---|
| W6 | e2e | os dois diálogos com o que mostram; clique duplo em confirmar manda um pedido; os textos de `ja_decidida` e `nao_encontrada`; a marca da tentativa errada, também no diálogo; o 41º não selecionável; sem "aprovar todos" |
| W15 | unidade | relógio falso e `visibilitychange`: 15 s com a aba visível, parado escondida; seleção, foco e diálogo mantidos; anúncio sem roubar o foco; a coordenação sem leitura nenhuma em 60 s sem o clique |
| W4 (Pedidos) | e2e | os quatro estados, com o vazio de cada papel; vazio e erro com a rota interceptada |
| W12 (Pedidos) | e2e | 360 px em cartões; alvos de 44 px; selecionar e decidir só com Tab, Espaço e Enter, foco preso no diálogo e devolvido |
| recomeço da tela | e2e | segunda pessoa: a coordenação entra na mesma aba depois do professor, sem a seleção nem os pedidos dele; mesma entrada: confirmar de novo o mesmo lote mostra `ja_decidida`, sem pedido em dobro; resposta atrasada: a atualização de 15 s que chega depois da decisão não traz de volta o pedido decidido; lista recarregada com o diálogo aberto: o pedido que sumiu sai do diálogo, e o aviso e o foco da tentativa anterior saem |
| log novo | — | a tarefa não escreve log |

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts --e2e`)
- [ ] `test-engineer` aprovado primeiro; `frontend-reviewer` sozinho, depois `revisor-geral` e os guardiões, com
  rodada que vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

Aprovar sem o diálogo de revisão; qualquer contagem pública de quem entrou (D59); tempo real por WebSocket (o
intervalo de 15 s basta na A1).

## Mutações

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|
