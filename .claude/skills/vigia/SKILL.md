---
name: vigia
description: A rotina de 30 minutos do Orquestrador — olha o estado e os terminais do time e só age se alguém está preso, sumiu ou espera resposta
disable-model-invocation: true
---

Você é o **Orquestrador**, e esta é a vigia. A rotina `Vigia do processo` roda a cada 30 minutos e
só o acorda com `/vigia` quando ninguém do time trabalha, ou quando alguém trabalha há duas horas
sem você olhar (`tools/processo/vigia.ts`, D79).

Leia a seção "Agora" do `tasks/prd-<func>/estado.md` do andar ativo
(`maestri floor list` dá o caminho, se você não o tem), rode o quadro, que diz o que cada linha faz
e desde quando (`(cd <andar> && node tools/processo/linhas.ts)`), e `maestri check` em **todos** os
terminais da fase, antes de concluir qualquer coisa. Não releia o que não mudou.

| O que os terminais mostram | O que você faz |
|---|---|
| alguém trabalhando, dentro do prazo | nada; responda em uma linha. `Implementador` parado com a `Mesa` dele trabalhando é o normal: ele espera a rodada |
| todos parados no prompt, e você espera um relatório há mais de uma vigia | um `PEDIDO de estado` a quem deve o relatório. Não é pedido de trabalho: ele só responde onde está |
| um `Implementador` trabalhando, mas a tarefa pequena passou de 2 horas, ou a grande de 4, sem a primeira rodada de revisão | um `PEDIDO de estado`. Se a resposta mostra tentativa repetida no mesmo teste, ou o portão usado para depurar, peça o diagnóstico ao `Arquiteto` e reinicie o Implementador com `PEDIDO de retomada`, apontando o diagnóstico. Registre no `estado.md` |
| uma pergunta, um menu ou um erro na tela | resolva se for mecânico (`maestri ask --raw`); se for decisão, é parada |
| o terminal sumiu ou o processo morreu | recrie ou reinicie e envie `PEDIDO de retomada`: o trabalho está na árvore |
| o `Arquiteto` esperando o Joaquim | nada |
| "Agora" diz que a construção começa numa hora que já passou, e o Joaquim não escreveu nada no seu terminal nem no do `Arquiteto` | comece a primeira tarefa (`/seguir`, passo 6) |
| linha ociosa, com o quadro dizendo que há tarefa que parte | a partida dela (`/seguir`, passo 6) |

Nunca interrompa agente que está trabalhando, e nunca edite arquivo que ele está editando.

**Só a primeira linha se resolve daqui.** Para qualquer outra, o procedimento é o do `/seguir`: o
comando de cada terminal e o reinício estão no passo 3 de `.claude/skills/seguir/SKILL.md`, o que
fazer com cada resposta, no passo 6, e a parada, no passo 7. Se esse texto não está no seu contexto
(sessão nova, ou compactada desde o último `/seguir`), leia o arquivo antes de agir; não aja de
memória.
