import { describe, expect, it } from 'vitest'
import { lerAmbienteExemplo } from '../../../tools/ci/compose.ts'
import { ConfiguracaoInvalida, lerConfiguracao, MOTIVO_AVISOS_SEM_JSON, MOTIVO_ROTAS_SINTETICAS_EM_PRODUCAO } from './config.js'

const ambienteValido = {
  API_PORTA: '3000',
  BANCO_URL: 'postgres://educa:senha_sintetica_xyz@postgres:5432/educa',
  BANCO_POOL_MAXIMO: '10',
  BANCO_TIMEOUT_CONEXAO_MS: '2000',
  BANCO_TIMEOUT_CONSULTA_MS: '1500',
  AMBIENTE: 'local',
  IDENTIDADE_CHAVE_ASSINATURA: 'chave_sintetica_de_teste_com_32_caracteres',
  DRENAGEM_ESPERA_BORDA_MS: '4000',
  DRENAGEM_PRAZO_MS: '10000',
  REDIS_CACHE_URL: 'redis://redis-cache:6379',
  REDIS_FILA_URL: 'redis://redis-fila:6379',
  LIMITE_REQ_USUARIO_MIN: '120',
  LIMITE_REQ_ESCOLA_MIN: '30000',
  LIMITE_REQ_IP_ANONIMO_MIN: '3000',
  LIMITE_INSTANCIAS_API: '2',
  LIMITE_PROXIES_CONFIAVEIS: 'borda',
  ROTAS_SINTETICAS: 'false',
  VERSAO: 'local',
  AVISOS_SISTEMA: '[]',
  TELEMETRIA_OTLP_URL: 'http://observabilidade:4318/',
  TELEMETRIA_INTERVALO_MS: '5000',
}

function erroDe(ambiente: Record<string, string | undefined>): ConfiguracaoInvalida {
  try {
    lerConfiguracao(ambiente)
  } catch (erro) {
    if (erro instanceof ConfiguracaoInvalida) return erro
    throw erro
  }
  throw new Error('a configuração deveria ter sido recusada')
}

