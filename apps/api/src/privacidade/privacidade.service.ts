import {
  Compartilhamento,
  ErroDeDominio,
  IncidenteDaEscolaRepository,
  RegistroDeAuditoria,
  RetencaoDaEscolaRepository,
  SuboperadorDaEscolaRepository,
  diaDeUso,
  identidadeDaRequisicao,
  type Banco,
} from '@educa/nucleo'
import {
  CATEGORIAS_DE_RETENCAO,
  CHAVES_DE_PRAZO_FIXO,
  CodigoDeErro,
  esquemaPedidoDoTitular,
  esquemaRespostaBuscaDeTitulares,
  esquemaRespostaIncidentes,
  esquemaRespostaPedidos,
  esquemaRespostaPreviaDoTitular,
  esquemaRespostaRetencao,
  esquemaRespostaSuboperadores,
  FINALIDADE_DO_ATENDIMENTO_DO_TITULAR,
  FINALIDADE_DO_REGISTRO_DE_INCIDENTE,
  PRAZOS_FIXOS,
  retencaoDaEscola,
  TEXTO_DO_PRAZO_LEGAL_DO_INCIDENTE,
  type ItemDoPedido,
  type ConsultaPaginada,
  type PedidoDoTitular,
  type RegistroDePedido,
  type RespostaBuscaDeTitulares,
  type RespostaIncidentes,
  type RespostaPedidos,
  type RespostaPreviaDoTitular,
  type RespostaRetencao,
  type RespostaSuboperadores,
} from '@educa/shared'
import { PedidosRepository, type PedidoAchado } from './pedidos.repository.js'
import { TitularesRepository, type TitularAchadoNoBanco, type TitularParaOPedido } from './titulares.repository.js'

const registro = new RegistroDeAuditoria()

/** O erro do pedido que não está no estado que a ação pede: tipado, sem dizer o estado de quem (F3, RF16). */
const pedidoEmEstadoInvalido = (): ErroDeDominio => new ErroDeDominio(CodigoDeErro.PEDIDO_EM_ESTADO_INVALIDO)

/**
 * A privacidade da escola, para a coordenação (F3, RF3 e RF10 a RF13b). A retenção é o catálogo em código com os
 * ajustes da escola do token (`RetencaoDaEscolaRepository`), já com as travas: o prazo que o expurgo aplica. A busca,
 * a prévia e os pedidos do titular são lidos e gravados pelos repositórios daqui, com a escola do contexto, e cada
 * leitura de pessoa vai para a auditoria **na mesma transação**, com a finalidade fixa (regra 20, item 10).
 *
 * A resposta é montada campo a campo e conferida pelo schema estrito do contrato. O nome do titular só aparece
 * enquanto ele é `usuario` da escola; depois da eliminação, a lista e o detalhe mostram "Titular eliminado". **O
 * pedido sobre a própria pessoa** (o titular de quem pediu, pelo mesmo `conta_id`) responde como inexistente, em
 * qualquer rota, inclusive na lista: quem atende um pedido nunca é quem o pediu.
 */
export class PrivacidadeService {
  constructor(private readonly banco: Banco) {}

  async retencao(): Promise<RespostaRetencao> {
    const categorias = retencaoDaEscola(await new RetencaoDaEscolaRepository(this.banco).ajustes())
    return esquemaRespostaRetencao.parse({
      categorias: categorias.map(({ categoria, meses, origem, limitadaPor }) => ({
        categoria,
        descricao: CATEGORIAS_DE_RETENCAO[categoria].descricao,
        contaDe: CATEGORIAS_DE_RETENCAO[categoria].contaDe,
        meses,
        origem,
        limitadaPor,
      })),
      prazosFixos: CHAVES_DE_PRAZO_FIXO.map((chave) => ({ chave, descricao: PRAZOS_FIXOS[chave].descricao, prazo: PRAZOS_FIXOS[chave].prazo })),
    })
  }

  /**
   * As empresas que recebem dado da escola do token, vigentes e passadas (F3, RF7), pelo `SuboperadorDaEscolaRepository`. A
   * resposta é montada campo a campo e conferida pelo schema estrito: não leva id, contrato, quem cadastrou nem as outras
   * escolas da lista.
   */
  async suboperadores(): Promise<RespostaSuboperadores> {
    const lidos = await new SuboperadorDaEscolaRepository(this.banco).daEscola()
    return esquemaRespostaSuboperadores.parse({
      suboperadores: lidos.map((lido) => ({
        chave: lido.chave,
        nome: lido.nome,
        finalidade: lido.finalidade,
        pais: lido.pais,
        categorias: lido.categorias,
        vedaTreinamento: lido.vedaTreinamento,
        inicio: lido.inicio.toISOString(),
        fim: lido.fim === null ? null : lido.fim.toISOString(),
      })),
    })
  }

