// Entrada dos hooks de revisão (.claude/settings.json). A lógica e o teste ficam em revisoes.ts.
//   node tools/processo/hook-revisoes.ts registrar   ← SubagentStop
//   node tools/processo/hook-revisoes.ts portao      ← PreToolUse do Bash
import { readFileSync } from 'node:fs'
import { avaliarMutacoes } from './mutacoes.ts'
import { portao, registrar } from './revisoes.ts'

function lerEntrada(): Parameters<typeof registrar>[0] {
  try {
    return JSON.parse(readFileSync(0, 'utf8')) as Parameters<typeof registrar>[0]
  } catch {
    return {}
  }
}

const modo = process.argv[2]
const entrada = lerEntrada()
const raiz = process.env['CLAUDE_PROJECT_DIR'] ?? entrada.cwd ?? process.cwd()

if (modo === 'registrar') {
  // Falha ao registrar nunca derruba o revisor: sem registro, o portão bloqueia o commit.
  try {
    registrar(entrada, raiz)
  } catch (erro) {
    process.stderr.write(`revisoes: não foi possível registrar (${(erro as Error).message})\n`)
  }
} else if (modo === 'portao') {
  let motivo: string | null
  try {
    // Com a conferência das mutações: o commit de tarefa só passa se o último portão conferiu os blocos como estão agora.
    motivo = portao(entrada, raiz, undefined, avaliarMutacoes)
  } catch (erro) {
    motivo = `Commit bloqueado: o portão de revisões falhou (${(erro as Error).message}). Avise o Joaquim.`
  }
  if (motivo) {
    process.stdout.write(
      JSON.stringify({ hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: motivo } }),
    )
  }
}
