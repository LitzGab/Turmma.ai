import { AMBIENTES_DO_SISTEMA } from '@educa/shared'
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

/** Um só conjunto: a casca recebe o ambiente pelo contrato de `packages/shared`. */
export const AMBIENTES = AMBIENTES_DO_SISTEMA
export type Ambiente = (typeof AMBIENTES)[number]

/** Emissor do token de `npm run ops:token-sintetico`, do F0. Sai na tarefa 3.0, junto com a flag. */
export const EMISSOR_TOKEN_SINTETICO = 'sintetico'

/** Emissor do token de acesso da sessão real (`EmissorDeToken`). Sempre aceito. */
export const EMISSOR_TOKEN = 'educa'

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

export const MOTIVO_VAGAS_DESLIGADAS_EM_PRODUCAO =
  'VAGAS_POR_ESCOLA_DESLIGADAS=true é proibido com AMBIENTE=producao: sem a vaga por escola, uma escola barulhenta ocupa os workers de todas'

/**
 * Controle negativo do cenário "justiça entre escolas" (`npm run carga:controle-negativo`): com a flag em
 * `true`, despachante e worker deixam de limitar os jobs simultâneos de cada escola, e o cenário precisa
 * reprovar. Só aceita `true` ou `false`, escritos assim, e nunca `true` em produção: a flag de teste não
 * pode virar porta aberta (regra 80, item 3).
 */
export const esquemaAmbienteVagasDesligadas = z
  .object({
    AMBIENTE: z.enum(AMBIENTES),
    VAGAS_POR_ESCOLA_DESLIGADAS: z.enum(['true', 'false']),
  })
  .superRefine((valores, contexto) => {
    if (valores.AMBIENTE === 'producao' && valores.VAGAS_POR_ESCOLA_DESLIGADAS === 'true') {
      contexto.addIssue({ code: 'custom', path: ['VAGAS_POR_ESCOLA_DESLIGADAS'], message: MOTIVO_VAGAS_DESLIGADAS_EM_PRODUCAO })
    }
  })

/** `true` só no controle negativo do cenário de carga, e nunca em produção. */
export function lerVagasPorEscolaDesligadas(ambiente: Record<string, string | undefined>): boolean {
  return validarAmbiente(esquemaAmbienteVagasDesligadas, ambiente).VAGAS_POR_ESCOLA_DESLIGADAS === 'true'
}

export interface ConfiguracaoIdentidade {
  readonly ambiente: Ambiente
  /** Chave HMAC do HS256. Nunca vai para log nem para resposta. */
  readonly chaveAssinatura: Uint8Array
  /**
   * Sempre o emissor `educa`, da sessão real. O sintético só com a flag ligada, e mesmo assim o token dele não
   * passa da `GuardaDeSessao` sem uma sessão gravada.
   */
  readonly emissoresAceitos: readonly string[]
}

export function lerConfiguracaoIdentidade(ambiente: Record<string, string | undefined>): ConfiguracaoIdentidade {
  const valores = validarAmbiente(esquemaAmbienteIdentidade, ambiente)
  return {
    ambiente: valores.AMBIENTE,
    chaveAssinatura: new TextEncoder().encode(valores.IDENTIDADE_CHAVE_ASSINATURA),
    emissoresAceitos: valores.ACEITAR_TOKEN_SINTETICO === 'true' ? [EMISSOR_TOKEN, EMISSOR_TOKEN_SINTETICO] : [EMISSOR_TOKEN],
  }
}
