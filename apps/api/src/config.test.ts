import { describe, expect, it } from 'vitest'
import { ConfiguracaoInvalida, lerConfiguracao } from './config.js'

const ambienteValido = {
  API_PORTA: '3000',
  BANCO_URL: 'postgres://educa:senha_sintetica_xyz@postgres:5432/educa',
  BANCO_POOL_MAXIMO: '10',
  BANCO_TIMEOUT_CONEXAO_MS: '2000',
  BANCO_TIMEOUT_CONSULTA_MS: '1500',
}

function erroDe(ambiente: Record<string, string | undefined>): ConfiguracaoInvalida {
  try {
    lerConfiguracao(ambiente)
  } catch (erro) {
    if (erro instanceof ConfiguracaoInvalida) return erro
    throw erro
  }
  throw new Error('a configuração deveria ter sido recusada')
}

describe('lerConfiguracao', () => {
  it('converte o ambiente em configuração tipada', () => {
    expect(lerConfiguracao(ambienteValido)).toEqual({
      porta: 3000,
      banco: {
        url: ambienteValido.BANCO_URL,
        maximoConexoes: 10,
        timeoutConexaoMs: 2000,
        timeoutConsultaMs: 1500,
      },
    })
  })

  it.each(Object.keys(ambienteValido))(
    'não sobe sem %s: limite e endereço são configuração, nunca valor escondido no código',
    (variavel) => {
      const incompleto: Record<string, string | undefined> = { ...ambienteValido, [variavel]: undefined }
      expect(erroDe(incompleto).variaveis).toEqual([variavel])
    },
  )

  it('aponta todas as variáveis inválidas pelo nome e nunca repete o valor, que pode ter senha', () => {
    const urlComSenhaInvalida = 'mysql://educa:senha_sintetica_xyz@postgres/educa'
    const erro = erroDe({ ...ambienteValido, BANCO_URL: urlComSenhaInvalida, API_PORTA: '0' })
    expect(erro.variaveis).toEqual(['API_PORTA', 'BANCO_URL'])
    expect(erro.message).not.toContain('senha_sintetica_xyz')
  })
})
