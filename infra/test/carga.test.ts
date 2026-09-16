import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import { alcanceDe } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { raizRepositorio } from '../../tools/ci/executar.ts'
import {
  argumentosDoCompose,
  argumentosDoK6,
  codigoDeSaida,
  CODIGO_THRESHOLD_CRUZADO,
  julgarCenario,
  NOMES_DAS_ESCOLAS,
  lerResumoDoK6,
  TOKENS_POR_GRUPO,
  type ResumoDoK6,
} from '../scripts/carga.ts'
import type { ConferenciaDaCarga } from '../scripts/conferir-carga.ts'

const lerArquivo = (caminho: string) => readFileSync(join(raizRepositorio, caminho), 'utf8')

const limpo = (esperaBP95Ms = 40): ResumoDoK6 => ({ codigo: 0, cruzados: [], esperaBP95Ms })
const cruzado = (...metricas: string[]): ResumoDoK6 => ({ codigo: CODIGO_THRESHOLD_CRUZADO, cruzados: metricas.map((metrica) => ({ metrica, criterio: 'x' })), esperaBP95Ms: 900 })
const conferencia = (...reprovacoes: string[]): ConferenciaDaCarga => ({ linhas: [], reprovacoes })

describe('veredito do cenário "justiça entre escolas"', () => {
  it('passa só com as duas fases do k6 limpas e o job_registro confirmando', () => {
    const veredito = julgarCenario(limpo(), limpo(), conferencia())
    expect(veredito).toEqual({ passou: true, reprovacoes: [], reprovadoPelaJustica: false })
    expect(codigoDeSaida(veredito, false)).toBe(0)
    // No controle negativo, passar é o erro: a vaga por escola desligada não fez diferença nenhuma.
    expect(codigoDeSaida(veredito, true)).toBe(1)
  })

  it('a espera da B acima da base + margem reprova o cenário, e é o que o controle negativo precisa ver', () => {
    const veredito = julgarCenario(limpo(), cruzado('espera_b'), conferencia())
    expect(veredito.passou).toBe(false)
    expect(veredito.reprovadoPelaJustica).toBe(true)
    expect(codigoDeSaida(veredito, false)).toBe(1)
    expect(codigoDeSaida(veredito, true)).toBe(0)
  })

  it('interativo acima de 30 s no job_registro reprova pela justiça, mesmo com o k6 limpo', () => {
    const veredito = julgarCenario(limpo(), limpo(), conferencia('3 job(s) interativo(s) esperaram mais de 30 s para começar'))
    expect(veredito.reprovacoes.map((reprovacao) => reprovacao.criterio)).toEqual(['interativo_acima_de_30s'])
    expect(codigoDeSaida(veredito, true)).toBe(0)
  })

  it.each([
    ['429 para anônimos atrás do mesmo IP', julgarCenario(limpo(), cruzado('respostas_429{grupo:anonimo}'), conferencia())],
    ['job que falhou', julgarCenario(limpo(), limpo(), conferencia('2 job(s) terminaram falhou'))],
    ['k6 da carga que caiu sem threshold cruzado', julgarCenario(limpo(), { codigo: 107, cruzados: [], esperaBP95Ms: 30 }, conferencia())],
    ['fase de carga que nem rodou', julgarCenario(limpo(), undefined, undefined)],
    ['base que já reprovou: sem base limpa, a espera da carga não compara nada', julgarCenario(cruzado('respostas_inesperadas'), cruzado('espera_b'), conferencia())],
    ['base sem p95 da espera', julgarCenario({ codigo: 0, cruzados: [], esperaBP95Ms: undefined }, cruzado('espera_b'), conferencia())],
  ])('%s reprova o cenário, mas não conta como controle negativo aprovado', (_caso, veredito) => {
    expect(veredito.passou).toBe(false)
    expect(veredito.reprovadoPelaJustica).toBe(false)
    expect(codigoDeSaida(veredito, false)).toBe(1)
    expect(codigoDeSaida(veredito, true)).toBe(1)
  })

  it('saída zero do k6 com threshold cruzado no resumo não passa por limpa', () => {
    const veredito = julgarCenario(limpo(), { codigo: 0, cruzados: [{ metrica: 'respostas_429{grupo:c}', criterio: 'count==0' }], esperaBP95Ms: 30 }, conferencia())
    expect(veredito.reprovacoes.map((reprovacao) => reprovacao.criterio)).toEqual(['respostas_429{grupo:c}', 'k6_carga'])
  })

  it('lê o --summary-export do k6: true no threshold é cruzado, false é dentro', () => {
    const resumo = {
      metrics: {
        espera_b: { 'p(95)': 612.4, max: 1_900, thresholds: { 'p(95)<=541': true, 'max<30000': false } },
        'respostas_429{grupo:c_abusivo}': { count: 180, thresholds: { 'count>0': false } },
        'respostas_429{grupo:c}': { count: 0, thresholds: { 'count==0': false } },
        iterations: { count: 10 },
      },
    }
    expect(lerResumoDoK6(CODIGO_THRESHOLD_CRUZADO, resumo)).toEqual({
      codigo: CODIGO_THRESHOLD_CRUZADO,
      cruzados: [{ metrica: 'espera_b', criterio: 'p(95)<=541' }],
      esperaBP95Ms: 612.4,
    })
    expect(lerResumoDoK6(107, undefined)).toEqual({ codigo: 107, cruzados: [], esperaBP95Ms: undefined })
  })
})

