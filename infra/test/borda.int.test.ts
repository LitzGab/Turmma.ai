import { CodigoDeErro, MENSAGENS_DE_ERRO, NAMESPACE_REALTIME_SISTEMA } from '@educa/shared'
import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { setTimeout as esperar } from 'node:timers/promises'
import type { Socket as SocketCliente } from 'socket.io-client'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { salaDaEscola } from '../../apps/realtime/src/sistema.gateway.js'
import { criarCliente, criarEmissor, ESCOLA_A, tokenDe } from '../../apps/realtime/test/realtime-de-teste.js'
import { lerAmbienteDeTeste, valorObrigatorio } from '../../tools/ci/compose.ts'
import { raizRepositorio } from '../../tools/ci/executar.ts'
import { aguardarSaudavel, compose, composeAssincronoOuFalha, composeOuFalha, PROCESSOS_DA_FILA } from '../../tools/testes/compose.ts'

// Contra o compose de teste, com as imagens construídas: borda (Caddy), duas APIs e dois realtimes.
const ambiente = lerAmbienteDeTeste()
const porta = (variavel: string) => valorObrigatorio(ambiente, variavel)
const BORDA = `http://127.0.0.1:${porta('BORDA_PORTA_HOST')}`
const API_2_DIRETA = `http://127.0.0.1:${porta('API_2_PORTA_HOST')}`

const USUARIO = '0190f5a0-0000-7000-8000-0000000000a1'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const SERVICOS_ATRAS_DA_BORDA = ['api-1', 'api-2', 'realtime-1', 'realtime-2'] as const
/** Sonda da borda a cada 2 s (infra/Caddyfile), com folga: tempo para uma instância voltar ao balanceamento. */
const VOLTA_AO_BALANCEAMENTO_MS = 3_000

async function voltarAoBalanceamento(servico: string): Promise<void> {
  await composeAssincronoOuFalha('start', servico)
  await aguardarSaudavel(servico)
  await esperar(VOLTA_AO_BALANCEAMENTO_MS)
}

interface Resultado {
  pedido: string
  status: number | 'falha-de-rede' | 'pendurada'
  esperado: boolean
}

/**
 * Rajada contínua pela borda, com vários pedidos em paralelo, até `parar` ser chamado. O GET é
 * repetido pela borda se a conexão cair; o POST não, e é ele que mostra requisição derrubada.
 *
 * A rajada é de uma turma, não de um usuário só: os pedidos se revezam entre os `tokens` (alunos da
 * mesma escola) e cada trabalhador espera `pausaMs` entre um e outro, para ninguém passar do próprio
 * rate limit (6.0). A rota anônima fica em um de cada doze pedidos, com folga no limite do IP.
 */
