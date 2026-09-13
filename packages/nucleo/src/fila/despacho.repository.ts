import type { CodigoDeFalhaDeJob, Fila } from '@educa/shared'
import { and, eq, inArray, sql, type SQL } from 'drizzle-orm'
import type { Banco } from '../db/banco.js'
import { jobRegistro } from '../db/schema/job-registro.js'
import { SemEscopo } from '../db/sem-escopo.decorator.js'
import { escopoDoJobNoContexto } from './job-registro.repository.js'

/** Quanto tempo a reserva de um despachante vale. Vencida, outro despachante pode pegar a linha. */
export const RESERVA_SEGUNDOS = 30

/**
 * Há quanto tempo um job precisa estar `publicado` ou `ativo` para a reconciliação conferir se a
 * fila ainda o tem (Tech Spec, seção 5, "Reconciliação").
 */
export const IDADE_PARA_RECONCILIAR_SEGUNDOS = 120

// Tipo, e não interface: o `execute` do Drizzle só aceita linha que cabe em `Record<string, unknown>`.
export type JobReservado = {
  id: string
  escolaId: string | null
  requisicaoId: string | null
  tipo: string
  fila: Fila
}

/** Uma escola (ou a rotina do sistema, sem escola) com job esperando despacho numa fila. */
export type EscolaComPendentes = {
  fila: Fila
  escolaId: string | null
}

/** Um job que a reconciliação confere, com a chave da ordem da varredura. */
export type JobParaReconciliar = JobReservado & {
  prioridade: number
  // Em texto, com os microssegundos do Postgres: volta intacta como ponto de parada da varredura.
  criadoEm: string
}

/** Onde a varredura da reconciliação parou: o último job conferido, na ordem da consulta. */
export type CursorDaReconciliacao = Pick<JobParaReconciliar, 'prioridade' | 'criadoEm' | 'id'>

/**
 * `publicado` ou `ativo` há mais de `IDADE_PARA_RECONCILIAR_SEGUNDOS`. Não há data de publicação na
 * linha: ela sai logo depois da reserva, então `reservado_ate` menos `RESERVA_SEGUNDOS` marca a
 * publicação. No `ativo`, vale o que for mais recente entre o início e a última reserva: o
 * `iniciado_em` guarda o primeiro início, e o job republicado que recomeçou não pode voltar a ser
 * candidato (nem ser tomado de novo) na hora. O `not in` repete o predicado do índice parcial de
 * pendentes, para ele ser usado.
 */
const CONDICAO_PARA_RECONCILIAR: SQL = sql`estado not in ('concluido', 'falhou') and (
  (estado = 'publicado' and reservado_ate < now() - make_interval(secs => ${IDADE_PARA_RECONCILIAR_SEGUNDOS - RESERVA_SEGUNDOS}))
  or (estado = 'ativo'
    and greatest(iniciado_em, reservado_ate - make_interval(secs => ${RESERVA_SEGUNDOS})) < now() - make_interval(secs => ${IDADE_PARA_RECONCILIAR_SEGUNDOS}))
)`

/**
 * Linha que o despachante pode tomar: `aguardando`, ou `reservado` por um despachante que caiu antes
 * de publicar. Só nomes de coluna de `job_registro`, para valer dentro de uma subconsulta sem alias.
 */
const DISPONIVEL_PARA_RESERVA: SQL = sql`(estado = 'aguardando' or (estado = 'reservado' and reservado_ate < now()))`

const JUSTIFICATIVA =
  'o despachante é rotina nossa e distribui a fila de todas as escolas; ' +
  'nada daqui chega a uma resposta, e o worker volta a aplicar o escopo pela escola do job'

/**
 * O lado do despachante em `job_registro`: lista as escolas com job à espera, reserva e devolve na
 * escola do contexto, marca publicado e reconcilia com o que a fila tem. Não atende requisição de
 * escola nenhuma.
 */
export class DespachoRepository {
  constructor(private readonly banco: Banco) {}

