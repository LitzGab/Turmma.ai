import type { Fila } from '@educa/shared'
import { and, eq, inArray, sql } from 'drizzle-orm'
import type { Banco } from '../db/banco.js'
import { jobRegistro } from '../db/schema/job-registro.js'
import { SemEscopo } from '../db/sem-escopo.decorator.js'

/** Quanto tempo a reserva de um despachante vale. Vencida, outro despachante pode pegar a linha. */
export const RESERVA_SEGUNDOS = 30

export interface JobReservado {
  id: string
  escolaId: string | null
  requisicaoId: string | null
  tipo: string
  fila: Fila
}

const JUSTIFICATIVA =
  'o despachante é rotina nossa e distribui a fila de todas as escolas; ' +
  'nada daqui chega a uma resposta, e o worker volta a aplicar o escopo pela escola do job'

/**
 * O lado da fila inteira de `job_registro`: seleciona, reserva e marca publicado. Não atende
 * requisição de escola nenhuma.
 */
export class DespachoRepository {
  constructor(private readonly banco: Banco) {}

  /**
   * Reserva até `limite` jobs `aguardando` ou com reserva vencida, do mais prioritário e mais
   * antigo. Uma instrução só, que é a transação curta: o `FOR UPDATE SKIP LOCKED` faz dois
   * despachantes pegarem linhas diferentes sem um esperar o outro, e o `UPDATE` repete a condição
   * de origem, então a linha que mudou de estado entre a seleção e a escrita não é reservada.
   */
  @SemEscopo(JUSTIFICATIVA)
  async reservar(limite: number): Promise<JobReservado[]> {
    const resultado = await this.banco.execute<{
      id: string
      escolaId: string | null
      requisicaoId: string | null
      tipo: string
      fila: Fila
    }>(sql`
      with candidatos as (
        select id from job_registro
        where estado not in ('concluido', 'falhou')
          and (estado = 'aguardando' or (estado = 'reservado' and reservado_ate < now()))
        order by prioridade, criado_em
        limit ${limite}
        for update skip locked
      )
      update job_registro as job
      set estado = 'reservado', reservado_ate = now() + make_interval(secs => ${RESERVA_SEGUNDOS})
      from candidatos
      where job.id = candidatos.id
        and (job.estado = 'aguardando' or (job.estado = 'reservado' and job.reservado_ate < now()))
      returning job.id, job.escola_id as "escolaId", job.requisicao_id as "requisicaoId", job.tipo, job.fila
    `)
    return resultado.rows
  }

  /**
   * `reservado` → `publicado`, depois de a fila aceitar o job. Escrita tardia (o worker já marcou
   * `ativo`, `concluido` ou `falhou`) não muda nada.
   */
  @SemEscopo(JUSTIFICATIVA)
  async marcarPublicados(ids: readonly string[]): Promise<number> {
    if (ids.length === 0) return 0
    const alteradas = await this.banco
      .update(jobRegistro)
      .set({ estado: 'publicado' })
      .where(and(inArray(jobRegistro.id, [...ids]), eq(jobRegistro.estado, 'reservado')))
      .returning({ id: jobRegistro.id })
    return alteradas.length
  }
}
