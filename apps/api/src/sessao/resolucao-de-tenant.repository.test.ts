import { justificativaSemEscopo, TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO } from '@educa/nucleo'
import { describe, expect, it } from 'vitest'
import { CriacaoDeSessaoRepository } from './criacao-de-sessao.repository.js'
import { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

const metodosDe = (classe: { prototype: object }) => Object.getOwnPropertyNames(classe.prototype).filter((nome) => nome !== 'constructor').sort()

describe('ResolucaoDeTenantRepository: toda operação sem escopo é marcada e justificada', () => {
  it('nasce só com os métodos da tabela da seção 6 que a tarefa usa, cada um com @SemEscopo e a justificativa dele', () => {
    expect(metodosDe(ResolucaoDeTenantRepository)).toEqual(['criarContas', 'sessaoPorRefreshHash', 'sessaoPorRefreshHashAnterior', 'usuariosAtivosDaConta'])
    const justificativas = Object.fromEntries(metodosDe(ResolucaoDeTenantRepository).map((metodo) => [metodo, justificativaSemEscopo(ResolucaoDeTenantRepository, metodo)]))
    for (const [metodo, justificativa] of Object.entries(justificativas)) {
      expect(justificativa?.length ?? 0, metodo).toBeGreaterThanOrEqual(TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO)
    }
    expect(justificativas['sessaoPorRefreshHash']).toMatch(/cookie de renovação não diz a escola/)
    expect(justificativas['sessaoPorRefreshHashAnterior']).toMatch(/cookie de renovação não diz a escola/)
    expect(justificativas['usuariosAtivosDaConta']).toMatch(/credencial da equipe é global/)
    expect(justificativas['criarContas']).toMatch(/conta é global/)
  })

  it('a criação de usuário e sessão não sai sem escopo: grava na escola do contexto', () => {
    for (const metodo of metodosDe(CriacaoDeSessaoRepository)) expect(justificativaSemEscopo(CriacaoDeSessaoRepository, metodo), metodo).toBeUndefined()
  })
})
