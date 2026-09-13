import { describe, expect, it } from 'vitest'
import { DespachoRepository } from '../fila/despacho.repository.js'
import { JobRegistroRepository } from '../fila/job-registro.repository.js'
import { justificativaSemEscopo, SemEscopo } from './sem-escopo.decorator.js'

function metodosDe(classe: { prototype: object }): string[] {
  return Object.getOwnPropertyNames(classe.prototype).filter((nome) => nome !== 'constructor')
}

describe('@SemEscopo', () => {
  it('recusa marcação sem justificativa escrita', () => {
    expect(() => SemEscopo('')).toThrow('@SemEscopo exige justificativa escrita')
    expect(() => SemEscopo('rotina')).toThrow('@SemEscopo exige justificativa escrita')
  })

  it('só as consultas do despachante saem sem escopo, e cada uma diz por quê', () => {
    for (const metodo of metodosDe(DespachoRepository)) {
      expect(justificativaSemEscopo(DespachoRepository, metodo), metodo).toMatch(/despachante/)
    }
    // O repository que atende a API e o worker não tem exceção nenhuma.
    for (const metodo of metodosDe(JobRegistroRepository)) {
      expect(justificativaSemEscopo(JobRegistroRepository, metodo), metodo).toBeUndefined()
    }
  })
})