describe('execução do cenário', () => {
  it('a fase de carga leva a base arredondada para cima no threshold da espera, e a base não leva nenhuma', () => {
    expect(argumentosDoK6('carga', 41.2)).toContain('ESPERA_BASE_P95_MS=42')
    expect(argumentosDoK6('base').some((argumento) => argumento.startsWith('ESPERA_BASE_P95_MS'))).toBe(false)
    expect(argumentosDoK6('base')).toContain('--no-usage-report')
  })

  it('o compose de carga é um projeto próprio, com as portas de infra/carga.env sobre .env.example', () => {
    const argumentos = argumentosDoCompose()
    expect(argumentos.slice(0, 3)).toEqual(['compose', '--project-name', 'educa-carga'])
    expect(argumentos.join(' ')).toContain('--env-file .env.example --env-file infra/carga.env -f infra/compose.yml -f infra/compose.carga.yml')
  })

  it('as portas do cenário não colidem com as do desenvolvimento nem com as dos testes', () => {
    const portas = (arquivo: string) => new Set(Object.entries(parseEnv(lerArquivo(arquivo))).filter(([chave]) => chave.endsWith('_PORTA_HOST')).map(([, valor]) => valor))
    const daCarga = portas('infra/carga.env')
    const doExemplo = portas('.env.example')
    expect(daCarga.size).toBe(doExemplo.size)
    for (const porta of [...doExemplo, ...portas('infra/teste.env')]) expect(daCarga.has(porta), porta).toBe(false)
  })

  it('as três escolas são distintas, e há token da C para todo VU do teste: dois VUs com o mesmo usuário somariam no mesmo limite', () => {
    expect(new Set(NOMES_DAS_ESCOLAS).size).toBe(3)
    const script = lerArquivo('infra/k6/justica-entre-escolas.js')
    const constante = (nome: string) => Number(new RegExp(`const ${nome} = ([0-9_]+)`).exec(script)?.[1]?.replaceAll('_', ''))
    const vusNoTeste =
      constante('USUARIOS_NORMAIS_DA_C') +
      constante('VUS_DO_ABUSIVO') +
      constante('VISITANTES_ANONIMOS') +
      constante('USUARIOS_DA_A_NO_LOTE') +
      constante('USUARIOS_DA_A_NO_INTERATIVO') +
      constante('VUS_MAXIMOS_DA_B')
    expect(script).toContain('maxVUs: VUS_MAXIMOS_DA_B')
    expect(script.match(/maxVUs: VUS_DO_ABUSIVO/g)).toHaveLength(1)
    expect(vusNoTeste).toBeGreaterThan(800)
    expect(TOKENS_POR_GRUPO.c.quantidade).toBeGreaterThanOrEqual(vusNoTeste)
    expect(TOKENS_POR_GRUPO.a_lote.quantidade).toBe(constante('USUARIOS_DA_A_NO_LOTE'))
    expect(TOKENS_POR_GRUPO.a_interativo.quantidade).toBe(constante('USUARIOS_DA_A_NO_INTERATIVO'))
    expect(TOKENS_POR_GRUPO.abusivo.escola).toBe('C')
    expect(TOKENS_POR_GRUPO.c.escola).toBe('C')
  })

  it('cada grupo pede o papel que a MATRIZ deixa chamar a rota dele: equipe no job sintético, aluno no contexto', () => {
    // Sem isto, a A e a B receberiam 404 em `POST /v1/sistema/jobs-sinteticos` e o cenário mediria fila vazia.
    for (const grupo of ['a_lote', 'a_interativo', 'b'] as const) {
      expect(alcanceDe(TOKENS_POR_GRUPO[grupo].papel, 'sistema_job_sintetico', 'criar'), grupo).not.toBe('nunca')
    }
    for (const grupo of ['c', 'abusivo'] as const) {
      expect(alcanceDe(TOKENS_POR_GRUPO[grupo].papel, 'sistema_contexto', 'ler'), grupo).not.toBe('nunca')
    }
  })

  it('o token sintético do F0 não é mais emitido em lugar nenhum do cenário', () => {
    // O resto do caminho (escolas antes das sessões, sessão nova por fase, papel certo) quem prova é a
    // execução do cenário, registrada no 3_task.md: teste de texto sobre a ordem do script não pega falha real.
    expect(lerArquivo('infra/scripts/carga.ts')).not.toContain('ops:token-sintetico')
    expect(lerArquivo('infra/k6/justica-entre-escolas.js')).not.toContain('ops:token-sintetico')
  })
})

