import { CodigoDeErro } from '@educa/shared'
import { Logger, type CanActivate, type ExecutionContext } from '@nestjs/common'
import type { Reflector } from '@nestjs/core'
import { definirSessaoNoContexto } from '../contexto/contexto.js'
import { ErroDeDominio, TENTE_DE_NOVO_PADRAO_SEGUNDOS } from '../erro/erro-de-dominio.js'
import { METADADO_ROTA_ANONIMA } from '../limite/rota-anonima.decorator.js'
import { avisoEspacado } from '../log/aviso-espacado.js'
import { avaliarSessao } from './avaliar-sessao.js'
import type { LinhaDaSessao } from './sessao.repository.js'
import { tokenDaRequisicao } from './token-da-requisicao.js'
import type { TokenVerificado } from './verificar-token.js'

/** A leitura que a guarda faz. É a do `SessaoRepository`; o teste conta as chamadas. */
export interface LeituraDeSessao {
  lerParaGuarda(token: TokenVerificado): Promise<LinhaDaSessao | undefined>
}

/**
 * Terceira guarda global da API, depois da autenticação e do limite (Tech Spec, seção 1): o token já foi verificado
 * e a requisição já foi contada no limite do usuário e da escola, então JWT inválido e rajada acima do limite nunca
 * chegam ao Postgres (regra 80, item 1).
 *
 * Lê a sessão do token numa consulta, sem cache, e só com ela válida grava no contexto a escola, o usuário, o papel,
 * a sessão e o ano letivo em curso. Encerrar a sessão ou desativar o usuário corta o acesso na requisição seguinte
 * (RF5).
 *
 * Com o Postgres com erro ou fora do prazo, responde 503 `INDISPONIVEL_TENTE_DE_NOVO` com `Retry-After`, nunca 401:
 * a queda do banco não desloga a escola inteira, e a web tenta de novo com o token e o formulário que já tem.
 */
export class GuardaDeSessao implements CanActivate {
  readonly #logger = new Logger('sessao')
  #avisoLiberado = false
  // Com o Postgres fora, toda requisição falharia aqui: uma linha a cada 30 s diz o mesmo, e o 503 de cada uma já
  // vai para o log pelo filtro de erro.
  readonly #liberarAviso = avisoEspacado(() => {
    this.#avisoLiberado = true
  })

  constructor(
    private readonly reflector: Reflector,
    private readonly leitura: LeituraDeSessao,
  ) {}

  async canActivate(execucao: ExecutionContext): Promise<boolean> {
    const anonima = this.reflector.getAllAndOverride<boolean | undefined>(METADADO_ROTA_ANONIMA, [execucao.getHandler(), execucao.getClass()])
    if (anonima === true) return true
    if (execucao.getType() !== 'http') throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)

    // Sem token verificado nesta requisição (guarda fora de ordem), falha fechada.
    const token = tokenDaRequisicao(execucao.switchToHttp().getRequest<object>())
    if (token === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)

    let linha: LinhaDaSessao | undefined
    try {
      linha = await this.leitura.lerParaGuarda(token)
    } catch (erro) {
      // O logger do Nest leva só o resumo do erro, sem a mensagem nem a consulta (regra 20, item 9).
      this.#liberarAviso()
      if (this.#avisoLiberado) {
        this.#avisoLiberado = false
        if (erro instanceof Error) this.#logger.warn(erro)
        else this.#logger.warn('sessao.leitura_indisponivel')
      }
      throw new ErroDeDominio(CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO, undefined, TENTE_DE_NOVO_PADRAO_SEGUNDOS)
    }
    const sessao = avaliarSessao(token, linha)
    if (sessao === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
    definirSessaoNoContexto(sessao)
    return true
  }
}
