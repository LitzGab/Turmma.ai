import { CodigoDeErro, JANELA_DE_RENOVACAO_SIMULTANEA_MS } from '@educa/shared'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * O módulo de sessão guarda o token em variável de módulo de propósito (regra 50, item 7), então cada teste começa
 * com o módulo recarregado, como uma aba recém-aberta.
 */
type ModuloDeSessao = Awaited<ReturnType<typeof importarSessao>>
type ModuloDoCliente = Awaited<ReturnType<typeof importarCliente>>

const importarSessao = () => import('./sessao')
const importarCliente = () => import('./cliente')

let sessao: ModuloDeSessao
let cliente: ModuloDoCliente

interface RespostaFalsa {
  readonly status: number
  readonly corpo?: unknown
  readonly cabecalhos?: Record<string, string>
  /** Falha de rede: o `fetch` rejeita, como quando o Wi-Fi da escola cai no meio do pedido. */
  readonly semRede?: boolean
}

interface Chamada {
  readonly caminho: string
  readonly metodo: string
  readonly autorizacao: string | null
  readonly quando: number
}

const chamadas: Chamada[] = []
let fila: RespostaFalsa[] = []
let emVoo = 0
let maximoEmVoo = 0

/** Um token que ainda vale: quem testa o vencimento diz a data. */
const DAQUI_A_MUITO = '2099-01-01T00:00:00.000Z'
const TOKEN_NOVO = { token: 'token-2', expiraEm: DAQUI_A_MUITO }

function tokenDe(valor: string, expiraEm = DAQUI_A_MUITO) {
  return { token: valor, expiraEm }
}

/** Envelope de erro da API, como o filtro global o devolve. */
function envelope(codigo: string) {
  return { erro: { codigo, mensagem: 'texto que a tela não usa', requisicaoId: '0190f5a0-0000-7000-8000-000000000001' } }
}

function responderCom(...respostas: RespostaFalsa[]): void {
  fila = [...respostas]
}

function instalarFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (caminho: string, opcoes?: RequestInit) => {
      const cabecalhos = new Headers(opcoes?.headers)
      chamadas.push({ caminho, metodo: opcoes?.method ?? 'GET', autorizacao: cabecalhos.get('Authorization'), quando: Date.now() })
      const resposta = fila.shift()
      if (resposta === undefined) throw new Error(`chamada sem resposta preparada: ${opcoes?.method ?? 'GET'} ${caminho}`)
      emVoo++
      maximoEmVoo = Math.max(maximoEmVoo, emVoo)
      try {
        // Uma volta do laço de eventos: sem isso, duas renovações "em paralelo" nunca se cruzariam no teste.
        await Promise.resolve()
        if (resposta.semRede) throw new TypeError('Failed to fetch')
        return new Response(resposta.corpo === undefined ? null : JSON.stringify(resposta.corpo), { status: resposta.status, headers: resposta.cabecalhos ?? {} })
      } finally {
        emVoo--
      }
    }),
  )
}

/** Uma `navigator.locks` de verdade: uma tarefa por nome de trava, em fila, como o navegador faz entre abas. */
function instalarWebLocks(): { pedidas: string[]; segurar: (nome: string) => () => void } {
  const pedidas: string[] = []
  const filaDaTrava = new Map<string, Promise<unknown>>()
  const pedir = (nome: string, tarefa: () => Promise<unknown>) => {
    pedidas.push(nome)
    const anterior = filaDaTrava.get(nome) ?? Promise.resolve()
    const proxima = anterior.then(tarefa, tarefa)
    filaDaTrava.set(
      nome,
      proxima.then(
        () => undefined,
        () => undefined,
      ),
    )
    return proxima
  }
  vi.stubGlobal('navigator', { locks: { request: pedir } })
  return {
    pedidas,
    /** Outra aba segurando a trava até quem chamou liberar. */
    segurar: (nome: string) => {
      let liberar: () => void = () => undefined
      void pedir(nome, () => new Promise<void>((resolver) => (liberar = resolver)))
      return () => liberar()
    },
  }
}

