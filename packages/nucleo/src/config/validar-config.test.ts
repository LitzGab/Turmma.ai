import { describe, expect, it } from 'vitest'
import {
  ConfiguracaoInvalida,
  EMISSOR_TOKEN_SINTETICO,
  lerConfiguracaoIdentidade,
  lerVagasPorEscolaDesligadas,
  MOTIVO_TOKEN_SINTETICO_EM_PRODUCAO,
  MOTIVO_VAGAS_DESLIGADAS_EM_PRODUCAO,
} from './validar-config.js'

const CHAVE_SINTETICA = 'chave_sintetica_de_teste_com_32_caracteres'

const ambienteLocal = {
  AMBIENTE: 'local',
  ACEITAR_TOKEN_SINTETICO: 'true',
  IDENTIDADE_CHAVE_ASSINATURA: CHAVE_SINTETICA,
}

function erroDe(ambiente: Record<string, string | undefined>, ler: (ambiente: Record<string, string | undefined>) => unknown = lerConfiguracaoIdentidade): ConfiguracaoInvalida {
  try {
    ler(ambiente)
  } catch (erro) {
    if (erro instanceof ConfiguracaoInvalida) return erro
    throw erro
  }
  throw new Error('a configuração deveria ter sido recusada')
}

describe('lerConfiguracaoIdentidade', () => {
  it('com a flag ligada fora de produção, aceita só o emissor sintético', () => {
    const config = lerConfiguracaoIdentidade(ambienteLocal)
    expect(config.emissoresAceitos).toEqual([EMISSOR_TOKEN_SINTETICO])
    expect(new TextDecoder().decode(config.chaveAssinatura)).toBe(CHAVE_SINTETICA)
  })

  it('com a flag desligada, nenhum emissor é aceito: o token sintético perde a validade', () => {
    expect(lerConfiguracaoIdentidade({ ...ambienteLocal, ACEITAR_TOKEN_SINTETICO: 'false' }).emissoresAceitos).toEqual([])
  })

  it('recusa AMBIENTE=producao com ACEITAR_TOKEN_SINTETICO=true, apontando a flag e o motivo', () => {
    const erro = erroDe({ ...ambienteLocal, AMBIENTE: 'producao' })
    expect(erro.variaveis).toEqual(['ACEITAR_TOKEN_SINTETICO'])
    expect(erro.motivos).toEqual([MOTIVO_TOKEN_SINTETICO_EM_PRODUCAO])
    expect(erro.message).toContain(MOTIVO_TOKEN_SINTETICO_EM_PRODUCAO)
  })

  it('aceita produção com a flag desligada', () => {
    const config = lerConfiguracaoIdentidade({ ...ambienteLocal, AMBIENTE: 'producao', ACEITAR_TOKEN_SINTETICO: 'false' })
    expect(config).toMatchObject({ ambiente: 'producao', emissoresAceitos: [] })
  })

  it.each(['1', 'TRUE', 'True', 'sim', '', ' true'])('recusa ACEITAR_TOKEN_SINTETICO="%s": só true ou false, escritos assim', (valor) => {
    expect(erroDe({ ...ambienteLocal, ACEITAR_TOKEN_SINTETICO: valor }).variaveis).toEqual(['ACEITAR_TOKEN_SINTETICO'])
  })

  it.each(['prod', 'production', 'PRODUCAO', ''])('recusa AMBIENTE="%s": produção escrita de outro jeito não escapa da trava', (valor) => {
    expect(erroDe({ ...ambienteLocal, AMBIENTE: valor }).variaveis).toEqual(['AMBIENTE'])
  })

  it.each(Object.keys(ambienteLocal))('não sobe sem %s', (variavel) => {
    expect(erroDe({ ...ambienteLocal, [variavel]: undefined }).variaveis).toEqual([variavel])
  })

  it('recusa chave de assinatura curta, sem repetir a chave na mensagem', () => {
    const curta = 'chave_curta_sintetica'
    const erro = erroDe({ ...ambienteLocal, IDENTIDADE_CHAVE_ASSINATURA: curta })
    expect(erro.variaveis).toEqual(['IDENTIDADE_CHAVE_ASSINATURA'])
    expect(erro.message).not.toContain(curta)
    expect(JSON.stringify(erro.motivos)).not.toContain(curta)
  })
})

describe('lerVagasPorEscolaDesligadas (controle negativo do cenário de carga)', () => {
  const ambiente = { AMBIENTE: 'local', VAGAS_POR_ESCOLA_DESLIGADAS: 'false' }

  it('desligada por padrão do .env.example, e ligada só quando pedida escrita assim', () => {
    expect(lerVagasPorEscolaDesligadas(ambiente)).toBe(false)
    expect(lerVagasPorEscolaDesligadas({ ...ambiente, VAGAS_POR_ESCOLA_DESLIGADAS: 'true' })).toBe(true)
  })

  it('recusa AMBIENTE=producao com a vaga por escola desligada, apontando a flag e o motivo', () => {
    const erro = erroDe({ AMBIENTE: 'producao', VAGAS_POR_ESCOLA_DESLIGADAS: 'true' }, lerVagasPorEscolaDesligadas)
    expect(erro.variaveis).toEqual(['VAGAS_POR_ESCOLA_DESLIGADAS'])
    expect(erro.motivos).toEqual([MOTIVO_VAGAS_DESLIGADAS_EM_PRODUCAO])
  })

  it('aceita produção com a vaga por escola ligada', () => {
    expect(lerVagasPorEscolaDesligadas({ AMBIENTE: 'producao', VAGAS_POR_ESCOLA_DESLIGADAS: 'false' })).toBe(false)
  })

  it.each(['1', 'TRUE', 'sim', '', ' true'])('recusa VAGAS_POR_ESCOLA_DESLIGADAS="%s": ninguém desliga a justiça entre escolas sem querer', (valor) => {
    expect(erroDe({ ...ambiente, VAGAS_POR_ESCOLA_DESLIGADAS: valor }, lerVagasPorEscolaDesligadas).variaveis).toEqual(['VAGAS_POR_ESCOLA_DESLIGADAS'])
  })

  it.each(Object.keys(ambiente))('não sobe sem %s', (variavel) => {
    expect(erroDe({ ...ambiente, [variavel]: undefined }, lerVagasPorEscolaDesligadas).variaveis).toEqual([variavel])
  })
})