interface ServicoDaCarga {
  cpus?: number
  environment?: Record<string, string>
  image?: string
  profiles?: string[]
}

describe('infra/compose.carga.yml', () => {
  const { services: carga } = parse(lerArquivo('infra/compose.carga.yml'), { merge: true }) as { services: Record<string, ServicoDaCarga> }
  const { services: base } = parse(lerArquivo('infra/compose.yml'), { merge: true }) as { services: Record<string, unknown> }

  it('fixa a CPU de todo serviço do ambiente, para o resultado não depender da máquina', () => {
    for (const nome of Object.keys(base)) {
      expect(carga[nome]?.cpus, nome).toBeGreaterThan(0)
    }
  })

  it('o sandbox de cada worker tem uma thread por núcleo inteiro e sobra pelo menos meio núcleo para o event loop', () => {
    const workers = Object.keys(base).filter((nome) => nome.startsWith('worker-'))
    expect(workers).toHaveLength(4)
    for (const nome of workers) {
      const threads = Number(carga[nome]?.environment?.['WORKER_THREADS_MAXIMO'])
      const cpus = carga[nome]?.cpus ?? 0
      expect(Number.isInteger(threads) && threads >= 1, nome).toBe(true)
      expect(threads, nome).toBeLessThanOrEqual(cpus - 0.5)
    }
  })

  it('não desliga a vaga por escola: só o controle negativo liga, pela linha de comando', () => {
    expect(lerArquivo('infra/compose.carga.yml')).not.toContain('VAGAS_POR_ESCOLA_DESLIGADAS')
  })

  it('o k6 tem versão fixa, só sobe por perfil, e não manda relatório de uso para fora da máquina', () => {
    const k6 = carga['k6']
    expect(k6?.image).toMatch(/^grafana\/k6:\d+\.\d+\.\d+$/)
    expect(k6?.profiles).toEqual(['carga'])
    expect(k6?.environment?.['K6_NO_USAGE_REPORT']).toBe('true')
  })
})
