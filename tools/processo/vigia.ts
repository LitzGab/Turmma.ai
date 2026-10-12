// O que a rotina `Vigia do processo` roda antes de acordar o Orquestrador (D79, revista em 11/10/2026).
//
//   node tools/processo/vigia.ts        imprime `/vigia` quando há o que olhar, e nada quando não há
//
// É o `--pre-run` da rotina, cujo comando é `{{output}}`: com o time trabalhando, a saída é vazia e o modelo não
// acorda. No F3, 96 de 100 vigias acordaram o Orquestrador para responder "nada a fazer", cada uma relendo o contexto
// dele. Na dúvida, acorda: erro ao falar com o Maestri, terminal que não se reconhece ou tela que não se lê imprimem
// `/vigia`, que é o que a rotina fazia antes de este arquivo existir.
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** Os terminais do time, com o número da linha quando há mais de uma. Outro terminal ligado ao Orquestrador não conta. */
const TERMINAL_DO_TIME = /^(Arquiteto|Implementador|Mesa|Validador)( \d+)?$/

/** Os terminais do time entre os agentes ligados, como o `maestri list` os imprime. */
export function nomesDoTime(saidaDoList: string): string[] {
  const ligados = saidaDoList.slice(saidaDoList.indexOf('Connected agents:'))
  return [...ligados.matchAll(/^\s*- name: "([^"]+)"/gm)].map((achado) => achado[1] ?? '').filter((nome) => TERMINAL_DO_TIME.test(nome))
}

/** O Claude Code mostra "esc to interrupt" enquanto o turno corre, e só então. */
export function estaTrabalhando(tela: string): boolean {
  return tela.split('\n').slice(-25).some((linha) => linha.includes('esc to interrupt'))
}

/** Quanto um terminal trabalha sem a vigia olhar: o prazo da tarefa pequena (`.claude/skills/vigia/SKILL.md`). */
export const SEM_OLHAR_MS = 2 * 60 * 60 * 1000

export interface Decisao {
  acordar: boolean
  motivo: string
  /** Desde quando cada terminal é visto trabalhando sem parar, em ISO: o que se grava para a próxima vez. */
  visto: Record<string, string>
}

export function decidir(telas: Readonly<Record<string, string>>, visto: Readonly<Record<string, string>>, agora: Date): Decisao {
  const trabalhando = Object.keys(telas).filter((nome) => estaTrabalhando(telas[nome] ?? ''))
  if (trabalhando.length === 0) return { acordar: true, motivo: Object.keys(telas).length === 0 ? 'nenhum terminal do time ligado' : 'ninguém trabalhando', visto: {} }
  const agoraVisto: Record<string, string> = {}
  const demorados: string[] = []
  for (const nome of trabalhando) {
    const desde = visto[nome] ?? agora.toISOString()
    const demorou = agora.getTime() - new Date(desde).getTime() >= SEM_OLHAR_MS
    if (demorou) demorados.push(nome)
    // Acordado por demora, o relógio recomeça: a vigia volta a olhar em duas horas, e não a cada meia hora.
    agoraVisto[nome] = demorou ? agora.toISOString() : desde
  }
  return demorados.length > 0
    ? { acordar: true, motivo: `${demorados.join(', ')} trabalha há duas horas sem a vigia olhar`, visto: agoraVisto }
    : { acordar: false, motivo: `${trabalhando.join(', ')} trabalhando`, visto: agoraVisto }
}

if (import.meta.filename === process.argv[1]) {
  const registro = join(import.meta.dirname, '..', '..', '.processo', 'vigia.json')
  const maestri = (...argumentos: string[]) => execFileSync('maestri', argumentos, { encoding: 'utf8', timeout: 15_000, stdio: ['ignore', 'pipe', 'ignore'] })
  let decisao: Decisao
  try {
    const telas = Object.fromEntries(nomesDoTime(maestri('list')).map((nome) => [nome, maestri('check', nome)]))
    const visto = existsSync(registro) ? (JSON.parse(readFileSync(registro, 'utf8')) as Record<string, string>) : {}
    decisao = decidir(telas, visto, new Date())
    mkdirSync(dirname(registro), { recursive: true })
    writeFileSync(registro, `${JSON.stringify(decisao.visto, null, 2)}\n`)
  } catch {
    decisao = { acordar: true, motivo: 'não consegui ler o time', visto: {} }
  }
  process.stdout.write(decisao.acordar ? '/vigia\n' : '')
}
