import type { ChaveDeFuncao } from '@educa/shared'
import type { ConfiguracaoDeIa } from '../config/config-ia.js'
import { ConfiguracaoInvalida } from '../config/validar-config.js'
import { resumirErro } from '../erro/resumir-erro.js'
import type { LoggerBase } from '../log/logger.js'
import { relogioDoSistema, type Relogio } from '../relogio.js'
import type { AdaptadorDeModelo, CorrecaoPedida } from './adaptador.js'
import { AdaptadorFalso } from './adaptador-falso.js'
import { AdaptadorOpenAICompat } from './adaptador-openai-compat.js'
import type { ConsumoDeIa, OrcamentoDeIa, RegistroDeConsumo } from './consumo.js'
import { ErroDeIa, type CodigoDeErroDeIa } from './erros.js'
import type { LLMProvider, MedicaoDaGeracao, PedidoDeGeracao, ResultadoDaGeracao } from './porta.js'
import type { TarefaDeIa } from './tarefa.js'

/** O que o provedor escreve no log: evento fixo, ids, duração. Nunca entrada, saída nem prompt (regra 20, item 9). */
export type RegistradorDeIa = Pick<LoggerBase, 'info' | 'warn'>

export interface DependenciasDoProvedor {
  readonly adaptador: AdaptadorDeModelo
  readonly registro: RegistroDeConsumo
  readonly orcamento: OrcamentoDeIa
  /** Prazo de cada chamada ao modelo (`LLM_TIMEOUT_MS`). */
  readonly timeoutMs: number
  readonly logger?: RegistradorDeIa
  readonly relogio?: Relogio
}

/** Funções cujo gasto é de um aluno: sem `alunoId` não há como consultar o freio dele, e a chamada é recusada. */
const FUNCOES_COM_ORCAMENTO_POR_ALUNO: ReadonlySet<ChaveDeFuncao> = new Set<ChaveDeFuncao>(['tutor_com_o_aluno'])

/** Uma primeira chamada e uma repetição, dizendo ao modelo o que veio errado. Depois disso é erro tipado. */
const TENTATIVAS_MAXIMAS = 2
const PROBLEMAS_MAXIMOS_NA_REPETICAO = 8
export const MODELO_DA_REGRA_FIXA = 'regra_fixa'

type Interpretacao<Saida> = { readonly ok: true; readonly saida: Saida } | { readonly ok: false; readonly problemas: readonly string[] }

/** Do texto do modelo à saída que o domínio pode usar: JSON, schema, ajuste e conferência da tarefa, nesta ordem. */
function interpretar<Entrada, Saida>(tarefa: TarefaDeIa<Entrada, Saida>, entrada: Entrada, texto: string): Interpretacao<Saida> {
  let bruto: unknown
  try {
    bruto = JSON.parse(texto)
  } catch {
    return { ok: false, problemas: ['A resposta não é um JSON válido: veio texto fora do objeto, ou o objeto veio cortado.'] }
  }
  return validar(tarefa, entrada, bruto)
}

function validar<Entrada, Saida>(tarefa: TarefaDeIa<Entrada, Saida>, entrada: Entrada, bruto: unknown): Interpretacao<Saida> {
  const lida = tarefa.esquemaDeSaida.safeParse(bruto)
  if (!lida.success) {
    const problemas = lida.error.issues.slice(0, PROBLEMAS_MAXIMOS_NA_REPETICAO).map((problema) => `${problema.path.join('.') || 'resposta'}: ${problema.message}`)
    return { ok: false, problemas }
  }
  const saida = tarefa.ajustar?.(entrada, lida.data) ?? lida.data
  const problemas = tarefa.conferir?.(entrada, saida) ?? []
  return problemas.length === 0 ? { ok: true, saida } : { ok: false, problemas: problemas.slice(0, PROBLEMAS_MAXIMOS_NA_REPETICAO) }
}

interface Gasto {
  modelo: string
  tokensDeEntrada: number
  tokensDeSaida: number
  tentativas: number
}

/**
 * A implementação da porta, igual para todo adaptador. Em toda chamada, nesta ordem: valida a entrada, consulta o
 * orçamento, chama o modelo com prazo, valida a saída (repetindo uma vez), registra o consumo e escreve o log.
 *
 * Nada que não foi registrado é devolvido: se o registro falhar, a chamada falha (regra 30, item 4).
 */
export class ProvedorDeIa implements LLMProvider {
  private readonly relogio: Relogio

  constructor(private readonly dependencias: DependenciasDoProvedor) {
    this.relogio = dependencias.relogio ?? relogioDoSistema
  }

