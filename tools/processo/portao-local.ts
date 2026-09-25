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
  CHAVE_DO_PORTAO,
  carimbarSeNadaMudou,
  lerCarimbo,
  lerInstantaneos,
  revisoresObrigatorios,
  suitesExigidas,
  tipoDoDocumento,
} from './revisoes.ts'

const raiz = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd()
const argumentos = process.argv.slice(2)

function rodar(comando: string, ambiente: NodeJS.ProcessEnv = process.env): boolean {
  process.stdout.write(`\n▶ ${comando}\n`)
  return spawnSync(comando, { cwd: raiz, shell: '/bin/sh', stdio: 'inherit', env: ambiente }).status === 0
}

/**
 * Só o `test`, a primeira suíte que sobe o compose de teste, começa do banco limpo, como a esteira
 * (`comandosDaSubidaDeTeste`, em `tools/ci/compose.ts`). O e2e e o infra vêm depois e reusam o que ela subiu: com a
 * variável neles, o `globalSetup` do infra derrubaria o ambiente que o `test:e2e --manter-ambiente` deixou de pé. Por
 * isso ela sai também do ambiente herdado, e não só deixa de ser posta.
 */
function ambienteDaSuite(suite: string): NodeJS.ProcessEnv {
  return { ...process.env, EDUCA_BANCO_NOVO: suite === 'test' ? '1' : undefined }
}

if (argumentos[0] === 'conferir') {
  const documento = argumentos[1]
  if (!documento) {
    process.stderr.write('uso: node tools/processo/portao-local.ts conferir <tasks/.../documento.md>\n')
    process.exit(2)
  }
  const obrigatorios = revisoresObrigatorios(readFileSync(join(raiz, documento), 'utf8'), tipoDoDocumento(documento))
  const motivo = avaliarCarimbo(lerCarimbo(raiz), suitesExigidas(obrigatorios), alteracoesDeCodigo(raiz, arquivosAlterados(raiz)), lerInstantaneos(raiz)[CHAVE_DO_PORTAO])
  process.stdout.write(motivo ? `${motivo}\n` : `portão local válido para o código atual (${lerCarimbo(raiz)?.suites.join(', ')})\n`)
  process.exit(motivo ? 1 : 0)
}

const inicio = new Date().toISOString()
// O conteúdo de agora é o que as suítes vão rodar, e é ele que vai para o instantâneo. Ler no fim faria arquivo
// editado no meio da corrida entrar como se tivesse sido testado, e o commit passaria por código que nenhuma suíte
// viu (correção `2026-09-22-hook-do-commit-ignora-o-instantaneo-de-conteudo`).
const noInicio = alteracoesDeCodigo(raiz, arquivosAlterados(raiz))
const suites = ['typecheck', 'lint', 'test', ...(argumentos.includes('--e2e') ? ['e2e'] : []), ...(argumentos.includes('--infra') ? ['infra'] : [])]

// Com node_modules anterior ao lock (um pull que trouxe dependência nova), o typecheck falha com TS2307
// sem dizer que falta instalar.
const dependencias = rodar('[ -f node_modules/.package-lock.json ] && [ ! package-lock.json -nt node_modules/.package-lock.json ] || npm ci')
const falhou = !dependencias ? 'dependências' : suites.find((suite) => !rodar(`npm run ${suite === 'e2e' ? 'test:e2e' : suite === 'infra' ? 'test:infra' : suite}`, ambienteDaSuite(suite)))

if (falhou) {
  process.stdout.write(`\n✗ portão local vermelho em ${falhou}. Nenhum carimbo gravado.\n`)
  process.exit(1)
}
// Carimba o conteúdo do início, que é o que as suítes provaram, ou recusa se alguém editou no meio da corrida.
const recusa = carimbarSeNadaMudou(raiz, { inicio, suites }, noInicio)
if (recusa) {
  // O comando sai daqui, e não da função: quem sabe as flags é o script. Quem lê esta linha acabou de perder os
  // ~20 min das suítes, e precisa saber que é só rodar de novo.
  process.stdout.write(`\n✗ ${recusa} Rode \`node ${['tools/processo/portao-local.ts', ...argumentos].join(' ')}\` de novo.\n`)
  process.exit(1)
}
process.stdout.write(`\n✓ portão local verde (${suites.join(', ')}). Carimbo em .processo/portao.json, início ${inicio}.\n`)