  /**
   * Os incidentes que afetaram a escola do token (F3, RF9), pelo `IncidenteDaEscolaRepository`. A resposta é montada campo a campo
   * e conferida pelo schema estrito: só a seção da escola, com o id dela. Não leva quem registrou, o id do incidente, as outras
   * escolas nem os números delas.
   */
  async incidentes(): Promise<RespostaIncidentes> {
    const lidos = await new IncidenteDaEscolaRepository(this.banco).daEscola()
    return esquemaRespostaIncidentes.parse({
      incidentes: lidos.map((lido) => ({
        id: lido.id,
        conhecidoEm: lido.conhecidoEm.toISOString(),
        circunstancias: lido.circunstancias,
        categorias: lido.categorias,
        titularesEstimados: lido.titularesEstimados,
        risco: lido.risco,
        contencao: lido.contencao,
        correcao: lido.correcao,
        avisadoEm: lido.avisadoEm.toISOString(),
        confirmadoEm: lido.confirmadoEm === null ? null : lido.confirmadoEm.toISOString(),
      })),
      prazoLegal: TEXTO_DO_PRAZO_LEGAL_DO_INCIDENTE,
    })
  }

  /**
   * Confirma o recebimento do aviso e grava `incidente.confirmado`, na mesma transação, **só se esta chamada confirmou**: o `update
   * … where confirmado_em is null` decide a corrida no banco, a primeira fica, e a segunda (clique duplo, duas coordenações) acha a
   * seção já confirmada e responde igual, sem erro e sem segunda linha na auditoria. A seção de outra escola e a inexistente são
   * `NAO_ENCONTRADO`.
   */
  async confirmarIncidente(id: string): Promise<void> {
    await this.banco.transaction(async (tx) => {
      const incidentes = new IncidenteDaEscolaRepository(tx)
      if (await incidentes.confirmar(id)) {
        await registro.gravar(tx, 'incidente.confirmado', { entidadeId: id, finalidade: FINALIDADE_DO_REGISTRO_DE_INCIDENTE })
        return
      }
      if (!(await incidentes.existe(id))) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    })
  }

