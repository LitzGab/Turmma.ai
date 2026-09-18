import { ErroDeDominio, METRICAS } from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MedidorDeTeste } from '../../../../../tools/testes/metricas.ts'
import { baldeDaEquipe, baldeDaEscola, baldeDaEscolaDesconhecida, type BaldeDeLogin } from './baldes-de-login.js'
import { ESPERA_MAXIMA_PELO_HASH_MS, MAXIMO_ESPERANDO, RETRY_AFTER_MAXIMO_S, RETRY_AFTER_MINIMO_S, SemaforoDeHash } from './semaforo-de-hash.js'

const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
const ESCOLA_B = '0190f5a0-0000-7000-8000-00000000000b'
const IP_DA_ESCOLA = '203.0.113.10'
const IP_DE_FORA = '198.51.100.20'

/** Uma tarefa que só termina quando o teste manda: segura a vez no semáforo pelo tempo que o teste quiser. */
function tarefaSegura(): { tarefa: () => Promise<void>; soltar: () => void } {
  let soltar: () => void = () => undefined
  const liberada = new Promise<void>((resolver) => (soltar = resolver))
  return { tarefa: () => liberada, soltar }
}

/** Deixa rodar tudo que já está na fila de microtarefas e de I/O: as vezes que o semáforo passou adiante. */
async function escoar(): Promise<void> {
  for (let volta = 0; volta < 5; volta++) await new Promise((resolver) => setImmediate(resolver))
}

let medidor: MedidorDeTeste

beforeEach(() => {
  medidor = new MedidorDeTeste()
})

afterEach(async () => {
  vi.useRealTimers()
  await medidor.encerrar()
})

