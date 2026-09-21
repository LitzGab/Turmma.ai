# Tarefa [N.0] — [título]

**Funcionalidade:** [nome] · **Depende de:** [N.0 ou nenhuma]
**Subagentes obrigatórios:** `...`
<!-- test-engineer e revisor-geral são obrigatórios em toda tarefa, marcados ou não. -->

## Objetivo

O que esta tarefa entrega, em uma frase. Ao terminar, o que passa a funcionar que antes
não funcionava.

## Contexto necessário

Quem implementa esta tarefa começa com contexto limpo e não participou de nenhuma conversa.
Liste tudo que ele precisa ler antes de escrever a primeira linha:

- `docs/visao-produto.md` (sempre)
- `techspec.md` seção [n]
- `.claude/rules/[quais e por quê]`
- Fluxo relacionado em `docs/fluxos.md`, se houver
- Código existente relevante: `caminho/arquivo.ts` — e o que olhar nele

## Subtarefas

- [ ] N.1 —
- [ ] N.2 —
- [ ] N.3 — Testes

## Arquivos previstos

| Arquivo | Novo ou alterado |
|---|---|

## Testes que provam a regra

Definidos com o `test-engineer`. Não improvise aqui.

| Cenário | Tipo | O que prova |
|---|---|---|
| caminho feliz | integração | |
| borda: [caso do domínio] | integração | |
| permissão: quem não pode | integração | |
| isolamento entre escolas | integração | |
| concorrência: [as duas chamadas ao mesmo tempo, com `Promise.all`] | integração | |

A linha de concorrência diz **em paralelo**, com as transações abertas juntas, e não "clique duplo".
Foram três reprovações no F1 por prova sequencial: a segunda chamada era recusada por uma leitura
que o service faz antes, e não pela restrição do banco que o teste dizia provar. Se a operação não
pode acontecer duas vezes ao mesmo tempo, apague a linha; se pode, ela é obrigatória.

## Critério de conclusão

- [ ] Subtarefas concluídas
- [ ] Testes verdes, 100%
- [ ] Portão local carimbado depois da última alteração (`node tools/processo/portao-local.ts`,
  com `--e2e` se tocou tela e `--infra` se mexeu em infra)
- [ ] `test-engineer` aprovado primeiro; `revisor-geral` e os guardiões marcados com rodada que
  vale para o código atual, e APROVADO nos que têm veto
- [ ] Commit feito, só com os arquivos desta tarefa, com a linha `Revisões:`

## Fora do escopo desta tarefa

O que pertence a outra tarefa e não deve ser implementado aqui.

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados-revisoes.md na mesma pasta. Não escreva nenhum dos dois à mão e não acrescente
     seção depois de "Revisões". -->

