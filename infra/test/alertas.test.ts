import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { raizRepositorio } from '../../tools/ci/executar.ts'
import { arquivosDeAlertaDoRepositorio } from '../../tools/guardas/alerta-tem-runbook.ts'
import { NOMES_NO_PROMETHEUS } from '../../tools/testes/metricas.ts'
import { metricasDa } from '../../tools/testes/promql.ts'
import { criarGatilhoDaFalha, estadoDoAlerta, executarEnsaioDeAlertas, REGRAS_DO_ENSAIO, regrasDaResposta } from '../scripts/ensaio-alertas.ts'

interface Consulta {
  refId: string
  datasourceUid: string
  model: { expr?: string; instant?: boolean; type?: string; expression?: string; conditions?: Array<{ evaluator: { type: string; params: number[] } }> }
}

interface Regra {
  uid: string
  title: string
  condition: string
  for: string
  noDataState: string
  execErrState: string
  isPaused: boolean
  data: Consulta[]
}

interface Grupo {
  orgId: number
  name: string
  folder: string
  interval: string
  rules: Regra[]
}

const regras = arquivosDeAlertaDoRepositorio().flatMap((arquivo) => (parse(arquivo.conteudo) as { groups: Grupo[] }).groups.flatMap((grupo) => grupo.rules.map((regra) => ({ arquivo: arquivo.caminho, grupo, regra }))))

function regraPorUid(uid: string): { grupo: Grupo; regra: Regra } {
  const achada = regras.find((item) => item.regra.uid === uid)
  if (achada === undefined) throw new Error(`regra ${uid} não provisionada`)
  return achada
}

const expressao = (regra: Regra) => regra.data.find((consulta) => consulta.refId === 'A')?.model.expr ?? ''
const limiar = (regra: Regra) => regra.data.find((consulta) => consulta.refId === regra.condition)?.model.conditions?.[0]?.evaluator

