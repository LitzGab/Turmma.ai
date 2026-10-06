import type { CategoriaDeRetencao } from '@educa/shared'
import { desc, eq, sql, type SQL } from 'drizzle-orm'
import { exigirEscolaDoContexto } from '../contexto/escola-do-contexto.js'
import type { Banco } from '../db/banco.js'
import { expurgoExecucao } from '../db/schema/expurgo-execucao.js'

/**
 * As categorias do catálogo que o expurgo da escola já percorre, na ordem do catálogo: as que apagam (F3, tarefa 3.0) e
 * as que anonimizam (tarefa 4.0). As de cadastro e trabalho do aluno entram na 5.0: o teste confere que o catálogo
 * inteiro é esta lista mais as pendentes de cada tarefa.
 */
export const CATEGORIAS_DO_EXPURGO = [
  'conversa_tutor',
  'sinal_tutor',
  'conversa_professor',
  'execucao_agente',
  'texto_do_modelo',
  'consumo_por_aluno',
  'autoria_de_artefato',
] as const satisfies readonly CategoriaDeRetencao[]
export type CategoriaDoExpurgo = (typeof CATEGORIAS_DO_EXPURGO)[number]

/**
 * O que sai em cada passo de uma categoria, na ordem: a conversa do professor apaga as mensagens, e depois a thread vazia.
 * Os alvos de anonimização mantêm a linha e anulam a pessoa: `consumo_ia_texto` anula `entrada` e `saida`,
 * `consumo_ia_aluno` anula `aluno_id`, e `artefato_autoria` anula `criado_por`. O consumo por aluno anonimiza também a
 * execução do Tutor (`execucao_agente_do_tutor`): ela tem o aluno em `solicitada_por`, e o consumo do Tutor aponta para
 * ela, então sem isso o aluno voltaria ao consumo pela execução até o prazo de `execucao_agente`, que não é travado pela
 * conversa do Tutor.
 */
export const ALVOS_DO_EXPURGO_DA_ESCOLA = {
  conversa_tutor: ['mensagem_tutor'],
  sinal_tutor: ['sinal_tutor'],
  conversa_professor: ['mensagem_agente', 'thread_agente'],
  execucao_agente: ['execucao_agente'],
  texto_do_modelo: ['consumo_ia_texto'],
  consumo_por_aluno: ['consumo_ia_aluno', 'execucao_agente_do_tutor'],
  autoria_de_artefato: ['artefato_autoria'],
} as const satisfies Record<CategoriaDoExpurgo, readonly string[]>
export type AlvoDoExpurgoDaEscola = (typeof ALVOS_DO_EXPURGO_DA_ESCOLA)[CategoriaDoExpurgo][number]

/**
 * O prazo de um lote: o `agora` do job (de onde o prazo conta), os meses da categoria e o fuso da escola. O fuso só vale
 * para a autoria, que conta de uma data (o `fim` do ano letivo): o dia de `agora` é o da parede da escola.
 */
export interface PrazoDoLote {
  readonly agora: Date
  readonly meses: number
  readonly fuso: string
}

/** Um lote: quantas linhas saíram ou foram anonimizadas, e se o lote veio cheio (há mais no prazo vencido). */
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
 * delete ou do update; `order by` pela data, que desce pelo índice `(escola_id, <data>)` das migrations 0025 e 0026 e para
 * no lote; e `skip locked`, para dois jobs da mesma escola ao mesmo tempo levarem linhas diferentes, sem um esperar o
 * outro. A escola entra nas duas cláusulas: na subconsulta, para o índice; na instrução de fora, para nenhuma linha de
 * outra escola mudar nem por um id que casasse.
 *
 * Os lotes de anonimização (F3, tarefa 4.0) mantêm a linha e anulam só a pessoa, e cada subconsulta lê só as linhas que
 * ainda a têm, pelo índice parcial da 0026: reexecutar não mexe no que já foi anonimizado. Eles travam com `for no key
 * update`, o mesmo que o próprio update toma (nenhuma coluna mudada está em índice único): a mensagem ou o consumo novo
 * que aponta para a execução, e a entrega que aponta para o artefato, conferem a FK sem esperar o lote, e o lote não pula
 * a linha só por isso.
 * - **`execucao_agente`**: `entrada` vira `{ tarefa }` (o check `execucao_agente_entrada_da_tarefa` exige a tarefa),
 *   `solicitada_por` vira nulo e `anonimizada_em` recebe o `agora` do job. O estado, o `resultado` e o `erro` ficam, e com
 *   eles todos os checks das migrations 0022 e 0023.
 * - **`execucao_agente_do_tutor`**: a mesma anonimização, só da execução do Tutor (`funcao = 'tutor_com_o_aluno'`, a única
 *   que o aluno pede), no prazo de `consumo_por_aluno`: a execução do Tutor perde o aluno no menor dos dois prazos.
 * - **`consumo_ia_texto`**: só as linhas com `entrada` ou `saida`; as do Tutor e da proposta de ferramenta já nascem sem
 *   texto (check `consumo_ia_sem_conversa_de_pessoa`) e não entram no lote nem na contagem.
 * - **`artefato_autoria`**: só o artefato de ano letivo `encerrado` cujo `fim`, somado o prazo, é anterior ao dia de
 *   `agora` no fuso da escola (nunca o da sessão do banco, nem o de UTC, que já virou o dia às 21h de São Paulo, e o job
 *   segurado pela janela letiva pode rodar a essa hora). O fuso é o que o Node já aceitou para a janela; um nome que o
 *   tzdata do Postgres não tivesse faria o lote falhar, a categoria ficaria `false` e o alerta de duas noites a mostraria.
 *   Trava só o artefato (`of a`): o ano que a coordenação está encerrando não faz o lote pular os artefatos dele. Sem
 *   `order by`: o índice `(escola_id, ano_letivo_id)` não tem data, e a idade é a do ano, não a da linha.
 */
