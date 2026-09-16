import { SignJWT } from 'jose'
import { EMISSOR_TOKEN } from '../config/validar-config.js'
import { relogioDoSistema, type Relogio } from '../relogio.js'
import { ALGORITMO_TOKEN, TIPO_TOKEN } from './verificar-token.js'

/** Validade do token de acesso. Curta: quem segura a pessoa na escola é a sessão, lida a cada requisição. */
export const VALIDADE_TOKEN_ACESSO_SEGUNDOS = 10 * 60

export interface PedidoDeTokenDeAcesso {
  readonly escolaId: string
  readonly usuarioId: string
  readonly sessaoId: string
}

export interface TokenDeAcesso {
  readonly token: string
  readonly expiraEm: Date
}

/**
 * Emite o token de acesso de uma sessão já gravada: JWT HS256 de 10 min, `typ: JWT`, emissor `educa`, com `sub`
 * (usuário), `esc` (escola) e `sid` (sessão). Nada da pessoa vai no token (regra 20): nem nome, nem papel, que a
 * guarda lê da sessão.
 *
 * Quem chama garante que a sessão existe: o token de uma sessão que não existe é recusado na guarda.
 */
export class EmissorDeToken {
  constructor(
    private readonly chaveAssinatura: Uint8Array,
    private readonly relogio: Relogio = relogioDoSistema,
  ) {}

  async emitir(pedido: PedidoDeTokenDeAcesso): Promise<TokenDeAcesso> {
    const emitidoEm = Math.floor(this.relogio.agora().getTime() / 1000)
    const expiraEm = emitidoEm + VALIDADE_TOKEN_ACESSO_SEGUNDOS
    const token = await new SignJWT({ esc: pedido.escolaId, sid: pedido.sessaoId })
      .setProtectedHeader({ alg: ALGORITMO_TOKEN, typ: TIPO_TOKEN })
      .setIssuer(EMISSOR_TOKEN)
      .setSubject(pedido.usuarioId)
      .setIssuedAt(emitidoEm)
      .setExpirationTime(expiraEm)
      .sign(this.chaveAssinatura)
    return { token, expiraEm: new Date(expiraEm * 1000) }
  }
}
