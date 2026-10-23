// Registro e portão das revisões, chamados pelos hooks do Claude Code (.claude/settings.json).
//
// O código mora em quatro módulos, um por responsabilidade (X7, RF13), e este arquivo só os reexporta:
//   documento-de-revisao.ts  veredito, rodada, seção Revisões, achados e índice; `registrar` (SubagentStop)
//   caducidade.ts            o que conta como alteração depois do portão e da rodada
//   comando-git.ts           ler do comando o commit, os arquivos, a árvore e o push do time
//   portao.ts                o carimbo, `avaliarPortao` e `portao` (PreToolUse do Bash)
// `estado.ts` e `esteira.ts` importam direto do módulo de cada coisa, e não daqui (`harness/particao.test.ts`).
export * from './caducidade.ts'
export * from './comando-git.ts'
export * from './documento-de-revisao.ts'
export * from './portao.ts'
