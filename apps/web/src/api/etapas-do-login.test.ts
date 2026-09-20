import { ALFABETO_DO_CODIGO_DE_RECUPERACAO, CodigoDeErro } from '@educa/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * As etapas do login que a 19.0 ligou à tela: matrícula, segundo fator e convite. Como o módulo de sessão guarda
 * token, desafio e bilhete em variável de módulo (regra 50, item 7), cada teste recarrega os módulos, como uma aba
 * recém-aberta.
 */
interface RespostaFalsa {
  readonly status: number
  readonly corpo?: unknown
  readonly cabecalhos?: Record<string, string>
}

interface Chamada {
  readonly caminho: string
  readonly metodo: string
  readonly autorizacao: string | null
  readonly corpo: unknown
}

const chamadas: Chamada[] = []
let fila: RespostaFalsa[] = []

const importarSessao = () => import('./sessao')
const importarConvite = () => import('./convite')
const importarMfa = () => import('./mfa')
const importarCliente = () => import('./cliente')

let sessao: Awaited<ReturnType<typeof importarSessao>>
let convite: Awaited<ReturnType<typeof importarConvite>>
let mfa: Awaited<ReturnType<typeof importarMfa>>
let cliente: Awaited<ReturnType<typeof importarCliente>>

const DAQUI_A_MUITO = '2099-01-01T00:00:00.000Z'
const PRONTA = { etapa: 'pronta', token: 'token-1', expiraEm: DAQUI_A_MUITO }

function envelope(codigo: string) {
  return { erro: { codigo, mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } }
}

function responderCom(...respostas: RespostaFalsa[]): void {
  fila = [...respostas]
}

async function erroDe(promessa: Promise<unknown>): Promise<InstanceType<typeof cliente.ErroDaApi>> {
  const erro = await promessa.then(
    () => undefined,
    (motivo: unknown) => motivo,
  )
  expect(erro).toBeInstanceOf(cliente.ErroDaApi)
  return erro as InstanceType<typeof cliente.ErroDaApi>
}

beforeEach(async () => {
  chamadas.length = 0
  fila = []
  vi.resetModules()
  vi.stubGlobal(
    'fetch',
    vi.fn(async (caminho: string, opcoes?: RequestInit) => {
      const cabecalhos = new Headers(opcoes?.headers)
      const corpo = typeof opcoes?.body === 'string' ? (JSON.parse(opcoes.body) as unknown) : undefined
      chamadas.push({ caminho, metodo: opcoes?.method ?? 'GET', autorizacao: cabecalhos.get('Authorization'), corpo })
      const resposta = fila.shift()
      if (resposta === undefined) throw new Error(`chamada sem resposta preparada: ${opcoes?.method ?? 'GET'} ${caminho}`)
      await Promise.resolve()
      return new Response(resposta.corpo === undefined ? null : JSON.stringify(resposta.corpo), { status: resposta.status, headers: resposta.cabecalhos ?? {} })
    }),
  )
  ;[sessao, convite, mfa, cliente] = await Promise.all([importarSessao(), importarConvite(), importarMfa(), importarCliente()])
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  expect(fila, 'resposta preparada que nenhuma chamada consumiu').toHaveLength(0)
})

describe('entrada por matrícula', () => {
  it('manda o endereço da escola no corpo: é ele que diz de qual escola é a matrícula (RF7)', async () => {
    responderCom({ status: 200, corpo: PRONTA })
    await sessao.entrarPorMatricula({ slug: 'colegio-a', matricula: '1234', senha: 'senha-do-enzo' })
    expect(chamadas).toEqual([
      expect.objectContaining({
        caminho: sessao.CAMINHO_DA_ENTRADA_POR_MATRICULA,
        metodo: 'POST',
        corpo: { slug: 'colegio-a', matricula: '1234', senha: 'senha-do-enzo' },
        // O aluno não tem token nem desafio: a rota é anônima.
        autorizacao: null,
      }),
    ])
    expect(sessao.estadoDaSessao()).toBe('aberta')
  })

  it('o 503 do semáforo também é atraso aqui: às 7h30 quem está na fila é a turma inteira', async () => {
    vi.useFakeTimers()
    responderCom({ status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO), cabecalhos: { 'Retry-After': '2' } }, { status: 200, corpo: PRONTA })

    const entrada = sessao.entrarPorMatricula({ slug: 'colegio-a', matricula: '1234', senha: 'senha-do-enzo' })
    await vi.advanceTimersByTimeAsync(2_000)
    await expect(entrada).resolves.toEqual(PRONTA)
    expect(chamadas).toHaveLength(2)
  })
})

