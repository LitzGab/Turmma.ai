#!/usr/bin/env bash
# UserPromptSubmit: a mensagem do time que chega colada ao Orquestrador (RF29).
#
# Texto colado no terminal não executa o /seguir: só a mensagem curta chega como comando. Quando a entrada começa com
# `/seguir `, este hook devolve o contexto que manda ler a skill e seguir com a entrada. Só vale em sessão sem papel
# (`CLAUDE_CODE_AGENT` vazio): a do Orquestrador. Não grava nada e nunca bloqueia o prompt: qualquer falha sai 0, calada.
# Lê toda entrada de sessão sem papel, inclusive as do próprio Joaquim: registrar o que chega (num arquivo, num log) seria
# log de conteúdo de prompt, proibido pela regra 20, item 9. Quem estender este hook não grava a entrada.
#
# A entrada é o JSON do Claude Code, com o texto digitado em `prompt`.

[ -z "${CLAUDE_CODE_AGENT:-}" ] || exit 0

entrada="$(cat)"

# `prompt` ausente ou de outro tipo lança no `startsWith`, e o `catch` sai 1: a entrada que não se lê não ganha aviso.
printf '%s' "$entrada" | node -e '
let texto = ""
process.stdin.on("data", (pedaco) => { texto += pedaco })
process.stdin.on("end", () => {
  try {
    const { prompt } = JSON.parse(texto)
    process.exit(prompt.startsWith("/seguir ") ? 0 : 1)
  } catch {
    process.exit(1)
  }
})
' 2>/dev/null || exit 0

echo "Esta entrada começa com /seguir e chegou como texto colado, que não executa a skill. Leia .claude/skills/seguir/SKILL.md (e o protocolo.md, se ainda não leu) e siga com esta entrada. Se a skill já está carregada nesta sessão, siga direto."
exit 0
