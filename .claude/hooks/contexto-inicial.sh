#!/usr/bin/env bash
# SessionStart: mostra onde o projeto está, para a sessão não começar às cegas.
# Só lê arquivos. Saída curta: vira contexto do Claude.
#
# A conta é de tools/processo/estado.ts, a mesma do /seguir: uma fonte só para a fase. Quando este hook
# fazia a conta por conta própria, ele anunciava a F2 como próxima com a F3 em quatro tarefas de dezenove.

cd "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}" || exit 0
[ -f ROADMAP.md ] || exit 0

node tools/processo/estado.ts --resumo 2>/dev/null || echo "Turmma — o estado não pôde ser lido; rode: node tools/processo/estado.ts"
exit 0
