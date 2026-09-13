import 'reflect-metadata'
import {
  executarNoContexto,
  OPCOES_DE_JOB_PUBLICADO,
  RETENCAO_JOB_CONCLUIDO_SEGUNDOS,
  RETENCAO_JOB_FALHO_SEGUNDOS,
  TENTATIVAS_DE_JOB,
} from '@educa/nucleo'
import { CodigoDeErro, CodigoDeFalhaDeJob } from '@educa/shared'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { compose } from '../../../tools/testes/compose.ts'
import { BancadaDeFila, ESCOLA_A, ESCOLA_B, LogEmMemoria } from './fila-de-teste.js'

// Despachantes e workers de verdade (a mesma montagem do main.ts), no processo do teste, contra o
// Postgres e o Redis de fila do compose de teste. Cada bancada usa um prefixo próprio no BullMQ.

async function aguardarEstado(bancada: BancadaDeFila, id: string, estado: string, limiteMs = 30_000): Promise<void> {
  await expect.poll(async () => (await bancada.estado(id))?.estado, { timeout: limiteMs, interval: 100 }).toBe(estado)
}

beforeAll(() => {
  // Despachante ou worker do compose de pé disputaria as linhas com os deste arquivo.
  compose('stop', 'despachante-1', 'despachante-2', 'worker-1', 'worker-2')
})

