import type { ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import { decodeProtectedHeader } from 'jose'
import type { IncomingMessage } from 'node:http'
import { METADADO_ACEITA_DESAFIO, METADADO_ROTA_ANONIMA } from '../limite/rota-anonima.decorator.js'
import { extrairTokenBearer, TIPO_DESAFIO } from './verificar-token.js'

/** Se o bearer do cabeçalho diz, no cabeçalho do JWT, ser um desafio de login. Não verifica nada: só separa o caminho. */
export function bearerDeDesafio(cabecalho: string | string[] | undefined): boolean {
  try {
    return decodeProtectedHeader(extrairTokenBearer(cabecalho)).typ === TIPO_DESAFIO
  } catch {
    return false
  }
}

/**
 * Se as guardas de autenticação, limite, sessão e permissão tratam a requisição como anônima: a rota `@RotaAnonima`,
 * ou a rota `@AceitaDesafio` chamada com um desafio de login no `Authorization`. Toda outra rota exige token de
 * acesso e sessão, e a rota `@AceitaDesafio` chamada com o token de acesso também.
 *
 * Tratar como anônima não autentica ninguém: não há escola, usuário nem sessão no contexto, e o service da rota
 * verifica o desafio antes de qualquer coisa.
 */
export function rotaSemSessao(reflector: Reflector, execucao: ExecutionContext): boolean {
  const alvos = [execucao.getHandler(), execucao.getClass()]
  if (reflector.getAllAndOverride<boolean | undefined>(METADADO_ROTA_ANONIMA, alvos) === true) return true
  if (reflector.getAllAndOverride<boolean | undefined>(METADADO_ACEITA_DESAFIO, alvos) !== true) return false
  if (execucao.getType() !== 'http') return false
  const requisicao = execucao.switchToHttp().getRequest<Partial<IncomingMessage>>()
  return bearerDeDesafio(requisicao.headers?.authorization)
}
