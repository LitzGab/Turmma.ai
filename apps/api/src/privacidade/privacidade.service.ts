import { RetencaoDaEscolaRepository, SuboperadorDaEscolaRepository, type Banco } from '@educa/nucleo'
import { CATEGORIAS_DE_RETENCAO, CHAVES_DE_PRAZO_FIXO, esquemaRespostaRetencao, esquemaRespostaSuboperadores, PRAZOS_FIXOS, retencaoDaEscola, type RespostaRetencao, type RespostaSuboperadores } from '@educa/shared'

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
}
