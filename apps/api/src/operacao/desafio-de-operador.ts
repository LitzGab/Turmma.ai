import { EMISSOR_TOKEN, ErroDeDominio, relogioDoSistema, TIPO_DESAFIO_DE_OPERADOR, type Relogio } from '@educa/nucleo'
import { CodigoDeErro } from '@educa/shared'
import { errors, jwtVerify, SignJWT } from 'jose'
import { randomUUID } from 'node:crypto'
import { z } from 'zod'

/**
 * O desafio do operador (Tech Spec da A0, seções 4 e 5, "Etapas"): o JWT de 5 min que leva do aceite do convite e da
 * entrada por e-mail ao segundo fator, sem sessão. `typ: desafio-operador+jwt` e `aud: operacao` o separam de tudo o
 * mais: o desafio de login da escola (`desafio+jwt`, `aud: sessao`) não passa aqui, e este não passa lá; como bearer,
 * nenhuma rota o aceita (C21).
 *
 * Leva só o id do operador, a etapa e o `jti`. O `jti` vale uma vez: quem conclui a etapa o consome (`SET NX` no
 * Redis, tarefa 7.0); até lá, este arquivo só emite e confere.
 */
export const AUDIENCIA_DESAFIO_DE_OPERADOR = 'operacao'
export const VALIDADE_DESAFIO_DE_OPERADOR_SEGUNDOS = 5 * 60

/** As etapas do desafio do operador: configurar o segundo fator, ou informar o código. Cada rota aceita só a sua. */
export const ETAPAS_DO_DESAFIO_DE_OPERADOR = ['configurar_mfa', 'mfa'] as const
export type EtapaDoDesafioDeOperador = (typeof ETAPAS_DO_DESAFIO_DE_OPERADOR)[number]

export interface PedidoDeDesafioDeOperador {
  readonly operadorId: string
  readonly etapa: EtapaDoDesafioDeOperador
}

export interface DesafioDeOperadorVerificado extends PedidoDeDesafioDeOperador {
  readonly jti: string
  readonly expiraEm: Date
}

const esquemaClaims = z.object({
  jti: z.uuid(),
  exp: z.number().int(),
  sub: z.uuid(),
  etapa: z.enum(ETAPAS_DO_DESAFIO_DE_OPERADOR),
})

export class EmissorDeDesafioDeOperador {
  constructor(
    private readonly chaveAssinatura: Uint8Array,
    private readonly relogio: Relogio = relogioDoSistema,
  ) {}

  async emitir(pedido: PedidoDeDesafioDeOperador): Promise<string> {
    const emitidoEm = Math.floor(this.relogio.agora().getTime() / 1_000)
    return new SignJWT({ etapa: pedido.etapa })
      .setProtectedHeader({ alg: 'HS256', typ: TIPO_DESAFIO_DE_OPERADOR })
      .setIssuer(EMISSOR_TOKEN)
      .setAudience(AUDIENCIA_DESAFIO_DE_OPERADOR)
      .setSubject(pedido.operadorId)
      .setJti(randomUUID())
      .setIssuedAt(emitidoEm)
      .setExpirationTime(emitidoEm + VALIDADE_DESAFIO_DE_OPERADOR_SEGUNDOS)
      .sign(this.chaveAssinatura)
  }
}

/**
 * Confere o desafio do operador para a etapa da rota. Toda recusa é `NAO_AUTENTICADO`, sem dizer o que falhou: outro
 * `typ` (o token de acesso, o desafio da escola), outra audiência, vencido, de outra etapa ou com assinatura que não
 * confere. Não consome o `jti` (tarefa 7.0).
 */
export async function verificarDesafioDeOperador(desafio: string, chaveAssinatura: Uint8Array, etapa: EtapaDoDesafioDeOperador): Promise<DesafioDeOperadorVerificado> {
  let claims: unknown
  try {
    const verificado = await jwtVerify(desafio, chaveAssinatura, {
      algorithms: ['HS256'],
      typ: TIPO_DESAFIO_DE_OPERADOR,
      issuer: EMISSOR_TOKEN,
      audience: AUDIENCIA_DESAFIO_DE_OPERADOR,
      requiredClaims: ['exp', 'jti', 'sub'],
      maxTokenAge: VALIDADE_DESAFIO_DE_OPERADOR_SEGUNDOS,
    })
    claims = verificado.payload
  } catch (erro) {
    if (erro instanceof errors.JOSEError) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
    throw erro
  }
  const resultado = esquemaClaims.safeParse(claims)
  if (!resultado.success || resultado.data.etapa !== etapa) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
  return { jti: resultado.data.jti, expiraEm: new Date(resultado.data.exp * 1_000), operadorId: resultado.data.sub.toLowerCase(), etapa: resultado.data.etapa }
}
