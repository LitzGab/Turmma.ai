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
| recomeço da tela: [a segunda pessoa na mesma aba, sem reload; a mesma entrada de novo — mesmo link, mesmo token; a resposta atrasada da entrada anterior; a lista recarregada ou a falha com o diálogo aberto] | e2e | |
| log novo: [a linha capturada] | integração | não leva nome, e-mail, matrícula, token, senha nem código (regra 20, item 9) |

A linha de concorrência diz **em paralelo**, com as transações abertas juntas, e não "clique duplo".
Foram três reprovações no F1 por prova sequencial: a segunda chamada era recusada por uma leitura
que o service faz antes, e não pela restrição do banco que o teste dizia provar. Se a operação não
pode acontecer duas vezes ao mesmo tempo, apague a linha; se pode, ela é obrigatória.

A linha de recomeço vale para tarefa que cria ou altera tela com sessão, link ou formulário, e leva os
quatro casos — segunda pessoa, mesma entrada, resposta atrasada, e a lista recarregada ou a falha com o
diálogo aberto (o foco, o aviso e o desafio da tentativa anterior saem) — ou diz por que um não se aplica.
Foram nove achados no F1 e três reprovações na A0 (10.0 e 11.0): o cache da pessoa anterior que
nenhum teste provava esvaziar, e o mesmo link colado de novo na aba, que não mudava o estado e
deixava a tela presa com o token na barra. Na A0b foram mais quatro, todas no quarto caso: o foco,
o aviso ou o desafio da tentativa anterior sobrando depois de uma falha ou de a lista recarregar.
A linha de log vale para toda linha de log nova, e sai quando a tarefa não escreve nenhuma: três
recomendações na A0 (7.0, 8.0, 9.0) foram log sem teste do conteúdo.

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

## Mutações

Preenchida por quem implementa, antes dos revisores (`/executar-task`, passo 2). Uma linha por
cláusula que o diff acrescenta — condição de `where`, `if` de guarda, `catch` que traduz erro,
restrição ou índice de migration, trava de clique, classe CSS que o e2e diz provar —, inclusive as
que a tabela de testes não cita e as cópias da mesma regra em outro arquivo. Apagada, rodada,
vermelha, restaurada.

| Cláusula (`arquivo:linha`) | Teste que ficou vermelho |
|---|---|

## Recomendações sem aplicar

Recomendação de revisor que não foi aplicada, com destino: `TODO.md`, a tarefa que toca o arquivo,
ou recusada com o motivo. "Anularia as aprovações" não é motivo (`/executar-task`, passo 5). Sem
nenhuma, escreva "nenhuma".

| Revisor e rodada | Recomendação | Destino ou motivo |
|---|---|---|

<!-- A seção "Revisões" é criada no fim deste arquivo pelo hook tools/processo/revisoes.ts,
     quando o primeiro revisor termina, e o que os revisores exigem vai para
     achados/<este arquivo>, resumido em achados/indice.md. Não escreva nenhum dos três à mão
     e não acrescente seção depois de "Revisões". -->

