import { describe, expect, it } from 'vitest'
import { CodigoDeErro } from './codigo-de-erro.js'
import { formatarEspera, mensagemDaEntrada, MENSAGENS_DE_ERRO } from './mensagens.js'

describe('formatarEspera', () => {
  it('diz o tempo por extenso em pt-BR, no singular só no 1, e arredonda para cima', () => {
    expect(formatarEspera(1)).toBe('1 segundo')
    expect(formatarEspera(30)).toBe('30 segundos')
    expect(formatarEspera(30.2)).toBe('31 segundos')
    expect(formatarEspera(59)).toBe('59 segundos')
    expect(formatarEspera(60)).toBe('1 minuto')
    // 90 s vira "2 minutos": dizer "1 minuto" faria a pessoa tentar cedo e esticar o bloqueio.
    expect(formatarEspera(90)).toBe('2 minutos')
    expect(formatarEspera(900)).toBe('15 minutos')
  })

  it('nunca manda tentar em zero segundo, que seria mandar tentar de novo já', () => {
    expect(formatarEspera(0)).toBe('1 segundo')
    expect(formatarEspera(-5)).toBe('1 segundo')
  })
})

describe('mensagemDaEntrada', () => {
  it('não diz se o e-mail existe: senha errada e e-mail inexistente chegam no mesmo código e no mesmo texto', () => {
    const mensagem = mensagemDaEntrada(CodigoDeErro.NAO_AUTENTICADO)
    expect(mensagem).toBe('E-mail ou senha incorretos. Confira os dois e tente de novo.')
    // A mensagem geral fala em sessão expirada, que na tela de entrada não quer dizer nada.
    expect(mensagem).not.toBe(MENSAGENS_DE_ERRO.NAO_AUTENTICADO)
    expect(mensagem).not.toMatch(/cadastr|não existe|inexistente/i)
  })

  it('conta segurada diz quanto esperar, a partir do Retry-After, e sem ele fica a faixa do catálogo', () => {
    expect(mensagemDaEntrada(CodigoDeErro.CONTA_SEGURADA, 30)).toBe('Muitas tentativas com senha errada nesta conta. Espere 30 segundos e tente de novo.')
    expect(mensagemDaEntrada(CodigoDeErro.CONTA_SEGURADA, 900)).toBe('Muitas tentativas com senha errada nesta conta. Espere 15 minutos e tente de novo.')
    expect(mensagemDaEntrada(CodigoDeErro.CONTA_SEGURADA)).toBe(MENSAGENS_DE_ERRO.CONTA_SEGURADA)
    expect(mensagemDaEntrada(CodigoDeErro.CONTA_SEGURADA, Number.NaN)).toBe(MENSAGENS_DE_ERRO.CONTA_SEGURADA)
  })

  it('o código sem texto próprio cai no catálogo geral, e nenhuma mensagem mostra código nem status', () => {
    expect(mensagemDaEntrada(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)).toBe(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO)
    for (const codigo of Object.values(CodigoDeErro)) {
      const mensagem = mensagemDaEntrada(codigo, 60)
      expect(mensagem.length, codigo).toBeGreaterThan(0)
      expect(mensagem, codigo).not.toContain(codigo)
      expect(mensagem, codigo).not.toMatch(/\b[45]\d{2}\b/)
    }
  })
})