  /**
   * Por fila, as escolas com job disponível para reserva. É a lista que o despachante percorre em
   * rodízio. Salta de escola em escola pelo índice de pendentes (`fila, escola_id, criado_em`), uma
   * descida por escola, sem varrer os mil lotes de quem enfileirou mil: a consulta custa o número de
   * escolas, não o de jobs. A rotina do sistema (sem escola) entra como `escolaId` nulo.
   */
  @SemEscopo(JUSTIFICATIVA)
  async listarEscolasComPendentes(): Promise<EscolaComPendentes[]> {
    const resultado = await this.banco.execute<EscolaComPendentes>(sql`
      with recursive escolas as (
        (
          select fila, escola_id from job_registro
          where estado not in ('concluido', 'falhou') and escola_id is not null and ${DISPONIVEL_PARA_RESERVA}
          order by fila, escola_id
          limit 1
        )
        union all
        select proxima.fila, proxima.escola_id
        from escolas cross join lateral (
          select job.fila, job.escola_id from job_registro as job
          where estado not in ('concluido', 'falhou') and job.escola_id is not null and ${DISPONIVEL_PARA_RESERVA}
            and (job.fila, job.escola_id) > (escolas.fila, escolas.escola_id)
          order by job.fila, job.escola_id
          limit 1
        ) as proxima
      )
      select fila, escola_id as "escolaId" from escolas
      union all
      select distinct fila, null::uuid as "escolaId" from job_registro
      where estado not in ('concluido', 'falhou') and escola_id is null and ${DISPONIVEL_PARA_RESERVA}
    `)
    return resultado.rows
  }

