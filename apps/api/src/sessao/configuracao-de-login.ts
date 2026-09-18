import { ConfiguracaoInvalida, validarAmbiente } from '@educa/nucleo'
import { z } from 'zod'

/** Mínimo da OWASP para argon2id com um fio (m=19456 KiB, t=2). A calibração da 16.0 só sobe a partir daqui. */
export const MEMORIA_MINIMA_ARGON2_KIB = 19_456
export const ITERACOES_MINIMAS_ARGON2 = 2

/** Chave de HMAC com pelo menos 256 bits, como a de assinatura do token. */
export const TAMANHO_MINIMO_CHAVE_DE_LOGIN = 32

/** Os parâmetros do argon2id. O paralelismo é sempre 1 (Tech Spec, seção 5, "Hash"). */
export interface ParametrosDoHash {
  readonly memoriaKib: number
  readonly iteracoes: number
}

export interface ConfiguracaoLogin {
  readonly hash: ParametrosDoHash
  /** Chave do HMAC do identificador na chave do contador de tentativas: o Redis nunca vê o e-mail. */
  readonly chaveContador: Uint8Array
  /** A chave do HMAC das entradas do cookie `educa_dispositivo`, com a versão que vai no próprio cookie. */
  readonly dispositivo: { readonly versao: number; readonly chave: Uint8Array }
}

const esquemaAmbienteLogin = z.object({
  LOGIN_ARGON2_MEMORIA_KIB: z.coerce.number().int().min(MEMORIA_MINIMA_ARGON2_KIB),
  LOGIN_ARGON2_ITERACOES: z.coerce.number().int().min(ITERACOES_MINIMAS_ARGON2),
  LOGIN_CHAVE_CONTADOR: z.string().min(TAMANHO_MINIMO_CHAVE_DE_LOGIN),
  LOGIN_CHAVE_DISPOSITIVO_VERSAO: z.coerce.number().int().min(1).max(99),
})

/** O nome da variável da chave de dispositivo da versão: trocar a versão invalida todo cookie já emitido. */
export function variavelDaChaveDeDispositivo(versao: number): string {
  return `LOGIN_CHAVE_DISPOSITIVO_V${String(versao)}`
}

/**
 * Lê a configuração do login por e-mail. Não sobe com parâmetro do argon2 abaixo da OWASP, com chave curta, nem sem
 * a chave da versão de dispositivo declarada. As mensagens citam só o nome da variável.
 */
export function lerConfiguracaoLogin(ambiente: Record<string, string | undefined>): ConfiguracaoLogin {
  const valores = validarAmbiente(esquemaAmbienteLogin, ambiente)
  const variavel = variavelDaChaveDeDispositivo(valores.LOGIN_CHAVE_DISPOSITIVO_VERSAO)
  const chaveDispositivo = ambiente[variavel]
  if (chaveDispositivo === undefined || chaveDispositivo.length < TAMANHO_MINIMO_CHAVE_DE_LOGIN) throw new ConfiguracaoInvalida([variavel])
  if (chaveDispositivo === valores.LOGIN_CHAVE_CONTADOR) {
    throw new ConfiguracaoInvalida([variavel], [`${variavel} precisa ser diferente de LOGIN_CHAVE_CONTADOR: cada HMAC tem a própria chave`])
  }
  const codificar = (texto: string) => new TextEncoder().encode(texto)
  return {
    hash: { memoriaKib: valores.LOGIN_ARGON2_MEMORIA_KIB, iteracoes: valores.LOGIN_ARGON2_ITERACOES },
    chaveContador: codificar(valores.LOGIN_CHAVE_CONTADOR),
    dispositivo: { versao: valores.LOGIN_CHAVE_DISPOSITIVO_VERSAO, chave: codificar(chaveDispositivo) },
  }
}
