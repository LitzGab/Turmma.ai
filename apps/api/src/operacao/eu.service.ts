import { ErroDeDominio, exigirOperadorDoContexto } from '@educa/nucleo'
import { CodigoDeErro, esquemaRespostaEuDoOperador, type RespostaEuDoOperador } from '@educa/shared'
import type { OperadorRepository } from './operador.repository.js'

/** `GET /v1/operacao/eu`: o apelido e o nome do operador da sessão, pelo contrato estrito de `packages/shared`. */
export class EuDoOperadorService {
  constructor(private readonly operadores: Pick<OperadorRepository, 'daSessao'>) {}

  async obter(): Promise<RespostaEuDoOperador> {
    const operador = await this.operadores.daSessao(exigirOperadorDoContexto())
    // Desativado entre a guarda e aqui: a sessão acabou de terminar.
    if (operador === undefined) throw new ErroDeDominio(CodigoDeErro.SESSAO_ENCERRADA)
    return esquemaRespostaEuDoOperador.parse(operador)
  }
}
