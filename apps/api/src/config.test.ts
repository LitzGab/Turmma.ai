import { hkdfSync } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { lerAmbienteDeCarga, lerAmbienteDeTeste, lerAmbienteExemplo } from '../../../tools/ci/compose.ts'
import { TIMEOUT_COMANDO_REDIS_API_MS, TIMEOUT_COMANDO_REDIS_FILA_MS } from '@educa/nucleo'
import { ConfiguracaoInvalida, lerConfiguracao, MOTIVO_AVISOS_SEM_JSON, MOTIVO_ROTAS_SINTETICAS_EM_PRODUCAO } from './config.js'
import { lerConfiguracaoLogin, MOTIVO_PRAZO_DO_REDIS_DO_LOGIN, PRAZO_MINIMO_DO_REDIS_DO_LOGIN_MS } from './sessao/configuracao-de-login.js'

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
  LIMITE_REQ_OPERADOR_MIN: '120',
  LIMITE_INSTANCIAS_API: '2',
  LIMITE_PROXIES_CONFIAVEIS: 'borda',
  ROTAS_SINTETICAS: 'false',
  VERSAO: 'local',
  AVISOS_SISTEMA: '[]',
  TELEMETRIA_OTLP_URL: 'http://observabilidade:4318/',
  TELEMETRIA_INTERVALO_MS: '5000',
  LOGIN_ARGON2_MEMORIA_KIB: '19456',
  LOGIN_ARGON2_ITERACOES: '2',
  LOGIN_HASH_CONCORRENCIA: '2',
  LOGIN_PROTECAO_DESLIGADA: 'false',
  UV_THREADPOOL_SIZE: '16',
  LIMITE_LOGIN_EMAIL_IP_MIN: '60',
  LOGIN_REDIS_PRAZO_MS: '100',
  LOGIN_CHAVE_CONTADOR: 'chave_sintetica_do_contador_com_32_caracteres',
  LOGIN_CHAVE_DISPOSITIVO_VERSAO: '1',
  LOGIN_CHAVE_DISPOSITIVO_V1: 'chave_sintetica_do_dispositivo_com_32_caracteres',
  IDENTIDADE_CHAVE_CIFRA_VERSAO: '1',
  IDENTIDADE_CHAVE_CIFRA_V1: 'chave_sintetica_da_cifra_do_mfa_com_32_caracteres',
  IDENTIDADE_CHAVE_RECUPERACAO: 'chave_sintetica_da_recuperacao_com_32_caracteres',
}

/** A chave AES-256 que o HKDF deriva do texto da variável, como a configuração faz. */
function chaveDerivada(texto: string): Uint8Array {
  return new Uint8Array(hkdfSync('sha256', texto, new Uint8Array(0), 'educa.mfa.segredo.aes-256-gcm', 32))
}

