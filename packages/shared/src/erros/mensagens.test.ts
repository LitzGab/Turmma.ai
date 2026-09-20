import { describe, expect, it } from 'vitest'
import { FALHAS_DO_LOGIN_EXTERNO } from '../sessao/externa.js'
import { CodigoDeErro } from './codigo-de-erro.js'
import {
  formatarEspera,
  mensagemDaEntrada,
  mensagemDaEntradaPorMatricula,
  mensagemDaFalhaExterna,
  mensagemDoAcessoDaEscola,
  mensagemDoConvite,
  mensagemDoSegundoFator,
  MENSAGENS_DA_FALHA_EXTERNA,
  MENSAGENS_DE_ERRO,
} from './mensagens.js'

describe('formatarEspera', () => {
  it('diz o tempo por extenso em pt-BR, no singular só no 1, e arredonda para cima', () => {
    expect(formatarEspera(1)).toBe('1 segundo')
    expect(formatarEspera(30)).toBe('30 segundos')
    expect(formatarEspera(30.2)).toBe('31 segundos')
    expect(formatarEspera(59)).toBe('59 segundos')
    expect(formatarEspera(60)).toBe('1 minuto')
    // 90 s vira "2 minutos": dizer "1 minuto" faria a pessoa tentar cedo e esticar o bloqueio.
    expect(formatarEspera(90)).toBe('2 minutos')
    expect(formatarEspera(900)).toBe('15 minutos')
  })

  it('nunca manda tentar em zero segundo, que seria mandar tentar de novo já', () => {
    expect(formatarEspera(0)).toBe('1 segundo')
    expect(formatarEspera(-5)).toBe('1 segundo')
  })
})

describe('mensagemDaEntrada', () => {
  it('não diz se o e-mail existe: senha errada e e-mail inexistente chegam no mesmo código e no mesmo texto', () => {
    const mensagem = mensagemDaEntrada(CodigoDeErro.NAO_AUTENTICADO)
    expect(mensagem).toBe('E-mail ou senha incorretos. Confira os dois e tente de novo.')
    // A mensagem geral fala em sessão expirada, que na tela de entrada não quer dizer nada.
    expect(mensagem).not.toBe(MENSAGENS_DE_ERRO.NAO_AUTENTICADO)
    expect(mensagem).not.toMatch(/cadastr|não existe|inexistente/i)
  })

  it('conta segurada diz quanto esperar, a partir do Retry-After, e sem ele fica a faixa do catálogo', () => {
    expect(mensagemDaEntrada(CodigoDeErro.CONTA_SEGURADA, 30)).toBe('Muitas tentativas com senha errada nesta conta. Espere 30 segundos e tente de novo.')
    expect(mensagemDaEntrada(CodigoDeErro.CONTA_SEGURADA, 900)).toBe('Muitas tentativas com senha errada nesta conta. Espere 15 minutos e tente de novo.')
    expect(mensagemDaEntrada(CodigoDeErro.CONTA_SEGURADA)).toBe(MENSAGENS_DE_ERRO.CONTA_SEGURADA)
    expect(mensagemDaEntrada(CodigoDeErro.CONTA_SEGURADA, Number.NaN)).toBe(MENSAGENS_DE_ERRO.CONTA_SEGURADA)
  })

  it('o código sem texto próprio cai no catálogo geral, e nenhuma mensagem mostra código nem status', () => {
    expect(mensagemDaEntrada(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)).toBe(MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO)
    for (const codigo of Object.values(CodigoDeErro)) {
      const mensagem = mensagemDaEntrada(codigo, 60)
      expect(mensagem.length, codigo).toBeGreaterThan(0)
      expect(mensagem, codigo).not.toContain(codigo)
      expect(mensagem, codigo).not.toMatch(/\b[45]\d{2}\b/)
    }
  })
})

