import { SignJWT } from 'jose'
import { EMISSOR_TOKEN } from '../config/validar-config.js'
import { relogioDoSistema, type Relogio } from '../relogio.js'
import { ALGORITMO_TOKEN, TIPO_TOKEN, TIPO_TOKEN_DE_OPERADOR } from './verificar-token.js'

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

  /**
   * @param emitidoEm o instante do `iat`, quando quem chama precisa de um mínimo: a renovação emite o token no segundo
   *   seguinte ao da rotação, para a guarda reconhecer o token dela. Sem ele, vale o relógio.
   */
  async emitir(pedido: PedidoDeTokenDeAcesso, emitidoEm: Date = this.relogio.agora()): Promise<TokenDeAcesso> {
    const iat = Math.floor(emitidoEm.getTime() / 1000)
    const expiraEm = iat + VALIDADE_TOKEN_ACESSO_SEGUNDOS
    const token = await new SignJWT({ esc: pedido.escolaId, sid: pedido.sessaoId })
      .setProtectedHeader({ alg: ALGORITMO_TOKEN, typ: TIPO_TOKEN })
      .setIssuer(EMISSOR_TOKEN)
      .setSubject(pedido.usuarioId)
      .setIssuedAt(iat)
      .setExpirationTime(expiraEm)
      .sign(this.chaveAssinatura)
    return { token, expiraEm: new Date(expiraEm * 1000) }
  }
}

export interface PedidoDeTokenDeOperador {
  readonly operadorId: string
  readonly sessaoId: string
}

/**
 * Emite o token de acesso de uma sessão de operador já gravada (Tech Spec da A0, seção 4): JWT HS256 de 10 min,
 * `typ: operador+jwt`, emissor `educa`, com `sub` (operador) e `sid` (sessão) e **sem `esc`**. O `typ` próprio é o que
 * separa as duas áreas: o `verificarToken` da escola o recusa, e o `verificarTokenDeOperador` recusa o da escola.
 *
 * Mesma chave do token da escola; a separação é o `typ`, conferido nos dois sentidos, e não um segredo a mais para
 * guardar. Quem chama garante que a sessão existe.
 */
export class EmissorDeTokenDeOperador {
  constructor(
    private readonly chaveAssinatura: Uint8Array,
    private readonly relogio: Relogio = relogioDoSistema,
  ) {}

  async emitir(pedido: PedidoDeTokenDeOperador, emitidoEm: Date = this.relogio.agora()): Promise<TokenDeAcesso> {
    const iat = Math.floor(emitidoEm.getTime() / 1000)
    const expiraEm = iat + VALIDADE_TOKEN_ACESSO_SEGUNDOS
    const token = await new SignJWT({ sid: pedido.sessaoId })
      .setProtectedHeader({ alg: ALGORITMO_TOKEN, typ: TIPO_TOKEN_DE_OPERADOR })
      .setIssuer(EMISSOR_TOKEN)
      .setSubject(pedido.operadorId)
      .setIssuedAt(iat)
      .setExpirationTime(expiraEm)
      .sign(this.chaveAssinatura)
    return { token, expiraEm: new Date(expiraEm * 1000) }
  }
}
