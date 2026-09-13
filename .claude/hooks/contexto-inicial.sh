#!/usr/bin/env bash
# SessionStart: mostra onde o projeto está, para a sessão não começar às cegas.
# Só lê arquivos. Saída curta: vira contexto do Claude.

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
[ -f ROADMAP.md ] || exit 0

linha_func() { grep -E '^## F[0-9]+ — `[a-z0-9-]+` \[' ROADMAP.md; }
id_de()      { sed -E 's/^## (F[0-9]+) .*/\1/'; }
nome_de()    { sed -E 's/^## F[0-9]+ — `([a-z0-9-]+)`.*/\1/'; }

andamento=$(linha_func | grep -F '[~]' | head -1)
concluidas=$(linha_func | grep -F '[x]' | id_de | paste -sd ' ' -)

echo "Educa.ia — contexto da sessão"
echo "Concluídas: ${concluidas:-nenhuma}"

if [ -n "$andamento" ]; then
  alvo="$andamento"
  echo "Em andamento: $(echo "$alvo" | id_de) $(echo "$alvo" | nome_de)"
else
  alvo=$(linha_func | grep -F '[ ]' | head -1)
  [ -n "$alvo" ] && echo "Nada em andamento. Próxima do roadmap: $(echo "$alvo" | id_de) $(echo "$alvo" | nome_de) (confira as dependências)"
fi

if [ -n "$alvo" ]; then
  func=$(echo "$alvo" | nome_de)
  dir="tasks/prd-$func"
  if [ ! -f "$dir/prd.md" ]; then
    echo "Artefatos: nenhum. Próximo passo: /criar-prd $func"
  elif [ ! -f "$dir/techspec.md" ]; then
    echo "Artefatos: PRD. Próximo passo: revisar o PRD ou /criar-techspec $func"
  elif [ ! -f "$dir/tasks.md" ]; then
    echo "Artefatos: PRD, Tech Spec. Próximo passo: /criar-tasks $func"
  else
    total=$(grep -cE '^- \[[ x]\] \*\*[0-9]+\.0' "$dir/tasks.md")
    feitas=$(grep -cE '^- \[x\] \*\*[0-9]+\.0' "$dir/tasks.md")
    proxima=$(grep -E '^- \[ \] \*\*[0-9]+\.0' "$dir/tasks.md" | head -1 | sed -E 's/^- \[ \] //; s/\*\*//g')
    echo "Tarefas: $feitas de $total concluídas."
    [ -n "$proxima" ] && echo "Próxima tarefa: $proxima → /executar-tasks $func"
  fi
fi

abertas=$(awk '/^## Decisões em aberto/{f=1;next} /^## /{f=0} f && /^- /' CLAUDE.md 2>/dev/null | wc -l | tr -d ' ')
[ "$abertas" != "0" ] && echo "Decisões em aberto no CLAUDE.md: $abertas (use /descobrir <tema> para fechar uma)"

echo "Visão completa: /status"
exit 0