  async gerar<Entrada, Saida>(pedido: PedidoDeGeracao<Entrada, Saida>): Promise<ResultadoDaGeracao<Saida>> {
    const { tarefa } = pedido
    const { adaptador } = this.dependencias
    const inicio = performance.now()

    // Entrada fora do schema é erro de quem chamou, antes de qualquer gasto: chave a mais (um nome) para aqui.
    const lida = tarefa.esquemaDeEntrada.safeParse(pedido.entrada)
    if (!lida.success || (FUNCOES_COM_ORCAMENTO_POR_ALUNO.has(tarefa.funcao) && pedido.alunoId === undefined)) {
      this.avisar(pedido, 'IA_ENTRADA_INVALIDA', inicio, 0)
      throw new ErroDeIa('IA_ENTRADA_INVALIDA')
    }
    const entrada = lida.data

    await this.exigirOrcamento(pedido, inicio)

    const gasto: Gasto = { modelo: adaptador.modeloDoPerfil(tarefa.perfil), tokensDeEntrada: 0, tokensDeSaida: 0, tentativas: 0 }
    const fixa = tarefa.semModelo?.(entrada)
    let saida: Saida
    try {
      saida = fixa === undefined ? await this.chamarAteValer(pedido, entrada, gasto) : this.exigirSaidaFixa(tarefa, entrada, fixa)
    } catch (erro) {
      const codigo: CodigoDeErroDeIa = erro instanceof ErroDeIa ? erro.codigoDeIa : 'IA_INDISPONIVEL'
      // Erro que não é da camada é defeito nosso (na versão determinística, na conferência): fica o resumo, sem mensagem.
      if (!(erro instanceof ErroDeIa)) this.dependencias.logger?.warn({ evento: 'ia.geracao.erro_inesperado', erro: resumirErro(erro) })
      const medicao = this.medir(pedido, gasto, inicio, false)
      // O registro da falha é o melhor possível: se ele também falhar, o erro que sobe continua sendo o da chamada.
      await this.dependencias.registro.registrar(this.consumo(pedido, medicao, { entrada, estado: 'falhou', codigoDeErro: codigo })).catch(() => undefined)
      this.avisar(pedido, codigo, inicio, gasto.tentativas)
      throw erro instanceof ErroDeIa ? erro : new ErroDeIa('IA_INDISPONIVEL')
    }

    const regraFixa = fixa !== undefined
    const medicao = this.medir(pedido, gasto, inicio, regraFixa)
    try {
      await this.dependencias.registro.registrar(this.consumo(pedido, medicao, { ...(regraFixa ? {} : { entrada }), saida, estado: 'concluida' }))
    } catch {
      this.avisar(pedido, 'IA_INDISPONIVEL', inicio, gasto.tentativas)
      throw new ErroDeIa('IA_INDISPONIVEL')
    }
    const tipo = tarefa.nome
    const { duracaoMs, tentativas } = medicao
    this.dependencias.logger?.info({ evento: 'ia.geracao.concluida', tipo, escolaId: pedido.escolaId, execucaoId: pedido.execucaoId, duracaoMs, tentativas })
    return { saida, medicao }
  }

  /** Sem conseguir consultar o orçamento, não se gasta: a falha da consulta fecha a porta, não abre. */
  private async exigirOrcamento<Entrada, Saida>(pedido: PedidoDeGeracao<Entrada, Saida>, inicio: number): Promise<void> {
    let codigo: CodigoDeErroDeIa | undefined
    let tenteDeNovoEmSegundos: number | undefined
    try {
      const decisao = await this.dependencias.orcamento.consultar({
        escolaId: pedido.escolaId,
        funcao: pedido.tarefa.funcao,
        ...(pedido.alunoId === undefined ? {} : { alunoId: pedido.alunoId }),
      })
      if (!decisao.permitido) {
        codigo = 'IA_ORCAMENTO_ESGOTADO'
        tenteDeNovoEmSegundos = decisao.tenteDeNovoEmSegundos
      }
    } catch {
      codigo = 'IA_INDISPONIVEL'
    }
    if (codigo === undefined) return
    this.avisar(pedido, codigo, inicio, 0)
    throw new ErroDeIa(codigo, tenteDeNovoEmSegundos)
  }

  /** A regra fixa também passa pelo schema e pela conferência: texto nosso com defeito não chega a ninguém. */
  private exigirSaidaFixa<Entrada, Saida>(tarefa: TarefaDeIa<Entrada, Saida>, entrada: Entrada, fixa: Saida): Saida {
    const validada = validar(tarefa, entrada, fixa)
    if (!validada.ok) throw new ErroDeIa('IA_SAIDA_INVALIDA')
    return validada.saida
  }