  /**
   * `POST /v1/privacidade/titulares/busca` (F3, RF10): até 20 titulares cujo nome casa com o termo, com matrícula,
   * turmas e disciplinas, para a coordenação escolher a pessoa certa entre homônimos. A leitura é auditada com os ids
   * na mesma transação (`titular.buscado`), e **o termo nunca vai a log nem à auditoria**: é nome de pessoa (RF17).
   */
  async buscaDeTitulares(termo: string): Promise<RespostaBuscaDeTitulares> {
    return this.banco.transaction(async (tx) => {
      const achados = await new TitularesRepository(tx).buscar(termo)
      await registro.gravar(tx, 'titular.buscado', { entidadeId: this.#escola(), depois: { ids: achados.map(({ id }) => id) }, finalidade: FINALIDADE_DO_ATENDIMENTO_DO_TITULAR })
      return esquemaRespostaBuscaDeTitulares.parse({ titulares: achados })
    })
  }

  /**
   * `GET /v1/privacidade/titulares/:id/previa` (F3, RF10 e RF11; D64): o que a escola guarda do titular, antes de o
   * pedido existir. O aluno traz a contagem por categoria; o professor, **só as categorias de cadastro e vínculo, sem
   * contagem e sem período**, e a resposta é igual para quem usou e para quem não usou a IA. `homonimo` é a mesma
   * regra da troca de nome. Auditada como `titular.previa_lida`; o titular de outra escola, o de quem pediu e o
   * inexistente respondem igual.
   */
  async previaDoTitular(titularId: string): Promise<RespostaPreviaDoTitular> {
    return this.banco.transaction(async (tx) => {
      const titulares = new TitularesRepository(tx)
      const titular = await this.#titularAlvo(titulares, titularId)
      await registro.gravar(tx, 'titular.previa_lida', { entidadeId: titular.id, finalidade: FINALIDADE_DO_ATENDIMENTO_DO_TITULAR })
      const base = { id: titular.id, nome: titular.nome, homonimo: await titulares.homonimo(titular.id, titular.nome.trim().toLowerCase()) }
      if (titular.papel === 'professor') {
        return esquemaRespostaPreviaDoTitular.parse({ ...base, papel: 'professor', categorias: [...titulares.categoriasDoProfessor()] })
      }
      const contagens = await titulares.contagemPorCategoria(titular.id)
      return esquemaRespostaPreviaDoTitular.parse({ ...base, papel: 'aluno', categorias: contagens.map(({ categoria, quantidade }) => ({ categoria, quantidade })) })
    })
  }

  /**
   * `POST /v1/privacidade/pedidos` (F3, RF10): registra o pedido `recebido`, com a foto do compartilhamento calculada
   * no momento do registro (F3, tarefa 12.0) e o `homonimo`. **A chave de envio decide primeiro**: a mesma chave, com o
   * mesmo conteúdo e da mesma coordenação, devolve sempre o mesmo pedido, mesmo em paralelo; com outro titular, tipo,
   * solicitante ou chegada, ou de outra coordenação, responde `NAO_ENCONTRADO` sem gravar. Só quem gravou registra
   * `pedido.registrado`, na mesma transação. A chegada no futuro é recusada com
   * `ENTRADA_INVALIDA` antes de qualquer escrita, **pelo dia de São Paulo (`diaDeUso`)**; o check do banco, pelo
   * `current_date` da sessão, é só a segunda camada e mais frouxa.
   */
  async registrarPedido(pedido: RegistroDePedido): Promise<PedidoDoTitular> {
    if (pedido.chegouEm > diaDeUso(new Date())) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    return this.banco.transaction(async (tx) => {
      const titulares = new TitularesRepository(tx)
      const titular = await this.#titularAlvo(titulares, pedido.titularId)
      const homonimo = await titulares.homonimo(titular.id, titular.nome.trim().toLowerCase())
      const pedidos = new PedidosRepository(tx)
      const compartilhamento = await new Compartilhamento(tx).doTitular({ titularId: titular.id, papel: titular.papel })
      const id = await pedidos.registrar({ ...pedido, papelTitular: titular.papel, homonimo, compartilhamento })
      if (id !== undefined) {
        await registro.gravar(tx, 'pedido.registrado', {
          entidadeId: id,
          depois: { titularId: titular.id, papelTitular: titular.papel, tipo: pedido.tipo, solicitante: pedido.solicitante, chegouEm: pedido.chegouEm },
        })
      }
      const lido = id === undefined ? await pedidos.daChave(pedido.chaveEnvio) : await pedidos.de(id)
      if (lido === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      // A chave que colide só devolve o pedido que é este mesmo: outro titular, tipo, solicitante ou chegada responde
      // como inexistente, e nada é gravado nem auditado (a transação não escreveu nada quando a chave já existia).
      if (id === undefined && (lido.titularId !== pedido.titularId || lido.tipo !== pedido.tipo || lido.solicitante !== pedido.solicitante || lido.chegouEm !== pedido.chegouEm)) {
        throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      }
      return this.#montarPedido(lido, await titulares.titularesParaOPedido([lido.titularId]))
    })
  }

  /**
   * `GET /v1/privacidade/pedidos` (F3, RF16): a página de pedidos da escola, com nome e turma enquanto o titular
   * existe. A lista audita `pedidos.listados` com os ids da página, na mesma transação da leitura; o pedido sobre a
   * própria pessoa não entra.
   */
  async pedidos(consulta: ConsultaPaginada): Promise<RespostaPedidos> {
    return this.banco.transaction(async (tx) => {
      const titulares = new TitularesRepository(tx)
      const { usuarioId } = identidadeDaRequisicao()
      const pedidos = await new PedidosRepository(tx).listar(consulta.pagina, consulta.limite, { usuarioId, contaId: await titulares.contaDeQuemPediu() })
      const daPágina = pedidos.slice(0, consulta.limite)
      await registro.gravar(tx, 'pedidos.listados', { entidadeId: this.#escola(), depois: { ids: daPágina.map(({ id }) => id) }, finalidade: FINALIDADE_DO_ATENDIMENTO_DO_TITULAR })
      const nomes = await titulares.titularesParaOPedido(daPágina.map(({ titularId }) => titularId))
      const itens: ItemDoPedido[] = daPágina.map((pedido) => {
        const { id, tipo, solicitante, chegouEm, estado } = this.#montarPedido(pedido, nomes)
        return { id, tipo, solicitante, chegouEm, estado, titular: this.#titularDe(pedido, nomes) }
      })
      return esquemaRespostaPedidos.parse({ itens, ...(pedidos.length > consulta.limite ? { proxima: daPágina.at(-1)?.id } : {}) })
    })
  }

  /** `GET /v1/privacidade/pedidos/:id` (F3, RF16): o detalhe, com a foto do compartilhamento, `nomeTrocado` e `homonimo`. Auditado como `pedido.lido`. */
  async pedido(id: string): Promise<PedidoDoTitular> {
    return this.banco.transaction(async (tx) => {
      const titulares = new TitularesRepository(tx)
      const pedidos = new PedidosRepository(tx)
      const pedido = await this.#pedidoAlvo(pedidos, titulares, id)
      await registro.gravar(tx, 'pedido.lido', { entidadeId: pedido.id, finalidade: FINALIDADE_DO_ATENDIMENTO_DO_TITULAR })
      return this.#montarPedido(pedido, await titulares.titularesParaOPedido([pedido.titularId]))
    })
  }

  /**
   * `POST /v1/privacidade/pedidos/:id/concluir` (F3, RF16): o atendimento do pedido de acesso, portabilidade,
   * compartilhamento ou correção terminou. A eliminação não conclui por aqui, e o pedido fechado responde
   * `PEDIDO_EM_ESTADO_INVALIDO`. O clique duplo decide no banco: a segunda chamada não conclui de novo nem audita.
   */
  async concluirPedido(id: string): Promise<void> {
    await this.banco.transaction(async (tx) => {
      const pedidos = new PedidosRepository(tx)
      const pedido = await this.#pedidoAlvo(pedidos, new TitularesRepository(tx), id)
      if (!(await pedidos.concluir(pedido.id))) throw pedidoEmEstadoInvalido()
      await registro.gravar(tx, 'pedido.concluido', { entidadeId: pedido.id, antes: { estado: pedido.estado }, depois: { estado: 'concluido' } })
    })
  }

  /**
   * `POST /v1/privacidade/pedidos/:id/corrigir-nome` (F3, RF13b): o nome novo do titular, só em pedido de correção
   * `recebido` ou `pronto`. Muda o `usuario` da escola e audita `pedido.nome_corrigido` **sem o nome**; o de outra
   * escola da mesma conta não muda. Fora daí, `PEDIDO_EM_ESTADO_INVALIDO`: o tipo e o estado são decididos no `where`
   * do `update`, que não muda o nome de um pedido que deixou de ser corrigível entre a leitura e a escrita.
   */
  async corrigirNomeDoPedido(id: string, nome: string): Promise<void> {
    await this.banco.transaction(async (tx) => {
      const pedidos = new PedidosRepository(tx)
      const pedido = await this.#pedidoAlvo(pedidos, new TitularesRepository(tx), id)
      if (!(await pedidos.corrigirNome(pedido.id, nome))) throw pedidoEmEstadoInvalido()
      await registro.gravar(tx, 'pedido.nome_corrigido', { entidadeId: pedido.id })
    })
  }

  /** O titular do pedido, ou `NAO_ENCONTRADO` como o inexistente: outra escola, o de quem pediu e o id de ninguém. */
  async #titularAlvo(titulares: TitularesRepository, titularId: string): Promise<TitularAchadoNoBanco> {
    const titular = await titulares.paraOPedido(titularId)
    if (titular === undefined || (await this.#ehDeQuemPediu(titulares, titular))) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    return titular
  }

  /** O pedido do id, ou `NAO_ENCONTRADO` como o inexistente: outra escola, o sobre quem pediu e o id de ninguém. */
  async #pedidoAlvo(pedidos: PedidosRepository, titulares: TitularesRepository, id: string): Promise<PedidoAchado> {
    const pedido = await pedidos.de(id)
    if (pedido === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    const { usuarioId } = identidadeDaRequisicao()
    const contaDeQuemPediu = await titulares.contaDeQuemPediu()
    if (pedido.titularId === usuarioId || (pedido.contaDoTitular !== null && pedido.contaDoTitular === contaDeQuemPediu)) {
      throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    }
    return pedido
  }

  /** O pedido sobre a própria pessoa, pelo mesmo `conta_id` (ou pelo próprio id): quem atende não atende a si. */
  async #ehDeQuemPediu(titulares: TitularesRepository, titular: TitularAchadoNoBanco): Promise<boolean> {
    const { usuarioId } = identidadeDaRequisicao()
    if (titular.id === usuarioId) return true
    return titular.contaId !== null && titular.contaId === (await titulares.contaDeQuemPediu())
  }

  #escola(): string {
    return identidadeDaRequisicao().escolaId
  }

  #titularDe(pedido: PedidoAchado, titulares: ReadonlyMap<string, TitularParaOPedido>): PedidoDoTitular['titular'] {
    return titulares.get(pedido.titularId) ?? null
  }

  /** O pedido como a coordenação o lê: sem nome de quem registrou, sem matrícula e sem texto. */
  #montarPedido(pedido: PedidoAchado, titulares: ReadonlyMap<string, TitularParaOPedido>): PedidoDoTitular {
    return esquemaPedidoDoTitular.parse({
      id: pedido.id,
      tipo: pedido.tipo,
      solicitante: pedido.solicitante,
      chegouEm: pedido.chegouEm,
      estado: pedido.estado,
      titular: this.#titularDe(pedido, titulares),
      homonimo: pedido.homonimo,
      nomeTrocado: pedido.nomeTrocado,
      compartilhamento: pedido.compartilhamento,
      concluidoEm: pedido.concluidoEm?.toISOString() ?? null,
    })
  }
}
