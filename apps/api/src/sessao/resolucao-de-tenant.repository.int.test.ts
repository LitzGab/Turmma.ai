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

  it('sessão pelo hash atual ou pelo anterior: acha a sessão e a escola dela, diz por qual achou, e traz só ids, estado, datas, papel e a inatividade', async () => {
    const professorEmA = await bancada.escolaComSessao('professor')
    const [atual, anterior] = [randomUUID(), randomUUID()]
    await bancada.pool.query('update sessao set refresh_hash = $1, refresh_hash_anterior = $2 where escola_id = $3 and id = $4', [atual, anterior, professorEmA.escolaId, professorEmA.sessaoId])

    const pelaAtual = await repositorio.sessaoParaRenovar(atual)
    expect(pelaAtual).toMatchObject({
      id: professorEmA.sessaoId,
      escolaId: professorEmA.escolaId,
      usuarioId: professorEmA.usuarioId,
      pelo: 'atual',
      papel: 'professor',
      atualApresentado: false,
      encerradaEm: null,
      desativadoEm: null,
      inatividadeAlunoMin: 30,
      inatividadeEquipeMin: 120,
    })
    expect(Object.keys(pelaAtual ?? {}).sort()).toEqual([
      'agora',
      'atualApresentado',
      'desativadoEm',
      'encerradaEm',
      'escolaId',
      'expiraEm',
      'familia',
      'id',
      'inatividadeAlunoMin',
      'inatividadeEquipeMin',
      'papel',
      'pelo',
      'rotacionadoEm',
      'ultimoUsoEm',
      'usuarioId',
    ])
    expect(await repositorio.sessaoParaRenovar(anterior)).toMatchObject({ id: professorEmA.sessaoId, pelo: 'anterior' })
    expect(await repositorio.sessaoParaRenovar(randomUUID())).toBeUndefined()
  })

  it('concorrência: a sessão fica travada até o fim da transação de quem a achou, e a segunda leitura espera', async () => {
    const aluno = await bancada.escolaComSessao()
    const atual = randomUUID()
    await bancada.pool.query('update sessao set refresh_hash = $1 where escola_id = $2 and id = $3', [atual, aluno.escolaId, aluno.sessaoId])
    const ordem: string[] = []
    let liberar: () => void = () => undefined
    const travada = new Promise<void>((resolver) => (liberar = resolver))
    const primeira = bancada.banco.transaction(async (tx) => {
      await new ResolucaoDeTenantRepository(tx).sessaoParaRenovar(atual)
      ordem.push('primeira travou')
      await travada
      ordem.push('primeira terminou')
    })
    await expect.poll(() => ordem.length).toBe(1)
    const segunda = bancada.banco.transaction(async (tx) => {
      await new ResolucaoDeTenantRepository(tx).sessaoParaRenovar(atual)
      ordem.push('segunda leu')
    })
    await new Promise((resolver) => setTimeout(resolver, 300))
    liberar()
    await Promise.all([primeira, segunda])
    expect(ordem).toEqual(['primeira travou', 'primeira terminou', 'segunda leu'])
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

  it('contaPorEmail acha a conta sem diferença de caixa e devolve só id, hash e se o MFA está ativo; e-mail que não existe dá nada', async () => {
    const email = `Sintetico-${randomUUID()}@educa.invalid`
    const [contaId] = await repositorio.criarContas([email])
    try {
      expect(await repositorio.contaPorEmail(email.toLowerCase())).toEqual({ id: contaId, senhaHash: null, mfaAtivo: false })
      await bancada.pool.query("update conta set senha_hash = 'hash-sintetico', mfa_ativado_em = now() where id = $1", [contaId])
      expect(await repositorio.contaPorEmail(email.toUpperCase())).toEqual({ id: contaId, senhaHash: 'hash-sintetico', mfaAtivo: true })
      expect(await repositorio.contaPorEmail(`outro-${email}`)).toBeUndefined()
    } finally {
      await bancada.pool.query('delete from conta where id = $1', [contaId])
    }
  })

  it('gravarFalhaDeLoginPorEmail grava login_falho sem escola e sem usuário, só com o IP', async () => {
    const ip = `10.${String(Math.floor(Math.random() * 250))}.${String(Math.floor(Math.random() * 250))}.7`
    await repositorio.gravarFalhaDeLoginPorEmail(ip)
    const { rows } = await bancada.pool.query<{ escola_id: string | null; usuario_id: string | null; evento: string }>(
      "select escola_id, usuario_id, evento from registro_acesso where ip = $1::inet and em > now() - interval '1 minute'",
      [ip],
    )
    expect(rows).toEqual([{ escola_id: null, usuario_id: null, evento: 'login_falho' }])
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
  it('ativarMfa só ativa com o segredo que foi conferido: se outra aba configurou um segredo novo no meio, nada é ativado e nenhum código é gravado', async () => {
    const { rows } = await bancada.pool.query<{ id: string }>('insert into conta (email) values ($1) returning id', [`ativacao-${randomUUID()}@escola.invalid`])
    const contaId = rows[0]?.id ?? ''
    try {
      const gravado = Buffer.from('segredo-cifrado-sintetico-gravado')
      await bancada.pool.query('update conta set mfa_segredo_cifrado = $1, mfa_chave_versao = 1 where id = $2', [gravado, contaId])
      const hmacs = Array.from({ length: 10 }, (_, indice) => `${String(indice).padStart(2, '0')}${'h'.repeat(41)}`)
      const conferidoAntes = Buffer.from('segredo-cifrado-sintetico-anterior')
      expect(await bancada.banco.transaction((tx) => new ResolucaoDeTenantRepository(tx).ativarMfa(contaId, conferidoAntes, 100, hmacs))).toBe(false)
      const { rows: depois } = await bancada.pool.query<{ ativo: boolean; codigos: string }>(
        'select mfa_ativado_em is not null as ativo, (select count(*) from codigo_recuperacao where conta_id = $1) as codigos from conta where id = $1',
        [contaId],
      )
      expect(depois).toEqual([{ ativo: false, codigos: '0' }])
      // Com o segredo gravado, ativa.
      expect(await bancada.banco.transaction((tx) => new ResolucaoDeTenantRepository(tx).ativarMfa(contaId, gravado, 100, hmacs))).toBe(true)
    } finally {
      await bancada.pool.query('delete from conta where id = $1', [contaId])
    }
  })
})
