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
marcada `[x]`, portão local carimbado e revisores obrigatórios aprovados.</critical>
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
4. **Verifique a conclusão nos arquivos, não só no relatório:**
   - `tasks.md`: a tarefa está `[x]`?
   - `git log -1`: o commit `(tarefa N.0)` existe e traz a linha `Revisões:`?
   - Seção "Revisões" do `N_task.md`, escrita pelo hook: todo revisor da linha
     "Subagentes obrigatórios", mais `test-engineer` e `revisor-geral`, tem rodada registrada,
     e a última rodada de cada um com veto (`tenancy-guardian`, `privacy-guardian`,
     `conformidade-reviewer`, `infra-guardian`, `test-engineer`, `revisor-geral`) é APROVADO?
   - Relatório: testes 100%, typecheck limpo, e2e verde se tocou tela, portão local carimbado?

   Revisor obrigatório sem rodada na seção é falha, mesmo que o relatório diga APROVADO.
   - Push: `git rev-list --count origin/main..main` é zero? Commit de tarefa sem push é
     falha, porque a próxima não tem esteira para conferir.
5. **Decisão:** sucesso completo → próxima. Qualquer falha → PARE e reporte.

**A esteira não bloqueia a próxima tarefa, mas bloqueia o commit dela.** A execução leva uns
20 minutos; esperar por ela entre tarefas dobraria o tempo. Por isso a próxima começa logo, e
o subagente confere a esteira do commit anterior antes de commitar (passo 7 de
`executar-task`). Se a esteira ficou vermelha, ele para sem commitar e a execução para aqui.

Depois da última tarefa, espere a esteira do último commit
(`gh run watch <id> --exit-status`) antes do encerramento. Vermelha é falha da execução.

### Prompt para cada subagente

```
Você implementa UMA única tarefa, seguindo integralmente o processo de
`.claude/skills/executar-task/SKILL.md` e as regras de `.claude/rules/`.

Tarefa alvo: a tarefa [N.0] de `tasks/prd-[funcionalidade]/tasks.md`
Arquivo de detalhe: `tasks/prd-[funcionalidade]/[N]_task.md`

Regras obrigatórias:
- Implemente SOMENTE esta tarefa.
- Não conclua enquanto todos os testes não passarem e o typecheck não estiver limpo.
- Tocou tela: rode também o e2e.
- Leia `tasks/prd-[funcionalidade]/achados-revisoes.md`, se existir, e faça a autoconferência
  do passo 2 da skill antes de codar.
- Rode o portão local com carimbo (`node tools/processo/portao-local.ts`, com `--e2e` e
  `--infra` quando se aplicam).
- Revisores (passo 5 da skill): `test-engineer` primeiro e sozinho; com ele aprovado,
  `revisor-geral` e os guardiões marcados em paralelo. Todo prompt começa com
  `Tarefa: tasks/prd-[funcionalidade]/[N]_task.md`; em rodada nova, traga as correções
  exigidas e o diff desde a rodada anterior. ESPERE todos terminarem. Reprovou: corrija e
  chame um revisor novo. O hook registra as rodadas e bloqueia o commit sem elas.
- Antes do commit, confira a esteira do último commit do `main` (passo 7 da skill):
  vermelha, não commite e reporte; rodando, espere.
- Ao concluir, marque `[x]` em tasks.md, faça o commit da tarefa com a linha `Revisões:` e
  o push.
- Retorne relatório curto: STATUS, o que foi implementado, testes, typecheck, a linha
  `Revisões:`, portão local, esteira do commit anterior, push e, em caso de falha, o motivo
  exato.
  Sem dump de código, sem histórico de raciocínio.
```

<critical>Um subagente = uma tarefa.</critical>

## 3. Encerramento

```
Execução de tarefas — [funcionalidade]

Concluídas: [ids desta execução]
Falhou em: [id ou "nenhuma"]
Motivo da parada: [todas concluídas | falha na tarefa X: motivo]
Esteira no último commit: [verde | vermelha: job]
Pendentes restantes: [lista]
```

Com todas as tarefas concluídas, o próximo passo é `/validar <funcionalidade>` e, depois dele,
`/retro <funcionalidade>`.

## Notas

- O isolamento por subagente evita acúmulo de contexto. Trate cada um como execução limpa.
- Não agrupe tarefas em um subagente.
- Não marque tarefa como concluída você mesmo.
- Em dúvida sobre ordem, pergunte antes de disparar o próximo.
