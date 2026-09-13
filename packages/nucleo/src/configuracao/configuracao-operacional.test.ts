import { randomUUID } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'
import { contextoAtual, executarNoContexto } from '../contexto/contexto.js'
import {
  ConfiguracaoOperacional,
  NOVA_TENTATIVA_DA_CONFIGURACAO_MS,
  resolverLimites,
  resolverVagas,
  VALIDADE_DA_CONFIGURACAO_MS,
} from './configuracao-operacional.js'
import type { LinhaOperacional } from './configuracao-operacional.repository.js'

const ESCOLA_A = '0190f5a0-0000-7000-8000-00000000000a'
const ESCOLA_B = '0190f5a0-0000-7000-8000-00000000000b'
const VAGAS_PADRAO = { interativa: 5, normal: 5, lote: 2 }
const LIMITES_PADRAO = { porUsuarioMin: 120, porEscolaMin: 30_000 }

const linha = (parcial: Partial<LinhaOperacional>): LinhaOperacional => ({ limiteReqUsuarioMin: null, limiteReqEscolaMin: null, vagas: null, ...parcial })
const naEscola = <T>(escolaId: string, funcao: () => T): T => executarNoContexto({ requisicaoId: randomUUID(), escolaId }, funcao)

describe('resolverVagas e resolverLimites', () => {
  it('escola sem linha opera com o padrão do ambiente inteiro', () => {
    expect(resolverVagas(VAGAS_PADRAO, undefined)).toEqual(VAGAS_PADRAO)
    expect(resolverLimites(LIMITES_PADRAO, undefined)).toEqual(LIMITES_PADRAO)
  })

  it('vagas nulas usam o padrão; a fila configurada troca só ela', () => {
    expect(resolverVagas(VAGAS_PADRAO, linha({ limiteReqEscolaMin: 10 }))).toEqual(VAGAS_PADRAO)
    expect(resolverVagas(VAGAS_PADRAO, linha({ vagas: { lote: 5 } }))).toEqual({ interativa: 5, normal: 5, lote: 5 })
  })

  it('cada limite nulo cai no padrão, independente do outro', () => {
    expect(resolverLimites(LIMITES_PADRAO, linha({ limiteReqEscolaMin: 3 }))).toEqual({ porUsuarioMin: 120, porEscolaMin: 3 })
    expect(resolverLimites(LIMITES_PADRAO, linha({ limiteReqUsuarioMin: 7 }))).toEqual({ porUsuarioMin: 7, porEscolaMin: 30_000 })
  })
})

describe('ConfiguracaoOperacional', () => {
  /** Repository falso que lê a escola do contexto, como o de verdade, a partir de linhas por escola. */
  function montar(linhas: Record<string, LinhaOperacional>, opcoes: { falhar?: () => boolean } = {}) {
    let agora = 0
    const lidas: string[] = []
    const aoFalhar = vi.fn()
    const repositorio = {
      daEscola: vi.fn(async () => {
        const escolaId = contextoAtual()?.escolaId ?? ''
        lidas.push(escolaId)
        if (opcoes.falhar?.() === true) throw new Error('Postgres fora')
        return linhas[escolaId]
      }),
    }
    const configuracao = new ConfiguracaoOperacional(repositorio, (lida) => resolverVagas(VAGAS_PADRAO, lida), { agora: () => agora, aoFalhar })
    return { configuracao, lidas, aoFalhar, avancar: (ms: number) => (agora += ms) }
  }

  it('isolamento: cada escola recebe a própria configuração, e a de A não muda a de B', async () => {
    const { configuracao } = montar({ [ESCOLA_A]: linha({ vagas: { lote: 5 } }) })
    expect(await naEscola(ESCOLA_A, () => configuracao.daEscola())).toEqual({ interativa: 5, normal: 5, lote: 5 })
    expect(await naEscola(ESCOLA_B, () => configuracao.daEscola())).toEqual(VAGAS_PADRAO)
    // Já guardada a de A, a de B continua a dela.
    expect(await naEscola(ESCOLA_B, () => configuracao.daEscola())).toEqual(VAGAS_PADRAO)
  })

  it('sem escola no contexto falha fechado; rotina do sistema usa o padrão sem consultar', async () => {
    const { configuracao, lidas } = montar({})
    await expect(executarNoContexto({ requisicaoId: randomUUID() }, () => configuracao.daEscola())).rejects.toThrow('sem escola no contexto')
    expect(await executarNoContexto({ requisicaoId: randomUUID(), rotinaDoSistema: true }, () => configuracao.daEscola())).toEqual(VAGAS_PADRAO)
    expect(lidas).toEqual([])
  })

  it('guarda por VALIDADE_DA_CONFIGURACAO_MS: cem requisições da mesma escola fazem uma leitura', async () => {
    const { configuracao, lidas } = montar({ [ESCOLA_A]: linha({ vagas: { lote: 5 } }) })
    await Promise.all(Array.from({ length: 100 }, () => naEscola(ESCOLA_A, () => configuracao.daEscola())))
    expect(lidas).toEqual([ESCOLA_A])
  })

  it('vencida, devolve a anterior na hora e lê de novo em segundo plano', async () => {
    const linhas = { [ESCOLA_A]: linha({ vagas: { lote: 5 } }) }
    const { configuracao, lidas, avancar } = montar(linhas)
    await naEscola(ESCOLA_A, () => configuracao.daEscola())
    linhas[ESCOLA_A] = linha({ vagas: { lote: 9 } })
    avancar(VALIDADE_DA_CONFIGURACAO_MS)

    expect((await naEscola(ESCOLA_A, () => configuracao.daEscola())).lote).toBe(5)
    await vi.waitFor(() => expect(lidas).toHaveLength(2))
    await vi.waitFor(async () => expect((await naEscola(ESCOLA_A, () => configuracao.daEscola())).lote).toBe(9))
  })

  it('leitura que falha não vira erro: sem anterior vale o padrão, com anterior vale a anterior, e tenta de novo depois', async () => {
    let falhar = true
    const { configuracao, lidas, aoFalhar, avancar } = montar({ [ESCOLA_A]: linha({ vagas: { lote: 5 } }) }, { falhar: () => falhar })

    expect(await naEscola(ESCOLA_A, () => configuracao.daEscola())).toEqual(VAGAS_PADRAO)
    expect(aoFalhar).toHaveBeenCalledOnce()
    // Antes da nova tentativa, nenhuma leitura a mais.
    avancar(NOVA_TENTATIVA_DA_CONFIGURACAO_MS - 1)
    await naEscola(ESCOLA_A, () => configuracao.daEscola())
    expect(lidas).toHaveLength(1)

    falhar = false
    avancar(1)
    await naEscola(ESCOLA_A, () => configuracao.daEscola())
    await vi.waitFor(async () => expect((await naEscola(ESCOLA_A, () => configuracao.daEscola())).lote).toBe(5))

    falhar = true
    avancar(VALIDADE_DA_CONFIGURACAO_MS)
    await naEscola(ESCOLA_A, () => configuracao.daEscola())
    await vi.waitFor(() => expect(aoFalhar).toHaveBeenCalledTimes(2))
    expect((await naEscola(ESCOLA_A, () => configuracao.daEscola())).lote).toBe(5)
  })
})
