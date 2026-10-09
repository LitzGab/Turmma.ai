// A trava do commit e do push, para o opencode (D78, revista em 09/10/2026).
//
// No Claude Code, quem roda `tools/processo/hook-revisoes.ts portao` antes de todo Bash é o hook PreToolUse de
// `.claude/settings.json`. O opencode não lê aquele arquivo: sem este plugin, o Implementador em opencode faria o
// commit sem revisão, sem carimbo e sem marca, e empurraria a `develop`.
//
// O plugin não decide nada. Ele entrega o comando ao MESMO script, num processo do node, com a mesma entrada que o
// Claude Code entrega, e veta a ferramenta com o motivo que o script devolver. Um processo por comando, e não um
// `import`, porque o servidor do opencode vive mais que uma tarefa: importado, o portão ficaria na versão de quando o
// servidor subiu.
//
// Sem dependência: o opencode lê o `id` e o `setup` da exportação padrão, e as outras exportações servem ao teste
// (`tools/processo/opencode.test.ts`).
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** O que o opencode entrega ao gancho `execute.before` (v2.0.26, conferido em 09/10/2026). */
export interface ChamadaDeFerramenta {
  tool: string
  /** O agente da sessão. É o papel do time quando a sessão é a do `implementador`. */
  agent?: string
  input?: unknown
}

export interface PedidoAoPortao {
  /** A raiz do checkout da sessão: o que o Claude Code entrega em `CLAUDE_PROJECT_DIR`. */
  raiz: string
  /** A pasta em que o comando roda: a da sessão, ou o `workdir` da chamada. */
  cwd: string
  comando: string
  papel: string | undefined
}

export type RespostaDoPortao = { saida: string } | { falha: string }
export type Executar = (pedido: PedidoAoPortao) => RespostaDoPortao

/** Só `git … commit` e `git … push` interessam ao portão: o resto do shell não paga um processo do node. */
const PODE_SER_COMMIT_OU_PUSH = /\bgit\b[\s\S]*\b(?:commit|push)\b/
/** O nome da ferramenta de shell: `shell` no opencode 2, `bash` no 1. */
const FERRAMENTAS_DE_SHELL = ['shell', 'bash']
const LIMITE_DO_PORTAO_MS = 60_000

function raizDoCheckout(pasta: string): string {
  const git = spawnSync('git', ['rev-parse', '--show-toplevel'], { cwd: pasta, encoding: 'utf8' })
  const raiz = git.status === 0 ? git.stdout.trim() : ''
  return raiz || pasta
}

/** Roda o portão num processo do node. `script` só muda no teste, que avalia um repositório temporário com o portão deste. */
export function executarComNode(script?: string): Executar {
  return ({ raiz, cwd, comando, papel }) => {
    const caminho = script ?? join(raiz, 'tools', 'processo', 'hook-revisoes.ts')
    if (!existsSync(caminho)) return { falha: `${caminho} não existe` }
    const processo = spawnSync('node', [caminho, 'portao'], {
      cwd: raiz,
      input: JSON.stringify({ cwd, tool_input: { command: comando } }),
      encoding: 'utf8',
      timeout: LIMITE_DO_PORTAO_MS,
      // O portão lê o papel em `CLAUDE_CODE_AGENT` e a raiz da sessão em `CLAUDE_PROJECT_DIR`, que é o contrato do hook
      // do Claude Code. O papel vai sempre, mesmo vazio: o opencode aberto de dentro de um terminal do Claude herdaria o dele.
      env: { ...process.env, CLAUDE_PROJECT_DIR: raiz, CLAUDE_CODE_AGENT: papel ?? '' },
    })
    if (processo.error) return { falha: processo.error.message }
    if (processo.status !== 0) return { falha: `o node saiu com ${processo.status ?? processo.signal}: ${processo.stderr.trim().slice(0, 300)}` }
    return { saida: processo.stdout }
  }
}

function motivoDaSaida(saida: string): string | null | undefined {
  if (saida.trim() === '') return null
  try {
    const resposta = JSON.parse(saida) as { hookSpecificOutput?: { permissionDecision?: string; permissionDecisionReason?: string } }
    const decisao = resposta.hookSpecificOutput
    if (decisao?.permissionDecision === 'deny' && decisao.permissionDecisionReason) return decisao.permissionDecisionReason
  } catch {
    // Saída que não é a do portão: quem chama trata como falha.
  }
  return undefined
}

/**
 * O motivo do veto, ou `null` quando a ferramenta pode rodar.
 *
 * Falha do próprio portão (o node fora do PATH, o script que não existe, uma saída que não se lê) também veta: o
 * comando é um commit ou um push, e deixá-lo passar sem conferência é o furo que a trava fecha.
 */
export function vetoDoPortao(chamada: ChamadaDeFerramenta, pastaDaSessao: string, executar: Executar = executarComNode()): string | null {
  if (!FERRAMENTAS_DE_SHELL.includes(chamada.tool)) return null
  const entrada = (chamada.input ?? {}) as { command?: unknown; workdir?: unknown }
  const comando = typeof entrada.command === 'string' ? entrada.command : ''
  if (!PODE_SER_COMMIT_OU_PUSH.test(comando)) return null
  const raiz = raizDoCheckout(pastaDaSessao)
  const cwd = typeof entrada.workdir === 'string' && entrada.workdir !== '' ? resolve(pastaDaSessao, entrada.workdir) : pastaDaSessao
  const resposta = executar({ raiz, cwd, comando, papel: chamada.agent })
  const motivo = 'saida' in resposta ? motivoDaSaida(resposta.saida) : undefined
  if (motivo !== undefined) return motivo
  const detalhe = 'falha' in resposta ? resposta.falha : 'a resposta dele não pôde ser lida'
  return (
    `Commit ou push bloqueado: o portão de revisões não pôde ser consultado (${detalhe}). Não contorne: envie ao Orquestrador ` +
    '`/seguir DIVERGÊNCIA de Implementador`, com `Motivo: portão`.'
  )
}

interface Contexto {
  location: { directory: string }
  tool: { hook(nome: 'execute.before', gancho: (chamada: ChamadaDeFerramenta) => void): Promise<unknown> }
}

export default {
  id: 'educa.portao-de-revisoes',
  async setup(contexto: Contexto) {
    await contexto.tool.hook('execute.before', (chamada) => {
      const motivo = vetoDoPortao(chamada, contexto.location.directory)
      // O erro lançado aqui cancela a ferramenta, e o texto dele é o que o agente lê (provado em 09/10/2026).
      if (motivo !== null) throw new Error(motivo)
    })
  },
}