describe('dois despachantes e dois workers sobre a mesma fila', () => {
  let bancada: BancadaDeFila

  beforeEach(async () => {
    bancada = new BancadaDeFila()
    await bancada.limparRegistro()
  })

  afterEach(async () => {
    await bancada.fechar()
  })

  it('500 jobs: cada um é publicado por um despachante só e executado exatamente uma vez', async () => {
    const ids = new Set<string>()
    for (let lote = 0; lote < 5; lote++) {
      const criados = await Promise.all(
        Array.from({ length: 100 }, (_, indice) => bancada.enfileirar(indice % 2 === 0 ? ESCOLA_A : ESCOLA_B)),
      )
      for (const id of criados) ids.add(id)
    }
    expect(ids.size).toBe(500)

    const logs = { d1: new LogEmMemoria('despachante-1'), d2: new LogEmMemoria('despachante-2'), w1: new LogEmMemoria('worker-1'), w2: new LogEmMemoria('worker-2') }
    const trabalhadores = [bancada.worker(logs.w1, { concorrencia: 10 }), bancada.worker(logs.w2, { concorrencia: 10 })]
    const despachantes = [bancada.despachante(logs.d1), bancada.despachante(logs.d2)]
    // Os dois partem juntos sobre as mesmas 500 linhas: é a disputa que o SKIP LOCKED e a troca condicional resolvem.
    for (const { despachante } of despachantes) despachante.iniciar()

    await expect
      .poll(async () => {
        const { rows } = await bancada.pool.query<{ total: string }>(`select count(*) as total from job_registro where estado = 'concluido'`)
        return Number(rows[0]?.total)
      }, { timeout: 60_000, interval: 250 })
      .toBe(500)
    await Promise.all(despachantes.map((montado) => montado.encerrar()))
    await Promise.all(trabalhadores.map((montado) => montado.encerrar()))

    const publicadosPor = (log: LogEmMemoria) => log.doEvento('job.publicado').map((registro) => String(registro['jobId']))
    const publicados1 = publicadosPor(logs.d1)
    const publicados2 = publicadosPor(logs.d2)
    // A disputa aconteceu de verdade: os dois publicaram, e nenhuma rodada falhou calada.
    expect(publicados1.length).toBeGreaterThan(0)
    expect(publicados2.length).toBeGreaterThan(0)
    expect([...logs.d1.doEvento('despachante.rodada_falhou'), ...logs.d2.doEvento('despachante.rodada_falhou')]).toEqual([])
    expect(publicados1.filter((id) => publicados2.includes(id))).toEqual([])
    expect(new Set([...publicados1, ...publicados2])).toEqual(ids)
    expect(publicados1.length + publicados2.length).toBe(500)

    const execucoes = new Map<string, number>()
    for (const registro of [...logs.w1.doEvento('job.iniciado'), ...logs.w2.doEvento('job.iniciado')]) {
      const id = String(registro['jobId'])
      execucoes.set(id, (execucoes.get(id) ?? 0) + 1)
    }
    expect(execucoes.size).toBe(500)
    expect([...execucoes.values()].filter((vezes) => vezes !== 1)).toEqual([])
  }, 120_000)

  it('o worker restaura escola e requisição do job: toda linha do despachante e do worker sobre ele leva o requisicaoId de quem pediu', async () => {
    const requisicaoId = randomUUID()
    const id = await bancada.enfileirar(ESCOLA_B, {}, requisicaoId)
    const logDespachante = new LogEmMemoria('despachante')
    const logWorker = new LogEmMemoria('worker')
    const { worker } = bancada.worker(logWorker)
    bancada.despachante(logDespachante).despachante.iniciar()
    await aguardarEstado(bancada, id, 'concluido')
    // O BullMQ guarda o concluído por 1 dia e o falho por 7: é o que ainda deduplica um reenvio.
    expect(worker.opts.removeOnComplete).toEqual({ age: RETENCAO_JOB_CONCLUIDO_SEGUNDOS })
    expect(worker.opts.removeOnFail).toEqual({ age: RETENCAO_JOB_FALHO_SEGUNDOS })

    const sobreOJob = [...logDespachante.registros(), ...logWorker.registros()].filter((registro) => registro['jobId'] === id)
    expect(sobreOJob.map((registro) => registro['evento'])).toEqual(['job.publicado', 'job.iniciado', 'job.concluido'])
    for (const registro of sobreOJob) expect(registro).toMatchObject({ requisicaoId, escolaId: ESCOLA_B })
  })

  it('falha permanente: 5 tentativas com recuo e depois falhou, com a escola e o código tipado', async () => {
    const id = await bancada.enfileirar(ESCOLA_A, { dados: { cpuMs: 0, falhar: true } })
    const logWorker = new LogEmMemoria('worker')
    bancada.worker(logWorker)
    const inicio = performance.now()
    bancada.despachante(new LogEmMemoria('despachante')).despachante.iniciar()

    await aguardarEstado(bancada, id, 'falhou', 60_000)
    // Recuo exponencial de 2 s com jitter de 50 %: as quatro esperas somam pelo menos 15 s.
    expect(performance.now() - inicio).toBeGreaterThan(15_000)
    expect(await bancada.estado(id)).toEqual({ estado: 'falhou', escolaId: ESCOLA_A, codigoFalha: CodigoDeFalhaDeJob.FALHA_SINTETICA })
    expect(logWorker.doEvento('job.iniciado').filter((registro) => registro['jobId'] === id)).toHaveLength(TENTATIVAS_DE_JOB)

    const naFila = await bancada.fila.getJob(id)
    expect(naFila?.attemptsMade).toBe(TENTATIVAS_DE_JOB)
    expect(naFila?.failedReason).toBe(CodigoDeFalhaDeJob.FALHA_SINTETICA)
    expect(await naFila?.getState()).toBe('failed')
  }, 90_000)

  it('erro inesperado com valor de campo na mensagem: nem o Redis nem o log recebem o texto, só o código', async () => {
    const id = await bancada.enfileirar(ESCOLA_A)
    const logWorker = new LogEmMemoria('worker')
    const processadores = {
      sintetico: () => Promise.reject(new Error('Key (nome)=(Enzo Martins) already exists')),
    }
    bancada.worker(logWorker, { processadores })
    // Publicado como o despachante faz, com duas tentativas e sem recuo: passa pela falha intermediária e pela definitiva.
    await bancada.despacho.reservar(10)
    await bancada.fila.add('sintetico', { escolaId: ESCOLA_A, requisicaoId: null }, { jobId: id, attempts: 2 })

    await aguardarEstado(bancada, id, 'falhou')
    expect((await bancada.estado(id))?.codigoFalha).toBe(CodigoDeFalhaDeJob.ERRO_INTERNO)
    const naFila = await bancada.fila.getJob(id)
    expect(naFila?.attemptsMade).toBe(2)
    expect(naFila?.failedReason).toBe(CodigoDeFalhaDeJob.ERRO_INTERNO)
    expect(naFila?.stacktrace).toHaveLength(2)
    expect(JSON.stringify(naFila?.stacktrace)).not.toContain('Enzo')
    expect(logWorker.linhas.join('')).not.toContain('Enzo')
  })

  it('escrita tardia: marcar publicado depois de o worker concluir não tira o job de concluido', async () => {
    const id = await bancada.enfileirar(ESCOLA_A)
    const [reservado] = await bancada.despacho.reservar(10)
    expect(reservado?.id).toBe(id)

    // O worker pega o job antes de o despachante gravar `publicado`, e termina.
    await executarNoContexto({ requisicaoId: randomUUID(), escolaId: ESCOLA_A }, async () => {
      expect((await bancada.registro.iniciarExecucao(id)).situacao).toBe('iniciado')
      // Ainda ativo: a escrita tardia também não o rebaixa.
      expect(await bancada.despacho.marcarPublicados([id])).toBe(0)
      expect((await bancada.estado(id))?.estado).toBe('ativo')
      expect(await bancada.registro.concluir(id)).toBe(true)
    })

    expect(await bancada.despacho.marcarPublicados([id])).toBe(0)
    expect((await bancada.estado(id))?.estado).toBe('concluido')
    // Concluido não volta a reservado nem a ativo, nem com a reserva antiga vencida.
    await bancada.pool.query(`update job_registro set reservado_ate = now() - interval '1 minute' where id = $1`, [id])
    expect(await bancada.despacho.reservar(10)).toEqual([])
    await executarNoContexto({ requisicaoId: randomUUID(), escolaId: ESCOLA_A }, async () => {
      expect((await bancada.registro.iniciarExecucao(id)).situacao).toBe('nao_executavel')
      expect(await bancada.registro.registrarFalha(id, CodigoDeFalhaDeJob.ERRO_INTERNO)).toBe(false)
    })
    expect((await bancada.estado(id))?.estado).toBe('concluido')
  })

  it('reserva vencida volta a ser reservada, mas job ativo com reserva vencida não', async () => {
    const parado = await bancada.enfileirar(ESCOLA_A)
    const emExecucao = await bancada.enfileirar(ESCOLA_A)
    expect((await bancada.despacho.reservar(10)).map((job) => job.id).sort()).toEqual([parado, emExecucao].sort())
    // Antes de vencer, ninguém mais pega.
    expect(await bancada.despacho.reservar(10)).toEqual([])

    await executarNoContexto({ requisicaoId: randomUUID(), escolaId: ESCOLA_A }, () => bancada.registro.iniciarExecucao(emExecucao))
    // O despachante que reservou caiu antes de publicar: a reserva vence.
    await bancada.pool.query(`update job_registro set reservado_ate = now() - interval '1 second'`)

    expect((await bancada.despacho.reservar(10)).map((job) => job.id)).toEqual([parado])
    expect((await bancada.estado(emExecucao))?.estado).toBe('ativo')
  })

  it('o mesmo job entregue de novo pela fila depois de concluído não roda outra vez', async () => {
    const id = await bancada.enfileirar(ESCOLA_A)
    const logWorker = new LogEmMemoria('worker')
    bancada.worker(logWorker)
    bancada.despachante(new LogEmMemoria('despachante')).despachante.iniciar()
    await aguardarEstado(bancada, id, 'concluido')

    // A fila perdeu o job e ele foi publicado de novo, com o mesmo id.
    await (await bancada.fila.getJob(id))?.remove()
    const reentregue = await bancada.fila.add('sintetico', { escolaId: ESCOLA_A, requisicaoId: null }, { jobId: id })
    await expect.poll(() => reentregue.getState(), { timeout: 10_000 }).toBe('completed')

    expect(logWorker.doEvento('job.iniciado').filter((registro) => registro['jobId'] === id)).toHaveLength(1)
    expect(logWorker.doEvento('job.ja_finalizado').filter((registro) => registro['jobId'] === id)).toHaveLength(1)
  })

  describe('isolamento no worker', () => {
    it('job da fila com a escola A, ou sem escola, apontando para a linha da B não roda, e dá o mesmo resultado de um id inexistente', async () => {
      const daEscolaB = await bancada.enfileirar(ESCOLA_B)
      const outraDaEscolaB = await bancada.enfileirar(ESCOLA_B)
      await bancada.despacho.reservar(10)
      const logWorker = new LogEmMemoria('worker')
      bancada.worker(logWorker)
      const inexistente = randomUUID()

      // Com as opções de publicação de verdade (5 tentativas): nenhuma tentativa a mais é gasta.
      const publicar = (jobId: string, escolaId: string | null) =>
        bancada.fila.add('sintetico', { escolaId, requisicaoId: null }, { ...OPCOES_DE_JOB_PUBLICADO, jobId })
      const jobs = [
        await publicar(daEscolaB, ESCOLA_A),
        // Sem escola, o contexto é de rotina do sistema, que só alcança job sem escola.
        await publicar(outraDaEscolaB, null),
        await publicar(inexistente, ESCOLA_A),
      ]
      for (const job of jobs) await expect.poll(() => job.getState(), { timeout: 10_000 }).toBe('failed')

      const naFila = await Promise.all([daEscolaB, outraDaEscolaB, inexistente].map((id) => bancada.fila.getJob(id)))
      for (const job of naFila) {
        expect(job?.failedReason).toBe(CodigoDeErro.NAO_ENCONTRADO)
        expect(job?.attemptsMade).toBe(1)
      }

      const eventos = (id: string) => logWorker.registros().filter((registro) => registro['jobId'] === id).map((registro) => registro['evento'])
      expect(eventos(inexistente)).toEqual(['job.nao_encontrado'])
      expect(eventos(daEscolaB)).toEqual(eventos(inexistente))
      expect(eventos(outraDaEscolaB)).toEqual(eventos(inexistente))
      // As linhas da escola B continuam intocadas.
      expect(await bancada.estado(daEscolaB)).toEqual({ estado: 'reservado', escolaId: ESCOLA_B, codigoFalha: null })
      expect(await bancada.estado(outraDaEscolaB)).toEqual({ estado: 'reservado', escolaId: ESCOLA_B, codigoFalha: null })
    })

    it('contexto sem escola e sem a marca de rotina do sistema (rota anônima) não alcança job nenhum', async () => {
      const daEscolaA = await bancada.enfileirar(ESCOLA_A)
      await bancada.despacho.reservar(10)
      await expect(executarNoContexto({ requisicaoId: randomUUID() }, () => bancada.registro.iniciarExecucao(daEscolaA))).rejects.toThrow(
        'não tem escopo',
      )
      expect((await bancada.estado(daEscolaA))?.estado).toBe('reservado')
    })
  })

  describe('enfileirar', () => {
    const contar = async () => Number((await bancada.pool.query<{ total: string }>('select count(*) as total from job_registro')).rows[0]?.total)

    it('o job é gravado na transação de quem pede: se ela desfaz, não sobra linha nem publicação', async () => {
      const logDespachante = new LogEmMemoria('despachante')
      bancada.despachante(logDespachante).despachante.iniciar()
      await expect(
        executarNoContexto({ requisicaoId: randomUUID(), escolaId: ESCOLA_A }, () =>
          bancada.banco.transaction(async (tx) => {
            await bancada.enfileirador.enfileirar(tx, { tipo: 'sintetico', fila: 'normal', naoUrgente: false, dados: { cpuMs: 0, falhar: false } })
            throw new Error('o que originou o job não foi gravado')
          }),
        ),
      ).rejects.toThrow('o que originou o job não foi gravado')

      await new Promise((resolver) => setTimeout(resolver, 1_000))
      expect(await contar()).toBe(0)
      expect(logDespachante.doEvento('job.publicado')).toEqual([])
    })

    it('job de escola sem escola no contexto, e job de sistema vindo de escola ou de rota anônima, são recusados antes de gravar', async () => {
      const pedido = (tipo: string) => ({ tipo, fila: 'lote' as const, naoUrgente: true, dados: {} })
      const tentar = (contexto: Parameters<typeof executarNoContexto>[0], tipo: string) =>
        executarNoContexto(contexto, () => bancada.banco.transaction((tx) => bancada.enfileirador.enfileirar(tx, pedido(tipo))))

      await expect(tentar({ requisicaoId: randomUUID() }, 'sintetico')).rejects.toThrow('job de escola sem escola no contexto')
      await expect(tentar({ requisicaoId: randomUUID(), escolaId: ESCOLA_A }, 'sistema.expurgar-jobs')).rejects.toThrow('job de sistema só nasce de rotina do sistema')
      await expect(tentar({ requisicaoId: randomUUID() }, 'sistema.expurgar-jobs')).rejects.toThrow('job de sistema só nasce de rotina do sistema')
      expect(await contar()).toBe(0)

      const doSistema = await tentar({ requisicaoId: randomUUID(), rotinaDoSistema: true }, 'sistema.expurgar-jobs')
      expect(await bancada.estado(doSistema)).toEqual({ estado: 'aguardando', escolaId: null, codigoFalha: null })
    })
  })

  it('o aviso do NOTIFY acorda o despachante sem esperar a sondagem', async () => {
    const logDespachante = new LogEmMemoria('despachante')
    // Sondagem de um minuto: só o aviso explica a publicação em segundos.
    bancada.despachante(logDespachante, { intervaloMs: 60_000 }).despachante.iniciar()
    // A primeira rodada (que abre o LISTEN) já passou, e o laço dorme a sondagem inteira.
    await new Promise((resolver) => setTimeout(resolver, 1_500))

    const id = await bancada.enfileirar(ESCOLA_A)
    await expect.poll(() => logDespachante.doEvento('job.publicado').map((registro) => registro['jobId']), { timeout: 5_000 }).toEqual([id])
  })

  it('despachante que caiu entre publicar e marcar: o job é publicado de novo com o mesmo id e ainda roda uma vez só', async () => {
    const id = await bancada.enfileirar(ESCOLA_A)
    // Primeiro despachante: reserva e publica, e cai antes de marcar `publicado`.
    await bancada.despacho.reservar(10)
    await bancada.fila.add('sintetico', { escolaId: ESCOLA_A, requisicaoId: null }, { ...OPCOES_DE_JOB_PUBLICADO, jobId: id })
    await bancada.pool.query(`update job_registro set reservado_ate = now() - interval '1 second' where id = $1`, [id])

    const logDespachante = new LogEmMemoria('despachante')
    bancada.despachante(logDespachante).despachante.iniciar()
    await expect.poll(() => logDespachante.doEvento('job.publicado').map((registro) => registro['jobId']), { timeout: 5_000 }).toEqual([id])
    expect((await bancada.estado(id))?.estado).toBe('publicado')

    const logWorker = new LogEmMemoria('worker')
    bancada.worker(logWorker)
    await aguardarEstado(bancada, id, 'concluido')
    await new Promise((resolver) => setTimeout(resolver, 1_000))
    expect(logWorker.doEvento('job.iniciado').filter((registro) => registro['jobId'] === id)).toHaveLength(1)
    expect(await bancada.fila.getJobCounts('completed', 'waiting', 'active', 'delayed', 'failed')).toEqual({ completed: 1, waiting: 0, active: 0, delayed: 0, failed: 0 })
  })
})
