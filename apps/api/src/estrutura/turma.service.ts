import { ErroDeDominio, exigirAnoEmCurso, RegistroDeAuditoria, sessaoDaRequisicao, type Banco } from '@educa/nucleo'
import {
  alcanceDe,
  CodigoDeErro,
  esquemaRespostaAlunosDaTurma,
  esquemaRespostaListaDeTurmas,
  esquemaRespostaTurma,
  esquemaRespostaTurmaAberta,
  type ConsultaAlunosDaTurma,
  type ConsultaPaginada,
  type PedidoCriarTurma,
  type RespostaAlunosDaTurma,
  type RespostaListaDeTurmas,
  type RespostaTurma,
  type RespostaTurmaAberta,
} from '@educa/shared'
import { paginar, paginarPor } from './entrada.js'
import { SerieRepository } from './serie.repository.js'
import { TurmaRepository, type AlcanceDaTurma } from './turma.repository.js'

const registro = new RegistroDeAuditoria()

/**
 * Como o papel da sessão alcança a turma, pela célula da `MATRIZ`: `unidade` e `nominal_auditado` são a coordenação,
 * que alcança toda turma da escola; `turma_vinculada` é o professor, que precisa do vínculo confirmado. Qualquer outro
 * alcance não chega aqui (a guarda de permissão barra o `nunca`) e, se chegasse, responderia como inexistente.
 */
function alcanceDaTurma(recurso: 'turma' | 'aluno_da_turma'): AlcanceDaTurma {
  const alcance = alcanceDe(sessaoDaRequisicao().papel, recurso, 'ler')
  if (alcance === 'unidade' || alcance === 'nominal_auditado') return 'unidade'
  if (alcance === 'turma_vinculada') return 'turma_vinculada'
  throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
}

/**
 * A coordenação cria e lista as turmas do ano letivo em curso (RF2; regra 60, item 5). Sem ano em curso, as duas
 * rotas falham fechadas com `NAO_ENCONTRADO` (Tech Spec, seção 5, "Requisição").
 *
 * - A turma nasce no ano em curso da escola da sessão. Um `anoLetivoId` no corpo que não seja ele (planejado,
 *   encerrado, de outra escola, inexistente) responde como inexistente, e nada é criado.
 * - Série de outra escola ou inexistente: `NAO_ENCONTRADO`, igual.
 * - O mesmo nome no mesmo ano, sem diferenciar maiúscula: `CONFLITO`, sem o valor.
 */
export class TurmaService {
  constructor(private readonly banco: Banco) {}

  async criar(pedido: PedidoCriarTurma): Promise<RespostaTurma> {
    const anoEmCurso = exigirAnoEmCurso()
    if (pedido.anoLetivoId !== undefined && pedido.anoLetivoId.toLowerCase() !== anoEmCurso) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    const criada = await this.banco.transaction(async (tx) => {
      const turmas = new TurmaRepository(tx)
      if (!(await turmas.travarAnoEmCurso())) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      const serie = await new SerieRepository(tx).porId(pedido.serieId.toLowerCase())
      if (serie === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      return { ...(await turmas.criar({ serieId: serie.id, nome: pedido.nome, turno: pedido.turno ?? null })), serie }
    })
    return esquemaRespostaTurma.parse(criada)
  }

  async listar(consulta: ConsultaPaginada): Promise<RespostaListaDeTurmas> {
    const linhas = await new TurmaRepository(this.banco).listar(consulta)
    return esquemaRespostaListaDeTurmas.parse(paginar(linhas, consulta.limite))
  }

  /**
   * `GET /v1/turmas/:id` (RF5, RF15): a coordenação abre qualquer turma do ano em curso da escola; o professor, só a
   * turma em que tem vínculo `confirmado`. Pendente, contestado, encerrado, turma de outra escola ou inexistente: o
   * mesmo `NAO_ENCONTRADO`.
   */
  async abrir(id: string): Promise<RespostaTurmaAberta> {
    const aberta = await new TurmaRepository(this.banco).aberta(id, alcanceDaTurma('turma'))
    if (aberta === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    return esquemaRespostaTurmaAberta.parse(aberta)
  }

  /**
   * `GET /v1/turmas/:id/alunos` (RF5; regra 20, itens 4, 5 e 10): o mesmo critério de acesso da turma, e uma página de
   * `{ usuarioId, nome }`.
   *
   * A coordenação (`nominal_auditado`) é obrigada a dizer a finalidade, e a leitura grava `turma.alunos_lidos` na mesma
   * transação: sem registro, sem lista. A finalidade é conferida antes de procurar a turma, então a falta dela responde
   * igual para qualquer id. O professor com vínculo confirmado lê a própria turma sem finalidade e sem registro.
   */
  async alunos(id: string, consulta: ConsultaAlunosDaTurma): Promise<RespostaAlunosDaTurma> {
    const nominalAuditado = alcanceDe(sessaoDaRequisicao().papel, 'aluno_da_turma', 'ler') === 'nominal_auditado'
    const { finalidade } = consulta
    if (nominalAuditado && finalidade === undefined) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    const alcance = alcanceDaTurma('aluno_da_turma')
    const pagina = await this.banco.transaction(async (tx) => {
      const turmas = new TurmaRepository(tx)
      if ((await turmas.aberta(id, alcance)) === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      const cortada = paginarPor(await turmas.alunos(id, consulta), consulta.limite, (aluno) => aluno.usuarioId)
      if (nominalAuditado && finalidade !== undefined) {
        await registro.gravar(tx, 'turma.alunos_lidos', { entidadeId: id, depois: { quantidade: cortada.itens.length }, finalidade })
      }
      return cortada
    })
    return esquemaRespostaAlunosDaTurma.parse(pagina)
  }
}
