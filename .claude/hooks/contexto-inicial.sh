#!/usr/bin/env bash
# SessionStart: mostra onde o projeto está, para a sessão não começar às cegas.
# Só lê arquivos. Saída curta: vira contexto do Claude.
#
# A conta é de tools/processo/estado.ts, a mesma do /seguir: uma fonte só para a fase. Quando este hook
# fazia a conta por conta própria, ele anunciava a F2 como próxima com a F3 em quatro tarefas de dezenove.
#
# Depois de uma compactação (`"source":"compact"` na entrada), a sessão continua o mesmo trabalho com um
# resumo no lugar da conversa. Cada papel recebe aqui o que reler antes do próximo passo: o resumo guarda o
# que foi feito, não o texto da tarefa, o da ordem de correção nem o do /seguir (D78, revista em 10/10/2026).

entrada=""
[ -t 0 ] || entrada="$(cat)"

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
[ -f ROADMAP.md ] || exit 0

node tools/processo/estado.ts --resumo 2>/dev/null < /dev/null || echo "Turmma — o estado não pôde ser lido; rode: node tools/processo/estado.ts"

# O git hook nativo (RF14) só vale onde o `core.hooksPath` aponta a pasta dele: o `npm ci` o grava pelo `prepare`, e andar ou
# linha aberto antes da X7 não o tem até a `develop` chegar nele. Sem isto, o commit de papel por `/usr/bin/git`, `env` ou
# script só tem a terceira camada, a esteira.
hooks="$(git config --get core.hooksPath 2>/dev/null || true)"
if [ "$hooks" != "tools/processo/git-hooks" ]; then
  echo
  if [ -z "$hooks" ]; then atual="não está definido"; else atual="é \"$hooks\""; fi
  echo "Aviso: o git hook nativo não está ligado neste checkout (core.hooksPath $atual). Rode: git config core.hooksPath tools/processo/git-hooks (é o que o \`npm ci\` faz pelo \`prepare\`). Checkout anterior à X7: traga a develop antes. Sem o hook, o commit e o push de papel por caminho absoluto, \`env\` ou script só são conferidos pela esteira."
fi

origem=inicio
case "$entrada" in
  *'"source":"compact"'*|*'"source": "compact"'*) origem=compactado ;;
  *'"source":"clear"'*|*'"source": "clear"'*) origem=limpo ;;
esac
[ "$origem" = inicio ] && exit 0

# A limpeza do Orquestrador aconteceu (RF27): `clear`, sem papel, no térreo (o checkout principal, e não um andar ou uma
# linha). O comando que a pede grava `pedida` em .processo/limpeza.json; aqui entra `feita`, e a vigia acusa a `pedida` sem `feita`.
# A dupla de `git rev-parse` só é igual no checkout principal, e vazia fora de um repositório: o `-n` não deixa gravar ali.
pasta_git="$(git rev-parse --git-dir 2>/dev/null)"
if [ "$origem" = limpo ] && [ -z "${CLAUDE_CODE_AGENT:-}" ] && [ -n "$pasta_git" ] && [ "$pasta_git" = "$(git rev-parse --git-common-dir 2>/dev/null)" ]; then
  mkdir -p .processo && node -e '
const fs = require("fs")
const arquivo = ".processo/limpeza.json"
let limpeza = {}
try { limpeza = JSON.parse(fs.readFileSync(arquivo, "utf8")) } catch {}
if (typeof limpeza !== "object" || limpeza === null || Array.isArray(limpeza)) limpeza = {}
limpeza.feita = new Date().toISOString()
fs.writeFileSync(arquivo, JSON.stringify(limpeza, null, 2) + "\n")
' 2>/dev/null
fi

# Sessão sem papel é a do Orquestrador (ou uma do Joaquim, que ignora o aviso). As mensagens do time chegam a
# ele coladas, e texto colado não executa o /seguir: sem este aviso, a sessão limpa ou compactada seguiria de memória.
if [ -z "${CLAUDE_CODE_AGENT:-}" ]; then
  echo
  echo "O contexto desta sessão foi $origem. Se você é o Orquestrador: antes de agir sobre qualquer mensagem do time, leia inteiros .claude/skills/seguir/SKILL.md e .claude/skills/seguir/protocolo.md, e depois as seções \"Agora\" e \"Esperando o Joaquim\" do estado.md do andar ativo (maestri floor list dá o caminho; o comando está no passo 2 do /seguir): é o seu diário, e é tudo o que você sabe da funcionalidade. Para a vigia, com alguém trabalhando, a skill dela e o \"Agora\" bastam. Não aja de memória."
  exit 0
fi
[ "$origem" = compactado ] || exit 0

echo
echo "O contexto desta sessão acabou de ser compactado. O trabalho é o mesmo: não recomece e não refaça o que já está na árvore."
case "$CLAUDE_CODE_AGENT" in
  implementador)
    echo "Antes do próximo passo, releia o documento da tarefa ou da correção em curso, a ordem de correção mais recente em .processo/ordens/ (se a Mesa já mandou alguma) e a saída de git status --short. Se o pedido ou a ordem ainda tem item sem fazer, é dele que você continua."
    ;;
  mesa-de-revisao)
    echo "Antes do próximo passo, releia .claude/skills/revisar-tarefa/SKILL.md, a seção \"Revisões\" do documento em revisão e .processo/ordens/rodadas.md. Revisor que já deu veredito nesta rodada não é chamado de novo."
    ;;
  *)
    echo "Antes do próximo passo, releia o pedido que você recebeu e o documento que está escrevendo, do jeito que ele está no disco."
    ;;
esac
exit 0