describe('SemaforoDeHash: rodízio entre escolas e, na equipe, entre IPs', () => {
  it('uma escola não degrada outra: com 3.000 pedidos da A na fila, o primeiro pedido da B é o próximo atendido depois do que está em andamento', async () => {
    const semaforo = new SemaforoDeHash(1, medidor.medidor)
    const atendidos: string[] = []
    const emAndamento = tarefaSegura()
    const primeiro = semaforo.executar(baldeDaEscola(ESCOLA_A), emAndamento.tarefa)
    const daA = Array.from({ length: 3_000 }, (_, posicao) =>
      semaforo.executar(baldeDaEscola(ESCOLA_A), () => {
        atendidos.push(`A${String(posicao)}`)
        return Promise.resolve()
      }),
    )
    const daB = semaforo.executar(baldeDaEscola(ESCOLA_B), () => {
      atendidos.push('B')
      return Promise.resolve()
    })
    expect(semaforo.esperando).toBe(3_001)
    expect(atendidos).toEqual([])

    emAndamento.soltar()
    await Promise.all([primeiro, daB, ...daA])
    // A vez que abriu foi para o balde seguinte na roda, a B, e não para o pedido mais antigo, que era da A.
    expect(atendidos[0]).toBe('B')
    // E a A foi atendida inteira, na ordem de chegada dela: o rodízio atrasa a A em um pedido, não a descarta.
    expect(atendidos.slice(1)).toEqual(Array.from({ length: 3_000 }, (_, posicao) => `A${String(posicao)}`))
    expect(semaforo.emUso).toBe(0)
    expect(semaforo.esperando).toBe(0)
  })

  it('ataque de um IP não toma o balde da equipe: 100 pedidos de um IP e 1 de outro, e o de outro IP é o próximo atendido depois do que está em andamento, antes dos outros 99', async () => {
    const semaforo = new SemaforoDeHash(1, medidor.medidor)
    const atendidos: string[] = []
    const emAndamento = tarefaSegura()
    const primeiro = semaforo.executar(baldeDaEquipe(IP_DA_ESCOLA), emAndamento.tarefa)
    atendidos.push(IP_DA_ESCOLA)
    const doMesmoIp = Array.from({ length: 99 }, () =>
      semaforo.executar(baldeDaEquipe(IP_DA_ESCOLA), () => {
        atendidos.push(IP_DA_ESCOLA)
        return Promise.resolve()
      }),
    )
    const deOutroIp = semaforo.executar(baldeDaEquipe(IP_DE_FORA), () => {
      atendidos.push(IP_DE_FORA)
      return Promise.resolve()
    })

    emAndamento.soltar()
    await Promise.all([primeiro, deOutroIp, ...doMesmoIp])
    expect(atendidos).toHaveLength(101)
    // A roda passa pela subfila de cada IP: o primeiro IP já teve a vez (o pedido em andamento), e a próxima é do outro.
    expect(atendidos.indexOf(IP_DE_FORA)).toBe(1)
    expect(atendidos.slice(2).every((ip) => ip === IP_DA_ESCOLA)).toBe(true)
    expect(atendidos.slice(2)).toHaveLength(99)
  })

  it('baldes de escola não têm subfila por IP, e o endereço que não existe tem um balde só, na mesma roda', async () => {
    const semaforo = new SemaforoDeHash(1, medidor.medidor)
    const atendidos: string[] = []
    const emAndamento = tarefaSegura()
    const pedido = (balde: BaldeDeLogin, nome: string) =>
      semaforo.executar(balde, () => {
        atendidos.push(nome)
        return Promise.resolve()
      })
    const primeiro = semaforo.executar(baldeDaEscola(ESCOLA_A), emAndamento.tarefa)
    const pedidos = [pedido(baldeDaEscolaDesconhecida(), 'desconhecida-1'), pedido(baldeDaEscolaDesconhecida(), 'desconhecida-2'), pedido(baldeDaEscola(ESCOLA_A), 'A'), pedido(baldeDaEquipe(IP_DA_ESCOLA), 'equipe')]
    emAndamento.soltar()
    await Promise.all([primeiro, ...pedidos])
    // A, com o pedido em andamento, é a última da roda; desconhecida e equipe, nunca atendidas, vão na ordem de chegada.
    expect(atendidos).toEqual(['desconhecida-1', 'equipe', 'A', 'desconhecida-2'])
  })

  it('ataque de muitos IPs ao balde da equipe: o IP que chega novo a cada pedido entra atrás de quem já esperava, e não na frente', async () => {
    const semaforo = new SemaforoDeHash(1, medidor.medidor)
    const atendidos: string[] = []
    const emAndamento = tarefaSegura()
    const pedido = (ip: string) =>
      semaforo.executar(baldeDaEquipe(ip), () => {
        atendidos.push(ip)
        return Promise.resolve()
      })
    // A professora já entrou uma vez hoje (a vez dela ficou para trás na roda), e agora outro IP está com o hash.
    await pedido(IP_DA_ESCOLA)
    atendidos.length = 0
    const primeiro = semaforo.executar(baldeDaEquipe('192.0.2.1'), emAndamento.tarefa)
    const daProfessora = pedido(IP_DA_ESCOLA)
    // Cinquenta IPs novos chegando depois dela, cada um com um pedido: nenhum passa na frente. Se o IP nunca visto
    // entrasse na roda como o mais antigo de todos, os cinquenta passariam na frente de quem já tinha sido atendido.
    const doAtaque = Array.from({ length: 50 }, (_, posicao) => pedido(`198.18.0.${String(posicao + 1)}`))
    emAndamento.soltar()
    await Promise.all([primeiro, daProfessora, ...doAtaque])
    expect(atendidos[0]).toBe(IP_DA_ESCOLA)
    expect(atendidos).toHaveLength(51)
  })
})

