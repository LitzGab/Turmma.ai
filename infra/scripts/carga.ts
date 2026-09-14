import { spawn } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseEnv } from 'node:util'
import pg from 'pg'
import { raizRepositorio } from '../../tools/ci/executar.ts'
import { aguardarInterativosIniciados, conferirJobRegistro, descreverConferencia, urlDoBancoDoAmbiente, type ConferenciaDaCarga } from './conferir-carga.ts'

/**
 * Cenário de carga "justiça entre escolas" (Tech Spec, seção 7c; PRD, RF18), local e manual:
 *
 *   npm run carga                    sobe o compose de carga, roda o cenário e reprova se um critério falhar
 *   npm run carga:controle-negativo  o mesmo, com VAGAS_POR_ESCOLA_DESLIGADAS=true, e reprova se o cenário passar
 *
 * 1. sobe o projeto `educa-carga` (infra/compose.yml com infra/compose.carga.yml, CPU fixa por serviço);
 * 2. gera os tokens das escolas sintéticas A, B e C com `ops:token-sintetico`;
 * 3. roda o k6 na fase `base` (só a escola B) e lê o p95 da espera dela;
 * 4. roda o k6 na fase `carga`, com esse p95 no threshold de espera da B;
 * 5. espera os interativos começarem e confere `job_registro` (nenhum `falhou`, nenhum interativo acima de 30 s);
 * 6. derruba o projeto com os volumes, passe ou não.
 *
 * O controle negativo só passa se o cenário reprovar pela justiça entre escolas (espera da B ou interativo
 * acima de 30 s) com a base de pé: reprovar porque o ambiente nem subiu não prova que a vaga por escola importa.
 */

export const PROJETO_CARGA = 'educa-carga'
export const ARQUIVOS_AMBIENTE_CARGA = ['.env.example', 'infra/carga.env'] as const
export const ARQUIVOS_COMPOSE_CARGA = ['infra/compose.yml', 'infra/compose.carga.yml'] as const
export const SCRIPT_DO_K6 = '/cenario/justica-entre-escolas.js'

/** Escolas sintéticas do cenário: A enche a fila, B mede a espera, C prova o rate limit. */
export const ESCOLAS = {
  A: '0190f5a0-0000-7000-8000-00000000ca0a',
  B: '0190f5a0-0000-7000-8000-00000000ca0b',
  C: '0190f5a0-0000-7000-8000-00000000ca0c',
} as const

/**
 * Tokens por grupo do k6. Na A, 50 jobs por usuário na rajada, abaixo dos 120 por minuto; na B, cada usuário cria
 * uns 4 jobs por minuto e consulta cada um algumas vezes; na C, um usuário por VU, e há mais tokens que VUs no teste
 * inteiro (400 da C e 2 do abusivo, 400 anônimos, 50 da A e até 60 da B); o abusivo é um usuário só.
 */
export const TOKENS_POR_GRUPO = {
  a_lote: { escola: ESCOLAS.A, quantidade: 40 },
  a_interativo: { escola: ESCOLAS.A, quantidade: 10 },
  b: { escola: ESCOLAS.B, quantidade: 30 },
  c: { escola: ESCOLAS.C, quantidade: 1_000 },
  abusivo: { escola: ESCOLAS.C, quantidade: 1 },
} as const

/** Os critérios que a vaga por escola sustenta: é por eles, e só por eles, que o controle negativo precisa reprovar. */
export const CRITERIOS_DE_JUSTICA = ['espera_b', 'interativo_acima_de_30s'] as const
/** Quanto a conferência espera os interativos começarem depois do k6, antes de contar quem passou de 30 s. */
const PRAZO_PARA_INTERATIVOS_MS = 60_000
/** Código de saída do k6 quando algum threshold foi cruzado. Qualquer outro diferente de zero é erro do k6. */
export const CODIGO_THRESHOLD_CRUZADO = 99

export interface Reprovacao {
  criterio: string
  detalhe: string
}

