import type { CategoriaDeRetencao } from '@educa/shared'
import { desc, eq, sql, type SQL } from 'drizzle-orm'
import { exigirEscolaDoContexto } from '../contexto/escola-do-contexto.js'
import type { Banco } from '../db/banco.js'
import { expurgoExecucao } from '../db/schema/expurgo-execucao.js'

/**
 * As categorias do catálogo que o expurgo da escola já apaga, na ordem do catálogo (F3, tarefa 3.0). As de
 * anonimização entram na tarefa 4.0, e as de cadastro e trabalho do aluno na 5.0: o teste confere que o catálogo
 * inteiro é esta lista mais as pendentes de cada tarefa.
 */
export const CATEGORIAS_DO_EXPURGO = ['conversa_tutor', 'sinal_tutor', 'conversa_professor'] as const satisfies readonly CategoriaDeRetencao[]
export type CategoriaDoExpurgo = (typeof CATEGORIAS_DO_EXPURGO)[number]

/** O que sai em cada passo de uma categoria, na ordem: a conversa do professor apaga as mensagens, e depois a thread vazia. */
export const ALVOS_DO_EXPURGO_DA_ESCOLA = {
  conversa_tutor: ['mensagem_tutor'],
  sinal_tutor: ['sinal_tutor'],
  conversa_professor: ['mensagem_agente', 'thread_agente'],
} as const satisfies Record<CategoriaDoExpurgo, readonly string[]>
export type AlvoDoExpurgoDaEscola = (typeof ALVOS_DO_EXPURGO_DA_ESCOLA)[CategoriaDoExpurgo][number]

/** Um lote: quantas linhas saíram, e se o lote veio cheio (há mais para apagar). */
export interface LoteDoExpurgo {
  readonly linhas: number
  readonly cheio: boolean
}

/** Uma das noites que o alerta olha: se ela conta (a escola já tinha rodado o expurgo), e quantas categorias terminaram. */
export interface NoiteDoExpurgo {
  /** A noite é anterior à primeira execução da escola: não conta, nem como incompleta. */
  readonly contada: boolean
  /** Quantas das categorias pedidas têm, naquela noite, ao menos uma linha `concluida`. */
  readonly concluidas: number
}

/** As noites que o alerta olha, de ontem para trás, no fuso da escola. */
export const NOITES_DO_ALERTA = 2

/** O instante do corte: o `agora` do job menos o prazo da categoria, em meses, pela aritmética de calendário do Postgres. */
const corte = (agora: Date, meses: number): SQL => sql`(${agora.toISOString()}::timestamptz - make_interval(months => ${meses}))`

/**
 * Cada lote segue o desenho do expurgo de acesso: `id = any(array(...))`, com a subconsulta rodando uma vez antes do
 * delete; `order by` pela data, que desce pelo índice `(escola_id, <data>)` da migration 0025 e para no lote; e `for
 * update skip locked`, para dois jobs da mesma escola ao mesmo tempo apagarem linhas diferentes, sem um esperar o outro.
 * A escola entra nas duas cláusulas: na subconsulta, para o índice; no delete, para nenhuma linha de outra escola sair
 * nem por um id que casasse.
 */
const APAGAR_LOTE: Record<Exclude<AlvoDoExpurgoDaEscola, 'thread_agente'>, (escolaId: string, agora: Date, meses: number, limite: number) => SQL> = {
  mensagem_tutor: (escolaId, agora, meses, limite) => sql`
    delete from mensagem_tutor
    where escola_id = ${escolaId} and id = any(array(
      select id from mensagem_tutor
      where escola_id = ${escolaId} and criada_em < ${corte(agora, meses)}
      order by criada_em
      limit ${limite}
      for update skip locked
    ))
  `,
  sinal_tutor: (escolaId, agora, meses, limite) => sql`
    delete from sinal_tutor
    where escola_id = ${escolaId} and id = any(array(
      select id from sinal_tutor
      where escola_id = ${escolaId} and criado_em < ${corte(agora, meses)}
      order by criado_em
      limit ${limite}
      for update skip locked
    ))
  `,
  mensagem_agente: (escolaId, agora, meses, limite) => sql`
    delete from mensagem_agente
    where escola_id = ${escolaId} and id = any(array(
      select id from mensagem_agente
      where escola_id = ${escolaId} and criada_em < ${corte(agora, meses)}
      order by criada_em
      limit ${limite}
      for update skip locked
    ))
  `,
}