const INSTRUCAO_DO_LOTE: Record<Exclude<AlvoDoExpurgoDaEscola, 'thread_agente'>, (escolaId: string, prazo: PrazoDoLote, limite: number) => SQL> = {
  mensagem_tutor: (escolaId, { agora, meses }, limite) => sql`
    delete from mensagem_tutor
    where escola_id = ${escolaId} and id = any(array(
      select id from mensagem_tutor
      where escola_id = ${escolaId} and criada_em < ${corte(agora, meses)}
      order by criada_em
      limit ${limite}
      for update skip locked
    ))
  `,
  sinal_tutor: (escolaId, { agora, meses }, limite) => sql`
    delete from sinal_tutor
    where escola_id = ${escolaId} and id = any(array(
      select id from sinal_tutor
      where escola_id = ${escolaId} and criado_em < ${corte(agora, meses)}
      order by criado_em
      limit ${limite}
      for update skip locked
    ))
  `,
  mensagem_agente: (escolaId, { agora, meses }, limite) => sql`
    delete from mensagem_agente
    where escola_id = ${escolaId} and id = any(array(
      select id from mensagem_agente
      where escola_id = ${escolaId} and criada_em < ${corte(agora, meses)}
      order by criada_em
      limit ${limite}
      for update skip locked
    ))
  `,
  execucao_agente: (escolaId, { agora, meses }, limite) => sql`
    update execucao_agente
    set entrada = jsonb_build_object('tarefa', tarefa), solicitada_por = null, anonimizada_em = ${agora.toISOString()}::timestamptz
    where escola_id = ${escolaId} and id = any(array(
      select id from execucao_agente
      where escola_id = ${escolaId} and anonimizada_em is null and criada_em < ${corte(agora, meses)}
      order by criada_em
      limit ${limite}
      for no key update skip locked
    ))
  `,
  execucao_agente_do_tutor: (escolaId, { agora, meses }, limite) => sql`
    update execucao_agente
    set entrada = jsonb_build_object('tarefa', tarefa), solicitada_por = null, anonimizada_em = ${agora.toISOString()}::timestamptz
    where escola_id = ${escolaId} and id = any(array(
      select id from execucao_agente
      where escola_id = ${escolaId} and anonimizada_em is null and funcao = 'tutor_com_o_aluno' and criada_em < ${corte(agora, meses)}
      order by criada_em
      limit ${limite}
      for no key update skip locked
    ))
  `,
  consumo_ia_texto: (escolaId, { agora, meses }, limite) => sql`
    update consumo_ia
    set entrada = null, saida = null
    where escola_id = ${escolaId} and id = any(array(
      select id from consumo_ia
      where escola_id = ${escolaId} and (entrada is not null or saida is not null) and em < ${corte(agora, meses)}
      order by em
      limit ${limite}
      for no key update skip locked
    ))
  `,
  consumo_ia_aluno: (escolaId, { agora, meses }, limite) => sql`
    update consumo_ia
    set aluno_id = null
    where escola_id = ${escolaId} and id = any(array(
      select id from consumo_ia
      where escola_id = ${escolaId} and aluno_id is not null and em < ${corte(agora, meses)}
      order by em
      limit ${limite}
      for no key update skip locked
    ))
  `,
  artefato_autoria: (escolaId, { agora, meses, fuso }, limite) => sql`
    update artefato
    set criado_por = null
    where escola_id = ${escolaId} and id = any(array(
      select a.id from artefato a
      join ano_letivo al on al.escola_id = a.escola_id and al.id = a.ano_letivo_id
      where a.escola_id = ${escolaId} and al.escola_id = ${escolaId} and a.criado_por is not null
        and al.situacao = 'encerrado' and al.fim + make_interval(months => ${meses}) < (${agora.toISOString()}::timestamptz at time zone ${fuso})::date
      limit ${limite}
      for no key update of a skip locked
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
 *
 * Execução de agente, texto do modelo, consumo por aluno e autoria de artefato **ficam com a linha e perdem a pessoa**
 * (tarefa 4.0): o que a IA gerou, quem aprovou e a soma da governança continuam respondendo (regra 70, item 6).
 */
export class ExpurgoDaEscolaRepository {
  constructor(private readonly banco: Banco) {}

  /**
   * Apaga, ou anonimiza, como o alvo diz, até `limite` linhas de `alvo` da escola do contexto com mais de `prazo.meses`
   * meses contados de `prazo.agora` (o autor do artefato, do `fim` do ano encerrado, no dia do fuso da escola), numa
   * transação curta, e diz quantas linhas o lote alcançou e se ele veio cheio.
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
  async expurgarLote(alvo: AlvoDoExpurgoDaEscola, prazo: PrazoDoLote, limite: number, depoisDeTravar?: () => Promise<void>): Promise<LoteDoExpurgo> {
    const { agora, meses } = prazo
    const escolaId = exigirEscolaDoContexto()
    if (alvo !== 'thread_agente') {
      const resultado = await this.banco.execute(INSTRUCAO_DO_LOTE[alvo](escolaId, prazo, limite))
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

/** A instrução do lote, para o teste conferir o plano sem mudar nada. A thread vazia não tem instrução única. */
export function instrucaoDoLoteDaEscola(alvo: Exclude<AlvoDoExpurgoDaEscola, 'thread_agente'>, escolaId: string, prazo: PrazoDoLote, limite: number): SQL {
  return INSTRUCAO_DO_LOTE[alvo](escolaId, prazo, limite)
}