export interface ResumoDoK6 {
  codigo: number
  /** Métrica com o threshold cruzado, como `espera_b` ou `respostas_429{grupo:c}`, e o critério. */
  cruzados: Array<{ metrica: string; criterio: string }>
  esperaBP95Ms: number | undefined
}

/** Lê o `--summary-export` do k6, em que `true` num threshold quer dizer cruzado. */
export function lerResumoDoK6(codigo: number, resumo: unknown): ResumoDoK6 {
  const metricas = typeof resumo === 'object' && resumo !== null && 'metrics' in resumo ? (resumo.metrics as Record<string, Record<string, unknown>>) : {}
  const cruzados = Object.entries(metricas).flatMap(([metrica, valores]) =>
    Object.entries((valores['thresholds'] ?? {}) as Record<string, boolean>)
      .filter(([, cruzado]) => cruzado)
      .map(([criterio]) => ({ metrica, criterio })),
  )
  const p95 = metricas['espera_b']?.['p(95)']
  return { codigo, cruzados, esperaBP95Ms: typeof p95 === 'number' ? p95 : undefined }
}

export interface Veredito {
  passou: boolean
  reprovacoes: Reprovacao[]
  /** Reprovou por um critério de justiça entre escolas, com a fase base limpa. */
  reprovadoPelaJustica: boolean
}

/** Junta o k6 das duas fases e a conferência do banco num veredito. Sem fase de carga, o ambiente nem chegou lá. */
export function julgarCenario(base: ResumoDoK6, carga: ResumoDoK6 | undefined, conferencia: ConferenciaDaCarga | undefined): Veredito {
  const reprovacoes: Reprovacao[] = []
  const doK6 = (fase: string, resumo: ResumoDoK6) => {
    for (const { metrica, criterio } of resumo.cruzados) reprovacoes.push({ criterio: fase === 'carga' ? metrica : `base:${metrica}`, detalhe: `${fase}: ${metrica} ${criterio}` })
    // O código de saída e o resumo precisam concordar: 99 é threshold cruzado, e qualquer outro diferente de zero é o
    // k6 que não rodou até o fim (script inválido, container que caiu), mesmo com resumo limpo.
    const saidaEsperada = resumo.cruzados.length > 0 ? CODIGO_THRESHOLD_CRUZADO : 0
    if (resumo.codigo !== saidaEsperada) reprovacoes.push({ criterio: `k6_${fase}`, detalhe: `${fase}: k6 saiu com ${resumo.codigo}, e o resumo pedia ${saidaEsperada}` })
  }
  doK6('base', base)
  if (base.esperaBP95Ms === undefined) reprovacoes.push({ criterio: 'base:espera_b', detalhe: 'base: sem p95 de espera da escola B' })
  if (carga === undefined) reprovacoes.push({ criterio: 'k6_carga', detalhe: 'carga: a fase não rodou' })
  else doK6('carga', carga)
  if (conferencia === undefined) reprovacoes.push({ criterio: 'job_registro', detalhe: 'conferência de job_registro não rodou' })
  else {
    for (const motivo of conferencia.reprovacoes) {
      reprovacoes.push({ criterio: motivo.includes('interativo') ? 'interativo_acima_de_30s' : 'job_registro', detalhe: `job_registro: ${motivo}` })
    }
  }
  const baseLimpa = !reprovacoes.some((reprovacao) => reprovacao.criterio.startsWith('base:') || reprovacao.criterio === 'k6_base')
  const criteriosDeJustica: readonly string[] = CRITERIOS_DE_JUSTICA
  return {
    passou: reprovacoes.length === 0,
    reprovacoes,
    reprovadoPelaJustica: baseLimpa && carga !== undefined && reprovacoes.some((reprovacao) => criteriosDeJustica.includes(reprovacao.criterio)),
  }
}

/** Zero quando o cenário faz o que se espera dele: passar com a vaga por escola, e reprovar pela justiça sem ela. */
export function codigoDeSaida(veredito: Veredito, controleNegativo: boolean): number {
  if (controleNegativo) return veredito.reprovadoPelaJustica ? 0 : 1
  return veredito.passou ? 0 : 1
}

