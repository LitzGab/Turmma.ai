import type { Banco } from '@educa/nucleo'
import {
  esquemaRespostaListaDeSeries,
  esquemaRespostaSerie,
  type ConsultaPaginada,
  type PedidoCriarSerie,
  type RespostaListaDeSeries,
  type RespostaSerie,
} from '@educa/shared'
import { paginar } from './entrada.js'
import { SerieRepository } from './serie.repository.js'

/**
 * A coordenação cria e lista as séries do recorte (RF2, D43). Fora do recorte é `ENTRADA_INVALIDA` no contrato e, se
 * algum caminho passar dele, o check do banco recusa; a série repetida é `CONFLITO`, sem o valor na resposta.
 */
export class SerieService {
  constructor(private readonly banco: Banco) {}

  async criar(pedido: PedidoCriarSerie): Promise<RespostaSerie> {
    return esquemaRespostaSerie.parse(await new SerieRepository(this.banco).criar(pedido))
  }

  async listar(consulta: ConsultaPaginada): Promise<RespostaListaDeSeries> {
    const linhas = await new SerieRepository(this.banco).listar(consulta)
    return esquemaRespostaListaDeSeries.parse(paginar(linhas, consulta.limite))
  }
}
