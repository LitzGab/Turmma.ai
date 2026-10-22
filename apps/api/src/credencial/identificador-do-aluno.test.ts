import { describe, expect, it } from 'vitest'
import { identificadorDoAluno } from './identificador-do-aluno.js'

describe('identificadorDoAluno', () => {
  it('é a escola, a barra e a matrícula, e a mesma matrícula em duas escolas dá dois identificadores', () => {
    expect(identificadorDoAluno('e1', '123')).toBe('e1|123')
    expect(identificadorDoAluno('e2', '123')).toBe('e2|123')
    expect(identificadorDoAluno('e1', '123')).not.toBe(identificadorDoAluno('e2', '123'))
  })
})