async function erroDe(promessa: Promise<unknown>): Promise<InstanceType<typeof cliente.ErroDaApi>> {
  const erro = await promessa.then(
    () => undefined,
    (motivo: unknown) => motivo,
  )
  expect(erro).toBeInstanceOf(cliente.ErroDaApi)
  return erro as InstanceType<typeof cliente.ErroDaApi>
}

/** Entra e deixa a aba com sessão aberta, como depois do login por e-mail. */
async function comSessaoAberta(token = 'token-1'): Promise<void> {
  responderCom({ status: 200, corpo: { etapa: 'pronta', ...tokenDe(token) } })
  await sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' })
  chamadas.length = 0
}

/** A aba parada mais que os 10 min do token: a tela continua na frente da pessoa, e o JWT já não vale. */
async function comSessaoVencida(): Promise<void> {
  vi.useFakeTimers({ now: new Date('2026-09-19T12:00:00.000Z') })
  responderCom({ status: 200, corpo: { etapa: 'pronta', ...tokenDe('token-1', '2026-09-19T12:10:00.000Z') } })
  await sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' })
  chamadas.length = 0
  vi.setSystemTime(new Date('2026-09-19T12:11:00.000Z'))
}

beforeEach(async () => {
  chamadas.length = 0
  fila = []
  emVoo = 0
  maximoEmVoo = 0
  vi.resetModules()
  instalarFetch()
  ;[sessao, cliente] = await Promise.all([importarSessao(), importarCliente()])
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.useRealTimers()
  expect(fila, 'resposta preparada que nenhuma chamada consumiu').toHaveLength(0)
})

describe('renovação', () => {
  it('409 JA_RENOVADO (outra aba, ou a nossa resposta perdida) espera mais que a janela e repete com o cookie atual, sem logout', async () => {
    vi.useFakeTimers()
    await comSessaoAberta()
    responderCom({ status: 409, corpo: envelope(CodigoDeErro.JA_RENOVADO) }, { status: 200, corpo: TOKEN_NOVO })

    const renovacao = sessao.renovarSessao()
    await vi.advanceTimersByTimeAsync(JANELA_DE_RENOVACAO_SIMULTANEA_MS)
    // Dentro da janela, a API trataria o cookie anterior como outra aba renovando junto e devolveria outro 409, e aí
    // a pessoa cairia no login no meio da aula: a web ainda não tentou.
    expect(chamadas).toHaveLength(1)

    await vi.advanceTimersByTimeAsync(sessao.ESPERA_DEPOIS_DO_JA_RENOVADO_MS - JANELA_DE_RENOVACAO_SIMULTANEA_MS)
    await renovacao
    const [primeira, segunda] = chamadas
    expect(chamadas.map((chamada) => chamada.caminho)).toEqual([sessao.CAMINHO_DA_RENOVACAO, sessao.CAMINHO_DA_RENOVACAO])
    expect((segunda?.quando ?? 0) - (primeira?.quando ?? 0)).toBeGreaterThan(JANELA_DE_RENOVACAO_SIMULTANEA_MS)
    expect(sessao.tokenDeAcesso()).toBe(TOKEN_NOVO.token)
    expect(sessao.estadoDaSessao()).toBe('aberta')
  })

  it('409 nas duas tentativas não manda ninguém para o login: a sessão fica indisponível, para tentar de novo', async () => {
    vi.useFakeTimers()
    responderCom({ status: 409, corpo: envelope(CodigoDeErro.JA_RENOVADO) }, { status: 409, corpo: envelope(CodigoDeErro.JA_RENOVADO) })

    const abertura = sessao.abrirSessaoPeloCookie()
    await vi.advanceTimersByTimeAsync(sessao.ESPERA_DEPOIS_DO_JA_RENOVADO_MS)
    await abertura

    // `anonima` aqui levaria ao login quem só tropeçou em duas abas renovando junto (regra 80, item 6).
    expect(sessao.estadoDaSessao()).toBe('indisponivel')
    expect(chamadas).toHaveLength(2)
  })

  it('resposta perdida por falta de rede: a renovação não desloga, e a tentativa seguinte recebe a rotação', async () => {
    await comSessaoAberta()
    responderCom({ status: 0, semRede: true })

    const erro = await erroDe(sessao.renovarSessao())
    expect(erro.codigo).toBe(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
    // O token que já estava em memória continua valendo, e ninguém foi mandado para a entrada.
    expect(sessao.tokenDeAcesso()).toBe('token-1')
    expect(sessao.estadoDaSessao()).toBe('aberta')

    responderCom({ status: 200, corpo: TOKEN_NOVO })
    await sessao.renovarSessao()
    expect(sessao.tokenDeAcesso()).toBe(TOKEN_NOVO.token)
  })

  it('espera a trava das Web Locks: com outra aba renovando, o pedido não sai daqui', async () => {
    const travas = instalarWebLocks()
    await comSessaoAberta()
    const liberarAOutraAba = travas.segurar(sessao.NOME_DA_TRAVA_DE_RENOVACAO)
    responderCom({ status: 200, corpo: TOKEN_NOVO })

    const renovacao = sessao.renovarSessao()
    await Promise.resolve()
    await Promise.resolve()
    // Sem a trava, as duas abas mandariam o mesmo cookie juntas, e uma delas cairia em reuso de refresh, que
    // encerra a família inteira e desloga a professora no meio da aula.
    expect(chamadas, 'a renovação saiu com a trava na mão de outra aba').toHaveLength(0)

    liberarAOutraAba()
    await renovacao
    expect(travas.pedidas).toEqual([sessao.NOME_DA_TRAVA_DE_RENOVACAO, sessao.NOME_DA_TRAVA_DE_RENOVACAO])
    expect(chamadas).toHaveLength(1)
    expect(maximoEmVoo).toBe(1)
  })

  it('as chamadas que caíram em 401 juntas esperam a mesma renovação, e não uma por chamada', async () => {
    await comSessaoAberta()
    responderCom(
      { status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) },
      { status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) },
      { status: 200, corpo: TOKEN_NOVO },
      { status: 200, corpo: { itens: [] } },
      { status: 200, corpo: { itens: [] } },
    )

    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor }) }
    await Promise.all([sessao.buscarComSessao('/v1/a', esquema), sessao.buscarComSessao('/v1/b', esquema)])

    const renovacoes = chamadas.filter((chamada) => chamada.caminho === sessao.CAMINHO_DA_RENOVACAO)
    expect(renovacoes).toHaveLength(1)
    // As duas repetem com o token novo, nunca com o vencido.
    expect(chamadas.slice(3).map((chamada) => chamada.autorizacao)).toEqual([`Bearer ${TOKEN_NOVO.token}`, `Bearer ${TOKEN_NOVO.token}`])
  })
})