function rajada(
  tokens: readonly string[],
  { paralelos = 12, limitePorRequisicaoMs = 10_000, pausaMs = 50 } = {},
): { parar: () => Promise<Resultado[]> } {
  let ativa = true
  let proximoToken = 0
  const tokenDaVez = () => tokens[proximoToken++ % tokens.length] ?? ''
  const resultados: Resultado[] = []
  const getContexto = {
    nome: 'GET /v1/sistema/contexto',
    executar: (sinal: AbortSignal) => fetch(`${BORDA}/v1/sistema/contexto`, { headers: { Authorization: `Bearer ${tokenDaVez()}` }, signal: sinal }),
    conferir: async (resposta: Response) => resposta.status === 200 && ((await resposta.json()) as { escolaId?: string }).escolaId === ESCOLA_A,
  }
  const postContexto = {
    // Rota que só aceita GET: a API responde 404 tipado. Chegar a ela prova que a instância atendeu.
    nome: 'POST /v1/sistema/contexto',
    executar: (sinal: AbortSignal) =>
      fetch(`${BORDA}/v1/sistema/contexto`, {
        signal: sinal,
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenDaVez()}`, 'Content-Type': 'application/json' },
        body: '{}',
      }),
    conferir: async (resposta: Response) => resposta.status === 404 && ((await resposta.json()) as { erro?: { codigo?: string } }).erro?.codigo === CodigoDeErro.NAO_ENCONTRADO,
  }
  const getSaude = {
    nome: 'GET /saude',
    executar: (sinal: AbortSignal) => fetch(`${BORDA}/saude`, { signal: sinal }),
    conferir: async (resposta: Response) => resposta.status === 200,
  }
  const pedidos = [...Array.from({ length: 11 }, (_, indice) => (indice % 2 === 0 ? getContexto : postContexto)), getSaude]
  const trabalhadores = Array.from({ length: paralelos }, async (_, indice) => {
    let rodada = indice
    while (ativa) {
      const pedido = pedidos[rodada++ % pedidos.length]
      if (pedido === undefined) break
      try {
        const resposta = await pedido.executar(AbortSignal.timeout(limitePorRequisicaoMs))
        resultados.push({ pedido: pedido.nome, status: resposta.status, esperado: await pedido.conferir(resposta) })
      } catch (erro) {
        const pendurada = erro instanceof DOMException && erro.name === 'TimeoutError'
        resultados.push({ pedido: pedido.nome, status: pendurada ? 'pendurada' : 'falha-de-rede', esperado: false })
      }
      await esperar(pausaMs)
    }
  })
  return {
    parar: async () => {
      ativa = false
      await Promise.all(trabalhadores)
      return resultados
    },
  }
}

function inesperados(resultados: Resultado[]): Array<Omit<Resultado, 'esperado'> & { vezes: number }> {
  const contagem = new Map<string, { pedido: string; status: Resultado['status']; vezes: number }>()
  for (const { pedido, status, esperado } of resultados) {
    if (esperado) continue
    const chave = `${pedido} ${status}`
    const atual = contagem.get(chave) ?? { pedido, status, vezes: 0 }
    atual.vezes++
    contagem.set(chave, atual)
  }
  return [...contagem.values()]
}

interface BordaDescartavel {
  endereco: string
  logs: () => string
  remover: () => void
}

/**
 * Um Caddy com o mesmo infra/Caddyfile, numa rede descartável, na frente de um upstream Node que
 * responde por `api-1` e `api-2` com o comportamento que o teste precisa (lento, que cai no meio).
 * Prova a configuração da borda sem depender do tempo das instâncias reais.
 *
 * `realtime-1` e `realtime-2` resolvem para um container sem nada escutando: a sonda deles falha na
 * hora, com conexão recusada, e escreve no log a cada ciclo. Sem esses nomes na rede, a consulta DNS sai
 * do Docker para o resolvedor da máquina e pode passar do `health_timeout` de 3 s: a sonda falha por
 * timeout, e a primeira linha dela chega ao log só uns 3 s depois do boot.
 */
async function subirBordaDescartavel(servidorDoUpstream: string): Promise<BordaDescartavel> {
  const sufixo = `${process.pid}-${Date.now()}`
  const rede = `educa-teste-borda-${sufixo}`
  const upstream = `educa-teste-upstream-${sufixo}`
  const semRealtime = `educa-teste-sem-realtime-${sufixo}`
  const borda = `educa-teste-caddy-${sufixo}`
  const docker = (...argumentos: string[]) => spawnSync('docker', argumentos, { encoding: 'utf8' })
  const remover = () => {
    docker('rm', '--force', borda, upstream, semRealtime)
    docker('network', 'rm', rede)
  }
  const exigir = (resultado: ReturnType<typeof docker>) => {
    if (resultado.status !== 0) {
      remover()
      throw new Error(`docker falhou: ${resultado.stderr}`)
    }
    return resultado.stdout
  }
  exigir(docker('network', 'create', rede))
  exigir(docker('run', '--detach', '--name', upstream, '--network', rede, '--network-alias', 'api-1', '--network-alias', 'api-2',
    'node:22.23.2-alpine3.23', 'node', '-e', servidorDoUpstream))
  exigir(docker('run', '--detach', '--name', semRealtime, '--network', rede, '--network-alias', 'realtime-1', '--network-alias', 'realtime-2',
    'node:22.23.2-alpine3.23', 'node', '-e', 'setInterval(() => {}, 1 << 30)'))
  exigir(docker('run', '--detach', '--name', borda, '--network', rede, '--publish', '127.0.0.1::8080',
    '--volume', `${join(raizRepositorio, 'infra/Caddyfile')}:/etc/caddy/Caddyfile:ro`, 'caddy:2.11.4-alpine'))
  const endereco = `http://${exigir(docker('port', borda, '8080')).trim().split('\n')[0]}`
  const logs = () => {
    const resultado = docker('logs', borda)
    return `${resultado.stdout}${resultado.stderr}`
  }
  return { endereco, logs, remover }
}

describe('borda com duas APIs e dois realtimes', () => {
  let token: string
  /** Alunos da escola A para as rajadas: cada um fica bem abaixo do próprio limite por minuto. */
  let turma: string[]

  beforeAll(async () => {
    token = await tokenDe(ESCOLA_A, USUARIO)
    turma = await Promise.all(Array.from({ length: 200 }, () => tokenDe(ESCOLA_A, randomUUID())))
    // A observabilidade também, como o compose a configura: as APIs e os realtimes exportam para
    // `observabilidade`. Com o serviço parado, o nome não existe na rede, a consulta DNS sai do Docker para
    // o resolvedor da máquina e pode levar uns 3 s, e a consulta pendente atrasa a saída do processo no
    // SIGTERM. O atraso fica depois da drenagem, na saída do processo, e somava até uns 3 s ao tempo que os
    // casos de parada medem.
    await composeAssincronoOuFalha('up', '--detach', '--build', '--wait', '--remove-orphans', 'borda', 'observabilidade')
  }, 900_000)

  afterAll(async () => {
    // Derruba só o que este arquivo subiu: os outros testes de integração não contam com eles de pé.
    await composeAssincronoOuFalha('stop', 'borda', 'observabilidade', ...SERVICOS_ATRAS_DA_BORDA, ...PROCESSOS_DA_FILA)
  }, 120_000)

  describe('troca de instância da API', () => {
    it('`docker compose restart api-1` no meio de uma rajada contínua dá zero 502 e zero erro cru', async () => {
      const carga = rajada(turma)
      await esperar(1_000)
      await composeAssincronoOuFalha('restart', 'api-1')
      await aguardarSaudavel('api-1')
      // Segue a rajada até a api-1 voltar ao balanceamento, para a volta também passar pela prova.
      await esperar(VOLTA_AO_BALANCEAMENTO_MS)
      const resultados = await carga.parar()

      expect(resultados.length).toBeGreaterThan(300)
      expect(inesperados(resultados)).toEqual([])
    }, 120_000)

    it('no SIGTERM, /prontidao vai a 503 na hora, a instância segue atendendo durante a espera da borda e sai com código 0 dentro do prazo', async () => {
      const esperaDaBordaMs = Number(porta('DRENAGEM_ESPERA_BORDA_MS'))
      const prazoMs = Number(porta('DRENAGEM_PRAZO_MS'))
      const inicio = performance.now()
      await composeAssincronoOuFalha('kill', '--signal', 'SIGTERM', 'api-2')
      await expect
        .poll(async () => (await fetch(`${API_2_DIRETA}/prontidao`).catch(() => undefined))?.status, { timeout: 1_000, interval: 50 })
        .toBe(503)

      // Até o fim da espera, requisição que a borda ainda mande é atendida.
      await esperar(Math.max(0, esperaDaBordaMs - 1_000 - (performance.now() - inicio)))
      const aindaAtende = await fetch(`${API_2_DIRETA}/v1/sistema/contexto`, { headers: { Authorization: `Bearer ${token}` } })
      expect(aindaAtende.status).toBe(200)

      await expect
        .poll(() => compose('ps', '--all', '--format', '{{.State}} {{.ExitCode}}', 'api-2').saida.trim(), { timeout: prazoMs, interval: 100 })
        .toBe('exited 0')
      const saiuEmMs = performance.now() - inicio
      expect(saiuEmMs).toBeGreaterThanOrEqual(esperaDaBordaMs)
      expect(saiuEmMs).toBeLessThan(prazoMs)
      await voltarAoBalanceamento('api-2')
    }, 120_000)

    // Enquanto a sonda não percebe (até health_interval × health_fails + timeout, ~8 s), a requisição que
    // cai na instância travada espera por ela: é o preço de não tirar instância só lenta do ar.
    it('uma API trava durante a aula: detectada pela sonda, sai do balanceamento e a outra atende tudo sem pendurar', async () => {
      composeOuFalha('pause', 'api-1')
      try {
        // Duas rodadas da sonda com timeout de 3 s, com folga.
        await esperar(10_000)
        const carga = rajada(turma, { paralelos: 6, limitePorRequisicaoMs: 1_500 })
        await esperar(3_000)
        const resultados = await carga.parar()

        expect(resultados.length).toBeGreaterThan(100)
        expect(inesperados(resultados)).toEqual([])
      } finally {
        compose('unpause', 'api-1')
      }
      await aguardarSaudavel('api-1')
      await esperar(VOLTA_AO_BALANCEAMENTO_MS)
    }, 120_000)

    it('as duas APIs lentas ao mesmo tempo (manhã de segunda): a borda espera por elas em vez de tirar as duas do ar', async () => {
      // Toda resposta, a sonda incluída, leva 1,2 s nas duas instâncias.
      const borda = await subirBordaDescartavel(
        "require('node:http').createServer((_pedido, resposta) => setTimeout(() => resposta.end('{}'), 1200)).listen(3000)",
      )
      try {
        await expect.poll(async () => (await fetch(`${borda.endereco}/ok`).catch(() => undefined))?.status, { timeout: 20_000, interval: 500 }).toBe(200)
        // Várias rodadas da sonda lenta, com requisição chegando o tempo todo.
        const statuses: number[] = []
        const fim = performance.now() + 12_000
        await Promise.all(
          Array.from({ length: 4 }, async () => {
            while (performance.now() < fim) statuses.push((await fetch(`${borda.endereco}/v1/qualquer`, { signal: AbortSignal.timeout(8_000) })).status)
          }),
        )
        expect(statuses.length).toBeGreaterThan(20)
        expect(statuses.filter((status) => status !== 200)).toEqual([])
      } finally {
        borda.remover()
      }
    }, 120_000)

    it('a sonda da borda é interna: /prontidao não sai pela borda, em nenhuma grafia', async () => {
      // Com barra e maiúscula: o Express atenderia essas grafias como a mesma rota.
      for (const caminho of ['/prontidao', '/Prontidao/', '/PRONTIDAO', '/prontidao/x']) {
        expect((await fetch(`${BORDA}${caminho}`)).status, caminho).toBe(404)
      }
    })
  })

  describe('API não depende do resto (RF2)', () => {
    const essenciais = new Set(['borda', 'api-1', 'api-2', 'postgres'])
    let parados: string[] = []

    afterEach(async () => {
      for (const servico of parados) await composeAssincronoOuFalha('start', servico)
      for (const servico of parados) await aguardarSaudavel(servico)
      parados = []
      await esperar(VOLTA_AO_BALANCEAMENTO_MS)
    }, 180_000)

    it('com worker, despachante, realtime, Redis e storage parados, a API segue respondendo pela borda', async () => {
      await composeAssincronoOuFalha('up', '--detach', '--build', '--wait', ...PROCESSOS_DA_FILA)
      // Tudo que não é borda, API ou Postgres e está de pé (o migrar já saiu).
      parados = composeOuFalha('config', '--services')
        .trim()
        .split('\n')
        .filter((servico) => !essenciais.has(servico) && compose('ps', '--status', 'running', '--quiet', servico).saida.trim() !== '')
      expect(parados).toEqual(expect.arrayContaining([...PROCESSOS_DA_FILA, 'realtime-1', 'realtime-2', 'redis-fila', 'redis-cache', 'storage']))
      await composeAssincronoOuFalha('stop', ...parados)

      const carga = rajada(turma, { paralelos: 6 })
      await esperar(3_000)
      const resultados = await carga.parar()

      expect(resultados.length).toBeGreaterThan(50)
      expect(inesperados(resultados)).toEqual([])
    }, 180_000)
  })

  describe('realtime pela borda', () => {
    const clientes: SocketCliente[] = []

    afterEach(() => {
      for (const cliente of clientes.splice(0)) cliente.disconnect()
    })

    async function pollingPelaBorda(cookie?: string): Promise<{ sid: string; cookie: string | undefined }> {
      const abertura = await fetch(`${BORDA}/socket.io/?EIO=4&transport=polling`, cookie === undefined ? {} : { headers: { Cookie: cookie } })
      expect(abertura.status).toBe(200)
      const corpo = await abertura.text()
      const { sid } = JSON.parse(corpo.slice(1)) as { sid: string }
      return { sid, cookie: abertura.headers.get('set-cookie')?.split(';')[0] ?? cookie }
    }

    function enviarPacote(sid: string, pacote: string, cookie?: string): Promise<Response> {
      return fetch(`${BORDA}/socket.io/?EIO=4&transport=polling&sid=${sid}`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8', ...(cookie === undefined ? {} : { Cookie: cookie }) },
        body: pacote,
      })
    }

    it('handshake por polling fica na mesma instância pelo cookie da borda, e autentica no pacote de conexão', async () => {
      const { sid, cookie } = await pollingPelaBorda()
      expect(cookie).toMatch(/^educa_realtime=[0-9a-f]+$/)

      expect((await enviarPacote(sid, `40${NAMESPACE_REALTIME_SISTEMA},${JSON.stringify({ token })}`, cookie)).status).toBe(200)
      const conexao = await fetch(`${BORDA}/socket.io/?EIO=4&transport=polling&sid=${sid}`, { headers: { Cookie: cookie ?? '' } })
      expect(await conexao.text()).toMatch(new RegExp(`^40${NAMESPACE_REALTIME_SISTEMA},\\{"sid":"[^"]+"\\}`))

      const comCookie = await Promise.all(Array.from({ length: 20 }, () => enviarPacote(sid, '42/sistema,["qualquer"]', cookie)))
      expect(comCookie.map((resposta) => resposta.status)).toEqual(Array.from({ length: 20 }, () => 200))
    })

    it('sem o cookie, a mesma sessão cai na outra instância: a borda tem as duas, e é o cookie que prende', async () => {
      const { sid } = await pollingPelaBorda()
      const semCookie = []
      for (let tentativa = 0; tentativa < 20; tentativa++) semCookie.push((await enviarPacote(sid, '6')).status)
      expect(semCookie).toContain(400)
    })

    it('um realtime morre e os clientes reconectam na outra instância, com espalhamento, e seguem recebendo a emissão da escola', async () => {
      const emissor = await criarEmissor()
      const TOTAL = 20
      const quedas = new Map<SocketCliente, number>()
      const voltas: Array<{ cliente: SocketCliente; atrasoMs: number }> = []
      try {
        for (let indice = 0; indice < TOTAL; indice++) {
          const cliente = criarCliente(BORDA, token)
          clientes.push(cliente)
          cliente.on('disconnect', () => quedas.set(cliente, performance.now()))
          cliente.on('connect', () => {
            const caiuEm = quedas.get(cliente)
            if (caiuEm !== undefined) voltas.push({ cliente, atrasoMs: performance.now() - caiuEm })
          })
          cliente.connect()
        }
        const recebidos = new Map<SocketCliente, string[]>(clientes.map((cliente) => [cliente, []]))
        for (const cliente of clientes) cliente.on('sistema.teste', ({ marca }: { marca: string }) => recebidos.get(cliente)?.push(marca))

        const todosRecebem = async (marca: string) => {
          await expect.poll(() => clientes.every((cliente) => cliente.connected), { timeout: 30_000 }).toBe(true)
          // Sala tomada de novo depois da reconexão: a emissão só vale depois que todos voltaram.
          await esperar(300)
          emissor.servidor.of(NAMESPACE_REALTIME_SISTEMA).to(salaDaEscola(ESCOLA_A)).emit('sistema.teste', { marca })
          await expect.poll(() => clientes.filter((cliente) => !recebidos.get(cliente)?.includes(marca)).length, { timeout: 10_000 }).toBe(0)
        }

        await todosRecebem('antes')

        // Primeira queda: parada graciosa (SIGTERM). A instância drena e sai limpa, dentro do prazo.
        const voltasAntes = voltas.length
        const inicioDaParada = performance.now()
        await composeAssincronoOuFalha('stop', 'realtime-1')
        const paradaMs = performance.now() - inicioDaParada
        expect(compose('ps', '--all', '--format', '{{.State}} {{.ExitCode}}', 'realtime-1').saida.trim()).toBe('exited 0')
        expect(paradaMs).toBeGreaterThanOrEqual(Number(porta('DRENAGEM_ESPERA_BORDA_MS')))
        expect(paradaMs).toBeLessThan(Number(porta('DRENAGEM_PRAZO_MS')))
        await todosRecebem('sem-realtime-1')
        const voltasDaPrimeiraQueda = voltas.slice(voltasAntes)
        await voltarAoBalanceamento('realtime-1')

        // Segunda queda: parada graciosa com os 20 clientes na realtime-2. Com a borda já sabendo da
        // saída, a primeira tentativa de cada um dá certo, e o atraso da volta é o sorteio da reconexão.
        const voltasAntesDaSegunda = voltas.length
        await composeAssincronoOuFalha('stop', 'realtime-2')
        await todosRecebem('sem-realtime-2')
        const voltasDaSegundaQueda = voltas.slice(voltasAntesDaSegunda)
        await voltarAoBalanceamento('realtime-2')

        // Terceira queda: a instância morre de vez (SIGKILL), agora com os 20 clientes na realtime-1.
        const voltasAntesDaTerceira = voltas.length
        await composeAssincronoOuFalha('kill', '--signal', 'SIGKILL', 'realtime-1')
        await todosRecebem('sem-realtime-1-morta')
        const voltasDaTerceiraQueda = voltas.slice(voltasAntesDaTerceira)
        await voltarAoBalanceamento('realtime-1')

        // A borda espalhou os clientes: parte estava na realtime-1 e voltou pela realtime-2.
        expect(voltasDaPrimeiraQueda.length).toBeGreaterThan(0)
        expect(voltasDaPrimeiraQueda.length).toBeLessThan(TOTAL)
        // Nas quedas seguintes os 20 estavam na mesma instância: todos caíram com ela e voltaram.
        expect(new Set(voltasDaSegundaQueda.map((volta) => volta.cliente)).size).toBe(TOTAL)
        expect(new Set(voltasDaTerceiraQueda.map((volta) => volta.cliente)).size).toBe(TOTAL)
        const atrasos = voltasDaSegundaQueda.map((volta) => volta.atrasoMs)
        // Espalhamento aleatório: 20 clientes derrubados no mesmo instante não voltam no mesmo instante.
        expect(Math.max(...atrasos) - Math.min(...atrasos)).toBeGreaterThan(300)
      } finally {
        await emissor.fechar()
      }
    }, 180_000)
  })

  describe('nada de requisição no log', () => {
    it('a borda não registra acesso nem a URL de requisição que falhou, e o realtime não registra a query do handshake', async () => {
      const sentinela = `sentinela-${Date.now()}`
      const desde = new Date(Date.now() - 1_000).toISOString()
      await fetch(`${BORDA}/saude?nome=${sentinela}`)
      await fetch(`${BORDA}/rota-que-nao-existe?matricula=${sentinela}`)
      await fetch(`${BORDA}/socket.io/?EIO=4&transport=polling&sid=inexistente&token=${sentinela}`)
      const cliente = criarCliente(BORDA, token, { query: { nome: sentinela } })
      await new Promise<void>((resolver) => {
        cliente.once('connect', () => resolver())
        cliente.connect()
      })
      cliente.disconnect()

      // Com os dois realtimes fora, a borda devolve erro dela mesma para o /socket.io: o caso que
      // o log de erro por requisição do Caddy registraria com a URL inteira.
      await composeAssincronoOuFalha('stop', 'realtime-1', 'realtime-2')
      try {
        const semRealtime = await fetch(`${BORDA}/socket.io/?EIO=4&transport=polling&token=${sentinela}`)
        // Nem 502 vazio: o envelope tipado da API, com id de requisição gerado na borda.
        expect(semRealtime.status).toBe(503)
        expect(semRealtime.headers.get('retry-after')).toBe('5')
        expect(semRealtime.headers.get('content-type')).toContain('application/json')
        expect(await semRealtime.json()).toEqual({
          erro: {
            codigo: CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO,
            mensagem: MENSAGENS_DE_ERRO.INDISPONIVEL_TENTE_DE_NOVO,
            requisicaoId: expect.stringMatching(UUID),
          },
        })
      } finally {
        await voltarAoBalanceamento('realtime-1')
        await voltarAoBalanceamento('realtime-2')
      }

      const logs = composeOuFalha('logs', '--no-color', '--since', desde, 'borda', ...SERVICOS_ATRAS_DA_BORDA)
      expect(logs.length).toBeGreaterThan(0)
      expect(logs).not.toContain(sentinela)
      expect(composeOuFalha('logs', '--no-color', '--since', desde, 'borda')).not.toMatch(/"logger":"http\.(log\.(access|error)|handlers\.reverse_proxy")/)
    }, 180_000)

    it('resposta interrompida no meio (upstream que cai, cliente que desiste) não leva URL, IP nem User-Agent ao log da borda', async () => {
      // O caso do aluno que fecha a aba no meio da resposta, e do upstream que cai depois dos cabeçalhos.
      const borda = await subirBordaDescartavel([
        "require('node:http').createServer((pedido, resposta) => {",
        "  if (pedido.url.startsWith('/lento')) { resposta.writeHead(200); resposta.write('a'); return }",
        "  if (pedido.url.startsWith('/cai')) { resposta.writeHead(200); resposta.write('a'); setTimeout(() => pedido.socket.destroy(), 100); return }",
        "  resposta.end('{}')",
        '}).listen(3000)',
      ].join('\n'))
      const sentinela = `sentinela-interrompida-${Date.now()}`
      try {
        await expect.poll(async () => (await fetch(`${borda.endereco}/ok`).catch(() => undefined))?.status, { timeout: 20_000, interval: 250 }).toBe(200)

        const desistencia = new AbortController()
        const lenta = await fetch(`${borda.endereco}/lento?nome=${sentinela}`, { signal: desistencia.signal })
        expect(lenta.status).toBe(200)
        desistencia.abort()
        const caida = await fetch(`${borda.endereco}/cai?nome=${sentinela}`)
        await expect(caida.text()).rejects.toThrow()

        // O log da sonda continua: é ele que mostra instância fora do balanceamento (aqui, os realtimes).
        // E serve de marco para ler o log completo: a borda escreve sobre o /cai antes de fechar a conexão
        // que fez o `caida.text()` rejeitar, então uma linha da sonda com horário posterior chega ao log depois
        // dela. O /lento, abortado antes, entra com a folga dos 100 ms do /cai e das duas idas e voltas.
        const interrompidasAteS = Date.now() / 1_000
        const sondaDepoisDasInterrupcoes = (): boolean =>
          borda
            .logs()
            .split('\n')
            .some((linha) => linha.includes('"logger":"http.handlers.reverse_proxy.health_checker.active"') && Number(/"ts":([\d.]+)/.exec(linha)?.[1]) > interrompidasAteS)
        // Sonda a cada 2 s (health_interval), com folga.
        await expect.poll(sondaDepoisDasInterrupcoes, { timeout: 10_000, interval: 250 }).toBe(true)

        const texto = borda.logs()
        expect(texto).not.toContain(sentinela)
        expect(texto).not.toMatch(/"logger":"http\.handlers\.reverse_proxy"/)
      } finally {
        borda.remover()
      }
    }, 120_000)
  })
})
