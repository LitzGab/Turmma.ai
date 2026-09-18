import { ErroDeDominio, LIMITES_DO_HISTOGRAMA_HTTP_S, METRICAS, ROTULO_ESCOLA, type Meter } from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { randomInt } from 'node:crypto'
import type { BaldeDeLogin } from './baldes-de-login.js'

/** Quanto um login espera a vez no semáforo antes de sair com 503 (Tech Spec da identidade, seção 5, "Hash"). */
export const ESPERA_MAXIMA_PELO_HASH_MS = 2_000
/** O `Retry-After` do 503 do semáforo é sorteado nesta faixa, em segundos: a rajada que volta não volta junta. */
export const RETRY_AFTER_MINIMO_S = 2
export const RETRY_AFTER_MAXIMO_S = 6
/**
 * Teto de pedidos esperando nesta instância. Com o prazo de 2 s ele só é alcançado por uma inundação muito acima da
 * rajada das 7h30 (~14 logins/s): acima dele o pedido sai com o mesmo 503 na hora, e a memória não cresce sem limite.
 */
export const MAXIMO_ESPERANDO = 10_000
/** Quantos baldes e subfilas a roda lembra antes de esquecer os que não têm ninguém esperando. */
const MAXIMO_NA_RODA = 10_000

/** A chave da subfila na roda: o balde e a subfila, separados por um caractere que não aparece em id nem em IP. */
function chaveDaSubfila(balde: Pick<BaldeDeLogin, 'id' | 'subfila'>): string {
  return `${balde.id}\u0000${balde.subfila}`
}

interface Espera {
  readonly balde: BaldeDeLogin
  readonly inicio: number
  readonly entrar: () => void
  readonly timer: ReturnType<typeof setTimeout>
}

/**
 * O semáforo do hash de senha (tarefa 14.0; Tech Spec da identidade, seção 5, "Hash"; regra 80, itens 1, 3 e 10).
 *
 * - **Teto:** no máximo `concorrencia` hashes ao mesmo tempo nesta instância (`LOGIN_HASH_CONCORRENCIA`, conferida no
 *   boot contra `UV_THREADPOOL_SIZE − 8`): às 7h30 o argon2 não toma a CPU nem as threads do libuv da API.
 * - **Rodízio:** quem espera fica na fila do seu balde (`baldes-de-login.ts`), e a vez que abre vai ao balde atendido
 *   há mais tempo, não ao pedido mais antigo: 3.000 pedidos de uma escola não passam na frente do primeiro de outra.
 *   Dentro do balde, a mesma roda entre as subfilas (o IP, na equipe).
 * - **Prazo:** quem espera mais de 2 s sai com 503 `INDISPONIVEL_TENTE_DE_NOVO` e `Retry-After` sorteado entre 2 e 6 s,
 *   sem chegar à tarefa. O prazo e o balde não dependem de a credencial existir: sob saturação, a matrícula ou o e-mail
 *   que existe e o que não existe recebem o 503 na mesma proporção (regra 20, item 6).
 * - **Métricas:** `login.hash_espera{escola_id}` a cada vez concedida, `login.hash_recusado` a cada 503.
 *
 * Estado só desta instância, e de propósito: o que ele protege é a CPU e as threads do processo, que não se somam
 * entre instâncias (regra 80, item 5, trata de estado que outra instância precise; este não é).
 */
export class SemaforoDeHash {
  readonly #esperaPeloHash: ReturnType<Meter['createHistogram']>
  readonly #recusados: ReturnType<Meter['createCounter']>
  /** Balde → subfila → pedidos esperando, em ordem de chegada. Balde e subfila sem ninguém esperando saem do mapa. */
  readonly #baldes = new Map<string, Map<string, Espera[]>>()
  /**
   * A roda: em que vez cada balde, e cada subfila dentro dele, foi atendido por último (ou entrou na roda, se ainda
   * não foi). A vez que abre vai ao balde esperando há mais tempo sem ser atendido, contando também a vez que ele pegou
   * sem fila: o balde que está com o hash em andamento vai para o fim da roda, e não para o começo, quando os pedidos
   * seguintes dele chegam.
   */
  readonly #ultimaVez = new Map<string, number>()
  #vez = 0
  #emUso = 0
  #esperando = 0

