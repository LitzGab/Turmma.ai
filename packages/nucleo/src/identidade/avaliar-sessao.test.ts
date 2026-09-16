import { describe, expect, it } from 'vitest'
import { avaliarSessao, TOLERANCIA_DE_INATIVIDADE_MIN } from './avaliar-sessao.js'
import type { LinhaDaSessao } from './sessao.repository.js'
import type { TokenVerificado } from './verificar-token.js'

const token = {
  escolaId: '0190f5a0-0000-7000-8000-00000000000a',
  usuarioId: '0190f5a0-0000-7000-8000-0000000000a1',
  sessaoId: '0190f5a0-0000-7000-8000-0000000000d1',
} as TokenVerificado

const AGORA = new Date('2026-09-15T10:00:00-03:00')
const minutosAntes = (minutos: number) => new Date(AGORA.getTime() - minutos * 60_000)

function linha(ajuste: Partial<LinhaDaSessao> = {}): LinhaDaSessao {
  return {
    usuarioId: token.usuarioId,
    papel: 'aluno',
    desativadoEm: null,
    encerradaEm: null,
    expiraEm: new Date(AGORA.getTime() + 3_600_000),
    ultimoUsoEm: minutosAntes(1),
    inatividadeAlunoMin: 30,
    inatividadeEquipeMin: 120,
    anoLetivoId: '0190f5a0-0000-7000-8000-0000000000e1',
    agora: AGORA,
    ...ajuste,
  }
}

describe('avaliarSessao', () => {
  it('sessão válida vira o que vai para o contexto: escola, usuário e sessão do token, papel e ano da linha', () => {
    expect(avaliarSessao(token, linha({ papel: 'professor' }))).toEqual({ ...token, papel: 'professor', anoLetivoId: '0190f5a0-0000-7000-8000-0000000000e1' })
  })

  it('escola sem ano em curso autentica, com o ano nulo', () => {
    expect(avaliarSessao(token, linha({ anoLetivoId: null }))?.anoLetivoId).toBeNull()
  })

  it.each<[string, LinhaDaSessao | undefined]>([
    ['sessão inexistente para (esc, sid)', undefined],
    ['sessão de outro usuário (sessao.usuario_id ≠ sub)', linha({ usuarioId: '0190f5a0-0000-7000-8000-0000000000a2' })],
    ['sessão encerrada', linha({ encerradaEm: minutosAntes(1) })],
    ['usuário desativado', linha({ desativadoEm: minutosAntes(1) })],
    ['sessão expirada', linha({ expiraEm: minutosAntes(1) })],
    ['sessão expirando neste instante', linha({ expiraEm: AGORA })],
  ])('recusa %s', (_caso, lida) => {
    expect(avaliarSessao(token, lida)).toBeUndefined()
  })

  it('inatividade do aluno: vale até 30 min + 5 de tolerância, e vence nos 35', () => {
    expect(TOLERANCIA_DE_INATIVIDADE_MIN).toBe(5)
    expect(avaliarSessao(token, linha({ ultimoUsoEm: minutosAntes(34) }))).toBeDefined()
    expect(avaliarSessao(token, linha({ ultimoUsoEm: minutosAntes(35) }))).toBeUndefined()
  })

  it('inatividade da equipe usa a coluna da equipe, não a do aluno', () => {
    for (const papel of ['professor', 'coordenador'] as const) {
      expect(avaliarSessao(token, linha({ papel, ultimoUsoEm: minutosAntes(124) })), papel).toBeDefined()
      expect(avaliarSessao(token, linha({ papel, ultimoUsoEm: minutosAntes(125) })), papel).toBeUndefined()
    }
    // A mesma inatividade de 40 min vence o aluno e não vence o professor.
    expect(avaliarSessao(token, linha({ papel: 'aluno', ultimoUsoEm: minutosAntes(40) }))).toBeUndefined()
    expect(avaliarSessao(token, linha({ papel: 'professor', ultimoUsoEm: minutosAntes(40) }))).toBeDefined()
  })

  it('a inatividade configurada pela escola vale: com 10 min, o aluno vence nos 15', () => {
    expect(avaliarSessao(token, linha({ inatividadeAlunoMin: 10, ultimoUsoEm: minutosAntes(14) }))).toBeDefined()
    expect(avaliarSessao(token, linha({ inatividadeAlunoMin: 10, ultimoUsoEm: minutosAntes(15) }))).toBeUndefined()
  })

  it('compara com a hora do banco, não com a da máquina: uma linha lida de outro relógio segue a hora dela', () => {
    const noFuturo = new Date(AGORA.getTime() + 36 * 60_000)
    expect(avaliarSessao(token, linha({ ultimoUsoEm: AGORA, agora: noFuturo, expiraEm: new Date(noFuturo.getTime() + 60_000) }))).toBeUndefined()
  })
})
