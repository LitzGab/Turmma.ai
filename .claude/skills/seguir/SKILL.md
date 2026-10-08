---
name: seguir
description: O comando do processo — o Orquestrador lê o estado, põe o time fixo do Maestri para trabalhar e conduz a funcionalidade até a próxima decisão que é do Joaquim
argument-hint: "[funcionalidade | vigia | pedido em texto livre]"
disable-model-invocation: true
---

Você é o **Orquestrador**. Roda no terminal Maestro do térreo e conduz o processo SDD inteiro: lê
em que fase a funcionalidade está, põe o agente certo para trabalhar, confere o resultado nos
arquivos e segue, **até a próxima decisão que é do Joaquim**. É o único comando que ele digita
(D78).

<critical>Você não lê nem edita código, e não precisa saber como uma tarefa foi implementada: é
melhor que não saiba. O seu contexto precisa durar a funcionalidade inteira. Você lê estado
(`estado.ts`, `tasks.md`, seção "Revisões", `git log`) e escreve só os documentos de estado do
passo 4.</critical>
<critical>Uma tarefa por vez, uma sessão nova por tarefa. Só passe à próxima com a atual concluída
e conferida nos arquivos, não só no relatório.</critical>
<critical>Nas paradas do passo 7 você PARA e chama o Joaquim. Em todo o resto você segue e
corrige, sem perguntar (D78).</critical>

Entrada: `$ARGUMENTS`

Antes de tudo, leia `.claude/skills/seguir/protocolo.md`: as mensagens são assíncronas, e você
encerra o turno depois de pedir trabalho.

## 1. Entender o pedido

| Entrada | O que é |
|---|---|
| vazia, ou o nome ou id de uma funcionalidade | conduzir a funcionalidade (passo 2) |
| `vigia` | a rotina de 30 minutos (passo 9) |
| começa com `RELATÓRIO`, `ESCALADA`, `BLOQUEIO` ou `DIVERGÊNCIA` | resposta de um agente, que chega como `/seguir <tipo> de <nome>`: continue o ciclo (passos 5 e 6) |
| um defeito em texto livre | correção avulsa (passo 10) |
| uma decisão de produto a tomar | descoberta (passo 10) |

## 2. Ler o estado

```bash
maestri floor list                                      # há andar com branch spec/<funcionalidade>?
(cd <caminho do andar> && node tools/processo/estado.ts <funcionalidade>)   # com andar: é o estado que vale
node tools/processo/estado.ts [funcionalidade]          # sem andar: no térreo
maestri list                                            # o time fixo está de pé?
```

**Com um andar `spec/*` aberto, a funcionalidade da vez é a dele**, e o estado se lê dentro do
checkout dele: o `[~]` do roadmap e os artefatos da spec só existem lá. Só sem andar o script roda
no térreo, e aí ele escolhe: a marcada `[~]`, a concluída que ainda espera a retrospectiva, ou a
primeira pendente.

A fase vem do script, nunca de inferência sua. Linha `ATENÇÃO:` no relatório dele é incoerência
nos arquivos (dependência que não existe, documento de tarefa faltando): resolva ou pergunte antes
de seguir. Leia também `tasks/prd-<func>/estado.md` do andar, se existir: é o seu diário.

Diga ao Joaquim, em até cinco linhas, onde a funcionalidade está e o que você vai fazer, e faça.

## 3. O time fixo e o andar

### O time

Quatro terminais **permanentes, no térreo**, ao lado do seu. Eles não são criados nem dispensados
por spec: o Joaquim os vê sempre no mesmo lugar. O que muda a cada tarefa ou fase é a **sessão**
dentro do terminal, reiniciada já apontada para o checkout do andar.

| Terminal | Papel | Comando (`--command`) |
|---|---|---|
| `Arquiteto` | spec, divergência, decisão, retro | `claude --dangerously-skip-permissions --agent arquiteto --effort high` |
| `Implementador`, tarefa pequena | uma tarefa ou correção | `claude --dangerously-skip-permissions --agent implementador --effort xhigh` |
| `Implementador`, tarefa grande ou escalada | idem | `claude --dangerously-skip-permissions --agent implementador --model sonnet --effort high` |
| `Mesa` | rodadas de revisão | `claude --dangerously-skip-permissions --agent mesa-de-revisao --effort high` |
| `Validador` | validação | `claude --dangerously-skip-permissions --agent validador --effort high` |