/** A thread sem mensagem, criada antes do corte, da escola. `t` é a thread. */
const THREAD_VAZIA_E_VENCIDA = (escolaId: string, agora: Date, meses: number): SQL => sql`
  t.escola_id = ${escolaId} and t.criada_em < ${corte(agora, meses)}
  and not exists (select 1 from mensagem_agente m where m.escola_id = t.escola_id and m.thread_id = t.id)
`

/**
 * O expurgo noturno da escola (F3, RF4 e RF5; Tech Spec do F3, seção 5), sempre no escopo da escola do contexto, que o
 * job tira do `job_registro` (regra 10, item 3): nenhum método recebe escola, e nenhum é `@SemEscopo`. O processador
 * `retencao.expurgar-escola` percorre as categorias com o prazo efetivo e grava `expurgo_execucao`; a medição do alerta
 * lê as noites daqui.
 *
 * Conversa do Tutor, sinais e conversa do professor **saem do banco**, pelo prazo de cada linha, contado da data dela. A
 * thread do professor sai quando ficou vazia, e só se foi criada antes do corte: a thread que o professor acabou de
 * abrir, ainda sem mensagem, fica.
 */
export class ExpurgoDaEscolaRepository {
  constructor(private readonly banco: Banco) {}

  /**
   * Apaga até `limite` linhas de `alvo` da escola do contexto com mais de `meses` meses contados de `agora`, numa
   * transação curta, e diz quantas saíram e se o lote veio cheio.
   *
   * A thread vazia sai em duas instruções numa transação, como a conta sem uso no expurgo de acesso: a primeira escolhe
   * e trava as candidatas (`for update skip locked`, e a thread em que o professor está gravando uma mensagem agora fica
   * para a noite seguinte); a segunda, com a visão do banco de depois da trava, confere de novo que ela continua vazia e
   * só então apaga. Numa instrução só, o `not exists` usaria a visão do começo dela, e uma mensagem confirmada entre esse
   * começo e a trava sairia junto, em cascata. Depois da trava, a mensagem nova espera o fim do lote e, sem a thread,
   * é recusada pela FK: o professor manda de novo e a thread nasce outra vez.
   *
   * `depoisDeTravar` é só do teste: é a janela entre a trava e a reconferência da thread vazia.
   */
  async apagarLote(alvo: AlvoDoExpurgoDaEscola, agora: Date, meses: number, limite: number, depoisDeTravar?: () => Promise<void>): Promise<LoteDoExpurgo> {
    const escolaId = exigirEscolaDoContexto()
    if (alvo !== 'thread_agente') {
      const resultado = await this.banco.execute(APAGAR_LOTE[alvo](escolaId, agora, meses, limite))
      const linhas = resultado.rowCount ?? 0
      return { linhas, cheio: linhas >= limite }
    }
    return this.banco.transaction(async (tx) => {
      const travadas = await tx.execute<{ id: string }>(sql`
        select t.id from thread_agente t
        where ${THREAD_VAZIA_E_VENCIDA(escolaId, agora, meses)}
        order by t.criada_em
        limit ${limite}
        for update of t skip locked
      `)
      const ids = travadas.rows.map(({ id }) => id)
      if (ids.length === 0) return { linhas: 0, cheio: false }
      if (depoisDeTravar !== undefined) await depoisDeTravar()
      const apagadas = await tx.execute(sql`
        delete from thread_agente t
        where t.id = any(${`{${ids.join(',')}}`}::uuid[]) and ${THREAD_VAZIA_E_VENCIDA(escolaId, agora, meses)}
      `)
      return { linhas: apagadas.rowCount ?? 0, cheio: ids.length >= limite }
    })
  }

  /** Grava o que a execução fez numa categoria: só a contagem e se terminou. */
  async registrar(categoria: CategoriaDeRetencao, linhas: number, concluida: boolean, em: Date): Promise<void> {
    await this.banco.insert(expurgoExecucao).values({ escolaId: exigirEscolaDoContexto(), categoria, linhas, concluida, em })
  }

