---
name: status
description: Diz onde o projeto está — funcionalidade em andamento, o que está bloqueado, decisões em aberto que travam o próximo passo, e qual comando rodar agora
argument-hint: "[opcional: F? ou nome-funcionalidade para detalhar]"
---

Você responde uma pergunta só: **onde estamos e qual é o próximo passo?**

A razão de este comando existir: o processo tem muitos artefatos (roadmap, PRD, Tech Spec,
tarefas, decisões em aberto, TODO fora do código). Quem volta ao projeto depois de três dias
não deveria ter que abrir oito arquivos para saber o que fazer. E o Claude, começando uma
sessão limpa, também não.

<critical>NÃO ALTERE NENHUM ARQUIVO. Este comando só lê e reporta.</critical>

Alvo opcional: `$ARGUMENTS`

## O que ler

1. `ROADMAP.md` — estado de cada funcionalidade (`[ ]`, `[~]`, `[x]`) e dependências
2. `tasks/` — para cada pasta `prd-<func>/`, quais artefatos existem (`prd.md`,
   `techspec.md`, `tasks.md`) e quantas tarefas estão `[x]`
3. `CLAUDE.md` seção "Decisões em aberto"
4. `TODO.md` — só os itens que bloqueiam a funcionalidade atual ou a próxima
5. `git log --oneline -10` — o que foi feito por último

## Como decidir o próximo passo

Para a funcionalidade em andamento (ou, se não houver, a primeira `[ ]` com todas as
dependências `[x]`):

| Situação | Próximo passo |
|---|---|
| Não existe `tasks/prd-<func>/prd.md` | `/criar-prd <func>` |
| Existe PRD com status rascunho | revisar e aprovar o PRD |
| PRD aprovado, sem Tech Spec | `/criar-techspec <func>` |
| Tech Spec sem `tasks.md` | `/criar-tasks <func>` |
| `tasks.md` com pendentes | `/executar-tasks <func>` |
| Todas as tarefas `[x]` | conferir o critério de pronto do roadmap e marcar `[x]` |

Se uma **decisão em aberto** do `CLAUDE.md` impede o próximo passo (exemplo: o PRD de F11
precisa da lista final de agentes), o próximo passo é `/descobrir <tema>`, não o PRD.

## Relatório

Curto. Quem lê quer agir, não ler.

```
Educa.ia — status em <data>

Em andamento: F? <nome> — <etapa: PRD | Tech Spec | tarefas n/total>
Concluídas:   F0, F1 ...
Liberadas:    <funcionalidades com dependências prontas, que podem começar>
Bloqueadas:   <F? — o que falta>

Decisões em aberto que travam o caminho próximo:
- <decisão> → trava <F?>

Fora do código, com prazo:
- <item do TODO.md que bloqueia algo próximo>

Último commit: <hash mensagem>

Próximo passo: <comando exato>
```

Se `$ARGUMENTS` apontar uma funcionalidade, detalhe só ela: artefatos, tarefas pendentes
com dependência, vetos que falharam no último relatório, e o próximo comando.
