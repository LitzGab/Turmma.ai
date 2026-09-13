---
name: executar-tasks
description: Orquestra a execução sequencial de todas as tarefas pendentes de uma funcionalidade
argument-hint: <nome-funcionalidade | caminho da pasta | caminho do tasks.md>
disable-model-invocation: true
---

Você é um **orquestrador**. Executa todas as tarefas pendentes de um `tasks.md`, uma de
cada vez, delegando cada uma a um subagente com contexto limpo.

Duas coisas explicam este desenho. A primeira: contexto acumulado polui. Um subagente que já
implementou seis tarefas carrega detalhes irrelevantes e começa a improvisar em vez de
seguir a Tech Spec. A segunda: cada tarefa passa por auditorias com poder de veto, e se uma
falha, tudo que viesse depois estaria construído sobre uma base reprovada.

Seu trabalho é saber quais tarefas existem, em que ordem, e se cada uma concluiu. Você não
precisa saber como elas foram implementadas, e é melhor que não saiba.

<critical>Cada tarefa é executada por um subagente NOVO. Você não transfere contexto de
implementação entre tarefas. Ao orquestrador cabe saber quais tarefas existem, sua ordem, e
se cada uma concluiu com sucesso.</critical>
<critical>Só inicie a próxima depois que a atual concluir COMPLETAMENTE e SEM ERRO:
marcada `[x]`, testes 100%, typecheck limpo, vetos aprovados e revisão aprovada.</critical>
<critical>Se uma tarefa falhar, PARE. Não inicie a próxima. Reporte e aguarde instrução.</critical>

Alvo: `$ARGUMENTS`

## Resolução do alvo

- Nome da funcionalidade → `tasks/prd-$ARGUMENTS/tasks.md`
- Caminho de pasta → o `tasks.md` dentro dela
- Caminho direto para um `tasks.md` → use-o

Vazio ou ambíguo: liste as pastas em `tasks/` e pergunte.

## 1. Ler e planejar (uma vez)

1. Leia o `tasks.md`.
2. Extraia tarefas e estado: `[ ]` pendente, `[x]` concluída (pule).
3. Leia a seção de dependências e paralelismo.
4. Monte a ordem: siga a numeração, mas nunca inicie tarefa com dependência pendente.
5. Apresente a fila e comece.

## 2. Loop sequencial

Para cada tarefa pendente:

1. **Verifique dependências.** Alguma não `[x]` → PARE e reporte.
2. **Dispare um subagente novo** para ESTA tarefa, com o prompt abaixo.
3. **Aguarde.** Nada em paralelo.
4. **Verifique a conclusão** relendo `tasks.md` e o relatório: marcada `[x]`? testes 100%?
   typecheck limpo? tocou tela e e2e passou? tocou dado de escola e `tenancy-guardian`
   aprovou? tocou dado pessoal e `privacy-guardian` aprovou? tocou nota, tutor ou autonomia e
   `conformidade-reviewer` aprovou? tocou caminho quente (login, tutor, sala, prova, fila,
   IA, migration, deploy) e `infra-guardian` aprovou? revisão aprovada?
5. **Decisão:** sucesso completo → próxima. Qualquer falha → PARE e reporte.

### Prompt para cada subagente

```
Você implementa UMA única tarefa, seguindo integralmente o processo de
`.claude/skills/executar-task/SKILL.md` e as regras de `.claude/rules/`.

Tarefa alvo: a tarefa [N.0] de `tasks/prd-[funcionalidade]/tasks.md`
Arquivo de detalhe: `tasks/prd-[funcionalidade]/[N]_task.md`

Regras obrigatórias:
- Implemente SOMENTE esta tarefa.
- Acione os subagentes marcados no arquivo da tarefa.
- Não conclua enquanto todos os testes não passarem e o typecheck não estiver limpo.
- Tocou tela: rode também o e2e.
- Veto de tenancy-guardian, privacy-guardian, conformidade-reviewer ou infra-guardian é falha da tarefa
  até ser corrigido.
- Execute a revisão. Reprovou, corrija e revise de novo.
- Ao concluir, marque `[x]` em tasks.md e faça o commit da tarefa.
- Retorne relatório curto: STATUS, o que foi implementado, testes, typecheck, vetos,
  revisão e, em caso de falha, o motivo exato.
  Sem dump de código, sem histórico de raciocínio.
```

<critical>Um subagente = uma tarefa.</critical>

## 3. Encerramento

```
Execução de tarefas — [funcionalidade]

Concluídas: [ids desta execução]
Falhou em: [id ou "nenhuma"]
Motivo da parada: [todas concluídas | falha na tarefa X: motivo]
Pendentes restantes: [lista]
```

## Notas

- O isolamento por subagente evita acúmulo de contexto. Trate cada um como execução limpa.
- Não agrupe tarefas em um subagente.
- Não marque tarefa como concluída você mesmo.
- Em dúvida sobre ordem, pergunte antes de disparar o próximo.