  constructor(
    private readonly concorrencia: number,
    medidor: Meter,
    private readonly esperaMaximaMs = ESPERA_MAXIMA_PELO_HASH_MS,
  ) {
    if (!Number.isInteger(concorrencia) || concorrencia < 1) throw new RangeError('a concorrência do semáforo do hash precisa ser um inteiro positivo')
    this.#esperaPeloHash = medidor.createHistogram(METRICAS.esperaPeloHash, {
      unit: 's',
      description: 'Espera pela vez no semáforo do hash de senha, por escola',
      advice: { explicitBucketBoundaries: LIMITES_DO_HISTOGRAMA_HTTP_S },
    })
    this.#recusados = medidor.createCounter(METRICAS.hashRecusado, { description: 'Logins que esperaram mais que o prazo pelo hash e saíram com 503' })
    // A série nasce em 0 no boot: a taxa do alerta `login-hash-recusado` conta o primeiro 503 desde o boot.
    this.#recusados.add(0)
  }

  /** Hashes rodando agora. */
  get emUso(): number {
    return this.#emUso
  }

  /** Pedidos esperando a vez agora, somados os baldes. */
  get esperando(): number {
    return this.#esperando
  }

  /**
   * Roda `tarefa` quando o balde tiver a vez, e devolve o resultado dela. A vez é devolvida quando a tarefa termina,
   * com sucesso ou erro. Sem vez em 2 s, lança o 503, e a tarefa não roda.
   */
  async executar<T>(balde: BaldeDeLogin, tarefa: () => Promise<T>): Promise<T> {
    await this.#aguardarVez(balde)
    try {
      return await tarefa()
    } finally {
      this.#devolverVez()
    }
  }

  #aguardarVez(balde: BaldeDeLogin): Promise<void> {
    const inicio = performance.now()
    if (this.#emUso < this.concorrencia && this.#esperando === 0) {
      this.#conceder(balde, inicio)
      return Promise.resolve()
    }
    if (this.#esperando >= MAXIMO_ESPERANDO) return Promise.reject(this.#recusar())
    return new Promise<void>((resolver, rejeitar) => {
      const espera: Espera = {
        balde,
        inicio,
        entrar: resolver,
        timer: setTimeout(() => {
          this.#retirar(espera)
          rejeitar(this.#recusar())
        }, this.esperaMaximaMs),
      }
      this.#enfileirar(espera)
    })
  }

  #devolverVez(): void {
    this.#emUso--
    while (this.#emUso < this.concorrencia) {
      const proxima = this.#proxima()
      if (proxima === undefined) return
      clearTimeout(proxima.timer)
      this.#conceder(proxima.balde, proxima.inicio)
      proxima.entrar()
    }
  }

  #conceder(balde: BaldeDeLogin, inicio: number): void {
    this.#emUso++
    this.#vez++
    this.#ultimaVez.set(balde.id, this.#vez)
    this.#ultimaVez.set(chaveDaSubfila(balde), this.#vez)
    // Sob ataque com muitos IPs, a roda não cresce sem limite: esquece quem não está esperando.
    if (this.#ultimaVez.size > MAXIMO_NA_RODA) this.#esquecerQuemNaoEspera()
    this.#medirEspera(balde, inicio)
  }

  #esquecerQuemNaoEspera(): void {
    const esperando = new Set<string>()
    for (const [id, subfilas] of this.#baldes) {
      esperando.add(id)
      for (const subfila of subfilas.keys()) esperando.add(chaveDaSubfila({ id, subfila }))
    }
    for (const chave of this.#ultimaVez.keys()) if (!esperando.has(chave)) this.#ultimaVez.delete(chave)
  }

  #enfileirar(espera: Espera): void {
    // Quem entra na roda sem vez anterior entra logo antes da vez atual: na frente de quem acabou de ser atendido (o
    // balde com o hash em andamento), atrás de quem espera desde antes. Um IP novo a cada pedido, num ataque ao balde
    // da equipe, não passa na frente de quem já esperava.
    for (const chave of [espera.balde.id, chaveDaSubfila(espera.balde)]) if (!this.#ultimaVez.has(chave)) this.#ultimaVez.set(chave, this.#vez - 0.5)
    const subfilas = this.#baldes.get(espera.balde.id) ?? new Map<string, Espera[]>()
    const fila = subfilas.get(espera.balde.subfila) ?? []
    fila.push(espera)
    subfilas.set(espera.balde.subfila, fila)
    this.#baldes.set(espera.balde.id, subfilas)
    this.#esperando++
  }

  /**
   * O primeiro pedido da subfila atendida há mais tempo, dentro do balde atendido há mais tempo. Empate (os dois
   * entraram na roda na mesma vez) fica com quem chegou primeiro à fila.
   */
  #proxima(): Espera | undefined {
    const id = this.#maisAntigo(this.#baldes.keys(), (candidato) => candidato)
    const subfilas = id === undefined ? undefined : this.#baldes.get(id)
    if (id === undefined || subfilas === undefined) return undefined
    const subfila = this.#maisAntigo(subfilas.keys(), (candidata) => chaveDaSubfila({ id, subfila: candidata }))
    const fila = subfila === undefined ? undefined : subfilas.get(subfila)
    const espera = fila?.shift()
    if (subfila === undefined || fila === undefined || espera === undefined) return undefined
    this.#esperando--
    if (fila.length === 0) subfilas.delete(subfila)
    if (subfilas.size === 0) this.#baldes.delete(id)
    return espera
  }

  #maisAntigo(candidatos: Iterable<string>, chave: (candidato: string) => string): string | undefined {
    let escolhido: string | undefined
    let menorVez = Number.POSITIVE_INFINITY
    for (const candidato of candidatos) {
      const vez = this.#ultimaVez.get(chave(candidato)) ?? Number.NEGATIVE_INFINITY
      if (vez < menorVez) {
        escolhido = candidato
        menorVez = vez
      }
    }
    return escolhido
  }

  /** Tira da fila quem desistiu pelo prazo, sem mexer na ordem da roda. */
  #retirar(espera: Espera): void {
    const subfilas = this.#baldes.get(espera.balde.id)
    const fila = subfilas?.get(espera.balde.subfila)
    const posicao = fila?.indexOf(espera) ?? -1
    if (subfilas === undefined || fila === undefined || posicao < 0) return
    fila.splice(posicao, 1)
    this.#esperando--
    if (fila.length === 0) subfilas.delete(espera.balde.subfila)
    if (subfilas.size === 0) this.#baldes.delete(espera.balde.id)
  }

  #recusar(): ErroDeDominio {
    this.#recusados.add(1)
    return new ErroDeDominio(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO, undefined, randomInt(RETRY_AFTER_MINIMO_S, RETRY_AFTER_MAXIMO_S + 1))
  }

  #medirEspera(balde: BaldeDeLogin, inicio: number): void {
    this.#esperaPeloHash.record((performance.now() - inicio) / 1_000, { [ROTULO_ESCOLA]: balde.rotulo })
  }
}
