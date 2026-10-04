import { z } from 'zod'
import { PERFIS, type Perfil } from '../ia/perfis.js'
import { AMBIENTES, validarAmbiente } from './validar-config.js'

/**
 * `falso` é o adaptador determinístico dos testes e da demonstração sem modelo; `openai_compat` fala com qualquer
 * servidor do padrão `chat/completions` (o `llama-server` local no ensaio, o provedor contratado depois). Trocar de
 * um para o outro é só variável de ambiente (D13).
 */
export const ADAPTADORES_DE_IA = ['falso', 'openai_compat'] as const
export type AdaptadorDeIa = (typeof ADAPTADORES_DE_IA)[number]

export const MOTIVO_ADAPTADOR_FALSO_EM_PRODUCAO =
  'IA_ADAPTADOR=falso é proibido com AMBIENTE=producao: o adaptador falso devolve conteúdo determinístico de demonstração, e escola real receberia isso como se fosse a IA'
export const MOTIVO_LLM_SEM_ENDERECO = 'IA_ADAPTADOR=openai_compat precisa de LLM_BASE_URL, em http ou https'
export const MOTIVO_LLM_SEM_MODELO = 'IA_ADAPTADOR=openai_compat precisa de LLM_MODELO, ou de LLM_MODELO_<PERFIL> para os quatro perfis'
export const MOTIVO_PROCESSAMENTO_LOCAL_EM_ENDERECO_DE_FORA =
  'LLM_PROCESSAMENTO_LOCAL=true só vale com LLM_BASE_URL nesta máquina ou em rede privada: declarar local um provedor de fora apagaria o registro de envio externo'
export const MOTIVO_EXECUCAO_MAIS_CURTA_QUE_A_CHAMADA =
  'IA_EXECUCAO_TIMEOUT_MS precisa ser maior que LLM_TIMEOUT_MS: senão a execução estoura antes de a chamada ao modelo terminar'
export const MOTIVO_VAGAS_DE_IA_INCOERENTES = 'IA_EXECUCOES_POR_ESCOLA não pode passar de IA_EXECUCOES_TOTAL: uma escola sozinha ocuparia todas as vagas'

/** O compose entrega variável sem valor como texto vazio: vale como ausente, e o padrão entra. */
const opcional = <Esquema extends z.ZodType>(esquema: Esquema) => z.preprocess((valor) => (valor === '' ? undefined : valor), esquema)

const modelo = opcional(z.string().min(1).max(200).optional())
const inteiro = (minimo: number, maximo: number, padrao: number) => opcional(z.coerce.number().int().min(minimo).max(maximo).default(padrao))

/** Loopback, rede privada, o host do Docker ou nome de serviço do compose (sem ponto): o conteúdo não sai da nossa rede. */
function enderecoDaNossaRede(endereco: string): boolean {
  // Endereço que nem é URL já foi apontado pelo próprio campo: aqui não há o que conferir.
  if (!URL.canParse(endereco)) return true
  const host = new URL(endereco).hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host === '::1' || host === 'host.docker.internal' || !host.includes('.')) return true
  return /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
}

/**
 * Nenhuma destas variáveis é obrigatória: sem elas a API sobe com o adaptador falso. Em produção o falso é recusado,
 * e aí o adaptador, o endereço e o modelo passam a ser exigidos.
 */
