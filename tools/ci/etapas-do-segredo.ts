import { execFileSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { argumentosGitleaks, type ArvoreDeTrabalho } from './etapas-de-guarda.ts'
import type { Etapa } from './executar.ts'
import { pastaComoRepositorio } from './pasta-como-repositorio.ts'

// As etapas do `npm run guarda:segredo` (`tools/ci/segredo.ts`): o gitleaks da esteira (`ci:verificar`), para o portão local. Duas
// diferenças para a esteira. Onde roda: num andar do Maestri a pasta é uma árvore de trabalho do git, e o gitdir dela precisa ser
// indicado. E o que olha: além do histórico, os arquivos alterados que ainda não têm commit, que é onde o segredo novo está.
// Moram aqui, e não no script, porque o script roda ao ser importado e o teste precisa chamá-las.

function pastaDoGit(raiz: string, argumento: string): string {
  return execFileSync('git', ['rev-parse', '--path-format=absolute', argumento], { cwd: raiz, encoding: 'utf8' }).trim()
}

/** `undefined` no clone comum, em que o `.git` é a própria pasta do repositório. */
function arvoreDeTrabalho(raiz: string): ArvoreDeTrabalho | undefined {
  const gitComum = pastaDoGit(raiz, '--git-common-dir')
  const proprio = pastaDoGit(raiz, '--git-dir')
  return proprio === gitComum ? undefined : { gitComum, gitDirRelativo: proprio.slice(gitComum.length + 1) }
}

/**
 * Uma cópia só dos arquivos alterados, com o mesmo caminho relativo, já como repositório (`pastaComoRepositorio`), ou `null` com a
 * árvore limpa. A cópia leva o conteúdo inteiro dos arquivos: se montá-la falhar, ela é apagada antes de a exceção subir.
 */
function copiaDosAlterados(raiz: string, alterados: readonly string[]): string | null {
  const existentes = alterados.filter((arquivo) => existsSync(join(raiz, arquivo)) && statSync(join(raiz, arquivo)).isFile())
  if (existentes.length === 0) return null
  const pasta = mkdtempSync(join(tmpdir(), 'educa-segredo-'))
  try {
    for (const arquivo of existentes) {
      mkdirSync(dirname(join(pasta, arquivo)), { recursive: true })
      cpSync(join(raiz, arquivo), join(pasta, arquivo))
    }
    pastaComoRepositorio(pasta, join(raiz, '.gitleaks.toml'))
  } catch (erro) {
    rmSync(pasta, { recursive: true, force: true })
    throw erro
  }
  return pasta
}

export interface EtapasDoSegredo {
  etapas: Etapa[]
  /** A cópia dos arquivos alterados, que quem executa as etapas apaga ao fim; `null` com a árvore limpa. */
  pastaTemporaria: string | null
}

export function etapasDoSegredo(raizDoRepositorio: string, alterados: readonly string[]): EtapasDoSegredo {
  const raiz = raizDoRepositorio.replace(/\/+$/, '')
  // Antes da cópia: se o `git rev-parse` falhar, ainda não há pasta temporária com o conteúdo dos arquivos para ficar no disco.
  const historico = argumentosGitleaks(raiz, arvoreDeTrabalho(raiz))
  const pastaTemporaria = copiaDosAlterados(raiz, alterados)
  return {
    pastaTemporaria,
    etapas: [
      { nome: 'segredo commitado (gitleaks, no histórico)', comando: 'docker', argumentos: historico },
      ...(pastaTemporaria === null
        ? []
        : [{ nome: 'segredo nos arquivos alterados, ainda sem commit (gitleaks)', comando: 'docker', argumentos: argumentosGitleaks(pastaTemporaria) }]),
    ],
  }
}
