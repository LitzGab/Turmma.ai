## 9. Vigia e contexto

A rotina `Vigia do processo` roda a cada 30 minutos e só manda **`/vigia`** quando há o que olhar:
antes de acordar você, ela roda `tools/processo/vigia.ts`, que não imprime nada com o time
trabalhando. A skill da vigia é própria e curta (`.claude/skills/vigia/SKILL.md`). Ligue a rotina
enquanto houver trabalho correndo e desligue-a no fim e em toda parada em que nenhuma tarefa segue
(passo 7). Só a crie se `maestri routine list` não a mostrar, para não ficar com duas:

```bash
maestri routine show "Vigia do processo"         # o comando é {{output}}, com o --pre-run abaixo?
maestri routine edit "Vigia do processo" --command "{{output}}" --pre-run "node $PWD/tools/processo/vigia.ts"
maestri routine enable "Vigia do processo"       # e disable ao parar
maestri routine create "Vigia do processo" --command "{{output}}" --pre-run "node $PWD/tools/processo/vigia.ts" --every 30m --no-notify   # só se não existir
```

Na primeira vez com o `--pre-run`, dispare-a com alguém trabalhando (`maestri routine run`): nada
pode chegar ao seu terminal. Se chegar texto que não é `/vigia`, volte o comando para `/vigia`, sem
`--pre-run`, e registre em "O que falhou".

**O seu contexto é limpo a cada tarefa** (D78). O time recomeça
a sessão a cada tarefa, e você também. Você não consegue digitar `/clear`: quem digita é a rotina
`Limpa o Orquestrador`, pausada, que só dispara quando alguém manda. E ela pula o disparo se o seu
terminal estiver ocupado, por isso não adianta dispará-la de dentro do turno: você solta um processo
que espera o turno acabar e dispara com você já parado. É o **último comando do turno**, num Bash
comum (não em segundo plano, que devolveria um aviso à sessão limpa):

```bash
d="$(git rev-parse --git-common-dir)/../.processo" && mkdir -p "$d" && date -u +'{"pedida":"%FT%TZ"}' >"$d/limpeza.json"; nohup setsid sh -c 'sleep 25; maestri routine run "Limpa o Orquestrador"' >/dev/null 2>&1 &
```

Depois dele, encerre o turno em uma linha, sem rodar mais nada: se o turno durar mais de 25 segundos,
a rotina encontra o terminal ocupado e pula. O comando grava `pedida` em
`.processo/limpeza.json` do térreo, de onde quer que rode (pelo `git`); o início da sessão limpa (`source: clear`, sem papel, no térreo) acrescenta
`feita`. **Pedida há mais de 10 minutos sem `feita` depois dela, a limpeza se perdeu e a vigia
(`tools/processo/vigia.ts`) acorda você**, mesmo com o time trabalhando: grave o "Agora" e refaça o
comando no fim do turno, que grava uma `pedida` nova.

- **Quando:** depois de pedir uma tarefa nova (passo 6, item 6) ou a validação (passo 8), e depois
  do commit de fechamento. Nunca no meio de uma tarefa, nem com um pedido ainda
  por conferir, nem no turno em que você faz uma pergunta ao Joaquim: a resposta dele chega nessa conversa.
- **Antes:** o "Agora" do `estado.md` diz o que você espera, de quem, em que tentativa a tarefa está,
  e **tudo o que você ainda deve fazer** (um merge combinado, um pedido ao Arquiteto, uma pendência da
  validação). Depois da limpeza é só isso que existe.
- **Depois:** o aviso do hook de início de sessão manda reler este texto, o protocolo e as duas
  seções do diário (passo 2). Mensagem curta do time pode chegar como comando, e aí este texto já vem
  com ela; a longa chega colada, e é o aviso que vale.
- **A rotina** já existe no workspace. Só a crie se `maestri routine list` não a mostrar:
  `maestri routine create "Limpa o Orquestrador" --command "/clear" --weekly sun@04:00 --disabled --no-notify`
  (o Maestri exige um horário; pausada, ela nunca dispara sozinha, e o `routine run` a dispara mesmo assim).

**Por isso, antes de encerrar qualquer turno em que algo mudou** (um pedido enviado, uma resposta
recebida, uma decisão sua), o "Agora" do `estado.md` diz o que você espera e de quem. O que só está na
conversa pode não estar mais lá no turno seguinte. A compactação aos 400 mil tokens
(`autoCompactWindow`, em `.claude/settings.json`) continua, para o time e como rede para uma tarefa sua
que dure demais; ela só vale para sessão iniciada depois de a configuração existir.

Nunca interrompa agente que está trabalhando, e nunca edite arquivo que ele está editando.
