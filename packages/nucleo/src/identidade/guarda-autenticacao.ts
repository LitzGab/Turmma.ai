import { CodigoDeErro } from '@educa/shared'
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { IncomingMessage } from 'node:http'
import type { ConfiguracaoIdentidade } from '../config/validar-config.js'
import { contextoAtual, definirIdentidadeNoContexto } from '../contexto/contexto.js'
import { ErroDeDominio } from '../erro/erro-de-dominio.js'
import { METADADO_ROTA_ANONIMA } from '../limite/rota-anonima.decorator.js'
import { extrairTokenBearer, verificarToken, type Identidade } from './verificar-token.js'

/**
 * Guarda global da API. Verifica o token e grava `escolaId` e `usuarioId` no contexto da
 * requisição. É o único lugar que os preenche: nenhum cabeçalho, query ou corpo do cliente chega
 * lá (regra 10, item 3).
 */
export class GuardaDeAutenticacao implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: ConfiguracaoIdentidade,
  ) {}

  async canActivate(execucao: ExecutionContext): Promise<boolean> {
    const anonima = this.reflector.getAllAndOverride<boolean | undefined>(METADADO_ROTA_ANONIMA, [
      execucao.getHandler(),
      execucao.getClass(),
    ])
    if (anonima === true) return true
    // Só HTTP por enquanto; o realtime (5.0) autentica no handshake. Outro tipo não passa sem token.
    if (execucao.getType() !== 'http') throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)

    const requisicao = execucao.switchToHttp().getRequest<IncomingMessage>()
    const identidade = await verificarToken(extrairTokenBearer(requisicao.headers.authorization), this.config)
    // Sem o middleware de contexto não há onde guardar a escola: falha fechada, nunca rota sem escopo.
    definirIdentidadeNoContexto(identidade)
    return true
  }
}

/**
 * Identidade da requisição em andamento, lida do contexto que a guarda preencheu. Recusa com
 * `NAO_AUTENTICADO` quando não há: rota marcada anônima por engano não devolve escopo vazio.
 */
export function identidadeDaRequisicao(): Identidade {
  const contexto = contextoAtual()
  if (contexto?.escolaId === undefined || contexto.usuarioId === undefined) {
    throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
  }
  return { escolaId: contexto.escolaId, usuarioId: contexto.usuarioId }
}