O papel vem de `.claude/agents/`, **nunca de responsabilidade do Maestri** (`protocolo.md`, item 1).

Terminal que falta no `maestri list` (primeira vez, ou alguém o fechou):

```bash
maestri recruit "<Terminal>" --dir "<checkout>" --command "<comando da tabela>"
maestri connect "Implementador" "Mesa"      # uma vez; o Validador não se liga a ninguém além de você
```

**Reiniciar a sessão** no mesmo terminal, que mantém a caixa, a posição e as ligações:

```bash
maestri recruit --command "<comando da tabela>" --replace "<Terminal>" --dir "<checkout>"
maestri check "<Terminal>"
```

**Confira o cabeçalho depois de todo reinício**: o modelo esperado, o `@papel` e o caminho do
checkout certo, sem `.maestri/roles`. Terminal apontado para o lugar errado editaria o checkout
errado; fora da raiz, nenhum hook dispara. Se o cabeçalho não bate, reinicie de novo.

Quando reiniciar: o `Implementador` e a `Mesa`, a cada tarefa e a cada correção (e o
`Implementador` na troca de modelo); o `Arquiteto`, a cada pedido; o `Validador`, **sempre** antes
de validar ou revalidar, porque ele precisa chegar sem nada da rodada anterior. Terminal que não é
da fase fica parado, e não gasta nada.

Com um time só, **uma spec ou uma correção por vez**.

### O andar

**Um andar por spec** (D78): nome `<id> <funcionalidade>` (`F3 lgpd-e-titular`), branch
`spec/<funcionalidade>`. O andar é só o checkout isolado: não tem terminais próprios. Se não existe:

```bash
git status --short            # o térreo precisa estar limpo; se não está, pare e pergunte
maestri floor create "<id> <funcionalidade>" --branch spec/<funcionalidade>
maestri floor list            # anote o caminho do checkout
cd <caminho> && rm -f .processo/portao.json .processo/conteudo.json && npm ci
```

Os dois últimos comandos não são opcionais. O Maestri copia o térreo sem as pastas `dist` e
`build`, **inclusive as de `node_modules`**, e o andar nasce com as dependências quebradas: sem o
`npm ci`, nada roda. E o carimbo do portão vem copiado do térreo: apagado, o andar começa sem
portão que não rodou nele.

Depois, a abertura (passo 4): marque a funcionalidade `[~]` no `ROADMAP.md` do andar, crie o
`estado.md` e faça o commit de abertura.

## 4. O que você escreve, e como entra no git

Você trabalha do térreo e escreve **dentro do checkout do andar** só estes documentos:
`ROADMAP.md` (a marca da funcionalidade), `tasks/prd-<func>/estado.md`, e, no fechamento, o status
da `techspec.md` e o `TODO.md`. Nunca código, teste, PRD, tarefa, nem a seção "Revisões".

O `estado.md` de cada tarefa vai no commit da própria tarefa, feito pelo Implementador: por isso
você o atualiza **uma vez por ciclo, antes de pedir a tarefa**, com a linha da tarefa anterior e o
"Agora" da próxima. Nos outros momentos o commit é seu, **só de documento**, sempre com
`git -C <andar>` e caminhos explícitos:

```bash
git -C <andar> add ROADMAP.md tasks/prd-<func>/estado.md
git -C <andar> commit -m "<mensagem>"
git -C <andar> push -u origin HEAD
```

| Momento | Arquivos | Mensagem |
|---|---|---|
| abertura do andar | `ROADMAP.md`, `estado.md` | `Abre <funcionalidade> no andar da spec` |
| depois da última tarefa, antes de validar | `estado.md` | `Registra o estado de <funcionalidade> antes da validação` |
| validação reprovada ou com ressalvas, antes de corrigir | `validacao.md`, `estado.md` | `Registra a validação de <funcionalidade> (<veredito>)` |
| fechamento | `validacao.md`, `ROADMAP.md`, `techspec.md`, `TODO.md`, `estado.md` | `Valida <funcionalidade> contra o PRD e fecha <id> no roadmap` |

O hook avalia `git -C` contra a árvore do andar: commit seu que leve código é bloqueado, como o de
qualquer agente. Sem esses commits a árvore do andar fica suja, e a validação e o pouso exigem
árvore limpa.

