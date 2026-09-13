import type { CodigoDeFalhaDeJob, EstadoDeJob, Fila } from '@educa/shared'
import { and, eq, inArray, isNull, like, sql, type SQL } from 'drizzle-orm'
import { contextoAtual } from '../contexto/contexto.js'
import type { Banco, TransacaoBanco } from '../db/banco.js'
import { jobRegistro } from '../db/schema/job-registro.js'

export const PREFIXO_TIPO_SISTEMA = 'sistema.'

/** Canal do `pg_notify` que acorda o despachante logo depois do commit de quem enfileirou. */
export const CANAL_NOTIFICACAO_JOB = 'job'

export interface LinhaNova {
  tipo: string
  fila: Fila
  prioridade: number
  dados: Record<string, unknown>
  naoUrgente: boolean
}

export interface EstadoRegistrado {
  estado: EstadoDeJob
  criadoEm: Date
  iniciadoEm: Date | null
  concluidoEm: Date | null
  codigoFalha: CodigoDeFalhaDeJob | null
}

/** Onde o job está antes de começar: a fila e a escola da linha persistida, que definem a vaga dele. */
export interface JobParaExecutar {
  fila: Fila
  escolaId: string | null
  /** `concluido` ou `falhou`: não roda de novo. */
  finalizado: boolean
}

export type ResultadoDoInicio =
  | { situacao: 'iniciado'; tipo: string; dados: Record<string, unknown> }
  /** O job existe na escola, mas não está em estado de executar (já terminou): não roda de novo. */
  | { situacao: 'nao_executavel' }
  /** Id inexistente e job de outra escola caem aqui, sem distinção (regra 10, item 6). */
  | { situacao: 'nao_encontrado' }

/** Estados de onde o worker pode começar (ou recomeçar, na retentativa e no stalled). */
const ORIGENS_DO_INICIO: EstadoDeJob[] = ['reservado', 'publicado', 'ativo']
/** Estados de onde um job pode falhar de vez: o que já terminou não volta. */
const ORIGENS_DA_FALHA: EstadoDeJob[] = ['reservado', 'publicado', 'ativo']

/**
 * `job_registro` com o escopo da escola do contexto em toda consulta (regra 10, item 3). A escola
 * nunca chega por argumento: vem do token na API, e do job persistido no worker.
 *
 * Rotina do sistema (`sistema.*`, sem escola) só é alcançada por um contexto marcado como
 * `rotinaDoSistema`, que nenhuma requisição HTTP tem; um contexto de escola nunca a vê. As
 * consultas da fila inteira, do despachante, ficam em `DespachoRepository`, com `@SemEscopo`.
 */
export class JobRegistroRepository {
  constructor(private readonly banco: Banco) {}

  /**
   * Grava o job na transação de quem pediu e avisa o despachante. O `pg_notify` só é entregue no
   * commit: se a transação desfizer, nem o job nem o aviso existem.
   */
  async inserir(tx: TransacaoBanco, linha: LinhaNova): Promise<string> {
    const contexto = contextoAtual()
    const doSistema = linha.tipo.startsWith(PREFIXO_TIPO_SISTEMA)
    if (!doSistema && contexto?.escolaId === undefined) throw new Error('job de escola sem escola no contexto')
    if (doSistema && (contexto?.rotinaDoSistema !== true || contexto.escolaId !== undefined)) {
      throw new Error('job de sistema só nasce de rotina do sistema')
    }
    const [inserida] = await tx
      .insert(jobRegistro)
      .values({ ...linha, escolaId: contexto?.escolaId ?? null, requisicaoId: contexto?.requisicaoId ?? null })
      .returning({ id: jobRegistro.id })
    if (inserida === undefined) throw new Error('insert em job_registro não devolveu linha')
    await tx.execute(sql`select pg_notify(${CANAL_NOTIFICACAO_JOB}, '')`)
    return inserida.id
  }

