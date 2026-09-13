import { eq } from 'drizzle-orm'
import { contextoAtual } from '../contexto/contexto.js'
import type { Banco } from '../db/banco.js'
import { configuracaoOperacionalEscola, type VagasConfiguradas } from '../db/schema/configuracao-operacional-escola.js'

/** O que a escola configurou. Nulo é "usa o padrão do ambiente". */
export interface LinhaOperacional {
  limiteReqUsuarioMin: number | null
  limiteReqEscolaMin: number | null
  vagas: VagasConfiguradas | null
}

/**
 * `configuracao_operacional_escola` no escopo da escola do contexto (regra 10, item 3): a API lê a
 * da escola do token, e o despachante, a da escola do job, abrindo o contexto dela. Não existe
 * leitura por escola vinda de argumento.
 */
export class ConfiguracaoOperacionalRepository {
  constructor(private readonly banco: Banco) {}

  /** A linha da escola do contexto, ou `undefined` se ela não configurou nada. */
  async daEscola(): Promise<LinhaOperacional | undefined> {
    const escolaId = contextoAtual()?.escolaId
    if (escolaId === undefined) throw new Error('configuração operacional sem escola no contexto')
    const [linha] = await this.banco
      .select({
        limiteReqUsuarioMin: configuracaoOperacionalEscola.limiteReqUsuarioMin,
        limiteReqEscolaMin: configuracaoOperacionalEscola.limiteReqEscolaMin,
        vagas: configuracaoOperacionalEscola.vagas,
      })
      .from(configuracaoOperacionalEscola)
      .where(eq(configuracaoOperacionalEscola.escolaId, escolaId))
    return linha
  }
}
