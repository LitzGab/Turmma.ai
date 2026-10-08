---
name: status
description: Procedimento interno — diz onde o projeto está, o que está bloqueado e qual é o próximo passo, sem alterar nada
argument-hint: "[opcional: F? ou nome-funcionalidade para detalhar]"
user-invocable: false
---

Você responde uma pergunta só: **onde estamos e qual é o próximo passo?** É o que o Orquestrador
faz no passo 2 do `/seguir`, e o que qualquer agente faz quando alguém pergunta o estado.

<critical>NÃO ALTERE NENHUM ARQUIVO. Este procedimento só lê e reporta.</critical>

Alvo opcional: `$ARGUMENTS`

## O que ler

1. `node tools/processo/estado.ts [funcionalidade]` — a fase, a contagem de tarefas, a tarefa da vez
   com porte e revisores, e as rodadas já registradas. **A fase vem daqui, nunca de inferência.** Com
   andar da spec criado (`maestri floor list`), rode dentro do checkout do andar: é o estado que vale
2. `tasks/prd-<func>/estado.md` do andar, se existir — o diário do Orquestrador: o que ele espera, o
   que falhou e o que decidiu sem perguntar
3. A nota "Fila do Joaquim" (`maestri note read "Fila do Joaquim"`) — o que espera decisão dele
4. `CLAUDE.md`, seção "Decisões em aberto" — só as que travam a funcionalidade da vez ou a próxima
5. `TODO.md` — só os itens que bloqueiam a funcionalidade da vez ou a próxima
6. `git log --oneline -5` do andar

Se uma **decisão em aberto** impede o próximo passo (exemplo: o PRD de F11 precisa da lista final
de agentes), o próximo passo é a descoberta dessa decisão, não o PRD.

## Relatório

Curto. Quem lê quer agir, não ler.

```
Turmma — status em <data>

Da vez:      F? <nome> — <fase> (<n> de <total> tarefas), no andar <andar>
Concluídas:  F0, F1 ...
Esperando o Joaquim: <entradas abertas da fila, uma linha cada, ou nada>
Decisões em aberto que travam o caminho próximo:
- <decisão> → trava <F?>
Fora do código, com prazo:
- <item do TODO.md que bloqueia algo próximo>
Último commit: <hash mensagem>

Próximo passo: <o que o /seguir faz agora>
```

Se `$ARGUMENTS` apontar uma funcionalidade, detalhe só ela: artefatos, tarefas pendentes com
dependência, a última rodada de cada revisor na tarefa da vez, e o próximo passo.
