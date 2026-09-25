import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * O caminho do desafio entre o aceite do convite, a configuração e o primeiro código (Tech Spec da A0, seção 5,
 * "Etapas"): cada rota só aceita o desafio da sua etapa, e ele vive só na memória da aba. O módulo é recarregado em cada
 * teste, como uma aba recém-aberta; a rede é falsa, e a regra sob teste é a da web.
 */
const importar = async () => ({ sessao: await import('./sessao'), convite: await import('./convite'), mfa: await import('./mfa') })
type Modulos = Awaited<ReturnType<typeof importar>>

interface Chamada {
  readonly caminho: string
  readonly corpo: unknown
}

const chamadas: Chamada[] = []
/** `segurar` prende a resposta até o teste liberar: é o aceite que ainda está no ar quando outro link chega à aba. */
let fila: { status: number; corpo?: unknown; segurar?: Promise<void> }[] = []

/** Dez códigos no alfabeto do contrato (sem 0, 1, I e O), como a API os gera. */
const CODIGOS = 'ABCDEFGHJK'.split('').map((letra) => `${letra.repeat(4)}23456789`)
const CONFIGURADO = {
  uri: 'otpauth://totp/Turmma:opera%C3%A7%C3%A3o?secret=JBSWY3DPEHPK3PXP',
  segredo: 'JBSWY3DPEHPK3PXP',
  codigosRecuperacao: CODIGOS,
  etapa: 'mfa',
  desafio: 'desafio-mfa-da-versao-1',
}

function envelope(codigo: string) {
  return { erro: { codigo, mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } }
}

let m: Modulos

beforeEach(async () => {
  chamadas.length = 0
  fila = []
  vi.resetModules()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (caminho: string, opcoes?: RequestInit) => {
      chamadas.push({ caminho, corpo: typeof opcoes?.body === 'string' ? (JSON.parse(opcoes.body) as unknown) : undefined })
      const resposta = fila.shift()
      if (resposta === undefined) throw new Error(`chamada sem resposta preparada: ${caminho}`)
      await (resposta.segurar ?? Promise.resolve())
      return new Response(resposta.corpo === undefined ? null : JSON.stringify(resposta.corpo), { status: resposta.status })
    }),
  )
  m = await importar()
})

afterEach(() => {
  vi.unstubAllGlobals()
  expect(fila, 'resposta preparada que nenhuma chamada consumiu').toHaveLength(0)
})

async function codigoDoErro(promessa: Promise<unknown>): Promise<unknown> {
  const erro = await promessa.then(
    () => undefined,
    (motivo: unknown) => motivo,
  )
  expect(erro).toHaveProperty('codigo')
  return (erro as { codigo: unknown }).codigo
}

describe('aceite do convite do operador', () => {
  it('guarda o desafio configurar_mfa do aceite, e a configuração o manda no corpo', async () => {
    fila.push({ status: 200, corpo: { etapa: 'configurar_mfa', desafio: 'desafio-de-configurar' } }, { status: 200, corpo: CONFIGURADO })
    await m.convite.aceitarConviteDeOperador({ token: 'token-do-link', senha: 'frase-sintetica-comprida' })
    expect(m.sessao.desafioDeOperador('configurar_mfa')).toBe('desafio-de-configurar')

    const dados = await m.mfa.configurarSegundoFatorDeOperador()
    expect(chamadas.map((chamada) => chamada.caminho)).toEqual(['/v1/operacao/convite/aceitar', '/v1/operacao/sessao/mfa/configurar'])
    expect(chamadas[1]?.corpo).toEqual({ desafio: 'desafio-de-configurar' })
    // A tela recebe o segredo e os códigos, mas nunca o desafio: ele fica no módulo, trocado pelo da etapa seguinte.
    expect(dados).toEqual({ uri: CONFIGURADO.uri, segredo: CONFIGURADO.segredo, codigosRecuperacao: CODIGOS })
    expect(m.sessao.desafioDeOperador('configurar_mfa')).toBeUndefined()
    expect(m.sessao.desafioDeOperador('mfa')).toBe('desafio-mfa-da-versao-1')
  })

  it('o desafio de antes (a entrada de outra pessoa nesta aba) sai antes do aceite, mesmo quando o convite não vale', async () => {
    m.sessao.guardarDesafioDeOperador('mfa', 'desafio-de-quem-entrou-antes')
    fila.push({ status: 404, corpo: envelope('NAO_ENCONTRADO') })
    expect(await codigoDoErro(m.convite.aceitarConviteDeOperador({ token: 'token-usado', senha: 'frase-sintetica-comprida' }))).toBe('NAO_ENCONTRADO')
    expect(m.sessao.desafioDeOperador('mfa')).toBeUndefined()
  })
})