describe('chamada com sessão', () => {
  it('manda o token no cabeçalho e, no 401, renova uma vez e repete a chamada', async () => {
    await comSessaoAberta()
    responderCom({ status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) }, { status: 200, corpo: TOKEN_NOVO }, { status: 200, corpo: { nome: 'Camila' } })

    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor as { nome: string } }) }
    await expect(sessao.buscarComSessao('/v1/eu', esquema)).resolves.toEqual({ nome: 'Camila' })
    expect(chamadas.map((chamada) => [chamada.caminho, chamada.autorizacao])).toEqual([
      ['/v1/eu', 'Bearer token-1'],
      [sessao.CAMINHO_DA_RENOVACAO, null],
      ['/v1/eu', `Bearer ${TOKEN_NOVO.token}`],
    ])
    expect(sessao.estadoDaSessao()).toBe('aberta')
  })

  it('5xx e queda de rede não deslogam: o token fica e a sessão continua aberta', async () => {
    await comSessaoAberta()
    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor }) }

    responderCom({ status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) })
    expect((await erroDe(sessao.buscarComSessao('/v1/eu', esquema))).codigo).toBe(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)

    responderCom({ status: 0, semRede: true })
    expect((await erroDe(sessao.buscarComSessao('/v1/eu', esquema))).codigo).toBe(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)

    expect(sessao.tokenDeAcesso()).toBe('token-1')
    expect(sessao.estadoDaSessao()).toBe('aberta')
    expect(chamadas.filter((chamada) => chamada.caminho === sessao.CAMINHO_DA_RENOVACAO)).toHaveLength(0)
  })

  it('só o NAO_AUTENTICADO que persiste depois da renovação encerra a sessão, e ela fica vencida, não anônima', async () => {
    await comSessaoAberta()
    responderCom(
      { status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) },
      { status: 200, corpo: TOKEN_NOVO },
      { status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) },
    )

    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor }) }
    expect((await erroDe(sessao.buscarComSessao('/v1/eu', esquema))).codigo).toBe(CodigoDeErro.NAO_AUTENTICADO)
    expect(sessao.tokenDeAcesso()).toBeUndefined()
    // `vencida`, e não `anonima`: a tela continua montada e o login abre por cima dela (20.0). Anônima só pelo
    // "Sair" ou pela aba que abriu sem sessão nenhuma — nos dois a pessoa vai para a entrada e não perde nada.
    expect(sessao.estadoDaSessao()).toBe('vencida')
  })

  it('sem sessão nesta aba, a chamada nem sai: às 10h a inatividade vence em muitas abas ao mesmo tempo', async () => {
    await comSessaoAberta()
    responderCom({ status: 204 })
    await sessao.sair()
    chamadas.length = 0

    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor }) }
    expect((await erroDe(sessao.buscarComSessao('/v1/eu', esquema))).codigo).toBe(CodigoDeErro.NAO_AUTENTICADO)
    expect(chamadas, 'consulta de tela sem sessão não pode virar requisição à API').toEqual([])
  })

  it('token já vencido renova antes de sair, em vez de gastar uma requisição que receberia 401', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-19T12:00:00.000Z') })
    responderCom({ status: 200, corpo: { etapa: 'pronta', ...tokenDe('token-1', '2026-09-19T12:10:00.000Z') } })
    await sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' })
    chamadas.length = 0

    vi.setSystemTime(new Date('2026-09-19T12:11:00.000Z'))
    responderCom({ status: 200, corpo: TOKEN_NOVO }, { status: 200, corpo: { nome: 'Camila' } })
    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor }) }
    await sessao.buscarComSessao('/v1/eu', esquema)

    expect(chamadas.map((chamada) => chamada.caminho)).toEqual([sessao.CAMINHO_DA_RENOVACAO, '/v1/eu'])
  })
})