  /**
   * A categoria em que a última execução da escola parou pela janela letiva, ou `undefined` se a última linha terminou
   * (ou não há nenhuma). É por ela que a noite seguinte começa.
   */
  async categoriaPendente(): Promise<CategoriaDeRetencao | undefined> {
    const [ultima] = await this.banco
      .select({ categoria: expurgoExecucao.categoria, concluida: expurgoExecucao.concluida })
      .from(expurgoExecucao)
      .where(eq(expurgoExecucao.escolaId, exigirEscolaDoContexto()))
      .orderBy(desc(expurgoExecucao.em), desc(expurgoExecucao.id))
      .limit(1)
    return ultima === undefined || ultima.concluida ? undefined : ultima.categoria
  }

  /**
   * As `NOITES_DO_ALERTA` noites antes da de `agora`, de ontem para trás, no `fuso` da escola: se cada uma conta e
   * quantas de `categorias` terminaram nela. `undefined` quando a escola nunca rodou o expurgo: não há o que alertar.
   *
   * A noite é o dia local de `em`, contado da meia-noite à meia-noite no fuso, pelo índice `(escola_id, em)`. A noite
   * anterior à primeira execução da escola não conta: a escola recém-criada, e a primeira noite depois do deploy, não
   * disparam o alerta.
   */
  async noitesDoAlerta(fuso: string, agora: Date, categorias: readonly CategoriaDeRetencao[]): Promise<NoiteDoExpurgo[] | undefined> {
    const escolaId = exigirEscolaDoContexto()
    const [primeira] = await this.banco
      .select({ dia: sql<string>`(${expurgoExecucao.em} at time zone ${fuso})::date::text` })
      .from(expurgoExecucao)
      .where(eq(expurgoExecucao.escolaId, escolaId))
      .orderBy(expurgoExecucao.em)
      .limit(1)
    if (primeira === undefined) return undefined
    const lista = `{${categorias.join(',')}}`
    const noites = await this.banco.execute<{ contada: boolean; concluidas: number }>(sql`
      select noite.dia >= ${primeira.dia}::date as contada,
        (select count(distinct x.categoria)::int from expurgo_execucao x
          where x.escola_id = ${escolaId} and x.concluida and x.categoria = any(${lista}::text[])
            and x.em >= (noite.dia::timestamp at time zone ${fuso}) and x.em < ((noite.dia + 1)::timestamp at time zone ${fuso})
        ) as concluidas
      from (select (${agora.toISOString()}::timestamptz at time zone ${fuso})::date - n as dia, n from generate_series(1, ${NOITES_DO_ALERTA}) as n) as noite
      order by noite.n
    `)
    return noites.rows.map(({ contada, concluidas }) => ({ contada, concluidas }))
  }
}

/**
 * Quantas noites seguidas, de ontem para trás, a escola passou sem terminar todas as `categorias`: para na primeira
 * noite completa, ou na primeira que não conta. É o valor de `expurgo.noites_incompletas`, e o alerta dispara em 2.
 */
export function noitesSeguidasSemConcluir(noites: readonly NoiteDoExpurgo[], categorias: number): number {
  let seguidas = 0
  for (const noite of noites) {
    if (!noite.contada || noite.concluidas >= categorias) break
    seguidas += 1
  }
  return seguidas
}

/** A ordem da noite: começa pela categoria pendente, segue a do catálogo e dá a volta; sem pendente, a do catálogo. */
export function ordemDaNoite(pendente: CategoriaDeRetencao | undefined): CategoriaDoExpurgo[] {
  const inicio = CATEGORIAS_DO_EXPURGO.findIndex((categoria) => categoria === pendente)
  if (inicio <= 0) return [...CATEGORIAS_DO_EXPURGO]
  return [...CATEGORIAS_DO_EXPURGO.slice(inicio), ...CATEGORIAS_DO_EXPURGO.slice(0, inicio)]
}

/** A instrução do lote, para o teste conferir o plano sem apagar nada. A thread vazia não tem instrução única. */
export function instrucaoDoLoteDaEscola(alvo: Exclude<AlvoDoExpurgoDaEscola, 'thread_agente'>, escolaId: string, agora: Date, meses: number, limite: number): SQL {
  return APAGAR_LOTE[alvo](escolaId, agora, meses, limite)
}
