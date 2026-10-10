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

origem=inicio
case "$entrada" in
  *'"source":"compact"'*|*'"source": "compact"'*) origem=compactado ;;
  *'"source":"clear"'*|*'"source": "clear"'*) origem=limpo ;;
esac
[ "$origem" = inicio ] && exit 0

# Sessão sem papel é a do Orquestrador (ou uma do Joaquim, que ignora o aviso). As mensagens do time chegam a
# ele coladas, e texto colado não executa o /seguir: sem este aviso, a sessão limpa ou compactada seguiria de memória.
if [ -z "${CLAUDE_CODE_AGENT:-}" ]; then
  echo
  echo "O contexto desta sessão foi $origem. Se você é o Orquestrador: antes de agir sobre qualquer mensagem do time ou da vigia, leia inteiros .claude/skills/seguir/SKILL.md e .claude/skills/seguir/protocolo.md, e depois o estado.md do andar ativo (maestri floor list dá o caminho), que é o seu diário. Não aja de memória."
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
