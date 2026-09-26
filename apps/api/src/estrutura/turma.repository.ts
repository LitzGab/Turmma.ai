import { anoLetivo, exigirAnoEmCurso, exigirEscolaDoContexto, serie, sessaoDaRequisicao, turma, usuario, vinculo, type Banco, type TransacaoBanco } from '@educa/nucleo'
import type { AlunoDaTurma, ConsultaPaginada, RespostaTurmaAberta, Turma, Turno } from '@educa/shared'
import { and, asc, eq, exists, gt, isNotNull, isNull, or, type SQL } from 'drizzle-orm'
import { excluirSemReferencia } from './exclusao.js'

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

  /**
   * Troca o nome da turma do ano em curso com esse id e devolve a turma renomeada, com o id da série, que o service
   * troca pela série. A de outro ano (encerrado ou planejado), de outra escola ou inexistente não é achada
   * (`undefined`), e nada muda. O nome de outra turma do mesmo ano é barrado pelo mesmo índice único do criar.
   */
  async renomear(id: string, nome: string): Promise<(TurmaGravada & { readonly serieId: string }) | undefined> {
    const [renomeada] = await this.banco
      .update(turma)
      .set({ nome })
      .where(and(eq(turma.escolaId, exigirEscolaDoContexto()), eq(turma.anoLetivoId, exigirAnoEmCurso()), eq(turma.id, id)))
      .returning({ ...colunas, serieId: turma.serieId })
    return renomeada
  }

  /**
   * Apaga a turma do ano em curso com esse id, se nada aponta para ela, e diz se apagou. Com vínculo (qualquer estado),
   * a FK barra e sai `CONFLITO` (`excluirSemReferencia`); as tarefas seguintes da A1 somam o nome da lista, o pedido e o
   * acesso vigente. A turma de outro ano, de outra escola ou inexistente não é achada (`false`).
   */
  excluir(id: string): Promise<boolean> {
    return excluirSemReferencia(async () => {
      const apagadas = await this.banco
        .delete(turma)
        .where(and(eq(turma.escolaId, exigirEscolaDoContexto()), eq(turma.anoLetivoId, exigirAnoEmCurso()), eq(turma.id, id)))
        .returning({ id: turma.id })
      return apagadas.length > 0
    })
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
   * A turma com esse id no ano da leitura, se quem pede a alcança; senão, nada, e o service responde como inexistente
   * (regra 10, itens 4 e 6).
   *
   * - Sem `anoEncerrado`, o ano da leitura é o em curso do contexto.
   * - Com `anoEncerrado` (o `?anoLetivoId` do cliente, 10.0, RF16), a turma precisa ser desse ano, e o ano precisa ser
   *   da escola do contexto e estar `encerrado`. O ano em curso, o planejado, o de outra escola e o inexistente não
   *   acham nada. O filtro vem do cliente e só restringe: a escola continua vindo do contexto.
   *
   * Com `turma_vinculada`, a turma só aparece se existir vínculo de professor do usuário do contexto nela, lido a cada
   * requisição, sem cache (RF5): no ano em curso, `confirmado`; no ano encerrado, também o que chegou confirmado ao fim
   * do ano (`#confirmadoAteOFimDoAno`). O vínculo é da turma (mesma escola e mesmo ano, pela correlação), e o usuário vem
   * do contexto, nunca de argumento.
   */
  async aberta(id: string, alcance: AlcanceDaTurma, anoEncerrado?: string): Promise<RespostaTurmaAberta | undefined> {
    const [linha] = await this.banco
      .select({ id: turma.id, nome: turma.nome, serieId: serie.id, etapa: serie.etapa, ano: serie.ano })
      .from(turma)
      .innerJoin(serie, and(eq(serie.escolaId, turma.escolaId), eq(serie.id, turma.serieId)))
      .where(
        and(
          eq(turma.escolaId, exigirEscolaDoContexto()),
          this.#doAnoDaLeitura(anoEncerrado),
          eq(turma.id, id),
          alcance === 'unidade' ? undefined : this.#comVinculoDoProfessor(anoEncerrado),
        ),
      )
    if (linha === undefined) return undefined
    const { serieId, etapa, ano, ...resto } = linha
    return { ...resto, serie: { id: serieId, etapa, ano } }
  }

  /** A turma do ano em curso, ou do ano pedido, se ele for da escola da turma e estiver `encerrado`. */
  #doAnoDaLeitura(anoEncerrado: string | undefined): SQL | undefined {
    if (anoEncerrado === undefined) return eq(turma.anoLetivoId, exigirAnoEmCurso())
    return and(
      eq(turma.anoLetivoId, anoEncerrado),
      exists(
        this.banco
          .select({ um: anoLetivo.id })
          .from(anoLetivo)
          .where(and(eq(anoLetivo.escolaId, turma.escolaId), eq(anoLetivo.id, turma.anoLetivoId), eq(anoLetivo.situacao, 'encerrado'))),
      ),
    )
  }

  #comVinculoDoProfessor(anoEncerrado: string | undefined) {
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
            anoEncerrado === undefined ? eq(vinculo.estado, 'confirmado') : TurmaRepository.#confirmadoAteOFimDoAno(),
          ),
        ),
    )
  }

  /**
   * O vínculo que valia quando o ano acabou: `confirmado`, ou encerrado pela virada (`fim_do_ano`) depois de ter sido
   * confirmado. A virada leva também o pendente e o contestado a `fim_do_ano`, e eles nunca deram acesso: o pendente
   * não tem `decidido_em`, e o contestado guarda o código da contestação (confirmar apaga o código). Encerrado por
   * `desligamento` ou `realocacao` não vale: quem saiu não lê (RF16).
   */
  static #confirmadoAteOFimDoAno(): SQL | undefined {
    return or(
      eq(vinculo.estado, 'confirmado'),
      and(eq(vinculo.estado, 'encerrado'), eq(vinculo.motivoEncerramento, 'fim_do_ano'), isNotNull(vinculo.decididoEm), isNull(vinculo.contestacao)),
    )
  }

  /**
   * Uma página dos alunos da turma no ano da leitura (o em curso, ou o `anoEncerrado` que `aberta` já conferiu): quem
   * tem vínculo de aluno válido nela e está ativo, em ordem de `usuarioId`, com uma linha a mais que diz se há próxima.
   * Só id e nome (regra 20, item 4). No ano em curso, o vínculo `confirmado`; no encerrado, o que chegou confirmado ao
   * fim do ano, e não o transferido no meio dele. Não confere quem pede: o service chama depois de `aberta`.
   */
  alunos(turmaId: string, { pagina, limite }: ConsultaPaginada, anoEncerrado?: string): Promise<AlunoDaTurma[]> {
    return this.banco
      .selectDistinct({ usuarioId: usuario.id, nome: usuario.nome })
      .from(vinculo)
      .innerJoin(usuario, and(eq(usuario.escolaId, vinculo.escolaId), eq(usuario.id, vinculo.usuarioId)))
      .where(
        and(
          eq(vinculo.escolaId, exigirEscolaDoContexto()),
          eq(vinculo.anoLetivoId, anoEncerrado ?? exigirAnoEmCurso()),
          eq(vinculo.turmaId, turmaId),
          eq(vinculo.papel, 'aluno'),
          anoEncerrado === undefined ? eq(vinculo.estado, 'confirmado') : TurmaRepository.#confirmadoAteOFimDoAno(),
          isNull(usuario.desativadoEm),
          pagina === undefined ? undefined : gt(usuario.id, pagina),
        ),
      )
      .orderBy(asc(usuario.id))
      .limit(limite + 1)
  }
}
