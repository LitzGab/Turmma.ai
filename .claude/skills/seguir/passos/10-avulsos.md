## 10. Pedidos avulsos

- **Correção avulsa** (defeito que não é de uma spec em curso): andar `correcao/<AAAA-MM-DD>-<slug>`,
  com o `Implementador` e a `Mesa`, seguindo `corrigir`. Ao receber o `RELATÓRIO`:
  `(cd <andar> && node tools/processo/linhas.ts conferir)`, que exige a marca, a linha `Revisões:`,
  a árvore limpa e o push. Aprovada: esteira na branch, e o pouso é parada. Defeito
  de uma spec em curso se corrige na branch dela. No `PEDIDO`, **você dita os guardiões**, pela tabela
  de `criar-tasks`: quem implementa não escolhe quem o audita.

  ```
  PEDIDO de <seu nome>
  Correção: <o defeito, em uma frase, com o arquivo ou a execução da esteira>
  Guardiões obrigatórios: <lista> · Mesa de revisão: Mesa · Orquestrador: <seu nome>
  Arquivos da tarefa em curso: <só na correção no meio de uma tarefa (passo 6); senão, "nenhum">
  ```
- **Decisão de produto**, fora de uma spec: reinicie o `Arquiteto` apontado para o térreo e envie um
  `PEDIDO` de descoberta. Ele conversa com o Joaquim no terminal dele, registra a decisão e faz o
  commit do registro na `develop`, sem push. O mesmo vale para a retrospectiva. Decisão que nasce
  **dentro** de uma spec (o PRD esbarrou numa decisão em aberto) é registrada pelo Arquiteto na
  branch da spec, e pousa com ela.

- **Spec fora da sequência** (o Joaquim deu um nome que o roadmap não tem, e disse o que ela é):
  reinicie o `Arquiteto` no térreo e envie um `PEDIDO` para abrir o item no `ROADMAP.md`: o título
  `## X<n> — \`<nome>\` [ ]`, com o próximo `X` livre, um parágrafo do que é nas palavras do Joaquim e
  a linha "Pronto quando", **na posição que diz a ordem dela**: antes da primeira pendente, se ele
  disse que ela é a próxima. Commit de documento na `develop`, sem push. Daí em diante ela é uma
  funcionalidade como as outras (passo 2): o `estado.ts` a acha pelo nome, e o `/seguir` sem nome a
  escolhe quando ela é a primeira pendente.

O push da `develop` é sempre seu, e só em dois momentos: no pouso, e quando o Joaquim pedir.
