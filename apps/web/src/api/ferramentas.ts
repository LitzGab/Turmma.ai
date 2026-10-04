import { esquemaRespostaExecucaoAceita, type FerramentaGeradora, type PedidoGerarComFerramenta, type RespostaExecucaoAceita } from '@educa/shared'
import { chamarComSessao } from './sessao'

/**
 * `POST /v1/ferramentas/:ferramenta/gerar`: o mesmo caso de uso para o formulário de Ferramentas e para o cartão dentro
 * da conversa (D18). Responde 202 com a execução, e o resultado dela traz o artefato.
 */
export function gerarComFerramenta(ferramenta: FerramentaGeradora, pedido: PedidoGerarComFerramenta): Promise<RespostaExecucaoAceita> {
  return chamarComSessao(`/v1/ferramentas/${encodeURIComponent(ferramenta)}/gerar`, esquemaRespostaExecucaoAceita, { metodo: 'POST', corpo: pedido })
}
