import { avisoEspacado, ProporcaoEmJanela, relogioDoSistema, type Relogio } from '@educa/nucleo'
import { Logger } from '@nestjs/common'
import type { Redis } from 'ioredis'
import { createHmac } from 'node:crypto'

/** A janela dos contadores por IP do login: "por minuto" (Tech Spec da identidade, seção 5, "Baldes do semáforo"). */
export const JANELA_DO_CONTADOR_POR_IP_MS = 60_000

/** O que o contador diz: o valor na janela e se quem contou foi o seguro em memória (o limite é dividido pelas instâncias). */
export interface ContagemNaJanela {
  readonly valor: number
  readonly doSeguro: boolean
}

/**
 * Soma um na janela, numa operação só: a primeira soma da janela dá o prazo à chave, e as seguintes não o empurram.
 * Duas instâncias somando ao mesmo tempo nunca leem o mesmo número (regra 80, item 7).
 */
const SCRIPT_SOMAR = `
local valor = redis.call('INCR', KEYS[1])
if valor == 1 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
end
return valor
`

interface EntradaEmMemoria {
  valor: number
  venceEm: number
}

/**
 * Os contadores por IP do login (tarefa 15.0): as falhas de um IP numa escola (matrícula) e as tentativas de um IP na
 * rota de e-mail, cada um numa janela de 1 min, no Redis de fila, que não expulsa chave. Nenhuma chave é o IP: é o
 * HMAC dele (e da escola), com a chave do contador de tentativas, e vive só a janela (regra 20; `docs/lgpd.md`,
 * "Contador de tentativas de login").
 *
 * **Redis fora ou travado** (Tech Spec, seção 5, "Redis de fila fora"): cada instância conta em memória, com a mesma
 * janela, e diz que a contagem é do seguro, para quem compara dividir o limite pelas instâncias (`limiteDoSeguro`). A
 * proporção do seguro alimenta `limite.seguro_ativo`. Nunca responde "zero" por não saber: conta sempre, em algum lugar.
 */
export class ContadorEmJanela {
  readonly #logger = new Logger('login')
  readonly #seguro = new Map<string, EntradaEmMemoria>()
  readonly #proporcaoDoSeguro: ProporcaoEmJanela
  readonly #avisarSeguro = avisoEspacado(() => this.#logger.warn('login.limite_por_ip_no_seguro'))
  #ultimaVarredura = Number.NEGATIVE_INFINITY

  /** Quantas chaves o seguro em memória guarda agora (vivas ou à espera da varredura do minuto). */
  get noSeguro(): number {
    return this.#seguro.size
  }

  /** @param proporcaoDoSeguro só o teste troca, para mover a janela sem esperar 30 s. */
  constructor(
    private readonly cliente: Redis,
    private readonly chave: Uint8Array,
    private readonly relogio: Relogio = relogioDoSistema,
    proporcaoDoSeguro = new ProporcaoEmJanela(),
  ) {
    this.#proporcaoDoSeguro = proporcaoDoSeguro
  }

  /** Das contagens dos últimos 30 s, a proporção que o seguro em memória atendeu, de 0 a 1 (`limite.seguro_ativo`). */
  get proporcaoDoSeguro(): number {
    return this.#proporcaoDoSeguro.valor()
  }

  /** A chave de um contador: o prefixo do uso e o HMAC do identificador (o IP, ou a escola e o IP). */
  chaveDe(prefixo: string, identificador: string): string {
    return `${prefixo}:${createHmac('sha256', this.chave).update(identificador).digest('base64url')}`
  }

  /** Soma um e devolve o valor na janela. */
  async somar(chave: string): Promise<ContagemNaJanela> {
    if (this.cliente.status === 'ready') {
      try {
        const valor = Number(await this.cliente.eval(SCRIPT_SOMAR, 1, chave, JANELA_DO_CONTADOR_POR_IP_MS))
        if (!Number.isFinite(valor)) throw new Error('resposta do contador fora do formato')
        this.#proporcaoDoSeguro.registrar(false)
        return { valor, doSeguro: false }
      } catch {
        // Redis travado ou caindo no meio: o seguro conta esta. Se o script rodou e só a resposta passou do prazo, ela
        // fica contada nos dois lugares, para o lado de rebaixar, nunca de liberar.
      }
    }
    return { valor: this.#somarNoSeguro(chave), doSeguro: true }
  }

  /** O valor na janela, sem somar. */
  async ler(chave: string): Promise<ContagemNaJanela> {
    if (this.cliente.status === 'ready') {
      try {
        const valor = Number((await this.cliente.get(chave)) ?? 0)
        if (!Number.isFinite(valor)) throw new Error('resposta do contador fora do formato')
        this.#proporcaoDoSeguro.registrar(false)
        return { valor, doSeguro: false }
      } catch {
        // Idem: a leitura vai ao seguro.
      }
    }
    this.#usouSeguro()
    return { valor: this.#vivo(chave, this.relogio.agora().getTime())?.valor ?? 0, doSeguro: true }
  }

  #somarNoSeguro(chave: string): number {
    this.#usouSeguro()
    const agora = this.relogio.agora().getTime()
    const entrada = this.#vivo(chave, agora) ?? { valor: 0, venceEm: agora + JANELA_DO_CONTADOR_POR_IP_MS }
    entrada.valor++
    this.#seguro.set(chave, entrada)
    // A cada janela, e não só quando cresce: o HMAC do IP vencido não fica na memória além do minuto seguinte.
    if (agora - this.#ultimaVarredura >= JANELA_DO_CONTADOR_POR_IP_MS) this.#varrer(agora)
    return entrada.valor
  }

  #vivo(chave: string, agora: number): EntradaEmMemoria | undefined {
    const entrada = this.#seguro.get(chave)
    return entrada !== undefined && entrada.venceEm > agora ? entrada : undefined
  }

  #usouSeguro(): void {
    this.#proporcaoDoSeguro.registrar(true)
    this.#avisarSeguro()
  }

  #varrer(agora: number): void {
    this.#ultimaVarredura = agora
    for (const [chave, entrada] of this.#seguro) if (entrada.venceEm <= agora) this.#seguro.delete(chave)
  }
}
