import { alcanceDe, CodigoDeErro, type Alcance } from '@educa/shared'
import type { CanActivate, ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import { contextoAtual } from '../contexto/contexto.js'
import { ErroDeDominio } from '../erro/erro-de-dominio.js'
import { METADADO_ROTA_ANONIMA } from '../limite/rota-anonima.decorator.js'
import { METADADO_PERMITE, type CelulaPermitida } from './permite.decorator.js'

/**
 * Quarta guarda global da API, depois da sessão: com o papel que a sessão gravou no contexto, lê a célula que a rota
 * declarou em `@Permite` e barra o alcance `nunca`.
 *
 * - Papel sem permissão responde `NAO_ENCONTRADO` (404), igual a rota inexistente: um 403 confirmaria que a rota
 *   existe para outro papel (regra 10, item 6).
 * - Rota autenticada sem `@Permite` também é recusada. O boot já não sobe com ela (`ConferenciaDasPermissoes`); aqui
 *   é a segunda trava, para nunca liberar por omissão.
 * - Sem papel no contexto (guarda fora de ordem), `NAO_AUTENTICADO`.
 */
export class GuardaDePermissao implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(execucao: ExecutionContext): boolean {
    const alvos = [execucao.getHandler(), execucao.getClass()]
    if (this.reflector.getAllAndOverride<boolean | undefined>(METADADO_ROTA_ANONIMA, alvos) === true) return true
    const papel = contextoAtual()?.papel
    if (papel === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
    const celula = this.reflector.getAllAndOverride<CelulaPermitida | undefined>(METADADO_PERMITE, alvos)
    const alcance: Alcance = celula === undefined ? 'nunca' : alcanceDe(papel, celula.recurso, celula.acao)
    if (alcance === 'nunca') throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    return true
  }
}