describe('lerConfiguracao', () => {
  it('converte o ambiente em configuração tipada', () => {
    expect(lerConfiguracao(ambienteValido)).toEqual({
      porta: 3000,
      rotasSinteticas: false,
      versao: 'local',
      avisos: [],
      redisFilaUrl: 'redis://redis-fila:6379',
      banco: {
        url: ambienteValido.BANCO_URL,
        maximoConexoes: 10,
        timeoutConexaoMs: 2000,
        timeoutConsultaMs: 1500,
      },
      identidade: {
        ambiente: 'local',
        chaveAssinatura: new TextEncoder().encode(ambienteValido.IDENTIDADE_CHAVE_ASSINATURA),
      },
      drenagem: { esperaDaBordaMs: 4000, prazoMs: 10000 },
      limite: {
        redisCacheUrl: 'redis://redis-cache:6379',
        porUsuarioMin: 120,
        porEscolaMin: 30000,
        porIpAnonimoMin: 3000,
        instancias: 2,
        proxiesConfiaveis: ['borda'],
      },
      telemetria: { otlpUrl: 'http://observabilidade:4318', intervaloMs: 5000 },
    })
  })

  it.each(Object.keys(ambienteValido))(
    'não sobe sem %s: limite e endereço são configuração, nunca valor escondido no código',
    (variavel) => {
      const incompleto: Record<string, string | undefined> = { ...ambienteValido, [variavel]: undefined }
      expect(erroDe(incompleto).variaveis).toEqual([variavel])
    },
  )

  it('aponta todas as variáveis inválidas pelo nome e nunca repete o valor, que pode ter senha ou chave', () => {
    const urlComSenhaInvalida = 'mysql://educa:senha_sintetica_xyz@postgres/educa'
    const chaveCurta = 'chave_curta_sintetica'
    const erro = erroDe({ ...ambienteValido, BANCO_URL: urlComSenhaInvalida, API_PORTA: '0', IDENTIDADE_CHAVE_ASSINATURA: chaveCurta })
    expect(erro.variaveis).toEqual(['API_PORTA', 'BANCO_URL', 'IDENTIDADE_CHAVE_ASSINATURA'])
    expect(erro.message).not.toContain('senha_sintetica_xyz')
    expect(erro.message).not.toContain(chaveCurta)
  })

  it('não sobe com a espera da borda igual ou maior que o prazo da drenagem: nenhuma requisição terminaria', () => {
    expect(erroDe({ ...ambienteValido, DRENAGEM_ESPERA_BORDA_MS: '10000' }).variaveis).toEqual(['DRENAGEM_ESPERA_BORDA_MS'])
    expect(erroDe({ ...ambienteValido, DRENAGEM_ESPERA_BORDA_MS: '12000' }).variaveis).toEqual(['DRENAGEM_ESPERA_BORDA_MS'])
  })

  it.each([
    ['LIMITE_REQ_USUARIO_MIN', '0'],
    ['LIMITE_REQ_ESCOLA_MIN', '-1'],
    ['LIMITE_REQ_IP_ANONIMO_MIN', '1.5'],
    ['LIMITE_INSTANCIAS_API', 'duas'],
    ['LIMITE_PROXIES_CONFIAVEIS', ' , '],
    ['LIMITE_PROXIES_CONFIAVEIS', 'http://borda:8080'],
    ['REDIS_CACHE_URL', 'redis-cache:6379'],
    ['REDIS_FILA_URL', 'http://redis-fila:6379'],
  ])('não sobe com %s=%s: limite sem valor válido não vira "sem limite"', (variavel, valor) => {
    expect(erroDe({ ...ambienteValido, [variavel]: valor }).variaveis).toEqual([variavel])
  })

  it('.env.example traz os padrões da Tech Spec: 120/min por usuário, 30.000/min por escola, 3.000/min por IP anônimo, duas instâncias e a borda', () => {
    const exemplo = lerAmbienteExemplo()
    const { limite } = lerConfiguracao({ ...ambienteValido, ...exemplo, API_PORTA: '3000', BANCO_URL: ambienteValido.BANCO_URL, REDIS_CACHE_URL: ambienteValido.REDIS_CACHE_URL, REDIS_FILA_URL: ambienteValido.REDIS_FILA_URL })
    expect(limite).toMatchObject({ porUsuarioMin: 120, porEscolaMin: 30_000, porIpAnonimoMin: 3_000, instancias: 2, proxiesConfiaveis: ['borda'] })
  })

  it('aceita mais de um proxy confiável, por nome ou IP, separados por vírgula', () => {
    const config = lerConfiguracao({ ...ambienteValido, LIMITE_PROXIES_CONFIAVEIS: 'borda, 10.0.0.2,fd00::1' })
    expect(config.limite.proxiesConfiaveis).toEqual(['borda', '10.0.0.2', 'fd00::1'])
  })

  it('sobe em produção sem nenhuma variável a mais: a flag do token sintético do F0 não existe mais', () => {
    const config = lerConfiguracao({ ...ambienteValido, AMBIENTE: 'producao' })
    expect(config.identidade.ambiente).toBe('producao')
  })

  it('ROTAS_SINTETICAS liga a rota de teste só quando é exatamente true, e não sobe ligada em produção', () => {
    expect(lerConfiguracao({ ...ambienteValido, ROTAS_SINTETICAS: 'true' }).rotasSinteticas).toBe(true)
    for (const valor of ['1', 'TRUE', '', 'sim']) {
      expect(erroDe({ ...ambienteValido, ROTAS_SINTETICAS: valor }).variaveis).toEqual(['ROTAS_SINTETICAS'])
    }
    const emProducao = erroDe({ ...ambienteValido, AMBIENTE: 'producao', ROTAS_SINTETICAS: 'true' })
    expect(emProducao.variaveis).toEqual(['ROTAS_SINTETICAS'])
    expect(emProducao.message).toContain(MOTIVO_ROTAS_SINTETICAS_EM_PRODUCAO)
  })

  it('AVISOS_SISTEMA vira a lista de avisos, e JSON quebrado ou aviso fora do formato não sobe', () => {
    const aviso = { id: 'manutencao-sabado', texto: 'Manutenção programada no sábado, das 8h às 10h.', publicadoEm: '2026-09-13' }
    expect(lerConfiguracao({ ...ambienteValido, AVISOS_SISTEMA: JSON.stringify([aviso]) }).avisos).toEqual([aviso])

    const semJson = erroDe({ ...ambienteValido, AVISOS_SISTEMA: '[{"id":' })
    expect(semJson.variaveis).toEqual(['AVISOS_SISTEMA'])
    expect(semJson.message).toContain(MOTIVO_AVISOS_SEM_JSON)
    for (const invalido of [
      '{}',
      JSON.stringify([{ ...aviso, publicadoEm: '13/09/2026' }]),
      JSON.stringify([{ ...aviso, texto: '' }]),
      JSON.stringify([{ ...aviso, escolaId: '0190f5a0-0000-7000-8000-00000000000a' }]),
      JSON.stringify(Array.from({ length: 11 }, (_, indice) => ({ ...aviso, id: `aviso-${indice}` }))),
    ]) {
      expect(erroDe({ ...ambienteValido, AVISOS_SISTEMA: invalido }).variaveis, invalido).toEqual(['AVISOS_SISTEMA'])
    }
  })

  it('VERSAO só aceita um identificador curto, sem espaço nem barra', () => {
    expect(lerConfiguracao({ ...ambienteValido, VERSAO: '3d4099c' }).versao).toBe('3d4099c')
    for (const valor of ['', 'v 1', '../etc', 'x'.repeat(65)]) {
      expect(erroDe({ ...ambienteValido, VERSAO: valor }).variaveis).toEqual(['VERSAO'])
    }
  })
})
