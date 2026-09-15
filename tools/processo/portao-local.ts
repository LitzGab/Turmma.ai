// Portão local da tarefa, com carimbo. Roda typecheck, lint e testes e, se tudo passar, grava em
// .processo/portao.json quando começou e o que rodou. O portão do commit (revisoes.ts) exige o
// carimbo mais novo que a última alteração, e o revisor-geral confere o carimbo em vez de rodar tudo
// de novo sobre a mesma árvore.
//
//   node tools/processo/portao-local.ts [--e2e] [--infra]      roda e carimba
//   node tools/processo/portao-local.ts conferir <documento>     diz se o carimbo vale para o código atual
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  alteracoesDeCodigo,
  arquivosAlterados,
  avaliarCarimbo,
  gravarCarimbo,
  lerCarimbo,
  revisoresObrigatorios,
  suitesExigidas,
  tipoDoDocumento,
} from './revisoes.ts'

const raiz = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd()
const argumentos = process.argv.slice(2)

function rodar(comando: string): boolean {
  process.stdout.write(`\n▶ ${comando}\n`)
  return spawnSync(comando, { cwd: raiz, shell: '/bin/sh', stdio: 'inherit' }).status === 0
}

if (argumentos[0] === 'conferir') {
  const documento = argumentos[1]
  if (!documento) {
    process.stderr.write('uso: node tools/processo/portao-local.ts conferir <tasks/.../documento.md>\n')
    process.exit(2)
  }
  const obrigatorios = revisoresObrigatorios(readFileSync(join(raiz, documento), 'utf8'), tipoDoDocumento(documento))
  const motivo = avaliarCarimbo(lerCarimbo(raiz), suitesExigidas(obrigatorios), alteracoesDeCodigo(raiz, arquivosAlterados(raiz)))
  process.stdout.write(motivo ? `${motivo}\n` : `portão local válido para o código atual (${lerCarimbo(raiz)?.suites.join(', ')})\n`)
  process.exit(motivo ? 1 : 0)
}

const inicio = new Date().toISOString()
const suites = ['typecheck', 'lint', 'test', ...(argumentos.includes('--e2e') ? ['e2e'] : []), ...(argumentos.includes('--infra') ? ['infra'] : [])]

// Com node_modules anterior ao lock (um pull que trouxe dependência nova), o typecheck falha com TS2307
// sem dizer que falta instalar.
const dependencias = rodar('[ -f node_modules/.package-lock.json ] && [ ! package-lock.json -nt node_modules/.package-lock.json ] || npm ci')
const falhou = !dependencias ? 'dependências' : suites.find((suite) => !rodar(`npm run ${suite === 'e2e' ? 'test:e2e' : suite === 'infra' ? 'test:infra' : suite}`))

if (falhou) {
  process.stdout.write(`\n✗ portão local vermelho em ${falhou}. Nenhum carimbo gravado.\n`)
  process.exit(1)
}
gravarCarimbo(raiz, { inicio, suites })
process.stdout.write(`\n✓ portão local verde (${suites.join(', ')}). Carimbo em .processo/portao.json, início ${inicio}.\n`)
