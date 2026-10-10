import { and, asc, eq, inArray, or, sql } from 'drizzle-orm'
import { exigirEscolaDoContexto } from '../contexto/escola-do-contexto.js'
import type { Banco, TransacaoBanco } from '../db/banco.js'
import { consumoIa } from '../db/schema/consumo-ia.js'
import { execucaoAgente } from '../db/schema/execucao-agente.js'
import { FUSO_DO_USO, diaDeUso } from '../uso/dia-de-uso.js'

/** Uma chamada com envio externo atribuível ao titular: o `provedor` é nulo na linha anterior à migration da 7.0. */
export interface ChamadaDoRastro {
  readonly provedor: string | null
  readonly em: Date
}

/** O vínculo do titular como professor: quando ele saiu, e se algum segue aberto. */
export interface VinculosDoProfessor {
  readonly encerrado: Date | null
  readonly abertos: number
}

/**
 * As leituras do compartilhamento do titular (F3, tarefa 12.0; regra 00, item 3: o repository é o único lugar que toca
 * o banco). A regra — período, rastro, reserva e hospedagem — fica no `Compartilhamento`, que chama este.
 *
 * **Cada método lê a escola do contexto e nenhum a recebe por parâmetro** (regra 10, item 3): quem chamou não decide
 * o escopo, e não existe caminho para ler o dado de outra escola.
 */
export class CompartilhamentoRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /** O horizonte do rastro (o prazo da categoria, em meses) e o fim do dia de uso do `agora`, pela aritmética do banco. */
  async datasDeReferencia(agora: Date, meses: number): Promise<{ horizonte: Date; fimDoDia: Date }> {
    const { rows } = await this.banco.execute<{ horizonte: Date | string; fimDoDia: Date | string }>(sql`
      select (${agora.toISOString()}::timestamptz - make_interval(months => ${meses})) as horizonte,
             (((${diaDeUso(agora)}::date + 1)::timestamp at time zone ${FUSO_DO_USO}) - interval '1 millisecond') as "fimDoDia"
    `)
    const horizonte = dataDoBanco(rows[0]?.horizonte ?? null)
    const fimDoDia = dataDoBanco(rows[0]?.fimDoDia ?? null)
    if (horizonte === null || fimDoDia === null) throw new Error('datas de referência do compartilhamento não calculadas')
    return { horizonte, fimDoDia }
  }

  /** O vínculo do titular como professor, na escola do contexto: o `encerrado_em` mais recente e quantos seguem abertos. */
  async vinculosDoProfessor(titularId: string): Promise<VinculosDoProfessor> {
    const escolaId = exigirEscolaDoContexto()
    const { rows } = await this.banco.execute<{ encerrado: Date | string | null; abertos: number }>(sql`
      select max(encerrado_em) as encerrado, count(*) filter (where encerrado_em is null)::int as abertos
      from vinculo where escola_id = ${escolaId} and usuario_id = ${titularId} and papel = 'professor'
    `)
    return { encerrado: dataDoBanco(rows[0]?.encerrado ?? null), abertos: rows[0]?.abertos ?? 0 }
  }

  /** A entrada do aluno na escola do contexto: a mais antiga entre a credencial de matrícula e a conta externa ligada. */
  async entradaDoAluno(titularId: string): Promise<Date | null> {
    const escolaId = exigirEscolaDoContexto()
    const { rows } = await this.banco.execute<{ entrada: Date | string | null }>(sql`
      select least(
        (select min(criada_em) from credencial_matricula where escola_id = ${escolaId} and usuario_id = ${titularId}),
        (select min(ligada_em) from conta_externa where escola_id = ${escolaId} and usuario_id = ${titularId})
      ) as entrada
    `)
    return dataDoBanco(rows[0]?.entrada ?? null)
  }

  /** A entrada do titular como professor, na escola do contexto: o `criado_em` mais antigo dos vínculos dele. */
  async entradaDoProfessor(titularId: string): Promise<Date | null> {
    const escolaId = exigirEscolaDoContexto()
    const { rows } = await this.banco.execute<{ entrada: Date | string | null }>(sql`
      select min(criado_em) as entrada from vinculo
      where escola_id = ${escolaId} and usuario_id = ${titularId} and papel = 'professor'
    `)
    return dataDoBanco(rows[0]?.entrada ?? null)
  }

  /**
   * As chamadas com envio externo atribuíveis ao titular, na escola do contexto: as que levam o `aluno_id` dele e as
   * das execuções que ele pediu. A linha sem `provedor` é a antiga, anterior à migration da 7.0.
   */
  async rastroDoAluno(titularId: string): Promise<ChamadaDoRastro[]> {
    const escolaId = exigirEscolaDoContexto()
    // O filtro de escola é a segunda camada: as FKs compostas (`consumo_ia_aluno_da_escola_fk`,
    // `consumo_ia_execucao_da_escola_fk`, `execucao_agente_solicitada_por_da_escola_fk`) já impedem que a linha de
    // outra escola aponte para o titular, e ele fica para quem alterar a consulta (regra 10).
    const pedidas = this.banco.select({ id: execucaoAgente.id }).from(execucaoAgente).where(and(eq(execucaoAgente.escolaId, escolaId), eq(execucaoAgente.solicitadaPor, titularId)))
    return this.banco
      .select({ provedor: consumoIa.provedor, em: consumoIa.em })
      .from(consumoIa)
      .where(and(eq(consumoIa.escolaId, escolaId), eq(consumoIa.envioExterno, true), or(eq(consumoIa.alunoId, titularId), inArray(consumoIa.execucaoId, pedidas))))
      .orderBy(asc(consumoIa.em))
  }
}

/**
 * O `timestamptz` de uma consulta crua (`execute`) vem como texto, e só as colunas do drizzle são convertidas pelo
 * mapper delas; é por isso que a reconciliação do job também o trata como `::text`. A foto trabalha em instante.
 */
function dataDoBanco(valor: Date | string | null): Date | null {
  return valor === null ? null : valor instanceof Date ? valor : new Date(valor)
}