describe('segundo fator', () => {
  /** O login por e-mail que termina em `mfa`: é ele que deixa o desafio na memória desta aba. */
  async function comDesafioDeMfa(desafio = 'desafio.mfa.jwt'): Promise<void> {
    responderCom({ status: 200, corpo: { etapa: 'mfa', desafio } })
    await sessao.entrarPorEmail({ email: 'renata@escola.test', senha: 'segredo-da-renata' })
    chamadas.length = 0
  }

  it('manda o desafio da etapa no Authorization, e nunca o desafio de outra etapa', async () => {
    await comDesafioDeMfa()
    responderCom({ status: 200, corpo: PRONTA })
    await sessao.entrarComSegundoFator({ codigo: '123456' })
    expect(chamadas).toEqual([
      expect.objectContaining({ caminho: sessao.CAMINHO_DO_SEGUNDO_FATOR, metodo: 'POST', autorizacao: 'Bearer desafio.mfa.jwt', corpo: { codigo: '123456' } }),
    ])
    // O desafio da etapa `mfa` não serve para configurar o segundo fator de uma conta que ainda não o tem.
    expect(sessao.desafioDaEtapa('configurar_mfa')).toBeUndefined()
  })

  it('sem desafio nesta aba (um F5 na tela), nem sai chamada: a pessoa refaz a senha', async () => {
    const erro = await erroDe(sessao.entrarComSegundoFator({ codigo: '123456' }))
    expect(erro.codigo).toBe(CodigoDeErro.NAO_AUTENTICADO)
    expect(chamadas).toHaveLength(0)
  })

  it('o 503 não é repetido sozinho aqui: repetir gastaria tentativa do contador da conta com um código de 30 s', async () => {
    await comDesafioDeMfa()
    responderCom({ status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO), cabecalhos: { 'Retry-After': '2' } })
    const erro = await erroDe(sessao.entrarComSegundoFator({ codigo: '123456' }))
    expect(erro.codigo).toBe(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
    expect(chamadas).toHaveLength(1)
  })

  it('o desafio gasto no quinto código errado sai da memória, e o código certo seguinte nem chega à API', async () => {
    await comDesafioDeMfa()
    responderCom({ status: 429, corpo: envelope(CodigoDeErro.CONTA_SEGURADA), cabecalhos: { 'Retry-After': '30' } })
    const erro = await erroDe(sessao.entrarComSegundoFator({ codigo: '000000' }))
    expect(erro.esperaSegundos).toBe(30)

    // É a tela que esquece o desafio ao ver `CONTA_SEGURADA` (Mfa.tsx), porque só ela sabe que vai levar à entrada.
    sessao.esquecerDesafio()
    chamadas.length = 0
    expect((await erroDe(sessao.entrarComSegundoFator({ codigo: '123456' }))).codigo).toBe(CodigoDeErro.NAO_AUTENTICADO)
    expect(chamadas).toHaveLength(0)
  })

  it('configurar e ativar levam o desafio de configurar_mfa, e a ativação o esquece: ela o consome na API', async () => {
    responderCom({ status: 200, corpo: { etapa: 'configurar_mfa', desafio: 'desafio.configurar.jwt' } })
    await sessao.entrarPorEmail({ email: 'renata@escola.test', senha: 'segredo-da-renata' })
    chamadas.length = 0

    responderCom({ status: 200, corpo: { uri: 'otpauth://totp/Educa.ia:coordena%C3%A7%C3%A3o?secret=ABCD', segredo: 'ABCD' } })
    await mfa.configurarMfa()
    // Códigos no alfabeto do contrato (sem 0, 1, I e O, que se confundem no papel), com 12 caracteres.
    responderCom({ status: 200, corpo: { codigosRecuperacao: Array.from({ length: 10 }, (_, indice) => `ABCDEFGHJKL${ALFABETO_DO_CODIGO_DE_RECUPERACAO[indice] ?? '2'}`) } })
    await mfa.ativarMfa('123456')

    expect(chamadas.map((chamada) => [chamada.caminho, chamada.autorizacao])).toEqual([
      [mfa.CAMINHO_DA_CONFIGURACAO_DE_MFA, 'Bearer desafio.configurar.jwt'],
      [mfa.CAMINHO_DA_ATIVACAO_DE_MFA, 'Bearer desafio.configurar.jwt'],
    ])
    expect(sessao.desafioDaEtapa('configurar_mfa')).toBeUndefined()
  })

  it('sem desafio, configurar não chama a API: o segredo nunca é pedido por quem não provou a senha', async () => {
    const erro = await erroDe(mfa.configurarMfa())
    expect(erro.codigo).toBe(CodigoDeErro.NAO_AUTENTICADO)
    expect(chamadas).toHaveLength(0)
  })
})