  /**
   * Reserva até `limite` jobs disponíveis da escola do contexto numa fila, do mais antigo, pelo
   * índice de pendentes. Uma instrução só, que é a transação curta: o `FOR UPDATE SKIP LOCKED` faz dois
   * despachantes pegarem linhas diferentes sem um esperar o outro, e o `UPDATE` repete a condição de
   * origem, então a linha que mudou de estado entre a seleção e a escrita não é reservada.
   *
   * Com `soUrgentes`, o não urgente fica de fora (a escola está no horário letivo): nem é reservado nem
   * chega a tomar vaga. Desce pelo índice de pendentes urgentes, sem atravessar os segurados.
   */
  async reservarDaEscola(fila: Fila, limite: number, { soUrgentes = false }: { soUrgentes?: boolean } = {}): Promise<JobReservado[]> {
    const escopo = escopoDoJobNoContexto()
    // Literal, e não parâmetro: é o predicado do índice parcial, e um plano genérico de instrução preparada
    // só o casaria enxergando a condição escrita.
    const urgencia = soUrgentes ? sql`and not nao_urgente` : sql``
    const resultado = await this.banco.execute<JobReservado>(sql`
      with candidatos as (
        select id from job_registro
        where estado not in ('concluido', 'falhou') and fila = ${fila} and ${escopo} and ${DISPONIVEL_PARA_RESERVA} ${urgencia}
        order by criado_em
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
   * Dos jobs que seguram vaga (os membros do ZSET da escola), os que estão `publicado` na escola do
   * contexto: parados na fila do BullMQ, sem worker renovando. Busca pela chave primária, então o
   * custo acompanha as vagas da escola, e não os milhares de jobs dela à espera.
   */
  async publicadosEntre(ids: readonly string[]): Promise<string[]> {
    if (ids.length === 0) return []
    const linhas = await this.banco
      .select({ id: jobRegistro.id })
      .from(jobRegistro)
      .where(and(inArray(jobRegistro.id, [...ids]), escopoDoJobNoContexto(), eq(jobRegistro.estado, 'publicado')))
    return linhas.map((linha) => linha.id)
  }

  /**
   * Reserva que não conseguiu vaga volta a `aguardando`, na escola do contexto, para a próxima rodada
   * (desta ou da outra instância) tentar de novo sem esperar a reserva vencer. Só sai de `reservado`.
   */
  async devolverParaAguardando(ids: readonly string[]): Promise<number> {
    if (ids.length === 0) return 0
    const alteradas = await this.banco
      .update(jobRegistro)
      .set({ estado: 'aguardando', reservadoAte: null })
      .where(and(inArray(jobRegistro.id, [...ids]), escopoDoJobNoContexto(), eq(jobRegistro.estado, 'reservado')))
      .returning({ id: jobRegistro.id })
    return alteradas.length
  }

  /**
   * Uma página dos jobs que a fila já deveria ter, na ordem de prioridade e de chegada: o interativo
   * perdido é conferido antes do lote. `depoisDe` continua de onde a página anterior parou, para a
   * varredura passar por todos, e não pelos mesmos `limite` mais antigos a cada vez.
   */
  @SemEscopo(JUSTIFICATIVA)
  async listarParaReconciliar(limite: number, depoisDe?: CursorDaReconciliacao): Promise<JobParaReconciliar[]> {
    const continuacao =
      depoisDe === undefined ? sql`` : sql`and (prioridade, criado_em, id) > (${depoisDe.prioridade}, ${depoisDe.criadoEm}::timestamptz, ${depoisDe.id}::uuid)`
    const resultado = await this.banco.execute<JobParaReconciliar>(sql`
      select id, escola_id as "escolaId", requisicao_id as "requisicaoId", tipo, fila, prioridade, criado_em::text as "criadoEm"
      from job_registro
      where ${CONDICAO_PARA_RECONCILIAR} ${continuacao}
      order by prioridade, criado_em, id
      limit ${limite}
    `)
    return resultado.rows
  }

  /**
   * Toma para republicar os jobs que a fila confirmou não ter: `publicado` ou `ativo` → `reservado`,
   * com reserva nova. A condição de `listarParaReconciliar` se repete na escrita: duas reconciliações
   * sobre o mesmo job não o tomam as duas, porque a reserva nova tira o job da idade de reconciliar,
   * e isso vale também quando a outra já o republicou e o worker o recomeçou desde a consulta. Se a
   * publicação falhar, a reserva vence e a rodada comum o publica.
   */
  @SemEscopo(JUSTIFICATIVA)
  async reservarParaRepublicar(ids: readonly string[]): Promise<JobReservado[]> {
    if (ids.length === 0) return []
    const resultado = await this.banco.execute<JobReservado>(sql`
      update job_registro
      set estado = 'reservado', reservado_ate = now() + make_interval(secs => ${RESERVA_SEGUNDOS})
      where id in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})
        and ${CONDICAO_PARA_RECONCILIAR}
      returning id, escola_id as "escolaId", requisicao_id as "requisicaoId", tipo, fila
    `)
    return resultado.rows
  }

  /**
   * Falha que a fila registrou e o worker não conseguiu gravar (Postgres fora na última tentativa,
   * stalled acima do limite, dado inválido na fila). Só sai de `publicado` ou `ativo`: o que já
   * terminou não muda. Devolve `false` se a linha não estava mais nesses estados.
   */
  @SemEscopo(JUSTIFICATIVA)
  async registrarFalhaDaFila(id: string, codigo: CodigoDeFalhaDeJob): Promise<boolean> {
    const alteradas = await this.banco
      .update(jobRegistro)
      .set({ estado: 'falhou', codigoFalha: codigo, concluidoEm: sql`now()`, reservadoAte: null })
      .where(and(eq(jobRegistro.id, id), inArray(jobRegistro.estado, ['publicado', 'ativo'])))
      .returning({ id: jobRegistro.id })
    return alteradas.length === 1
  }

  /**
   * `reservado` → `publicado` na escola do contexto, depois de a fila aceitar o job. Escrita tardia (o
   * worker já marcou `ativo`, `concluido` ou `falhou`) não muda nada.
   */
  async marcarPublicados(ids: readonly string[]): Promise<number> {
    if (ids.length === 0) return 0
    const alteradas = await this.banco
      .update(jobRegistro)
      .set({ estado: 'publicado' })
      .where(and(inArray(jobRegistro.id, [...ids]), escopoDoJobNoContexto(), eq(jobRegistro.estado, 'reservado')))
      .returning({ id: jobRegistro.id })
    return alteradas.length
  }
}
