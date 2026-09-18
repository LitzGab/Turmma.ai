import { disciplina, exigirAnoEmCurso, exigirEscolaDoContexto, sessaoDaRequisicao, turma, usuario, vinculo, type Banco, type TransacaoBanco } from '@educa/nucleo'
import type {
  ConsultaPaginada,
  ContestacaoDeVinculo,
  EstadoDeVinculo,
  MotivoDeEncerramentoDeVinculo,
  PapelDeVinculo,
} from '@educa/shared'
import { and, asc, eq, gt, inArray, isNull, ne, sql, type SQL } from 'drizzle-orm'

export interface NovoVinculo {
  readonly usuarioId: string
  readonly turmaId: string
  readonly disciplinaId: string | null
  readonly papel: PapelDeVinculo
}

/** O vínculo lido com o nome da turma e da disciplina, do jeito que os dois DTOs precisam. */
export interface VinculoLido {
  readonly id: string
  readonly usuarioId: string
  readonly papel: PapelDeVinculo
  readonly turma: { readonly id: string; readonly nome: string }
  readonly disciplina: { readonly id: string; readonly nome: string } | null
  readonly estado: EstadoDeVinculo
  readonly contestacao: ContestacaoDeVinculo | null
  readonly complemento: string | null
  readonly motivoEncerramento: MotivoDeEncerramentoDeVinculo | null
  readonly decididoEm: Date | null
}

/**
 * O que o professor decide. Confirmar apaga o código e o complemento de uma contestação anterior: ela deixou de valer, e
 * o texto livre não fica guardado sem motivo (regra 20).
 */
export type Decisao =
  | { readonly estado: 'confirmado' }
  | { readonly estado: 'contestado'; readonly contestacao: ContestacaoDeVinculo; readonly complemento: string | null }

const colunas = {
  id: vinculo.id,
  usuarioId: vinculo.usuarioId,
  papel: vinculo.papel,
  turmaId: turma.id,
  turmaNome: turma.nome,
  disciplinaId: disciplina.id,
  disciplinaNome: disciplina.nome,
  estado: vinculo.estado,
  contestacao: vinculo.contestacao,
  complemento: vinculo.complemento,
  motivoEncerramento: vinculo.motivoEncerramento,
  decididoEm: vinculo.decididoEm,
}

/**
 * Os vínculos da escola do contexto no ano letivo em curso dela, e só deles: escola, ano e, para o professor, o próprio
 * usuário vêm do contexto que a `GuardaDeSessao` gravou, nunca de argumento (regra 10, itens 2 e 3). Sem ano em curso,
 * `exigirAnoEmCurso` falha fechado com `NAO_ENCONTRADO` antes de qualquer consulta (Tech Spec, seção 5).
 *
 * As FKs compostas são a segunda camada: o vínculo nunca aponta para a turma, o usuário ou a disciplina de outra escola,
 * nem para a turma de outro ano.
 */
