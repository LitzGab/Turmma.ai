import 'reflect-metadata'
import { DeleteObjectsCommand, PutObjectCommand, type S3Client } from '@aws-sdk/client-s3'
import { ContadorDeUso, executarNoContexto, UsoRepository, type UsoDoPeriodo } from '@educa/nucleo'
import { Queue } from 'bullmq'
import { randomUUID } from 'node:crypto'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../../tools/ci/compose.ts'
import { compose, PROCESSOS_DA_FILA } from '../../../tools/testes/compose.ts'
import { AGENDAMENTOS, criarDisparoDeAgendamento, FILA_DOS_AGENDAMENTOS, FUSO_DOS_AGENDAMENTOS, registrarAgendamentos } from '../src/agendamentos.js'
import type { ConfiguracaoStorage } from '../src/config.js'
import { montarWorker, type WorkerMontado } from '../src/montagem.js'
import { criarConsolidacaoDeUso, TIPO_CONSOLIDAR_USO } from '../src/processadores/consolidar-uso.js'
import { TIPO_EXPURGAR_JOBS } from '../src/processadores/expurgar-jobs.js'
import { criarClienteS3, MedidorDeStorage } from '../src/storage/medidor-de-storage.js'
import { BancadaDeFila, configuracaoDoBanco, LogEmMemoria, urlRedisDeFila, vagasPadraoDoAmbiente } from './fila-de-teste.js'

// Contadores no Redis de fila, `uso_infra_diario` no Postgres e bytes no storage, todos do compose de
// teste. Só o relógio é falso: é ele que marca às 23h59 de 31/12 e consolida às 2h do dia seguinte.

const ambiente = lerAmbienteDeTeste()
const STORAGE: ConfiguracaoStorage = {
  url: `http://127.0.0.1:${valorObrigatorio(ambiente, 'STORAGE_PORTA_HOST')}`,
  regiao: valorObrigatorio(ambiente, 'STORAGE_REGIAO'),
  bucket: valorObrigatorio(ambiente, 'STORAGE_BUCKET'),
  chaveAcesso: valorObrigatorio(ambiente, 'STORAGE_CHAVE_ACESSO'),
  chaveSecreta: valorObrigatorio(ambiente, 'STORAGE_CHAVE_SECRETA'),
}

const TERCA_10H = new Date('2026-09-15T10:00:00-03:00')
const QUARTA_2H = new Date('2026-09-16T02:00:00-03:00')
const SEM_USO: UsoDoPeriodo = { requisicoes: 0, jobs: 0, bytesStorage: 0 }

beforeAll(() => {
  // Despachante ou worker do compose de pé disputaria as linhas com os deste arquivo.
  compose('stop', ...PROCESSOS_DA_FILA)
})

