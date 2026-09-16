import { CodigoDeErro } from '@educa/shared'
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import type { IncomingMessage } from 'node:http'
import type { ConfiguracaoIdentidade } from '../config/validar-config.js'
import { contextoAtual, type SessaoDaRequisicao } from '../contexto/contexto.js'
import { ErroDeDominio } from '../erro/erro-de-dominio.js'
import { METADADO_ROTA_ANONIMA } from '../limite/rota-anonima.decorator.js'
import { guardarTokenDaRequisicao } from './token-da-requisicao.js'
import { extrairTokenBearer, verificarToken, type Identidade } from './verificar-token.js'

/**
 * Primeira guarda global da API: só verifica o JWT (assinatura, emissor, tipo, prazo e os ids) e o prende à
 * requisição. Não toca o banco nem o Redis: token inválido é recusado aqui, antes do limite e da leitura de sessão
 * (Tech Spec, seção 1). Quem grava a escola e o usuário no contexto é a `GuardaDeSessao`, depois de conferir a
 * sessão; nenhum cabeçalho, query ou corpo do cliente chega lá (regra 10, item 3).
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
    // Só HTTP; o realtime autentica no handshake. Outro tipo não passa sem token.
    if (execucao.getType() !== 'http') throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)

    const requisicao = execucao.switchToHttp().getRequest<IncomingMessage>()
    const token = await verificarToken(extrairTokenBearer(requisicao.headers.authorization), this.config)
    guardarTokenDaRequisicao(requisicao, token)
    return true
  }
}

/**
 * Escola e usuário da requisição em andamento, lidos do contexto que a `GuardaDeSessao` preencheu. Recusa com
 * `NAO_AUTENTICADO` quando não há: rota marcada anônima por engano não devolve escopo vazio.
 */
export function identidadeDaRequisicao(): Identidade {
  const contexto = contextoAtual()
  if (contexto?.escolaId === undefined || contexto.usuarioId === undefined) {
    throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
  }
  return { escolaId: contexto.escolaId, usuarioId: contexto.usuarioId }
}

/** A sessão da requisição em andamento, com papel e ano letivo. Sem sessão conferida no contexto, `NAO_AUTENTICADO`. */
export function sessaoDaRequisicao(): SessaoDaRequisicao {
  const contexto = contextoAtual()
  if (
    contexto?.escolaId === undefined ||
    contexto.usuarioId === undefined ||
    contexto.papel === undefined ||
    contexto.sessaoId === undefined ||
    contexto.anoLetivoId === undefined
  ) {
    throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
  }
  return { escolaId: contexto.escolaId, usuarioId: contexto.usuarioId, papel: contexto.papel, sessaoId: contexto.sessaoId, anoLetivoId: contexto.anoLetivoId }
}
