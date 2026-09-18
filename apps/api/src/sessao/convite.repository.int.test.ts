import { executarNoContexto } from '@educa/nucleo'
import { createHash, randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { BancadaDeSessoes } from '../../test/sessao-de-teste.js'
import { ConviteRepository } from './convite.repository.js'

interface EstadoDoConvite {
  /** Há quanto tempo o usuário ficou inativo, em segundos. */
  inativoHaS?: number
  /** Há quanto tempo o convite foi aceito, em segundos; `null` quando não foi. */
  aceitoHaS?: number | null
  revogado?: boolean
}

describe('ConviteRepository: o convite e o usuário convidado só na escola do contexto', () => {
  const bancada = new BancadaDeSessoes()
  let escolaA: string
  let escolaB: string

  beforeAll(async () => {
    escolaA = await bancada.escola()
    escolaB = await bancada.escola()
    await bancada.pool.query("update escola set nome = 'Colégio A sintético' where id = $1", [escolaA])
    await bancada.pool.query("update escola set nome = 'Colégio B sintético' where id = $1", [escolaB])
  })

  afterAll(async () => {
    await bancada.fechar()
  })

  const naEscola = <T>(escolaId: string, funcao: (repositorio: ConviteRepository) => Promise<T>) =>
    executarNoContexto({ requisicaoId: randomUUID(), escolaId }, () => funcao(new ConviteRepository(bancada.banco)))

  /** Um coordenador inativo em A com um convite no estado pedido. Por padrão: inativo há 60 s e aceito há 10 s. */
  async function convidado({ inativoHaS = 60, aceitoHaS = 10, revogado = false }: EstadoDoConvite = {}): Promise<{ usuarioId: string; conviteId: string; contaId: string }> {
    const { rows: contas } = await bancada.pool.query<{ id: string }>('insert into conta (email) values ($1) returning id', [`convidada-${randomUUID()}@escola.invalid`])
    const contaId = contas[0]?.id ?? ''
    const { rows: usuarios } = await bancada.pool.query<{ id: string }>(
      "insert into usuario (escola_id, conta_id, papel, nome, desativado_em) values ($1, $2, 'coordenador', 'Pessoa sintética', now() - make_interval(secs => $3)) returning id",
      [escolaA, contaId, inativoHaS],
    )
    const usuarioId = usuarios[0]?.id ?? ''
    const { rows: convites } = await bancada.pool.query<{ id: string }>(
      `insert into convite (escola_id, token_hash, tipo, usuario_id, expira_em, usado_em, revogado_em)
       values ($1, $2, 'coordenador', $3, now() + interval '72 hours', case when $4::int is null then null else now() - make_interval(secs => $4::int) end, case when $5 then now() end)
       returning id`,
      [escolaA, createHash('sha256').update(randomUUID()).digest('hex'), usuarioId, aceitoHaS, revogado],
    )
    return { usuarioId, conviteId: convites[0]?.id ?? '', contaId }
  }

  async function ativo(usuarioId: string): Promise<boolean> {
    const { rows } = await bancada.pool.query<{ ativo: boolean }>('select desativado_em is null as ativo from usuario where id = $1', [usuarioId])
    return rows[0]?.ativo ?? false
  }

  it('isolamento: no contexto de B, o usuário e o convite de A não são ativados nem revogados, e o nome é o de B', async () => {
    const alvo = await convidado()
    expect(await naEscola(escolaB, (repositorio) => repositorio.ativarPorConvite(alvo.usuarioId, alvo.conviteId))).toBe(false)
    expect(await ativo(alvo.usuarioId)).toBe(false)
    expect(await naEscola(escolaB, (repositorio) => repositorio.revogar(alvo.conviteId))).toBe(false)
    await naEscola(escolaB, (repositorio) => repositorio.revogarConvitesDoUsuario(alvo.usuarioId))
    const { rows } = await bancada.pool.query<{ revogado: boolean }>('select revogado_em is not null as revogado from convite where id = $1', [alvo.conviteId])
    expect(rows).toEqual([{ revogado: false }])
    expect(await naEscola(escolaB, (repositorio) => repositorio.nomeDaEscola())).toBe('Colégio B sintético')
    expect(await naEscola(escolaA, (repositorio) => repositorio.nomeDaEscola())).toBe('Colégio A sintético')

    // Na escola dele, ativa uma vez só.
    expect(await naEscola(escolaA, (repositorio) => repositorio.ativarPorConvite(alvo.usuarioId, alvo.conviteId))).toBe(true)
    expect(await ativo(alvo.usuarioId)).toBe(true)
    expect(await naEscola(escolaA, (repositorio) => repositorio.ativarPorConvite(alvo.usuarioId, alvo.conviteId))).toBe(false)
  })

  it.each<[string, EstadoDoConvite]>([
    ['convite não aceito', { aceitoHaS: null }],
    ['convite revogado', { revogado: true }],
    ['aceito antes de o usuário ficar inativo (desativado depois de entrar)', { inativoHaS: 10, aceitoHaS: 60 }],
  ])('borda: %s não ativa', async (_caso, estado) => {
    const alvo = await convidado(estado)
    expect(await naEscola(escolaA, (repositorio) => repositorio.ativarPorConvite(alvo.usuarioId, alvo.conviteId))).toBe(false)
    expect(await ativo(alvo.usuarioId)).toBe(false)
  })

  it('borda: o convite de outro usuário da mesma escola não ativa este', async () => {
    const alvo = await convidado({ aceitoHaS: null })
    const outro = await convidado()
    expect(await naEscola(escolaA, (repositorio) => repositorio.ativarPorConvite(alvo.usuarioId, outro.conviteId))).toBe(false)
    expect(await ativo(alvo.usuarioId)).toBe(false)
  })

  it('concorrência: duas ativações ao mesmo tempo ativam uma vez', async () => {
    const alvo = await convidado()
    const resultados = await Promise.all([1, 2].map(() => naEscola(escolaA, (repositorio) => repositorio.ativarPorConvite(alvo.usuarioId, alvo.conviteId))))
    expect(resultados.sort()).toEqual([false, true])
  })

  it('o coordenador convidado nasce inativo; o que já está ativo não é convidado de novo; o inativo volta a esperar', async () => {
    const { rows: contas } = await bancada.pool.query<{ id: string }>('insert into conta (email) values ($1) returning id', [`convidada-${randomUUID()}@escola.invalid`])
    const contaId = contas[0]?.id ?? ''
    const usuarioId = await naEscola(escolaA, (repositorio) => repositorio.usuarioConvidado(contaId, 'Pessoa sintética'))
    expect(usuarioId).toEqual(expect.any(String))
    expect(await ativo(usuarioId ?? '')).toBe(false)
    await bancada.pool.query('update usuario set desativado_em = null where id = $1', [usuarioId])
    expect(await naEscola(escolaA, (repositorio) => repositorio.usuarioConvidado(contaId, 'Pessoa sintética'))).toBeUndefined()
    expect(await ativo(usuarioId ?? '')).toBe(true)
    await bancada.pool.query("update usuario set desativado_em = now() - interval '1 day' where id = $1", [usuarioId])
    expect(await naEscola(escolaA, (repositorio) => repositorio.usuarioConvidado(contaId, 'Pessoa sintética'))).toBe(usuarioId)
    const { rows } = await bancada.pool.query<{ recente: boolean }>("select desativado_em > now() - interval '1 minute' as recente from usuario where id = $1", [usuarioId])
    expect(rows).toEqual([{ recente: true }])
  })

  it('sem escola no contexto, falha fechada', async () => {
    const alvo = await convidado()
    await expect(executarNoContexto({ requisicaoId: randomUUID() }, () => new ConviteRepository(bancada.banco).ativarPorConvite(alvo.usuarioId, alvo.conviteId))).rejects.toThrow(
      'convite sem escola no contexto',
    )
  })
})