export class VinculoRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /** O vínculo nasce `pendente`, com `criado_por` do contexto. O repetido fora do `encerrado` é barrado pelo índice único. */
  async criar(novo: NovoVinculo): Promise<string> {
    const { usuarioId: criadoPor } = sessaoDaRequisicao()
    const [criado] = await this.banco
      .insert(vinculo)
      .values({
        escolaId: exigirEscolaDoContexto(),
        anoLetivoId: exigirAnoEmCurso(),
        usuarioId: novo.usuarioId,
        turmaId: novo.turmaId,
        disciplinaId: novo.disciplinaId,
        papel: novo.papel,
        estado: 'pendente',
        criadoPor,
      })
      .returning({ id: vinculo.id })
    if (criado === undefined) throw new Error('vínculo não criado')
    return criado.id
  }

  /** Se a pessoa é da escola, está ativa e tem o papel do vínculo: professor com vínculo de professor. */
  async pessoaAtivaComPapel(usuarioId: string, papel: PapelDeVinculo): Promise<boolean> {
    const [linha] = await this.banco
      .select({ id: usuario.id })
      .from(usuario)
      .where(and(eq(usuario.escolaId, exigirEscolaDoContexto()), eq(usuario.id, usuarioId), eq(usuario.papel, papel), isNull(usuario.desativadoEm)))
    return linha !== undefined
  }

  /** Uma página dos vínculos do ano, do estado pedido ou de todos, em ordem de criação, com uma linha a mais. */
  listar({ pagina, limite, estado }: ConsultaPaginada & { readonly estado?: EstadoDeVinculo | undefined }): Promise<VinculoLido[]> {
    return this.#lerComReferencias(
      and(estado === undefined ? undefined : eq(vinculo.estado, estado), pagina === undefined ? undefined : gt(vinculo.id, pagina)),
      limite + 1,
    )
  }

  /** Uma página dos vínculos do usuário do contexto no ano, em ordem de criação, com uma linha a mais. */
  listarDoUsuario({ pagina, limite }: ConsultaPaginada): Promise<VinculoLido[]> {
    return this.#lerComReferencias(and(this.#doUsuario(), pagina === undefined ? undefined : gt(vinculo.id, pagina)), limite + 1)
  }

  async porId(id: string): Promise<VinculoLido | undefined> {
    const [linha] = await this.#lerComReferencias(eq(vinculo.id, id), 1)
    return linha
  }

  async porIdDoUsuario(id: string): Promise<VinculoLido | undefined> {
    const [linha] = await this.#lerComReferencias(and(eq(vinculo.id, id), this.#doUsuario()), 1)
    return linha
  }

  /**
   * O estado do vínculo, travado em `FOR UPDATE` até o fim da transação: o segundo clique espera o primeiro e relê o
   * estado já mudado (regra 80, item 7). `doUsuario` restringe ao vínculo do usuário do contexto (o professor dono).
   */
  async travar(id: string, { doUsuario }: { readonly doUsuario: boolean }): Promise<EstadoDeVinculo | undefined> {
    const [linha] = await this.banco
      .select({ estado: vinculo.estado })
      .from(vinculo)
      .where(and(this.#escopo(), eq(vinculo.id, id), doUsuario ? this.#doUsuario() : undefined))
      .for('update')
    return linha?.estado
  }

  /**
   * `update … where id and usuario_id = ctx and estado in ('pendente', 'contestado')` (Tech Spec, seção 5, "Vínculo"):
   * só o dono decide, e só de um estado em decisão. Devolve se mudou.
   */
  async decidir(id: string, decisao: Decisao): Promise<boolean> {
    const mudados = await this.banco
      .update(vinculo)
      .set(
        decisao.estado === 'confirmado'
          ? { estado: 'confirmado', contestacao: null, complemento: null, decididoEm: sql`now()` }
          : { estado: 'contestado', contestacao: decisao.contestacao, complemento: decisao.complemento, decididoEm: sql`now()` },
      )
      .where(and(this.#escopo(), eq(vinculo.id, id), this.#doUsuario(), inArray(vinculo.estado, ['pendente', 'contestado'])))
      .returning({ id: vinculo.id })
    return mudados.length === 1
  }

  /** Encerra o vínculo que ainda não está encerrado. Devolve se mudou. */
  async encerrar(id: string, motivo: MotivoDeEncerramentoDeVinculo): Promise<boolean> {
    const mudados = await this.banco
      .update(vinculo)
      .set({ estado: 'encerrado', motivoEncerramento: motivo, encerradoEm: sql`now()` })
      .where(and(this.#escopo(), eq(vinculo.id, id), ne(vinculo.estado, 'encerrado')))
      .returning({ id: vinculo.id })
    return mudados.length === 1
  }

  #escopo(): SQL | undefined {
    return and(eq(vinculo.escolaId, exigirEscolaDoContexto()), eq(vinculo.anoLetivoId, exigirAnoEmCurso()))
  }

  #doUsuario(): SQL {
    return eq(vinculo.usuarioId, sessaoDaRequisicao().usuarioId)
  }

  async #lerComReferencias(filtro: SQL | undefined, limite: number): Promise<VinculoLido[]> {
    const linhas = await this.banco
      .select(colunas)
      .from(vinculo)
      .innerJoin(turma, and(eq(turma.escolaId, vinculo.escolaId), eq(turma.anoLetivoId, vinculo.anoLetivoId), eq(turma.id, vinculo.turmaId)))
      .leftJoin(disciplina, and(eq(disciplina.escolaId, vinculo.escolaId), eq(disciplina.id, vinculo.disciplinaId)))
      .where(and(this.#escopo(), filtro))
      .orderBy(asc(vinculo.id))
      .limit(limite)
    return linhas.map(({ turmaId, turmaNome, disciplinaId, disciplinaNome, ...resto }) => ({
      ...resto,
      turma: { id: turmaId, nome: turmaNome },
      disciplina: disciplinaId === null || disciplinaNome === null ? null : { id: disciplinaId, nome: disciplinaNome },
    }))
  }
}
