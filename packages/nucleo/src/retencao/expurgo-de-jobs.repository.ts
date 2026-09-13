import { sql } from 'drizzle-orm'
import type { Banco } from '../db/banco.js'
import { SemEscopo } from '../db/sem-escopo.decorator.js'

/** Por quantos dias `job_registro` guarda o job que terminou (Tech Spec, seção 7, "Retenção e expurgo"). */
export const RETENCAO_JOB_REGISTRO_DIAS = 7

/** Quantas linhas cada instrução do expurgo apaga no máximo: transação curta, lock curto. */
export const LOTE_DO_EXPURGO = 5_000

/**
 * Apaga um lote e diz quantas linhas saíram. Desce pelo índice parcial de finalizados
 * (`job_registro_finalizados_idx`): o `estado in (...)` repete o predicado dele, literal, e o
 * `order by concluido_em` faz o `limit` parar no lote sem ler os demais.
 *
 * `id = any(array(...))`, e não `id in (select ...)`: o `array` vira um passo executado uma vez só,
 * antes do delete. Com `in`, e a estatística da tabela velha (logo depois de uma carga grande), o
 * Postgres escolhe repetir a subconsulta a cada linha: o lote levou 22 s e apagou 8.586 linhas em vez
 * de 5.000, porque cada repetição do `limit` com `skip locked` devolve outras linhas.
 *
 * `for update skip locked`: duas execuções ao mesmo tempo (a reexecução de D49) apagam linhas
 * diferentes, sem uma esperar a outra; a linha presa numa transação que ainda não terminou (de um
 * worker que morreu no meio do lote) fica para a próxima instrução.
 */
const APAGAR_LOTE_VENCIDO = (limite: number) => sql`
  delete from job_registro
  where id = any(array(
    select id from job_registro
    where estado in ('concluido', 'falhou')
      and concluido_em < now() - make_interval(days => ${RETENCAO_JOB_REGISTRO_DIAS})
    order by concluido_em
    limit ${limite}
    for update skip locked
  ))
`

/**
 * A retenção de `job_registro`: o job concluído ou falho há mais de `RETENCAO_JOB_REGISTRO_DIAS`
 * sai do banco. Fica fora do módulo da fila de propósito: o despachante distribui, este apaga, e o
 * expurgo por retenção de dado de escola (F3) mora aqui também.
 */
export class ExpurgoDeJobsRepository {
  constructor(private readonly banco: Banco) {}

  /**
   * Apaga até `limite` jobs vencidos, de qualquer escola. Job `aguardando`, `reservado`, `publicado`
   * ou `ativo` nunca sai, por mais antigo que seja; o terminado há menos de 7 dias também não.
   */
  @SemEscopo(
    'o expurgo é rotina nossa e aplica a mesma retenção de job a todas as escolas; ' +
      'não devolve linha, só a quantidade apagada, e não atende requisição de escola nenhuma',
  )
  async apagarLoteVencido(limite: number = LOTE_DO_EXPURGO): Promise<number> {
    const resultado = await this.banco.execute(APAGAR_LOTE_VENCIDO(limite))
    return resultado.rowCount ?? 0
  }
}

/** A instrução do lote, para o teste conferir o plano sem apagar nada. */
export function instrucaoDoLoteVencido(limite: number = LOTE_DO_EXPURGO) {
  return APAGAR_LOTE_VENCIDO(limite)
}
