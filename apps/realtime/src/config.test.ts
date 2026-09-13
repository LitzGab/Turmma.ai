import { EMISSOR_TOKEN_SINTETICO, MOTIVO_TOKEN_SINTETICO_EM_PRODUCAO } from '@educa/nucleo'
import { describe, expect, it } from 'vitest'
import { ConfiguracaoInvalida, lerConfiguracao } from './config.js'

const ambienteValido = {
  REALTIME_PORTA: '3000',
  REDIS_FILA_URL: 'redis://redis-fila:6379',
  REALTIME_STREAM_TAMANHO_MAXIMO: '10000',
  AMBIENTE: 'local',
  ACEITAR_TOKEN_SINTETICO: 'true',
  IDENTIDADE_CHAVE_ASSINATURA: 'chave_sintetica_de_teste_com_32_caracteres',
  DRENAGEM_ESPERA_BORDA_MS: '5000',
  DRENAGEM_PRAZO_MS: '10000',
  TELEMETRIA_OTLP_URL: 'http://observabilidade:4318/',
  TELEMETRIA_INTERVALO_MS: '5000',
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

describe('lerConfiguracao do realtime', () => {
  it('converte o ambiente em configuração tipada', () => {
    expect(lerConfiguracao(ambienteValido)).toEqual({
      porta: 3000,
      redis: { url: 'redis://redis-fila:6379', tamanhoMaximoDoStream: 10000 },
      identidade: {
        ambiente: 'local',
        chaveAssinatura: new TextEncoder().encode(ambienteValido.IDENTIDADE_CHAVE_ASSINATURA),
        emissoresAceitos: [EMISSOR_TOKEN_SINTETICO],
      },
      drenagem: { esperaDaBordaMs: 5000, prazoMs: 10000 },
      telemetria: { otlpUrl: 'http://observabilidade:4318', intervaloMs: 5000 },
    })
  })

  it.each(Object.keys(ambienteValido))('não sobe sem %s', (variavel) => {
    expect(erroDe({ ...ambienteValido, [variavel]: undefined }).variaveis).toEqual([variavel])
  })

  it('não sobe com AMBIENTE=producao e ACEITAR_TOKEN_SINTETICO=true', () => {
    const erro = erroDe({ ...ambienteValido, AMBIENTE: 'producao' })
    expect(erro.variaveis).toEqual(['ACEITAR_TOKEN_SINTETICO'])
    expect(erro.message).toContain(MOTIVO_TOKEN_SINTETICO_EM_PRODUCAO)
  })

  it('aponta de uma vez os problemas de Redis, identidade e drenagem, sem repetir o valor', () => {
    const erro = erroDe({
      ...ambienteValido,
      REDIS_FILA_URL: 'http://usuario:senha_sintetica_xyz@redis',
      IDENTIDADE_CHAVE_ASSINATURA: 'curta',
      DRENAGEM_ESPERA_BORDA_MS: '10000',
    })
    expect(erro.variaveis).toEqual(['DRENAGEM_ESPERA_BORDA_MS', 'IDENTIDADE_CHAVE_ASSINATURA', 'REDIS_FILA_URL'])
    expect(erro.message).not.toContain('senha_sintetica_xyz')
  })
})
