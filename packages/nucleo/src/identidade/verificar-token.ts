import { CodigoDeErro } from '@educa/shared'
import { errors, jwtVerify } from 'jose'
import { z } from 'zod'
import { EMISSOR_TOKEN, type ConfiguracaoIdentidade } from '../config/validar-config.js'
import { ErroDeDominio } from '../erro/erro-de-dominio.js'

/** Quem fez a requisição. Só ids: o token não carrega nome, papel nem nada da pessoa (regra 20). */
export interface Identidade {
  readonly escolaId: string
  readonly usuarioId: string
}

// Marca só de tipo, sem valor em execução: o objeto tem só os três ids.
declare const MARCA_DO_TOKEN_VERIFICADO: unique symbol

/**
 * O que um JWT com assinatura, emissor, tipo e prazo conferidos diz: a escola, o usuário e a sessão. Só o
 * `verificarToken` produz este tipo, e é só com ele que a guarda lê a sessão: nenhum id que o cliente mande em
 * query, corpo ou cabeçalho vira escopo (regra 10, item 3).
 *
 * Verificado não quer dizer válido: a sessão ainda pode estar encerrada, ou o usuário desativado. Quem decide é a
 * `GuardaDeSessao`, que lê a sessão por `(escolaId, sessaoId)`.
 */
export interface TokenVerificado extends Identidade {
  readonly sessaoId: string
  readonly [MARCA_DO_TOKEN_VERIFICADO]: true
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
  sid: z.uuid(),
  exp: z.number(),
})

/** Toda recusa é a mesma: quem manda um token meio válido não descobre qual parte falhou. */
function naoAutenticado(): ErroDeDominio {
  return new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
}

/**
 * Verifica o JWT de acesso e devolve a escola, o usuário e a sessão dele. Recusa com `NAO_AUTENTICADO` o token
 * com assinatura que não confere, algoritmo diferente de HS256, `typ` diferente de `JWT` (o desafio de login,
 * `desafio+jwt`, não passa por aqui), sem `exp`, vencido ou com mais de 24 h pela frente, de emissor diferente
 * de `educa`, ou com `sub`, `esc` e `sid` ausentes ou fora do formato UUID.
 *
 * O emissor é constante, não configuração: não há variável de ambiente que faça a API aceitar um segundo
 * emissor. Token assinado com a mesma chave e outro `iss` é recusado em qualquer ambiente.
 *
 * Os ids saem em minúsculas: a mesma escola escrita com letra maiúscula não pode virar outra
 * chave de limite, de sessão ou de sala mais adiante.
 */
export async function verificarToken(token: string, config: ConfiguracaoIdentidade): Promise<TokenVerificado> {
  let claims: unknown
  try {
    const verificado = await jwtVerify(token, config.chaveAssinatura, {
      algorithms: [ALGORITMO_TOKEN],
      typ: TIPO_TOKEN,
      issuer: EMISSOR_TOKEN,
      requiredClaims: ['exp', 'sub', 'esc', 'sid'],
    })
    claims = verificado.payload
  } catch (erro) {
    if (erro instanceof errors.JOSEError) throw naoAutenticado()
    throw erro
  }
  const resultado = esquemaClaims.safeParse(claims)
  if (!resultado.success) throw naoAutenticado()
  if (resultado.data.exp - Date.now() / 1000 > VALIDADE_MAXIMA_TOKEN_SEGUNDOS) throw naoAutenticado()
  const ids = {
    escolaId: resultado.data.esc.toLowerCase(),
    usuarioId: resultado.data.sub.toLowerCase(),
    sessaoId: resultado.data.sid.toLowerCase(),
  }
  return ids as TokenVerificado
}

// Três partes base64url. Nada além disso é lido do cabeçalho.
const FORMATO_BEARER = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/i

/** Tira o token do cabeçalho `Authorization: Bearer <token>`, ou recusa com `NAO_AUTENTICADO`. */
export function extrairTokenBearer(cabecalho: string | string[] | undefined): string {
  const token = typeof cabecalho === 'string' ? FORMATO_BEARER.exec(cabecalho)?.[1] : undefined
  if (token === undefined) throw naoAutenticado()
  return token
}