describe('mensagemDaEntradaPorMatricula', () => {
  it('não diz se a matrícula existe: matrícula inexistente, senha errada e aluno desativado têm o mesmo texto', () => {
    const mensagem = mensagemDaEntradaPorMatricula(CodigoDeErro.NAO_AUTENTICADO)
    expect(mensagem).toBe('Matrícula ou senha incorretas. Confira as duas e tente de novo.')
    expect(mensagem).not.toMatch(/não existe|inexistente|desativad|cadastr/i)
    // A tela do aluno nunca fala em e-mail: ele não tem e-mail no sistema (regra 20, item 2).
    expect(mensagem).not.toMatch(/e-mail/i)
  })

  it('conta segurada diz quanto esperar, para o aluno saber que não adianta insistir (RF11)', () => {
    expect(mensagemDaEntradaPorMatricula(CodigoDeErro.CONTA_SEGURADA, 90)).toContain('2 minutos')
  })
})

describe('mensagemDoAcessoDaEscola', () => {
  it('endereço que não existe manda conferir com a escola, e nunca lista escola nenhuma', () => {
    const mensagem = mensagemDoAcessoDaEscola(CodigoDeErro.NAO_ENCONTRADO)
    expect(mensagem).toContain('Endereço não encontrado')
    expect(mensagem).toMatch(/professor|coordena/i)
  })
})

describe('mensagemDoSegundoFator', () => {
  it('código errado, código já usado e desafio vencido chegam no mesmo texto, que diz o que fazer', () => {
    const mensagem = mensagemDoSegundoFator(CodigoDeErro.NAO_AUTENTICADO)
    expect(mensagem).toContain('Código incorreto')
    expect(mensagem).not.toBe(MENSAGENS_DE_ERRO.NAO_AUTENTICADO)
  })

  it('a conta segurada no quinto código errado diz a espera, como na senha', () => {
    expect(mensagemDoSegundoFator(CodigoDeErro.CONTA_SEGURADA, 30)).toContain('30 segundos')
  })
})

describe('mensagemDoConvite', () => {
  it('expirado, revogado, usado e inexistente pedem um convite novo, sem dizer qual deles foi', () => {
    const mensagem = mensagemDoConvite(CodigoDeErro.NAO_ENCONTRADO)
    expect(mensagem).toBe('Este convite não vale mais. Peça um convite novo à sua escola.')
    expect(mensagem).not.toMatch(/expirad|revogad|usad|não existe/i)
  })
})

describe('mensagemDaFalhaExterna', () => {
  it('qualquer erro do provedor vira a mesma mensagem, que oferece a matrícula (Tech Spec, seção 12)', () => {
    // O Google e a Microsoft não documentam o valor que devolvem quando a escola não liberou o app: todos iguais.
    for (const valor of ['provedor', 'access_denied', 'admin_policy_enforced', '']) {
      expect(mensagemDaFalhaExterna(valor), valor).toBe(MENSAGENS_DA_FALHA_EXTERNA.provedor)
    }
    expect(MENSAGENS_DA_FALHA_EXTERNA.provedor).toMatch(/matrícula/i)
  })

  it('a conta que não está ligada tem texto próprio, que manda usar a matrícula ou procurar o professor (RF10)', () => {
    expect(mensagemDaFalhaExterna('conta_externa_nao_ligada')).toBe(MENSAGENS_DE_ERRO.CONTA_EXTERNA_NAO_LIGADA)
    expect(mensagemDaFalhaExterna('conta_externa_nao_ligada')).not.toBe(MENSAGENS_DA_FALHA_EXTERNA.provedor)
  })

  it('toda falha declarada no contrato tem mensagem, e nenhuma mostra código nem status', () => {
    for (const falha of FALHAS_DO_LOGIN_EXTERNO) {
      const mensagem = mensagemDaFalhaExterna(falha)
      expect(mensagem.length, falha).toBeGreaterThan(0)
      expect(mensagem, falha).not.toContain(falha)
      expect(mensagem, falha).not.toMatch(/\b[45]\d{2}\b/)
    }
  })
})
