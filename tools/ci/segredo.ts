import { execFileSync } from 'node:child_process'
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { arquivosAlterados } from '../processo/revisoes.ts'
import { encerrarCom, executarEtapas, raizRepositorio, type Etapa } from './executar.ts'
import { argumentosGitleaks, argumentosGitleaksDaPasta, type ArvoreDeTrabalho } from './etapas-de-guarda.ts'

// `npm run guarda:segredo`: o gitleaks da esteira (`ci:verificar`), para o portão local. Duas diferenças para a esteira.
// Onde roda: num andar do Maestri a pasta é uma árvore de trabalho do git, e o gitdir dela precisa ser indicado. E o que
// olha: além do histórico, os arquivos alterados que ainda não têm commit, que é onde o segredo novo está.

function pastaDoGit(argumento: string): string {
  return execFileSync('git', ['rev-parse', '--path-format=absolute', argumento], { cwd: raizRepositorio, encoding: 'utf8' }).trim()
}

/** `undefined` no clone comum, em que o `.git` é a própria pasta do repositório. */
function arvoreDeTrabalho(): ArvoreDeTrabalho | undefined {
  const gitComum = pastaDoGit('--git-common-dir')
  const proprio = pastaDoGit('--git-dir')
  return proprio === gitComum ? undefined : { gitComum, gitDirRelativo: proprio.slice(gitComum.length + 1) }
}

/** Uma cópia só dos arquivos alterados, com o mesmo caminho relativo, ou `null` com a árvore limpa. */
function copiaDosAlterados(): string | null {
  const alterados = arquivosAlterados(raizRepositorio).filter((arquivo) => existsSync(join(raizRepositorio, arquivo)) && statSync(join(raizRepositorio, arquivo)).isFile())
  if (alterados.length === 0) return null
  const pasta = mkdtempSync(join(tmpdir(), 'educa-segredo-'))
  for (const arquivo of alterados) {
    mkdirSync(dirname(join(pasta, arquivo)), { recursive: true })
    cpSync(join(raizRepositorio, arquivo), join(pasta, arquivo))
  }
  // O usuário do contêiner não é o dono da pasta temporária.
  execFileSync('chmod', ['-R', 'a+rX', pasta])
  chmodSync(pasta, 0o755)
  return pasta
}

const raiz = raizRepositorio.replace(/\/+$/, '')
const alterados = copiaDosAlterados()
const etapas: Etapa[] = [
  { nome: 'segredo commitado (gitleaks, no histórico)', comando: 'docker', argumentos: argumentosGitleaks(raiz, arvoreDeTrabalho()) },
  ...(alterados === null
    ? []
    : [{ nome: 'segredo nos arquivos alterados, ainda sem commit (gitleaks)', comando: 'docker', argumentos: argumentosGitleaksDaPasta(alterados, join(raiz, '.gitleaks.toml')) }]),
]
await encerrarCom(
  executarEtapas(etapas, () => {
    if (alterados !== null) rmSync(alterados, { recursive: true, force: true })
    return []
  }),
)
