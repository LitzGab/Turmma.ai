import { ErroDeDominio, type Banco } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaRespostaDisciplina,
  esquemaRespostaListaDeDisciplinas,
  type ConsultaPaginada,
  type PedidoCriarDisciplina,
  type PedidoRenomearDisciplina,
  type RespostaDisciplina,
  type RespostaListaDeDisciplinas,
} from '@educa/shared'
import { DisciplinaRepository } from './disciplina.repository.js'
import { paginar } from './entrada.js'

/**
 * A coordenação cria, lista, renomeia e exclui as disciplinas da escola (RF2 do F1; RF3 da A1). O nome repetido na
 * escola é `CONFLITO`, sem o valor. Id de outra escola ou inexistente: `NAO_ENCONTRADO`, e nada muda. Excluir a
 * disciplina com vínculo: `CONFLITO`, e nada é apagado.
 */
export class DisciplinaService {
  constructor(private readonly banco: Banco) {}

  async criar(pedido: PedidoCriarDisciplina): Promise<RespostaDisciplina> {
    return esquemaRespostaDisciplina.parse(await new DisciplinaRepository(this.banco).criar(pedido))
  }

  async renomear(id: string, pedido: PedidoRenomearDisciplina): Promise<RespostaDisciplina> {
    const renomeada = await new DisciplinaRepository(this.banco).renomear(id, pedido.nome)
    if (renomeada === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    return esquemaRespostaDisciplina.parse(renomeada)
  }

  async excluir(id: string): Promise<void> {
    if (!(await new DisciplinaRepository(this.banco).excluir(id))) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  }

  async listar(consulta: ConsultaPaginada): Promise<RespostaListaDeDisciplinas> {
    const linhas = await new DisciplinaRepository(this.banco).listar(consulta)
    return esquemaRespostaListaDeDisciplinas.parse(paginar(linhas, consulta.limite))
  }
}