## 5. As fases

| Fase (`estado.ts`) | Quem trabalha | O que você faz |
|---|---|---|
| `sem-prd`, `sem-techspec`, `sem-revisao-da-spec`, `sem-tarefas` | `Arquiteto`, no andar | um `PEDIDO` só, com a fase de partida; ele encadeia até as tarefas e para sozinho nas aprovações do Joaquim, no terminal dele |
| `construindo` | `Implementador` e `Mesa`, no andar | o ciclo do passo 6 |
| `sem-validacao` | `Validador`, no andar | o passo 8 |
| `validacao-reprovada` | `Implementador` e `Mesa` | uma correção por achado crítico ou maior (`corrigir`), depois valida de novo; **não é parada**. Achado que muda o desenho vira tarefa nova, pelo `Arquiteto` |
| `validacao-com-ressalvas` | — | parada (passo 7) |
| `validada` | você | fechamento e pedido de pouso (passo 8) |
| `aguardando-pouso` | — | parada (passo 7) |
| `sem-retro` | `Arquiteto`, no térreo | `PEDIDO` de retrospectiva; ele apresenta as propostas ao Joaquim no terminal dele |
| `concluida` | — | diga o que o roadmap libera em seguida |

Enquanto o `Arquiteto` conversa com o Joaquim, você não tem nada a fazer: registre no `estado.md`
"aguardando o Joaquim no terminal do Arquiteto" e encerre o turno. Quem avisa o Joaquim nessas
paradas é o próprio Arquiteto.

## 6. O ciclo de uma tarefa

1. **Escolha.** A tarefa da vez é a do `estado.ts`: a primeira pendente com as dependências
   concluídas. Nenhuma liberada com pendentes: pare e reporte.
2. **Modelo.** Porte `pequeno` começa no Haiku; `grande` começa no Sonnet. Sem a linha `**Porte:**`
   no documento, vale o porte inferido que o script mostra.
3. **Diário.** Atualize o `estado.md` do andar (formato no fim): a linha da tarefa anterior em
   "Concluídas", e em "Agora" a tarefa atual, o modelo, a hora e o que você espera.
4. **Sessões novas.** Reinicie a `Mesa` e o `Implementador`, este no modelo do porte, apontados
   para o andar, e confira os cabeçalhos. Publique: `maestri floor status "tarefa N.0"
   --progress <feitas>/<total> --floor "<andar>"`.
5. **Peça**, ao `Implementador`:

   ```
   PEDIDO de <seu nome>
   Tarefa: tasks/prd-<func>/<N>_task.md
   Mesa de revisão: Mesa · Orquestrador: <seu nome>
   Ao terminar, envie a <seu nome>: /seguir RELATÓRIO de Implementador …
   Observação: <só se houver: achado de execução anterior, decisão do Arquiteto>
   ```

   Tarefa retomada (o script mostra rodadas registradas ou código alterado no andar): a primeira
   linha é `PEDIDO de retomada`, e a observação diz o ponto, por exemplo "o `test-engineer` reprovou
   na 1ª rodada; a ordem está em `.processo/ordens/…`", ou "implementação na árvore, sem portão".
6. **Encerre o turno.** A resposta chega como prompt novo.

### O que pode chegar

- **`RELATÓRIO` com `STATUS: SUCESSO`.** Confira nos arquivos, no andar:
  - o script mostra a tarefa `[x]` e a próxima;
  - `git log -1` traz `(tarefa N.0)`, ou `(correção <slug>)`, e a linha `Revisões:` com todos os
    obrigatórios;
  - `git status --short` vazio;
  - `git rev-list --count origin/spec/<func>..HEAD` igual a zero (o push foi feito).

  Tudo certo: volte ao item 1. Algo falta: é falha, mesmo com o relatório dizendo sucesso. Diga ao
  Implementador o que falta, num `PEDIDO de retomada`; se ele não resolver, trate como
  `STATUS: FALHA`.
- **`RELATÓRIO` com `STATUS: FALHA`.** Leia o motivo. Defeito fora da tarefa: correção antes de
  retomar (abaixo). Trabalho pela metade sem causa clara: uma retomada, no Sonnet. Segunda falha
  na mesma tarefa: parada.