export const esquemaAmbienteDeIa = z
  .object({
    AMBIENTE: z.enum(AMBIENTES),
    IA_ADAPTADOR: opcional(z.enum(ADAPTADORES_DE_IA).default('falso')),
    LLM_BASE_URL: opcional(z.url({ protocol: /^https?$/ }).optional()),
    LLM_MODELO: modelo,
    LLM_MODELO_RAPIDO: modelo,
    LLM_MODELO_PADRAO: modelo,
    LLM_MODELO_COMPLEXO: modelo,
    LLM_MODELO_VISAO: modelo,
    /** Só para provedor que exige chave. Nunca vai para log, erro nem registro. */
    LLM_CHAVE_API: opcional(z.string().min(1).optional()),
    LLM_TIMEOUT_MS: inteiro(1_000, 600_000, 60_000),
    LLM_PROCESSAMENTO_LOCAL: opcional(z.enum(['true', 'false']).default('false')),
    IA_EXECUCOES_POR_ESCOLA: inteiro(1, 100, 2),
    IA_EXECUCOES_TOTAL: inteiro(1, 1_000, 8),
    IA_EXECUCAO_TIMEOUT_MS: inteiro(1_000, 3_600_000, 150_000),
  })
  .superRefine((valores, contexto) => {
    const problema = (variavel: string, message: string): void => contexto.addIssue({ code: 'custom', path: [variavel], message })
    if (valores.AMBIENTE === 'producao' && valores.IA_ADAPTADOR === 'falso') problema('IA_ADAPTADOR', MOTIVO_ADAPTADOR_FALSO_EM_PRODUCAO)
    if (valores.IA_EXECUCAO_TIMEOUT_MS <= valores.LLM_TIMEOUT_MS) problema('IA_EXECUCAO_TIMEOUT_MS', MOTIVO_EXECUCAO_MAIS_CURTA_QUE_A_CHAMADA)
    if (valores.IA_EXECUCOES_POR_ESCOLA > valores.IA_EXECUCOES_TOTAL) problema('IA_EXECUCOES_POR_ESCOLA', MOTIVO_VAGAS_DE_IA_INCOERENTES)
    if (valores.IA_ADAPTADOR !== 'openai_compat') return
    if (valores.LLM_BASE_URL === undefined) problema('LLM_BASE_URL', MOTIVO_LLM_SEM_ENDERECO)
    else if (valores.LLM_PROCESSAMENTO_LOCAL === 'true' && !enderecoDaNossaRede(valores.LLM_BASE_URL)) {
      problema('LLM_PROCESSAMENTO_LOCAL', MOTIVO_PROCESSAMENTO_LOCAL_EM_ENDERECO_DE_FORA)
    }
    const porPerfil = [valores.LLM_MODELO_RAPIDO, valores.LLM_MODELO_PADRAO, valores.LLM_MODELO_COMPLEXO, valores.LLM_MODELO_VISAO]
    if (valores.LLM_MODELO === undefined && porPerfil.includes(undefined)) problema('LLM_MODELO', MOTIVO_LLM_SEM_MODELO)
  })

export interface ConfiguracaoDoModelo {
  /** A raiz da API do padrão OpenAI, com o `/v1`: o adaptador só acrescenta `/chat/completions`. */
  readonly baseUrl: string
  /** O id do modelo de cada perfil: o `LLM_MODELO_<PERFIL>`, ou o `LLM_MODELO` comum. */
  readonly modelos: Readonly<Record<Perfil, string>>
  readonly chaveApi?: string
  /** O modelo roda na nossa máquina ou rede: não há envio externo. */
  readonly processamentoLocal: boolean
}

export interface ConfiguracaoDoExecutor {
  /** Execuções de IA de uma mesma escola ao mesmo tempo (regra 80, item 3). */
  readonly vagasPorEscola: number
  /** Execuções de IA ao mesmo tempo neste processo. */
  readonly vagasNoTotal: number
  readonly timeoutMs: number
}

export interface ConfiguracaoDeIa {
  readonly adaptador: AdaptadorDeIa
  /** Só com `openai_compat`. */
  readonly modelo?: ConfiguracaoDoModelo
  /** Prazo de cada chamada ao modelo. */
  readonly timeoutMs: number
  readonly executor: ConfiguracaoDoExecutor
}

export function lerConfiguracaoDeIa(ambiente: Record<string, string | undefined>): ConfiguracaoDeIa {
  const valores = validarAmbiente(esquemaAmbienteDeIa, ambiente)
  const base = {
    adaptador: valores.IA_ADAPTADOR,
    timeoutMs: valores.LLM_TIMEOUT_MS,
    executor: { vagasPorEscola: valores.IA_EXECUCOES_POR_ESCOLA, vagasNoTotal: valores.IA_EXECUCOES_TOTAL, timeoutMs: valores.IA_EXECUCAO_TIMEOUT_MS },
  }
  if (valores.IA_ADAPTADOR !== 'openai_compat' || valores.LLM_BASE_URL === undefined) return base
  const doPerfil: Readonly<Record<Perfil, string | undefined>> = {
    rapido: valores.LLM_MODELO_RAPIDO,
    padrao: valores.LLM_MODELO_PADRAO,
    complexo: valores.LLM_MODELO_COMPLEXO,
    visao: valores.LLM_MODELO_VISAO,
  }
  const comum = valores.LLM_MODELO ?? ''
  const modelos = Object.fromEntries(PERFIS.map((perfil) => [perfil, doPerfil[perfil] ?? comum])) as Record<Perfil, string>
  return {
    ...base,
    modelo: {
      baseUrl: valores.LLM_BASE_URL,
      modelos,
      ...(valores.LLM_CHAVE_API === undefined ? {} : { chaveApi: valores.LLM_CHAVE_API }),
      processamentoLocal: valores.LLM_PROCESSAMENTO_LOCAL === 'true',
    },
  }
}
