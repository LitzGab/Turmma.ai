import { CodigoDeErro } from '@educa/shared'
import { errors, jwtVerify } from 'jose'
import { z } from 'zod'
import type { ConfiguracaoIdentidade } from '../config/validar-config.js'
import { ErroDeDominio } from '../erro/erro-de-dominio.js'

/** Quem fez a requisição. Só ids: o token não carrega nome, papel nem nada da pessoa (regra 20). */
export interface Identidade {
  readonly escolaId: string
  readonly usuarioId: string
}

export const ALGORITMO_TOKEN = 'HS256'
export const TIPO_TOKEN = 'JWT'

/**
 * Prazo máximo que um token pode ter pela frente. Vale na verificação, e não só no emissor: um
 * token assinado com validade de anos é recusado mesmo com assinatura certa.
 */
export const VALIDADE_MAXIMA_TOKEN_SEGUNDOS = 24 * 60 * 60

const esquemaClaims = z.object({
  sub: z.uuid(),
  esc: z.uuid(),
  exp: z.number(),
})

/** Toda recusa é a mesma: quem manda um token meio válido não descobre qual parte falhou. */
function naoAutenticado(): ErroDeDominio {
  return new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
}

/**
 * Verifica o JWT e devolve a identidade dele. Recusa com `NAO_AUTENTICADO` o token com assinatura
 * que não confere, algoritmo diferente de HS256, sem `exp`, vencido ou com mais de 24 h pela frente,
 * de emissor não aceito, ou
 * com `sub` e `esc` ausentes ou fora do formato UUID.
 *
 * Os ids saem em minúsculas: a mesma escola escrita com letra maiúscula não pode virar outra
 * chave de limite ou de sala mais adiante.
 */
export async function verificarToken(token: string, config: ConfiguracaoIdentidade): Promise<Identidade> {
  // Sem emissor aceito, nenhum token vale; não depende de a biblioteca tratar lista vazia.
  if (config.emissoresAceitos.length === 0) throw naoAutenticado()
  let claims: unknown
  try {
    const verificado = await jwtVerify(token, config.chaveAssinatura, {
      algorithms: [ALGORITMO_TOKEN],
      typ: TIPO_TOKEN,
      issuer: [...config.emissoresAceitos],
      requiredClaims: ['exp', 'sub', 'esc'],
    })
    claims = verificado.payload
  } catch (erro) {
    if (erro instanceof errors.JOSEError) throw naoAutenticado()
    throw erro
  }
  const resultado = esquemaClaims.safeParse(claims)
  if (!resultado.success) throw naoAutenticado()
  if (resultado.data.exp - Date.now() / 1000 > VALIDADE_MAXIMA_TOKEN_SEGUNDOS) throw naoAutenticado()
  return { escolaId: resultado.data.esc.toLowerCase(), usuarioId: resultado.data.sub.toLowerCase() }
}

// Três partes base64url. Nada além disso é lido do cabeçalho.
const FORMATO_BEARER = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i

/** Tira o token do cabeçalho `Authorization: Bearer <token>`, ou recusa com `NAO_AUTENTICADO`. */
export function extrairTokenBearer(cabecalho: string | string[] | undefined): string {
  const token = typeof cabecalho === 'string' ? FORMATO_BEARER.exec(cabecalho)?.[1] : undefined
  if (token === undefined) throw naoAutenticado()
  return token
}