export function argumentosDoCompose(): string[] {
  return [
    'compose',
    '--project-name',
    PROJETO_CARGA,
    ...ARQUIVOS_AMBIENTE_CARGA.flatMap((arquivo) => ['--env-file', arquivo]),
    ...ARQUIVOS_COMPOSE_CARGA.flatMap((arquivo) => ['-f', arquivo]),
  ]
}

/** Os argumentos do `k6 run` de uma fase, dentro do container. */
export function argumentosDoK6(fase: 'base' | 'carga', esperaBaseP95Ms?: number): string[] {
  return [
    'run',
    '--quiet',
    '--no-usage-report',
    '--summary-export',
    `/execucao/resumo-${fase}.json`,
    '--env',
    `FASE=${fase}`,
    '--env',
    'API_URL=http://borda:8080',
    '--env',
    'WEB_URL=http://web:4173',
    '--env',
    'ARQUIVO_DOS_TOKENS=/execucao/tokens.json',
    ...(esperaBaseP95Ms === undefined ? [] : ['--env', `ESPERA_BASE_P95_MS=${Math.ceil(esperaBaseP95Ms)}`]),
    SCRIPT_DO_K6,
  ]
}

function rodar(comando: string, argumentos: readonly string[], ambiente: NodeJS.ProcessEnv, capturar = false): Promise<{ codigo: number; saida: string }> {
  return new Promise((resolver) => {
    const processo = spawn(comando, argumentos, { cwd: raizRepositorio, env: ambiente, stdio: ['ignore', capturar ? 'pipe' : 'inherit', 'inherit'] })
    let saida = ''
    processo.stdout?.on('data', (parte: Buffer) => (saida += parte.toString()))
    processo.on('error', () => resolver({ codigo: 127, saida }))
    processo.on('close', (codigo) => resolver({ codigo: codigo ?? 1, saida }))
  })
}

function lerAmbienteDaCarga(): Record<string, string> {
  const valores: Record<string, string> = {}
  for (const arquivo of ARQUIVOS_AMBIENTE_CARGA) {
    for (const [chave, valor] of Object.entries(parseEnv(readFileSync(join(raizRepositorio, arquivo), 'utf8')))) {
      if (valor !== undefined) valores[chave] = valor
    }
  }
  return valores
}

async function gerarTokens(ambiente: NodeJS.ProcessEnv): Promise<Record<string, string[]>> {
  const tokens: Record<string, string[]> = {}
  for (const [grupo, { escola, quantidade }] of Object.entries(TOKENS_POR_GRUPO)) {
    const argumentos = ['run', '-s', 'ops:token-sintetico', '--', '--escola', escola, '--quantidade', String(quantidade), '--validade', '1h']
    const { codigo, saida } = await rodar('npm', argumentos, ambiente, true)
    const linhas = saida.split('\n').filter((linha) => linha.startsWith('ey'))
    if (codigo !== 0 || linhas.length !== quantidade) throw new Error(`ops:token-sintetico não emitiu os ${quantidade} tokens do grupo ${grupo}`)
    tokens[grupo] = linhas
  }
  return tokens
}

function escrever(linha: string): void {
  process.stdout.write(`${linha}\n`)
}

