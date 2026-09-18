import { EMISSOR_TOKEN, ErroDeDominio, relogioDoSistema, type Relogio } from '@educa/nucleo'
import { CodigoDeErro, ETAPAS_COM_DESAFIO, type EtapaComDesafio } from '@educa/shared'
import type { Redis } from 'ioredis'
import { errors, jwtVerify, SignJWT } from 'jose'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

/**
 * O desafio de login (Tech Spec, seção 4): o JWT que leva a pessoa de uma etapa do login à seguinte, sem sessão.
 * `typ` e `aud` o separam do token de acesso: a guarda de acesso só aceita `typ: JWT` e recusa o desafio, e as rotas
 * de etapa só aceitam `typ: desafio+jwt` com `aud: sessao` e recusam o token de acesso.
 */
export const TIPO_DESAFIO = 'desafio+jwt'
export const AUDIENCIA_DESAFIO = 'sessao'
export const VALIDADE_DESAFIO_SEGUNDOS = 5 * 60
/** Prefixo da marca de desafio já usado, no Redis de fila (que não expulsa chave). */
export const PREFIXO_DESAFIO_USADO = 'desafio:usado:'

export interface PedidoDeDesafio {
  readonly contaId: string
  readonly etapa: EtapaComDesafio
  /** Se o segundo fator já foi cumprido nesta entrada: a troca para uma escola em que a pessoa é coordenadora o exige. */
  readonly mfaCumprido: boolean
  /**
   * O convite cujo bilhete veio no login desta conta (7.0): o usuário que espera por ele só é ativado depois do código.
   * Só existe no desafio `mfa`, e só quando o bilhete conferia com a conta.
   */
  readonly conviteId?: string
}

export interface DesafioVerificado extends PedidoDeDesafio {
  readonly jti: string
  readonly expiraEm: Date
}

const esquemaClaims = z.object({
  jti: z.uuid(),
  exp: z.number().int(),
  conta_id: z.uuid(),
  etapa: z.enum(ETAPAS_COM_DESAFIO),
  mfa_cumprido: z.boolean(),
  convite_id: z.uuid().optional(),
})

/** Emite o desafio de 5 min. Leva só ids, a etapa, o MFA e, no `mfa` do convite, o id dele: nada da pessoa (regra 20). */
export class EmissorDeDesafio {
  constructor(
    private readonly chaveAssinatura: Uint8Array,
    private readonly relogio: Relogio = relogioDoSistema,
  ) {}

  async emitir(pedido: PedidoDeDesafio): Promise<string> {
    const emitidoEm = Math.floor(this.relogio.agora().getTime() / 1_000)
    const convite = pedido.conviteId === undefined ? {} : { convite_id: pedido.conviteId }
    return new SignJWT({ conta_id: pedido.contaId, etapa: pedido.etapa, mfa_cumprido: pedido.mfaCumprido, ...convite })
      .setProtectedHeader({ alg: 'HS256', typ: TIPO_DESAFIO })
      .setIssuer(EMISSOR_TOKEN)
      .setAudience(AUDIENCIA_DESAFIO)
      .setJti(randomUUID())
      .setIssuedAt(emitidoEm)
      .setExpirationTime(emitidoEm + VALIDADE_DESAFIO_SEGUNDOS)
      .sign(this.chaveAssinatura)
  }
}

/**
 * Confere o desafio para as etapas que a rota aceita. Toda recusa é `NAO_AUTENTICADO`, sem dizer qual parte falhou:
 * token de acesso (`typ: JWT`, sem `aud`), desafio vencido, de outra etapa ou com assinatura que não confere.
 * Não consome o `jti`: quem conclui a etapa chama `ConsumoDeDesafio.consumir`.
 */
export async function verificarDesafio(desafio: string, chaveAssinatura: Uint8Array, etapas: readonly EtapaComDesafio[]): Promise<DesafioVerificado> {
  let claims: unknown
  try {
    const verificado = await jwtVerify(desafio, chaveAssinatura, {
      algorithms: ['HS256'],
      typ: TIPO_DESAFIO,
      issuer: EMISSOR_TOKEN,
      audience: AUDIENCIA_DESAFIO,
      requiredClaims: ['exp', 'jti'],
      maxTokenAge: VALIDADE_DESAFIO_SEGUNDOS,
    })
    claims = verificado.payload
  } catch (erro) {
    if (erro instanceof errors.JOSEError) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
    throw erro
  }
  const resultado = esquemaClaims.safeParse(claims)
  if (!resultado.success || !etapas.includes(resultado.data.etapa)) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
  const { jti, exp, conta_id: contaId, etapa, mfa_cumprido: mfaCumprido, convite_id: conviteId } = resultado.data
  const convite = conviteId === undefined ? {} : { conviteId: conviteId.toLowerCase() }
  return { jti, expiraEm: new Date(exp * 1_000), contaId: contaId.toLowerCase(), etapa, mfaCumprido, ...convite }
}

/**
 * Marca o desafio como usado, uma vez só: `SET NX` no Redis de fila, com prazo até o desafio vencer. A segunda
 * conclusão da mesma etapa com o mesmo desafio (clique duplo, reenvio, cópia do desafio) é recusada, e as duas nunca
 * passam juntas (regra 80, item 7).
 *
 * Com o Redis fora, recusa: sem a marca, o desafio poderia ser reusado, e quem perde é só quem tem MFA ou mais de uma
 * escola, que entra de novo (Tech Spec, seção 4).
 */
export class ConsumoDeDesafio {
  constructor(
    private readonly cliente: Redis,
    private readonly relogio: Relogio = relogioDoSistema,
  ) {}

  /**
   * Antes de conferir o fator: recusa o desafio já usado (concluído, ou consumido pelo quinto erro), e recusa também
   * com o Redis fora ou sem resposta, sem esperar: sem a marca, não dá para saber se ele ainda vale. Não consome.
   */
  async conferirLivre(desafio: Pick<DesafioVerificado, 'jti'>): Promise<void> {
    if (this.cliente.status !== 'ready') throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
    let usado: number
    try {
      usado = await this.cliente.exists(`${PREFIXO_DESAFIO_USADO}${desafio.jti}`)
    } catch {
      throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
    }
    if (usado !== 0) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
  }

  async consumir(desafio: Pick<DesafioVerificado, 'jti' | 'expiraEm'>): Promise<void> {
    const prazoMs = Math.max(1, desafio.expiraEm.getTime() - this.relogio.agora().getTime())
    let marcado: string | null
    try {
      marcado = await this.cliente.set(`${PREFIXO_DESAFIO_USADO}${desafio.jti}`, '1', 'PX', prazoMs, 'NX')
    } catch {
      throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
    }
    if (marcado !== 'OK') throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
  }
}
