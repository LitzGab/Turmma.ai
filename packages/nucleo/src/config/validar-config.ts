import { z } from 'zod'

/**
 * Configuração inválida no boot. A mensagem cita só o nome da variável, e o motivo quando ele
 * é texto fixo nosso: o valor pode ser senha ou chave de assinatura.
 */
export class ConfiguracaoInvalida extends Error {
  constructor(
    readonly variaveis: string[],
    readonly motivos: string[] = [],
  ) {
    super(['Configuração inválida ou ausente: ' + variaveis.join(', '), ...motivos].join('. '))
    this.name = 'ConfiguracaoInvalida'
  }
}

/**
 * Valida o ambiente contra o esquema e devolve os valores convertidos. Toda variável inválida é
 * apontada de uma vez, pelo nome. Mensagem de problema só entra quando é de regra nossa
 * (`code: 'custom'`), que é texto fixo; a do zod pode repetir o valor recebido.
 */
export function validarAmbiente<Esquema extends z.ZodType>(
  esquema: Esquema,
  ambiente: Record<string, string | undefined>,
): z.output<Esquema> {
  const resultado = esquema.safeParse(ambiente)
  if (resultado.success) return resultado.data
  const problemas = resultado.error.issues
  const variaveis = [...new Set(problemas.map((problema) => String(problema.path[0])))].sort()
  const motivos = problemas.filter((problema) => problema.code === 'custom').map((problema) => problema.message)
  throw new ConfiguracaoInvalida(variaveis, motivos)
}

export const AMBIENTES = ['local', 'staging', 'producao'] as const
export type Ambiente = (typeof AMBIENTES)[number]

/** Emissor do token de `npm run ops:token-sintetico`. O F1 acrescenta o emissor do login real. */
export const EMISSOR_TOKEN_SINTETICO = 'sintetico'

/** HMAC-SHA256 pede chave de pelo menos 256 bits; abaixo disso a assinatura fica fácil de forjar. */
export const TAMANHO_MINIMO_CHAVE_ASSINATURA = 32

export const MOTIVO_TOKEN_SINTETICO_EM_PRODUCAO =
  'ACEITAR_TOKEN_SINTETICO=true é proibido com AMBIENTE=producao: token sintético não existe em produção'

/**
 * Variáveis da identidade. `ACEITAR_TOKEN_SINTETICO` só aceita `true` ou `false`, escrito assim:
 * `1`, `TRUE` ou vazio reprovam, para ninguém ligar a flag sem querer nem desligá-la achando que
 * desligou.
 */
export const esquemaAmbienteIdentidade = z
  .object({
    AMBIENTE: z.enum(AMBIENTES),
    ACEITAR_TOKEN_SINTETICO: z.enum(['true', 'false']),
    IDENTIDADE_CHAVE_ASSINATURA: z.string().min(TAMANHO_MINIMO_CHAVE_ASSINATURA),
  })
  .superRefine((valores, contexto) => {
    if (valores.AMBIENTE === 'producao' && valores.ACEITAR_TOKEN_SINTETICO === 'true') {
      contexto.addIssue({ code: 'custom', path: ['ACEITAR_TOKEN_SINTETICO'], message: MOTIVO_TOKEN_SINTETICO_EM_PRODUCAO })
    }
  })

export interface ConfiguracaoIdentidade {
  readonly ambiente: Ambiente
  /** Chave HMAC do HS256. Nunca vai para log nem para resposta. */
  readonly chaveAssinatura: Uint8Array
  /** Com a flag desligada, a lista não tem o emissor sintético, e o token dele é recusado. */
  readonly emissoresAceitos: readonly string[]
}

export function lerConfiguracaoIdentidade(ambiente: Record<string, string | undefined>): ConfiguracaoIdentidade {
  const valores = validarAmbiente(esquemaAmbienteIdentidade, ambiente)
  return {
    ambiente: valores.AMBIENTE,
    chaveAssinatura: new TextEncoder().encode(valores.IDENTIDADE_CHAVE_ASSINATURA),
    emissoresAceitos: valores.ACEITAR_TOKEN_SINTETICO === 'true' ? [EMISSOR_TOKEN_SINTETICO] : [],
  }
}