  private async chamarAteValer<Entrada, Saida>(pedido: PedidoDeGeracao<Entrada, Saida>, entrada: Entrada, gasto: Gasto): Promise<Saida> {
    const { tarefa } = pedido
    let correcao: CorrecaoPedida | undefined
    while (gasto.tentativas < TENTATIVAS_MAXIMAS) {
      gasto.tentativas += 1
      // Um prazo por chamada. O sinal de quem chamou (o executor) cancela junto.
      const prazo = AbortSignal.timeout(this.dependencias.timeoutMs)
      const sinal = pedido.sinal === undefined ? prazo : AbortSignal.any([prazo, pedido.sinal])
      const resposta = await this.dependencias.adaptador.chamar({ tarefa, entrada, sinal, ...(correcao === undefined ? {} : { correcao }) })
      gasto.modelo = resposta.modelo
      gasto.tokensDeEntrada += resposta.tokensDeEntrada
      gasto.tokensDeSaida += resposta.tokensDeSaida
      const interpretada = interpretar(tarefa, entrada, resposta.texto)
      if (interpretada.ok) return interpretada.saida
      correcao = { respostaAnterior: resposta.texto, problemas: interpretada.problemas }
    }
    throw new ErroDeIa('IA_SAIDA_INVALIDA')
  }

  private medir<Entrada, Saida>(pedido: PedidoDeGeracao<Entrada, Saida>, gasto: Gasto, inicio: number, regraFixa: boolean): MedicaoDaGeracao {
    const { adaptador } = this.dependencias
    return {
      origem: regraFixa ? 'regra_fixa' : adaptador.origem,
      perfil: pedido.tarefa.perfil,
      modelo: regraFixa ? MODELO_DA_REGRA_FIXA : gasto.modelo,
      promptVersao: pedido.tarefa.prompt.versao,
      tokensDeEntrada: gasto.tokensDeEntrada,
      tokensDeSaida: gasto.tokensDeSaida,
      duracaoMs: Math.round(performance.now() - inicio),
      // Só há envio externo se alguma chamada chegou a sair para um provedor de fora.
      envioExterno: !regraFixa && gasto.tentativas > 0 && adaptador.envioExterno,
      tentativas: gasto.tentativas,
    }
  }

  private consumo<Entrada, Saida>(
    pedido: PedidoDeGeracao<Entrada, Saida>,
    medicao: MedicaoDaGeracao,
    resultado: Pick<ConsumoDeIa, 'entrada' | 'saida' | 'estado' | 'codigoDeErro'>,
  ): ConsumoDeIa {
    return {
      escolaId: pedido.escolaId,
      ...(pedido.alunoId === undefined ? {} : { alunoId: pedido.alunoId }),
      ...(pedido.execucaoId === undefined ? {} : { execucaoId: pedido.execucaoId }),
      tarefa: pedido.tarefa.nome,
      funcao: pedido.tarefa.funcao,
      ...medicao,
      ...resultado,
      em: this.relogio.agora(),
    }
  }

  /** A tarefa fixa a função e o perfil: o `tipo` no log diz os dois. */
  private avisar<Entrada, Saida>(pedido: PedidoDeGeracao<Entrada, Saida>, codigo: CodigoDeErroDeIa, inicio: number, tentativas: number): void {
    const tipo = pedido.tarefa.nome
    const duracaoMs = Math.round(performance.now() - inicio)
    this.dependencias.logger?.warn({ evento: 'ia.geracao.falhou', tipo, codigo, escolaId: pedido.escolaId, execucaoId: pedido.execucaoId, duracaoMs, tentativas })
  }
}

export interface PortasDoProvedor {
  readonly registro: RegistroDeConsumo
  readonly orcamento: OrcamentoDeIa
  readonly logger?: RegistradorDeIa
  readonly relogio?: Relogio
}

/** Monta a porta a partir da configuração: é aqui, e só aqui, que `IA_ADAPTADOR` escolhe o adaptador. */
export function criarProvedorDeIa(config: ConfiguracaoDeIa, portas: PortasDoProvedor): LLMProvider {
  if (config.adaptador === 'openai_compat' && config.modelo === undefined) throw new ConfiguracaoInvalida(['LLM_BASE_URL', 'LLM_MODELO'])
  const adaptador = config.modelo === undefined ? new AdaptadorFalso() : new AdaptadorOpenAICompat(config.modelo)
  return new ProvedorDeIa({ adaptador, timeoutMs: config.timeoutMs, ...portas })
}
