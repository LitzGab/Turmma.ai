// Migração do achados-revisoes.md único por pasta para um arquivo por documento, mais o índice.
//
//   node tools/processo/separar-achados.ts [caminho...]   sem caminho, migra todos os que existirem
//
// Fica no repositório porque o formato antigo ainda chega: branch aberta antes da separação traz o
// arquivo único de volta no merge, e aí é só rodar isto de novo. Por isso a migração **acumula**:
// o que já está em `achados/` continua lá, e só entram os blocos que faltam.
//
// Nada é apagado sem conferência de conservação: blocos e linhas de índice no fim têm de ser os que
// já existiam mais os que entraram. Achado de revisão é o que sustenta a auditoria de uma tarefa;
// perder um na migração é pior que não migrar.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { acrescentarAchado, acrescentarNoIndice, caminhoDoAchado, NOME_ACHADOS, NOME_INDICE, PASTA_ACHADOS, resumoDoAchado, type Revisao } from './revisoes.ts'

// O cabeçalho que `acrescentarAchado` escreve. O texto do revisor tem `##` próprios ("## Bloqueantes",
// "## O furo" — 183 deles para 158 rodadas no F1), e é por isso que o reconhecimento exige a linha
// inteira, com revisor, rodada, veredito, fim e documento, não só o `## `.
const CABECALHO_DE_BLOCO = /^## ([a-z-]+) · (\d+)ª rodada · ([A-ZÁÉÍÓÚÇ ]+) · (\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) · `([^`]+)`$/

export interface Bloco {
  revisao: Revisao
  documento: string
  corpo: string
}

/** A identidade de uma rodada, para não duplicar bloco que o destino já tem. */
export function identidade(bloco: Bloco): string {
  return `${bloco.revisao.revisor}|${String(bloco.revisao.rodada)}|${bloco.revisao.fim}`
}

export function separarBlocos(conteudo: string): Bloco[] {
  const linhas = conteudo.split('\n')
  const inicios = linhas.flatMap((linha, indice) => (CABECALHO_DE_BLOCO.test(linha) ? [indice] : []))
  return inicios.map((inicio, ordem) => {
    const achado = CABECALHO_DE_BLOCO.exec(linhas[inicio] ?? '')
    const fim = inicios[ordem + 1] ?? linhas.length
    return {
      revisao: {
        // O arquivo antigo não guarda o início da rodada; só o fim, que é o que o índice mostra.
        inicio: achado?.[4] ?? '',
        fim: achado?.[4] ?? '',
        revisor: achado?.[1] ?? '',
        rodada: Number(achado?.[2] ?? 0),
        veredito: achado?.[3] ?? '',
        agente: '',
      },
      documento: achado?.[5] ?? '',
      corpo: linhas
        .slice(inicio + 1, fim)
        .join('\n')
        .trimEnd(),
    }
  })
}

export interface Plano {
  /** Caminho relativo à raiz → conteúdo final do arquivo. */
  arquivos: Map<string, string>
  indice: string
  jaExistiam: number
  entraram: number
}

/**
 * Monta o resultado da migração sem tocar em disco, a partir do arquivo antigo e do que já está em
 * `achados/`. Bloco que o destino já tem é ignorado, então rodar de novo não duplica nem apaga.
 */
export function planejarMigracao(conteudoAntigo: string, destino: Map<string, string>, indiceAtual: string): Plano {
  const blocos = separarBlocos(conteudoAntigo)
  const duplicados = blocos.map(identidade).filter((chave, ordem, todas) => todas.indexOf(chave) !== ordem)
  if (duplicados.length > 0) {
    throw new Error(`o arquivo antigo tem ${String(duplicados.length)} bloco(s) repetido(s) (${duplicados[0] ?? ''}). Resolva à mão: a migração não escolhe qual descartar.`)
  }

  const arquivos = new Map(destino)
  const jaExistem = new Set([...destino.values()].flatMap((conteudo) => separarBlocos(conteudo).map(identidade)))
  const jaExistiam = jaExistem.size
  let indice = indiceAtual
  let entraram = 0

  for (const bloco of blocos) {
    if (jaExistem.has(identidade(bloco))) continue
    jaExistem.add(identidade(bloco))
    const caminho = caminhoDoAchado(bloco.documento)
    const cabecalho = `## ${bloco.revisao.revisor} · ${String(bloco.revisao.rodada)}ª rodada · ${bloco.revisao.veredito} · ${bloco.revisao.fim}`
    arquivos.set(caminho, acrescentarAchado(arquivos.get(caminho) ?? '', bloco.documento, `${cabecalho}\n${bloco.corpo}\n`))
    indice = acrescentarNoIndice(indice, bloco.revisao, bloco.documento, resumoDoAchado(bloco.corpo))
    entraram++
  }
  return { arquivos, indice, jaExistiam, entraram }
}

