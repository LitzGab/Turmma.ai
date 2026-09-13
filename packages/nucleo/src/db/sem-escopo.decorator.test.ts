import { describe, expect, it } from 'vitest'
import { ConfiguracaoOperacionalRepository } from '../configuracao/configuracao-operacional.repository.js'
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

  it('só as consultas da fila inteira do despachante saem sem escopo, e cada uma diz por quê', () => {
    const semEscopo = metodosDe(DespachoRepository).filter((metodo) => justificativaSemEscopo(DespachoRepository, metodo) !== undefined)
    expect(semEscopo.sort()).toEqual(['listarEscolasComPendentes', 'listarParaReconciliar', 'registrarFalhaDaFila', 'reservarParaRepublicar'])
    for (const metodo of semEscopo) expect(justificativaSemEscopo(DespachoRepository, metodo), metodo).toMatch(/despachante/)
    // Reservar, devolver, listar e marcar publicados são da escola do contexto: a vaga e a configuração lidas junto são dela.
    for (const metodo of ['reservarDaEscola', 'devolverParaAguardando', 'publicadosEntre', 'marcarPublicados']) expect(justificativaSemEscopo(DespachoRepository, metodo), metodo).toBeUndefined()
    // Os repositories que atendem a API e o worker não têm exceção nenhuma.
    for (const classe of [JobRegistroRepository, ConfiguracaoOperacionalRepository]) {
      for (const metodo of metodosDe(classe)) expect(justificativaSemEscopo(classe, metodo), metodo).toBeUndefined()
    }
  })
})
