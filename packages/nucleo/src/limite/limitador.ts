import { Logger } from '@nestjs/common'
import type { Redis } from 'ioredis'
import { RateLimiterMemory, RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible'
import { z } from 'zod'
import { validarAmbiente } from '../config/validar-config.js'
import type { Identidade } from '../identidade/verificar-token.js'
import {
  JANELA_LIMITE_SEGUNDOS,
  limiteDoSeguro,
  PREFIXO_LIMITE_ESCOLA,
  PREFIXO_LIMITE_IP,
  PREFIXO_LIMITE_USUARIO,
} from './chaves.js'

export interface ConfiguracaoLimite {
  /** Redis de cache (`allkeys-lru`): toda chave de limite tem TTL da janela. */
  readonly redisCacheUrl: string
  readonly porUsuarioMin: number
  readonly porEscolaMin: number
  readonly porIpAnonimoMin: number
  /** Quantas instâncias da API dividem o limite. O seguro em memória de cada uma usa limite ÷ instâncias. */
  readonly instancias: number
  /** Nome ou IP dos proxies cujo `X-Forwarded-For` vale (a borda). */
  readonly proxiesConfiaveis: readonly string[]
}

const inteiroPositivo = z.coerce.number().int().positive()
// Nome de host do compose ou IP: nada de URL, porta nem texto livre.
const entradaDeProxy = z.string().regex(/^[A-Za-z0-9.:-]+$/)

const esquemaAmbienteLimite = z.object({
  REDIS_CACHE_URL: z.string().regex(/^redis:\/\/[^/\s]+(\/\d+)?$/),
  LIMITE_REQ_USUARIO_MIN: inteiroPositivo,
  LIMITE_REQ_ESCOLA_MIN: inteiroPositivo,
  LIMITE_REQ_IP_ANONIMO_MIN: inteiroPositivo,
  LIMITE_INSTANCIAS_API: inteiroPositivo,
  LIMITE_PROXIES_CONFIAVEIS: z
    .string()
    .transform((texto) => texto.split(',').map((entrada) => entrada.trim()).filter((entrada) => entrada !== ''))
    .pipe(z.array(entradaDeProxy).min(1)),
})

/**
 * Limites do ambiente. São o padrão de toda escola; a configuração por escola chega com a
 * `configuracao_operacional_escola` (tarefa 9.0). Nenhum valor tem padrão escondido no código (D41).
 */
export function lerConfiguracaoLimite(ambiente: Record<string, string | undefined>): ConfiguracaoLimite {
  const valores = validarAmbiente(esquemaAmbienteLimite, ambiente)
  return {
    redisCacheUrl: valores.REDIS_CACHE_URL,
    porUsuarioMin: valores.LIMITE_REQ_USUARIO_MIN,
    porEscolaMin: valores.LIMITE_REQ_ESCOLA_MIN,
    porIpAnonimoMin: valores.LIMITE_REQ_IP_ANONIMO_MIN,
    instancias: valores.LIMITE_INSTANCIAS_API,
    proxiesConfiaveis: valores.LIMITE_PROXIES_CONFIAVEIS,
  }
}

export type ResultadoDoLimite = { readonly aceita: true } | { readonly aceita: false; readonly msAteLiberar: number }

type OpcoesDoConsumo = Parameters<RateLimiterMemory['consume']>[2]

/**
 * Seguro em memória de um limite. Marca cada resposta que ele deu, para o limitador saber, por
 * requisição, se o Redis atendeu ou se o seguro entrou no lugar.
 */
class SeguroEmMemoria extends RateLimiterMemory {
  readonly #respostasDoSeguro = new WeakSet<RateLimiterRes>()

  override async consume(chave: string | number, pontos?: number, opcoes?: OpcoesDoConsumo): Promise<RateLimiterRes> {
    try {
      const resposta = await super.consume(chave, pontos, opcoes)
      this.#respostasDoSeguro.add(resposta)
      return resposta
    } catch (recusa) {
      if (recusa instanceof RateLimiterRes) this.#respostasDoSeguro.add(recusa)
      throw recusa
    }
  }

  respondeu(resposta: RateLimiterRes): boolean {
    return this.#respostasDoSeguro.has(resposta)
  }
}

interface Limite {
  readonly redis: RateLimiterRedis
  readonly seguro: SeguroEmMemoria
}

type Consumo = { aceita: boolean; resposta: RateLimiterRes; doSeguro: boolean }

function criarLimite(cliente: Redis, prefixo: string, pontos: number, instancias: number): Limite {
  const seguro = new SeguroEmMemoria({ keyPrefix: prefixo, points: limiteDoSeguro(pontos, instancias), duration: JANELA_LIMITE_SEGUNDOS })
  const redis = new RateLimiterRedis({
    storeClient: cliente,
    keyPrefix: prefixo,
    points: pontos,
    duration: JANELA_LIMITE_SEGUNDOS,
    // Cliente que não está pronto (Redis fora, reconectando) vai direto ao seguro, sem tentar o comando.
    rejectIfRedisNotReady: true,
    insuranceLimiter: seguro,
  })
  return { redis, seguro }
}

/**
 * Rate limit da API, no Redis de cache e somado entre as instâncias: por usuário e por escola na
 * rota autenticada, por IP só na anônima (regra 80, item 1). Com o Redis fora ou travado, cada
 * instância segue limitando sozinha, em memória, com limite ÷ instâncias, e `seguroAtivo` vira 1.
 * Nunca libera sem limite, nunca devolve erro por causa do Redis.
 */
export class LimitadorDeRequisicoes {
  readonly #logger = new Logger('limite')
  readonly #usuario: Limite
  readonly #escola: Limite
  readonly #ipAnonimo: Limite
  #seguroAtivo = false

  constructor(cliente: Redis, config: ConfiguracaoLimite) {
    this.#usuario = criarLimite(cliente, PREFIXO_LIMITE_USUARIO, config.porUsuarioMin, config.instancias)
    this.#escola = criarLimite(cliente, PREFIXO_LIMITE_ESCOLA, config.porEscolaMin, config.instancias)
    this.#ipAnonimo = criarLimite(cliente, PREFIXO_LIMITE_IP, config.porIpAnonimoMin, config.instancias)
  }

  /** 1 enquanto a última requisição limitada foi contada pelo seguro em memória. Base da métrica `limite.seguro_ativo` (12.0). */
  get seguroAtivo(): 0 | 1 {
    return this.#seguroAtivo ? 1 : 0
  }

  /**
   * Conta a requisição no limite do usuário e no da escola, as duas em paralelo: com o Redis
   * travado, a espera é um só `commandTimeout`, e não dois.
   *
   * O limite de usuário vale entre escolas (o mesmo `sub` em duas escolas é uma pessoa só); o de
   * escola é de cada escola. Requisição recusada pelo limite do usuário é devolvida ao da escola:
   * um aluno com o script em laço não gasta a cota dos outros 399.
   */
  async consumirAutenticada(identidade: Identidade): Promise<ResultadoDoLimite> {
    const [usuario, escola] = await Promise.all([
      this.#consumir(this.#usuario, identidade.usuarioId),
      this.#consumir(this.#escola, identidade.escolaId),
    ])
    this.#registrarSeguro(usuario.doSeguro || escola.doSeguro)
    if (!usuario.aceita) {
      await this.#devolver(this.#escola, identidade.escolaId, escola)
      return { aceita: false, msAteLiberar: usuario.resposta.msBeforeNext }
    }
    if (!escola.aceita) return { aceita: false, msAteLiberar: escola.resposta.msBeforeNext }
    return { aceita: true }
  }

  async consumirAnonima(ip: string): Promise<ResultadoDoLimite> {
    const consumo = await this.#consumir(this.#ipAnonimo, ip)
    this.#registrarSeguro(consumo.doSeguro)
    return consumo.aceita ? { aceita: true } : { aceita: false, msAteLiberar: consumo.resposta.msBeforeNext }
  }

  async #consumir(limite: Limite, chave: string): Promise<Consumo> {
    try {
      const resposta = await limite.redis.consume(chave)
      return { aceita: true, resposta, doSeguro: limite.seguro.respondeu(resposta) }
    } catch (recusa) {
      // O seguro sempre responde com RateLimiterRes; outra coisa é defeito nosso, e sobe como erro.
      if (!(recusa instanceof RateLimiterRes)) throw recusa
      return { aceita: false, resposta: recusa, doSeguro: limite.seguro.respondeu(recusa) }
    }
  }

  /** Devolve o ponto a quem o contou: ao seguro, se foi ele, sem esperar outra vez pelo Redis fora. */
  async #devolver(limite: Limite, chave: string, consumo: Consumo): Promise<void> {
    try {
      await (consumo.doSeguro ? limite.seguro.reward(chave) : limite.redis.reward(chave))
    } catch {
      // Devolução que falhou só deixa a cota da escola um pouco menor até o fim da janela.
    }
  }

  #registrarSeguro(ativo: boolean): void {
    if (ativo === this.#seguroAtivo) return
    this.#seguroAtivo = ativo
    if (ativo) this.#logger.warn('limite.seguro_ativado')
    else this.#logger.log('limite.seguro_desativado')
  }
}
