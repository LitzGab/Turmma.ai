import { ErroDeDominio, type Banco } from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { randomUUID } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AcessoDaSala } from '../sessao/acesso-da-sala.js'
import type { BaldeDeLogin } from '../sessao/senha/baldes-de-login.js'
import { ListaLivreRepository } from './lista-livre.repository.js'
import { ReivindicacaoRepository } from './reivindicacao.repository.js'
import { ReivindicacaoService } from './reivindicacao.service.js'

/**
 * R3 (A1, tarefa 6.0; `tasks/prd-apresentacao-escola/cenarios.md`): o argon2id roda uma vez em todo pedido que passou da
 * chave, com a matrícula certa ou errada, com o nome tomado, inexistente ou de outra turma, pelo semáforo, no balde da
 * escola do acesso, e antes da transação. Rodar o hash só quando a matrícula bate mediria a matrícula pelo tempo.
 *
 * Sem banco: o hash, o semáforo e a transação são falsos e anotam a ordem; os repositories são trocados pelo resultado de
 * cada caso. A mesma regra, com o banco e o hash de verdade, está no R2 de `apps/api/test/salas-reivindicar.int.test.ts`.
 */

/** Um erro com a forma do erro do Postgres, como o Drizzle o entrega em `cause`. */
function erroDoPostgres(code: string): Error {
  return new Error('consulta falhou', { cause: Object.assign(new Error('do servidor'), { code, severity: 'ERROR' }) })
}

/** A sala que o `AcessoDaSala` acharia: só escola, ano e turma. */
const SALA: Parameters<Parameters<AcessoDaSala['naSala']>[1]>[0] = { escolaId: randomUUID(), anoLetivoId: randomUUID(), turmaId: randomUUID() }

/** Os cinco casos do R3: o que o `insert` do pedido e o `update` do nome fazem em cada um. */
const CASOS = [
  { caso: 'matrícula certa', inserir: 'grava', tomar: true, resposta: 'enviado' },
  { caso: 'matrícula errada', inserir: 'grava', tomar: false, resposta: CodigoDeErro.REIVINDICACAO_RECUSADA },
  { caso: 'nome tomado (23505 do pendente por nome)', inserir: '23505', tomar: true, resposta: CodigoDeErro.REIVINDICACAO_RECUSADA },
  { caso: 'listaNomeId inexistente (23503 da FK)', inserir: '23503', tomar: true, resposta: CodigoDeErro.REIVINDICACAO_RECUSADA },
  { caso: 'nome de outra turma', inserir: 'grava', tomar: false, resposta: CodigoDeErro.REIVINDICACAO_RECUSADA },
] as const

describe('reivindicação: o hash sempre, pelo semáforo, antes da transação (R3)', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function montar(caso: { readonly inserir: string; readonly tomar: boolean }) {
    const eventos: string[] = []
    const baldes: BaldeDeLogin[] = []
    let dentroDoSemaforo = false
    const hash = {
      gerar: vi.fn(async () => {
        eventos.push(dentroDoSemaforo ? 'hash no semáforo' : 'hash fora do semáforo')
        return '$argon2id$falso'
      }),
    }
    const semaforo = {
      executar: async <T>(balde: BaldeDeLogin, tarefa: () => Promise<T>): Promise<T> => {
        baldes.push(balde)
        dentroDoSemaforo = true
        try {
          return await tarefa()
        } finally {
          dentroDoSemaforo = false
        }
      },
    }
    const banco = {
      transaction: async (funcao: (tx: unknown) => Promise<void>) => {
        eventos.push('transação')
        await funcao({})
      },
    } as unknown as Banco
    vi.spyOn(ReivindicacaoRepository.prototype, 'chaveGravada').mockImplementation(async () => {
      eventos.push('lê a chave')
      return false
    })
    vi.spyOn(ReivindicacaoRepository.prototype, 'inserirPendente').mockImplementation(async () => {
      eventos.push('insert do pedido')
      if (caso.inserir !== 'grava') throw erroDoPostgres(caso.inserir)
    })
    vi.spyOn(ListaLivreRepository.prototype, 'tomar').mockImplementation(async () => {
      eventos.push('update do nome')
      return caso.tomar
    })
    const servico = new ReivindicacaoService({
      banco,
      acessoDaSala: { naSala: (_entrada, funcao) => funcao(SALA) },
      semaforo,
      hash,
      chaveCodigo: new Uint8Array(32),
    })
    return { servico, eventos, baldes, hash }
  }

  const pedido = { slug: 'colegio-sintetico', codigo: 'ABCD2345', listaNomeId: randomUUID(), matricula: 'sintetica-1', senha: 'senha-sintetica-12', chaveEnvio: randomUUID() }

  for (const caso of CASOS) {
    it(`${caso.caso}: um hash, no balde da escola do acesso, antes da transação`, async () => {
      const { servico, eventos, baldes, hash } = montar(caso)
      const resultado = await servico.reivindicar(pedido).then(
        (resposta) => resposta.resultado,
        (erro: unknown) => (erro instanceof ErroDeDominio ? erro.codigo : erro),
      )

      expect(resultado).toBe(caso.resposta)
      expect(hash.gerar).toHaveBeenCalledTimes(1)
      expect(hash.gerar).toHaveBeenCalledWith(pedido.senha)
      expect(baldes).toEqual([{ id: SALA.escolaId, subfila: '', rotulo: SALA.escolaId, rebaixado: false }])
      // A chave é lida antes do hash; o hash roda dentro do semáforo e antes de a transação abrir; a falha relê a chave.
      const depois = caso.resposta === 'enviado' ? [] : ['lê a chave']
      const escritas = caso.inserir === 'grava' ? ['insert do pedido', 'update do nome'] : ['insert do pedido']
      expect(eventos).toEqual(['lê a chave', 'hash no semáforo', 'transação', ...escritas, ...depois])
    })
  }

  it('a chave já gravada responde enviado sem hash, sem semáforo e sem transação', async () => {
    const { servico, eventos, baldes, hash } = montar(CASOS[0])
    vi.mocked(ReivindicacaoRepository.prototype.chaveGravada).mockResolvedValueOnce(true)
    expect(await servico.reivindicar(pedido)).toEqual({ resultado: 'enviado' })
    expect(hash.gerar).not.toHaveBeenCalled()
    expect(baldes).toEqual([])
    expect(eventos).toEqual([])
  })

  it('o erro que não é FK, 23505 nem nome não tomado sobe como veio, sem reler a chave', async () => {
    const { servico, eventos } = montar({ inserir: '57014', tomar: true })
    await expect(servico.reivindicar(pedido)).rejects.toThrow('consulta falhou')
    expect(eventos).toEqual(['lê a chave', 'hash no semáforo', 'transação', 'insert do pedido'])
  })
})
