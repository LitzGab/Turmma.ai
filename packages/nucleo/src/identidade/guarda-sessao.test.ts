import { CodigoDeErro } from '@educa/shared'
import type { ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { describe, expect, it, vi } from 'vitest'
import { contextoAtual, executarNoContexto } from '../contexto/contexto.js'
import { GuardaDeSessao, type LeituraDeSessao } from './guarda-sessao.js'
import type { LinhaDaSessao } from './sessao.repository.js'
import { guardarTokenDaRequisicao } from './token-da-requisicao.js'
import type { TokenVerificado } from './verificar-token.js'

const token = {
  escolaId: '0190f5a0-0000-7000-8000-00000000000a',
  usuarioId: '0190f5a0-0000-7000-8000-0000000000a1',
  sessaoId: '0190f5a0-0000-7000-8000-0000000000d1',
} as TokenVerificado

const agora = new Date()
const linhaValida: LinhaDaSessao = {
  usuarioId: token.usuarioId,
  papel: 'professor',
  desativadoEm: null,
  encerradaEm: null,
  expiraEm: new Date(agora.getTime() + 3_600_000),
  ultimoUsoEm: agora,
  inatividadeAlunoMin: 30,
  inatividadeEquipeMin: 120,
  anoLetivoId: null,
  agora,
}

class Rota {
  handler(): void {}
}

function execucao(requisicao: object): ExecutionContext {
  return {
    getHandler: () => Rota.prototype.handler,
    getClass: () => Rota,
    getType: () => 'http',
    switchToHttp: () => ({ getRequest: () => requisicao }),
  } as unknown as ExecutionContext
}

const comToken = () => {
  const requisicao = {}
  guardarTokenDaRequisicao(requisicao, token)
  return requisicao
}

describe('GuardaDeSessao', () => {
  it('sessão válida: grava escola, usuário, papel, sessão e ano no contexto, com uma leitura só', async () => {
    const leitura: LeituraDeSessao = { lerParaGuarda: vi.fn().mockResolvedValue(linhaValida) }
    const contexto = await executarNoContexto({ requisicaoId: 'r' }, async () => {
      expect(await new GuardaDeSessao(new Reflector(), leitura).canActivate(execucao(comToken()))).toBe(true)
      return contextoAtual()
    })
    expect(contexto).toEqual({ requisicaoId: 'r', ...token, papel: 'professor', anoLetivoId: null })
    expect(leitura.lerParaGuarda).toHaveBeenCalledTimes(1)
    expect(leitura.lerParaGuarda).toHaveBeenCalledWith(token)
  })

  it('falha: erro ou prazo estourado na leitura responde INDISPONIVEL_TENTE_DE_NOVO 503 com espera, nunca 401, e não grava contexto', async () => {
    for (const falha of [Object.assign(new Error('Connection terminated due to connection timeout'), {}), Object.assign(new Error('canceling statement due to statement timeout'), { code: '57014', severity: 'ERROR' })]) {
      const leitura: LeituraDeSessao = { lerParaGuarda: vi.fn().mockRejectedValue(falha) }
      await executarNoContexto({ requisicaoId: 'r' }, async () => {
        await expect(new GuardaDeSessao(new Reflector(), leitura).canActivate(execucao(comToken()))).rejects.toMatchObject({
          codigo: CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO,
          status: 503,
          tenteDeNovoEmSegundos: expect.any(Number),
        })
        expect(contextoAtual()?.escolaId).toBeUndefined()
      })
    }
  })

  it('sessão que não vale (inexistente) responde NAO_AUTENTICADO e não grava contexto', async () => {
    const leitura: LeituraDeSessao = { lerParaGuarda: vi.fn().mockResolvedValue(undefined) }
    await executarNoContexto({ requisicaoId: 'r' }, async () => {
      await expect(new GuardaDeSessao(new Reflector(), leitura).canActivate(execucao(comToken()))).rejects.toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO, status: 401 })
      expect(contextoAtual()?.escolaId).toBeUndefined()
    })
  })

  it('sem token verificado na requisição (guarda fora de ordem), falha fechada sem ler o banco', async () => {
    const leitura: LeituraDeSessao = { lerParaGuarda: vi.fn() }
    await executarNoContexto({ requisicaoId: 'r' }, async () => {
      await expect(new GuardaDeSessao(new Reflector(), leitura).canActivate(execucao({}))).rejects.toMatchObject({ codigo: CodigoDeErro.NAO_AUTENTICADO })
    })
    expect(leitura.lerParaGuarda).not.toHaveBeenCalled()
  })
})
