import { ErroDeDominio, RegistroDeAuditoria, type Banco, type TransacaoBanco } from '@educa/nucleo'
import {
  CodigoDeErro,
  esquemaRespostaAnoLetivo,
  esquemaRespostaListaDeAnosLetivos,
  type AnoLetivo,
  type ConsultaPaginada,
  type PedidoCriarAnoLetivo,
  type RespostaAnoLetivo,
  type RespostaListaDeAnosLetivos,
  type SituacaoDoAnoLetivo,
} from '@educa/shared'
import { AnoLetivoRepository } from './ano-letivo.repository.js'
import { paginar } from './entrada.js'
import { VinculoRepository } from './vinculo.repository.js'

const registro = new RegistroDeAuditoria()

/**
 * A coordenação cria, abre e encerra o ano letivo da escola (RF2; Tech Spec, seção 4). Não depende de haver ano em
 * curso: é assim que a escola começa do zero sem ficar travada (seção 5, "Requisição").
 *
 * - Criar: nasce `planejado`. O mesmo ano duas vezes na escola dá `CONFLITO` (`ano_letivo_escola_ano_unico`).
 * - Abrir: `planejado` → `em_curso`. Com outro ano em curso na escola, `CONFLITO`, pelo índice único parcial. Abrir de
 *   novo o que já está em curso responde o ano como está (o segundo clique); encerrado não reabre.
 * - Encerrar: `em_curso` → `encerrado`, com a virada na mesma transação (10.0): os vínculos do ano vão a `encerrado`
 *   por `fim_do_ano`, o `complemento` das contestações é apagado, e a auditoria leva as contagens. Qualquer falha no
 *   meio desfaz tudo, e o ano continua em curso. Encerrar de novo responde o ano como está, sem virada nem auditoria;
 *   planejado nunca aberto não se encerra. O cache de sessão por escola da Tech Spec (seção 13) não existe: quando a
 *   16.0 o criar, é aqui que a versão avança.
 * - Id de outra escola, inexistente ou fora do formato: `NAO_ENCONTRADO`, igual (regra 10, item 6).
 */
export class AnoLetivoService {
  constructor(private readonly banco: Banco) {}

  async criar(pedido: PedidoCriarAnoLetivo): Promise<RespostaAnoLetivo> {
    return esquemaRespostaAnoLetivo.parse(await new AnoLetivoRepository(this.banco).criar(pedido))
  }

  async listar(consulta: ConsultaPaginada): Promise<RespostaListaDeAnosLetivos> {
    const linhas = await new AnoLetivoRepository(this.banco).listar(consulta)
    return esquemaRespostaListaDeAnosLetivos.parse(paginar(linhas, consulta.limite))
  }

  abrir(id: string): Promise<RespostaAnoLetivo> {
    return this.#transitar(this.banco, id, 'planejado', 'em_curso')
  }

  encerrar(id: string): Promise<RespostaAnoLetivo> {
    return this.banco.transaction((tx) =>
      this.#transitar(tx, id, 'em_curso', 'encerrado', async (ano) => {
        const contagens = await new VinculoRepository(tx).virarAno(ano.id)
        await registro.gravar(tx, 'ano_letivo.encerrado', { entidadeId: ano.id, antes: { situacao: 'em_curso' }, depois: { situacao: 'encerrado', ...contagens } })
      }),
    )
  }

  /**
   * A transição condicional e, só quando ela aconteceu nesta chamada, o que vem junto na mesma transação. O segundo
   * clique relê o ano já mudado e responde como está, sem repetir o efeito.
   */
  async #transitar(
    executor: Banco | TransacaoBanco,
    id: string,
    de: SituacaoDoAnoLetivo,
    para: SituacaoDoAnoLetivo,
    efeito?: (ano: AnoLetivo) => Promise<void>,
  ): Promise<RespostaAnoLetivo> {
    const repositorio = new AnoLetivoRepository(executor)
    const mudado = await repositorio.mudarSituacao(id, de, para)
    if (mudado !== undefined) {
      await efeito?.(mudado)
      return esquemaRespostaAnoLetivo.parse(mudado)
    }
    const atual = await repositorio.porId(id)
    if (atual === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
    if (atual.situacao === para) return esquemaRespostaAnoLetivo.parse(atual)
    throw new ErroDeDominio(CodigoDeErro.CONFLITO)
  }
}
