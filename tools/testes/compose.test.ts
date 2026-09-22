import { afterEach, describe, expect, it, vi } from 'vitest'
import { recriarDoZero, type ResultadoComando } from './compose.ts'

// O laço de `recriarDoZero` contra um compose falso. É o que prova as duas metades que o Docker de
// verdade não mostraria sem quebrar um serviço de propósito: a nova tentativa vale **só** para o erro
// do bind, e as voltas acabam. A corrida em si, com a porta presa de verdade, está em
// `tools/ci/compose.int.test.ts` (mock é para o que está fora — regra 40).

/** A saída do daemon no vermelho de 22/09/2026, copiada de uma execução. */
const SAIDA_DO_BIND =
  ' Container educa-teste-observabilidade-1 Starting \n' +
  'Error response from daemon: failed to set up container networking: driver failed programming external ' +
  'connectivity on endpoint educa-teste-observabilidade-1 (6fbfa801c928): failed to bind host port 127.0.0.1:59100/tcp: address already in use\n'

const OK: ResultadoComando = { codigo: 0, saida: '' }
const PORTA_PRESA: ResultadoComando = { codigo: 1, saida: SAIDA_DO_BIND }

const REMOVER = ['rm', '--force', '--stop', 'observabilidade']
const SUBIR = ['up', '--detach', '--wait', 'observabilidade']

/**
 * Compose falso que devolve as respostas na ordem em que os comandos saem, e recusa comando a mais:
 * volta que não deveria existir vira erro no lugar de resposta silenciosa.
 */
function composeFalso(...respostas: ResultadoComando[]) {
  const chamadas: string[][] = []
  const fila = [...respostas]
  return {
    chamadas,
    executar: (...argumentos: string[]): Promise<ResultadoComando> => {
      chamadas.push(argumentos)
      const resposta = fila.shift()
      if (resposta === undefined) throw new Error(`comando a mais: docker compose ${argumentos.join(' ')}`)
      return Promise.resolve(resposta)
    },
  }
}

describe('recriarDoZero: o laço da porta publicada ocupada', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('repete enquanto a porta está ocupada, e remove antes de cada subida', async () => {
    const { chamadas, executar } = composeFalso(OK, PORTA_PRESA, OK, PORTA_PRESA, OK, OK)
    vi.useFakeTimers()

    const recriacao = recriarDoZero('observabilidade', executar).then(
      () => 'recriado',
      (erro: unknown) => erro,
    )
    await vi.advanceTimersByTimeAsync(5_000)

    expect(await recriacao).toBe('recriado')
    // O `rm` de cada volta é o que leva junto o contêiner que a tentativa anterior deixou em `created`:
    // sem ele, a subida seguinte esbarraria no próprio esqueleto da anterior.
    expect(chamadas).toEqual([REMOVER, SUBIR, REMOVER, SUBIR, REMOVER, SUBIR])
  })

  it('falha do `up` que não é a porta ocupada estoura na primeira tentativa', async () => {
    const quebrado: ResultadoComando = { codigo: 1, saida: 'container educa-teste-observabilidade-1 is unhealthy\n' }
    const { chamadas, executar } = composeFalso(OK, quebrado)

    const erro = await recriarDoZero('observabilidade', executar).catch((motivo: unknown) => motivo)

    expect(erro).toBeInstanceOf(Error)
    expect((erro as Error).message).toContain('falhou na tentativa 1')
    expect((erro as Error).message).toContain('is unhealthy')
    // Nenhuma volta: serviço quebrado custa ~2 min de healthcheck por subida, e o vermelho tem de sair agora.
    expect(chamadas).toEqual([REMOVER, SUBIR])
  })

  it('porta ocupada além do orçamento estoura na quinta volta, com a saída da última', async () => {
    const ultima: ResultadoComando = { codigo: 1, saida: `${SAIDA_DO_BIND}quinta tentativa\n` }
    const { chamadas, executar } = composeFalso(OK, PORTA_PRESA, OK, PORTA_PRESA, OK, PORTA_PRESA, OK, PORTA_PRESA, OK, ultima)
    vi.useFakeTimers()

    const recriacao = recriarDoZero('observabilidade', executar).catch((motivo: unknown) => motivo)
    await vi.advanceTimersByTimeAsync(10_000)

    const erro = await recriacao
    expect(erro).toBeInstanceOf(Error)
    expect((erro as Error).message).toContain('falhou na tentativa 5')
    expect((erro as Error).message).toContain('quinta tentativa')
    expect(chamadas).toHaveLength(10)
  })

  it('remoção que falha estoura sem tentar subir', async () => {
    const recusada: ResultadoComando = { codigo: 1, saida: 'Error response from daemon: cannot remove container\n' }
    const { chamadas, executar } = composeFalso(recusada)

    const erro = await recriarDoZero('observabilidade', executar).catch((motivo: unknown) => motivo)

    expect(erro).toBeInstanceOf(Error)
    expect((erro as Error).message).toContain('rm --force --stop observabilidade falhou')
    expect(chamadas).toEqual([REMOVER])
  })
})