const linhasDeIndice = (indice: string) => indice.split('\n').filter((linha) => /^\| \d{4}-/.test(linha)).length

/** Conservação: nada entra sem aparecer nos dois lados, e nada que já estava lá desaparece. */
export function conferirPlano(plano: Plano, indiceAtual: string): void {
  const esperado = plano.jaExistiam + plano.entraram
  const blocos = [...plano.arquivos.values()].reduce((total, conteudo) => total + separarBlocos(conteudo).length, 0)
  const noIndice = linhasDeIndice(plano.indice)
  const esperadoNoIndice = linhasDeIndice(indiceAtual) + plano.entraram
  if (blocos !== esperado || noIndice !== esperadoNoIndice) {
    throw new Error(
      `conservação falhou: ${String(plano.jaExistiam)} blocos já existiam e ${String(plano.entraram)} entraram, ` +
        `mas o resultado tem ${String(blocos)} blocos e ${String(noIndice)} linhas de índice (esperadas ${String(esperadoNoIndice)}).`,
    )
  }
}

function lerDestino(pasta: string, raiz: string): Map<string, string> {
  if (!existsSync(pasta)) return new Map()
  return new Map(
    readdirSync(pasta)
      .filter((arquivo) => arquivo !== NOME_INDICE && arquivo.endsWith('.md'))
      .map((arquivo) => [relative(raiz, join(pasta, arquivo)), readFileSync(join(pasta, arquivo), 'utf8')]),
  )
}

export function migrar(arquivo: string, raiz: string): string {
  const relativoDoArquivo = relative(raiz, arquivo)
  const pasta = join(dirname(arquivo), PASTA_ACHADOS)
  const destinoDoIndice = join(pasta, NOME_INDICE)
  const indiceAtual = existsSync(destinoDoIndice) ? readFileSync(destinoDoIndice, 'utf8') : ''

  const plano = planejarMigracao(readFileSync(arquivo, 'utf8'), lerDestino(pasta, raiz), indiceAtual)
  if (plano.entraram === 0 && plano.jaExistiam === 0) return `· ${relativoDoArquivo}: nenhum bloco reconhecido, nada foi apagado`
  conferirPlano(plano, indiceAtual)

  mkdirSync(pasta, { recursive: true })
  for (const [caminho, conteudo] of plano.arquivos) {
    const destino = join(raiz, caminho)
    mkdirSync(dirname(destino), { recursive: true })
    writeFileSync(destino, conteudo)
  }
  writeFileSync(destinoDoIndice, plano.indice)
  // Só depois de escrito e conferido. A origem estava rastreada no git, então `git show HEAD:<caminho>`
  // ainda a devolve — mas a ordem não depende disso, e não deve: o arquivo pode chegar por um merge
  // que ainda não foi commitado.
  rmSync(arquivo)
  const jaLa = plano.jaExistiam > 0 ? `, ${String(plano.jaExistiam)} já estavam lá` : ''
  return `✓ ${relativoDoArquivo}: ${String(plano.entraram)} blocos em ${String(plano.arquivos.size)} arquivos${jaLa}`
}

function todosOsArquivos(raiz: string): string[] {
  const pastaTasks = join(raiz, 'tasks')
  if (!existsSync(pastaTasks)) return []
  return readdirSync(pastaTasks)
    .map((pasta) => join(pastaTasks, pasta, NOME_ACHADOS))
    .filter((arquivo) => existsSync(arquivo))
}

// Só quando chamado direto: a suíte importa este arquivo para testar a migração sem rodá-la.
if (basename(process.argv[1] ?? '') === basename(fileURLToPath(import.meta.url))) {
  const raiz = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd()
  const alvos = process.argv.slice(2).map((caminho) => (caminho.startsWith('/') ? caminho : join(raiz, caminho)))
  const arquivos = alvos.length > 0 ? alvos : todosOsArquivos(raiz)
  if (arquivos.length === 0) process.stdout.write('Nenhum achados-revisoes.md no formato antigo.\n')
  for (const arquivo of arquivos) process.stdout.write(`${migrar(arquivo, raiz)}\n`)
}
