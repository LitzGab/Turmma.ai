import { anoLetivo, exigirEscolaDoContexto, type Banco, type TransacaoBanco } from '@educa/nucleo'
import type { AnoLetivo, ConsultaPaginada, PedidoCriarAnoLetivo, SituacaoDoAnoLetivo } from '@educa/shared'
import { and, asc, eq, gt } from 'drizzle-orm'

const colunas = { id: anoLetivo.id, ano: anoLetivo.ano, inicio: anoLetivo.inicio, fim: anoLetivo.fim, situacao: anoLetivo.situacao }

/**
 * Os anos letivos da escola do contexto, e só dela: nenhum método recebe escola (regra 10, item 3). Id de outra escola
 * não acha nada, e o service responde como inexistente.
 *
 * Abrir e encerrar são `update` condicionais na situação: a transição acontece uma vez, e o segundo ano em curso da
 * escola é barrado pelo índice único parcial `ano_letivo_um_em_curso_por_escola`, não por uma leitura antes da
 * escrita (regra 80, item 7).
 */
export class AnoLetivoRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  async criar(pedido: PedidoCriarAnoLetivo): Promise<AnoLetivo> {
    const [criado] = await this.banco
      .insert(anoLetivo)
      .values({ escolaId: exigirEscolaDoContexto(), ano: pedido.ano, inicio: pedido.inicio, fim: pedido.fim, situacao: 'planejado' })
      .returning(colunas)
    if (criado === undefined) throw new Error('ano letivo não criado')
    return criado
  }

  /** Uma página dos anos da escola, em ordem de criação, com uma linha a mais que diz se há próxima. */
  listar({ pagina, limite }: ConsultaPaginada): Promise<AnoLetivo[]> {
    return this.banco
      .select(colunas)
      .from(anoLetivo)
      .where(and(eq(anoLetivo.escolaId, exigirEscolaDoContexto()), pagina === undefined ? undefined : gt(anoLetivo.id, pagina)))
      .orderBy(asc(anoLetivo.id))
      .limit(limite + 1)
  }

  async porId(id: string): Promise<AnoLetivo | undefined> {
    const [linha] = await this.banco
      .select(colunas)
      .from(anoLetivo)
      .where(and(eq(anoLetivo.escolaId, exigirEscolaDoContexto()), eq(anoLetivo.id, id)))
    return linha
  }

  /** Passa o ano de `de` a `para`, se ele estiver em `de`. Devolve o ano mudado, ou nada se não estava. */
  async mudarSituacao(id: string, de: SituacaoDoAnoLetivo, para: SituacaoDoAnoLetivo): Promise<AnoLetivo | undefined> {
    const [mudado] = await this.banco
      .update(anoLetivo)
      .set({ situacao: para })
      .where(and(eq(anoLetivo.escolaId, exigirEscolaDoContexto()), eq(anoLetivo.id, id), eq(anoLetivo.situacao, de)))
      .returning(colunas)
    return mudado
  }
}
