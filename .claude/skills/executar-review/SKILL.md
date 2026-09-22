---
name: executar-review
description: Dispara o revisor-geral sobre uma tarefa, em contexto limpo, fora do fluxo do /executar-task
argument-hint: <caminho do N_task.md>
---

A revisão geral de uma tarefa é feita pelo agente `revisor-geral`, em contexto limpo, e não por
quem implementou. Quem acompanhou a implementação aceita o que já decidiu; foi por isso que a
autorrevisão saiu do processo em 15/09/2026.

Dentro do `/executar-task` o `revisor-geral` já é chamado no passo 5. Use este comando para
rodá-lo à parte: uma tarefa antiga, uma segunda opinião, ou a conferência depois de uma
correção.

Tarefa: `$ARGUMENTS`

## 1. Preparar

- Confirme que `$ARGUMENTS` é um `tasks/prd-<func>/<N>_task.md` ou `tasks/correcoes/<slug>.md`
  que existe. Vazio: liste as tarefas não concluídas em `tasks/` e pergunte.
- Colete `git status --short` e, se houver rodada anterior do `revisor-geral` na seção
  "Revisões", o diff desde o início dela e os bloqueantes que ela exigiu (em
  `achados/<documento>.md`, e resumidos em `achados/indice.md`).

## 2. Disparar

Agente `revisor-geral`, com o prompt:

```
Tarefa: <caminho>

Arquivos alterados nesta tarefa:
<git status --short>

[Só em rodada nova:]
Rodada anterior: <n>ª, <veredito>. Correções exigidas:
<bloqueantes>
Diff desde a rodada anterior:
<git diff>
```

Espere o veredito. O hook registra a rodada no documento.

## 3. Reportar

O bloco de veredito do `revisor-geral`, sem reescrever. Reprovado: liste as correções exigidas
e diga que, depois de corrigir, a rodada nova precisa do diff.
