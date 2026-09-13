import type { ConfiguracaoIdentidade, LoggerBase } from '@educa/nucleo'
import { NAMESPACE_REALTIME_SISTEMA } from '@educa/shared'
import { Inject } from '@nestjs/common'
import { WebSocketGateway, type OnGatewayConnection, type OnGatewayInit } from '@nestjs/websockets'
import type { Namespace } from 'socket.io'
import { autenticacaoDoHandshake, type SocketRealtime } from './autenticacao-do-handshake.js'

export const CONFIGURACAO_IDENTIDADE = Symbol('CONFIGURACAO_IDENTIDADE')
export const LOGGER_REALTIME = Symbol('LOGGER_REALTIME')

/** Sala de todos os clientes de uma escola. O nome só é montado aqui, a partir do token verificado. */
export function salaDaEscola(escolaId: string): string {
  return `escola:${escolaId}`
}

/**
 * Namespace `/sistema`. Todo cliente entra autenticado pelo JWT e cai na sala da própria escola,
 * definida pelo token. Não há evento para entrar em sala, e a sala não vem de nada que o cliente
 * mande (regra 10, item 3). Sem handler de mensagem no F0: a emissão chega pelo adaptador Redis.
 */
@WebSocketGateway({ namespace: NAMESPACE_REALTIME_SISTEMA })
export class SistemaGateway implements OnGatewayInit<Namespace>, OnGatewayConnection<SocketRealtime> {
  constructor(
    @Inject(CONFIGURACAO_IDENTIDADE) private readonly identidade: ConfiguracaoIdentidade,
    @Inject(LOGGER_REALTIME) private readonly logger: LoggerBase,
  ) {}

  afterInit(namespace: Namespace): void {
    namespace.use(autenticacaoDoHandshake(this.identidade, this.logger))
  }

  async handleConnection(socket: SocketRealtime): Promise<void> {
    const identidade = socket.data.identidade
    // O middleware só deixa passar socket autenticado; sem identidade aqui, falha fechada.
    if (identidade === undefined) {
      socket.disconnect(true)
      return
    }
    await socket.join(salaDaEscola(identidade.escolaId))
  }
}