describe('abrir a sessão ao carregar a página', () => {
  it('renova pelo cookie e abre a sessão, sem token nenhum vindo da URL ou de armazenamento', async () => {
    responderCom({ status: 200, corpo: TOKEN_NOVO })
    await sessao.abrirSessaoPeloCookie()
    expect(sessao.estadoDaSessao()).toBe('aberta')
    expect(sessao.tokenDeAcesso()).toBe(TOKEN_NOVO.token)
    expect(chamadas).toEqual([expect.objectContaining({ caminho: sessao.CAMINHO_DA_RENOVACAO, metodo: 'POST', autorizacao: null })])
  })

  it('cookie que não vale mais deixa a aba anônima, e a rota protegida leva à entrada', async () => {
    responderCom({ status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) })
    await sessao.abrirSessaoPeloCookie()
    expect(sessao.estadoDaSessao()).toBe('anonima')
  })

  it('API fora do ar não desloga: o estado é indisponível, e a nova tentativa abre a sessão', async () => {
    responderCom({ status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) })
    await sessao.abrirSessaoPeloCookie()
    expect(sessao.estadoDaSessao()).toBe('indisponivel')

    responderCom({ status: 200, corpo: TOKEN_NOVO })
    await sessao.abrirSessaoPeloCookie()
    expect(sessao.estadoDaSessao()).toBe('aberta')
  })

  it('avisa quem assina a cada mudança de estado, e para de avisar depois de cancelada', async () => {
    const mudancas: string[] = []
    const cancelar = sessao.assinarSessao(() => mudancas.push(sessao.estadoDaSessao()))
    responderCom({ status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) })
    await sessao.abrirSessaoPeloCookie()
    expect(mudancas).toEqual(['abrindo', 'anonima'])

    cancelar()
    responderCom({ status: 200, corpo: TOKEN_NOVO })
    await sessao.abrirSessaoPeloCookie()
    expect(mudancas).toEqual(['abrindo', 'anonima'])
  })
})

