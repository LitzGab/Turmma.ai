import {
  definirIdentidadeNoContexto,
  ErroDeDominio,
  executarNoContexto,
  verificarToken,
  type ConfiguracaoIdentidade,
  type Identidade,
  type LoggerBase,
} from '@educa/nucleo'
import { CodigoDeErro, MENSAGENS_DE_ERRO } from '@educa/shared'
import { randomUUID } from 'node:crypto'
import type { Socket } from 'socket.io'
import { z } from 'zod'

/** O que o servidor guarda no socket. Só a identidade verificada, só ids (regra 20). */
export interface DadosDoSocket {
  identidade?: Identidade
}

export type SocketRealtime = Socket<Record<string, never>, Record<string, never>, Record<string, never>, DadosDoSocket>

export interface ErroDeConexao extends Error {
  data: { codigo: CodigoDeErro; mensagem: string }
}

/**
 * Recusa de conexão como o cliente socket.io a recebe (`connect_error`): código tipado e a
 * mensagem do catálogo, sem dizer se o token faltou, venceu ou tinha assinatura errada.
 */
export function erroDeConexaoNaoAutenticada(): ErroDeConexao {
  const erro = new Error(CodigoDeErro.NAO_AUTENTICADO) as ErroDeConexao
  erro.data = { codigo: CodigoDeErro.NAO_AUTENTICADO, mensagem: MENSAGENS_DE_ERRO.NAO_AUTENTICADO }
  return erro
}

// Três partes base64url, com teto de tamanho: nada além disso é lido do pacote de conexão.
const esquemaAutenticacao = z.object({
  token: z
    .string()
    .max(4_096)
    .regex(/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/),
})

/**
 * Middleware do namespace: verifica o JWT do pacote de conexão (`auth.token`) com a mesma
 * verificação da API e grava a identidade no contexto e no socket. O token só é lido do `auth`:
 * query da URL e cabeçalho não autenticam, porque URL vai parar em log e histórico.
 *
 * Nada que o cliente manda além do token entra na identidade. A sala da escola sai daqui.
 */
export function autenticacaoDoHandshake(config: ConfiguracaoIdentidade, logger: LoggerBase) {
  return (socket: SocketRealtime, proximo: (erro?: Error) => void): void => {
    void executarNoContexto({ requisicaoId: randomUUID() }, async () => {
      const autenticacao = esquemaAutenticacao.safeParse(socket.handshake.auth)
      try {
        if (!autenticacao.success) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
        const identidade = await verificarToken(autenticacao.data.token, config)
        definirIdentidadeNoContexto(identidade)
        socket.data.identidade = identidade
        // Verificado, o token não fica na conexão: o handshake é copiado para outras instâncias pelo
        // Redis (fetchSockets), e a query é texto livre do cliente.
        socket.handshake.auth = {}
        socket.handshake.query = {}
      } catch (erro) {
        if (erro instanceof ErroDeDominio) {
          logger.info({ evento: 'realtime.conexao_recusada', codigo: erro.codigo })
        } else {
          logger.error({ evento: 'realtime.conexao_falhou', erro })
        }
        socket.handshake.auth = {}
        proximo(erroDeConexaoNaoAutenticada())
        return
      }
      logger.info({ evento: 'realtime.conexao_aceita' })
      proximo()
    })
  }
}
