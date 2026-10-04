import { ErroDeDominio, ErroDeIa, gerarAtividadeObjetiva, gerarPlanoDeAula, type Banco, type TransacaoBanco } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaConteudoDoArtefato,
  QUESTOES_PADRAO_POR_ATIVIDADE,
  type ConteudoDoArtefato,
  type FerramentaGeradora,
  type Habilidade,
  type ParametrosDeFerramenta,
  type PedidoGerarComFerramenta,
  type RespostaExecucaoAceita,
  type ResultadoGravado,
} from '@educa/shared'
import { contextoDaTarefa } from '../assistente/assistente.service.js'
import { exigirCitacoesEntregues } from '../assistente/citacoes.js'
import { ExecucaoDoPedidoRepository } from '../assistente/execucao-do-pedido.repository.js'
import type { LimiteDePedidosDeIa } from '../assistente/limite-de-pedidos-de-ia.js'
import type { TrechoParaTarefa, TrechosParaTarefa } from '../assistente/trechos-para-tarefa.service.js'
import { TurmaDoProfessorRepository } from '../assistente/turma-do-professor.repository.js'
import type { AgendadorDeExecucoes } from '../ia/agendador-de-execucoes.js'
import { ArtefatoRepository } from './artefato.repository.js'
import { citacoesDoConteudo, habilidadesParaOTema } from './conferencia.js'

/** Quantos trechos do material vão para a ferramenta (o teto das tarefas de geração). */
export const TRECHOS_NA_FERRAMENTA = 12
/**
 * A duração do plano de aula. O contrato da ferramenta não pede duração (turma, disciplina, tema e quantidade), e a
 * tarefa precisa de uma: vale a da aula comum, 50 minutos, até a ferramenta ganhar o campo.
 */
export const DURACAO_PADRAO_DO_PLANO_DE_AULA_MIN = 50

const TAREFA_DA_FERRAMENTA = { atividade_objetiva: 'gerar_atividade_objetiva', plano_de_aula: 'gerar_plano_de_aula' } as const

/** O que a execução leu antes de chamar o modelo: os parâmetros gravados, o contexto da turma, as habilidades e os trechos entregues. */
interface Preparado {
  readonly parametros: ParametrosDeFerramenta
  readonly contexto: { serie: string; disciplina: string }
  readonly habilidades: Habilidade[]
  readonly entregues: readonly TrechoParaTarefa[]
}

/**
 * Gerar com uma ferramenta (MVP, A2; D18, D74): **um caso de uso só**, o mesmo para o formulário de Ferramentas e para
 * o cartão que a conversa abre depois de o professor aceitar a proposta do Assistente. Não existe segundo caminho de
 * geração: o chat não gera, só pergunta.
 *
 * - O professor pede para **turma e disciplina em que tem vínculo confirmado**; as de outra pessoa respondem como
 *   inexistentes. O vínculo é conferido no `POST` e de novo quando a execução roda.
 * - Os trechos vêm do material **`pronto` e não excluído da disciplina, da escola do contexto**, pela busca do tema.
 *   **Sem trecho, a execução falha com `MATERIAL_INSUFICIENTE`**: sem página para citar, nada é gerado (regra 30, item 12).
 * - O artefato nasce na **mesma transação** que conclui a execução, com o conteúdo validado por
 *   `esquemaConteudoDoArtefato`, e **só se toda citação apontar para um trecho que foi entregue à tarefa**.
 * - O que se guarda em `execucao_agente.entrada` são os parâmetros da ferramenta. O artefato é rascunho do professor
 *   (autonomia 1): não vai a aluno nenhum por aqui, e por isso não nasce com entrega.
 */
export class FerramentasService {
  constructor(
    private readonly banco: Banco,
    private readonly agendador: AgendadorDeExecucoes,
    private readonly limite: LimiteDePedidosDeIa,
    private readonly trechos: TrechosParaTarefa,
  ) {}