describe('entrada por e-mail', () => {
  it('503 do semáforo é atraso: espera o Retry-After, tenta de novo sozinha e entra, sem erro na tela', async () => {
    vi.useFakeTimers()
    responderCom(
      { status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO), cabecalhos: { 'Retry-After': '3' } },
      { status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO), cabecalhos: { 'Retry-After': '2' } },
      { status: 200, corpo: { etapa: 'pronta', ...TOKEN_NOVO } },
    )

    const entrada = sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' })
    await vi.advanceTimersByTimeAsync(2_999)
    expect(chamadas, 'a web espera o Retry-After antes de tentar de novo').toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    await vi.advanceTimersByTimeAsync(2_000)
    await expect(entrada).resolves.toEqual({ etapa: 'pronta', ...TOKEN_NOVO })
    expect(chamadas).toHaveLength(3)
    expect(sessao.estadoDaSessao()).toBe('aberta')
  })

  it('503 que passa dos 30 s sobe como erro: a pessoa precisa saber que não entrou', async () => {
    vi.useFakeTimers()
    const lenta = { status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO), cabecalhos: { 'Retry-After': '6' } }
    responderCom(...Array.from({ length: 6 }, () => lenta))

    const entrada = sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' })
    const erro = erroDe(entrada)
    await vi.advanceTimersByTimeAsync(sessao.PRAZO_DA_ENTRADA_NO_503_MS + 6_000)
    expect((await erro).codigo).toBe(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
    expect(sessao.estadoDaSessao()).toBe('desconhecida')
  })

  it('Retry-After zerado não vira repetição sem intervalo contra a rota que o semáforo protege', async () => {
    vi.useFakeTimers()
    responderCom(
      { status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO), cabecalhos: { 'Retry-After': '0' } },
      { status: 200, corpo: { etapa: 'pronta', ...TOKEN_NOVO } },
    )

    const entrada = sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' })
    await vi.advanceTimersByTimeAsync(sessao.ESPERA_MINIMA_NO_503_MS - 1)
    // Sem o piso, a escola inteira atrás do mesmo IP repetiria em laço apertado às 7h30.
    expect(chamadas, 'a segunda tentativa saiu antes do piso de espera').toHaveLength(1)
    await vi.advanceTimersByTimeAsync(1)
    await expect(entrada).resolves.toEqual({ etapa: 'pronta', ...TOKEN_NOVO })
    expect(chamadas).toHaveLength(2)
  })

  it('Retry-After maior que o orçamento sobe na hora, em vez de deixar "Entrando…" além dos 30 s', async () => {
    vi.useFakeTimers()
    const comeco = Date.now()
    responderCom({ status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO), cabecalhos: { 'Retry-After': '120' } })

    const erro = await erroDe(sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' }))
    expect(erro.codigo).toBe(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
    expect(chamadas).toHaveLength(1)
    expect(Date.now() - comeco).toBeLessThan(sessao.PRAZO_DA_ENTRADA_NO_503_MS)
  })

  it('sem rede, a entrada avisa na hora: "Entrando…" por trinta segundos esconderia a queda da rede da escola', async () => {
    responderCom({ status: 0, semRede: true })
    const erro = await erroDe(sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' }))
    expect(erro.codigo).toBe(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)
    expect(chamadas).toHaveLength(1)
  })

  it('conta segurada não é repetida sozinha, e o erro leva os segundos do Retry-After para a tela', async () => {
    responderCom({ status: 429, corpo: envelope(CodigoDeErro.CONTA_SEGURADA), cabecalhos: { 'Retry-After': '90' } })
    const erro = await erroDe(sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'errada' }))
    expect(erro.codigo).toBe(CodigoDeErro.CONTA_SEGURADA)
    expect(erro.esperaSegundos).toBe(90)
    expect(chamadas).toHaveLength(1)
  })

  it('etapa que não é pronta não guarda token nenhum: só o desafio, que é da tela da etapa', async () => {
    responderCom({ status: 200, corpo: { etapa: 'mfa', desafio: 'desafio.jwt.aqui' } })
    await expect(sessao.entrarPorEmail({ email: 'renata@escola.test', senha: 'segredo-da-renata' })).resolves.toEqual({ etapa: 'mfa', desafio: 'desafio.jwt.aqui' })
    expect(sessao.tokenDeAcesso()).toBeUndefined()
    expect(sessao.estadoDaSessao()).toBe('desconhecida')
  })
})