describe('uso por escola: contagem, consolidação e bytes', () => {
  let bancada: BancadaDeFila
  let agora: Date
  const relogio = { agora: () => agora }
  let contador: ContadorDeUso
  let repositorio: UsoRepository
  let s3: S3Client
  const escolasDoTeste: string[] = []
  const objetosDoTeste: string[] = []
  const montados: WorkerMontado[] = []
  const log = new LogEmMemoria('worker-teste')

  const novaEscola = () => {
    const escolaId = randomUUID()
    escolasDoTeste.push(escolaId)
    return escolaId
  }

  /** Marca como a API marca: dentro do contexto da escola do token. */
  const marcarRequisicoes = (escolaId: string, quantidade: number) =>
    executarNoContexto({ requisicaoId: randomUUID(), escolaId }, () => {
      for (let indice = 0; indice < quantidade; indice++) contador.marcar('req')
    })

  /** O incremento sai sem espera: a leitura espera ele chegar. */
  const aguardarContador = (escolaId: string, dia: string, metrica: 'req' | 'jobs', valor: number) =>
    expect.poll(() => bancada.redis.get(`${bancada.prefixo}:uso:${dia}:${escolaId}:${metrica}`), { timeout: 5_000, interval: 50 }).toBe(String(valor))

  const consolidacao = () =>
    criarConsolidacaoDeUso({ contador, repositorio, storage: new MedidorDeStorage(s3, STORAGE.bucket), relogio, logger: log.logger })

  /** Roda como o worker roda um job `sistema.*`: no contexto da rotina do sistema, sem escola. */
  const consolidar = (processador = consolidacao()) => executarNoContexto({ requisicaoId: randomUUID(), rotinaDoSistema: true }, () => processador({}))

  const usoDoDia = (escolaId: string, dia: string) => executarNoContexto({ requisicaoId: randomUUID(), escolaId }, () => repositorio.doDia(dia))
  const usoDoMes = (escolaId: string, mes: string) => executarNoContexto({ requisicaoId: randomUUID(), escolaId }, () => repositorio.doMes(mes))

  const guardar = async (chave: string, bytes: number) => {
    objetosDoTeste.push(chave)
    await s3.send(new PutObjectCommand({ Bucket: STORAGE.bucket, Key: chave, Body: Buffer.alloc(bytes, 1) }))
  }

  beforeEach(async () => {
    bancada = new BancadaDeFila()
    await bancada.limparRegistro()
    agora = TERCA_10H
    contador = new ContadorDeUso(bancada.redis, { relogio, prefixo: bancada.prefixo })
    repositorio = new UsoRepository(bancada.banco)
    s3 = criarClienteS3(STORAGE)
    log.linhas.length = 0
  })

  afterEach(async () => {
    await Promise.all(montados.splice(0).map((montado) => montado.encerrar()))
    if (objetosDoTeste.length > 0) {
      await s3.send(new DeleteObjectsCommand({ Bucket: STORAGE.bucket, Delete: { Objects: objetosDoTeste.splice(0).map((Key) => ({ Key })) } }))
    }
    await bancada.pool.query('delete from uso_infra_diario where escola_id = any($1::uuid[])', [escolasDoTeste.splice(0)])
    const chaves = await bancada.redis.keys(`${bancada.prefixo}:*`)
    if (chaves.length > 0) await bancada.redis.del(...chaves)
    s3.destroy()
    await bancada.fechar()
  }, 60_000)

  it('caminho feliz: N requisições e M jobs da escola A, executados pelo worker de verdade, aparecem no dia e no mês', async () => {
    const [escolaA, escolaB] = [novaEscola(), novaEscola()]
    marcarRequisicoes(escolaA, 5)
    const worker = montarWorker({ banco: configuracaoDoBanco(), redisFilaUrl: urlRedisDeFila(), pools: { interativa: 3 }, vagasPadrao: vagasPadraoDoAmbiente(), threadsMaximo: 1 }, log.logger, {
      prefixo: bancada.prefixo,
      relogio,
    })
    montados.push(worker)
    bancada.despachante(log, { relogio }).iniciar()
    const jobs = await Promise.all([1, 2, 3].map(() => bancada.enfileirar(escolaA)))
    await expect.poll(async () => Promise.all(jobs.map(async (id) => (await bancada.estado(id))?.estado)), { timeout: 20_000, interval: 100 }).toEqual([
      'concluido',
      'concluido',
      'concluido',
    ])
    await aguardarContador(escolaA, '2026-09-15', 'req', 5)
    await aguardarContador(escolaA, '2026-09-15', 'jobs', 3)

    agora = QUARTA_2H
    await consolidar()

    expect(await usoDoDia(escolaA, '2026-09-15')).toEqual({ requisicoes: 5, jobs: 3, bytesStorage: 0 })
    expect(await usoDoMes(escolaA, '2026-09')).toEqual({ requisicoes: 5, jobs: 3, bytesStorage: 0 })
    // Isolamento: a chave leva a escola, e nada de A soma na B.
    expect(await usoDoDia(escolaB, '2026-09-15')).toEqual(SEM_USO)
    expect(await usoDoMes(escolaB, '2026-09')).toEqual(SEM_USO)
    // Depois de gravado, o contador sai do Redis.
    expect(await bancada.redis.keys(`${bancada.prefixo}:uso:*`)).toEqual([])
  })

  it('isolamento: duas escolas no mesmo dia, cada uma com a própria contagem, e a consulta de uma não enxerga a outra', async () => {
    const [escolaA, escolaB] = [novaEscola(), novaEscola()]
    marcarRequisicoes(escolaA, 4)
    marcarRequisicoes(escolaB, 9)
    await aguardarContador(escolaA, '2026-09-15', 'req', 4)
    await aguardarContador(escolaB, '2026-09-15', 'req', 9)
    agora = QUARTA_2H
    await consolidar()
    expect((await usoDoDia(escolaA, '2026-09-15')).requisicoes).toBe(4)
    expect((await usoDoDia(escolaB, '2026-09-15')).requisicoes).toBe(9)
    expect((await usoDoMes(escolaA, '2026-09')).requisicoes).toBe(4)
  })

  it('concorrência: duas consolidações em paralelo, e uma terceira depois, não dobram o valor', async () => {
    const escolaA = novaEscola()
    marcarRequisicoes(escolaA, 7)
    await aguardarContador(escolaA, '2026-09-15', 'req', 7)
    agora = QUARTA_2H
    const processador = consolidacao()
    await Promise.all([consolidar(processador), consolidar(processador)])
    expect(await usoDoDia(escolaA, '2026-09-15')).toEqual({ requisicoes: 7, jobs: 0, bytesStorage: 0 })
    await consolidar(processador)
    expect((await usoDoMes(escolaA, '2026-09')).requisicoes).toBe(7)
  })

  it('reexecução depois de gravar e antes de apagar (worker morto): regrava o mesmo valor, sem somar', async () => {
    const escolaA = novaEscola()
    marcarRequisicoes(escolaA, 6)
    await aguardarContador(escolaA, '2026-09-15', 'req', 6)
    agora = QUARTA_2H
    // A primeira execução grava e morre antes do DEL.
    const morreAntesDeApagar = criarConsolidacaoDeUso({
      contador: {
        lerDiasFechados: (hoje) => contador.lerDiasFechados(hoje),
        apagarConsolidado: () => Promise.reject(new Error('worker morto')),
      },
      repositorio,
      storage: new MedidorDeStorage(s3, STORAGE.bucket),
      relogio,
      logger: log.logger,
    })
    await expect(consolidar(morreAntesDeApagar)).rejects.toThrow('worker morto')
    expect((await usoDoDia(escolaA, '2026-09-15')).requisicoes).toBe(6)
    await consolidar()
    expect((await usoDoDia(escolaA, '2026-09-15')).requisicoes).toBe(6)
    expect(await bancada.redis.keys(`${bancada.prefixo}:uso:*`)).toEqual([])
  })

  it('incremento que chega entre a leitura e a remoção não se perde: a chave fica, e a próxima consolidação grava o valor novo', async () => {
    const escolaA = novaEscola()
    marcarRequisicoes(escolaA, 2)
    await aguardarContador(escolaA, '2026-09-15', 'req', 2)
    await executarNoContexto({ requisicaoId: randomUUID(), escolaId: escolaA }, async () => {
      await bancada.redis.incr(`${bancada.prefixo}:uso:2026-09-15:${escolaA}:req`)
      // A consolidação leu 2; o contador já está em 3.
      expect(await contador.apagarConsolidado('2026-09-15', 'req', 2)).toBe(false)
    })
    agora = QUARTA_2H
    await consolidar()
    expect((await usoDoDia(escolaA, '2026-09-15')).requisicoes).toBe(3)
  })

  it('incremento atrasado que faz renascer a chave de um dia já consolidado não troca o total do dia pelo valor pequeno', async () => {
    const escolaA = novaEscola()
    marcarRequisicoes(escolaA, 6)
    await aguardarContador(escolaA, '2026-09-15', 'req', 6)
    agora = QUARTA_2H
    await consolidar()
    // Um cliente com relógio atrasado marca terça depois de a terça ter sido consolidada e apagada.
    agora = TERCA_10H
    marcarRequisicoes(escolaA, 1)
    await aguardarContador(escolaA, '2026-09-15', 'req', 1)
    agora = new Date('2026-09-17T02:00:00-03:00')
    await consolidar()
    expect((await usoDoDia(escolaA, '2026-09-15')).requisicoes).toBe(6)
  })

  it('borda: 23h59 e 00h01 de São Paulo caem em dias diferentes, 31/12 fecha dezembro, e o dia aberto não é consolidado', async () => {
    const escolaA = novaEscola()
    agora = new Date('2026-12-31T23:59:00-03:00')
    marcarRequisicoes(escolaA, 1)
    agora = new Date('2027-01-01T00:01:00-03:00')
    marcarRequisicoes(escolaA, 1)
    await aguardarContador(escolaA, '2026-12-31', 'req', 1)
    await aguardarContador(escolaA, '2027-01-01', 'req', 1)

    // 02h de 01/01 em São Paulo: dezembro fechou, 01/01 ainda está aberto (em UTC já seria 05h de 01/01).
    agora = new Date('2027-01-01T02:00:00-03:00')
    await consolidar()
    expect((await usoDoMes(escolaA, '2026-12')).requisicoes).toBe(1)
    expect((await usoDoDia(escolaA, '2026-12-31')).requisicoes).toBe(1)
    expect((await usoDoMes(escolaA, '2027-01')).requisicoes).toBe(0)
    expect(await bancada.redis.get(`${bancada.prefixo}:uso:2027-01-01:${escolaA}:req`)).toBe('1')

    agora = new Date('2027-01-02T02:00:00-03:00')
    await consolidar()
    expect((await usoDoMes(escolaA, '2027-01')).requisicoes).toBe(1)
    expect((await usoDoMes(escolaA, '2026-12')).requisicoes).toBe(1)
  })

  it('borda: os bytes de escolas/{a}/ não somam escolas/{a}x/, e os de B ficam na B, no dia que fechou', async () => {
    const [escolaA, escolaB] = [novaEscola(), novaEscola()]
    await guardar(`escolas/${escolaA}/apostila.pdf`, 100)
    await guardar(`escolas/${escolaA}/provas/2026/p1.png`, 50)
    await guardar(`escolas/${escolaA}x/intruso.pdf`, 1_000)
    await guardar(`escolas/${escolaB}/apostila.pdf`, 7)

    agora = QUARTA_2H
    await consolidar()
    expect(await usoDoDia(escolaA, '2026-09-15')).toEqual({ requisicoes: 0, jobs: 0, bytesStorage: 150 })
    expect((await usoDoDia(escolaB, '2026-09-15')).bytesStorage).toBe(7)
    // Os bytes do mês são o pico medido, e não a soma dos dias.
    agora = new Date('2026-09-17T02:00:00-03:00')
    await consolidar()
    expect((await usoDoMes(escolaA, '2026-09')).bytesStorage).toBe(150)
    // A medição não apaga a contagem já gravada no mesmo dia.
    marcarRequisicoes(escolaA, 3)
    await aguardarContador(escolaA, '2026-09-17', 'req', 3)
    agora = new Date('2026-09-18T02:00:00-03:00')
    await consolidar()
    expect(await usoDoDia(escolaA, '2026-09-17')).toEqual({ requisicoes: 3, jobs: 0, bytesStorage: 150 })
    // Nem a contagem gravada depois da medição (um job atrasado do dia 17) apaga os bytes dele.
    agora = new Date('2026-09-17T23:00:00-03:00')
    await executarNoContexto({ requisicaoId: randomUUID(), escolaId: escolaA }, async () => contador.marcar('jobs'))
    await aguardarContador(escolaA, '2026-09-17', 'jobs', 1)
    agora = new Date('2026-09-19T02:00:00-03:00')
    await consolidar()
    expect(await usoDoDia(escolaA, '2026-09-17')).toEqual({ requisicoes: 3, jobs: 1, bytesStorage: 150 })
  })

  it('só a rotina do sistema consolida: um job de escola com o tipo da consolidação falha sem tocar em nada', async () => {
    const escolaA = novaEscola()
    marcarRequisicoes(escolaA, 2)
    await aguardarContador(escolaA, '2026-09-15', 'req', 2)
    agora = QUARTA_2H
    await expect(executarNoContexto({ requisicaoId: randomUUID(), escolaId: escolaA }, () => consolidacao()({}))).rejects.toThrow()
    expect(await usoDoDia(escolaA, '2026-09-15')).toEqual(SEM_USO)
  })

  describe('agendamento', () => {
    let fila: Queue

    beforeEach(() => {
      fila = new Queue(FILA_DOS_AGENDAMENTOS, { connection: bancada.redis, prefix: bancada.prefixo })
    })

    afterEach(async () => {
      await fila.obliterate({ force: true })
      await fila.close()
    })

    it('as rotinas são agendadas às 2h e às 3h30 de São Paulo, e registrar de novo (a outra réplica) não duplica o agendador', async () => {
      await registrarAgendamentos(fila)
      await registrarAgendamentos(fila)
      const agendadores = await fila.getJobSchedulers()
      expect(agendadores.map(({ key, pattern, tz }) => ({ key, pattern, tz })).sort((a, b) => a.key.localeCompare(b.key))).toEqual([
        { key: TIPO_CONSOLIDAR_USO, pattern: '0 2 * * *', tz: FUSO_DOS_AGENDAMENTOS },
        { key: TIPO_EXPURGAR_JOBS, pattern: '30 3 * * *', tz: FUSO_DOS_AGENDAMENTOS },
      ])
      const proximaConsolidacao = agendadores.find(({ key }) => key === TIPO_CONSOLIDAR_USO)?.next
      const horaEmSaoPaulo = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(new Date(proximaConsolidacao ?? 0))
      expect(horaEmSaoPaulo).toBe('02:00')
    })

    it('o disparo grava o job da rotina em job_registro pelo Enfileirador: lote, não urgente, sem escola, com requisição', async () => {
      const disparar = criarDisparoDeAgendamento(bancada.banco, bancada.enfileirador, log.logger)
      const jobId = await disparar({ name: TIPO_CONSOLIDAR_USO })
      const { rows } = await bancada.pool.query<Record<string, unknown>>(
        'select tipo, fila, nao_urgente as "naoUrgente", escola_id as "escolaId", requisicao_id is not null as "comRequisicao", estado from job_registro where id = $1',
        [jobId],
      )
      expect(rows).toEqual([{ tipo: TIPO_CONSOLIDAR_USO, fila: 'lote', naoUrgente: true, escolaId: null, comRequisicao: true, estado: 'aguardando' }])
      await expect(disparar({ name: 'sistema.qualquer-coisa' })).rejects.toThrow('agendamento desconhecido')
      expect((await bancada.pool.query('select 1 from job_registro')).rowCount).toBe(1)
    })

    it('trilha completa: disparo na fila de agendamentos → job_registro → despachante → worker de lote → uso consolidado e job concluido', async () => {
      const escolaA = novaEscola()
      marcarRequisicoes(escolaA, 8)
      await aguardarContador(escolaA, '2026-09-15', 'req', 8)
      agora = QUARTA_2H
      const worker = montarWorker(
        { banco: configuracaoDoBanco(), redisFilaUrl: urlRedisDeFila(), pools: { lote: 2 }, vagasPadrao: vagasPadraoDoAmbiente(), threadsMaximo: 1, storage: STORAGE },
        log.logger,
        { prefixo: bancada.prefixo, relogio, agendamentos: AGENDAMENTOS },
      )
      montados.push(worker)
      expect(worker.agendamentos).toBeDefined()
      bancada.despachante(log, { relogio }).iniciar()

      await fila.add(TIPO_CONSOLIDAR_USO, {})
      await expect.poll(() => usoDoDia(escolaA, '2026-09-15'), { timeout: 20_000, interval: 100 }).toEqual({ requisicoes: 8, jobs: 0, bytesStorage: 0 })
      await expect
        .poll(async () => (await bancada.pool.query<{ estado: string }>("select estado from job_registro where tipo = 'sistema.consolidar-uso'")).rows.map(({ estado }) => estado), {
          timeout: 20_000,
          interval: 100,
        })
        .toEqual(['concluido'])
    })
  })
})
