import { CodigoDeErro } from '@educa/shared'
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { IncomingMessage } from 'node:http'
import type { ConfiguracaoOperacional, LimitesDeRequisicao } from '../configuracao/configuracao-operacional.js'
import { ErroDeDominio } from '../erro/erro-de-dominio.js'
import { identidadeDaRequisicao } from '../identidade/guarda-autenticacao.js'
import { ipDoCliente, segundosParaTentarDeNovo } from './chaves.js'
import type { LimitadorDeRequisicoes } from './limitador.js'
import type { ProxiesConfiaveis } from './proxies-confiaveis.js'
import { METADADO_ROTA_ANONIMA, METADADO_SEM_LIMITE } from './rota-anonima.decorator.js'

/**
 * Guarda global de rate limit da API. Registre depois da `GuardaDeAutenticacao`: a rota
 * autenticada é limitada pelo usuário e pela escola que a autenticação gravou no contexto, nunca
 * por algo que o cliente mande (regra 10), com os limites da configuração dessa escola. Só a rota
 * `@RotaAnonima()` é limitada por IP, e o IP do `X-Forwarded-For` só vale quando a conexão vem da borda.
 *
 * Excesso responde 429 `LIMITE_EXCEDIDO` com `Retry-After`.
 */
export class GuardaDeLimite implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly limitador: LimitadorDeRequisicoes,
    private readonly proxies: ProxiesConfiaveis,
    private readonly limitesDaEscola: Pick<ConfiguracaoOperacional<LimitesDeRequisicao>, 'daEscola'>,
  ) {}

  async canActivate(execucao: ExecutionContext): Promise<boolean> {
    // Outro tipo de execução não passa pela autenticação HTTP; ela já o recusa.
    if (execucao.getType() !== 'http') return true
    const alvos = [execucao.getHandler(), execucao.getClass()]
    if (this.reflector.getAllAndOverride<boolean | undefined>(METADADO_SEM_LIMITE, alvos) === true) return true

    const anonima = this.reflector.getAllAndOverride<boolean | undefined>(METADADO_ROTA_ANONIMA, alvos) === true
    const resultado = anonima
      ? await this.limitador.consumirAnonima(await this.#ipDaRequisicao(execucao.switchToHttp().getRequest<IncomingMessage>()))
      : await this.limitador.consumirAutenticada(identidadeDaRequisicao(), await this.limitesDaEscola.daEscola())
    if (!resultado.aceita) {
      throw new ErroDeDominio(CodigoDeErro.LIMITE_EXCEDIDO, undefined, segundosParaTentarDeNovo(resultado.msAteLiberar))
    }
    return true
  }

  async #ipDaRequisicao(requisicao: IncomingMessage): Promise<string> {
    const enderecoDaConexao = requisicao.socket.remoteAddress
    const encaminhado = requisicao.headers['x-forwarded-for']
    // Sem cabeçalho, nem precisa perguntar se a conexão é da borda.
    const daBorda = encaminhado !== undefined && (await this.proxies.ehConfiavel(enderecoDaConexao))
    return ipDoCliente(enderecoDaConexao, encaminhado, daBorda)
  }
}