describe('sair', () => {
  it('encerra na API com o token e esquece a sessão desta aba, sem rotacionar o cookie', async () => {
    await comSessaoAberta()
    responderCom({ status: 204 })
    await sessao.sair()
    expect(chamadas).toEqual([expect.objectContaining({ caminho: sessao.CAMINHO_DA_SESSAO, metodo: 'DELETE', autorizacao: 'Bearer token-1' })])
    expect(sessao.tokenDeAcesso()).toBeUndefined()
    expect(sessao.estadoDaSessao()).toBe('anonima')
    expect(sessao.saidaPendente()).toBe(false)
  })

  it('API sem resposta não deixa o token na aba, repete uma vez e deixa a saída pendente para a tela avisar', async () => {
    vi.useFakeTimers()
    await comSessaoAberta()
    responderCom({ status: 0, semRede: true }, { status: 0, semRede: true })

    const saida = sessao.sair()
    await vi.advanceTimersByTimeAsync(sessao.ESPERA_ENTRE_TENTATIVAS_DE_SAIDA_MS)
    await saida

    expect(chamadas.map((chamada) => chamada.metodo)).toEqual(['DELETE', 'DELETE'])
    // O computador da escola é compartilhado: o token não fica. Mas o cookie de renovação pode ter sobrevivido, e
    // apresentar isso como saída feita é o que põe a próxima pessoa na sessão da anterior.
    expect(sessao.tokenDeAcesso()).toBeUndefined()
    expect(sessao.estadoDaSessao()).toBe('anonima')
    expect(sessao.saidaPendente()).toBe(true)
  })

  it('a repetição basta quando só a primeira falhou, e aí a saída não fica pendente', async () => {
    vi.useFakeTimers()
    await comSessaoAberta()
    responderCom({ status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) }, { status: 204 })

    const saida = sessao.sair()
    await vi.advanceTimersByTimeAsync(sessao.ESPERA_ENTRE_TENTATIVAS_DE_SAIDA_MS)
    await saida

    expect(chamadas).toHaveLength(2)
    expect(sessao.saidaPendente()).toBe(false)
  })

  it('com o token em dia, o 401 no DELETE é sessão que já não existe: nem repetição, nem aviso', async () => {
    await comSessaoAberta()
    responderCom({ status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) })
    await sessao.sair()
    expect(chamadas).toHaveLength(1)
    expect(sessao.saidaPendente()).toBe(false)
  })

  it('resposta perdida do primeiro DELETE: a repetição recebe 401 e a saída conta como feita, sem aviso à toa', async () => {
    vi.useFakeTimers()
    await comSessaoAberta()
    responderCom({ status: 0, semRede: true }, { status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) })

    const saida = sessao.sair()
    await vi.advanceTimersByTimeAsync(sessao.ESPERA_ENTRE_TENTATIVAS_DE_SAIDA_MS)
    await saida

    expect(chamadas).toHaveLength(2)
    expect(sessao.saidaPendente()).toBe(false)
  })

  it('token vencido: renova antes do DELETE, em vez de contar o 401 da guarda como sessão encerrada', async () => {
    await comSessaoVencida()
    responderCom({ status: 200, corpo: TOKEN_NOVO }, { status: 204 })
    await sessao.sair()

    // Sem a renovação, o DELETE sairia com o JWT vencido, a guarda responderia 401, a web contaria como "não há o
    // que encerrar" — e a sessão continuaria viva, com o cookie devolvendo tudo à pessoa seguinte do carrinho.
    expect(chamadas.map((chamada) => [chamada.caminho, chamada.metodo])).toEqual([
      [sessao.CAMINHO_DA_RENOVACAO, 'POST'],
      [sessao.CAMINHO_DA_SESSAO, 'DELETE'],
    ])
    expect(chamadas.at(-1)?.autorizacao).toBe(`Bearer ${TOKEN_NOVO.token}`)
    expect(sessao.saidaPendente()).toBe(false)
  })

  it('token vencido e cookie recusado: a sessão acabou mesmo, e não há aviso a dar', async () => {
    await comSessaoVencida()
    responderCom({ status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) })
    await sessao.sair()
    expect(chamadas.map((chamada) => chamada.caminho)).toEqual([sessao.CAMINHO_DA_RENOVACAO])
    expect(sessao.saidaPendente()).toBe(false)
  })

  it('token vencido e API fora: a saída fica pendente, sem mandar DELETE nenhum nem fingir que encerrou', async () => {
    await comSessaoVencida()
    responderCom({ status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) })
    await sessao.sair()
    expect(chamadas.map((chamada) => chamada.caminho)).toEqual([sessao.CAMINHO_DA_RENOVACAO])
    expect(sessao.saidaPendente()).toBe(true)
  })

  it('depois do "Sair", nenhum pedido perdido ressuscita a sessão pelo cookie que sobreviveu', async () => {
    vi.useFakeTimers()
    await comSessaoAberta()
    responderCom({ status: 0, semRede: true }, { status: 0, semRede: true })
    const saida = sessao.sair()
    await vi.advanceTimersByTimeAsync(sessao.ESPERA_ENTRE_TENTATIVAS_DE_SAIDA_MS)
    await saida
    chamadas.length = 0

    // A tela que ainda estava montada busca de novo depois da limpeza do cache. Sem a guarda, o 401 dessa busca
    // renovaria pelo cookie ainda válido, reabriria a sessão e apagaria o aviso da saída não confirmada. Desde a
    // 20.0 a busca nem chega a sair da aba, o que fecha o mesmo furo antes: sem sessão, nada vai à API — e por isso
    // nenhuma resposta é preparada aqui: se alguma requisição saísse, ela não teria o que consumir.
    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor }) }
    expect((await erroDe(sessao.buscarComSessao('/v1/eu', esquema))).codigo).toBe(CodigoDeErro.NAO_AUTENTICADO)

    expect(chamadas.map((chamada) => chamada.caminho), 'nenhuma requisição depois do "Sair", muito menos uma renovação').toEqual([])
    expect(sessao.estadoDaSessao()).toBe('anonima')
    expect(sessao.saidaPendente()).toBe(true)
  })

  it('entrar de novo tira o aviso da saída pendente', async () => {
    vi.useFakeTimers()
    await comSessaoAberta()
    responderCom({ status: 0, semRede: true }, { status: 0, semRede: true })
    const saida = sessao.sair()
    await vi.advanceTimersByTimeAsync(sessao.ESPERA_ENTRE_TENTATIVAS_DE_SAIDA_MS)
    await saida
    expect(sessao.saidaPendente()).toBe(true)

    responderCom({ status: 200, corpo: { etapa: 'pronta', ...TOKEN_NOVO } })
    await sessao.entrarPorEmail({ email: 'outra@escola.test', senha: 'segredo-da-outra' })
    expect(sessao.saidaPendente()).toBe(false)
  })
})