describe('convite', () => {
  const TOKEN = 'token-sintetico-do-convite'

  it('o token vai no corpo, nunca na URL da API, que fica em log de borda e no histórico', async () => {
    responderCom({ status: 200, corpo: { escolaNome: 'Colégio sintético' } })
    await convite.consultarConvite(TOKEN)
    expect(chamadas[0]?.caminho).toBe(convite.CAMINHO_DA_CONSULTA_DE_CONVITE)
    expect(chamadas[0]?.caminho).not.toContain(TOKEN)
    expect(chamadas[0]?.corpo).toEqual({ token: TOKEN })
  })

  it('conta nova: o aceite com senha guarda o desafio de configurar_mfa, e nenhuma sessão é aberta', async () => {
    responderCom({ status: 200, corpo: { etapa: 'configurar_mfa', desafio: 'desafio.configurar.jwt' } })
    await convite.aceitarConvite({ token: TOKEN, senha: 'senha-nova-com-doze' })
    expect(sessao.desafioDaEtapa('configurar_mfa')).toBe('desafio.configurar.jwt')
    expect(sessao.tokenDeAcesso()).toBeUndefined()
  })

  it('conta que já existe: o bilhete fica em memória e vai no corpo do próximo login, uma vez só', async () => {
    responderCom({ status: 200, corpo: { etapa: 'entrar', bilhete: 'bilhete.jwt' } })
    await convite.aceitarConvite({ token: TOKEN })
    expect(sessao.convitePendente()).toBe(true)

    // Senha errada: o bilhete precisa sobreviver, senão a segunda tentativa entraria sem ativar a escola do convite.
    responderCom({ status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) })
    await erroDe(sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'errada' }))
    expect(chamadas.at(-1)?.corpo).toEqual({ email: 'camila@escola.test', senha: 'errada', bilhete: 'bilhete.jwt' })
    expect(sessao.convitePendente()).toBe(true)

    responderCom({ status: 200, corpo: PRONTA })
    await sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' })
    expect(chamadas.at(-1)?.corpo).toEqual({ email: 'camila@escola.test', senha: 'segredo-da-camila', bilhete: 'bilhete.jwt' })
    // Depois da resposta, quem carrega o convite é o desafio assinado pela API, e não mais esta aba.
    expect(sessao.convitePendente()).toBe(false)
  })

  it('sem convite aceito nesta aba, o login não manda bilhete nenhum', async () => {
    responderCom({ status: 200, corpo: PRONTA })
    await sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' })
    expect(chamadas.at(-1)?.corpo).toEqual({ email: 'camila@escola.test', senha: 'segredo-da-camila' })
  })
})

describe('meia credencial não sobrevive à sessão', () => {
  it('a sessão aberta apaga desafio, bilhete e aviso: no Chromebook do carrinho nada disso passa para a pessoa seguinte', async () => {
    responderCom({ status: 200, corpo: { etapa: 'entrar', bilhete: 'bilhete.jwt' } })
    await convite.aceitarConvite({ token: 'token-sintetico-do-convite' })
    sessao.definirAvisoDaEntrada('aviso qualquer')
    sessao.guardarDesafio('mfa', 'desafio.mfa.jwt')

    responderCom({ status: 200, corpo: PRONTA })
    await sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' })

    expect(sessao.desafioDaEtapa('mfa')).toBeUndefined()
    expect(sessao.convitePendente()).toBe(false)
    expect(sessao.avisoDaEntrada()).toBeUndefined()
  })
})