describe('SemaforoDeHash: teto de concorrência', () => {
  it('nunca roda mais tarefas que o teto ao mesmo tempo, e as que esperam entram conforme as de antes terminam', async () => {
    const semaforo = new SemaforoDeHash(3, medidor.medidor)
    let rodando = 0
    let maximo = 0
    const seguras = Array.from({ length: 10 }, () => tarefaSegura())
    const execucoes = seguras.map((segura, posicao) =>
      semaforo.executar(baldeDaEscola(posicao % 2 === 0 ? ESCOLA_A : ESCOLA_B), async () => {
        rodando++
        maximo = Math.max(maximo, rodando)
        await segura.tarefa()
        rodando--
      }),
    )
    await escoar()
    expect([rodando, semaforo.emUso, semaforo.esperando]).toEqual([3, 3, 7])
    for (const segura of seguras) {
      segura.soltar()
      await escoar()
      expect(rodando).toBeLessThanOrEqual(3)
    }
    await Promise.all(execucoes)
    expect(maximo).toBe(3)
    expect([semaforo.emUso, semaforo.esperando]).toEqual([0, 0])
  })

  it('a tarefa que falha devolve a vez: o erro dela sobe, e o pedido seguinte entra', async () => {
    const semaforo = new SemaforoDeHash(1, medidor.medidor)
    const falha = new Error('argon2 quebrou')
    await expect(semaforo.executar(baldeDaEscola(ESCOLA_A), () => Promise.reject(falha))).rejects.toBe(falha)
    expect(semaforo.emUso).toBe(0)
    await expect(semaforo.executar(baldeDaEscola(ESCOLA_A), () => Promise.resolve('entrou'))).resolves.toBe('entrou')
  })

  it('concorrência que não é inteiro positivo não constrói o semáforo', () => {
    for (const concorrencia of [0, -1, 1.5, Number.NaN]) expect(() => new SemaforoDeHash(concorrencia, medidor.medidor), String(concorrencia)).toThrow(RangeError)
  })
})