describe('fim de sessão', () => {
  it('limpa o que vive fora do módulo (o cache de consultas) em todo caminho que muda o dono da aba', async () => {
    const limpezas: string[] = []
    sessao.aoTrocarDeSessao(() => limpezas.push(sessao.estadoDaSessao()))

    // Entrar também é troca de dono: o que estava no cache é de quem usou este computador antes (20.0).
    await comSessaoAberta()
    expect(limpezas).toEqual(['aberta'])

    responderCom({ status: 204 })
    await sessao.sair()
    // Sem esta limpeza, a pessoa seguinte no Chromebook do carrinho entra e a tela mostra o nome e a escola da
    // anterior, que continuam no cache de `/v1/eu`.
    expect(limpezas).toEqual(['aberta', 'anonima'])

    // O outro caminho: o `NAO_AUTENTICADO` que persiste depois da renovação.
    await comSessaoAberta('token-3')
    responderCom(
      { status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) },
      { status: 200, corpo: TOKEN_NOVO },
      { status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) },
    )
    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor }) }
    await erroDe(sessao.buscarComSessao('/v1/eu', esquema))
    // O último fim é o da sessão que venceu sozinha: o cache sai do mesmo jeito, e só a tela continua de pé.
    expect(limpezas).toEqual(['aberta', 'anonima', 'aberta', 'vencida'])
  })

  it('a renovação de rotina não esvazia nada: é a mesma sessão, e a tela perderia o que está mostrando', async () => {
    vi.useFakeTimers({ now: new Date('2026-09-19T12:00:00.000Z') })
    responderCom({ status: 200, corpo: { etapa: 'pronta', ...tokenDe('token-1', '2026-09-19T12:10:00.000Z') } })
    await sessao.entrarPorEmail({ email: 'camila@escola.test', senha: 'segredo-da-camila' })
    let limpezas = 0
    sessao.aoTrocarDeSessao(() => limpezas++)

    vi.setSystemTime(new Date('2026-09-19T12:11:00.000Z'))
    responderCom({ status: 200, corpo: TOKEN_NOVO }, { status: 200, corpo: { nome: 'Camila' } })
    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor }) }
    await sessao.buscarComSessao('/v1/eu', esquema)

    // A cada 10 min de aula a professora perderia a tela inteira, e a escola somaria uma busca por consulta aberta.
    expect(limpezas).toBe(0)
  })

  it('o pedido que volta recusado depois do "Sair" não é repetido sem credencial, e a aba continua anônima', async () => {
    await comSessaoAberta()
    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor }) }
    // A consulta da tela sai antes do clique em "Sair" e só volta depois dele, recusada: é a recarga da lista que a
    // professora tinha acabado de pedir.
    responderCom({ status: 401, corpo: envelope(CodigoDeErro.NAO_AUTENTICADO) }, { status: 204 })
    const emVoo = erroDe(sessao.buscarComSessao('/v1/vinculos', esquema))
    await sessao.sair()
    expect((await emVoo).codigo).toBe(CodigoDeErro.NAO_AUTENTICADO)

    // Vencida, a rota protegida remontaria a tela da pessoa que acabou de sair, com o login por cima, em vez de
    // levar à entrada — e o Voltar do navegador a traria de volta.
    expect(sessao.estadoDaSessao()).toBe('anonima')
    // E o pedido recusado não foi repetido sem credencial nenhuma depois da saída.
    expect(chamadas.filter((chamada) => chamada.caminho === '/v1/vinculos')).toHaveLength(1)
  })

  it('o "Sair" é final: a inatividade que vence enquanto o DELETE dele está no ar não devolve a aba ao estado vencido', async () => {
    vi.useFakeTimers()
    await comSessaoAberta()
    // Fim de aula, rede da escola oscilando: a professora clica em "Sair" e, no mesmo segundo, o relógio de
    // inatividade vence. A saída é confirmada; o encerramento por inatividade falha, repete uma vez e só então
    // termina — depois de a aba já estar anônima (regra 80, item 7).
    responderCom(
      { status: 204 },
      { status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) },
      { status: 503, corpo: envelope(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO) },
    )
    const saida = sessao.sair()
    const inatividade = sessao.encerrarPorInatividade()
    await vi.advanceTimersByTimeAsync(sessao.ESPERA_ENTRE_TENTATIVAS_DE_SAIDA_MS)
    await Promise.all([saida, inatividade])

    // Vencida, a rota protegida remontaria a área autenticada da pessoa que acabou de sair, com o login por cima, e
    // o Voltar do navegador a traria de volta no Chromebook do carrinho. A saída pedida pela pessoa é final.
    expect(sessao.estadoDaSessao()).toBe('anonima')
    expect(sessao.quemEstaNaSessao()).toBeUndefined()
  })

  it('encerrar de novo não reinicia a limpeza: a tela que ainda estava montada recebe outro NAO_AUTENTICADO', async () => {
    await comSessaoAberta()
    let limpezas = 0
    sessao.aoTrocarDeSessao(() => limpezas++)
    responderCom({ status: 204 })
    await sessao.sair()
    expect(limpezas).toBe(1)

    const esquema = { safeParse: (valor: unknown) => ({ success: true as const, data: valor }) }
    await erroDe(sessao.buscarComSessao('/v1/eu', esquema))
    expect(limpezas).toBe(1)
  })
})