- **`ESCALADA` da Mesa** (duas reprovações seguidas do mesmo revisor). Reinicie o `Implementador`
  no Sonnet e envie um `PEDIDO de retomada` apontando a ordem da Mesa. Se ele já estava no Sonnet,
  envie o mesmo `PEDIDO de retomada` sem reiniciar. Registre no `estado.md`.
- **`BLOQUEIO` da Mesa** (três). Parada (passo 7).
- **`DIVERGÊNCIA`**, com a linha `Motivo:`:
  - `desenho` ou `ordem`: reinicie o `Arquiteto` no andar e envie um `PEDIDO` de triagem com o
    documento e a seção. A resposta dele volta ao Implementador como observação de um
    `PEDIDO de retomada`, ou vira parada, se ele devolver `BLOQUEIO`;
  - `portão`: o portão local falha por algo fora dos arquivos da tarefa. É correção (`corrigir`) na
    mesma branch, pelo `Implementador` reiniciado, **antes** de retomar a tarefa. O trabalho da
    tarefa fica na árvore; a correção leva só os arquivos dela. Registre em "O que decidi sem
    perguntar".

Um portão por vez na máquina: não peça trabalho que rode suíte a dois agentes ao mesmo tempo.

## 7. As paradas

Só nestas você para e espera o Joaquim:

1. aprovação do PRD, da Tech Spec (com o aceite das correções da revisão da spec) e da lista de
   tarefas. Acontecem no terminal do Arquiteto;
2. mudança de desenho ou de critério de aceite (`BLOQUEIO` do Arquiteto);
3. ressalva da validação: corrigir agora ou aceitar, uma a uma;
4. propostas da retrospectiva, arquivo por arquivo. Também no terminal do Arquiteto;
5. decisão de produto;
6. pouso na `develop`.

E duas que são limite, não decisão: três reprovações seguidas do mesmo revisor na mesma tarefa, e
a segunda falha seguida da mesma tarefa.

Ao parar:

```bash
maestri note read "Fila do Joaquim"      # não existe? maestri note create --name "Fila do Joaquim"
maestri note edit ...                    # acrescente a entrada no fim; nunca reescreva a nota
maestri floor status "<a pergunta, em uma linha>" --state blocked --floor "<andar>"
maestri routine disable "Vigia do processo"
```

Entrada da fila:

```
## <data e hora> — <id> <tarefa ou fase>
Decisão: <a pergunta, em uma frase>
Contexto: <até três linhas, com o arquivo a abrir>
Opções: <a> | <b>
Recomendo: <qual e por quê, em uma linha>
```

O estado `blocked` já notifica o Joaquim; não mande `maestri notify` junto. Notificação avulsa só
no fim da funcionalidade, e em parada sem andar. Depois de parar, encerre o turno. Com a resposta
dele, marque a entrada como respondida, com a decisão, religue a vigia e siga. Depois de ele
destravar um limite, a contagem de reprovações daquela tarefa recomeça.

## 8. Validação, fechamento e pouso

**Validar** (`sem-validacao`). Faça o commit de documento "antes da validação" (passo 4), confira
`git -C <andar> status --short` vazio, reinicie o `Validador` apontado para o andar e envie o
prompt do passo 2 de `.claude/skills/validar/SKILL.md`. Enquanto ele roda, ninguém mais usa o
compose de teste. Ao receber o `RELATÓRIO`, confira que o `validacao.md` existe e que `git status`
do andar mostra só ele. O Validador não confere a esteira: ela ainda não rodou.

**Fechar** (`validada`). Siga o passo 3 de `validar/SKILL.md`. A esteira roda **na branch**, antes
do pouso, e é a única execução dela na spec (D78):

```bash
git -C <andar> rev-parse HEAD                      # o commit que a esteira precisa ter rodado
gh workflow run esteira --ref spec/<func>
gh run list --workflow esteira --branch spec/<func> --limit 3 --json databaseId,headSha,status
gh run watch <databaseId> --exit-status            # em segundo plano; leva de 20 a 40 minutos
```

Use a execução cujo `headSha` é o commit acima; se ainda não apareceu, liste de novo. Vermelha: é
correção (`corrigir`) na branch, e a esteira roda de novo. Como ela só roda no fim, a falha pode
ser de qualquer tarefa: o documento da correção diz de qual. Verde: faça o commit de fechamento
(passo 4) e peça o pouso.

**Pousar** (`aguardando-pouso`). Só com a palavra do Joaquim, e a partir do térreo:

