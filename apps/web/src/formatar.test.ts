import { describe, expect, it } from 'vitest'
import { formatarData, formatarDataHora, formatarQuantidade } from './formatar'

describe('formatação pt-BR', () => {
  it('data sem hora não volta um dia por causa do fuso', () => {
    expect(formatarData('2026-09-13')).toBe('13 de setembro de 2026')
    expect(formatarData('2026-01-01')).toBe('1 de janeiro de 2026')
  })

  it('data e hora no formato brasileiro', () => {
    expect(formatarDataHora('2026-09-14T13:05:00.000Z')).toMatch(/^14\/09\/2026, \d{2}:05$/)
  })

  it('quantidade com separador de milhar e plural', () => {
    expect(formatarQuantidade(0, 'aviso', 'avisos')).toBe('0 avisos')
    expect(formatarQuantidade(1, 'aviso', 'avisos')).toBe('1 aviso')
    expect(formatarQuantidade(1234, 'aviso', 'avisos')).toBe('1.234 avisos')
  })
})
