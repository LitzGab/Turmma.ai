import { TAMANHO_MAXIMO_DO_TRECHO_CITADO } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { trechoCitado } from './trecho-citado.js'

const PAGINA = `${'Texto de abertura da página, sem relação com a busca. '.repeat(12)}Reagente limitante é o reagente que acaba primeiro e determina quanto produto se forma. ${'Depois vem o resto da página, com outros assuntos. '.repeat(12)}`

describe('o pedaço da página que a busca devolve', () => {
  it('a página curta sai inteira, numa linha só', () => {
    expect(trechoCitado('Mol é a unidade\nde quantidade   de matéria.', 'mol')).toBe('Mol é a unidade de quantidade de matéria.')
  })

  it('nunca passa do tamanho do contrato, e diz com reticências onde cortou', () => {
    const pedaco = trechoCitado(PAGINA, 'reagente limitante')
    expect(pedaco.length).toBeLessThanOrEqual(TAMANHO_MAXIMO_DO_TRECHO_CITADO)
    expect(pedaco.startsWith('…')).toBe(true)
    expect(pedaco.endsWith('…')).toBe(true)
  })

  it('começa perto da palavra buscada, e não no começo da página', () => {
    expect(trechoCitado(PAGINA, 'reagente limitante')).toContain('Reagente limitante é o reagente que acaba primeiro')
  })

  it('acha a palavra flexionada e sem acento: "reagentes limitantes" e "materia"', () => {
    expect(trechoCitado(PAGINA, 'reagentes limitantes')).toContain('Reagente limitante é o reagente')
    const comAcento = `${'a '.repeat(300)}quantidade de matéria em mol ${'b '.repeat(300)}`
    expect(trechoCitado(comAcento, 'materia')).toContain('quantidade de matéria em mol')
  })

  it('sem achar a palavra na página, devolve o começo dela', () => {
    const pedaco = trechoCitado(PAGINA, 'fotossíntese')
    expect(pedaco.startsWith('Texto de abertura da página')).toBe(true)
    expect(pedaco.length).toBeLessThanOrEqual(TAMANHO_MAXIMO_DO_TRECHO_CITADO)
  })

  it('corta em palavra inteira', () => {
    const pedaco = trechoCitado(PAGINA, 'reagente')
    const miolo = pedaco.replace(/^…/, '').replace(/…$/, '')
    expect(PAGINA.replace(/\s+/g, ' ')).toContain(` ${miolo} `)
  })
})
