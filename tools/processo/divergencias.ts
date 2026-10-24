// O aviso do portão para a divergência que ficou só no documento da tarefa (M3 da retro da X7). O `executar-task` manda que
// o que diverge da Tech Spec entre também na `techspec.md` e no `cenarios.md`, antes dos revisores; sem isso o `revisor-geral`
// reprova a rodada. O portão não sabia ler isso: aqui ele passa a saber, e só informa, como o `--faltando`
// (`tools/processo/mutacoes.ts`): quem decide é o revisor. A conferência é por arquivo, e não por conteúdo: qualquer mudança
// na `techspec.md` ou no `cenarios.md` cala o aviso, e o silêncio não prova que a divergência chegou à spec.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, posix } from 'node:path'

const TITULO_DA_SECAO = '## Divergências resolvidas nesta tarefa'

/** Os dois arquivos da spec, na pasta do documento da tarefa, onde a divergência também precisa estar. */
const ARQUIVOS_DA_SPEC = ['techspec.md', 'cenarios.md']

/** Linha da seção que é divergência: não é o cabeçalho da tabela, o separador, o comentário, a linha em branco nem o "nenhuma". */
function ehDivergencia(linha: string): boolean {
  if (linha === '' || linha.startsWith('<!--') || /^[|\s:-]+$/.test(linha)) return false
  const semBarras = linha.replace(/^[|\s*]+/, '')
  if (/^Diverg[êe]ncia\s*\|/.test(semBarras)) return false
  if (/^nenhuma\b/i.test(semBarras)) return false
  return true
}

/** As linhas de divergência da seção, sem o recuo: do título até o próximo `## `. Texto ausente ou sem a seção não tem nenhuma. */
function linhasDaSecao(texto: string | null): string[] {
  if (texto === null) return []
  const linhas = texto.split('\n')
  const inicio = linhas.findIndex((linha) => linha.trim() === TITULO_DA_SECAO)
  if (inicio === -1) return []
  const fim = linhas.findIndex((linha, indice) => indice > inicio && linha.startsWith('## '))
  return linhas
    .slice(inicio + 1, fim === -1 ? undefined : fim)
    .map((linha) => linha.trim())
    .filter(ehDivergencia)
}

/** As linhas da seção que o texto de agora tem e o do HEAD (`null` se o documento é novo) não tinha. */
export function divergenciasNovas(antes: string | null, depois: string): string[] {
  const jaTinha = new Set(linhasDaSecao(antes))
  return linhasDaSecao(depois).filter((linha) => !jaTinha.has(linha))
}

/**
 * O aviso, ou `null`: há linha nova na seção e nem a `techspec.md` nem o `cenarios.md` da pasta do documento está entre os
 * arquivos alterados. `alterados` são caminhos relativos à raiz, como o `arquivosAlterados` os dá.
 */
export function avisoDeDivergencia(novas: readonly string[], documento: string, alterados: readonly string[]): string | null {
  if (novas.length === 0) return null
  const arquivosDaSpec = ARQUIVOS_DA_SPEC.map((nome) => posix.join(posix.dirname(documento), nome))
  if (arquivosDaSpec.some((arquivo) => alterados.includes(arquivo))) return null
  const quantas = `${String(novas.length)} ${novas.length === 1 ? 'linha' : 'linhas'}`
  return (
    `Aviso: a seção "Divergências resolvidas nesta tarefa" de ${documento} ganhou ${quantas} e nem ${arquivosDaSpec.join(' nem ')} mudou.\n` +
    'A divergência que fica só no documento da tarefa o revisor-geral reprova: ela entra também na techspec.md, no cenarios.md e no documento que a seção 11 aponta, antes dos revisores (o portão só informa).\n'
  )
}

/** O aviso para a árvore de agora: lê o documento, o que o HEAD tinha dele e junta com os arquivos alterados. */
export function avisoDaDivergenciaSoNoDocumento(raiz: string, documento: string, alterados: readonly string[]): string | null {
  const depois = readFileSync(join(raiz, documento), 'utf8')
  let antes: string | null
  try {
    antes = execFileSync('git', ['show', `HEAD:${documento}`], { cwd: raiz, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 16 * 1024 * 1024 })
  } catch {
    // Documento novo (ou repositório sem HEAD): não havia seção antes, e toda linha dela é nova.
    antes = null
  }
  return avisoDeDivergencia(divergenciasNovas(antes, depois), documento, alterados)
}
