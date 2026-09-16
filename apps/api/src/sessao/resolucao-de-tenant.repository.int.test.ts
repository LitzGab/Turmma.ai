import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BancadaDeSessoes } from '../../test/sessao-de-teste.js'
import { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'

describe('ResolucaoDeTenantRepository: a resolução antes de haver escola devolve só o mínimo', () => {
  const bancada = new BancadaDeSessoes()
  let repositorio: ResolucaoDeTenantRepository

  beforeAll(() => {
    repositorio = new ResolucaoDeTenantRepository(bancada.banco)
  })

  afterAll(async () => {
    await bancada.fechar()
  })

  it('sessão pelo hash atual e pelo anterior: acha a sessão e a escola dela, só com ids, estado e datas', async () => {
    const professorEmA = await bancada.escolaComSessao('professor')
    const [atual, anterior] = [randomUUID(), randomUUID()]
    await bancada.pool.query('update sessao set refresh_hash = $1, refresh_hash_anterior = $2 where id = $3', [atual, anterior, professorEmA.sessaoId])

    const pelaAtual = await repositorio.sessaoPorRefreshHash(atual)
    expect(pelaAtual).toMatchObject({ id: professorEmA.sessaoId, escolaId: professorEmA.escolaId, usuarioId: professorEmA.usuarioId, atualApresentado: false, encerradaEm: null })
    expect(Object.keys(pelaAtual ?? {}).sort()).toEqual(['atualApresentado', 'encerradaEm', 'escolaId', 'expiraEm', 'familia', 'id', 'rotacionadoEm', 'usuarioId'])
    expect(await repositorio.sessaoPorRefreshHashAnterior(anterior)).toEqual(pelaAtual)
    // O hash atual não acha pela coluna do anterior, nem o contrário.
    expect(await repositorio.sessaoPorRefreshHashAnterior(atual)).toBeUndefined()
    expect(await repositorio.sessaoPorRefreshHash(anterior)).toBeUndefined()
    expect(await repositorio.sessaoPorRefreshHash(randomUUID())).toBeUndefined()
  })

  it('usuários ativos da conta: os de cada escola, só id, escola e papel, e nunca o desativado nem o de outra conta', async () => {
    const professorEmA = await bancada.escolaComSessao('professor')
    const escolaB = await bancada.escola()
    const professorEmB = await bancada.sessao(escolaB, 'professor')
    const { rows } = await bancada.pool.query<{ conta_id: string }>('select conta_id from usuario where id = $1', [professorEmA.usuarioId])
    const contaId = rows[0]?.conta_id ?? ''
    // A mesma conta passa a ter usuário também na escola B, e um coordenador desativado nela.
    const { rows: novos } = await bancada.pool.query<{ id: string }>(
      "insert into usuario (escola_id, conta_id, papel, nome) values ($1, $2, 'professor', 'Pessoa sintética'), ($1, $2, 'coordenador', 'Pessoa sintética') returning id, papel",
      [escolaB, contaId],
    )
    try {
      const [professorDaContaEmB, coordenadorDesativado] = novos.map((linha) => linha.id)
      await bancada.pool.query('update usuario set desativado_em = now() where id = $1', [coordenadorDesativado])

      const ativos = await repositorio.usuariosAtivosDaConta(contaId)
      expect(ativos).toEqual(
        expect.arrayContaining([
          { usuarioId: professorEmA.usuarioId, escolaId: professorEmA.escolaId, papel: 'professor' },
          { usuarioId: professorDaContaEmB, escolaId: escolaB, papel: 'professor' },
        ]),
      )
      expect(ativos).toHaveLength(2)
      expect(ativos.map((ativo) => ativo.usuarioId)).not.toContain(professorEmB.usuarioId)
      for (const ativo of ativos) expect(Object.keys(ativo).sort()).toEqual(['escolaId', 'papel', 'usuarioId'])
    } finally {
      await bancada.pool.query('delete from usuario where id = any($1::uuid[])', [novos.map((linha) => linha.id)])
    }
  })

  it('criarContas grava só o e-mail e devolve só os ids; o mesmo e-mail com outra caixa é recusado', async () => {
    const email = `Sintetico-${randomUUID()}@educa.invalid`
    const [contaId] = await repositorio.criarContas([email])
    try {
      expect(contaId).toMatch(/^[0-9a-f-]{36}$/)
      await expect(repositorio.criarContas([email.toLowerCase()])).rejects.toMatchObject({ cause: { code: '23505' } })
    } finally {
      await bancada.pool.query('delete from conta where id = $1', [contaId])
    }
    expect(await repositorio.criarContas([])).toEqual([])
  })
})
