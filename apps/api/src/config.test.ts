import { describe, expect, it } from 'vitest'
import { EMISSOR_TOKEN_SINTETICO, MOTIVO_TOKEN_SINTETICO_EM_PRODUCAO } from '@educa/nucleo'
import { ConfiguracaoInvalida, lerConfiguracao } from './config.js'

const ambienteValido = {
  API_PORTA: '3000',
  BANCO_URL: 'postgres://educa:senha_sintetica_xyz@postgres:5432/educa',
  BANCO_POOL_MAXIMO: '10',
  BANCO_TIMEOUT_CONEXAO_MS: '2000',
  BANCO_TIMEOUT_CONSULTA_MS: '1500',
  AMBIENTE: 'local',
  ACEITAR_TOKEN_SINTETICO: 'true',
  IDENTIDADE_CHAVE_ASSINATURA: 'chave_sintetica_de_teste_com_32_caracteres',
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
      identidade: {
        ambiente: 'local',
        chaveAssinatura: new TextEncoder().encode(ambienteValido.IDENTIDADE_CHAVE_ASSINATURA),
        emissoresAceitos: [EMISSOR_TOKEN_SINTETICO],
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

  it('aponta todas as variáveis inválidas pelo nome e nunca repete o valor, que pode ter senha ou chave', () => {
    const urlComSenhaInvalida = 'mysql://educa:senha_sintetica_xyz@postgres/educa'
    const chaveCurta = 'chave_curta_sintetica'
    const erro = erroDe({ ...ambienteValido, BANCO_URL: urlComSenhaInvalida, API_PORTA: '0', IDENTIDADE_CHAVE_ASSINATURA: chaveCurta })
    expect(erro.variaveis).toEqual(['API_PORTA', 'BANCO_URL', 'IDENTIDADE_CHAVE_ASSINATURA'])
    expect(erro.message).not.toContain('senha_sintetica_xyz')
    expect(erro.message).not.toContain(chaveCurta)
  })

  it('a API não sobe com AMBIENTE=producao e ACEITAR_TOKEN_SINTETICO=true', () => {
    const erro = erroDe({ ...ambienteValido, AMBIENTE: 'producao' })
    expect(erro.variaveis).toEqual(['ACEITAR_TOKEN_SINTETICO'])
    expect(erro.message).toContain(MOTIVO_TOKEN_SINTETICO_EM_PRODUCAO)
  })

  it('em produção com a flag desligada, sobe sem aceitar nenhum emissor sintético', () => {
    const config = lerConfiguracao({ ...ambienteValido, AMBIENTE: 'producao', ACEITAR_TOKEN_SINTETICO: 'false' })
    expect(config.identidade.emissoresAceitos).toEqual([])
  })
})