describe('regras de alerta provisionadas', () => {
  it('são as três da Tech Spec, com o `for:` e o limiar declarados (RF16)', () => {
    expect(regras.map(({ regra }) => regra.uid).sort()).toEqual(Object.values(REGRAS_DO_ENSAIO).sort())

    const job = regraPorUid(REGRAS_DO_ENSAIO.jobInterativo).regra
    expect(job.for).toBe('1m')
    expect(expressao(job)).toBe('max by (fila, escola_id) (job_espera_mais_antiga_s{fila="interativa"})')
    expect(limiar(job)).toEqual({ type: 'gt', params: [30] })

    const seguro = regraPorUid(REGRAS_DO_ENSAIO.seguroDoLimite).regra
    expect(seguro.for).toBe('2m')
    // A proporção do seguro com o limiar declarado, ou (`or`, e não `and`) o Redis de cache fora para aquela instância, com ou sem tráfego.
    expect(expressao(seguro)).toBe('max by (instance) ((limite_seguro_ativo{job="educa/api"} >= bool 0.5) or (redis_disponivel{job="educa/api", instancia="cache"} == bool 0))')
    expect(limiar(seguro)).toEqual({ type: 'gt', params: [0] })

    const erro = regraPorUid(REGRAS_DO_ENSAIO.taxa5xx).regra
    expect(erro.for).toBe('5m')
    // A razão de 5xx sobre o total da rota (e não a taxa absoluta de erro), só em rota com tráfego no minuto.
    expect(expressao(erro)).toBe(
      '(sum by (job, http_route) (rate(http_server_request_duration_seconds_count{http_response_status_code=~"5.."}[1m])) / sum by (job, http_route) (rate(http_server_request_duration_seconds_count[1m]))) and (sum by (job, http_route) (rate(http_server_request_duration_seconds_count[1m])) > 0)',
    )
    expect(limiar(erro)).toEqual({ type: 'gt', params: [0.05] })
  })

  it('toda regra consulta o Prometheus da observabilidade por consulta instantânea, avalia a cada 10 s e não nasce pausada', () => {
    for (const { arquivo, grupo, regra } of regras) {
      expect(grupo.interval, arquivo).toBe('10s')
      expect(grupo.folder, arquivo).toBe('Educa.ia alertas')
      expect(regra.isPaused, arquivo).toBe(false)
      const consulta = regra.data.find((item) => item.refId === 'A')
      expect(consulta?.datasourceUid, arquivo).toBe('prometheus')
      expect(consulta?.model.instant, arquivo).toBe(true)
      const condicao = regra.data.find((item) => item.refId === regra.condition)
      expect(condicao?.model).toMatchObject({ type: 'threshold', expression: 'A' })
    }
  })

  it('sem dado é normal, e erro de avaliação aparece como erro: série que some não prende o alerta disparado', () => {
    for (const { arquivo, regra } of regras) {
      expect(regra.noDataState, arquivo).toBe('OK')
      expect(regra.execErrState, arquivo).toBe('Error')
    }
  })

  it('toda regra consulta métrica que o código exporta, com o nome do Prometheus, e nenhuma agrupa por usuário', () => {
    const conhecidas = new Set<string>(Object.values(NOMES_NO_PROMETHEUS).flat())
    for (const { arquivo, regra } of regras) {
      const usadas = metricasDa(expressao(regra))
      expect(usadas.length, arquivo).toBeGreaterThan(0)
      for (const nome of usadas) expect(conhecidas.has(nome), `${arquivo}: ${nome}`).toBe(true)
      expect(expressao(regra), arquivo).not.toMatch(/usuario/)
    }
  })

  it('o compose monta a pasta das regras no provisionamento de alertas do Grafana, só para leitura', () => {
    const compose = parse(readFileSync(join(raizRepositorio, 'infra/compose.yml'), 'utf8')) as { services: Record<string, { volumes?: string[] }> }
    expect(compose.services['observabilidade']?.volumes).toContain('./grafana/alertas:/otel-lgtm/grafana/conf/provisioning/alerting:ro')
  })

  it('`npm run ensaio:alertas` constrói o emissor de token e roda o ensaio com as variáveis de .env.example, sobrepostas pelo .env local como no compose', () => {
    const pacote = JSON.parse(readFileSync(join(raizRepositorio, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    expect(pacote.scripts['ensaio:alertas']).toMatch(/build -w @educa\/api && node --env-file=\.env\.example --env-file-if-exists=\.env infra\/scripts\/ensaio-alertas\.ts$/)
  })
})

describe('leitura do estado das regras na API do Grafana', () => {
  it('classifica os estados do Grafana, inclusive os com motivo entre parênteses', () => {
    expect(estadoDoAlerta('Alerting')).toBe('disparado')
    expect(estadoDoAlerta('Alerting (NoData)')).toBe('disparado')
    expect(estadoDoAlerta('Pending')).toBe('pendente')
    expect(estadoDoAlerta('Normal (NoData)')).toBe('normal')
    expect(estadoDoAlerta('Normal')).toBe('normal')
    expect(estadoDoAlerta('Error')).toBe('erro')
    // Estado que o ensaio não conhece (`Recovering`, de `keep_firing_for`, ou um nome novo do Grafana) não passa por normal.
    expect(() => estadoDoAlerta('Recovering')).toThrow('estado de alerta desconhecido')
    expect(() => estadoDoAlerta('')).toThrow('estado de alerta desconhecido')
  })

  it('lê uid, `for:`, rótulos e início da pendência de cada alerta, e ignora o que não é regra do Grafana', () => {
    const corpo = {
      status: 'success',
      data: {
        groups: [
          {
            name: 'fila',
            rules: [
              {
                uid: REGRAS_DO_ENSAIO.jobInterativo,
                name: 'Job interativo esperando',
                state: 'firing',
                duration: 60,
                alerts: [
                  { labels: { escola_id: 'a', fila: 'interativa' }, state: 'Alerting', activeAt: '2026-09-13T22:07:10Z' },
                  { labels: { escola_id: 'b', fila: 'interativa' }, state: 'Normal', activeAt: '0001-01-01T00:00:00Z' },
                ],
              },
              { name: 'sem uid', state: 'inactive' },
            ],
          },
        ],
      },
    }
    const lidas = regrasDaResposta(corpo)
    expect([...lidas.keys()]).toEqual([REGRAS_DO_ENSAIO.jobInterativo])
    expect(lidas.get(REGRAS_DO_ENSAIO.jobInterativo)).toEqual({
      uid: REGRAS_DO_ENSAIO.jobInterativo,
      titulo: 'Job interativo esperando',
      estado: 'firing',
      duracaoS: 60,
      alertas: [
        { estado: 'disparado', rotulos: { escola_id: 'a', fila: 'interativa' }, desdeMs: Date.parse('2026-09-13T22:07:10Z') },
        { estado: 'normal', rotulos: { escola_id: 'b', fila: 'interativa' }, desdeMs: undefined },
      ],
    })
    expect(regrasDaResposta({ status: 'error' }).size).toBe(0)
  })
})

describe('travas do ensaio', () => {
  it('permissão: fora de AMBIENTE=local o ensaio recusa antes de tocar no compose, no banco ou na API', async () => {
    for (const AMBIENTE of ['producao', 'staging', undefined]) {
      const chamadas: string[][] = []
      const ensaio = executarEnsaioDeAlertas({
        compose: (...argumentos) => {
          chamadas.push(argumentos)
          return Promise.resolve({ codigo: 0, saida: '' })
        },
        servicos: [],
        apiUrl: 'http://127.0.0.1:1',
        grafanaUrl: 'http://127.0.0.1:1',
        bancoUrl: 'postgres://ninguem@127.0.0.1:1/nada',
        ambiente: { AMBIENTE },
        emitirToken: () => Promise.reject(new Error('não deveria emitir token')),
      })
      await expect(ensaio, String(AMBIENTE)).rejects.toThrow('o ensaio de alertas só roda com AMBIENTE=local')
      expect(chamadas, String(AMBIENTE)).toEqual([])
    }
  })

  it('o gatilho só é criado para id de escola em formato UUID: o id entra no texto do DDL', async () => {
    for (const escolaId of ["x'::uuid) execute function pg_sleep(); --", '', '00000000-0000-0000-0000-00000000000G']) {
      // Banco inexistente: se a checagem não recusasse antes, o erro seria de conexão, e não este.
      await expect(criarGatilhoDaFalha('postgres://ninguem@127.0.0.1:1/nada', escolaId)).rejects.toThrow('escola do ensaio precisa ser um UUID')
    }
  })
})
