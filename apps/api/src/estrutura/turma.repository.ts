import { anoLetivo, exigirAnoEmCurso, exigirEscolaDoContexto, serie, sessaoDaRequisicao, turma, usuario, vinculo, type Banco, type TransacaoBanco } from '@educa/nucleo'
import type { AlunoDaTurma, ConsultaPaginada, RespostaTurmaAberta, Turma, Turno } from '@educa/shared'
import { and, asc, eq, exists, gt, isNull } from 'drizzle-orm'

export interface NovaTurma {
  readonly serieId: string
  readonly nome: string
  readonly turno: Turno | null
}

/** A turma gravada, sem a série, que o service junta. */
export type TurmaGravada = Omit<Turma, 'serie'>

/**
 * Como a turma é alcançada: a coordenação alcança toda turma da escola (`unidade`); o professor, só a turma em que ele
 * tem vínculo `confirmado` (`turma_vinculada`), as células da `MATRIZ` para `turma.ler` e `aluno_da_turma.ler`.
 */
export type AlcanceDaTurma = 'unidade' | 'turma_vinculada'

const colunas = { id: turma.id, anoLetivoId: turma.anoLetivoId, nome: turma.nome, turno: turma.turno }

/**
 * As turmas da escola do contexto no ano letivo em curso dela, e só delas: escola e ano vêm do contexto que a
 * `GuardaDeSessao` gravou, nunca de argumento (regra 10, itens 2 e 3). Sem ano em curso, `exigirAnoEmCurso` falha
 * fechado com `NAO_ENCONTRADO` antes de qualquer consulta.
 *
 * As FKs compostas `(escola_id, serie_id)` e `(escola_id, ano_letivo_id)` são a segunda camada: mesmo que a série de
 * outra escola passasse por aqui, o banco recusaria a turma.
 */
export class TurmaRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /**
   * Confirma que o ano do contexto ainda está em curso e o trava em `FOR SHARE` até o fim da transação. O `update` do
   * encerramento espera a turma nascer, e a turma que chega depois do encerramento relê o ano já `encerrado` e não
   * nasce: o ano encerrado nunca ganha turma nova, nem na corrida (regra 80, item 7).
   */
  async travarAnoEmCurso(): Promise<boolean> {
    const [linha] = await this.banco
      .select({ id: anoLetivo.id })
      .from(anoLetivo)
      .where(and(eq(anoLetivo.escolaId, exigirEscolaDoContexto()), eq(anoLetivo.id, exigirAnoEmCurso()), eq(anoLetivo.situacao, 'em_curso')))
      .for('share')
    return linha !== undefined
  }

  async criar(nova: NovaTurma): Promise<TurmaGravada> {
    const [criada] = await this.banco
      .insert(turma)
      .values({ escolaId: exigirEscolaDoContexto(), anoLetivoId: exigirAnoEmCurso(), serieId: nova.serieId, nome: nova.nome, turno: nova.turno })
      .returning(colunas)
    if (criada === undefined) throw new Error('turma não criada')
    return criada
  }

  /** Uma página das turmas do ano em curso, com a série, em ordem de criação e uma linha a mais que diz se há próxima. */
  async listar({ pagina, limite }: ConsultaPaginada): Promise<Turma[]> {
    const escolaId = exigirEscolaDoContexto()
    const linhas = await this.banco
      .select({ ...colunas, serieId: serie.id, etapa: serie.etapa, ano: serie.ano })
      .from(turma)
      .innerJoin(serie, and(eq(serie.escolaId, turma.escolaId), eq(serie.id, turma.serieId)))
      .where(and(eq(turma.escolaId, escolaId), eq(turma.anoLetivoId, exigirAnoEmCurso()), pagina === undefined ? undefined : gt(turma.id, pagina)))
      .orderBy(asc(turma.id))
      .limit(limite + 1)
    return linhas.map(({ serieId, etapa, ano, ...resto }) => ({ ...resto, serie: { id: serieId, etapa, ano } }))
  }

  /**
   * A turma do ano em curso com esse id, se quem pede a alcança; senão, nada, e o service responde como inexistente
   * (regra 10, itens 4 e 6).
   *
   * Com `turma_vinculada`, a turma só aparece se existir vínculo de professor `confirmado` do usuário do contexto nela,
   * lido a cada requisição, sem cache: pendente, contestado ou encerrado não dão acesso, e o encerramento corta já na
   * requisição seguinte (RF5). O vínculo é da turma (mesma escola e mesmo ano, pela correlação), e o usuário vem do
   * contexto, nunca de argumento.
   */
  async aberta(id: string, alcance: AlcanceDaTurma): Promise<RespostaTurmaAberta | undefined> {
    const escolaId = exigirEscolaDoContexto()
    const anoLetivoId = exigirAnoEmCurso()
    const [linha] = await this.banco
      .select({ id: turma.id, nome: turma.nome, serieId: serie.id, etapa: serie.etapa, ano: serie.ano })
      .from(turma)
      .innerJoin(serie, and(eq(serie.escolaId, turma.escolaId), eq(serie.id, turma.serieId)))
      .where(and(eq(turma.escolaId, escolaId), eq(turma.anoLetivoId, anoLetivoId), eq(turma.id, id), alcance === 'unidade' ? undefined : this.#comVinculoConfirmado()))
    if (linha === undefined) return undefined
    const { serieId, etapa, ano, ...resto } = linha
    return { ...resto, serie: { id: serieId, etapa, ano } }
  }

  #comVinculoConfirmado() {
    const { usuarioId } = sessaoDaRequisicao()
    return exists(
      this.banco
        .select({ um: vinculo.id })
        .from(vinculo)
        .where(
          and(
            eq(vinculo.escolaId, turma.escolaId),
            eq(vinculo.anoLetivoId, turma.anoLetivoId),
            eq(vinculo.turmaId, turma.id),
            eq(vinculo.usuarioId, usuarioId),
            eq(vinculo.papel, 'professor'),
            eq(vinculo.estado, 'confirmado'),
          ),
        ),
    )
  }

  /**
   * Uma página dos alunos da turma no ano em curso: quem tem vínculo de aluno `confirmado` nela e está ativo, em ordem de
   * `usuarioId`, com uma linha a mais que diz se há próxima. Só id e nome (regra 20, item 4). Não confere quem pede:
   * o service chama depois de `aberta`.
   */
  alunos(turmaId: string, { pagina, limite }: ConsultaPaginada): Promise<AlunoDaTurma[]> {
    return this.banco
      .selectDistinct({ usuarioId: usuario.id, nome: usuario.nome })
      .from(vinculo)
      .innerJoin(usuario, and(eq(usuario.escolaId, vinculo.escolaId), eq(usuario.id, vinculo.usuarioId)))
      .where(
        and(
          eq(vinculo.escolaId, exigirEscolaDoContexto()),
          eq(vinculo.anoLetivoId, exigirAnoEmCurso()),
          eq(vinculo.turmaId, turmaId),
          eq(vinculo.papel, 'aluno'),
          eq(vinculo.estado, 'confirmado'),
          isNull(usuario.desativadoEm),
          pagina === undefined ? undefined : gt(usuario.id, pagina),
        ),
      )
      .orderBy(asc(usuario.id))
      .limit(limite + 1)
  }
}
