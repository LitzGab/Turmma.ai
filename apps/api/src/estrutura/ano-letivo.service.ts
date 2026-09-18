import { ErroDeDominio, type Banco } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaRespostaAnoLetivo,
  esquemaRespostaListaDeAnosLetivos,
  type ConsultaPaginada,
  type PedidoCriarAnoLetivo,
  type RespostaAnoLetivo,
  type RespostaListaDeAnosLetivos,
  type SituacaoDoAnoLetivo,
} from '@educa/shared'
import { AnoLetivoRepository } from './ano-letivo.repository.js'
import { paginar } from './entrada.js'

/**
 * A coordenação cria, abre e encerra o ano letivo da escola (RF2; Tech Spec, seção 4). Não depende de haver ano em
 * curso: é assim que a escola começa do zero sem ficar travada (seção 5, "Requisição").
 *
 * - Criar: nasce `planejado`. O mesmo ano duas vezes na escola dá `CONFLITO` (`ano_letivo_escola_ano_unico`).
 * - Abrir: `planejado` → `em_curso`. Com outro ano em curso na escola, `CONFLITO`, pelo índice único parcial. Abrir de
 *   novo o que já está em curso responde o ano como está (o segundo clique); encerrado não reabre.
 * - Encerrar: `em_curso` → `encerrado`, sem virada de vínculo (é da 10.0). Encerrar de novo responde o ano como está;
 *   planejado nunca aberto não se encerra.
 * - Id de outra escola, inexistente ou fora do formato: `NAO_ENCONTRADO`, igual (regra 10, item 6).
 */
export class AnoLetivoService {
  constructor(private readonly banco: Banco) {}

  async criar(pedido: PedidoCriarAnoLetivo): Promise<RespostaAnoLetivo> {
    return esquemaRespostaAnoLetivo.parse(await new AnoLetivoRepository(this.banco).criar(pedido))
  }

  async listar(consulta: ConsultaPaginada): Promise<RespostaListaDeAnosLetivos> {
    const linhas = await new AnoLetivoRepository(this.banco).listar(consulta)
    return esquemaRespostaListaDeAnosLetivos.parse(paginar(linhas, consulta.limite))
  }

  abrir(id: string): Promise<RespostaAnoLetivo> {
    return this.#transitar(id, 'planejado', 'em_curso')
  }

  encerrar(id: string): Promise<RespostaAnoLetivo> {
    return this.#transitar(id, 'em_curso', 'encerrado')
  }

  async #transitar(id: string, de: SituacaoDoAnoLetivo, para: SituacaoDoAnoLetivo): Promise<RespostaAnoLetivo> {
    const repositorio = new AnoLetivoRepository(this.banco)
    const mudado = await repositorio.mudarSituacao(id, de, para)
    if (mudado !== undefined) return esquemaRespostaAnoLetivo.parse(mudado)
    const atual = await repositorio.porId(id)
    if (atual === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    if (atual.situacao === para) return esquemaRespostaAnoLetivo.parse(atual)
    throw new ErroDeDominio(CodigoDeErro.CONFLITO)
  }
}
