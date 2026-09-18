import { ErroDeDominio, exigirAnoEmCurso, type Banco } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaRespostaListaDeTurmas,
  esquemaRespostaTurma,
  type ConsultaPaginada,
  type PedidoCriarTurma,
  type RespostaListaDeTurmas,
  type RespostaTurma,
} from '@educa/shared'
import { paginar } from './entrada.js'
import { SerieRepository } from './serie.repository.js'
import { TurmaRepository } from './turma.repository.js'

/**
 * A coordenação cria e lista as turmas do ano letivo em curso (RF2; regra 60, item 5). Sem ano em curso, as duas
 * rotas falham fechadas com `NAO_ENCONTRADO` (Tech Spec, seção 5, "Requisição").
 *
 * - A turma nasce no ano em curso da escola da sessão. Um `anoLetivoId` no corpo que não seja ele (planejado,
 *   encerrado, de outra escola, inexistente) responde como inexistente, e nada é criado.
 * - Série de outra escola ou inexistente: `NAO_ENCONTRADO`, igual.
 * - O mesmo nome no mesmo ano, sem diferenciar maiúscula: `CONFLITO`, sem o valor.
 */
export class TurmaService {
  constructor(private readonly banco: Banco) {}

  async criar(pedido: PedidoCriarTurma): Promise<RespostaTurma> {
    const anoEmCurso = exigirAnoEmCurso()
    if (pedido.anoLetivoId !== undefined && pedido.anoLetivoId.toLowerCase() !== anoEmCurso) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    const criada = await this.banco.transaction(async (tx) => {
      const turmas = new TurmaRepository(tx)
      if (!(await turmas.travarAnoEmCurso())) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      const serie = await new SerieRepository(tx).porId(pedido.serieId.toLowerCase())
      if (serie === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      return { ...(await turmas.criar({ serieId: serie.id, nome: pedido.nome, turno: pedido.turno ?? null })), serie }
    })
    return esquemaRespostaTurma.parse(criada)
  }

  async listar(consulta: ConsultaPaginada): Promise<RespostaListaDeTurmas> {
    const linhas = await new TurmaRepository(this.banco).listar(consulta)
    return esquemaRespostaListaDeTurmas.parse(paginar(linhas, consulta.limite))
  }
}
