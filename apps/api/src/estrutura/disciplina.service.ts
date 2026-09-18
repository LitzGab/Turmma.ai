import type { Banco } from '@educa/nucleo'
import {
  esquemaRespostaDisciplina,
  esquemaRespostaListaDeDisciplinas,
  type ConsultaPaginada,
  type PedidoCriarDisciplina,
  type RespostaDisciplina,
  type RespostaListaDeDisciplinas,
} from '@educa/shared'
import { DisciplinaRepository } from './disciplina.repository.js'
import { paginar } from './entrada.js'

/** A coordenação cria e lista as disciplinas da escola (RF2). O nome repetido na escola é `CONFLITO`, sem o valor. */
export class DisciplinaService {
  constructor(private readonly banco: Banco) {}

  async criar(pedido: PedidoCriarDisciplina): Promise<RespostaDisciplina> {
    return esquemaRespostaDisciplina.parse(await new DisciplinaRepository(this.banco).criar(pedido))
  }

  async listar(consulta: ConsultaPaginada): Promise<RespostaListaDeDisciplinas> {
    const linhas = await new DisciplinaRepository(this.banco).listar(consulta)
    return esquemaRespostaListaDeDisciplinas.parse(paginar(linhas, consulta.limite))
  }
}
