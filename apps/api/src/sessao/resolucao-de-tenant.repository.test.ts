import { justificativaSemEscopo, TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO } from '@educa/nucleo'
import { describe, expect, it } from 'vitest'
import { CriacaoDeSessaoRepository } from './criacao-de-sessao.repository.js'
import { EuRepository } from './eu.repository.js'
import { RegistroDeAcessoRepository } from './registro-de-acesso.repository.js'
import { EscritaDeSessaoRepository } from './escrita-de-sessao.repository.js'
import { RedefinicaoDeMfaRepository } from './redefinicao-de-mfa.repository.js'
import { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

const metodosDe = (classe: { prototype: object }) => Object.getOwnPropertyNames(classe.prototype).filter((nome) => nome !== 'constructor').sort()

describe('ResolucaoDeTenantRepository: toda operação sem escopo é marcada e justificada', () => {
  it('nasce só com os métodos da tabela da seção 6 que a tarefa usa, cada um com @SemEscopo e a justificativa dele', () => {
    expect(metodosDe(ResolucaoDeTenantRepository)).toEqual([
      'apagarMfa',
      'ativarMfa',
      'avancarPassoDoMfa',
      'contaPorEmail',
      'criarContas',
      'escolaDoUsuarioParaOperador',
      'gravarFalhaDeLoginPorEmail',
      'gravarSegredoDeMfa',
      'mfaDaConta',
      'sessaoParaRenovar',
      'travarContaParaRedefinir',
      'usarCodigoDeRecuperacao',
      'usuariosAtivosDaConta',
    ])
    const justificativas = Object.fromEntries(metodosDe(ResolucaoDeTenantRepository).map((metodo) => [metodo, justificativaSemEscopo(ResolucaoDeTenantRepository, metodo)]))
    for (const [metodo, justificativa] of Object.entries(justificativas)) {
      expect(justificativa?.length ?? 0, metodo).toBeGreaterThanOrEqual(TAMANHO_MINIMO_JUSTIFICATIVA_SEM_ESCOPO)
    }
    expect(justificativas['sessaoParaRenovar']).toMatch(/cookie de renovação não diz a escola/)
    expect(justificativas['usuariosAtivosDaConta']).toMatch(/credencial da equipe é global/)
    expect(justificativas['criarContas']).toMatch(/conta é global/)
    expect(justificativas['contaPorEmail']).toMatch(/credencial da equipe é global/)
    expect(justificativas['gravarFalhaDeLoginPorEmail']).toMatch(/antes de haver escola/)
    for (const metodo of ['mfaDaConta', 'gravarSegredoDeMfa', 'ativarMfa', 'avancarPassoDoMfa', 'usarCodigoDeRecuperacao', 'travarContaParaRedefinir', 'apagarMfa']) {
      expect(justificativas[metodo], metodo).toMatch(/credencial da equipe é global/)
    }
    expect(justificativas['escolaDoUsuarioParaOperador']).toMatch(/rotina do operador/)
  })

  it('a criação de usuário e sessão, o registro de acesso, o /v1/eu, as escritas da renovação, da atividade e da saída, e o alvo da redefinição do MFA não saem sem escopo: usam a escola do contexto', () => {
    for (const classe of [CriacaoDeSessaoRepository, RegistroDeAcessoRepository, EuRepository, EscritaDeSessaoRepository, RedefinicaoDeMfaRepository]) {
      const metodos = metodosDe(classe)
      expect(metodos.length).toBeGreaterThan(0)
      for (const metodo of metodos) expect(justificativaSemEscopo(classe, metodo), metodo).toBeUndefined()
    }
  })
})
