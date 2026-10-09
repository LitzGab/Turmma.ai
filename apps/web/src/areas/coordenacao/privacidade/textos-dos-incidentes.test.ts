import { RISCOS_DO_INCIDENTE } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { TEXTO_DO_QUE_CONFIRMAR_FAZ, textoDaConfirmacao, textoDaFaixa, textoDaFila, textoDoAviso, textoDoConhecimento, textoDoRisco, textoDosTitulares } from './textos-dos-incidentes'

describe('textoDoRisco: o risco para as pessoas, por extenso', () => {
  it('cada risco do contrato tem o seu texto, diferente dos outros, e nenhum é a chave crua', () => {
    const textos = RISCOS_DO_INCIDENTE.map((risco) => textoDoRisco(risco))
    expect(textos).toEqual(['Baixo', 'Relevante', 'Alto'])
    expect(new Set(textos).size).toBe(RISCOS_DO_INCIDENTE.length)
  })
})

describe('textoDosTitulares: quantas pessoas, dito como estimativa', () => {
  it('concorda no singular e no plural, usa o separador de milhar local e diz que é estimativa', () => {
    expect(textoDosTitulares(1)).toBe('1 pessoa (estimativa)')
    expect(textoDosTitulares(0)).toBe('0 pessoas (estimativa)')
    expect(textoDosTitulares(1200)).toBe('1.200 pessoas (estimativa)')
  })
})

describe('as datas do aviso: o conhecimento da Turmma e a chegada à escola', () => {
  it('cada uma lê o campo dela, e não o do outro', () => {
    // Meio-dia de UTC cai no mesmo dia em qualquer fuso de -12 a +11.
    const conhecidoEm = '2026-10-03T12:00:00.000Z'
    const avisadoEm = '2026-10-05T12:00:00.000Z'
    expect(textoDoConhecimento({ conhecidoEm })).toContain('03/10/2026')
    expect(textoDoAviso({ avisadoEm })).toContain('05/10/2026')
  })
})

describe('textoDaConfirmacao: esperando, ou confirmado em tal momento', () => {
  it('sem confirmação diz que espera a coordenação; com ela, diz quando, e as duas frases são diferentes', () => {
    expect(textoDaConfirmacao({ confirmadoEm: null })).toBe('Aguardando a confirmação da coordenação')
    const confirmado = textoDaConfirmacao({ confirmadoEm: '2026-10-05T12:00:00.000Z' })
    expect(confirmado).toMatch(/^Recebimento confirmado em 05\/10\/2026/)
  })
})

describe('textoDaFaixa: quantos avisos esperam, depois do "Ver depois"', () => {
  it('um aviso fica no singular; mais de um no plural, com o número', () => {
    expect(textoDaFaixa(1)).toBe('Um aviso de incidente de segurança que afetou a escola espera a confirmação da coordenação.')
    expect(textoDaFaixa(2)).toBe('2 avisos de incidente de segurança que afetaram a escola esperam a confirmação da coordenação.')
  })
})

describe('textoDaFila: o diálogo diz que há mais de um aviso', () => {
  it('com um só aviso não diz nada; com dois ou mais, diz quantos e que este é o primeiro', () => {
    expect(textoDaFila(1)).toBeUndefined()
    expect(textoDaFila(2)).toBe('2 avisos esperam a sua confirmação. Este é o primeiro.')
  })
})

describe('TEXTO_DO_QUE_CONFIRMAR_FAZ: o que confirmar registra e o que não faz', () => {
  it('diz quem e quando ficam registrados, e que a comunicação à ANPD e aos titulares continua da escola', () => {
    expect(TEXTO_DO_QUE_CONFIRMAR_FAZ).toContain('quem confirmou e quando')
    expect(TEXTO_DO_QUE_CONFIRMAR_FAZ).toContain('não comunica a ANPD nem os titulares')
  })
})
