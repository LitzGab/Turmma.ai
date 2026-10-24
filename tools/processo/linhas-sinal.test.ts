import type * as ChildProcess from 'node:child_process'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it, vi } from 'vitest'

// O `spawn` de verdade, com um espião na frente: quando o filho nasce, quantos ouvintes de sinal de fim o encontro já tinha?
// `sinalLogoDepois` manda o sinal no instante em que o `spawn` volta, que é a janela da corrida; `lancar` faz o `spawn` lançar.
const estado = vi.hoisted(() => ({ ouvintesNoNascimento: [] as number[][], sinalLogoDepois: null as 'SIGHUP' | null, lancar: false }))
const SINAIS = ['SIGINT', 'SIGTERM', 'SIGHUP'] as const

vi.mock('node:child_process', async (importarOriginal) => {
  const original = await importarOriginal<typeof ChildProcess>()
  return {
    ...original,
    spawn: ((...argumentos: Parameters<typeof original.spawn>) => {
      estado.ouvintesNoNascimento.push(SINAIS.map((sinal) => process.listenerCount(sinal)))
      if (estado.lancar) throw new Error('spawn lançou')
      const filho = original.spawn(...argumentos)
      // `process.emit` e não `process.kill`: sem ouvinte, o sinal de verdade derrubaria o worker do Vitest.
      if (estado.sinalLogoDepois !== null) process.emit(estado.sinalLogoDepois)
      return filho
    }) as typeof original.spawn,
  }
})

const { rodarEmGrupo } = await import('./linhas.ts')

const ouvintes = () => SINAIS.map((sinal) => process.listenerCount(sinal))

describe('rodarEmGrupo: o sinal de fim que chega logo depois de a verificação nascer', () => {
  afterEach(() => {
    estado.ouvintesNoNascimento.length = 0
    estado.sinalLogoDepois = null
    estado.lancar = false
  })

  // O neto da verificação escreve o arquivo-sinal em poucos ms, e quem o lê manda o sinal. Se o ouvinte só sobe depois do
  // `spawn`, um encontro tirado da CPU nesse intervalo morre pela ação padrão do sinal: a verificação segue viva, e o
  // merge não é desfeito. A janela é de microssegundos e só o sistema operacional a abre; os casos provam a ordem e o efeito.

  it('os ouvintes de SIGINT, SIGTERM e SIGHUP já estão de pé quando o filho nasce, e saem quando ele acaba', async () => {
    const antes = ouvintes()
    const veredito = await rodarEmGrupo(tmpdir(), 'true', 5_000, 400)
    expect(veredito).toBe('passou')
    expect(estado.ouvintesNoNascimento).toEqual([antes.map((quantos) => quantos + 1)])
    expect(ouvintes()).toEqual(antes)
  })

  it('o SIGHUP que chega no instante em que o spawn volta é ouvido: a verificação é interrompida, e não segue até o fim', async () => {
    const antes = ouvintes()
    estado.sinalLogoDepois = 'SIGHUP'
    const veredito = await rodarEmGrupo(tmpdir(), 'sleep 2', 60_000, 400)
    expect(veredito).toBe('interrompida')
    expect(ouvintes()).toEqual(antes)
  })

  it('o spawn que lança não deixa ouvinte de sinal nem relógio para trás', async () => {
    const antes = ouvintes()
    vi.useFakeTimers()
    try {
      estado.lancar = true
      await expect(rodarEmGrupo(tmpdir(), 'true', 5_000, 400)).rejects.toThrow('spawn lançou')
      expect(ouvintes()).toEqual(antes)
      expect(vi.getTimerCount()).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })
})
