import { ErroDeDominio, IncidenteDaEscolaRepository, RegistroDeAuditoria, RetencaoDaEscolaRepository, SuboperadorDaEscolaRepository, type Banco } from '@educa/nucleo'
import {
  CATEGORIAS_DE_RETENCAO,
  CHAVES_DE_PRAZO_FIXO,
  CodigoDeErro,
  esquemaRespostaIncidentes,
  esquemaRespostaRetencao,
  esquemaRespostaSuboperadores,
  FINALIDADE_DO_REGISTRO_DE_INCIDENTE,
  PRAZOS_FIXOS,
  retencaoDaEscola,
  TEXTO_DO_PRAZO_LEGAL_DO_INCIDENTE,
  type RespostaIncidentes,
  type RespostaRetencao,
  type RespostaSuboperadores,
} from '@educa/shared'

const registro = new RegistroDeAuditoria()

/**
 * A privacidade da escola, para a coordenação (F3, RF3). A retenção é o catálogo em código com os ajustes da escola do
 * token (`RetencaoDaEscolaRepository`), já com as travas: o prazo que o expurgo aplica. A resposta é montada campo a
 * campo e conferida pelo schema estrito do contrato: não leva quem ajustou nem o número do contrato, que são da
 * operação.
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
}
