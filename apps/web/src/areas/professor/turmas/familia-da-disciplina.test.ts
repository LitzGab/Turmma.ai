import { describe, expect, it } from 'vitest'
import { familiaDaDisciplina } from './familia-da-disciplina'

describe('familiaDaDisciplina', () => {
  it('é a mesma cor para o mesmo id, sempre', () => {
    const id = '0197a1c0-0000-7000-8000-000000000500'
    expect(familiaDaDisciplina(id)).toBe(familiaDaDisciplina(id))
  })

  it('nunca é amarelo nem vermelho, que são da faixa a confirmar e do erro, qualquer que seja o id', () => {
    for (let n = 0; n < 500; n++) {
      const familia = familiaDaDisciplina(`0197a1c0-0000-7000-8000-${String(n).padStart(12, '0')}`)
      expect(['amarelo', 'vermelho'], `o id ${String(n)} caiu em ${familia}`).not.toContain(familia)
    }
  })

  it('espalha as disciplinas por mais de uma cor: dois ids diferentes não ficam todos na mesma', () => {
    const cores = new Set(Array.from({ length: 50 }, (_, n) => familiaDaDisciplina(`disciplina-${String(n)}`)))
    expect(cores.size).toBeGreaterThan(3)
  })
})