  async gerar(ferramenta: FerramentaGeradora, pedido: PedidoGerarComFerramenta): Promise<RespostaExecucaoAceita> {
    await this.limite.contar()
    const { chaveEnvio, ...resto } = pedido
    const parametros: ParametrosDeFerramenta = { ...resto, turmaId: resto.turmaId.toLowerCase(), disciplinaId: resto.disciplinaId.toLowerCase() }
    if ((await new TurmaDoProfessorRepository(this.banco).turmaComDisciplina(parametros.turmaId, parametros.disciplinaId)) === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)

    const tarefa = TAREFA_DA_FERRAMENTA[ferramenta]
    let preparado: Preparado | undefined
    const preparar = async (): Promise<Preparado> => {
      preparado = await this.#preparar(chaveEnvio, tarefa)
      return preparado
    }
    const aoConcluir = (saida: ConteudoDoArtefato, tx: TransacaoBanco, execucaoId: string): Promise<ResultadoGravado> => {
      if (preparado === undefined) throw new ErroDeIa('IA_ENTRADA_INVALIDA')
      return this.#gravar(saida, preparado, tx, execucaoId)
    }
    const trechosDaTarefa = (lido: Preparado) => lido.entregues.map(({ materialId, pagina, texto }) => ({ materialId, pagina, texto }))

    if (ferramenta === 'atividade_objetiva') {
      return this.agendador.agendar({
        tarefa: gerarAtividadeObjetiva,
        chaveEnvio,
        entradaDaExecucao: { tarefa: 'gerar_atividade_objetiva', parametros },
        entrada: async () => {
          const lido = await preparar()
          return { tema: lido.parametros.tema, quantidade: lido.parametros.quantidade ?? QUESTOES_PADRAO_POR_ATIVIDADE, contexto: lido.contexto, habilidades: lido.habilidades, trechos: trechosDaTarefa(lido) }
        },
        aoConcluir,
      })
    }
    return this.agendador.agendar({
      tarefa: gerarPlanoDeAula,
      chaveEnvio,
      entradaDaExecucao: { tarefa: 'gerar_plano_de_aula', parametros },
      entrada: async () => {
        const lido = await preparar()
        return { tema: lido.parametros.tema, duracaoMinutos: DURACAO_PADRAO_DO_PLANO_DE_AULA_MIN, contexto: lido.contexto, habilidades: lido.habilidades, trechos: trechosDaTarefa(lido) }
      },
      aoConcluir,
    })
  }

  /**
   * Roda depois do `202`, no contexto de quem pediu. Relê os parâmetros **gravados** com a execução (e não os do corpo
   * de um reenvio), confere de novo o vínculo, e busca os trechos. Os ids dos parâmetros são `jsonb`, sem FK: é a
   * releitura pelo repository, no escopo, que os confere.
   */
  async #preparar(chaveEnvio: string, tarefa: 'gerar_atividade_objetiva' | 'gerar_plano_de_aula'): Promise<Preparado> {
    const { parametros } = await new ExecucaoDoPedidoRepository(this.banco).entradaDaChave(chaveEnvio, tarefa)
    const turma = await new TurmaDoProfessorRepository(this.banco).turmaComDisciplina(parametros.turmaId, parametros.disciplinaId)
    if (turma === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    const entregues = await this.trechos.buscar({ disciplinaId: parametros.disciplinaId, tema: parametros.tema, limite: TRECHOS_NA_FERRAMENTA })
    if (entregues.length === 0) throw new ErroDeIa('MATERIAL_INSUFICIENTE')
    return { parametros, contexto: contextoDaTarefa(turma), habilidades: habilidadesParaOTema(turma.disciplina, turma.serie.etapa, parametros.tema), entregues }
  }

  /** Na transação que conclui a execução: confere as citações contra o que foi entregue, valida o conteúdo e grava o artefato. */
  async #gravar(saida: ConteudoDoArtefato, { parametros, entregues }: Preparado, tx: TransacaoBanco, execucaoId: string): Promise<ResultadoGravado> {
    const conteudo = esquemaConteudoDoArtefato.safeParse(saida)
    // A versão adaptada só nasce pela Adaptação, com entrega: a geração nunca grava conteúdo com `adaptacao`.
    if (!conteudo.success || (conteudo.data.tipo === 'atividade_objetiva' && conteudo.data.adaptacao !== undefined)) throw new ErroDeIa('IA_SAIDA_INVALIDA')
    exigirCitacoesEntregues(citacoesDoConteudo(conteudo.data), entregues)
    const artefatoId = await new ArtefatoRepository(tx).criar({ turmaId: parametros.turmaId, disciplinaId: parametros.disciplinaId, conteudo: conteudo.data, execucaoId })
    return { tipo: 'artefato', artefatoId, entregaId: null }
  }
}