  /** O job da escola do token, ou `undefined` (inexistente ou de outra escola, sem distinção). */
  async buscarDaEscola(id: string): Promise<EstadoRegistrado | undefined> {
    const escolaId = contextoAtual()?.escolaId
    if (escolaId === undefined) throw new Error('consulta de job sem escola no contexto')
    const [linha] = await this.banco
      .select({
        estado: jobRegistro.estado,
        criadoEm: jobRegistro.criadoEm,
        iniciadoEm: jobRegistro.iniciadoEm,
        concluidoEm: jobRegistro.concluidoEm,
        codigoFalha: jobRegistro.codigoFalha,
      })
      .from(jobRegistro)
      .where(and(eq(jobRegistro.id, id), eq(jobRegistro.escolaId, escolaId)))
    if (linha === undefined) return undefined
    return { ...linha, estado: linha.estado as EstadoDeJob, codigoFalha: linha.codigoFalha as CodigoDeFalhaDeJob | null }
  }

  /** A fila e a escola do job na escola do contexto, ou `undefined` (inexistente ou de outra escola, sem distinção). */
  async localizarParaExecucao(id: string): Promise<JobParaExecutar | undefined> {
    const [linha] = await this.banco
      .select({ fila: jobRegistro.fila, escolaId: jobRegistro.escolaId, estado: jobRegistro.estado })
      .from(jobRegistro)
      .where(and(eq(jobRegistro.id, id), escopoDoJobNoContexto()))
    if (linha === undefined) return undefined
    return { fila: linha.fila as Fila, escolaId: linha.escolaId, finalizado: linha.estado === 'concluido' || linha.estado === 'falhou' }
  }

  /**
   * Passa o job a `ativo` e devolve o que executar. A troca é condicional: um job que já concluiu
   * ou falhou não volta a `ativo` e não roda de novo, mesmo que a fila o entregue outra vez.
   */
  async iniciarExecucao(id: string): Promise<ResultadoDoInicio> {
    const escopo = escopoDoJobNoContexto()
    const [iniciada] = await this.banco
      .update(jobRegistro)
      .set({ estado: 'ativo', iniciadoEm: sql`coalesce(${jobRegistro.iniciadoEm}, now())` })
      .where(and(eq(jobRegistro.id, id), escopo, inArray(jobRegistro.estado, ORIGENS_DO_INICIO)))
      .returning({ tipo: jobRegistro.tipo, dados: jobRegistro.dados })
    if (iniciada !== undefined) return { situacao: 'iniciado', ...iniciada }
    const [existente] = await this.banco
      .select({ id: jobRegistro.id })
      .from(jobRegistro)
      .where(and(eq(jobRegistro.id, id), escopo))
    return existente === undefined ? { situacao: 'nao_encontrado' } : { situacao: 'nao_executavel' }
  }

  /** `ativo` → `concluido`. Devolve `false` se o job não estava ativo nesta escola. */
  async concluir(id: string): Promise<boolean> {
    const alteradas = await this.banco
      .update(jobRegistro)
      .set({ estado: 'concluido', concluidoEm: sql`now()`, reservadoAte: null })
      .where(and(eq(jobRegistro.id, id), escopoDoJobNoContexto(), eq(jobRegistro.estado, 'ativo')))
      .returning({ id: jobRegistro.id })
    return alteradas.length === 1
  }

  /** Falha definitiva, com código tipado. Devolve `false` se o job já tinha terminado ou não é desta escola. */
  async registrarFalha(id: string, codigo: CodigoDeFalhaDeJob): Promise<boolean> {
    const alteradas = await this.banco
      .update(jobRegistro)
      .set({ estado: 'falhou', codigoFalha: codigo, concluidoEm: sql`now()`, reservadoAte: null })
      .where(and(eq(jobRegistro.id, id), escopoDoJobNoContexto(), inArray(jobRegistro.estado, ORIGENS_DA_FALHA)))
      .returning({ id: jobRegistro.id })
    return alteradas.length === 1
  }
}

/**
 * Escopo de `job_registro` pelo contexto: a escola do contexto; rotina do sistema marcada, só os jobs
 * sem escola. Contexto sem escola e sem a marca (rota anônima) ou sem contexto nenhum falha fechado.
 */
export function escopoDoJobNoContexto(): SQL {
  const contexto = contextoAtual()
  if (contexto?.escolaId !== undefined) return eq(jobRegistro.escolaId, contexto.escolaId)
  if (contexto?.rotinaDoSistema === true) {
    return and(isNull(jobRegistro.escolaId), like(jobRegistro.tipo, `${PREFIXO_TIPO_SISTEMA}%`)) as SQL
  }
  throw new Error('job_registro sem escola nem rotina do sistema no contexto não tem escopo')
}