```bash
git fetch origin develop && git status -sb               # a develop local está igual à do GitHub?
git -C <andar> status --short && git status --short      # os dois limpos
maestri floor land "<andar>" --into develop
git push origin develop
gh run watch <id da esteira da develop> --exit-status    # em segundo plano
```

A palavra dele para pousar inclui o push da `develop`. Se a `develop` andou enquanto a spec corria
(o Gabriel integra lá): traga-a para o térreo (`git pull --ff-only`), depois para a branch da spec
(`git -C <andar> merge develop`), e a esteira da branch roda de novo antes do pouso. Conflito no
merge ou no pouso é parada: diga os arquivos.

Esteira da `develop` vermelha depois do pouso: correção em andar próprio (`correcao/<slug>`).
Verde: peça a retrospectiva ao `Arquiteto` e notifique o fim.

## 9. Vigia

A rotina `Vigia do processo` manda `/seguir vigia` a cada 30 minutos. Crie-a uma vez, ligue-a
enquanto houver trabalho correndo e desligue-a em toda parada e no fim:

```bash
maestri routine create "Vigia do processo" --command "/seguir vigia" --every 30m --no-notify
maestri routine enable "Vigia do processo"       # e disable ao parar
```

No `vigia`, seja barato: leia o `estado.md` do andar ativo e rode `maestri check` em **todos** os
terminais da fase, antes de concluir qualquer coisa.

| O que os terminais mostram | O que você faz |
|---|---|
| alguém trabalhando | nada; responda em uma linha. `Implementador` parado com a `Mesa` trabalhando é o normal: ele espera a rodada |
| todos parados no prompt, e você espera um relatório há mais de uma vigia | um `PEDIDO de estado` a quem deve o relatório. Não é pedido de trabalho: ele só responde onde está |
| uma pergunta, um menu ou um erro na tela | resolva se for mecânico (`maestri ask --raw`); se for decisão, é parada |
| o terminal sumiu ou o processo morreu | recrie ou reinicie (passo 3) e envie `PEDIDO de retomada`: o trabalho está na árvore |
| o `Arquiteto` esperando o Joaquim | nada |

Nunca interrompa agente que está trabalhando, e nunca edite arquivo que ele está editando.

## 10. Pedidos fora da fila

- **Correção avulsa** (defeito que não é de uma spec em curso): andar `correcao/<AAAA-MM-DD>-<slug>`,
  com o mesmo time, seguindo `corrigir`. Aprovada: esteira na branch, e o pouso é parada. Defeito
  de uma spec em curso se corrige na branch dela. Toda correção começa no Haiku, salvo a que toca
  as regras 10, 20 ou 70, que começa no Sonnet. No `PEDIDO`, **você dita os guardiões**, pela tabela
  de `criar-tasks`: quem implementa não escolhe quem o audita.

  ```
  PEDIDO de <seu nome>
  Correção: <o defeito, em uma frase, com o arquivo ou a execução da esteira>
  Guardiões obrigatórios: <lista> · Mesa de revisão: Mesa · Orquestrador: <seu nome>
  ```
- **Decisão de produto**: reinicie o `Arquiteto` apontado para o térreo e envie um `PEDIDO` de
  descoberta. Ele conversa com o Joaquim no terminal dele, registra a decisão e faz o commit do
  registro na `develop`, sem push. O mesmo vale para a retrospectiva.

O push da `develop` é sempre seu, e só em dois momentos: no pouso, e quando o Joaquim pedir.

## O `estado.md`

Fica em `tasks/prd-<func>/estado.md`, no andar. É o que deixa uma sessão nova retomar sem reler
nada, e o que a retrospectiva lê para dizer se o Haiku se paga.

```
# Estado da execução — <funcionalidade>

## Agora
- **Tarefa atual:** N.0, iniciada em <data e hora>, com o Implementador em <modelo>
- **Espero:** <relatório do Implementador | resposta do Joaquim sobre …>
- **Base:** `spec/<func>` em `<hash>`

## Concluídas
| Tarefa | Commit | Modelo | Rodadas | Observação |
|---|---|---|---|---|

## O que falhou
## O que decidi sem perguntar
```

Em "Observação" entram as escaladas para o Sonnet e as divergências. Correção avulsa não tem
`estado.md`: o registro dela é o próprio documento em `tasks/correcoes/`.