describe('SemaforoDeHash: prazo de 2 s', () => {
  it('borda: quem espera mais de 2 s sai com 503 INDISPONIVEL_TENTE_DE_NOVO e Retry-After entre 2 e 6, sem a tarefa rodar; e sai da fila', async () => {
    vi.useFakeTimers()
    const semaforo = new SemaforoDeHash(1, medidor.medidor)
    const emAndamento = tarefaSegura()
    const primeiro = semaforo.executar(baldeDaEscola(ESCOLA_A), emAndamento.tarefa)
    const tarefa = vi.fn(() => Promise.resolve())
    let resultado: unknown = 'esperando'
    const segundo = semaforo.executar(baldeDaEscola(ESCOLA_B), tarefa).then(
      () => (resultado = 'entrou'),
      (erro: unknown) => (resultado = erro),
    )

    // Relógio simulado: um milissegundo antes do prazo ainda espera; no prazo, sai.
    await vi.advanceTimersByTimeAsync(ESPERA_MAXIMA_PELO_HASH_MS - 1)
    expect(resultado).toBe('esperando')
    await vi.advanceTimersByTimeAsync(1)
    await segundo
    expect(resultado).toBeInstanceOf(ErroDeDominio)
    const erro = resultado as ErroDeDominio
    expect([erro.codigo, erro.status]).toEqual([CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO, 503])
    expect(erro.tenteDeNovoEmSegundos).toBeGreaterThanOrEqual(RETRY_AFTER_MINIMO_S)
    expect(erro.tenteDeNovoEmSegundos).toBeLessThanOrEqual(RETRY_AFTER_MAXIMO_S)
    expect(tarefa).not.toHaveBeenCalled()
    expect(semaforo.esperando).toBe(0)
    expect(await medidor.pontos(METRICAS.hashRecusado)).toEqual([{ atributos: {}, valor: 1 }])

    // A vez que abre depois não vai para quem já desistiu: fica livre.
    emAndamento.soltar()
    await primeiro
    expect(semaforo.emUso).toBe(0)
    expect(tarefa).not.toHaveBeenCalled()
  })

  it('o Retry-After é sorteado entre 2 e 6 s, inteiro, e varia: a rajada que volta não volta toda no mesmo segundo', async () => {
    vi.useFakeTimers()
    const semaforo = new SemaforoDeHash(1, medidor.medidor)
    const emAndamento = tarefaSegura()
    const primeiro = semaforo.executar(baldeDaEscola(ESCOLA_A), emAndamento.tarefa)
    const recusas = Array.from({ length: 200 }, () =>
      semaforo.executar(baldeDaEscola(ESCOLA_A), () => Promise.resolve()).then(
        () => undefined,
        (erro: unknown) => (erro as ErroDeDominio).tenteDeNovoEmSegundos,
      ),
    )
    await vi.advanceTimersByTimeAsync(ESPERA_MAXIMA_PELO_HASH_MS)
    const esperas = await Promise.all(recusas)
    expect(esperas.every((segundos) => Number.isInteger(segundos) && segundos !== undefined && segundos >= RETRY_AFTER_MINIMO_S && segundos <= RETRY_AFTER_MAXIMO_S)).toBe(true)
    expect(new Set(esperas).size).toBeGreaterThan(1)
    emAndamento.soltar()
    await primeiro
  })

  it('carga: acima de 10.000 esperando, o pedido novo sai na hora com o mesmo 503, e a fila não cresce', async () => {
    vi.useFakeTimers()
    const semaforo = new SemaforoDeHash(1, medidor.medidor)
    const emAndamento = tarefaSegura()
    const primeiro = semaforo.executar(baldeDaEscola(ESCOLA_A), emAndamento.tarefa)
    const esperando = Array.from({ length: MAXIMO_ESPERANDO }, () => semaforo.executar(baldeDaEscola(ESCOLA_A), () => Promise.resolve()).catch(() => undefined))
    expect(semaforo.esperando).toBe(MAXIMO_ESPERANDO)
    const tarefa = vi.fn(() => Promise.resolve())
    const excedente = semaforo.executar(baldeDaEscola(ESCOLA_B), tarefa)
    await expect(excedente).rejects.toMatchObject({ codigo: CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO, status: 503 })
    expect(tarefa).not.toHaveBeenCalled()
    expect(semaforo.esperando).toBe(MAXIMO_ESPERANDO)
    await vi.advanceTimersByTimeAsync(ESPERA_MAXIMA_PELO_HASH_MS)
    await Promise.all(esperando)
    emAndamento.soltar()
    await primeiro
  })
})

describe('SemaforoDeHash: métricas', () => {
  it('login.hash_espera leva só o rótulo do balde (a escola, `equipe` ou `desconhecida`), nunca o IP; login.hash_recusado nasce em 0', async () => {
    const semaforo = new SemaforoDeHash(2, medidor.medidor)
    expect(await medidor.pontos(METRICAS.hashRecusado)).toEqual([{ atributos: {}, valor: 0 }])
    for (const balde of [baldeDaEscola(ESCOLA_A), baldeDaEscola(ESCOLA_B), baldeDaEquipe(IP_DA_ESCOLA), baldeDaEquipe(IP_DE_FORA), baldeDaEscolaDesconhecida()]) {
      await semaforo.executar(balde, () => Promise.resolve())
    }
    const pontos = await medidor.pontos(METRICAS.esperaPeloHash)
    expect(pontos.map(({ atributos }) => atributos)).toEqual([{ escola_id: ESCOLA_A }, { escola_id: ESCOLA_B }, { escola_id: 'equipe' }, { escola_id: 'desconhecida' }])
    expect(pontos.find(({ atributos }) => atributos['escola_id'] === 'equipe')?.valor).toMatchObject({ contagem: 2 })
    expect(JSON.stringify(await medidor.atributosDeTodas())).not.toMatch(new RegExp(`${IP_DA_ESCOLA}|${IP_DE_FORA}`.replaceAll('.', '\\.')))
  })
})
