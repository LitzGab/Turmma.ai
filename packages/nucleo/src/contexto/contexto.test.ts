import { setTimeout as esperar } from 'node:timers/promises'
import { describe, expect, it } from 'vitest'
import { contextoAtual, definirIdentidadeNoContexto, executarNoContexto, resolverRequisicaoId } from './contexto.js'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

describe('resolverRequisicaoId', () => {
  it('aceita o UUID enviado pelo cliente, normalizado em minúsculas', () => {
    expect(resolverRequisicaoId('0F8B2C1E-5D7A-4E3B-9C6D-1A2B3C4D5E6F')).toBe('0f8b2c1e-5d7a-4e3b-9c6d-1a2b3c4d5e6f')
  })

  it.each([
    ['texto livre', 'Enzo Martins'],
    ['UUID com sobra', '0f8b2c1e-5d7a-4e3b-9c6d-1a2b3c4d5e6f", "escolaId": "outra'],
    ['quebra de linha', '0f8b2c1e-5d7a-4e3b-9c6d-1a2b3c4d5e6f\n{"level":"info"}'],
    ['vazio', ''],
  ])('troca %s por um UUID novo', (_caso, cabecalho) => {
    const id = resolverRequisicaoId(cabecalho)
    expect(id).toMatch(UUID)
    expect(id).not.toBe(cabecalho)
  })

  it('gera um id quando o cabeçalho falta ou vem repetido', () => {
    expect(resolverRequisicaoId(undefined)).toMatch(UUID)
    expect(resolverRequisicaoId(['0f8b2c1e-5d7a-4e3b-9c6d-1a2b3c4d5e6f', '1f8b2c1e-5d7a-4e3b-9c6d-1a2b3c4d5e6f'])).toMatch(UUID)
    expect(resolverRequisicaoId(undefined)).not.toBe(resolverRequisicaoId(undefined))
  })
})

describe('executarNoContexto', () => {
  it('mantém o contexto de cada execução separado através de await intercalados', async () => {
    const vistos = await Promise.all(
      Array.from({ length: 50 }, (_, indice) =>
        executarNoContexto({ requisicaoId: `r-${indice}`, escolaId: indice % 2 === 0 ? 'A' : 'B' }, async () => {
          await esperar((indice * 7) % 11)
          const antes = contextoAtual()
          await esperar((indice * 3) % 5)
          return { indice, antes, depois: contextoAtual() }
        }),
      ),
    )
    for (const { indice, antes, depois } of vistos) {
      const esperado = { requisicaoId: `r-${indice}`, escolaId: indice % 2 === 0 ? 'A' : 'B' }
      expect(antes).toEqual(esperado)
      expect(depois).toEqual(esperado)
    }
    expect(contextoAtual()).toBeUndefined()
  })
})

describe('definirIdentidadeNoContexto', () => {
  const identidadeA = { escolaId: 'escola-a', usuarioId: 'usuario-a' }

  it('grava a escola e o usuário no contexto da requisição', () => {
    executarNoContexto({ requisicaoId: 'r-1' }, () => {
      definirIdentidadeNoContexto(identidadeA)
      expect(contextoAtual()).toEqual({ requisicaoId: 'r-1', ...identidadeA })
    })
  })

  it('só grava uma vez: código que roda depois da autenticação não troca a escola', () => {
    executarNoContexto({ requisicaoId: 'r-2' }, () => {
      definirIdentidadeNoContexto(identidadeA)
      expect(() => definirIdentidadeNoContexto({ escolaId: 'escola-b', usuarioId: 'usuario-b' })).toThrow()
      expect(contextoAtual()).toMatchObject(identidadeA)
    })
  })

  it('falha fora de uma requisição, em vez de seguir sem escopo', () => {
    expect(() => definirIdentidadeNoContexto(identidadeA)).toThrow()
  })
})