/** O erro de `lerConfiguracaoLogin` chamada direto, para o que `lerConfiguracao` não alcança. */
function erroDeLogin(ambiente: Record<string, string | undefined>): ConfiguracaoInvalida {
  try {
    lerConfiguracaoLogin(ambiente)
  } catch (erro) {
    if (erro instanceof ConfiguracaoInvalida) return erro
    throw erro
  }
  throw new Error('a configuração do login deveria ter sido recusada')
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
        porOperadorMin: 120,
        instancias: 2,
        proxiesConfiaveis: ['borda'],
      },
      telemetria: { otlpUrl: 'http://observabilidade:4318', intervaloMs: 5000 },
      login: {
        hash: { memoriaKib: 19_456, iteracoes: 2 },
        concorrenciaDoHash: 2,
        protecaoDesligada: false,
        prazoDoRedisMs: TIMEOUT_COMANDO_REDIS_API_MS,
        limiteEmailPorIpMin: 60,
        chaveContador: new TextEncoder().encode(ambienteValido.LOGIN_CHAVE_CONTADOR),
        dispositivo: { versao: 1, chave: new TextEncoder().encode(ambienteValido.LOGIN_CHAVE_DISPOSITIVO_V1) },
        mfa: {
          versaoCifra: 1,
          chavesCifra: new Map([[1, chaveDerivada(ambienteValido.IDENTIDADE_CHAVE_CIFRA_V1)]]),
          chaveRecuperacao: new TextEncoder().encode(ambienteValido.IDENTIDADE_CHAVE_RECUPERACAO),
        },
      },
      // Sem as variáveis de provedor, o login pela conta da escola fica desligado, e a API sobe igual (13.0).
      loginExterno: { provedores: new Map(), retorno: undefined, chaveDoCookie: undefined, aceitaEmissorSemTls: true },
    })
  })

  it('o login pela conta da escola meio configurado reprova o boot junto com as outras variáveis', () => {
    const erro = erroDe({ ...ambienteValido, LOGIN_EXTERNO_GOOGLE_EMISSOR: 'https://accounts.google.com' })
    expect(erro.variaveis).toEqual(['LOGIN_EXTERNO_GOOGLE_CLIENTE', 'LOGIN_EXTERNO_GOOGLE_EMISSOR', 'LOGIN_EXTERNO_GOOGLE_SEGREDO'])
  })

  it.each([
    ['LOGIN_ARGON2_MEMORIA_KIB', '19455'],
    ['LOGIN_ARGON2_ITERACOES', '1'],
    ['LOGIN_CHAVE_CONTADOR', 'curta_sintetica'],
    ['LOGIN_CHAVE_DISPOSITIVO_VERSAO', '0'],
    ['LOGIN_CHAVE_DISPOSITIVO_V1', 'curta_sintetica'],
    ['IDENTIDADE_CHAVE_CIFRA_VERSAO', '0'],
    ['IDENTIDADE_CHAVE_CIFRA_V1', 'curta_sintetica'],
    ['IDENTIDADE_CHAVE_RECUPERACAO', 'curta_sintetica'],
  ])('não sobe com %s=%s: o hash nunca abaixo da OWASP e as chaves do login com 256 bits', (variavel, valor) => {
    const erro = erroDe({ ...ambienteValido, [variavel]: valor })
    expect(erro.variaveis).toEqual([variavel])
    expect(erro.message).not.toContain(valor)
  })

  it('semáforo do hash: LOGIN_HASH_CONCORRENCIA e UV_THREADPOOL_SIZE são obrigatórias, sem padrão no código, e a falta aponta só o nome', () => {
    for (const variavel of ['LOGIN_HASH_CONCORRENCIA', 'UV_THREADPOOL_SIZE']) {
      expect(erroDe({ ...ambienteValido, [variavel]: undefined }).variaveis, variavel).toEqual([variavel])
      expect(erroDe({ ...ambienteValido, [variavel]: '' }).variaveis, variavel).toEqual([variavel])
    }
    expect(erroDe({ ...ambienteValido, LOGIN_HASH_CONCORRENCIA: '0' }).variaveis).toEqual(['LOGIN_HASH_CONCORRENCIA'])
  })

  it('limite por IP do login por e-mail (15.2): LIMITE_LOGIN_EMAIL_IP_MIN é obrigatória, inteira e positiva, sem padrão no código', () => {
    expect(lerConfiguracao(ambienteValido).login.limiteEmailPorIpMin).toBe(60)
    expect(lerConfiguracao({ ...ambienteValido, LIMITE_LOGIN_EMAIL_IP_MIN: '180' }).login.limiteEmailPorIpMin).toBe(180)
    for (const valor of [undefined, '', '0', '-1', '1.5', 'sessenta']) {
      expect(erroDe({ ...ambienteValido, LIMITE_LOGIN_EMAIL_IP_MIN: valor }).variaveis, String(valor)).toEqual(['LIMITE_LOGIN_EMAIL_IP_MIN'])
    }
  })

  it('semáforo do hash: a concorrência vai até UV_THREADPOOL_SIZE − 8, e um acima derruba o boot apontando só LOGIN_HASH_CONCORRENCIA, sem o valor', () => {
    // No limite, sobe: 16 threads, 8 de folga para nome e arquivo, 8 para o hash.
    expect(lerConfiguracao({ ...ambienteValido, UV_THREADPOOL_SIZE: '16', LOGIN_HASH_CONCORRENCIA: '8' }).login.concorrenciaDoHash).toBe(8)
    const acima = erroDe({ ...ambienteValido, UV_THREADPOOL_SIZE: '16', LOGIN_HASH_CONCORRENCIA: '9' })
    expect(acima.variaveis).toEqual(['LOGIN_HASH_CONCORRENCIA'])
    expect(acima.message).not.toMatch(/\b9\b/)
    // O padrão do Node (4 threads) não deixa nenhuma para o hash: o processo sem UV_THREADPOOL_SIZE de verdade não sobe.
    expect(erroDe({ ...ambienteValido, UV_THREADPOOL_SIZE: '4', LOGIN_HASH_CONCORRENCIA: '1' }).variaveis).toEqual(['LOGIN_HASH_CONCORRENCIA'])
  })

  it('permissão (16.0): LOGIN_PROTECAO_DESLIGADA=true liga o controle negativo fora de produção, e a API não sobe com ela em produção', () => {
    expect(lerConfiguracao({ ...ambienteValido, LOGIN_PROTECAO_DESLIGADA: 'true' }).login.protecaoDesligada).toBe(true)
    expect(erroDe({ ...ambienteValido, AMBIENTE: 'producao', ROTAS_SINTETICAS: 'false', LOGIN_PROTECAO_DESLIGADA: 'true' }).variaveis).toEqual(['LOGIN_PROTECAO_DESLIGADA'])
    expect(erroDe({ ...ambienteValido, LOGIN_PROTECAO_DESLIGADA: undefined }).variaveis).toEqual(['LOGIN_PROTECAO_DESLIGADA'])
  })

  it('LOGIN_REDIS_PRAZO_MS só aperta: acima do corte de 100 ms a API não sobe em produção nem no staging, e sobe em local', () => {
    // O corte é o desenho (regra 80): o Redis que não responde não segura a requisição do aluno. Em `local` — a
    // máquina de desenvolvimento e o compose de teste, que é o que o e2e sobe — 100 ms é o tempo normal de uma
    // máquina ocupada, e cortar nele recusava o desafio no meio do login, sem defeito nenhum de produção (correção
    // 2026-09-22-corte-de-100-ms-do-redis-recusa-o-desafio-no-e2e).
    expect(TIMEOUT_COMANDO_REDIS_FILA_MS).toBeGreaterThan(TIMEOUT_COMANDO_REDIS_API_MS)
    const acimaDoCorte = String(TIMEOUT_COMANDO_REDIS_FILA_MS)
    // Até o corte, passa em todo ambiente: é o valor de `ambienteValido`, e é o que o cenário de carga fixa.
    for (const ambiente of ['local', 'staging', 'producao'] as const) {
      expect(lerConfiguracao({ ...ambienteValido, AMBIENTE: ambiente }).login.prazoDoRedisMs).toBe(TIMEOUT_COMANDO_REDIS_API_MS)
    }
    // Acima dele, só em `local`.
    expect(lerConfiguracao({ ...ambienteValido, LOGIN_REDIS_PRAZO_MS: acimaDoCorte }).login.prazoDoRedisMs).toBe(TIMEOUT_COMANDO_REDIS_FILA_MS)
    const emProducao = erroDe({ ...ambienteValido, AMBIENTE: 'producao', LOGIN_REDIS_PRAZO_MS: acimaDoCorte })
    expect(emProducao.variaveis).toEqual(['LOGIN_REDIS_PRAZO_MS'])
    expect(emProducao.message).toContain(MOTIVO_PRAZO_DO_REDIS_DO_LOGIN)
    expect(erroDe({ ...ambienteValido, AMBIENTE: 'staging', LOGIN_REDIS_PRAZO_MS: acimaDoCorte }).variaveis).toEqual(['LOGIN_REDIS_PRAZO_MS'])
    // Um a mais que o corte já não passa, nos dois: o limite é o valor, não uma faixa.
    for (const ambiente of ['staging', 'producao'] as const) {
      expect(erroDe({ ...ambienteValido, AMBIENTE: ambiente, LOGIN_REDIS_PRAZO_MS: String(TIMEOUT_COMANDO_REDIS_API_MS + 1) }).variaveis, ambiente).toEqual(['LOGIN_REDIS_PRAZO_MS'])
    }
    // O piso é a única defesa contra o prazo que não espera nada: zero passaria pelo teto (0 ≤ 100) e a API subiria
    // em produção, mas o ioredis corta todo comando no tick seguinte — desafio recusado e contador no seguro a cada
    // login, com a escola inteira às 7h30 (regra 80). Negativo faz o mesmo.
    for (const valor of [undefined, '', '0', '-1', '1.5', 'cem', String(PRAZO_MINIMO_DO_REDIS_DO_LOGIN_MS - 1)]) {
      expect(erroDe({ ...ambienteValido, LOGIN_REDIS_PRAZO_MS: valor }).variaveis, String(valor)).toEqual(['LOGIN_REDIS_PRAZO_MS'])
    }
    // O piso é inteiro: ele alimenta um `.int()`, e fracionário faria o caso acima passar pelo motivo errado.
    expect(Number.isInteger(PRAZO_MINIMO_DO_REDIS_DO_LOGIN_MS)).toBe(true)
    // No piso, passa: é apertar, não sumir.
    expect(lerConfiguracao({ ...ambienteValido, LOGIN_REDIS_PRAZO_MS: String(PRAZO_MINIMO_DO_REDIS_DO_LOGIN_MS) }).login.prazoDoRedisMs).toBe(PRAZO_MINIMO_DO_REDIS_DO_LOGIN_MS)
    // O que o contêiner do compose de teste vê é `.env.example` mais `infra/teste.env`, e não só o exemplo; o do
    // cenário de carga é `.env.example` mais `infra/carga.env`, que fixa o corte de produção.
    expect(lerAmbienteDeTeste()['AMBIENTE']).toBe('local')
    const comoNoProjeto = (doProjeto: Record<string, string>) =>
      lerConfiguracao({ ...ambienteValido, ...doProjeto, BANCO_URL: ambienteValido.BANCO_URL, REDIS_CACHE_URL: ambienteValido.REDIS_CACHE_URL, REDIS_FILA_URL: ambienteValido.REDIS_FILA_URL })
        .login.prazoDoRedisMs
    expect(comoNoProjeto(lerAmbienteDeTeste())).toBe(TIMEOUT_COMANDO_REDIS_FILA_MS)
    expect(comoNoProjeto(lerAmbienteDeCarga())).toBe(TIMEOUT_COMANDO_REDIS_API_MS)
  })

  it('o .env.example não sobe em produção, e aponta exatamente as variáveis que o staging e a produção precisam trocar', () => {
    // O item do TODO.md "valores que o staging e a produção não herdam do .env.example" mora aqui, executável: quem
    // copiar o exemplo para lá recebe esta lista no primeiro boot, antes de qualquer escola. Uma variável nova na
    // mesma classe entra aqui **se estiver em outro leitor**, porque `lerConfiguracao` soma os oito e ordena;
    // `lerConfiguracaoLogin` lança no primeiro `if`, então uma segunda recusa dentro dela não apareceria na lista
    // (`test-engineer`). E a lista é do que o boot **recusa**: chave sintética do exemplo sobe em produção sem
    // reclamar, e é por isso que o item do TODO.md separa as duas coisas.
    // `API_PORTA` e `TELEMETRIA_OTLP_URL` vêm do `environment:` do compose, não do arquivo; as URLs, do serviço.
    const exemplo = { ...ambienteValido, ...lerAmbienteExemplo(), API_PORTA: '3000', BANCO_URL: ambienteValido.BANCO_URL, REDIS_CACHE_URL: ambienteValido.REDIS_CACHE_URL, REDIS_FILA_URL: ambienteValido.REDIS_FILA_URL, TELEMETRIA_OTLP_URL: ambienteValido.TELEMETRIA_OTLP_URL }
    expect(lerConfiguracao(exemplo).identidade.ambiente).toBe('local')
    // O prazo do Redis do login, que aqui é o de desenvolvimento, e os dois emissores do login pela conta da escola,
    // que apontam para o `oidc-falso` em http. Em produção soma a rota sintética, que o exemplo deixa ligada.
    const semTls = ['LOGIN_EXTERNO_GOOGLE_EMISSOR', 'LOGIN_EXTERNO_MICROSOFT_EMISSOR', 'LOGIN_REDIS_PRAZO_MS']
    expect(erroDe({ ...exemplo, AMBIENTE: 'staging' }).variaveis).toEqual(semTls)
    expect(erroDe({ ...exemplo, AMBIENTE: 'producao' }).variaveis).toEqual([...semTls, 'ROTAS_SINTETICAS'])
  })

  it('AMBIENTE ausente ou inválido vale como produção na leitura do login, e o prazo acima do corte cai junto', () => {
    // `lerConfiguracao` nunca chega aqui: `esquemaAmbienteIdentidade` exige o enum e derruba o boot antes. A leitura
    // restrita é defesa em profundidade de `lerConfiguracaoLogin`, e só se prova chamando-a direto.
    const acimaDoCorte = { ...ambienteValido, LOGIN_REDIS_PRAZO_MS: String(TIMEOUT_COMANDO_REDIS_FILA_MS) }
    expect(lerConfiguracaoLogin(acimaDoCorte).prazoDoRedisMs).toBe(TIMEOUT_COMANDO_REDIS_FILA_MS)
    for (const ambiente of [undefined, 'homologacao']) {
      const erro = erroDeLogin({ ...acimaDoCorte, AMBIENTE: ambiente })
      expect(erro.variaveis, String(ambiente)).toEqual(['LOGIN_REDIS_PRAZO_MS'])
      expect(erro.message).toContain(MOTIVO_PRAZO_DO_REDIS_DO_LOGIN)
    }
  })

  it('a chave de dispositivo lida é a da versão declarada, e a versão sem chave não sobe', () => {
    const chaveV2 = 'chave_sintetica_do_dispositivo_v2_com_32_caracteres'
    const config = lerConfiguracao({ ...ambienteValido, LOGIN_CHAVE_DISPOSITIVO_VERSAO: '2', LOGIN_CHAVE_DISPOSITIVO_V2: chaveV2 })
    expect(config.login.dispositivo).toEqual({ versao: 2, chave: new TextEncoder().encode(chaveV2) })
    expect(erroDe({ ...ambienteValido, LOGIN_CHAVE_DISPOSITIVO_VERSAO: '2' }).variaveis).toEqual(['LOGIN_CHAVE_DISPOSITIVO_V2'])
  })

  it('não sobe com a mesma chave no contador e no dispositivo: cada HMAC tem a sua', () => {
    const erro = erroDe({ ...ambienteValido, LOGIN_CHAVE_DISPOSITIVO_V1: ambienteValido.LOGIN_CHAVE_CONTADOR })
    expect(erro.variaveis).toEqual(['LOGIN_CHAVE_DISPOSITIVO_V1'])
    expect(erro.message).not.toContain(ambienteValido.LOGIN_CHAVE_CONTADOR)
  })

  it('MFA: a chave de cifra da versão atual é obrigatória; a anterior, se declarada, continua decifrando; e a de recuperação não repete nenhuma outra', () => {
    const chaveV2 = 'chave_sintetica_da_cifra_v2_com_32_caracteres'
    const config = lerConfiguracao({ ...ambienteValido, IDENTIDADE_CHAVE_CIFRA_VERSAO: '2', IDENTIDADE_CHAVE_CIFRA_V2: chaveV2 })
    expect(config.login.mfa.versaoCifra).toBe(2)
    expect([...config.login.mfa.chavesCifra.entries()]).toEqual([
      [1, chaveDerivada(ambienteValido.IDENTIDADE_CHAVE_CIFRA_V1)],
      [2, chaveDerivada(chaveV2)],
    ])
    // A versão 1 aposentada pode sair do ambiente; a atual, nunca.
    expect([...lerConfiguracao({ ...ambienteValido, IDENTIDADE_CHAVE_CIFRA_VERSAO: '2', IDENTIDADE_CHAVE_CIFRA_V1: undefined, IDENTIDADE_CHAVE_CIFRA_V2: chaveV2 }).login.mfa.chavesCifra.keys()]).toEqual([2])
    expect(erroDe({ ...ambienteValido, IDENTIDADE_CHAVE_CIFRA_VERSAO: '2' }).variaveis).toEqual(['IDENTIDADE_CHAVE_CIFRA_V2'])
    // A chave derivada tem 256 bits e não é o texto da variável.
    expect(config.login.mfa.chavesCifra.get(2)?.length).toBe(32)
    for (const repetida of [ambienteValido.LOGIN_CHAVE_CONTADOR, ambienteValido.LOGIN_CHAVE_DISPOSITIVO_V1, ambienteValido.IDENTIDADE_CHAVE_CIFRA_V1]) {
      const erro = erroDe({ ...ambienteValido, IDENTIDADE_CHAVE_RECUPERACAO: repetida })
      expect(erro.variaveis).toEqual(['IDENTIDADE_CHAVE_RECUPERACAO'])
      expect(erro.message).not.toContain(repetida)
    }
  })

  it('.env.example sobe com o argon2 no mínimo da OWASP (m=19456, t=2)', () => {
    const exemplo = lerAmbienteExemplo()
    const { login } = lerConfiguracao({ ...ambienteValido, ...exemplo, API_PORTA: '3000', BANCO_URL: ambienteValido.BANCO_URL, REDIS_CACHE_URL: ambienteValido.REDIS_CACHE_URL, REDIS_FILA_URL: ambienteValido.REDIS_FILA_URL })
    expect(login.hash).toEqual({ memoriaKib: 19_456, iteracoes: 2 })
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
    ['LIMITE_REQ_OPERADOR_MIN', '0'],
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
    expect(limite).toMatchObject({ porUsuarioMin: 120, porEscolaMin: 30_000, porIpAnonimoMin: 3_000, porOperadorMin: 120, instancias: 2, proxiesConfiaveis: ['borda'] })
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