describe('o aceite feito com o link anterior a um hashchange', () => {
  const PEDIDO = { token: 'token-do-primeiro-link', senha: 'frase-sintetica-comprida' }

  /** Um aceite no ar, segurado: o teste decide se outro link chega (a vez sobe) antes de a resposta voltar. */
  function aceiteSegurado(resposta: { status: number; corpo?: unknown }) {
    let vez = 0
    let liberar: () => void = () => undefined
    fila.push({ ...resposta, segurar: new Promise<void>((resolver) => (liberar = resolver)) })
    const desfecho = m.convite.aceitarConviteDeOperadorNaVez(PEDIDO, () => vez)
    return {
      desfecho,
      outroLink: () => {
        vez++
      },
      liberar: () => liberar(),
    }
  }

  it('a resposta que volta depois de outro link é descartada: não vale como aceite, e o desafio dela não fica na aba', async () => {
    const aceite = aceiteSegurado({ status: 200, corpo: { etapa: 'configurar_mfa', desafio: 'desafio-do-link-anterior' } })
    aceite.outroLink()
    aceite.liberar()
    expect(await aceite.desfecho).toEqual({ tipo: 'descartado' })
    expect(m.sessao.desafioDeOperador('configurar_mfa')).toBeUndefined()
  })

  it('com o mesmo link na tela, a mesma resposta vale: segue para o configurar, com o desafio guardado', async () => {
    const aceite = aceiteSegurado({ status: 200, corpo: { etapa: 'configurar_mfa', desafio: 'desafio-do-link-anterior' } })
    aceite.liberar()
    expect(await aceite.desfecho).toEqual({ tipo: 'aceito' })
    expect(m.sessao.desafioDeOperador('configurar_mfa')).toBe('desafio-do-link-anterior')
  })

  it('a recusa que volta depois de outro link também é descartada: a tela do link novo não vira "convite que não vale"', async () => {
    const depois = aceiteSegurado({ status: 404, corpo: envelope('NAO_ENCONTRADO') })
    depois.outroLink()
    depois.liberar()
    expect(await depois.desfecho).toEqual({ tipo: 'descartado' })

    const semOutroLink = aceiteSegurado({ status: 404, corpo: envelope('NAO_ENCONTRADO') })
    semOutroLink.liberar()
    expect(await semOutroLink.desfecho).toEqual({ tipo: 'invalido' })

    const falhaSemOutroLink = aceiteSegurado({ status: 503, corpo: envelope('INDISPONIVEL_TENTE_DE_NOVO') })
    falhaSemOutroLink.liberar()
    const falha = await falhaSemOutroLink.desfecho
    expect(falha.tipo).toBe('falhou')
    expect(falha.tipo === 'falhou' && falha.erro).toHaveProperty('codigo', 'INDISPONIVEL_TENTE_DE_NOVO')
  })
})

describe('configurar o segundo fator do operador', () => {
  it('sem o desafio de configurar, recusa sem chamar a API', async () => {
    m.sessao.guardarDesafioDeOperador('mfa', 'desafio-de-outra-etapa')
    expect(await codigoDoErro(m.mfa.configurarSegundoFatorDeOperador())).toBe('NAO_AUTENTICADO')
    expect(chamadas).toEqual([])
  })

  it('503 e 429 deixam o desafio para o "Tentar de novo"; a recusa do desafio o esquece', async () => {
    m.sessao.guardarDesafioDeOperador('configurar_mfa', 'desafio-de-configurar')
    fila.push({ status: 503, corpo: envelope('INDISPONIVEL_TENTE_DE_NOVO') })
    expect(await codigoDoErro(m.mfa.configurarSegundoFatorDeOperador())).toBe('INDISPONIVEL_TENTE_DE_NOVO')
    expect(m.sessao.desafioDeOperador('configurar_mfa')).toBe('desafio-de-configurar')

    fila.push({ status: 429, corpo: envelope('LIMITE_EXCEDIDO') })
    expect(await codigoDoErro(m.mfa.configurarSegundoFatorDeOperador())).toBe('LIMITE_EXCEDIDO')
    expect(m.sessao.desafioDeOperador('configurar_mfa')).toBe('desafio-de-configurar')

    fila.push({ status: 401, corpo: envelope('NAO_AUTENTICADO') })
    expect(await codigoDoErro(m.mfa.configurarSegundoFatorDeOperador())).toBe('NAO_AUTENTICADO')
    expect(m.sessao.desafioDeOperador('configurar_mfa')).toBeUndefined()
  })

  it('"configure de novo" (409) gasta o desafio mfa: a tela não tem com o que tentar de novo e vai à entrada', async () => {
    m.sessao.guardarDesafioDeOperador('configurar_mfa', 'desafio-de-configurar')
    fila.push({ status: 200, corpo: CONFIGURADO }, { status: 409, corpo: envelope('CONFLITO') })
    await m.mfa.configurarSegundoFatorDeOperador()
    expect(await codigoDoErro(m.sessao.entrarComSegundoFatorDeOperador({ codigo: '123456' }))).toBe('CONFLITO')
    expect(chamadas[1]?.corpo).toEqual({ desafio: 'desafio-mfa-da-versao-1', codigo: '123456' })
    expect(m.sessao.desafioDeOperador('mfa')).toBeUndefined()
    expect(m.sessao.estadoDaSessaoDeOperador()).not.toBe('aberta')
  })
})