async function executar(controleNegativo: boolean): Promise<number> {
  const pasta = mkdtempSync(join(tmpdir(), 'educa-carga-'))
  // O k6 do container roda com outro usuário: ele lê os tokens e grava o resumo nesta pasta.
  chmodSync(pasta, 0o777)
  // As variáveis dos arquivos de ambiente não vêm do shell: no compose, o shell passaria na frente do arquivo, e
  // uma porta exportada para o ambiente de desenvolvimento faria o cenário disputar a porta dele.
  const doArquivo = lerAmbienteDaCarga()
  const ambiente: NodeJS.ProcessEnv = {
    ...Object.fromEntries(Object.entries(process.env).filter(([chave]) => !(chave in doArquivo))),
    CARGA_PASTA_DA_EXECUCAO: pasta,
    VAGAS_POR_ESCOLA_DESLIGADAS: controleNegativo ? 'true' : 'false',
  }
  const compose = (...argumentos: string[]) => rodar('docker', [...argumentosDoCompose(), ...argumentos], ambiente)
  const inicio = new Date()
  let veredito: Veredito | undefined
  try {
    escrever(`\n▶ cenário "justiça entre escolas"${controleNegativo ? ', controle negativo (VAGAS_POR_ESCOLA_DESLIGADAS=true)' : ''}`)
    const tokens = await gerarTokens(ambiente)
    const arquivoDosTokens = join(pasta, 'tokens.json')
    writeFileSync(arquivoDosTokens, JSON.stringify(tokens))
    chmodSync(arquivoDosTokens, 0o644)

    // Começa do zero: um cenário interrompido antes deixaria jobs e vagas no volume.
    await compose('down', '--volumes', '--remove-orphans')
    const subida = await compose('up', '--detach', '--build', '--wait')
    if (subida.codigo !== 0) throw new Error('o compose de carga não subiu')

    const k6 = async (fase: 'base' | 'carga', esperaBaseP95Ms?: number): Promise<ResumoDoK6> => {
      escrever(`\n▶ k6, fase ${fase}`)
      const { codigo } = await compose('run', '--rm', '--no-deps', 'k6', ...argumentosDoK6(fase, esperaBaseP95Ms))
      let resumo: unknown
      try {
        resumo = JSON.parse(readFileSync(join(pasta, `resumo-${fase}.json`), 'utf8'))
      } catch {
        resumo = undefined
      }
      return lerResumoDoK6(codigo, resumo)
    }
    const base = await k6('base')
    escrever(`p95 da espera da escola B na base: ${base.esperaBP95Ms === undefined ? '-' : `${Math.round(base.esperaBP95Ms)} ms`}`)
    const carga = base.esperaBP95Ms === undefined ? undefined : await k6('carga', base.esperaBP95Ms)

    escrever('\n▶ conferência em job_registro')
    const cliente = new pg.Client({ connectionString: urlDoBancoDoAmbiente(doArquivo) })
    await cliente.connect()
    let conferencia: ConferenciaDaCarga
    try {
      const escolas = Object.values(ESCOLAS)
      await aguardarInterativosIniciados(cliente, escolas, PRAZO_PARA_INTERATIVOS_MS)
      conferencia = await conferirJobRegistro(cliente, escolas)
    } finally {
      await cliente.end()
    }
    const nomes = Object.fromEntries(Object.entries(ESCOLAS).map(([nome, id]) => [id, nome]))
    for (const linha of descreverConferencia(conferencia, nomes)) escrever(linha)

    veredito = julgarCenario(base, carga, conferencia)
  } catch (erro) {
    escrever(`\n✖ o cenário não terminou: ${erro instanceof Error ? erro.message : String(erro)}`)
    await compose('logs', '--no-color', '--tail', '100')
  } finally {
    await compose('down', '--volumes', '--remove-orphans')
    rmSync(pasta, { recursive: true, force: true })
  }

  const duracao = Math.round((Date.now() - inicio.getTime()) / 60_000)
  if (veredito === undefined) return 1
  escrever(`\n■ resultado em ${inicio.toISOString()} (${duracao} min): ${veredito.passou ? 'passou' : 'reprovou'}`)
  for (const reprovacao of veredito.reprovacoes) escrever(`  reprovado: ${reprovacao.detalhe}`)
  const codigo = codigoDeSaida(veredito, controleNegativo)
  if (controleNegativo) {
    escrever(codigo === 0 ? '✔ controle negativo: sem a vaga por escola, o cenário reprovou pela justiça entre escolas' : '✖ controle negativo: sem a vaga por escola, o cenário não reprovou pela justiça entre escolas')
  } else {
    escrever(codigo === 0 ? '✔ cenário passou' : '✖ cenário reprovou')
  }
  return codigo
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = await executar(process.argv.includes('--controle-negativo'))
}
